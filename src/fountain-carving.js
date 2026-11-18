import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomSource} from './surface-detail.js';

function cutRoughStone(T,mesh){
  const g=mesh.geometry,a=g.attributes.position,idx=g.index,norm=g.attributes.normal;
  const rows=[],normalHints=[],tris=[],A=new T.Vector3(),B=A.clone(),C=A.clone(),AB=A.clone(),AC=A.clone(),
    N=A.clone(),p=A.clone(),na=A.clone(),nb=A.clone(),nc=A.clone(),smooth=A.clone();
  const get=i=>idx?idx.getX(i):i;
  for(let i=0,end=idx?.count??a.count;i<end;i+=3){
    const j0=get(i),j1=get(i+1),j2=get(i+2);
    A.fromBufferAttribute(a,j0);B.fromBufferAttribute(a,j1);C.fromBufferAttribute(a,j2);
    AB.subVectors(B,A);AC.subVectors(C,A);N.crossVectors(AB,AC);
    const area=N.length()*.5;if(area<1e-10)continue;
    N.normalize();
    const steps=area>.67?5:area>.23?4:area>.087?3:1;
    na.fromBufferAttribute(norm,j0);nb.fromBufferAttribute(norm,j1);nc.fromBufferAttribute(norm,j2);
    const row=[];
    for(let b=0;b<=steps;b++){
      row.push(rows.length/3);
      for(let c=0;c<=steps-b;c++){
        const u=b/steps,v=c/steps,w=1-u-v;
        p.copy(A).addScaledVector(AB,u).addScaledVector(AC,v);
        // Weathering vanishes at the source edges, so differently
        // tessellated faces meet exactly and the silhouette stays put.
        if(b&&c&&b+c<steps){
          const layers=p.y*17.9+p.x*3.6+p.z*2.3;
          const work=.036*Math.sin(layers)+.042*Math.sin(p.x*8.7+p.z*9.9-p.y*5.1)+.051*Math.sin(layers*.20+p.z*8.1);
          p.addScaledVector(N,work*Math.min(1,21*u*v*w));
        }
        rows.push(...p);
        normalHints.push(...smooth.copy(na).multiplyScalar(w).addScaledVector(nb,u).addScaledVector(nc,v).normalize());
      }
    }
    for(let b=0;b<steps;b++)for(let c=0;c<steps-b;c++){
      const x=row[b]+c,y=row[b+1]+c;
      tris.push(x,y,x+1);
      if(b+c<steps-1)tris.push(x+1,y,y+1);
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(rows,3));
  geo.setIndex(tris);geo.computeVertexNormals();
  const out=geo.attributes.normal;
  for(let i=0;i<out.count;i++){
    N.fromBufferAttribute(out,i);smooth.fromArray(normalHints,i*3);
    N.lerp(smooth,.49).normalize();out.setXYZ(i,N.x,N.y,N.z);
  }
  geo.computeBoundingSphere();mesh.geometry=geo;
}

// Seat small, water-worn strata on the existing rocks. Projection against
// the stone only keeps the figures and original silhouette intact.
export function addFountainCarving(T,root,source,center,waterLevel){
  const stones=[];
  source.updateMatrixWorld(true);
  source.traverse(o=>{if(o.isMesh&&/Rock_layer/i.test(o.name))stones.push(o)});
  if(!stones.length)return;
  const rand=randomSource(79051),ray=new T.Raycaster(),parts=[];
  const V=(x,y,z)=>new T.Vector3(x,y,z),normalMatrix=new T.Matrix3(),normal=V(0,0,0);
  const row=7;
  for(let i=0;i<94;i++){
    const a=i*2.39996+rand()*.27, y=.58+Math.pow(rand(),1.40)*5.36,
      direction=V(-Math.cos(a),0,-Math.sin(a));
    ray.set(V(-direction.x*6,y,center-direction.z*6),direction);
    const hit=ray.intersectObjects(stones,false)[0];if(!hit||!hit.face)continue;
    normal.copy(hit.face.normal).applyMatrix3(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).normalize();
    if(Math.abs(normal.y)>.77||hit.distance>5.5)continue;
    const position=hit.point.clone().addScaledVector(normal,-.08);
    const ySpin=V(rand()*.23-.17,Math.atan2(normal.x,normal.z),rand()*.42-.21);
    const quat=new T.Quaternion().setFromEuler(new T.Euler(...ySpin,'YXZ'));
    const width=.16+rand()*.55,thick=.065+rand()*.21,depth=.095+rand()*.11;
    const s=[],idx=[],hues=[],f=()=>.81+rand()*.38;
    const outline=Array.from({length:row},(_,j)=>[Math.cos(j/row*Math.PI*2)*f(),Math.sin(j/row*Math.PI*2)*f()]);
    const tint=new T.Color().setHSL(.095+rand()*.042,.10+rand()*.10,.36+rand()*.19);
    for(let k=0;k<3;k++)for(let j=0;j<row;j++){
      const [x,y]=outline[j],gain=[.72,1,.69][k],edge=rand()*.12;
      s.push(x*gain*width,(y*gain*.91+x*.17+edge)*thick,([-1,-.09,.85][k]+edge)*depth);
      const t=(k===0?.72:k===1?.84:1.13)*(.88+rand()*.26);hues.push(tint.r*t,tint.g*t,tint.b*t);
      const next=(j+1)%row,b=k*row;
      if(k<2)idx.push(b+j,b+next,b+row+j,b+next,b+row+next,b+row+j);
    }
    for(let j=1;j<row-1;j++)idx.push(0,j+1,j,2*row,2*row+j,2*row+j+1);
    const raw=new T.BufferGeometry();
    raw.setIndex(idx);raw.setAttribute('position',new T.Float32BufferAttribute(s,3));
    raw.setAttribute('color',new T.Float32BufferAttribute(hues,3));
    raw.applyMatrix4(new T.Matrix4().compose(position,quat,V(1,1,1)));
    const g=raw.toNonIndexed();raw.dispose();g.computeVertexNormals();parts.push(g);
  }
  if(parts.length){
    const stone=stones[0].material.clone();
    stone.onBeforeCompile=stones[0].material.onBeforeCompile;
    stone.customProgramCacheKey=stones[0].material.customProgramCacheKey;
    stone.color.set(0xd3c5aa);stone.side=T.DoubleSide;stone.vertexColors=true;
    const mesh=new T.Mesh(mergeGeometries(parts),stone);mesh.name='Brunnen · kleinteilige Felslagen';
    mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);
    parts.forEach(g=>g.dispose());
  }
  stones.forEach(o=>cutRoughStone(T,o));
  // Fit to the measured inner stone radius; this is the wall behind the
  // water line, not a second water plane.
  const liner=new T.Shape(),R=9.139,H=4.75;liner.moveTo(-H,-R);liner.lineTo(H,-R);
  liner.absarc(H,0,R,-Math.PI/2,Math.PI/2,false);liner.lineTo(-H,R);
  liner.absarc(-H,0,R,Math.PI/2,Math.PI*1.5,false);liner.closePath();
  const points=liner.getPoints(51),pos=[],index=[],uv=[];
  let walk=0;
  for(let i=0;i<points.length;i++){
    const p=points[i];if(i)walk+=p.distanceTo(points[i-1]);
    const fall=.012*Math.sin(walk*2.4)+.006*Math.sin(walk*5.1);
    pos.push(p.x,waterLevel-.014,center-p.y,p.x,waterLevel+.062+fall,center-p.y);
    uv.push(walk/.70,0,walk/.70,.12+fall);
    if(i){const j=(i-1)*2;index.push(j,j+1,j+2,j+1,j+3,j+2)}
  }
  const geo=new T.BufferGeometry();geo.setIndex(index);
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  const wet=stones[0].material.clone();wet.onBeforeCompile=stones[0].material.onBeforeCompile;wet.customProgramCacheKey=stones[0].material.customProgramCacheKey;
  wet.color.set(0x83765e);wet.vertexColors=false;wet.roughness=.48;wet.side=T.DoubleSide;
  const mesh=new T.Mesh(geo,wet);mesh.name='Brunnen · feuchte Innenkante';mesh.receiveShadow=true;root.add(mesh);
}
