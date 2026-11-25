import {npcActorLayer,npcWeapon} from './npc-loadouts.js';

const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v));
const smooth=x=>{const k=clamp(x);return k*k*(3-2*k);};

export function counterfireState(kind='pistol'){
  const bow=kind==='bow',capacity=bow?1:5,drawTime=bow?.67:.49,reloadTime=bow?1.65:1.12;
  let t=0,drawEnd=0,ready=0,nextSight=0,lastSeen=0,rounds=capacity,reloadEnd=0,
    fired=-Infinity,holsterAt=0,visible=false,mode='idle';
  const stop=()=>{mode='idle';visible=false;fired=-Infinity;};
  return {get active(){return mode!=='idle';},get mode(){return mode;},
    provoke(){
      if(mode!=='idle'&&mode!=='holster')return false;
      mode='draw';visible=false;
      drawEnd=t+drawTime;ready=drawEnd+(bow?.38:.26);nextSight=t;lastSeen=t;return true;
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
        rounds=capacity;mode=visible?'aim':'search';ready=t+(bow?.46:.25);
      }
      if(mode==='aim'&&canAct&&t>=ready){
        if(!rounds){mode='reload';reloadEnd=t+reloadTime;}
        else if(fire()){
          rounds--;fired=t;ready=t+(rounds%2?.82:1.04);
          if(bow){mode='reload';reloadEnd=t+reloadTime;}
        }else{ready=t+.26;nextSight=t;visible=false;mode='search';}
      }
      const draw=mode==='draw'?smooth(1-(drawEnd-t)/drawTime):mode==='holster'?1-smooth((t-holsterAt)/.39):1;
      const aim=mode==='aim'?1:mode==='draw'?draw*.63:mode==='search'?.48:mode==='holster'?draw*.42:.18;
      const reload=mode==='reload'?clamp(1-(reloadEnd-t)/reloadTime):0;
      return {t,draw,aim,age:t-fired,reload,mode,loaded:rounds>0};
    }
  };
}

// Animation and damage operate only within the provoked NPC's game layer.
function rangedDefense(T,scene,rig,{device,spec,bolt},{query,camera,context,damage,sound,contact,ready,onReset}){
  const {actor,npcInfo}=rig,bow=spec.kind==='bow',logic=counterfireState(spec.kind),V=()=>new T.Vector3();
  const layer=npcActorLayer(actor),mask=1<<layer,mount=rig.counterMount,range=bow?20:17;
  device.root.traverse(o=>{o.layers.set(layer);});mount.add(device.root);
  const emit=V().fromArray(spec.emit),muzzle=V(),point=V(),last=V().copy(actor.position),p=V(),forward=V();
  const ray=new T.Ray(),aim=V(),origin=V(),diff=V(),axis=V().set(0,0,1),eye=V(),right=V();
  const fx=new T.Group(),flare=bow?null:new T.Mesh(new T.IcosahedronGeometry(1,0),
    new T.MeshBasicMaterial({color:0xffc77d,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const streak=bow?null:new T.Mesh(new T.PlaneGeometry(1,1),
    new T.MeshBasicMaterial({color:0xffa864,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false}));
  if(bow)fx.add(bolt);
  else fx.add(streak,flare);
  fx.traverse(o=>o.layers.set(layer));fx.userData.noSceneQuery=true;scene.add(fx);fx.visible=false;
  const speed=32,gravity=7.8,flight={at:V(),velocity:V(),start:V(),age:0},tip=V(0,0,-1);
  let pulse=0,serial=0,mark='idle',reloadCue=false,arm=0,stale=0,restYaw=actor.rotation.y,reloadPrime=false;
  const sample={material:'surface'};
  const targetHeight=body=>body.y+(body.eyeHeight??1.67)*.78;
  const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
  function observe(body){
    if(context().layer!==layer||!ready()||!query.seen(actor))return false;
    npcInfo.head.getWorldPosition(origin);aim.set(body.x,targetHeight(body),body.z).sub(origin);
    const d=aim.length();
    if(d<.35||d>range)return false;
    const clear=query.trace(ray.set(origin,aim.multiplyScalar(1/d)),d-.17,mask,.10,true)===Infinity;
    if(clear)last.set(body.x,targetHeight(body),body.z);
    return clear;
  }
  function tracePlayer(body){
    // Short in-game hitscan. The crouching silhouette uses the actual eye
    // height; a miss continues to the nearest opaque surface or expires.
    const h=body.eyeHeight??1.67,cy=body.y+h*.49+.08,ry=.50*h+.07;
    const from=ray.origin;
    diff.set((from.x-body.x)/.31,(from.y-cy)/ry,(from.z-body.z)/.31);
    p.set(ray.direction.x/.31,ray.direction.y/ry,ray.direction.z/.31);
    const b=diff.dot(p),a=p.lengthSq(),c=diff.lengthSq()-1,disc=b*b-a*c;
    return c<=0?0:b<0&&disc>=0?c/(-b+Math.sqrt(disc)):Infinity;
  }
  function tickBolt(dt,body){
    if(!fx.visible)return false;
    const {at,velocity}=flight;
    flight.age+=dt;
    if(flight.age>1.25){fx.visible=false;return true;}
    aim.copy(velocity).multiplyScalar(dt);aim.y-=gravity*.5*dt*dt;
    velocity.y-=gravity*dt;
    const length=aim.length();
    if(length<1e-6)return true;
    ray.set(at,aim.multiplyScalar(1/length));
    sample.material='surface';
    const player=ready()&&context().layer===layer?tracePlayer(body):Infinity;
    const world=query.trace(ray,Math.min(length,player),mask,.005,false,sample);
    if(world!==Infinity||player<=length){
      fx.visible=false;
      if(world!==Infinity){ray.at(world,point);contact(point,'bow',sample.material);}
      else damage(24,flight.start);
    }else{
      at.addScaledVector(aim,length);
      forward.copy(velocity).normalize();
      bolt.position.copy(at).addScaledVector(forward,-.157);
      bolt.quaternion.setFromUnitVectors(tip,forward);
    }
    return true;
  }
  function fire(body){
    if(!observe(body))return false;
    device.root.localToWorld(muzzle.copy(emit));
    aim.copy(last).sub(muzzle);
    let d=aim.length();
    if(d<.08)return false;
    if(d>.36&&query.trace(ray.set(muzzle,aim.multiplyScalar(1/d)),d-.16,mask,.015,true)!==Infinity)return false;
    const scatter=[1,.13,-.28,-.89,.18,.39,-.17];
    const i=serial++%scatter.length,slip=scatter[i]*(.19+d*(bow?.030:.040));
    right.set(aim.z,0,-aim.x).normalize();
    point.copy(last).addScaledVector(right,slip);point.y+=(i%3-1)*.077+(i===3?.19:0);
    if(bow){
      point.y+=gravity*.5*(d/speed)**2;
      forward.subVectors(point,muzzle).normalize();
      flight.age=0;flight.start.copy(muzzle);flight.at.copy(muzzle);flight.velocity.copy(forward).multiplyScalar(speed);
      fx.visible=true;bolt.position.copy(muzzle).addScaledVector(forward,-.157);
      bolt.quaternion.setFromUnitVectors(tip,forward);
      sound('bow-fire',muzzle);return true;
    }
    forward.subVectors(point,muzzle).normalize();ray.set(muzzle,forward);
    sample.material='surface';
    const hit=tracePlayer(body),worldHit=query.trace(ray,Math.min(24,hit),mask,.015,false,sample);
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
    if(reached)damage(npcInfo.id==='niklas'?21:16,muzzle);
    else if(worldHit!==Infinity)contact(point,'pistol',sample.material);
    return true;
  }
  const matrix=new T.Matrix4();
  const reset=()=>{
    const wasActive=logic.active||npcInfo.hostile;
    logic.stop();mount.visible=fx.visible=false;pulse=0;arm=0;stale=0;mark='idle';npcInfo.hostile=false;
    if(wasActive&&npcInfo.alive){
      actor.rotation.y=restYaw;
      rig.resetBoxPose();rig.resetCounterHands();onReset?.(npcInfo);
    }
  };
  function update(dt,body){
    if(!npcInfo.alive){if(logic.active||fx.visible)reset();return false;}
    const boltChanged=bow&&tickBolt(dt,body);
    const hadPulse=fx.visible;
    if(pulse>0){
      pulse=Math.max(0,pulse-dt);fx.visible=pulse>0;
      flare.visible=pulse>.026;flare.material.opacity=pulse*10;
      streak.material.opacity=pulse*5.4;
    }
    if(!logic.active)return boltChanged||hadPulse;
    const state=logic.tick(dt,()=>observe(body),ready()&&!rig.isReacting(),()=>fire(body));
    if(!state){reset();return true;}
    const {t,draw,aim:raise,age,reload,mode,loaded}=state;
    if(mode==='draw'&&mark!=='draw')sound('equip',actor.position);
    if(mode==='reload'&&mark!=='reload'){
      reloadCue=false;reloadPrime=false;
      if(!bow)sound('mag-out',actor.position);
    }
    if(bow&&mode==='reload'&&reload>.28&&!reloadPrime){reloadPrime=true;sound('bow-open',actor.position);}
    if(mode==='reload'&&reload>(bow?.78:.69)&&!reloadCue){reloadCue=true;sound(bow?'bow-close':'mag-in',actor.position);}
    mark=mode;mount.visible=draw>.30;
    device.animate(age,{reload:mode==='reload'?reload:-1,loaded});
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
    if(flare)flare.visible||=pulse>.049;
    return true;
  }
  return {get active(){return logic.active;},update,reset,provoke(){
    if(!npcInfo.alive||npcInfo.questBusy||logic.active||!logic.provoke())return false;
    npcInfo.hostile=true;restYaw=actor.rotation.y;mark='idle';
    camera.getWorldPosition(last);last.y-=.22;return true;
  },warmup(){
    mount.visible=fx.visible=true;fx.position.copy(actor.position);
    if(flare){flare.visible=true;flare.scale.setScalar(.03);streak.scale.set(.15,.012,1);}
    const list=[];for(const root of [mount,fx])root.traverse(o=>{if(o.isMesh){list.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    return ()=>{mount.visible=fx.visible=false;fx.position.set(0,0,0);for(const [o,cull] of list)o.frustumCulled=cull;};
  }};
}

// Allocate animated replicas and FX lazily. Only active actors are ticked.
export function npcCounterfire(T,scene,makeDevice,options){
  const states=new WeakMap(),active=new Set();
  function get(n){
    let s=states.get(n);
    if(s)return s;
    const kind=npcWeapon(n?.id);
    if(!kind||!n.rig.counterMount)return null;
    s=rangedDefense(T,scene,n.rig,makeDevice(kind),options);
    states.set(n,s);return s;
  }
  return {isActive:n=>active.has(n),provoke(n){
    if(!n?.alive||n.questBusy||!get(n)?.provoke())return false;
    active.add(n);return true;
  },drop(n){states.get(n)?.reset();active.delete(n);},reset(){
    for(const n of active)states.get(n).reset();
    active.clear();
  },update(dt,body){
    let changed=false;
    for(const n of active){
      const s=states.get(n);
      changed=s.update(dt,body)||changed;
      if(!s.active)active.delete(n);
    }
    return changed;
  },warmup(n){return get(n)?.warmup()??(()=>{});}};
}
