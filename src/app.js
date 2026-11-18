import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {collisionWorld} from './collision.js';
import {createPlayer, bindPlayerInput} from './player.js';
import {addFixedColliders, BOUNDS, PLAYER, insidePerimeter} from './world-layout.js';
import {addPerimeter} from './perimeter.js';
import {addGarden} from './garden.js';
import {surfaceLibrary} from './palace.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

const $ = id => document.getElementById(id);
const stage=document.querySelector('main');
const payload=JSON.parse($('assets').textContent);
$('assets').remove();
const about=$('about');
$('info').onclick=()=>about.showModal();
async function start(){
 const r=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio,1.6));
 r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
 r.shadowMap.autoUpdate=false;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
 $('canvas').append(r.domElement);
 const s=new T.Scene(), c=new T.PerspectiveCamera(65,1,.08,1250);
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
 const sunOffset=new T.Vector3(60,76,89);
 Object.assign(sun.shadow.camera,{left:-82,right:82,top:82,bottom:-82,near:1,far:270});
 sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.045;sun.shadow.bias=-.00020;sun.castShadow=true;
 s.add(sun,sun.target,hemi);
 const ground=new T.Mesh(new T.PlaneGeometry(1700,1700),new T.MeshStandardMaterial({color:0x9d9d80,roughness:1}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.30;ground.receiveShadow=true;s.add(ground);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),tl=new T.TextureLoader();
 const decode=url=>loader.loadAsync(url).then(g=>g.scene);
 const mapsP=Promise.all(Object.entries(payload.maps).map(async([name,layers])=>[name,Object.fromEntries(await Promise.all(Object.entries(layers).map(async([k,src])=>[k,await tl.loadAsync(src)])))]));
 const [model,mapPairs,sculptures,environment]=await Promise.all([decode(payload.model),mapsP,decode(payload.sculptures),new HDRLoader().loadAsync(payload.light)]);
 environment.mapping=T.EquirectangularReflectionMapping;s.environment=environment;s.environmentIntensity=.45;
 const {finish}=surfaceLibrary(T,Object.fromEntries(mapPairs));
 const walkSurfaces=[], importedGravel=[];
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name;o.material=finish(key);
 // The original broad lawn and plaza are replaced rather than overlaid.
 if(key==='GROUND'||key==='GRASS'){o.visible=false;return;}
 if(key==='GRAVEL'){walkSurfaces.push(o);importedGravel.push(o);}
 o.receiveShadow=true;o.castShadow=!['GROUND','GRASS','GRAVEL','GLASS'].includes(key);});s.add(model);
 // The individual slates have open joints. A continuous dark deck sits underneath.
 const deck=new T.BufferGeometry();
 deck.setAttribute('position',new T.Float32BufferAttribute([
   -33.65,16.43,9.68, 33.65,16.43,9.68, 33.65,16.43,-9.68, -33.65,16.43,-9.68,
   -23.38,20.68,0, 23.38,20.68,0],3));
 deck.setIndex([0,1,5,0,5,4,1,2,5,2,3,4,2,4,5,3,0,4]);deck.computeVertexNormals();
 s.add(new T.Mesh(deck,new T.MeshStandardMaterial({color:0x38414a,roughness:.91,side:T.DoubleSide})));
 if(sculptures){sculptures.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});s.add(sculptures)}
 const world=collisionWorld(BOUNDS,PLAYER.radius,insidePerimeter);
 addFixedColliders(world);
 walkSurfaces.push(...addPerimeter(T,s,world,finish));
 const garden=addGarden(T,s,world);
 walkSurfaces.push(...garden.floors);
 for(const heap of importedGravel)heap.material=garden.gravel;
 s.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,3), hits=[];
 const player=createPlayer(T,c,world,(x,z)=>{
   ray.ray.origin.set(x,2,z);
   ray.intersectObjects(walkSurfaces,false,hits);
   const y=hits[0]?.point.y ?? ground.position.y;
   hits.length=0;
   return y;
 });
 s.add(player.body);
 const canvas=r.domElement;
 canvas.tabIndex=-1;
 canvas.setAttribute('aria-label','3D-Rundgang');
 const action=$('enter');
 const active=()=>document.body.dataset.state==='playing';
 let frame=0, dirty=true;
 function schedule(){if(!frame) frame=requestAnimationFrame(render)}
 function refresh(){dirty=true;schedule()}
 function draw(){
   const p=player.body.position;
   // Reuse the static shadow map within a district. Recenter only after
   // walking well away from its anchor; the world-space sun angle is fixed.
   if(Math.abs(sun.target.position.x-p.x)>35||Math.abs(sun.target.position.z-p.z)>35){
     sun.target.position.set(Math.round(p.x/48)*48,0,Math.round(p.z/48)*48);
     sun.position.copy(sun.target.position).add(sunOffset);
     r.shadowMap.needsUpdate=true;
   }
   garden.update(p);r.render(s,c);
 }
 function render(time){
   frame=0;
   if(active()&&input.tick(time)) dirty=true;
   if(dirty){draw();dirty=false}
   if(active()) schedule();
 }
 function pause(focus=false){
   if(!active())return;
   document.body.dataset.state='paused';
   input.clear();
   if(focus) action.focus({preventScroll:true});
 }
 const input=bindPlayerInput({
   canvas,pad:$('stick'),player,active,pause:()=>pause(!document.hidden && document.hasFocus()),
   refresh,mode:value=>{document.body.dataset.input=value}
 });
 action.onclick=event=>{
   document.body.dataset.state='playing';
   input.start({
     touch:event.pointerType==='touch'||matchMedia('(pointer:coarse)').matches,
     lock:event.detail>0
   });
   schedule();
 };
 $('pause').onclick=()=>pause(true);
 $('info').onclick=()=>{pause();about.showModal()};
 $('full').hidden=!document.fullscreenEnabled;
 $('full').onclick=async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
   catch{ /* Fullscreen is optional; the walk still works. */ }
 };
 let warm=false;
 $('light').onclick=()=>{
   warm=!warm;sun.color.setHex(warm?0xffcd89:0xffecce);
   sunOffset.set(...(warm?[90,38,36]:[60,76,89]));
   sun.position.copy(sun.target.position).add(sunOffset);sun.intensity=warm?2.8:2.65;
   hemi.intensity=warm?1.22:1.48;sky.material.uniforms.warm.value=+warm;
   sky.material.uniforms.solar.value.copy(sun.position).sub(sun.target.position).normalize();
   $('light').textContent=warm?'Abendlicht':'Tageslicht';r.shadowMap.needsUpdate=true;refresh();
 };
 function resize(){
   const w=stage.clientWidth,h=stage.clientHeight;
   if(!w||!h)return;
   r.setSize(w,h,false);c.aspect=w/h;
   // Keep useful peripheral vision on narrow phones without changing the pose.
   c.fov=T.MathUtils.clamp(T.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI*24/180)/c.aspect)),65,82);
   c.updateProjectionMatrix();refresh();
 }
 new ResizeObserver(resize).observe(stage);resize();
 r.shadowMap.needsUpdate=true;
 draw();dirty=false;
 document.body.dataset.state='ready';
}
start().catch(err=>{
 console.error(err);$('canvas').hidden=true;
 if (!window.WebGL2RenderingContext || /WebGL context/.test(err.message)) {
   $('error-text').textContent='Für den Rundgang braucht dein Browser WebGL 2. Aktiviere die Hardwarebeschleunigung oder versuche es mit einem anderen Browser.';
 }
 document.body.dataset.state='error';
});
