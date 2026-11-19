import {b,DEEP_STAIR as stair,DEEP_RUN,DEEP_FLOOR,p,deepStairY,wcRoofAt} from './park-wc-layout.js';
import {randomSource} from './surface-detail.js';
import {quiltPrint} from './moosfunk-brocade.js';
import {shrineCraft} from './moosfunk-reliquary.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const bays=[{u:.08,mat:'plum',quilt:'terracotta'},{u:-5.28,mat:'petrol',quilt:'olive'},{u:-10.77,mat:'wine',quilt:'plum'}];
export const DEEP_LIGHTS=[
  ...[10.34,8.28,6.25].map(u=>[u,-.70,0xf8bf82,10,4.1,'deepStair',deepStairY(u)-DEEP_FLOOR+1.80]),
  [3.88,.22,0xf7bf85,19,5.6,'deepLanding',2.08],
  ...bays.flatMap(({u},i)=>[
    [u,-3.56,i===1?0xf8bc8e:0xffad91,28,6.8,'deepLounge',2.04],
    [u,3.82,i===1?0xc0c7d1:0xfab49b,29,6.8,'deepLounge',2.04]]),
  [-13.64,.17,0xf7ae92,23,6.1,'deepLounge',2.34],
  // These two sources are hidden with the room, not attached to the scene.
  [-19.64,.20,0xa1d9ca,16,6.6,'deepOrb',1.76],
  [-21.30,2.57,0xa087dc,14,5.4,'deepOrb',2.08],
  [-16.07,-2.3,0xeeb380,11,4.8,'deepOrb',2.03],
  [-24.55,.18,0xffdca4,15,5.8,'deepOrb',2.37],
  [-22.38,-7.38,0xff965a,10,4.9,'deepVotive',1.55],
  [-24.58,-5.30,0xbe6d70,5,3.8,'deepVotive',1.48]
];

export function deepMaterials(T,{painted,stone,cloth,wood}){
  const m=(color,roughness=.87,more={})=>new T.MeshStandardMaterial({color,roughness,...more});
  const grain=(color,n,roughness=.94)=>m(color,roughness,{...stone,normalScale:new T.Vector2(n,n)});
  const textile=(color,side=T.FrontSide)=>m(color,.99,{...cloth,side,normalScale:new T.Vector2(.24,.24)});
  const lamp=(color,emissive,n=.85)=>({material:m(color,.54,{emissive,emissiveIntensity:n}),cast:false});
  return {
    ...Object.fromEntries([0,1,2].map(i=>['quilt'+i,m(0xffffff,.96,{...cloth,map:quiltPrint(T,i),normalScale:new T.Vector2(.31,.31),side:T.DoubleSide})])),
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
    violetGlass:lamp(0xb1a0c9,0xa180e4,.60),orbStone:grain(0x414747,.65,.79),
    oldGilt:m(0xc39c59,.49,{...painted,metalness:.43}),blackBasalt:grain(0x55464b,.83,.73),
    relicBone:grain(0xbda781,.31,.88),boneShade:m(0x382c28,.95)
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
  const bead=new T.SphereGeometry(1,8,6);
  const ball=(mat,u,y,v,x,h,z,a=0)=>stamp(mat,Math.max(x,h,z)<.095?bead:sphere,u,y,v,[x,h,z],a);
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
  const pillow=sphere.clone(),pp=pillow.attributes.position;
  const puff=n=>Math.sign(n)*Math.abs(n)**.53;
  for(let i=0;i<pp.count;i++){
    const x=pp.getX(i),y=pp.getY(i),z=pp.getZ(i);
    pp.setXYZ(i,puff(x),puff(y)*(1-.13*Math.cos(5*x)*Math.cos(4*z)),puff(z));
  }
  pillow.computeVertexNormals();
  const mattress=id==='deepLounge'?new RoundedBoxGeometry(2.38,.20,2.38,2,.055):null;
  function cushion(mat,u,y,v,rx,ry,rz,a){
    stamp(mat,pillow,u,y,v,[rx,ry,rz],a);
    const seam=(j,dy)=>{
      const t=j*Math.PI/16,x=1.003*rx*puff(Math.cos(t)),z=1.003*rz*puff(Math.sin(t));
      return p(u+z*Math.cos(a)-x*Math.sin(a),DEEP_FLOOR+y+dy,v-x*Math.cos(a)-z*Math.sin(a));
    };
    // Narrow woven piping following the same superellipse as the cushion.
    for(let j=0;j<32;j++)k.quad('deepSeam',seam(j,.0038),seam(j+1,.0038),seam(j+1,-.0038),seam(j,-.0038),.40);
  }
  function toys(u,v,y,n){
    B('deepSoot',u-.207,u+.196,y,y+.023,v-.18,v+.18);
    for(const V of [v-.17,v+.17])line('deepCopper',u-.20,y+.035,V,u+.19,y+.035,V,.010);
    if(n===0){
      stamp('toySilicone',prop,u-.082,y+.023,v,[1,1,1]);
      for(const h of [.11,.14,.17])disk('toySage',u-.082,y+h,v,.050);
      disk('deepCopper',u+.095,y+.049,v-.04,.054);
    }else if(n===1){
      // Cordless wand in a felt-lined cradle, with a fluted neck, switch
      // and charging shoe. Local U runs along the length of the tray.
      for(const x of [-.12,.095])B('plum',u+x-.028,u+x+.028,y+.023,y+.068,v-.058,v+.058);
      line('toySage',u-.163,y+.093,v,u+.035,y+.093,v,.043);
      for(let i=0;i<4;i++)line('deepCopper',u+.029+i*.012,y+.093,v,u+.035+i*.012,y+.093,v,.032);
      stamp('toySilicone',pillow,u+.112,y+.096,v,[.049,.052,.065]);
      B('deepSoot',u-.113,u-.046,y+.131,y+.139,v-.014,v+.014);
      ball('deepBlue',u-.071,y+.139,v,.009,.004,.009);
    }else if(n===2){
      // Padded sleep mask with two cupped lobes, brass buckle and ribbon.
      for(const s of [-1,1])ball('plum',u+s*.058,y+.059,v,.052,.032,.084,s*.23);
      B('plum',u-.062,u+.062,y+.041,y+.069,v-.026,v+.020);
      stamp('deepSeam',hoop,u,y+.044,v+.053,[.095,.070,.035],0,-turn);
      B('oldGilt',u+.083,u+.101,y+.046,y+.058,v+.027,v+.059);
    }else if(n===3){
      // Two velvet-lined cuffs, stitched leather edges and an open clasp.
      for(const s of [-1,1]){
        const x=u+s*.096;
        for(const [h,mat] of [[.048,'deepCopper'],[.061,'deepWalnut'],[.074,'wine'],[.087,'deepWalnut']])
          stamp(mat,hoop,x,y+h,v,[.071,.083,.076],0,-turn);
        B('oldGilt',x-.024,x+.024,y+.05,y+.085,v+.070,v+.091);
      }
      disk('deepCopper',u,y+.052,v,.024);
    }else if(n===4){
      // Hand-cranked massage roller: two independent ribbed drums and fork.
      for(const s of [-1,1]){
        const V=v+s*.052;
        line('toySage',u-.018,y+.076,V,u+.109,y+.076,V,.042);
        for(let j=0;j<5;j++)line('deepWalnut',u-.008+j*.023,y+.076,V,u-.001+j*.023,y+.076,V,.045);
        line('deepCopper',u+.13,y+.076,V,u+.13,y+.076,v,.014);
        line('oldGilt',u-.046,y+.076,V,u-.074,y+.076,v,.011);
      }
      line('deepWalnut',u-.165,y+.076,v,u-.069,y+.076,v,.023);
    }else{
      // Two weighted glass beads nested in a shallow fitted case.
      B('deepWalnut',u-.162,u+.162,y+.023,y+.052,v-.074,v+.074);
      for(const s of [-1,1]){
        ball('deepBlueJar',u+s*.067,y+.097,v,.051,.050,.062);
        disk('oldGilt',u+s*.067,y+.069,v,.047);
      }
      line('plum',u-.03,y+.095,v,u+.03,y+.095,v,.008);
      stamp('plum',hoop,u+.133,y+.063,v+.015,[.039,.029,.028],0,-turn);
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
    stamp('deepLinen',mattress,u,.541,v,[1,1,1]);
    for(const [a,z] of [[u-1.18,u+1.18]])for(const V of [v-1.182,v+1.182])
      line('deepSeam',a,.610,V,z,.610,V,.012);
    B('deepWalnut',u-1.25,u+1.25,.30,1.215,head-.057,head+.057);
    const inner=head-side*.068;
    B(mat,u-1.13,u+1.13,.662,1.154,inner-.019,inner+.019);
    // Turned finials and an arched, upholstered crest. Quilt and mattress
    // fill the frame; the decorative posts stay inside its plan envelope.
    for(const s of [-1,1]){
      const U=u+s*1.168;
      drum('deepWalnut',U,.82,head,.073,.98);
      for(const H of [.414,1.157,1.291])drum('deepCopper',U,H,head,.084,.032);
      ball('deepWalnut',U,1.369,head,.080,.086,.08);
    }
    const finish='quilt'+(n%3);
    for(let j=0;j<24;j++){
      const t=j/24,T=(j+1)/24,h=t=>1.135+.27*Math.sin(t*Math.PI)**1.55;
      const x=u-1.125+t*2.25,X=u-1.125+T*2.25,z=inner-side*.024;
      const coords=[[x,1.105,z],[X,1.105,z],[X,h(T),z],[x,h(t),z]];
      const pts=coords.map(([U,H,V])=>p(U,DEEP_FLOOR+H,V));
      k.quad(finish,...(side>0?pts.reverse():pts),.72);
      line('deepWalnut',x,h(t),z,X,h(T),z,.033);
    }
    for(let i=0;i<9;i++){
      const U=u-1.045+i*.261;
      ball('deepCopper',U,1.085,inner-side*.024,.018,.018,.014);
    }
    for(const [i,X] of [-.56,.54].entries()){
      cushion(n%2===0?'deepLinen':'deepSeam',u+X,.721,head-side*.42,.237,.103,.444,(i===0?.08:-.12)*side);
      cushion(mat,u+X+(i===0?.27:-.29),.736,head-side*.72,.179,.124,.221,side*(i===0?-.27:.11));
    }
    // One continuous pieced quilt, including its side drops. Colour blocks
    // and stitched valleys are the quilt surface itself, not stacked decals.
    const q=(i,j)=>{
      const a=i/24,t=j/16,edge=Math.min(a,1-a),drop=Math.max(0,1-edge*24);
      const h=.682+.042*Math.abs(Math.sin(i*Math.PI/4)*Math.sin(j*Math.PI/4))+.011*Math.sin(j*.94+i*.55);
      return p(u+(a-.5)*2.55,DEEP_FLOOR+h-drop*(.215+.043*Math.sin(j*.66)),v+side*(-1.18+1.60*t));
    };
    for(let i=0;i<24;i++)for(let j=0;j<16;j++){
      const swatch=i===0||i===23||j===0?'deepSeam':finish;
      const cells=[[i,j+1],[i+1,j+1],[i+1,j],[i,j]];
      if(side<0)cells.reverse();
      for(const ids of [[0,1,2],[0,2,3]]){
        const ij=ids.map(idx=>cells[idx]);
        k.triangle(swatch,...ij.map(([a,b])=>q(a,b)),ij.flatMap(([a,b])=>[a/10,b/10]));
      }
    }
    // Rolled throw: rests on the quilt and has bound ends, not a hovering sheet.
    const roll=foot+side*.28;
    line(mat,u-.83,.772,roll,u+.78,.772,roll,.086);
    for(const d of [-.77,-.71,.66,.72])line('deepSeam',u+d,.772,roll,u+d+.014,.772,roll,.089);
    B('deepWalnut',u-1.219,u+1.219,.31,.483,foot-.034,foot+.034);
    for(const s of [-1,1]){
      const U=u+s*.576,V=foot-side*.049;
      B('darkWood',U-.508,U+.508,.32,.461,V-.013,V+.013);
      for(const x of [U-.083,U+.083])line('deepCopper',x,.404,V,x,.404,V-side*.042,.013);
      line('deepCopper',U-.083,.404,V-side*.042,U+.083,.404,V-side*.042,.014);
    }
    hit(u-1.24,u+1.24,v-1.25,v+1.25);
  }

  function votive(U,V,y,h,shade='deepGold'){
    drum('deepCopper',U,y+.014,V,.076,.028);
    drum('deepWax',U,y+.029+h/2,V,.040,h);
    for(let j=0;j<3;j++){
      const a=j*2.19+.27,H=h*(.13+.12*j);
      ball('deepWax',U+Math.cos(a)*.038,y+h+.025-H,V+Math.sin(a)*.038,.010,H,.010);
    }
    line('deepSoot',U,y+h+.025,V,U,y+h+.059,V,.007);
    ball(shade,U,y+h+.073,V,.016,.042,.016);
  }
  function watcher(U,V){
    // An owl assembled from beaten copper scales and old radio insulators.
    B('orbStone',U-.34,U+.34,.01,.125,V-.34,V+.34);
    drum('blackBasalt',U,.54,V,.235,.83,taper);
    drum('oldGilt',U,.94,V,.256,.055);drum('orbStone',U,1.01,V,.31,.09);
    ball('deepCopper',U,1.32,V,.22,.30,.18);
    ball('deepSoot',U+.034,1.64,V,.232,.184,.157);
    for(const side of [-1,1]){
      ball('oldGilt',U+.156,1.65,V+side*.102,.083,.071,.039);
      ball('deepSoot',U+.188,1.651,V+side*.102,.046,.052,.023);
      line('oldGilt',U+.185,1.683,V+side*.034,U+.134,1.746,V+side*.189,.022);
      ball('deepWax',U+.21,1.662,V+side*.095,.014,.012,.01);
      craft.pinion(U,V,side);
      line('deepCopper',U,1.74,V+side*.115,U-.041,1.85,V+side*.19,.034);
      for(let j=0;j<4;j++)ball(j%2?'oldGilt':'deepCopper',U-.03+j*.028,1.27+j*.041,V+side*(.156+j*.008),.057,.167,.083,.12*side);
    }
    stamp('oldGilt',taper,U+.193,1.56,V,[.036,.095,.043],0,Math.PI);
    hit(U-.34,U+.34,V-.34,V+.34);
  }
  const craft=shrineCraft(T,m,{B,pipe,ball,drum,disk,line,hit,votive,stamp});
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
      const U=u+1.79,V=v+side*.65,y=cabinet(U,V,.66,-side);
      lanternDesk(U+.088,V+side*.07,y,.083,i===1&&side===1?'deepBlue':'deepRose');
      bottle(U-.16,V-side*.070,y,.75,i%2===0?'deepBlueJar':'amber');
      const trayU=u-1.79,trayV=v+side*.63;
      const Y=cabinet(trayU,trayV,.65,-side);
      toys(trayU,trayV,Y+.003,2*i+Number(side>0));
      const art=['poppy','nightbird','hills','dance','fern','moth'],idx=2*i+Number(side>0);
      const wall=side<0?-6.32:6.71;
      framed(art[idx],u,tagY,wall,1.22,1.08,side*turn);
      framed(art[(idx+2)%6],u+1.02,tagY-.13,wall,.48,.61,side*turn);
      // Brass petal shade and textile festoon gathered above each headboard.
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4;
        ball(idx%2?'oldGilt':'plum',U+.088+.076*Math.cos(a),y+.244,V+side*.07+.076*Math.sin(a),.031,.065,.029);
      }
      const hooks=[u-1.43,u,u+1.43];
      for(let j=0;j<2;j++)for(let n=0;n<8;n++){
        const pt=f=>[hooks[j]+1.43*f,2.42-.23*Math.sin(f*Math.PI),back-side*.25];
        pipe('deepCopper',pt(n/8),pt((n+1)/8),.009);
        if(n%2){const [x,h,z]=pt(n/8);ball(idx%2?'deepRose':'deepGold',x,h-.027,z,.025,.034,.025);}
      }
      for(const x of hooks)line('deepIron',x,2.42,back-side*.25,x,wcRoofAt(id,x,back-side*.25)-DEEP_FLOOR+.05,back-side*.25,.014);
      lantern(u,2.12,front+.80*side,i===1&&side===1?'deepBlue':'deepGold',.109);
    }
    for(const u of [2.32,-2.57,-8.03,-13.22]){
      curtain(u,-1,u===-8.03?'petrol':'plum',u!==2.32);
      curtain(u,1,u===-8.03?'petrol':'wine',u!==-13.22&&u!==2.32);
    }
    framed('cabinet',2.325,1.71,2.72,1.38,.97,Math.PI);
    framed('rest',2.325,1.71,-2.68,1.43,.94,Math.PI);
    supplyShelf(1.69,2.58,1);
    supplyShelf(1.69,-2.49,-1);
    for(const [u,v] of [[-13.91,-3.58],[-13.91,4.97]]){
      bench(u,v,1.12,'petrol');
      for(let i=0;i<3;i++)ball(i===1?'olive':'deepLinen',u+(i-1)*.27,.558,v,.133,.044,.129,i*.14);
    }
    lantern(-13.64,2.43,.17,'deepRose');
    framed('orb',-14.639,1.67,-2.07,1.22,.94,0);
  }else if(id==='deepOrb'){
    const u=-19.64,v=.20;
    deepTile('chalk',u,.029,v,4.9,4.9,0,-turn,.10);
    craft.crown(u,v);
    hit(u-.70,u+.70,v-.70,v+.70);
    for(let i=0;i<15;i++){
      const a=i*Math.PI*2/15,U=u+Math.cos(a)*2.19,V=v+Math.sin(a)*2.19;
      const y=.09+rand()*.14;
      drum('orbStone',U,.038,V,.121,.073);
      drum('deepWax',U,.082+y*.5,V,.039+rand()*.014,y);
      ball('deepGold',U,.087+y,V,.014,.039,.014);
    }
    for(const [V,sign,tile] of [[-3.844,1,'oracle'],[4.238,-1,'canticle']]){
      const yaw=-sign*turn;
      framed(tile,-19.73,1.54,V,1.47,1.78,yaw);
      for(const U of [-20.63,-18.83]){
        line('deepWalnut',U,.47,V+sign*.06,U,2.36,V+sign*.06,.049);
        line('oldGilt',U,2.36,V+sign*.06,-19.73,2.61,V+sign*.06,.031);
      }
      sconce(-17.33,1.84,V,'violetGlass',sign);
      sconce(-21.62,1.84,V,'deepBlue',sign);
    }
    framed('log',-25.47,1.56,-2.66,1.06,.83,0);
    framed('canticle',-25.47,1.55,2.97,1.05,1.34,0);
    // The gilt reredos reads through the orb from the door. Its rays have
    // hammered tips and an actual backing and foot, not floating decals.
    const wallU=-25.17;
    B('blackBasalt',wallU-.31,wallU+.19,0,.26,-1.45,1.85);
    B('deepWalnut',wallU-.19,wallU,.25,2.71,-1.28,1.68);
    framed('eclipse',wallU+.049,1.58,.20,1.52,1.76,0);
    for(let j=0;j<32;j++){
      const a=j*Math.PI/16,h=Math.sin(a),z=Math.cos(a),r=.90,R=j%2?1.10:1.26;
      line('oldGilt',wallU+.104,1.56+h*r,.20+z*r,wallU+.104,1.56+h*R,.20+z*R,.016);
      ball('deepCopper',wallU+.104,1.56+h*R,.20+z*R,.026,.026,.020);
    }
    hit(wallU-.31,wallU+.19,-1.45,1.85);
    for(const side of [-1,1]){
      watcher(-23.59,.20+side*1.65);
      for(let j=0;j<4;j++)votive(wallU+.09,.20+side*(.83+j*.14),.26,.13+j*.026);
    }
    for(const s of [-1,1])lantern(-24.55,2.18,.18+s*1.97,'deepGold',.084);
    framed('vigil',-22.18,1.56,-3.84,.69,.93,-turn);
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
  }else if(id==='deepVotive'){
    const U=-22.38,V=-7.45;
    // An abandoned altar: dark basalt on two battered trestles, copper
    // corner shoes, linen, old stains and a votive ledger. No occupants.
    for(const s of [-1,1]){
      const x=U+s*.77;
      B('orbStone',x-.252,x+.252,.01,.14,V-.40,V+.40);
      B('blackBasalt',x-.18,x+.18,.14,.82,V-.32,V+.32);
      B('deepCopper',x-.186,x+.186,.66,.72,V-.33,V+.33);
    }
    B('deepIron',U-1.18,U+1.18,.803,.858,V-.50,V+.50);
    B('blackBasalt',U-1.27,U+1.27,.858,1.023,V-.57,V+.57);
    for(const s of [-1,1])for(const f of [-1,1]){
      const x=U+s*1.19,z=V+f*.49;
      B('deepCopper',x-.079,x+.079,.89,.99,z-.081,z+.081);
      drum('oldGilt',x,1.027,z,.021,.013);
    }
    hit(U-1.27,U+1.27,V-.57,V+.57);
    deepTile('stain',U+.23,1.027,V,1.10,1.61,.23,-turn);
    deepTile('stain',U+.06,.007,V+.97,1.67,2.34,-.42,-turn);
    deepTile('stain',U-1.02,.006,V+.78,.44,.76,.61,-turn);
    craft.charnel(U,V);
    framed('ashes',-20.17,1.42,-7.78,1.12,1.48,Math.PI);
    framed('renewal',-24.99,1.70,-5.54,.94,1.32,0);
    framed('obit',U+.89,1.54,-4.12,1.15,1.36,turn);
    // Oxidised runs hang down the front lip rather than hovering over it.
    deepTile('stain',U+.24,.947,V+.573,.84,.14,-turn);
    deepTile('stain',U+.47,.009,V+.68,.82,1.10,-.72,-turn);
    for(let i=0;i<9;i++){
      const n=i/8,x=U+.18+Math.sin(i*11)*.33;
      deepTile('stain',x,.011,V+1.23+n*1.15,.15+.12*(1-n),.23-.08*n,i*.71,-turn);
    }
    for(const side of [-1,1]){
      const x=U+side*1.24;
      line('deepIron',x,.11,-8.85,x,2.28,-8.85,.039);
      line('deepCopper',x,2.28,-8.85,U+side*.19,2.55,-8.85,.028);
      for(let j=0;j<4;j++)votive(x+side*(j%2)*.17,-8.53+(j>>1)*.16,0,.19+j*.063);
    }
    for(let j=0;j<3;j++)votive(U-.81+j*.22,V-.34,1.023,.23-j*.041);
    const shelf=cabinet(-20.84,-5.36,.94,1);
    B('wine',-21.12,-20.80,shelf,shelf+.045,-5.49,-5.24);
    B('deepLinen',-21.11,-20.81,shelf+.046,shelf+.064,-5.48,-5.25);
    for(let i=0;i<6;i++)B('deepSoot',-21.071,-20.85+(i%2)*.018,shelf+.064,shelf+.066,-5.44+i*.028,-5.437+i*.028);
    bottle(-20.61,-5.32,shelf,.85,'amber');
    sconce(-24.55,1.53,-8.88,'deepRose',1);
    lantern(-24.58,1.63,-5.30,'deepRose',.075);
  }
  for(const g of [sphere,bead,pillow,cylinder,taper,hoop,prop])g.dispose();
  mattress?.dispose();
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
        // Different apparent depths for the cloudy body and the orbit of
        // fine gold inclusions, instead of uniform white latitude stripes.
        vec3 inner=q+0.20*normalize(sight)*(.3+.7*max(dot(normalize(n),normalize(sight)),0.0));
        float ribbon=sin(8.0*inner.y+3.4*sin(4.0*inner.x+3.0*inner.z-time*0.30)+sin(8.0*inner.z-time*.56));
        float vein=pow(1.0-abs(ribbon),5.9);
        float web=.5+.5*sin(6.0*inner.x+3.0*inner.y+2.8*sin(4.0*inner.z+.4*time));
        float face=max(0.0,dot(normalize(n),normalize(sight)));
        vec3 coal=vec3(.027,.055,.089),violet=vec3(.29,.08,.63),jade=vec3(.16,.98,.65);
        vec3 col=mix(coal,mix(violet,jade,clamp(.50+.41*sin(6.0*q.y+time*.48)+.15*q.x,0.0,1.0)),.30+.51*web);
        col+=vein*(jade*.46+vec3(.12,.19,.39)*web);
        float latitude=sin(7.0*q.y+2.8*sin(3.0*atan(q.z,q.x)+time*.21));
        float gilding=(1.0-smoothstep(.017,.079,abs(latitude)))*smoothstep(.24,.74,web);
        float heart=pow(max(dot(q,normalize(vec3(.4*sin(time*.18),.49,.64))),0.0),9.0);
        col+=vec3(1.0,.56,.22)*heart*(.63+.12*sin(time*1.4));
        col+=vec3(.92,.52,.16)*gilding*(.42+.35*face);
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
  const rings=[0x8bcaba,0xa08fc7,0xffcf7a].map((color,i)=>{
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
    rings[2].rotation.set(1.37+.11*Math.sin(t*.41),.25*Math.sin(t*.26),.32+t*.08);
    corona.scale.setScalar(1+.018*Math.sin(t*2.3));
    for(const [i,[a,r,y,w]] of motes.entries()){
      const angle=a+t*w*(i%2===0?1:-1);
      pts.setXYZ(i,Math.cos(angle)*r,y+.115*Math.sin(angle*2+i),Math.sin(angle)*r);
    }
    pts.needsUpdate=true;
  };
}
