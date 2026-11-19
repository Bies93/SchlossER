import {randomSource,sharedSet} from './surface-detail.js';

export function hqMaterials(T,{painted,cloth}){
  const color=(hex,extra={})=>new T.MeshStandardMaterial({color:hex,roughness:.88,...extra});
  return {
    acoustic:color(0x897b62,{...sharedSet(T,'plaster',256),normalScale:new T.Vector2(.57,.57)}),
    pine:color(0xab8b60,sharedSet(T,'fineOak',256)),
    wool:color(0x906353,cloth),sage:color(0x687d69,cloth),tartan:color(0x4e6559,cloth),
    porcelain:color(0xd8ccb0,{roughness:.40}),preserve:color(0xa85e40,{roughness:.33}),
    jarGreen:color(0x878953,{roughness:.31}),jarGold:color(0xb4894f,{roughness:.35}),
    jarPale:color(0xf0dfb6,{roughness:.27,envMapIntensity:.32}),
    metalSink:color(0xa2aaa3,{roughness:.46,metalness:.51}),
    toolRed:color(0xa35642,painted),tileOld:color(0xa1aca0,{...sharedSet(T,'labTile',256),roughness:.72}),
    studioLamp:color(0xe68c65,{emissive:0xd74c28,emissiveIntensity:.65}),
    workLamp:color(0xd6e7e0,{emissive:0xb4d4ce,emissiveIntensity:.87}),
    blueTape:color(0x5b8291,painted),switchAmber:color(0xf39e5d,{emissive:0xdc661e,emissiveIntensity:.93}),
    switchGreen:color(0xa0ca85,{emissive:0x6db74d,emissiveIntensity:.91})
  };
}

// Original in-world prints. All rooms use the same paper grain, typographic
// grid and atlas; each should still be recognizable before the text is read.
const pages={
  studioSign:['STUDIO & ARCHIV','MOOSFUNK · TÜR BITTE SCHLIESSEN',''],
  workSign:['REPARATUR','AUFHEBEN BEVOR WEGWERFEN',''],
  kitchenSign:['VOLKSKÜCHE','VOM BEET AUF DEN TISCH',''],
  plenumSign:['PLENUM & RUHE','LEISE STREITEN NACH 22 UHR',''],
  liveSign:['AUF SENDUNG','KEIN KLOPFEN · BITTE',''],
  airLog:['SENDEPLAN','18:00  JINGLE I · 18:01  JINGLE II','18:02  HÖRERZAHL: VERMUTLICH ZWEI','18:03  JINGLE III'],
  tapeList:['BANDARCHIV','01 / STATION · 02 / PRÜFVERMERK','03 / KÜCHENDIENST','04 / RÜCKKANAL · NOCH GESPERRT'],
  kitchenDuty:['KÜCHENDIENST','MARA + KALLE · ABWASCH','SUPPE FÜR ALLE · AB 18 UHR','TOMATEN: ENTSCHEIDUNG VERTAGT'],
  fridge:['NICHT ANFASSEN','LETZTE TOMATEN · PRIVATEIGENTUM','BESCHLUSS NOCH NICHT RATIFIZIERT'],
  missing:['WER FEHLT?','MARA S. · SEIT DEM KIRCHWEIHMONTAG','KALLE W. · NICHT ZUR SCHICHT ERSCHIENEN','MELDUNGEN ANS STUDIO, NICHT ANS AMT.'],
  repair:['RÜCKKANAL / DEFEKT','M–7 IM SCHLOSSLABOR BESCHLAGNAHMT','LETZTER STANDORT: NEBEN FREMD­AKTE F','OHNE M–7 NUR EMPFANG'],
  keep:['GEHT NOCH','BEDINGT · MIT GUTEM ZUREDEN','DEFEKT IST KEINE DIAGNOSE.'],
  votes:['PLENUM · 4 ENTWÜRFE','A / ZELLEN ÖFFNEN','B / AKTEN VERÖFFENTLICHEN','C / BEETE SCHÜTZEN · D / VERTAGEN'],
  quiet:['RUHEN IST ARBEIT','NACHTSCHICHT SCHLÄFT LINKS','WER SCHNARCHT, HAT MORGEN KÜCHENDIENST.'],
  wired:['RÜCKKANAL AKTIV','M–7 EINGESETZT · LEITUNG FREI','BAND 04 IM STUDIO VERFÜGBAR'],
  seed:['FÜR DIE KÜCHE','KISTE ZURÜCK INS BEET',''],
  community:['KEINS ALLEIN','MOOSFUNK · WIR BLEIBEN HIER','']
};
const keys=Object.keys(pages);
export function hqArt(T){
  const sheet=document.createElement('canvas');sheet.width=2048;sheet.height=1280;
  const c=sheet.getContext('2d'),random=randomSource(25241);
  const palette=['#593e40','#454f4b','#3d563f','#55566a','#984337','#474d59','#685039','#56644f',
    '#8a533f','#5b5350','#595346','#5e533e','#4c5268','#655a4a','#3f654b','#615b41','#545b47'];
  function text(value,u,v,size,ink,font='monospace'){
    c.textAlign='center';c.fillStyle=ink;c.font='bold '+size+'px '+font;c.fillText(value,u,v,451);
  }
  for(const [i,id] of keys.entries()){
    c.save();c.translate((i%4)*512,Math.floor(i/4)*256);
    const head=palette[i],base=i<5||i===14?'#cab38a':'#d8c69c',ink='#403b31';
    c.fillStyle=base;c.fillRect(0,0,512,256);
    c.lineWidth=3;c.strokeStyle='#4f4738';c.strokeRect(14,14,484,228);
    const short=i<5||id==='community';
    c.fillStyle=head;c.fillRect(18,18,476,short?220:59);
    if(id==='community')for(const side of [1,-1]){
      c.strokeStyle='#d1ac75';c.lineWidth=3;c.beginPath();
      c.arc(257+side*164,98,41,side>0?-.23:Math.PI-.31,side>0?.54:Math.PI+.42);
      c.stroke();
      c.setLineDash([3,5]);c.strokeRect(43,42,425,176);c.setLineDash([]);
    }
    text(pages[id][0],256,short?128:60,short?62:38,'#f1dfb8','Georgia');
    for(let j=1;j<pages[id].length;j++)if(pages[id][j]){
      if(!short){c.fillStyle='#87795c';c.fillRect(37,81+j*39,438,1);}
      text(pages[id][j],256,short?192:111+j*39,short?28:24,short?'#e6c797':ink);
    }
    for(let j=0;j<1540;j++){
      c.fillStyle=j%4===0?'#fff2d234':'#241b181d';
      c.fillRect(random()*512,random()*256,1+random()*4,.9+random()*2.2);
    }
    for(const u of [28,484])for(const v of [29,226]){
      c.fillStyle=short?'#d5c091':'#6f6248';c.beginPath();c.arc(u,v,3.8,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const ink=new T.MeshStandardMaterial({map,roughness:.91}),lit=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xdd7e54,emissiveIntensity:.37,roughness:.72});
  return {mount(room,id,at,w,h,yaw=0,pitch=0,roll=0){
    const i=keys.indexOf(id),u=(i%4)*.25+.002,v=1-(Math.floor(i/4)+1)*.2+.0032,fold=id==='community';
    const g=new T.PlaneGeometry(w,h,fold?26:1,fold?7:1),uv=g.getAttribute('uv'),pts=g.getAttribute('position');
    for(let j=0;j<uv.count;j++){
      const a=uv.getX(j),s=uv.getY(j),d=1-s;
      if(fold)pts.setXYZ(j,pts.getX(j),pts.getY(j)-d*d*(.052*Math.sin(a*Math.PI)+.012*Math.sin(a*25)),.016*Math.sin(a*39+d*2)+.04*Math.sin(a*57)*d);
      uv.setXY(j,u+a*.246,v+s*.1936);
    }
    if(fold)g.computeVertexNormals();
    const mesh=new T.Mesh(g,id==='liveSign'?lit:ink);mesh.name='Moosfunk · '+id;mesh.position.fromArray(at);
    mesh.rotation.set(pitch,yaw,roll,'YXZ');room.add(mesh);return mesh;
  }};
}
