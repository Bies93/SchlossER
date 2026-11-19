import {randomSource} from './surface-detail.js';
import {b,wcRoofAt} from './park-wc-layout.js';

export function furnishPractice(T,{block,hit,pipe,stamp,artTile}){
  const rnd=randomSource(76403),pi=Math.PI;
  const knob=new T.SphereGeometry(1,10,7);
  const loop=new T.TorusGeometry(1,.18,6,14);
  const lanes=[-4.58,-3.29,-1.99];
  const box=(mat,u,y,v,w,h,d)=>block(mat,u-w/2,u+w/2,y,y+h,v-d/2,v+d/2);
  const mark=(u,U,v,V,mat='ivoryPaint')=>block(mat,u,U,.002,.004,v,V);
  function caseAt(u,y,v,a,dim=.9,shinier=false){
    const dU=Math.cos(a)*.045*dim,dV=Math.sin(a)*.045*dim,r=.011*dim;
    const part=(t,Y=y)=>[u+(t-.5)*dU,Y,v+(t-.5)*dV];
    pipe(shinier?'brass':'shell',part(0),part(.99),r);
    pipe('shell',part(-.016),part(.071),r*1.11);
    pipe('shellMouth',part(.971),part(1.026),r*.72);
  }
  function storage(u,y,v,w,d,h,open=false){
    box('darkWood',u,y,v,w,.048,d);
    box('wood',u-w*.47,y+.039,v,.061,h-.033,d);
    box('wood',u+w*.47,y+.039,v,.061,h-.033,d);
    for(const dv of [-d*.47,d*.47]){
      box('wood',u,y+.045,v+dv,w,.067,.050);
      box('green',u,y+.116,v+dv,w,h-.113,.048);
      for(const du of [-w*.39,w*.39])box('iron',u+du,y+.045,v+dv,w*.075,h-.008,.062);
    }
    if(open){
      box('green',u+w*.473,y+h,v,.071,h*.92,d);
      for(const dv of [-d*.38,d*.38])box('steel',u+w*.468,y+h-.022,v+dv,.052,.083,.11);
    }else box('wood',u,y+h-.016,v,w+.022,.056,d+.015);
    for(const dv of [-d*.25,d*.25]){
      box('gunmetal',u-w*.507,y+h*.69,v+dv,.032,.087,.083);
      pipe('brass',[u-w*.533,y+h*.76,v+dv-.023],[u-w*.533,y+h*.76,v+dv+.022],.009);
    }
    if(y===0)hit(u-w/2,u+w/2,v-d/2,v+d/2);
  }
  function practiceProp(u,y,v,long){
    // Invented scrap-tech silhouettes, sealed housings and painted caps,
    // with detail concentrated on the view-facing sides of the prop.
    const reach=long?.345:.201;
    box('rubber',u-.12,y,v,.22,.028,.144);
    box('gunmetal',u,y+.023,v,long?.35:.265,.096,.112);
    box('blueTin',u+.007,y+.084,v,long?.318:.249,.048,.118);
    box('oxide',u+.037,y+.044,v,long?.237:.173,.032,.129);
    pipe('iron',[u+.12,y+.071,v],[u+reach,y+.071,v],long?.033:.047);
    pipe('ivoryPaint',[u+reach-.028,y+.071,v],[u+reach+.017,y+.071,v],long?.038:.052);
    for(const dv of [-.064,.064])for(let i=0;i<(long?5:3);i++){
      const q=u-.053+i*.030;
      box('rubber',q,y+.049,v+dv,.010,.022,.007);
    }
    for(const du of [u-.126,u+.09])for(const dv of [-.050,.050])
      stamp('brass',knob,du,y+.133,v+dv,[.008,.003,.008]);
    box('safetyRed',u+.073,y+.128,v,.078,.007,.043);
    box('steel',u-.104,y+.129,v,.027,.018,.018);
    box('signal',u+.103,y+.13,v,.018,.010,.018);
  }
  function muff(u,y,v){
    for(const a of [-1,1]){
      box('rubber',u,y,v+a*.086,.119,.065,.084);
      box('ochre',u,y+.034,v+a*.086,.093,.042,.069);
    }
    const c=[];
    for(let j=0;j<=8;j++){
      const q=-Math.PI/2+j*Math.PI/8;c.push([u-.003,y+.038+Math.cos(q)*.100,v+Math.sin(q)*.087]);
      if(j)pipe('gunmetal',c[j-1],c[j],.013);
    }
  }
  // Storage at the entry and battered lining along one side of the range.
  storage(21.84,0,-4.933,1.10,.68,.45);
  storage(22.10,.507,-4.934,.67,.54,.31);
  storage(23.02,0,-4.99,.71,.60,.36);
  for(const u of [21.43,22.27,23.12,23.97]){
    block('darkWood',u-.403,u+.403,.142,1.75,-5.407,-5.292);
    block('edge',u-.397,u+.397,.169,.207,-5.312,-5.28);
    for(const q of [-.306,.306])pipe('brass',[u+q,1.658,-5.292],[u+q,1.658,-5.283],.012);
  }
  block('darkWood',20.204,20.258,1.08,1.746,-2.16,-.812);
  artTile('rangeBoard',20.264,1.416,-1.49,1.28,.60,0);
  for(const [u,w] of [[25.76,1.33],[28.12,1.54],[30.26,1.13]]){
    block('wood',u-w/2,u+w/2,.611,1.529,-5.365,-5.272);
    artTile('impact',u,1.073,-5.268,w*.89,.782,-pi/2);
  }
  // Three visual bays; the right-hand aisle is left clear.
  for(const v of [-5.005,-3.927,-2.64]){
    block('iron',23.31,24.63,.022,.045,v-.034,v+.034);
    for(const u of [23.37,24.50])box('iron',u,.031,v,.067,1.13,.066);
    block('wood',23.47,24.48,.711,1.173,v-.033,v+.033);
    block('edge',23.45,24.49,1.16,1.196,v-.044,v+.044);
    for(const u of [23.52,24.42])pipe('brass',[u,1.097,v-.036],[u,1.097,v+.036],.012);
    hit(23.31,24.63,v-.067,v+.067);
  }
  for(const [i,v] of lanes.entries()){
    for(const u of [23.94,24.479])for(const dv of [-.36,.36])box('iron',u,.019,v+dv,.062,.943,.059);
    box('wood',24.198,.918,v,.683,.070,.94);
    box('edge',23.841,.934,v,.032,.035,.938);
    box('rubber',24.165,.988,v,.528,.006,.84);
    hit(23.824,24.55,v-.473,v+.473);
    artTile('rangeSign',24.188,.998,v+.277,.258,.119,-pi/2,-pi/2,i*.13);
    if(i!==1)practiceProp(24.118,1.0,v-.073,i===2);
    else muff(24.12,1.001,v-.12);
    if(i===0)muff(24.39,1.001,v+.271);
    if(i===1)storage(24.3,1.001,v+.27,.325,.242,.10,true);
    for(let j=0;j<6;j++)caseAt(24.03+((j*3)%7)*.047,1.008,v+.118+j*.021,j%2*1.2,.65,true);
    for(let n=0;n<11;n++){
      const u=25.4+n*.59;
      mark(u,u+.283,v-.568,v-.549,n%5?'ivoryPaint':'ochre');
    }
  }
  for(let i=0;i<22;i++){
    const v=-5.305+i*.187;
    mark(24.98,25.06,v,v+.148,i%2?'rubber':'ochre');
  }
  for(let j=0;j<105;j++){
    const v=lanes[j%3]+(rnd()-.5)*.96,u=j<91?22.86+rnd()*3.49:27.8+rnd()*4.1,k=.66+rnd()*.46;
    caseAt(u,.013*k,v,rnd()*pi*2,k,j%4===0);
  }
  // Hanging signs at different depths. The artwork is Bavarian heraldic
  // parody on salvaged metal; no people or human silhouettes are used.
  for(const [i,v] of lanes.entries()){
    const u=[29.12,31.22,30.08][i],top=wcRoofAt('practice',u,v)-b;
    block('iron',u-.176,u+.176,top-.047,top+.032,v-.449,v+.449);
    for(const d of [-.248,.248]){
      pipe('gunmetal',[u,top-.048,v+d],[u,1.792,v+d],.012);
      stamp('steel',loop,u-.012,1.773,v+d,[.025,.034,.026]);
    }
    box('tunnelMetal',u,1.186,v,.084,.579,.778);
    box(i===1?'wood':'blueTin',u-.047,1.228,v,.022,.510,.738);
    artTile(i===1?'pretzel':'diamond',u-.060,1.478,v,.710,.482,pi);
    for(const d of [-.319,.319])for(const y of [1.249,1.717]){
      pipe('steel',[u-.050,y,v+d],[u-.067,y,v+d],.012);
    }
    artTile('impact',u-.062,1.456,v,.582,.376,pi);
    hit(u-.054,u+.053,v-.392,v+.392);
  }
  for(let i=0;i<8;i++){
    const v=-5.291+i*.572,h=1.855+(i%3)*.013;
    block('rubber',33.304,33.497,.042,h,v,v+.557);
    for(let k=0;k<5;k++)block('gunmetal',33.277,33.306,.11+k*.33,.133+k*.33,v+.017,v+.542);
    if(i%2===0)artTile('impact',33.268,.99,v+.28,.493,1.53,pi,0,i*.29);
  }
  hit(33.276,33.50,-5.29,-.732);
  knob.dispose();loop.dispose();
}
