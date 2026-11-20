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
