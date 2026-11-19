import {randomSource} from './surface-detail.js';
import {b,p,wcRoofAt} from './park-wc-layout.js';
import {radioSpot,intercomSpot} from './moosfunk-quest.js';

const pi=Math.PI;
export function furnishHQ(T,kit,id,quest){
  const {block,hit,pipe,stamp,hqTile}=kit;
  const rnd=randomSource(33163),ball=new T.SphereGeometry(1,12,8),dial=new T.CylinderGeometry(1,1,1,13),
    hoop=new T.TorusGeometry(1,.085,7,22),flat=hoop.clone().rotateX(-pi/2);
  const vessel=new T.LatheGeometry([[.47,0],[.53,.04],[.71,.21],[.92,.80],[1,.946],[.99,1],
    [.88,.995],[.87,.92],[.70,.43],[.48,.13],[0,.10]].map(([r,y])=>new T.Vector2(r,y)),19);
  const pulp=id==='studio'?new T.LatheGeometry([[1,0],[.68,.18],[.52,.83],[.40,.98],[.25,.96],[.18,.46],[0,.41]]
    .map(([r,y])=>new T.Vector2(r,y)),8):null;
  const roof=(u,v)=>wcRoofAt(id,u,v)-b;
  const box=(m,u,y,v,w,h,d)=>block(m,u-w/2,u+w/2,y,y+h,v-d/2,v+d/2);
  const bolt=(m,u,y,v,r=.014)=>stamp(m,ball,u,y,v,[r,r,r]);
  const table=(u,v,w,d,h=.90,metal='iron',top='wood')=>{
    for(const s of [-1,1])for(const t of [-1,1]){
      const A=u+s*(w*.5-.082),B=v+t*(d*.5-.084);
      box(metal,A,.018,B,.058,h-.053,.059);
      box('rubber',A,.012,B,.080,.037,.075);
    }
    box(metal,u,h-.131,v,w*.94,.085,d*.88);
    box(top,u,h-.056,v,w,.056,d);
    for(const s of [-1,1]){
      box('edge',u,h-.048,v+s*(d*.5+.003),w*.985,.022,.011);
      box('brass',u+s*(w*.5-.022),h-.022,v,.030,.020,.026);
    }
    hit(u-w/2,u+w/2,v-d/2,v+d/2);
  };
  function lowSeat(u,v,y=.443,w=.48,d=.46,m='sage'){
    for(const s of [-1,1])for(const t of [-1,1]){
      const c=[u+s*(w/2-.069),v+t*(d/2-.067)];
      pipe('gunmetal',[c[0]+s*.039,.024,c[1]+t*.033],[c[0],y,c[1]],.014);
    }
    box('iron',u,y-.062,v,w*.97,.055,d*.94);
    stamp(m,ball,u,y,v,[w*.525,.055,d*.523]);
    pipe('linen',[u-w*.39,y+.017,v-d*.46],[u+w*.39,y+.017,v-d*.46],.004);
    hit(u-w/2,u+w/2,v-d/2,v+d/2);
  }
  function chair(u,v,back=1,color='sage'){
    lowSeat(u,v,.457,.481,.466,color);
    for(const s of [-1,1])pipe('gunmetal',[u+s*.176,.399,v+back*.183],[u+s*.169,.84,v+back*.221],.014);
    // The seat spans local u (+world Z); the pad's long world-X axis
    // must turn with it so *both* uprights meet the padded back.
    stamp(color,ball,u,.784,v+back*.223,[.197,.113,.055],pi/2);
    pipe('gunmetal',[u-.173,.781,v+back*.255],[u+.173,.781,v+back*.255],.012);
    const front=v+back*.174;
    pipe('linen',[u-.144,.813,front],[u+.144,.813,front],.0036);
  }
  function crate(u,v,y=0,w=.65,d=.46,h=.32,label=false){
    box('darkWood',u,y+.014,v,w,.049,d);
    for(const s of [-1,1]){
      for(let j=0;j<3;j++)box(j%2?'pine':'wood',u,y+.045+j*(h-.033)/3,v+s*d*.47,w-.02,(h-.064)/3,.037);
      box('wood',u+s*w*.472,y+.041,v,.046,h-.027,d);
      for(const q of [-1,1])box('tunnelMetal',u+s*w*.45,y+.024,v+q*d*.46,.067,h,.052);
    }
    if(!y)hit(u-w/2,u+w/2,v-d/2,v+d/2);
    if(label)hqTile('seed',u,y+h*.62,v-d*.5-.008,w*.72,h*.36,-pi/2);
  }
  function sheet(label,u,y,v,w=.45,h=.31,roll=0){
    box('paper',u,y,v,h*.98,.014,w*.99);
    hqTile(label,u,y+.016,v,w,h,-pi/2,-pi/2,roll);
  }
  function wallSign(label,u,y,v,w,h,yaw){
    const du=Math.cos(yaw),dv=-Math.sin(yaw);
    box('darkWood',u-du*.048,y-h/2-.022,v-dv*.048,Math.abs(dv)*(w+.040)+Math.abs(du)*.076,h+.044,Math.abs(du)*(w+.040)+Math.abs(dv)*.076);
    hqTile(label,u,y,v,w,h,yaw);
  }
  function speaker(u,v,y,face=-1,r=.14){
    box('darkWood',u,y-.115,v,.326,.379,.263);
    const front=v+face*.140;
    box('rubber',u,y-.092,front,.301,.326,.018);
    for(const [Y,R] of [[y+.014,r],[y+.157,r*.49]]){
      pipe('brass',[u,Y,front-face*.001],[u,Y,front+face*.013],R*.95);
      stamp('iron',ball,u,Y,front+face*.012,[R*.81,R*.70,.013]);
      stamp('gunmetal',ball,u,Y,front+face*.025,[R*.28,R*.26,.010]);
    }
    for(const x of [-.128,.128])for(const Y of [y-.064,y+.198])bolt('steel',u+x,Y,front+face*.018,.008);
  }
  function cup(u,y,v,m='porcelain'){
    stamp(m,vessel,u,y,v,[.041,.092,.041]);
    stamp(m,hoop,u+.046,y+.048,v,[.025,.026,.018],pi/2);
  }
  function mugPlate(u,y,v){
    stamp('porcelain',vessel,u,y,v,[.136,.037,.136]);
    stamp('jarPale',flat,u,y+.025,v,[.091,.022,.091]);
    pipe('steel',[u-.19,y+.015,v-.086],[u-.163,y+.015,v+.073],.007);
  }
  function jar(u,y,v,i){
    const r=.049+i%4*.013,h=.128+i%3*.042;
    stamp(i%3===0?'preserve':i%3===1?'jarGold':'jarGreen',ball,u,y+h*.53,v,[r,h*.54,r]);
    stamp(i%3===0?'preserve':i%3===1?'jarGold':'jarGreen',dial,u,y+h*.53,v,[r*.983,h*.67,r*.983]);
    stamp('jarPale',dial,u,y+h*.91,v,[r*.71,.025,r*.71]);
    stamp('brass',dial,u,y+h+.005,v,[r*.78,.024,r*.78]);
    box('paper',u,y+h*.39,v-r*.93,r*1.37,.040,.013);
    box('red',u,y+h*.44,v-r*.93-.003,r*1.01,.009,.011);
  }
  function cloth(u,v,y,w,d,major='tartan'){
    box(major,u,y,v,w,.008,d);
    for(let i=0;i<6;i++){
      box(i%2?'wool':'linen',u,y+.0081,v-d*.44+i*d*.175,w*.967,.003,i%2?.024:.012);
      box('sage',u-w*.43+i*w*.174,y+.0115,v,.015,.002,d*.957);
    }
  }
  function shroud(u,v,color='wool'){
    const y=roof(u,v)-.22;
    pipe('iron',[u,y,v],[u,roof(u,v)+.017,v],.014);
    stamp('iron',vessel,u,y-.141,v,[.203,.146,.203]);
    stamp(color,dial,u,y-.13,v,[.143,.027,.143]);
  }

  if(id==='studio'){
    // Egg-carton relief is real silhouette; a few missing panels leave the
    // stone visible. The front desk and rear tape shelf use the same wood.
    for(let i=0;i<8;i++){
      const u=14.24+i*.66,v=-8.79;
      box('darkWood',u,.60,v,.635,1.231,.111);
      box('acoustic',u,.64,v+.055,.592,1.145,.065);
      for(let r=0;r<7;r++)for(let c=0;c<4;c++){
        const u2=u-.215+c*.142,y=.746+r*.153;
        stamp((r+c+i)%4===0?'paper':'acoustic',pulp,u2,y,v+.088,[.064,.064,.058],-pi/2,pi/2);
      }
    }
    for(let i=0;i<4;i++){
      const v=-8.50+i*.687;
      box('darkWood',13.86,.61,v,.113,1.22,.648);
      box('acoustic',13.95,.65,v,.093,1.14,.588);
      for(let r=0;r<7;r++)for(let c=0;c<4;c++)stamp('acoustic',pulp,13.997,.745+r*.151,v-.211+c*.138,[.065,.055,.058],0,pi/2);
    }
    const {u,v}=radioSpot;
    table(u,-8.24,3.49,.82,.923,'iron','pine');
    box('gunmetal',u,.925,-8.03,1.52,.209,.55);
    box('rubber',u,1.127,-8.045,1.49,.018,.49);
    box('brass',u,1.087,-7.749,1.40,.021,.022);
    for(let j=0;j<10;j++){
      const A=u-.623+j*.138;
      box('iron',A,1.148,-7.974,.028,.005,.259);
      box(j%3===1?'blueTape':'ivoryPaint',A,1.152,-7.975+(j%3-1)*.059,.084,.024,.059);
      for(let q=0;q<2;q++)stamp(q?'brass':'gunmetal',dial,A,1.157,-8.137-q*.069,[.029,.036,.029]);
    }
    box('blueTape',u,.991,v-.041,.49,.071,.054);
    for(const q of [-.16,-.08,0,.08,.16])box(q<0?'signal':'switchAmber',u+q,1.016,v-.008,.042,.023,.014);
    for(const s of [-1,1]){
      speaker(u+s*1.29,-8.31,.923,1,.106);
      pipe('rubber',[u+s*1.29,.932,-8.44],[u+s*.63,.942,-8.37],.010);
    }
    pipe('gunmetal',[u+.77,.964,-7.91],[u+.77,1.50,-7.91],.015);
    pipe('steel',[u+.77,1.50,-7.91],[u+.47,1.44,-7.60],.012);
    stamp('iron',ball,u+.472,1.439,-7.60,[.041,.072,.038],.3);
    for(const y of [1.421,1.446,1.472])pipe('steel',[u+.441,y,-7.579],[u+.50,y,-7.579],.004);
    box('blueTin',u-1.27,.923,-8.03,.498,.115,.361);
    for(const a of [-.119,.124]){
      stamp('iron',dial,u-1.27+a,1.052,-8.003,[.094,.027,.094]);
      stamp('steel',flat,u-1.27+a,1.066,-8.003,[.069,.021,.069]);
      stamp('brass',dial,u-1.27+a,1.069,-8.003,[.027,.013,.027]);
    }
    pipe('wool',[u-1.389,1.067,-7.946],[u-1.329,1.053,-7.886],.004);
    pipe('wool',[u-1.329,1.053,-7.886],[u-1.146,1.065,-7.946],.004);
    chair(15.77,-7.10,1,'wool');lowSeat(17.91,-7.06,.432,.48,.43,'sage');
    const back=19.92;
    for(const v of [-8.55,-5.14])box('iron',back,.024,v,.061,1.77,.061);
    for(const y of [.254,.704,1.15,1.60])box('wood',19.85,y,-6.835,.369,.046,3.48);
    for(let i=0;i<40;i++){
      const row=i%3,v=-8.43+Math.floor(i/3)*.226,y=.30+row*.448;
      if((i+row)%13===6)continue;
      box(i%3?'darkWood':'blueTape',19.83,y,v,.278,.214,i%4===0?.090:.044);
      box('paper',19.68,y+.133,v,.024,.028,.037);
    }
    hit(19.65,20.10,-8.61,-5.09);
    wallSign('tapeList',19.615,1.409,-6.18,1.13,.498,pi);
    wallSign('airLog',14.052,1.481,-6.08,1.15,.556,0);
    wallSign('liveSign',16.80,1.843,-8.63,1.15,.26,-pi/2);
    shroud(16.07,-6.21,'studioLamp');shroud(18.65,-7.32,'workLamp');
    crate(19.06,-5.32,0,.72,.48,.35);
    for(let i=0;i<10;i++){
      const v=-5.50+i*.038,y=.226+i%3*.021;
      box(i%3===0?'blueTape':i%3===1?'pine':'red',19.06,y,v,.324,.318,.022);
      box('paper',19.06,y+.249,v+.013,.265,.049,.006);
    }
    stamp('iron',dial,19.06,.471,-5.087,[.135,.014,.135],0,pi/2);
    stamp('ochre',dial,19.050,.471,-5.087,[.041,.010,.041],0,pi/2);
  }

  if(id==='kitchen'){
    // Glazed splashback, free-standing sink, storage jars and a scuffed
    // refrigerator. Leave the diagonal between both portals clear.
    for(let i=0;i<6;i++)box('tileOld',32.37+i*.506,1.02,13.043,.503,.63,.126);
    table(33.81,12.52,3.40,.955,.973,'gunmetal','metalSink');
    box('metalSink',32.66,.972,12.49,.765,.031,.607);
    stamp('metalSink',vessel,32.61,.969,12.44,[.269,.079,.195]);
    stamp('steel',flat,32.62,.999,12.458,[.053,.022,.053]);
    pipe('steel',[32.65,.982,12.733],[32.65,1.289,12.733],.022);
    pipe('steel',[32.65,1.289,12.733],[32.65,1.263,12.509],.022);
    pipe('steel',[32.65,1.263,12.509],[32.65,1.203,12.509],.018);
    pipe('brass',[32.73,1.068,12.73],[32.825,1.082,12.73],.013);
    for(const [i,v] of [12.31,12.69].entries()){
      stamp('iron',flat,34.43,1.011,v,[.147,.026,.147]);
      stamp('iron',flat,34.81,1.011,v,[.136,.028,.136]);
      stamp('steel',dial,35.01,1.026,v,[.041,.053,.041]);
      if(i===0){
        stamp('metalSink',vessel,34.44,1.021,v,[.166,.234,.166]);
        stamp('gunmetal',ball,34.44,1.259,v,[.159,.038,.158]);
        stamp('wood',dial,34.44,1.295,v,[.044,.036,.042]);
        for(const s of [-1,1])pipe('iron',[34.44+s*.116,1.20,v],[34.44+s*.213,1.22,v],.018);
      }
    }
    for(const y of [1.309,1.639]){
      box('wood',33.52,y,12.904,1.31,.037,.398);
      for(let i=0;i<5;i++)jar(33.05+i*.229,y+.039,12.896,i);
    }
    const rU=35.08,rV=8.27;
    box('green',rU,.075,rV,1.12,1.74,1.041);
    box('gunmetal',rU,.075,rV,1.16,.13,1.08);
    box('porcelain',rU-.586,.233,rV,.091,1.03,1.02);
    box('porcelain',rU-.590,1.286,rV,.092,.493,1.019);
    for(const y of [.84,1.52]){
      for(const d of [-.096,.096])pipe('iron',[rU-.624,y,rV+d],[rU-.721,y,rV+d],.015);
      pipe('steel',[rU-.721,y,rV-.098],[rU-.721,y,rV+.098],.018);
    }
    for(let j=0;j<11;j++)box('iron',rU+.010,.192,rV-.407+j*.077,.624,.019,.021);
    hqTile('fridge',rU-.64,1.617,rV-.267,.395,.255,pi,0,-.058);
    for(const [y,v,key] of [[1.745,rV-.351,'blueTape'],[1.745,rV-.168,'ochre'],[.868,rV+.209,'safetyRed']])
      bolt(key,rU-.650,y,v,.014);
    hit(rU-.665,rU+.57,rV-.53,rV+.53);
    table(31.54,10.33,2.16,.994,.825,'iron','pine');
    cloth(31.54,10.34,.825,1.98,.579,'tartan');
    for(const u of [30.84,31.57,32.26]){
      mugPlate(u,.839,10.08);cup(u+.11,.84,10.55,'porcelain');
    }
    chair(31.21,9.49,-1,'wool');chair(32.04,9.49,-1,'sage');
    chair(31.20,11.16,1,'sage');chair(32.09,11.16,1,'wool');
    sheet('kitchenDuty',31.55,.84,10.39,.48,.266,.10);
    for(const [i,u] of [31.23,31.32,31.43].entries())stamp('tomatoRed',ball,u,.872,10.68,[.027+i*.007,.039,.035]);
    crate(35.05,10.39,0,.710,.675,.418,true);
    crate(35.05,10.39,.46,.668,.531,.33,true);
    wallSign('kitchenDuty',29.51,1.516,13.00,1.72,.625,pi/2);
    wallSign('missing',34.86,1.539,7.02,1.36,.65,-pi/2);
    shroud(31.57,10.31,'lamp');shroud(33.68,11.76,'workLamp');
  }

  if(id==='workshop'){
    table(17.58,11.10,3.58,.92,.912,'gunmetal','pine');
    for(const u of [16.26,16.84,17.40,17.96,18.52,19.08]){
      box('darkWood',u,1.077,11.67,.545,.861,.13);
      for(let c=0;c<7;c++)for(let r=0;r<9;r++){
        const a=u-.23+c*.077,y=1.151+r*.085;
        pipe('iron',[a,y,11.603],[a,y,11.591],.0069);
      }
    }
    for(const [u,y,w] of [[16.32,1.41,.18],[16.58,1.50,.22],[18.33,1.38,.21],[18.81,1.46,.25],[19.12,1.55,.14]]){
      pipe('toolRed',[u,y-.17,11.55],[u,y+w*.27,11.55],.026);
      pipe('steel',[u,y+.046,11.55],[u,y+.154,11.55],.014);
      pipe('iron',[u,y+.161,11.57],[u,1.742,11.595],.006);
    }
    const {u,v}=intercomSpot;
    box('gunmetal',u,1.162,v+.154,.539,.489,.287);
    box('edge',u,1.186,v+.007,.488,.437,.024);
    box('rubber',u-.074,1.366,v-.011,.217,.184,.021);
    for(let j=0;j<7;j++)pipe('steel',[u-.154,1.391+j*.018,v-.027],[u+.012,1.391+j*.018,v-.027],.0032);
    box('iron',u+.136,1.298,v-.015,.091,.143,.025);
    for(const y of [1.315,1.596])for(const s of [-1,1])bolt('steel',u+s*.213,y,v-.028,.009);
    pipe('rubber',[u-.208,1.216,v+.113],[u-.261,.942,v+.166],.014);
    pipe('rubber',[u-.261,.942,v+.166],[u-.592,.933,v+.458],.012);
    const leds=new T.Group();leds.name='Moosfunk · Umschaltbare Gegensprechanlage';kit.room.add(leds);
    const matrixP=(name,r,c,offset)=>{
      const m=new T.Mesh(new T.SphereGeometry(.026,12,8),new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.18}));
      m.name=name;m.position.fromArray(p(u+.136,b+r,v+offset));leds.add(m);return m;
    };
    const off=matrixP('M–7 fehlt',1.506,0xca6340,-.028),on=matrixP('Rückkanal aktiv',1.506,0x8ab074,-.028);
    const insert=new T.Mesh(new T.BoxGeometry(.050,.090,.060),new T.MeshStandardMaterial({color:0xd5c19d,roughness:.68}));
    insert.position.fromArray(p(u+.136,b+1.376,v-.028));leds.add(insert);
    box('darkWood',19.71,1.284,11.643,.650,.410,.24);
    const wired=hqTile('wired',19.71,1.490,11.515,.596,.369,-pi/2);
    quest?.bind(phase=>{off.visible=phase!=='wired';on.visible=insert.visible=wired.visible=phase==='wired';});
    if(!quest){on.visible=insert.visible=wired.visible=false;}
    wallSign('repair',16.05,1.499,11.50,1.156,.565,-pi/2);
    sheet('repair',16.18,.916,10.985,.503,.311,-.13);
    box('blueTin',18.51,.913,10.99,.421,.201,.218);
    box('rubber',18.51,1.111,10.99,.356,.023,.179);
    for(let i=0;i<4;i++)stamp('steel',dial,18.39+i*.078,1.136,10.964,[.022,.044,.022]);
    pipe('toolRed',[17.13,.938,10.83],[17.37,.938,10.77],.017);
    pipe('steel',[17.37,.938,10.77],[17.50,.938,10.733],.007);
    const f=15.10,g=9.95;
    box('darkWood',f,.025,g,1.17,.065,.81);
    for(const u of [f-.392,f+.348]){
      stamp('iron',hoop,u,.46,g,[.381,.381,.381],pi/2);
      for(let q=0;q<12;q++){
        const a=q*pi/6;pipe('steel',[u,.46,g],[u+Math.cos(a)*.349,.46+Math.sin(a)*.349,g],.0055);
      }
      bolt('brass',u,.46,g,.041);
    }
    pipe('green',[f-.392,.46,g],[f-.022,.54,g],.027);
    pipe('green',[f-.022,.54,g],[f+.172,.91,g],.028);
    pipe('green',[f+.172,.91,g],[f+.348,.46,g],.027);
    pipe('green',[f-.022,.54,g],[f-.235,.895,g],.028);
    pipe('green',[f-.235,.895,g],[f+.172,.91,g],.028);
    box('rubber',f-.277,.877,g,.223,.067,.116);
    pipe('steel',[f+.17,.891,g],[f+.19,1.083,g],.017);
    pipe('rubber',[f+.19,1.083,g-.193],[f+.19,1.083,g+.193],.017);
    box('blueTin',f+.386,.172,g-.141,.235,.239,.213);
    bolt('switchAmber',f+.386,.353,g-.258,.021);
    hit(f-.785,f+.743,g-.35,g+.34);
    crate(18.83,6.13,0,.87,.76,.46);
    crate(18.83,6.13,.515,.826,.717,.34);
    wallSign('keep',19.883,1.54,5.98,1.25,.56,pi);
    lowSeat(16.80,9.82,.46,.45,.45,'tote');
    shroud(17.83,10.29,'workLamp');
  }

  if(id==='plenum'){
    table(23.64,10.57,2.46,1.13,.832,'iron','pine');
    cloth(23.64,10.55,.832,2.26,1.01);
    for(const [i,u] of [22.83,23.61,24.41].entries()){
      cup(u+.17,.849,10.31,i%2?'jarGreen':'porcelain');
      sheet(i===1?'missing':'votes',u,.848,10.62,.495,.329,(i-1)*.09);
      chair(u,11.32,1,i===1?'wool':'sage');
    }
    chair(24.80,9.78,-1,'wool');
    lowSeat(22.58,9.74,.438,.43,.44,'sage');
    stamp('steel',vessel,24.27,.838,10.94,[.12,.071,.121]);
    pipe('darkWood',[24.10,.907,10.97],[24.40,.907,10.92],.009);
    wallSign('votes',20.30,1.493,10.88,1.49,.64,0);
    wallSign('missing',27.79,1.493,7.975,1.80,.67,pi);
    wallSign('quiet',25.02,1.545,12.997,1.41,.568,pi/2);
    pipe('wood',[21.76,1.935,6.94],[24.40,1.935,6.94],.031);
    for(const u of [21.90,24.26])pipe('iron',[u,1.935,6.94],[u,1.884,6.725],.014);
    hqTile('community',23.08,1.475,6.962,2.41,.898,-pi/2);
    for(const [i,u] of [21.30,23.67,26.06].entries()){
      const v=12.47;
      for(const s of [-1,1])for(const t of [-1,1])
        pipe('gunmetal',[u+s*.87,.029,v+t*.29],[u+s*.87,.399,v+t*.31],.018);
      for(const s of [-1,1])pipe('iron',[u-.92,.402,v+s*.328],[u+.92,.402,v+s*.328],.025);
      box('linen',u,.402,v,1.82,.093,.647);
      cloth(u-.21,v,.496,1.36,.613,i%2?'wool':'tartan');
      stamp('tote',ball,u+.649,.524,v,[.244,.085,.260]);
      pipe('linen',[u+.55,.538,v-.209],[u+.855,.526,v-.21],.006);
      hit(u-.94,u+.94,v-.35,v+.35);
    }
    for(const u of [22.47,24.89]){
      crate(u,12.58,0,.383,.463,.353);
      cup(u,.36,12.58,'blueTape');
      box('iron',u,.363,12.74,.134,.115,.113);
      pipe('brass',[u,.449,12.74],[u,.638,12.74],.012);
      stamp('lamp',vessel,u,.582,12.74,[.106,.116,.108]);
    }
    shroud(23.64,10.54,'lamp');shroud(26.55,12.11,'studioLamp');
  }
  for(const g of [ball,dial,hoop,flat,vessel])g.dispose();
  pulp?.dispose();
}
