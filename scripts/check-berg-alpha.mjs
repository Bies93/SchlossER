import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BERG_POOL,BERG_CHAIRS,WEATHER_ZERO,BERG_FLOOR,bergInside,bergPlan,suspicionTick} from '../src/berg-layout.js';
import {bergArrival,bergReturn} from '../src/berg-tavern.js';
import {BENCH_SITES,insidePerimeter} from '../src/world-layout.js';
import {ORANGERY_PAVILION_X,ORANGERY_PAVILION_END,ORANGERY_END_PIER} from '../src/orangery-plan.js';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';
for(const {x,z} of [BERG_POOL,WEATHER_ZERO,bergReturn])assert.ok(insidePerimeter(x,z));
assert.ok(WEATHER_ZERO.x>ORANGERY_PAVILION_X&&WEATHER_ZERO.x<ORANGERY_PAVILION_X+.5);
assert.ok(Math.abs(WEATHER_ZERO.z-ORANGERY_PAVILION_END-ORANGERY_END_PIER*.5)<.001);
for(const [dx,dz] of BERG_CHAIRS){
  const x=BERG_POOL.x+dx,z=BERG_POOL.z+dz;assert.ok(insidePerimeter(x,z));
  assert.ok(BENCH_SITES.every(([a,b])=>Math.hypot(x-a,z-b)>4.5));
}
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
