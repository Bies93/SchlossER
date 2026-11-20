// A tileable packed grain field; no projected photographs, environment captures,
// extra lights or texture fetches from the network. Coordinates below are metres.
function grainMap(T){
 const n=256,bytes=new Uint8Array(n*n*4);
 const hash=(x,y)=>{let a=Math.imul(x+1201,1597334677)^Math.imul(y+371,3812015801);a=Math.imul(a^(a>>>16),2246822519);return ((a^(a>>>13))>>>0)/4294967296;};
 const field=(x,y,f)=>{
   const u=x*f/n,v=y*f/n,i=Math.floor(u),j=Math.floor(v),s=u-i,t=v-j;
   const l=s*s*(3-2*s),m=t*t*(3-2*t),h=(a,b)=>hash(a%f,b%f);
   return (h(i,j)*(1-l)+h(i+1,j)*l)*(1-m)+(h(i,j+1)*(1-l)+h(i+1,j+1)*l)*m;
 };
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const p=(i+j*n)*4;
   bytes[p]=255*(field(i,j,4)*.62+field(i,j,12)*.38);bytes[p+1]=255*field(i,j,38);
   bytes[p+2]=255*hash(i,j);bytes[p+3]=255;
 }
 const map=new T.DataTexture(bytes,n,n);map.wrapS=map.wrapT=T.RepeatWrapping;
 map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}
export function pauliMaterials(T,time,wash){
 const noise=grainMap(T),mats={};
 for(const [key,tint,rough,metal] of [
   ['granite',0x8b8981,.80,0],['carving',0xb9ae96,.82,0],
   ['bronze',0x373f3d,.49,.67],['worn',0x52615a,.44,.58],['joint',0x696961,.94,0],
   ['dark',0x282b25,.85,.15],['water',0x435449,.25,.12],['jet',0xadc3c2,.19,.09]
 ]){
   const water=key==='water',jet=key==='jet',stone=key==='granite'||key==='carving',bronze=key==='bronze'||key==='worn';
   const mat=mats[key]=new T.MeshStandardMaterial({name:'Pauli · '+key,color:tint,roughness:rough,metalness:metal});
   if(jet){mat.transparent=true;mat.opacity=.61;mat.depthWrite=false;}
   if(!stone&&!bronze&&!water&&!jet)continue;
   mat.onBeforeCompile=sh=>{
     sh.uniforms.pauliGrain={value:noise};sh.uniforms.pauliTime=time;sh.uniforms.pauliWash=wash;
     sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 pauliP;').replace('#include <begin_vertex>','#include <begin_vertex>\npauliP=position;');
     sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
       varying vec3 pauliP;uniform sampler2D pauliGrain;uniform float pauliTime,pauliWash;
       vec2 pauliLamp(vec3 loc,vec3 N,vec3 V){
         vec3 toLamp=loc-pauliP;float d=max(.12,length(toLamp));vec3 L=toLamp/d;
         float cone=smoothstep(.69,.92,dot(-L,normalize(vec3(0.,2.6,0.)-loc)));
         float intensity=cone*pauliWash/(1.+d*d*.102);
         return intensity*vec2(max(0.,dot(N,L)),pow(max(0.,dot(normalize(V+L),N)),22.));
       }`);
     if(stone||bronze){
       sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
         vec3 f=pauliP;vec2 uv=vec2(f.x+.53*f.z,.88*f.y+.52*f.z);
         vec3 base=texture2D(pauliGrain,uv*.55).rgb;
         float streak=texture2D(pauliGrain,vec2((f.x+.81*f.z)*1.53,f.y*.16)).r;
         float pores=texture2D(pauliGrain,uv*1.90).b-.5;
         float wetBand=(1.-smoothstep(.014,.146,abs(f.y-1.19)))*(1.-smoothstep(.07,.28,abs(length(f.xz)-2.86)));
         float wet=clamp(wetBand*.75+smoothstep(.58,.79,streak)*(.30+.17*base.r),0.,1.);
         ${stone?`float speck=base.g-.5;
           diffuseColor.rgb*=.78+base.r*.37+speck*.24+pores*${key==='granite'?'.60':'.18'};
           diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.55,.61,.52),wet);
           float lime=smoothstep(.62,.81,base.r)*smoothstep(.36,.60,streak);
           float underLip=1.-smoothstep(.015,.145,abs(f.y-.829));
           float drips=smoothstep(.43,.76,streak)*(.44+.56*base.g);
           diffuseColor.rgb*=1.-(underLip*.37+.10)*drips;
           diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.53,.47),lime*.15);`:
         `float verd=smoothstep(.47,.74,streak*.5+base.r*.35+base.g*.15);
           float high=smoothstep(.64,.83,base.g);
           diffuseColor.rgb=mix(diffuseColor.rgb*(.77+.38*base.r),vec3(.083,.169,.141),verd*.85);
           diffuseColor.rgb+=vec3(.019,.014,.007)*high;`}`)
       .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+.13*(base.g-.5)-wet*${stone?'.22':'.07'},.24,.97);`);
     }else if(water){
       sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
         float depth=1.-smoothstep(2.35,2.86,length(pauliP.xz));
         float silt=texture2D(pauliGrain,pauliP.xz*.48).r;
         diffuseColor.rgb*=.71+.31*silt+.15*(1.-depth);`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
         vec2 p=pauliP.xz;
         vec2 q=abs(p)-vec2(1.807);float d=length(q);
         vec2 w=.028*cos(dot(p,vec2(5.,3.))+pauliTime*1.26)*vec2(.86,.51)
               +.033*cos(dot(p,vec2(-3.,9.))-pauliTime*.86)*vec2(-.32,.95)
               +.12*cos(d*36.-pauliTime*6.6)*exp(-d*3.3)*(q/max(.05,d))*sign(p);
         normal=normalize(mat3(viewMatrix)*vec3(w.x,1.,w.y));`);
     }else{
       sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
         float drops=sin(pauliP.y*63.+pauliTime*19.+length(pauliP.xz)*14.);
         diffuseColor.a*=.72+.26*drops;diffuseColor.rgb*=1.+.14*drops;`);
     }
     if(stone||bronze||water){
       sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',`
         vec3 pn=inverseTransformDirection(normal,viewMatrix),pv=inverseTransformDirection(normalize(vViewPosition),viewMatrix);
         vec2 localWash=pauliLamp(vec3(-3.55,.035,2.96),pn,pv)+pauliLamp(vec3(3.55,.035,-2.96),pn,pv);
         outgoingLight+=vec3(1.,.78,.53)*(diffuseColor.rgb*localWash.x*1.54+localWash.y*${bronze?'.32':water?'.21':'.034'});
         #include <opaque_fragment>`);
     }
   };
   mat.customProgramCacheKey=()=>'pauli-v1-'+key;
 }
 return mats;
}
