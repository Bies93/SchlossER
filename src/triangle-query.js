// Per-geometry index for the larger material batches. Leaves retain the
// original triangles (including holes); the index is never used for drawing.
export function triangleQuery(T,g){
  const vertices=g.attributes.position,index=g.index;
  const count=Math.floor((index?.count??vertices.count)/3),stride=9;
  if(count<144)return null;
  const ids=new Uint32Array(count);
  let info=new Float32Array(count*stride);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  function vertex(i,out){out.fromBufferAttribute(vertices,index?index.getX(i):i);}
  for(let i=0;i<count;i++){
    vertex(i*3,a);vertex(i*3+1,b);vertex(i*3+2,c);
    ids[i]=i;const j=i*stride;
    info[j]=Math.min(a.x,b.x,c.x);info[j+1]=Math.min(a.y,b.y,c.y);info[j+2]=Math.min(a.z,b.z,c.z);
    info[j+3]=Math.max(a.x,b.x,c.x);info[j+4]=Math.max(a.y,b.y,c.y);info[j+5]=Math.max(a.z,b.z,c.z);
    info[j+6]=(a.x+b.x+c.x)/3;info[j+7]=(a.y+b.y+c.y)/3;info[j+8]=(a.z+b.z+c.z)/3;
  }
  function build(start,end,depth){
    const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    const low=[...lo],high=[...hi];
    for(let i=start;i<end;i++){
      const j=ids[i]*stride;
      for(let k=0;k<3;k++){
        lo[k]=Math.min(lo[k],info[j+k]);hi[k]=Math.max(hi[k],info[j+3+k]);
        low[k]=Math.min(low[k],info[j+6+k]);high[k]=Math.max(high[k],info[j+6+k]);
      }
    }
    const box=new T.Box3(new T.Vector3(...lo),new T.Vector3(...hi)).expandByScalar(.00004);
    if(end-start<=16||depth>=24)return {box,start,end};
    const spread=high.map((v,i)=>v-low[i]),axis=spread.indexOf(Math.max(...spread));
    if(spread[axis]<.00004)return {box,start,end};
    const mid=(high[axis]+low[axis])*.5;let split=start;
    for(let i=start;i<end;i++)if(info[ids[i]*stride+6+axis]<mid){
      const id=ids[split];ids[split++]=ids[i];ids[i]=id;
    }
    if(split===start||split===end)return {box,start,end};
    return {box,left:build(start,split,depth+1),right:build(split,end,depth+1)};
  }
  const root=build(0,count,0);
  info=null;
  return {root,ids,vertex};
}

export function triangleIntersection(T){
  const local=new T.Ray(),target=new T.Vector3(),inverse=new T.Matrix4();
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),queue=[];
  return (tree,source,matrix,near,far,any)=>{
    inverse.copy(matrix).invert();
    local.origin.copy(source.origin).applyMatrix4(inverse);
    // Keep world-metre parametrization even under non-uniform scale.
    local.direction.copy(source.origin).add(source.direction).applyMatrix4(inverse).sub(local.origin);
    const invLen=1/local.direction.lengthSq();let nearest=Infinity;
    function enter(n){
      if(n.box.containsPoint(local.origin))return 0;
      if(!local.intersectBox(n.box,target))return Infinity;
      return target.sub(local.origin).dot(local.direction)*invLen;
    }
    queue.length=0;queue.push(tree.root);
    while(queue.length){
      const n=queue.pop();if(enter(n)>far)continue;
      if(n.left){
        if(enter(n.left)<enter(n.right))queue.push(n.right,n.left);else queue.push(n.left,n.right);
        continue;
      }
      for(let i=n.start;i<n.end;i++){
        const j=tree.ids[i]*3;
        tree.vertex(j,a);tree.vertex(j+1,b);tree.vertex(j+2,c);
        if(!local.intersectTriangle(a,b,c,false,target))continue;
        const d=target.sub(local.origin).dot(local.direction)*invLen;
        if(d>=near&&d<=far){nearest=far=d;if(any)return d;}
      }
    }
    return nearest;
  };
}
