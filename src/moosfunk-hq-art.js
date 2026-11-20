import {randomSource,sharedSet} from './surface-detail.js';

export function hqMaterials(T,{painted,cloth}){
  const color=(hex,extra={})=>new T.MeshStandardMaterial({color:hex,roughness:.88,...extra});
  return {
    studioFelt:color(0x384e49,{...cloth,roughness:.99}),
    acoustic:color(0x897b62,{...sharedSet(T,'plaster',256),normalScale:new T.Vector2(.57,.57)}),
    pine:color(0xab8b60,sharedSet(T,'fineOak',256)),
    wool:color(0x906353,cloth),sage:color(0x687d69,cloth),tartan:color(0x4e6559,cloth),
    porcelain:color(0xd8ccb0,{roughness:.40}),preserve:color(0xa85e40,{roughness:.33}),
    jarGreen:color(0x878953,{roughness:.31}),jarGold:color(0xb4894f,{roughness:.35}),
    jarPale:color(0xf0dfb6,{roughness:.27,envMapIntensity:.32}),
    metalSink:color(0xa2aaa3,{roughness:.46,metalness:.51}),
    fridgeShell:color(0x7b9186,{...painted,roughness:.73,normalScale:new T.Vector2(.46,.46)}),
    fridgeEnamel:color(0xbfc3a9,{...painted,roughness:.57,normalScale:new T.Vector2(.39,.39)}),
    wornSteel:color(0x908775,{...painted,roughness:.51,metalness:.46,normalScale:new T.Vector2(.38,.38)}),
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
  community:['KEINS ALLEIN','MOOSFUNK · WIR BLEIBEN HIER',''],
  console:[],meter:[],sleeve:[]
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
    if(['meter','console','sleeve'].includes(id)){
      const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
      const rule=(x,y,X,Y,col,weight=2)=>{c.strokeStyle=col;c.lineWidth=weight;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();};
      if(id==='meter'){
        rect(0,0,512,256,'#292c29');
        for(const [i,x] of [21,264].entries()){
          rect(x,18,226,185,'#131918');rect(x+6,24,214,173,'#e7cea1');
          for(let j=0;j<24;j++){
            const a=(-133+j*85/23)*Math.PI/180,red=j>17,rad=133;
            const line=(r)=>[x+113+Math.cos(a)*r,182+Math.sin(a)*r];
            rule(...line(rad),...line(rad-(j%4?8:16)),red?'#a03f2d':'#393730',j%4?2:3);
          }
          text('−20       −7       0     +3',x+113,46,13,'#4b3523');
          rule(x+113,177,x+(i?124:100),56,'#a33426',3);
          text('VU',x+113,146,25,'#3f392e','Georgia');text(i?'SUMME R':'SUMME L',x+113,231,17,'#d6c7aa');
        }
      }else if(id==='console'){
        rect(0,0,512,256,'#33433e');
        for(let j=0;j<10;j++){
          const x=20+j*52.1;
          rect(x+23,8,1,237,'#839182');
          for(let n=0;n<9;n++)rect(x+8,122+10*n,n%2?4:8,1.8,'#c6c2a9');
          rect(x-13,218,28,24,j<3?'#d5aa75':'#d4ccb3');
          text(String(j+1).padStart(2,'0'),x+1,236,16,'#3e3c33');
          for(const y of [19,57])for(let n=0;n<9;n++){const a=(205+n*16)*Math.PI/180;rect(x+12*Math.cos(a),y+10*Math.sin(a),1.8,2.8,'#b9b59f');}
        }
      }else{
        rect(0,0,512,256,'#c8b898');rect(13,13,486,230,'#274c4b');
        for(let n=0;n<9;n++){c.strokeStyle=n%3?'#dba767':'#ad5f48';c.lineWidth=3;c.beginPath();c.arc(103,132,18+n*8,0,Math.PI*2);c.stroke();}
        rect(207,38,265,5,'#e4be83');text('FELDBAND 07',342,89,32,'#ead4a7');
        text('STIMMEN AUS DEM STEIN',342,120,18,'#ead4a7');text('19 cm/s   •   MONO',342,184,17,'#e3b073');
      }
      for(let j=0;j<950;j++)rect(random()*512,random()*256,1.1,1.4,j%2?'#ffeacb19':'#130f1125');
      c.restore();continue;
    }
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
