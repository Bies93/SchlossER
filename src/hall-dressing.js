import {HALL} from './palace-openings.js';
import {randomSource} from './surface-detail.js';

const {floor:Y,half}=HALL,TAU=Math.PI*2;
const subjects=['Der Schlossplatz','Die Gartenachse','Die Orangerie','Studie zum Gewölbe'];

// Four original architectural prints in a single lightweight texture. The
// motifs are interpretive sketches, not copies of historic plans or photos.
function printAtlas(T){
  const sheet=document.createElement('canvas');sheet.width=1024;sheet.height=768;
  const ctx=sheet.getContext('2d');
  const rng=randomSource(58103);
  for(const [i,title] of subjects.entries()){
    ctx.save();ctx.translate(i%2*512,Math.floor(i/2)*384);
    ctx.beginPath();ctx.rect(0,0,512,384);ctx.clip();
    const c=ctx;
    c.fillStyle='#e7dcc1';c.fillRect(0,0,512,384);
    c.fillStyle='#c9b99b';c.fillRect(0,0,512,12);c.fillRect(0,370,512,14);
    for(let n=0;n<2850;n++){
      c.fillStyle=n%3?'#6b523417':'#fbf3dd54';c.fillRect(rng()*512,rng()*384,rng()*3.1+.6,rng()*1.5+.5);
    }
    c.strokeStyle='#a48c6d';c.lineWidth=1.25;c.strokeRect(18,18,476,348);
    c.strokeRect(22,22,468,340);
    const ink=i===1?'#3d574d':'#5b4b3b';
    c.strokeStyle=ink;c.lineWidth=2.15;
    const line=(...ps)=>{c.beginPath();ps.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
    if(i===1){
      c.fillStyle='#90a08483';c.fillRect(103,99,306,182);
      c.strokeRect(214,57,84,38);c.strokeRect(95,97,322,184);
      for(const x of [164,348]){
        c.fillStyle='#6e8a6942';c.beginPath();c.ellipse(x,185,50,64,0,0,TAU);c.fill();c.stroke();
        c.strokeRect(x-49,120,98,130);
        for(const side of [-1,1])line([x,113],[x+side*49,187],[x,256]);
        for(const y of [139,187,234]){
          c.beginPath();c.ellipse(x,y,11,8,0,0,TAU);c.stroke();
        }
      }
      line([256,100],[256,282]);line([247,100],[247,282]);line([265,100],[265,282]);
      c.beginPath();c.ellipse(256,185,20,19,0,0,TAU);c.stroke();
      for(const x of [106,408])for(let y=118;y<273;y+=19){
        c.beginPath();c.arc(x,y,3.6,0,TAU);c.stroke();
      }
    }else if(i===3){
      c.fillStyle='#a8947350';c.fillRect(105,195,300,77);
      line([104,282],[104,196]);line([405,282],[405,196]);line([81,282],[429,282]);
      for(const [i,r] of [150,161,175].entries()){
        c.beginPath();c.ellipse(255,198,r,96+i*10,0,Math.PI,TAU);c.stroke();
      }
      for(let j=1;j<12;j++){
        const a=j*Math.PI/12;
        line([255-Math.cos(a)*150,198-Math.sin(a)*96],[255-Math.cos(a)*175,198-Math.sin(a)*116]);
      }
      c.setLineDash([5,4]);line([255,56],[255,276]);line([75,197],[434,197]);c.setLineDash([]);
      for(const x of [104,405]){
        c.strokeRect(x-13,195,26,84);
        c.strokeRect(x-19,189,38,10);
      }
    }else{
      const r=i===2,lo=r?99:62,hi=512-lo,top=r?134:117,bot=268;
      c.fillStyle=r?'#7e9a994f':'#a38a6570';c.fillRect(lo,top,hi-lo,bot-top);
      c.strokeRect(lo,top,hi-lo,bot-top);
      line([lo-4,top],[lo+31,top-37],[hi-30,top-37],[hi+5,top]);
      line([lo-11,bot],[hi+11,bot]);line([lo-3,top+9],[hi+3,top+9]);
      for(const y of r?[top+32]:[top+57,top+103])line([lo,y],[hi,y]);
      for(let x=lo+12;x<hi-21;x+=r?26:28){
        for(const y of r?[top+39]:[top+17,top+64,top+111]){
          if(!r&&x>231&&x<267)continue;
          const w=r?15:13,h=r?71:30;
          c.fillStyle='#65777645';c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);line([x+w*.5,y],[x+w*.5,y+h]);
        }
      }
      if(!r){
        c.fillStyle='#c1aa84';c.fillRect(229,110,55,155);c.strokeRect(229,110,55,155);
        line([224,111],[256,86],[288,111]);c.strokeRect(246,177,20,29);c.strokeRect(245,225,22,40);
      }else for(const x of [lo-15,hi+14]){
        c.beginPath();c.ellipse(x,235,13,25,0,0,TAU);c.stroke();line([x,239],[x,270]);
      }
    }
    c.fillStyle=ink;c.textAlign='center';c.font='26px Georgia';c.fillText(title,256,325);
    c.font='10px Georgia';c.fillText('ERLANGEN  ·  ARCHITEKTURSKIZZE',256,346);
    c.restore();
  }
  const tex=new T.CanvasTexture(sheet);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}

export function hallDressing(T,k,room,world){
  const tmp=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3();
  const from=new T.Vector3(),delta=new T.Vector3(),up=new T.Vector3(0,1,0),rot=new T.Quaternion();
  const shaft=new T.CylinderGeometry(1,1,1,10),cap=new T.CylinderGeometry(1,1,1,6);
  cap.rotateY(Math.PI/6);
  const leg=new T.LatheGeometry([[0,0],[.044,0],[.045,.036],[.036,.081],[.046,.12],[.031,.21],[.052,.28],[.057,.31],[.048,.38],[0,.38]].map(p=>new T.Vector2(...p)),12);
  const obj=(m,g,p,s)=>{tmp.makeScale(...s);tmp.setPosition(pos.fromArray(p));k.geometry(m,g,tmp);};
  function rod(m,a,b,r,g=shaft){
    from.fromArray(a);delta.fromArray(b).sub(from);
    const l=delta.length();if(l<.001)return;
    tmp.compose(from.addScaledVector(delta,.5),rot.setFromUnitVectors(up,delta.normalize()),scale.set(r,l,r));k.geometry(m,g,tmp);
  }
  const artPos=[],artUV=[],haloPos=[],haloUV=[];
  function card(pos,uv,a,b,c,d,l=0,v=0,r=1,t=1){
    pos.push(...a,...b,...c,...a,...c,...d);uv.push(l,v,r,v,r,t,l,v,r,t,l,t);
  }
  const plaque=(p,x,y,w,h,i)=>{
    const ww=w*.5,hh=h*.5,d=.096;
    k.box('hallOak',p,x-ww-.071,x+ww+.071,y-hh-.067,y+hh+.067,-.005,.073);
    k.box('hallBronze',p,x-ww-.045,x+ww+.045,y-hh-.047,y+hh+.047,.068,.087);
    k.box('hallMat',p,x-ww-.032,x+ww+.032,y-hh-.031,y+hh+.031,.083,.093);
    const a=p(x-ww,y-hh,d),b=p(x+ww,y-hh,d),c=p(x+ww,y+hh,d),e=p(x-ww,y+hh,d);
    const l=i%2*.5+.004,r=l+.492,t=1-Math.floor(i/2)*.5-.005,v=t-.490;
    card(artPos,artUV,a,b,c,e,l,v,r,t);
  };
  function seatSlat(p,l,r,a,b){
    const y=Y+.404,top=Y+.449,f=.007,section=[
      [y,a+f],[y,b-f],[y+f,b],[top-f,b],[top,b-f],[top,a+f],[top-f,a],[y+f,a]
    ].reverse();
    // Constant lengthwise UVs run across the faces and their tiny chamfers.
    const centre=(u)=>p(u,(y+top)*.5,(a+b)*.5);
    for(let i=0;i<section.length;i++){
      const [h,d]=section[i],[H,D]=section[(i+1)%section.length];
      const L=(r-l)/1.45,v=a*.67,V=v+Math.hypot(H-h,D-d)/1.45;
      k.triangle('hallSeat',p(l,h,d),p(l,H,D),p(r,H,D),[0,v,0,V,L,V]);
      k.triangle('hallSeat',p(l,h,d),p(r,H,D),p(r,h,d),[0,v,L,V,L,v]);
      k.triangle('hallSeat',centre(l),p(l,H,D),p(l,h,d),[.5,.5,0,1,1,0]);
      k.triangle('hallSeat',centre(r),p(r,h,d),p(r,H,D),[.5,.5,0,1,1,0]);
    }
  };
  function bench(p,side,z){
    const u=z;
    for(const x of [u-.753,u+.753])for(const d of [.153,.507]){
      obj('hallOak',leg,p(x,Y,d),[1,1,1]);obj('metal',shaft,p(x,Y+.026,d),[.047,.051,.047]);
    }
    k.box('hallOak',p,u-.80,u+.80,Y+.299,Y+.373,.477,.527);
    k.box('hallOak',p,u-.80,u+.80,Y+.314,Y+.373,.141,.174);
    k.box('hallOak',p,u-.737,u+.737,Y+.189,Y+.238,.262,.315);
    for(const x of [u-.76,u+.76]){
      k.box('hallSeat',p,x-.043,x+.043,Y+.314,Y+.379,.161,.499);
      for(const d of [.205,.461])rod('hallBronze',p(x,Y+.444,d),p(x,Y+.457,d),.014);
    }
    k.box('hallSeat',p,u-.904,u+.904,Y+.372,Y+.413,.123,.554);
    for(const [a,b] of [[.129,.262],[.273,.406],[.416,.548]])seatSlat(p,u-.892,u+.892,a,b);
    for(const x of [u-.79,u+.79]){
      rod('hallOak',p(x,Y+.397,.145),p(x,Y+.835,.09),.038);
      obj('hallBronze',shaft,p(x,Y+.811,.094),[.042,.014,.042]);
    }
    k.box('hallSeat',p,u-.809,u+.809,Y+.664,Y+.807,.085,.141);
    world.box(side>0?half-.574:-half,side*z-.931,side>0?half:-half+.574,side*z+.931);
  }
  // Framework and glass are batched; the existing three central PointLights
  // supply the room. Diffusers are opaque, avoiding transparent overdraw.
  function lantern(x,z,top,bottom,r){
    const point=(a,y,R)=>[x+Math.cos(a)*R,y,z+Math.sin(a)*R];
    obj('hallBronze',shaft,[x,top-.015,z],[.116,.048,.116]);
    obj('metal',shaft,[x,top-.05,z],[.070,.044,.070]);
    rod('hallBronze',[x,top-.04,z],[x,bottom+.55,z],.014);
    obj('hallBronze',cap,[x,bottom+.506,z],[r*.67,.062,r*.67]);
    obj('metal',cap,[x,bottom+.443,z],[r,.066,r]);
    obj('hallBronze',cap,[x,bottom+.404,z],[r*1.005,.026,r*1.005]);
    obj('metal',cap,[x,bottom+.02,z],[r*.82,.047,r*.82]);
    obj('hallBronze',cap,[x,bottom-.015,z],[r*.68,.028,r*.68]);
    obj('hallBronze',shaft,[x,bottom-.052,z],[.036,.057,.036]);
    for(let i=0;i<6;i++){
      const a=i*TAU/6,b=(i+1)*TAU/6,yt=bottom+.40,yb=bottom+.043;
      const A=point(a,yt,r*.982),B=point(b,yt,r*.982),C=point(b,yb,r*.806),D=point(a,yb,r*.806);
      k.quad('hallShade',A,B,C,D);
      rod('hallBronze',point(a,yt+.014,r),point(a,yb-.008,r*.82),.014);
      rod('hallBronze',point(a,yb+.046,r*.845),point(b,yb+.046,r*.845),.008);
      rod('hallBronze',point(a,yt-.057,r*.982),point(b,yt-.057,r*.982),.007);
    }
  }
  function sconce(p,z){
    card(haloPos,haloUV,p(z-.64,1.48,.003),p(z+.64,1.48,.003),p(z+.64,2.98,.003),p(z-.64,2.98,.003));
    obj('hallBronze',shaft,p(z,1.96,.043),[.106,.22,.081]);
    const a=p(z,1.93,.068),b=p(z,1.91,.218),c=p(z,2.08,.267);
    rod('hallBronze',a,b,.022);rod('hallBronze',b,c,.019);
    obj('hallBronze',cap,p(z,2.08,.267),[.137,.035,.137]);
    obj('hallShade',cap,p(z,2.21,.267),[.114,.235,.114]);
    obj('metal',cap,p(z,2.337,.267),[.133,.021,.133]);
    obj('hallBronze',shaft,p(z,2.374,.267),[.028,.053,.027]);
    for(const dz of [-.095,.095])rod('hallBronze',p(z+dz,2.09,.287),p(z+dz,2.334,.287),.009);
  }
  function finish(){
    function faces(pos,uv,material,name){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
      const m=new T.Mesh(g,material);m.name=name;room.add(m);return m;
    }
    faces(artPos,artUV,new T.MeshStandardMaterial({map:printAtlas(T),roughness:.9}),
      'Halle · vier gerahmte Architekturstudien').receiveShadow=true;
    // Small, batched wall-light pools. No additional real-time point lights.
    const size=48,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const a=Math.max(0,1-Math.hypot((x+.5-size*.5)/24,(y+.5-size*.5)/24));
      data.set([246,186,112,Math.round(a**1.9*62)],(y*size+x)*4);
    }
    const glow=new T.DataTexture(data,size,size);glow.colorSpace=T.SRGBColorSpace;glow.needsUpdate=true;
    glow.minFilter=T.LinearFilter;glow.magFilter=T.LinearFilter;
    faces(haloPos,haloUV,new T.MeshBasicMaterial({map:glow,transparent:true,depthWrite:false}),
      'Halle · lokaler Lichtschein an der Wand');
    shaft.dispose();cap.dispose();leg.dispose();
  }
  return {plaque,bench,lantern,sconce,finish};
}
