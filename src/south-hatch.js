import {architectureKit} from './architecture-kit.js';
import {HALL,SOUTH_HATCH} from './palace-openings.js';
import {PLAYER} from './world-layout.js';

const {x0,x1,z0,z1}=SOUTH_HATCH,Y=HALL.floor,pi=Math.PI;
const hingeZ=z0+.020,railZ=z1-.026;
const ringX=x0+.87,ringZ=z1-.167;
const smooth=t=>t*t*(3-2*t);

export function splitHatchFloor(l,r,d,f){
  const a=Math.max(l,x0),b=Math.min(r,x1),c=Math.max(d,z0),e=Math.min(f,z1);
  if(a>=b||c>=e)return {room:[[l,r,d,f]],lid:null};
  return {room:[[l,a,d,f],[b,r,d,f],[a,b,d,c],[a,b,e,f]].filter(([u,v,s,t])=>v-u>.001&&t-s>.001),lid:[a,b,c,e]};
}

export function galleryHatch(T,root,world,materials){
  const lid=new T.Group(),rail=new T.Group();
  lid.name='Südgalerie · getarnte Steinbodenklappe';rail.name='Südgalerie · ausklappbare Absturzsicherung';
  lid.position.set(0,Y,hingeZ);rail.position.set(0,Y,railZ);root.add(lid,rail);
  const k=architectureKit(T,lid,materials),g=architectureKit(T,rail,materials),p=(x,y,z)=>[x,y,z];
  const part=(m,a,b,c,d,e,f)=>k.box(m,p,a,b,c,d,e-hingeZ,f-hingeZ);
  // The group pivot runs along the long, wall-side hinge rather than
  // swinging the full length of the stair up into the gallery ceiling.
  const d={id:'gallery-hatch',label:'Bodenklappe',target:0,progress:0};
  const visibleGuard=()=>d.progress>.10;
  const belowEdge=p=>visibleGuard()&&p.y>Y-.29&&p.y<Y+.82;
  world.box(x0+.19,railZ-.022,x1+.035,railZ+.022,belowEdge);
  world.box(x0+.031,z0-.024,x1+.005,z0+.023,belowEdge);
  const standingOn=p=>p.x>x0-.31&&p.x<x1+.31&&p.z>z0-.31&&p.z<z1+.31;
  d.usable=p=>p.y>Y-.105&&!standingOn(p);
  d.prompt=usable=>!usable?'Zum Betätigen neben die Bodenklappe treten':d.target===1?'Bodenklappe schließen':'Verdeckten Zugring ziehen';
  const r=new T.TorusGeometry(.052,.0075,8,24).rotateX(-pi/2).scale(1,1,.64),m=new T.Matrix4();
  k.geometry('brass',r,m.makeTranslation(ringX,.004,ringZ-hingeZ));r.dispose();
  part('iron',ringX-.096,ringX+.095,-.014,.0017,ringZ-.061,ringZ+.062);
  for(const a of [ringX-.082,ringX+.082])part('brass',a-.009,a+.009,.002,.006,ringZ-.008,ringZ+.007);
  part('brass',ringX-.020,ringX+.020,-.003,.004,ringZ+.023,ringZ+.035);
  for(const x of [x0+.31,(x0+x1)/2,x1-.35]){
    part('iron',x-.116,x+.104,-.014,.004,z0+.016,z0+.074);
    part('brass',x-.067,x+.063,-.012,.005,z0+.017,z0+.034);
  }
  for(const z of [z0+.024,z1-.026])part('iron',x0+.018,x1-.019,-.030,-.005,z-.008,z+.008);
  const bar=(m,a,b,y,h,z,Z)=>g.box(m,p,a,b,y,h,z,Z);
  for(const x of [x0+.224,x0+1.15,x0+2.43,x1-.074]){
    bar('iron',x-.019,x+.019,-.032,.032,-.87,-.025);
    bar('brass',x-.038,x+.038,-.034,.030,-.114,-.025);
  }
  for(const z of [-.487,-.862])bar('iron',x0+.219,x1-.062,-.024,.024,z-.022,z+.022);
  bar('brass',x0+.221,x1-.064,-.025,.025,-.890,-.875);
  rail.position.y=Y-.058;
  rail.visible=false;
  g.flush(rail.name);
  function tile(m,a,b,y,h,c,e){
    const l=Math.max(x0+.019,a),s=Math.min(x1-.019,b),n=Math.max(z0+.021,c),t=Math.min(z1-.020,e);
    if(l<s&&n<t)part(m,l,s,y-Y,h-Y,n,t);
  }
  return {tile,finish:()=>k.flush(lid.name),
    open:()=>d.progress>=.92, shown:()=>d.progress>.006, settled:()=>d.progress===d.target,
    target(p,look){
      if(p.y<Y-.113)return null;
      const dx=ringX-p.x,dz=ringZ-p.z,dy=Y+.03-p.y-PLAYER.eye,near=Math.hypot(dx,dz);
      if(near>2.11||dx*look.x+dz*look.z+dy*look.y<Math.hypot(dx,dz,dy)*.74)return null;
      return d;
    },
    update(dt,p){
      if(dt<=0||d.progress===d.target)return false;
      // Closing above the player or flipping a tile under their feet is
      // blocked. Keep the only exit open throughout the basement visit.
      if(d.target===0&&standingOn(p)&&p.y>-.61)d.target=1;
      d.progress=Math.max(0,Math.min(1,d.progress+(d.target?1:-1)*dt/.92));
      lid.rotation.x=-smooth(d.progress)*(pi*.513);
      rail.rotation.x=smooth(d.progress)*pi/2;
      rail.visible=visibleGuard();
      return true;
    }
  };
}
