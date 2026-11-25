import {INFO_SITE} from './plaza-info-stand.js';
import {boxingClock} from './npc-boxing.js';

const site=(x,z)=>[INFO_SITE.x+x,INFO_SITE.z+z];
// Stage blocking on the virtual plaza: the run leaves the statue to one side;
// the cast meets in front of the table, not between its props or under the flags.
const marcelRun=[[2.12,30.56],[1.94,29.16],[.37,28.29],[-4.40,24.12],site(-.95,2.69)];
const castRoutes=[
  [site(-1.80,2.10),site(-1.83,2.73)],
  [site(1.63,.32),site(1.89,.64),site(1.87,2.02),site(1.19,2.65),site(.03,2.69)],
  [site(1.65,2.11),site(1.17,3.26),site(-.75,3.67)]
];
const beats=[[1,0,22],[0,3,11],[3,0,27],[0,2,13],[2,0,26],[1,0,Infinity]];
const contactSpec=Object.freeze({kind:'melee'});
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const approach=(now,to,speed,dt)=>now+(to-now)*(1-Math.exp(-speed*dt));

// A self-contained scene: only its four actors exchange game hit events.
// It never inflicts player damage, takes over the camera or needs input.
export function marcelStandQuest(T,marcel,stand,{world,floorAt,query,targets,sound=()=>{},outcome=()=>{}}){
  const characters=[marcel.rig.npcInfo,...stand.cast.map(x=>x.npcInfo)];
  const point=new T.Vector3(),start=new T.Vector3(),direction=new T.Vector3(),ray=new T.Ray();
  const step={x:0,y:0,z:0,feet:0};
  let phase='idle',time=0,age=0,bout=0,actors=[],strike=null,completed=false;
  const switchTo=name=>{phase=name;age=0;strike=null;};
  function route(a,points){a.path=points;a.index=0;a.stuck=0;}
  function move(a,dt,max){
    const p=a.n.actor.position,path=a.path;
    while(a.index<path.length&&Math.hypot(path[a.index][0]-p.x,path[a.index][1]-p.z)<.069)a.index++;
    const remaining=path[a.index];
    a.speed=approach(a.speed,remaining?max:0,remaining?8:13,dt);
    if(!remaining){a.pace=approach(a.pace,0,14,dt);return true;}
    const dx=remaining[0]-p.x,dz=remaining[1]-p.z,d=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
    const walk=Math.min(d,a.speed*dt);
    Object.assign(step,{x:p.x,y:a.floor+.05,z:p.z,feet:a.floor});
    world.move(step,dx/d*walk,dz/d*walk);
    const moved=Math.hypot(step.x-p.x,step.z-p.z),floor=floorAt(step.x,step.z,a.floor);
    if(moved>.0001&&moved<walk+.25&&Number.isFinite(floor)&&Math.abs(floor-a.floor)<.22){
      a.floor=floor;p.set(step.x,a.n.rig.groundedY(floor),step.z);a.distance+=moved;
      if(a.n.shadow){a.n.shadow.position.set(p.x,floor+.009,p.z);a.n.shadow.rotation.y=yaw;}
      a.stuck=Math.hypot(remaining[0]-p.x,remaining[1]-p.z)<d-.0003?0:a.stuck+dt;
    }else a.stuck+=dt;
    a.pace=approach(a.pace,Math.min(1,moved/Math.max(.001,dt*2.34)),15,dt);
    a.n.actor.rotation.y+=angle(yaw-a.n.actor.rotation.y)*(1-Math.exp(-dt*11));
    return false;
  }
  function turn(a,who,dt){
    if(!who?.n.alive)return;
    const p=a.n.actor.position,q=who.n.actor.position;
    const d=angle(Math.atan2(q.x-p.x,q.z-p.z)-a.n.actor.rotation.y);
    a.n.actor.rotation.y+=d*(1-Math.exp(-dt*13));
    return d;
  }
  function pose(a,dt,guard,sprint=0){
    a.guard=approach(a.guard,guard,13,dt);
    if(a.n.alive&&!a.n.rig.isReacting())a.n.rig.boxPose(time+a.offset,a.distance,a.pace,a.guard,a.clock.side,a.clock.extension(),sprint);
  }
  function strikeAt(attacker,defender,value,dt,audible){
    const a=actors[attacker],d=actors[defender];
    if(!strike)strike={started:false,hit:false};
    const facing=turn(a,d,dt);
    if(!strike.started&&Math.abs(facing)<.29&&!a.n.rig.isReacting()){
      strike.started=true;a.clock.start();if(audible)sound('swing',a.n.actor.position);
    }
    a.clock.tick(dt,()=>{
      const p=a.n.actor.position,q=d.n.actor.position;
      if(!a.n.alive||!d.n.alive||Math.hypot(q.x-p.x,q.z-p.z)>1.19)return;
      a.n.chest.getWorldPosition(start);d.n.chest.getWorldPosition(point);
      const length=direction.subVectors(point,start).length();
      if(length<.15||query.trace(ray.set(start,direction.multiplyScalar(1/length)),length-.10,1,.05,true)!==Infinity)return;
      direction.set(q.x-p.x,0,q.z-p.z).normalize();
      const amount=value===Infinity?d.n.hp:Math.min(value,d.n.hp-1);
      if(amount>0)targets.damage(d.n,amount,0xffffff,point,contactSpec,0,direction,'body');
      else d.n.rig.reaction(point,null,direction,'body',.73);
      strike.hit=true;
      if(audible)sound('brawl-hit',q);
    });
    return strike.started&&a.clock.mode==='guard'?strike.hit?'hit':'miss':null;
  }
  function release(a){
    a.n.questBusy=false;
    if(a.n.alive){
      a.n.actor.rotation.y=a.yaw;
      if(a.n.shadow)a.n.shadow.rotation.y=a.yaw;
      a.n.rig.resetBoxPose();
    }
  }
  function returnCast(won){
    completed=won;outcome(won?'complete':'interrupted');
    for(const [i,a] of actors.entries()){
      a.clock.cancel();
      if(!a.n.alive){release(a);continue;}
      const p=a.n.actor.position,path=i===0?marcelRun:castRoutes[i-1];
      const previous=path.map(([x,z])=>Math.hypot(p.x-x,p.z-z));
      const at=previous.indexOf(Math.min(...previous));
      route(a,[...path.slice(0,at+1).reverse(),[a.home.x,a.home.z]]);
    }
    switchTo('return');
  }
  return {
    get phase(){return phase;},
    start(){
      if(phase!=='idle'||characters.some(n=>!n?.alive||n.questBusy||n.hostile||n.rig.isReacting()))return false;
      actors=characters.map((n,i)=>{
        n.questBusy=true;const p=n.actor.position;
        return {n,home:p.clone(),yaw:n.actor.rotation.y,clock:boxingClock(),floor:floorAt(p.x,p.z,p.y),
          path:[],index:0,distance:0,speed:0,pace:0,guard:0,stuck:0,offset:i*.83};
      });
      route(actors[0],marcelRun);switchTo('shout');return true;
    },
    update(dt,audible){
      if(!dt||phase==='idle'||phase==='done')return false;
      time+=dt;age+=dt;
      const lead=actors[0];
      if(phase!=='return'&&actors.some(a=>!a.n.alive)&&!(phase==='fight'&&bout===beats.length-1&&strike?.hit&&!lead.n.alive)){
        returnCast(false);return true;
      }
      if(phase==='shout'){
        lead.n.rig.pose(time,0,0,0,0,0,2.8,.65*(1-age/.96)*Math.abs(Math.sin(time*17)));
        if(age>=.90)switchTo('run');
      }else if(phase==='run'){
        const arrived=move(lead,dt,3.85);pose(lead,dt,0,1);
        if(arrived)switchTo('opening');
        else if(age>10||lead.stuck>1.5)returnCast(false);
      }else if(phase==='opening'){
        lead.pace=approach(lead.pace,0,18,dt);
        const result=strikeAt(0,1,14,dt,audible);
        turn(actors[1],lead,dt);pose(actors[1],dt,strike?.hit?.76:0);pose(lead,dt,1,1);
        if(result==='hit'){
          for(let i=1;i<actors.length;i++)route(actors[i],castRoutes[i-1]);
          switchTo('gather');
        }else if(result==='miss'||age>3)returnCast(false);
      }else if(phase==='gather'){
        const settled=actors.slice(1).map(a=>{
          if(a.n.rig.isReacting())return false;
          const arrived=move(a,dt,2.55);
          if(arrived)turn(a,lead,dt);
          pose(a,dt,arrived?1:.20);return arrived;
        });
        turn(lead,actors[settled[0]?3:1],dt);pose(lead,dt,1);
        if(settled.every(Boolean))switchTo('fight');
        else if(age>7||actors.some(a=>a.stuck>1.6))returnCast(false);
      }else if(phase==='fight'){
        const [a,d,value]=beats[bout];
        for(const [i,x] of actors.entries()){
          x.pace=approach(x.pace,0,14,dt);
          if(i!==a)turn(x,i===0?actors[a]:lead,dt);
        }
        const result=strikeAt(a,d,value,dt,audible);
        actors.forEach(x=>pose(x,dt,1));
        if(result==='hit'){
          bout++;
          if(!lead.n.alive)returnCast(true);
          else{strike=null;age=0;}
        }else if(result==='miss'||age>3)returnCast(false);
      }else if(phase==='return'){
        if(completed&&audible&&age-dt<.53&&age>=.53)sound('brawl-fall',lead.n.actor.position);
        let walking=false;
        for(const a of actors){
          if(!a.n.questBusy)continue;
          if(!a.n.alive||age>12||a.stuck>1.8){release(a);continue;}
          if(age<.66||a.n.rig.isReacting()){walking=true;continue;}
          if(move(a,dt,1.55)){
            if(Math.hypot(a.n.actor.position.x-a.home.x,a.n.actor.position.z-a.home.z)<.08){
              a.n.actor.position.copy(a.home);
              if(a.n.shadow){a.n.shadow.position.x=a.home.x;a.n.shadow.position.z=a.home.z;}
            }
            release(a);
          }else{pose(a,dt,0);walking=true;}
        }
        if(!walking&&age>1)switchTo('done');
      }
      return Boolean(audible);
    }
  };
}
