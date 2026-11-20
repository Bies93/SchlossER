import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {architectureKit} from './architecture-kit.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {plazaAtlas,smokedMirror,PLAZA_ROOMS} from './upper-plaza-art.js';
import {plazaFinishMaterials,dressPlazaFinishes,dressUpperHall} from './upper-plaza-finishes.js';

const pi=Math.PI,front=1.73,xyz=(x,y,z)=>[x,y,z];
const crew={
  1:{id:'plazaRaban',u:-2.38,d:4.11,yaw:0,mode:'desk'},
  2:{id:'plazaVroni',u:-1.96,d:4.21,yaw:0,mode:'desk'},
  3:{id:'plazaEberwin',u:1.72,d:6.02,yaw:-1.23,mode:'prayer'},
  4:{id:'plazaIsolde',u:-1.88,d:3.07,yaw:0,mode:'sit'},
  7:{id:'plazaAnton',u:.45,d:3.65,yaw:0,mode:'patrol'}
};

export function dressUpperPlaza(T,parent,world,F,bays,{roof,Z,squareWidth,squareEnd}){
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
    print:plazaAtlas(T),mirror:smokedMirror(T),...plazaFinishMaterials(T)
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
    const ceiling=roof-F,rear=u=>(Math.abs(cx+u)<squareWidth?squareEnd:Z)-front;
    const cuts=[l,...[-squareWidth,squareWidth].filter(x=>x>l&&x<r),r];
    const parts=cuts.slice(1).map((x,j)=>[cuts[j]-cx,x-cx,rear((cuts[j]+x)*.5-cx)]);
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
    function print(tile,u,y,d,W,H,ry=pi,rx=0,rz=0,mat='print'){
      const mesh=g.sheet.clone(),uv=mesh.attributes.uv,
        U=(tile%4)*.25,V=1-(Math.floor(tile/4)+1)*.25;
      for(let j=0;j<uv.count;j++)uv.setXY(j,U+.003+uv.getX(j)*.244,V+.003+uv.getY(j)*.244);
      k.geometry(mat,mesh,matrix.compose(a.fromArray(pos(u,y,d)),q.setFromEuler(e.set(rx,ry,rz)),s.set(W,H,1)));
      mesh.dispose();
    }
    function framed(tile,u,y,d,W,H,ry=pi,bezel='darkWood',art='print'){
      const nx=Math.sin(ry),nz=Math.cos(ry);
      shape(bezel,'block',u-nx*.048,y,d-nz*.048,W+.111,H+.103,.083,0,ry);
      shape('bronze','block',u-nx*.013,y,d-nz*.013,W+.033,H+.034,.018,0,ry);
      // The artwork is the outermost surface; neither the backing nor its lip can mask it.
      print(tile,u+nx*.002,y,d+nz*.002,W,H,ry,0,0,art);
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
      shape('iron','block',u,.231,d+L*.27,W*.92,.047,.052);
      for(const s of [-1,1]){
        box('steel',u+s*(W*.5-.053),H-.153,d,.051,.092,L*.84);
        for(const D of [d-L*.29,d+L*.29])box('bronze',u+s*(W*.5-.025),H-.118,D,.016,.023,.035);
      }
      if(top==='darkWood'||top==='wood')box('bronze',u,H-.115,d-L*.481,W*.88,.018,.012);
      support(u,d,W,L,H);
    }
    function seat(u,d,wide=.49,mat='leather',back=true,faceToRear=false){
      const f=faceToRear?-1:1;
      shape('wood','block',u,.426,d,wide+.024,.073,.427);
      shape(mat,'block',u,.480,d,wide-.012,.092,.409);
      shape('darkWood','block',u,.393,d,wide-.088,.052,.329);
      if(wide>.90){
        box('bronze',u,.464,d-f*.201,wide-.10,.014,.019);
        box('darkWood',u,.224,d,.058,.033,.285);
        if(faceToRear)for(const s of [-1,1]){
          shape('wood','block',u+s*wide*.481,.286,d,.066,.572,.382);
          shape('bronze','block',u+s*wide*.477,.567,d,.079,.031,.406);
        }
      }
      for(const side of [-1,1])for(const v of [-1,1]){
        pipe('iron',[u+side*wide*.402,.032,d+v*.165],[u+side*wide*.404,.411,d+v*.165],.022);
      }
      if(back){
        for(const x of [u-wide*.44,u+wide*.44])pipe('darkWood',[x,.424,d+f*.172],[x,.918,d+f*.229],.023);
        shape('darkWood','block',u,.782,d+f*.239,wide+.025,.313,.069);
        shape(mat,'block',u,.781,d+f*.209,wide-.042,.263,.078);
        for(const x of [u-wide*.36,u+wide*.36])screw(x,.781,d+f*.164,.010);
        hit(u,d+f*.236,wide,.066);
      }
      support(u,d-f*.018,wide,.392,.526);
    }
    function cabinet(u,d,W=.77,H=1.64,L=.55,color='green',n=4){
      shape(color,'block',u,H*.509,d,W,H,L);
      shape('iron','block',u,.064,d,W+.024,.127,L+.021);
      box('steel',u,H+.05,d,W+.015,.035,L-.016);
      box('iron',u,H*.56,d-L*.494,W*.935,H*.873,.023);
      for(let j=0;j<n;j++){
        const y=.163+(H-.206)*(j+.48)/n,h=(H-.235)/n;
        shape(j%2?'steel':color,'block',u,y,d-L*.512,W*.89,h,.026);
        shape('iron','block',u,y+.020,d-L*.554,.207,.039,.042);
        box('steel',u,y+.023,d-L*.588,.169,.022,.031);
        for(const s of [-1,1])box('iron',u+s*.091,y+.023,d-L*.574,.028,.032,.045);
        for(const s of [-1,1])screw(u+s*W*.342,y+h*.28,d-L*.532,.010);
        if(j%2===0){
          box('bronze',u,y-h*.23,d-L*.531,.229,.098,.016);
          label(u,y-h*.23,d-L*.551,.215,.083);
        }
      }
      hit(u,d,W,L);
    }
    function packet(u,y,d,W=.27,L=.35,ry=.07){
      shape('wood','block',u,y+.014,d,W,.023,L,0,ry);
      shape('paper','block',u+.006,y+.026,d,W*.965,.024,L*.969,0,ry);
      print(i+8,u+.009,y+.039,d,W*.88,L*.91,ry,-pi*.5);
      box('ink',u-W*.32,y+.039,d-L*.39,.037,.004,.049);
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
      box('iron',u,y+H*.76,d-L*.539,W*.24,.024,.027);
      for(const s of [-1,1])box('steel',u+s*W*.111,y+H*.76,d-L*.554,.024,.028,.021);
    }
    function recorder(u,y,d,W=.63){
      shape('green','block',u,y+.142,d,W,.279,.325);
      shape('steel','block',u,y+.161,d-.166,W-.056,.219,.032);
      shape('iron','block',u,y+.115,d-.188,W*.86,.063,.014);
      for(const t of [-1,1]){
        const x=u+t*W*.261;
        shape('iron','rod',x,y+.196,d-.188,W*.137,.028,W*.137,pi/2);
        shape('bronze','ring',x,y+.196,d-.208,W*.104,W*.104,.030);
        for(let j=0;j<3;j++){
          const a=j*pi*2/3;
          shape('steel','block',x+Math.cos(a)*W*.070,y+.196+Math.sin(a)*W*.070,d-.214,W*.10,W*.028,.012,0,0,a);
        }
        screw(x,y+.196,d-.223,.026);
      }
      for(let i=0;i<5;i++)box(i%3?'jade':'signal',u+(i-2)*W*.142,y+.114,d-.202,.035,.017,.021);
      for(let j=0;j<6;j++)box('iron',u+W*(.05+j*.06),y+.283,d+.071,.014,.012,.093);
      pipe('leather',[u-W*.30,y+.035,d+.126],[u-W*.36,y+.014,d+.188],.011);
    }
    function bulb(u,y,d,key='filament'){
      pipe('steel',[u,ceiling-.035,d],[u,y+.035,d],.018);
      shape('iron','rod',u,ceiling-.028,d,.112,.049,.112);
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
    function shelf(u,d,W,L,levels,finish='darkWood'){
      const top=levels.at(-1)+.062;
      for(const x of [u-W/2+.024,u+W/2-.024])for(const D of [d-L*.5+.026,d+L*.5-.026]){
        box('iron',x,top*.50,D,.048,top,.051);
        box('steel',x,.027,D,.082,.050,.085);
        for(const y of levels)screw(x,y,D-.033,.010);
      }
      for(const y of levels){
        box(finish,u,y,d,W,.048,L);
        box('bronze',u,y+.013,d-L*.51,W-.021,.016,.015);
      }
      hit(u,d,W,L);
    }
    function folders(x,y,d,seed,count){
      for(let j=0;j<count;j++){
        const u=x+j*.119,h=.216+(j%3)*.019,tone=['blue','wood','red','green'][(j+seed)%4];
        shape(tone,'block',u,y+h*.5,d,.102,h,.265,0,0,j%5===0?.06:0);
        box('paper',u,y+h*.48,d+.014,.084,h*.85,.231);
        box(tone,u,y+h*.5,d-.131,.091,h*.93,.023);
        box('bronze',u,y+h*.31,d-.145,.037,.016,.013);
        label(u,y+h*.63,d-.145,.061,.064);
      }
    }
    function placard(tile,u,y,d,W=.27,H=.35){
      shape('bronze','block',u,y-.021,d+.038,W+.039,.030,.148);
      shape('wood','block',u,y+H*.45,d+.045,W+.026,H,.048,-.27);
      print(tile,u,y+H*.46,d+.010,W,H*.89,pi,-.27);
    }
    function stain(u,d,W,L,seed){
      const level=.002+seed*.0003,center=pos(u,level,d),count=17;
      const knots=Array.from({length:count},(_,j)=>{
        const f=j/count*2*pi,v=.63+rng()*.38;
        return pos(u+Math.cos(f)*W*v,level,d+Math.sin(f)*L*v);
      });
      for(let j=0;j<count;j++)k.triangle(seed%3?'tarnish':'dirt',center,knots[(j+1)%count],knots[j],[.52,.53,0,0,1,1]);
      for(let n=0;n<4;n++){
        const p=u+(rng()-.45)*W*2.6,D=d+(rng()-.5)*L*2.3,r=.014+rng()*.033;
        shape('tarnish','rod',p,level+.0011,D,r,.0017,r*.73);
      }
    }
    function rearPlaque(tile,u,y,W,H){
      framed(tile,u,y,rear(u)-.154,W,H);
    }
    const sidePlaque=(tile,s,d,y,W,H)=>framed(tile,s*(w-.218),y,d,W,H,-s*pi/2);

    dressPlazaFinishes(k,{i,w,parts,pos,box,ceiling,rear});
    framed(i,door+1.775,2.057,-.217,1.27,.43,pi,'darkWood','finishArt');
    for(const x of [door+1.095,door+2.455])screw(x,2.057,-.224,.022);
    sidePlaque(i+8,i%2?-1:1,i===5?2.86:2.03,1.96,.75,.95);
    for(const sg of [-1,1]){
      const x=sg*(w-.239),Dmax=rear(x)-.32;
      if(i===3||i===4||i===0)continue;
      pipe('iron',[x,3.31,.53],[x,3.31,Dmax],.028);
      pipe('bronze',[x,3.23,.71],[x,3.23,Dmax-.06],.017);
      for(let z=.98;z<Dmax-.12;z+=1.37){
        box('steel',x+sg*.047,3.28,z,.139,.160,.065);
        screw(x,3.33,z-.042,.011);
      }
    }
    if(i!==3)for(const [j,d] of [2.43,5.76].entries())bulb(j%2?.49:-.53,3.23,d,i===1||i===6?'mercury':'filament');
    const leftU=i===3?-3.02:i===4?-2.15:-1.58,rightU=i===3?1.61:i===4?1.26:1.72;
    rearPlaque(i,leftU,i===6?3.16:2.62,i===3?.96:1.43,i===3?1.27:1.41);
    rearPlaque(i+8,rightU,i===6?3.17:2.63,1.02,1.03);

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
      shape('wood','block',1.85,.416,2.38,.27,.122,.25);
      tubeKeys(1.85,.479,2.39);
      rearPlaque(8,-.03,1.53,1.02,.57);
      shelf(-.71,6.45,1.74,.42,[.32,.76,1.20]);
      for(const [j,y] of [.344,.784,1.224].entries()){
        folders(-1.44,y,6.48,j,6);
        for(let s=0;s<2;s++)caseBox(-.39+s*.31,y,6.48,.25,.28,s?'green':'red');
      }
      framed(0,w-.219,2.06,3.56,1.12,1.03,-pi/2);
      shape('iron','block',-.58,1.05,4.51,.392,.045,.286);
      shape('paper','block',-.58,1.080,4.51,.339,.018,.256);
      print(8,-.58,1.092,4.51,.316,.232,pi,-pi*.5);
    }else if(i===1){
      // An abandoned, non-interactive set. The contrast between the tape
      // and its approved transcript tells what the room was used for.
      table(-2.38,4.62,1.63,.74,.966,'blue');recorder(-2.61,.979,4.67,.74);
      packet(-1.97,.979,4.61,.32,.41,-.09);
      box('iron',1.27,1.63,5.82,2.31,2.03,.092);
      shape('steel','block',1.27,1.92,5.754,2.12,1.01,.070);
      shape('smoked','block',1.27,1.92,5.704,1.91,.81,.031);
      for(const x of [.16,2.38]){
        box('steel',x,1.34,5.82,.077,2.68,.182);
        box('iron',x,.045,5.83,.243,.087,.356);
        for(const y of [.46,1.99,2.57])screw(x,y,5.719,.015);
      }
      for(const x of [.65,1.88])box('iron',x,1.895,5.679,.038,.798,.026);
      shape('milk','block',1.02,2.203,5.683,1.13,.054,.010,0,0,-.16);
      for(let j=0;j<7;j++)box('steel',1.27+(j-3)*.18,.836,5.759,.119,.039,.022);
      label(1.27,1.187,5.762,.72,.22);
      hit(1.27,5.81,2.33,.15);
      seat(.42,4.59,.63,'leather',true);
      for(const x of [.065,.77]){
        shape('steel','block',x,.685,4.50,.118,.058,.267);
        pipe('iron',[x,.662,4.66],[x,.471,4.65],.038);
      }
      bulb(.42,2.64,4.35,'mercury');
      for(const [j,d] of [4.20,4.65,5.13].entries())stain(.27+(j%2)*.43,d,.13+j*.052,.17,j+1);
      table(2.6,3.58,.63,.58,.91,'green');shape('steel','bowl',2.54,.93,3.61,.155,.091,.119);
      packet(2.73,.916,3.55,.15,.24,-.13);
      shelf(-2.39,6.56,1.63,.40,[.31,.81,1.26]);
      for(const [j,y] of [.334,.834,1.284].entries()){
        for(let n=0;n<3;n++)caseBox(-2.91+n*.49,y,6.52,.39,.31,j%2?'blue':'green');
      }
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
      for(const x of [1.29,2.45])for(const z of [-.247,.247]){
        shape('iron','rod',x,.066,3.31+z,.063,.042,.063,0,0,pi/2);
        box('steel',x,.115,3.31+z,.068,.087,.054);
      }
      framed(10,1.94,1.53,1.89,1.11,.78,pi);
      box('wood',1.94,1.02,1.98,1.22,1.98,.105);
      for(const x of [1.40,2.49])box('steel',x,.054,2.03,.16,.106,.41);
      hit(1.94,1.98,1.21,.34);
      shelf(-.194,6.51,2.05,.43,[.34,.79,1.24,1.70]);
      for(const [j,y] of [.364,.814,1.264,1.724].entries())folders(-1.08,y,6.52,j,15-(j%2)*3);
      shape('bronze','rod',-1.30,.972,4.92,.058,.025,.058);
      shape('darkWood','rod',-1.30,1.037,4.92,.031,.109,.031);
      shape('wood','ball',-1.30,1.095,4.92,.044,.024,.044);
    }else if(i===3){
      // Pew ends, kneelers, lectern and a three-part altar screen.
      for(const [x,d] of [[-1.83,2.61],[1.78,2.61],[-1.83,3.94],[1.78,3.94]]){
        seat(x,d,1.21,'velvet',true,true);
        shape('wood','block',x,.132,d-.33,1.16,.048,.195);
        shape('velvet','block',x,.166,d-.326,1.12,.048,.174);
        for(const s of [-1,1]){
          box('darkWood',x+s*.46,.071,d-.332,.063,.141,.163);
          shape('bronze','ring',x+s*.563,.329,d-.199,.027,.027,.042);
        }
        packet(x,.936,d-.223,.207,.095,.03);
      }
      const x=-.27,d=6.70;
      shape('darkWood','block',x,.115,d,2.77,.229,1.38);
      shape('surface','block',x,.239,d,2.68,.073,1.31);
      shape('slate','block',x,.36,d,2.14,.231,.91);
      shape('darkWood','block',x,.66,d,1.91,.483,.79);
      shape('surface','block',x,.925,d,2.25,.147,1.09);
      box('velvet',x,1.001,d,.62,.019,1.06);
      box('velvet',x,.789,d-.546,.62,.414,.019);
      for(const u of [x-1.06,x+1.06])for(let j=0;j<3;j++)candle(u+Math.sign(x-u)*.11*j,1.004,d+.25-.16*j,.09+j*.046);
      packet(x-.15,1.013,d+.11,.35,.42,.16);
      shape('bronze','bowl',x+.64,1.014,d+.10,.142,.094,.124);
      hit(x,d,2.79,1.40);
      for(const u of [x-.887,x+.887]){
        shape('bronze','rod',u,.542,d-.396,.072,.110,.068);
        shape('wood','rod',u,.685,d-.399,.043,.271,.047);
        shape('bronze','rod',u,.813,d-.398,.090,.068,.072);
      }
      const paneD=d+.483;
      shape('darkWood','block',x,2.332,paneD+.093,2.42,2.57,.132);
      for(const a of [-1.06,1.06]){
        shape('darkWood','block',x+a,1.824,paneD+.014,.219,3.61,.255);
        box('wood',x+a,1.83,paneD-.107,.145,2.99,.032);
        for(let j=0;j<3;j++)box('bronze',x+a+.040*(j-1),2.02,paneD-.125,.012,2.19,.016);
        shape('bronze','ball',x+a,3.645,paneD+.018,.086,.123,.080);
        shape('bronze','block',x+a,.14,paneD+.010,.270,.254,.31);
        const v=x+a*1.43;
        shape('wood','block',v,2.26,paneD+.134,.62,1.91,.094,0,-Math.sign(a)*.22);
        shape(a>0?'smoked':'red','block',v,2.32,paneD+.057,.51,1.47,.057,0,-Math.sign(a)*.22);
        for(const [j,y] of [1.80,2.18,2.58].entries()){
          shape(j===1?'signal':'bronze','block',v,y,paneD+.009,.204,.204,.020,0,-Math.sign(a)*.22,pi/4);
        }
      }
      shape('iron','rod',x,2.895,paneD-.033,.663,.062,.663,pi*.5);
      shape('bronze','ring',x,2.895,paneD-.074,.637,.637,.090);
      shape('filament','ring',x,2.895,paneD-.087,.546,.546,.045);
      for(let n=0;n<30;n++){
        const a=n*pi/15,dy=Math.sin(a),dx=Math.cos(a);
        pipe('bronze',[x+dx*.672,2.895+dy*.672,paneD-.052],[x+dx*(n%5===0?.853:.755),2.895+dy*(n%5===0?.853:.755),paneD-.052],n%5===0?.017:.010);
      }
      framed(3,x,2.865,paneD-.10,.71,.71,pi,'wood');
      box('wood',x,1.55,paneD-.001,1.48,.21,.157);
      framed(11,x,1.55,paneD-.101,1.09,.139,pi);
      for(const [j,x,d] of [[0,-.48,6.04],[1,.71,5.96],[2,-1.12,6.10]])stain(x,d,.19,.27,j);
      for(const s of [-1,1]){caseBox(-2.79,.005,6.25+s*.515,.52,.48,s<0?'red':'green');hit(-2.79,6.25+s*.515,.53,.51);}
      const nookX=1.40,nookD=8.48;
      table(nookX,nookD,1.33,.63,1.08,'darkWood');
      for(let j=0;j<5;j++)candle(nookX-.49+j*.242,1.082,nookD,.12+(j%3)*.052);
      stain(nookX,7.98,.26,.15,8);
      for(const s of [-1,1]){
        const U=s*2.68;
        shape('darkWood','block',U,.447,4.94,.61,.881,.53);
        shape('wood','block',U,.124,4.94,.699,.183,.603);
        shape('surface','block',U,.921,4.94,.722,.107,.614);
        for(const q of [-1,0,1])candle(U+.177*q,.979,4.91+Math.abs(q)*.081,.16-Math.abs(q)*.037);
        hit(U,4.94,.72,.615);
        sidePlaque(3,s,4.87,2.43,.93,1.43);
      }
      const y=3.28,D=4.04;
      pipe('iron',[.12,ceiling-.035,D],[.12,y+.042,D],.029);
      shape('bronze','ring',.12,y,D,.643,.643,.154,pi/2);
      for(let j=0;j<8;j++){
        const a=j*pi/4,u=.12+.599*Math.cos(a),d=D+.599*Math.sin(a);
        pipe('bronze',[.12,y+.11,D],[u,y,d],.012);
        candle(u,y+.009,d,.095+(j%2)*.013);
      }
    }else if(i===4){
      // The full width is divided by two short service counters, not by a
      // blocking wall. The room remains explorable behind both desks.
      for(const u of [-1.88,.86])for(const D of [3.07,4.46])seat(u,D,1.15,'leather',true,true);
      table(-2.34,6.53,2.46,.86,1.064,'darkWood');
      table(1.83,6.53,2.68,.86,1.064,'darkWood');
      for(const x of [-2.34,1.83]){
        shape('bronze','block',x,1.621,6.467,2.06,.994,.078);
        shape('milk','block',x,1.705,6.409,1.93,.681,.042);
        shape('darkWood','block',x,1.304,6.334,1.854,.109,.101);
        shape('bronze','block',x,1.585,6.379,.644,.211,.034);
        shape('iron','block',x,1.585,6.357,.556,.134,.017);
        for(const u of [-.68,0,.68])box('steel',x+u,1.665,6.381,.028,.813,.025);
        shape('iron','block',x,1.178,6.201,.684,.058,.307);
        packet(x+.73,1.078,6.30,.27,.29,.20);
        shape('bronze','bowl',x-.73,1.078,6.29,.138,.091,.121);
        packet(x+.33,1.102,6.41,.161,.211,-.21);
        box('darkWood',x,.555,6.56,2.04,.937,.073);
        for(const a of [-.67,0,.67])shape('wood','block',x+a,.569,6.513,.575,.723,.032);
        placard(12,x-.71,1.069,6.222,.28,.31);
      }
      shape('iron','block',.11,1.197,5.56,.38,.335,.27);
      shape('signal','block',.11,1.243,5.407,.124,.040,.023);
      packet(.16,1.38,5.58,.23,.19,-.17);
      pipe('steel',[.11,.083,5.56],[.11,1.08,5.56],.041);
      shape('iron','rod',.11,.052,5.56,.195,.082,.187);hit(.11,5.56,.41,.33);
      for(let j=0;j<5;j++)packet(.16+j*.094,.006,5.65+(j%3)*.13,.058,.092,.10*j);
      table(-.68,8.36,1.40,.76,.911,'green');recorder(-.82,.919,8.39,.66);
      sidePlaque(4,-1,4.06,2.37,1.42,1.48);
      stain(.42,6.82,.12,.19,4);
    }else if(i===5){
      for(const [j,x] of [-2.13,.25,2.28].entries()){
        table(x,5.19,1.49,.84,.939,j===1?'darkWood':'blue');
        for(const side of [-1,1]){
          shape('wood','block',x+side*.84,1.336,5.59,.093,2.64,1.33);
          shape('darkWood','block',x+side*.84,.057,5.59,.229,.107,1.371);
          shape(j===0?'cloth':j===1?'leather':'velvet','block',x+side*.779,1.866,5.83,.040,1.35,.86);
          for(let k=0;k<12;k++)box('darkWood',x+side*.751,1.26+k*.107,5.84,.024,.015,.806);
          for(const d of [4.937,6.222])box('bronze',x+side*.84,1.331,d,.103,2.48,.025);
          hit(x+side*.84,5.56,.09,1.28);
        }
        box('darkWood',x,2.60,5.58,1.70,.127,1.29);
        box('iron',x,2.525,5.65,.423,.050,.265);
        box(j===1?'signal':'filament',x,2.494,5.65,.362,.031,.215);
        framed(i,x,2.583,4.908,.49,.081,pi,'wood','finishArt');
        recorder(x,.943,5.33,.55);
        packet(x+.46,.953,5.01,.23,.27,.29);
        pipe('steel',[x-.40,.952,5.08],[x-.40,1.235,5.12],.012);
        shape('iron','ball',x-.40,1.252,5.10,.044,.056,.037);
        for(let k=0;k<3;k++)box('bronze',x-.40,1.230+k*.022,5.066,.031,.006,.012);
        shape('iron','rod',x-.40,.959,5.08,.059,.041,.057);
        shape('leather','ring',x+.452,1.002,5.341,.079,.103,.214,pi*.50);
        for(const s of [-1,1])shape('iron','block',x+.452+s*.075,1.011,5.391,.064,.042,.075);
        pipe('iron',[x+.479,.970,5.378],[x+.365,.956,5.439],.008);
        seat(x,4.25,.44,'leather',true);
      }
      sidePlaque(5,1,2.76,2.18,1.21,1.26);
      shelf(-2.71,2.02,1.23,.33,[.38,.79,1.19]);
      for(const [j,y] of [.404,.814,1.214].entries()){
        for(let n=0;n<4;n++)caseBox(-3.14+n*.28,y,2.01,.21,.25,j%2?'blue':'green');
      }
    }else if(i===6){
      for(const x of [-1.49,1.49]){
        shape('iron','block',x,1.51,6.04,1.62,2.73,.13);
        for(const side of [-1,1])shape('bronze','block',x+side*.798,1.51,5.951,.052,2.659,.086);
        shape('smoked','block',x,1.51,5.926,1.52,2.56,.025);
        shape('mirror','sheet',x,1.51,5.910,1.448,2.466,1,0,pi);
        for(const s of [-1,1]){
          box('steel',x+s*.774,1.416,6.066,.068,2.827,.148);
          box('iron',x+s*.774,.051,6.069,.211,.098,.436);
          for(const y of [.247,1.522,2.740])screw(x+s*.772,y,5.899,.015);
        }
        box('steel',x,.137,6.04,1.62,.096,.197);
        shape('slate','block',x,.049,5.12,1.27,.092,1.09);
        for(const side of [-1,1])pipe('bronze',[x+side*.52,.120,4.68],[x+side*.52,.120,5.52],.012);
        for(const a of [-.156,.156]){
          const u=x+a;
          shape('leather','block',u,.097,5.07,.131,.012,.318,0,Math.sign(a)*.10);
        }
        hit(x,6.05,1.65,.29);seat(x,3.61,.51,'cloth',false);
      }
      framed(14,.08,2.11,3.10,.836,.73,pi);
      shape('iron','block',.08,1.171,3.224,.834,1.98,.207);
      shape('steel','block',.08,.084,3.20,.950,.166,.526);
      box('blue',.08,.68,3.118,.690,.551,.015);
      for(let j=0;j<6;j++)box('iron',.08+(j-2.5)*.077,.579,3.105,.037,.096,.014);
      for(const x of [-.145,.305])led(x,1.516,3.114,x>0?'signal':'jade');
      hit(.08,3.20,.96,.54);
      table(-2.61,2.24,1.02,.61,.951,'blue');packet(-2.62,.953,2.26,.33,.44,.11);
      shape('steel','bowl',-2.88,.954,2.29,.106,.054,.082);
    }else{
      cabinet(-2.51,2.35,1.15,2.06,.71,'blue',5);cabinet(2.58,3.26,.94,1.92,.67,'green',5);
      for(const [j,x] of [-2.68,-1.80,1.65,2.56].entries()){
        const y=j===0||j===3?.079:0;
        caseBox(x,y,6.50,.76,.67,j%2?'red':'blue');
        caseBox(x,y+.382,6.52,.67,.59,j%2?'red':'green');
        if(j!==1)caseBox(x+.018,y+.724,6.56,.59,.52,'green');
        hit(x,6.50,.81,.73);
      }
      // Central freight door is decorative; no route behind the exterior.
      shape('iron','block',.30,1.264,7.035,1.98,2.48,.184);
      shape('steel','block',.32,1.291,6.910,1.77,2.21,.079);
      for(let j=0;j<12;j++)box(j%3?'blue':'iron',.32,.329+j*.171,6.862,1.65,.163,.059);
      shape('bronze','block',.32,1.29,6.823,.099,.249,.041);
      shape('steel','block',.32,1.29,6.797,.061,.154,.019);
      for(const x of [-.69,1.28]){
        box('iron',x,.95,6.85,.107,1.73,.158);
        led(x,1.81,6.752,'signal');
      }
      hit(.30,7.032,2.02,.24);
      table(-2.44,4.53,.98,.59,.903,'wood');packet(-2.45,.913,4.55,.267,.35,-.19);
      box('iron',.32,2.635,6.977,2.14,.175,.199);
      framed(7,.32,2.639,6.859,1.04,.102,pi,'darkWood','finishArt');
      for(const s of [-1,1])for(const u of [.32+s*1.034,.32+s*.94]){
        for(let j=0;j<6;j++)shape('bronze','block',u,.37+j*.296,6.764,.061,.203,.019,0,0,.25);
      }
      for(const z of [5.7,6.35])box('steel',-.77,.02,z,1.61,.034,.077);
      for(const x of [-2.69,2.55]){
        const d=6.50;
        box('wood',x,.041,d,.83,.080,.704);
        for(const off of [-.27,.27])box('iron',x+off,.028,d,.06,.045,.69);
      }
      shelf(2.65,5.00,.72,.48,[.33,.81,1.29]);
      for(const [j,y] of [.354,.834,1.314].entries())caseBox(2.65,y,5.00,.59,.42,j%3?'green':'red');
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
  const updateHall=dressUpperHall(T,parent,world,m,F,bays,roof);

  function update(time,p,inside){
    let changed=updateHall(p,inside);
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
