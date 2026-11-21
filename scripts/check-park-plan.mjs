import assert from 'node:assert/strict';
import * as T from 'three';
import {pathNetwork} from '../src/garden-ground.js';
import {BASIN,layParkPaths,woodlandDensity} from '../src/park-plan.js';
import {planBeds} from '../src/parterre.js';
import {CHAPTER_BAY_PATH} from '../src/chapter-layout.js';
import {BERG_POOL} from '../src/berg-layout.js';
import {GARDEN_GATES,insidePerimeter} from '../src/world-layout.js';
const net=pathNetwork(T),plan=layParkPaths(net);
net.add(CHAPTER_BAY_PATH,1.66,'compact');
const b=planBeds(plan,net,(x,z)=>Math.hypot(Math.max(0,Math.abs(x)-4.75),z+47)>10.40);
assert.ok(b.strips.length>=6);
assert.ok(b.strips.reduce((n,s)=>n+s.points.length,0)>.72*245);
for(const {points,width} of b.strips)for(const {x,z} of points){
  assert.ok(net.edge(x,z)>width*.50+.16);
  assert.ok(b.atBed(x,z)&&insidePerimeter(x,z));
}
for(const {gate,path} of plan.approaches){
  if(gate.b){
    const mid=(gate.a[0]+gate.b[0])*.5,z=gate.a[1];
    assert.ok(net.edge(mid,z)<-1.1);
  }
  assert.ok(path.vertices[0].z>-17&&path.vertices.at(-1).z<-17);
}
for(const {path} of Object.values(GARDEN_GATES))assert.ok(net.edge(...path.at(-1))<-.8);
assert.ok(net.edge(0,-21)<-1.8);
assert.ok(net.edge(BERG_POOL.x,BERG_POOL.z)>.75);
assert.ok(woodlandDensity(-6.15,-164.1)<.27);
assert.ok(Math.abs(plan.ring.curve.getPointAt(0).x-BASIN.rx)<.04);
console.log(b.strips.length+' Beete mit freien Übergängen, Toranschlüsse und Parkstandorte geprüft.');
