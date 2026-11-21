import {GATES,GARDEN_GATES} from './world-layout.js';

// Photo-aligned in the game's compressed coordinates (+X south, -Z east).
// Fixed landmarks and entrances keep their existing gameplay positions.
export const BASIN={x:0,z:-47,rx:18.75,rz:13.73};
export const SCHREBER=[-23.5,-103.7],DELPHIN=[-8.1,-207.25];
export const APPROACH={
  palaceSouth:{gate:GATES.palaceSouth,points:[[39.35,-5.62],[39.35,-8.56],[38.76,-13.15],[38.05,-17],[37,-25]],width:3.56},
  palaceNorth:{gate:GATES.palaceNorth,points:[[-38.95,-5.62],[-38.95,-8.50],[-38.55,-13.15],[-37.98,-17],[-36.87,-25]],width:3.37},
  wasserturm:{gate:GATES.wasserturm,points:[[-46.30,-13.97],[-46.30,-16.34],[-46.02,-18.58],[-44.72,-24.4],[-40.7,-28.2]],width:2.64}
};
export const FRONT_SPLAY={
  near:[[9.6,-36.2],[15.81,-35.5],[23.89,-30.6],[32.05,-25.4],[37,-25]],
  far:[[11.82,-57.95],[22.5,-61.43],[31,-69.30],[39.8,-76.42]],
};

export function layParkPaths(network){
  const add=network.add;
  const axis=add([[0,-13.0],[0,-19.5],[.08,-27.2],[0,-33.90]],4.63,'compact');
  const ring=add(Array.from({length:64},(_,i)=>{
    const a=(i%64)*Math.PI/32;return [BASIN.x+BASIN.rx*Math.cos(a),BASIN.z+BASIN.rz*Math.sin(a)];
  }),2.19,'trim',true);
  const edges=[];
  for(const side of [-1,1]){
    const sign=points=>points.map(([x,z])=>[x*side,z]);
    const near=add(sign(FRONT_SPLAY.near),2.48,'compact');
    const far=add(sign(FRONT_SPLAY.far),2.63);
    edges.push({path:near,side:side,start:4.5,end:4.7,width:.88,order:side<0?0:2});
    edges.push({path:far,side:-side,start:4.2,end:4.7,width:.91,order:side<0?2:1});
    add(sign([[0,-80.8],[13.9,-76.66],[26.44,-74.10],[39.8,-76.42]]),2.31);
    add(sign([[36.87,-25],[35.35,-37.5],[35.60,-53.77],[37.46,-63.9],[39.8,-76.42]]),3.02);
  }
  const approaches=Object.values(APPROACH).map(a=>({...a,path:add(a.points,a.width,'compact')}));
  approaches.push({gate:{name:'Schloss · Gartenportal',a:[0,-12.72]},width:axis.width,path:axis});
  for(const gate of Object.values(GARDEN_GATES))add(gate.path,2.40,'compact');
  // Orangerie: straight forecourt/lawn edge, then a curved link to the inner
  // ring. The edge keeps the in-game puddle and weather station unobstructed.
  const orange=add([[-55.85,-26.5],[-48.14,-26.15],[-41.02,-26.4],[-37.57,-26.9]],2.22,'compact');
  add([[-49.06,-25.9],[-46.10,-31.5],[-43.05,-40.15],[-43.46,-50.58],[-42.53,-58.69],[-47.65,-69.03],[-51.73,-79.08]],2.33);
  edges.push({path:orange,side:1,start:1.10,end:1.33,width:.69,order:2});
  add([[0,-60.35],[.03,-75.3],[-.56,-87.2],[-1.5,-106.8],[-.85,-123.5],[-2.8,-141.2],[-5.98,-157.1]],3.37);
  add([[-39.8,-76.42],[-49.1,-88.78],[-52.3,-109.1],[-52.8,-139.7],[-54.4,-160.7],[-56.87,-198],[-57.9,-237.7]],2.91);
  add([[39.8,-76.42],[44,-107],[43,-145],[42,-166],[41,-198],[40,-220],[39,-239]],3.01);
  add([[61.8,-80],[64.5,-95],[65,-117],[63,-144]],2.51);
  add([[39.22,-64.20],[52.2,-66.48],[61.8,-80],[60,-82]],2.55);
  add([[37.1,-40],[47.8,-42],[57.8,-45.3],[59.6,-51.8],[58,-60],[54,-66.5]],2.6,'compact');
  add([[40.8,-81],[30.33,-101.5],[20.02,-116.90],[15.20,-121.92],[5.83,-141.1],[-4.5,-158]],2.67);
  add([[62,-143],[43,-145],[30,-146],[14,-155],[-.3,-161]],2.64);
  add([[-55,-164],[-41,-160],[-29,-158],[-11,-159]],2.48);
  add([[-4,-170],[-1,-181],[7,-195],[19,-216],[39,-239]],2.77);
  add([[-10,-169],[-15,-181],[-22,-193],[-33,-212],[-47,-230],[-58,-241]],2.62);
  add([[-56,-197],[-42,-199],[-29,-204],[-19,-208]],2.39);
  add([[-1,-212],[18,-216],[39,-220]],2.51);
  add([[-58,-241],[-44,-240],[-30,-240],[-11,-242],[12.3,-240],[27,-241],[39,-239]],2.93);
  add([[-11,-161],[-8,-157.8],[-2.8,-158.4],[-.7,-161.8],[-1.8,-168],[-5.7,-170.5],[-10,-168.6]],2.17,'trim',true);
  add([[-19,-208],[-17,-212],[-9,-214],[-2,-213],[1,-208],[-2,-203],[-10,-202]],2.17,'trim',true);
  // Woodland crosspaths connect the groves, instead of additional straight
  // axes. A small clearing around the equestrian monument stays open.
  add([[-52.3,-109.1],[-39.2,-113.65],[-26.15,-107.41],[-14.65,-105.45],[-1.52,-106.8]],2.32);
  add([[-51.64,-102.6],[-60.7,-111.0],[-67.1,-121.8],[-70.7,-138.0],
    [-69.2,-151.4],[-67.9,-163.94],[-69.25,-182.6],[-66.24,-191.4],[-55.9,-197.2]],2.28);
  add([[-25.52,-107.13],[-24.16,-105.24],SCHREBER],1.55,'trim');
  add([[-52.8,-139.7],[-37.65,-144.77],[-21.52,-146.51],[-10.62,-142.67],[-2.8,-141.2]],2.43);
  add([[16.05,-121.9],[25.50,-126.8],[33.45,-129.3],[43.4,-130.2]],2.31);
  add([[-54.4,-160.7],[-62.92,-161.95]],2.12);
  add([[-56.0,-185.1],[-43.0,-187],[-34.36,-181.94],[-23.14,-179.3],[-15,-181]],2.35);
  add([[3.48,-188.64],[15.8,-185.5],[27.48,-189.2],[41.55,-187]],2.34);
  return {axis,ring,edges,approaches};
}

export function woodlandDensity(x,z){
  const waves=Math.sin(x*.083-z*.057)*.14+Math.sin(x*.139+z*.093)*.12;
  const glades=[[-6.15,-164.1,12.1],[14.7,-119.4,8.4],[.1,-78.7,12.8],[-28,-82,10.2],
    [56,-106,9.9],[...DELPHIN,10.1],[-8.0,-244.26,7.7]];
  let clear=0;
  for(const [a,b,r] of glades)clear=Math.max(clear,Math.max(0,1-Math.hypot(x-a,z-b)/r));
  return Math.max(0,Math.min(.97,.74+waves-clear*.94));
}
