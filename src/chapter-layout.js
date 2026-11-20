// South garden path, just beyond the WC turning. Independent of the palace
// lab deck and Moosfunk; the plan is also the source for physics and apertures.
export const CHAPTER_BENCH=[34.22,-34,-1.529];
export const CHAPTER_BAY_PATH=[[35.05,-31.1],[34.45,-32.05],[34.38,-34.40],[35.0,-35.55]];
export const CHAPTER_CUT=[31.53,34.88,-34.96,-33.04];
const [cover,top,z0,z1]=CHAPTER_CUT;
export const CHAPTER_BACKDROP_CUT={left:cover,right:top,back:z0,front:z1};
export const CHAPTER_STEP={foot:29.02,top,cover,z0,z1,count:24,rise:.178};
export const CHAPTER_DROP=24*CHAPTER_STEP.rise;
export const CHAPTER_DEEP_STEP={top:-55.91,foot:-62.51,x0:20.44,x1:22.60,count:24,rise:.167};
export const CHAPTER_DEEP_DROP=CHAPTER_DEEP_STEP.count*CHAPTER_DEEP_STEP.rise;
export const CHAPTER_CELL=[20.14,27.91,-79.84,-74.54];
export const CHAPTER_PRISONER=[23.97,-76.58];
const {top:deepTop,foot:deepFoot,x0:deepL,x1:deepR}=CHAPTER_DEEP_STEP;
export const CHAPTER_ROOMS={
  vestibule:[26.80,CHAPTER_STEP.foot,-36.55,-32.50],
  salle:[16.20,26.80,-38.60,-32.50],
  archive:[19.05,26.80,-45.80,-38.60],
  chapter:[9.30,16.20,-42.85,-34.33],
  duel:[16.20,27.09,deepTop,-45.80],
  lowerHall:[19.68,23.35,-71,deepFoot],
  dormitory:[11.04,19.68,-71,deepFoot],
  kitchen:[23.35,31.94,-71,deepFoot],
  prison:[18.88,29.22,-80.35,-71]
};
export const CHAPTER_LINKS=[
  ['vestibule','stair','x',CHAPTER_STEP.foot,z0,z1],
  ['vestibule','salle','x',26.80,-35.16,-32.89],
  ['salle','archive','z',-38.60,22.16,24.43],
  ['salle','chapter','x',16.20,-37.99,-35.18],
  ['archive','duel','z',-45.80,22.69,24.35],
  ['duel','lowerStair','z',deepTop,deepL,deepR],
  ['lowerHall','lowerStair','z',deepFoot,deepL,deepR],
  ['lowerHall','dormitory','x',19.68,-66.88,-64.87],
  ['lowerHall','kitchen','x',23.35,-67.18,-65.06],
  ['lowerHall','prison','z',-71,20.18,22.75]
];
export const CHAPTER_LAYER=5;
export const chapterContains=([a,b,c,d],x,z,pad=0)=>x>=a-pad&&x<=b+pad&&z>=c-pad&&z<=d+pad;
export const CHAPTER_STAIR_RECT=[CHAPTER_STEP.foot,top,z0,z1];
const CHAPTER_DEEP_RECT=[deepL,deepR,deepFoot,deepTop];
export const isChapterDeep=id=>id==='lowerHall'||id==='dormitory'||id==='kitchen'||id==='prison';
const entries=Object.entries(CHAPTER_ROOMS);
export const chapterCell=(x,z,pad=0)=>chapterContains(CHAPTER_STAIR_RECT,x,z,pad)?'stair':
  chapterContains(CHAPTER_DEEP_RECT,x,z,pad)?'lowerStair':
  entries.find(([,bounds])=>chapterContains(bounds,x,z,pad))?.[0]??null;
export function chapterStairFloor(x){
  const n=(top-x)/(top-CHAPTER_STEP.foot)*CHAPTER_STEP.count;
  return -CHAPTER_STEP.rise*Math.min(CHAPTER_STEP.count,Math.max(0,n+.3));
}
export function chapterDeepStairFloor(z){
  const s=CHAPTER_DEEP_STEP,n=(s.top-z)/(s.top-s.foot)*s.count;
  return -s.rise*Math.max(0,Math.min(s.count,n+.28));
}
