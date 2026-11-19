import {LAB,LAB_CELLS} from './lab-layout.js';
import {wardEvidence} from './lab-ward-evidence.js';

const {floor:Y,ceiling:C}=LAB,pi=Math.PI;
export const INFIRMARY={name:'Behandlungsstation',palette:['labTileWall','green'],tiles:['concrete','labFloorPatch'],tile:.71};
export const INFIRMARY_LIGHTS=[
  [-18.96,41.93,0xd2b69c,11,6.8],[-23.44,45.25,0xa2bfad,15.5,7.4],
  [-16.79,46.30,0xc4d5cb,15,6.9],[-24.02,49.90,0xb95b49,11,5.9],
  [-18.44,51.3,0xe3d8b9,17,6.8]
];

// Fictional scene props. All devices are inert and exist only as silhouettes,
// surface details and disconnected, unpowered set dressing.
export function addInfirmary(T,kit){
  const {k,box,hit,cylinder,luminaire,grille,dress,props}=kit;
  const {housing,rod,plaque,plane,grill,dial,stain,fastener}=dress;
  const evidence=wardEvidence(T,kit);
  const [x0,x1,z0,z1]=LAB_CELLS.infirmary;
  const put=(m,x,y,z,w,h,d,ang=0)=>housing(m,x,Y+y,z,w,h,d,ang);
  const line=(m,x,y,z,X,H,Z,r)=>rod(m,[x,Y+y,z],[X,Y+H,Z],r);
  const point=(x,z,angle=0)=>(u,y,d)=>[
    x+u*Math.cos(angle)+d*Math.sin(angle),Y+y,z-u*Math.sin(angle)+d*Math.cos(angle)
  ];
  const vertical=(x,z,start=.015,end=.133,r=.055)=>{
    line('iron',x,start+r,z,x,end+r,z,r);
    line('gasket',x-r,start+r*.82,z,x+r,start+r*.82,z,r*.81);
  };
  function frameBox(m,p,a,b,l,h,c,d){k.box(m,p,a,b,l,h,c,d)}
  function stand(x,z,w,d,top,m='green'){
    for(const a of [-1,1])for(const b of [-1,1]){
      const X=x+a*(w*.5-.052),Z=z+b*(d*.5-.052);
      vertical(X,Z,.009,.101,.042);
      put('edge',X,top*.52,Z,.045,top*.79,.045);
    }
    put('gunmetal',x,.218,z,w-.04,.064,d-.04);
    put('edge',x,top-.025,z,w,.053,d);
    put(m,x,top+.008,z,w-.051,.032,d-.047);
    hit(x-w*.5,x+w*.5,z-d*.5,z+d*.5);
  }
  function foldLine(A,B,material,phase){
    const [x,z]=A,[X,Z]=B,dx=X-x,dz=Z-z,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
    const N=Math.max(18,Math.ceil(length*25)),top=2.61,bottom=.201;
    const f=(j,height)=>{
      const t=j/N,weight=Math.sin(t*19+phase)*.016;
      const fold=(.059+height*.008)*Math.cos(t*length*41+phase)+.012*Math.sin(t*length*64+height*1.7);
      const y=top-(top-bottom)*height+height*height*(weight+.022*Math.cos(t*length*39));
      return [x+dx*t+nx*fold,Y+y,z+dz*t+nz*fold];
    };
    const levels=[0,.32,.65,.971,1];
    for(let i=0;i<N;i++)for(let h=0;h<levels.length-1;h++){
      const a=f(i,levels[h]),b=f(i+1,levels[h]),c=f(i+1,levels[h+1]),d=f(i,levels[h+1]),s=i/N*length*3.4,t=(i+1)/N*length*3.4;
      const finish=h===3?(material==='infCloth'?'infClothPale':'infCloth'):material;
      k.triangle(finish,a,b,c,[s,h,t,h,t,h+1]);k.triangle(finish,a,c,d,[s,h,t,h+1,s,h+1]);
    }
    for(let t=.075;t<length-.026;t+=.205){
      const u=t/length,xx=x+dx*u,zz=z+dz*u;
      line('edge',xx,2.60,zz,xx,2.717,zz,.012);
    }
    hit(Math.min(x,X)-.025,Math.max(x,X)+.025,Math.min(z,Z)-.025,Math.max(z,Z)+.025);
  }
  function track(x,z1,z2,end,m){
    line('edge',x,2.731,z1,x,2.731,z2,.026);
    for(const z of [z1,z2]){
      line('edge',x,2.731,z,end,2.731,z,.025);
      for(const u of [x,(x+end)*.5])line('gunmetal',u,2.732,z,u,3.33,z,.015);
    }
    foldLine([x,z1+.20],[x,z1+1.17],m,z1);
    foldLine([x,z2-1.23],[x,z2-.09],m,z2);
    foldLine([Math.min(x,end)+.19,z2],[Math.max(x,end)-.13,z2],m,z2+.73);
  }
  function bottle(x,y,z,i){
    cylinder(i%2?'beerGlass':'green',x,Y+y+.070,z,.037,.14);
    cylinder('paper',x,Y+y+.063,z,.038,.046);
    cylinder('iron',x,Y+y+.149,z,.025,.024);
    cylinder('edge',x,Y+y+.164,z,.026,.009);
  }
  function bed(x,z,{angle=0,variant=0}={}){
    const p=point(x,z,angle);
    const block=(m,a,b,l,h,c,d)=>frameBox(m,p,a,b,l,h,c,d);
    const side=[-.369,.369];
    for(const a of side)for(const b of [-.86,.86]){
      const [wx,,wz]=p(a,0,b);vertical(wx,wz,.007,.129,.063);
      rod('edge',p(a,.16,b),p(a,.59,b),.032);
      rod('gunmetal',p(a,.25,b),p(a*.63,.46,b*.55),.024);
    }
    for(const a of side){
      rod('edge',p(a,.56,-1.025),p(a,.56,1.025),.035);
      rod('iron',p(a,.31,-.86),p(a,.31,.86),.028);
    }
    block('iron',-.398,.398,.525,.600,-1.041,1.041);
    block('infPad',-.375,.375,.6,.714,-.983,.982);
    block('infSheet',-.379,.379,.701,.738,-.957,.933);
    const cloth=(i,j)=>{
      const a=(i/12-.5)*.742,t=j/14;
      const crease=Math.sin(a*43+t*2.6)*.007+Math.sin(a*18-t*10)*.004;
      const y=.749+crease+.019*Math.exp(-(((t-.92)*14)**2))-Math.max(0,.105-t)*.7;
      return p(a,y,-.982+t*1.36+Math.sin(a*11)*.018);
    };
    for(let j=0;j<14;j++)for(let i=0;i<12;i++)
      k.quad(j===13?'infClothPale':'infCloth',cloth(i,j),cloth(i,j+1),cloth(i+1,j+1),cloth(i+1,j),.42);
    const pillow=(i,r,h)=>{
      const a=i*pi/12,c=Math.cos(a),s=Math.sin(a),seam=.006*Math.cos(a*6);
      return p(Math.sign(c)*Math.abs(c)**.53*.259*r,h+seam*r,.762+Math.sign(s)*Math.abs(s)**.53*.180*r);
    };
    for(let i=0;i<24;i++){
      const j=i+1,A=pillow(i,1,.780),B=pillow(j,1,.780),a=pillow(i,.63,.844),b=pillow(j,.63,.844);
      k.quad('infSheet',a,b,B,A,.49);
      k.quad('infSheet',A,B,pillow(j,.87,.742),pillow(i,.87,.742),.49);
      k.triangle('infSheet',p(0,.856,.762),b,a,[.5,.5,0,1,1,0]);
    }
    for(const head of [-1,1]){
      for(const a of side)rod('edge',p(a,.55,head*1.037),p(a,head>0?1.04:.861,head*1.047),.027);
      rod('edge',p(-.371,head>0?1.04:.861,head*1.047),p(.371,head>0?1.04:.861,head*1.047),.026);
      block('green',-.282,.282,.674,head>0?.953:.762,head*1.047-.024,head*1.047+.024);
    }
    for(const a of side){
      rod('edge',p(a,.826,-.27),p(a,.826,.47),.022);
      for(const z of [-.266,.072,.47])rod('edge',p(a,.64,z),p(a,.826,z),.018);
    }
    const cols=variant?9:7,rows=variant?8:5;
    evidence.surface(variant?'cloth':'wipe',(u,v)=>{
      const [x,y,z]=cloth(2+u*cols,(variant?11:9)-v*rows);
      return [x,y+.0027,z];
    },cols,rows);
    const corners=[p(-.406,0,-1.06),p(.406,0,-1.06),p(.406,0,1.06),p(-.406,0,1.06)];
    kit.world.polygon(corners.map(([x,,z])=>[x,z]),p=>p.y<-1.72);
  }
  function monitor(x,z,{label='ÜBERWACHUNG',green=true}={}){
    const a=x<-20?-pi/2:pi/2,p=point(x,z,a);
    const detail=(m,u,y,d,w,h,s)=>{const [X,,Z]=p(u,y,d);put(m,X,y,Z,w,h,s,a);};
    stand(x,z,.64,.78,.954,'green');
    detail('iron',0,1.224,.043,.648,.479,.412);
    detail('gunmetal',0,1.22,-.173,.601,.397,.049);
    const [fx,,fz]=p(-.053,0,-.204);
    plaque(label,[green?'KANAL OFFLINE':'KEINE VERBINDUNG','Gerät außer Betrieb.'],fx,1.253,fz,.418,.239,pi+a,'crt');
    for(let j=0;j<4;j++)detail(j===2?'red':'brass',-.222+j*.107,1.056,-.213,.043,.025,.018);
    const [qx,,qz]=p(.232,0,-.208);
    for(const y of [1.268,1.359])dial(qx,y,qz,.041,pi+a,y>1.3?1:2);
    const [gx,,gz]=p(0,0,-.326);grill('iron',gx,.71,gz,.527,.196,pi+a);
    for(const side of [-1,1])rod('gasket',p(side*.22,1.19,.238),p(side*.23,.20,.28),.017);
  }
  function screenChair(x,z,other=false){
    const p=point(x,z,(other?-1:1)*pi*.5),block=(m,a,b,l,h,c,d)=>frameBox(m,p,a,b,l,h,c,d);
    block('iron',-.478,.478,.02,.14,-.66,.54);
    block('gunmetal',-.36,.36,.14,.56,-.43,.37);
    block('infPad',-.327,.327,.55,.651,-.45,.367);
    block(other?'rust':'green',-.346,.346,.59,1.68,-.46,-.347);
    block('infPad',-.29,.29,.707,1.60,-.356,-.274);
    block('infPad',-.19,.19,1.493,1.747,-.345,-.204);
    evidence.surface(other?'cloth':'wipe',(u,v)=>p((u-.5)*.571,.655,-.035-(v-.5)*.655));
    evidence.surface('spray',(u,v)=>p((u-.5)*.506,.75+v*.66,-.27));
    for(const a of [-.326,.326]){
      rod('edge',p(a,.52,.262),p(a,.914,.262),.027);
      rod('gunmetal',p(a,.914,-.27),p(a,.911,.304),.043);
      rod('iron',p(a,.19,-.51),p(a,1.515,-.452),.037);
      const f=(u,y,d)=>p(a+u,y,d);
      fastener(f,0,1.41,-.472,.018,true);
    }
    // Blank, closed housings and a cut service lead suggest a decommissioned
    // apparatus without depicting operating circuitry or active effects.
    block('copperDark',-.312,.312,1.754,1.895,-.507,-.25);
    block('iron',-.225,.225,.09,.16,.404,.665);
    const s=other?1:-1;
    line('gasket',x+s*.41,.15,z+.18,x+s*.69,.045,z+.39,.025);
    line('gasket',x+s*.69,.045,z+.39,x+s*.87,.009,z+.29,.023);
    put('gunmetal',x+s*.89,.027,z+.30,.086,.056,.083,.18);
    hit(x-.67,x+.65,z-.51,z+.50);
  }

  for(const [x,z,key] of [[-19.1,42,'ivory'],[-23.6,45.04,'cold'],[-16.4,46.1,'cold'],[-24.14,49.75,'red'],[-18.38,51.38,'ivory']])
    luminaire(x,z,key);
  for(const [a,b] of [[42.87,46.96],[47.13,51.43]]){
    track(-22.12,a,b,-27.31,'infCloth');
    track(-17.05,a,b,-13.75,'infClothPale');
  }
  for(const x of [-26.87,-14.20]){
    line('green',x,2.97,41.13,x,2.97,53.37,.059);
    for(const z of [41.9,44.1,47.12,50.16,52.5]){
      line('iron',x,2.97,z-.046,x,2.97,z+.044,.085);
      line('edge',x,3.023,z,x,3.327,z,.019);
    }
  }
  grille(-19.24,45.73,.58,2.11);grille(-19.23,49.46,.58,1.63);
  for(const [x,z] of [[-23.4,44.52],[-15.08,45.96],[-24.11,49.04],[-19.23,50.23]])stain(x,.006,z,.87,1.16,0,2,-pi*.5);
  stain(-24.86,.009,49.76,.70,1.0,.23,1,-pi*.5);
  stain(x0+.007,1.46,50.42,.77,2.22,pi/2,1);
  stain(x1-.007,1.58,48.57,.72,2.64,-pi/2,0);
  for(const [x,z,w,h,a] of [[-24.19,49.27,.68,.57,.34],[-15.94,45.45,.57,.66,-.33],[-23.74,44.38,.47,.33,.92]])
    evidence.mark('pool',x,.0048,z,w,h,a,-pi/2);
  evidence.mark('spray',x0+.012,1.15,49.38,1.09,1.04,pi/2);
  evidence.mark('spray',x1-.011,1.11,44.33,.77,.86,-pi/2);
  evidence.mark('wipe',x1-.013,.84,49.77,.77,.66,-pi/2);

  stand(-23.34,41.61,2.16,.79,.962,'green');
  props.folio(-23.73,Y+.99,41.64,.37,.381,.23,1,{thickness:.029});
  props.folio(-23.30,Y+.99,41.78,.23,.30,-.20,7,{loose:true,thickness:.011});
  put('gasket',-22.81,1.048,41.56,.405,.108,.297);
  put('green',-22.81,1.116,41.56,.320,.031,.215);
  plaque('AUFNAHME',['BEHANDLUNGSSTATION · INTERN','Der Nachtzugang bleibt geschlossen.'],-23.53,1.95,z0+.04,1.84,.79,0,'blue');
  plaque('STATION',['ZURÜCK ZUR VERWAHRUNG'],-18.30,2.752,z0+.201,1.45,.306,0,'blue');

  bed(-24.70,44.94);
  monitor(-26.43,45.52,{label:'KONTROLLE'});
  stand(-26.23,43.26,.86,.61,.907,'green');
  for(const [i,x] of [-26.46,-26.27,-26.09].entries())bottle(x,.938,43.30,i);
  plaque('BEHANDLUNG A',['PRITSCHE / BEOBACHTUNG'],-27.612,1.79,44.32,1.05,.48,pi/2,'blue');

  bed(-15.30,44.91,{variant:1});
  monitor(-14.25,46.00,{label:'NOTAUFNAHME',green:false});
  const iv=-14.21,sz=44.07;
  for(const [x,z] of [[iv-.164,sz-.159],[iv+.174,sz-.148],[iv,sz+.213]]){
    line('edge',iv,.13,sz,x,.13,z,.020);vertical(x,z,.006,.080,.033);
  }
  line('edge',iv,.13,sz,iv,1.86,sz,.021);
  line('edge',iv-.14,1.855,sz,iv+.147,1.855,sz,.019);
  put('infClothPale',iv+.106,1.635,sz,.137,.222,.076);
  put('iron',iv+.105,1.482,sz,.036,.089,.045);
  line('gasket',iv+.11,1.455,sz,iv+.17,1.251,sz+.068,.011);
  hit(iv-.19,iv+.20,sz-.19,sz+.24);
  plaque('BEHANDLUNG B',['GERÄTE ABGESCHALTET'],x1-.036,1.96,43.65,1.11,.53,-pi/2,'red');

  screenChair(-24.77,49.41);
  plaque('ANWENDUNGSRAUM',['STILLGELEGT / NICHT BENUTZEN'],x0+.039,1.91,49.42,1.34,.54,pi/2,'red');
  monitor(-26.41,50.31,{label:'STROM GETRENNT',green:false});
  stand(-23.42,50.15,.81,.66,.924,'gunmetal');
  put('copperDark',-23.66,.974,50.19,.286,.044,.36,.19);
  props.folio(-23.66,Y+.997,50.19,.238,.284,pi*.55,6,{loose:true,thickness:.012});
  put('canvas',-23.23,.954,50.08,.267,.021,.263,.13);
  evidence.skull(-23.23,.954,50.08,1.92);

  screenChair(-15.61,49.45,true);
  stand(-14.61,50.46,.62,.63,.930,'green');
  for(let i=0;i<3;i++)bottle(-14.77+i*.147,.958,50.48,i);
  plaque('MATERIAL',['KONTROLLE / RESERVE'],x1-.039,1.82,49.39,1.11,.45,-pi/2);

  // The new staff passage owns the opening between the last cabinet run
  // and the records table. Move the cabinet, not the clear route.
  for(const [i,x] of [-24.23,-22.91,-26.02,-15.51].entries()){
    const z=53.22;
    if(i===1){
      // An open file rack, using the same footprint as the old cupboard.
      put('green',x,1.08,z+.286,1.10,2.067,.11);
      for(const d of [-.51,.51])put('gunmetal',x+d,1.08,z,.074,2.067,.685);
      for(const y of [.211,.716,1.205,1.697,2.08])put('edge',x,y,z,1.06,.057,.657);
      for(const [row,y] of [.25,.75,1.24].entries())for(let j=0;j<6;j++){
        if(row===1&&j===4)continue;
        const h=.25+(j%3)*.032,u=x-.391+j*.149,v=z-.020+(j%2)*.06;
        put(j%3===1?'leather':j%3===2?'rust':'darkWood',u,y+h*.5,v,.105,h,.408);
        put('paper',u,y+.154,v-.207,.065,.074,.009);
        put('gasket',u,y+.148,v-.214,.043,.006,.005);
        put('gasket',u,y+.166,v-.214,.043,.006,.005);
      }
      put('gunmetal',x,1.911,z-.291,1.006,.313,.109);
      plaque('STERBEAKTEN',['ABGESCHLOSSENE FÄLLE'],x,1.911,z-.371,.91,.253,pi,'red');
      hit(x-.561,x+.561,z-.407,z+.354);
      continue;
    }
    put(i%2?'rust':'green',x,1.12,z,1.10,2.157,.682);
    for(const y of [.565,1.13,1.676]){
      put('gunmetal',x,y,z-.352,1.011,.473,.055);
      line('brass',x-.17,y+.046,z-.394,x+.16,y+.046,z-.394,.018);
      grill('edge',x,y-.065,z-.389,.447,.127,pi);
    }
    hit(x-.561,x+.561,z-.407,z+.354);
  }
  stand(-19.74,52.82,2.53,.92,.967,'darkWood');
  props.folio(-20.41,Y+.993,52.74,.31,.38,pi-.21,4,{thickness:.028});
  for(let i=0;i<4;i++)bottle(-19.20+i*.135,.998,52.95,i);
  dress.flag('wardRecords',-19.75,2.10,z1-.039,2.10,1.11,pi);
  plaque('PERSONALWEG',['HERKUNFTSSTELLE · INTERN'],-17.24,2.748,z1-.207,1.61,.329,pi,'blue');
  put('darkWood',-19.75,1.517,z1-.102,2.08,.050,.147);
  for(const [x,angle] of [[-20.26,.11],[-20.16,-.23]])
    put('wardBone',x,1.548,z1-.132,.085,.017,.018,angle);
  for(const [x,z] of [[-18.6,41.02],[-18.25,42.47],[-20.01,51.64]])stain(x,.006,z,.49,.83,0,3,-pi*.5);
  evidence.finish();
}
