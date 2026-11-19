import {architectureKit} from './architecture-kit.js';
import {ageMasonry,sharedSet,randomSource} from './surface-detail.js';
import {X,Z,W,S,back,turn,returnStart,base,rise,n,tread,upperStart,lowerEnd,a,b,ceiling,roomLeft,p,lower} from './park-wc-layout.js';
import {addWcInterior} from './park-wc-interior.js';
import {addParkIvy} from './park-ivy.js';

export {WC_CUT,WC_OUTLINE,wcHeightAt,wcCeilingAt,wcCameraMode,isWcInterior} from './park-wc-layout.js';
export {WC_LAYER} from './park-wc-interior.js';

export function addParkStair(T,scene,world){
  const root=new T.Group();root.name='Schlossgarten · WC-Treppe und Kabinen';scene.add(root);
  const plain=(color,roughness=.86)=>new T.MeshStandardMaterial({color,roughness});
  const concrete=new T.MeshStandardMaterial({...sharedSet(T,'plaster',512),color:0xa6a594,roughness:.94});
  concrete.normalScale.setScalar(.41);ageMasonry(concrete,.62);
  const stone=sharedSet(T,'stairStone',256),enamel=sharedSet(T,'enamel',256);
  const stoneMat=(color)=>new T.MeshStandardMaterial({...stone,color,roughness:.95,normalScale:new T.Vector2(.62,.62)});
  const step=stoneMat(0xaaa79c),nose=stoneMat(0xb4ad9a),dark=stoneMat(0x817f6d);
  const ashlar=[stoneMat(0x9f9985),stoneMat(0xaaa28d),stoneMat(0x969484),stoneMat(0x98937c)];
  for(const m of ashlar)ageMasonry(m,.29,.08);
  const iron=plain(0x424a45,.67);iron.metalness=.36;
  const kit=architectureKit(T,root,{concrete,step,nose,dark,iron,
    metalEdge:new T.MeshStandardMaterial({...enamel,color:0x62635d,roughness:.85,metalness:.34}),
    vine:plain(0x554735,.97),...Object.fromEntries(ashlar.map((m,i)=>['stone'+i,m]))});
  const {box}=kit,block=(m,u0,u1,y0,y1,v0,v1)=>box(m,p,u0,u1,y0,y1,v0,v1);
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
  // Staggered, separately set courses reveal real mortar joints against the
  // unchanged structural backing. Only the inward sides receive facing.
  const rnd=randomSource(92201);
  function courses(lo,hi,top,sides){
    for(let low=b-.105,row=0;low<top-.04;low+=.29,row++){
      const high=Math.min(top-.008,low+.29),off=(row%2)*.368;
      for(let f=lo-off;f<hi-.027;){
        const w=.58+rnd()*.33,l=Math.max(lo,f)+.005,r=Math.min(hi,f+w)-.006;
        const face=.008+rnd()*.017,m='stone'+Math.floor(rnd()*ashlar.length);
        if(r-l>.038&&high-low>.04)sides(m,l,r,low+.005,high-.005,face);
        f+=w;
      }
    }
  }
  for(const [u,sign,from,to,top] of [[0,1,back+.038,-.018,.25],[W,-1,back+.038,-.022,.29],
    [S-.105,-1,returnStart+.013,-.017,.23],[S+.105,1,returnStart+.018,-.020,.23]]){
    courses(from,to,top,(m,l,r,y,Y,d)=>block(m,Math.min(u,u+sign*d),Math.max(u,u+sign*d),y,Y,l,r));
  }
  courses(.026,W-.025,.39,(m,l,r,y,Y,d)=>block(m,l,r,y,Y,back,back+d));
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
      const edge=l>0?v1:v0;
      block('nose',l+.009,r-.009,y-.022,y+.001,edge-.023,edge+.023);
      for(const d of [.033,.052]){
        const groove=edge+(l>0?-d:d);
        block('dark',l+.084,r-.084,y-.003,y+.0016,groove-.003,groove+.003);
      }
    }
  }
  block('step',roomLeft,W,b-.16,b,lowerEnd,.002);

  function rail(u0,v0,y0,u1,v1,y1,height=.61,pickets=true){
    const dx=u1-u0,dz=v1-v0,L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L;
    const line=(s,t,d)=>p(u0+ux*s-uz*d,y0+(y1-y0)*s/L+t,v0+uz*s+ux*d);
    box('iron',line,0,L,height-.039,height,-.027,.027);
    box('metalEdge',line,.004,L-.004,height-.009,height+.003,-.023,.023);
    if(pickets){
      box('iron',line,0,L,.105,.128,-.015,.015);
      const n=Math.ceil(L/.14);
      for(let j=1;j<n;j++){const u=L*j/n;box('iron',line,u-.008,u+.008,.12,height,-.009,.009);}
    }
    const count=Math.ceil(L/1.14);
    for(let j=0;j<=count;j++){
      const u=L*j/count;box('iron',line,u-.022,u+.022,0,height,-.023,.023);
      box('metalEdge',line,u-.043,u+.043,.013,.034,-.041,.041);
    }
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

  addParkIvy(T,root,kit);
  kit.flush('WC · Treppen, Mauerwerk und Geländer');
  const sheet=document.createElement('canvas');sheet.width=128;sheet.height=144;
  const c=sheet.getContext('2d');c.fillStyle='#e1e0cf';c.fillRect(0,0,128,144);
  c.textAlign='center';c.fillStyle='#383b35';c.font='bold 45px Arial';c.fillText('WC',64,52);
  c.font='bold 55px Arial';c.fillText('↓',64,119);
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;
  const notice=new T.Mesh(new T.PlaneGeometry(.255,.308),new T.MeshStandardMaterial({map,roughness:.78}));
  notice.position.set(...p(S,.463,.245));notice.rotation.y=-Math.PI*.5;root.add(notice);
  // The stair-side cap is the only visible part above grade. The actual
  // vestibule ceiling and walls below it belong to the new lighting pass.

  return addWcInterior(T,scene,world);
}
