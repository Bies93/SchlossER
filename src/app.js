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
import {palaceExterior,renewPalaceRoof} from './palace-exterior.js';
import {sculptureMaterials} from './surface-detail.js';
import {polishFriedrichMonument} from './palace-detail.js';
import {cutPalaceOpenings} from './palace-openings.js';
import {addPortalFacade,palaceMaterials} from './palace-facade.js';
import {hallFloor,makeHall} from './palace-hall.js';
import {makeFountain} from './fountain.js';
import {makeViewmodel} from './viewmodel.js';
import {ghoulRound} from './ghoul-round.js';
import {makeAudio} from './audio.js';
import {addParkStair,wcHeightAt,wcCeilingAt,wcCameraMode,isWcInterior,WC_LAYER} from './park-stair.js';
import {LAB_LAYER,labFloorAt,labCeilingAt,clubMix} from './lab-layout.js';
import {labCameraMode} from './lab-wing.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {makeMoosfunk} from './moosfunk-quest.js';
import {ORB,X as wcX,Z as wcZ,wcZoneAt} from './park-wc-layout.js';
import {CHAPEL_SOURCE,CHAPEL_TRACK,inChapelHearing} from './lab-rites.js';
import {addChapter} from './chapter.js';
import {CHAPTER_LAYER} from './chapter-layout.js';

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
 const image=url=>url?tl.loadAsync(url).catch(()=>null):null;
 const [model,mapPairs,sculptures,poster,seal]=await Promise.all([decode('schloss.glb',payload.model),mapsP,
   decode('skulpturen.glb',payload.sculptures),image(payload.galleryPoster),image(payload.lodgeSeal)]);
 for(const tex of [poster,seal])if(tex){tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,r.capabilities.getMaxAnisotropy());}
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 const exterior=palaceExterior(T,finish);
 const walkSurfaces=[], importedGravel=[];
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name??'';o.material=exterior(key)??o.material;
 // The original broad lawn and plaza are replaced rather than overlaid.
 if(key==='GRAVEL')importedGravel.push(o);
 if(key==='GROUND'||key==='GRASS'||key==='GRAVEL'||key.startsWith('FLOWER_')){o.visible=false;return;}
 o.receiveShadow=true;o.castShadow=key!=='GLASS';});s.add(model);
 renewPalaceRoof(T,model,finish);
 cutPalaceOpenings(T,model);
 const stonework=palaceMaterials(T,exterior),leaves=addPortalFacade(T,model,stonework);
 if(sculptures){
   sculptureMaterials(sculptures,finish);
   sculptures.traverse(o=>{if(o.isMesh){o.castShadow=!/Fountain_water|Water_jets|Aerated_spray/i.test(o.name);o.receiveShadow=true}});
   s.add(sculptures);
   const collar=polishFriedrichMonument(T,sculptures);
   if(collar)walkSurfaces.push(collar);
 }
 const fountain=makeFountain(T,s,sculptures);
 // Exterior gate posts and tree trunks never extend into the new rooms.
 let chapter;
 const world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter,p=>!isWcInterior(p)&&!clubMix(p)&&!chapter?.isBelow(p));
 addFixedColliders(world);
 const moosfunk=makeMoosfunk();
 const hall=makeHall(T,model,stonework,world,leaves,poster,seal,moosfunk);
 const perimeter=addPerimeter(T,s,world,finish);
 const wc=addParkStair(T,s,world,moosfunk);
 walkSurfaces.push(...perimeter.floors);
 const garden=addGarden(T,s,world,importedGravel,finish);
 chapter=addChapter(T,s,world,garden);
 walkSurfaces.push(...garden.floors);
 const backdrop=addBackdrop(T,s),{ground}=backdrop;
 s.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,3), hits=[];
 const floorHeight=(x,z,referenceY=0,allowChapter=true)=>{
   if(allowChapter){
     const hideout=chapter.floorAt(x,z,referenceY);
     if(hideout!==null)return hideout;
   }
   const cellar=labFloorAt(x,z,referenceY,hall.lodgeOpen());
   if(cellar!==null)return cellar;
   const stair=wcHeightAt(x,z,referenceY);
   if(stair!==null)return stair;
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
 const audio=makeAudio(()=>{
   c.updateWorldMatrix(true,false);const e=c.matrixWorld.elements;
   return {x:e[12],z:e[14],rightX:e[0],rightZ:e[2]};
 },payload.music,payload.galleryChoir,payload.orbVoice,payload.clubMusic);
 const player=createPlayer(T,c,world,floorHeight,event=>{
   const {kind,x,y,z,foot,power}=event;
   const surface=chapter.isBelow(event)||hallFloor(x,z)!==null||Number.isFinite(Math.min(wcCeilingAt(x,z,y),labCeilingAt(x,z,y)))?'hall':garden.surfaceAt(x,z)??'stone';
   audio.foot(surface,power,kind==='land',foot);
 },(x,z,y)=>Math.min(chapter.ceilingAt(x,z,y),wcCeilingAt(x,z,y),labCeilingAt(x,z,y)));
 s.add(player.body);
 const canvas=r.domElement;
 canvas.tabIndex=-1;
 canvas.setAttribute('aria-label','3D-Rundgang');
 const action=$('enter');
 const active=()=>document.body.dataset.state==='playing';
 const gameModes={
   walk:{start:'Rundgang starten',description:'Schloss und Garten frei erkunden, ohne Waffen und Gegner.'},
   ghouls:{start:'Ghoul-Modus starten',description:'Mit Impulsgeräten. Fünf Ghoule warten im Schlossgarten.'}
 };
 let chosenMode='walk',gameMode='walk',firstRound=false;
 const combat=()=>gameMode==='ghouls';
 const mouse=matchMedia('(any-pointer: fine)'),coarse=matchMedia('(pointer: coarse)');
 const combatAvailable=()=>mouse.matches||!coarse.matches;
 const desktopRound=()=>document.body.dataset.input!=='touch';
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
 const round=ghoulRound(T,s,world,(x,z)=>floorHeight(x,z,0,false),announceGhoul,audio.creature);
 const viewmodel=makeViewmodel(T,s,c,player,world,floorHeight,canvas,active,refresh,
   ()=>{const p=player.body.position;return combat()&&desktopRound()&&hall.allowGear(p)
     &&!(p.y<-.42&&wcHeightAt(p.x,p.z,p.y)!==null);},round,audio.shot,audio.pulseContact);
 viewmodel.setCombat(false);
 const modeButtons=[...$('game-mode').querySelectorAll('[data-mode]')];
 function chooseMode(id){
   if(!Object.hasOwn(gameModes,id)||id==='ghouls'&&!combatAvailable())id='walk';
   chosenMode=id;
   for(const b of modeButtons){
     b.disabled=b.dataset.mode==='ghouls'&&!combatAvailable();
     b.setAttribute('aria-pressed',String(b.dataset.mode===id));
   }
   $('start-mode').textContent=gameModes[id].start;
   $('mode-description').textContent=gameModes[id].description+
     (!combatAvailable()?' Der Ghoul-Modus benötigt Maus und Tastatur.':'');
 }
 for(const b of modeButtons)b.onclick=()=>chooseMode(b.dataset.mode);
 mouse.addEventListener('change',()=>chooseMode(chosenMode));
 coarse.addEventListener('change',()=>chooseMode(chosenMode));
 chooseMode('walk');
 function applyMode(){
   if(chosenMode===gameMode)return;
   gameMode=chosenMode;firstRound=combat();
   round.reset();viewmodel.setCombat(combat());audio.mode(combat());
   clearTimeout(noticeTimer);ghoulNotice.hidden=true;
   document.body.dataset.mode=gameMode;
 }
 function roundPrompt(){
   const label=active()&&combat()&&desktopRound()&&!firstRound?round.prompt(player.body.position):'';
   if(label===roundLabel)return;
   roundLabel=label;ghoulAction.hidden=!label;
   if(label)ghoulText.textContent=label;
 }
 function startRound(){
   if(!active()||!combat()||!desktopRound())return;
   if(round.begin(player.body.position)){roundPrompt();refresh()}
 }
 ghoulAction.addEventListener('click',()=>{startRound();canvas.focus({preventScroll:true})});
 window.addEventListener('keydown',e=>{
   if(!active()||e.code!=='KeyR'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||!roundLabel)return;
   e.preventDefault();startRound();
 });
 const portalAction=$('portal-action'),portalText=$('portal-text');
 const caption=$('moosfunk-caption');
 let captionTimer=0,chapelTime=null,chapelTake=0;
 function hideCaption(){clearTimeout(captionTimer);caption.hidden=true;}
 function showCaption(text,duration){
   hideCaption();caption.textContent=text;caption.hidden=false;
   captionTimer=setTimeout(hideCaption,duration);
 }
 function leaveChapel(){
   if(chapelTime===null)return;
   chapelTime=null;chapelTake=0;audio.stopChapel();hideCaption();
 }
 function chapelCue(time,pos){
   if(!inChapelHearing(pos,chapelTime===null?4.13:4.58)){leaveChapel();return;}
   chapelTime??=time;
   if(chapelTake>=CHAPEL_TRACK.length||time-chapelTime<chapelTake*6350)return;
   const take=chapelTake++,line=CHAPEL_TRACK[take];
   showCaption('Band 04 · Aufnahme '+(take+1)+' — „'+line+'“',6090);
   audio.playChapel(CHAPEL_SOURCE,line,take);
 }
 const interactionLook=new T.Vector3();
 const orbAt={x:wcX-ORB.v,z:wcZ+ORB.u},orbLine='Fürchte nicht die Stille. Noch ehe der erste Stein fiel, kannte ich deinen Namen. Tritt ins Licht.';
 let orbHeard=false,orbSince=null;
 function orbCue(time,pos){
   const dx=orbAt.x-pos.x,dz=orbAt.z-pos.z,d=Math.hypot(dx,dz);
   if(d>4.4||wcZoneAt(pos.z-wcZ,wcX-pos.x,pos.y)!=='deepOrb'){
     if(orbHeard){audio.stopOrb();hideCaption();}
     orbSince=null;orbHeard=false;return;
   }
   if(orbHeard)return;
   const look=c.getWorldDirection(interactionLook);
   if(d>3.15||(dx*look.x+dz*look.z)/Math.max(.01,d)<.48){orbSince=null;return;}
   orbSince??=time;
   if(time-orbSince<450)return;
   orbHeard=true;showCaption('Stimme des Orbs — „'+orbLine+'“',13000);audio.playOrb(orbAt);
 }
 const localTarget=()=>{
   const pos=player.body.position,look=c.getWorldDirection(interactionLook);
   return chapter.target(pos,look)??moosfunk.target(pos,look)??wc.target(pos,look);
 };
 const choirLabels={ready:'Chor erklingen lassen',loading:'Chor wird geladen …',playing:'Der Chor erklingt',
   muted:'Für den Chor den Ton einschalten',retry:'Chor erneut laden',unavailable:'Chor nicht verfügbar'};
 function doorPrompt(){
   const target=active()?(localTarget()??hall.targetFor(player,c)):null;
   const status=target?.id==='gallery-choir'?audio.choirStatus():'';
   const usable=target&&(target.action||hall.usable(target,player))&&(!status||status==='ready'||status==='retry');
   const uid=target?target.id+':'+target.target+':'+usable+':'+status+':'+target.label:'';
   if(uid===activePortal)return;
   activePortal=uid;portalAction.hidden=!target;
   if(target){
     portalAction.disabled=!usable;
     portalText.textContent=target.action?target.label:target.prompt?target.prompt(usable):status?choirLabels[status]:target.id==='lab-secret'
       ?(target.target===0?'Lockeres Buch untersuchen':usable?'Regal zurückschieben':'Regal offen')
       :!usable?(target.usable?'Durchgang freimachen · '+target.label:'Tür offen'):(target.target===1?'Tür schließen':'Tür öffnen')+' · '+target.label;
   }
 }
 function handleDoor(){
   if(!active())return;
   const local=localTarget();
   if(local?.action){
     const notice=moosfunk.use(local);if(!notice)return;
     showCaption(notice.text,notice.voice?9600:7800);
     if(notice.voice)audio.playMoosfunk(notice.where,notice.voice);
     doorPrompt();refresh();return;
   }
   if(local){
     if(!local.usable(player.body.position))return;
     local.target=1-local.target;
   }
   const target=local??hall.commit(player,c);if(!target)return;
   if(target.id==='gallery-choir')audio.playChoir({x:target.x,z:target.z});
   if(target.id==='gallery-hatch'||target.id==='chapter-bench')audio.hatch(target.target===1);
   doorPrompt();refresh();
 }
 window.addEventListener('keydown',event=>{
   if(!active()||event.code!=='KeyE'||event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
   if(event.target.closest?.('button:not(#portal-action), input, textarea, select, a'))return;
   event.preventDefault();handleDoor();
 });
 portalAction.addEventListener('click',()=>{handleDoor();canvas.focus({preventScroll:true})});
 function draw(){
   const p=player.body.position,mode=labCameraMode(p);
   const wcMode=wcCameraMode(p),chapterMode=chapter.mode(p),surface=mode!=='cellar'&&wcMode!=='inside'&&chapterMode!=='inside',cellar=hall.labVisible();
   wc.update(0,p);
   chapter.update(0,p);
   if(surface){
     c.layers.set(0);
     lighting.update(p);garden.update(p,performance.now());fountain.syncView?.(c);
     r.render(s,c);
   }
   // At the doorway share depth, not lighting. A combined camera mask
   // would compile new palace shaders for a different number of lights.
   if(chapterMode!=='inside'&&(cellar||mode==='cellar')){
     c.layers.set(LAB_LAYER);const clear=r.autoClear;
     try{if(surface)r.autoClear=false;r.render(s,c);}
     finally{r.autoClear=clear;c.layers.set(0);}
   }
   if(chapterMode!=='inside'&&wcMode!=='surface'){
     c.layers.set(WC_LAYER);const clear=r.autoClear;
     try{if(surface)r.autoClear=false;r.render(s,c);}
     finally{r.autoClear=clear;c.layers.set(0);}
   }
   if(chapter.visible()&&(surface||chapterMode==='inside')){
     c.layers.set(CHAPTER_LAYER);const clear=r.autoClear;
     try{if(surface)r.autoClear=false;r.render(s,c);}
     finally{r.autoClear=clear;c.layers.set(0);}
   }
   viewmodel.draw(r);
 }
 function render(time){
   frame=0;
   if(active()){
     if(input.tick(time))dirty=true;
     audio.ambience(player.body.position);audio.club(clubMix(player.body.position));
     chapelCue(time,player.body.position);
     orbCue(time,player.body.position);
     if(combat()&&desktopRound()){
       if(firstRound&&round.prompt(player.body.position)){
         firstRound=false;
         if(round.begin(player.body.position))dirty=true;
       }
       if(round.tick(time,player.body.position))dirty=true;
     }
     const dt=lastDoorTime===null?0:Math.min(.065,(time-lastDoorTime)*.001);lastDoorTime=time;
     const state=hall.update(dt,player.body.position);
     if(state.changed)dirty=true;
     if(wc.update(dt,player.body.position))dirty=true;
     if(chapter.update(dt,player.body.position)){dirty=true;r.shadowMap.needsUpdate=true;}
     if(state.shadow)r.shadowMap.needsUpdate=true;
     doorPrompt();
     roundPrompt();
     if(chapter.mode(player.body.position)!=='inside'&&labCameraMode(player.body.position)!=='cellar'&&fountain.tick(time,c))dirty=true;
     if(viewmodel.update(time))dirty=true;
   }
   if(dirty){draw();dirty=false}
   if(active()) schedule();
 }
 function pause(focus=false){
   if(!active())return;
   document.body.dataset.state='paused';
   leaveChapel();orbSince=null;hideCaption();
   input.clear();fountain.stop?.();viewmodel.stop();round.stop();audio.pause();lastDoorTime=null;doorPrompt();roundPrompt();
   if(focus) action.focus({preventScroll:true});
 }
 const input=bindPlayerInput({
   canvas,pad:$('stick'),jumpButton:$('jump'),player,active,pause:()=>pause(!document.hidden && document.hasFocus()),
   refresh,mode:value=>{document.body.dataset.input=value}
 });
 action.onclick=event=>{
   if(!combatAvailable()&&chosenMode==='ghouls')chooseMode('walk');
   applyMode();
   audio.play();
   document.body.dataset.state='playing';
   input.start({
     touch:!combat()&&(event.pointerType==='touch'||coarse.matches),
     lock:event.detail>0
   });
   schedule();
 };
 $('pause').onclick=()=>pause(true);
 const audioButton=$('audio-toggle');
 function audioStatus(){
   const on=audio.settings().enabled;
   audioButton.setAttribute('aria-pressed',String(on));
   audioButton.textContent=on?'Ton an':'Ton aus';
 }
 audioButton.onclick=()=>{audio.toggle();audioStatus()};
 window.addEventListener('keydown',e=>{
   if(!active()||e.code!=='KeyM'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
   audio.toggle();audioStatus();
 });
 for(const input of $('audio-settings').querySelectorAll('input[type=range]')){
   const key=input.dataset.audio;
   input.value=String(audio.settings()[key]*100);
   input.addEventListener('input',()=>audio.volume(key,Number(input.value)/100));
 }
 audioStatus();
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
 $('loading-text').textContent='Die 3D-Szene wird vorbereitet …';
 for(const tex of [poster,seal])if(tex)r.initTexture(tex);
 await hall.prepareLab(r,s);
 await wc.prepare(r,s);
 await chapter.prepare(r);
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
