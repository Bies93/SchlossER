import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {NPCS} from '../src/npc-lines.js';
import {installHumans,createHuman} from '../src/human-character.js';

// This check exercises the JS shader-generation callbacks on the real
// skeletons. Image decoding and GLSL compilation are tested in the browser.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const bytes=await readFile(new URL('../assets/human-cast.glb',import.meta.url));
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
installHumans(T,scene);

let checked=0;
for(const id of ['base','ghoulA','ghoulB','ghoulC',...Object.keys(NPCS)]){
  const rig=createHuman(T,id),{actor,greyScalp}=rig,cloth=[],hair=[];
  actor.traverse(o=>{
    if(!o.isSkinnedMesh)return;
    const {material}=o;
    const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
    assert.doesNotThrow(()=>material.onBeforeCompile(shader),
      'Shader für '+id+' · '+material.name+' kann nicht erzeugt werden');
    if(/^Cloth/.test(material.name))cloth.push(shader.fragmentShader);
    if(/^Hair/.test(material.name))hair.push(o);
    checked++;
  });
  if(id==='guestJona')assert.ok(cloth.some(s=>s.includes('float seamPhase=')));
  if(id==='festZwanni')assert.ok(cloth.some(s=>s.includes('float teeth=')&&!s.includes('float seamPhase=')));
  if(id==='festAnni')assert.ok(cloth.some(s=>s.includes('float jersey=')&&!s.includes('float seamPhase=')));
  if(id==='grey')assert.ok(greyScalp&&hair.length&&hair.every(o=>!o.visible),'Grey ersetzt den alten Kurzhaarschnitt');
  if(id==='clubNiko')assert.ok(hair.some(o=>o.visible),'Nikos geteilter GLB-Haarschnitt bleibt unverändert');
  if(id==='niklas'){
    const path=(d,out)=>{out.x=0;out.z=d;out.yaw=0;},idle=()=>rig.walk(.7,0,path,0,0,1);
    const hands=['hand_l','hand_r','thumb_01_l','thumb_01_r'].map(n=>rig.joint(n));
    idle();
    const baseline=hands.map(b=>b.quaternion.clone());
    rig.counterPose(.9,1,1,0,0,0);
    assert.ok(hands[1].quaternion.angleTo(baseline[1])>.25,'Kampfpose verwendet eigene Handrotation');
    const prop=rig.counterMount.getWorldQuaternion(new T.Quaternion());
    assert.ok(new T.Vector3(0,0,-1).applyQuaternion(prop).z>.98,'NPC-Prop zeigt nach vorn statt aus der Hand');
    assert.ok(new T.Vector3(0,1,0).applyQuaternion(prop).y>.98,'NPC-Prop liegt aufrecht im Griff');
    idle();
    hands.forEach((b,i)=>assert.ok(b.quaternion.angleTo(baseline[i])<1e-5,'Patrouille setzt Handgelenk und Daumen zurück'));
  }
}
assert.ok(checked>100);
console.log(checked+' NPC-Materialien erzeugt: Outfits und Niklas’ Griff-/Patrouillenwechsel geprüft.');
