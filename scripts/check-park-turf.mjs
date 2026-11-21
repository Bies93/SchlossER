import assert from 'node:assert/strict';
import * as T from 'three';
import {plantParkTurf,TURF_TRIANGLE_CAP,TURF_LOD,turfBoxDist} from '../src/park-turf.js';
const root=new T.Group();
const update=plantParkTurf(T,root,(x,z)=>x>=-30&&x<=30&&z>=-100&&z<=-25&&Math.abs(x)>.95?1:0,()=>0,[{x:7,z:-45,r:.83}]);
const meshes=root.children[0].children;
assert.ok(meshes.length>40);
const p=new T.Vector3(),m=new T.Matrix4();
for(const mesh of meshes){
  assert.ok(!mesh.castShadow&&mesh.userData.noSceneQuery&&!mesh.material.transparent);
  const max=mesh.instanceMatrix.count;
  for(let i=0;i<max;i++){
    mesh.getMatrixAt(i,m);p.setFromMatrixPosition(m);
    assert.ok(Math.abs(p.x)>.949&&Math.hypot(p.x-7,p.z+45)>.829);
  }
}
let peak=0;
for(const [x,z] of [[0,-65],[8,-45],[19,-59],[-22,-87],[0,-20]]){
  update({x,z});const sum=meshes.filter(m=>m.visible).reduce((n,m)=>n+m.geometry.index.count*m.count/3,0);
  assert.ok(sum>0&&sum<=TURF_TRIANGLE_CAP);peak=Math.max(peak,sum);
}
update({x:200,z:200});assert.ok(meshes.every(m=>!m.visible));
assert.equal(turfBoxDist({minX:0,maxX:7,minZ:0,maxZ:7},9,-1),5);
assert.ok(TURF_LOD.fine.end<TURF_LOD.base.end);
console.log('Rasen: Ausschlüsse, Distanzstufen und Budget geprüft; '+peak+'/'+TURF_TRIANGLE_CAP+' Dreiecke im künstlich dichten Test.')
