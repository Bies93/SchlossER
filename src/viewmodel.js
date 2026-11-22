import {egoAssets,EQUIPMENT as style} from './ego-assets.js';
import {makeEgoBody} from './ego-body.js';
import {weaponWorld} from './ego-projectiles.js';
import {recoilSpring,weaponAction} from './weapon-action.js';

export function makeViewmodel(T,scene,camera,player,world,floorHeight,canvas,isActive,refresh,equipmentAllowed=()=>true,
  creatures=null,onFire=()=>{},onContact=()=>{},onAction=()=>{},query,context,hud){
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
  const fx=weaponWorld(T,rangeObjects,world,floorHeight,creatures,rig.bolt,anchors,onContact,query,context,hitFeedback);
  const flash=new T.Group();held.add(flash);
  const shine=new T.MeshBasicMaterial({color:0xe9a33b,transparent:true,depthWrite:false,
    blending:T.AdditiveBlending,toneMapped:false});
  const spark=mesh(flash,new T.IcosahedronGeometry(1,0),shine,0,0,-.023);
  const sparkSide=mesh(flash,new T.IcosahedronGeometry(1,0),shine,0,0,-.013);
  flash.visible=false;
  const brass=new T.MeshStandardMaterial({color:0xb99a56,metalness:.68,roughness:.40});
  const casing=new T.CylinderGeometry(.0048,.0063,.028,9);
  const tube=new T.CylinderGeometry(.0048,.006,.022,9);
  const spentHull=new T.MeshStandardMaterial({color:0x884032,roughness:.62});
  const cases=Array.from({length:8},()=>{
    const o=new T.Group(),head=mesh(o,casing,brass),hull=mesh(o,tube,spentHull,0,.004,0);
    stage.add(o);o.visible=false;
    return {o,head,hull,v:V(),age:1};
  });
  let caseCursor=0;
  function eject(n){
    if(reduced)return;
    const c=cases[caseCursor++%cases.length],big=n.kind==='shotgun';
    c.age=0;c.o.visible=true;c.o.scale.set(big?1.7:1,big?2:n.kind==='pistol'?.65:1,big?1.7:1);
    c.hull.visible=big;c.head.scale.y=big?.24:1;c.head.position.y=big?-.010:0;
    c.o.position.set(big?.064:.043,.027,n.kind==='pistol'?-.092:-.172);
    c.o.position.applyQuaternion(held.quaternion).add(held.position);
    c.o.rotation.set(.8,0,-.4);c.v.set(.77,.44+(serial%3)*.055,.14);
  }
  const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
  const relax=(v,d,k,dt)=>v+(d-v)*(1-Math.exp(-k*dt));
  const states=style.map(weaponAction),previous=player.body.position.clone(),deltaPos=V();
  const kickback=recoilSpring(20),tiltSpring=recoilSpring(17),pitchSpring=recoilSpring(15),
    yawSpring=recoilSpring(17),rollSpring=recoilSpring(19);
  const projector=new T.Raycaster(),headQ=new T.Quaternion(),origin=V(),muzzle=V(),contact=V(),sightAnchor=V();
  const screen=new T.Vector2(),aimScreen=new T.Vector2();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,owned=[-1,0],
    names=style.map(n=>n.label.split(' · ').at(-1));
  let selected=-1,pending=-1,swap=null,aiming=false,ads=0,t0=null,step=0,clock=0;
  let moving=0,running=0,strafe=0,inertia=0,previousYaw=player.body.rotation.y,wheel=0,wheelAt=0,wheelStepAt=-1000;
  let wasPermitted=false,serial=0,leftHeld=false,touchHeld=false,burst=0,lastShot=-Infinity,dryLatched=false;
  let wall=0,nextWall=-Infinity,wallDistance=Infinity,hitUntil=0,hitType='',noticeUntil=0,notice='';
  function hitFeedback(kind){
    if(clock<hitUntil&&hitType!=='body'&&kind==='body')return;
    hitType=kind;hitUntil=clock+(kind==='body'?.145:.22);
  }
  function setData(el,key,value){
    if(value===null){if(key in el.dataset)delete el.dataset[key];}
    else if(el.dataset[key]!==value)el.dataset[key]=value;
  }
  function paintHud(isArmed,visual,action){
    if(!hud)return;
    setData(hud.root,'armed',isArmed?'yes':null);
    setData(hud.root,'aim',ads>.7?'yes':null);
    setData(hud.root,'hit',clock<hitUntil?hitType:null);
    setData(hud.root,'state',isArmed?visual.phase:null);
    setData(hud.root,'wall',wallDistance<.36?'yes':null);
    if(!isArmed)return;
    const message=clock<noticeUntil?notice:visual.phase==='reloading'?(style[selected].kind==='bow'?'Wird gespannt':'Wird nachgeladen'):
      visual.phase==='empty'?(action.reserve?'R · Nachladen':'Keine Reserve'):wallDistance<.36?'Mündung blockiert':'';
    const assign=(el,v)=>{if(el.textContent!==v)el.textContent=v;};
    assign(hud.weapon,names[selected]);assign(hud.rounds,String(action.rounds));assign(hud.reserve,String(action.reserve));
    assign(hud.status,message);
    const p=visual.reload<0?0:visual.reload;
    const value=p.toFixed(3);
    if(hud.root.style.getPropertyValue('--reload')!==value)hud.root.style.setProperty('--reload',value);
  }
  function clearRecoil(){for(const s of [kickback,tiltSpring,pitchSpring,yawSpring,rollSpring])s.clear();burst=0;}
  function display(n){
    selected=n;devices.forEach((d,i)=>{d.root.visible=rig.hands[i].group.visible=i===n;});
  }
  function select(n){
    if(!swap&&selected===n)return;
    leftHeld=touchHeld=dryLatched=false;
    states[selected]?.cancel();
    if(n<0)aiming=false;
    pending=n;
    onAction(style[n>=0?n:selected]?.kind,n<0?'holster':'equip');
    if(!swap)swap={at:clock,shown:false,down:selected<0?0:.109,up:n<0?0:.176};
    else if(swap.shown)swap={at:clock,shown:false,down:.080,up:n<0?0:.160};
    // A change while still lowering replaces the destination only.
    else swap.up=n<0?0:.176;
    clearRecoil();wall=0;wallDistance=Infinity;nextWall=-Infinity;noticeUntil=0;flash.visible=false;refresh();
  }
  display(selected);
  function syncProjection(){
    const fov=(camera.aspect<.8?61:54)-ads*4;
    if(eye.fov!==fov||eye.aspect!==camera.aspect){eye.aspect=camera.aspect;eye.fov=fov;eye.updateProjectionMatrix();}
    const base=camera.userData.baseFov;
    if(base){
      const worldFov=base*(1-ads*(selected===0?.20:.15));
      if(Math.abs(camera.fov-worldFov)>.045){camera.fov=worldFov;camera.updateProjectionMatrix();}
    }
  }
  function measureWall(n){
    if(!query)return Infinity;
    projector.setFromCamera(aimScreen.set(0,0),camera);
    return query.trace(projector.ray,n.kind==='pistol'?.70:.94,context?.().mask??1,.065);
  }
  function fire(){
    if(!isActive()||selected<0||swap||!equipmentAllowed())return false;
    const n=style[selected],weapon=states[selected];
    if(!weapon.rounds&&dryLatched)return false;
    camera.updateWorldMatrix(true,false);
    wallDistance=measureWall(n);
    if(wallDistance<.36){notice='Mündung blockiert';noticeUntil=clock+.23;return false;}
    const result=weapon.fire(clock);
    if(result==='dry'){
      dryLatched=true;onAction(n.kind,'dry');notice=weapon.reserve?'Leer · Nachladen':'Keine Reserve';noticeUntil=clock+.58;refresh();
    }
    if(result!=='fire')return false;
    if(clock-lastShot>.28)burst=0;
    lastShot=clock;serial++;burst++;
    const side=n.automatic?[.08,.24,.36,.63,.32,-.54,-.72,-.36][Math.min(burst-1,7)]*(burst>8?Math.cos((burst-8)*.49):1):
      (serial%2?.45:-.42);
    const brace=(1-ads*.24)*(1-(player.motion.crouch??0)*.17);
    kickback.push(n.recoil*52*brace);tiltSpring.push(n.recoil*48*brace);
    pitchSpring.push(n.recoil*(n.kind==='shotgun'?24:19)*brace);yawSpring.push(n.recoil*11*side*brace);
    rollSpring.push(n.recoil*16*side*brace);
    onFire(n.kind);
    syncProjection();camera.updateWorldMatrix(true,false);camera.getWorldPosition(origin);
    aimScreen.set(0,0);
    projector.setFromCamera(aimScreen,camera);
    if(n.kind==='bow'){
      // Convert viewmodel muzzle pixels to world space at the same camera depth.
      muzzle.fromArray(n.emit).applyQuaternion(held.quaternion).add(held.position);
      muzzle.x*=eye.projectionMatrix.elements[0]/camera.projectionMatrix.elements[0];
      muzzle.y*=eye.projectionMatrix.elements[5]/camera.projectionMatrix.elements[5];
      muzzle.applyQuaternion(camera.getWorldQuaternion(headQ)).add(origin);
      fx.launch(origin,muzzle,projector.ray.direction,n);
      flash.visible=false;
    }else{
      if(n.kind!=='shotgun'&&n.kind!=='archive')eject(n);
      flash.position.fromArray(n.emit);flash.visible=true;flash.rotation.z=(serial*2.39996)%6.28318;
      fx.beginVolley();let nearest=Infinity,material;
      for(let i=0;i<n.pattern;i++){
        const az=(i-1)*Math.PI*.5+serial*2.39996,
          fan=(n.pattern===1?.56:i===0?0:i%2?.82:1)*n.spread*(1-ads*.55)*
            (1+.71*running-.22*(player.motion.crouch??0)+(n.automatic?Math.min(burst-1,9)*.13:0));
        screen.set(aimScreen.x+Math.cos(az)*fan,aimScreen.y+Math.sin(az)*fan*camera.aspect);
        projector.setFromCamera(screen,camera);
        const hit=fx.pellet(projector.ray,n);
        if(hit&&hit.distance<nearest){nearest=hit.distance;material=hit.material;projector.ray.at(nearest,contact);}
      }
      fx.endVolley(n);
      if(nearest!==Infinity)onContact(contact,n.kind,material);
    }
    refresh();return true;
  }
  function reload(){
    if(!isActive()||selected<0||swap||!equipmentAllowed())return false;
    if(!states[selected].reload(clock))return false;
    dryLatched=false;noticeUntil=0;refresh();return true;
  }
  function cycle(direction=1){
    if(!isActive()||!equipmentAllowed())return;
    const current=swap?pending:selected;
    select(owned[(owned.indexOf(current)+Math.sign(direction)+owned.length)%owned.length]);
  }
  const touchReady=()=>isActive()&&selected>=0&&!swap&&equipmentAllowed();
  function touchTrigger(pressed){
    if(!pressed){touchHeld=false;dryLatched=false;return false;}
    if(touchHeld||!touchReady())return false;
    touchHeld=true;dryLatched=false;fire();
    return true;
  }
  const relevant=e=>isActive()&&(document.pointerLockElement===canvas||e.target===canvas);
  window.addEventListener('mousedown',e=>{
    if(e.sourceCapabilities?.firesTouchEvents||document.body.dataset.input==='touch'||!relevant(e)||!equipmentAllowed())return;
    if(e.button===2&&selected>=0){e.preventDefault();aiming=true;refresh();}
    else if(e.button===0&&!leftHeld){
      leftHeld=selected>=0&&!swap;dryLatched=false;fire();
    }
  });
  window.addEventListener('mouseup',e=>{if(e.button===0)leftHeld=false;if(e.button===2){aiming=false;refresh();}});
  window.addEventListener('keydown',e=>{
    if(e.code==='KeyR'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&isActive()&&
      !e.target.closest?.('button,input,select,textarea,a')){e.preventDefault();reload();}
  });
  window.addEventListener('pointercancel',()=>{leftHeld=aiming=false;refresh();});
  window.addEventListener('blur',()=>{leftHeld=touchHeld=aiming=false;});
  document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas)leftHeld=aiming=false;});
  canvas.addEventListener('contextmenu',e=>{if(isActive())e.preventDefault();});
  window.addEventListener('wheel',e=>{
    if(e.ctrlKey||document.body.dataset.input==='touch'||!relevant(e)||!e.deltaY||!equipmentAllowed())return;
    e.preventDefault();
    const now=performance.now(),raw=e.deltaY*(e.deltaMode===1?17:e.deltaMode===2?120:1);
    if(now-wheelAt>160||Math.sign(wheel)!==Math.sign(raw))wheel=0;
    wheelAt=now;wheel+=Math.max(-110,Math.min(110,raw));
    if(Math.abs(wheel)<39||now-wheelStepAt<108)return;
    const sign=Math.sign(wheel);
    wheel=0;wheelStepAt=now;cycle(sign);
  },{passive:false});
  function update(now){
    const elapsed=t0===null?0:Math.max(0,(now-t0)/1000),dt=Math.min(.05,elapsed);t0=now;clock+=Math.min(.12,elapsed);
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
    if(!permitted&&wasPermitted){leftHeld=touchHeld=aiming=false;fx.clear();flash.visible=false;}
    wasPermitted=permitted;
    let holster=0;
    if(swap){
      const age=clock-swap.at;
      if(age>=swap.down&&!swap.shown){display(pending);swap.shown=true;}
      if(age>=swap.down+swap.up){display(pending);swap=null;}
      else holster=age<swap.down?smooth(age/swap.down):1-smooth((age-swap.down)/swap.up);
    }
    const index=Math.max(0,selected),n=style[index],device=devices[index],pose=rig.hands[index];
    const action=states[index],armed=selected>=0&&permitted&&isActive();
    if(armed){
      action.update(clock,cue=>{
        onAction(n.kind,cue);
        if((cue==='open'&&n.kind==='shotgun')||cue==='archive-open')eject(n);
      });
      if(clock>=nextWall){
        nextWall=clock+.085;camera.updateWorldMatrix(true,false);wallDistance=measureWall(n);
      }
    }
    const visual=action.visual(clock);
    let age=visual.age;
    const loading=visual.reload>=0?smooth(visual.reload/.16)*(1-smooth((visual.reload-.83)/.17)):0;
    const handling=loading||(n.kind==='shotgun'?.57*smooth((age-.12)/.18)*(1-smooth((age-.59)/.16)):0);
    wall=relax(wall,armed?1-smooth((wallDistance-.25)/.57):0,17,dt);
    const oldAds=ads,aim=aiming&&permitted&&!swap&&selected>=0?1:0;
    const targetAds=aim*(1-handling*.94)*(1-running*.67)*(1-wall);
    ads=relax(ads,targetAds,aim?17:12,dt);
    if(Math.abs(ads-targetAds)<.00005)ads=targetAds;
    const kick=kickback.step(dt),rise=tiltSpring.step(dt),punch=pitchSpring.step(dt),yawKick=yawSpring.step(dt),roll=rollSpring.step(dt);
    const comfort=reduced?.20:1,rest=1-ads,
      sway=Math.sin(step)*moving*(1-ads*.95)*n.weight,bob=Math.cos(step*2)*moving*(1-ads*.95)*n.weight;
    const breath=Math.sin(clock*2.04)*.0035*comfort*(1-.90*ads);
    const lookDown=smooth((-camera.parent.rotation.x-.78)/.52)*rest;
    camera.position.y=(bob*.013*(1+running*.35)-landing*.035)*comfort;
    camera.rotation.set(punch*comfort,yawKick*comfort,strafe*.007*comfort+roll*.32*comfort);
    syncProjection();
    if(selected>=0){
    held.rotation.set(-.039*rest+sway*.020*comfort+rise*1.31-holster*.74-lookDown*.26-handling*.141+breath-wall*.48,
      n.yaw*rest+inertia*.008*rest+sway*.011*comfort+.069*handling+yawKick*1.7+wall*.12,
      -strafe*.037*rest+holster*.23+running*.105*rest-.025*rest-.12*handling+roll*1.3);
    sightAnchor.fromArray(n.sight).applyQuaternion(held.quaternion);
    held.position.set((n.hold[0]+running*.042)*rest+sway*.013*comfort*rest-inertia*.005*rest-sightAnchor.x*ads,
      n.hold[1]*rest-sightAnchor.y*ads+(bob*.012*comfort-landing*.020*comfort-(grounded?0:.032))*rest-
      running*.070*rest-holster*.41-lookDown*.19+breath*.8-wall*.071,
      n.hold[2]+ads*.052+kick+holster*.020+wall*.08);
      device.animate(age,visual);
      const support=pose.nodes[0];
      support.position.fromArray(n.fore).add(device.left);
      support.rotation.set(-.34*handling,.16*handling,-.29*handling);
      for(const [i,a] of arms.entries()){
        const node=pose.nodes[i];
        a.wrist.copy(pose.wrists[i]).applyQuaternion(node.quaternion).add(node.position).applyQuaternion(held.quaternion).add(held.position);
        a.elbow.set(a.side*(i===1?.277:.251)+.128*rest,-.428+bob*.020*comfort-holster*.16,-.226);
        a.end.copy(a.wrist).lerp(a.elbow,.042);
        link(a.forearm,a.elbow,a.end,.128,.111);a.wrap.position.copy(a.wrist).lerp(a.elbow,.067);
        a.wrap.scale.set(.082,.074,.073);a.wrap.quaternion.copy(a.forearm.quaternion);
      }
    }
    const changingBody=body.update({step,moving,running,strafe,grounded,landing,pitch:camera.parent.rotation.x,crouch:player.motion.crouch});
    let effect=permitted&&fx.tick(dt);
    if((leftHeld||touchHeld)&&n.automatic&&visual.phase!=='cycling'&&visual.phase!=='reloading'&&fire()){age=0;effect=true;}
    for(const c of cases){
      if(!c.o.visible)continue;
      c.age+=dt;effect=true;
      if(c.age>.33){c.o.visible=false;continue;}
      c.v.y-=4.7*dt;c.o.position.addScaledVector(c.v,dt);
      c.o.rotation.x+=dt*14;c.o.rotation.z-=dt*19;
    }
    if(flash.visible){
      effect=true;
      const width=n.kind==='shotgun'?.053:n.kind==='archive'?.046:n.kind==='pistol'?.026:.034,
        fade=1-age/(n.kind==='shotgun'||n.kind==='archive'?.059:.041),k=Math.max(0,fade);
      if(fade<=0)flash.visible=false;
      else{
        spark.scale.set(width*k*.51,width*k*.41,width*k*(n.kind==='rifle'?1.92:1.18));
        sparkSide.scale.set(width*k,width*k*.35,width*k*.41);sparkSide.rotation.z=age*103;
        shine.opacity=.81*k;shine.color.setHex(n.kind==='shotgun'?0xe5a245:n.kind==='pistol'?0xffb55d:0xffdfa1);
      }
    }
    paintHud(armed,action.visual(clock),action);
    if(armed&&(age<n.recovery||visual.reload>=0||wall>.001))effect=true;
    const breatheFrame=permitted&&selected>=0&&!reduced&&Math.floor(clock*24)!==Math.floor((clock-dt)*24);
    return changingBody||delta>.0001||moving>.001||Math.abs(inertia)>.003||Math.abs(oldAds-ads)>.0003||
      Math.abs(kick)+Math.abs(rise)+Math.abs(punch)+Math.abs(yawKick)+Math.abs(roll)>.0001||effect||
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
    leftHeld=touchHeld=aiming=false;ads=0;t0=null;moving=running=strafe=inertia=0;wheel=0;swap=null;display(pending);
    states[selected]?.cancel();clearRecoil();noticeUntil=hitUntil=0;dryLatched=false;
    for(const c of cases)c.o.visible=false;
    camera.position.y=0;camera.rotation.set(0,0,0);syncProjection();flash.visible=false;refresh();
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
    flash.visible=true;cases[0].o.visible=true;stage.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    try{
      await r.compileAsync(stage,eye);
      r.setViewport(0,0,32,32);r.setScissor(0,0,32,32);r.setScissorTest(true);r.render(stage,eye);
    }finally{
      display(selected);flash.visible=false;cases[0].o.visible=false;for(const [o,v] of meshes)o.frustumCulled=v;
      r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);
    }
  }
  update(performance.now());
  return {update,draw,preset,stop,collect,pickupModel,prepare,cycle,touchTrigger,touchReady,reload,
    canReload:()=>touchReady()&&!states[selected].isLoading&&states[selected].rounds<states[selected].capacity&&states[selected].reserve>0,
    restock(){
      let count=0;
      for(const i of owned)if(i>=0)count+=states[i].restock();
      if(count){onAction(style[selected]?.kind,'equip');notice='Reserve aufgefüllt';noticeUntil=clock+1.2;refresh();}
      return count>0;
    },
    selectionName:()=>names[swap?pending:selected]??'Ohne Waffe',
    grantBowBolts(count){states[0].addReserve(count);refresh();},
    clearShots:fx.clear,showPrewarmShots:fx.showPrewarm,bodyLayer:body.layer};
}
