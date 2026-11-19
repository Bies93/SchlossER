import {architectureKit} from './architecture-kit.js';
import {LAB,LAB_CUT,LAB_CELLS,LAB_LINKS,LAB_LAYER,labLower,labCellAt,labEdges} from './lab-layout.js';

const {floor,ceiling}=LAB,matrices=(x,y,z)=>[x,y,z],below=p=>labLower(p.y);
const cellNames={chambers:'Klonkammern',lock:'Druckschleuse',spine:'Verteiler',archive:'Archiv',plant:'Maschinenraum',
  return:'Wartungsgang',observation:'Beobachtung',vault:'Saal der Rückgabe'};
const palettes={lock:['iron','green'],spine:['concrete','green'],archive:['archiveWall','rust'],
  plant:['concrete','iron'],return:['concrete','rust'],observation:['ceramic','green'],vault:['vaultWall','rust']};
const ports=Object.fromEntries(Object.keys(LAB_CELLS).map(id=>[id,LAB_LINKS.filter(([a,b])=>a===id||b===id)]));
const own=new Set(['lock:chambers','lock:spine','archive:spine','plant:spine','plant:return','observation:return','observation:chambers','vault:plant']);

// Find at most two rooms beyond the current room; the second doorway must
// overlap the sight wedge of the first one. Camera frustum culling is additional.
export function labVisibility(id,x,z){
  const result=new Set([id]);
  function arc(axis,edge,min,max){
    const dx=axis==='x'?edge-x:(min+max)/2-x,dz=axis==='x'?(min+max)/2-z:edge-z;
    const centre=Math.atan2(dz,dx),diff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
    if(Math.abs(axis==='x'?dx:dz)<.27&&(axis==='x'?z:x)>min-.15&&(axis==='x'?z:x)<max+.15)return null;
    const lo=axis==='x'?Math.atan2(min-z,dx):Math.atan2(dz,min-x);
    const hi=axis==='x'?Math.atan2(max-z,dx):Math.atan2(dz,max-x);
    const ends=[diff(lo,centre),diff(hi,centre)].sort((a,b)=>a-b);
    return [centre+ends[0]-.041,centre+ends[1]+.041];
  }
  function overlap(a,b){
    if(!a||!b)return true;
    for(const shift of [-Math.PI*2,0,Math.PI*2])if(Math.max(a[0],b[0]+shift)<=Math.min(a[1],b[1]+shift))return true;
    return false;
  }
  for(const [a,b,...p] of ports[id]??[]){
    const next=a===id?b:a,wedge=arc(...p);result.add(next);
    for(const [j,k,...q] of ports[next])if(overlap(wedge,arc(...q)))result.add(j===next?k:j);
  }
  return result;
}

export function labCameraMode(p){
  const cell=labCellAt(p.x,p.z);
  if(!cell||p.y>-.24)return 'surface';
  if(cell==='stairs'||cell==='chambers'&&p.x<LAB_CUT.right+2.45&&p.z>LAB_CUT.back-.65&&p.z<LAB_CUT.front+.65)return 'threshold';
  return labLower(p.y)?'cellar':'surface';
}

export function cellarWalls(k,world,id){
  const [wall,skirt]=palettes[id]??['plaster','green'];
  for(const {axis,edge,sign,solids,openings} of labEdges(id)){
    const map=axis==='x'
      ?(u,y,v)=>sign===1?[edge+v,y,-u]:[edge-v,y,u]
      :(u,y,v)=>sign===1?[u,y,edge+v]:[-u,y,edge-v];
    const along=axis==='x'?-sign:sign;
    const panel=(m,a,b,y,Y,d0,d1)=>k.box(m,map,along===1?a:-b,along===1?b:-a,y,Y,d0,d1);
    const hit=(a,b)=>{
      const e=Math.min(edge,edge+sign*.17),f=Math.max(edge,edge+sign*.17);
      if(axis==='x')world.box(e,a,f,b,below);else world.box(a,e,b,f,below);
    };
    for(const [a,b] of solids){
      panel(wall,a,b,floor-.1,ceiling+.09,0,.17);
      panel(skirt,a,b,floor+.08,floor+.86,-.023,-.002);
      panel('iron',a,b,floor+.023,floor+.11,-.047,-.004);
      if(b-a>.8)panel(skirt,a+.16,b-.16,ceiling-.25,ceiling-.21,-.027,-.003);
      hit(a,b);
    }
    for(const [a,b] of openings){
      if(id==='chambers'&&axis==='x'&&a===LAB_CUT.back)continue;
      panel(wall,a,b,floor+2.38,ceiling+.10,0,.17);
      const adjacent=(ports[id].find(([j,l,p,q,A])=>p===axis&&q===edge&&A===a)??[]).slice(0,2).find(key=>key!==id);
      if(!own.has(id+':'+adjacent))continue;
      for(const [s,t] of [[a-.109,a+.009],[b-.009,b+.109]]){
        panel('iron',s,t,floor+.02,floor+2.43,-.123,.12);
        panel('gray',s+.022,t-.022,floor+.15,floor+2.39,-.13,.13);
      }
      panel('iron',a-.11,b+.11,floor+2.265,floor+2.46,-.125,.125);
      panel('green',a+.045,b-.045,floor+2.32,floor+2.43,-.134,.134);
      panel('gray',a,b,floor-.022,floor+.005,-.119,.119);
      for(let t=a+.09,i=0;t<b-.02;t+=.20,i++)panel(i%2?'iron':'ochre',t,Math.min(t+.17,b-.015),floor+2.276,floor+2.316,-.136,.136);
    }
  }
}

// Adjacent cells don't share duplicated floor faces. Directional wear,
// pipes and furniture are batched by material within each room.
function cellarKit(T,root,world,id,materials){
  const k=architectureKit(T,root,materials),[x0,x1,z0,z1]=LAB_CELLS[id];
  const box=(m,a,b,y,Y,c,d)=>k.box(m,matrices,a,b,y,Y,c,d);
  const poly=(m,points,y,Y)=>{for(let i=0;i<points.length;i++){
    const [a,c]=points[i],[b,d]=points[(i+1)%points.length];
    k.quad(m,[b,y,d],[a,y,c],[a,Y,c],[b,Y,d]);
  }};
  const hit=(a,b,c,d)=>world.box(a,c,b,d,below);
  const drum=new T.CylinderGeometry(1,1,1,20),wheel=new T.TorusGeometry(1,.085,7,20),matrix=new T.Matrix4();
  const pos=new T.Vector3(),quat=new T.Quaternion(),scale=new T.Vector3(),up=new T.Vector3(0,1,0);
  function obj(m,g,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    quat.setFromEuler(new T.Euler(rx,ry,rz));matrix.compose(pos.set(x,y,z),quat,scale.set(sx,sy,sz));k.geometry(m,g,matrix);
  }
  const cylinder=(m,x,y,z,rad,h)=>obj(m,drum,x,y,z,rad,h,rad);
  function pipe(m,a,b,r){
    const d=new T.Vector3(...b).sub(pos.set(...a));
    matrix.compose(pos.addScaledVector(d,.5),quat.setFromUnitVectors(up,d.clone().normalize()),scale.set(r,d.length(),r));
    k.geometry(m,drum,matrix);
  }
  function label(head,lines,x,y,z,w,h,ry=0,style='cream',rx=0){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const c=canvas.getContext('2d'),paper=style!=='crt',red=style==='red',blue=style==='blue';
    c.fillStyle=paper?(red?'#6a342b':blue?'#344d58':'#b4aa8b'):'#142922';c.fillRect(0,0,512,256);
    c.strokeStyle=paper?(red||blue?'#ded3ad':'#554c3b'):'#5e9372';c.lineWidth=3;c.strokeRect(10,10,492,236);c.strokeRect(15,15,482,226);
    c.beginPath();c.moveTo(25,79);c.lineTo(487,79);c.stroke();
    c.fillStyle=paper?(red||blue?'#f1dfb9':'#29271e'):'#b7dda5';
    c.font='bold 35px '+(paper?'Georgia':'monospace');c.fillText(head,26,65,458);
    c.font='22px monospace';lines.forEach((s,i)=>c.fillText(s,28,114+i*35,456));
    if(paper){
      c.fillStyle='#d9c6a153';c.beginPath();c.moveTo(492,11);c.lineTo(492,31);c.lineTo(468,11);c.fill();
      for(let j=0;j<135;j++){c.fillStyle=j%2?'#09080612':'#ffffff15';c.fillRect((j*367)%502+5,(j*173)%246+5,j%8+2,2);}
    }else{c.fillStyle='#03150e44';for(let j=0;j<256;j+=4)c.fillRect(0,j,512,1)}
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
    const material=paper?new T.MeshStandardMaterial({map,roughness:.86}):new T.MeshBasicMaterial({map});
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.position.set(x,floor+y,z);mesh.rotation.set(rx,ry,0);
    root.add(mesh);
  }
  function luminaire(x,z,key='ivory',y=ceiling-.16){
    box('iron',x-.42,x+.42,y+.012,y+.123,z-.126,z+.126);
    box(key,x-.36,x+.36,y,y+.03,z-.092,z+.092);
    for(const dx of [-.36,-.17,0,.17,.36])box('gray',x+dx-.011,x+dx+.011,y-.017,y+.019,z-.112,z+.112);
  }
  function grille(x,z,w,d){
    box('iron',x-w/2,x+w/2,floor-.019,floor+.007,z-d/2,z+d/2);
    for(let j=z-d*.5+.035;j<z+d*.5-.02;j+=.069)box('gray',x-w*.46,x+w*.46,floor+.007,floor+.012,j,j+.018);
  }
  cellarWalls(k,world,id);
  box(id==='vault'?'vaultWall':'concrete',x0,x1,ceiling,ceiling+.17,z0,z1);
  box('gasket',x0,x1,floor-.12,floor-.025,z0,z1);
  const step=id==='archive'?.65:id==='plant'?.98:.84;
  for(let x=x0,i=0;x<x1-.007;x+=step,i++)for(let z=z0,j=0;z<z1-.007;z+=step,j++){
    const n=(i*29+j*71+i*j*11)%17;
    box(id==='observation'?(n<4?'gray':'ceramic'):id==='vault'?(n<3?'iron':'vaultWall'):n<2?'gray':'concrete',
      x+.004,Math.min(x+step-.004,x1),floor-.027,floor,z+.004,Math.min(z+step-.004,z1));
  }
  return {k,box,hit,obj,cylinder,pipe,label,luminaire,grille,poly,wheel,
    flush(){k.flush('Keller · '+cellNames[id]);drum.dispose();wheel.dispose()}};
}

function fitOut(T,root,world,id,materials){
  const {k,box,hit,obj,cylinder,pipe,label,luminaire,grille,poly,wheel,flush}=cellarKit(T,root,world,id,materials);
  const plaque=(head,lines,x,y,z,w=1.03,h=.48,ry=0,style)=>label(head,lines,x,y,z,w,h,ry,style);
  function cabinet(x,z,w,d,h,kind='green'){
    box(kind,x-w/2,x+w/2,floor+.05,floor+h,z-d/2,z+d/2);
    box('iron',x-w/2-.022,x+w/2+.022,floor+.065,floor+.17,z-d/2-.025,z+d/2+.025);
    for(let y=.26;y<h-.06;y+=.33){
      box('gasket',x-w*.44,x+w*.44,floor+y,floor+y+.03,z+d/2,z+d/2+.008);
      box('brass',x-.068,x+.068,floor+y+.13,floor+y+.161,z+d/2,z+d/2+.035);
    }
    hit(x-w/2,x+w/2,z-d/2,z+d/2);
  }
  function conduit(x,a,b,key='rust'){
    pipe(key,[x,ceiling-.34,a],[x,ceiling-.34,b],.073);
    for(let end=a+.24;end<b;end+=1.54){
      pipe('iron',[x,ceiling-.34,end-.035],[x,ceiling-.34,end+.035],.097);
      box('iron',x-.028,x+.028,ceiling-.27,ceiling,end-.03,end+.03);
    }
  }
  if(id==='lock'){
    luminaire(-8.02,5.39,'red');grille(-8.02,5.61,1.32,1.35);
    for(const x of [-8.86,-7.17]){
      conduit(x,4.63,6.94);
      for(let y=.45;y<2.65;y+=.26)box('iron',x-.065,x+.065,floor+y,floor+y+.04,6.15,6.32);
    }
    plaque('SEKTION B',['NICHT ZURÜCKSETZEN','DRUCKAUSGLEICH AUS'],-8.985,1.61,5.62,1.02,.48,Math.PI/2,'red');
    box('iron',-7.16,-7.024,floor+1.05,floor+1.52,5.82,6.15);
    box('red',-7.165,-7.157,floor+1.37,floor+1.43,5.923,6.026);
  }else if(id==='spine'){
    for(const [x,z] of [[-8.17,8.41],[-13,8.43],[-18.8,8.39]])luminaire(x,z,x<-16?'red':'ivory');
    for(let x=-20.46;x<-7.30;x+=.62){
      box('ochre',x,x+.29,floor+.001,floor+.005,7.54,7.60);
      box('iron',x,x+.30,floor+.001,floor+.005,9.16,9.22);
    }
    plaque('VERTEILER B',['← TECHNIK / RÜCKGABE','ARCHIV ↑    KAMMERN →'],-17.05,1.72,9.648,1.57,.69,Math.PI,'blue');
    plaque('02 · ARCHIV',['BELEGUNG / TEXTIL'],-13.50,1.59,9.653,.86,.42,Math.PI);
    plaque('03 · TECHNIK',['UMWÄLZUNG / WARTUNG'],-18.97,1.61,7.278,1.17,.51);
    for(const z of [7.47,9.46]){
      pipe('green',[-20.35,ceiling-.32,z],[-7.31,ceiling-.32,z],.084);
      for(let x=-19.72;x<-7.6;x+=1.75)pipe('iron',[x-.05,ceiling-.32,z],[x+.05,ceiling-.32,z],.109);
    }
    box('iron',-17.7,-16.6,floor+.21,floor+1.12,7.29,7.47);
    for(let x=-17.61;x<-16.62;x+=.09)box('gray',x,x+.034,floor+.35,floor+.98,7.469,7.496);
  }else if(id==='archive'){
    luminaire(-12.68,12.58,'ivory');
    for(const x of [-14.54,-13.39,-12.22,-11.05,-9.97])cabinet(x,14.86,.84,.52,2.25,x<-13?'rust':'green');
    box('gray',-14.94,-12.56,floor+.88,floor+.985,11.38,12.22);
    for(const x of [-14.83,-12.86])box('iron',x,x+.11,floor+.03,floor+.89,11.47,12.14);
    hit(-14.94,-12.56,11.38,12.22);
    label('VERMISSTENLISTE',['B-01 … B-08  /  NICHT ANWESEND','Ausgabe: 8 Trachten, ungetragen.','Rückgabe: 9 Garderobenmarken.'],-14.14,1.341,11.51,.81,.405,0,'cream',-1.06);
    label('RÜCKGABE',['Jede Marke zählt nur einmal.','Eine Marke blieb ohne Namen.','Beschluss: Akte geschlossen.'],-11.45,1.87,15.165,1.16,.58,Math.PI,'red');
    for(let i=0;i<8;i++){
      const a=-14.73+i*.235,y=floor+.988+(i%3)*.013,z=11.97+(i%2)*.075;
      box(i%3===0?'leather':'paper',a,a+.22,y,y+.023,z,z+.13);
      box('ivory',a+.029,a+.078,y+.024,y+.025,z+.023,z+.11);
    }
    cabinet(-9.92,10.81,.74,.58,1.47);
    box('iron',-10.22,-9.60,floor+1.46,floor+1.72,10.54,11.04);
    box('gasket',-10.193,-9.91,floor+1.53,floor+1.56,11.032,11.063);
    cylinder('brass',-9.79,floor+1.743,10.91,.04,.038);
  }else if(id==='plant'){
    luminaire(-23.08,10.38,'ivory');luminaire(-24.69,12.56,'red');
    for(const [i,x] of [-25.13,-25.08].entries()){
      const z=9.43+i*2.18;
      cylinder('iron',x,floor+.13,z,.64,.26);cylinder(i?'green':'rust',x,floor+1.33,z,.54,2.22);
      for(const y of [.37,.66,1.90,2.42])cylinder('gray',x,floor+y,z,.566,.084);
      pipe('rust',[x,floor+2.43,z],[x,ceiling-.29,z],.111);
      pipe('rust',[x,ceiling-.29,z],[-22.43,ceiling-.29,z],.10);
      pipe('iron',[-22.43,ceiling-.29,z],[-22.43,ceiling,z],.101);
      pipe('gray',[x,ceiling-.37,z],[x,ceiling-.25,z],.157);
      for(const dx of [.72,1.69]){
        pipe('gray',[x+dx-.052,ceiling-.29,z],[x+dx+.052,ceiling-.29,z],.132);
        box('iron',x+dx-.021,x+dx+.021,ceiling-.20,ceiling,z-.036,z+.036);
      }
      obj('brass',wheel,x+.61,floor+1.22,z,.19,.19,.16,0,Math.PI/2);
      pipe('iron',[x+.53,floor+1.22,z],[x+.72,floor+1.22,z],.047);
      for(let j=0;j<3;j++){
        const a=j*Math.PI*2/3;
        pipe('gray',[x+.632,floor+1.22,z],[x+.632,floor+1.22+Math.sin(a)*.17,z+Math.cos(a)*.17],.017);
      }
      box('iron',x+.48,x+.555,floor+1.59,floor+1.93,z-.208,z+.208);
      plaque(i?'B/02':'B/01',[i?'STANDBY':'ABGETRENNT'],x+.559,1.76,z,.367,.238,Math.PI/2,i?'blue':'red');
      hit(x-.61,x+.67,z-.59,z+.59);
    }
    box('green',-21.36,-20.83,floor+.09,floor+2.27,10.24,12.46);
    box('iron',-21.39,-21.35,floor+.43,floor+2.10,10.40,12.27);
    for(let k=0;k<13;k++)box('gray',-21.41,-21.39,floor+1.96,floor+2.012,10.55+k*.119,10.62+k*.119);
    for(let k=0;k<3;k++)box(k?'ivory':'red',-21.42,-21.404,floor+1.63,floor+1.69,11.04+k*.25,11.10+k*.25);
    hit(-21.39,-20.83,10.24,12.46);
    grille(-23.71,9.84,.73,3.13);
    plaque('04 · RÜCKGABE',['NUR MIT NAMEN','Kein Personal seit 1962.'],-24.75,1.61,13.818,1.26,.52,Math.PI,'red');
    plaque('WARTUNG',['RÜCKWEG ZU B / BEOBACHTUNG'],-24.28,1.62,6.854,.92,.42);
  }else if(id==='return'){
    luminaire(-23.73,2.03,'red');luminaire(-23.72,5.63,'ivory');grille(-24.53,3.67,.62,4.71);
    for(const x of [-24.73,-22.79])conduit(x,.54,6.57,x<-24?'green':'rust');
    for(const z of [1.06,3.74,5.97]){
      box('gray',-22.71,-22.57,floor+.57,floor+1.82,z-.20,z+.20);
      box('iron',-22.745,-22.706,floor+.64,floor+1.75,z-.145,z+.145);
    }
    plaque('BEOBACHTUNG',['NOTAUSGANG ZUR SEKTION B'],-24.933,1.74,1.45,1.00,.46,Math.PI/2,'blue');
  }else if(id==='observation'){
    luminaire(-23.47,-2.22,'cold');
    box('iron',-23.23,-21.06,floor+.025,floor+.82,-3.64,-3.48);
    box('iron',-23.23,-21.06,floor+2.43,ceiling,-3.64,-3.48);
    for(const x of [-23.20,-22.19,-21.16])box('gray',x-.044,x+.048,floor+.8,floor+2.44,-3.65,-3.44);
    // Painted glass over an actually dark recess, no humans or medical procedures.
    box('glassDark',-23.20,-21.13,floor+.84,floor+2.40,-3.665,-3.635);
    box('green',-24.76,-22.90,floor+.07,floor+.86,-2.87,-2.22);
    box('gray',-24.78,-22.86,floor+.86,floor+.963,-2.90,-2.18);hit(-24.78,-22.86,-2.90,-2.18);
    box('iron',-24.46,-23.45,floor+.966,floor+1.48,-2.86,-2.59);
    plaque('SICHTUNG 08',['KAMMER LEER','STIMME HINTER DER SCHEIBE','EINTRAG UNTERBROCHEN'],-23.95,1.226,-2.583,.90,.43,0,'crt');
    for(let j=0;j<4;j++){
      const x=-22.76+j*.33;
      cylinder('gray',x,floor+.058,-3.14,.084,.104);
      box('iron',x-.028,x+.028,floor+.1,floor+.61,-3.17,-3.11);
    }
    plaque('SICHTUNG',['Nur ein Spiegelbild zulässig.'],-21.45,1.71,-3.440,1.19,.51);
  }else if(id==='vault'){
    // Stark contrast with the clinical rooms: stone, paired numbers on
    // benches, a ledger and an empty dais below disconnected machinery.
    luminaire(-22.67,15.04,'red');
    for(const x of [-24.8,-21.1,-19.15]){
      box('iron',x-.15,x+.15,floor,ceiling,19.12,19.28);
      box('rust',x-.226,x+.226,floor+.04,floor+.24,19.02,19.3);
    }
    for(const z of [15.58,17.15,18.7]){
      box('vaultWall',-25.82,-25.40,floor,ceiling,z-.19,z+.19);
      for(const [i,x] of [-24.61,-20.05].entries()){
        if(i===1&&z===15.58)continue;
        box('iron',x-.53,x+.53,floor+.06,floor+.45,z-.23,z+.20);
        box('leather',x-.57,x+.57,floor+.45,floor+.55,z-.26,z+.24);
        box('brass',x-.087,x+.087,floor+.47,floor+.51,z-.27,z-.258);
        hit(x-.56,x+.56,z-.25,z+.24);
      }
    }
    const x=-22.28,z=17.70,p=Array.from({length:8},(_,i)=>{const a=(i+.5)*Math.PI/4;return [x+Math.cos(a)*1.26,z+Math.sin(a)*1.02]});
    poly('iron',p,floor+.01,floor+.13);
    // A decorative mosaic, not a diagram. It suggests the operators made
    // the same ritual out of a factory inspection over and over.
    for(let i=0;i<8;i++){
      const a=p[i],b=p[(i+1)%8];k.triangle('gasket',[x,floor+.13,z],[b[0],floor+.13,b[1]],[a[0],floor+.13,a[1]],[.5,.5,0,0,1,0]);
    }
    world.polygon(p,below);
    for(let i=0;i<8;i++){
      const a=p[i],b=p[(i+1)%8];
      box('ochre',a[0]-.042,a[0]+.042,floor+.13,floor+.145,a[1]-.042,a[1]+.042);
      pipe('gray',[a[0],floor+.13,a[1]],[b[0],floor+.13,b[1]],.025);
    }
    cylinder('gray',x,floor+.12,z,.923,.115);
    obj('rust',wheel,x,floor+.197,z,.75,.75,.50,Math.PI/2);
    for(let row=-2;row<=2;row++)for(let col=-1;col<=1;col++){
      if(Math.abs(row)===2&&Math.abs(col)===1)continue;
      const cx=x+col*.22+(row%2?.042:0),cz=z+row*.21,y=floor+.180;
      k.quad((row+col)%2?'green':'gray',[cx-.102,y,cz],[cx,y,cz+.103],[cx+.102,y,cz],[cx,y,cz-.103]);
    }
    for(const dx of [-.49,.49]){
      pipe('iron',[x+dx,ceiling,z+.22],[x+dx,ceiling-.62,z+.22],.058);
      pipe('gasket',[x+dx,ceiling-.58,z+.22],[x+dx*.41,ceiling-.89,z+.26],.031);
    }
    cylinder('iron',x,ceiling-.34,z,.47,.28);
    cylinder('ivory',x,ceiling-.502,z,.36,.06);
    plaque('SAAL DER RÜCKGABE',['8 NAMEN  /  9 MARKEN','„Die Neunte blieb unbelegt.“','Letzte Sitzung: niemand anwesend.'],-22.39,1.95,19.263,2.03,1.02,Math.PI,'red');
    box('green',-19.95,-18.70,floor+.10,floor+.91,18.66,19.15);hit(-19.95,-18.70,18.66,19.15);
    label('VERZEICHNIS',['Acht Plätze gedeckt.','Kein Name für den letzten.'],-19.32,.936,18.86,.82,.41,0,'cream',-Math.PI/2);
    for(let j=0;j<6;j++)cylinder('brass',-20.03-j*.112,floor+.015,18.13+(j%3)*.071,.038,.025);
  }
  flush();
}

const emitters={
  chambers:[[-19.51,-5.53,0xe07459,11.0,5.9],[-14.43,1.23,0x9be3d3,19.0,9.2],[-8.50,-3.28,0xffe0a0,20,8.8]],
  lock:[[-8.02,5.5,0xff6548,7.4,5.2]],spine:[[-9.34,8.43,0xffe5a8,11,8.1],[-15.95,8.48,0xd7e3bd,11,8.8],[-19.32,8.42,0xe36c46,8.5,6.3]],
  archive:[[-12.32,12.33,0xfdd493,21,8.0]],plant:[[-22.77,10.60,0xc7dbc9,14.5,8.3],[-24.69,12.46,0xee6748,8,5.2]],
  return:[[-23.73,2.28,0xc36549,8.7,6.7],[-23.75,5.36,0xe6dfac,10,5.7]],
  observation:[[-23.53,-1.87,0x9ee4d7,14,6.9]],vault:[[-22.28,17.53,0xe6dcc4,17,7.4],[-23.53,14.62,0xdf5846,9.1,5.9]]
};

export function makeLabDeck(T,parent,world,materials,buildChamber){
  const deck=new T.Group(),rooms=new Map();deck.name='Projekt Bayern · Zellendeck';deck.visible=false;parent.add(deck);
  const lights=Array.from({length:4},()=>{const l=new T.PointLight(0xffffff,0,0,2);l.layers.set(LAB_LAYER);deck.add(l);return l});
  const hemi=new T.HemisphereLight(0xa4b0a7,0x444038,.86);hemi.layers.set(LAB_LAYER);deck.add(hemi);
  let last='',pathX=Infinity,pathZ=Infinity,preparation;
  function build(id){
    const node=new T.Group();node.name='Projekt Bayern · '+cellNames[id];deck.add(node);
    if(id==='chambers')buildChamber(node);else fitOut(T,node,world,id,materials);
    node.traverse(o=>{o.layers.set(LAB_LAYER);if(o.isMesh)o.castShadow=false});
    rooms.set(id,node);
  }
  async function prewarm(renderer,scene,shaft){
    // CPU and collision preparation is part of boot, never part of revealing
    // a doorway. Keep it in one batch so background-tab timers don't delay boot.
    const cpu=performance.now();
    for(const id of Object.keys(LAB_CELLS)){
      if(id==='stairs')continue;
      build(id);
    }
    performance.measure('schlosser-cellar: build',{start:cpu,end:performance.now()});

    // Use the real fog/environment, the fixed cellar lights and the default
    // framebuffer. A render target would pick a different tone-map program.
    // The page hides the canvas during this tiny, single startup draw.
    const warm=new T.Scene();
    warm.environment=scene.environment;warm.fog=scene.fog;
    warm.environmentIntensity=scene.environmentIntensity;
    warm.environmentRotation.copy(scene.environmentRotation);
    const camera=new T.PerspectiveCamera(65,1,.08,1250);
    camera.layers.set(LAB_LAYER);
    camera.position.set(LAB_CUT.right+1.4,LAB.floor+1.67,LAB_CUT.back+.9);
    camera.lookAt(LAB_CUT.right+6,LAB.floor+1.51,LAB_CUT.front+.8);
    const saved=[deck,shaft].map(node=>({node,parent:node.parent,visible:node.visible}));
    const meshes=[],viewport=renderer.getViewport(new T.Vector4()),scissor=renderer.getScissor(new T.Vector4());
    const scissorTest=renderer.getScissorTest(),needsShadow=renderer.shadowMap.needsUpdate;
    try{
      for(const {node} of saved){node.visible=true;warm.add(node);}
      warm.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false}});
      const shaders=performance.now();
      await renderer.compileAsync(warm,camera);
      performance.measure('schlosser-cellar: shaders',{start:shaders,end:performance.now()});
      renderer.setViewport(0,0,40,40);renderer.setScissor(0,0,40,40);renderer.setScissorTest(true);
      const upload=performance.now();
      renderer.render(warm,camera);
      performance.measure('schlosser-cellar: first draw',{start:upload,end:performance.now()});
    }finally{
      for(const [mesh,cull] of meshes)mesh.frustumCulled=cull;
      for(const {node,parent,visible} of saved){parent.add(node);node.visible=visible;}
      renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
      renderer.shadowMap.needsUpdate=needsShadow;
    }
  }
  function update(p,opened){
    const id=labCellAt(p.x,p.z,.015)||(opened&&p.x>=LAB_CUT.left-1.4&&p.x<LAB_CUT.left&&p.z>=LAB_CUT.back&&p.z<=LAB_CUT.front?'stairs':null);
    const active=!!id&&(labCameraMode(p)!=='surface'||opened&&id==='stairs');
    let changed=deck.visible!==active;deck.visible=active;
    if(!active){last='';return changed;}
    if(id===last&&Math.hypot(pathX-p.x,pathZ-p.z)<.21)return changed;
    last=id;pathX=p.x;pathZ=p.z;
    const render=labVisibility(id,p.x,p.z);
    for(const [cell,group] of rooms){const see=render.has(cell);if(group.visible!==see)changed=true;group.visible=see}
    const choices=[...render].flatMap(cell=>(emitters[cell]??[]).map(src=>[src,Math.hypot(p.x-src[0],p.z-src[1])+(cell===id?-.9:2)]));
    choices.sort((a,b)=>a[1]-b[1]);
    for(let i=0;i<lights.length;i++){
      const l=lights[i],src=choices[i]?.[0];
      if(!src){l.intensity=0;continue}
      const [x,z,color,power,distance]=src;
      l.position.set(x,ceiling-.56,z);l.color.setHex(color);l.intensity=power;l.distance=distance;
    }
    return changed;
  };
  return {update,visible:()=>deck.visible,prepare(renderer,scene,shaft){
    return preparation??=prewarm(renderer,scene,shaft);
  }};
}
