import {createHuman} from './human-character.js';
import {randomSource} from './surface-detail.js';
import {insidePerimeter} from './world-layout.js';

export const GHOUL_COUNT=5;
const anchors=[[-11.8,-30.2],[16.1,-33.6],[-24.7,-53.4],[22.5,-61.7],[31.0,-83.4]];
const MINX=-70,MAXX=70,MINZ=-249,MAXZ=-18.7,CELL=2.35;
const W=Math.floor((MAXX-MINX)/CELL)+1,H=Math.floor((MAXZ-MINZ)/CELL)+1;
const here=(x,z)=>x>=MINX&&x<=MAXX&&z>=MINZ&&z<=MAXZ;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x)),mix=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const angular=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

// Small cached route grid on the game collision surface. A clear local line
// needs no search; routes are recomputed only on a staggered timer.
function gardenRoutes(world){
  const free=new Uint8Array(W*H),cost=new Float32Array(W*H),prev=new Int32Array(W*H),done=new Uint8Array(W*H);
  const cell=(x,z)=>clamp(Math.round((z-MINZ)/CELL),0,H-1)*W+clamp(Math.round((x-MINX)/CELL),0,W-1);
  const center=i=>[MINX+(i%W)*CELL,MINZ+Math.floor(i/W)*CELL];
  function usable(x,z){return here(x,z)&&insidePerimeter(x,z)&&!world.blocked(x,z)}
  function clear(ax,az,bx,bz){
    const d=Math.hypot(bx-ax,bz-az),steps=Math.max(1,Math.ceil(d/.57));
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      if(!usable(mix(ax,bx,t),mix(az,bz,t)))return false;
    }return true;
  }
  function ok(i){
    if(!free[i])free[i]=usable(...center(i))?1:2;
    return free[i]===1;
  }
  function closest(x,z){
    const mid=cell(x,z),col=mid%W,row=Math.floor(mid/W);
    let best=-1,min=Infinity;
    for(let j=-2;j<=2;j++)for(let k=-2;k<=2;k++){
      const xx=col+k,zz=row+j,n=zz*W+xx;
      if(xx<0||xx>=W||zz<0||zz>=H||!ok(n))continue;
      const end=center(n),r=Math.hypot(end[0]-x,end[1]-z);
      if(r<min&&clear(x,z,...end)){min=r;best=n}
    }
    return best;
  }
  function route(ax,az,bx,bz){
    if(clear(ax,az,bx,bz))return [[bx,bz]];
    const start=closest(ax,az),end=closest(bx,bz);
    if(start<0||end<0)return [];
    const [goalX,goalZ]=center(end);
    const score=i=>{const [x,z]=center(i);return cost[i]+Math.hypot(x-goalX,z-goalZ)};
    prev.fill(-1);done.fill(0);cost.fill(Infinity);cost[start]=0;
    const open=[start];let budget=0;
    while(open.length&&budget++<510){
      let at=0,val=Infinity;
      for(let i=0;i<open.length;i++){const v=score(open[i]);if(v<val){val=v;at=i}}
      const id=open.splice(at,1)[0];
      if(done[id])continue;done[id]=1;
      if(id===end){
        const out=[];let k=id;
        while(k>=0){out.push(center(k));k=prev[k]}
        out.reverse();out.push([bx,bz]);
        while(out.length>1&&clear(ax,az,...out[1]))out.shift();
        return out;
      }
      const x=id%W,z=Math.floor(id/W);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){
        const u=x+dx,v=z+dz,n=v*W+u;
        if(u<0||u>=W||v<0||v>=H||done[n]||!ok(n))continue;
        const travel=cost[id]+CELL*(dx&&dz?Math.SQRT2:1);
        if(travel>=cost[n]||!clear(...center(id),...center(n)))continue;
        cost[n]=travel;prev[n]=id;open.push(n);
      }
    }
    return [];
  }
  return {clear,route,usable};
}

export function ghoulRound(T,scene,world,floorHeight,notify,voice=()=>{}){
  const nav=gardenRoutes(world),root=new T.Group();root.name='Schlossgarten · Ghoule';root.userData.noSceneQuery=true;scene.add(root);
  const rng=randomSource(238019),V=(a,b,c)=>new T.Vector3(a,b,c),point=V(0,0,0);
  const dust=new T.SphereGeometry(1,6,4);
  const groundGeometry=new T.PlaneGeometry(1,1);groundGeometry.rotateX(-Math.PI/2);
  const shadowMat=new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{},
    vertexShader:'varying vec2 q;void main(){q=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 q;void main(){float v=1.-smoothstep(.02,.49,length(q));gl_FragColor=vec4(.025,.026,.024,v*.30);}'
  });
  let pool=[],state='idle',clock=0,last=null,standing=GHOUL_COUNT,cooldown=0,pulseSerial=0;
  const inside=(p)=>p.y>-.64&&here(p.x,p.z)&&insidePerimeter(p.x,p.z);
  function allocate(){
    for(let i=0;i<GHOUL_COUNT;i++){
      const variant=['ghoulA','ghoulB','ghoulC','ghoulB','ghoulA'][i];
      const rig=createHuman(T,variant),shadow=new T.Mesh(groundGeometry,shadowMat);
      shadow.name='Ghoul · Bodenkontakt';shadow.scale.set(1.04,1,1.03);shadow.renderOrder=1;
      rig.shadow(false);rig.actor.visible=shadow.visible=false;root.add(rig.actor,shadow);
      const sparks=new T.InstancedMesh(dust,new T.MeshBasicMaterial({color:0x9bad5b,transparent:true,
        opacity:.62,depthWrite:false}),11);
      sparks.frustumCulled=false;sparks.visible=false;sparks.renderOrder=3;
      root.add(sparks);
      pool.push({rig,shadow,sparks,id:i,origin:[0,0],sparkOrigin:V(0,0,0),health:100,alert:false,mode:'roam',phase:rng(),
        motion:0,v:0,flinch:0,tAttack:-1,lastAttack:-7,fall:0,vanished:false,cached:null,path:[],planAt:0,
        gait:.97+rng()*.08,seed:rng()*TAU,birth:0});
    }
  }
  function safeAnchor(x,z,p,taken){
    for(let i=0;i<193;i++){
      const a=i*2.39996,r=i===0?0:.755*Math.sqrt(i);
      const u=x+Math.cos(a)*r,v=z+Math.sin(a)*r;
      if(Math.hypot(p.x-u,p.z-v)<7.3||!nav.usable(u,v)||taken.some(t=>Math.hypot(t[0]-u,t[1]-v)<3.7))continue;
      return [u,v];
    }
    return null;
  }
  function begin(p){
    if(!inside(p)||state!=='idle')return false;
    const starts=[];
    for(const [x,z] of anchors){
      const q=safeAnchor(x,z,p,starts);
      if(!q)return false;
      starts.push(q);
    }
    if(!pool.length)allocate();
    state='running';standing=starts.length;cooldown=0;
    for(const [i,g] of pool.entries()){
      const [x,z]=starts[i];
      g.origin=[x,z];g.health=100;g.alert=false;g.mode='emerge';g.motion=g.v=g.flinch=g.fall=0;
      g.planAt=clock+i*.18;g.birth=clock+i*.24;g.vanished=false;
      g.nextVoice=clock+1.9+i*.54;
      g.tAttack=-1;g.lastAttack=clock-6;g.attackDone=false;g.cached=null;g.impact=null;g.path.length=0;
      const o=g.rig.actor;o.position.set(x,floorHeight(x,z),z);o.rotation.y=Math.atan2(p.x-x,p.z-z);
      o.scale.setScalar(g.gait);o.visible=false;g.shadow.visible=false;g.sparks.visible=false;
      g.rig.pose(clock,g.phase,0,0,0,0,g.seed);
    }
    notify('Fünf Ghoule sind im Schlossgarten.','start');
    return true;
  }
  function nearest(ray,limit){
    if(state!=='running')return null;
    let best=limit,candidate=null;
    for(const g of pool){
      if(g.health<=0||g.mode==='emerge'||!g.rig.actor.visible)continue;
      const a=g.rig.actor.position;
      if((ray.origin.x-a.x)**2+(ray.origin.z-a.z)**2>(limit+1.4)**2)continue;
      for(const s of g.cached??=g.rig.hitShapes()){
        if(!ray.intersectSphere(s.sphere,point))continue;
        const distance=ray.origin.distanceTo(point);
        if(distance<best){
          best=distance;candidate={actor:g,distance,point:point.clone(),head:s.head};
        }
      }
    }
    return candidate;
  }
  function damage(g,n,color,impactPoint){
    if(state!=='running'||g.health<=0||g.mode==='emerge'||!Number.isFinite(n)||n<=0)return false;
    g.health=Math.max(0,g.health-n);g.alert=true;g.flinch=.26;g.planAt=clock;
    voice(g.health===0?'down':'hit',g.rig.actor.position);
    g.sparks.material.color.setHex(color);g.impact=clock;g.serial=++pulseSerial;
    if(impactPoint)g.sparkOrigin.copy(impactPoint);
    else {g.sparkOrigin.copy(g.rig.actor.position);g.sparkOrigin.y+=1.18}
    if(g.health===0){
      standing--;g.mode='down';g.fall=clock;g.tAttack=-1;g.v=0;
      if(standing===0){state='won';notify('Alle fünf Ghoule abgewehrt.','won')}
      else notify('Ghoul abgewehrt · '+(GHOUL_COUNT-standing)+' von '+GHOUL_COUNT,'progress');
    }else if(g.tAttack>=0){
      g.tAttack=-1;g.lastAttack=clock-.18;
    }
    return true;
  }
  const o=new T.Object3D();
  function effect(g){
    if(g.impact==null){g.sparks.visible=false;return false}
    const a=g.sparkOrigin,age=clock-g.impact,duration=g.health<=0?.69:.24;
    g.sparks.visible=age>=0&&age<duration;
    if(!g.sparks.visible)return false;
    const k=age/duration;
    for(let i=0;i<g.sparks.count;i++){
      const t=i*2.399+g.serial*.43,d=(.111+i*.012)+(g.health<=0?.58:.26)*k;
      o.position.set(a.x+Math.cos(t)*d,a.y+.28*k+Math.sin(i*2.6)*.16,
        a.z+Math.sin(t)*d);
      o.scale.setScalar((.017+i%3*.007)*(1-k*.83));o.updateMatrix();g.sparks.setMatrixAt(i,o.matrix);
    }
    g.sparks.material.opacity=(1-k)*.71;g.sparks.instanceMatrix.needsUpdate=true;
    return true;
  }
  function stop(){last=null}
  function tick(time,p){
    const dt=last===null?0:Math.min(.082,(time-last)/1000);last=time;clock+=dt;
    if(!pool.length)return false;
    const tracking=inside(p),motionState=state==='running',nearPlayer=g=>Math.hypot(g.rig.actor.position.x-p.x,g.rig.actor.position.z-p.z);
    let dirty=false;
    for(const g of pool){
      g.cached=null;
      const a=g.rig.actor,at=a.position;
      if(g.mode==='emerge'){
        if(!motionState||!tracking||clock<g.birth)continue;
        const t=clamp((clock-g.birth)/.54,0,1);
        a.visible=true;g.shadow.visible=true;a.scale.setScalar(g.gait*(.745+t*.255));
        if(t>=1)g.mode='roam';
        g.shadow.position.copy(at);g.shadow.position.y+=.012;dirty=true;continue;
      }
      if(g.mode==='down'){
        const t=clamp((clock-g.fall)/1.12,0,1);
        if(g.vanished)continue;
        g.rig.pose(clock,g.phase,0,0,.30*(1-t),t*t,g.seed);
        a.visible=true;g.shadow.visible=t<1;g.vanished=t>=1;
        effect(g);dirty=true;continue;
      }
      if(!motionState){if(a.visible){a.visible=g.shadow.visible=g.sparks.visible=false;dirty=true}continue}
      if(!tracking)continue;
      const distance=nearPlayer(g),previousX=at.x,previousZ=at.z;
      if(distance>113&&!g.alert)continue; // no idle animation far from the current walk
      if(tracking&&distance<32)g.alert=true;
      if(distance<23&&clock>=g.nextVoice){
        voice('idle',at);g.nextVoice=clock+5.3+rng()*5.1;
      }
      const chase=tracking&&g.alert&&distance<56,
        goalX=chase?p.x:g.origin[0]+Math.sin(clock*.39+g.seed)*1.57,
        goalZ=chase?p.z:g.origin[1]+Math.sin(clock*.23+g.seed+1.2)*1.82;
      let attack=0,go=chase?1.48+g.seed*.062:.57;
      const clearBite=chase&&distance<1.74&&Math.abs(p.y-at.y)<.62&&nav.clear(at.x,at.z,p.x,p.z);
      if(g.tAttack<0&&clearBite&&clock-g.lastAttack>1.23&&g.flinch<=0){
        g.tAttack=clock;g.attackDone=false;
        voice('attack',at);
      }
      if(g.tAttack>=0){
        const age=clock-g.tAttack;
        attack=Math.sin(clamp(age/.53,0,1)*Math.PI);
        go=0;
        if(age>=.30&&!g.attackDone){
          g.attackDone=true;
          if(clearBite&&clock>=cooldown){
            cooldown=clock+.77;notify('Der Ghoul hat dich erwischt.','hurt');
          }
        }
        if(age>.58){g.lastAttack=clock;g.tAttack=-1}
      }else if(clearBite)go=0;
      if(distance<1.02)go=0;
      if(g.flinch>0){g.flinch=Math.max(0,g.flinch-dt);go*=.29}
      g.v+=(go-g.v)*(1-Math.exp(-dt*9));
      if(!chase)g.direct=false;
      if(clock>=g.planAt){
        g.direct=chase&&nav.clear(at.x,at.z,goalX,goalZ);
        g.path=g.direct?[]:nav.route(at.x,at.z,goalX,goalZ);
        g.planAt=clock+(chase?.72:1.36)+g.id*.078;
      }
      while(g.path.length&&Math.hypot(g.path[0][0]-at.x,g.path[0][1]-at.z)<.39)g.path.shift();
      const waypoint=g.direct?[goalX,goalZ]:(g.path[0]??(chase?null:[goalX,goalZ]));
      let dx=(waypoint?.[0]??at.x)-at.x,dz=(waypoint?.[1]??at.z)-at.z,d=Math.hypot(dx,dz),size=Math.min(dt*g.v,d);
      if(d>.001&&size>0){
        dx*=size/d;dz*=size/d;
        for(const other of pool){
          if(other===g||other.health<=0||!other.rig.actor.visible)continue;
          const q=other.rig.actor.position,away=Math.hypot(at.x-q.x,at.z-q.z);
          if(away>.01&&away<.94){
            const k=dt*.69*(.94-away)/away;
            dx+=(at.x-q.x)*k;dz+=(at.z-q.z)*k;
          }
        }
        const next={x:at.x,z:at.z};
        world.move(next,dx,dz);
        if(nav.usable(next.x,next.z)){
          at.set(next.x,floorHeight(next.x,next.z),next.z);
        }
      }
      const moved=Math.hypot(at.x-previousX,at.z-previousZ);
      const heading=chase&&(g.tAttack>=0||distance<2.2)?Math.atan2(p.x-at.x,p.z-at.z):
        moved>.001?Math.atan2(at.x-previousX,at.z-previousZ):a.rotation.y;
      a.rotation.y+=angular(a.rotation.y,heading)*(1-Math.exp(-dt*8));
      g.phase=(g.phase+moved/.85)%1;
      g.motion+=(clamp(moved/Math.max(.001,dt)/1.48,0,1)-g.motion)*(1-Math.exp(-dt*11));
      g.rig.pose(clock,g.phase,g.motion,attack,g.flinch/.26,0,g.seed);
      g.shadow.position.copy(at);g.shadow.position.y+=.011;g.shadow.rotation.y=a.rotation.y;
      effect(g);dirty=true;
    }
    return dirty;
  }
  async function prepare(renderer,camera){
    if(!pool.length)allocate();
    const vp=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4()),test=renderer.getScissorTest(),
      shadow=renderer.shadowMap.needsUpdate,meshes=[];
    try{
      for(const g of pool){g.rig.actor.visible=true;g.rig.actor.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});}
      await renderer.compileAsync(scene,camera);
      renderer.setViewport(0,0,32,32);renderer.setScissor(0,0,32,32);renderer.setScissorTest(true);
      renderer.render(scene,camera);
    }finally{
      for(const g of pool)g.rig.actor.visible=false;
      for(const [o,flag] of meshes)o.frustumCulled=flag;
      renderer.setViewport(vp);renderer.setScissor(sc);renderer.setScissorTest(test);renderer.shadowMap.needsUpdate=shadow;
    }
  }
  return {begin,tick,stop,nearest,damage,inside,prepare};
}
