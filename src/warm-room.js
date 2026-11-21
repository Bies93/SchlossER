// Three's compileAsync traverses every mesh in its input, even those on a
// different camera layer. Isolate the actual room so unrelated shaders
// aren't compiled under the wrong light setup. This runs before playback.
export async function warmRoom(T,r,source,camera,rooms,{target=null,lights=[]}={}){
  const staging=new T.Scene(),meshes=[];
  staging.environment=source.environment;
  staging.environmentIntensity=source.environmentIntensity;
  staging.environmentRotation.copy(source.environmentRotation);
  staging.fog=source.fog;
  const saved=rooms.map(node=>({node,parent:node.parent,visible:node.visible}));
  try{
    for(const light of lights){
      // Preserve the actual light counts for the exterior material programs.
      const copy=light.clone(false);light.getWorldPosition(copy.position);staging.add(copy);
      if(copy.target){light.target.getWorldPosition(copy.target.position);staging.add(copy.target);}
    }
    for(const {node} of saved){staging.add(node);node.visible=true;}
    staging.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    const previous=r.getRenderTarget();
    let compiled;
    try{
      r.setRenderTarget(target);
      compiled=r.compileAsync(staging,camera);
    }finally{r.setRenderTarget(previous);}
    await compiled;
    const vp=r.getViewport(new T.Vector4()),sc=r.getScissor(new T.Vector4()),test=r.getScissorTest(),
      shadow=r.shadowMap.needsUpdate,autoShadow=r.shadowMap.autoUpdate,clear=r.autoClear;
    try{
      r.shadowMap.needsUpdate=r.shadowMap.autoUpdate=false;r.autoClear=true;
      r.setRenderTarget(target);
      if(!target){r.setViewport(0,0,32,32);r.setScissor(0,0,32,32);r.setScissorTest(true);}
      r.render(staging,camera);
    }finally{
      r.setRenderTarget(null);r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);r.setRenderTarget(previous);
      r.shadowMap.needsUpdate=shadow;r.shadowMap.autoUpdate=autoShadow;r.autoClear=clear;
    }
  }finally{
    for(const {node,parent,visible} of saved){parent.add(node);node.visible=visible;}
    for(const [o,cull] of meshes)o.frustumCulled=cull;
  }
}
