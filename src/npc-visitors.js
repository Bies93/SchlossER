import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {sharedSet} from './surface-detail.js';
import {HALL,WINGS} from './palace-openings.js';
import {p,wcLevel,wcZoneAt,X,Z} from './park-wc-layout.js';

const turn=Math.PI*.5,limit=(x,n)=>Math.max(-n,Math.min(n,x));
const wings=[
  {id:'guestMarlene',job:'books',x:-8.42,z:5.045,yaw:.015},
  {id:'guestBruno',job:'prayer',x:WINGS.outer-1.81,z:-.64,yaw:1.180,seat:.445,stool:'oak'}
];
const service={
  women:{id:'guestSabine',job:'wash',u:5.66,v:1.266,yaw:turn},
  collective:{id:'guestJona',job:'lounge',u:19.265,v:.12,yaw:Math.PI,seat:.501},
  greenhouse:{id:'guestRike',job:'greenhouse',u:29.235,v:3.60,yaw:.08},
  studio:{id:'guestEdda',job:'studio',u:17.18,v:-7.215,yaw:turn,seat:.466,stool:'studio'},
  deepLounge:{id:'guestLotte',job:'rest',u:.16,v:-3.51,yaw:-turn,seat:.660}
};

function install(T,root,world,d,floor,eligible){
  if(!humansAvailable(T))return null;
  const rig=createHuman(T,d.id),{actor,npcInfo}=rig;
  actor.position.set(d.x,rig.groundedY(floor),d.z);actor.rotation.y=d.yaw;root.add(actor);
  rig.shadow(false);
  const radius=d.seat?.205:.188;
  world.circle(d.x,d.z,radius,eligible);
  // For seated poses the feet, not the torso, set the contact patch.
  contactShadow(T,root,d.x+Math.sin(d.yaw)*(d.seat?.34:0),floor+.008,d.z+Math.cos(d.yaw)*(d.seat?.34:0),
    d.seat?.60:.72,.70);
  function add(holder,geometry,material,x,y,z,rx=0,ry=0,rz=0){
    const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);
    o.receiveShadow=true;holder.add(o);return o;
  }
  const standard=(color,roughness=.74,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  if(d.stool){
    const furniture=new T.Group();furniture.name=d.stool==='oak'?'Galerie · Gebetsschemel':'Studio · bezogener Hocker';
    furniture.position.set(d.x,floor,d.z);furniture.rotation.y=d.yaw;root.add(furniture);
    const wood=d.stool==='oak',frame=wood?standard(0x644436,.81,sharedSet(T,'fineOak',256)):
      standard(0x3a4845,.70,{metalness:.30}),fabric=standard(wood?0x5e292b:0x534f43,.96,sharedSet(T,'canvas',128));
    const edge=standard(wood?0x9b7350:0x555b51,.70),stud=standard(0x96764a,.53,{metalness:.44});
    add(furniture,new RoundedBoxGeometry(.477,.063,.420,2,.012),frame,0,d.seat-.084,.006);
    add(furniture,new RoundedBoxGeometry(.437,.085,.377,3,.033),fabric,0,d.seat-.042,.012);
    add(furniture,new RoundedBoxGeometry(.440,.010,.380,1,.004),edge,0,d.seat-.064,.012);
    const leg=new T.CylinderGeometry(.022,.031,d.seat-.112,11),cap=new T.CylinderGeometry(.029,.034,.024,10);
    for(const s of [-1,1])for(const z of [-1,1]){
      add(furniture,leg,frame,s*.176,(d.seat-.112)*.5,z*.151,z*.083,0,-s*.09);
      add(furniture,cap,edge,s*.192,.020,z*.160);
    }
    for(const z of [-.144,.144])add(furniture,new RoundedBoxGeometry(.365,.030,.032,1,.003),frame,0,.167,z);
    if(wood)for(const x of [-.156,0,.156])add(furniture,new T.SphereGeometry(.010,8,6),stud,x,d.seat-.055,.204);
  }
  if(d.id==='guestJona'){
    const fingers=rig.joint('index_02_r'),paper=standard(0xb9a88d,.94),filter=standard(0x82623c,.89),ember=standard(0x642e21,.92);
    // Fictional prop attached to the closed fingers, not a floating effect.
    add(fingers,new T.CylinderGeometry(.0042,.0046,.063,9),paper,.002,.000,.038,turn);
    add(fingers,new T.CylinderGeometry(.0044,.0044,.015,9),filter,.002,.000,.010,turn);
    add(fingers,new T.SphereGeometry(.0044,9,7),ember,.002,0,.071);
  }
  if(d.id==='guestEdda'){
    const head=rig.joint('head'),rubber=standard(0x272827,.89),housing=standard(0x514b3e,.71,{metalness:.19}),
      band=standard(0x807456,.54,{metalness:.42});
    add(head,new T.TorusGeometry(.098,.006,8,24,Math.PI),band,0,.075,-.015,.05);
    const oval=new T.SphereGeometry(1,14,9);
    for(const s of [-1,1]){
      add(head,oval,rubber,s*.091,.059,-.015).scale.set(.015,.034,.029);
      add(head,oval,housing,s*.102,.059,-.015).scale.set(.012,.029,.025);
    }
  }
  let water=null;
  if(d.id==='guestSabine'){
    const [x,y,z]=p(d.u,floor+.853,.753);
    water=add(root,new T.CylinderGeometry(.004,.007,.154,7),standard(0xa9ccc9,.22,
      {transparent:true,opacity:.43,depthWrite:false,metalness:.16}),x,y,z);
  }
  const phase={prayer:1.1,books:2.02,wash:2.7,lounge:1.4,studio:3.6,greenhouse:1.3,rest:4.4}[d.job];
  let elapsed=phase,acc=0,speech=0,glance=0;
  npcInfo.speak=(duration=3.45)=>{speech=duration;};
  rig.visitorPose(elapsed,d.job,d.seat);
  return (dt,player)=>{
    if(!dt||!eligible(player)||Math.hypot(player.x-d.x,player.z-d.z)>8.1)return false;
    acc+=dt;if(acc<1/24)return false;
    const t=acc;acc=0;
    elapsed+=t;speech=Math.max(0,speech-t);
    const off=Math.atan2(player.x-d.x,player.z-d.z)-d.yaw,angle=Math.atan2(Math.sin(off),Math.cos(off));
    const want=speech>0?limit(angle,.81):d.job==='rest'&&Math.abs(angle)<.86?limit(angle,.42):0;
    glance+=(want-glance)*(1-Math.exp(-t*5.8));
    rig.visitorPose(elapsed,d.job,d.seat,glance,Math.min(1,speech*4));
    if(water){water.scale.x=1+.14*Math.sin(elapsed*24);water.scale.z=water.scale.x;}
    return true;
  };
}

export function palaceVisitors(T,root,world,sign){
  const d=wings[sign<0?0:1];
  return install(T,root,world,d,HALL.floor,p=>p.y>-.25&&Math.sign(p.x)===sign&&Math.abs(p.z)<WINGS.z);
}
export function wcVisitor(T,root,world,room){
  const d=service[room];if(!d)return null;
  const floor=wcLevel(room),[x,,z]=p(d.u,floor,d.v);
  return install(T,root,world,{...d,x,z},floor,player=>wcZoneAt(player.z-Z,X-player.x,player.y)===room);
}
