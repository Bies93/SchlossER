import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {repeatSet} from './surface-detail.js';
import {BENCH_ROW} from './world-layout.js';

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
