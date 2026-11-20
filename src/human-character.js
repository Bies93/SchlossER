import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {NPCS} from './npc-lines.js';

// GLB templates are loaded once; each actor has an independent skeleton and
// morph state. Rigs, outfits, profiles and game logic are separate layers.
const libraries=new WeakMap();
export function installHumans(T,asset){
  const models=new Map(asset.children.map(o=>[o.userData.name??o.name,o]));
  for(const id of ['base','ghoulA','ghoulB','ghoulC',...Object.keys(NPCS)])
    if(!models.has(id))throw Error('Human template missing: '+id);
  libraries.set(T,{models,materials:new Map(),present:[]});
}
export const humansAvailable=T=>libraries.has(T);
export const namedHumans=T=>libraries.get(T)?.present??[];
const cos=Math.cos,sin=Math.sin,tau=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t,frac=x=>x-Math.floor(x);
const wear={
  hubert:{skin:0xb5b8aa,weather:.96},
  ghoulA:{skin:0xabb5a4,cloth:0x786d54,weather:1,decay:1.0},
  ghoulB:{skin:0xb5c4bf,cloth:0x777f73,weather:.95,decay:.86},
  ghoulC:{skin:0xa8bdb0,cloth:0x786f6d,weather:.88,decay:.98},
  clubAda:{skin:0xffe8df,cloth:0xab78b4,hair:0x846251,shoe:0x504443},
  clubMira:{cloth:0x94c8c1,hair:0x695343,shoe:0xdbddda},
  clubNiko:{cloth:0xe4cba0,shoe:0x81614e},
  clubSami:{skin:0xffe6d3,cloth:0xe1b199},
  clubVeit:{cloth:0xe2c697,hair:0xb1a398},
  orbPriest:{skin:0xc3b6a1,hair:0xb8adb0,weather:.59},
  niklas:{skin:0xf7ece3},
  labAuer:{weather:.12},labHedwig:{weather:.08},labSepp:{weather:.27},
  guestBruno:{palette:[0x454b52,0x757460,0xc7ba9d],hair:0xbbb5a6,weather:.17},
  guestMarlene:{palette:[0x4b4b52,0x566477,0xd8cba9],hair:0x6c4e3b,weather:.09},
  guestSabine:{palette:[0x453f42,0x923f57,0xbba2a1],hair:0xa05a49,weather:.08},
  guestJona:{palette:[0x6d533b,0x526d66,0xb78248],hair:0x584d37,weather:.25},
  guestRike:{palette:[0x414a45,0x525846,0xa7453b],hair:0x53463c,weather:.23},
  guestEdda:{palette:[0x514747,0x767744,0xae7e55],hair:0x4b4240,weather:.16},
  guestLotte:{palette:[0x665368,0x83616b,0xcba38b],hair:0x635448,weather:.06}
};
function personalize(T,lib,id,base,eyeY){
  const key=id+':'+base.uuid;if(lib.materials.has(key))return lib.materials.get(key);
  const m=base.clone(),p=wear[id]??{},skin=/^Skin/.test(m.name),hair=/^Hair/.test(m.name),brow=/^Brow/.test(m.name),cloth=/^Cloth/.test(m.name),
    field=id==='hubert'&&/^(?:Cloth|Shoes|Pocket|Field|LinenBand|Helmet)/.test(m.name),
    formal=cloth&&(id==='niklas'||id==='orbPriest'),staff=cloth&&id.startsWith('lab'),
    copperHair=id==='niklas'&&(hair||brow),freckles=id==='niklas'&&skin,
    ritual=/^(?:Ritual|LabCoat|Apron|Visitor)/.test(m.name),
    visitor=cloth&&p.palette,vec=hex=>new T.Color(hex).toArray().map(x=>x.toFixed(4)).join(',');
  if(skin&&p.skin)m.color.multiply(new T.Color(p.skin));
  if(p.cloth&&cloth)m.color.multiply(new T.Color(p.cloth));
  if(p.hair&&(hair||brow))m.color.multiply(new T.Color(p.hair));
  if(p.shoe&&/^Shoes/.test(m.name))m.color.multiply(new T.Color(p.shoe));
  if(hair||brow){
    m.alphaTest=m.map?.isTexture?(brow?.36:.43):0;m.transparent=false;m.depthWrite=true;m.side=T.DoubleSide;
    if(!m.map)m.color.setHex(0x3c2c27);
  }
  if(/Helm|Cap|RitualCloth|FieldBelt|FieldJacketHem|LabCoatSkirts|Apron/.test(m.name))m.side=T.DoubleSide;
  if(skin||cloth||field||ritual||copperHair){
    m.customProgramCacheKey=()=> 'schlosser-humans-4-'+(skin?'skin':'cloth')+
      (field||formal||ritual||staff||visitor||copperHair?'-'+id+m.name:(skin&&p.decay)||freckles?'-'+id:'-'+(p.weather??0));
    m.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 castP;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\ncastP=position;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 castP;
        float castHash(vec3 p){return fract(sin(dot(p,vec3(17.13,42.91,71.1)))*14732.123);}
        float castNoise(vec3 p){vec3 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);
          return mix(mix(mix(castHash(i),castHash(i+vec3(1,0,0)),u.x),mix(castHash(i+vec3(0,1,0)),castHash(i+vec3(1,1,0)),u.x),u.y),
            mix(mix(castHash(i+vec3(0,0,1)),castHash(i+vec3(1,0,1)),u.x),mix(castHash(i+vec3(0,1,1)),castHash(i+vec3(1,1,1)),u.x),u.y),u.z);}
      `).replace('#include <color_fragment>',`#include <color_fragment>
        float castD=max(length(dFdx(castP)),length(dFdy(castP)));
        float castFine=(castNoise(castP*${skin?'545.':'360.'})-.5)*(1.-smoothstep(.001,.010,castD));
        float castDirt=smoothstep(.38,.75,castNoise(castP*vec3(21.,17.,24.))*.63+castNoise(castP*vec3(72.,52.,89.))*.37)*${(p.weather??0).toFixed(3)};
        ${cloth&&id==='hubert'?`
          float l=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
          float tunic=smoothstep(.83,1.04,castP.y);
          diffuseColor.rgb=mix(vec3(.050,.057,.051),vec3(.113,.139,.100),tunic)*(.54+l*1.23);
        `:''}
        ${formal?`
          float shade=dot(diffuseColor.rgb,vec3(.213,.715,.072));
          float bib=smoothstep(.39,.73,shade)*(1.-smoothstep(.020,.123,abs(castP.x)))*smoothstep(1.26,1.39,castP.y)*step(.08,castP.z);
          diffuseColor.rgb=mix(vec3(${id==='niklas'?'.122,.142,.160':'.019,.016,.022'})*(.57+1.80*shade),
                            vec3(${id==='niklas'?'.64,.61,.53':'.041,.034,.045'})*(.65+shade*.25),bib);
        `:''}
        ${staff?`
          float labShade=dot(diffuseColor.rgb,vec3(.213,.715,.072));
          float labTop=smoothstep(.86,1.04,castP.y);
          diffuseColor.rgb=mix(vec3(${id==='labHedwig'?'.077,.059,.056':'.053,.070,.072'}),
            vec3(${id==='labAuer'?'.58,.61,.56':id==='labHedwig'?'.18,.091,.094':'.33,.37,.29'}),labTop)*(.55+labShade*.96);
        `:''}
        ${visitor?`
          float seamPhase=smoothstep(.83,1.04,castP.y);
          float shade=dot(diffuseColor.rgb,vec3(.213,.715,.072));
          float rib=.5+.5*sin(castP.y*${id==='guestJona'?'105.':'196.'}+sin(castP.x*61.)*.31);
          float plaid=smoothstep(.53,.72,rib)*(.5+.5*sin(castP.x*91.+castP.z*39.));
          vec3 garment=mix(vec3(${visitor.map(vec)[0]}),vec3(${visitor.map(vec)[1]}),seamPhase);
          float stripe=plaid*${id==='guestJona'?'.26':id==='guestLotte'?'.17':'.07'}*(1.-smoothstep(.001,.020,castD));
          float lapel=(1.-smoothstep(.024,.104,abs(castP.x)))*smoothstep(1.22,1.44,castP.y)*step(.078,castP.z)*smoothstep(.30,.72,shade);
          diffuseColor.rgb=mix(garment,vec3(${visitor.map(vec)[2]}),clamp(stripe*seamPhase+lapel*.70,0.,1.))*(.55+shade*1.38);
        `:''}
        ${copperHair?`
          float gingerShade=smoothstep(.0,.42,pow(dot(diffuseColor.rgb,vec3(.213,.715,.072)),.55));
          diffuseColor.rgb=mix(vec3(.058,.011,.005),vec3(.37,.121,.039),gingerShade);
        `:''}
        ${freckles?`
          vec2 fP=(castP.xy-vec2(0.,${eyeY.toFixed(4)}))*512.;
          vec2 fI=floor(fP);
          vec2 fV=fract(fP)-vec2(.3+.4*castHash(vec3(fI,.1)),.3+.4*castHash(vec3(fI,3.)));
          vec2 cheek=vec2((abs(castP.x)-.028)*17.,(castP.y-${eyeY.toFixed(4)}+.022)*51.);
          float spread=exp(-dot(cheek,cheek));
          float dots=(1.-smoothstep(.10,.27,length(fV)))*step(.64,castHash(vec3(fI,6.)));
          diffuseColor.rgb*=1.-dots*spread*smoothstep(.075,.121,castP.z)*(.32-.16*smoothstep(.001,.003,castD));
        `:''}
        ${field||ritual?`
          float fray=castNoise(castP*vec3(558.,835.,644.));
          float wet=castNoise(castP*vec3(28.,11.,31.));
          float deposit=smoothstep(.48,.91,wet+.22*(1.-smoothstep(.16,1.05,castP.y)));
          float fiber=(sin(castP.y*2460.)*sin(castP.x*1950.+castP.z*1430.))*(1.-smoothstep(.0008,.004,castD));
          diffuseColor.rgb*=1.+fiber*.082+(fray-.5)*.18*(1.-smoothstep(.001,.009,castD));
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.35,.29,.22),deposit*.60);
          ${m.name.startsWith('Helmet')?`float chips=smoothstep(.83,.94,castNoise(castP*vec3(263.,197.,281.)));
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.19,.108,.064),chips*.38);`:''}
        `:''}
        ${skin&&p.decay?`
          vec3 castFace=castP-vec3(0.,${eyeY.toFixed(4)},0.);
          vec2 castEyeD=vec2((abs(castFace.x)-.031)*47.,(castFace.y+.008)*53.);
          float castSocket=exp(-dot(castEyeD,castEyeD))*smoothstep(.059,.121,castFace.z);
          float castMottle=castNoise(castP*vec3(15.,26.,24.)+vec3(${(p.decay*10).toFixed(2)},0.,0.));
          float castFlake=smoothstep(.46,.79,castNoise(castP*vec3(140.,86.,111.)));
          float castPits=smoothstep(.57,.83,castMottle)*castFlake;
          vec2 castScarD=vec2((castFace.x+.043+.22*(castFace.y+.045))*236.,(castFace.y+.045)*40.);
          float castScar=exp(-dot(castScarD,castScarD))*smoothstep(.09,.116,castFace.z);
          float castTone=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
          diffuseColor.rgb=mix(diffuseColor.rgb,castTone*vec3(.85,.92,.80),.58);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.42,.38,.42),max(castSocket*.63,max(castPits*.84,castScar*.90)));
        `:''}
        diffuseColor.rgb*= (1.+castFine*.115)*mix(vec3(1.),vec3(${skin?'.43,.39,.40':'.48,.45,.37'}),castDirt*.66);
      `);
      if(field)sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec3 castDX=dFdx(-vViewPosition),castDY=dFdy(-vViewPosition);
        vec3 castU=cross(castDY,normal),castV=cross(normal,castDX);
        float castDet=dot(castDX,castU);
        float castHeight=castFine*.34+castDirt*.74;
        normal=normalize(max(abs(castDet),.00000001)*normal-sign(castDet)
          * .00194*(dFdx(castHeight)*castU+dFdy(castHeight)*castV));
      `);
    };
  }
  lib.materials.set(key,m);return m;
}

export function createHuman(T,id='base'){
  const lib=libraries.get(T);if(!lib)throw Error('Human GLB not loaded');
  const proto=lib.models.get(id);if(!proto)throw Error('Unknown human: '+id);
  const actor=new T.Group(),body=clone(proto),bones=new Map(),faces=[],meshes=[];
  actor.name=id;actor.add(body);body.scale.multiplyScalar(proto.userData.size??1);
  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),Q=()=>new T.Quaternion();
  body.traverse(o=>{
    if(o.isBone)bones.set(o.userData.name??o.name,o);
    if(o.isSkinnedMesh){
      o.castShadow=false;o.receiveShadow=true;
      o.boundingSphere=new T.Sphere(V(0,.96,0),1.31);
      if(o.morphTargetDictionary)faces.push(o);meshes.push(o);
    }
  });
  actor.updateMatrixWorld(true);
  const npcInfo=NPCS[id]?{...NPCS[id],id,actor,head:bones.get('head'),chest:bones.get('spine_03'),
    speak:null,hp:100,alive:true,reacting:false,rig:null}:null;
  if(npcInfo){actor.name=npcInfo.name;actor.userData.namedNpc=true;lib.present.push(npcInfo);}
  const rest=new Map(),bodyInv=body.matrixWorld.clone().invert(),bodyRestQ=body.getWorldQuaternion(Q()).invert();
  for(const [n,b] of bones)rest.set(n,{q:b.quaternion.clone(),p:b.position.clone(),
    axis:b.getWorldQuaternion(Q()).premultiply(bodyRestQ),at:b.getWorldPosition(V()).applyMatrix4(bodyInv)});
  for(const m of meshes)m.material=personalize(T,lib,id,m.material,rest.get('eye_l')?.at.y??1.67);
  const e=new T.Euler(0,0,0,'YXZ'),q=Q(),inv=Q(),pq=Q(),worldInverse=new T.Matrix4(),A=V(),D=V(),P=V(),J=V(),goal=V(),
    start=V(),dir=V(),elbow=V(),end=V();
  const matrixP=V(),matrixScale=V(),bodyQ=Q();
  const matrixQ=(node,out)=>{node.matrixWorld.decompose(matrixP,out,matrixScale);return out;};
  const read=n=>rest.get(n).at, pelvis=bones.get('pelvis'),hipsY=read('pelvis').y;
  const LIMB={l:{},r:{}};
  for(const s of ['l','r']){
    LIMB[s].leg=['thigh_','calf_','foot_'].map(n=>n+s);
    LIMB[s].arm=['upperarm_','lowerarm_','hand_'].map(n=>n+s);
    for(const chain of [LIMB[s].leg,LIMB[s].arm])chain.lengths=[rest.get(chain[1]).p.length(),rest.get(chain[2]).p.length()];
  }
  const rot=(n,x=0,y=0,z=0)=>{const b=bones.get(n);if(b)b.quaternion.copy(rest.get(n).q).multiply(q.setFromEuler(e.set(x,y,z)));};
  function aim(n,child,target){
    const b=bones.get(n),up=b.parent;up.updateWorldMatrix(true,false);
    matrixQ(up,inv).invert();b.updateWorldMatrix(false,false);
    const desired=D.copy(target).sub(P.setFromMatrixPosition(b.matrixWorld)).applyQuaternion(inv).normalize();
    const r=rest.get(n).q;
    q.setFromUnitVectors(A.copy(rest.get(child).p).applyQuaternion(r).normalize(),desired);
    b.quaternion.copy(q).multiply(r);
  }
  function solve(names,x,y,z,px,py,pz){
    const [na,nb,nc]=names,a=bones.get(na);
    // Solve triangle in actor space with an explicit knee/elbow pole.
    a.getWorldPosition(start).applyMatrix4(worldInverse);
    goal.set(x,y,z);
    dir.copy(goal).sub(start);
    const [l0,l1]=names.lengths,raw=dir.length();
    if(raw<.00001)return;
    dir.multiplyScalar(1/raw);
    const l=clamp(raw,Math.abs(l0-l1)+.009,l0+l1-.006);
    J.set(px,py,pz);J.addScaledVector(dir,-J.dot(dir)).normalize();
    const mid=(l0*l0-l1*l1+l*l)/(2*l),bend=Math.sqrt(Math.max(0,l0*l0-mid*mid));
    elbow.copy(start).addScaledVector(dir,mid).addScaledVector(J,bend).applyMatrix4(body.matrixWorld);
    end.copy(start).addScaledVector(dir,l).applyMatrix4(body.matrixWorld);
    aim(na,nb,elbow);aim(nb,nc,end);
  }
  function foot(name,x,y=0){
    const b=bones.get(name);b.parent.updateWorldMatrix(true,false);
    matrixQ(b.parent,inv).invert();
    b.quaternion.copy(inv).multiply(bodyQ).multiply(q.setFromEuler(e.set(x,y,0)));
  }
  const isGhoul=id.startsWith('ghoul'),hubert=id==='hubert';
  const faceNames=['BlinkL','BlinkR','JawOpen','Purse','Smile','BrowL','BrowR'],values=new Float32Array(7);
  const channels=faces.map(m=>Object.entries(m.morphTargetDictionary).map(([name,i])=>[m.morphTargetInfluences,i,faceNames.indexOf(name)]));
  function face(t,seed,speech=0,purse=0,smile=0,glance=0){
    const z=(t+seed*1.61)%(3.82+frac(seed*.79)*2.34),blink=z<.20?sin(z/.20*Math.PI)**1.23:0,
      glanceY=sin(t*.69+seed)*.049;
    values[0]=blink*.99;values[1]=blink;values[2]=clamp(speech);values[3]=purse;values[4]=smile;
    values[5]=(.5+.5*sin(t*.92+seed))*.13+speech*.19;values[6]=(.5+.5*sin(t*.78+seed+.8))*.12;
    for(const list of channels)for(const [dest,i,k] of list)dest[i]=values[k]??0;
    rot('eye_l',glanceY,glance*.61+sin(t*.58+seed)*.065);rot('eye_r',glanceY,glance*.61+sin(t*.58+seed)*.065);
  }
  const fingers=['index','middle','ring','pinky'];
  function curl(s,amount){
    const sign=s==='l'?1:-1;
    for(const f of fingers)for(let k=1;k<=3;k++)rot(f+'_0'+k+'_'+s,amount*(k===1?.26:.14),sign*amount*.18,0);
  }
  function torso(x,y,z,bend,twist,tilt,t,lookX,lookY){
    pelvis.position.copy(rest.get('pelvis').p).add(A.set(x,y,z));
    rot('pelvis',bend*.25,twist*.30,tilt*.52);rot('spine_01',bend*.50,twist*.28,-tilt*.39);
    rot('spine_02',bend*.28,twist*.22,-tilt*.24);rot('spine_03',bend*.20,twist*.22,-tilt*.18);
    rot('neck_01',-bend*.29,lookX*.44);rot('head',-bend*.45+lookY,lookX*.56,sin(t*.96)*.026);
    body.updateWorldMatrix(true,false);worldInverse.copy(body.matrixWorld).invert();matrixQ(body,bodyQ);
  }
  const size=proto.userData.size??1,groundedY=y=>y+.003-(proto.userData.soleY??0)*size;
  const anchorA={},anchorB={},ankleGoal=V();
  function walk(t,distance,route,floorY,look,stopBlend){
    // Ground anchors are sampled on the actual route, including the curves.
    const L=1.04,motion=1-stopBlend,phase=distance/L,w=phase*tau;
    const drop=.028+.013*cos(2*w)*motion;
    torso(sin(w)*.023*motion,-drop,0,.018+.023*motion,sin(w)*.115*motion,
      -.038*sin(w)*motion,t,look,0);
    for(const [j,s] of ['l','r'].entries()){
      const sign=j===0?1:-1,ankle=read('foot_'+s),f=frac(phase+j*.5),
        a=(Math.floor(phase+j*.5)+.29-j*.5)*L,u=clamp((f-.59)/.41),
        blend=u*u*(3-2*u),strideWidth=.097*sign;
      route(a,anchorA);route(a+L,anchorB);
      const xx=mix(anchorA.x+cos(anchorA.yaw)*strideWidth,anchorB.x+cos(anchorB.yaw)*strideWidth,blend);
      const zz=mix(anchorA.z-sin(anchorA.yaw)*strideWidth,anchorB.z-sin(anchorB.yaw)*strideWidth,blend);
      const yawDelta=Math.atan2(sin(anchorB.yaw-anchorA.yaw),cos(anchorB.yaw-anchorA.yaw));
      const lift=sin(Math.PI*u)**1.35*.079*motion;
      ankleGoal.set(xx,groundedY(floorY)+ankle.y*size+lift,zz).applyMatrix4(worldInverse);
      solve(LIMB[s].leg,mix(ankle.x*.86,ankleGoal.x,motion),ankleGoal.y,mix(ankle.z,ankleGoal.z,motion),sign*.15,0,1);
      const footYaw=anchorA.yaw+yawDelta*blend-actor.rotation.y;
      foot('foot_'+s,-sin(tau*u)*.133*motion,Math.atan2(sin(footYaw),cos(footYaw))*motion);
      solve(LIMB[s].arm,sign*(.208+.018*motion),hipsY-.160+motion*.036*Math.abs(sin(w)),.024-.113*sign*sin(w)*motion,sign*.65,-.45,-.72);
      curl(s,.36);
    }
    face(t,2.34,0,0,.05,look);
  }
  function grip(side){
    const n='hand_'+side,w=bones.get(n),joint=f=>read(f+'_01_'+side);
    const fore=joint('middle').clone().sub(read(n)).normalize();
    const z=joint('index').clone().sub(joint('pinky')).normalize();
    const y=fore.clone().negate().addScaledVector(z,fore.dot(z)).normalize();
    const x=V().crossVectors(y,z),palm=x.clone().negate();
    if(palm.dot(joint('thumb').clone().sub(joint('middle')))<0)palm.negate();
    const socket=new T.Group(),restHand=rest.get(n).axis.clone().invert();
    socket.position.copy(joint('index')).lerp(joint('pinky'),.54).sub(read(n))
      .addScaledVector(fore,.012).addScaledVector(palm,.010).applyQuaternion(restHand);
    socket.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z)).premultiply(restHand);
    w.add(socket);
    const curls=[];
    for(const f of [...fingers,'thumb'])for(let i=1;i<=3;i++){
      const name=f+'_0'+i+'_'+side,next=f+'_0'+(i+1)+'_'+side,b=bones.get(name);
      if(!b)continue;
      const direction=rest.has(next)?read(next).clone().sub(read(name)):read(name).clone().sub(read(f+'_0'+(i-1)+'_'+side));
      const bq=rest.get(name).axis.clone().invert();
      const axis=V().crossVectors(direction,palm).applyQuaternion(bq).normalize();
      curls.push({b,name,axis,angle:f==='thumb'?[.33,.48,.30][i-1]:[.77,1.09,.68][i-1]});
    }
    const socketInv=socket.quaternion.clone().invert(),parentQ=Q(),curlQ=Q();
    return {socket,hold(desired){
      w.parent.getWorldQuaternion(parentQ).invert();
      w.quaternion.copy(parentQ).multiply(desired).multiply(socketInv);
      for(const {b,name,axis,angle} of curls)b.quaternion.copy(rest.get(name).q).multiply(curlQ.setFromAxisAngle(axis,angle));
    }};
  }
  function deskWork(t,job,glance=0,speech=0){
    const f=sin(t*(job==='cook'?2.3:1.55)),b=cos(t*1.65),notice=Math.min(1,speech*2);
    torso(.014*sin(t*.91),-.040,.017,.12-.065*notice,.04*f,.020*b,t,glance,.14-.23*notice);
    for(const [j,s] of ['l','r'].entries()){
      const sign=j===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,ankle.x*.90,ankle.y,ankle.z+sign*.045,.12*sign,0,1);
      foot('foot_'+s,0);
      const cook=job==='cook',note=job==='registry',reach=j===0?.38:cook?.54:note?.50:.465;
      solve(LIMB[s].arm,sign*(.166+.034*f*(j?1:.22)),j===0?1.015:1.023+.019*f,
        reach+(j?.037*b:0),sign*.79,-.48,-.69);
      rot('hand_'+s,.23+.10*f,sign*.14,.24*sign);curl(s,j===0?.64:1.03);
    }
    face(t,job.length,speech,.08,0,glance);
  }
  function visitorPose(t,job,seat=0,glance=0,talk=0){
    // The ankle remains on the floor; only the hips lower to the contact
    // plane of the actual seat. All targets are applied to the same rig.
    const seated=seat>0,quiet=job==='rest',prayer=job==='prayer',smoke=job==='lounge',
      wash=job==='wash',search=job==='books',broadcast=job==='studio',green=job==='greenhouse',
      home=seated?(seat+.108)/size:hipsY-.037,
      cue=.5+.5*sin(t*2.49),scan=.5+.5*sin(t*.83-.66),release=clamp(talk*.95),
      lift=smoke?(1-clamp(Math.abs((t%8.8)-2.04)/1.65))**2*(1-release):0,
      lean=prayer?.17:quiet?.041:smoke?-.019:wash?.185:search?.074:green?.142:.09;
    torso(.014*sin(t*.83),home-hipsY+.004*sin(t*2.12),seated?.01:.025,lean,
      (search?.07:quiet?.04:.024)*sin(t*.93),.023*sin(t*.76),t,glance,
      (prayer?.27:search?mix(.18,-.11,scan):wash?.29:green?.20:broadcast?.092:.049)*(1-release)-.10*release);
    for(const [i,s] of ['l','r'].entries()){
      const side=i===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,side*(seated?.119:.103),ankle.y,ankle.z+(seated?(quiet?.39:.347):side*.035),side*.195,-.10,1);
      foot('foot_'+s,seated?.023:0,side*.12);
      let x=side*.175,y=home+.144,z=.298,pitch=.21,grip=.55;
      if(prayer){x=side*.047;y=home+.417-.056*release;z=.263+.012*sin(t*1.5);pitch=-.54;grip=.31;}
      if(wash){x=side*(.047+.027*sin(t*3.1+i));y=.903+.025*sin(t*3.6+i);z=.467+.044*sin(t*3+i);pitch=.35;grip=.56;}
      if(search){
        x=i===0?.135:-.16+.089*sin(t*1.05);y=i===0?1.07:mix(1.193,1.544,scan);z=i===0?.270:.410+.105*cue;
        pitch=i===0?.24:-.25;grip=i===0?.65:.39;
      }
      if(smoke){x=i===0?.208:mix(-.205,-.047,lift);y=i===0?home+.099:mix(home+.213,home+.769,lift);
        z=i===0?.23:mix(.308,.179,lift);pitch=.20-.67*lift;grip=.62;}
      if(broadcast){x=i===0?.179:-.227+.032*sin(t*1.9);y=.993+.016*sin(t*2.0+i);z=i===0?.386:.45+.033*sin(t*1.4);grip=.62;}
      if(green){x=side*.145+.030*sin(t*2.2+i);y=1.046+.022*sin(t*2.33+i);z=.470+.033*sin(t*2.5+i);}
      if(quiet){x=side*.148;y=home+.045+.015*sin(t*1.43+i);z=.267;pitch=.44;grip=.49;}
      solve(LIMB[s].arm,x,y,z,.73*side,-.48,-.64);
      rot('hand_'+s,pitch,.22*side,(prayer?-.44:.15)*side);curl(s,grip);
    }
    face(t,job.length+.44,talk*.29*(.31+.69*Math.abs(sin(t*13.5))),prayer?.12:0,
      quiet?.075:smoke?.11:.015,glance);
  }
  function pose(t,phase,motion,attack,hit,fall,seed,speech=0,look=0,purse=0){
    body.rotation.set(fall*1.41,0,fall*(isGhoul?.67:0));body.position.y=fall*.16;
    const w=phase*tau,b=sin(t*2.2+seed),lean=isGhoul?.15:hubert?.095:.016;
    torso(sin(w)*.019*motion,-.028-.025*motion*(.5+.5*cos(w*2))-.019*attack,0,
      lean+.17*attack-.18*hit+b*.012,sin(w)*.13*motion,.052*sin(w)*motion+(isGhoul?.038:0),t,
      look+.035*sin(t*1.43+seed), .063*hit);
    for(const [j,s] of ['l','r'].entries()){
      const sign=j===0?1:-1,f=frac(phase+j*.5),stance=.59,u=clamp((f-stance)/(1-stance)),
        stride=(f<stance?1-2*f/stance:-cos(u*Math.PI))*(isGhoul?.239:.178),lift=sin(u*Math.PI)*(isGhoul?.089:.074)*motion;
      const ankle=read('foot_'+s);
      solve(LIMB[s].leg,ankle.x*.84,ankle.y+lift,ankle.z+stride*motion,.05*sign,-.06,1);
      foot('foot_'+s,.22*sin(tau*u)*motion);
      const x=sign*(.225+.065*attack)+sin(w)*.022*motion,
        y=hipsY-.14+.52*attack+.026*b*sign-.065*hit*j,
        z=.064-.17*sin(w)*motion*sign+.52*attack+.05*lean;
      solve(LIMB[s].arm,x,y,z,sign*.59,-.46,-.68);curl(s,.42+.22*attack);
    }
    face(t,seed,speech||attack*.34,purse,0,look);
  }
  // Each dance describes hips, a planted/raised foot and authored hand paths.
  // Shared loop phase comes from WebAudio, never from simulated kick lights.
  function dance(t,beat,style,look=0,activity=1){
    const b=beat*Math.PI,w=beat*tau,s=sin(b),c=cos(b),d=sin(w),q=activity,
      step=style===4?.05:style===1?.14:.114;
    const shift=q*step*(style===2?sin(b*.5):s),tilt=q*.10*s;
    body.rotation.set(0,0,0);body.position.y=0;
    torso(shift,-.032-q*.043*(.5-.5*cos(w)),style===3?.026*d:0,
      style===4?.05:.022+q*.11*sin(b+.8),q*.20*c,tilt,t,look,.038*d*q);
    for(const [j,side] of ['l','r'].entries()){
      const sign=j===0?1:-1,ankle=read('foot_'+side),cycle=(beat+j)/2,
        a=clamp((frac(cycle)-.55)/.45),swing=a*a*(3-2*a),up=sin(Math.PI*a)*q,
        travel=(Math.floor(cycle)%2?1:-1)*(swing*2-1)*q,
        sideStep=travel*(style===2?.092:style===1?.065:.038);
      solve(LIMB[side].leg,ankle.x*.92+sideStep,ankle.y+up*(style===4?.021:.065),
        ankle.z+travel*sign*(style===3?.14:style===0?.071:style===4?.02:.047),.16*sign,0,1);
      foot('foot_'+side,-.10*up);
      let x=sign*.28,y=hipsY-.12,z=.16;
      if(style===0){x=sign*(.28+.06*c*sign);y+=q*(.19+.19*sign*s);z+=q*(.14+.14*sign*c);}
      if(style===1){const up=clamp(.5+.5*s*sign);x+=q*sign*(.135+.06*d);y+=q*(.12+.68*up**2);z+=q*.11*cos(b+.8);}
      if(style===2){x+=q*sign*(.11+.09*cos(b+sign));y+=q*(.25+.13*d*sign);z+=q*(.24+.11*s*sign);}
      if(style===3){x+=q*sign*.11*s;y+=q*(.25+.18*clamp(sign*c));z+=q*(.19+.21*sign*s);}
      if(style===4){x=sign*(.24+.024*s);y+=q*(.18+.075*s*sign);z+=q*.15;}
      solve(LIMB[side].arm,x,y,z,sign*.78,-.53,-.63);curl(side,style===1?.24:.49);
    }
    face(t,style+1,0,0,style===4?.21:.28+.13*c,look);
  }
  function altarWork(t,attention=0,look=0){
    const work=1-attention,stroke=sin(t*3.8)+.26*sin(t*7.6+.46),shift=sin(t*1.6);
    torso(.017*shift*work,-.034-.018*work,.047*work,.076+.24*work,
      .10*shift*work,.044*shift*work,t,look,.12*work-.055*attention);
    for(const [j,s] of ['l','r'].entries()){
      const side=j===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,ankle.x*.92,ankle.y,ankle.z+side*.056,.12*side,0,1);
      foot('foot_'+s,0);
      solve(LIMB[s].arm,j===0?.10+.028*shift:-.153, j===0?1.140:1.268+.040*stroke*work,
        j===0?.560:.429+.050*shift,.80*side,-.45,-.65);
      rot('hand_'+s,j===0?.13:-.16+.25*stroke*work,-.14*side,.12*side);
      curl(s,j===0?.25:.77);
    }
    face(t,1.98,.18*attention,.33*attention,0,look);
  }
  const shapes=[];
  const add=(bone,child,t,r)=>{
    const b=bones.get(bone);if(!b)return;
    const p=child?rest.get(child).p.clone().multiplyScalar(t):V(0,t,0);
    shapes.push({b,p,base:r,head:bone==='head',sphere:new T.Sphere()});
  };
  add('head',null,.078,.116);add('head',null,.128,.079);add('spine_03',null,.04,.205);add('spine_02',null,.02,.158);add('pelvis',null,0,.15);
  for(const s of ['l','r']){
    for(const [a,b,r] of [['upperarm_','lowerarm_',.081],['lowerarm_','hand_',.070],
      ['thigh_','calf_',.096],['calf_','foot_',.079]])add(a+s,b+s,.47,r);
    add('hand_'+s,null,-.04,.047);add('foot_'+s,'ball_'+s,.56,.070);
  }
  function hitShapes(){
    const scale=(proto.userData.size??1)*actor.scale.x;
    for(const {b,p,base,sphere} of shapes){b.updateWorldMatrix(true,false);sphere.center.copy(p).applyMatrix4(b.matrixWorld);sphere.radius=base*scale;}
    return shapes;
  }
  const flinchBones=['spine_02','spine_03','neck_01'].map(name=>[bones.get(name),Q()]);
  const bonesArray=[...bones.values()],initial=bonesArray.map(()=>Q()),settled=bonesArray.map(()=>Q());
  const pelvis0=V(),pelvisEnd=V(),at0=V(),bodyAt=V(),body0=Q(),bodyEnd=Q();
  const turn=new T.Euler(),ease=t=>t*t*(3-2*t);
  let clock=0,collapse=false,side=1,heading0=0,heading1=0,ground=0,travel=0,short=false;
  function reaction(point,dying,fall,grade){
    if(!npcInfo)return;
    npcInfo.reacting=true;clock=0;collapse=!!dying;
    side=(point.x-actor.position.x)*Math.cos(actor.rotation.y)-(point.z-actor.position.z)*sin(actor.rotation.y)<0?1:-1;
    if(!collapse){for(const [b,out] of flinchBones)if(b)out.copy(b.quaternion);return;}
    bonesArray.forEach((b,i)=>initial[i].copy(b.quaternion));
    pelvis0.copy(pelvis.position);body0.copy(body.quaternion);bodyAt.copy(body.position);at0.copy(actor.position);
    heading0=actor.rotation.y;
    heading1=Math.atan2(sin(fall.x-heading0),cos(fall.x-heading0));
    ground=grade;travel=fall.y>.67?Math.min(.24,(fall.y-.67)*.27):0;short=fall.y<1.22;
    pose(0,.19,0,0,0,0,side>0?1.6:2.4);
    rot('thigh_l',short?-.58:-.10,.11,.12);rot('thigh_r',short?-.40:-.18,-.13,-.20);
    rot('calf_l',short?.86:.24);rot('calf_r',short?.70:.41);
    face(0,0,0,0,0,0);
    for(const list of channels)for(const [dest,i,k] of list)if(k===0||k===1)dest[i]=.93;
    bonesArray.forEach((b,i)=>{settled[i].copy(b.quaternion);b.quaternion.copy(initial[i]);});
    pelvisEnd.copy(pelvis.position);pelvis.position.copy(pelvis0);
    bodyEnd.setFromEuler(turn.set(short?-1.43:-Math.PI*.5,0,side*(short?.18:.07),'YXZ'));
    body.quaternion.copy(body0);body.position.copy(bodyAt);
  }
  function reactionTick(dt,visible){
    if(!npcInfo?.reacting||!dt)return false;
    clock+=dt;
    if(!collapse){
      const k=clamp(clock/.26),p=sin(Math.PI*k);
      for(const [j,[b,base]] of flinchBones.entries())if(b)
        b.quaternion.copy(base).multiply(q.setFromEuler(e.set(-.095*p,side*p*(.18-j*.028),side*p*.087)));
      if(k>=1)npcInfo.reacting=false;
      return visible;
    }
    const k=clamp(clock/.91),roll=ease(clamp((k-.09)/.91)),brace=ease(clamp(k*1.36));
    actor.rotation.y=heading0+heading1*ease(clamp(k*1.65));
    actor.position.set(at0.x-sin(actor.rotation.y)*travel*roll,
      mix(at0.y,ground,roll),at0.z-cos(actor.rotation.y)*travel*roll);
    body.quaternion.copy(body0).slerp(bodyEnd,roll);
    body.position.copy(bodyAt);body.position.y=mix(bodyAt.y,short?.18:.151,roll)-.064*sin(Math.PI*k);
    pelvis.position.copy(pelvis0).lerp(pelvisEnd,brace);
    for(let i=0;i<bonesArray.length;i++)bonesArray[i].quaternion.copy(initial[i]).slerp(settled[i],brace);
    if(k>=1)npcInfo.reacting=false;
    return visible;
  }
  const controllable=()=>!npcInfo||npcInfo.alive&&!npcInfo.reacting;
  const alive=()=>!npcInfo||npcInfo.alive;
  pose(0,0,0,0,0,0,.2);
  const rig={actor,pose,dance,altarWork,deskWork,visitorPose,grip,walk,groundedY,npcInfo,reaction,reactionTick,controllable,alive,
    joint(name){return bones.get(name);},hitShapes,shadow(on){for(const m of meshes)m.castShadow=on;}};
  if(npcInfo)npcInfo.rig=rig;
  return rig;
}
