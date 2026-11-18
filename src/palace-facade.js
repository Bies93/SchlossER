import {architectureKit} from './architecture-kit.js';
import {PORTALS,HALL} from './palace-openings.js';
import {randomSource} from './surface-detail.js';

const q=(x,y,z)=>[x,y,z];
export function portalFrame(door){return (x,y,d)=>[door.side*x,y,door.z+door.side*d]}

export function palaceMaterials(T,finish){
  const copy=(name,color)=>{
    const base=finish(name),m=base.clone();
    m.color.set(color);m.vertexColors=false;
    m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;
    return m;
  };
  return {
    stone:copy('SANDSTONE',0xd7c9b9),cut:copy('SANDSTONE_CUT',0xddd0bf),
    seam:copy('SANDSTONE_DARK',0x918375),wall:copy('SANDSTONE',0xdfd1c1),
    floor:copy('SANDSTONE_CUT',0xc8bda8),oak:copy('WOOD',0xa47860),
    woodEdge:copy('WOOD_RELIEF',0xa9826d),inset:copy('WOOD',0x825f4d),
    eastOak:copy('WOOD',0x777267),eastRail:copy('WOOD_RELIEF',0x868171),
    sash:copy('WOOD',0x845648),
    glass:new T.MeshPhysicalMaterial({color:0x293841,roughness:.26,ior:1.46,envMapIntensity:.88}),
    dark:new T.MeshStandardMaterial({color:0x24201d,roughness:.92}),
    metal:new T.MeshStandardMaterial({color:0x302d27,roughness:.61,metalness:.50}),
    bronze:new T.MeshStandardMaterial({color:0x9b8053,roughness:.41,metalness:.60})
  };
}

function pairedWindows(T,root,M,side){
  const k=architectureKit(T,root,M);
  const p=(x,y,d)=>[side*x,y,side*(12.196+d)],east=side<0,span=east?2.768:2.319;
  const face=.003,back=-.37,gap=.30,width=1.25;
  const box=(m,l,r,b,h,d,f)=>k.box(m,p,l,r,b,h,d,f);
  const bar=(m,x,y,u,v,w,d)=>{
    const L=Math.hypot(u-x,v-y),a=(u-x)/L,b=(v-y)/L;
    k.box(m,(s,t,z)=>p(x+a*s-b*t,y+b*s+a*t,z),0,L,-w/2,w/2,d-.026,d+.026);
  };
  for (let level=0;level<2;level++){
    const low=level===0?4.94:10.45,top=level===0?9.99:14.48;
    const sill=level===0?5.91:11.00,head=level===0?8.87:13.78;
    const inn=gap*.5,outer=inn+width;
    box('stone',-span,span,low,sill,back,face);
    box('stone',-span,span,head,top,back,face);
    box('stone',-span,-outer,sill,head,back,face);
    box('stone',outer,span,sill,head,back,face);
    box('cut',-inn,inn,sill,head,-.245,.026);
    box('cut',-outer-.155,outer+.155,sill-.098,sill-.012,-.08,.184);
    box('seam',-outer-.12,outer+.12,sill-.153,sill-.103,-.065,.127);
    for(const sign of [-1,1]){
      const l=sign===1?inn:-outer,r=sign===1?outer:-inn,mid=(l+r)*.5;
      box('dark',l+.025,r-.025,sill+.06,head-.047,-.42,-.285);
      box('glass',l+.060,r-.06,sill+.055,head-.059,-.254,-.212);
      for(const x of [l,r]){
        box('cut',x-.083,x+.083,sill,head,-.19,.069);
        box('sash',x-.030,x+.030,sill+.046,head-.05,-.242,-.146);
      }
      box('sash',mid-.037,mid+.037,sill,head,-.249,-.142);
      for(const y of [sill+.064,sill+(head-sill)*.47,head-.063])
        box('sash',l,r,y-.032,y+.032,-.25,-.132);
      for(const x of [l+width*.25,r-width*.25])
        box('metal',x-.007,x+.007,sill+.084,head-.075,-.201,-.193);
      for(let j=1;j<6;j++){
        const y=sill+(head-sill)*j/6;
        box('metal',l+.075,r-.075,y-.007,y+.007,-.2,-.19);
      }
    }
    box('cut',-outer-.086,outer+.086,head-.043,head+.068,-.16,.091);
    if(level===0){
      const half=outer+.36,base=head+.28,crest=base+(east?.42:.52);
      k.triangle('seam',p(-half,base,.050),p(half,base,.05),p(0,crest,.05),[0,0,1,0,.5,.7]);
      box('cut',-half,half,base-.06,base+.064,-.046,.173);
      for(const s of [-1,1]){
        bar('cut',s*half,base,0,crest,.106,.185);
        bar('stone',s*half,base+.085,0,crest+.087,.047,.202);
      }
      if(!east)for(let j=-4;j<=4;j++){
        const x=j*.258;
        box('cut',x-.067,x+.067,sill-.48,sill-.203,-.02,.103);
      }
    }
  }
  k.flush(east?'Gartenfassade · gekoppelte Fenster':'Platzfassade · gekoppelte Fenster');
}

function eastMasonry(T,root,M){
  const door=PORTALS.east,k=architectureKit(T,root,M),p=portalFrame(door);
  const shell=.156,half=door.half,outer=half+.32,span=2.768,top=4.315;
  const arch=(x,r=half)=>door.spring+Math.sqrt(Math.max(0,r*r-x*x))*door.rise/half;
  const inner=Array.from({length:29},(_,i)=>{const a=Math.PI-i*Math.PI/28;return [Math.cos(a)*half,door.spring+Math.sin(a)*door.rise]});
  const out=inner.map(([x,y])=>[x*outer/half,door.spring+(y-door.spring)*(door.rise+.26)/door.rise]);
  // Mortar backing and separately coursed stone below the arch spring.
  for(const side of [-1,1]){
    const r=side<0?[-span,-half]:[half,span];
    k.box('seam',p,r[0],r[1],.013,door.spring,-.45,shell-.023);
    for(let row=0;row<7;row++){
      const y=.032+row*(door.spring-.032)/7,h=.032+(row+1)*(door.spring-.032)/7;
      const positions=[r[0],r[0]+(row%2?.46:.68),r[1]-.24,r[1]];
      for(let j=1;j<positions.length;j++){
        const d=shell+.009*Math.sin(row*4.23+j*8+side);
        k.box(j===3&&side<0||j===1&&side>0?'cut':'stone',p,positions[j-1]+.005,positions[j]-.005,y+.007,h-.008,shell-.046,d);
      }
    }
    const a=side<0?-span:outer,b=side<0?-outer:span;
    k.box('stone',p,a,b,door.spring,top,-.44,shell);
    const x=side*half;
    const sideFace=[p(x,.016,-.49),p(x,.016,shell),p(x,door.spring,shell),p(x,door.spring,-.49)];
    k.quad('cut',...(side<0?sideFace.reverse():sideFace));
  }
  // Build the crown with real block joints, the inner stone reveal and a
  // plain impost. The garden portal does not repeat the ornate west portal.
  for(let i=1;i<inner.length;i++){
    const [a,b]=[inner[i-1],inner[i]],[c,d]=[out[i-1],out[i]];
    k.quad('stone',p(c[0],c[1],shell),p(d[0],d[1],shell),p(d[0],top,shell),p(c[0],top,shell),1.7,c[0]+span);
    k.quad('wall',p(b[0],b[1],-.426),p(a[0],a[1],-.426),p(a[0],top,-.426),p(b[0],top,-.426),1.7,span+b[0]);
    k.quad('seam',p(a[0],a[1],shell-.019),p(b[0],b[1],shell-.019),p(d[0],d[1],shell-.019),p(c[0],c[1],shell-.019));
    const inset=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],
      A=inset(a,b,i%2===0?.039:.008),B=inset(a,b,i%2===0?.962:.992),
      C=inset(c,d,i%2===0?.037:.008),D=inset(c,d,i%2===0?.963:.992);
    const edge=shell+(i===14||i===15?.036:.021);
    k.quad('cut',p(A[0],A[1],edge),p(B[0],B[1],edge),p(D[0],D[1],edge),p(C[0],C[1],edge));
    k.quad('cut',p(b[0],b[1],-.48),p(a[0],a[1],-.48),p(a[0],a[1],edge),p(b[0],b[1],edge));
  }
  k.box('cut',p,-.104,.104,arch(0)-.015,arch(0)+.295,shell-.035,shell+.049);
  k.flush('Gartenportal · Rustika, Segmentsteine und Laibung');
}

function leaves(T,root,M,d){
  const p=portalFrame(d),east=d.side<0,out=[];
  const wood=east?'eastOak':'oak',rail=east?'eastRail':'woodEdge';
  for(const side of [-1,1]){
    const hinge=side*(d.half-.018),group=new T.Group();
    group.name=d.label+(side<0?' · linker Türflügel':' · rechter Türflügel');
    group.position.set(...p(hinge,HALL.floor,east?-.216:-.149));
    if(east)group.rotation.y=Math.PI;
    root.add(group);
    const k=architectureKit(T,group,M),len=d.half-.035,lip=.034;
    const L=side<0?.004:-len,R=side<0?len:-.004,center=(L+R)/2,
      panel=(m,l,r,b,t,a,z)=>k.box(m,q,l,r,b,t,a,z);
    const spring=d.spring-HALL.floor,cap=spring-.034;
    panel(wood,L,R,.015,cap,-.076,.034);
    if(east){
      const a=side<0?Math.PI:Math.PI/2,b=side<0?Math.PI/2:0;
      const shape=new T.Shape();shape.moveTo(L,cap-.014);shape.lineTo(R,cap-.014);
      for(let i=0;i<=16;i++){
        const u=b+(a-b)*i/16,x=Math.max(L,Math.min(R,Math.cos(u)*(d.half-.027)-hinge)),
          y=cap+(d.rise-.019)*Math.sin(u);
        shape.lineTo(x,y);
      }
      shape.closePath();
      const g=new T.ExtrudeGeometry(shape,{depth:.108,bevelEnabled:false,curveSegments:3});
      k.geometry(wood,g,new T.Matrix4().makeTranslation(0,0,-.075));g.dispose();
      for(let i=1;i<7;i++){
        const x=L+(R-L)*i/7,worldX=x+hinge,top=cap+(d.rise-.034)*Math.sqrt(Math.max(0,1-(worldX/d.half)**2));
        panel('inset',x-.007,x+.006,.058,top-.034,.031,.038);
      }
    }
    for(const x of [L+.070,R-.067])panel(rail,x-.049,x+.046,.044,cap-.038,lip,.065);
    for(const y of [.17,.91,1.69,cap-.099])panel(rail,L+.025,R-.027,y-.055,y+.051,.030,.063);
    if(!east){
      for(const [a,b] of [[.25,.83],[1,1.61],[1.78,cap-.17]]){
        panel('inset',L+.141,R-.139,a,b,.033,.042);
        for(const x of [L+.16,R-.16])panel(rail,x-.021,x+.021,a,b,.039,.068);
        for(const y of [a,b])panel(rail,L+.145,R-.145,y-.024,y+.025,.04,.068);
      }
    }
    const lock=center-side*.376,y=east?1.00:1.10;
    panel('metal',lock-.044,lock+.044,y-.085,y+.084,.066,.092);
    const ring=new T.TorusGeometry(east?.043:.054,.009,7,14);
    k.geometry('bronze',ring,new T.Matrix4().makeTranslation(lock,y-.015,.112));
    k.geometry('metal',ring,new T.Matrix4().makeTranslation(lock,y-.021,-.093));ring.dispose();
    for(const t of [.434,2.10]){
      const adorn=new T.CylinderGeometry(.024,.024,.146,9);
      k.geometry('metal',adorn,new T.Matrix4().makeTranslation(side<0?L+.027:R-.027,t,.043));adorn.dispose();
    }
    k.flush(d.label+' · Holz und Beschläge');
    out.push({mesh:group,sign:side,closed:east?Math.PI:0});
  }
  return out;
}

function portalPlanters(T,root){
  // The FAU garden photograph and the UniBayern front photograph both
  // show modest terracotta planters at the entrance, out of the clear span.
  const matte=(color,side=T.FrontSide)=>new T.MeshStandardMaterial({color,side,roughness:.86});
  const materials={clay:matte(0xae6e50),rim:matte(0xbf8869),soil:matte(0x41332b),stem:matte(0x675341),
    leaf0:matte(0x35512e,T.DoubleSide),leaf1:matte(0x4b6639,T.DoubleSide),leaf2:matte(0x627b48,T.DoubleSide)};
  const k=architectureKit(T,root,materials),rand=randomSource(51447);
  const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),center=V(0,0,0),rot=new T.Quaternion();
  const pot=new T.LatheGeometry([[.0,.029],[.21,.029],[.235,.062],[.24,.106],[.281,.348],[.29,.379],
    [.288,.443],[.255,.449],[.246,.429],[.237,.340],[.181,.079],[.0,.079]].map(([x,y])=>new T.Vector2(x,y)),21);
  const soil=new T.CylinderGeometry(.251,.218,.027,19),lip=new T.TorusGeometry(.278,.020,8,22);
  lip.rotateX(Math.PI/2);
  const branch=new T.CylinderGeometry(.014,.028,1,6),matrix=new T.Matrix4();
  for(const d of Object.values(PORTALS))for(const side of [-1,1]){
    const px=side*(d.side>0?2.27:2.16),pz=d.z+d.side*(d.side>0?.83:.90),base=-.043;
    const height=side>0?1.02:.82;
    k.geometry('clay',pot,matrix.makeTranslation(px,base,pz));
    k.geometry('rim',lip,matrix.makeTranslation(px,.429+base,pz));
    k.geometry('soil',soil,matrix.makeTranslation(px,.390+base,pz));
    for(let n=0;n<9;n++){
      const a=n*2.39996+rand()*.21,l=.16+rand()*.20;
      const origin=V(px,.36+base,pz),tip=V(px+l*Math.cos(a),height+rand()*.24,pz+l*Math.sin(a));
      const delta=tip.clone().sub(origin),len=delta.length();
      center.copy(origin).lerp(tip,.5);rot.setFromUnitVectors(up,delta.normalize());
      k.geometry('stem',branch,matrix.compose(center,rot,V(.50,len,.50)));
      for(let j=0;j<11;j++){
        const angle=a+j*2.39996,dx=Math.cos(angle),dz=Math.sin(angle),b=origin.clone().lerp(tip,.40+rand()*.62);
        const width=.022+rand()*.025,span=.080+rand()*.056;
        const m=b.clone().add(V(dx*span*.49,.044+rand()*.024,dz*span*.49)),t=b.clone().add(V(dx*span,.031,dz*span));
        const left=m.clone().add(V(-dz*width,-.016,dx*width)),right=m.clone().add(V(dz*width,-.010,-dx*width));
        const key='leaf'+((j+n)%3),uv=[0,0,0,1,1,1];
        k.triangle(key,[...b],[...left],[...m],uv);k.triangle(key,[...m],[...left],[...t],uv);
        k.triangle(key,[...b],[...m],[...right],uv);k.triangle(key,[...m],[...t],[...right],uv);
      }
    }
  }
  k.flush('Schlossportale · Terrakotta und Laub');[pot,soil,lip,branch].forEach(g=>g.dispose());
}

export function addPortalFacade(T,root,M){
  pairedWindows(T,root,M,1);pairedWindows(T,root,M,-1);eastMasonry(T,root,M);
  const k=architectureKit(T,root,M);
  for(const d of Object.values(PORTALS)){
    const p=portalFrame(d),east=d.side<0,start=((east?HALL.zMin:HALL.zMax)-d.z)*d.side;
    k.box('cut',p,-d.half-.16,d.half+.16,-.074,HALL.floor,start,east?.644:.517);
    k.box('floor',p,-d.half-.135,d.half+.135,-.055,.012,east?.632:.499,east?.96:.80);
  }
  k.flush('Schlosseingänge · Sandsteinschwellen');
  portalPlanters(T,root);
  return Object.fromEntries(Object.values(PORTALS).map(d=>[d.id,leaves(T,root,M,d)]));
}
