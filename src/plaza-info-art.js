import {randomSource} from './surface-detail.js';

export const INFO_MOTTO='Nie wieder ist jetzt!';
export const PRIDE_TITLE='Alle willkommen';
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
  return {cloth,seal,flyer,balloon,prideFlyer:pridePrint(T,false),prideSign:pridePrint(T,true),prideButton};
}
