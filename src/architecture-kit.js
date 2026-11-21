// Local profiles are batched by finish, so a full façade is a few draws.
export function architectureKit(T,root,materials){
  const bins=new Map();
  const data=m=>{
    if(!bins.has(m))bins.set(m,{position:[],uv:[],normal:[],indices:[]});
    return bins.get(m);
  };
  const ab=new T.Vector3(),ac=new T.Vector3(),n1=new T.Vector3(),n2=new T.Vector3();
  function normal(a,b,c,out){
    ab.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);ac.set(c[0]-a[0],c[1]-a[1],c[2]-a[2]);
    out.crossVectors(ab,ac);if(out.lengthSq()<1e-14)return false;
    out.normalize();return true;
  }
  function emit(d,a,b,c,uv,n){
    const i=d.position.length/3;
    d.position.push(...a,...b,...c);d.uv.push(...uv);d.indices.push(i,i+1,i+2);
    for(let j=0;j<3;j++)d.normal.push(n.x,n.y,n.z);
  }
  function triangle(m,a,b,c,uv){
    if(normal(a,b,c,n1))emit(data(m),a,b,c,uv,n1);
  }
  const length=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
  function quad(m,a,b,c,d,scale=1.65,offset=0){
    const u=length(a,b)/scale,v=length(a,d)/scale,s=offset/scale,bin=data(m);
    const first=normal(a,b,c,n1),second=normal(a,c,d,n2);
    if(first&&second&&Object.is(n1.x,n2.x)&&Object.is(n1.y,n2.y)&&Object.is(n1.z,n2.z)){
      const i=bin.position.length/3;bin.indices.push(i,i+1,i+2,i,i+2,i+3);
      bin.position.push(...a,...b,...c,...d);bin.uv.push(s,0,s+u,0,s+u,v,s,v);
      for(let j=0;j<4;j++)bin.normal.push(n1.x,n1.y,n1.z);
    }else{
      if(first)emit(bin,a,b,c,[s,0,s+u,0,s+u,v],n1);
      if(second)emit(bin,a,c,d,[s,0,s+u,v,s,v],n2);
    }
  }
  function box(m,p,l,r,base,top,back,front){
    if(r-l<.0001||top-base<.0001||Math.abs(front-back)<.0001)return;
    const a=p(l,base,back),b=p(r,base,back),c=p(r,base,front),d=p(l,base,front),
      e=p(l,top,back),f=p(r,top,back),g=p(r,top,front),h=p(l,top,front);
    quad(m,d,c,g,h);quad(m,b,a,e,f);quad(m,c,b,f,g);quad(m,a,d,h,e);quad(m,h,g,f,e);quad(m,a,b,c,d);
  }
  function geometry(m,g,matrix){
    const d=data(m),idx=g.index,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    const nm=new T.Matrix3().getNormalMatrix(matrix),v=new T.Vector3(),nn=new T.Vector3();
    // Source UV seams and hard edges already have distinct vertex IDs.
    // Transform each referenced vertex once, never weld across materials.
    const remap=idx?new Int32Array(p.count).fill(-1):null;
    for(let k=0;k<(idx?.count??p.count);k++){
      const i=idx?idx.getX(k):k;
      if(remap&&remap[i]>=0){d.indices.push(remap[i]);continue;}
      const id=d.position.length/3;if(remap)remap[i]=id;d.indices.push(id);
      v.fromBufferAttribute(p,i).applyMatrix4(matrix);nn.fromBufferAttribute(n,i).applyNormalMatrix(nm);
      d.position.push(v.x,v.y,v.z);d.normal.push(nn.x,nn.y,nn.z);
      d.uv.push(uv?.getX(i)??0,uv?.getY(i)??0);
    }
  }
  function flush(prefix){
    for(const [key,buf] of bins){
      const rule=materials[key],geo=new T.BufferGeometry();
      for(const name of ['position','normal','uv'])geo.setAttribute(name,new T.Float32BufferAttribute(buf[name],name==='uv'?2:3));
      if(buf.indices.length!==buf.position.length/3)geo.setIndex(buf.indices);
      const m=new T.Mesh(geo,rule.material??rule);
      m.name=prefix+' · '+key;m.castShadow=rule.cast??true;m.receiveShadow=true;root.add(m);
    }
    bins.clear(); // Typed GPU attributes now own the data; release build-time arrays.
  }
  return {box,quad,triangle,geometry,flush};
}
