import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
const files=await Promise.all(['schloss','human-cast'].map(async id=>[id,
  (await readFile(new URL('assets/'+id+'.glb',root))).toString('base64')]));
const script=await build({stdin:{resolveDir:fileURLToPath(root),contents:`
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {installHumans} from './src/human-character.js';
import {INFO_SITE,addPlazaInfoStand} from './src/plaza-info-stand.js';
import {surfaceLibrary} from './src/palace.js';
import {palaceExterior} from './src/palace-exterior.js';
import {sharedSet} from './src/surface-detail.js';

async function render(){
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),load=id=>loader.loadAsync('data:application/octet-stream;base64,'+
    document.getElementById(id).textContent);
  const [palace,cast]=await Promise.all([load('schloss'),load('human-cast')]);installHumans(T,cast.scene);
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);
  r.debug.onShaderError=(gl,pg,vs,fs)=>{throw Error([gl.getProgramInfoLog(pg),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs)].join(' '));};
  r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene(),{x,z}=INFO_SITE,V=(...a)=>new T.Vector3(...a),target=V();
  scene.background=new T.Color(0xc4aea7);scene.fog=new T.Fog(0xc4aea7,44,103);
  const generator=new T.PMREMGenerator(r),room=new RoomEnvironment();scene.environment=generator.fromScene(room).texture;
  scene.environmentIntensity=.58;room.dispose();generator.dispose();
  scene.add(new T.HemisphereLight(0xffede7,0x81808a,1.14),palace.scene);
  const materials=palaceExterior(T,surfaceLibrary(T,{}).finish);
  palace.scene.traverse(o=>{if(o.isMesh){const kind=o.material.name;o.material=materials(kind)??o.material;
    if(/^(GROUND|GRASS|GRAVEL|FLOWER)/.test(kind))o.visible=false;
  }});
  const paving=new T.Mesh(new T.PlaneGeometry(110,78),new T.MeshStandardMaterial({color:0xbbafa3,roughness:.94,...sharedSet(T,'setts',512)}));
  paving.rotation.x=-Math.PI*.5;paving.position.set(0,-.011,25);paving.receiveShadow=true;scene.add(paving);
  const light=new T.DirectionalLight(0xffd4ac,2.08);light.position.set(x-8,10,z+8);light.target.position.set(x,0,z);
  light.castShadow=true;light.shadow.mapSize.set(1024,1024);const c=light.shadow.camera;
  c.left=c.bottom=-5;c.right=c.top=5;c.far=30;light.shadow.normalBias=.024;
  scene.add(light,light.target);
  const stand=addPlazaInfoStand(T,scene,{box(){},circle(){}},()=>0),camera=new T.PerspectiveCamera();
  const output=document.querySelector('main');
  function snap(title,w,h,at,look,fov){
    camera.position.copy(at);camera.lookAt(look);camera.aspect=w/h;camera.fov=fov;camera.far=150;camera.updateProjectionMatrix();
    r.setSize(w,h,false);r.render(scene,camera);
    const figure=document.createElement('figure'),canvas=document.createElement('canvas'),label=document.createElement('figcaption');
    figure.className=w>430?'wide':'portrait';canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(r.domElement,0,0);
    label.textContent=title;figure.append(canvas,label);output.append(figure);
  }
  for(let i=0;i<16;i++)stand.update(.045,{x,z:z+6},true);
  snap('Infostand vor dem Schloss',546,333,V(x+.43,1.68,z+6.3),V(x,1.29,z+.35),42);
  snap('Tisch · Regenbogenaufsteller und Flyer',546,333,V(x-.41,1.65,z+2.42),V(x+.08,.85,z+1.19),51);
  stand.root.visible=false;
  for(let j=0;j<stand.cast.length;j++){
    const {npcInfo:n}=stand.cast[j],p=n.actor.position;
    n.head.getWorldPosition(target);target.y*=.55;
    snap(n.name,357,437,V(p.x+(j===2?.69:-.55),1.33,p.z+2.32),target,45);
  }
  document.body.dataset.finished='true';
}
render().catch(e=>{document.body.textContent=e.stack;document.title='Fehler';});
`},bundle:true,minify:true,write:false});
await mkdir(dist,{recursive:true});
await writeFile(new URL('infostand-atelier.html',dist),`<!doctype html><html lang="de"><meta charset="utf-8"><title>SchlossER · Infostand</title>
<style>*{box-sizing:border-box}body{margin:16px;background:#181d1a;color:#f1e8d6;font:15px system-ui}header{max-width:1104px;margin:0 auto 12px}h1{font:27px Georgia;margin:0 0 3px}main{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;max-width:1104px;margin:auto}figure{margin:0;overflow:hidden;border-radius:7px;background:#29302a}.wide{grid-column:span 3}.portrait{grid-column:span 2}canvas{display:block;width:100%;height:auto}figcaption{padding:8px 11px}</style>
<body><header><h1>SchlossER · Infostand am Schlossplatz</h1><span>Ansichten aus Spielerhöhe · Heide, Luisa und Grete</span></header><main></main>`+
  files.map(([id,b64])=>'<script type="application/octet-stream" id="'+id+'">'+b64+'</script>').join('')+
  '<script>'+script.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
