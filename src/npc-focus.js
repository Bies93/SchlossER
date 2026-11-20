import {namedHumans} from './human-character.js';

// A screen-space name, not a world-space label: walls and doors cannot
// reveal names in the next room, and the camera never renders extra sprites.
export function npcFocus(T,scene,camera,body,element,visibleLayers){
  const ray=new T.Raycaster(),eye=new T.Vector3(),dir=new T.Vector3(),point=new T.Vector3(),offset=new T.Vector3(),hits=[],candidates=[];
  const cooling=new Map(),currentSource=()=>namedHumans(T);
  let selected=null,next=0;
  function show(entry){
    if(entry===selected)return;
    selected=entry;
    element.hidden=!entry;
    element.textContent=entry?.name??'';
  }
  function visible(a,mask){
    if(!(mask&a.layers.mask))return false;
    for(let p=a;p;p=p.parent){if(!p.visible)return false;if(p===scene)return true;}
    return false;
  }
  function blocked(origin,heading,length,mask){
    ray.set(origin,heading);ray.near=.09;ray.far=Math.max(.091,length-.115);ray.layers.mask=mask;
    // Only invoked for people in the current gaze, at a short range. Omit
    // thin transparent props and actor meshes; ordinary doors remain solid.
    function occludes(o){
      if(!o.visible||o===body||o.userData.namedNpc)return false;
      const m=o.material;
      if(o.isMesh&&!o.isSkinnedMesh&&(o.layers.mask&mask)&&m&&!Array.isArray(m)&&m.visible!==false&&(!m.transparent||m.opacity>.53)){
        hits.length=0;ray.intersectObject(o,false,hits);
        if(hits.length)return true;
      }
      for(const child of o.children)if(occludes(child))return true;
      return false;
    }
    return occludes(scene);
  }
  function sample(now,force=false){
    if(!force&&now<next)return selected;
    next=now+82;
    const mask=visibleLayers(body.position);
    camera.getWorldPosition(eye);camera.getWorldDirection(dir);
    candidates.length=0;
    for(const a of currentSource()){
      if(!a.head||!a.chest||!visible(a.actor,mask)||Math.hypot(a.actor.position.x-eye.x,a.actor.position.z-eye.z)>3.42)continue;
      let best=null;
      for(const j of [a.head,a.chest]){
        j.getWorldPosition(point);point.y+=.08;
        offset.subVectors(point,eye);
        const d=offset.length();
        if(d<.25||d>3.31)continue;
        const dot=offset.dot(dir)/d,closeness=1-dot;
        if(closeness>.074)continue;
        const rank=closeness*21+d*.082-(a===selected?.041:0);
        if(!best||rank<best.rank)best={a,rank,point:point.clone()};
      }
      if(best)candidates.push(best);
    }
    candidates.sort((a,b)=>a.rank-b.rank);
    for(let i=0;i<Math.min(2,candidates.length);i++){
      const {a,point:aim}=candidates[i];
      offset.subVectors(aim,eye);const d=offset.length();
      if(!blocked(eye,offset.multiplyScalar(1/d),d,mask)){
        show(a);return selected;
      }
    }
    show(null);return null;
  }
  function target(){
    if(!selected?.line||selected.existing)return null;
    return selected.target??={id:selected.id,action:'npc-talk',label:'Ansprechen'};
  }
  function use(id,now){
    const ent=selected;
    if(ent?.id!==id||!ent.line||ent.existing||now<(cooling.get(id)??0))return null;
    cooling.set(id,now+2700);ent.speak?.();
    return {name:ent.name,line:ent.line};
  }
  return {sample,target,use,clear(){next=0;show(null);}};
}
