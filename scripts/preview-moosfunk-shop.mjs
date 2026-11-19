import {build} from 'esbuild';
import {writeFile,mkdir} from 'node:fs/promises';
const target=new URL('../dist/moosfunk-werkstatt/',import.meta.url);await mkdir(target,{recursive:true});
const code=await build({stdin:{contents:`
import * as T from 'three';import {addParkStair} from './src/park-stair.js';
import {p,b} from './src/park-wc-layout.js';import {collisionWorld} from './src/collision.js';
import {BOUNDS,PLAYER} from './src/world-layout.js';
import {makeMoosfunk,intercomSpot} from './src/moosfunk-quest.js';
try{
const s=new T.Scene(),r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.06;r.setSize(720,490);
const memory={val:null,getItem(){return this.val},setItem(k,v){this.val=v}};
const q=makeMoosfunk(memory),w=collisionWorld(BOUNDS,PLAYER.radius),wc=addParkStair(T,s,w,q);
for(const route of [
 [[15.39,4.48],[15.39,5.65],[17.66,8.26],[20.44,8.26]],
 [[17.66,8.26],[17.73,9.54]],
 [[19.68,-3.145],[21.20,-3.145],[22.44,-1.17],[32.84,-1.17]]
]){
 for(let i=1;i<route.length;i++){
   const [u,v]=route[i-1],[U,V]=route[i],n=Math.ceil(Math.hypot(u-U,v-V)/.043);
   for(let j=0;j<=n;j++){
     const [x,y,z]=p(u+(U-u)*j/n,b,v+(V-v)*j/n);
     if(w.blocked(x,z,y))throw Error('Weg blockiert: '+[u+(U-u)*j/n,v+(V-v)*j/n]);
   }
 }
}
const pos=new T.Vector3(...p(17.73,b,9.54)),here=new T.Vector3(...p(intercomSpot.u,b+intercomSpot.y,intercomSpot.v));
const aim=here.sub(pos.clone().add(new T.Vector3(0,PLAYER.eye,0))).normalize();
if(q.target(pos,aim)?.id!=='mf-intercom')throw Error('Gegensprechanlage nicht erreichbar');
const c=new T.PerspectiveCamera(67,720/490,.065,100);c.layers.set(4);
for(const [u,v,U,V,h] of [[17.77,8.44,17.66,11.05,1.29],[17.26,10.32,15.26,9.40,.79],[21.07,-1.42,25.29,-3.81,1.34],[27.29,-1.20,32.42,-3.92,1.57]]){
  const pose=new T.Vector3(...p(u,b,v));wc.update(.03,pose);c.position.fromArray(p(u,b+1.59,v));c.lookAt(...p(U,b+h,V));r.render(s,c);
  const panel=document.createElement('canvas');panel.width=720;panel.height=490;panel.getContext('2d').drawImage(r.domElement,0,0);document.body.append(panel);
}
document.title='Werkstatt und Blechbühne';
}catch(error){document.body.textContent=error.stack;document.title=error.message;}
`,resolveDir:process.cwd()},bundle:true,write:false,minify:true});
await writeFile(new URL('preview.html',target),'<!doctype html><meta charset="utf-8"><style>*{margin:0}body{display:grid;grid-template-columns:720px 720px;background:#10110f;color:white}</style><body><script>'+code.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
