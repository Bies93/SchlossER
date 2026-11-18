// A single distance-like path mask drives the material, verge and planting.
// Ground under paths stays coplanar: no layered strips to fight at junctions.
export function pathNetwork(T){
  const rect={x:-80,z:-260,w:160,h:264}, paths=[], index=new Map(), cell=8;
  const key=(x,z)=>x+':'+z;
  function add(points,width){
    const vv=points.map(([x,z])=>new T.Vector3(x,0,z));
    const curve=new T.CatmullRomCurve3(vv,false,'centripetal');
    const vertices=curve.getSpacedPoints(Math.max(2,Math.ceil(curve.getLength()/1.1)));
    paths.push({vertices,width});
    for(let k=1;k<vertices.length;k++){
      const a=vertices[k-1],b=vertices[k],m=width*.5+4,dx=b.x-a.x,dz=b.z-a.z;
      const s={x:a.x,z:a.z,dx,dz,w:width*.5,inv:1/(dx*dx+dz*dz)};
      for(let i=Math.floor((Math.min(a.x,b.x)-m)/cell);i<=Math.floor((Math.max(a.x,b.x)+m)/cell);i++)
        for(let j=Math.floor((Math.min(a.z,b.z)-m)/cell);j<=Math.floor((Math.max(a.z,b.z)+m)/cell);j++){
          const k=key(i,j);if(!index.has(k))index.set(k,[]);index.get(k).push(s);
        }
    }
  }
  function edge(x,z){
    let best=Infinity;
    for(const s of index.get(key(Math.floor(x/cell),Math.floor(z/cell)))??[]){
      const dx=x-s.x,dz=z-s.z,t=Math.max(0,Math.min(1,(dx*s.dx+dz*s.dz)*s.inv));
      best=Math.min(best,Math.hypot(dx-t*s.dx,dz-t*s.dz)-s.w);
    }
    return best;
  }
  function texture(){
    const c=document.createElement('canvas');c.width=1024;c.height=1690;
    const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,c.width,c.height);
    const sx=c.width/rect.w,sy=c.height/rect.h;
    ctx.translate(-rect.x*sx,c.height+rect.z*sy);ctx.scale(sx,-sy);
    ctx.lineCap=ctx.lineJoin='round';
    for(const [spread,v] of [[.64,10],[.49,31],[.30,66],[.16,110],[0,176],[-.19,231],[-.35,255]]){
      ctx.strokeStyle='rgb('+v+','+v+','+v+')';
      for(const {vertices,width} of paths){
        ctx.lineWidth=width+spread;ctx.beginPath();ctx.moveTo(vertices[0].x,vertices[0].z);
        for(let k=1;k<vertices.length;k++)ctx.lineTo(vertices[k].x,vertices[k].z);
        ctx.stroke();
      }
    }
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.NoColorSpace;tex.anisotropy=2;
    return tex;
  }
  return {add,edge,texture,rect};
}
