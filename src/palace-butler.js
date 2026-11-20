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
  const shadow=contactShadow(T,room,0,HALL.floor+.008,0),track=a=>[1.21+.65*Math.cos(a),8.11*Math.sin(a)];
  let phase=.34,t=0,gait=.34,motion=0,look=0,heading=0,acc=0;
  const [x,z]=track(phase);
  const collision={x,z,ux:1,uz:0,half:.192,depth:.145};
  const here=p=>p.y>-.33&&p.y<1.6&&Math.abs(p.x)<HALL.half&&p.z>=HALL.zMin&&p.z<=HALL.zMax;
  world.movingBox(.27,-8.43,2.15,8.44,collision,here);
  actor.position.set(x,HALL.floor+.011,z);shadow.position.x=x;shadow.position.z=z;
  npc.pose(0,gait,0,0,0,0,2.34);
  const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  return (dt,p)=>{
    if(!dt||p.y<-.85||Math.abs(p.x)>15||Math.abs(p.z)>22)return false;
    acc+=dt;if(acc<1/30)return false;
    const s=acc;acc=0;t+=s;
    // Room-owned route and pause; the main lane remains clear even when stopped.
    const next=phase+s*.071,q=track(next);
    const near=here(p)&&Math.hypot(p.x-q[0],p.z-q[1])<.86;
    const moved=near?0:Math.hypot(q[0]-collision.x,q[1]-collision.z);
    if(!near){
      if(moved>.0001)heading+=angle(heading,Math.atan2(q[0]-collision.x,q[1]-collision.z))*(1-Math.exp(-s*4));
      phase=next;collision.x=q[0];collision.z=q[1];
    }
    gait=(gait+moved/.79)%1;
    motion+=(Math.min(.73,moved/s/.87)-motion)*(1-Math.exp(-s*7));
    const glance=here(p)&&Math.hypot(p.x-collision.x,p.z-collision.z)<2.8?
      Math.max(-.66,Math.min(.66,angle(heading,Math.atan2(p.x-collision.x,p.z-collision.z)))):0;
    look+=(glance-look)*(1-Math.exp(-s*4.6));
    collision.ux=Math.cos(heading);collision.uz=-Math.sin(heading);
    actor.position.set(collision.x,HALL.floor+.011,collision.z);actor.rotation.y=heading;
    shadow.position.x=collision.x;shadow.position.z=collision.z;shadow.rotation.y=heading;
    npc.pose(t,gait,motion,0,0,0,2.34,0,look);
    return true;
  };
}
