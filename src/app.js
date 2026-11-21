import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {collisionWorld} from './collision.js';
import {createPlayer, bindPlayerInput} from './player.js';
import {addFixedColliders, BOUNDS, PLAYER, insidePerimeter} from './world-layout.js';
import {addPerimeter} from './perimeter.js';
import {addBackdrop} from './backdrop.js';
import {DEFAULT_LIGHT,makeLighting} from './lighting.js';
import {addGarden} from './garden.js';
import {addPalaceRavens} from './palace-ravens.js';
import {addGardenMeditation} from './garden-meditation.js';
import {surfaceLibrary} from './palace.js';
import {palaceExterior,renewPalaceRoof} from './palace-exterior.js';
import {sculptureMaterials} from './surface-detail.js';
import {polishFriedrichMonument} from './palace-detail.js';
import {cutPalaceOpenings} from './palace-openings.js';
import {addPortalFacade,palaceMaterials} from './palace-facade.js';
import {hallFloor,makeHall} from './palace-hall.js';
import {makeFountain} from './fountain.js';
import {addPauli} from './pauli-fountain.js';
import {makeViewmodel} from './viewmodel.js';
import {bindTouchEquipment} from './touch-equipment.js';
import {ghoulRound} from './ghoul-round.js';
import {makeAudio} from './audio.js';
import {addParkStair,wcHeightAt,wcCeilingAt,wcCameraMode,isWcInterior,WC_LAYER} from './park-stair.js';
import {LAB_LAYER,LAB_CUT,labFloorAt,labCeilingAt,clubMix} from './lab-layout.js';
import {labCameraMode} from './lab-wing.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {makeMoosfunk} from './moosfunk-quest.js';
import {ORB,WC_CUT,X as wcX,Z as wcZ,wcZoneAt} from './park-wc-layout.js';
import {CHAPEL_SOURCE,CHAPEL_TRACK,inChapelHearing} from './lab-rites.js';
import {addChapter} from './chapter.js';
import {CHAPTER_LAYER,CHAPTER_STEP} from './chapter-layout.js';
import {SOUTH_HATCH} from './palace-openings.js';
import {installHumans} from './human-character.js';
import {npcFocus} from './npc-focus.js';
import {bindNpcDialogue} from './npc-dialogue-ui.js';
import {sceneQuery} from './scene-query.js';
import {combatTargets} from './combat-targets.js';
import {weaponPickups} from './weapon-pickups.js';
import {addPalaceUpper,UPPER_LAYER} from './palace-upper.js';
import {ATTIC_LAYER,ATTIC_WELL,ATTIC_FLOOR} from './palace-attic-layout.js';
import {BERG_CEILING,BERG_FLOOR,BERG_LAYER,bergInside,bergPlan} from './berg-layout.js';
import {addBergTavern} from './berg-tavern.js';
import {addBergPuddle} from './berg-puddle.js';
import {addWeatherZero} from './weather-zero.js';

const $ = id => document.getElementById(id);
const stage=document.querySelector('main');
let payload=JSON.parse($('assets').textContent);
$('assets').remove();
const about=$('about');
$('info').onclick=()=>about.showModal();
const GRAPHICS={
 fast:{dpr:1,shadow:1536},normal:{dpr:1.35,shadow:2048},high:{dpr:1.6,shadow:2048}
};
function showLoadingStep(index,text){
 $('loading-text').textContent=text;
 const progress=$('loading-progress');
 progress.style.setProperty('--loaded',String(index/4));
 progress.setAttribute('aria-valuenow',index);
 progress.setAttribute('aria-valuetext',text);
 for(const [i,step] of Array.from($('loading-steps').children).entries()){
   step.toggleAttribute('data-done',i<index);
   if(i===index)step.setAttribute('aria-current','step');
   else step.removeAttribute('aria-current');
 }
}
// Let the next loading message paint before generating the world in one
// synchronous batch. Don't wait for a render frame in a background tab.
function paintLoadingStep(){
 if(document.hidden)return Promise.resolve();
 return new Promise(resolve=>{
   const frame=requestAnimationFrame(()=>{clearTimeout(fallback);setTimeout(resolve,0);});
   const fallback=setTimeout(()=>{cancelAnimationFrame(frame);resolve();},48);
 });
}
async function start(){
 const bootTime=performance.now();
 const qualityControl=$('graphics-quality');
 let quality='normal';
 try{
   const saved=localStorage.getItem('schlosser.graphics');
   if(Object.hasOwn(GRAPHICS,saved))quality=saved;
 }catch{}
 qualityControl.value=quality;
 const r=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio,GRAPHICS[quality].dpr));
 $('canvas').append(r.domElement);
 const s=new T.Scene(), c=new T.PerspectiveCamera(65,1,.08,1250);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),tl=new T.TextureLoader();
 const need=async (name,read)=>{
   try{return await read()}catch(cause){const e=new Error('Projektdatei konnte nicht gelesen werden: '+name,{cause});e.asset=name;throw e;}
 };
 const decode=(name,url)=>need(name,()=>loader.loadAsync(url).then(g=>g.scene));
 const mapsP=Promise.all(Object.entries(payload.maps).map(async([name,layers])=>[name,Object.fromEntries(await Promise.all(Object.entries(layers).map(async([k,src])=>[k,await need(name+'_'+k+'.webp',()=>tl.loadAsync(src))])))]));
 const image=url=>url?tl.loadAsync(url).catch(()=>null):null;
 const [model,mapPairs,sculptures,poster,seal,humans]=await Promise.all([decode('schloss.glb',payload.model),mapsP,
   decode('skulpturen.glb',payload.sculptures),image(payload.galleryPoster),image(payload.lodgeSeal),decode('human-cast.glb',payload.humans)]);
 performance.measure('schlosser: assets',{start:bootTime,end:performance.now()});
 showLoadingStep(1,'Die Spielwelt entsteht …');
 await paintLoadingStep();
 installHumans(T,humans);
 for(const tex of [poster,seal])if(tex){tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,r.capabilities.getMaxAnisotropy());}
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 const exterior=palaceExterior(T,finish);
 const walkSurfaces=[];
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name??'';o.material=exterior(key)??o.material;
 // The original broad lawn and plaza are replaced rather than overlaid.
 if(key==='GROUND'||key==='GRASS'||key==='GRAVEL'||key.startsWith('FLOWER_')){o.visible=false;o.userData.noSceneQuery=true;return;}
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
 let chapter,upper;
 const world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter,p=>!isWcInterior(p)&&!clubMix(p)&&!chapter?.isBelow(p));
 const upperWorld=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);
 const atticWorld=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);
 const bergWorld=collisionWorld(BOUNDS,PLAYER.radius,bergPlan);
 const localWorld=p=>bergInside(p)?bergWorld:upper.insideAttic(p)?atticWorld:upper.inside(p)?upperWorld:world;
 addFixedColliders(world);
 const pauli=addPauli(T,s,world);
 const moosfunk=makeMoosfunk();
 const hall=makeHall(T,model,stonework,world,leaves,poster,seal,moosfunk);
 const perimeter=addPerimeter(T,s,world,finish);
 const wc=addParkStair(T,s,world,moosfunk);
 walkSurfaces.push(...perimeter.floors);
 const garden=addGarden(T,s,world,finish);
 chapter=addChapter(T,s,world,garden);
 walkSurfaces.push(...garden.floors);
 const backdrop=addBackdrop(T,s),{ground}=backdrop;
 s.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,3), hits=[];
 const floorHeight=(x,z,referenceY=0,allowChapter=true)=>{
   if(bergInside({x,y:referenceY,z}))return BERG_FLOOR;
   const upstairs=upper?.floorAt(x,z,referenceY);
   if(upstairs!=null)return upstairs;
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
   const marketStep=pauli.step(x,z,referenceY);
   if(marketStep!==null)return marketStep;
   ray.ray.origin.set(x,2,z);
   ray.intersectObjects(walkSurfaces,false,hits);
   const y=hits[0]?.point.y ?? ground.position.y;
   hits.length=0;
   return y;
 };
 upper=addPalaceUpper(T,s,model,upperWorld,atticWorld,stonework,(x,z)=>floorHeight(x,z));
 const lighting=makeLighting(T,r,s,world,floorHeight);
 lighting.setShadowSize(GRAPHICS[quality].shadow);
 lighting.registerWindows(perimeter.windows);
 const audio=makeAudio(()=>{
   c.updateWorldMatrix(true,false);const e=c.matrixWorld.elements;
   return {x:e[12],y:e[13],z:e[14],rightX:e[0],rightZ:e[2]};
 },payload.music,payload.galleryChoir,payload.orbVoice,payload.clubMusic,payload.prisonerVoice,payload.npcVoices,payload.weaponSounds,payload.ravenCall,payload.bergMusic);
 // Audio owns the URLs it can still request. Do not pin a second copy of the
 // finished GLBs/textures as base64 strings in the standalone version.
 payload=null;
 const tavern=addBergTavern(T,s,bergWorld),puddle=addBergPuddle(T,s,world,garden.heightAt,tavern);
 const weather=addWeatherZero(T,s,world,garden.heightAt,audio);
 const ravens=addPalaceRavens(T,s,(x,z)=>floorHeight(x,z),audio.raven);
 const meditation=addGardenMeditation(T,s,world,(x,z)=>floorHeight(x,z));
 // Optional effects still prefetch, but slow audio cannot hold up Start.
 void audio.preloadWeapons();
 const player=createPlayer(T,c,world,floorHeight,event=>{
   const {kind,x,y,z,foot,power}=event;
   if(bergInside(event)){audio.foot('hall',power,kind==='land',foot);return;}
   if(kind==='climb'||upper.inside(event)){audio.foot('wood',power,kind==='land',foot);return;}
   const surface=chapter.isBelow(event)||hallFloor(x,z)!==null||Number.isFinite(Math.min(wcCeilingAt(x,z,y),labCeilingAt(x,z,y)))?'hall':garden.surfaceAt(x,z)??'stone';
   audio.foot(surface,power,kind==='land',foot);
 },(x,z,y)=>bergInside({x,y,z})?BERG_CEILING:Math.min(chapter.ceilingAt(x,z,y),wcCeilingAt(x,z,y),labCeilingAt(x,z,y),upper.ceilingAt(x,z,y)),
   {moveWorld:localWorld,traverse:upper.step,stepDown:(x,z,y)=>upper.inside({x,y,z})?upper.downSnap(x,z):null});
 s.add(player.body);
 const canvas=r.domElement;
 canvas.tabIndex=-1;
 canvas.setAttribute('aria-label','3D-Spielwelt');
 const action=$('enter');
 const active=()=>document.body.dataset.state==='playing';
 let conversation=null;
 const dialogueOpen=()=>Boolean(conversation?.pending()),controls=()=>active()&&!dialogueOpen();
 const layerPasses=[0,LAB_LAYER,WC_LAYER,CHAPTER_LAYER,UPPER_LAYER,ATTIC_LAYER,BERG_LAYER];
 const coarse=matchMedia('(pointer: coarse)'),ghoulOption=$('with-ghouls');
 let started=false,ghoulsEnabled=false,firstRound=false,spawnCheck=0,ghoulsWarming=null,ghoulsReady=false;
 let frame=0, dirty=true,lastDoorTime=null,activePortal='';
 function schedule(){if(!frame) frame=requestAnimationFrame(render)}
 function refresh(){dirty=true;schedule()}
 const ghoulNotice=$('ghoul-notice');
 let noticeTimer=0;
 function announceGhoul(text,kind){
   clearTimeout(noticeTimer);
   ghoulNotice.textContent=text;ghoulNotice.dataset.kind=kind;ghoulNotice.hidden=false;
   noticeTimer=setTimeout(()=>{ghoulNotice.hidden=true},kind==='hurt'?1050:kind==='progress'?1600:4100);
   refresh();
 }
 const round=ghoulRound(T,s,world,(x,z)=>floorHeight(x,z,0,false),announceGhoul,audio.creature);
 const geometryQuery=sceneQuery(T,s,player.body),layerContext={mask:1,layer:0};
 function activeLayers(){
   const p=player.body.position;
   if(bergInside(p)){layerContext.layer=BERG_LAYER;layerContext.mask=1<<BERG_LAYER;return layerContext;}
   if(upper.insideAttic(p)){
     layerContext.layer=ATTIC_LAYER;layerContext.mask=(1<<ATTIC_LAYER)|(upper.stairLink(p)?1<<UPPER_LAYER:0);
     return layerContext;
   }
   if(upper.inside(p)){
     layerContext.layer=UPPER_LAYER;layerContext.mask=(1<<UPPER_LAYER)|(upper.seeGarden(p)?1:0);
     if(upper.stairLink(p))layerContext.mask|=1<<ATTIC_LAYER;
     return layerContext;
   }
   const cm=chapter.mode(p),wm=wcCameraMode(p),lm=labCameraMode(p);
   const surface=cm!=='inside'&&wm!=='inside'&&lm!=='cellar';
   // Body/interaction layer and optical visibility are separate: turning
   // around in the corridor must not erase the outside of the open shaft.
   const seesExit=wm==='inside'&&wc.seesExit()||cm==='inside'&&chapter.seesExit()||lm==='cellar'&&hall.seesLabExit();
   layerContext.mask=surface||seesExit?1:0;
   if(lm==='cellar'||surface&&hall.labVisible())layerContext.mask|=1<<LAB_LAYER;
   if(wm!=='surface'&&(surface||wm==='inside'))layerContext.mask|=1<<WC_LAYER;
   if(chapter.visible()&&(surface||cm==='inside'))layerContext.mask|=1<<CHAPTER_LAYER;
   if(surface&&upper.visible())layerContext.mask|=1<<UPPER_LAYER;
   layerContext.layer=cm==='inside'||cm==='threshold'&&p.y<-.38?CHAPTER_LAYER:
     wm==='inside'||wm!=='surface'&&p.y<-.38?WC_LAYER:lm==='cellar'||lm==='threshold'&&p.y<-.38?LAB_LAYER:0;
   return layerContext;
 }
 const targetWorld={blocked(x,z,y){return localWorld({x,y,z}).blocked(x,z,y);}};
 const targets=combatTargets(T,geometryQuery,round,targetWorld,floorHeight,id=>{
   if(audio.npcTalking(id)){audio.stopNpc(id);hideCaption();}
   if(conversation?.pending()?.id===id)conversation.close('interrupt');
   if(id==='hubert')leavePrison();
   if(id==='bergUdo')audio.berg(bergInside(player.body.position),false);
   names.sample(performance.now(),true);
 },ravens);
 const viewmodel=makeViewmodel(T,s,c,player,world,floorHeight,canvas,controls,refresh,
   undefined,targets,
   kind=>{const p=player.body.position;audio.shot(kind,activeLayers().layer!==0||hallFloor(p.x,p.z)!==null);},
   audio.shotContact,audio.weaponAction,geometryQuery,activeLayers);
 const isTouch=()=>document.body.dataset.input==='touch';
 const touchEquipment=bindTouchEquipment({fireButton:$('touch-fire'),switchButton:$('touch-weapon'),
   weaponName:$('touch-weapon-name'),reticle:$('touch-reticle'),viewmodel,enabled:()=>controls()&&isTouch()});
 const pickups=weaponPickups(T,viewmodel,wc,chapter,geometryQuery,s);
 const portalAction=$('portal-action'),portalText=$('portal-text');
 const caption=$('moosfunk-caption');
 const names=npcFocus(T,s,c,player.body,$('npc-name'),()=>activeLayers().mask,geometryQuery);
 let captionTimer=0,captionId=0,chapelTime=null,chapelTake=0;
 function hideCaption(){clearTimeout(captionTimer);captionId++;caption.hidden=true;}
 function showCaption(text,duration){
   hideCaption();caption.textContent=text;caption.hidden=false;
   captionTimer=setTimeout(hideCaption,duration);
   return captionId;
 }
 function npcDialogue(speech){
   if(!speech)return;
   if(speech.choices){conversation.open(speech);return;}
   if(speech.id==='hubert'){
     const at=chapter.prisonerAt(player.body.position);
     if(!at||prisonerCaption!==null)return;
     prisonerCaption=showCaption(speech.name+': „'+speech.line+'“',5350);
     chapter.prisonerSpeaks();audio.playPrisoner(at);return;
   }
   const text=speech.stageDirection?speech.line:speech.name+': „'+speech.line+'“';
   const id=showCaption(text,Math.max(5500,speech.line.length*68));
   if(speech.id.startsWith('crown')){
     audio.crownCue('voice',speech.at,speech.line);speech.speakFor?.(speech.line.length*.059);return;
   }
   audio.playNpc(speech.id,speech.at,seconds=>{
     if(!active()||captionId!==id)return;
     if(!speech.stageDirection)speech.speakFor?.(seconds);
     clearTimeout(captionTimer);captionTimer=setTimeout(hideCaption,seconds*1000+350);
   },undefined,speech.clip);
 }
 let resumeMouse=false,resumeTouch=false;
 conversation=bindNpcDialogue({
   element:$('npc-dialogue'),
   play:(speech,started,finished,stillValid)=>audio.playNpc(speech.id,speech.at,seconds=>{
     speech.speakFor?.(seconds);started(seconds);
   },finished,speech.clip,stillValid),
   stop:id=>audio.stopNpc(id),
   onOpen(){
     resumeMouse=document.pointerLockElement===canvas;resumeTouch=isTouch();
     document.body.dataset.dialogue='open';
     hideCaption();names.clear();touchEquipment.clear();input.clear();viewmodel.stop();doorPrompt();refresh();
   },
   onClose(reason){
     delete document.body.dataset.dialogue;
     if(active())input.start({touch:resumeTouch,lock:resumeMouse&&reason==='answer'});
     resumeMouse=resumeTouch=false;doorPrompt();refresh();
   },
   onReply(speech,reply){
     if(reply.reaction)speech.react?.(reply.reaction);
     else speech.speakFor?.(2);
     npcDialogue({...speech,...reply,choices:undefined});
   }
 });
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
 const atticRay=new T.Ray(),atticAim=new T.Vector3();
 function atticBlocked(target){
   c.getWorldPosition(atticRay.origin);
   atticAim.set(target.x,target.y,target.z).sub(atticRay.origin);
   const d=atticAim.length();
   return geometryQuery.trace(atticRay.set(atticRay.origin,atticAim.multiplyScalar(1/d)),
     d-.108,1<<ATTIC_LAYER,.045,true)!==Infinity;
 }
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
 let prisonerCaption=null;
 function leavePrison(){
   if(prisonerCaption===null)return;
   if(captionId===prisonerCaption)hideCaption();
   prisonerCaption=null;audio.stopPrisoner();
 }
 const localTarget=()=>{
   const pos=player.body.position,look=c.getWorldDirection(interactionLook);
   if(bergInside(pos))return puddle.target(pos,look,false);
   if(pos.y>-.60&&pos.y<1.75){
     const extra=puddle.target(pos,look,true)??weather.target(pos,look);
     if(extra)return extra;
   }
   const access=upper.target(pos,look);
   if(access?.action==='upper-unlock'&&names.target()?.id==='gardenHannes')return null;
   if(upper.insideAttic(pos))return names.target()?null:upper.atticTarget(pos,look,atticBlocked);
   if(access||upper.inside(pos)||player.motion.climbing)return access??null;
   const target=pickups.target(c,activeLayers().mask)??chapter.target(pos,look)??moosfunk.target(pos,look)??wc.target(pos,look);
   // The console's interaction cone is broader than its face. Focus on
   // Edda takes priority, without making the tape deck itself unavailable.
   return target?.id==='mf-radio'&&names.target()?.id==='guestEdda'?null:target;
 };
 function hallOrPerson(){
   if(player.motion.climbing)return null;
   if(bergInside(player.body.position)||upper.inside(player.body.position))return names.target();
   const hallTarget=hall.targetFor(player,c);
   return hallTarget&&hallTarget.id!=='gallery-choir'?hallTarget:names.target()??hallTarget;
 }
 const choirLabels={ready:'Chor erklingen lassen',loading:'Chor wird geladen …',playing:'Der Chor erklingt',
   muted:'Für den Chor den Ton einschalten',retry:'Chor erneut laden',unavailable:'Chor nicht verfügbar'};
 function doorPrompt(){
   const target=controls()?(localTarget()??hallOrPerson()):null;
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
   if(!controls())return;
   const now=performance.now();names.sample(now,true);
   const local=localTarget();
   if(local?.action==='berg-portal'){
     const leaving=bergInside(player.body.position);
     audio.stopNpc();names.clear();viewmodel.stop();
     player.relocate(puddle.destination(leaving));
     puddle.update(0,player.body.position,leaving);
     audio.berg(!leaving,tavern.musicianAlive());audio.puddleCue();
     $('berg-fade').animate([{opacity:.95},{opacity:0}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?185:630});
     if(!leaving)showCaption('Zur letzten Einkehr · Bergkeller der Letzten Runde',4700);
     else hideCaption();
     doorPrompt();refresh();return;
   }
   if(local?.action==='weather-note'){
     showCaption('Wetterstation 0 — „'+weather.read()+'“',5600);
     doorPrompt();refresh();return;
   }
   if(local?.action==='upper-unlock'){
     if(upper.unlock(now)){
       audio.upperReveal();
       const softened=matchMedia('(prefers-reduced-motion: reduce)').matches,peak=softened?.48:1;
       $('upper-flash').animate([{opacity:0},{opacity:peak,offset:.22},{opacity:peak,offset:.275},{opacity:0}],
         {duration:645,easing:'linear'});
       showCaption('Ein Fenster über dem Gartenportal hat sich geöffnet.',3900);
     }
     doorPrompt();refresh();return;
   }
   if(local?.action==='upper-up'||local?.action==='upper-down'){
     upper.request(local.action==='upper-up'?1:-1);doorPrompt();refresh();return;
   }
   if(local?.action==='crown'){
     const event=upper.atticUse(local.id,now);
     if(event){
       showCaption(event.text,Math.max(3800,event.text.length*63));
       audio.crownCue(event.kind,local,event.voice);
     }
     doorPrompt();refresh();return;
   }
   if(upper.inside(player.body.position)||player.motion.climbing){
     const person=hallOrPerson();
     if(person?.action==='npc-talk'&&!audio.npcTalking(person.id))npcDialogue(names.use(person.id,now));
     doorPrompt();refresh();return;
   }
   if(local?.action==='gear-pickup'){
     const notice=pickups.collect(local,isTouch());
     if(notice)showCaption(notice,4200);
     doorPrompt();refresh();return;
   }
   if(local?.action==='priest-ack'){
     const at=wc.priestAck();if(!at)return;
     showCaption('Orb-Priester: „… hm …“',1550);audio.priestMurmur(at);
     doorPrompt();refresh();return;
   }
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
   const person=local?null:hallOrPerson();
   if(person?.action==='npc-talk'){
     if(!audio.npcTalking(person.id))npcDialogue(names.use(person.id,now));
     doorPrompt();refresh();return;
   }
   const target=local??hall.commit(player,c);if(!target)return;
   if(target.action==='lab-talk'){
     if(!audio.npcTalking(target.id))npcDialogue(hall.staffTalk(player,c));
     doorPrompt();refresh();return;
   }
   if(target.id==='gallery-choir')audio.playChoir({x:target.x,z:target.z});
   if(target.id==='gallery-hatch'||target.id==='chapter-bench')audio.hatch(target.target===1);
   if(target.id==='hubert-cell')audio.grate();
   doorPrompt();refresh();
 }
 window.addEventListener('keydown',event=>{
   if(!controls()||event.code!=='KeyE'||event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
   if(event.target.closest?.('button:not(#portal-action), input, textarea, select, a'))return;
   event.preventDefault();handleDoor();
 });
 portalAction.addEventListener('click',()=>{handleDoor();if(!dialogueOpen())canvas.focus({preventScroll:true})});
 // Conservative bounds include the shaft walls, not just the line at the
 // threshold. Keep adjacent passes out of the render when looking away.
 const box=(x,y,z,X,Y,Z)=>new T.Box3(new T.Vector3(x-.18,y-.18,z-.18),new T.Vector3(X+.18,Y+.18,Z+.18));
 const wcShaft=box(WC_CUT.left,-2.9,WC_CUT.back,WC_CUT.right,.8,WC_CUT.front);
 const benchShaft=box(CHAPTER_STEP.foot,chapter.floor,CHAPTER_STEP.z0,CHAPTER_STEP.top,chapter.floor+5.6,CHAPTER_STEP.z1);
 const northShaft=box(LAB_CUT.left,-4,LAB_CUT.back,LAB_CUT.right,2.7,LAB_CUT.front);
 const southShaft=box(SOUTH_HATCH.x0,-4,SOUTH_HATCH.z0,SOUTH_HATCH.end,1.5,SOUTH_HATCH.z1);
 const atticShaft=box(ATTIC_WELL.left,5.5,ATTIC_WELL.cutNear,ATTIC_WELL.right,ATTIC_FLOOR+.25,ATTIC_WELL.far);
 const frustum=new T.Frustum(),vp=new T.Matrix4();
 const sees=opening=>frustum.intersectsBox(opening);
 function updateView(){
   c.updateWorldMatrix(true,false);frustum.setFromProjectionMatrix(vp.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse));
 }
 function draw(){
   const p=player.body.position,{mask:possible,layer}=activeLayers();
   let mask=possible;updateView();
   if(layer===0){
     if(!sees(wcShaft))mask&=~(1<<WC_LAYER);
     if(!sees(benchShaft))mask&=~(1<<CHAPTER_LAYER);
     if(!sees(northShaft)&&!sees(southShaft))mask&=~(1<<LAB_LAYER);
   }else if(mask&1){
     if(layer===WC_LAYER&&wcCameraMode(p)==='inside'&&!sees(wcShaft)||
        layer===CHAPTER_LAYER&&chapter.mode(p)==='inside'&&!sees(benchShaft)||
        layer===LAB_LAYER&&labCameraMode(p)==='cellar'&&!sees(northShaft)&&!sees(southShaft))mask&=~1;
   }
   if(layer===ATTIC_LAYER&&!sees(atticShaft))mask&=~(1<<UPPER_LAYER);
   if(layer===UPPER_LAYER&&!sees(atticShaft))mask&=~(1<<ATTIC_LAYER);
   if(layer===0)puddle.preview(r,c,p,performance.now());
   viewmodel.bodyLayer(layer);
   if(mask&1){
     lighting.update(p);garden.update(p,performance.now(),quality);
   }
   // One transform update across all passes. At a hatch share depth, not
   // lights, so the existing lighting and material permutations stay intact.
   s.traverseVisible(o=>{
     // A detached layer may return on the next frame. Its leaf matrices
     // will update then; parents still propagate motion to mixed-layer children.
     if(!o.children.length&&!o.isBone&&!(o.layers.mask&mask))return;
     // Invisible room trees were still updating all their local transforms.
     // Skins retain their bind-matrix update; all other parents precede children.
     if(o.isSkinnedMesh)o.updateMatrixWorld();
     else o.updateWorldMatrix(false,false);
   });
   const clear=r.autoClear;
   try{
     for(const pass of layerPasses)if(mask&(1<<pass)){
       c.layers.set(pass);r.render(s,c);r.autoClear=false;
     }
   }finally{r.autoClear=clear;c.layers.set(0);}
   viewmodel.draw(r);
 }
 function render(time){
   frame=0;
   if(active()){
     if(controls()&&input.tick(time))dirty=true;
     audio.ambience(player.body.position);audio.club(clubMix(player.body.position));
     chapelCue(time,player.body.position);
     orbCue(time,player.body.position);
     if(ghoulsEnabled){
       if(firstRound&&ghoulsReady&&time>=spawnCheck&&round.inside(player.body.position)){
         spawnCheck=time+600;if(round.begin(player.body.position)){firstRound=false;dirty=true;}
       }
       if(round.tick(time,player.body.position))dirty=true;
     }
     const dt=lastDoorTime===null?0:Math.min(.065,(time-lastDoorTime)*.001);lastDoorTime=time;
     const state=hall.update(dt,player.body.position,audio.clubPhase());
     if(state.changed)dirty=true;
     if(wc.update(dt,player.body.position))dirty=true;
     if(upper.update(time,player.body.position))dirty=true;
     updateView();
     if(chapter.update(dt,player.body.position,sees(benchShaft)))dirty=true;
     if(chapter.shadowMoved())r.shadowMap.needsUpdate=true;
     const {layer,mask}=activeLayers();
     audio.berg(layer===BERG_LAYER,tavern.musicianAlive());
     if(puddle.update(dt,player.body.position,layer===0,c,audio.bergPhase()))dirty=true;
     if(weather.update(dt,player.body.position,c.getWorldDirection(interactionLook),layer===0))dirty=true;
     if(ravens.update(dt,player.body.position,layer===0))dirty=true;
     if(meditation.update(dt,player.body.position,layer===0))dirty=true;
     geometryQuery.invalidateMoving();
     if(prisonerCaption!==null&&(prisonerCaption!==captionId||!chapter.prisonerAt(player.body.position)))leavePrison();
     if(state.shadow)r.shadowMap.needsUpdate=true;
     if(targets.tick(dt,mask))dirty=true;
     if(dialogueOpen()&&!conversation.pending()?.alive?.())conversation.close('interrupt');
     if(!dialogueOpen())names.sample(time);
     doorPrompt();
     if(mask&1){
       if(fountain.tick(time,c))dirty=true;
       if(pauli.tick(time,c))dirty=true;
     }
     if(viewmodel.update(time))dirty=true;
     touchEquipment.update();
   }
   if(dirty){draw();dirty=false}
   if(active()) schedule();
 }
 function pause(focus=false){
   if(!active())return;
   document.body.dataset.state='paused';
   conversation.close('pause');
   leaveChapel();leavePrison();orbSince=null;hideCaption();names.clear();
   touchEquipment.clear();input.clear();fountain.stop?.();viewmodel.stop();round.stop();audio.pause();lastDoorTime=null;doorPrompt();
   if(focus) action.focus({preventScroll:true});
 }
 const input=bindPlayerInput({
   canvas,pad:$('stick'),jumpButton:$('jump'),player,active:controls,pause:()=>pause(!document.hidden && document.hasFocus()),
   refresh,mode:value=>{
     document.body.dataset.input=value;
     touchEquipment.update();
   }
 });
 function warmGhouls(){
   ghoulsWarming??=Promise.resolve().then(()=>round.prepare(r,c))
     .catch(error=>console.warn('Ghoul-Vorbereitung fehlgeschlagen; die Szene wird bei Bedarf geladen.',error))
     .finally(()=>{ghoulsReady=true;});
 }
 ghoulOption.addEventListener('change',()=>{if(!started&&ghoulOption.checked)warmGhouls();});
 action.onclick=event=>{
   if(!started){
     started=true;ghoulsEnabled=firstRound=ghoulOption.checked;audio.mode(ghoulsEnabled);
     if(ghoulsEnabled)warmGhouls();
   }
   audio.play();
   document.body.dataset.state='playing';
   input.start({
     touch:event.pointerType==='touch'||event.pointerType!=='mouse'&&coarse.matches,
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
   pauli.setPreset(id);
   hall.setPreset(id);hall.update(0,player.body.position);
   viewmodel.preset(id);
   for(const b of choices)b.setAttribute('aria-pressed',String(b.dataset.light===id));
   if(remember){try{localStorage.setItem('schlosser.light',id)}catch{}}
   return true;
 }
 let last=DEFAULT_LIGHT;
 try{last=localStorage.getItem('schlosser.light')||DEFAULT_LIGHT}catch{}
 // Unknown saved settings from older builds fall back to sunset.
 if(!selectLight(last))selectLight(DEFAULT_LIGHT,true);
 for(const b of choices)b.onclick=()=>{if(selectLight(b.dataset.light,true))refresh()};
 qualityControl.onchange=()=>{
   const id=qualityControl.value;
   if(!Object.hasOwn(GRAPHICS,id)||quality===id)return;
   quality=id;
   try{localStorage.setItem('schlosser.graphics',id)}catch{}
   r.setPixelRatio(Math.min(devicePixelRatio,GRAPHICS[id].dpr));
   lighting.setShadowSize(GRAPHICS[id].shadow);
   refresh();
 };
 function resize(){
   const w=stage.clientWidth,h=stage.clientHeight;
   if(!w||!h)return;
   r.setSize(w,h,false);c.aspect=w/h;
   // Keep useful peripheral vision on narrow phones without changing the pose.
   c.fov=T.MathUtils.clamp(T.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI*24/180)/c.aspect)),65,82);
   c.updateProjectionMatrix();refresh();
 }
 showLoadingStep(2,'Licht und Materialien …');
 const shaderTime=performance.now();
 for(const tex of [poster,seal])if(tex)r.initTexture(tex);
 await hall.prepareLab(r,s);
 await wc.prepare(r,s);
 await chapter.prepare(r);
 await upper.prepare(r);
 await viewmodel.prepare(r);
 const parkWarmup=performance.now();
 await puddle.prepare(r);
 await weather.prepare(r,[puddle.root,garden.orangery]);
 performance.measure('schlosser: Orangerie und Pfütze',{start:parkWarmup,end:performance.now()});
 performance.measure('schlosser: room warmup',{start:shaderTime,end:performance.now()});
 showLoadingStep(3,'Letzte Vorbereitungen …');
 await paintLoadingStep();
 wc.update(0,player.body.position);chapter.update(0,player.body.position);
 const queryTime=performance.now();
 geometryQuery.build();s.matrixWorldAutoUpdate=false;
 performance.measure('schlosser: spatial index',{start:queryTime,end:performance.now()});
 new ResizeObserver(resize).observe(stage);resize();
 r.shadowMap.needsUpdate=true;
 fountain.syncView?.(c);
 const hideFirstShot=viewmodel.showPrewarmShots();
 try{draw();}finally{hideFirstShot();}
 // Refresh the preview after removing the hidden projectile warm-up.
 refresh();
 showLoadingStep(4,'Spielbereit');
 document.body.dataset.state='ready';
 performance.measure('schlosser: ready',{start:bootTime,end:performance.now()});
}
start().catch(err=>{
 console.error(err);$('canvas').hidden=true;
 if(err.asset)$('error-text').textContent='Die Projektdatei '+err.asset+' konnte nicht geladen werden. Bitte den lokalen Build oder die veröffentlichte Version vollständig neu laden.';
 else if (!window.WebGL2RenderingContext || /WebGL context/.test(err.message)) {
   $('error-text').textContent='Für dieses Spiel braucht dein Browser WebGL 2. Aktiviere die Hardwarebeschleunigung oder versuche es mit einem anderen Browser.';
 }
 document.body.dataset.state='error';
});
