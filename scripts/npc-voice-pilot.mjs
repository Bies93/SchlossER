// Local production only. No synthesis runtime is shipped with SchlossER.
// node scripts/npc-voice-pilot.mjs synth [Niklas|Jake]
// node scripts/npc-voice-pilot.mjs export <ffmpeg.exe> [Niklas|Jake] (build with libmp3lame + librubberband)
// node scripts/npc-voice-pilot.mjs compare
// VOICE_LAB optionally overrides %LOCALAPPDATA%/SchlossER/VoiceLab.
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {NPCS} from '../src/npc-lines.js';
import {fountainQuest} from '../src/fountain-quest.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';

const repo=fileURLToPath(new URL('../',import.meta.url));
const assetDir=join(repo,'assets','npc-voices');
const lab=process.env.VOICE_LAB||join(process.env.LOCALAPPDATA||repo,'SchlossER','VoiceLab');
const dist=join(repo,'dist');
const model='qwen3-tts-12hz-1.7b-voicedesign-q8_0.gguf';
// Apache 2.0. Original weights: huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign
// audio.cpp-compatible conversion: huggingface.co/koboldcpp/tts/tree/d9e08ee68341cdc294dcd100348abadba92da0a4/audiocpp
// New synthetic characters, designed with text direction only. No HeyGen or human reference audio.
const niklas={id:'niklas',...NPCS.niklas};
const jake={id:'gardenHannes',...NPCS.gardenHannes};
const quest=fountainQuest();
quest.collect();
quest.deliver(niklas.id,'return-fundsache',true);
const reward=quest.opening(niklas);
const cue=(id,line,original)=>({id,line,original});
const reply=(speech,n,original)=>{
  const {clip,line}=speech.choices[n].reply;
  return cue(clip,line,original);
};
const profiles=[
  {name:'Niklas',take:'niklas-take01',seed:2194,threads:4,
    // Nudge the register down without changing speed or vowel formants.
    finish:'rubberband=pitch=0.89:formant=preserved,bass=f=170:g=1.2,',
    direction:'A native German male actor, speaking very natural Standard German, medium-low warm baritone with an unpolished, slightly dry texture. Young adult working as a stiff butler; deadpan, slightly embarrassed first question with a tiny pause after Hi, then disappointed and sincerely hopeful on sentence two, and surprised, honest relief and delight on the last sentence. The three subsequent sentences are separate dialogue takes; leave a clear beat of silence between them. Keep the same speaker. Mic close and conversational, no announcing, no added words.',
    cues:[cue(niklas.id,niklas.line,'dialog-niklas-frage.mp3'),reply(niklas,0,'dialog-niklas-antwort.mp3'),cue(reward.clip,reward.line,'niklas-fundsache.mp3')]},
  {name:'Jake',take:'jake-take02',seed:9882,threads:4,
    direction:'Ein junger deutscher Mann, weicher heller Tenor mit leicht rauchiger Stimme, natürlich und entspannt statt wie ein Sprecher. Beim ersten Satz verträumt, beim zweiten leicht verlegen und selbstironisch, beim dritten aufmunternd mit leiser Vorfreude. Sprich alle Wörter in klarem Hochdeutsch genau wie geschrieben; besonders „tritt näher an ihn“. Entspannte kurze Sprechpausen am Satzende. Keine zusätzlichen Wörter.',
    cues:[cue(jake.id,jake.line,'dialog-jake-baeume.mp3'),reply(jake,0,'dialog-jake-dumm.mp3'),reply(jake,1,'dialog-jake-naeher.mp3')]}
];
// Seconds into the respective raw WAV; allow space around the first/last phoneme.
const cuts={
  niklas:[0,2.055],niklasAntwort:[2.025,4.45],niklasFundsache:[4.55,6.80],
  gardenHannes:[.27,2.02],jakeDumm:[2.57,5.52],jakeNaeher:[6.26,9.40]
};

function run(bin,args,capture=false){
  const result=spawnSync(bin,args,{encoding:'utf8',stdio:capture?['ignore','pipe','pipe']:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(`${bin} exited with ${result.status}\n${result.stderr??''}`);
  return result.stderr;
}
const wav=take=>join(lab,take+'.wav');
const [, , command, option, character]=process.argv;
const only=command==='synth'?option:command==='export'?character:null;
const selected=only?profiles.filter(p=>p.name.toLowerCase()===only.toLowerCase()):profiles;
if(!selected.length)throw Error('Unknown character: '+only);
if(command==='synth'){
  mkdirSync(lab,{recursive:true});
  for(const p of selected){
    run(join(lab,'audio-cpp-0.9.6','audiocpp_cli.exe'),[
      '--task','tts','--family','qwen3_tts','--model',join(lab,'models',model),'--backend','cpu',
      '--threads',String(p.threads),'--language','de','--text',p.cues.map(c=>c.line).join(' '),
      '--text-chunk-size','500','--instruct',p.direction,'--seed',String(p.seed),
      '--log','--metrics','--out',wav(p.take)
    ]);
  }
}else if(command==='export'){
  const ffmpeg=option||'ffmpeg';
  for(const p of selected)for(const c of p.cues){
    const cut=cuts[c.id],file=NPC_VOICE_FILES[c.id];
    if(!cut||!file||file===c.original)throw Error('Missing pilot edit for '+c.id);
    const [start,end]=cut,duration=end-start;
    const input=['-nostdin','-hide_banner','-ss',String(start),'-i',wav(p.take)];
    const chain=`atrim=duration=${duration.toFixed(4)},highpass=f=65,${p.finish??''}afade=t=in:d=0.009,afade=t=out:st=${(duration-.018).toFixed(4)}:d=0.018`;
    // Measure once, then apply a constant gain: preserve the acting dynamics.
    const report=run(ffmpeg,[...input,'-af',chain+',loudnorm=print_format=json','-f','null','-'],true);
    const {input_i,input_tp}=JSON.parse(report.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
    if(!Number.isFinite(+input_i)||!Number.isFinite(+input_tp))throw Error('Silent cue: '+c.id);
    const gain=Math.min(-19-input_i,-2.5-input_tp);
    run(ffmpeg,[...input,'-loglevel','error','-af',chain+`,volume=${gain.toFixed(2)}dB`,
      '-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','64k','-map_metadata','-1','-y',join(assetDir,file)]);
  }
}else if(command==='compare'){
  const escape=s=>s.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
  const player=file=>`<audio controls preload="none" src="data:audio/mpeg;base64,${readFileSync(join(assetDir,file)).toString('base64')}"></audio>`;
  const cards=profiles.map(p=>`<section><h2>${p.name}</h2>${p.cues.map(c=>`<article><h3>${escape(c.line)}</h3>
    <div><span>Bisher · HeyGen</span>${player(c.original)}</div>
    <div><span>Neu · lokaler Pilot</span>${player(NPC_VOICE_FILES[c.id])}</div></article>`).join('')}</section>`).join('');
  mkdirSync(dist,{recursive:true});
  const out=join(dist,'stimmenvergleich.html');
  writeFileSync(out,`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>SchlossER · Stimmenvergleich</title>
    <style>
    :root{color-scheme:dark}body{background:#111916;color:#f3e9d9;font:1rem/1.5 system-ui;margin:0;padding:clamp(1rem,4vw,3rem)}
    main{max-width:960px;margin:auto}h1,h2{font-family:Georgia,serif;color:#ffd79b}h1{font-size:clamp(2rem,5vw,3.5rem);margin:0}
    section{margin-top:2rem}article{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:.65rem 1.2rem;
    padding:.85rem 1.1rem;background:#1b2621;border:1px solid #48554b;border-radius:10px;margin:.7rem 0}
    h3{grid-column:1/-1;margin:0}span{display:block;font-size:.9rem;margin-bottom:.3rem}audio{display:block;width:100%}
    </style><main><h1>Stimmenvergleich</h1><p>SchlossER · Sechs Zeilen im direkten Vorher/Nachher-Vergleich.</p>${cards}</main>
    <script>document.addEventListener('play',e=>{for(const a of document.querySelectorAll('audio'))if(a!==e.target)a.pause()},true)</script></html>`);
  console.log(out);
}else{
  throw Error('Usage: npm not required. node scripts/npc-voice-pilot.mjs synth|export|compare [ffmpeg.exe]');
}
