// Local plan: u runs across the stair; v increases in the direction of the
// lower flight. Positions and moving leaf pivots use the same coordinate grid.
export const X=42.60,Z=-13.52,W=4.35,S=2.16,back=-5.50,turn=-2.64,returnStart=-3.95;
export const base=-.046,rise=.162,n=8,tread=.30,upperStart=turn+n*tread,lowerEnd=returnStart+n*tread;
export const a=base-n*rise,b=a-n*rise,ceiling=-.39,roomLeft=S+.105;
export const p=(u,y,v)=>[X-v,y,Z+u],lower=y=>y<-1.84;
export const WC_CUT={left:X,right:X-back,back:Z,front:Z+W};
export const WC_OUTLINE=[[X,Z],[X-back,Z],[X-back,Z+W],[X,Z+W]];
export const ROOMS={
  landing:[roomLeft,W,0,.405],lobby:[roomLeft,4.19,.405,7.42],
  women:[4.19,7.24,.405,3.80],men:[4.19,7.24,3.80,7.42],
  womenA:[7.24,9.10,.405,1.79],womenB:[7.24,9.10,1.79,3.80],
  menA:[7.24,9.10,3.80,5.55],menB:[7.24,9.10,5.55,7.42],
  tunnel:[9.10,12.60,6.24,7.42],bend:[12.60,14.17,4.81,7.42],
  collective:[11.18,20.12,-4.20,4.81]
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
  ['bend','collective','v',4.81,12.63,14.14]
];
const ids=Object.keys(ROOMS);
export const isRock=id=>['tunnel','bend','collective'].includes(id);
export function wcRoomAt(u,v,tolerance=.001){
  return ids.find(id=>{const [u0,u1,v0,v1]=ROOMS[id];return u>=u0-tolerance&&u<=u1+tolerance&&v>=v0-tolerance&&v<=v1+tolerance;})??null;
}
export const isWcInterior=pos=>lower(pos.y)&&wcRoomAt(pos.z-Z,X-pos.x)!==null;
export function wcRoofAt(id,u,v){
  if(!isRock(id))return ceiling;
  const [u0,u1,v0,v1]=ROOMS[id],across=id==='tunnel'?(v-v0)/(v1-v0):(u-u0)/(u1-u0);
  return -.73+Math.sqrt(Math.max(0,1-(2*across-1)**2))*(id==='collective'?.56:.48);
}
export function wcHeightAt(x,z,referenceY=0){
  const u=z-Z,v=X-x;
  if(lower(referenceY)&&wcRoomAt(u,v))return b;
  if(u<0||u>W||v<back||v>0)return null;
  const down=t=>Math.max(0,Math.min(n,t/tread+.5))*rise;
  if(u<S)return base-down(upperStart-v);
  if(v<=returnStart)return a;
  return a-down(v-returnStart);
}
export function wcCeilingAt(x,z,referenceY=0){
  const u=z-Z,v=X-x,room=lower(referenceY)&&wcRoomAt(u,v);
  if(!room)return Infinity;
  for(const [a,c,axis,edge,l,r,door] of LINKS){
    if(a!==room&&c!==room)continue;
    const fixed=axis==='u'?u:v,t=axis==='u'?v:u;
    if(Math.abs(fixed-edge)>.13||t<l||t>r)continue;
    const h=isRock(a)||isRock(c)?1.91:door?.[0]?.match(/-[ab]$/)?1.945:2.067;
    return Math.min(wcRoofAt(room,u,v),b+h);
  }
  return wcRoofAt(room,u,v);
}
export function wcCameraMode(pos){
  const u=pos.z-Z,v=X-pos.x;
  if(lower(pos.y)&&wcRoomAt(u,v))return v<.16?'threshold':'inside';
  // The throat is visible from the turning landing, even while the player
  // is still a whole flight above the threshold. Share both render layers.
  const onReturn=u>=roomLeft-.09||v<returnStart+.06;
  return onReturn&&u>=-.035&&u<=W+.04&&v>=back-.025&&v<.17&&pos.y<a+.86
    ?'threshold':'surface';
}
