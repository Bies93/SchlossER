import {BENCH_SITES, PARK_FLOOR, PERIMETER, GARDEN_GATES, distanceToPerimeter, insidePerimeter} from './world-layout.js';
import {addOrangery} from './orangery.js';
import {gardenMaterials} from './surface-detail.js';
import {addBenches} from './garden-assets.js';
import {BED_ARCS,atBed,addBeds} from './parterre.js';
import {plantGarden} from './vegetation.js';
import {pathNetwork,gardenTerrain} from './garden-ground.js';
import {planGeometry} from './perimeter.js';
import {addParkArchitecture,parkFacadeClearance} from './park-architecture.js';
import {addParkMonuments,monumentClear} from './park-monuments.js';
import {WC_CUT} from './park-stair.js';
import {CHAPTER_CUT,CHAPTER_BAY_PATH,chapterContains} from './chapter-layout.js';
import {UPPER_ENTRY} from './palace-openings.js';

// Garden on the east side of the palace. Ground plan in metres, z points west.
export function addGarden(T, scene, world, oldGravel, finish) {
  const group = new T.Group(); group.name = 'Schlossgarten'; scene.add(group);
  const floors = [];
  let seed = 7333;
  const rand = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const range = (a,b) => a+(b-a)*rand(), tau = Math.PI*2;
  const network=pathNetwork(T),ribbon=network.add;
  ribbon([[0,-13.8],[0,-33.0]],4.9,'compact');
  ribbon([[0,-61],[-.3,-83],[-1.2,-109],[-2.4,-133],[-5.7,-156]],3.8);
  ribbon([[39.35,-7.5],[38.2,-17],[37,-25]],3.65,'compact');
  ribbon([[-39,-7.4],[-38.8,-17],[-37,-25]],3.5,'compact');
  ribbon([[-46.3,-15.8],[-46.15,-19.8],[-44.8,-25],[-40.7,-28]],2.5,'compact');
  for(const gate of Object.values(GARDEN_GATES))ribbon(gate.path,2.4,'compact');
  for(const side of [-1,1]){
    const spts = a=>a.map(([x,z])=>[side*x,z]);
    ribbon(spts([[13,-55],[25,-62],[38,-73]]),2.5);
    ribbon(spts([[13,-39],[26,-32],[39,-24]]),2.5);
    ribbon(spts([[0,-82],[21,-75],[38,-73]]),2.3);
    ribbon(spts([[37,-25],[36,-49],[41,-79]]),3.35);
  }
  // Traced from the present-day path pattern, fitted to the scene scale:
  // flanking lanes, the small monument loop and a wider woodland loop.
  ribbon([[-41,-79],[-51,-88],[-54,-142],[-55,-164],[-56,-197],[-58,-241]],3.0);
  ribbon([[41,-79],[44,-107],[43,-145],[42,-166],[41,-198],[40,-220],[39,-239]],3.25);
  ribbon([[62,-79],[65,-96],[65,-117],[63,-144]],2.7);
  ribbon([[-40,-63],[-47,-69],[-51,-79]],2.8);
  ribbon([[42,-63],[53,-66],[62,-79],[60,-82]],2.7);
  ribbon([[37.1,-40],[47.8,-42],[57.8,-45.3],[59.6,-51.8],[58,-60],[54,-66.5]],2.6,'compact');
  // Bench bay runs parallel to the main path and blends into the verge.
  ribbon(CHAPTER_BAY_PATH,1.66,'compact');
  ribbon([[41,-81],[31,-101],[21,-117],[6,-141],[-4,-157]],2.85);
  ribbon([[62,-143],[43,-145],[30,-146],[14,-155],[-.3,-161]],2.73);
  ribbon([[-55,-164],[-41,-160],[-29,-158],[-11,-159]],2.48);
  ribbon([[-4,-170],[-1,-181],[7,-195],[19,-216],[39,-239]],2.85);
  ribbon([[-10,-169],[-15,-181],[-22,-193],[-33,-212],[-47,-230],[-58,-241]],2.69);
  ribbon([[-56,-197],[-42,-199],[-29,-204],[-19,-208]],2.43);
  ribbon([[-1,-212],[18,-216],[39,-220]],2.67);
  ribbon([[-58,-241],[-44,-240],[-28,-240],[-10,-243],[13,-240],[27,-241],[39,-239]],3.21);
  ribbon([[-11,-161],[-8,-157.8],[-2.8,-158.4],[-.7,-161.8],[-1.8,-168],[-5.7,-170.5],[-10,-168.6],[-11,-161]],2.18,'trim');
  ribbon([[-19,-208],[-17,-212],[-9,-214],[-2,-212],[1,-207],[-2,-203],[-10,-201],[-17,-204],[-19,-208]],2.33);
  ribbon([[21,-117],[19,-121],[15.6,-122]],2.25);
  const ellipse=[];for(let j=0;j<=64;j++){const a=tau*j/64;ellipse.push([18.8*Math.cos(a),-47+13.45*Math.sin(a)]);}
  ribbon(ellipse,2.1,'trim');
  const {ground,gravel}=gardenMaterials(T,network.texture({
    legacy:oldGravel,walls:PERIMETER.filter(e=>e.type==='wall'),beds:BED_ARCS
  }),network.rect);
  const [xa,xb,za,zb]=CHAPTER_CUT,opening=[[xa,za],[xb,za],[xb,zb],[xa,zb]];
  const terrain=gardenTerrain(T,PARK_FLOOR,ground,1.78,[opening]);
  const benchCover=gardenTerrain(T,opening,ground).meshes;
  group.add(...terrain.meshes);floors.push(...terrain.meshes);
  // Paved-to-gravel transition at both Schlossplatz gates and the side entry.
  for(const [x,front,wide] of [[39.35,1,1.87],[-39,1,1.75],[-46.25,-4,1.18]]){
    const apron=new T.Mesh(planGeometry(T,[[x-wide,front],[x+wide,front],[x+wide,-17.025],[x-wide,-17.025]],-.017,1),gravel);
    apron.name='Weganschluss • Tordurchgang';apron.receiveShadow=true;group.add(apron);floors.push(apron);
  }
  const wcSide=WC_CUT.left,wcBack=WC_CUT.back,join=39.35+1.87;
  const wcLink=new T.Mesh(planGeometry(T,[[join,wcBack],[wcSide,wcBack],
    [wcSide,wcBack+2.055],[join,wcBack+2.055]],-.017,1),gravel);
  wcLink.name='Seitlicher Weg zum WC';wcLink.receiveShadow=true;group.add(wcLink);floors.push(wcLink);
  const sites=[];
  function tree(x,z,h,species,hero,mapped=false){
    if(z>-18||(!mapped&&x<-21&&z>-88)||parkFacadeClearance(x,z,2)||monumentClear(x,z,1.3))return;
    if(!insidePerimeter(x,z)||distanceToPerimeter(x,z)<3.5||network.edge(x,z)<1.25)return;
    if(!mapped&&Math.abs(x)<23&&z>-78)return;
    if(sites.some(p=>Math.hypot(x-p.x,z-p.z)<4.4))return;
    sites.push({x,z,h,species,hero});
  }
  // Keep the formal parterre and central sightline open; open lawn between
  // irregular groups is as important as the planting itself.
  tree(-27.6,-68.3,17.5,'oak','sweep');
  tree(27.5,-96.5,16.7,'lime','spire');
  tree(-28.0,-118.0,15.8,'oak','fork');
  tree(-31.4,-55.1,12.6,'oak','bank',true);
  tree(-16,-20.4,10.9,'lime','court',true);
  // Selected OSM tree anchors on the near parterre, fit to the compressed
  // plan. Heights/species are illustrative; keep the axis itself clear.
  for(const [x,z,h] of [[-16,-20.4,8.2],[UPPER_ENTRY.treeX,UPPER_ENTRY.treeZ,8.5],[-32.1,-30,11.4],
    [27.9,-57.8,10.0],[-31.4,-55.1,9.6],[-46.3,-54.8,12.8],[-61.2,-46.1,11.7],[-13.6,-73,10.1]])
    tree(x,z,h,'lime',null,true);
  // Uneven, view-framing groves. Important gaps stay in front of the
  // Kollegienhaus, at the gates, and along the path to the old axis.
  const groves=[
    [-60,-96,8,10,5],[-39,-109,13,15,7],[28,-94,8,10,4],
    [-63,-126,7,11,4],[-38,-139,9,11,6],[26,-130,10,8,5],
    [-65,-180,8,12,6],[-36,-180,12,17,9],[20,-173,10,14,6],
    [57,-175,9,21,9],[-63,-212,11,17,8],[-7,-207,6,3,3],
    [25,-205,12,10,6],[58,-204,8,10,5],[-28,-227,10,8,7],
    [-60,-248,9,4,5],[9,-246,13,6,6],[31,-236,6,7,4]
  ];
  for(const [x,z,rx,rz,n] of groves)for(let i=0;i<n;i++){
    const a=i*2.39996+range(-.32,.32),r=Math.sqrt((i+.62)/n);
    tree(x+rx*r*Math.cos(a),z+rz*r*Math.sin(a),range(i%5?10.4:16.1,i%5?16.9:20.3),i%3?'oak':'lime');
  }
  tree(-20.8,-148.5,17.2,'oak','sweep');
  tree(24.5,-182.6,16.3,'lime','spire');
  tree(-36.5,-214.8,17.4,'oak','fork');
  // Faint, planted silhouettes beyond the fence, never another playable park.
  for(const e of PERIMETER){
    if(!['wall','iron','parkGate'].includes(e.type))continue;
    const dx=e.b[0]-e.a[0],dz=e.b[1]-e.a[1],len=Math.hypot(dx,dz);
    const n=Math.floor(len/11.8);
    for(let i=0;i<n;i++){
      const t=(i+.5)/n,dist=range(8,15),x=e.a[0]+dx*t+dz/len*dist,z=e.a[1]+dz*t-dx/len*dist;
      if(!insidePerimeter(x,z)&&!parkFacadeClearance(x,z,4.5))
        sites.push({x,z,h:range(7.4,13.7),species:i%3?'oak':'lime',backdrop:true});
    }
  }
  const shrubs=[];
  for(const [x,z,spread,n] of [[-62,-131,7,5],[-64,-182,6,5],[-44,-180,6,4],[-64,-212,8,7],
    [-44,-244,4.5,4],[-25,-224,5,4],[9,-246,6,4],[31,-231,5.5,4],[49,-213,5.5,4],
    [64,-190,7,5],[11,-124,3.8,4],[56,-58,3.6,3]]){
    for(let j=0;j<n;j++){
      const a=j*2.399,norm=spread*Math.sqrt((j+.4)/n),X=x+Math.cos(a)*norm,Z=z+Math.sin(a)*norm;
      if(network.edge(X,Z)<1.58||!insidePerimeter(X,Z)||distanceToPerimeter(X,Z)<1.65
        ||parkFacadeClearance(X,Z,1.4)||monumentClear(X,Z,.8))continue;
      shrubs.push([X,Z,range(.71,1.23)]);
    }
  }
  const plants=plantGarden(T,group,world,sites,(x,z)=>{
    if(z>-17.35||!insidePerimeter(x,z)||x<-43&&z>-83||parkFacadeClearance(x,z,.5))return 0;
    if(atBed(x,z,.20)||monumentClear(x,z,.28)||Math.hypot(Math.max(0,Math.abs(x)-4.75),z+47)<10.05)return 0;
    if(chapterContains(CHAPTER_CUT,x,z,.48)||BENCH_SITES.some(([a,b])=>Math.abs(x-a)<1.14&&Math.abs(z-b)<1.14))return 0;
    const {edge,style}=network.sample(x,z);
    if(edge<(style==='trim'?.12:.25))return 0;
    const patch=.5+.5*Math.sin(x*.53+Math.cos(z*.37)*1.5)*Math.cos(z*.39);
    const wall=z<-247||Math.abs(x)>68?distanceToPerimeter(x,z):8;
    const sheltered=sites.some(p=>!p.backdrop&&Math.abs(x-p.x)<4.8&&Math.abs(z-p.z)<4.8);
    const formal=Math.abs(x)<23&&z>-72,verge=edge<1.65;
    return (verge?(style==='compact'?.23:style==='trim'?.62:.45)+patch*.19:formal?.18+patch*.28:.10+patch*.24)
       *(wall<1.4?.65:1)*(sheltered?1.22:1);
  },terrain.height,shrubs);
  const beds=addBeds(T,group,terrain.height);
  const bench=addBenches(T,group,world,terrain.height);
  addOrangery(T,group,world,finish);
  addParkArchitecture(T,group,world,finish);
  addParkMonuments(T,group,world,terrain.height,finish);
  return {
    floors,bench,benchCover,upperKnot:plants.upperKnot, heightAt:(x,z)=>z<=-17&&insidePerimeter(x,z)?terrain.height(x,z):null,
    surfaceAt:(x,z)=>z<=-17&&insidePerimeter(x,z)?(network.edge(x,z)<.17?'gravel':'lawn'):null,
    update:(position,time)=>{plants(position,time);beds(position)}
  };
}
