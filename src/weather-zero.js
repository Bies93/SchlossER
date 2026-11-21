import {WEATHER_ZERO as W,suspicionNote,suspicionTick} from './berg-layout.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';

export function addWeatherZero(T,scene,world,heightAt,audio){
  const g=new T.Group(),ground=heightAt(W.x,W.z);g.name='Wetterstation 0 · Amt für Restzweifel';
  g.position.set(W.x,ground,W.z);g.rotation.y=W.yaw;scene.add(g);
  const m=bergMaterials(T),k=carpentry(T,g,m);
  const {box,cyl,ring}=k;
  box('rock',0,.075,0,.41,.15,.42);box('paint',0,.565,0,.125,1.02,.123);
  box('iron',0,.35,0,.15,.075,.14);box('iron',0,.88,0,.156,.078,.152);
  box('paint',0,1.335,0,1.23,.66,.25);box('iron',0,1.69,0,1.322,.068,.375);
  box('dark',0,1.33,.134,1.172,.598,.030);box('paint',0,1.327,.158,1.149,.578,.021);
  box('iron',0,1.09,.179,.50,.069,.048);box('dark',0,1.096,.205,.408,.020,.019);
  for(const x of [-.541,.541])for(const y of [1.085,1.58])cyl('brass',x,y,.181,.017,.022,Math.PI/2);
  storyCard(T,g,{title:'WETTERSTATION 0',sub:'AMT FÜR RESTZWEIFEL',width:.91,height:.159,x:0,y:1.812,z:.042,small:true});
  box('iron',0,1.809,0,.93,.179,.073);
  for(const x of [-.363,0,.363])ring('brass',x,1.374,.202,.135,.135,.29);
  k.flush('Gehäuse · emailliertes Blech und Messblenden');
  world.circle(W.x,W.z,.39,p=>Math.abs(p.y-ground)<1.4);

  function gauge(x,label,min,max,needleColor){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const c=canvas.getContext('2d');c.fillStyle='#ddceaa';c.fillRect(0,0,256,256);
    for(let i=0;i<440;i++){c.fillStyle=i%2?'#a3874d22':'#f5e6be61';c.fillRect(i*172.6%256,i*79.13%256,1+i%5,1+i%2);}
    c.strokeStyle='#3e392b';c.lineWidth=3;
    const polar=(a,r)=>[128+Math.sin(a)*r,128-Math.cos(a)*r];
    for(let i=0;i<=20;i++){
      const a=-2.22+i*.222;c.beginPath();c.moveTo(...polar(a,i%5?98:87));c.lineTo(...polar(a,111));c.stroke();
    }
    c.textAlign='center';c.fillStyle='#392d22';c.font='bold 24px Georgia';c.fillText(label,128,177,185);
    c.font='bold 22px Georgia';c.fillText(min,84,211,58);c.fillText(max,170,211,58);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const disc=new T.Mesh(new T.CircleGeometry(.128,44),new T.MeshBasicMaterial({map,color:0xdad4bd}));
    disc.position.set(x,1.374,.201);g.add(disc);
    const pivot=new T.Group();pivot.position.set(x,1.374,.208);g.add(pivot);
    const needle=new T.Mesh(new T.BoxGeometry(.008,.102,.005),new T.MeshBasicMaterial({color:needleColor}));
    needle.position.y=.035;pivot.add(needle);
    const cap=new T.Mesh(new T.SphereGeometry(.013,12,7),m.brass);cap.position.copy(pivot.position);g.add(cap);
    return v=>{pivot.rotation.z=2.16-v*4.32;};
  }
  gauge(-.363,'TEMPERATUR','0°','30°',0x381e14)(.57);
  gauge(0,'LUFTDRUCK','980','1040',0x381e14)(.62);
  const needle=gauge(.363,'VERDACHT','NEIN','JA!',0x7e211c);
  const fiche=new T.Group();fiche.position.set(0,1.09,.202);g.add(fiche);
  const slip=storyCard(T,fiche,{title:'MESSPROTOKOLL 0',sub:'Sie haben aber auch wirklich nichts zu tun.',width:.39,height:.215,
    x:0,y:-.102,z:0,small:true,paper:'#d5c395',ink:'#412a1c'});
  slip.rotation.x=-.17;fiche.visible=false;needle(0);
  const normal={x:Math.sin(W.yaw),z:Math.cos(W.yaw)};
  let value=0,printed=false,read=false,receipt=0;
  function facing(p,look,r=3.7){
    const x=p.x-W.x,z=p.z-W.z,front=x*normal.x+z*normal.z,
      along=look.x*normal.x+look.z*normal.z;
    if(front<.40||along>-.09||p.y<ground-.45||p.y>ground+1.56)return false;
    const reach=(.21-front)/along;
    if(reach>r)return false;
    const u=(x+reach*look.x)*normal.z-(z+reach*look.z)*normal.x,
      v=p.y+1.67+reach*look.y-ground;
    return Math.abs(u)<.65&&v>1.0&&v<1.71;
  }
  return {update(dt,p,look,surface){
    const old=value,prev=receipt;
    const far=(p.x-W.x)**2+(p.z-W.z)**2>6.5**2;
    if(!printed)value=suspicionTick(value,dt,surface&&facing(p,look));
    if(value>=1&&!printed){
      printed=true;fiche.visible=true;receipt=.001;audio.weatherCue(true);
    }else if(!printed&&Math.floor(old*15)<Math.floor(value*15))audio.weatherCue(false);
    if(printed&&receipt<1)receipt=Math.min(1,receipt+dt*1.92);
    if(printed&&read&&far){value=0;receipt=0;printed=read=false;fiche.visible=false;}
    if(old!==value)needle(value);
    if(prev!==receipt){fiche.scale.y=Math.max(.001,receipt);fiche.position.z=.204+receipt*.02;}
    return old!==value||prev!==receipt;
  },target(p,look){
    return printed&&receipt>.69&&facing(p,look,2.5)?{id:'station-0',action:'weather-note',label:read?'Messprotokoll erneut lesen':'Messprotokoll lesen'}:null;
  },read(){read=true;return suspicionNote;}};
}
