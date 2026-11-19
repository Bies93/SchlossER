import {architectureKit} from './architecture-kit.js';
import {LAB,LAB_CELLS,LODGE_RUN,labLower} from './lab-layout.js';
import {SOUTH_HATCH} from './palace-openings.js';
import {randomSource} from './surface-detail.js';

const {floor:Y,top,ceiling:C}=LAB,pi=Math.PI,flat=-pi/2;
export const LODGE_ROOMS={
  southVest:{name:'Wohntrakt B–Süd · Schleuse',palette:['fineStone','green'],tiles:['concrete','labFloorPatch']},
  southSpine:{name:'Wohntrakt B–Süd · Flur',palette:['archiveWall','copperDark'],tiles:['ceramic','concrete']},
  southBarracksA:{name:'Kaserne I · Frühschicht',palette:['civicWall','green'],tiles:['fineStone','labFloorPatch'],tile:.73},
  southBarracksB:{name:'Kaserne II · Nachtschicht',palette:['archiveWall','copperDark'],tiles:['fineStone','vaultWall'],tile:.73},
  southMess:{name:'Küche und Kantine',palette:['labTileWall','green'],tiles:['porcelain','ceramic'],tile:.59},
  southPrivate:{name:'Betriebsliebe · Privatkammer',palette:['riteWall','logeCloth'],tiles:['vaultWall','fineStone'],tile:.70},
  southShrine:{name:'Andacht · Der zweite Name',palette:['riteWall','copperDark'],tiles:['fineStone','vaultWall'],tile:.72}
};
export const LODGE_LIGHTS={
  southStair:[[25.67,-6.55,0xe9c29b,9,4.5,3.55],[28.49,-6.47,0xbacbb5,13,4.7,2.52],[30.39,-6.46,0xf4cd9b,16,5.2,1.17]],
  southVest:[[31.81,-6.47,0xf1d6ae,18,6.1],[33.76,-7.90,0xb9cdbc,13,5.4]],
  southSpine:[[32.04,-10.04,0xe2b87f,16,5.8],[31.90,-13.12,0xcfccb0,17,6.2],[32.34,-16.16,0xddb383,16,6.4]],
  southBarracksA:[[20.52,-10.35,0xd7dbc0,18,6.7],[24.10,-11.17,0xc6dcd0,19,6.7],[27.95,-11.78,0xf1d5a0,17,6.3]],
  southBarracksB:[[21.56,-14.98,0xcf8663,12,5.5],[24.75,-15.79,0xafbcba,16,6.3],[28.08,-15.42,0xe9bf8f,16,6.1]],
  southMess:[[31.79,-20.17,0xf3d8b4,27,7.9],[27.34,-20.06,0xffcc95,24,7.8],[30.88,-23.72,0xd3e1c3,26,7.5],[24.18,-24.65,0xebca98,18,6.4]],
  southPrivate:[[20.48,-21.95,0xe68c91,16,6.0],[17.54,-23.95,0xf2a372,22,6.4,2.07],[17.07,-20.52,0xb9a0bc,14,5.3]],
  southShrine:[[25.64,-27.35,0xc09368,16,6.4],[25.88,-30.33,0xe4a669,18,6.2,1.84],[22.87,-29.07,0x8ca99a,11,6.3]]
};

export function lodgeStair(T,root,world,M,mount){
  const {x0,x1,z0,z1,end}=SOUTH_HATCH,k=architectureKit(T,root,M);
  const coords=(x,y,z)=>[x,y,z],mid=(z0+z1)*.5;
  const box=(m,a,b,y,t,c,d)=>k.box(m,coords,a,b,y,t,c,d);
  const pipe=new T.CylinderGeometry(1,1,1,10),up=new T.Vector3(0,1,0),P=new T.Vector3(),Q=new T.Vector3(),D=new T.Vector3();
  const m=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3();
  const rod=(mood,A,B,r)=>{
    P.fromArray(A);Q.fromArray(B);D.subVectors(Q,P);
    k.geometry(mood,pipe,m.compose(P.lerp(Q,.5),q.setFromUnitVectors(up,D.clone().normalize()),s.set(r,D.length(),r)));
  };
  for(let j=0;j<LAB.count;j++){
    const x=x0+j*LODGE_RUN,y=top-(j+1)*LAB.riser,xEnd=x0+(j+1)*LODGE_RUN;
    box('concrete',x,xEnd,Y-.10,y-.042,z0,z1);
    box('fineStone',x-.008,xEnd-.002,y-.042,y,z0+.004,z1-.004);
    box('iron',x-.017,x+.028,y-.022,y+.002,z0+.067,z1-.066);
    if(j===2||j===12||j===19)for(const z of [z0+.11,z1-.25])box('ochre',x+.035,x+.093,y+.002,y+.005,z,z+.142);
  }
  for(const [a,b,sgn] of [[z0-.128,z0,-1],[z1,z1+.133,1]]){
    box('fineStone',x0-.009,end+.023,Y-.142,top-.030,a,b);
    const z=sgn<0?z0+.014:z1-.014;
    for(let i=0;i<8;i++){
      const n=x0+.35+i*.735;
      box('archiveWall',n-.004,n+.660,Y-.001,top-.034,z-.012,z+.012);
    }
    world.box(x0+.03,a,end-.018,b,o=>o.y<top-.10&&o.y>Y-.26);
  }
  box('concrete',x1,end+.024,top-.155,top-.039,z0-.117,z1+.119);
  const xA=x0+.52,xB=end-.197,h=x=>Math.max(Y,top-LAB.riser*(x-x0)/LODGE_RUN)+.84;
  for(const z of [z0+.087,z1-.090]){
    rod('copperDark',[xA,h(xA),z],[xB,h(xB),z],.025);
    for(let i=0;i<6;i++){
      const x=xA+.22+i*.967,y=h(x),side=z>mid?z1:z0;
      box('rust',x-.039,x+.039,y-.029,y+.075,side-.034,side+.034);
      rod('edge',[x,y,side],[x,y,z],.014);
    }
  }
  for(const x of [26.62,28.18,29.70]){
    const h=Math.min(top-.09,top-LAB.riser*(x-x0)/LODGE_RUN+.58),z=z0+.06;
    box('gunmetal',x-.183,x+.183,h-.102,h+.108,z0-.033,z+.015);
    box('ivory',x-.135,x+.133,h-.050,h+.050,z+.015,z+.030);
    for(const q of [-.126,-.042,.047,.131])box('iron',x+q-.007,x+q+.007,h-.075,h+.076,z+.028,z+.041);
  }
  k.flush('Wohntrakt · Kellertreppe, Fugen und Handlauf');
  mount(root,'entry',end-.184,2.63,mid,1.26,.284,-pi/2);
  pipe.dispose();
}

export function lodgeDressing(T,kit,id,mount){
  const {k,box,hit,pipe,cylinder,obj,wheel,dress,props,root}=kit;
  const [x0,x1,z0,z1]=LAB_CELLS[id],{housing,plane,fastener,stain,grill,dial}=dress,rng=randomSource(1931+id.length);
  const P=(x,y,z)=>[x,Y+y,z];
  const frame=(o,x,y,z,w,h,d,angle=0)=>housing(o,x,Y+y,z,w,h,d,angle);
  const bar=(m,x,y,z,X,h,Z,r)=>pipe(m,P(x,y,z),P(X,h,Z),r);
  const round=(m,x,y,z,r,h)=>cylinder(m,x,Y+y,z,r,h);
  const sign=(id,x,y,z,w,h,ry=0)=>mount(root,id,x,y,z,w,h,ry);
  function board(id,x,y,z,w,h,ry=0){
    const p=plane(x,Y+y,z,ry),W=w*.5,H=h*.5;
    k.box('darkWood',p,-W-.032,W+.032,-H-.028,H+.030,-.11,-.006);
    for(const s of [-1,1]){
      k.box('brass',p,s*W-.009,s*W+.009,-H-.029,H+.029,-.012,.008);
      for(const t of [-1,1])fastener(p,s*(W-.025),t*(H-.023),.005,.010);
    }
    sign(id,x,y,z,w,h,ry);
  }
  const V=new T.SphereGeometry(1,14,9),poly=new T.IcosahedronGeometry(1,1);
  function stamp(m,g,x,y,z,w,h,d,rx=0,ry=0,rz=0){obj(m,g,x,Y+y,z,w,h,d,rx,ry,rz);}
  function lantern(x,y,z,variant=0,ceilingDrop=false){
    const hue=variant===2?'tintedBulb':variant===1?'barGlow':'ivory';
    if(ceilingDrop)bar('iron',x,y,z,x,C-Y+.045,z,.021);
    round('brass',x,y,z,.142,.072);
    round(hue,x,y-.122,z,.098,.221);
    round('gunmetal',x,y-.237,z,.130,.048);
    for(let i=0;i<6;i++){
      const a=i*pi/3,U=x+Math.cos(a)*.114,Z=z+Math.sin(a)*.114;
      bar('copperDark',U,y-.031,Z,U,y-.231,Z,.009);
    }
  }
  function footing(x,z,w,d){
    hit(x-w*.5,x+w*.5,z-d*.5,z+d*.5);
  }
  function desk(x,z,w,d,top=.88,mat='darkWood'){
    frame('iron',x,top-.131,z,w-.057,.092,d-.053);
    frame(mat,x,top,z,w,.067,d);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const X=x+sx*(w*.5-.074),Z=z+sz*(d*.5-.069);
      frame('gunmetal',X,(top-.082)*.5,Z,.060,top-.082,.062);
      frame('gasket',X,.044,Z,.081,.067,.077);
    }
    for(const f of [-1,1])bar('edge',x-w*.47,top-.005,z+f*(d*.5+.007),x+w*.47,top-.005,z+f*(d*.5+.007),.009);
    footing(x,z,w,d);
  }
  function seat(x,z,a=0,kind='logeCloth',back=true){
    const p=plane(x,Y,z,a),b=(m,A,B,C,D,E,F)=>k.box(m,p,A,B,C,D,E,F);
    for(const s of [-1,1]){
      for(const d of [-1,1])barSeat(s,d);
      if(back)pipe('iron',p(s*.169,.443,.162),p(s*.173,.935,.245),.015);
    }
    b('iron',-.225,.225,.420,.479,-.207,.221);
    b(kind,-.205,.205,.471,.535,-.205,.208);
    if(back){
      b(kind,-.211,.211,.727,.938,.216,.274);
      for(const s of [-1,1])fastener(p,s*.175,.821,.269,.008,true);
    }
    function barSeat(s,d){pipe('gunmetal',p(s*.207,.022,d*.194),p(s*.174,.461,d*.178),.018);}
    footing(x,z,.49,.49);
  }
  function rug(x,z,w,d,m='logeCloth'){
    const A=x-w/2,B=x+w/2,E=z-d/2,F=z+d/2;
    box(m,A,B,Y+.002,Y+.011,E,F);
    for(const Z of [E+.048,F-.058])box('brocade',A+.048,B-.048,Y+.0114,Y+.013,Z,Z+.009);
    for(const X of [A+.050,B-.058])box('brocade',X,X+.008,Y+.0131,Y+.014,E+.052,F-.053);
  }
  function cupboard(x,z,w,d,h,ry=pi,drawers=3,key='green'){
    const p=plane(x,Y,z,ry),F=d*.5;
    const b=(m,a,b,c,d,e,f)=>k.box(m,p,a,b,c,d,e,f);
    b('iron',-w*.5,w*.5,.014,.120,-F,F);
    b('gunmetal',-w*.492,w*.492,.106,h,-F+.012,F-.034);
    b('edge',-w*.499,w*.499,h-.050,h+.008,-F,F);
    const step=(h-.235)/drawers;
    for(let j=0;j<drawers;j++){
      const q=.125+step*j;
      b(key,-w*.455,w*.455,q,q+step-.022,F-.043,F+.008);
      if(j%2===0){
        b('iron',-w*.27,-w*.04,q+step*.63,q+step*.75,F+.006,F+.025);
        b('paper',-w*.247,-w*.066,q+step*.65,q+step*.725,F+.024,F+.029);
      }
      const A=.098,H=q+step*.44;
      for(const a of [-A,A])pipe('brass',p(a,H,F),p(a,H+.004,F+.041),.009);
      pipe('brass',p(-A,H+.004,F+.041),p(A,H+.004,F+.041),.009);
    }
    footing(x,z,Math.abs(Math.cos(ry))*w+Math.abs(Math.sin(ry))*d,Math.abs(Math.sin(ry))*w+Math.abs(Math.cos(ry))*d);
  }
  function paper(id,x,y,z,w=.40,d=.28,ry=0){
    frame('leather',x,y,z,w+.027,.020,d+.026,ry);
    frame('leafEdge',x,y+.013,z,w,.017,d,ry);
    mount(root,id,x,y+.023,z,w-.007,d-.009,ry,flat);
  }
  for(const [i,[x,z]] of LODGE_LIGHTS[id].entries()){
    if(id==='southPrivate')lantern(x,i===1?2.66:2.93,z,i===1?1:2,true);
    else if(id==='southShrine')lantern(x,3.03,z,i===0?0:1,true);
    else kit.luminaire(x,z,id==='southBarracksB'&&i===0?'red':i%2===1&&id!=='southMess'?'cold':'ivory');
  }

  if(id==='southVest'){
    board('entry',34.794,2.014,-6.58,2.18,.81,-pi/2);
    board('plaque',32.04,2.699,z0+.170,1.66,.34);
    cupboard(34.31,-5.33,.84,.61,1.27,pi,3);
    frame('slateBlue',34.26,1.358,-5.36,.468,.132,.366,.12);
    paper('shift',34.23,1.438,-5.39,.419,.29,.43);
    frame('darkWood',32.19,.443,-5.28,1.53,.079,.469);
    for(const x of [31.57,32.81])frame('iron',x,.235,-5.28,.066,.443,.391);
    footing(32.19,-5.28,1.54,.46);
    kit.grille(31.37,-6.47,.52,1.17);
  }
  if(id==='southSpine'){
    for(const [z,ink] of [[-11.00,'bunksA'],[-15.25,'bunksB']])board(ink,x0+.186,2.745,z,1.46,.340,pi/2);
    board('kitchen',31.91,2.76,z0+.190,1.56,.34);
    for(const x of [x1-.24,x1-.46]){
      bar('copper',x,2.925,z0+.12,x,2.925,z1-.145,.061);
      for(let j=0;j<7;j++){
        const z=z0+.60+j*1.18;
        bar('iron',x,2.925,z-.049,x,2.925,z+.048,.090);
        bar('edge',x,3.019,z,x,3.385,z,.024);
      }
    }
    cupboard(34.42,-13.05,.99,.52,1.14,-pi/2,3,'rust');
    paper('register',34.36,1.238,-13.1,.38,.29,-1.23);
    for(const z of [-9.62,-12.52,-15.61])kit.grille(33.87,z,.56,.81);
    stain(34.90,1.79,-14.16,.78,1.86,-pi/2,0);
  }

  function bunk(x,z,ide,night=false){
    const top=[.455,1.767],F=z+.85,mat=night?'slateBlue':'green';
    for(const q of [-.431,.431])for(const b of [-1.012,1.012]){
      bar('gunmetal',x+q,.029,z+b,x+q,2.23,z+b,.030);
      round('gasket',x+q,.047,z+b,.045,.062);
      round('brass',x+q,2.239,z+b,.038,.04);
    }
    for(const h of top){
      frame('iron',x,h-.045,z,.938,.086,2.06);
      frame('infPad',x,h+.049,z,.867,.134,1.951);
      frame('infSheet',x,h+.114,z,.845,.040,1.92);
      const t=(u,v)=>{
        const U=(u-.50)*.826,s=v-.5;
        const wrap=Math.max(0,(Math.abs(u-.5)-.447)*.32);
        return P(x+U,h+.146+Math.cos(v*22+u*15)*.010-wrap,z-.928+v*1.415+Math.sin(u*13)*.012);
      };
      for(let n=0;n<11;n++)for(let j=0;j<8;j++)
        k.quad(ide%3===0&&n===10?'brocade':mat,t(j/8,n/11),t(j/8,(n+1)/11),t((j+1)/8,(n+1)/11),t((j+1)/8,n/11),.44);
      stamp('infSheet',V,x-.05,h+.173,z+.681,.298,.073,.170,0,.02*(ide%3-.9));
      for(const dx of [-.359,.359])bar('edge',x+dx,h+.226,F-.12,x+dx,h+.226,F+.109,.014);
    }
    for(const u of [-.5,-.283])bar('edge',x+u,.045,F,x+u,1.858,F,.019);
    for(let j=0;j<7;j++)bar('gunmetal',x-.501,.191+j*.219,F,x-.283,.191+j*.219,F,.015);
    footing(x-.031,z,.995,2.089);
  }
  if(id==='southBarracksA'||id==='southBarracksB'){
    const night=id==='southBarracksB';
    const ids=night?[21.12,23.05,24.96]:[19.67,21.65,23.64,25.64];
    for(const [i,x] of ids.entries())bunk(x,z0+1.15,i+(night?4:0),night);
    for(const x of night?[20.18,21.11,22.04]:[18.69,19.62,20.55]){
      cupboard(x,z1-.337,.85,.59,1.94,pi,4,night?'slateBlue':'green');
    }
    const a=night?26.27:27.04,z=z1-.65;
    desk(a,z,1.62,.76,.912,'darkWood');
    paper('shift',a-.324,.952,z-.088,.432,.293,.10);
    for(const w of [-.258,.185])props.folio(a+.15+w,Y+.953,z+.12,.31,.216,.63+w,7,{loose:true,thickness:.026});
    round('iron',a+.551,.972,z-.229,.064,.047);
    round('paper',a+.551,1.001,z-.229,.049,.043);
    seat(a-.33,z-.822,pi,'infPad',false);
    board('shift',a,1.84,z1-.071,1.49,.68,pi);
    board(night?'crest':'bunksA',x0+.07,1.88,(z0+z1)*.5,1.50,.71,pi/2);
    for(const [i,x] of ids.entries()){
      if(i===0)continue;
      const w=x+.47;
      frame(night?'slateBlue':'fileKraft',w,.148,z1-.12,.245,.236,.142);
      for(let j=0;j<2;j++)frame('brocade',w-.046+j*.092,.281,z1-.12,.021,.034,.153);
      stain(w,.009,z0+2.33,.47,.69,rng()-.5,2,flat);
    }
    if(night)rug(24.09,z0+2.39,3.94,.56,'slateBlue');
  }

  const vessel=new T.LatheGeometry([[.45,0],[.56,.022],[.68,.12],[.83,.53],[.97,.84],[1,.967],
    [.94,1],[.86,.97],[.77,.74],[.59,.37],[.37,.13],[0,.12]].map(([r,y])=>new T.Vector2(r,y)),20);
  function cup(x,y,z,m='porcelain'){
    stamp(m,vessel,x,y,z,.052,.111,.052);
    stamp(m,wheel,x+.061,y+.062,z,.024,.030,.055);
  }
  function bottle(x,y,z,band='paper',c='beerGlass'){
    round(c,x,y+.092,z,.044,.172);round(c,x,y+.192,z,.027,.056);
    round('brass',x,y+.224,z,.031,.014);round(band,x,y+.103,z,.045,.059);
  }
  function placeSetting(x,y,z,i){
    stamp('porcelain',vessel,x,y,z,.144,.039,.144);
    stamp(i%2?'green':'edge',wheel,x,y+.030,z,.113,.113,.032,flat);
    bar('edge',x-.192,y+.020,z-.074,x-.192,y+.020,z+.084,.006);
    stamp('edge',V,x-.193,y+.021,z+.090,.015,.005,.030);
    bar('iron',x+.176,y+.020,z-.073,x+.179,y+.022,z+.102,.005);
    for(const dx of [-.010,0,.010])bar('edge',x+.178+dx,y+.023,z-.081,x+.178+dx,y+.023,z-.110,.0029);
    cup(x-.295,y,z+.116,i%2?'porcelain':'slateBlue');
  }
  function pot(x,y,z,r=.23){
    stamp('edge',vessel,x,y,z,r,r*.95,r);
    stamp('gunmetal',V,x,y+.225*r/.23,z,r*.91,.038,r*.91);
    round('wood',x,y+.235*r/.23,z,r*.23,.048);
    for(const s of [-1,1]){
      bar('iron',x+s*r*.8,y+.144,z-.079,x+s*r*1.32,y+.144,z-.079,.010);
      bar('iron',x+s*r*1.32,y+.144,z-.079,x+s*r*1.32,y+.144,z+.077,.015);
      bar('iron',x+s*r*1.32,y+.144,z+.077,x+s*r*.83,y+.144,z+.077,.010);
    }
  }
  if(id==='southMess'){
    // Wipe-clean mess at the middle, working kitchen at the right-hand wall.
    const counter=34.40,mid=-21.13;
    desk(counter,mid,.79,5.38,.923,'edge');
    for(const z of [-18.88,-20.12,-21.85,-23.09]){
      frame('green',counter,.50,z,.641,.715,1.06);
      frame('gunmetal',counter-.331,.543,z,.042,.593,.997);
      bar('edge',counter-.368,.733,z-.176,counter-.369,.733,z+.176,.012);
    }
    frame('gasket',counter,.973,-19.82,.634,.024,.781);
    stamp('edge',vessel,counter,.958,-19.82,.294,.105,.359);
    bar('edge',counter+.239,.963,-19.81,counter+.239,1.275,-19.81,.023);
    bar('edge',counter+.239,1.275,-19.81,counter-.037,1.275,-19.81,.023);
    bar('edge',counter-.037,1.275,-19.81,counter-.037,1.184,-19.81,.018);
    round('gasket',counter,.993,-19.82,.057,.013);round('edge',counter,.999,-19.82,.041,.009);
    for(const z of [-22.88,-22.34]){
      round('iron',counter,.974,z,.218,.054);stamp('gunmetal',wheel,counter,1.002,z,.139,.139,.053,flat);
      round('brass',counter-.275,.988,z+.15,.030,.018);
    }
    pot(counter,1.023,-22.89);
    frame('wood',counter-.040,.989,-21.37,.415,.048,.354);
    for(let i=0;i<5;i++)stamp(i%3?'wardBone':'ochre',poly,counter-.126+(i%2)*.13,1.061,-21.50+i*.048,.055,.041,.050);
    const zh=-21.10;
    frame('iron',x1-.191,1.82,zh,.341,.039,4.62);
    for(let j=0;j<10;j++){
      const z=zh-1.91+j*.419;
      if(j%3===0)cup(x1-.210,1.851,z,'porcelain');
      else bottle(x1-.193,1.854,z,j%3?'fileKraft':'paper',j%3===1?'beerGlass':'green');
      if(j%2===0)bar('gunmetal',x1-.251,1.781,z,x1-.052,1.543,z,.017);
    }
    cupboard(34.39,-24.81,1.05,.782,2.064,-pi/2,2,'slateBlue');
    board('menu',22.284,1.893,-18.59,1.71,.83,pi/2);
    board('privateSign',22.398,2.766,-22.24,1.83,.344,pi/2);
    board('shrine',25.69,2.756,z0+.175,1.78,.374);
    board('kitchen',31.07,1.888,z0+.079,1.72,.71);
    const x=26.95,z=-20.23;
    rug(x,z,4.77,2.76,'infPad');
    desk(x,z,3.17,1.049,.872,'darkWood');
    for(const [i,dx] of [-.99,0,1.01].entries())for(const s of [-1,1]){
      const ZZ=z+s*.94;
      seat(x+dx,ZZ,s===1?0:pi,i%2===1?'logeCloth':'infPad');
      placeSetting(x+dx,.915,z+s*.286,i);
    }
    frame('logeCloth',x,.915,z,2.98,.008,.332);
    for(const dx of [-.843,1.02])bottle(x+dx,.924,z,'paper');
    stamp('porcelain',vessel,x+.30,.927,z,.185,.086,.183);
    for(let j=0;j<4;j++)stamp('ochre',V,x+.245+(j%2)*.076,.988,z-.058+j*.038,.038,.025,.039);
    paper('menu',x-.299,.926,z+.054,.369,.204,-.08);
    desk(30.57,-24.55,1.08,.79,.891,'green');
    const A=[30.31,30.53,30.76,30.96];
    for(const [i,x] of A.entries())bottle(x,.930,-24.64,i%2?'paper':'fileKraft');
    stamp('porcelain',vessel,30.42,.923,-24.36,.143,.051,.14);
    for(let i=0;i<6;i++)stain(30.24+i*.20,.006,-21.93+i*.31,.48,.51,i*.13,2,flat);
  }

  function curtain(x,z,w,h,ry,low=.161,material='plum'){
    const p=plane(x,Y+low,z,ry);
    const start=-w*.5,fx=(u,v)=>p(start+u*w,v*h,.061*Math.cos(u*w*39)*(1-v*.31)+.018*Math.sin(u*52+v*4));
    for(let j=0;j<24;j++)for(let i=0;i<9;i++)
      k.quad(i===0?'brocade':material,fx(j/24,i/9),fx((j+1)/24,i/9),fx((j+1)/24,(i+1)/9),fx(j/24,(i+1)/9),.48);
    pipe('brass',p(start-.062,h+.025,0),p(-start+.065,h+.025,0),.027);
    for(let j=0;j<8;j++){
      const a=start+w*(j+.37)/8;
      pipe('brocade',p(a,h-.071,.012),p(a,h+.041,.012),.009);
    }
    for(const a of [start,-start])pipe('iron',p(a,h+.024,0),p(a,h+.024,-.132),.028);
  }
  if(id==='southPrivate'){
    // Empty and intentionally cheeky: a privately used, over-decorated room,
    // not another laboratory chamber. The objects tell the joke.
    rug(18.01,-23.32,4.17,3.99);
    const x=17.82,z=-23.84;
    frame('copperDark',x,.181,z,2.23,.302,2.44);
    frame('darkWood',x,.335,z,2.35,.151,2.48);
    frame('plum',x,.500,z,2.22,.228,2.294);
    frame('logeCloth',x,.617,z,2.18,.082,2.286);
    frame('darkWood',x,.873,z-1.195,2.39,.998,.172);
    frame('plum',x,.991,z-1.10,2.12,.64,.068);
    frame('brocade',x,1.333,z-1.107,2.13,.025,.078);
    for(const u of [-.892,-.706,-.462,-.230,0,.231,.468,.705,.888])
      stamp('brass',V,x+u,.994,z-1.057,.021,.021,.013);
    // Broad folded cover, seams and paired pillows across a real mattress.
    const cloth=(u,v)=>{
      const a=(u-.5)*2.211,t=v-.5;
      return P(x+a,.676+.028*Math.sin(u*24+v*21)+.012*Math.cos(v*27)
        -Math.max(0,Math.abs(u-.5)-.449)*1.14,z+.89-t*1.75);
    };
    for(let i=0;i<17;i++)for(let j=0;j<17;j++)
      k.quad(j===14?'brocade':'plum',cloth((j+1)/17,i/17),cloth((j+1)/17,(i+1)/17),
        cloth(j/17,(i+1)/17),cloth(j/17,i/17),.36);
    for(const s of [-1,1]){
      stamp('infSheet',V,x+s*.531,.720,z-.777,.419,.111,.231,0,s*-.14);
      const Z=z-.731;
      frame('plum',x+s*.918,.744,Z,.376,.11,.23,s*.31);
    }
    footing(x,z,2.37,2.48);
    for(const [t,w] of [[16.17,.54],[19.44,.53]])cupboard(t,-24.77,w,.56,.706,0,2,'rust');
    lantern(16.17,1.091,-24.77,2);lantern(19.44,1.091,-24.77,1);
    for(const u of [16.17,19.44])bar('brass',u,.706,-24.77,u,.861,-24.77,.018);
    board('heart',17.76,2.036,z0+.081,1.65,1.24);
    board('velvet',15.384,1.777,-23.59,1.52,.646,pi/2);
    board('privateSign',19.76,2.037,z1-.074,1.62,.60,pi);
    curtain(16.40,z0+.129,1.41,2.65,0,.157);
    curtain(19.21,z0+.132,1.41,2.65,0,.157);
    const u=17.27,v=-19.86;
    desk(u,v,2.68,.786,.878,'darkWood');
    paper('consent',u-.667,.92,v-.115,.565,.33,pi-.07);
    frame('plum',u+.594,.931,v-.021,.804,.041,.431);
    frame('brocade',u+.593,.956,v+.190,.793,.014,.026);
    const forms=[
      [[0,0],[.65,0],[.82,.041],[.59,.12],[.49,.48],[.58,.66],[.68,.77],[.65,.85],[.49,.95],[.24,.991],[0,1]],
      [[0,0],[.77,0],[.88,.11],[.69,.21],[.57,.49],[.67,.79],[.52,.92],[.24,.994],[0,1]]
    ];
    for(const [i,form] of forms.entries()){
      const g=new T.LatheGeometry(form.map(([a,b])=>new T.Vector2(a,b)),24);
      stamp(i===0?'pinkRubber':'plum',g,u+.44+i*.273,.992,v+.149,.079,.305,.079,-pi/2,i*.34);g.dispose();
    }
    const bx=15.99,bz=-21.91;
    desk(bx,bz,.82,1.30,.783,'green');
    frame('fileKraft',bx+.03,.862,bz-.286,.477,.097,.412);
    paper('box',bx+.032,.923,bz-.281,.442,.31,pi*.42);
    for(let j=0;j<5;j++){
      const z=bz+.09+j*.065,x=bx+(j%2)*.091;
      frame(j%3?'paper':'plum',x,.824+j*.012,z,.067,.013,.061,.13*(j-2));
      stamp('brass',wheel,x,.832+j*.012,z,.020,.020,.054,flat);
    }
    seat(20.39,-23.04,pi*.38,'plum',true);
    frame('plum',20.64,.099,-23.40,.44,.156,.416,.18);
    bottle(19.39,.749,-24.79,'paper','beerGlass');
  }

  if(id==='southShrine'){
    const x=25.70,z=-30.86;
    rug(x,-28.69,2.06,3.33,'logeCloth');
    frame('fineStone',x,.087,z,2.55,.166,1.16);
    frame('copperDark',x,.213,z,2.49,.106,1.105);
    frame('riteWall',x,.550,z,2.28,.633,.89);
    frame('darkWood',x,.909,z,2.53,.140,1.06);
    frame('brocade',x,.609,z+.460,1.045,.626,.037);
    sign('crest',x,.611,z+.480,.964,.543);
    footing(x,z,2.55,1.15);
    board('eye',x,2.184,z0+.092,1.91,1.56);
    curtain(x-1.61,z0+.128,1.19,2.59,0,.251,'logeCloth');
    curtain(x+1.61,z0+.128,1.19,2.59,0,.251,'logeCloth');
    paper('register',x,1.002,z-.074,.51,.331,.11);
    stamp('copper',vessel,x,.994,z+.221,.127,.134,.127);
    round('gunmetal',x,1.052,z+.221,.088,.026);
    for(const [i,dx] of [-.99,-.74,-.52,.51,.74,.99].entries()){
      const H=.098+(i%3)*.044,Z=z+(i%2===0?-.152:.181);
      round('brass',x+dx,1.003,Z,.063,.033);
      round('wax',x+dx,1.025+H*.5,Z,.024,H);
      round('barGlow',x+dx,1.029+H,Z,.011,.024);
      bar('wax',x+dx+.022,1.013+H*.66,Z,x+dx+.032,1.003,Z+.007,.006);
    }
    for(const s of [-1,1])for(const z of [-28.08,-29.31]){
      const X=x+s*1.60;desk(X,z,.82,.37,.362,'darkWood');
      frame('logeCloth',X,.417,z,.75,.065,.322);
    }
    cupboard(22.22,-31.54,1.06,.49,1.47,0,4,'green');
    board('register',22.45,1.84,z0+.072,1.53,.67);
    board('shrine',29.773,1.98,-27.64,1.57,.67,-pi/2);
    stain(24.54,.008,-30.24,.73,.81,.5,2,flat);
  }
  for(const g of [V,poly,vessel])g.dispose();
}
