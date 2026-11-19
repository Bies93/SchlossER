import {randomSource} from './surface-detail.js';

const pages={
  entry:['↓  UNTERDECK','MOOSFUNK · NACH FEIERABEND'],
  welcome:['HINTER DEN VORHÄNGEN','NUR FÜR ERWACHSENE · 18+','FRAGEN. ZUHÖREN. GRENZEN RESPEKTIEREN.'],
  cabinet:['SPIELZEUG & PFLEGE','SAUBER LINKS · BENUTZT IN DIE WANNE','KEINE GRUPPENABSTIMMUNG ERFORDERLICH.'],
  rest:['RUHEN IST KEIN VERRAT','WASSER · DECKEN · WASCHTÜCHER','LICHT BITTE FÜR DIE NÄCHSTEN ANLASSEN.'],
  orb:['TIEFFUNK','KAMMER DES NACHHALLS','NICHT AN DIE HAUSANTENNE ANSCHLIESSEN.'],
  log:['FUNKBUCH 06 · 03:14','ANTENNE GETRENNT. TON NOCH DA.','ABSTIMMUNG: ZWEI DAFÜR. EINE STIMME AUS DER KUGEL.'],
  bench:['GEMEINSAM GEBORGEN','MOOSFUNK · UNTERDECK',''],
  sun:[], moon:[], chalk:[], tide:[]
};
const keys=Object.keys(pages),colors=['#4e6653','#734c50','#665055','#4d6664','#334b4b','#505560','#78524d','#603f47','#354d56','#292837','#4c465e'];
export function deepArt(T){
  const sheet=document.createElement('canvas');sheet.width=2048;sheet.height=1536;
  const c=sheet.getContext('2d'),rand=randomSource(14317);
  const line=(a,b,d,e)=>{c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke();};
  const ring=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
  const point=(t,r)=>[256+Math.cos(t)*r,256+Math.sin(t)*r];
  for(const [i,id] of keys.entries()){
    c.save();c.translate(i%4*512,Math.floor(i/4)*512);
    const page=pages[id];
    if(id!=='chalk'){c.fillStyle=colors[i];c.fillRect(0,0,512,512);}
    c.strokeStyle=i===9?'#adcbb2':'#dfbd8c';c.lineWidth=3;
    if(i!==9){c.strokeRect(19,20,474,472);c.strokeRect(28,30,456,452);}
    if(page.length){
      const text=(s,y,px,font)=>{c.fillStyle='#f1d4a5';c.textAlign='center';c.font='bold '+px+'px '+font;c.fillText(s,256,y,420);};
      text(page[0],137,63,'Georgia');line(53,166,459,166);
      text(page[1],283,36,'monospace');
      if(page[2])text(page[2],385,27,'monospace');
      line(74,433,438,433);
      for(const x of [39,473])for(const y of [44,468])ring(x,y,4.5);
    }else{
      const count=id==='sun'?20:id==='moon'?12:24;
      if(id==='chalk')c.globalAlpha=.55;
      for(const r of [83,113,164,207])ring(256,256,r);
      if(id==='moon'){
        c.beginPath();c.arc(253,254,57,.27,Math.PI*1.82);c.quadraticCurveTo(242,252,308,269);c.stroke();
      }else{
        for(let q=0;q<5;q++){
          const a=q*Math.PI*2/5-Math.PI/2,b=a+Math.PI*4/5;
          line(...point(a,112),...point(b,112));
        }
        if(id==='sun')ring(256,256,39);
      }
      for(let j=0;j<count;j++){
        const t=j*Math.PI*2/count,a=point(t,171),b=point(t,201);
        line(...a,...b);
        if(j%2===0){const [x,y]=point(t,145);ring(x,y,j%4===0?6:3);}
        if(j%3===0)line(...point(t-.085,228),...point(t+.085,228));
      }
      c.globalAlpha=1;
    }
    if(id!=='chalk')for(let j=0;j<2600;j++){
      c.fillStyle=j%3===0?'#ecd4a41f':'#1d182523';c.fillRect(rand()*512,rand()*512,.5+rand()*3,1+rand()*2);
    }
    c.restore();
  }
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardMaterial({map,roughness:.96}),
    chalk=new T.MeshStandardMaterial({map,roughness:1,alphaTest:.14,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  return {mount(room,id,at,w,h,yaw=0,pitch=0,roll=0){
    const i=keys.indexOf(id),banner=['sun','moon','tide','bench'].includes(id);
    const geo=new T.PlaneGeometry(w,h,banner?16:1,banner?8:1),uv=geo.attributes.uv,xyz=geo.attributes.position;
    for(let j=0;j<uv.count;j++){
      const s=uv.getX(j),t=uv.getY(j);
      if(banner)xyz.setXYZ(j,xyz.getX(j),xyz.getY(j)-.051*Math.sin(s*Math.PI)*(1-t),.018*Math.sin(s*24+t*1.6));
      uv.setXY(j,(i%4+(6+s*500)/512)/4,(2-Math.floor(i/4)+(6+t*500)/512)/3);
    }
    if(banner)geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,id==='chalk'?chalk:material);mesh.name='Moosfunk · '+id;
    mesh.position.fromArray(at);mesh.rotation.set(pitch,yaw,roll,'YXZ');room.add(mesh);return mesh;
  }};
}
