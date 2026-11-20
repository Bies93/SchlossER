import {b,p} from './park-wc-layout.js';
import {WC_LAYER} from './park-stair.js';
import {CHAPTER_LAYER} from './chapter-layout.js';

export function weaponPickups(T,vm,wc,chapter,query){
  const items=[],ray=new T.Ray(),v=new T.Vector3(),point=new T.Vector3();
  function add(index,label,at,rotation,scale,layer,attach,focus){
    const group=new T.Group(),model=vm.pickupModel(index);
    group.name=label+' · Waffenfund';group.userData.noSceneQuery=true;
    group.position.fromArray(at);model.rotation.set(...rotation);
    model.scale.setScalar(scale);group.add(model);attach(group);
    items.push({id:'gear-'+index,index,layer,group,focus:new T.Vector3(...focus),action:'gear-pickup',
      label:label+' aufnehmen',notice:label+' aufgenommen. Mit dem Mausrad auswählen.'});
  }
  // The folding side of the WC stall door and the porcelain occupy the
  // opposite side. The prop is tucked lengthways against its outer wall.
  add(2,'Amber 08 · Pumpflinte',p(8.02,b+.14,.563),[0,Math.PI,Math.PI*.48],.88,WC_LAYER,
    g=>wc.attach('womenA',g),p(8.12,b+.19,.592));
  // A walkable side approach beside the rear edge of the throne dais.
  add(1,'Vesper 17 · Sturmgewehr',[9.72,chapter.floor+.36,-37.73],[1.37,0,-.08],.94,CHAPTER_LAYER,
    g=>chapter.attach('chapter',g),[9.75,chapter.floor+.61,-37.72]);
  function target(camera,mask){
    camera.getWorldPosition(ray.origin);camera.getWorldDirection(v);
    let winner=null,best=.36;
    for(const item of items){
      if(!item.group.visible||!(mask&(1<<item.layer))||!query.seen(item.group))continue;
      point.subVectors(item.focus,ray.origin);
      const d=point.length();
      if(d>2.64||d<.16)continue;
      ray.direction.copy(point).divideScalar(d);
      const align=ray.direction.dot(v);
      if(align<.73||align-d*.10<best||query.trace(ray,d-.12,mask,.08,true)!==Infinity)continue;
      best=align-d*.10;winner=item;
    }
    return winner;
  }
  function collect(item){
    if(!item?.group.visible||!vm.collect(item.index))return null;
    item.group.visible=false;return item.notice;
  }
  return {target,collect};
}
