// Small, shared, seamless PBR swatches for the virtual props. Values in the
// colour map are sRGB, the surface channels below stay linear.
const cache=new WeakMap(),tau=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const hash=(x,y,seed)=>{
  let a=Math.imul(x+seed,0x45d9f3b)^Math.imul(y+481,0x119de1f3);
  a=Math.imul(a^(a>>>15),0x45d9f3b);return ((a^(a>>>13))>>>0)/4294967296;
};
const taper=(a,b,x)=>{const f=clamp((x-a)/(b-a));return f*f*(3-2*f);};
const blend=(a,b,t)=>a+(b-a)*t;
function noise(u,v,w,h,seed){
  const x=u*w,y=v*h,X=Math.floor(x),Y=Math.floor(y),f=taper(0,1,x-X),g=taper(0,1,y-Y);
  const a=((X%w)+w)%w,b=((Y%h)+h)%h,c=(a+1)%w,d=(b+1)%h;
  return blend(blend(hash(a,b,seed),hash(c,b,seed),f),blend(hash(a,d,seed),hash(c,d,seed),f),g);
}

export function weaponSwatch(T,kind){
  if(!cache.has(T))cache.set(T,new Map());
  const swatches=cache.get(T);if(swatches.has(kind))return swatches.get(kind);
  const N=kind==='walnut'?512:['rubber','leather','machine'].includes(kind)?128:256,stride=N*N,
    albedo=new Uint8Array(stride*4),normals=new Uint8Array(stride*4),
    rough=new Uint8Array(stride*4),height=new Float32Array(stride);
  const wood=kind==='walnut',cloth=kind==='twill',leather=kind==='leather',poly=kind==='polymer';
  const composite=kind==='composite',rubber=kind==='rubber';
  let r=0,g=0,b=0,h=0,s=0;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const u=x/N,v=y/N,j=y*N+x,i=j*4,k=hash(x,y,7)-.5;
    if(wood){
      // Early/late wood bends around a few burl-like flows; vessel pores run
      // with the grain and darken much less than the annual bands.
      const a=noise(u,v,4,7,531),broad=noise(u,v,3,5,63),wave=noise(u,v,4,13,1336);
      const warp=v+.031*Math.sin(tau*(u*.999+.29*wave))+.018*Math.sin(tau*(u*2+v*3))+.029*a;
      const rings=.5+.5*Math.sin(tau*(warp*14+.23*broad));
      const late=taper(.50,.89,rings),band=taper(.76,.92,.5+.5*Math.sin(tau*(warp*36+.30*wave)));
      const pores=taper(.74,.92,noise(u,warp,46,146,529)),fine=noise(u,warp,24,108,119)-.5;
      const col=20*(a-.49)+20*(broad-.5)-17*late-9*band-24*pores+13*fine+3*k;
      r=150+col;g=118+col*.88;b=87+col*.73;
      h=.26*(a-.5)-.26*late+.032*band-.21*pores+.09*fine;
      s=156+late*30+band*11+pores*33+39*(broad-.5);
    }else if(cloth||composite||leather||rubber||poly){
      const a=noise(u,v,7,8,43)-.5,broad=noise(u,v,19,21,119)-.5;
      const diagonal=.5+.5*Math.cos(tau*(u*(composite?64:49)+v*(composite?64:37)+a*.39));
      const over=.5+.5*Math.cos(tau*(v*(composite?66:40)-u*(composite?66:29)));
      const fiber=diagonal*(.45+.55*over),pore=taper(.66,.93,noise(u,v,99,95,11));
      const stipple=cloth||composite?fiber-.52:leather?broad*.36-pore*.65:poly?(.20-pore)*.50+k*.25:k*.17-pore*.32;
      const value=(cloth?207:leather?215:poly?222:composite?209:221)+20*a+13*broad+
        stipple*(cloth?39:composite?35:26);
      r=value+(leather?7:0);g=value;b=value-(cloth?9:leather?15:0);
      h=stipple*(cloth?.34:composite?.25:.38)+.125*a+.09*broad;
      s=(cloth?221:composite?158:leather?195:rubber?239:211)+stipple*48+38*broad;
    }else{
      const a=noise(u,v,6,8,899),broad=noise(u,v,18,19,71),cast=noise(u,v,76,81,1751);
      const scratch=taper(.829,.98,noise(u,v,21,117,91)),dip=taper(.64,.92,cast);
      const blue=kind==='blue',raw=kind==='machine';
      const brush=(hash(0,y,19)-.5)*(.37+.63*noise(u,v,11,19,27));
      const tone=213+29*(a-.5)+24*(broad-.5)+10*k-12*dip+(raw?38:12)*brush+15*scratch;
      r=tone+(blue?-2:1);g=tone+(blue?2:0);b=tone+(blue?6:-2);
      h=(broad-.5)*.10+(cast-.5)*(raw?.055:.13)+brush*.14-dip*.11-scratch*.035;
      s=(raw?144:blue?174:202)+58*(broad-.5)+25*dip-brush*32-scratch*64;
    }
    albedo[i]=clamp(r,0,255);albedo[i+1]=clamp(g,0,255);albedo[i+2]=clamp(b,0,255);albedo[i+3]=255;
    rough[i]=rough[i+1]=rough[i+2]=clamp(s,32,254);rough[i+3]=255;height[j]=h;
  }
  const at=(x,y)=>height[((y+N)%N)*N+(x+N)%N];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const nx=(at(x-1,y)-at(x+1,y))*(wood?2.4:1.50),ny=(at(x,y-1)-at(x,y+1))*(wood?2.4:1.50),
      m=127/Math.hypot(nx,ny,1),i=4*(y*N+x);
    normals[i]=128+nx*m;normals[i+1]=128+ny*m;normals[i+2]=128+m;normals[i+3]=255;
  }
  const tex=(bytes,srgb=false)=>{
    const t=new T.DataTexture(bytes,N,N);t.name='Requisiten · '+kind+(srgb?' Albedo':' Datenspur');
    t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;
    t.generateMipmaps=true;t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;
    return t;
  };
  const out={map:tex(albedo,true),normalMap:tex(normals),roughnessMap:tex(rough)};
  swatches.set(kind,out);return out;
}

// Local wear is authored by the model's small edge/cavity mask. Broad faces
// keep a stable base colour. Inputs are in prop space, not screen space.
export function handledFinish(material,kind,wear){
  material.customProgramCacheKey=()=>'erl-requisite-v3:'+kind+':'+wear;
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec2 propFinish; varying vec2 pFinish; varying vec3 pLocal;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\npFinish=propFinish; pLocal=position;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>',`#include <common>
        varying vec2 pFinish; varying vec3 pLocal;
        float propHash(vec3 p){
          p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);
        }
      `)
      .replace('#include <color_fragment>',`#include <color_fragment>
        float tileW=max(length(dFdx(pLocal)),length(dFdy(pLocal)));
        vec3 scratchUV=pLocal*vec3(180.,175.,32.);
        float arc=fract(scratchUV.y+(.11*sin(scratchUV.z*3.))+.4*scratchUV.x);
        float lines=1.-smoothstep(.036,.115,abs(arc-.5));
        float trail=smoothstep(.82,.97,propHash(floor(scratchUV)));
        float scuff=lines*trail*(1.-smoothstep(.0005,.006,tileW));
        float ageNoise=.5+.5*sin(pLocal.z*117.+sin(pLocal.y*66.+pLocal.x*48.)*1.29);
        float large=.5+.5*sin(pLocal.z*39.+sin(pLocal.y*29.+pLocal.x*56.));
        float edgeRub=pFinish.x*smoothstep(.23,.79,ageNoise*.61+large*.39);
        float stain=pFinish.y*smoothstep(.25,.88,large);
        ${kind==='wood'?`
          float wrist=1.-smoothstep(.033,.082,abs(pLocal.z-.058));
          float panel=wrist*smoothstep(.088,.36,pLocal.y*-3.1)
            *smoothstep(.028,.047,abs(pLocal.x));
          panel*=1.-smoothstep(.021,.039,abs(pLocal.z-.058)+abs(pLocal.y+.112)*.39);
          float detail=1.-smoothstep(.001,.005,tileW);
          vec2 diamond=fract(vec2(pLocal.y+pLocal.z,pLocal.y-pLocal.z)*166.);
          float cut=smoothstep(.22,.47,abs(diamond.x-.5))+smoothstep(.22,.47,abs(diamond.y-.5));
          diffuseColor.rgb*=1.-.27*panel-.24*panel*cut*detail;
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.21,1.16,1.09)+vec3(.014,.009,.005),
            clamp(.34*edgeRub+.52*panel*(1.-cut)*detail+.48*scuff,0.,.52));
        `:`
          float damage=clamp((edgeRub*.77+scuff*.72)*${wear.toFixed(2)},0.,.73);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.34+vec3(.110,.117,.120),damage);
        `}
        diffuseColor.rgb*=1.-.28*stain;
      `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+(stain*.10)-(edgeRub*.16+scuff*.077)*${wear.toFixed(2)},.24,.98);
      `).replace('#include <aomap_fragment>',`#include <aomap_fragment>
        float localContact=1.-.40*pFinish.y;
        reflectedLight.indirectDiffuse*=localContact;
        reflectedLight.indirectSpecular*=localContact;
      `);
    if(kind==='wood')shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 propX=dFdx(-vViewPosition),propY=dFdy(-vViewPosition);
      vec3 propS=cross(propY,normal),propT=cross(normal,propX);
      float propDet=dot(propX,propS),propH=panel*cut*detail;
      normal=normalize(max(abs(propDet),.000000001)*normal +
        sign(propDet)*.00037*(dFdx(propH)*propS+dFdy(propH)*propT));
    `);
  };
  return material;
}

export function coatSleeve(T){
  const g=new T.CapsuleGeometry(.5,1,8,26),v=g.attributes.position;
  for(let i=0;i<v.count;i++){
    const y=v.getY(i),x=v.getX(i),z=v.getZ(i),a=Math.atan2(x,z),l=taper(.55,.89,Math.abs(y));
    const crease=(.023*Math.cos(y*21.+a*2.9)+.015*Math.sin(y*32.-a*2.2))*.67
      +.015*Math.cos(a*5.6+y*.9);
    v.setXYZ(i,x*(1+crease-l*.034)+.049*Math.sin(y*1.7),y,z*(1+crease-l*.064));
  }
  g.computeVertexNormals();return g;
}
