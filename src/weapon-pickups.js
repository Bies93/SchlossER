import {b,p} from './park-wc-layout.js';
import {WC_LAYER} from './park-stair.js';
import {CHAPTER_LAYER} from './chapter-layout.js';
import {GALLERY_PISTOL} from './south-gallery.js';

export function weaponPickups(T,vm,wc,chapter,query,scene,floorHeight,world){
  const items=[],ray=new T.Ray(),v=new T.Vector3(),point=new T.Vector3();
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
      targets.push(box.getCenter(new T.Vector3()),new T.Vector3((box.min.x+box.max.x)*.5,box.max.y-.012,box.min.z+.053));
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
  const archiveX=54.03,archiveZ=48.47,archiveY=floorHeight(archiveX,archiveZ);
  add(4,'Falkenried · Archivgewehr',[archiveX+.062,archiveY+.76,archiveZ+.26],[0,.24,Math.PI*.49],1.05,0,
    g=>scene.add(g),null,'surface');
  const stand=new T.Group(),timber=new T.MeshStandardMaterial({color:0x69523c,roughness:.86});
  stand.position.set(archiveX,archiveY,archiveZ);stand.name='Übungsstand · Ablage für das Archivgewehr';
  for(const [x,y,z,w,h,d] of [[0,.716,0,.86,.088,1.26],[0,.086,0,.88,.062,1.25],
    [-.32,.39,-.45,.092,.69,.095],[.32,.39,-.45,.092,.69,.095],[-.32,.39,.45,.092,.69,.095],[.32,.39,.45,.092,.69,.095]]){
    const p=new T.Mesh(new T.BoxGeometry(w,h,d),timber);p.position.set(x,y,z);p.receiveShadow=true;p.castShadow=true;stand.add(p);
  }
  scene.add(stand);world.platform(archiveX-.44,archiveZ-.63,archiveX+.44,archiveZ+.63,archiveY+.76);
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
        if(align<(item.index>=2?.65:.73)||align-d*.10<best||query.trace(ray,d-.09,mask,.06,true)!==Infinity)continue;
        best=align-d*.10;winner=item;
      }
    }
    return winner;
  }
  function collect(item,touch=false){
    if(item?.refill)return vm.restock()?'Munitionsreserve am Übungsstand aufgefüllt.':'Deine Munitionsreserve ist bereits voll.';
    if(!item?.group.visible||!vm.collect(item.index))return null;
    item.group.visible=false;return item.notice+(touch?' Mit „Waffe wechseln“ auswählen.':' Mit dem Mausrad auswählen.');
  }
  return {target,collect};
}
