import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BERG_POOL,WEATHER_ZERO,BERG_FLOOR,bergInside,bergPlan,suspicionTick} from '../src/berg-layout.js';
import {bergArrival,bergReturn} from '../src/berg-tavern.js';
import {insidePerimeter} from '../src/world-layout.js';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';
for(const {x,z} of [BERG_POOL,WEATHER_ZERO,bergReturn])assert.ok(insidePerimeter(x,z));
assert.ok(bergInside({...bergArrival,y:BERG_FLOOR}));
assert.ok(!bergInside({...bergReturn,y:0}));
assert.ok(!bergPlan(BERG_POOL.x+12,BERG_POOL.z));
let v=0;
for(let i=0;i<100;i++)v=suspicionTick(v,.05,true);
assert.equal(v,1);
for(let i=0;i<40;i++)v=suspicionTick(v,.05,false);
assert.equal(v,0);
for(const [id,filename] of Object.entries(NPC_VOICE_FILES).filter(([id])=>id.startsWith('berg'))){
  assert.ok(NPCS[id]?.line&&NPCS[id]?.template);
  assert.ok((await readFile(new URL('../assets/npc-voices/'+filename,import.meta.url))).length>2000);
}
console.log('Parkstandorte, Berg-Ebenen, Verdachtszähler und Stimmen vorhanden.');
