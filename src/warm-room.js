// Three's compileAsync traverses every mesh in its input, even those on a
// different camera layer. Isolate the actual room so unrelated shaders
// aren't compiled under the wrong light setup. This runs before playback.
export async function warmRoom(T,r,source,camera,rooms){
  const staging=new T.Scene(),meshes=[];
  staging.environment=source.environment;
  staging.environmentIntensity=source.environmentIntensity;
  staging.environmentRotation.copy(source.environmentRotation);
  staging.fog=source.fog;
  const saved=rooms.map(node=>({node,parent:node.parent,visible:node.visible}));
  try{
    for(const {node} of saved){staging.add(node);node.visible=true;}
    staging.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    await r.compileAsync(staging,camera);
    const vp=r.getViewport(new T.Vector4()),sc=r.getScissor(new T.Vector4()),test=r.getScissorTest(),
      shadow=r.shadowMap.needsUpdate;
    try{
      r.setViewport(0,0,32,32);r.setScissor(0,0,32,32);r.setScissorTest(true);r.render(staging,camera);
    }finally{
      r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);r.shadowMap.needsUpdate=shadow;
    }
  }finally{
    for(const {node,parent,visible} of saved){parent.add(node);node.visible=visible;}
    for(const [o,cull] of meshes)o.frustumCulled=cull;
  }
}
