import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GREY_AT,GREY_SITE,GREY_CUES,greyLane,greyShow} from '../src/grey-plan.js';
import {pathNetwork} from '../src/garden-ground.js';
import {layParkPaths} from '../src/park-plan.js';
import {insidePerimeter} from '../src/world-layout.js';
import {ORANGERY_PAVILION_X,ORANGERY_PAVILION_END,ORANGERY_SECTIONS,orangeryTreeClear} from '../src/orangery-plan.js';
import {UPPER_ENTRY} from '../src/palace-openings.js';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';

const paths=pathNetwork(T);layParkPaths(paths);
assert.ok(!orangeryTreeClear(-61.2,-46.1,11.7),'Der alte Baum steckt im Mittelpavillon');
for(const {points,depth} of ORANGERY_SECTIONS)for(let i=1;i<points.length;i++){
  const [x,z]=points[i-1],[X,Z]=points[i],l=Math.hypot(X-x,Z-z),a=(Z-z)/l,b=(X-x)/l;
  assert.ok(!orangeryTreeClear((x+X)/2+a*depth*.5,(z+Z)/2-b*depth*.5,11.7));
  assert.ok(!orangeryTreeClear((x+X)/2-a*2,(z+Z)/2+b*2,11.7),'Platz für die Baumkrone vor der Fassade');
}
assert.ok(orangeryTreeClear(UPPER_ENTRY.treeX,UPPER_ENTRY.treeZ,8.5),'Der Rätselbaum bleibt stehen');
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
const interrupted=greyShow();
interrupted.begin(true);interrupted.step(2,()=>{});
assert.ok(interrupted.cancel()&&interrupted.beat==='idle'&&interrupted.begin(true));
assert.equal(NPCS.grey.choices[0].reply.action,'grey-show');
assert.equal(NPCS.grey.choices[1].reply,undefined);
assert.equal(NPCS.grey.name,'Chris');
for(const id of ['grey','greyGiggle']){
  const clip=await readFile(new URL('../assets/npc-voices/'+NPC_VOICE_FILES[id],import.meta.url));
  assert.ok(clip.length>(id==='greyGiggle'?3200:7000)&&clip.subarray(0,3).toString()==='ID3');
}
console.log('Chris: Dialog, Laufweg und Effektfolge geprüft; alle Orangerie-Bauteile bleiben baumfrei.');
