import assert from 'node:assert/strict';
import * as T from 'three';
import {EQUIPMENT} from '../src/ego-assets.js';
import {weaponAction,recoilSpring} from '../src/weapon-action.js';
import {createPlayer} from '../src/player.js';
import {sceneQuery} from '../src/scene-query.js';
import {meleeAction} from '../src/melee-action.js';
import {counterfireState} from '../src/npc-counterfire.js';
import {playerVitals} from '../src/player-vitals.js';
import {gripHands} from '../src/ego-hands.js';

const spec=kind=>EQUIPMENT.find(s=>s.kind===kind);
const action=kind=>weaponAction(spec(kind));
const bow=action('bow'),bowSounds=[];
assert.equal(bow.rounds,1);
assert.equal(bow.fire(0),'fire');
assert.equal(bow.fire(.13),'busy');
assert.equal(bow.fire(.35),'busy');
bow.update(.35,x=>bowSounds.push(x));assert.equal(bow.visual(.4).phase,'reloading');
assert.ok(!bow.reload(.42));
bow.update(1.02,x=>bowSounds.push(x));assert.equal(bow.rounds,0);
bow.update(1.79,x=>bowSounds.push(x));assert.deepEqual(bowSounds,['open','close']);
assert.deepEqual([bow.rounds,bow.reserve],[1,23]);
const rifle=action('rifle');
for(let i=0;i<30;i++)assert.equal(rifle.fire(i*.125),'fire');
assert.equal(rifle.fire(3.675),'busy');assert.equal(rifle.fire(3.8),'busy');
rifle.update(4,()=>{});assert.equal(rifle.visual(4).phase,'reloading');rifle.cancel();
assert.deepEqual([rifle.rounds,rifle.reserve],[0,120]);
rifle.update(5,()=>{});rifle.update(6.65,()=>{});
assert.deepEqual([rifle.rounds,rifle.reserve],[30,90]);assert.equal(rifle.restock(),30);
const pump=action('shotgun'),pumpSounds=[];
assert.equal(pump.fire(0),'fire');assert.equal(pump.fire(.6),'busy');
assert.ok(pump.reload(.1));
pump.update(.29,x=>pumpSounds.push(x));pump.update(.65,x=>pumpSounds.push(x));pump.update(.76,x=>pumpSounds.push(x));
assert.deepEqual(pumpSounds,['open','close']);assert.equal(pump.rounds,5);
pump.update(1.18,x=>pumpSounds.push(x));
assert.equal(pump.rounds,6);assert.equal(pump.fire(1.19),'fire');
assert.equal(pump.reserve,35);assert.equal(pump.visual(1.21).phase,'cycling');
const pistol=action('pistol');
for(let i=0;i<15;i++)assert.equal(pistol.fire(i*.21),'fire');
assert.equal(pistol.visual(4).loaded,false);
pistol.update(4,()=>{});pistol.update(5.25,()=>{});assert.equal(pistol.rounds,15);
assert.equal(pistol.fire(5.3),'fire');pistol.update(9,()=>{});
assert.equal(pistol.rounds,14);assert.equal(pistol.visual(9).phase,'ready');
assert.ok(pistol.reload(9));pistol.update(10.25,()=>{});assert.equal(pistol.rounds,15);
const archive=action('archive'),archiveSounds=[];
assert.deepEqual([archive.rounds,archive.reserve],[1,24]);
assert.ok(!spec('archive').automatic&&spec('archive').impact>spec('rifle').impact);
assert.equal(archive.fire(0),'fire');assert.equal(archive.fire(.48),'busy');
archive.update(1.03,x=>archiveSounds.push(x));
assert.equal(archive.fire(1.21),'busy');
archive.update(1.43,x=>archiveSounds.push(x));assert.equal(archive.rounds,0);
archive.update(2.18,x=>archiveSounds.push(x));
assert.deepEqual(archiveSounds,['archive-open','archive-seat','archive-close']);
assert.deepEqual([archive.rounds,archive.reserve],[1,23]);
const empty=action('bow');
for(let i=0;i<=24;i++){
  assert.equal(empty.fire(i*2),'fire');empty.update(i*2+1.8,()=>{});
}
assert.deepEqual([empty.rounds,empty.reserve],[0,0]);assert.equal(empty.fire(50),'dry');
const a=recoilSpring(18),b=recoilSpring(18);
a.push(2);b.push(2);
const coarse=a.step(.1);let fine=0;
for(let i=0;i<10;i++)fine=b.step(.01);
assert.ok(coarse>.02&&Math.abs(coarse-fine)<1e-10&&a.step(1)<.0001);

const world={move(p,dx,dz){p.x+=dx;p.z+=dz;}},camera=new T.PerspectiveCamera();
const player=createPlayer(T,camera,world,()=>0),keys=new Set(['ControlLeft','KeyW']),stick={x:0,y:0,run:true};
for(let i=0;i<70;i++)player.tick(i*16,keys,stick);
assert.ok(player.motion.crouch>.99&&camera.parent.position.y<.91&&player.motion.speed<1.4);
keys.clear();for(let i=70;i<145;i++)player.tick(i*16,keys,stick);
assert.ok(player.motion.crouch<.01&&camera.parent.position.y>1.66);

const scene=new T.Scene(),wood=new T.MeshStandardMaterial();wood.name='Red Oak';
const board=new T.Mesh(new T.BoxGeometry(1,1,1),wood);board.position.z=-2;scene.add(board);
const query=sceneQuery(T,scene,null),sample={};query.build();
assert.equal(query.trace(new T.Ray(new T.Vector3(),new T.Vector3(0,0,-1)),3,1,.02,false,sample),1.5);
assert.equal(sample.material,'wood');
const [fistModel]=gripHands(T,[{kind:'fist',fore:[0,0,0],grip:[0,0,0]}]);
for(const node of fistModel.nodes){
  const bounds=new T.Box3().setFromObject(node),span=bounds.getSize(new T.Vector3());
  assert.ok(span.x>.10&&span.y>.06&&span.z>.125,'Faustmodell hat Handrücken, Knöchel und volles Handgelenk');
}

const punchScene=new T.Scene(),partition=new T.Mesh(new T.BoxGeometry(1.5,2,.065),wood);
partition.position.set(0,1,-.85);punchScene.add(partition);
const punchQuery=sceneQuery(T,punchScene,null);punchQuery.build();
const egocam=new T.PerspectiveCamera();egocam.position.y=1.67;egocam.updateMatrixWorld();
const sphere=new T.Sphere(new T.Vector3(0,1.61,-1.12),.125),expanded=sphere.clone(),at=new T.Vector3();
const victim={alive:true};let blows=0,marks=[];
const fist=meleeAction(T,punchQuery,{
  nearest(ray,limit,mask,pad){
    if(!(mask&1))return null;expanded.center.copy(sphere.center);expanded.radius=sphere.radius+pad;
    if(!ray.intersectSphere(expanded,at))return null;
    const distance=at.distanceTo(ray.origin);if(distance>limit)return null;
    const core=sphere.clampPoint(at,new T.Vector3());
    return {actor:victim,distance,point:at.clone(),core,region:'body'};
  },damage(){blows++;return true;}
},()=>({layer:0,mask:1}),(_,kind)=>marks.push(kind));
assert.ok(fist.begin(0));fist.step(.20,egocam);assert.equal(blows,0);assert.deepEqual(marks,['solid']);
partition.visible=false;marks=[];
assert.ok(fist.begin(.50));fist.step(.56,egocam);assert.equal(blows,0);
fist.step(.72,egocam);fist.step(.75,egocam);assert.equal(blows,1);assert.deepEqual(marks,['body']);
assert.equal(fist.begin(.76),false);
sphere.center.z=-2.6;assert.ok(fist.begin(1));fist.step(1.22,egocam);assert.equal(blows,1);

const defense=counterfireState(),modes=new Set();let shots=0,inSight=true,lastShot=0,testTime=0;
const simulate=(steps,can=true)=>{for(let i=0;i<steps;i++){
  testTime+=.02;
  const state=defense.tick(.02,()=>inSight,can,()=>{lastShot=testTime;shots++;return true;});
  if(state)modes.add(state.mode);
}};
simulate(200);assert.equal(shots,0);
assert.ok(defense.provoke());assert.equal(defense.provoke(),false);
simulate(30);assert.equal(shots,0);simulate(12,false);assert.equal(shots,0);
simulate(18);assert.equal(shots,1);assert.ok(testTime-lastShot<.36);
inSight=false;simulate(90);assert.equal(shots,1);assert.ok(modes.has('search'));
inSight=true;simulate(360);assert.ok(shots>5&&modes.has('reload'));
inSight=false;simulate(280);assert.equal(defense.active,false);assert.ok(modes.has('holster'));
const life=playerVitals();assert.ok(life.hit(21));assert.equal(life.hp,79);assert.ok(life.tick(.13));
assert.ok(life.hit(92));assert.ok(life.down);assert.equal(life.hit(3),false);life.reset();assert.equal(life.hp,100);
console.log('Automatik- und manuelles Nachladen, Reserve, Faust/Kollision, Gegenwehr/Sichtlinie, Gesundheit, Knien und Oberflächen geprüft.');
