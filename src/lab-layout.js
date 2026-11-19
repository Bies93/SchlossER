import {HALL} from './palace-openings.js';

export const LAB_CUT={left:-27.38,right:-20.78,back:-6.70,front:-4.40};
const {left,right,back,front}=LAB_CUT;
export const LAB_OUTLINE=[[left,back],[right,back],[right,front],[left,front]];
export const LAB={top:HALL.floor,count:22,riser:.176,run:(right-left)/22,ceiling:-.48,
  end:-6.34,south:-7.42,north:4.14};
LAB.floor=LAB.top-LAB.count*LAB.riser;
export const LAB_LAYER=3;
// Above the highest possible jump under the cellar ceiling, below the palace floor.
export const labLower=y=>y<-1.72;
// Extents are interior dimensions. Shared edges and their clear spans define
// movement, wall cuts and the render visibility graph in the same metre grid.
export const LAB_CELLS={
  stairs:[left,right,back,front],
  chambers:[right,LAB.end,LAB.south,LAB.north],
  lock:[-9.04,-7.00,LAB.north,7.25],
  spine:[-20.72,-7.00,7.25,9.68],
  archive:[-15.75,-9.45,9.68,15.24],
  plant:[-25.95,-20.72,6.82,13.85],
  return:[-24.97,-22.55,.24,6.82],
  observation:[-24.97,right,-3.68,.24],
  vault:[-25.95,-18.45,13.85,19.3],
  maltLock:[-23.9,-20.96,19.3,22.76],
  brewery:[-26.22,-16.24,22.76,30.15],
  beerLab:[-16.24,-9.74,23.16,28.72],
  ward:[-20.38,-16.30,30.15,33.04],
  cells:[-24.55,-16.30,33.04,40.12],
  infirmary:[-27.65,-13.60,40.12,53.75],
  ritesAccess:[-19.12,-15.86,53.75,59.62],
  registry:[-15.86,-2.15,53.75,62.13],
  nameFiles:[-15.86,-2.15,62.13,68.40],
  chapel:[-12.80,-2.15,42.00,53.75],
  ritesPass:[-11.15,-5.87,31.80,42.00],
  tasting:[-9.74,-1.57,22.90,31.80]
};
// [room A, room B, fixed axis, edge, aperture centre MIN/MAX]
export const LAB_LINKS=[
  ['stairs','chambers','x',right,back,front],
  ['chambers','lock','z',LAB.north,-8.98,-7.06],
  ['lock','spine','z',7.25,-8.98,-7.06],
  ['spine','archive','z',9.68,-12.91,-11.10],
  ['spine','plant','x',-20.72,7.54,9.36],
  ['plant','return','z',6.82,-24.73,-22.79],
  ['return','observation','z',.24,-24.75,-22.77],
  ['observation','chambers','x',right,-2.61,-.74],
  ['plant','vault','z',13.85,-23.85,-21.74],
  ['vault','maltLock','z',19.3,-23.52,-21.28],
  ['maltLock','brewery','z',22.76,-23.36,-21.34],
  ['brewery','beerLab','x',-16.24,24.45,26.48],
  ['brewery','ward','z',30.15,-19.49,-17.20],
  ['ward','cells','z',33.04,-19.52,-17.23],
  ['cells','infirmary','z',40.12,-19.42,-17.19],
  ['infirmary','ritesAccess','z',53.75,-18.32,-16.17],
  ['ritesAccess','registry','x',-15.86,55.30,57.52],
  ['registry','nameFiles','z',62.13,-7.92,-5.97],
  ['chapel','registry','z',53.75,-9.34,-7.10],
  ['ritesPass','chapel','z',42.00,-9.66,-7.41],
  ['tasting','ritesPass','z',31.80,-9.01,-6.87],
  ['beerLab','tasting','x',-9.74,24.46,26.63]
];
const cellEntries=Object.entries(LAB_CELLS);
function contains([x0,x1,z0,z1],x,z,pad){return x>=x0-pad&&x<=x1+pad&&z>=z0-pad&&z<=z1+pad}
export function labCellAt(x,z,pad=0){
  for(const [key,bounds] of cellEntries)if(contains(bounds,x,z,pad))return key;
  return null;
}
export function labEdges(id){
  const [x0,x1,z0,z1]=LAB_CELLS[id];
  return [['x',x0,z0,z1,-1],['x',x1,z0,z1,1],['z',z0,x0,x1,-1],['z',z1,x0,x1,1]].map(([axis,edge,min,max,sign])=>{
    const openings=LAB_LINKS.filter(([a,b,k,p])=>(a===id||b===id)&&k===axis&&p===edge).map(s=>s.slice(4)).sort((a,b)=>a[0]-b[0]);
    const solids=[];let start=min;
    for(const [a,b] of openings){if(a>start)solids.push([start,a]);start=Math.max(start,b)}
    if(start<max)solids.push([start,max]);
    return {axis,edge,min,max,sign,openings,solids};
  });
}
export function labFloorAt(x,z,referenceY=0){
  if(x>=left&&x<=right&&z>=back&&z<=front)
    return LAB.top-LAB.riser*Math.max(0,Math.min(LAB.count,(x-left)/LAB.run+.5));
  if(labLower(referenceY)&&labCellAt(x,z,.012))return LAB.floor;
  return null;
}
export function labCeilingAt(x,z,referenceY=0){
  const cell=labLower(referenceY)&&labCellAt(x,z,.012);
  return cell&&cell!=='stairs'?LAB.ceiling:Infinity;
}

// Existing library boards are authored with u=-x, d=-z.
export function aroundLabOpening(u0,u1,d0,d1){
  const l=Math.max(u0,-right),r=Math.min(u1,-left),a=Math.max(d0,-front),b=Math.min(d1,-back);
  if(l>=r||a>=b)return [[u0,u1,d0,d1]];
  return [[u0,l,d0,d1],[r,u1,d0,d1],[l,r,d0,a],[l,r,b,d1]]
    .filter(([x,y,z,w])=>y-x>.0002&&w-z>.0002);
}
