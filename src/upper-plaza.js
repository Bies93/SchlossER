import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {architectureKit} from './architecture-kit.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {plazaAtlas,PLAZA_ROOMS} from './upper-plaza-art.js';

const pi=Math.PI,front=1.73,xyz=(x,y,z)=>[x,y,z];
const crew={
  1:{id:'plazaRaban',u:-2.38,d:4.11,yaw:0,mode:'desk'},
  2:{id:'plazaVroni',u:-1.96,d:4.21,yaw:0,mode:'desk'},
  3:{id:'plazaEberwin',u:1.72,d:6.02,yaw:pi-.12,mode:'prayer'},
  4:{id:'plazaIsolde',u:-1.88,d:3.07,yaw:pi,mode:'sit'},
  7:{id:'plazaAnton',u:.45,d:3.65,yaw:0,mode:'patrol'}
};

export function dressUpperPlaza(T,parent,world,F,bays){
  const grain=sharedSet(T,'fineOak',256),cloth=sharedSet(T,'canvas',256),paint=sharedSet(T,'enamel',256),
    stone=sharedSet(T,'stairStone',256),metal=sharedSet(T,'cutMetal',256);
  const mat=(color,roughness,surface={},metalness=0,n=.59)=>new T.MeshStandardMaterial({
    color,roughness,metalness,...surface,normalScale:new T.Vector2(n,n)
  });
  const glow=(color,weight)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:weight,roughness:.59});
  const m={
    surface:mat(0xb8b0a0,.84,stone),slate:mat(0x888e89,.88,stone),ceramic:mat(0xc9c4ad,.63,stone,0,.22),
    grout:mat(0x595c53,.93,stone),iron:mat(0x373b3b,.77,paint,.37),steel:mat(0x86918a,.54,metal,.62),
    red:mat(0x6d423b,.76,paint,.24),green:mat(0x647468,.76,paint,.27),blue:mat(0x596b71,.74,paint,.29),
    bronze:mat(0x927448,.57,metal,.65),wood:mat(0x8b6b50,.82,grain),darkWood:mat(0x63483c,.84,grain),
    velvet:mat(0x79494f,.96,cloth),cloth:mat(0x90968a,.97,cloth),leather:mat(0x686054,.95,cloth),
    paper:mat(0xc5b89c,.94,cloth),ink:mat(0x544641,.93,cloth),bone:mat(0xcac5ad,.86,stone),
    tarnish:mat(0x72433b,.92,stone),dirt:mat(0x4b3f39,.95,stone),
    smoked:mat(0x48545a,.31,{},.48),milk:mat(0x9ca8a4,.54,{},.08),
    jade:glow(0x8faf94,.49),mercury:glow(0xc8d8cf,.54),filament:glow(0xebc4a1,.59),signal:glow(0xa95747,.67),
    print:plazaAtlas(T)
  };
  const profiles=pts=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),18);
  const g={
    block:new RoundedBoxGeometry(1,1,1,2,.075),rod:new T.CylinderGeometry(1,1,1,14),
    bowl:profiles([[0,0],[.54,0],[.58,.06],[.82,.26],[1,.83],[1,1],[.91,1],[.91,.83],[.69,.34],[.44,.13],[0,.12]]),
    ball:new T.SphereGeometry(1,14,10),ring:new T.TorusGeometry(1,.083,8,26),sheet:new T.PlaneGeometry(1,1)
  };
  const matrix=new T.Matrix4(),a=new T.Vector3(),dir=new T.Vector3(),s=new T.Vector3(),q=new T.Quaternion(),
    e=new T.Euler(),up=new T.Vector3(0,1,0),rng=randomSource(81577),rooms=[],cast=[];
  for(let i=0;i<PLAZA_ROOMS.length;i++){
    const [l,r]=[bays[i],bays[i+1]],cx=(l+r)*.5,w=(r-l)*.5,info=PLAZA_ROOMS[i],door=.37;
    const room=new T.Group();room.name='Morgenform · '+info.code+' · '+info.title;parent.add(room);
    const k=architectureKit(T,room,m);rooms.push({room,l,r});
    const pos=(u,y,d)=>[cx+u,F+y,front+d];
    const rear=u=>Math.abs(cx+u)<6.47?9.89:7.21;
    function box(mat,u,y,d,w,h,L){
      const [x,t,z]=pos(u,y,d);
      k.box(mat,xyz,x-w*.5,x+w*.5,t-h*.5,t+h*.5,z-L*.5,z+L*.5);
    }
    function shape(mat,key,u,y,d,x,h,z,rx=0,ry=0,rz=0){
      k.geometry(mat,g[key],matrix.compose(a.fromArray(pos(u,y,d)),q.setFromEuler(e.set(rx,ry,rz)),s.set(x,h,z)));
    }
    function pipe(mat,A,B,r){
      a.fromArray(pos(...A));dir.fromArray(pos(...B)).sub(a);const n=dir.length();if(n<.002)return;
      k.geometry(mat,g.rod,matrix.compose(a.addScaledVector(dir,.5),q.setFromUnitVectors(up,dir.normalize()),s.set(r,n,r)));
    }
    function hit(u,d,W,L){
      const x=cx+u,z=front+d;
      world.box(x-W*.5,z-L*.5,x+W*.5,z+L*.5);
    }
    function support(u,d,W,L,h){
      const x=cx+u,z=front+d;
      world.platform(x-W*.5,z-L*.5,x+W*.5,z+L*.5,F+h);
    }
    const screw=(u,y,d,r=.014)=>shape('bronze','rod',u,y,d,r,.013,r,pi*.5);
    function print(tile,u,y,d,W,H,ry=pi,rx=0,rz=0){
      const mesh=g.sheet.clone(),uv=mesh.attributes.uv,
        U=(tile%4)*.25,V=1-(Math.floor(tile/4)+1)*.25;
      for(let j=0;j<uv.count;j++)uv.setXY(j,U+.003+uv.getX(j)*.244,V+.003+uv.getY(j)*.244);
      k.geometry('print',mesh,matrix.compose(a.fromArray(pos(u,y,d)),q.setFromEuler(e.set(rx,ry,rz)),s.set(W,H,1)));
      mesh.dispose();
    }
    function framed(tile,u,y,d,W,H,ry=pi,bezel='darkWood'){
      const dx=Math.sin(ry)*.037,dz=Math.cos(ry)*.037;
      shape(bezel,'block',u-dx,y,d-dz,W+.12,H+.10,.084,0,ry);
      shape('iron','block',u-dx*.27,y,d-dz*.27,W+.026,H+.028,.016,0,ry);
      print(tile,u,y,d,W,H,ry);
    }
    function label(u,y,d,W=.39,H=.15){print(i+8,u,y,d,W,H);}
    function table(u,d,W,L,H=.947,top='green'){
      shape('iron','block',u,H-.112,d,W-.032,.112,L-.047);
      shape(top,'block',u,H-.021,d,W,.044,L);
      for(const sg of [-1,1])for(const sg2 of [-1,1]){
        const x=u+sg*(W*.5-.081),z=d+sg2*(L*.5-.077);
        shape('steel','block',x,H*.457,z,.067,H-.111,.065);
        shape('iron','block',x,.047,z,.106,.058,.104);
      }
      shape('iron','block',u,.231,d+L*.27,W*.92,.047,.052);support(u,d,W,L,H);
    }
    function seat(u,d,wide=.49,mat='leather',back=true){
      shape('wood','block',u,.426,d,wide+.024,.073,.427);
      shape(mat,'block',u,.480,d,wide-.012,.092,.409);
      for(const side of [-1,1])for(const v of [-1,1]){
        pipe('iron',[u+side*wide*.402,.032,d+v*.165],[u+side*wide*.404,.411,d+v*.165],.022);
      }
      if(back){
        for(const x of [u-wide*.44,u+wide*.44])pipe('darkWood',[x,.424,d+.172],[x,.918,d+.229],.023);
        shape(mat,'block',u,.782,d+.222,wide-.031,.282,.082);
        for(const x of [u-wide*.36,u+wide*.36])screw(x,.781,d+.170,.010);
        hit(u,d+.236,wide,.066);
      }
      support(u,d-.018,wide,.392,.526);
    }
    function cabinet(u,d,W=.77,H=1.64,L=.55,color='green',n=4){
      shape(color,'block',u,H*.509,d,W,H,L);
      shape('iron','block',u,.073,d,W+.024,.115,L+.021);
      for(let j=0;j<n;j++){
        const y=.163+(H-.206)*(j+.48)/n,h=(H-.235)/n;
        shape(j%2?'steel':color,'block',u,y,d-L*.512,W*.89,h,.026);
        shape('iron','block',u,y+.020,d-L*.554,.207,.039,.042);
        for(const s of [-1,1])screw(u+s*W*.342,y+h*.28,d-L*.532,.010);
        if(j%2===0)label(u,y-h*.21,d-L*.543,.214,.082);
      }
      hit(u,d,W,L);
    }
    function packet(u,y,d,W=.27,L=.35,ry=.07){
      shape('wood','block',u,y+.014,d,W,.023,L,0,ry);
      shape('paper','block',u+.006,y+.026,d,W*.965,.024,L*.969,0,ry);
      print(i+8,u+.009,y+.039,d,W*.88,L*.91,ry,-pi*.5);
    }
    function caseBox(u,y,d,W=.72,L=.53,clr='green'){
      const H=W*.47;
      shape(clr,'block',u,y+H*.50,d,W,H,L);
      shape('iron','block',u,y+H*.96,d,W+.027,.052,L+.022);
      for(const t of [-1,1]){
        box('steel',u+t*W*.38,y+H*.60,d-L*.52,.036,H*.70,.025);
        box('bronze',u+t*W*.385,y+H*.79,d-L*.552,.063,.058,.019);
      }
      label(u,y+H*.44,d-L*.548,W*.54,H*.45);
    }
    function recorder(u,y,d,W=.63){
      shape('green','block',u,y+.142,d,W,.279,.325);
      shape('steel','block',u,y+.161,d-.166,W-.056,.219,.032);
      shape('iron','block',u,y+.115,d-.188,W*.86,.063,.014);
      for(const t of [-1,1]){
        const x=u+t*W*.261;
        shape('iron','rod',x,y+.196,d-.188,W*.137,.028,W*.137,pi/2);
        shape('bronze','ring',x,y+.196,d-.208,W*.104,W*.104,.030);
        screw(x,y+.196,d-.223,.026);
      }
      for(let i=0;i<5;i++)box(i%3?'jade':'signal',u+(i-2)*W*.142,y+.114,d-.202,.035,.017,.021);
    }
    function bulb(u,y,d,key='filament'){
      pipe('steel',[u,y+.49,d],[u,y+.035,d],.014);
      shape('iron','rod',u,y,d,.178,.105,.178);
      shape(key,'rod',u,y-.065,d,.132,.057,.132);
      for(const t of [-1,1])pipe('bronze',[u+t*.141,y-.02,d],[u+t*.115,y-.121,d],.012);
    }
    function led(u,y,d,which='jade'){
      shape('iron','block',u,y,d,.097,.083,.042);
      shape(which,'ball',u,y,d-.027,.027,.017,.012);
    }
    function candle(u,y,d,h=.13){
      shape('bronze','rod',u,y+.020,d,.048,.037,.047);
      shape('bone','rod',u,y+.033+h/2,d,.029,h,.029);
      shape('filament','ball',u,y+h+.046,d,.012,.027,.012);
      for(const t of [-1,1])shape('bone','ball',u+t*.024,y+.059,d-.008,.009,.024+(t>0?.008:0),.010);
    }
    function stain(u,d,W,L,seed){
      const center=pos(u,.038+seed*.00009,d),count=17;
      const knots=Array.from({length:count},(_,j)=>{
        const f=j/count*2*pi,v=.63+rng()*.38;
        return pos(u+Math.cos(f)*W*v,.038+seed*.00009,d+Math.sin(f)*L*v);
      });
      for(let j=0;j<count;j++)k.triangle(seed%3?'tarnish':'dirt',center,knots[(j+1)%count],knots[j],[.52,.53,0,0,1,1]);
      for(let n=0;n<4;n++){
        const p=u+(rng()-.45)*W*2.6,D=d+(rng()-.5)*L*2.3,r=.014+rng()*.033;
        shape('tarnish','rod',p,.040+seed*.00009,D,r,.0017,r*.73);
      }
    }
    function rearPlaque(tile,u,y,W,H){
      framed(tile,u,y,rear(u)-.154,W,H);
    }

    // Gallery-side plaques face inward to the central corridor. Matching
    // conduits run along the walls, never through a portal.
    framed(i+8,door+1.58,2.05,-.205,1.02,.36);
    for(const sg of [-1,1]){
      const x=sg*(w-.185);
      box(i===3?'darkWood':'green',x,.232,3.64,.112,.343,6.75);
      pipe('iron',[x,2.85,.78],[x,2.85,6.84],.033);
      pipe('bronze',[x,2.76,1.07],[x,2.76,6.83],.018);
      for(const D of [1.43,3.02,4.56,6.27]){
        box('steel',x,2.81,D,.087,.174,.061);
        screw(x,2.89,D-.050,.011);
      }
    }
    for(const [j,d] of [2.43,5.76].entries())bulb(j%2?.49:-.53,3.23,d,i===1||i===6?'mercury':i===3?'signal':'filament');
    const leftU=i===4?-2.15:-1.5,rightU=i===3?1.61:1.72;
    rearPlaque(i,leftU,2.35,1.63,1.50);
    rearPlaque(i+8,rightU,2.29,1.02,1.16);
    if(i===1||i===4||i===6){
      box('grout',0,.017,3.60,2*w-.24,.028,6.75);
      for(let y=0;y<12;y++)for(let x=-w+.14,col=0;x<w-.17;x+=.49,col++){
        const R=Math.min(w-.13,x+.484);
        box((col+y*2)%7===2?'slate':(col+y)%3===1?'ceramic':'surface',(x+R)/2,.031,.25+y*.569,R-x-.006,.014,.559);
      }
    }

    if(i===0){
      for(const [x,d] of [[-2.74,2.02],[-2.74,3.11],[-2.74,4.20],[2.66,4.93],[2.57,6.48]])cabinet(x,d,.82,1.90,.53,d<4?'green':'blue',6);
      table(.26,4.22,2.19,1.07,1.01,'darkWood');
      shape('iron','block',.24,1.024,4.20,1.94,.021,.81);
      for(const [j,x] of [-.60,-.16,.30,.78].entries()){
        packet(x,1.039,4.12,.297,.38,j*.10-.12);
        if(j%2)shape('bronze','ring',x,1.061,4.28,.044,.043,.046,pi/2);
        else shape('leather','block',x+.041,1.072,4.19,.129,.053,.091);
      }
      tubeKeys(.44,1.071,4.44);
      caseBox(2.08,0,2.26,.88,.64,'red');hit(2.08,2.26,.91,.66);
      shape('wood','block',1.85,.433,2.38,.27,.158,.25);
      rearPlaque(8,-.03,1.53,1.02,.57);
    }else if(i===1){
      // An abandoned, non-interactive set. The contrast between the tape
      // and its approved transcript tells what the room was used for.
      table(-2.38,4.62,1.63,.74,.966,'blue');recorder(-2.61,.979,4.67,.74);
      packet(-1.97,.979,4.61,.32,.41,-.09);
      box('iron',1.27,1.63,5.82,2.31,2.03,.092);
      shape('steel','block',1.27,1.92,5.754,2.12,1.01,.070);
      shape('smoked','block',1.27,1.92,5.704,1.91,.81,.031);
      for(const x of [.37,.89,1.42,1.95])shape('blue','block',x,1.93,5.687,.093,.73,.010,0,0,-.24);
      hit(1.27,5.81,2.33,.15);
      seat(.42,4.59,.63,'leather',true);
      for(const x of [.065,.77]){
        shape('steel','block',x,.685,4.50,.118,.058,.267);
        pipe('iron',[x,.662,4.66],[x,.471,4.65],.038);
      }
      bulb(.42,2.64,4.35,'mercury');
      for(const [j,d] of [4.20,4.65,5.13].entries())stain(.27+(j%2)*.43,d,.13+j*.052,.17,j+1);
      table(2.6,3.58,.63,.58,.91,'green');shape('steel','bowl',2.54,.93,3.61,.155,.091,.119);
      packet(1.38,.044,3.90,.22,.285,.39);
    }else if(i===2){
      for(const [j,x] of [-2.89,-1.98,1.62,2.56].entries()){
        cabinet(x,6.37,.82,2.12,.65,j%2?'red':'green',7);
        shape('iron','block',x,2.176,6.36,.81,.087,.614);
      }
      table(-1.96,4.72,1.70,.89,.954,'wood');
      for(let j=0;j<6;j++)packet(-2.56+j*.221,.964+(j%2)*.013,4.67+(j%3)*.045,.205,.302,j*.077-.20);
      recorder(-2.37,.971,4.91,.45);
      table(1.86,3.31,1.23,.65,.842,'green');
      for(const [j,x] of [1.5,1.9,2.25].entries())caseBox(x,.856,3.29,.322,.38,j%2?'blue':'red');
      for(const x of [1.29,2.45])shape('iron','rod',x,.068,3.31,.065,.041,.065,pi/2,pi/2);
      framed(10,1.94,1.84,1.89,1.11,.78,pi);
      // The frame is fastened to a reused freestanding partition.
      box('wood',1.94,1.14,1.98,1.20,1.93,.105);
      for(const x of [1.40,2.49])box('steel',x,.071,2.03,.16,.10,.41);
      hit(1.94,1.98,1.21,.34);
    }else if(i===3){
      // Sacral furniture, dried traces and a counter-signature; no active rig.
      box('velvet',.12,.012,4.39,2.19,.021,4.36);
      for(const s of [-1,1])box('bronze',.12+s*1.044,.027,4.39,.021,.004,4.26);
      for(const [x,d] of [[-1.76,2.53],[1.72,2.53],[-1.76,3.85],[1.72,3.85]])seat(x,d,1.06,'velvet',true);
      const x=-.27,d=6.70;
      shape('darkWood','block',x,.136,d,2.77,.234,1.38);
      shape('slate','block',x,.36,d,2.14,.231,.91);
      shape('darkWood','block',x,.66,d,1.91,.483,.79);
      shape('surface','block',x,.925,d,2.25,.147,1.09);
      box('velvet',x,1.001,d,.62,.019,1.06);
      box('velvet',x,.789,d-.546,.62,.414,.019);
      for(const u of [x-1.06,x+1.06])for(let j=0;j<3;j++)candle(u+Math.sign(x-u)*.11*j,1.004,d+.25-.16*j,.09+j*.046);
      packet(x-.15,1.013,d+.11,.35,.42,.16);
      shape('bronze','bowl',x+.64,1.014,d+.10,.142,.094,.124);
      hit(x,d,2.79,1.40);
      shape('darkWood','block',x,2.22,d+.574,2.34,2.38,.111);
      framed(3,x,2.51,d+.503,1.44,1.43,pi,'wood');
      for(const u of [-1.21,.58])pipe('bronze',[u,1.267,d+.49],[u,3.21,d+.49],.021);
      for(const [j,x,d] of [[0,-.48,6.04],[1,.71,5.96],[2,-1.12,6.10]])stain(x,d,.19,.27,j);
      for(const s of [-1,1]){caseBox(-2.79,.005,6.25+s*.515,.52,.48,s<0?'red':'green');hit(-2.79,6.25+s*.515,.53,.51);}
      const nookX=1.40,nookD=8.48;
      table(nookX,nookD,1.33,.63,1.08,'darkWood');
      for(let j=0;j<5;j++)candle(nookX-.49+j*.242,1.082,nookD,.12+(j%3)*.052);
      stain(nookX,7.98,.26,.15,8);
    }else if(i===4){
      // The full width is divided by two short service counters, not by a
      // blocking wall. The room remains explorable behind both desks.
      for(const u of [-1.88,.66])for(const D of [3.07,4.46])seat(u,D,1.15,'leather');
      table(-2.34,6.53,2.46,.86,1.064,'darkWood');
      table(1.83,6.53,2.68,.86,1.064,'darkWood');
      for(const x of [-2.34,1.83]){
        shape('bronze','block',x,1.621,6.467,2.06,.994,.078);
        shape('milk','block',x,1.705,6.409,1.93,.681,.042);
        for(const u of [-.68,0,.68])box('steel',x+u,1.665,6.381,.028,.813,.025);
        shape('iron','block',x,1.178,6.201,.684,.058,.307);
        packet(x+.73,1.078,6.30,.27,.29,.20);
        shape('bronze','bowl',x-.73,1.078,6.29,.138,.091,.121);
      }
      shape('iron','block',.11,1.197,5.56,.38,.335,.27);
      shape('signal','block',.11,1.243,5.407,.124,.040,.023);
      packet(.16,1.38,5.58,.23,.19,-.17);
      pipe('steel',[.11,.083,5.56],[.11,1.08,5.56],.041);
      shape('iron','rod',.11,.052,5.56,.195,.082,.187);hit(.11,5.56,.41,.33);
      table(-.68,8.36,1.40,.76,.911,'green');recorder(-.82,.919,8.39,.66);
      stain(.42,6.82,.12,.19,4);
    }else if(i===5){
      for(const [j,x] of [-2.13,.25,2.28].entries()){
        table(x,5.19,1.49,.84,.939,j===1?'darkWood':'blue');
        for(const side of [-1,1]){
          shape('wood','block',x+side*.84,1.38,5.59,.092,2.54,1.33);
          shape('cloth','block',x+side*.779,1.92,5.85,.042,1.37,.79);
          for(let k=0;k<4;k++)box('darkWood',x+side*.752,1.427+k*.294,5.80,.033,.019,.743);
          hit(x+side*.84,5.56,.09,1.28);
        }
        recorder(x,.947,5.33,.55);
        packet(x+.46,.953,5.01,.23,.27,.29);
        pipe('steel',[x-.40,.952,5.08],[x-.40,1.235,5.12],.012);
        shape('iron','ball',x-.40,1.252,5.10,.044,.056,.037);
        for(let k=0;k<3;k++)box('bronze',x-.40,1.230+k*.022,5.066,.031,.006,.012);
        seat(x,4.25,.44,'leather',true);
      }
      framed(5,2.83,2.03,2.27,.94,.93,-pi/2);
      box('wood',2.95,1.69,2.27,.112,1.66,1.03);hit(2.95,2.27,.12,1.05);
    }else if(i===6){
      for(const x of [-1.49,1.49]){
        shape('iron','block',x,1.51,6.04,1.62,2.73,.13);
        for(const side of [-1,1])shape('bronze','block',x+side*.798,1.51,5.951,.052,2.659,.086);
        shape('smoked','block',x,1.51,5.925,1.52,2.56,.023);
        for(let j=0;j<4;j++)shape('steel','block',x-.39+j*.29,1.60,5.905,.059,1.73,.009,0,0,-.41);
        shape('slate','block',x,.068,5.12,1.27,.092,1.09);
        for(const side of [-1,1])pipe('bronze',[x+side*.52,.120,4.68],[x+side*.52,.120,5.52],.012);
        hit(x,6.05,1.63,.22);seat(x,3.61,.51,'cloth',false);
      }
      framed(14,.08,2.11,3.10,.836,.73,pi);
      shape('iron','block',.08,1.224,3.20,.834,1.80,.114);
      shape('steel','block',.08,.121,3.20,.950,.107,.526);
      led(.26,1.93,3.121,'signal');hit(.08,3.20,.96,.54);
      table(-2.61,2.24,1.02,.61,.951,'blue');packet(-2.62,.962,2.26,.33,.44,.11);
    }else{
      cabinet(-2.51,2.35,1.15,2.06,.71,'blue',5);cabinet(2.58,3.26,.94,1.92,.67,'green',5);
      for(const [j,x] of [-2.68,-1.80,1.65,2.56].entries()){
        caseBox(x,0,6.50,.76,.67,j%2?'red':'blue');
        caseBox(x,.39,6.52,.67,.59,j%2?'red':'green');
        if(j!==1)caseBox(x+.018,.72,6.56,.59,.52,'green');
        hit(x,6.50,.81,.73);
      }
      // Central freight door is decorative; no route behind the exterior.
      shape('iron','block',.30,1.264,7.035,1.98,2.48,.184);
      shape('steel','block',.32,1.291,6.910,1.77,2.21,.079);
      for(let j=0;j<12;j++)box(j%3?'blue':'iron',.32,.329+j*.171,6.862,1.65,.163,.059);
      shape('bronze','block',.32,1.29,6.823,.099,.249,.041);
      for(const x of [-.69,1.28]){
        box('iron',x,.95,6.85,.107,1.73,.158);
        led(x,1.81,6.752,'signal');
      }
      hit(.30,7.032,2.02,.24);
      table(-2.44,4.53,.98,.59,.903,'wood');packet(-2.45,.913,4.55,.267,.35,-.19);
      stain(.53,6.029,.21,.22,7);
    }
    function tubeKeys(u,y,d){
      shape('bronze','ring',u,y,d,.058,.058,.04,pi/2);
      for(const t of [-1,1]){
        pipe('steel',[u+t*.025,y,d],[u+t*.065,y+.003,d+.071],.009);
        box('steel',u+t*.062,y+.004,d+.062,.024,.007,.019);
      }
    }
    k.flush('Referat Morgenform · '+info.title);
    room.traverse(o=>{if(o.isMesh)o.castShadow=false;});

    const c=crew[i];
    if(c&&humansAvailable(T)){
      const rig=createHuman(T,c.id),{actor,npcInfo}=rig,[x,,z]=pos(c.u,0,c.d);
      actor.position.set(x,rig.groundedY(F),z);actor.rotation.y=c.yaw;room.add(actor);rig.shadow(false);
      const shadow=npcInfo.shadow=contactShadow(T,room,x,F+.009,z,.72,.60);
      const state={room,rig,c,x,z,shadow,t:2.1+i*.30,last:null,say:0,glance:0,distance:0};
      npcInfo.speak=(duration=3.2)=>{state.say=duration;};
      const head=rig.joint('head');
      if(head&&c.mode!=='sit')for(const item of c.mode==='patrol'?
        [['iron',0,.129,.018,.198,.058,.165],['bronze',0,.111,.095,.083,.016,.039]]:
        c.mode==='desk'?[['blue',-.091,.055,-.017,.029,.063,.055],['bronze',-.095,.077,.054,.020,.027,.083]]:
        [['velvet',0,.130,-.025,.188,.058,.158],['bronze',0,.124,.057,.042,.018,.021]]){
        const [material,x,y,z,W,H,L]=item,mesh=new T.Mesh(g.block.clone(),m[material]);
        mesh.position.set(x,y,z);mesh.scale.set(W,H,L);head.add(mesh);
      }
      if(c.mode==='patrol'){
        const pose={x,z,ux:1,uz:0,half:.205,depth:.157},point={},lookAhead={};
        const track=(s,out)=>{
          const k=s/1.31;
          out.x=x+.76*Math.cos(k);out.z=z+1.35*Math.sin(k);out.yaw=Math.atan2(-.76*Math.sin(k),1.35*Math.cos(k));out.curve=true;
          return out;
        };
        world.movingBox(x-1.1,z-1.57,x+1.1,z+1.57,pose,()=>rig.alive());
        Object.assign(state,{track,pose,point,lookAhead});
        track(0,point);Object.assign(pose,{x:point.x,z:point.z});
        actor.position.x=shadow.position.x=point.x;actor.position.z=shadow.position.z=point.z;actor.rotation.y=point.yaw;
        rig.walk(state.t,0,track,F,0,0);
      }else{
        world.circle(x,z,.195,()=>rig.alive());
        if(c.mode==='desk')rig.deskWork(state.t,'registry');
        else rig.visitorPose(state.t,c.mode==='sit'?'rest':'prayer',c.mode==='sit'?.526:0);
      }
      cast.push(state);
    }
  }
  for(const v of Object.values(g))v.dispose();

  function update(time,p,inside){
    let changed=false;
    for(const {room,l,r} of rooms){
      const see=inside&&(p.x>=l-(p.z>front+.95?9.8:14.2)&&p.x<=r+(p.z>front+.95?9.8:14.2));
      if(see!==room.visible){room.visible=see;changed=true;}
    }
    for(const j of cast){
      const {rig,c,room,shadow}=j,actor=rig.actor;
      if(!room.visible||p.z<-2.6||!rig.controllable()||Math.hypot(actor.position.x-p.x,actor.position.z-p.z)>9.1){j.last=null;continue;}
      if(j.last===null){j.last=time;continue;}
      const d=Math.min(.093,(time-j.last)*.001);if(d<.046)continue;
      j.last=time;j.t+=d;j.say=Math.max(0,j.say-d);
      const bearing=Math.atan2(p.x-actor.position.x,p.z-actor.position.z)-actor.rotation.y;
      const wanted=j.say>0?Math.max(-.74,Math.min(.74,Math.atan2(Math.sin(bearing),Math.cos(bearing)))):0;
      j.glance+=(wanted-j.glance)*Math.min(1,d*5.2);
      if(c.mode==='patrol'){
        j.track(j.distance+.30,j.lookAhead);const n=j.lookAhead;
        const paces=j.say>0||Math.hypot(n.x-p.x,n.z-p.z)<.81?0:.82;
        j.distance+=d*paces;j.track(j.distance,j.point);const a=j.point;
        actor.position.x=shadow.position.x=j.pose.x=a.x;
        actor.position.z=shadow.position.z=j.pose.z=a.z;actor.rotation.y=a.yaw;
        j.pose.ux=Math.cos(a.yaw);j.pose.uz=-Math.sin(a.yaw);
        rig.walk(j.t,j.distance,j.track,F,j.glance,paces?0:1);
      }else if(c.mode==='desk')rig.deskWork(j.t,'registry',j.glance,j.say>0?.22:0);
      else rig.visitorPose(j.t,c.mode==='sit'?'rest':'prayer',c.mode==='sit'?.526:0,j.glance,j.say>0?.23:0);
      changed=true;
    }
    return changed;
  }
  function theme(p){
    const i=bays.findIndex((x,n)=>n+1<bays.length&&p.x>=x&&p.x<bays[n+1]);
    return p.z>=front-.03&&i>=0?PLAZA_ROOMS[i].hue:0xffdeb6;
  }
  return {update,theme};
}
