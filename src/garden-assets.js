import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {repeatSet,randomSource} from './surface-detail.js';
import {BENCH_ROW} from './world-layout.js';

export const BED_WIDTH=1.58;
const arcPoint=a=>({x:16.55*Math.cos(a),z:-47+11.28*Math.sin(a)});
export const BED_ARCS=[.15,Math.PI+.15].map(a=>
  Array.from({length:96},(_,i)=>arcPoint(a+(Math.PI-.30)*i/95)));
const bedEdges=BED_ARCS.flatMap(arc=>arc.slice(1).map((b,i)=>{
  const a=arc[i],dx=b.x-a.x,dz=b.z-a.z;
  return [a.x,a.z,dx,dz,1/(dx*dx+dz*dz)];
}));
export function atBed(x,z,padding=.0){
  if(Math.abs(x)>19||Math.abs(z+47)>14)return false;
  for(const [a,b,dx,dz,inv] of bedEdges){
    const u=x-a,v=z-b,t=Math.max(0,Math.min(1,(u*dx+v*dz)*inv));
    if(Math.hypot(u-t*dx,v-t*dz)<BED_WIDTH*.5+padding)return true;
  }
  return false;
}

export function addBeds(T,root,height){
  const green=new T.MeshLambertMaterial({color:0x657443,side:T.DoubleSide,vertexColors:true});
  const petals=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide,vertexColors:true});
  const rng=randomSource(292817),stem=[],flower=[],stemColor=[],flowerColor=[];
  function tri(out,colors,a,b,c,t){
    out.push(...a,...b,...c);for(const k of t)colors.push(k,k,k);
  }
  for(let j=0;j<4;j++){
    const a=j*2.4,ux=Math.cos(a),uz=Math.sin(a),y=.039+j*.038,l=.118+j*.013;
    const start=[ux*.012,y,uz*.012],tip=[ux*l,y+.045,uz*l],mid=[ux*l*.52,y+.031,uz*l*.52];
    const left=[mid[0]-uz*.031,mid[1]-.013,mid[2]+ux*.031],
      right=[mid[0]+uz*.033,mid[1]-.009,mid[2]-ux*.033];
    tri(stem,stemColor,start,left,mid,[.69,.89,1]);
    tri(stem,stemColor,left,tip,mid,[.89,1.11,1]);
    tri(stem,stemColor,start,mid,right,[.69,1,.85]);
    tri(stem,stemColor,right,mid,tip,[.85,1,1.11]);
  }
  for(const [x,y,z] of [[.015,.238,0],[-.042,.207,.029],[.046,.191,.039]]){
    for(const a of [0,1.57]){
      const dx=Math.cos(a)*.004,dz=Math.sin(a)*.004,
        b=[-dx,0,-dz],c=[dx,0,dz],d=[x+dx,y,z+dz],e=[x-dx,y,z-dz];
      tri(stem,stemColor,b,c,d,[.59,.7,1]);tri(stem,stemColor,b,d,e,[.59,1,.91]);
    }
    for(let k=0;k<5;k++){
      const a=k*Math.PI*.4+y,cs=Math.cos(a),sn=Math.sin(a),rw=.014+rng()*.005;
      const at=(t,w,dy)=>[x+cs*t-sn*w,y+dy,z+sn*t+cs*w];
      const b=at(.004,0,0),l=at(.027,-rw,.009),r=at(.027,rw,.009),tip=at(.045,0,.011);
      tri(flower,flowerColor,b,l,tip,[.78,.99,1.09]);tri(flower,flowerColor,b,tip,r,[.78,1.09,1]);
    }
  }
  function geo(pos,color){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.computeVertexNormals();return g;
  }
  const g0=geo(stem,stemColor),g1=geo(flower,flowerColor);
  const palette=['#e5d6b4','#d88ca9','#b176a5','#b38dbb','#e6d9c9'].map(s=>new T.Color(s));
  const foliage=['#b2bf91','#c3cda2','#aab789'].map(s=>new T.Color(s));
  const out=[],obj=new T.Object3D();
  BED_ARCS.forEach((arc,j)=>{
    const n=760,m0=new T.InstancedMesh(g0,green,n),m1=new T.InstancedMesh(g1,petals,n);
    for(let i=0;i<n;i++){
      const a=j*Math.PI+.17+(Math.PI-.34)*((i+rng())/n)+.010*Math.sin(i*.43);
      const p=arcPoint(a),stroke=(rng()-.5)*BED_WIDTH*.78,
        delta=stroke+.067*Math.sin(a*47),l=.81+rng()*.73;
      const x=p.x+Math.cos(a)*delta,z=p.z+Math.sin(a)*delta;
      obj.position.set(x,height(x,z),z);obj.scale.set(l,l*(.75+rng()*.30),l);obj.rotation.y=rng()*6.283;obj.updateMatrix();
      m0.setMatrixAt(i,obj.matrix);m1.setMatrixAt(i,obj.matrix);
      m0.setColorAt(i,foliage[i%foliage.length]);
      m1.setColorAt(i,palette[(Math.floor((a+.08*Math.sin(a*13))*8)+j)%palette.length]);
    }
    for(const m of [m0,m1]){m.receiveShadow=true;m.name='Brunnenbeet · Stauden';m.computeBoundingSphere();root.add(m);}
    out.push(m0,m1);
  });
  return pos=>{const visible=Math.hypot(pos.x,pos.z+47)<118;for(const m of out)m.visible=visible};
}

export function addBenches(T,root,world,height){
  const wood=new T.MeshStandardMaterial({...repeatSet(T,'wood',512),roughness:1});
  wood.normalScale.setScalar(.36);
  const iron=new T.MeshStandardMaterial({color:0x39433f,roughness:.64,metalness:.32});
  const boards=[],frame=[],L=1.90;
  function slat(y,z,d,angle=0){
    const shape=new T.Shape();shape.moveTo(-L/2,-d/2);shape.lineTo(L/2,-d/2);
    shape.lineTo(L/2,d/2);shape.lineTo(-L/2,d/2);shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:.033,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:1});
    g.rotateX(-Math.PI/2);g.rotateX(angle);g.translate(0,y,z);
    const p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal;
    for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/1.30,(Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))/.42);
    boards.push(g);
  }
  for(let i=0;i<5;i++)slat(.445,-.234+i*.105,.083,.035);
  for(let i=0;i<3;i++)slat(.57+i*.107,.258+i*.024,.070,1.35);
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  function tube(x,pts,r){
    const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(([y,z])=>V(x,y,z))),12,r,7,false);
    frame.push(g.toNonIndexed());g.dispose();
  }
  for(const x of [-.72,.72]){
    tube(x,[[.07,-.22],[.22,-.18],[.42,-.24],[.418,.21],[.218,.27],[.068,.30]],.028);
    tube(x,[[.409,.221],[.565,.248],[.751,.297],[.851,.321]],.026);
    tube(x,[[.423,-.182],[.62,-.173],[.662,.011],[.645,.249]],.022);
    for(const z of [-.22,.30]){
      const foot=new T.BoxGeometry(.118,.058,.13);foot.translate(x,.027,z);frame.push(foot.toNonIndexed());foot.dispose();
      const bolt=new T.CylinderGeometry(.012,.013,.013,6);bolt.translate(x,.06,z-.034);frame.push(bolt.toNonIndexed());bolt.dispose();
    }
  }
  const count=BENCH_ROW.depths.length*2, w=new T.InstancedMesh(mergeGeometries(boards),wood,count),
    f=new T.InstancedMesh(mergeGeometries(frame),iron,count);
  for(const g of [...boards,...frame])g.dispose();
  let i=0;const obj=new T.Object3D();
  for(const side of [-1,1])for(const z of BENCH_ROW.depths){
    const x=side*BENCH_ROW.x;
    obj.position.set(x,height(x,z),z);obj.rotation.y=side*Math.PI/2;obj.updateMatrix();
    w.setMatrixAt(i,obj.matrix);f.setMatrixAt(i++,obj.matrix);
    const a=x-side*.29,b=x+side*.37;
    world.box(Math.min(a,b),z-L/2,Math.max(a,b),z+L/2);
  }
  w.name='Parkbänke · Holzlatten';f.name='Parkbänke · Gussgestell';
  for(const m of [w,f]){m.receiveShadow=true;m.castShadow=true;m.computeBoundingSphere();root.add(m);}
}
