import {randomSource} from './surface-detail.js';
import {ROOMS,b,p} from './park-wc-layout.js';

const strokes={
  F:[7.3,'M.9 10 L1.4 .7 7.1 .3 M1.2 4.9 L6.1 4.5'],
  u:[6.7,'M.8 3.2 Q-1 10.1 2.7 9.8 Q5.1 9.6 5.7 3.2 Q4.9 8.8 6.2 9.9'],
  c:[6.1,'M5.6 3.8 Q2.9 2 1.4 5 Q-.7 7.9 1.5 9.5 Q3.2 11 5.6 8.9'],
  k:[6.6,'M1 .2 L.7 10 M6 3.4 L1.1 6.6 6.1 9.8'],
  N:[7.9,'M.9 9.8 L1 .7 Q4.2 5.1 6.9 9.2 L7.1 .5'],
  i:[2.8,'M1.5 4 L1.1 9.9 M1.7 1.5 l.1 .13'],
  l:[2.9,'M1.6 .4 Q.6 9.9 2 9.9'],
  a:[6.4,'M5.2 4.2 Q2.5 2.3 1.1 5.1 Q-.6 9.5 2 9.8 Q4.3 10 5.4 4.4 L5.2 9.7'],
  s:[5.8,'M5.3 3.7 Q.7 2.1 .7 5.1 Q.8 6.1 3.3 6.6 Q6.1 7.4 4.7 9.1 Q2.7 10.8 .5 9.3'],
  '!':[2.5,'M1.8 .5 L1.1 6.9 M.9 9.2 l-.1 .27']
};

export function addWcGraffiti(T,wall){
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=384;
  const c=canvas.getContext('2d'),rnd=randomSource(739066);
  c.lineCap='round';c.lineJoin='round';
  for(const [word,baseline,sx,sy,tilt] of [['Fuck',33,14.0,13.6,-.075],['Niklas!!!',185,14.4,14.2,-.046]]){
    const width=Array.from(word,ch=>strokes[ch][0]+.88).reduce((a,b)=>a+b)*sx;
    c.save();c.translate(384-width*.5,baseline);c.rotate(tilt);
    let x=0;
    for(const ch of word){
      const [advance,stroke]=strokes[ch],path=new Path2D(stroke),line=.64+rnd()*.16;
      c.save();c.translate(x,(rnd()-.5)*9);c.rotate((rnd()-.5)*.091);c.scale(sx,sy);
      c.strokeStyle='#8f2c28';c.lineWidth=line+1.02;c.globalAlpha=.095;c.stroke(path);
      c.lineWidth=line+.42;c.globalAlpha=.25;c.stroke(path);
      c.strokeStyle=ch==='!'?'#942a24':'#a7332b';c.lineWidth=line;c.globalAlpha=.94;c.stroke(path);
      if('FucsN!'.includes(ch)&&rnd()<.63){
        const at=ch==='N'?6.86:ch==='!'?.9:1.0;
        c.strokeStyle='#9c2b24';c.lineWidth=.12+rnd()*.09;c.globalAlpha=.45;
        c.stroke(new Path2D(`M${at} 9.7 q-.13 .4 -.15 ${.47+rnd()*1.8}`));
      }
      c.restore();x+=(advance+.88)*sx;
    }
    c.restore();
  }
  c.globalCompositeOperation='destination-out';
  for(let i=0;i<3250;i++){
    c.globalAlpha=.05+rnd()*.32;
    c.fillRect(84+rnd()*600,30+rnd()*328,.4+rnd()*2.1,.6+rnd()*1.7);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardMaterial({map,roughness:.96,transparent:true,alphaTest:.045,
    depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const [left,right,,end]=ROOMS.lobby;
  const tag=new T.Mesh(new T.PlaneGeometry(1.71,.75),material);
  tag.position.set(...p((left+right)*.5,b+1.845,end-.0024));tag.rotation.y=Math.PI*.5;
  tag.name='WC · Fuck Niklas!!!';tag.receiveShadow=true;tag.userData.noSceneQuery=true;wall.add(tag);
}
