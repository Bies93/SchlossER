import {HALL} from './palace-openings.js';

export const LAB_CUT={left:-27.38,right:-20.78,back:-6.70,front:-4.40};
const {left,right,back,front}=LAB_CUT;
export const LAB_OUTLINE=[[left,back],[right,back],[right,front],[left,front]];
export const LAB={top:HALL.floor,count:22,riser:.176,run:(right-left)/22,ceiling:-.48,
  end:-6.34,south:-7.42,north:4.14};
LAB.floor=LAB.top-LAB.count*LAB.riser;
export const labLower=y=>y<-3.24;
export function labFloorAt(x,z,referenceY=0){
  if(x>=left&&x<=right&&z>=back&&z<=front)
    return LAB.top-LAB.riser*Math.max(0,Math.min(LAB.count,(x-left)/LAB.run+.5));
  if(labLower(referenceY)&&x>=right-.012&&x<=LAB.end&&z>=LAB.south&&z<=LAB.north)return LAB.floor;
  return null;
}
export function labCeilingAt(x,z,referenceY=0){
  return labLower(referenceY)&&x>=right&&x<=LAB.end&&z>=LAB.south&&z<=LAB.north?LAB.ceiling:Infinity;
}

// Existing library boards are authored with u=-x, d=-z.
export function aroundLabOpening(u0,u1,d0,d1){
  const l=Math.max(u0,-right),r=Math.min(u1,-left),a=Math.max(d0,-front),b=Math.min(d1,-back);
  if(l>=r||a>=b)return [[u0,u1,d0,d1]];
  return [[u0,l,d0,d1],[r,u1,d0,d1],[l,r,d0,a],[l,r,b,d1]]
    .filter(([x,y,z,w])=>y-x>.0002&&w-z>.0002);
}
