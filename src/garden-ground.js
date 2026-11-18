// A single distance-like path mask drives the material, verge and planting.
// Ground under paths stays coplanar: no layered strips to fight at junctions.
export function pathNetwork(T){
  const rect={x:-80,z:-260,w:160,h:264}, paths=[], index=new Map(), solid=new Map(), cell=8;
  const key=(x,z)=>x+':'+z;
  function add(points,width,style='loose'){
    const vv=points.map(([x,z])=>new T.Vector3(x,0,z));
    const curve=new T.CatmullRomCurve3(vv,false,'centripetal');
    const vertices=curve.getSpacedPoints(Math.max(2,Math.ceil(curve.getLength()/1.1)));
    paths.push({vertices,width,style});
    for(let k=1;k<vertices.length;k++){
      const a=vertices[k-1],b=vertices[k],m=width*.5+4,dx=b.x-a.x,dz=b.z-a.z;
      const s={x:a.x,z:a.z,dx,dz,w:width*.5,style,inv:1/Math.max(1e-8,dx*dx+dz*dz)};
      for(let i=Math.floor((Math.min(a.x,b.x)-m)/cell);i<=Math.floor((Math.max(a.x,b.x)+m)/cell);i++)
        for(let j=Math.floor((Math.min(a.z,b.z)-m)/cell);j<=Math.floor((Math.max(a.z,b.z)+m)/cell);j++){
          const k=key(i,j);if(!index.has(k))index.set(k,[]);index.get(k).push(s);
        }
    }
  }
  function sample(x,z){
    let best=Infinity,style='loose';
    const id=key(Math.floor(x/cell),Math.floor(z/cell));
    for(const f of solid.get(id)??[]){
      const [a,b,c]=f;
      const orient=(p,q)=>(q[0]-p[0])*(z-p[1])-(q[1]-p[1])*(x-p[0]);
      if(orient(a,b)>=0&&orient(b,c)>=0&&orient(c,a)>=0)return {edge:-.28,style:'compact'};
    }
    for(const s of index.get(id)??[]){
      const dx=x-s.x,dz=z-s.z,t=Math.max(0,Math.min(1,(dx*s.dx+dz*s.dz)*s.inv));
      const dist=Math.hypot(dx-t*s.dx,dz-t*s.dz)-s.w;
      if(dist<best){best=dist;style=s.style}
    }
    return {edge:best,style};
  }
  function texture({legacy=[],walls=[],beds=[]}={}){
    const c=document.createElement('canvas');c.width=1024;c.height=1690;
    const ctx=c.getContext('2d',{willReadFrequently:true}),data=new Uint8Array(c.width*c.height*4);
    const sx=c.width/rect.w,sy=c.height/rect.h;
    const channel=(n,paint)=>{
      ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='#000';ctx.fillRect(0,0,c.width,c.height);
      ctx.setTransform(sx,0,0,-sy,-rect.x*sx,c.height+rect.z*sy);
      ctx.lineCap=ctx.lineJoin='round';ctx.globalCompositeOperation='lighten';
      paint();
      const src=ctx.getImageData(0,0,c.width,c.height).data;
      const row=c.width*4;
      for(let y=0;y<c.height;y++)for(let x=0;x<row;x+=4)
        data[(c.height-1-y)*row+x+n]=src[y*row+x];
    };
    function stroke(vertices,width,v){
      ctx.strokeStyle='rgb('+v+' '+v+' '+v+')';ctx.lineWidth=width;
      ctx.beginPath();ctx.moveTo(vertices[0].x,vertices[0].z);
      for(let k=1;k<vertices.length;k++)ctx.lineTo(vertices[k].x,vertices[k].z);
      ctx.stroke();
    }
    channel(0,()=>{
      solid.clear();
      // Bake the existing parterre paving into the very same turf surface.
      ctx.fillStyle='#fff';const v=new T.Vector3(),t=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
      for(const mesh of legacy){
        mesh.updateWorldMatrix(true,false);
        const g=mesh.geometry,pos=g.attributes.position,idx=g.index,n=idx?idx.count:pos.count;
        ctx.beginPath();
        for(let i=0;i<n;i+=3){
          for(let k=0;k<3;k++)t[k].copy(v.fromBufferAttribute(pos,idx?idx.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));
          const [a,b,c]=t,area=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
          if(Math.abs(area)<1e-7)continue;
          const p=area>0?b:c,q=area>0?c:b;
          ctx.moveTo(a.x,a.z);ctx.lineTo(p.x,p.z);ctx.lineTo(q.x,q.z);
          const shape=[[a.x,a.z],[p.x,p.z],[q.x,q.z]];
          for(let ix=Math.floor(Math.min(a.x,b.x,c.x)/cell);ix<=Math.floor(Math.max(a.x,b.x,c.x)/cell);ix++)
            for(let iz=Math.floor(Math.min(a.z,b.z,c.z)/cell);iz<=Math.floor(Math.max(a.z,b.z,c.z)/cell);iz++){
              const id=key(ix,iz);if(!solid.has(id))solid.set(id,[]);solid.get(id).push(shape);
            }
          ctx.closePath();
        }
        ctx.fill('nonzero');
      }
      for(const {vertices,width,style} of paths){
        const broad=style==='trim'?.09:style==='compact'?.27:.38;
        for(const [s,v] of [[broad,23],[broad*.46,86],[0,153],[-broad*.40,218],[-broad,255]])
          stroke(vertices,width+s,v);
      }
    });
    channel(1,()=>{for(const p of paths)if(p.style==='compact')stroke(p.vertices,p.width+.39,224)});
    channel(2,()=>{for(const {a,b} of walls){
      const v=[{x:a[0],z:a[1]},{x:b[0],z:b[1]}];
      stroke(v,1.76,23);stroke(v,1.32,69);stroke(v,.85,161);stroke(v,.61,246);
    }});
    channel(3,()=>{for(const p of beds){stroke(p,1.79,126);stroke(p,1.58,255)}});
    const tex=new T.DataTexture(data,c.width,c.height);
    tex.colorSpace=T.NoColorSpace;tex.anisotropy=2;tex.generateMipmaps=true;
    tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.needsUpdate=true;
    return tex;
  }
  return {add,sample,edge:(x,z)=>sample(x,z).edge,texture,rect};
}

// The triangle evaluator is shared by mesh generation, planting and walking.
// Each clipped render triangle stays in a single plane of the height grid.
export function gardenTerrain(T,outline,material,tile=1.78){
  const step=3,size=48,tiles=new Map();
  const micro=(x,z)=>{
    const far=T.MathUtils.smoothstep(-z,20,72);
    return .008+far*(.019*Math.sin(x*.224+z*.093)*Math.sin(z*.175)+.021*Math.sin(z*.112+x*.139));
  };
  function height(x,z){
    const a=Math.floor(x/step)*step,b=Math.floor(z/step)*step,u=(x-a)/step,v=(z-b)/step;
    const h0=micro(a,b),h1=micro(a+step,b+step);
    return v<=u?h0*(1-u)+micro(a+step,b)*(u-v)+h1*v:
      h0*(1-v)+micro(a,b+step)*(v-u)+h1*u;
  }
  const signed=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  function clip(poly,a,b){
    const out=[];
    for(let i=0;i<poly.length;i++){
      const p=poly[i],q=poly[(i+1)%poly.length],dp=signed(a,b,p),dq=signed(a,b,q);
      if(dp>=-1e-9)out.push(p);
      if((dp>=-1e-9)!==(dq>=-1e-9)){
        const t=dp/(dp-dq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);
      }
    }
    return out;
  }
  for(const [a,b,c] of T.ShapeUtils.triangulateShape(outline.map(([x,z])=>new T.Vector2(x,z)),[])){
    const tri=[outline[a],outline[b],outline[c]];
    const xs=tri.map(p=>p[0]),zs=tri.map(p=>p[1]);
    for(let x=Math.floor(Math.min(...xs)/step)*step;x<Math.max(...xs);x+=step)
      for(let z=Math.floor(Math.min(...zs)/step)*step;z<Math.max(...zs);z+=step){
        const p=[x,z],q=[x+step,z],s=[x+step,z+step],t=[x,z+step];
        for(const bits of [[p,q,s],[p,s,t]]){
          let poly=tri;
          for(let k=0;k<3&&poly.length;k++)poly=clip(poly,bits[k],bits[(k+1)%3]);
          if(poly.length<3)continue;
          const id=Math.floor(x/size)+':'+Math.floor(z/size);
          if(!tiles.has(id))tiles.set(id,{pos:[],uv:[],normal:[]});
          const mesh=tiles.get(id);
          for(let k=1;k<poly.length-1;k++){
            const area=signed(poly[0],poly[k],poly[k+1]);
            if(Math.abs(area)<1e-6)continue;
            for(const [px,pz] of area<0?[poly[0],poly[k],poly[k+1]]:[poly[0],poly[k+1],poly[k]]){
              mesh.pos.push(px,height(px,pz),pz);mesh.uv.push(px/tile,-pz/tile);
              const nx=(micro(px-.25,pz)-micro(px+.25,pz))*2,nz=(micro(px,pz-.25)-micro(px,pz+.25))*2,
                d=Math.hypot(nx,1,nz);
              mesh.normal.push(nx/d,1/d,nz/d);
            }
          }
        }
      }
  }
  const meshes=[];
  for(const {pos,uv,normal} of tiles.values()){
    if(!pos.length)continue;
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    const m=new T.Mesh(g,material);m.receiveShadow=true;m.name='Parkboden · Höhenfeld';
    meshes.push(m);
  }
  return {meshes,height};
}
