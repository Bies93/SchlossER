// Deterministic texture synthesis. Albedo is sRGB; baked height derivatives
// are tangent-space +Y normals; roughness is linear in every RGB channel.
export function randomSource(seed) {
  return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
const clamp=(v,min=0,max=255)=>Math.min(max,Math.max(min,v));
const lerp=(a,b,t)=>a+(b-a)*t;

export function repeatSet(T,kind,size=512) {
  const rng=randomSource({lawn:41,grit:309,bark:88,setts:166}[kind]);
  const field=n=>Float32Array.from({length:n*n},rng);
  const grids=[8,24,64].map(n=>[n,field(n)]);
  const noise=(i,x,y)=>{
    const [n,values]=grids[i], s=x*n/size,t=y*n/size,ix=Math.floor(s),iy=Math.floor(t);
    const p=s-ix,q=t-iy,a=p*p*(3-2*p),b=q*q*(3-2*q);
    const at=(u,v)=>values[(v+n)%n*n+(u+n)%n];
    return lerp(lerp(at(ix,iy),at(ix+1,iy),a),lerp(at(ix,iy+1),at(ix+1,iy+1),a),b);
  };
  const color=new Uint8Array(size*size*4), normal=new Uint8Array(color.length),
    rough=new Uint8Array(color.length), height=new Float32Array(size*size);
  function write(x,y,red,green,blue,relief,rgh){
    const n=((y+size)%size)*size+(x+size)%size,i=n*4;
    color.set([clamp(red),clamp(green),clamp(blue),255],i);
    rough.set([rgh,rgh,rgh,255],i);height[n]=relief;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=noise(0,x,y)-.5,b=noise(1,x,y)-.5,c=noise(2,x,y)-.5,f=rng()-.5;
    if(kind==='lawn'){
      const v=a*11+b*14+c*20+f*9, dry=clamp(.26+a*.58+b*.25,0,1);
      write(x,y,70+v+dry*23,94+v+dry*6,39+v+dry*12,a*.15+b*.11+c*.08+f*.025,234+14*c);
    } else if(kind==='grit'){
      const v=a*21+b*13+c*18+f*8;
      write(x,y,174+v,154+v,119+v,a*.13+b*.19+c*.12+f*.033,229+8*b);
    } else if(kind==='bark'){
      const furrow=Math.abs(Math.sin((x/size*18+b*.33+c*.12)*Math.PI));
      const seam=Math.pow(1-furrow,7),v=66+a*22+b*22+c*18+f*12-seam*19;
      const moss=clamp(.14+a*.8+b*.29,0,.55);
      write(x,y,v+9-moss*16,v+2+moss*4,v-9,.18+furrow*.07+c*.045-seam*.16,230+13*c);
    } else {
      // Staggered, lightly irregular granite setts. A 1.2 m tile is 10 by
      // eight stones: nominal block 12 cm x 15 cm, 8 mm pale sand joints.
      const row=Math.floor(y/size*8), u=x/size*10+(row%2)*.5;
      const col=Math.floor(u)%10, px=u-Math.floor(u),py=y/size*8-row;
      const distance=Math.min(px,1-px,py,1-py)+(a+b)*.05;
      const bevel=clamp((distance-.028)/.055,0,1);
      const v=(Math.sin(col*52.1+row*35.13)*.5+.5)*29+a*19+b*11+c*14+f*12;
      write(x,y,lerp(111,118+v,bevel),lerp(104,117+v*.91,bevel),
        lerp(91,111+v*.86,bevel),bevel*.24+c*.038+f*.012,240-bevel*31);
    }
  }
  if(kind==='lawn'||kind==='grit'){
    const blade=kind==='lawn';
    for(let i=0;i<(blade?19000:8200);i++){
      const x=(rng()*size)|0,y=(rng()*size)|0;
      const l=blade?2+Math.floor(rng()*7):1+Math.floor(rng()*4);
      const angle=rng()*2*Math.PI,dx=Math.cos(angle),dy=Math.sin(angle);
      const v=(rng()-.47)*(blade?35:74), golden=rng()<.13;
      for(let j=0;j<l;j++){
        const xx=x+Math.round(dx*j),yy=y+Math.round(dy*j);
        const n=((yy+size)%size)*size+(xx+size)%size,i4=n*4;
        write(xx,yy,color[i4]+v+(golden?14:0),color[i4+1]+v*.80,color[i4+2]+v*.56,
          height[n]+.025+Math.abs(v)*.001,rough[i4]-2);
      }
    }
  }
  const strength={lawn:.96,grit:1.1,bark:1.8,setts:2.7}[kind];
  const sample=(x,y)=>height[(y+size)%size*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=(sample(x-1,y)-sample(x+1,y))*strength,b=(sample(x,y-1)-sample(x,y+1))*strength;
    const f=127.5/Math.hypot(a,b,1);
    normal.set([128+a*f,128+b*f,128+f,255],(y*size+x)*4);
  }
  const make=(data,srgb=false)=>{
    const tex=new T.DataTexture(data,size,size);
    tex.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
    tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;
    tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.anisotropy=4;tex.needsUpdate=true;
    return tex;
  };
  return {map:make(color,true),normalMap:make(normal),roughnessMap:make(rough)};
}

const worldPatch=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 erlWorld;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nerlWorld = (modelMatrix * vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
    varying vec3 erlWorld;
    float erlHash(vec2 q){return fract(sin(dot(q,vec2(92.1,72.5)))*43698.5453);}
    float erlNoise(vec2 p){
      vec2 g=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(erlHash(g),erlHash(g+vec2(1,0)),f.x),
        mix(erlHash(g+vec2(0,1)),erlHash(g+1.0),f.x),f.y);
    }`);
};

export function ageMasonry(material,exposure) {
  material.onBeforeCompile=shader=>{
    worldPatch(shader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float irregular = erlNoise(vec2(erlWorld.x+erlWorld.z,erlWorld.y)*2.6);
      float capillary = (1.0-smoothstep(.06, .28+irregular*.53, erlWorld.y))* ${exposure.toFixed(3)};
      float lichen = smoothstep(.64,.9,erlNoise(erlWorld.xz*.85+erlWorld.y*.4)*.73+irregular*.27);
      diffuseColor.rgb *= mix(vec3(.94+irregular*.10),vec3(.58,.61,.45),capillary);
      diffuseColor.rgb = mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.75,.80,.58),lichen*.31);
    `).replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor+irregular*.16-.11, .64, .99);');
  };
  material.customProgramCacheKey=()=> 'masonry-weather-'+exposure;
}

export function gardenMaterials(T,mask,ext) {
  const turf=repeatSet(T,'lawn',768), stone=repeatSet(T,'grit',512);
  const ground=new T.MeshStandardMaterial({...turf,roughness:1,metalness:0});
  ground.normalScale.setScalar(.62);
  const gravel=new T.MeshStandardMaterial({...stone,roughness:1,metalness:0,side:T.DoubleSide});
  gravel.normalScale.setScalar(.58);
  const uv=T.ShaderChunk.uv_vertex; // world scale for meshes imported with unrelated UV layouts
  gravel.onBeforeCompile=shader=>{
    worldPatch(shader);
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',uv+`
      vec2 eurGravelUV = (modelMatrix * vec4(position,1.0)).xz*vec2(1.0,-1.0) / .93;
      vMapUv = eurGravelUV; vNormalMapUv = eurGravelUV; vRoughnessMapUv = eurGravelUV;
    `);
  };
  gravel.customProgramCacheKey=()=> 'erl-grit-world-v1';
  ground.onBeforeCompile=shader=>{
    worldPatch(shader);
    shader.uniforms.erlPaths={value:mask};
    shader.uniforms.erlMaskRect={value:new T.Vector4(ext.x,ext.z,ext.w,ext.h)};
    shader.uniforms.erlGritAlbedo={value:stone.map};
    shader.uniforms.erlGritNormal={value:stone.normalMap};
    shader.uniforms.erlGritRough={value:stone.roughnessMap};
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform sampler2D erlPaths,erlGritAlbedo,erlGritNormal,erlGritRough;
      uniform vec4 erlMaskRect;
    `).replace('#include <map_fragment>',`#include <map_fragment>
      vec2 along = (erlWorld.xz-erlMaskRect.xy)/erlMaskRect.zw;
      float route = texture2D(erlPaths,along).r;
      vec2 fine = erlWorld.xz*vec2(1.0,-1.0)/.93;
      float scatter = erlNoise(erlWorld.xz*5.4);
      float verge = smoothstep(.14,.75,route + (scatter-.5)*.17);
      float soil = smoothstep(.04,.28,route)*(1.0-smoothstep(.32,.61,route));
      float macro = erlNoise(erlWorld.xz*.085)*.67+erlNoise(erlWorld.xz*.31)*.33;
      // Low-frequency colour sits in world coordinates, never in the tile.
      diffuseColor.rgb *= mix(vec3(.76,.81,.74),vec3(1.18,1.13,1.06),macro);
      diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.19,.14,.085), soil*.59);
      diffuseColor.rgb = mix(diffuseColor.rgb,texture2D(erlGritAlbedo,fine).rgb, verge);
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor,texture2D(erlGritRough,fine).g,verge);
    `).replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replace(
      'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
      'vec3 mapN = mix(texture2D(normalMap,vNormalMapUv).xyz,texture2D(erlGritNormal,fine).xyz,verge)*2.0-1.0;'
    ));
  };
  ground.customProgramCacheKey=()=> 'erl-turf-mask-v1';
  return {ground,gravel};
}
