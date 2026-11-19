import {architectureKit} from './architecture-kit.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {LAB,LAB_CUT,LAB_LAYER,labLower} from './lab-layout.js';
import {cellarWalls,makeLabDeck} from './lab-wing.js';
import {addLabGraffiti} from './lab-graffiti.js';
import {dressLab} from './lab-dressing.js';

// Entirely fictional scenography: no real building connection or lab protocol.
const {left,right,back,front}=LAB_CUT,{top,floor,ceiling,end,south,north}=LAB;
const centre=(back+front)/2,gateX=left-.105;
const coords=(x,y,z)=>[x,y,z];

function dressing(T,kind){
  const sheet=document.createElement('canvas');sheet.width=900;sheet.height=560;
  const c=sheet.getContext('2d'),paper=kind==='paper';
  c.fillStyle=paper?'#bfb291':'#243d43';c.fillRect(0,0,900,560);
  const r=randomSource(72781);
  for(let i=0;i<4500;i++){
    c.fillStyle=i%4===0?'#00000010':'#ffffff0b';c.fillRect(r()*900,r()*560,2+r()*6,1+r()*2);
  }
  const ink=paper?'#283231':'#d2d8bd';c.fillStyle=ink;c.strokeStyle=ink;c.lineWidth=3;
  c.strokeRect(23,23,854,514);c.strokeRect(32,32,836,496);
  c.font='bold 59px Georgia';c.fillText('PROJEKT BAYERN',57,111);
  c.font='24px monospace';c.fillText('KAMMER 04 / SERIE B   •   PERSONENBESTAND: 0',60,151);
  c.beginPath();c.moveTo(55,171);c.lineTo(847,171);c.stroke();
  const outline=(points,fill)=>{
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}c.stroke();
  };
  // Original garment drawings, not biological instructions.
  c.lineWidth=5;
  outline([[138,345],[143,264],[164,211],[185,216],[160,288],[160,314],[285,314],[283,284],[259,217],[282,209],
    [310,266],[315,346],[302,439],[259,439],[240,374],[211,374],[192,439],[144,437]],paper?'#966847':'#705741');
  outline([[168,304],[283,304],[275,351],[175,351]],paper?'#a88158':'#977552');
  c.strokeRect(211,320,28,15);
  c.lineWidth=3;c.beginPath();c.moveTo(176,366);c.quadraticCurveTo(195,390,180,420);
  c.moveTo(277,366);c.quadraticCurveTo(252,390,273,420);c.stroke();
  outline([[579,304],[574,250],[555,232],[573,208],[598,216],[618,244],[646,244],[669,215],[696,208],
    [711,231],[687,251],[682,303],[701,350],[723,441],[541,441],[560,351]],paper?'#6b775e':'#607e6b');
  outline([[600,315],[660,315],[680,401],[655,423],[604,423],[578,401]],paper?'#923e38':'#9c574e');
  c.beginPath();for(let i=0;i<3;i++){
    const y=267+i*13;c.moveTo(618,y);c.lineTo(643,y+12);c.moveTo(643,y);c.lineTo(618,y+12);
  }c.stroke();
  c.font='bold 25px monospace';c.fillStyle=ink;c.fillText('B-01  LEDERHOSE',106,480);c.fillText('B-02  DIRNDL',523,480);
  c.font='19px monospace';c.fillText('KOSTÜMABTEILUNG · SPIND B · AUSGABE GESPERRT',60,514);
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return map;
}

function terminalDisplay(T){
  const sheet=document.createElement('canvas');sheet.width=512;sheet.height=160;
  const c=sheet.getContext('2d');
  c.fillStyle='#152c29';c.fillRect(0,0,512,160);
  c.strokeStyle='#47745d';c.strokeRect(10,10,492,140);
  c.font='bold 18px monospace';c.fillStyle='#a1c7a1';c.fillText('P.BAYERN // SEKTION B',22,35);
  c.font='16px monospace';c.fillText('BELEGUNG: 0 / 3',22,66);
  c.fillStyle='#edb381';c.fillText('03  —  STROMKREIS GETRENNT',22,120);
  c.strokeStyle='#83be9b';c.lineWidth=2;c.beginPath();
  [[270,64],[309,64],[318,51],[330,80],[342,59],[354,64],[482,64]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  c.fillStyle='#080f1555';for(let y=0;y<160;y+=4)c.fillRect(0,y,512,1);
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;return map;
}

export function addPalaceLab(T,root,world,M){
  const shell=new T.Group(),shaft=new T.Group(),cabinet=new T.Group();root.add(shell,shaft,cabinet);
  shell.name='Lesesaal · Verkleidung der Kellertreppe';shaft.name='Projekt Bayern · Treppenschacht';cabinet.name='Regal mit lockerem Buch';
  const plain=(color,roughness=.88,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const glow=(color,power)=>plain(color,.62,{emissive:color,emissiveIntensity:power});
  const wood=M.oak.clone();wood.color.setHex(0x795c48);wood.vertexColors=false;
  const darkWood=M.oak.clone();darkWood.color.setHex(0x604738);darkWood.vertexColors=false;
  const plaster=plain(0x747a71,.92,sharedSet(T,'plaster',256));
  plaster.normalScale.setScalar(.40);
  const enamel=sharedSet(T,'enamel',256);
  const materials={
    plaster,concrete:plain(0x626462,.9,sharedSet(T,'plaster',256)),wood,darkWood,
    green:plain(0x526f68,.88,{...enamel,metalness:.16}),iron:plain(0x303939,.66,{metalness:.44}),
    rust:plain(0x82513f,.96,{...enamel,metalness:.20}),gray:plain(0x8a958b,.66,{metalness:.43}),
    gunmetal:plain(0x495651,.92,{...enamel,metalness:.25}),edge:plain(0x869890,.54,{metalness:.41}),
    copper:plain(0xa86945,.78,{...enamel,metalness:.53}),copperDark:plain(0x694538,.91,{...enamel,metalness:.35}),
    porcelain:plain(0xbab4a2,.64),beerGlass:plain(0x784b22,.30,{metalness:.20}),
    gasket:plain(0x252c2b),brass:plain(0xad8960,.59,{metalness:.51}),
    red:{material:glow(0xde5442,.66),cast:false},cold:{material:glow(0x86cfc1,.53),cast:false},
    ivory:{material:glow(0xe8dfb5,.31),cast:false},leather:plain(0x764a30),cloth:plain(0x5b715e),
    apron:plain(0x914f49),canvas:plain(0xd6c6b2),bookA:plain(0x5d6555),bookB:plain(0x77483c),bookC:plain(0x4b5968),
    ochre:plain(0xad8644),paper:plain(0xa79c7d),archiveWall:plain(0x77705b,.91,sharedSet(T,'plaster',256)),
    vaultWall:plain(0x514742,.92,sharedSet(T,'plaster',256)),ceramic:plain(0x8b9083,.64),
    glassDark:plain(0x253e3c,.27,{metalness:.37})
  };
  const a=architectureKit(T,shell,materials),s=architectureKit(T,shaft,materials),r=architectureKit(T,cabinet,materials);
  const sb=(m,x0,x1,y0,y1,z0,z1)=>a.box(m,coords,x0,x1,y0,y1,z0,z1);
  const stair=(m,x0,x1,y0,y1,z0,z1)=>s.box(m,coords,x0,x1,y0,y1,z0,z1);
  const shelf=(m,x0,x1,y0,y1,z0,z1)=>r.box(m,coords,x0,x1,y0,y1,z0,z1);
  const below=p=>labLower(p.y),above=p=>!below(p);
  const d={id:'lab-secret',label:'Lockeres Buch',target:0,progress:0};

  for(let i=0;i<LAB.count;i++){
    const x=left+i*LAB.run,y=top-(i+1)*LAB.riser;
    stair('concrete',x,x+LAB.run,floor-.13,y,back,front);
    stair('gray',x-.017,x+.047,y-.026,y+.003,back+.05,front-.05);
    if(i>9&&i%3===2)for(const z of [back+.11,front-.26])stair('ochre',x+.004,x+.049,y+.001,y+.007,z,z+.15);
  }
  // At reading-room height the stair is enclosed by a tall, plain cabinet run.
  // The only opening is at the end of the wall, behind the sliding shelf.
  for(const z of [back-.15,front]){
    stair('plaster',left,right+.035,floor,top+.003,z,z+.15);
    sb('darkWood',left,right+.21,top+.003,2.78,z,z+.15);
    sb('wood',left-.038,right+.23,2.66,2.81,z-.023,z+.174);
    sb('wood',left-.033,right+.10,.25,.33,z-.022,z+.176);
    for(let x=left+.2;x<right;x+=.68){
      sb('wood',x-.026,x+.026,.32,2.59,z-.013,z+.162);
      sb('wood',x,x+.54,2.17,2.207,z-.018,z+.163);
    }
    world.box(left,z,right+.02,z+.15);
  }
  sb('darkWood',right-.032,right+.22,-.44,2.79,back-.15,front+.15);
  world.box(right-.032,back-.15,right+.22,front+.15,above);
  sb('wood',gateX-.13,gateX+.13,2.67,2.81,back-.15,front+.15);
  for(const z of [back-.15,front])sb('wood',gateX-.125,gateX+.18,top,2.69,z,z+.15);
  // Visual railing on each side of the descent, following the exact slope.
  for(const z of [back+.075,front-.075]){
    const line=(u,y,w)=>[left+.11+u,y+.91+top-u*LAB.riser/LAB.run,z+w];
    s.box('iron',line,0,right-left-.25,-.018,.035,-.024,.024);
    for(let x=left+.40;x<right-.14;x+=.91){
      const y=top-(x-left)*LAB.riser/LAB.run;
      stair('iron',x-.023,x+.023,y,y+.923,z-.018,z+.018);
    }
  }
  const capZ=back-.029,capEnd=front+.049,slide=2.48;
  shelf('darkWood',gateX-.207,gateX+.059,top,2.65,capZ,capEnd);
  for(const z of [capZ,capEnd-.052])shelf('wood',gateX-.254,gateX+.076,.13,2.69,z,z+.052);
  for(const [i,y] of [.23,.67,1.12,1.57,2.02,2.48].entries()){
    shelf('wood',gateX-.398,gateX+.045,y-.050,y+.022,capZ,capEnd);
    if(i===5)continue;
    for(let z=capZ+.085,j=0;z<capEnd-.11;j++){
      const wide=.056+(j%6)*.012;const h=.225+(j%5)*.025;
      shelf(['bookA','bookB','bookC'][j%3],gateX-.368,gateX-.205,y+.022,y+h,z,z+wide);
      if(j%3!==0)shelf('brass',gateX-.371,gateX-.363,y+h-.049,y+h-.038,z+.008,z+wide-.007);
      z+=wide+.022;
    }
  }
  shelf('brass',gateX-.414,gateX-.369,1.363,1.380,centre-.11,centre+.09);
  world.box(gateX-.39,capZ,gateX+.06,capEnd,p=>above(p)&&d.progress<.95);
  world.box(gateX-.39,capZ+slide,gateX+.06,capEnd+slide,p=>above(p)&&d.progress>=.95);
  a.flush('Treppenverkleidung');s.flush('Kellertreppe');r.flush('Bücherregal');
  shaft.traverse(o=>{o.layers.set(LAB_LAYER);if(o.isMesh)o.castShadow=false});
  cabinet.traverse(o=>{if(o.isMesh)o.castShadow=false});
  addLabGraffiti(T,shell);
  const deck=makeLabDeck(T,root,world,materials,(room,graphics)=>buildChambers(T,room,world,materials,graphics));
  const usable=p=>d.target===0||Math.abs(p.x-gateX)>.60;
  return {
    target(p,look){
      const dx=gateX-p.x,dz=centre-p.z,dist=Math.hypot(dx,dz);
      return p.y>-.20&&p.x<left-.035&&dist<2.02&&dx*look.x+dz*look.z>dist*.40?d:null;
    },
    usable,visible:deck.visible,prepare:(renderer,scene)=>deck.prepare(renderer,scene,shaft),
    update(dt,p){
      let changed=false;
      if(d.progress!==d.target){
        if(!d.target&&Math.abs(p.x-gateX)<.72&&p.z>back-.16&&p.z<front+slide+.19)d.target=1;
        const value=d.progress+(d.target?1:-1)*dt/.94;d.progress=Math.min(1,Math.max(0,value));
        const t=d.progress;cabinet.position.z=slide*t*t*(3-2*t);changed=dt>0;
      }
      return deck.update(p,d.target===1,dt)||changed;
    }
  };
}

function buildChambers(T,room,world,materials,graphics){
  const k=architectureKit(T,room,materials),below=p=>labLower(p.y);
  const dress=dressLab(T,k,room,graphics);
  const {housing,rod,flag,plaque,dial,grill,stain,fastener,plane}=dress;
  const box=(m,x0,x1,y0,y1,z0,z1)=>k.box(m,coords,x0,x1,y0,y1,z0,z1);
  cellarWalls(k,world,'chambers');
  box('concrete',right,end,ceiling,ceiling+.17,south,north);
  box('gasket',right,end,floor-.12,floor-.015,south,north);
  for(let x=right,i=0;x<end-.016;x+=.84,i++)for(let z=south,j=0;z<north-.016;z+=.84,j++){
    box((i*7+j*11)%12<2?'gray':'concrete',x+.006,Math.min(x+.832,end),floor-.024,floor,z+.006,Math.min(z+.834,north));
  }
  const drum=new T.CylinderGeometry(1,1,1,28),ring=new T.TorusGeometry(1,.052,8,30);
  const matrix=new T.Matrix4(),vec=new T.Vector3();
  function object(kind,g,x,y,z,s,rx=0,rz=0){
    const m=matrix.makeRotationX(rx).multiply(new T.Matrix4().makeRotationZ(rz)).scale(vec.set(...s));m.setPosition(x,y,z);
    k.geometry(kind,g,m);
  }
  // Ceiling pipes, cable hangers, metal grate, and restrained hazard marks.
  for(const z of [south+.40,south+.65,north-.52]){
    object(z>0?'green':'rust',drum,(right+end)*.5,ceiling-.26,z,[.091,end-right-.35,.091],0,Math.PI*.5);
    for(let x=right+1;x<end-.4;x+=1.85){
      object('iron',drum,x,ceiling-.26,z,[.116,.080,.116],0,Math.PI*.5);
      box('iron',x-.036,x+.036,ceiling-.171,ceiling,z-.06,z+.06);
    }
  }
  for(let x=right+.58,i=0;x<end-.40;x+=.43,i++){
    box(i%2?'iron':'brass',x,x+.38,floor,floor+.009,south+.73,south+.94);
    if(i%5===0)box('iron',x-.11,x+.23,floor,floor+.015,-.85,-.61);
  }
  for(const [x,z,kind] of [[right+1.1,-5.60,'red'],[-17.35,-5.12,'ivory'],[-14.4,1.40,'cold'],[-8.3,-3.53,'ivory']]){
    box('iron',x-.39,x+.39,ceiling-.103,ceiling-.015,z-.135,z+.135);
    box(kind,x-.328,x+.328,ceiling-.115,ceiling-.100,z-.077,z+.077);
    for(const dx of [-.20,0,.20])box('iron',x+dx-.010,x+dx+.010,ceiling-.132,ceiling-.104,z-.101,z+.102);
  }
  // Three empty chambers: clear sight through the front, substantial rear
  // shields and a temperature display. No live occupants or gore.
  const clear=new T.MeshPhysicalMaterial({color:0x91cec0,transparent:true,opacity:.20,depthWrite:false,roughness:.27,side:T.DoubleSide,metalness:.21});
  for(const [i,x] of [-17.0,-13.45,-9.90].entries()){
    const z=2.37,h=ceiling-floor;
    object('green',drum,x,floor+.19,z,[.91,.36,.91]);
    object('iron',drum,x,floor+h-.36,z,[.86,.37,.86]);
    object('gunmetal',drum,x,floor+.244,z,[.914,.123,.914]);
    object('edge',ring,x,floor+.287,z,[.87,.87,.42],-Math.PI*.5);
    object('green',drum,x,floor+h-.246,z,[.81,.089,.81]);
    object('edge',ring,x,floor+h-.434,z,[.813,.813,.35],-Math.PI*.5);
    object('gray',ring,x,floor+.365,z,[.78,.78,.72],-Math.PI*.5);
    object(i===2?'gasket':'cold',ring,x,floor+h-.599,z,[.76,.76,.65],-Math.PI*.5);
    object('iron',ring,x,floor+.085,z,[.89,.89,.67],-Math.PI*.5);
    box('green',x-.48,x+.48,floor+.35,ceiling-.51,z+.52,z+.81);
    box('gasket',x-.31,x+.31,floor+.46,ceiling-.74,z+.449,z+.536);
    for(const dx of [-.757,.757]){
      housing('gunmetal',x+dx,floor+1.62,z+.042,.143,2.48,.15);
      housing('edge',x+dx,floor+1.66,z-.024,.037,2.22,.035);
      for(const y of [.56,1.20,2.14,2.63])housing('rust',x+dx,floor+y,z+.037,.167,.11,.19);
    }
    const g=new T.CylinderGeometry(.784,.784,h-1.02,36,1,true,Math.PI*.48,Math.PI*1.49);
    const shell=new T.Mesh(g,clear);shell.position.set(x,floor+.40+(h-1.02)/2,z);shell.rotation.y=Math.PI*.42;room.add(shell);
    box('iron',x-.33,x+.33,floor+.41,floor+.50,z-.90,z-.82);
    for(let j=0;j<3;j++)box(i===2?(j===0?'red':'gasket'):j<=i?'cold':'gasket',x-.25+j*.102,x-.196+j*.102,floor+.433,floor+.461,z-.911,z-.897);
    for(const dx of [-.43,.43]){
      housing('iron',x+dx,floor+.182,z-.728,.31,.167,.129);
      grill('edge',x+dx,.178,z-.795,.246,.114,Math.PI);
    }
    housing('gunmetal',x,floor+.562,z-.808,.46,.223,.146);
    plaque('B–0'+(i+1),[i===2?'STROMLOS':'KAMMER LEER'],x,.572,z-.885,.337,.151,Math.PI,i===2?'red':'blue');
    housing('green',x+.70,floor+1.36,z-.433,.24,.64,.22,.54);
    dial(x+.72,1.53,z-.567,.084,Math.PI-.49,i);
    for(const [j,dx] of [-.051,.006,.06].entries())housing(i===2?(j?'iron':'red'):(j===i?'cold':'gasket'),x+.705+dx,floor+1.31,z-.56,.036,.051,.031);
    for(let j=0;j<10;j++){
      const a=(j+.5)*Math.PI/5,bx=x+Math.sin(a)*.865,bz=z+Math.cos(a)*.865;
      rod(j%4?'edge':'rust',[bx,floor+.303,bz],[bx,floor+.347,bz],.029);
    }
    for(const [j,dx] of [-.32,.32].entries()){
      rod(j?'green':'rust',[x+dx,ceiling-.31,z+.47],[x+dx,ceiling-.31,z+1.17],.074);
      rod('iron',[x+dx,ceiling-.31,z+1.17],[x+dx,ceiling-.11,z+1.17],.072);
      rod('edge',[x+dx,ceiling-.31,z+.77],[x+dx,ceiling-.31,z+.87],.099);
    }
    stain(x+.14,.008,z-.98,.69,.58,0,i===2?1:2,-Math.PI*.5);
    world.box(x-.915,z-.917,x+.915,z+.915,below);
  }
  // Control desk with paper dossier, mechanical dials and status lamps.
  const x=-12.45,z=-4.85;
  housing('green',x,floor+.49,z+.02,2.46,.826,1.078);
  housing('edge',x,floor+.958,z+.015,2.56,.125,1.19);
  housing('gunmetal',x,floor+1.33,z-.29,1.94,.62,.34);
  box('gasket',x-.72,x+.72,floor+1.105,floor+1.565,z-.119,z-.104);
  const screen=new T.Mesh(new T.PlaneGeometry(1.37,.428),new T.MeshBasicMaterial({map:terminalDisplay(T)}));
  screen.position.set(x,floor+1.337,z-.102);room.add(screen);
  for(let j=0;j<6;j++){
    object('brass',drum,x-.84+j*.337,floor+1.05,z+.385,[.055,.074,.055]);
    if(j<4)box(j===0?'red':'ivory',x-.77+j*.22,x-.69+j*.22,floor+.65,floor+.694,z+.558,z+.569);
  }
  for(const dx of [-.81,.81])dial(x+dx,1.33,z-.109,.093,0,dx>0?2:1);
  grill('iron',x+.60,.424,z+.57,.79,.295);
  housing('gunmetal',x-.67,floor+.487,z+.577,.71,.47,.055);
  const front=plane(x-.67,floor+.487,z+.608,0);
  for(const u of [-.28,.28])for(const v of [-.17,.17])fastener(front,u,v,0,.024,true);
  stain(x-.67,.49,z+.612,.45,.39,0,3);
  world.box(x-1.28,z-.58,x+1.28,z+.61,below);
  const blueprint=dressing(T,'board'),paper=dressing(T,'paper');
  const board=(tex,w,h,x,y,z,a,rx=0)=>{
    const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.92}));
    m.position.set(x,y,z);m.rotation.set(rx,a,0);room.add(m);
  };
  box('gray',end-.40,end-.24,floor+1.14,floor+2.89,-4.35,-1.17);
  box('gasket',end-.423,end-.398,floor+1.18,floor+2.84,-4.29,-1.24);
  board(blueprint,2.97,1.62,end-.428,floor+2.01,-2.76,-Math.PI*.5);
  // A second, readable paper copy lies flat on a side workbench.
  housing('green',-15.635,floor+.56,-5.835,2.33,.76,1.03);
  housing('edge',-15.64,floor+.973,-5.84,2.46,.132,1.12);
  housing('leather',-15.87,floor+1.051,-5.86,.97,.021,.63);
  board(paper,.91,.57,-15.87,floor+1.064,-5.86,0,-Math.PI*.5);
  housing('paper',-14.98,floor+1.06,-5.76,.37,.040,.47,-.10);
  plaque('FREMDAKTE F',['FRANKEN · NICHT ABLEGEN'],-14.98,1.083,-5.74,.34,.42,0,'red',-Math.PI*.5,false);
  for(const x of [-16.47,-15.66,-14.86]){
    housing('gunmetal',x,floor+.716,-5.297,.64,.285,.073);
    rod('brass',[x-.10,floor+.772,-5.24],[x+.10,floor+.772,-5.24],.018);
    for(const dx of [-.10,.10])rod('brass',[x+dx,floor+.772,-5.295],[x+dx,floor+.772,-5.24],.016);
  }
  world.box(-16.87,-6.40,-14.41,-5.28,below);
  // A light wash makes the flag and the scratched-out rival program visible
  // immediately when coming down the stairs; nothing protrudes into the route.
  flag('bavaria',-18.40,2.00,south+.063,2.44,1.24);
  plaque('PROJEKT BAYERN',['SEKTION B · UNTERDECK ERLANGEN','BAUREIHE B: 8 FREIGABEN / 9 MARKEN'],-15.81,2.057,south+.037,1.94,.68,0,'blue');
  flag('franconia',-13.83,2.035,south+.036,1.43,.75);
  plaque('VERGLEICHSREIHE',['B: TRACHTENAUSGABE GENEHMIGT','F: ERGEBNIS AUS DEM REGISTER ENTFERNT'],-11.975,2.015,south+.035,1.67,.61);
  plaque('01 · SCHLEUSE',['WEITER ZUM ARCHIV UND ZUR TECHNIK'],-8.02,2.73,north-.207,1.39,.34,Math.PI);
  stain(-17.13,1.21,south+.009,.65,1.77,0,0);
  stain(-10.47,1.81,south+.009,.59,2.63,0,1);
  stain(-18.51,.006,-6.00,.69,.94,0,2,-Math.PI*.5);

  // Trolley parked in the bay, not in the route between stairs and doors.
  const tx=-16.32,tz=-.05;
  for(const dx of [-.52,.52])for(const dz of [-.25,.25]){
    const x=tx+dx,z=tz+dz;
    rod('gasket',[x-.035,floor+.071,z],[x+.035,floor+.071,z],.071);
    housing('iron',x,floor+.134,z,.115,.085,.095);
    housing('edge',x,floor+.52,z,.046,.76,.045);
  }
  housing('gunmetal',tx,floor+.270,tz,1.18,.072,.615);
  housing('edge',tx,floor+.903,tz,1.21,.067,.644);
  housing('green',tx,floor+.944,tz,1.16,.041,.593);
  for(const dz of [-.302,.302])rod('iron',[tx-.58,floor+.978,tz+dz],[tx+.58,floor+.978,tz+dz],.022);
  rod('edge',[tx-.626,floor+1.05,tz-.223],[tx-.626,floor+1.05,tz+.223],.023);
  for(const dz of [-.223,.223])rod('edge',[tx-.626,floor+1.05,tz+dz],[tx-.54,floor+.91,tz+dz],.021);
  housing('leather',tx-.16,floor+.986,tz,.61,.031,.404);
  plaque('BELEG F–09',['TRACHTENMUSTER NICHT ÜBERNOMMEN','Fundort: Ablage B'],tx-.16,1.005,tz,.54,.33,Math.PI,'cream',-Math.PI*.5,false);
  housing('iron',tx+.34,floor+1.018,tz+.02,.284,.112,.262);
  for(const dz of [-.06,.063])housing('brass',tx+.35,floor+1.080,tz+dz,.08,.014,.068);
  housing('paper',tx+.23,floor+.334,tz-.032,.538,.065,.39,.075);
  housing('leather',tx-.28,floor+.345,tz+.046,.33,.092,.374,-.13);
  world.box(tx-.65,tz-.33,tx+.61,tz+.33,below);

  // Empty costume rack: hanger and clothes only, no mannequin body.
  const rx=-7.54,rz=.44;
  box('green',rx-.075,rx+.17,floor+.19,floor+2.73,rz-.99,rz+.99);
  for(const z of [rz-.96,rz+.96])box('gray',rx-.58,rx+.13,floor+.17,floor+2.75,z-.038,z+.039);
  box('iron',rx-.56,rx+.15,floor+2.66,floor+2.755,rz-1,rz+1);
  box('brass',rx-.42,rx-.38,floor+2.53,floor+2.576,rz-.89,rz+.89);
  function cutCloth(key,pts,offset,depth){
    const world=([z,y])=>[rx-.426-depth-.020*(Math.cos(z*43)-.45*Math.sin(y*13+z*11)),floor+y,rz+offset+z];
    const middle=pts.reduce(([x,y],[a,b])=>[x+a/pts.length,y+b/pts.length],[0,0]);
    for(let i=0;i<pts.length;i++){
      const a=world(pts[i]),b=world(pts[(i+1)%pts.length]),m=world(middle);
      k.triangle(key,a,b,m,[0,0,1,0,.5,1]);k.triangle(key,m,b,a,[.5,1,1,0,0,0]);
    }
  }
  for(const offset of [-.49,.48]){
    object('brass',ring,rx-.42,floor+2.40,rz+offset,[.095,.095,.095],0,Math.PI*.5);
    box('wood',rx-.452,rx-.402,floor+2.19,floor+2.248,rz+offset-.277,rz+offset+.277);
  }
  cutCloth('leather',[[-.28,2.22],[.28,2.22],[.31,1.87],[.32,1.54],[.23,1.50],[.11,1.51],[0,1.84],[-.12,1.53],[-.23,1.505],[-.32,1.53],[-.29,1.85]],-.49,0);
  cutCloth('brass',[[-.248,2.15],[-.04,2.148],[.248,2.15],[.223,2.08],[.01,2.075],[-.223,2.08]],-.49,.024);
  cutCloth('canvas',[[-.26,2.19],[-.12,2.16],[.12,2.16],[.26,2.19],[.28,2.05],[.24,1.96],[-.24,1.96],[-.28,2.05]],.48,0);
  cutCloth('cloth',[[-.22,2.16],[-.11,2.12],[.10,2.12],[.22,2.16],[.13,1.88],[.28,1.52],[.35,1.24],[.22,1.25],[.11,1.227],[0,1.247],[-.13,1.23],[-.24,1.25],[-.35,1.24],[-.26,1.53],[-.13,1.88]],.48,.031);
  cutCloth('apron',[[-.13,1.91],[.13,1.91],[.17,1.65],[.22,1.32],[.09,1.31],[0,1.34],[-.09,1.31],[-.22,1.32],[-.18,1.63]],.48,.069);
  for(const delta of [-.164,.164]){
    rod('canvas',[rx-.474,floor+2.03,rz-.49+delta],[rx-.481,floor+1.59,rz-.49+delta*1.32],.006);
    rod('brass',[rx-.492,floor+2.12,rz-.49+delta],[rx-.497,floor+2.12,rz-.49+delta+.042],.018);
  }
  for(const oz of [-.49,.48]){
    housing('iron',rx-.23,floor+.69,rz+oz,.19,.59,.74);
    grill('gray',rx-.329,.63,rz+oz,.62,.21,-Math.PI*.5);
  }
  plaque('TRACHTENAUSGABE',['EINHEIT B · UNGETRAGEN'],rx-.568,2.716,rz,1.11,.215,-Math.PI*.5,'cream');
  world.box(rx-.62,rz-1.04,rx+.19,rz+1.04,below);
  dress.flush();k.flush('Projekt Bayern · Beton, Technik und Kostüme');drum.dispose();ring.dispose();
}
