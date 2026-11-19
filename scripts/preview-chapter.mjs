import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const dir=new URL('../dist/krone-egoperspektive/',import.meta.url);await mkdir(dir,{recursive:true});
const code=await build({stdin:{contents:`
import * as T from 'three';
import {CHAPTER_BENCH,CHAPTER_BAY_PATH,CHAPTER_CUT,CHAPTER_LAYER,CHAPTER_DROP} from './src/chapter-layout.js';
import {gardenTerrain,pathNetwork} from './src/garden-ground.js';
import {gardenMaterials} from './src/surface-detail.js';
import {addBenches} from './src/garden-assets.js';
import {addChapter} from './src/chapter.js';
import {addBackdrop} from './src/backdrop.js';
import {makeEgoBody} from './src/ego-body.js';
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
const chapter=addChapter(T,s,w,{bench,benchCover,heightAt:ground.height}),grade=ground.height(...CHAPTER_BENCH),F=grade-CHAPTER_DROP;
const start={x:A+.63,y:grade,z:-34};
const target=chapter.target(start,{x:-1,z:0});
if(!target||!target.usable(start))throw Error('Bank nicht erreichbar');
if(chapter.floorAt(A-.20,-34,grade)!==null)throw Error('Abstieg vor dem Öffnen aktiv');
target.target=1;for(let j=0;j<50;j++)chapter.update(.03,start);
const route=[[start.x,-34],[28.66,-34],[24.2,-34],[22.95,-35.78],[23.47,-43.87],[23.47,-47.65],[21.68,-52.25],[23.47,-47.65],[23.47,-43.87],[22.95,-36.3],[14.77,-36.30],[11.80,-38]];
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
const c=new T.PerspectiveCamera(64,540/400,.065,140);
const avatar=new T.Group(),outfit=makeEgoBody(T,avatar);s.add(avatar);
for(const [x,y,z,X,Y,Z,pose] of [[21.65,F,-53.29,21.65,F+1.91,-55.81],[28.11,F,-34.18,27.96,F+1.54,-36.46],[28.06,F,-34.18,27.94,F+1.53,-32.59],[36.81,grade,-35.5,36.81,grade,-35.61,0],[27.83,F,-34.12,27.83,F,-34.24,0],[21.7,F,-50.9,21.7,F,-51.23,1]]){
 const at=new T.Vector3(x,y,z);chapter.update(0,at);c.position.set(x,y+PLAYER.eye,z);c.lookAt(X,Y,Z);
 avatar.visible=pose!==undefined;avatar.position.copy(at);avatar.rotation.y=Math.atan2(x-X,z-Z);
 if(avatar.visible)outfit.update({step:.72,moving:pose,running:0,strafe:0,grounded:true,landing:0,pitch:-1.38});
 outfit.layer(y===grade?0:CHAPTER_LAYER);
 if(y===grade){c.layers.set(0);r.render(s,c);}
 c.layers.set(CHAPTER_LAYER);r.autoClear=y!==grade;r.render(s,c);r.autoClear=true;
 const p=document.createElement('canvas');p.width=540;p.height=400;p.getContext('2d').drawImage(r.domElement,0,0);document.body.append(p);
}
outfit.update({step:0,moving:0,running:0,strafe:0,grounded:true,landing:0,pitch:0});
if(avatar.children[0].visible)throw Error('Körper bei horizontalem Blick sichtbar');
target.target=0;for(let j=0;j<50;j++)chapter.update(.03,start);
if(chapter.floorAt(A-.20,-34,grade)!==null||Math.abs(bench.position.z-CHAPTER_BENCH[1])>.001)throw Error('Luke schließt nicht sauber');
document.title='Bank, Treppe und fünf Räume geprüft';
}catch(e){document.body.textContent=e.stack;document.title=e.message}
`,resolveDir:process.cwd()},bundle:true,minify:true,write:false});
await writeFile(new URL('preview.html',dir),'<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:repeat(3,540px);background:#101011;color:white}</style><body><script>'+code.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
