import {CITY_FLOOR, CITY_FRONTAGES, PERIMETER, GATES} from './world-layout.js';
import {ageMasonry, repeatSet, sharedSet} from './surface-detail.js';
import {WC_OUTLINE} from './park-stair.js';

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
    stone:tinted('SANDSTONE',0xbca274), cap:tinted('SANDSTONE_CUT',0xcbba99),
    base:tinted('SANDSTONE_DARK',0x94836a), joint:tinted('MORTAR',0x827665),
    iron:tinted('METAL',0x383f38), doors:tinted('WOOD',0x6e5844),
    roof:tinted('ROOF_DARK',0x766962), lintel:tinted('SANDSTONE_CUT',0xd8c7aa),
    stucco:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),
    shopGlass:new T.MeshStandardMaterial({color:0x606066,vertexColors:true,roughness:.35,envMapIntensity:.69}),
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
  const scales={stone:2.6,cap:1.8,base:2.1,lintel:1.8,roof:3.2,doors:1.25,paving:6,street:1.2,gutter:1.2,cushion:3,walk:4,curbstone:1.7,houseStone:2.5,stucco:1.65};
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
    let y=.35;
    const heights=seed%3===0?[.29,.35,.30,.35,.34]:[.34,.30,.34,.31,.34];
    for(let course=0;course<heights.length;course++){
      const h=heights[course];
      let x=l,i=0;
      while(x<r-.013){
        const width=.82+.36*(.5+.5*Math.sin(seed*9.7+i*2.3+course*3.25));
        const to=Math.min(r,x+(i===0&&course%2?width*.52:width));
        const tint=new T.Color().setScalar(.83+.15*(.5+.5*Math.sin(i*4.7+course*2.37+seed)));
        if((i+seed+course*7)%23===0)tint.setRGB(.88,.76,.63);
        const joint=.006+.003*(.5+.5*Math.sin(i*4.2+seed));
        if(to-x>joint*2+.002)box(f,'stone',x+joint,to-joint,y+.006,y+h-.008,-.254,.254,tint);
        x=to;i++;
      }
      y+=h;
    }
    box(f,'base',l,r,1.94,1.974,-.255,.255,new T.Color(0xb1aa92));
    cap(f,l,r,1.98,.16,.64);
    block(f,l,r,-.295,.295);
    if(seed%4===1&&r-l>1.5){
      const p=f.point,bright=new T.Color(0x8b925f),dim=new T.Color(0x697349),at=l+(r-l)*(.42+(seed%7)*.043);
      for(let j=0;j<38;j++){
        const q=Math.sin(seed*4.2+j*7.143)*.5+.5,k=Math.sin(j*2.399+seed*.37);
        const x=at+k*(.16+q*.63),y=.081+q*.484*(1-Math.abs(k)*.68),s=.024+q*.039,d=(y<.35?.303:.266)+(j%4)*.004;
        if(x-s<l||x+s>r)continue;
        quad('verge',p(x-s,y,d),p(x,y-s*.84,d+.011),p(x+s,y+.006,d),
          p(x+k*s*.19,y+s*.96,d+.014),j%3?dim:bright);
      }
    }
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
  const houseTints=['#d5c8b3','#ddcbb6','#c9c9b9','#d2ad9a','#bac4b8','#d0c49f'];
  const frames=['#343934','#555446','#4a5551','#563e39'];
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
  function opening(f,m,l,r,sill,head,d,color){
    box(f,'interior',l,r,sill,head,d-.007,d-.002);
    box(f,m,l+.022,r-.022,sill+.026,head-.024,d,d+.009,color);
    for(const u of [l+.025,r-.064])box(f,'iron',u,u+.039,sill,head,d+.012,d+.042);
    const mid=(l+r)*.5, cross=sill+(head-sill)*.62;
    box(f,'iron',mid-.024,mid+.024,sill,head,d+.013,d+.050);
    box(f,'iron',l,r,cross,cross+.038,d+.012,d+.052);
  }
  function door(f,l,r,top,m){
    const mid=(l+r)/2;
    box(f,'interior',l,r,.065,top,-.389,-.380);
    box(f,m,l+.05,r-.05,.078,top-.17,-.377,-.310);
    for(const x of [l+.17,mid,r-.17])
      box(f,'doors',x-.032,x+.032,.12,top-.16,-.304,-.269);
    for(const y of [.29,1.01,top-.43])
      box(f,'doors',l+.079,r-.079,y,y+.071,-.306,-.272);
    box(f,'iron',mid+.049,mid+.109,.94,1.023,-.269,-.237);
    box(f,'base',l-.10,r+.10,-.039,.065,-.37,.124);
    for(const x of [l-.11,r])box(f,'lintel',x,x+.11,.065,top,-.395,.044);
    box(f,'lintel',l-.145,r+.145,top-.018,top+.105,-.398,.071);
  }
  function house(edge,f) {
    const L=f.len,annex=edge.type==='annex',id=edge.id,
      types=CITY_FRONTAGES[id]??Array.from({length:Math.max(1,Math.round(L/10))},(_,i)=>i%2?'plaster':'stone');
    const weight=types.map((t,i)=>.75+((id*17+i*19)%13)*.055+(t==='corner'?.19:0)),sum=weight.reduce((a,b)=>a+b);
    let start=0;
    for(let i=0;i<types.length;i++){
      const l=start,r= i===types.length-1?L:start+(weight[i]/sum)*L,w=r-l;start=r;
      const type=types[i],salt=id*7+i,k=type==='stone',shop=type==='shop',corner=type==='corner', color=new T.Color(houseTints[salt%houseTints.length]);
      const floors=annex?2:corner||salt%4===1?3:2, g=shop?3.60:3.12+(salt%3)*.15, upper=2.49+(salt%5)*.11,
        top=g+(floors-1)*upper+.25, depth=6.8+(salt%3)*1.05, face=k?'houseStone':'stucco',front=.022,inner=-.42;
      block(f,l,r,-depth,.075);
      box(f,'stucco',l,r,groundY,top,-depth,inner+.01,color);
      const base=.39, count=Math.max(1,Math.round(w/(shop?2.9:3.05)));
      for(let j=0;j<count;j++){
        const a=l+w*j/count,b=l+w*(j+1)/count,mid=(a+b)*.5,entry=j===(salt%count);
        const half=(b-a)*(entry?.246:shop?.368:.267),lo=mid-half,hi=mid+half;
        const sill=entry?.058:shop?.48:.85, head=entry?2.47:shop?2.72:2.25;
        const lowMat=k?'stone':'base';
        const solid=(p,q)=>{
          box(f,lowMat,p,q,groundY,base+.025,inner,.067,color);
          box(f,face,p,q,base+.025,g,inner,front,color);
        };
        solid(a,lo);solid(hi,b);
        if(sill>base+.035){box(f,lowMat,lo,hi,groundY,base,inner,.067,color);
          box(f,face,lo,hi,base,sill,inner,front,color);}
        box(f,face,lo,hi,head,g,inner,front,color);
        if(entry)door(f,lo,hi,head,'doors');
        else {
          opening(f,shop&&salt%3===1?'litGlass':shop?'shopGlass':'glass',lo,hi,sill,head,-.276,new T.Color(frames[salt%4]));
          box(f,'lintel',lo-.112,hi+.112,sill-.073,sill,inner,.091);
        }
        if(shop){
          box(f,'doors',a+.13,b-.13,2.90,3.14,-.03,.093);
          box(f,'lintel',a+.12,b-.12,3.135,3.18,-.04,.118);
        }
      }
      if(k||corner)box(f,'lintel',l,r,g-.062,g+.064,-.29,.116);
      for(let j=1;j<floors;j++){
        const base=g+(j-1)*upper,ceil=j===floors-1?top:base+upper,
          bays=Math.max(1,Math.round(w/(corner?2.7:2.34))),step=w/bays,
          sill=base+.48,head=base+(k?1.97:1.85);
        box(f,face,l,r,base,sill,inner,front,color);
        box(f,face,l,r,head,ceil,inner,front,color);
        for(let k=0;k<bays;k++){
          const mid=l+(k+.5)*step,half=Math.min(step*.33,corner?.62:.51),u=mid-half,v=mid+half;
          box(f,face,l+k*step,u,sill,head,inner,front,color);
          box(f,face,v,l+(k+1)*step,sill,head,inner,front,color);
          opening(f,(salt+j*11+k*7)%27===0?'litGlass':'glass',u,v,sill,head,-.285,new T.Color(frames[(salt+j+k)%4]));
          box(f,'lintel',u-.09,v+.09,sill-.063,sill,-.24,.11);
          box(f,'lintel',u-.055,v+.055,sill-.09,sill-.063,-.12,.075);
          if(corner||type==='stone'){
            for(const x of [u-.075,v])box(f,'lintel',x,x+.075,sill,head,-.17,.045);
            box(f,'lintel',u-.105,v+.105,head,head+.10,-.168,.066);
          }
          if(type!=='stone'&&!corner&&(salt+j*3+k*5)%11<3){
            const color=new T.Color(['#746654','#637365','#806b5b'][salt%3]);
            for(const x of [u-.25,v])box(f,'doors',x,x+.24,sill+.027,head-.018,-.036,.039,color);
          }
        }
      }
      if(w>3.8){
        const a=corner?r-.24:l+.17;
        box(f,'iron',a,a+.073,.27,top-.15,.054,.124);
        for(const y of [.34,g,top-.42])box(f,'iron',a-.023,a+.095,y,y+.025,.016,.137);
      }
      box(f,'lintel',l,r,top-.172,top-.056,-.26,.159);
      box(f,'lintel',l,r,top-.057,top+.027,-.23,.199);
      box(f,'iron',l,r,top+.025,top+.086,.164,.23);
      const p=f.point,y=top+.063,peak=y+(corner?2.89:1.45+(salt%4)*.37),roof=k?'roof':'tileRoof';
      const a=p(l-.08,y,.22),b=p(r+.08,y,.22),c=p(r+.08,y,-depth-.14),d=p(l-.08,y,-depth-.14),
        hip=corner?w*.20:(type==='plaster'?.17:Math.min(.88,w*.21)),
        e=p(l+hip,peak,-depth*.52),g2=p(r-hip,peak,-depth*.52);
      if(corner){
        const knee=y+(peak-y)*.62,a2=p(l+.17,knee,-depth*.22),b2=p(r-.17,knee,-depth*.22);
        quad(roof,a,b,b2,a2);quad(roof,a2,b2,g2,e);
        quad(roof,d,a,a2,e);quad(roof,b,c,g2,b2);
      }else {quad(roof,a,b,g2,e);quad(roof,d,a,e,e);quad(roof,b,c,g2,g2);}
      quad(roof,c,d,e,g2);
      if(w>6)box(f,'base',l+w*.62,l+w*.62+.47,peak-.64,peak+.48,-depth*.53-1.14,-depth*.53-.59);
    }
    // Lightly raised house apron: same footprint serves the visual floor and
    // player's downward query, with a low stone edge rather than a blocker.
    const p=f.point;
    quad('walk',p(.08,-.014,.01),p(L-.08,-.014,.01),p(L-.08,-.015,1.15),p(.08,-.015,1.15));
    quad('curbstone',p(.08,-.015,1.15),p(L-.08,-.015,1.15),p(L-.08,-.046,1.32),p(.08,-.046,1.32));
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
      house(e,f);
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
    parkPanel({type:wallPanel?'wall':'iron',id:54},f);
    if(f.len>6&&Math.abs(a[0])<57)pier(f,0,.62,2.03);
  }

  const plaza=new T.Mesh(planGeometry(T,CITY_FLOOR,-.046,6,[WC_OUTLINE]),materials.paving.clone());
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
    const walkable=['street','gutter','cushion','curbstone','walk'].includes(m);
    const surf=walkable||m==='verge';
    if(surf)materials[m].side=T.DoubleSide;
    const mesh=new T.Mesh(geo,materials[m]);mesh.name='Einfriedung / '+m;
    mesh.castShadow=!surf;mesh.receiveShadow=true;root.add(mesh);
    if(walkable)walkSurfaces.push(mesh);
  }
  return {floors:[plaza,...walkSurfaces],windows:materials.litGlass};
}
