import {architectureKit} from './architecture-kit.js';
import {labLower} from './lab-layout.js';
import {HALL} from './palace-openings.js';
import {randomSource} from './surface-detail.js';

// North wing convention: u along the wing, d across it. The main axis
// (d=0) and the far aisle that leads around the stair enclosure stay clear.
const floor=HALL.floor,p=(u,y,d)=>[-u,y,-d];

function folioAtlas(T){
  const page=document.createElement('canvas');page.width=1024;page.height=512;
  const c=page.getContext('2d'),rng=randomSource(619323);
  for(let i=0;i<2;i++){
    const u=i*512;
    const shade=c.createLinearGradient(u,0,u+512,0);
    shade.addColorStop(0,'#baa782');shade.addColorStop(.12,'#ddcba6');
    shade.addColorStop(.485,'#dbc6a0');shade.addColorStop(.5,'#ae9676');
    shade.addColorStop(.525,'#e0cdaa');shade.addColorStop(.90,'#d5c4a3');shade.addColorStop(1,'#b9a684');
    c.fillStyle=shade;c.fillRect(u,0,512,512);
    c.strokeStyle='#796444';c.lineWidth=2;
    c.strokeRect(u+17,20,224,470);c.strokeRect(u+271,20,224,470);
    for(let j=0;j<2300;j++){
      const r=rng();c.fillStyle=r>.5?'#66422920':'#efe0b622';
      c.fillRect(u+9+rng()*494,14+rng()*481,1+rng()*3,1+rng()*2);
    }
  }
  const line=(a,y,b)=>{
    c.beginPath();c.moveTo(a,y);c.lineTo(b,y+rng()*2-1);c.stroke();
  };
  c.textAlign='center';c.fillStyle='#493e31';c.font='bold 24px Georgia,serif';
  c.fillText('LESESAAL',129,65);c.fillText('VERMERKE',385,65);
  c.fillText('SCHLOSS & GARTEN',641,63,198);c.fillText('STUDIENBLATT',897,63,198);
  c.font='15px Georgia,serif';c.fillText('Ausleihe und Rückgabe',129,94);c.fillText('Beilagen der Sammlung',385,94);
  c.fillText('Stilisierte Skizze',641,93);c.fillText('Anmerkungen zur Anlage',897,93);
  c.lineWidth=1.4;c.strokeStyle='#79674d';
  for(let j=0;j<15;j++){
    const y=124+j*22;
    for(const x of [31,287])line(x,y,x+195);
  }
  c.strokeStyle='#8b6454';c.beginPath();c.moveTo(100,117);c.lineTo(100,448);c.moveTo(351,117);c.lineTo(351,448);c.stroke();
  c.strokeStyle='#625743';c.lineWidth=1.7;
  for(const x of [35,291,801])for(let j=0;j<10;j++){
    let u=x+(x===801?0:j%3===0?72:0),y=139+j*(x===801?26:21);
    c.beginPath();c.moveTo(u,y);
    for(let q=0;q<20&&u<x+175;q++){
      const l=2+rng()*10;
      c.quadraticCurveTo(u+l*.3,y-4-rng()*3,u+l,y+(rng()-.5)*4);u+=l+1;
    }
    c.stroke();
  }
  c.strokeStyle='#5c6a4e';c.lineWidth=3;
  c.strokeRect(565,171,150,245);c.strokeRect(576,133,128,38);
  c.strokeRect(626,140,28,34);c.strokeRect(585,179,110,218);
  c.beginPath();c.moveTo(640,175);c.lineTo(640,416);c.moveTo(584,290);c.lineTo(696,290);
  c.moveTo(569,175);c.lineTo(710,410);c.moveTo(710,175);c.lineTo(570,410);c.stroke();
  c.beginPath();c.ellipse(640,291,29,34,0,0,Math.PI*2);c.stroke();
  c.fillStyle='#8c6954';c.font='14px Georgia,serif';c.fillText('SCHEMATISCH · NICHT MASSSTÄBLICH',640,459);
  const map=new T.CanvasTexture(page);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.91,emissive:0x3a2d1a,emissiveMap:map,emissiveIntensity:.28});
}

function kit(T,group,world,finishes,forms){
  const k=architectureKit(T,group,finishes),m=new T.Matrix4(),s=new T.Vector3(),t=new T.Vector3();
  const e=new T.Euler(),q=new T.Quaternion(),along=new T.Vector3(),up=new T.Vector3(0,1,0);
  const box=(key,l,r,y,h,back,front)=>k.box(key,p,l,r,y,h,back,front);
  function put(kind,shape,u,y,d,w,h,l,rx=0,ry=0,rz=0){
    q.setFromEuler(e.set(rx,ry,rz,'YXZ')).premultiply(north);
    k.geometry(kind,forms[shape],m.compose(t.set(...p(u,y,d)),q,s.set(w,h,l)));
  }
  const north=new T.Quaternion().setFromAxisAngle(up,Math.PI);
  function rod(kind,A,B,r){
    const a=new T.Vector3(...p(...A)),b=new T.Vector3(...p(...B));
    along.subVectors(b,a);const length=along.length();if(length<.0001)return;
    q.setFromUnitVectors(up,along.multiplyScalar(1/length));
    k.geometry(kind,forms.pin,m.compose(t.copy(a).lerp(b,.5),q,s.set(r,length,r)));
  }
  function block(l,r,back,front){world.box(-r,-front,-l,-back,a=>!labLower(a.y))}
  const uv=[],verts=[];
  function writing(tile,u,y,d,w,size,slope=0){
    const A=(i,j)=>p(u+w*.5*i,y+slope*j,d-size*.5*j);
    const l=tile*.5+.004,r=(tile+1)*.5-.004;
    verts.push(...A(-1,-1),...A(1,-1),...A(1,1),...A(-1,-1),...A(1,1),...A(-1,1));
    uv.push(l,.006,r,.006,r,.994,l,.006,r,.994,l,.994);
  }
  function done(){
    if(verts.length){
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
      geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
      const o=new T.Mesh(geo,finishes.script);o.name=group.name+' · Foliotextur';o.receiveShadow=true;group.add(o);
    }
    k.flush(group.name);
  }
  return {k,box,put,rod,block,writing,done};
}

function readingRoom({k,box,put,rod,block,writing}){
  // Writing table along one side of the room, with space for a person to
  // stand at the desk without blocking the two arches.
  const a=7.68,d=-2.82,w=.94;
  for(const u of [a-.78,a+.78])for(const v of [d-.29,d+.29]){
    put('walnut','turning',u,floor+.353,v,.085,.706,.085);
    put('brass','pin',u,.136,v,.062,.062,.062);
  }
  for(const v of [d-.36,d+.36])box('walnut',a-.839,a+.839,.65,.808,v-.027,v+.027);
  for(const u of [a-.815,a+.815])box('walnut',u-.026,u+.026,.65,.810,d-.34,d+.34);
  box('chestnut',a-.927,a+.927,.794,.829,d-.402,d+.402);
  box('walnut',a-w,a+w,.831,.883,d-.411,d+.411);
  box('leather',a-.744,a+.744,.884,.898,d-.308,d+.308);
  for(const u of [a-.47,a+.29]){
    box('chestnut',u-.23,u+.23,.685,.787,d+.355,d+.407);
    put('brass','ring',u,.737,d+.420,.030,.030,.022,0,0,Math.PI);
  }
  block(a-w,a+w,d-.42,d+.42);
  const x=a+.16,z=d+.01;
  box('bookA',x-.31,x+.31,.899,.919,z-.211,z+.211);
  box('page',x-.288,x+.288,.918,.937,z-.194,z+.194);
  writing(0,x,.938,z,.560,.375);
  rod('claret',[x-.014,.939,z+.15],[x+.075,.939,z+.224],.0065);
  // Inkwell, separate pen and some closed correspondence.
  put('ink','pin',a-.574,.919,d-.145,.067,.041,.067);
  put('brass','pin',a-.574,.948,d-.145,.052,.024,.052);
  put('ink','pin',a-.574,.964,d-.145,.025,.021,.025);
  const stem=[a-.566,.967,d-.147],tip=[a-.353,1.096,d-.277];
  rod('page',stem,tip,.005);
  const feather=[p(a-.535,.987,d-.168),p(a-.455,1.071,d-.258),p(...tip),p(a-.475,1.027,d-.213)];
  k.quad('page',...feather);k.quad('page',feather[3],feather[2],feather[1],feather[0]);
  for(let j=0;j<4;j++)put('page','block',a+.662-(j%2)*.016,.908+j*.009,d+.12+j*.004,.244,.009,.159,0,j*.04,0);
  put('claret','pin',a+.654,.947,d+.13,.021,.009,.021);

  // Deep green reading chair near the windows, angled back into the room.
  const cx=8.96,cz=3.68;
  const local=(u,v)=>[cx+u*.953-v*.303,cz+u*.303+v*.953];
  const piece=(kind,shape,u,y,v,w,h,d,rx=0,rz=0)=>{
    const [x,z]=local(u,v);put(kind,shape,x,y,z,w,h,d,rx,-.308,rz);
  };
  // The occupied sides are inset from the main aisle (d=0).
  for(const [u,v] of [[-.275,-.29],[.275,-.29],[-.28,.28],[.28,.28]])
    piece('walnut','turning',u,.257,v,.065,.373,.065);
  piece('walnut','block',0,.436,0,.754,.098,.716);
  piece('upholstery','soft',0,.530,.015,.383,.101,.374);
  piece('walnut','soft',0,.915,.321,.435,.514,.110,-.125);
  piece('upholstery','soft',0,.935,.249,.380,.466,.082,-.125);
  for(const u of [-.368,.368]){
    piece('walnut','turning',u,.685,-.259,.054,.358,.054);
    piece('walnut','soft',u,.864,-.004,.074,.057,.379,.04);
    piece('upholstery','soft',u,.886,.013,.056,.035,.272,.04);
  }
  for(const [u,y] of [[0,.77],[-.172,.96],[.172,.96],[0,1.138]]){
    piece('leather','soft',u,y,.175,.019,.019,.012);
  }
  block(cx-.55,cx+.55,cz-.50,cz+.52);
  const tx=10.06,tz=3.49;
  put('walnut','pin',tx,.685,tz,.353,.061,.353);put('chestnut','pin',tx,.709,tz,.365,.026,.365);
  put('walnut','turning',tx,.379,tz,.102,.584,.102);
  for(let j=0;j<3;j++){
    const i=j*Math.PI*2/3;rod('walnut',[tx,.215,tz],[tx+.285*Math.cos(i),.104,tz+.285*Math.sin(i)],.035);
  }
  block(tx-.36,tx+.36,tz-.36,tz+.36);
  put('bookC','block',tx-.07,.744,tz-.055,.275,.042,.211,0,.18,0);
  put('page','block',tx-.06,.749,tz-.048,.243,.024,.194,0,.18,0);
  put('ivory','pin',tx+.174,.733,tz+.092,.061,.017,.061);
  put('ivory','cup',tx+.174,.773,tz+.092,.045,.066,.045);
  put('brass','ring',tx+.225,.768,tz+.091,.019,.019,.019);

  // Catalogue drawers beneath the shelving wall.
  const bx=10.93,bz=-5.73;
  box('walnut',bx-.517,bx+.517,floor,.164,bz-.264,bz+.264);
  box('walnut',bx-.482,bx+.482,.157,1.149,bz-.235,bz+.235);
  box('chestnut',bx-.534,bx+.534,1.146,1.188,bz-.275,bz+.272);
  for(let row=0;row<5;row++)for(const u of [bx-.229,bx+.229]){
    const y=.201+row*.183;
    box(row===4?'chestnut':'walnut',u-.207,u+.207,y,y+.156,bz+.234,bz+.268);
    box('brass',u-.065,u+.065,y+.083,y+.137,bz+.269,bz+.280);
    box('page',u-.053,u+.053,y+.091,y+.128,bz+.280,bz+.282);
    put('brass','ring',u,y+.067,bz+.291,.025,.020,.024);
  }
  block(bx-.535,bx+.535,bz-.281,bz+.298);
}

function studyRoom({box,put,rod,block,writing}){
  // Fixed to the existing reading tables, adding no footprint to the
  // route around the end of the cellar cabinet.
  const a=18.51,d=1.63;
  box('walnut',a-.275,a+.275,.953,.997,d-.200,d+.199);
  box('bookA',a-.142,a+.143,.998,1.038,d-.14,d+.141);
  box('page',a-.132,a+.133,1.026,1.069,d-.13,d+.13);
  box('walnut',a-.210,a+.210,1.073,1.120,d-.159,d+.159);
  for(const u of [a-.214,a+.214]){
    put('iron','pin',u,1.176,d,.019,.367,.019);
    put('brass','pin',u,1.342,d,.031,.029,.031);
  }
  box('iron',a-.255,a+.255,1.307,1.349,d-.078,d+.078);
  put('iron','pin',a,1.285,d,.028,.286,.028);
  for(let n=0;n<6;n++)put('brass','pin',a,1.174+n*.027,d,.038,.009,.038);
  rod('walnut',[a-.143,1.448,d-.008],[a+.145,1.448,d+.010],.017);
  for(const u of [a-.154,a+.155])put('brass','soft',u,1.449,d,.025,.025,.025);

  const v=23.66,z=1.62;
  box('walnut',v-.277,v+.277,.953,.978,z-.208,z+.208);
  box('leather',v-.254,v+.254,.977,.990,z-.185,z+.185);
  for(const u of [v-.274,v+.249])box('chestnut',u,u+.027,.975,1.012,z-.211,z+.211);
  for(const D of [z-.209,z+.179])box('chestnut',v-.254,v+.254,.975,1.012,D,D+.03);
  for(const [j,u,d0] of [[0,-.173,-.047],[1,-.083,.054],[2,.047,-.072]]){
    put('claret','seal',v+u,1.003,z+d0,.037,.018,.034,0,j*.67,0);
    put('waxMark','pin',v+u,1.014,z+d0,.022,.006,.021);
  }
  put('brass','pin',v+.155,1.003,z+.079,.043,.024,.043);
  put('walnut','turning',v+.155,1.075,z+.079,.047,.136,.047);
  put('walnut','soft',v+.155,1.129,z+.079,.040,.024,.037);
  box('page',v-.242,v-.087,1.001,1.012,z+.098,z+.157);

  // A small atlas stand well clear of the last bay and cellar approach.
  const u=15.21,D=3.38;
  box('walnut',u-.409,u+.409,floor,.141,D-.275,D+.275);
  box('chestnut',u-.350,u+.350,.141,.175,D-.242,D+.242);
  put('walnut','turning',u,.617,D,.169,.897,.157);
  put('walnut','block',u,1.138,D,.793,.043,.557,-.29,0,0);
  box('brass',u-.381,u+.381,1.058,1.083,D-.285,D-.243);
  put('bookC','block',u,1.172,D,.731,.035,.458,-.29,0,0);
  // Atlas viewed from the centre (local d negative); this face is flipped
  // along both horizontal axes before the texture is applied.
  writing(1,u,1.194,D,-.692,-.425,.064);
  block(u-.414,u+.414,D-.281,D+.283);
}

export function furnishNorthLibrary(T,root,world,base){
  const front=new T.Group(),study=new T.Group();
  front.name='Nordflügel · Leseraum und Ausleihe';study.name='Nordflügel · Studiensammlung';root.add(front,study);
  const std=(color,roughness=.82)=>new T.MeshStandardMaterial({color,roughness});
  const recolor=(m,color)=>{const a=m.clone();a.color.setHex(color);return a;};
  const finishes={...base,walnut:recolor(base.darkWood,0x664936),chestnut:recolor(base.wood,0xa78361),
    ink:std(0x282a2c,.41),leather:std(0x3f5248,.73),upholstery:std(0x526457),page:std(0xd1bd93),
    claret:std(0x783c3a,.71),waxMark:std(0x9a614f,.72),script:folioAtlas(T)};
  const turning=new T.LatheGeometry([[.85,-.5],[.90,-.46],[.62,-.416],[.52,-.31],[.64,-.11],[.94,.06],
    [.77,.20],[.54,.29],[.55,.365],[.82,.401],[.78,.47],[.76,.5]].map(([u,y])=>new T.Vector2(u,y)),12);
  const forms={turning,soft:new T.SphereGeometry(1,12,8),pin:new T.CylinderGeometry(1,1,1,14),
    cup:new T.CylinderGeometry(1,.62,1,14),block:new T.BoxGeometry(1,1,1),
    seal:new T.CylinderGeometry(.83,1,1,10),ring:new T.TorusGeometry(1,.17,6,14)};
  const main=kit(T,front,world,finishes,forms);readingRoom(main);main.done();
  const rear=kit(T,study,world,finishes,forms);studyRoom(rear);rear.done();
  for(const a of Object.values(forms))a.dispose();
}
