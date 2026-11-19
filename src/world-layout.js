import {HALL,WINGS} from './palace-openings.js';
import {labLower} from './lab-layout.js';
import {FRIEDRICH} from './palace-detail.js';

// Y up; +Z toward Schlossplatz (west), +X toward Universitätsstraße (south).
export const SPAWN = {x: 8, z: 43, yaw: .19, pitch: .12};
// Centres and yaw; the visual bench, its contact footprint and plant mask agree.
export const BENCH_SITES = [
  [-36,-34,-1.57],[36,-34,1.57],[-39.7,-59,-1.42],[38.3,-59,1.40],
  [-48.4,-99,-1.58],[46.3,-96,1.52],[67.6,-111,1.52],
  [-51.5,-135,-1.59],[40.1,-132,-1.60],[-31,-161.3,.19],
  [44.1,-170,1.58],[-53.1,-188,-1.55],[-29,-207.2,.34],
  [38.6,-214,-1.62],[-29,-237.5,-3.04],[24,-238,-3.11]
];
export const PLAYER = {eye: 1.67, radius: .30, speed: 2.85, run: 6.35, maxStep: .32};

// Counterclockwise in X/Z. The type at each node describes the outgoing edge.
// City uses closed building footprints and two service entrances, never a city wall.
const CITY = [
  [73,-17,'annex'], [59,-5,'annex'], [50,11,'house'], [50,42,'house'],
  [62,42,'house'], [69,51,'streetGate'], [69,58,'house'], [59,66,'house'],
  [54,78,'house'], [33,80,'house'], [12,81,'house'], [-8,81,'house'],
  [-29,79,'house'], [-52,78,'house'], [-68,70,'streetGate'],
  [-68,63,'house'], [-61,53,'house'], [-51,45,'house'], [-51,13,'house'],
  [-58,-1,'annex'], [-73,-17]
];
// Hero frontages, in order along the city half of the existing contour.
// These are types and material families, not IDs of real historic buildings.
export const CITY_FRONTAGES = {
  2:['stone','plaster'],3:['stone','shop','plaster'],4:['corner'],
  6:['corner'],7:['plaster','stone'],8:['corner','shop'],9:['stone','plaster','shop'],
  10:['shop','stone'],11:['plaster','shop','corner'],12:['stone','plaster'],
  13:['corner','stone'],15:['corner'],16:['plaster','shop'],
  17:['corner','stone','plaster'],18:['shop','plaster','stone']
};
const PARK = [
  [-73,-17,'iron'], [-75,-24,'iron'], [-75,-50,'iron'], [-74,-85,'wall'],
  [-76,-114,'iron'], [-76,-166,'parkGate','botanical'], [-76,-171,'iron'],
  [-75,-193,'iron'], [-74,-226,'wall'], [-66,-247,'iron'], [-51,-251,'iron'],
  [-19,-253,'parkGate','hospitalNorth'], [-12.7,-253.4,'iron'],
  [18,-255.5,'iron'], [43,-257,'parkGate','hospitalSouth'], [49,-256.4,'iron'],
  [52.5,-256,'wall'], [52.5,-225,'wall'], [73,-222,'wall'], [73,-185,'iron'],
  [75,-149,'parkGate','universityEast'], [75,-144,'wall'],
  [75,-138.8,'buildingEdge'], [75,-87.0,'iron'],
  [74,-78,'parkGate','universityWest'], [74,-73,'wall'], [74,-47,'wall'], [73,-17]
];
// Reference gates in matched local coordinates, not UTM. The model compresses
// the deep east park; the short range at the Schloss is kept at facade scale.
export const GATES = {
  palaceNorth: {a:[-41.4,-7.4],b:[-36.5,-7.4],source:5489797596,name:'Schlossplatz · Nord'},
  palaceSouth: {a:[36.7,-7.5],b:[42,-7.5],source:5489797603,name:'Schlossplatz · Süd'},
  // Side entry from the Wasserturmstraße, not a second gate on the south route.
  wasserturm: {a:[-48.4,-15.8],b:[-44.2,-15.8],source:5469958200,name:'Wasserturmseite · Orangerie'},
};
export const GARDEN_GATES = {
  universityWest:{source:1326052106,name:'Universitätsstraße · West',path:[[60,-82],[67,-78],[73.8,-75.5]]},
  universityEast:{source:1326052095,name:'Universitätsstraße · Ost',path:[[57,-145],[67,-146.5],[74.8,-146.5]]},
  hospitalSouth:{source:1326052100,name:'Krankenhausstraße · Süd',path:[[39,-230],[44,-244],[46,-256.5]]},
  hospitalNorth:{source:2148994463,name:'Krankenhausstraße · Nord',path:[[-11,-228],[-14,-243],[-15.85,-253.1]]},
  botanical:{source:1326052108,name:'Botanischer Garten',path:[[-62,-161],[-68,-164],[-75.7,-168.5]]},
};
// Lamping is a composed evening scene, not an inventory of the real site.
// Pole colliders and the geometry/light centres all derive from these points.
export const LAMP_SITES = [
  {type:'wall',x:-3.35,z:13.26,y:3.24}, {type:'wall',x:3.35,z:13.26,y:3.24},
  {x:16,z:47.8}, {x:-20.5,z:51.1}, {x:58,z:48.2}, {x:-58.4,z:55.8},
  {x:42.8,z:-5.1}, {x:-42.5,z:-10.8}, {x:-41.7,z:-29.2},
  {x:16.6,z:-62.8}, {x:-17.2,z:-60.4}, {x:-3.1,z:-87.0},
  {x:3.0,z:-132.9}, {x:41.2,z:-131.0}, {x:-42.8,z:-158.8},
  {x:-3.3,z:-188.6}, {x:3.2,z:-231.5}
];
const coords = nodes => nodes.map(([x,z])=>[x,z]);
export const CITY_FLOOR = coords(CITY);
export const PARK_FLOOR = coords(PARK);
const loop = [...CITY.slice(0,-1), ...PARK.slice(0,-1)];
export const PERIMETER = loop.map(([x,z,type,gate],i)=>{
  const [ex,ez]=loop[(i+1)%loop.length], prev=loop[(i+loop.length-1)%loop.length][2];
  return {a:[x,z],b:[ex,ez],type,prev,id:i,gate};
});
const xs = loop.map(p=>p[0]), zs=loop.map(p=>p[1]);
// Only a fail-safe beyond the modeled perimeter. In normal play the player
// contacts real geometry; the polygon also rejects any position outside it.
export const BOUNDS = {minX:Math.min(...xs)-4,maxX:Math.max(...xs)+4,
  minZ:Math.min(...zs)-4,maxZ:Math.max(...zs)+4};

export function insidePerimeter(x,z) {
  let inside=false;
  for(const {a:[ax,az],b:[bx,bz]} of PERIMETER){
    if((az>z)!==(bz>z) && x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
  }
  return inside;
}

export function distanceToPerimeter(x,z) {
  let min=Infinity;
  for(const {a:[ax,az],b:[bx,bz]} of PERIMETER){
    const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    min=Math.min(min,Math.hypot(x-ax-t*dx,z-az-t*dz));
  }
  return min;
}

export function addFixedColliders(world) {
  // The center is reserved for the passage. Moving door thresholds are
  // installed with the same coordinates as their facade meshes.
  const surface=p=>!labLower(p.y);
  for(const [width,z0,z1,inner] of [[33.9,-10.35,10.35,WINGS.outer],[7.35,10,13.02,HALL.half],[14.5,-12.53,-10,HALL.half]]){
    world.box(-width,z0,-inner,z1,surface);world.box(inner,z0,width,z1,surface);
  }
  for(const [a,b] of [[-10.35,-WINGS.z],[WINGS.z,10.35]]){
    world.box(-WINGS.outer,a,-HALL.half,b,surface);world.box(HALL.half,a,WINGS.outer,b,surface);
  }
  const {halfX,halfZ,z}=FRIEDRICH;
  world.box(-halfX,z-halfZ,halfX,z+halfZ);

  // Rounded basin: a 9.82 m radius around a 9.5 m central span.
  const basin = Array.from({length: 64}, (_, i) => {
    const a = i * Math.PI / 32, x = Math.cos(a);
    return [Math.sign(x) * 4.75 + x * 9.82, -47 + Math.sin(a) * 9.82];
  });
  world.polygon(basin);
}
