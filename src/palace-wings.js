import {architectureKit} from './architecture-kit.js';
import {HALL,WINGS} from './palace-openings.js';
import {randomSource} from './surface-detail.js';
import {aroundLabOpening,labLower} from './lab-layout.js';
import {furnishSouthGallery} from './south-gallery.js';
import {furnishNorthLibrary} from './north-library.js';

const Y=HALL.floor,{z:Z,outer,portal,spring,rise,ceiling,partition}=WINGS;

export function interiorArch(k,p,span,top,{half=portal,thickness=.25,brick=.17}={}){
  for(const [a,b] of [[-span,-half],[half,span]])k.box('limewash',p,a,b,Y,top,-thickness,0);
  for(const a of [-half-brick,half])k.box('cut',p,a,a+brick,Y,spring,-thickness,.071);
  k.box('limewash',p,-half,half,spring+rise+brick,top,-thickness,0);
  const curve=(a,r,h,d)=>p(Math.cos(a)*r,spring+Math.sin(a)*h,d);
  const n=20;
  for(let i=0;i<n;i++){
    const a=i*Math.PI/n,b=(i+1)*Math.PI/n;
    for(const [m,d,r,h] of [['cut',.064,half+brick,rise+brick],['limewash',-thickness,half,rise]]){
      const x=curve(a,half,rise,d),y=curve(b,half,rise,d);
      if(d>0)k.quad(m,y,x,curve(a,r,h,d),curve(b,r,h,d),1.3);
      else k.quad(m,x,y,p(Math.cos(b)*half,spring+rise+brick,d),p(Math.cos(a)*half,spring+rise+brick,d));
    }
    const t=curve(a,half,rise,.065),u=curve(b,half,rise,.065);
    k.quad('cut',t,u,curve(b,half,rise,-thickness),curve(a,half,rise,-thickness));
    const r=half+brick,head=spring+rise+brick;
    k.quad('limewash',curve(b,r,rise+brick,0),curve(a,r,rise+brick,0),
      p(Math.min(half,Math.cos(a)*r),head,0),p(Math.max(-half,Math.cos(b)*r),head,0));
  }
  for(const side of [-1,1]){
    const a=side*half;
    k.box('cut',p,a-.18,a+.18,spring-.085,spring+.007,-thickness,.124);
    k.box('cut',p,a-.19,a+.19,Y,Y+.20,-thickness,.11);
  }
}

export function addPalaceWings(T,root,world,common,poster){
  const group=new T.Group();group.name='Schloss · Galerie und Lesesaal';root.add(group);
  const std=(color,roughness=.92,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const copy=(mat,color)=>{const m=mat.clone();m.color.setHex(color);m.vertexColors=false;return m;};
  const materials={
    limewash:common.limewash,cut:common.cut,limestone:common.limestone,
    roof:std(0xded4c5,.94),red:std(0x946855,.91),blue:std(0x708181,.92),
    darkWood:copy(common.oak,0x765746),wood:copy(common.oak,0xb29070),panel:copy(common.oak,0x9e7d63),
    tile0:copy(common.floor,0xcabfad),tile1:copy(common.floor,0x8e8d82),tile2:copy(common.floor,0xb5a895),
    brass:std(0xa3895b,.51,{metalness:.52}),iron:std(0x4e4b40,.79),
    ivory:std(0xddd1ab),paper:std(0xb9a681),rug:std(0x744e47),rugStripe:std(0xa58f64),
    flame:std(0xffe5bf,.58,{emissive:0xffcf87,emissiveIntensity:.72}),
    panes:std(0x697e94,.47,{emissive:0xa8bdd8,emissiveIntensity:.12}),
    bookA:std(0x6e4940),bookB:std(0x515f4c),bookC:std(0x4a5b68),bookD:std(0x8b7356)
  };
  const lightSites=[];
  const lamps=Array.from({length:3},()=>{
    const light=new T.PointLight(0xffdfb5,0,9.8,2);group.add(light);return light;
  });
  const cylinder=new T.CylinderGeometry(1,1,1,16),sphere=new T.SphereGeometry(1,14,9);
  const rng=randomSource(19171),v=new T.Vector3();
  const print=(title,tint,garden=false)=>{
    const canvas=document.createElement('canvas');canvas.width=520;canvas.height=300;
    const c=canvas.getContext('2d');c.fillStyle=tint;c.fillRect(0,0,520,300);
    c.strokeStyle='#c5af84';c.lineWidth=2;c.strokeRect(22,22,476,256);c.strokeRect(29,29,462,242);
    c.beginPath();
    if(garden){
      c.rect(124,72,272,120);c.moveTo(260,74);c.lineTo(260,191);
      for(const x of [184,336]){
        c.moveTo(x+53,132);c.ellipse(x,132,53,37,0,0,Math.PI*2);
        c.moveTo(x-51,132);c.lineTo(x+51,132);
        c.moveTo(x,96);c.lineTo(x,168);
      }
    }else{
      c.moveTo(71,199);c.lineTo(450,199);c.moveTo(120,191);c.lineTo(120,99);c.lineTo(260,64);c.lineTo(400,99);c.lineTo(400,191);
      for(let i=0;i<7;i++){
        const x=138+i*38;
        c.rect(x,113,17,62);c.moveTo(x-6,108);c.lineTo(x+23,108);
      }
    }
    c.stroke();
    c.fillStyle='#eee0be';c.textAlign='center';c.font='21px Georgia';c.fillText(title,260,241);
    const m=new T.CanvasTexture(canvas);m.colorSpace=T.SRGBColorSpace;m.anisotropy=4;return m;
  };
  const plaques=[print('ARCHITEKTUR UND GARTEN','#424d4d',true),print('SCHLOSS UND UNIVERSITÄT','#5b4540')];
  for(const sign of [-1,1]){
    const library=sign<0,rootWing=new T.Group();rootWing.name=library?'Nordflügel · Lesesaal':'Südflügel · Galerie';group.add(rootWing);
    const p=(u,y,d)=>[sign*u,y,sign*d],k=architectureKit(T,rootWing,materials);
    const box=(m,a,b,y,t,d,f)=>k.box(m,p,a,b,y,t,d,f);
    const block=(u0,u1,d0,d1)=>{
      const [a,,b]=p(u0,0,d0),[c,,e]=p(u1,0,d1);
      world.box(Math.min(a,c),Math.min(b,e),Math.max(a,c),Math.max(b,e),p=>!labLower(p.y));
    };
    const put=(m,g,u,y,d,s)=>{
      const M=new T.Matrix4().makeScale(...s);M.setPosition(v.set(...p(u,y,d)));k.geometry(m,g,M);
    };
    const start=HALL.half,high=ceiling,accent=library?'blue':'red';
    const floor=(m,l,r,b,t,d,f)=>{
      const spans=library?aroundLabOpening(l,r,d,f):[[l,r,d,f]];
      for(const [a,c,e,h] of spans)box(m,a,c,b,t,e,h);
    };
    // Matte perimeter, laid flags in the gallery, darker timber in the reading room.
    floor('iron',start,outer,Y-.09,Y-.013,-Z,Z);
    for(const d of [-Z,Z-.32])floor('tile2',start,outer,Y-.036,Y,d,d+.32);
    for(let d=-Z+.32,row=0;d<Z-.34;d+=library?.30:.84,row++){
      const width=library?1.68:.84,lim=Math.min(Z-.32,d+(library?.30:.84));
      for(let u=start-(row%2)*width*.5,col=0;u<outer-.015;u+=width,col++){
        const l=Math.max(start,u)+.005,r=Math.min(outer,u+width)-.005;
        if(r-l<.018)continue;
        floor(library?(row%5===col%5?'wood':'panel'):((row+col)%2?'tile0':'tile1'),l,r,Y-.028,Y,d+.004,lim-.005);
      }
    }
    box('limewash',outer,outer+.31,Y,high+.09,-Z-.01,Z+.01);
    box('limestone',outer-.065,outer,Y+.02,.19,-Z,Z);
    box('roof',start,outer+.02,high,high+.10,-Z,Z);
    // Projecting ceiling frames break the long room into bays.
    for(const u of [4.53,8.27,12.39,16.57,20.71,24.89,28.66]){
      box('cut',u-.14,u+.14,high-.167,high-.085,-Z+.095,Z-.095);
      box('limestone',u-.095,u+.095,high-.097,high+.005,-Z+.10,Z-.10);
    }
    const threshold=(d,y,a)=>p(partition-a,y,d);
    interiorArch(k,threshold,Z,high,{half:1.53,brick:.20,thickness:.28});
    for(const [a,b] of [[-Z,-1.53],[1.53,Z]])block(partition-.08,partition+.28,a,b);
    box('cut',partition-.21,partition+.37,Y-.002,Y+.023,-1.48,1.48);
    for(const side of [-1,1]){
      const edge=(u,y,d)=>p(side*u,y,side*(Z-d));
      const a=side===1?start:-outer,b=side===1?outer:-start;
      const wall=(m,l,r,y,t,d,f)=>k.box(m,edge,l,r,y,t,d,f);
      const windows=(sign*side>0?[9.99,16.65,19.98,23.31,26.64]:[16.65,19.98,23.31,26.64])
        .map(u=>u*side).sort((x,y)=>x-y);
      let prior=a;
      for(const center of windows){
        const l=center-.69,r=center+.69,bottom=1.25,top=3.43;
        wall('limewash',prior,l,Y,high,-.24,0);prior=r;
        wall('limestone',l,r,Y,bottom,-.24,0);
        wall('limewash',l,r,top,high,-.24,0);
        wall('panes',l+.016,r-.016,bottom+.024,top-.012,-.243,-.226);
        wall('cut',l-.14,r+.14,bottom-.11,bottom+.012,-.21,.125);
        wall('cut',l-.068,r+.068,top,top+.103,-.20,.064);
        for(const x of [l,r-.050])wall('wood',x,x+.050,bottom,top,-.213,-.12);
        for(const x of [center-.024,center+.215,center-.250])wall('darkWood',x,x+.041,bottom,top,-.218,-.194);
        for(const y of [2.30,2.89])wall('darkWood',l,r,y-.022,y+.025,-.22,-.184);
      }
      wall('limewash',prior,b,Y,high,-.24,0);
      wall(library?'darkWood':'limestone',a,b,Y+.02,.88,.005,.042);
      wall('cut',a,b,.866,.945,.019,.104);
      wall('limestone',a,b,3.96,4.124,.013,.097);
      wall('cut',a,b,4.111,4.181,.018,.150);
      const axes=[5.12,8.10,12.34,15.04,18.23,21.55,24.70,28.76];
      for(const U of axes){
        const u=U*side;
        wall('limestone',u-.146,u+.146,.19,3.966,-.018,.074);
        wall('cut',u-.192,u+.192,.194,.289,-.016,.106);
        wall('cut',u-.203,u+.203,3.82,3.971,-.016,.121);
      }
      for(const U of [6.61,11.0,14.92,18.27,21.65,25.15,28.21]){
        if(windows.some(w=>Math.abs(w-side*U)<1.02))continue;
        const u=side*U;
        wall(accent,u-.73,u+.73,1.20,3.63,.002,.026);
        for(const x of [u-.75,u+.75])wall('cut',x-.029,x+.029,1.13,3.69,.02,.064);
        for(const y of [1.15,3.66])wall('cut',u-.78,u+.78,y-.030,y+.030,.018,.069);
      }
    }
    function luminaire(u,d,h,wall=false){
      const drop=wall?.19:.61;
      box('brass',u-.016,u+.016,h-drop,h+.016,d-.018,d+.018);
      put('brass',cylinder,u,h-drop+.022,d,[.159,.038,.159]);
      put('flame',sphere,u,h-drop-.107,d,[.102,.147,.102]);
      put('brass',cylinder,u,h-drop-.229,d,[.112,.017,.112]);
      for(const [i,j] of [[-1,-1],[1,-1],[-1,1],[1,1]])box('iron',u+i*.109-.008,u+i*.109+.008,
        h-drop-.217,h-drop+.013,d+j*.109-.008,d+j*.109+.008);
      if(!wall){
        lightSites.push(p(u,h-drop-.231,d));
      }
    }
    for(const u of [7.72,16.77,24.55])luminaire(u,0,4.27);
    for(const d of [-5.4,5.4])luminaire(27.99,d,3.32,true);
    function information(u,y,d,w,h,image){
      const mat=new T.MeshStandardMaterial({map:image,roughness:.89});
      const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);
      m.position.set(...p(u,y,d));m.rotation.y=sign===1?-Math.PI*.5:Math.PI*.5;rootWing.add(m);
    }
    function rack(u,d,w=2.42){
      const l=u-w*.5,r=u+w*.5;
      box('darkWood',l-.11,r+.11,Y,3.33,d-.13,d+.43);
      box('panel',l-.15,r+.15,Y+.05,.19,d+.39,d+.52);
      for(const u of [l,r-.049])box('wood',u,u+.048,.21,3.44,d+.39,d+.52);
      for(const y of [.24,.76,1.27,1.78,2.29,2.80,3.31]){
        box('wood',l,r,y-.043,y+.010,d+.37,d+.58);
        if(y>3.25)continue;
        for(let x=l+.061;x<r-.12;){
          const w=.047+rng()*.098,h=.205+rng()*.237;
          box(['bookA','bookB','bookC','bookD'][Math.floor(rng()*4)],x,x+w,y+.014,y+h,d+.433,d+.552);
          if(rng()>.31)box('brass',x+.009,x+w-.009,y+h-.06,y+h-.049,d+.549,d+.556);
          x+=w+.010+rng()*.010;
        }
      }
      box('wood',l-.18,r+.18,3.31,3.44,d+.31,d+.61);
      block(l-.13,r+.13,d-.11,d+.60);
    }
    if(library){
      furnishNorthLibrary(T,rootWing,world,materials);
      for(const [u,d] of [[8.38,-6.12],[14.45,-6.30],[17.13,-6.30],[19.81,-6.30],[22.50,-6.30],[25.18,-6.30]])rack(u,d);
      for(const [u,d] of [[18.18,1.55],[23.36,1.55]]){
        box('darkWood',u-1.56,u+1.56,.832,.932,d-.62,d+.62);
        box('wood',u-1.52,u+1.52,.923,.953,d-.591,d+.591);
        for(const U of [u-1.41,u+1.41])for(const D of [d-.49,d+.49]){
          put('darkWood',cylinder,U,.45,D,[.066,.81,.066]);
          put('wood',sphere,U,.69,D,[.083,.135,.083]);
        }
        block(u-1.54,u+1.54,d-.61,d+.61);
        for(const D of [d-1.07,d+1.05]){
          box('wood',u-.319,u+.319,.449,.509,D-.25,D+.25);
          for(const U of [u-.248,u+.248])for(const DD of [D-.185,D+.185])box('darkWood',U-.032,U+.032,Y,.499,DD-.031,DD+.031);
          const f=D<d?-.219:.219;
          box('wood',u-.273,u+.273,.697,1.05,D+f-.025,D+f+.025);
          block(u-.32,u+.32,D-.25,D+.25);
        }
        box('bookC',u-.58,u-.10,.953,.988,d-.18,d+.16);
        box('paper',u-.565,u-.103,.985,.997,d-.164,d+.147);
        put('brass',cylinder,u+.92,1.01,d-.10,[.102,.095,.102]);
        put('brass',cylinder,u+.92,1.15,d-.10,[.022,.25,.022]);
        put('flame',sphere,u+.92,1.331,d-.10,[.18,.111,.13]);
      }
    }else{
      furnishSouthGallery(T,rootWing,world,materials,poster);
      for(const [l,r] of [[5.7,10.72],[14.45,26.20]]){
        box('rug',l,r,Y+.001,Y+.013,-1.19,1.19);
        for(const d of [-1.13,1.065])box('rugStripe',l+.115,r-.12,Y+.012,Y+.016,d,d+.062);
      }
    }
    for(const d of [-3.16,3.16]){
      box('darkWood',outer-.162,outer-.06,1.37,3.23,d-1.53,d+1.53);
      box('brass',outer-.186,outer-.156,1.42,3.18,d-1.48,d+1.48);
      information(outer-.191,2.30,d,2.82,1.60,plaques[d*sign>0?1:0]);
    }
    const naming=document.createElement('canvas');naming.width=496;naming.height=95;
    const ctx=naming.getContext('2d');ctx.fillStyle='#524838';ctx.fillRect(0,0,496,95);
    ctx.strokeStyle='#bca77c';ctx.lineWidth=2;ctx.strokeRect(7,7,482,81);
    ctx.fillStyle='#f1e4c8';ctx.textAlign='center';ctx.font='43px Georgia';ctx.fillText(library?'LESESAAL':'GALERIE',248,63);
    const nameMap=new T.CanvasTexture(naming);nameMap.colorSpace=T.SRGBColorSpace;
    information(start-.048,3.23,0,1.37,.24,nameMap);
    k.flush(rootWing.name);
  }
  cylinder.dispose();sphere.dispose();
  return {
    update(p,id){
      const engaged=Math.abs(p.z)<Z+.18&&Math.abs(p.x)<outer+.09;
      const nearest=engaged?lightSites.map(point=>({point,d:(point[0]-p.x)**2+(point[2]-p.z)**2}))
        .sort((a,b)=>a.d-b.d).slice(0,lamps.length):[];
      lamps.forEach((light,i)=>{
        const target=nearest[i];
        if(target)light.position.fromArray(target.point);
        light.intensity=target&&target.d<143?(id==='night'?17:14):0;
      });
    },
    setPreset(id){materials.panes.emissiveIntensity=id==='night'?.041:.18;}
  };
}
