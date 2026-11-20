import {randomSource} from './surface-detail.js';

export const PLAZA_ROOMS=[
  {title:'Fundbüro der Identitäten',code:'P–01',hue:0xb7b5a1,ink:'#bfa172',sig:'archive',headline:'EIGENTUM OHNE EIGENTÜMER',memo:['ABGEGEBEN: RING, SCHLÜSSEL, ALTER NAME','RÜCKGABE NUR AN DIE PERSON VOR DER UMSTELLUNG','DIE BETREFFENDE PERSON EXISTIERT AMTLICH NICHT.']},
  {title:'Protokollkammer',code:'P–02',hue:0xb4c4c7,ink:'#aebec1',sig:'record',headline:'DAS BAND WIDERSPRICHT NICHT',memo:['AUFNAHME 07: „ICH HABE NEIN GESAGT.“','ABSCHRIFT 07: „KEINE EINWÄNDE.“','DAS ORIGINAL WURDE AUS PLATZGRÜNDEN ENTFERNT.']},
  {title:'Register der Aussonderung',code:'P–03',hue:0xc79475,ink:'#cea47d',sig:'seal',headline:'NACH UNS DIE ABLAGE',memo:['SPALTE C: AUSGEMUSTERT, ABER NICHT VERSTORBEN','SPALTE D: VERSTORBEN, ABER NICHT AUSGEMUSTERT','DOPPELTE EINTRÄGE BITTE DOPPELT BETRAUERN.']},
  {title:'Kapelle der Letzten Unterschrift',code:'P–04',hue:0xc38b78,ink:'#bc967c',sig:'chapel',headline:'DEIN NEUER NAME SEI DIR HEILIG',memo:['BEICHTE 4: ALTE VOKALE UND HEIMLICHE ZWEIFEL','OBERBAYERN IST KEIN ORT. ES IST EIN FORMULAR.','DIE TÜR BLEIBT WÄHREND DER ANDACHT UNVERRIEGELT.']},
  {title:'Wartesaal der Freiwilligen',code:'P–05',hue:0xe1c49b,ink:'#e1c190',sig:'queue',headline:'FREIWILLIG. SCHRIFTLICH.',memo:['BITTE WARTEMARKE ZIEHEN. AUFRUF AB NUMMER 00.','WIDERSPRUCH GILT ALS ERNEUTE ANMELDUNG.','DAS MITGEBRACHTE ICH IST AM SCHALTER ABZUGEBEN.']},
  {title:'Stimm- und Haltungsschule',code:'P–06',hue:0xc4a787,ink:'#adbf99',sig:'signal',headline:'DIE STIMME GEHÖRT DEM AMT',memo:['BAND A: „ICH BIN FREIWILLIG HIER.“','BAND B: BITTE FREUNDLICHER.','BAND C: STILLE. DIESE FASSUNG IST FREIGEGEBEN.']},
  {title:'Spiegelprüfung',code:'P–07',hue:0xa3bec3,ink:'#a6bac9',sig:'mirror',headline:'ERKENNE DICH. MELDE ABWEICHUNGEN.',memo:['ZWILLING A GLAUBT, ER SEI DAS ORIGINAL.','ZWILLING B GLAUBT, ER SEI DAS ORIGINAL.','DAS AMT HAT SICH NOCH NICHT ENTSCHIEDEN.']},
  {title:'Depot ohne Rückgabe',code:'P–08',hue:0xc7a276,ink:'#c9a878',sig:'crate',headline:'WAS NICHT ABGEHOLT WIRD',memo:['RÜCKSENDUNG: NUR BEHÄLTER, NICHT INHALT.','ABHOLUNG DURCH ANGEHÖRIGE NICHT VORGESEHEN.','VERFÜGBARER LAGERRAUM IST KEIN ALIBI.']}
];

export function plazaAtlas(T){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
  const g=canvas.getContext('2d'),rand=randomSource(96302),tau=Math.PI*2;
  function line(pts,c,n=2){
    g.lineWidth=n;g.strokeStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
  }
  function circle(x,y,r,c,n=2){
    g.strokeStyle=c;g.lineWidth=n;g.beginPath();g.arc(x,y,r,0,tau);g.stroke();
  }
  function text(t,x,y,size,c,max=450,face='monospace'){
    g.fillStyle=c;g.font='bold '+size+'px '+face;g.textAlign='center';g.fillText(t,x,y,max);
  }
  function icon(name,x,y,k,color){
    g.save();g.translate(x,y);g.scale(k,k);
    if(name==='chapel'){
      for(let j=0;j<36;j++){
        const a=j*tau/36;line([[90*Math.cos(a),90*Math.sin(a)],[111*Math.cos(a),111*Math.sin(a)]],color,j%3?1.4:4);
      }
      line([[-84,45],[0,-82],[84,45],[-84,45]],color,4);circle(0,-10,36,color,3);circle(0,-10,12,color,5);
      for(let i=-2;i<=2;i++)line([[i*20,48],[i*8,84]],color,2);
    }else if(name==='signal'||name==='record'){
      for(const x of [-53,53]){circle(x,-17,45,color,4);circle(x,-17,32,color,2);circle(x,-17,8,color,5);}
      line([[-116,56],[-78,56],[-64,68],[-50,44],[-29,75],[-13,37],[4,71],[20,49],[34,56],[116,56]],color,3);
    }else if(name==='mirror'){
      for(const s of [-1,1]){
        line([[s*17,-64],[s*61,-74],[s*96,-42],[s*86,27],[s*64,37],[s*58,61],[s*18,61],[s*17,-64]],color,4);
        circle(s*43,-22,9,color,3);
      }
      line([[0,-104],[0,100]],color,1);
    }else{
      for(let j=0;j<3;j++){
        const O=(j-1)*78;
        line([[O-30,-61],[O+24,-61],[O+32,-47],[O+32,58],[O-32,58],[O-32,-51],[O-30,-61]],color,3);
        for(let s=0;s<4;s++)line([[O-18,-15+s*13],[O+17,-15+s*13]],color,2);
        circle(O,-40,6,color,2);
      }
    }
    g.restore();
  }
  for(let i=0;i<16;i++){
    const r=PLAZA_ROOMS[i%8],prop=i<8,col=prop?r.ink:'#493b34',bg=prop?(i===3?'#342731':'#253034'):'#d8c8ac';
    g.save();g.translate(i%4*512,Math.floor(i/4)*512);g.beginPath();g.rect(0,0,512,512);g.clip();
    g.fillStyle=bg;g.fillRect(0,0,512,512);
    g.strokeStyle=col;g.lineWidth=5;g.strokeRect(17,17,478,478);g.lineWidth=1.7;g.strokeRect(27,27,458,458);
    if(prop){
      text('REFERAT MORGENFORM  /  INTERN',256,69,24,col);
      icon(r.sig,256,222,1.05,col);
      text(r.headline,256,385,39,'#eedfbc',438,'Georgia');
      text(r.code+'  •  SCHLOSS ERLANGEN',256,435,19,col);
    }else{
      g.fillStyle='#424346';g.fillRect(33,43,446,78);
      text(r.code+'  /  INTERNER UMLAUF',256,75,21,'#bdb393');
      text(r.title.toUpperCase(),256,106,26,'#f4e6cd',426,'Georgia');
      r.memo.forEach((s,j)=>{
        text(s,256,163+j*34,19,col,415);
        line([[47,178+j*34],[465,178+j*34]],'#8e775c',1);
      });
      icon(r.sig,255,354,.79,'#7c544e');
      text('ABGEZEICHNET / WIEDERVORLAGE OFFEN',256,466,16,col);
    }
    for(let n=0;n<1960;n++){
      const k=rand();g.fillStyle=k>.55?'#dfc19a1d':'#29191337';g.fillRect(rand()*512,rand()*512,1+rand()*4,1+rand()*2);
    }
    for(const x of [34,478])for(const y of [34,478])circle(x,y,3.5,'#8c7d69',1.5);
    g.restore();
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.86});
}
