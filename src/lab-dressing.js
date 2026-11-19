import {LAB} from './lab-layout.js';
import {randomSource} from './surface-detail.js';

const p=(x,y,z)=>[x,y,z],Y=LAB.floor;
const wTile=256,hTile=144,cols=6,rows=8;
const fillBlock=(c,x,y,w,h,s)=>{c.fillStyle=s;c.fillRect(x,y,w,h);};

// One atlas for hand-authored room signs, instrument faces and documents.
// The whole atlas is populated during scene preparation, not during play.
export function labGraphics(T){
  const sheet=document.createElement('canvas');sheet.width=wTile*cols;sheet.height=hTile*rows;
  const c=sheet.getContext('2d'),map=new T.CanvasTexture(sheet);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const standard=new T.MeshStandardMaterial({map,roughness:.87});
  const lit=new T.MeshBasicMaterial({map});
  const cells=new Map();
  function entry(key,draw){
    if(cells.has(key))return cells.get(key);
    const id=cells.size;
    if(id>=cols*rows)throw Error('Projekt Bayern · Grafik-Atlas voll');
    const x=id%cols*wTile,y=Math.floor(id/cols)*hTile;
    c.save();c.translate(x,y);c.beginPath();c.rect(0,0,wTile,hTile);c.clip();draw(c);c.restore();map.needsUpdate=true;
    const loc=[(x+3)/sheet.width,1-(y+hTile-3)/sheet.height,(x+wTile-3)/sheet.width,1-(y+3)/sheet.height];
    cells.set(key,loc);return loc;
  }
  const text=(head,lines,style)=>entry([head,style,...lines].join('|'),(c)=>{
    const alt={cream:['#c8ba98','#453c2e'],red:['#683d31','#f7e3b9'],blue:['#344f58','#f2e1bc'],crt:['#142d22','#addab5']};
    const [bg,ink]=alt[style]??alt.cream;
    fillBlock(c,0,0,wTile,hTile,bg);
    c.strokeStyle=ink;c.lineWidth=1;
    c.strokeRect(6,6,244,132);c.strokeRect(9,9,238,126);
    c.beginPath();c.moveTo(15,42);c.lineTo(241,42);c.stroke();
    c.fillStyle=ink;c.font=style==='crt'?'bold 18px monospace':'bold 19px Georgia,serif';
    c.fillText(head,15,33,224);c.font='11px monospace';
    lines.forEach((s,i)=>c.fillText(s,16,64+i*18,224));
    c.fillStyle=style==='crt'?'#10180f36':'#1c211c1b';
    for(let i=0;i<(style==='crt'?36:86);i++)if(style==='crt')c.fillRect(8,i*4,239,1);
    else c.fillRect(7+i*107%242,7+i*67%129,i%4+1,1);
  });
  function emblems(type){
    return entry(type,c=>{
      if(type==='bavaria'){
        fillBlock(c,0,0,wTile,hTile,'#e3e1cb');
        const dx=31,dy=27;c.fillStyle='#31678a';
        for(let row=-1;row<4;row++)for(let col=-1;col<6;col++){
          const x=col*dx*2+row*dx*.48-9,y=row*dy*2+21;
          c.beginPath();c.moveTo(x-dx,y);c.lineTo(x,y-dy);c.lineTo(x+dx,y);c.lineTo(x,y+dy);c.closePath();c.fill();
        }
        const rng=randomSource(2401);
        for(let i=0;i<430;i++){c.fillStyle=i%2?'#e4cf9c2f':'#5681871c';c.fillRect(rng()*256,rng()*144,rng()*6,1+rng()*1.4);}
        c.strokeStyle='#ded2b5';c.lineWidth=1.5;c.strokeRect(4,4,248,136);
      }else if(type==='franconia'){
        fillBlock(c,0,0,wTile,hTile,'#743d32');
        c.fillStyle='#d7c6a3';c.beginPath();c.moveTo(23,66);
        for(let i=0;i<3;i++){c.lineTo(23+i*21+10.5,28);c.lineTo(23+(i+1)*21,66);}
        c.closePath();c.fill();c.strokeStyle='#cfb590';c.strokeRect(7,7,242,130);
        c.font='bold 24px Georgia,serif';c.fillText('FRANKEN',96,48,145);
        c.font='11px monospace';c.fillText('AUSSENSTELLE F',98,66);
        c.save();c.translate(35,115);c.rotate(-.13);c.strokeStyle='#e3be99';c.strokeRect(-4,-19,193,27);
        c.font='bold 17px monospace';c.fillText('ABNAHME VERWEIGERT',3,0,181);c.restore();
      }else{
        fillBlock(c,0,0,wTile,hTile,'#bcb194');c.fillStyle='#413c2e';
        c.font='bold 16px Georgia,serif';c.fillText('UNTERDECK B / LEITUNG',13,26,225);
        c.strokeStyle='#4c5d57';c.lineWidth=2.6;c.beginPath();
        c.moveTo(19,55);c.lineTo(143,55);c.lineTo(143,84);c.lineTo(104,84);c.lineTo(104,110);
        c.lineTo(31,110);c.lineTo(31,68);c.lineTo(65,68);c.lineTo(65,55);c.moveTo(143,84);c.lineTo(213,84);c.stroke();
        for(const [x,y,l,s] of [[21,55,'B',0],[65,55,'01',0],[143,55,'02',0],[143,84,'03',0],[213,84,'04',1],[31,110,'F',1]]){
          fillBlock(c,x-6,y-6,12,12,s?'#904c40':'#476863');c.fillStyle='#423a31';c.font='10px monospace';c.fillText(l,x+8,y+4);
        }
        c.strokeStyle='#715b40';c.strokeRect(6,6,244,132);
      }
    });
  }
  const dirt=document.createElement('canvas');dirt.width=512;dirt.height=512;
  const a=dirt.getContext('2d'),rng=randomSource(88139);
  // Each quadrant describes a different cause: mineral deposit, rust,
  // dampness or contact wear. No repeated full-wall grime stencil.
  for(const [i,s] of ['#c1b99c','#a65a36','#354537','#b8b3a2'].entries()){
    const x=i%2*256,y=Math.floor(i/2)*256;
    a.save();a.translate(x,y);
    for(let n=0;n<740;n++){
      const v=.11+.80*rng(),width=i===2?47+v*18:i===3?42:19+v*40;
      const dx=(rng()-.5)*width*2.1+Math.sin(v*9.5+i)*11,py=22+v*215;
      a.globalAlpha=(1-v)*(.074+rng()*.092)*(i===2?.55:1);
      a.fillStyle=s;
      a.fillRect(128+dx,py,.75+rng()*(i===2?14:4.9),.76+rng()*(i===3?2.2:9.8));
    }
    for(let n=0;n<14;n++){
      a.globalAlpha=.061+rng()*.105;a.strokeStyle=s;a.lineWidth=.65+rng()*2.3;
      a.beginPath();const q=106+rng()*48,y=25+rng()*145,drop=(i===3?14:34)+rng()*(i===3?52:65);a.moveTo(q,y);
      a.quadraticCurveTo(q+5,y+drop*.46,q-4,y+drop);a.stroke();
    }
    a.restore();
  }
  const weather=new T.CanvasTexture(dirt);weather.colorSpace=T.SRGBColorSpace;weather.anisotropy=2;
  const stained=new T.MeshStandardMaterial({map:weather,transparent:true,roughness:.97,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  const stainsArray=Array.from({length:4},(_,i)=>[(i%2)*.5+.008,.5-Math.floor(i/2)*.5+.007,(i%2+1)*.5-.008,1-Math.floor(i/2)*.5-.007]);
  return {text,emblems,stainsArray,materials:{standard,lit,stained}};
}

export function dressLab(T,k,root,graphics){
  const matrix=new T.Matrix4(),quat=new T.Quaternion(),pos=new T.Vector3(),scale=new T.Vector3(),up=new T.Vector3(0,1,0),dir=new T.Vector3();
  const pin=new T.CylinderGeometry(1,1,1,8),screw=new T.CylinderGeometry(1,1,1,6),disc=new T.CylinderGeometry(1,1,1,20);
  const bevelShape=new T.Shape();bevelShape.moveTo(-.46,-.46);bevelShape.lineTo(.46,-.46);
  bevelShape.lineTo(.46,.46);bevelShape.lineTo(-.46,.46);bevelShape.closePath();
  const bevel=new T.ExtrudeGeometry(bevelShape,{depth:.92,bevelEnabled:true,bevelSize:.034,bevelThickness:.034,bevelSegments:1,steps:1});
  bevel.translate(0,0,-.46);
  const q=new T.Quaternion(),axis=new T.Vector3(1,0,0),bins={standard:[[],[]],lit:[[],[]],stained:[[],[]]};
  // Mounting coordinates provide a consistent outward-facing normal for
  // the frame, text face, bolt heads and maintenance decals.
  const plane=(x,y,z,angle,pitch=0)=>{
    q.setFromAxisAngle(up,angle).multiply(new T.Quaternion().setFromAxisAngle(axis,pitch));
    const u=new T.Vector3(1,0,0).applyQuaternion(q),v=new T.Vector3(0,1,0).applyQuaternion(q),n=new T.Vector3(0,0,1).applyQuaternion(q);
    return (a,b,d)=>[x+u.x*a+v.x*b+n.x*d,y+u.y*a+v.y*b+n.y*d,z+u.z*a+v.z*b+n.z*d];
  };
  const box=(m,x,X,y,Y,z,Z)=>k.box(m,p,x,X,y,Y,z,Z);
  function tile(kind,uv,w,h,point){
    const [l,b,r,t]=uv,[xyz,tex]=bins[kind];
    const a=point(-w*.5,-h*.5,0),g=point(w*.5,-h*.5,0),c=point(w*.5,h*.5,0),d=point(-w*.5,h*.5,0);
    xyz.push(...a,...g,...c,...a,...c,...d);tex.push(l,b,r,b,r,t,l,b,r,t,l,t);
  }
  const rod=(m,a,b,r,g=pin)=>{
    pos.fromArray(a);dir.fromArray(b).sub(pos);
    const len=dir.length();if(len<.001)return;
    k.geometry(m,g,matrix.compose(pos.addScaledVector(dir,.5),quat.setFromUnitVectors(up,dir.normalize()),scale.set(r,len,r)));
  };
  function fastener(f,x,y,d,r=.028,old=false){
    rod(old?'rust':'brass',f(x,y,d-.010),f(x,y,d+.005),r,screw);
    k.box('gasket',f,x-r*.46,x+r*.46,y-.003,y+.003,d+.004,d+.008);
  }
  function housing(m,x,y,z,w,h,d,rot=0){
    k.geometry(m,bevel,matrix.compose(pos.set(x,y,z),quat.setFromAxisAngle(up,rot),scale.set(w,h,d)));
  }
  function plaque(title,lines,x,y,z,w,h,ry=0,style='cream',rx=0,mount=true){
    const f=plane(x,Y+y,z,ry,rx),u=w*.5,v=h*.5,crt=style==='crt';
    if(mount){
      k.box(crt?'iron':'gunmetal',f,-u-.029,u+.029,-v-.028,v+.028,-.049,-.002);
      for(const dx of [-u-.018,u+.018])k.box('edge',f,dx-.009,dx+.009,-v-.024,v+.024,-.009,.007);
      for(const x of [-u+.021,u-.021])for(const y of [-v+.022,v-.022])fastener(f,x,y,.005,.013,style==='red');
    }
    tile(crt?'lit':'standard',graphics.text(title,lines,style),w,h,f);
  }
  function flag(type,x,y,z,w,h,ry=0){
    const f=plane(x,Y+y,z,ry),uv=graphics.emblems(type);
    if(type!=='bavaria'){
      k.box('gunmetal',f,-w*.5-.028,w*.5+.028,-h*.5-.022,h*.5+.022,-.039,-.001);
      for(const u of [-1,1])fastener(f,u*(w*.5-.031),h*.5-.039,.005,.017,true);
      tile('standard',uv,w,h,f);return;
    }
    // Static folds and a pinned rod, no animated texture or fabric solver.
    const [l,b,r,t]=uv,[xyz,tex]=bins.standard,n=18;
    const pt=(u,v)=>f((u-.50)*w,(v-.5)*h+.023*Math.sin(u*16)*(1-v),.022+Math.sin(u*24)*(.018+.034*(1-v)));
    for(let j=0;j<2;j++)for(let i=0;i<n;i++){
      const u=i/n,v=(i+1)/n,q=j/2,h=(j+1)/2;
      xyz.push(...pt(u,q),...pt(v,q),...pt(v,h),...pt(u,q),...pt(v,h),...pt(u,h));
      const x=l+(r-l)*u,X=l+(r-l)*v,y=b+(t-b)*q,Y=b+(t-b)*h;
      tex.push(x,y,X,y,X,Y,x,y,X,Y,x,Y);
    }
    rod('brass',f(-w*.56,h*.51,.065),f(w*.56,h*.51,.065),.030);
    for(const u of [-.51,.51])rod('iron',f(u*w,h*.51,-.12),f(u*w,h*.51,.074),.033);
  }
  function stain(x,y,z,w,h,ry,kind,rx=0){
    tile('stained',graphics.stainsArray[kind],w,h,plane(x,Y+y,z,ry,rx));
  }
  function grill(m,x,y,z,w,h,angle=0){
    const f=plane(x,Y+y,z,angle);
    k.box('gasket',f,-w*.5,w*.5,-h*.5,h*.5,-.014,.008);
    for(let i=0;i<Math.max(3,Math.floor(h/.045));i++){
      const y=-h*.5+.018+i*.045;
      k.box(m,f,-w*.464,w*.464,y,y+.018,.007,.022);
    }
    for(const u of [-w*.458,w*.458])for(const v of [-h*.32,h*.32])fastener(f,u,v,.026,.019,true);
  }
  function dial(x,y,z,r,ry=0,i=0){
    const f=plane(x,Y+y,z,ry);
    rod('edge',f(0,0,-.022),f(0,0,.042),r,disc);
    rod('paper',f(0,0,.038),f(0,0,.048),r*.78,disc);
    for(let n=0;n<8;n++){
      const a=(.78+n*.19)*Math.PI;
      const x=Math.cos(a),y=Math.sin(a);
      rod('iron',f(x*r*.57,y*r*.57,.051),f(x*r*.68,y*r*.68,.052),r*.032);
    }
    const a=.61+i*.93;
    rod(i%2?'rust':'iron',f(0,0,.057),f(Math.cos(a)*r*.51,Math.sin(a)*r*.51,.057),r*.045);
  }
  function flush(){
    for(const [kind,[xyz,uv]] of Object.entries(bins)){
      if(!xyz.length)continue;
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
      const mesh=new T.Mesh(g,graphics.materials[kind]);mesh.name=root.name+' · '+kind;mesh.receiveShadow=kind==='standard';root.add(mesh);
    }
    pin.dispose();screw.dispose();disc.dispose();bevel.dispose();
  }
  return {box,rod,housing,plane,fastener,plaque,flag,stain,grill,dial,flush};
}
