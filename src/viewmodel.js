import {egoAssets,EQUIPMENT as style} from './ego-assets.js';
import {makeEgoBody} from './ego-body.js';

// Gameplay pulses affect only fictional creatures and authored light
// markers. The architecture and other world meshes are never affected.
export function makeViewmodel(T,scene,camera,player,world,floorHeight,canvas,isActive,refresh,equipmentAllowed=()=>true,creatures=null,onPulse=()=>{},onContact=()=>{}){
  const stage=new T.Scene(),eye=new T.PerspectiveCamera(53,1,.045,6);
  const h=new T.HemisphereLight(0xe6eaf0,0x839098,1.24),key=new T.DirectionalLight(0xf7dcac,1.38),
    rim=new T.DirectionalLight(0xb5c8dc,.62);
  key.position.set(-1,1.4,.45);rim.position.set(1.2,.65,-1);stage.add(h,key,rim);
  const hands=new T.Group(),held=new T.Group();hands.add(held);stage.add(hands);
  const rig=egoAssets(T),{cap,shell}=rig.geometry,{frame,sleeve,cuff}=rig.materials;
  const body=makeEgoBody(T,player.body);
  const V=(x,y,z)=>new T.Vector3(x,y,z),axis=V(0,1,0),linkDir=V(0,0,0);
  function shape(parent,geo,material,x,y,z,sx,sy,sz){
    const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
  }
  function link(node,a,b,width,depth=width){
    node.position.copy(a).lerp(b,.5);
    linkDir.subVectors(b,a);const length=linkDir.length();
    node.scale.set(width,length*.53,depth);node.quaternion.setFromUnitVectors(axis,linkDir.normalize());
  }
  const arms=[-1,1].map(side=>{
    const forearm=shape(hands,cap,sleeve,0,0,0,.14,.28,.12);
    const wrap=shape(hands,shell,cuff,0,0,0,.082,.072,.073);
    return {side,forearm,wrap,
      wrist:V(0,0,0),elbow:V(0,0,0),end:V(0,0,0)};
  });
  const modules=rig.devices;held.add(...modules);
  const {poses,wrists}=rig.hands;held.add(...poses);
  const rangeObjects=new T.Group();rangeObjects.name='Ghoul-Modus · Übungsmarken und Impulse';scene.add(rangeObjects);
  // Three authored hard-surface markers in one side area of the square.
  const anchors=[[57.1,47.7],[62.5,49.2],[65.7,53.7]].map(([x,z])=>{
    const y=floorHeight(x,z),center=V(x,y+.88,z);
    const stand=shape(rangeObjects,new T.CylinderGeometry(.045,.11,1,9),frame,x,y+.42,z,1,.84,1);
    stand.name='Optionale Impulsmarke';
    const surface=new T.MeshStandardMaterial({color:0x586f6c,roughness:.40,metalness:.22,
      emissive:0x54b5bb,emissiveIntensity:.10});
    const face=shape(rangeObjects,new T.IcosahedronGeometry(.125,1),surface,x,center.y,z,1,1,1);
    return {center,face,timer:0,sphere:new T.Sphere(center,.19)};
  });
  const luminous=(opacity=.8)=>new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity,
    depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const bead=new T.SphereGeometry(1,10,7),beam=new T.CylinderGeometry(1,.32,1,7);
  const ring=new T.RingGeometry(.77,1,18);
  const ball=new T.IcosahedronGeometry(1,0);
  const zAxis=V(0,0,1);
  const pixels=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const r=Math.hypot(x-31.5,y-31.5)/31.5,a=(y*64+x)*4;
    pixels.set([255,255,255,Math.round(255*Math.max(0,1-r)**2.55)],a);
  }
  const bloom=new T.DataTexture(pixels,64,64);
  bloom.magFilter=bloom.minFilter=T.LinearFilter;bloom.needsUpdate=true;
  function sprite(parent){
    const mat=new T.SpriteMaterial({map:bloom,color:0xffffff,opacity:.8,transparent:true,
      depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
    const s=new T.Sprite(mat);parent.add(s);return s;
  }
  const fxProfiles=[
    {core:.012,length:.056,tail:.49,halo:.116,flash:103,bloom:.185},
    {core:.009,length:.109,tail:1.02,halo:.149,flash:89,bloom:.230},
    {core:.007,length:.028,tail:.36,halo:.066,flash:123,bloom:.247}
  ];
  const traces=Array.from({length:5},()=>{
    const moving=new T.Group(),impact=new T.Group();rangeObjects.add(moving,impact);
    const orb=shape(moving,bead,luminous(),0,0,0,1,1,1),ribbon=shape(moving,beam,luminous(.37),0,0,0,1,1,1),
      glow=sprite(moving),shock=shape(impact,ring,luminous(.64),0,0,0,1,1,1);
    const shards=Array.from({length:5},()=>shape(impact,ball,luminous(.75),0,0,0,1,1,1));
    moving.visible=impact.visible=false;
    shock.material.side=T.DoubleSide;
    return {moving,impact,orb,ribbon,glow,shock,shards,start:V(0,0,0),end:V(0,0,0),axis:V(0,0,0),until:0,impactTime:0};
  });
  const flash=new T.Group();held.add(flash);
  const flashBody=shape(flash,bead,luminous(),0,0,-.012,1,1,1),
    flashDisc=shape(flash,ring,luminous(.7),0,0,-.008,1,1,1),flashHalo=sprite(flash);
  flashDisc.material.side=T.DoubleSide;
  flash.visible=false;
  let flashProfile=fxProfiles[0];
  let selected=-1,pending=-1,swap=null,aiming=false,ads=0,kick=0,step=0,t0=null,pressed=-1000,recent=0;
  let arrivals=[];
  const previous=player.body.position.clone(),deltaPos=V(0,0,0),from=V(0,0,0),dir=V(0,0,0),hit=V(0,0,0);
  const headQ=new T.Quaternion(),projector=new T.Raycaster(),ray=projector.ray,old=V(0,0,0);
  const sightAnchor=V(0,0,0),projected=V(0,0,0),emit=V(0,0,0),
    aimScreen=new T.Vector2(),screen=new T.Vector2();
  const smooth=t=>t*t*(3-2*t),relax=(v,d,k,dt)=>v+(d-v)*(1-Math.exp(-k*dt));
  let moving=0,running=0,strafe=0,inertia=0,previousYaw=player.body.rotation.y,wheel=0,wheelAt=0,wheelStepAt=-1000;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function display(n){selected=n;modules.forEach((m,i)=>{m.visible=poses[i].visible=i===n})}
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
  function syncProjection(){
    const fov=(camera.aspect<.8?60:54)-ads*4;
    if(eye.fov!==fov||eye.aspect!==camera.aspect){
      eye.fov=fov;eye.aspect=camera.aspect;eye.updateProjectionMatrix();
    }
  }
  function clearPulses(){
    arrivals.length=0;
    for(const t of traces){t.until=t.impactTime=0;t.moving.visible=t.impact.visible=false}
    flash.visible=false;
  }
  function pulse(){
    if(selected<0||swap||!equipmentAllowed())return;
    const age=performance.now(),n=style[selected];
    if(age-pressed<(n.pattern>1?240:145))return;
    pressed=age;
    onPulse(selected);
    syncProjection();
    camera.getWorldPosition(from);camera.getWorldQuaternion(headQ);
    aimScreen.set(0,0);
    if(aiming||ads>.67){
      projected.fromArray(n.sight).applyQuaternion(held.quaternion).add(held.position).applyMatrix4(eye.projectionMatrix);
      aimScreen.set(projected.x,projected.y);
    }
    // The viewmodel and world use different lenses. Match the displayed
    // emitter's pixel by transferring its camera-space depth between them.
    emit.fromArray(n.emit).applyQuaternion(held.quaternion).add(held.position);
    emit.x*=eye.projectionMatrix.elements[0]/camera.projectionMatrix.elements[0];
    emit.y*=eye.projectionMatrix.elements[5]/camera.projectionMatrix.elements[5];
    emit.applyQuaternion(headQ);
    flashProfile=fxProfiles[selected];
    flashDisc.material.color.setHex(n.color);flashHalo.material.color.setHex(n.color);
    flash.position.fromArray(n.emit);flash.visible=true;
    const strike=new Map();
    let audible=null;
    for(const [i,t] of traces.entries()){
      t.until=t.impactTime=0;t.moving.visible=t.impact.visible=false;
      if(i>=n.pattern)continue;
      const a=i*2.4+age*.008,fan=i===0?0:.021+i*.004;
      screen.set(aimScreen.x+Math.cos(a)*fan,aimScreen.y+Math.sin(a)*fan*camera.aspect);
      projector.setFromCamera(screen,camera);dir.copy(ray.direction);
      let target=null,creature=null,solid=false,distance=n.pattern===1?18.8:15.6;
      for(const item of anchors){
        if(!ray.intersectSphere(item.sphere,hit))continue;
        const d=from.distanceTo(hit);if(d<distance){distance=d;target=item}
      }
      const candidate=creatures?.nearest(ray,distance);
      if(candidate){distance=candidate.distance;creature=candidate.actor;target=null}
      // Limit the trace before committing a hit, regardless of whether the
      // nearest candidate is a creature or one of the old light markers.
      for(let d=.24;d<distance;d+=.17){
        ray.at(d,hit);
        if(world.blocked(hit.x,hit.z)||(dir.y<-.12&&hit.y<floorHeight(hit.x,hit.z)+.035)){
          distance=Math.max(.32,d-.06);creature=target=null;solid=true;break;
        }
      }
      t.end.copy(from).addScaledVector(dir,distance);
      t.start.copy(from).addScaledVector(emit,Math.min(1,distance*.72/Math.max(.1,emit.length())));
      t.at=age;t.until=distance<.46?0:age+108+distance*(n.pattern===1?8.4:7.3)+i*4;
      t.axis.subVectors(t.end,t.start).normalize();
      t.profile=flashProfile;t.impactTime=t.until&&(solid||target||creature)?t.until:0;
      if(t.impactTime&&(!audible||t.impactTime<audible.impactTime))audible=t;
      t.impact.position.copy(t.end).addScaledVector(t.axis,-.045);
      t.impact.quaternion.setFromUnitVectors(zAxis,t.axis);
      t.orb.material.color.set(0xffffff).lerp(new T.Color(n.color),.32);
      for(const m of [t.glow.material,t.ribbon.material,t.shock.material])m.color.setHex(n.color);
      for(const [j,shard] of t.shards.entries())shard.material.color.set(0xffffff).lerp(t.shock.material.color,j*.15);
      if(target)arrivals.push({target,at:t.until,color:n.color});
      if(creature){
        const gathered=strike.get(creature);
        if(gathered)gathered.amount+=n.impact;
        else strike.set(creature,{amount:n.impact,point:candidate.point});
      }
    }
    if(audible)arrivals.push({point:audible.end.clone(),kind:selected,at:audible.impactTime});
    // Process one combined hit per creature per click. Tracer animation
    // can never deal damage on subsequent frames.
    for(const [creature,{amount,point}] of strike)creatures.damage(creature,amount,n.color,point);
    kick=.032+selected*.010;
    refresh();
  }
  const relevant=e=>isActive()&&(document.pointerLockElement===canvas||e.target===canvas);
  // Pointer Events fire pointerdown/up only as the first/last mouse
  // button changes state. Mouse Events report both edges of each button.
  window.addEventListener('mousedown',e=>{
    if(e.sourceCapabilities?.firesTouchEvents||document.body.dataset.input==='touch'||!relevant(e)||!equipmentAllowed())return;
    if(e.button===2&&selected>=0){e.preventDefault();aiming=true;refresh()}
    else if(e.button===0){pulse()}
  });
  window.addEventListener('mouseup',e=>{if(e.button===2){aiming=false;refresh()}});
  window.addEventListener('pointercancel',()=>{aiming=false;refresh()});
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
    const elapsed=t0===null?1/60:(now-t0)/1000,dt=Math.min(.045,elapsed);t0=now;
    deltaPos.subVectors(player.body.position,previous);previous.copy(player.body.position);
    const delta=Math.hypot(deltaPos.x,deltaPos.z),speed=player.motion?.speed??delta/Math.max(dt,.001),yaw=player.body.rotation.y;
    const grounded=player.motion?.grounded??true,landing=player.motion?.land??0;
    const relative=(deltaPos.x*Math.cos(yaw)-deltaPos.z*Math.sin(yaw))/Math.max(.001,dt);
    const dyaw=Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));previousYaw=yaw;
    moving=relax(moving,grounded?Math.min(1,speed/2.75):0,12,dt);
    running=relax(running,T.MathUtils.clamp((speed-3.28)/2.5,0,1),9,dt);
    strafe=relax(strafe,T.MathUtils.clamp(relative/3.3,-1,1),11,dt);
    inertia=relax(inertia,T.MathUtils.clamp(dyaw/Math.max(.001,dt),-4,4),21,dt);
    if(grounded)step+=delta*(5.05-running*.82);
    let holster=0,transition=!!swap;
    if(swap){
      const age=now-swap.at;
      if(age>=swap.down&&!swap.shown){display(pending);swap.shown=true}
      if(age>=swap.down+swap.up){display(pending);swap=null}
      else holster=age<swap.down?smooth(age/swap.down):1-smooth((age-swap.down)/swap.up);
    }
    const permitted=equipmentAllowed();
    if(!permitted){aiming=false;clearPulses()}
    const oldAds=ads;ads=relax(ads,aiming&&!swap&&selected>=0?1:0,17,Math.min(.18,elapsed));
    const oldKick=kick;kick*=Math.exp(-dt*17);
    const n=style[Math.max(0,selected)],sway=Math.sin(step)*moving*(1-ads*.93),
      bob=Math.cos(step*2)*moving*(1-ads*.89),comfort=reduced?.18:1,rest=1-ads;
    const lookDown=smooth(T.MathUtils.clamp((-camera.parent.rotation.x-.78)/.52,0,1))*rest;
    camera.position.y=(bob*.013*(1+running*.38)-landing*.035)*comfort;camera.rotation.z=strafe*.007*comfort;
    held.rotation.set(-.045*rest+sway*.023*comfort+kick*1.98-holster*.76-lookDown*.25,
      n.yaw*rest+inertia*.008*rest+sway*.016*comfort,-strafe*.04*rest+holster*.23+running*.075*rest-.031*rest);
    sightAnchor.fromArray(n.sight).applyQuaternion(held.quaternion);
    held.position.set((n.hold[0]+running*.052)*rest+sway*.015*comfort*rest-(inertia*.006*rest)-sightAnchor.x*ads,
      n.hold[1]*rest-sightAnchor.y*ads+(bob*.012*comfort-landing*.020*comfort-(grounded?0:.032))*rest-running*.039*rest-holster*.41-lookDown*.20,
      n.hold[2]+ads*.054+kick+holster*.020);
    for(const [i,a] of arms.entries()){
      const driver=a.side===1,p=a.side;
      a.wrist.fromArray(wrists[Math.max(0,selected)][i]).applyQuaternion(held.quaternion).add(held.position);
      a.elbow.set(p*(driver?.275:.25)+rest*.13,-.424+bob*.021*comfort-holster*.16,-.237);
      a.end.copy(a.wrist).lerp(a.elbow,.049);
      link(a.forearm,a.elbow,a.end,.139,.128);a.wrap.position.copy(a.wrist).lerp(a.elbow,.077);
      a.wrap.quaternion.copy(a.forearm.quaternion);
    }
    const changingBody=body.update({step,moving,running,strafe,grounded,landing,pitch:camera.parent.rotation.x});
    let effect=recent>now, burst=1-(now-pressed)/flashProfile.flash;
    if(flash.visible){
      effect=true;flash.visible=burst>0;
      if(burst>0){
        const k=1-burst,s=flashProfile.bloom;
        flashBody.scale.set(s*.17*burst,s*.17*burst,s*.33*burst);
        flashDisc.scale.setScalar(s*(.19+k*.42));flashDisc.material.opacity=burst**2*.56;
        flashHalo.scale.setScalar(s*(.55+k*.47));flashHalo.material.opacity=burst*.86;
      }
    }
    for(const t of traces){
      if(t.until){
        effect=true;
        const k=Math.min(1,Math.max(0,(now-t.at)/(t.until-t.at))),p=t.profile;
        t.moving.visible=k<1;
        if(k>=1)t.until=0;
        else {
          t.orb.position.lerpVectors(t.start,t.end,k);
          t.orb.quaternion.setFromUnitVectors(zAxis,t.axis);
          t.orb.scale.set(p.core,p.core,p.length);
          t.glow.position.copy(t.orb.position);
          t.glow.scale.setScalar(p.halo);
          t.glow.material.opacity=.76;
          old.copy(t.orb.position).addScaledVector(t.axis,-Math.min(t.start.distanceTo(t.orb.position),p.tail));
          link(t.ribbon,old,t.orb.position,p.core*.66);
          t.ribbon.visible=t.ribbon.scale.y>.001;
        }
      }
      if(t.impactTime&&now>=t.impactTime){
        effect=true;
        const k=(now-t.impactTime)/165;t.impact.visible=k<1;
        if(k>=1)t.impactTime=0;
        else {
          const r=(.02+k*.16)*(t.profile===fxProfiles[1]?1.3:1);
          t.shock.scale.setScalar(r);t.shock.material.opacity=(1-k)*.60;
          for(const [j,shard] of t.shards.entries()){
            const a=j*2.39996+t.at*.016,travel=r*(.40+j*.18),size=(1-k)*(.010+j*.001);
            shard.position.set(Math.cos(a)*travel,Math.sin(a)*travel,-k*(.07+j*.017));
            shard.scale.set(size,size,size*1.6);shard.material.opacity=1-k;
          }
        }
      }
    }
    if(arrivals.length)arrivals=arrivals.filter(e=>{
      if(e.at>now)return true;
      if(e.point){onContact(e.point,e.kind);return false;}
      e.target.timer=now+440;e.target.face.material.emissive.setHex(e.color);recent=now+440;return false;
    });
    for(const a of anchors)a.face.material.emissiveIntensity=.10+Math.max(0,(a.timer-now)/420)*2.5;
    return changingBody||delta>.0001||moving>.001||Math.abs(inertia)>.003||Math.abs(oldAds-ads)>.0003||oldKick>.0001||effect||transition;
  }
  function draw(renderer){
    if(!isActive()||selected<0||!equipmentAllowed())return;
    syncProjection();
    const reset=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();
    renderer.render(stage,eye);renderer.autoClear=reset;
  }
  function preset(id){
    const night=id==='night';
    h.intensity=night?.66:1.24;
    key.intensity=night?.64:1.85;
    rim.intensity=night?.45:.74;
    key.color.setHex(night?0xaebed4:0xffddc1);
    // Share the already-generated evening/night probe; no separate capture.
    stage.environment=scene.environment;
    stage.environmentIntensity=night?.52:.85;
  }
  function stop(){
    aiming=false;ads=0;t0=null;moving=running=strafe=inertia=0;wheel=0;swap=null;display(pending);
    camera.position.y=camera.rotation.z=0;
    clearPulses();recent=0;for(const a of anchors){a.timer=0;a.face.material.emissiveIntensity=.10}refresh();
  }
  function setCombat(on){
    rangeObjects.visible=on;
    pending=on?0:-1;
    kick=0;pressed=-1000;
    stop();
  }
  update(performance.now());
  return {update,draw,preset,stop,setCombat,bodyLayer:body.layer};
}
