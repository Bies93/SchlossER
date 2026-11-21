import {addFixtures} from './street-light.js';
import {randomSource} from './surface-detail.js';
import {bakeMoon,bakeStars} from './sky-maps.js';

export const DEFAULT_LIGHT='dusk';
export const LIGHTING = {
  day:{sky:0x477fc0,horizon:0xa9c0d4,fog:0xc3c8c5,cloud:0xf1f2ef,fogDensity:.0018,
    direction:[-.55,.77,.32],disc:0xffedc3,angular:.0064,aura:.19,stars:0,clouds:.43,
    key:0xffedd7,power:2.67,fill:0xb5d0f1,bounce:0x8b8870,hemi:1.18,
    exposure:1.04,env:'day',reflection:.67,lamps:0,window:.055,shadow:[78,70,.041]},
  dusk:{sky:0x5076a1,horizon:0xe8a581,fog:0xb49f97,cloud:0xf3c9ae,fogDensity:.0027,
    direction:[-.85,.29,.54],disc:0xffbd71,angular:.007,aura:.36,stars:0,clouds:.39,
    key:0xffddc3,power:2.57,fill:0xc3d6ef,bounce:0x8a8571,hemi:1.10,
    exposure:1.02,env:'dusk',reflection:.64,lamps:.42,window:.28,shadow:[89,64,.049]},
  night:{sky:0x101c35,horizon:0x3a4c6c,fog:0x3a465f,cloud:0x586887,fogDensity:.0026,
    direction:[-.46,.54,-.71],disc:0xeaf1ff,angular:.013,aura:.056,stars:1,clouds:.23,
    key:0xb6cefc,power:.65,fill:0xa6b7e0,bounce:0x656272,hemi:.64,
    exposure:.95,env:'night',reflection:.30,lamps:1,window:.85,shadow:[73,71,.040]}
};

const SKY = `
 varying vec3 ray;
 uniform vec3 topTint,horizonTint,cloudTint,discTint,celestial;
 uniform float discSize,aura,starLevel,cloudCover,skyTime;
 uniform sampler2D cloudField,starsMap,moonMap;
 float clouds(vec2 p){return texture2D(cloudField,p*.086).r;}
 void main(){
   vec3 v=normalize(ray);
   float h=max(v.y,0.),toward=max(dot(v,celestial),0.),night=starLevel;
   vec2 compass=normalize(v.xz+vec2(.00001)),sunward=normalize(celestial.xz);
   float eastwest=.5+.5*dot(compass,sunward);
   vec3 away=mix(horizonTint,topTint,mix(.63,.39,night));
   vec3 horizon=mix(away,horizonTint,pow(eastwest,.86));
   vec3 col=mix(horizon,topTint,pow(h,.51));
   float bank=exp(-h*6.4);
   float glow=exp2(-(1.-toward)*mix(29.,88.,night));
   float coreGlow=exp2(-(1.-toward)*mix(185.,560.,night));
   col+=discTint*aura*(glow*.73+coreGlow*mix(.89,.39,night)+pow(eastwest,5.)*bank*.22);
   col=mix(col,mix(horizon,topTint,night*.15),smoothstep(.015,.37,-v.y)*.91);

   // Lower banks are broad and lit on their sunward side. The high ice
   // wisps have a different scale, direction and much less opacity.
   vec2 drift=vec2(.018,-.009)*skyTime;
   vec2 p=(vec2(v.x+v.z*.31,v.z-v.x*.22)/max(.22,v.y+.31))*vec2(2.8,2.1)+drift;
   float f=clouds(p+vec2(clouds(p*.76),clouds(p*.83+3.1))*.69),level=.59-cloudCover*.37;
   float coverage=smoothstep(level,level+.29,f)*smoothstep(.018,.16,h);
   float rim=smoothstep(-.17,.20,f-clouds(p+sunward*.212));
   vec3 under=mix(col*.56,topTint*.43,.38);
   vec3 warm=mix(cloudTint,discTint,.14*glow)*mix(.64,.37,night)*(1.+glow*.51);
   vec3 bankColor=mix(under,warm,mix(.24,.87,rim))+(coverage*.15+.03)*warm;
   vec2 hi=vec2(p.x*.95+p.y*.32,p.y*3.5)-drift*.54+31.;
   float veil=smoothstep(.535,.805,clouds(hi))*smoothstep(.10,.38,h)*(1.-coverage*.82);
   vec3 highColor=mix(topTint,cloudTint,mix(.36,.14,night));

   if(night>.5&&v.y>.04){
     float longitude=atan(v.z,v.x)/6.2831853+.5;
     col+=texture2D(starsMap,vec2(longitude,h)).rgb*.47*smoothstep(.04,.36,h)
       *(1.-coverage*.94)*(1.-veil*.78)*(1.-coreGlow*.86);
   }
   col=mix(col,highColor,veil*mix(.38,.20,night));
   col=mix(col,bankColor,coverage*mix(.58,.60,night));
   vec3 du=normalize(cross(vec3(0.,1.,0.),celestial)),dv=cross(celestial,du);
   vec2 disk=vec2(dot(v,du),dot(v,dv))/discSize;
   float radius=length(disk),aa=clamp(fwidth(radius)*.65,.013,.28);
   float body=(1.-smoothstep(1.-aa,1.+aa,radius))*step(.0,dot(v,celestial));
   if(body>0.){
     float surface=night>.5?.093+1.13*texture2D(moonMap,disk*.5+.5).r:3.7;
     col+=discTint*body*surface*(1.-coverage*.94);
   }
   gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
 }
`;

function cloudNoise(T){
  // Tile the noise once. The full-screen shader can then layer and light
  // it with texture reads, rather than repeating the lattice per pixel.
  const size=256,rng=randomSource(78238),out=new Uint8Array(size*size);
  const layers=[8,17,36,72].map((n,i)=>[n,[.52,.28,.14,.06][i],Float32Array.from({length:n*n},rng)]);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let value=0;
    for(const [n,gain,grid] of layers){
      const a=(x+.5)*n/size,b=(y+.5)*n/size,i=Math.floor(a),j=Math.floor(b),u=a-i,v=b-j;
      const U=u*u*(3-2*u),V=v*v*(3-2*v),row=j*n,next=((j+1)%n)*n,right=(i+1)%n;
      const p=grid[row+i]+U*(grid[row+right]-grid[row+i]);
      const q=grid[next+i]+U*(grid[next+right]-grid[next+i]);
      value+=(p+V*(q-p))*gain;
    }
    out[y*size+x]=Math.round(value*255);
  }
  const t=new T.DataTexture(out,size,size,T.RedFormat);
  t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;
  t.generateMipmaps=true;t.needsUpdate=true;return t;
}

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
  const cloudField=cloudNoise(T);
  const uniforms={
    topTint:{value:new T.Color()},horizonTint:{value:new T.Color()},cloudTint:{value:new T.Color()},
    discTint:{value:new T.Color()},celestial:{value:new T.Vector3()},
    discSize:{value:0},aura:{value:0},starLevel:{value:0},cloudCover:{value:0},skyTime:{value:0},
    cloudField:{value:cloudField},starsMap:{value:cloudField},moonMap:{value:cloudField}
  };
  const sky=new T.Mesh(new T.SphereGeometry(860,36,24),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,uniforms,
    vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
    fragmentShader:SKY
  }));
  // Draw only where opaque geometry left the depth buffer clear.
  sky.renderOrder=9000;sky.userData.noSceneQuery=true;
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
    if(state.stars&&uniforms.starsMap.value===cloudField){
      uniforms.starsMap.value=bakeStars(T);uniforms.moonMap.value=bakeMoon(T);
    }
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
    uniforms.skyTime.value=performance.now()*.001;
    if(needsAnchor||Math.abs(center.x-player.x)>34||Math.abs(center.z-player.z)>34){
      center.set(Math.round(player.x/48)*48,0,Math.round(player.z/48)*48);focus.copy(center);
      // Snap in the light's projection, not in world coordinates alone.
      const [w,h]=state.shadow,snap=(v,n)=>Math.round(v/n)*n;
      const u=focus.dot(right),v=focus.dot(planeUp);
      const size=key.shadow.mapSize.x;
      focus.addScaledVector(right,snap(u,2*w/size)-u).addScaledVector(planeUp,snap(v,2*h/size)-v);
      key.target.position.copy(focus);key.position.copy(focus).addScaledVector(axis,176);
      renderer.shadowMap.needsUpdate=true;needsAnchor=false;
    }
    fixtures.update(player);
  }
  function setShadowSize(size){
    if(key.shadow.mapSize.x===size)return;
    key.shadow.map?.dispose();key.shadow.map=null;
    key.shadow.mapSize.set(size,size);needsAnchor=true;
  }
  return {applyLighting,setShadowSize,update,registerWindows(material){windows.push(material);material.emissiveIntensity=state.window;},get id(){return id}};
}
