import {randomSource} from './surface-detail.js';

const TAU=Math.PI*2;
const grid=4,cell=(x,z)=>Math.floor(x/grid)+':'+Math.floor(z/grid);
export function planBeds(layout,network,allow=()=>true){
  const strips=[],bins=new Map();
  function trace({path,side,start=0,end=0,width,order}){
    const n=Math.ceil((path.length-start-end)/.33),curve=path.curve;
    let points=[];
    const finish=()=>{if(points.length>=8)strips.push({points,width,order});points=[];};
    for(let i=0;i<=n;i++){
      const u=(start+(path.length-start-end)*i/n)/path.length,p=curve.getPointAt(u),v=curve.getTangentAt(u);
      const offset=side*(path.width*.5+.40+width*.5+Math.sin(u*17.3)*.056);
      const x=p.x-v.z*offset,z=p.z+v.x*offset;
      // Split at every junction so the gravel links stay open.
      if(!allow(x,z)||network.edge(x,z)<width*.5+.17){finish();continue;}
      points.push({x,z});
    }
    finish();
  }
  trace({path:layout.ring,side:1,start:1.28,end:1.28,width:1.01,order:1});
  for(const e of layout.edges)trace(e);
  for(const b of strips)for(let i=1;i<b.points.length;i++){
    const a=b.points[i-1],c=b.points[i],dx=c.x-a.x,dz=c.z-a.z,half=b.width*.5;
    const edge={x:a.x,z:a.z,dx,dz,inv:1/Math.max(.001,dx*dx+dz*dz),half};
    for(let z=Math.floor((Math.min(a.z,c.z)-half-.35)/grid);z<=Math.floor((Math.max(a.z,c.z)+half+.35)/grid);z++)
      for(let x=Math.floor((Math.min(a.x,c.x)-half-.35)/grid);x<=Math.floor((Math.max(a.x,c.x)+half+.35)/grid);x++){
        const id=x+':'+z;if(!bins.has(id))bins.set(id,[]);bins.get(id).push(edge);
      }
  }
  function atBed(x,z,padding=0){
    for(const {x:a,z:b,dx,dz,inv,half} of bins.get(cell(x,z))??[]){
      const u=x-a,v=z-b,t=Math.max(0,Math.min(1,(u*dx+v*dz)*inv));
      if((u-t*dx)**2+(v-t*dz)**2<(half+padding)**2)return true;
    }
    return false;
  }
  return {strips,atBed};
}

function plant(T,kind,variant,lod,swatches){
  const far=lod>0;
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
  if(lod===2){
    for(let j=0;j<5;j++){
      const a=j*2.399+variant,r=.10+rng()*.07,y=.10+rng()*.15;
      const p=v(Math.cos(a)*r,kind===1?y+.19:y,Math.sin(a)*r);
      if(j<3)blade(v(0,.02,0),a,.21,.055,.154);
      cup(p,kind===1?.053:.074,j%3===0?inside:petal,4,1.48,.4);
    }
  }else if(kind===0){
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
  const norms=g.attributes.normal;
  for(let j=0;j<norms.count;j++){
    if(norms.getY(j)<0)norms.setXYZ(j,-norms.getX(j),-norms.getY(j),-norms.getZ(j));
  }
  return g;
}

export function addBeds(T,root,height,plan){
  const swatches=[
    [0,'#426334','#7a984b','#d63548','#ac2433','#eca356'],
    [0,'#3b5d39','#8b9a5b','#da529d','#a72a76','#f3b681'],
    [1,'#375e39','#91a553','#7561cf','#4f4c9d','#b6a3f2'],
    [2,'#61806b','#95a590','#fff5e7','#e7dfca','#deb25d'],
    [2,'#547d39','#94b450','#f0bd40','#e88929','#c77b24'],
    [2,'#415944','#8ba494','#a9b5bf','#7e97a2','#bfd0ca']
  ];
  const shapes=swatches.map(([kind,...row],i)=>{
    const s=Object.fromEntries(row.map((c,j)=>[['leaf','tip','petal','inside','heart'][j],new T.Color(c)]));
    return [0,1,2].map(lod=>plant(T,kind,i,lod,s));
  });
  const material=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true});
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',
      T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));
  };
  material.customProgramCacheKey=()=>'park-petals-v2';
  const rng=randomSource(208271),o=new T.Object3D(),c=new T.Color(),parts=[],groups=new Map();
  function batch(g,list,label,lod){
    const mesh=new T.InstancedMesh(g,material,list.length);
    list.forEach(({x,z,s,h,yaw,tint},i)=>{
      o.position.set(x,height(x,z)+.003,z);o.scale.set(s,h,s);o.rotation.y=yaw;o.updateMatrix();
      mesh.setMatrixAt(i,o.matrix);c.setRGB(tint*(.98+rng()*.09),tint,tint*(.96+rng()*.09));mesh.setColorAt(i,c);
    });
    mesh.receiveShadow=true;mesh.name='Sommerbeet · '+label+' / '+lod;
    mesh.userData.noSceneQuery=true;mesh.computeBoundingSphere();mesh.visible=false;root.add(mesh);
    return mesh;
  }
  for(const {points,width,order} of plan.strips){
    let run=0,remaining=0,main=0;
    for(let j=0;j<points.length;j++){
      const p=points[j],a=points[Math.max(0,j-1)],b=points[Math.min(points.length-1,j+1)];
      const dx=b.x-a.x,dz=b.z-a.z,d=Math.max(.001,Math.hypot(dx,dz));
      if(remaining--<1){
        const scale=[0,3,1,2,0,4,1,5,0,2,3,4];
        main=scale[(run+order*3)%scale.length];run++;remaining=4+Math.floor(rng()*6);
      }
      const count=width>.8?4:3;
      for(let i=0;i<count;i++){
        const side=((i+.22+rng()*.5)/count-.5)*width*.92,local=(rng()-.5)*.283;
        const x=p.x-dz/d*side+dx/d*local,z=p.z+dx/d*side+dz/d*local;
        if(!plan.atBed(x,z,-.036))continue;
        const kind=i===0?(j%5===1?5:main===2?4:main===4?3:main):rng()<.88?main:(main+3)%6;
        const size=.72+rng()*.50,h=(kind===2?.96:kind<2?.55:.72)*(1+(rng()-.5)*.34);
        const X=Math.floor(x/11),Z=Math.floor(z/11),key=X+':'+Z;
        if(!groups.has(key))groups.set(key,{x:(X+.5)*11,z:(Z+.5)*11,rows:Array.from({length:6},()=>[])});
        groups.get(key).rows[kind].push({x,z,s:size,h,yaw:rng()*TAU,tint:.88+rng()*.24});
      }
    }
  }
  const labels=['Rot','Pink','Salbei','Weiß','Gold','Silberlaub'];
  for(const {x,z,rows} of groups.values()){
    const layers=[[],[],[]];
    for(let i=0;i<rows.length;i++)if(rows[i].length)
      for(let j=0;j<3;j++)layers[j].push(batch(shapes[i][j],rows[i],labels[i],j));
    parts.push({x,z,layers,lod:-1});
  }
  let lastX=Infinity,lastZ=Infinity,lastQuality;
  return (pos,quality)=>{
    if(lastQuality===quality&&Math.abs(pos.x-lastX)+Math.abs(pos.z-lastZ)<.7)return;
    lastX=pos.x;lastZ=pos.z;lastQuality=quality;
    const ranges=quality==='fast'?[13,29,80]:quality==='high'?[23,46,111]:[17,36,98];
    for(const p of parts){
      const d=(pos.x-p.x)**2+(pos.z-p.z)**2,lod=ranges.findIndex(r=>d<r*r);
      if(p.lod===lod)continue;
      for(const m of p.layers[p.lod]??[])m.visible=false;
      for(const m of p.layers[lod]??[])m.visible=true;
      p.lod=lod;
    }
  };
}
