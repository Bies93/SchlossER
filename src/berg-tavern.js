import {BERG_POOL as P,BERG_LAYER,BERG_FLOOR as F,BERG_HALL as B} from './berg-layout.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';
import {createHuman} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {beerGlass,boardSnack,cask,tankard} from './berg-furnishings.js';

export const bergReturn={x:P.x-.2,z:P.z-2.75};
export const bergArrival={x:P.x,z:P.z+2.05};
const beerColors=['clay','glaze','green','slate'];
export function addBergTavern(T,scene,world){
  const root=new T.Group();root.name='Zur letzten Einkehr · Felsenkeller';scene.add(root);
  const mat=bergMaterials(T),r=3.18,corner=1.94;
  mat.vaultAlt=mat.rock.clone();mat.vaultAlt.color.setHex(0x857861);
  const k=carpentry(T,root,mat);
  const box=(m,x,y,z,...s)=>k.box(m,P.x+x,F+y,P.z+z,...s);
  const cyl=(m,x,y,z,...s)=>k.cyl(m,P.x+x,F+y,P.z+z,...s);
  const ring=(m,x,y,z,...s)=>k.ring(m,P.x+x,F+y,P.z+z,...s);
  const card=(x,y,z,w,h,title,sub,lines=[],opts={})=>storyCard(T,root,{x:P.x+x,y:F+y,z:P.z+z,width:w,height:h,title,sub,lines,...opts});
  const solid=(x,z,w,d,h=0)=>world[h?'platform':'box'](P.x+x-w/2,P.z+z-d/2,P.x+x+w/2,P.z+z+d/2,...(h?[F+h]:[]));
  box('grout',0,-.1,-.675,13,.19,10);
  for(let j=0;j<16;j++)for(let i=0;i<23;i++){
    const left=Math.max(-6.46,-6.46+i*.585-(j%2)*.281),right=Math.min(6.46,-6.46+(i+1)*.585-(j%2)*.281);
    if(right-left<.04)continue;
    const x=(left+right)*.5,z=-5.34+j*.624;
    box((i*7+j*11)%11===0?'rock':(i+j*7)%5===0?'chalk':'stone',x,-.027,z,right-left-.008,.055,.615);
  }
  for(const x of [-1.48,1.48])for(let j=0;j<16;j++){
    box('slate',x,.002,-5.34+j*.624,.058,.009,.598);
    box('chalk',x-.044,.003,-5.34+j*.624,.024,.008,.596);
  }
  for(const s of [-1,1]){
    box('rock',s*6.535,1.5,-.675,.20,3.02,10.05);solid(s*6.49,-.67,.13,10.1);
    box('dark',s*6.405,.43,-.675,.13,.86,9.94);
    box('edge',s*6.37,.89,-.675,.163,.081,9.96);
    box('oak',s*6.32,.93,-.675,.22,.033,9.96);
    box('dark',s*6.34,.118,-.675,.18,.123,9.96);
    box('chalk',s*6.45,1.04,-.675,.097,.13,9.96);
    for(let row=0;row<5;row++)for(let j=0;j<16;j++){
      const L=Math.max(-5.59,-5.61+j*.674-(row%2)*.37),R=Math.min(4.14,-5.61+(j+1)*.674-(row%2)*.37);
      if(R-L>.12)box((row*7+j*31)%8===0?'chalk':(row+j)%5===0?'rock':'stone',s*6.420,1.209+row*.299,(L+R)*.5,.032,.285,R-L-.009);
    }
    for(let j=0;j<24;j++){
      const z=-5.42+j*.414;
      box('oak',s*6.329,.46,z,.037,.70,.391);
      box('edge',s*6.301,.47,z,.018,.578,.018);
      for(const edge of [-.163,.163])box('edge',s*6.302,.46,z+edge,.019,.567,.022);
      for(const y of [.188,.726])box('edge',s*6.302,y,z,.017,.023,.322);
      if(j%4===2)box('brass',s*6.282,.430,z,.02,.050,.047);
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
    for(let j=0;j<17;j++){
      const z=-5.72+j*.593,Z=Math.min(4.37,z+.593);
      k.quad((i*19+j*31+i*j*5)%19<5?'vaultAlt':'rock',arch(h,Z),arch(l,Z),arch(l,z),arch(h,z),1.45,i*.18+j*.42);
      const seam=(x,v)=>{const a=arch(x,v);a[1]-=.003;return a;};
      k.quad('grout',seam(h,z+.010),seam(l,z+.010),seam(l,z+.004),seam(h,z+.004),.86);
    }
    for(const z of [-4.2,-.46,3.23]){
      const low=(x,v)=>{const pt=arch(x,v);pt[1]-=.12;return pt;};
      k.quad(i%5===0?'chalk':'stone',low(h-.004,z+.12),low(l+.004,z+.12),low(l+.004,z-.12),low(h-.004,z-.12),.76,i*.33);
      k.quad('stone',arch(l,z+.12),arch(h,z+.12),low(h,z+.12),low(l,z+.12));
      k.quad('stone',low(l,z-.12),low(h,z-.12),arch(h,z-.12),arch(l,z-.12));
    }
  }
  // Counter, stout feet, carved panel edges and a real aisle to the return.
  box('dark',0,.46,-3.41,5.69,.91,.64);
  box('edge',0,.97,-3.41,5.87,.126,.84);box('oak',0,1.048,-3.41,5.90,.058,.89);
  box('dark',0,.884,-3.41,5.80,.050,.714);
  box('edge',0,1.046,-2.956,5.82,.054,.026);
  box('brass',0,.916,-3.002,5.68,.015,.018);
  box('dark',0,.113,-3.036,5.66,.068,.066);
  k.tube('brass',[[P.x-2.66,F+.184,P.z-2.87],[P.x,F+.184,P.z-2.87],[P.x+2.66,F+.184,P.z-2.87]],.019,9,8);
  for(const x of [-2.54,-1.28,0,1.28,2.54]){
    box('brass',x,.169,-2.951,.044,.053,.196);box('iron',x,.17,-3.035,.097,.098,.038);
  }
  for(let i=-3;i<=3;i++){
    const x=i*.77;box('oak',x,.49,-3.078,.731,.65,.043);
    box('edge',x,.80,-3.042,.716,.033,.029);
    for(const xx of [x-.34,x+.34])box('edge',xx,.48,-3.041,.028,.645,.026);
    box('dark',x,.50,-3.038,.549,.44,.026);
    box('oak',x,.494,-3.016,.499,.393,.019);
    box('edge',x,.304,-3.001,.478,.018,.012);
    box('brass',x,.48,-3.020,.05,.05,.024);
  }
  solid(0,-3.41,5.91,.89,1.077);
  for(const x of [-2,0,2]){
    cyl('copper',x,1.104,-3.55,.108,.057);
    cyl('brass',x,1.196,-3.55,.034,.16);ring('brass',x,1.288,-3.49,.069,.064,.23);
    k.tube('copper',[[P.x+x,F+1.236,P.z-3.548],[P.x+x,F+1.242,P.z-3.437],[P.x+x,F+1.186,P.z-3.394]],.020,11);
    k.oval('dark',P.x+x,F+1.37,P.z-3.54,.028,.077,.039);
    box('iron',x,1.083,-3.33,.273,.018,.169);
    for(let i=0;i<8;i++)box('glaze',x-.099+i*.028,1.096,-3.33,.008,.006,.133);
  }
  const stein=(x,y,z,m,i)=>tankard(k,P.x+x,F+y,P.z+z,m,i);
  const glass=(x,y,z,wine)=>beerGlass(k,P.x+x,F+y,P.z+z,wine);
  for(const [i,x] of [-2.73,-1.38,-.91,.67,1.44,2.62].entries()){
    const z=i%2?-3.405:-3.162;
    box('rind',x,1.083,z,.149,.008,.137);
    if(i%3===2)stein(x,1.088,z,beerColors[i%4],i%4);else glass(x,1.087,z,i===3);
  }
  box('dark',2.51,1.083,-3.565,.34,.019,.225);
  box('linen',2.48,1.099,-3.546,.25,.017,.171);
  for(let i=0;i<6;i++)box('rind',2.474,1.110,-3.612+i*.020,.183-i%2*.018,.002,.003);
  k.tube('oak',[[P.x+2.59,F+1.122,P.z-3.60],[P.x+2.47,F+1.113,P.z-3.47]],.006,3);
  for(let j=0;j<3;j++){
    const y=1.16+j*.42;box('oak',0,y,-5.35,5.68,.073,.48);
    box('edge',0,y-.009,-5.095,5.72,.047,.035);
    for(const x of [-2.52,-.82,.82,2.52]){
      box('iron',x,y-.164,-5.49,.045,.295,.09);
      k.tube('iron',[[P.x+x,F+y-.29,P.z-5.49],[P.x+x,F+y-.071,P.z-5.18]],.019,3);
    }
    for(let i=0;i<17;i++)if((i*7+j*3)%5!==1){
      const x=(i-8)*.298,z=-5.28+Math.sin(i*7+j)*.055;
      if((i+2*j)%7===2)glass(x,y+.039,z,i%2===0);
      else stein(x,y+.039,z,beerColors[(i+j)%4],(i+j*2)%4);
    }
  }
  // Old beer casks with hoop profiles and stained platforms.
  for(const s of [-1,1])for(const [i,z] of [-4.9,-3.97,-3.04].entries()){
    const x=s*(4.48+i%2*.3),y=.55+i%2*.024,r=.398+(i%2)*.033,d=.752+i%3*.040;
    cask(k,P.x+x,F+y,P.z+z,r,d,(i+(s<0?1:0))%3);
    for(const dx of [-.267,.267]){
      box('dark',x+dx,.081,z,.173,.163,.714);
      box('edge',x+dx,.159,z,.153,.055,.706);
      box('iron',x+dx,.097,z+.364,.144,.082,.025);
    }
    solid(x,z,.88,.82,.95);
  }
  const chairs=[[-3.97,1.78,Math.PI],[-3.97,-.82,0],[3.97,1.78,Math.PI],[3.97,-.82,0]];
  function table(x,z){
    box('dark',x,.636,z,2.29,.23,1.13);box('edge',x,.765,z,2.45,.092,1.19);
    for(let i=0;i<5;i++)box('oak',x,.821,z+(i-2)*.232,2.42,.032,.229);
    for(const a of [-.985,.985])for(const b of [-.415,.415]){
      k.profile('oak',P.x+x+a,F,P.z+z+b,[[.075,0],[.075,.07],[.057,.09],[.052,.18],[.072,.25],
        [.060,.29],[.049,.37],[.062,.48],[.078,.56],[.077,.681]],{segments:13});
      box('dark',x+a,.034,z+b,.160,.068,.153);
      for(const y of [.076,.570])box('edge',x+a,y,z+b,.154,.028,.146);
    }
    box('edge',x,.253,z,2.10,.072,.078);
    for(const b of [-.563,.563]){
      box('edge',x,.695,z+b,2.18,.021,.025);
      for(const a of [-1.018,1.018])box('brass',x+a,.648,z+b,.043,.035,.015);
    }
    box('red',x,.845,z,.70,.016,1.151);
    for(const a of [-.32,.32])box('linen',x+a,.855,z,.018,.008,1.12);
    solid(x,z,2.45,1.19,.837);
    for(const [i,a] of [-.79,-.24,.61,.99].entries()){
      const v=z+(i%2?.345:-.28);box('rind',x+a,.846,v,.135,.008,.139);
      if(i===2)glass(x+a,.852,v,x>0);else stein(x+a,.853,v,beerColors[(i+(x>0?2:0))%4],i);
    }
    boardSnack(k,P.x+x-.55,F+.844,P.z+z+.090,x>0);
    box('linen',x+.126,.864,z-.230,.174,.017,.121);
    box('rind',x+.125,.875,z-.246,.152,.005,.006);
    for(let i=0;i<5;i++)box('rind',x+.120,.875,z-.216+i*.008,.103-i%2*.012,.003,.0027);
    for(const u of [-.337,.337])for(let i=0;i<32;i++)box('red',x+u,.859,z-.527+i*.033,.014,.003,.013);
    for(const v of [-.569,.569])for(let i=0;i<28;i++)box('linen',x-.324+i*.024,.843,z+v,.006,.008,.031+i%4*.003);
  }
  for(const x of [-3.97,3.97])table(x,.48);
  for(const [x,z,yaw] of chairs){
    const s=Math.cos(yaw);
    box('edge',x,.445,z,2.44,.095,.41);
    box('oak',x,.76,z-s*.198,2.41,.20,.08);
    box('edge',x,.860,z-s*.198,2.46,.031,.113);
    box('dark',x,.631,z-s*.201,2.37,.037,.085);
    box('oak',x,.150,z,2.18,.067,.085);
    box('edge',x,.501,z+s*.160,2.32,.017,.075);
    for(const a of [-.99,.99]){
      box('dark',x+a,.23,z,.15,.46,.32);box('dark',x+a,.62,z-s*.205,.10,.38,.105);
      box('edge',x+a,.705,z-s*.139,.14,.155,.035);
      box('brass',x+a,.750,z-s*.118,.040,.040,.020);
      box('edge',x+a,.054,z,.192,.097,.339);
    }
    solid(x,z,2.43,.40,.495);
  }
  // Paper lanterns, wiring and warm low-power fixtures in the single room.
  for(const z of [-2.7,2.87]){
    box('iron',0,3.50,z,10.45,.018,.024);
    for(let i=-4;i<=4;i++){
      const x=i*1.18,y=2.85+Math.abs(i)*.075;
      box('iron',x,(3.51+y)/2,z,.012,3.51-y,.012);
      k.oval(i%3===0?'scarlet':'glow',P.x+x,F+y,P.z+z,.162,.22,.162);
      for(let j=-4;j<=4;j++){
        const dy=j*.043,rr=.162*Math.sqrt(1-(dy/.22)**2);
        const t=j%4===0?.0075:.0037;
        k.profile(j%4===0?'brass':i%3===0?'copper':'rind',P.x+x,F+y+dy,P.z+z,
          [[rr,-t],[rr+t*.63,-t*.42],[rr+t*.71,t*.44],[rr,t]],{segments:18});
      }
      cyl('iron',x,y+.205,z,.075,.031);cyl('copper',x,y+.229,z,.055,.034);cyl('dark',x,y-.205,z,.059,.032);
      cyl('brass',x,y-.242,z,.017,.059);
    }
  }
  for(const [x,z] of [[-4.5,-1.45],[4.5,-1.45],[0,-4.76],[0,2.78]]){
    const light=new T.PointLight(0xffc088,x===0?33:22,9.4,2);light.position.set(P.x+x,F+2.77,P.z+z);root.add(light);
  }
  root.add(new T.HemisphereLight(0xd7ddcf,0x9a6644,1.57));
  card(0,2.89,-5.38,4.48,.67,'ZUR LETZTEN EINKEHR','BERCHAUSSCHANK · SEIT DEM LETZTEN REGEN');
  card(-4.45,1.98,-5.437,1.49,.97,'HEUT • WIE FRÜHER','KÜCHE BIS ZUM GLOCKENSCHLAG',['Kellerbier · Zwiebelkäs','Letzte Runde: ausgesetzt'],{paper:'#453529'});
  card(4.62,2.03,-5.437,1.46,.96,'KELLERBUCH','NICHT NACH OBEN MELDEN',['Die Uhr steht seit der Flut.','Der Ausschank nicht.']);
  for(const [s,z,title,sub] of [[-1,1.16,'STAMMTISCH','DER PLATZ BLEIBT FREI'],[-1,-1.88,'SEIT ’70','DAS LETZTE FASS'],[1,-.65,'BERCH-MUSI','KEINE WUNSCHLIEDER'],[1,2.49,'KELLERORDNUNG','1. KEINE LETZTE RUNDE']]){
    box('dark',s*6.388,1.944,z,.059,.707,1.111);
    box('edge',s*6.350,1.944,z,.032,.653,1.052);
    card(s*6.331,1.944,z,1.007,.599,title,sub,[],{yaw:-s*Math.PI/2,paper:s>0?'#3f392a':'#473129'});
    for(const v of [-.515,.515])for(const y of [1.65,2.235])box('brass',s*6.324,y,z+v,.025,.035,.035);
  }
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
    ['bergFritz',-3.94,-.82,0,true,0xa1453d,0xc8a377],
    ['bergUdo',5.66,.03,-Math.PI/2,false,0x4c476a,0xc4ad78],
  ];
  const cast=people.map(([id,x,z,yaw,seated,vest,trim],i)=>{
    const rig=createHuman(T,id),a=rig.actor;
    a.position.set(P.x+x,rig.groundedY(F),P.z+z);a.rotation.y=yaw;root.add(a);
    const bellows=dress(T,rig,mat,vest,trim,i);
    rig.npcInfo.shadow=contactShadow(T,root,P.x+x,F+.011,P.z+z,.74,.66);
    world.circle(P.x+x,P.z+z,.245,()=>rig.alive());
    let prop,handR,handL;
    if(i===0||i===1||i===3){
      prop=new T.Group();prop.userData.noSceneQuery=true;root.add(prop);
      prop.name=i===0?'Wischtuch':i===1?'Serviertablett':'Bons’ Maß';
      const v=carpentry(T,prop,mat);
      if(i===0){
        v.box('linen',0,-.014,0,.133,.025,.090);v.box('rind',-.029,-.001,0,.009,.004,.082);
      }else if(i===1){
        v.profile('edge',0,0,0,[[0,0],[.230,0],[.238,.010],[.221,.023],[.212,.016],[0,.016]],{segments:26});
        tankard(v,.071,.022,.020,'clay',1);beerGlass(v,-.081,.022,-.029);v.box('linen',.012,.027,.077,.094,.007,.069);
        handL=rig.grip('l').socket;
      }else tankard(v,0,0,0,'green',0);
      v.flush(prop.name);handR=rig.grip('r').socket;
    }
    const aState={rig,a,t:i*1.52+1,speech:0,seated,bellows,prop,handR,handL,weepAt:-Infinity};
    rig.npcInfo.speak=(s=5.7)=>{aState.speech=s;};
    if(i===3)rig.npcInfo.react=kind=>{if(kind==='sob'){aState.weepAt=performance.now();aState.speech=0;}};
    return aState;
  });
  const acc={t:0},A=new T.Vector3(),B0=new T.Vector3();
  const clamp=(x,l,h)=>Math.min(h,Math.max(l,x)),ease=k=>{const t=clamp(k,0,1);return t*t*(3-2*t);};
  function animate(dt,p,preview=false,beat=null){
    acc.t+=dt;if(acc.t<.043)return false;
    const step=Math.min(acc.t,.125);acc.t=0;
    if(!preview)waterTime.value+=step;
    for(const [i,a] of cast.entries()){
      if(preview&&i!==0)continue;
      if(a.prop)a.prop.visible=a.rig.alive()&&!(preview&&i===0);
      if(!a.rig.controllable())continue;
      a.t+=step;a.speech=Math.max(0,a.speech-step);
      const crying=(performance.now()-a.weepAt)*.001,
        sob=i===3?ease(crying/.49)*ease((5.78-crying)/.98):0,
        off=Math.atan2(p.x-a.a.position.x,p.z-a.a.position.z)-a.a.rotation.y,
        glance=a.speech>0?clamp(Math.atan2(Math.sin(off),Math.cos(off)),-.77,.77):0,
        talk=a.speech>0?.28+.28*Math.abs(Math.sin(a.t*16)):0,silence=1-Math.min(1,a.speech),
        s=a.t%8.3,w=a.t%11.8,
        sip=(i===3&&crying<8.4?ease((crying-5.98)/.77)*ease((8.35-crying)/.66):
          ease((s-2.75)/.66)*ease((4.65-s)/.61))*(1-sob)*silence,
        wipe=ease((w-2.1)/.62)*ease((8.6-w)/.74)*silence,
        t=beat??a.t,push=(.51+.49*Math.sin(t*Math.PI/1.35))*ease(silence+.12);
      a.rig.tavernPose(a.t,i,{waving:preview,glance,talk,sip,sob,wipe,push,beat:t});
      a.bellows?.(push);
      if(a.prop?.visible){
        a.handR.getWorldPosition(A);
        if(a.handL)A.lerp(a.handL.getWorldPosition(B0),.5);
        a.prop.position.copy(A);
        a.prop.rotation.set(0,a.a.rotation.y,0);
        if(i===0){
          a.prop.position.x+=.022;
          a.prop.position.y=wipe>.91?F+1.104:A.y-.010;
          a.prop.position.z+=.033;
        }else if(i===1){
          a.prop.position.y+=.021;a.prop.rotation.z=.029*Math.sin(a.t*1.18);
        }else{
          a.prop.position.x+=.068-sip*.025;a.prop.position.y-=.096-sip*.044;
          a.prop.rotation.x=-.72*sip;a.prop.rotation.z=.16*sip;
        }
      }
    }
    return true;
  }
  animate(.09,bergArrival);
  root.traverse(o=>{o.layers.set(BERG_LAYER);if(o.isMesh)o.castShadow=false;});
  root.visible=false;
  return {root,animate,musicianAlive:()=>cast[4].rig.alive()};
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
    const drape=i===2?.308:.234;
    for(let j=0;j<16;j++){
      const t=j/16,next=(j+1)/16,A=t*2-1,B=next*2-1,p=j%2?.009:0,q=j%2?0:.009;
      const u=[A*.154,hip+.022,.166+p*.20],v=[B*.154,hip+.022,.166+q*.20],
        l=[A*.191,hip-.25,drape+p- A*A*.032],r=[B*.191,hip-.25,drape+q-B*B*.032];
      W.quad(i===1?'linen':'red',v,u,l,r,.34,j*.26);
      W.quad('trim',[r[0],r[1]+.021,r[2]+.004],[l[0],l[1]+.021,l[2]+.004],[l[0],l[1]+.006,l[2]+.004],[r[0],r[1]+.006,r[2]+.004],.13);
    }
    W.box('trim',0,hip+.015,.177,.319,.028,.025);
  }
  if(i===0||i===4){
    const h=i===0?1.705:1.746;
    H.oval(i===4?'vest':'green',0,h,.037,.117,.013,.117);
    H.oval(i===4?'vest':'green',0,h+.028,.028,.089,.047,.088);
    H.ring('trim',0,h+.013,.028,.084,.085,.07,-Math.PI/2);
    H.tube('trim',[[.07,h+.024,.027],[.088,h+.070,.008],[.066,h+.111,-.018]],.0041,7);
    for(let j=0;j<5;j++)H.oval('trim',.083-Math.max(0,j-1)*.004,h+.054+j*.012,.019-j*.009,.011,.014,.006);
  }else if(i===1||i===2){
    H.oval('vest',-.079,hy+.014,-.017,.014,.027,.016);
    H.oval('trim',-.084,hy+.005,-.022,.008,.016,.010);
  }
  let move;
  if(i===4){
    const bellows=new T.Group(),left=new T.Group(),right=new T.Group();
    chest.add(bellows,left,right);
    const A=carpentry(T,bellows,cloth);
    A.box('dark',0,0,-.025,.246,.246,.124);
    for(let j=-6;j<=6;j++){
      A.box('red',j*.018,0,.045,.009,.232,.037);
      A.box('brass',j*.018,.111,.054,.010,.012,.010);
      A.box('brass',j*.018,-.112,.054,.010,.012,.010);
    }
    A.flush('Akkordeon · Balg');
    for(const [s,g] of [[-1,right],[1,left]]){
      const K=carpentry(T,g,cloth);
      K.box('dark',0,0,-.018,.111,.262,.139);K.box('edge',0,0,.039,.105,.248,.045);
      K.box('iron',0,0,.068,.076,.199,.024);
      for(const u of [-.044,.044])for(const a of [-.110,.110])K.box('brass',u,a,.069,.021,.024,.028);
      for(let j=0;j<5;j++)for(const d of [-1,1])
        K.cyl('clay',d*.015+(j%2)*.005,-.073+.035*j,.091,.0065,.010,Math.PI/2);
      for(let j=0;j<5;j++)K.box('brass',s*.049,-.084+j*.040,.074,.011,.005,.0017);
      K.flush('Akkordeon · Knöpfe und Beschläge');
      C.box('leather',s*.101,y+.042,.152,.043,.379,.022);
      C.box('brass',s*.101,y+.145,.167,.045,.035,.014);
    }
    move=p=>{
      const l=.169+p*.021,r=-.167-p*.070;
      left.position.set(l,y-.185,.239);right.position.set(r,y-.185,.239);
      bellows.position.set((l+r)*.5,y-.185,.239);bellows.scale.x=(l-r-.09)/.245;
    };
    move(.4);
  }
  C.flush('Tracht · Mieder oder Weste');W.flush('Tracht · Schürze und Schnalle');H.flush('Tracht · Kopfschmuck');
  return move;
}
