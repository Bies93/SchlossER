import {HALL,WINGS} from './palace-openings.js';

const {z:Z,partition,outer,ceiling:y}=WINGS;
const tau=Math.PI*2;
export const wingLampStations=[8.19,16.57,24.57];
export const wingLampMount=y-.183;

export function wingCeilingMaterials(T,plaster){
  const finish=(color,roughness=.92,n=.21)=>new T.MeshStandardMaterial({
    color,roughness,...plaster,normalScale:new T.Vector2(n,n)
  });
  return {
    ceilingIvory:finish(0xe6d5b8,.86,.17),ceilingBead:finish(0xf2dfbb,.78,.11),
    ceilingShadow:finish(0xb9a48c,.95,.23),ceilingOchre:finish(0xc1a268,.77,.13),
    ceilingNorth:finish(0xb8c9c7),ceilingNorthBand:finish(0x819897,.87),
    ceilingSouth:finish(0xddbd9f),ceilingSouthBand:finish(0xb78670,.87)
  };
}

// Connected profiles in the same metre grid as the new partition. Depths
// run from roof to room; no ornamental print sits on top of the same plane.
export function cofferedWing(k,p,north){
  const main=north?'ceilingNorth':'ceilingSouth',band=north?'ceilingNorthBand':'ceilingSouthBand';
  const contour=(l,r,d,f,c)=>[[l+c,d],[r-c,d],[r,d+c],[r,f-c],[r-c,f],[l+c,f],[l,f-c],[l,d+c]];
  const rect=(l,r,d,f,c)=>inset=>contour(l+inset,r-inset,d+inset,f-inset,Math.max(.055,c-inset*.49));
  const point=([u,z],h)=>p(u,h,z);
  function mould(path,levels){
    for(let i=1;i<levels.length;i++){
      const [s,h]=levels[i-1],[t,H,mat]=levels[i],a=path(s),b=path(t);
      for(let j=0;j<a.length;j++){
        const n=(j+1)%a.length;
        k.quad(mat,point(a[j],h),point(a[n],h),point(b[n],H),point(b[j],H),1.46);
      }
    }
  }
  function field(path,inset,h,mat){
    const a=path(inset),u=a.reduce((s,q)=>s+q[0],0)/a.length,z=a.reduce((s,q)=>s+q[1],0)/a.length;
    const v=p(u,h,z),uv=(x,z)=>[x*.48,z*.48];
    for(let j=0;j<a.length;j++){
      const n=(j+1)%a.length;
      k.triangle(mat,v,point(a[j],h),point(a[n],h),[...uv(u,z),...uv(...a[j]),...uv(...a[n])]);
    }
  }
  const profiles=[
    [.0,y-.002],[.032,y-.078,'ceilingShadow'],[.097,y-.135,'ceilingIvory'],
    [.154,y-.141,'ceilingBead'],[.180,y-.108,'ceilingIvory'],[.202,y-.046,'ceilingShadow'],
    [.282,y-.048,band],[.296,y-.064,'ceilingOchre'],[.315,y-.064,'ceilingOchre'],
    [.329,y-.032,'ceilingIvory']
  ];
  const approach=HALL.half+HALL.wallDepth,after=partition+.28;
  for(const [l,r] of [[approach,partition],[after,outer]]){
    const path=rect(l+.008,r-.008,-Z+.027,Z-.027,.166);
    mould(path,[[0,y-.001],[.064,y-.092,'ceilingShadow'],[.158,y-.173,'ceilingIvory'],
      [.217,y-.175,'ceilingBead'],[.261,y-.124,'ceilingIvory'],[.28,y-.062,'ceilingShadow'],
      [.333,y-.052,band],[.352,y-.019,'ceilingIvory']]);
  }
  function lap(u,z,rx,rz,N=32){
    return inset=>Array.from({length:N},(_,i)=>{
      const a=tau*i/N;
      return [u+(rx-inset)*Math.cos(a),z+(rz-inset)*Math.sin(a)];
    });
  }
  function leaf(u,z,y,angle,len,width,base,high){
    const c=Math.cos(angle),s=Math.sin(angle),curve=(t,w,h)=>p(u+t*c-w*s,y+h,z+t*s+w*c);
    const a=curve(0,0,.006),b=curve(len*.43,-width,0),d=curve(len*.64,width*.76,-.002),
      e=curve(len,0,.005),q=curve(len*.47,0,-.019);
    const tri=(m,v,w,x)=>k.triangle(m,v,w,x,[0,0,1,0,.5,1]);
    tri(base,a,b,q);tri(base,b,e,q);tri(high,e,d,q);tri(high,d,a,q);
  }
  function flower(u,z,scale=1,lit=false,h=y-.0315){
    const ellipse=lap(u,z,.76*scale,.76*scale,32);
    mould(ellipse,[[0,h],[.022*scale,h-.024*scale,'ceilingShadow'],
      [.045*scale,h-.043*scale,'ceilingOchre'],[.069*scale,h-.045*scale,'ceilingBead'],
      [.096*scale,h-.029*scale,'ceilingIvory']]);
    field(ellipse,.096*scale,h-.029*scale,band);
    for(let i=0;i<12;i++){
      const a=i*tau/12;
      leaf(u+.117*scale*Math.cos(a),z+.117*scale*Math.sin(a),h-.033*scale,a,.51*scale,.083*scale,
        i%3===0?'ceilingOchre':'ceilingIvory','ceilingBead');
    }
    const center=lap(u,z,.192*scale,.192*scale,24);
    const bottom=lit?wingLampMount:h-.096*scale;
    mould(center,[[0,h-.036*scale],[.017*scale,h-.075*scale,'ceilingIvory'],
      [.037*scale,bottom,'ceilingOchre'],[.063*scale,bottom,'ceilingBead']]);
    field(center,.063*scale,bottom,'ceilingIvory');
  }
  const bays=[[approach+.43,partition-.49],[after+.40,20.16],[20.48,outer-.43]];
  for(const [i,[l,r]] of bays.entries()){
    const d=5.89,center=wingLampStations[i],pocket=rect(l,r,-d,d,.52);
    mould(pocket,profiles);field(pocket,.329,y-.032,main);
    const oval=lap(center,0,1.22,1.62,40);
    mould(oval,[[0,y-.033],[.022,y-.054,'ceilingIvory'],[.053,y-.057,'ceilingOchre'],
      [.073,y-.044,'ceilingIvory']]);
    flower(center,0,1,true);
    for(const side of [-1,1]){
      flower(center,side*4.16,.64);
      for(let j=0;j<5;j++){
        const z=side*(1.94+j*.31);
        for(const s of [-1,1])leaf(center,z,y-.037,side*Math.PI/2+s*.80,.32,.050,'ceilingOchre','ceilingIvory');
      }
    }
    for(const [u,s] of [[l+.67,1],[r-.67,-1]])for(const side of [-1,1]){
      const z=side*(d-.60),a=s<0?Math.PI:0,angle=a-side*s*.76;
      for(let j=-2;j<=2;j++)
        leaf(u,z,y-.037,angle+j*.21,.54-.060*Math.abs(j),.045,'ceilingIvory','ceilingOchre');
    }
  }
}
