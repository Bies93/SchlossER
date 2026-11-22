const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v));
const smooth=x=>{const k=clamp(x);return k*k*(3-2*k);};

export function counterfireState(){
  let t=0,drawEnd=0,ready=0,nextSight=0,lastSeen=0,rounds=5,reloadEnd=0,
    fired=-Infinity,holsterAt=0,visible=false,mode='idle';
  const stop=()=>{mode='idle';visible=false;fired=-Infinity;};
  return {get active(){return mode!=='idle';},get mode(){return mode;},
    provoke(){
      if(mode!=='idle'&&mode!=='holster')return false;
      mode='draw';visible=false;
      drawEnd=t+.49;ready=drawEnd+.26;nextSight=t;lastSeen=t;return true;
    },stop,
    tick(dt,observe,canAct,fire){
      if(mode==='idle')return null;
      t+=dt;
      if(t>=nextSight||mode==='holster'){
        const inSight=observe();
        if(inSight){lastSeen=t;if(!visible)ready=Math.max(ready,t+.26);}
        visible=inSight;nextSight=t+.115;
      }
      if(mode==='holster'){
        if(visible){mode='aim';ready=t+.30;}
        else if(t-holsterAt>=.39){stop();return null;}
      }else if(!visible&&t-lastSeen>4.6){mode='holster';holsterAt=t;}
      if(mode==='draw'&&t>=drawEnd)mode=visible?'aim':'search';
      if(mode==='aim'&&!visible)mode='search';
      if(mode==='search'&&visible)mode='aim';
      if(mode==='reload'&&t>=reloadEnd){
        rounds=5;mode=visible?'aim':'search';ready=t+.25;
      }
      if(mode==='aim'&&canAct&&t>=ready){
        if(!rounds){mode='reload';reloadEnd=t+1.12;}
        else if(fire()){
          rounds--;fired=t;ready=t+(rounds%2?.82:1.04);
        }else{ready=t+.26;nextSight=t;visible=false;mode='search';}
      }
      const draw=mode==='draw'?smooth(1-(drawEnd-t)/.49):mode==='holster'?1-smooth((t-holsterAt)/.39):1;
      const aim=mode==='aim'?1:mode==='draw'?draw*.63:mode==='search'?.48:mode==='holster'?draw*.42:.18;
      const reload=mode==='reload'?clamp(1-(reloadEnd-t)/1.12):0;
      return {t,draw,aim,age:t-fired,reload,mode};
    }
  };
}

// Niklas is the only actor wired to this prototype. Both observation and
// damage are bounded to the existing game layers and geometry queries.
export function niklasDefense(T,scene,rig,device,spec,{query,camera,context,damage,sound,contact,action,ready,onReset}){
  const {actor,npcInfo}=rig,logic=counterfireState(),V=()=>new T.Vector3();
  const pistol=rig.counterMount;
  pistol.add(device.root);
  const emit=V().fromArray(spec.emit),muzzle=V(),point=V(),last=V().copy(actor.position),p=V(),forward=V();
  const ray=new T.Ray(),aim=V(),origin=V(),diff=V(),axis=V().set(0,0,1),eye=V(),right=V();
  const fx=new T.Group(),flare=new T.Mesh(new T.IcosahedronGeometry(1,0),
    new T.MeshBasicMaterial({color:0xffc77d,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const streak=new T.Mesh(new T.PlaneGeometry(1,1),
    new T.MeshBasicMaterial({color:0xffa864,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false}));
  fx.add(streak,flare);fx.userData.noSceneQuery=true;scene.add(fx);fx.visible=false;
  let pulse=0,serial=0,mark='idle',reloadCue=false,arm=0,stale=0;
  const sample={material:'surface'};
  const targetHeight=body=>body.y+(body.eyeHeight??1.67)*.78;
  const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
  function observe(body){
    if(context().layer!==0||!ready())return false;
    npcInfo.head.getWorldPosition(origin);aim.set(body.x,targetHeight(body),body.z).sub(origin);
    const d=aim.length();
    if(d<.35||d>19)return false;
    const clear=query.trace(ray.set(origin,aim.multiplyScalar(1/d)),d-.17,1,.10,true)===Infinity;
    if(clear)last.set(body.x,targetHeight(body),body.z);
    return clear;
  }
  function tracePlayer(body){
    // Short in-game hitscan. The crouching silhouette uses the actual eye
    // height; a miss continues to the nearest opaque surface or expires.
    const h=body.eyeHeight??1.67,cy=body.y+h*.49+.08,ry=.50*h+.07;
    diff.set((muzzle.x-body.x)/.31,(muzzle.y-cy)/ry,(muzzle.z-body.z)/.31);
    p.set(ray.direction.x/.31,ray.direction.y/ry,ray.direction.z/.31);
    const b=diff.dot(p),a=p.lengthSq(),c=diff.lengthSq()-1,disc=b*b-a*c;
    return c<=0?0:b<0&&disc>=0?c/(-b+Math.sqrt(disc)):Infinity;
  }
  function fire(body){
    if(!observe(body))return false;
    device.root.localToWorld(muzzle.copy(emit));
    aim.copy(last).sub(muzzle);
    let d=aim.length();
    if(d>.36&&query.trace(ray.set(muzzle,aim.multiplyScalar(1/d)),d-.16,1,.015,true)!==Infinity)return false;
    const scatter=[1,.13,-.28,-.89,.18,.39,-.17];
    const i=serial++%scatter.length,slip=scatter[i]*(.19+d*.040);
    right.set(aim.z,0,-aim.x).normalize();
    point.copy(last).addScaledVector(right,slip);point.y+=(i%3-1)*.077+(i===3?.19:0);
    forward.subVectors(point,muzzle).normalize();ray.set(muzzle,forward);
    sample.material='surface';
    const hit=tracePlayer(body),worldHit=query.trace(ray,Math.min(24,hit),1,.015,false,sample);
    const reached=hit!==Infinity&&worldHit===Infinity;
    ray.at(reached?hit:worldHit===Infinity?Math.min(d+2.5,18):worldHit,point);
    flare.position.copy(muzzle);flare.scale.set(.105,.103,.133);flare.quaternion.setFromUnitVectors(axis,forward);
    // Face the narrow streak toward the camera; it is only a two-frame cue.
    const length=Math.min(muzzle.distanceTo(point),4.5);
    camera.getWorldPosition(eye);
    streak.position.copy(muzzle).addScaledVector(forward,length*.5);
    const side=right.subVectors(eye,streak.position).cross(forward).normalize();
    if(side.lengthSq()<.001)side.set(0,1,0);
    const up=diff.crossVectors(forward,side).normalize();
    streak.quaternion.setFromRotationMatrix(matrix.makeBasis(forward,side,up));
    streak.scale.set(length,.012,1);
    pulse=.083;fx.visible=flare.visible=true;flare.material.opacity=.83;streak.material.opacity=.45;
    sound('fire',muzzle);
    if(reached)damage(21,muzzle);
    else if(worldHit!==Infinity)contact(point,'pistol',sample.material);
    return true;
  }
  const matrix=new T.Matrix4();
  const reset=()=>{
    logic.stop();pistol.visible=fx.visible=false;pulse=0;arm=0;stale=0;mark='idle';npcInfo.existing=false;
    if(npcInfo.alive){rig.resetCounterHands();onReset?.();}
  };
  function update(dt,body){
    if(!npcInfo.alive){if(logic.active||fx.visible)reset();return false;}
    const hadPulse=fx.visible;
    if(pulse>0){
      pulse=Math.max(0,pulse-dt);fx.visible=pulse>0;
      flare.visible=pulse>.026;flare.material.opacity=pulse*10;
      streak.material.opacity=pulse*5.4;
    }
    if(!logic.active)return hadPulse;
    const state=logic.tick(dt,()=>observe(body),!rig.isReacting(),()=>fire(body));
    if(!state){reset();return true;}
    const {t,draw,aim:raise,age,reload,mode}=state;
    if(mode==='draw'&&mark!=='draw')action('equip',actor.position);
    if(mode==='reload'&&mark!=='reload'){reloadCue=false;action('mag-out',actor.position);}
    if(mode==='reload'&&reload>.69&&!reloadCue){reloadCue=true;action('mag-in',actor.position);}
    mark=mode;pistol.visible=draw>.30;
    device.animate(age,{reload:mode==='reload'?reload:-1});
    arm+=((raise)-arm)*Math.min(1,dt*8);
    stale=mode==='search'?stale+dt:0;
    if(rig.isReacting())return true;
    const dx=last.x-actor.position.x,dz=last.z-actor.position.z;
    if(Math.hypot(dx,dz)>.25){
      const yaw=Math.atan2(dx,dz)+Math.sin(stale*1.65)*Math.min(.53,stale*.20);
      actor.rotation.y+=angle(yaw-actor.rotation.y)*Math.min(1,dt*(mode==='draw'?5.7:8.1));
    }
    const pitch=clamp(Math.atan2(last.y-actor.position.y-1.40,Math.hypot(dx,dz)),-.64,.57);
    const recoil=age<.24?Math.sin(Math.min(1,age/.24)*Math.PI)**1.27:0;
    rig.counterPose(t,draw,arm,pitch,recoil,reload);
    flare.visible||=pulse>.049;
    return true;
  }
  return {get active(){return logic.active;},update,reset,provoke(){
    if(!npcInfo.alive||!logic.provoke())return false;
    npcInfo.existing=true;mark='idle';
    camera.getWorldPosition(last);last.y-=.22;return true;
  },warmup(){
    pistol.visible=fx.visible=flare.visible=true;fx.position.copy(actor.position);
    flare.scale.setScalar(.03);streak.scale.set(.15,.012,1);
    const list=[];for(const root of [pistol,fx])root.traverse(o=>{if(o.isMesh){list.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    return ()=>{pistol.visible=fx.visible=false;fx.position.set(0,0,0);for(const [o,cull] of list)o.frustumCulled=cull;};
  }};
}
