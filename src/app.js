import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {collisionWorld} from './collision.js';
import {createPlayer, bindPlayerInput} from './player.js';
import {addFixedColliders, BOUNDS, PLAYER, insidePerimeter} from './world-layout.js';
import {addPerimeter} from './perimeter.js';
import {addBackdrop} from './backdrop.js';
import {DEFAULT_LIGHT,makeLighting} from './lighting.js';
import {addGarden} from './garden.js';
import {surfaceLibrary} from './palace.js';
import {sculptureMaterials} from './surface-detail.js';
import {addMonumentFooting} from './palace-detail.js';
import {cutPalaceOpenings} from './palace-openings.js';
import {addPortalFacade,palaceMaterials} from './palace-facade.js';
import {hallFloor,makeHall} from './palace-hall.js';
import {makeFountain} from './fountain.js';
import {makeViewmodel} from './viewmodel.js';
import {ghoulRound} from './ghoul-round.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

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
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),tl=new T.TextureLoader();
 const need=async (name,read)=>{
   try{return await read()}catch(cause){const e=new Error('Projektdatei konnte nicht gelesen werden: '+name,{cause});e.asset=name;throw e;}
 };
 const decode=(name,url)=>need(name,()=>loader.loadAsync(url).then(g=>g.scene));
 const mapsP=Promise.all(Object.entries(payload.maps).map(async([name,layers])=>[name,Object.fromEntries(await Promise.all(Object.entries(layers).map(async([k,src])=>[k,await need(name+'_'+k+'.webp',()=>tl.loadAsync(src))])))]));
 const [model,mapPairs,sculptures]=await Promise.all([decode('schloss.glb',payload.model),mapsP,
   decode('skulpturen.glb',payload.sculptures)]);
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 const walkSurfaces=[], importedGravel=[];
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name??'';o.material=finish(key)??o.material;
 // The original broad lawn and plaza are replaced rather than overlaid.
 if(key==='GRAVEL')importedGravel.push(o);
 if(key==='GROUND'||key==='GRASS'||key==='GRAVEL'||key.startsWith('FLOWER_')){o.visible=false;return;}
 o.receiveShadow=true;o.castShadow=key!=='GLASS';});s.add(model);
 cutPalaceOpenings(T,model);
 const stonework=palaceMaterials(T,finish),leaves=addPortalFacade(T,model,stonework);
 if(sculptures){
   sculptureMaterials(sculptures,finish);
   sculptures.traverse(o=>{if(o.isMesh){o.castShadow=!/Fountain_water|Water_jets|Aerated_spray/i.test(o.name);o.receiveShadow=true}});
   s.add(sculptures);
   addMonumentFooting(T,s,finish);
 }
 const fountain=makeFountain(T,s,sculptures);
 const world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);
 addFixedColliders(world);
 const hall=makeHall(T,model,stonework,world,leaves);
 const perimeter=addPerimeter(T,s,world,finish);
 walkSurfaces.push(...perimeter.floors);
 const garden=addGarden(T,s,world,importedGravel,finish);
 walkSurfaces.push(...garden.floors);
 const backdrop=addBackdrop(T,s),{ground}=backdrop;
 s.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,3), hits=[];
 const floorHeight=(x,z)=>{
   const entry=hallFloor(x,z);
   if(entry!==null)return entry;
   const terrain=garden.heightAt(x,z);
   if(terrain!==null)return terrain;
   ray.ray.origin.set(x,2,z);
   ray.intersectObjects(walkSurfaces,false,hits);
   const y=hits[0]?.point.y ?? ground.position.y;
   hits.length=0;
   return y;
 };
 const lighting=makeLighting(T,r,s,world,floorHeight);
 lighting.registerWindows(perimeter.windows);
 const player=createPlayer(T,c,world,floorHeight);
 s.add(player.body);
 const canvas=r.domElement;
 canvas.tabIndex=-1;
 canvas.setAttribute('aria-label','3D-Rundgang');
 const action=$('enter');
 const active=()=>document.body.dataset.state==='playing';
 let frame=0, dirty=true,lastDoorTime=null,activePortal='';
 function schedule(){if(!frame) frame=requestAnimationFrame(render)}
 function refresh(){dirty=true;schedule()}
 const ghoulNotice=$('ghoul-notice'),ghoulAction=$('ghoul-action'),ghoulText=$('ghoul-text');
 let noticeTimer=0,roundLabel='';
 function announceGhoul(text,kind){
   clearTimeout(noticeTimer);
   ghoulNotice.textContent=text;ghoulNotice.dataset.kind=kind;ghoulNotice.hidden=false;
   noticeTimer=setTimeout(()=>{ghoulNotice.hidden=true},kind==='hurt'?1050:kind==='progress'?1600:4100);
   refresh();
 }
 const round=ghoulRound(T,s,world,floorHeight,announceGhoul);
 const viewmodel=makeViewmodel(T,s,c,player,world,floorHeight,canvas,active,refresh,
   ()=>hall.allowGear(player.body.position),round);
 const desktopRound=()=>document.body.dataset.input!=='touch';
 function roundPrompt(){
   const label=active()&&desktopRound()?round.prompt(player.body.position):'';
   if(label===roundLabel)return;
   roundLabel=label;ghoulAction.hidden=!label;
   if(label)ghoulText.textContent=label;
 }
 function startRound(){
   if(!active()||!desktopRound())return;
   if(round.begin(player.body.position)){roundPrompt();refresh()}
 }
 ghoulAction.addEventListener('click',()=>{startRound();canvas.focus({preventScroll:true})});
 window.addEventListener('keydown',e=>{
   if(!active()||e.code!=='KeyR'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||!roundLabel)return;
   e.preventDefault();startRound();
 });
 const portalAction=$('portal-action'),portalText=$('portal-text');
 function doorPrompt(){
   const target=active()?hall.targetFor(player,c):null;
   const usable=target&&hall.usable(target,player);
   const uid=target?target.id+':'+target.target+':'+usable:'';
   if(uid===activePortal)return;
   activePortal=uid;portalAction.hidden=!target;
   if(target){
     portalAction.disabled=!usable;
     portalText.textContent=!usable?'Tür offen':(target.target===1?'Tür schließen':'Tür öffnen')+' · '+target.label;
   }
 }
 function handleDoor(){
   if(!active()||!hall.commit(player,c))return;
   doorPrompt();refresh();
 }
 window.addEventListener('keydown',event=>{
   if(!active()||event.code!=='KeyE'||event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
   if(event.target.closest?.('button:not(#portal-action), input, textarea, select, a'))return;
   event.preventDefault();handleDoor();
 });
 portalAction.addEventListener('click',()=>{handleDoor();canvas.focus({preventScroll:true})});
 function draw(){const p=player.body.position;lighting.update(p);garden.update(p,performance.now());fountain.syncView?.(c);r.render(s,c);viewmodel.draw(r);}
 function render(time){
   frame=0;
   if(active()){
     if(input.tick(time))dirty=true;
     if(round.tick(time,player.body.position))dirty=true;
     const dt=lastDoorTime===null?0:Math.min(.065,(time-lastDoorTime)*.001);lastDoorTime=time;
     const state=hall.update(dt,player.body.position);
     if(state.changed)dirty=true;
     if(state.shadow)r.shadowMap.needsUpdate=true;
     doorPrompt();
     roundPrompt();
     if(fountain.tick(time,c))dirty=true;
     if(viewmodel.update(time))dirty=true;
   }
   if(dirty){draw();dirty=false}
   if(active()) schedule();
 }
 function pause(focus=false){
   if(!active())return;
   document.body.dataset.state='paused';
   input.clear();fountain.stop?.();viewmodel.stop();round.stop();lastDoorTime=null;doorPrompt();roundPrompt();
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
   backdrop.setPreset(id);
   fountain.setPreset(id);
   hall.setPreset(id);hall.update(0,player.body.position);
   viewmodel.preset(id);
   for(const b of choices)b.setAttribute('aria-pressed',String(b.dataset.light===id));
   if(remember){try{localStorage.setItem('schlosser.light',id)}catch{}}
   return true;
 }
 let last=DEFAULT_LIGHT;
 try{last=localStorage.getItem('schlosser.light')||DEFAULT_LIGHT}catch{}
 // Visitors with the retired setting fall back to sunset.
 if(!selectLight(last))selectLight(DEFAULT_LIGHT,true);
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
 if(err.asset)$('error-text').textContent='Die Projektdatei '+err.asset+' konnte nicht geladen werden. Bitte den lokalen Build oder die veröffentlichte Version vollständig neu laden.';
 else if (!window.WebGL2RenderingContext || /WebGL context/.test(err.message)) {
   $('error-text').textContent='Für den Rundgang braucht dein Browser WebGL 2. Aktiviere die Hardwarebeschleunigung oder versuche es mit einem anderen Browser.';
 }
 document.body.dataset.state='error';
});
