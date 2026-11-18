import {randomSource} from './surface-detail.js';

export const BED_WIDTH=1.58;
const TAU=Math.PI*2;
const at=a=>[16.55*Math.cos(a),-47+11.28*Math.sin(a)];
export const BED_ARCS=[.15,Math.PI+.15].map(a=>
  Array.from({length:96},(_,i)=>{const [x,z]=at(a+(Math.PI-.30)*i/95);return {x,z}}));
const edges=BED_ARCS.flatMap(arc=>arc.slice(1).map((b,i)=>{
  const a=arc[i],dx=b.x-a.x,dz=b.z-a.z;
  return [a.x,a.z,dx,dz,1/(dx*dx+dz*dz)];
}));
export function atBed(x,z,padding=0){
  if(Math.abs(x)>19||Math.abs(z+47)>14)return false;
  for(const [a,b,dx,dz,inv] of edges){
    const u=x-a,v=z-b,t=Math.max(0,Math.min(1,(u*dx+v*dz)*inv));
    if(Math.hypot(u-t*dx,v-t*dz)<BED_WIDTH*.5+padding)return true;
  }
  return false;
}

function plant(T,kind,variant,far,swatches){
  const rng=randomSource(23817+619*variant+63*kind),pos=[],colors=[];
  const {leaf,tip,petal,inside,heart}=swatches;
  const V=(x,y,z)=>new T.Vector3(x,y,z),v=(...a)=>V(...a);
  function tri(a,b,c,base,gain=[.93,1,.96]){
    pos.push(...a,...b,...c);
    for(const k of gain)colors.push(base.r*k,base.g*k,base.b*k);
  }
  const quad=(a,b,c,d,col)=>{tri(a,b,c,col);tri(a,c,d,col)};
  function stem(a,b,r){
    const u=b.clone().sub(a).cross(v(0,0,1)).normalize().multiplyScalar(r);
    const w=b.clone().sub(a).cross(u).normalize().multiplyScalar(r);
    for(const e of [u,w])quad(a.clone().sub(e),a.clone().add(e),b.clone().addScaledVector(e,.45),b.clone().addScaledVector(e,-.45),leaf);
  }
  function blade(a,ang,len,width,lift){
    const u=v(Math.cos(ang),0,Math.sin(ang)),r=v(-u.z,0,u.x);
    const b=a.clone().addScaledVector(u,len*.48),c=a.clone().addScaledVector(u,len);
    b.y+=lift*.81;c.y+=lift;
    const l=b.clone().addScaledVector(r,width),m=b.clone().addScaledVector(r,-width);
    l.y-=width*.22;m.y-=width*.37;
    tri(a,l,b,leaf,[.65,.92,1.19]);tri(a,b,m,leaf,[.75,1.17,.92]);
    tri(b,l,c,tip,[1,.77,1.10]);tri(b,c,m,leaf,[1.13,1.03,.81]);
  }
  function cup(origin,r,c,density=6,spread=1,tilt=0){
    const twist=rng()*TAU;
    for(let j=0;j<density;j++){
      const a=twist+j/density*TAU,q=v(Math.cos(a),0,Math.sin(a)),side=v(-q.z,0,q.x);
      const m=origin.clone().addScaledVector(q,r*.56);m.y+=r*.19;
      const tip=origin.clone().addScaledVector(q,r);tip.y+=r*(.31+tilt*Math.sin(a)+rng()*.14);
      const l=m.clone().addScaledVector(side,r*.31*spread),right=m.clone().addScaledVector(side,-r*.31*spread);
      tri(origin,l,m,c,[.61,1.02,1.16]);tri(origin,m,right,c,[.76,1.08,.91]);
      if(!far&&r>.033){tri(l,tip,m,c,[1,1.13,1.1]);tri(m,tip,right,c,[.99,1.06,1.02])}
      else tri(l,tip,right,c,[1,1.11,.93]);
    }
  }
  if(kind===0){
    // Rose-like layered open cups: branching silhouette, shaded inner whorl.
    for(let j=0;j<(far?3:4);j++){
      const a=j*2.399+variant,root=v(0,.028,0),mid=v(.065*Math.cos(a),.24+rng()*.10,.065*Math.sin(a));
      const end=v(.16*Math.cos(a),.39+rng()*.19,.16*Math.sin(a));
      stem(root,mid,.009);stem(mid,end,.006);
      for(let k=0;k<(far?2:4);k++)blade(root.clone().lerp(mid,(k+1)/5),a+k*1.9,.12+rng()*.069,.036,.044+rng()*.061);
      blade(mid,a+.9,.10,.030,.045);blade(mid,a-1.04,.121,.031,.058);
      const r=.064+rng()*.033;
      cup(end,r,petal,far?5:8,1.47,.37);
      end.y+=.016;cup(end,r*.53,inside,far?4:6,1.49,.32);
      if(!far){end.y+=.008;cup(end,r*.22,heart,4,1.3)}
    }
  }else if(kind===1){
    // Upright blue-violet spires with many separated florets and small bracts.
    for(let j=0;j<(far?3:4);j++){
      const a=j*2.399+variant,r=j*.033,h=.29+rng()*.26;
      const base=v(Math.cos(a)*r,.011,Math.sin(a)*r),top=base.clone().add(v(.050*Math.cos(a),h,.050*Math.sin(a)));
      stem(base,top,.006);
      for(let k=0;k<3;k++)blade(base.clone().lerp(top,.08+k*.12),a+k*2.24,.089+rng()*.079,.023,.053);
      const count=far?4:6;
      for(let q=0;q<count;q++){
        const f=(q/count)*.47+.52,loc=base.clone().lerp(top,f);
        cup(loc,(.032-.016*q/count)*(.80+rng()*.44),q%3===0?inside:petal,far?3:4,1.23,.44);
      }
    }
  }else{
    // Low daisy-like edging with lifted petals and a visible central disk.
    for(let j=0;j<(far?2:4);j++){
      const a=j*2.399+variant,r=.061+rng()*.061,root=v(0,.015,0),mid=v(r*.53*Math.cos(a),.10,r*.53*Math.sin(a));
      const end=v(r*Math.cos(a),.16+rng()*.122,r*Math.sin(a));
      stem(root,end,.004);blade(mid,a+.8,.082,.018,.05);blade(mid,a-1.22,.081,.016,.016);
      const size=.043+rng()*.019;
      cup(end,size,petal,far?5:10,.92,.44);
      end.y+=.008;cup(end,size*.42,heart,far?4:7,1.4,.18);
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  return g;
}

export function addBeds(T,root,height){
  const swatches=[
    ['#3d5c30','#79944b','#e66e93','#d53561','#e7a351'],
    ['#475c31','#6f8a4b','#7760c4','#5646a1','#9e82cf'],
    ['#516b34','#859c55','#f5e2b0','#e9b768','#d69925']
  ].map(row=>Object.fromEntries(row.map((c,i)=>[['leaf','tip','petal','inside','heart'][i],new T.Color(c)])));
  const shapes=swatches.map((s,i)=>[plant(T,i,0,false,s),plant(T,i,0,true,s)]);
  const material=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true});
  const rng=randomSource(208271),o=new T.Object3D(),c=new T.Color(),parts=[];
  function batch(g,list,label,near){
    const mesh=new T.InstancedMesh(g,material,list.length);
    list.forEach(({x,z,s,h,yaw,tint},i)=>{
      o.position.set(x,height(x,z)+.003,z);o.scale.set(s,h,s);o.rotation.y=yaw;o.updateMatrix();
      mesh.setMatrixAt(i,o.matrix);c.setRGB(tint*(.98+rng()*.09),tint,tint*(.96+rng()*.09));mesh.setColorAt(i,c);
    });
    mesh.receiveShadow=true;mesh.name='Brunnenbeet · '+label+(near?' nah':' mittel');mesh.computeBoundingSphere();root.add(mesh);
    return mesh;
  }
  function patch(a,offset,kind,h,space){
    const [ax,az]=at(a),tx=-16.55*Math.sin(a),tz=11.28*Math.cos(a),d=Math.hypot(tx,tz);
    const records=[];
    for(let i=0;i<space;i++){
      const k=i*2.399+rng()*.31,r=.27*Math.sqrt(i/space)*(1+rng()*.24);
      const x=ax+Math.cos(a)*(offset+Math.cos(k)*r)+tx/d*Math.sin(k)*r*1.57;
      const z=az+Math.sin(a)*(offset+Math.cos(k)*r)+tz/d*Math.sin(k)*r*1.57;
      if(atBed(x,z,-.045))records.push({x,z,s:.81+rng()*.41,h:h*(.80+rng()*.39),yaw:rng()*TAU,tint:.79+rng()*.38});
    }
    return records;
  }
  for(let half=0;half<2;half++)for(let sector=0;sector<4;sector++){
    const a0=half*Math.PI+.166+sector*.70,a1=a0+.70,[x,z]=at((a0+a1)*.5);
    const beds=[[],[],[]];
    for(let j=0;j<12;j++){
      const a=a0+.043+(a1-a0-.036)*(j+rng()*.68)/12;
      const notes=Math.sin((j+sector*12)*.34+half*.79);
      beds[0].push(...patch(a,-.34+Math.sin(a*5.2)*.10,0,1.09,notes>-.21?5:3));
      beds[1].push(...patch(a+.016,.01+Math.sin(a*11.1)*.075,1,.94,notes>.35?3:5));
      if(notes>-.43||j%4===0)beds[2].push(...patch(a-.021,.36,2,.76,notes>.31?5:3));
    }
    const meshes=beds.map((b,i)=>[
      batch(shapes[i][0],b,['Rosen','Blütenspiere','Blütensaum'][i],true),
      batch(shapes[i][1],b,['Rosen','Blütenspiere','Blütensaum'][i],false)
    ]);
    parts.push({x,z,meshes});
  }
  return pos=>{
    for(const {x,z,meshes} of parts){
      const d=Math.hypot(pos.x-x,pos.z-z);
      for(const [near,mid] of meshes){near.visible=d<25;mid.visible=d>=25&&d<99}
    }
  };
}
