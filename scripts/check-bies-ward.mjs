import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {installHumans,namedHumans} from '../src/human-character.js';
import {makeLabDeck} from '../src/lab-wing.js';
import {LAB,LAB_LAYER} from '../src/lab-layout.js';
import {BIES_DISPLAY_TEXT} from '../src/lab-bies-display.js';
import {WARD_CHAIR} from '../src/lab-ward-layout.js';
import {npcFocus} from '../src/npc-focus.js';
import {collisionWorld} from '../src/collision.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';
import {BOUNDS,PLAYER} from '../src/world-layout.js';

// Exercise the real room, atlas and rig construction without a GPU.
const text=[];
const grad={addColorStop(){}},noop=()=>{};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close:noop});
globalThis.document={createElement:()=>{
  const canvas={width:300,height:150};
  const context=new Proxy({canvas,fillText(value){text.push(value);},measureText:s=>({width:String(s).length*8}),
    createLinearGradient:()=>grad,createRadialGradient:()=>grad,createPattern:()=>null,
    getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})},
  {get:(target,key)=>target[key]??noop});
  canvas.getContext=()=>context;return canvas;
}};
const glb=await readFile(new URL('../assets/human-cast.glb',import.meta.url));
const {scene:humans}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
installHumans(T,humans);
const scene=new T.Scene(),parent=new T.Group(),shaft=new T.Group();scene.add(parent,shaft);
const world=collisionWorld(BOUNDS,PLAYER.radius);
const material=new T.MeshStandardMaterial(),materials=new Proxy({}, {get:()=>material});
const deck=makeLabDeck(T,parent,world,materials,noop);
const renderer={getViewport:v=>v.set(0,0,40,40),getScissor:v=>v.set(0,0,40,40),getScissorTest:()=>false,
  shadowMap:{needsUpdate:false},setViewport:noop,setScissor:noop,setScissorTest:noop,compileAsync:async()=>{},render:noop};
await deck.prepare(renderer,scene,shaft);
const board=scene.getObjectByName(BIES_DISPLAY_TEXT.headline);
assert.ok(board?.layers.isEnabled(LAB_LAYER)&&board.material.map.image.width>=1024);
for(const heading of ['Maximaler Leistung','vs. Durchschnitt','TOBIAS BIES','DURCHSCHNITT','RABENPROTOKOLL'])
  assert.ok(text.includes(heading),'Die Tafel enthält '+heading);
const bies=namedHumans(T).find(n=>n.id==='labPatient');
assert.equal(bies.name,'Tobias Bies');
assert.ok(bies.reactionOnly&&bies.stageDirection&&!bies.choices&&bies.actor.layers.isEnabled(LAB_LAYER));
assert.ok(Math.abs(bies.actor.position.x-WARD_CHAIR.x)<.04&&Math.abs(bies.actor.position.z-WARD_CHAIR.z)<.04);
for(const id of ['labAuer','labPatient']){
  const clip=await readFile(new URL('../assets/npc-voices/'+NPC_VOICE_FILES[id],import.meta.url));
  assert.ok(clip.length>4000&&clip.toString('ascii',0,3)==='ID3');
}

const doctor=namedHumans(T).find(n=>n.id==='labAuer'),p=doctor.actor.position.clone().add(new T.Vector3(1,0,0));
const quote=deck.talk(p,new T.Vector3(-1,0,0));
assert.equal(quote.line,'Seit Bies hier ist, terrorisieren uns Raben!');
doctor.hostile=true;assert.equal(deck.target(p,new T.Vector3(-1,0,0)),null);
const patientPos=new T.Vector3(WARD_CHAIR.x+1.28,LAB.floor,WARD_CHAIR.z);
deck.update(patientPos,true,.1);
const camera=new T.PerspectiveCamera(60,1,.05,80);
camera.position.copy(patientPos).add(new T.Vector3(0,1.42,0));
camera.lookAt(bies.head.getWorldPosition(new T.Vector3()));
const label={hidden:true,textContent:''};
const focus=npcFocus(T,scene,camera,{position:patientPos},label,()=>1<<LAB_LAYER,{trace:()=>Infinity});
assert.equal(focus.sample(100,true)?.id,'labPatient');
assert.equal(focus.target()?.label,'Reaktion prüfen');
const scream=focus.use('labPatient',100);
assert.ok(scream.reactionOnly&&scream.stageDirection&&!scream.choices&&scream.speakFor);
console.log('Bies-Sitz, Leistungstafel, Schrei-Interaktion und Auers Raben-Zeile in der echten Kellerstruktur geprüft.');
