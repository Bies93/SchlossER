import {BERG_POOL as P,BERG_LAYER,BERG_FLOOR as F,BERG_HALL as B} from './berg-layout.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';
import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';

export const bergReturn={x:P.x-.2,z:P.z-2.75};
export const bergArrival={x:P.x,z:P.z+2.05};
const beerColors=['clay','beer','green'];
export function addBergTavern(T,scene,world){
  const root=new T.Group();root.name='Zur letzten Einkehr · Felsenkeller';scene.add(root);
  const mat=bergMaterials(T),k=carpentry(T,root,mat),r=3.18,corner=1.94;
  const box=(m,x,y,z,...s)=>k.box(m,P.x+x,F+y,P.z+z,...s);
  const cyl=(m,x,y,z,...s)=>k.cyl(m,P.x+x,F+y,P.z+z,...s);
  const ring=(m,x,y,z,...s)=>k.ring(m,P.x+x,F+y,P.z+z,...s);
  const card=(x,y,z,w,h,title,sub,lines=[],opts={})=>storyCard(T,root,{x:P.x+x,y:F+y,z:P.z+z,width:w,height:h,title,sub,lines,...opts});
  const solid=(x,z,w,d,h=0)=>world[h?'platform':'box'](P.x+x-w/2,P.z+z-d/2,P.x+x+w/2,P.z+z+d/2,...(h?[F+h]:[]));
  box('grout',0,-.1,-.675,13,.19,10);
  for(let j=0;j<16;j++)for(let i=0;i<22;i++){
    const x=-6.16+i*.585,z=-5.34+j*.624;
    box((i*7+j*11)%8===0?'rock':'stone',x,-.026,z,.577,.055,.614);
  }
  for(const s of [-1,1]){
    box('rock',s*6.535,1.5,-.675,.20,3.02,10.05);solid(s*6.49,-.67,.13,10.1);
    box('dark',s*6.405,.43,-.675,.13,.86,9.94);
    box('edge',s*6.37,.89,-.675,.163,.081,9.96);
    for(let j=0;j<24;j++){
      const z=-5.42+j*.414;
      box('oak',s*6.329,.46,z,.037,.70,.391);
      box('edge',s*6.305,.47,z,.013,.57,.018);
    }
  }
  for(const z of [B.back,B.front]){
    const zz=z+(z===B.back?-.05:.05);
    solid(0,zz,13.1,.15);
    box('rock',0,2.05,zz,13.1,4.12,.17);
    for(let j=0;j<7;j++)for(let i=0;i<16;i++){
      const x=-6.0+i*.793+(j%2)*.14;
      box((i+j*3)%5===0?'rock':'stone',x,.20+j*.446,zz+(z===B.back?.10:-.10),.78,.435,.055);
    }
  }
  const arch=(x,z)=>[P.x+x,F+corner+r*Math.sqrt(Math.max(0,1-(x/6.55)**2))*.68,P.z+z];
  for(let i=0;i<36;i++){
    const l=-6.46+i*12.92/36,h=l+12.92/36;
    k.quad(i%7===0?'stone':'rock',arch(h,4.37),arch(l,4.37),arch(l,-5.72),arch(h,-5.72),1.45,i*.113);
    for(const z of [-4.2,-.46,3.23]){
      const low=(x,v)=>{const pt=arch(x,v);pt[1]-=.12;return pt;};
      k.quad('stone',low(h,z+.12),low(l,z+.12),low(l,z-.12),low(h,z-.12));
      k.quad('stone',arch(l,z+.12),arch(h,z+.12),low(h,z+.12),low(l,z+.12));
      k.quad('stone',low(l,z-.12),low(h,z-.12),arch(h,z-.12),arch(l,z-.12));
    }
  }
  // Counter, stout feet, carved panel edges and a real aisle to the return.
  box('dark',0,.46,-3.41,5.69,.91,.64);
  box('edge',0,.97,-3.41,5.87,.126,.84);box('oak',0,1.048,-3.41,5.90,.058,.89);
  for(let i=-3;i<=3;i++){
    const x=i*.77;box('oak',x,.49,-3.078,.731,.65,.043);
    box('edge',x,.80,-3.042,.716,.033,.029);
    for(const xx of [x-.34,x+.34])box('edge',xx,.48,-3.041,.028,.645,.026);
    box('brass',x,.48,-3.020,.05,.05,.024);
  }
  solid(0,-3.41,5.91,.89,1.077);
  for(const x of [-2,0,2]){
    cyl('brass',x,1.19,-3.55,.029,.20);ring('brass',x,1.276,-3.49,.055,.054,.26);
    cyl('dark',x,1.344,-3.54,.033,.09);
    box('iron',x,1.083,-3.35,.29,.018,.18);
  }
  function stein(x,y,z,m='clay'){
    cyl(m,x,y+.078,z,.060,.151);cyl('dark',x,y+.009,z,.065,.017);
    cyl('iron',x,y+.158,z,.064,.011);cyl('beer',x,y+.165,z,.052,.009);
    ring(m,x+.063,y+.082,z,.034,.041,.105);
    cyl('brass',x,y+.151,z-.054,.012,.044);
  }
  for(let j=0;j<3;j++){
    const y=1.16+j*.42;box('oak',0,y,-5.35,5.68,.073,.48);
    for(let i=0;i<17;i++)if((i*7+j*3)%5!==1)stein((i-8)*.298,y+.039,-5.27,beerColors[(i+j)%3]);
  }
  // Old beer casks with hoop profiles and stained platforms.
  for(const s of [-1,1])for(const [i,z] of [-4.9,-3.97,-3.04].entries()){
    const x=s*(4.48+i%2*.3),y=.57,h=.74;
    cyl('oak',x,y,z,.387,h,Math.PI/2);cyl('edge',x,y,z,.418,.42,Math.PI/2);
    for(const v of [-.295,.293])cyl('iron',x,y,z+v,.408,.083,Math.PI/2);
    ring('dark',x,y,z+.378,.333,.333,.18);
    box('dark',x,.094,z,.82,.19,.75);solid(x,z,.84,.78,.95);
    cyl('brass',x,y-.17,z+.385,.047,.095,Math.PI/2);
  }
  const chairs=[[-3.97,1.78,Math.PI],[-3.97,-.82,0],[3.97,1.78,Math.PI],[3.97,-.82,0]];
  function table(x,z){
    box('dark',x,.636,z,2.29,.23,1.13);box('edge',x,.765,z,2.45,.092,1.19);
    for(let i=0;i<5;i++)box('oak',x,.821,z+(i-2)*.232,2.42,.032,.229);
    for(const a of [-.985,.985])for(const b of [-.415,.415]){
      box('oak',x+a,.345,z+b,.113,.69,.115);box('dark',x+a,.059,z+b,.144,.117,.141);
    }
    box('red',x,.845,z,.70,.016,1.151);
    for(const a of [-.32,.32])box('linen',x+a,.855,z,.018,.008,1.12);
    solid(x,z,2.45,1.19,.837);
    for(const [i,a] of [-.78,-.22,.55,.91].entries())stein(x+a,.851,z+(i%2?.32:-.26),beerColors[i%3]);
    cyl('clay',x-.53,.86,z+.15,.167,.026);
    ring('beer',x-.53,.891,z+.15,.114,.087,.29,-Math.PI/2);
    box('linen',x+.16,.867,z-.24,.17,.015,.12);
  }
  for(const x of [-3.97,3.97])table(x,.48);
  for(const [x,z,yaw] of chairs){
    const s=Math.cos(yaw);
    box('edge',x,.445,z,2.44,.095,.41);
    box('oak',x,.76,z-s*.198,2.41,.20,.08);
    for(const a of [-.99,.99]){
      box('dark',x+a,.23,z,.15,.46,.32);box('dark',x+a,.62,z-s*.205,.10,.38,.105);
    }
    solid(x,z,2.43,.40,.495);
  }
  // Paper lanterns, wiring and warm low-power fixtures in the single room.
  for(const z of [-2.7,2.87]){
    box('iron',0,3.50,z,10.45,.018,.024);
    for(let i=-4;i<=4;i++){
      const x=i*1.18,y=2.85+Math.abs(i)*.075;
      box('iron',x,(3.51+y)/2,z,.012,3.51-y,.012);
      k.oval(i%3===0?'red':'glow',P.x+x,F+y,P.z+z,.162,.22,.162);
      for(const dy of [-.14,0,.14])ring('brass',x,y+dy,z,.145,.145,.048,-Math.PI/2);
      cyl('iron',x,y+.205,z,.075,.031);cyl('dark',x,y-.205,z,.059,.032);
    }
  }
  for(const [x,z] of [[-4.5,-1.45],[4.5,-1.45],[0,-4.76],[0,2.78]]){
    const light=new T.PointLight(0xffc088,x===0?33:22,9.4,2);light.position.set(P.x+x,F+2.77,P.z+z);root.add(light);
  }
  root.add(new T.HemisphereLight(0xd7ddcf,0x9a6644,1.57));
  card(0,2.89,-5.38,4.48,.67,'ZUR LETZTEN EINKEHR','BERCHAUSSCHANK · SEIT DEM LETZTEN REGEN');
  card(-4.45,1.98,-5.437,1.49,.97,'HEUT • WIE FRÜHER','KÜCHE BIS ZUM GLOCKENSCHLAG',['Kellerbier · Zwiebelkäs','Letzte Runde: ausgesetzt'],{paper:'#453529'});
  card(4.62,2.03,-5.437,1.46,.96,'KELLERBUCH','NICHT NACH OBEN MELDEN',['Die Uhr steht seit der Flut.','Der Ausschank nicht.']);
  // Mirrored way out, recessed between timber jambs with an overhead sign.
  for(const x of [-.85,.85])box('oak',x,1.14,4.155,.19,2.23,.20);
  box('oak',0,2.25,4.149,1.89,.153,.20);
  card(0,2.57,4.13,1.58,.37,'ZUM GARTEN','DURCHS WASSER',[],{yaw:Math.PI,paper:'#443529'});
  k.flush(root.name);
  const waterTime={value:0};
  const pane=new T.Mesh(new T.PlaneGeometry(1.52,2.08),new T.ShaderMaterial({uniforms:{clock:waterTime},
    vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      uniform float clock;
      varying vec2 uv0;
      void main(){
        vec2 p=(uv0-.5)*vec2(1.,1.2);
        float rip=pow(.5+.5*cos(length(p+vec2(.14,.24))*46.-clock*1.9+.25*sin(p.x*31.)),16.);
        float fold=sin(uv0.x*23.+sin(uv0.y*7.+clock*.38)*1.9);
        vec3 color=mix(vec3(.022,.050,.050),vec3(.118,.235,.201),smoothstep(0.,.95,uv0.y));
        gl_FragColor=vec4(color+vec3(.053,.097,.078)*rip+fold*.011,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}));
  pane.position.set(P.x,F+1.095,P.z+4.146);pane.rotation.y=Math.PI;root.add(pane);

  const people=[
    ['bergWirt',-.30,-4.10,0,false,0x994538,0xc19758],
    ['bergLeni',3.65,-2.36,-.63,false,0x2c6360,0xc8bc8f],
    ['bergDora',-4.22,1.78,Math.PI,true,0x6e3a50,0xe2b982],
    ['bergFritz',-3.94,-.82,0,true,0x425445,0xc8a377],
    ['bergUdo',5.66,.03,-Math.PI/2,false,0x4c476a,0xc4ad78],
  ];
  const cast=people.map(([id,x,z,yaw,seated,vest,trim],i)=>{
    const rig=createHuman(T,id),a=rig.actor;
    a.position.set(P.x+x,rig.groundedY(F),P.z+z);a.rotation.y=yaw;root.add(a);
    dress(T,rig,mat,vest,trim,i);
    rig.npcInfo.shadow=contactShadow(T,root,P.x+x,F+.011,P.z+z,.74,.66);
    world.circle(P.x+x,P.z+z,.245,()=>rig.alive());
    const aState={rig,a,t:i*1.52+1,speech:0,seated};
    rig.npcInfo.speak=(s=5.7)=>{aState.speech=s;};
    return aState;
  });
  const acc={t:0};const clamp=(x,l,h)=>Math.min(h,Math.max(l,x));
  function animate(dt,p,preview=false){
    acc.t+=dt;if(acc.t<.043)return false;
    const step=Math.min(acc.t,.125);acc.t=0;
    if(!preview)waterTime.value+=step;
    for(const [i,a] of cast.entries()){
      if(preview&&i!==0||!a.rig.controllable())continue;
      a.t+=step;a.speech=Math.max(0,a.speech-step);
      const off=Math.atan2(p.x-a.a.position.x,p.z-a.a.position.z)-a.a.rotation.y,
        glance=a.speech>0?clamp(Math.atan2(Math.sin(off),Math.cos(off)),-.77,.77):0,
        talk=a.speech>0?.28+.28*Math.abs(Math.sin(a.t*16)):0;
      if(a.seated)a.rig.chairPose(a.t,.493,1,glance,talk);
      else a.rig.tavernPose(a.t,i,preview,glance,talk);
    }
    return true;
  }
  animate(.09,bergArrival);
  root.traverse(o=>{o.layers.set(BERG_LAYER);if(o.isMesh)o.castShadow=false;});
  root.visible=false;
  return {root,animate};
}

function dress(T,rig,mat,vest,trim,i){
  const chest=rig.costumeMount('spine_03'),waist=rig.costumeMount('pelvis'),head=rig.costumeMount('head');
  const cloth={...mat,vest:new T.MeshStandardMaterial({map:mat.red.map,color:vest,roughness:1,side:T.DoubleSide}),
    trim:new T.MeshStandardMaterial({map:mat.linen.map,color:trim,roughness:.92,side:T.DoubleSide})};
  const C=carpentry(T,chest,cloth),W=carpentry(T,waist,cloth),H=carpentry(T,head,cloth);
  const {y}=rig.restPoint('spine_03'),fy=y-.27;
  const hip=rig.restPoint('pelvis').y,hy=rig.restPoint('head').y;
  for(let j=0;j<5;j++)if(i!==4)C.cyl('brass',.04,fy+.036+j*.036,.159,.009,.014,Math.PI/2);
  W.box('dark',0,hip+.019,.106,.32,.055,.049);W.box('brass',0,hip+.019,.139,.067,.044,.02);
  if(i===1||i===2){
    W.quad(i===1?'linen':'red',[.154,hip+.022,.166],[-.154,hip+.022,.166],[-.192,hip-.25,.236],[.192,hip-.25,.236]);
    W.box('trim',0,hip-.226,.235,.329,.019,.008);
  }
  if(i===0||i===3||i===4){
    const h=i===0?1.705:i===3?1.699:1.746;
    H.oval(i===4?'vest':'green',0,h,.037,.117,.013,.117);
    H.oval(i===4?'vest':'green',0,h+.028,.028,.089,.047,.088);
    H.ring('trim',0,h+.013,.028,.084,.085,.07,-Math.PI/2);
    H.oval('trim',.071,h+.052,.026,.013,.045,.009);
  }else H.oval('vest',-.079,hy+.014,-.017,.014,.027,.016);
  if(i===4){
    // Compact diatonic button accordion, with folded bellows, pearl rows
    // and two leather slings carried by the character's chest.
    C.box('dark',0,y-.19,.203,.405,.251,.113);
    for(let j=-5;j<=5;j++)C.box('red',j*.019,y-.185,.271,.011,.231,.031);
    for(const a of [-.167,.167]){
      C.box('edge',a,y-.181,.235,.077,.261,.13);
      C.box('iron',a,y-.180,.304,.059,.221,.014);
      for(let j=0;j<5;j++)for(const s of [-1,1])
        C.cyl('clay',a+s*.014,y-.253+.035*j,.314,.006,.01,Math.PI/2);
      C.box('dark',a*.61,y+.04,.134,.027,.37,.025);
    }
  }
  C.flush('Tracht · Mieder oder Weste');W.flush('Tracht · Schürze und Schnalle');H.flush('Tracht · Kopfschmuck');
}
