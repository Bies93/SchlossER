import {b,p} from './park-wc-layout.js';
import {WC_LAYER} from './park-stair.js';
import {CHAPTER_LAYER} from './chapter-layout.js';
import {GALLERY_PISTOL} from './south-gallery.js';
import {EQUIPMENT} from './ego-assets.js';
import {npcActorLayer,npcWeapon} from './npc-loadouts.js';

export function weaponPickups(T,vm,wc,chapter,query,scene,floorHeight,world,archive,{worldAt=()=>world,onLand=()=>{}}={}){
  const items=[],ray=new T.Ray(),v=new T.Vector3(),point=new T.Vector3();
  const drops=new WeakSet(),falling=new Set(),restBox=new T.Box3();
  const loot={pistol:3,bow:2};
  function add(index,label,at,rotation,scale,layer,attach,focus,placement){
    const group=new T.Group(),model=vm.pickupModel(index);
    group.name=label+' · Waffenfund';group.userData.noSceneQuery=true;
    group.position.fromArray(at);model.rotation.set(...rotation);
    model.scale.setScalar(scale);group.add(model);attach(group);
    const targets=focus?[new T.Vector3(...focus)]:[];
    if(placement==='surface'){
      group.updateWorldMatrix(true,true);
      const box=new T.Box3().setFromObject(model,true);
      group.position.y+=at[1]-box.min.y+.001;
      group.updateWorldMatrix(true,true);
      box.setFromObject(model,true);
      const center=box.getCenter(new T.Vector3());
      targets.push(center.clone());
      const axis=box.max.x-box.min.x>box.max.z-box.min.z?'x':'z',span=(box.max[axis]-box.min[axis])*.31;
      for(const sign of [-1,1]){const tip=center.clone();tip[axis]+=sign*span;targets.push(tip);}
    }
    if(placement==='rack'){
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
      label:label+' aufnehmen',notice:label+' aufgenommen.'});
  }
  // The door parks on the side wall; the rear rail, above the cistern,
  // stays in sight from the doorway and beyond the end of the leaf.
  add(2,'Amber 08 · Pumpflinte',p(8.94,b+1.264,.996),[0,Math.PI/2,0],.91,WC_LAYER,
    g=>wc.attach('womenA',g),p(8.92,b+1.27,1.17),'rack');
  // A walkable side approach beside the rear edge of the throne dais.
  add(1,'Vesper 17 · Sturmgewehr',[9.72,chapter.floor+.36,-37.73],[1.37,0,-.08],.94,CHAPTER_LAYER,
    g=>chapter.attach('chapter',g),[9.75,chapter.floor+.61,-37.72]);
  add(3,'Alma 09 · Kompaktpistole',GALLERY_PISTOL,[0,.15,Math.PI*.5],.91,0,
    g=>scene.add(g),null,'surface');
  add(4,'Falkenried · Archivgewehr',archive.at,[0,-Math.PI*.5,Math.PI*.48],1.01,0,
    g=>archive.attach(g),null,'surface');
  // One predictable resupply point at the existing practice range.
  const box=new T.Group(),x=55.12,z=47.18,y=floorHeight(x,z);
  const green=new T.MeshStandardMaterial({color:0x515944,roughness:.77});
  const dark=new T.MeshStandardMaterial({color:0x383b34,roughness:.67,metalness:.30});
  const small=(w,h,d,X,Y,Z,m)=>{
    const part=new T.Mesh(new T.BoxGeometry(w,h,d),m);part.position.set(X,Y,Z);box.add(part);
  };
  small(.69,.32,.43,0,.16,0,green);small(.713,.072,.451,0,.321,0,dark);
  for(const X of [-.247,.247])small(.055,.112,.029,X,.256,.222,dark);
  const label=document.createElement('canvas');label.width=256;label.height=64;
  const ctx=label.getContext('2d');ctx.fillStyle='#d6c599';ctx.fillRect(0,0,256,64);
  ctx.fillStyle='#252a21';ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.fillText('MUNITION',128,41);
  const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
  const sign=new T.Mesh(new T.PlaneGeometry(.31,.0775),new T.MeshBasicMaterial({map}));
  sign.position.set(0,.17,.216);box.add(sign);
  box.name='Übungsstand · Munitionskiste';box.userData.noSceneQuery=true;
  box.position.set(x,y,z);scene.add(box);
  world.platform(x-.36,z-.228,x+.36,z+.228,y+.357);
  const supply={id:'gear-ammo',layer:0,group:box,targets:[new T.Vector3(x,y+.25,z+.15)],action:'gear-pickup',
    label:'Munition auffüllen',index:0,refill:true};
  items.push(supply);
  function drop(n){
    const kind=npcWeapon(n?.id),index=EQUIPMENT.findIndex(spec=>spec.kind===kind);
    if(!n||n.alive||index<0||drops.has(n))return null;
    drops.add(n);
    const {actor,rig}=n,layer=npcActorLayer(actor),label=EQUIPMENT[index].label;
    const from=actor.getWorldPosition(new T.Vector3()),start=from.clone();
    if(rig.counterMount.visible)rig.counterMount.getWorldPosition(start);
    else{
      n.chest.getWorldPosition(start);
      start.y-=.21;
    }
    const yaw=actor.rotation.y,collision=worldAt(from);
    let x=from.x,z=from.z,floor=floorHeight(x,z,from.y);
    // Drop beside the body, not into the nearest wall, chair or stair void.
    for(const offset of [1.1,-1.1,0,Math.PI,.55,-.55,2.25,-2.25]){
      const X=x+Math.sin(yaw+offset)*.60,Z=z+Math.cos(yaw+offset)*.60;
      if(collision.blocked(X,Z,from.y)||worldAt({x:X,y:from.y,z:Z})!==collision)continue;
      const Y=floorHeight(X,Z,from.y);
      if(!Number.isFinite(Y)||Math.abs(Y-floor)>.29)continue;
      x=X;z=Z;floor=Y;break;
    }
    const model=vm.pickupModel(index,{loaded:false}),group=new T.Group();
    group.name=label+' · fallen gelassen';group.userData.noSceneQuery=true;
    group.add(model);model.scale.setScalar(kind==='bow'?.84:.85);
    const roll=kind==='bow'?.08:Math.PI*.49;
    model.rotation.set(.10,yaw+.58,roll);
    group.traverse(o=>o.layers.set(layer));
    group.position.set(x,floor,z);
    group.updateWorldMatrix(true,true);
    restBox.setFromObject(model,true);
    group.position.y+=floor-restBox.min.y+.019;
    group.updateWorldMatrix(true,true);
    restBox.setFromObject(model,true);
    const focus=restBox.getCenter(new T.Vector3()),end=group.position.clone();
    start.y=Math.max(start.y,end.y+.28);group.position.copy(start);
    scene.add(group);
    const item={id:'gear-drop-'+n.id,index,layer,group,room:actor.parent,targets:[focus],
      action:'gear-pickup',label:label+' aufnehmen',notice:label+' aufgenommen.',ammo:loot[kind],kind,landed:false};
    items.push(item);
    falling.add({item,model,start,end,roll,age:0,time:Math.min(.61,Math.sqrt(2*(start.y-end.y)/9.8))});
    return item;
  }
  function update(dt,mask){
    let changed=false;
    for(const f of falling){
      f.age+=dt;
      const t=Math.min(1,f.age/f.time),{item,model,start,end,roll}=f;
      item.group.position.lerpVectors(start,end,t);
      item.group.position.y=start.y+(end.y-start.y)*t*t;
      model.rotation.x=.10+(1-t)*.49;model.rotation.z=roll+(1-t)*.69;
      if(t===1){
        falling.delete(f);item.landed=true;
        if(mask&(1<<item.layer))onLand(end,item.kind);
      }
      changed ||= !!(mask&(1<<item.layer));
    }
    // Keep the drop at its world position, but respect room culling.
    for(const item of items)if(item.ammo&&!item.taken){
      const show=query.seen(item.room);
      if(item.group.visible!==show){item.group.visible=show;changed ||= !!(mask&(1<<item.layer));}
    }
    return changed;
  }
  function target(camera,mask,layer=0){
    camera.getWorldPosition(ray.origin);camera.getWorldDirection(v);
    let winner=null,best=.36;
    for(const item of items){
      if(item.ammo&&(!item.landed||item.layer!==layer))continue;
      if(!item.group.visible||!(mask&(1<<item.layer))||!query.seen(item.group))continue;
      for(const focus of item.targets){
        point.subVectors(focus,ray.origin);
        const d=point.length();
        if(d>2.64||d<.12)continue;
        ray.direction.copy(point).divideScalar(d);
        const align=ray.direction.dot(v);
        if(align<(item.index>=2?.65:.73)||align-d*.10<best||query.trace(ray,d-.09,mask,.06,true)!==Infinity)continue;
        best=align-d*.10;winner=item;
      }
    }
    return winner;
  }
  function collect(item,touch=false){
    if(item?.refill)return vm.restock()?'Munitionsreserve am Übungsstand aufgefüllt.':'Deine Munitionsreserve ist bereits voll.';
    const instruction=touch?' Mit „Waffe wechseln“ auswählen.':' Mit dem Mausrad auswählen.';
    if(item?.ammo){
      if(item.taken||!item.group.visible||!item.landed)return null;
      const got=vm.collectDrop(item.index,item.ammo);
      if(!got)return null;
      item.taken=true;item.group.removeFromParent();item.group.visible=false;
      return got.weapon?item.notice+instruction:'+'+got.count+' '+(item.kind==='bow'?'Armbrustbolzen':'Pistolenpatronen')+'.';
    }
    if(!item?.group.visible||!vm.collect(item.index))return null;
    item.group.visible=false;return item.notice+instruction;
  }
  return {target,collect,drop,update};
}
