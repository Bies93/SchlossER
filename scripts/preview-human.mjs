import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const dir=new URL('../dist/human-cast/',import.meta.url);
await mkdir(dir,{recursive:true});
const bytes=(await readFile(new URL('../assets/human-cast.glb',import.meta.url))).toString('base64');
const contents=`
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {installHumans,createHuman} from './src/human-character.js';
const ids=['base','hubert','ghoulA','ghoulB','ghoulC','clubAda','clubMira','clubNiko','clubSami','clubVeit'];
const cast=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(document.getElementById('glb').textContent);
installHumans(T,cast.scene);
const s=new T.Scene(),r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}),c=new T.PerspectiveCamera(34,340/460,.03,100);
r.setSize(340,460);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
const env=new RoomEnvironment(),bake=new T.PMREMGenerator(r);s.environment=bake.fromScene(env).texture;s.environmentIntensity=.56;
s.background=new T.Color(0x202b32);
const floor=new T.Mesh(new T.PlaneGeometry(60,20),new T.MeshStandardMaterial({color:0x353a3d,roughness:.88}));floor.rotation.x=-Math.PI/2;floor.position.y=-.001;s.add(floor);
const key=new T.DirectionalLight(0xffe3ca,2.3);key.position.set(-2.5,4,4);s.add(key);
const side=new T.DirectionalLight(0xa0c7ff,1.08);side.position.set(2,3,-2);s.add(side,new T.HemisphereLight(0xe5e6f1,0x8e8072,1.0));
const mk=(id,i,face)=>{
  const a=createHuman(T,id);
  s.add(a.actor);a.actor.rotation.y=i%2?-.28:.20;
  if(id.startsWith('club')&&!face)a.dance(2.85,5.39+(i-5)*.47,i-5);
  else a.pose(1.77,.29,face?0:i===0?0:.72,id==='ghoulB'?.38:0,0,0,.8,id==='hubert'&&face?.48:0);
  a.hitShapes();
  const head=new T.Vector3();a.actor.traverse(o=>{if(o.isBone&&o.userData.name==='head')o.getWorldPosition(head);});
  if(face){c.position.set(head.x+.13,head.y+.12,head.z+.73);c.lookAt(head.x,head.y+.099,head.z);}
  else{c.position.set(0,1.16,3.9);c.lookAt(0,.96,0);}
  r.render(s,c);
  const out=document.createElement('canvas');out.width=340;out.height=460;out.getContext('2d').drawImage(r.domElement,0,0);
  const figure=document.createElement('figure');figure.append(out);const tag=document.createElement('figcaption');tag.textContent=id+(face?' · Gesicht':'');figure.append(tag);document.body.append(figure);s.remove(a.actor);
};
ids.forEach((id,i)=>mk(id,i,false));for(const id of ['base','hubert','clubAda','clubMira','clubSami'])mk(id,ids.indexOf(id),true);
document.title='SchlossER · Human Cast';
`;
const result=await build({stdin:{contents,resolveDir:process.cwd()},bundle:true,minify:true,format:'esm',write:false});
await writeFile(new URL('ansichten.html',dir),`<!doctype html><meta charset=utf-8><style>*{margin:0}body{display:grid;grid-template-columns:repeat(5,240px);background:#161b20;color:#e0dbcf}canvas{width:240px;height:auto;display:block}figcaption{font:15px system-ui;padding:6px 8px}</style><script id="glb" type="application/octet-stream">data:application/octet-stream;base64,${bytes}</script><body><script type="module">${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`);
