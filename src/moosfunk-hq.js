import {randomSource} from './surface-detail.js';
import {b,wcRoofAt} from './park-wc-layout.js';
import {radioSpot} from './moosfunk-quest.js';

const pi=Math.PI;
export function furnishHQ(T,kit,id){
  const {block,hit,pipe,stamp,hqTile}=kit;
  const rnd=randomSource(33163),ball=new T.SphereGeometry(1,12,8),dial=new T.CylinderGeometry(1,1,1,13),
    hoop=new T.TorusGeometry(1,.085,7,22),flat=hoop.clone().rotateX(-pi/2);
  const vessel=new T.LatheGeometry([[.47,0],[.53,.04],[.71,.21],[.92,.80],[1,.946],[.99,1],
    [.88,.995],[.87,.92],[.70,.43],[.48,.13],[0,.10]].map(([r,y])=>new T.Vector2(r,y)),19);
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
      pipe('gunmetal',[u,Y,front-face*.001],[u,Y,front+face*.013],R);
      stamp('iron',ball,u,Y,front+face*.013,[.012,R*.86,R*.86]);
      stamp('rubber',hoop,u,Y,front+face*.018,[R*.82,R*.82,R*.42],pi/2);
      stamp('studioFelt',ball,u,Y,front+face*.024,[.019,R*.34,R*.34]);
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
    const {u}=radioSpot;
    // Broad bands of absorption alternating with salvaged organ-pipe diffusers.
    for(let i=0;i<8;i++){
      const U=14.24+i*.69,V=-8.78;
      box('darkWood',U,.54,V,.668,1.47,.105);
      box('studioFelt',U,.572,V+.061,.614,1.39,.043);
      if(i%3!==1)for(let j=0;j<7;j++){
        const depth=[.060,.104,.081,.043,.112,.074,.051][(j+i)%7];
        box(j%4?'wood':'pine',U-.258+j*.086,.62,V+.083+depth*.5,.038,1.29,depth);
      }else for(const Y of [.64,1.90])for(const D of [-.25,.25])bolt('brass',U+D,Y,V+.085,.012);
    }
    for(let j=0;j<4;j++){
      const V=-8.41+j*.66;
      box('darkWood',13.88,.57,V,.119,1.37,.62);
      box('studioFelt',13.952,.61,V,.063,1.286,.56);
      for(let n=0;n<8;n++)box('gunmetal',13.988,.68+n*.153,V,.012,.014,.516);
    }

    table(u,-8.18,3.68,1.04,.923,'iron','wood');
    const base=.923;
    box('gunmetal',u,base,-8.048,1.56,.095,.64);
    box('studioFelt',u,1.018,-8.048,1.50,.025,.612);
    hqTile('console',u,1.044,-8.048,1.48,.60,-pi/2,-pi/2);
    for(const side of [-1,1]){
      box('darkWood',u+side*.792,base,-8.048,.052,.137,.65);
      box('pine',u+side*.792,1.06,-8.048,.044,.009,.64);
    }
    for(let i=0;i<10;i++){
      const U=u-.669+i*.148;
      box('rubber',U,1.046,-7.961,.015,.004,.178);
      box(i===9?'toolRed':'ivoryPaint',U,1.051,-7.963+.052*Math.sin(i*1.76),.067,.021,.038);
      box('iron',U,1.072,-7.963+.052*Math.sin(i*1.76),.048,.002,.004);
      for(let j=0;j<2;j++){
        const V=-8.197-j*.086;
        stamp('steel',dial,U,1.052,V,[.032,.012,.032]);
        stamp(j?'gunmetal':i%3?'blueTape':'brass',dial,U,1.073,V,[.028,.039,.028]);
        pipe('paper',[U,1.094,V],[U+.020*Math.sin(i+j),1.094,V+.020*Math.cos(i+j)],.0027);
      }
      box(i%4?'sage':'switchAmber',U,1.05,-8.103,.047,.012,.026);
    }
    box('gunmetal',u,1.018,-8.403,1.51,.221,.112);
    box('darkWood',u,1.233,-8.401,1.53,.019,.126);
    hqTile('meter',u-.24,1.133,-8.344,.70,.186,-pi/2);
    for(let i=0;i<12;i++)for(let j=0;j<2;j++)box(i<(j?8:10)?i<7?'switchGreen':'switchAmber':'rubber',u+.195+i*.041,1.099+j*.050,-8.342,.030,.023,.009);
    for(const side of [-1,1]){
      const U=u+side*1.53,V=-8.478;
      box('rubber',U,base,V,.329,.048,.267);
      speaker(U,V,base+.163,1,.105);
      pipe('rubber',[U,.941,V+.15],[u+side*.70,.941,-8.396],.009);
    }

    // Two open metal reels, tape packs of different diameter and a separate transport.
    const A=u-1.16;
    box('darkWood',A,base,-7.957,.634,.124,.449);
    box('blueTin',A,1.047,-7.957,.610,.017,.429);
    for(const [j,D] of [-.149,.149].entries()){
      const U=A+D,V=-8.012;
      stamp('iron',dial,U,1.083,V,[j?.083:.114,.035,j?.083:.114]);
      stamp('steel',flat,U,1.106,V,[.122,.057,.122]);
      for(let n=0;n<3;n++){
        const a=n*pi*2/3+.62*j;
        pipe('steel',[U,1.105,V],[U+Math.cos(a)*.119,1.105,V+Math.sin(a)*.119],.009);
      }
      stamp('brass',dial,U,1.111,V,[.027,.023,.027]);
    }
    const path=[[A-.26,1.082,-8.014],[A-.177,1.082,-7.886],[A+.124,1.082,-7.886],[A+.23,1.082,-8.013]];
    for(let j=1;j<path.length;j++)pipe('darkWood',path[j-1],path[j],.006);
    for(const D of [-.177,.124])stamp('steel',dial,A+D,1.08,-7.886,[.023,.04,.023]);
    for(let j=0;j<5;j++)box(j===4?'toolRed':'ivoryPaint',A-.147+j*.069,1.068,-7.795,.052,.018,.050);

    // Articulated broadcast arm, tension spring, grille and suspended pop screen.
    const U=u+.94;
    stamp('iron',dial,U,.942,-8.222,[.094,.038,.094]);
    for(const [a,B] of [[ [U,.95,-8.22],[U,1.17,-8.22] ],[[U,1.17,-8.22],[U+.20,1.52,-8.21]],[[U+.20,1.52,-8.21],[U-.14,1.45,-7.99]]]){
      for(const d of [-.016,.016])pipe('gunmetal',[a[0],a[1],a[2]+d],[B[0],B[1],B[2]+d],.010);
      bolt('brass',...B,.022);
    }
    pipe('iron',[U-.14,1.45,-7.99],[U-.14,1.389,-7.99],.015);
    stamp('metalSink',ball,U-.14,1.348,-7.99,[.052,.080,.052]);
    for(let n=0;n<7;n++)stamp('gunmetal',flat,U-.14,1.294+n*.016,-7.99,[.055*Math.sin(.78+n*.26),.033,.055*Math.sin(.78+n*.26)]);
    pipe('gunmetal',[U-.14,1.398,-7.99],[U-.14,1.39,-7.87],.005);
    stamp('studioFelt',ball,U-.14,1.336,-7.87,[.009,.068,.068]);
    // On their own stand, not floating beside the mic.
    const H=u+1.47;
    stamp('gunmetal',dial,H,.936,-7.906,[.101,.026,.101]);
    pipe('brass',[H,.946,-7.906],[H,1.211,-7.906],.012);
    for(let j=0;j<14;j++){
      const pt=n=>[H+.099*Math.cos(n*pi/14),1.118+.112*Math.sin(n*pi/14),-7.906];
      pipe('rubber',pt(j),pt(j+1),.013);
    }
    for(const s of [-1,1])stamp('studioFelt',ball,H+s*.099,1.095,-7.906,[.045,.059,.028]);
    chair(15.77,-7.10,1,'wool');lowSeat(17.91,-7.06,.432,.48,.43,'sage');

    for(const V of [-8.55,-5.14])for(const U of [19.68,20.02])box('gunmetal',U,.019,V,.035,1.80,.035);
    for(const y of [.254,.704,1.15,1.60]){
      box('wood',19.85,y,-6.835,.369,.046,3.48);
      box('brass',19.658,y+.007,-6.835,.012,.012,3.47);
    }
    for(let row=0;row<3;row++)for(let j=0;j<20;j++){
      const V=-8.39+j*.16,Y=[.300,.750,1.196][row];
      if((row===1&&j>13)||(j+row)%13===7)continue;
      const m=['blueTape','pine','sage','toolRed','darkWood'][(row*11+Math.floor(j/3))%5];
      const front=19.684+rnd()*.035,h=.216+rnd()*.056,w=.072+rnd()*.057;
      box(m,front+.138,Y,V,.276,h,w);
      box('paper',front-.003,Y+.022,V,.008,h*.72,w*.82);
      for(let k=0;k<3;k++)box(k?'gunmetal':m,front-.008,Y+.045+k*.043,V,.004,.006,w*(k===2?.35:.62));
      box('rubber',front-.006,Y+h-.038,V,.003,.015,w*.57);
    }
    // Featured tape, face-out; shelf list fixed to the top on metal supports.
    box('paper',19.746,.751,-5.69,.082,.292,.486);
    hqTile('sleeve',19.701,.901,-5.69,.482,.282,pi);
    for(const V of [-6.61,-5.75])box('iron',19.77,1.635,V,.042,.42,.026);
    wallSign('tapeList',19.69,1.906,-6.18,1.12,.412,pi);
    hit(19.65,20.10,-8.61,-5.09);
    wallSign('airLog',14.006,1.48,-6.11,1.05,.55,0);
    wallSign('liveSign',16.75,2.05,-8.53,1.18,.265,-pi/2);
    shroud(16.07,-6.21,'studioLamp');shroud(18.65,-7.32,'workLamp');
    crate(19.06,-5.32,0,.72,.48,.35);
    for(let j=0;j<8;j++){
      const V=-5.49+j*.044;
      box(j%3?'pine':'blueTape',19.06,.198,V,.34,.32,.029);
    }
    hqTile('sleeve',19.06,.358,-5.164,.34,.32,-pi/2);
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
}
