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
import {addPauli} from './pauli-fountain.js';
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
import {installHumans} from './human-character.js';
import {npcFocus} from './npc-focus.js';
import {sceneQuery} from './scene-query.js';
import {combatTargets} from './combat-targets.js';
import {weaponPickups} from './weapon-pickups.js';
import {addPalaceUpper,UPPER_LAYER} from './palace-upper.js';

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
 const [model,mapPairs,sculptures,poster,seal,humans]=await Promise.all([decode('schloss.glb',payload.model),mapsP,
   decode('skulpturen.glb',payload.sculptures),image(payload.galleryPoster),image(payload.lodgeSeal),decode('human-cast.glb',payload.humans)]);
 installHumans(T,humans);
 for(const tex of [poster,seal])if(tex){tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,r.capabilities.getMaxAnisotropy());}
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 const exterior=palaceExterior(T,finish);
 const walkSurfaces=[], importedGravel=[];
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name??'';o.material=exterior(key)??o.material;
 // The original broad lawn and plaza are replaced rather than overlaid.
 if(key==='GRAVEL')importedGravel.push(o);
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
 addFixedColliders(world);
 const pauli=addPauli(T,s,world);
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
 upper=addPalaceUpper(T,s,model,upperWorld,stonework,(x,z)=>floorHeight(x,z));
 const lighting=makeLighting(T,r,s,world,floorHeight);
 lighting.registerWindows(perimeter.windows);
 const audio=makeAudio(()=>{
   c.updateWorldMatrix(true,false);const e=c.matrixWorld.elements;
   return {x:e[12],y:e[13],z:e[14],rightX:e[0],rightZ:e[2]};
 },payload.music,payload.galleryChoir,payload.orbVoice,payload.clubMusic,payload.prisonerVoice,payload.npcVoices,payload.weaponSounds);
 const weaponAudioReady=audio.preloadWeapons();
 const player=createPlayer(T,c,world,floorHeight,event=>{
   const {kind,x,y,z,foot,power}=event;
   if(kind==='climb'||upper.inside(event)){audio.foot('wood',power,kind==='land',foot);return;}
   const surface=chapter.isBelow(event)||hallFloor(x,z)!==null||Number.isFinite(Math.min(wcCeilingAt(x,z,y),labCeilingAt(x,z,y)))?'hall':garden.surfaceAt(x,z)??'stone';
   audio.foot(surface,power,kind==='land',foot);
 },(x,z,y)=>Math.min(chapter.ceilingAt(x,z,y),wcCeilingAt(x,z,y),labCeilingAt(x,z,y),upper.ceilingAt(x,z,y)),
   {moveWorld:p=>upper.inside(p)?upperWorld:world,traverse:upper.step});
 s.add(player.body);
 const canvas=r.domElement;
 canvas.tabIndex=-1;
 canvas.setAttribute('aria-label','3D-Rundgang');
 const action=$('enter');
 const active=()=>document.body.dataset.state==='playing';
 const layerPasses=[0,LAB_LAYER,WC_LAYER,CHAPTER_LAYER,UPPER_LAYER];
 const coarse=matchMedia('(pointer: coarse)'),ghoulOption=$('with-ghouls');
 let started=false,ghoulsEnabled=false,firstRound=false,spawnCheck=0;
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
   if(upper.inside(p)){
     layerContext.layer=UPPER_LAYER;layerContext.mask=(1<<UPPER_LAYER)|(upper.seeGarden(p)?1:0);
     return layerContext;
   }
   const cm=chapter.mode(p),wm=wcCameraMode(p),lm=labCameraMode(p);
   const surface=cm!=='inside'&&wm!=='inside'&&lm!=='cellar';
   layerContext.mask=surface?1:0;
   if(lm==='cellar'||surface&&hall.labVisible())layerContext.mask|=1<<LAB_LAYER;
   if(wm!=='surface'&&(surface||wm==='inside'))layerContext.mask|=1<<WC_LAYER;
   if(chapter.visible()&&(surface||cm==='inside'))layerContext.mask|=1<<CHAPTER_LAYER;
   if(surface&&upper.visible())layerContext.mask|=1<<UPPER_LAYER;
   layerContext.layer=cm==='inside'||cm==='threshold'&&p.y<-.38?CHAPTER_LAYER:
     wm==='inside'||wm!=='surface'&&p.y<-.38?WC_LAYER:lm==='cellar'||lm==='threshold'&&p.y<-.38?LAB_LAYER:0;
   return layerContext;
 }
 const targetWorld={blocked(x,z,y){return (upper.inside({x,y,z})?upperWorld:world).blocked(x,z,y);}};
 const targets=combatTargets(T,geometryQuery,round,targetWorld,floorHeight,id=>{
   if(audio.npcTalking(id)){audio.stopNpc(id);hideCaption();}
   if(id==='hubert')leavePrison();
   names.sample(performance.now(),true);
 });
 const viewmodel=makeViewmodel(T,s,c,player,world,floorHeight,canvas,active,refresh,
   ()=>document.body.dataset.input!=='touch',targets,
   kind=>{const p=player.body.position;audio.shot(kind,activeLayers().layer!==0||hallFloor(p.x,p.z)!==null);},
   audio.shotContact,audio.weaponAction,geometryQuery,activeLayers);
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
   const id=showCaption(speech.name+': „'+speech.line+'“',Math.max(5500,speech.line.length*68));
   audio.playNpc(speech.id,speech.at,seconds=>{
     if(!active()||captionId!==id)return;
     speech.speakFor?.(seconds);
     clearTimeout(captionTimer);captionTimer=setTimeout(hideCaption,seconds*1000+350);
   });
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
 let prisonerNext=null,prisonerCaptionUntil=0;
 function leavePrison(){
   if(prisonerNext===null)return;
   prisonerNext=null;audio.stopPrisoner();
   if(performance.now()<prisonerCaptionUntil)hideCaption();
 }
 function prisonerCue(time,pos){
   const at=chapter.prisonerAt(pos);
   if(!at){leavePrison();return;}
   prisonerNext??=time+1850;
   if(time<prisonerNext)return;
   prisonerNext=time+22600;
   prisonerCaptionUntil=time+5350;
   showCaption('Hubert: „Deutschland … Deutschland … aaah …“',5350);
   chapter.prisonerSpeaks();audio.playPrisoner(at);
 }
 const localTarget=()=>{
   const pos=player.body.position,look=c.getWorldDirection(interactionLook);
   const access=upper.target(pos,look);
   if(access||upper.inside(pos)||player.motion.climbing)return access??null;
   const target=pickups.target(c,activeLayers().mask)??chapter.target(pos,look)??moosfunk.target(pos,look)??wc.target(pos,look);
   // The console's interaction cone is broader than its face. Focus on
   // Edda takes priority, without making the tape deck itself unavailable.
   return target?.id==='mf-radio'&&names.target()?.id==='guestEdda'?null:target;
 };
 function hallOrPerson(){
   if(player.motion.climbing)return null;
   if(upper.inside(player.body.position))return names.target();
   const hallTarget=hall.targetFor(player,c);
   return hallTarget&&hallTarget.id!=='gallery-choir'?hallTarget:names.target()??hallTarget;
 }
 const choirLabels={ready:'Chor erklingen lassen',loading:'Chor wird geladen …',playing:'Der Chor erklingt',
   muted:'Für den Chor den Ton einschalten',retry:'Chor erneut laden',unavailable:'Chor nicht verfügbar'};
 function doorPrompt(){
   const target=active()?(localTarget()??hallOrPerson()):null;
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
   const now=performance.now();names.sample(now,true);
   const local=localTarget();
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
   if(upper.inside(player.body.position)||player.motion.climbing){
     const person=hallOrPerson();
     if(person?.action==='npc-talk'&&!audio.npcTalking(person.id))npcDialogue(names.use(person.id,now));
     doorPrompt();refresh();return;
   }
   if(local?.action==='gear-pickup'){
     const notice=pickups.collect(local);
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
   if(!active()||event.code!=='KeyE'||event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
   if(event.target.closest?.('button:not(#portal-action), input, textarea, select, a'))return;
   event.preventDefault();handleDoor();
 });
 portalAction.addEventListener('click',()=>{handleDoor();canvas.focus({preventScroll:true})});
 function draw(){
   const p=player.body.position,{mask,layer}=activeLayers();
   viewmodel.bodyLayer(layer);
   if(mask&1){
     lighting.update(p);garden.update(p,performance.now());
   }
   // One transform update across all passes. At a hatch share depth, not
   // lights, so the existing lighting and material permutations stay intact.
   s.traverseVisible(o=>{
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
     if(input.tick(time))dirty=true;
     audio.ambience(player.body.position);audio.club(clubMix(player.body.position));
     chapelCue(time,player.body.position);
     orbCue(time,player.body.position);
     if(ghoulsEnabled){
       if(firstRound&&time>=spawnCheck&&round.inside(player.body.position)){
         spawnCheck=time+600;if(round.begin(player.body.position)){firstRound=false;dirty=true;}
       }
       if(round.tick(time,player.body.position))dirty=true;
     }
     const dt=lastDoorTime===null?0:Math.min(.065,(time-lastDoorTime)*.001);lastDoorTime=time;
     const state=hall.update(dt,player.body.position,audio.clubPhase());
     if(state.changed)dirty=true;
     if(wc.update(dt,player.body.position))dirty=true;
     if(upper.update(time,player.body.position))dirty=true;
     if(chapter.update(dt,player.body.position)){
       dirty=true;if(chapter.mode(player.body.position)!=='inside')r.shadowMap.needsUpdate=true;
     }
     geometryQuery.invalidateMoving();
     prisonerCue(time,player.body.position);
     if(state.shadow)r.shadowMap.needsUpdate=true;
     if(targets.tick(dt,activeLayers().mask))dirty=true;
     names.sample(time);
     doorPrompt();
     if(chapter.mode(player.body.position)!=='inside'&&labCameraMode(player.body.position)!=='cellar'&&fountain.tick(time,c))dirty=true;
     if(wcCameraMode(player.body.position)==='surface'&&chapter.mode(player.body.position)==='surface'&&labCameraMode(player.body.position)!=='cellar'&&pauli.tick(time,c))dirty=true;
     if(viewmodel.update(time))dirty=true;
   }
   if(dirty){draw();dirty=false}
   if(active()) schedule();
 }
 function pause(focus=false){
   if(!active())return;
   document.body.dataset.state='paused';
   leaveChapel();leavePrison();orbSince=null;hideCaption();names.clear();
   input.clear();fountain.stop?.();viewmodel.stop();round.stop();audio.pause();lastDoorTime=null;doorPrompt();
   if(focus) action.focus({preventScroll:true});
 }
 const input=bindPlayerInput({
   canvas,pad:$('stick'),jumpButton:$('jump'),player,active,pause:()=>pause(!document.hidden && document.hasFocus()),
   refresh,mode:value=>{document.body.dataset.input=value}
 });
 action.onclick=event=>{
   if(!started){started=true;ghoulsEnabled=firstRound=ghoulOption.checked;audio.mode(ghoulsEnabled);}
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
 await upper.prepare(r);
 await viewmodel.prepare(r);
 const hideFirstShot=viewmodel.showPrewarmShots();
 try{await round.prepare(r,c);}finally{hideFirstShot();}
 await weaponAudioReady;
 wc.update(0,player.body.position);chapter.update(0,player.body.position);
 geometryQuery.build();s.matrixWorldAutoUpdate=false;
 new ResizeObserver(resize).observe(stage);resize();
 r.shadowMap.needsUpdate=true;
 fountain.syncView?.(c);
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
