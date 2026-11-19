import {LAB_CUT} from './lab-layout.js';
import {randomSource} from './surface-detail.js';

// Authored strokes, not a UI font or a rectangular sign. The letter paths
// are in brush units so kerning and angles can be tuned independently.
const letters={
  B:[7,'M1 10 L1.2 .7 Q6.6 -.4 6.5 2.9 Q6.3 4.6 1.2 5 Q7.5 4.3 7 7.8 Q6.8 10 1 10'],
  I:[4,'M.3 .8 L3.8 .4 M2.1 .6 L1.9 10 M.3 10 L3.9 9.6'],
  E:[6.5,'M6 .6 L.9 1 L.7 9.7 L6.4 9.5 M.8 5.2 L5.1 4.9'],
  S:[6.5,'M6.3 1.5 Q4.2 -.6 1.4 1.2 Q-1.2 3.7 3.4 5 Q8.1 6.4 5.4 9.1 Q3.1 11.3 .1 8.9'],
  h:[6,'M.8 .1 L.6 10 M.8 7.5 C1.9 3.5 5.6 3.6 5.4 7 L5.3 10'],
  a:[6.5,'M5.5 5.5 C1.8 2.1 -.1 7.1 1 9.3 C2.3 11.5 5.1 9 5.5 6 L5.5 9.8 L6.3 9.5'],
  t:[4.7,'M2 1.8 L1.7 7.9 Q1.7 10.6 4.3 9.1 M.1 4.7 L4.4 4.4'],
  e:[6,'M.9 7.2 Q5.7 7 5.6 5.9 Q4.1 2.2 1.3 5.8 Q-1 10.9 5.6 9'],
  R:[7.2,'M.9 10 L1.2 .8 Q6.8 -.1 7 2.5 Q7.5 5.6 1.3 5.4 M3 5.4 L7.2 9.9'],
  C:[7,'M6.4 1.1 Q3 -.8 1.4 2.1 Q-.2 4 .8 7.7 Q2.1 11.2 6.8 9.1'],
  H:[7,'M1 .6 L.7 9.9 M6.8 .4 L6.6 10 M.8 5.1 L6.7 4.7'],
  T:[7,'M.1 1 L7 .4 M3.7 .8 L3.2 10'],
  '!':[2.6,'M1.5 .6 L.8 7.1 M.6 9.2 L.6 9.9']
};

function paint(T){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d'),random=randomSource(196233);
  ctx.lineCap='round';ctx.lineJoin='round';
  function brush(path,width,opacity=1,accent=false){
    ctx.globalAlpha=opacity*.21;ctx.lineWidth=width*1.44;
    ctx.strokeStyle=accent?'#a65139':'#b29c75';ctx.stroke(path);
    ctx.globalAlpha=opacity;ctx.lineWidth=width;
    ctx.strokeStyle=accent?'#c47752':'#e6cc9d';ctx.stroke(path);
    ctx.globalAlpha=1;
  }
  // Tail to the right, tip down-left (towards the book at the aisle end).
  brush(new Path2D('M143 132 Q95 143 44 163 M70 135 L43 163 Q65 169 85 177'),5.6,.87,true);
  let x=175;
  for(const [phrase,scale,base] of [['BIES',12.0,55],['hatte',8.2,93],['RECHT!',12.1,53]]){
    for(const char of phrase){
      const [width,path]=letters[char],rot=(random()-.49)*.075;
      ctx.save();ctx.translate(x,base+(random()-.5)*10);ctx.rotate(rot);ctx.scale(scale*.70,scale);
      brush(new Path2D(path),.60+random()*.15,.89+random()*.09);
      ctx.restore();x+=(width+.96)*scale*.70;
    }
    x+=16;
  }
  brush(new Path2D('M588 192 Q753 179 939 182'),4.2,.65,true);
  // Dry paint chips, faint overspray and a few gravity streaks.
  for(const [x,y,d] of [[223,171,14],[318,170,10],[656,175,13],[859,170,17],[60,166,10]]){
    brush(new Path2D(`M${x} ${y} q-.5 5 .3 ${d}`),1.35,.35);
  }
  ctx.globalCompositeOperation='destination-out';
  for(let i=0;i<2300;i++){
    ctx.globalAlpha=.045+random()*.38;
    ctx.fillRect(33+random()*944,44+random()*158,.5+random()*3.2,.45+random()*1.6);
  }
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}

export function addLabGraffiti(T,parent){
  const {left,right,front}=LAB_CUT;
  const min=left+.17,max=right+.07,y0=1.16,y1=2.14,xyz=[],uv=[];
  function patch(a,b,face){
    const z=front+face,u=(a-min)/(max-min),v=(b-min)/(max-min);
    xyz.push(a,y0,z,b,y0,z,b,y1,z,a,y0,z,b,y1,z,a,y1,z);
    uv.push(u,0,v,0,v,1,u,0,v,1,u,1);
  }
  // Separate depth for each raised stile; paint stays on the wood even
  // at a grazing angle instead of floating across the panel mouldings.
  let cursor=min;
  for(let x=left+.20;x<right;x+=.68){
    const a=Math.max(min,x-.026),b=Math.min(max,x+.026);
    if(a>cursor)patch(cursor,a,.1512);
    patch(a,b,.1632);cursor=b;
  }
  if(max>cursor)patch(cursor,max,.1512);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const map=paint(T);
  const mat=new T.MeshStandardMaterial({map,alphaTest:.23,alphaToCoverage:true,roughness:.95,metalness:0,
    emissive:0x302316,emissiveMap:map,emissiveIntensity:.39,polygonOffset:true,polygonOffsetFactor:-1});
  const sign=new T.Mesh(g,mat);sign.name='Lesesaal · BIES hatte RECHT!';sign.receiveShadow=true;parent.add(sign);
}
