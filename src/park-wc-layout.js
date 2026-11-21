// Local plan: u runs across the stair; v increases in the direction of the
// lower flight. Positions and moving leaf pivots use the same coordinate grid.
export const X=42.60,Z=-13.52,W=4.35,S=2.16,back=-5.50,turn=-2.64,returnStart=-3.95;
export const base=-.046,rise=.162,n=8,tread=.30,upperStart=turn+n*tread,lowerEnd=returnStart+n*tread;
export const a=base-n*rise,b=a-n*rise,ceiling=-.39,roomLeft=S+.105;
export const p=(u,y,v)=>[X-v,y,Z+u],lower=y=>y<-1.84;
export const WC_CUT={left:X,right:X-back,back:Z,front:Z+W};
export const WC_OUTLINE=[[X,Z],[X-back,Z],[X-back,Z+W],[X,Z+W]];
export const DEEP_STAIR={top:11.18,bottom:5.30,left:-1.055,right:.385,count:20,rise:.165};
export const DEEP_RUN=(DEEP_STAIR.top-DEEP_STAIR.bottom)/DEEP_STAIR.count;
export const DEEP_FLOOR=b-DEEP_STAIR.count*DEEP_STAIR.rise;
export const ORB={u:-19.64,v:.20};
export const deepWalk=o=>o.y<b-1.16;
export const upperWcWalk=o=>o.y>=b-.25&&lower(o.y);
export const ROOMS={
  landing:[roomLeft,W,0,.405],lobby:[roomLeft,4.19,.405,7.42],
  women:[4.19,7.24,.405,3.80],men:[4.19,7.24,3.80,7.42],
  womenA:[7.24,9.10,.405,1.79],womenB:[7.24,9.10,1.79,3.80],
  menA:[7.24,9.10,3.80,5.55],menB:[7.24,9.10,5.55,7.42],
  tunnel:[9.10,12.60,6.24,7.42],bend:[12.60,14.17,4.81,7.42],
  collective:[11.18,20.12,-4.20,4.81],
  practice:[20.12,33.65,-5.43,-.64],
  greenhouse:[20.12,30.85,.69,6.65],
  studio:[13.75,20.12,-8.98,-4.20],
  workshop:[14.17,20.12,4.81,11.79],
  plenum:[20.12,27.99,6.65,13.18],
  kitchen:[27.99,35.77,6.65,13.18]
};
// [room A, room B, axis, wall, start, end, doorspec?]. Room A owns
// each portal; neither neighbour builds a second frame over it.
export const LINKS=[
  ['landing','lobby','v',.405,roomLeft,4.19],
  ['lobby','women','u',4.19,2.29,3.49,['wc-women','Damen']],
  ['lobby','men','u',4.19,4.13,5.33,['wc-men','Herren']],
  ['women','womenA','u',7.24,.64,1.71,['wc-women-a','Damenkabine 1']],
  ['women','womenB','u',7.24,2.07,3.24,['wc-women-b','Damenkabine 2']],
  ['men','menA','u',7.24,4.11,5.29,['wc-men-a','Herrenkabine 1']],
  ['men','menB','u',7.24,5.88,7.10,['wc-men-b','Herrenkabine 2']],
  ['menB','tunnel','u',9.10,6.24,7.42],
  ['tunnel','bend','u',12.60,6.24,7.42],
  ['bend','collective','v',4.81,12.63,14.14],
  ['collective','practice','u',20.12,-3.94,-2.35],
  ['collective','greenhouse','u',20.12,2.34,4.08],
  ['collective','studio','v',-4.20,16.91,18.48,['mf-studio-door','Schallschutztür']],
  ['collective','workshop','v',4.81,14.57,16.23],
  ['greenhouse','kitchen','v',6.65,28.69,30.18],
  ['workshop','plenum','u',20.12,7.40,9.14],
  ['plenum','kitchen','u',27.99,10.11,11.83]
];
export const DEEP_ROOMS={
  deepStair:[DEEP_STAIR.bottom,DEEP_STAIR.top,DEEP_STAIR.left,DEEP_STAIR.right],
  deepLanding:[2.46,DEEP_STAIR.bottom,-2.62,1.88],
  deepLounge:[-14.75,2.46,-6.45,6.84],
  deepOrb:[-25.62,-14.75,-3.98,4.38],
  deepVotive:[-25.12,-20.02,-9.04,-3.98]
};
export const ZONE_ROOMS={...ROOMS,...DEEP_ROOMS};
export const ZONE_LINKS=[...LINKS,
  ['collective','deepStair','u',DEEP_STAIR.top,DEEP_STAIR.left,DEEP_STAIR.right],
  ['deepLanding','deepStair','u',DEEP_STAIR.bottom,DEEP_STAIR.left,DEEP_STAIR.right],
  ['deepLanding','deepLounge','u',2.46,-1.56,1.37],
  ['deepLounge','deepOrb','u',-14.75,-.93,1.29,['mf-orb-door','Tür zum Voodoo-Raum']],
  ['deepOrb','deepVotive','v',-3.98,-24.34,-22.78]
];
const ids=Object.keys(ROOMS);
const deepIds=Object.keys(DEEP_ROOMS);
export const isNewHQ=id=>id==='studio'||id==='workshop'||id==='plenum'||id==='kitchen';
export const isAnnex=id=>id==='practice'||id==='greenhouse'||isNewHQ(id);
export const isDeep=id=>Object.hasOwn(DEEP_ROOMS,id);
export const isRock=id=>id==='tunnel'||id==='bend'||id==='collective'||isAnnex(id)||isDeep(id);
export const wcLevel=id=>isDeep(id)?DEEP_FLOOR:b;
const contains=(bounds,u,v,t)=>u>=bounds[0]-t&&u<=bounds[1]+t&&v>=bounds[2]-t&&v<=bounds[3]+t;
export function wcRoomAt(u,v,tolerance=.001){
  return ids.find(id=>contains(ROOMS[id],u,v,tolerance))??null;
}
export function wcZoneAt(u,v,y,tolerance=.002){
  if(!lower(y))return null;
  // The stair lies outside the upper WC's footprint. In the portions that
  // overlap in plan, use the player's elevation, never X/Z alone.
  if(u<DEEP_STAIR.top-.002&&contains(DEEP_ROOMS.deepStair,u,v,tolerance)&&y<b+.22)return 'deepStair';
  if(y<b-1.0)return deepIds.find(id=>id!=='deepStair'&&contains(DEEP_ROOMS[id],u,v,tolerance))??null;
  return wcRoomAt(u,v,tolerance);
}
export const isWcInterior=pos=>wcZoneAt(pos.z-Z,X-pos.x,pos.y)!==null;
export const deepStairY=u=>b-DEEP_STAIR.rise*Math.min(DEEP_STAIR.count,Math.max(0,(DEEP_STAIR.top-u)/DEEP_RUN+.37));
export function wcRoofAt(id,u,v){
  if(!isRock(id))return ceiling;
  if(id==='deepStair')return Math.min(b+1.91,deepStairY(u)+2.32);
  if(isDeep(id)){
    const [,,v0,v1]=DEEP_ROOMS[id],f=2*(v-v0)/(v1-v0)-1,crest=Math.sqrt(Math.max(0,1-f*f));
    return DEEP_FLOOR+2.31+crest*(id==='deepOrb'?.84:id==='deepLounge'?.75:.34);
  }
  const [u0,u1,v0,v1]=ROOMS[id],across=id==='tunnel'||isAnnex(id)?(v-v0)/(v1-v0):(u-u0)/(u1-u0);
  return -.73+Math.sqrt(Math.max(0,1-(2*across-1)**2))*(isAnnex(id)?.63:id==='collective'?.56:.48);
}
export function wcHeightAt(x,z,referenceY=0){
  const u=z-Z,v=X-x;
  const zone=wcZoneAt(u,v,referenceY);
  if(zone==='deepStair')return deepStairY(u);
  if(zone)return wcLevel(zone);
  if(u<0||u>W||v<back||v>0)return null;
  const down=t=>Math.max(0,Math.min(n,t/tread+.5))*rise;
  if(u<S)return base-down(upperStart-v);
  if(v<=returnStart)return a;
  return a-down(v-returnStart);
}
export function wcCeilingAt(x,z,referenceY=0){
  const u=z-Z,v=X-x,room=wcZoneAt(u,v,referenceY);
  if(!room)return Infinity;
  for(const [a,c,axis,edge,l,r,door] of ZONE_LINKS){
    if(a!==room&&c!==room)continue;
    const fixed=axis==='u'?u:v,t=axis==='u'?v:u;
    if(Math.abs(fixed-edge)>.13||t<l||t>r)continue;
    const h=(isDeep(a)&&isDeep(c))?2.21:isRock(a)||isRock(c)?1.91:door?.[0]?.match(/-[ab]$/)?1.945:2.067;
    const landing=(a==='deepStair'||c==='deepStair')&&edge===DEEP_STAIR.bottom;
    return Math.min(wcRoofAt(room,u,v),(landing?DEEP_FLOOR:room==='deepStair'?b:wcLevel(room))+h);
  }
  return wcRoofAt(room,u,v);
}
export function wcCameraMode(pos){
  const u=pos.z-Z,v=X-pos.x;
  const room=wcZoneAt(u,v,pos.y);
  if(room)return room==='landing'&&v<.16?'threshold':'inside';
  // Both flights and the open rim can overlook the return landing.
  if(u>=-2&&u<=W+2&&v>=back-3&&v<1.5&&pos.y>=b-.30&&pos.y<base+2.1)return 'threshold';
  // From farther away the only possible view in is over the open cut and
  // under the return lintel. Project both lintel ends onto garden grade.
  if(v<0&&pos.y>=base-.25){
    const k=(base-ceiling)/(pos.y+(pos.eyeHeight??1.67)-ceiling);
    if(v*k>=back-.16&&roomLeft*(1-k)+u*k<=W+.16&&W*(1-k)+u*k>=-.16)return 'threshold';
  }
  return 'surface';
}
