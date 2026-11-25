import assert from 'node:assert/strict';
import * as T from 'three';
import {EQUIPMENT} from '../src/ego-assets.js';
import {makeEquipment} from '../src/ego-gear.js';
import {archiveShotFX} from '../src/ego-archive-fx.js';

globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){}})})};
const spec=EQUIPMENT.find(x=>x.kind==='archive');
const {devices:[model]}=makeEquipment(T,[spec]),replica=model.replica();
model.animate(10);replica.animate(10);
const trim=model.root.children.at(-2),token=model.root.children.at(-1),rest=trim.position.clone();
assert.ok(!token.visible&&model.left.lengthSq()===0);
assert.equal(trim.children[0].geometry,replica.root.children.at(-2).children[0].geometry);
model.animate(10,{reload:.52});
assert.ok(token.visible&&model.left.z>.25&&trim.position.z>rest.z&&trim.rotation.z>.5);
assert.ok(replica.root.children.at(-2).position.equals(rest)&&!replica.root.children.at(-1).visible);
model.animate(10,{reload:1});assert.ok(!token.visible&&trim.position.equals(rest)&&model.left.lengthSq()===0);

const bounds=new T.Box3().setFromObject(model.root,true);
assert.ok(Math.abs(bounds.min.z-spec.emit[2])<.015);
let triangles=0,meshes=0;
model.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
assert.ok(triangles<11000&&meshes<=16,'Modell bleibt im Geometrie- und Renderbudget');

const stage=new T.Scene(),fx=archiveShotFX(T,stage),root=stage.children[0],prop=new T.Group();
const [glow,core,...fog]=root.children;
assert.ok(!root.visible&&!fx.update(.02));
const hideFX=fx.warmup();assert.ok(root.visible&&root.children.every(o=>o.visible));hideFX();
fx.fire(spec.emit,prop,1,false);assert.ok(root.visible&&glow.visible&&core.visible&&!fog.some(o=>o.visible));
fx.update(.106);assert.ok(!glow.visible&&!core.visible&&fog.every(o=>o.visible));
fx.update(.5);assert.ok(!root.visible&&!fx.update(.01));
fx.fire(spec.emit,prop,2,true);assert.ok(glow.visible&&glow.material.opacity<.3);
fx.update(.043);assert.ok(!root.visible&&!fog.some(o=>o.visible));
assert.equal(root.children.length,5,'Effekte werden auf denselben Flächen wiederverwendet');
console.log(`Falkenried: ${triangles} Dreiecke, getrennte Fund-/Nachladepose, Blitz und Rauch inklusive reduzierter Bewegung geprüft.`);
