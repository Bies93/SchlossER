import assert from 'node:assert/strict';
import * as T from 'three';
import {plantParkTurf,TURF_PROFILES,turfTriangleCap,turfBoxDist} from '../src/park-turf.js';
const root=new T.Group();
const update=plantParkTurf(T,root,(x,z)=>x>=-30&&x<=30&&z>=-100&&z<=-25&&Math.abs(x)>.95?1:0,()=>0,[{x:7,z:-45,r:.83}]);
const meshes=root.children[0].children;
assert.ok(meshes.length>40);
const p=new T.Vector3(),m=new T.Matrix4();
const coverSites=new Set(),fineSites=[];
for(const mesh of meshes){
  assert.ok(!mesh.castShadow&&mesh.userData.noSceneQuery&&!mesh.material.transparent);
  const max=mesh.instanceMatrix.count;
  for(let i=0;i<max;i++){
    mesh.getMatrixAt(i,m);p.setFromMatrixPosition(m);
    assert.ok(Math.abs(p.x)>.949&&Math.hypot(p.x-7,p.z+45)>.829);
    const id=p.x+':'+p.z;
    if(mesh.material.map)coverSites.add(id);else fineSites.push(id);
  }
}
assert.ok(fineSites.length>0&&fineSites.every(p=>coverSites.has(p)));
assert.ok(coverSites.size>36000); // roughly 10 independent patches / m² before paths and exclusions
let previous=0;
for(const [preset,profile] of Object.entries(TURF_PROFILES)){
  assert.ok(profile.fine.end<profile.base.end);
  let peak=0;
  const cap=turfTriangleCap(profile);
  for(const [x,z] of [[0,-65],[8,-45],[19,-59],[-22,-87],[0,-20]]){
    update({x,z},preset);
    const sum=meshes.filter(m=>m.visible).reduce((n,m)=>n+m.geometry.index.count*m.count/3,0);
    assert.ok(sum>0&&sum<=cap);peak=Math.max(peak,sum);
  }
  assert.ok(peak>previous);previous=peak;
  console.log('Rasen '+preset+': '+peak+'/'+cap+' Dreiecke vor Kameraculling (dichter Test).');
}
const count=()=>meshes.reduce((n,m)=>n+(m.visible?m.count:0),0);
update({x:0,z:-65},'fast');const fast=count();
update({x:0,z:-65},'high');assert.ok(count()>fast);
update({x:200,z:200});assert.ok(meshes.every(m=>!m.visible));
assert.equal(turfBoxDist({minX:0,maxX:7,minZ:0,maxZ:7},9,-1),5);
console.log('Rasen: Ausschlüsse und unabhängige Schichten geprüft.');
