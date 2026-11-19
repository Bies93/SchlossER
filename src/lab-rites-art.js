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
  seal:['ERFASST','B–041 · RITENSTELLE','NAMEN NUR GEGEN STEMPEL WECHSELN.']
};
const keys=Object.keys(pages);
export function ritesArt(T){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
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
    if(id==='faceA'||id==='faceB'){
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
  const origin=id=>{const i=keys.indexOf(id);return [(i%4)*.25+.003,(3-(i>>2))*.25+.003];};
  return {mount(room,id,x,y,z,w,h,angle=0,pitch=0,roll=0){
    const [u,v]=origin(id),g=new T.PlaneGeometry(w,h),uv=g.getAttribute('uv');
    for(let k=0;k<uv.count;k++)uv.setXY(k,u+uv.getX(k)*.244,v+uv.getY(k)*.244);
    const m=new T.Mesh(g,id==='queue'?bright:standard);
    m.name='Ritenflügel · '+id;m.position.set(x,LAB.floor+y,z);m.rotation.set(pitch,angle,roll,'YXZ');room.add(m);
  }, band(room,id,x,y,z,r,h){
    if(!curved.has(room))curved.set(room,{pos:[],uv:[],n:[]});
    const bin=curved.get(room),[U,V]=origin(id);
    const put=(u,v)=>{
      const a=(u-.5)*2.11,c=Math.cos(a),s=Math.sin(a);
      bin.pos.push(x-r*c,LAB.floor+y+(v-.5)*h,z+r*s);bin.uv.push(U+u*.244,V+v*.244);bin.n.push(-c,0,s);
    };
    for(let i=0;i<14;i++){
      const a=i/14,b=(i+1)/14;put(a,0);put(b,0);put(b,1);put(a,0);put(b,1);put(a,1);
    }
  },finish(room){
    const bin=curved.get(room);if(!bin)return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(bin.pos,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(bin.uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(bin.n,3));
    const m=new T.Mesh(g,standard);m.name='Prüfstube · gekrümmte Chargenetiketten';room.add(m);curved.delete(room);
  }};
}
