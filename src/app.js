import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {addGarden} from './garden.js';
import {surfaceLibrary} from './palace.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

const $ = id => document.getElementById(id);
const stage=document.querySelector('main'), nav=document.querySelector('nav');
const payload=JSON.parse($('assets').textContent);
$('assets').remove();
stage.style.backgroundImage='url('+payload.poster+')';
const views=[
 ['Schlossplatz','Westfassade',[37,10,69],[0,7,2]],
 ['Schlossgarten','Gartenachse',[-30,14,-85],[0,6,-17]],
 ['Brunnen','Hugenottenbrunnen',[-16,7,-69],[0,4,-47]],
 ['Portal','Westliches Hauptportal',[7,3.7,29],[0,4,13]],
 ['Überblick','Schloss und Park',[91,90,-135],[0,1,-60]]
];
const about=$('about');
$('info').onclick=()=>about.showModal();
about.querySelector('button').onclick=()=>about.close();
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
async function start(){
 const r=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio,1.6));
 r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
 r.shadowMap.autoUpdate=false;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
 $('canvas').append(r.domElement);
 const s=new T.Scene(), c=new T.PerspectiveCamera(43,1,.14,1250);
 const ctr=new OrbitControls(c,r.domElement);ctr.maxPolarAngle=Math.PI*.489;ctr.minDistance=3;ctr.maxDistance=301;ctr.enableDamping=false;ctr.zoomSpeed=.85;
 const sky=new T.Mesh(new T.SphereGeometry(870,32,20),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,uniforms:{warm:{value:0},solar:{value:new T.Vector3(68,79,60).normalize()}},
  vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 ray;uniform float warm;uniform vec3 solar;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
  void main(){vec3 v=normalize(ray);float h=max(v.y,0.);vec3 low=mix(vec3(.81,.86,.84),vec3(1.,.72,.48),warm);
  vec3 high=mix(vec3(.24,.51,.78),vec3(.36,.50,.68),warm);vec3 col=mix(low,high,pow(h,.52));
  vec2 p=v.xz/max(.09,v.y+.13)*2.1;float n=noise(p)*.5+noise(p*2.1)*.25+noise(p*4.3)*.14+noise(p*8.5)*.07;
  col=mix(col,vec3(1.,.99,.94),smoothstep(.52,.76,n)*smoothstep(.01,.20,h)*.9);
  col+=vec3(1.,.86,.62)*pow(max(dot(v,solar),0.),42.)*.21;gl_FragColor=vec4(col,1.);
  #include <colorspace_fragment>
  }`}));
 s.add(sky);s.fog=new T.FogExp2(0xd7ded2,.0022);
 const hemi=new T.HemisphereLight(0xf1f7ff,0xa8a18a,1.48);
 const sun=new T.DirectionalLight(0xffecce,2.65);sun.position.set(60,76,65);sun.target.position.set(0,0,-24);
 Object.assign(sun.shadow.camera,{left:-82,right:82,top:82,bottom:-82,near:1,far:270});
 sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.045;sun.shadow.bias=-.00020;sun.castShadow=true;
 s.add(sun,sun.target,hemi);
 const ground=new T.Mesh(new T.PlaneGeometry(1700,1700),new T.MeshStandardMaterial({color:0x9d9d80,roughness:1}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.30;ground.receiveShadow=true;s.add(ground);
 let dirty=true,transition=null,current=0;
 const refresh=()=>{dirty=true};
 const v3=a=>new T.Vector3(...a);
 function select(i,snap=false){
   current=i;const [title,meta,pos,tar]=views[i];const aim=v3(tar),eye=v3(pos);
   const width=stage.clientWidth/stage.clientHeight;
   if(width<1.45 && i!==3)eye.sub(aim).multiplyScalar(Math.min(1.9,1.45/width)).add(aim);
   if(snap){ctr.target.copy(aim);c.position.copy(eye);transition=null;ctr.update();}
   else transition={start:performance.now(),a:c.position.clone(),b:ctr.target.clone(),eye,aim};
   $('caption').textContent=title;$('meta').textContent=meta;$('index').textContent='0'+(i+1)+' / 05';
   [...nav.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));refresh();
 }
 views.forEach(([label],i)=>{const b=document.createElement('button');b.innerHTML='<small>0'+(i+1)+'</small>'+label;b.onclick=()=>select(i);nav.append(b)});
 document.addEventListener('keydown',e=>{if(!about.open&&/^[1-5]$/.test(e.key))select(Number(e.key)-1)});
 ctr.addEventListener('start',()=>transition=null);ctr.addEventListener('change',refresh);
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;r.setSize(w,h);c.aspect=w/h;c.updateProjectionMatrix();refresh()}
 new ResizeObserver(resize).observe(stage);resize();select(0,true);
 let warm=false;$('light').onclick=()=>{warm=!warm;sun.color.setHex(warm?0xffcd89:0xffecce);sun.position.set(...(warm?[90,38,12]:[60,76,65]));sun.intensity=warm?2.8:2.65;hemi.intensity=warm?1.22:1.48;sky.material.uniforms.warm.value=+warm;sky.material.uniforms.solar.value.copy(sun.position).sub(sun.target.position).normalize();$('light').textContent=warm?'☀ Abendlicht':'☀ Tageslicht';r.shadowMap.needsUpdate=true;refresh()};
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),tl=new T.TextureLoader();
 const decode=url=>loader.loadAsync(url).then(g=>g.scene);
 const mapsP=Promise.all(Object.entries(payload.maps).map(async([name,layers])=>[name,Object.fromEntries(await Promise.all(Object.entries(layers).map(async([k,src])=>[k,await tl.loadAsync(src)])))]));
 const [model,mapPairs,sculptures,environment]=await Promise.all([decode(payload.model),mapsP,decode(payload.sculptures),new HDRLoader().loadAsync(payload.light)]);
 environment.mapping=T.EquirectangularReflectionMapping;s.environment=environment;s.environmentIntensity=.45;
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name;o.material=finish(key);
 o.receiveShadow=true;o.castShadow=!['GROUND','GRASS','GRAVEL','GLASS'].includes(key);});s.add(model);
 // The individual slates have open joints. A continuous dark deck sits underneath.
 const deck=new T.BufferGeometry();
 deck.setAttribute('position',new T.Float32BufferAttribute([
   -33.65,16.43,9.68, 33.65,16.43,9.68, 33.65,16.43,-9.68, -33.65,16.43,-9.68,
   -23.38,20.68,0, 23.38,20.68,0],3));
 deck.setIndex([0,1,5,0,5,4,1,2,5,2,3,4,2,4,5,3,0,4]);deck.computeVertexNormals();
 s.add(new T.Mesh(deck,new T.MeshStandardMaterial({color:0x38414a,roughness:.91,side:T.DoubleSide})));
 if(sculptures){sculptures.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});s.add(sculptures)}
 addGarden(T,s);r.shadowMap.needsUpdate=true;
 function render(t){
   if(transition){let k=Math.min(1,(t-transition.start)/850);k=k*k*(3-2*k);
    c.position.lerpVectors(transition.a,transition.eye,k);ctr.target.lerpVectors(transition.b,transition.aim,k);ctr.update();if(k>=1)transition=null;refresh()}
   if(dirty){r.render(s,c);dirty=false}
   requestAnimationFrame(render)
 }
 r.render(s,c);$('load').hidden=true;stage.style.backgroundImage='none';
 document.body.dataset.ready='true';requestAnimationFrame(render);
}
start().catch(err=>{console.error(err);$('canvas').hidden=true;document.body.dataset.ready='error';$('load').textContent='3D-Ansicht konnte nicht starten. Bitte WebGL 2 und Hardwarebeschleunigung im Browser aktivieren.'});
