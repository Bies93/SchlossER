import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const dir=new URL('../dist/eiserne-krone/',import.meta.url);await mkdir(dir,{recursive:true});
const code=await build({stdin:{contents:`
import * as T from 'three';
import {CHAPTER_BENCH,CHAPTER_CUT,CHAPTER_LAYER,CHAPTER_DROP} from './src/chapter-layout.js';
import {gardenTerrain} from './src/garden-ground.js';
import {addBenches} from './src/garden-assets.js';
import {addChapter} from './src/chapter.js';
import {collisionWorld} from './src/collision.js';
import {BOUNDS,PLAYER,PARK_FLOOR} from './src/world-layout.js';
try{
const s=new T.Scene(),w=collisionWorld(BOUNDS,PLAYER.radius),r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.03;r.setSize(540,400);
const surface=new T.MeshStandardMaterial({color:0x786e5d}),[a,A,b,B]=CHAPTER_CUT,cut=[[a,b],[A,b],[A,B],[a,B]];
const ground=gardenTerrain(T,PARK_FLOOR,surface,1.78,[cut]),benchCover=gardenTerrain(T,cut,surface).meshes;
s.add(...ground.meshes);const bench=addBenches(T,s,w,ground.height);
const light=new T.HemisphereLight(0xffe0bb,0x818381,1.2);s.add(light);
const chapter=addChapter(T,s,w,{bench,benchCover,heightAt:ground.height}),grade=ground.height(...CHAPTER_BENCH),F=grade-CHAPTER_DROP;
const start={x:38.15,y:grade,z:-34};
const target=chapter.target(start,{x:-1,z:0});
if(!target||!target.usable(start))throw Error('Bank nicht erreichbar');
if(chapter.floorAt(36,-34,grade)!==null)throw Error('Abstieg vor dem Öffnen aktiv');
target.target=1;for(let j=0;j<50;j++)chapter.update(.03,start);
const route=[[38.15,-34],[29.52,-34],[24.2,-34],[22.95,-35.78],[22.95,-44.56],[22.95,-36.3],[14.77,-36.30],[11.80,-38]];
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
for(const [x,y,z,X,Y,Z] of [[39.26,grade,-32.50,34.42,grade-.9,-34.01],[30.78,F,-34.07,27.00,F+1.34,-34.63],[26.37,F,-34.19,18.88,F+1.60,-37.68],[23.09,F,-39.36,24.44,F+1.50,-44.1],[15.79,F,-36.08,10.04,F+1.49,-39.1],[20.40,F,-37.12,18.72,F+1.55,-38.4]]){
 const at=new T.Vector3(x,y,z);chapter.update(0,at);c.position.set(x,y+1.59,z);c.lookAt(X,Y,Z);
 if(y===grade){c.layers.set(0);r.render(s,c);}
 c.layers.set(CHAPTER_LAYER);r.autoClear=y!==grade;r.render(s,c);r.autoClear=true;
 const p=document.createElement('canvas');p.width=540;p.height=400;p.getContext('2d').drawImage(r.domElement,0,0);document.body.append(p);
}
target.target=0;for(let j=0;j<50;j++)chapter.update(.03,start);
if(chapter.floorAt(36,-34,grade)!==null||Math.abs(bench.position.z-CHAPTER_BENCH[1])>.001)throw Error('Luke schließt nicht sauber');
document.title='Bank, Treppe und vier Räume geprüft';
}catch(e){document.body.textContent=e.stack;document.title=e.message}
`,resolveDir:process.cwd()},bundle:true,minify:true,write:false});
await writeFile(new URL('preview.html',dir),'<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:repeat(3,540px);background:#101011;color:white}</style><body><script>'+code.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
