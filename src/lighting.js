import {addFixtures} from './street-light.js';

export const DEFAULT_LIGHT='dusk';
export const LIGHTING = {
  dusk:{sky:0x627fad,horizon:0xe8a874,fog:0xbc9f8c,cloud:0xf6cfab,fogDensity:.0024,
    direction:[-.85,.19,.54],disc:0xffc278,angular:.006,aura:.39,stars:0,clouds:.39,
    key:0xffc795,power:2.80,fill:0xbccdf2,bounce:0x8a7365,hemi:.94,
    exposure:1.02,env:'dusk',reflection:.62,lamps:.42,window:.28,shadow:[89,64,.036]},
  night:{sky:0x192b4c,horizon:0x485471,fog:0x374760,cloud:0x425370,fogDensity:.0023,
    direction:[-.46,.54,-.71],disc:0xecf1ff,angular:.0072,aura:.054,stars:1,clouds:.23,
    key:0xc4d7ff,power:.51,fill:0xadbdeb,bounce:0x5e5d68,hemi:.62,
    exposure:.94,env:'night',reflection:.30,lamps:1,window:.85,shadow:[73,71,.040]}
};

const SKY = `
 varying vec3 ray;
 uniform vec3 topTint,horizonTint,cloudTint,discTint,celestial;
 uniform float discSize,aura,starLevel,cloudCover;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
   return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
 void main(){
   vec3 v=normalize(ray);float h=max(v.y,0.);
   vec3 col=mix(horizonTint,topTint,pow(smoothstep(0.,.93,h),.62));
   float toward=max(dot(v,celestial),0.);
   col+=discTint*pow(toward,10.)*aura*(.22+.78*smoothstep(-.03,.13,h));
   vec2 p=v.xz/max(.10,v.y+.18)*2.8;
   float n=noise(p)*.52+noise(p*2.3)*.29+noise(p*4.7)*.13+noise(p*9.8)*.06;
   float clouds=smoothstep(.49,.78,n)*smoothstep(.014,.16,h)*cloudCover;
   vec2 star=vec2(atan(v.z,v.x)*116.,v.y*166.);
   vec2 id=floor(star),d=fract(star)-vec2(.27+.43*hash(id+3.),.22+.52*hash(id+7.));
   float glint=(1.-smoothstep(.020,.114,length(d)))*step(.990,hash(id));
   col+=vec3(glint)*starLevel*.48*smoothstep(.13,.51,h)*(1.-clouds);
   col=mix(col, cloudTint*(.78+.22*toward),clouds);
   float body=smoothstep(cos(discSize*1.17),cos(discSize*.84),toward);
   col+=discTint*body*(starLevel>.5?1.7:6.0)*(1.-clouds*.75);
   gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
 }
`;

// Small procedural HDR maps for reflections, matching the sky palette.
function ambientMap(T, preset){
  const width=128,height=64,pixels=new Uint16Array(width*height*4),half=T.DataUtils.toHalfFloat;
  const sky=new T.Color(preset.sky),horizon=new T.Color(preset.horizon),
    ground=new T.Color(preset.bounce).multiplyScalar(preset.env==='night'?.12:.28),
    disc=new T.Color(preset.disc),axis=new T.Vector3(...preset.direction).normalize(),color=new T.Color();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const s=(x+.5)/width*Math.PI*2-Math.PI, t=(y+.5)/height*Math.PI-Math.PI/2,h=Math.sin(t),r=Math.cos(t);
    color.copy(horizon).lerp(h>=0?sky:ground,Math.pow(Math.abs(h),.57));
    const toward=Math.max(0,Math.cos(s)*r*axis.x+h*axis.y+Math.sin(s)*r*axis.z);
    const glow=preset.aura*Math.pow(toward,10);
    color.r+=disc.r*glow;color.g+=disc.g*glow;color.b+=disc.b*glow;
    pixels.set([half(color.r),half(color.g),half(color.b),half(1)],(y*width+x)*4);
  }
  const texture=new T.DataTexture(pixels,width,height,T.RGBAFormat,T.HalfFloatType);
  texture.colorSpace=T.LinearSRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;
  texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
  return texture;
}

export function makeLighting(T, renderer, scene, world, floorHeight){
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const reflections={};
  const uniforms={
    topTint:{value:new T.Color()},horizonTint:{value:new T.Color()},cloudTint:{value:new T.Color()},
    discTint:{value:new T.Color()},celestial:{value:new T.Vector3()},
    discSize:{value:0},aura:{value:0},starLevel:{value:0},cloudCover:{value:0}
  };
  const sky=new T.Mesh(new T.SphereGeometry(860,36,24),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,uniforms,
    vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:SKY
  }));
  sky.renderOrder=-100;
  const hemi=new T.HemisphereLight(), key=new T.DirectionalLight();
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  scene.fog=new T.FogExp2();scene.add(sky,hemi,key,key.target);
  const fixtures=addFixtures(T,scene,world,floorHeight);
  const axis=new T.Vector3(), right=new T.Vector3(), up=new T.Vector3(0,1,0), planeUp=new T.Vector3();
  const center=new T.Vector3(), focus=new T.Vector3();
  const windows=[];
  let state=LIGHTING[DEFAULT_LIGHT], id=DEFAULT_LIGHT, needsAnchor=true;
  function applyLighting(name){
    if(!Object.hasOwn(LIGHTING,name))return false;
    state=LIGHTING[name];id=name;needsAnchor=true;
    if(!reflections[state.env])reflections[state.env]=ambientMap(T,state);
    scene.environment=reflections[state.env];scene.environmentIntensity=state.reflection;
    renderer.toneMappingExposure=state.exposure;
    scene.fog.color.setHex(state.fog);scene.fog.density=state.fogDensity;
    hemi.color.setHex(state.fill);hemi.groundColor.setHex(state.bounce);hemi.intensity=state.hemi;
    key.color.setHex(state.key);key.intensity=state.power;
    axis.set(...state.direction).normalize();
    right.crossVectors(up,axis).normalize();planeUp.crossVectors(axis,right).normalize();
    const [w,h,bias]=state.shadow;
    Object.assign(key.shadow.camera,{left:-w,right:w,top:h,bottom:-h,near:2,far:395});
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.normalBias=bias;key.shadow.bias=-.00017;
    uniforms.topTint.value.setHex(state.sky);uniforms.horizonTint.value.setHex(state.horizon);
    uniforms.cloudTint.value.setHex(state.cloud);uniforms.discTint.value.setHex(state.disc);
    uniforms.celestial.value.copy(axis);
    uniforms.discSize.value=state.angular;uniforms.aura.value=state.aura;
    uniforms.starLevel.value=state.stars;uniforms.cloudCover.value=state.clouds;
    fixtures.setLevel(state.lamps);
    for(const m of windows)m.emissiveIntensity=state.window;
    return true;
  }
  function update(player){
    sky.position.set(player.x,player.y,player.z);
    if(needsAnchor||Math.abs(center.x-player.x)>34||Math.abs(center.z-player.z)>34){
      center.set(Math.round(player.x/48)*48,0,Math.round(player.z/48)*48);focus.copy(center);
      // Snap in the light's projection, not in world coordinates alone.
      const [w,h]=state.shadow,snap=(v,n)=>Math.round(v/n)*n;
      const u=focus.dot(right),v=focus.dot(planeUp);
      focus.addScaledVector(right,snap(u,2*w/2048)-u).addScaledVector(planeUp,snap(v,2*h/2048)-v);
      key.target.position.copy(focus);key.position.copy(focus).addScaledVector(axis,176);
      renderer.shadowMap.needsUpdate=true;needsAnchor=false;
    }
    fixtures.update(player);
  }
  return {applyLighting,update,registerWindows(material){windows.push(material);material.emissiveIntensity=state.window;},get id(){return id}};
}
