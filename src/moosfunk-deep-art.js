import {randomSource} from './surface-detail.js';

const pages={
  entry:['↓  UNTERDECK','MOOSFUNK · NACH FEIERABEND'],
  welcome:['HINTER DEN VORHÄNGEN','NUR FÜR ERWACHSENE · 18+','FRAGEN. ZUHÖREN. GRENZEN RESPEKTIEREN.'],
  cabinet:['SPIELZEUG & PFLEGE','SAUBER LINKS · BENUTZT IN DIE WANNE','KEINE GRUPPENABSTIMMUNG ERFORDERLICH.'],
  rest:['RUHEN IST KEIN VERRAT','WASSER · DECKEN · WASCHTÜCHER','LICHT BITTE FÜR DIE NÄCHSTEN ANLASSEN.'],
  orb:['TIEFFUNK','KAMMER DES NACHHALLS','NICHT AN DIE HAUSANTENNE ANSCHLIESSEN.'],
  log:['FUNKBUCH 06 · 03:14','ANTENNE GETRENNT. TON NOCH DA.','ABSTIMMUNG: ZWEI DAFÜR. EINE STIMME AUS DER KUGEL.'],
  bench:['GEMEINSAM GEBORGEN','MOOSFUNK · UNTERDECK',''],
  sun:[], moon:[], chalk:[], tide:[],
  poppy:[],nightbird:[], hills:[],dance:[],fern:[],moth:[],
  eclipse:[],ears:[],vigil:[],stain:[]
};
const keys=Object.keys(pages),colors=['#4e6653','#734c50','#665055','#4d6664','#334b4b','#505560','#78524d','#603f47','#354d56','#292837','#4c465e'];
export function deepArt(T){
  const cols=5,rows=Math.ceil(keys.length/cols),cell=384;
  const sheet=document.createElement('canvas');sheet.width=cols*cell;sheet.height=rows*cell;
  const c=sheet.getContext('2d'),rand=randomSource(14317);
  const line=(a,b,d,e)=>{c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke();};
  const ring=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
  const point=(t,r)=>[256+Math.cos(t)*r,256+Math.sin(t)*r];
  for(const [i,id] of keys.entries()){
    c.save();c.translate(i%cols*cell,Math.floor(i/cols)*cell);c.scale(cell/512,cell/512);
    c.beginPath();c.rect(0,0,512,512);c.clip();
    const page=pages[id];
    const clear=id==='chalk'||id==='stain';
    if(!clear){c.fillStyle=colors[i]??['#543540','#324b54','#446257','#995342','#304e46','#514261','#263b49','#354643','#4e3037'][i-11];c.fillRect(0,0,512,512);}
    c.strokeStyle=i===9?'#adcbb2':'#dfbd8c';c.lineWidth=3;
    if(!clear){c.strokeRect(19,20,474,472);c.strokeRect(28,30,456,452);}
    if(id==='stain'){
      const blot=(x,y,r,color)=>{
        c.fillStyle=color;c.beginPath();for(let j=0;j<48;j++){const a=j*Math.PI/24,R=r*(.83+.25*rand()+.19*Math.sin(3*a));
          const X=x+R*Math.cos(a),Y=y+.61*R*Math.sin(a);if(j)c.lineTo(X,Y);else c.moveTo(X,Y);}
        c.closePath();c.fill();
      };
      blot(248,257,110,'#552725');blot(233,266,80,'#422020');
      for(let j=0;j<82;j++){const a=rand()*6.28,r=77+rand()*153;blot(249+Math.cos(a)*r,255+Math.sin(a)*r*.83,2+rand()**3*21,'#64302a');}
      // Broken residue, not opaque paint: leave the stone grain and tile
      // joints visible through wiped centres and tiny dry pinholes.
      c.globalCompositeOperation='destination-out';
      for(let j=0;j<4900;j++){
        c.fillStyle=j%4?'rgba(0,0,0,.47)':'rgba(0,0,0,.81)';
        c.fillRect(100+rand()*312,149+rand()*219,.7+rand()*4,.6+rand()*1.9);
      }
      c.globalCompositeOperation='source-over';
    }else if(i>=11){
      const oval=(x,y,a,b,rot,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,a,b,rot,0,Math.PI*2);c.fill();};
      const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
      const honey='#dfb77c',blush='#c97c69',ink='#282e35',pale='#e5d3ac';
      if(id==='poppy'||id==='fern'){
        for(let j=0;j<8;j++){
          const x=64+j*49,Y=134+rand()*125;c.strokeStyle=honey;c.lineWidth=3;line(251,391,x,Y);
          if(id==='poppy'){for(let n=0;n<5;n++){const a=n*1.256;oval(x+Math.cos(a)*15,Y+Math.sin(a)*15,19,13,a,blush);}oval(x,Y,8,7,0,ink);}
          else for(let n=0;n<7;n++){const t=n/8,X=x*(1-t)+251*t,y=Y*(1-t)+391*t;for(const s of [-1,1])oval(X+s*10,y,17,4,s*.58,honey);}
        }
      }else if(id==='moth'||id==='nightbird'){
        oval(252,223,114,114,0,honey);
        for(const s of [-1,1]){
          const w=id==='moth'?112:147;
          poly([[254,260],[252+s*w,119],[255+s*158,182],[246+s*132,246],[254+s*61,278],[251+s*95,328],[253+s*43,347]],ink);
          for(let n=0;n<5;n++){c.strokeStyle=blush;line(252+s*16,257,253+s*(72+n*14),159+n*14);}
          if(id==='moth')oval(256+s*92,214,15,19,s*.4,honey);
        }
        oval(256,246,11,66,0,ink);
      }else if(id==='hills'||id==='dance'){
        oval(326,147,53,53,0,honey);
        for(let j=0;j<4;j++){const pts=[[41,399]];for(let x=41;x<=471;x+=10)pts.push([x,204+j*43+32*Math.sin(x/65+j*.93)]);
          pts.push([471,399]);poly(pts,[pale,'#b68666','#68796b',ink][j]);}
        if(id==='dance')for(let j=0;j<3;j++){const x=146+j*86;oval(x,248,12,13,0,honey);c.strokeStyle=honey;c.lineWidth=9;
          line(x,264,x-5,303);line(x-5,303,x+24,343);line(x-5,303,x-32,329);line(x,273,x-35,245);line(x,273,x+35,235);}
      }else{
        for(let n=0;n<27;n++){const a=n*.233;line(256+Math.cos(a)*96,220+Math.sin(a)*96,256+Math.cos(a)*154,220+Math.sin(a)*154);}
        if(id==='eclipse'){oval(256,220,94,94,0,honey);oval(277,205,84,84,0,ink);}
        if(id==='ears'){for(let j=0;j<5;j++){c.beginPath();c.ellipse(256,221,102-j*15,50-j*7,.14,0,Math.PI*2);c.stroke();}oval(256,220,16,33,0,ink);}
        if(id==='vigil'){poly([[256,111],[346,333],[166,333]],ink);oval(256,232,26,42,0,blush);oval(256,245,14,22,0,honey);}
      }
      const titles=['MOHN IM MAI','NACHTFLUG','WIESENTTAL','LETZTER TANZ','WALDARCHIV','NACHTFALTER','DIE BEDECKUNG','DAS INNERE OHR','STILLE GABE'];
      c.fillStyle=pale;c.textAlign='center';c.font='bold 31px Georgia';c.fillText(titles[i-11],256,445);
    }else if(page.length){
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
    if(!clear)for(let j=0;j<2600;j++){
      c.fillStyle=j%3===0?'#ecd4a41f':'#1d182523';c.fillRect(rand()*512,rand()*512,.5+rand()*3,1+rand()*2);
    }
    c.restore();
  }
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardMaterial({map,roughness:.96}),
    chalk=new T.MeshStandardMaterial({map,roughness:1,alphaTest:.14,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const residue=new T.MeshStandardMaterial({map,roughness:.94,transparent:true,opacity:.77,depthWrite:false});
  return {mount(room,id,at,w,h,yaw=0,pitch=0,roll=0){
    const i=keys.indexOf(id),banner=['sun','moon','tide','bench'].includes(id);
    const geo=new T.PlaneGeometry(w,h,banner?16:1,banner?8:1),uv=geo.attributes.uv,xyz=geo.attributes.position;
    for(let j=0;j<uv.count;j++){
      const s=uv.getX(j),t=uv.getY(j);
      if(banner)xyz.setXYZ(j,xyz.getX(j),xyz.getY(j)-.051*Math.sin(s*Math.PI)*(1-t),.018*Math.sin(s*24+t*1.6));
      uv.setXY(j,(i%cols+(6+s*500)/512)/cols,(rows-1-Math.floor(i/cols)+(6+t*500)/512)/rows);
    }
    if(banner)geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,id==='chalk'?chalk:id==='stain'?residue:material);mesh.name='Moosfunk · '+id;
    mesh.position.fromArray(at);mesh.rotation.set(pitch,yaw,roll,'YXZ');room.add(mesh);return mesh;
  }};
}
