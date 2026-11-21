import {architectureKit} from './architecture-kit.js';
import {PORTALS,HALL,WINGS,GARDEN_REVEAL,inPalaceWing} from './palace-openings.js';
import {portalFrame} from './palace-facade.js';
import {addPalaceWings} from './palace-wings.js';
import {masonryPortal} from './palace-interior-portal.js';
import {addPalaceLab} from './palace-lab.js';
import {labCameraMode} from './lab-wing.js';
import {hallDressing} from './hall-dressing.js';
import {sharedSet} from './surface-detail.js';
import {palaceButler} from './palace-butler.js';

const q=(x,y,z)=>[x,y,z],{floor:y,half,zMin,zMax}=HALL;
const step=(t)=>Math.max(0,Math.min(1,t));
const mix=(a,b,t)=>a+(b-a)*t;

export function hallFloor(x,z){
  if(inPalaceWing(x,z))return y;
  if(Math.abs(x)>half||z<PORTALS.east.z-.98||z>PORTALS.west.z+.82)return null;
  if(z<zMin||z>zMax){
    const d=z<0?PORTALS.east:PORTALS.west,ext=(z-d.z)*d.side;
    if(Math.abs(x)>d.half+.155)return null;
    // Use the same elevations as the exposed two-piece stone threshold.
    if(ext>(z<0?.644:.517))return .012;
  }
  return y;
}

// Freely interpreted public rooms; not a survey of the existing interior.
// The exterior entrance thresholds remain shared with the façade assembly.
export function makeHall(T,root,M,world,leaves,poster,seal,moosfunk){
  const limestone=new T.MeshStandardMaterial({color:0xc6beac,roughness:.81});
  const limewash=new T.MeshStandardMaterial({color:0xdacfc0,roughness:.96});
  const std=(color,roughness,extra)=>new T.MeshStandardMaterial({color,roughness,...extra});
  const plasterSet=sharedSet(T,'plaster',256);
  const plaster=std(0xece3d4,.98,{...plasterSet,side:T.DoubleSide,normalScale:new T.Vector2(.18,.18)});
  const hallLime=std(0xe3d8c6,.99,{...plasterSet,normalScale:new T.Vector2(.33,.33)});
  const hallPanel=std(0xcfc8b7,.99,{...plasterSet,normalScale:new T.Vector2(.31,.31)});
  const copy=(mat,color,roughness)=>{
    const copy=mat.clone();copy.color.setHex(color);copy.roughness=roughness;copy.vertexColors=false;return copy;
  };
  const hallStone=copy(M.cut,0xdbd4c8,.88),hallTrim=copy(M.cut,0xe8ded0,.83);
  const tileA=copy(M.floor,0xd8d2c3,.89),tileB=copy(M.floor,0xc1b8a8,.93),tileC=copy(M.floor,0xccc5bb,.91);
  const border=copy(M.seam,0x9a9081,.97),lineStone=copy(M.floor,0x736f64,.87),marginStone=copy(M.floor,0xafa597,.91);
  const woodSet=sharedSet(T,'wood',256);
  const hallOak=std(0xc8a687,.78,{...woodSet,normalScale:new T.Vector2(.38,.38)});
  const hallSeat=std(0xe2c4a8,.73,{...woodSet,normalScale:new T.Vector2(.42,.42)});
  const hallBronze=std(0xa5814e,.49,{metalness:.55});
  const hallMat=std(0xe1d7ba,.96),hallShade=std(0xf5e9d3,.72,{emissive:0xffd099,emissiveIntensity:.72});
  for(const m of [tileA,tileB,tileC,border,M.floor])m.side=T.DoubleSide;
  const MAT={...M,limestone,limewash,plaster,tileA,tileB,tileC,border,marginStone,lineStone,
    hallLime,hallPanel,hallStone,hallTrim,hallOak,hallSeat,hallBronze,hallMat,hallShade};
  const room=new T.Group();room.name='Schloss · interpretierte Eingangshalle';root.add(room);
  const k=architectureKit(T,room,MAT),box=(m,l,r,b,t,a,d)=>k.box(m,q,l,r,b,t,a,d);
  const dressing=hallDressing(T,k,room,world);
  const spring=3.42,rise=1.37;
  // Wall head crosses the wing roof plane, not just the lower springing
  // line of the hall vault. The enclosure overlaps in section, not as trim.
  const wallTop=WINGS.ceiling+.14;
  box('border',-half,half,y-.076,y-.013,zMin,zMax);
  // One floor: inset pale flags along the main route, quieter margins and
  // narrow stone fillets. The joints expose the stone bedding underneath.
  const channels=[[-half,-3.52,'marginStone'],[-3.52,-2.04,'tileC'],[-2.04,-1.94,'lineStone'],
    [-1.94,-1.82,'marginStone'],[-1.82,1.82,null],[1.82,1.94,'marginStone'],
    [1.94,2.04,'lineStone'],[2.04,3.52,'tileC'],[3.52,half,'marginStone']];
  for(const [lo,hi,key] of channels){
    const narrow=hi-lo<.26,length=narrow?1.26:.83;
    for(let z=zMin,row=0;z<zMax-.012;z+=length,row++){
      const end=Math.min(z+length,zMax),width=key?hi-lo:.91,offset=key?0:row%2*.455;
      for(let x=lo-offset,col=0;x<hi-.015;x+=width,col++){
        const l=Math.max(lo,x),r=Math.min(hi,x+width);
        const mat=key??['tileA','tileA','tileB','tileC','tileA'][(row*7+col*3+row*col)%5];
        box(mat,l+.0035,r-.0035,y-.027,y,z+.004,end-.004);
      }
    }
  }
  for(const side of [-1,1]){
    const wall=(z,a,d)=>[side*(half-d),a,side*z];
    const min=side>0?zMin:-zMax,max=side>0?zMax:-zMin;
    const rim=.185,edge=WINGS.portal+rim+.034;
    masonryPortal(k,wall,{left:min,right:max,top:wallTop,depth:HALL.wallDepth,rim,
      wall:'hallLime',stone:'hallTrim',edge:'hallStone',joint:'marginStone'});
    for(const [a,b] of [[min,-edge],[edge,max]]){
      k.box('hallStone',wall,a,b,y,.985,.006,.044);
      for(let u=a+.36,i=0;u<b-.28;u+=.93,i++){
        const l=u+(i%2)*.058;
        k.box('hallTrim',wall,l,Math.min(l+.85,b-.13),.275,.846,.046,.064);
        k.box('hallStone',wall,l+.036,Math.min(l+.816,b-.16),.311,.810,.066,.073);
      }
      for(const [low,high,depth,finish] of [[y,.183,.091,'marginStone'],[.184,.226,.103,'hallTrim'],
        [.928,.985,.086,'hallStone'],[.984,1.056,.117,'hallTrim'],[1.056,1.086,.082,'hallStone']])
        k.box(finish,wall,a,b,low,high,.025,depth);
    }
    for(const [low,high,depth,finish] of [[3.235,3.272,.085,'hallStone'],[3.272,3.345,.123,'hallTrim'],
      [3.345,3.407,.162,'hallStone'],[3.407,3.447,.195,'hallTrim']])
      for(const [a,b] of [[min,-.89],[.89,max]])k.box(finish,wall,a,b,low,high,.008,depth);
    for(const [a,b] of [[zMin,-WINGS.portal],[WINGS.portal,zMax]]){
      const xs=[side*(half-.079),side*(half+HALL.wallDepth+.059)].sort((x,z)=>x-z);
      world.box(xs[0],a,xs[1],b);
    }
    for(const z of [-8.24,-3.44,3.44,8.24]){
      k.box('hallStone',wall,z-.188,z+.188,.16,spring,-.006,.147);
      for(const dir of [-1,1])k.box('hallTrim',wall,z+dir*.136-.013,z+dir*.136+.013,.376,3.09,.137,.171);
      k.box('hallStone',wall,z-.26,z+.26,.171,.376,0,.211);
      k.box('hallTrim',wall,z-.229,z+.229,.373,.437,0,.186);
      k.box('hallStone',wall,z-.231,z+.231,3.102,3.255,0,.196);
      k.box('hallTrim',wall,z-.279,z+.279,3.245,3.429,0,.234);
    }
    for(const [i,z] of [-5.71,5.71].entries()){
      const a=z-1.205,b=z+1.205,lo=1.257,hi=2.941;
      k.box('hallPanel',wall,a,b,lo,hi,.001,.019);
      for(const u of [a,b])k.box('hallTrim',wall,u-.021,u+.021,lo-.026,hi+.024,.019,.046);
      for(const level of [lo,hi])k.box('hallTrim',wall,a-.022,b+.022,level-.024,level+.024,.019,.048);
      dressing.bench(wall,side,z);
      dressing.plaque(wall,z,2.057,1.27,.942,(side<0?0:2)+i);
    }
    for(const z of [-9.49,9.49])dressing.sconce(wall,z);
  }
  // Smooth analytic normals on the barrel; the rest of the room retains
  // the crisp edges of the batched stonework.
  const slices=48;
  const curve=Array.from({length:slices+1},(_,i)=>{
    const a=Math.PI*i/slices;
    return [Math.cos(a)*half,spring+Math.sin(a)*rise];
  });
  function vault(name,material,spans,lip=0){
    const pos=[],norm=[],uv=[],index=[];
    for(const [a,b] of spans){
      const at=pos.length/3;
      for(let i=0;i<=slices;i++){
        const angle=Math.PI*i/slices,x=Math.cos(angle),h=Math.sin(angle);
        const pixel=curve[i],nx=-x/(half-lip*.72),ny=-h/rise,inv=1/Math.hypot(nx,ny);
        for(const z of [a,b]){
          pos.push(pixel[0]-x*lip*.72,pixel[1]-lip,z);
          norm.push(nx*inv,ny*inv,0);uv.push(angle*1.32,z*.51);
        }
        if(i){const j=at+(i-1)*2;index.push(j,j+1,j+3,j,j+3,j+2)}
      }
    }
    const geo=new T.BufferGeometry();
    geo.setIndex(index);geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.receiveShadow=true;room.add(mesh);
  }
  vault('Halle · durchgehendes Tonnengewölbe',plaster,[[zMin,zMax]]);
  const ribs=[-8.24,-3.44,3.44,8.24];
  vault('Halle · Gewölbegurte',hallStone,ribs.map(z=>[z-.137,z+.137]),.074);
  vault('Halle · Gewölbeprofile',hallTrim,ribs.flatMap(z=>[[z-.140,z-.097],[z+.097,z+.140]]),.106);
  for(const d of Object.values(PORTALS)){
    const p=portalFrame(d),east=d.side<0,start=((east?zMin:zMax)-d.z)*d.side;
    const end=east?GARDEN_REVEAL.back:-.455;
    for(const s of [-1,1]){
      const l=s<0?-half:d.half,r=s<0?-d.half:half;
      k.box('hallStone',p,l,r,y,spring+rise,start,end);
      if(east){
        k.box('hallTrim',p,s*d.half-.019,s*d.half+.019,y,d.spring,start+.026,end-.018);
      }else{
        k.box('hallTrim',p,s*d.half-.025,s*d.half+.025,y,Math.min(d.spring,2.91),start+.024,-.31);
      }
      k.box('hallTrim',p,l+.012,r-.012,y+.026,.181,start-.074,start+.014);
    }
    const closeY=d.spring+d.rise;
    k.box('hallStone',p,-d.half,d.half,closeY,spring+rise,start,end);
  }
  const lamps=[],bounces=[];
  for(const [i,z] of [-6.05,0,6.05].entries()){
    const bottom=i===1?3.37:3.59;
    dressing.lantern(0,z,spring+rise-.005,bottom,i===1?.244:.210);
    const light=new T.PointLight(i===1?0xffdfbd:0xffdab1,0,10.6,2);
    light.position.set(0,bottom-.08,z);room.add(light);lamps.push(light);
  }
  for(const d of Object.values(PORTALS)){
    const light=new T.PointLight(0xffdeb3,0,7.8,2);
    light.position.set(0,2.67,d.z-d.side*2.64);room.add(light);bounces.push(light);
  }
  dressing.finish();
  k.flush('Halle · Stein, Putz und Leuchten');
  const wings=addPalaceWings(T,root,world,MAT,poster,seal);
  const lab=addPalaceLab(T,root,world,MAT,moosfunk);
  const butler=palaceButler(T,room,world);

  const doors=Object.values(PORTALS).map(d=>({...d,leaves:leaves[d.id],progress:0,target:0}));
  for(const d of doors)for(const {mesh} of d.leaves)mesh.userData.movingOccluder=true;
  const closeEnough=(p,d,dist)=>Math.hypot(p.x,(p.z-d.z)*.91)<dist;
  for(const d of doors){
    const narrow=d.half-.034,outer=d.z+d.side*(d.id==='east'?.62:.51),inner=d.z-d.side*2.35;
    world.box(-half,Math.min(outer,inner),-narrow,Math.max(outer,inner));
    world.box(narrow,Math.min(outer,inner),half,Math.max(outer,inner));
    const leafCenter=d.z-d.side*(d.id==='east'?.216:.149);
    world.box(-narrow,leafCenter-.096,narrow,leafCenter+.096,()=>d.progress<.867);
    for(const side of [-1,1])world.circle(side*(d.side>0?2.27:2.16),d.z+d.side*(d.side>0?.83:.90),.287);
  }
  const look=new T.Vector3();
  let preset='dusk',lit=false;
  function targetFor(player,camera){
    camera.getWorldDirection(look);
    const p=player.body.position;
    return lab.target(p,look)??wings.hatch.target(p,look)??wings.posterTarget(p,camera,look)??doors.find(d=>{
      const dx=-p.x,dz=d.z-p.z,distance=Math.hypot(dx,dz);
      return Math.abs(p.x)<2.05&&distance<3.2&&(distance<1.25||dx*look.x+dz*look.z>distance*.22);
    });
  }
  function commit(player,camera){
    const d=targetFor(player,camera);if(!d)return false;
    if(d.action)return d;
    if(!usable(d,player))return false;
    if(d.id!=='gallery-choir')d.target=1-d.target;
    return d;
  }
  function usable(d,player){
    const p=player.body.position;
    if(d.usable)return d.usable(p);
    return d.id==='gallery-choir'||(d.id==='lab-secret'?lab.usable(p):d.target===0||!closeEnough(p,d,1.40));
  }
  function update(dt,p,beat=null){
    const visitorsMoved=wings.update(p,preset,dt);
    const hatchMoved=wings.hatch.update(dt,p);
    const attendantMoved=butler(dt,p);
    let changed=lab.update(dt,p,wings.hatch.shown(),beat)||hatchMoved||attendantMoved||visitorsMoved,shadow=hatchMoved&&wings.hatch.settled();
    for(const d of doors){
      if(d.progress===d.target)continue;
      if(d.target===0&&Math.abs(p.z-d.z)<.92&&Math.abs(p.x)<d.half+.36)d.target=1;
      d.progress= d.target===1 ? Math.min(1,d.progress+dt/.79) : Math.max(0,d.progress-dt/.86);
      const t=step(d.progress),a=(t*t*(3-2*t))*1.57;
      for(const l of d.leaves)l.mesh.rotation.y=l.closed-l.sign*a;
      changed=true;shadow||=d.progress===d.target;
    }
    const isNear=p.y>-.9&&Math.abs(p.x)<18.5&&Math.abs(p.z)<25;
    if(lit!==isNear){lit=isNear;changed=true}
    const night=preset==='night';
    if(lit){
      for(const [i,d] of doors.entries()){
        const light=bounces[i];light.color.setHex(night?0xffdeb3:0xffe1bc);
        light.intensity=night?5.9+.48*d.progress:mix(4.7,12.2,d.progress);
      }
      for(const [i,lamp] of lamps.entries())lamp.intensity=i===1?(night?25.5:20.5):(night?22:17.0);
    }else for(const light of [...lamps,...bounces])light.intensity=0;
    return {changed,shadow};
  }
  function setPreset(id){preset=id;wings.setPreset(id);hallShade.emissiveIntensity=id==='night'?.86:.58}
  return {targetFor,commit,usable,update,setPreset,prepareLab:lab.prepare,labVisible:lab.visible,seesLabExit:lab.seesExit,lodgeOpen:wings.hatch.open,
    staffTalk(player,camera){return lab.staffTalk(player.body.position,camera.getWorldDirection(look));}};
}
