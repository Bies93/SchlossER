import {architectureKit} from './architecture-kit.js';
import {HALL,WINGS} from './palace-openings.js';
import {labLower} from './lab-layout.js';

const p=(x,y,z)=>[x,y,z],Y=HALL.floor;
const signs=[
  ['01 · ASTRONOMIE','Armillarsphäre','Messingringe und Himmelsachsen'],
  ['02 · ARCHITEKTUR','Das Erlanger Schloss','Schematisches Modell der Residenz'],
  ['03 · UHRWERK','Standuhr','Zifferblatt und sichtbares Pendel'],
  ['04 · TAFELKULTUR','Tafelgerät','Löffel, Gabel und Servierbesteck'],
  ['05 · NATURALIEN','Mineralien','Quarz, Amethyst, Rauchquarz, Pyrit'],
  ['06 · SCHMUCK','Zierstücke','Ring, Brosche und Anhänger'],
  ['', 'BIES', 'Zeitgenössischer Druck']
];
const tileW=512,tileH=160;
function signage(T){
  const canvas=document.createElement('canvas');canvas.width=2*tileW;canvas.height=4*tileH;
  const c=canvas.getContext('2d');
  signs.forEach(([chapter,title,body],i)=>{
    const x=(i%2)*tileW,y=Math.floor(i/2)*tileH;
    c.fillStyle='#ddd0ab';c.fillRect(x,y,tileW,tileH);
    c.strokeStyle='#867358';c.lineWidth=1.7;c.strokeRect(x+10,y+10,tileW-20,tileH-20);
    c.fillStyle='#6a4c38';c.font='bold 17px sans-serif';c.fillText(chapter,x+27,y+45);
    c.fillStyle='#312b25';c.font='bold 39px Georgia,serif';c.fillText(title,x+26,y+95,tileW-52);
    c.fillStyle='#514a3b';c.font='22px sans-serif';c.fillText(body,x+27,y+129,tileW-54);
  });
  // Roman clock face, packed with the museum labels into one atlas.
  const x=tileW+tileW*.5,y=3*tileH+tileH*.5;
  c.fillStyle='#443626';c.fillRect(tileW,3*tileH,tileW,tileH);
  c.beginPath();c.arc(x,y,72,0,Math.PI*2);c.fillStyle='#e0ce9f';c.fill();
  c.strokeStyle='#826444';c.lineWidth=2;c.beginPath();c.arc(x,y,67,0,Math.PI*2);c.stroke();
  c.fillStyle='#3b3328';c.textAlign='center';c.textBaseline='middle';c.font='bold 14px Georgia,serif';
  for(const [i,roman] of ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'].entries()){
    const a=i*Math.PI/6;c.fillText(roman,x+52*Math.sin(a),y-52*Math.cos(a));
  }
  c.strokeStyle='#332922';c.lineCap='round';c.lineWidth=3.4;c.beginPath();
  c.moveTo(x+23,y+12);c.lineTo(x,y);c.lineTo(x-30,y-22);c.stroke();
  c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.88,emissive:0x322818,emissiveMap:map,emissiveIntensity:.32});
}

function furniture(T,group,world,materials,shapes){
  const k=architectureKit(T,group,materials),matrix=new T.Matrix4(),q=new T.Quaternion();
  const scale=new T.Vector3(),position=new T.Vector3(),euler=new T.Euler();
  const labels={position:[],uv:[]};
  const box=(m,a,b,y,Y,d,f)=>k.box(m,p,a,b,y,Y,d,f);
  function put(m,g,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    position.set(x,y,z);scale.set(sx,sy,sz);q.setFromEuler(euler.set(rx,ry,rz));
    k.geometry(m,shapes[g],matrix.compose(position,q,scale));
  }
  const block=(a,b,d,f)=>world.box(a,d,b,f,p=>!labLower(p.y));
  function plate(tile,point,clock=false){
    const a=clock?176:5,b=clock?336:tileW-5,l=clock?0:5,h=clock?tileH:tileH-5;
    const u=((tile%2)*tileW+a)/(2*tileW),v=((tile%2)*tileW+b)/(2*tileW);
    const bot=1-(Math.floor(tile/2)*tileH+h)/(4*tileH),top=1-(Math.floor(tile/2)*tileH+l)/(4*tileH);
    labels.position.push(...point(-1,-1),...point(1,-1),...point(1,1),...point(-1,-1),...point(1,1),...point(-1,1));
    labels.uv.push(u,bot,v,bot,v,top,u,bot,v,top,u,top);
  }
  function plaque(tile,x,y,z,dir=1,w=.53,h=.16){
    const point=(u,v)=>[x+u*w*.5*dir,y+v*h*.30,z-v*h*.40*dir];
    plate(tile,point);
  }
  function labelMount(tile,x,y,z,dir,w,h){
    put('labelWood','block',x,y-.010,z-dir*.006,w+.023,.015,h+.023,Math.atan(.75)*dir);
    plaque(tile,x,y,z,dir,w,h);
  }
  function plinth(x,z,w,d,top,kind='walnut'){
    const b=(m,w,d,a,b)=>box(m,x-w/2,x+w/2,a,b,z-d/2,z+d/2);
    b('mountStone',w+.11,d+.11,Y,.149);
    b('ebony',w+.035,d+.035,.149,.209);
    b(kind,w,d,.209,top-.083);
    b('edgeBrass',w+.021,d+.022,top-.096,top-.075);
    b('walnut',w+.056,d+.057,top-.078,top-.024);
    b('ebony',w+.025,d+.025,top-.024,top);
    block(x-w/2-.056,x+w/2+.056,z-d/2-.055,z+d/2+.055);
  }
  function caseFrame(x,z,w,d,label){
    const dir=z<0?1:-1,top=1.01;
    plinth(x,z,w,d,top);
    const l=x-w/2+.076,r=x+w/2-.076,a=z-d/2+.074,b=z+d/2-.074;
    const y=top+.035,cap=top+.36;
    box('velvet',l,r,top,top+.027,a,b);
    for(const xx of [l,r])for(const zz of [a,b])
      box('edgeBrass',xx-.014,xx+.014,y-.006,cap+.011,zz-.014,zz+.014);
    for(const xx of [l,r]){
      box('edgeBrass',xx-.014,xx+.014,cap-.009,cap+.01,a,b);
      box('displayGlass',xx-.002,xx+.002,y,cap,a,b);
    }
    for(const zz of [a,b]){
      box('edgeBrass',l,r,cap-.009,cap+.01,zz-.014,zz+.014);
      box('displayGlass',l,r,y,cap,zz-.002,zz+.002);
    }
    // One upward-facing glass sheet; no duplicate back face coplanar with it.
    k.quad('displayGlass',[l,cap,a],[l,cap,b],[r,cap,b],[r,cap,a]);
    labelMount(label,x,top+.058,z+dir*(d*.5-.027),dir,.618,.137);
  }
  function done(){
    if(labels.position.length){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(labels.position,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(labels.uv,2));g.computeVertexNormals();
      const o=new T.Mesh(g,materials.label);o.name='Südflügel · Schilder und Zifferblatt';group.add(o);
    }
    k.flush(group.name);
  }
  return {k,box,put,block,plate,labelMount,plinth,caseFrame,done};
}

function entrance(fit){
  const {k,box,put,block,plate,labelMount,plinth}=fit;
  // 1. Armillary sphere: concentric open rings, inclined axes and brass stand.
  const x=7.82,z=-3.26,c=1.72;
  plinth(x,z,1.04,1.01,1.035,'labelWood');labelMount(0,x,1.097,z+.387,1,.62,.18);
  put('edgeBrass','cylinder',x,1.074,z,.233,.071,.233);
  put('ebony','cylinder',x,1.155,z,.107,.13,.107);
  put('gold','profile',x,1.21,z,.166,.31,.166);
  put('edgeBrass','sphere',x,c,z,.112,.112,.112);
  for(const [r,rx,ry,rz] of [[.398,0,.03,0],[.376,1.571,0,0],[.355,1.57,.49,.30],[.326,.18,.64,.49]]){
    put('gold','ring',x,c,z,r,r,r,rx,ry,rz);
  }
  put('edgeBrass','cylinder',x,c,z,.012,.79,.012,0,0,-.38);
  for(let i=0;i<36;i++){
    const a=i*Math.PI/18;
    put(i%3?'edgeBrass':'gold','block',x+.376*Math.sin(a),c+.011,z+.376*Math.cos(a),.011,i%3?.009:.017,.027,0,a,0);
  }

  // 2. A stylised architectural survey model, with no claim to be a historic maquette.
  const X=8.65,Z=3.06,F=1.136;
  plinth(X,Z,2.23,1.32,1.048);
  labelMount(1,X,1.11,Z-.537,-1,.69,.19);
  box('modelBase',X-1.04,X+1.04,1.048,F,Z-.455,Z+.455);
  box('limestone',X-.962,X+.962,F,F+.62,Z-.265,Z+.265);
  box('modelTrim',X-.976,X+.976,F+.109,F+.140,Z-.280,Z+.280);
  box('modelTrim',X-.978,X+.978,F+.568,F+.61,Z-.278,Z+.278);
  for(const side of [-1,1])for(let j=0;j<15;j++){
    const a=X-.85+j*.121,v=Z+side*.273;
    for(let row=0;row<3;row++){
      const y=F+.047+row*.18;
      box('modelTrim',a-.034,a+.034,y-.007,y+.104,v-.009,v+.010);
      box('modelPane',a-.024,a+.024,y+.009,y+.092,v+side*.007-.006,v+side*.007+.006);
    }
  }
  for(const side of [-1,1]){
    const d=Z+side*.269,outer=Z+side*.361;
    box('modelTrim',X-.199,X+.202,F,F+.655,Math.min(d,outer),Math.max(d,outer));
    for(const a of [-.139,.131]){
      box('modelTrim',X+a-.013,X+a+.013,F+.11,F+.598,outer-.013,outer+.013);
    }
    for(const [a,w] of [[0,.062],[-.104,.032],[.104,.032]]){
      const y=F+.014;
      box('modelPane',X+a-w/2,X+a+w/2,y,y+.125,outer+side*.003-.004,outer+side*.003+.004);
    }
    for(const y of [F+.222,F+.394])for(const a of [-.098,0,.098]){
      box('modelPane',X+a-.023,X+a+.023,y,y+.114,outer+side*.003-.004,outer+side*.003+.004);
    }
    const z=outer+side*.006,h=F+.61;
    const a=[X-.2,h,z],b=[X+.2,h,z],c=[X,h+.126,z];
    k.triangle('modelTrim',side>0?a:b,side>0?b:a,c,[0,0,1,0,.5,1]);
    box('modelTrim',X-.211,X+.211,h-.014,h+.012,z-.011,z+.011);
  }
  const a=[X-.98,F+.61,Z-.28],b=[X+.98,F+.61,Z-.28],c2=[X+.98,F+.61,Z+.28],d=[X-.98,F+.61,Z+.28];
  const e=[X-.76,F+.747,Z],f=[X+.76,F+.747,Z];
  k.quad('modelSlate',b,a,e,f);k.quad('modelSlate',d,c2,f,e);
  k.triangle('modelSlate',a,d,e,[0,0,1,0,.5,1]);k.triangle('modelSlate',c2,b,f,[0,0,1,0,.5,1]);

  // 3. The far side of the first room has a longcase clock beside the arch.
  const u=11.72,v=-4.82;
  const profile=(m,w,depth,a,b)=>box(m,u-depth,u+.18,a,b,v-w/2,v+w/2);
  profile('mountStone',.77,.38,Y,.157);
  profile('walnut',.68,.31,.157,.35);
  profile('edgeBrass',.59,.263,.333,.356);
  profile('walnut',.56,.242,.35,1.62);
  profile('labelWood',.71,.29,1.59,1.68);
  profile('walnut',.70,.31,1.68,2.43);
  profile('edgeBrass',.74,.325,2.402,2.434);
  profile('walnut',.796,.356,2.434,2.494);
  for(const d of [-.284,.284])put('gold','sphere',u-.12,2.548,v+d,.034,.046,.034);
  box('ebony',u-.249,u-.242,.52,1.53,v-.196,v+.196);
  for(const d of [-.207,.197])box('labelWood',u-.269,u-.242,.49,1.57,v+d,v+d+.011);
  box('gold',u-.266,u-.250,.722,1.46,v-.010,v+.010);
  put('gold','cylinder',u-.277,.735,v,.101,.028,.101,0,0,Math.PI/2);
  put('edgeBrass','ring',u-.316,2.042,v,.334,.334,.334,0,Math.PI/2,0);
  plate(7,(a,b)=>[u-.317,2.042+b*.336,v+a*.336],true);
  block(u-.40,u+.21,v-.405,v+.405);
  box('labelWood',u-.91,u-.66,.759,.806,v+.56,v+.98);
  box('ebony',u-.81,u-.76,Y,.762,v+.73,v+.78);
  labelMount(2,u-.789,.85,v+.771,1,.28,.138);
  block(u-.92,u-.65,v+.56,v+.99);
}

function displays(fit){
  const {box,put,caseFrame}=fit;
  // Tafelgerät, spread so each silhouette remains visible through the glass.
  const x=16.45,z=-2.72,y=1.039;
  caseFrame(x,z,2.55,1.13,3);
  box('cloth',x-.98,x+.94,y,y+.008,z-.32,z+.28);
  for(const [i,u] of [-.70,-.27,.16,.59].entries()){
    const a=x+u;
    put('silver','block',a,y+.024,z+.008,.054,.012,.446,0,(i%2?.06:-.06),0);
    put('edgeBrass','sphere',a,y+.029,z+.213,.025,.009,.028);
    if(i%2===0){
      put('silver','sphere',a,y+.034,z-.263,.060,.020,.102,0,-.12,0);
      put('silverInset','sphere',a,y+.050,z-.270,.044,.006,.074,0,-.12,0);
    }else{
      box('silver',a-.046,a+.046,y+.018,y+.038,z-.293,z-.224);
      for(const d of [-.034,-.012,.012,.034])box('silver',a+d-.005,a+d+.005,y+.018,y+.034,z-.387,z-.282);
    }
  }

  const X=20.72,Z=2.88;
  caseFrame(X,Z,2.36,1.13,4);
  for(const [i,dx,dz,m,s] of [[0,-.775,-.015,'quartz',.122],[1,-.376,.135,'amethyst',.098],[2,.077,-.09,'pyrite',.092],[3,.585,.075,'smoke',.131]]){
    const w=X+dx,d=Z+dz;
    box('cloth',w-.177,w+.177,y,y+.023,d-.142,d+.142);
    put('rock','dodeca',w,y+.054,d,s*1.1,s*.51,s,.18,.42+i*.38,.02);
    if(i===2){
      for(const [a,b,h] of [[-.055,-.019,.113],[.052,-.036,.128],[.004,.051,.106]])put(m,'block',w+a,y+h,d+b,.092,.092,.092,.22,.32+a*8,.24);
    }else{
      for(const [a,b,h,sx,angle] of [[-.049,.034,.117,.054,.26],[.019,-.033,.143,.061,-.14],[.069,.022,.103,.040,-.34]]){
        put(m,'crystal',w+a,y+h,d+b,sx,.20+s*.23,sx,angle,i*.6,-angle*.69);
      }
    }
  }

  const A=25.15,D=-2.57;
  caseFrame(A,D,2.25,1.11,5);
  box('cloth',A-.91,A+.86,y,y+.014,D-.35,D+.31);
  for(const [a,b] of [[-.59,.075],[.034,-.056],[.54,.065]])
    put('velvet','block',A+a,y+.037,D+b,.31,.043,.27,0,.15,0);
  put('gold','ring',A-.59,y+.104,D+.080,.071,.071,.083,-.67,.02,0);
  put('gold','cylinder',A-.59,y+.137,D+.132,.036,.026,.036);
  put('ruby','gem',A-.59,y+.159,D+.132,.031,.028,.031);
  put('gold','ring',A+.034,y+.066,D-.051,.093,.072,.079,-Math.PI/2,0,.39);
  put('jade','gem',A+.034,y+.093,D-.051,.059,.041,.047);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;put('gold','sphere',A+.034+.086*Math.cos(a),y+.081,D-.051+.076*Math.sin(a),.013,.013,.013);
  }
  for(let i=0;i<=27;i++){
    const a=(i/27-.5)*Math.PI*1.4;
    put('gold','jewelRing',A+.51+Math.sin(a)*.154,y+.063,D-.103+Math.cos(a)*.239,.015,.012,.013,-1.18+(i%2?.45:0),a,0);
  }
  put('gold','cylinder',A+.51,y+.083,D+.154,.053,.026,.050);
  put('ruby','gem',A+.51,y+.112,D+.154,.039,.034,.045);
}

function framedPoster(T,root,fit,texture){
  if(!texture)return;
  const {box,plate}=fit,d=WINGS.outer,x=d-.065,y=2.167,h=2.96;
  const image=texture.image,w=h*(image?.width??853)/(image?.height??1280);
  const l=-w*.5,r=w*.5,b=y-h*.5,t=y+h*.5;
  box('ebony',x-.054,x+.060,b-.065,t+.065,l-.065,r+.065);
  for(const z of [l-.042,r+.042]){
    box('walnut',x-.086,x-.053,b-.075,t+.075,z-.031,z+.031);
    box('edgeBrass',x-.098,x-.086,b-.036,t+.036,z+(z<0?.024:-.030),z+(z<0?.030:-.024));
  }
  for(const a of [b-.043,t+.043]){
    box('walnut',x-.086,x-.055,a-.032,a+.032,l-.074,r+.074);
    box('edgeBrass',x-.098,x-.085,a+(a<y?.024:-.031),a+(a<y?.031:-.024),l-.017,r+.017);
  }
  const sheet=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,toneMapped:false}));
  sheet.name='Südflügel · BIES – beigefügtes Wandmotiv';sheet.position.set(x-.064,y,0);sheet.rotation.y=-Math.PI/2;root.add(sheet);
  // Slim museum picture light; the strip is lit, not an additional scene light.
  box('ebony',x-.160,x-.035,t+.19,t+.27,-.68,.68);
  box('edgeBrass',x-.268,x-.15,t+.185,t+.254,-.64,.64);
  box('lamp',x-.240,x-.173,t+.180,t+.187,-.56,.56);
  box('labelWood',x-.062,x-.016,1.335,1.57,1.103,1.571);
  plate(6,(a,b)=>[x-.065,1.451+b*.083,1.337+a*.21]);
}

export function furnishSouthGallery(T,root,world,common,poster){
  const entry=new T.Group(),rear=new T.Group();
  entry.name='Südflügel · Auftakt';rear.name='Südflügel · Kabinett der Sammlungen';root.add(entry,rear);
  const std=(color,roughness=.72,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const solidWood=common.wood.clone();solidWood.color.setHex(0x615044);
  const materials={
    walnut:solidWood,ebony:std(0x292824,.83),labelWood:std(0x735743),edgeBrass:std(0xa48855,.51,.55),gold:std(0xcb9a51,.44,.59),
    mountStone:std(0xada290,.84),limestone:common.limestone,modelBase:std(0xaf9e7e,.91),modelTrim:std(0xd3c29e,.81),
    modelSlate:std(0x454b4e,.86),modelPane:std(0x565d61,.58),velvet:std(0x353d3b,.95),cloth:std(0x745e4d,.95),
    silver:std(0xcfd1c7,.36,.66),silverInset:std(0x938f7c,.53,.52),rock:std(0x635c56,.84),
    quartz:std(0xccbeb0,.31,.11),amethyst:std(0x947ca3,.34,.22),pyrite:std(0xb5a065,.42,.66),
    smoke:std(0x88705d,.43,.22),ruby:std(0xb65c50,.30,.21),jade:std(0x688b7b,.36,.25),
    displayGlass:{material:new T.MeshBasicMaterial({color:0xbad0da,opacity:.116,transparent:true,depthWrite:false}),cast:false},
    lamp:common.flame,label:signage(T)
  };
  const shapes={
    ring:new T.TorusGeometry(1,.034,7,42),jewelRing:new T.TorusGeometry(1,.12,5,16),
    sphere:new T.SphereGeometry(1,16,10),cylinder:new T.CylinderGeometry(1,1,1,18),
    profile:new T.CylinderGeometry(.43,1,1,18),block:new T.BoxGeometry(1,1,1),dodeca:new T.DodecahedronGeometry(1,0),
    crystal:new T.CylinderGeometry(.27,1,1,6),gem:new T.IcosahedronGeometry(1,0)
  };
  const a=furniture(T,entry,world,materials,shapes);entrance(a);a.done();
  const b=furniture(T,rear,world,materials,shapes);displays(b);framedPoster(T,rear,b,poster);b.done();
  for(const g of Object.values(shapes))g.dispose();
}
