import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {LAB,labCellAt,labLower,clubLevel} from './lab-layout.js';

// Room-owned actors. No navigation, combat, additional lights or downloads.
const roster={
  infirmary:{id:'labAuer',name:'Dr. Ernst Auer',job:'clinic',x:-23.78,z:50.87,yaw:Math.PI,
    line:'In der Akte steht „Behandlung“. So heißt es hier.'},
  registry:{id:'labHedwig',name:'Hedwig Kern',job:'registry',x:-11.93,z:60.20,yaw:0,
    line:'Herkunft? Für die neue Akte zählt nur der neue Name.'},
  southMess:{id:'labSepp',name:'Sepp Moser',job:'cook',x:33.61,z:-21.43,yaw:Math.PI*.5,
    line:'Fränkische Suppe. Auf dem Speiseplan steht jetzt bayerisch.'}
};
const limit=(x,b)=>Math.max(-b,Math.min(b,x));
export function labStaff(T,world){
  const actors=new Map(),cell=p=>labLower(p.y)&&!clubLevel(p.y)?labCellAt(p.x,p.z,.001,p.y):null;
  function register(room,root){
    const d=roster[room];if(!d||!humansAvailable(T))return;
    const npc=createHuman(T,d.id),{actor}=npc;
    actor.name=d.name;actor.rotation.y=d.yaw;
    actor.position.set(d.x,npc.groundedY(LAB.floor),d.z);root.add(actor);
    contactShadow(T,root,d.x,LAB.floor+.007,d.z,.68,.60);
    const t=d.id.length*.66;
    npc.deskWork(t,d.job);
    world.circle(d.x,d.z,.197,p=>labLower(p.y)&&!clubLevel(p.y));
    const target={id:d.id,action:'lab-talk',label:d.name+' ansprechen'};
    actors.set(room,{...d,npc,target,t,acc:0,gaze:0,chat:0});
  }
  function update(room,p,dt){
    const a=actors.get(room);if(!a||!dt)return false;
    if(Math.hypot(a.x-p.x,a.z-p.z)>8.5)return false;
    a.acc+=dt;if(a.acc<1/24)return false;
    const step=a.acc;a.acc=0;a.t+=step;
    a.chat=Math.max(0,a.chat-step);
    const angle=Math.atan2(p.x-a.x,p.z-a.z)-a.yaw;
    const direction=Math.atan2(Math.sin(angle),Math.cos(angle));
    a.gaze+=((a.chat>0?limit(direction,.92):0)-a.gaze)*(1-Math.exp(-step*6));
    a.npc.deskWork(a.t,a.job,a.gaze,a.chat>0?.10+.14*Math.abs(Math.sin(a.t*14)):0);
    return true;
  }
  function target(p,look){
    const a=actors.get(cell(p));if(!a)return null;
    const x=a.x-p.x,z=a.z-p.z,d=Math.hypot(x,z);
    return d<2.22&&d>.29&&x*look.x+z*look.z>.63*d?a.target:null;
  }
  function talk(p,look){
    if(!target(p,look))return null;
    const a=actors.get(cell(p));
    if(a.chat>0)return null;
    a.chat=3.45;return {name:a.name,line:a.line};
  }
  return {register,update,target,talk};
}
