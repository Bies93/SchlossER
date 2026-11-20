// Render the shipped procedural asset (not a separate high-detail preview model).
import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=new URL('../dist/paulibrunnen/',import.meta.url);await mkdir(dir,{recursive:true});
const src=`
import * as T from 'three';
import {addPauli,PAULI} from './src/pauli-fountain.js';
import {collisionWorld} from './src/collision.js';
import {BOUNDS,PLAYER,insidePerimeter} from './src/world-layout.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
try{
 const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 r.setSize(680,460);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.06;
 r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter),p=addPauli(T,scene,world);
 scene.background=new T.Color(0xa1aeb4);
 const bake=new T.PMREMGenerator(r),env=new RoomEnvironment(),target=bake.fromScene(env);scene.environment=target.texture;scene.environmentIntensity=.48;
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x88817a,roughness:.88}));
 floor.rotation.x=-Math.PI/2;floor.position.set(0,PAULI.grade-.001,PAULI.z);floor.receiveShadow=true;scene.add(floor);
 const sun=new T.DirectionalLight(0xfff0d8,2.4);sun.position.set(-8,10,PAULI.z+9);sun.target.position.copy(p.root.position);scene.add(sun,sun.target);
 sun.castShadow=true;sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-7;
 sun.shadow.camera.near=.1;sun.shadow.camera.far=34;sun.shadow.bias=-.0003;sun.shadow.normalBias=.009;sun.shadow.mapSize.set(2048,2048);
 scene.add(new T.HemisphereLight(0xe1efff,0x9a8f80,1.26));
 const c=new T.PerspectiveCamera(33,680/460,.05,200);
 if(p.step(0,PAULI.z+3.72,0)===null||world.blocked(0,PAULI.z+3.72,0)||!world.blocked(0,PAULI.z+3,0)||world.blocked(PLAYER.radius+5.05,PAULI.z,0))throw Error('Stufen / Umlauf prüfen');
 for(const [x,y,z,X,Y,Z,fov] of [[0,2.1,14.7,0,3.03,0,33],[7.5,4.2,11.6,0,3.00,0,35],
   [-6.0,2.37,3.0,-2.8,2.16,.02,37],[1.6,3.65,6.2,0,3.15,0,36]]){
   c.position.set(x,y,z+PAULI.z);c.lookAt(X,Y,Z+PAULI.z);c.fov=fov;c.updateProjectionMatrix();c.updateMatrixWorld();
   p.tick(3500,c);r.render(scene,c);const el=document.createElement('canvas');el.width=680;el.height=460;el.getContext('2d').drawImage(r.domElement,0,0);document.body.append(el);
 }
 document.title='Paulibrunnen · '+r.info.render.triangles+' Dreiecke in Detailansicht';
}catch(e){document.title='Fehler';document.body.textContent=e.stack}`;
const b=await build({stdin:{contents:src,resolveDir:process.cwd()},bundle:true,minify:true,write:false});
await writeFile(new URL('ansichten.html',dir),'<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:repeat(2,680px);background:#242827;color:white}</style><body><script>'+b.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
// Optional second contact sheet uses the real plaza, actual materials, sky
// and game lights. No cameras or special controls are added to the release.
if(process.argv.includes('--platz')){
 const baseApp=await readFile('src/app.js','utf8'),needle='lighting.registerWindows(perimeter.windows);';
 // Only the outdoor plaza is in frame. Do not allocate unseen underground
 // rooms / rigs (especially on headless renderers with software WebGL).
 const first=baseApp.indexOf(' const moosfunk=makeMoosfunk();'),last=baseApp.indexOf(needle);
 if(first<0||last<first)throw Error('Outdoor preview wiring has changed');
 const app=baseApp.slice(0,first)+
   'const perimeter=addPerimeter(T,s,world,finish),backdrop=addBackdrop(T,s),lighting=makeLighting(T,r,s,world,()=>-.046);\n'+baseApp.slice(last);
 if(!app.includes(needle))throw Error('Preview entry point changed');
 const replacement=`{
   const sheets=[];
   r.setPixelRatio(1);r.setSize(760,480);c.aspect=760/480;
   for(const [preset,x,y,z,tx,ty,tz,fov] of [['dusk',.35,1.74,80.0,0,3.02,66.65,36],['night',6.1,1.71,76.9,0,2.94,66.65,40]]){
     c.fov=fov;c.updateProjectionMatrix();c.position.set(x,y,z);c.lookAt(tx,ty,tz);c.updateMatrixWorld();
     lighting.applyLighting(preset);lighting.update(c.position);backdrop.setPreset(preset);pauli.setPreset(preset);
     pauli.tick(3000,c);r.shadowMap.needsUpdate=true;r.render(s,c);
     const out=document.createElement('canvas');out.width=760;out.height=480;out.getContext('2d').drawImage(r.domElement,0,0);sheets.push(out);
   }
   document.body.replaceChildren(...sheets);document.body.style.cssText='margin:0;display:flex;align-items:flex-start;gap:0;background:#171a1b;';
   for(const o of sheets)o.style.cssText='position:static;inset:auto;width:760px;height:480px;flex:none;';
   document.title='Paulibrunnen · Schlossachse und Nacht';return;
 }`;
 const result=await build({stdin:{contents:app.replace(needle,needle+replacement),resolveDir:fileURLToPath(new URL('../src/',import.meta.url))},bundle:true,minify:true,write:false});
 const offline=await readFile('dist/Schlossgarten.html','utf8'),prefix=offline.slice(0,offline.indexOf('</script><script>',offline.indexOf('id="assets"'))+9);
 await writeFile(new URL('marktplatz.html',dir),prefix+'<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
}
