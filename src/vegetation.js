import {randomSource, repeatSet} from './surface-detail.js';

const TAU=Math.PI*2,CELL=32;
function put(bins,x,z,record){
  const i=Math.floor(x/CELL),j=Math.floor(z/CELL),key=i+':'+j;
  if(!bins.has(key))bins.set(key,{x:(i+.5)*CELL,z:(j+.5)*CELL,records:[]});
  bins.get(key).records.push(record);
}

// One texture with four independent sprays and padded transparent borders.
function leafAtlas(T){
  const size=1024,tile=size/2,canvas=document.createElement('canvas'),rng=randomSource(18377);
  canvas.width=canvas.height=size;const c=canvas.getContext('2d');
  for(let variant=0;variant<4;variant++){
    const oak=variant<2,thin=variant%2===0;
    c.save();c.translate((variant%2)*tile,Math.floor(variant/2)*tile);
    c.beginPath();c.rect(12,12,tile-24,tile-24);c.clip();
    const stems=thin?6:10;
    for(let k=0;k<stems;k++){
      const a=(k/(stems-1)-.5)*3.05+(rng()-.5)*.39,
        x=249+(rng()-.5)*144,y=316+(rng()-.5)*106,len=130+rng()*99;
      const ux=Math.sin(a),uy=-Math.cos(a);
      c.strokeStyle=oak?'#6c5b42':'#747441';c.lineWidth=2.3;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+ux*len,y+uy*len);c.stroke();
      for(let j=0;j<(thin?9:12);j++){
        const t=.22+j*.066,side=j%2?-1:1;
        c.save();c.translate(x+ux*len*t+uy*side*5,y+uy*len*t-ux*side*5);
        c.rotate(a+side*(.52+rng()*1.02));
        const l=25+rng()*28,h=l*(oak?.32:.43),hue=(oak?75:88)+rng()*19,
          sat=29+rng()*23,lum=28+rng()*22;
        c.fillStyle='hsl('+hue+' '+sat+'% '+lum+'%)';
        c.beginPath();c.moveTo(0,0);
        if(oak){
          for(let s=1;s<=12;s++){
            const q=s/12,b=Math.pow(Math.sin(q*Math.PI),.68)*(s%2?.70:1);c.lineTo(-h*b,-l*q);
          }
          for(let s=11;s>0;s--){
            const q=s/12,b=Math.pow(Math.sin(q*Math.PI),.68)*(s%2?.71:1);c.lineTo(h*b,-l*q);
          }
        }else{
          c.bezierCurveTo(-h*1.16,5,-h*1.18,-l*.48,0,-l);
          c.bezierCurveTo(h*1.28,-l*.50,h*1.05,4,0,0);
        }
        c.closePath();c.fill();c.strokeStyle='rgba(191,202,132,.27)';c.lineWidth=.9;
        c.beginPath();c.moveTo(0,-1);c.lineTo(0,-l*.87);c.stroke();c.restore();
      }
    }
    c.restore();
  }
  const {data}=c.getImageData(0,0,size,size);
  for(let i=0;i<data.length;i+=4)if(!data[i+3]){
    data[i]=92;data[i+1]=114;data[i+2]=52;
  }
  const tex=new T.DataTexture(new Uint8Array(data),size,size);
  tex.flipY=true;tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.LinearFilter;
  tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.anisotropy=4;tex.needsUpdate=true;
  return tex;
}
const buffers=()=>({p:[],n:[],u:[],c:[],idx:[]});
function geometry(T,{p,n,u,c,idx}){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  if(n.length)g.setAttribute('normal',new T.Float32BufferAttribute(n,3));
  if(u.length)g.setAttribute('uv',new T.Float32BufferAttribute(u,2));
  g.setAttribute('color',new T.Float32BufferAttribute(c,3));
  if(idx.length)g.setIndex(idx);
  if(!n.length)g.computeVertexNormals();
  return g;
}
function treeVariant(T,variant){
  const oak=variant<3,rng=randomSource(6132+variant*10489),V=(x,y,z)=>new T.Vector3(x,y,z);
  const bark=buffers(),coarse=buffers(),detail=buffers(),twigs=buffers();
  function branch(a,b,r0,r1,sides,part=bark){
    const axis=b.clone().sub(a),length=axis.length();axis.normalize();
    const u=V(0,0,0).crossVectors(axis,Math.abs(axis.y)>.9?V(1,0,0):V(0,1,0)).normalize(),
      v=V(0,0,0).crossVectors(u,axis),offset=part.p.length/3;
    for(let k=0;k<2;k++)for(let j=0;j<=sides;j++){
      const t=j/sides*TAU,radial=u.clone().multiplyScalar(Math.cos(t)).addScaledVector(v,Math.sin(t));
      const r=(k?r1:r0)*(1+.079*Math.cos(t*3+variant));
      part.p.push(...(k?b:a).clone().addScaledVector(radial,r));
      part.n.push(...radial.addScaledVector(axis,(r0-r1)/length).normalize());
      part.u.push(j/sides,(k*length+a.y)/1.6);
      const tint=.82+.17*(.5+.5*Math.cos(t+variant));part.c.push(tint,tint,tint);
    }
    for(let j=0;j<sides;j++){
      const i=offset+j,u=i+sides+1;part.idx.push(i,u,u+1,i,u+1,i+1);
    }
  }
  function spray(part,origin,size,a,shade,tile){
    const tilt=(rng()-.56)*2.5;
    const u=V(Math.cos(a),0,Math.sin(a)),v=V(Math.sin(a)*Math.sin(tilt),Math.cos(tilt),-Math.cos(a)*Math.sin(tilt));
    const normal=u.clone().cross(v).add(V(0,.57,0)).normalize();
    const i=part.p.length/3,x=(tile%2)*.5,y=(1-Math.floor(tile/2))*.5,pad=.009;
    const uv=[[x+pad,y+pad],[x+.5-pad,y+pad],[x+.5-pad,y+.5-pad],[x+pad,y+.5-pad]];
    for(const [j,[a,b]] of [[0,[-1,-1]],[1,[1,-1]],[2,[1,1]],[3,[-1,1]]]){
      part.p.push(...origin.clone().addScaledVector(u,a*size*.5).addScaledVector(v,b*size*.5));
      part.n.push(...normal);part.u.push(...uv[j]);part.c.push(shade*(oak?1.055:.94),shade,shade*(oak?.86:1.02));
    }
    part.idx.push(i,i+1,i+2,i,i+2,i+3);
  }
  const h=oak?14.1:16.8,root=oak?.55:.43,phase=rng()*TAU;
  const at=t=>V(Math.sin(phase+t*2)*t*.76,-.18+h*t,Math.cos(phase+t*2)*t*.66);
  const rads=[root*1.28,root*.77,root*.60,root*.44,root*.29,root*.17,.035];
  for(let j=0;j<6;j++)branch(at(j/6-.003),at((j+1)/6+.002),rads[j],rads[j+1],11);
  for(let j=0;j<6;j++){
    const a=phase+j*TAU/6+(rng()-.5)*.51,d=root*(1.48+rng()*1.05);
    branch(V(Math.cos(a)*d,-.028,Math.sin(a)*d),V(0,.64+rng()*.50,0),.032,root*.31,7);
  }
  const tiers=oak?5:6;
  for(let tier=0;tier<tiers;tier++){
    const t=tier/(tiers-1),count=tier===tiers-1?3:oak?5:4;
    const rC=(oak?6.1:4.5)*Math.pow(Math.sin((t*.79+.13)*Math.PI),oak?.53:.78);
    for(let j=0;j<count;j++){
      const start=at(.31+t*.56+(rng()-.5)*.102);
      const a=phase+j*TAU/count+tier*1.29+(rng()-.5)*.67,r=rC*(.62+rng()*.48)*(1+.037*variant);
      const elbow=V(start.x+Math.cos(a-.18)*r*.57,start.y+.31+rng()*.97,start.z+Math.sin(a-.18)*r*.57);
      const tip=V(Math.cos(a)*r,start.y+.94+rng()*1.75,Math.sin(a)*r),thick=root*(.37-.22*t)*(.81+rng()*.4);
      branch(start,elbow,thick,thick*.54,8);branch(elbow,tip,thick*.54,.022,7);
      for(let b=0;b<3;b++){
        const d=(b===1?-1:1)*(.40+rng()*.59),pos=elbow.clone().lerp(tip,b*.29);
        const q=pos.clone().add(V(Math.cos(a+d)*(1.13+rng()*1.25),.43+rng()*.95,Math.sin(a+d)*(1.13+rng()*1.25)));
        branch(pos,q,thick*.27,.011,5,twigs);
        for(let g=0;g<4;g++)spray(coarse,q.clone().add(V((rng()-.5)*1.2,(rng()-.4)*1.28,(rng()-.5)*1.2)),
          1.73+rng()*1.01,a+g*1.9,.83+rng()*.31,(oak?0:2)+(g%2));
        for(let g=0;g<3;g++)spray(detail,q.clone().add(V((rng()-.5)*1.76,(rng()-.45)*1.54,(rng()-.5)*1.76)),
          .79+rng()*.87,a+g*1.95,.80+rng()*.36,(oak?0:2)+(g%2));
      }
      for(let k=0;k<4;k++)spray(coarse,tip.clone().add(V((rng()-.5)*1.61,(rng()-.5)*1.4,(rng()-.5)*1.61)),
        1.66+rng()*.91,a+k*1.6,.87+rng()*.31,(oak?0:2)+(k%2));
    }
  }
  for(let i=0;i<16;i++){
    const a=i*2.399,r=1.05+rng()*.76;
    spray(coarse,V(Math.cos(a)*r,h+(.3-rng())*1.54,Math.sin(a)*r),1.58+rng()*.98,a,.95+rng()*.23,oak?1:3);
  }
  return [bark,coarse,detail,twigs].map(b=>geometry(T,b));
}
function batch(T,parent,list,g,mat,name,cast=false){
  const mesh=new T.InstancedMesh(g,mat,list.length),o=new T.Object3D();
  list.forEach(({x,y,z,sx,sy,sz,yaw,tint},i)=>{
    o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.y=yaw;
    o.updateMatrix();mesh.setMatrixAt(i,o.matrix);if(tint)mesh.setColorAt(i,tint);
  });
  mesh.name=name;mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);
  return mesh;
}
function fade(material,near,far,grass){
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float erlDetail;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 place = (modelMatrix * instanceMatrix * vec4(0,0,0,1)).xyz;
        erlDetail = 1.0 - smoothstep(${near.toFixed(1)},${far.toFixed(1)},distance(cameraPosition.xz,place.xz));
        ${grass?'transformed *= erlDetail;':''}
      `);
    if(!grass)shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float erlDetail;')
      .replace('#include <alphatest_fragment>','diffuseColor.a *= erlDetail;\n#include <alphatest_fragment>');
  };
  material.customProgramCacheKey=()=>grass?'erl-grass-distance':'erl-leaf-distance';
}
export function plantGarden(T,group,world,treeSites,coverage){
  const shapes=Array.from({length:6},(_,i)=>treeVariant(T,i)),rng=randomSource(42274);
  const leaf=new T.MeshLambertMaterial({map:leafAtlas(T),alphaTest:.32,alphaToCoverage:true,
    side:T.DoubleSide,vertexColors:true});
  const wood=new T.MeshStandardMaterial({...repeatSet(T,'bark',512),roughness:1,vertexColors:true});
  wood.normalScale.setScalar(.84);
  const nearLeaf=leaf.clone();fade(nearLeaf,38,54,false);
  const treeBins=new Map(),grassBins=new Map(),parts=[],roots=[];
  for(const {x,z,h,species,backdrop=false} of treeSites){
    const i=(species==='oak'?0:3)+Math.floor(rng()*3),s=h/(species==='oak'?14.1:16.8);
    const sx=s*(.84+rng()*.28),sz=s*(.86+rng()*.26);
    const tint=new T.Color().setRGB(.88+rng()*.12,.90+rng()*.10,.79+rng()*.18);
    put(treeBins,x,z,{x,y:backdrop?-.24:.009,z,sx,sy:s,sz,yaw:rng()*TAU,tint,i,backdrop});
    if(!backdrop){
      const r=(species==='oak'?.73:.57)*Math.max(sx,sz);
      world.circle(x,z,r);roots.push({x,z,r:r+.34});
    }
  }
  for(const bin of treeBins.values())for(let i=0;i<6;i++){
    const list=bin.records.filter(o=>o.i===i);if(!list.length)continue;
    const [trunk,coarse,detail,twigs]=shapes[i],near=list.filter(o=>!o.backdrop);
    batch(T,group,list,trunk,wood,'Bäume · Wurzel und Astgerüst',near.length>0);
    batch(T,group,list,coarse,leaf,'Bäume · Kronen',near.length>0);
    if(near.length)parts.push({x:bin.x,z:bin.z,dist:79,meshes:[
      batch(T,group,near,detail,nearLeaf,'Bäume · Nahlaub'),
      batch(T,group,near,twigs,wood,'Bäume · Seitenzweige')
    ]});
  }
  const colors=['#717d46','#788743','#879752','#8f985d','#718843'].map(v=>new T.Color(v));
  for(let z=-255;z<=-17;z+=.64)for(let x=-75;x<=75;x+=.64){
    const a=x+(rng()-.5)*.63,b=z+(rng()-.5)*.63,rate=rng(),density=coverage(a,b);
    if(!density||rate>density||roots.some(t=>Math.abs(t.x-a)<t.r&&Math.hypot(t.x-a,t.z-b)<t.r))continue;
    const s=.60+rng()*.83;
    put(grassBins,a,b,{x:a,y:.008,z:b,sx:s,sy:.57+rng()*.83,sz:s,yaw:rng()*TAU,tint:colors[colors.length*rng()|0]});
  }
  const blade=buffers();
  for(let i=0;i<8;i++){
    const a=rng()*TAU,stem=rng()*.098,x=Math.cos(a)*stem,z=Math.sin(a)*stem,h=.032+.052*rng(),w=.0018+.0043*rng();
    const dx=Math.cos(a)*w,dz=Math.sin(a)*w,bx=Math.sin(a)*(.017+rng()*.024),bz=-Math.cos(a)*(.017+rng()*.024);
    const p=[[x-dx,0,z-dz],[x+dx,0,z+dz],[x+dx*.63+bx*.31,h*.65,z+dz*.63+bz*.31],
      [x-dx*.63+bx*.31,h*.65,z-dz*.63+bz*.31],[x+bx,h,z+bz]];
    for(const j of [0,1,2,0,2,3,3,2,4]){
      blade.p.push(...p[j]);const v=[.72,.72,.95,.95,1.13][j];blade.c.push(v,v,v);
    }
  }
  const grass=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true});
  fade(grass,16,32,true);const g=geometry(T,blade);
  for(const bin of grassBins.values())parts.push({x:bin.x,z:bin.z,dist:58,meshes:[
    batch(T,group,bin.records,g,grass,'Rasen · Halmbüschel')
  ]});
  const c=document.createElement('canvas');c.width=c.height=64;
  const ctx=c.getContext('2d'),r=ctx.createRadialGradient(32,32,1,32,32,30);
  r.addColorStop(0,'rgba(36,38,22,.57)');r.addColorStop(.43,'rgba(43,48,22,.27)');
  r.addColorStop(1,'rgba(44,47,24,0)');ctx.fillStyle=r;ctx.fillRect(0,0,64,64);
  const shadow=new T.CanvasTexture(c);shadow.colorSpace=T.SRGBColorSpace;
  const contact=new T.PlaneGeometry(1,1);contact.rotateX(-Math.PI/2);
  batch(T,group,roots.map(({x,z,r})=>({x,y:.013,z,sx:r*6.45,sy:1,sz:r*5.88,yaw:0})),
    contact,new T.MeshBasicMaterial({map:shadow,transparent:true,opacity:.56,depthWrite:false}),'Bäume · Bodenkontakt');
  return position=>{
    for(const p of parts){
      const visible=(p.x-position.x)**2+(p.z-position.z)**2<p.dist**2;
      for(const m of p.meshes)m.visible=visible;
    }
  };
}
