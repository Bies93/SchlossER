import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {installHumans,createHuman} from '../src/human-character.js';
import {combatTargets} from '../src/combat-targets.js';
import {boxingClock,npcBoxing} from '../src/npc-boxing.js';
import {addPlazaMarcel,MARCEL_SITE} from '../src/plaza-marcel.js';
import {sceneQuery} from '../src/scene-query.js';
import {collisionWorld} from '../src/collision.js';
import {FRIEDRICH} from '../src/palace-detail.js';
import {addFixedColliders,BOUNDS,PLAYER,SPAWN,insidePerimeter} from '../src/world-layout.js';

const motion=boxingClock();
let contacts=0;
motion.start();
for(let i=0;i<24;i++)motion.tick(.02,()=>contacts++);
assert.equal(contacts,1);
assert.equal(motion.mode,'recover');
for(let i=0;i<21;i++)motion.tick(.02,()=>contacts++);
motion.start();motion.tick(.15,()=>contacts++);motion.cancel();
for(let i=0;i<22;i++)motion.tick(.02,()=>contacts++);
assert.equal(contacts,1,'Ein abgebrochener Schlag verursacht keinen Schaden');

globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const bytes=await readFile(new URL('../assets/human-cast.glb',import.meta.url));
const {scene:cast}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
installHumans(T,cast);
const scene=new T.Scene(),world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);
addFixedColliders(world);
assert.ok(!world.blocked(MARCEL_SITE.x,MARCEL_SITE.z,0));
assert.ok(Math.hypot(MARCEL_SITE.x,MARCEL_SITE.z-FRIEDRICH.z)<4&&
  Math.hypot(MARCEL_SITE.x-SPAWN.x,MARCEL_SITE.z-SPAWN.z)<13);
const marcel=addPlazaMarcel(T,scene,world,()=>0),npc=marcel.rig.npcInfo,home=npc.actor.position.clone();
assert.equal(npc.line,'Ich warte auf Bestimmung!');
assert.ok(npc.actor.getObjectByName('Marcel · geflochtener Zopf'));
const neighbor=createHuman(T,'festAnni').npcInfo;
neighbor.actor.position.set(home.x+3,home.y,home.z);scene.add(neighbor.actor);
const wall=new T.Mesh(new T.BoxGeometry(6,3,.15),new T.MeshBasicMaterial());
wall.position.set(home.x,1,home.z+.48);wall.visible=false;scene.add(wall);
const query=sceneQuery(T,scene,null);query.build();
const body=new T.Vector3(home.x,0,home.z+2.50);body.eyeHeight=1.67;
let layer=0,damage=0;
const box=npcBoxing(T,{context:()=>({layer}),query,worldAt:()=>world,floorAt:()=>0,ready:()=>true,
  damage:n=>{damage+=n;},sound(){}});
const targets=combatTargets(T,query,{},world,()=>0,()=>{},null,(n,spec)=>{if(spec.kind!=='melee')box.provoke(n);});
const advance=seconds=>{for(let t=0;t<seconds;t+=.025){targets.tick(.025,1<<layer);box.update(.025,body);}};
advance(.6);assert.equal(damage,0);
const hit=new T.Vector3(home.x,1.23,home.z),dir=new T.Vector3(0,0,-1);
targets.damage(npc,38,0xffffff,hit,{kind:'pistol'},0,dir);
assert.ok(npc.alive&&npc.hostile&&!neighbor.hostile,'Nur der überlebende Getroffene wird aggressiv');
advance(2.5);
assert.ok(npc.actor.position.z>home.z+.8&&damage>0,'Überlebender läuft zum Spieler und boxt');
assert.equal(neighbor.actor.position.z,home.z);
box.reset();assert.ok(!npc.hostile&&npc.actor.position.equals(home));

wall.visible=true;body.z=home.z+.92;npc.hp=100;
targets.damage(npc,38,0xffffff,hit,{kind:'pistol'},0,dir);
const before=damage;advance(1.6);
assert.equal(damage,before,'Eine Wand verhindert den Treffer trotz kurzer Distanz');
wall.visible=false;layer=3;advance(.2);
assert.equal(damage,before,'Andere Ebene: kein unsichtbarer Treffer');
assert.ok(!npc.hostile&&npc.actor.position.equals(home));
layer=0;npc.hp=1;
targets.damage(npc,38,0xffffff,hit,{kind:'pistol'},0,dir);
advance(.4);assert.ok(!npc.alive&&!npc.hostile&&damage===before,'Tödlicher Treffer startet keine Gegenwehr');
console.log('Marcel am Startdenkmal; Einzelaggression, Schlagfenster, Deckung, Ebenen und Rückkehr geprüft.');
