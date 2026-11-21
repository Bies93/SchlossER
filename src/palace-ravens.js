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
    return {bird,body,head,tail,jaw,shade,x,y,z,yaw,sign,bearing,size,
      wings:body.children.filter(n=>n.name==='Flügelschulter'),
      folds:body.children.filter(n=>n.name==='Gefalteter Flügel'),
      feet:body.children.filter(n=>n.name==='Fänge')};
  });
  let alarm=0,clock=0,age=0,reset=0,phase='perched';
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
  return {update(dt,p,surface){
    if(!dt||!surface)return false;
    const distance=Math.min(Math.hypot(p.x-flock[0].x,p.z-flock[0].z),Math.hypot(p.x-flock[1].x,p.z-flock[1].z));
    const near=distance<25&&Math.abs(p.y-flock[0].y)<2.0;
    if(phase==='gone'){
      reset+=dt;
      if(reset<26||distance<15)return false;
      phase='perched';clock=alarm=age=0;
      for(const [i,b] of flock.entries())pose(b,i,p,0);
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
        for(const [i,b] of flock.entries())pose(b,i,p,0);
        return true;
      }
    }
    const before=age;age+=dt;clock+=dt;
    if(before<=.10&&age>.10){
      const bird=flock[0];
      onCall({x:bird.x,y:bird.y+.34,z:bird.z});
    }
    for(const [i,b] of flock.entries())pose(b,i,p,age);
    if(age>=flightLength+.26){phase='gone';reset=0;}
    return true;
  }};
}
