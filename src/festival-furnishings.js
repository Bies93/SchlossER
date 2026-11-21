import {carpentry} from './berg-props.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {weaponSwatch} from './weapon-finishes.js';

const tau=Math.PI*2;
const PI=Math.PI;
const pattern=(T,w,h,paint,linear=false)=>{
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  paint(canvas.getContext('2d'),w,h);
  const map=new T.CanvasTexture(canvas);map.colorSpace=linear?T.NoColorSpace:T.SRGBColorSpace;
  map.anisotropy=6;return map;
};
function type(c,label,x,y,font,color){c.fillStyle=color;c.font=font;c.fillText(label,x,y);}
function panel(T,group,map,x,y,z,w,h,ry=0,rx=0,glow=0){
  const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({
    map,roughness:.67,emissive:0xffffff,emissiveMap:glow?map:null,emissiveIntensity:glow
  }));
  p.position.set(x,y,z);p.rotation.set(rx,ry,0);p.userData.noSceneQuery=true;group.add(p);
  return p;
}

export function festivalFinishes(T,m){
  const finish=(color,s,roughness=.76,metalness=0)=>{
    const mat=new T.MeshStandardMaterial({...s,color,roughness,metalness});
    if(mat.normalMap)mat.normalScale.setScalar(.67);
    return mat;
  };
  const textile=sharedSet(T,'canvas',512),wood=sharedSet(T,'fineOak',512),paint=sharedSet(T,'enamel',256);
  const steel=weaponSwatch(T,'machine'),grain=weaponSwatch(T,'rubber');
  m.plank=finish(0xcb9c68,wood,.625);m.plankAlt=finish(0xb88956,wood,.71);
  m.endgrain=finish(0x966944,wood,.82);m.vinyl=finish(0xe0c1a3,textile,.84);
  m.benchSteel=finish(0x5b8059,paint,.70,.27);m.paintBlue=finish(0x4c7495,paint,.53,.36);
  m.case=finish(0x545964,grain,.91,.10);m.inset=finish(0x2e3441,grain,.86);
  m.pad=finish(0x606a70,grain,.95);m.bright=finish(0xcec6b5,steel,.43,.53);
  m.brushed=finish(0x949c9e,steel,.53,.44);m.cable=finish(0x383432,grain,.88);
  m.warm=new T.MeshStandardMaterial({color:0xffd8ac,emissive:0xff9c55,emissiveIntensity:.68,roughness:.8});
  m.cool=new T.MeshStandardMaterial({color:0xa5d6ce,emissive:0x54dcca,emissiveIntensity:.51,roughness:.73});
  m.clothOne=finish(0xe6e2ce,textile,.94);m.clothTwo=finish(0xe67d69,textile,.93);
  m.crate=finish(0xad5438,paint,.83);m.crateBlue=finish(0x387389,paint,.8);
  m.glassAmber=new T.MeshPhysicalMaterial({color:0xab6428,transparent:true,opacity:.73,roughness:.27,depthWrite:false,clearcoat:.45,side:T.DoubleSide});
  m.glassGreen=m.glassAmber.clone();m.glassGreen.color.setHex(0x456c54);m.glassGreen.opacity=.79;
  m.drip=finish(0x423b32,grain,.82);
}

export function festivalFurniture(T,root,k,localY,wall,pad){
  const B=k.box,R=k.round,bolt=(x,y,z)=>k.cyl('brushed',x,y,z,.013,.007),
    rod=(mat,a,b,r=.025)=>k.tube(mat,[a,b],r,1,8);
  const coaster=pattern(T,256,256,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.beginPath();c.arc(128,128,126,0,tau);c.fillStyle='#e8d4aa';c.fill();c.clip();
    c.strokeStyle='#a65042';c.lineWidth=7;c.beginPath();c.arc(128,128,110,0,tau);c.stroke();
    c.lineWidth=4;c.beginPath();c.arc(128,128,94,0,tau);c.stroke();
    c.textAlign='center';
    type(c,'ZWANNIS',128,103,'bold 35px Georgia','#6a4237');type(c,'DARTKELLER',128,135,'bold 21px monospace','#783c38');
    type(c,'NICHT WERFEN',128,176,'bold 16px monospace','#783c38');
  });
  const coasterMat=new T.MeshStandardMaterial({map:coaster,roughness:.92,alphaTest:.52});
  const coasterGeometry=new T.PlaneGeometry(.134,.134);
  function board(x,y,z,w,h,d,inset=false){
    R(inset?'plankAlt':'plank',x,y,z,w,h,d,.011);
    for(const sign of [-1,1]){
      B('endgrain',x+sign*(w/2-.018),y-.004,z,.023,h*.70,d-.020);
      for(const dz of [-.31,.31])bolt(x+sign*(w*.36),y+h*.5+.002,z+dz*d);
    }
  }
  function trestle(x,y,z,top,d){
    for(const side of [-1,1]){
      const z0=z+side*d*.42,z1=z+side*d*.18;
      rod('benchSteel',[x,y+.045,z0],[x,y+top,z1],.024);
      R('pad',x,y+.029,z0,.106,.051,.105,.010);
      k.cyl('brushed',x,y+top-.051,z1,.018,.010,PI/2);
    }
    rod('benchSteel',[x,y+top*.47,z-d*.28],[x,y+top*.47,z+d*.28],.017);
    R('benchSteel',x,y+top-.031,z,.104,.059,d*.83,.007);
  }
  function glass(x,y,z,n,handle=false){
    const r=handle?.056:.042,h=handle?.147:.112;
    k.profile('glass',x,y,z,[[.023,0],[r*.82,0],[r*.90,.020],[r,h-.006],[r*.99,h],
      [r*.86,h],[r*.80,.019],[.022,.014]],{segments:22});
    k.cyl(n===2?'beer':'wine',x,y+h*.29,z,r*.76,h*.47);
    if(n!==2)k.oval('foam',x,y+h*.53,z,r*.75,.008,r*.75);
    if(handle){
      const X=x+r*.88;
      k.tube('glass',[[X,y+h*.78,z],[X+.044,y+h*.72,z],[X+.055,y+h*.44,z],[X+.031,y+h*.25,z],[X,y+h*.24,z]],.012,12,7);
    }
  }
  for(const [x,z] of [[-1.82,1.22],[-1.82,2.67],[1.82,1.22],[1.82,2.67],[-3.65,4.07],[3.27,4.07]]){
    const y=localY(x,z);
    for(const [n,d] of [-.084,.084].entries())board(x,y+.427,z+d,2.32,.061,.158,n===1);
    for(const X of [x-.86,x+.86])trestle(X,y,z,.408,.34);
    rod('benchSteel',[x-.91,y+.34,z],[x+.91,y+.34,z],.020);
    wall(x,z,2.34,.35);
  }
  for(const [i,x] of [-1.82,1.82].entries()){
    const z=1.94,y=localY(x,z);
    for(let n=-1;n<=1;n++)board(x,.754+y,z+n*.214,2.44,.066,.207,(n+i)%2===0);
    for(const X of [x-.91,x+.91]){
      trestle(X,y,z,.734,.70);
      rod('brushed',[X,y+.245,z],[X+(X<x?.37:-.37),y+.708,z],.015);
    }
    // Narrow checked cloth with real folded ends, not a table-sized sheet.
    for(let j=0;j<9;j++)for(let l=0;l<4;l++){
      B((j+l)%2?'clothTwo':'clothOne',x-.115+l*.073,y+.791,z-.272+j*.067,.072,.003,.066);
    }
    for(const side of [-1,1])for(let s=0;s<4;s++){
      B(s%2?'clothTwo':'clothOne',x-.115+s*.073,y+.759,z+side*.326,.072,.073,.006);
    }
    for(let j=0;j<3;j++){
      const X=x-.88+j*.77,Z=z+(j%2?.15:-.16);
      const disk=new T.Mesh(coasterGeometry,coasterMat);disk.rotation.set(-PI/2,0,.65*j+i);
      disk.position.set(X,y+.791,Z);disk.userData.noSceneQuery=true;root.add(disk);
      glass(X,y+.794,Z,j,j===0);
    }
    k.profile('vinyl',x+.93,y+.789,z+.05,[[0,0],[.126,0],[.142,.018],[.134,.027],[.084,.009],[0,.009]],{segments:24});
    for(let n=0;n<7;n++)R(n%3?'edge':'linen',x+.929+.061*Math.cos(n*1.87),y+.82,z+.05+.067*Math.sin(n*1.87),.06,.026,.020,.008,0,n*.55,0);
    wall(x,z,2.46,.64);
  }
  const x=4.55,z=2.52,y=localY(x,z);
  k.cyl('benchSteel',x,y+.501,z,.044,.95);k.cyl('pad',x,y+.053,z,.247,.084);
  k.profile('plank',x,y+1.012,z,[[0,0],[.421,0],[.448,.019],[.448,.047],[.432,.059],[0,.059]]);
  R('edge',x-.085,y+1.078,z-.019,.258,.016,.290,.005);
  R('linen',x-.085,y+1.09,z-.019,.232,.007,.264,.003,0,-.09,0);
  for(let i=0;i<8;i++)B(i%3===0?'edge':'drip',x-.088,y+1.094,z-.106+.023*i,.173,.001,.002);
  rod('gold',[x-.206,y+1.107,z-.14],[x-.147,y+1.108,z+.048],.006);
  pad(x,z,.30);
  return {glass};
}

export function festivalBar(T,root,k,m,wall,localY,glass){
  const B=k.box,R=k.round;
  const x=-4.60,z=-.67,y=localY(x,z);
  R('endgrain',x,y+.477,z,1.57,.977,2.19,.030);
  R('plank',x,y+.997,z,1.83,.082,2.39,.026);
  R('plankAlt',x,y+.955,z,1.78,.045,2.32,.014);
  for(const u of [-.43,0,.43])B('endgrain',x+u,y+1.040,z,.003,.002,2.29);
  wall(x,z,1.68,2.22);
  for(const s of [-1,1]){
    // End caps and frame rails leave the slatted front visibly inset.
    R('endgrain',x+s*.793,y+.529,z,.081,.829,2.19,.018);
    for(let i=0;i<12;i++){
      const Z=z-1.005+i*.182;
      R(i%4===0?'plankAlt':'plank',x+s*.833,y+.49,Z,.047,.729,.164,.014);
      for(const v of [.160,.826])R('brushed',x+s*.860,y+v,Z,.007,.021,.021,.003);
    }
    for(const v of [.102,.899])R('endgrain',x+s*.861,y+v,z,.076,.057,2.20,.011);
  }
  for(const Z of [z-1.11,z+1.11]){
    for(let i=0;i<7;i++)R(i%2?'plankAlt':'plank',x-.68+i*.222,y+.49,Z,.199,.728,.044,.012);
    for(const Y of [y+.13,y+.858])R('endgrain',x,Y,Z,1.61,.071,.061,.012);
  }
  const brand=pattern(T,768,256,(c,w,h)=>{
    c.fillStyle='#813f32';c.fillRect(0,0,w,h);c.lineWidth=5;c.strokeStyle='#f3cd92';c.strokeRect(16,16,w-32,h-32);
    c.textAlign='center';type(c,'THEKE',384,107,'bold 83px Georgia','#fff0c5');
    type(c,'BIER VOR BYTE',384,181,'bold 46px monospace','#f3c584');
  });
  R('endgrain',x+.894,y+.57,z,.044,.405,1.17,.018);
  panel(T,root,brand,x+.920,y+.57,z,1.10,.367,PI/2,0,.11);
  // Two separate tap columns, badges, tray, spouts and drip grille.
  for(const [j,Z] of [z-.68,z-.38].entries()){
    k.cyl('brushed',x+.01,y+1.062,Z,.086,.029);
    k.profile('bright',x+.01,y+1.066,Z,[[.04,0],[.048,.009],[.035,.038],[.031,.319],[.043,.345],[.039,.355]]);
    k.tube('bright',[[x+.01,y+1.39,Z],[x+.089,y+1.389,Z],[x+.187,y+1.345,Z],
      [x+.225,y+1.293,Z]],.022,12,9);
    k.cyl('drip',x+.225,y+1.294,Z,.027,.029);
    R(j?'paintBlue':'plankAlt',x+.045,y+1.45,Z,.064,.149,.056,.015,0,0,-.13);
    B('gold',x+.081,y+1.454,Z,.006,.048,.045);
  }
  R('brushed',x+.229,y+1.049,z-.525,.32,.020,.643,.01);
  R('drip',x+.228,y+1.061,z-.525,.278,.007,.593,.006);
  for(let n=0;n<17;n++)B('brushed',x+.227,y+1.066,z-.799+n*.034,.258,.004,.004);
  for(let i=0;i<7;i++){
    const Z=z-.04+i*.136,X=x-.315+(i%3)*.104;
    const H=.184+(i%3)*.038;
    const points=[[0,0],[.035,0],[.042,.010],[.043,.113],[.034,.143],
      [.018,H-.041],[.018,H],[.020,H+.005],[.013,H+.010],[.011,H-.033]];
    k.profile(i%2?'glassGreen':'glassAmber',X,y+1.039,Z,points,{segments:20});
    R('linen',X+.042,y+1.114,Z,.006,.061,.059,.004);
    B(i%2?'paintBlue':'berry',X+.047,y+1.119,Z,.004,.024,.042);
    k.cyl(i%2?'gold':'brushed',X,y+1.052+H,Z,.022,.020);
  }
  for(const [i,Z] of [z+.14,z+.416,z+.765].entries())glass(x+.582,y+1.041,Z,i,i!==2);
  // A small stack of squeeze-rib crates is wedged below the bar's outside corner.
  for(let i=0;i<2;i++){
    const X=x-.21,Z=z+1.49,Y=y+.15+i*.276,M=i?'crateBlue':'crate';
    R(M,X,Y-.118,Z,.605,.048,.410,.010);
    for(const u of [-.28,.28])for(const v of [-.18,.18])B(M,X+u,Y,Z+v,.047,.250,.050);
    for(const sign of [-1,1]){
      R(M,X,Y+.112,Z+sign*.195,.61,.046,.035,.009);
      B(M,X+sign*.288,Y+.084,Z,.037,.10,.40);
      for(let j=0;j<6;j++)B(M,X-.24+j*.096,Y-.012,Z+sign*.195,.028,.201,.029);
    }
  }
  wall(x-.21,z+1.49,.63,.45);
  return {wipeY:y+1.044,wipeX:x-.34,wipeZ:z+.65};
}

function clubScreen(T,on){
  return pattern(T,1024,576,(c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#232743');g.addColorStop(1,'#143d43');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='#383b61';c.fillRect(0,0,w,66);
    c.fillStyle='#4d94a0';c.fillRect(0,66,224,h-66);
    type(c,'ZWANNI PLAYER 0.98',30,45,'bold 29px monospace','#ffebbb');
    type(c,'LAN 01 · UEHLFELD',743,44,'bold 24px monospace','#f0d89c');
    for(const [i,word] of ['PLAYLIST','LOKAL','DARTSERVER','OPTIONEN'].entries())
      type(c,word,21,132+i*57,'bold 24px monospace',i===0?'#fff1c6':'#ceeaec');
    type(c,'DORFWIESE // VOL. 01',267,126,'bold 35px system-ui','#fff6d7');
    c.fillStyle='#101c2c';c.fillRect(260,161,728,131);
    for(let i=0;i<81;i++){
      const n=(Math.cos(i*.33)+Math.cos(i*.93))*Math.cos(i*1.729);
      const H=8+(Math.abs(n)*36);
      c.fillStyle=on?(i<43?'#f6c581':'#41aaae'):'#496073';
      c.fillRect(270+i*8.7,228-H/2,4.8,H);
    }
    type(c,'01   Parkpolka',269,343,'bold 35px system-ui','#ffe5ae');
    type(c,'LOOP AN · KEIN INTERNET ERFORDERLICH',269,389,'bold 20px monospace','#aec9cc');
    c.fillStyle=on?'#b6d9a9':'#fac28d';c.fillRect(269,434,283,69);
    type(c,on?'Ⅱ  LÄUFT':'▶  PAUSIERT',286,481,'bold 31px monospace','#203a37');
    type(c,'DART-SPINNER UEHLFELD',665,476,'bold 21px monospace','#bfd1ce');
    c.fillStyle='#101b2a';c.fillRect(0,542,w,34);
    type(c,'AUDIO.OUT  /  OUTPUT: PAVILLON',23,565,'bold 17px monospace','#d2e5dc');
  });
}

export function festivalConsole(T,root,k,m,wall,localY){
  const B=k.box,R=k.round;
  const z=-2.92,y=localY(0,z);
  const f=(x,Y,Z,w,h,d,mat='brushed')=>R(mat,x,y+Y,Z,w,h,d,.008);
  function flight(x,Z,w,h,d,tall=false){
    const t=localY(x,Z);
    R('case',x,t+h*.5,Z,w,h,d,.024);
    for(const side of [-1,1])for(const p of [-1,1]){
      const X=x+side*(w/2-.014),L=Z+p*(d/2-.013);
      R('bright',X,t+h*.50,L,.037,h-.039,.035,.010);
      k.oval('brushed',X,t+.035,L,.038,.033,.039);
      k.oval('brushed',X,t+h-.038,L,.038,.033,.039);
      for(const Y of [t+h*.12,t+h*.85])k.cyl('bright',X,Y,L+p*.017,.010,.008,PI/2);
    }
    for(const side of [-1,1]){
      for(const Y of [t+.077,t+h-.062])R('brushed',x,Y,Z+side*d*.5,w-.044,.033,.024,.009);
      R('brushed',x,t+h*.57,Z+side*(d/2+.010),.204,.105,.024,.016);
      R('inset',x,t+h*.57,Z+side*(d/2+.024),.163,.070,.006,.010);
      R('pad',x,t+h*.573,Z+side*(d/2+.030),.113,.016,.012,.004);
      for(const u of [-.30,.30])if(tall){
        const X=x+w*u;
        R('bright',X,t+h*.81,Z+side*(d/2+.012),.054,.10,.027,.009);
        B('drip',X,t+h*.818,Z+side*(d/2+.028),.030,.041,.004);
      }
    }
    return t;
  }
  const rack=flight(0,z,1.63,.903,.66,true);
  R('plankAlt',0,rack+.922,z,1.73,.060,.71,.020);
  wall(0,z,1.70,.68);
  const sticker=pattern(T,768,256,(c,w,h)=>{
    c.fillStyle='#d6aa6f';c.fillRect(0,0,w,h);c.strokeStyle='#993f37';c.lineWidth=5;c.strokeRect(14,14,w-28,h-28);
    type(c,'DART-SPINNER  //  TON',38,98,'bold 56px monospace','#532f2f');
    type(c,'NICHT AUSSCHALTEN, KALLE!',39,165,'bold 39px monospace','#834a40');
    type(c,'EQUIPMENT  ·  UEHLFELD 01',40,216,'bold 24px monospace','#633d38');
  });
  panel(T,root,sticker,-.37,rack+.395,z+.334,.623,.207,0,0,.075);
  panel(T,root,sticker,.36,rack+.417,z-.334,.427,.142,PI,0,.065);
  // Two jog wheels flank a bank of faders, the console is sloped toward Kalle.
  R('case',.385,y+.993,z-.012,.888,.084,.477,.025);
  R('inset',.385,y+1.038,z-.012,.826,.015,.431,.019);
  for(const X of [.119,.645]){
    k.cyl('drip',X,y+1.052,z+.008,.117,.023);
    k.cyl('brushed',X,y+1.075,z+.008,.107,.018);
    k.cyl('inset',X,y+1.087,z+.008,.088,.015);
    k.ring('brushed',X,y+1.092,z+.008,.092,.092,.093,PI/2);
    k.cyl('case',X,y+1.096,z+.008,.047,.007);
    k.cyl('cool',X,y+1.102,z+.008,.008,.005);
    for(let j=0;j<4;j++)f(X-.055+j*.038,1.057,z-.148,.027,.010,.033,j===0?'warm':j===2?'cool':'brushed');
  }
  for(let col=0;col<5;col++){
    const X=.281+col*.050;
    for(let j=0;j<2;j++){
      const Z=z+.085+j*.052;
      k.cyl('brushed',X,y+1.064,Z,.014,.038);
      B('linen',X,y+1.085,Z-.006,.004,.004,.013);
    }
    f(X,1.050,z-.030,.019,.006,.119,'drip');
    f(X,1.063,z-.068+(col%3)*.022,.027,.019,.026,'bright');
    for(let j=0;j<5;j++)f(X,1.053,z-.137-j*.011,.014,.005,.007,j<3?'cool':j===3?'warm':'scarlet');
  }
  // Laptop lid and keyboard have real bevels, hinge, keys, palm rest and trackpad.
  const lx=-.47,lz=z+.091,ly=y+1.008;
  R('case',lx,ly-.024,lz-.190,.527,.041,.439,.018);
  R('brushed',lx,ly-.002,lz-.191,.507,.010,.418,.011);
  R('pad',lx,ly+.004,lz-.157,.456,.009,.204,.009);
  for(let row=0;row<5;row++)for(let col=0;col<12;col++){
    if(row===4&&col>=3&&col<=8)continue;
    f(lx-.206+col*.037,ly-y+.014,lz-.069-row*.040,.031,.011,.031,'case');
  }
  f(lx,ly-y+.014,lz-.228,.198,.010,.031,'case');
  f(lx,ly-y+.005,lz-.324,.138,.004,.095,'case');
  for(const u of [-.157,.157])R('inset',lx+u,ly+.007,lz+.015,.100,.040,.044,.014);
  const lid=new T.Group();lid.position.set(lx,ly+.016,lz+.009);lid.rotation.x=.19;root.add(lid);
  const laptop=carpentry(T,lid,m);
  laptop.round('case',0,.158,0,.526,.326,.025,.018);
  laptop.round('inset',0,.158,-.016,.497,.296,.013,.011);
  laptop.round('pad',0,.303,-.023,.070,.014,.005,.004);
  laptop.box('cool',0,.304,-.027,.008,.006,.003);
  laptop.box('bright',-.223,.148,.016,.035,.148,.009);
  laptop.flush('Laptop · Ansichtsseite, Kamera und Klebestreifen');
  const online=clubScreen(T,true),offline=clubScreen(T,false);
  const screen=panel(T,lid,online,0,.152,-.024,.472,.258,PI,0,.55);
  const ctrl=panel(T,lid,sticker,0,.151,.017,.427,.143,0,0,.10);
  ctrl.name='Laptop · Vereinsaufkleber';
  // Back of the speakers has readable jack panels from the operator's seat.
  const meshPattern=pattern(T,256,256,(c,w,h)=>{
    c.fillStyle='#535b63';c.fillRect(0,0,w,h);
    c.globalCompositeOperation='destination-out';
    for(let row=0;row<36;row++)for(let col=0;col<36;col++){
      c.beginPath();c.arc(col*7.12+(row%2?3.56:0),row*7.12,2.58,0,tau);c.fill();
    }
  });
  const meshMat=new T.MeshStandardMaterial({map:meshPattern,alphaTest:.51,color:0xbcc3ce,roughness:.58,metalness:.29});
  for(const X of [-2.60,2.60]){
    const Z=-2.39,t=flight(X,Z,.757,.424,.525);
    R('case',X,t+.816,Z,.669,.796,.479,.040);
    R('pad',X,t+.828,Z+.249,.619,.729,.045,.020);
    R('inset',X,t+.830,Z+.275,.553,.662,.018,.026);
    for(const [Y,r] of [[t+.745,.223],[t+1.051,.095]]){
      k.cyl('drip',X,Y,Z+.290,r,.009,PI/2);
      k.ring('brushed',X,Y,Z+.300,r*.92,r*.92,.096);
      k.oval('pad',X,Y,Z+.303,r*.72,r*.72,.019);
      k.oval('inset',X,Y,Z+.321,r*.33,r*.33,.017);
    }
    const grille=new T.Mesh(new T.PlaneGeometry(.544,.660),meshMat);
    grille.position.set(X,t+.828,Z+.344);grille.userData.noSceneQuery=true;root.add(grille);
    R('bright',X,t+.531,Z+.352,.124,.032,.016,.007);
    R('brushed',X,t+.765,Z-.249,.341,.370,.017,.016);
    R('inset',X,t+.772,Z-.262,.309,.325,.010,.010);
    for(let i=0;i<5;i++)B('case',X,t+.735+.036*i,Z-.269,.254,.009,.005);
    for(const d of [-.072,.071])k.cyl('drip',X+d,t+.640,Z-.273,.022,.018,PI/2);
    k.cyl('cool',X-.085,t+.911,Z-.272,.010,.008,PI/2);
    for(const dx of [-.251,.251])for(const Y of [t+.506,t+1.157])k.cyl('bright',X+dx,Y,Z+.324,.012,.015,PI/2);
    k.tube('cable',[[X-.06,t+.641,Z-.281],[X-.064,t+.16,Z-.404],
      [X*.85,t+.030,Z-.50],[X*.64,t+.027,Z-.62],[X*.28,t+.052,z-.42],[X*.25,t+.41,z-.37]],.012,19,7);
    B('gold',X*.74,t+.025,Z-.53,.122,.007,.094);wall(X,Z,.77,.62);
  }
  // Open felt-lined display tray on a separate road case right of Kalle.
  const ax=1.77,az=-3.25,ay=flight(ax,az,1.54,.749,.51);
  R('endgrain',ax,ay+.754,az,1.57,.046,.51,.020);
  R('berry',ax,ay+.788,az,1.498,.033,.452,.018);
  // Continuous padded bottom; no lip on the player-facing edge to obstruct pickup.
  for(const side of [-1,1])R('plankAlt',ax+.755*side,ay+.814,az,.046,.063,.482,.013);
  R('plankAlt',ax,ay+.814,az-.225,1.53,.059,.043,.012);
  wall(ax,az,1.58,.523);
  const paper=pattern(T,512,192,(c,w,h)=>{
    c.fillStyle='#ecd9aa';c.fillRect(0,0,w,h);c.strokeStyle='#87583e';c.lineWidth=4;c.strokeRect(11,11,w-22,h-22);
    type(c,'FALKENRIED',25,76,'bold 56px Georgia','#3b3026');
    type(c,'ZWANNIS FUNDSTÜCK',27,132,'bold 30px monospace','#8a4835');
  });
  panel(T,root,paper,ax,ay+.545,az+.267,.420,.158,0,0,.12);
  return {lid,screen,ctrl,archiveLocal:[ax-.263,ay+.805,az+.006],
    prepare(r){r.initTexture(offline);},
    setPlaying(on){screen.material.map=screen.material.emissiveMap=on?online:offline;}};
}

export function festivalDecor(T,root,k,m,localY){
  const B=k.box,R=k.round;
  const rand=randomSource(88431), colors=['blue','whiteFabric','berry','whiteFabric','blue'];
  // A second strand crosses the first, dipped near the middle; tails and
  // staccato colour breaks keep it from looking like mass-spawned flags.
  const anchor=[[-5.77,2.88,-3.34],[-3.31,2.71,-2.36],[0,2.55,-1.13],[3.35,2.69,.96],[5.90,3.03,2.63]];
  const path=new T.CatmullRomCurve3(anchor.map(e=>new T.Vector3(...e)));
  k.tube('cable',anchor,.010,26,6);
  const vec=new T.Vector3(),p1=new T.Vector3(),p2=new T.Vector3();
  for(let i=0;i<16;i++){
    const u=(i+.18)/16;
    path.getPoint(u,vec);path.getPoint(u+.038,p1);
    p2.copy(vec).lerp(p1,.52);p2.y-=.24+rand()*.11;p2.z+=.09+rand()*.078;
    const A=vec.toArray(),D=p2.toArray(),G=p1.toArray();
    k.quad(colors[i%colors.length],A,G,D,D,.39);
    if(i%3===0)k.oval('warm',vec.x-.07,vec.y-.040,vec.z,.024,.039,.024);
  }
  // Pleated paper lanterns below the roof, with wire collars and ribbon knots.
  for(const [i,[x,z,base]] of [[-4.95,2.70,3.07],[-3.03,-.59,3.14],[1.58,2.94,3.68],[3.46,-.9,3.32],
    [4.99,2.52,2.99],[-2.15,-3.44,3.53],[2.95,-3.74,3.43]].entries()){
    const y=base-.54,h=.34+(i%3)*.07,r=.146+(i%3)*.024;
    const [mat,lit]=i%3===1?['whiteFabric','warm']:['blue','cool'];
    k.tube('cable',[[x,y+h,z],[x+.021,base+.24,z+.1]],.009,1,6);
    const profile=[];
    for(let j=0;j<=12;j++){
      const u=j/12,rr=Math.max(.04,Math.sin(Math.PI*u)**.64*r)*(j%2===0?.98:.88);
      profile.push([rr,u*h]);
    }
    k.profile(mat,x,y,z,profile,{segments:22});
    for(const u of [.0,.48,.99])k.cyl(u===.48?lit:'brushed',x,y+h*u,z,
      u===.48?r*.98:.061,.013);
    k.tube(mat,[[x,y-.012,z],[x+.033,y-.121,z-.023],[x+.049,y-.183,z-.035]],.012,8,5);
  }
  // Bar reveal: handwritten menu, pennants, rough wooden backing and eyelets.
  const menu=pattern(T,768,960,(c,w,h)=>{
    c.fillStyle='#243a32';c.fillRect(0,0,w,h);
    c.strokeStyle='#dbaf74';c.lineWidth=6;c.strokeRect(22,22,w-44,h-44);
    const f=randomSource(72291);
    for(let i=0;i<8500;i++){c.fillStyle=i%2?'#e8dcb917':'#0f221a19';c.fillRect(f()*w,f()*h,1+f()*4,1+f()*2);}
    c.textAlign='center';
    type(c,'ZWANNIS THEKE',384,133,'bold italic 72px Georgia','#ffe9bd');
    type(c,'HEUTE IM AUSSCHANK',384,200,'bold 30px monospace','#d5ab73');
    for(const [i,[drink,cost]] of [['KELLERBIER','3,50'],['RADLER','3,00'],['APFELSCHORLE','2,50'],['KRUGPFAND','2,00']].entries()){
      c.textAlign='left';type(c,drink,77,320+i*113,'bold 36px monospace','#ffe6bd');
      c.textAlign='right';type(c,cost,689,320+i*113,'bold 39px monospace','#d3edc9');
      c.strokeStyle='#738372';c.lineWidth=2;c.beginPath();c.moveTo(75,344+i*113);c.lineTo(694,344+i*113);c.stroke();
    }
    c.textAlign='center';type(c,'BARGELD · KEIN WLAN',384,862,'bold 32px monospace','#d1a36e');
  });
  const x=-5.34,z=-2.95,y=localY(x,z);
  const menuStand=new T.Group();menuStand.position.set(x,y,z);menuStand.rotation.y=.69;root.add(menuStand);
  const v=carpentry(T,menuStand,m);
  for(const X of [-.34,.34])v.round('plankAlt',X,.773,0,.063,1.56,.073,.012);
  v.tube('plankAlt',[[0,.84,-.022],[0,.048,-.40]],.032,1,8);
  v.round('endgrain',0,1.151,0,.820,1.012,.051,.020);
  v.round('plank',0,1.151,.030,.788,.980,.016,.010);
  v.flush('Ausschank · stehende Kreidetafel');
  panel(T,menuStand,menu,0,1.151,.042,.744,.930,0,0,.16);
  // Small cloth ribbons at the tent corners.
  for(const [X,Z] of [[-5.94,4.72],[5.94,4.72],[-5.94,-1.60],[5.94,-1.60]]){
    for(let j=0;j<3;j++){
      const Y=2.48-.093*j,mat=colors[(j+(X<0?3:0))%colors.length];
      R(mat,X,Y,Z,.136,.058,.135,.017);
      k.quad(mat,[X-.048,Y,Z+.070],[X+.047,Y,Z+.070],[X+.111,Y-.21,Z+.136],
        [X+.050,Y-.263,Z+.12],.36);
    }
  }
  // Rolled-up side weather sheet, attached to the frame with real webbing.
  k.tube('whiteFabric',[[-6.00,2.88,-4.34],[-6.036,2.878,-2.37],[-6.00,2.884,-.65]],.057,14,10);
  for(const Z of [-4.28,-3.29,-2.27,-1.28,-.74]){
    R('linen',-6.00,2.882,Z,.122,.123,.042,.024);
    B('brushed',-5.937,2.831,Z,.018,.031,.039);
  }
}
