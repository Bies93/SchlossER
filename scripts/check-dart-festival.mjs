import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';
import {DART_HITS,scoreAt} from '../src/festival-darts.js';

assert.equal(scoreAt(0,0),50);
assert.equal(scoreAt(0,.020),25);
assert.equal(scoreAt(0,.124),20);
assert.equal(scoreAt(0,.206),60);
assert.equal(scoreAt(0,.311),40);
assert.equal(scoreAt(0,.33),0);
assert.deepEqual(DART_HITS.map(([x,y])=>scoreAt(x,y)),[18,24,2]);

const read=name=>readFile(new URL('../'+name,import.meta.url));
const asText=async name=>(await read(name)).toString();
const manifest=html=>JSON.parse(html.match(/<script type="application\/json" id="assets">([^<]+)/)[1]);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,12);
const web=await asText('index.html');
const viewer=await read('viewer.js');
assert.ok(web.includes('viewer.js?v='+digest(viewer)));
const escaped=s=>s.replace(/[^\x20-\x7E]/g,c=>'\\x'+c.charCodeAt(0).toString(16).toUpperCase());
const line=NPCS.festZwanni.line,hasLine=s=>s.includes(line)||s.toLowerCase().includes(escaped(line).toLowerCase());
assert.ok(hasLine(viewer.toString()),'Zwannis Text im Web-Bundle veraltet');
const offline=process.argv.includes('--offline')?await asText('dist/Schlossgarten.html'):null;
if(offline)assert.ok(hasLine(offline),'Zwannis Text in der Offline-Version veraltet');
for(const id of ['festZwanni',NPCS.festZwanni.choices.at(-1).reply.clip]){
  const path='assets/npc-voices/'+NPC_VOICE_FILES[id],clip=await read(path);
  assert.equal(manifest(web).npcVoices[id],path+'?v='+digest(clip));
  if(offline)assert.equal(manifest(offline).npcVoices[id],'data:audio/mpeg;base64,'+clip.toString('base64'));
}
console.log('Trefferwertung und Zwannis Text + Sprachdateien in den Build-Artefakten stimmen.');
