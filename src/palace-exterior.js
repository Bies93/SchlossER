import {architectureKit} from './architecture-kit.js';

// Only the palace uses this palette, not the generic sandstone in the park.
export function palaceExterior(T,finish){
  const variants=new Map(),palette={
    SANDSTONE:[0xf0ebe9,.87,.27,0],
    SANDSTONE_CUT:[0xe8e5e4,.82,.29,1],
    SANDSTONE_DARK:[0xcdc9c5,.92,.26,2],
    STATUE:[0xb3b3a7,.87,.31,3],
    WOOD:[0x936e68,.66,.20],
    WOOD_RELIEF:[0x9d7c6d,.63,.21],
    RECESS:[0x292a2b,.96,0],
    LINEN:[0x8d8880,.92,0],
    MORTAR:[0x645c54,.94,0],
    COPPER_PATINA:[0x687b71,.72,0],
    ZINC:[0x96999b,.62,0],
    GLASS:[0x3d4c5e,.32,0]
  };
  return key=>{
    if(!Object.hasOwn(palette,key))return finish(key);
    if(variants.has(key))return variants.get(key);
    const [color,roughness,normal,role]=palette[key],m=finish(key).clone();
    m.color.setHex(color);m.roughness=roughness;m.normalScale.setScalar(normal);
    if(role!==undefined)stoneShader(m,role);
    if(key==='GLASS')glassShader(m);
    if(key==='COPPER_PATINA')m.metalness=.20;
    if(key==='ZINC')m.metalness=.36;
    variants.set(key,m);return m;
  };
}

function positionPatch(shader,normals=false){
  const names='varying vec3 palaceP;'+(normals?'varying vec3 palaceN;':'');
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+names)
    .replace('#include <begin_vertex>','#include <begin_vertex>\npalaceP=(modelMatrix*vec4(position,1.)).xyz;'
      +(normals?'palaceN=normalize(mat3(modelMatrix)*normal);':''));
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
    ${names}
    float palHash(vec2 p){return fract(sin(dot(p,vec2(87.53,31.19)))*41762.297);}
    float palNoise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(palHash(i),palHash(i+vec2(1,0)),f.x),mix(palHash(i+vec2(0,1)),palHash(i+1.),f.x),f.y);
    }`);
}

function stoneShader(material,role){
  material.onBeforeCompile=shader=>{
    positionPatch(shader,true);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 pn=normalize(palaceN);
      float py=palaceP.y,px=abs(palaceP.x),pz=palaceP.z;
      // Project differently on the returning walls so the coursing does not
      // stretch over the short elevations or over either risalit return.
      float onSide=step(.60,abs(pn.x));
      float chain=mix(palaceP.x,pz+37.,onSide);
      float west=step(0.,pz),pier=smoothstep(8.6,9.18,abs(pz))+smoothstep(32.56,33.1,px);
      float foot=(1.-smoothstep(.19,1.36,py))*min(1.,pier);
      float base=(1.-smoothstep(3.87,4.27,py))*min(1.,pier);
      float repair=west*(1.-smoothstep(6.31,6.84,px))*smoothstep(10.9,11.7,pz);
      float coarse=palNoise(vec2(chain*.38,py*.42));
      float streak=palNoise(vec2(chain*3.2,py*.57));
      float grit=palNoise(vec2(chain,py)*13.4);
      float row=floor(py/.562+.006);
      float block=palHash(vec2(floor(chain/1.10+mod(row,2.)*.5),row));
      float upperRow=floor((py+.08)/.455);
      float upperBlock=palHash(vec2(floor(chain/1.24+mod(upperRow,2.)*.5),upperRow));
      float role=${role.toFixed(1)};
      float tile=mix(upperBlock,block,base);
      // The baked set is a good source of stone grain, but its ochre cast
      // and a buff tint together skewed even blue-lit masonry toward orange.
      float grains=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      vec3 warm=vec3(1.035,.978,.922),cool=vec3(.963,.985,1.014),rose=vec3(1.115,.949,.923);
      vec3 stone=mix(cool,warm,smoothstep(.12,.71,tile*.8+coarse*.2));
      stone=mix(stone,rose,smoothstep(.57,.85,tile)*.79);
      float course=(1.-smoothstep(.008,.029,abs(fract(py/.562+.5)-.5)*.562));
      float fineJoint=(1.-smoothstep(.004,.017,abs(fract((py+.08)/.455+.5)-.5)*.455));
      float upright=1.-smoothstep(.17,.55,abs(pn.y));
      // Darken the actual rustication beds in place; don't stamp a second
      // grid onto the window surrounds and projecting profile stones.
      float joint=(base*course*.40+(1.-base)*fineJoint*.11)*upright*min(1.,pier);
      if(role>.5)joint*=.29;
      float underEave=smoothstep(15.01,16.31,py)*(1.-smoothstep(16.38,16.61,py));
      float belt=exp(-pow((py-4.55)*4.7,2.))*min(1.,pier);
      float sill=exp(-pow((py-5.88)*6.7,2.))*.48+exp(-pow((py-10.95)*7.8,2.))*.48;
      float weather=(underEave*.38+belt*.36+sill*.24)*(1.-repair*.54);
      weather+=(base*.038+foot*.24)*(.45+.72*streak);
      float faces=(.87+tile*.24+coarse*.095)*(.955+grit*.087);
      if(role>.5&&role<1.5){
        faces=mix(faces,1.025,.37);
        float outerFace=smoothstep(8.95,9.61,abs(pz))+smoothstep(32.85,33.65,px);
        weather+=min(1.,outerFace)*(.13*max(pn.y,0.)+.22*max(-pn.y,0.))*mix(.66,1.25,streak);
      }
      // West carvings are baked into the trim mesh; the garden figures
      // have their own material. Keep the plinth and the crown stone.
      float standCore=max(1.-smoothstep(.49,.61,abs(px-2.64)),1.-smoothstep(.52,.66,abs(px-6.18)));
      float westFigure=smoothstep(18.13,18.54,py)*smoothstep(11.48,11.69,pz)*standCore;
      float carving=smoothstep(18.05,18.45,py)*smoothstep(12.28,12.46,pz)*(1.-smoothstep(.88,1.32,px));
      float patina=role>2.5?1.:role>.5?max(westFigure,carving):0.;
      float crust=smoothstep(.13,.81,.56*coarse+.30*streak+.14*grit);
      vec3 weathered=grains*vec3(.75,.79,.74)*mix(.63,.94,crust);
      weathered*=mix(.77,1.03,clamp(pn.y*.45+.52,0.,1.));
      vec3 body=grains*stone*faces*(1.-clamp(weather+joint,0.,.62))*(1.+repair*.10);
      diffuseColor.rgb=mix(body,weathered,patina*.94);
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+coarse*.092-.04+patina*.05,.73,.98);
    `);
  };
  material.customProgramCacheKey=()=> 'erl-palace-exterior-stone-v3-'+role;
}

function glassShader(mat){
  mat.envMapIntensity=1.09;
  mat.onBeforeCompile=shader=>{
    positionPatch(shader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
       float sheet=palHash(floor(vec2(palaceP.x+palaceP.z*.74,palaceP.y)*vec2(1.64,1.27)));
       diffuseColor.rgb*=.88+sheet*.30;
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
       roughnessFactor=clamp(roughnessFactor+(sheet-.5)*.16,.25,.43);
    `);
  };
  mat.customProgramCacheKey=()=> 'erl-palace-exterior-skyglass-v3';
}

// The main hipped surface uses four continuous slopes instead of tens of
// thousands of overlapping shingle faces. The width, end hips and ridge
// follow the authored envelope checked against the exterior aerial photos.
export function renewPalaceRoof(T,root,finish){
  for(const name of ['ERL_ROOF_DARK','ERL_ROOF_UNDERLAY_v1']){
    const m=root.getObjectByName(name);if(m){m.visible=false;m.castShadow=false;}
  }
  const guards=root.getObjectByName('ERL_METAL');
  if(guards){
    // Remove only the old rail along the outer cornice, leaving window metal.
    const g=guards.geometry,p=g.attributes.position,idx=g.index,v=new T.Vector3(),keep=[];
    guards.updateWorldMatrix(true,false);
    for(let i=0;i<(idx?.count??p.count);i+=3){
      const ids=[idx?.getX(i)??i,idx?.getX(i+1)??i+1,idx?.getX(i+2)??i+2];
      if(ids.every(j=>{v.fromBufferAttribute(p,j).applyMatrix4(guards.matrixWorld);return v.y>16.48&&Math.abs(v.z)<10;}))continue;
      keep.push(...ids);
    }
    const replacement=g.clone();replacement.setIndex(keep);guards.geometry=replacement;g.dispose();
  }
  const group=new T.Group();group.name='Schloss · Schieferwalmdach und Traufe';root.add(group);
  const slate=finish('ROOF_DARK').clone();slate.color.setHex(0xc7cdd4);slate.vertexColors=false;
  slate.roughness=.77;slate.normalScale.setScalar(.46);slate.envMapIntensity=.65;
  slate.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // Slate holds a diffuse, cool mid-tone even on the slope in shade.
      // Raising the measured texture range keeps its relief out of black.
      diffuseColor.rgb=diffuseColor.rgb*1.32+vec3(.006,.007,.009);
    `);
  };
  slate.customProgramCacheKey=()=> 'erl-palace-slate-v1';
  const edge=new T.MeshStandardMaterial({color:0x454e54,roughness:.72,metalness:.36});
  const gutter=new T.MeshStandardMaterial({color:0x53565a,roughness:.62,metalness:.46});
  const lining=new T.MeshStandardMaterial({color:0x383532,roughness:.87});
  const {triangle,quad,box,flush}=architectureKit(T,group,{slate,edge,gutter,lining});
  const W=33.86,D=9.88,E=16.52,R=20.91,L=23.38;
  const A=[-W,E,D],B=[W,E,D],C=[W,E,-D],F=[-W,E,-D],P=[-L,R,0],Q=[L,R,0];
  const slope=Math.hypot(D,R-E);
  function plane(a,b,c,d,projection){
    const add=(p,q,r)=>triangle('slate',p,q,r,[...projection(p),...projection(q),...projection(r)]);
    add(a,b,c);if(d)add(a,c,d);
  }
  plane(A,B,Q,P,([x,,z])=>[x/4.35,(D-z)*slope/D/4.85]);
  plane(C,F,P,Q,([x,,z])=>[-x/4.35,(D+z)*slope/D/4.85]);
  plane(B,C,Q,null,([x,,z])=>[-z/4.35,(W-x)/4.55]);
  plane(F,A,P,null,([x,,z])=>[z/4.35,(W+x)/4.55]);
  const at=(x,y,z)=>[x,y,z];
  for(const side of [-1,1]){
    const a=side===1?A:C,b=side===1?B:F;
    quad('lining',[a[0],16.245,a[2]],[b[0],16.245,b[2]],b,a,4.4);
    const out=(x,y,d)=>[side*x,y,side*(D+d)];
    box('gutter',out,-W-.035,W+.035,E-.086,E+.011,-.037,.062);
    box('edge',out,-W,W,E-.015,E+.027,.041,.073);
    const gauge=(x,y,z)=>[side*x,y,side*(D-.21+z)];
    box('edge',gauge,-W+.29,W-.29,16.94,16.969,-.014,.014);
    box('edge',gauge,-W+.29,W-.29,16.684,16.706,-.012,.012);
    for(let k=0;k<=168;k++){
      const x=-W+.29+k*(W*2-.58)/168;
      box('edge',gauge,x-.008,x+.008,16.582,16.949,-.009,.009);
    }
    const x=side*W;
    const returnEdge=(z,y,d)=>[x+side*d,y,-side*z];
    box('lining',returnEdge,-D,D,16.245,E,-.086,.001);
    box('gutter',returnEdge,-D,D,E-.078,E+.008,-.036,.060);
  }
  box('edge',at,-L-.02,L+.02,R-.026,R+.042,-.094,.094);
  for(const [a,b] of [[A,P],[B,Q],[C,Q],[F,P]]){
    const u=b[0]-a[0],w=b[2]-a[2],len=Math.hypot(u,w);
    const fold=(s,h,o)=>[a[0]+u*s/len-w/len*o,a[1]+(b[1]-a[1])*s/len+h,a[2]+w*s/len+u/len*o];
    box('edge',fold,.012,len+.012,-.013,.025,-.060,.060);
  }
  flush('Schieferdach');
}
