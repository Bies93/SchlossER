import {randomSource} from './surface-detail.js';

const palettes=['#564737','#813d36','#404d5e','#55583d','#634c42','#8a694c','#424a3e','#65404b'];
const titles=['ARCHIV','REGISTER','ERLANGEN','BAUKUNST','GARTEN','CHRONIK','SAMMLUNG','NACHTRAG'];
const paperTitles=['KARTEI','PRÜFBOGEN','VERZEICHNIS','NOTIZEN','RÜCKGABE','CHARGE 05','AKTE F','PERSONAL'];
const W=1024,H=768,CW=128,CH=384;
let shared;
function atlas(T){
  if(shared)return shared;
  const sheet=document.createElement('canvas');sheet.width=W;sheet.height=H;
  const c=sheet.getContext('2d'),rng=randomSource(639250);
  for(const [i,color] of palettes.entries()){
    c.save();c.translate(i*CW,0);
    for(let mode=0;mode<2;mode++){
      const top=mode*CH;
      c.fillStyle=mode?(i%3===1?'#a58560':'#c8b58d'):color;c.fillRect(0,top,CW,CH);
      for(let j=0;j<710;j++){
        c.fillStyle=j%2?'#21181116':'#ffedba18';c.fillRect(rng()*CW,top+rng()*CH,1+rng()*4,1+rng()*2.2);
      }
      c.strokeStyle=mode?'#776047':'#c3a269';c.lineWidth=2;
      c.strokeRect(7,top+9,CW-14,CH-18);
      const stroke=(a,b,y)=>{c.beginPath();c.moveTo(a,top+y);c.lineTo(b,top+y);c.stroke();};
      c.textAlign='center';
      if(!mode){
        for(const y of [27,37,90,278,327,352,365])stroke(7,121,y);
        c.fillStyle='#ded0a0';c.font='bold 16px Georgia';c.fillText(titles[i],64,132,109);
        c.font='15px Georgia';c.fillText('BAND '+(i+1),64,170,95);
        c.strokeRect(38,202,52,44);c.fillText(String(1800+i*7),64,230,48);
        c.fillStyle='#bdad8a';c.fillRect(27,290,74,29);c.fillStyle='#3f3628';c.font='16px monospace';c.fillText('A / 0'+(i+1),64,309,69);
      }else{
        c.fillStyle='#e5d9b8';c.fillRect(13,top+43,102,233);
        c.fillStyle='#523e30';c.font='bold 14px monospace';c.fillText(paperTitles[i],64,top+68,92);
        c.lineWidth=1;
        for(let j=0;j<12;j++)stroke(22,106-(j%4)*5,81+j*14);
        c.strokeStyle='#815445';c.strokeRect(63,top+223,47,33);
        c.fillStyle='#815445';c.font='10px monospace';c.fillText('ABLAGE',86,top+241,44);
        c.fillStyle='#65503e';c.fillRect(16,top+298,22,28);c.fillRect(13,top+334,29,3);
        c.font='13px monospace';c.fillText('F / 0'+(i+1),76,top+318,64);
      }
    }
    c.restore();
  }
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  shared=new T.MeshStandardMaterial({map,roughness:.92});
  return shared;
}

// Mass, boards and paper edges are geometry; lettering and wear are batched
// across the whole room on one atlas. No material or texture per book.
export function stationery(T,k,parent,{cloth=['bookA','bookB','bookC'],sheets='paper',clip='brass'}={}){
  const pos=[],uv=[];
  function print(a,b,c,d,i,mode){
    i=(i%palettes.length+palettes.length)%palettes.length;
    const l=(i*CW+3)/W,r=((i+1)*CW-3)/W,t=1-(mode*CH+5)/H,v=1-((mode+1)*CH-5)/H;
    pos.push(...a,...b,...c,...a,...c,...d);uv.push(l,v,r,v,r,t,l,v,r,t,l,t);
  }
  function book(p,w,h,d,i){
    const m=cloth[i%cloth.length],t=.0045;
    k.box(sheets,p,-w*.5+t,w*.5-t,.007,h-.008,-d+.005,-.009);
    for(const a of [-w*.5,w*.5-t])k.box(m,p,a,a+t,0,h,-d,0);
    k.box(m,p,-w*.5,w*.5,0,h,-.010,.004);
    print(p(-w*.5,.003,.005),p(w*.5,.003,.005),p(w*.5,h-.003,.005),p(-w*.5,h-.003,.005),i,0);
  }
  function folio(x,y,z,w,l,angle,i,{loose=false,thickness=.024}={}){
    const c=Math.cos(angle),s=Math.sin(angle),m=cloth[i%cloth.length];
    const p=(a,v,t)=>[x+c*a-s*v,y+t,z-s*a-c*v];
    const B=w*.5,L=l*.5,t=thickness,g=.003;
    if(!loose)k.box(m,p,-B,B,-L,L,0,g);
    k.box(sheets,p,-B+.004,B-.006,-L+.007,L-.006,loose?0:g,t-g);
    if(!loose)k.box(m,p,-B,B,-L,L,t-g,t);
    print(p(-B+.003,-L+.003,t+.001),p(B-.003,-L+.003,t+.001),p(B-.003,L-.003,t+.001),p(-B+.003,L-.003,t+.001),i,1);
    if(loose||i%3===0){
      for(const x of [-.024,.024])k.box(clip,p,x-.0025,x+.0025,L-.058,L-.020,t+.002,t+.008);
      k.box(clip,p,-.023,.023,L-.024,L-.019,t+.002,t+.008);
    }
  }
  function finish(name='Bücher und Akten · Beschriftung'){
    if(!pos.length)return;
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
    const m=new T.Mesh(g,atlas(T));m.name=name;m.receiveShadow=true;parent.add(m);
  }
  return {book,folio,finish};
}
