import {BENCH_ROW, PARK_FLOOR, distanceToPerimeter, insidePerimeter} from './world-layout.js';
import {planGeometry} from './perimeter.js';

// Garden on the east side of the palace. Ground plan in metres, z points west.
export function addGarden(T, scene, world) {
  const group = new T.Group(); group.name = 'Schlossgarten'; scene.add(group);
  const floors = [];
  let seed = 7333;
  const rand = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const range = (a,b) => a+(b-a)*rand(), tau = Math.PI*2;
  const color = v => new T.Color(v);
  const mat = c => new T.MeshStandardMaterial({color:c,roughness:.95});
  const bark = [], leaves=[], blooms=[], herb=[], lumber=[], iron=[], shadows=[];
  const dummy = new T.Object3D();
  function stamp(arr,x,y,z,sx,sy,sz,rx,ry,rz,tint) {
    dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz,'YXZ');
    dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
    arr.push([dummy.matrix.clone(), tint]);
  }
  function instance(list,geo,material,name,casts=false) {
    const batch=new T.InstancedMesh(geo,material,list.length);batch.name=name;
    list.forEach(([mx,tint],i)=>{batch.setMatrixAt(i,mx);if(tint)batch.setColorAt(i,tint);});
    batch.receiveShadow=true;batch.castShadow=casts;group.add(batch);
    batch.computeBoundingSphere();return batch;
  }
  function canvas(size,paint) {
    const el=document.createElement('canvas');el.width=el.height=size;
    paint(el.getContext('2d'),size);
    const tex=new T.CanvasTexture(el);tex.colorSpace=T.SRGBColorSpace;return tex;
  }
  function grassGrain() {
    return canvas(256,(ctx,s)=>{
      ctx.fillStyle='#aebd88';ctx.fillRect(0,0,s,s);
      for(let i=0;i<15000;i++){
        const v=range(80,160)|0;ctx.fillStyle='rgba('+v+','+(v+13)+','+(v-30)+',.45)';
        ctx.fillRect(rand()*s,rand()*s,range(.4,1.4),range(1,3));
      }
    });
  }
  function bedsGround(){
    const tex=grassGrain();tex.wrapS=tex.wrapT=T.RepeatWrapping;
    const m=mat(0xb9bb86);m.map=tex;
    const grass=new T.Mesh(planGeometry(T,PARK_FLOOR,.008,5.05),m);
    grass.receiveShadow=true;group.add(grass);
    floors.push(grass);
  }
  bedsGround();
  const paths=[];
  function ribbon(points,width,y=.064){
    const vv=points.map(([x,z])=>new T.Vector3(x,0,z));
    const curve=new T.CatmullRomCurve3(vv,false,'centripetal');
    const samples=curve.getSpacedPoints(Math.max(2,Math.ceil(curve.getLength()/2)));
    let last;
    for(let i=0;i<samples.length;i++){
      const p=samples[i], v=samples[Math.min(samples.length-1,i+1)].clone().sub(samples[Math.max(0,i-1)]).normalize();
      const d=new T.Vector3(-v.z,0,v.x).multiplyScalar(width*.5);
      const a=p.clone().sub(d),b=p.clone().add(d);a.y=b.y=y;
      if(last) for(const n of [last[0],last[1],a,a,last[1],b]) paths.push(n.x,n.y,n.z);
      last=[a,b];
    }
  }
  ribbon([[0,-85.6],[0,-239],[0,-256.7]],4);
  ribbon([[64.4,-15.8],[65.7,-18.6],[69.5,-23],[74.65,-27.5]],2.25);
  for(const side of [-1,1]){
    const spts = a=>a.map(([x,z])=>[side*x,z]);
    // The side passages join the square without a threshold or a second gate.
    ribbon(spts([[38.5,0.4],[38.3,-10],[37.4,-18],[37,-25]]),3.8);
    ribbon(spts([[13,-55],[25,-62],[38,-73]]),2.5);
    ribbon(spts([[13,-39],[26,-32],[39,-24]]),2.5);
    ribbon(spts([[0,-82],[21,-75],[38,-73]]),2.3);
    ribbon(spts([[37,-25],[38,-73],[38,-128],[39,-196],[48,-239]]),3.7);
    ribbon(spts([[0,-133],[12,-130],[24,-126],[38,-128],[58,-140]]),3);
    ribbon(spts([[0,-211],[17,-199],[36,-185],[53,-172],[64,-151]]),2.9);
    ribbon(spts([[0,-239],[23,-243],[49,-236],[62,-215],[65,-170],[59,-121],[59,-82],[52,-61],[38,-47]]),3.0);
  }
  const ellipse=[];for(let j=0;j<=64;j++){const a=tau*j/64;ellipse.push([18.8*Math.cos(a),-47+13.45*Math.sin(a)]);}
  ribbon(ellipse,2.1);
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(paths,3));pg.computeVertexNormals();
  const grit=mat(0xc7b692);grit.side=T.DoubleSide;
  const lanes=new T.Mesh(pg,grit);lanes.receiveShadow=true;group.add(lanes);
  floors.push(lanes);
  // A cutout spray is made of individual, overlapping leaves with lit tips.
  const spray=canvas(160,(ctx,s)=>{
    const dots=[];
    for(let l=0;l<19;l++){
      const a=rand()*tau,r=Math.sqrt(rand())*.32;
      const x=.5+Math.cos(a)*r,z=.52+Math.sin(a)*r;
      for(let j=0;j<53;j++){
        const t=rand()*tau,u=Math.sqrt(rand())*range(.065,.16);
        dots.push([x+u*Math.cos(t),z+u*Math.sin(t),range(1.2,3.9)]);
      }
    }
    dots.sort((a,b)=>b[1]-a[1]);
    for(const [x,y,r] of dots){
      let lum=range(26,69)+(1-y)*18;
      ctx.fillStyle='hsl('+range(55,90)+' 32% '+lum+'%)';
      ctx.beginPath();ctx.ellipse(x*s,y*s,r*1.45,r*.76,range(-1,1),0,tau);ctx.fill();
    }
  });
  const shadow=canvas(80,(ctx,s)=>{
    let g=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    g.addColorStop(0,'rgba(38,41,20,.72)');g.addColorStop(.6,'rgba(50,54,33,.51)');g.addColorStop(1,'rgba(45,52,33,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,s,s);
  });
  function limb(x,y,z,xx,yy,zz,r){
    const a=new T.Vector3(x,y,z),b=new T.Vector3(xx,yy,zz);
    dummy.position.copy(a).lerp(b,.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());
    dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();bark.push([dummy.matrix.clone(),undefined]);
  }
  function tree(x,z,h){
    if(x>18 && x<72 && z<-7 && z>-91) return;
    if(!insidePerimeter(x,z)||distanceToPerimeter(x,z)<2.7||(z<-228&&Math.abs(x)<3.2)) return;
    const radius=h*range(.26,.34),baseH=h*range(.32,.42);
    const green=new T.Color().setHSL(range(.205,.275),range(.32,.56),range(.21,.34),T.SRGBColorSpace);
    const dx=range(-.45,.45),dz=range(-.45,.45);
    limb(x,0,z,x+dx,baseH,z+dz,h*.025);
    world.circle(x,z,h*.025);
    stamp(shadows,x,.087,z,radius*2.9,radius*2.45,1,-Math.PI*.5,0,0,null);
    for(let k=0;k<6;k++){
      let a=k*tau/6+range(-.3,.3),r=radius*range(.48,.82);
      limb(x+dx,baseH-.8,z+dz,x+r*Math.cos(a),h*range(.56,.71),z+r*Math.sin(a),h*.012);
    }
    for(let i=0;i<31;i++){
      let y=range(-.87,.96),a=rand()*tau,r=radius*Math.sqrt(1-y*y)*range(.35,.97);
      let w=radius*range(.95,1.5),dy=h*(.68+y*.24);
      let tint=green.clone().multiplyScalar(.81+(.5+.5*y)*.53+range(-.08,.08));
      stamp(leaves,x+r*Math.cos(a),dy,z+r*Math.sin(a),w,w*range(.78,1.12),1,range(-.78,.78),rand()*tau,range(-.3,.3),tint);
    }
  }
  for(const side of [-1,1]){
    for(let i=0;i<16;i++) tree(side*(42+range(-2,2)), -27-i*14+range(-1,1),range(11.8,17));
    for(let i=0;i<13;i++) tree(side*(58+range(-7,7)), -52-i*15+range(-5,5),range(12,20));
    for(let i=0;i<10;i++) tree(side*(24+range(-7,7)), -105-i*14+range(-4,4),range(11.5,18));
  }
  for(let i=0;i<11;i++)tree(-57+i*11+range(-2,2),-246+range(-8,6),range(12,18));
  const leafM=new T.MeshLambertMaterial({map:spray,color:0xffffff,alphaTest:.47,side:T.DoubleSide});
  instance(leaves,new T.PlaneGeometry(1,1),leafM,'Laub');
  instance(bark,new T.CylinderGeometry(.54,1,1,7),mat(0x645649),'Stämme',true);
  const shadowM=new T.MeshBasicMaterial({map:shadow,depthWrite:false,transparent:true,opacity:.48});
  instance(shadows,new T.PlaneGeometry(1,1),shadowM,'Kronenschatten');
  const palette=['#b64f77','#d89ca2','#ede1bd','#a297ce','#885586'].map(color);
  function flowers(x,z,hue){
    const s=range(.10,.22);
    stamp(herb,x,.17,z,s*1.4,s*.68,s*1.37,0,rand()*tau,0,color('#567144'));
    stamp(blooms,x,.17+s*.46,z,s*.78,s*.44,s*.73,0,rand()*tau,0,palette[hue]);
  }
  for(let i=0;i<2800;i++){
    const a=rand()*tau,r=rand();
    flowers(Math.cos(a)*(15.52+r*1.91),-47+Math.sin(a)*(10.37+r*1.77),Math.floor((a/tau*22+r*.37))%5);
  }
  instance(herb,new T.IcosahedronGeometry(1,0),mat(0xffffff),'Blattschöpfe');
  instance(blooms,new T.IcosahedronGeometry(1,0),mat(0xffffff),'Wechselflor');
  // Benches face the lawn and give the plaza a human scale.
  for(const side of [-1,1])for(const z of BENCH_ROW.depths){
    const x=side*BENCH_ROW.x;
    world.box(Math.min(x-side*.05,x+side*.42),z-.91,Math.max(x-side*.05,x+side*.42),z+.91);
    for(let k=0;k<4;k++)stamp(lumber,x+side*k*.105,.47,z,.088,.057,1.82,0,0,0,null);
    for(let k=0;k<3;k++)stamp(lumber,x+side*(.35+k*.014),.69+k*.12,z,.056,.087,1.82,0,0,0,null);
    for(const offset of [-.68,.68]){
      stamp(iron,x,.245,z+offset,.055,.47,.069,0,0,0,null);
      stamp(iron,x+side*.34,.48,z+offset,.055,.90,.069,0,0,0,null);
    }
  }
  instance(lumber,new T.BoxGeometry(1,1,1),mat(0x897046),'Sitzbänke');
  instance(iron,new T.BoxGeometry(1,1,1),mat(0x40453f),'Bankgestelle');
  orangery(T,group,world);
  return floors;
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
  function arch(x0,x1,y0,bottom,fill){
    c.beginPath();c.moveTo(x0,bottom);c.lineTo(x0,y0);c.arc((x0+x1)/2,y0,(x1-x0)/2,Math.PI,2*Math.PI);c.lineTo(x1,bottom);c.closePath();c.fillStyle=fill;c.fill();
  }
  arch(33,223,149,343,'#9b7b54');arch(35,220,145,339,'#efce99');
  const gradient=c.createLinearGradient(0,65,0,337);gradient.addColorStop(0,'#829797');gradient.addColorStop(.33,'#4d6260');gradient.addColorStop(.55,'#6b765c');gradient.addColorStop(1,'#303e39');
  arch(46,209,147,333,gradient);c.strokeStyle='#c4baa3';c.lineWidth=4;
  for(const dx of [-54,-27,0,27,54]){c.beginPath();c.moveTo(128+dx,146);c.lineTo(128+dx,331);c.stroke();}
  for(const y of [147,184,222,261,298]){c.beginPath();c.moveTo(46,y);c.lineTo(209,y);c.stroke();}
  for(let i=1;i<8;i++){let a=Math.PI+i*Math.PI/8;c.beginPath();c.moveTo(128,147);c.lineTo(128+80*Math.cos(a),147+80*Math.sin(a));c.stroke();}
  c.fillStyle='#f6dcb0';c.fillRect(26,337,204,5);c.fillRect(0,12,256,5);c.fillRect(0,20,256,4);
  c.fillStyle='#9f845f';c.fillRect(0,366,256,18);c.fillStyle='#f3d4a4';c.fillRect(0,363,256,4);
  const m=(v)=>new T.MeshStandardMaterial({color:v,roughness:.93,side:T.DoubleSide});
  const mats=[m(0xe7c28b),m(0xffffff),m(0x91523b),m(0xecd2ab),m(0x797157)];
  const win=new T.CanvasTexture(el);win.colorSpace=T.SRGBColorSpace;win.anisotropy=4;mats[1].map=win;
  const buffers=mats.map(()=>({xyz:[],uv:[]}));
  function face(idx,a,b,d,e){
    const f=buffers[idx];for(const p of [a,b,d,a,d,e])f.xyz.push(...p);
    f.uv.push(0,0,1,0,1,1,0,0,1,1,0,1);
  }
  function span(a,b,h,roof,dep=7.8,central=false){
    // a,b progress along z. Left normal faces south toward the fountain.
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const nx=dz/len,nz=-dx/len;
    const P=(p,y,off,along=0)=>[p[0]+off*nx+along*dx/len,y,p[1]+off*nz+along*dz/len];
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
    face(3,[55.1,7.50,a],[55.1,8.25,b],[55.1,8.54,b],[55.1,7.79,a]);
  }
  for(let i=0;i<buffers.length;i++){
    const {xyz,uv}=buffers[i];if(!xyz.length)continue;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const obj=new T.Mesh(geo,mats[i]);obj.name='Orangerie';obj.castShadow=true;obj.receiveShadow=true;group.add(obj);
  }
}
