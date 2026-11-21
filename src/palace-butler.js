import {createHuman} from './human-character.js';
import {HALL} from './palace-openings.js';

export function contactShadow(T,room,x,y,z,w=.80,d=.67){
  const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);
  const m=new T.Mesh(g,new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec2 q;void main(){q=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 q;void main(){gl_FragColor=vec4(.027,.020,.020,(1.-smoothstep(.04,.49,length(q)))*.41);}'}));
  m.position.set(x,y,z);room.add(m);return m;
}

export function palaceButler(T,room,world){
  const npc=createHuman(T,'niklas'),{actor}=npc;
  actor.name='Niklas · Schlossbutler';room.add(actor);
  const shadow=contactShadow(T,room,0,HALL.floor+.008,0),R=.58,L=7.44,X=1.31,
    length=4*L+2*Math.PI*R,arc=Math.PI*R,point={},ahead={};
  function track(s,out){
    let d=((s%length)+length)%length;
    out.curve=false;
    if(d<2*L){out.x=X+R;out.z=d-L;out.yaw=0;}
    else if((d-=2*L)<arc){
      const a=d/R;out.x=X+R*Math.cos(a);out.z=L+R*Math.sin(a);out.yaw=-a;out.curve=true;
    }else if((d-=arc)<2*L){out.x=X-R;out.z=L-d;out.yaw=-Math.PI;}
    else{
      const a=(d-2*L)/R;out.x=X-R*Math.cos(a);out.z=-L-R*Math.sin(a);out.yaw=-Math.PI-a;out.curve=true;
    }
    return out;
  }
  let distance=10.1,t=0,speed=1.10,look=0,acc=0,standing=0,listening=false,speech=0,turn=0;
  npc.npcInfo.listen=on=>{listening=on;};
  npc.npcInfo.speak=(seconds=2.15)=>{speech=seconds;};
  track(distance,point);
  const collision={x:point.x,z:point.z,ux:1,uz:0,half:.192,depth:.145};
  const here=p=>p.y>-.33&&p.y<1.6&&Math.abs(p.x)<HALL.half&&p.z>=HALL.zMin&&p.z<=HALL.zMax;
  npc.npcInfo.shadow=shadow;
  world.movingBox(.32,-8.44,2.27,8.44,collision,p=>npc.alive()&&here(p));
  const floor=npc.groundedY(HALL.floor);
  actor.position.set(point.x,floor,point.z);shadow.position.x=point.x;shadow.position.z=point.z;
  npc.walk(0,distance,track,HALL.floor,0,0);
  const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  return (dt,p)=>{
    if(!npc.controllable()||!dt||p.y<-.85||Math.abs(p.x)>15||Math.abs(p.z)>22)return false;
    acc+=dt;if(acc<1/30)return false;
    const s=acc;acc=0;t+=s;speech=Math.max(0,speech-s);
    const engaged=listening||speech>0;
    track(distance+.57,ahead);
    const gap=here(p)?Math.min(Math.hypot(p.x-ahead.x,p.z-ahead.z),Math.hypot(p.x-point.x,p.z-point.z)):2;
    const clearance=Math.max(0,Math.min(1,(gap-.56)/.49));
    const wanted=engaged?0:(point.curve||ahead.curve?.83:1.16)*clearance;
    speed+=(wanted-speed)*(1-Math.exp(-s*(wanted<speed?10:5)));
    distance+=speed*s;track(distance,point);
    standing+=((1-Math.min(speed/.45,1))-standing)*(1-Math.exp(-s*6));
    collision.x=point.x;collision.z=point.z;
    const toPlayer=Math.atan2(p.x-collision.x,p.z-collision.z);
    const turnWanted=engaged?angle(point.yaw,toPlayer)*standing:0;
    turn+=angle(turn,turnWanted)*(1-Math.exp(-s*4.4));
    const heading=point.yaw+turn;
    const glance=here(p)&&Math.hypot(p.x-collision.x,p.z-collision.z)<2.8?
      Math.max(-.66,Math.min(.66,angle(heading,toPlayer))):0;
    look+=(glance-look)*(1-Math.exp(-s*4.6));
    collision.ux=Math.cos(heading);collision.uz=-Math.sin(heading);
    actor.position.set(collision.x,floor,collision.z);actor.rotation.y=heading;
    shadow.position.x=collision.x;shadow.position.z=collision.z;shadow.rotation.y=heading;
    const mouth=speech>0?Math.min(1,speech/.15)*(.22+.23*Math.abs(Math.sin(t*14.7))):0;
    npc.walk(t,distance,track,HALL.floor,look,standing,mouth);
    return true;
  };
}
