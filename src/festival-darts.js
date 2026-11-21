import {randomSource,sharedSet} from './surface-detail.js';
import {weaponSwatch} from './weapon-finishes.js';

const TAU=Math.PI*2;
const numbers=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const segment=TAU/numbers.length;
const radius=.404, center=512;
const zones={bull:.038,outerBull:.085,tripleIn:.484,tripleOut:.546,doubleIn:.735,doubleOut:.794};
export const DART_FACE=Object.freeze({x:4.23,y:1.72,z:-4.421});
export const DART_HITS=Object.freeze([[.106,.132],[-.207,-.069],[.139,-.202]].map(Object.freeze));

// Hit coordinates are in the same local XY plane as the visible dartboard.
// On the printed face, the 20 is at twelve o'clock and numbers run clockwise.
export function scoreAt(x,y){
  const r=Math.hypot(x,y)/radius,z=zones;
  if(r<=z.bull)return 50;
  if(r<=z.outerBull)return 25;
  if(r>z.doubleOut)return 0;
  const theta=Math.atan2(x,y),sector=(Math.floor(theta/segment+.5)+20)%20;
  return numbers[sector]*(r>=z.doubleIn?2:r>=z.tripleIn&&r<=z.tripleOut?3:1);
}

function artwork(T,w,h,paint,anisotropy=6){
  const sheet=document.createElement('canvas');sheet.width=w;sheet.height=h;
  const context=sheet.getContext('2d');paint?.(context,w,h);
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=anisotropy;
  return {map,context};
}
function type(c,s,x,y,font,color,align='left'){
  c.font=font;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);
}
function speckle(c,w,h,seed,count,buff='#f1e6c929',dark='#080e233e'){
  const r=randomSource(seed);
  for(let i=0;i<count;i++){
    c.fillStyle=i%3===0?buff:dark;c.fillRect(r()*w,r()*h,r()*2.6+.4,r()*1.6+.4);
  }
}
function rim(c,x,y,r,stroke,width){
  c.beginPath();c.arc(x,y,r,0,TAU);c.lineWidth=width;c.strokeStyle=stroke;c.stroke();
}

function bristleFace(T){
  return artwork(T,1024,1024,(c,w,h)=>{
    const q=zones,mid=center,rad=510;
    c.fillStyle='#191d23';c.fillRect(0,0,w,h);
    const wedge=(a,b,i,o,color)=>{
      c.beginPath();c.arc(mid,mid,rad*o,a,b);
      if(i>0)c.arc(mid,mid,rad*i,b,a,true);else c.lineTo(mid,mid);
      c.closePath();c.fillStyle=color;c.fill();
    };
    for(const [i,n] of numbers.entries()){
      const a=i*segment-Math.PI/2,b=a-segment/2,d=a+segment/2;
      wedge(b,d,0,q.doubleOut,i%2?'#e9d4a1':'#333437');
      for(const [r,R] of [[q.tripleIn,q.tripleOut],[q.doubleIn,q.doubleOut]])
        wedge(b,d,r,R,i%2?'#438479':'#b74940');
      const x=mid+rad*.887*Math.cos(a),y=mid+rad*.886*Math.sin(a);
      c.textBaseline='middle';
      type(c,String(n),x,y,'bold 59px system-ui','#f8edce','center');
    }
    wedge(0,TAU,0,q.outerBull,'#438479');wedge(0,TAU,0,q.bull,'#bd4940');
    // Short bristle ends and scattered older dart punctures, not smooth wedges.
    c.save();c.beginPath();c.arc(mid,mid,rad*q.doubleOut,0,TAU);c.clip();
    speckle(c,w,h,451,42000,'#fff4cb30','#18141630');
    const rand=randomSource(583);
    for(let i=0;i<850;i++){
      const a=TAU*rand(),r=rand()**1.22*rad*.775;
      c.fillStyle=i%5===0?'#0c101342':'#24211b35';
      c.fillRect(mid+r*Math.cos(a),mid+r*Math.sin(a),.8+rand()*2.3,.9+rand()*2.7);
    }
    c.restore();
    for(let i=0;i<20;i++){
      const a=(i-.5)*segment-Math.PI/2;
      c.strokeStyle='#2a241e';c.lineWidth=5;c.beginPath();
      c.moveTo(mid+rad*q.outerBull*Math.cos(a),mid+rad*q.outerBull*Math.sin(a));
      c.lineTo(mid+rad*q.doubleOut*Math.cos(a),mid+rad*q.doubleOut*Math.sin(a));c.stroke();
    }
    for(const f of Object.values(zones))rim(c,mid,mid,rad*f,'#292821',4);
    rim(c,mid,mid,rad*.96,'#8a8173',1.2);
  },8).map;
}

function leaderboard(T){
  return artwork(T,768,920,(c,w,h)=>{
    c.fillStyle='#1e2c3d';c.fillRect(0,0,w,h);
    c.fillStyle='#304a73';c.fillRect(12,15,w-24,191);
    c.fillStyle='#d5b37c';c.fillRect(39,209,w-78,3);
    c.strokeStyle='#b0a48d';c.lineWidth=2.5;c.strokeRect(25,25,w-50,h-50);
    type(c,'UEDV  /  VEREINSABEND',48,74,'bold 31px monospace','#c8d5ee');
    type(c,'BESTENLISTE',47,160,'bold 82px system-ui','#fff0cc');
    type(c,'PL.   NAME',60,270,'bold 32px monospace','#9bacbf');
    type(c,'PKT.',705,270,'bold 32px monospace','#9bacbf','right');
    for(const [i,[name,score]] of [['Rudi','141'],['Anni','118'],['Kalle','102'],['Zwanni','026']].entries()){
      const y=292+i*119;
      c.fillStyle=i===3?'#613d48':i%2?'#2b4055':'#25384d';c.fillRect(42,y,685,96);
      c.fillStyle=i===3?'#e48969':i===0?'#d1b57b':'#849cae';c.fillRect(42,y,6,96);
      type(c,'0'+(i+1),65,y+61,'bold 42px monospace','#b1bfd0');
      type(c,name,179,y+62,'bold 59px system-ui','#f4ebd3');
      type(c,score,701,y+62,'bold 56px monospace',i===3?'#ffe0b6':'#e4eabd','right');
    }
    type(c,'Gestrichene Ausreden zählen nicht.',384,850,'italic 31px Georgia','#c9bdd1','center');
    speckle(c,w,h,7702,5400);
  }).map;
}

function recordPlaque(T){
  return artwork(T,1024,256,(c,w,h)=>{
    c.fillStyle='#eedbb2';c.fillRect(0,0,w,h);
    c.strokeStyle='#59537d';c.lineWidth=3;c.strokeRect(18,18,w-36,h-36);
    c.strokeStyle='#94684a';c.lineWidth=2;c.strokeRect(29,29,w-58,h-58);
    type(c,'UEDV  ·  VEREINSREKORD',512,83,'bold 32px monospace','#3f476d','center');
    type(c,'Meisten Niederlagen: Zwanni!',512,163,'bold 64px Georgia','#452f38','center');
    type(c,'Trotzdem jede Woche wieder da.',512,213,'italic 29px Georgia','#63516a','center');
    speckle(c,w,h,9001,4700,'#fff2c246','#61412e34');
  }).map;
}

function sign(T,root,map,x,y,z,w,h,{lean=0,glow=.17,tag='Dartstation · Beschriftung'}={}){
  const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({
    map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:glow,roughness:.86
  }));
  p.name=tag;p.position.set(x,y,z);p.rotation.x=lean;p.userData.noSceneQuery=true;root.add(p);return p;
}

export function festivalDarts(T,root,k,m,localY,wall){
  const {x,y,z}=DART_FACE,B=k.box,R=k.round;
  const bolt=(X,Y,Z,r=.013)=>k.cyl('bright',X,Y,Z,r,.008,Math.PI/2);
  const rail=(mat,a,b,r=.013)=>k.tube(mat,[a,b],r,1,7);
  m.dartCork=new T.MeshStandardMaterial({color:0xb28762,...sharedSet(T,'soilCrumb',256),roughness:.93});
  m.dartPad=new T.MeshStandardMaterial({color:0x5c6c80,...weaponSwatch(T,'rubber'),roughness:.89});
  m.dartWire=new T.MeshStandardMaterial({color:0xc8bfb0,metalness:.35,roughness:.48,emissive:0x958c7d,emissiveIntensity:.07});

  // Legs, skirting and braces belong to the same free-standing cabinet.
  const back=-4.749,bottom=.79,top=2.40;
  for(const side of [-1,1]){
    const X=x+side*.666,g=localY(X,back);
    R('case',X,(g+top)*.5,back,.112,top-g,.107,.013);
    R('pad',X,g+.017,back+.018,.187,.032,.229,.010);
    rail('brushed',[X,g+.194,back+.055],[X-.34*side,g+.65,back+.056],.022);
  }
  R('endgrain',x,(bottom+top)*.5,back,1.53,top-bottom,.23,.030);
  R('plankAlt',x,(bottom+top)*.5,-4.625,1.50,top-bottom-.025,.068,.023);
  R('dartPad',x,1.637,-4.586,1.362,1.443,.033,.018);
  for(const side of [-1,1]){
    R('endgrain',x+side*.689,1.61,-4.575,.077,1.53,.055,.013);
    for(const Y of [.905,2.277])bolt(x+side*.689,Y,-4.544,.016);
    R('brushed',x+side*.752,1.65,-4.617,.041,.197,.056,.006);
    for(const Y of [1.582,1.718])bolt(x+side*.752,Y,-4.586,.009);
  }
  for(const Y of [1.12,1.36,1.60,1.84,2.08]){
    for(const side of [-1,1]){
      const X=x+side*.569;
      B('inset',X,Y,-4.568,.171,.012,.004);
    }
  }
  // Layered catcher, cork board and steel spider; the numbers stay on a
  // crisp printed ring while the boundaries are separate physical wires.
  k.profile('dartPad',x,y,-4.574,[[0,0],[.485,0],[.507,-.018],[.513,-.046],[.501,-.080],[.446,-.103],[.398,-.096],[0,-.096]],
    {segments:84,rx:-Math.PI/2});
  k.profile('dartCork',x,y,z,[[0,0],[radius*.985,0],[radius*1.014,-.012],[radius*1.013,-.036],[radius,-.061],[0,-.061]],
    {segments:96,rx:Math.PI/2});
  const disc=new T.Mesh(new T.CircleGeometry(radius,96),new T.MeshStandardMaterial({map:bristleFace(T),roughness:.94}));
  disc.name='UEDV · Sisal und aufgedruckter Zahlenring';disc.position.set(x,y,z+.002);root.add(disc);
  const wireColor='dartWire',wireZ=z+.005;
  const boxRing=(r,h=.0016)=>{
    // Rotated torus axes: radial XY, flattened depth, in front of the disc.
    k.profile(wireColor,x,y,wireZ,[[r-h,-h],[r+h,-h],[r+h,h],[r-h,h],[r-h,-h]],{segments:100,rx:Math.PI/2});
  };
  for(const f of Object.values(zones))boxRing(radius*f);
  boxRing(radius*.983,.0025);
  for(let i=0;i<20;i++){
    const a=(i-.5)*segment,lo=zones.outerBull*radius,hi=zones.doubleOut*radius;
    rail(wireColor,[x+Math.sin(a)*lo,y+Math.cos(a)*lo,wireZ],
      [x+Math.sin(a)*hi,y+Math.cos(a)*hi,wireZ],.0016);
  }
  for(let i=0;i<8;i++)bolt(x+Math.sin(i*TAU/8)*.476,y+Math.cos(i*TAU/8)*.476,-4.476,.010);

  // A wipe-clean shelf, flight wallet, chalk and a printed record plaque.
  R('plank',x,.898,-4.526,1.54,.062,.419,.020);
  R('dartPad',x,.932,-4.519,1.43,.009,.325,.005);
  R('endgrain',x,.878,-4.310,1.52,.059,.027,.010);
  for(const side of [-1,1])rail('brushed',[x+side*.57,.837,-4.354],[x+side*.57,.599,-4.706],.019);
  const fly=x-.501;
  R('case',fly,.963,-4.496,.274,.051,.211,.014,0,.11,0);
  R('paintBlue',fly,.994,-4.500,.273,.021,.209,.007,0,.11,0);
  R('brushed',fly,.967,-4.382,.076,.027,.014,.005);
  for(let i=0;i<3;i++){
    const X=x+.427+i*.049;
    rail(i===1?'blue':'linen',[X,.946,-4.49],[X-.018,.949,-4.418],.008);
  }
  R('vinyl',x+.062,.950,-4.491,.222,.024,.150,.006,0,-.17,0);
  for(let i=0;i<6;i++)B('endgrain',x+.059,.963,-4.535+.018*i,.161,.002,.002);
  wall(x,-4.589,1.54,.55);

  R('endgrain',x,2.635,-4.691,1.67,.379,.075,.023);
  for(const X of [x-.782,x+.782])for(const Y of [2.49,2.78])bolt(X,Y,-4.646,.010);
  sign(T,root,recordPlaque(T),x,2.635,-4.651,1.505,.354,{glow:.18,tag:'UEDV · Meisten Niederlagen: Zwanni!'});
  for(const X of [x-.644,x+.644])rail('brushed',[X,2.397,-4.744],[X,2.826,-4.745],.018);

  const rankX=5.52,rankZ=-4.610;
  for(const X of [rankX-.316,rankX+.316]){
    const g=localY(X,rankZ);
    R('case',X,g*.5+1.11,rankZ-.089,.081,2.22-g,.092,.010);
    R('pad',X,g+.023,rankZ-.068,.146,.045,.192,.011);
  }
  R('endgrain',rankX,1.722,rankZ,.913,1.180,.112,.026);
  R('plankAlt',rankX,1.722,rankZ+.045,.865,1.132,.049,.018);
  R('case',rankX,1.722,rankZ+.065,.776,1.009,.021,.012);
  sign(T,root,leaderboard(T),rankX,1.722,rankZ+.077,.752,.982,{glow:.22,tag:'UEDV · Bestenliste'});
  for(const X of [rankX-.405,rankX+.405])for(const Y of [1.195,2.25])bolt(X,Y,rankZ+.075,.010);
  R('plank',rankX,1.133,rankZ+.103,.85,.036,.138,.012);
  R('vinyl',rankX-.23,1.166,rankZ+.126,.117,.029,.049,.006);
  for(const i of [0,1])rail(i?'blue':'linen',[rankX+.107+i*.064,1.164,rankZ+.154],
    [rankX+.164+i*.068,1.164,rankZ+.144],.008);
  wall(rankX,rankZ,.91,.21);
  // Rudi's consolation trophy on the already existing standing table.
  const tx=4.31,tz=2.34,ty=localY(4.55,2.52)+1.070;
  R('endgrain',tx,ty+.042,tz,.159,.082,.126,.015);
  k.profile('brass',tx,ty+.082,tz,[[0,0],[.047,0],[.050,.011],[.034,.029],[.020,.038],
    [.016,.089],[.029,.099],[.053,.121],[.073,.179],[.080,.208],[.073,.211],
    [.062,.186],[.040,.142],[.019,.124],[0,.123]],{segments:24});
  for(const d of [-1,1])k.tube('brass',[[tx+d*.069,ty+.254,tz],[tx+d*.123,ty+.250,tz],
    [tx+d*.116,ty+.202,tz],[tx+d*.048,ty+.183,tz]],.010,12,8);
  const plate=artwork(T,384,128,(c,w,h)=>{
    c.fillStyle='#cca86f';c.fillRect(0,0,w,h);c.strokeStyle='#714d3f';c.strokeRect(8,8,w-16,h-16);
    type(c,'TROSTPOKAL',192,55,'bold 38px Georgia','#492d27','center');
    type(c,'AM TAPFERSTEN DABEI',192,98,'bold 22px monospace','#492d27','center');
  }).map;
  sign(T,root,plate,tx,ty+.044,tz+.065,.134,.049,{glow:.10,tag:'UEDV · Trostpokal'});

  // Single local 512×160 texture; upload only when a dart lands or a round resets.
  const live=artwork(T,512,160,null,3);
  const on=sign(T,root,live.map,rankX,.903,rankZ+.091,.694,.217,{glow:.62,tag:'UEDV · laufende Wurfserie'});
  on.material.emissive.setHex(0xa8e4ff);
  R('case',rankX,.901,rankZ+.029,.760,.281,.120,.022);
  for(const X of [rankX-.346,rankX+.346])for(const Y of [.786,1.018])bolt(X,Y,rankZ+.090,.008);
  function display(marks=[]){
    const c=live.context;
    c.fillStyle='#142a36';c.fillRect(0,0,512,160);
    c.strokeStyle='#41687e';c.lineWidth=2;c.strokeRect(12,11,488,138);
    type(c,'ZWANNI   /   WURFSERIE',28,42,'bold 22px monospace','#b0d6e3');
    for(let i=0;i<3;i++){
      const X=29+i*78;
      c.fillStyle=i<marks.length?'#315974':'#213c51';c.fillRect(X,62,63,64);
      type(c,marks[i]??'–',X+32,109,'bold 37px monospace','#d7edf5','center');
    }
    type(c,'SUMME',471,78,'bold 19px monospace','#92bcc6','right');
    type(c,String(marks.reduce((a,b)=>a+b,0)).padStart(3,'0'),471,129,'bold 43px monospace','#f8d991','right');
    live.map.needsUpdate=true;
  }
  display();

  // Birch oche with anti-slip top, bright edge and actual joint caps on grass.
  const lineZ=-2.026,ground=localY(x,lineZ);
  R('plankAlt',x,ground+.018,lineZ,1.367,.058,.116,.015);
  R('dartPad',x,ground+.049,lineZ,1.265,.011,.087,.004);
  B('gold',x,ground+.043,lineZ+.057,1.31,.026,.008);
  for(const X of [x-.614,x+.614])k.cyl('brushed',X,ground+.058,lineZ,.012,.006);
  const paint=artwork(T,512,50,(c,w,h)=>{
    c.fillStyle='#324253';c.fillRect(0,0,w,h);
    type(c,'▶    U E D V    /    W U R F L I N I E    ◀',256,35,'bold 29px monospace','#f8dfae','center');
  }).map;
  sign(T,root,paint,x,ground+.055,lineZ,.965,.073,{lean:-Math.PI/2,glow:.28,tag:'UEDV · Wurflinie'});
  return {display};
}
