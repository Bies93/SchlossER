import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';

const root=new URL('../',import.meta.url);
async function manifest(name){
  const html=await readFile(new URL(name,root),'utf8');
  return JSON.parse(html.match(/<script type="application\/json" id="assets">([^<]+)<\/script>/)[1]).npcVoices;
}
const web=await manifest('index.html'),offline=await manifest('dist/Schlossgarten.html');
assert.deepEqual(Object.keys(web),Object.keys(NPC_VOICE_FILES));
assert.deepEqual(Object.keys(offline),Object.keys(web));
const voiceCount=Object.keys(web).length;
for(const [id,filename] of Object.entries(NPC_VOICE_FILES)){
  const relative='assets/npc-voices/'+filename,original=await readFile(new URL(relative,root));
  const sha=createHash('sha256').update(original).digest('hex').slice(0,12);
  assert.equal(web[id],relative+'?v='+sha);
  assert.equal(offline[id],'data:audio/mpeg;base64,'+original.toString('base64'));
}
const audio=(await build({entryPoints:[fileURLToPath(new URL('src/audio.js',root))],
  bundle:true,write:false,format:'iife',globalName:'npcAudio'})).outputFiles[0].text;
const test=`
(async()=>{
  const out=document.querySelector('pre'),urls=JSON.parse(document.getElementById('voice-assets').textContent);
  const listener={x:0,y:1.67,z:0,rightX:1,rightZ:0};
  const engine=npcAudio.makeAudio(()=>listener,null,null,null,null,null,urls);
  engine.play();
  let count=0;
  try{
    for(const id of Object.keys(urls)){
      const time=await new Promise((ok,fail)=>{
        const timer=setTimeout(()=>fail(Error(id+' startet nicht')),3000);
        engine.playNpc(id,{x:.5,y:0,z:.8},duration=>{clearTimeout(timer);ok(duration);});
      });
      if(!Number.isFinite(time)||time<=0||!engine.npcTalking(id))throw Error(id+' meldet ungültige Wiedergabe');
      out.textContent+=id+'  '+time.toFixed(2)+' s\\n';count++;
    }
    engine.pause();
    if(Object.keys(urls).some(engine.npcTalking))throw Error('Pause beendet die Stimme nicht');
    out.textContent+='\\n'+count+'/${voiceCount} MP3s mit Web Audio gestartet; Pause beendet die Wiedergabe.';
  }catch(e){out.textContent+='\\nFEHLER: '+e.message;}
})();`;
await writeFile(new URL('dist/npc-audio-check.html',root),
  '<!doctype html><meta charset="utf-8"><title>SchlossER · NPC-Audiocheck</title><pre></pre>'+
  '<script id="voice-assets" type="application/json">'+JSON.stringify(offline)+'</script>'+
  '<script>'+audio+test+'</script>');
console.log(`${voiceCount}/${voiceCount} MP3s korrekt im Web- und Offline-Manifest; Browsercheck: dist/npc-audio-check.html`);
