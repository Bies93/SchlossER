import {architectureKit} from './architecture-kit.js';
import {PORTALS,HALL,WINGS,inPalaceWing} from './palace-openings.js';
import {portalFrame} from './palace-facade.js';
import {interiorArch,addPalaceWings} from './palace-wings.js';

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
export function makeHall(T,root,M,world,leaves){
  const limestone=new T.MeshStandardMaterial({color:0xc6beac,roughness:.81});
  const limewash=new T.MeshStandardMaterial({color:0xdacfc0,roughness:.96});
  const plaster=new T.MeshStandardMaterial({color:0xe1d7c6,roughness:.94,side:T.DoubleSide});
  const tileA=M.floor.clone(),tileB=M.floor.clone(),tileC=M.floor.clone(),border=M.seam.clone();
  tileA.color.setHex(0xc9bea9);tileB.color.setHex(0xb8ac99);tileC.color.setHex(0xd6c9b5);
  for(const m of [tileA,tileB,tileC,border,M.floor])m.side=T.DoubleSide;
  const warm=new T.MeshStandardMaterial({color:0xffe5ba,emissive:0xffbd6f,emissiveIntensity:.48,roughness:.8});
  const MAT={...M,limestone,limewash,plaster,tileA,tileB,tileC,border,warm};
  const room=new T.Group();room.name='Schloss · interpretierte Eingangshalle';root.add(room);
  const k=architectureKit(T,room,MAT),box=(m,l,r,b,t,a,d)=>k.box(m,q,l,r,b,t,a,d);
  const spring=3.42,rise=1.37;
  // Thin stone joints, a broad perimeter band and quietly varied flagstones.
  box('border',-half,half,y-.076,y-.013,zMin,zMax);
  box('floor',-half,-half+.42,y-.031,y,zMin,zMax);
  box('floor',half-.42,half,y-.031,y,zMin,zMax);
  for(let z=zMin;z<zMax-.006;z+=.91){
    const next=Math.min(z+.91,zMax),row=Math.round((z-zMin)/.91),offset=row%2?.45:0;
    for(let x=-half+.42-offset;x<half-.42;x+=.90){
      const l=Math.max(-half+.42,x),r=Math.min(half-.42,x+.90);
      const kind=['tileA','tileA','tileB','tileC'][Math.abs((row*7+Math.floor(x*2))%4)];
      box(kind,l+.006,r-.006,y-.024,y,z+.006,next-.006);
    }
  }
  for(const side of [-1,1]){
    const wall=(z,a,d)=>[side*(half-d),a,side*z];
    const min=side>0?zMin:-zMax,max=side>0?zMax:-zMin;
    const span=WINGS.portal+.48;
    k.box('limewash',wall,min,-span,y,spring+.035,-.23,0);
    k.box('limewash',wall,span,max,y,spring+.035,-.23,0);
    interiorArch(k,wall,span,spring+.035);
    for(const [a,b] of [[min,-WINGS.portal-.13],[WINGS.portal+.13,max]]){
      k.box('limestone',wall,a,b,0,1.00,.006,.046);
      k.box('cut',wall,a,b,.99,1.082,.022,.098);
      k.box('seam',wall,a,b,y,.21,.04,.106);
    }
    for(const [a,b] of [[zMin,-WINGS.portal],[WINGS.portal,zMax]]){
      const xs=[side*(half-.079),side*(half+.214)].sort((x,z)=>x-z);
      world.box(xs[0],a,xs[1],b);
    }
    for(const z of [-8.24,-3.44,3.44,8.24]){
      k.box('limestone',wall,z-.218,z+.218,.16,spring,-.006,.147);
      k.box('cut',wall,z-.295,z+.295,.17,.45,0,.211);
      k.box('cut',wall,z-.278,z+.278,spring-.179,spring+.065,0,.215);
    }
    // Two shallow timber benches and two blind plaster panels along each side.
    for(const z of [-5.71,5.71]){
      const a=z-.92,b=z+.92;
      k.box('oak',wall,a,b,.427,.509,.12,.52);
      k.box('inset',wall,a+.09,a+.21,.077,.43,.19,.47);
      k.box('inset',wall,b-.22,b-.088,.077,.43,.19,.47);
      world.box(side>0?half-.55:-half,z-.94,side>0?half:-half+.55,z+.94);
    }
  }
  // Smooth analytic normals on the barrel; the rest of the room retains
  // the crisp edges of the batched stonework.
  const slices=48;
  const curve=Array.from({length:slices+1},(_,i)=>{
    const a=Math.PI*i/slices;
    return [Math.cos(a)*half,spring+Math.sin(a)*rise];
  });
  function vault(name,material,spans,lip=0){
    const pos=[],norm=[],index=[];
    for(const [a,b] of spans){
      const at=pos.length/3;
      for(let i=0;i<=slices;i++){
        const angle=Math.PI*i/slices,x=Math.cos(angle),h=Math.sin(angle);
        const pixel=curve[i],nx=-x/(half-lip*.72),ny=-h/rise,inv=1/Math.hypot(nx,ny);
        for(const z of [a,b]){
          pos.push(pixel[0]-x*lip*.72,pixel[1]-lip,z);
          norm.push(nx*inv,ny*inv,0);
        }
        if(i){const j=at+(i-1)*2;index.push(j,j+1,j+3,j,j+3,j+2)}
      }
    }
    const geo=new T.BufferGeometry();
    geo.setIndex(index);geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
    const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.receiveShadow=true;room.add(mesh);
  }
  vault('Halle · durchgehendes Tonnengewölbe',plaster,[[zMin,zMax]]);
  vault('Halle · Gewölbegurte',limewash,[-8.24,-3.44,3.44,8.24].map(z=>[z-.13,z+.13]),.081);
  for(const d of Object.values(PORTALS)){
    const p=portalFrame(d),east=d.side<0,start=-1.35,end=east?-.021:.033;
    for(const s of [-1,1]){
      const l=s<0?-half:d.half,r=s<0?-d.half:half;
      k.box('wall',p,l,r,y,spring+rise,start,-.455);
      k.box('cut',p,s*d.half-.036,s*d.half+.036,y,Math.min(d.spring,2.91),start,end);
    }
    const closeY=d.spring+d.rise;
    k.box('wall',p,-d.half,d.half,closeY,spring+rise,start,-.30);
    const corners=curve.map(([x,h])=>[d.side*x,h]).sort((a,b)=>a[0]-b[0]);
    // Smooth ceiling termination toward each portal; external masonry still
    // supplies the side recesses and the retained glass fanlight.
    const z=d.side===1?zMax:zMin;
    for(let i=1;i<corners.length;i++){
      const [a,b]=[corners[i-1],corners[i]],base=Math.max(closeY,spring);
      if(a[1]>base&&b[1]>base){
        const points=[[a[0],base,z],[b[0],base,z],[b[0],b[1],z],[a[0],a[1],z]];
        if(d.side>0)points.reverse();
        k.quad('wall',...points);
      }
    }
  }
  const lamps=[],bounces=[];
  function lantern(z){
    box('metal',-.015,.015,3.95,4.77,z-.015,z+.015);
    box('bronze',-.18,.18,3.894,3.947,z-.192,z+.192);
    box('bronze',-.141,.141,3.500,3.551,z-.141,z+.141);
    box('warm',-.108,.108,3.548,3.89,z-.111,z+.111);
    for(const x of [-.133,.133])for(const s of [-1,1])
      box('metal',x-.012,x+.012,3.53,3.92,z+s*.134-.011,z+s*.134+.011);
    const light=new T.PointLight(0xffd4aa,10,9,2);
    light.position.set(0,3.53,z);room.add(light);lamps.push(light);
  }
  lantern(-6.03);lantern(0);lantern(6.17);
  for(const d of Object.values(PORTALS)){
    const light=new T.PointLight(0xffecd0,0,7.3,2);
    light.position.set(0,2.41,d.z-d.side*1.85);room.add(light);bounces.push(light);
  }
  k.flush('Halle · Stein, Putz und Leuchten');
  const wings=addPalaceWings(T,root,world,MAT);

  const doors=Object.values(PORTALS).map(d=>({...d,leaves:leaves[d.id],progress:0,target:0}));
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
  let preset='dusk',lit=false,wasMoving=false;
  function allowGear(p){return !inPalaceWing(p.x,p.z)&&!(Math.abs(p.x)<half+.24&&p.z>=PORTALS.east.z-.49&&p.z<=PORTALS.west.z+.49)}
  function targetFor(player,camera){
    camera.getWorldDirection(look);
    const p=player.body.position;
    return doors.find(d=>{
      const dx=-p.x,dz=d.z-p.z,distance=Math.hypot(dx,dz);
      return Math.abs(p.x)<2.05&&distance<3.2&&(distance<1.25||dx*look.x+dz*look.z>distance*.22);
    });
  }
  function commit(player,camera){
    const d=targetFor(player,camera);if(!d)return false;
    if(!usable(d,player))return false;
    d.target=1-d.target;return true;
  }
  function usable(d,player){return d.target===0||!closeEnough(player.body.position,d,1.40)}
  function update(dt,p){
    wings.update(p,preset);
    let moving=false,changed=false;
    for(const d of doors){
      if(d.progress===d.target)continue;
      if(d.target===0&&Math.abs(p.z-d.z)<.92&&Math.abs(p.x)<d.half+.36)d.target=1;
      d.progress= d.target===1 ? Math.min(1,d.progress+dt/.79) : Math.max(0,d.progress-dt/.86);
      const t=step(d.progress),a=(t*t*(3-2*t))*1.57;
      for(const l of d.leaves)l.mesh.rotation.y=l.closed-l.sign*a;
      changed=true;moving||=d.progress!==d.target;
    }
    const shadow=wasMoving&&!moving||changed&&!moving;wasMoving=moving;
    const isNear=Math.abs(p.x)<15&&Math.abs(p.z)<25;
    if(lit!==isNear){lit=isNear;changed=true}
    const outdoor=preset==='night'?.45:7.8;
    if(lit){
      for(const [i,d] of doors.entries())bounces[i].intensity=outdoor*mix(.05,1,d.progress);
      for(const lamp of lamps)lamp.intensity=preset==='night'?16.5:11.4;
    }else for(const light of [...lamps,...bounces])light.intensity=0;
    return {changed,shadow};
  }
  function setPreset(id){preset=id;wings.setPreset(id);warm.emissiveIntensity=id==='night'?.76:.45}
  return {targetFor,commit,usable,update,setPreset,allowGear};
}
