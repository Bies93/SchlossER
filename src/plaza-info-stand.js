import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {sharedSet} from './surface-detail.js';
import {standOutfits} from './plaza-info-outfits.js';
import {addInfoFlags} from './plaza-info-flags.js';
import {INFO_MOTTO,PRIDE_TITLE,CLIMATE_MOTTO,infoArt} from './plaza-info-art.js';

export const INFO_SITE=Object.freeze({x:-6.8,z:18.85,half:1.38});
export const INFO_CAST=Object.freeze([
  {id:'infoHeide',x:-1.53,z:1.76,yaw:.28},
  {id:'infoLuisa',x:.10,z:.38,yaw:-.13},
  {id:'infoGrete',x:1.66,z:1.28,yaw:-.39}
]);

export function addPlazaInfoStand(T,scene,world,floorAt){
  const {x,z,half}=INFO_SITE,y=floorAt(x,z),root=new T.Group();
  root.name='Schlossplatz · grüner Infostand';root.position.set(x,y,z);scene.add(root);
  const V=(...p)=>new T.Vector3(...p),cloth=sharedSet(T,'canvas',128),oak=sharedSet(T,'fineOak',256);
  const art=infoArt(T),M=(color,roughness=.82,props={})=>new T.MeshStandardMaterial({color,roughness,...props});
  const tent=M(0x356247,.93,{...cloth,side:T.DoubleSide}),edge=M(0x3b7150,.88,cloth),pole=M(0x485948,.61,{metalness:.33});
  const dark=M(0x343a30,.84),wood=M(0x946647,.84,oak),boxWood=M(0x725038,.89,oak),paper=M(0xe1cdac,.97);
  const brass=M(0xa88e53,.58,{metalness:.43}),thread=M(0xcab78d,.94),mark=M(0xffffff,.86,{map:art.seal});
  const ink=M(0xffffff,.89,{map:art.flyer}),cream=M(0xf7edcd,.97),bottle=M(0x537354,.27,{metalness:.13});
  const balloon=M(0xfff6de,.34,{map:art.balloon}),greenBalloon=M(0xc5d791,.41,{map:art.balloon});
  function add(g,m,X=0,Y=0,Z=0,name='',parent=root){
    const o=new T.Mesh(g,m);o.position.set(X,Y,Z);o.name=name;o.receiveShadow=true;parent.add(o);return o;
  }
  const cube=new RoundedBoxGeometry(1,1,1,1,.035),sphere=new T.SphereGeometry(1,18,12),up=V(0,1,0);
  function box(m,w,h,d,X,Y,Z,name=''){
    const o=add(cube,m,X,Y,Z,name);o.scale.set(w,h,d);return o;
  }
  const slender=new T.CylinderGeometry(1,1,1,7),knot=new T.ConeGeometry(.014,.026,10);
  function rod(a,b,r,m,parent=root){
    const o=add(slender,m,0,0,0,'',parent),v=V().subVectors(b,a);
    o.position.copy(a).lerp(b,.5);o.scale.set(r,v.length(),r);
    o.quaternion.setFromUnitVectors(up,v.normalize());return o;
  }
  function patch(nx,ny,point){
    const p=[],uv=[],ix=[];
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/ny;p.push(...point(u,v));uv.push(u,1-v);
      if(i<nx&&j<ny){const a=j*(nx+1)+i,b=a+nx+1;ix.push(a,b,a+1,b,b+1,a+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
  }
  // Open-sided, square tension roof: four green cloth panels and matching hems.
  const eave=2.14,rise=.70,span=half+.065,TW=Math.PI*.5;
  for(let side=0;side<4;side++){
    const roof=add(patch(14,9,(u,v)=>[(2*u-1)*span*(1-.993*v),eave+rise*v-
      (.024+.078*Math.sin(v*Math.PI))*Math.sin(u*Math.PI)*(1-v),span*(1-.993*v)]),tent,0,0,0,'Pavillon · grünes Spannfeld');
    roof.rotation.y=side*TW;roof.castShadow=true;
    if(side===0){
      // Project the print in plan so the rows of type do not pinch as the
      // triangular roof panel narrows near its crown.
      const g=roof.geometry.clone(),p=g.attributes.position,uv=g.attributes.uv;
      for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)/(2*span),1-p.getZ(i)/span);
      const print=add(g,M(0xffffff,.94,{map:art.flags.roof,side:T.BackSide,alphaTest:.21,
        polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-3}),0,.002,0,CLIMATE_MOTTO);
      print.userData.noSceneQuery=true;
    }
    const hem=add(patch(14,3,(u,v)=>[(u-.5)*span*2,eave-.024*Math.sin(u*Math.PI)-.165*v-
      .018*v*Math.sin(u*Math.PI),span+.003+.012*Math.sin(u*Math.PI)*v]),tent,0,0,0,'Pavillon · Stoffkante');
    hem.rotation.y=side*TW;
    const angle=side*TW;
    for(const [ay,az,r] of [[eave-.005,span,.009],[eave-.169,span+.009,.009]]){
      const a=V(-span,ay,az).applyAxisAngle(up,angle),b=V(span,ay,az).applyAxisAngle(up,angle);
      rod(a,b,r,edge);
    }
  }
  const windFlags=addInfoFlags(T,root,world,floorAt,art.flags,cloth);
  const onSurface=p=>Math.abs(p.y-y)<1.10;
  for(const X of [-half,half])for(const Z of [-half,half]){
    rod(V(X,.047,Z),V(X,eave-.008,Z),.022,pole).name='Pavillon · Gestänge';
    rod(V(X,eave-.074,Z),V(0,eave+rise-.041,0),.015,pole);
    box(dark,.139,.045,.139,X,.023,Z);box(edge,.073,.085,.073,X,eave-.122,Z);
    world.circle(x+X,z+Z,.068,onSurface);
  }
  const x0=-1.015,x1=1.015,z0=.79,z1=1.54,top=.82;
  const tabletop=box(wood,x1-x0,.063,z1-z0,0,top-.027,(z0+z1)*.5,'Infotisch · Holzplatte');tabletop.castShadow=true;
  for(const X of [-.89,.89])for(const Z of [.89,1.44]){
    rod(V(X,.036,Z),V(X,top-.053,Z),.027,pole);
    box(dark,.072,.035,.069,X,.018,Z);
  }
  for(const X of [-.89,.89])rod(V(X,.15,1.44),V(X,.63,.893),.013,pole);
  box(boxWood,1.91,.043,.042,0,.741,z1-.041);
  world.box(x+x0,z+z0,x+x1,z+z1,onSurface);
  const banner=add(patch(28,9,(u,v)=>[(u-.5)*(1.97-.025*v),.815-v*.675-
    .023*Math.sin(u*Math.PI)*v,z1+.046+.020*Math.sin(u*7*Math.PI+.32*v)*v+.026*Math.sin(v*Math.PI)]),
    M(0xffffff,.96,{map:art.cloth,normalMap:cloth.normalMap,normalScale:new T.Vector2(.24,.24),side:T.DoubleSide}),0,0,0,INFO_MOTTO);
  banner.castShadow=true;
  for(const X of [-.94,.94]){
    add(new T.TorusGeometry(.018,.003,6,14),brass,X,.789,z1+.059,'Banner · Öse');
    rod(V(X,.780,z1+.060),V(X,.827,z1-.024),.005,thread);
  }

  // Paper stacks, a zip folder, and a jumble of period table props.
  for(const [X,Z,R,N] of [[-.61,1.22,-.31,5],[-.21,1.15,.11,4]]){
    for(let j=0;j<N;j++)box(j%2?paper:cream,.166,.003,.218,X+j*.001,top+.008+j*.003,Z+j*.002).rotation.y=R+j*.017;
    const sheet=add(new T.PlaneGeometry(.166,.218),ink,X+.004,top+.011+N*.003,Z+.007,'Flugblatt · zum Mitnehmen');sheet.rotation.set(-TW,0,R+.041);
  }
  const rainbowFlyer=M(0xffffff,.93,{map:art.prideFlyer});
  for(const [X,Z,R,N] of [[.28,1.30,-.16,6],[.51,1.17,.15,4]]){
    for(let j=0;j<N;j++)box(j%2?paper:cream,.169,.003,.230,X+j*.004,top+.008+j*.003,Z+j*.001).rotation.y=R+j*.025;
    const f=add(new T.PlaneGeometry(.169,.230),rainbowFlyer,X+(N-1)*.004,top+.007+N*.003,Z+(N-1)*.001,'Regenbogenflyer · '+PRIDE_TITLE);
    f.rotation.set(-TW,0,-R-.025*(N-1));
  }
  const extra=add(patch(6,5,(u,v)=>[(u-.5)*.165,.003*Math.sin(v*5)+.003*u,v*.222]),rainbowFlyer,
    .070,top+.012,1.31,'Regenbogenflyer · loses Blatt');
  extra.rotation.y=.33;
  const easel=new T.Group();easel.name='Aufsteller · '+PRIDE_TITLE;easel.position.set(-.413,top+.008,.987);easel.rotation.y=-.135;root.add(easel);
  const card=add(new T.PlaneGeometry(.325,.27),M(0xffffff,.88,{map:art.prideSign}),0,.151,.009,'Regenbogenschild · '+PRIDE_TITLE,easel);
  card.rotation.x=-.10;
  const backing=add(cube,wood,0,.150,.000,'Kartonrückwand im Holzrahmen',easel);
  backing.scale.set(.34,.285,.011);backing.rotation.x=card.rotation.x;
  for(const x of [-.104,.104]){
    rod(V(x,.015,-.012),V(x,.25,-.026),.007,wood,easel);
    rod(V(x,.022,-.107),V(x,.19,-.025),.007,boxWood,easel);
  }
  rod(V(-.171,.023,.020),V(.171,.023,.020),.009,boxWood,easel);
  const enamel=M(0x3a665e,.46,{metalness:.19}),ceramic=M(0xe8ddbb,.62);
  const mug=V(-.658,top+.008,1.397);
  const mugBody=new T.LatheGeometry([[0,0],[.037,0],[.039,.011],[.044,.070],[.043,.075],[.038,.075],[.035,.014],[0,.011]]
    .map(([r,y])=>new T.Vector2(r,y)),22);
  add(mugBody,enamel,mug.x,mug.y,mug.z,'Infostand · Emaillebecher');
  const lip=add(new T.TorusGeometry(.041,.0019,8,22),ceramic,mug.x,mug.y+.075,mug.z);lip.rotation.x=TW;
  const handle=add(new T.TorusGeometry(.018,.0038,8,16),enamel,mug.x-.044,mug.y+.043,mug.z);handle.rotation.z=.12;
  box(boxWood,.161,.018,.109,-.034,top+.008,1.057,'Infostand · Schale für Buttons');
  const buttonBack=new T.CircleGeometry(.020,20),buttonFace=M(0xffffff,.81,{map:art.prideButton});
  for(const [X,Z,turn] of [[-.075,1.073,.31],[-.026,1.027,-.16],[.011,1.076,.09]]){
    const pin=add(buttonBack,buttonFace,X,top+.021,Z,'Button · Regenbogen');pin.rotation.set(-TW,0,turn);
  }
  box(boxWood,.240,.018,.191,.74,top+.015,1.29,'Gesprächsmappe').rotation.y=-.13;
  box(paper,.211,.004,.151,.744,top+.026,1.279).rotation.y=-.13;
  rod(V(.634,top+.037,1.29),V(.805,top+.039,1.227),.0045,brass);
  const thermos=M(0x94482d,.58,{metalness:.21}),jug=V(-.83,top,1.03);
  rod(jug.clone().add(V(0,.006,0)),jug.clone().add(V(0,.236,0)),.048,thermos).name='Verbeulte Thermoskanne';
  for(const [a,b,m,r] of [[.005,.026,dark,.052],[.224,.252,brass,.051],[.145,.155,cream,.049]])
    rod(jug.clone().add(V(0,a,0)),jug.clone().add(V(0,b,0)),r,m);
  const vase=V(.81,top,.986);
  rod(vase.clone().add(V(0,.002,0)),vase.clone().add(V(0,.140,0)),.048,bottle).name='Grüne Flasche mit Blumen';
  rod(vase.clone().add(V(0,.138,0)),vase.clone().add(V(0,.211,0)),.020,bottle);
  const petal=M(0xc98c44,.88),leaf=M(0x42683c,.95);
  for(const [dx,dy,dz] of [[-.06,.335,.010],[.006,.40,-.025],[.048,.319,.035]]){
    const p=vase.clone().add(V(dx,dy,dz));rod(vase.clone().add(V(0,.19,0)),p,.004,leaf);
    add(sphere,brass,p.x,p.y,p.z).scale.set(.012,.013,.012);
    for(let k=0;k<5;k++){
      const a=k*Math.PI*.4;add(sphere,petal,p.x+.018*Math.cos(a),p.y+.017*Math.sin(a),p.z).scale.set(.009,.013,.005);
    }
  }
  for(const [X,Z] of [[-1.06,-.62],[.90,-.70]]){
    box(boxWood,.48,.344,.36,X,.172,Z,'Flugblattkiste');
    world.box(x+X-.24,z+Z-.18,x+X+.24,z+Z+.18,onSurface);
    for(const d of [-.153,.153])box(wood,.046,.321,.019,X+d,.161,Z+.186);
    const label=add(new T.CircleGeometry(.095,24),mark,X,.190,Z+.184,'Aufkleber · Friedenszeichen');label.rotation.z=.13;
    box(paper,.335,.037,.247,X-.02,.360,Z+.02).rotation.y=.16;
  }
  const sign=add(new T.CircleGeometry(.174,28),mark,-.76,1.64,-.91,'Friedenszeichen · Pappschild');
  sign.rotation.set(-.06,-.08,-.13);
  rod(V(-.76,1.79,-.91),V(-1.37,2.085,-1.37),.003,thread);
  rod(V(-.64,1.77,-.91),V(.05,2.095,-1.37),.003,thread);

  const clusters=[];
  for(const [X,Z,side] of [[-1.38,1.38,-1],[1.38,-1.38,1]]){
    const bunch=new T.Group();bunch.position.set(X,1.24,Z);bunch.userData.noSceneQuery=true;root.add(bunch);clusters.push(bunch);
    rod(V(0,-.017,0),V(0,.025,0),.028,edge,bunch);
    for(const [i,[dx,dy,dz]] of [[.27,1.25,.03],[.58,1.03,-.14],[.62,1.35,.19]].entries()){
      const end=V(side*dx,dy,dz),neck=end.clone().add(V(0,-.165,0)),mid=neck.clone().multiplyScalar(.52).add(V(side*.07,0,-.032));
      rod(V(0,0,0),mid,.0022,thread,bunch);rod(mid,neck,.0022,thread,bunch);
      const o=add(sphere,i===1?greenBalloon:balloon,end.x,end.y,end.z,'Luftballon · grünes Herz',bunch);
      o.scale.set(.131,.171,.125);o.rotation.set(-.06,side*.09+i*.26,side*.21);
      add(knot,thread,neck.x,neck.y-.010,neck.z,'Ballon · Knoten',bunch);
    }
  }

  // Keep the model inexpensive: batch the small trims by material without
  // altering named props, working colliders or the anchored moving clusters.
  function batch(group){
    const batches=new Map();
    for(const o of group.children){
      if(!o.isMesh||o.name)continue;
      const list=batches.get(o.material)??[];list.push(o);batches.set(o.material,list);
    }
    for(const [m,list] of batches){
      if(list.length<2)continue;
      const gs=list.map(o=>{
        o.updateMatrix();return (o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);
      });
      const g=mergeGeometries(gs);gs.forEach(q=>q.dispose());
      for(const o of list)o.removeFromParent();
      add(g,m,0,0,0,'Infostand · Beschläge und Kleinteile',group);
    }
  }
  batch(root);clusters.forEach(batch);

  const dress=standOutfits(T);
  const cast=INFO_CAST.map((c,i)=>{
    const X=x+c.x,Z=z+c.z,Y=floorAt(X,Z),rig=createHuman(T,c.id),{actor,npcInfo}=rig;
    scene.add(actor);actor.position.set(X,rig.groundedY(Y),Z);actor.rotation.y=c.yaw;
    npcInfo.shadow=contactShadow(T,scene,X,Y+.009,Z,.73,.66);
    world.circle(X,Z,.21,p=>rig.atStation()&&!npcInfo.questBusy&&Math.abs(p.y-Y)<1.1&&
      Math.hypot(actor.position.x-X,actor.position.z-Z)<.18);
    const hair=dress(rig,i),state={rig,npcInfo,i,hair,time:i*.78,talk:0,look:0};
    npcInfo.speak=(d=2.3)=>{state.talk=d;};
    rig.infoPose(state.time,i);return state;
  });
  let t=0,acc=0;
  return {root,cast,update(dt,p,surface){
    if(!surface||Math.hypot(p.x-x,p.z-z)>27)return false;
    acc+=dt;if(acc<1/24)return false;
    const step=acc;acc=0;t+=step;
    windFlags(t);
    for(const [i,g] of clusters.entries()){
      g.rotation.x=.046*Math.sin(t*1.57+i*1.8);g.rotation.z=.059*Math.sin(t*1.33+i*1.25);
    }
    for(const a of cast){
      if(!a.rig.controllable())continue;
      const actor=a.rig.actor,dx=p.x-actor.position.x,dz=p.z-actor.position.z;
      a.time+=step;a.talk=Math.max(0,a.talk-step);
      const off=Math.atan2(dx,dz)-actor.rotation.y,angle=Math.atan2(Math.sin(off),Math.cos(off));
      const nearby=Math.hypot(dx,dz)<3.9&&Math.abs(angle)<1.28;
      const look=(nearby||a.talk>0)?Math.max(-.66,Math.min(.66,angle)):.10*Math.sin(a.time*.61+a.i);
      a.look+=(look-a.look)*(1-Math.exp(-step*5.9));
      a.rig.infoPose(a.time,a.i,a.look,Math.min(1,a.talk*4));a.hair(a.time);
    }
    return true;
  }};
}
