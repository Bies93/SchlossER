import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GREY_AT,GREY_SITE,GREY_CUES,greyLane,greyShow} from '../src/grey-plan.js';
import {pathNetwork} from '../src/garden-ground.js';
import {layParkPaths} from '../src/park-plan.js';
import {insidePerimeter} from '../src/world-layout.js';
import {ORANGERY_PAVILION_X,ORANGERY_PAVILION_END} from '../src/orangery-plan.js';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';

const paths=pathNetwork(T);layParkPaths(paths);
for(let i=0;i<=200;i++){
  const {x,z}=greyLane(i/200);
  assert.ok(insidePerimeter(x,z));
  assert.ok(x>ORANGERY_PAVILION_X+.7||z<ORANGERY_PAVILION_END-.7);
}
assert.ok(paths.edge(GREY_AT.x,GREY_AT.z)>.8&&paths.edge(GREY_SITE.x,GREY_SITE.z)>2);
const scene=greyShow(),events=[];
assert.ok(!scene.begin(false)&&!scene.running&&scene.beat==='idle');
assert.equal(scene.step(18,t=>events.push(t)),false);
assert.ok(scene.begin(true)&&scene.beat==='laugh'&&!scene.begin(true));
for(let i=0;i<380;i++)scene.step(.049,t=>events.push(t));
assert.deepEqual(events,Object.keys(GREY_CUES));
assert.ok(scene.beat==='ash'&&!scene.step(30,t=>events.push(t)));
assert.equal(NPCS.grey.choices[0].reply.action,'grey-show');
assert.equal(NPCS.grey.choices[1].reply,undefined);
for(const id of ['grey','greyGiggle']){
  const clip=await readFile(new URL('../assets/npc-voices/'+NPC_VOICE_FILES[id],import.meta.url));
  assert.ok(clip.length>7000&&clip.subarray(0,3).toString()==='ID3');
}
console.log('Grey: beide Dialogwege, freier Laufweg und einmalige Effektfolge geprüft.');
