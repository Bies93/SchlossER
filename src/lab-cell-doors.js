import {architectureKit} from './architecture-kit.js';
import {labCellAt,labLower,LAB} from './lab-layout.js';
import {PLAYER} from './world-layout.js';

const turn=Math.PI/2;
// Same pivot and length drive the rendered leaf and its collision rectangle.
export function cellDoor(T,root,world,M,x,z,span,letter,open){
  return swingDoor(T,root,world,M,x,z,span,{id:'lab-cell-'+letter,label:'Zelle '+letter,open});
}
export function wardDoor(T,root,world,M,x,z,span){
  return swingDoor(T,root,world,M,x,z,span,{id:'lab-ward-door',label:'Behandlungsstation',solid:true,heading:-turn,delta:turn,open:false});
}
function swingDoor(T,root,world,M,x,z,span,{id,label,open,solid=false,heading=0,delta=-turn}){
  const leaf=new T.Group();leaf.name=(solid?'Stahltür · ':'Gittertür · ')+label;leaf.position.set(x,LAB.floor,z);root.add(leaf);
  const k=architectureKit(T,leaf,M),p=(u,y,d)=>[-d,y,u];
  const box=(m,a,b,l,h,c,d)=>k.box(m,p,a,b,l,h,c,d);
  if(solid){
    box('iron',-.024,span+.018,.025,2.258,-.076,.076);
    for(const s of [-1,1]){
      const sheet=s<0?[-.102,-.075]:[.075,.102];
      box('green',.041,span-.048,.092,2.187,...sheet);
      const edge=s<0?[-.124,-.101]:[.101,.124];
      for(const y of [.138,1.42,2.105])box('gunmetal',.082,span-.084,y-.025,y+.026,...edge);
      for(const u of [.083,span-.083])box('edge',u-.018,u+.018,.118,2.141,...edge);
      for(const y of [.512,1.93])for(const u of [.151,span-.164])
        box('brass',u-.013,u+.013,y-.013,y+.013,s<0?-.115:.103,s<0?-.103:.115);
    }
  }else{
    for(const e of [0,span])box('edge',e-.032,e+.032,.05,2.425,-.045,.045);
    for(const y of [.086,.928,2.374])box('edge',.006,span-.006,y-.025,y+.025,-.038,.038);
    for(let u=.124;u<span-.070;u+=.161)box('iron',u-.015,u+.015,.091,2.384,-.015,.015);
  }
  for(const y of [.30,1.98])box('brass',-.042,.078,y-.063,y+.063,solid?-.118:-.052,solid?.118:.052);
  const latch=span-.127;
  box('gunmetal',latch-.083,latch+.082,1.017,1.207,-.058,.058);
  for(const d of [-.089,.062]){
    const pos=solid?d+Math.sign(d)*.062:d;
    box('brass',latch-.064,latch+.043,1.122,1.145,pos,pos+.027);
    box('iron',latch-.019,latch+.018,1.060,1.094,pos,pos+.030);
  }
  k.flush(leaf.name);
  const pose={x,z,ux:0,uz:1,half:span*.5+.035,depth:solid?.122:.056};
  const door={id,label,target:Number(open),progress:Number(open),rooms:solid?['cells','infirmary']:['cells']};
  const geometry=t=>{
    const a=heading+delta*t*t*(3-2*t),s=Math.sin(a),c=Math.cos(a);
    leaf.rotation.y=a;pose.ux=s;pose.uz=c;pose.x=x+s*span*.5;pose.z=z+c*span*.5;
  };
  const occupied=(a,p)=>{
    const s=Math.sin(a),c=Math.cos(a),dx=p.x-x,dz=p.z-z;
    const along=dx*s+dz*c,across=dx*c-dz*s;
    return Math.hypot(Math.max(0,-.035-along,along-span-.035),Math.max(0,Math.abs(across)-pose.depth))<PLAYER.radius+.035;
  };
  geometry(door.progress);
  world.movingBox(x-span-.16,z-span-.16,x+span+.16,z+span+.16,pose,p=>labLower(p.y));
  door.usable=p=>door.target===0||![0,.25,.5,.75,1].some(t=>occupied(heading+delta*t,p));
  door.update=(dt,p)=>{
    if(dt<=0||door.progress===door.target)return false;
    const next=Math.max(0,Math.min(1,door.progress+(door.target?1:-1)*dt/(solid?.82:.56)));
    if(occupied(heading+delta*next*next*(3-2*next),p)){
      if(!door.target){door.target=1;return true;}
      return false;
    }
    door.progress=next;geometry(next);return true;
  };
  door.aim=(p,look)=>{
    let best=-Infinity;
    for(const [cx,cz] of [[pose.x,pose.z],[x+Math.sin(heading)*span*.53,z+Math.cos(heading)*span*.53]]){
      const dx=cx-p.x,dz=cz-p.z,len=Math.hypot(dx,dz);
      if(len>(solid?2.42:2.12)||len<.09)continue;
      const focus=(dx*look.x+dz*look.z)/len;
      if(focus>=.55)best=Math.max(best,focus*1.42-len*.24);
    }
    return best;
  };
  return door;
}

export function cellDoorTarget(doors,p,look){
  if(!labLower(p.y))return null;
  const room=labCellAt(p.x,p.z);
  let best=null,score=-Infinity;
  for(const d of doors){if(!d.rooms.includes(room))continue;const hit=d.aim(p,look);if(hit>score){best=d;score=hit;}}
  return best;
}
