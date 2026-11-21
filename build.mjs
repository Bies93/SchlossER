import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NPC_VOICE_FILES} from './src/npc-voice-assets.js';
import {WEAPON_SFX} from './src/weapon-audio.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const filepath=(name)=>path.join(root,name);
const template=await readFile(filepath('src/template.html'),'utf8');
const bootArt='assets/loading-schloss-kupferstich.webp';
const bootBytes=await readFile(filepath(bootArt));
const license=await readFile(filepath('node_modules/three/LICENSE'),'utf8');
const bundle=(await build({entryPoints:[filepath('src/app.js')],bundle:true,minify:true,write:false,legalComments:'inline'})).outputFiles[0].text;
const names=['sandstone_facade','sandstone_trim','fountain_stone','oak_door','plaza_pavers','roof_slate'];
const refs={model:'assets/schloss.glb',sculptures:'assets/skulpturen.glb',music:'assets/moorlicht.mp3',clubMusic:'assets/schlosskeller-2099.mp3',
  galleryPoster:'assets/galerie-bies.webp',galleryChoir:'assets/galerie-chor.mp3',orbVoice:'assets/orb-stimme.flac',
  prisonerVoice:'assets/kammer-07.flac',lodgeSeal:'assets/logensiegel.svg',humans:'assets/human-cast.glb',maps:{},
  ravenCall:'assets/sfx/raven-grand-teton.mp3',bergMusic:'assets/berg-walzer.mp3',
  npcVoices:Object.fromEntries(Object.entries(NPC_VOICE_FILES).map(([id,file])=>[id,'assets/npc-voices/'+file])),
  weaponSounds:Object.fromEntries(Object.entries(WEAPON_SFX).map(([id,file])=>[id,'assets/sfx/'+file]))};
for(const n of names)refs.maps[n]=Object.fromEntries(['albedo','normal'].map(type=>[type,'assets/'+n+'_'+type+'.webp']));
const make=(data,script,illustration)=>template.replace('</head>',()=>'<meta name="description" content="Ein interaktives Spiel im Erlanger Schloss und Schlossgarten."><!--\n'+license+'\n-->\n</head>').replace('__BOOT_ART__',()=>illustration).replace('__ASSETS__',()=>JSON.stringify(data)).replace('<script>__BUNDLE__</script>',()=>script);
const digest=content=>createHash('sha256').update(content).digest('hex').slice(0,12);
const transform=async(obj,visit)=>Object.fromEntries(await Promise.all(Object.entries(obj).map(async([key,value])=>[
 key,typeof value==='object'?await transform(value,visit):visit(value,await readFile(filepath(value)))
])));
const webRefs=await transform(refs,(name,bytes)=>name+'?v='+digest(bytes));
// Start the largest fetches while the browser is still parsing the page and
// its viewer bundle. The versioned URL and credentials match GLTFLoader.
const preloads=[webRefs.model,webRefs.humans,webRefs.sculptures]
  .map(url=>'<link rel="preload" as="fetch" href="'+url+'" crossorigin="anonymous">').join('\n');
await writeFile(filepath('viewer.js'),bundle);
await writeFile(filepath('index.html'),make(webRefs,'<script src="./viewer.js?v='+digest(bundle)+'"></script>',bootArt+'?v='+digest(bootBytes))
  .replace('<title>',()=>preloads+'\n<title>'));
if(process.argv.includes('--offline')){
 const embedded=await transform(refs,(name,bytes)=>{
   const mime=name.endsWith('.webp')?'image/webp':name.endsWith('.mp3')?'audio/mpeg':name.endsWith('.flac')?'audio/flac':name.endsWith('.svg')?'image/svg+xml':'application/octet-stream';
   return 'data:'+mime+';base64,'+bytes.toString('base64');
 });
 await mkdir(filepath('dist'),{recursive:true});
 await writeFile(filepath('dist/Schlossgarten.html'),make(embedded,'<script>'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>','data:image/webp;base64,'+bootBytes.toString('base64')));
}
