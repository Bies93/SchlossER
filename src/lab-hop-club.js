import {architectureKit} from './architecture-kit.js';
import {LAB,CLUB_STAIR as S,CLUB_FLOOR as F,CLUB_CEILING as C,clubStairY,clubStep,labLower} from './lab-layout.js';
import {randomSource} from './surface-detail.js';
import {hopFinishes,nightMarquee} from './hopfenamt-finishes.js';
import {schankCraft} from './hopfenamt-schank.js';
import {danceLights,mirrorSilver} from './hopfenamt-licht.js';
import {clubGuests} from './club-guests.js';

const pi=Math.PI, coord=(x,y,z)=>[x,y,z],drop=F-LAB.floor,rand=randomSource;
// Only the nearest four emitters occupy real light slots, shared with the rest of the cellar.
export const CLUB_LIGHTS={
  clubStair:[26.0,29.4].map(x=>[x,-4.48,0xe8ab72,11,5,clubStairY(x)-LAB.floor+2.0]),
  hopClub:[[11.7,-8.1,0xffca83,33,8,drop+2.7],[15.1,-13.8,0x67baf6,31,10,drop+3.1],
    [18.7,-14.9,0xef82ad,43,11,drop+2.92],[22.2,-9.25,0xffbb78,25,8,drop+2.5],
    [17.6,-5.4,0xe8be80,21,7,drop+2.8],[11.1,-13.2,0xffc686,24,7,drop+2.7]]
};

export function hopStair(T,root,world,materials){
  const kit=architectureKit(T,root,materials),g=new T.CylinderGeometry(1,1,1,12);
  const box=(m,a,b,y,Y,c,d)=>kit.box(m,coord,a,b,y,Y,c,d);
  function rod(m,a,b,r){
    const A=new T.Vector3(...a),B=new T.Vector3(...b),D=B.clone().sub(A);
    kit.geometry(m,g,new T.Matrix4().compose(A.lerp(B,.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),D.clone().normalize()),new T.Vector3(r,D.length(),r)));
  }
  const plane=x=>LAB.floor-(S.top-x)/clubStep*S.rise;
  for(let i=0;i<S.count;i++){
    const X=S.top-i*clubStep,x=X-clubStep,h=LAB.floor-(i+1)*S.rise;
    box('fineStone',x,X,h-.23,h,S.z0,S.z1);
    box('brass',x+.008,x+.035,h,h+.004,S.z0+.064,S.z1-.064);
    for(const [j,z] of [S.z0,S.z1].entries()){
      const side=j?-1:1;
      const corners=[[x,plane(x)-.23],[X,plane(X)-.23],[X,plane(X)+2.90],[x,plane(x)+2.90]].map(([a,b])=>[a,b,z]);
      kit.quad('riteWall',...(j?corners.reverse():corners),1.42);
      if(i%4===1){
        const a=x+clubStep*.5,H=plane(a),V=z+side*.095;
        rod('gunmetal',[a,H+.86,z],[a,H+.86,V],.024);
        if(j){box('copperDark',a-.11,a+.11,H+.36,H+.48,z-.037,z);box('barGlow',a-.083,a+.083,H+.385,H+.45,z-.045,z-.038);}
      }
    }
  }
  // Underside of the inclined ceiling, continuously lined, not a row of obstructing lintels.
  kit.quad('concrete',[S.foot,plane(S.foot)+2.9,S.z0],[S.top,plane(S.top)+2.9,S.z0],
    [S.top,plane(S.top)+2.9,S.z1],[S.foot,plane(S.foot)+2.9,S.z1],1.32);
  for(const [z,side] of [[S.z0,1],[S.z1,-1]]){
    rod('brass',[S.foot,plane(S.foot)+.86,z+side*.095],[S.top,LAB.floor+.86,z+side*.095],.032);
    world.box(S.foot,Math.min(z,z-side*.10),S.top,Math.max(z,z-side*.10),p=>labLower(p.y)&&Math.abs(p.y-clubStairY(p.x))<1.25);
  }
  // Both landings already own the lintels above this inclined lining.
  kit.flush('II. UG · Gegentreppe');g.dispose();
}

// Original screenprints, each with a different silhouette: hop cone, glass, eye, record.
function prints(T,root){
  const c=document.createElement('canvas');c.width=1024;c.height=512;
  const a=c.getContext('2d'),rng=rand(8402);
  const editions=[['HOPFENAMT','NACHTBETRIEB · SEIT SCHICHT NULL','#17454b','#e1b269'],
    ['TRINK NACH VORSCHRIFT','OBERBAYERISCHES KONTROLLGETRÄNK','#712f38','#ebc488'],
    ['DIE LOGE SIEHT MIT','NUR DIE GARDEROBE IST UNBEWACHT','#283959','#e4c77d'],
    ['SCHLOSSKELLER 2099','FRÄNKISCHER ENDZEIT-RAVE · 32 TAKTE','#44314b','#e2ad83']];
  editions.forEach(([title,sub,paper,ink],i)=>{
    a.save();a.translate(i%2*512,(i>>1)*256);a.fillStyle=paper;a.fillRect(0,0,512,256);
    a.strokeStyle=ink;a.fillStyle=ink;a.lineWidth=2;a.strokeRect(10,9,492,238);
    a.beginPath();for(let j=0;j<37;j++){const ang=j*pi*2/37;a.moveTo(256+Math.cos(ang)*60,91+Math.sin(ang)*53);a.lineTo(256+Math.cos(ang)*111,91+Math.sin(ang)*69);}a.stroke();
    a.lineWidth=4;
    if(i===0){for(let row=0;row<4;row++)for(let j=0;j<=3-row;j++){const x=228+row*9+j*18,y=65+row*18;a.beginPath();a.moveTo(x-10,y);a.quadraticCurveTo(x,y+35,x+12,y-4);a.quadraticCurveTo(x,y-8,x-10,y);a.fill();}a.fillRect(252,43,5,13);}
    if(i===1){a.strokeRect(222,59,58,70);a.strokeRect(280,67,20,38);for(let j=0;j<5;j++){a.beginPath();a.arc(226+j*12,58,9,0,2*pi);a.fill();}for(let j=0;j<3;j++)a.fillRect(233+j*14,80,4,37);}
    if(i===2){a.beginPath();a.moveTo(256,37);a.lineTo(318,137);a.lineTo(195,137);a.closePath();a.stroke();a.beginPath();a.ellipse(256,103,31,13,0,0,2*pi);a.stroke();a.beginPath();a.arc(256,103,9,0,2*pi);a.fill();}
    if(i===3){for(let j=0;j<9;j++){a.beginPath();a.arc(256,92,10+j*5.4,0,2*pi);a.stroke();}a.fillRect(298,43,5,48);a.fillRect(284,86,18,6);}
    a.textAlign='center';a.font='bold 38px Georgia';a.fillText(title,256,192,458);
    a.font='bold 16px monospace';a.fillText(sub,256,224,455);
    for(let n=0;n<1600;n++){a.fillStyle=n%2?'#fff0be20':'#10122537';a.fillRect(rng()*501+5,rng()*246+5,rng()*3+.5,.8);}
    a.restore();
  });
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  const mat=new T.MeshStandardMaterial({map:tex,roughness:.85});
  return (i,x,y,z,w,h,angle)=>{
    const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;
    for(let j=0;j<4;j++)uv.setXY(j,(i%2+.005+.99*uv.getX(j))*.5,(1-(i>>1)+.005+.99*uv.getY(j))*.5);
    const mesh=new T.Mesh(g,mat);mesh.position.set(x,F+y,z);mesh.rotation.y=angle;root.add(mesh);
  };
}

export function hopClub(T,kit){
  hopFinishes(T,kit.materials);
  const {root,hit,obj,cylinder,pipe,dress}=kit,{housing,flag}=dress,print=prints(T,root),rng=rand(4921);
  const bx=(m,x,y,z,w,h,d,angle=0)=>housing(m,x,F+y,z,w,h,d,angle);
  const cyl=(m,x,y,z,r,h)=>cylinder(m,x,F+y,z,r,h);
  const bar=(m,x,y,z,X,Y,Z,r)=>pipe(m,[x,F+y,z],[X,F+Y,Z],r);
  const sphere=new T.SphereGeometry(1,14,10),ring=new T.TorusGeometry(1,.060,6,30);
  const ball=(m,x,y,z,a,b,c)=>obj(m,sphere,x,F+y,z,a,b,c);
  const tor=(m,x,y,z,r,angle=0,rx=0)=>obj(m,ring,x,F+y,z,r,r,r,rx,angle);
  const solid=(x,z,w,d)=>hit(x-w/2,x+w/2,z-d/2,z+d/2);
  const craft=schankCraft(T,kit,{bx,cyl,bar,tor});
  function poster(i,x,y,z,w,h,a=0){
    bx('darkWood',x,y,z,w+.13,h+.13,.082,a);
    print(i,x+Math.sin(a)*.046,y,z+Math.cos(a)*.046,w,h,a);
  }
  // Panelled beer hall, with visible joists and brass straps instead of a second wall shell.
  for(let z=-16.7;z<-3.7;z+=2.75){
    bx('darkWood',16.56,3.84,z,15.78,.23,.20);
    for(const x of [8.79,24.32]){
      if(x>24&&z>-5.9)continue;
      bx('wood',x,1.94,z,.18,3.86,.24);
      bar('darkWood',x,3.05,z,x+(x<15?.85:-.85),3.80,z,.11);
      bx('brass',x,1.02,z,.196,.060,.26);
    }
  }
  for(const [x,z,w,d] of [[16.55,-17.84,15.72,.10],[16.55,-3.42,15.72,.10],[8.71,-10.63,.10,14.38],[24.42,-11.66,.10,12.41]]){
    bx('wood',x,.56,z,w,1.09,d);bx('brass',x,1.12,z,w+.012,.039,d+.012);
  }
  // The three tracks are at floor level: decorative glass, not physical obstacles.
  bx('darkWood',16.61,.012,-11.0,6.60,.024,6.04);
  for(let i=0;i<8;i++)for(let j=0;j<7;j++){
    const m=(i===0||j===6||i===7||j===0)?((i+j)%4?'slateBlue':'frost'):['glassDark','slateBlue','copperDark','plum'][(i+2*j+Math.floor(i/2))%4];
    bx(m,13.80+i*.80,.031,-13.49+j*.83,.778,.015,.806);
  }
  // Schank: panelled front, rail, ceramic fonts, drip tray and shelves of bottles.
  bx('darkWood',11.50,.54,-9.55,1.02,1.06,6.18);solid(11.5,-9.55,1.04,6.18);
  bx('darkWood',11.50,1.075,-9.55,1.15,.083,6.34);
  for(let j=0;j<4;j++)kit.box('hopOak',10.926+j*.287,11.212+j*.287,F+1.116,F+1.166,-12.72,-6.38);
  bar('brass',12.080,1.126,-12.68,12.080,1.126,-6.41,.012);
  bx('barGlow',12.04,.986,-9.55,.017,.016,6.08);
  for(let j=0;j<7;j++){
    const z=-12.17+j*.87;bx('wood',12.02,.57,z,.052,.79,.78);
    bx('leather',12.054,.57,z,.024,.62,.60);
    // A raised lozenge, beaded moulding and small rosette catch the grazing strip light.
    for(const sign of [-1,1]){
      bar('copper',12.073,.56,z+sign*.238,12.073,.81,z,.012);
      bar('copper',12.073,.56,z+sign*.238,12.073,.31,z,.012);
      bx('hopOak',12.081,.57,z+sign*.32,.025,.68,.019);
    }
    ball('brass',12.081,.56,z,.018,.047,.047);
    if(j%2===0)bar('brass',12.02,.22,z,12.27,.22,z,.032);
  }
  bar('brass',12.27,.22,-12.46,12.27,.22,-6.62,.037);
  for(const [i,z] of [-11.36,-9.51,-7.66].entries()){
    craft.tap(11.49,1.166,z,i);
    bx('iron',11.75,1.177,z,.344,.019,.34);
    for(let j=0;j<7;j++)bx('gray',11.75,1.19,z-.127+j*.042,.29,.009,.010);
  }
  for(const y of [1.17,1.83]){
    bx('wood',8.95,y,-9.54,.48,.074,5.8);
    for(const Z of [-11.85,-9.53,-7.20])bar('iron',8.72,y-.27,Z,9.12,y-.05,Z,.025);
    bx('brass',9.191,y-.018,-9.54,.012,.019,5.73);
    bx('barGlow',9.12,y-.048,-9.54,.054,.012,5.53);
    for(let n=0;n<23;n++){if(n%8===5)continue;
      craft.flasche(8.99+rng()*.084,y+.039,-12.15+n*.238+rng()*.048,n);}
  }
  for(let j=0;j<4;j++){
    const z=-11.87+j*1.59;craft.stool(12.75,z);solid(12.75,z,.42,.42);
    craft.mug(11.84,1.167,z,j);
  }
  poster(1,8.93,2.90,-9.55,3.32,1.18,pi/2);
  // Reeded backbar with amber picture lights and a hanging stemware rack.
  for(const z of [-12.09,-6.99]){
    bx('hopOak',8.84,2.85,z,.16,1.30,1.23);
    bx('glassDark',8.933,2.85,z,.035,1.16,1.09);
    for(const s of [-1,1]){
      bx('brass',8.965,2.85,z+s*.463,.020,1.09,.016);
      bar('brass',8.97,2.32,z,8.97,2.84,z+s*.44,.009);
      bar('brass',8.97,2.84,z+s*.44,8.97,3.37,z,.009);
    }
    bar('gunmetal',8.86,3.57,z,9.14,3.57,z,.029);
    bar('brass',9.14,3.55,z-.27,9.14,3.55,z+.27,.045);
    bx('barGlow',9.14,3.512,z,.059,.017,.46);
  }
  for(let j=0;j<6;j++){
    const z=-10.36+j*.31;
    cyl('hopGlint',9.07,1.781,z,.059,.012);
    cyl('hopGlint',9.07,1.726,z,.009,.108);
    ball('hopGlass',9.07,1.597,z,.062,.091,.062);
    tor('hopGlint',9.07,1.540,z,.049,0,pi/2);
  }
  // Banquettes are recessed to one side; keep the landing-to-bar diagonal unobstructed.
  for(let j=0;j<3;j++){
    const z=-7.42-j*3.29;
    bx('darkWood',23.72,.23,z,1.10,.43,2.92);bx('leather',23.98,.89,z,.27,1.10,2.88);
    // One sprung, diamond-buttoned back rather than separate pill shapes.
    const back=new T.PlaneGeometry(2.85,.82,72,24),pv=back.attributes.position;
    for(let n=0;n<pv.count;n++){
      const u=pv.getX(n),v=pv.getY(n),a=u/.478+v/.375,b=u/.478-v/.375;
      const l=Math.sin(pi*a)**2,r=Math.sin(pi*b)**2;
      const hem=Math.min(1,(1.427-Math.abs(u))/.060,(.411-Math.abs(v))/.041);
      pv.setXYZ(n,23.838-hem*(.028+.060*(l*r)**.32),F+1.013+v,z+u);
    }
    back.computeVertexNormals();kit.k.geometry('hopVelvet',back,new T.Matrix4());back.dispose();
    for(let n=-5;n<=5;n++)for(const v of (n%2?[-.1875,.1875]:[-.375,0,.375])){
      craft.grain('brass',23.807,1.013+v,z+n*.239,.009,.012,.012);
    }
    bar('brass',23.90,1.423,z-1.38,23.90,1.423,z+1.38,.015);
    for(let q=0;q<4;q++){
      const V=z-1.07+q*.715;bx('leather',23.63,.52,V,.83,.17,.693);
      bar('copperDark',23.215,.525,V-.32,23.215,.525,V+.32,.009);
    }
    solid(23.68,z,1.19,2.91);
    cyl('iron',22.44,.06,z,.32,.10);cyl('brass',22.44,.40,z,.080,.62);cyl('wood',22.44,.78,z,.61,.086);
    solid(22.44,z,1.09,1.09);
    craft.mug(22.55,.824,z+.18,j);craft.mug(22.24,.824,z-.08,j+1);
    craft.lamp(22.44,.824,z-.25);
  }
  // Booth, vinyl decks, layered PA cones, patch leads and a little illuminated crest.
  bx('darkWood',16.65,.61,-16.33,3.92,1.22,.89);solid(16.65,-16.33,3.95,.92);
  bx('gunmetal',16.65,1.24,-16.33,4.01,.080,.97);
  for(let j=0;j<13;j++){
    const x=14.95+j*.283, h=.18+.53*Math.abs(Math.sin(j*.74));
    bx('brass',x,.63,-15.871,.092,.86,.024);
    bx(j%3?'cold':'tintedBulb',x,.26+h/2,-15.85,.029,h,.016);
  }
  for(const x of [15.49,17.82]){
    bx('wood',x,1.324,-16.33,.90,.088,.65);cyl('iron',x,1.383,-16.33,.258,.038);cyl('brocade',x,1.406,-16.33,.084,.006);
    tor('gray',x,1.405,-16.33,.237,0,pi/2);
    bar('brass',x+.32,1.42,-16.51,x+.15,1.42,-16.28,.012);
    cyl('gray',x+.30,1.409,-16.54,.054,.048);
    bx('gunmetal',x+.142,1.414,-16.265,.052,.028,.065,-.24);
    for(let n=0;n<3;n++)tor('gunmetal',x,1.405,-16.33,.112+n*.036,0,pi/2);
    for(let n=0;n<4;n++)bx(n?'gasket':'tintedBulb',x-.28+n*.032,1.378,-16.10,.024,.017,.036);
  }
  for(let n=0;n<6;n++){const x=16.30+n*.12;bx('gasket',x,1.286,-16.22,.018,.012,.23);
    bx('porcelain',x,1.301,-16.22+.062*Math.sin(n),.068,.028,.037);cyl('copper',x,1.31,-16.47,.033,.056);}
  for(const x of [13.62,19.70]){
    bx('darkWood',x,.86,-16.52,1.0,1.72,.81);solid(x,-16.52,1,.82);
    bx('gasket',x,.86,-16.094,.923,1.57,.050);
    for(const s of [-1,1]){
      bx('gunmetal',x+s*.457,.85,-16.046,.034,1.59,.054);
      for(const h of [.11,.84,1.61])craft.grain('brass',x+s*.455,h,-16.011,.012,.012,.005);
    }
    for(const [y,r] of [[.50,.333],[1.20,.228],[1.52,.078]]){
      tor('gray',x,y,-16.05,r);ball('gunmetal',x,y,-16.047,r*.91,r*.91,.046);
      ball('gasket',x,y,-15.999,r*.35,r*.35,.039);
    }
  }
  bx('copperDark',16.63,2.73,-17.74,5.12,1.77,.16);
  nightMarquee(T,root,16.63,F+2.73,-17.65);
  for(const [x,z,w,i] of [[21.74,-3.51,1.76,3],[12.30,-3.51,2.75,2],[18.36,-3.51,3.14,0]]){
    poster(i,x,2.55,z,w,w*.49,z<-10?0:pi);
  }
  for(const x of [11.4,21.90])flag('bavaria',x,drop+2.49,-17.78,2.42,1.87,0);
  const salt=new T.IcosahedronGeometry(1,0);
  // A real continuous knot with crossed tails, coarse salt and a hanging loop.
  for(let j=0;j<3;j++){
    const z=-7.44-j*3.29,x=24.05,y=2.37;
    const points=[[-.34,-.23,-.042],[-.22,-.17,-.085],[.10,.073,-.114],[.35,.32,-.036],[.526,.21,0],[.525,-.016,.01],[.34,-.241,.02],[0,-.331,.043],[-.35,-.231,.027],[-.54,.002,.012],[-.51,.22,0],[-.345,.31,-.01],[-.12,.08,-.008],[.14,-.10,-.04],[.345,-.225,-.079]];
    const path=new T.CatmullRomCurve3(points.map(([v,h,d])=>new T.Vector3(x+d,F+y+h,z+v)));
    const radius=t=>.037+.068*Math.sin(t*pi)**1.6+.030*Math.exp(-((t-.5)**2)/.009);
    const geom=new T.TubeGeometry(path,76,1,10,false),pos=geom.attributes.position;
    for(let row=0;row<=76;row++){
      const t=row/76,P=path.getPointAt(t),r=radius(t);
      for(let n=0;n<=10;n++){const i=row*11+n;pos.setXYZ(i,P.x+(pos.getX(i)-P.x)*r,P.y+(pos.getY(i)-P.y)*r,P.z+(pos.getZ(i)-P.z)*r);}
    }
    geom.computeVertexNormals();kit.k.geometry('hopDough',geom,new T.Matrix4());geom.dispose();
    for(const t of [0,1]){const P=path.getPointAt(t);craft.grain('hopDough',P.x,P.y-F,P.z,.038,.038,.038);}
    // Split belly and irregular salt crystals, applied on the visible crust.
    const belly=path.getPointAt(.50);
    ball('hopCrust',belly.x-.115,belly.y-F+.033,belly.z,.027,.029,.183);
    for(let s=0;s<37;s++){
      const t=(s+.2+.58*rng())/37,P=path.getPointAt(t),a=(rng()-.5)*1.85,r=radius(t);
      obj('porcelain',salt,P.x-r*Math.cos(a),P.y+r*Math.sin(a),P.z,.009,.009+rng()*.006,.012,rng(),rng(),0);
    }
    bx('hopOak',24.34,2.95,z,.23,.15,.24);
    for(const s of [-1,1])bar('brass',24.22,2.98,z,24.04,2.68,z+s*.35,.011);
  }
  salt.dispose();
  // Mirror facets share one flat-shaded mesh, a single slow turn, and no shadow map.
  const mirror=new T.BufferGeometry(),verts=[],colors=[];
  const point=(a,b)=>[.437*Math.cos(b)*Math.sin(a),.437*Math.sin(b),.437*Math.cos(b)*Math.cos(a)];
  for(let j=0;j<13;j++){
    const lo=-pi/2+j*pi/13,hi=lo+pi/13, count=Math.max(5,Math.round(30*Math.cos((hi+lo)*.5)));
    for(let i=0;i<count;i++){
      const a=(i+.024+(j%2)*.5)*2*pi/count,b=a+.952*2*pi/count;
      const corners=[point(a,lo+.005),point(b,lo+.005),point(b,hi-.005),point(a,hi-.005)];
      const col=new T.Color([0xb7c8cc,0x7fa9bc,0x9c898d,0xe0cda9,0x627e96][Math.floor(rng()*5)]);
      for(const v of [0,1,2,0,2,3]){verts.push(...corners[v]);colors.push(col.r,col.g,col.b);}
    }
  }
  mirror.setAttribute('position',new T.Float32BufferAttribute(verts,3));mirror.computeVertexNormals();
  mirror.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const globe=new T.Mesh(mirror,mirrorSilver(T));
  globe.position.set(16.60,F+3.02,-11);root.add(globe);
  const scatter=new T.InstancedMesh(new T.CircleGeometry(1,9),new T.MeshBasicMaterial({
    color:0xffdfd0,transparent:true,opacity:.24,depthWrite:false,blending:T.AdditiveBlending}),54),dummy=new T.Object3D();
  scatter.position.set(16.60,F+.048,-11);
  for(let i=0;i<scatter.count;i++){
    const a=rng()*2*pi,r=.52+rng()*2.13;
    dummy.position.set(r*Math.cos(a),0,r*Math.sin(a));dummy.rotation.set(-pi/2,0,-a);
    dummy.scale.set(.034+rng()*.042,.021+rng()*.029,1);dummy.updateMatrix();
    scatter.setMatrixAt(i,dummy.matrix);scatter.setColorAt(i,new T.Color(i%3?0xb8e8ff:0xffaac2));
  }
  const animate=danceLights(T,root,{bar,bx,cyl}),still=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const guests=clubGuests(T,root,hit,F,still);
  root.add(scatter);root.userData.turn=(dt,visitor,beat)=>{
    if(!still){globe.rotation.y+=dt*.28;scatter.rotation.y-=dt*.14;animate(dt);}
    guests(dt,visitor,beat);
  };
  bar('iron',16.60,3.44,-11,16.60,C-F,-11,.022);
  cyl('gunmetal',16.60,3.70,-11,.076,.19);
  for(const h of [2.615,3.425])tor('gray',16.60,h,-11,.158,0,pi/2);
  craft.dispose();ring.dispose();sphere.dispose();
}
