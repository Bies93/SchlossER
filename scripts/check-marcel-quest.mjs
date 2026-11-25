import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {installHumans} from '../src/human-character.js';
import {NPCS} from '../src/npc-lines.js';
import {collisionWorld} from '../src/collision.js';
import {addFixedColliders,BOUNDS,PLAYER,insidePerimeter} from '../src/world-layout.js';
import {addPlazaInfoStand,INFO_SITE} from '../src/plaza-info-stand.js';
import {addPlazaMarcel} from '../src/plaza-marcel.js';
import {marcelStandQuest} from '../src/plaza-marcel-quest.js';
import {sceneQuery} from '../src/scene-query.js';
import {combatTargets} from '../src/combat-targets.js';

globalThis.document={createElement:()=>({getContext:()=>new Proxy({}, {get:(o,k)=>o[k]??(()=>{})})})};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const bytes=await readFile(new URL('../assets/human-cast.glb',import.meta.url));
const {scene:asset}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
assert.deepEqual(NPCS.marcel.choices.map(c=>c.label),['Klar!','Äh nee, lass mal..']);
assert.equal(NPCS.marcel.choices[0].reply.clip,'marcelSuper');
assert.equal(NPCS.marcel.choices[1].reply,undefined);

function setup(){
  installHumans(T,asset);
  const scene=new T.Scene(),world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter),floorAt=()=>0;
  addFixedColliders(world);
  const marcel=addPlazaMarcel(T,scene,world,floorAt),stand=addPlazaInfoStand(T,scene,world,floorAt);
  const lead=marcel.rig.npcInfo,defenders=stand.cast.map(x=>x.npcInfo);
  const homes=new Map([lead,...defenders].map(n=>[n,n.actor.position.clone()]));
  const query=sceneQuery(T,scene,null);query.build();
  const losses=[],hits=[],results=[],sounds=[],phases=new Set();
  const target=combatTargets(T,query,{},world,floorAt,id=>losses.push(id));
  const c=marcelStandQuest(T,marcel,stand,{world,floorAt,query,targets:{damage(n,...args){
    const ok=target.damage(n,...args);if(ok)hits.push(n.id);return ok;
  }},sound:k=>sounds.push(k),outcome:r=>results.push(r)});
  return {c,lead,defenders,homes,losses,hits,results,sounds,phases,target,step(dt,audible){
    phases.add(c.phase);c.update(dt,audible);target.tick(dt,1);
  }};
}

for(const dt of [1/60,.042]){
  const s=setup(),{c,lead,defenders,homes,results,sounds,hits,losses,phases}=s;
  const at=lead.actor.position.clone();
  for(let t=0;t<2;t+=dt)s.step(dt,true);
  assert.equal(c.phase,'idle');assert.ok(at.equals(lead.actor.position)&&hits.length===0);
  defenders[0].hostile=true;assert.equal(c.start(),false);defenders[0].hostile=false;
  assert.ok(c.start());assert.ok(!c.start());
  // Audible and inaudible run the exact same sequence; neither is supplied a player.
  for(let t=0;t<26&&c.phase!=='done';t+=dt)s.step(dt,dt<.02);
  const trace=Array.from(phases).join(' → ');
  assert.deepEqual(results,['complete'],trace+' · '+JSON.stringify(hits));
  assert.equal(c.phase,'done',trace);
  assert.deepEqual(losses,['marcel']);assert.ok(!lead.alive&&!lead.questBusy&&lead.hp===0);
  assert.ok(Math.hypot(lead.actor.position.x-INFO_SITE.x,lead.actor.position.z-INFO_SITE.z)<4);
  assert.deepEqual(hits,['infoHeide','marcel','infoGrete','marcel','infoLuisa','marcel','marcel']);
  for(const n of defenders)assert.ok(n.alive&&!n.questBusy&&n.actor.position.distanceTo(homes.get(n))<.075);
  assert.ok(!c.start());
  if(dt<.02)assert.ok(sounds.includes('brawl-fall')&&sounds.filter(k=>k==='brawl-hit').length===7);
  else assert.equal(sounds.length,0);
}
const s=setup();assert.ok(s.c.start());
const victim=s.defenders[0];s.target.collapse(victim,victim.chest.getWorldPosition(new T.Vector3()),new T.Vector3(0,0,1));
for(let t=0;t<16&&s.c.phase!=='done';t+=.04)s.step(.04,true);
assert.deepEqual(s.results,['interrupted']);assert.deepEqual(s.losses,[victim.id]);
assert.ok([s.lead,...s.defenders].every(n=>!n.questBusy));
console.log('Marcel-Quest: freier Laufweg, alle drei Gegenangriffe, korrekte Trefferfolge, Rückkehr, kein Spielereingriff und sauberer Abbruch geprüft.');
