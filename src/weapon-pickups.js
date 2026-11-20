import {b,p} from './park-wc-layout.js';
import {WC_LAYER} from './park-stair.js';
import {CHAPTER_LAYER} from './chapter-layout.js';

export function weaponPickups(T,vm,wc,chapter,query){
  const items=[],ray=new T.Ray(),v=new T.Vector3(),point=new T.Vector3();
  function add(index,label,at,rotation,scale,layer,attach,focus,rack=false){
    const group=new T.Group(),model=vm.pickupModel(index);
    group.name=label+' · Waffenfund';group.userData.noSceneQuery=true;
    group.position.fromArray(at);model.rotation.set(...rotation);
    model.scale.setScalar(scale);group.add(model);attach(group);
    const targets=[new T.Vector3(...focus)];
    if(rack){
      group.updateWorldMatrix(true,true);
      const box=new T.Box3().setFromObject(model,true),center=box.getCenter(new T.Vector3()),span=box.max.x-box.min.x;
      targets.splice(0,1,center,center.clone().add(new T.Vector3(span*.31,0,0)),center.clone().add(new T.Vector3(-span*.31,0,0)));
      const wall=new T.MeshStandardMaterial({color:0x5b6258,roughness:.64,metalness:.37});
      // The empty rail stays on the wall after taking the weapon.
      const rail=new T.Group();
      for(const shift of [-.26,.26]){
        const clip=new T.Mesh(new T.BoxGeometry(.079,.031,.172),wall);
        clip.position.set(center.x-at[0]+shift,box.min.y-at[1]-.015,.045);rail.add(clip);
        const plate=new T.Mesh(new T.BoxGeometry(.099,.121,.023),wall);
        plate.position.set(clip.position.x,clip.position.y+.020,.155);rail.add(plate);
      }
      rail.position.fromArray(at);rail.name='Damenkabine · Metallhalter';attach(rail);
    }
    items.push({id:'gear-'+index,index,layer,group,targets,action:'gear-pickup',
      label:label+' aufnehmen',notice:label+' aufgenommen. Mit dem Mausrad auswählen.'});
  }
  // The door parks on the side wall; the rear rail, above the cistern,
  // stays in sight from the doorway and beyond the end of the leaf.
  add(2,'Amber 08 · Pumpflinte',p(8.94,b+1.264,.996),[0,Math.PI/2,0],.91,WC_LAYER,
    g=>wc.attach('womenA',g),p(8.92,b+1.27,1.17),true);
  // A walkable side approach beside the rear edge of the throne dais.
  add(1,'Vesper 17 · Sturmgewehr',[9.72,chapter.floor+.36,-37.73],[1.37,0,-.08],.94,CHAPTER_LAYER,
    g=>chapter.attach('chapter',g),[9.75,chapter.floor+.61,-37.72]);
  function target(camera,mask){
    camera.getWorldPosition(ray.origin);camera.getWorldDirection(v);
    let winner=null,best=.36;
    for(const item of items){
      if(!item.group.visible||!(mask&(1<<item.layer))||!query.seen(item.group))continue;
      for(const focus of item.targets){
        point.subVectors(focus,ray.origin);
        const d=point.length();
        if(d>2.64||d<.12)continue;
        ray.direction.copy(point).divideScalar(d);
        const align=ray.direction.dot(v);
        if(align<(item.index===2?.65:.73)||align-d*.10<best||query.trace(ray,d-.09,mask,.06,true)!==Infinity)continue;
        best=align-d*.10;winner=item;
      }
    }
    return winner;
  }
  function collect(item){
    if(!item?.group.visible||!vm.collect(item.index))return null;
    item.group.visible=false;return item.notice;
  }
  return {target,collect};
}
