import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const dir=new URL('../dist/palastpersonal/',import.meta.url);
await mkdir(dir,{recursive:true});
const [palace,cast]=await Promise.all(['schloss','human-cast'].map(async n=>(await readFile(new URL('../assets/'+n+'.glb',import.meta.url))).toString('base64')));
const src=`
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {collisionWorld} from './src/collision.js';
import {addFixedColliders,BOUNDS,PLAYER} from './src/world-layout.js';
import {installHumans,createHuman} from './src/human-character.js';
import {surfaceLibrary} from './src/palace.js';
import {palaceExterior} from './src/palace-exterior.js';
import {palaceMaterials,addPortalFacade} from './src/palace-facade.js';
import {cutPalaceOpenings} from './src/palace-openings.js';
import {makeHall} from './src/palace-hall.js';
import {LAB,LAB_LAYER} from './src/lab-layout.js';
import {addWcInterior,WC_LAYER} from './src/park-wc-interior.js';
import {p,DEEP_FLOOR} from './src/park-wc-layout.js';
import {makeMoosfunk} from './src/moosfunk-quest.js';
try{
 const ld=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const [pal,cast]=await Promise.all(['palace','cast'].map(k=>ld.loadAsync(document.getElementById(k).textContent)));
 installHumans(T,cast.scene);
 const s=new T.Scene(),world=collisionWorld(BOUNDS,PLAYER.radius),r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 r.debug.onShaderError=(gl,program,vs,fs)=>{throw Error([gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs)].join(' | '));};
 const c=new T.PerspectiveCamera(64,690/465,.08,1250),probe=(x,y,z)=>({x,y,z});
 r.setSize(690,465);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.08;
 s.background=new T.Color(0x55545a);s.environment=new T.PMREMGenerator(r).fromScene(new RoomEnvironment()).texture;s.environmentIntensity=.48;
 const sky=new T.HemisphereLight(0xdedcec,0x61564d,1.18),sun=new T.DirectionalLight(0xffd9b0,1.65);
 sun.position.set(-10,11,-16);s.add(sky,sun);
 const mats=palaceExterior(T,surfaceLibrary(T,{}).finish),M=palaceMaterials(T,mats);
 pal.scene.traverse(o=>{if(o.isMesh){const k=o.material.name;o.material=mats(k)??o.material;
   if(/^(?:GROUND|GRASS|GRAVEL|FLOWER)/.test(k))o.visible=false;}});s.add(pal.scene);
 cutPalaceOpenings(T,pal.scene);addFixedColliders(world);
 const quest=makeMoosfunk(),h=makeHall(T,pal.scene,M,world,addPortalFacade(T,pal.scene,M),null,null,quest);
 const snap=(label)=>{
  r.render(s,c);const cv=document.createElement('canvas');cv.width=690;cv.height=465;cv.getContext('2d').drawImage(r.domElement,0,0);
  const fig=document.createElement('figure');fig.append(cv);const tag=document.createElement('figcaption');tag.textContent=label;fig.append(tag);document.body.append(fig);
 };
 const player={body:{position:probe(.52,.071,-13.9)}};
 c.position.set(.52,1.74,-13.9);c.lookAt(0,1.54,-6.1);c.updateMatrixWorld(true);
 if(h.commit(player,c)?.id!=='east')throw Error('Gartenportal nicht erreichbar');
 for(let j=0;j<36;j++)h.update(.032,player.body.position);
 snap('Gartenportal · Laibung vom Garten');
 const butler=s.getObjectByName('Niklas · Schlossbutler');
 if(!butler)throw Error('Butler fehlt');
 const z0=butler.position.z;
 for(let j=0;j<36;j++)h.update(.032,probe(-1,.071,6.5));
 if(Math.abs(z0-butler.position.z)<.9)throw Error('Butler unterschreitet Schrittgeschwindigkeit');
 c.position.set(.02,1.61,butler.position.z+1.76);c.lookAt(butler.position.x,1.0,butler.position.z);c.updateMatrixWorld(true);snap('Eingangshalle · Niklas');
 const wc=addWcInterior(T,s,world,quest),visitor=new T.Vector3(...p(-22.56,DEEP_FLOOR,-6.04));
 wc.update(.045,visitor);
 const aiming=new T.Vector3(...p(-22.40,DEEP_FLOOR+1.25,-8.33)).sub(visitor).normalize();
 if(wc.target(visitor,aiming)?.id!=='orb-priest'||!wc.priestAck())throw Error('Orb-Priester nicht ansprechbar');
 for(let j=0;j<50;j++)wc.update(.035,visitor);
 c.layers.set(WC_LAYER);c.position.copy(visitor).y+=1.67;c.lookAt(...p(-22.44,DEEP_FLOOR+1.21,-7.93));c.updateMatrixWorld(true);
 snap('Votivkammer · Arbeit hinter dem Altar');
 c.fov=41;c.updateProjectionMatrix();c.position.set(...p(-22.41,DEEP_FLOOR+1.50,-6.42));
 c.lookAt(...p(-22.34,DEEP_FLOOR+1.20,-7.83));c.updateMatrixWorld(true);snap('Votivkammer · Messer und Schale');
 c.layers.set(0);
 const studio=new T.Scene();studio.background=new T.Color(0x25232a);studio.environment=s.environment;
 const old=createHuman(T,'hubert');studio.add(old.actor,new T.HemisphereLight(0xe2e7f6,0x716455,1.96));
 const light=new T.DirectionalLight(0xffe8c3,2.1);light.position.set(4,4,3);studio.add(light);
 old.pose(2.07,.37,.48,0,0,0,1.48,.19);old.actor.rotation.y=-.26;
 c.fov=49;c.position.set(.38,1.26,2.42);c.lookAt(0,1.00,0);c.updateProjectionMatrix();
 r.render(studio,c);const cv=document.createElement('canvas');cv.width=690;cv.height=465;cv.getContext('2d').drawImage(r.domElement,0,0);document.body.append(cv);
 const cpuOnly=new Proxy(r,{get(o,key){if(key==='compileAsync'||key==='render')return ()=>{};const a=o[key];return typeof a==='function'?a.bind(o):a;}});
 await h.prepareLab(cpuOnly,s);
 c.layers.set(LAB_LAYER);c.fov=59;c.updateProjectionMatrix();
 for(const [name,fx,fz,px,pz] of [
   ['Dr. Ernst Auer',-22.27,49.75,-22.50,50.56],
   ['Hedwig Kern',-10.32,61.26,-10.44,60.58],
   ['Sepp Moser',33.12,-19.91,32.28,-20.39]
 ]){
   const a=s.getObjectByName(name);if(!a)throw Error(name+' fehlt');
   const p=probe(px,LAB.floor,pz),pl={body:{position:p}};
   c.position.set(px,p.y+1.67,pz);c.lookAt(a.position.x,p.y+1.38,a.position.z);c.updateMatrixWorld(true);
   if(world.blocked(p.x,p.z,p.y))throw Error(name+' · Gesprächsposition nicht begehbar');
   if(h.commit(pl,c)?.action!=='lab-talk'||h.staffTalk(pl,c)?.name!==name)throw Error(name+' nicht ansprechbar');
   for(let j=0;j<28;j++)h.update(.031,p);
   c.position.set(fx,p.y+1.65,fz);c.lookAt(a.position.x,p.y+1.17,a.position.z);c.updateMatrixWorld(true);snap(name);
 }
 document.title='Palastpersonal · Ansichten';
}catch(error){document.body.textContent=error.stack;document.title='Fehler · '+error.message}
`;
const b=await build({stdin:{contents:src,resolveDir:process.cwd()},bundle:true,minify:true,format:'esm',write:false});
const inline=(n,d)=>`<script id="${n}" type="application/octet-stream">data:application/octet-stream;base64,${d}</script>`;
await writeFile(new URL('ansichten.html',dir),'<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:repeat(2,690px);background:#18191c;color:white}figcaption{font:16px system-ui;padding:6px}canvas{display:block}</style>'+inline('palace',palace)+inline('cast',cast)+'<body><script type="module">'+b.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
