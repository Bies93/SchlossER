import {randomSource,sharedSet} from './surface-detail.js';

function sheet(w,h=w){
  const c=document.createElement('canvas');c.width=w;c.height=h;return c.getContext('2d');
}
function texture(T,g,srgb=true,repeat=false){
  const t=new T.CanvasTexture(g.canvas);
  t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
  if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;
  t.anisotropy=4;return t;
}
// A restrained, seamless damask; the relief and albedo stay separate so the
// same cloth works in the cool gallery and the warmly lit chapter room.
function damask(T){
  const a=sheet(256),b=sheet(256);
  for(const [g,base,dark,light] of [[a,'#a3958b','#84746d','#c1b0a1'],[b,'#848484','#737373','#a1a1a1']]){
    g.fillStyle=base;g.fillRect(0,0,256,256);
    for(const x of [0,64,128,192,256])for(const y of [0,128,256]){
      g.save();g.translate(x,y+(x%128?64:0));
      for(const s of [-1,1]){
        g.scale(s,1);g.strokeStyle=light;g.lineWidth=1.3;
        g.beginPath();g.moveTo(0,-55);g.bezierCurveTo(26,-32,15,-3,26,20);g.bezierCurveTo(30,37,14,48,0,55);g.stroke();
        for(let j=0;j<6;j++){
          g.save();g.translate(12+j*2.27,-34+j*10.5);g.rotate(.43+j*.14);
          g.fillStyle=j%2?dark:light;g.beginPath();g.ellipse(0,0,4.6,9,0,0,Math.PI*2);g.fill();g.restore();
        }
        g.scale(s,1);
      }
      g.fillStyle=light;g.beginPath();g.ellipse(0,6,4,17,0,0,2*Math.PI);g.fill();g.restore();
    }
    for(let y=0;y<256;y+=3){g.fillStyle='#362a221a';g.fillRect(0,y,256,.36);}
  }
  return {map:texture(T,a,true,true),bumpMap:texture(T,b,false,true),bumpScale:.009};
}

function marble(T){
  const a=sheet(256),pixels=a.createImageData(256,256),rnd=randomSource(8177);
  for(let i=0;i<256*256;i++){
    const u=i%256/256,v=Math.floor(i/256)/256,t=Math.PI*2,
      cloud=Math.sin((u-v)*t*2+Math.sin(v*t)*1.71+.64*Math.sin((2*u+v)*t)),
      phase=(u-v)*t*3+Math.sin(v*t)*2.8+cloud*1.15+.29*Math.sin((6*u-v)*t),
      mask=.31+.6*(.5+.5*Math.cos((u+v)*t+cloud)),
      vein=(.5+.5*Math.sin(phase))**29*mask+(.5+.5*Math.sin(phase-.3))**10*.24,
      spot=(.5+.5*Math.sin(u*t+Math.cos(v*t)*2))*14+rnd()*3;
    pixels.data.set([208+spot-vein*44,205+spot-vein*49,195+spot-vein*51,255],i*4);
  }
  a.putImageData(pixels,0,0);
  return texture(T,a,true,true);
}

export function chapterFinishes(T){
  const std=(color,roughness,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const fabric=damask(T),stone=sharedSet(T,'plaster',256),wood=sharedSet(T,'fineOak',256),metal=sharedSet(T,'cutMetal',256);
  return {
    velvetRed:std(0x88293c,.88,fabric),velvetBlue:std(0x335365,.90,fabric),damaskGold:std(0xa58158,.88,fabric),
    walnut:std(0x6f4636,.63,wood),polishedWood:std(0xc09162,.52,wood),
    parquetAmber:std(0xa78663,.66,wood),parquetDeep:std(0x9a795c,.69,wood),
    honedMarble:std(0xc5b9aa,.42,{map:marble(T),metalness:.02}),
    vaultLime:std(0xb7ab98,.94,{...stone,normalScale:new T.Vector2(.24,.24)}),
    vaultBlue:std(0x939a96,.91,{...stone,normalScale:new T.Vector2(.26,.26)}),
    inlayGold:std(0xc3a46b,.42,{metalness:.44}),
    displaySteel:std(0xadb6b7,.37,{...metal,metalness:.54,normalScale:new T.Vector2(.31,.31)}),
    displayBlack:std(0x575f63,.51,{...metal,metalness:.43,normalScale:new T.Vector2(.25,.25)})
  };
}

export function armorialCloth(T){
  const c=sheet(1024,768),rng=randomSource(562),pi=Math.PI;
  const bg=c.createRadialGradient(512,370,16,512,370,615);bg.addColorStop(0,'#703341');bg.addColorStop(1,'#32242f');
  c.fillStyle=bg;c.fillRect(0,0,1024,768);
  const gold='#d5b375',pale='#e9d09d';
  function trace(pts,col,w,close=false,fill=null){
    c.strokeStyle=col;c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}c.stroke();
  }
  c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(25,24,974,719);c.strokeRect(45,42,934,681);
  for(let i=0;i<92;i++){
    const x=61+i*9.9;
    for(const y of [33,731])trace([[x-2,y],[x,y-3],[x+2,y],[x,y+3]],pale,1.15,true);
  }
  for(let x=101;x<960;x+=85)for(let y=86;y<692;y+=84){
    if(Math.hypot((x-512)*.92,y-380)<252)continue;
    c.strokeStyle='#bf945561';c.lineWidth=2;c.beginPath();c.ellipse(x,y,13,23,pi/4,0,2*pi);c.ellipse(x,y,13,23,-pi/4,0,2*pi);c.stroke();
  }
  c.lineWidth=7;c.strokeStyle=gold;c.fillStyle='#253c4a';c.beginPath();
  c.moveTo(373,223);c.lineTo(651,223);c.lineTo(630,461);c.quadraticCurveTo(596,542,512,584);
  c.quadraticCurveTo(429,542,394,461);c.closePath();c.fill();c.stroke();
  trace([[423,374],[414,307],[464,335],[512,273],[561,336],[611,308],[602,374]],pale,4,true,'#b99057');
  trace([[463,436],[512,396],[563,436],[512,480]],gold,5,true,'#d1ac6e');
  for(const s of [-1,1]){
    c.save();c.translate(512,380);c.scale(s,1);
    trace([[119,205],[166,154],[226,93],[241,21],[208,-54],[180,-113]],gold,3);
    for(let j=0;j<10;j++){
      const a=.15+j*.18,x=109+129*Math.sin(a),y=190-32*j;
      c.strokeStyle=gold;c.fillStyle='#b69155';c.lineWidth=2;c.beginPath();
      c.ellipse(x,y,8,24,-.75+j*.13,0,2*pi);c.fill();c.stroke();
      c.strokeStyle=pale;c.beginPath();c.ellipse(x-11,y+3,7,17,.4,0,2*pi);c.stroke();
    }
    c.restore();
  }
  c.textAlign='center';c.font='bold 32px Georgia';c.fillStyle=pale;c.fillText('BUND DER EISERNEN KRONE',512,151);
  c.font='bold 22px Georgia';c.fillText('SIEGEL · WORT · ERBE',512,659);
  for(let j=0;j<28500;j++){c.fillStyle=j%3?'#140d1a28':'#fbdb9e33';c.fillRect(rng()*1024,rng()*768,.65+rng()*2,.7+rng());}
  const map=texture(T,c);
  return new T.MeshStandardMaterial({map,roughness:.95,side:T.DoubleSide,bumpMap:sharedSet(T,'canvas',128).roughnessMap,bumpScale:.003});
}
