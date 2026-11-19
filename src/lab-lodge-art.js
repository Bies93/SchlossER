import {LAB} from './lab-layout.js';
import {randomSource} from './surface-detail.js';

const tiles={
  entry:['WOHNTRAKT B–SÜD','UNTERKUNFT · INTERN','Galerie oben. Das hier gibt es nicht.'],
  bunksA:['KASERNE I','FRÜHSCHICHT · AUSGABE 05:40','Privatnamen nicht auf die Spinde schreiben.'],
  bunksB:['KASERNE II','NACHTSCHICHT · LICHT AUS','Wer die Sirene träumt, hat keinen Nachtdienst.'],
  shift:['BETTENPLAN','01/04 · FRÜH     05/08 · NACHT','FREIE KISSEN NICHT UMBUCHEN.'],
  kitchen:['KÜCHE & KANTINE','SCHLOSS-SUD ZUR SUPPE / INTERN','Wer die Knödel zählt, macht Abwasch.'],
  menu:['WIRTSCHAFTSPLAN','MO: PFLICHTKNÖDEL   DI: BEKENNTNISBRÜHE','MI: RESTE VON DIENSTAG MIT HEIMATGEFÜHL.'],
  privateSign:['BETRIEBSLIEBE · 18+','PRIVATRAUM / NICHT STÖREN','NICHT TEIL DER DIENSTLICHEN FORTPFLANZUNG.'],
  consent:['ANTRAG AUF BEISCHLAF','☐ GERN     ☐ HEUTE NICHT     ☐ KLOPFEN!','EINVERNEHMEN IST NICHT STEMPELBAR.'],
  box:['KONDOMVORRAT','KLEIN / MITTEL / GROßSPRECHER','Bei Bedarf diskret. Bei Rückgabe: bitte NICHT.'],
  velvet:['GROSSER DIENST · KLEINES BETT','ZWEI KISSEN / KEIN NACHTPROTOKOLL',''],
  shrine:['ANDACHTSRAUM','LOGE DES ZWEITEN NAMENS','Bitte schweigen. Die Akten hören mit.'],
  register:['SEKTION B / NACHTWACHE','03:15   LEUCHTEN LASSEN','B–041 / DEN ALTEN NAMEN NICHT AUSSPRECHEN.'],
  eye:[],heart:[],crest:[],plaque:['BEKENNTNIS NACH DIENST','01 · SPEISEN   02 · SCHLAFEN','03 · ANDACHT  /  PRIVAT: KEIN REGISTER']
};
const keys=Object.keys(tiles);
export function lodgeArt(T){
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const c=canvas.getContext('2d'),rnd=randomSource(50081),tau=2*Math.PI;
  const fill=(x,y,w,h,ink)=>{c.fillStyle=ink;c.fillRect(x,y,w,h);};
  const type=(str,x,y,size,ink,font='monospace')=>{
    c.font='bold '+size+'px '+font;c.textAlign='center';c.fillStyle=ink;c.fillText(str,x,y,448);
  };
  const line=(points,ink,w=2)=>{c.beginPath();c.strokeStyle=ink;c.lineWidth=w;points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  function arc(x,y,rx,ry,ink,w=2){
    c.beginPath();c.strokeStyle=ink;c.lineWidth=w;c.ellipse(x,y,rx,ry,0,0,tau);c.stroke();
  }
  function stamp(id){
    const gold='#cd9e61',brass='#937347',dark='#33282a';
    fill(0,0,512,256,id==='heart'?'#643942':'#3a3d36');
    for(const j of [12,21]){c.strokeStyle=brass;c.lineWidth=2;c.strokeRect(j,j,512-2*j,256-2*j);}
    for(const [x,y] of [[32,31],[480,31],[32,226],[480,226]])arc(x,y,5,5,gold,1.3);
    const X=256,Y=112;
    for(const r of [63,76,89])arc(X,Y,r*1.5,r,brass,1.8);
    for(let n=0;n<32;n++){
      const a=tau*n/32,R=77+(n%4?2:8),p=(r)=>[X+Math.cos(a)*r*1.5,Y+Math.sin(a)*r];
      line([p(R),p(R+7)],n%4?brass:gold,n%4?1.4:2.8);
    }
    if(id==='heart'){
      c.strokeStyle=gold;c.lineWidth=4;c.beginPath();c.moveTo(X,Y+53);
      c.bezierCurveTo(236,147,184,112,187,87);c.bezierCurveTo(190,51,235,60,256,89);
      c.bezierCurveTo(283,58,321,50,325,89);c.bezierCurveTo(328,111,280,151,256,165);c.stroke();
      line([[202,78],[183,49],[215,66]],gold);line([[306,67],[332,48],[317,82]],gold);
      type('IM DIENST DER BETRIEBSLIEBE',256,225,24,gold,'Georgia');
    }else{
      line([[X,Y-60],[X+98,Y],[X,Y+62],[X-98,Y],[X,Y-60]],gold,2.6);
      c.strokeStyle=gold;c.lineWidth=3.5;c.beginPath();c.moveTo(X-65,Y);
      c.quadraticCurveTo(X,Y-58,X+65,Y);c.quadraticCurveTo(X,Y+53,X-65,Y);c.stroke();
      arc(X,Y,18,18,gold,3);arc(X,Y,5,12,brass,4);
      if(id==='crest')for(const u of [-130,130]){
        line([[X+u,Y-31],[X+u+16,Y],[X+u,Y+31],[X+u-16,Y],[X+u,Y-31]],brass,2);
        line([[X+u,Y-21],[X+u,Y+21]],gold,2);
      }
      fill(118,202,276,34,dark);
      type(id==='crest'?'SEKTION B · GESCHLOSSENER KREIS':'DER ZWEITE NAME SIEHT ALLES',256,225,23,gold,'Georgia');
    }
  }
  for(const [i,id] of keys.entries()){
    c.save();c.translate((i%4)*512,((i/4)|0)*256);
    if(['eye','heart','crest'].includes(id))stamp(id);
    else{
      const red=['privateSign','consent','box','velvet'].includes(id);
      const board=id==='menu'||id==='entry'||id==='plaque'||id==='shrine',ink=board||red?'#e4cfaa':'#443e34';
      fill(0,0,512,256,red?'#5e3743':board?'#485951':'#cdbd98');
      c.lineWidth=2;c.strokeStyle=red?'#c19673':board?'#bdb68e':'#7d7057';
      c.strokeRect(13,12,486,232);c.strokeRect(19,18,474,220);
      type(tiles[id][0],256,86,43,ink,'Georgia');
      line([[41,108],[472,108]],ink,1.4);
      type(tiles[id][1],256,151,27,ink);
      if(tiles[id][2])type(tiles[id][2],256,199,20,ink);
    }
    for(let p=0;p<650;p++)fill(rnd()*512,rnd()*256,1+rnd()*6,.7+rnd()*1.6,p%3?'#32261a23':'#fff1c626');
    c.restore();
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const paper=new T.MeshStandardMaterial({map,roughness:.87});
  return (room,t,x,y,z,w,h,angle=0,pitch=0)=>{
    const i=keys.indexOf(t),u=i%4*.25+.003,v=1-((i/4)|0)*.25-.247;
    const geo=new T.PlaneGeometry(w,h),uv=geo.getAttribute('uv');
    for(let j=0;j<uv.count;j++)uv.setXY(j,u+uv.getX(j)*.244,v+uv.getY(j)*.244);
    const mesh=new T.Mesh(geo,paper);mesh.name='Wohntrakt · '+t;
    mesh.position.set(x,LAB.floor+y,z);mesh.rotation.set(pitch,angle,0,'YXZ');room.add(mesh);
  };
}
