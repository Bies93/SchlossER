import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const filepath=(name)=>path.join(root,name);
const template=await readFile(filepath('src/template.html'),'utf8');
const license=await readFile(filepath('node_modules/three/LICENSE'),'utf8');
const bundle=(await build({entryPoints:[filepath('src/app.js')],bundle:true,minify:true,write:false,legalComments:'inline'})).outputFiles[0].text;
const names=['sandstone_facade','sandstone_trim','fountain_stone','oak_door','plaza_pavers','roof_slate'];
const refs={model:'assets/schloss.glb',sculptures:'assets/skulpturen.glb',light:'assets/tageslicht.hdr',maps:{}};
for(const n of names)refs.maps[n]=Object.fromEntries(['albedo','normal'].map(type=>[type,'assets/'+n+'_'+type+'.webp']));
const make=(data,script)=>template.replace('</head>',()=>'<meta name="description" content="Ein interaktiver Rundgang durch das Erlanger Schloss und seinen Garten."><!--\n'+license+'\n-->\n</head>').replace('__ASSETS__',()=>JSON.stringify(data)).replace('<script>__BUNDLE__</script>',()=>script);
await writeFile(filepath('viewer.js'),bundle);
await writeFile(filepath('index.html'),make(refs,'<script src="./viewer.js"></script>'));
if(process.argv.includes('--offline')){
 const embed=async obj=>{for(const [k,v] of Object.entries(obj)){if(typeof v==='object')await embed(v);else{
 const mime=v.endsWith('.webp')?'image/webp':'application/octet-stream';obj[k]='data:'+mime+';base64,'+(await readFile(filepath(v))).toString('base64');}}};
 await embed(refs);await mkdir(filepath('dist'),{recursive:true});
 await writeFile(filepath('dist/Schlossgarten.html'),make(refs,'<script>'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>'));
}
