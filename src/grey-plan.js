// The public approach is beside the north wing; the demonstration moves
// around the end of the building onto an open strip toward the park edge.
export const GREY_AT=Object.freeze({x:-46.2,z:-79.2,yaw:1.31});
export const GREY_SITE=Object.freeze({x:-53.45,z:-85.55});
export const GREY_CONTROLS=Object.freeze([[-46.02,-83.31],[-48.34,-86.64]].map(Object.freeze));
const unit=t=>Math.max(0,Math.min(1,t));
export const ease=(a,b,t)=>{const f=unit((t-a)/(b-a));return f*f*(3-2*f);};
export function greyLane(t,out={}){
  t=unit(t);const q=1-t;
  const [a,b]=GREY_CONTROLS;
  out.x=q**3*GREY_AT.x+3*q*q*t*a[0]+3*q*t*t*b[0]+t**3*GREY_SITE.x;
  out.z=q**3*GREY_AT.z+3*q*q*t*a[1]+3*q*t*t*b[1]+t**3*GREY_SITE.z;
  return out;
}
export function greyLaneClear(x,z,r=.88){
  if(x>GREY_AT.x+1.65||x<GREY_SITE.x-1.65||z>GREY_AT.z+1.65||z<GREY_SITE.z-2.8)return false;
  for(let i=0;i<=16;i++){
    const p=greyLane(i/16);
    if(Math.hypot(p.x-x,p.z-z)<r)return true;
  }
  return false;
}
export const GREY_CUES=Object.freeze({walk:.86,arrive:7.16,shake:7.85,spark:8.89,burst:9.44,still:15.7});
export function greyBeat(time){
  const c=GREY_CUES;
  return time<c.walk?'laugh':time<c.arrive?'walk':time<c.shake?'show':time<c.spark?'shake':
    time<c.burst?'spark':time<c.still?'burst':'ash';
}
export function greyShow(){
  let time=0,running=false;
  return {get time(){return time;},get running(){return running;},get beat(){return running?greyBeat(time):'idle';},
    begin(accept){if(!accept||running)return false;running=true;return true;},
    step(dt,emit){
      if(!running||dt<=0||time>=GREY_CUES.still)return false;
      const next=Math.min(GREY_CUES.still,time+dt);
      for(const [id,moment] of Object.entries(GREY_CUES))if(time<moment&&next>=moment)emit(id);
      time=next;return true;
    }};
}
