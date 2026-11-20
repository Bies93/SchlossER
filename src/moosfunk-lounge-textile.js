import {randomSource} from './surface-detail.js';

export function loungeRug(T){
  const cv=document.createElement('canvas');cv.width=cv.height=1024;
  const ctx=cv.getContext('2d'),rand=randomSource(6637),ramp=ctx.createLinearGradient(0,0,970,1030);
  for(const [p,c] of [[0,'#543226'],[.34,'#8e5138'],[.67,'#754131'],[1,'#945742']])ramp.addColorStop(p,c);
  ctx.fillStyle=ramp;ctx.fillRect(0,0,1024,1024);
  const colors=['#c3a17c','#374c44','#a66354','#91734d'];
  function diamond(x,y,w,h,color){
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+w,y);ctx.lineTo(x,y+h);
    ctx.lineTo(x-w,y);ctx.closePath();ctx.fill();
  }
  for(const [i,d] of [22,31,44,70,80,104,112,123].entries()){
    ctx.strokeStyle=colors[i%4];ctx.lineWidth=i%3===1?5:3;ctx.strokeRect(d,d,1024-2*d,1024-2*d);
  }
  for(let i=0;i<23;i++){
    const u=64+i*40;
    diamond(u,56,15,7,colors[i%2]);diamond(u,968,15,7,colors[(i+1)%2]);
    diamond(56,u,7,15,colors[i%2]);diamond(968,u,7,15,colors[(i+1)%2]);
  }
  for(let j=0;j<5;j++)for(let i=0;i<5;i++){
    const x=197+i*157,y=198+j*156;
    if((i+j)%2===0){
      diamond(x,y,63,41,'#544a34');diamond(x,y,55,34,'#a08658');diamond(x,y,46,28,'#56604a');
      diamond(x,y,28,17,'#49352d');diamond(x,y,13,8,'#c4a47d');
      for(const s of [-1,1])diamond(x,y+s*53,12,6,'#ad8d64');
    }else{
      diamond(x,y,28,22,'#a37b55');diamond(x,y,22,17,'#854c3d');
      for(const s of [-1,1])diamond(x+s*39,y,6,8,'#b2966e');
    }
  }
  for(let y=1;y<1024;y+=3){
    ctx.fillStyle=y%2?'#f3dbb31d':'#27160f24';ctx.fillRect(0,y,1024,1);
    for(let i=0;i<31;i++){
      const x=rand()*1024;ctx.fillStyle=i%2?'#211c1725':'#ead7a52a';
      ctx.fillRect(x,y,1+rand()*12,1+rand()*2);
    }
  }
  for(let x=0;x<1024;x+=4){ctx.fillStyle=x%8?'#331d161d':'#e4bd8d1b';ctx.fillRect(x,0,1,1024);}
  const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.96});
}
