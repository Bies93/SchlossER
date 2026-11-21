import assert from 'node:assert/strict';
import {CROWN_ROOMS,HALL_WALL,DOOR_HALF,crownCampaign} from '../src/crown-campaign.js';
assert.equal(CROWN_ROOMS.length,8);
assert.equal(new Set(CROWN_ROOMS.map(r=>r.id)).size,8);
for(const side of [-1,1]){
  const row=CROWN_ROOMS.filter(r=>r.side===side).sort((a,b)=>a.min-b.min);
  for(const [i,r] of row.entries()){
    assert.ok(r.door-DOOR_HALF>r.min&&r.door+DOOR_HALF<r.max&&HALL_WALL>1.67);
    if(i>0)assert.equal(r.min,row[i-1].max);
  }
}
for(const order of [['mark','cut'],['cut','mark']]){
  const g=crownCampaign();
  assert.ok(g.use('gate',100));assert.equal(g.s.crypt,false);
  assert.equal(g.use('engine',200),null);
  g.use(order[0],300);g.use('gate',400);assert.equal(g.s.crypt,false);
  g.use(order[1],500);assert.equal(g.s.crypt,false);
  g.use('gate',600);assert.equal(g.s.crypt,true);
  assert.match(g.use('engine',750).voice,/Mikrofone/);
  assert.equal(g.s.heard,true);
  g.use('gate',800);assert.equal(g.s.crypt,true);
}
console.log('8 Räume und Geheimnisfolge in beiden Reihenfolgen geprüft.');
