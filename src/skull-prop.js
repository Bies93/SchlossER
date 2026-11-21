import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Museum-scale sculpt (+Z is the face), generated once and then baked into
// each room's existing finish batches. Holes are recessed geometry.
const cache=new WeakMap(),clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
function ell(x,y,z,a,b,c){
  return (Math.hypot(x/a,y/b,z/c)-1)*Math.min(a,b,c);
}
function blend(a,b,r){
  const h=Math.max(0,r-Math.abs(a-b))/r;
  return Math.min(a,b)-h*h*r*.25;
}
const carve=(a,b,r)=>-blend(-a,b,r);
function cranium(x,y,z){
  const u=Math.abs(x),side=x<0?-.0019:.001;
  let f=ell(x+.002,y-.151,z+.039,.077,.085,.101);
  f=blend(f,ell(x,y-.165,z-.021,.069,.060,.064),.025);
  f=blend(f,ell(x,y-.074,z-.045,.044,.031,.051),.019);
  f=blend(f,ell(u-.052,y-.097,z-.043,.023,.025,.044),.015);
  // Cheekbones reach back to the temporal arches, not forwards into the eyes.
  f=blend(f,ell(u-.067,y-.100-(z-.035)*.11,z-.014,.012,.013,.058),.009);
  f=blend(f,ell(x,y-.128,z-.066,.012,.032,.023),.011);
  const a=u-.0365,b=y-.129-side+a*.14;
  f=carve(f,ell(a,b,z-.091,.030,.026,.048),.004);
  const n=clamp((y-.079)/.047),nx=(.016-.008*n);
  f=carve(f,ell(x-.001,y-.099,z-.094,nx,.027,.047),.003);
  f=carve(f,ell(u-.060,y-.081,z+.005,.019,.017,.037),.0035);
  f=carve(f,ell(x,y-.069,z+.081,.023,.022,.029),.002);
  // Fine cranial suture breaks the crown highlight without an overlay mesh.
  const seam=x-.0011*Math.sin(z*245)-.0010*Math.sin(z*443);
  f+=.00085*Math.exp(-Math.abs(seam)*625)*clamp((y-.17)*35);
  return f;
}
function mandible(x,y,z){
  const u=Math.abs(x);
  let f=ell(x,y-.018,z-.056,.044,.016,.031);
  f=blend(f,ell(u-(.045+(z-.01)*.23),y-.027+(z-.009)*.14,z-.007,.014,.012,.061),.010);
  f=blend(f,ell(u-.056,y-.046+(z+.039)*.50,z+.039,.015,.034,.023),.011);
  f=carve(f,ell(x,y-.023,z-.012,.038,.021,.051),.004);
  return f;
}

// March only cells crossing the surface. Interpolated points and gradients
// are shared at grid edges to keep the hollow parts as smooth as the dome.
function contour(T,field,min,max,step=.0072){
  const [nx,ny,nz]=max.map((v,i)=>Math.ceil((v-min[i])/step)+1);
  const pos=[],uv=[],norm=[],idx=[],verts=[],ids=new Map(),sample=new Float32Array(nx*ny*nz);
  const ix=(x,y,z)=>(z*ny+y)*nx+x;
  const at=i=>[min[0]+(i%nx)*step,min[1]+(Math.floor(i/nx)%ny)*step,min[2]+Math.floor(i/(nx*ny))*step];
  for(let i=0;i<sample.length;i++)sample[i]=field(...at(i));
  function edge(a,b){
    if(a>b)[a,b]=[b,a];
    const key=a*sample.length+b;
    if(ids.has(key))return ids.get(key);
    const A=at(a),B=at(b),t=sample[a]/(sample[a]-sample[b]);
    const [x,y,z]=A.map((v,i)=>v+(B[i]-v)*t),d=.00031;
    const n=new T.Vector3(field(x+d,y,z)-field(x-d,y,z),field(x,y+d,z)-field(x,y-d,z),field(x,y,z+d)-field(x,y,z-d)).normalize();
    const i=verts.length;verts.push({p:new T.Vector3(x,y,z),n});ids.set(key,i);
    pos.push(x,y,z);norm.push(n.x,n.y,n.z);uv.push(x*5.4+z*1.57+.51,y*4.7+z*1.18);
    return i;
  }
  const ab=new T.Vector3(),ac=new T.Vector3();
  function tri(i,j,k){
    if(i===j||i===k||j===k)return;
    const A=verts[i],B=verts[j],C=verts[k];
    ab.subVectors(B.p,A.p);ac.subVectors(C.p,A.p);
    if(ab.cross(ac).lengthSq()<1e-18)return;
    if(ab.dot(A.n)+ab.dot(B.n)+ab.dot(C.n)<0)[j,k]=[k,j];
    idx.push(i,j,k);
  }
  const cubeTets=[[0,1,3,7],[0,3,2,7],[0,2,6,7],[0,6,4,7],[0,4,5,7],[0,5,1,7]];
  for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
    const a=ix(x,y,z),b=a+nx*ny,c=[a,a+1,a+nx,a+nx+1,b,b+1,b+nx,b+nx+1];
    let mask=0;for(let i=0;i<8;i++)if(sample[c[i]]<0)mask|=1<<i;
    if(mask===0||mask===255)continue;
    for(const t of cubeTets){
      const p=[],n=[];
      for(const i of t)(mask&(1<<i)?p:n).push(c[i]);
      if(p.length===1)tri(...n.map(v=>edge(p[0],v)));
      else if(n.length===1)tri(...p.map(v=>edge(n[0],v)));
      else if(p.length===2){
        const a=edge(p[0],n[0]),b=edge(p[1],n[0]),c=edge(p[1],n[1]),d=edge(p[0],n[1]);
        tri(a,b,c);tri(a,c,d);
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);
  return g;
}
export function skullProp(T,k,{at,yaw,scale=1,bone,enamel=bone,variant=0}){
  let kit=cache.get(T);
  if(!kit){
    kit={
      skull:contour(T,cranium,[-.103,.037,-.148],[.103,.245,.113]),
      jaw:contour(T,mandible,[-.083,-.004,-.084],[.083,.086,.096],.0065),
      tooth:new RoundedBoxGeometry(1,1,1,1,.23)
    };cache.set(T,kit);
  }
  const up=new T.Vector3(0,1,0),q=new T.Quaternion().setFromAxisAngle(up,yaw),p=new T.Vector3(),
    v=new T.Vector3(),m=new T.Matrix4(),r=new T.Quaternion(),base=new T.Vector3(...at);
  function put(mtl,geo,x,y,z,a,b,c,angle=0){
    p.set(x,y,z).multiplyScalar(scale).applyQuaternion(q).add(base);
    r.setFromAxisAngle(up,angle).premultiply(q);m.compose(p,r,v.set(a,b,c).multiplyScalar(scale));
    k.geometry(mtl,geo,m);
  }
  put(bone,kit.skull,0,0,0,1,1,1);
  if(variant!==3)put(bone,kit.jaw,0,0,0,1,1,1);
  for(const low of [false,true]){
    if(low&&variant===3)continue;
    for(const s of [-1,1])for(let i=0;i<7;i++){
      if(variant&&((i===1&&s===1&&low)||(i===3&&s===-1&&!low&&variant%2===0)))continue;
      const w=[.010,.010,.010,.009,.010,.011,.011][i],a=[.0055,.0157,.025,.033,.038,.042,.044][i];
      const h=(i<3?.012:.009)+(low?-.003:0),z=[.088,.085,.079,.069,.056,.044,.032][i];
      put(i===4?bone:enamel,kit.tooth,s*(a-(low?.0015:0)),(low?.035:.051)+(i>=3?.002:0),z-(low?.005:0),
        w,h,i<3?.008:.012,s*(i*.23+.12));
    }
  }
}
