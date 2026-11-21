import {UPPER_ENTRY as tree} from './palace-openings.js';
import {architectureKit} from './architecture-kit.js';
import {sharedSet} from './surface-detail.js';
import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';

function glasses(T,rig){
  const mount=rig.costumeMount('head'),a=rig.restPoint('eye_l'),b=rig.restPoint('eye_r');
  const iron=new T.MeshStandardMaterial({color:0x332827,metalness:.45,roughness:.32});
  const glass=new T.MeshStandardMaterial({color:0xd6e7e1,roughness:.12,transparent:true,opacity:.1,depthWrite:false});
  const rims=new T.TorusGeometry(1,.071,8,36),lens=new T.CircleGeometry(1,36),bridge=[];
  function arm(points,r){
    const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,r,7,false),iron);
    mount.add(m);
  }
  for(const eye of [a,b]){
    const sign=Math.sign(eye.x),x=eye.x+sign*.005,y=eye.y-.004,z=eye.z+.036;
    const frame=new T.Mesh(rims,iron),pane=new T.Mesh(lens,glass);
    frame.position.set(x,y,z);pane.position.set(x,y,z-.0009);
    frame.scale.set(.034,.025,.041);pane.scale.set(.032,.023,1);mount.add(frame,pane);
    bridge.push(new T.Vector3(x-sign*.032,y+.007,z));
    arm([new T.Vector3(x+sign*.034,y+.006,z),new T.Vector3(sign*.083,y+.006,z-.016),
      new T.Vector3(sign*.085,y+.001,z-.095),new T.Vector3(sign*.081,y-.016,z-.115)],.0023);
  }
  arm([bridge[0],bridge[0].clone().lerp(bridge[1],.5).add(new T.Vector3(0,.004,.005)),bridge[1]],.0024);
  mount.traverse(o=>{o.userData.noSceneQuery=true;});
}

export function addGardenMeditation(T,scene,world,heightAt){
  const x=tree.treeX-1.79,z=tree.treeZ+.38,y=heightAt(x,z),yaw=-1.28;
  const cos=Math.cos(yaw),sin=Math.sin(yaw),rig=createHuman(T,'gardenHannes');
  const seat=new T.Group();seat.name='Gartenbaum · gewebte Sitzmatte';scene.add(seat);
  const cloth=sharedSet(T,'canvas',128),felt=color=>new T.MeshStandardMaterial({color,roughness:.94,...cloth});
  const kit=architectureKit(T,seat,{base:felt(0x453e35),field:felt(0x635646),green:felt(0x52604a),thread:felt(0xb4a17c)});
  const place=(u,v,w)=>{
    const xx=x+cos*u+sin*w,zz=z-sin*u+cos*w;
    return [xx,heightAt(xx,zz)+v,zz];
  };
  kit.box('base',place,-.597,.597,.002,.018,-.429,.583);
  kit.box('field',place,-.568,.568,.017,.025,-.409,.562);
  for(const d of [-.354,-.319,.434,.471]){
    kit.box('green',place,-.552,.552,.025,.027,d-.014,d+.014);
    kit.box('thread',place,-.548,.548,.027,.029,d+.015,d+.019);
  }
  for(const d of [-.429,.583])for(let i=0;i<34;i++){
    const a=-.552+i*.033;
    kit.box('thread',place,a,a+.009,.007,.013,d-.024-i%3*.004,d+.025+i%4*.004);
  }
  kit.flush(seat.name);seat.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  const {actor,npcInfo}=rig;
  actor.position.set(x,rig.groundedY(y+.029),z);actor.rotation.y=yaw;scene.add(actor);
  glasses(T,rig);
  const p=place(0,.030,.085);
  npcInfo.shadow=contactShadow(T,seat,...p,1.04,.77);
  world.circle(x,z,.34,p=>Math.abs(p.y-y)<.65&&rig.alive());
  let t=3.11,acc=0,say=0,attention=0,glance=0,listening=false;
  npcInfo.listen=on=>{listening=on;};
  npcInfo.speak=(seconds=1.65)=>{say=seconds?seconds+.20:0;};
  rig.meditate(t);
  return {update(dt,p,surface){
    if(!surface||!rig.controllable()||Math.abs(p.y-y)>2.3||(p.x-x)**2+(p.z-z)**2>16**2){acc=0;say=0;return false;}
    acc+=dt;if(acc<.052)return false;
    const step=Math.min(acc,.10);acc=0;t+=step;say=Math.max(0,say-step);
    const target=listening||say>0?1:0,angle=Math.atan2(p.x-x,p.z-z)-yaw;
    attention+=(target-attention)*Math.min(1,step*4.8);
    glance+=((target?Math.max(-.91,Math.min(.91,Math.atan2(Math.sin(angle),Math.cos(angle)))):0)-glance)*Math.min(1,step*4.2);
    rig.meditate(t,attention,glance,say>0?attention*(.23+.19*Math.abs(Math.sin(t*15))):0);
    return true;
  }};
}
