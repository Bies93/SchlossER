import {LAB,LAB_CELLS,labCellAt,labLower} from './lab-layout.js';
import {wardEvidence} from './lab-ward-evidence.js';
import {fileRacks,publicDeskDressing,traceAtWindow} from './lab-rites-office.js';
import {buildLodgeAltar} from './lab-rites-sanctum.js';

const {floor:Y,ceiling:C}=LAB,pi=Math.PI,flat=-pi/2;
export const RITE_ROOMS={
  ritesAccess:{name:'Personalweg · Herkunftsstelle',palette:['civicWall','copperDark'],tiles:['concrete','labFloorPatch'],tile:.83},
  registry:{name:'Amt für Herkunftsbereinigung',palette:['civicWall','green'],tiles:['porcelain','ceramic'],tile:.63},
  nameFiles:{name:'Namensregister',palette:['archiveWall','green'],tiles:['concrete','labFloorPatch'],tile:.74},
  chapel:{name:'Kapelle der zweiten Geburt',palette:['riteWall','copperDark'],tiles:['fineStone','vaultWall'],tile:.77},
  ritesPass:{name:'Leitungsweg · Ritenstelle',palette:['fineStone','copperDark'],tiles:['concrete','gasket'],tile:.81},
  tasting:{name:'Prüfstube für Bier und Bekenntnis',palette:['archiveWall','copperDark'],tiles:['ceramic','porcelain'],tile:.70}
};
export const RITE_LIGHTS={
  ritesAccess:[[-17.49,54.89,0xd0dac9,16,5.2],[-17.20,56.55,0xc49e70,12,5.4]],
  registry:[[-13.25,55.89,0xeecca0,21,7.4],[-9.21,57.32,0xdee3ce,24,8.1],[-6.58,59.74,0xa7c7bc,22,7.1],[-12.44,61.18,0xe2dabc,17,6.6]],
  nameFiles:[[-8.55,63.78,0xc8dbcc,20,6.0],[-11.88,65.09,0xc1bea2,16,6.1],[-7.73,67.23,0xefd7ab,23,6.3]],
  chapel:[[-8.63,43.84,0xcba681,18,7.3],[-6.70,48.11,0x87c6bc,13,5.4,.60],[-3.14,48.09,0xe8ad70,21,6.5,2.59],[-6.13,51.51,0xbb906e,16,6.7]],
  ritesPass:[[-8.33,33.54,0xc9b494,15,6.1],[-8.53,37.34,0xafc7b8,15,6.7],[-9.12,40.58,0xc0986d,16,5.9]],
  tasting:[[-6.99,24.59,0xd6dec4,20,7.4],[-4.79,27.65,0xf0c98e,26,7.0],[-3.20,30.11,0xe4bf8a,18,6.6],[-8.23,30.38,0xdbc28f,15,6.1]]
};
export const CHAPEL_SOURCE={x:-4.30,z:50.08};
export const CHAPEL_TRACK=[
  'Ich bin freiwillig hier. Von daheim ist nichts in mir geblieben.',
  'Ich bin freiwillig hier. Von daheim ist nichts in mir geblieben.',
  'Ich bin freiwillig hier. Von daheim ist … alles in mir geblieben.'
];
export const inChapelHearing=(p,range)=>labLower(p.y)&&labCellAt(p.x,p.z)==='chapel'&&
  Math.hypot(CHAPEL_SOURCE.x-p.x,CHAPEL_SOURCE.z-p.z)<range;

export function fitRiteWing(T,kit,id,art){
  const {k,box,hit,pipe,obj,cylinder,luminaire,grille,wheel,dress,props,root}=kit;
  const {housing,rod,stain,plane,fastener,grill,dial}=dress;
  const [x0,x1,z0,z1]=LAB_CELLS[id],built=[];
  const put=(m,x,y,z,w,h,d,a=0)=>housing(m,x,Y+y,z,w,h,d,a);
  const line=(m,x,y,z,X,H,Z,r)=>pipe(m,[x,Y+y,z],[X,Y+H,Z],r);
  const cyl=(m,x,y,z,r,h)=>cylinder(m,x,Y+y,z,r,h);
  const turned=(rings,n=24)=>{
    const g=new T.LatheGeometry(rings.map(([a,b])=>new T.Vector2(a,b)),n);built.push(g);return g;
  };
  const tile=(key,x,y,z,w,h,a=0,rx=0,r=0)=>art.mount(root,key,x,y,z,w,h,a,rx,r);
  function mounted(key,x,y,z,w,h,a=0){
    const f=plane(x,Y+y,z,a),W=w/2,H=h/2;
    k.box('gunmetal',f,-W-.034,W+.034,-H-.029,H+.029,-.148,-.013);
    k.box('edge',f,-W-.018,W+.018,-H-.015,-H-.003,-.017,.007);
    for(const u of [-W*.76,W*.76])k.box('iron',f,u-.052,u+.052,-H*.64,H*.64,-.244,-.144);
    for(const u of [-W+.022,W-.022])for(const v of [-H+.022,H-.022])fastener(f,u,v,.004,.012,true);
    tile(key,x,y,z,w,h,a);
  }
  function document(key,x,y,z,w=.43,d=.29,rotate=0){
    put('leather',x,y,z,w+.031,.019,d+.030,rotate);
    put('paper',x,y+.017,z,w+.003,.022,d+.004,rotate);
    tile(key,x,y+.030,z,w,d,rotate,flat);
    const f=plane(x,Y+y+.038,z,rotate,flat);
    rod('brass',f(-w*.17,d*.43,0),f(w*.15,d*.43,0),.006);
  }
  function table(x,z,w,d,top=.94,mat='darkWood'){
    for(const s of [-1,1])for(const t of [-1,1]){
      const X=x+s*(w*.5-.085),Z=z+t*(d*.5-.085);
      put('iron',X,top*.466,Z,.057,top*.923,.057);
      put('gasket',X,.030,Z,.083,.062,.081);
    }
    put('gunmetal',x,top-.117,z,w*.94,.115,d*.89);
    put(mat,x,top,z,w,.065,d);
    for(const q of [-1,1])put('edge',x,top-.012,z+q*d*.49,w*.981,.020,.017);
    hit(x-w/2,x+w/2,z-d/2,z+d/2);
  }
  function chair(x,z,s=1,mat='infPad',index=0){
    put('gunmetal',x,.472,z,.452,.044,.442);
    put(mat,x,.516,z,.434,.074,.427);
    for(const a of [-1,1]){
      for(const b of [-1,1])line('iron',x+a*.204,.03,z+b*.188,x+a*.173,.479,z+b*.177,.017);
      line('edge',x+a*.169,.451,z+s*.155,x+a*.159,.957,z+s*.245,.015);
    }
    put('leather',x,.835,z+s*.230,.34,.196,.073);
    put(mat,x,.834,z+s*.187,.326,.172,.031);
    const f=plane(x,Y+.835,z+s*.270,s===1?0:pi);
    for(const a of [-.14,.14])fastener(f,a,0,.002,.009,index%3===1);
    hit(x-.238,x+.238,z-.248,z+.254);
  }
  function duct(mat,P,r){
    P.slice(1).forEach(([X,H,Z],i)=>{
      const [x,y,z]=P[i];line(mat,x,y,z,X,H,Z,r);
      if(i>0)cyl(mat,X,H,Z,r*1.10,r*1.45);
    });
  }
  function strip(mat,x,X,z,Z){
    box(mat,x,X,Y+.002,Y+.007,z,Z);
  }
  function timeClock(x,y,z){
    const f=plane(x,Y+y,z,pi),a=.46,b=.32;
    k.box('gasket',f,-a,a,-b,b,-.091,-.014);
    k.box('edge',f,-a+.04,a-.04,-b+.037,b-.039,-.017,.003);
    k.box('gunmetal',f,-a+.064,a-.064,-b+.049,b-.051,-.008,.012);
    rod('porcelain',f(0,0,.011),f(0,0,.035),.244);
    for(let j=0;j<12;j++){
      const t=j*pi/6,u=Math.sin(t),v=Math.cos(t);
      rod('iron',f(u*.179,v*.179,.038),f(u*.215,v*.215,.038),.005);
    }
    rod('rust',f(0,0,.041),f(-.008,-.127,.041),.012);
    rod('iron',f(0,0,.037),f(.093,.067,.037),.0086);
    rod('brass',f(0,0,.019),f(0,0,.053),.024);
  }
  for(const [i,[x,z]] of RITE_LIGHTS[id].entries()){
    if(id==='chapel'&&i===1)continue;
    luminaire(x,z,id==='nameFiles'||i===2&&id==='registry'?'cold':id==='ritesAccess'&&i===1?'red':'ivory');
  }

  if(id==='ritesAccess'){
    mounted('entry',-18.918,1.82,55.38,1.30,.74,pi/2);
    mounted('office',-16.052,2.79,56.41,1.66,.381,-pi/2);
    for(const z of [54.16,54.41,58.83]){
      for(let i=0;i<7;i++)strip(i%2?'iron':'ochre',-18.63+i*.345,-18.39+i*.345,z,z+.063);
    }
    for(const x of [-18.76,-16.31]){
      duct('copper',[[x,2.90,54.0],[x,2.90,59.30]],.057);
      for(const z of [54.28,55.75,58.23,59.13]){
        line('iron',x,2.90,z-.049,x,2.90,z+.049,.083);
        put('gunmetal',x,3.137,z,.064,.332,.105);
      }
    }
    put('green',-18.83,.81,58.13,.51,1.54,1.14);
    grill('edge',-18.552,1.044,58.13,.769,.471,pi/2);
    line('brass',-18.551,.62,58.52,-18.471,.72,58.52,.019);
    hit(-19.10,-18.54,57.55,58.72);
    stain(-18.08,.008,54.71,.94,.72,.35,2,flat);
  }

  if(id==='registry'){
    mounted('office',-14.8,2.093,53.945,2.10,.94);
    mounted('files',-6.945,2.76,61.91,1.89,.412,pi);
    mounted('rite',-8.21,2.77,53.959,1.83,.420);
    for(let i=0;i<5;i++)chair(-13.72+i*.67,54.82,-1,i===3?'leather':'infPad',i);
    table(-11.36,56.24,1.20,.54,.67);
    document('form',-11.36,.707,56.225,.438,.309,.095);
    cyl('gasket',-11.75,.735,56.26,.054,.022);cyl('darkWood',-11.75,.785,56.26,.032,.084);
    cyl('brass',-11.75,.832,56.26,.047,.025);
    const tx=-14.87,tz=56.82;
    put('green',tx,1.18,tz,.42,.389,.331);
    put('ochre',tx+.226,1.185,tz,.058,.27,.288);
    put('gasket',tx+.262,1.163,tz,.018,.035,.179);
    put('paper',tx+.286,1.154,tz,.067,.014,.107,.12);
    line('iron',tx,.045,tz,tx,.975,tz,.052);cyl('gunmetal',tx,.043,tz,.205,.078);
    hit(tx-.237,tx+.24,tz-.205,tz+.195);
    for(let i=0;i<9;i++)strip(i%5===0?'copperDark':'ochre',-11.95+i*.52,-11.64+i*.52,57.78,57.83);
    const start=-14.41,z=58.50;
    for(let i=0;i<3;i++){
      const x=start+1.06+i*2.03;
      table(x,z,1.94,.810,.951,'green');
      put('gunmetal',x,.598,z-.365,1.82,.632,.091);
      for(const s of [-1,1]){
        put('edge',x+s*.920,1.896,z,.082,1.752,.098);
        put('porcelain',x+s*.883,2.744,z,.063,.094,.143);
      }
      put('gunmetal',x,2.761,z,1.84,.080,.102);
      put('gunmetal',x,1.413,z,1.77,.053,.098);
      put('frost',x,2.128,z,1.741,1.185,.046);
      put('frost',x-.523,1.236,z,.692,.302,.043);
      put('frost',x+.523,1.236,z,.692,.302,.043);
      put('brass',x,1.065,z-.173,.361,.028,.48);
      put('gunmetal',x,1.083,z-.168,.304,.019,.397);
      document(i===0?'form':i===1?'reject':'seal',x+.543,.988,z-.165,.356,.265,.084*(i-1));
      chair(x,z+.883,1,i%2?'infPad':'leather',i);
      hit(x-.96,x+.96,z-.067,z+.064);
      traceAtWindow(kit,art,x,z,i,{put,line,cyl});
    }
    timeClock(-10.81,2.947,58.432);
    mounted('queue',-8.49,2.90,58.382,1.48,.625,pi);
    table(-12.56,61.07,2.47,.698,.96);
    document('reject',-12.99,.998,61.12,.43,.35,pi*.91);
    props.folio(-12.05,Y+1.003,61.05,.321,.35,pi+.15,4,{loose:true,thickness:.017});
    mounted('faceA',-14.53,1.651,61.932,1.10,1.01,pi);
    stain(-15.82,1.830,59.37,.77,1.83,pi/2,1);
    publicDeskDressing(kit,{mounted,document,put,line,table,cyl,strip});
  }

  if(id==='nameFiles'){
    fileRacks(kit,art);
    table(-13.05,67.60,2.68,.86,.916);
    document('faceB',-13.49,.952,67.48,.569,.437,pi*.91);
    document('seal',-12.34,.951,67.61,.361,.274,pi*.77);
    mounted('faceA',-8.95,1.781,68.224,1.83,1.46,pi);
    mounted('faceB',-6.79,1.781,68.224,1.83,1.46,pi);
    mounted('files',-14.65,2.012,62.319,1.67,.73);
    mounted('audit',-3.06,1.78,68.313,1.42,.76,pi);
    cyl('iron',-12.96,.969,67.887,.093,.039);
    line('gunmetal',-12.96,.980,67.887,-12.96,1.367,67.887,.016);
    line('gunmetal',-12.96,1.367,67.887,-12.779,1.466,67.762,.018);
    line('gunmetal',-12.779,1.466,67.762,-12.703,1.448,67.682,.012);
    put('green',-12.703,1.426,67.682,.268,.080,.138,.23);
    put('barGlow',-12.703,1.381,67.682,.222,.015,.098,.23);
    grille(-8.07,66.98,.58,1.39);
    stain(-5.75,1.558,68.374,1.2,2.48,pi,0);
  }

  if(id==='ritesPass'){
    for(const [i,x] of [-10.82,-10.54,-6.13].entries()){
      const y=2.84+i*.074;
      duct(i===1?'copperDark':'copper',[[x,y,32.05],[x,y,41.79]],i===1?.044:.079);
      for(let z=32.5;z<41.67;z+=1.09){
        line('iron',x,y,z-.047,x,y,z+.043,.09);
        put('edge',x,y+.189,z,.056,.301,.065);
      }
    }
    for(const z of [33.46,36.12,39.01,41.42])grille(-8.65,z,.69,.74);
    table(-10.32,37.59,.82,1.56,.849);
    put('green',-10.32,1.055,37.56,.552,.353,.753);
    dial(-9.996,1.096,37.52,.107,pi/2,2);grill('edge',-9.988,.948,37.57,.459,.133,pi/2);
    stain(-11.106,1.678,37.62,.82,2.02,pi/2,0);
    mounted('pipes',-6.051,1.83,36.63,1.6,.67,-pi/2);
    mounted('rite',-8.54,2.78,41.802,1.70,.412,pi);
    mounted('tasting',-7.97,2.78,32.006,1.71,.412);
    for(let z=32.26;z<41.42;z+=.43)strip('ochre',-6.48,-6.40,z,z+.211);
  }

  if(id==='chapel'){
    const x=-6.70,z=48.11;
    // Open bowl profile; the lip and glowing pool are separate surfaces.
    const basin=turned([[0,.041],[.550,.041],[.638,.065],[.705,.142],[.712,.201],[.617,.271],[.451,.311],
      [.377,.474],[.497,.555],[.715,.594],[.830,.715],[.845,.781],[.808,.821],[.764,.818],
      [.733,.758],[.643,.645],[.510,.604],[.248,.574],[0,.573]],36);
    obj('fineStone',basin,x,Y,z,1,1,1);
    cyl('wetRite',x,.697,z,.695,.025);
    cyl('riteGlow',x,.713,z,.167,.005);
    for(const r of [.302,.448,.601])obj('cold',wheel,x,Y+.711,z,r,r,.024,flat);
    obj('copper',wheel,x,Y+.795,z,.834,.834,.179,flat);
    for(let i=0;i<11;i++){
      const angle=i*2*pi/11,c=Math.cos(angle),s=Math.sin(angle);
      const X=x+c*.599,Z=z+s*.599;
      line('riteGlow',x+c*.423,.355,z+s*.423,X,.414,Z,.017);
      if(i%2===0)cyl('brass',X,.228,Z,.055,.045);
    }
    const drain=-5.486;
    duct('copperDark',[[x+.427,.462,z],[x+.944,.462,z],[drain,.351,z],[drain,.083,z]],.057);
    grille(drain,z,.39,.43);
    hit(x-.824,x+.846,z-.835,z+.835);
    hit(drain-.095,drain+.106,z-.076,z+.078);
    const blood=wardEvidence(T,kit);
    blood.mark('wipe',-5.83,.010,48.37,.69,.48,.45,flat);
    blood.mark('pool',-6.32,.009,48.91,.43,.54,-.17,flat);
    blood.finish();
    for(const X of [-10.80,-9.44,-8.07])for(const Z of [45.55,50.15]){
      for(const sign of [-1,1]){
        put('iron',X,.243,Z+sign*.72,.337,.452,.071);
        line('gunmetal',X-.227,.39,Z+sign*.697,X-.304,.92,Z+sign*.697,.025);
      }
      put('darkWood',X,.517,Z,.451,.067,1.61);
      put('wood',X-.294,.805,Z,.060,.215,1.62);
      put('darkWood',X-.292,.924,Z,.092,.056,1.64);
      hit(X-.345,X+.245,Z-.826,Z+.826);
    }
    buildLodgeAltar(T,kit,art,{put,line,cyl,document,mounted});
    const rx=-2.409,rz=48.10;
    for(const s of [-1,1]){
      const Z=rz+s*1.53;
      put('gunmetal',rx,.817,Z,.224,1.62,.226);
      put('fineStone',rx-.119,.631,Z,.055,1.15,.151);
      const end=rz+s*1.66;
      duct('copper',[[rx+.18,.150,end+s*.44],[rx-.24,.150,end+s*.44],[rx-.24,1.38,end+s*.44],
        [rx-.23,1.70,end],[rx-.22,2.97,end]],.066);
      for(const y of [.27,.69,1.14,2.12,2.73]){
        line('iron',rx-.229,y-.039,end,rx-.229,y+.041,end,.092);
        put('gunmetal',rx-.097,y,end,.217,.082,.144);
      }
    }
    for(let i=0;i<18;i++){
      const a=i*pi/18,d=(i+1)*pi/18,r=1.53,Z0=rz+r*Math.cos(a),Z1=rz+r*Math.cos(d),h=.80;
      const y=1.557+h*Math.sin(a),Q=1.557+h*Math.sin(d);
      line('copperDark',rx,y,Z0,rx,Q,Z1,.074);
      line('brass',rx-.053,y-.05,Z0,rx-.053,Q-.05,Z1,.029);
      if(i%3===1)put('brass',rx+.080,y,Z0,.190,.068,.092);
    }
    mounted('rite',-11.12,2.39,53.677,1.94,.53,pi);
    // Full width plus frame lies on the solid left wall, clear of
    // opening [-9.66, -7.41] and its steel reveal.
    mounted('oath',-10.92,1.83,z0+.067,1.38,.74);
    const {x:a,z:c}=CHAPEL_SOURCE;
    table(a,c,.70,.68,.813,'green');
    put('iron',a,.999,c,.558,.299,.489);
    put('gunmetal',a-.273,1.014,c,.060,.276,.421);
    for(const Z of [c-.101,c+.102]){
      line('brass',a-.329,1.030,Z,a-.281,1.030,Z,.075);
      line('gasket',a-.345,1.030,Z,a-.333,1.030,Z,.047);
      line('edge',a-.350,1.030,Z,a-.335,1.030,Z,.024);
    }
    line('rust',a-.338,.997,c-.088,a-.338,.985,c+.075,.007);
    put('brass',a-.291,.903,c,.055,.031,.093);
    document('oath',a+.026,.857,c+.246,.331,.126,pi/2);
    put('darkWood',a+.363,1.747,c+.334,.387,.515,.635);
    grill('edge',a+.164,1.747,c+.334,.544,.393,-pi/2);
    duct('copper',[ [a+.49,1.88,c+.56],[a+.77,1.94,c+.56],[x1-.165,1.94,c+.56],
      [x1-.165,2.94,c+.56] ],.030);
    hit(a+.16,a+.59,c+.018,c+.65);
    strip('copperDark',-11.74,-11.68,43.18,52.85);
    for(let i=0;i<14;i++)strip('ochre',-11.89,-11.76,43.43+i*.66,43.46+i*.66);
  }

  if(id==='tasting'){
    const glass=turned([[.286,0],[.372,.039],[.298,.126],[.271,.177],[.576,.219],[.766,.422],[.79,.788],
      [.704,.977],[.642,1],[.603,.979],[.650,.820],[.657,.581],[.500,.352],[.232,.252],[0,.227]],23);
    const bottle=turned([[.58,0],[.68,.034],[.72,.65],[.56,.744],[.31,.822],[.30,.94],
      [.39,.948],[.38,1],[.23,1],[.21,.95],[0,.944]],17);
    function mug(x,y,z,color){
      obj('beerGlass',glass,x,Y+y,z,.133,.177,.130);
      cyl(color,x,y+.114,z,.081,.091);
      cyl('foam',x,y+.165,z,.079,.010);
      obj('brass',wheel,x+.133,Y+y+.082,z,.052,.055,.085);
      obj('porcelain',wheel,x,Y+y+.002,z,.113,.111,.037,flat);
    }
    function bottleAt(x,z,y,i,branded=false){
      obj(i%4===0?'glassDark':'beerGlass',bottle,x,Y+y,z,.083,.323,.081);
      cyl('paper',x,y+.165,z,.060,.098);
      cyl('brass',x,y+.327,z,.031,.024);
      if(branded)art.band(root,'bottle',x,y+.164,z,.0609,.082);
      else put('rust',x-.060,y+.17,z,.011,.035,.069);
    }
    const row=-5.44,barZ=27.66;
    table(row,barZ,4.17,.958,1.024,'darkWood');
    for(let i=0;i<4;i++){
      const x=-6.99+i*1.032;
      chair(x,28.60,1,i%2?'infPad':'leather',i);
      put('green',x,1.179,barZ-.300,.383,.238,.081);
      const name='0'+(i+1);
      dress.plaque(name,['JURY'],x,1.188,barZ-.347,.310,.160,pi,'cream',0,false);
      mug(x-.237,1.058,barZ+.073,i%2?'paleBeer':'deepBeer');
      document(i===2?'result':'score',x+.169,1.059,barZ+.047,.324,.266,pi+.044*(i-1));
      line('darkWood',x+.332,1.106,barZ-.105,x+.329,1.107,barZ+.046,.007);
      line('brass',x+.329,1.107,barZ+.046,x+.328,1.107,barZ+.068,.005);
    }
    mounted('tasting',-6.90,2.149,23.108,2.14,.91);
    mounted('result',-4.87,1.824,31.57,1.65,1.14,pi);
    mounted('bottle',-1.757,2.13,27.19,2.07,.96,-pi/2);
    const a=-2.26;
    table(a,26.79,.781,3.08,.872,'green');
    for(const h of [1.398,1.773]){
      put('wood',a+.208,h,26.97,.475,.039,2.44);
      for(const z of [25.91,27.01,28.01])line('gunmetal',a+.35,h-.13,z,a+.032,h-.019,z,.017);
      for(let q=0;q<9;q++)bottleAt(a+.067,25.92+q*.244,h+.021,q,true);
    }
    for(const z of [25.84,26.28,27.70])mug(a-.129,.908,z,'paleBeer');
    document('bottle',a-.10,.909,26.92,.452,.358,pi/2);
    const cart=-3.84,cv=29.87;
    for(const dx of [-.25,.25])for(const dz of [-.365,.365]){
      obj('gasket',wheel,cart+dx,Y+.107,cv+dz,.072,.072,.339,0,pi/2);
      put('edge',cart+dx,.27,cv+dz,.051,.36,.060);
      put('gunmetal',cart+dx,.596,cv+dz,.045,.43,.054);
    }
    for(const h of [.323,.819]){
      put('green',cart,h,cv,.65,.055,.96);
      for(const d of [-.319,.319])line('edge',cart+d,h+.040,cv-.468,cart+d,h+.04,cv+.465,.016);
      for(const d of [-.468,.465])line('edge',cart-.31,h+.040,cv+d,cart+.32,h+.04,cv+d,.016);
    }
    for(const dx of [-.26,.26])line('edge',cart+dx,.849,cv+.42,cart+dx,1.013,cv+.50,.018);
    line('edge',cart-.26,1.013,cv+.50,cart+.26,1.013,cv+.50,.018);
    for(let j=0;j<5;j++){
      bottleAt(cart-.12,cv-.31+j*.143,.846,j);
      if(j%2===0)mug(cart+.153,.848,cv-.282+j*.142,'deepBeer');
    }
    hit(cart-.36,cart+.36,cv-.5,cv+.53);
    for(const [x,z,w,a] of [[-7.41,25.00,.68,.25],[-6.61,28.31,.67,.08],[-3.18,30.39,.68,.88]])
      stain(x,.009,z,w,w*.66,a,2,flat);
  }
  built.forEach(g=>g.dispose());
  art.finish(root);
}
