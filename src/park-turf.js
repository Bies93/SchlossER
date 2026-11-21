import {randomSource} from './surface-detail.js';

// One independent cover layer (four tris per patch), plus folded leaves up close.
// Only the near layer pays for individual blade geometry. Neither casts shadows.
const STEP=.31,CELL=7.5;
export const TURF_PROFILES={
  fast:{base:{fade:8,end:16,max:6400},fine:{fade:3.6,end:6.2,max:440}},
  normal:{base:{fade:12,end:20,max:11600},fine:{fade:5.0,end:8.4,max:780}},
  high:{base:{fade:15,end:24,max:16600},fine:{fade:6.5,end:10.4,max:1220}}
};
const BLADES=7;
export const turfTriangleCap=({base,fine})=>base.max*4+fine.max*BLADES*3;

function coverTexture(T){
  const w=256,h=96,pixels=new Uint8Array(w*h*4),rng=randomSource(8041);
  // RGB dilation avoids dark edges when the cutouts are minified.
  for(let i=0;i<pixels.length;i+=4)pixels.set([92,113,53],i);
  for(let j=0;j<2;j++)for(let i=0;i<20;i++){
    const x=18+(i+rng()*.87)*10.6+(j-.5)*5.3,base=rng()*3.0;
    const H=(23+rng()*62)*(j===1?1:.89),W=.77+rng()*1.48,lean=(rng()-.5)*(13+H*.53);
    const warm=rng(),tone=rng();
    for(let y=Math.ceil(base);y<base+H;y++){
      const q=(y-base)/H,c=x+lean*q*q+(j-.5)*2*q;
      const wid=W*Math.pow(1-q,.72)*(.48+.73*Math.min(1,q*5));
      for(let u=Math.max(0,Math.floor(c-wid-1));u<=Math.min(w-1,Math.ceil(c+wid+1));u++){
        const a=Math.max(0,Math.min(1,wid+.55-Math.abs(u-c)));
        if(!a)continue;
        const idx=(y*w+u)*4,alpha=pixels[idx+3]/255,out=a+alpha*(1-a);
        const rib=(1-Math.min(1,Math.abs(u-c)/Math.max(.9,wid)))*5;
        const l=26*q+16*tone+rib-7*(1-q)**4;
        const rgb=[89+l+warm*17,110+l*.94+warm*10,51+l*.58+warm*12];
        for(let k=0;k<3;k++)pixels[idx+k]=(rgb[k]*a+pixels[idx+k]*alpha*(1-a))/out;
        pixels[idx+3]=out*255;
      }
    }
  }
  const map=new T.DataTexture(pixels,w,h);
  map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=true;
  map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.needsUpdate=true;
  return map;
}

function coverGeometry(T){
  const p=[],normal=[],uv=[],idx=[];
  for(const a of [0,Math.PI*.48]){
    const c=Math.cos(a),s=Math.sin(a),offset=p.length/3;
    for(const [x,y] of [[-1,0],[1,0],[1,1],[-1,1]]){
      p.push(c*x*.235-s*y*.038,y*.146,s*x*.235+c*y*.038);
      normal.push(-s*.14,1,c*.14);uv.push((x+1)*.5,y);
    }
    idx.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;
}

function bladeGeometry(T,seed){
  const p=[],norm=[],color=[],index=[],rng=randomSource(seed);
  for(let i=0;i<BLADES;i++){
    const a=i*2.39996+rng()*.52,c=Math.cos(a),s=Math.sin(a),r=.024+rng()*.158;
    const x=c*r,z=s*r,h=.067+rng()*.064,w=.004+rng()*.0037;
    const bx=c*(.017+rng()*.039)+.014,bz=s*(.019+rng()*.046)+.009;
    // Thin folded ribbon, slightly wider through its lower third.
    const X=-s*w,Z=c*w,offset=p.length/3;
    const rows=[[x-X,0,z-Z],[x+X,0,z+Z],
      [x+X*.69+bx*.30,h*.53,z+Z*.69+bz*.30],[x-X*.72+bx*.27,h*.50,z-Z*.72+bz*.27],[x+bx,h,z+bz]];
    const tone=.88+rng()*.23;
    for(const [j,row] of rows.entries()){
      p.push(...row);
      const last=j===rows.length-1;
      norm.push(bx*(last?6:3)+(j===1?.09:-.05)*s,.92,bz*(last?6:3)+(j===1?-.09:.05)*c);
      const v=tone*(last?1.21:j===0?.72:j===1?.84:1.03);
      color.push(v*(last?1.071:1),v,v*(last?.85:1.02));
    }
    for(const j of [0,1,2,0,2,3,3,2,4])index.push(offset+j);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
  g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(index);return g;
}
function grassMaterial(T,map,range){
  const m=new T.MeshLambertMaterial({
    side:T.DoubleSide,map,color:map?0xffffff:0x778e4c,vertexColors:!map,alphaTest:map?.37:0
  });
  m.onBeforeCompile=sh=>{
    sh.uniforms.erlTurfRange=range;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 erlTurfRange;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
       vec2 turfOffset=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xz-cameraPosition.xz;
       float growth=1.-smoothstep(erlTurfRange.x,erlTurfRange.y,dot(turfOffset,turfOffset));
       transformed.y*=growth;
       transformed.xz*=smoothstep(0.,${map?'.30':'.66'},growth);
    `);
    // Treat both sides as upward-facing vegetation for diffuse lighting.
    // Flipping this authored normal down on back faces caused dark spikes.
    sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>',
      T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));
  };
  m.customProgramCacheKey=()=>map?'park-turf-cover-v1':'park-turf-blades-v3';
  return m;
}
export const turfBoxDist=(b,x,z)=>{
  const a=Math.max(b.minX-x,0,x-b.maxX),c=Math.max(b.minZ-z,0,z-b.maxZ);
  return a*a+c*c;
};
export function plantParkTurf(T,parent,coverage,height,roots){
  const root=new T.Group();root.name='Schlossrasen · kurze Halme und Nahdetail';parent.add(root);
  const seed=randomSource(322548),grids=[new Map(),new Map()],rootGrid=new Map();
  const id=(x,z)=>Math.floor(x/CELL)+':'+Math.floor(z/CELL);
  for(const t of roots){
    for(let z=Math.floor((t.z-t.r)/CELL);z<=Math.floor((t.z+t.r)/CELL);z++)
      for(let x=Math.floor((t.x-t.r)/CELL);x<=Math.floor((t.x+t.r)/CELL);x++){
        const key=x+':'+z;
        if(!rootGrid.has(key))rootGrid.set(key,[]);
        rootGrid.get(key).push(t);
      }
  }
  const tints=[0xf4fbdc,0xfff7dc,0xf0f9e2,0xfaf7e3,0xe9f0d5,0xe9f6e0,0xfffadf].map(c=>new T.Color(c));
  function add(bins,key,p){
    if(!bins.has(key))bins.set(key,{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,plants:[]});
    const bin=bins.get(key);
    bin.minX=Math.min(p.x,bin.minX);bin.maxX=Math.max(p.x,bin.maxX);
    bin.minZ=Math.min(p.z,bin.minZ);bin.maxZ=Math.max(p.z,bin.maxZ);bin.plants.push(p);
  }
  for(let row=0,z=-256;z<=-17;z+=STEP,row++)for(let x=-75;x<=75;x+=STEP){
    const a=x+(row%2)*.5*STEP+(seed()-.5)*STEP*.65,b=z+(seed()-.5)*STEP*.69;
    if(seed()>coverage(a,b))continue;
    const key=id(a,b);
    if(rootGrid.get(key)?.some(t=>(a-t.x)**2+(b-t.z)**2<t.r**2))continue;
    const formal=(Math.abs(a)<32&&b>-74)||(a< -35&&a> -65&&b>-85&&b< -26);
    const p={
      x:a,z:b,y:height(a,b)-.008,w:.77+seed()*.46,
      h:(formal?.56:.64)+seed()*(formal?.38:.48),
      yaw:(seed()<.66?(Math.floor((a+b*.045)/4.85)&1)*Math.PI:seed()*Math.PI*2)+(seed()-.5)*1.43,
      col:tints[Math.floor(seed()*tints.length)]
    };
    add(grids[0],key,p);
    if(seed()<.46)add(grids[1],key,{...p,yaw:p.yaw+1.53,h:p.h*1.06});
  }
  const pose=new T.Object3D(),layers=['base','fine'].map((name,j)=>{
    const range={value:new T.Vector2()},g=j?bladeGeometry(T,142891):coverGeometry(T),
      material=grassMaterial(T,j?null:coverTexture(T),range);
    const bins=Array.from(grids[j].values(),bin=>{
      const n=bin.plants.length,mesh=new T.InstancedMesh(g,material,n);
      mesh.name=j?'Rasen · dichtes Nahdetail':'Rasen · Grundhalme';
      mesh.receiveShadow=true;mesh.userData.noSceneQuery=true;
      bin.plants.forEach((p,i)=>{
        pose.position.set(p.x,p.y,p.z);pose.rotation.y=p.yaw;pose.scale.set(p.w,p.h,p.w);pose.updateMatrix();
        mesh.setMatrixAt(i,pose.matrix);mesh.setColorAt(i,p.col);
      });
      mesh.computeBoundingSphere();mesh.visible=false;root.add(mesh);
      const {minX,maxX,minZ,maxZ}=bin;
      return {n,mesh,minX,maxX,minZ,maxZ,dist:0};
    });
    return {bins,name,range,visible:[],candidates:[]};
  });
  let lastX=Infinity,lastZ=Infinity,lastQuality;
  return (p,quality='normal')=>{
    const profile=TURF_PROFILES[quality]??TURF_PROFILES.normal;
    if(lastQuality===profile&&Math.abs(p.x-lastX)+Math.abs(p.z-lastZ)<.38)return;
    lastQuality=profile;
    lastX=p.x;lastZ=p.z;
    for(const {bins,name,range,visible,candidates} of layers){
      const lod=profile[name];range.value.set(lod.fade**2,lod.end**2);
      for(const b of visible)b.mesh.visible=false;
      visible.length=candidates.length=0;
      for(const b of bins){
        b.dist=turfBoxDist(b,p.x,p.z);
        // pad for shader movement and the batched .38 m CPU update interval
        if(b.dist<=(lod.end+.50)**2)candidates.push(b);
      }
      candidates.sort((a,b)=>a.dist-b.dist);
      let remaining=lod.max;
      for(const b of candidates){
        if(remaining<=0)break;
        b.mesh.count=Math.min(remaining,b.n);b.mesh.visible=true;
        remaining-=b.mesh.count;visible.push(b);
      }
    }
  };
}
