import {randomSource} from './surface-detail.js';

// Metres. Both layers are opaque instanced ribbons, never shadows casters
// or raycast targets. The cap also bounds submitted geometry off camera.
const STEP=.395,CELL=6.5;
export const TURF_LOD={
  base:{fade:10.2,end:19.8,max:3600,blades:6,trianglesPerBlade:1},
  fine:{fade:6.4,end:10.9,max:1000,blades:5,trianglesPerBlade:3}
};
export const TURF_TRIANGLE_CAP=Object.values(TURF_LOD)
  .reduce((sum,{max,blades,trianglesPerBlade})=>sum+max*blades*trianglesPerBlade,0);

function bladeGeometry(T,lod,seed){
  const p=[],norm=[],color=[],index=[],rng=randomSource(seed);
  for(let i=0;i<lod.blades;i++){
    const m=lod.trianglesPerBlade===3,a=i*2.39996+rng()*.52,c=Math.cos(a),s=Math.sin(a),
      r=.031+rng()*(m?.128:.179);
    const x=c*r,z=s*r,h=(m?.055:.042)+rng()*(m?.056:.047),
      w=(.0047+rng()*.0035)*(i===0?1.08:1);
    const bx=c*(.017+rng()*.039)+.014,bz=s*(.019+rng()*.046)+.009;
    // Thin folded ribbon, slightly wider through its lower third.
    const X=-s*w,Z=c*w,offset=p.length/3;
    const rows=m?[[x-X,0,z-Z],[x+X,0,z+Z],
      [x+X*.69+bx*.30,h*.53,z+Z*.69+bz*.30],[x-X*.72+bx*.27,h*.50,z-Z*.72+bz*.27],[x+bx,h,z+bz]]:
      [[x-X,0,z-Z],[x+X,0,z+Z],[x+bx,h,z+bz]];
    const tone=.88+rng()*.23;
    for(const [j,row] of rows.entries()){
      p.push(...row);
      const last=j===rows.length-1;
      norm.push(bx*(last?6:3)+(j===1?.09:-.05)*s,.92,bz*(last?6:3)+(j===1?-.09:.05)*c);
      const v=tone*(last?1.21:j===0?.72:j===1?.84:1.03);
      color.push(v*(last?1.071:1),v,v*(last?.85:1.02));
    }
    const idx=m?[0,1,2,0,2,3,3,2,4]:[0,1,2];
    for(const j of idx)index.push(offset+j);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
  g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(index);return g;
}
function grassMaterial(T,{fade,end}){
  const m=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true});
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
       vec2 turfOffset=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xz-cameraPosition.xz;
       float growth=1.-smoothstep(${(fade**2).toFixed(4)},${(end**2).toFixed(4)},dot(turfOffset,turfOffset));
       transformed.y*=growth;
       transformed.xz*=smoothstep(0.,.69,growth);
    `);
    // Treat both sides as upward-facing vegetation for diffuse lighting.
    // Flipping this authored normal down on back faces caused dark spikes.
    sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>',
      T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));
  };
  m.customProgramCacheKey=()=>`park-turf-2-${fade}-${end}`;
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
  const tints=[0x597335,0x637b3e,0x596f37,0x698248,0x73824a,0x557241,0x6b7943,0x627741].map(c=>new T.Color(c));
  for(let row=0,z=-256;z<=-17;z+=STEP,row++)for(let x=-75;x<=75;x+=STEP){
    const a=x+(row%2)*.5*STEP+(seed()-.5)*STEP*.88,b=z+(seed()-.5)*STEP*.92,kind=seed()<.48?0:1;
    if(seed()>coverage(a,b))continue;
    const key=id(a,b);
    if(rootGrid.get(key)?.some(t=>(a-t.x)**2+(b-t.z)**2<t.r**2))continue;
    const bins=grids[kind];
    if(!bins.has(key))bins.set(key,{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,plants:[]});
    const bin=bins.get(key);
    bin.minX=Math.min(a,bin.minX);bin.maxX=Math.max(a,bin.maxX);bin.minZ=Math.min(b,bin.minZ);bin.maxZ=Math.max(b,bin.maxZ);
    const formal=(Math.abs(a)<32&&b>-74)||(a< -35&&a> -65&&b>-85&&b< -26);
    bin.plants.push({
      x:a,z:b,y:height(a,b)-.006,w:.81+seed()*.53,
      h:(formal?.62:.70)+seed()*(formal?.32:.48),
      yaw:(seed()<.66?(Math.floor((a+b*.045)/4.85)&1)*Math.PI:seed()*Math.PI*2)+(seed()-.5)*1.43,
      col:tints[Math.floor(seed()*tints.length)]
    });
  }
  const pose=new T.Object3D(),layers=Object.entries(TURF_LOD).map(([name,lod],j)=>{
    const g=bladeGeometry(T,lod,142891+j*31),material=grassMaterial(T,lod);
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
    return {bins,lod,visible:[],candidates:[]};
  });
  let lastX=Infinity,lastZ=Infinity;
  return p=>{
    if(Math.abs(p.x-lastX)+Math.abs(p.z-lastZ)<.38)return;
    lastX=p.x;lastZ=p.z;
    for(const {bins,lod,visible,candidates} of layers){
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
