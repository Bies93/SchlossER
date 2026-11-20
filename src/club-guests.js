import {createHuman,humansAvailable} from './human-character.js';

const cast=[
  ['clubAda','Ada · Nachtprogramm',14.72,-12.45, .65],
  ['clubMira','Mira · Disco-Finger',17.90,-12.78,-.50],
  ['clubNiko','Niko · Seitenschritt',15.42,-9.68,.47],
  ['clubSami','Sami · Shuffle',18.92,-10.93,-.82],
  ['clubVeit','Veit · Letzter Tanz',14.41,-8.02,2.30]
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function clubGuests(T,root,hit,floor,still){
  if(!humansAvailable(T))return ()=>{};
  const geo=new T.PlaneGeometry(.85,.68);geo.rotateX(-Math.PI/2);
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec2 q;void main(){q=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 q;void main(){gl_FragColor=vec4(.036,.027,.031,.38*(1.-smoothstep(.045,.49,length(q))));}'});
  const group=new T.Group();group.name='Hopfenamt · Fünf Stammgäste';root.add(group);
  const guests=cast.map(([id,name,x,z,yaw],i)=>{
    const model=createHuman(T,id),shadow=new T.Mesh(geo,mat);model.actor.name=name;
    model.actor.position.set(x,floor+.044,z);model.actor.rotation.y=yaw;
    shadow.position.set(x,floor+.040,z);
    group.add(model.actor,shadow);
    hit(x-.21,x+.21,z-.19,z+.19);
    const activity=still?.24:1;model.dance(0,i*.77,i,0,activity);
    return {model,x,z,yaw,i,look:0,last:-Infinity,activity};
  });
  let elapsed=0,acc=0;
  return (dt,visitor,phase)=>{
    elapsed+=dt;acc+=dt;
    if(acc<1/(still?12:30))return;
    acc=0;
    const beat=phase??elapsed*(128*44100/2454261);
    for(const a of guests){
      const dx=visitor.x-a.x,dz=visitor.z-a.z,d=Math.hypot(dx,dz),
        off=Math.atan2(dx,dz)-a.yaw,angle=Math.atan2(Math.sin(off),Math.cos(off));
      if(d>8.5&&elapsed-a.last<.085)continue;
      const dtPose=Math.min(.115,elapsed-a.last);a.last=elapsed;
      const target=d<3.6&&Math.abs(angle)<.99?angle:0;
      a.look+=(target-a.look)*(1-Math.exp(-dtPose*5.5));
      const actor=a.model.actor;
      actor.rotation.y=a.yaw+a.look*.31+(!still?Math.sin((beat*.5+a.i)*Math.PI)*.13:0);
      const pause=(elapsed+a.i*4.71)%24>21.1;
      a.activity+=((still||pause||d<.93?.24:1)-a.activity)*(1-Math.exp(-dtPose*3.7));
      a.model.dance(elapsed,beat+a.i*.713,a.i,clamp(a.look*.69,-.72,.72),a.activity);
    }
  };
}
