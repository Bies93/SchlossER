import {architectureKit} from './architecture-kit.js';
import {sharedSet} from './surface-detail.js';
import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {CHAPTER_LAYER} from './chapter-layout.js';
import {ARCHIVE_CLERK,createArchiveStamp} from './chapter-archive.js';

const pi=Math.PI,TAU=2*pi,at=(x,y,z)=>[x,y,z];
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;

function dress(T,rig,kind,palette,cloth){
  const mount=rig.costumeMount('spine_03');
  mount.name='Bundestracht · '+kind;
  const neck=rig.restPoint('neck_01'),shoulder=rig.restPoint('upperarm_l');
  const w=Math.abs(shoulder.x),top=neck.y+.005,long=kind==='chair'?.534:kind==='archive'?.423:.355;
  const [velvet,lining,band]=palette;
  const matte=(color,roughness,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const materials={
    fabric:matte(velvet,.91,{...cloth,side:T.DoubleSide,normalScale:new T.Vector2(.54,.54)}),
    border:matte(lining,.89,{...cloth,side:T.DoubleSide}),
    ribbon:matte(band,.83,{...cloth,side:T.DoubleSide}),
    gilt:matte(0xc1a267,.43,{metalness:.63}),aged:matte(0x67533c,.69,{metalness:.48}),
    inset:matte(lining,.55),ink:matte(0x332227,.91)
  };
  const k=architectureKit(T,mount,materials),M=new T.Matrix4(),q=new T.Quaternion(),a=new T.Vector3(),dir=new T.Vector3(),
    scale=new T.Vector3(),up=new T.Vector3(0,1,0),e=new T.Euler(),rod=new T.CylinderGeometry(1,1,1,7),
    coin=new T.CylinderGeometry(1,1,1,18),bead=new T.SphereGeometry(1,10,7);
  function shape(mat,g,x,y,z,W,H,L,rx=0,ry=0,rz=0){
    k.geometry(mat,g,M.compose(a.set(x,y,z),q.setFromEuler(e.set(rx,ry,rz)),scale.set(W,H,L)));
  }
  function cord(mat,points,r){
    if(points.length<2)return;
    const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),points.length+4,r,5,false);
    k.geometry(mat,g,M.identity());g.dispose();
  }
  function line(mat,A,B,r){
    a.fromArray(A);dir.fromArray(B).sub(a);const l=dir.length();
    if(l>.001)k.geometry(mat,rod,M.compose(a.addScaledVector(dir,.5),q.setFromUnitVectors(up,dir.normalize()),scale.set(r,l,r)));
  }
  const gap0=.51,gap1=kind==='duel'?1.03:.80;
  function drape(u,v,bias=0){
    const open=mix(gap0,gap1,v),ang=open+(TAU-open*2)*u,dx=Math.sin(ang),dz=Math.cos(ang);
    const vol=ease(v/.40),pleat=Math.sin(ang*13+.9)*(.004+v*.012)+Math.sin(ang*6-.9)*v*.012;
    const rx=mix(.088,w+.114,vol)-.046*ease((v-.63)/.37);
    const rz=mix(.082,dz>0?.186:.151,vol)+pleat;
    const y=top-long*v+(v*v)*(Math.max(0,dz)*.102+Math.sin(ang*4)*.016);
    return [dx*(rx+pleat+bias),y,neck.z+dz*(rz+bias)+.004];
  }
  function clothStrip(mat,v0,v1){
    const rows=mat==='fabric'?12:2,sides=52,g=new T.BufferGeometry(),pos=[],uv=[],index=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){
      const u=i/sides,v=mix(v0,v1,j/rows);
      pos.push(...drape(u,v,mat==='fabric'?0:.0018));uv.push(u*2.25,v*1.10);
      if(i<sides&&j<rows){const n=j*(sides+1)+i;index.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
    }
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(index);g.computeVertexNormals();k.geometry(mat,g,M.identity());g.dispose();
  }
  clothStrip('fabric',0,1);clothStrip('border',.906,.990);
  for(const v of [.903,.991])cord('gilt',Array.from({length:40},(_,i)=>drape(i/39,v,.003)),.0027);
  for(const edge of [0,1]){
    cord('border',Array.from({length:18},(_,i)=>drape(edge,i/17,.003)),.009);
    cord('gilt',Array.from({length:18},(_,i)=>drape(edge,i/17,.012)),.0025);
  }
  cord('border',Array.from({length:28},(_,i)=>drape(i/27,.015,.004)),.013);
  // Broad ribbon under the mantle opening, enamel seal and engraved crown.
  const X=kind==='archive'?-.078:.072,Y=top-.254,Z=neck.z+.166;
  const ribbon=(v,x)=>[x+(1-v)*.112-.071,top-.14-v*.274,neck.z+.160+Math.sin(v*pi)*.022];
  for(let j=0;j<9;j++){
    const u=j/9,v=(j+1)/9;
    k.quad('ribbon',ribbon(v,-.028),ribbon(v,.028),ribbon(u,.028),ribbon(u,-.028),.26);
  }
  for(const x of [-.029,.029])cord('gilt',Array.from({length:13},(_,i)=>ribbon(i/12,x)),.0024);
  if(kind==='chair'){
    const chain=Array.from({length:17},(_,i)=>{
      const s=i/16*2-1;return [s*.123,top-.119-(1-s*s)*.099,neck.z+.142+(1-s*s)*.060];
    });
    cord('aged',chain,.004);
    chain.forEach(([x,y,z],i)=>shape('gilt',bead,x,y,z,.006,.006,.004,0,0,i%2?.7:0));
  }
  shape('aged',coin,X,Y,Z,.040,.012,.040,pi/2);
  shape('gilt',coin,X,Y,Z+.009,.034,.010,.034,pi/2);
  shape('inset',coin,X,Y,Z+.015,.026,.006,.026,pi/2);
  const crown=[[-.017,.007],[-.012,-.011],[.012,-.011],[.017,.007],[.007,.001],[0,.012],[-.007,.001],[-.017,.007]];
  for(let j=1;j<crown.length;j++)line('gilt',[X+crown[j-1][0],Y+crown[j-1][1],Z+.020],
    [X+crown[j][0],Y+crown[j][1],Z+.020],.0019);
  for(const s of [-1,1])for(let j=0;j<3;j++){
    const P=drape(s<0?.041:.959,.150+j*.084,.008);
    shape('gilt',bead,...P,.0060,.0060,.0060);
  }
  k.flush('Einzelne Lagen, Paspel und Bundessiegel');
  for(const g of [rod,coin,bead])g.dispose();
}

export function chapterMembers(T,rooms,world,F,isBelow){
  if(!humansAvailable(T))return {update:()=>false};
  const zChair=-38.93,xChair=10.486,stand=10.803,turn=12.79,len=turn-stand,forward=pi/2;
  const riser=x=>x<10.746?.309:x<10.894?.162:0;
  const seatedFloor=F+.162,seatHeight=.806-.162;
  const cloth=sharedSet(T,'canvas',512);
  const roster=[
    ['chapterOskar','chapter','chair',xChair,zChair,forward,[0x703340,0x32252d,0x54272e]],
    ['chapterMatthias','archive','archive',ARCHIVE_CLERK.x,ARCHIVE_CLERK.z,ARCHIVE_CLERK.yaw,[0x4c5143,0x423b28,0x918063]],
    ['chapterKonrad','duel','duel',24.94,-54.08,-.70,[0x293d50,0x4f3a35,0x572e34]]
  ];
  const cast=roster.map(([id,roomId,kind,x,z,yaw,palette],i)=>{
    const room=rooms.get(roomId),rig=createHuman(T,id),{actor,npcInfo}=rig;
    actor.position.set(x,rig.groundedY(kind==='chair'?seatedFloor:F),z);actor.rotation.y=yaw;
    room.add(actor);rig.shadow(false);dress(T,rig,kind,palette,cloth);
    actor.traverse(o=>o.layers.set(CHAPTER_LAYER));
    const shadow=npcInfo.shadow=contactShadow(T,room,x,(kind==='chair'?F+.319:F+.014),z,.67,.64);
    const state={rig,actor,shadow,room,kind,x,z,yaw,t:i+1,cycle:9,say:0,glance:0,acc:0};
    npcInfo.speak=(s=3.4)=>{state.say=Math.max(state.say,s);};
    const collides=p=>isBelow(p)&&Math.abs(p.y-F)<.72&&rig.alive();
    if(kind==='chair'){
      state.collider={x,z,ux:0,uz:-1,half:.226,depth:.232};
      world.movingBox(x-.4,z-.45,turn+.42,z+.45,state.collider,collides);
      rig.chairPose(state.t,seatHeight,1);
    }else{
      world.circle(x,z,.215,collides);
      if(kind==='archive'){
        state.work=createArchiveStamp(T,room,F);state.stampPose=rig.archivePose();
        state.attention=0;state.work.tick(1.3);state.stampPose(state.t,state.work);
      }else rig.factoryPose(state.t,'trainer');
    }
    return state;
  });
  const outbound=(s,out)=>{out.x=stand+s;out.z=zChair;out.yaw=forward;};
  const inbound=(s,out)=>{out.x=turn-s;out.z=zChair;out.yaw=-forward;};
  function chair(a,dt,p,talk){
    const t=a.cycle,nearLane=Math.abs(p.z-zChair)<.62&&p.x>=xChair-.19&&p.x<=turn+.60;
    if(a.say<=0&&!nearLane)a.cycle=(t+dt)%42;
    const travel=len/.85,walkBack=25+.86+travel+2.20,endWalk=walkBack+travel,turnBack=endWalk+.94;
    let x=xChair,y=seatedFloor,yaw=forward,weight=1,path,d;
    if(t>=25&&t<25.86){const s=ease((t-25)/.86);x=mix(xChair,stand,s);weight=1-s;}
    else if(t>=25.86&&t<25.86+travel){path=outbound;d=Math.min(len,(t-25.86)*.85);x=stand+d;y=F+riser(x);weight=0;}
    else if(t>=25.86+travel&&t<walkBack){
      x=turn;y=F;yaw=forward+pi*ease((t-25.86-travel-.70)/1.04);weight=0;
    }else if(t>=walkBack&&t<endWalk){
      path=inbound;d=Math.min(len,(t-walkBack)*.85);x=turn-d;y=F+riser(x);yaw=-forward;weight=0;
    }else if(t>=endWalk&&t<turnBack){
      x=stand;yaw=-forward+pi*ease((t-endWalk)/.94);weight=0;
    }else if(t>=turnBack&&t<turnBack+.89){const s=ease((t-turnBack)/.89);x=mix(stand,xChair,s);weight=s;}
    a.actor.position.set(x,a.rig.groundedY(y),zChair);a.actor.rotation.y=yaw;
    a.collider.x=x;a.collider.ux=Math.cos(yaw);a.collider.uz=-Math.sin(yaw);
    a.shadow.position.x=x;a.shadow.position.y=F+riser(x)+.008;
    // Idle or conversational poses don't drag the planted feet down the aisle.
    if(path&&!nearLane&&a.say<=0)a.rig.walk(a.t,d,path,y,a.glance,0);
    else a.rig.chairPose(a.t,seatHeight,weight,a.glance,talk);
  }
  return {update(dt,p){
    let changed=false;
    for(const a of cast){
      if(a.kind==='archive'&&!a.rig.controllable())a.work.park();
      if(!a.room.visible||!a.rig.controllable()||Math.abs(p.y-F)>2.0||
        Math.hypot(a.actor.position.x-p.x,a.actor.position.z-p.z)>9.6){a.acc=0;continue;}
      a.acc+=dt;if(a.acc<.039)continue;
      const step=Math.min(.082,a.acc);a.acc=0;a.t+=step;a.say=Math.max(0,a.say-step);
      const off=Math.atan2(p.x-a.actor.position.x,p.z-a.actor.position.z)-a.actor.rotation.y;
      const target=a.say>0?Math.max(-.76,Math.min(.76,Math.atan2(Math.sin(off),Math.cos(off)))):0;
      a.glance+=(target-a.glance)*Math.min(1,step*5.2);
      const talk=a.say>0?.18+.16*Math.abs(Math.sin(a.t*15)):0;
      if(a.kind==='chair')chair(a,step,p,talk);
      else if(a.kind==='archive'){
        a.attention+=((a.say>0?1:0)-a.attention)*Math.min(1,step*5.2);
        a.work.tick(step*(1-a.attention));
        a.stampPose(a.t,a.work,a.glance,talk,a.attention);
      }
      else a.rig.factoryPose(a.t,'trainer',a.glance,talk);
      changed=true;
    }
    return changed;
  }};
}
