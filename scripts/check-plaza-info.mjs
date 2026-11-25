import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {installHumans,namedHumans} from '../src/human-character.js';
import {collisionWorld} from '../src/collision.js';
import {addFixedColliders,BOUNDS,PLAYER,insidePerimeter} from '../src/world-layout.js';
import {RAVEN_PERCHES} from '../src/palace-ravens.js';
import {PORTALS} from '../src/palace-openings.js';
import {addPlazaInfoStand,INFO_SITE} from '../src/plaza-info-stand.js';
import {INFO_MOTTO,PRIDE_TITLE} from '../src/plaza-info-art.js';
import {npcFocus} from '../src/npc-focus.js';

const written=[];
globalThis.document={createElement:()=>({getContext:()=>new Proxy({fillText:s=>written.push(s)},
  {get:(obj,key)=>obj[key]??(()=>{})})})};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const data=await readFile(new URL('../assets/human-cast.glb',import.meta.url));
const {scene:assets}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
installHumans(T,assets);
const scene=new T.Scene(),world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter),{x,z,half}=INFO_SITE;
addFixedColliders(world);
assert.ok(insidePerimeter(x,z)&&z>PORTALS.west.z+3&&z<PORTALS.west.z+9);
assert.ok(!world.blocked(x,z,0)&&!world.blocked(x,z+1.2,0));
const stand=addPlazaInfoStand(T,scene,world,()=>0);
const {root,cast}=stand;
assert.ok(root.getObjectByName(INFO_MOTTO)&&written.slice(0,2).join(' ')===INFO_MOTTO);
assert.ok(root.getObjectByName('Regenbogenschild · '+PRIDE_TITLE)&&written.includes('QUEER IN ERLANGEN'));
assert.equal(root.children.filter(o=>o.name==='Regenbogenflyer · '+PRIDE_TITLE).length,2);
assert.equal(root.children.filter(o=>o.name==='Pavillon · grünes Spannfeld').length,4);
let balloons=0;root.traverse(o=>{if(o.name==='Luftballon · grünes Herz')balloons++;});assert.equal(balloons,6);
assert.deepEqual(namedHumans(T).map(n=>n.name),['Heide','Luisa','Grete']);
assert.ok(world.blocked(x,z+1.11,0)&&world.blocked(x-half,z-half,0));
assert.ok(!world.blocked(x,z-.23,0)&&!world.blocked(x,z+2.05,0));
for(const [a,b] of RAVEN_PERCHES)assert.ok(!world.blocked(a,b,0));
for(let d=13.2;d<29.6;d+=.2)for(const a of [-1,0,1])assert.ok(!world.blocked(a,d,0),'Portalachse bleibt frei');

const camera=new T.PerspectiveCamera(60,1.45,.06,40),label={hidden:true,textContent:''},player=new T.Group();scene.add(camera,player);
const focus=npcFocus(T,scene,camera,player,label,()=>1),at=new T.Vector3(),lengths=[],heights=[];
for(const a of cast){
  const {actor,head,name}=a.npcInfo;
  const hair=[];actor.traverse(o=>{if(o.geometry?.attributes.strandFlex)hair.push(o);});
  assert.equal(hair.length,1);
  assert.ok(hair[0].isSkinnedMesh,'Frisur folgt Kopf und Oberkörper');
  assert.equal(hair[0].skeleton.bones[hair[0].geometry.attributes.skinIndex.getX(0)],head);
  lengths.push(new T.Box3().setFromBufferAttribute(hair[0].geometry.attributes.position).getSize(at).y);
  heights.push(head.getWorldPosition(at).y);
  player.position.copy(actor.position).add(new T.Vector3(0,0,2.06));
  camera.position.copy(player.position).add(new T.Vector3(0,1.67,0));
  head.getWorldPosition(at);at.y+=.08;camera.lookAt(at);
  assert.equal(focus.sample(100,true)?.name,name);
  assert.equal(focus.target()?.action,'npc-talk');assert.ok(focus.use(a.npcInfo.id,100)?.line);
}
assert.ok(lengths[0]>lengths[1]&&lengths[1]>.35&&lengths[2]<lengths[1]);
assert.ok(heights[2]<Math.min(heights[0],heights[1])-.055,'Grete ist im Stand etwas kleiner');
assert.ok(cast[0].rig.actor.getObjectByName('Heide · stoffbezogener Gürtel')?.isSkinnedMesh);
assert.ok(cast[1].rig.actor.getObjectByName('Luisa · gestrickte lange Ärmel')?.isSkinnedMesh);
assert.ok(cast[2].rig.actor.getObjectByName('Grete · lange Strickärmel')?.isSkinnedMesh);
let shoes=false;cast[2].rig.actor.traverse(o=>{if(o.material?.name==='Grete · kobaltblaue Sneaker')shoes=true;});assert.ok(shoes);
assert.ok(!stand.update(.06,{x:99,z:100},true)&&!stand.update(.06,{x,z},false));
const look=cast[1].rig.joint('head').quaternion.clone();
for(let i=0;i<12;i++)assert.ok(stand.update(.045,{x:x+.6,z:z+2.1},true));
assert.ok(cast[1].rig.joint('head').quaternion.angleTo(look)>.01);
console.log('Drei ansprechbare Figuren, eigenständige Frisuren, Banner, sechs Ballons und freie Hauptachse auf dem Schlossplatz geprüft.');
