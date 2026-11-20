import {randomSource} from './surface-detail.js';

export const FACTORY_ROOMS=[
  {title:'Schwerlast-Hangar',sub:'08 / ABNAHME',theme:0xdea578,poster:'HEIMAT AUS DER LUFT',lines:['WER STILLHÄLT, WIRD ERFASST.','GROSSGERÄT · NICHT FREIGEGEBEN','AUSLIEFERUNG: AUF WIDERRUF']},
  {title:'Kleindrohnen-Montage',sub:'07 / SCHWARM',theme:0xa1c6dc,poster:'EINS WIRD VIELE',lines:['TESTSCHWARM · SCHULUNGSSERIE','EIGENWILLE IST KEIN GARANTIEFALL.','ROT: AUSSORTIERT · GELB: WARTET']},
  {title:'Druiden- und Botwerkstatt',sub:'06 / AUTOMATEN',theme:0xf1c080,poster:'DER DRUIDE WEISS RAT',lines:['AUTOMAT EICHEN · NICHT ANBETEN','KOMPASS · WAAGE · SELBSTKRITIK','AKTENNOTIZ: ER WIDERSPRICHT WIEDER.']},
  {title:'Wellenlabor',sub:'05 / ENTWURF',theme:0xabc5d1,poster:'WELLE NULL',lines:['TESTRÄUME NUR MIT FREIGABE','VERSUCHSSTÜCK M–04 · ABGESCHALTET','PRÜFSTATUS: LEUCHTET. SONST NICHTS.']},
  {title:'Aufnahme und Einkleidung',sub:'01 / ANWÄRTER',theme:0xead6ad,poster:'MORGENFORM',lines:['REFERAT FÜR GLEICHKLANG','DEIN NAME WIRD HIER ERNEUERT.','ERST EINKLEIDUNG. DANN EIGENMEINUNG.']},
  {title:'Lehrsaal für Gleichklang',sub:'02 / UNTERRICHT',theme:0xe8b391,poster:'HEIMAT IST EIN LEHRFACH',lines:['LERNZIEL 04 · ZUSTIMMUNG','FRAGEN BITTE IM GLEICHSCHRITT.','WIEDERHOLUNG GILT NICHT ALS ZWEIFEL.']},
  {title:'Agentenprüfung',sub:'03 / ÜBUNG',theme:0xa9c8ba,poster:'PRÜFUNG OHNE PUBLIKUM',lines:['SCHULUNGSLAGE: FRANKEN','OBJEKT 04 HAT DIE ROLLE VERWEIGERT.','NACHPRÜFUNG NUR MIT ZEUGEN.']},
  {title:'Munitionslinie und Abnahme',sub:'04 / SERIE',theme:0xe9bd83,poster:'FREIGABE VOR FEIERABEND',lines:['BLAUE LEERKÖRPER · ROTE SPERRKISTEN','AUSSCHUSS NICHT ZUM KANTINENDIENST.','LOS K–12 / GESPERRT SEIT DIENSTAG.']}
];

export function factoryDetailPrints(T){
  const c=document.createElement('canvas');c.width=c.height=2048;
  const g=c.getContext('2d'),rng=randomSource(117784);
  const titles=['ABNAHME 08','SCHWARM 07','DRUIDE 06','WELLE NULL','AUFNAHME 01','LEHRSTUFE 02','PRÜFUNG 03','LOS K–12'];
  const notices=[
    ['LANDEBUCH','08–B · GESPERRT','Für die Freigabe fehlt die Freigabe.','Platzwart: B–12'],
    ['STATIKPLATZ','BAUGRUPPE 07','Vier geprüft. Drei zurückgekommen.','Nur Leergehäuse'],
    ['KALIBRIERUNG','DRUIDE / WACHE','Der Druide hat eine Gegenfrage.','Notiz: Keine zweite Gegenfrage.'],
    ['VERSUCH M–04','WELLE NULL','Die Anzeige bestätigt nur sich selbst.','Blindprobe: ohne Befund'],
    ['AUSGABE','TEXTILIEN / NAMEN','Der Altname verbleibt in der Tasche.','Rückgabe ohne Quittung.'],
    ['TAFELDIENST','WIEDERHOLUNG 04','Wer nicht mitkommt, beginnt vorn.','Die Tafel ist neutral.'],
    ['AUSWERTUNG','STELLPROBE 03','Objekt 04 hat „Nein“ angekreuzt.','Fehlerkategorie: Eigenmeinung'],
    ['AUSSCHUSS','K–12 / LEERKÖRPER','Rot gesperrt. Blau ebenfalls gesperrt.','Der Stempel ist freigegeben.']
  ];
  for(let i=0;i<16;i++){
    const screen=i<8,n=i%8;
    g.save();g.translate(i%4*512,Math.floor(i/4)*512);
    const c1=screen?'#102326':'#c9b998',c2=screen?(n===3?'#a7d3e1':'#b9d7a8'):'#5a4637';
    g.fillStyle=c1;g.fillRect(0,0,512,512);g.strokeStyle=c2;g.lineWidth=3;g.strokeRect(19,19,474,474);
    const text=(s,x,y,size,font='monospace')=>{g.fillStyle=c2;g.font='bold '+size+'px '+font;g.fillText(s,x,y,442);};
    if(screen){
      text(titles[n],35,84,47);text(n===3?'KANAL / NULLREFERENZ':'STATUS  //  NUR LESEN',37,133,25);
      g.strokeStyle='#446963';g.lineWidth=1.5;
      for(let x=40;x<477;x+=35){g.beginPath();g.moveTo(x,181);g.lineTo(x,361);g.stroke();}
      for(let y=181;y<=362;y+=30){g.beginPath();g.moveTo(40,y);g.lineTo(476,y);g.stroke();}
      g.strokeStyle=c2;g.lineWidth=4;g.beginPath();
      for(let x=40;x<477;x+=3){
        const u=(x-40)/435,k=n===3?Math.sin(u*46)*Math.sin(u*6)*.65:(Math.sin(u*50+n)+Math.sin(u*18+n)*1.2)*.43;
        const y=270+62*k+(rng()-.5)*11;
        x===40?g.moveTo(x,y):g.lineTo(x,y);
      }
      g.stroke();text('ARCHIV  /  '+String(n+1).padStart(2,'0'),38,434,28);
      g.fillStyle='#b28d58';g.fillRect(390,405,64,14);
      for(let y=21;y<490;y+=6){g.fillStyle='rgba(5,8,8,.18)';g.fillRect(20,y,471,2);}
    }else{
      const [head,sub,body,last]=notices[n];
      text(head,34,83,42,'Georgia');text(sub,36,122,22);
      g.strokeStyle=c2;g.beginPath();g.moveTo(36,144);g.lineTo(477,144);g.stroke();
      const marks=['08','↺','II','0','01','§','×','K'];
      g.lineWidth=3;g.strokeRect(65,175,380,160);
      g.beginPath();g.arc(256,255,64,0,Math.PI*2);g.stroke();
      text(marks[n],marks[n].length>1?216:228,282,73,'Georgia');
      for(const y of [229,251,274])for(const x of [106,355])g.fillRect(x,y,50,2);
      text(body,35,391,19);text(last,35,432,18);
      for(let j=0;j<3500;j++){
        g.fillStyle=j%2?'rgba(60,41,26,.16)':'rgba(255,232,172,.20)';
        g.fillRect(rng()*512,rng()*512,2+rng()*4,1+rng()*2);
      }
    }
    g.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  return {
    monitor:new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xc2dbce,emissiveIntensity:.66,roughness:.57}),
    notes:new T.MeshStandardMaterial({map,roughness:.94})
  };
}

export function factoryPrints(T){
  const c=document.createElement('canvas');c.width=c.height=2048;
  const g=c.getContext('2d'),rng=randomSource(199331),pi=Math.PI;
  const inks=['#a1b6b6','#cb9c70','#cee1c6','#cc865a','#b3c6cf','#cc916e','#c1caa1','#d6a967'];
  function stroke(pts,color,width=2){
    g.lineWidth=width;g.strokeStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
  }
  function diamond(x,y,r,color){
    g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.82,y);g.lineTo(x,y+r);g.lineTo(x-r*.82,y);g.closePath();g.fillStyle=color;g.fill();
  }
  function text(s,x,y,size,color,serif=false,max=450){
    g.font='bold '+size+'px '+(serif?'Georgia':'monospace');g.textAlign='center';g.fillStyle=color;g.fillText(s,x,y,max);
  }
  for(let i=0;i<16;i++){
    const r=FACTORY_ROOMS[i%8],ink=inks[i%8],formal=i<8;
    g.save();g.translate(i%4*512,Math.floor(i/4)*512);g.beginPath();g.rect(0,0,512,512);g.clip();
    g.fillStyle=formal?'#242d35':'#d6c7a7';g.fillRect(0,0,512,512);
    g.strokeStyle=formal?ink:'#594637';g.lineWidth=5;g.strokeRect(18,19,476,474);g.lineWidth=1.4;g.strokeRect(27,29,458,454);
    if(formal){
      for(let n=0;n<40;n++){
        const a=2*pi*n/40,ra=n%5===0?126:109;
        stroke([[256+80*Math.cos(a),202+80*Math.sin(a)],[256+ra*Math.cos(a),202+ra*Math.sin(a)]],ink,n%5===0?3:1.1);
      }
      for(let j=-1;j<=1;j++)diamond(256+j*47,203,54-Math.abs(j)*13,ink);
      diamond(256,201,39,'#242d35');diamond(256,201,27,ink);diamond(256,201,11,'#242d35');
      text('REFERAT MORGENFORM',256,66,25,ink);
      text(r.poster,256,368,39,'#eadece',true,444);
      text(r.lines[0],256,417,19,ink);
      text(r.sub,256,460,15,ink);
    }else{
      g.fillStyle='#38464b';g.fillRect(34,43,444,84);
      text(r.sub,256,74,23,'#ddc9a5');text(r.title.toUpperCase(),256,109,29,'#f4e7cb',true,420);
      r.lines.forEach((line,k)=>{
        stroke([[49,171+k*33],[464,171+k*33]],'#9d8c71',1);
        text(line,256,162+k*33,15,'#403a32',false,418);
      });
      // Illustrated inventory silhouettes and punch-card holes, no technical drawings.
      for(let j=0;j<5;j++){
        const x=91+j*82,y=331+(j%2)*16;
        diamond(x,y,38-j*2,j===2?'#8e5547':'#566267');
        stroke([[x-24,y+32],[x+24,y+32]],'#76665a',2);
        text(String(j+1).padStart(2,'0'),x,y+60,13,'#514139');
      }
      stroke([[46,447],[465,447]],'#6f5a44',2);
      text('INTERN / AUSGABE NUR GEGEN QUITTUNG',256,471,16,'#4b4135');
    }
    for(let j=0;j<1300;j++){
      g.fillStyle=j%4===0?'#fff1c52d':'#21130d20';
      g.fillRect(rng()*512,rng()*512,1+rng()*4,1+rng()*2);
    }
    for(const x of [33,479])for(const y of [34,478]){
      g.beginPath();g.arc(x,y,4.1,0,pi*2);g.fillStyle=formal?'#847b68':'#75604d';g.fill();
    }
    g.restore();
  }
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
  return new T.MeshStandardMaterial({map:t,roughness:.89});
}
