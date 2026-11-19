// South garden path, just beyond the WC turning. Independent of the palace
// lab deck and Moosfunk; the plan is also the source for physics and apertures.
export const CHAPTER_BENCH=[36,-34,1.57];
export const CHAPTER_CUT=[33.57,37.30,-34.95,-33.05];
const [cover,top,z0,z1]=CHAPTER_CUT;
export const CHAPTER_STEP={foot:30.28,top,cover,z0,z1,count:24,rise:.178};
export const CHAPTER_DROP=24*CHAPTER_STEP.rise;
export const CHAPTER_ROOMS={
  vestibule:[26.80,30.28,-36.55,-32.50],
  salle:[16.20,26.80,-38.60,-32.50],
  archive:[19.05,26.80,-45.80,-38.60],
  chapter:[9.30,16.20,-42.85,-34.33]
};
export const CHAPTER_LINKS=[
  ['vestibule','stair','x',30.28,z0,z1],
  ['vestibule','salle','x',26.80,-35.16,-32.89],
  ['salle','archive','z',-38.60,22.16,24.43],
  ['salle','chapter','x',16.20,-37.99,-35.18]
];
export const CHAPTER_LAYER=5;
export const chapterContains=([a,b,c,d],x,z,pad=0)=>x>=a-pad&&x<=b+pad&&z>=c-pad&&z<=d+pad;
export const CHAPTER_STAIR_RECT=[CHAPTER_STEP.foot,top,z0,z1];
export const chapterCell=(x,z,pad=0)=>chapterContains(CHAPTER_STAIR_RECT,x,z,pad)?'stair':
  Object.keys(CHAPTER_ROOMS).find(key=>chapterContains(CHAPTER_ROOMS[key],x,z,pad))??null;
export function chapterStairFloor(x){
  const n=(top-x)/(top-CHAPTER_STEP.foot)*CHAPTER_STEP.count;
  return -CHAPTER_STEP.rise*Math.min(CHAPTER_STEP.count,Math.max(0,n+.3));
}
