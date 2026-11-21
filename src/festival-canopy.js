import {FESTIVAL_ENDS} from './festival-layout.js';
import {sharedSet,randomSource} from './surface-detail.js';

const lerp=(a,b,f)=>a+(b-a)*f;
const eave=2.965,half=6.11;
const roof=x=>4.76-Math.abs(x)*.293;

// Hand-painted letter contours traced from the supplied UEDV reference.
function paintWordmark(c){
  c.save();c.translate(88,26);c.scale(.78,.87);
  c.strokeStyle='#2e1bea';c.lineWidth=31;c.lineCap='round';c.lineJoin='round';
  function stroke(draw){c.beginPath();draw();c.stroke();}
  stroke(()=>{
    c.moveTo(39,24);c.bezierCurveTo(24,76,6,145,13,198);
    c.bezierCurveTo(21,254,63,283,128,277);c.bezierCurveTo(218,269,226,200,234,142);
    c.bezierCurveTo(240,97,242,65,248,37);
  });
  stroke(()=>{
    c.moveTo(515,33);c.bezierCurveTo(452,49,376,56,331,47);
    c.bezierCurveTo(311,42,306,57,305,81);
    c.bezierCurveTo(300,157,274,245,275,277);
    c.bezierCurveTo(321,261,420,266,492,247);
  });
  stroke(()=>{c.moveTo(298,145);c.bezierCurveTo(340,151,407,149,461,133);});
  stroke(()=>{
    c.moveTo(551,54);c.bezierCurveTo(534,128,523,195,522,260);
    c.bezierCurveTo(559,270,642,239,705,209);
    c.bezierCurveTo(753,185,793,130,768,89);
    c.bezierCurveTo(738,41,679,42,618,47);c.bezierCurveTo(588,49,548,52,536,45);
  });
  stroke(()=>{
    c.moveTo(787,28);c.bezierCurveTo(821,106,871,228,900,272);
    c.bezierCurveTo(935,214,1029,108,1048,46);
  });
  c.restore();
}

function clubBanner(T){
  const sheet=document.createElement('canvas');sheet.width=1024;sheet.height=420;
  const c=sheet.getContext('2d'),random=randomSource(4169);
  c.fillStyle='#faf9f2';c.fillRect(0,0,1024,420);
  for(let i=0;i<7700;i++){
    c.fillStyle=i%3?'#6e87ac0b':'#9f895718';c.fillRect(random()*1024,random()*420,1+random()*4,.8+random()*2.1);
  }
  c.strokeStyle='#8a9fc8';c.lineWidth=2;c.setLineDash([8,6]);c.strokeRect(12,12,1000,396);c.setLineDash([]);
  paintWordmark(c);
  c.fillStyle='#243687';c.textAlign='center';c.font='bold 42px system-ui';
  c.fillText('DART-SPINNER UEHLFELD',512,328,956);
  c.font='bold 23px monospace';c.fillText("ZWANNI'S FUNNY!   /   BIER · DART · MUSIK",512,376,915);
  const texture=new T.CanvasTexture(sheet);texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=6;return texture;
}

export function festivalCanopy(T,root,k,m,localY,wall){
  const fabric=(color)=>{
    const textures=sharedSet(T,'canvas',512);
    return new T.MeshStandardMaterial({...textures,
      color,side:T.DoubleSide,roughness:.88,emissive:0x62778b,emissiveIntensity:.13
    });
  };
  m.roofWhite=fabric(0xfffefa);m.roofFold=fabric(0xf4f4f1);m.tentWall=fabric(0xfcfbf7);
  m.tentHem=fabric(0xe8ebf0);
  m.tentPiping=new T.MeshStandardMaterial({color:0xe8e3d8,roughness:.77});
  m.tentClear={cast:false,material:new T.MeshPhysicalMaterial({
    color:0xcbdbe3,side:T.DoubleSide,transparent:true,opacity:.34,depthWrite:false,
    roughness:.28,metalness:.04,clearcoat:.53,clearcoatRoughness:.31
  })};
  const face=(key,a,b,c,d,scale=1.23)=>k.quad(key,a,b,c,d,scale);
  const seam=(a,b,rad=.012,mat='tentPiping')=>k.tube(mat,[a,b],rad,1,7);
  // Roof held in soft bays; adjacent fabric sections share their edge.
  for(let i=0;i<12;i++){
    const a=-6.19+i*(12.38/12),b=a+12.38/12,key=i%4===1?'roofFold':'roofWhite';
    const height=x=>roof(x)-.038*Math.sin((x-a)/(b-a)*Math.PI);
    for(let j=0;j<8;j++){
      const l=lerp(a,b,j/8),r=lerp(a,b,(j+1)/8);
      face(key,[l,height(l),5.09],[r,height(r),5.09],[r,height(r),-5.09],[l,height(l),-5.09]);
    }
    seam([a,roof(a)+.0005,-5.085],[a,roof(a)+.0005,5.085],.013);
  }
  seam([0,roof(0)+.009,-5.11],[0,roof(0)+.009,5.11],.018);
  for(const z of [-4.80,0,4.80])for(const s of [-1,1]){
    const tube=(a,b,r,m='frame')=>seam(a,b,r,m);
    // Keep the upper chord below the low point of the sagging fabric.
    tube([s*6.04,2.88,z],[0,4.64,z],.045);
    tube([s*6.04,2.97,z],[0,3.30,z],.029);
    for(let i=1;i<4;i++)tube([s*i*1.51,3.30-.083*i,z],[s*(i-1)*1.51,roof((i-1)*1.51)-.10,z],.021,'galv');
  }
  function gable(z){
    for(let i=0;i<24;i++){
      const a=-half+i*(half/12),b=a+half/12;
      face(i%5===2?'roofFold':'tentWall',[a,eave,z],[b,eave,z],[b,roof(b)-.061,z],[a,roof(a)-.061,z]);
    }
    for(const sign of [-1,1])seam([sign*half,roof(half)-.063,z],[0,roof(0)-.061,z],.018);
  }
  function windowBay(left,right,z,withWindow){
    const width=right-left,center=(right+left)*.5,bottom=x=>localY(x,z)+.033;
    const hem=x=>bottom(x)+.158;
    const p=(x,y)=>[x,y,z+.011*Math.sin((x-left)/width*Math.PI)];
    const strip=(mat,a,b,lo,hi)=>face(mat,p(a,lo(a)),p(b,lo(b)),p(b,hi(b)),p(a,hi(a)));
    const top=()=>eave;
    const edge=.73,sill=()=>.83,shoulder=1.77,rise=.53,win=x=>shoulder+rise*Math.sqrt(Math.max(0,1-((x-center)/edge)**2));
    if(!withWindow)strip('tentWall',left,right,hem,top);
    else {
      const lo=center-edge,hi=center+edge;
      strip('tentWall',left,lo,hem,top);strip('tentWall',hi,right,hem,top);
      strip('tentWall',lo,hi,hem,sill);
      const outline=[];
      for(let i=0;i<16;i++){
        const a=lerp(lo,hi,i/16),b=lerp(lo,hi,(i+1)/16);
        strip('tentWall',a,b,win,top);strip('tentClear',a,b,sill,win);
        outline.push(p(a,win(a)));
      }
      outline.push(p(hi,win(hi)));
      k.tube('tentPiping',outline,.017,28,7);
      for(const x of [lo,hi])seam(p(x,sill()),p(x,win(x)),.017);
      seam(p(lo,sill()),p(hi,sill()),.017);
      // Welded window grid is sewn onto the inside of the clear vinyl.
      for(const u of [-.48,0,.48])seam(p(center+u,.85),p(center+u,win(center+u)-.020),.009);
      for(const y of [1.27,1.72])seam(p(lo,y),p(hi,y),.011);
    }
    const boundary=withWindow?[left,center-edge,center+edge,right]:[left,right];
    for(let i=1;i<boundary.length;i++)strip('tentHem',boundary[i-1],boundary[i],bottom,hem);
    for(const u of [left,right]){
      // Keep the batten tangent to its own bay; never place two sheets coplanar.
      const x=u+(u===left?.019:-.019),p0=p(x,bottom(x)),p1=p(x,eave-.011);
      seam([p0[0],p0[1],p0[2]+.016],[p1[0],p1[1],p1[2]+.016],.016);
    }
  }
  function end({z,left,right},isFront){
    gable(z);
    for(const [a,b] of [[-half,left],[right,half]]){
      const width=b-a,n=Math.ceil(width/2.59);
      for(let i=0;i<n;i++){
        const l=lerp(a,b,i/n),r=lerp(a,b,(i+1)/n);
        windowBay(l,r,z,r-l>2.13&&(isFront||i%2===1));
      }
      wall((a+b)*.5,z,width,.074);
    }
    // Open flap: the rolled header reads as a clear entrance, with wrapped
    // side ties and enough headroom for the camera and jump.
    const gap=right-left,x=(left+right)*.5;
    face('tentWall',[left,2.47,z],[right,2.47,z],[right,eave,z],[left,eave,z]);
    seam([left,2.47,z+.024],[right,2.47,z+.024],.061,'tentHem');
    for(const X of [left+.12,right-.12]){
      k.round('tentPiping',X,2.492,z+.022,.045,.143,.155,.013);
      k.box('brushed',X,2.425,z+.061,.022,.020,.049);
    }
    for(const X of [left-.039,right+.039])k.round('galv',X,1.46,z-.017,.059,2.91,.059,.008);
    if(isFront){
      const signX=x,signY=2.725;
      k.round('tentHem',signX,signY,z+.024,gap*.638,.27,.033,.011);
      const sheet=document.createElement('canvas');sheet.width=512;sheet.height=84;
      const c=sheet.getContext('2d');c.fillStyle='#f9fbff';c.fillRect(0,0,512,84);
      c.textAlign='center';c.fillStyle='#243687';c.font='bold 42px system-ui';c.fillText('EINGANG',256,59);
      const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;
      const label=new T.Mesh(new T.PlaneGeometry(gap*.609,.241),new T.MeshBasicMaterial({map}));
      label.position.set(x,signY,z+.046);label.userData.noSceneQuery=true;root.add(label);
    }
  }
  end(FESTIVAL_ENDS.front,true);end(FESTIVAL_ENDS.rear,false);
  // The longitudinal faces remain open except for short white windbreaks.
  for(const x of [-6.12,6.12]){
    for(let i=0;i<16;i++){
      const a=-4.93+9.84*i/16,b=-4.93+9.84*(i+1)/16;
      const h=i<4?localY(x,a)+.043:2.688+.035*Math.sin(i*1.55);
      const h1=i<4?localY(x,b)+.043:2.688+.035*Math.sin((i+1)*1.55);
      face(i%3===1?'roofFold':'tentWall',[x,eave,a],[x,eave,b],[x,h1,b],[x,h,a]);
      if(i>=4)seam([x,h,a],[x,h1,b],.010);
    }
    wall(x,(-4.93-2.47)*.5,.082,2.46);
  }
  const map=clubBanner(T),print=new T.MeshStandardMaterial({map,roughness:.85,
    emissiveMap:map,emissive:0xd6dffe,emissiveIntensity:.17});
  for(const [x,y,z,w,h,angle] of [[0,3.562,5.005,3.08,1.263,0],[0,3.509,-5.057,3.21,1.315,Math.PI],
    [0,3.51,4.875,3.18,1.304,Math.PI],[.35,3.44,-4.886,3.12,1.28,0]]){
    const banner=new T.Mesh(new T.PlaneGeometry(w,h),print);
    banner.position.set(x,y,z);banner.rotation.y=angle;banner.userData.noSceneQuery=true;root.add(banner);
  }
}
