import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';
import {fountainQuest,addFountainFind} from '../src/fountain-quest.js';
import {sceneQuery} from '../src/scene-query.js';
import {addFixedColliders,BOUNDS,PLAYER,insidePerimeter} from '../src/world-layout.js';
import {collisionWorld} from '../src/collision.js';
import {weaponAction} from '../src/weapon-action.js';

const niklas={id:'niklas',...NPCS.niklas},zwanni={id:'festZwanni',...NPCS.festZwanni},ask=zwanni.choices[1].reply;
const q=fountainQuest();
assert.equal(q.opening(niklas).choices.length,2);
assert.equal(q.followup(zwanni,ask),null);
assert.ok(q.collect());assert.ok(!q.collect());
const returnIt=q.opening(niklas).choices.at(-1).reply.action;
const giveIt=q.followup(zwanni,ask).choices[0].reply.action;
assert.equal(q.deliver(niklas.id,returnIt,false),null);
assert.equal(q.deliver(zwanni.id,returnIt,true),null);
assert.equal(q.phase,'held');assert.equal(q.deliver(niklas.id,returnIt,true),'niklas');
assert.equal(q.deliver(zwanni.id,giveIt,true),null);
assert.equal(q.opening(niklas).clip,'niklasFundsache');
const other=fountainQuest();other.collect();assert.equal(other.deliver(zwanni.id,giveIt,true),'zwanni');
assert.equal(other.deliver(niklas.id,returnIt,true),null);
const bow=weaponAction({kind:'bow',recovery:.32});bow.addReserve(12);
assert.equal(bow.reserve,36);assert.equal(bow.restock(),0);assert.equal(bow.reserve,36);

globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const glb=await readFile(new URL('../assets/skulpturen.glb',import.meta.url));
const {scene:sculptures}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
sculptures.traverse(o=>{if(/Fountain_water|Water_jets|Aerated_spray/i.test(o.name))o.visible=false;});
const s=new T.Scene();s.add(sculptures);
const find=addFountainFind(T,s,.379,fountainQuest()),cam=new T.PerspectiveCamera();
const query=sceneQuery(T,s,null);query.build();
const world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);addFixedColliders(world);
cam.position.set(-3.24,PLAYER.eye,-36.80);
cam.lookAt(-3.24,.514,-38.92);
assert.ok(!world.blocked(cam.position.x,cam.position.z,0),'Die Brunnenkante lässt die erreichbare Position zu');
assert.equal(find.target(cam,query)?.action,'fountain-quest-pickup','Fundobjekt vom echten Brunnenrand sichtbar');
const sight=new T.Ray(cam.position,new T.Vector3(-3.24,.451,-38.92).sub(cam.position).normalize());
assert.equal(query.trace(sight,cam.position.distanceTo(new T.Vector3(-3.24,.451,-38.92))-.039,1,.045,true),
  Infinity,'Am Brunnenrand ist auch der untere Teil des Fundstücks sichtbar');
cam.lookAt(0,1.67,-36.80);assert.equal(find.target(cam,query),null);
assert.ok(find.collect());assert.ok(!find.collect());
for(const id of ['niklasFundsache','zwanniFundsache']){
  const bytes=await readFile(new URL('../assets/npc-voices/'+NPC_VOICE_FILES[id],import.meta.url));
  assert.ok(bytes.length>6000&&bytes[0]===255&&bytes[1]>=224||bytes.subarray(0,3).toString()==='ID3');
}
console.log('Beide exklusiven Questwege, +12 Bolzen, Sprachdateien und erreichbare Fundposition an echter Brunnengeometrie geprüft.');
