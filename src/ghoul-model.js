import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {randomSource} from './surface-detail.js';

// Erlanger Gartenwärter: one original mesh and shared material palette,
// five independent skeletons. Forward is local +Z; all positions in metres.
const bones=[
  ['hips',-1,[0,.914,.013]],['back',0,[0,1.064,.034]],['chest',1,[.009,1.283,.079]],
  ['neck',2,[.013,1.484,.145]],['head',3,[.016,1.590,.179]],['jaw',4,[.016,1.627,.244]],
  ['upperL',2,[-.173,1.396,.100]],['elbowL',6,[-.234,1.150,.117]],['handL',7,[-.251,.929,.188]],
  ['upperR',2,[.186,1.396,.091]],['elbowR',9,[.245,1.150,.122]],['handR',10,[.267,.933,.192]],
  ['thighL',0,[-.106,.898,.013]],['shinL',12,[-.106,.487,.013]],['bootL',13,[-.106,.098,.013]],
  ['thighR',0,[.108,.898,.013]],['shinR',15,[.108,.487,.013]],['bootR',16,[.108,.098,.013]],
  ['tailL',0,[-.090,.996,-.019]],['tailR',0,[.093,.975,-.016]]
];
const gunmetal=0x5c5b51,skinTone=0x817c6a,clothTone=0x4d6250;

export function ghoulTemplate(T,variant='garden'){
  const prisoner=variant==='prison';
  const V=(x,y,z)=>new T.Vector3(x,y,z),v=arr=>V(...arr),rng=randomSource(819573);
  const keys=['skin','dry','coat','liner','canvas','leather','metal','eyeBed','eye','teeth'];
  const colors=(prisoner?
    [0x8c8780,0xa79a83,0x5b6059,0x454b46,0x676958,0x493d33,0x595c59,0x292523,0x9da69d,0xb6a28a]:
    [skinTone,0x9e927e,clothTone,0x606757,0x706b51,0x44372c,gunmetal,0x342c25,0xc4ae65,0xa69d77]).map(c=>new T.Color(c));
  const solid=(name,rough=.82)=>new T.MeshStandardMaterial({name,vertexColors:true,roughness:rough});
  const materials=keys.map(k=>solid(k,k==='metal'?.57:.88));
  materials[6].metalness=.45;materials[8].roughness=.43;
  materials[8].emissive.set(prisoner?0x839189:0xc0994c);materials[8].emissiveIntensity=prisoner?.13:.37;
  for(const [i,mat] of materials.entries())if(i<6){
    mat.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 erlGhoulBind;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nerlGhoulBind=position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 erlGhoulBind;
        float flecks(vec3 p){
          vec3 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);
          vec4 a=fract(sin(dot(i,vec3(51.7,23.1,13.8))+vec4(0.,51.7,23.1,74.8))*43758.28);
          vec4 b=fract(sin(dot(i,vec3(51.7,23.1,13.8))+vec4(13.8,65.5,36.9,88.6))*43758.28);
          vec4 c=mix(a,b,u.z);
          return mix(mix(c.x,c.y,u.x),mix(c.z,c.w,u.x),u.y);
        }
      `).replace('#include <color_fragment>',`#include <color_fragment>
        float oldSkinNoise=flecks(erlGhoulBind*${i<2?'vec3(34.,49.,42.)':'vec3(55.,31.,52.)'});
        float fleck=sin(erlGhoulBind.y*625.+sin(erlGhoulBind.x*464.)*.74)*sin(erlGhoulBind.z*483.);
        diffuseColor.rgb*=mix(vec3(.67,.68,.59),vec3(1.19,1.13,1.05),oldSkinNoise)
          * (1.+fleck*.046);
      `);
    };
    mat.customProgramCacheKey=()=> 'erl-ghoul-grain-'+i;
  }
  const bins=keys.map(()=>({p:[],n:[],c:[],j:[],w:[]}));
  const sphere=new T.SphereGeometry(1,16,11),limb=new T.SphereGeometry(1,12,8),
    bead=new T.SphereGeometry(1,8,6),box=new RoundedBoxGeometry(1,1,1,1,.11);
  const Q=new T.Quaternion(),R=new T.Euler(),Y=V(0,1,0);
  const origin=i=>v(bones[i][2]),clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  function vertex(dst,P,N,base,skin,shade){
    const [a,b=a,blend=0]=typeof skin==='number'?[skin]:skin;
    dst.p.push(...P);dst.n.push(...N);dst.j.push(a,b,0,0);dst.w.push(1-blend,blend,0,0);
    const f=shade*(.93+rng()*.14);
    dst.c.push(base.r*f,base.g*f,base.b*f);
  }
  function geom(g,m,skin,matrix=new T.Matrix4(),dark=1){
    const j=keys.indexOf(m),dst=bins[j],p=g.getAttribute('position'),n=g.getAttribute('normal'),idx=g.index;
    const point=V(0,0,0),norm=V(0,0,0),nm=new T.Matrix3().getNormalMatrix(matrix);
    for(let k=0;k<(idx?.count??p.count);k++){
      const i=idx?idx.getX(k):k;
      point.fromBufferAttribute(p,i).applyMatrix4(matrix);
      norm.fromBufferAttribute(n,i).applyNormalMatrix(nm);
      vertex(dst,point,norm,colors[j],typeof skin==='function'?skin(point):skin,dark*(.89+norm.y*.085+norm.z*.045));
    }
  }
  function shaped(g,m,skin,p,s,rotate=[0,0,0],shade=1){
    const q=Q.setFromEuler(R.set(...rotate));
    geom(g,m,skin,new T.Matrix4().compose(v(p),q,v(s)),shade);
  }
  const oval=(m,skin,p,s,r,shade)=>shaped(Math.max(...s)<.042?bead:sphere,m,skin,p,s,r,shade);
  const panel=(m,skin,p,s,r,shade)=>shaped(box,m,skin,p,s,r,shade);
  function line(m,skin,start,end,w,d=w,shade=1){
    const a=v(start),b=v(end),axis=b.clone().sub(a),l=axis.length();
    if(l<.001)return;
    const q=Q.setFromUnitVectors(Y,axis.normalize());
    geom(w<.019?bead:limb,m,skin,new T.Matrix4().compose(a.lerp(b,.5),q,V(w,l*.59,d)),shade);
  }
  function surface(m,ring,segments,distort=0){
    const coords=[],skin=[],indices=[];
    for(let h=0;h<ring.length;h++){
      const [y,rx,rz,cx,cz,bone]=ring[h];
      for(let j=0;j<segments;j++){
        const a=j/segments*Math.PI*2,shape=1+distort*Math.cos(a*5+h*.89)+distort*.56*Math.cos(a*9+1.);
        coords.push(cx+Math.cos(a)*rx*shape,y,cz+Math.sin(a)*rz*shape);skin.push(bone);
        if(h){const i=(h-1)*segments+j,s=(h-1)*segments+(j+1)%segments,k=i+segments,t=s+segments;indices.push(i,k,s,s,k,t)}
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));g.setIndex(indices);
    g.computeVertexNormals();
    const dst=bins[keys.indexOf(m)],base=colors[keys.indexOf(m)],N=V(0,0,0),P=V(0,0,0);
    for(const i of indices){
      N.fromBufferAttribute(g.attributes.normal,i);P.fromArray(coords,i*3);
      vertex(dst,P,N,base,skin[i],.90+N.y*.066+N.z*.078);
    }
    g.dispose();
  }
  surface('coat',[
    [.936,.154,.098,0,.007,0],[.995,.170,.111,-.004,.016,0],
    [1.075,.163,.109,-.001,.046,[0,1,.72]],[1.179,.171,.111,.009,.071,[1,2,.49]],
    [1.308,.206,.121,.005,.091,2],[1.391,.203,.104,.007,.105,2],
    [1.452,.138,.084,.006,.127,[2,3,.25]],[1.484,.070,.066,.013,.146,3]
  ],24,.082);
  oval('skin',[3,4,.24],[.010,1.518,.154],[.062,.106,.059],[.18,0,.03]);
  oval('liner',2,[.019,1.279,.173],[.064,.187,.043],[.14,.02,.11],1.02);
  line('canvas',2,[-.080,1.417,.186],[-.005,1.316,.196],.027,.017);
  line('canvas',2,[.063,1.448,.171],[.012,1.315,.196],.024,.017);
  line('liner',[2,3,.31],[-.109,1.411,.139],[-.045,1.502,.165],.031,.024,1.07);
  line('coat',[2,3,.35],[.091,1.422,.108],[.050,1.502,.153],.036,.024);
  for(const s of [-1,1]){
    const t=s<0?18:19;
    for(let i=0;i<7;i++){
      const a=(i/6)*2.95+.12,y=(prisoner?.824:.695)+.066*Math.sin(i*3.1+s);
      const u=s*(.042+.13*Math.sin(a)),z=.032+Math.cos(a)*.094;
      line(i%3?'coat':'liner',[0,t,.64],[u,.987,z],[u+s*.013,y+.17,z-.012],.045,.018,.91);
      line(i%2?'coat':'canvas',t,[u+s*.01,y+.205,z-.012],[u+s*.007,y,z-.045],.027,.015,.82);
    }
  }
  for(let i=0;i<4;i++){
    const y=1.09+i*.076,z=.162+i*.011,x=.064-i*.006;
    oval('metal',i<2?[1,2,.41]:2,[x,y,z],[.012,.012,.007],[0,0,.10],.81);
    line('liner',2,[-.102,y+.057,.172],[-.147,y+.051,.154],.008,.007,.81);
  }
  line('leather',2,[-.128,1.420,.208],[.124,1.193,.194],.024,.010,1.07);
  line('leather',[2,0,.53],[.113,1.205,.187],[.171,1.045,.106],.022,.013,1.07);
  panel('leather',0,[.163,1.003,.052],[.105,.163,.071],[.10,-.19,-.20],.93);
  panel('canvas',0,[.166,1.039,.087],[.105,.061,.022],[.10,-.19,-.20],.94);
  panel('metal',2,[-.116,1.318,.205],[.061,.036,.010],[0,-.11,.06],.84);
  for(let i=0;i<3;i++)line('leather',2,[-.139,1.310+.008*i,.212],[-.094,1.311+.008*i,.211],.0022,.002,.95);
  panel('leather',0,[0,.948,.015],[.329,.044,.207],[0,0,-.041],.96);
  panel('metal',0,[.020,.947,.121],[.042,.036,.014],undefined,1.1);

  // Hollow temples, an almost flat nose ridge and deep inset amber eyes.
  surface('skin',[
    [1.555,.017,.027,.014,.196,5],[1.571,.059,.059,.014,.203,5],
    [1.615,.075,.073,.013,.199,[4,5,.48]],[1.655,.080,.073,.014,.179,4],
    [1.692,.086,.084,.012,.176,4],[1.727,.082,.080,.013,.167,4],
    [1.768,.078,.082,.012,.157,4],[1.813,.056,.061,.011,.149,4],
    [1.831,.014,.026,.006,.145,4],[1.834,.002,.003,.004,.145,4]
  ],30,.040);
  for(const side of [-1,1]){
    const x=.012+side*.046;
    oval('dry',4,[.014+side*.070,1.680,.218],[.029,.035,.041],[.02,side*.31,side*.35],.94);
    oval('eyeBed',4,[x,1.717,.239],[.022,.014,.013],[0,side*.14,side*.16],.74);
    oval('eye',4,[x+side*.004,1.716,.250],[.007,.0054,.0036],[0,0,side*.16],1.01);
    oval('eyeBed',4,[x+side*.004,1.716,.253],[.0025,.0034,.0016],undefined,.72);
    line('skin',4,[x-.024,1.724,.252],[x+.024,1.733,.244],.007,.0079,1.09);
    line('dry',4,[x+side*.022,1.716,.247],[x+side*.030,1.686,.219],.004,.004,.76);
    for(let j=0;j<6;j++){
      const u=.007*j,y=1.753-.003*j;
      line(j%2?'skin':'dry',4,[x+side*u,y,.235-u*.52],[x+side*(u+.009),y-.016,.228-u*.60],.0026,.0024,.79);
    }
    oval('skin',4,[.014+side*.085,1.685,.153],[.010,.020,.014],[.19,0,side*-.24],.73);
  }
  oval('eyeBed',4,[.017,1.684,.257],[.016,.015,.010],[.11,0,.04],.65);
  oval('dry',4,[.019,1.706,.254],[.010,.015,.014],[-.18,0,.10],.99);
  oval('eyeBed',5,[.012,1.627,.263],[.038,.014,.009],[0,.04,-.08],.74);
  for(let i=0;i<7;i++){
    const x=-.017+i*.010,z=.269-(i-3)**2*.00061;
    panel('teeth',5,[x,1.631+.002*Math.sin(i*2.1),z],[.0056,.0058,.0048],[.10,0,.07*Math.sin(i)],.91+i%3*.07);
  }
  line('skin',5,[-.023,1.620,.265],[.048,1.617,.255],.006,.005,.92);
  line('skin',4,[-.034,1.778,.222],[-.050,1.756,.226],.0035,.0028,.74);
  if(prisoner){
    // A worn field uniform and dented helmet, without weapons or insignia.
    surface('metal',[
      [1.730,.090,.099,.011,.136,4],[1.756,.102,.109,.010,.143,4],
      [1.791,.106,.113,.010,.150,4],[1.833,.102,.109,.010,.148,4],
      [1.865,.088,.095,.009,.146,4],[1.894,.062,.074,.008,.145,4],
      [1.912,.032,.043,.009,.146,4],[1.917,.001,.001,.010,.146,4]
    ],36,.063);
    for(const side of [-1,1]){
      line('metal',4,[.01+side*.089,1.741,.102],[.01+side*.105,1.767,.179],.009,.010,1.20);
      line('leather',4,[.01+side*.090,1.760,.164],[.01+side*.078,1.622,.199],.008,.007,.81);
      oval('metal',4,[.01+side*.105,1.775,.173],[.005,.009,.010],undefined,.83);
      const X=side*.119;
      panel('liner',2,[X,1.287,.193],[.102,.137,.021],[.17,side*.09,side*.043],.93);
      panel('canvas',2,[X,1.355,.195],[.096,.037,.022],[.16,side*.09,side*.043],1.04);
      oval('metal',2,[X,1.342,.207],[.008,.008,.006],undefined,.97);
      line('liner',2,[side*.102,1.434,.106],[side*.207,1.412,.106],.024,.043,.88);
      for(let j=0;j<5;j++){
        line('canvas',2,[X-.041,1.247+j*.019,.207],[X-.038,1.258+j*.019,.208],.0017,.0015,1.23);
      }
    }
    line('metal',4,[-.047,1.858,.221],[-.019,1.883,.213],.003,.003,1.29);
    line('dry',4,[-.070,1.682,.224],[-.034,1.645,.256],.009,.005,.77);
    line('skin',5,[-.024,1.597,.227],[.042,1.587,.227],.009,.004,.81);
    panel('canvas',0,[-.123,.928,.106],[.061,.105,.037],[.12,-.16,.11],.83);
    panel('leather',0,[.130,.898,.091],[.069,.126,.051],[.15,.13,-.07],.87);
    line('canvas',2,[-.016,1.387,.204],[-.025,1.120,.185],.006,.008,.94);
  }

  for(const side of [-1,1]){
    const l=side<0,s=l?6:9,e=s+1,h=s+2,c=origin(s),joint=origin(e),w=origin(h);
    const material=l?'coat':'liner';
    line(material,[2,s,.87],[...c],[...joint],l?.070:.057,l?.065:.054);
    oval(l?'coat':'skin',[s,e,.38],[...joint],[.052,.052,.052],undefined,.94);
    const cuff=joint.clone().lerp(w,l?.68:.17);
    line(l?'coat':'skin',e,[...joint],[...cuff],l?.048:.039,l?.053:.035);
    if(l)oval('canvas',e,[...cuff],[.044,.031,.051],[.44,0,.11],1.04);
    line('skin',[e,h,.18],[...cuff],[...w],.033,.032);
    oval('dry',h,[w.x,w.y-.023,w.z+.018],[.039,.058,.027],[.31,.05,.16*side],.92);
    for(let j=0;j<4;j++){
      const f=w.x+(j-1.5)*.017,by=w.y-.048,depth=w.z+.034;
      line('skin',h,[f,by,depth],[f+side*.012,by-.043-j%2*.007,depth+.020],.010,.010);
      line('dry',h,[f+side*.011,by-.039-j%2*.007,depth+.020],[f+side*.011,by-.059-j%2*.007,depth+.040],.0084,.009,1.01);
    }
    line('skin',h,[w.x-side*.027,w.y-.016,w.z+.025],[w.x-side*.045,w.y-.058,w.z+.054],.012,.011);
    if(!l){
      for(let j=0;j<4;j++)line('dry',e,[w.x-.023,w.y+.063+j*.020,w.z+.026-j*.003],[w.x+.022,w.y+.052+j*.021,w.z+.025-j*.003],.0035,.004,.86);
    }
    const t=l?12:15,g=t+1,b=t+2,x=origin(t).x;
    line('canvas',[t,0,.13],[x,.934,-.008],[x,.459,.040],l?.081:.078,.076);
    line('liner',t,[x+side*.069,.838,.029],[x+side*.056,.526,.048],.005,.008,.75);
    oval('canvas',[t,g,.53],[x,.491,.027],[.063,.103,.068],[.24,0,.11*side]);
    line(l?'canvas':'liner',g,[x,.496,.017],[x,.142,.017],l?.055:.052,.058);
    panel('liner',t,[x+side*.031,.698,.081],[.093,.142,.020],[.03,.10,side*.15],.82);
    if(!l){
      oval('dry',g,[x,.440,.075],[.038,.048,.014],[.1,0,-.21],.87);
      for(let j=0;j<4;j++)line('canvas',g,[x-.030,.459-j*.016,.082],[x+.030,.451-j*.015,.079],.0035,.005);
    }
    panel('leather',b,[x,.029,.074],[.132,.040,.231],[-.034,0,side*.035],.84);
    panel('leather',b,[x,.093,.036],[.113,.119,.126],[.17,0,side*.034],1.02);
    oval('leather',b,[x,.069,.121],[.061,.051,.079],[-.04,0,side*.034],.95);
    oval('metal',b,[x,.061,.169],[.048,.023,.040],[-.2,0,side*.021],.63);
    for(let j=0;j<3;j++)line('canvas',b,[x-.031,.145-j*.008,.041+j*.021],[x+.034,.140-j*.007,.052+j*.021],.0045,.0044,1.08);
  }
  const geometry=new T.BufferGeometry(),p=[],n=[],c=[],idx=[],weights=[];
  for(const [i,s] of bins.entries()){
    if(!s.p.length)continue;
    const first=p.length/3;
    p.push(...s.p);n.push(...s.n);c.push(...s.c);idx.push(...s.j);weights.push(...s.w);
    geometry.addGroup(first,s.p.length/3,i);
  }
  const attr=(key,a,size)=>geometry.setAttribute(key,new T.Float32BufferAttribute(a,size));
  attr('position',p,3);attr('normal',n,3);attr('color',c,3);
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(idx,4));attr('skinWeight',weights,4);
  geometry.boundingSphere=new T.Sphere(V(0,.94,.02),1.43);
  sphere.dispose();limb.dispose();bead.dispose();box.dispose();

  function instantiate(){
    const actor=new T.Group(),body=new T.Group();
    actor.name='Erlanger Ghoul';body.name='Gartenwärter · Skelett';actor.add(body);
    const rig=bones.map(([name,parent])=>{const bone=new T.Bone();bone.name=name;return bone});
    for(const [i,[,j,rest]] of bones.entries()){
      rig[i].position.fromArray(rest);
      if(j>=0){rig[i].position.sub(origin(j));rig[j].add(rig[i])}
    }
    const skinMat=materials.map((base,i)=>{
      const m=base.clone();m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;
      if(i===0||i===2)m.emissive.set(0x7b9138);
      return m;
    });
    const mesh=new T.SkinnedMesh(geometry,skinMat);
    mesh.add(rig[0]);mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton(rig));mesh.castShadow=true;mesh.receiveShadow=true;
    body.add(mesh);
    const shapes=[[4,[.001,.104,.021],.112],[4,[.005,.157,-.006],.083],[2,[.006,.035,.010],.207],
      [1,[0,.008,0],.155],[0,[0,-.011,0],.143],[6,[-.020,-.127,0],.084],[9,[.020,-.127,0],.083],
      [7,[-.009,-.105,.033],.073],[10,[.010,-.104,.035],.070],
      [8,[0,-.028,.028],.056],[11,[0,-.028,.028],.056],
      [12,[0,-.19,0],.106],[15,[0,-.19,0],.106],[13,[0,-.157,.008],.084],[16,[0,-.158,.007],.084],
      [14,[0,-.043,.072],.077],[17,[0,-.043,.072],.077]]
      .map(([bone,offset,r])=>({bone,offset:v(offset),sphere:new T.Sphere(V(0,0,0),r)}));
    const floor=.914,A=.411,B=.389;
    function pose(time,phase,motion,attack,flinch,fall,offset,speech=0){
      const cycle=phase*Math.PI*2,shake=Math.sin(time*13+offset),stride=.238*motion,
        brace=Math.max(0,attack),hit=Math.max(0,flinch);
      rig[0].position.y=floor-.026*(1+Math.cos(cycle*2))*motion*.50-.024*brace;
      rig[0].rotation.y=Math.sin(cycle)*.093*motion;
      rig[0].rotation.z=.028*Math.sin(cycle)*motion;
      rig[1].rotation.x=.195+.054*motion+.32*brace-.209*hit;
      rig[2].rotation.z=.092+.069*Math.cos(cycle)*motion+hit*.183;
      rig[2].rotation.y=.040+Math.sin(cycle)*.083*motion;
      rig[3].rotation.x=-.129-.23*brace+.055*Math.sin(time*1.61+offset);
      rig[4].position.y=.080-.009*brace;
      rig[4].rotation.set(-.13-.081*hit,.075*Math.sin(time*1.81+offset),-.08+.046*shake);
      rig[5].rotation.x=.034+.193*brace+.23*speech;
      for(const [t,sign] of [[12,-1],[15,1]]){
        const s=t===12?6:9,f=phase+(sign>0?.5:0),q=f-Math.floor(f),stance=.61,air=clamp((q-stance)/(1-stance));
        const delta=q<stance?1-2*q/stance:-Math.cos(Math.PI*air);
        const ankleY=.104+Math.sin(Math.PI*air)*.149*motion;
        const dep=delta*stride,dy=ankleY-(.898+rig[0].position.y-floor);
        const dist=clamp(Math.hypot(dep,dy),.10,A+B-.003);
        const tilt=Math.atan2(-dep,-dy),elbow=Math.PI-Math.acos(clamp((A*A+B*B-dist*dist)/(2*A*B),-1,1)),
          thigh=tilt-Math.acos(clamp((dist*dist+A*A-B*B)/(2*dist*A),-1,1));
        rig[t].rotation.x=thigh;rig[t+1].rotation.x=elbow;rig[t+2].rotation.x=-thigh-elbow+.162*Math.sin(air*Math.PI)*motion;
        rig[s].rotation.x=(-.405+sign*.11)-Math.sin(cycle)*sign*(.270+sign*.10)*motion-.94*brace+.64*hit*sign;
        rig[s].rotation.z=sign*(.16-.06*motion)+hit*.20*sign;
        rig[s+1].rotation.x=-.275-sign*.099-.48*brace+.18*Math.cos(cycle+.3)*motion;
        rig[s+2].rotation.x=.19-.28*brace+.11*shake*motion;
      }
      rig[18].rotation.x=.12+.23*Math.sin(cycle+.5)*motion;
      rig[19].rotation.x=-.08-.19*Math.sin(cycle+.1)*motion;
      body.rotation.z=fall*.96;body.rotation.x=fall*1.16;
      body.position.y=-fall*.04;
      skinMat[0].emissiveIntensity=hit*.23;skinMat[2].emissiveIntensity=hit*.13;
    }
    function hitShapes(){
      actor.updateMatrixWorld(true);
      for(const s of shapes)s.sphere.center.copy(s.offset).applyMatrix4(rig[s.bone].matrixWorld);
      return shapes;
    }
    function shadow(on){mesh.castShadow=on}
    return {actor,pose,hitShapes,shadow};
  }
  return {instantiate};
}
