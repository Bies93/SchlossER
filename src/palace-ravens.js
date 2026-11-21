import {ravenModel} from './palace-raven-model.js';
import {contactShadow} from './palace-butler.js';
import {PORTALS} from './palace-openings.js';

const pi=Math.PI,flightLength=7.72,clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
const angle=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export const RAVEN_PERCHES=[[-2.36,PORTALS.west.z+4.72,.30],[2.09,PORTALS.west.z+5.15,-.48]];

export function addPalaceRavens(T,scene,floor,onCall){
  const root=new T.Group();root.name='Schlossplatz · Zwei Kolkraben';root.userData.noSceneQuery=true;scene.add(root);
  const model=ravenModel(T);
  const flock=RAVEN_PERCHES.map(([x,z,yaw],i)=>{
    const bird=i===0?model:model.clone(true),body=bird.children[0],head=body.children[0],tail=body.children[1],jaw=head.children[0];
    bird.name='Kolkrabe '+(i+1);root.add(bird);
    const y=floor(x,z),size=i?.947:1.045,sign=i?1:-1,bearing=i?.52:-.67;
    bird.scale.setScalar(size);bird.position.set(x,y,z);bird.rotation.y=yaw;
    const shade=contactShadow(T,root,x,y+.005,z,.50,.48);
    return {bird,body,head,tail,jaw,shade,x,y,z,yaw,sign,bearing,size,alive:true,fall:null,feathers:[],
      wings:body.children.filter(n=>n.name==='Flügelschulter'),
      folds:body.children.filter(n=>n.name==='Gefalteter Flügel'),
      feet:body.children.filter(n=>n.name==='Fänge')};
  });
  // One silhouette volume per bird, with no head multiplier or mesh raycast.
  const torso=new T.Sphere(new T.Vector3(),1),local=new T.Ray(),inverse=new T.Matrix4();
  const contact=new T.Vector3(),center=new T.Matrix4().makeTranslation(0,.26,-.019);
  const hull=new T.Matrix4().makeScale(.158,.169,.249).premultiply(center),matrix=new T.Matrix4();
  const feather=new T.BufferGeometry();
  feather.setAttribute('position',new T.Float32BufferAttribute([
    0,-.057,0, -.016,-.014,0, -.019,.025,.002, 0,.058,0, .013,.024,0, .011,-.022,0, 0,.012,.007
  ],3));
  feather.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);feather.computeVertexNormals();
  const plume=new T.InstancedMesh(feather,new T.MeshStandardMaterial({color:0x32313b,side:T.DoubleSide,roughness:.84}),24);
  plume.frustumCulled=false;plume.count=0;root.add(plume);
  const fxPose=new T.Object3D(),impact=new T.Vector3();
  for(const b of flock)for(let i=0;i<12;i++)b.feathers.push({p:new T.Vector3(),v:new T.Vector3(),time:0,roll:0});
  let alarm=0,clock=0,age=0,reset=0,phase='perched';
  function nearest(ray,limit){
    if(!root.visible||phase==='gone')return null;
    let best=null;
    for(const b of flock){
      if(!b.alive||!b.bird.visible||ray.origin.distanceToSquared(b.bird.position)>(limit+.7)**2)continue;
      b.body.updateWorldMatrix(true,false);
      matrix.multiplyMatrices(b.body.matrixWorld,hull);inverse.copy(matrix).invert();
      local.copy(ray).applyMatrix4(inverse);
      if(torso.containsPoint(local.origin))contact.copy(ray.origin);
      else if(local.intersectSphere(torso,contact))contact.applyMatrix4(matrix);
      else continue;
      const distance=contact.distanceTo(ray.origin);
      if(distance<limit){limit=distance;best={actor:b,distance,point:contact.clone(),head:false};}
    }
    return best;
  }
  function damage(b,at,direction){
    if(!b.alive||!b.bird.visible)return false;
    b.alive=false;
    if(phase==='perched'){phase='flight';age=0;}
    impact.set(0,0,0);if(direction)impact.copy(direction).normalize();
    const from=b.bird.position,air=from.y-floor(from.x,from.z);
    const glide=air>.16?2.2:0;
    b.fall={t:0,landed:null,side:b.sign,roll:b.body.rotation.z,pitch:b.body.rotation.x,
      vx:impact.x*.61+Math.sin(b.bird.rotation.y)*glide,
      vz:impact.z*.61+Math.cos(b.bird.rotation.y)*glide,vy:air>.16?.23:.13};
    for(const [i,f] of b.feathers.entries()){
      const a=i*2.399963+clock,s=.60+(i%4)*.22;
      f.time=.70+i*.031;f.roll=a;
      f.p.copy(at??b.bird.position);f.v.set(Math.cos(a)*s,.51+(i%5)*.18,Math.sin(a)*s).addScaledVector(impact,.39);
    }
    return true;
  }
  function fallTick(b,dt){
    const f=b.fall;
    if(!f)return false;
    f.t+=dt;
    const p=b.bird.position;
    if(f.landed===null){
      f.vy-=9.3*dt;p.x+=f.vx*dt;p.z+=f.vz*dt;p.y+=f.vy*dt;
      const ground=floor(p.x,p.z);
      if(p.y<=ground){p.y=ground;f.landed=f.t;b.shade.visible=false;}
    }else if(f.t-f.landed>.52){b.fall=null;return true;}
    const settle=f.landed===null?0:ease((f.t-f.landed)/.43),tip=ease(f.t/.36);
    b.body.rotation.set(f.pitch*(1-tip)-.08*tip,0,f.roll*(1-tip)+f.side*1.32*tip);
    // Sink the centre of mass as the feet fold; keep the shoulder above the paving.
    b.body.position.y=-.13*tip-.046*settle;
    b.head.rotation.set(.31*tip,-.27*f.side*tip,.34*f.side*tip);
    b.jaw.rotation.x=.06*tip;b.tail.rotation.set(.24*tip,0,-.11*f.side*tip);
    for(const [j,wing] of b.wings.entries()){
      const s=j===0?-1:1,open=(1-settle)*Math.sin(tip*pi*.63);
      wing.visible=settle<.96;b.folds[j].visible=settle>=.96;
      wing.rotation.set(.07*s*tip,s*.08,s*(.22+.61*open));
      wing.children[0].rotation.set(0,s*.19*tip,s*(-.22-.85*settle));
      b.feet[j].rotation.x=-.69*tip;
    }
    return true;
  }
  function featherTick(dt){
    const had=plume.count;let n=0;
    for(const b of flock)for(const f of b.feathers){
      if(f.time<=0)continue;
      f.time-=dt;if(f.time<=0)continue;
      f.v.y-=2.28*dt;f.v.multiplyScalar(Math.exp(-1.9*dt));f.p.addScaledVector(f.v,dt);
      fxPose.position.copy(f.p);fxPose.rotation.set(f.roll+f.time*7,f.roll*.67+f.time*5,f.roll*.37-f.time*8);
      fxPose.scale.setScalar(Math.min(1,f.time*3.3)*(1+(f.roll%1)*.41));
      fxPose.updateMatrix();plume.setMatrixAt(n++,fxPose.matrix);
    }
    plume.count=n;if(n)plume.instanceMatrix.needsUpdate=true;
    return n>0||had>0;
  }
  function pose(b,i,p,t){
    const {bird,body,head,tail,jaw,shade,bearing}=b;
    const a=t-(i?.245:.081),flying=phase!=='perched'&&a>0,launch=phase!=='perched'&&a>-.19;
    const r=flying?clamp(a/flightLength):0,start=ease(a/.31);
    const crouch=launch&&!flying?ease((a+.19)/.19):0;
    bird.visible=a<flightLength||phase==='perched';
    shade.visible=!flying||a<.18;
    if(flying){
      const width=(i?22:26)*r*(1.19-.19*r),forward=(i?53:62)*r*(.73+.27*r);
      const lift=3.82*Math.pow(r,.64)+15.3*r+.067*Math.sin(a*16.3)*(1-ease(a/2.4));
      bird.position.set(b.x+b.sign*width,b.y+Math.max(.01,lift),b.z+forward+.28*start);
      bird.rotation.y=b.yaw+angle(b.yaw,bearing)*ease(a/.32);
      body.rotation.x=-.24*start+.12*ease((a-1.15)/1.3);
      body.rotation.z=-b.sign*.21*Math.sin(ease(a/5.1)*pi);
      head.rotation.set(-.075*start,.066*Math.sin(a*2),0);
      tail.rotation.set(-.14*start,0,b.sign*.070);
      jaw.rotation.x=.105*Math.max(0,Math.cos((a-.11)*15))*(1-ease((a-1.54)/1.3));
    }else{
      bird.position.set(b.x,b.y,b.z);bird.rotation.y=b.yaw;
      body.rotation.set(.030+.08*crouch,0,.018*Math.sin(clock*1.37+i));
      head.rotation.x=.046*Math.sin(clock*2.2+i)-crouch*.21;
      const yaw=Math.atan2(p.x-b.x,p.z-b.z)-b.yaw,turn=Math.atan2(Math.sin(yaw),Math.cos(yaw));
      head.rotation.y=launch?Math.max(-.58,Math.min(.58,turn)):-.09+.30*Math.sin(clock*1.07+i*2.31);
      tail.rotation.set(.26+.055*Math.sin(clock*1.35+i),0,0);jaw.rotation.x=0;
    }
    for(const [j,wing] of b.wings.entries()){
      const s=j===0?-1:1;
      b.folds[j].visible=!flying;wing.visible=flying;
      if(flying){
        const cycle=a*17.1+1.2*Math.min(.69,a)+.31*i,glide=ease((a-2.12)/.78)*ease((7.48-a)/.69);
        wing.rotation.z=s*(.22+(1-glide)*.91*Math.sin(cycle));
        wing.rotation.y=s*(.20-.18*glide+.08*Math.cos(cycle));
        wing.children[0].rotation.z=s*(-.24+(1-glide)*.51*Math.sin(cycle-.62));
        wing.children[0].rotation.y=s*(.07+.10*Math.sin(cycle-.30));
      }
      b.feet[j].rotation.x=flying?-1.45*ease(a/.35):-.075*crouch;
    }
  }
  for(const [i,b] of flock.entries())pose(b,i,{x:0,z:20},0);
  return {nearest,damage,owns:b=>flock.includes(b),update(dt,p,surface){
    if(!dt||!surface)return false;
    let effects=featherTick(dt);
    for(const b of flock)if(!b.alive)effects=fallTick(b,dt)||effects;
    if(!flock.some(b=>b.alive))return effects;
    const distance=Math.min(Math.hypot(p.x-flock[0].x,p.z-flock[0].z),Math.hypot(p.x-flock[1].x,p.z-flock[1].z));
    const near=distance<25&&Math.abs(p.y-flock[0].y)<2.0;
    if(phase==='gone'){
      reset+=dt;
      if(reset<26||distance<15)return effects;
      phase='perched';clock=alarm=age=0;
      for(const [i,b] of flock.entries())if(b.alive)pose(b,i,p,0);
      return true;
    }
    if(phase==='perched'){
      if(!near)return false;
      if(distance<3.85){
        phase='flight';age=0;
      }else{
        clock+=dt;alarm+=dt;
        if(alarm<.064)return false;
        alarm=0;
        for(const [i,b] of flock.entries())if(b.alive)pose(b,i,p,0);
        return true;
      }
    }
    const before=age;age+=dt;clock+=dt;
    if(before<=.10&&age>.10){
      const bird=flock.find(b=>b.alive);
      onCall({x:bird.x,y:bird.y+.34,z:bird.z});
    }
    for(const [i,b] of flock.entries())if(b.alive)pose(b,i,p,age);
    if(age>=flightLength+.26){phase='gone';reset=0;}
    return true;
  }};
}
