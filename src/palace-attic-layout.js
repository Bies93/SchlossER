// World-space dimensions shared by both storeys, in metres.
export const ATTIC_LAYER=7, ATTIC_FLOOR=10.49, ATTIC_CEILING=14.30;
export const ATTIC_WELL={left:29.74,innerLeft:30.684,innerRight:30.835,right:31.84,
  cutNear:-1.59,start:-1.18,turn:.62,far:1.59,steps:11};

export function atticStair(lower){
  const w=ATTIC_WELL,rise=(ATTIC_FLOOR-lower)/(w.steps*2),run=(w.turn-w.start)/w.steps;
  const mid=lower+w.steps*rise;
  const tread=i=>w.start+i*run;
  const level=(d,base)=>base+Math.min(w.steps,Math.max(1,Math.floor(d/run+1e-7)+1))*rise;
  const inFlight=(x,z)=>x>=w.left&&x<=w.right&&z>=w.start&&z<=w.far;
  function floorAt(x,z,y){
    if(inFlight(x,z)){
      if(z>=w.turn)return y>=mid-.27?mid:null;
      if(x<=w.innerLeft)return level(z-w.start,lower);
      if(x>=w.innerRight&&y>=mid-.27)return level(w.turn-z,mid);
      return null;
    }
    return null;
  }
  return {rise,run,mid,tread,inFlight,floorAt};
}
