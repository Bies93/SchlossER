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
  const {actor}=createHuman(T,id),cloth=[];
  actor.traverse(o=>{
    if(!o.isSkinnedMesh)return;
    const {material}=o;
    const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
    assert.doesNotThrow(()=>material.onBeforeCompile(shader),
      'Shader für '+id+' · '+material.name+' kann nicht erzeugt werden');
    if(/^Cloth/.test(material.name))cloth.push(shader.fragmentShader);
    checked++;
  });
  if(id==='guestJona')assert.ok(cloth.some(s=>s.includes('float seamPhase=')));
  if(id==='festZwanni')assert.ok(cloth.some(s=>s.includes('float teeth=')&&!s.includes('float seamPhase=')));
  if(id==='festAnni')assert.ok(cloth.some(s=>s.includes('float jersey=')&&!s.includes('float seamPhase=')));
}
assert.ok(checked>100);
console.log(checked+' NPC-Materialien erzeugt: Besucherpalette und Festival-Outfits geprüft.');
