import {randomSource,sharedSet} from './surface-detail.js';
import {UPPER_ENTRY} from './palace-openings.js';

const pi=Math.PI;
const palette=[
  ['stairStone',0x777b79,0x747370,0x686962,1.17,1.24,0x545858,0xa4a094],
  ['enamel',0x657980,0x72888b,0x56646c,.58,.58,0x526c72,0x9aa9a8],
  ['fineOak',0x947257,0x7b5f4b,0x8d6e52,1.32,.145,0x4e5d51,0xab947e],
  ['labTile',0xa7b4ae,0x99aeb3,0x5b777d,.64,.64,0x5d7476,0xabbab0],
  ['stairStone',0xc1b49c,0xa7977d,0x8a645b,.42,.42,0x676c69,0xb6a58f],
  ['fineOak',0x967052,0xa87b58,0x835d48,.72,.72,0x756049,0xb4a092],
  ['stairStone',0x586367,0x697276,0x68746b,.91,1.14,0x57676d,0x959e95],
  ['stairStone',0x8e826a,0x786d5b,0x686a58,.52,.72,0x6e6851,0xb1a089]
];

export function factoryFinishMaterials(T){
  const surface=(color,kind,n=.62)=>new T.MeshStandardMaterial({
    color,...sharedSet(T,kind,512),normalScale:new T.Vector2(n,n),roughness:.87
  });
  const c=document.createElement('canvas');c.width=2048;c.height=1024;
  const g=c.getContext('2d'),rng=randomSource(50692);
  for(let i=0;i<4;i++){
    const X=i*512,[base,border,ink]=[
      ['#34473c','#a28450','#c0ac75'],['#704b42','#b59763','#d9c191'],
      ['#502d37','#946858','#d6af72'],['#334244','#537b75','#c6d4bc']
    ][i];
    g.save();g.translate(X,0);g.beginPath();g.rect(0,0,512,1024);g.clip();
    g.fillStyle=base;g.fillRect(0,0,512,1024);
    const poly=(x,y,rx,ry)=>{
      g.beginPath();g.moveTo(x-rx,y);g.lineTo(x,y-ry);g.lineTo(x+rx,y);g.lineTo(x,y+ry);g.closePath();
    };
    g.strokeStyle=border;g.lineWidth=2;
    for(let x=-41;x<560;x+=73)for(let y=-20;y<1060;y+=74){
      poly(x,y,38,38);g.stroke();
      poly(x,y,5,6);g.fillStyle=border;g.fill();
    }
    for(const [inset,l] of [[9,3],[17,1],[31,5],[46,1],[53,3]]) {
      g.lineWidth=l;g.strokeStyle=inset===31?border:ink;g.strokeRect(inset,inset,512-2*inset,1024-2*inset);
    }
    g.strokeStyle=ink;
    for(let j=0;j<3;j++){poly(256,512,114-18*j,222-35*j);g.stroke();}
    for(let s=0;s<8;s++){
      const a=s*pi/4;
      poly(256+Math.sin(a)*70,512+Math.cos(a)*123,12,23);g.stroke();
    }
    poly(256,512,37,68);g.fillStyle=border;g.fill();
    poly(256,512,18,34);g.fillStyle=base;g.fill();
    for(let n=0;n<20800;n++){
      const x=rng()*512,y=rng()*1024;
      g.fillStyle=n%2?'rgba(239,219,170,.13)':'rgba(8,6,6,.25)';
      g.fillRect(x,y,.8+rng()*3,1+rng()*4);
    }
    for(let y=0;y<1024;y+=4){
      g.fillStyle='rgba(5,4,3,.25)';g.fillRect(0,y,512,1);
    }
    g.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  const mats={joint:surface(0x665c50,'stairStone'),ceilingEdge:surface(0x8a755a,'fineOak'),
    braid:surface(0xb09a68,'canvas'),rubBack:surface(0x54483f,'canvas'),
    woven:new T.MeshStandardMaterial({map,roughness:.99})};
  palette.forEach(([kind,a,b,trim,,,wall,plaster],i)=>{
    for(const [k,color] of [['fl',a],['fv',b],['fa',trim]])mats[k+i]=surface(color,kind,kind==='fineOak'?.72:.51);
    mats['lining'+i]=surface(wall,i%3===1?'enamel':'labTile',.43);
    mats['back'+i]=surface(plaster,i===1||i===3||i===7?'labTile':i===6?'enamel':'plaster',.52);
    mats['ceiling'+i]=surface(i===5?0xb8a38a:i===4?0xb3a896:i===2?0x92816c:i===6?0x737d80:0x89908c,'plaster',.46);
  });
  return mats;
}

export function dressFactoryFinishes(k,{i,w,sections,rear,ceiling,box,xyz,cableRun}){
  const [,,,,stepX,stepD]=palette[i],rng=randomSource(31213+131*i);
  const edge=w/2,panelsBottom=i===5?.20:.14,panelsTop=i===5?1.14:i===4?1.23:.94;
  const top=(mat,l,r,a,b,y,offset=0)=>k.quad(mat,xyz(l,y,a),xyz(r,y,a),xyz(r,y,b),xyz(l,y,b),1.01,offset);
  const soffit=(mat,l,r,a,b)=>k.quad(mat,xyz(l,ceiling-.012,b),xyz(r,ceiling-.012,b),xyz(r,ceiling-.012,a),xyz(l,ceiling-.012,a),1.45);
  for(const [l,r,D] of sections){
    top('joint',l,r,.12,D,-.006);
    soffit('ceiling'+i,l,r,.08,D);
    const trim=i===2||i===4||i===5?'ceilingEdge':'gunmetal';
    function rearSkin(a,b,y0,y1){
      if(b-a<.015||y1-y0<.015)return;
      k.quad('back'+i,xyz(a,y0,D-.090),xyz(b,y0,D-.090),xyz(b,y1,D-.090),xyz(a,y1,D-.090),1.29);
    }
    function rearWall(a,b){
      rearSkin(a,b,.114,ceiling-.068);
      box('lining'+i,(a+b)*.5,(panelsTop+panelsBottom)*.5,D-.096,b-a,panelsTop-panelsBottom,.047);
      box(trim,(a+b)*.5,panelsTop,D-.113,b-a,.045,.070);
      if(i===0||i===1||i===3||i===6||i===7){
        for(const x of [a+.18,b-.18]){
          box(trim,x,2.43,D-.124,.029,2.72,.071);
          for(const y of [1.30,2.75,3.49])box('copper',x,y,D-.164,.049,.050,.019);
        }
      }
    }
    if(i===4){
      const origin=xyz(0,0,0)[0],a=UPPER_ENTRY.left+.033-origin,b=UPPER_ENTRY.right-.033-origin;
      rearWall(l+.018,a-.038);rearWall(b+.038,r-.018);
      rearSkin(a-.038,b+.038,UPPER_ENTRY.head-xyz(0,0,0)[1]+.006,ceiling-.068);
    }else rearWall(l+.018,r-.018);
    for(let row=0,a=.12;a<D-.001;a+=stepD,row++){
      const b=Math.min(D,a+stepD),shift=(i===0||i===2||i===7)&&row%2?stepX*.5:0;
      for(let u=l-shift,j=0;u<r-.001;u+=stepX,j++){
        const x=Math.max(l,u)+.004,x2=Math.min(r,u+stepX)-.004;
        if(x2-x<.009||b-a<.015)continue;
        const tone=i===4?(row+j)%2===0?'fl':(row%4===0&&j%3===1?'fa':'fv'):rng()<.76?'fl':'fv';
        if(i===5&&x2-x>.62&&b-a>.62){
          const rot=(row+j)%2===0,y=0;
          for(let n=0;n<5;n++){
            const f=n*.2,h=(n+1)*.2;
            const X=x+(x2-x)*f,X2=x+(x2-x)*h-.004,A=a+(b-a)*f+.004,B=a+(b-a)*h-.004;
            if(rot)top(n===1?'fa'+i:tone+i,X,X2,a+.004,b-.004,y,n*.17);
            else k.quad(n===2?'fv'+i:tone+i,xyz(x2,y,A),xyz(x2,y,B),xyz(x,y,B),xyz(x,y,A),1.0,n*.17);
          }
        }else top(tone+i,x,x2,a+.004,b-.004,0,rng());
      }
    }
  }
  // Narrow bands leave the existing structural opening and its frames intact.
  const lining='lining'+i;
  const front=(l,r)=>{
    if(r-l<.01)return;
    box(lining,(l+r)/2,(panelsTop+panelsBottom)/2,.154,r-l,panelsTop-panelsBottom,.086);
    box(i===5?'ceilingEdge':'gunmetal',(l+r)/2,panelsTop,.179,r-l,.041,.075);
  };
  front(-edge+.20,-1.32);front(.59,edge-.20);
  for(const s of [-1,1]){
    const x=s*(edge-.174),D=rear(x)-.24;
    const main=i===5?'ceilingEdge':'gunmetal';
    box(lining,x,(panelsTop+panelsBottom)/2,(D+.22)*.5,.066,panelsTop-panelsBottom,D-.22);
    box(main,x-s*.021,panelsTop,(D+.22)*.5,.085,.058,D-.22);
    for(let d=.37;d<D-.12;d+=i===5?.72:.82){
      box(i===5?'braid':'coal',x-s*.038,(panelsTop+panelsBottom)/2,d,.019,panelsTop-panelsBottom-.045,.027);
    }
    box(main,x-s*.019,ceiling-.128,(D+.19)*.5,.16,.229,D-.19);
    if(i===5||i===4)box('braid',x-s*.105,ceiling-.195,(D+.27)*.5,.028,.033,D-.27);
    if(i!==5&&i!==4)cableRun(s,.44,D-.10,ceiling-.46);
  }
  for(const [l,r,D] of sections)box(i===5?'ceilingEdge':'coal',(l+r)*.5,ceiling-.132,D-.128,r-l,.226,.173);
  if(i===5||i===4){
    for(const u of [-2.37,0,2.37]){
      const D=rear(u),a=.29,b=D-.30;
      for(const dx of [-.78,.78])box('ceilingEdge',u+dx,ceiling-.252,(a+b)*.5,.07,.085,b-a);
      for(const d of [a,b,2.12,4.06,6.03].filter(d=>d<=b)){
        box('ceilingEdge',u,ceiling-.251,d,1.56,.086,.061);
        for(const s of [-1,1])box('braid',u+s*.76,ceiling-.298,d,.103,.020,.099);
      }
      // Mount the decorative grid to the plaster, including where no old beam crosses it.
      for(const d of [a,Math.min(4.06,b),b])box('ceilingEdge',u,ceiling-.113,d,.081,.249,.075);
    }
  }else{
    for(const d of [1.15,3.36,5.62]){
      box('coal',0,ceiling-.293,d,w-.34,.119,.188);
      box('gunmetal',0,ceiling-.195,d,w-.34,.086,.052);
      for(let x=-edge+.38;x<edge-.30;x+=1.44)box('gunmetal',x,ceiling-.140,d,.094,.191,.125);
    }
  }
  function rug(tile,u,d,W,L){
    box('rubBack',u,.006,d,W+.013,.011,L+.013);
    const U=tile*.25,V=.005,Q=.24,y=.014;
    const a=xyz(u-W/2,y,d-L/2),b=xyz(u+W/2,y,d-L/2),c=xyz(u+W/2,y,d+L/2),h=xyz(u-W/2,y,d+L/2);
    k.triangle('woven',a,b,c,[U+.005,V,U+Q,V,U+Q,.995]);k.triangle('woven',a,c,h,[U+.005,V,U+Q,.995,U+.005,.995]);
    for(let x=u-W*.46;x<u+W*.47;x+=.043)for(const s of [-1,1])box('braid',x,.006,d+s*(L/2+.030),.011,.006,.06+(rng()*.018));
  }
  if(i===2)rug(0,-2.09,3.29,1.49,1.39);
  if(i===4)rug(1,-1.93,4.08,1.20,2.46);
  if(i===5)rug(2,-.26,5.06,2.08,.72);
  if(i===6)rug(3,-2.30,4.05,.81,1.58);
}
