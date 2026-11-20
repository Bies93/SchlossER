import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {NPCS} from '../src/npc-lines.js';
import {NPC_VOICE_FILES} from '../src/npc-voice-assets.js';

const input=process.argv[2];
if(!input)throw Error('Aufruf: node scripts/import-npc-voices.mjs PFAD_ZUM_MANIFEST');
const file=resolve(input),entries=JSON.parse(await readFile(file,'utf8')),dest=new URL('../assets/npc-voices/',import.meta.url);
const normalized=s=>s.normalize('NFC').replace(/[„“‚‘”"']/g,'').trim();
const known=new Map(entries.map(e=>[e.filename,e]));
const files=Object.entries(NPC_VOICE_FILES).filter(([,name])=>known.has(name));
if(!entries.length||files.length!==entries.length||known.size!==entries.length)
  throw Error('Das Manifest muss bekannte, eindeutige Audiodateien enthalten.');
function mp3(data){
  return data.length>1500&&(data.subarray(0,3).toString()==='ID3'||data[0]===0xff&&(data[1]&0xe0)===0xe0);
}
const imported=await Promise.all(files.map(async([id,name])=>{
  const e=known.get(name),npc=NPCS[id];
  if(!e||e.name!==npc.name||normalized(e.text)!==normalized(npc.line))
    throw Error(name+': Name oder Dialog weicht vom Spiel ab.');
  const local=await readFile(resolve(dirname(file),'mp3',name)).catch(error=>{
    if(error.code!=='ENOENT')throw error;
    return null;
  });
  if(local&&mp3(local))return {name,data:local};
  const url=new URL(e.download_url);
  if(url.protocol!=='https:'||url.hostname!=='resource2.heygen.ai')throw Error(name+': unerwarteter Audiohost.');
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(25000)}).catch(()=>null);
  if(!response?.ok)throw Error(name+': Download fehlgeschlagen ('+(response?.status??'keine Antwort')+').');
  const data=Buffer.from(await response.arrayBuffer());
  if(!mp3(data))throw Error(name+': Der Download ist keine MP3.');
  return {name,data};
}));
// Only write after every supplied name, line and binary header is validated.
await mkdir(dest,{recursive:true});
for(const {name,data} of imported){
  await writeFile(new URL(name,dest),data);
  console.log(name,data.length+' Bytes');
}
