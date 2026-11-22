import {FESTIVAL as C} from './festival-layout.js';
import {bergMaterials,carpentry} from './berg-props.js';
import {sharedSet} from './surface-detail.js';
import {contactShadow} from './palace-butler.js';
import {createHuman} from './human-character.js';
import {festivalFinishes,festivalFurniture,festivalBar,festivalConsole,festivalDecor} from './festival-furnishings.js';
import {festivalCanopy} from './festival-canopy.js';
import {festivalDarts,DART_FACE,DART_HITS,scoreAt} from './festival-darts.js';
import {festivalOutfit} from './festival-outfit.js';

const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=t=>Math.min(1,Math.max(0,t));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};

export function addParkFestival(T,scene,world,height){
  const root=new T.Group();root.name="Zwanni's Funny! · Dart-Spinner Uehlfeld";scene.add(root);
  const props=new T.Group();root.add(props);
  const grade=height(C.x,C.z);props.position.set(C.x,grade,C.z);
  const localY=(x,z)=>height(C.x+x,C.z+z)-grade;
  const m=bergMaterials(T);
  const matte=(color,roughness=.9,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const canvas=c=>new T.MeshStandardMaterial({color:c,...sharedSet(T,'canvas',512),side:T.DoubleSide,roughness:.93});
  m.whiteFabric=canvas(0xfffefa);
  m.frame=matte(0x454946,.47,.6);m.galv=matte(0x878781,.54,.60);m.rubber=matte(0x202726);
  m.drivers=matte(0x2f3938,.7,.14);m.led=new T.MeshStandardMaterial({color:0xf4d597,emissive:0xec9741,emissiveIntensity:1.25});
  m.berry=canvas(0xbb4947);m.gold=canvas(0xe5aa53);m.blue=canvas(0x5689b7);
  festivalFinishes(T,m);
  const k=carpentry(T,props,m),B=k.box,link=(m,a,b,r=.025)=>k.tube(m,[a,b],r,1,8);
  const local=(x,z)=>[C.x+x,C.z+z],wall=(x,z,w,d)=>{
    const [X,Z]=local(x,z);world.box(X-w/2,Z-d/2,X+w/2,Z+d/2);
  };
  const pad=(x,z,r)=>world.circle(C.x+x,C.z+z,r);
  const face=(key,a,b,c,d,scale=1.65)=>k.quad(key,a,b,c,d,scale);
  // No floor: the feet are pegged into the existing lawn.
  for(const x of [-5.94,5.94])for(const z of [-4.72,-1.60,1.54,4.72]){
    const y=localY(x,z);
    k.round('frame',x,1.50+y*.5,z,.108,3.04-y,.108,.010);
    B('iron',x,.027+y,z,.33,.053,.28);B('galv',x,.158+y,z,.151,.275,.153);
    for(const u of [-.094,.094])for(const v of [-.082,.082])k.cyl('bright',x+u,.074+y,z+v,.016,.039);
    const inward=x>0?-.69:.69;
    link('galv',[x,2.42,z],[x+inward,2.89,z],.039);pad(x,z,.11);
  }
  for(const x of [-5.94,5.94])B('frame',x,2.96,0,.115,.13,9.61);
  festivalCanopy(T,props,k,m,localY,wall);
  // Lamp chain and pennants sit below the canvas and use no additional light sources.
  for(const z of [3.34,-.60]){
    const chain=x=>2.99+Math.pow(x/6,2)*.56-.25;
    k.tube('frame',[-5.86,-4,-2,0,2,4,5.86].map(x=>[x,chain(x),z]),.012,22,6);
    for(let i=0;i<13;i++){
      const x=-5.42+i*.90,y=chain(x),key=['blue','whiteFabric','blue','gold'][i%4];
      k.cyl('iron',x,y-.021,z,.026,.07);k.oval('led',x,y-.080,z,.042,.064,.042);
      if(z>0&&i<12)face(key,[x+.19,y-.005,z],[x+.72,y-.005,z],[x+.465,y-.345,z+.046],[x+.44,y-.345,z+.046],.50);
    }
  }
  const console=festivalConsole(T,props,k,m,wall,localY);
  const furnishing=festivalFurniture(T,props,k,localY,wall,pad);
  festivalBar(T,props,k,m,wall,localY,furnishing.glass);
  festivalDecor(T,props,k,m,localY);
  const lane=festivalDarts(T,props,k,m,localY,wall);
  k.flush('Uehlfelder Festival');

  const focusRay=new T.Ray(),aim=new T.Vector3(),spot=new T.Vector3(),offset=new T.Vector3();
  const playlist={id:'festival-playlist',action:'festival-playlist',label:'Laptop · Musik ausschalten'};
  let playing=true;
  function toggleMusic(){
    playing=!playing;
    console.setPlaying(playing);
    playlist.label=playing?'Laptop · Musik ausschalten':'Laptop · Musik einschalten';
    return playing;
  }
  function target(camera,query,mask,p){
    if((p.x-(C.x-.47))**2+(p.z-(C.z-2.92))**2>2.9**2)return null;
    camera.getWorldPosition(focusRay.origin);camera.getWorldDirection(aim);
    for(const obj of [console.screen,console.ctrl]){
      obj.getWorldPosition(spot);offset.subVectors(spot,focusRay.origin);
      const d=offset.length();
      if(d<.14||d>2.53)continue;
      focusRay.direction.copy(offset).divideScalar(d);
      if(focusRay.direction.dot(aim)<.949)continue;
      if(query.trace(focusRay,d-.070,mask,.04,true)===Infinity)return playlist;
    }
    return null;
  }
  const archive={at:[C.x+console.archiveLocal[0],grade+console.archiveLocal[1],C.z+console.archiveLocal[2]],
    attach(g){root.add(g);}};

  const roster=[
    ['festZwanni',DART_FACE.x,-1.75,Math.PI],['festAnni',-5.66,-.61,Math.PI/2],
    ['festKalle',-.228,-3.63,0],['festRudi',4.66,3.13,Math.PI]
  ];
  const cast=roster.map(([id,x,z,yaw],i)=>{
    const rig=createHuman(T,id),actor=rig.actor,ground=height(C.x+x,C.z+z);
    actor.position.set(C.x+x,rig.groundedY(ground),C.z+z);actor.rotation.y=yaw;root.add(actor);
    rig.npcInfo.shadow=contactShadow(T,root,C.x+x,ground+.010,C.z+z,.86,.72);
    const entry={rig,actor,speech:0,i,time:.72*i,talk:0,listening:false,attention:0};
    rig.npcInfo.speak=(d=6.3)=>{entry.speech=d;};
    if(i===0)rig.npcInfo.listen=on=>{entry.listening=on;};
    festivalOutfit(T,rig,id,m);
    rig.festivalPose(entry.time,i,0);
    world.circle(C.x+x,C.z+z,.247,p=>rig.atStation()&&Math.abs(p.y-ground)<1.3);
    return entry;
  });
  const darts=new T.Group();darts.userData.noSceneQuery=true;root.add(darts);
  const pencil=new T.Group(),dartKit=carpentry(T,pencil,m);
  dartKit.profile('brass',0,0,0,[[0,-.033],[.005,-.033],[.010,-.020],[.010,.018],[.006,.033],[0,.033]],{segments:16,rx:Math.PI/2});
  for(let n=0;n<6;n++)dartKit.ring('drip',0,0,-.015+n*.006,.0097,.0097,.007);
  dartKit.profile('brushed',0,0,0,[[.006,.022],[.004,.037],[.002,.050],[.0004,.078]],{segments:12,rx:Math.PI/2});
  dartKit.cyl('paintBlue',0,0,-.051,.0045,.049,Math.PI/2);
  const fins=new T.MeshStandardMaterial({color:0x3366a5,roughness:.75,side:T.DoubleSide});
  const finGeometry=new T.BufferGeometry();
  finGeometry.setAttribute('position',new T.Float32BufferAttribute([0,0,-.049,.016,0,-.067,.021,0,-.098,0,0,-.101],3));
  finGeometry.setIndex([0,1,2,0,2,3]);finGeometry.computeVertexNormals();
  for(let i=0;i<4;i++){const fin=new T.Mesh(finGeometry,fins);fin.rotation.z=i*Math.PI/2;pencil.add(fin);}
  dartKit.flush('Roter Dartpfeil');
  const thrown=Array.from({length:3},()=>{const q=pencil.clone();darts.add(q);q.visible=false;return q;});
  const hand=cast[0].rig.grip('r').socket;darts.add(pencil);
  const cloth=new T.Group(),mug=new T.Group(),rHand=cast[3].rig.grip('r').socket,bHand=cast[1].rig.grip('r').socket;
  for(const p of [cloth,mug]){p.userData.noSceneQuery=true;root.add(p);}
  cloth.visible=mug.visible=false;
  const c=carpentry(T,cloth,m);
  c.round('clothOne',0,0,0,.108,.021,.141,.010);
  for(const x of [-.030,.027])c.round('clothTwo',x,.010,0,.012,.004,.129,.001);
  c.flush('Anni · gespültes Tuch');
  const j=carpentry(T,mug,m);
  j.profile('glaze',0,0,0,[[0,0],[.057,0],[.060,.013],[.064,.087],[.059,.139],[.051,.139],[.048,.018],[0,.011]]);
  j.tube('glaze',[[.050,.115,0],[.102,.108,0],[.111,.065,0],[.083,.034,0],[.052,.041,0]],.013,14,9);
  for(const y of [.041,.109])j.ring('paintBlue',0,y,0,.060,.060,.035,Math.PI/2);
  j.cyl('beer',0,.091,0,.053,.069);j.oval('foam',0,.126,0,.051,.007,.051);j.flush('Rudi · Steinkrug');
  const start=new T.Vector3(),end=new T.Vector3(),heading=new T.Vector3(),front=new T.Vector3(0,0,1);
  const marks=[];
  let stepClock=0,throwClock=0,lastHit=-1,lastThrow=-1,clearedTurn=0;
  function tick(dt,p,surface,impact){
    if(!surface||!dt||(p.x-C.x)**2+(p.z-C.z)**2>37**2)return false;
    stepClock+=dt;if(stepClock<1/26)return false;
    const step=stepClock;stepClock=0;
    const waiting=cast[0].listening||cast[0].speech>0;
    const previousPhase=throwClock%12%3.2/3.2;
    if(cast[0].rig.atStation()&&(!waiting||(previousPhase>=.54&&previousPhase<.65)))throwClock+=step;
    const seq=throwClock%12,index=Math.floor(seq/3.2),phase=(seq%3.2)/3.2;
    for(const a of cast){
      if(!a.rig.controllable())continue;
      a.speech=Math.max(0,a.speech-step);a.time+=step;
      a.talk=lerp(a.talk,a.speech>0?1:0,Math.min(1,step*8));
      a.attention=lerp(a.attention,a.listening||a.speech>0?1:0,Math.min(1,step*6));
      const pTalk=a.talk*(.64+.22*Math.abs(Math.sin(14*a.time)));
      const off=Math.atan2(p.x-a.actor.position.x,p.z-a.actor.position.z)-a.actor.rotation.y;
      const gaze=a.attention*Math.max(-1.04,Math.min(1.04,Math.atan2(Math.sin(off),Math.cos(off))));
      const b=a.time%7.3,r=a.time%14.5,s=playing?a.time%6.7:0;
      a.motion??={clean:0,sip:0,cue:0};
      a.motion.clean=smooth(.52,1.27,b)-smooth(4.32,5.52,b);
      a.motion.sip=smooth(6.04,6.81,r)-smooth(8.09,9.24,r);
      a.motion.cue=smooth(.2,.68,s)-smooth(3.12,5.6,s);
      a.rig.festivalPose(a.time,a.i,index<3&&!waiting?phase:0,gaze,pTalk,a.motion);
    }
    const ann=cast[1],rudi=cast[3];
    cloth.visible=ann.rig.atStation()&&ann.talk<.22&&(ann.motion?.clean??0)>.14;
    if(cloth.visible){
      bHand.getWorldPosition(cloth.position);
      cloth.position.x+=.017;cloth.position.y-=.024;cloth.rotation.y=ann.actor.rotation.y+.16*Math.sin(ann.time*2.1);
    }
    mug.visible=rudi.rig.atStation();
    if(mug.visible){
      rHand.getWorldPosition(mug.position);mug.position.x-=.071;mug.position.y-=.061;
      mug.rotation.set((rudi.motion?.sip??0)*(1-rudi.talk)*.63,Math.PI,.045);
    }
    if(!cast[0].rig.alive()){darts.visible=false;return true;}
    if(!cast[0].rig.atStation()){pencil.visible=false;return true;}
    const turn=Math.floor(throwClock/12),s=turn*3+index;
    if(index===0&&clearedTurn!==turn){
      clearedTurn=turn;marks.length=0;lane.display(marks);
      for(const q of thrown)q.visible=false;
    }
    pencil.visible=index<3&&phase<.54&&!waiting;
    if(pencil.visible){hand.getWorldPosition(pencil.position);pencil.rotation.set(.02,cast[0].actor.rotation.y,.14);}
    if(index>=3||phase<.54)return true;
    if(lastThrow!==s){
      hand.getWorldPosition(start);
      const [dx,dy]=DART_HITS[index];
      end.set(C.x+DART_FACE.x+dx,grade+DART_FACE.y+dy,C.z+DART_FACE.z+.002);
      lastThrow=s;
    }
    const q=thrown[index],flight=clamp((phase-.54)/.109);
    q.visible=true;q.position.copy(start).lerp(end,flight);q.position.y+=.175*flight*(1-flight);
    heading.copy(end).sub(start);heading.y+=.175*(1-2*flight);
    heading.normalize();
    q.quaternion.setFromUnitVectors(front,heading);
    q.position.addScaledVector(heading,-.071*flight);
    if(flight>=1&&lastHit!==s){
      lastHit=s;
      marks[index]=scoreAt(...DART_HITS[index]);lane.display(marks);
      impact?.(end);
    }
    return true;
  }
  return {root,tick,archive,target,toggleMusic,prepare:console.prepare,get playing(){return playing;}};
}
