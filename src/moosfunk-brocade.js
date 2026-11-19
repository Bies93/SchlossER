// Block-printed linen. Continuous UVs on the sewn surface keep the print
// registered across folds; the shared canvas normal still supplies the weave.
export function quiltPrint(T,n){
  const c=document.createElement('canvas');c.width=c.height=384;const g=c.getContext('2d');
  const [ground,ink,thread,mid]=[['#713e4d','#d29d72','#e8bc91','#aa635d'],['#365953','#a9b58c','#dbbf88','#658777'],['#534763','#cd997e','#eed19e','#8b6e86']][n];
  const path=(pts,fill,stroke)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
    if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}};
  g.fillStyle=ground;g.fillRect(0,0,384,384);
  for(let i=-1;i<=2;i++)for(let j=-1;j<=2;j++){
    g.save();g.translate(i*192+(j%2)*96,j*192);g.lineWidth=2.6;
    if(n===0){
      for(const [s,f] of [[78,mid],[56,ground],[38,ink],[18,ground]])path([[0,-s],[s*.68,0],[0,s],[-s*.68,0]],f,thread);
      for(const d of [-1,1])path([[d*64,0],[d*88,-18],[d*83,0],[d*88,18]],ink);
    }else{
      for(let k=0;k<(n===1?6:8);k++){g.rotate(Math.PI*2/(n===1?6:8));
        g.beginPath();g.moveTo(0,-6);g.bezierCurveTo(-36,-26,-12,-57,0,-69);
        g.bezierCurveTo(15,-44,24,-21,0,-6);g.fillStyle=mid;g.fill();g.strokeStyle=ink;g.stroke();
        path([[0,-12],[3,-37],[0,-58],[-2,-34]],thread);}
      g.beginPath();g.arc(0,0,9,0,Math.PI*2);g.fillStyle=thread;g.fill();
    }
    g.restore();
  }
  for(let y=0;y<384;y+=3){g.fillStyle=y%2?'#fbe4c018':'#20151a22';g.fillRect(0,y,384,1);}
  const map=new T.CanvasTexture(c);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
