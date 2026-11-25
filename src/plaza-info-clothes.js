import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const rad=Math.PI*2,styles=['Heide · weinrotes Kleid','Luisa · Rippstrick und Jeans','Grete · offene Strickjacke'];
const attrs=(T,g,p,uv,ix)=>{
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(ix);g.computeVertexNormals();return g;
};
export function bindInfoMesh(T,body,g,m,index,weight,name){
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(index,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weight,4));
  const o=new T.SkinnedMesh(g,m);o.name=name;o.receiveShadow=true;
  o.boundingSphere=new T.Sphere(new T.Vector3(0,.93,0),1.21);
  o.position.copy(body.position);o.quaternion.copy(body.quaternion);o.scale.copy(body.scale);
  body.parent.add(o);o.bind(body.skeleton,body.bindMatrix);return o;
}

function material(T,part,extra='body'){
  const m=new T.MeshStandardMaterial({color:0xffffff,roughness:.88,side:T.DoubleSide});
  m.name=styles[part]+' · '+extra;
  m.customProgramCacheKey=()=>'vorplatz-kleidung-v2:'+part+':'+extra;
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 fitP;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nfitP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 fitP;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float px=abs(fitP.x), yy=fitP.y, zz=fitP.z;
        float pixel=max(length(dFdx(fitP)),length(dFdy(fitP)));
        float detail=1.-smoothstep(.0018,.008,pixel);
        float rib=.5+.5*cos((px+abs(zz*.66)+.004*sin(yy*26.))*380.);
        float fiber=sin(px*1933.+zz*1420.)*cos(yy*1560.)*detail;
        float folds=.52+.25*sin(yy*38.+px*33.)+.23*cos(yy*62.-zz*65.+px*15.);
        float faceSide=smoothstep(.034,.092,zz);
        vec3 tone;
        ${part===0?`
          float gather=exp(-pow((yy-(1.09+.31*px))/.058,2.));
          float darts=exp(-pow((px-(.062+.17*(yy-.91)))/.0046,2.))*smoothstep(.87,1.00,yy)*(1.-smoothstep(1.102,1.185,yy));
          float neckEdge=exp(-pow((px-(.019+.26*max(0.,yy-1.18)))/.006,2.))*smoothstep(1.17,1.26,yy)*faceSide;
          float stitching=exp(-pow((min(abs(yy-.389),abs(yy-.985)))/.004,2.))*.3;
          tone=vec3(.236,.025,.049)*(.85+.18*folds+.12*fiber-.18*gather*faceSide-.22*darts*faceSide);
          tone+=vec3(.062,.022,.028)*(neckEdge*.72+stitching);
        `:part===1?`
          float upper=${extra==='body'?'smoothstep(.897,.922,yy)':'1.'};
          float den=sin(yy*1180.+px*630.)*(.5+.5*cos(yy*911.-px*610.))*detail;
          float seam=exp(-pow((px-(.153+.027*smoothstep(.14,.89,yy)))/.0039,2.));
          float fly=exp(-pow((px-.008)/.005,2.))*faceSide*smoothstep(.70,.77,yy);
          float yoke=exp(-pow((yy-(.836+.34*px))/.005,2.))*faceSide;
          vec3 jeans=vec3(.073,.131,.175)*(.78+.23*folds+.15*den)+vec3(.040,.029,.016)*(seam*.58+fly*.72+yoke*.56);
          float waist=exp(-pow((yy-.944)/.025,2.));
          vec3 knit=vec3(.048,.064,.081)*(.85+.13*folds+(rib-.5)*detail*.51+.10*fiber)*(1.-waist*.115);
          tone=mix(jeans,knit,upper);
        `:`
          float body=${extra==='body'?'smoothstep(.817,.843,yy)':'1.'};
          float bound=.061+.049*smoothstep(.878,1.178,yy)-.043*smoothstep(1.187,1.295,yy);
          float opening=${extra==='body'?'(1.-smoothstep(bound-.005,bound+.003,px))*faceSide':'0.'};
          float piping=${extra==='body'?'exp(-pow((px-bound)/.011,2.))*faceSide':'0.'};
          float low=exp(-pow((yy-.866)/.024,2.));
          float stitches=.5+.5*sin(yy*179.)*cos((px+zz*.71)*465.);
          vec3 wool=vec3(.333,.320,.296)*(.81+.18*folds+.10*fiber+.22*(stitches-.5)*detail-.19*low);
          vec3 tshirt=vec3(.052,.060,.072)*(.83+.22*folds+.11*fiber);
          vec3 pants=vec3(.023,.026,.031)*(.8+.21*folds+.09*fiber);
          tone=mix(pants,mix(wool+vec3(.059,.050,.038)*piping,tshirt,opening),body);
        `}
        diffuseColor.rgb*=tone;
      `);
  };
  return m;
}

function shoes(T,o,part){
  const m=new T.MeshStandardMaterial({roughness:.81,color:0xffffff});
  m.name=part===2?'Grete · kobaltblaue Sneaker':'Heide · flache dunkelbraune Lederschuhe';o.material=m;
  m.customProgramCacheKey=()=> 'info-schuhe-2:'+part;
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 shoeP;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nshoeP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 shoeP;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float h=shoeP.y, z=shoeP.z, x=abs(shoeP.x),u=x-(.153+.26*z);
        float lace=exp(-pow(u/.027,2.))*smoothstep(.044,.084,h)*smoothstep(.031,.078,z)*
          (1.-smoothstep(.138,.153,z))*smoothstep(.68,.86,cos((z+.088*abs(u))*279.));
        float piping=exp(-pow((z+.44*x-.211)/.006,2.))*smoothstep(.018,.040,h);
        ${part===2?`
          vec3 blue=vec3(.021,.079,.278)*(.88+.16*sin(x*51.+z*56.));
          blue=mix(blue,vec3(.35,.55,.72),clamp(lace*.76+piping*.38,0.,1.));
          blue=mix(blue,vec3(.024,.028,.034),smoothstep(.096,.124,h));
          diffuseColor.rgb*=mix(vec3(.48,.51,.52),blue,smoothstep(.007,.019,h));
        `:`
          vec3 leather=vec3(.086,.039,.025)*(.83+.20*sin(x*51.+z*40.))+.03*lace;
          vec3 sock=vec3(.377,.322,.245)*(.90+.12*cos(x*576.));
          diffuseColor.rgb*=mix(leather,sock,smoothstep(.087,.111,h)*(1.-smoothstep(.078,.104,z)));
        `}
      `);
  };
}

export function dressInfoWardrobe(T,rig,part){
  let body,shoe;
  rig.actor.traverse(o=>{
    if(o.isSkinnedMesh&&/^Cloth/.test(o.material.name))body=o;
    if(o.isSkinnedMesh&&/^Shoes/.test(o.material.name))shoe=o;
  });
  if(!body)return;
  const sm=T.MathUtils.smoothstep,V=(...a)=>new T.Vector3(...a);
  const beltFront=part===0?rig.costumeDepth(.004,.911):null;
  body.material=material(T,part);body.name=styles[part];
  const sleeveMat=material(T,part,'Ärmel'),trimMat=material(T,part,'Kragen');
  const attach=(...args)=>bindInfoMesh(T,body,...args);
  const bone=n=>body.skeleton.bones.indexOf(rig.joint(n));
  if(part===0){
    if(shoe)shoes(T,shoe,part);
    const g=body.geometry.clone(),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),hem=1-sm(y,.517,.783);
      if(hem>0)p.setXYZ(i,x*(1+.082*hem),y-.157*hem,z+.006*hem*Math.cos(x*51));
    }
    g.computeVertexNormals();g.computeBoundingBox();body.geometry=g;
    const y=.911,center=V(0,y,.022),ray=new T.Ray(center,V()),v=V(),hit=V();
    const gp=body.geometry.attributes.position,idx=body.geometry.index,tri=[];
    for(let j=0;j<(idx?.count??gp.count);j+=3){
      const a=Array.from({length:3},(_,k)=>V().fromBufferAttribute(gp,idx?idx.getX(j+k):j+k));
      if(Math.min(...a.map(p=>p.y))<=y+.020&&Math.max(...a.map(p=>p.y))>=y-.020)tri.push(a);
    }
    const pos=[],uv=[],ix=[],sk=[],wt=[],s=40;
    for(let j=0;j<=1;j++)for(let i=0;i<=s;i++){
      const a=i/s*rad;ray.origin.set(0,y+(j-.5)*.034,.02);
      ray.direction.set(Math.sin(a),0,Math.cos(a));let r=0;
      for(const t of tri)if(ray.intersectTriangle(...t,false,hit))r=Math.max(r,hit.distanceTo(ray.origin));
      if(r===0)r=1/Math.hypot(ray.direction.x/.122,ray.direction.z/.096);
      ray.at(r+.005,v);pos.push(v.x,v.y,v.z);uv.push(i/s,j);
      sk.push(bone('spine_01'),bone('pelvis'),0,0);wt.push(.83,.17,0,0);
      if(j===0&&i<s)ix.push(i,i+s+1,i+1,i+1,i+s+1,i+s+2);
    }
    const beltMat=new T.MeshStandardMaterial({color:0x7b273d,roughness:.75,side:T.DoubleSide});
    attach(attrs(T,new T.BufferGeometry(),pos,uv,ix),beltMat,sk,wt,'Heide · stoffbezogener Gürtel');
    const chest=rig.costumeMount('spine_01'),front=(beltFront??.113)+.008;
    const buckle=new T.Mesh(new RoundedBoxGeometry(.058,.036,.012,2,.005),
      new T.MeshStandardMaterial({color:0xa76c57,roughness:.60,metalness:.36}));
    buckle.position.set(.004,y,front);buckle.name='Heide · rechteckige Gürtelschnalle';chest.add(buckle);
    const slot=new T.Mesh(new RoundedBoxGeometry(.043,.022,.005,2,.002),beltMat);
    slot.position.copy(buckle.position);slot.position.z+=.006;chest.add(slot);
    return;
  }
  if(part===2&&shoe)shoes(T,shoe,part);
  const pos=[],uv=[],ix=[],sk=[],wt=[],segments=18,rows=20;
  for(const hand of ['l','r']){
    const a=rig.restPoint('upperarm_'+hand),b=rig.restPoint('lowerarm_'+hand),c=rig.restPoint('hand_'+hand);
    const u=b.clone().sub(a).normalize(),f=c.clone().sub(b).normalize(),axis=V(),z=V(),x=V(),p=V();
    const side=hand==='l'?1:-1,upper=bone('upperarm_'+hand),lower=bone('lowerarm_'+hand),wrist=bone('hand_'+hand);
    const start=pos.length/3;
    for(let j=0;j<=rows;j++){
      const t=j/rows,end=part===2?1.018:.955,k=.22+t*(2*end-.22),fore=Math.max(0,k-1);
      const center=k<=1?V().lerpVectors(a,b,k):V().lerpVectors(b,c,fore);
      axis.copy(u).lerp(f,sm(k,.79,1.22)).normalize();z.set(0,0,1).addScaledVector(axis,-axis.z).normalize();x.crossVectors(z,axis);
      const elbow=sm(k,.64,1.16),cuff=sm(k,1.70,1.97),round=(part===2?.064:.060)-.014*elbow-.013*cuff;
      const join=sm(k,.79,1.18),catchup=sm(k,1.87,2.06)*.21;
      for(let i=0;i<=segments;i++){
        const ang=i/segments*rad,fold=1+.054*Math.sin(ang*5+k*11)*elbow+.029*Math.cos(k*44+ang*6),
          rr=round*fold*(part===2?1.09:1)*(1+.022*Math.sin(t*rad*7)*cuff);
        p.copy(center).addScaledVector(x,Math.sin(ang)*rr*1.04).addScaledVector(z,Math.cos(ang)*rr*.92);
        pos.push(p.x,p.y,p.z);uv.push(i/segments,t);
        sk.push(upper,lower,wrist,0);wt.push((1-join)*(1-catchup),join*(1-catchup),catchup,0);
        if(j<rows&&i<segments){const i0=start+j*(segments+1)+i,i1=i0+segments+1;
          if(side===1)ix.push(i0,i1,i0+1,i0+1,i1,i1+1);else ix.push(i0,i0+1,i1,i0+1,i1+1,i1);}
      }
    }
  }
  attach(attrs(T,new T.BufferGeometry(),pos,uv,ix),sleeveMat,sk,wt,part===1?'Luisa · gestrickte lange Ärmel':'Grete · lange Strickärmel');
  if(part===1){
    const p=[],uv=[],ix=[],bones=[],weights=[],s=28,h=rig.restPoint('neck_01').y;
    for(let j=0;j<4;j++)for(let i=0;i<=s;i++){
      const a=i/s*rad,t=j/3;
      p.push(Math.sin(a)*(.074-.020*t),h-.026+t*.079,.041+Math.cos(a)*(.083-.026*t));uv.push(i/s,t);
      bones.push(bone('spine_03'),bone('neck_01'),0,0);weights.push(.81-.61*t,.19+.61*t,0,0);
      if(j<3&&i<s){const n=j*(s+1)+i;ix.push(n,n+1,n+s+1,n+1,n+s+2,n+s+1);}
    }
    attach(attrs(T,new T.BufferGeometry(),p,uv,ix),trimMat,bones,weights,'Luisa · gerippter Stehkragen');
  }
}
