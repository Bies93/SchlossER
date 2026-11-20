import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {stationery} from './interior-stationery.js';
import {randomSource} from './surface-detail.js';
import {CHAPTER_CELL} from './chapter-layout.js';

export function deepChapterDressing(T,{room,k,box:B,hit,F,id,print}){
  const pi=Math.PI,rnd=randomSource(937+id.length),pad=new RoundedBoxGeometry(1,1,1,2,.113),
    disk=new T.CylinderGeometry(1,1,1,18),orb=new T.SphereGeometry(1,14,9),
    ring=new T.TorusGeometry(1,.078,8,20),p=new T.Vector3(),s=new T.Vector3(),Y=new T.Vector3(0,1,0),
    d=new T.Vector3(),m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
  const b=(t,x,y,z,w,h,l)=>B(t,x-w/2,x+w/2,y,y+h,z-l/2,z+l/2);
  const foot=(x,z,w,l)=>hit(x-w/2,x+w/2,z-l/2,z+l/2);
  const shape=(t,g,x,y,z,w,h,l,rx=0,ry=0,rz=0)=>k.geometry(t,g,m.compose(p.set(x,F+y,z),q.setFromEuler(e.set(rx,ry,rz)),s.set(w,h,l)));
  const bead=(t,x,y,z,w,h=w,l=w)=>shape(t,orb,x,y,z,w,h,l);
  const cy=(t,x,y,z,r,h)=>shape(t,disk,x,y,z,r,h,r);
  const rod=(t,x,y,z,X,H,Z,r)=>{
    p.set(x,F+y,z);d.set(X-x,H-y,Z-z);const n=d.length();
    if(n>.001)k.geometry(t,disk,m.compose(p.addScaledVector(d,.5),q.setFromUnitVectors(Y,d.normalize()),s.set(r,n,r)));
  };
  const props=stationery(T,k,room);
  function sign(key,x,y,z,w,h,ang=0){
    const x0=Math.cos(ang),z0=-Math.sin(ang),tr=(u,Y,v)=>[x+x0*u+Math.sin(ang)*v,F+Y,z+z0*u+Math.cos(ang)*v];
    k.box('walnut',tr,-w/2-.032,w/2+.032,y-h/2-.029,y+h/2+.029,-.091,-.008);
    for(const [a,l] of [[-w*.5-.028,-w*.5+.004],[w*.5-.004,w*.5+.028]])k.box('wood',tr,a,l,y-h*.5-.026,y+h*.5+.027,-.008,.012);
    for(const h0 of [-h*.5,h*.5])k.box('inlayGold',tr,-w*.5-.025,w*.5+.025,y+h0-.012,y+h0+.012,-.012,.013);
    for(const a of [-1,1])for(const H of [-1,1]){
      const [U,V,W]=tr(a*(w/2-.021),y+H*(h/2-.018),.014);bead('inlayGold',U,V-F,W,.011);
    }
    print(key,x,y,z,w,h,ang);
  }
  function lamp(x,z,ang=0,y=1.91){
    const X=x+Math.sin(ang)*.11,Z=z+Math.cos(ang)*.11;
    shape('verdigris',pad,x,y+.083,z,.198,.343,.064,0,ang);
    rod('brass',x,y-.012,z,X,y-.042,Z,.024);
    cy('iron',X,y-.016,Z,.112,.037);cy('filament',X,y+.094,Z,.078,.205);cy('iron',X,y+.201,Z,.113,.040);
    for(let i=0;i<8;i++){
      const a=i*pi/4,U=X+.088*Math.cos(a),V=Z+.088*Math.sin(a);
      rod('verdigris',U,y-.012,V,U,y+.203,V,.0068);
    }
    bead('brass',X,y+.235,Z,.046,.035,.046);
  }
  function chest(x,z,w=.61,l=.52,h=.47,t='darkWood'){
    b(t,x,.025,z,w,h-.052,l);
    b('wood',x,h-.033,z,w+.026,.059,l+.028);
    for(const a of [-1,1]){
      b('iron',x+a*w*.318,.050,z+l/2+.006,.061,h-.031,.026);
      for(const H of [.089,h-.056])bead('brass',x+a*w*.318,H,z+l/2+.022,.010);
    }
    b('verdigris',x,h-.155,z+l/2+.026,.072,.125,.027);
    cy('brass',x,h-.103,z+l/2+.045,.021,.027);
    b('soot',x,h-.106,z+l/2+.066,.009,.024,.003);
    foot(x,z,w+.028,l+.039);
  }
  function table(x,z,w,l,h=.85,t='wood'){
    b('walnut',x,h-.121,z,w-.045,.091,l-.053);
    shape(t,pad,x,h-.027,z,w,.055,l);
    for(const a of [-1,1])for(const f of [-1,1]){
      const X=x+a*(w/2-.079),Z=z+f*(l/2-.079);
      b('darkWood',X,.022,Z,.088,h-.087,.085);
      b('iron',X,.021,Z,.108,.056,.105);
    }
    for(const f of [-1,1])rod('wood',x-w*.42,h-.052,z+l*.504*f,x+w*.42,h-.052,z+l*.504*f,.010);
    foot(x,z,w,l);
  }
  function stool(x,z,style){
    shape('wood',pad,x,.414,z,.338,.076,.341);
    if(style)shape('wine',pad,x,.458,z,.316,.046,.313);
    for(const a of [-1,1])for(const f of [-1,1])
      rod('walnut',x+a*.132,.025,z+f*.133,x+a*.118,.387,z+f*.109,.027);
    foot(x,z,.36,.36);
  }
  const ware=new T.LatheGeometry([[0,0],[.65,0],[.78,.08],[1,.53],[.955,.57],[.911,.535],[.705,.222],[.55,.135],[0,.119]]
    .map(([r,y])=>new T.Vector2(r,y)),19);
  function bowl(x,y,z,r=.119,t='enamel'){
    shape(t,ware,x,y,z,r,r,r);
    shape('pewter',ring,x,y+r*.53,z,r*.966,r*.966,r*.27,pi/2);
  }
  function pot(x,y,z,r=.128){
    cy('iron',x,y+.153,z,r,.285);
    cy('pewter',x,y+.031,z,r*.97,.035);cy('pewter',x,y+.294,z,r*1.02,.037);
    cy('iron',x,y+.326,z,r*.27,.046);
    for(const a of [-1,1])shape('pewter',ring,x+a*r*.98,y+.202,z,r*.37,r*.31,r*.28,0,pi/2);
  }
  function cot(x,z,orient=1,noFoot=false){
    const tip=x+orient*.98,base=x-orient*.96;
    for(const X of [tip,base])for(const v of [-.397,.397]){
      rod('iron',X,.025,z+v,X,X===tip?.899:.642,z+v,.020);
      cy('pewter',X,.097,z+v,.027,.042);
      bead('brass',X,X===tip?.902:.643,z+v,.025);
    }
    for(const X of [tip,base]){
      const H=X===tip?.875:.615;
      rod('verdigris',X,H,z-.39,X,H,z+.39,.019);
      for(let i=0;i<5;i++)rod('iron',X,.38,z-.29+.147*i,X,H-.014,z-.29+.147*i,.009);
    }
    for(const j of [-1,1])rod('iron',base,.33,z+j*.392,tip,.33,z+j*.392,.023);
    shape('damaskGold',pad,x,.406,z,1.86,.176,.778);
    shape('enamel',pad,x+orient*.633,.525,z,.403,.092,.552,0,.077);
    // Sculpted folds and tucked edge. Pillow and wool cover are separate.
    const g=new T.PlaneGeometry(1.22,.827,27,20),v=g.attributes.position;
    for(let i=0;i<v.count;i++){
      const dx=v.getX(i),t=v.getY(i),edge=Math.max(0,(Math.abs(t)-.29)*2.1);
      v.setXYZ(i,dx,.502+.013*Math.sin(dx*15+t*13)+.010*Math.sin(t*32+dx*18)-edge*.21,t);
    }
    g.computeVertexNormals();
    // Plane winding faces downward after repositioning, flip it for a top surface.
    const ix=g.index;for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}g.computeVertexNormals();
    shape(orient>0?'velvetBlue':'velvetRed',g,x-orient*.239,0,z,1,1,1);g.dispose();
    rod('piping',base+.022*orient,.477,z-.32,base+.022*orient,.477,z+.32,.008);
    if(!noFoot)foot(x,z,1.99,.84);
  }
  if(id==='lowerHall'){
    sign('dorm',19.79,1.76,-67.85,1.48,.56,pi/2);
    sign('kitchen',23.24,1.76,-68.30,1.50,.56,-pi/2);
    sign('prison',21.41,2.392,-70.83,1.58,.238);
    for(const z of [-64.05,-69.62])lamp(19.80,z,pi/2);
    for(const z of [-63.70,-69.67])lamp(23.22,z,-pi/2);
    for(const x of [19.91,23.11])rod('verdigris',x,2.061,-70.72,x,2.061,-62.84,.033);
    for(let j=0;j<6;j++){
      const z=-63.29-1.22*j;
      for(const x of [19.91,23.11])rod('iron',x,2.061,z-.027,x,2.061,z+.027,.048);
    }
    b('velvetBlue',21.47,.004,-66.86,1.02,.010,6.53);
    for(const x of [21.014,21.935])b('piping',x,.015,-66.86,.013,.004,6.49);
  }else if(id==='dormitory'){
    for(const [j,z] of [-63.88,-66.71,-69.63].entries()){
      cot(12.23,z,-1);
      if(j!==1)cot(18.29,z,1);
      lamp(11.18,z,pi/2,1.79);
    }
    for(const [x,z] of [[13.98,-63.88],[13.98,-66.71],[16.57,-69.62],[16.57,-63.88]])chest(x,z,.61,.54,.46);
    for(const [x,z] of [[14.65,-70.32],[15.92,-70.32]]){
      table(x,z,.92,.63,.78);
      const y=.781;props.folio(x-.13,F+y,z-.068,.206,.149,-.12,2,{loose:true,thickness:.016});
      bowl(x+.23,y,z+.151,.062);
    }
    for(const [x,z] of [[16.46,-63.04],[14.76,-63.04]]){
      b('walnut',x,.042,z,.79,1.87,.53);foot(x,z,.79,.53);
      for(const j of [-1,1]){
        b('bookC',x+j*.187,.177,z-.276,.357,1.617,.037);
        for(let n=0;n<5;n++)b('soot',x+j*.187,1.545-n*.037,z-.306,.227,.013,.011);
        cy('brass',x+j*.110,.946,z-.317,.020,.041);
        for(const h of [.371,1.60])b('iron',x+j*.322,h,z-.307,.035,.101,.020);
      }
    }
    sign('dorm',15.28,1.85,-70.86,2.06,.743);
    sign('crest',15.29,1.78,-62.69,1.49,.73,pi);
    for(const x of [12.30,17.73]){
      b('walnut',x,1.262,-70.77,1.01,.077,.291);
      for(const s of [-1,1])rod('iron',x+s*.36,1.09,-70.903,x+s*.36,1.239,-70.64,.014);
      for(let j=0;j<4;j++)shape(j%2?'velvetBlue':'velvetRed',pad,x-.267+j*.168,1.390,-70.746,.152,.095,.243,0,.09*j);
    }
    lamp(16.87,-70.86,0,1.94);lamp(18.22,-67.95,pi/2,1.92);
    b('velvetRed',15.69,.008,-66.77,1.15,.012,4.28);
  }else if(id==='kitchen'){
    // Cast-iron range with two ovens, enamel counter and a brick back splash.
    const x=29.27,z=-70.24;
    b('iron',x,.113,z,2.12,.744,.97);foot(x,z,2.19,.99);
    b('pewter',x,.846,z,2.20,.076,1.01);
    for(const a of [-1,1]){
      const X=x+a*.492;
      shape('verdigris',pad,X,.433,z+.50,.81,.463,.076);
      b('soot',X,.281,z+.543,.681,.35,.018);
      rod('brass',X-.251,.535,z+.561,X+.25,.535,z+.561,.018);
      for(const u of [-.324,.324])b('iron',X+u,.319,z+.559,.037,.22,.030);
      for(const u of [-.31,.31])cy('stone2',X+u,.092,z+.275,.065,.13);
    }
    for(let i=0;i<4;i++){
      const X=x-.69+i*.465;
      cy('soot',X,.928,z+.015,.19,.022);
      shape('iron',ring,X,.942,z+.015,.16,.16,.060,pi/2);
    }
    pot(x-.70,.946,z+.013,.125);pot(x+.245,.947,z+.047,.164);
    rod('iron',x+.754,.918,z-.261,x+.754,2.56,z-.261,.107);
    for(const y of [1.02,1.66,2.34])cy('pewter',x+.754,y,z-.261,.116,.044);
    for(let i=0;i<12;i++)for(let j=0;j<5;j++)b((i+j)%4?'enamel':'stone2',x-1.034+i*.187,.968+j*.185,-70.904,.180,.180,.052);
    table(30.92,-67.12,1.04,2.12,.912,'enamel');
    shape('pewter',ware,30.9,.907,-67.39,.40,.26,.48);
    rod('pewter',31.30,.916,-67.50,31.30,1.282,-67.50,.024);
    rod('pewter',31.30,1.280,-67.50,30.96,1.229,-67.47,.021);
    bowl(30.82,.914,-66.47,.125);bowl(30.92,.911,-67.92,.131);
    // Dish rail, old glazed splashback and drip tray at the sink.
    for(let j=0;j<3;j++)for(let n=0;n<8;n++)b((j+n)%5?'enamel':'stone2',31.86,.997+j*.166,-67.75+n*.188,.054,.161,.182);
    b('walnut',31.61,1.665,-67.15,.512,.046,1.57);
    for(const z of [-67.76,-66.58]){
      rod('iron',31.86,1.449,z,31.37,1.661,z,.015);
      b('wood',31.46,1.665,z,.175,.037,.101);
    }
    for(let n=0;n<6;n++){
      const z=-67.71+n*.196;
      bowl(31.51,1.711,z,.089,n%2?'enamel':'pewter');
      if(n%3===0)bowl(31.51,1.754,z,.085,'pewter');
    }
    rod('verdigris',31.777,1.483,-67.75,31.777,1.483,-66.55,.017);
    for(let n=0;n<4;n++){
      const z=-67.68+n*.268;
      rod('pewter',31.757,1.47,z,31.693,1.231+(n%2)*.052,z,.010);
      bead('pewter',31.686,1.201+(n%2)*.052,z,.026,.043,.030);
    }
    const tx=26.77,tz=-66.27;
    table(tx,tz,2.34,.90,.82);
    for(const [x,z] of [[25.90,-67.14],[27.60,-67.14],[26.02,-65.48],[27.49,-65.48]]){
      stool(x,z,z>-66);
      bowl(x,.825,tz+Math.sign(z-tz)*.225,.117);
      rod('pewter',x+.20,.847,tz+Math.sign(z-tz)*.112,x+.22,.847,tz+Math.sign(z-tz)*.328,.009);
    }
    shape('wood',pad,26.81,.837,-66.32,.57,.028,.302);
    for(const [i,X] of [26.62,26.84,27.00].entries()){
      bead('bread',X,.88,-66.34,.120,.067,.093);
      for(let j=0;j<3;j++)rod('crumb',X-.048+j*.042,.932,-66.397,X-.033+j*.042,.935,-66.29,.0043);
    }
    for(const X of [29.23,30.82])for(const y of [.248,.738,1.30,1.808]){
      b('wood',X,y,-62.96,1.44,.054,.439);
      for(let n=0;n<6;n++){
        const U=X-.55+n*.216,V=-62.97+rnd()*.075;
        if(n%3===1)bowl(U,y+.057,V,.101,'pewter');
        else {const r=.055+rnd()*.028,h=.13+rnd()*.12;cy(n%2?'orange':'verdigris',U,y+.055+h*.5,V,r,h);
          cy('pewter',U,y+.054+h,V,r*1.02,.026);b('paper',U,y+.09,V-r*.98,.082,.058,.008);}
      }
    }
    for(const X of [28.47,29.97,30.06,31.58]){
      b('darkWood',X,.035,-62.96,.065,1.93,.491);
      foot(X,-62.96,.09,.53);
    }
    foot(30.02,-62.96,3.10,.48);
    sign('stores',25.89,1.68,-62.647,1.32,.734,pi);
    sign('kitchen',25.88,1.68,-70.86,1.52,.760);
    lamp(25.01,-70.84,0);lamp(27.58,-62.67,pi);lamp(31.78,-68.14,-pi/2);
  }else{
    const [a,A,z0,z1]=CHAPTER_CELL;
    // Three infill sections and one unmistakably closed gate. The collider
    // covers the entire cell, including both side returns.
    hit(a-.12,A+.12,z0-.04,z1+.105);
    b('deepStone',(a+A)*.5,.006,z1,(A-a)+.15,.095,.181);
    b('verdigris',(a+A)*.5,2.38,z1,A-a,.135,.139);
    for(const x of [a,a+1.32,a+3.44,a+5.36,A]){
      b('iron',x,.075,z1,.137,2.36,.157);
      for(const y of [.176,2.276]){
        b('verdigris',x,y-.066,z1,.215,.137,.175);
        for(const t of [-1,1])bead('pewter',x+t*.073,y,z1+.093,.014);
      }
    }
    for(let x=a+.155;x<A-.07;x+=.184){
      const n=Math.round((x-a)/.184);
      if(n===17||n===30)continue;
      b(n%4===0?'displayBlack':'iron',x,.084,z1,.031,2.30,.034);
      if(n%3===0)for(const h of [.68,1.853])bead('pewter',x,h,z1+.054,.010);
    }
    for(const y of [.663,1.830])b('verdigris',(a+A)*.5,y,z1,A-a,.045,.087);
    for(const x of [a+3.53,a+5.26])b('displayBlack',x,.139,z1+.069,.058,2.195,.083);
    for(const y of [.138,2.277])b('displayBlack',a+4.397,y,z1+.070,1.783,.061,.075);
    for(const y of [.442,1.991]){
      b('pewter',a+5.29,y,z1+.126,.067,.181,.062);
      cy('iron',a+5.29,y+.088,z1+.173,.041,.191);
    }
    b('displayBlack',a+3.79,1.058,z1+.117,.38,.187,.097);
    b('brass',a+3.79,1.009,z1+.185,.118,.212,.064);
    shape('iron',ring,a+3.79,1.219,z1+.187,.048,.052,.026);
    b('soot',a+3.789,1.062,z1+.220,.020,.044,.006);
    for(const x of [a,A]){
      b('deepStone',x,.018,(z0+z1)/2,.228,2.52,z1-z0-.134);
      b('verdigris',x,.045,(z0+z1)/2,.274,.099,z1-z0-.15);
    }
    cot(25.88,-79.00,1,true);
    bowl(22.10,.013,-78.89,.141,'pewter');
    b('paper',25.95,.502,-79.11,.30,.006,.224);
    lamp(23.92,-80.18,0,1.85);lamp(29.07,-73.13,-pi/2,1.84);lamp(19.02,-73.16,pi/2,1.79);
    table(27.70,-72.53,1.56,.63,.82,'darkWood');
    props.folio(27.76,F+.824,-72.44,.337,.243,.25,6,{loose:true,thickness:.012});
    bowl(28.21,.821,-72.56,.074);
    chest(19.57,-72.83,.73,.59,.48);
    sign('guard',29.04,1.77,-72.85,1.32,.69,-pi/2);
    sign('prison',21.39,1.376,z1+.188,1.30,.531);
  }
  props.finish('Eiserne Krone · Spuren der Nachtwache');
  for(const g of [pad,disk,orb,ring,ware])g.dispose();
}
