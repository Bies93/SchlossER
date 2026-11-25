import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {installHumans,createHuman} from '../src/human-character.js';
import {NPCS} from '../src/npc-lines.js';
import {NPC_WEAPONS,npcWeapon} from '../src/npc-loadouts.js';
import {npcCounterfire} from '../src/npc-counterfire.js';
import {combatTargets} from '../src/combat-targets.js';
import {EQUIPMENT} from '../src/ego-assets.js';
import {makeEquipment} from '../src/ego-gear.js';
import {weaponAction} from '../src/weapon-action.js';
import {weaponPickups} from '../src/weapon-pickups.js';
import {sceneQuery} from '../src/scene-query.js';
import {collisionWorld} from '../src/collision.js';

assert.ok(Object.keys(NPC_WEAPONS).every(id=>Object.hasOwn(NPCS,id)));
const kinds=Object.values(NPC_WEAPONS),count=Object.keys(NPCS).length;
assert.equal(kinds.filter(kind=>kind==='pistol').length,13);
assert.equal(kinds.filter(kind=>kind==='bow').length,13);
assert.ok(kinds.length/count>.43&&kinds.length/count<.57);
globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){}})})};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const bytes=await readFile(new URL('../assets/human-cast.glb',import.meta.url));
const {scene:cast}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
installHumans(T,cast);
const {devices,bolt}=makeEquipment(T,EQUIPMENT),indexOf=kind=>EQUIPMENT.findIndex(spec=>spec.kind===kind);
const bow=devices[indexOf('bow')],spare=bow.replica(),drawn=bow.replica();
bow.animate(10,{loaded:true});spare.animate(10,{loaded:true});drawn.animate(10,{loaded:true});
const string=replica=>replica.root.children.at(-1),taut=string(drawn).position.clone();
assert.equal(string(drawn).geometry,string(spare).geometry);
drawn.animate(10,{loaded:false});
assert.ok(!string(drawn).position.equals(taut));
assert.ok(string(bow).position.equals(taut)&&string(spare).position.equals(taut),'Spieler und NPCs teilen Geometrie, keine beweglichen Teile');

const scene=new T.Scene(),upstairs=new T.Group(),camera=new T.PerspectiveCamera();
scene.add(upstairs,camera);
const add=(id,x,y,layer,parent=scene)=>{
  const {npcInfo:n,actor}=createHuman(T,id);actor.position.set(x,y,0);
  parent.add(actor);actor.traverse(o=>o.layers.set(layer));return n;
};
const pistol=add('festZwanni',0,0,0),second=add('festKalle',-4,0,0),boxer=add('festAnni',6,0,0);
const crossbow=add('cloneLorenz',0,4,2,upstairs);
const wall=new T.Mesh(new T.BoxGeometry(4,3,.24),new T.MeshBasicMaterial());
wall.position.set(0,5,2);wall.layers.set(2);wall.visible=false;scene.add(wall);
const query=sceneQuery(T,scene,null);query.build();
const body=new T.Vector3(0,0,4);body.eyeHeight=1.67;
let layer=0,time=0,replicas=0;
const cues=[],damage=[],landed=[];
const counter=npcCounterfire(T,scene,kind=>{
  const index=indexOf(kind);replicas++;
  return {device:devices[index].replica(),spec:EQUIPMENT[index],bolt:kind==='bow'?bolt.clone():null};
},{query,camera,context:()=>({layer}),ready:()=>true,sound:kind=>cues.push({kind,time}),
  damage:amount=>damage.push({amount,time}),contact(){}});
const advance=seconds=>{camera.position.copy(body);camera.position.y+=body.eyeHeight;
  for(let t=0;t<seconds;t+=.02){time+=.02;counter.update(.02,body);}};
advance(.3);assert.equal(replicas,0);
assert.equal(counter.provoke(boxer),false);
assert.ok(counter.provoke(pistol)&&pistol.hostile&&!second.hostile&&!crossbow.hostile);
advance(2.5);
assert.ok(cues.some(c=>c.kind==='fire')&&damage.some(d=>d.amount===16));
counter.reset();assert.ok(!pistol.hostile&&!pistol.rig.counterMount.visible);

body.y=4;layer=0;const before=cues.length;
assert.ok(counter.provoke(crossbow));advance(1.6);
assert.ok(!cues.slice(before).some(c=>c.kind==='bow-fire'),'Keine Schüsse in ein anderes Stockwerk');
layer=2;wall.visible=true;advance(1.3);
assert.ok(!cues.slice(before).some(c=>c.kind==='bow-fire'),'Wand blockiert die Schusslinie');
wall.visible=false;advance(4.4);
const shots=cues.filter(c=>c.kind==='bow-fire'),boltHit=damage.find(d=>d.amount===24);
assert.ok(shots.length>=2&&shots[1].time-shots[0].time>=2.08,'Nach jedem Bolzen wird nachgeladen');
assert.ok(cues.some(c=>c.kind==='bow-open')&&cues.some(c=>c.kind==='bow-close'));
assert.ok(boltHit&&shots.some(c=>boltHit.time-c.time>.05&&boltHit.time-c.time<.30),'Der Bolzen braucht Flugzeit');

const world=collisionWorld({minX:-100,maxX:100,minZ:-100,maxZ:100},.25);
const floor=(_x,_z,y=0)=>y>=3?4:0,actions=EQUIPMENT.map(weaponAction),owned=new Set([indexOf('bow')]);
const pickups=weaponPickups(T,{
  pickupModel(index,{loaded=true}={}){
    const device=devices[index],copy=device.replica?.()??{root:device.root.clone(),animate(){}};
    copy.animate(10,{loaded});return copy.root;
  },
  collectDrop(index,ammo){const weapon=!owned.has(index),count=actions[index].receiveDrop(!weapon,ammo);
    if(count)owned.add(index);return {weapon,count};}
},{attach:(_room,g)=>scene.add(g)},{floor:-12,attach:(_room,g)=>scene.add(g)},
query,scene,floor,world,{at:[-14,.8,-20],attach:g=>scene.add(g)},
{onLand:(_p,kind)=>landed.push(kind)});
const dropped=new Map();
const targets=combatTargets(T,query,{},world,floor,(id,n)=>{dropped.set(id,pickups.drop(n));counter.drop(n);});
const kill=n=>{
  n.hp=1;targets.damage(n,34,0xffffff,n.chest.getWorldPosition(new T.Vector3()),{kind:'pistol'},0,new T.Vector3(0,0,-1));
};
kill(pistol);kill(second);kill(crossbow);kill(boxer);
const first=dropped.get(pistol.id),extra=dropped.get(second.id),bolts=dropped.get(crossbow.id);
assert.equal(npcWeapon(boxer.id),null);assert.equal(dropped.get(boxer.id),null);
assert.ok(first&&extra&&bolts&&pickups.drop(second)===null);
assert.ok(first.group.position.y>.5&&!first.landed&&pickups.collect(first)===null);
pickups.update(.7,5);assert.equal(landed.length,3);
const aimAt=item=>{const focus=item.targets[0];camera.position.copy(focus).add(new T.Vector3(0,1.2,.5));camera.lookAt(focus);};
aimAt(bolts);
assert.equal(pickups.target(camera,5,0),null);
assert.equal(pickups.target(camera,5,2),bolts);
upstairs.visible=false;pickups.update(.1,5);assert.equal(pickups.target(camera,5,2),null);
upstairs.visible=true;pickups.update(.1,5);
aimAt(first);assert.equal(pickups.target(camera,1,0),first);
assert.match(pickups.collect(first),/Kompaktpistole aufgenommen/);
assert.deepEqual([actions[first.index].rounds,actions[first.index].reserve],[3,0]);
assert.equal(pickups.collect(extra),'+3 Pistolenpatronen.');
assert.deepEqual([actions[first.index].rounds,actions[first.index].reserve],[3,3]);
const reserve=actions[bolts.index].reserve;
assert.equal(pickups.collect(bolts),'+2 Armbrustbolzen.');
assert.equal(actions[bolts.index].reserve,reserve+2);assert.equal(pickups.collect(bolts),null);
console.log(`${kinds.length} von ${count} Figuren bewaffnet; individuelle Aggro, Deckung, Bolzenflug, Nachladen, Waffenfall und Doppelbeute geprüft.`);
