import {BENCH_SITES, LAMP_SITES, PARK_FLOOR, PERIMETER, distanceToPerimeter, insidePerimeter} from './world-layout.js';
import {addOrangery} from './orangery.js';
import {gardenMaterials} from './surface-detail.js';
import {addBenches} from './garden-assets.js';
import {planBeds,addBeds} from './parterre.js';
import {plantGarden} from './vegetation.js';
import {pathNetwork,gardenTerrain} from './garden-ground.js';
import {planGeometry} from './perimeter.js';
import {addParkArchitecture,parkFacadeClearance} from './park-architecture.js';
import {addParkMonuments,monumentClear} from './park-monuments.js';
import {WC_CUT} from './park-stair.js';
import {CHAPTER_CUT,CHAPTER_BAY_PATH,chapterContains} from './chapter-layout.js';
import {UPPER_ENTRY} from './palace-openings.js';
import {BERG_POOL,WEATHER_ZERO} from './berg-layout.js';
import {ORANGERY_CENTER,orangeryWing,ORANGERY_PAVILION_X} from './orangery-plan.js';
import {layParkPaths,woodlandDensity} from './park-plan.js';
import {addGateApproaches} from './garden-approach.js';
import {addPathVerge} from './path-verge.js';
import {addParkFestival} from './park-festival.js';
import {festivalClear} from './festival-layout.js';
import {greyLaneClear,GREY_SITE} from './grey-plan.js';

// Garden on the east side of the palace. Ground plan in metres, east is -Z.
export function addGarden(T, scene, world, finish) {
  const group = new T.Group(); group.name = 'Schlossgarten'; scene.add(group);
  const floors = [];
  let seed = 7333;
  const rand = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const range = (a,b) => a+(b-a)*rand();
  const network=pathNetwork(T),layout=layParkPaths(network);
  network.add(CHAPTER_BAY_PATH,1.66,'compact');
  const sites=[];
  const orangeOutline=Array.from({length:8},(_,i)=>orangeryWing(-1,i/7));
  function orangeFront(z){
    const d=Math.abs(z-ORANGERY_CENTER);
    if(d<=6)return -59.10;
    for(let i=1;i<orangeOutline.length;i++){
      const [x,Z]=orangeOutline[i],D=ORANGERY_CENTER-Z;
      if(d<=D){
        const [a,A]=orangeOutline[i-1],lo=ORANGERY_CENTER-A;
        return a+(x-a)*(d-lo)/(D-lo);
      }
    }
    return d<36.22?ORANGERY_PAVILION_X:-Infinity;
  }
  const noBergProps=(x,z,pad=0)=>Math.hypot(x-BERG_POOL.x,z-BERG_POOL.z)<3.2+pad||
    Math.hypot(x-WEATHER_ZERO.x,z-WEATHER_ZERO.z)<1.0+pad;
  const beds=planBeds(layout,network,(x,z)=>!noBergProps(x,z,1)&&insidePerimeter(x,z)&&!parkFacadeClearance(x,z,1.03)&&
    Math.hypot(Math.max(0,Math.abs(x)-4.75),z+47)>10.40);
  function tree(x,z,h,species,hero,mapped=false,infill=false,tone){
    if(noBergProps(x,z,1.1)||festivalClear(x,z,3.7)||greyLaneClear(x,z,1.5))return;
    if(z>-18||(!mapped&&x<-21&&z>-88)||parkFacadeClearance(x,z,2)||monumentClear(x,z,1.3))return;
    if(!insidePerimeter(x,z)||distanceToPerimeter(x,z)<(infill?1.78:3.50)||network.edge(x,z)<1.23||beds.atBed(x,z,.25))return;
    if(!mapped&&Math.abs(x)<23&&z>-78)return;
    if(BENCH_SITES.some(([a,b])=>Math.hypot(x-a,z-b)<1.7)||LAMP_SITES.some(o=>Math.hypot(x-o.x,z-o.z)<1.25)||
       chapterContains(CHAPTER_CUT,x,z,1.15)||sites.some(p=>Math.hypot(x-p.x,z-p.z)<(infill?5:4.4)))return;
    sites.push({x,z,h,species,hero,infill,tone});
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
  // Distinct trees frame the photographed lawns, without crowding the
  // Hugenottenbrunnen, Orangerie or the climbable tree near Jake.
  for(const [x,z,h,species,tone] of [[17.8,-25.8,13.2,'oak','wine'],[29.1,-38.3,13.6,'lime','fresh'],
    [-24.4,-22.8,13.7,'lime','fresh'],[-30.4,-38.4,15.4,'oak','wine'],[-43.6,-38.8,13.8,'oak'],
    [-33.2,-60.1,13.5,'lime'],[20.9,-69.9,13.9,'oak','wine'],[-18.2,-67.2,14.8,'oak']])
    tree(x,z,h,species,null,true,false,tone);
  // Fill the gaps rather than duplicating hero trees: the old trunks are
  // kept, and secondary woodland has a simpler silhouette and root mesh.
  for(let j=0,z=-82;z>=-250;z-=9.3,j++)for(let x=-70;x<=70;x+=9.3){
    const a=x+(j%2)*4.65+range(-2.7,2.7),b=z+range(-3.0,3.0),weight=woodlandDensity(a,b);
    if(rand()>weight||Math.hypot(a+6.15,b+164.1)<9.6)continue;
    const type=rand(),shade=rand();
    tree(a,b,range(11.9,19.8),type<.52?'oak':'lime',null,false,true,shade<.08?'wine':shade<.31?'fresh':shade>.76?'deep':null);
  }
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
      if(festivalClear(X,Z,.92)||greyLaneClear(X,Z,1.15)||network.edge(X,Z)<1.58||!insidePerimeter(X,Z)||distanceToPerimeter(X,Z)<1.65
        ||parkFacadeClearance(X,Z,1.4)||monumentClear(X,Z,.8))continue;
      shrubs.push([X,Z,range(.71,1.23)]);
    }
  }
  for(const e of PERIMETER){
    if(!['iron','wall'].includes(e.type)||e.a[1]>-82)continue;
    const [x,z]=e.a,dx=e.b[0]-x,dz=e.b[1]-z,len=Math.hypot(dx,dz),n=Math.floor(len/3.5);
    for(let i=0;i<n;i++){
      if(rand()>.75)continue;
      const t=(i+.5+range(-.32,.35))/n,off=range(.75,3.5),X=x+dx*t-dz/len*off,Z=z+dz*t+dx/len*off;
      if(!insidePerimeter(X,Z)||network.edge(X,Z)<.8||parkFacadeClearance(X,Z,1.5))continue;
      shrubs.push([X,Z,range(.78,1.66)]);
    }
  }
  const {ground,gravel,gritSet}=gardenMaterials(T,network.texture({
    walls:PERIMETER.filter(e=>e.type==='wall'),beds:beds.strips,canopies:sites
  }),network.rect);
  const [xa,xb,za,zb]=CHAPTER_CUT,opening=[[xa,za],[xb,za],[xb,zb],[xa,zb]];
  const terrain=gardenTerrain(T,PARK_FLOOR,ground,1.78,[opening]);
  const benchCover=gardenTerrain(T,opening,ground).meshes;
  group.add(...terrain.meshes);floors.push(...terrain.meshes);
  const approaches=addGateApproaches(T,group,layout.approaches,gritSet,finish('GROUND'),terrain.height);
  floors.push(...approaches.floors);
  const wcSide=WC_CUT.left,wcBack=WC_CUT.back,join=39.35+1.71;
  const wcLink=new T.Mesh(planGeometry(T,[[join,wcBack],[wcSide,wcBack],
    [wcSide,wcBack+2.055],[join,wcBack+2.055]],-.017,1),gravel);
  wcLink.name='Seitlicher Weg zum WC';wcLink.receiveShadow=true;group.add(wcLink);floors.push(wcLink);
  const plants=plantGarden(T,group,world,sites,(x,z)=>{
    const puddle=((x-BERG_POOL.x)/(BERG_POOL.rx+.24))**2+((z-BERG_POOL.z)/(BERG_POOL.rz+.24))**2;
    if(puddle<1||Math.hypot(x-WEATHER_ZERO.x,z-WEATHER_ZERO.z)<.76)return 0;
    if(z>-17.35||!insidePerimeter(x,z)||parkFacadeClearance(x,z,.5)||
       x< -47.9&&x<orangeFront(z)+.39)return 0;
    if(beds.atBed(x,z,.20)||monumentClear(x,z,.28)||Math.hypot(Math.max(0,Math.abs(x)-4.75),z+47)<10.05)return 0;
    if(chapterContains(CHAPTER_CUT,x,z,.48)||BENCH_SITES.some(([a,b])=>Math.abs(x-a)<1.14&&Math.abs(z-b)<1.14))return 0;
    const {edge,style}=network.sample(x,z);
    if(edge<(style==='trim'?.12:.25))return 0;
    const patch=.5+.5*Math.sin(x*.53+Math.cos(z*.37)*1.5)*Math.cos(z*.39);
    const wall=z<-247||Math.abs(x)>68?distanceToPerimeter(x,z):8;
    const formal=(Math.abs(x)<29&&z>-74)||(x< -33&&x> -60&&z> -84&&z< -32);
    const verge=Math.max(.25,Math.min(1,(edge+.04)*2.37));
    const tread=festivalClear(x,z,-.45)?.66:Math.hypot(x-GREY_SITE.x,z-GREY_SITE.z)<1.10?.19:1;
    return (formal?.92+patch*.07:.78+patch*.20)*verge*(wall<1.4?.68:1)*tread;
  },terrain.height,shrubs);
  const flowers=addBeds(T,group,terrain.height,beds);
  const verge=addPathVerge(T,group,network,terrain.height,(x,z)=>!noBergProps(x,z,.34)&&!festivalClear(x,z,.24)&&!beds.atBed(x,z,.14)&&
    !chapterContains(CHAPTER_CUT,x,z,.35)&&!monumentClear(x,z,.20)&&!parkFacadeClearance(x,z,.15));
  const bench=addBenches(T,group,world,terrain.height);
  const orangery=addOrangery(T,group,world,finish);
  addParkArchitecture(T,group,world,finish);
  addParkMonuments(T,group,world,terrain.height,finish);
  const festival=addParkFestival(T,scene,world,terrain.height);
  return {
    floors,bench,benchCover,orangery,festival, heightAt:(x,z)=>z<=-17&&insidePerimeter(x,z)?terrain.height(x,z):null,
    surfaceAt:(x,z)=>z<=-17&&insidePerimeter(x,z)?(network.edge(x,z)<.17?'gravel':'lawn'):approaches.surfaceAt(x,z),
    update:(position,time,quality)=>{plants(position,time,quality);flowers(position,quality);verge(position)}
  };
}
