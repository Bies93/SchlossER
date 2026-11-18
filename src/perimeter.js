import {CITY_FLOOR, PERIMETER, GATES} from './world-layout.js';
import {ageMasonry, repeatSet} from './surface-detail.js';

// Earcut accepts either orientation of the X/Z footprint. Explicitly face up
// for lighting and the player's downward ray, regardless of node order.
export function planGeometry(T, outline, height, tile) {
  const shape=outline.map(([x,z])=>new T.Vector2(x,z));
  const index=T.ShapeUtils.triangulateShape(shape,[]).flatMap(([a,b,c])=>{
    const p=shape[a],q=shape[b],s=shape[c];
    return (q.x-p.x)*(s.y-p.y)-(q.y-p.y)*(s.x-p.x)<0?[a,b,c]:[a,c,b];
  });
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(outline.flatMap(([x,z])=>[x,height,z]),3));
  g.setAttribute('uv',new T.Float32BufferAttribute(outline.flatMap(([x,z])=>[x/tile,-z/tile]),2));
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
    stone:tinted('SANDSTONE',0xbca274), cap:tinted('SANDSTONE_CUT',0xcbba99),
    base:tinted('SANDSTONE_DARK',0x94836a), joint:tinted('MORTAR',0x827665),
    iron:tinted('METAL',0x383f38), doors:tinted('WOOD',0x6e5844),
    roof:tinted('ROOF_DARK',0x766962), lintel:tinted('SANDSTONE_CUT',0xd8c7aa),
    stucco:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),
    glass:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.29,metalness:.13}),
    paving:tinted('GROUND'), street:tinted('GROUND',0xaca697), gutter:tinted('GROUND',0x8a8578),
    cushion:tinted('GROUND',0xd2cec4),
    verge:new T.MeshStandardMaterial({color:0x767c57,vertexColors:true,roughness:1})
  };
  const setts=repeatSet(T,'setts',512);
  Object.assign(materials.street,setts);
  materials.street.color.set(0xd8d3ca);materials.street.roughness=1;materials.street.normalScale.setScalar(.69);
  Object.assign(materials.gutter,setts);
  materials.gutter.color.set(0xac9f8a);materials.gutter.roughness=1;materials.gutter.normalScale.setScalar(.30);
  for(const [key,exposure] of [['stone',.54],['base',.72],['cap',.15],['joint',.43],['lintel',.28]])ageMasonry(materials[key],exposure);
  const scales={stone:2.6,cap:1.8,base:2.1,lintel:1.8,roof:3.2,doors:1.25,paving:6,street:1.2,gutter:1.2,cushion:3};
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
  function wall(f,l,r,seed) {
    box(f,'base',l,r,groundY,.35,-.295,.295);
    box(f,'joint',l,r,.35,1.98,-.226,.226);
    for(let course=0;course<5;course++){
      const y=.35+course*.326;
      let x=l,i=0;
      while(x<r-.013){
        const width=.82+.36*(.5+.5*Math.sin(seed*9.7+i*2.3+course*3.25));
        const to=Math.min(r,x+(i===0&&course%2?width*.52:width));
        const tint=new T.Color().setScalar(.83+.15*(.5+.5*Math.sin(i*4.7+course*2.37+seed)));
        box(f,'stone',x+.008,to-.005,y+.006,y+.321,-.254,.254,tint);
        x=to;i++;
      }
    }
    cap(f,l,r,1.98,.16,.64);
    block(f,l,r,-.295,.295);
  }
  function rail(f,l,r,gate=false,street=false){
    if(r-l<.15)return;
    const low=street?.21:gate?.19:.41, top=street?2.7:gate?2.33:1.88;
    box(f,'iron',l,r,low,low+.075,-.037,.037);
    box(f,'iron',l,r,top-.12,top-.062,-.037,.037);
    if(street)box(f,'doors',l,r,.28,1.50,-.044,.044);
    const count=Math.ceil((r-l)/.145);
    for(let j=0;j<count;j++){
      const u=l+(j+.5)*(r-l)/count;
      box(f,'iron',u-.014,u+.014,street?1.51:low,top-.02,-.015,.015);
      if(gate&&!street){
        const p=f.point,a=p(u-.022,top-.045,-.019),b=p(u+.022,top-.045,-.019);
        const c=p(u+.022,top-.045,.019),d=p(u-.022,top-.045,.019),q=p(u,top+.057,0);
        quad('iron',a,d,q,q);quad('iron',d,c,q,q);quad('iron',c,b,q,q);quad('iron',b,a,q,q);
      }
    }
    for(const u of gate?[l+.085,(l+r)/2-.033,(l+r)/2+.033,r-.085]:[l+.05,r-.05]) {
      box(f,'iron',u-.032,u+.032,gate?.115:low,top+.025,-.040,.040);
    }
    if(gate)box(f,'iron',(l+r)/2-.13,(l+r)/2+.13,1.02,1.15,-.067,.067);
    block(f,l-.03,r+.03,-.052,.052);
  }
  function gatePillar(f,x,height=2.35){
    pier(f,x,.79,height);
    box(f,'cap',x-.44,x+.44,.36,.415,-.437,.437);
    box(f,'cap',x-.43,x+.43,height-.125,height-.075,-.423,.423);
  }
  function openGate(g){
    const f=frame(g.a,g.b), l=.24, r=f.len-.24, leaf=(r-l)*.5, p=f.point;
    gatePillar(f,0);gatePillar(f,f.len);
    // Wide open, with colliders on the rotated leaves rather than across the opening.
    const hinge=(u,sign)=>{
      const aa=p(u,0,0),bb=p(u+sign*leaf*.105,0,-leaf*.992);
      const rotated=frame([aa[0],aa[2]],[bb[0],bb[2]]);
      rail(rotated,0,rotated.len,true);
    };
    hinge(l,-1);hinge(r,1);
    box(f,'base',.37,f.len-.37,-.052,-.004,-.86,.82);
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
      if(edge.type==='wall')wall(f,a,b,edge.id*8+i);
      else {
        box(f,'base',a,b,groundY,.32,-.236,.236);
        cap(f,a,b,.32,.10,.52);block(f,a,b,-.236,.236);
        rail(f,a,b);
      }
    }
  }
  const houseTints=['#cfc1a8','#dac8b2','#c6c3b0','#d4b49f','#c3cbb9','#d5c7a3'];
  const windowTints=['#414b4b','#515956','#393f46','#51564b'];
  function house(edge,f) {
    const L=f.len, annex=edge.type==='annex', count=Math.max(1,Math.round(L/(annex?11:9)));
    // The wall skin and walk blocker share depth; window reveals are shallow
    // but genuine recesses in the facade, not panes stuck onto one flat box.
    block(f,0,L,-7,.025);
    for(let i=0;i<count;i++){
      const l=L*i/count,r=L*(i+1)/count,w=r-l;
      const id=edge.id*7+i,色=new T.Color(houseTints[id%houseTints.length]);
      const floors=annex?2:2+(id%4===0?1:0), top=3.34+(floors-1)*2.72+.48, depth=6.6+(id%3)*.7;
      box(f,'stucco',l,r,groundY,top,-depth,-.23,色);
      box(f,'base',l,r,groundY,.43,-.23,.065);
      box(f,'lintel',l,r,top-.21,top+.014,-.27,.145);
      for(let j=0;j<floors;j++){
        const base=j===0?.43:3.34+(j-1)*2.72;
        const ceil=j===floors-1?top:3.34+j*2.72;
        const bays=Math.max(1,Math.round(w/(j===0?3.1:2.35))), step=w/bays;
        const sill=j===0?.88:base+.51, head=j===0?2.70:base+1.96;
        box(f,'stucco',l,r,base,sill,-.235,.02,色);
        box(f,'stucco',l,r,head,ceil,-.235,.02,色);
        for(let k=0;k<bays;k++){
          const mid=l+(k+.5)*step, half=Math.min(step*.32,j===0?.95:.53);
          const u=mid-half,v=mid+half;
          box(f,'stucco',l+k*step,u,sill,head,-.235,.02,色);
          box(f,'stucco',v,l+(k+1)*step,sill,head,-.235,.02,色);
          const pane=new T.Color(windowTints[(id+k+j)%windowTints.length]);
          box(f,'glass',u,v,sill,head,-.225,-.207,pane);
          const mm=j?'iron':'doors';
          box(f,mm,u,u+.061,sill,head,-.198,-.12);
          box(f,mm,v-.061,v,sill,head,-.198,-.12);
          box(f,mm,mid-.019,mid+.019,sill,head,-.198,-.14);
          box(f,mm,u,v,(head+sill)*.5,(head+sill)*.5+.035,-.198,-.14);
          box(f,'lintel',u-.08,v+.08,sill-.077,sill,-.23,.100);
          box(f,'lintel',u-.045,v+.045,head,head+.083,-.23,.058);
        }
      }
      if(w>3.7)box(f,'lintel',l,l+.125,.44,top-.20,-.025,.043);
      const p=f.point, y=top+.03, peak=y+1.62+(id%4)*.32;
      const a=p(l-.10,y,.18), b=p(r+.10,y,.18), c=p(r+.10,y,-depth-.10), d=p(l-.10,y,-depth-.10);
      const ridgeL=p(l+Math.min(1.08,w*.22),peak,-depth*.51);
      const ridgeR=p(r-Math.min(1.08,w*.22),peak,-depth*.51);
      quad('roof',a,b,ridgeR,ridgeL);quad('roof',c,d,ridgeL,ridgeR);
      quad('roof',d,a,ridgeL,ridgeL);quad('roof',b,c,ridgeR,ridgeR);
      if(w>6)box(f,'base',l+w*.70,l+w*.70+.56,peak-.83,peak+.49,-depth*.49-1.25,-depth*.49-.65);
    }
  }

  const houses=new Set(['house','annex','streetGate']);
  for(const e of PERIMETER){
    const f=frame(e.a,e.b), city=houses.has(e.type);
    if(e.gate||e.prev==='parkGate')gatePillar(f,0);
    else corner(e,city && houses.has(e.prev));
    if(e.type==='streetGate'){
      rail(f,.27,f.len-.27,true,true);
      box(f,'lintel',0,f.len,2.69,3.26,-.28,.27);
      cap(f,0,f.len,3.26,.14,.72);
    } else if(city)house(e,f);
    else parkPanel(e,f);

    const p=f.point;
    // Keep sight lines behind open ironwork complete. The outboard paths and
    // yard structures are perspective context, with no entrance or collider.
    if(!city)quad('verge',p(-.15,-.245,-.20),p(f.len+.15,-.245,-.20),
      p(f.len+.15,-.245,-14),p(-.15,-.245,-14));
    if(e.type==='parkGate'||e.type==='streetGate'){
      quad('street',p(.26,-.207,-.30),p(f.len-.26,-.207,-.30),
        p(f.len-.26,-.207,-10),p(.26,-.207,-10));
      if(e.gate==='botanical')continue;
      box(f,'stucco',-1,f.len+2,-.28,3.9,-15,-10.7,new T.Color(0xa7a394));
      box(f,'base',-1,f.len+2,-.23,.52,-15.14,-10.66);
      const a=p(-1.22,3.92,-10.43),b=p(f.len+2.22,3.92,-10.43);
      const c=p(f.len+2.22,3.92,-15.27),d=p(-1.22,3.92,-15.27);
      const ridgeL=p(-1.22,4.9,-12.85),ridgeR=p(f.len+2.22,4.9,-12.85);
      quad('roof',a,b,ridgeR,ridgeL);quad('roof',c,d,ridgeL,ridgeR);
      quad('stucco',d,a,ridgeL,ridgeL,new T.Color(0xa7a394));
      quad('stucco',b,c,ridgeR,ridgeR,new T.Color(0xa7a394));
    }
  }
  for(const gate of Object.values(GATES))openGate(gate);
  // The interior boundary ties into the palace and the Orangerie rather than
  // drawing another fictitious perimeter across either exterior square.
  for(const [a,b,wallPanel] of [
    [[33.35,-7.4],GATES.palaceNorth.a,false],
    [GATES.palaceNorth.b,[42.95,-7.4],false],
    [[42.95,-7.4],[42.95,-15.8],false],
    [[42.95,-15.8],GATES.wasserturm.a,false],
    [GATES.wasserturm.b,[49.8,-15.8],false],
    [[57.1,-15.8],[73,-17],false],
    [[-73,-17],GATES.palaceSouth.a,true],
    [GATES.palaceSouth.b,[-33.35,-7.5],false]
  ]){
    const f=frame(a,b);
    parkPanel({type:wallPanel?'wall':'iron',id:54},f);
    if(f.len>6&&Math.abs(a[0])<57)pier(f,0,.62,2.03);
  }

  const plaza=new T.Mesh(planGeometry(T,CITY_FLOOR,-.046,6),materials.paving.clone());
  plaza.material.vertexColors=false;plaza.receiveShadow=true;plaza.name='Schlossplatz • durchgehendes Pflaster';
  root.add(plaza);
  // One continuous paved street line and a paired drainage channel. Each join
  // uses one shared edge to avoid slivers at the two bends.
  const street=[[69,54.5],[63,51.6],[53,50.0],[31,50.0],[0,51.0],[-34,51.5],[-49,53.4],[-59,57.8],[-64,62.0],[-68,66.5]];
  function band(m,offset0,offset1,height){
    const section=street.map(([x,z],i)=>{
      const a=street[Math.max(0,i-1)],b=street[Math.min(i+1,street.length-1)];
      const dx=b[0]-a[0],dz=b[1]-a[1],h=Math.hypot(dx,dz);
      return [offset0,offset1].map(d=>[x-dz*d/h,height,z+dx*d/h]);
    });
    let at=0;
    for(let i=1;i<section.length;i++){
      quad(m,section[i-1][0],section[i][0],section[i][1],section[i-1][1],white,at,offset0);
      at+=Math.hypot(section[i][0][0]-section[i-1][0][0],section[i][0][2]-section[i-1][0][2]);
    }
  }
  band('street',-2.55,2.55,-.026);
  for(const side of [-1,1]){
    const edge=(m,a,b,y)=>band(m,Math.min(a*side,b*side),Math.max(a*side,b*side),y);
    edge('gutter',2.55,2.77,-.024);
    edge('cushion',2.77,3.06,-.017);
  }
  for(const [m,bin] of bins){
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(bin.xyz,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(bin.uv,2));
    geo.setAttribute('color',new T.Float32BufferAttribute(bin.colors,3));
    geo.computeVertexNormals();
    const surf=['street','gutter','cushion','verge'].includes(m);
    if(surf)materials[m].side=T.DoubleSide;
    const mesh=new T.Mesh(geo,materials[m]);mesh.name='Einfriedung / '+m;
    mesh.castShadow=!surf;mesh.receiveShadow=true;root.add(mesh);
  }
  return [plaza];
}
