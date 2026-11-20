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

// Each nameplate gets an unscaled 512px cell; the rugs share the lower half.
export function plazaFinishAtlas(T){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
  const g=canvas.getContext('2d'),rng=randomSource(712001);
  const centered=(s,x,y,size,color,font='Georgia')=>{
    g.textAlign='center';g.fillStyle=color;g.font='bold '+size+'px '+font;g.fillText(s,x,y,444);
  };
  function diamond(x,y,W,H){
    g.beginPath();g.moveTo(x-W,y);g.lineTo(x,y-H);g.lineTo(x+W,y);g.lineTo(x,y+H);g.closePath();
  }
  const titles=[
    ['FUNDBÜRO','DER IDENTITÄTEN'],
    ['PROTOKOLLKAMMER','ORIGINALTON / ABSCHRIFT'],
    ['REGISTER','DER AUSSONDERUNG'],
    ['KAPELLE','DER LETZTEN UNTERSCHRIFT'],
    ['WARTESAAL','DER FREIWILLIGEN'],
    ['STIMM- UND','HALTUNGSSCHULE'],
    ['SPIEGELPRÜFUNG','DOPPELGÄNGERABGLEICH'],
    ['DEPOT','OHNE RÜCKGABE']
  ];
  for(let i=0;i<8;i++){
    const {code,ink}=PLAZA_ROOMS[i];
    g.save();g.translate(i%4*512,Math.floor(i/4)*512);g.beginPath();g.rect(0,0,512,512);g.clip();
    const enamel=g.createLinearGradient(0,0,0,512);
    enamel.addColorStop(0,i===3?'#562e38':'#374846');enamel.addColorStop(.32,'#2c3534');enamel.addColorStop(1,'#1b2729');
    g.fillStyle=enamel;g.fillRect(0,0,512,512);
    g.lineWidth=4;g.strokeStyle=ink;g.strokeRect(13,20,486,472);g.lineWidth=2;g.strokeRect(24,35,464,442);
    for(let j=0;j<3250;j++){g.fillStyle=j%2?'#ddcaa624':'#0d151038';g.fillRect(rng()*512,rng()*512,rng()*5+1,rng()*3+1);}
    centered('SCHLOSS ERLANGEN    ·    MORGENFORM',256,105,20,ink,'monospace');
    centered(titles[i][0],256,256,52,'#f5e6c6');centered(titles[i][1],256,333,35,'#f5e6c6');
    centered(code,256,425,36,ink,'monospace');
    for(const x of [50,462]){diamond(x,425,10,16);g.stroke();}
    g.restore();
  }
  const schemes=[
    ['#623c43','#a47463','#d3af75','#38282b'],
    ['#303f48','#65736b','#b4b69b','#28353a'],
    ['#6e343b','#a58459','#dfbf78','#351f2b'],
    ['#415546','#7d9378','#deca8a','#304c3e']
  ];
  for(let i=0;i<4;i++){
    const [base,secondary,ink,dark]=schemes[i];
    g.save();g.translate(i*512,1024);g.beginPath();g.rect(0,0,512,1024);g.clip();
    g.fillStyle=base;g.fillRect(0,0,512,1024);
    g.strokeStyle=secondary;g.lineWidth=2.5;
    for(let x=25,j=0;x<505;x+=51,j++)for(let y=-35+(j%2?30:0);y<1070;y+=61){
      diamond(x,y,26,31);g.stroke();diamond(x,y,8,10);g.fillStyle=j%3?dark:ink;g.fill();
    }
    g.strokeStyle=dark;g.lineWidth=22;g.strokeRect(26,29,460,966);
    for(const [inset,width] of [[8,2],[13,3],[29,2],[42,4],[55,1]]){
      g.strokeStyle=inset===29?secondary:ink;g.lineWidth=width;
      g.strokeRect(inset,inset,512-2*inset,1024-2*inset);
    }
    for(const y of [256,768]){
      diamond(256,y,141,156);g.fillStyle=dark;g.fill();g.strokeStyle=ink;g.stroke();
      for(let n=0;n<12;n++){
        const a=n*Math.PI/6;
        diamond(256+Math.cos(a)*77,y+Math.sin(a)*91,12,19);g.stroke();
      }
      diamond(256,y,44,64);g.stroke();
      g.beginPath();g.ellipse(256,y,28,13,0,0,Math.PI*2);g.stroke();
      g.beginPath();g.arc(256,y,6,0,Math.PI*2);g.fillStyle=ink;g.fill();
    }
    for(let n=0;n<13500;n++){g.fillStyle=n%2?'#edc99c34':'#16131943';g.fillRect(rng()*512,rng()*1024,.6+rng()*2,1+rng()*5);}
    for(let y=0;y<1024;y+=5){g.fillStyle='#33282430';g.fillRect(0,y,512,1);}
    g.restore();
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  return new T.MeshStandardMaterial({map,roughness:.94,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
}

export function smokedMirror(T){
  // Baked room sheen and age spots: no reflector cameras or extra scene passes.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
  const g=canvas.getContext('2d'),rand=randomSource(98717);
  const v=g.createLinearGradient(10,16,245,470);
  v.addColorStop(0,'#839b9b');v.addColorStop(.19,'#566d72');v.addColorStop(.34,'#303e47');
  v.addColorStop(.62,'#3e5055');v.addColorStop(.82,'#29343c');v.addColorStop(1,'#505959');
  g.fillStyle=v;g.fillRect(0,0,256,512);
  const r=g.createRadialGradient(104,55,6,104,55,132);
  r.addColorStop(0,'#d9ebdc8c');r.addColorStop(.32,'#b5ccc34e');r.addColorStop(1,'#b5ccc300');
  g.fillStyle=r;g.fillRect(0,0,256,512);
  const edge=g.createLinearGradient(0,0,256,0);
  edge.addColorStop(0,'#131d28b8');edge.addColorStop(.13,'#14222a18');edge.addColorStop(.84,'#14222a0a');edge.addColorStop(1,'#182429a6');
  g.fillStyle=edge;g.fillRect(0,0,256,512);
  for(let n=0;n<2600;n++){
    const x=rand()*256,y=rand()*512;
    if(x>22&&x<231&&y>20&&y<472&&rand()>.056)continue;
    g.fillStyle=n%2?'#acc4b51a':'#0e232736';g.fillRect(x,y,.5+rand()*2,1+rand()*4);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.33,metalness:.15,emissive:0x526f6c,emissiveMap:map,emissiveIntensity:.18});
}
