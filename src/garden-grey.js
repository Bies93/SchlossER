import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {planCollapse} from './npc-collapse.js';
import {GREY_AT,GREY_SITE,GREY_CONTROLS,GREY_CUES,ease,greyShow} from './grey-plan.js';
import {blackenGrey,greyAftermath,greyCrewNeck,greyFX,greyHair,greyVial} from './grey-effects.js';

export function addGardenGrey(T,scene,world,height,audio){
  const root=new T.Group();root.name='Orangerie · Grey';scene.add(root);
  const rig=createHuman(T,'grey'),{actor,npcInfo}=rig;
  root.add(actor);
  actor.position.set(GREY_AT.x,rig.groundedY(height(GREY_AT.x,GREY_AT.z)),GREY_AT.z);
  actor.rotation.y=GREY_AT.yaw;
  greyHair(T,rig);
  greyCrewNeck(T,rig);
  const vial=greyVial(T,rig.vialSocket),fx=greyFX(T,root,height),ash=greyAftermath(T,root,GREY_SITE.x,GREY_SITE.z,height);
  const shadow=contactShadow(T,root,actor.position.x,height(actor.position.x,actor.position.z)+.009,actor.position.z,.85,.72);
  npcInfo.shadow=shadow;
  const beats=greyShow(),route=new T.CubicBezierCurve3(
    ...[[GREY_AT.x,GREY_AT.z],...GREY_CONTROLS,[GREY_SITE.x,GREY_SITE.z]].map(([x,z])=>new T.Vector3(x,0,z)));
  const direction=new T.Vector3(),point=new T.Vector3(),hit=new T.Vector3(),spot=new T.Vector3();
  const L=route.getLength(),q={},tread={distance:0,stop:0,floor:0,route:track};
  let idle=0,speech=0,acc=0,glance=0,listening=false,arrivalYaw=null,ending=false,teardown=false;
  function track(d,out){
    const t=Math.max(0,Math.min(1,d/L));
    route.getPointAt(t,point);route.getTangentAt(t,direction);
    out.x=point.x;out.z=point.z;out.yaw=Math.atan2(direction.x,direction.z);
  }
  npcInfo.speak=(d=1.38)=>{speech=d;};
  npcInfo.listen=value=>{listening=value;};
  world.circle(GREY_AT.x,GREY_AT.z,.26,p=>!beats.running&&npcInfo.alive&&Math.abs(p.y-actor.position.y)<1.25);
  rig.greyPose(0);
  function accept(){
    if(!npcInfo.alive||!beats.begin(true))return false;
    npcInfo.existing=true;
    speech=.89;
    audio.playNpc('grey',actor.position,seconds=>{speech=seconds;},undefined,'greyGiggle',()=>npcInfo.alive);
    return true;
  }
  function turnTo(p,dt,force=4.4){
    const goal=Math.atan2(p.x-actor.position.x,p.z-actor.position.z),a=goal-actor.rotation.y;
    actor.rotation.y+=Math.atan2(Math.sin(a),Math.cos(a))*Math.min(1,force*dt);
  }
  function standAtEnd(){
    actor.position.set(GREY_SITE.x,rig.groundedY(height(GREY_SITE.x,GREY_SITE.z)),GREY_SITE.z);
  }
  function cue(id){
    if(id==='arrive'){standAtEnd();arrivalYaw=actor.rotation.y;}
    if(id==='shake'||id==='spark'){
      vial.group.getWorldPosition(spot);audio.greyCue(id,spot);
    }else if(id==='burst'){
      standAtEnd();vial.group.getWorldPosition(hit);
      fx.burst(hit);ash.visible=true;vial.group.visible=false;
      npcInfo.hp=0;npcInfo.alive=false;shadow.visible=false;ending=true;
      audio.stopNpc('grey');audio.greyCue(id,hit);
      blackenGrey(T,actor);
      const impulse=new T.Vector3(-Math.sin(actor.rotation.y),0,-Math.cos(actor.rotation.y));
      rig.reaction(hit,planCollapse(actor,hit,impulse,world,height),impulse);
    }
  }
  function update(dt,p,surface){
    const near=surface&&Math.hypot(p.x-actor.position.x,p.z-actor.position.z)<32;
    if(ending){
      const changed=beats.step(dt,()=>{});
      if(changed||!teardown){fx.tick(beats.time-GREY_CUES.burst,near);teardown=beats.beat==='ash';}
      return near&&changed;
    }
    if(!npcInfo.alive){
      if(teardown)return false;
      teardown=true;vial.group.visible=false;fx.vial(0,vial.group,false,false);audio.stopNpc('grey');
      return near;
    }
    if(!beats.running&&!near){fx.vial(0,vial.group,false,false);return false;}
    acc+=dt;
    if(acc<.039)return false;
    const step=acc;acc=0;idle+=step;
    speech=Math.max(0,speech-step);
    if(beats.running)beats.step(step,cue);
    if(ending){fx.tick(beats.time-GREY_CUES.burst,near);return near;}
    if(rig.isReacting()){
      fx.vial(idle,vial.group,false,near);
      return near;
    }
    const time=beats.time,beat=beats.beat;
    const angle=Math.atan2(p.x-actor.position.x,p.z-actor.position.z)-actor.rotation.y;
    const attentive=listening||speech>0;
    if(!beats.running&&attentive)turnTo(p,step,2.5);
    glance+=((attentive?Math.max(-.68,Math.min(.68,Math.atan2(Math.sin(angle),Math.cos(angle)))):0)-glance)*Math.min(1,step*6);
    if(beat==='walk'){
      const f=(time-GREY_CUES.walk)/(GREY_CUES.arrive-GREY_CUES.walk);
      tread.distance=L*(f-.115*Math.sin(f*Math.PI*2)/(Math.PI*2));
      tread.stop=1-ease(0,.085,f)+ease(.89,1,f);
      track(tread.distance,q);tread.floor=height(q.x,q.z);actor.position.set(q.x,rig.groundedY(tread.floor),q.z);
      actor.rotation.y=q.yaw;
      rig.greyPose(idle,{tread,talk:speech*.27});
    }else{
      const show=ease(GREY_CUES.arrive,GREY_CUES.shake,time);
      if(show>0&&surface&&near)turnTo(p,step,2.8);
      else if(show>0&&arrivalYaw!==null)actor.rotation.y=arrivalYaw;
      const shake=ease(GREY_CUES.shake,GREY_CUES.shake+.13,time)*(1-ease(GREY_CUES.spark-.18,GREY_CUES.spark,time));
      const spark=ease(GREY_CUES.spark-.22,GREY_CUES.spark+.15,time);
      rig.greyPose(idle,{show,shake,spark,look:glance,talk:speech>0?.48+.18*Math.sin(idle*15):0});
      vial.update(idle,shake);
    }
    shadow.position.set(actor.position.x,height(actor.position.x,actor.position.z)+.009,actor.position.z);
    fx.vial(idle,vial.group,beat==='spark',near);
    return near;
  }
  return {root,accept,update,get beat(){return beats.beat;},get actor(){return actor;}};
}
