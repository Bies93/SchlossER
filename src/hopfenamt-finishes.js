import {sharedSet,randomSource} from './surface-detail.js';

// Two seamless architectural finishes and one shared print sheet. Detail stays
// in the room's existing material batches; there is no image request on entry.
export function hopFinishes(T,materials){
  const rng=randomSource(18023),std=(p)=>new T.MeshStandardMaterial(p);
  function sheet(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c.getContext('2d');}
  function texture(c,repeat,color=true){
    const t=new T.CanvasTexture(c.canvas);if(color)t.colorSpace=T.SRGBColorSpace;
    if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
  }
  const brick=sheet(512),relief=sheet(512);
  brick.fillStyle='#887d6c';brick.fillRect(0,0,512,512);relief.fillStyle='#5a5a5a';relief.fillRect(0,0,512,512);
  for(let row=0;row<16;row++)for(let col=0;col<5;col++){
    const x=col*128-(row%2)*64,y=row*32,shade=92+rng()*38;
    brick.fillStyle='rgb('+[shade+16,shade*.78+11,shade*.64+12].map(Math.round).join(',')+')';
    // Wrap the cropped stretcher at the opposite edge with identical colour.
    for(const X of [x,x-512]){
      if(X>=512||X+128<=0)continue;
      for(const [ctx,ink] of [[brick,brick.fillStyle],[relief,'#cfcfcf']]){
        ctx.fillStyle=ink;ctx.beginPath();ctx.roundRect(X+1.5,y+1.25,125,29.5,2.4);ctx.fill();
      }
    }
  }
  function mottling(c,n){for(let j=0;j<n;j++){c.fillStyle=j%3?'#35251e16':'#efe4c733';c.fillRect(rng()*512,rng()*512,rng()*5+1,rng()*2+.8);}}
  mottling(brick,18600);mottling(relief,5400);
  const tin=sheet(256),press=sheet(256);
  for(const [ctx,base,line,trim] of [[tin,'#655f55','#897e68','#514e49'],[press,'#777','#a7a7a7','#555']]){
    ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
    for(let y=0;y<256;y+=128)for(let x=0;x<256;x+=128){
      ctx.save();ctx.translate(x+64,y+64);ctx.strokeStyle=trim;ctx.lineWidth=4;ctx.strokeRect(-62,-62,124,124);
      ctx.strokeStyle=line;ctx.lineWidth=2;ctx.strokeRect(-54,-54,108,108);
      for(let j=0;j<8;j++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.ellipse(0,-22,7,16,0,0,Math.PI*2);ctx.stroke();}
      ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  const atlas=sheet(512,256);
  for(let i=0;i<4;i++){
    const x=i%2*256,y=(i>>1)*128;
    atlas.save();atlas.translate(x,y);atlas.fillStyle=['#18444b','#782f34','#423957','#d3bc86'][i];atlas.fillRect(0,0,256,128);
    const ink=i===3?'#403d35':'#f4dab0';atlas.strokeStyle=ink;atlas.fillStyle=ink;atlas.lineWidth=2;atlas.strokeRect(6,6,244,116);atlas.strokeRect(10,10,236,108);
    atlas.textAlign='center';atlas.font='bold 11px monospace';atlas.fillText('✦  SCHLOSS-SUD  ✦',128,32);
    atlas.font='bold 34px Georgia';atlas.fillText(['RAUTE','RUBIN','VESPER','HOPFENAMT'][i],128,76,218);
    atlas.font='bold 13px monospace';atlas.fillText(['HELL · LOS 01','ROTBIER · 07','DUNKEL · 09','DIENSTMARKE · II'][i],128,101);atlas.restore();
  }
  const oak=sharedSet(T,'fineOak',256),cloth=sharedSet(T,'canvas',128);
  const crust=sheet(256,128);
  const baked=crust.createLinearGradient(0,0,256,0);
  for(const [u,col] of [[0,'#b37845'],[.22,'#aa5929'],[.44,'#ba662c'],[.58,'#ca803c'],[.80,'#9e5028'],[1,'#b37845']])baked.addColorStop(u,col);
  crust.fillStyle=baked;crust.fillRect(0,0,256,128);
  for(let n=0;n<420;n++){
    const x=rng()*256,y=rng()*128,r=1.3+rng()*7;
    const spot=crust.createRadialGradient(x,y,0,x,y,r);
    spot.addColorStop(0,n%3?'#66280f4d':'#edb66e75');spot.addColorStop(1,'#c28d4400');
    crust.fillStyle=spot;crust.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let n=0;n<1650;n++){crust.fillStyle=n%3?'#54261330':'#f1c18d60';crust.fillRect(rng()*256,rng()*128,1+rng(),1);}
  Object.assign(materials,{
    hopBrick:std({map:texture(brick,true),bumpMap:texture(relief,true,false),bumpScale:.031,roughness:.94}),
    hopTin:std({map:texture(tin,true),bumpMap:texture(press,true,false),bumpScale:.024,metalness:.30,roughness:.65}),
    hopPaver:std({...sharedSet(T,'galleryStone',256),color:0xa19b89,roughness:.68}),
    hopOak:std({...oak,color:0xd0a474,roughness:.46}),hopVelvet:std({...cloth,color:0x984651,roughness:.90}),
    hopLabel:std({map:texture(atlas,false),roughness:.71}),
    hopGlass:std({color:0xd7eee9,transparent:true,opacity:.23,roughness:.16,depthWrite:false,envMapIntensity:.65}),
    hopGlint:std({color:0xbae1db,roughness:.26,metalness:.26}),hopDough:std({map:texture(crust,true),roughness:.62}),
    hopCrust:std({...sharedSet(T,'plaster',256),color:0xe1aa6d,roughness:.78}),
    hopHoney:std({color:0xd58b34,emissive:0x723009,emissiveIntensity:.21,roughness:.25}),
    hopEmerald:std({color:0x47644b,roughness:.24,metalness:.12})
  });
}

// Back-painted glass with hand-lettered double tubing. The glow is baked from
// the lettering itself, so the hero sign also works without bloom/post FX.
export function nightMarquee(T,root,x,y,z){
  const c=document.createElement('canvas');c.width=1024;c.height=384;
  const a=c.getContext('2d'),rng=randomSource(26902);
  const bg=a.createLinearGradient(0,0,0,384);bg.addColorStop(0,'#122932');bg.addColorStop(.47,'#244449');bg.addColorStop(1,'#151b2c');
  a.fillStyle=bg;a.fillRect(0,0,1024,384);
  for(let n=0;n<18000;n++){a.fillStyle=n%3?'#06060915':'#d5dec318';a.fillRect(rng()*1024,rng()*384,1+rng()*3,1);}
  a.lineWidth=3;a.strokeStyle='#ab885b';a.strokeRect(8,9,1008,366);a.strokeRect(16,16,992,352);
  const line=(pts,ink,w)=>{a.strokeStyle=ink;a.lineWidth=w;a.beginPath();pts.forEach(([X,Y],i)=>i?a.lineTo(X,Y):a.moveTo(X,Y));a.stroke();};
  a.textAlign='center';a.font='bold 23px Georgia';a.fillStyle='#ebc996';a.fillText('✦     H O P F E N A M T     ✦',512,64);
  a.font='italic bold 159px Georgia';a.lineJoin='round';
  for(const [ink,width,blur] of [['#522932',14,0],['#fc6089',8,20],['#ffd5c6',2.6,3]]){
    a.shadowBlur=blur;a.shadowColor='#f04476';a.strokeStyle=ink;a.lineWidth=width;a.strokeText('Sudwerk',508,230,722);
  }
  a.shadowBlur=0;
  for(const s of [-1,1]){
    const U=v=>512+s*v;
    for(let i=0;i<3;i++)line([[U(314+i*20),240-i*34],[U(378+i*20),178-i*34],[U(442),178-i*34]],'#8fd9cc',3);
    line([[U(66),269],[U(329),269],[U(355),245]],'#c09e6c',2);
    for(let j=0;j<4;j++)line([[U(18+j*21),274],[U(24+j*21),263],[U(30+j*21),274],[U(24+j*21),285],[U(18+j*21),274]],'#f1c38e',2);
  }
  a.font='bold 27px monospace';a.fillStyle='#ecd6b0';a.fillText('T A N Z P A L A S T    /    U G  II',512,327);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const g=new T.Mesh(new T.PlaneGeometry(4.95,1.64),new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.58,roughness:.34}));
  g.position.set(x,y,z);root.add(g);
}
