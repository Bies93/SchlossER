import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=new URL('../',import.meta.url),dir=new URL('dist/npc-besuch/',base);await mkdir(dir,{recursive:true});
const files=[['castle','schloss.glb','application/octet-stream'],['humans','human-cast.glb','application/octet-stream'],['poster','galerie-bies.webp','image/webp']];
const resources=await Promise.all(files.map(async([key,file,mime])=>[key,'data:'+mime+';base64,'+
  (await readFile(new URL('assets/'+file,base))).toString('base64')]));
const src=`
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {installHumans,namedHumans} from './src/human-character.js';
import {npcFocus} from './src/npc-focus.js';
import {collisionWorld} from './src/collision.js';
import {BOUNDS,PLAYER,addFixedColliders} from './src/world-layout.js';
import {surfaceLibrary} from './src/palace.js';
import {palaceExterior} from './src/palace-exterior.js';
import {palaceMaterials,addPortalFacade} from './src/palace-facade.js';
import {cutPalaceOpenings,HALL} from './src/palace-openings.js';
import {makeHall} from './src/palace-hall.js';
import {addWcInterior,WC_LAYER} from './src/park-wc-interior.js';
import {p,wcLevel} from './src/park-wc-layout.js';
import {makeMoosfunk} from './src/moosfunk-quest.js';
try{
 const src=id=>document.getElementById(id).textContent;
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const [house,cast,poster]=await Promise.all([loader.loadAsync(src('castle')),loader.loadAsync(src('humans')),new T.TextureLoader().loadAsync(src('poster'))]);
 poster.colorSpace=T.SRGBColorSpace;installHumans(T,cast.scene);
 const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 r.debug.onShaderError=(gl,pg,vs,fs)=>{throw Error([gl.getProgramInfoLog(pg),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs)].join(' '));};
 r.setSize(614,369);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.03;
 const s=new T.Scene(),camera=new T.PerspectiveCamera(64,614/369,.08,140),world=collisionWorld(BOUNDS,PLAYER.radius);
 s.background=new T.Color(0x3d4143);s.environment=new T.PMREMGenerator(r).fromScene(new RoomEnvironment()).texture;s.environmentIntensity=.52;
 s.add(house.scene,new T.HemisphereLight(0xe6ded9,0x53483e,.68));addFixedColliders(world);
 const mats=palaceExterior(T,surfaceLibrary(T,{}).finish),M=palaceMaterials(T,mats),quest=makeMoosfunk();
 house.scene.traverse(o=>{if(o.isMesh){const k=o.material.name;o.material=mats(k)??o.material;
   if(/^(GROUND|GRASS|GRAVEL|FLOWER)/.test(k))o.visible=false;}});
 cutPalaceOpenings(T,house.scene);
 const hall=makeHall(T,house.scene,M,world,addPortalFacade(T,house.scene,M),poster,null,quest);
 const wc=addWcInterior(T,s,world,quest),person=new T.Group(),name=document.createElement('span');
 let layer=0;
 const focus=npcFocus(T,s,camera,person,name,()=>1<<layer);
 const upper=(x,z)=>[x,HALL.floor,z];
 const cellar=(id,u,v)=>p(u,wcLevel(id),v);
 const views=[
   ['guestBruno',upper(26.34,.37),0],
   ['guestMarlene',upper(-7.21,4.24),0],
   ['guestSabine',cellar('women',6.49,1.70),WC_LAYER],
   ['guestJona',cellar('collective',18.41,1.36),WC_LAYER],
   ['guestRike',cellar('greenhouse',28.65,3.00),WC_LAYER],
   ['guestEdda',cellar('studio',18.36,-6.59),WC_LAYER],
   ['guestLotte',cellar('deepLounge',.97,-2.35),WC_LAYER]
 ];
 const snap=(item,caption)=>{
   r.render(s,camera);
   const holder=document.createElement('figure'),cv=document.createElement('canvas'),lab=document.createElement('figcaption');
   cv.width=614;cv.height=369;cv.getContext('2d').drawImage(r.domElement,0,0);
   lab.textContent=item+' · '+caption;holder.append(cv,lab);document.body.append(holder);
 };
 for(const [id,at,L] of views){
   const ent=namedHumans(T).find(a=>a.id===id);if(!ent)throw Error(id+' fehlt');
   person.position.fromArray(at);layer=L;camera.layers.set(layer);
   const pos=person.position;
   for(let j=0;j<26;j++){wc.update(.032,pos);hall.update(.032,pos);}
   const goal=ent.head.getWorldPosition(new T.Vector3());goal.y+=.08;
   camera.position.fromArray(at);camera.position.y+=1.67;camera.lookAt(goal);camera.updateMatrixWorld(true);s.updateMatrixWorld(true);
   const seen=focus.sample(performance.now(),true);
   snap(ent.name,seen?.id===id?'Namensanzeige aktiv':'Sichtlinie verdeckt');
 }
 document.body.dataset.finished='true';
}catch(e){document.title='Fehler';document.body.textContent=e.stack;}
`;
const bundled=await build({stdin:{contents:src,resolveDir:fileURLToPath(base)},bundle:true,minify:true,format:'esm',write:false});
await writeFile(new URL('ansichten.html',dir),'<!doctype html><meta charset="utf-8"><title>SchlossER · Besucher</title><style>*{margin:0}body{display:grid;grid-template-columns:repeat(2,614px);background:#1a1c1d;color:#f0e8d6}canvas{display:block}figcaption{font:16px system-ui;padding:9px 10px}</style><body>'+
  resources.map(([id,url])=>'<script type="application/octet-stream" id="'+id+'">'+url+'</script>').join('')+
  '<script type="module">'+bundled.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
