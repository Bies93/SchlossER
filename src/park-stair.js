import {architectureKit} from './architecture-kit.js';
import {ageMasonry,sharedSet,randomSource} from './surface-detail.js';

// From the garden path the first flight points right (+X), not along it.
// Local u runs across the well; decreasing v travels away from the path.
const X=42.60,Z=-13.52,W=4.35,S=2.16,back=-5.50,turn=-2.64,returnStart=-3.95;
const base=-.046,rise=.162,n=8,tread=.30,upperStart=turn+n*tread,lowerEnd=returnStart+n*tread;
const a=base-n*rise,b=a-n*rise,ceiling=-.39,roomEnd=4.74,splitRoom=2.20;
const p=(u,y,v)=>[X-v,y,Z+u];
export const WC_CUT={left:X,right:X-back,back:Z,front:Z+W};
export const WC_OUTLINE=[[X,Z],[X-back,Z],[X-back,Z+W],[X,Z+W]];
const lower=y=>y<-1.85;
function under(u,v){return u>=0&&u<=W&&v>=-.04&&v<=roomEnd;}
export function wcHeightAt(x,z,referenceY=0){
  const u=z-Z,v=X-x;
  if(lower(referenceY)&&under(u,v))return b;
  if(u<0||u>W||v<back||v>0)return null;
  const down=t=>Math.max(0,Math.min(n,t/tread+.5))*rise;
  if(u>S)return base-down(upperStart-v);
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
  block('concrete',0,S-.105,ceiling,.24,-.065,.17);
  block('step',-.026,S-.081,.24,.301,-.09,.20);
  collision(0,S-.105,-.065,.17,above);
  block('step',S+.105,W,b-.15,base,upperStart,.007);
  block('step',S+.105,W,b-.16,a,back,turn);
  block('step',0,S+.105,b-.16,a,back,returnStart);
  for(let i=0;i<n;i++){
    const u=upperStart-i*tread,d=returnStart+i*tread;
    for(const [l,r,v0,v1,y] of [[S+.105,W,u-tread,u,base-(i+1)*rise],[0,S-.105,d,d+tread,a-(i+1)*rise]]){
      block('concrete',l,r,b-.16,y-.03,v0,v1);
      block('step',l,r,y-.031,y,v0-(l===0?.015:0),v1+(l===0?0:.015));
    }
  }
  block('step',0,S-.105,b-.16,b,lowerEnd,.025);

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
  rail(0,.057,.28,S-.105,.057,.28);
  rail(W-.071,upperStart,base,W-.071,turn,a,.80,false);
  rail(.070,returnStart,a,.070,lowerEnd,b,.81,false);
  block('concrete',S-.145,S+.145,-.15,.71,-.05,.24);
  collision(S-.145,S+.145,-.05,.24);

  // Compact, designed two-cabin interior. Its ceiling is below plaza
  // grade, and only the lower movement layer sees its walls and fixtures.
  const joint=.012, pitch=.312,doorV=2.13;
  block('grout',0,W,b-.10,b-.014,0,roomEnd);
  for(let v=0,j=0;v<roomEnd-.025;v+=pitch,j++){
    for(let u=0,i=0;u<W-.025;u+=pitch,i++){
      const col=['tileA','tileB','tileC'][(i*7+j*13+i*j)%3];
      block(col,u+joint,Math.min(W,u+pitch)-joint,b-.025,b,v+joint,Math.min(roomEnd,v+pitch)-joint);
    }
  }
  block('paint',0,W,ceiling,ceiling+.11,.02,roomEnd);
  function roomWall(u0,u1,v0,v1,head=b,top=ceiling+.07,closed=true){
    block('paint',u0,u1,head,top,v0,v1);
    if(closed)collision(u0,u1,v0,v1,below);
  }
  roomWall(-.17,0,0,roomEnd+.13);
  roomWall(W,W+.17,0,roomEnd+.13);
  roomWall(-.15,W+.15,roomEnd,roomEnd+.15);
  roomWall(S-.105,W,-.062,.09);
  roomWall(splitRoom-.055,splitRoom+.055,doorV,roomEnd);
  // Washable wainscot, with recessed joints rather than a flat wall image.
  for(const u of [0,W-.016])for(let v=.023,i=0;v<roomEnd-.12;v+=.32,i++){
    for(let j=0;j<4;j++)block(i%9===j?'tileB':'tileA',u,u+.018,b+.10+j*.238,b+.326+j*.238,v,v+.306);
  }
  for(const [l,r,c] of [[0,splitRoom-.055,1.02],[splitRoom+.055,W,3.30]]){
    const clear=.60,top=b+1.94,front=doorV+.14;
    roomWall(l,c-clear,doorV,front);roomWall(c+clear,r,doorV,front);
    roomWall(c-clear,c+clear,doorV,front,top,ceiling+.03,false);
    for(const u of [c-clear,c+clear])block('doorEdge',u-.038,u+.038,b,top+.035,doorV-.034,front+.039);
    block('doorEdge',c-clear-.038,c+clear+.038,top-.031,top+.042,doorV-.034,front+.039);
    // Door drawn propped inward so both cubicles can be explored, no mode prompt.
    const hinge=c+clear-.064,w=.86;
    block('door',hinge-.027,hinge+.027,b+.055,top-.080,front+.018,front+w);
    block('doorEdge',hinge-.033,hinge+.033,b+.066,top-.091,front+w-.083,front+w);
    block('steel',hinge-.053,hinge+.052,b+.99,b+1.018,front+w-.106,front+w-.038);
    collision(hinge-.027,hinge+.027,front+.018,front+w,below);
  }
  const sphere=new T.SphereGeometry(1,18,10);
  const saucer=new T.TorusGeometry(.271,.039,7,25);
  const baseShape=new T.CylinderGeometry(.12,.19,.39,19),matrix=new T.Matrix4(),vec=new T.Vector3();
  function ceramic(m,g,u,y,v,s,rot=0){
    const mat=new T.Matrix4().makeRotationY(rot);mat.scale(vec.set(...s));mat.setPosition(...p(u,y,v));geometry(m,g,mat);
  }
  // Two recognizable toilets, a shared wall basin and two matte mirrors.
  for(const c of [1.02,3.30]){
    const v=3.98;
    ceramic('china',baseShape,c,b+.202,v,[.92,1,1]);
    ceramic('china',sphere,c,b+.369,v,[.34,.19,.288]);
    ceramic('grout',sphere,c,b+.542,v+.013,[.246,.022,.176]);
    const M=matrix.makeRotationX(-Math.PI*.5).scale(vec.set(1.13,.83,.82));
    M.setPosition(...p(c,b+.551,v));geometry('china',saucer,M);
    block('china',c-.28,c+.28,b+.36,b+.83,4.28,4.61);
    block('china',c-.30,c+.30,b+.818,b+.86,4.254,4.63);
    block('steel',c-.055,c+.055,b+.858,b+.874,4.42,4.47);
    collision(c-.29,c+.29,v-.36,4.62,below);
  }
  ceramic('china',sphere,W-.28,b+.88,1.0,[.338,.126,.227]);
  block('counter',W-.55,W-.04,b+.847,b+.908,.71,1.28);
  block('steel',W-.15,W-.098,b+.91,b+1.071,.982,1.025);
  block('steel',W-.24,W-.098,b+1.051,b+1.073,.982,1.025);
  block('doorEdge',W-.035,W-.025,b+1.16,b+1.80,.69,1.31);
  block('steel',W-.04,W-.033,b+1.194,b+1.766,.725,1.275);
  collision(W-.49,W,.71,1.28,below);
  for(const [u,v] of [[2.17,1.10],[1.04,3.53],[3.31,3.53]]){
    block('iron',u-.27,u+.27,ceiling-.058,ceiling-.013,v-.105,v+.105);
    block('lamp',u-.244,u+.244,ceiling-.069,ceiling-.056,v-.072,v+.072);
  }
  sphere.dispose();saucer.dispose();baseShape.dispose();
  kit.flush('WC · Treppen, Fliesen, Kabinen');
  const lights=[[1.80,.95,10.3,5.2],[2.60,3.33,7.8,4.65]].map(([u,v,power,distance])=>{
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
  notice('Damen',1.02,b+2.073,doorV-.016,Math.PI*.5,.52,.19);
  notice('Herren',3.30,b+2.073,doorV-.016,Math.PI*.5,.52,.19);

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
    const active=pos.y<-.53&&pos.x>=X-roomEnd-1&&pos.x<X-back+1&&pos.z>Z-1&&pos.z<Z+W+1;
    for(const {l,power} of lights)l.intensity=active?power:0;
  }};
}
