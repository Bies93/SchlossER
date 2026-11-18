// Local profiles are batched by finish, so a full façade is a few draws.
export function architectureKit(T,root,materials){
  const bins=new Map();
  const data=m=>{
    if(!bins.has(m))bins.set(m,{position:[],uv:[],normal:[]});
    return bins.get(m);
  };
  function triangle(m,a,b,c,uv){
    const d=data(m),u=new T.Vector3(...b).sub(new T.Vector3(...a)),v=new T.Vector3(...c).sub(new T.Vector3(...a));
    const n=u.clone().cross(v);
    if(n.lengthSq()<1e-14)return;
    n.normalize();
    d.position.push(...a,...b,...c);d.uv.push(...uv);for(let i=0;i<3;i++)d.normal.push(...n);
  }
  function quad(m,a,b,c,d,scale=1.65,offset=0){
    const length=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
    const u=length(a,b)/scale,v=length(a,d)/scale,s=offset/scale;
    triangle(m,a,b,c,[s,0,s+u,0,s+u,v]);triangle(m,a,c,d,[s,0,s+u,v,s,v]);
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
    for(let k=0;k<(idx?.count??p.count);k++){
      const i=idx?idx.getX(k):k;
      d.position.push(...v.fromBufferAttribute(p,i).applyMatrix4(matrix));
      d.normal.push(...nn.fromBufferAttribute(n,i).applyNormalMatrix(nm));
      d.uv.push(uv?.getX(i)??0,uv?.getY(i)??0);
    }
  }
  function flush(prefix){
    for(const [key,buf] of bins){
      const rule=materials[key],geo=new T.BufferGeometry();
      for(const [name,array] of Object.entries(buf))geo.setAttribute(name,new T.Float32BufferAttribute(array,name==='uv'?2:3));
      const m=new T.Mesh(geo,rule.material??rule);
      m.name=prefix+' · '+key;m.castShadow=rule.cast??true;m.receiveShadow=true;root.add(m);
    }
  }
  return {box,quad,triangle,geometry,flush};
}
