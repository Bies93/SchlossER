import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// A stylized museum-game rig, not a model of a real weapon. Its short visual
// pulses affect only the authored abstract markers, never the world meshes.
export function makeViewmodel(T,scene,camera,player,world,floorHeight,canvas,isActive,refresh){
  const stage=new T.Scene(),eye=new T.PerspectiveCamera(53,1,.045,6);
  const h=new T.HemisphereLight(0xf5ede1,0x788994,2.1),key=new T.DirectionalLight(0xf7dcac,1.65);
  key.position.set(-1,.9,.6);stage.add(h,key);
  const hands=new T.Group(),held=new T.Group();hands.add(held);stage.add(hands);
  const mat=(color,roughness=.66,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const fabric=mat(0x353b45,.92),trouser=mat(0x3b4852,.92),leather=mat(0x2a2b2c,.84),skin=mat(0x947966,.78);
  const frame=mat(0x555b5b,.64,.27),grip=mat(0x292f31,.85),accent=mat(0xb27c50,.46,.34);
  const body=new T.Group();body.name='Ego-Körper · sichtbare Beine';player.body.add(body);
  const cube=new T.BoxGeometry(1,1,1),shell=new RoundedBoxGeometry(1,1,1,2,.105),
    cap=new T.CapsuleGeometry(.5,1.0,4,8);
  const axis=new T.Vector3(0,1,0);
  function shape(parent,geom,material,x,y,z,sx,sy,sz){
    const o=new T.Mesh(geom,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
    o.receiveShadow=false;o.castShadow=false;parent.add(o);return o;
  }
  function link(node,a,b,width,depth=width){
    node.position.copy(a).lerp(b,.5);
    const dir=b.clone().sub(a),length=dir.length();
    node.scale.set(width,length*.53,depth);node.quaternion.setFromUnitVectors(axis,dir.normalize());
  }
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  const arms=[-1,1].map(side=>{
    const sleeve=shape(hands,cap,fabric,0,0,0,.16,.28,.15);
    const glove=shape(hands,cap,skin,0,0,0,.103,.107,.085);
    return {side,sleeve,glove};
  });
  shape(body,cap,trouser,0,.96,.060,.33,.22,.26);
  const legs=[-1,1].map(side=>({
    side,
    thigh:shape(body,cap,trouser,0,0,0,.18,.22,.16),
    shin:shape(body,cap,trouser,0,0,0,.13,.21,.12),
    shoe:shape(body,shell,leather,0,.056,0,.132,.102,.231),
    toe:shape(body,cap,leather,0,.057,0,.138,.12,.090)
  }));
  const style=[
    {color:0x58cddd,case:0x50635e,width:.102,length:.23,kind:0},
    {color:0xe8a973,case:0x726052,width:.135,length:.285,kind:1},
    {color:0xb7a9f1,case:0x54566c,width:.113,length:.32,kind:2}
  ];
  const modules=style.map(s=>{
    const group=new T.Group();held.add(group);
    const paint=mat(s.case,.56,.19),led=new T.MeshBasicMaterial({color:s.color});
    shape(group,shell,paint,0,.013,-s.length*.35,s.width,.106,s.length);
    shape(group,shell,frame,0,-.043,-.061,s.width*.88,.033,s.length*.61);
    const stalk=shape(group,shell,grip,0,-.105,.005,s.width*.70,.139,.079);stalk.rotation.x=-.22;
    shape(group,shell,accent,0,-.036,-.081,s.width*.72,.024,.084);
    shape(group,shell,frame,0,.025,s.length*.157,s.width*.59,.061,.021);
    shape(group,shell,led,0,.027,s.length*.203,s.width*.24,.017,.007);
    const nozzle=shape(group,new T.CylinderGeometry(.5,.5,1,10),accent,0,.009,-s.length*.89,s.width*.84,.038,s.width*.84);
    nozzle.rotation.x=Math.PI/2;
    const optic=shape(group,new T.CylinderGeometry(.5,.5,1,12),led,0,.011,-s.length*.975,s.width*.54,.012,s.width*.54);
    optic.rotation.x=Math.PI/2;
    for(const x of [-s.width*.32,s.width*.32])
      shape(group,shell,grip,x,.078,.006,.016,.028,.030);
    shape(group,cube,led,0,.081,-s.length*.76,.012,.018,.016);
    if(s.kind===1)for(const side of [-1,1]){
      shape(group,cube,accent,side*s.width*.51,.019,-.088,.021,.055,.104);
    }
    if(s.kind===2)for(let i=0;i<3;i++){
      shape(group,cube,led,s.width*.514,.012,-.098-i*.041,.006,.026,.014);
    }
    return group;
  });
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
  let selected=0,aiming=false,ads=0,kick=0,step=0,t0=null,pressed=0,flight=null,recent=0;
  const previous=player.body.position.clone(),from=V(0,0,0),dir=V(0,0,0),hit=V(0,0,0);
  const headQ=new T.Quaternion(),ray=new T.Ray(),end=V(0,0,0),old=V(0,0,0);
  let moving=0;
  function select(n){selected=n;modules.forEach((m,i)=>m.visible=i===n);kick=0;refresh()}
  select(matchMedia('(pointer:coarse)').matches?-1:0);
  function pulse(){
    if(selected<0)return;
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
    const start=from.clone().add(V(.228*(1-ads),-.223+ads*.139,-.68).applyQuaternion(headQ));
    flight={start,end:end.clone(),target,at:age,duration:155+distance*10,style:selected};
    trailMat.color.setHex(style[selected].color);
    refresh();
  }
  const relevant=e=>isActive()&&(document.pointerLockElement===canvas||e.target===canvas);
  window.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||!relevant(e))return;
    if(e.button===2&&selected>=0){e.preventDefault();aiming=true;refresh()}
    else if(e.button===0){pulse()}
  });
  window.addEventListener('pointerup',e=>{if(e.button===2){aiming=false;refresh()}});
  window.addEventListener('pointercancel',()=>{aiming=false});
  canvas.addEventListener('contextmenu',e=>{if(isActive())e.preventDefault()});
  window.addEventListener('keydown',e=>{
    if(!isActive()||e.ctrlKey||e.altKey||e.metaKey)return;
    if(/^Digit[0123]$/.test(e.code)){e.preventDefault();aiming=false;select(Number(e.code.slice(-1))-1)}
  });
  function update(now){
    const dt=t0===null?1/60:Math.min(.045,(now-t0)/1000);t0=now;
    const delta=previous.distanceTo(player.body.position);previous.copy(player.body.position);
    const target=Math.min(1,delta/Math.max(dt,.001)/5.8);
    moving+=(target-moving)*Math.min(1,dt*13);
    if(delta>.0002)step+=delta*5.8;
    const oldAds=ads;ads+=((aiming?1:0)-ads)*Math.min(1,dt*16);
    const oldKick=kick;kick*=Math.exp(-dt*16);
    const sway=Math.sin(step)*moving*(1-ads*.65),bob=Math.cos(step*2)*moving;
    held.position.set(.228*(1-ads)+sway*.027,-.232+ads*.148+bob*.009,-.58+kick);
    held.rotation.x=-.035+sway*.026+kick*2.04;
    held.rotation.y=(1-ads)*.05+sway*.031;
    for(const a of arms){
      const side=a.side;
      const elbow=V(side*.26+(1-ads)*.14,-.418+bob*.013,-.27);
      const hand=held.position.clone().add(V(side===1?.019:-.045,side===1?-.077:-.055,side===1?.028:-.072));
      link(a.sleeve,elbow,hand,.130,.132);a.glove.position.copy(hand);
      a.glove.rotation.set(.40,side*.43,side*.21);
    }
    for(const leg of legs){
      const q=step+(leg.side<0?0:Math.PI),stride=Math.sin(q)*moving,lift=Math.max(0,Math.cos(q))*moving*.104,x=leg.side*.122;
      const k=V(x,.49+lift*.44,-.105-stride*.105),
        ankle=V(x,.107+lift,.008-stride*.182);
      link(leg.thigh,V(x,.915,.046),k,.160,.16);link(leg.shin,k,ankle,.116,.135);
      leg.shoe.position.set(x,.065+lift,ankle.z-.045);leg.toe.position.set(x,.062+lift,ankle.z-.140);
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
    return delta>.0001||moving>.001||Math.abs(oldAds-ads)>.0003||oldKick>.0001||effect;
  }
  function draw(renderer){
    if(!isActive()||selected<0)return;
    eye.aspect=camera.aspect;eye.fov=camera.aspect<.8?59:53;eye.updateProjectionMatrix();
    const reset=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();
    renderer.render(stage,eye);renderer.autoClear=reset;
  }
  function preset(id){
    h.intensity=id==='night'?.84:id==='dusk'?1.35:2.1;
    key.intensity=id==='night'?.46:id==='dusk'?1.38:1.65;
    key.color.setHex(id==='night'?0x9baec8:id==='dusk'?0xffc698:0xf7dcac);
  }
  function stop(){aiming=false;ads=0;t0=null;moving=0;flight=null;orb.visible=ribbon.visible=false;recent=0;for(const a of anchors){a.timer=0;a.face.material.emissiveIntensity=.10};refresh()}
  update(performance.now());
  return {update,draw,preset,stop};
}
