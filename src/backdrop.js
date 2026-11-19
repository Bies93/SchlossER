import {PERIMETER,insidePerimeter} from './world-layout.js';
import {randomSource,sharedSet} from './surface-detail.js';
import {WC_CUT} from './park-stair.js';
import {LAB_CUT} from './lab-layout.js';
import {SOUTH_HATCH_CUT} from './palace-openings.js';
import {parkFacadeClearance} from './park-architecture.js';

const tau=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const fade=(a,b,t)=>{const k=Math.max(0,Math.min(1,(t-a)/(b-a)));return k*k*(3-2*k)};
const earth=-.30;
function height(x,z){
  // Exactly flat under the authored world. The rise comes into view
  // beyond the second band of buildings, not beneath the gate thresholds.
  const d=Math.hypot(Math.max(0,Math.abs(x)-99),Math.max(0,z-106,-275-z));
  const y=10+10*Math.sin(x*.0079+z*.0041)+8*Math.cos(z*.0092-x*.0037)
    +4.8*Math.cos(x*.018+z*.013)+3.1*Math.sin(x*.024-z*.022);
  return earth+fade(41,330,d)*y;
}
function edgeFrame({a,b}){
  const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;
  return {L,ux,uz,nx:uz,nz:-ux,point:(u,y,d)=>[a[0]+ux*u+uz*d,y,a[1]+uz*u-ux*d]};
}
const regionId=(x,z)=>Math.floor(x/100)+':'+Math.floor(z/102);

export function addBackdrop(T,scene){
  const world=new T.Group();world.name='Fernkulisse · Stadt, Baumgürtel und Horizont';scene.add(world);
  const rng=randomSource(175514),range=(a,b)=>lerp(a,b,rng()),pick=arr=>arr[Math.floor(rng()*arr.length)];
  const colors=values=>values.map(v=>new T.Color(v));
  const walls=colors([0xc2aa90,0xb7aea3,0xc5b5a2,0xc3b9a3,0xa69a82,0x9eaa9c,0xc09f8b,0xb9a48e]);
  const tiles=colors([0x795449,0x825a4c,0x665354,0x575660,0x6d5954,0x9b7360]);
  const woods=colors([0x504d49,0x746456,0x595f55,0x7b6851]);
  const trees=colors([0x4b5841,0x596447,0x536547,0x657056,0x536452,0x665f4a]);
  const neutral=new T.Color(0xffffff),shade=new T.Color(0x575b59),glint=new T.Color(0xbb9f72),curb=new T.Color(0xa9a18f);
  const vertex=(roughness,extra={})=>new T.MeshStandardMaterial({vertexColors:true,roughness,side:T.DoubleSide,...extra});
  const materials={
    facade:vertex(1,{...sharedSet(T,'plaster',256)}),
    roof:vertex(1,{...sharedSet(T,'tile',256)}),
    trim:vertex(.96),paving:vertex(1,{...sharedSet(T,'setts',256)}),glass:vertex(.67),
    lit:vertex(.60,{emissive:0xc38c55,emissiveIntensity:0}),
    far:new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide})
  };
  materials.facade.normalScale.setScalar(.19);materials.roof.normalScale.setScalar(.24);
  materials.paving.normalScale.setScalar(.44);
  const groups=new Map();
  const bins=(x,z)=>{
    const key=regionId(x,z);
    if(!groups.has(key))groups.set(key,new Map());
    return groups.get(key);
  };
  const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  function poly(bin,m,points,c,scale=2.4){
    if(!bin.has(m))bin.set(m,{p:[],uv:[],c:[]});
    const dst=bin.get(m),uv=[[0,0],[length(points[0],points[1])/scale,0],
      [length(points[0],points[1])/scale,length(points[0],points.at(-1))/scale],[0,length(points[0],points.at(-1))/scale]];
    for(const i of (points.length===3?[0,1,2]:[0,1,2,0,2,3])){
      dst.p.push(...points[i]);dst.uv.push(...uv[i]);dst.c.push(c.r,c.g,c.b);
    }
  }
  const quad=(bin,m,a,b,c,d,t,s)=>poly(bin,m,[a,b,c,d],t,s);
  function box(bin,m,p,l,r,b,t,d,e,col){
    const a=p(l,b,d),f=p(r,b,d),g=p(r,b,e),h=p(l,b,e),A=p(l,t,d),F=p(r,t,d),G=p(r,t,e),H=p(l,t,e);
    quad(bin,m,h,g,G,H,col);quad(bin,m,f,a,A,F,col);
    quad(bin,m,g,f,F,G,col);quad(bin,m,a,h,H,A,col);
    quad(bin,m,H,G,F,A,col);quad(bin,m,a,f,g,h,col);
  }
  const laneAreas=[];
  const lanes=PERIMETER.filter(e=>e.type==='streetGate'||e.type==='parkGate');
  for(const e of lanes){
    const f=edgeFrame(e),city=e.type==='streetGate',rear=e.gate?.startsWith('hospital'),
      axis=f.L*.5,turn=(e.id%2?1:-1)*(city?1:-1);
    const sections=rear?[[axis,.38],[axis,9.4]]:
      [[axis,.38],[axis,7.5],[axis+turn*1.2,17],[axis+turn*4.7,33],[axis+turn*9.6,53],[axis+turn*18,76]];
    const road=new T.Color(city?0x747067:0x8f8979),walk=new T.Color(city?0xaaa093:0xa49f89);
    const widths=city?[2.65,2.7,3.1,3.5,3.5,2.7]:[1.92,1.99,2.42,3.2,3.4,2.6];
    const [cx,,cz]=f.point(axis,0,28),bin=bins(cx,cz);
    for(let i=1;i<sections.length;i++){
      const [a,d]=sections[i-1],[b,n]=sections[i],q=widths[i-1],r=widths[i];
      const [x,,z]=f.point((a+b)*.5,0,(d+n)*.5);
      laneAreas.push({x,z,limit:Math.hypot((n-d)*.5,5.4)});
      const at=(u,v)=>{const [x,,z]=f.point(u,0,v);return [x,height(x,z)+.069,z]};
      const face=(m,l,g,col)=>quad(bin,m,at(a+l*q,d),at(a+g*q,d),at(b+g*r,n),at(b+l*r,n),col,1.55);
      face('paving',-1,1,road);
      for(const side of [-1,1]){
        face('paving',side*.98,side*1.36,walk);
        face('paving',side*.935,side*.98,curb);
      }
    }
    // Small amber lantern heads suggest that the street continues; farther
    // ones are emissive geometry only, never extra real-time lights.
    for(const [i,d] of (rear?[6.0]:[6.0,21.0,43.0]).entries()){
      const x=axis+turn*(i===0?0:i===1?1.8:7.2)-4.25,z=d,h=city?3.8:3.45,p=f.point;
      box(bin,'trim',p,x-.026,x+.026,-.23,h-.28,z-.028,z+.028,shade);
      box(bin,'lit',p,x-.105,x+.105,h-.32,h-.12,z-.105,z+.105,glint);
      box(bin,'trim',p,x-.142,x+.142,h-.125,h-.089,z-.137,z+.137,shade);
    }
  }
  // The east gates look onto the same street, not two roads vanishing into
  // a blank horizon. Only this short exterior view is modeled.
  const hospitalStreet=[[-82,-263],[-56,-263.3],[-19,-264.7],[18,-266.6],[52,-268.4],[75,-266.2]];
  for(let i=1;i<hospitalStreet.length;i++){
    const a=hospitalStreet[i-1],b=hospitalStreet[i],bin=bins((a[0]+b[0])*.5,(a[1]+b[1])*.5);
    const p=([x,z],d,h)=>[x,height(x,z+d)+h,z+d];
    const strip=(a0,a1,c,h)=>quad(bin,'paving',p(a,a1,h),p(b,a1,h),p(b,a0,h),p(a,a0,h),c,3.3);
    strip(-3.15,3.15,new T.Color(0x77736b),.054);
    strip(3.15,4.80,new T.Color(0xa7a08d),.105);
    strip(-4.80,-3.15,new T.Color(0xa7a08d),.105);
    for(const t of [-3.17,3.14])strip(t,t+.10,curb,.111);
    laneAreas.push({x:(a[0]+b[0])*.5,z:(a[1]+b[1])*.5,limit:Math.hypot((b[0]-a[0])*.5,4.8)});
  }
  function laneFree(x,z,w=0){return !laneAreas.some(l=>Math.hypot(x-l.x,z-l.z)<l.limit+w)}
  const sites=[];
  function placeHouse(x,z,angle,w,d,h,kind,detail){
    const ux=Math.cos(angle),uz=Math.sin(angle);
    // Never let a rotated background façade cut into the playable corner.
    // A centre-only check can miss the long edge on a recessed frontage.
    const overlaps=detail&&[-w*.50,0,w*.50].some(u=>[0,-d*.48,-d].some(v=>
      insidePerimeter(x+u*ux-v*uz,z+u*uz+v*ux)));
    if(overlaps||insidePerimeter(x,z)||parkFacadeClearance(x+d*.48*Math.sin(angle),z-d*.48*Math.cos(angle),Math.min(6,w*.48))
      ||sites.some(s=>Math.hypot(x-s.x,z-s.z)<Math.min(w,s.w)*.52&&detail))return;
    sites.push({x,z,w});
    const base=height(x,z),xdir=Math.cos(angle),zdir=Math.sin(angle);
    const p=(u,y,v)=>[x+u*xdir-v*zdir,base+y,z+u*zdir+v*xdir],bin=bins(x,z),l=-w*.5,r=w*.5,back=-d;
    const color=pick(walls),roof=pick(tiles),frame=pick(woods),trim=color.clone().lerp(neutral,.15),
      far=detail?null:'far',plinth=color.clone().multiplyScalar(.70),pitch=range(1.7,3.7),ridge=range(.38,.61);
    box(bin,far??'facade',p,l,r,0,h,back,0,color);
    if(detail){
      box(bin,'trim',p,l-.025,r+.025,.05,.50,.018,.090,plinth);
      box(bin,'trim',p,l-.08,r+.08,h-.18,h-.035,back-.12,.15,trim);
      const n=Math.max(2,Math.round(w/2.68)),floors=Math.max(2,Math.round(h/2.73));
      for(let y=0;y<floors;y++)for(let i=0;i<n;i++){
        const at=l+(i+.5)*w/n,bottom=.65+y*(h-.43)/floors,bw=range(.33,.49),top=bottom+range(1.20,1.54);
        const door=y===0&&i===n-1&&kind!==1;
        quad(bin,'trim',p(at-bw-.07,door?.0:bottom-.077,.012),p(at+bw+.07,door?.0:bottom-.077,.012),
          p(at+bw+.07,top+.082,.012),p(at-bw-.07,top+.082,.012),trim);
        quad(bin,door?'trim':rng()<.19?'lit':'glass',p(at-bw,door?.027:bottom,.039),p(at+bw,door?.027:bottom,.039),
          p(at+bw,top,.039),p(at-bw,top,.039),door?frame:shade);
        if(!door){
          box(bin,'trim',p,at-bw-.08,at+bw+.08,bottom-.06,bottom-.01,.012,.14,trim);
          quad(bin,'trim',p(at-.019,bottom,.047),p(at+.019,bottom,.047),
            p(at+.019,top,.047),p(at-.019,top,.047),frame);
          if(kind===1&&(i+y)%3!==0){
            for(const s of [-1,1]){
              const center=at+s*(bw+.14);
              box(bin,'trim',p,center-.083,center+.084,bottom-.012,top+.014,.019,.057,frame);
            }
          }
        }
      }
      // Side glazing keeps the corner roofs from looking like flat sets.
      for(const s of [-1,1])for(const z of [-d*.23,-d*.54,-d*.78]){
        const P=(u,y,v)=>p(s*(r+v),y,z+u);
        if(rng()<.24)continue;
        quad(bin,'glass',P(-.37,3.29,.012),P(.37,3.29,.012),P(.37,4.52,.012),P(-.37,4.52,.012),shade);
      }
    }
    const roofKind=kind%3,high=h+pitch,over=.21,front=.25,frontSlope=-d*ridge;
    const hipped=roofKind===1?Math.min(w*.19,1.3):0,
      a=p(l-over,h,front),b=p(r+over,h,front),c=p(r+over,h,back-over),e=p(l-over,h,back-over);
    const ridgeA=p(l+hipped,high,frontSlope),ridgeB=p(r-hipped,high,frontSlope);
    if(roofKind===2&&detail){
      const A=p(l-over,h+pitch*.56,-d*.22),B=p(r+over,h+pitch*.56,-d*.22),
        C=p(r+over,h+pitch*.56,-d*.77),D=p(l-over,h+pitch*.56,-d*.77);
      quad(bin,'roof',a,b,B,A,roof);quad(bin,'roof',A,B,ridgeB,ridgeA,roof);
      quad(bin,'roof',c,e,D,C,roof);quad(bin,'roof',C,D,ridgeA,ridgeB,roof);
      quad(bin,'facade',e,a,A,D,trim);poly(bin,'facade',[D,A,ridgeA],trim);
      quad(bin,'facade',b,c,C,B,trim);poly(bin,'facade',[B,C,ridgeB],trim);
    }else{
      quad(bin,far??'roof',a,b,ridgeB,ridgeA,roof);quad(bin,far??'roof',c,e,ridgeA,ridgeB,roof);
      poly(bin,hipped?far??'roof':far??'facade',[e,a,ridgeA],hipped?roof:color);
      poly(bin,hipped?far??'roof':far??'facade',[b,c,ridgeB],hipped?roof:color);
    }
    if(detail||rng()<.35){
      const x=range(-w*.30,w*.26);
      box(bin,far??'trim',p,x-.23,x+.24,high-.82,high+.66,frontSlope-.61,frontSlope-.19,plinth);
      box(bin,far??'trim',p,x-.29,x+.30,high+.57,high+.69,frontSlope-.66,frontSlope-.14,frame);
    }
    if(detail&&w>7.4){
      const x=range(-w*.21,w*.21),D=-d*.23,Y=h+pitch*.58,wh=.53;
      box(bin,'facade',p,x-wh,x+wh,Y-.56,Y+.36,D-.38,D,trim);
      poly(bin,'facade',[p(x-wh,Y+.36,D),p(x+wh,Y+.36,D),p(x,Y+.80,D)],trim);
      quad(bin,'roof',p(x-wh-.12,Y+.36,D+.11),p(x,Y+.80,D+.11),p(x,Y+.80,D-.52),p(x-wh-.12,Y+.36,D-.52),roof);
      quad(bin,'roof',p(x,Y+.80,D+.11),p(x+wh+.12,Y+.36,D+.11),p(x+wh+.12,Y+.36,D-.52),p(x,Y+.80,D-.52),roof);
      quad(bin,'glass',p(x-.22,Y-.31,D+.008),p(x+.22,Y-.31,D+.008),p(x+.22,Y+.18,D+.008),p(x-.22,Y+.18,D+.008),shade);
    }
  }
  for(const e of lanes.filter(e=>e.type==='streetGate')){
    const f=edgeFrame(e),along=Math.atan2(f.nz,f.nx),turn=e.id%2?1:-1;
    for(const side of [-1,1])for(let i=0;i<2;i++){
      const flank=f.L*.5+(i===1?turn*2.1:0)+side*(i===1?7.8:6.2);
      const [x,,z]=f.point(flank,0,13.0+i*12.7+side*.62);
      placeHouse(x,z,along+(side>0?Math.PI:0),i===0?8.4:10.3,6.8+i*2.6,6.8+i*.57+(side>0?.73:0),i+Number(side<0),true);
    }
  }
  // City frontage sits behind the modeled buildings. At grilles and gaps
  // two quieter rows continue the town; the playable side stays untouched.
  for(const e of PERIMETER){
    if(!['house','annex','wall','iron'].includes(e.type))continue;
    const f=edgeFrame(e),city=e.type==='house'||e.type==='annex';
    const angle=Math.atan2(f.uz,f.ux);
    for(const depth of (city?[15.3,36.8,64]:[26,53])){
      const interval=city?range(7.8,11.9):range(15.0,24.0);
      const lowRow=depth<16&&[2,3,4,16,17,18].includes(e.id);
      for(let u=interval*.44;u<f.L;u+=interval*range(.85,1.19)){
        if(!city&&rng()<(depth<30?.47:.68))continue;
        const [x,,z]=f.point(u,0,depth+range(-2.0,4.4)),w=range(6.1,Math.min(interval,13)),
          d=range(6.7,10.6),h=(city?range(6.4,10.7):range(4.6,7.9))+(depth>60?2.4:0);
        if(!laneFree(x,z,w*.37))continue;
        placeHouse(x,z,angle+range(-.045,.054),w,d,lowRow?Math.min(h,6.8):h,Math.floor(range(0,3)),depth<53);
      }
    }
  }
  for(let i=0;i<70;i++){
    const a=range(0,tau),rad=range(145,390),x=Math.cos(a)*rad,z=-54+Math.sin(a)*rad;
    if(!laneFree(x,z,5)||Math.abs(x)<104&&z>-277&&z<100||rng()>.76)continue;
    placeHouse(x,z,Math.round(a/(Math.PI*.5))*Math.PI*.5,range(8,16),range(8,14),range(7,15),Math.floor(range(0,3)),false);
  }
  function distantTower(x,z,yaw,major){
    const c=Math.cos(yaw),s=Math.sin(yaw),f=major?1:.72,base=height(x,z);
    const p=(a,b,d)=>[x+(c*a-s*d)*f,base+b*f,z+(s*a+c*d)*f],bin=bins(x,z),
      walls=new T.Color(0x9e988e),roof=new T.Color(0x4f5e62),line=new T.Color(0x62635e);
    box(bin,'far',p,-2.25,2.25,0,18.7,-1.9,1.9,walls);
    box(bin,'far',p,-2.5,2.5,16.9,17.35,-2.14,2.14,line);
    box(bin,'far',p,-1.65,1.65,18.7,24.1,-1.65,1.65,walls);
    const a=[p(-1.91,23.92,-1.91),p(1.91,23.92,-1.91),p(1.91,23.92,1.91),p(-1.91,23.92,1.91)];
    for(let i=0;i<4;i++)poly(bin,'far',[a[i],a[(i+1)%4],p(0,major?34:31,0)],roof);
  }
  // Invented roofline accents, not claims about individual real buildings.
  distantTower(-111,113,.12,true);distantTower(103,137,-.21,false);distantTower(119,-291,.2,false);

  for(const [id,bin] of groups){
    const b=new T.Group();b.name='Fernkulisse · Quartier '+id;world.add(b);
    for(const [name,{p,uv,c}] of bin){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(p,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();
      const m=new T.Mesh(g,materials[name]);m.receiveShadow=name==='paving';b.add(m);
    }
  }
  const canopy=new T.IcosahedronGeometry(1,1),head=new T.MeshLambertMaterial({color:0xffffff});
  const bark=new T.MeshLambertMaterial({color:0x51473c}),trunk=new T.CylinderGeometry(.67,1,1,5);
  const cluster=(records,bin)=>{
    if(!records.length)return;
    const tops=new T.InstancedMesh(canopy,head,records.length*4),stems=new T.InstancedMesh(trunk,bark,records.length);
    const o=new T.Object3D();let k=0;
    records.forEach(({x,z,h,w,tint},i)=>{
      const y=height(x,z);o.rotation.set(0,range(0,tau),0);o.position.set(x,y+h*.38,z);o.scale.set(w*.08,h*.76,w*.08);
      o.updateMatrix();stems.setMatrixAt(i,o.matrix);
      for(let l=0;l<4;l++){
        const a=i*2.399+l*1.62,reach=l===0?0:w*.57;
        o.position.set(x+reach*Math.cos(a),y+h*(l===0?.77:range(.53,.73)),z+reach*Math.sin(a));
        o.rotation.set(range(-.27,.27),a,range(-.28,.28));
        o.scale.set(w*range(.74,1.13),h*range(.18,.33),w*range(.77,1.19));o.updateMatrix();tops.setMatrixAt(k,o.matrix);
        tops.setColorAt(k++,tint.clone().multiplyScalar(range(.73,1.17)));
      }
    });
    stems.computeBoundingSphere();tops.computeBoundingSphere();bin.add(stems,tops);
  };
  const stands=new Map();
  for(let i=0;i<380;i++){
    const a=range(0,tau),r=range(100,415),x=Math.cos(a)*r,z=-92+Math.sin(a)*r;
    if(Math.abs(x)<91&&z>-281&&z<97||parkFacadeClearance(x,z,3)||!laneFree(x,z,3)||sites.some(s=>Math.hypot(x-s.x,z-s.z)<s.w*.52+2))continue;
    if(z>76&&Math.abs(x)<123&&rng()<.66)continue;
    const key=regionId(x,z);if(!stands.has(key))stands.set(key,[]);
    stands.get(key).push({x,z,h:range(8,18),w:range(2.2,4.5),tint:pick(trees)});
  }
  for(const [id,record] of stands){
    const g=new T.Group();g.name='Fernkulisse · Gehölz '+id;world.add(g);cluster(record,g);
  }
  // Split the original grid at the WC cutout, so its below-grade geometry
  // is genuinely visible. No clipping shader or extra render surface.
  const grid=Array.from({length:93},(_,i)=>1710*(i/92-.5));
  const cutouts=[WC_CUT,LAB_CUT,SOUTH_HATCH_CUT];
  const coordinates=(lo,hi)=>[...new Set([...grid,...cutouts.flatMap(c=>[c[lo],c[hi]])])].sort((a,b)=>a-b);
  const xs=coordinates('left','right'),zs=coordinates('back','front');
  const land=new T.BufferGeometry(),points=[],index=[],tints=[];
  const mud=new T.Color(0x929178),field=new T.Color(0x656e56),woodland=new T.Color(0x49594b);
  for(const z of zs)for(const x of xs){
    points.push(x,height(x,z)-earth,z);
    const d=Math.hypot(x,z+65),n=.50+.27*Math.sin(x*.024+z*.011)+.16*Math.sin(z*.037-x*.014);
    const tint=mud.clone().lerp(field,fade(83,224,d)*(.42+.46*n)).lerp(woodland,fade(260,625,d)*(.50+.33*n));
    tints.push(tint.r,tint.g,tint.b);
  }
  for(let j=1;j<zs.length;j++)for(let i=1;i<xs.length;i++){
    if(cutouts.some(c=>xs[i-1]>=c.left&&xs[i]<=c.right&&zs[j-1]>=c.back&&zs[j]<=c.front))continue;
    const a=(j-1)*xs.length+i-1,b=a+xs.length;
    index.push(a,b,b+1,a,b+1,a+1);
  }
  land.setIndex(index);land.setAttribute('position',new T.Float32BufferAttribute(points,3));
  land.setAttribute('color',new T.Float32BufferAttribute(tints,3));land.computeVertexNormals();
  const ground=new T.Mesh(land,new T.MeshLambertMaterial({vertexColors:true}));
  ground.name='Fernkulisse · Gelände';ground.position.y=earth;ground.receiveShadow=true;world.add(ground);
  return {ground,setPreset(id){materials.lit.emissiveIntensity=id==='night'?.78:.27}};
}
