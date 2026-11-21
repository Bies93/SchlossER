// Posed ellipsoids in world space. Keep the original metre parameter when
// transforming the ray into each unit sphere, even with unequal radii.
export function hitZoneQuery(T){
  const origin=new T.Vector3(),direction=new T.Vector3();
  return (zones,ray,limit,result)=>{
    let best=Infinity,head=false,region='body';
    for(const zone of zones){
      origin.copy(ray.origin).applyMatrix4(zone.inverse);
      direction.copy(ray.origin).add(ray.direction).applyMatrix4(zone.inverse).sub(origin);
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
      best=d;head=zone.head;region=zone.region??(head?'head':'body');
    }
    if(best===Infinity)return false;
    result.distance=best;result.head=head;result.region=region;return true;
  };
}
