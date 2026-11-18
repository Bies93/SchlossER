// Existing model coordinates: metres, Y up, positive Z toward Schlossplatz.
export const SPAWN = {x: 8, z: 43, yaw: .19, pitch: .12};
export const BENCH_ROW = {x: 36, depths: [-36,-57,-93,-122,-160,-193]};
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
const PARK = [
  [-73,-17,'wall'], [-74,-47,'wall'], [-74,-73,'parkGate','universityWest'], [-74,-78,'iron'],
  [-76,-115,'wall'], [-75,-144,'parkGate','universityEast'], [-75,-149,'iron'],
  [-73,-185,'wall'], [-73,-222,'wall'], [-67,-247,'wall'],
  [-54,-256,'iron'], [-49,-256.4,'parkGate','hospitalSouth'], [-43,-257,'iron'],
  [-1,-257,'parkGate','hospitalNorth'], [5.3,-257,'iron'],
  [22,-256,'iron'], [51,-255,'iron'], [66,-249,'wall'], [74,-226,'wall'],
  [75,-193,'iron'], [76,-171,'parkGate','botanical'], [76,-166,'iron'],
  [76,-114,'iron'], [74,-85,'wall'], [75,-50,'iron'], [75,-24,'iron'], [73,-17]
];
// Reference gates in matched local coordinates, not UTM. The model compresses
// the deep east park; the short range at the Schloss is kept at facade scale.
export const GATES = {
  palaceNorth: {a:[36.5,-7.4],b:[41.4,-7.4],source:5489797596,name:'Schlossplatz · Nord'},
  palaceSouth: {a:[-42,-7.5],b:[-36.7,-7.5],source:5489797603,name:'Schlossplatz · Süd'},
  wasserturm: {a:[44.2,-15.8],b:[48.4,-15.8],source:5469958200,name:'Wasserturmseite · Orangerie'},
};
export const GARDEN_GATES = {
  universityWest:{source:1326052106,name:'Universitätsstraße · West',path:[[-60,-82],[-67,-78],[-73.8,-75.5]]},
  universityEast:{source:1326052095,name:'Universitätsstraße · Ost',path:[[-59,-138],[-66,-145],[-74.8,-146.5]]},
  hospitalSouth:{source:1326052100,name:'Krankenhausstraße · Süd',path:[[-40,-240],[-46,-249],[-46,-256]]},
  hospitalNorth:{source:2148994463,name:'Krankenhausstraße · Nord',path:[[0,-237],[1.0,-250],[2.15,-256.7]]},
  botanical:{source:1326052108,name:'Botanischer Garten',path:[[62,-161],[68,-164],[75.7,-168.5]]},
};
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
  world.box(-33.9, -10.35, 33.9, 10.35); // main palace volume
  world.box(-7.35, 10, 7.35, 13.1);      // west portal/risalit
  world.box(-14.5, -13, 14.5, -10);      // projecting garden facade
  world.box(-1.8, 29.35, 1.8, 32.65);   // Friedrich monument granite base

  // Rounded basin: a 9.82 m radius around a 9.5 m central span.
  const basin = Array.from({length: 64}, (_, i) => {
    const a = i * Math.PI / 32, x = Math.cos(a);
    return [Math.sign(x) * 4.75 + x * 9.82, -47 + Math.sin(a) * 9.82];
  });
  world.polygon(basin);
}
