import {LAB,LAB_CELLS} from './lab-layout.js';
import {cellDoor} from './lab-cell-doors.js';

const {floor:Y,ceiling:C}=LAB;
const pi=Math.PI,flat=-pi/2;
export const MALT_ROOMS={
  maltLock:{name:'Schleuse · Sudwerk',palette:['concrete','copperDark'],tiles:['concrete','gasket'],tile:.72},
  brewery:{name:'Sudwerk 05',palette:['archiveWall','copperDark'],tiles:['concrete','gray'],tile:.92},
  beerLab:{name:'Nachprüfung · Reihe B/F',palette:['ceramic','green'],tiles:['porcelain','gray'],tile:.63},
  ward:{name:'Verwahrung · Aufnahme',palette:['concrete','gunmetal'],tiles:['concrete','gasket'],tile:.76},
  cells:{name:'Verwahrung · Trakt F',palette:['vaultWall','iron'],tiles:['vaultWall','concrete'],tile:.91}
};

export const MALT_LIGHTS={
  maltLock:[[-22.42,20.66,0xf3c583,16,6.0]],
  brewery:[[-23.5,25.1,0xffd8a0,32,9.8],[-20.2,28.7,0xffbc7f,17,7.2],[-17.91,24.2,0xdddfbb,11,6.5]],
  beerLab:[[-13.42,25.28,0xbce1db,28,8.0],[-11.37,27.42,0xffe6ba,15,6.9]],
  ward:[[-18.55,31.67,0xdca486,17,6.8]],
  cells:[[-21.95,34.84,0xd2d2bc,21,7.6],[-21.67,38.26,0xc5dcce,23,6.4],[-17.35,39.31,0xef8b71,9,5.4]]
};

// Pure scene dressing; fixtures and collider footprints use the same local
// metre grid as LAB_CELLS. Repeated small pieces enter existing material batches.
export function fitMaltWing(T,kit,id,doors){
  const {k,box,hit,pipe,obj,cylinder,luminaire,grille,wheel,dress,props}=kit;
  const {housing:h,rod,plane,plaque,grill,dial,flag,stain}=dress;
  const [x0,x1,z0,z1]=LAB_CELLS[id],owned=[];
  const solid=(m,x,y,z,w,H,d,a=0)=>h(m,x,Y+y,z,w,H,d,a);
  const line=(m,x,y,z,X,H,Z,r)=>rod(m,[x,Y+y,z],[X,Y+H,Z],r);
  function turned(profile,n=28){
    const g=new T.LatheGeometry(profile.map(([r,v])=>new T.Vector2(r,v)),n);owned.push(g);return g;
  }
  function tray(x,y,z,w,d){
    solid('gunmetal',x,y,z,w,.034,d);
    for(const dx of [-1,1])solid('edge',x+dx*(w*.5-.017),y+.026,z,.026,.047,d-.018);
    for(const dz of [-1,1])solid('edge',x,y+.026,z+dz*(d*.5-.016),w-.018,.046,.028);
  }
  function edgePosts(x,y,z,w,H,d,m='iron'){
    for(const a of [-1,1])for(const b of [-1,1])solid(m,x+a*(w*.50-.055),y,z+b*(d*.50-.055),.090,H,.090);
  }
  function bench(x,z,w,d,top=.97,m='green'){
    edgePosts(x,top*.46,z,w,top*.91,d);
    solid('gunmetal',x,top*.69,z,w-.09,.081,d-.078);
    solid('edge',x,top-.042,z,w,.083,d);
    solid(m,x,top+.002,z,w-.062,.021,d-.054);
    hit(x-w*.5,x+w*.5,z-d*.5,z+d*.5);
  }
  function duct(m,points,r){
    for(let i=1;i<points.length;i++){
      const [x,y,z]=points[i-1],[X,H,Z]=points[i];pipe(m,[x,Y+y,z],[X,Y+H,Z],r);
      if(i<points.length-1)cylinder('gunmetal',X,Y+H,Z,r*1.18,r*1.58);
    }
  }
  function paper(x,y,z,title,sub,style='cream',rot=pi){
    solid('leather',x,y,z,.49,.029,.337,rot);
    const dx=.021*Math.cos(rot),dz=-.021*Math.sin(rot);
    props.folio(x+dx,Y+y+.011,z+dz,.442,.301,rot+.065,style==='red'?6:1,{loose:true,thickness:.016});
    plaque(title,sub,x,y+.030,z,.410,.252,rot,style,flat,false);
    const f=plane(x,Y+y+.034,z,rot,flat);
    rod('brass',f(-.15,.12,0),f(-.075,.12,0),.007);
  }
  function mug(x,y,z,angle=0){
    const r=.087;
    cylinder('porcelain',x,Y+y+.071,z,r,.142);
    obj('porcelain',wheel,x,Y+y+.142,z,r*.92,r*.92,.094,pi/2);
    cylinder('gasket',x,Y+y+.143,z,r*.85,.004);
    obj('porcelain',wheel,x+Math.cos(angle)*.097,Y+y+.077,z+Math.sin(angle)*.097,.050,.049,.09,0,-angle);
  }
  function bottle(x,y,z,color='beerGlass'){
    cylinder(color,x,Y+y+.084,z,.034,.168);
    cylinder(color,x,Y+y+.171,z,.024,.047);
    cylinder(color,x,Y+y+.208,z,.014,.040);
    cylinder('porcelain',x,Y+y+.231,z,.019,.018);
    cylinder('paper',x,Y+y+.086,z,.0348,.047);
  }
  function wallStripe(m,axis,start,end,fixed,y,width=.043){
    if(axis==='z')box(m,start,end,Y+y,Y+y+width,fixed,fixed+.012);
    else box(m,fixed,fixed+.012,Y+y,Y+y+width,start,end);
  }
  function cappedPipe(m,x,z,y,Y1,r){
    line(m,x,y,z,x,Y1,z,r);
    for(const yy of [y+.075,Y1-.060])cylinder('iron',x,Y+yy,z,r*1.21,.077);
  }
  function overhead(m,x,z,Z,y=2.96,r=.069){
    line(m,x,y,z,x,y,Z,r);
    for(let t=z+.29;t<Z-.1;t+=1.21){
      line('iron',x,y,t-.043,x,y,t+.043,r*1.35);
      solid('iron',x,y+.17,t,.045,.27,.073);
    }
  }
  if(id==='maltLock'){
    luminaire(-22.43,20.61,'ivory');grille(-22.47,21.44,1.06,1.41);
    overhead('copper',-23.54,z0+.16,z1-.16);overhead('iron',-21.22,z0+.20,z1-.12,2.95,.052);
    for(const z of [20.45,21.58]){
      for(const side of [-1,1])solid('gunmetal',side<0?x0+.065:x1-.065,1.38,z,.15,2.50,.085);
      solid('gunmetal',-22.43,2.91,z,2.82,.184,.10);
    }
    for(let i=0;i<6;i++){
      const x=-23.30+i*.324;
      box(i%2?'gasket':'ochre',x,x+.292,Y+.003,Y+.007,20.04,20.16);
    }
    plaque('SUDWERK 05',['MALZ / LABOR / NACHTSCHICHT','Karte B–09 an der Aufnahme abgeben.'],-23.86,1.71,20.93,1.19,.57,pi/2,'blue');
    solid('green',-21.041,1.35,21.0,.149,.68,.50);
    dial(-21.126,1.49,21.04,.102,-pi/2,1);
    grill('gray',-21.126,1.19,21.0,.347,.135,-pi/2);
    stain(-23.894,1.94,21.74,.54,1.72,pi/2,0);
  }else if(id==='brewery'){
    luminaire(-23.5,25.1,'ivory');luminaire(-20.2,28.7,'ivory');luminaire(-17.91,24.2,'cold');
    // Copper silhouettes read across the room. The domed lids and cone,
    // rolled rims and sight tube are actual geometry, not graphic circles.
    const pot=turned([[0,0],[.62,0],[.79,.09],[.91,.245],[.954,.43],[.961,.59],[.948,1.32],[.922,1.56],[.88,1.65],
      [.85,1.76],[.76,1.90],[.58,2.04],[.34,2.15],[.186,2.205],[.152,2.30],[0,2.30]],36);
    for(const [i,x] of [-24.39,-21.72].entries()){
      const z=i?27.39:27.68,s=i?.90:1;
      cylinder('iron',x,Y+.116,z,.946*s,.227);
      obj('copper',pot,x,Y+.29,z,s,1,s);
      for(const [rad,y,key] of [[.81,.47,'copperDark'],[.953,.91,'copperDark'],[.947,1.58,'copperDark'],[.892,1.985,'brass']]){
        const r=rad*s;
        obj(key,wheel,x,Y+y,z,r,r,.34,pi/2);
        if(y===1.985)for(let j=0;j<14;j++){
          const a=(j+.5)*2*pi/14;
          line('copperDark',x+Math.cos(a)*r,y+.013,z+Math.sin(a)*r,x+Math.cos(a)*r,y+.055,z+Math.sin(a)*r,.020);
        }
      }
      cappedPipe('copperDark',x,z,2.565,2.973,.123);
      duct('copperDark',[[x,2.966,z],[x,2.966,(z+29.26)/2],[x,2.966,29.26],[x,2.80,29.53],[x,2.74,29.64]],.094);
      const f=plane(x,Y,z-.958*s,pi);
      k.box('copperDark',f,-.23,.23,1.065,1.388,-.11,.018);
      plaque(i?'K–02 · NACHLAUF':'K–01 · HAUPTSUD',[i?'AUSSER DIENST':'B / MARKENRAUCH'],x,1.243,z-.993*s-.011,.355,.206,pi,i?'red':'blue');
      dial(x+.285,1.51,z-.965*s,.096,pi,i);
      const t=x+.52;
      line('gunmetal',t,.62,z-.842*s,t,1.35,z-.842*s,.049);
      line('gasket',t,.76,z-.876*s,t,1.28,z-.876*s,.030);
      line(i?'ochre':'ivory',t,.779,z-.891*s,t,i?1.07:.932,z-.891*s,.015);
      for(const yy of [.72,1.31])line('brass',t,yy,z-.69*s,t,yy,z-.91*s,.040);
      line('brass',x,.62,z-.79*s,x,.62,z-1.11*s,.043);
      obj('brass',wheel,x,Y+.62,z-1.13*s,.145,.145,.26,0);
      line('iron',x-.10,.53,z-1.135*s,x+.10,.71,z-1.135*s,.016);
      stain(x,.006,z-1.20,.78,.96,0,i?2:1,flat);
      hit(x-1.02*s,x+1.03*s,z-1.16*s,z+.98*s);
    }
    line('copperDark',-25.78,2.74,29.64,-20.53,2.74,29.64,.115);
    for(const x of [-25.55,-24.39,-23.10,-21.72,-20.77]){
      line('iron',x-.044,2.74,29.64,x+.044,2.74,29.64,.153);
      line('gunmetal',x,2.79,29.64,x,3.31,29.64,.028);
    }
    duct('iron',[[-25.77,2.74,29.64],[-25.92,2.71,29.64],[-26.206,2.57,29.64]],.118);
    for(const x of [-25.35,-23.34,-21.38,-19.45])solid('gunmetal',x,.055,z1-.61,.17,.07,.18);
    overhead('copperDark',-25.76,23.05,29.87,3.01,.09);
    overhead('green',-16.59,23.70,29.78,2.93,.061);
    grille(-22.37,25.92,3.84,.37);
    for(const x of [-24.11,-22.79,-21.46])stain(x,.007,25.8,.93,.33,pi/2,2,flat);
    for(const [i,x] of [-24.93,-23.47,-22.01].entries()){
      const z=29.50;
      const kegProfile=turned([[0,0],[.27,0],[.31,.085],[.35,.27],[.32,.52],[.28,.57],[0,.57]],20);
      obj(i%2?'copperDark':'gunmetal',kegProfile,x,Y+.448,z,1,1,1,pi/2);
      for(const zz of [z+.10,z+.46])obj('gray',wheel,x,Y+.448,zz,.305,.304,.28);
      solid('wood',x-.214,.084,z+.26,.119,.16,.62);solid('wood',x+.214,.084,z+.26,.119,.16,.62);
      solid('leather',x,.448,z-.019,.19,.09,.037);
      hit(x-.37,x+.37,z-.06,z+.58);
    }
    for(const [x,sign] of [[-25.59,0],[-24.71,1]]){
      const z=23.52;
      solid(sign?'darkWood':'wood',x,.28,z,.80,.544,.65);
      for(const dz of [-.33,.33])for(const y of [.13,.32,.50])solid('iron',x,y,z+dz,.82,.020,.028);
      for(const dx of [-.37,.37])solid('edge',x+dx,.305,z-.339,.045,.507,.020);
      plaque('MALZ',['NACHTSCHICHT'],x,.352,z+.339,.34,.15,0,'cream',0,false);
      hit(x-.419,x+.419,z-.35,z+.35);
    }
    bench(-25.51,25.04,.99,1.62,.946,'darkWood');tray(-25.53,.984,24.77,.57,.44);
    for(const [x,z] of [[-25.55,24.77],[-25.75,24.68],[-25.33,24.61]])bottle(x,1.007,z);
    paper(-25.50,.989,25.40,'SCHICHTBUCH',['Kein Fass ging nach oben.'],'red',pi/2);
    flag('brewLedger',-26.184,2.108,24.84,2.08,1.10,pi/2);
    plaque('06 · NACHPRÜFUNG',['VERGLEICHSREIHE B / F'],-16.449,2.74,25.465,1.61,.32,-pi/2,'blue');
    plaque('07 · AUFNAHME',['ZUTRITT NUR FÜR DIE NACHTWACHE'],-18.343,2.75,29.944,1.69,.35,pi,'red');
    stain(-26.205,1.82,26.18,.57,2.27,pi/2,0);
    stain(-26.21,1.46,29.4,.74,1.94,pi/2,1);
    wallStripe('ochre','z',-19.64,-17.1,29.69,.048,.038);
  }else if(id==='beerLab'){
    luminaire(-13.42,25.28,'cold');luminaire(-11.37,27.42,'ivory');
    const xx=-12.13,zz=25.72;
    // Two clearly different work areas: white sampling island and a
    // built-in technical wall with a CRT, sink and bottle rack.
    bench(xx,zz,1.70,.96,.96,'porcelain');
    const fasciaZ=zz-.478;
    for(const dx of [-.53,0,.53]){
      solid(dx===0?'iron':'green',xx+dx,.705,fasciaZ,.486,.274,.085);
      line('edge',xx+dx-.070,.761,fasciaZ-.055,xx+dx+.070,.761,fasciaZ-.055,.016);
    }
    tray(xx-.36,1.002,zz,.54,.43);
    for(const [i,x] of [xx-.51,xx-.21].entries()){
      mug(x,1.024,zz-.016,i?pi:.16);
      solid(i?'rust':'green',x,1.019,zz+.173,.118,.018,.062);
    }
    paper(xx+.39,.995,zz-.050,'REIHE B / F',['B: „Heimat“','F: „Dasselbe Bier.“'],'cream',pi);
    bench(-12.28,28.03,3.47,.95,1.025,'porcelain');
    solid('gasket',-12.59,1.051,28.05,.645,.026,.475);
    for(const dx of [-.324,.324])solid('edge',-12.59+dx,1.070,28.05,.046,.047,.50);
    for(const dz of [-.240,.240])solid('edge',-12.59,1.070,28.05+dz,.647,.047,.039);
    duct('edge',[[-12.59,1.035,28.30],[-12.59,1.337,28.30],[-12.59,1.404,28.21],[-12.59,1.403,28.08],[-12.59,1.344,28.04]],.026);
    solid('iron',-13.46,1.319,28.20,.82,.54,.49);
    plaque('AUSWERTUNG B/F',['ERGEBNIS: KEIN UNTERSCHIED.','VERMERK: „NICHT VERÖFFENTLICHEN“'],-13.46,1.37,27.946,.722,.301,pi,'crt');
    for(const x of [-13.65,-13.51,-13.38,-13.25])solid('green',x,1.145,27.943,.068,.041,.030);
    for(const [i,z] of [27.95,28.20].entries())for(const x of [-11.71,-11.52,-11.33,-11.14]){
      bottle(x,1.076,z,i?'green':'beerGlass');
    }
    tray(-11.425,1.036,28.073,.88,.51);
    for(const x of [-13.89,-11.0]){
      solid('green',x,.600,28.0,.86,.78,.77);
      grill('edge',x,.536,27.592,.59,.206,pi);
    }
    const shelf=-10.07,zs=26.32;
    solid('gunmetal',shelf,1.56,zs,.52,2.68,1.26);
    solid('gasket',shelf-.263,1.58,zs,.025,2.53,1.10);
    for(const [i,y] of [.37,1.13,1.80,2.46].entries()){
      solid('edge',shelf-.237,y,zs,.107,.062,1.20);
      for(let j=0;j<4;j++)if((i+j)%4!==1)bottle(shelf-.312,y+.045,zs-.45+j*.289,j%2?'beerGlass':'green');
    }
    hit(-10.44,-9.78,25.66,26.98);
    plaque('NACHPRÜFUNG',['BIERVERTRÄGLICHKEIT · KLONREIHE B','Kontrollreihe F: dieselbe Charge 05.'],-13.1,2.11,z0+.039,1.93,.79,0,'blue');
    flag('schematic',-11.14,2.14,z0+.037,1.19,.67,0);
    plaque('F–09',['NAME GELÖSCHT / BECHER NICHT ABGEHOLT'],-11.33,2.15,z1-.037,1.00,.47,pi,'red');
    solid('ceramic',-13.06,1.493,z1-.032,2.95,.37,.064);
    for(const x of [-14.12,-13.56,-13.00,-12.44,-11.88])solid('gasket',x,1.492,z1-.069,.005,.35,.008);
    for(const x of [-12.49,-11.98])line('edge',x,1.314,z1-.069,x,1.314,z1-.405,.025);
    wallStripe('green','z',-15.56,-11.50,z0+.009,1.49,.064);
    overhead('gray',-10.22,23.42,28.46,2.97,.049);
    stain(-12.6,.007,27.49,.88,.43,0,2,flat);
    stain(-10.94,1.67,z1-.013,.54,2.02,pi,0);
  }else if(id==='ward'){
    luminaire(-18.55,31.67,'ivory');
    overhead('iron',-20.11,30.39,32.79,2.96,.059);
    grille(-19.02,31.53,.62,.99);
    const x=-17.046,z=31.45;
    bench(x,z,1.17,.99,.955,'darkWood');
    solid('green',x,1.24,z+.211,.936,.51,.411);
    plaque('NACHTWACHE',['AKTE F–09 · ÜBERSTELLUNG OFFEN','Becher und Marken einziehen.'],x,1.25,z-.003,.841,.38,pi,'crt');
    tray(x-.283,1.00,z-.262,.42,.29);
    for(const [i,q] of [-.37,-.268,-.183].entries())cylinder(i===1?'rust':'brass',x+q,Y+1.037,z-.249,.040,.018);
    paper(x+.278,.986,z-.251,'SCHICHT 03',['Tür C offen lassen.'],'cream');
    const hooks=-20.32,hz=31.96;
    solid('darkWood',hooks,1.52,hz,.078,.48,.49);
    for(const [i,z] of [hz-.155,hz,hz+.155].entries()){
      line('brass',hooks+.029,1.59,z,hooks+.095,1.618,z,.013);
      if(i!==1)obj(i===2?'rust':'brass',wheel,hooks+.097,Y+1.539,z,.046,.059,.072,0,pi/2);
    }
    mug(x-.49,.979,z+.211,pi);
    const s=-19.86,zz=32.42;
    solid('green',s,1.061,zz,.883,2.02,.69);
    for(const [i,z] of [zz-.171,zz+.16].entries()){
      solid('gunmetal',s+.453,1.126,z,.052,1.83,.301);
      grill('gray',s+.481,1.70,z,.211,.148,pi/2);
      line('brass',s+.496,1.03,z+.065,s+.496,1.249,z+.065,.016);
      plaque('SPIND',['WACHE '+(i+1)],s+.484,1.49,z,.188,.087,pi/2,'cream',0,false);
    }
    hit(s-.469,s+.481,zz-.346,zz+.346);
    plaque('TRAKT F',['ZELLEN C / D / E · NICHT IM SUDREGISTER'],-18.36,2.74,32.835,1.58,.34,pi,'red');
    plaque('EFFEKTEN',['KRÜGE · MARKEN · MÄNTEL','Abholung nur gegen Gegenzeichnung.'],-20.344,1.89,31.22,1.03,.53,pi/2,'cream');
    stain(-20.37,1.29,31.79,.52,1.91,pi/2,1);
    for(const x of [-19.42,-19.16,-18.90,-18.64,-18.38,-18.12,-17.86,-17.60,-17.34]){
      box('ochre',x,x+.135,Y+.003,Y+.007,32.69,32.77);
    }
  }else if(id==='cells'){
    luminaire(-21.95,34.84,'ivory');luminaire(-21.67,38.26,'cold');luminaire(-17.35,39.31,'red');
    const front=-21.34,wall=-24.47;
    overhead('iron',-19.22,33.30,39.87,2.96,.068);
    overhead('copperDark',-23.85,33.33,39.86,2.94,.053);
    function grate(a,b){
      const f=(u,v,d)=>[front+d,Y+v,b-u],L=b-a;
      for(const e of [0,L])k.box('gunmetal',f,e-.033,e+.033,.047,2.429,-.045,.045);
      for(const v of [.085,.916,2.378])k.box('gunmetal',f,.006,L-.006,v-.028,v+.028,-.038,.039);
      for(let u=.127;u<L-.079;u+=.165)rod('iron',f(u,.094,0),f(u,2.389,0),.019);
    }
    for(const [i,a,b] of [[0,33.38,35.47],[1,35.63,37.63],[2,37.79,39.81]]){
      const z=(a+b)/2,open=i===0,gap=1.04;
      solid('gunmetal',-22.925,2.667,z,3.085,.437,b-a+.011);
      const partition=i===0?z0:a-.157;
      box('concrete',wall,front+.025,Y,Y+3.35,partition,a);
      hit(wall,front+.025,partition,a);
      grate(a,a+.19);
      grate(a+.19+gap,b);
      hit(front-.05,front+.05,a,a+.19);
      hit(front-.05,front+.05,a+.19+gap,b);
      const letters=['C','D','E'];
      doors.push(cellDoor(T,kit.root,kit.world,kit.materials,front,a+.19,gap,letters[i],open));
      solid('gunmetal',front,2.57,z,.18,.32,.65);
      plaque('ZELLE '+letters[i],[['VERWAHRUNG','VERW. F–08','VERW. F–09'][i]],front+.096,2.58,z,.503,.22,pi/2,i===2?'red':'cream');
      // Empty cell furnishings: open metal frame, bedding and site-specific evidence.
      const px=-23.29,pz=z+.345;
      edgePosts(px,.254,pz,1.70,.44,.60);
      solid('edge',px,.473,pz,1.75,.087,.65);
      for(let s=0;s<8;s++)solid('iron',px-.71+s*.202,.52,pz,.055,.037,.598);
      solid(i===2?'leather':'cloth',px,.567,pz,1.64,.105,.55);
      solid('canvas',px-.58,.644,pz,.38,.105,.458,i===2?.07:0);
      const tx=-24.18,tz=z-.55;
      cylinder('iron',tx,Y+.197,tz,.062,.355);cylinder('porcelain',tx,Y+.35,tz,.191,.086);
      cylinder('gasket',tx,Y+.399,tz,.153,.015);
      line('edge',tx-.045,.351,tz+.13,wall+.027,.43,tz+.13,.026);
      hit(px-.895,px+.895,pz-.327,pz+.327);hit(tx-.19,tx+.19,tz-.19,tz+.19);
      for(let j=0;j<5+i;j++){
        const hh=Y+1.47,zz=z-.29+j*.071;
        k.quad('gasket',[wall-.074,hh-.087,zz],[wall-.074,hh+.071+j%2*.043,zz+.028],
          [wall-.074,hh+.058+j%2*.046,zz+.038],[wall-.074,hh-.105,zz+.014]);
      }
      stain(x0+.012,1.29,z-.41,.65,1.98,pi/2,i===2?1:0);
      if(i===0){
        solid('canvas',px+.39,.638,pz+.04,.57,.05,.453,.21);
        mug(px-.17,.624,pz-.10,pi*.11);
        paper(-23.65,.03,z-.36,'ANTRAG F–08',['Abholung verweigert.'],'cream',pi/2);
      }else if(i===1){
        for(const y of [1.23,1.76])line('iron',wall-.069,y,z-.356,wall+.077,y,z-.356,.021);
        solid('rust',wall-.047,1.462,z-.365,.075,.602,.071);
        plaque('KEIN NACHTRAG',['Eintrag entfernt.'],x0+.033,1.804,z+.35,.55,.245,pi/2,'cream');
      }else{
        solid('rust',px+.22,.628,pz,.42,.033,.466,-.15);
        props.folio(px+.35,Y+.648,pz+.071,.24,.34,pi*.29,6,{thickness:.028});
        for(let q=0;q<3;q++)line('rust',wall-.060,1.58-q*.111,z-.175,wall-.060,1.13-q*.060,z-.094,.010);
      }
    }
    box('concrete',wall,front+.028,Y,Y+3.35,39.81,40.12);
    hit(wall,front+.028,39.81,40.12);
    grille(-21.94,37.1,.58,2.20);
    bench(-17.04,37.32,1.08,1.29,.958,'green');
    tray(-17.06,1.00,37.59,.73,.43);mug(-17.17,1.02,37.55,1.1);
    paper(-17.05,.983,37.12,'KARTE F–09',['RÜCKGABE: KEIN NAME','Status: gesperrt.'],'red',pi/2);
    plaque('VERWAHRUNG F',['Die Liste zählt acht.','Hier waren es neun.'],x1-.038,1.95,37.36,1.57,.70,-pi/2,'blue');
    const px=-18.28,pz=z1-.063;
    solid('iron',px,1.133,pz,1.72,2.36,.106);
    solid('gunmetal',px,1.15,pz-.063,1.44,2.16,.049);
    for(const x of [px-.594,px+.594])solid('edge',x,1.158,pz-.102,.056,2.073,.044);
    plaque('VERSIEGELT',['KEIN EINTRAG IM BESTANDSPLAN'],px,1.62,pz-.102,.87,.38,pi,'red');
    solid('red',px,2.47,pz-.064,.196,.055,.046);
    stain(px,.007,39.56,.98,.68,0,2,flat);
  }
  for(const g of owned)g.dispose();
}
