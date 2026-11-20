import {ghoulTemplate} from './ghoul-model.js';
import {CHAPTER_PRISONER} from './chapter-layout.js';

// A scenic actor, not part of the hostile Ghoul system. Its authored route
// is always behind the bars, with no navmesh or target/attack behaviour.
export function makeChapterPrisoner(T,room,F){
  const rig=ghoulTemplate(T,'prison').instantiate(),{actor}=rig;
  actor.name='Kammer 07 · Gefangener in feldgrauer Uniform';
  rig.shadow(false);room.add(actor);
  const g=new T.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
  const shadow=new T.Mesh(g,new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec2 q;void main(){q=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 q;void main(){gl_FragColor=vec4(.03,.025,.023,(1.-smoothstep(.025,.49,length(q)))*.43);}' }));
  shadow.name='Kammer 07 · Bodenkontakt';shadow.scale.set(.92,1,.81);room.add(shadow);
  const [cx,cz]=CHAPTER_PRISONER,angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  let time=0,step=0,yaw=0,previous=cx,motion=0,speech=0;
  function turn(dt){
    time+=dt;const t=(time+2.40)%20,side=t<10?1:-1,f=(t%10),u=Math.min(1,f/7.3),
      easing=u*u*(3-2*u),x=cx+side*(easing*2-1)*1.82,z=cz-.38*Math.sin(Math.PI*u);
    const desired=f>7.3?0:Math.atan2(side,.32*Math.cos(Math.PI*u));
    yaw+=angle(yaw,desired)*Math.min(1,dt*2.15);
    const delta=Math.abs(x-previous);previous=x;
    if(dt>0&&delta<.2){
      step+=delta*1.65;motion+=(Math.min(.61,delta/dt*.89)-motion)*Math.min(1,dt*4);
    }
    speech=Math.max(0,speech-dt);
    const ago=4.85-speech,mouth=speech>0?.30+.51*Math.abs(Math.sin(ago*14.3))*(.5+.5*Math.sin(ago*5.7)**2):0;
    actor.position.set(x,F+.018,z);actor.rotation.y=yaw;
    shadow.position.set(x,F+.006,z+.031);
    rig.pose(time,step,motion,0,0,0,.46,mouth);
  }
  turn(0);
  return {turn,position:actor.position,speak(){speech=4.85;}};
}
