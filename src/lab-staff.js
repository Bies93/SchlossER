import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {LAB,labCellAt,labLower,clubLevel} from './lab-layout.js';
import {NPCS} from './npc-lines.js';
import {CELL_BAYS,CELL_COT,WARD_CHAIR,WARD_CHART} from './lab-ward-layout.js';

// All actors remain room-owned and reuse the common rig and pose budget.
const roster={
  cells:[{id:'labPrisoner',job:'prisoner',x:CELL_COT.x-.26,
    z:(CELL_BAYS[0][0]+CELL_BAYS[0][1])*.5+CELL_COT.offset-.194,yaw:Math.PI,seat:CELL_COT.deck+.004}],
  infirmary:[
    {id:'labAuer',job:'clinic',x:WARD_CHART.x-.049,z:50.74,yaw:Math.PI},
    {id:'labPatient',job:'patient',...WARD_CHAIR,x:WARD_CHAIR.x+.022},
    {id:'labOrderly',job:'registry',x:-20.29,z:52.05,yaw:0}
  ],
  registry:[{id:'labHedwig',job:'registry',x:-11.93,z:60.20,yaw:0}],
  southMess:[{id:'labSepp',job:'cook',x:33.61,z:-21.43,yaw:Math.PI*.5}]
};
const limit=(x,b)=>Math.max(-b,Math.min(b,x));
export function labStaff(T,world){
  const actors=new Map(),cell=p=>labLower(p.y)&&!clubLevel(p.y)?labCellAt(p.x,p.z,.001,p.y):null;
  function pencil(){
    const holder=new T.Group(),bar=new T.Mesh(new T.CylinderGeometry(.0043,.0043,.142,6),
      new T.MeshStandardMaterial({color:0x9a5229,roughness:.75}));
    bar.position.y=-.001;
    const tip=new T.Mesh(new T.CylinderGeometry(.0041,.0007,.017,6),new T.MeshStandardMaterial({color:0xb29a75,roughness:.78}));
    tip.position.y=-.0805;
    const cap=new T.Mesh(new T.CylinderGeometry(.0047,.0047,.009,8),new T.MeshStandardMaterial({color:0x888981,metalness:.55,roughness:.40}));
    cap.position.y=.074;holder.add(bar,tip,cap);return holder;
  }
  const chart={x:WARD_CHART.pageX,y:LAB.floor+WARD_CHART.pageY,z:WARD_CHART.pageZ};
  function place({id,...placement},root){
    const d={...NPCS[id],id,...placement};
    const npc=createHuman(T,d.id),{actor}=npc;
    actor.name=d.name;actor.rotation.y=d.yaw;
    actor.position.set(d.x,npc.groundedY(LAB.floor),d.z);root.add(actor);
    const isPatient=d.job==='patient';
    if(!d.seat)npc.npcInfo.shadow=contactShadow(T,root,d.x,LAB.floor+.007,d.z,.68,.60);
    const t=d.id.length*.66;
    const motion=d.job==='clinic'?npc.chartPose(pencil()):null;
    const a={...d,npc,motion,target:{id:d.id,action:'lab-talk',label:d.name+' ansprechen'},t,acc:0,gaze:0,chat:0,speechLength:0};
    a.speak=(duration=d.id==='labPrisoner'?5.48:isPatient?.63:3.4)=>{a.chat=a.speechLength=duration;};
    npc.npcInfo.speak=a.speak;
    pose(a);
    world.circle(d.x,d.z,.197,p=>npc.atStation()&&labLower(p.y)&&!clubLevel(p.y));
    return a;
  }
  function register(room,root){
    const list=roster[room];if(!list||!humansAvailable(T))return;
    actors.set(room,list.map(d=>place(d,root)));
  }
  function pose(a){
    const active=a.chat>0,voice=a.job==='patient'?(()=>{const t=a.speechLength-a.chat;
      if(!active)return 0;
      const phase=limit(t/Math.max(.01,a.speechLength),1);
      return .94*Math.sin(Math.PI*phase)**.62*(.92+.08*Math.sin(phase*18));
    })():active?.11+.16*Math.abs(Math.sin(a.t*14)):0;
    if(a.seat)a.npc.wardSeat(a.t,a.seat,a.gaze,voice,a.job==='patient');
    else if(a.motion)a.motion(a.t,chart,a.gaze,voice);
    else a.npc.deskWork(a.t,a.job,a.gaze,voice);
  }
  const cue=a=>({id:a.id,name:a.name,line:a.line,at:a.npc.actor.position,speakFor:a.speak});
  function update(room,p,dt){
    let changed=false;
    for(const a of actors.get(room)??[]){
      if(!a.npc.controllable()||!dt)continue;
      const distance=Math.hypot(a.x-p.x,a.z-p.z);
      if(distance>8.5)continue;
      a.acc+=dt;if(a.acc<1/24)continue;
      const step=a.acc;a.acc=0;a.t+=step;a.chat=Math.max(0,a.chat-step);
      const angle=Math.atan2(p.x-a.x,p.z-a.z)-a.yaw;
      const direction=Math.atan2(Math.sin(angle),Math.cos(angle));
      a.gaze+=((a.chat>0?limit(direction,.92):0)-a.gaze)*(1-Math.exp(-step*6));
      pose(a);changed=true;
    }
    return changed;
  }
  const staffAt=p=>actors.get(cell(p))?.find(a=>a.existing&&a.npc.atStation());
  function target(p,look){
    const a=staffAt(p);if(!a)return null;
    const x=a.x-p.x,z=a.z-p.z,d=Math.hypot(x,z);
    return d<2.22&&d>.29&&x*look.x+z*look.z>.63*d?a.target:null;
  }
  function talk(p,look){
    if(!target(p,look))return null;
    const a=staffAt(p);
    if(a.chat>0)return null;
    a.speak();return cue(a);
  }
  return {register,update,target,talk};
}
