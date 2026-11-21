const turns=[0,1,-1,2,-2,3,-3,4,5,-5,6,-6,7,-7,8];

// Pick room to fall into, using the incoming direction as the preference.
// The same world that blocks walking also keeps the fall clear of walls,
// gallery furniture and ledges when there is space to choose another side.
export function planCollapse(actor,point,incoming,world,floorAt){
  const {x,y,z}=actor.position,floor=floorAt(x,z,y);
  let dx=incoming?.x??x-point.x,dz=incoming?.z??z-point.z;
  if(Math.hypot(dx,dz)<.001){dx=-Math.sin(actor.rotation.y);dz=-Math.cos(actor.rotation.y);}
  const preferred=Math.atan2(dx,dz);
  let best=-Infinity,chosen;
  const clearance=(dx,dz,cap)=>{
    let open=0;
    for(const l of [.22,.38,.55,.72,.90,1.08,1.25]){
      if(l>cap)break;
      const xx=x+dx*l,zz=z+dz*l;
      if(world.blocked(xx,zz,y)||Math.abs(floorAt(xx,zz,y)-floor)>.25)break;
      open=l;
    }
    return open;
  };
  for(const step of turns){
    const a=preferred+step*Math.PI/8,dx=Math.sin(a),dz=Math.cos(a),
      space=clearance(dx,dz,1.25),heels=clearance(-dx,-dz,.90);
    const score=Math.min(1.08,space)+.22*heels-.087*Math.abs(step);
    if(score>best){best=score;chosen={dx,dz,space,heels,floor:Number.isFinite(floor)?floor:y};}
    if(step===0&&space>=1.08&&heels>=.72)break;
  }
  return chosen;
}
