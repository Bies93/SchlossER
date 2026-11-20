import {namedHumans} from './human-character.js';

// One target resolver for the game. Garden enemies keep their own AI and
// existing damage rules; named residents use the same posed rig spheres.
export function combatTargets(T,visibility,ghouls,world,floorAt,onDeath){
  const point=new T.Vector3(),aim=new T.Vector3(),broad=new T.Sphere(new T.Vector3(),1.61);
  let epoch=1;
  function nearest(ray,limit,mask){
    let hit=(mask&1)?ghouls.nearest(ray,limit):null,best=hit?.distance??limit;
    for(const n of namedHumans(T)){
      const actor=n.actor;if(!n.alive||!(actor.layers.mask&mask)||!visibility.seen(actor))continue;
      broad.center.copy(actor.position);broad.center.y+=.77;
      if(!ray.intersectsSphere(broad)||ray.origin.distanceToSquared(broad.center)>(best+1.62)**2)continue;
      if(n.hitEpoch!==epoch){n.hitEpoch=epoch;n.hitCache=n.rig.hitShapes();}
      for(const {sphere,head} of n.hitCache){
        if(!ray.intersectSphere(sphere,point))continue;
        const d=ray.origin.distanceTo(point);
        if(d<best){best=d;hit={actor:n,distance:d,point:point.clone(),head};}
      }
    }
    return hit;
  }
  function damage(n,value,color,at,spec,headShare=0){
    if(!Number.isFinite(value)||value<=0)return false;
    const kind=spec.kind,body=kind==='bow'?50:kind==='rifle'?35:kind==='pistol'?34:Math.min(55,Math.max(34,Math.round(value*.61)));
    const factor=kind==='bow'?2.75:kind==='rifle'?2.6:kind==='pistol'?2.45:2.35;
    const amount=Math.round(body*(1+(factor-1)*headShare));
    if(!n.rig?.npcInfo)return ghouls.damage(n,amount,color,at);
    if(!n.alive)return false;
    n.hp=Math.max(0,n.hp-amount);
    n.alive=n.hp>0;
    if(n.alive)n.rig.reaction(at,0);
    else{
      const {x,y,z}=n.actor.position,base=n.actor.rotation.y;
      let choice=base,furthest=0;
      const floor=floorAt(x,z,y);
      // Check an authored body-width corridor before choosing a collapse
      // direction; don't make the dead actor's standing collider block it.
      for(const i of [0,2,-2,4,1,-1,3,-3]){
        const angle=base+i*Math.PI*.25,dx=-Math.sin(angle),dz=-Math.cos(angle);
        let clearance=0;
        for(const l of [.37,.67,1.02,1.34,1.56]){
          const u=x+dx*l,v=z+dz*l;
          if(world.blocked(u,v,y)||Math.abs(floorAt(u,v,y)-floor)>.30)break;
          clearance=l;
        }
        if(clearance>furthest){furthest=clearance;choice=angle;}
        if(furthest>=1.56)break;
      }
      aim.set(choice,furthest,0);n.rig.reaction(at,1,aim,floor);if(n.shadow)n.shadow.visible=false;onDeath?.(n.id);
    }
    return true;
  }
  function tick(dt,mask){
    epoch++;
    let changed=false;
    for(const n of namedHumans(T))if(n.reacting){
      const visible=(n.actor.layers.mask&mask)&&visibility.seen(n.actor);
      changed=n.rig.reactionTick(dt,visible)||changed;
    }
    return changed;
  }
  return {nearest,damage,tick};
}
