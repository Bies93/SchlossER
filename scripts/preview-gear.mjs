import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=new URL('../',import.meta.url),folder=new URL('dist/',base);
const src=`
import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {egoAssets,EQUIPMENT} from './src/ego-assets.js';
import {makeViewmodel} from './src/viewmodel.js';
const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
r.setSize(530,280);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.14;
const world=new T.Scene(),studio=new T.Scene();
const generator=new T.PMREMGenerator(r),room=new RoomEnvironment(),target=generator.fromScene(room);
room.dispose();generator.dispose();
for(const s of [studio,world]){s.background=new T.Color(0x626a70);s.environment=target.texture;s.environmentIntensity=.85;}
const surface=new T.Mesh(new T.PlaneGeometry(14,14),new T.MeshStandardMaterial({color:0x7c8280,roughness:.83}));
surface.rotation.x=-Math.PI/2;surface.position.y=-.021;world.add(surface,new T.HemisphereLight(0xf1f5ff,0x73806c,1.5));
const key=new T.DirectionalLight(0xffeddb,2.16),fill=new T.DirectionalLight(0xc6d6ed,1.12);
key.position.set(-.7,1.2,1.0);fill.position.set(1.65,.72,-1.15);studio.add(key,fill,new T.HemisphereLight(0xe4ebf3,0x73706b,.93));
const close=new T.OrthographicCamera(-.70,.70,.37,-.37,.035,8);
const snap=(label,render)=>{
  render();
  const tile=document.createElement('figure'),c=document.createElement('canvas'),legend=document.createElement('figcaption');
  c.width=530;c.height=280;c.getContext('2d').drawImage(r.domElement,0,0);legend.textContent=label;
  tile.append(c,legend);document.querySelector('main').append(tile);
};
const rig=egoAssets(T);
for(const d of rig.devices)d.animate(10);
const player={body:new T.Group(),motion:{speed:0,grounded:true}};
world.add(player.body);const mount=new T.Group(),eye=new T.PerspectiveCamera(63,530/280,.07,100);
player.body.add(mount);mount.add(eye);mount.position.y=1.67;mount.rotation.x=-.13;
const vm=makeViewmodel(T,world,eye,player,{blocked:()=>false},()=>0,r.domElement,()=>true,()=>{});
document.body.append(r.domElement);r.domElement.style.display='none';
vm.setCombat(true);vm.preset('dusk');
let ms=0;
function settle(n=28){for(let i=0;i<n;i++)vm.update(ms+=1000/60);}
for(let i=0;i<EQUIPMENT.length;i++){
  const spec=EQUIPMENT[i],model=rig.devices[i].root,
    target=new T.Vector3(0,-.041,spec.kind==='bow'?-.18:-.20);
  studio.add(model);
  for(const [label,p] of [['Seitenansicht',[2.1,.48,.22]],['Frontdiagonale',[.82,.80,-1.90]]]){
    close.position.fromArray(p);close.lookAt(target);close.updateMatrixWorld();
    snap(spec.label+' · '+label,()=>r.render(studio,close));
  }
  studio.remove(model);
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit'+(i+1),bubbles:true}));settle();
  const render=()=>{r.render(world,eye);vm.draw(r);};
  snap(spec.label+' · First Person',render);
  r.domElement.dispatchEvent(new MouseEvent('mousedown',{button:2,bubbles:true,cancelable:true}));settle();
  snap(spec.label+' · ADS',render);
  window.dispatchEvent(new MouseEvent('mouseup',{button:2,bubbles:true}));settle();
}
document.body.dataset.finished='true';
`;
const page=await build({stdin:{contents:src,resolveDir:fileURLToPath(base)},bundle:true,minify:true,write:false});
await mkdir(folder,{recursive:true});
await writeFile(new URL('waffen-atelier.html',folder),`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SchlossER · Waffenatelier</title>
<style>*{box-sizing:border-box}body{background:#191c1e;color:#e6e2da;font:15px system-ui;margin:18px}header{margin:0 auto 14px;max-width:1082px}h1{font:26px Georgia;margin:0 0 4px}main{display:grid;grid-template-columns:repeat(2,minmax(0,530px));gap:12px;max-width:1082px;margin:auto}figure{margin:0;background:#262a2c;overflow:hidden;border-radius:6px}canvas{display:block;width:100%;height:auto}canvas[hidden]{display:none}figcaption{padding:8px 10px}@media(max-width:590px){main{grid-template-columns:1fr}}</style>
<body><header><h1>SchlossER · Waffenatelier</h1><span>Die ausgelieferten Modelle unter Studiolicht und mit dem First-Person-Rig.</span></header><main></main><script>`+
  page.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
