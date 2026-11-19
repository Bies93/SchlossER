import {randomSource,sharedSet} from './surface-detail.js';

export function shopMaterials(T){
  const rng=randomSource(5817),std=(color,extra)=>new T.MeshStandardMaterial({color,...extra});
  const canvas=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c.getContext('2d');};
  const tex=(c,color,repeat=true)=>{
    const m=new T.CanvasTexture(c.canvas);m.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
    if(repeat)m.wrapS=m.wrapT=T.RepeatWrapping;m.anisotropy=4;return m;
  };
  const board=canvas(256),holes=canvas(256),waffle=canvas(256),rubber=canvas(256);
  for(const [a,col] of [[board,'#8e6948'],[holes,'#ccc'],[waffle,'#434048'],[rubber,'#585a56']]){
    a.fillStyle=col;a.fillRect(0,0,256,256);
  }
  for(let x=0;x<256;x+=32)for(let y=0;y<256;y+=32){
    const circle=(a,r,c,offset=0)=>{a.fillStyle=c;a.beginPath();a.arc(x+16,y+16+offset,r,0,Math.PI*2);a.fill();};
    circle(board,5.4,'#c3a172',1.1);circle(board,4.1,'#29231d');circle(holes,5.5,'#777');circle(holes,3.8,'#303030');
    const a=waffle.createLinearGradient(x,y,x+32,y+32);a.addColorStop(0,'#686269');a.addColorStop(.46,'#4a4650');a.addColorStop(1,'#302e37');
    waffle.fillStyle=a;waffle.beginPath();waffle.roundRect(x+1.5,y+1.5,29,29,3);waffle.fill();
    rubber.fillStyle='#696b65';rubber.beginPath();rubber.ellipse(x+16,y+16,11,7,(x+y)%64?-.5:.5,0,Math.PI*2);rubber.fill();
  }
  for(let i=0;i<6000;i++){
    const x=rng()*256,y=rng()*256;
    for(const a of [board,waffle,rubber]){a.fillStyle=i%7?'#090a0b1b':'#d3c4a82d';a.fillRect(x,y,.6+rng()*3,.8);}
  }
  const metal=sharedSet(T,'cutMetal',256),stone=sharedSet(T,'galleryStone',256);
  return {
    mfPeg:std(0xffffff,{map:tex(board,true),bumpMap:tex(holes,false),bumpScale:.021,roughness:.95}),
    mfBaffle:std(0xffffff,{map:tex(waffle,true),bumpMap:tex(waffle,false),bumpScale:.036,roughness:.97}),
    mfRubber:std(0xaaaaa2,{map:tex(rubber,true),bumpMap:tex(rubber,false),bumpScale:.027,roughness:.90}),
    mfBench:std(0xd7ae76,{...sharedSet(T,'fineOak',256),roughness:.72}),
    mfSaddle:std(0x604737,{...sharedSet(T,'canvas',128),roughness:.78}),
    mfFloor:std(0x858783,{...stone,roughness:.80,normalScale:new T.Vector2(.42,.42)}),
    mfSlate:std(0x686c76,{...stone,roughness:.89,normalScale:new T.Vector2(.57,.57)}),
    mfCast:std(0x8e9b96,{...metal,metalness:.57,roughness:.48}),
    mfBlue:std(0x586d80,{...metal,metalness:.34,roughness:.62}),
    mfAmber:std(0xd6a358,{emissive:0xe58f37,emissiveIntensity:.69,roughness:.46}),
    mfIce:std(0xb4dad6,{emissive:0x8fd7cd,emissiveIntensity:.7,roughness:.47})
  };
}

// Shared illustrations: stencilled apparatus IDs, a chart with hand edits, and
// worn enamel labels. Fictional radio / club paperwork, not technical specs.
export function shopArt(T){
  const c=document.createElement('canvas');c.width=1536;c.height=768;
  const a=c.getContext('2d'),rng=randomSource(3476);
  const defs={
    returns:['ZWEITE CHANCE','GEHT NOCH / MIT GUTEM ZUREDEN','03 · LAGER DER VERWEIGERTEN NEUTEILE','cream'],
    diagram:['RÜCKKANAL · M–7','PRÜFBLATT · MOOSFUNK','SIGNAL ≠ ZUSTIMMUNG','blue'],
    cycle:['WATT DURCH WADEN','SOLLEISTUNG: EINE KONTROLLLAMPE','ISTLEISTUNG: EINE KONTROLLLAMPE','blue'],
    intercom:['RÜCKKANAL M–7','RUF  /  EMPFANG  /  FREIGABE','MOOSFUNK · KANAL B','green'],
    meter:['SIGNALPRÜFER 04','0       2       4       6        8','LEITUNG / KOLLEKTIV','cream'],
    drawers:['FUNDTEILE','KLEMMEN  /  FEDERN  /  KNÖPFE','VOR DEM WEGWERFEN AUFMACHEN','green'],
    rangeRules:['NUR BLECH, KEINE LEUTE','MOOSFUNK · BLECHBÜHNE','NACHTSCHICHT: NUR MIT OHRMUSCHELN','blue'],
    stage:['BLECHBÜHNE','RAUTE I  /  BREZN II  /  RAUTE III','GETROFFEN? DANN WAR ES KUNST.','green'],
    lane1:['01','RAUTE / FUNKTEST','GESTERN: BLECH VERBOGEN','blue'],
    lane2:['02','KÖNIGLICHE BREZN','KEIN NACHSALZEN','cream'],
    lane3:['03','RAUTE / PROBELAUF','FARBE NICHT ENTLEIHEN','green'],
    props:['KULISSENTEILE','SATZ B / FARBE TROCKEN','KEIN DURCHGANG IM REGAL','red']
  };
  const keys=Object.keys(defs),palette={cream:['#cfbc95','#4e4636'],blue:['#273c4c','#d5dfd1'],green:['#394f45','#d6c6a1'],red:['#753f37','#edcd9f']};
  function text(t,x,y,size,col,font='monospace'){a.font='bold '+size+'px '+font;a.fillStyle=col;a.textAlign='center';a.fillText(t,x,y,347);}
  for(const [i,id] of keys.entries()){
    const [title,sub,foot,style]=defs[id],[bg,ink]=palette[style];
    a.save();a.translate(i%4*384,Math.floor(i/4)*256);
    a.fillStyle=bg;a.fillRect(0,0,384,256);a.strokeStyle=ink;a.lineWidth=2;a.strokeRect(8,8,368,240);a.strokeRect(13,13,358,230);
    a.strokeRect(19,72,346,1);text(title,192,58,33,ink,'Georgia');
    if(id==='diagram'||id==='meter'||id==='cycle'||id==='stage'){
      if(id==='meter'){
        for(let j=0;j<22;j++){
          const ang=Math.PI*(1.18+j*.64/21);a.lineWidth=j%4===0?3:1.5;a.strokeStyle=j>16?'#9e4835':ink;
          a.beginPath();a.moveTo(192+Math.cos(ang)*108,193+Math.sin(ang)*108);
          a.lineTo(192+Math.cos(ang)*96,193+Math.sin(ang)*96);a.stroke();
        }
        a.lineWidth=3;a.strokeStyle='#aa4c31';a.beginPath();a.moveTo(192,193);a.lineTo(221,97);a.stroke();
      }else{
        a.strokeStyle=ink;
        for(let n=0;n<3;n++){
          const x=70+n*122,y=139;a.strokeRect(x-21,y-23,42,46);
          if(n<2){a.beginPath();a.moveTo(x+21,y);a.lineTo(x+61,y);a.lineTo(x+61,y-19);a.lineTo(x+101,y-19);a.stroke();}
          text(String(n+1),x,y+6,19,ink);
        }
      }
      text(sub,192,208,17,ink);text(foot,192,230,14,ink);
    }else{
      text(sub,192,143,24,ink);text(foot,192,202,16,ink);
    }
    for(let n=0;n<1300;n++){a.fillStyle=n%7?'#110f111a':'#ebe3be41';a.fillRect(rng()*384,rng()*256,1+rng()*3,.6+rng());}
    a.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const m=new T.MeshStandardMaterial({map,roughness:.82});
  return {mount(room,id,at,w,h,yaw=0,pitch=0,roll=0){
    const i=keys.indexOf(id);
    const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setXY(j,(i%4+.010+.98*uv.getX(j))/4,1-(Math.floor(i/4)+.990-.98*uv.getY(j))/3);
    const panel=new T.Mesh(g,m);panel.name='Moosfunk · '+id;panel.position.fromArray(at);panel.rotation.set(pitch,yaw,roll,'YXZ');room.add(panel);
  }};
}

export function shopWear(T){
  // Low-contrast overprints establish use and contact, with no second ground.
  const c=document.createElement('canvas');c.width=512;c.height=256;
  const a=c.getContext('2d'),rnd=randomSource(518);
  for(let k=0;k<2;k++){
    a.save();a.translate(k*256,0);a.beginPath();a.rect(3,3,250,250);a.clip();
    for(let j=0;j<58;j++){
      const t=rnd()*Math.PI*2,r=Math.sqrt(rnd()),x=128+(k?88:103)*Math.cos(t)*r,y=127+(k?95:58)*Math.sin(t)*r;
      const R=2+15*rnd(),g=a.createRadialGradient(x,y,1,x,y,R);
      g.addColorStop(0,k?'#887b6552':'#3a2d1e65');g.addColorStop(.64,k?'#55463830':'#4331232f');g.addColorStop(1,'#00000000');
      a.fillStyle=g;a.fillRect(x-R,y-R,R*2,R*2);
    }
    if(k)for(let j=0;j<54;j++){
      const x=39+rnd()*178,y=42+rnd()*161;
      a.fillStyle=j%2?'#9c957a37':'#19171530';a.fillRect(x,y,1+rnd()*8,1+rnd()*2);
    }
    a.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const mat=new T.MeshStandardMaterial({map,roughness:.94,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  return (room,at,w,h,kind,rotation=0)=>{
    const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;
    for(let j=0;j<4;j++)uv.setX(j,(kind+.008+.984*uv.getX(j))*.5);
    const o=new T.Mesh(g,mat);o.position.fromArray(at);o.rotation.set(-Math.PI/2,0,rotation,'YXZ');room.add(o);
  };
}
