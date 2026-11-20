import {egoAssets,EQUIPMENT as style} from './ego-assets.js';
import {bowSeat} from './ego-weapon-models.js';
import {makeEgoBody} from './ego-body.js';
import {weaponWorld} from './ego-projectiles.js';

export function makeViewmodel(T,scene,camera,player,world,floorHeight,canvas,isActive,refresh,equipmentAllowed=()=>true,
  creatures=null,onFire=()=>{},onContact=()=>{},onAction=()=>{},query,context){
  const stage=new T.Scene(),eye=new T.PerspectiveCamera(53,1,.045,6);
  const h=new T.HemisphereLight(0xe6eaf0,0x839098,1.24),key=new T.DirectionalLight(0xf7dcac,1.38),
    rim=new T.DirectionalLight(0xb5c8dc,.62);
  key.position.set(-1.3,1.18,.39);rim.position.set(1.0,.47,-1.0);stage.add(h,key,rim);
  const hands=new T.Group(),held=new T.Group();hands.add(held);stage.add(hands);
  const rig=egoAssets(T),{cap,shell}=rig.geometry,{frame,sleeve,cuff}=rig.materials;
  const body=makeEgoBody(T,player.body),V=(...a)=>new T.Vector3(...a),axis=V(0,1,0),linkDir=V();
  function mesh(parent,g,m,x=0,y=0,z=0){
    const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;
  }
  function link(node,a,b,width,depth){
    node.position.copy(a).lerp(b,.5);
    linkDir.subVectors(b,a);const length=linkDir.length();
    node.scale.set(width,length*.52,depth);node.quaternion.setFromUnitVectors(axis,linkDir.normalize());
  }
  const arms=[-1,1].map(side=>({side,forearm:mesh(hands,cap,sleeve),wrap:mesh(hands,shell,cuff),wrist:V(),elbow:V(),end:V()}));
  const devices=rig.devices;held.add(...devices.map(d=>d.root),...rig.hands.map(p=>p.group));
  const rangeObjects=new T.Group();rangeObjects.name='Treffer und Übungsmarken';rangeObjects.userData.noSceneQuery=true;scene.add(rangeObjects);
  const anchors=[[57.1,47.7],[62.5,49.2],[65.7,53.7]].map(([x,z])=>{
    const y=floorHeight(x,z),center=V(x,y+.88,z);
    const stand=mesh(rangeObjects,new T.CylinderGeometry(.046,.10,.85,10),frame,x,y+.42,z);
    stand.name='Treffermarke';
    const surface=new T.MeshStandardMaterial({color:0x737a64,roughness:.52,metalness:.39,emissive:0xb17d4b,emissiveIntensity:.095});
    const face=mesh(rangeObjects,new T.IcosahedronGeometry(.123,1),surface,x,center.y,z);
    return {face,timer:0,sphere:new T.Sphere(center,.14)};
  });
  const fx=weaponWorld(T,rangeObjects,world,floorHeight,creatures,rig.bolt,anchors,onContact,query,context);
  const flash=new T.Group();held.add(flash);
  const shine=new T.MeshBasicMaterial({color:0xe9a33b,transparent:true,depthWrite:false,
    blending:T.AdditiveBlending,toneMapped:false});
  const spark=mesh(flash,new T.IcosahedronGeometry(1,0),shine,0,0,-.023);
  const sparkSide=mesh(flash,new T.IcosahedronGeometry(1,0),shine,0,0,-.013);
  flash.visible=false;
  const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
  const relax=(v,d,k,dt)=>v+(d-v)*(1-Math.exp(-k*dt));
  const clockAt=[-10,-10,-10],heard=[0,0,0],previous=player.body.position.clone(),deltaPos=V();
  const projector=new T.Raycaster(),headQ=new T.Quaternion(),origin=V(),muzzle=V(),contact=V(),sight=V(),projected=V(),sightAnchor=V();
  const screen=new T.Vector2(),aimScreen=new T.Vector2();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,owned=[-1,0];
  let selected=-1,pending=-1,swap=null,aiming=false,ads=0,kick=0,t0=null,step=0,clock=0;
  let moving=0,running=0,strafe=0,inertia=0,previousYaw=player.body.rotation.y,wheel=0,wheelAt=0,wheelStepAt=-1000;
  let wasPermitted=false,serial=0;
  function display(n){
    selected=n;devices.forEach((d,i)=>{d.root.visible=rig.hands[i].group.visible=i===n;});
  }
  function select(n){
    if(!swap&&selected===n)return;
    if(n<0)aiming=false;
    pending=n;
    onAction(style[n>=0?n:selected]?.kind,n<0?'holster':'equip');
    if(!swap)swap={at:clock,shown:false,down:selected<0?0:.109,up:n<0?0:.176};
    else if(swap.shown)swap={at:clock,shown:false,down:.080,up:n<0?0:.160};
    // A change while still lowering replaces the destination only.
    else swap.up=n<0?0:.176;
    kick=0;flash.visible=false;refresh();
  }
  display(selected);
  function syncProjection(){
    const fov=(camera.aspect<.8?61:54)-ads*4;
    if(eye.fov!==fov||eye.aspect!==camera.aspect){eye.aspect=camera.aspect;eye.fov=fov;eye.updateProjectionMatrix();}
  }
  function fire(){
    if(selected<0||swap||!equipmentAllowed())return;
    const n=style[selected];if(clock-clockAt[selected]<n.recovery)return;
    clockAt[selected]=clock;heard[selected]=0;serial++;kick=n.recoil;
    onFire(n.kind);
    syncProjection();camera.updateWorldMatrix(true,false);camera.getWorldPosition(origin);
    aimScreen.set(0,0);
    if(ads>.25){
      projected.fromArray(n.sight).applyQuaternion(held.quaternion).add(held.position).applyMatrix4(eye.projectionMatrix);
      aimScreen.set(projected.x,projected.y);
    }
    projector.setFromCamera(aimScreen,camera);
    if(n.kind==='bow'){
      // Convert viewmodel muzzle pixels to world space at the same camera depth.
      muzzle.fromArray(n.emit).applyQuaternion(held.quaternion).add(held.position);
      muzzle.x*=eye.projectionMatrix.elements[0]/camera.projectionMatrix.elements[0];
      muzzle.y*=eye.projectionMatrix.elements[5]/camera.projectionMatrix.elements[5];
      muzzle.applyQuaternion(camera.getWorldQuaternion(headQ)).add(origin);
      projector.ray.at(n.range,sight);fx.launch(origin,muzzle,sight,n);
      flash.visible=false;
    }else{
      flash.position.fromArray(n.emit);flash.visible=true;flash.rotation.z=(serial*2.39996)%6.28318;
      fx.beginVolley();let nearest=Infinity,material;
      for(let i=0;i<n.pattern;i++){
        const az=(i-1)*Math.PI*.5+serial*2.39996,
          fan=(n.pattern===1?.56:i===0?0:i%2?.82:1)*n.spread*(1-ads*.20);
        screen.set(aimScreen.x+Math.cos(az)*fan,aimScreen.y+Math.sin(az)*fan*camera.aspect);
        projector.setFromCamera(screen,camera);
        const hit=fx.pellet(projector.ray,n);
        if(hit&&hit.distance<nearest){nearest=hit.distance;material=hit.material;projector.ray.at(nearest,contact);}
      }
      fx.endVolley(n);
      if(nearest!==Infinity)onContact(contact,n.kind,material);
    }
    refresh();
  }
  const relevant=e=>isActive()&&(document.pointerLockElement===canvas||e.target===canvas);
  window.addEventListener('mousedown',e=>{
    if(e.sourceCapabilities?.firesTouchEvents||document.body.dataset.input==='touch'||!relevant(e)||!equipmentAllowed())return;
    if(e.button===2&&selected>=0){e.preventDefault();aiming=true;refresh();}
    else if(e.button===0)fire();
  });
  window.addEventListener('mouseup',e=>{if(e.button===2){aiming=false;refresh();}});
  window.addEventListener('pointercancel',()=>{aiming=false;refresh();});
  canvas.addEventListener('contextmenu',e=>{if(isActive())e.preventDefault();});
  window.addEventListener('wheel',e=>{
    if(e.ctrlKey||!relevant(e)||!e.deltaY||!equipmentAllowed())return;
    e.preventDefault();
    const now=performance.now(),raw=e.deltaY*(e.deltaMode===1?17:e.deltaMode===2?120:1);
    if(now-wheelAt>160||Math.sign(wheel)!==Math.sign(raw))wheel=0;
    wheelAt=now;wheel+=Math.max(-110,Math.min(110,raw));
    if(Math.abs(wheel)<39||now-wheelStepAt<108)return;
    const sign=Math.sign(wheel),current=swap?pending:selected;
    const next=owned[(owned.indexOf(current)+sign+owned.length)%owned.length];
    wheel=0;wheelStepAt=now;select(next);
  },{passive:false});
  function update(now){
    const elapsed=t0===null?0:Math.max(0,(now-t0)/1000),dt=Math.min(.05,elapsed);t0=now;clock+=dt;
    deltaPos.subVectors(player.body.position,previous);previous.copy(player.body.position);
    const delta=Math.hypot(deltaPos.x,deltaPos.z),speed=player.motion?.speed??delta/Math.max(dt,.001),yaw=player.body.rotation.y;
    const grounded=player.motion?.grounded??true,landing=player.motion?.land??0;
    const relative=(deltaPos.x*Math.cos(yaw)-deltaPos.z*Math.sin(yaw))/Math.max(.001,dt);
    const dyaw=Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));previousYaw=yaw;
    moving=relax(moving,grounded?Math.min(1,speed/2.75):0,12,dt);
    running=relax(running,T.MathUtils.clamp((speed-3.28)/2.5,0,1),9,dt);
    strafe=relax(strafe,T.MathUtils.clamp(relative/3.3,-1,1),11,dt);
    inertia=relax(inertia,T.MathUtils.clamp(dyaw/Math.max(.001,dt),-4,4),18,dt);
    if(grounded)step+=delta*(5.04-running*.80);
    const permitted=equipmentAllowed(),transition=!!swap;
    if(!permitted&&wasPermitted){aiming=false;fx.clear();flash.visible=false;}
    wasPermitted=permitted;
    let holster=0;
    if(swap){
      const age=clock-swap.at;
      if(age>=swap.down&&!swap.shown){display(pending);swap.shown=true;}
      if(age>=swap.down+swap.up){display(pending);swap=null;}
      else holster=age<swap.down?smooth(age/swap.down):1-smooth((age-swap.down)/swap.up);
    }
    const index=Math.max(0,selected),n=style[index],device=devices[index],pose=rig.hands[index],age=clock-clockAt[index];
    const handling=n.kind==='bow'?smooth((age-.22)/.20)*(1-smooth((age-1.11)/.19)):
      n.kind==='shotgun'?.69*smooth((age-.12)/.18)*(1-smooth((age-.59)/.16)):0;
    const oldAds=ads,aim=aiming&&permitted&&!swap&&selected>=0?1:0;
    ads=relax(ads,aim*(1-handling*.79),aim?17:12,dt);
    if(Math.abs(ads-aim*(1-handling*.79))<.00005)ads=aim*(1-handling*.79);
    const oldKick=kick;kick*=Math.exp(-dt*(n.kind==='shotgun'?10:19));
    const comfort=reduced?.20:1,rest=1-ads,
      sway=Math.sin(step)*moving*(1-ads*.95)*n.weight,bob=Math.cos(step*2)*moving*(1-ads*.95)*n.weight;
    const breath=Math.sin(clock*2.04)*.0035*comfort*(1-.90*ads);
    const lookDown=smooth((-camera.parent.rotation.x-.78)/.52)*rest;
    camera.position.y=(bob*.013*(1+running*.35)-landing*.035)*comfort;camera.rotation.z=strafe*.007*comfort;
    if(selected>=0){
    held.rotation.set(-.039*rest+sway*.020*comfort+kick*1.45-holster*.74-lookDown*.26-handling*.141+breath,
      n.yaw*rest+inertia*.008*rest+sway*.011*comfort+.069*handling,
      -strafe*.037*rest+holster*.23+running*.083*rest-.025*rest-.068*handling);
    sightAnchor.fromArray(n.sight).applyQuaternion(held.quaternion);
    held.position.set((n.hold[0]+running*.042)*rest+sway*.013*comfort*rest-inertia*.005*rest-sightAnchor.x*ads,
      n.hold[1]*rest-sightAnchor.y*ads+(bob*.012*comfort-landing*.020*comfort-(grounded?0:.032))*rest-
      running*.041*rest-holster*.41-lookDown*.19+breath*.8,
      n.hold[2]+ads*.052+kick+holster*.020);
      device.animate(age);
      const support=pose.nodes[0];
      support.position.fromArray(n.fore).add(device.left);
      support.rotation.set(n.kind==='bow'?-.38*handling:0,0,n.kind==='bow'?-.29*handling:0);
      for(const [i,a] of arms.entries()){
        const node=pose.nodes[i];
        a.wrist.copy(pose.wrists[i]).applyQuaternion(node.quaternion).add(node.position).applyQuaternion(held.quaternion).add(held.position);
        a.elbow.set(a.side*(i===1?.277:.251)+.128*rest,-.428+bob*.020*comfort-holster*.16,-.226);
        a.end.copy(a.wrist).lerp(a.elbow,.042);
        link(a.forearm,a.elbow,a.end,.128,.111);a.wrap.position.copy(a.wrist).lerp(a.elbow,.067);
        a.wrap.scale.set(.082,.074,.073);a.wrap.quaternion.copy(a.forearm.quaternion);
      }
    }
    const changingBody=body.update({step,moving,running,strafe,grounded,landing,pitch:camera.parent.rotation.x});
    let effect=permitted&&fx.tick(dt);
    if(flash.visible){
      effect=true;
      const width=n.kind==='shotgun'?.053:.034,fade=1-age/(n.kind==='shotgun'?.059:.041),k=Math.max(0,fade);
      if(fade<=0)flash.visible=false;
      else{
        spark.scale.set(width*k*.51,width*k*.41,width*k*1.18);
        sparkSide.scale.set(width*k,width*k*.35,width*k*.41);sparkSide.rotation.z=age*103;
        shine.opacity=.81*k;shine.color.setHex(n.kind==='shotgun'?0xe5a245:0xf5d495);
      }
    }
    if(selected>=0&&permitted&&isActive()&&age<n.recovery){
      effect=true;
      const a=n.kind==='bow'?.54:n.kind==='shotgun'?.22:Infinity,b=n.kind==='bow'?bowSeat:n.kind==='shotgun'?.58:Infinity;
      if(age>=a&&heard[index]===0){heard[index]=1;if(age-a<.10)onAction(n.kind,'open');}
      if(age>=b&&heard[index]===1){heard[index]=2;if(age-b<.10)onAction(n.kind,'close');}
    }
    const breatheFrame=permitted&&selected>=0&&!reduced&&Math.floor(clock*24)!==Math.floor((clock-dt)*24);
    return changingBody||delta>.0001||moving>.001||Math.abs(inertia)>.003||Math.abs(oldAds-ads)>.0003||oldKick>.0001||effect||
      transition||breatheFrame;
  }
  function draw(renderer){
    if(!isActive()||selected<0||!equipmentAllowed())return;
    syncProjection();
    const reset=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();
    try{renderer.render(stage,eye);}finally{renderer.autoClear=reset;}
  }
  function preset(id){
    const night=id==='night';
    h.intensity=night?.78:1.13;key.intensity=night?.87:1.99;rim.intensity=night?.65:.89;
    key.color.setHex(night?0xb9c9df:0xffe6ce);rim.color.setHex(night?0x8da7c0:0xbac7d1);
    stage.environment=scene.environment;stage.environmentIntensity=night?.72:1.05;
  }
  function stop(){
    aiming=false;ads=0;t0=null;moving=running=strafe=inertia=0;wheel=0;swap=null;display(pending);
    camera.position.y=camera.rotation.z=0;flash.visible=false;refresh();
  }
  function collect(index){
    if(!style[index]||owned.includes(index))return false;
    owned.push(index);owned.sort((a,b)=>a-b);onAction(style[index].kind,'equip');return true;
  }
  function pickupModel(index){
    const device=devices[index];device.animate(10);
    const copy=device.root.clone();copy.visible=true;return copy;
  }
  async function prepare(r){
    const vp=r.getViewport(new T.Vector4()),sc=r.getScissor(new T.Vector4()),test=r.getScissorTest(),meshes=[];
    for(const d of devices)d.root.visible=true;
    for(const p of rig.hands)p.group.visible=true;
    flash.visible=true;stage.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    try{
      await r.compileAsync(stage,eye);
      r.setViewport(0,0,32,32);r.setScissor(0,0,32,32);r.setScissorTest(true);r.render(stage,eye);
    }finally{
      display(selected);flash.visible=false;for(const [o,v] of meshes)o.frustumCulled=v;
      r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);
    }
  }
  update(performance.now());
  return {update,draw,preset,stop,collect,pickupModel,prepare,clearShots:fx.clear,showPrewarmShots:fx.showPrewarm,bodyLayer:body.layer};
}
