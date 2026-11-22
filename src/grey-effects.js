import {randomSource} from './surface-detail.js';
import {weaponSwatch} from './weapon-finishes.js';

const TAU=Math.PI*2;
function paint(T,w,h,draw){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return map;
}
const mesh=(T,parent,geometry,material,x=0,y=0,z=0)=>{
  const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;
};
export function greyHair(T,rig){
  const head=rig.costumeMount('head'),p=rig.restPoint('head'),rand=randomSource(41);
  const map=paint(T,768,256,(c,w,h)=>{
    const base=c.createLinearGradient(0,h,0,0);
    base.addColorStop(0,'#6e6b6b');base.addColorStop(.28,'#808083');base.addColorStop(.72,'#99979a');base.addColorStop(1,'#858386');
    c.fillStyle=base;c.fillRect(0,0,w,h);
    for(let i=0;i<760;i++){
      const x=rand()*w,t=rand(),light=rand()>.5,d=(rand()-.5)*15;
      c.strokeStyle=light?'#dedbd5':'#363745';c.globalAlpha=.07+t*t*.29;
      c.lineWidth=.42+rand()*1.38;
      for(const offset of [-w,0,w]){
        const a=x+offset;
        c.beginPath();c.moveTo(a,h+4);c.bezierCurveTo(a+3+d,h*.64,a-4-d,h*.32,a+d*.7,-4);c.stroke();
      }
    }
  });
  map.anisotropy=4;
  const mat=new T.MeshStandardMaterial({map,roughness:.84,vertexColors:true,side:T.DoubleSide});
  mat.name='GreyHair';
  const time={value:0},sway={value:0};
  mat.customProgramCacheKey=()=> 'grey-hair-sway-2';
  mat.onBeforeCompile=sh=>{
    sh.uniforms.greyHairTime=time;sh.uniforms.greyHairSway=sway;
    sh.vertexShader=sh.vertexShader.replace('#include <common>',
      '#include <common>\nattribute float hairTip; uniform float greyHairTime; uniform float greyHairSway;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        float tip=hairTip*greyHairSway;
        transformed.x+=tip*.014*sin(greyHairTime*4.9+position.x*12.-hairTip*1.5);
        transformed.z+=tip*.009*cos(greyHairTime*4.4+position.x*17.-hairTip*1.4);`);
  };
  const vertices=[],uv=[],tip=[],colors=[],order=[];
  const add=(x,y,z,u,v,flex,tone)=>{
    const i=tip.length;vertices.push(x,y,z);uv.push(u,v);tip.push(flex);colors.push(tone,tone,tone);return i;
  };
  const stitch=(a,b,c,d)=>order.push(a,b,c,b,d,c);
  const sm=T.MathUtils.smoothstep,center=p.clone().add(new T.Vector3(0,.052,.005));
  const scalp=scalpFitter(T,rig.greyScalp,center),dir=new T.Vector3();
  const sides=72,rows=15,edge=[],above=[];
  const tint=a=>.96+.036*Math.cos(a*11+.4)+.018*Math.cos(a*23);
  for(let i=0;i<=rows;i++){
    const t=i/rows;
    for(let j=0;j<=sides;j++){
      const u=j/sides,a=u*TAU,k=Math.min(a,TAU-a);
      // Keep the temples and ears clear; run the hairline down to the nape.
      const hairline=1.165-.090*Math.exp(-((k-.54)**2)/.063)+.32*sm(k,.63,1.65)+.29*sm(k,1.57,2.7)
        +.021*Math.sin(a*5)+.014*Math.cos(a*13)+.013*Math.sin(a*29);
      const sweep=.23*Math.sin(Math.PI*t)*(.58+.42*Math.cos(a+.26)),theta=.005+t*(hairline-.005);
      const angle=a-sweep;
      dir.set(Math.sin(angle)*Math.sin(theta),Math.cos(theta),Math.cos(angle)*Math.sin(theta));
      const crown=Math.sin(theta)*(.003+.002*Math.sin(a*17+theta*1.5))+.010*(1-t)**1.4;
      const blend=1-.69*sm(t,.84,1)*(1-sm(k,1.12,1.47));
      const r=scalp(dir)+(.0035+crown)*blend;
      const x=center.x+r*dir.x,y=center.y+r*dir.y,z=center.z+r*dir.z;
      add(x,y,z,u,t*.63,0,tint(a));
      if(i===rows)edge[j]=[x,y,z];
      if(i===rows-1)above[j]=[x,y,z];
      if(i<rows&&j<sides){const n=i*(sides+1)+j;stitch(n,n+sides+1,n+1,n+sides+2);}
    }
  }
  // Continue the SAME scalp vertices into thick, swept-back lengths.
  // Each outer ring has a matching underside so the side profile isn't a sheet.
  const sideStart=15,sideEnd=sides-sideStart,span=sideEnd-sideStart,steps=17;
  const outer=[],inner=[];
  const sample=(j,t)=>{
    const a=j/sides*TAU,k=Math.min(a,TAU-a),f=sm(k,sideStart/sides*TAU,2.28);
    const [x0,y0,z0]=edge[j],[x1,y1,z1]=above[j];
    const bin=Math.sin(Math.PI*(j-sideStart)/span),falls=sm(t,0,1);
    const fine=Math.sin(a*24+t*1.8+.3)+.43*Math.cos(a*39+t*2.3-.61);
    const length=f*(.217+.015*Math.cos(a*9-.5)+.010*Math.sin(a*17)+.006*fine);
    const tangent=Math.min(7,length/Math.max(.002,y1-y0))*t*(1-t)**2;
    const x=x0+(x0-x1)*tangent-(.011+.005*Math.cos(a*5))*falls*Math.sin(a)*f
      +.007*Math.sin(a*13+t*3.9)*falls*bin;
    const y=y0-length*t;
    const z=z0+(z0-z1)*tangent-(.031+.080*Math.abs(Math.sin(a)))*falls*f
      -.013*bin*Math.sin(t*Math.PI)*sm(t,0,.28)-.0042*fine*bin*falls;
    return [x,y,z,a,bin,f,fine];
  };
  const root=rows*(sides+1);
  for(let j=sideStart;j<=sideEnd;j++){
    const [x,y,z]=edge[j],u=j/sides;
    outer[j-sideStart]=root+j;
    inner[j-sideStart]=add(x,y,z,u,.63,0,tint(u*TAU)*.66);
  }
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    for(let k=0;k<=span;k++){
      const j=sideStart+k,[x,y,z,a,bin,f,fine]=sample(j,t),swing=t*t*f;
      const tone=tint(a)+t*(.031*Math.cos(a*19+t*2.3)+.012*fine-.04);
      const u=j/sides+.008*t*Math.sin(a*3+t*2.2),v=.63+t*.37;
      const top=add(x,y,z,u,v,swing,tone);
      const thickness=k===0||k===span||i===steps?0:Math.sin(Math.PI*t)**.65*.027*bin**.65*f;
      const bottom=add(x-.22*Math.sin(a)*thickness,y+.08*thickness,z+thickness,u,v,swing,tone*.66);
      if(k>0){
        const left=outer[k-1],previous=outer[k],underLeft=inner[k-1],underPrevious=inner[k];
        stitch(left,outer[k-1+span+1],previous,top);
        stitch(underLeft,underPrevious,inner[k-1+span+1],bottom);
      }
      outer[k+span+1]=top;inner[k+span+1]=bottom;
    }
    for(let k=0;k<=span;k++){outer[k]=outer[k+span+1];inner[k]=inner[k+span+1];}
  }
  // A tapered inward rim meets the skin around the exposed forehead/temples.
  for(let j=0;j<=sides;j++){
    if(j>sideStart&&j<sideEnd)continue;
    const [x,y,z]=edge[j],u=j/sides;
    edge[j]=add(T.MathUtils.lerp(x,center.x,.10),y-.001,T.MathUtils.lerp(z,center.z,.10),u,.655,0,.66);
    if(j>0&&(j<=sideStart||j>sideEnd))stitch(root+j-1,edge[j-1],root+j,edge[j]);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('hairTip',new T.Float32BufferAttribute(tip,1));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.setIndex(order);g.computeVertexNormals();
  const hair=mesh(T,head,g,mat);hair.name='Grey · durchgehendes silbergraues Haar';
  return (t,amount)=>{time.value=t;sway.value=amount;};
}
function scalpFitter(T,g,center){
  const {position:p}=g.attributes,index=g.index,count=index?.count??p.count,triangles=[];
  const v=new T.Vector3(),h=new T.Vector3(),ray=new T.Ray(center,new T.Vector3());
  for(let i=0;i<count;i+=3){
    const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
    const a=p.getY(ia),b=p.getY(ib),c=p.getY(ic);
    if(Math.max(a,b,c)<center.y-.063||Math.min(a,b,c)<center.y-.16)continue;
    triangles.push([ia,ib,ic].map(j=>new T.Vector3().fromBufferAttribute(p,j)));
  }
  return dir=>{
    const x=.069,y=.095,z=dir.z>0?.099:.100;
    const ellipse=1/Math.hypot(dir.x/x,dir.y/y,dir.z/z);
    let radius=0;
    ray.direction.copy(dir);
    for(const [a,b,c] of triangles)if(ray.intersectTriangle(a,b,c,false,h)){
      v.subVectors(h,center);radius=Math.max(radius,v.dot(dir));
    }
    return radius>0?Math.min(ellipse+.015,Math.max(ellipse-.012,radius)):ellipse;
  };
}
export function greyCrewNeck(T,rig){
  const chest=rig.costumeMount('spine_03'),g=new T.BufferGeometry(),p=[],uv=[],idx=[];
  const y=rig.restPoint('neck_01').y;
  for(let j=0;j<=7;j++)for(let i=0;i<=12;i++){
    const u=i/6-1,v=j/7,x=u*(.111+.004*v),h=y-.209+v*(.150+.029*u*u);
    const surface=rig.costumeDepth(x,h)??.084,fold=rig.costumeDepth(Math.sign(u||1)*.093,h)??.091;
    p.push(x,h,Math.max(surface-.004,fold+.017*(1-u*u))+.012*Math.sin(v*Math.PI*.81));uv.push(i/12,v);
    if(j<7&&i<12){const a=j*13+i;idx.push(a,a+1,a+13,a+13,a+1,a+14);}
  }
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  const knit=weaponSwatch(T,'twill');
  const fade=paint(T,64,48,(c,w,h)=>{
    // White at the round neck; feather the lower and side joins into the shirt.
    const image=c.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const u=x/(w-1),v=y/(h-1),xFade=Math.min(1,Math.min(u,1-u)*9),yFade=Math.min(1,(1-v)*3.5);
      const j=(y*w+x)*4;
      image.data[j]=image.data[j+1]=image.data[j+2]=Math.round(255*xFade*yFade);image.data[j+3]=255;
    }
    c.putImageData(image,0,0);
  });
  fade.colorSpace=T.NoColorSpace;
  const collar=new T.MeshStandardMaterial({color:0x5e6867,roughness:.94,normalMap:knit.normalMap,normalScale:new T.Vector2(.18,.18),
    transparent:true,depthWrite:false,alphaMap:fade});
  const o=mesh(T,chest,g,collar);o.name='Grey · T-Shirt-Rundhals';
  const neckLine=[];
  for(let i=2;i<=10;i++){
    const j=(7*13+i)*3;neckLine.push(new T.Vector3(p[j],p[j+1]-.004,p[j+2]+.002));
  }
  mesh(T,chest,new T.TubeGeometry(new T.CatmullRomCurve3(neckLine),18,.0035,6,false),
    new T.MeshStandardMaterial({color:0x56615f,roughness:.96})).name='Grey · Rundhalsbund';
  const wrist=rig.costumeMount('hand_l'),j=rig.restPoint('hand_l');
  const strap=new T.TorusGeometry(.023,.0065,7,20).rotateY(Math.PI/2);
  mesh(T,wrist,strap,new T.MeshStandardMaterial({color:0x3d3027,roughness:.96}),j.x-.024,j.y-.006,j.z+.002).name='Grey · Lederarmband';
}
export function greyVial(T,socket){
  const group=new T.Group();
  group.name='Grey · offen dampfendes Reagenzglas';socket.add(group);group.rotation.x=Math.PI*.5;
  group.position.set(.009,0,0);
  const turn=(path)=>new T.LatheGeometry(path.map(([r,y])=>new T.Vector2(r,y)),32);
  const glass=new T.MeshPhysicalMaterial({color:0xcff8f1,transparent:true,opacity:.29,side:T.DoubleSide,
    roughness:.14,metalness:.12,clearcoat:.78,depthWrite:false});
  const luminous=new T.MeshStandardMaterial({color:0x32e1a1,emissive:0x18bc6d,emissiveIntensity:1.05,roughness:.24});
  const lip=new T.MeshStandardMaterial({color:0xadd9ce,metalness:.22,roughness:.22,emissive:0x25473f});
  const body=mesh(T,group,turn([[0,-.094],[.010,-.094],[.019,-.087],[.023,-.075],[.023,.140],[.021,.146],
    [.018,.146],[.017,.138],[.017,-.073],[.010,-.085],[0,-.085]]),glass);
  body.renderOrder=3;
  const liquid=mesh(T,group,turn([[0,-.086],[.012,-.082],[.018,-.073],[.018,.036],[.016,.033],[0,.032]]),luminous);
  const rim=new T.TorusGeometry(.0215,.0026,8,36).rotateX(-Math.PI/2);
  mesh(T,group,rim,lip,0,.143,0);
  const meniscus=mesh(T,group,new T.CircleGeometry(.0173,26).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0x87ffd5}),0,.035,0);
  const graduations=new T.MeshBasicMaterial({color:0xc9f6e9,transparent:true,opacity:.74,depthWrite:false});
  for(let i=0;i<5;i++){
    const mark=mesh(T,group,new T.PlaneGeometry(i%2?.006:.011,.0017),graduations,.009,-.048+i*.028,.0218);
    mark.rotation.y=.41;mark.renderOrder=4;
  }
  const bubbleGeo=new T.SphereGeometry(.0028,7,6),bubbleMat=new T.MeshBasicMaterial({color:0xb1ffd1});
  const bubbles=Array.from({length:5},(_,i)=>mesh(T,group,bubbleGeo,bubbleMat,Math.sin(i*3)*.010,0,Math.cos(i*4)*.010));
  const glimmer=new T.Sprite(new T.SpriteMaterial({map:softDisc(T),color:0x47ffaf,opacity:.29,
    depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  glimmer.position.y=-.009;group.add(glimmer);glimmer.scale.set(.16,.16,1);
  return {group,update(t,shake){
    glimmer.material.opacity=.24+.10*Math.sin(t*4.22)+shake*.24;
    luminous.emissiveIntensity=1.03+.21*Math.cos(t*4)+shake*.57;
    liquid.rotation.z=shake*.108*Math.sin(t*18);meniscus.rotation.z=liquid.rotation.z;
    for(const [i,b] of bubbles.entries())b.position.y=-.071+((t*(.45+i*.067)+i*.23)%1)*.100;
  }};
}

function softDisc(T){
  return paint(T,64,64,(c,w,h)=>{
    const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    g.addColorStop(0,'#ffffff');g.addColorStop(.21,'#fff');g.addColorStop(.56,'#ffffff66');g.addColorStop(1,'#ffffff00');
    c.fillStyle=g;c.fillRect(0,0,w,h);
  });
}
export function greyAftermath(T,root,x,z,height){
  const group=new T.Group();group.name='Grey · Asche und verkohlte Reste';root.add(group);group.visible=false;
  const map=paint(T,256,256,(c,w,h)=>{
    const rand=randomSource(337),g=c.createRadialGradient(128,128,22,128,128,124);
    g.addColorStop(0,'#222125ed');g.addColorStop(.44,'#332920d6');g.addColorStop(.75,'#47382b54');g.addColorStop(1,'#42332a00');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    for(let i=0;i<3850;i++){
      const a=rand()*TAU,r=Math.sqrt(rand())*121,v=1-(r/125)**1.7;
      c.fillStyle=i%4===0?'rgba(127,117,105,'+(v*.58)+')':'rgba(17,16,19,'+(v*.82)+')';
      c.fillRect(128+Math.cos(a)*r,128+Math.sin(a)*r,.8+rand()*2.9,.5+rand()*1.9);
    }
  });
  const g=new T.PlaneGeometry(3.48,3.15,8,8).rotateX(-Math.PI/2),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,height(x+p.getX(i),z+p.getZ(i))+.021);
  g.computeVertexNormals();
  mesh(T,group,g,new T.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,
    polygonOffsetFactor:-1,polygonOffsetUnits:-2}),x,0,z).receiveShadow=true;
  const rand=randomSource(352), d=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),
    new T.MeshStandardMaterial({color:0x2d2926,roughness:.99}),56), tmp=new T.Object3D();
  for(let i=0;i<d.count;i++){
    const a=rand()*TAU,r=Math.sqrt(rand())*1.37,X=x+Math.cos(a)*r,Z=z+Math.sin(a)*r;
    tmp.position.set(X,height(X,Z)+.024+rand()*.025,Z);
    tmp.rotation.set(rand()*7,rand()*7,rand()*7);
    tmp.scale.set(.005+rand()*.030,.006+rand()*.016,.012+rand()*.034);tmp.updateMatrix();d.setMatrixAt(i,tmp.matrix);
    d.setColorAt(i,new T.Color(i%4===0?0xac9a86:0x716456));
  }
  group.add(d);return group;
}

export function blackenGrey(T,actor){
  const soot=weaponSwatch(T,'rubber'),used=new Map();
  actor.traverse(o=>{
    if(!o.isMesh||!o.material.isMeshStandardMaterial)return;
    const old=o.material;
    if(!used.has(old)){
      const m=old.clone();
      if(!m.alphaTest){m.map=soot.map;m.normalMap=soot.normalMap;m.normalScale.setScalar(.5);}
      m.color.setHex(/^Skin/.test(old.name)?0x38302a:0x262327);
      m.emissive.setHex(0x000000);m.roughness=.99;m.metalness=0;used.set(old,m);
    }
    o.material=used.get(old);
  });
}

export function greyFX(T,root,height){
  const flashWeight=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? .34 : 1;
  const disc=softDisc(T),smokeMap=paint(T,64,64,(c,w,h)=>{
    const rand=randomSource(881);
    for(let i=0;i<16;i++){
      const x=w*.5+(rand()-.5)*28,y=h*.5+(rand()-.5)*28,r=9+rand()*13;
      const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff42');g.addColorStop(1,'#ffffff00');
      c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
    }
  });
  const rand=randomSource(1819),make=(count,map,color,blend=T.NormalBlending)=>
    Array.from({length:count},(_,i)=>{
      const s=new T.Sprite(new T.SpriteMaterial({map,color,depthWrite:false,opacity:0,blending:blend,toneMapped:blend!==T.AdditiveBlending}));
      s.visible=false;s.renderOrder=5;root.add(s);return {s,a:rand()*TAU,b:rand(),c:rand(),offset:i/count};
    });
  const vapour=make(7,smokeMap,0x98cabc),smoke=make(17,smokeMap,0x39333a),embers=make(26,disc,0xffb24f,T.AdditiveBlending);
  const dust=make(13,smokeMap,0x947761);
  const flash=make(2,disc,0xffd18b,T.AdditiveBlending);
  flash[1].s.material.color.setHex(0xf1fff0);
  const spark=make(7,disc,0xfaffae,T.AdditiveBlending),at=new T.Vector3(),blastAt=new T.Vector3(),bodyAt=new T.Vector3(),mouth=new T.Vector3();
  const waveMap=paint(T,96,96,(c,w,h)=>{
    const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    for(const [a,b] of [[0,0],[.67,0],[.78,.16],[.87,.57],[.94,.27],[1,0]])
      g.addColorStop(a,'rgba(245,230,188,'+b+')');
    c.fillStyle=g;c.fillRect(0,0,w,h);
  });
  const wave=mesh(T,root,new T.PlaneGeometry(2,2).rotateX(-Math.PI/2),
    new T.MeshBasicMaterial({map:waveMap,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
  wave.userData.noSceneQuery=true;wave.visible=false;
  let active=false;
  function clear(xs){for(const {s} of xs)s.visible=false;}
  function draw(e,x,y,z,size,alpha){const {s}=e;s.visible=alpha>.015;s.position.set(x,y,z);s.scale.set(size,size,1);s.material.opacity=Math.max(0,alpha);}
  clear(vapour);
  return {burst(origin,body){blastAt.copy(origin);bodyAt.copy(body);active=true;clear(vapour);clear(spark);},
    vial(t,vial,showSpark=false,near=true){
      if(!near||!vial.visible){clear(vapour);clear(spark);return;}
      at.copy(mouth.set(0,.149,0));vial.localToWorld(at);
      for(const e of vapour){
        const p=(t*.94+e.offset)%1,q=.035+.22*p;
        draw(e,at.x+.078*p+.027*Math.sin(e.a+t+p*3)*p,at.y+.37*p,
          at.z+.044*Math.cos(e.a+p*1.6)*p,q,.32*Math.sin(p*Math.PI));
      }
      if(showSpark)for(const e of spark){
        const f=(t*7+e.offset)%1,d=f*(.09+e.b*.18);
        draw(e,at.x+Math.cos(e.a)*d,at.y+.012+f*.13,at.z+Math.sin(e.a)*d,
          .024+(1-f)*.095,(1-f)*.81);
      }else clear(spark);
    },
    tick(t,near=true){
      if(!active||!near||t>6.2){clear(smoke);clear(embers);clear(flash);clear(dust);wave.visible=false;return;}
      const {x,y,z}=blastAt;
      const bodyDelay=t-.047;
      draw(flash[0],x,y,z,1.41+t*6.1,Math.max(0,1-t*6.7)*.91*flashWeight);
      draw(flash[1],bodyAt.x,bodyAt.y,bodyAt.z,1.86+Math.max(0,bodyDelay)*7.1,
        bodyDelay>=0?Math.max(0,1-bodyDelay*5.6)*.89*flashWeight:0);
      const ring=Math.max(.12,Math.min(2.9,.17+t*5.25));
      wave.visible=t<.57;wave.position.set(bodyAt.x,height(bodyAt.x,bodyAt.z)+.047,bodyAt.z);
      wave.scale.set(ring,1,ring);wave.material.opacity=Math.max(0,1-t/.57)*.72*flashWeight;
      for(const e of dust){
        const d=t-.080-e.offset*.18,f=Math.max(0,d),rr=.24+(1-Math.exp(-f*2.8))*(1.04+e.b*1.22);
        const X=bodyAt.x+Math.cos(e.a)*rr,Z=bodyAt.z+Math.sin(e.a)*rr;
        draw(e,X,height(X,Z)+.16+f*(.12+.17*e.c),Z,.42+f*.39+e.b*.18,
          d>0?Math.min(1,d*9)*Math.max(0,1-f/2.55)**1.25*.57:0);
      }
      for(const e of smoke){
        const d=t-e.offset*.37,f=Math.max(0,d),spread=(1-Math.exp(-f*2.1))*(.34+e.b*1.04);
        const Y=y+.23+f*(.32+e.c*.44);
        e.s.material.rotation=e.a+f*(e.c-.50)*.56;
        draw(e,x+Math.cos(e.a)*spread+f*.13,Y,z+Math.sin(e.a)*spread,.38+spread*.55+.21*f,
          d>0?Math.min(1,d*8)*Math.max(0,1-f/5.65)**1.5*.72:0);
      }
      for(const e of embers){
        const d=t-e.offset*.14,f=Math.max(0,d),p=f*(1.2+e.b*3.0);
        const X=x+Math.cos(e.a)*p,Z=z+Math.sin(e.a)*p;
        const ground=height(X,Z),Y=Math.max(ground+.031,y+(.81+e.c*3.9)*f-4.5*f*f);
        draw(e,X,Y,Z,(.031+e.b*.041)*(1+Math.max(0,.5-f)),d>0?Math.max(0,.96-f*.77):0);
        e.s.scale.y*=1+(1-Math.min(1,f))*1.6;
        e.s.material.rotation=e.a*.63+f*.9;
      }
    }};
}
