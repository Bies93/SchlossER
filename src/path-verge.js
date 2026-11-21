import {randomSource} from './surface-detail.js';
import {insidePerimeter,distanceToPerimeter} from './world-layout.js';

// A little actual geometry breaks up the gravel edge in the first few
// metres. Leaves and stone chips are opaque and batched in small path cells.
export function addPathVerge(T,root,paths,height,clear){
  const bins=new Map(),rng=randomSource(781116),S=18;
  const geo=(v,i)=>{
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(i);g.computeVertexNormals();return g;
  };
  const leaf=geo([0,.005,-.51,-.34,0,-.18,-.40,0,.12,-.19,.015,.35,
    .04,.008,.48,.37,0,.19,.43,0,-.02,.25,0,-.25,0,.13,0],
    [8,1,0,8,2,1,8,3,2,8,4,3,8,5,4,8,6,5,8,7,6,8,0,7]);
  const chip=geo([-.48,0,-.43,.38,0,-.36,.49,0,.27,-.43,0,.41,.05,.23,.08],
    [0,4,1,1,4,2,2,4,3,3,4,0]);
  const material=new T.MeshLambertMaterial({side:T.DoubleSide});
  for(let z=-19.2;z>-254;z-=1.16)for(let x=-74;x<74;x+=1.16){
    const a=x+(rng()-.5)*1.09,b=z+(rng()-.5)*1.11,{edge,style}=paths.sample(a,b);
    if(edge>.37||edge<-1.8||!insidePerimeter(a,b)||distanceToPerimeter(a,b)<.57||!clear(a,b))continue;
    const woods=b<-75,shadow=style==='compact',p=edge>-.47?(woods?.66:.44):woods?.11:.055;
    if(rng()>p)continue;
    const key=Math.floor(a/S)+':'+Math.floor(b/S);
    if(!bins.has(key))bins.set(key,{x:a,z:b,items:[[],[]]});
    const asLeaf=woods?rng()<.77:rng()<(shadow?.13:.31);
    const n=asLeaf?(rng()<.29?3:1):2;
    for(let j=0;j<n;j++){
      const u=a+(rng()-.5)*.33,w=b+(rng()-.5)*.30;
      const scale=asLeaf?.057+rng()*.076:.028+rng()*.064;
      bins.get(key).items[asLeaf?0:1].push({x:u,z:w,s:scale,t:rng(),yaw:rng()*Math.PI*2});
    }
  }
  const obj=new T.Object3D(),color=new T.Color(),parts=[];
  for(const {x,z,items} of bins.values()){
    const meshes=[];
    for(const [j,list] of items.entries()){
      if(!list.length)continue;
      const mesh=new T.InstancedMesh(j?chip:leaf,material,list.length);
      for(const [i,{x,z,s,t,yaw}] of list.entries()){
        obj.position.set(x,height(x,z)+.003,z);obj.rotation.y=yaw;obj.scale.set(s,s*.71,s);obj.updateMatrix();
        const shades=j?[0xa99e87,0x948b76,0xb4a88f,0xc5b69b]:[0x8c6746,0x9a7d48,0x7f723e,0x79523b];
        mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,color.setHex(shades[Math.floor(t*4)]));
      }
      mesh.name=j?'Kieskante · Splitt':'Waldsaum · Falllaub';mesh.receiveShadow=true;mesh.userData.noSceneQuery=true;
      mesh.computeBoundingSphere();mesh.visible=false;root.add(mesh);meshes.push(mesh);
    }
    parts.push({x,z,meshes});
  }
  let X=Infinity,Z=Infinity;
  return p=>{
    if(Math.abs(X-p.x)+Math.abs(Z-p.z)<1.15)return;
    X=p.x;Z=p.z;
    for(const a of parts){
      const visible=(a.x-X)**2+(a.z-Z)**2<31**2;
      for(const m of a.meshes)m.visible=visible;
    }
  };
}
