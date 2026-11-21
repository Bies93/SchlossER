import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {architectureKit} from './architecture-kit.js';
import {randomSource,sharedSet} from './surface-detail.js';

const xyz=(x,y,z)=>[x,y,z];
const PI=Math.PI;
const THEMES=[
  ['#282f2c','#b0ada1','#e5d6ad'],['#ddd1ae','#7b392d','#322e29'],
  ['#3e222a','#b6773e','#f2d59f'],['#183438','#6dada0','#bde9bf'],
  ['#162322','#c38f6d','#f1cab4']
];

export function atticFittings(T,F){
  const map=(k,t,r=.91,m=0,kN=.52)=>new T.MeshStandardMaterial({
    ...sharedSet(T,k,256),color:t,roughness:r,metalness:m,normalScale:new T.Vector2(kN,kN)
  });
  const plain=(color,roughness=.82,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const lit=(color,n=.57)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:n,roughness:.65});
  const m={
    oak:map('fineOak',0x826649),blackwood:map('fineOak',0x5b4a3e),lacquer:map('fineOak',0xaa7459),
    chalk:map('plaster',0xac9c81),coating:map('enamel',0x82928a),olive:map('enamel',0x718371),
    slate:map('enamel',0x667881),oxblood:map('enamel',0x965a49),ivory:map('enamel',0xccc19f),
    metal:map('cutMetal',0x676460,.73,.49),nickel:map('cutMetal',0xb8b1a0,.52,.62),
    brass:map('cutMetal',0xaa8856,.71,.54),rust:map('enamel',0x895a4d,.9,.18),
    carpet:map('canvas',0x70383a,.98,0,.85),canvas:map('canvas',0x566968,.98,0,.86),
    paper:map('canvas',0xc6b898,.93,0,.12),letter:plain(0xddd1a8,.93),
    cloth:map('canvas',0x9d8666,.98),redCloth:map('canvas',0x8c5555,.95),
    soot:plain(0x231f1e),cream:plain(0xc8bca0,.82),black:plain(0x312f2a,.90),
    dried:map('plaster',0x552623,.82,0,.19),smear:map('plaster',0x6e302a,.79,0,.16),
    glass:new T.MeshStandardMaterial({color:0x9ec3b7,transparent:true,opacity:.17,depthWrite:false,roughness:.20,metalness:.21}),
    bulb:lit(0xf5d6a5,.66),red:lit(0xe77650,.64),green:lit(0x84bf9d,.65),
    print:new T.MeshStandardMaterial({roughness:.94})
  };
  const geometry={block:new RoundedBoxGeometry(1,1,1,1,.067),tube:new T.CylinderGeometry(1,1,1,12),
    cone:new T.CylinderGeometry(.63,1,1,14),sphere:new T.SphereGeometry(1,12,8),
    ring:new T.TorusGeometry(1,.101,6,22),sheet:new T.PlaneGeometry(1,1)};
  const matrix=new T.Matrix4(),P=new T.Vector3(),D=new T.Vector3(),scale=new T.Vector3(),rot=new T.Quaternion(),
    E=new T.Euler(),up=new T.Vector3(0,1,0);
  const atlas=[],cache=new Map(),pending=[];
  function draw(canvas,title,lines,theme=0,signal=''){
    const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height,[bg,ink,fg]=THEMES[theme];
    g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle=ink;g.lineWidth=Math.max(1,W/260);g.strokeRect(W*.024,H*.06,W*.952,H*.88);
    const rng=randomSource(9105+title.length);
    for(let i=0;i<W*.9;i++){
      g.fillStyle=i%3?'#ffe3ad0f':'#0c11132c';g.fillRect(rng()*W,rng()*H,1+rng()*3,1+rng()*2);
    }
    g.textBaseline='middle';g.textAlign='center';
    g.font='bold '+Math.floor(Math.min(H*(lines.length?.228:.40),W*.120))+'px '+(theme>=3?'monospace':'Georgia');
    g.fillStyle=fg;g.fillText(title,W*.5,H*(lines.length?.342:.51),W*.88);
    if(signal){
      g.font='bold '+Math.floor(H*.080)+'px monospace';g.fillStyle=ink;g.fillText(signal,W*.50,H*.145,W*.82);
    }
    for(let i=0;i<lines.length;i++){
      const h=Math.floor(Math.min(H*.16,H*.42/lines.length,W*.065));
      g.font=(theme>=3?'bold ':'')+h+'px monospace';g.fillStyle=theme===1?ink:fg;
      g.fillText(lines[i],W*.5,H*(.59+i*.299/Math.max(1.6,lines.length-1)),W*.89);
    }
  }
  function builder(parent,world=null){
    const k=architectureKit(T,parent,m);
    function box(key,x,y,z,w,h,d){
      k.box(key,xyz,x-w/2,x+w/2,F+y-h/2,F+y+h/2,z-d/2,z+d/2);
    }
    function shape(key,g,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
      k.geometry(key,geometry[g],matrix.compose(P.set(x,F+y,z),rot.setFromEuler(E.set(rx,ry,rz)),scale.set(sx,sy,sz)));
    }
    function rod(key,[x,y,z],[u,v,w],radius){
      P.set(x,F+y,z);D.set(u-x,v-y,w-z);
      const n=D.length();if(n<.0001)return;
      k.geometry(key,geometry.tube,matrix.compose(P.addScaledVector(D,.5),rot.setFromUnitVectors(up,D.normalize()),scale.set(radius,n,radius)));
    }
    function hit(x,z,w,d){world?.box(x-w/2,z-d/2,x+w/2,z+d/2)}
    function plate(x,y,z,w,h,ry,title,lines=[],theme=0,signal='',rx=0){
      const key=JSON.stringify([title,lines,theme,signal]);
      let id=cache.get(key);
      if(id===undefined){id=atlas.length;atlas.push({title,lines,theme,signal});cache.set(key,id);}
      pending.push({k,x,y,z,w,h,ry,rx,id});
    }
    function framed(x,y,z,w,h,ry,title,lines=[],theme=0,signal=''){
      shape('blackwood','block',x,y,z,w+.068,h+.073,.055,0,ry);
      const sin=Math.sin(ry),cos=Math.cos(ry);
      plate(x+.031*sin,y,z+.031*cos,w,h,ry,title,lines,theme,signal);
      for(const i of [-1,1])for(const j of [-1,1]){
        const a=i*(w*.5+.008),b=.034;
        shape('brass','tube',x+a*cos+b*sin,y+j*(h*.5+.008),z-a*sin+b*cos,.009,.011,.009,PI/2,ry);
      }
    }
    function glazes(x,y,z,w,h,d){
      const pane=new T.Mesh(new T.BoxGeometry(w,h,d),m.glass);pane.position.set(x,F+y,z);
      pane.userData.noSceneQuery=true;parent.add(pane);return pane;
    }
    function screen(x,y,z,w,h,ry,initial,caption,theme=3){
      shape('metal','block',x,y,z,w+.065,h+.055,.055,0,ry);
      const a=document.createElement('canvas');a.width=384;a.height=192;
      const texture=new T.CanvasTexture(a);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
      const mat=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xe5d4b5,emissiveIntensity:.22,roughness:.81});
      const panel=new T.Mesh(new T.PlaneGeometry(w,h),mat);panel.rotation.y=ry;
      panel.position.set(x+.032*Math.sin(ry),F+y,z+.032*Math.cos(ry));panel.userData.noSceneQuery=true;parent.add(panel);
      let prev;
      function set(title,lines=caption){
        const next=title+'|'+lines?.join('|');if(prev===next)return;
        prev=next;draw(a,title,lines??[],theme);texture.needsUpdate=true;
      }
      set(initial);return {set,mat};
    }
    function table(x,z,w,d,h=.95,key='oak'){
      shape(key,'block',x,h-.045,z,w,.09,d);
      box('blackwood',x,h-.138,z,w-.16,.103,d-.13);
      for(const dx of [-1,1])for(const dz of [-1,1]){
        const X=x+dx*(w/2-.13),Z=z+dz*(d/2-.13);
        box('metal',X,(h-.19)*.5,Z,.071,h-.19,.071);
        box('brass',X,.033,Z,.115,.052,.115);
      }
      box('metal',x,.25,z,w-.23,.055,.052);
      hit(x,z,w-.04,d-.04);
    }
    function chair(x,z,ry=0,{uphol='carpet',arms=false,seat=.48}={}){
      const a=Math.cos(ry),b=Math.sin(ry),at=(u,v)=>[x+a*u+b*v,z+a*v-b*u];
      const S=(key,g,u,y,v,sx,sy,sz)=>{const [X,Z]=at(u,v);shape(key,g,X,y,Z,sx,sy,sz,0,ry);}
      S('blackwood','block',0,seat-.067,0,.56,.091,.58);
      S(uphol,'block',0,seat-.004,.011,.51,.057,.52);
      S('blackwood','block',0,seat+.44,-.259,.56,.485,.092);
      S(uphol,'block',0,seat+.44,-.206,.466,.385,.048);
      for(const i of [-1,1]){
        S('brass','block',i*.247,seat+.658,-.254,.029,.036,.102);
        for(const j of [-1,1])S('blackwood','block',i*.216,seat*.453,j*.208,.052,seat*.906,.057);
        if(arms){
          S('oak','block',i*.298,seat+.203,.008,.069,.051,.572);
          S('blackwood','block',i*.263,seat+.105,.162,.045,.221,.057);
        }
      }
      hit(x,z,.56,.56);
    }
    function papers(x,y,z,angle=0,n=3){
      for(let i=0;i<n;i++)shape(i%3?'paper':'letter','block',x+Math.sin(i*.98)*.022,y+i*.008,z+i*.011,.31,.007,.233,0,angle+i*.026);
      plate(x,y+n*.008+.002,z+(n-1)*.011,.265,.184,angle,'SCHWARZE KRONE',['Exemplar bleibt im Schloss'],1,'',-PI/2);
    }
    function reel(x,y,z,side=-1,s=1){
      const rot=side<0?PI:0,front=z+side*.174*s;
      shape('black','block',x,y+.228*s,z,.77*s,.435*s,.335*s);
      shape('slate','block',x,y+.248*s,front,.698*s,.367*s,.024*s,0,rot);
      for(const a of [-1,1]){
        const u=x+a*.159*s;
        shape('nickel','tube',u,y+.324*s,front+side*.021*s,.106*s,.027*s,.106*s,PI/2);
        shape('soot','tube',u,y+.324*s,front+side*.042*s,.074*s,.024*s,.074*s,PI/2);
        for(let n=0;n<3;n++){
          const h=n*PI*2/3;
          shape('brass','block',u+.049*s*Math.sin(h),y+.324*s+.049*s*Math.cos(h),front+side*.059*s,.024*s,.063*s,.010*s,0,0,-h);
        }
      }
      for(let n=0;n<5;n++)box(n===0?'red':'ivory',x+(n-2)*.061*s,y+.117*s,front+side*.032*s,.036*s,.024*s,.031*s);
    }
    function roofLamp(x,z,y=3.10,type='bulb'){
      rod('metal',[x,y+.08,z],[x,3.80,z],.023);
      box('metal',x,3.801,z,.122,.025,.122);
      shape('coating','cone',x,y+.04,z,.267,.143,.267);
      shape(type,'sphere',x,y-.087,z,.164,.079,.164);
      for(const a of [-1,1])for(const b of [-1,1])
        rod('metal',[x+a*.139,y+.029,z+b*.139],[x+a*.107,y-.136,z+b*.107],.009);
      shape('brass','ring',x,y-.138,z,.142,.142,.069,PI*.5);
    }
    function runner(x,z,w,d,key='carpet'){
      box(key,x,.012,z,w,.004,d);
      for(const s of [-1,1]){
        box('brass',x+s*(w/2-.065),.015,z,.014,.002,d-.083);
        box('brass',x,.015,z+s*(d/2-.045),w-.129,.002,.012);
      }
    }
    return {parent,k,box,shape,rod,hit,plate,framed,screen,glazes,table,chair,papers,reel,roofLamp,runner};
  }
  function finish(builders){
    const cols=4,cw=384,ch=192,n=Math.ceil(atlas.length/cols);
    const canvas=document.createElement('canvas');canvas.width=cols*cw;canvas.height=n*ch;
    const chunk=document.createElement('canvas');chunk.width=cw;chunk.height=ch;
    const c=canvas.getContext('2d');
    atlas.forEach((a,i)=>{
      draw(chunk,a.title,a.lines,a.theme,a.signal);
      c.drawImage(chunk,(i%cols)*cw,Math.floor(i/cols)*ch);
    });
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;m.print.map=tex;m.print.needsUpdate=true;
    for(const {k,x,y,z,w,h,ry,rx,id} of pending){
      const g=geometry.sheet.clone(),uv=g.attributes.uv,u=(id%cols)*cw,v=Math.floor(id/cols)*ch;
      for(let j=0;j<uv.count;j++)uv.setXY(j,(u+2+uv.getX(j)*(cw-4))/canvas.width,1-(v+ch-2-uv.getY(j)*(ch-4))/canvas.height);
      k.geometry('print',g,matrix.compose(P.set(x,F+y,z),rot.setFromEuler(E.set(rx,ry,0,'YXZ')),scale.set(w,h,1)));
      g.dispose();
    }
    for(const b of builders)b.k.flush(b.parent.name);
    for(const g of Object.values(geometry))g.dispose();
    atlas.length=0;pending.length=0;cache.clear();
  }
  return {builder,finish,m};
}
