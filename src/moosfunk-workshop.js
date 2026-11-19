import {b,p} from './park-wc-layout.js';
import {intercomSpot} from './moosfunk-quest.js';
import {shopKit} from './moosfunk-shop-kit.js';

export function furnishWorkshop(T,kit,quest){
  const {box,rod,line,cord,sign,frame,drawer,utilityLamp,tape,rounded,stamp,bolt,foot,roof,rand,pin,sphere,dispose}=shopKit(T,kit,'workshop');
  const {hqTile,shopTile,room,wear}=kit,pi=Math.PI;
  const rim=new T.TorusGeometry(1,.047,7,30),pulse=new T.SphereGeometry(.021,10,7);
  // Portal-side crates are a returns counter; the entry and plenum exit stay clear.
  frame(18.64,5.45,1.94,.75,.94,'mfBench');
  for(const [j,U] of [18.05,18.64,19.21].entries()){
    const V=5.46,mat=['green','toolRed','blueTin'][j];
    box(mat,U,.947,V,.51,.105,.53);
    for(const s of [-1,1]){
      box(mat,U+s*.24,1.012,V,.045,.23,.53);
      box('edge',U+s*.24,1.238,V,.051,.016,.54);
      box(mat,U,1.012,V+s*.247,.442,.207,.039);
    }
    for(let n=0;n<4;n++)tape(U-.14+.083*n,1.057,V+.115*(-1)**n,.052+rand()*.024,.031);
    box('paper',U,1.094,V-.272,.236,.068,.007);
  }
  sign('returns',18.66,1.836,4.953,1.82,.64);
  sign('drawers',14.346,1.84,7.06,.94,.53,0);
  box('gunmetal',14.57,.081,7.05,.68,1.37,1.06);foot(14.57,7.05,.70,1.07);
  for(let j=0;j<6;j++){
    const v=6.78+j%2*.52,y=.147+Math.floor(j/2)*.402;
    box(j%3?'green':'mfBlue',14.924,y,v,.054,.382,.465);
    for(const yy of [y+.089,y+.328])bolt('brass',14.963,yy,v+.182,.0085);
    box('paper',14.957,y+.250,v-.12,.011,.069,.16);
    rod('mfCast',14.974,y+.139,v-.057,14.974,y+.225,v-.057,.014);
  }
  // Single strong wall assembly, with room for the stone and the M–7 story.
  frame(17.68,11.00,3.72,1.07,.918);
  for(const [U,j] of [[16.41,0],[18.92,1]]){
    box('gunmetal',U,.072,11.04,.62,.75,.70);
    for(let n=0;n<4;n++)drawer(U,.096+n*.182,11.01,.574,.165,.66,1,n===2?'mfBlue':j?'oxide':'green');
  }
  box('rubber',17.64,.918,11.07,2.80,.012,.80);
  box('mfRubber',17.64,.931,11.07,2.74,.005,.74);
  for(const [i,U] of [16.04,16.68,17.32,17.96,18.60,19.24].entries()){
    box(i%2?'darkWood':'gunmetal',U,1.183,11.65,.629,.94,.115);
    box('mfPeg',U,1.208,11.581,.574,.88,.014);
    for(const y of [1.25,2.047])for(const u of [-.267,.267])bolt('steel',U+u,y,11.566,.010);
  }
  // Hand tools with shaped grips, jaws and loops, suspended on little hooks.
  for(const [u,y,len,mat] of [[16.16,1.73,.37,'toolRed'],[17.05,1.66,.39,'blueTape'],[18.51,1.80,.44,'toolRed']]){
    const v=11.534;
    line('gunmetal',[[u,y+.121,11.573],[u,y+.121,v],[u+.013,y+.094,v]],.006);
    rod('mfCast',u,y+.095,v,u-.018,y-len*.39,v,.010);
    rod(mat,u-.018,y-len*.39,v,u-.044,y-len*.83,v,.028);
    rod('rubber',u-.024,y-len*.48,v,u-.041,y-len*.75,v,.029);
    for(const s of [-1,1])rod('edge',u+s*.016,y+.073,v,u+s*.016,y+.103,v,.006);
  }
  // Hammer head and split claw; open-ended spanner; insulated plier jaws.
  rounded('wood',16.41,1.479,11.530,.041,.272,.033,-.08);
  rod('mfCast',16.35,1.613,11.522,16.48,1.613,11.522,.026);
  line('iron',[[16.34,1.613,11.522],[16.315,1.610,11.522],[16.292,1.580,11.520]],.013);
  line('edge',[[18.97,1.49,11.522],[19.02,1.62,11.518],[19.06,1.726,11.521]],.018);
  cord('mfCast',[[19.019,1.772,11.525],[19.03,1.723,11.518],[19.065,1.712,11.515],[19.098,1.741,11.521]],.013,11);
  for(const s of [-1,1]){
    line(s>0?'toolRed':'gunmetal',[[17.27+s*.043,1.515,11.532],[17.27,1.635,11.532],[17.27-s*.015,1.716,11.532]],.012);
  }
  bolt('brass',17.27,1.635,11.519,.011);
  for(const [u,scale] of [[16.74,.92],[18.82,1.09],[19.22,.68]]){
    cord('mfCast',[[u-.018,1.80,11.547],[u-.09*scale,1.60,11.539],[u-.03,1.556,11.533],[u+.05,1.59,11.537],[u+.008,1.80,11.547]],.012,12);
    bolt('brass',u,1.78,11.531,.013);
  }
  sign('diagram',17.543,1.84,11.557,.70,.42,pi/2);
  // MC-7 intercom coordinates shared with the existing E prompt. Its status
  // indicators and fitted switch stay driven by the original quest callback.
  const {u,v}=intercomSpot;
  box('gunmetal',u,.92,v+.215,.63,.262,.386);
  for(const s of [-1,1])box('mfCast',u+s*.262,.945,v+.194,.039,.237,.436);
  rounded('mfBlue',u,1.424,v+.158,.598,.52,.294);
  box('gunmetal',u,1.182,v+.003,.541,.474,.028);
  box('rubber',u-.102,1.292,v-.021,.277,.193,.028);
  for(let j=0;j<9;j++)rod('mfCast',u-.224,1.316+j*.017,v-.038,u+.021,1.316+j*.017,v-.038,.0042);
  for(let j=0;j<3;j++){
    stamp('brass',pin,u-.197+j*.094,1.243,v-.036,[.022,.023,.022],0,pi/2);
    stamp('rubber',pin,u-.197+j*.094,1.243,v-.050,[.015,.022,.015],0,pi/2);
  }
  shopTile('intercom',u,1.572,v-.034,.469,.124,pi/2);
  box('iron',u+.145,1.292,v-.027,.088,.137,.025);
  box('brass',u+.145,1.294,v-.043,.113,.014,.015);
  for(const y of [1.207,1.624])for(const s of [-1,1])bolt('steel',u+s*.245,y,v-.020);
  const status=(name,c)=>{
    const n=new T.Mesh(pulse,new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.3}));
    n.name=name;n.position.fromArray(p(u+.145,b+1.503,v-.040));room.add(n);return n;
  };
  const off=status('M–7 fehlt',0xb94b36),on=status('M–7 · Rückkanal aktiv',0x93b66c);
  const insert=new T.Mesh(new T.BoxGeometry(.041,.072,.058),new T.MeshStandardMaterial({color:0xd8caa4,roughness:.65}));
  insert.position.fromArray(p(u+.145,b+1.365,v-.041));room.add(insert);
  const wired=hqTile('wired',19.31,1.503,11.553,.544,.254,pi/2);
  const repair=hqTile('repair',19.31,1.503,11.553,.544,.254,pi/2);
  const update=phase=>{off.visible=repair.visible=phase!=='wired';on.visible=insert.visible=wired.visible=phase==='wired';};
  if(quest)quest.bind(update);else update('missing');
  cord('rubber',[[u-.26,1.226,v+.183],[u-.53,1.10,v+.181],[u-.72,.969,v+.445],[u-1.07,.957,v+.621]],.013);
  // Analogue tester, plug leads and a small open repairs tray.
  const U=16.63,V=11.102;
  rounded('green',U,1.11,V,.67,.336,.393);
  box('iron',U,1.023,V-.196,.613,.234,.018);
  shopTile('meter',U-.119,1.154,V-.207,.329,.201,pi/2);
  for(const [n,c] of ['toolRed','brass','rubber'].entries()){
    stamp(c,pin,U+.074+n*.076,1.100,V-.225,[.023,.032,.023],0,pi/2);
  }
  for(const [du,c] of [[.08,'toolRed'],[.22,'rubber']]){
    cord(c,[[U+du,1.101,V-.235],[U+du,.964,V-.328],[U+du-.13,.945,V-.46],[U+du-.32,.939,V-.38]],.006,15);
  }
  box('blueTape',18.72,.934,10.81,.51,.024,.30);
  for(const s of [-1,1]){
    box('mfCast',18.72+s*.244,.952,10.81,.019,.046,.30);
    box('mfCast',18.72,.952,10.81+s*.142,.49,.046,.022);
  }
  for(let j=0;j<6;j++)stamp(j%2?'brass':'steel',pin,18.51+j*.076,1.012,10.80+rand()*.07,[.018,.043,.018],0,.52+rand());
  sign('drawers',18.76,2.009,11.552,.64,.285,pi/2);
  // Rebuilt pedal generator: supported wheel frame, actual hubs and spokes,
  // leather saddle, flywheel and one very proud telltale lamp.
  const A=15.39,V0=9.42,R=.37;
  frame(A,V0,1.84,.75,.128,'darkWood');
  wear(A+.36,V0-.07,1.46,2.36,0,.12);
  wear(17.73,10.24,1.17,2.79,1,0);
  wear(15.04,6.13,1.49,1.09,1,-.16);
  for(const s of [-1,1]){
    const X=A+s*.54;
    box('gunmetal',X,.125,V0,.142,.052,.401);
    for(const z of [-.136,.136])bolt('brass',X,.169,V0+z,.013);
    rod('mfCast',X,.158,V0-.117,X,.450,V0-.044,.022);
  }
  function wheel(U){
    stamp('rubber',rim,U,.128+R,V0,[R,R,R],pi/2);
    stamp('mfCast',rim,U,.128+R,V0,[R*.913,R*.913,R*.913],pi/2);
    rod('brass',U,.497,V0-.068,U,.497,V0+.068,.029);
    for(let n=0;n<16;n++){
      const a=n*pi/8;
      rod('steel',U,.497,V0+(n%2?-.024:.024),U+Math.cos(a)*R*.896,.497+Math.sin(a)*R*.896,V0,.0044);
    }
  }
  wheel(A-.57);wheel(A+.57);
  for(const [x,y,X,Y] of [[-.57,.497,-.17,.955],[-.57,.497,-.035,.522],[-.17,.955,-.035,.522],[-.17,.955,.326,.933],[.326,.933,-.035,.522],[.326,.933,.57,.497]]){
    rod('green',A+x,y,V0,A+X,Y,V0,.021);
  }
  rod('steel',A-.17,.955,V0,A-.201,1.064,V0,.015);
  rounded('mfSaddle',A-.213,1.084,V0,.216,.059,.139);
  rod('mfCast',A+.326,.933,V0,A+.320,1.15,V0,.017);
  cord('gunmetal',[[A+.19,1.111,V0-.185],[A+.345,1.146,V0-.142],[A+.32,1.146,V0],[A+.345,1.146,V0+.142],[A+.16,1.111,V0+.185]],.018,15);
  stamp('brass',rim,A-.035,.519,V0-.039,[.092,.092,.092],pi/2);
  stamp('gunmetal',rim,A-.57,.497,V0-.042,[.055,.055,.055],pi/2);
  for(const s of [-1,1])rod('iron',A-.57,.497+s*.056,V0-.042,A-.035,.519+s*.092,V0-.043,.007);
  for(const s of [-1,1]){
    line('edge',[[A-.035,.517,V0],[A-.035,.517,V0+s*.092],[A+.073,.517+s*.075,V0+s*.099]],.012);
    box('rubber',A+.073,.505+s*.075,V0+s*.125,.079,.023,.077);
  }
  rounded('blueTin',A+.67,.274,V0-.233,.287,.274,.223);
  box('iron',A+.669,.207,V0-.352,.238,.126,.016);
  for(let i=0;i<7;i++)box('edge',A+.574+i*.032,.223,V0-.363,.011,.09,.009);
  bolt('mfAmber',A+.67,.315,V0-.363,.021);
  cord('rubber',[[A+.682,.319,V0-.126],[A+.612,.414,V0-.095],[A+.508,.483,V0-.056]],.012);
  sign('cycle',14.319,1.67,9.57,1.28,.64,0);
  // Clamped service conduit and local caged work lights, tied into the cave.
  rod('oxide',14.52,2.02,11.60,19.74,2.02,11.60,.027);
  for(let n=0;n<7;n++){
    const x=14.71+n*.79;rod('tunnelMetal',x-.023,2.02,11.60,x+.023,2.02,11.60,.039);
    rod('iron',x,2.02,11.60,x,2.02,11.73,.013);
  }
  utilityLamp(17.77,10.43,2.24);utilityLamp(15.45,9.28,2.21,pi/2,'mfAmber');
  pulse.dispose();rim.dispose();dispose();
}
