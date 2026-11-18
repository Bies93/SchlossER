import {architectureKit} from './architecture-kit.js';
import {ageMasonry,sharedSet,randomSource} from './surface-detail.js';

// Public WC just beyond the south gate (OSM node 851580904). The photo
// establishes the concrete, ironwork and ivy; exact tread counts are illustrative.
export const WC_CUT={left:43.25,right:48.15,back:-16.55,front:-9.55};
const {left,right,back,front}=WC_CUT;
export const WC_OUTLINE=[[left,back],[right,back],[right,front],[left,front]];
const p=(x,y,z)=>[x,y,z], base=-.046, rise=.162, tread=.294, n=8;
const split=45.71, entry=front-.62, turn=entry-n*tread, bottom=turn-1.30, low=bottom+n*tread, end=low+1.15;
const a=base-n*rise,b=a-n*rise;
const inRect=(x,z)=>x>=left&&x<=right&&z>=back&&z<=front;
export function wcHeightAt(x,z){
  if(!inRect(x,z))return null;
  // A walking profile at the tread centres avoids treating every 16 cm
  // riser like a fall and keeps the camera within half a riser of the stone.
  const down=t=>Math.max(0,Math.min(n,t/tread+.5))*rise;
  if(x<split)return base-down(entry-z);
  if(z<=bottom)return a;
  return a-down(z-bottom);
}

export function addParkStair(T,scene,world,finish){
  const root=new T.Group();root.name='Schlossgarten · öffentlicher WC-Abgang';scene.add(root);
  const mineral=(key,color)=>{
    const m=finish(key).clone();m.vertexColors=false;m.color.setHex(color);
    ageMasonry(m,.44);return m;
  };
  const concrete=new T.MeshStandardMaterial({...sharedSet(T,'plaster',512),color:0xa6a494,roughness:.97});
  concrete.normalScale.setScalar(.37);ageMasonry(concrete,.72);
  const iron=new T.MeshStandardMaterial({color:0x404844,roughness:.73,metalness:.36});
  const kit=architectureKit(T,root,{
    concrete,step:mineral('SANDSTONE_DARK',0xa4a294),lip:mineral('SANDSTONE_CUT',0xaaa89c),
    iron,dark:new T.MeshStandardMaterial({color:0x262c29,roughness:.96})
  }),{box}=kit;
  const block=(m,x0,x1,y0,y1,z0,z1)=>box(m,p,x0,x1,y0,y1,z0,z1);
  const wall=(x0,x1,z0,z1,y,cap=true)=>{
    block('concrete',x0,x1,b-.25,y,z0,z1);
    if(cap)block('lip',x0-.029,x1+.029,y,y+.062,z0-.030,z1+.030);
    world.box(x0,z0,x1,z1);
  };
  wall(left-.25,left,back,front,.26);
  wall(right,right+.28,back,front,.37);
  wall(left-.25,right+.28,back-.25,back,.44);
  wall(split-.12,split+.12,bottom,front,.25);
  wall(split+.12,right,front-.09,front+.13,.37);
  block('step',left,split-.12,b-.21,base,entry,front+.008);
  block('step',left,right,b-.21,a,back,turn+.006);
  // Landing and real, opaque risers. A dark door is the end of the
  // modeled public staircase; no inferred rooms beyond it.
  for(let i=0;i<n;i++){
    const high=base-(i+1)*rise,z=entry-i*tread;
    block('step',left,split-.12,b-.16,high-.030,z-tread,z+.001);
    block('lip',left,split-.12,high-.030,high,z-tread,z+.016);
    const y=a-(i+1)*rise,v=bottom+i*tread;
    block('step',split+.12,right,b-.17,y-.030,v,v+tread);
    block('lip',split+.12,right,y-.030,y,v-.015,v+tread);
  }
  block('step',split+.12,right,b-.17,b,low,end+.003);
  // Open void above the right-hand flight remains visible from the park.
  // Mask the short lower approach with a return wall, not a fake tunnel.
  wall(split+.12,right,end,end+.22,.22,false);
  block('iron',split+.45,right-.33,b,b+2.18,end-.055,end+.011);
  block('dark',split+.53,right-.41,b+.022,b+2.06,end-.073,end-.049);
  block('iron',split+1.00,split+1.13,b+1.01,b+1.067,end-.106,end-.071);
  block('concrete',split+.12,right,b-.16,base,end+.22,front-.09);
  world.box(split+.12,end+.22,right,front-.09);
  // Square-tube balustrade and sloping grasp rails, photographed in dark grey.
  function rail(x0,z0,y0,x1,z1,y1,{height=.78,pickets=true}={}){
    const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L;
    const line=(u,v,d)=>[x0+ux*u-uz*d,y0+(y1-y0)*u/L+v,z0+uz*u+ux*d];
    box('iron',line,0,L,height-.045,height,-.023,.023);
    if(pickets){
      box('iron',line,0,L,.115,.145,-.014,.014);
      const count=Math.ceil(L/.145);
      for(let j=1;j<count;j++){const u=L*j/count;box('iron',line,u-.010,u+.010,.12,height,-.010,.010);}
    }
    const posts=Math.ceil(L/1.18);
    for(let j=0;j<=posts;j++){const u=L*j/posts;box('iron',line,u-.023,u+.023,0,height,-.022,.022);}
  }
  rail(left-.105,back,.32,left-.105,front,.32,{height:.57});
  rail(right+.105,back,.43,right+.105,front,.43,{height:.47});
  rail(left-.105,back-.08,.50,right+.105,back-.08,.50,{height:.40});
  rail(split,bottom,.30,split,front,.30,{height:.57});
  rail(left+.060,entry,base,left+.060,turn,a,{height:.83,pickets:false});
  rail(right-.062,bottom,a,right-.062,low,b,{height:.83,pickets:false});
  block('concrete',left-.36,left+.06,-.13,.72,front-.28,front+.10);
  world.box(left-.36,front-.28,left+.06,front+.10);
  kit.flush('WC-Abgang');

  const placard=document.createElement('canvas');placard.width=128;placard.height=160;
  const ctx=placard.getContext('2d');ctx.fillStyle='#e4e4d7';ctx.fillRect(0,0,128,160);
  ctx.fillStyle='#282b29';ctx.textAlign='center';ctx.font='bold 52px Arial';ctx.fillText('WC',64,62);
  ctx.lineWidth=11;ctx.strokeStyle=ctx.fillStyle;
  ctx.beginPath();ctx.moveTo(42,89);ctx.lineTo(87,131);ctx.stroke();
  ctx.beginPath();ctx.moveTo(68,133);ctx.lineTo(93,136);ctx.lineTo(91,110);ctx.fill();
  for(const [x,y] of [[8,8],[120,8],[8,152],[120,152]])ctx.fillRect(x-1,y-1,3,3);
  const map=new T.CanvasTexture(placard);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const sign=new T.Mesh(new T.PlaneGeometry(.28,.35),new T.MeshStandardMaterial({map,roughness:.79}));
  sign.position.set(left-.148,.469,front+.103);sign.name='WC · Hinweisschild';root.add(sign);
  // One instanced packet of pointed leaf silhouettes. No image, alpha layer
  // or extra realtime lamp is needed at this scale.
  const leaf=new T.BufferGeometry();
  leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,.021,-.045,.029,0,-.065,.088,-.004,-.028,.088,.010,0,.159,0,.031,.097,.010,.060,.080,-.003,.045,.028,0],3));
  leaf.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,7]);leaf.computeVertexNormals();
  const ivy=[[right-.08,back+.22,5.95,0,925],[left+.10,back+.18,4.33,0,580],[left+.16,back+.11,4.50,1,830]];
  const greenery=new T.InstancedMesh(leaf,new T.MeshStandardMaterial({color:0xffffff,roughness:.87,side:T.DoubleSide}),
    ivy.reduce((n,s)=>n+s[4],0));
  greenery.name='WC · Efeu an den Stützwänden';greenery.receiveShadow=true;
  const r=randomSource(1822),at=new T.Object3D(),col=new T.Color();
  let i=0;
  for(const [x,z,len,dir,count] of ivy){
    for(let j=0;j<count;j++){
      const t=r()*len,hang=.29+1.26*Math.pow(.5+.5*Math.sin(t*3.75+x+Math.sin(t*1.7)*.65),2.1),
        drop=Math.pow(r(),1.48)*hang;
      const rootDrift=.026+.13*Math.pow(1-Math.min(1,drop*1.24),1.33);
      at.position.set(x+(dir?t:(r()-.39)*rootDrift),.406-drop+(r()-.5)*.17,z+(dir?(r()-.39)*rootDrift:t));
      at.rotation.set((r()-.44)*1.75,r()*6.283,(r()-.5)*4);
      at.scale.setScalar(.73+r()*.98);at.updateMatrix();greenery.setMatrixAt(i,at.matrix);
      col.setHSL(.245+r()*.087,.33+r()*.22,.097+r()*.123);
      greenery.setColorAt(i++,col);
    }
  }
  greenery.computeBoundingSphere();root.add(greenery);
}
