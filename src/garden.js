import {BENCH_ROW, PARK_FLOOR, PERIMETER, GARDEN_GATES, distanceToPerimeter, insidePerimeter} from './world-layout.js';
import {gardenMaterials,repeatSet,sharedSet} from './surface-detail.js';
import {BED_ARCS,atBed,addBeds,addBenches} from './garden-assets.js';
import {plantGarden} from './vegetation.js';
import {pathNetwork,gardenTerrain} from './garden-ground.js';
import {planGeometry} from './perimeter.js';

// Garden on the east side of the palace. Ground plan in metres, z points west.
export function addGarden(T, scene, world, oldGravel) {
  const group = new T.Group(); group.name = 'Schlossgarten'; scene.add(group);
  const floors = [];
  let seed = 7333;
  const rand = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const range = (a,b) => a+(b-a)*rand(), tau = Math.PI*2;
  const network=pathNetwork(T),ribbon=network.add;
  ribbon([[0,-13.8],[0,-33.0]],4.9,'compact');
  ribbon([[0,-61],[0,-156],[0,-237]],4);
  ribbon([[39,-7.4],[38.8,-17],[37,-25]],3.5,'compact');
  ribbon([[-39.35,-7.5],[-38.2,-17],[-37,-25]],3.65,'compact');
  ribbon([[46.3,-15.8],[46.15,-19.8],[44.8,-25],[40.7,-28]],2.5,'compact');
  for(const gate of Object.values(GARDEN_GATES))ribbon(gate.path,2.4,'compact');
  for(const side of [-1,1]){
    const spts = a=>a.map(([x,z])=>[side*x,z]);
    ribbon(spts([[13,-55],[25,-62],[38,-73]]),2.5);
    ribbon(spts([[13,-39],[26,-32],[39,-24]]),2.5);
    ribbon(spts([[0,-82],[21,-75],[38,-73]]),2.3);
    ribbon(spts([[37,-25],[38,-73],[38,-128],[39,-196],[48,-239]]),3.7);
    ribbon(spts([[0,-133],[12,-130],[24,-126],[38,-128],[58,-140]]),3);
    ribbon(spts([[0,-211],[17,-199],[36,-185],[53,-172],[64,-151]]),2.9);
    ribbon(spts([[0,-239],[23,-243],[49,-236],[62,-215],[65,-170],[59,-121],[59,-82],[52,-61],[38,-47]]),3.0);
  }
  const ellipse=[];for(let j=0;j<=64;j++){const a=tau*j/64;ellipse.push([18.8*Math.cos(a),-47+13.45*Math.sin(a)]);}
  ribbon(ellipse,2.1,'trim');
  const {ground,gravel}=gardenMaterials(T,network.texture({
    legacy:oldGravel,walls:PERIMETER.filter(e=>e.type==='wall'),beds:BED_ARCS
  }),network.rect);
  const terrain=gardenTerrain(T,PARK_FLOOR,ground);
  group.add(...terrain.meshes);floors.push(...terrain.meshes);
  // Paved-to-gravel transition at both Schlossplatz gates and the side entry.
  for(const [x,front,wide] of [[39,1,1.75],[-39.35,1,1.87],[46.25,-4,1.18]]){
    const apron=new T.Mesh(planGeometry(T,[[x-wide,front],[x+wide,front],[x+wide,-17.025],[x-wide,-17.025]],-.017,1),gravel);
    apron.name='Weganschluss • Tordurchgang';apron.receiveShadow=true;group.add(apron);floors.push(apron);
  }
  const sites=[];
  function tree(x,z,h,species,hero){
    if(z>-7 || (x>18&&x<73&&z>-92))return;
    if(!insidePerimeter(x,z)||distanceToPerimeter(x,z)<3.5||network.edge(x,z)<1.02)return;
    if(Math.abs(x)<23&&z>-78)return;
    if(sites.some(p=>Math.hypot(x-p.x,z-p.z)<4.4))return;
    sites.push({x,z,h,species,hero});
  }
  // Keep the formal parterre and central sightline open; open lawn between
  // irregular groups is as important as the planting itself.
  tree(-27.6,-68.3,17.5,'oak','sweep');
  tree(27.5,-96.5,16.7,'lime','spire');
  tree(-28.0,-118.0,15.8,'oak','fork');
  for(const side of [-1,1]){
    for(let i=0;i<15;i++)tree(side*(43.4+range(-2.9,3.4)), -28-i*14.7+range(-1.7,1.7),range(11.5,16.6),i%4?'lime':'oak');
    for(let i=0;i<13;i++)tree(side*(62.1+range(-6.2,6.7)), -48-i*15.7+range(-5.8,5.8),range(13.2,20.1),i%3?'oak':'lime');
    for(let i=0;i<10;i++)tree(side*(25+range(-7.0,7.5)), -104-i*14.1+range(-5.7,5.7),range(10.1,18.5),i%4?'oak':'lime');
  }
  for(let i=0;i<10;i++)tree(-59+i*12.6+range(-3,3),-245+range(-6,5),range(12.0,17.1),i%3?'lime':'oak');
  // Faint, planted silhouettes beyond the fence, never another playable park.
  for(const e of PERIMETER){
    if(!['wall','iron','parkGate'].includes(e.type))continue;
    const dx=e.b[0]-e.a[0],dz=e.b[1]-e.a[1],len=Math.hypot(dx,dz);
    const n=Math.floor(len/11.8);
    for(let i=0;i<n;i++){
      const t=(i+.5)/n,dist=range(8,15),x=e.a[0]+dx*t+dz/len*dist,z=e.a[1]+dz*t-dx/len*dist;
      if(!insidePerimeter(x,z))sites.push({x,z,h:range(7.4,13.7),species:i%3?'oak':'lime',backdrop:true});
    }
  }
  const plants=plantGarden(T,group,world,sites,(x,z)=>{
    if(z>-17.35||!insidePerimeter(x,z)||x>43&&x<69&&z>-91)return 0;
    if(Math.abs(x)<23&&z>-72||atBed(x,z,.25))return 0;
    if(BENCH_ROW.depths.some(d=>Math.abs(z-d)<1.18)&&Math.abs(Math.abs(x)-BENCH_ROW.x)<1)return 0;
    const {edge,style}=network.sample(x,z);
    if(edge<(style==='trim'?.12:.25))return 0;
    const patch=.5+.5*Math.sin(x*.53+Math.cos(z*.37)*1.5)*Math.cos(z*.39);
    const wall=z<-247||Math.abs(x)>68?distanceToPerimeter(x,z):8;
    const sheltered=sites.some(p=>!p.backdrop&&Math.abs(x-p.x)<4.8&&Math.abs(z-p.z)<4.8);
    return (edge<1.17?(style==='compact'?.09:style==='trim'?.35:.26)+patch*.25:.038+patch*.105)
       *(wall<1.4?.65:1)*(sheltered?1.22:1);
  },terrain.height);
  const beds=addBeds(T,group,terrain.height);
  addBenches(T,group,world,terrain.height);
  orangery(T,group,world);
  return {
    floors, heightAt:(x,z)=>z<=-17&&insidePerimeter(x,z)?terrain.height(x,z):null,
    update:position=>{plants(position);beds(position)}
  };
}

// FAU's description records a three-bay hall, two curving seven-bay wings,
// a mansard and five-bay end faces. Dimensions here are visually approximated.
function orangery(T,group,world){
  const el=document.createElement('canvas');el.width=256;el.height=384;
  const c=el.getContext('2d');
  c.fillStyle='#d6ad72';c.fillRect(0,0,256,384);
  // Fine ochre plaster grain and cut-stone window surrounds.
  let seed=317;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<9500;i++){c.fillStyle=random()<.5?'rgba(94,58,27,.075)':'rgba(255,240,208,.15)';c.fillRect(random()*256,random()*384,random()*2+.3,1.2);}
  function arch(x0,x1,y0,bottom,fill,ctx=c){
    ctx.beginPath();ctx.moveTo(x0,bottom);ctx.lineTo(x0,y0);ctx.arc((x0+x1)/2,y0,(x1-x0)/2,Math.PI,2*Math.PI);ctx.lineTo(x1,bottom);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  }
  arch(33,223,149,343,'#9b7b54');arch(35,220,145,339,'#efce99');
  arch(46,209,147,333,'#35484a');c.strokeStyle='#c4baa3';c.lineWidth=4;
  for(const dx of [-54,-27,0,27,54]){c.beginPath();c.moveTo(128+dx,146);c.lineTo(128+dx,331);c.stroke();}
  for(const y of [147,184,222,261,298]){c.beginPath();c.moveTo(46,y);c.lineTo(209,y);c.stroke();}
  for(let i=1;i<8;i++){let a=Math.PI+i*Math.PI/8;c.beginPath();c.moveTo(128,147);c.lineTo(128+80*Math.cos(a),147+80*Math.sin(a));c.stroke();}
  c.fillStyle='#f6dcb0';c.fillRect(26,337,204,5);c.fillRect(0,12,256,5);c.fillRect(0,20,256,4);
  c.fillStyle='#9f845f';c.fillRect(0,366,256,18);c.fillStyle='#f3d4a4';c.fillRect(0,363,256,4);
  const m=(v)=>new T.MeshStandardMaterial({color:v,roughness:.93,side:T.DoubleSide});
  const mats=[m(0xc9ac81),m(0xffffff),m(0xd4b3a6),m(0xe2c79d),m(0x797157)];
  Object.assign(mats[0],sharedSet(T,'plaster',512));mats[0].normalScale.setScalar(.35);
  Object.assign(mats[2],repeatSet(T,'tile',512));mats[2].normalScale.setScalar(.54);
  const win=new T.CanvasTexture(el);win.colorSpace=T.SRGBColorSpace;win.anisotropy=4;mats[1].map=win;
  const mask=document.createElement('canvas');mask.width=el.width;mask.height=el.height;
  const mc=mask.getContext('2d');mc.fillStyle='#ededed';mc.fillRect(0,0,mask.width,mask.height);
  arch(48,207,147,332,'#646464',mc);
  mc.strokeStyle='#d8d8d8';mc.lineWidth=4;
  for(const x of [74,101,128,155,182]){mc.beginPath();mc.moveTo(x,147);mc.lineTo(x,332);mc.stroke()}
  for(const y of [147,184,222,261,298]){mc.beginPath();mc.moveTo(47,y);mc.lineTo(208,y);mc.stroke()}
  mats[1].roughnessMap=new T.CanvasTexture(mask);mats[1].roughness=1;mats[1].envMapIntensity=.76;
  const buffers=mats.map(()=>({xyz:[],uv:[]}));
  function face(idx,a,b,d,e){
    const f=buffers[idx];for(const p of [a,b,d,a,d,e])f.xyz.push(...p);
    const size=idx===2?1.61:1.65;
    const u=idx===1?1:Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])/size;
    const v=idx===1?1:Math.hypot(e[0]-a[0],e[1]-a[1],e[2]-a[2])/size;
    f.uv.push(0,0,u,0,u,v,0,0,u,v,0,v);
  }
  function span(a,b,h,roof,dep=7.8,central=false){
    // a,b progress along z. Left normal faces south toward the fountain.
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const nx=dz/len,nz=-dx/len;
    const P=(p,y,off,along=0)=>[p[0]+3.6+off*nx+along*dx/len,y,p[1]+off*nz+along*dz/len];
    world.polygon([P(a,0,-.12),P(b,0,-.12),P(b,0,dep),P(a,0,dep)].map(([x,,z])=>[x,z]));
    // Front/window tangent, rear wall, hip transition, central roof ridge.
    face(1,P(a,0,0),P(b,0,0),P(b,h,0),P(a,h,0));
    face(0,P(b,0,dep),P(a,0,dep),P(a,h,dep),P(b,h,dep));
    for(const p of [a,b]){
      face(0,P(p,0,0),P(p,0,dep),P(p,h,dep),P(p,h,0));
      face(2,P(p,h,0),P(p,h,dep),P(p,h+roof,dep*.60),P(p,h+roof,dep*.40));
    }
    const brim=central?.39:.23;
    for(const side of [0,dep]){
      const over=side===0?-brim:brim;
      face(3,P(a,h-.2,side+over),P(b,h-.2,side+over),P(b,h+.17,side+over),P(a,h+.17,side+over));
      const knee=side===0?dep*.21:dep*.79, ridge=side===0?dep*.4:dep*.6;
      face(2,P(a,h+.17,side+over),P(b,h+.17,side+over),P(b,h+roof*.77,knee),P(a,h+roof*.77,knee));
      face(2,P(a,h+roof*.77,knee),P(b,h+roof*.77,knee),P(b,h+roof,ridge),P(a,h+roof,ridge));
    }
    face(2,P(a,h+roof,dep*.4),P(b,h+roof,dep*.4),P(b,h+roof,dep*.6),P(a,h+roof,dep*.6));
    for(const y of [.35,h-.43]){
      face(3,P(a,y,-.09),P(b,y,-.09),P(b,y+.10,-.09),P(a,y+.10,-.09));
    }
    const pilasterW=central?.32:.16;
    for(const p of [a,b])face(3,P(p,.28,-.12,-pilasterW),P(p,.28,-.12,pilasterW),P(p,h-.19,-.12,pilasterW),P(p,h-.19,-.12,-pilasterW));
  }
  const mid=-47;
  for(let j=0;j<3;j++)span([55.5,mid-6+j*4],[55.5,mid-2+j*4],8.4,3.7,10,true);
  for(const side of [-1,1]){
    const q=t=>[56.4-17*(1-Math.cos(1.20*t)),mid+side*(6+24*Math.sin(t*1.2))];
    for(let j=0;j<7;j++){
      const ends=[q(j/7),q((j+1)/7)].sort((a,b)=>a[1]-b[1]);span(ends[0],ends[1],6.35,2.15);
    }
    const end=q(1);
    for(let j=0;j<5;j++){
      const z=end[1]+side*j*1.55, zz=z+side*1.55;
      span([end[0]-.26,Math.min(z,zz)],[end[0]-.26,Math.max(z,zz)],7.15,2.7,8.6);
    }
  }
  // Two carved fragments of the broken pediment over the central portal.
  for(const side of [-1,1]){
    const a=mid+side*2.6,b=mid+side*.46;
    face(3,[58.7,7.50,a],[58.7,8.25,b],[58.7,8.54,b],[58.7,7.79,a]);
  }
  for(let i=0;i<buffers.length;i++){
    const {xyz,uv}=buffers[i];if(!xyz.length)continue;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const obj=new T.Mesh(geo,mats[i]);obj.name='Orangerie';obj.castShadow=true;obj.receiveShadow=true;group.add(obj);
  }
}
