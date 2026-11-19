import {HALL,WINGS} from './palace-openings.js';
import {sharedSet,randomSource} from './surface-detail.js';

const Y=HALL.floor,pi=Math.PI;
function painted(T,w,h,paint){
  const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
function dust(c,w,h,r,count,ink){
  c.fillStyle=ink;
  for(let i=0;i<count;i++)c.fillRect(r()*w,r()*h,.54+r()*2.15,.38+r()*1.48);
}
const rect=(c,x,y,w,h,ink)=>{c.fillStyle=ink;c.fillRect(x,y,w,h);};
function lozenge(c,x,y,w,h,ink,stroke=null){
  c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w,y);c.lineTo(x,y+h);c.lineTo(x-w,y);c.closePath();
  if(ink){c.fillStyle=ink;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.stroke();}
}
function floral(c,x,y,k,gold,shade){
  c.save();c.translate(x,y);c.scale(k,k);
  c.strokeStyle=gold;c.lineWidth=1.5;
  for(let i=0;i<8;i++){
    c.save();c.rotate(pi*i/4);c.beginPath();c.moveTo(0,-8);
    c.bezierCurveTo(-14,-22,-9,-39,0,-51);
    c.bezierCurveTo(10,-39,15,-22,0,-8);c.stroke();
    c.beginPath();c.moveTo(0,-13);c.quadraticCurveTo(4,-27,0,-44);c.stroke();
    c.beginPath();c.moveTo(0,-46);c.quadraticCurveTo(-28,-57,-20,-68);c.stroke();
    c.restore();
  }
  lozenge(c,0,0,7.5,7.5,shade,gold);
  c.restore();
}
function damask(T){
  const t=painted(T,256,256,(c,w,h)=>{
    rect(c,0,0,w,h,'#7d4f49');
    for(const [x,y,k] of [[128,128,1.26],[0,0,.72],[256,0,.72],[0,256,.72],[256,256,.72]]){
      floral(c,x,y,k,'#9c6c5b','#946354');
    }
    for(const [x,y] of [[128,0],[0,128],[128,256],[256,128]])
      lozenge(c,x,y,24,39,null,'#865850');
    dust(c,w,h,randomSource(397),3400,'#f2d4b51f');
  });
  t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2.18,2.18);return t;
}
function runnerMap(T,rear){
  const t=painted(T,512,512,(c,w,h)=>{
    const warm=rear?'#623d42':'#77463b',edge=rear?'#50353b':'#603832',gold='#b89669',ink='#d0ad7c',cool='#514f47';
    rect(c,0,0,w,h,edge);rect(c,76,0,w-152,h,warm);
    for(const x of [8,20,62,73,83,w-9,w-21,w-63,w-74,w-84])rect(c,x,0,2,h,gold);
    for(let j=-1;j<=8;j++){
      const y=j*64+17;
      for(const x of [41,w-41]){
        lozenge(c,x,y,14,19,cool,gold);lozenge(c,x,y,5,7,ink);
      }
    }
    for(const y of [0,256,512]){
      lozenge(c,256,y,139,113,cool,gold);lozenge(c,256,y,122,98,warm,ink);
      floral(c,256,y,1.30,ink,edge);
      for(const x of [114,398])lozenge(c,x,y+123,9,15,null,gold);
    }
    for(let j=0;j<h;j+=3)rect(c,0,j,w,1,j%2?'#261e1a12':'#edd5b313');
    const r=randomSource(rear?6591:5388);
    dust(c,w,h,r,6600,'#291b1832');dust(c,w,h,r,6700,'#eedbb327');
  });
  t.wrapT=T.RepeatWrapping;return t;
}

export function gallerySurfaces(T){
  const stone=sharedSet(T,'galleryStone',256),lime=sharedSet(T,'galleryLime',256),fabric=sharedSet(T,'canvas',128);
  const m=(c,rough,map,s)=>new T.MeshStandardMaterial({color:c,...map,roughness:rough,normalScale:new T.Vector2(s,s)});
  return {
    galleryLime:m(0xd9c9b3,.94,lime,.32),galleryRoof:m(0xe3d8c0,.96,lime,.27),
    galleryBand:m(0xd5c3a6,.89,stone,.39),galleryCut:m(0xcbb491,.87,stone,.47),
    galleryCutShade:m(0xbda88e,.91,stone,.40),galleryGrout:m(0x85786b,.98,lime,.22),
    galleryCream:m(0xd6c8af,.84,stone,.42),galleryDove:m(0xafaa9d,.86,stone,.44),
    galleryIvory:m(0xcbbfa8,.86,stone,.40),galleryGrey:m(0xbdb3a0,.85,stone,.40),
    galleryInlay:m(0x9d8061,.81,stone,.39),galleryCloth:m(0xffffff,.95,{...fabric,map:damask(T)},.28),
    galleryFray:m(0xa38662,.99,fabric,.23),galleryThread:m(0x74594c,.99,fabric,.21),
    galleryRunnerA:m(0xffffff,.97,{...fabric,map:runnerMap(T,false)},.28),
    galleryRunnerB:m(0xffffff,.97,{...fabric,map:runnerMap(T,true)},.28)
  };
}

// One owner for each surface. The plaster skins stop at the arch cut.
// The stones, not a second wall box, own the opening-facing jamb planes.
export function southGalleryArch(k,p,span,top,{half=1.53,thickness=.28}={}){
  const {spring,rise}=WINGS,relief=.062,depth=[-thickness-relief,relief],rim=.215;
  function face(m,a,b,c,d,flip){
    const A=p(...a),B=p(...b),C=p(...c),D=p(...d),uv=(v)=>[v[0]/1.40,v[1]/1.40];
    const q=(x,y,z,U,V,W)=>k.triangle(m,x,y,z,[...uv(U),...uv(V),...uv(W)]);
    if(flip){q(B,A,D,b,a,d);q(B,D,C,b,d,c);}
    else{q(A,B,C,a,b,c);q(A,C,D,a,c,d);}
  }
  for(const [d,rev] of [[0,false],[-thickness,true]]){
    for(const [l,r] of [[-span-.007,-half],[half,span+.007]])
      face('galleryLime',[l,Y,d],[r,Y,d],[r,top,d],[l,top,d],rev);
    for(let i=0;i<36;i++){
      const a=i*pi/36,b=(i+1)*pi/36,u=-Math.cos(a)*half,v=-Math.cos(b)*half;
      face('galleryLime',[u,spring+Math.sin(a)*rise,d],[v,spring+Math.sin(b)*rise,d],[v,top,d],[u,top,d],rev);
    }
    for(const [l,r] of [[-span,-half-rim-.055],[half+rim+.055,span]]){
      const [a,b]=rev?[d-.040,d-.004]:[d+.004,d+.040];
      k.box('galleryBand',p,l,r,Y+.008,.195,a,b);
      k.box('galleryCut',p,l,r,.192,.215,rev?a-.014:a,rev?b:b+.014);
      k.box('galleryBand',p,l,r,top-.133,top-.084,rev?a-.029:a,rev?b:b+.029);
    }
  }
  const steps=[Y,.283,.646,1.015,1.373,1.725,2.081,spring],gr=.006;
  for(const side of [-1,1]){
    // Slight inset in the mortar seams lets the joints read at close range.
    const a=side*half,b=a+side*.011;
    const sideFace=[p(b,Y,depth[0]),p(b,spring,depth[0]),p(b,spring,depth[1]),p(b,Y,depth[1])];
    if(side<0)k.quad('galleryGrout',...sideFace);else k.quad('galleryGrout',...sideFace.reverse());
    for(let i=0;i<steps.length-1;i++){
      const l=a+side*(i===0?-.014:0),r=a+side*(i===0?rim+.04:rim-(i%2)*.012);
      const front=depth[1]+(i===0?.028:i===steps.length-2?.027:0),back=depth[0]-(front-depth[1]);
      k.box(i%3===1?'galleryCutShade':'galleryCut',p,Math.min(l,r),Math.max(l,r),
        steps[i]+(i===0?0:gr),steps[i+1]-gr,back,front);
    }
  }
  const C=(a,offset,d)=>p(-Math.cos(a)*(half+offset),spring+Math.sin(a)*(rise+offset),d);
  for(let i=0;i<14;i++){
    const A=i*pi/14,B=(i+1)*pi/14,u=A+.006,v=B-.006,style=i%4===1?'galleryCutShade':'galleryCut';
    for(const [a,b,m] of [[A,u,'galleryGrout'],[u,v,style],[v,B,'galleryGrout']]){
      // The full-depth soffit is a single strip, with no hidden box below it.
      k.quad(m,C(a,0,depth[0]),C(b,0,depth[0]),C(b,0,depth[1]),C(a,0,depth[1]),1.34);
      k.quad(m,C(a,0,depth[1]),C(b,0,depth[1]),C(b,rim,depth[1]),C(a,rim,depth[1]),1.34);
      k.quad(m,C(b,0,depth[0]),C(a,0,depth[0]),C(a,rim,depth[0]),C(b,rim,depth[0]),1.34);
      k.quad(m,C(a,rim,depth[1]),C(b,rim,depth[1]),C(b,rim,0),C(a,rim,0),1.34);
      k.quad(m,C(b,rim,depth[0]),C(a,rim,depth[0]),C(a,rim,-thickness),C(b,rim,-thickness),1.34);
    }
  }
}

export function galleryCeiling(k,box){
  const y=WINGS.ceiling,u=[[4.58,8.18],[8.42,12.24],[12.91,16.45],[16.68,20.58],[20.83,24.77],[25.01,28.53]];
  for(const [l,r] of u){
    const D=5.78;
    box('galleryBand',l,r,y-.047,y-.016,-D,D);
    box('galleryRoof',l+.114,r-.114,y-.055,y-.046,-D+.13,D-.13);
    for(const z of [-D+.028,D-.082]){
      box('galleryCut',l+.058,r-.059,y-.086,y-.043,z,z+.053);
      const a=z+(z<0?.080:-.080);
      box('galleryInlay',l+.13,r-.13,y-.064,y-.055,a,a+.018);
    }
    for(const x of [l+.057,r-.107])box('galleryCut',x,x+.051,y-.085,y-.042,-D+.085,D-.081);
    const c=(l+r)*.5,base=(a,r)=>[c+Math.cos(a)*r,y-.089,Math.sin(a)*r];
    for(let j=0;j<12;j++){
      const a=2*j*pi/12,b=2*(j+1)*pi/12;
      k.quad('galleryCutShade',base(b,.225),base(a,.225),base(a,.316),base(b,.316));
    }
    box('galleryBand',c-.108,c+.108,y-.099,y-.048,-.111,.111);
  }
}

export function galleryPrints(T,root,box){
  const map=painted(T,1024,512,(c)=>{
    for(const [i,title] of ['HIMMEL UND MASS','NATURALIENBUCH'].entries()){
      c.save();c.translate(i*512,0);rect(c,0,0,512,512,'#bfa585');
      rect(c,26,26,460,460,'#d9c7a5');
      c.strokeStyle='#9d8767';c.lineWidth=2;c.strokeRect(36,37,440,437);c.strokeRect(43,44,426,424);
      c.strokeStyle='#735b46';c.fillStyle='#6d5842';
      if(i===0){
        for(const [rx,ry,a] of [[125,125,0],[124,51,.43],[126,54,-.61],[116,37,-.05],[61,119,.61]]){
          c.beginPath();c.ellipse(256,232,rx,ry,a,0,pi*2);c.stroke();
        }
        c.beginPath();c.moveTo(203,98);c.lineTo(309,369);c.stroke();
        for(let j=0;j<48;j++){
          const a=j*pi/24;
          c.beginPath();c.moveTo(256+Math.cos(a)*136,232+Math.sin(a)*136);
          c.lineTo(256+Math.cos(a)*(j%4===0?145:140),232+Math.sin(a)*(j%4===0?145:140));c.stroke();
        }
        lozenge(c,256,232,8,8,'#735b46');
      }else{
        const g=[[178,341],[198,218],[220,170],[251,214],[267,333],[222,362]];
        c.beginPath();g.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke();
        for(const [x,y,K] of [[231,331,.92],[291,331,.63],[311,352,.52],[194,343,.49]]){
          c.beginPath();c.moveTo(x,y);c.lineTo(x+9*K,y-91*K);c.lineTo(x+39*K,y-119*K);
          c.lineTo(x+68*K,y-92*K);c.lineTo(x+74*K,y-10*K);c.lineTo(x+38*K,y+8*K);
          c.closePath();c.stroke();
          c.beginPath();c.moveTo(x+39*K,y-119*K);c.lineTo(x+37*K,y+7*K);
          c.moveTo(x+10*K,y-90*K);c.lineTo(x+37*K,y-67*K);c.lineTo(x+67*K,y-91*K);c.stroke();
        }
      }
      c.font='bold 29px Georgia';c.textAlign='center';c.fillText(title,256,418);
      c.font='19px monospace';c.fillText(i===0?'TABULA I · LEHRSTÜCK':'TABULA V · STUDIENBLATT',256,449);
      dust(c,512,512,randomSource(421+i),4800,'#76563e24');c.restore();
    }
  });
  const mat=new T.MeshStandardMaterial({map,roughness:.91,emissive:0x5d4c34,emissiveMap:map,emissiveIntensity:.16});
  for(const [i,[x,side]] of [[6.61,-1],[21.65,1]].entries()){
    const d=side*(WINGS.z-.079),y=2.436,w=.894,h=1.073;
    const depth=(a,b)=>[Math.min(d+side*a,d+side*b),Math.max(d+side*a,d+side*b)];
    box('darkWood',x-w/2-.05,x+w/2+.05,y-h/2-.055,y+h/2+.055,...depth(-.002,.061));
    for(const a of [-w*.5,w*.5])box('galleryInlay',x+a-.021,x+a+.021,y-h*.5-.027,y+h*.5+.027,...depth(-.013,.004));
    for(const a of [-h*.5,h*.5])box('galleryInlay',x-w*.477,x+w*.477,y+a-.020,y+a+.020,...depth(-.013,.003));
    const g=new T.PlaneGeometry(w-.023,h-.024),uv=g.getAttribute('uv');
    for(let n=0;n<uv.count;n++)uv.setXY(n,i*.5+.004+uv.getX(n)*.492,.004+uv.getY(n)*.992);
    const m=new T.Mesh(g,mat);m.name='Südflügel · '+(i===0?'Himmelsblatt':'Mineralienblatt');
    m.position.set(x,y,d-side*.009);m.rotation.y=side===1?pi:0;root.add(m);
  }
}

export function galleryRunners(T,root,k,materials){
  const widths=[-1.142,-1.124,-1.069,-.84,-.43,0,.43,.84,1.069,1.124,1.142];
  for(const [i,[l,r]] of [[5.70,10.72],[14.45,26.20]].entries()){
    const pos=[],uv=[],index=[],xSteps=Math.ceil((r-l)*8),N=widths.length;
    for(let j=0;j<=xSteps;j++)for(const [n,v] of widths.entries()){
      const x=l+(r-l)*j/xSteps,side=Math.max(0,(Math.abs(v)-1.089)*.117);
      pos.push(x,Y+.015-side+.0009*Math.cos(x*11+v*14),v);
      uv.push(n===0?0:n===N-1?1:(v+1.142)/2.284,(x-l)/2.32);
      if(j<xSteps&&n<N-1){const a=j*N+n,b=a+N;index.push(a,a+1,b+1,a,b+1,b);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
    const m=new T.Mesh(g,i===0?materials.galleryRunnerA:materials.galleryRunnerB);m.receiveShadow=true;
    m.name=i===0?'Vorraum · geknüpfter Museums-Läufer':'Kabinett · geknüpfter Museums-Läufer';root.add(m);
    const p=(x,y,z)=>[x,y,z],r1=randomSource(i?885:104);
    for(const [x,s] of [[l,-1],[r,1]])for(let j=0;j<54;j++){
      const z=-1.107+j*.0418,d=.030+r1()*.024,y=Y+.003+r1()*.0029;
      k.box(j%4?'galleryFray':'galleryThread',p,Math.min(x,x+s*d),Math.max(x,x+s*d),y,y+.0034,z,z+.009+r1()*.008);
    }
  }
}
