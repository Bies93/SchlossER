import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createHuman} from './human-character.js';
import {FRIEDRICH} from './palace-detail.js';
import {contactShadow} from './palace-butler.js';
import {sharedSet} from './surface-detail.js';

export const MARCEL_SITE={x:FRIEDRICH.halfX+1.14,z:FRIEDRICH.z+2.25,yaw:.52};

export function addPlazaMarcel(T,scene,world,floorAt){
  const {x,z,yaw}=MARCEL_SITE,floor=floorAt(x,z);
  const rig=createHuman(T,'marcel'),{actor,npcInfo}=rig;
  actor.position.set(x,rig.groundedY(floor),z);actor.rotation.y=yaw;scene.add(actor);
  npcInfo.shadow=contactShadow(T,scene,x,floor+.009,z,.84,.67);
  world.circle(x,z,.225,p=>rig.atStation()&&Math.abs(floor-p.y)<1.28);
  const vec=(...p)=>new T.Vector3(...p);
  const mat=(color,roughness=.86,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  function add(holder,geometry,material,p,name){
    const o=new T.Mesh(geometry,material);o.position.copy(p);o.name=name;o.castShadow=true;o.receiveShadow=true;
    holder.add(o);return o;
  }

  // Fit the tied braid in character rest space, then let it follow the head
  // through standing, speech and reaction poses.
  const head=rig.costumeMount('head'),b=rig.restPoint('head');
  const eye=rig.restPoint('eye_l');
  const anchor=vec(-.012,(b.y+eye.y)*.5+.030,b.z-.093);
  const braidRoot=new T.Group();head.add(braidRoot);braidRoot.position.copy(anchor);
  const hair=mat(0x32241d,.75,{vertexColors:true}),part=[];
  const rootMesh=new T.SphereGeometry(1,18,12).scale(.040,.046,.039).translate(0,.020,.018);
  function tint(g,k){g.setAttribute('color',new T.BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(k),3));return g;}
  part.push(tint(rootMesh.toNonIndexed(),1));
  const path=new T.CatmullRomCurve3([vec(0,0,0),vec(-.005,-.058,-.034),vec(.015,-.139,-.058),
    vec(.013,-.240,-.082),vec(.031,-.346,-.105),vec(.039,-.407,-.133)]);
  for(let s=0;s<3;s++){
    const points=[];
    for(let i=0;i<=54;i++){
      const t=i/54,p=path.getPoint(t),a=t*Math.PI*12+s*Math.PI*2/3,r=.0165*(1-t*.63);
      points.push(p.add(vec(Math.sin(a)*r,0,Math.cos(a)*r)));
    }
    const strand=new T.TubeGeometry(new T.CatmullRomCurve3(points),100,.013,8,false);
    const v=strand.attributes.position;
    for(let i=0;i<v.count;i++){
      const f=Math.floor(i/9)/100,p=points[Math.min(54,Math.round(f*54))],k=Math.max(.44,1-f*.58);
      v.setXYZ(i,p.x+(v.getX(i)-p.x)*k,v.getY(i),p.z+(v.getZ(i)-p.z)*k);
    }
    strand.computeVertexNormals();part.push(tint(strand.toNonIndexed(),.76+s*.12));strand.dispose();
  }
  add(braidRoot,mergeGeometries(part),hair,vec(0,0,0),'Marcel · geflochtener Zopf');
  for(const g of part)g.dispose();
  rootMesh.dispose();
  const thread=mat(0x396658,.92);
  for(const [t,r] of [[.08,.026],[.91,.012]]){
    const tie=add(braidRoot,new T.TorusGeometry(r,.0031,7,22),thread,path.getPoint(t),'Marcel · Zopfband');
    tie.quaternion.setFromUnitVectors(vec(0,0,1),path.getTangent(t).normalize());
  }

  // Handwoven diagonal strap against the tunic and a simple copper charm.
  const chest=rig.costumeMount('spine_03'),canvas=sharedSet(T,'canvas',128);
  const wool=mat(0x956135,.98,canvas),edge=mat(0xb49352,.92,canvas),metal=mat(0xb58052,.47,{metalness:.60});
  function clothPoint(x,y,d=.018){return vec(x,y,(rig.costumeDepth(x,y)??.13)+d);}
  const spine=rig.restPoint('spine_03'),cord=[],trim=[];
  for(let i=0;i<=15;i++){
    const t=i/15,X=.173-.313*t,Y=spine.y+.123-.288*t;
    cord.push(clothPoint(X,Y));trim.push(clothPoint(X+.007,Y,.025));
  }
  add(chest,new T.TubeGeometry(new T.CatmullRomCurve3(cord),25,.011,7,false),wool,vec(0,0,0),'Marcel · gewebter Trageriemen');
  add(chest,new T.TubeGeometry(new T.CatmullRomCurve3(trim),25,.0028,6,false),edge,vec(0,0,0),'Marcel · Riemenlitze');
  add(chest,new T.TorusGeometry(.024,.0035,8,24),metal,clothPoint(.024,spine.y-.050,.023),'Marcel · Kupferanhänger');

  let t=1.2,acc=0,speech=0,listening=false,look=0;
  npcInfo.speak=(d=1.9)=>{speech=d;};
  npcInfo.listen=on=>{listening=on;};
  rig.pose(t,0,0,0,0,0,2.8);
  return {rig,update(dt,p,surface){
    if(!surface||!rig.controllable()||Math.hypot(p.x-x,p.z-z)>16)return false;
    acc+=dt;if(acc<1/28)return false;
    const s=acc;acc=0;t+=s;speech=Math.max(0,speech-s);
    const off=Math.atan2(p.x-x,p.z-z)-actor.rotation.y;
    const wanted=listening||speech>0?Math.max(-.65,Math.min(.65,Math.atan2(Math.sin(off),Math.cos(off)))):0;
    look+=(wanted-look)*Math.min(1,s*5.8);
    rig.pose(t,0,0,0,0,0,2.8,speech>0?.24+.28*Math.abs(Math.sin(t*14.7)):0,look);
    braidRoot.rotation.x=.026*Math.sin(t*2.14);braidRoot.rotation.z=.021*Math.sin(t*1.72);
    return true;
  }};
}
