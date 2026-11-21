import {WEATHER_ZERO as W,suspicionNote,suspicionTick} from './berg-layout.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {warmRoom} from './warm-room.js';

export function addWeatherZero(T,scene,world,heightAt,audio){
  const g=new T.Group(),ground=heightAt(W.x,W.z);g.name='Wetterstation 0 · Amt für Restzweifel';
  g.position.set(W.x,ground,W.z);g.rotation.y=W.yaw;g.scale.x=.80;scene.add(g);
  const m=bergMaterials(T),k=carpentry(T,g,m);
  const {box,cyl,ring}=k;
  m.paint.color.setHex(0x58694e);m.iron.color.setHex(0x323932);
  const metal=new T.MeshStandardMaterial({color:0x777966,metalness:.63,roughness:.39});
  const radius=(w,h,d,r,material,x,y,z)=>{
    const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,r),material);
    mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;
  };
  // Anchored into the blank end pier, clear of the window casing and path.
  for(const x of [-.405,.405]){
    box('iron',x,1.326,-.402,.149,.717,.056);
    box('paint',x,1.326,-.249,.10,.55,.284);
    for(const y of [1.021,1.630])cyl('brass',x,y,-.364,.020,.024,Math.PI/2);
  }
  box('iron',-.41,.84,-.413,.032,.405,.046);
  radius(1.258,.694,.274,.030,m.paint,0,1.335,.003);
  radius(1.192,.625,.029,.017,m.dark,0,1.327,.141);
  radius(1.172,.604,.036,.014,m.paint,0,1.325,.163);
  radius(1.320,.075,.375,.018,m.iron,0,1.697,.021);
  radius(1.252,.023,.308,.009,metal,0,1.726,.019);
  radius(.533,.076,.048,.014,m.iron,0,1.093,.188);
  box('brass',0,1.062,.211,.450,.011,.025);
  box('dark',0,1.096,.220,.418,.025,.017);
  for(const x of [-.550,.550])for(const y of [1.077,1.588]){
    cyl('iron',x,y,.188,.021,.014,Math.PI/2);
    cyl('brass',x,y,.198,.014,.013,Math.PI/2);
    box('dark',x,y,.205,.021,.003,.003);
  }
  for(const y of [1.184,1.503]){
    radius(.068,.089,.057,.011,metal,-.604,y,.146);
    cyl('iron',-.628,y,.147,.019,.118);
  }
  cyl('brass',.527,1.105,.193,.024,.019,Math.PI/2);
  box('dark',.527,1.102,.203,.006,.018,.002);
  for(let i=0;i<6;i++){
    radius(.022,.055,.012,.005,m.dark,.297+i*.029,1.106,.184);
    box('iron',.295+i*.029,1.082,.191,.023,.006,.004);
  }
  storyCard(T,g,{title:'WETTERSTATION 0',sub:'AMT FÜR RESTZWEIFEL',width:.91,height:.159,x:0,y:1.812,z:.042,small:true});
  box('iron',0,1.809,0,.93,.179,.073);
  for(const x of [-.363,0,.363]){
    cyl('dark',x,1.374,.192,.144,.040,Math.PI/2);
    ring('brass',x,1.374,.224,.136,.136,.30);
    ring('iron',x,1.374,.239,.127,.127,.17);
  }
  k.flush('Gehäuse · emailliertes Blech und Messblenden');
  world.box(W.x-.28,W.z-.53,W.x+.196,W.z+.53,p=>Math.abs(p.y-ground)<1.56);

  function gauge(x,label,min,max,needleColor){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const c=canvas.getContext('2d'),wash=c.createRadialGradient(119,83,14,132,122,155);
    wash.addColorStop(0,'#f1e4b7');wash.addColorStop(.7,'#d3c29a');wash.addColorStop(1,'#8c7953');
    c.fillStyle=wash;c.fillRect(0,0,256,256);
    for(let i=0;i<440;i++){c.fillStyle=i%2?'#a3874d22':'#f5e6be61';c.fillRect(i*172.6%256,i*79.13%256,1+i%5,1+i%2);}
    c.strokeStyle='#3e392b';c.lineWidth=3;
    const polar=(a,r)=>[128+Math.sin(a)*r,128-Math.cos(a)*r];
    for(let i=0;i<=32;i++){
      const a=-2.22+i*4.44/32;c.strokeStyle=label==='VERDACHT'&&i>24?'#963623':'#423827';c.lineWidth=i%4?2:3.7;
      c.beginPath();c.moveTo(...polar(a,i%4?101:87));c.lineTo(...polar(a,111));c.stroke();
    }
    c.beginPath();c.arc(128,128,114,0,Math.PI*2);c.strokeStyle='#796d52';c.lineWidth=1.5;c.stroke();
    c.textAlign='center';c.fillStyle='#58462d';c.font='bold 13px Georgia';c.fillText('MESSWERK  /  ER',128,66);
    c.textAlign='center';c.fillStyle='#392d22';c.font='bold 24px Georgia';c.fillText(label,128,177,185);
    c.font='bold 22px Georgia';c.fillText(min,84,211,58);c.fillText(max,170,211,58);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const disc=new T.Mesh(new T.CircleGeometry(.128,44),new T.MeshBasicMaterial({map,color:0xdad4bd}));
    disc.position.set(x,1.374,.221);g.add(disc);
    const pivot=new T.Group();pivot.position.set(x,1.374,.229);g.add(pivot);
    const shape=new T.Shape();shape.moveTo(-.006,-.018);shape.lineTo(.006,-.018);shape.lineTo(.004,.050);shape.lineTo(0,.095);shape.lineTo(-.004,.050);shape.closePath();
    const needle=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:needleColor}));
    pivot.add(needle);
    const cap=new T.Mesh(new T.SphereGeometry(.013,12,7),m.brass);cap.position.copy(pivot.position);g.add(cap);
    return v=>{pivot.rotation.z=2.16-v*4.32;};
  }
  gauge(-.363,'TEMPERATUR','0°','30°',0x381e14)(.57);
  gauge(0,'LUFTDRUCK','980','1040',0x381e14)(.62);
  const needle=gauge(.363,'VERDACHT','NEIN','JA!',0x7e211c);
  const fiche=new T.Group();fiche.position.set(0,1.09,.226);g.add(fiche);
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
    return Math.abs(u)<.53&&v>1.0&&v<1.71;
  }
  return {async prepare(r,neighbors){
    const camera=new T.PerspectiveCamera(65,1,.08,100);
    camera.position.set(W.x+normal.x*5,ground+1.67,W.z+normal.z*5);
    camera.lookAt(W.x,ground+1.3,W.z);
    const lights=[];
    scene.traverseVisible(o=>{if(o.isLight&&o.layers.test(camera.layers))lights.push(o);});
    const wasVisible=fiche.visible;
    try{
      fiche.visible=true;
      await warmRoom(T,r,scene,camera,[g,...neighbors],{lights});
    }finally{fiche.visible=wasVisible;}
  },update(dt,p,look,surface){
    const old=value,prev=receipt;
    const far=(p.x-W.x)**2+(p.z-W.z)**2>6.5**2;
    if(!printed)value=suspicionTick(value,dt,surface&&facing(p,look));
    if(value>=1&&!printed){
      printed=true;fiche.visible=true;receipt=.001;audio.weatherCue(true);
    }else if(!printed&&Math.floor(old*15)<Math.floor(value*15))audio.weatherCue(false);
    if(printed&&receipt<1)receipt=Math.min(1,receipt+dt*1.92);
    if(printed&&read&&far){value=0;receipt=0;printed=read=false;fiche.visible=false;}
    if(old!==value)needle(value);
    if(prev!==receipt){fiche.scale.y=Math.max(.001,receipt);fiche.position.z=.227+receipt*.021;}
    return old!==value||prev!==receipt;
  },target(p,look){
    return printed&&receipt>.69&&facing(p,look,2.5)?{id:'station-0',action:'weather-note',label:read?'Messprotokoll erneut lesen':'Messprotokoll lesen'}:null;
  },read(){read=true;return suspicionNote;}};
}
