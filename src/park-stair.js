import {architectureKit} from './architecture-kit.js';
import {ageMasonry,sharedSet,randomSource} from './surface-detail.js';

// From the garden path the first flight points right (+X), not along it.
// Local u runs across the well; decreasing v travels away from the path.
const X=42.60,Z=-13.52,W=4.35,S=2.16,back=-5.50,turn=-2.64,returnStart=-3.95;
const base=-.046,rise=.162,n=8,tread=.30,upperStart=turn+n*tread,lowerEnd=returnStart+n*tread;
const a=base-n*rise,b=a-n*rise,ceiling=-.39,roomEnd=3.08,roomLeft=S+.105,wallU=4.04,roomRight=5.66;
const signs=[['Damen',1.02],['Herren',2.26]];
const p=(u,y,v)=>[X-v,y,Z+u];
export const WC_CUT={left:X,right:X-back,back:Z,front:Z+W};
export const WC_OUTLINE=[[X,Z],[X-back,Z],[X-back,Z+W],[X,Z+W]];
const lower=y=>y<-1.85;
function under(u,v){return u>=roomLeft&&u<=roomRight&&v>=-.43&&v<=roomEnd;}
export function wcHeightAt(x,z,referenceY=0){
  const u=z-Z,v=X-x;
  if(lower(referenceY)&&under(u,v))return b;
  if(u<0||u>W||v<back||v>0)return null;
  const down=t=>Math.max(0,Math.min(n,t/tread+.5))*rise;
  if(u<S)return base-down(upperStart-v);
  if(v<=returnStart)return a;
  return a-down(v-returnStart);
}
export function wcCeilingAt(x,z,referenceY=0){
  if(lower(referenceY)&&under(z-Z,X-x))return ceiling;
  return Infinity;
}

export function addParkStair(T,scene,world,finish){
  const root=new T.Group();root.name='Schlossgarten · WC-Treppe und Kabinen';scene.add(root);
  const plain=(color,roughness=.86)=>new T.MeshStandardMaterial({color,roughness});
  const concrete=new T.MeshStandardMaterial({...sharedSet(T,'plaster',512),color:0xa6a594,roughness:.94});
  concrete.normalScale.setScalar(.41);ageMasonry(concrete,.62);
  const step=finish('SANDSTONE_CUT').clone();step.color.setHex(0xaaa89d);step.vertexColors=false;
  const counter=plain(0xaca79a,.76),paint=plain(0xd1cbb7,.93),grout=plain(0x726e64),
    tileA=plain(0xbebcab,.67),tileB=plain(0xb0b1a0,.68),tileC=plain(0xa9af9b,.66),
    door=plain(0x53645d,.77),doorEdge=plain(0x7b8a7d),iron=plain(0x424a45,.67),steel=plain(0x787f7e,.35),china=plain(0xd8ddda,.31);
  iron.metalness=.36;steel.metalness=.64;
  const lamp=new T.MeshStandardMaterial({color:0xffefc8,emissive:0xffd2a2,emissiveIntensity:.69,roughness:.63});
  const kit=architectureKit(T,root,{concrete,step,counter,paint,grout,tileA,tileB,tileC,door,doorEdge,iron,steel,china,lamp});
  const {box,geometry}=kit,block=(m,u0,u1,y0,y1,v0,v1)=>box(m,p,u0,u1,y0,y1,v0,v1);
  const collision=(u0,u1,v0,v1,when)=>world.box(X-v1,Z+u0,X-v0,Z+u1,when);
  const below=o=>lower(o.y);
  const above=o=>!below(o);
  function retaining(u0,u1,v0,v1,y){
    block('concrete',u0,u1,b-.18,y,v0,v1);
    block('step',u0-.029,u1+.029,y,y+.055,v0-.027,v1+.027);
    collision(u0,u1,v0,v1);
  }
  retaining(-.24,0,back,0,.25);
  retaining(W,W+.23,back,0,.29);
  retaining(-.24,W+.23,back-.23,back,.39);
  retaining(S-.105,S+.105,returnStart,0,.23);
  // Low wall above the return outlet. The opening below it remains open.
  block('concrete',roomLeft,W,ceiling,.24,-.065,.17);
  block('step',roomLeft-.026,W+.024,.24,.301,-.09,.20);
  collision(roomLeft,W,-.065,.17,above);
  block('step',0,S-.105,b-.15,base,upperStart,.007);
  block('step',0,S-.105,b-.16,a,back,turn);
  block('step',S-.105,W,b-.16,a,back,returnStart);
  for(let i=0;i<n;i++){
    const u=upperStart-i*tread,d=returnStart+i*tread;
    for(const [l,r,v0,v1,y] of [[0,S-.105,u-tread,u,base-(i+1)*rise],[roomLeft,W,d,d+tread,a-(i+1)*rise]]){
      block('concrete',l,r,b-.16,y-.03,v0,v1);
      block('step',l,r,y-.031,y,v0-(l>0?.015:0),v1+(l>0?0:.015));
    }
  }
  block('step',roomLeft,W,b-.16,b,lowerEnd,.002);

  function rail(u0,v0,y0,u1,v1,y1,height=.61,pickets=true){
    const dx=u1-u0,dz=v1-v0,L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L;
    const line=(s,t,d)=>p(u0+ux*s-uz*d,y0+(y1-y0)*s/L+t,v0+uz*s+ux*d);
    box('iron',line,0,L,height-.034,height,-.021,.021);
    if(pickets){
      box('iron',line,0,L,.105,.128,-.015,.015);
      const n=Math.ceil(L/.14);
      for(let j=1;j<n;j++){const u=L*j/n;box('iron',line,u-.008,u+.008,.12,height,-.009,.009);}
    }
    const count=Math.ceil(L/1.14);
    for(let j=0;j<=count;j++){const u=L*j/count;box('iron',line,u-.022,u+.022,0,height,-.023,.023);}
  }
  rail(-.11,back,.305,-.11,0,.305);
  rail(W+.11,back,.345,W+.11,0,.345,.57);
  rail(-.11,back-.09,.445,W+.11,back-.09,.445,.47);
  rail(S,returnStart,.28,S,0,.28);
  rail(roomLeft,.057,.28,W,.057,.28);
  rail(.071,upperStart,base,.071,turn,a,.80,false);
  rail(W-.070,returnStart,a,W-.070,lowerEnd,b,.81,false);
  block('concrete',S-.145,S+.145,-.15,.71,-.05,.24);
  collision(S-.145,S+.145,-.05,.24);

  // Covered return corridor; both doors are on its left when walking
  // towards the path at the bottom. Only the lower layer sees these walls.
  const joint=.012,pitch=.312,d0=.405,d1=roomEnd,doorTop=b+1.94;
  for(const [u0,u1,v0,v1] of [[roomLeft,W,0,d0],[roomLeft,roomRight,d0,d1]]){
    block('grout',u0,u1,b-.10,b-.019,v0,v1);
    for(let v=v0,j=0;v<v1-.026;v+=pitch,j++)for(let u=u0,i=0;u<u1-.026;u+=pitch,i++){
      const col=['tileA','tileB','tileC'][(i*7+j*13+i*j)%3];
      block(col,u+joint,Math.min(u1,u+pitch)-joint,b-.027,b,v+joint,Math.min(v1,v+pitch)-joint);
    }
  }
  block('paint',roomLeft,W,ceiling,ceiling+.17,-.43,d0);
  block('paint',roomLeft,roomRight,ceiling,ceiling+.17,d0,d1);
  function roomWall(u0,u1,v0,v1,head=b,top=ceiling+.07,closed=true){
    block('paint',u0,u1,head,top,v0,v1);
    if(closed)collision(u0,u1,v0,v1,below);
  }
  roomWall(roomLeft-.14,roomLeft,0,d1+.10);
  roomWall(roomRight,roomRight+.13,d0,d1+.10);
  roomWall(roomLeft,roomRight,d1,d1+.13);
  roomWall(W,W+.11,0,d0);
  roomWall(wallU+.04,roomRight,d0-.12,d0);
  roomWall(wallU+.04,roomRight,1.60,1.70);
  roomWall(0,roomLeft,-.062,.095);
  // Tile on the corridor side and on the outside cubicle wall.
  for(const [u,v0,v1] of [[roomLeft,.015,d1],[roomRight-.016,d0,d1]])for(let v=v0,i=0;v<v1-.02;v+=.28,i++){
    for(let j=0;j<4;j++)block(i%9===j?'tileB':'tileA',u,u+.018,b+.10+j*.238,b+.326+j*.238,v,Math.min(v+.269,v1));
  }
  let prior=d0;
  for(const [,v] of signs){
    const l=v-.47,r=v+.47;
    roomWall(wallU,wallU+.135,prior,l);
    roomWall(wallU,wallU+.135,l,r,doorTop,ceiling+.04,false);
    for(const q of [l,r])block('doorEdge',wallU-.03,wallU+.166,b,doorTop+.036,q-.026,q+.026);
    block('doorEdge',wallU-.034,wallU+.177,doorTop-.027,doorTop+.041,l-.026,r+.026);
    block('door',wallU+.145,wallU+.89,b+.054,doorTop-.078,r-.082,r-.035);
    block('doorEdge',wallU+.835,wallU+.899,b+.068,doorTop-.088,r-.095,r-.026);
    block('steel',wallU+.79,wallU+.849,b+.97,b+1.012,r-.118,r+.005);
    collision(wallU+.145,wallU+.89,r-.082,r-.035,below);
    prior=r;
  }
  roomWall(wallU,wallU+.135,prior,d1);

  const sphere=new T.SphereGeometry(1,18,10),saucer=new T.TorusGeometry(.271,.039,7,25),
    baseShape=new T.CylinderGeometry(.12,.19,.38,19),matrix=new T.Matrix4(),vec=new T.Vector3();
  function ceramic(m,g,u,y,v,scale){
    const mat=new T.Matrix4().makeScale(...scale);mat.setPosition(...p(u,y,v));geometry(m,g,mat);
  }
  for(const [,v] of signs){
    const u=5.135;
    ceramic('china',baseShape,u,b+.196,v,[1,1,.92]);
    ceramic('china',sphere,u,b+.361,v,[.258,.18,.285]);
    ceramic('grout',sphere,u,b+.521,v,[.172,.024,.197]);
    const M=matrix.makeRotationX(-Math.PI*.5).scale(vec.set(.87,1.0,.80));
    M.setPosition(...p(u,b+.538,v));geometry('china',saucer,M);
    block('china',5.36,5.58,b+.39,b+.815,v-.27,v+.27);
    block('china',5.34,5.60,b+.814,b+.855,v-.28,v+.28);
    block('steel',5.44,5.49,b+.853,b+.867,v-.057,v+.054);
    collision(u-.24,5.60,v-.285,v+.285,below);
  }
  ceramic('china',sphere,roomLeft+.23,b+.88,2.53,[.233,.10,.266]);
  block('counter',roomLeft+.01,roomLeft+.45,b+.828,b+.899,2.26,2.80);
  block('steel',roomLeft+.099,roomLeft+.145,b+.90,b+1.07,2.50,2.55);
  block('steel',roomLeft+.103,roomLeft+.218,b+1.051,b+1.075,2.50,2.55);
  block('doorEdge',roomLeft+.014,roomLeft+.025,b+1.15,b+1.77,2.21,2.86);
  block('steel',roomLeft+.025,roomLeft+.031,b+1.183,b+1.73,2.249,2.818);
  collision(roomLeft,roomLeft+.39,2.26,2.80,below);
  for(const [u,v] of [[3.17,.34],[3.17,2.16],...[1.02,2.26].map(v=>[4.93,v])]){
    block('iron',u-.19,u+.19,ceiling-.058,ceiling-.013,v-.090,v+.090);
    block('lamp',u-.17,u+.17,ceiling-.069,ceiling-.056,v-.072,v+.072);
  }
  sphere.dispose();saucer.dispose();baseShape.dispose();
  kit.flush('WC · Treppen, Fliesen, Kabinen');
  const lights=[[3.21,.26,8.3,4.6],[4.53,2.17,7.6,4.55]].map(([u,v,power,distance])=>{
    const l=new T.PointLight(0xffe3bc,0,distance,2);l.position.set(...p(u,ceiling-.25,v));root.add(l);
    return {l,power};
  });
  const notice=(label,u,y,v,angle,w,h,arrow=false)=>{
    const sheet=document.createElement('canvas');sheet.width=256;sheet.height=arrow?288:90;
    const ctx=sheet.getContext('2d');ctx.fillStyle=arrow?'#e1e0cf':'#344c48';ctx.fillRect(0,0,sheet.width,sheet.height);
    ctx.fillStyle=arrow?'#383b35':'#f1e8cd';ctx.textAlign='center';ctx.font=arrow?'bold 99px Arial':'600 42px Arial';
    ctx.fillText(label,128,arrow?111:60);
    if(arrow){ctx.font='bold 105px Arial';ctx.fillText('↓',128,237);}
    const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=3;
    const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.78}));
    m.position.set(...p(u,y,v));m.rotation.y=angle;root.add(m);
  };
  notice('WC',S,.463,.245,-Math.PI*.5,.255,.308,true);
  for(const [label,v] of signs)notice(label,wallU-.013,b+2.073,v,Math.PI,.56,.19);

  // Efeu remains around the exposed outside edge of the turning landing.
  const leaf=new T.BufferGeometry();
  leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,.02,-.068,.043,0,-.061,.102,-.006,0,.159,0,.058,.088,-.003,.045,.028,0],3));
  leaf.setIndex([0,1,2,0,2,3,0,3,4,0,4,5]);leaf.computeVertexNormals();
  const ivy=new T.InstancedMesh(leaf,new T.MeshStandardMaterial({color:0xffffff,roughness:.88,side:T.DoubleSide}),1340),
    rand=randomSource(1822),at=new T.Object3D(),tint=new T.Color();
  for(let i=0;i<ivy.count;i++){
    const u=i<625?rand()*W:i<1010?.079:W-.084,
      v=i<625?back+.08:-.68+rand()*(back+.73),hang=Math.pow(rand(),1.40)*(.43+.89*Math.sin(u*2.45+v)**2);
    at.position.set(...p(u+(rand()-.5)*.18,.40-hang,v+(rand()-.5)*.16));
    at.rotation.set((rand()-.5)*1.4,rand()*6.28,(rand()-.5)*4.1);
    at.scale.setScalar(.71+rand()*.92);at.updateMatrix();ivy.setMatrixAt(i,at.matrix);
    tint.setHSL(.245+rand()*.076,.36+rand()*.23,.10+rand()*.15);ivy.setColorAt(i,tint);
  }
  ivy.computeBoundingSphere();root.add(ivy);
  return {update(pos){
    const active=pos.y<-.53&&pos.x>=X-roomEnd-1&&pos.x<X-back+1&&pos.z>Z-1&&pos.z<Z+roomRight+1;
    for(const {l,power} of lights)l.intensity=active?power:0;
  }};
}
