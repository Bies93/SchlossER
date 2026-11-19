import {randomSource,sharedSet} from './surface-detail.js';

const art={
  crest:['BUND DER EISERNEN KRONE','SIEGEL DES INNEREN KREISES','KEIN EINTRITT OHNE PFAND'],
  lodge:['DIE PFÖRTNERKAMMER','MÄNTEL LINKS · PFÄNDER RECHTS','DER SCHLÜSSEL BLEIBT IM HAUS'],
  salle:['GALERIE DER DREI FARBEN','SAALBUCH: SÄMTLICHE GÄSTE ABGEWIESEN','SCHAUDEGEN · NICHT ENTNEHMEN'],
  archive:['ARCHIV DER AUFNAHMEN','BLATT 12 – STIMMRECHT NUR FÜR DIE ALTEN','WIDERSPRUCH: NICHT PROTOKOLLIERT'],
  decree:['DER LEERE STUHL','BIS ZUR RÜCKKEHR DES ERBEN','NEUE BESCHLÜSSE GELTEN ALS ALTE'],
  banned:['GÄSTELISTE','M. ACKER            GESTRICHEN','GRUND: FRAGTE WESSEN KRONE'],
  duel:['DER KRONBODEN','EIGENE STIMME. ALTE REIHENFOLGE.','MENSURSAAL · NUR FÜR DEN BUND'],
  dynasty:['DAS HAUS OHNE ERBEN','I. TITEL   II. SIEGEL   III. ERBWART','LETZTE VERSAMMLUNG: VERTAGT'],
  seats:['SITZORDNUNG','ÄLTESTE ZUERST · GÄSTE STEHEN','DIE KRONE BLEIBT UNBESETZT']
};
export function chapterArt(T,root){
  const keys=Object.keys(art),c=document.createElement('canvas');c.width=1536;c.height=1536;
  const a=c.getContext('2d'),rng=randomSource(8912);
  function type(t,y,size,ink,face='Georgia'){a.font='bold '+size+'px '+face;a.textAlign='center';a.fillStyle=ink;a.fillText(t,256,y,454);}
  for(const [i,key] of keys.entries()){
    a.save();a.translate(i%3*512,Math.floor(i/3)*512);
    const banner=key==='crest',base=banner?'#263c45':['#b39e7e','#442931','#303e47','#c4ae85','#5b2c37','#b6a282','#502c3b','#bca786','#303e47'][i];
    const gold=banner||[1,2,4,6,8].includes(i)?'#e6c891':'#514032';
    a.fillStyle=base;a.fillRect(0,0,512,512);
    a.strokeStyle=gold;a.lineWidth=4;a.strokeRect(18,18,476,476);a.lineWidth=2;a.strokeRect(27,27,458,458);
    if(banner){
      a.beginPath();a.moveTo(151,132);a.lineTo(360,132);a.lineTo(345,277);a.quadraticCurveTo(321,334,256,364);
      a.quadraticCurveTo(189,334,166,277);a.closePath();a.fillStyle='#56343c';a.fill();a.stroke();
      a.lineWidth=8;a.beginPath();a.moveTo(194,219);a.lineTo(183,166);a.lineTo(226,193);a.lineTo(256,154);
      a.lineTo(285,194);a.lineTo(327,167);a.lineTo(314,219);a.closePath();a.stroke();
      for(let j=0;j<13;j++){
        const ang=.22+j*.19;
        a.beginPath();a.ellipse(256+152*Math.cos(ang),240+145*Math.sin(ang),8,19,ang,0,Math.PI*2);a.stroke();
        a.beginPath();a.ellipse(256-152*Math.cos(ang),240+145*Math.sin(ang),8,19,-ang,0,Math.PI*2);a.stroke();
      }
      a.beginPath();a.moveTo(256,244);a.lineTo(291,273);a.lineTo(256,306);a.lineTo(222,273);a.closePath();a.fillStyle=gold;a.fill();
      type('✦',271,42,'#3e3540');
    }else{
      for(let j=0;j<6;j++){a.globalAlpha=.47;a.strokeRect(61,153+j*27,390,1);a.globalAlpha=1;}
      a.lineWidth=2;a.strokeRect(61,116,390,225);
      if(key==='banned'){
        a.save();a.translate(259,270);a.rotate(-.24);a.strokeStyle='#8c3831';a.lineWidth=4;a.strokeRect(-132,-26,264,52);
        a.font='bold 30px monospace';a.fillStyle='#8c3831';a.fillText('VERWEIGERT',0,10);a.restore();
      }else if(key==='dynasty'){
        a.strokeStyle=gold;a.lineWidth=3;
        for(const [j,x,y] of [[0,256,173],[1,128,282],[2,256,287],[3,384,282]]){
          a.strokeRect(x-35,y-27,70,54);a.font='bold 18px Georgia';a.textAlign='center';a.fillStyle=gold;a.fillText(String(j+1),x,y+6);
          if(j){a.beginPath();a.moveTo(x,y-28);a.lineTo(x,225);a.lineTo(256,225);a.lineTo(256,201);a.stroke();}
        }
      }else{
        a.font='bold 41px Georgia';a.fillStyle=gold;a.textAlign='center';a.fillText(['','I','II','III','IV'][i]??'✦',256,245);
      }
    }
    type(art[key][0],90,40,gold);
    type(art[key][1],419,20,gold,'monospace');type(art[key][2],453,16,gold,'monospace');
    for(let j=0;j<3670;j++){
      a.fillStyle=j%4?'#120d1121':'#f6dfb02f';a.fillRect(rng()*512,rng()*512,.7+rng()*3,1+rng()*2);
    }
    a.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardMaterial({map,roughness:.9,side:T.DoubleSide});
  return (id,x,y,z,w,h,yaw=0,pitch=0,fold=false)=>{
    const i=keys.indexOf(id),g=new T.PlaneGeometry(w,h,fold?22:1,fold?9:1),uv=g.attributes.uv,P=g.attributes.position;
    for(let j=0;j<uv.count;j++){
      const u=uv.getX(j),v=uv.getY(j);
      if(fold)P.setXYZ(j,P.getX(j),P.getY(j)-.045*(1-v)*Math.sin(9*u),.019*Math.sin(75*u)+.04*(1-v)*Math.sin(29*u));
      uv.setXY(j,(i%3+.006+.988*u)/3,1-(Math.floor(i/3)+.994-.988*v)/3);
    }
    if(fold)g.computeVertexNormals();
    const m=new T.Mesh(g,material);m.name='Eiserne Krone · '+id;m.position.set(x,y,z);m.rotation.set(pitch,yaw,0,'YXZ');root.add(m);return m;
  };
}

export function chapterMaterials(T){
  const stone=sharedSet(T,'stairStone',256),grain=sharedSet(T,'fineOak',256),cloth=sharedSet(T,'canvas',128),plate=sharedSet(T,'cutMetal',256),
    rock=sharedSet(T,'bedrock',256),plaster=sharedSet(T,'plaster',256);
  const std=(color,roughness=.84,more={})=>new T.MeshStandardMaterial({color,roughness,...more});
  return {stone:std(0xb5a495,.94,stone),stone2:std(0x9d9385,.94,stone),stone3:std(0xc3af99,.92,stone),mortar:std(0x5c5348,1,plaster),
    sole:std(0x91928a,.88,rock),wood:std(0x9c6f4d,.76,grain),darkWood:std(0x684b38,.82,grain),coal:std(0x3c4242,.93,plaster),
    blue:std(0x394f5b,.94,cloth),wine:std(0x6b3740,.94,cloth),piping:std(0xa1855a,.86,cloth),paper:std(0xc9ba94,.92),
    soot:std(0x292528,.96),bookA:std(0x5b4734,.92,cloth),bookB:std(0x614044,.91,cloth),bookC:std(0x4f625c,.91,cloth),
    iron:std(0x576067,.50,{...plate,metalness:.56}),steel:std(0xa6b1b4,.34,{...plate,metalness:.60}),brass:std(0xb28e58,.51,{metalness:.52}),
    wax:std(0xc6b288,.79),flame:std(0xffda9c,.71,{emissive:0xff9b39,emissiveIntensity:1.8}),filament:std(0xd8cab0,.68,{emissive:0xffbe7d,emissiveIntensity:.82})};
}
