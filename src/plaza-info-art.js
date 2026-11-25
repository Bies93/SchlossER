import {randomSource} from './surface-detail.js';

export const INFO_MOTTO='Nie wieder ist jetzt!';
export const PRIDE_TITLE='Alle willkommen';
export const CLIMATE_MOTTO='Klimagerechtigkeit!';
export const GREENS_LABEL='Grüne';
const tau=2*Math.PI;
const prideColors=['#c94a49','#da7c3d','#e2ba57','#55945b','#4a76a5','#80578e'];

function paint(T,w,h,draw){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
function peace(c,x,y,r,color,w=.10){
  c.strokeStyle=color;c.lineWidth=r*w;c.lineCap='round';
  c.beginPath();c.arc(x,y,r,0,tau);c.stroke();
  c.beginPath();c.moveTo(x,y-r);c.lineTo(x,y+r);c.moveTo(x-r*.71,y+r*.71);c.lineTo(x,y);c.lineTo(x+r*.71,y+r*.71);c.stroke();
}
function heart(c,x,y,r,color){
  c.fillStyle=color;c.beginPath();c.moveTo(x,y+r*.73);
  c.bezierCurveTo(x-r*.23,y+r*.47,x-r*1.08,y-r*.14,x-r*.91,y-r*.52);
  c.bezierCurveTo(x-r*.77,y-r*.85,x-r*.34,y-r*.98,x,y-r*.57);
  c.bezierCurveTo(x+r*.34,y-r*.98,x+r*.77,y-r*.85,x+r*.91,y-r*.52);
  c.bezierCurveTo(x+r*1.08,y-r*.14,x+r*.23,y+r*.47,x,y+r*.73);c.fill();
}
function flecks(c,w,h,seed,n){
  const rand=randomSource(seed);
  for(let i=0;i<n;i++){
    c.fillStyle=i%3?'#f9e5ab10':'#402c221b';c.fillRect(rand()*w,rand()*h,.7+rand()*3.8,.9+rand()*1.7);
  }
}
function rainbow(c,x,y,r,step){
  c.lineCap='butt';
  for(const [i,color] of prideColors.entries()){
    c.beginPath();c.arc(x,y,r-i*step,Math.PI,2*Math.PI);
    c.lineWidth=step+.35;c.strokeStyle=color;c.stroke();
  }
}
function pridePrint(T,sign){
  const map=paint(T,sign?384:256,sign?320:352,(c,w,h)=>{
    c.fillStyle='#f6e8ca';c.fillRect(0,0,w,h);c.strokeStyle='#66735a';c.lineWidth=2;c.strokeRect(13,13,w-26,h-26);
    rainbow(c,w*.5,sign?151:164,sign?90:73,sign?9.5:8);
    c.fillStyle='#273b31';c.textAlign='center';c.font='bold '+(sign?42:30)+'px Georgia';
    c.fillText('Alle',w*.5,sign?202:209);c.fillText('willkommen',w*.5,sign?245:242);
    c.font='bold '+(sign?15:17)+'px system-ui';c.fillStyle='#5d4a40';
    c.fillText(sign?'SCHLOSSPLATZ · INFOSTAND':'QUEER IN ERLANGEN',w*.5,sign?278:283);
    if(!sign){c.font='14px system-ui';c.fillText('Infos & Austausch',w*.5,306);c.fillText('Zum Mitnehmen',w*.5,327);}
    flecks(c,w,h,sign?87:714,365);
  });
  map.name=sign?'Regenbogen · '+PRIDE_TITLE:'Regenbogenflyer · Infos & Austausch';
  return map;
}

function sunflower(c,x,y,r){
  c.save();c.translate(x,y);
  for(let j=0;j<2;j++)for(let i=0;i<17;i++){
    const a=(i+j*.48)/17*tau;
    c.save();c.rotate(a);
    c.fillStyle=j?'#ffe051':i%2?'#ffd43b':'#efbb27';
    c.beginPath();c.ellipse(0,-r*(j?.66:.77),r*(j?.148:.126),r*(j?.357:.301),0,0,tau);c.fill();c.restore();
  }
  c.fillStyle='#675424';c.beginPath();c.arc(0,0,r*.455,0,tau);c.fill();
  for(let i=0;i<110;i++){
    const a=i*2.39996323,dist=Math.sqrt(i/110)*r*.419;
    c.fillStyle=i%3?'#d5a830':'#907038';c.beginPath();c.arc(Math.cos(a)*dist,Math.sin(a)*dist,r*.021,0,tau);c.fill();
  }
  c.restore();
}

function beachFlagArt(T){
  const green=paint(T,256,672,(c,w,h)=>{
    c.fillStyle='#128b43';c.fillRect(0,0,w,h);
    c.fillStyle='#087038';c.fillRect(0,0,10,h);
    c.fillStyle='#159c46';c.fillRect(w*.68,0,w*.32,h);
    c.fillStyle='#7ab536';c.fillRect(w*.963,0,w*.037,h);
    sunflower(c,w*.52,h*.306,76);
    c.fillStyle='#fff4d8';c.textAlign='center';c.font='bold 69px system-ui';
    c.fillText(GREENS_LABEL,w*.51,h*.554,w*.91);
    c.fillStyle='#e6cf4f';c.fillRect(w*.21,h*.583,w*.59,3);
    flecks(c,w,h,640,2100);
  });green.name='Beachflag · Sonnenblume und '+GREENS_LABEL;
  const pride=paint(T,256,672,(c,w,h)=>{
    for(const [i,col] of ['#d93646','#ed842d','#f1cc40','#268848','#315aae','#86448e'].entries()){
      c.fillStyle=col;c.fillRect(i*w/6,0,w/6+.6,h);
    }
    function chevron(color,edge,point,inset=0){
      c.fillStyle=color;c.beginPath();c.moveTo(inset,0);c.lineTo(w-inset,0);
      if(edge>0)c.lineTo(w-inset,edge);
      c.lineTo(w*.5,point);
      if(edge>0)c.lineTo(inset,edge);
      c.closePath();c.fill();
    }
    chevron('#231e22',148,272);
    chevron('#69442c',116,240);
    chevron('#60c3df',84,208);
    chevron('#ef9ac1',52,176);
    chevron('#fff3e3',21,145);
    chevron('#f8d839',0,112,17);
    c.strokeStyle='#8d3b93';c.lineWidth=6;c.beginPath();c.arc(w/2,43,24,0,tau);c.stroke();
    c.strokeStyle='#fffae280';c.lineWidth=1.25;c.strokeRect(3,3,w-6,h-6);
    flecks(c,w,h,620,2000);
  });pride.name='Hochformatflagge · Inklusive Pride-Fahne';
  const roof=paint(T,1024,320,(c,w,h)=>{
    c.textAlign='center';c.font='900 103px system-ui';c.lineJoin='round';
    c.lineWidth=5;c.strokeStyle='#204532';c.strokeText(CLIMATE_MOTTO,w/2,298,w*.65);
    c.fillStyle='#fcf1cf';c.fillText(CLIMATE_MOTTO,w/2,298,w*.65);
  });roof.name='Dachaufdruck · '+CLIMATE_MOTTO;
  return {green,pride,roof};
}
export function infoArt(T){
  const cloth=paint(T,1024,384,(c,w,h)=>{
    c.fillStyle='#ddd1b1';c.fillRect(0,0,w,h);
    c.strokeStyle='#8c714c';c.lineWidth=3;c.strokeRect(15,14,w-30,h-31);
    c.setLineDash([3,6]);c.strokeStyle='#f5e8c7';c.strokeRect(9,7,w-18,h-16);c.setLineDash([]);
    const phrases=['Nie wieder','ist jetzt!'];
    for(let i=0;i<phrases.length;i++){
      c.save();c.translate(512,i?288:156);c.rotate(i?.014:-.019);
      c.textAlign='center';c.font='italic 900 '+(i?160:146)+'px Georgia, serif';
      c.fillStyle=i?'#942f20':'#263d2c';c.fillText(phrases[i],0,0,815);c.restore();
    }
    c.strokeStyle='#a44b2e';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(227,319);
    c.quadraticCurveTo(496,334,797,308);c.stroke();
    peace(c,98,243,47,'#46614a',.145);heart(c,914,99,39,'#46614a');
    flecks(c,w,h,68,4400);
  });cloth.name=INFO_MOTTO;
  const seal=paint(T,128,128,(c,w,h)=>{
    c.fillStyle='#ba6d31';c.fillRect(0,0,w,h);c.fillStyle='#d7ae65';c.beginPath();c.arc(64,64,57,0,tau);c.fill();
    peace(c,64,64,46,'#354a35',.105);flecks(c,w,h,43,130);
  });seal.name='Friedenszeichen · Siebdruck';
  const flyer=paint(T,192,256,(c,w,h)=>{
    c.fillStyle='#e8d8af';c.fillRect(0,0,w,h);c.strokeStyle='#835d42';c.lineWidth=2;c.strokeRect(9,9,w-18,h-18);
    c.font='bold 32px Georgia';c.textAlign='center';c.fillStyle='#766040';c.fillText('INFO',96,47);
    peace(c,96,125,50,'#773d2e',.17);
    c.font='bold 15px monospace';c.fillStyle='#3c4c36';c.fillText('SCHLOSSPLATZ',96,201);c.fillText('ZUM MITNEHMEN',96,225);
    flecks(c,w,h,1968,620);
  });
  const balloon=paint(T,512,256,(c,w,h)=>{
    c.fillStyle='#fff8e5';c.fillRect(0,0,w,h);
    for(const x of [.25,.75])heart(c,w*x,h*.52,34,'#3c713c');
  });balloon.name='Ballons · grüne Herzen';
  const prideButton=paint(T,96,96,(c,w,h)=>{
    c.fillStyle='#ebd8ad';c.fillRect(0,0,w,h);rainbow(c,48,59,32,3.3);
    heart(c,48,69,6,'#a74848');
  });
  return {cloth,seal,flyer,balloon,prideFlyer:pridePrint(T,false),prideSign:pridePrint(T,true),prideButton,flags:beachFlagArt(T)};
}
