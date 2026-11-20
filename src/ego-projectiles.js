// The garden's gameplay colliders remain authoritative. A bolt queries only
// the segment it actually traverses this frame; its visible tip owns the hit.
export function weaponWorld(T,root,world,floorAt,creatures,boltMesh,anchors,onContact,query,context=()=>({mask:1,layer:0})){
  const V=()=>new T.Vector3(),from=V(),next=V(),point=V(),heading=V(),sample=V(),ray=new T.Ray(),
    shotPoint=V(),axis=new T.Vector3(0,0,-1);
  const bolts=Array.from({length:3},()=>{
    const mesh=boltMesh.clone();mesh.visible=false;root.add(mesh);
    return {mesh,position:V(),velocity:V(),state:0,age:0,range:0,spec:null};
  });
  const dustMat=new T.MeshStandardMaterial({color:0xa29179,roughness:1});
  const dust=new T.InstancedMesh(new T.IcosahedronGeometry(.010,0),dustMat,24);
  const dummy=new T.Object3D();dust.frustumCulled=false;dust.count=0;root.add(dust);
  const puffs=Array.from({length:6},()=>({age:1,seed:0,p:V(),dir:V()}));
  let cursor=0,seed=0;
  const strike=new Map();
  const sampleHit={distance:0,material:'surface'};
  const blocked=(p,checkFloor)=>world.blocked(p.x,p.z,p.y-1.67)||
    (checkFloor&&p.y<floorAt(p.x,p.z,p.y-1.67)+.026);
  function wall(r,limit,mask){
    if(query)return query.trace(r,limit,mask,.008);
    const N=Math.max(1,Math.ceil(limit/.089)),checkFloor=r.direction.y<-.025||r.origin.y<.88;
    for(let i=0;i<=N;i++){
      const d=limit*i/N;r.at(d,sample);
      if(!blocked(sample,checkFloor))continue;
      let lo=Math.max(0,limit*(i-1)/N),hi=d;
      for(let k=0;k<4;k++){
        const mid=(lo+hi)*.5;r.at(mid,sample);
        if(blocked(sample,checkFloor))hi=mid;else lo=mid;
      }
      return hi;
    }
    return Infinity;
  }
  function pick(r,limit,mask){
    const obstruction=wall(r,limit,mask);
    let nearest=Math.min(limit,obstruction),marker=null;
    if(mask&1)for(const a of anchors){
      if(!r.intersectSphere(a.sphere,point))continue;
      const d=point.distanceTo(r.origin);
      if(d<nearest-.006){marker=a;nearest=d;}
    }
    const hit=creatures?.nearest(r,Math.max(0,nearest-.006),mask);
    return hit?{...hit,marker:null,solid:false}:{distance:nearest,marker,solid:!marker&&obstruction!==Infinity};
  }
  function dustAt(p,d,layer){
    const q=puffs[cursor++%puffs.length];q.p.copy(p).addScaledVector(d,-.030);q.dir.copy(d);q.seed=++seed*1.42;q.age=0;q.layer=layer;
  }
  function mark(a){a.timer=.50;}
  function beginVolley(){strike.clear();}
  function pellet(r,spec){
    const {mask,layer}=context(),contact=pick(r,spec.range,mask);r.at(contact.distance,shotPoint);
    if(contact.marker)mark(contact.marker);
    if(contact.solid)dustAt(shotPoint,r.direction,layer);
    if(contact.actor){
      const close=spec.kind==='shotgun'?1-.52*(contact.distance/spec.range)**1.35:1;
      const amount=spec.impact*close,old=strike.get(contact.actor);
      if(old)old.amount+=amount;
      else strike.set(contact.actor,{amount,point:contact.point});
    }
    if(!contact.solid&&!contact.actor&&!contact.marker)return null;
    sampleHit.distance=contact.distance;sampleHit.material=contact.actor?'soft':contact.marker?'metal':'surface';
    return sampleHit;
  }
  function endVolley(spec){
    for(const [actor,hit] of strike)creatures.damage(actor,Math.round(hit.amount),spec.color,hit.point,spec);
    strike.clear();
  }
  function launch(eye,muzzle,sight,spec){
    // Cover between camera and the displayed start blocks the shot too.
    const {mask,layer}=context();heading.subVectors(muzzle,eye);const d=heading.length();
    if(d>1e-6){
      ray.set(eye,heading.multiplyScalar(1/d));const obstruction=wall(ray,d,mask);
      if(obstruction!==Infinity){
        ray.at(obstruction,point);dustAt(point,ray.direction,layer);onContact(point,spec.kind,'surface');return;
      }
    }
    const b=bolts.find(p=>p.state===0)??bolts.reduce((a,c)=>a.age>c.age?a:c);
    b.position.copy(muzzle);b.velocity.subVectors(sight,muzzle).normalize().multiplyScalar(27);
    b.age=0;b.range=spec.range;b.spec=spec;b.state=1;b.mesh.visible=true;b.layer=layer;b.mask=mask;
    b.mesh.traverse(o=>o.layers.set(layer));pose(b);
  }
  function pose(b){
    heading.copy(b.velocity).normalize();
    b.mesh.quaternion.setFromUnitVectors(axis,heading);
    b.mesh.position.copy(b.position).addScaledVector(heading,-.156);
  }
  function tick(dt){
    let changed=false;
    for(const a of anchors)if(a.timer>0){
      a.timer=Math.max(0,a.timer-dt);a.face.material.emissiveIntensity=.095+a.timer*1.52;changed=true;
    }
    for(const b of bolts){
      if(!b.state)continue;
      changed=true;b.age+=dt;
      if(b.state===2){
        if(b.age>=.78){b.mesh.visible=false;b.state=0;}
        continue;
      }
      from.copy(b.position);
      b.velocity.y-=1.18*dt;
      next.copy(from).addScaledVector(b.velocity,dt);
      heading.subVectors(next,from);const d=Math.min(heading.length(),b.range);
      if(d<=.000001){if(b.range<=.001){b.state=0;b.mesh.visible=false;}continue;}
      ray.set(from,heading.normalize());
      const hit=pick(ray,d,b.mask);
      if(hit.marker||hit.actor||hit.solid){
        ray.at(hit.distance,b.position);pose(b);
        if(hit.actor){
          // Leaving state 1 here prevents a second hit from this same bolt.
          b.state=0;b.mesh.visible=false;
          creatures.damage(hit.actor,b.spec.impact,b.spec.color,hit.point,b.spec);
        }else{
          b.state=2;b.age=0;
          if(hit.marker)mark(hit.marker);else dustAt(b.position,ray.direction,b.layer);
        }
        onContact(b.position,b.spec.kind,hit.actor?'soft':hit.marker?'metal':'surface');
      }else{
        ray.at(d,b.position);pose(b);b.range-=d;
        if(b.range<=.001){b.state=0;b.mesh.visible=false;}
      }
    }
    let count=0;const layer=context().layer;dust.layers.set(layer);
    for(const q of puffs){
      q.age+=dt;
      if(q.age>=.19||q.layer!==layer)continue;
      changed=true;const k=q.age/.19;
      for(let i=0;i<4;i++){
        const a=q.seed+i*2.39996,r=k*(.038+i*.028);
        dummy.position.copy(q.p).addScaledVector(q.dir,-r*.75);
        dummy.position.x+=Math.cos(a)*r;dummy.position.y+=Math.sin(a)*r-k*k*.081;
        dummy.position.z+=Math.sin(a*.72)*r*.82;
        dummy.rotation.set(i+k,q.seed,0);dummy.scale.setScalar((1-k)*(.56+i*.15));dummy.updateMatrix();
        dust.setMatrixAt(count++,dummy.matrix);
      }
    }
    if(count||dust.count)changed=true;
    dust.count=count;if(count)dust.instanceMatrix.needsUpdate=true;
    return changed;
  }
  function clear(){
    for(const b of bolts){b.state=0;b.mesh.visible=false;}
    for(const a of anchors){a.timer=0;a.face.material.emissiveIntensity=.095;}
    for(const q of puffs)q.age=1;dust.count=0;
  }
  return {launch,tick,clear,beginVolley,pellet,endVolley};
}
