import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomSource,sharedSet} from './surface-detail.js';
import {buildWeapon} from './ego-weapon-models.js';

// Shared PBR finishes; no external assets, extra lights or mechanics under the shells.
function finishMaps(T,kind){
  const N=128,hash=randomSource(kind==='metal'?8927:7387);
  const noise=Float32Array.from({length:N*N},hash),row=Float32Array.from({length:N},hash);
  const height=new Float32Array(N*N),color=new Uint8Array(N*N*4),
    normal=new Uint8Array(color.length),rough=new Uint8Array(color.length);
  const at=(a,x,y)=>a[((y+N)%N)*N+(x+N)%N],metal=kind==='metal';
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=y*N+x,b=metal?(row[y]-.5)*.54:0,n=noise[i]-.5;
    const fine=.62*n+b,trace=Math.max(0,b-.221)*Math.max(0,Math.sin(x*.145+y*1.93))*2;
    height[i]=fine*.093+trace*.12;
    const a=metal?227+fine*19+trace*38:236+n*12,r=224+fine*36-trace*100;
    color.set([a,a,a,255],i*4);rough.set([r,r,r,255],i*4);
  }
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const nx=at(height,x-1,y)-at(height,x+1,y),ny=at(height,x,y-1)-at(height,x,y+1),s=127/Math.hypot(nx,ny,1);
    normal.set([128+nx*s,128+ny*s,128+s,255],4*(y*N+x));
  }
  const tex=(bytes,srgb=false)=>{
    const t=new T.DataTexture(bytes,N,N);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
    t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.anisotropy=4;
    t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;
  };
  return {map:tex(color,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}

function finish(T,color,roughness,metalness,maps={},strength=.33){
  const m=new T.MeshStandardMaterial({color,roughness,metalness,...maps});
  m.normalScale.setScalar(strength);return m;
}

export function makeEquipment(T,specs){
  const metal=finishMaps(T,'metal'),powder=finishMaps(T,'polymer'),grain=sharedSet(T,'fineOak',256),textile=sharedSet(T,'canvas',128);
  const F=(...a)=>finish(T,...a);
  const m={
    coat:F(0x444849,.68,.66,metal,.37), blue:F(0x30383d,.56,.70,metal,.29),
    raw:F(0x939591,.49,.67,metal,.39), recess:F(0x212423,.89,.14,powder,.22),
    polymer:F(0x515745,.86,.01,powder,.57), carbon:F(0x34383b,.80,.035,powder,.47),
    rubber:F(0x232629,.98,0,powder,.67), wood:F(0x926849,.76,0,grain,.62),
    darkWood:F(0x635044,.82,0,grain,.63), weave:F(0x777668,.96,0,textile,.50),
    brass:F(0xa4865a,.68,.52,metal,.27), enamel:F(0x9a8854,.86,0,powder,.16),
    string:F(0x908680,.92,0,textile,.17), vane:F(0x6f3930,.76,0,powder,.31),
    glass:F(0x182a2b,.29,.23)
  };
  m.wood.userData.longGrain=m.darkWood.userData.longGrain=true;
  const profileMatrix=new T.Matrix4().makeRotationY(Math.PI*.5),mx=new T.Matrix4(),
    q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),s=new T.Vector3();
  const boxes=new Map(),round=new T.CylinderGeometry(1,1,1,14);
  function assembly(name){
    const root=new T.Group(),bins=new Map();root.name=name;
    function add(base,material,at=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
      const g=base.index?base.toNonIndexed():base.clone();g.clearGroups();
      q.setFromEuler(e.set(...rotation));g.applyMatrix4(mx.compose(v.fromArray(at),q,s.fromArray(scale)));
      const p=g.attributes.position,n=g.attributes.normal;
      const uv=g.attributes.uv??new T.BufferAttribute(new Float32Array(p.count*2),2);
      g.setAttribute('uv',uv);
      for(let i=0;i<p.count;i+=3){
        const x=Math.abs(n.getX(i)+n.getX(i+1)+n.getX(i+2)),
          y=Math.abs(n.getY(i)+n.getY(i+1)+n.getY(i+2)),z=Math.abs(n.getZ(i)+n.getZ(i+1)+n.getZ(i+2));
        const face=x>=y&&x>=z?0:y>=z?1:2;
        for(let k=i;k<i+3;k++){
          const a=p.getX(k),b=p.getY(k),d=p.getZ(k);
          if(material.userData.longGrain)uv.setXY(k,(face===2?a:d)/.38,(face===0?b:face===1?a:b)/.24);
          else uv.setXY(k,(face===2?a:d)/.094,(face===1?a:b)/.082);
        }
      }
      if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);
    }
    function use(g,...args){add(g,...args);g.dispose();}
    function box(mat,p,d,b=.002,rot){
      const r=Math.min(b,...d.map(v=>v*.24)),k=[...d,r].join(':');
      if(!boxes.has(k))boxes.set(k,new RoundedBoxGeometry(...d,r>.004?2:1,r));
      add(boxes.get(k),mat,p,[1,1,1],rot);
    }
    function poly(points,f=(a,b)=>[-a,b]){
      const shape=new T.Shape();
      for(const [i,p] of points.entries())shape[i?'lineTo':'moveTo'](...f(...p));shape.closePath();return shape;
    }
    function profile(mat,points,width,x=0,b=.003,holes=[]){
      const shape=poly(points);for(const outline of holes)shape.holes.push(poly(outline));
      const g=new T.ExtrudeGeometry(shape,{depth:width-2*b,bevelEnabled:b>0,bevelSegments:b>.003?2:1,
        bevelThickness:b,bevelSize:b,steps:1,curveSegments:6});
      g.translate(0,0,-(width-2*b)*.5);g.applyMatrix4(profileMatrix);use(g,mat,[x,0,0]);
    }
    function plan(mat,points,width,y,b=.002){
      const shape=poly(points,(a,z)=>[a,-z]);
      const g=new T.ExtrudeGeometry(shape,{depth:width-2*b,bevelEnabled:b>0,bevelSegments:2,bevelThickness:b,bevelSize:b,steps:1});
      g.translate(0,0,-(width-2*b)*.5);g.rotateX(-Math.PI*.5);use(g,mat,[0,y,0]);
    }
    function cyl(mat,p,r,length,axis='z'){
      add(round,mat,p,[r,length,r],axis==='x'?[0,0,-Math.PI*.5]:axis==='y'?[0,0,0]:[Math.PI*.5,0,0]);
    }
    function turned(mat,outline,p,axis='z',scale=[1,1,1],segments=22){
      use(new T.LatheGeometry(outline.map(([r,z])=>new T.Vector2(r,z)),segments),mat,p,scale,
        axis==='x'?[0,0,-Math.PI*.5]:axis==='y'?[0,0,0]:[Math.PI*.5,0,0]);
    }
    function bezel(mat,p,outer,inner,width,axis='z'){
      const d=width*.5,c=Math.min(width*.16,(outer-inner)*.27);
      const g=new T.LatheGeometry([[inner,-d],[outer-c,-d],[outer,-d+c],[outer,d-c],[outer-c,d],[inner,d],[inner,-d]]
        .map(([a,b])=>new T.Vector2(a,b)),24);
      use(g,mat,p,[1,1,1],axis==='y'?[0,0,0]:[Math.PI*.5,0,0]);
    }
    function bolt(p,r,mat=m.raw,axis='x'){
      cyl(mat,p,r,.0032,axis);
      if(axis==='x'){
        const d=Math.sign(p[0])||1;box(m.recess,[p[0]+d*.00173,p[1],p[2]],[.00055,r*.26,r*1.35],.00014,[d*.37,0,0]);
      }
    }
    function stamp(code,x,y,z,w,h){
      const cv=document.createElement('canvas');cv.width=256;cv.height=64;const ctx=cv.getContext('2d');
      ctx.fillStyle='#bfb7a2';ctx.font='bold 27px monospace';ctx.fillText(code,12,34);
      ctx.fillRect(13,44,128,2);
      // Two authored abrasion clusters at the outer corners, not an overlay
      // of evenly distributed rust or dirt.
      ctx.fillStyle='#c5b78f7f';
      for(let i=0;i<7;i++){
        ctx.fillRect(201+i*4,44+(i*7)%10,5-i%3,1+i%2);
        if(i%2===0)ctx.fillRect(12+i*3,48+i*2,4,1);
      }
      const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
      const tag=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t,alphaTest:.30,roughness:.95,polygonOffset:true,
        polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
      tag.position.set(x,y,z);tag.rotation.y=Math.sign(x)*Math.PI*.5;root.add(tag);
    }
    function build(){
      for(const [mat,list] of bins){
        const mesh=new T.Mesh(mergeGeometries(list),mat);root.add(mesh);list.forEach(g=>g.dispose());
      }
      bins.clear();return root;
    }
    return {root,add,box,profile,plan,cyl,turned,bezel,bolt,stamp,build};
  }
  const bolt=assembly('Windbruch · Spielbolzen');
  bolt.turned(m.carbon,[[0,-.151],[.0052,-.151],[.0054,.115],[0,.115]],[0,0,0],'z',[1,1,1],12);
  bolt.turned(m.raw,[[0,-.158],[.005,-.146],[.0092,-.137],[.0073,-.125],[.005,-.120],[0,-.120]],[0,0,0],'z',[1,1,1],12);
  for(let i=0;i<3;i++){
    const f=assembly('Feder');f.profile(i===0?m.enamel:m.vane,[[.048,.0044],[.084,.016],[.121,.017],[.126,.0044]],.0018,0,.00035);
    const feather=f.build().children[0];feather.rotation.z=i*Math.PI*2/3;feather.updateMatrix();
    const g=feather.geometry.clone().applyMatrix4(feather.matrix);
    bolt.add(g,feather.material);g.dispose();feather.geometry.dispose();
  }
  bolt.cyl(m.brass,[0,0,.129],.0055,.023);
  const boltMesh=bolt.build();
  const devices=specs.map(spec=>buildWeapon(T,spec,assembly,m,boltMesh));
  for(const g of boxes.values())g.dispose();round.dispose();
  return {devices,bolt:boltMesh};
}
