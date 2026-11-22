import {namedHumans} from './human-character.js';
import {hitZoneQuery} from './npc-hit-zones.js';
import {planCollapse} from './npc-collapse.js';

// One target resolver for the game. Garden enemies keep their own AI and
// existing damage rules; both casts share the same posed hit zones.
export function combatTargets(T,visibility,ghouls,world,floorAt,onDeath,ravens,onHit){
  const point=new T.Vector3(),broad=new T.Sphere(new T.Vector3(),1.61);
  const trace=hitZoneQuery(T),zone={};
  let epoch=1;
  function nearest(ray,limit,mask,radius=0){
    let hit=(mask&1)?ghouls.nearest(ray,limit,radius):null,best=hit?.distance??limit;
    const bird=(mask&1)&&!radius?ravens?.nearest(ray,best):null;
    if(bird){hit=bird;best=bird.distance;}
    for(const n of namedHumans(T)){
      const actor=n.actor;if(!n.alive||!(actor.layers.mask&mask)||!visibility.seen(actor))continue;
      broad.center.copy(actor.position);broad.center.y+=.77;
      broad.radius=1.61+radius;
      if(!ray.intersectsSphere(broad)||ray.origin.distanceToSquared(broad.center)>(best+broad.radius)**2)continue;
      if(n.hitEpoch!==epoch){n.hitEpoch=epoch;n.hitCache=n.rig.hitShapes();}
      if(trace(n.hitCache,ray,best,zone,radius)&&zone.distance<best){
        best=zone.distance;hit={actor:n,distance:best,point:ray.at(best,point).clone(),head:zone.head,region:zone.region};
        if(radius)hit.core=zone.core.clone();
      }
    }
    return hit;
  }
  function damage(n,value,color,at,spec,headShare=0,incoming,region){
    if(!Number.isFinite(value)||value<=0)return false;
    if(ravens?.owns(n))return ravens.damage(n,at,incoming);
    const kind=spec.kind,body=kind==='melee'?value:kind==='archive'?spec.impact:kind==='bow'?50:kind==='rifle'?35:kind==='pistol'?34:Math.min(55,Math.max(34,Math.round(value*.61)));
    const factor=kind==='melee'?1.22:kind==='bow'?2.75:kind==='rifle'?2.6:kind==='pistol'?2.45:2.35;
    const amount=Math.round(body*(1+(factor-1)*headShare));
    if(!n.rig?.npcInfo)return ghouls.damage(n,amount,color,at,incoming);
    if(!n.alive)return false;
    n.hp=Math.max(0,n.hp-amount);
    n.alive=n.hp>0;
    if(n.alive){
      n.rig.reaction(at,null,incoming,region,kind==='melee'?1.40:1);
      onHit?.(n,spec);
    }
    else finish(n,at,incoming);
    return true;
  }
  function finish(n,at,incoming){
    n.rig.reaction(at,planCollapse(n.actor,at,incoming,world,floorAt),incoming);
    if(n.shadow)n.shadow.visible=false;onDeath?.(n.id);
  }
  function collapse(n,at,incoming){
    if(!n?.alive||!n.rig?.npcInfo)return false;
    n.hp=0;n.alive=false;finish(n,at,incoming);return true;
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
  return {nearest,damage,tick,collapse};
}
