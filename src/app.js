import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {collisionWorld} from './collision.js';
import {createPlayer, bindPlayerInput} from './player.js';
import {addFixedColliders, BOUNDS, PLAYER, insidePerimeter} from './world-layout.js';
import {addPerimeter} from './perimeter.js';
import {makeLighting} from './lighting.js';
import {addGarden} from './garden.js';
import {surfaceLibrary} from './palace.js';
import {sculptureMaterials} from './surface-detail.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

const $ = id => document.getElementById(id);
const stage=document.querySelector('main');
const payload=JSON.parse($('assets').textContent);
$('assets').remove();
const about=$('about');
$('info').onclick=()=>about.showModal();
async function start(){
 const r=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio,1.6));
 $('canvas').append(r.domElement);
 const s=new T.Scene(), c=new T.PerspectiveCamera(65,1,.08,1250);
 const ground=new T.Mesh(new T.PlaneGeometry(1700,1700),new T.MeshStandardMaterial({color:0x9d9d80,roughness:1}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.30;ground.receiveShadow=true;s.add(ground);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),tl=new T.TextureLoader();
 const decode=url=>loader.loadAsync(url).then(g=>g.scene);
 const mapsP=Promise.all(Object.entries(payload.maps).map(async([name,layers])=>[name,Object.fromEntries(await Promise.all(Object.entries(layers).map(async([k,src])=>[k,await tl.loadAsync(src)])))]));
 const [model,mapPairs,sculptures,environment]=await Promise.all([decode(payload.model),mapsP,decode(payload.sculptures),new HDRLoader().loadAsync(payload.light)]);
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 const walkSurfaces=[], importedGravel=[];
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name;o.material=finish(key);
 // The original broad lawn and plaza are replaced rather than overlaid.
 if(key==='GRAVEL')importedGravel.push(o);
 if(key==='GROUND'||key==='GRASS'||key==='GRAVEL'||key.startsWith('FLOWER_')){o.visible=false;return;}
 o.receiveShadow=true;o.castShadow=!['GROUND','GRASS','GRAVEL','GLASS'].includes(key);});s.add(model);
 // The individual slates have open joints. A continuous dark deck sits underneath.
 const deck=new T.BufferGeometry();
 deck.setAttribute('position',new T.Float32BufferAttribute([
   -33.65,16.43,9.68, 33.65,16.43,9.68, 33.65,16.43,-9.68, -33.65,16.43,-9.68,
   -23.38,20.68,0, 23.38,20.68,0],3));
 deck.setIndex([0,1,5,0,5,4,1,2,5,2,3,4,2,4,5,3,0,4]);deck.computeVertexNormals();
 s.add(new T.Mesh(deck,new T.MeshStandardMaterial({color:0x38414a,roughness:.91,side:T.DoubleSide})));
 if(sculptures){
   sculptureMaterials(sculptures,finish);
   sculptures.traverse(o=>{if(o.isMesh){o.castShadow=!/Fountain_water|Water_jets|Aerated_spray/i.test(o.name);o.receiveShadow=true}});
   s.add(sculptures)
 }
 const world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);
 addFixedColliders(world);
 const perimeter=addPerimeter(T,s,world,finish);
 walkSurfaces.push(...perimeter.floors);
 const garden=addGarden(T,s,world,importedGravel);
 walkSurfaces.push(...garden.floors);
 s.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,3), hits=[];
 const floorHeight=(x,z)=>{
   const terrain=garden.heightAt(x,z);
   if(terrain!==null)return terrain;
   ray.ray.origin.set(x,2,z);
   ray.intersectObjects(walkSurfaces,false,hits);
   const y=hits[0]?.point.y ?? ground.position.y;
   hits.length=0;
   return y;
 };
 const lighting=makeLighting(T,r,s,environment,world,floorHeight);
 lighting.registerWindows(perimeter.windows);
 const player=createPlayer(T,c,world,floorHeight);
 s.add(player.body);
 const canvas=r.domElement;
 canvas.tabIndex=-1;
 canvas.setAttribute('aria-label','3D-Rundgang');
 const action=$('enter');
 const active=()=>document.body.dataset.state==='playing';
 let frame=0, dirty=true;
 function schedule(){if(!frame) frame=requestAnimationFrame(render)}
 function refresh(){dirty=true;schedule()}
 function draw(){const p=player.body.position;lighting.update(p);garden.update(p);r.render(s,c);}
 function render(time){
   frame=0;
   if(active()&&input.tick(time)) dirty=true;
   if(dirty){draw();dirty=false}
   if(active()) schedule();
 }
 function pause(focus=false){
   if(!active())return;
   document.body.dataset.state='paused';
   input.clear();
   if(focus) action.focus({preventScroll:true});
 }
 const input=bindPlayerInput({
   canvas,pad:$('stick'),player,active,pause:()=>pause(!document.hidden && document.hasFocus()),
   refresh,mode:value=>{document.body.dataset.input=value}
 });
 action.onclick=event=>{
   document.body.dataset.state='playing';
   input.start({
     touch:event.pointerType==='touch'||matchMedia('(pointer:coarse)').matches,
     lock:event.detail>0
   });
   schedule();
 };
 $('pause').onclick=()=>pause(true);
 $('info').onclick=()=>{pause();about.showModal()};
 $('full').hidden=!document.fullscreenEnabled;
 $('full').onclick=async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
   catch{ /* Fullscreen is optional; the walk still works. */ }
 };
 const choices=[...$('lighting').querySelectorAll('[data-light]')];
 function selectLight(id,remember=false){
   if(!lighting.applyLighting(id))return false;
   for(const b of choices)b.setAttribute('aria-pressed',String(b.dataset.light===id));
   if(remember){try{localStorage.setItem('schlosser.light',id)}catch{}}
   return true;
 }
 let last='day';
 try{last=localStorage.getItem('schlosser.light')||'day'}catch{}
 if(!selectLight(last))selectLight('day');
 for(const b of choices)b.onclick=()=>{if(selectLight(b.dataset.light,true))refresh()};
 function resize(){
   const w=stage.clientWidth,h=stage.clientHeight;
   if(!w||!h)return;
   r.setSize(w,h,false);c.aspect=w/h;
   // Keep useful peripheral vision on narrow phones without changing the pose.
   c.fov=T.MathUtils.clamp(T.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI*24/180)/c.aspect)),65,82);
   c.updateProjectionMatrix();refresh();
 }
 new ResizeObserver(resize).observe(stage);resize();
 r.shadowMap.needsUpdate=true;
 draw();dirty=false;
 document.body.dataset.state='ready';
}
start().catch(err=>{
 console.error(err);$('canvas').hidden=true;
 if (!window.WebGL2RenderingContext || /WebGL context/.test(err.message)) {
   $('error-text').textContent='Für den Rundgang braucht dein Browser WebGL 2. Aktiviere die Hardwarebeschleunigung oder versuche es mit einem anderen Browser.';
 }
 document.body.dataset.state='error';
});
