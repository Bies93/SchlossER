import {randomSource} from './surface-detail.js';
import {LAB} from './lab-layout.js';

const pages={
  entry:['HERKUNFTSSTELLE','PERSONALWEG · PROJEKT BAYERN','BERECHTIGUNG VOR BETRETEN PRÜFEN'],
  office:['AMT FÜR HERKUNFTSBEREINIGUNG','AUSGABE DER AMTLICH GÜLTIGEN HERKUNFT','BITTE WARTEMARKE ZIEHEN.'],
  form:['ANTRAG H–04','NAME VOR DER ERFASSUNG: _________________','NAME NACH DER ERFASSUNG: _________________','FREIWILLIG · VOREINSTELLUNG DER DIENSTSTELLE'],
  reject:['WIDERSPRUCH','BESTÄTIGT FRÄNKISCHE','RESTPRÄGUNG'],
  queue:['NUMMERNAUFRUF','041     SCHALTER 02','BEARBEITUNGSSTAND: SEIT 06:14'],
  files:['NAMENSREGISTER','NUR PERSONAL / ALTBESTAND F','KARTEIKARTEN NICHT TRENNEN.'],
  faceA:[],faceB:[],
  rite:['KAPELLE DER ZWEITEN GEBURT','RITENSTELLE · BAND 04 / B–041','HIER BEGINNT DIE AMTLICHE ERINNERUNG.'],
  oath:['AUFNAHME 04 · B–041','TAKE 1: DIENSTLICH VERWENDBAR','TAKE 2: WÖRTLICH IDENTISCH','TAKE 3: NICHT ABSPIELEN.'],
  pipes:['LEITUNGSWEG · SUDWERK','NACHTAUSGABE / SENSORISCHE ABNAHME','KUPFERROHRE NICHT ALS HANDLAUF NUTZEN.'],
  tasting:['PRÜFSTUBE FÜR BIER UND BEKENNTNIS','JURY · NUR NUMMERN, KEINE HERKUNFT','BEWERTUNGSBÖGEN NACH DEM LETZTEN GLAS.'],
  result:['BLINDPRÜFUNG · NACHTSCHICHT','01 · PROBE F–05    /    47 PUNKTE','02 · PROBE B–02    /    31 PUNKTE','SIEGER: FRÄNKISCHER SUD.'],
  bottle:['OBERBAYERISCHES','KONTROLLGETRÄNK','CHARGE F–05 / NEU EINGESTUFT'],
  score:['BEWERTUNGSBOGEN · F–05','GERUCH  10      FARBE  09','GESCHMACK  18      BEKENNTNIS  10','SUMME: 47 · NICHT AUSHÄNGEN'],
  seal:['ERFASST','B–041 · RITENSTELLE','NAMEN NUR GEGEN STEMPEL WECHSELN.'],
  lodgeGate:[],lodgeMirror:[],lodgeEye:[],altarCloth:[],
  waiting:['WARTEN BIS ZUM AUFRUF','BITTE NICHT NACH NAMEN AUFRUFEN.','ALTE NAMEN WERDEN NICHT ZURÜCKGEGEBEN.','041 / SCHALTER 02 · BITTE BEREITHALTEN'],
  dispatch:['HEUTE IM UM­LAUF','F–019 · H–04 OHNE UNTERSCHRIFT','B–041 · BILD BEREITS VERWENDET','DOPPELABZUG IN DIE RITENSTELLE.'],
  audit:['NACHTDIENST · RÜCKLÄUFE','ROTE LASCHEN NICHT AUSSORTIEREN.','DOPPELTE PORTRÄTS NICHT VERMERKEN.'],
  tabs:[]
};
const keys=Object.keys(pages);
export function ritesArt(T){
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=Math.ceil(keys.length/4)*512;
  const c=canvas.getContext('2d'),r=randomSource(90804);
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const ellipse=(x,y,w,h,color,angle=0)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,angle,0,Math.PI*2);c.fill();};
  const text=(words,x,y,px,ink,f='monospace',width=438)=>{
    c.fillStyle=ink;c.font='bold '+px+'px '+f;c.textAlign='center';c.fillText(words,x,y,width);
  };
  function polygon(pts,ink){
    c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=ink;c.fill();
  }
  function line(points,ink,width){
    c.strokeStyle=ink;c.lineWidth=width;c.beginPath();
    points.forEach(([u,v],i)=>i?c.lineTo(u,v):c.moveTo(u,v));c.stroke();
  }
  function lodge(id){
    const brass='#b3915e',shade='#6e6048',light='#d3b376',wine=id==='altarCloth';
    rect(0,0,512,512,wine?'#542d32':'#282a26');
    for(let i=0;i<65;i++){
      const y=11+i*7.7+Math.sin(i)*2;
      line([[14,y],[256,y+Math.sin(i*.49)*3],[499,y-1]],wine?'#2b1b1d44':'#1c211c48',.85);
    }
    c.strokeStyle=shade;c.lineWidth=2.1;
    c.strokeRect(28,24,456,464);c.strokeRect(42,38,428,436);
    for(const x of [55,457])for(const y of [53,459]){
      const s=x<256?1:-1,t=y<256?1:-1;
      line([[x+s*47,y],[x,y],[x,y+t*44],[x+s*10,y+t*31],[x+s*32,y+t*9],[x+s*47,y]],brass,2.5);
    }
    function ring(cx,cy,r,ink=brass,width=2){
      c.strokeStyle=ink;c.lineWidth=width;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
    }
    if(id==='lodgeEye'||wine){
      const y=wine?251:235,S=wine?.64:1;
      for(const r of [97,109,129,141])ring(256,y,r*S,r%2?shade:brass,2.25);
      for(let i=0;i<48;i++){
        const a=Math.PI*i/24,A=(138+i%4*3)*S,B=(156+i%4*3)*S;
        line([[256+A*Math.cos(a),y+A*Math.sin(a)],[256+B*Math.cos(a),y+B*Math.sin(a)]],i%4?shade:light,i%4?1.1:2.9);
      }
      line([[256,y-105*S],[356,y+38*S],[156,y+38*S],[256,y-105*S]],brass,3.5);
      c.strokeStyle=light;c.lineWidth=3.4;c.beginPath();c.moveTo(256-60*S,y+2);
      c.quadraticCurveTo(256,y-61*S,256+60*S,y+2);c.quadraticCurveTo(256,y+53*S,256-60*S,y+2);c.stroke();
      ring(256,y+2,18*S,brass,2.8);ellipse(256,y+2,6*S,9*S,light);
      for(let j=0;j<(wine?0:7);j++){
        const L=62+j*11,r=y+56+j*8;
        line([[256-L,r],[256+L,r]],shade,1.4);
        for(let i=-2;i<=2;i++)if(Math.abs(i*24)<L-6)line([[256+i*24+(j%2?6:-6),r],[256+i*24+(j%2?6:-6),r+7]],shade,1);
      }
    }else{
      const mirror=id==='lodgeMirror';
      ring(256,221,122,shade,2.4);
      for(let i=0;i<32;i++){
        const a=Math.PI*i/16,A=124,B=i%4?132:145;
        line([[256+A*Math.cos(a),221+A*Math.sin(a)],[256+B*Math.cos(a),221+B*Math.sin(a)]],brass,1.3);
      }
      // The gate has only one shadow; the mirror has two identical ones.
      for(const dx of mirror?[-42,42]:[0]){
        const x=256+dx;
        polygon([[x-63,328],[x-48,160],[x,116],[x+48,160],[x+63,328]],'#33352c');
        line([[x-56,322],[x-42,159],[x,124],[x+42,159],[x+56,322],[x-56,322]],brass,3);
        ellipse(x,201,14,20,light);
        polygon([[x,216],[x-21,278],[x-29,297],[x+29,297],[x+21,278]],brass);
        line([[x,227],[x,297]],shade,2);
      }
      if(mirror)line([[256,119],[256,338]],light,1.4);
      else for(let i=0;i<5;i++)line([[256-(42+i*17),343+i*8],[256+(42+i*17),343+i*8]],shade,2.1);
    }
    const legend={lodgeEye:'DIE LOGE DES ZWEITEN NAMENS',lodgeGate:'I · DIE SCHWELLE',lodgeMirror:'II · DER ZWEITE SPIEGEL',altarCloth:'B–041'};
    text(legend[id],256,437,wine?28:29,light,'Georgia',399);
  }
  function face(cx,variant){
    c.save();c.translate(cx,209);
    const hair=variant?'#5c4637':'#493f36',skin=variant?'#ad9477':'#b79c7d',shade='#625348';
    rect(-88,-105,176,209,'#887762');
    for(let i=0;i<9;i++)rect(-85,-99+i*22,169,1,'#746555');
    polygon([[-85,101],[-69,72],[-26,51],[30,51],[78,78],[85,101]],'#4d5048');
    polygon([[-33,49],[-9,36],[3,70],[-16,93]],'#ad9d84');
    polygon([[33,49],[9,35],[3,70],[22,93]],'#a2917c');
    ellipse(-.5,31,25,30,skin);
    if(variant)ellipse(1,-27,63,76,hair,.09);
    ellipse(-2,-24,variant?45:51,67,shade);
    ellipse(-3,-26,variant?41:47,63,skin);
    ellipse(-43,-15,8,15,skin,.12);ellipse(43,-15,8,15,skin,-.08);
    polygon(variant?[[-44,-42],[-39,-77],[-15,-94],[26,-92],[43,-73],[51,-27],[31,-44],[12,-57],[-6,-48],[-34,-37]]
      :[[-47,-45],[-38,-78],[-13,-91],[25,-85],[48,-67],[47,-48],[29,-65],[-8,-67],[-34,-55]],hair);
    line([[-33,-38],[-23,-44],[-12,-42]],shade,variant?3:5);line([[11,-41],[21,-45],[31,-38]],shade,variant?3:5);
    ellipse(-22,-28,8.5,3.8,'#d4bca0');ellipse(22,-28,8.0,3.6,'#d4bca0');
    ellipse(-22,-27,2.9,3.2,'#433d36');ellipse(22,-27,2.9,3.3,'#433d36');
    line([[-5,-30],[-9,-8],[-1,-3],[7,-8]],shade,2.8);
    if(!variant)polygon([[-31,8],[-21,2],[-4,5],[3,2],[27,4],[32,10],[16,14],[-16,13]],hair);
    line([[-19,21],[-1,19],[15,21]],'#70564c',3.4);
    if(variant)ellipse(-26,13,2.8,2.6,'#514538');
    line([[-38,50],[2,63],[41,50]],'#4e463c',2.5);
    c.restore();
  }

  for(const [i,id] of keys.entries()){
    c.save();c.translate((i%4)*512,(i>>2)*512);
    const official=['entry','office','files','rite','pipes','tasting'].includes(id),dark=id==='queue';
    const paper=dark?'#13231e':official?'#394e50':'#ccb994',ink=dark?'#bcda9d':official?'#ead9b1':'#483e32';
    rect(0,0,512,512,paper);
    c.lineWidth=3;c.strokeStyle=official||dark?'#9c9d79':'#584d3f';c.strokeRect(17,17,478,478);c.strokeRect(24,24,464,464);
    if(id.startsWith('lodge')||id==='altarCloth'){
      lodge(id);
    }else if(id==='tabs'){
      for(let i=0;i<16;i++){
        const x=(i%4)*128,y=(i>>2)*128,red=i>=12;
        rect(x,y,128,128,red?'#aa775f':i%4===0?'#aa9d7a':'#c8b896');
        rect(x+7,y+12,114,2,'#736452');rect(x+7,y+113,114,2,'#7e6b55');
        if(i<13){
          text((red?'F–':'B–')+(19+i).toString().padStart(3,'0'),x+64,y+61,29,'#443a30','monospace',114);
          text(i%3===0?'RÜCKLAUF':'AKTE '+(i%5+1),x+64,y+93,16,red?'#612d28':'#645847','monospace',114);
        }else{
          text('0'+(i-12),x+64,y+70,58,'#443a30','Georgia',110);
          text('SCHALTER',x+64,y+94,17,'#674533','monospace',104);
        }
      }
    }else if(id==='faceA'||id==='faceB'){
      const variant=id==='faceB',names=variant?['MARTHA KERN','MARIA KERNBACH']:['ANTON RÖSCH','ALOIS RIEDL'];
      text('IDENTITÄTSABGLEICH',256,74,36,ink,'Georgia');
      face(135,variant);face(377,variant);
      c.strokeStyle='#493f33';c.strokeRect(46,103,178,211);c.strokeRect(288,103,178,211);
      for(const [j,x] of [135,377].entries()){
        text(names[j],x,362,26,ink,'monospace',209);
        text(j?'AMTLICHER NAME':'ALTREGISTER F',x,404,20,'#614c3a','monospace',202);
      }
      text(variant?'F–028   →   B–039':'F–019   →   B–041',256,461,30,'#773c32');
    }else if(id==='form'){
      text(pages[id][0],256,101,53,ink,'Georgia');
      text(pages[id][1],256,205,26,ink);text(pages[id][2],256,272,26,ink);
      c.lineWidth=4;c.strokeStyle='#594d3d';c.strokeRect(42,319,38,37);
      line([[50,336],[63,347],[79,322]],'#733a32',5);
      text('FREIWILLIG · BEREITS ANGEKREUZT',296,348,23,'#6a3a30', 'monospace',397);
      text('ÄNDERUNG DES KREUZES NICHT VORGESEHEN.',256,440,21,ink);
    }else if(id==='reject'){
      c.save();c.translate(255,257);c.rotate(-.105);c.strokeStyle='#834538';c.lineWidth=8;c.strokeRect(-207,-133,414,266);
      c.strokeStyle='#834538';c.lineWidth=3;c.strokeRect(-190,-118,380,236);
      pages[id].forEach((row,j)=>text(row,0,-52+j*62,j?44:51,'#82453a','Georgia',356));
      c.restore();
    }else{
      const long=pages[id].length>3;
      text(pages[id][0],256,long?94:146,dark?71:56,ink, dark?'monospace':'Georgia');
      line([[40,long?133:204],[472,long?133:204]],ink,2.1);
      for(let j=1;j<pages[id].length;j++){
        const y=(long?135:233)+j*(long?82:86);
        text(pages[id][j],256,y, dark&&j===1?58:32,dark?'#c4e3a9':id==='result'&&j===3?'#773c30':ink);
        if(long)rect(50,y+27,412,1,official?'#96957b':'#867458');
      }
    }
    for(let n=0;n<1700;n++){
      rect(r()*512,r()*512,1+r()*6,.5+r()*1.8,n%4?'#291e1617':'#fff3d027');
    }
    c.restore();
  }
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  const standard=new T.MeshStandardMaterial({map:tex,roughness:.91});
  const bright=new T.MeshBasicMaterial({map:tex});
  const curved=new WeakMap();
  const sy=512/canvas.height,uvSize=[.244,sy*.976];
  const origin=id=>{const i=keys.indexOf(id);return [(i%4)*.25+.003,1-((i>>2)+1)*sy+sy*.012];};
  function buffer(room){
    if(!curved.has(room))curved.set(room,{pos:[],uv:[],n:[]});
    return curved.get(room);
  }
  function surface(room,id,at,nx,ny,nz,cut,N=1,M=1){
    const bin=buffer(room),[U,V]=origin(id),[u,v,w,h]=cut;
    function put(s,t){
      bin.pos.push(...at(s,t));bin.uv.push(U+(u+s*w)*uvSize[0],V+(v+t*h)*uvSize[1]);bin.n.push(nx,ny,nz);
    }
    for(let i=0;i<N;i++)for(let j=0;j<M;j++){
      const a=i/N,b=(i+1)/N,c=j/M,d=(j+1)/M;
      put(a,c);put(b,c);put(b,d);put(a,c);put(b,d);put(a,d);
    }
  }
  return {mount(room,id,x,y,z,w,h,angle=0,pitch=0,roll=0){
    const [u,v]=origin(id),g=new T.PlaneGeometry(w,h),uv=g.getAttribute('uv');
    for(let k=0;k<uv.count;k++)uv.setXY(k,u+uv.getX(k)*uvSize[0],v+uv.getY(k)*uvSize[1]);
    const m=new T.Mesh(g,id==='queue'?bright:standard);
    m.name='Ritenflügel · '+id;m.position.set(x,LAB.floor+y,z);m.rotation.set(pitch,angle,roll,'YXZ');room.add(m);
  }, band(room,id,x,y,z,r,h){
    const bin=buffer(room),[U,V]=origin(id);
    const put=(u,v)=>{
      const a=(u-.5)*2.11,c=Math.cos(a),s=Math.sin(a);
      bin.pos.push(x-r*c,LAB.floor+y+(v-.5)*h,z+r*s);bin.uv.push(U+u*uvSize[0],V+v*uvSize[1]);bin.n.push(-c,0,s);
    };
    for(let i=0;i<14;i++){
      const a=i/14,b=(i+1)/14;put(a,0);put(b,0);put(b,1);put(a,0);put(b,1);put(a,1);
    }
  },tab(room,index,at,side){
    const i=(index%13+13)%13;
    surface(room,'tabs',at,side,0,0,[(i%4)*.25+.007,(3-(i>>2))*.25+.007,.236,.236]);
  },badge(room,index,at){
    const i=13+index;
    surface(room,'tabs',at,0,0,-1,[(i%4)*.25+.007,.007,.236,.236]);
  },cloth(room,at){
    surface(room,'altarCloth',at,-1,0,0,[0,0,1,1],24,7);
  },finish(room){
    const bin=curved.get(room);if(!bin)return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(bin.pos,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(bin.uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(bin.n,3));
    const m=new T.Mesh(g,standard);m.name='Ritenflügel · Etiketten und Tuchflächen';room.add(m);curved.delete(room);
  }};
}
