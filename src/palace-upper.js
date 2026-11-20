import {architectureKit} from './architecture-kit.js';
import {UPPER_ENTRY as E,UPPER_ROOM_PLAN} from './palace-openings.js';
import {sharedSet} from './surface-detail.js';
import {dressUpperFactory} from './upper-factory.js';
import {dressUpperPlaza} from './upper-plaza.js';

export const UPPER_LAYER=6;
export const UPPER_FLOOR=E.sill+.023;
const {roof,X,Z,gardenWidth,squareWidth,gardenEnd,squareEnd}=UPPER_ROOM_PLAN;
const width=.123, at=(x,y,z)=>[x,y,z];
const outline=[[-X,-Z],[-gardenWidth,-Z],[-gardenWidth,gardenEnd],[gardenWidth,gardenEnd],
  [gardenWidth,-Z],[X,-Z],[X,Z],[squareWidth,Z],[squareWidth,squareEnd],[-squareWidth,squareEnd],[-squareWidth,Z],[-X,Z]];
export const UPPER_BAYS=[-X,-24.6,-16.7,-8.85,0,8.85,16.7,24.6,X];
const footZ=-14.78,headZ=E.z-.325,arrivalZ=gardenEnd+.58;
const hallZ=1.73,doorHalf=.851,doorShift=.37;
const bayAt=x=>UPPER_BAYS.findIndex((edge,i)=>x>=edge&&x<UPPER_BAYS[i+1]);
const entryBay=bayAt(E.x),bayCenter=i=>(UPPER_BAYS[i]+UPPER_BAYS[i+1])*.5;
const lowerCap=2.6;
const insidePlan=(x,z,pad=0)=>Math.abs(x)<=X+pad&&Math.abs(z)<=Z+pad||
  Math.abs(x)<=gardenWidth+pad&&z>=gardenEnd-pad&&z<=-Z+pad||
  Math.abs(x)<=squareWidth+pad&&z>=Z-pad&&z<=squareEnd+pad;
const entrySpan=x=>x>E.left+.14&&x<E.right-.14;

export function addPalaceUpper(T,scene,facade,upperWorld,M,height){
  const room=new T.Group(),ladder=new T.Group(),portal=new T.Group();
  room.name='Erstes Obergeschoss · Referat Morgenform';room.visible=false;
  ladder.name='Gartenfassade · Anlegeleiter';ladder.visible=false;ladder.userData.noSceneQuery=true;
  portal.name='Gartenfassade · Geheimfenster';scene.add(room,ladder);facade.add(portal);

  const material=(color,roughness,kind,n=.43)=>{
    const tex=sharedSet(T,kind,256);
    return new T.MeshStandardMaterial({color,roughness,...tex,normalScale:new T.Vector2(n,n)});
  };
  const iron=new T.MeshStandardMaterial({color:0x44443e,metalness:.48,roughness:.68});
  const wood=material(0xa99577,.88,'fineOak',.69),endGrain=material(0x806f5c,.91,'fineOak',.68);
  const lit=new T.MeshStandardMaterial({color:0xf5dbac,emissive:0xe9aa61,emissiveIntensity:.67,roughness:.60});
  const ash=material(0xd5c8b6,.97,'plaster',.63),silt=material(0xb3ab9b,.94,'stairStone',.68);
  const finishes={...M,wood,endGrain,iron,lit,ash,silt,
    rock:material(0xb4a892,.99,'bedrock',.59),soot:material(0xa59a89,.99,'plaster',.53)};
  const windowKit=architectureKit(T,portal,finishes);
  // The lining reaches the new interior face instead of leaving a gap behind
  // the original façade. The open leaves fit entirely within this depth.
  const revealBack=gardenEnd+.095,sashZ=-12.050;
  for(const x of [E.left,E.right]){
    windowKit.box('cut',at,x-.041,x+.041,E.sill,E.head,-12.249,revealBack);
    windowKit.box('sash',at,x-.024,x+.024,E.sill+.046,E.head-.043,sashZ-.034,sashZ+.047);
  }
  windowKit.box('cut',at,E.left-.042,E.right+.042,E.sill-.033,UPPER_FLOOR,-12.325,gardenEnd);
  windowKit.box('cut',at,E.left-.029,E.right+.029,E.head-.043,E.head+.018,-12.249,revealBack);
  windowKit.flush('Geheimfenster · Sandsteinlaibung');
  const cover=new T.Mesh(new T.PlaneGeometry(E.right-E.left-.044,E.head-E.sill-.092),M.dark);
  cover.name='Geheimfenster · dunkler Hintergrund geschlossen';cover.rotation.y=Math.PI;
  cover.position.set(E.x,(E.head+E.sill)*.5,sashZ+.090);portal.add(cover);
  const leaves=[];
  for(const side of [-1,1]){
    const leaf=new T.Group(),a=side<0?.022:-.684,b=side<0?.684:-.022;
    leaf.name='Geheimfenster · Holzflügel';leaf.userData.movingOccluder=true;
    leaf.position.set(side<0?E.left+.049:E.right-.049,E.sill+.04,sashZ);portal.add(leaf);
    const k=architectureKit(T,leaf,finishes),top=E.head-E.sill-.103,mid=(a+b)*.5;
    k.box('glass',at,a+.029,b-.029,.040,top-.040,-.005,.014);
    for(const x of [a+.018,b-.018,mid])k.box('sash',at,x-.026,x+.026,.013,top,-.035,.039);
    for(const y of [.043,top*.48,top-.036])k.box('sash',at,a,b,y-.032,y+.032,-.037,.039);
    for(let j=1;j<6;j++)k.box('metal',at,a+.038,b-.038,top*j/6-.006,top*j/6+.006,-.020,-.012);
    for(const y of [.32,top-.29])k.box('iron',at,side<0?a-.005:b-.037,side<0?a+.037:b+.005,y-.071,y+.071,-.043,.043);
    k.box('bronze',at,side<0?b-.058:a+.020,side<0?b-.020:a+.058,1.00,1.15,.039,.066);
    k.flush('Geheimfenster · Beschläge, Holz und Gläser');leaves.push({leaf,side});
  }

  const base=height(E.x,footZ)??-.036,H=UPPER_FLOOR-base,L=H+(arrivalZ-headZ)*.83;
  const railZ=y=>footZ+(headZ-footZ)*(y-base)/H;
  const rungGeom=new T.CylinderGeometry(1,1,1,11);
  const mk=architectureKit(T,ladder,finishes),m=new T.Matrix4(),axis=new T.Vector3(0,1,0),q=new T.Quaternion(),
    v=new T.Vector3(),c=new T.Vector3(),scale=new T.Vector3();
  function rod(k,key,a,b,r){
    v.fromArray(b).sub(c.fromArray(a));const length=v.length();if(length<1e-5)return;
    m.compose(c.addScaledVector(v,.5),q.setFromUnitVectors(axis,v.normalize()),scale.set(r,length,r));
    k.geometry(key,rungGeom,m);
  }
  for(const sign of [-1,1]){
    const x=E.x+sign*.437;
    const rail=(u,y,d)=>[x+u,y,railZ(y)+d];
    mk.box('wood',rail,-.042,.042,base+.018,UPPER_FLOOR-.063,-.049,.045);
    mk.box('iron',rail,-.045,.045,UPPER_FLOOR-.107,UPPER_FLOOR-.061,-.052,.048);
    mk.box('iron',(u,y,d)=>[x+u,y,railZ(y)+d],-.056,.056,base+.009,base+.189,-.062,.053);
    const bracket=UPPER_FLOOR-.181;
    rod(mk,'iron',[x,bracket,railZ(bracket)+.02],[x,bracket,-12.30],.025);
    for(const y of [base+.267,UPPER_FLOOR-.62,UPPER_FLOOR-.158]){
      rod(mk,'iron',[x-.049,y,railZ(y)],[x+.055,y,railZ(y)],.016);
    }
  }
  for(let y=base+.273,i=0;y<UPPER_FLOOR-.16;y+=.294,i++){
    const z=railZ(y);
    rod(mk,i%5===0?'endGrain':'wood',[E.x-.444,y,z],[E.x+.444,y,z],.035);
    for(const sign of [-1,1])rod(mk,'iron',[E.x+sign*.426,y,z-.049],[E.x+sign*.426,y,z-.057],.016);
  }
  mk.flush('Leiter · Holzsprossen und Eisenlaschen');
  ladder.traverse(o=>{if(o.isMesh)o.castShadow=true;});

  const deck=new T.Group(),walls=new T.Group(),beams=new T.Group();
  deck.name='Obergeschoss · Böden';walls.name='Obergeschoss · Raumaufteilung';beams.name='Obergeschoss · Rohbau und Beleuchtung';
  room.add(deck,walls,beams);
  const fk=architectureKit(T,deck,finishes),wk=architectureKit(T,walls,finishes),bk=architectureKit(T,beams,finishes);
  for(const [a,b,l,r] of [[-X,X,-Z,Z],[-gardenWidth,gardenWidth,gardenEnd,-Z],[-squareWidth,squareWidth,Z,squareEnd]]){
    fk.box('silt',at,a,b,UPPER_FLOOR-.178,UPPER_FLOOR-.019,l,r);
    fk.box('soot',at,a,b,roof,roof+.104,l,r);
  }
  function wall(axis,fixed,a,b,holes=[],toOutside=false){
    const P=axis==='x'?(u,y,d)=>[fixed-d,y,u]:(u,y,d)=>[u,y,fixed+d],lo=UPPER_FLOOR,hi=roof;
    const solid=(l,r,base,top,material='ash',d=width)=>{
      if(r-l>.001)wk.box(material,P,l,r,base,top,-d,d);
    };
    const run=(l,r)=>{
      if(r-l<.004)return;
      solid(l,r,lo,hi,toOutside?'rock':'ash',toOutside?.079:width);
      solid(l+.001,r-.001,lo+.020,lo+.106,'silt',toOutside?.104:width+.018);
      if(!toOutside){
        for(const x of [l+.123,r-.123])if(x>l+.05&&x<r-.05)solid(x-.045,x+.045,lo+.106,hi-.106,'soot',width+.007);
      }
      const d=toOutside?.053:.095;
      if(axis==='x')upperWorld.box(fixed-d,l,fixed+d,r);
      else upperWorld.box(l,fixed-d,r,fixed+d);
    };
    let cursor=a;
    for(const [l,r,h=lowerCap] of holes){
      run(cursor,l);cursor=r;solid(l,r,lo+h,hi,toOutside?'rock':'ash',toOutside?.079:width);
      solid(l-.043,r+.043,lo+h-.039,lo+h+.093,'endGrain',width+.022);
      if(!toOutside)for(const s of [l,r])solid(s-.022,s+.022,lo,lo+h+.009,'wood',width+.018);
    }
    run(cursor,b);
  }
  for(let i=0;i<outline.length;i++){
    const [x,z]=outline[i],[x2,z2]=outline[(i+1)%outline.length];
    if(x===x2)wall('x',x,Math.min(z,z2),Math.max(z,z2),[],true);
    else wall('z',z,Math.min(x,x2),Math.max(x,x2),z===gardenEnd?[[E.left+.033,E.right-.033,E.head-UPPER_FLOOR-.012]]:[],true);
  }
  // Continuous longitudinal hall with doors into both rows of future rooms.
  for(const z of [-hallZ,hallZ]){
    const doorways=UPPER_BAYS.slice(0,-1).map((x,i)=>{
      const center=bayCenter(i)+Math.sign(z)*doorShift;
      return [center-doorHalf,center+doorHalf];
    });
    wall('z',z,-X,X,doorways);
  }
  for(const x of UPPER_BAYS.slice(1,-1)){
    wall('x',x,Math.abs(x)<gardenWidth?gardenEnd:-Z,-1.73);
    wall('x',x,1.73,Math.abs(x)<squareWidth?squareEnd:Z);
  }
  // Columns and a handful of timber ties distinguish the otherwise empty bays.
  for(let x=-29.5,i=0;x<31;x+=4.55,i++){
    bk.box(i%3?'wood':'endGrain',at,x-.084,x+.084,roof-.217,roof-.008,-Z+.16,Z-.16);
    bk.box('endGrain',at,x-.118,x+.118,roof-.246,roof-.195,-1.73,1.73);
  }
  fk.flush('Obergeschoss · Boden und Decke');wk.flush('Obergeschoss · Mauerwerk');
  bk.flush('Obergeschoss · Dachbalken und Baulicht');rungGeom.dispose();
  const factory=dressUpperFactory(T,room,upperWorld,UPPER_FLOOR,UPPER_BAYS,{roof,gardenWidth,gardenEnd,Z});
  const plaza=dressUpperPlaza(T,room,upperWorld,UPPER_FLOOR,UPPER_BAYS,{roof,Z,squareWidth,squareEnd});
  const ambient=new T.HemisphereLight(0xe7e0d7,0x928c83,1.23),lights=Array.from({length:3},()=>new T.PointLight(0xffdeb6,24,13.6,2));
  room.add(ambient,...lights);
  for(const o of [deck,walls,beams])o.traverse(m=>{if(m.isMesh)m.castShadow=false;});
  room.traverse(o=>o.layers.set(UPPER_LAYER));

  let start=Infinity,opening=0,enabled=false,progress=null,direction=1,requested=0,lastTread=-1;
  const treeGround=height(E.treeX,E.treeZ)??0;
  const treeAction={id:'upper-tree',action:'upper-unlock',label:'In die Baumrinde fassen'};
  const upAction={id:'upper-ladder-up',action:'upper-up',label:'Leiter hinaufsteigen'};
  const downAction={id:'upper-ladder-down',action:'upper-down',label:'Leiter hinuntersteigen'};
  const hint=(p,look,x,z,r,min=.48)=>{
    const dx=x-p.x,dz=z-p.z,len=Math.hypot(dx,dz);
    return len<=r&&(len<.35||dx*look.x+dz*look.z>len*min);
  };
  const upper=p=>p.y>UPPER_FLOOR-.24&&insidePlan(p.x,p.z,.075);
  const isFoot=p=>p.y<base+.49&&Math.abs(p.x-E.x)<.51&&p.z>=footZ-.53&&p.z<footZ+.32;
  const isTop=p=>upper(p)&&Math.abs(p.x-E.x)<.49&&p.z>gardenEnd-.04&&p.z<arrivalZ+.46;
  function target(p,look){
    // The bloom is a clue, not the hitbox: proximity to the trunk works at any angle.
    if(start===Infinity&&p.y>=treeGround-.46&&p.y<=treeGround+1.28&&
      (p.x-E.treeX)**2+(p.z-E.treeZ)**2<=1.75**2)return treeAction;
    if(!enabled||progress!==null)return null;
    if(p.y<base+.48&&hint(p,look,E.x,footZ,.98,.34))return upAction;
    if(isTop(p)&&hint(p,look,E.x,gardenEnd-.15,1.25,.34))return downAction;
    return null;
  }
  function seeGarden(p){
    if(opening<.037)return false;
    // Keep the exterior from every point in the arrival room. Further back,
    // only draw it if a sightline can pass through the relevant doorways.
    if(p.z<-hallZ-.04)return p.x>=UPPER_BAYS[entryBay]-.065&&p.x<=UPPER_BAYS[entryBay+1]+.065;
    let l=E.left,r=E.right;
    const through=(plane,door)=>{
      const t=(p.z-plane)/(p.z-gardenEnd),half=doorHalf+.12;
      if(t<=.003)return Math.abs(p.x-door)<=half;
      l=Math.max(l,p.x+(door-half-p.x)/t);r=Math.min(r,p.x+(door+half-p.x)/t);
      return r>=l;
    };
    if(!through(-hallZ,bayCenter(entryBay)-doorShift))return false;
    if(p.z<=hallZ+.07)return true;
    const bay=bayAt(p.x);
    return bay>=0&&through(hallZ,bayCenter(bay)+doorShift);
  }
  function unlock(time){
    if(start!==Infinity)return false;
    start=time+142;return true;
  }
  function step(p,f,tz,dt){
    if(!enabled)return 0;
    let newly=false;
    if(progress===null){
      const from=requested||(isFoot(p)&&tz>.18?1:isTop(p)&&tz<-.18?-1:0);
      requested=0;if(!from)return 0;
      direction=from;progress=from>0?0:L;lastTread=-1;newly=true;
    }
    const speed=Math.max(-1,Math.min(1,f))*direction*2.27;
    if(!newly)progress=Math.min(L,Math.max(0,progress+dt*speed));
    p.x=E.x;p.y=base+Math.min(H,progress);
    p.z=progress>H?headZ+(arrivalZ-headZ)*(progress-H)/(L-H):railZ(p.y);
    const tread=Math.floor(progress/.294);
    if(tread!==lastTread){lastTread=tread;p.tread=!newly;}
    if(!newly&&(progress===0&&speed<0||progress===L&&speed>0)){
      if(progress===0)p.z=footZ-.21;
      progress=null;return 2;
    }
    return 1;
  }
  function update(time,p){
    let changed=false;
    const open=Math.min(1,Math.max(0,(time-start)/670));
    if(open!==opening){
      opening=open;changed=true;
      const a=open*open*(3-2*open);
      for(const {leaf,side} of leaves)leaf.rotation.y=side*a*Math.PI*.491;
      cover.visible=open<.037;ladder.visible=open>.075;enabled=open>=.90;
    }
    const high=upper(p),near=(Math.abs(p.x-E.x)<19&&p.z<arrivalZ+1.2&&p.z>footZ-26&&p.y>=base-.6);
    const see=high||opening>.045&&near;
    if(room.visible!==see){room.visible=see;changed=true;}
    if(see){
      changed=factory.update(time,p,high)||changed;
      changed=plaza.update(time,p,high)||changed;
      const axis=high?p.x:E.x;
      const onPlaza=high&&p.z>1.85;
      const bayIndex=high?bayAt(p.x):-1;
      const factoryBay=high&&p.z<-1.85?bayIndex:-1;
      const tint=high?(onPlaza?plaza.theme(p):factory.theme(p)):0xead6ad;
      ambient.intensity=onPlaza?1.04:1.23;
      for(let i=0;i<lights.length;i++){
        const bay=Math.max(0,Math.min(7,bayIndex+i-1));
        const x=bayIndex>=0?bayCenter(bay):
          Math.max(-27.5,Math.min(27.5,Math.round(axis/8)*8+(i-1)*8));
        const z=factoryBay>=0?(i===1?-6.06:-4.62):onPlaza?(i===1?Math.min(8.5,2.68+p.z*.55):4.98):high?0:-8.65;
        lights[i].position.set(x,onPlaza&&i===1?roof-1.31:roof-1.02,z);
        lights[i].color.setHex(i===1?tint:i===0?(onPlaza?0xb0b8b0:0xffe5cc):0xe1e4e4);
        lights[i].intensity=i===1?(onPlaza?34:38):onPlaza?17:21;
      }
    }
    return changed;
  }
  async function prepare(renderer){
    const camera=new T.PerspectiveCamera(65,1,.08,120),vp=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4()),
      test=renderer.getScissorTest(),shadow=renderer.shadowMap.needsUpdate,restore=room.visible,meshes=[];
    camera.layers.set(UPPER_LAYER);camera.position.set(4.98,UPPER_FLOOR+1.65,-8.69);camera.lookAt(4.98,UPPER_FLOOR+1.63,0);
    room.visible=true;room.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});
    try{
      await renderer.compileAsync(scene,camera);
      renderer.setViewport(0,0,32,32);renderer.setScissor(0,0,32,32);renderer.setScissorTest(true);
      renderer.render(scene,camera);
    }finally{
      room.visible=restore;for(const [o,f] of meshes)o.frustumCulled=f;
      renderer.setViewport(vp);renderer.setScissor(sc);renderer.setScissorTest(test);renderer.shadowMap.needsUpdate=shadow;
    }
  }
  return {prepare,update,target,unlock,step,request(d){requested=d;},inside:upper,visible:()=>room.visible,
    seeGarden,
    floorAt:(x,z,y)=>y>UPPER_FLOOR-.26&&insidePlan(x,z,.164)?UPPER_FLOOR:null,
    ceilingAt(x,z,y){
      if(y<UPPER_FLOOR-.26||!insidePlan(x,z,.19))return Infinity;
      if(entrySpan(x)&&z<gardenEnd+.18)return E.head-.061;
      const crossing=Math.abs(Math.abs(z)-1.73)<.15;
      return crossing?UPPER_FLOOR+lowerCap-.042:roof-.255;
    }
  };
}
