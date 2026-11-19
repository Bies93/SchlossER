// Deterministic texture synthesis. Albedo is sRGB; baked height derivatives
// are tangent-space +Y normals; roughness is linear in every RGB channel.
export function randomSource(seed) {
  return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
const clamp=(v,min=0,max=255)=>Math.min(max,Math.max(min,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const sharedSets=new Map();
export function sharedSet(T,kind,size){
  const id=kind+':'+size;
  if(!sharedSets.has(id))sharedSets.set(id,repeatSet(T,kind,size));
  return sharedSets.get(id);
}

export function repeatSet(T,kind,size=512) {
  const rng=randomSource({lawn:41,grit:309,bark:88,setts:166,plaster:481,wood:803,fineOak:672,tile:311,enamel:404}[kind]);
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
    color[i]=clamp(red);color[i+1]=clamp(green);color[i+2]=clamp(blue);color[i+3]=255;
    rough[i]=rough[i+1]=rough[i+2]=clamp(rgh);rough[i+3]=255;height[n]=relief;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=noise(0,x,y)-.5,b=noise(1,x,y)-.5,c=noise(2,x,y)-.5,f=rng()-.5;
    if(kind==='lawn'){
      const v=a*9+b*8+c*10+f*3, dry=clamp(.26+a*.44+b*.23,0,1);
      write(x,y,73+v+dry*22,96+v+dry*5,42+v+dry*10,a*.15+b*.15+c*.15+f*.032,231+24*c);
    } else if(kind==='grit'){
      const v=a*12+b*8+c*9+f*4;
      write(x,y,174+v,156+v,126+v,a*.13+b*.20+c*.22+f*.045,226+16*b);
    } else if(kind==='bark'){
      const furrow=Math.abs(Math.sin((x/size*18+b*.33+c*.12)*Math.PI));
      const seam=Math.pow(1-furrow,7),v=66+a*22+b*22+c*18+f*12-seam*19;
      const moss=clamp(.14+a*.8+b*.29,0,.55);
      write(x,y,v+9-moss*16,v+2+moss*4,v-9,.18+furrow*.07+c*.045-seam*.16,230+13*c);
    } else if(kind==='plaster'){
      const v=a*11+b*8+c*5+f*2;
      write(x,y,225+v,223+v,218+v,a*.01+b*.035+c*.086+f*.037,221+b*21+c*12);
    } else if(kind==='enamel'){
      const pit=clamp((b*.36+c*.61+f*.06-.23)*5.7,0,.82),v=a*21+b*12+c*6-pit*49;
      write(x,y,238+v+pit*7,237+v,231+v-pit*13,b*.021+c*.032+f*.014-pit*.061,179+b*22+pit*61);
    } else if(kind==='wood'){
      const wave=(Math.sin((y/size*48+a*.13+b*.065)*Math.PI)+1)*.5;
      const grain=Math.pow(wave,3),v=a*13+b*8+c*4-grain*24;
      write(x,y,163+v,131+v,93+v,grain*.081+c*.045+f*.015,161+grain*40+b*13);
    } else if(kind==='fineOak'){
      const beat=(.5+.5*Math.sin((y/size*38+a*.38+b*.15)*Math.PI))**4;
      const pore=(.5+.5*Math.cos((y/size*78+c*.16)*Math.PI))**6;
      const v=a*10+b*7+c*6+f*2.6-beat*6.3-pore*2.5;
      write(x,y,171+v,144+v,114+v,beat*.025+pore*.01+c*.023+f*.011,172+beat*19+b*13);
    } else if(kind==='tile'){
      const row=Math.floor(y/size*8),u=x/size*6+(row%2)*.5;
      const v=y/size*8-row, p=u-Math.floor(u);
      const seam=clamp(Math.min(v*12,(1-v)*14,p*18,(1-p)*18),0,1);
      const tint=Math.sin(Math.floor(u)%6*172+row*47)*6+a*8+b*7+c*4;
      write(x,y,141+tint-(1-seam)*13,90+tint-(1-seam)*9,69+tint-(1-seam)*7,
        seam*(.11+.13*Math.sin(p*Math.PI))+c*.045,202+seam*19+15*b);
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
      const v=(rng()-.47)*(blade?19:33), golden=rng()<.13;
      for(let j=0;j<l;j++){
        const xx=x+Math.round(dx*j),yy=y+Math.round(dy*j);
        const n=((yy+size)%size)*size+(xx+size)%size,i4=n*4;
        write(xx,yy,color[i4]+v+(golden?9:0),color[i4+1]+v*.80,color[i4+2]+v*.56,
          height[n]+.033+Math.abs(v)*.0023,rough[i4]-4-j*.8);
      }
    }
  }
  const strength={lawn:1.21,grit:1.68,bark:1.8,setts:2.7,plaster:1.02,wood:1.10,fineOak:.92,tile:1.4,enamel:1.45}[kind];
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

export function ageMasonry(material,exposure,neutral=0) {
  material.onBeforeCompile=shader=>{
    worldPatch(shader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float irregular = erlNoise(vec2(erlWorld.x+erlWorld.z,erlWorld.y)*2.6);
      float stoneValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      diffuseColor.rgb=mix(diffuseColor.rgb,stoneValue*vec3(.99,1.005,1.025),${neutral.toFixed(3)});
      float capillary = (1.0-smoothstep(.06, .28+irregular*.53, erlWorld.y))* ${exposure.toFixed(3)};
      float lichen = smoothstep(.64,.9,erlNoise(erlWorld.xz*.85+erlWorld.y*.4)*.73+irregular*.27);
      diffuseColor.rgb *= mix(vec3(.94+irregular*.10),vec3(.58,.61,.45),capillary);
      diffuseColor.rgb = mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.75,.80,.58),lichen*.31);
    `).replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor+irregular*.16-.11, .64, .99);');
  };
  material.customProgramCacheKey=()=> 'masonry-weather-'+exposure+'-'+neutral;
}

// Sculptures have no UVs in the shipped GLB. Keep their geometry untouched
// and reuse the existing stone map with a world-scale projection.
export function sculptureMaterials(sculptures,finish){
  const {map:source,normalMap:relief}=finish('FOUNTAIN_STONE'),prepared=new Map();
  sculptures.traverse(o=>{
    if(!o.isMesh||o.name.startsWith('Friedrich_Denkmal_'))return;
    const src=o.material,name=src.name??'';
    if(!/bronze|granite|carved_stone|damp_stone|weathered_sandstone|damp_recesses|Rock_layer/i.test(name))return;
    const bronze=/bronze/i.test(name),wet=/damp/i.test(name),granite=/granite/i.test(name);
    const rim=/carved_stone/i.test(name),rock=/Rock_layer/i.test(name);
    let m=prepared.get(src);
    if(!m){
      m=src.clone();m.roughness=bronze?.58:granite?.69:wet?.42:.82;m.metalness=bronze?.68:0;
      if(bronze)m.color.setRGB(.085,.125,.115);
      m.onBeforeCompile=shader=>{
        worldPatch(shader);
        shader.uniforms.erlStoneSurface={value:source};
        shader.uniforms.erlStoneRelief={value:relief};
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D erlStoneSurface,erlStoneRelief;')
          .replace('#include <color_fragment>',`#include <color_fragment>
            float pat=erlNoise(erlWorld.xz*3.7+vec2(erlWorld.y)*1.3);
            ${bronze?`float oxide=smoothstep(.21,.72,pat*.67+erlNoise(erlWorld.xz*13.)*.20+erlNoise(erlWorld.xz*1.8+erlWorld.y)*.13);
              diffuseColor.rgb=mix(diffuseColor.rgb*vec3(.79,.69,.60),vec3(.088,.243,.218),oxide);`:
              `vec3 w=pow(abs(normalize(cross(dFdx(erlWorld),dFdy(erlWorld)))),vec3(4.0));
              w/=max(w.x+w.y+w.z,.001);
              vec3 p=erlWorld/${granite?'.72':wet?'1.58':'2.20'};
              float waterContact=${granite?'0.0':'(1.0-smoothstep(.075,.26+pat*.12,abs(erlWorld.y-.379)))*smoothstep(37.,39.,-erlWorld.z)'};
              vec3 swatch=texture2D(erlStoneSurface,p.zy).rgb*w.x+texture2D(erlStoneSurface,p.xz).rgb*w.y+texture2D(erlStoneSurface,p.xy).rgb*w.z;
              diffuseColor.rgb *= mix(vec3(.98),swatch*1.5,${granite?'.17':wet?'.28':'.34'});
              diffuseColor.rgb *= mix(vec3(.93),vec3(1.065),pat)*mix(vec3(1.),vec3(.77,.78,.70),waterContact*.68);
              ${rim?`vec2 dq=vec2(max(0.,abs(erlWorld.x)-4.75),erlWorld.z+47.);
                float radius=length(dq);
                float along=abs(erlWorld.x)<4.75 ? (erlWorld.z<-47.?erlWorld.x+4.75:47.0-erlWorld.x) :
                  (erlWorld.x>0.?23.75:61.55)+atan(dq.y,max(.0001,dq.x))*9.45;
                float phase=along/1.72+.025*(pat-.5);
                float joint=1.-smoothstep(.007,.025,abs(fract(phase+.5)-.5));
                float lip=smoothstep(9.16,9.32,radius)*(1.-smoothstep(.658,.708,erlWorld.y))*smoothstep(.28,.36,erlWorld.y);
                diffuseColor.rgb*=mix(vec3(.95+.11*erlHash(vec2(floor(phase+.5),2.5))),vec3(.39,.38,.32),joint*.78*lip);
                diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.78,.85,.65),waterContact*lip*.51);`:''}
              ${rock?`float strip=erlNoise(vec2(erlWorld.x*.88+erlWorld.z*.51,erlWorld.y*13.5+erlWorld.x*.89));
                float dark=smoothstep(.69,.86,strip)*.27+(1.-smoothstep(1.1,4.1,erlWorld.y))*.15;
                diffuseColor.rgb*=mix(vec3(1.095,1.06,.99),vec3(.63,.65,.49),dark+waterContact*.19);`:''}`}
          `).replace('#include <roughnessmap_fragment>',
            '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(pat-.5)*'+(bronze?'.36':'.17')+(bronze?'':'-waterContact*.28')+',.27,.96);');
        if(bronze)shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\nmetalnessFactor=mix(.67,.18,oxide);');
        else shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          vec2 tx=texture2D(erlStoneRelief,p.zy).rg*2.-1.;
          vec2 ty=texture2D(erlStoneRelief,p.xz).rg*2.-1.;
          vec2 tz=texture2D(erlStoneRelief,p.xy).rg*2.-1.;
          vec3 grain=vec3(0.,tx.y,tx.x)*w.x+vec3(ty.x,0.,ty.y)*w.y+vec3(tz.x,tz.y,0.)*w.z;
          grain=(viewMatrix*vec4(grain,0.)).xyz;
          normal=normalize(normal+(grain-normal*dot(normal,grain))*${granite?'.13':'.22'}*(1.-waterContact*.35));
        `);
      };
      m.customProgramCacheKey=()=> 'erl-carving-v4-'+bronze+'-'+wet+'-'+granite+'-'+rim+'-'+rock;
      prepared.set(src,m);
    }
    o.material=m;
  });
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
      vec4 fields=texture2D(erlPaths,along);
      float route=fields.r, compact=fields.g, damp=fields.b, bed=fields.a;
      vec2 fine = erlWorld.xz*vec2(1.0,-1.0)/.93;
      float scatter = erlNoise(erlWorld.xz*5.4);
      float verge = smoothstep(.28,.75,route + (scatter-.5)*mix(.31,.09,compact));
      float soil = smoothstep(.11,.46,route)*(1.0-smoothstep(.44,.74,route));
      float macro = smoothstep(.20,.81,erlNoise(erlWorld.xz*.18)*.73+erlNoise(erlWorld.xz*.39)*.27);
      // Low-frequency colour sits in world coordinates, never in the tile.
      diffuseColor.rgb *= mix(vec3(.94,.97,.93),vec3(1.12,1.04,.96),macro);
      diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.158,.118,.068), soil*(.40+.35*compact));
      diffuseColor.rgb = mix(diffuseColor.rgb,texture2D(erlGritAlbedo,fine).rgb*mix(1.0,.87,compact),verge);
      diffuseColor.rgb *= mix(vec3(1.0),vec3(.67,.75,.60),damp*.67);
      diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.085,.057,.033)*(.91+scatter*.24),bed*.89);
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor = clamp(mix(roughnessFactor,texture2D(erlGritRough,fine).g,verge)-damp*.11-compact*.035,.61,1.0);
    `).replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replace(
      'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
      'vec3 mapN = mix(texture2D(normalMap,vNormalMapUv).xyz,texture2D(erlGritNormal,fine).xyz,verge)*2.0-1.0; mapN.xy *= (1.0 - compact*.28 - bed*.20);'
    ));
  };
  ground.customProgramCacheKey=()=> 'erl-turf-mask-v2';
  return {ground,gravel};
}
