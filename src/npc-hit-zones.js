// Posed ellipsoids in world space. Keep the original metre parameter when
// transforming the ray into each unit sphere, even with unequal radii.
export function hitZoneQuery(T){
  const origin=new T.Vector3(),direction=new T.Vector3();
  const core=new T.Vector3(),world=new T.Matrix4();
  return (zones,ray,limit,result,padding=0)=>{
    let best=Infinity,head=false,region='body',shape=null;
    for(const zone of zones){
      origin.copy(ray.origin).applyMatrix4(zone.inverse);
      direction.copy(ray.origin).add(ray.direction).applyMatrix4(zone.inverse).sub(origin);
      if(padding){
        const m=zone.inverse.elements;
        const x=1/(1+padding*Math.hypot(m[0],m[4],m[8])),y=1/(1+padding*Math.hypot(m[1],m[5],m[9])),
          z=1/(1+padding*Math.hypot(m[2],m[6],m[10]));
        origin.set(origin.x*x,origin.y*y,origin.z*z);
        direction.set(direction.x*x,direction.y*y,direction.z*z);
      }
      const c=origin.lengthSq()-1;
      let d=0;
      if(c>0){
        const b=origin.dot(direction),disc=b*b-direction.lengthSq()*c;
        if(b>=0||disc<0)continue;
        d=c/(-b+Math.sqrt(disc));
      }
      if(d>limit||!(d<best||!head&&zone.head&&d<=best+.014))continue;
      // Give the jaw priority only in the narrow overlap with the neck.
      if(head&&!zone.head&&best-d<.014)continue;
      best=d;head=zone.head;region=zone.region??(head?'head':'body');shape=zone;
    }
    if(best===Infinity)return false;
    result.distance=best;result.head=head;result.region=region;
    if(padding){
      ray.at(best,core).applyMatrix4(shape.inverse);
      if(core.lengthSq()>1)core.normalize();
      (result.core??=new T.Vector3()).copy(core).applyMatrix4(world.copy(shape.inverse).invert());
    }
    return true;
  };
}
