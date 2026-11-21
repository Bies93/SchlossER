import {UPPER_ENTRY as tree} from './palace-openings.js';
import {architectureKit} from './architecture-kit.js';
import {sharedSet} from './surface-detail.js';
import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';

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
  const p=place(0,.030,.085);
  npcInfo.shadow=contactShadow(T,seat,...p,.91,.72);
  world.circle(x,z,.34,p=>Math.abs(p.y-y)<.65&&rig.alive());
  let t=3.11,acc=0,say=0,attention=0,glance=0;
  npcInfo.speak=(seconds=1.65)=>{say=seconds+.20;};
  rig.meditate(t);
  return {update(dt,p,surface){
    if(!surface||!rig.controllable()||Math.abs(p.y-y)>2.3||(p.x-x)**2+(p.z-z)**2>16**2){acc=0;say=0;return false;}
    acc+=dt;if(acc<.052)return false;
    const step=Math.min(acc,.10);acc=0;t+=step;say=Math.max(0,say-step);
    const target=say>0?1:0,angle=Math.atan2(p.x-x,p.z-z)-yaw;
    attention+=(target-attention)*Math.min(1,step*4.8);
    glance+=((target?Math.max(-.91,Math.min(.91,Math.atan2(Math.sin(angle),Math.cos(angle)))):0)-glance)*Math.min(1,step*4.2);
    rig.meditate(t,attention,glance,say>0?attention*(.23+.19*Math.abs(Math.sin(t*15))):0);
    return true;
  }};
}
