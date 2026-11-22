import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {planCollapse} from './npc-collapse.js';
import {GREY_AT,GREY_SITE,GREY_CONTROLS,GREY_CUES,ease,greyShow} from './grey-plan.js';
import {greyScorch,greyAftermath,greyCrewNeck,greyFX,greyHair,greyVial} from './grey-effects.js';

export function addGardenGrey(T,scene,world,height,audio){
  const root=new T.Group();root.name='Orangerie · Chris';scene.add(root);
  const rig=createHuman(T,'grey'),{actor,npcInfo}=rig;
  root.add(actor);
  actor.position.set(GREY_AT.x,rig.groundedY(height(GREY_AT.x,GREY_AT.z)),GREY_AT.z);
  actor.rotation.y=GREY_AT.yaw;
  const hair=greyHair(T,rig);
  greyCrewNeck(T,rig);
  const vial=greyVial(T,rig.vialSocket),fx=greyFX(T,root,height),ash=greyAftermath(T,root,GREY_SITE.x,GREY_SITE.z,height);
  const scorch=greyScorch(T,actor,vial.group);
  const shadow=contactShadow(T,root,actor.position.x,height(actor.position.x,actor.position.z)+.009,actor.position.z,.85,.72);
  npcInfo.shadow=shadow;
  const home={position:actor.position.clone(),yaw:GREY_AT.yaw,shadow:shadow.position.clone()};
  const beats=greyShow(),route=new T.CubicBezierCurve3(
    ...[[GREY_AT.x,GREY_AT.z],...GREY_CONTROLS,[GREY_SITE.x,GREY_SITE.z]].map(([x,z])=>new T.Vector3(x,0,z)));
  const direction=new T.Vector3(),point=new T.Vector3(),hit=new T.Vector3(),spot=new T.Vector3(),torsoAt=new T.Vector3();
  const L=route.getLength(),q={},tread={distance:0,stop:0,floor:0,route:track};
  let idle=0,speech=0,acc=0,glance=0,listening=false,arrivalYaw=null,ending=false,teardown=false;
  let charred=false,landed=false;
  function track(d,out){
    const t=Math.max(0,Math.min(1,d/L));
    route.getPointAt(t,point);route.getTangentAt(t,direction);
    out.x=point.x;out.z=point.z;out.yaw=Math.atan2(direction.x,direction.z);
  }
  npcInfo.speak=(d=1.38)=>{speech=d;};
  npcInfo.listen=value=>{listening=value;};
  npcInfo.interruptRoutine=()=>{
    if(!beats.cancel())return null;
    npcInfo.existing=false;arrivalYaw=null;speech=0;listening=false;
    vial.update(0,0);return home;
  };
  world.circle(GREY_AT.x,GREY_AT.z,.26,p=>!beats.running&&npcInfo.alive&&!npcInfo.hostile&&Math.abs(p.y-actor.position.y)<1.25);
  rig.greyPose(0);
  function accept(){
    if(!npcInfo.alive||npcInfo.hostile||!beats.begin(true))return false;
    npcInfo.existing=true;
    speech=.89;
    audio.playNpc('grey',actor.position,seconds=>{speech=seconds;},undefined,'greyGiggle',()=>npcInfo.alive);
    return true;
  }
  function turnTo(p,dt,force=4.4){
    turnYaw(Math.atan2(p.x-actor.position.x,p.z-actor.position.z),dt,force);
  }
  function turnYaw(goal,dt,force){
    const a=goal-actor.rotation.y;
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
      npcInfo.chest.getWorldPosition(torsoAt);fx.burst(hit,torsoAt);vial.group.visible=false;
      npcInfo.hp=0;npcInfo.alive=false;shadow.visible=false;ending=true;
      audio.stopNpc('grey');audio.greyCue(id,hit);
      const impulse=new T.Vector3(-Math.sin(actor.rotation.y),0,-Math.cos(actor.rotation.y));
      rig.reaction(hit,planCollapse(actor,hit,impulse,world,height),impulse);
    }
  }
  async function prewarm(draw){
    const offFx=fx.warmup(actor.position),offScorch=scorch.warmup();
    try{
      ash.visible=true;
      await draw();
    }finally{
      ash.visible=false;offScorch();offFx();
    }
  }
  function update(dt,p,surface,camera){
    const near=surface&&Math.hypot(p.x-actor.position.x,p.z-actor.position.z)<32;
    if(ending){
      const changed=beats.step(dt,()=>{});
      const age=beats.time-GREY_CUES.burst;
      if(!charred&&age>.13){scorch.apply();ash.visible=true;charred=true;}
      if(!landed&&age>1.02){
        npcInfo.chest.getWorldPosition(spot);audio.greyCue('landing',spot);landed=true;
      }
      if(changed||!teardown){fx.tick(age,near,camera);teardown=beats.beat==='ash';}
      return near&&changed;
    }
    if(!npcInfo.alive){
      if(teardown)return false;
      teardown=true;vial.group.visible=false;fx.vial(0,vial.group,false,false);audio.stopNpc('grey');
      return near;
    }
    if(npcInfo.hostile||!beats.running&&!near){fx.vial(0,vial.group,false,false);return false;}
    acc+=dt;
    if(acc<.039)return false;
    const step=acc;acc=0;idle+=step;
    speech=Math.max(0,speech-step);
    if(beats.running)beats.step(step,cue);
    if(ending){fx.tick(beats.time-GREY_CUES.burst,near,camera);return near;}
    if(rig.isReacting()){
      fx.vial(idle,vial.group,false,near,camera);
      return near;
    }
    const time=beats.time,beat=beats.beat;
    const angle=Math.atan2(p.x-actor.position.x,p.z-actor.position.z)-actor.rotation.y;
    const attentive=listening||speech>0;
    if(!beats.running&&attentive)turnTo(p,step,2.5);
    glance+=((attentive?Math.max(-.68,Math.min(.68,Math.atan2(Math.sin(angle),Math.cos(angle)))):0)-glance)*Math.min(1,step*6);
    if(beat==='walk'){
      const f=(time-GREY_CUES.walk)/(GREY_CUES.arrive-GREY_CUES.walk);
      const edge=.12,part=f<edge?f*f/(2*edge):f>1-edge?1-edge-(1-f)**2/(2*edge):f-edge/2;
      tread.distance=L*part/(1-edge);
      tread.stop=1-ease(0,edge,f)+ease(1-edge,1,f);
      track(tread.distance,q);tread.floor=height(q.x,q.z);actor.position.set(q.x,rig.groundedY(tread.floor),q.z);
      actor.rotation.y=q.yaw;
      rig.greyPose(idle,{tread,talk:speech*.27});
      hair(idle,.33+.55*(1-tread.stop));
    }else{
      const show=ease(GREY_CUES.arrive,GREY_CUES.shake,time);
      const laugh=beat==='laugh'?(1-ease(.48,.85,time))*ease(0,.16,time):0;
      if(beat==='laugh'&&time>.36){track(0,q);turnYaw(q.yaw,step,5.3*ease(.35,.62,time));}
      if(show>0&&surface&&near)turnTo(p,step,2.8);
      else if(show>0&&arrivalYaw!==null)actor.rotation.y=arrivalYaw;
      const shake=ease(GREY_CUES.shake,GREY_CUES.shake+.13,time)*(1-ease(GREY_CUES.spark-.18,GREY_CUES.spark,time));
      const spark=ease(GREY_CUES.spark-.22,GREY_CUES.spark+.15,time);
      rig.greyPose(idle,{show,shake,spark,laugh,look:glance,talk:speech>0?.48+.18*Math.sin(idle*15):0});
      vial.update(idle,shake);
      hair(idle,.16+shake*.20+spark*.19+laugh*.40);
    }
    shadow.position.set(actor.position.x,height(actor.position.x,actor.position.z)+.009,actor.position.z);
    fx.vial(idle,vial.group,beat==='spark',near,camera);
    return near;
  }
  return {root,accept,update,prewarm,get beat(){return beats.beat;},get actor(){return actor;}};
}
