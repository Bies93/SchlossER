import {CITY_FLOOR, PERIMETER, GATES} from './world-layout.js';
import {addCityFrontage} from './city-frontages.js';
import {ageMasonry, repeatSet, sharedSet} from './surface-detail.js';
import {WC_OUTLINE} from './park-stair.js';
import {LAB_OUTLINE} from './lab-layout.js';
import {SOUTH_HATCH_OUTLINE} from './palace-openings.js';

// Earcut accepts either orientation of the X/Z footprint. Explicitly face up
// for lighting and the player's downward ray, regardless of node order.
export function planGeometry(T, outline, height, tile, holes=[]) {
  const toPath=ring=>ring.map(([x,z])=>new T.Vector2(x,z));
  const shape=toPath(outline),cutouts=holes.map(toPath),vertices=shape.concat(...cutouts),points=outline.concat(...holes);
  const index=T.ShapeUtils.triangulateShape(shape,cutouts).flatMap(([a,b,c])=>{
    const p=vertices[a],q=vertices[b],s=vertices[c];
    return (q.x-p.x)*(s.y-p.y)-(q.y-p.y)*(s.x-p.x)<0?[a,b,c]:[a,c,b];
  });
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(points.flatMap(([x,z])=>[x,height,z]),3));
  g.setAttribute('uv',new T.Float32BufferAttribute(points.flatMap(([x,z])=>[x/tile,-z/tile]),2));
  g.setIndex(index);g.computeVertexNormals();
  return g;
}

const frame=(a,b)=>{
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const ux=(b[0]-a[0])/len, uz=(b[1]-a[1])/len;
  return {len, point:(u,y,d)=>[a[0]+ux*u-uz*d,y,a[1]+uz*u+ux*d]};
};
const groundY=-.18;

export function addPerimeter(T,scene,world,finish) {
  const root=new T.Group();root.name='Einfriedung • Schlossplatz & Schlossgarten';scene.add(root);
  function tinted(key,color){
    const m=finish(key).clone();
    if(color!==undefined)m.color.set(color);
    m.vertexColors=true;return m;
  }
  const materials={
    stone:tinted('SANDSTONE',0xbeb099), cap:tinted('SANDSTONE_CUT',0xcac0a9),
    base:tinted('SANDSTONE_DARK',0x958978), joint:tinted('MORTAR',0x847c6f),
    iron:tinted('METAL',0x383e38), doors:tinted('WOOD',0x6e5844),
    roof:tinted('ROOF_DARK',0x766962), lintel:tinted('SANDSTONE_CUT',0xd8c7aa),
    stucco:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),
    sash:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.70}),
    trimLine:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.77}),
    canvasAwning:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.97,side:T.DoubleSide}),
    litGlass:new T.MeshStandardMaterial({color:0x5b5c55,vertexColors:true,roughness:.42,emissive:0xc89154,emissiveIntensity:0}),
    interior:new T.MeshStandardMaterial({color:0x292b27,vertexColors:true,roughness:.90}),
    tileRoof:new T.MeshStandardMaterial({color:0xbfb1a7,vertexColors:true,roughness:.88}),
    houseStone:tinted('SANDSTONE_CUT',0xdac6aa),
    glass:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.29,metalness:.13}),
    paving:tinted('GROUND'), street:tinted('GROUND',0xaca697), gutter:tinted('GROUND',0x8a8578),
    cushion:tinted('GROUND',0xd2cec4), walk:tinted('GROUND',0xc4bfb2),
    curbstone:tinted('SANDSTONE_CUT',0xc4bca9),
    verge:new T.MeshStandardMaterial({color:0x767c57,vertexColors:true,roughness:1})
  };
  const setts=repeatSet(T,'setts',512);
  Object.assign(materials.stucco,sharedSet(T,'plaster',512));
  materials.stucco.normalScale.setScalar(.27);
  Object.assign(materials.tileRoof,sharedSet(T,'tile',256));
  materials.tileRoof.normalScale.setScalar(.36);
  Object.assign(materials.street,setts);
  materials.street.color.set(0xd8d3ca);materials.street.roughness=1;materials.street.normalScale.setScalar(.69);
  Object.assign(materials.gutter,setts);
  materials.gutter.color.set(0xac9f8a);materials.gutter.roughness=1;materials.gutter.normalScale.setScalar(.30);
  for(const [key,exposure] of [['stone',.54],['base',.72],['cap',.15],['joint',.43],['lintel',.28],['stucco',.23],['tileRoof',.08],['houseStone',.26]])ageMasonry(materials[key],exposure);
  materials.setts=tinted('GROUND',0xc3b8a1);
  Object.assign(materials.setts,setts);materials.setts.normalScale.setScalar(.61);
  const scales={stone:2.6,cap:1.8,base:2.1,lintel:1.8,roof:3.2,tileRoof:1.48,doors:1.25,paving:6,street:1.2,gutter:1.2,cushion:3,walk:4,curbstone:1.7,houseStone:2.5,stucco:1.65};
  const bins=new Map(), white=new T.Color(0xffffff);
  function quad(m,a,b,c,d,tint=white,offsetU=0,offsetV=0) {
    if(!bins.has(m))bins.set(m,{xyz:[],uv:[],colors:[]});
    const bin=bins.get(m), scale=scales[m]??1;
    const u=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])/scale;
    const v=Math.hypot(d[0]-a[0],d[1]-a[1],d[2]-a[2])/scale;
    const points=c===d?[a,b,c]:[a,b,c,a,c,d];
    for(const p of points){bin.xyz.push(...p);bin.colors.push(tint.r,tint.g,tint.b);}
    const s=offsetU/scale,t=offsetV/scale;
    bin.uv.push(s,t,s+u,t,s+u,t+v);
    if(c!==d)bin.uv.push(s,t,s+u,t+v,s,t+v);
  }
  function box(f,m,l,r,y0,y1,d0,d1,tint) {
    const {point:p}=f;
    const a=p(l,y0,d0),b=p(r,y0,d0),c=p(r,y0,d1),d=p(l,y0,d1);
    const e=p(l,y1,d0),g=p(r,y1,d0),h=p(r,y1,d1),j=p(l,y1,d1);
    quad(m,d,c,h,j,tint);quad(m,b,a,e,g,tint);
    quad(m,c,b,g,h,tint);quad(m,a,d,j,e,tint);
    quad(m,j,h,g,e,tint);quad(m,a,b,c,d,tint);
  }
  function block(f,l,r,d0,d1){
    const {point:p}=f;
    world.polygon([p(l,0,d0),p(r,0,d0),p(r,0,d1),p(l,0,d1)].map(([x,,z])=>[x,z]));
  }
  function cap(f,l,r,base,h,width) {
    const {point:p}=f, lo=width/2, hi=lo-.055;
    box(f,'cap',l,r,base,base+.065,-lo,lo);
    const a=p(l,base+.065,-lo),b=p(r,base+.065,-lo),c=p(r,base+.065,lo),d=p(l,base+.065,lo);
    const e=p(l,base+h,-hi),g=p(r,base+h,-hi),k=p(r,base+h,hi),j=p(l,base+h,hi);
    quad('cap',a,d,j,e);quad('cap',c,b,g,k);quad('cap',d,c,k,j);
    quad('cap',b,a,e,g);quad('cap',j,k,g,e);
  }
  function pier(f,x,width,height){
    const w=width/2;
    box(f,'base',x-w-.065,x+w+.065,groundY,.29,-w-.065,w+.065);
    box(f,'stone',x-w,x+w,.29,height,-w,w);
    for(const y of [.67,1.13,1.58])if(y<height-.20)box(f,'joint',x-w-.001,x+w+.001,y,y+.010,-w-.001,w+.001);
    cap(f,x-w-.06,x+w+.06,height,.145,width+.12);
    block(f,x-w-.065,x+w+.065,-w-.065,w+.065);
  }
  function corner(edge,city) {
    const [x,z]=edge.a;
    const f=frame([x-.55,z],[x+.55,z]);
    if(city){
      box(f,'lintel',.07,1.03,groundY,4.10,-.48,.48);
      block(f,.07,1.03,-.48,.48);
    } else pier(f,.55,.78,2.14);
  }
  const ivyPalette=[0x3e5237,0x4c6340,0x506a41,0x667a48,0x405239].map(c=>new T.Color(c));
  function ivy(f,at,depth,high,seed){
    const p=f.point,width=.34+(seed%5)*.071,sign=Math.sign(depth);
    for(let j=0;j<38;j++){
      const q=Math.sin(seed*4.2+j*7.143)*.5+.5,k=Math.sin(j*2.399+seed*.37);
      const y=.044+q*high*(1-Math.abs(k)*.48),u=at+k*(.08+width*Math.sin(1.57*q))+.089*Math.sin(y*5.8+seed);
      const s=.026+q*.045,d=depth+sign*.006*(j%5),g=.72+q*.21;
      const A=p(u-s,y+s*.41,d),B=p(u-s*.66,y-s*.18,d),C=p(u,y-s*g,d+sign*s*.31),
        D=p(u+s*.83,y-s*.07,d+sign*.009),E=p(u+s*.96,y+s*.45,d),M=p(u+s*.087,y+s*.015,d+sign*s*.36),
        top=p(u+s*.21,y+s*.63,d);
      for(const [a,b,c,i] of [[A,B,M,j],[B,C,M,j+1],[C,D,M,j+2],[D,E,M,j+1],[E,top,M,j],[top,A,M,j+3]]){
        const color=ivyPalette[i%ivyPalette.length];quad('verge',a,b,c,c,color);
      }
    }
  }
  function wall(f,l,r,seed,side) {
    box(f,'base',l,r,groundY,.32,-.291,.291);
    box(f,'base',l+.006,r-.006,.297,.359,-.312,.312,new T.Color(0xa59a87));
    box(f,'joint',l,r,.35,1.98,-.226,.226);
    let y=.35;
    const heights=seed%3===0?[.29,.35,.30,.35,.34]:[.34,.30,.34,.31,.34];
    for(let course=0;course<heights.length;course++){
      const h=heights[course];
      let x=l,i=0;
      while(x<r-.013){
        const width=.82+.36*(.5+.5*Math.sin(seed*9.7+i*2.3+course*3.25));
        const to=Math.min(r,x+(i===0&&course%2?width*.52:width));
        const tone=.82+.18*(.5+.5*Math.sin(i*4.7+course*2.37+seed)),dark=course===0?.92:1;
        const tint=new T.Color().setRGB(tone*dark,tone*(course===0?.97:1),tone*(course===0?.88:.965));
        if((i+seed+course*7)%23===0)tint.setRGB(.84,.74,.66);
        const joint=.006+.003*(.5+.5*Math.sin(i*4.2+seed));
        if(to-x>joint*2+.002)box(f,'stone',x+joint,to-joint,y+.006,y+h-.008,-.254,.254,tint);
        x=to;i++;
      }
      y+=h;
    }
    box(f,'base',l,r,1.94,1.974,-.255,.255,new T.Color(0xb1aa92));
    cap(f,l,r,1.98,.16,.64);
    block(f,l,r,-.295,.295);
    if(seed%3!==0&&r-l>2.01)ivy(f,(r+l)*.5+Math.sin(seed*.132)*.61,side*.320,.50+(seed%5)*.143,seed);
  }
  function rail(f,l,r,gate=false,street=false){
    if(r-l<.15)return;
    const low=street?.21:gate?.19:.41, top=street?2.7:gate?2.33:1.88;
    box(f,'iron',l,r,low,low+.075,-.037,.037);
    box(f,'iron',l,r,top-.12,top-.062,-.037,.037);
    if(street)box(f,'doors',l,r,.25,.55,-.044,.044);
    const count=Math.ceil((r-l)/.145);
    for(let j=0;j<count;j++){
      const u=l+(j+.5)*(r-l)/count;
      box(f,'iron',u-.014,u+.014,street?.54:low,top-.02,-.015,.015);
      if(gate&&!street){
        const p=f.point,a=p(u-.022,top-.045,-.019),b=p(u+.022,top-.045,-.019);
        const c=p(u+.022,top-.045,.019),d=p(u-.022,top-.045,.019),q=p(u,top+.057,0);
        quad('iron',a,d,q,q);quad('iron',d,c,q,q);quad('iron',c,b,q,q);quad('iron',b,a,q,q);
      }
    }
    for(const u of gate?[l+.085,(l+r)/2-.033,(l+r)/2+.033,r-.085]:[l+.05,r-.05]) {
      box(f,'iron',u-.032,u+.032,gate?.115:low,top+.025,-.040,.040);
    }
    if(gate){
      const mid=(l+r)/2;
      box(f,'iron',mid-.13,mid+.13,1.02,1.15,-.067,.067);
      box(f,'iron',mid-.17,mid+.22,1.086,1.128,.066,.095);
      for(const x of [l+.05,r-.05])for(const y of [.52,1.75]){
        box(f,'iron',x-.07,x+.07,y,y+.12,-.077,.077);
        box(f,'iron',x-.18,x+.18,y+.025,y+.080,-.042,.082);
      }
      const p=f.point;
      for(const [x,u] of [[l+.10,mid-.13],[r-.10,mid+.13]])
        for(const side of [-1,1]){
          const d=side*.051, a=p(x,.38,d),b=p(u,1.03,d),c=p(u,1.096,d),e=p(x,.444,d);
          if((side>0)===(u>x))quad('iron',a,b,c,e);else quad('iron',b,a,e,c);
        }
    }
    block(f,l-.03,r+.03,-.052,.052);
  }
  function gatePillar(f,x,height=2.35){
    pier(f,x,.79,height);
    box(f,'base',x-.463,x+.463,.236,.278,-.46,.46);
    box(f,'cap',x-.44,x+.44,.36,.415,-.437,.437);
    box(f,'cap',x-.43,x+.43,height-.125,height-.075,-.423,.423);
    box(f,'lintel',x-.305,x+.305,height+.140,height+.191,-.305,.305);
    cap(f,x-.292,x+.292,height+.185,.101,.63);
    for(const side of [-1,1]){
      const d=side*.400;
      box(f,'lintel',x-.247,x+.247,.60,height-.333,d-.024,d+.023);
      box(f,'stone',x-.204,x+.204,.680,height-.413,d-.030,d+.033,new T.Color(0xb6a992));
    }
  }
  function openGate(g){
    const f=frame(g.a,g.b), l=.41, r=f.len-.41, leaf=(r-l)*.5, p=f.point;
    gatePillar(f,0);gatePillar(f,f.len);
    // Wide open, with colliders on the rotated leaves rather than across the opening.
    const hinge=(u,sign)=>{
      const aa=p(u,0,0),bb=p(u+sign*leaf*.105,0,-leaf*.992);
      const rotated=frame([aa[0],aa[2]],[bb[0],bb[2]]);
      rail(rotated,0,rotated.len,true);
    };
    hinge(l,-1);hinge(r,1);
    // A compact strip of small setts and a narrow slot drain bridges the
    // mixed paving surface; it stays under shoe height and has no collider.
    const lo=.430,hi=f.len-.430;
    for(let row=0;row<3;row++){
      let u=lo,n=0;const d0=-.204+row*.127;
      while(u<hi-.022){
        const v=Math.min(hi,u+(n++===0&&row%2?.098:.185));
        if(v-u>.025)box(f,'setts',u+.005,v-.006,-.016,-.004+(Math.sin(n*2.71+row)*.002),d0+.003,d0+.121,
          new T.Color().setScalar(.80+.18*(.5+.5*Math.sin(n*3.14+row*5.9))));
        u=v;
      }
    }
    box(f,'base',lo,hi,-.024,-.007,.186,.267);
    for(let u=lo+.04;u<hi-.03;u+=.091)box(f,'iron',u,u+.017,-.008,-.002,.192,.261);
  }
  function parkPanel(edge,f) {
    const l=0, r=f.len;
    if(edge.type==='parkGate'){
      rail(f,.30,r-.30,true);
      return;
    }
    const spanCount=Math.max(1,Math.round(r/(edge.type==='wall'?6.8:4.15)));
    for(let i=0;i<spanCount;i++){
      const a=l+(r-l)*i/spanCount,b=l+(r-l)*(i+1)/spanCount;
      if(i>0)pier(f,a,edge.type==='wall'?.56:.67,2.07);
      if(edge.type==='wall')wall(f,a,b,edge.id*8+i,edge.gardenSide??1);
      else {
        box(f,'base',a,b,groundY,.32,-.236,.236);
        cap(f,a,b,.32,.10,.52);block(f,a,b,-.236,.236);
        rail(f,a,b);
        if(edge.id%3!==1&&b-a>1.45&&edge.a?.[1]<-64){
          const seed=edge.id*9+i;
          if(seed%3!==1)ivy(f,(a+b)*.5+.23*Math.sin(seed),.285,.42+(seed%7)*.125,seed);
        }
      }
    }
  }
  const walkSurfaces=[];
  function archRing(f,mid,half,spring,rise,d0,d1){
    const p=f.point, thick=.19, count=13;
    const pt=(a,outer,d)=>p(mid+Math.cos(a)*(half+(outer?thick:0)),
      spring+Math.sin(a)*(rise+(outer?thick:0)),d);
    for(let i=0;i<count;i++){
      const a=Math.PI*i/count,b=Math.PI*(i+1)/count;
      quad('lintel',pt(a,false,d1),pt(a,true,d1),pt(b,true,d1),pt(b,false,d1));
      quad('stone',pt(b,false,d0),pt(a,false,d0),pt(a,false,d1),pt(b,false,d1));
      const top=(t,d)=>p(mid+Math.cos(t)*(half+thick),spring+rise+thick+.032,d);
      quad('houseStone',pt(b,true,d1),pt(a,true,d1),top(a,d1),top(b,d1));
      quad('houseStone',pt(a,true,d0),pt(b,true,d0),top(b,d0),top(a,d0));
    }
  }
  function plaque(f,u,y,label){
    const width=.99,height=.26,d=.139,p=f.point;
    box(f,'iron',u-width/2,u+width/2,y-height/2,y+height/2,.012,d);
    const el=document.createElement('canvas');el.width=384;el.height=100;
    const ctx=el.getContext('2d');
    ctx.fillStyle='#283c48';ctx.fillRect(0,0,384,100);
    ctx.strokeStyle='#dbcfae';ctx.lineWidth=3;ctx.strokeRect(6,6,372,88);
    ctx.font='600 45px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#f3e6c9';ctx.fillText(label,192,50,350);
    const map=new T.CanvasTexture(el);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    const plane=new T.BufferGeometry();
    plane.setAttribute('position',new T.Float32BufferAttribute([
      ...p(u-width/2,y-height/2,d+.001),...p(u+width/2,y-height/2,d+.001),
      ...p(u+width/2,y+height/2,d+.001),...p(u-width/2,y+height/2,d+.001)
    ],3));
    plane.setIndex([0,1,2,0,2,3]);plane.computeVertexNormals();
    plane.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
    const mesh=new T.Mesh(plane,new T.MeshStandardMaterial({map,roughness:.66}));
    mesh.name='Orientierung · '+label;mesh.receiveShadow=true;root.add(mesh);
  }

  const houses=new Set(['house','annex','streetGate']);
  for(const e of PERIMETER){
    // The Kollegienhaus itself bounds this section; no ironwork across its facade.
    if(e.type==='buildingEdge')continue;
    const f=frame(e.a,e.b), city=houses.has(e.type);
    if(e.gate||e.prev==='parkGate')gatePillar(f,0);
    else if(!city)corner(e,false);
    if(e.type==='streetGate'){
      const width=.69, L=f.len, p=f.point;
      for(const [a,b] of [[0,width],[L-width,L]]){
        box(f,'stone',a,b,groundY,3.31,-.27,1.06);
        box(f,'base',a,b,groundY,.32,-.28,1.12);
        block(f,a,b,-.27,1.06);
      }
      rail(f,width-.025,L-width+.025,true,true);
      archRing(f,L/2,L/2-width,2.18,.86,-.19,1.07);
      box(f,'lintel',0,L,3.25,3.42,-.30,1.12);
      cap(f,.04,L-.04,3.42,.13,1.50);
      quad('walk',p(width,.00,.02),p(L-width,.00,.02),p(L-width,-.017,1.57),p(width,-.017,1.57));
    } else if(city){
      addCityFrontage(T,e,f,{box,quad,block,groundY});
      if(e.id===3||e.id===17)plaque(f,1.15,2.94,'Schlossplatz');
      else if(e.id===8||e.id===16)plaque(f,1.15,2.94,'Hauptstraße');
    }
    else parkPanel(e,f);

    const p=f.point;
    // Keep the ground continuous right behind ironwork. Longer sight lines
    // and their non-playable buildings are composed in backdrop.js.
    if(!city)quad('verge',p(-.15,-.245,-.20),p(f.len+.15,-.245,-.20),
      p(f.len+.15,-.245,-14),p(-.15,-.245,-14));
  }
  for(const gate of Object.values(GATES))openGate(gate);
  // The interior boundary ties into the palace and the Orangerie rather than
  // drawing another fictitious perimeter across either exterior square.
  for(const [a,b,wallPanel] of [
    [[-33.35,-7.4],GATES.palaceNorth.b,false],
    [GATES.palaceNorth.a,[-42.95,-7.4],false],
    [[-42.95,-7.4],[-42.95,-15.8],false],
    [[-42.95,-15.8],GATES.wasserturm.b,false],
    [GATES.wasserturm.a,[-49.8,-15.8],false],
    [[-57.1,-15.8],[-73,-17],false],
    [[33.35,-7.5],GATES.palaceSouth.a,false],
    [GATES.palaceSouth.b,[57.5,-7.5],true],
    [[57.5,-7.5],[73,-17],true]
  ]){
    const f=frame(a,b);
    parkPanel({type:wallPanel?'wall':'iron',id:54,gardenSide:-1},f);
    if(f.len>6&&Math.abs(a[0])<57)pier(f,0,.62,2.03);
  }

  const plaza=new T.Mesh(planGeometry(T,CITY_FLOOR,-.046,6,[WC_OUTLINE,LAB_OUTLINE,SOUTH_HATCH_OUTLINE]),materials.paving.clone());
  plaza.material.vertexColors=false;plaza.receiveShadow=true;plaza.name='Schlossplatz • durchgehendes Pflaster';
  root.add(plaza);
  // One continuous paved street line and a paired drainage channel. Each join
  // uses one shared edge to avoid slivers at the two bends.
  const street=[[69,54.5],[63,51.6],[53,50.0],[31,50.0],[0,51.0],[-34,51.5],[-49,53.4],[-59,57.8],[-64,62.0],[-68,66.5]];
  function band(m,offset0,offset1,height,other=height){
    const section=street.map(([x,z],i)=>{
      const a=street[Math.max(0,i-1)],b=street[Math.min(i+1,street.length-1)];
      const dx=b[0]-a[0],dz=b[1]-a[1],h=Math.hypot(dx,dz);
      return [offset0,offset1].map((d,j)=>[x-dz*d/h,j===0?height:other,z+dx*d/h]);
    });
    let at=0;
    for(let i=1;i<section.length;i++){
      quad(m,section[i-1][0],section[i][0],section[i][1],section[i-1][1],white,at,offset0);
      at+=Math.hypot(section[i][0][0]-section[i-1][0][0],section[i][0][2]-section[i-1][0][2]);
    }
  }
  band('street',-2.55,0,-.033,-.024);
  band('street',0,2.55,-.024,-.033);
  for(const side of [-1,1]){
    const edge=(m,a,b,y,z=y)=>side===1?band(m,a,b,y,z):band(m,-b,-a,z,y);
    edge('gutter',2.55,2.77,-.033);
    edge('curbstone',2.77,3.01,-.033,.012);
    edge('cushion',3.01,3.16,.012,-.045);
  }
  for(const [x,z,yaw,side] of [[32,50.0,0,-1],[-33,51.5,.06,1],[57,50.8,.15,-1],[-55,56,.40,1]]){
    const f=frame([x-.25*Math.cos(yaw),z+side*2.65-.25*Math.sin(yaw)],
      [x+.25*Math.cos(yaw),z+side*2.65+.25*Math.sin(yaw)]);
    box(f,'interior',0,.50,-.036,-.029,-.078,.078);
    for(let n=0;n<9;n++)box(f,'iron',n*.052+.012,n*.052+.032,-.029,-.024,-.078,.078);
  }
  for(const [m,bin] of bins){
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(bin.xyz,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(bin.uv,2));
    geo.setAttribute('color',new T.Float32BufferAttribute(bin.colors,3));
    geo.computeVertexNormals();
    const walkable=['street','gutter','cushion','curbstone','walk','setts'].includes(m);
    const surf=walkable||m==='verge';
    if(surf)materials[m].side=T.DoubleSide;
    const mesh=new T.Mesh(geo,materials[m]);mesh.name='Einfriedung / '+m;
    mesh.castShadow=!surf;mesh.receiveShadow=true;root.add(mesh);
    if(walkable)walkSurfaces.push(mesh);
  }
  return {floors:[plaza,...walkSurfaces],windows:materials.litGlass};
}
