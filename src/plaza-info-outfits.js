import {scalpFitter} from './scalp-fit.js';
import {randomSource} from './surface-detail.js';
import {bindInfoMesh,dressInfoWardrobe} from './plaza-info-clothes.js';

const tau=2*Math.PI;
const looks=[
  {name:'Heidi · brustlanges Haar mit Pony',root:0x61422a,tip:0xbc8b4e,length:.337,part:-.18,wave:.006,body:.017},
  {name:'Luisa · Mittelscheitel mit honigblonden Spitzen',root:0x685345,tip:0xcba879,length:.219,part:.02,wave:.008,body:.013},
  {name:'Greta · aschblond, tief gebunden',root:0x8a7d68,tip:0xc1ac86,length:.049,part:-.25,wave:.002,body:.009}
];

function strands(T){
  const w=256,h=128,data=new Uint8Array(w*h*4),rand=randomSource(6817),fibers=Array.from({length:w},()=>rand()-.5);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const s=x/w,t=y/h,bend=(x+Math.round(2.2*Math.sin(t*tau+s*tau*2)))%w;
    const d=207+fibers[(bend+w)%w]*45+12*Math.sin(s*tau*25+.8*Math.sin(t*tau*2))+
      7*Math.sin(s*tau*51+t*tau)-9*Math.sin(t*tau)*Math.cos(s*tau*11);
    const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=d;data[i+3]=255;
  }
  const map=new T.DataTexture(data,w,h);map.wrapS=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;
  map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  return map;
}

export function standOutfits(T){
  const fiber=strands(T);
  function hair(rig,part){
    const o=looks[part],tied=part===2,sm=T.MathUtils.smoothstep,mix=T.MathUtils.lerp;
    const center=rig.restPoint('head').add(new T.Vector3(0,.052,.005));
    const skin=scalpFitter(T,rig.costumeScalp,center),dir=new T.Vector3(),v=new T.Vector3();
    const div=64,rows=13,maxFall=14,edges=[],vertices=[],uv=[],colors=[],indices=[],sway=[],joints=[],weights=[];
    let garment;rig.actor.traverse(n=>{if(n.isSkinnedMesh&&/^Cloth/.test(n.material.name))garment=n;});
    const head=garment.skeleton.bones.indexOf(rig.joint('head')),chest=garment.skeleton.bones.indexOf(rig.joint('spine_03'));
    const rootColor=new T.Color(o.root),tipColor=new T.Color(o.tip),color=new T.Color();
    const point=(a,t)=>{
      const k=Math.min(a,tau-a);
      const fromPart=a<Math.PI?a-o.part:a-tau-o.part;
      const brow=part===0?1.48-.22*sm(k,.42,.92):part===1?
        .93+.235*sm(k,.19,1.00)-.074*Math.exp(-(fromPart**2)/.026):1.05-.11*Math.exp(-(fromPart**2)/.042);
      const edge=brow+(tied?.27:.30)*sm(k,.83,1.76)+(tied?.31:.36)*sm(k,1.63,2.76);
      const peak=(part===0?.029:.013)*Math.sin(a*19+part)+.009*Math.sin(a*37);
      const sweep=(part===0?.08:tied?.21:.15)*Math.sin(Math.PI*t)*Math.sin(a-o.part);
      const theta=.001+(edge+peak)*t;
      dir.set(Math.sin(a+sweep)*Math.sin(theta),Math.cos(theta),Math.cos(a+sweep)*Math.sin(theta));
      const puff=o.body*(.70+.35*Math.sin(theta))+.003*Math.sin(a*17+theta*2)*Math.sin(theta);
      const rooted=1-(part===0?.13:.64)*sm(t,.83,1)*(1-sm(k,.94,1.39));
      return v.copy(center).addScaledVector(dir,skin(dir)+puff*rooted);
    };
    function vert(p,u,t,k,weight,tip=0,movement=0){
      vertices.push(p.x,p.y,p.z);uv.push(u,t);color.copy(rootColor).lerp(tipColor,tip).multiplyScalar(k);
      colors.push(color.r,color.g,color.b);sway.push(weight);
      joints.push(head,chest,0,0);weights.push(1-movement,movement,0,0);
    }
    const base=a=>.88+.085*Math.sin(a*12+part*.8)+.037*Math.cos(a*27);
    for(let j=0;j<=rows;j++)for(let i=0;i<=div;i++){
      const t=j/rows,u=i/div,a=u*tau;
      const p=point(a,t),atPart=1-sm(Math.abs(Math.sin((a-o.part)*.5)),.018,.074);
      vert(p,u,t*.58,base(a)*(1+(part===1?.28:0)*atPart*sm(t,.19,.78)),0,(part===0?.19:.10)*t);
      if(j===rows)edges.push(p.clone());
    }
    for(let j=1;j<=maxFall+1;j++)for(let i=0;i<=div;i++){
      const t=Math.min(1,j/maxFall),u=i/div,a=u*tau,k=Math.min(a,tau-a),p=v.copy(edges[i]);
      const fall=sm(k,tied?1.14:part===0?.78:.98,tied?2.35:2.36);
      const wave=Math.sin(t*(part===0?8.7:3.1)+a*17+part)*o.wave*t;
      const swept=Math.sin(a)*(tied?.008:.044);
      p.x+=swept*Math.sin(t*Math.PI*.92)*fall+Math.sin(a)*wave;
      p.y-=t*(.001+fall*(o.length+(tied?.005:.013)*Math.sin(a*9)+.004*Math.sin(a*29)));
      p.z-=t*(tied?-.011:.069)*fall+(tied?.006:.038)*Math.abs(Math.sin(a))*fall*t+wave*fall;
      if(tied)p.x=mix(p.x,center.x,.22*fall*t*t);
      if(j>maxFall){p.x=mix(p.x,center.x,.12);p.z=mix(p.z,center.z,.13);p.y+=.006*fall;}
      vert(p,u+.008*Math.sin(t*4+a*4)*fall,.58+t*.42,base(a)*(1-t*.14),fall*t*t,
        (tied?.30:.85)*sm(t,.17,.96),tied?0:.72*fall*sm(t,.23,.89));
    }
    for(let j=0;j<rows+maxFall+1;j++)for(let i=0;i<div;i++){
      const a=j*(div+1)+i,b=a+div+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    // Front lengths wrap down over the shoulder and blend toward the torso,
    // so they stay on the garment as the NPC turns to talk to the player.
    function lock(points,width,seed,tied=false){
      const n=22,s=14,start=vertices.length/3,curve=new T.CatmullRomCurve3(points);
      const along=new T.Vector3(),tangent=new T.Vector3(),c=new T.Vector3(),q=new T.Vector3(),out=new T.Vector3();
      for(let j=0;j<=n;j++){
        const t=j/n;curve.getPoint(t,c);curve.getTangent(t,along);
        tangent.set(0,0,1).cross(along).normalize();out.crossVectors(along,tangent).normalize();
        const shape=.66+.43*sm(t,0,.27)-1.05*sm(t,.66,1),w=Math.max(.001,shape*width);
        for(let i=0;i<=s;i++){
          const u=i/s,a=u*tau,phase=1+.078*Math.sin(a*5+t*7+seed);
          q.copy(c).addScaledVector(tangent,w*Math.cos(a)*phase).addScaledVector(out,w*.49*Math.sin(a)*phase);
          vert(q,u*.34+seed*.137,t,.86+.11*Math.sin(a*5-t*3),t*t,tied?.32*t:sm(t,.13,.88)*.94,
            tied?.26*sm(t,.49,1):.93*sm(t,.20,.69));
          if(j<n&&i<s){const a=start+j*(s+1)+i,b=a+s+1;indices.push(a,b,a+1,b,b+1,a+1);}
        }
      }
    }
    const V=(x,dy,z)=>new T.Vector3(x,center.y+dy,z);
    if(!tied){
      for(const side of [-1,1]){
        const short=part===1,lag=side===1?.017:0;
        lock([V(side*.068,.027,.057),V(side*.086,-.084,.074),V(side*.111,-.161,.107),
          V(side*(short?.134:.121),-.225,.147),V(side*(short?.108:.115),(short?-.270:-.350)+lag,short?.161:.182),
          V(side*(short?(side===1?.096:.074):.136),(short?-.287:-.375)+lag,short?(side===1?.156:.145):.168)],short?.036:.039,1.25+side);
      }
    }else lock([V(.014,-.063,-.046),V(.003,-.105,-.081),V(-.012,-.163,-.102),V(-.033,-.220,-.111)],.029,.57,true);
    const geom=new T.BufferGeometry(),attr=(a,n)=>new T.Float32BufferAttribute(a,n);
    geom.setAttribute('position',attr(vertices,3));geom.setAttribute('uv',attr(uv,2));geom.setAttribute('color',attr(colors,3));
    geom.setAttribute('strandFlex',attr(sway,1));geom.setIndex(indices);geom.computeVertexNormals();
    const n=geom.attributes.normal;
    for(let j=0;j<=rows+maxFall+1;j++){
      const a=j*(div+1),b=a+div;
      v.fromBufferAttribute(n,a).add(dir.fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);
    }
    const mat=new T.MeshStandardMaterial({map:fiber,roughness:.79,vertexColors:true,side:T.DoubleSide});
    const breeze={value:0};
    mat.customProgramCacheKey=()=> 'vorplatz-haar-bewegung-1';
    mat.onBeforeCompile=s=>{
      s.uniforms.standBreeze=breeze;
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float strandFlex; uniform float standBreeze;')
        .replace('#include <begin_vertex>',`#include <begin_vertex>
           transformed.x+=strandFlex*.010*sin(standBreeze*2.8+position.y*7.0);
           transformed.z+=strandFlex*.009*cos(standBreeze*2.2+position.x*15.0);`);
    };
    bindInfoMesh(T,garment,geom,mat,joints,weights,o.name);
    if(tied){
      const mount=rig.costumeMount('head');
      const band=new T.Mesh(new T.TorusGeometry(.021,.0033,7,20),new T.MeshStandardMaterial({color:0x333637,roughness:.92}));
      band.position.copy(V(.003,-.104,-.081));band.rotation.x=1.09;band.name='Greta · dunkles Haarband';mount.add(band);
    }
    return t=>{breeze.value=t*(tied?.65:1);};
  }
  return function dress(rig,part){
    const update=hair(rig,part);dressInfoWardrobe(T,rig,part);
    return update;
  };
}
