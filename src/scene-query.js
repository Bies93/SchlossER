// Shared 3D visibility/impact queries. Index the existing opaque surfaces
// once; rotating leaves stay separate and are tested in their current pose.
export function sceneQuery(T,scene,player){
  const solid=new T.MeshBasicMaterial({side:T.DoubleSide}),probe=new T.Mesh(undefined,solid);
  const caster=new T.Raycaster(),intersection=new T.Vector3(),hits=[],stack=[],fixed=[],moving=[];
  let tree=null,revision=0;
  const seen=o=>{for(let a=o;a;a=a.parent){if(!a.visible)return false;if(a===scene)return true;}return false;};
  function build(){
    fixed.length=moving.length=0;scene.updateMatrixWorld(true);
    function visit(o,dynamic=false){
      if(o===player||o.userData.namedNpc||o.userData.noSceneQuery)return;
      dynamic||=Boolean(o.userData.movingOccluder);
      const m=o.material;
      if(o.isMesh&&!o.isSkinnedMesh&&!o.isInstancedMesh&&m&&!Array.isArray(m)&&
         m.visible!==false&&(!m.transparent||!m.isShaderMaterial&&m.opacity>.53)&&!m.alphaTest){
        const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();
        const local=g.boundingBox;
        if(local&&!local.isEmpty()&&(dynamic||local.getSize(intersection).lengthSq()>.0784)){
          const bounds=local.clone().applyMatrix4(o.matrixWorld);
          if(Number.isFinite(bounds.min.x)) (dynamic?moving:fixed).push({o,bounds,local});
        }
      }
      for(const c of o.children)visit(c,dynamic);
    }
    visit(scene);
    const part=arr=>{
      if(!arr.length)return null;
      const box=new T.Box3();let mask=0;
      for(const item of arr){box.union(item.bounds);mask|=item.o.layers.mask;}
      if(arr.length<=9)return {box,mask,arr};
      const d=box.getSize(intersection),axis=d.x>=d.y&&d.x>=d.z?'x':d.y>=d.z?'y':'z';
      arr.sort((a,b)=>a.bounds.min[axis]+a.bounds.max[axis]-b.bounds.min[axis]-b.bounds.max[axis]);
      const i=arr.length>>1;return {box,mask,a:part(arr.slice(0,i)),b:part(arr.slice(i))};
    };
    tree=part(fixed);
  }
  function trace(ray,max,mask,near=.02,any=false){
    if(max<=near)return Infinity;
    caster.ray.copy(ray);caster.near=near;caster.far=max;
    let nearest=Infinity;
    const touches=b=>b.containsPoint(ray.origin)||
      Boolean(ray.intersectBox(b,intersection)&&intersection.distanceToSquared(ray.origin)<=caster.far**2);
    function mesh(entry,dynamic=false){
      const {o,bounds,local}=entry;
      if(!(o.layers.mask&mask)||!seen(o))return false;
      if(dynamic&&entry.revision!==revision){
        o.updateWorldMatrix(true,false);bounds.copy(local).applyMatrix4(o.matrixWorld);entry.revision=revision;
      }
      if(!touches(bounds))return false;
      probe.geometry=o.geometry;probe.matrixWorld.copy(o.matrixWorld);
      hits.length=0;probe.raycast(caster,hits);
      for(const h of hits)if(h.distance<nearest)caster.far=nearest=h.distance;
      return hits.length>0;
    }
    for(const e of moving)if(mesh(e,true)&&any)return nearest;
    stack.length=0;if(tree)stack.push(tree);
    while(stack.length){
      const n=stack.pop();if(!(n.mask&mask)||!touches(n.box))continue;
      if(n.arr){for(const e of n.arr)if(mesh(e)&&any)return nearest;}
      else stack.push(n.a,n.b);
    }
    return nearest;
  }
  return {build,trace,seen,invalidateMoving(){revision++;}};
}
