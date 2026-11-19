// Render two visitor-height angles of the real room with the normal material/light kit.
import {build} from 'esbuild';
import {writeFile,mkdir} from 'node:fs/promises';
const target=new URL('../dist/studio/',import.meta.url);await mkdir(target,{recursive:true});
const code=await build({stdin:{contents:`
import * as T from 'three';import {addParkStair} from './src/park-stair.js';
import {p,b} from './src/park-wc-layout.js';import {collisionWorld} from './src/collision.js';
import {BOUNDS,PLAYER} from './src/world-layout.js';
const s=new T.Scene(),r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.06;r.setSize(720,510);
const w=collisionWorld(BOUNDS,PLAYER.radius),wc=addParkStair(T,s,w,{bind(){},isFixed:()=>false});
const c=new T.PerspectiveCamera(62,720/510,.065,100);c.layers.set(4);
for(const [u,v,U,V,h] of [[17.81,-5.98,16.61,-8.13,1.16],[17.35,-5.26,19.77,-7.21,1.12]]){
  const pos=new T.Vector3(...p(u,b,v));wc.update(.03,pos);c.position.fromArray(p(u,b+1.59,v));c.lookAt(...p(U,b+h,V));r.render(s,c);
  const panel=document.createElement('canvas');panel.width=720;panel.height=510;panel.getContext('2d').drawImage(r.domElement,0,0);document.body.append(panel);
}`,resolveDir:process.cwd()},bundle:true,write:false,minify:true});
await writeFile(new URL('preview.html',target),'<!doctype html><meta charset="utf-8"><style>*{margin:0}body{display:flex;background:#10110f}</style><body><script>'+code.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
