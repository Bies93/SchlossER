import {architectureKit} from './architecture-kit.js';
import {HALL,WINGS} from './palace-openings.js';
import {randomSource,sharedSet} from './surface-detail.js';
import {stationery} from './interior-stationery.js';
import {aroundLabOpening,labLower} from './lab-layout.js';
import {furnishSouthGallery} from './south-gallery.js';
import {furnishNorthLibrary} from './north-library.js';
import {galleryHatch,splitHatchFloor} from './south-hatch.js';
import {gallerySurfaces,southGalleryArch,galleryRunners,galleryPrints} from './south-gallery-architecture.js';
import {palaceVisitors} from './npc-visitors.js';
import {masonryPortal} from './palace-interior-portal.js';
import {cofferedWing,wingCeilingMaterials,wingLampStations,wingLampMount} from './palace-wing-ceiling.js';

const Y=HALL.floor,{z:Z,outer,ceiling,partition}=WINGS;

export function addPalaceWings(T,root,world,common,poster,seal){
  const group=new T.Group();group.name='Schloss · Galerie und Lesesaal';root.add(group);
  const std=(color,roughness=.92,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const copy=(mat,color)=>{const m=mat.clone();m.color.setHex(color);m.vertexColors=false;return m;};
  // Opaque glazing: the interpreted rooms don't line up one-to-one with the
  // exterior bays. Use a soft sky reflection rather than an invented view.
  const paneData=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const sky=(y/63)**1.24,glint=Math.exp(-(((x-40+y*.25)/16)**2)),tone=19*sky+33*sky*glint;
    paneData.set([40+tone*.72,51+tone,62+tone*1.12,255],(y*64+x)*4);
  }
  const paneMap=new T.DataTexture(paneData,64,64);paneMap.colorSpace=T.SRGBColorSpace;paneMap.needsUpdate=true;
  paneMap.minFilter=T.LinearFilter;paneMap.magFilter=T.LinearFilter;
  const oak=sharedSet(T,'fineOak',256),plaster=sharedSet(T,'plaster',256);
  const uphillOak=Object.fromEntries(Object.entries(oak).map(([id,tex])=>{
    const grain=tex.clone();grain.rotation=Math.PI*.5;grain.center.set(.5,.5);grain.needsUpdate=true;return [id,grain];
  }));
  const materials={
    limewash:common.limewash,cut:common.cut,limestone:common.limestone,
    northLime:std(0xd9d1bd,.98,{...plaster,normalScale:new T.Vector2(.25,.25)}),
    roof:std(0xe8dfd1,.98,{...plaster,normalScale:new T.Vector2(.19,.19)}),red:std(0x946855,.91),blue:std(0x708181,.92),
    darkWood:copy(common.oak,0x765746),wood:copy(common.oak,0xb29070),panel:copy(common.oak,0x9e7d63),
    rackOak:std(0xc4a27d,.77,{...oak,normalScale:new T.Vector2(.34,.34)}),
    rackEdge:std(0xe0c4a0,.72,{...oak,normalScale:new T.Vector2(.33,.33)}),
    rackPost:std(0xc4a27d,.77,{...uphillOak,normalScale:new T.Vector2(.23,.23)}),
    rackPostEdge:std(0xe0c4a0,.74,{...uphillOak,normalScale:new T.Vector2(.23,.23)}),
    tile0:copy(common.floor,0xcabfad),tile1:copy(common.floor,0x8e8d82),tile2:copy(common.floor,0xb5a895),
    brass:std(0xa3895b,.51,{metalness:.52}),iron:std(0x4e4b40,.79),
    ivory:std(0xddd1ab),paper:std(0xb9a681),rug:std(0x744e47),rugStripe:std(0xa58f64),
    flame:std(0xffe5bf,.58,{emissive:0xffcf87,emissiveIntensity:.72}),
    panes:std(0xa8bbce,.38,{map:paneMap,metalness:.27,envMapIntensity:.31,emissive:0xafbfd5,emissiveMap:paneMap,emissiveIntensity:.65}),
    windowSeal:std(0x302d28,.92),
    bookA:std(0x6e4940),bookB:std(0x515f4c),bookC:std(0x4a5b68),bookD:std(0x8b7356),
    ...gallerySurfaces(T),...wingCeilingMaterials(T,plaster)
  };
  const lightSites=[];
  let posterFace,hatch;
  const visitors=[];
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
    if(!library)hatch=galleryHatch(T,rootWing,world,materials);
    const p=(u,y,d)=>[sign*u,y,sign*d],k=architectureKit(T,rootWing,materials);
    const props=stationery(T,k,rootWing,{cloth:['bookA','bookB','bookC','bookD']});
    const box=(m,a,b,y,t,d,f)=>k.box(m,p,a,b,y,t,d,f);
    const block=(u0,u1,d0,d1)=>{
      const [a,,b]=p(u0,0,d0),[c,,e]=p(u1,0,d1);
      world.box(Math.min(a,c),Math.min(b,e),Math.max(a,c),Math.max(b,e),p=>!labLower(p.y));
    };
    const put=(m,g,u,y,d,s)=>{
      const M=new T.Matrix4().makeScale(...s);M.setPosition(v.set(...p(u,y,d)));k.geometry(m,g,M);
    };
    const start=HALL.half,high=ceiling,accent=library?'blue':'galleryCloth';
    const wallBase=library?'northLime':'galleryLime',wallStone=library?'limestone':'galleryBand',wallTrim=library?'cut':'galleryCut';
    const floor=(m,l,r,b,t,d,f)=>{
      const cut=library?null:splitHatchFloor(l,r,d,f),spans=library?aroundLabOpening(l,r,d,f):cut.room;
      for(const [a,c,e,h] of spans)box(m,a,c,b,t,e,h);
      if(cut?.lid){const [a,c,e,h]=cut.lid;hatch.tile(m,a,c,b,t,e,h);}
    };
    // Matte perimeter, laid flags in the gallery, darker timber in the reading room.
    floor(library?'iron':'galleryGrout',start,outer,Y-.09,Y-.013,-Z,Z);
    for(const d of [-Z,Z-.32]){
      floor(library?'tile2':'galleryIvory',start,outer,Y-.036,Y,d,d+.32);
      if(!library){
        const f=d<0?d+.282:d+.036;
        floor('galleryInlay',start,outer,Y-.003,Y+.0031,f,f+.024);
      }
    }
    for(let d=-Z+.32,row=0;d<Z-.34;d+=library?.30:.73,row++){
      const width=library?1.68:.73,lim=Math.min(Z-.32,d+(library?.30:.73));
      for(let u=start-(library?row%2:0)*width*.5,col=0;u<outer-.015;u+=width,col++){
        const l=Math.max(start,u)+.005,r=Math.min(outer,u+width)-.005;
        if(r-l<.018)continue;
        const warm=(row+col)%2===0,wave=(row*83+col*47+row*col*19)%11;
        floor(library?(row%5===col%5?'wood':'panel'):(warm?(wave<8?'galleryCream':'galleryIvory'):(wave<8?'galleryDove':'galleryGrey')),
          l,r,Y-.028,Y,d+.0038,lim-.004);
      }
    }
    box(wallBase,outer,outer+.31,Y,high+.09,-Z-.01,Z+.01);
    box(wallStone,outer-.065,outer,Y+.02,.19,-Z,Z);
    // Small physical overlap with the hall's arch backstop, no open seam.
    box(library?'roof':'galleryRoof',start-.024,outer+.02,high,high+.10,-Z,Z);
    cofferedWing(k,p,library);
    const threshold=(d,y,a)=>p(partition-a,y,d);
    if(library){
      masonryPortal(k,threshold,{left:-Z,right:Z,top:high,half:1.53,rim:.20,depth:.28,
        wall:wallBase,stone:wallTrim,edge:wallStone,joint:'ceilingShadow'});
      for(const [l,r] of [[-Z,-1.768],[1.768,Z]])for(const [d,f] of [[.002,.047],[-.327,-.282]]){
        k.box('darkWood',threshold,l,r,Y+.021,.153,d,f);
        k.box('ceilingIvory',threshold,l,r,.154,.181,d-.008,f+.008);
      }
    }else southGalleryArch(k,threshold,Z,high,{half:1.53,thickness:.28});
    for(const [a,b] of [[-Z,-1.53],[1.53,Z]])block(partition-.08,partition+.28,a,b);
    box(wallTrim,partition-.21,partition+.37,Y-.002,Y+.023,-1.48,1.48);
    if(!library)for(const u of [partition-.185,partition+.322])
      box('galleryInlay',u,u+.019,Y+.0232,Y+.025,-1.452,1.452);
    for(const side of [-1,1]){
      const edge=(u,y,d)=>p(side*u,y,side*(Z-d));
      // Butt the longitudinal walls against the BACK of the hall shell;
      // their end faces may not also live on the painted hall-side plane.
      const wallStart=start+HALL.wallDepth;
      const a=side===1?wallStart:-outer,b=side===1?outer:-wallStart;
      // The signed wall coordinates mirror the basis; reverse the tangent,
      // so the inner reveal, mouldings and opaque glass face the room.
      const stableEdge=(u,y,d)=>edge(-u,y,d);
      const wall=(m,l,r,y,t,d,f)=>k.box(m,stableEdge,-r,-l,y,t,d,f);
      const windows=(sign*side>0?[9.99,16.65,19.98,23.31,26.64]:[16.65,19.98,23.31,26.64])
        .map(u=>u*side).sort((x,y)=>x-y);
      let prior=a;
      for(const center of windows){
        const l=center-.69,r=center+.69,bottom=1.25,top=3.43;
        wall(wallBase,prior,l,Y,high,-.24,0);prior=r;
        wall(wallStone,l,r,Y,bottom,-.24,0);
        wall(wallBase,l,r,top,high,-.24,0);
        wall('windowSeal',l+.017,r-.017,bottom+.018,top-.014,-.244,-.222);
        // Deep stone reveals, projecting sill, two rebated casements and
        // hardware on the room side. The drawn gradient is behind the bars.
        wall(wallTrim,l-.147,r+.147,bottom-.115,bottom-.038,-.23,.148);
        wall(wallStone,l-.136,r+.136,bottom-.041,bottom+.009,-.23,.179);
        wall(wallTrim,l-.067,r+.067,top-.011,top+.094,-.238,.054);
        for(const x of [l,r-.059])wall(wallStone,x,x+.059,bottom+.002,top,-.236,.035);
        for(const x of [l+.058,r-.114])wall('rackOak',x,x+.055,bottom+.012,top-.012,-.202,-.098);
        for(const y of [bottom+.021,top-.068])wall('rackOak',l+.092,r-.092,y,y+.053,-.202,-.104);
        wall('rackOak',center-.037,center+.037,bottom+.046,top-.043,-.208,-.096);
        for(const y of [1.94,2.69])wall('rackOak',l+.105,r-.105,y-.022,y+.023,-.211,-.118);
        const verts=[edge(l+.107,bottom+.071,-.215),edge(r-.107,bottom+.071,-.215),
          edge(r-.107,top-.058,-.215),edge(l+.107,top-.058,-.215)];
        k.triangle('panes',verts[0],verts[2],verts[1],[0,0,1,1,1,0]);
        k.triangle('panes',verts[0],verts[3],verts[2],[0,0,0,1,1,1]);
        for(const x of [center-.062,center+.064]){
          wall('brass',x-.021,x+.021,2.195,2.323,-.099,-.078);
          wall('iron',x-.009,x+.009,2.230,2.275,-.079,-.051);
          wall('brass',x-.008,x+.052,2.247,2.267,-.054,-.032);
        }
        for(const x of [l+.102,r-.102])for(const y of [1.54,3.14])
          wall('brass',x-.012,x+.012,y-.035,y+.035,-.122,-.093);
      }
      wall(wallBase,prior,b,Y,high,-.24,0);
      wall(library?'darkWood':wallStone,a,b,Y+.02,.88,.005,.042);
      wall(wallTrim,a,b,.866,.945,.019,.104);
      wall(wallStone,a,b,3.96,4.124,.013,.097);
      wall(wallTrim,a,b,4.111,4.181,.018,.150);
      if(!library){
        wall('galleryCutShade',a,b,Y+.036,.205,.041,.071);
        wall('galleryBand',a,b,.211,.232,.045,.073);
        wall('galleryInlay',a,b,3.963,3.985,.0974,.105);
      }
      const axes=[5.12,8.10,12.34,15.04,18.23,21.55,24.70,28.76];
      const panelSites=[6.61,11.0,14.92,18.27,21.65,25.15,28.21]
        .filter(u=>!windows.some(w=>Math.abs(w-side*u)<1.02));
      for(const U of axes){
        if(U===12.34||panelSites.some(x=>Math.abs(x-U)<.56))continue;
        const u=U*side;
        wall(wallStone,u-.146,u+.146,.19,3.966,-.018,.074);
        wall(wallTrim,u-.192,u+.192,.194,.289,-.016,.106);
        wall(wallTrim,u-.203,u+.203,3.82,3.971,-.016,.121);
      }
      for(const U of panelSites){
        const u=side*U;
        wall(accent,u-.73,u+.73,1.20,3.63,.002,.026);
        for(const x of [u-.75,u+.75])wall(wallTrim,x-.029,x+.029,library?1.13:1.182,library?3.69:3.628,.02,.064);
        for(const y of [1.15,3.66])wall(wallTrim,u-.78,u+.78,y-.030,y+.030,.018,.069);
        if(!library){
          for(const x of [u-.708,u+.708])wall('galleryInlay',x-.0075,x+.0075,1.199,3.598,.027,.036);
          for(const y of [1.202,3.598])wall('galleryInlay',u-.70,u+.70,y-.0061,y+.0061,.027,.036);
        }
      }
    }
    function luminaire(u,d,h,wall=false){
      const drop=wall?.17:.58,base=h-drop,rad=wall?.115:.165;
      if(wall){
        box('brass',outer-.064,outer,base-.29,base+.045,d-.082,d+.082);
        box('iron',u,outer-.04,base-.234,base-.205,d-.023,d+.023);
      }else{
        put('brass',cylinder,u,h,d,[.111,.037,.111]);
        box('brass',u-.013,u+.013,base+.053,h+.010,d-.013,d+.013);
      }
      put('iron',cylinder,u,base+.028,d,[rad*1.08,.057,rad*1.08]);
      put('brass',cylinder,u,base-.011,d,[rad,.021,rad]);
      put('flame',cylinder,u,base-.126,d,[rad*.72,.224,rad*.72]);
      put('brass',cylinder,u,base-.248,d,[rad*.87,.039,rad*.87]);
      put('iron',cylinder,u,base-.280,d,[rad*.31,.026,rad*.31]);
      for(let j=0;j<6;j++){
        const a=j*Math.PI/3,x=u+Math.sin(a)*rad*.796,z=d+Math.cos(a)*rad*.796;
        put('brass',cylinder,x,base-.127,z,[.009,.247,.009]);
      }
      lightSites.push({point:p(u,base-.303,d),power:wall?5.8:library?17.5:23.6,
        color:wall?0xffcc9a:library?0xffe0bf:0xffe6ce,bias:wall?19:0});
    }
    for(const u of wingLampStations)luminaire(u,0,wingLampMount);
    for(const d of [-5.4,5.4])luminaire(outer-.244,d,3.01,true);
    function information(u,y,d,w,h,image,extra={}){
      const mat=new T.MeshStandardMaterial({map:image,roughness:.89,...extra});
      const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);
      m.position.set(...p(u,y,d));m.rotation.y=sign===1?-Math.PI*.5:Math.PI*.5;rootWing.add(m);
      return m;
    }
    function rack(u,d,w=2.42){
      const l=u-w*.5,r=u+w*.5;
      box('rackPost',l-.082,r+.082,Y,3.34,d-.113,d-.055);
      box('rackOak',l-.14,r+.14,Y+.035,.19,d-.112,d+.57);
      box('rackEdge',l-.156,r+.156,Y+.081,.131,d+.548,d+.604);
      for(const u of [l-.035,r-.039]){
        box('rackPost',u,u+.074,.18,3.41,d-.112,d+.548);
        box('rackPostEdge',u-.008,u+.082,.214,3.355,d+.531,d+.585);
      }
      for(const y of [.24,.76,1.27,1.78,2.29,2.80,3.31]){
        box('rackOak',l,r,y-.040,y+.010,d-.075,d+.566);
        box('rackEdge',l+.009,r-.009,y-.023,y+.014,d+.541,d+.597);
        if(y>3.25)continue;
        let last=l+.06;
        for(let x=l+.082,j=0;x<r-.207;j++){
          const w=.049+rng()*.081,h=.212+rng()*.214;
          const a=j%8===5?.109:0,cs=Math.cos(a),sn=Math.sin(a),dx=x+w*.50,f=d+.490+rng()*.047;
          props.book((a,b,c)=>p(dx+a*cs+b*sn,y+.012+w*.5*sn-a*sn+b*cs,f+c),w,h,.158+rng()*.076,(j+Math.round(u+y*3))%8);
          last=x+w;
          x+=w+(j%8===4?.102:.007+rng()*.009);
        }
        if(last<r-.09){
          box('iron',last+.021,last+.039,y+.011,y+.15,d+.343,d+.538);
          box('brass',last+.021,Math.min(last+.12,r-.041),y+.011,y+.029,d+.35,d+.545);
        }
      }
      box('rackOak',l-.135,r+.135,3.311,3.402,d-.11,d+.592);
      box('rackEdge',l-.167,r+.167,3.398,3.45,d-.122,d+.637);
      box('brass',u-.18,u+.18,3.332,3.378,d+.59,d+.606);
      block(l-.13,r+.13,d-.11,d+.60);
    }
    if(library){
      furnishNorthLibrary(T,rootWing,world,materials);
      if(seal){
        const y=2.30,w=1.64,h=w*9/8,l=-w/2,r=w/2,b=y-h/2,t=y+h/2;
        box('darkWood',outer-.161,outer-.056,b-.098,t+.098,l-.098,r+.098);
        box('brass',outer-.186,outer-.156,b-.059,t+.059,l-.060,r+.060);
        box('darkWood',outer-.198,outer-.180,b-.031,t+.031,l-.031,r+.031);
        const plate=information(outer-.203,y,0,w,h,seal,
          {emissive:0x6a5842,emissiveMap:seal,emissiveIntensity:.25});
        plate.name='Nordflügel · Logensiegel zwischen den Tafeln';plate.receiveShadow=true;
      }
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
        const [fx,,fz]=p(u-.34,0,d-.012);
        props.folio(fx,.955,fz,.34,.46,Math.PI-.22,2,{thickness:.033});
        props.folio(fx+.258,.955,fz+.176,.304,.22,Math.PI+.13,3,{loose:true,thickness:.011});
        put('brass',cylinder,u+.92,1.01,d-.10,[.102,.095,.102]);
        put('brass',cylinder,u+.92,1.15,d-.10,[.022,.25,.022]);
        put('flame',sphere,u+.92,1.331,d-.10,[.18,.111,.13]);
        lightSites.push({point:p(u+.92,1.51,d-.10),power:4.7,color:0xffcc8d,bias:14});
      }
    }else{
      posterFace=furnishSouthGallery(T,rootWing,world,materials,poster);
      galleryRunners(T,rootWing,k,materials);
      galleryPrints(T,rootWing,box);
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
    box('darkWood',start-.118,start+.008,3.159,3.433,-.716,.716);
    box('brass',start-.132,start-.113,3.169,3.423,-.700,.700);
    information(start-.137,3.296,0,1.37,.24,nameMap);
    props.finish(rootWing.name+' · Buchrücken und Papier');
    k.flush(rootWing.name);
    visitors.push(palaceVisitors(T,rootWing,world,sign));
    if(!library)hatch.finish();
  }
  cylinder.dispose();sphere.dispose();
  const ray=new T.Raycaster(undefined,undefined,0,3.20),hits=[];
  const galleryCue={id:'gallery-choir',label:'BIES',x:0,z:0};
  return {
    hatch,
    posterTarget(player,camera,look){
      // Only the south gallery artwork: the ray must hit its actual
      // pictured rectangle, not a nearby plaque or the opposite wall.
      if(!posterFace||player.x<outer-3.7||player.x>=outer||Math.abs(player.z)>1.88||player.y<-.16||look.x<.12)return null;
      camera.getWorldPosition(ray.ray.origin);
      ray.ray.direction.copy(look);
      hits.length=0;
      if(!ray.intersectObject(posterFace,false,hits).length)return null;
      posterFace.getWorldPosition(v);
      galleryCue.x=v.x;galleryCue.z=v.z;
      return galleryCue;
    },
    update(p,id,dt=0){
      const engaged=p.y>-.9&&Math.abs(p.z)<Z+.18&&Math.abs(p.x)<outer+.09;
      const nearest=engaged?lightSites.map(s=>({...s,d:(s.point[0]-p.x)**2+(s.point[2]-p.z)**2}))
        .sort((a,b)=>a.d+a.bias-b.d-b.bias).slice(0,lamps.length):[];
      lamps.forEach((light,i)=>{
        const target=nearest[i];
        if(target){light.position.fromArray(target.point);light.color.setHex(target.color);}
        const fade=target?Math.max(0,Math.min(1,(172-target.d)/52)):0;
        light.intensity=target?target.power*(id==='night'?1.21:1)*fade:0;
      });
      let animated=false;
      for(const tick of visitors)animated=tick?.(dt,p)||animated;
      return animated;
    },
    setPreset(id){
      const night=id==='night';
      materials.panes.emissiveIntensity=night?.38:.65;
      materials.panes.envMapIntensity=night?.27:.37;
      materials.flame.emissiveIntensity=night?.78:.55;
    }
  };
}
