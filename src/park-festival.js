import {FESTIVAL as C} from './festival-layout.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';
import {sharedSet} from './surface-detail.js';
import {contactShadow} from './palace-butler.js';
import {createHuman} from './human-character.js';

const tau=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=t=>Math.min(1,Math.max(0,t));

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
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.91,emissive:0xe5bdb2,emissiveMap:map,emissiveIntensity:.12,side:T.DoubleSide}));
  mesh.position.set(x,y,z);root.add(mesh);return mesh;
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
  m.screen=new T.MeshStandardMaterial({color:0x7caa99,emissive:0x3fbb90,emissiveIntensity:.40,roughness:.31});
  const k=carpentry(T,props,m),B=k.box,link=(m,a,b,r=.025)=>k.tube(m,[a,b],r,1,8);
  const local=(x,z)=>[C.x+x,C.z+z],wall=(x,z,w,d)=>{
    const [X,Z]=local(x,z);world.box(X-w/2,Z-d/2,X+w/2,Z+d/2);
  };
  const pad=(x,z,r)=>world.circle(C.x+x,C.z+z,r);
  const face=(key,a,b,c,d,scale=1.65)=>k.quad(key,a,b,c,d,scale);
  // No floor: the feet are pegged into the existing lawn.
  for(const x of [-5.94,5.94])for(const z of [-4.72,-1.60,1.54,4.72]){
    const y=localY(x,z);
    B('frame',x,1.50+y*.5,z,.108,3.04-y,.108);
    B('iron',x,.027+y,z,.33,.053,.28);B('galv',x,.158+y,z,.151,.275,.153);
    for(const u of [-.094,.094])for(const v of [-.082,.082])k.cyl('galv',x+u,.074+y,z+v,.016,.039);
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
  face('valance',[-6.08,2.99,-4.955],[6.08,2.99,-4.955],[6.08,2.74,-4.955],[-6.08,2.74,-4.955]);
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
  // Music corner: flight cases directly on the lawn, no stage or microphone.
  function speaker(x,z){
    B('rubber',x,.78,z,.67,.74,.48);B('frame',x,.78,z+.252,.612,.675,.036);
    for(const [y,r] of [[.72,.244],[1.000,.100]]){
      k.cyl('rubber',x,y,z+.278,r,.019,Math.PI/2);
      k.cyl('drivers',x,y,z+.294,r*.83,.014,Math.PI/2);k.ring('frame',x,y,z+.308,r*.89,r*.89,.082);
      k.oval('rubber',x,y,z+.310,r*.36,r*.36,.023);
    }
    for(let i=-5;i<=5;i++)B('rubber',x+i*.049,.786,z+.323,.013,.582,.013);
    for(const dx of [-.274,.274])for(const y of [.465,1.093])k.cyl('galv',x+dx,y,z+.282,.018,.016,Math.PI/2);
    B('rubber',x,.46,z+.091,.83,.132,.66);
  }
  speaker(-2.62,-2.39);speaker(2.62,-2.39);
  for(const x of [-2.62,2.62]){
    const z=-2.39,y=localY(x,z);
    B('frame',x,.204+y,z,.76,.431,.58);B('galv',x,.036+y,z,.79,.028,.61);
    B('galv',x,.374+y,z,.79,.028,.61);
    B('galv',x,.261+y,z+.298,.18,.049,.014);B('rubber',x,.263+y,z+.312,.126,.024,.022);
    wall(x,z,.82,.63);
  }
  B('frame',0,.47,-2.86,1.57,.955,.65);B('rubber',0,.944,-2.86,1.61,.035,.68);
  for(const y of [.08,.899])B('galv',0,y,-2.52,1.59,.045,.021);
  for(const x of [-.77,.77])B('galv',x,.476,-2.527,.031,.88,.022);
  wall(0,-2.86,1.60,.66);
  B('rubber',-.46,.974,-2.87,.48,.04,.38);
  B('galv',-.46,.993,-2.85,.406,.008,.21);
  for(let row=0;row<4;row++)for(let col=0;col<9;col++)
    B('frame',-.628+col*.041,.999,-2.887+row*.041,.031,.005,.026);
  const lid=new T.Group(); // Screen faces the playlist operator behind the case.
  lid.position.set(-.46,1.002,-2.697);lid.rotation.x=.15;props.add(lid);
  const laptop=carpentry(T,lid,m);
  laptop.box('rubber',0,.139,0,.475,.283,.021);
  laptop.box('screen',0,.147,-.016,.431,.231,.008);
  for(let i=0;i<5;i++)laptop.box(i===2?'gold':'frame',-.06,.211-i*.026,-.024,i===2?.335:.258,.009,.004);
  laptop.box('gold',.111,.116,.015,.109,.071,.005);laptop.box('berry',-.12,.187,.016,.083,.049,.006);
  laptop.flush('Kalles Laptop: Klebeband, Tastatur und Playlist');
  B('rubber',.37,.993,-2.90,.59,.077,.36);
  for(let i=0;i<10;i++){
    const x=.12+i*.049;k.cyl('galv',x,1.033,-3.016,.014,.023);k.cyl(i%3===0?'scarlet':'led',x,1.033,-2.75,.010,.012);
    B('iron',x,1.038,-2.884,.021,.013,.082);
  }
  for(const x of [-2.62,2.62])k.tube('rubber',[[x,.72,-2.64],[x,.06,-2.72],
    [x*.78,.036,-3.20],[x*.34,.038,-3.22],[x*.25,.16,-3.2]],.013,12,6);

  // Timber counter with engraved taps, cocktail equipment and translucent bottles.
  const bx=-4.60,bz=-.67;
  B('dark',bx,.49,bz,1.68,.98,2.18);B('oak',bx,.97,bz,1.82,.11,2.32);
  wall(bx,bz,1.72,2.22);
  for(let i=0;i<12;i++)B(i%2?'oak':'edge',bx+.848,.47,bz-1.01+i*.184,.039,.793,.154);
  for(const y of [.128,.836])B('brass',bx+.878,y,bz,.024,.026,2.13);
  for(const z of [-1.39,-1.08]){
    k.cyl('copper',bx,1.21,z,.033,.39);k.ring('brass',bx,1.18,z,.063,.061,.17);
    link('brass',[bx,1.38,z],[bx+.19,1.35,z],.027);
    B('dark',bx+.172,1.45,z,.044,.128,.048);
  }
  for(let i=0;i<9;i++){
    const z=bz-.89+i*.201,x=bx-.48+(i%3)*.085;
    const bottle=[[0,0],[.057,0],[.057,.145],[.040,.187],[.019,.204],[.019,.274],[0,.274]];
    k.profile(i%3?'green':'beer',x,1.02,z,bottle,{segments:18});
    B('linen',x,1.103,z+.054,.071,.059,.005);k.cyl('brass',x,1.294,z,.022,.018);
  }
  for(const z of [-.49,-.18,.26]){
    k.profile('glass',bx+.34,1.028,z,[[.040,0],[.045,.020],[.056,.126],[.052,.127],[.043,.023]],{segments:20});
    k.cyl('beer',bx+.34,1.076,z,.043,.086);k.oval('foam',bx+.34,1.12,z,.043,.015,.043);
  }
  B('iron',bx+.16,1.03,-1.24,.34,.020,.54);
  storyCard(T,props,{title:'THEKE',sub:'KRUGPFAND · 2 MARKEN',lines:['KELLERBIER', 'WASSER · APFELSCHORLE'],x:-5.9,y:1.63,z:-2.73,yaw:.72,width:1.02,height:.84});
  // Dartboard slab, numbered bristle face, line and analogue score clipboard.
  const dartX=4.50,dartZ=-4.57,dartY=1.72;
  B('dark',dartX,1.70,dartZ-.135,1.83,1.82,.25);
  for(const x of [dartX-.79,dartX+.79])B('iron',x,1.23,dartZ-.244,.091,2.44,.11);
  wall(dartX,dartZ-.135,1.83,.25);
  k.cyl('rubber',dartX,dartY,dartZ+.030,.465,.115,Math.PI/2);
  k.ring('brass',dartX,dartY,dartZ+.094,.452,.452,.114);
  const disc=new T.Mesh(new T.CircleGeometry(.445,96),new T.MeshStandardMaterial({map:boardFace(T),roughness:.91}));
  disc.position.set(dartX,dartY,dartZ+.099);props.add(disc);
  const oche=localY(dartX,-2.03);
  B('oak',dartX,oche+.014,-2.03,1.26,.036,.068);B('gold',dartX,oche+.036,-2.019,1.27,.008,.026);
  storyCard(T,props,{title:'LIGAABEND',sub:'DART-SPINNER',lines:['ZWANNI   26', 'RUDI     41','AN DER SCHEIBE NICHT NÖRGELN'],
    x:5.43,y:1.39,z:-4.22,width:.67,height:.94,paper:'#494238',small:true});
  for(const [x,z] of [[-1.82,1.22],[-1.82,2.66],[1.82,1.22],[1.82,2.66],[-3.65,4.07],[3.27,4.07]]){
    B('oak',x,.435,z,2.36,.083,.346);
    for(const X of [x-.88,x+.88]){
      B('frame',X,.219,z,.074,.408,.247);B('galv',X,.041,z,.18,.048,.278);
    }
    B('iron',x,.264,z,2.04,.04,.045);wall(x,z,2.37,.34);
  }
  // Biergarnituren rather than audience rows: shared tables, coasters and half-full cups.
  for(const [i,x] of [-1.82,1.82].entries()){
    const z=1.94,y=localY(x,z);
    B('oak',x,.751+y,z,2.45,.07,.60);B('edge',x,.782+y,z,2.45,.023,.61);
    for(const side of [-1,1]){
      const X=x+.91*side;
      B('green',X,.364+y,z,.086,.726,.075);
      B('frame',X,.025+y,z,.085,.04,.53);
      link('galv',[X,.105+y,z],[X-.35*side,.681+y,z],.023);
    }
    for(let j=0;j<3;j++){
      const X=x-.89+j*.79,Z=z+(j%2?.16:-.17);
      k.cyl('linen',X,.797+y,Z,.066,.007);
      k.profile('glass',X,.801+y,Z,[[.031,0],[.037,.013],[.044,.11],[.039,.114],[.032,.012]],{segments:16});
      k.cyl(j%2?'beer':'wine',X,.821+y,Z,.033,.038);
      if(!j)k.oval('foam',X,.843+y,Z,.034,.009,.034);
    }
    B(i?'berry':'blue',x+.23,.797+y,z,.29,.012,.184);
    wall(x,z,2.46,.62);
  }
  k.cyl('oak',4.55,1.045,2.52,.448,.062);k.cyl('frame',4.55,.50,2.52,.046,.94);
  k.cyl('frame',4.55,.065,2.52,.264,.075);pad(4.55,2.52,.315);
  B('linen',4.48,1.085,2.44,.238,.013,.313);
  B('brass',4.45,1.098,2.39,.011,.012,.168);
  k.flush('Uehlfelder Festival');

  const roster=[
    ['festZwanni',dartX,-1.88,Math.PI],['festAnni',-5.56,-.62,Math.PI/2],
    ['festKalle',-.27,-3.61,0],['festRudi',4.66,3.18,Math.PI]
  ];
  const cast=roster.map(([id,x,z,yaw],i)=>{
    const rig=createHuman(T,id),actor=rig.actor,ground=height(C.x+x,C.z+z);
    actor.position.set(C.x+x,rig.groundedY(ground),C.z+z);actor.rotation.y=yaw;root.add(actor);
    rig.npcInfo.shadow=contactShadow(T,root,C.x+x,ground+.010,C.z+z,.86,.72);
    const entry={rig,actor,speech:0,i,time:.42*i};
    rig.npcInfo.speak=(d=6.3)=>{entry.speech=d;};
    // Embroidered club badge and the bartender's tied apron travel with the rig.
    const chest=rig.costumeMount('spine_03'),p=rig.restPoint('spine_03');
    const clothes=carpentry(T,chest,m);
    if(i===1){
      clothes.box('linen',0,p.y-.218,.182,.315,.277,.018);
      clothes.box('red',0,p.y-.236,.195,.328,.019,.014);
      clothes.box('red',0,p.y-.295,.199,.174,.062,.019);
    }
    clothes.box('green',-.112,p.y+.044,.136,.119,.068,.012);
    clothes.box('brass',-.111,p.y+.061,.144,.089,.008,.005);
    for(let j=0;j<3;j++)clothes.cyl('linen',-.139+j*.028,p.y+.040,.149,.005,.005,Math.PI/2);
    clothes.flush(actor.name+' · Vereinskleidung');
    rig.festivalPose(entry.time,i,0);
    world.circle(C.x+x,C.z+z,.28,p=>rig.alive()&&Math.abs(p.y-ground)<1.3);
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
      const pTalk=a.speech>0?(.35+.25*Math.abs(Math.sin(17*a.time))):0;
      const off=Math.atan2(p.x-a.actor.position.x,p.z-a.actor.position.z)-a.actor.rotation.y;
      const gaze=pTalk?Math.max(-.83,Math.min(.83,Math.atan2(Math.sin(off),Math.cos(off)))):0;
      a.rig.festivalPose(a.time,a.i,index<3?phase:0,gaze,pTalk);
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
  return {root,tick};
}
