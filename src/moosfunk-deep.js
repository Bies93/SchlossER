import {b,DEEP_STAIR as stair,DEEP_RUN,DEEP_FLOOR,p,deepStairY,wcRoofAt} from './park-wc-layout.js';
import {randomSource} from './surface-detail.js';

const bays=[{u:.08,mat:'plum',quilt:'terracotta'},{u:-5.28,mat:'petrol',quilt:'olive'},{u:-10.77,mat:'wine',quilt:'plum'}];
export const DEEP_LIGHTS=[
  ...[10.34,8.28,6.25].map(u=>[u,-.70,0xf8bf82,10,4.1,'deepStair',deepStairY(u)-DEEP_FLOOR+1.80]),
  [3.88,.22,0xf7bf85,19,5.6,'deepLanding',2.08],
  ...bays.flatMap(({u},i)=>[
    [u,-3.56,i===1?0xf8bc8e:0xffad91,28,6.8,'deepLounge',2.04],
    [u,3.82,i===1?0xc0c7d1:0xfab49b,29,6.8,'deepLounge',2.04]]),
  [-13.64,.17,0xf7ae92,23,6.1,'deepLounge',2.34],
  // These two sources are hidden with the room, not attached to the scene.
  [-19.64,.20,0x67e6c1,23,6.4,'deepOrb',1.65],
  [-21.30,2.57,0xa087dc,14,5.4,'deepOrb',2.08],
  [-16.07,-2.3,0xeeb380,11,4.8,'deepOrb',2.03]
];

export function deepMaterials(T,{painted,stone,cloth,wood}){
  const m=(color,roughness=.87,more={})=>new T.MeshStandardMaterial({color,roughness,...more});
  const grain=(color,n,roughness=.94)=>m(color,roughness,{...stone,normalScale:new T.Vector2(n,n)});
  const textile=(color,side=T.FrontSide)=>m(color,.99,{...cloth,side,normalScale:new T.Vector2(.24,.24)});
  const lamp=(color,emissive,n=.85)=>({material:m(color,.54,{emissive,emissiveIntensity:n}),cast:false});
  return {
    deepRock:grain(0x847164,.75),deepRockBase:grain(0x665b51,.36),
    deepSlate:grain(0x706961,.38,.86),deepSlateDark:grain(0x635b55,.40,.92),
    deepEdge:grain(0x938272,.54,.85),deepDamp:grain(0x615951,.58),
    deepWalnut:m(0x73503c,.86,wood),deepCopper:m(0x99704e,.52,{...painted,metalness:.5}),
    deepIron:m(0x464842,.76,{...painted,metalness:.35}),deepSoot:m(0x363233,.91,painted),
    moosJade:m(0x566e5d,.82,painted),deepBlueJar:m(0x395e63,.4,{metalness:.17}),
    deepWax:m(0xc6a77d,.8),deepLinen:textile(0xbeaa91),deepSeam:textile(0xb09475),
    plum:textile(0x6c485f,T.DoubleSide),wine:textile(0x7e4549,T.DoubleSide),
    petrol:textile(0x416364,T.DoubleSide),olive:textile(0x656d50),
    terracotta:textile(0xa06a57),toySilicone:m(0x795566,.66),
    toySage:m(0x68837d,.56),deepGold:lamp(0xeec38f,0xffbd71,.98),
    deepRose:lamp(0xf09d97,0xee797d,.67),deepBlue:lamp(0xa9ccd2,0x81bbcb,.74),
    violetGlass:lamp(0xb1a0c9,0xa180e4,.60),orbStone:grain(0x414747,.65,.79)
  };
}

export function buildDeepStair(T,m){
  const {block,hit,pipe,k,deepTile}=m,{top,bottom,left,right,count,rise}=stair;
  const roof=u=>wcRoofAt('deepStair',u,.0),level=b-DEEP_FLOOR;
  for(let i=0;i<count;i++){
    const U=top-i*DEEP_RUN,u=i===count-1?bottom:U-DEEP_RUN;
    const y=i===count-1?0:level-(i+.81)*rise;
    block(i%5===1?'deepSlateDark':'deepEdge',u,U,y-.197,y,left,right);
    block('deepEdge',u-.014,u+.058,y-.028,y+.015,left+.014,right-.014);
    for(const d of [.076,.098,.120])
      block('deepSlateDark',u+d,u+d+.007,y+.001,y+.002,left+.046,right-.046);
  }
  // Each section shares boundary vertices with the next. Separate rain-dark
  // skirting from the carved walls without stacking two coplanar surfaces.
  const seam=[top,top-.88,top-1.76,top-2.64,top-3.52,top-4.4,top-5.28,bottom];
  for(let i=0;i<seam.length-1;i++){
    const U=seam[i],u=seam[i+1],low=s=>deepStairY(s)-.22,band=s=>low(s)+.47;
    const d=(v,j)=>v+(j===0||j===seam.length-1?0:Math.sin(j*2.81)*.013);
    for(const side of [left,right]){
      const a=d(side,i+1),c=d(side,i),reverse=side===right;
      const panel=(mat,lo,hi)=>{
        const points=[p(u,lo(u),a),p(U,lo(U),c),p(U,hi(U),c),p(u,hi(u),a)];
        k.quad(mat,...(reverse?points.reverse():points),1.36,i*.89);
      };
      panel('deepDamp',low,band);panel(i%2===0?'deepRock':'deepRockBase',band,roof);
    }
    k.quad('deepRockBase',p(u,roof(u),left),p(U,roof(U),left),p(U,roof(U),right),p(u,roof(u),right),1.4,i*.89);
  }
  // Rail follows the actual grade. Each clamp touches a masonry anchor.
  const rail=right-.096,start=top-.13,end=bottom+.14;
  pipe('deepCopper',[start,deepStairY(start)-DEEP_FLOOR+.96,rail],[end,deepStairY(end)-DEEP_FLOOR+.96,rail],.028);
  for(const u of [10.77,9.71,8.65,7.59,6.53,5.53]){
    const y=deepStairY(u)-DEEP_FLOOR+.92;
    block('deepIron',u-.066,u+.066,y-.072,y+.043,right-.020,right+.021);
    pipe('deepIron',[u,y,right-.012],[u,y,rail],.020);
    pipe('deepCopper',[u,y,rail],[u,y+.057,rail],.023);
  }
  for(const [u,,,,,id,h] of DEEP_LIGHTS){
    if(id!=='deepStair')continue;
    block('deepIron',u-.203,u+.203,h-.092,h+.091,left-.02,left+.075);
    block('deepGold',u-.174,u+.174,h-.055,h+.05,left+.076,left+.103);
    for(const d of [-.13,0,.13])pipe('deepIron',[u+d,h-.081,left+.110],[u+d,h+.070,left+.110],.013);
  }
  const when=o=>o.y<=b+.22&&o.y>=DEEP_FLOOR-.20;
  hit(bottom+.004,top-.004,left-.08,left,when);
  hit(bottom+.004,top-.004,right,right+.08,when);
  deepTile('entry',7.288,deepStairY(7.288)-DEEP_FLOOR+1.43,left+.038,.66,.24,-Math.PI/2);
}

const turn=Math.PI/2;
export function furnishDeep(T,m,id){
  const {block:B,hit,room,k,stamp,pipe,deepTile}=m,rand=randomSource(id==='deepOrb'?173:1927);
  const sphere=new T.SphereGeometry(1,16,10),cylinder=new T.CylinderGeometry(1,1,1,16),
    taper=new T.CylinderGeometry(.75,1,1,14),hoop=new T.TorusGeometry(1,.14,5,20);
  const ball=(mat,u,y,v,x,h,z,a=0)=>stamp(mat,sphere,u,y,v,[x,h,z],a);
  const drum=(mat,u,y,v,r,h,g=cylinder)=>stamp(mat,g,u,y,v,[r,h,r]);
  const disk=(mat,u,y,v,r,pitch=-turn)=>stamp(mat,hoop,u,y,v,[r,r,r],0,pitch);
  const line=(mat,u,y,v,U,Y,V,r)=>pipe(mat,[u,y,v],[U,Y,V],r);
  function framed(id,u,y,v,w,h,yaw){
    const du=Math.cos(yaw),dv=-Math.sin(yaw),U=u-du*.032,V=v-dv*.032;
    const s=w/2*Math.abs(dv)+.028,d=w/2*Math.abs(du)+.028;
    B('deepWalnut',U-s,U+s,y-h/2-.027,y+h/2+.027,V-d,V+d);deepTile(id,u,y,v,w,h,yaw);
  }
  function sconce(u,y,v,mat='deepGold',side=1){
    B('deepIron',u-.145,u+.145,y-.13,y+.14,v+Math.min(0,.112*side),v+Math.max(0,.112*side));
    const V=v+.121*side;
    B(mat,u-.114,u+.114,y-.082,y+.085,V-.023,V+.023);
    for(const d of [-.083,.083])line('deepCopper',u+d,y-.105,V+.031*side,u+d,y+.113,V+.031*side,.011);
  }
  function lantern(u,y,v,mat='deepGold',radius=.112){
    const hang=wcRoofAt(id,u,v)-DEEP_FLOOR;
    line('deepIron',u,hang+.015,v,u,y+.175,v,.012);
    drum('deepIron',u,y+.147,v,radius*1.13,.052,taper);drum('deepSoot',u,y-.147,v,radius*1.09,.045);
    drum(mat,u,y,v,radius*.90,.274,cylinder);
    for(let i=0;i<4;i++){
      const f=i*Math.PI*.5+.4,U=u+Math.sin(f)*radius,V=v+Math.cos(f)*radius;
      line('deepCopper',U,y-.14,V,U,y+.14,V,.010);
    }
  }
  function bench(u,v,len,shade='petrol'){
    B('deepWalnut',u-len/2,u+len/2,.39,.461,v-.25,v+.25);
    B(shade,u-len/2+.01,u+len/2-.01,.463,.517,v-.235,v+.235);
    for(const U of [u-len*.39,u+len*.39]){
      for(const V of [v-.174,v+.174])B('deepIron',U-.037,U+.037,.025,.399,V-.038,V+.038);
      line('deepCopper',U,.20,v-.191,U,.20,v+.191,.022);
    }
    hit(u-len/2,u+len/2,v-.25,v+.25);
  }
  function rag(u,y,v,w,d,mat){
    const prev=[];
    for(let i=0;i<9;i++){
      const U=u+(i/8-.5)*w;
      const row=Array.from({length:8},(_,j)=>p(U,DEEP_FLOOR+y+.016*Math.sin(i*2.12+j*.63)+.009*Math.cos(j*1.9),v+(j/7-.5)*d));
      if(i)for(let j=0;j<7;j++)k.quad(mat,prev[j+1],row[j+1],row[j],prev[j],.48,i*.12+j*.025);
      prev.splice(0,8,...row);
    }
  }
  function rug(u,v,w,d,mat){
    B('deepSeam',u-w/2,u+w/2,.008,.015,v-d/2,v+d/2);
    B(mat,u-w/2+.036,u+w/2-.036,.015,.022,v-d/2+.037,v+d/2-.037);
    for(let j=1;j<4;j++){
      const L=j%2===0?.053:.028;
      const U=u+(j-2)*w*.27;
      B('deepSeam',U-L,U+L,.021,.024,v-d*.42,v+d*.42);
    }
  }
  function footpaths(){
    for(const y of [.399,.866]){
      for(const side of [-1,1]){
        const v=side<0?-6.395:6.779;
        for(const [u,U] of [[-14.59,-11.82],[-11.81,-6.23],[-6.22,-.67],[-.66,2.30]])
          line('deepDamp',u,y,v,U,y+.009,v,.017);
      }
    }
  }
  function bottle(u,v,y,s=1,material='deepBlueJar'){
    drum(material,u,y+.102*s,v,.044*s,.199*s);
    drum(material,u,y+.215*s,v,.042*s,.045*s,taper);
    drum('deepSoot',u,y+.246*s,v,.024*s,.035*s);
    drum('deepLinen',u,y+.106*s,v,.0447*s,.064*s);
  }
  function lanternDesk(u,v,y,r=.09,shade='deepRose'){
    drum('deepCopper',u,y+.021,v,.087,.043,taper);
    drum('deepIron',u,y+.101,v,.018,.13);
    drum(shade,u,y+.235,v,r,.115,taper);drum('deepCopper',u,y+.285,v,r*.78,.017);
  }
  function cabinet(u,v,width,dir){
    const s=v-.255,d=v+.255;
    for(const U of [u-width/2+.038,u+width/2-.038])for(const V of [s+.035,d-.035])
      B('deepIron',U-.034,U+.034,.018,.135,V-.032,V+.032);
    B('deepWalnut',u-width/2,u+width/2,.12,.674,s,d);B('deepEdge',u-width/2-.022,u+width/2+.022,.675,.718,s-.019,d+.019);
    const face=dir>.0?d:s,back=face+dir*.019;
    for(const [y,Y] of [[.166,.372],[.389,.638]]){
      B('deepSoot',u-width/2+.026,u+width/2-.026,y,Y,Math.min(face,back),Math.max(face,back));
      const v=back+.036*dir,h=(y+Y)/2;
      line('deepCopper',u-.074,h,v,u+.074,h,v,.013);
      for(const U of [u-.074,u+.074])line('deepIron',U,h,back,U,h,v,.012);
    }
    hit(u-width/2-.021,u+width/2+.021,s-.02,d+.02);
    return .718;
  }
  const prop=new T.LatheGeometry([
    new T.Vector2(0,0),new T.Vector2(.078,0),new T.Vector2(.092,.021),new T.Vector2(.090,.038),
    new T.Vector2(.047,.053),new T.Vector2(.039,.081),new T.Vector2(.051,.112),new T.Vector2(.058,.160),
    new T.Vector2(.048,.207),new T.Vector2(.029,.240),new T.Vector2(0,.248)
  ],14);
  function toys(u,v,y,n){
    B('deepSoot',u-.207,u+.196,y,y+.023,v-.18,v+.18);
    for(const V of [v-.17,v+.17])line('deepCopper',u-.20,y+.035,V,u+.19,y+.035,V,.010);
    if(n%3===0){
      stamp('toySilicone',prop,u-.082,y+.023,v,[1,1,1]);
      disk('deepCopper',u+.095,y+.049,v-.04,.054);
    }else if(n%3===1){
      stamp('toySage',prop,u-.087,y+.081,v+.11,[.79,.92,.79],.28,-turn);
      ball('wine',u+.074,y+.066,v-.066,.064,.049,.051);
      line('deepCopper',u+.075,y+.060,v-.066,u+.14,y+.049,v-.12,.009);
    }else{
      stamp('toySilicone',prop,u-.080,y+.02,v+.037,[.68,.66,.68]);
      stamp('toySage',prop,u+.090,y+.02,v-.030,[.66,.82,.66]);
    }
  }
  function supplyShelf(u,v,side){
    const V=v+side*.28;
    for(const U of [u-.565,u+.565])B('deepIron',U-.025,U+.025,.014,1.10,v-.234,v+.234);
    for(const y of [.29,.65,1.10]){
      B('deepWalnut',u-.606,u+.606,y-.044,y,v-.256,v+.256);
      B('deepCopper',u-.59,u+.59,y-.036,y-.018,V-.015,V+.015);
    }
    B('deepSoot',u-.38,u+.30,.29,.47,v-.192,v+.16);
    for(const [i,shade] of ['deepLinen','terracotta','deepLinen','olive'].entries()){
      const U=u+(i-1.5)*.243;
      for(const y of [.685,.749])B(shade,U-.104,U+.104,y-.029,y+.028,v-.162,v+.153);
      B('deepSeam',U-.081,U+.085,.778,.783,v-.093,v+.104);
    }
    if(side>0){
      toys(u-.29,v,1.102,4);
      bottle(u+.207,v+.056,1.104,.89,'toySage');
      bottle(u+.421,v-.083,1.104,.72,'deepBlueJar');
    }else{
      const sink=new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.104,.004),new T.Vector2(.154,.092),
        new T.Vector2(.157,.107),new T.Vector2(.139,.108),new T.Vector2(.104,.033),new T.Vector2(0,.017)],16);
      stamp('china',sink,u-.27,1.103,v,[1,1,1]);sink.dispose();
      bottle(u+.29,v+.052,1.102,.98,'amber');
      B('deepLinen',u+.043,u+.142,1.102,1.139,v-.134,v-.060);
    }
    hit(u-.606,u+.606,v-.26,v+.26);
  }
  function curtain(u,side,mat,wide=true){
    const v0=side<0?-6.08:2.27,v1=side<0?-2.28:6.43,y=2.45;
    line('deepCopper',u,y,v0-.045,u,y,v1+.045,.022);
    for(const v of [v0,(v0+v1)/2,v1]){
      const top=wcRoofAt(id,u,v)-DEEP_FLOOR;
      line('deepIron',u,y+.017,v,u,top+.018,v,.013);
      disk('deepCopper',u,y,v,.044,0);
    }
    const start=wide?v0:side<0?v0:v1-.88,end=wide?v1:side<0?v0+.88:v1;
    const grid=[];
    for(let i=0;i<=30;i++){
      const t=i/30,v=start+(end-start)*t,waves=t*Math.PI*(wide?12:7);
      const row=[];
      for(let j=0;j<=6;j++){
        const f=j/6,y=2.401-2.28*f+Math.sin(waves*.85)*(.021+f*.024);
        row.push(p(u+(Math.sin(waves+f*.55)*.057+.019*Math.sin(t*8))*(.44+f*.56),DEEP_FLOOR+y,v));
      }
      if(i)for(let j=0;j<6;j++)k.quad(mat,grid[j],row[j],row[j+1],grid[j+1],.44,i*.136);
      grid.splice(0,7,...row);
    }
    for(let i=0;i<=6;i++){
      const v=start+(end-start)*i/6;
      disk('deepCopper',u,2.412,v,.029,0);
    }
  }
  function bed(u,v,side,mat,quilt,n){
    const head=v+side*1.23,foot=v-side*1.23;
    B('deepWalnut',u-1.22,u+1.22,.24,.456,v-1.23,v+1.23);
    for(const U of [u-1.13,u+1.13])for(const V of [v-1.12,v+1.12]){
      B('deepWalnut',U-.055,U+.055,.018,.24,V-.060,V+.060);
      B('deepCopper',U-.058,U+.058,.017,.057,V-.063,V+.063);
    }
    B('deepLinen',u-1.19,u+1.19,.454,.636,v-1.191,v+1.19);
    for(const [a,z] of [[u-1.18,u+1.18]])for(const V of [v-1.182,v+1.182])
      line('deepSeam',a,.610,V,z,.610,V,.012);
    B('deepWalnut',u-1.25,u+1.25,.30,1.215,head-.057,head+.057);
    const inner=head-side*.068;
    B(mat,u-1.13,u+1.13,.662,1.154,inner-.019,inner+.019);
    for(let i=0;i<9;i++){
      const U=u-1.045+i*.261;
      ball('deepCopper',U,1.085,inner-side*.024,.018,.018,.014);
    }
    for(const [i,X] of [-.56,.54].entries()){
      ball(n%2===0?'deepLinen':'deepSeam',u+X,.686,head-side*.42,.443,.097,.229,(i===0?.08:-.12)*side);
      ball(mat,u+X+(i===0?.27:-.29),.693,head-side*.72,.229,.113,.183,side*(i===0?-.27:.11));
    }
    rag(u,.664,v-side*.409,2.34,1.54,quilt);
    rag(u+(n%2===0?.17:-.37),.715,foot+side*.32,1.84,.36,mat);
    B('deepWalnut',u-1.219,u+1.219,.31,.483,foot-.034,foot+.034);
    hit(u-1.24,u+1.24,v-1.25,v+1.25);
  }

  let animate;
  if(id==='deepLanding'){
    framed('welcome',3.81,1.52,-2.548,1.49,.97,-turn);
    bench(3.83,-2.19,1.63,'wine');
    lantern(3.88,2.18,.22);rug(3.74,-.23,1.92,1.54,'petrol');
    B('deepIron',3.53,4.29,.074,.17,1.487,1.667);
    pipe('deepCopper',[3.58,.22,1.68],[5.17,2.04,1.68],.020);
    sconce(3.81,1.52,1.791,'deepRose',-1);
  }else if(id==='deepLounge'){
    footpaths();
    for(const u of [.3,-3.78,-7.92,-12.00])rug(u,.01,2.89,2.36,u===-7.92?'wine':'petrol');
    const cable=[1.70,-1.95,-5.60,-9.25,-13.64];
    for(const [i,u] of cable.entries()){
      const top=wcRoofAt(id,u,.17)-DEEP_FLOOR;
      line('deepIron',u,top,.17,u,2.74,.17,.016);
      if(i>0){
        const prev=cable[i-1],mid=(prev+u)/2;
        line('deepCopper',prev,2.74,.17,mid,2.68,.17,.010);
        line('deepCopper',mid,2.68,.17,u,2.74,.17,.010);
        ball('deepGold',mid,2.66,.17,.025,.039,.025);
      }
    }
    for(const [i,{u,mat,quilt}] of bays.entries())for(const side of [-1,1]){
      const v=side<0?-4.69:4.95,front=v-side*1.96,tagY=1.78,back=v+side*1.49;
      rug(u,v-side*.64,3.38,2.93,mat);
      bed(u,v,side,mat,quilt,i+(side>0?1:0));
      const U=u+1.67,V=v+side*.65,y=cabinet(U,V,.66,-side);
      lanternDesk(U+.088,V+side*.07,y,.083,i===1&&side===1?'deepBlue':'deepRose');
      bottle(U-.16,V-side*.070,y,.75,i%2===0?'deepBlueJar':'amber');
      const trayU=u-1.66,trayV=v+side*.63;
      const Y=cabinet(trayU,trayV,.65,-side);
      toys(trayU,trayV,Y+.003,i+(side>0?1:0));
      const su=i%2===0?'sun':'moon';
      deepTile(su,u,tagY,back,.99,1.04,side*turn);
      line('deepWalnut',u-.58,2.28,back+.017*side,u+.58,2.28,back+.017*side,.021);
      lantern(u,2.12,front+.80*side,i===1&&side===1?'deepBlue':'deepGold',.109);
    }
    for(const u of [1.70,-2.57,-8.03,-13.22]){
      curtain(u,-1,u===-8.03?'petrol':'plum',u!==1.70);
      curtain(u,1,u===-8.03?'petrol':'wine',u!==-13.22&&u!==1.70);
    }
    framed('cabinet',2.375,1.56,3.65,1.38,.97,Math.PI);
    framed('rest',2.375,1.55,-3.78,1.43,.94,Math.PI);
    supplyShelf(1.70,3.65,1);
    supplyShelf(1.70,-3.78,-1);
    for(const [u,v] of [[1.76,-5.2],[-13.77,4.97]]){
      bench(u,v,1.12,'petrol');
      for(let i=0;i<3;i++)ball(i===1?'olive':'deepLinen',u+(i-1)*.27,.558,v,.133,.044,.129,i*.14);
    }
    lantern(-13.64,2.43,.17,'deepRose');
    framed('orb',-14.639,1.67,-2.07,1.22,.94,0);
  }else{
    const u=-19.64,v=.20;
    deepTile('chalk',u,.029,v,4.9,4.9,0,-turn,.10);
    drum('deepSoot',u,.09,v,.91,.18);drum('orbStone',u,.276,v,.76,.19,taper);
    drum('deepCopper',u,.398,v,.663,.062);drum('orbStone',u,.530,v,.605,.202,taper);
    drum('deepIron',u,.654,v,.596,.049);disk('deepCopper',u,.690,v,.503);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,U=u+Math.cos(a)*.517,V=v+Math.sin(a)*.517;
      drum('deepCopper',U,.704,V,.055,.16,taper);
      drum(i%2===0?'deepBlue':'violetGlass',U,.798,V,.034,.044);
    }
    hit(u-.70,u+.70,v-.70,v+.70);
    for(let i=0;i<15;i++){
      const a=i*Math.PI*2/15,U=u+Math.cos(a)*2.19,V=v+Math.sin(a)*2.19;
      const y=.09+rand()*.14;
      drum('orbStone',U,.038,V,.121,.073);
      drum('deepWax',U,.082+y*.5,V,.039+rand()*.014,y);
      ball('deepGold',U,.087+y,V,.014,.039,.014);
    }
    for(const [V,sign,tile] of [[-3.844,1,'moon'],[4.238,-1,'tide']]){
      const yaw=-sign*turn;
      deepTile(tile,-19.73,1.54,V,1.63,1.52,yaw);
      line('deepCopper',-20.64,2.33,V+sign*.03,-18.80,2.33,V+sign*.03,.022);
      sconce(-17.33,1.84,V,'violetGlass',sign);
      sconce(-21.62,1.84,V,'deepBlue',sign);
    }
    framed('log',-21.96,1.73,-1.87,1.40,.88,0);
    deepTile('sun',-21.94,1.65,1.58,1.55,1.64,0);
    line('deepCopper',-21.97,2.50,.65,-21.97,2.50,2.52,.032);
    const Y=cabinet(-21.48,-2.88,1.06,1);
    for(let j=0;j<4;j++)bottle(-21.83+j*.216,-2.91,Y,.76+rand()*.55,j%2===0?'deepBlueJar':'amber');
    const A=cabinet(-16.78,2.88,.87,-1);
    B('deepWalnut',-17.06,-16.77,A,A+.038,2.67,2.95);
    B('deepLinen',-17.04,-16.79,A+.039,A+.058,2.70,2.93);
    // Mackled copper pickup loops and bowls tie the occult props to the HQ's
    // radio workshop; the orb has no physical wiring.
    for(const [U,V,h,r] of [[-20.95,2.97,1.42,.22],[-20.71,2.97,1.10,.17],[-21.17,2.97,.96,.125]]){
      line('deepCopper',U,2.43,V,U,h,V,.012);
      stamp('deepCopper',hoop,U,h,V,[r,r,r],turn);
    }
    lantern(-16.07,2.22,-2.3,'deepGold');
    lantern(-21.30,2.19,2.57,'violetGlass');
    animate=makeOrb(T,room,u,v);
  }
  for(const g of [sphere,cylinder,taper,hoop,prop])g.dispose();
  return animate;
}

function makeOrb(T,room,u,v){
  const mount=new T.Group();mount.name='Moosfunk · Kugel des Nachhalls';
  mount.position.fromArray(p(u,DEEP_FLOOR+1.53,v));room.add(mount);
  const time={value:0};
  const vertexShader=`
    varying vec3 origin;
    varying vec3 n;
    varying vec3 sight;
    void main(){
      origin=normalize(position);
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      n=normalize(normalMatrix*normal);
      sight=-mv.xyz;
      gl_Position=projectionMatrix*mv;
    }`;
  const core=new T.Mesh(new T.SphereGeometry(.553,42,28),new T.ShaderMaterial({
    uniforms:{time},vertexShader,fragmentShader:`
      varying vec3 origin;
      varying vec3 n;
      varying vec3 sight;
      uniform float time;
      void main(){
        vec3 q=normalize(origin);
        float c=cos(time*0.37),s=sin(time*0.37);
        q.xz=mat2(c,s,-s,c)*q.xz;
        float ribbon=sin(11.0*q.y+6.0*sin(5.0*q.x+4.0*q.z-time*0.43)+sin(13.0*q.z-time));
        float vein=pow(1.0-abs(ribbon),3.9);
        float web=pow(abs(sin(12.0*q.x+4.0*q.y+sin(8.0*q.z)*2.7)),5.3);
        float face=max(0.0,dot(normalize(n),normalize(sight)));
        vec3 coal=vec3(.027,.055,.089),violet=vec3(.29,.08,.63),jade=vec3(.16,.98,.65);
        vec3 col=mix(coal,mix(violet,jade,clamp(.50+.41*sin(6.0*q.y+time*.48)+.15*q.x,0.0,1.0)),.30+.51*web);
        col+=vein*(jade*.71+vec3(.32,.35,.55)*web);
        col+=pow(1.0-face,3.0)*vec3(.28,.53,.49);
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  const corona=new T.Mesh(new T.SphereGeometry(.633,32,20),new T.ShaderMaterial({
    uniforms:{time},vertexShader,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fragmentShader:`
      varying vec3 origin;
      varying vec3 n;
      varying vec3 sight;
      uniform float time;
      void main(){
        float face=max(0.0,dot(normalize(n),normalize(sight)));
        float f=sin(12.0*origin.y+time*.74)*sin(11.0*origin.x-4.0*origin.z-time*.57);
        vec3 wash=mix(vec3(.47,.21,.75),vec3(.12,.81,.54),.5+.34*f);
        gl_FragColor=vec4(wash,pow(1.0-face,2.4)*(.28+.13*f));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  mount.add(core,corona);
  const rings=[0x8bcaba,0xa08fc7].map((color,i)=>{
    const mesh=new T.Mesh(new T.TorusGeometry(.782+i*.068,.010,6,62),
      new T.MeshBasicMaterial({color,transparent:true,opacity:.47,depthWrite:false,blending:T.AdditiveBlending}));
    mesh.rotation.set(.99+i*1.19,.13+i*.72,i*.45);mount.add(mesh);return mesh;
  });
  const rand=randomSource(54813),motes=[];
  for(let i=0;i<40;i++)motes.push([rand()*Math.PI*2, .64+rand()*.48, (rand()-.5)*.97, .21+rand()*.47]);
  const geo=new T.BufferGeometry(),pts=new T.Float32BufferAttribute(motes.flatMap(([a,r,y])=>[Math.cos(a)*r,y,Math.sin(a)*r]),3);
  pts.setUsage(T.DynamicDrawUsage);geo.setAttribute('position',pts);geo.boundingSphere=new T.Sphere(new T.Vector3(),1.32);
  const sparks=new T.Points(geo,new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`void main(){
      vec4 v=modelViewMatrix*vec4(position,1.0);
      gl_Position=projectionMatrix*v;
      gl_PointSize=clamp(9.5/max(0.5,-v.z),1.0,8.0);
    }`,
    fragmentShader:`void main(){
      float rim=1.0-smoothstep(.05,.49,length(gl_PointCoord-vec2(.5)));
      gl_FragColor=vec4(.45,.88,.71,rim*.86);
      #include <colorspace_fragment>
    }`
  }));mount.add(sparks);
  return dt=>{
    const t=time.value+=Math.min(.1,dt);
    mount.position.y=DEEP_FLOOR+1.53+.062*Math.sin(t*1.29);
    rings[0].rotation.y=.30+t*.26;rings[1].rotation.x=2.05+t*.19;
    corona.scale.setScalar(1+.018*Math.sin(t*2.3));
    for(const [i,[a,r,y,w]] of motes.entries()){
      const angle=a+t*w*(i%2===0?1:-1);
      pts.setXYZ(i,Math.cos(angle)*r,y+.115*Math.sin(angle*2+i),Math.sin(angle)*r);
    }
    pts.needsUpdate=true;
  };
}
