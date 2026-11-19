import {HALL,SOUTH_HATCH} from './palace-openings.js';

export const LAB_CUT={left:-27.38,right:-20.78,back:-6.70,front:-4.40};
const {left,right,back,front}=LAB_CUT;
export const LAB_OUTLINE=[[left,back],[right,back],[right,front],[left,front]];
export const LAB={top:HALL.floor,count:22,riser:.176,run:(right-left)/22,ceiling:-.48,
  end:-6.34,south:-7.42,north:4.14};
LAB.floor=LAB.top-LAB.count*LAB.riser;
export const LAB_LAYER=3;
// Above the highest possible jump under the cellar ceiling, below the palace floor.
export const labLower=y=>y<-1.72;
export const LODGE_RUN=(SOUTH_HATCH.end-SOUTH_HATCH.x0)/LAB.count;
export const CLUB_STAIR={top:SOUTH_HATCH.end,foot:24.48,z0:-5.40,z1:-3.53,count:24,rise:.18};
export const CLUB_FLOOR=LAB.floor-CLUB_STAIR.count*CLUB_STAIR.rise,CLUB_CEILING=LAB.floor-.30;
export const clubStep= (CLUB_STAIR.top-CLUB_STAIR.foot)/CLUB_STAIR.count;
export const clubStairY=x=>LAB.floor-CLUB_STAIR.rise*Math.min(CLUB_STAIR.count,Math.max(0,(CLUB_STAIR.top-x)/clubStep+.40));
export const clubLevel=y=>y<LAB.floor-1.55;
export const nearLodgeHatch=p=>p.x>SOUTH_HATCH.x0-3.95&&p.x<SOUTH_HATCH.x1+.27&&p.z>SOUTH_HATCH.z0-.43&&p.z<2.25;
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
  tasting:[-9.74,-1.57,22.90,31.80],
  southStair:[SOUTH_HATCH.x0,SOUTH_HATCH.end,SOUTH_HATCH.z0,SOUTH_HATCH.z1],
  southVest:[SOUTH_HATCH.end,34.92,-8.72,-3.40],
  clubStair:[CLUB_STAIR.foot,CLUB_STAIR.top,CLUB_STAIR.z0,CLUB_STAIR.z1],
  hopClub:[8.65,CLUB_STAIR.foot,-17.90,-3.36],
  southSpine:[29.44,34.92,-17.24,-8.72],
  southBarracksA:[18.10,29.44,-13.14,-8.82],
  southBarracksB:[19.65,29.44,-17.24,-13.14],
  southMess:[22.20,34.92,-25.52,-17.24],
  southPrivate:[15.30,22.20,-25.52,-19.30],
  southShrine:[21.45,29.87,-31.95,-25.52]
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
  ['beerLab','tasting','x',-9.74,24.46,26.63],
  ['southStair','southVest','x',SOUTH_HATCH.end,SOUTH_HATCH.z0,SOUTH_HATCH.z1],
  ['southVest','clubStair','x',CLUB_STAIR.top,CLUB_STAIR.z0,CLUB_STAIR.z1],
  ['hopClub','clubStair','x',CLUB_STAIR.foot,CLUB_STAIR.z0,CLUB_STAIR.z1],
  ['southVest','southSpine','z',-8.72,30.90,33.19],
  ['southSpine','southBarracksA','x',29.44,-11.99,-10.02],
  ['southSpine','southBarracksB','x',29.44,-16.24,-14.27],
  ['southSpine','southMess','z',-17.24,30.73,33.16],
  ['southMess','southPrivate','x',22.20,-23.25,-21.23],
  ['southMess','southShrine','z',-25.52,24.66,26.75]
];
const cellEntries=Object.entries(LAB_CELLS);
function contains([x0,x1,z0,z1],x,z,pad){return x>=x0-pad&&x<=x1+pad&&z>=z0-pad&&z<=z1+pad}
export function labCellAt(x,z,pad=0,y=0){
  if(clubLevel(y)&&contains(LAB_CELLS.hopClub,x,z,pad))return 'hopClub';
  for(const [key,bounds] of cellEntries)if(key!=='hopClub'&&(key!=='clubStair'||labLower(y))&&contains(bounds,x,z,pad))return key;
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
export function clubMix(p){
  if(!labLower(p.y))return 0;
  if(clubLevel(p.y)&&contains(LAB_CELLS.hopClub,p.x,p.z,.005))return 1;
  if(contains(LAB_CELLS.clubStair,p.x,p.z,.01))return .04+.74*Math.min(1,Math.max(0,(CLUB_STAIR.top-p.x)/(CLUB_STAIR.top-CLUB_STAIR.foot)))**2;
  return 0;
}
export function labFloorAt(x,z,referenceY=0,lodgeOpen=false){
  if(x>=left&&x<=right&&z>=back&&z<=front)
    return LAB.top-LAB.riser*Math.max(0,Math.min(LAB.count,(x-left)/LAB.run+.5));
  const room=labCellAt(x,z,.002,referenceY);
  if(room==='clubStair')return clubStairY(x);
  if(room==='hopClub')return CLUB_FLOOR;
  if(room==='southStair'){
    if(labLower(referenceY)||(lodgeOpen&&x<=SOUTH_HATCH.x1))return LAB.top-LAB.riser*
      Math.min(LAB.count,Math.max(0,(x-SOUTH_HATCH.x0)/LODGE_RUN+.38));
    return null;
  }
  if(labLower(referenceY)&&(room||labCellAt(x,z,.012)))return LAB.floor;
  return null;
}
export function labCeilingAt(x,z,referenceY=0){
  const cell=labLower(referenceY)&&labCellAt(x,z,.012,referenceY);
  if(cell==='hopClub')return CLUB_CEILING;
  if(cell==='clubStair')return clubStairY(x)+2.85;
  if((cell==='southStair'||cell==='southVest')&&Math.abs(x-SOUTH_HATCH.end)<.15&&
    z>SOUTH_HATCH.z0&&z<SOUTH_HATCH.z1)return LAB.floor+2.265;
  if(cell==='southStair')return x>=SOUTH_HATCH.x1?LAB.top-.155:Infinity;
  return cell&&cell!=='stairs'?LAB.ceiling:Infinity;
}

// Existing library boards are authored with u=-x, d=-z.
export function aroundLabOpening(u0,u1,d0,d1){
  const l=Math.max(u0,-right),r=Math.min(u1,-left),a=Math.max(d0,-front),b=Math.min(d1,-back);
  if(l>=r||a>=b)return [[u0,u1,d0,d1]];
  return [[u0,l,d0,d1],[r,u1,d0,d1],[l,r,d0,a],[l,r,b,d1]]
    .filter(([x,y,z,w])=>y-x>.0002&&w-z>.0002);
}
