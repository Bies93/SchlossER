import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {stationery} from './interior-stationery.js';
import {randomSource} from './surface-detail.js';
import {CHAPTER_CELL} from './chapter-layout.js';
import {gateLeft as gl,gateRight as gr} from './chapter-cell-gate.js';
import {labelGeometry,labels} from './chapter-labels.js';

export function deepChapterDressing(T,{room,k,box:B,hit,platform,F,id,print,rect:bounds}){
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
  const cards=labels.map((_,i)=>labelGeometry(T,i));
  const label=(i,x,y,z,w,h,ang=0,tilt=0)=>shape('inkLabels',cards[i],x,y,z,w,h,1,tilt,ang);
  function sign(key,x,y,z,w,h,ang=0){
    // Wall-mounted frames project 9 cm; the rear cleat bites into the stone.
    if(z!==CHAPTER_CELL[3]+.188){
      const [l,r,m,n]=bounds;
      if(Math.abs(Math.sin(ang))>.5)x=Math.sin(ang)>0?l+.116:r-.116;
      else if(!(id==='lowerHall'&&key==='prison'))z=Math.cos(ang)>0?m+.116:n-.116;
    }
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
    // Seat the backplate on the exposed masonry rather than a nominal room offset.
    const [L,R,M,N]=bounds;
    if(Math.abs(Math.sin(ang))>.5)x=Math.sin(ang)>0?L+.051:R-.051;
    else z=Math.cos(ang)>0?M+.051:N-.051;
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
    platform(x-.18,x+.18,z-.18,z+.18,style?.48:.452);
  }
  const ware=new T.LatheGeometry([[0,0],[.65,0],[.78,.08],[1,.53],[.955,.57],[.911,.535],[.705,.222],[.55,.135],[0,.119]]
    .map(([r,y])=>new T.Vector2(r,y)),19);
  function bowl(x,y,z,r=.119,t='enamel'){
    shape(t,ware,x,y,z,r,r,r);
    shape('pewter',ring,x,y+r*.53,z,r*.966,r*.966,r*.27,pi/2);
  }
  const turned=profile=>new T.LatheGeometry(profile.map(([a,b])=>new T.Vector2(a,b)),20);
  const jar=turned([[.12,0],[.81,0],[.97,.04],[1,.15],[1,.72],[.97,.79],[.76,.86],[.76,.96],[.83,.97],[.83,1],[.70,1]]),
    jug=turned([[.11,0],[.69,0],[.89,.065],[1,.38],[.93,.64],[.55,.76],[.48,.91],[.57,.95],[.59,1],[.48,1],[.44,.90]]),
    crock=turned([[.06,0],[.73,0],[.86,.08],[.98,.58],[.96,.83],[1,.91],[1,1],[.88,1],[.86,.89],[.82,.22],[.12,.15]]);
  function herbs(x,y,z,flip=1){
    for(let i=0;i<5;i++){
      const a=i*2.4,dx=Math.cos(a)*.054,dz=Math.sin(a)*.042,h=(.15+rnd()*.093)*flip;
      rod('piping',x,y,z,x+dx,y+h,z+dz,.0028);
      for(let n=1;n<5;n++)for(const side of [-1,1]){
        const u=n/5;shape(n%2?'leaf':'leafDry',orb,x+dx*u+side*.012,y+h*u,z+dz*u,.012,.026,.004,side*.34,a,side*.77);
      }
    }
  }
  function preserves(x,y,z,i){
    const r=.063+rnd()*.024,h=.157+rnd()*.093;
    shape('preserveGlass',jar,x,y,z,r,h,r);
    const fill=i===2?'wine':i===3?'leaf':'bread';
    cy(fill,x,y+h*.34,z,r*.88,h*.62);
    for(let n=0;n<7;n++){
      const a=n*2.4;
      bead(n%3===0?'leafDry':fill,x+Math.cos(a)*r*.53,y+h*(.55+n%3*.05),z+Math.sin(a)*r*.53,r*.30,r*.22,r*.26);
    }
    cy('pewter',x,y+h*.985,z,r*.88,.021);
    for(const s of [.926,1.015])shape('steel',ring,x,y+h*s,z,r*.85,r*.85,.024,pi/2);
    for(const s of [-1,1])rod('pewter',x+s*r*.88,y+h*.76,z,x+s*r*.86,y+h*.98,z,.0036);
    const tag=cards[i].clone(),v=tag.attributes.position;
    for(let n=0;n<v.count;n++){
      const a=v.getX(n)*1.61;v.setXYZ(n,Math.sin(a)*(r+.0016),v.getY(n)*.064,Math.cos(a)*(r+.0016));
    }
    shape('inkLabels',tag,x,y+h*.45,z,1,1,1,0,pi);tag.dispose();
  }
  function mug(x,y,z,r=.045){
    shape('enamel',crock,x,y,z,r,r*1.76,r);
    shape('blue',ring,x,y+r*1.72,z,r*.98,r*.98,r*.44,pi/2);
    shape('pewter',ring,x+r*1.11,y+r,z,r*.47,r*.62,r*.54);
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
    shape('ticking',pad,x,.398,z,1.86,.160,.756);
    // Stuffed ticking with pinched corners instead of a hard enamel block.
    const pillow=new T.SphereGeometry(1,24,14),pv=pillow.attributes.position;
    for(let j=0;j<pv.count;j++){
      const u=pv.getX(j),v=pv.getY(j),w=pv.getZ(j),sq=n=>Math.sign(n)*Math.pow(Math.abs(n),.59);
      pv.setXYZ(j,sq(u),sq(v)*(1-.13*Math.cos(7*w+3*u)),sq(w));
    }
    pillow.computeVertexNormals();shape('linen',pillow,x+orient*.622,.543,z,.222,.066,.314,0,.04*orient);pillow.dispose();
    for(const side of [-1,1])rod('ticking',x+orient*.60-.14,.546,z+side*.306,x+orient*.60+.14,.546,z+side*.306,.0038);
    // Sculpted folds and tucked edge. Pillow and wool cover are separate.
    const g=new T.PlaneGeometry(1.22,.827,27,20),v=g.attributes.position;
    for(let i=0;i<v.count;i++){
      const dx=v.getX(i),t=v.getY(i),edge=Math.max(0,(Math.abs(t)-.29)*2.1);
      v.setXYZ(i,dx,.529+.011*Math.sin(dx*15+t*13)+.010*Math.sin(t*32+dx*18)-edge*.20,t);
    }
    g.computeVertexNormals();
    // Plane winding faces downward after repositioning, flip it for a top surface.
    const ix=g.index;for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}g.computeVertexNormals();
    shape(orient>0?'blue':'bookB',g,x-orient*.239,0,z,1,1,1);g.dispose();
    for(let j=0;j<3;j++){
      const xx=orient*(-.44+j*.040);
      for(let n=0;n<16;n++){
        const height=t=>.530+.011*Math.sin(xx*15+t*13)+.010*Math.sin(t*32+xx*18)-Math.max(0,(Math.abs(t)-.29)*2.1)*.20;
        const t=-.402+n*.050,T=t+.050;
        rod('linen',x-orient*.239+xx,height(t),z+t,x-orient*.239+xx,height(T),z+T,.0048);
      }
    }
    rod('piping',base+.022*orient,.477,z-.32,base+.022*orient,.477,z+.32,.008);
    if(!noFoot){
      platform(x-.93,x+.93,z-.40,z+.40,.53);
      hit(tip-.031,tip+.031,z-.42,z+.42);
    }
  }
  if(id==='lowerHall'){
    sign('dorm',19.79,1.76,-67.85,1.48,.56,pi/2);
    sign('kitchen',23.24,1.76,-68.30,1.50,.56,-pi/2);
    sign('prison',21.41,2.392,-70.83,1.58,.238);
    for(const z of [-64.05,-69.62])lamp(19.80,z,pi/2);
    for(const z of [-63.70,-69.67])lamp(23.22,z,-pi/2);
    for(const x of [19.91,23.11])rod('verdigris',x,2.281,-70.72,x,2.281,-62.84,.033);
    for(let j=0;j<6;j++){
      const z=-63.29-1.22*j;
      for(const x of [19.91,23.11]){
        rod('iron',x,2.281,z-.027,x,2.281,z+.027,.048);
        const wall=x<21?19.715:23.316;
        rod('iron',wall,2.281,z,x,2.281,z,.014);b('verdigris',wall,2.23,z,.029,.099,.075);
      }
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
        b('walnut',x+j*.187,.278,z-.301,.269,1.08,.021);
        b('wood',x+j*.187,.306,z-.311,.225,1.026,.010);
        label(8,x+j*.187,1.436,z-.306,.131,.071,pi);
        for(let n=0;n<5;n++)b('soot',x+j*.187,1.545-n*.037,z-.306,.227,.013,.011);
        for(const h of [.89,1.00])rod('brass',x+j*.071,h,z-.305,x+j*.071,h,z-.353,.010);
        rod('brass',x+j*.071,.89,z-.353,x+j*.071,1,z-.353,.012);
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
    lamp(16.87,-70.86,0,1.94);lamp(19.63,-68.35,-pi/2,1.92);
    for(const [j,[x,z]] of [[13.98,-63.88],[13.98,-66.71],[16.57,-69.62],[16.57,-63.88]].entries()){
      for(const a of [-1,1]){
        b('leatherTrim',x+a*.192,.485,z,.052,.009,.54);
        for(const v of [-.22,.22])bead('brass',x+a*.192,.498,z+v,.009,.004,.009);
      }
      if(j%2===0){mug(x-.12,.488,z);props.folio(x+.092,F+.491,z,.17,.117,.13,4,{thickness:.013});}
      else {shape('linen',pad,x,.517,z,.26,.056,.19,0,-.15);shape('ticking',pad,x,.558,z,.24,.034,.18,0,-.14);}
      label(8,x,.30,z+.283,.143,.073);
    }
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
      bead('pewter',x+.22,.846,tz+Math.sign(z-tz)*.32,.021,.006,.033);
    }
    shape('wood',pad,26.81,.837,-66.32,.57,.028,.302);
    for(const [i,X] of [26.62,26.84,27.00].entries()){
      bead('bread',X,.88,-66.34,.120,.067,.093);
      for(let j=0;j<3;j++)rod('crumb',X-.048+j*.042,.932,-66.397,X-.033+j*.042,.935,-66.29,.0043);
    }
    for(const [bay,X] of [29.23,30.82].entries())for(const [row,y] of [.248,.738,1.30,1.808].entries()){
      const Z=-62.96,H=y+.055;
      for(const dz of [-.116,.106])b('wood',X,y,Z+dz,1.44,.054,.218);
      for(const s of [-1,1]){
        b('walnut',X+s*.654,y-.039,Z,.097,.051,.397);
        bead('iron',X+s*.66,y+.025,Z-.229,.014,.015,.006);
      }
      for(let n=0;n<5;n++){
        const U=X-.535+n*.267+(rnd()-.5)*.033,V=Z+(rnd()-.5)*.09,v=(row*3+bay*4+n)%9;
        if(v===0||v===6){for(let j=0;j<2+(row%2);j++)bowl(U,H+.018*j,V,.103,j%2?'pewter':'enamel');}
        else if(v===1){shape('orange',jug,U,H,V,.083,.241,.083);shape('brass',ring,U+.075,H+.157,V,.042,.060,.032);}
        else if(v===5){shape('enamel',crock,U,H,V,.087,.119,.087);herbs(U,H+.09,V);}
        else if(v===7)mug(U,H,V,.061);
        else preserves(U,H,V,(row+bay+n)%6);
      }
    }
    // A drying rail fixed into the rear wall, sprigs tied with linen twine.
    for(const X of [26.94,28.15])rod('iron',X,1.81,-62.55,X,1.81,-62.78,.016);
    rod('wood',26.91,1.81,-62.78,28.18,1.81,-62.78,.023);
    for(let n=0;n<5;n++){const X=27.02+n*.235;rod('linen',X,1.82,-62.78,X,1.67,-62.78,.0045);herbs(X,1.67,-62.78,-1);}
    mug(tx-.36,.822,tz+.08);mug(tx+.47,.822,tz-.10);
    for(const X of [28.47,29.97,30.06,31.58]){
      b('darkWood',X,.035,-62.96,.065,1.93,.491);
      foot(X,-62.96,.09,.53);
    }
    foot(30.02,-62.96,3.10,.48);
    sign('stores',25.89,1.68,-62.647,1.32,.734,pi);
    sign('kitchen',25.88,1.68,-70.86,1.52,.760);
    lamp(24.49,-70.84,0);lamp(26.72,-62.67,pi,2.04);lamp(31.78,-68.48,-pi/2);
  }else{
    const [a,A,z0,z1]=CHAPTER_CELL;
    // Fixed ironwork stops at both jambs; only the rolling leaf spans the opening.
    for(const [l,r] of [[a-.08,gl],[gr,A+.08]]){
      hit(l,r,z1-.082,z1+.089);
      b('deepStone',(l+r)/2,.006,z1,r-l,.095,.181);
      for(const y of [.663,1.830])b('verdigris',(l+r)/2,y,z1,r-l,.045,.087);
    }
    for(const x of [a,A])hit(x-.115,x+.115,z0,z1);
    hit(a,A,z0-.052,z0+.052);
    b('mortar',(a+A)*.5,0,z0-.019,A-a,3.03,.080);
    for(let j=0;j<10;j++)for(let n=-1;n<12;n++){
      const x=Math.max(a,a+.78*n+(j%2)*.39),end=Math.min(A,a+.78*(n+1)+(j%2)*.39);
      if(end-x>.02)b((n+j)%4?'deepStone':'deepRock',(x+end)/2,j*.302+.003,z0+.026,end-x-.009,.293,.047);
    }
    // Recessed threshold, overhead runner and its stone-mounted hangers.
    b('pewter',(gl+gr)/2,.001,z1+.19,gr-gl,.009,.123);
    b('iron',gr,2.318,z1+.19,2*(gr-gl)+.24,.039,.106);
    for(const X of [gl+.12,gr,gr+(gr-gl)-.12])b('verdigris',X,2.337,z1+.09,.069,.069,.299);
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
      if(x>gl-.025&&x<gr+.025)continue;
      b(n%4===0?'displayBlack':'iron',x,.084,z1,.031,2.30,.034);
      if(n%3===0)for(const h of [.68,1.853])bead('pewter',x,h,z1+.054,.010);
    }
    for(const x of [a,A]){
      b('deepStone',x,.018,(z0+z1)/2,.228,2.52,z1-z0-.134);
      b('verdigris',x,.045,(z0+z1)/2,.274,.099,z1-z0-.15);
    }
    cot(25.88,-79.00,1);
    bowl(22.10,.013,-78.89,.141,'pewter');
    // Personal letter on a solid footlocker (never embedded in the warped quilt).
    chest(27.20,-79.18,.53,.54,.405);
    props.folio(27.20,F+.433,-79.18,.19,.12,.15,2,{loose:true,thickness:.010});
    // Remnants of an occupied cell: scratched calendar, mess ware and an
    // unanswered envelope. All fastenings meet the actual iron backing.
    b('wood',22.53,1.03,z0+.068,1.02,.61,.057);
    for(let j=0;j<21;j++){
      const x=22.11+Math.floor(j/5)*.176+(j%5)*.027;
      rod('crumb',x,1.22,z0+.100,x+(j%5===4?-.105:.013),1.37,z0+.101,.004);
    }
    b('walnut',21.88,.85,z0+.195,1.05,.066,.29);
    for(const x of [21.53,22.22])rod('iron',x,.64,z0+.06,x,.853,z0+.28,.016);
    mug(21.58,.917,z0+.21);bowl(22.10,.917,z0+.20,.108);
    props.folio(21.84,F+.921,z0+.21,.147,.102,.05,1,{loose:true,thickness:.01});
    lamp(29.07,-77.18,-pi/2,1.84);lamp(19.02,-73.16,pi/2,1.79);
    table(27.70,-72.53,1.56,.63,.82,'darkWood');
    props.folio(27.76,F+.824,-72.44,.337,.243,.25,6,{loose:true,thickness:.012});
    bowl(28.21,.821,-72.56,.074);
    mug(27.17,.822,-72.52);label(7,27.46,.824,-72.56,.18,.11,0,-pi/2);
    const bx=23.12;
    b('verdigris',bx,1.25,z1+.069,.63,.32,.08);
    label(6,bx,1.41,z1+.111,.594,.284);
    for(const h of [1.28,1.54])for(const s of [-1,1])bead('brass',bx+s*.299,h,z1+.116,.009);
    chest(19.57,-72.83,.73,.59,.48);
    sign('guard',29.04,1.77,-72.85,1.32,.69,-pi/2);
    sign('prison',21.39,1.376,z1+.188,1.30,.531);
  }
  props.finish('Eiserne Krone · Spuren der Nachtwache');
  for(const g of [pad,disk,orb,ring,ware,jar,jug,crock,...cards])g.dispose();
}
