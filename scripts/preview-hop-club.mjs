// Build a local, self-contained contact sheet from the normal cellar, lights and collision world.
import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const dir=new URL('../dist/hopfenamt-nacht/',import.meta.url);await mkdir(dir,{recursive:true});
const cast=(await readFile(new URL('../assets/human-cast.glb',import.meta.url))).toString('base64');
const app=await build({stdin:{resolveDir:process.cwd(),contents:`
import * as T from 'three';import {addPalaceLab} from './src/palace-lab.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {installHumans} from './src/human-character.js';
import {collisionWorld} from './src/collision.js';import {BOUNDS,PLAYER} from './src/world-layout.js';
import {LAB,CLUB_FLOOR as F,labFloorAt,labCeilingAt,labCellAt,clubMix} from './src/lab-layout.js';
(async()=>{
installHumans(T,(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(document.getElementById('cast').textContent)).scene);
const w=collisionWorld(BOUNDS,PLAYER.radius),s=new T.Scene(),root=new T.Group();s.add(root);
const lab=addPalaceLab(T,root,w,{oak:new T.MeshStandardMaterial()});
const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(680,464);
r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.08;
// Drawing the final panels below already exercises the visible material programs.
await lab.prepare(new Proxy(r,{get(o,k){return k==='compileAsync'?async()=>{}:k==='render'?()=>{}:typeof o[k]==='function'?o[k].bind(o):o[k];}}),s);
const route=[[32.76,-6.47],[33.22,-4.47],[23.77,-4.47],[21.20,-5.37],[17.56,-7.12],[16.55,-10.52]];
let floor=LAB.floor;
for(const [i,a] of [...route,...route.slice(0,-1).reverse()].entries()){
  const b=window.last||a,n=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.052));
  for(let j=1;j<=n;j++){
    const x=b[0]+(a[0]-b[0])*j/n,z=b[1]+(a[1]-b[1])*j/n,y=labFloorAt(x,z,floor);
    if(y===null||Math.abs(y-floor)>.20||w.blocked(x,z,y)||labCeilingAt(x,z,y)-y<2.08)throw Error('Weg blockiert: '+[x,y,z]);
    floor=y;
  }window.last=a;
}
if(Math.abs(floor-LAB.floor)>.01||labFloorAt(21,-11,F)!==F||labFloorAt(21,-11,LAB.floor)!==LAB.floor)throw Error('Stockwerke nicht getrennt');
if(s.getObjectByName('Hopfenamt · Fünf Stammgäste')?.children.length!==10)throw Error('Fünf Clubgäste erwartet');
const camera=new T.PerspectiveCamera(67,680/464,.05,100);camera.layers.set(3);
for(const [x,z,X,Z,h] of [[13.52,-7.20,10.93,-9.91,1.38],[20.34,-6.35,15.90,-14.29,1.91],[11.01,-8.82,11.62,-9.57,1.45],[20.27,-11.46,23.85,-10.81,1.81]]){
  const y=x>32?LAB.floor:F;lab.update(.03,{x,y,z});camera.position.set(x,y+1.64,z);camera.lookAt(X,y+h,Z);
  r.render(s,camera);const c=document.createElement('canvas');c.width=680;c.height=464;c.getContext('2d').drawImage(r.domElement,0,0);document.body.append(c);
}
document.title='Treppenumkehr, beide Etagen und Tanzfläche geprüft';
})().catch(e=>{document.body.textContent=e.stack;document.title='Fehler: '+e.message});
 `},bundle:true,write:false,minify:true});
await writeFile(new URL('preview.html',dir),'<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:680px 680px;background:#14161b;color:white}</style><script id="cast" type="application/octet-stream">data:application/octet-stream;base64,'+cast+'</script><body><script>'+app.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
