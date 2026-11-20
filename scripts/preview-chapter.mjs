import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const dir=new URL('../dist/krone-nachtwache/',import.meta.url);await mkdir(dir,{recursive:true});
const code=await build({stdin:{contents:`
import * as T from 'three';
import {CHAPTER_BENCH,CHAPTER_BAY_PATH,CHAPTER_CUT,CHAPTER_LAYER,CHAPTER_DROP,CHAPTER_DEEP_DROP,CHAPTER_CELL} from './src/chapter-layout.js';
import {gardenTerrain,pathNetwork} from './src/garden-ground.js';
import {gardenMaterials} from './src/surface-detail.js';
import {addBenches} from './src/garden-assets.js';
import {addChapter} from './src/chapter.js';
import {addBackdrop} from './src/backdrop.js';
import {collisionWorld} from './src/collision.js';
import {BOUNDS,PLAYER,PARK_FLOOR} from './src/world-layout.js';
try{
const s=new T.Scene(),w=collisionWorld(BOUNDS,PLAYER.radius),r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.03;r.setSize(540,400);
const net=pathNetwork(T);
net.add([[37,-25],[36,-49],[41,-79]],3.35);
net.add([[13,-39],[26,-32],[39,-24]],2.5);
net.add([[37.1,-40],[47.8,-42],[57.8,-45.3]],2.6,'compact');
net.add(CHAPTER_BAY_PATH,1.66,'compact');
const {ground:surface}=gardenMaterials(T,net.texture(),net.rect),[a,A,b,B]=CHAPTER_CUT,cut=[[a,b],[A,b],[A,B],[a,B]];
const ground=gardenTerrain(T,PARK_FLOOR,surface,1.78,[cut]),benchCover=gardenTerrain(T,cut,surface).meshes;
s.add(...ground.meshes);const bench=addBenches(T,s,w,ground.height);
const light=new T.HemisphereLight(0xf2eaf2,0x88837a,1.67);s.add(light);
const sun=new T.DirectionalLight(0xffd5a7,1.05);sun.position.set(50,40,25);s.add(sun);
const sky=new T.Mesh(new T.SphereGeometry(95,16,12),new T.MeshBasicMaterial({color:0xb0a9b3,side:T.BackSide,depthWrite:false}));
sky.position.set(35,0,-34);sky.renderOrder=-90;s.add(sky);
const {ground:farGround}=addBackdrop(T,s);
farGround.updateWorldMatrix(true,false);
const ray=new T.Raycaster(new T.Vector3((a+A)/2,2,(b+B)/2),new T.Vector3(0,-1,0));
if(ray.intersectObject(farGround,false).length)throw Error('Fernboden überdeckt die Treppe');
const chapter=addChapter(T,s,w,{bench,benchCover,heightAt:ground.height}),grade=ground.height(...CHAPTER_BENCH),F=grade-CHAPTER_DROP,D=F-CHAPTER_DEEP_DROP;
const start={x:A+.63,y:grade,z:-34};
const target=chapter.target(start,{x:-1,z:0});
if(!target||!target.usable(start))throw Error('Bank nicht erreichbar');
if(chapter.floorAt(A-.20,-34,grade)!==null)throw Error('Abstieg vor dem Öffnen aktiv');
target.target=1;for(let j=0;j<50;j++)chapter.update(.03,start);
const route=[[start.x,-34],[28.66,-34],[24.2,-34],[22.95,-35.78],[23.47,-43.87],[23.47,-47.65],
 [21.53,-52.25],[21.53,-63.90],[21.47,-65.94],[16.51,-65.94],[21.47,-65.94],[24.62,-65.94],
 [21.46,-65.94],[21.46,-72.72],[23.87,-73.35]];
let prev=grade;
for(const [i,end] of [...route,...route.slice(0,-1).reverse()].entries()){
 const pt=window.pt??end,n=Math.max(1,Math.ceil(Math.hypot(end[0]-pt[0],end[1]-pt[1])/.041));
 for(let j=1;j<=n;j++){
  const x=pt[0]+(end[0]-pt[0])*j/n,z=pt[1]+(end[1]-pt[1])*j/n,y=chapter.floorAt(x,z,prev)??ground.height(x,z);
  const blocked=w.blocked(x,z,y),head=chapter.ceilingAt(x,z,y)-y;
  if(Math.abs(y-prev)>.195||blocked||head<1.89)throw Error('Durchgang '+[i,j,x,y,z,prev,blocked,head].join(' / '));
  prev=y;
 }window.pt=end;
}
if(!target.usable(start)||chapter.floorAt(21,-36,F)!==F)throw Error('Stockwerk nicht konsistent');
if(chapter.floorAt(21.5,-67.6,D)!==D||chapter.floorAt(21.5,-67.6,grade)!==null)throw Error('Kellerboden leckt in den Park');
const [L,R,Z0,Z1]=CHAPTER_CELL;
if(!w.blocked((L+R)/2,Z1-.06,D)||!w.blocked(L+.01,Z0+.16,D))throw Error('Zelle hat einen offenen Durchgang');
const gateX=L+4.4,gateUser={x:gateX-.55,y:D,z:Z1+1.32};
const latch=chapter.target(gateUser,{x:0,z:-1});
if(latch?.id!=='hubert-cell'||!latch.usable(gateUser)||!w.blocked(gateX,Z1+.18,D))throw Error('Riegel fehlt');
latch.target=1;for(let i=0;i<36;i++)chapter.update(.04,gateUser);
for(let z=Z1+.80;z>Z1-1.22;z-=.075)if(w.blocked(gateX,z,D))throw Error('Zellentür blockiert');
const inn={x:gateX+1.02,y:D,z:Z1-.84};
if(chapter.target(inn,{x:0,z:1})!==latch||!latch.usable(inn))throw Error('Innengriff fehlt');
latch.target=0;for(let i=0;i<36;i++)chapter.update(.04,inn);
if(!w.blocked(gateX,Z1+.18,D))throw Error('Zellentür schließt nicht');
let old,inside=true;
for(let i=0;i<410;i++){
 const viewer={x:23.8,y:D,z:-73.6};chapter.update(.05,viewer);
 const p=chapter.prisonerAt(viewer);
 if(!p||p.x-.35<L||p.x+.35>R||p.z-.30<Z0||p.z+.30>Z1){inside=false;break;}
 if(!old)old=p.clone();
}
if(!inside||!old||old.distanceTo(chapter.prisonerAt({x:23.8,y:D,z:-73.6}))<.06)throw Error('Gang hinter Gittern fehlerhaft');
if(chapter.prisonerAt({x:23.8,y:F,z:-73.6}))throw Error('Stimme außerhalb des Untergeschosses');
for(let j=0;j<109;j++)chapter.update(.05,{x:25.82,y:D,z:-73.58});
const c=new T.PerspectiveCamera(64,540/400,.065,140);
for(const [x,y,z,X,Y,Z] of [[21.53,F,-54.50,21.54,F+.75,-58.46],
 [21.51,D,-64.16,21.48,D+1.52,-70.86],[17.74,D,-65.79,12.87,D+.98,-67.88],
 [24.21,D,-67.25,29.53,D+1.30,-68.53],[22.63,D,-72.62,24.91,D+1.49,-76.67],
 [29.74,D,-65.02,29.99,D+1.14,-62.96]]){
 const at=new T.Vector3(x,y,z);chapter.update(0,at);c.position.set(x,y+PLAYER.eye,z);c.lookAt(X,Y,Z);
 if(x===25.73){c.fov=45;c.updateProjectionMatrix();}
 if(y===grade){c.layers.set(0);r.render(s,c);}
 c.layers.set(CHAPTER_LAYER);r.autoClear=y!==grade;r.render(s,c);r.autoClear=true;
 const p=document.createElement('canvas');p.width=540;p.height=400;p.getContext('2d').drawImage(r.domElement,0,0);document.body.append(p);
}
// Two eye-level portraits at conversational distance, with the visitor
// actually in the cell rather than pushing the camera through the bars.
const h=chapter.prisonerAt({x:24,y:D,z:-76}).clone();
for(const offset of [.29,-.49]){
 const at={x:h.x+offset,y:D,z:h.z+.74};
 for(let j=0;j<68;j++)chapter.update(.04,at);
 c.fov=57;c.updateProjectionMatrix();c.position.set(at.x,D+1.63,at.z);
 c.lookAt(h.x,D+1.55,h.z+.12);r.render(s,c);
 const p=document.createElement('canvas');p.width=540;p.height=400;p.getContext('2d').drawImage(r.domElement,0,0);document.body.append(p);
}
target.target=0;for(let j=0;j<50;j++)chapter.update(.03,start);
if(chapter.floorAt(A-.20,-34,grade)!==null||Math.abs(bench.position.z-CHAPTER_BENCH[1])>.001)throw Error('Luke schließt nicht sauber');
document.title='Nachtwache, Tiefgeschoss und Käfig geprüft';
}catch(e){document.body.textContent=e.stack;document.title=e.message}
`,resolveDir:process.cwd()},bundle:true,minify:true,write:false});
await writeFile(new URL('preview.html',dir),'<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:repeat(3,540px);background:#101011;color:white}</style><body><script>'+code.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
