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
    const stems=thin?8:14;
    for(let k=0;k<stems;k++){
      const a=(k/(stems-1)-.5)*3.68+(rng()-.5)*.49,
        x=251+(rng()-.5)*(thin?145:235),y=323+(rng()-.5)*(thin?136:233),len=114+rng()*128;
      const ux=Math.sin(a),uy=-Math.cos(a);
      c.strokeStyle=oak?'#64523b':'#777451';c.lineWidth=thin?1.35:1.9;
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+ux*len*.46+uy*21,y+uy*len*.46-ux*17,x+ux*len,y+uy*len);c.stroke();
      for(let j=0;j<(thin?10:13);j++){
        const t=.17+j*(thin?.078:.063),side=j%2?-1:1;
        c.save();c.translate(x+ux*len*t+uy*side*5,y+uy*len*t-ux*side*5);
        c.rotate(a+side*(.52+rng()*1.02));
        const l=(25+rng()*39)*(1.18-t*.29),h=l*(oak?.30:.41),hue=(oak?77:82)+rng()*22,
          sat=26+rng()*28,lum=25+rng()*24;
        const tone=c.createLinearGradient(-h,0,h,-l*.74);
        tone.addColorStop(0,'hsl('+hue+' '+sat+'% '+(lum*.82)+'%)');
        tone.addColorStop(.52,'hsl('+hue+' '+sat+'% '+(lum*1.11)+'%)');
        tone.addColorStop(1,'hsl('+(hue+4)+' '+sat+'% '+lum+'%)');c.fillStyle=tone;
        c.beginPath();c.moveTo(0,0);
        if(oak){
          for(let s=1;s<=12;s++){
            const q=s/12,b=Math.pow(Math.sin(q*Math.PI),.68)*(s%2?.70:1);c.lineTo(-h*b,-l*q);
          }
          for(let s=11;s>0;s--){
            const q=s/12,b=Math.pow(Math.sin(q*Math.PI),.68)*(s%2?.71:1);c.lineTo(h*b,-l*q);
          }
        }else{
          c.bezierCurveTo(-h*.23,l*.15,-h*1.61,-l*.44,0,-l);
          c.bezierCurveTo(h*1.43,-l*.47,h*.39,l*.13,0,0);
        }
        c.closePath();c.fill();c.strokeStyle='rgba(213,214,155,.35)';c.lineWidth=.85;
        c.beginPath();c.moveTo(0,-1);c.quadraticCurveTo(-h*.095,-l*.52,0,-l*.92);
        for(let v=1;v<=3;v++){
          const y=-l*(.13+v*.15),w=h*(.78-v*.09);
          c.moveTo(-w,y-l*.17);c.lineTo(-h*.04,y);c.lineTo(w,y-l*.17);
        }c.stroke();c.restore();
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
function treeVariant(T,variant,hero){
  const oak=hero?!['spire','court'].includes(hero):variant<3,rng=randomSource(6132+variant*10489),V=(x,y,z)=>new T.Vector3(x,y,z);
  const bark=buffers(),coarse=buffers(),middle=buffers(),detail=buffers(),twigs=buffers();
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
    const raw=u.clone().cross(v);
    const normal=raw.clone().multiplyScalar(.69).add(V(origin.x*.040,.66,origin.z*.045)).normalize();
    const i=part.p.length/3,x=(tile%2)*.5,y=(1-Math.floor(tile/2))*.5,pad=.009;
    const uv=[[x+pad,y+pad],[x+.5-pad,y+pad],[x+.5-pad,y+.5-pad],[x+pad,y+.5-pad]];
    const folded=part===detail||part===middle;
    const knots=folded?[[-1,-1],[0,-1],[1,-1],[-1,1],[0,1],[1,1]]:[[-1,-1],[1,-1],[1,1],[-1,1]];
    for(const [a,b] of knots){
      const bend=folded&&a===0?.108*size:0;
      part.p.push(...origin.clone().addScaledVector(u,a*size*.5).addScaledVector(v,b*size*.5).addScaledVector(raw,bend));
      part.n.push(...normal.clone().addScaledVector(u,-a*.26).normalize());
      part.u.push(uv[0][0]+(uv[1][0]-uv[0][0])*(a*.5+.5),uv[0][1]+(uv[2][1]-uv[0][1])*(b*.5+.5));
      const light=shade*(.90+.12*(b*.5+.5));
      part.c.push(light*(oak?1.048:.94),light,light*(oak?.85:1.005));
    }
    if(folded)part.idx.push(i,i+1,i+4,i,i+4,i+3,i+1,i+2,i+5,i+1,i+5,i+4);
    else part.idx.push(i,i+1,i+2,i,i+2,i+3);
  }
  const h=oak?14.1:16.8,root=(oak?.55:.43)*(hero?1.18:1),phase=rng()*TAU;
  const at=t=>V(Math.sin(phase+t*2)*t*.91+(hero==='sweep'?2.32:hero==='fork'?-1.37:hero==='bank'?-2.87:hero==='court'?1.04:.26)*t*Math.abs(t),
    -.18+h*t,Math.cos(phase+t*2)*t*.66);
  const rads=[root*1.28,root*.77,root*.60,root*.44,root*.29,root*.17,.035];
  for(let j=0;j<6;j++)branch(at(j/6-.006),at((j+1)/6+.007),rads[j],rads[j+1],hero?13:10);
  for(let j=0;j<(hero?8:6);j++){
    const a=phase+j*(hero?2.39:TAU/6)+(rng()-.5)*.51,d=root*(1.25+rng()*(hero?1.94:1.2));
    const x=Math.cos(a)*d,z=Math.sin(a)*d;
    if(hero){
      const p=V(x*.51-z*.14,.107,z*.58+x*.12),q=V(x*.20,.35,z*.19);
      branch(V(x,-.069,z),p,.027,root*.15,7);
      branch(p,q,root*.16,root*.249,8);branch(q,V(0,.63+rng()*.54,0),root*.251,root*.326,9);
    }else branch(V(x,-.028,z),V(0,.64+rng()*.50,0),.032,root*.31,7);
  }
  const tiers=oak?5:6;
  for(let tier=0;tier<tiers;tier++){
    const t=tier/(tiers-1),count=tier===tiers-1?3:oak?5:4;
    const rC=(oak?6.1:4.5)*Math.pow(Math.sin((t*.79+.13)*Math.PI),oak?.53:.78);
    for(let j=0;j<count;j++){
      const start=at(.305+t*.50+(rng()-.5)*.153);
      const a=phase+j*TAU/count+tier*1.29+(rng()-.5)*1.02;
      const reach=hero==='sweep'?1+.34*Math.cos(a):hero==='spire'?.82:hero==='fork'?1+.21*Math.cos(a*2+.6):
        hero==='bank'?1.15+.29*Math.cos(a-.71):hero==='court'?.93+.26*Math.cos(a+1.26):1;
      const r=rC*(.62+rng()*.48)*reach;
      const elbow=V(start.x+Math.cos(a-.18)*r*.57,start.y+.31+rng()*.97,start.z+Math.sin(a-.18)*r*.57);
      const rise=hero==='spire'?2.45:hero==='fork'&&tier>1?2.01:hero==='bank'?.67:1.18;
      const tip=V(Math.cos(a)*r+start.x*.6,start.y+rise+rng()*1.75,Math.sin(a)*r),thick=root*(.37-.22*t)*(.81+rng()*.4);
      const k=elbow.clone().lerp(tip,.49).add(V(.23*Math.sin(a),-.17+.77*rng(),-.29*Math.cos(a)));
      branch(start,elbow,thick,thick*.57,8);branch(elbow,k,thick*.57,thick*.34,7);branch(k,tip,thick*.34,.022,7);
      for(let b=0;b<3;b++){
        const d=(b===1?-1:1)*(.40+rng()*.59),pos=elbow.clone().lerp(tip,b*.29);
        const q=pos.clone().add(V(Math.cos(a+d)*(1.13+rng()*1.25),.43+rng()*.95,Math.sin(a+d)*(1.13+rng()*1.25)));
        branch(pos,q,thick*.27,.011,5,twigs);
        for(let g=0;g<4;g++){
          const silhouette=(g===0||g===1&&b===2);
          const mass=q.clone().add(V((rng()-.5)*1.64,(rng()-.46)*1.67,(rng()-.5)*1.64));
          if(g===0)mass.lerp(elbow,.29);
          spray(silhouette?coarse:middle,mass,
            (silhouette?2.62:1.69)+rng()*.87,a+g*1.90,.77+rng()*.39,(oak?0:2)+((g===0||g===2)?1:0));
        }
        for(let g=0;g<2;g++)spray(detail,q.clone().add(V((rng()-.5)*1.76,(rng()-.45)*1.54,(rng()-.5)*1.76)),
          .79+rng()*.87,a+g*1.95,.80+rng()*.36,(oak?0:2)+(g%2));
      }
      for(let k=0;k<4;k++)spray(k<2?coarse:middle,tip.clone().add(V((rng()-.5)*1.85,(rng()-.5)*1.7,(rng()-.5)*1.85)),
        (k<2?2.65:1.64)+rng()*.79,a+k*1.61,.86+rng()*.34,(oak?0:2)+(k%2));
    }
  }
  for(let i=0;i<16;i++){
    const a=i*2.399,r=1.05+rng()*.76;
    spray(i%2?middle:coarse,V(Math.cos(a)*r,h+(.3-rng())*1.54,Math.sin(a)*r),1.74+rng()*.86,a,.90+rng()*.25,oak?1:3);
  }
  return [bark,coarse,middle,detail,twigs].map(b=>geometry(T,b));
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
  material.customProgramCacheKey=()=> 'erl-fade-'+near+'-'+far+'-'+grass;
}
function airyLeaf(T,material,sway){
  const prior=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    prior(shader);
    shader.uniforms.erlCanopyTime=sway;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float erlCanopyTime;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 erlSeed=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
        float fern=sin(erlSeed.x*.31+erlSeed.z*.19+erlCanopyTime*1.19+position.y*.33+position.z*.71);
        float canopy=smoothstep(3.2,17.,position.y);float nearWind=1.-smoothstep(38.,91.,distance(cameraPosition.xz,erlSeed.xz));
        transformed.x+=(fern*.08+sin(erlCanopyTime*.82+erlSeed.z*.66)*.12)*canopy*nearWind;
        transformed.z+=cos(position.x*.62+erlCanopyTime*1.37+erlSeed.x*.17)*canopy*nearWind*.104;
      `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_lambert_pars_fragment>',
      T.ShaderChunk.lights_lambert_pars_fragment.replace(
        'vec3 irradiance = dotNL * directLight.color;',
        'float pass = max(0.0,-dot(geometryNormal,directLight.direction)); vec3 irradiance = (vec3(dotNL)+pass*vec3(.13,.167,.060))*directLight.color;'
      ));
  };
  material.customProgramCacheKey=()=>key+'-leaf-backlight';
}
function undergrowth(T){
  const dst=buffers(),r=randomSource(31855);
  for(let i=0;i<24;i++){
    const a=i*2.39996+(r()-.5)*.57,rx=Math.cos(a),rz=Math.sin(a);
    const rad=.24+r()*.57,cy=.24+(1-rad*.57)*r()*.74;
    const span=.27+r()*.36,tilt=.25+r()*.52;
    const x=rx*rad,z=rz*rad,idx=dst.p.length/3,j=i%5===0?0:1;
    for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      dst.p.push(x+rz*u*span+rx*v*span*tilt,cy+v*span*.67,z-rx*u*span+rz*v*span*tilt);
      dst.u.push(j*.5+.012+(u*.5+.5)*.476,.512+(v*.5+.5)*.476);
      const k=.77+v*.09;dst.c.push(k*.95,k,k*.87);
      dst.n.push(rx*.36,.86,rz*.36);
    }
    dst.idx.push(idx,idx+1,idx+2,idx,idx+2,idx+3);
  }
  return geometry(T,dst);
}

export function plantGarden(T,group,world,treeSites,coverage,height,shrubSites=[]){
  const heroes=['sweep','spire','fork','bank','court'];
  const shapes=[...Array.from({length:6},(_,i)=>treeVariant(T,i)),
    ...heroes.map((hero,i)=>treeVariant(T,6+i,hero))],rng=randomSource(42274);
  const leaf=new T.MeshLambertMaterial({map:leafAtlas(T),alphaTest:.30,alphaToCoverage:true,
    side:T.DoubleSide,vertexColors:true});
  const wood=new T.MeshStandardMaterial({...repeatSet(T,'bark',512),roughness:1,vertexColors:true});
  wood.normalScale.setScalar(.84);
  const nearLeaf=leaf.clone(),midLeaf=leaf.clone();
  fade(nearLeaf,23,43,false);fade(midLeaf,58,86,false);
  const sway={value:0};
  for(const m of [leaf,nearLeaf,midLeaf])airyLeaf(T,m,sway);
  const treeBins=new Map(),grassBins=new Map(),herbBins=new Map(),parts=[],roots=[];
  for(const {x,z,h,species,hero,backdrop=false} of treeSites){
    const i=hero?6+heroes.indexOf(hero):(species==='oak'?0:3)+Math.floor(rng()*3),s=h/(species==='oak'?14.1:16.8);
    const sx=s*(.84+rng()*.28),sz=s*(.86+rng()*.26);
    const tint=new T.Color().setRGB(.82+rng()*.20,.85+rng()*.17,.73+rng()*.27);
    put(treeBins,x,z,{x,y:backdrop?-.24:height(x,z),z,sx,sy:s,sz,yaw:hero?Math.PI*.17:rng()*TAU,tint,i,backdrop});
    if(!backdrop){
      const r=(species==='oak'?.73:.57)*Math.max(sx,sz)*(hero?1.16:1);
      world.circle(x,z,r);roots.push({x,z,r:r+.34});
    }
  }
  for(const bin of treeBins.values())for(let i=0;i<shapes.length;i++){
    const list=bin.records.filter(o=>o.i===i);if(!list.length)continue;
    const [trunk,coarse,middle,detail,twigs]=shapes[i],near=list.filter(o=>!o.backdrop);
    batch(T,group,list,trunk,wood,'Bäume · Wurzel und Astgerüst',near.length>0);
    batch(T,group,list,coarse,leaf,'Bäume · Kronen',near.length>0);
    if(near.length){
      parts.push({x:bin.x,z:bin.z,dist:117,meshes:[batch(T,group,near,middle,midLeaf,'Bäume · Mittlere Kronengruppen')]});
      parts.push({x:bin.x,z:bin.z,dist:72,meshes:[
        batch(T,group,near,detail,nearLeaf,'Bäume · Nahlaub'),
        batch(T,group,near,twigs,wood,'Bäume · Seitenzweige')
      ]});
    }
  }
  if(shrubSites.length){
    const groups=new Map(),g=undergrowth(T);
    for(const [x,z,s] of shrubSites){
      const tone=.81+rng()*.19;
      put(groups,x,z,{x,y:height(x,z),z,sx:s,sy:s*(.74+rng()*.32),sz:s,yaw:rng()*TAU,
        tint:new T.Color().setRGB(tone*.95,tone,tone*.91)});
    }
    for(const bin of groups.values())parts.push({x:bin.x,z:bin.z,dist:93,meshes:[
      batch(T,group,bin.records,g,leaf,'Parkrand · lockeres Unterholz')
    ]});
  }
  const colors=['#717d46','#788743','#879752','#8f985d','#718843'].map(v=>new T.Color(v));
  for(let z=-255;z<=-17;z+=.64)for(let x=-75;x<=75;x+=.64){
    const a=x+(rng()-.5)*.63,b=z+(rng()-.5)*.63,rate=rng(),density=coverage(a,b);
    if(!density||rate>density||roots.some(t=>Math.abs(t.x-a)<t.r&&Math.hypot(t.x-a,t.z-b)<t.r))continue;
    const s=.60+rng()*.83;
    put(grassBins,a,b,{x:a,y:height(a,b)+.001,z:b,sx:s,sy:.57+rng()*.83,sz:s,yaw:rng()*TAU,tint:colors[colors.length*rng()|0]});
    if(density>.28&&rng()<.022)put(herbBins,a,b,{x:a,y:height(a,b),z:b,sx:s,sy:s,sz:s,yaw:rng()*TAU});
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
  const herbs=buffers();
  for(let k=0;k<3;k++){
    const u=Math.cos(k*2.4),v=Math.sin(k*2.4);
    const points=[[0,.025,0],[u*.044-v*.014,.038,v*.044+u*.014],[u*.063,.053,v*.063],
      [u*.044+v*.013,.038,v*.044-u*.013]];
    for(const j of [0,1,2,0,2,3]){herbs.p.push(...points[j]);herbs.c.push(.15,.21,.084)}
  }
  const herbMesh=geometry(T,herbs);
  for(const bin of herbBins.values())parts.push({x:bin.x,z:bin.z,dist:58,meshes:[
    batch(T,group,bin.records,herbMesh,grass,'Saum · vereinzelte Kräuter')
  ]});
  return (position,time)=>{
    sway.value=time*.001;
    for(const p of parts){
      const visible=(p.x-position.x)**2+(p.z-position.z)**2<p.dist**2;
      for(const m of p.meshes)m.visible=visible;
    }
  };
}
