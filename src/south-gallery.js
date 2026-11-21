import {architectureKit} from './architecture-kit.js';
import {HALL,WINGS} from './palace-openings.js';
import {labLower} from './lab-layout.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {collectibles,dressArchitecturalModels,galleryModels,galleryObjectMaterials} from './south-gallery-exhibits.js';

const p=(x,y,z)=>[x,y,z],Y=HALL.floor;
export const GALLERY_PISTOL=[WINGS.outer-.313,.544,0];
const signs=[
  ['01 · ASTRONOMIE','Armillarsphäre','Messingringe und Himmelsachsen'],
  ['02 · ARCHITEKTUR','Das Erlanger Schloss','Schematisches Modell der Residenz'],
  ['03 · UHRWERK','Standuhr','Zifferblatt und sichtbares Pendel'],
  ['04 · TAFELKULTUR','Tafelgerät','Löffel, Gabel und Servierbesteck'],
  ['05 · NATURALIEN','Mineralien','Quarz, Amethyst, Rauchquarz, Pyrit'],
  ['06 · SCHMUCK','Zierstücke','Ring, Brosche und Anhänger'],
  ['', 'BIES', 'Zeitgenössischer Druck'],
  null, // clock dial
  ['07 · ARCHIV','Siegel und Marken','Wachsabdrücke, Petschaft und Kassenmarken'],
  ['08 · BOTANIK','Herbarium','Gepresste Gartenpflanzen und Saatgut'],
  ['09 · FUNDSTÜCKE','Gebrannte Erde','Gefäßrekonstruktion und geborgene Scherben'],
  ['10 · KARTOGRAFIE','Erdglobus','Handkolorierte Karte im Messingmeridian'],
  ['11 · GARTENKUNST','Das Gartenparterre','Studienmodell mit Wegen, Beeten und Brunnen'],
  ['05 A','Bergkristall','Quarz · klare Spitzen'],['05 B','Amethyst','Quarz · violette Druse'],
  ['05 C','Pyrit','Eisensulfid · würfeliger Habitus'],['05 D','Rauchquarz','Quarz · eingewachsene Spitzen'],
  ['04 A','Silberlöffel','Treibarbeit'],['04 B','Tafelgabel','Vier Zinken'],['04 C','Messer','Stahlklinge · Griff mit Einlage'],
  ['04 D','Schöpfkelle','Gehämmerte Schale'],['06 A','Granatring','Krappenfassung'],['06 B','Brosche','Grünstein · Perlrand'],
  ['06 C','Medaillon','Kette mit ovalen Gliedern'],
  ['SÜDFLÜGEL · SAAL I','Maß und Modell','Instrumente, Baukunst und Gartenentwürfe'],
  ['SÜDFLÜGEL · SAAL II','Kabinett der Sammlungen','Naturkunde, Handwerk und Zeitdokumente']
];
const tileW=512,tileH=160,rows=Math.ceil(signs.length/2);
function signage(T){
  const canvas=document.createElement('canvas');canvas.width=2*tileW;canvas.height=rows*tileH;
  const c=canvas.getContext('2d');
  signs.forEach((data,i)=>{
    if(!data)return;
    const [chapter,title,body]=data;
    const x=(i%2)*tileW,y=Math.floor(i/2)*tileH;
    c.fillStyle='#ddd0ab';c.fillRect(x,y,tileW,tileH);
    c.strokeStyle='#867358';c.lineWidth=1.7;c.strokeRect(x+10,y+10,tileW-20,tileH-20);
    c.fillStyle='#6a4c38';c.font='bold 17px sans-serif';c.fillText(chapter,x+27,y+45);
    c.fillStyle='#312b25';c.font='bold 39px Georgia,serif';c.fillText(title,x+26,y+95,tileW-52);
    c.fillStyle='#514a3b';c.font='22px sans-serif';c.fillText(body,x+27,y+129,tileW-54);
    const rand=randomSource(6721+i*53);c.fillStyle='#70563917';
    for(let n=0;n<1100;n++)c.fillRect(x+rand()*tileW,y+rand()*tileH,.7+rand()*3,.4+rand()*1.4);
  });
  // Roman clock face, packed with the museum labels into one atlas.
  const x=tileW+tileW*.5,y=3*tileH+tileH*.5;
  c.fillStyle='#443626';c.fillRect(tileW,3*tileH,tileW,tileH);
  c.beginPath();c.arc(x,y,72,0,Math.PI*2);c.fillStyle='#e0ce9f';c.fill();
  c.strokeStyle='#826444';c.lineWidth=2;c.beginPath();c.arc(x,y,67,0,Math.PI*2);c.stroke();
  for(let i=0;i<60;i++){
    const a=i*Math.PI/30,w=i%5?62:59;
    c.beginPath();c.moveTo(x+w*Math.sin(a),y-w*Math.cos(a));c.lineTo(x+64.5*Math.sin(a),y-64.5*Math.cos(a));c.stroke();
  }
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
  const labels={position:[],uv:[]},pi=Math.PI;
  const box=(m,a,b,y,Y,d,f)=>k.box(m,p,a,b,y,Y,d,f);
  function put(m,g,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,order='XYZ'){
    position.set(x,y,z);scale.set(sx,sy,sz);q.setFromEuler(euler.set(rx,ry,rz,order));
    const shape=g==='sphere'&&Math.max(sx,sy,sz)<.091?'bead':g;
    k.geometry(m,shapes[shape],matrix.compose(position,q,scale));
  }
  const axis=new T.Vector3(0,1,0),v=new T.Vector3();
  function rod(m,a,b,r){
    position.fromArray(a);v.fromArray(b).sub(position);
    const n=v.length();if(n<.00001)return;
    k.geometry(m,r<.013?shapes.pin:shapes.cylinder,
      matrix.compose(position.addScaledVector(v,.5),q.setFromUnitVectors(axis,v.normalize()),scale.set(r,n,r)));
  }
  const block=(a,b,d,f)=>world.box(a,d,b,f,p=>!labLower(p.y));
  function plate(tile,point,clock=false){
    const a=clock?176:5,b=clock?336:tileW-5,l=clock?0:5,h=clock?tileH:tileH-5;
    const u=((tile%2)*tileW+a)/(2*tileW),v=((tile%2)*tileW+b)/(2*tileW);
    const bot=1-(Math.floor(tile/2)*tileH+h)/(rows*tileH),top=1-(Math.floor(tile/2)*tileH+l)/(rows*tileH);
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
  function itemCard(tile,x,y,z,dir,w=.25,h=.074){
    put('labelWood','block',x,y,z,w+.012,.021,h+.016,.25*dir);
    plate(tile,(u,v)=>[x+dir*u*w*.5,y+.015+v*h*.124,z-dir*v*h*.485]);
  }
  function plinth(x,z,w,d,top,kind='walnut'){
    const b=(m,w,d,a,b)=>box(m,x-w/2,x+w/2,a,b,z-d/2,z+d/2);
    b('mountStone',w+.11,d+.11,Y,.134);
    b('stoneCap',w+.082,d+.082,.134,.151);
    b('ebony',w+.045,d+.045,.149,.194);
    b('walnutEdge',w+.035,d+.035,.194,.214);
    b(kind,w,d,.209,top-.083);
    b('edgeBrass',w+.021,d+.022,top-.096,top-.075);
    b('walnut',w+.056,d+.057,top-.078,top-.024);
    b('ebony',w+.025,d+.025,top-.024,top);
    const decorate=(p,width)=>{
      const E=width*.5-.055,y=.258,h=top-.143;
      k.box('walnutEdge',p,-E,E,y,h,.001,.014);
      k.box('walnutInset',p,-E+.043,E-.043,y+.041,h-.041,.014,.019);
      for(const u of [-E+.025,E-.025]){
        k.box('woodInlay',p,u-.0025,u+.0025,y+.029,h-.029,.019,.023);
        k.box('ebony',p,u-.006,u+.006,y-.009,y+.008,.021,.026);
      }
      for(const v of [y+.026,h-.031])
        k.box('woodInlay',p,-E+.032,E-.032,v-.0025,v+.0025,.019,.022);
      for(const u of [-E-.024,E+.024])k.box('walnutEdge',p,u-.022,u+.022,.224,top-.094,0,.027);
      for(const v of [y+.017,h-.018])k.box('polishedTrim',p,-E+.024,E-.024,v-.006,v+.006,.017,.026);
      const cy=(y+h)*.5,rx=width>.9?.099:.071;
      for(let i=0;i<8;i++){
        const a=i*pi/4,b=a+pi/4;
        const A=p(rx*Math.cos(a),cy+rx*Math.sin(a),.0208),
          B=p(.045*Math.cos((a+b)*.5),cy+.045*Math.sin((a+b)*.5),.0208),
          C=p(rx*Math.cos(b),cy+rx*Math.sin(b),.0208),D=p(0,cy,.0208);
        k.triangle(i%2?'decorCopper':'polishedTrim',D,A,B,[0,0,.13,.22,.23,0]);
        k.triangle(i%2?'polishedTrim':'decorCopper',D,B,C,[0,0,.13,.22,.23,0]);
      }
    };
    for(const s of [-1,1]){
      decorate((a,b,v)=>[x+s*a,b,z+s*(d/2+v)],w);
      decorate((a,b,v)=>[x+s*(w/2+v),b,z-s*a],d);
    }
    block(x-w/2-.056,x+w/2+.056,z-d/2-.055,z+d/2+.055);
  }
  function caseFrame(x,z,w,d,label){
    const dir=z<0?1:-1,top=.982;
    plinth(x,z,w,d,top);
    const l=x-w/2+.076,r=x+w/2-.076,a=z-d/2+.074,b=z+d/2-.074;
    const y=top+.036,cap=zz=>top+.448-(zz-z)*dir*.210;
    box(label%2?'blueFelt':'velvet',l,r,top,top+.024,a,b);
    for(const xx of [l,r])for(const zz of [a,b]){
      box('edgeBrass',xx-.011,xx+.011,y-.006,cap(zz)+.009,zz-.011,zz+.011);
      put('gold','cylinder',xx,cap(zz)+.009,zz,.015,.009,.015);
      put('brassPlate','block',xx,y-.006,zz,.044,.034,.044);
    }
    for(const xx of [l,r]){
      rod('edgeBrass',[xx,cap(a),a+.011],[xx,cap(b),b-.011],.008);
      box('woodInlay',xx-.003,xx+.003,y-.013,y-.005,a+.022,b-.022);
    }
    for(const zz of [a,b]){
      box('edgeBrass',l+.011,r-.011,cap(zz)-.007,cap(zz)+.007,zz-.008,zz+.008);
      box('woodInlay',l+.022,r-.022,y-.013,y-.005,zz-.003,zz+.003);
    }
    // Sort glazing per cabinet while batching the opaque parts by finish.
    const pane=new T.Group();pane.name='Vitrine '+(label+1)+' · entspiegeltes Glas';pane.userData.noSceneQuery=true;group.add(pane);
    const glass=architectureKit(T,pane,materials),c=l+.011,e=r-.011,f=a+.011,g=b-.011;
    glass.quad('displayGlass',[l,y,f],[l,y,g],[l,cap(g)-.005,g],[l,cap(f)-.005,f]);
    glass.quad('displayGlass',[r,y,g],[r,y,f],[r,cap(f)-.005,f],[r,cap(g)-.005,g]);
    glass.quad('displayGlass',[c,y,b],[e,y,b],[e,cap(b)-.007,b],[c,cap(b)-.007,b]);
    glass.quad('displayGlass',[e,y,a],[c,y,a],[c,cap(a)-.007,a],[e,cap(a)-.007,a]);
    glass.quad('displayGlass',[c,cap(f)+.003,f],[c,cap(g)+.003,g],[e,cap(g)+.003,g],[e,cap(f)+.003,f]);
    glass.flush(pane.name);
    const back=z-dir*(d*.5-.084);
    box('ebony',l+.051,r-.051,cap(back)-.041,cap(back)-.023,back-.013,back+.013);
    box('lamp',l+.066,r-.066,cap(back)-.043,cap(back)-.0415,back-.007,back+.007);
    const latch=z+dir*(d*.5-.062);
    for(const dx of [-w*.32,w*.32]){
      box('edgeBrass',x+dx-.029,x+dx+.029,y-.028,y+.034,latch-.015,latch+.015);
      put('ebony','cylinder',x+dx,y+.011,latch+dir*.016,.009,.005,.009,Math.PI/2);
    }
    labelMount(label,x,top+.050,z+dir*(d*.5-.035),dir,.64,.152);
    for(const t of [-.249,.249])put('gold','cylinder',x+t,top-.039,z+dir*(d*.5+.030),.011,.009,.011,pi/2);
    return top+.024;
  }
  function done(){
    if(labels.position.length){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(labels.position,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(labels.uv,2));g.computeVertexNormals();
      const o=new T.Mesh(g,materials.label);o.name='Südflügel · Schilder und Zifferblatt';group.add(o);
    }
    k.flush(group.name);
  }
  return {k,box,put,rod,block,plate,labelMount,itemCard,plinth,caseFrame,done};
}

function entrance(fit){
  const {k,box,put,rod,block,plate,labelMount,plinth}=fit;
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
  for(const [j,d] of [-.198,.198].entries()){
    put('edgeBrass','ring',x+d,c-.24,z,.073,.073,.077,0,Math.PI/2);
    put('ebony','cylinder',x+d,c-.24,z,.034,.039,.034,0,0,Math.PI/2);
    put('gold','sphere',x+d,c-.24,z,.028,.029,.027);
    put('woodInlay','block',x+(j===0?-.192:.192),1.08,z+.122,.093,.025,.037,0,.3*(j?1:-1));
  }
  put('edgeBrass','cylinder',x,c-.24,z,.012,.409,.012,0,0,Math.PI/2);
  put('silverPatina','ring',x,c+.009,z,.381,.381,.109,Math.PI/2);
  for(let i=0;i<48;i++){
    const a=i*Math.PI/24,A=Math.sin(a),B=Math.cos(a),s=i%4===0?.021:.010;
    rod(i%4?'decorCopper':'brightSilver',[x+A*.365,c+.018,z+B*.365],[x+A*(.365+s),c+.018,z+B*(.365+s)],.0026);
    if(i%8===0)put('chromeGold','sphere',x+A*.376,c+.020,z+B*.376,.010,.005,.010);
  }
  for(const t of [-1,1])put('chromeGold','sphere',x+t*.147,c+t*.36,z,.024,.021,.024);
  put('decorCopper','ring',x,1.075,z,.226,.226,.39,Math.PI/2);

  // 2. A stylised architectural survey model, with no claim to be a historic maquette.
  const X=8.65,Z=3.06,F=1.136;
  plinth(X,Z,2.23,1.32,1.048);
  labelMount(1,X,1.11,Z-.537,-1,.69,.19);
  box('modelBase',X-1.04,X+1.04,1.048,F,Z-.455,Z+.455);
  for(const d of [-.399,.375])box('galleryCut',X-1.004,X+1.004,F-.006,F+.005,Z+d,Z+d+.025);
  box('limestone',X-.962,X+.962,F,F+.62,Z-.265,Z+.265);
  box('modelTrim',X-.976,X+.976,F+.109,F+.140,Z-.280,Z+.280);
  box('modelTrim',X-.978,X+.978,F+.568,F+.61,Z-.278,Z+.278);
  for(const side of [-1,1])for(let j=0;j<15;j++){
    const a=X-.85+j*.121,v=Z+side*.273;
    for(let row=0;row<3;row++){
      const y=F+.047+row*.18;
      box('modelTrim',a-.034,a+.034,y-.007,y+.104,v-.009,v+.010);
      box('modelPane',a-.024,a+.024,y+.009,y+.092,v+side*.007-.006,v+side*.007+.006);
      const front=v+side*.015;
      box('modelTrim',a-.003,a+.003,y+.011,y+.089,front-.001,front+.0015);
      box('modelTrim',a-.028,a+.028,y+.014,y+.020,front-.003,front+.004);
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
    const zz=outer+side*.018;
    for(const u of [-.163,-.058,.058,.163]){
      const xx=X+u;
      box('limestone',xx-.010,xx+.010,F+.136,F+.548,zz-.006,zz+.006);
      for(const y of [F+.126,F+.550])box('modelTrim',xx-.017,xx+.017,y-.011,y+.016,zz-.011,zz+.011);
    }
    for(let j=0;j<9;j++){
      const a=(j/9)*Math.PI,b=(j+1)*Math.PI;
      rod('modelTrim',[X+Math.cos(a)*.039,F+.099+Math.sin(a)*.050,zz],
        [X+Math.cos(b)*.039,F+.099+Math.sin(b)*.050,zz],.004);
    }
    for(const u of [-.04,.04])rod('modelTrim',[X+u,F+.021,zz],[X+u,F+.102,zz],.0044);
  }
  const a=[X-.98,F+.61,Z-.28],b=[X+.98,F+.61,Z-.28],c2=[X+.98,F+.61,Z+.28],d=[X-.98,F+.61,Z+.28];
  const e=[X-.76,F+.747,Z],f=[X+.76,F+.747,Z];
  k.quad('modelSlate',b,a,e,f);k.quad('modelSlate',d,c2,f,e);
  k.triangle('modelSlate',a,d,e,[0,0,1,0,.5,1]);k.triangle('modelSlate',c2,b,f,[0,0,1,0,.5,1]);
  for(const side of [-1,1])for(let j=0;j<7;j++){
    const g=(j+.26)/7,joint=(j+.41)/7;
    const Q=(t,s)=>[X+s*(.978-.22*t),F+.612+.137*t,Z+side*.277*(1-t)];
    const corners=[Q(g,-1),Q(g,1),Q(joint,1),Q(joint,-1)];
    if(side<0)corners.reverse();
    k.quad(j%2?'roofLine':'modelSlate',...corners,.285);
  }
  for(const x of [X-.65,X+.65]){
    box('limestone',x-.036,x+.036,F+.692,F+.793,Z-.095,Z-.039);
    box('modelTrim',x-.043,x+.043,F+.790,F+.804,Z-.101,Z-.033);
    box('modelPane',x-.022,x+.022,F+.8042,F+.806,Z-.086,Z-.050);
  }
  for(let j=0;j<18;j++){
    const x=X-.937+j*.110;
    box('modelBase',x-.007,x+.007,F+.004,F+.038,Z-.432,Z-.419);
  }
  box('ebony',X-.955,X+.969,F+.03,F+.036,Z-.433,Z-.425);
  for(let j=0;j<20;j++){
    const x=X-.981+j*.101;
    box('pavingJoint',x-.002,x+.002,F+.001,F+.0017,Z+.314,Z+.422);
  }
  for(const step of [0,1,2]){
    const w=.186-step*.033,z=Z-.367-step*.028;
    box('galleryCut',X-w,X+w,F+.004+step*.011,F+.016+step*.011,z,z+.032);
  }

  // 3. The far side of the first room has a longcase clock beside the arch.
  const u=11.72,v=-4.82;
  const profile=(m,w,depth,a,b)=>box(m,u-depth,u+.18,a,b,v-w/2,v+w/2);
  profile('mountStone',.77,.38,Y,.157);
  profile('walnut',.68,.31,.157,.35);
  profile('edgeBrass',.59,.263,.333,.356);
  box('walnut',u+.073,u+.181,.35,1.62,v-.279,v+.279);
  for(const dz of [-.255,.255]){
    box('walnut',u-.253,u+.087,.35,1.62,v+dz-.031,v+dz+.031);
    box('walnutEdge',u-.279,u-.249,.426,1.585,v+dz-.027,v+dz+.027);
    box('woodInlay',u-.282,u-.278,.457,1.553,v+dz-.005,v+dz+.005);
  }
  box('walnut',u-.249,u+.106,.355,.491,v-.249,v+.249);
  box('walnut',u-.249,u+.106,1.516,1.628,v-.249,v+.249);
  profile('labelWood',.71,.29,1.59,1.68);
  profile('walnut',.70,.31,1.68,2.43);
  profile('edgeBrass',.74,.325,2.402,2.434);
  profile('walnut',.796,.356,2.434,2.494);
  for(const d of [-.284,.284])put('gold','sphere',u-.12,2.548,v+d,.034,.046,.034);
  box('ebony',u+.054,u+.073,.495,1.521,v-.212,v+.212);
  for(const d of [-.207,.197])box('labelWood',u-.269,u-.242,.49,1.57,v+d,v+d+.011);
  box('gold',u-.126,u-.110,.722,1.46,v-.010,v+.010);
  put('gold','cylinder',u-.137,.735,v,.101,.028,.101,0,0,Math.PI/2);
  put('brassPlate','cylinder',u-.154,.735,v,.080,.009,.080,0,0,Math.PI/2);
  for(const [i,d] of [-.132,.139].entries()){
    box('ebony',u-.104,u-.096,.884+i*.13,1.503,v+d-.003,v+d+.003);
    put('gold','cylinder',u-.100,.969+i*.13,v+d,.025,.131,.025);
    put('edgeBrass','cylinder',u-.100,.896+i*.13,v+d,.029,.017,.029);
  }
  k.quad('displayGlass',[u-.271,.506,v-.209],[u-.271,.506,v+.209],[u-.271,1.514,v+.209],[u-.271,1.514,v-.209]);
  for(const y of [.538,1.469])put('edgeBrass','block',u-.284,y,v-.222,.019,.047,.025);
  put('edgeBrass','ring',u-.289,.925,v+.206,.020,.028,.031,0,Math.PI/2);
  put('edgeBrass','ring',u-.316,2.042,v,.334,.334,.334,0,Math.PI/2,0);
  put('decorCopper','ring',u-.324,2.042,v,.309,.309,.127,0,Math.PI/2);
  for(const d of [-.292,.292]){
    rod('walnutEdge',[u-.285,1.704,v+d],[u-.285,2.364,v+d],.021);
    for(const y of [1.730,2.338])put('gold','cylinder',u-.285,y,v+d,.028,.028,.028);
  }
  plate(7,(a,b)=>[u-.317,2.042+b*.336,v+a*.336],true);
  block(u-.40,u+.21,v-.405,v+.405);
  box('labelWood',u-.91,u-.66,.759,.806,v+.56,v+.98);
  box('ebony',u-.81,u-.76,Y,.762,v+.73,v+.78);
  labelMount(2,u-.789,.85,v+.771,1,.28,.138);
  block(u-.92,u-.65,v+.56,v+.99);
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
  return sheet;
}

function pistolShelf(fit){
  // A low shelf below the artwork, separate from both the frame and the
  // secret floor hatch. The compact prop sits on a dark felt liner.
  const [sx,h,sz]=GALLERY_PISTOL,{box,block}=fit;
  box('walnut',sx-.222,sx+.260,h-.056,h-.014,sz-.405,sz+.405);
  box('ebony',sx-.216,sx+.250,h-.014,h-.004,sz-.392,sz+.392);
  box('velvet',sx-.162,sx+.168,h-.005,h,sz-.316,sz+.316);
  box('edgeBrass',sx-.223,sx-.216,h-.044,h-.037,sz-.380,sz+.380);
  for(const z of [-.271,.271]){
    box('walnutEdge',sx+.164,sx+.253,h-.244,h-.055,z-.048,z+.048);
    box('ebony',sx+.038,sx+.181,h-.126,h-.054,z-.034,z+.034);
    box('edgeBrass',sx+.151,sx+.165,h-.167,h-.151,z-.026,z+.026);
  }
  block(sx-.222,sx+.259,sz-.405,sz+.405);
}

function roomMarker(fit,tile,front){
  const {box,plate,put}=fit,wall=WINGS.partition+(front===1?.28:0),x=wall+front*.064,y=2.05,z=2.68;
  const F=(a,b)=>[Math.min(wall+front*a,wall+front*b),Math.max(wall+front*a,wall+front*b)];
  box('ebony',...F(-.004,.034),y-.252,y+.251,z-.824,z+.824);
  box('walnut',...F(.034,.057),y-.234,y+.233,z-.802,z+.803);
  for(const side of [-1,1]){
    const b=y+side*.220;
    box('polishedTrim',...F(.057,.067),b-.006,b+.006,z-.779,z+.779);
    const d=z+side*.773;
    box('polishedTrim',...F(.056,.067),y-.211,y+.211,d-.006,d+.006);
    for(const t of [-.213,.213])put('decorCopper','cylinder',x+front*.004,y+t,d,.013,.013,.013,0,0,piOverTwo);
  }
  plate(tile,(u,v)=>[x+front*.0005,y+v*.202,z-front*u*.751]);
}
const piOverTwo=Math.PI/2;

export function furnishSouthGallery(T,root,world,common,poster){
  const entry=new T.Group(),rear=new T.Group();
  entry.name='Südflügel · Auftakt';rear.name='Südflügel · Kabinett der Sammlungen';root.add(entry,rear);
  const oak=sharedSet(T,'fineOak',256),stone=sharedSet(T,'galleryStone',256),fibres=sharedSet(T,'canvas',128),
    metal=sharedSet(T,'cutMetal',128),rock=sharedSet(T,'bedrock',256);
  const std=(color,roughness=.72,metalness=0,detail={},strength=.36)=>
    new T.MeshStandardMaterial({color,roughness,metalness,...detail,normalScale:new T.Vector2(strength,strength)});
  const materials={
    walnut:std(0x8d674e,.67,0,oak,.65),walnutEdge:std(0xa67c5b,.60,0,oak,.47),walnutInset:std(0xaf825d,.72,0,oak,.48),
    woodInlay:std(0xc9a774,.71,0,oak,.19),ebony:std(0x56504b,.81,0,oak,.29),labelWood:std(0xab7d55,.74,0,oak),
    edgeBrass:std(0xb78c55,.61,.52,metal,.25),gold:std(0xcf9f57,.49,.59,metal,.21),brassPlate:std(0xbda279,.58,.63,metal,.26),
    mountStone:std(0xc9bba1,.88,0,stone),limestone:common.galleryBand,galleryCut:common.galleryCut,
    modelBase:std(0xb6a485,.85,0,stone),modelTrim:std(0xd8c6a6,.86,0,stone,.28),
    modelSlate:std(0x555b58,.84,0,rock,.32),modelPane:std(0x565d61,.58),
    velvet:std(0x4f5750,.97,0,fibres,.47),cloth:std(0x82705a,.97,0,fibres,.33),paper:std(0xd1bf96,.95,0,fibres,.44),
    roofLine:std(0x697571,.86,0,rock,.50),pavingJoint:std(0x8b8170,.94,0,stone,.45),
    silver:std(0xd5d1c1,.48,.65,metal,.24),silverInset:std(0x958f80,.56,.53,metal,.24),
    rock:std(0x83786d,.91,0,rock,.53),rockFlake:std(0xa49b8a,.89,0,rock,.42),
    quartz:std(0xccbeb0,.31,.11),amethyst:std(0x947ca3,.34,.22),pyrite:std(0xb5a065,.42,.66),
    smoke:std(0x88705d,.43,.22),ruby:std(0xb65c50,.30,.21),jade:std(0x688b7b,.36,.25),
    displayGlass:{material:new T.MeshStandardMaterial({color:0xc4e2df,opacity:.072,roughness:.20,metalness:.28,
      transparent:true,depthWrite:false,envMapIntensity:.82}),cast:false},
    lamp:common.flame,label:signage(T),...galleryObjectMaterials(T,std)
  };
  const profile=(s,n)=>new T.LatheGeometry(s.map(([r,y])=>new T.Vector2(r,y)),n);
  const shapes={
    ring:new T.TorusGeometry(1,.034,7,42),jewelRing:new T.TorusGeometry(1,.12,5,16),
    sphere:new T.SphereGeometry(1,16,10),bead:new T.SphereGeometry(1,10,6),
    cylinder:new T.CylinderGeometry(1,1,1,18),pin:new T.CylinderGeometry(1,1,1,8),
    profile:new T.CylinderGeometry(.43,1,1,18),block:new T.BoxGeometry(1,1,1),dodeca:new T.DodecahedronGeometry(1,0),
    utensil:profile([[0,-.51],[.50,-.51],[.92,-.43],[.81,-.31],[.62,-.14],[.57,.02],[.65,.40],[.46,.50],[0,.50]],14),
    ...galleryModels(T,profile)
  };
  const a=furniture(T,entry,world,materials,shapes);entrance(a);dressArchitecturalModels(a);roomMarker(a,24,-1);a.done();
  const b=furniture(T,rear,world,materials,shapes);collectibles(b);roomMarker(b,25,1);pistolShelf(b);const posterFace=framedPoster(T,rear,b,poster);b.done();
  for(const g of Object.values(shapes))g.dispose();
  return posterFace;
}
