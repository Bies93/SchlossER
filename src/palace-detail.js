import {architectureKit} from './architecture-kit.js';

// Friedrich III on the Schlossplatz. All metric dimensions and materials in
// this module belong to this monument, not to the garden's sculptures.
export const FRIEDRICH={z:31,footY:3.157,halfX:1.085,halfZ:1.0};
const {z:origin,footY}=FRIEDRICH, p=(x,y,z)=>[x,y,origin+z];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

const NOISE=`
varying vec3 friedPos;
float friedHash(vec3 p){
  p=fract(p*.3183099+vec3(.1,.21,.37));
  p*=17.;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
float friedNoise(vec3 p){
  vec3 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(mix(friedHash(i),friedHash(i+vec3(1,0,0)),f.x),mix(friedHash(i+vec3(0,1,0)),friedHash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(friedHash(i+vec3(0,0,1)),friedHash(i+vec3(1,0,1)),f.x),mix(friedHash(i+vec3(0,1,1)),friedHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
vec3 friedBump(vec3 n,vec3 surf,float h,float bump){
  vec3 u=dFdx(surf),v=dFdy(surf);
  vec3 a=cross(v,n),b=cross(n,u);
  float k=dot(u,a);
  return normalize(max(abs(k),.000000001)*n-sign(k)*bump*(dFdx(h)*a+dFdy(h)*b));
}
`;

function weathered(T,type){
  const bronze=type==='bronze'||type==='chased';
  const crown=type==='crown',paving=type==='paving',base=type==='base',chased=type==='chased';
  const m=new T.MeshStandardMaterial({name:'Friedrich · '+type,color:0xffffff,roughness:bronze?.58:.83,metalness:bronze?.58:0});
  m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 friedPos;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nfriedPos=(modelMatrix*vec4(transformed,1.)).xyz-vec3(0.,0.,31.);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+NOISE)
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 fp=friedPos;
        vec3 upN=normalize(cross(dFdx(fp),dFdy(fp)));
        float macro=friedNoise(fp*vec3(2.9,2.0,3.7));
        float stain=friedNoise(fp*vec3(14.,2.4,10.)+vec3(macro*1.8,0.,0.));
        float d=max(length(dFdx(fp)),length(dFdy(fp)));
        float shot=mix(friedNoise(fp*${bronze?'53.':'136.'}),.5,smoothstep(.0018,.013,d));
        float pore=mix(friedNoise(fp*${bronze?'132.':'58.'}+7.3),.5,smoothstep(.002,.020,d));
        ${bronze?`
          float shade=smoothstep(.43,.86,macro*.72+stain*.28);
          float wash=smoothstep(.32,.67,stain*.67+macro*.33+max(.0,upN.y)*.075);
          // Crown, rain-exposed shoulders and vertical seams accumulate oxide;
          // the broad smooth armour and recessed folds keep their dark bronze.
          float wig=smoothstep(6.12,6.43,fp.y)*.22;
          float seams=smoothstep(.53,.72,stain)*smoothstep(.30,.55,abs(fp.x))*.13;
          float broad=smoothstep(.09,.24,fp.z)*(1.-smoothstep(5.38,5.8,fp.y))*smoothstep(4.9,5.3,fp.y);
          float oxide=clamp(.29+wash*.46+shade*.10+wig+seams-broad*.12${chased?'-.09':''},.17,.98);
          vec3 bare=mix(vec3(.045,.058,.052),vec3(.087,.100,.084),macro);
          vec3 aged=mix(vec3(.062,.175,.153),vec3(.112,.263,.235),shade);
          diffuseColor.rgb=mix(bare,aged,oxide)*(.89+.16*pore+.16*shot);
          float friedRough=clamp(.41+oxide*.31+(.5-pore)*.15,.32,.89);
          float friedMetal=mix(.75,.18,oxide);
        `:`
          vec3 mineral=mix(vec3(.288,.303,.291),vec3(.530,.519,.475),macro*.49+.32);
          float quartz=smoothstep(.57,.82,shot*.78+pore*.22);
          float fleck=1.-smoothstep(.23,.43,shot*.73+pore*.27);
          float lower=(1.-smoothstep(.045,.46,fp.y))*.18;
          float porosity=smoothstep(.34,.77,stain+macro*.14-.05);
          float runoff=porosity*(${crown?'.25':base?'.13':paving?'.12':'.12+.13*smoothstep(1.81,2.62,fp.y)'})+lower;
          float copper=exp(-abs(fp.y-3.11)*15.)*smoothstep(.37,.75,stain)*${crown?'.77':'.13'};
          diffuseColor.rgb=mineral*(.94+quartz*.28-fleck*.43)*mix(vec3(1.),vec3(.64,.66,.53),runoff);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.66,.85,.68),copper);
          ${paving?'diffuseColor.rgb*=.82;':''}
          float friedRough=clamp(.78+.13*pore+.13*runoff-quartz*.07,.66,.96);
        `}
      `)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=friedRough;')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n'+(bronze?'metalnessFactor=friedMetal;':''))
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
         normal=friedBump(normal,vViewPosition,shot*.47+pore*.53,${bronze?'.00020':'.00067'});
      `);
  };
  m.customProgramCacheKey=()=> 'friedrich-bronze-granite-3-'+type;
  return m;
}

// Ordered profile rings with a small bevel in the actual silhouette.
function stoneProfile(T,levels){
  const xyz=[],ix=[];
  const plan=(x,z,c)=>[[-x+c,-z],[x-c,-z],[x,-z+c],[x,z-c],[x-c,z],[-x+c,z],[-x,z-c],[-x,-z+c]];
  const ring=(y,x,z,c)=>plan(x,z,c).map(([x,z])=>p(x,y,z));
  const g=new T.BufferGeometry(),rows=levels.map(row=>ring(...row));
  for(let i=0;i<rows.length-1;i++){
    const a=rows[i],b=rows[i+1];
    for(let j=0;j<8;j++){
      const k=(j+1)%8, at=xyz.length/3;
      xyz.push(...a[k],...a[j],...b[j],...b[k]);ix.push(at,at+1,at+2,at,at+2,at+3);
    }
  }
  for(const [i,s] of [[0,1],[rows.length-1,-1]]){
    const at=xyz.length/3;xyz.push(...p(0,levels[i][0],0));for(const v of rows[i])xyz.push(...v);
    for(let j=0;j<8;j++){const a=at+1+j,b=at+1+(j+1)%8;ix.push(at,s===1?a:b,s===1?b:a);}
  }
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setIndex(ix);g.computeVertexNormals();return g;
}

const INSCRIPTION=[
  [['FRIEDRICH',1.00],['MARKGRAF VON',.91],['BRANDENBURG-BAYREUTH',.86],['GRÜNDER DER UNIVERSITAET',.83],['ZU ERLANGEN',.90],['MDCCXXXXIII',.88]],
  [['ERRICHTET',1.00],['VON LUDWIG I',.95],['KOENIG VON BAYERN',.89],['HERZOG VON FRANKEN',.86],['MDCCCXXXXIII',.90]]
];

function letters(T,rows){
  const w=768,h=640,mapCanvas=document.createElement('canvas'),reliefCanvas=document.createElement('canvas');
  for(const a of [mapCanvas,reliefCanvas]){a.width=w;a.height=h;}
  const c=mapCanvas.getContext('2d'),r=reliefCanvas.getContext('2d');
  r.fillStyle='#141414';r.fillRect(0,0,w,h);
  c.textAlign=r.textAlign='center';c.textBaseline=r.textBaseline='middle';
  const stride=82,y0=(h-(rows.length-1)*stride)/2;
  rows.forEach(([str,k],i)=>{
    const y=y0+i*stride,font=`bold ${Math.round(k*54)}px Georgia, Cambria, serif`;
    c.font=r.font=font;
    const rim=c.createLinearGradient(0,y-27,0,y+27);
    rim.addColorStop(0,'#52584c');rim.addColorStop(.31,'#414d45');rim.addColorStop(.70,'#39413b');rim.addColorStop(1,'#262d28');
    c.strokeStyle='#373933';c.lineWidth=3.0;c.lineJoin='round';c.strokeText(str,w/2,y,712);
    c.fillStyle=rim;c.fillText(str,w/2,y,712);
    r.strokeStyle='#707070';r.lineWidth=2.8;r.lineJoin='round';r.strokeText(str,w/2,y,712);
    r.fillStyle='#bdbdbd';r.fillText(str,w/2,y,712);
  });
  const map=new T.CanvasTexture(mapCanvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const bumpMap=new T.CanvasTexture(reliefCanvas);bumpMap.anisotropy=4;
  return new T.MeshStandardMaterial({name:'Gegossene Sockelschrift',map,bumpMap,bumpScale:.0014,alphaTest:.31,alphaToCoverage:true,
    metalness:.44,roughness:.66,polygonOffset:true,polygonOffsetFactor:-1});
}

function pedestal(T,root){
  const stone=weathered(T,'stone'),cap=weathered(T,'crown'),base=weathered(T,'base'),paving=weathered(T,'paving');
  const add=(name,levels,m,cast=true)=>{
    const o=new T.Mesh(stoneProfile(T,levels),m);o.name=name;o.castShadow=cast;o.receiveShadow=true;root.add(o);
  };
  // The stone apron is nearly flush with the plaza; only the real pedestal
  // arrests walking. Separate slabs avoid a dark, squared-off decorative frame.
  const apron=architectureKit(T,root,{paving:{material:paving,cast:false}});
  for(const [x0,x1] of [[-1.81,-.925],[-.918,-.003],[.003,.918],[.925,1.81]]){
    for(const [z0,z1] of [[-1.64,-.767],[-.761,.761],[.767,1.64]])apron.box('paving',p,x0,x1,-.045,.021,z0,z1);
  }
  apron.flush('Mineralische Einfassung · bündige Platten');
  const collar=root.children.at(-1);
  add('Untere Standplatte',[
    [.018,1.080,.978,.030],[.040,1.085,.983,.024],[.529,1.085,.983,.024],[.563,1.067,.966,.019],[.576,1.053,.952,.017]
  ],base);
  add('Sockelprofil',[
    [.579,1.053,.951,.019],[.603,1.052,.949,.018],[.619,1.028,.927,.015],[.643,1.014,.912,.016],
    [.662,1.011,.906,.013],[.683,.991,.888,.015],[.697,.958,.851,.013],[.713,.950,.844,.012]
  ],stone);
  add('Granitschaft · ohne Putzzonen',[
    [.716,.949,.842,.017],[.73,.942,.833,.016],[2.577,.942,.833,.016],[2.605,.954,.845,.017]
  ],stone);
  add('Kopfgesims und Bronzeauflager',[
    [2.606,.964,.857,.018],[2.629,.978,.873,.017],[2.673,1.012,.907,.023],[2.730,1.055,.953,.025],
    [2.745,1.084,.981,.023],[2.777,1.084,.981,.024],[2.806,1.065,.958,.021],[2.834,1.032,.926,.019],
    [2.852,.983,.882,.023],[2.886,.957,.855,.025],[2.907,.929,.825,.023],[2.947,.904,.799,.018],
    [2.965,.905,.799,.019],[2.991,.893,.783,.018],[3.138,.867,.757,.023],[footY,.850,.741,.025]
  ],cap);
  for(const [i,side] of [1,-1].entries()){
    const o=new T.Mesh(new T.PlaneGeometry(1.74,1.26),letters(T,INSCRIPTION[i]));
    o.name=i===0?'Stiftungsinschrift · Schlossplatz':'Widmungsinschrift · Schlossseite';
    o.position.set(0,1.708,origin+side*.836);o.rotation.y=i*Math.PI;o.receiveShadow=true;root.add(o);
  }
  return collar;
}

// Keep the existing face, armour and asymmetric cape. Remove the three
// standalone meshes that made up the misplaced, inflated document, then
// trim the hand-only faces below the vambraces. The seed GLB stays intact.
function restoreCore(T,o){
  const old=o.geometry,indices=old.index;
  if(!indices||indices.count!==59457||old.attributes.position.count!==10592)return false;
  const v=old.attributes.position,dst=[];
  for(let i=0;i<indices.count;i+=3){
    const tri=i/3, a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);
    if(tri>=18813&&tri<19771)continue;
    if(tri<4244){
      const x=(v.getX(a)+v.getX(b)+v.getX(c))/3,y=(v.getY(a)+v.getY(b)+v.getY(c))/3;
      const z=(v.getZ(a)+v.getZ(b)+v.getZ(c))/3-origin;
      if(y>4.49&&y<4.817&&((x<-.404&&z>.125)||(x>.447&&z>.121)))continue;
    }
    dst.push(a,b,c);
  }
  const mesh=old.clone();mesh.setIndex(dst);o.geometry=mesh;
  return true;
}

// Tapered, elliptical organic loft in statue-local coordinates. Wrist,
// fingers and the edges of the scroll are different silhouettes.
function loft(T,k,kind,rows,sides=10,caps=true){
  const pos=[],index=[],v=(row)=>new T.Vector3(row[0],row[1],row[2]);
  for(const [i,row] of rows.entries()){
    const t=v(rows[Math.min(i+1,rows.length-1)]).sub(v(rows[Math.max(i-1,0)])).normalize();
    const u=new T.Vector3(1,0,0);if(Math.abs(t.x)>.86)u.set(0,0,1);
    u.addScaledVector(t,-u.dot(t)).normalize();
    const n=t.clone().cross(u), a=v(row);
    for(let j=0;j<sides;j++){
      const rad=j*2*Math.PI/sides;
      const b=a.clone().addScaledVector(u,Math.cos(rad)*row[3]).addScaledVector(n,Math.sin(rad)*(row[4]??row[3]));
      pos.push(...p(b.x,b.y,b.z));
      if(i>0){
        const j2=(j+1)%sides,a0=(i-1)*sides,b0=i*sides;
        index.push(a0+j,a0+j2,b0+j2,a0+j,b0+j2,b0+j);
      }
    }
  }
  if(caps)for(const [i,sign] of [[0,-1],[rows.length-1,1]]){
    const at=pos.length/3;pos.push(...p(...rows[i].slice(0,3)));
    for(let j=0;j<sides;j++){
      const a=i*sides+j,b=i*sides+(j+1)%sides;index.push(at,sign===1?a:b,sign===1?b:a);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();
  k.geometry(kind,g,new T.Matrix4());g.dispose();
}

function sculptureDetails(T,root,body,bronze,chased){
  const k=architectureKit(T,root,{bronze,chased}), flow=(rows,m='bronze',n=10,caps=true)=>loft(T,k,m,rows,n,caps);
  function hand(sign){
    const R=sign<0, x=R?-.473:.558, w=R?4.840:4.844,z=R?.222:.244;
    const row=(dx,dy,dz,a,b)=>[x+dx*sign,w+dy,z+dz,a,b];
    // The cuffs are close to the armour profile, giving the palms a
    // defined wrist instead of a continuous ball of apparently fused bronze.
    flow([row(.015,.146,-.042,.052,.047),row(.004,.063,-.026,.067,.060),
      row(0,.011,-.003,.054,.056),row(-.009,-.041,.021,.055,.048),row(-.020,-.101,.043,.056,.039),
      row(-.022,-.154,.052,.049,.031),row(-.028,-.177,.057,.033,.024)],'bronze',16);
    flow([row(-.001,.028,-.008,.063,.059),row(0,.019,-.004,.065,.061),
      row(-.004,.004,.006,.061,.058),row(-.006,-.008,.010,.057,.053)],'chased',16);
    const offsets=[-.057,-.026,.005,.034];
    offsets.forEach((offset,j)=>{
      const flex=R?.026:.046,extend=[.085,.103,.093,.068][j],base=-.133+(.018*Math.abs(j-1.2));
      flow([row(offset,base,.061-j*.006,.0148,.017),row(offset-.002,base-.033,.070-j*.007,.014,.014),
        row(offset-.007,base-extend*.72,.074-flex*.21-j*.007,.012,.012),
        row(offset-.013,base-extend,.067-flex*.45-j*.007,.008,.009),
        row(offset-.016,base-extend-.010,.062-flex*.55-j*.007,.004,.006)],'bronze',9);
    });
    flow([row(-.043,-.038,.027,.025,.023),row(-.064,-.062,.054,.023,.021),
      row(-.075,-.099,.075,.018,.017),row(-.064,-.121,.084,.015,.014),
      row(-.055,-.129,.080,.008,.010)],'bronze',11);
  }
  hand(-1);hand(1);

  // The founding charter is neither in the free right hand nor merged
  // into the fingers. A curled lip, open spiral and tapered sheet read
  // under the left hand from both the square and the palace.
  const scroll=(u,t)=>{
    const a=-.52+u*3.82;
    const x=.532+.109*t+.043*Math.sin(a),z=.235-.143*t+.036*Math.cos(a);
    return p(x,4.640-.500*t+.029*Math.sin(a+.6),z);
  };
  for(let i=0;i<20;i++)for(let j=0;j<9;j++){
    const a=scroll(i/20,j/9),b=scroll((i+1)/20,j/9),c=scroll((i+1)/20,(j+1)/9),d=scroll(i/20,(j+1)/9);
    const offset=v=>[v[0]-.004,v[1],v[2]];
    k.quad('bronze',a,b,c,d);k.quad('chased',offset(d),offset(c),offset(b),offset(a));
  }
  for(const edge of [0,1]){
    const rows=Array.from({length:11},(_,i)=>{
      const [x,y,z]=scroll(edge,i/10);return [x,y,z-origin,.0054,.0054];
    });
    flow(rows,'chased',7);
  }
  const rim=Array.from({length:24},(_,i)=>{
    const a=-.88+i/23*Math.PI*2.25,r=.043-i*.0012;
    return [.644+r*Math.sin(a),4.14+.023*Math.sin(a),.092+r*Math.cos(a),.0052,.0052];
  });
  flow(rim,'chased',8);
  // Partially rolled bottom edge. Its open helical end catches the light
  // independently of the hand and doesn't read like another finger.
  const curl=(u,t)=>{
    const a=u*2*Math.PI*1.17,r=.046-u*.018;
    return p(.599+t*.193,4.152+t*.031+Math.sin(a)*r,.087+t*.013+Math.cos(a)*r);
  };
  for(let j=0;j<32;j++){
    const a=curl(j/32,0),b=curl(j/32,1),c=curl((j+1)/32,1),d=curl((j+1)/32,0);
    k.quad('chased',a,b,c,d);k.quad('bronze',d,c,b,a);
  }
  flow([[.582,4.540,.243,.007],[.573,4.466,.213,.007],[.556,4.404,.230,.006],[.551,4.365,.250,.005]],'chased',8);
  flow([[.590,4.546,.239,.006],[.583,4.452,.198,.006],[.577,4.414,.214,.005],[.57,4.344,.243,.003]],'chased',8);

  // Reinforce two characteristic edges in the old sculpt without
  // projecting a photograph: chased sash trim and armour fastenings.
  const caster=new T.Raycaster(new T.Vector3(),new T.Vector3(0,0,-1),0,1.2);
  body.updateWorldMatrix(true,false);
  const surface=(x,y)=>{caster.ray.origin.set(x,y,origin+.91);return caster.intersectObject(body,false)[0]?.point.z-origin;};
  for(const d of [0,.029]){
    const strip=[];
    for(let i=0;i<=30;i++){
      const x=-.232+i*.0195, y=5.224+.65*(x+.232)+d+.055*Math.sin(i/30*Math.PI);
      const z=surface(x,y);if(Number.isFinite(z))strip.push([x,y,z+.004,.0042]);
    }
    if(strip.length>2)flow(strip,'chased',7);
  }
  for(const sign of [-1,1])for(let j=0;j<4;j++){
    const x=sign*(.165+j*.014),y=4.78-.098*j,z=surface(x,y);
    if(Number.isFinite(z))flow([[x,y,z-.005,.011],[x,y,z+.003,.011],[x,y,z+.008,.007]],'chased',9);
  }
  // Curved cap seams and knee trim are shallow cast detail, traced over
  // the existing armour to avoid altering Schwanthaler's silhouette.
  for(const [cx,cy,dx,dy] of [[.482,5.48,.075,.054],[-.477,5.18,.059,.038],[-.224,4.155,.087,.081],[.278,4.144,.082,.074]]){
    const welt=[];
    for(let i=0;i<=20;i++){
      const a=Math.PI*i/20,x=cx+Math.cos(a)*dx,y=cy-Math.sin(a)*dy,z=surface(x,y);
      if(Number.isFinite(z))welt.push([x,y,z+.003,.0043]);
    }
    if(welt.length>2)flow(welt,'chased',7);
  }
  k.flush('Nachmodellierte Hand, Urkunde und Ziselierung');
}

export function polishFriedrichMonument(T,sculptures){
  const body=sculptures.getObjectByName('Friedrich_Denkmal_ERL42_Sculpted_bronze');
  const iron=sculptures.getObjectByName('Friedrich_Denkmal_ERL4_Wrought_iron');
  const foot=sculptures.getObjectByName('Friedrich_Denkmal_ERL4_Monument_granite');
  if(!body||!iron||!foot)return;
  const root=new T.Group();root.name='Friedrich-Denkmal · Restaurierung Schlossplatz';sculptures.add(root);
  const bronze=weathered(T,'bronze'),chased=weathered(T,'chased');
  const reworked=restoreCore(T,body);body.material=bronze;
  iron.visible=false;iron.castShadow=false;foot.visible=false;foot.castShadow=false;
  if(reworked)sculptureDetails(T,root,body,bronze,chased);
  return pedestal(T,root);
}
