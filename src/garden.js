import {BENCH_ROW, PARK_FLOOR, PERIMETER, GARDEN_GATES, distanceToPerimeter, insidePerimeter} from './world-layout.js';
import {addOrangery} from './orangery.js';
import {gardenMaterials} from './surface-detail.js';
import {BED_ARCS,atBed,addBeds,addBenches} from './garden-assets.js';
import {plantGarden} from './vegetation.js';
import {pathNetwork,gardenTerrain} from './garden-ground.js';
import {planGeometry} from './perimeter.js';

// Garden on the east side of the palace. Ground plan in metres, z points west.
export function addGarden(T, scene, world, oldGravel, finish) {
  const group = new T.Group(); group.name = 'Schlossgarten'; scene.add(group);
  const floors = [];
  let seed = 7333;
  const rand = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const range = (a,b) => a+(b-a)*rand(), tau = Math.PI*2;
  const network=pathNetwork(T),ribbon=network.add;
  ribbon([[0,-13.8],[0,-33.0]],4.9,'compact');
  ribbon([[0,-61],[0,-156],[0,-237]],4);
  ribbon([[39,-7.4],[38.8,-17],[37,-25]],3.5,'compact');
  ribbon([[-39.35,-7.5],[-38.2,-17],[-37,-25]],3.65,'compact');
  ribbon([[46.3,-15.8],[46.15,-19.8],[44.8,-25],[40.7,-28]],2.5,'compact');
  for(const gate of Object.values(GARDEN_GATES))ribbon(gate.path,2.4,'compact');
  for(const side of [-1,1]){
    const spts = a=>a.map(([x,z])=>[side*x,z]);
    ribbon(spts([[13,-55],[25,-62],[38,-73]]),2.5);
    ribbon(spts([[13,-39],[26,-32],[39,-24]]),2.5);
    ribbon(spts([[0,-82],[21,-75],[38,-73]]),2.3);
    ribbon(spts([[37,-25],[38,-73],[38,-128],[39,-196],[48,-239]]),3.7);
    ribbon(spts([[0,-133],[12,-130],[24,-126],[38,-128],[58,-140]]),3);
    ribbon(spts([[0,-211],[17,-199],[36,-185],[53,-172],[64,-151]]),2.9);
    ribbon(spts([[0,-239],[23,-243],[49,-236],[62,-215],[65,-170],[59,-121],[59,-82],[52,-61],[38,-47]]),3.0);
  }
  const ellipse=[];for(let j=0;j<=64;j++){const a=tau*j/64;ellipse.push([18.8*Math.cos(a),-47+13.45*Math.sin(a)]);}
  ribbon(ellipse,2.1,'trim');
  const {ground,gravel}=gardenMaterials(T,network.texture({
    legacy:oldGravel,walls:PERIMETER.filter(e=>e.type==='wall'),beds:BED_ARCS
  }),network.rect);
  const terrain=gardenTerrain(T,PARK_FLOOR,ground);
  group.add(...terrain.meshes);floors.push(...terrain.meshes);
  // Paved-to-gravel transition at both Schlossplatz gates and the side entry.
  for(const [x,front,wide] of [[39,1,1.75],[-39.35,1,1.87],[46.25,-4,1.18]]){
    const apron=new T.Mesh(planGeometry(T,[[x-wide,front],[x+wide,front],[x+wide,-17.025],[x-wide,-17.025]],-.017,1),gravel);
    apron.name='Weganschluss • Tordurchgang';apron.receiveShadow=true;group.add(apron);floors.push(apron);
  }
  const sites=[];
  function tree(x,z,h,species,hero,mapped=false){
    if(z>-7 || (!mapped&&x>18&&x<73&&z>-92))return;
    if(!insidePerimeter(x,z)||distanceToPerimeter(x,z)<3.5||network.edge(x,z)<1.02)return;
    if(!mapped&&Math.abs(x)<23&&z>-78)return;
    if(sites.some(p=>Math.hypot(x-p.x,z-p.z)<4.4))return;
    sites.push({x,z,h,species,hero});
  }
  // Keep the formal parterre and central sightline open; open lawn between
  // irregular groups is as important as the planting itself.
  tree(-27.6,-68.3,17.5,'oak','sweep');
  tree(27.5,-96.5,16.7,'lime','spire');
  tree(-28.0,-118.0,15.8,'oak','fork');
  // Selected OSM tree anchors on the near parterre, fit to the compressed
  // plan. Heights/species are illustrative; keep the axis itself clear.
  for(const [x,z,h] of [[-16,-20.4,8.2],[10.4,-22.2,8.5],[-32.1,-30,11.4],
    [27.9,-57.8,10.0],[-31.4,-55.1,9.6],[-46.3,-54.8,12.8],[-61.2,-46.1,11.7],[-13.6,-73,10.1]])
    tree(x,z,h,'lime',null,true);
  for(const side of [-1,1]){
    for(let i=0;i<15;i++)tree(side*(43.4+range(-2.9,3.4)), -28-i*14.7+range(-1.7,1.7),range(11.5,16.6),i%4?'lime':'oak');
    for(let i=0;i<13;i++)tree(side*(62.1+range(-6.2,6.7)), -48-i*15.7+range(-5.8,5.8),range(13.2,20.1),i%3?'oak':'lime');
    for(let i=0;i<10;i++)tree(side*(25+range(-7.0,7.5)), -104-i*14.1+range(-5.7,5.7),range(10.1,18.5),i%4?'oak':'lime');
  }
  for(let i=0;i<10;i++)tree(-59+i*12.6+range(-3,3),-245+range(-6,5),range(12.0,17.1),i%3?'lime':'oak');
  // Faint, planted silhouettes beyond the fence, never another playable park.
  for(const e of PERIMETER){
    if(!['wall','iron','parkGate'].includes(e.type))continue;
    const dx=e.b[0]-e.a[0],dz=e.b[1]-e.a[1],len=Math.hypot(dx,dz);
    const n=Math.floor(len/11.8);
    for(let i=0;i<n;i++){
      const t=(i+.5)/n,dist=range(8,15),x=e.a[0]+dx*t+dz/len*dist,z=e.a[1]+dz*t-dx/len*dist;
      if(!insidePerimeter(x,z))sites.push({x,z,h:range(7.4,13.7),species:i%3?'oak':'lime',backdrop:true});
    }
  }
  const plants=plantGarden(T,group,world,sites,(x,z)=>{
    if(z>-17.35||!insidePerimeter(x,z)||x>43&&x<69&&z>-91)return 0;
    if(Math.abs(x)<23&&z>-72||atBed(x,z,.25))return 0;
    if(BENCH_ROW.depths.some(d=>Math.abs(z-d)<1.18)&&Math.abs(Math.abs(x)-BENCH_ROW.x)<1)return 0;
    const {edge,style}=network.sample(x,z);
    if(edge<(style==='trim'?.12:.25))return 0;
    const patch=.5+.5*Math.sin(x*.53+Math.cos(z*.37)*1.5)*Math.cos(z*.39);
    const wall=z<-247||Math.abs(x)>68?distanceToPerimeter(x,z):8;
    const sheltered=sites.some(p=>!p.backdrop&&Math.abs(x-p.x)<4.8&&Math.abs(z-p.z)<4.8);
    return (edge<1.17?(style==='compact'?.09:style==='trim'?.35:.26)+patch*.25:.038+patch*.105)
       *(wall<1.4?.65:1)*(sheltered?1.22:1);
  },terrain.height);
  const beds=addBeds(T,group,terrain.height);
  addBenches(T,group,world,terrain.height);
  addOrangery(T,group,world,finish);
  return {
    floors, heightAt:(x,z)=>z<=-17&&insidePerimeter(x,z)?terrain.height(x,z):null,
    update:position=>{plants(position);beds(position)}
  };
}
