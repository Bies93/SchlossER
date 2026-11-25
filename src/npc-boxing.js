const REACH=1.13, WINDUP=.31, IMPACT=.12, RECOVER=.39;
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const offsets=[0,.55,-.55,1.04,-1.04,1.53,-1.53,2.09,-2.09,Math.PI];

// Simulated NPC melee only: one contact frame per punch, with a fresh reach
// and visibility check instead of locking in damage when the windup starts.
export function boxingClock(){
  let t=0,mode='guard',side=1;
  return {get side(){return side;},get mode(){return mode;},get phase(){return t;},
    start(){if(mode==='guard'){mode='swing';t=0;side=-side;}},
    cancel(){if(mode==='swing'){mode='recover';t=0;}},
    tick(dt,hit){
      const prev=t;t+=dt;
      if(mode==='swing'){
        if(prev<WINDUP&&t>=WINDUP)hit();
        if(t>=WINDUP+IMPACT){mode='recover';t=0;}
      }else if(mode==='recover'&&t>=RECOVER){mode='guard';t=0;}
    },
    extension(){
      if(mode==='swing'){
        if(t<WINDUP){
          const strike=clamp((t-.218)/(WINDUP-.218),0,1);
          return -.29*Math.sin(t/WINDUP*Math.PI*.5)*(1-strike)+strike*strike*(3-2*strike);
        }
        return 1-.18*clamp((t-WINDUP)/IMPACT,0,1);
      }
      return mode==='recover'?.82*Math.max(0,1-t/.21)**2:0;
    }};
}

export function npcBoxing(T,{context,query,worldAt,floorAt,ready,damage,sound}){
  const active=new Map(),ray=new T.Ray(),origin=new T.Vector3(),dir=new T.Vector3();
  const step={x:0,y:0,z:0};
  const finish=(n,s,restore=true)=>{
    if(restore&&n.alive){
      n.actor.position.copy(s.home);n.actor.rotation.y=s.yaw;
      n.rig.resetBoxPose();
      if(n.shadow&&s.shadow){n.shadow.position.copy(s.shadow);n.shadow.rotation.y=s.shadowYaw;}
    }
    n.hostile=false;active.delete(n);
  };
  function provoke(n){
    if(!n.alive||n.questBusy)return false;
    const prev=active.get(n);
    if(prev){prev.lost=0;prev.returning=false;return false;}
    const {actor}=n,resume=n.interruptRoutine?.(),layer=31-Math.clz32(actor.layers.mask&-actor.layers.mask);
    const p=actor.position;
    active.set(n,{home:resume?.position??p.clone(),yaw:resume?.yaw??actor.rotation.y,shadow:resume?.shadow??n.shadow?.position.clone(),
      shadowYaw:n.shadow?.rotation.y,layer,clock:boxingClock(),t:0,distance:0,lost:0,
      floor:floorAt(p.x,p.z,p.y),blocked:0,focus:0,pace:0,speed:0,returning:false});
    n.hostile=true;
    return true;
  }
  function clear(n,s,body,range){
    if(context().layer!==s.layer||!query.seen(n.actor))return false;
    const p=n.actor.position;
    if(Math.abs(body.y-p.y)>.87||Math.hypot(body.x-p.x,body.z-p.z)>range)return false;
    n.chest.getWorldPosition(origin);
    dir.set(body.x,body.y+(body.eyeHeight??1.67)*.72,body.z).sub(origin);
    const length=dir.length();
    return length>.13&&query.trace(ray.set(origin,dir.multiplyScalar(1/length)),length-.12,1<<s.layer,.045,true)===Infinity;
  }
  function move(n,s,yaw,amount){
    const p=n.actor.position,area=worldAt(p),min=Math.min(.006,amount*.42);
    if(amount<.0005)return 0;
    for(const offset of offsets){
      const h=yaw+offset;
      Object.assign(step,{x:p.x,y:s.floor+.065,z:p.z,feet:s.floor});
      area.move(step,Math.sin(h)*amount,Math.cos(h)*amount);
      const travel=Math.hypot(step.x-p.x,step.z-p.z);
      if(travel<min||travel>amount+.24||worldAt(step)!==area)continue;
      let occupied=false;
      for(const other of active.keys())if(other!==n&&other.alive&&Math.abs(other.actor.position.y-step.y)<.72&&
          Math.hypot(other.actor.position.x-step.x,other.actor.position.z-step.z)<.47){occupied=true;break;}
      if(occupied)continue;
      const y=floorAt(step.x,step.z,s.floor+.065);
      if(!Number.isFinite(y)||Math.abs(y-s.floor)>.21)continue;
      p.set(step.x,n.rig.groundedY(y),step.z);s.floor=y;s.distance+=travel;return travel;
    }
    return 0;
  }
  function update(dt,body){
    let changed=false;
    if(!dt||!active.size||!ready())return changed;
    for(const [n,s] of active){
      if(!n.alive){finish(n,s,false);continue;}
      if(n.questBusy){finish(n,s,false);continue;}
      const p=n.actor.position,clock=s.clock,same=context().layer===s.layer,visible=query.seen(n.actor);
      const distance=Math.hypot(body.x-p.x,body.z-p.z),fromHome=Math.hypot(p.x-s.home.x,p.z-s.home.z);
      const engage=same&&distance<17&&fromHome<14&&Math.abs(p.y-body.y)<1.08;
      s.lost=engage&&clear(n,s,body,17)?0:s.lost+dt;
      if(!engage||s.lost>4.7)s.returning=true;
      if(s.returning&&(fromHome<.18||!same||!visible&&distance>7||s.blocked>1.9&&distance>7)){
        finish(n,s);changed=true;continue;
      }
      if(n.rig.isReacting()){clock.cancel();clock.tick(dt,()=>{});continue;}
      s.t+=dt;
      const dst=s.returning?s.home:body,yaw=Math.atan2(dst.x-p.x,dst.z-p.z);
      const turn=angle(yaw-n.actor.rotation.y);
      n.actor.rotation.y+=turn*(1-Math.exp(-dt*(s.pace>.50?7.4:10.2)));
      const hitRange=REACH+(body.eyeHeight<1.15?.03:0);
      const canHit=!s.returning&&ready()&&Math.abs(turn)<.59&&clear(n,s,body,hitRange);
      let travel=0;
      const mayMove=s.t>.24&&clock.mode==='guard'&&!canHit&&(s.returning||distance>.82);
      const wanted=mayMove?(s.returning?1.33:2.37)*(.73+.27*Math.max(0,Math.cos(turn))):0;
      s.speed+=(wanted-s.speed)*(1-Math.exp(-dt*(wanted>s.speed?6.5:11)));
      if(s.t>.24&&clock.mode==='guard'){
        if(canHit){clock.start();sound('swing',p);}
        else if(mayMove){
          const need=s.returning?fromHome:Math.max(0,distance-.79);
          travel=move(n,s,yaw,Math.min(need,dt*s.speed));
          s.blocked=travel?0:s.blocked+dt;
        }
      }
      if(s.returning)clock.cancel();
      clock.tick(dt,()=>{
        if(!ready()||Math.abs(angle(Math.atan2(body.x-p.x,body.z-p.z)-n.actor.rotation.y))>.53||
            !clear(n,s,body,hitRange))return;
        damage(clock.side>0?14:12,p);
      });
      s.pace+=(clamp(travel/Math.max(.001,dt*2.23),0,1)-s.pace)*(1-Math.exp(-dt*13));
      const close=clamp((1.53-distance)/.46,0,1);
      const guard=s.returning?0:clock.mode!=='guard'?1:close*(1-.67*s.pace);
      s.focus+=(guard-s.focus)*(1-Math.exp(-dt*(guard>s.focus?12:8)));
      n.rig.boxPose(s.t,s.distance,s.pace,s.focus,clock.side,clock.extension());
      if(n.shadow){
        n.shadow.position.set(p.x,s.floor+.01,p.z);n.shadow.rotation.y=n.actor.rotation.y;
      }
      changed ||= visible;
    }
    return changed;
  }
  return {provoke,update,
    drop(n){const s=active.get(n);if(s)finish(n,s,false);},
    reset(){for(const [n,s] of active)finish(n,s);}};
}
