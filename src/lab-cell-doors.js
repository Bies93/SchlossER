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
export function utilityDoor(T,root,world,M,x,z,span,{id,label,floor,lower,cubicle=false,hingeAtEnd=false,acoustic=false,ritual=false}){
  const heading=acoustic?0:hingeAtEnd?turn:-turn;
  return swingDoor(T,root,world,M,x,z,span,{id,label,floor,lower,cubicle,acoustic,ritual,open:false,solid:true,utility:true,heading,delta:acoustic?turn:ritual?-turn:-heading});
}
function swingDoor(T,root,world,M,x,z,span,{id,label,open,solid=false,utility=false,cubicle=false,acoustic=false,ritual=false,heading=0,delta=-turn,floor=LAB.floor,lower=labLower}){
  const leaf=new T.Group();leaf.name=(ritual?'Moosfunk · ':utility?'WC-Tür · ':solid?'Stahltür · ':'Gittertür · ')+label;leaf.userData.movingOccluder=true;leaf.position.set(x,floor,z);root.add(leaf);
  const k=architectureKit(T,leaf,M),p=(u,y,d)=>[-d,y,u];
  const box=(m,a,b,l,h,c,d)=>k.box(m,p,a,b,l,h,c,d);
  if(utility){
    const low=cubicle?.137:.022,top=ritual?2.192:acoustic?1.87:cubicle?1.889:2.059;
    box('iron',-.012,span+.011,low,top,-.026,.026);
    for(const s of [-1,1]){
      const t=s<0?[-.035,-.026]:[.026,.035],profile=s<0?[-.043,-.034]:[.034,.043];
      box(acoustic||ritual?'darkWood':'green',.023,span-.022,low+.023,top-.022,...t);
      if(ritual){
        const a=s<0?-.053:.036,b=s<0?-.036:.053;
        for(let j=.091;j<span-.079;j+=.134)box('wood',j-.009,j+.009,.115,2.112,a,b);
        for(const y of [.234,1.94])box('tunnelMetal',.068,span-.072,y-.026,y+.026,a-.003,b+.003);
        box('brass',span*.5-.188,span*.5+.188,1.376,1.701,a-.009,b+.009);
        box('gasket',span*.5-.148,span*.5+.148,1.414,1.665,a-.014,b+.014);
        box('moosJade',span*.5-.018,span*.5+.018,1.444,1.635,a-.018,b+.018);
      }
      if(acoustic){
        const [a,b]=s<0?[-.067,-.034]:[.034,.067];
        box('fabric',.075,span-.25,low+.105,top-.13,a,b);
        for(let j=.18;j<span-.2;j+=.16)
          box('wood',j-.009,j+.009,low+.107,top-.136,s<0?a-.008:b-.003,s<0?a+.003:b+.008);
      }
      for(const u of [.036,span-.037])box('edge',u-.009,u+.009,low+.021,top-.022,...profile);
      for(const y of [low+.03,top-.034])box('edge',.032,span-.033,y-.009,y+.009,...profile);
      const mount=s<0?[-.055,-.033]:[.033,.055];
      box('gunmetal',span-.19,span-.086,.925,1.095,...mount);
      box('brass',span-.221,span-.087,1.028,1.057,s<0?-.087:.070,s<0?-.066:.091);
      box('edge',span-.134,span-.107,1.029,1.054,s<0?-.068:.051,s<0?-.051:.071);
    }
  }else if(solid){
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
    for(let u=.124;u<span-.070;u+=.161){
      box('iron',u-.016,u+.016,.091,2.384,-.016,.016);
      for(const y of [.928,2.369])box('gunmetal',u-.023,u+.023,y-.038,y+.038,-.022,.022);
    }
    for(const u of [.022,span-.022])for(const y of [.149,2.321]){
      box('gunmetal',u-.025,u+.025,y-.049,y+.049,-.049,.049);
      for(const depth of [-.055,.050])box('wardSteel',u-.011,u+.011,y-.010,y+.010,depth,depth+.005);
    }
  }
  for(const y of (utility?[.34,1.68]:[.30,1.98]))box('brass',-.042,.078,y-.063,y+.063,utility?-.043:solid?-.118:-.052,utility?.043:solid?.118:.052);
  const latch=span-.127;
  if(!utility)box('gunmetal',latch-.083,latch+.082,1.017,1.207,-.058,.058);
  if(!utility)for(const d of [-.089,.062]){
    const pos=solid?d+Math.sign(d)*.062:d;
    box('brass',latch-.064,latch+.043,1.122,1.145,pos,pos+.027);
    box('iron',latch-.019,latch+.018,1.060,1.094,pos,pos+.030);
  }
  k.flush(leaf.name);
  const pose={x,z,ux:0,uz:1,half:span*.5+.035,depth:ritual?.091:utility?.052:solid?.122:.056};
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
  world.movingBox(x-span-.16,z-span-.16,x+span+.16,z+span+.16,pose,p=>lower(p.y));
  const detailedSweep=acoustic||ritual;
  const samples=detailedSweep?[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]:[0,.25,.5,.75,1];
  door.usable=p=>!detailedSweep&&door.target===0||!samples.some(t=>occupied(heading+delta*t,p));
  door.update=(dt,p)=>{
    if(dt<=0||door.progress===door.target)return false;
    const next=Math.max(0,Math.min(1,door.progress+(door.target?1:-1)*dt/(ritual?.64:utility?.47:solid?.82:.56)));
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
      if(len>(ritual?2.20:utility?1.74:solid?2.42:2.12)||len<.09)continue;
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
