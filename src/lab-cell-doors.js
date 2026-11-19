import {architectureKit} from './architecture-kit.js';
import {labCellAt,labLower,LAB} from './lab-layout.js';
import {PLAYER} from './world-layout.js';

const turn=Math.PI/2;
// Same pivot and length drive the rendered leaf and its collision rectangle.
export function cellDoor(T,root,world,M,x,z,span,letter,open){
  const leaf=new T.Group();leaf.name='Gittertür · Zelle '+letter;leaf.position.set(x,LAB.floor,z);root.add(leaf);
  const k=architectureKit(T,leaf,M),p=(u,y,d)=>[-d,y,u];
  const box=(m,a,b,l,h,c,d)=>k.box(m,p,a,b,l,h,c,d);
  for(const e of [0,span])box('edge',e-.032,e+.032,.05,2.425,-.045,.045);
  for(const y of [.086,.928,2.374])box('edge',.006,span-.006,y-.025,y+.025,-.038,.038);
  for(let u=.124;u<span-.070;u+=.161)box('iron',u-.015,u+.015,.091,2.384,-.015,.015);
  for(const y of [.30,1.98])box('brass',-.042,.078,y-.063,y+.063,-.052,.052);
  const latch=span-.127;
  box('gunmetal',latch-.083,latch+.082,1.017,1.207,-.058,.058);
  for(const d of [-.089,.062]){
    box('brass',latch-.064,latch+.043,1.122,1.145,d,d+.027);
    box('iron',latch-.019,latch+.018,1.060,1.094,d,d+.030);
  }
  k.flush(leaf.name);
  const pose={x,z,ux:0,uz:1,half:span*.5+.035,depth:.056};
  const door={id:'lab-cell-'+letter,label:'Zelle '+letter,target:Number(open),progress:Number(open)};
  const geometry=t=>{
    const a=turn*t*t*(3-2*t),s=Math.sin(a),c=Math.cos(a);
    leaf.rotation.y=-a;pose.ux=-s;pose.uz=c;pose.x=x-s*span*.5;pose.z=z+c*span*.5;
  };
  const occupied=(a,p)=>{
    const s=Math.sin(a),c=Math.cos(a),dx=p.x-x,dz=p.z-z;
    const along=-dx*s+dz*c,across=dx*c+dz*s;
    return Math.hypot(Math.max(0,-.035-along,along-span-.035),Math.max(0,Math.abs(across)-pose.depth))<PLAYER.radius+.035;
  };
  geometry(door.progress);
  world.movingBox(x-span-.12,z-.13,x+.13,z+span+.13,pose,p=>labLower(p.y));
  door.usable=p=>door.target===0||![0,.25,.5,.75,1].some(t=>occupied(t*turn,p));
  door.update=(dt,p)=>{
    if(dt<=0||door.progress===door.target)return false;
    const next=Math.max(0,Math.min(1,door.progress+(door.target?1:-1)*dt/.56));
    if(occupied(turn*next*next*(3-2*next),p)){
      if(!door.target){door.target=1;return true;}
      return false;
    }
    door.progress=next;geometry(next);return true;
  };
  door.aim=(p,look)=>{
    let best=-Infinity;
    for(const [cx,cz] of [[pose.x,pose.z],[x,z+span*.53]]){
      const dx=cx-p.x,dz=cz-p.z,len=Math.hypot(dx,dz);
      if(len>2.12||len<.09)continue;
      const focus=(dx*look.x+dz*look.z)/len;
      if(focus>=.55)best=Math.max(best,focus*1.42-len*.24);
    }
    return best;
  };
  return door;
}

export function cellDoorTarget(doors,p,look){
  if(!labLower(p.y)||labCellAt(p.x,p.z)!=='cells')return null;
  let best=null,score=-Infinity;
  for(const d of doors){const hit=d.aim(p,look);if(hit>score){best=d;score=hit;}}
  return best;
}
