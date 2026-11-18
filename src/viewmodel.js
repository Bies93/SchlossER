import {egoAssets,EQUIPMENT as style} from './ego-assets.js';

// A stylized museum-game rig, not a model of a real weapon. Its short visual
// pulses affect only the authored abstract markers, never the world meshes.
export function makeViewmodel(T,scene,camera,player,world,floorHeight,canvas,isActive,refresh,equipmentAllowed=()=>true){
  const stage=new T.Scene(),eye=new T.PerspectiveCamera(53,1,.045,6);
  const h=new T.HemisphereLight(0xf5ede1,0x788994,2.1),key=new T.DirectionalLight(0xf7dcac,1.65);
  key.position.set(-1,.9,.6);stage.add(h,key);
  const hands=new T.Group(),held=new T.Group();hands.add(held);stage.add(hands);
  const mat=(color,roughness=.66,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const rig=egoAssets(T),{cap,shell}=rig.geometry,{edge,frame,sleeve,cuff,pant,knee}=rig.materials;
  const body=new T.Group();body.name='Ego-Körper · Bekleidung und Schritte';player.body.add(body);
  const V=(x,y,z)=>new T.Vector3(x,y,z),axis=V(0,1,0),linkDir=V(0,0,0);
  function shape(parent,geo,material,x,y,z,sx,sy,sz){
    const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
  }
  function link(node,a,b,width,depth=width){
    node.position.copy(a).lerp(b,.5);
    linkDir.subVectors(b,a);const length=linkDir.length();
    node.scale.set(width,length*.53,depth);node.quaternion.setFromUnitVectors(axis,linkDir.normalize());
  }
  const arms=[-1,1].map((side,i)=>{
    const forearm=shape(hands,cap,sleeve,0,0,0,.14,.28,.12);
    const wrap=shape(hands,shell,cuff,0,0,0,.082,.072,.073);
    const stitch=shape(hands,shell,edge,0,0,0,.058,.010,.015);
    hands.add(rig.hands[i]);
    return {side,forearm,wrap,stitch,hand:rig.hands[i],gripQ:new T.Quaternion(),
      wrist:V(0,0,0),elbow:V(0,0,0),end:V(0,0,0)};
  });
  // Keep the upper body behind the eye instead of obscuring both boots
  // with a nearby solid waist panel when the player looks down.
  shape(body,cap,pant,0,.97,.277,.329,.205,.212);
  shape(body,shell,cuff,0,1.031,.224,.295,.058,.081);
  const legs=[-1,1].map((side,i)=>{
    const boot=rig.boots[i];body.add(boot);
    return {side,boot,
      thigh:shape(body,cap,pant,0,0,0,.180,.22,.170),
      shin:shape(body,cap,pant,0,0,0,.138,.21,.134),
      knee:shape(body,shell,knee,0,.48,0,.128,.155,.086),
      hip:V(0,0,0),pivot:V(0,0,0),ankle:V(0,0,0)};
  });
  const modules=rig.devices;held.add(...modules);
  // Three authored hard-surface markers in one side area of the square.
  const anchors=[[57.1,47.7],[62.5,49.2],[65.7,53.7]].map(([x,z])=>{
    const y=floorHeight(x,z),center=V(x,y+.88,z);
    const stand=shape(scene,new T.CylinderGeometry(.045,.11,1,9),frame,x,y+.42,z,1,.84,1);
    stand.name='Optionale Impulsmarke';
    const surface=new T.MeshStandardMaterial({color:0x586f6c,roughness:.40,metalness:.22,
      emissive:0x54b5bb,emissiveIntensity:.10});
    const face=shape(scene,new T.IcosahedronGeometry(.125,1),surface,x,center.y,z,1,1,1);
    return {center,face,timer:0,sphere:new T.Sphere(center,.19)};
  });
  const trailMat=new T.MeshBasicMaterial({color:style[0].color,transparent:true,opacity:.78,depthWrite:false});
  const orb=shape(scene,new T.SphereGeometry(.026,8,6),trailMat,0,0,0,1,1,1);
  const ribbon=shape(scene,new T.CylinderGeometry(.006,.012,1,5),trailMat,0,0,0,1,1,1);
  orb.visible=ribbon.visible=false;orb.renderOrder=4;ribbon.renderOrder=4;
  let selected=-1,pending=-1,swap=null,aiming=false,ads=0,kick=0,step=0,t0=null,pressed=0,flight=null,recent=0;
  const previous=player.body.position.clone(),deltaPos=V(0,0,0),from=V(0,0,0),dir=V(0,0,0),hit=V(0,0,0);
  const headQ=new T.Quaternion(),ray=new T.Ray(),end=V(0,0,0),old=V(0,0,0);
  const ang=new T.Euler(),sightAnchor=V(0,0,0);
  const smooth=t=>t*t*(3-2*t),relax=(v,d,k,dt)=>v+(d-v)*(1-Math.exp(-k*dt));
  let moving=0,running=0,strafe=0,inertia=0,previousYaw=player.body.rotation.y,wheel=0,wheelAt=0,wheelStepAt=-1000;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function display(n){selected=n;modules.forEach((m,i)=>m.visible=i===n)}
  function select(n){
    if(!swap&&selected===n)return;
    if(n<0)aiming=false;
    pending=n;
    const now=performance.now();
    if(!swap)swap={at:now,shown:false,down:selected<0?0:109,up:n<0?0:176};
    else if(swap.shown)swap={at:now,shown:false,down:80,up:n<0?0:160};
    kick=0;refresh();
  }
  pending=matchMedia('(pointer:coarse)').matches?-1:0;display(pending);
  function pulse(){
    if(selected<0||swap||!equipmentAllowed())return;
    const age=performance.now();if(age-pressed<130)return;
    pressed=age;kick=.035+(selected*.009);
    camera.getWorldPosition(from);camera.getWorldDirection(dir);camera.getWorldQuaternion(headQ);
    ray.set(from,dir);
    let target=null,distance=13.5+selected*1.5;
    for(const item of anchors){
      if(!ray.intersectSphere(item.sphere,hit))continue;
      const d=from.distanceTo(hit);if(d<distance){distance=d;target=item}
    }
    // The light trail disappears at the simplified level boundary. It does
    // not apply forces, decals or hit effects to any world object.
    for(let d=.26;d<distance;d+=.18){
      ray.at(d,hit);
      if(world.blocked(hit.x,hit.z)||(dir.y<-.12&&hit.y<floorHeight(hit.x,hit.z)+.035)){
        distance=Math.max(.42,d-.08);target=null;break;
      }
    }
    end.copy(from).addScaledVector(dir,distance);
    const start=sightAnchor.set(0,.015,-style[selected].length).applyQuaternion(held.quaternion).add(held.position)
      .clone().applyQuaternion(headQ).add(from);
    flight={start,end:end.clone(),target,at:age,duration:155+distance*10,style:selected};
    trailMat.color.setHex(style[selected].color);
    refresh();
  }
  const relevant=e=>isActive()&&(document.pointerLockElement===canvas||e.target===canvas);
  window.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||!relevant(e)||!equipmentAllowed())return;
    if(e.button===2&&selected>=0){e.preventDefault();aiming=true;refresh()}
    else if(e.button===0){pulse()}
  });
  window.addEventListener('pointerup',e=>{if(e.button===2){aiming=false;refresh()}});
  window.addEventListener('pointercancel',()=>{aiming=false});
  canvas.addEventListener('contextmenu',e=>{if(isActive())e.preventDefault()});
  window.addEventListener('keydown',e=>{
    if(!isActive()||e.ctrlKey||e.altKey||e.metaKey||!equipmentAllowed())return;
    if(/^Digit[0123]$/.test(e.code)&&!e.repeat){e.preventDefault();select(Number(e.code.slice(-1))-1)}
  });
  window.addEventListener('wheel',e=>{
    if(e.ctrlKey||!relevant(e)||!e.deltaY||!equipmentAllowed())return;
    e.preventDefault();
    const now=performance.now(),raw=e.deltaY*(e.deltaMode===1?17:e.deltaMode===2?120:1);
    if(now-wheelAt>160||Math.sign(wheel)!==Math.sign(raw))wheel=0;
    wheelAt=now;wheel+=Math.max(-110,Math.min(110,raw));
    if(Math.abs(wheel)<39||now-wheelStepAt<108)return;
    const sign=Math.sign(wheel),current=swap?pending:selected;
    const next=current<0?(sign>0?0:style.length-1):(current+sign+style.length)%style.length;
    wheel=0;wheelStepAt=now;select(next);
  },{passive:false});
  function update(now){
    const dt=t0===null?1/60:Math.min(.045,(now-t0)/1000);t0=now;
    deltaPos.subVectors(player.body.position,previous);previous.copy(player.body.position);
    const delta=Math.hypot(deltaPos.x,deltaPos.z),speed=delta/Math.max(dt,.001),yaw=player.body.rotation.y;
    const relative=(deltaPos.x*Math.cos(yaw)-deltaPos.z*Math.sin(yaw))/Math.max(.001,dt);
    const dyaw=Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));previousYaw=yaw;
    moving=relax(moving,Math.min(1,speed/2.75),12,dt);
    running=relax(running,T.MathUtils.clamp((speed-3.28)/2.5,0,1),9,dt);
    strafe=relax(strafe,T.MathUtils.clamp(relative/3.3,-1,1),11,dt);
    inertia=relax(inertia,T.MathUtils.clamp(dyaw/Math.max(.001,dt),-4,4),21,dt);
    step+=delta*(5.05-running*.82);
    let holster=0,transition=!!swap;
    if(swap){
      const age=now-swap.at;
      if(age>=swap.down&&!swap.shown){display(pending);swap.shown=true}
      if(age>=swap.down+swap.up){display(pending);swap=null}
      else holster=age<swap.down?smooth(age/swap.down):1-smooth((age-swap.down)/swap.up);
    }
    const permitted=equipmentAllowed();
    if(!permitted){aiming=false;flight=null;orb.visible=ribbon.visible=false}
    const oldAds=ads;ads=relax(ads,aiming&&!swap&&selected>=0?1:0,17,dt);
    const oldKick=kick;kick*=Math.exp(-dt*17);
    const n=style[Math.max(0,selected)],sway=Math.sin(step)*moving*(1-ads*.93),
      bob=Math.cos(step*2)*moving*(1-ads*.89),comfort=reduced?.18:1,rest=1-ads;
    const lookDown=smooth(T.MathUtils.clamp((-camera.parent.rotation.x-.78)/.52,0,1))*rest;
    camera.position.y=bob*.013*comfort*(1+running*.38);camera.rotation.z=strafe*.007*comfort;
    held.position.set((.223+running*.052)*rest+sway*.015*comfort-inertia*.006*rest,
      -.223*rest-n.sight*ads+bob*.010*comfort-running*.039*rest-holster*.41-lookDown*.20,-.624+ads*.058+kick+holster*.020);
    held.rotation.set(-.029*rest+sway*.022*comfort+kick*1.98-holster*.76-lookDown*.25,
      .069*rest+inertia*.008*rest+sway*.012*comfort,-strafe*.042*rest+holster*.23+running*.073*rest);
    for(const a of arms){
      const driver=a.side===1,p=a.side;
      a.wrist.fromArray(driver?n.grip:n.support).applyQuaternion(held.quaternion).add(held.position);
      a.elbow.set(p*(driver?.275:.25)+rest*.13,-.424+bob*.021*comfort-holster*.16,-.237);
      a.end.copy(a.wrist).lerp(a.elbow,.13);
      link(a.forearm,a.elbow,a.end,.139,.128);a.wrap.position.copy(a.wrist).lerp(a.elbow,.151);
      a.wrap.quaternion.copy(a.forearm.quaternion);
      a.stitch.position.copy(a.wrap.position);a.stitch.position.y+=.035;
      a.stitch.quaternion.copy(a.wrap.quaternion);
      a.hand.position.copy(a.wrist);
      ang.set(driver?.47:.24,driver?-.12:.49,driver?.37:-.61);
      a.hand.quaternion.copy(held.quaternion).multiply(a.gripQ.setFromEuler(ang));
    }
    for(const leg of legs){
      const q=step+(leg.side<0?0:Math.PI),stride=Math.cos(q)*moving,lift=Math.max(0,Math.sin(q))*moving*(.103+running*.069),x=leg.side*.115;
      leg.hip.set(x,.921,.167);leg.pivot.set(x+strafe*.036,.485+lift*.54,-.124-stride*.121);
      leg.ankle.set(x+strafe*.070,.117+lift,-.106-stride*(.189+running*.12));
      link(leg.thigh,leg.hip,leg.pivot,.165,.152);link(leg.shin,leg.pivot,leg.ankle,.132,.129);
      leg.knee.position.copy(leg.pivot).addScaledVector(axis,.012);leg.knee.position.z-=.052;
      leg.knee.rotation.x=.09+lift*.53;
      leg.boot.position.copy(leg.ankle).y-=.112;
      leg.boot.rotation.set(-Math.max(0,Math.sin(q))*moving*.195+stride*.081,leg.side*-.083+strafe*.11,0);
    }
    let effect=!!flight||recent>now;
    if(flight){
      const k=Math.min(1,(now-flight.at)/flight.duration);
      orb.visible=ribbon.visible=k<1;
      if(k<1){
        orb.position.lerpVectors(flight.start,flight.end,k);
        old.lerpVectors(flight.start,flight.end,Math.max(0,k-.13));
        link(ribbon,old,orb.position,1,1);ribbon.scale.y*=2;
      }else{
        if(flight.target){flight.target.timer=now+420;flight.target.face.material.emissive.setHex(style[flight.style].color);recent=now+420}
        flight=null;
      }
    }
    for(const a of anchors)a.face.material.emissiveIntensity=.10+Math.max(0,(a.timer-now)/420)*2.5;
    return delta>.0001||moving>.001||Math.abs(inertia)>.003||Math.abs(oldAds-ads)>.0003||oldKick>.0001||effect||transition;
  }
  function draw(renderer){
    if(!isActive()||selected<0||!equipmentAllowed())return;
    eye.aspect=camera.aspect;const fov=(camera.aspect<.8?60:54)-ads*4;
    if(eye.fov!==fov||eye.aspect!==eye.userData.aspect){eye.fov=fov;eye.userData.aspect=eye.aspect;eye.updateProjectionMatrix()}
    const reset=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();
    renderer.render(stage,eye);renderer.autoClear=reset;
  }
  function preset(id){
    h.intensity=id==='night'?.84:1.35;
    key.intensity=id==='night'?.46:1.38;
    key.color.setHex(id==='night'?0x9baec8:0xffc698);
  }
  function stop(){
    aiming=false;ads=0;t0=null;moving=running=strafe=inertia=0;wheel=0;swap=null;display(pending);
    camera.position.y=camera.rotation.z=0;
    flight=null;orb.visible=ribbon.visible=false;recent=0;for(const a of anchors){a.timer=0;a.face.material.emissiveIntensity=.10}refresh();
  }
  update(performance.now());
  return {update,draw,preset,stop};
}
