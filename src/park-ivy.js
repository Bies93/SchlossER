import {W,back,p} from './park-wc-layout.js';
import {randomSource} from './surface-detail.js';

function leafTexture(T){
  const image=document.createElement('canvas');image.width=256;image.height=256;
  const c=image.getContext('2d'),rand=randomSource(92615);
  c.beginPath();c.moveTo(126,232);
  c.bezierCurveTo(76,235,46,199,18,165);
  c.bezierCurveTo(33,157,45,149,67,151);
  c.bezierCurveTo(47,117,46,77,45,46);
  c.bezierCurveTo(72,52,91,67,106,87);
  c.bezierCurveTo(112,57,122,25,136,10);
  c.bezierCurveTo(153,45,166,70,166,98);
  c.bezierCurveTo(179,80,201,66,221,63);
  c.bezierCurveTo(217,103,207,134,189,151);
  c.bezierCurveTo(211,145,226,150,239,157);
  c.bezierCurveTo(211,190,167,229,126,232);c.closePath();
  const grad=c.createLinearGradient(28,207,197,44);
  grad.addColorStop(0,'#4c6240');grad.addColorStop(.45,'#738b51');grad.addColorStop(1,'#8da35c');
  c.fillStyle=grad;c.fill();c.save();c.clip();
  for(let i=0;i<2500;i++){
    c.fillStyle=i%3===0?'#24392726':'#bec9781a';c.fillRect(rand()*256,rand()*256,1+rand()*3,1+rand()*2);
  }
  function vein(a,b,d,width,ink){
    c.strokeStyle=ink;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.quadraticCurveTo(...b,...d);c.stroke();
  }
  vein([126,231],[127,128],[136,15],3,'#c1c98b');
  for(const [a,b,d] of [
    [[126,210],[69,200],[24,166]],[[128,182],[77,148],[48,57]],[[129,147],[99,104],[87,83]],
    [[129,192],[188,175],[231,159]],[[131,151],[181,135],[216,69]],[[132,111],[158,91],[171,76]]
  ])vein(a,b,d,1.9,'#adb978');
  c.restore();
  const map=new T.CanvasTexture(image);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}

export function addParkIvy(T,root,kit){
  const random=randomSource(711907),pieces=[],at=new T.Object3D(),tint=new T.Color();
  const rod=new T.CylinderGeometry(1,1,1,6),m=new T.Matrix4(),a=new T.Vector3(),dir=new T.Vector3();
  const q=new T.Quaternion(),up=new T.Vector3(0,1,0),s=new T.Vector3();
  function twig(A,B,r){
    a.fromArray(A);dir.fromArray(B).sub(a);const n=dir.length();if(n<.002)return;
    m.compose(a.addScaledVector(dir,.5),q.setFromUnitVectors(up,dir.normalize()),s.set(r,n,r));
    kit.geometry('vine',rod,m);
  }
  function vine(wall,start,h,phase){
    const n=Math.ceil(h/.096),position=(t,d=0)=>{
      const k=start+Math.sin(t*5.2+phase)*t*.18+Math.sin(t*12+phase)*.025;
      const off=.034+Math.sin(t*7+phase)*.019+d,y=.36-t*h;
      return wall==='end'?p(k,y,back+off):wall==='near'?p(off,y,k):p(W-off,y,k);
    };
    let head=position(0);
    for(let j=1;j<=n;j++){
      const t=j/n,point=position(t);twig(head,point,.0068*(1-.47*t));head=point;
      for(let k=0;k<(j%4===0?2:1);k++){
        const side=(j+k)%2===0?1:-1,f=side*(.032+random()*.063);
        const tip=position(t,.026+random()*.029);
        if(wall==='end')tip[2]+=f;else tip[0]+=f;
        tip[1]-=.022+random()*.044;twig(point,tip,.0022);
        const spin=(wall==='end'?pi/2:wall==='near'?0:pi)+((random()-.5)*.78);
        pieces.push([tip,spin,side, (.11+random()*.086)*(1-.26*t),random()]);
      }
    }
  }
  const pi=Math.PI;
  for(let j=0;j<25;j++){
    const u=.16+j*(W-.32)/24+(random()-.5)*.18;
    vine('end',u,.27+random()*.56+Math.max(0,Math.sin(j*.71-1))*.58,j*.68);
  }
  for(const side of ['near','far'])for(let j=0;j<18;j++){
    const v=back+.12+j*.245+(random()-.5)*.15;
    vine(side,v,.26+random()*.52+Math.max(0,Math.sin(j*.73+1.1))*.64,j*.94);
  }
  const g=new T.PlaneGeometry(1,1.06,2,4),verts=g.getAttribute('position');
  for(let i=0;i<verts.count;i++){
    const y=verts.getY(i)+.48,x=verts.getX(i);
    verts.setXYZ(i,x,-y,.15*y+.08*(1-2*Math.abs(x))*Math.sin(y*pi));
  }
  // The flipped surface points downward; UV v=0 (the stalk) stays at the anchor.
  g.computeVertexNormals();
  const leaves=new T.InstancedMesh(g,new T.MeshStandardMaterial({map:leafTexture(T),alphaTest:.40,
    roughness:.77,side:T.DoubleSide}),pieces.length);
  for(const [i,[tip,spin,side,size,shade]] of pieces.entries()){
    at.position.fromArray(tip);at.rotation.set(.14+shade*.55,spin,side*(.32+shade*.54),'YXZ');
    at.scale.set(size,size,size);at.updateMatrix();leaves.setMatrixAt(i,at.matrix);
    tint.setRGB(.68+shade*.32,.73+shade*.27,.65+shade*.34);leaves.setColorAt(i,tint);
  }
  leaves.name='WC-Außentreppe · Efeutriebe mit Blattadern';
  leaves.computeBoundingSphere();root.add(leaves);rod.dispose();
}
