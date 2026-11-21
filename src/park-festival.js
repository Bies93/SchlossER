import {FESTIVAL as C} from './festival-layout.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';
import {sharedSet} from './surface-detail.js';
import {contactShadow} from './palace-butler.js';
import {createHuman} from './human-character.js';
import {festivalFinishes,festivalFurniture,festivalBar,festivalConsole,festivalDecor} from './festival-furnishings.js';

const tau=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=t=>Math.min(1,Math.max(0,t));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};

function boardFace(T){
  const sheet=document.createElement('canvas');sheet.width=sheet.height=1024;
  const c=sheet.getContext('2d'),o=512;
  const numbers=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
  const turn=tau/20;
  c.fillStyle='#171c19';c.fillRect(0,0,1024,1024);
  const ring=(from,to,first,last,color)=>{
    c.beginPath();c.arc(o,o,to,first,last);
    if(from)c.arc(o,o,from,last,first,true);else c.lineTo(o,o);
    c.closePath();c.fillStyle=color;c.fill();
  };
  const lineCircle=(r,w,color)=>{
    c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(o,o,r,0,tau);c.stroke();
  };
  for(const [i,n] of numbers.entries()){
    const a=-Math.PI/2+i*turn,f=a-turn/2,l=a+turn/2;
    ring(0,405,f,l,i%2?'#dbcca2':'#232622');
    for(const [r,R] of [[241,272],[378,405]])ring(r,R,f,l,i%2?'#516955':'#9a4038');
    c.fillStyle='#dfdac9';c.font='bold 50px Georgia';c.textAlign='center';c.textBaseline='middle';
    c.fillText(n,o+451*Math.cos(a),o+451*Math.sin(a));
  }
  ring(0,36,0,tau,'#526b55');ring(0,15,0,tau,'#a64235');
  let seed=677;
  const rand=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
  for(let i=0;i<22000;i++){
    const a=rand()*tau,r=(Math.sqrt(rand())*401),s=.7+rand()*2.6;
    c.fillStyle=rand()<.5?'#ece2b629':'#17150f30';
    c.fillRect(o+r*Math.cos(a),o+r*Math.sin(a),s,1.4+s*.42);
  }
  for(let i=0;i<20;i++){
    const a=-Math.PI/2+(i-.5)*turn;
    c.beginPath();c.moveTo(o+36*Math.cos(a),o+36*Math.sin(a));c.lineTo(o+406*Math.cos(a),o+406*Math.sin(a));
    c.lineWidth=3;c.strokeStyle='#a9a393';c.stroke();
  }
  for(const r of [15,36,241,272,378,405,492])lineCircle(r,r===492?5:3,'#9b9989');
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;return map;
}

function letteredPanel(T,root,x,y,z,w,h,word,sub){
  const paper=document.createElement('canvas');paper.width=1024;paper.height=256;
  const c=paper.getContext('2d');
  c.fillStyle='#863742';c.fillRect(0,0,1024,256);
  for(let i=0;i<6600;i++){
    c.fillStyle=i%2?'#e6bd8520':'#14150e18';
    c.fillRect(i*71.7%1024,i*93.1%256,1+i%4,1+i%3);
  }
  c.strokeStyle='#ffcf76';c.lineWidth=6;c.setLineDash([13,9]);c.strokeRect(15,15,994,226);c.setLineDash([]);
  for(const [x,s] of [[76,1],[948,-1]]){
    c.fillStyle='#f6ab46';c.beginPath();c.arc(x,128,27,0,tau);c.fill();
    c.fillStyle='#633c55';c.beginPath();c.arc(x,128,15,0,tau);c.fill();
    c.strokeStyle='#fff0c9';c.lineWidth=5;c.beginPath();c.moveTo(x+6*s,125);c.lineTo(x+32*s,101);c.stroke();
    c.fillStyle='#68a68c';c.beginPath();c.moveTo(x+26*s,106);c.lineTo(x+41*s,96);c.lineTo(x+41*s,112);c.closePath();c.fill();
  }
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff2cc';c.font='italic 900 118px system-ui';
  c.shadowColor='#3d2437';c.shadowOffsetY=7;c.fillText(word,512,104,790);c.shadowOffsetY=0;
  c.fillStyle='#fbd574';c.font='bold 35px monospace';c.fillText(sub,512,205,800);
  const map=new T.CanvasTexture(paper);map.colorSpace=T.SRGBColorSpace;map.anisotropy=6;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.91,emissive:0xe5bdb2,emissiveMap:map,emissiveIntensity:.12}));
  mesh.position.set(x,y,z);
  const back=mesh.clone();back.rotation.y=Math.PI;back.position.z-=.007;
  root.add(mesh,back);return mesh;
}

export function addParkFestival(T,scene,world,height){
  const root=new T.Group();root.name="Zwanni's Funny! · Dart-Spinner Uehlfeld";scene.add(root);
  const props=new T.Group();root.add(props);
  const grade=height(C.x,C.z);props.position.set(C.x,grade,C.z);
  const localY=(x,z)=>height(C.x+x,C.z+z)-grade;
  const m=bergMaterials(T);
  const matte=(color,roughness=.9,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const canvas=c=>new T.MeshStandardMaterial({color:c,...sharedSet(T,'canvas',512),side:T.DoubleSide,roughness:.93});
  m.canvas=canvas(0xffdca3);m.canvasGreen=canvas(0x5f9b83);m.valance=canvas(0x467c69);
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
  const roofHeight=u=>4.76-Math.abs(u)*.293;
  for(let i=0;i<12;i++){
    const a=-6.19+i*(12.38/12),b=a+12.38/12,key=i%3===1?'canvasGreen':'canvas';
    for(let j=0;j<8;j++){
      const l=lerp(a,b,j/8),r=lerp(a,b,(j+1)/8),h=t=>roofHeight(t)-.058*Math.sin((t-a)/(b-a)*Math.PI);
      face(key,[l,h(l),5.09],[r,h(r),5.09],[r,h(r),-5.09],[l,h(l),-5.09],1.13);
    }
    link('valance',[a,roofHeight(a)+.014,-5.1],[a,roofHeight(a)+.014,5.1],.018);
    link('linen',[a-.027,roofHeight(a)+.012,-5.08],[a-.027,roofHeight(a)+.012,5.08],.009);
  }
  for(const z of [-4.80,0,4.80]){
    for(const s of [-1,1]){
      link('frame',[s*6.04,2.97,z],[0,4.72,z],.045);
      link('frame',[s*6.04,2.97,z],[0,3.30,z],.029);
      for(let i=1;i<4;i++)link('galv',[s*i*1.51,3.30-.083*i,z],[s*(i-1)*1.51,roofHeight((i-1)*1.51)-.10,z],.021);
    }
  }
  // The back gable is sewn in; the entrance gable is deliberately open.
  for(let i=0;i<16;i++){
    const a=-6.03+i*.754,b=Math.min(6.03,a+.754),z=-4.91;
    face(i%4===1?'canvasGreen':'valance',[a,2.89,z],[b,2.89,z],
      [b,roofHeight(b)-.071,z],[a,roofHeight(a)-.071,z],1.05);
    link('frame',[a,2.90,z+.014],[a,roofHeight(a)-.080,z+.014],.010);
  }
  // All four sides stay open below the valances.
  for(const x of [-6.19,6.19])for(let i=0;i<16;i++){
    const a=-5.08+i*.635,b=a+.635,l=2.71+.025*Math.sin(i*1.18);
    face('valance',[x,2.99,a],[x,2.99,b],[x,l,b],[x,l,a]);
    link('galv',[x,l+.010,a],[x,l+.010,b],.010);
  }
  for(let i=0;i<24;i++){
    const a=-6.08+.5067*i,b=a+.5067,g=2.745-.039*Math.sin(i*1.85);
    face(i%4===0?'canvasGreen':'valance',[a,3.01,-4.955],[b,3.01,-4.955],[b,g,-4.95],[a,g,-4.95]);
  }
  letteredPanel(T,props,0,3.08,4.88,6.57,1.02,"Zwanni's Funny!",'DART-SPINNER UEHLFELD  ·  BIER & DART');
  for(const x of [-3.22,3.22])link('galv',[x,3.57,4.88],[x*.91,3.82,4.74],.013);
  // Lamp chain and pennants sit below the canvas and use no additional light sources.
  for(const z of [3.34,-.60]){
    const chain=x=>2.99+Math.pow(x/6,2)*.56-.25;
    k.tube('frame',[-5.86,-4,-2,0,2,4,5.86].map(x=>[x,chain(x),z]),.012,22,6);
    for(let i=0;i<13;i++){
      const x=-5.42+i*.90,y=chain(x),key=['berry','gold','blue','linen'][i%4];
      k.cyl('iron',x,y-.021,z,.026,.07);k.oval('led',x,y-.080,z,.042,.064,.042);
      if(z>0&&i<12)face(key,[x+.19,y-.005,z],[x+.72,y-.005,z],[x+.465,y-.345,z+.046],[x+.44,y-.345,z+.046],.50);
    }
  }
  const console=festivalConsole(T,props,k,m,wall,localY);
  const furnishing=festivalFurniture(T,props,k,localY,wall,pad);
  festivalBar(T,props,k,m,wall,localY,furnishing.glass);
  festivalDecor(T,props,k,m,localY);
  // Dartboard slab, numbered bristle face, line and analogue score clipboard.
  const dartX=4.50,dartZ=-4.57,dartY=1.72;
  k.round('endgrain',dartX,1.70,dartZ-.135,1.83,1.82,.25,.032);
  for(const x of [dartX-.72,dartX+.72])
    k.round('plankAlt',x,1.70,dartZ-.001,.117,1.77,.027,.008);
  for(const y of [.868,2.532])
    k.round('plank',dartX,y,dartZ-.005,1.52,.110,.036,.012);
  for(let i=0;i<9;i++) B('case',dartX-.629+i*.157,1.702,dartZ+.001,.149,1.56,.021);
  for(const x of [dartX-.624,dartX+.624])for(const y of [.878,2.531])
    k.cyl('bright',x,y,dartZ+.022,.016,.009,Math.PI*.5);
  for(const x of [dartX-.79,dartX+.79])B('iron',x,1.23,dartZ-.244,.091,2.44,.11);
  wall(dartX,dartZ-.135,1.83,.25);
  k.cyl('rubber',dartX,dartY,dartZ+.030,.465,.115,Math.PI/2);
  k.ring('brass',dartX,dartY,dartZ+.094,.452,.452,.114);
  const disc=new T.Mesh(new T.CircleGeometry(.445,96),new T.MeshStandardMaterial({map:boardFace(T),roughness:.91}));
  disc.position.set(dartX,dartY,dartZ+.099);props.add(disc);
  const oche=localY(dartX,-2.03);
  B('oak',dartX,oche+.014,-2.03,1.26,.036,.068);B('gold',dartX,oche+.036,-2.019,1.27,.008,.026);
  k.round('endgrain',5.43,1.39,-4.256,.74,1.01,.045,.017);
  storyCard(T,props,{title:'DARTS.EXE',sub:'LIGAABEND · RUDI',lines:['ZWANNI   26', 'RUDI     41','FEHLWURF? WIND.'],
    x:5.43,y:1.39,z:-4.22,width:.67,height:.94,paper:'#494238',small:true});
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
    ['festZwanni',dartX,-1.88,Math.PI],['festAnni',-5.66,-.61,Math.PI/2],
    ['festKalle',-.228,-3.63,0],['festRudi',4.66,3.13,Math.PI]
  ];
  const cast=roster.map(([id,x,z,yaw],i)=>{
    const rig=createHuman(T,id),actor=rig.actor,ground=height(C.x+x,C.z+z);
    actor.position.set(C.x+x,rig.groundedY(ground),C.z+z);actor.rotation.y=yaw;root.add(actor);
    rig.npcInfo.shadow=contactShadow(T,root,C.x+x,ground+.010,C.z+z,.86,.72);
    const entry={rig,actor,speech:0,i,time:.72*i,talk:0};
    rig.npcInfo.speak=(d=6.3)=>{entry.speech=d;};
    // Embroidered club badge and the bartender's tied apron travel with the rig.
    const chest=rig.costumeMount('spine_03'),p=rig.restPoint('spine_03');
    const clothes=carpentry(T,chest,m);
    if(i===1){
      clothes.round('linen',0,p.y-.201,.136,.298,.263,.019,.009);
      clothes.round('red',0,p.y-.184,.149,.315,.023,.014,.005);
      clothes.round('plankAlt',0,p.y-.268,.151,.165,.083,.014,.004);
    }
    clothes.box('green',-.112,p.y+.044,.136,.119,.068,.012);
    clothes.box('brass',-.111,p.y+.061,.144,.089,.008,.005);
    for(let j=0;j<3;j++)clothes.cyl('linen',-.139+j*.028,p.y+.040,.149,.005,.005,Math.PI/2);
    clothes.flush(actor.name+' · Vereinskleidung');
    rig.festivalPose(entry.time,i,0);
    world.circle(C.x+x,C.z+z,.247,p=>rig.alive()&&Math.abs(p.y-ground)<1.3);
    return entry;
  });
  const darts=new T.Group();darts.userData.noSceneQuery=true;root.add(darts);
  const pencil=new T.Group(),dartKit=carpentry(T,pencil,m);
  dartKit.cyl('brass',0,0,.003,.009,.071,Math.PI/2);
  dartKit.cyl('iron',0,0,.056,.003,.044,Math.PI/2);
  dartKit.cyl('iron',0,0,-.060,.005,.056,Math.PI/2);
  for(const u of [-1,1]){
    dartKit.box('red',u*.012,0,-.077,.023,.003,.043);
    dartKit.box('red',0,u*.012,-.077,.003,.023,.043);
  }
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
  let stepClock=0,throwClock=0,lastHit=-1,lastThrow=-1;
  function tick(dt,p,surface,impact){
    if(!surface||!dt||(p.x-C.x)**2+(p.z-C.z)**2>37**2)return false;
    stepClock+=dt;if(stepClock<1/26)return false;
    const step=stepClock;stepClock=0;
    if(!cast[0].speech)throwClock+=step;
    const seq=throwClock%12,index=Math.floor(seq/3.2),phase=(seq%3.2)/3.2;
    for(const a of cast){
      if(!a.rig.controllable())continue;
      a.speech=Math.max(0,a.speech-step);a.time+=step;
      a.talk=lerp(a.talk,a.speech>0?1:0,Math.min(1,step*8));
      const pTalk=a.talk*(.64+.22*Math.abs(Math.sin(14*a.time)));
      const off=Math.atan2(p.x-a.actor.position.x,p.z-a.actor.position.z)-a.actor.rotation.y;
      const gaze=a.talk*Math.max(-1.04,Math.min(1.04,Math.atan2(Math.sin(off),Math.cos(off))));
      const b=a.time%7.3,r=a.time%14.5,s=playing?a.time%6.7:0;
      a.motion??={clean:0,sip:0,cue:0};
      a.motion.clean=smooth(.52,1.27,b)-smooth(4.32,5.52,b);
      a.motion.sip=smooth(6.04,6.81,r)-smooth(8.09,9.24,r);
      a.motion.cue=smooth(.2,.68,s)-smooth(3.12,5.6,s);
      a.rig.festivalPose(a.time,a.i,index<3?phase:0,gaze,pTalk,a.motion);
    }
    const ann=cast[1],rudi=cast[3];
    cloth.visible=ann.rig.alive()&&ann.talk<.22&&(ann.motion?.clean??0)>.14;
    if(cloth.visible){
      bHand.getWorldPosition(cloth.position);
      cloth.position.x+=.017;cloth.position.y-=.024;cloth.rotation.y=ann.actor.rotation.y+.16*Math.sin(ann.time*2.1);
    }
    mug.visible=rudi.rig.alive();
    if(mug.visible){
      rHand.getWorldPosition(mug.position);mug.position.x-=.071;mug.position.y-=.061;
      mug.rotation.set((rudi.motion?.sip??0)*(1-rudi.talk)*.63,Math.PI,.045);
    }
    if(!cast[0].rig.alive()){darts.visible=false;return true;}
    const s=Math.floor(throwClock/12)*3+index;
    if(index===0&&phase<.40)for(const q of thrown)q.visible=false;
    pencil.visible=index<3&&phase<.54&&cast[0].speech===0;
    if(pencil.visible){hand.getWorldPosition(pencil.position);pencil.rotation.set(.02,cast[0].actor.rotation.y,.14);}
    if(index>=3||phase<.54)return true;
    if(lastThrow!==s){
      hand.getWorldPosition(start);
      end.set(C.x+dartX+[.12,-.225,.175][index],grade+dartY+[.12,-.03,-.238][index],C.z+dartZ+.162);
      lastThrow=s;
    }
    const q=thrown[index],flight=clamp((phase-.54)/.109);
    q.visible=true;q.position.copy(start).lerp(end,flight);q.position.y+=.175*flight*(1-flight);
    heading.copy(end).sub(start);heading.y+=.175*(1-2*flight);
    q.quaternion.setFromUnitVectors(front,heading.normalize());
    if(flight>=1&&lastHit!==s){lastHit=s;impact?.(end);}
    return true;
  }
  return {root,tick,archive,target,toggleMusic,prepare:console.prepare,get playing(){return playing;}};
}
