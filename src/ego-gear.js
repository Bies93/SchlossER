import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {handledFinish,weaponSwatch} from './weapon-finishes.js';
import {buildWeapon} from './ego-weapon-models.js';

function finish(T,color,roughness,metalness,maps={},strength=.33){
  const m=new T.MeshStandardMaterial({color,roughness,metalness,...maps});
  m.normalScale.setScalar(strength);return m;
}

export function makeEquipment(T,specs){
  const F=(color,rough,metal,kind,normal,wear=0,occlusion=0)=>{
    const m=finish(T,color,rough,metal,kind?weaponSwatch(T,kind):{},normal);
    if(wear||occlusion){handledFinish(m,kind==='walnut'?'wood':kind,wear);m.userData.occlusion=occlusion;}
    m.userData.longGrain=kind==='walnut';
    return m;
  };
  const m={
    coat:F(0x4c5351,.83,.55,'phosphate',1.14,.72,.08),
    blue:F(0x434d53,.77,.73,'blue',.97,.68,.07),
    raw:F(0x9b9e97,.76,.83,'machine',1.04,.26,.04),
    recess:F(0x2f3231,.91,.11,'polymer',.93,.12,.63),
    polymer:F(0x61624f,.93,.035,'polymer',1.24,.24,.10),
    carbon:F(0x44474a,.87,.047,'composite',1.02,.22,.14),
    rubber:F(0x323433,.99,0,'rubber',1.09,.08,.12),
    wood:F(0xc6b8a9,.94,0,'walnut',1.08,.70,.10),
    darkWood:F(0xae9f8e,.96,0,'walnut',.94,.62,.16),
    brass:F(0xae925e,.72,.68,'machine',.88,.29,.06),
    enamel:F(0xb0a36d,.93,0,'polymer',.69),
    string:F(0xa0978b,.99,0,'twill',.54),vane:F(0x934d37,.89,0,'rubber',.63),
    glass:F(0x223736,.34,.38,null,0)
  };
  const profileMatrix=new T.Matrix4().makeRotationY(Math.PI*.5),mx=new T.Matrix4(),
    q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),s=new T.Vector3();
  const boxes=new Map(),round=new T.CylinderGeometry(1,1,1,14);
  function assembly(name){
    const root=new T.Group(),bins=new Map();root.name=name;
    function add(base,material,at=[0,0,0],scale=[1,1,1],rotation=[0,0,0],attrs={}){
      const g=base.index?base.toNonIndexed():base.clone();g.clearGroups();
      q.setFromEuler(e.set(...rotation));g.applyMatrix4(mx.compose(v.fromArray(at),q,s.fromArray(scale)));
      const p=g.attributes.position,n=g.attributes.normal;
      const uv=g.attributes.uv??new T.BufferAttribute(new Float32Array(p.count*2),2),mask=new Float32Array(p.count*2);
      g.setAttribute('uv',uv);
      for(let i=0;i<p.count;i+=3){
        const x=Math.abs(n.getX(i)+n.getX(i+1)+n.getX(i+2)),
          y=Math.abs(n.getY(i)+n.getY(i+1)+n.getY(i+2)),z=Math.abs(n.getZ(i)+n.getZ(i+1)+n.getZ(i+2));
        const face=x>=y&&x>=z?0:y>=z?1:2;
        for(let k=i;k<i+3;k++){
          const a=p.getX(k),b=p.getY(k),d=p.getZ(k);
          if(!attrs.uv){
            if(material.userData.longGrain)uv.setXY(k,(face===2?a:d)/.71,(face===0?b:face===1?a:b)/.18);
            else uv.setXY(k,(face===2?a:d)/.131,(face===1?a:b)/.107);
          }
          const ax=Math.abs(n.getX(k)),ay=Math.abs(n.getY(k)),az=Math.abs(n.getZ(k)),
            ratio=1-Math.max(ax,ay,az),diagonal=Math.max(0,Math.min(1,(ratio-.034)*4.72));
          mask[2*k]=attrs.wear===undefined?diagonal:diagonal*attrs.wear;
          mask[2*k+1]=Math.min(1,(material.userData.occlusion??0)+(attrs.contact??0)+(.13*diagonal*(b<-.038?1:0)));
        }
      }
      g.setAttribute('propFinish',new T.BufferAttribute(mask,2));
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
    function profile(mat,points,width,x=0,b=.003,holes=[],attrs={}){
      const shape=poly(points);for(const outline of holes)shape.holes.push(poly(outline));
      const g=new T.ExtrudeGeometry(shape,{depth:width-2*b,bevelEnabled:b>0,bevelSegments:b>.003?2:1,
        bevelThickness:b,bevelSize:b,steps:1,curveSegments:6});
      g.translate(0,0,-(width-2*b)*.5);g.applyMatrix4(profileMatrix);use(g,mat,[x,0,0],[1,1,1],[0,0,0],attrs);
    }
    function plan(mat,points,width,y,b=.002){
      const shape=poly(points,(a,z)=>[a,-z]);
      const g=new T.ExtrudeGeometry(shape,{depth:width-2*b,bevelEnabled:b>0,bevelSegments:2,bevelThickness:b,bevelSize:b,steps:1});
      g.translate(0,0,-(width-2*b)*.5);g.rotateX(-Math.PI*.5);use(g,mat,[0,y,0]);
    }
    function cyl(mat,p,r,length,axis='z'){
      add(round,mat,p,[r,length,r],axis==='x'?[0,0,-Math.PI*.5]:axis==='y'?[0,0,0]:[Math.PI*.5,0,0]);
    }
    function sculpt(mat,slices,{power=.66,side=.0,chamfer=.02,openStart=false,openEnd=false}={}){
      // A smooth single volume, with independent stock shoulders along Z.
      // Longitudinal UVs wrap continuously over the visible side and comb.
      const step=32,p=[],u=[],f=[];
      function ring(z,hi,lo,w){
        for(let i=0;i<=step;i++){
          const a=(i/step-.25)*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a),t=(1+Math.sign(sn)*Math.abs(sn)**power)*.5;
          const x=Math.sign(cs)*Math.abs(cs)**power*w*(1-side*(1-t));
          p.push(x,lo+(hi-lo)*t,z);u.push(z/.71,i/step*(2*w+hi-lo)/.15);
        }
      }
      slices.forEach(s=>ring(...s));
      for(let j=0;j<slices.length-1;j++)for(let i=0;i<step;i++){
        const a=j*(step+1)+i,b=a+step+1;f.push(a,a+1,b,a+1,b+1,b);
      }
      // Weld the side normals across its UV seam, then cap separately.
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));
      geo.setAttribute('uv',new T.Float32BufferAttribute(u,2));geo.setIndex(f);geo.computeVertexNormals();
      const n=geo.attributes.normal;
      for(let j=0;j<slices.length;j++){
        const a=j*(step+1),b=a+step;
        v.set(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();
        n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);
      }
      use(geo,mat,[0,0,0],[1,1,1],[0,0,0],{uv:true,wear:.54});
      const caps=[],capUvs=[],ix=[];
      for(const [j,s] of [[0,slices[0]],[1,slices.at(-1)]]){
        if(j?openEnd:openStart)continue;
        const start=caps.length/3,i0=(j?(slices.length-1)*(step+1):0)*3;
        for(let i=0;i<step;i++){
          const a=i0+i*3,x=p[a],y=p[a+1];caps.push(x,y,p[a+2]);
          capUvs.push(x/.18,y/.18);
        }
        caps.push(0,(s[1]+s[2])*.5,s[0]);capUvs.push(0,0);
        for(let i=0;i<step;i++){
          const a=start+i,b=start+(i+1)%step;
          ix.push(...(j?[start+step,a,b]:[start+step,b,a]));
        }
      }
      if(!ix.length)return;
      const ends=new T.BufferGeometry();
      ends.setAttribute('position',new T.Float32BufferAttribute(caps,3));ends.setAttribute('uv',new T.Float32BufferAttribute(capUvs,2));
      ends.setIndex(ix);ends.computeVertexNormals();
      use(ends,mat,[0,0,0],[1,1,1],[0,0,0],{uv:true,contact:chamfer});
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
    return {root,add,box,profile,plan,cyl,sculpt,turned,bezel,bolt,stamp,build};
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
