// Fit a hairstyle to the visible GLB skin in bind space; no run-time raycasts.
export function scalpFitter(T,g,center){
  const {position:p}=g.attributes,index=g.index,count=index?.count??p.count,triangles=[];
  const v=new T.Vector3(),h=new T.Vector3(),ray=new T.Ray(center,new T.Vector3());
  for(let i=0;i<count;i+=3){
    const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
    const a=p.getY(ia),b=p.getY(ib),c=p.getY(ic);
    if(Math.max(a,b,c)<center.y-.063||Math.min(a,b,c)<center.y-.16)continue;
    triangles.push([ia,ib,ic].map(j=>new T.Vector3().fromBufferAttribute(p,j)));
  }
  return dir=>{
    const x=.069,y=.095,z=dir.z>0?.099:.100;
    const ellipse=1/Math.hypot(dir.x/x,dir.y/y,dir.z/z);
    let radius=0;
    ray.direction.copy(dir);
    for(const [a,b,c] of triangles)if(ray.intersectTriangle(a,b,c,false,h)){
      v.subVectors(h,center);radius=Math.max(radius,v.dot(dir));
    }
    return radius>0?Math.min(ellipse+.015,Math.max(ellipse-.012,radius)):ellipse;
  };
}
