// Sweep the bolt between frames on the reticle trajectory. The drawn bolt
// leaves the viewmodel barrel and converges on that path near the player.
export function weaponWorld(T,root,world,floorAt,creatures,boltMesh,anchors,onContact,query,context=()=>({mask:1,layer:0}),confirm=()=>{}){
  const V=()=>new T.Vector3(),from=V(),next=V(),point=V(),heading=V(),sample=V(),ray=new T.Ray(),
    shotPoint=V(),axis=new T.Vector3(0,0,-1);
  const bolts=Array.from({length:3},()=>{
    const mesh=boltMesh.clone();mesh.visible=false;root.add(mesh);
    return {mesh,position:V(),velocity:V(),offset:V(),state:0,age:0,range:0,travel:0,spec:null};
  });
  const dustMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
  const dust=new T.InstancedMesh(new T.IcosahedronGeometry(.010,0),dustMat,24);
  const dummy=new T.Object3D();dust.frustumCulled=false;dust.count=0;root.add(dust);
  const puffs=Array.from({length:6},()=>({age:1,seed:0,p:V(),dir:V()}));
  const dustColors={surface:new T.Color(0x9f8e78),wood:new T.Color(0xc78748),metal:new T.Color(0xffbd64)};
  dust.setColorAt(0,dustColors.surface);
  let cursor=0,seed=0;
  const strike=new Map();
  const sampleHit={distance:0,material:'surface'};
  const obstructionHit={material:'surface'};
  const blocked=(p,checkFloor)=>world.blocked(p.x,p.z,p.y-1.67)||
    (checkFloor&&p.y<floorAt(p.x,p.z,p.y-1.67)+.026);
  function wall(r,limit,mask){
    if(query)return query.trace(r,limit,mask,.008,false,obstructionHit);
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
    let nearest=limit,marker=null;
    if(mask&1)for(const a of anchors){
      if(!r.intersectSphere(a.sphere,point))continue;
      const d=point.distanceTo(r.origin);
      if(d<nearest-.006){marker=a;nearest=d;}
    }
    const hit=creatures?.nearest(r,Math.max(0,nearest-.006),mask);
    const obstruction=wall(r,hit?.distance??nearest,mask);
    if(obstruction!==Infinity&&obstruction<(hit?.distance??nearest)-.002)
      return {distance:obstruction,marker:null,solid:true,material:obstructionHit.material};
    return hit?{...hit,marker:null,solid:false}:{distance:nearest,marker,solid:!marker&&obstruction!==Infinity,material:obstructionHit.material};
  }
  function dustAt(p,d,layer,material){
    const q=puffs[cursor++%puffs.length];q.p.copy(p).addScaledVector(d,-.030);q.dir.copy(d);q.seed=++seed*1.42;q.age=0;q.layer=layer;
    q.material=material??'surface';
  }
  function mark(a){a.timer=.50;}
  function beginVolley(){strike.clear();}
  function pellet(r,spec){
    const {mask,layer}=context(),contact=pick(r,spec.range,mask);r.at(contact.distance,shotPoint);
    if(contact.marker)mark(contact.marker);
    if(contact.solid)dustAt(shotPoint,r.direction,layer,contact.material);
    if(contact.actor){
      const close=spec.kind==='shotgun'?1-.52*(contact.distance/spec.range)**1.35:1;
      const amount=spec.impact*close,old=strike.get(contact.actor);
      if(old){old.amount+=amount;if(contact.head){old.head+=amount;old.point=contact.point;old.direction.copy(r.direction);old.region='head';}}
      else strike.set(contact.actor,{amount,head:contact.head?amount:0,point:contact.point,direction:r.direction.clone(),region:contact.region});
    }
    if(!contact.solid&&!contact.actor&&!contact.marker)return null;
    sampleHit.distance=contact.distance;sampleHit.material=contact.actor?'soft':contact.marker?'metal':contact.material;
    return sampleHit;
  }
  function endVolley(spec){
    for(const [actor,hit] of strike){
      if(creatures.damage(actor,Math.round(hit.amount),spec.color,hit.point,spec,hit.head/hit.amount,hit.direction,hit.region))
        confirm(actor.alive===false?'down':hit.head?'head':'body');
    }
    strike.clear();
  }
  function launch(eye,muzzle,aim,spec){
    const {mask,layer}=context();
    const b=bolts.find(p=>p.state===0)??bolts.reduce((a,c)=>a.age>c.age?a:c);
    b.position.copy(eye);b.offset.subVectors(muzzle,eye);b.velocity.copy(aim).multiplyScalar(58);
    b.age=b.travel=0;b.range=spec.range;b.spec=spec;b.state=1;b.mesh.visible=true;b.layer=layer;b.mask=mask;
    b.mesh.traverse(o=>o.layers.set(layer));pose(b);
  }
  function pose(b){
    heading.copy(b.velocity).normalize();
    b.mesh.quaternion.setFromUnitVectors(axis,heading);
    b.mesh.position.copy(b.position).addScaledVector(heading,-.156);
    if(b.travel<1.12)b.mesh.position.addScaledVector(b.offset,(1-b.travel/1.12)**2);
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
      b.velocity.y-=.58*dt;
      next.copy(from).addScaledVector(b.velocity,dt);
      heading.subVectors(next,from);const d=Math.min(heading.length(),b.range);
      if(d<=.000001){if(b.range<=.001){b.state=0;b.mesh.visible=false;}continue;}
      ray.set(from,heading.normalize());
      const hit=pick(ray,d,b.mask);
      if(hit.marker||hit.actor||hit.solid){
        ray.at(hit.distance,b.position);b.travel=1.12;pose(b);
        if(hit.actor){
          // Leaving state 1 here prevents a second hit from this same bolt.
          b.state=0;b.mesh.visible=false;
          if(creatures.damage(hit.actor,b.spec.impact,b.spec.color,hit.point,b.spec,hit.head?1:0,ray.direction,hit.region))
            confirm(hit.actor.alive===false?'down':hit.head?'head':'body');
        }else{
          b.state=2;b.age=0;
          if(hit.marker)mark(hit.marker);else dustAt(b.position,ray.direction,b.layer,hit.material);
        }
        onContact(b.position,b.spec.kind,hit.actor?'soft':hit.marker?'metal':hit.material);
      }else{
        ray.at(d,b.position);b.travel+=d;pose(b);b.range-=d;
        if(b.range<=.001){b.state=0;b.mesh.visible=false;}
      }
    }
    let count=0;const layer=context().layer;dust.layers.set(layer);
    for(const q of puffs){
      q.age+=dt;
      const metal=q.material==='metal',wood=q.material==='wood',lifetime=metal?.11:wood?.26:.19;
      if(q.age>=lifetime||q.layer!==layer)continue;
      changed=true;const k=q.age/lifetime;
      for(let i=0;i<4;i++){
        const a=q.seed+i*2.39996,r=k*(.038+i*.028)*(metal?1.85:1);
        dummy.position.copy(q.p).addScaledVector(q.dir,-r*.75);
        dummy.position.x+=Math.cos(a)*r;dummy.position.y+=Math.sin(a)*r-k*k*.081;
        dummy.position.z+=Math.sin(a*.72)*r*.82;
        const size=(1-k)*(.56+i*.15);dummy.rotation.set(i+k,q.seed,0);
        dummy.scale.set(size*(wood?1.7:1),size*(metal?1.95:wood?.58:1),size);dummy.updateMatrix();
        dust.setColorAt(count,dustColors[q.material]??dustColors.surface);dust.setMatrixAt(count++,dummy.matrix);
      }
    }
    if(count||dust.count)changed=true;
    dust.count=count;if(count){dust.instanceMatrix.needsUpdate=true;dust.instanceColor.needsUpdate=true;}
    return changed;
  }
  function clear(){
    for(const b of bolts){b.state=0;b.mesh.visible=false;}
    for(const a of anchors){a.timer=0;a.face.material.emissiveIntensity=.095;}
    for(const q of puffs)q.age=1;dust.count=0;
  }
  function showPrewarm(){
    const bolt=bolts[0].mesh,parts=[];
    bolt.visible=true;bolt.traverse(o=>{if(o.isMesh){parts.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    dummy.position.set(0,0,0);dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);dummy.updateMatrix();
    dust.setMatrixAt(0,dummy.matrix);dust.count=1;dust.instanceMatrix.needsUpdate=true;
    return ()=>{bolt.visible=false;for(const [o,cull] of parts)o.frustumCulled=cull;dust.count=0;};
  }
  return {launch,tick,clear,beginVolley,pellet,endVolley,showPrewarm,dustAt};
}
