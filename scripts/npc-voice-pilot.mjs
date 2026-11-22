// Local production only. No synthesis runtime is shipped with SchlossER.
// node scripts/npc-voice-pilot.mjs synth [name]
// node scripts/npc-voice-pilot.mjs export <ffmpeg.exe> [name] (build with libmp3lame)
// node scripts/npc-voice-pilot.mjs compare [name ...]
// VOICE_LAB optionally overrides %LOCALAPPDATA%/SchlossER/VoiceLab.
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
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
  {name:'Auer',displayName:NPCS.labAuer.name,take:'auer-raben-take01',seed:4418,threads:4,
    direction:'Ein deutscher Arzt Anfang fünfzig, gepflegte ruhige mitteltiefe Männerstimme, Hochdeutsch. Sagt den Satz leise und trocken, mit der fassungslosen Ernsthaftigkeit eines Arztes im Nachtdienst. Natürliche klare Aussprache. Nur diesen Satz, keine Geräusche.',
    cues:[cue('labAuer',NPCS.labAuer.line,'dr_ernst_auer.mp3')]},
  {name:'Tobias',displayName:NPCS.labPatient.name,take:'tobias-schrei-take01',seed:5839,threads:4,
    text:'Aaaah!',targetLufs:-17,peakCeiling:-1.5,finish:'atempo=0.84,',
    direction:'Ein einziger echter kurzer Schreckensschrei eines erwachsenen Mannes. Ein lautes offenes A, das plötzlich ansetzt und dann heiser ausläuft. Keine gesprochenen Wörter, kein Husten, keine Hintergrundgeräusche, kein Hall. Nur dieser eine Schrei.',
    cues:[cue('labPatient',NPCS.labPatient.line,'lab-patient-tobias.mp3')]},
  {name:'Marcel',take:'marcel-take01',seed:3451,threads:4,
    direction:'Ein deutscher Mann Mitte dreißig, warme natürliche Stimme, entspannter Berliner Hippie ohne starken Dialekt. Sagt das gelassen und etwas verträumt, beim Wort Bestimmung ganz leicht feierlich. Nur den Satz, klar gesprochen, kein Lachen, kein Hintergrund.',
    cues:[cue('marcel',NPCS.marcel.line)]},
  {name:'Niklas',take:'niklas-take02',seed:3817,threads:4,
    direction:'Ein deutscher Mann um die 28, natürliche ungekünstelte Sprechstimme in Hochdeutsch, mittlere Lage, warm und klar. Kein Ansager und kein Flüstern. Im ersten Satz etwas unsicher, im zweiten freundlich enttäuscht, im dritten spontan erleichtert. Wie in einem echten Gespräch, klar und ohne Übertreibung. Kurze Pause nach jedem Satz.',
    cues:[cue(niklas.id,niklas.line,'dialog-niklas-frage-vl.mp3'),reply(niklas,0,'dialog-niklas-antwort-vl.mp3'),cue(reward.clip,reward.line,'niklas-fundsache-vl.mp3')]},
  {name:'Jake',take:'jake-take02',seed:9882,threads:4,
    direction:'Ein junger deutscher Mann, weicher heller Tenor mit leicht rauchiger Stimme, natürlich und entspannt statt wie ein Sprecher. Beim ersten Satz verträumt, beim zweiten leicht verlegen und selbstironisch, beim dritten aufmunternd mit leiser Vorfreude. Sprich alle Wörter in klarem Hochdeutsch genau wie geschrieben; besonders „tritt näher an ihn“. Entspannte kurze Sprechpausen am Satzende. Keine zusätzlichen Wörter.',
    cues:[cue(jake.id,jake.line,'dialog-jake-baeume.mp3'),reply(jake,0,'dialog-jake-dumm.mp3'),reply(jake,1,'dialog-jake-naeher.mp3')]},
  {name:'Bons',take:'bons-take03',seed:7181,threads:4,targetLufs:-16,peakCeiling:-1.3,
    // Keep the drunken cadence, tighten only the break/letters, and give the
    // shout a lower register together with its vowel resonances.
    chant:{headEnd:3.52,tailStart:4.02,rate:1.15},
    finish:'asetrate=20400,aresample=24000,atempo=1.17647,',
    text:'Dai Mudda is dai Fadda! Eff Zeh Enn!',
    direction:'Ein älterer fränkischer Mann mit sehr tiefer, rauer Bassstimme, wie nach vielen Jahren am Stammtisch. Tiefe Brustresonanz, brummig und rauchig, kein hoher Gesang. Betrunken, langsam und breit am Anfang, das Ende frech und schnell. Spricht mit Druck und rauer Stimme, bleibt aber tief und schreit nicht hoch. Nur den Text vorlesen.',
    cues:[cue('bergFritz',NPCS.bergFritz.line,'dialog-bons-fcn-vl.mp3')]},
  {name:'Zwanni',take:'zwanni-take01',seed:5379,threads:4,
    text:'Ich bin dein Gottkönig! Aahhh! Ich brauche Eier zum lutschen! Arrrgh!',
    direction:'Ein erwachsener Franke, tiefer rauer Männerbariton. Leicht betrunken und grimmig, grantig mit fränkischer Färbung, nicht karikiert. Kurze Bühnenpausen zwischen den Aussagen. Erst größenwahnsinnig herausplatzen, mit kurzem Aah-Ruf. Dann knurrig fordern. Das letzte Arrrgh ist ein einzelner gepresster Kehllaut, kein gesprochenes Kommentarwort. Nur die Vorlage sprechen.',
    cues:[cue('festZwanni',NPCS.festZwanni.line,'festZwanni.mp3'),reply(NPCS.festZwanni,1,'festZwanniEier.mp3'),cue('zwanniFundsache','Arrrgh!','zwanniFundsache.mp3')]},
  {name:'Chris',take:'chris-take01',seed:5772,threads:3,
    text:'Soll ich dir was zeigen? Hihi!',
    direction:'Deutscher Mann um die fünfzig, ein Chemiker mit leicht kratziger, warmer natürlicher Männerstimme. Er kann ein kleines Laborgeheimnis kaum für sich behalten: aufgeregt, neugierig, vertraulich, die Frage steigt leicht an. Danach kurze Pause und ein kurzes echtes nervöses Kichern, keine zusätzlichen Worte und kein Hintergrundgeräusch.',
    cues:[cue('grey',NPCS.grey.line,'grey-frage.mp3'),cue('greyGiggle','Kichern','grey-kichern.mp3')]},
  {name:'Michi',displayName:NPCS.bergWirt.name,take:'michi-take02',seed:5210,threads:4,
    direction:'Ein etwa vierzigjähriger Mann, natürliche, leicht heisere und raue Stimme, angenehm tief. Trocken und beiläufig gesprochen, wie ein Wirt am Tresen. Hochdeutsch mit einem leichten fränkischen Tonfall. Das erste Wort ist klar und betont: Halb. Gib genau den vorgegebenen Text wieder.',
    cues:[cue('bergWirt',NPCS.bergWirt.line,'dialog-michi-kerwa.mp3')]}
];
// Seconds into the respective raw WAV; allow space around the first/last phoneme.
const cuts={
  niklas:[0,1.98],niklasAntwort:[2.07,4.64],niklasFundsache:[4.83,7.07],
  gardenHannes:[.27,2.02],jakeDumm:[2.57,5.52],jakeNaeher:[6.26,9.40],
  bergFritz:[.97,5.35],bergWirt:[0,4.10],
  grey:[0,2.02],greyGiggle:[3.06,3.67],
  festZwanni:[.14,3.43],festZwanniEier:[4.02,6.035],zwanniFundsache:[6.08,7.56],
  marcel:[0,1.99],labAuer:[.25,4.01],labPatient:[0,.54]
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
      '--threads',String(p.threads),'--language','de','--text',p.text??p.cues.map(c=>c.line).join(' '),
      '--text-chunk-size','500','--instruct',p.direction,'--seed',String(p.seed),
      '--log','--metrics','--out',wav(p.take)
    ]);
  }
}else if(command==='export'){
  const ffmpeg=option||'ffmpeg';
  for(const p of selected)for(const c of p.cues){
    const cut=cuts[c.id],file=NPC_VOICE_FILES[c.id];
    if(!cut||!file||file===c.original)throw Error('Missing pilot edit for '+c.id);
    const [start,end]=cut;
    const input=['-nostdin','-hide_banner','-ss',String(start),'-i',wav(p.take)];
    let duration=end-start,edit=`atrim=duration=${duration.toFixed(4)}`;
    if(p.chant){
      const {headEnd,tailStart,rate}=p.chant;
      edit=`asplit[phrase][chant];[phrase]atrim=end=${(headEnd-start).toFixed(4)},asetpts=PTS-STARTPTS[a];`+
        `[chant]atrim=start=${(tailStart-start).toFixed(4)}:end=${(end-start).toFixed(4)},asetpts=PTS-STARTPTS,atempo=${rate}[b];`+
        '[a][b]concat=n=2:v=0:a=1';
      duration=headEnd-start+(end-tailStart)/rate;
    }
    const chain=`${edit},highpass=f=65,${p.finish??''}afade=t=in:d=0.009,afade=t=out:st=${(duration-.018).toFixed(4)}:d=0.018`;
    // Measure once, then apply a constant gain: preserve the acting dynamics.
    const report=run(ffmpeg,[...input,'-af',chain+',loudnorm=print_format=json','-f','null','-'],true);
    const {input_i,input_tp}=JSON.parse(report.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
    if(!Number.isFinite(+input_i)||!Number.isFinite(+input_tp))throw Error('Silent cue: '+c.id);
    const gain=Math.min((p.targetLufs??-19)-input_i,(p.peakCeiling??-2.5)-input_tp);
    run(ffmpeg,[...input,'-loglevel','error','-af',chain+`,volume=${gain.toFixed(2)}dB`,
      '-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','64k','-map_metadata','-1','-y',join(assetDir,file)]);
  }
}else if(command==='compare'){
  const names=process.argv.slice(3);
  const compared=names.length?names.map(name=>{
    const profile=profiles.find(p=>p.name.toLowerCase()===name.toLowerCase());
    if(!profile)throw Error('Unknown character: '+name);
    return profile;
  }):profiles;
  const escape=s=>s.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
  const player=path=>`<audio controls preload="none" src="data:audio/mpeg;base64,${readFileSync(path).toString('base64')}"></audio>`;
  const previous=file=>{
    if(!file)return '<small>Neue Figur, keine frühere Aufnahme</small>';
    const paths=[join(lab,'retired',file),join(assetDir,file)],path=paths.find(existsSync);
    return path?player(path):'<small>Auf diesem Rechner nicht archiviert</small>';
  };
  const cards=compared.map(p=>`<section><h2>${escape(p.displayName??p.name)}</h2>${p.cues.map(c=>`<article><h3>${escape(c.line)}</h3>
    <div><span>Bisher</span>${previous(c.original)}</div>
    <div><span>Aktuell im Spiel</span>${player(join(assetDir,NPC_VOICE_FILES[c.id]))}</div></article>`).join('')}</section>`).join('');
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
    </style><main><h1>Stimmenvergleich</h1><p>SchlossER · Bisherige und aktuell eingebundene Aufnahmen.</p>${cards}</main>
    <script>document.addEventListener('play',e=>{for(const a of document.querySelectorAll('audio'))if(a!==e.target)a.pause()},true)</script></html>`);
  console.log(out);
}else{
  throw Error('Usage: npm not required. node scripts/npc-voice-pilot.mjs synth|export|compare [ffmpeg.exe]');
}
