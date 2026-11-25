import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';
import {bindNpcDialogue} from '../src/npc-dialogue-ui.js';
import {fountainQuest} from '../src/fountain-quest.js';

const clicks=new Map(),keyEvents=new Map();
const fake=()=>({textContent:'',disabled:false,addEventListener:(ev,fn)=>{clicks.set(ev,fn);}});
const buttons=[0,1,2].map(()=>{const span=fake();return {...fake(),span,querySelector:()=>span};});
const listeners=new Map();
for(const b of buttons)b.addEventListener=(ev,fn)=>listeners.set(b,fn);
const name=fake(),line=fake(),hint=fake(),close=fake();
const element={querySelector:s=>({'h2':name,'p':line,'[data-dialogue-hint]':hint,'[data-dialogue-close]':close})[s],
  querySelectorAll:()=>buttons,showModal(){this.isOpen=true;},close(){this.isOpen=false;},
  addEventListener:(ev,fn)=>listeners.set(ev,fn)};
globalThis.window={addEventListener:(ev,fn)=>keyEvents.set(ev,fn)};
const actions=[],plays=[],attention=[],closed=[],greyReplies=[],questReplies=[];
const quest=fountainQuest();
let finish,alive=true;
const ui=bindNpcDialogue({element,play(s,a,f){plays.push(s.id);finish=f;},stop(){},onOpen(){},onClose(reason){closed.push(reason);},
  nextSpeech:quest.followup,
  onReply(s,r){
    if(s.id==='grey')greyReplies.push(r.action);
    else if(r.action)questReplies.push(r.action);
    else actions.push([s.id,r.clip,r.reaction]);
  }});
const open=id=>ui.open({id,...NPCS[id],listen:on=>attention.push([id,on]),alive:()=>alive});
function key(code){keyEvents.get('keydown')({code,preventDefault(){},stopImmediatePropagation(){}});}
for(const id of ['niklas','gardenHannes','bergFritz','bergWirt']){
  for(const clip of [id,...(NPCS[id].choices??[]).map(a=>a.reply.clip)]){
    const file=NPC_VOICE_FILES[clip];
    assert.ok(file&&file.startsWith('dialog-'));
    const data=await readFile(new URL('../assets/npc-voices/'+file,import.meta.url));
    assert.ok(data.subarray(0,3).toString()==='ID3'||data[0]===255&&data[1]>=224);
  }
}
assert.ok(open('niklas'));key('KeyJ');assert.equal(actions.length,0);
finish();key('KeyJ');assert.deepEqual(actions.at(-1),['niklas','niklasAntwort',undefined]);
assert.ok(open('niklas'));finish();key('KeyN');assert.deepEqual(actions.at(-1),['niklas','niklasAntwort',undefined]);
assert.ok(open('gardenHannes'));finish();key('KeyJ');assert.deepEqual(actions.at(-1),['gardenHannes','jakeDumm',undefined]);
assert.ok(open('gardenHannes'));finish();key('KeyN');assert.deepEqual(actions.at(-1),['gardenHannes','jakeNaeher',undefined]);
for(const b of buttons.slice(0,2)){
  assert.ok(open('bergFritz'));finish();listeners.get(b)();
  assert.deepEqual(actions.at(-1),['bergFritz','bonsSchluchzen','sob']);
}
assert.equal(actions.length,6);assert.equal(plays.length,6);
assert.ok(open('bergFritz'));finish();
listeners.get('cancel')({preventDefault(){}});assert.equal(actions.length,6);
assert.ok(open('bergFritz'));clicks.get('click')();assert.equal(closed.at(-1),'dismiss');
assert.equal(actions.length,6);
assert.ok(open('bergFritz'));finish();alive=false;key('KeyJ');assert.equal(actions.length,6);
assert.ok(!ui.pending()&&!element.isOpen);
assert.deepEqual(attention.filter(([id])=>id==='niklas'),[['niklas',true],['niklas',false],['niklas',true],['niklas',false]]);
alive=true;
for(const id of ['festZwanni',NPCS.festZwanni.choices[1].reply.clip]){
  const bytes=await readFile(new URL('../assets/npc-voices/'+NPC_VOICE_FILES[id],import.meta.url));
  assert.ok(bytes.length>8000&&(bytes.subarray(0,3).toString()==='ID3'||bytes[0]===255&&bytes[1]>=224));
}
assert.ok(open('festZwanni'));finish();key('KeyJ');
assert.equal(actions.length,6);assert.equal(closed.at(-1),'answer');assert.ok(!ui.pending());
assert.ok(open('festZwanni'));finish();key('KeyN');
assert.deepEqual(actions.at(-1),['festZwanni','festZwanniEier',undefined]);
assert.ok(open('grey'));key('KeyJ');assert.equal(greyReplies.length,0);
finish();key('KeyN');assert.equal(greyReplies.length,0);assert.ok(!ui.pending());
assert.ok(open('grey'));finish();key('KeyJ');
assert.deepEqual(greyReplies,['grey-show']);assert.ok(!ui.pending());
assert.ok(quest.collect());
assert.ok(ui.open(quest.opening({id:'niklas',...NPCS.niklas,alive:()=>true})));
assert.equal(buttons[2].hidden,false);
key('Digit3');assert.equal(questReplies.length,0);finish();key('Digit3');
assert.deepEqual(questReplies,['return-fundsache']);
assert.ok(open('festZwanni'));assert.ok(buttons[2].hidden);finish();
const before=closed.length;key('KeyN');
assert.equal(closed.length,before,'Folgeschritt darf Pointerlock nicht zwischenzeitlich anfordern');
assert.ok(element.isOpen);assert.equal(ui.pending().clip,'festZwanniEier');
key('KeyJ');assert.equal(questReplies.length,1);finish();key('KeyJ');
assert.deepEqual(questReplies,['return-fundsache','feed-fundsache']);
assert.ok(!ui.pending()&&!element.isOpen);
assert.ok(open('marcel'));finish();key('KeyN');
assert.deepEqual(questReplies,['return-fundsache','feed-fundsache'],'Ablehnen startet Marcels Szene nicht');
assert.ok(open('marcel'));key('KeyJ');assert.equal(questReplies.length,2);
finish();listeners.get(buttons[0])();assert.equal(questReplies.at(-1),'marcel-stand');
assert.equal(NPCS.marcel.choices[0].reply.line,'Super!');assert.ok(!ui.pending());
console.log('Dialogzweige, Intro-Sperre, dritte Auswahl, modaler Quest-Folgeschritt, Abbruch und Audiozuordnung geprüft.');
