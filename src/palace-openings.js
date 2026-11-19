// Model coordinates in metres, positive Z towards the Schlossplatz.
export const PORTALS={
  west:{id:'west',label:'Schlossplatz',side:1,z:12.27,half:1.35,spring:2.92,rise:0},
  east:{id:'east',label:'Schlossgarten',side:-1,z:-12.04,half:1.33,spring:2.53,rise:1.27}
};
export const HALL={half:3.92,zMin:-11.12,zMax:11.30,floor:.071};
export const WINGS={outer:29.1,z:7.70,portal:1.32,spring:2.44,rise:.59,ceiling:4.31,partition:12.45};
export const inPalaceWing=(x,z)=>Math.abs(x)>=HALL.half-.03&&Math.abs(x)<=WINGS.outer&&Math.abs(z)<=WINGS.z;

// Keep the bundled GLB as the base and subtract only the rebuilt masonry
// bands. Untouched triangles retain their original indices and attributes.
export function cutPalaceOpenings(T,root){
  const geometryRegions=[
    {lo:[-1.356,-.10,8.34],hi:[1.356,2.929,13.21]},
    {lo:[-2.768,-.10,-13.16],hi:[2.768,4.315,-8.34]},
    ...[-1,1].flatMap(s=>[[4.94,9.99],[10.45,14.48]].map(([y,top])=>({
      lo:[s===1?-2.32:-2.73,y,s===1?10.43:-13.18],
      hi:[s===1?2.32:2.73,top,s===1?13.19:-10.42]
    })))
  ];
  const innerOccluder={lo:[-4.07,-.08,-11.48],hi:[4.07,4.92,11.51]};
  // Hollow only the added interpreted rooms, behind the façade envelope.
  const wings=[1,-1].map(s=>{
    const x=[s*(HALL.half-.19),s*(WINGS.outer+.34)].sort((a,b)=>a-b);
    return {lo:[x[0],-.045,-WINGS.z-.32],hi:[x[1],WINGS.ceiling+.22,WINGS.z+.32]};
  });
  const allowed=/^ERL_(SANDSTONE(?:_CUT|_DARK)?|WOOD|METAL|RECESS|GLASS|LINEN)$/;
  const meshes=[];root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh&&allowed.test(o.name))meshes.push(o)});
  const v=new T.Vector3();
  for(const o of meshes){
    const g=o.geometry,p=g.attributes.position,n=g.index,pw=new Float32Array(p.count*3);
    const keys=['position','normal','uv','color'].filter(k=>g.attributes[k]);
    // The original GLB has dark proxy slabs behind its fake windows.
    // Leave them in the wings, but remove them from the new room.
    const regions=o.name==='ERL_RECESS'?[...geometryRegions,innerOccluder,...wings]:[...geometryRegions,...wings];
    const extent=WINGS.outer+.34;
    for(let i=0;i<p.count;i++)v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).toArray(pw,3*i);
    const index=[],slices=Object.fromEntries(keys.map(k=>[k,[]]));
    function vertex(i){return [[pw[3*i],pw[3*i+1],pw[3*i+2]],[i,i,i],[1,0,0]]}
    function interpolate(a,b,t){
      return [a[0].map((x,k)=>x+(b[0][k]-x)*t),a[1],a[2].map((x,k)=>x+(b[2][k]-x)*t)];
    }
    function split(poly,axis,limit,sign){
      const inner=[],outer=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],da=(a[0][axis]-limit)*sign,db=(b[0][axis]-limit)*sign;
        (da>=0?inner:outer).push(a);
        if((da>=0)!==(db>=0)){
          const q=interpolate(a,b,da/(da-db));inner.push(q);outer.push(q);
        }
      }
      return [inner,outer];
    }
    function subtract(poly,{lo,hi}){
      const kept=[];
      for(let ax=0;ax<3;ax++)for(const sign of [1,-1]){
        if(poly.length<3)return kept;
        const [ins,out]=split(poly,ax,(sign>0?lo:hi)[ax],sign);
        if(out.length>=3)kept.push(out);
        poly=ins;
      }
      return kept;
    }
    const offer=(a,b,c,k)=>{
      const attr=g.attributes[k],out=slices[k];
      for(const pt of [a,b,c]){
        const [,ii,w]=pt;
        for(let j=0;j<attr.itemSize;j++)out.push(attr.getComponent(ii[0],j)*w[0]+attr.getComponent(ii[1],j)*w[1]+attr.getComponent(ii[2],j)*w[2]);
      }
    };
    let changed=false;
    for(let i=0;i<(n?.count??p.count);i+=3){
      const a=n?n.getX(i):i,b=n?n.getX(i+1):i+1,c=n?n.getX(i+2):i+2;
      const ia=a*3,ib=b*3,ic=c*3;
      const xMin=Math.min(pw[ia],pw[ib],pw[ic]),xMax=Math.max(pw[ia],pw[ib],pw[ic]);
      if(xMin>extent||xMax<-extent){index.push(a,b,c);continue}
      const relevant=regions.filter(({lo,hi})=>
        !(xMin>hi[0]||xMax<lo[0]||
        Math.min(pw[ia+1],pw[ib+1],pw[ic+1])>hi[1]||Math.max(pw[ia+1],pw[ib+1],pw[ic+1])<lo[1]||
        Math.min(pw[ia+2],pw[ib+2],pw[ic+2])>hi[2]||Math.max(pw[ia+2],pw[ib+2],pw[ic+2])<lo[2]));
      if(!relevant.length){index.push(a,b,c);continue}
      changed=true;
      const tri=[vertex(a),vertex(b),vertex(c)];
      tri.forEach((pt,i)=>{pt[1]=[a,b,c];pt[2]=[Number(i===0),Number(i===1),Number(i===2)]});
      let kept=[tri];
      for(const box of relevant)kept=kept.flatMap(poly=>subtract(poly,box));
      for(const poly of kept)for(let j=1;j<poly.length-1;j++)for(const k of keys)offer(poly[0],poly[j],poly[j+1],k);
    }
    if(!changed)continue;
    o.geometry=new T.BufferGeometry();
    for(const [key,attr] of Object.entries(g.attributes))o.geometry.setAttribute(key,attr);
    o.geometry.setIndex(index);
    if(slices.position.length){
      const cut=new T.BufferGeometry();
      for(const k of keys)cut.setAttribute(k,new T.Float32BufferAttribute(slices[k],g.attributes[k].itemSize));
      const edge=new T.Mesh(cut,o.material);
      edge.name=o.name+' · Öffnungskanten';edge.castShadow=o.castShadow;edge.receiveShadow=o.receiveShadow;
      o.add(edge);
    }
  }
}
