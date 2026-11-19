import {architectureKit} from './architecture-kit.js';
import {labGraphics,dressLab} from './lab-dressing.js';
import {MALT_ROOMS,MALT_LIGHTS,fitMaltWing} from './lab-malt-wing.js';
import {cellDoorTarget} from './lab-cell-doors.js';
import {stationery} from './interior-stationery.js';
import {LAB,LAB_CUT,LAB_CELLS,LAB_LINKS,LAB_LAYER,labLower,labCellAt,labEdges} from './lab-layout.js';

const {floor,ceiling}=LAB,matrices=(x,y,z)=>[x,y,z],below=p=>labLower(p.y);
const cellNames={chambers:'Klonkammern',lock:'Druckschleuse',spine:'Verteiler',archive:'Archiv',plant:'Maschinenraum',
  return:'Wartungsgang',observation:'Beobachtung',vault:'Saal der Rückgabe',
  ...Object.fromEntries(Object.entries(MALT_ROOMS).map(([id,{name}])=>[id,name]))};
const palettes={lock:['iron','green'],spine:['concrete','green'],archive:['archiveWall','rust'],
  plant:['concrete','iron'],return:['concrete','rust'],observation:['ceramic','green'],vault:['vaultWall','rust'],
  ...Object.fromEntries(Object.entries(MALT_ROOMS).map(([id,{palette}])=>[id,palette]))};
const ports=Object.fromEntries(Object.keys(LAB_CELLS).map(id=>[id,LAB_LINKS.filter(([a,b])=>a===id||b===id)]));
const own=new Set(['lock:chambers','lock:spine','archive:spine','plant:spine','plant:return','observation:return','observation:chambers','vault:plant',
  'vault:maltLock','maltLock:brewery','brewery:beerLab','brewery:ward','ward:cells']);

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
function cellarKit(T,root,world,id,materials,graphics){
  const k=architectureKit(T,root,materials),[x0,x1,z0,z1]=LAB_CELLS[id];
  const dress=dressLab(T,k,root,graphics);
  const props=stationery(T,k,root,{cloth:['leather','bookB','bookC','green']});
  const box=(m,a,b,y,Y,c,d)=>k.box(m,matrices,a,b,y,Y,c,d);
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
  function luminaire(x,z,key='ivory',y=ceiling-.16){
    dress.fixture(x,y,z,key);
  }
  function grille(x,z,w,d){
    box('iron',x-w/2,x+w/2,floor-.019,floor+.007,z-d/2,z+d/2);
    for(let j=z-d*.5+.035;j<z+d*.5-.02;j+=.069)box('gray',x-w*.46,x+w*.46,floor+.007,floor+.012,j,j+.018);
  }
  cellarWalls(k,world,id);
  box(id==='vault'?'vaultWall':'concrete',x0,x1,ceiling,ceiling+.17,z0,z1);
  box('gasket',x0,x1,floor-.12,floor-.025,z0,z1);
  const step=MALT_ROOMS[id]?.tile??(id==='archive'?.65:id==='plant'?.98:.84);
  for(let x=x0,i=0;x<x1-.007;x+=step,i++)for(let z=z0,j=0;z<z1-.007;z+=step,j++){
    const n=(i*29+j*71+i*j*11)%17;
    box(MALT_ROOMS[id]?.tiles[n<3?1:0]??(id==='observation'?(n<4?'gray':'ceramic'):id==='vault'?(n<3?'iron':'vaultWall'):n<2?'gray':'concrete'),
      x+.004,Math.min(x+step-.004,x1),floor-.027,floor,z+.004,Math.min(z+step-.004,z1));
  }
  return {k,box,hit,obj,cylinder,pipe,luminaire,grille,wheel,dress,props,root,world,materials,
    flush(){dress.flush();props.finish('Keller · Register und Papierobjekte');k.flush('Keller · '+cellNames[id]);drum.dispose();wheel.dispose()}};
}

function fitOut(T,root,world,id,materials,graphics,doors){
  const kit=cellarKit(T,root,world,id,materials,graphics);
  if(MALT_ROOMS[id]){fitMaltWing(T,kit,id,doors);kit.flush();return;}
  const {k,box,hit,obj,cylinder,pipe,luminaire,grille,wheel,dress,props,flush}=kit;
  const {housing,stain,grill,dial,flag,plane,fastener,rod,plaque:label}=dress;
  const plaque=(head,lines,x,y,z,w=1.03,h=.48,ry=0,style)=>label(head,lines,x,y,z,w,h,ry,style);
  function cabinet(x,z,w,d,h,kind='green',index=0){
    const front=z-d*.5,frame=plane(x,floor,front,Math.PI);
    housing('gunmetal',x,floor+h*.5+.065,z,w,h-.085,d);
    housing('iron',x,floor+.108,z,w+.044,.116,d+.056);
    const rows=h>2?5:3,step=(h-.25)/rows;
    for(let row=0;row<rows;row++){
      const offset=index===3&&row===2?.17:.033,y=.204+step*(row+.5);
      housing(kind,x,floor+y,front-offset,w-.079,step-.029,.073);
      if(offset>.1){
        housing('edge',x,floor+y,front-.120,w*.84,.080,.20);
        housing('paper',x+.09,floor+y+.049,front-.103,w*.53,.024,.17,.12);
      }
      for(const sx of [-1,1])rod('edge',frame(sx*.111,y-.04,offset+.023),frame(sx*.111,y-.04,offset+.086),.018);
      rod('edge',frame(-.111,y-.04,offset+.084),frame(.111,y-.04,offset+.084),.018);
      housing('gasket',x+.119,floor+y+.080,front-offset-.04,.128,.055,.015);
      housing('paper',x+.119,floor+y+.080,front-offset-.05,.097,.033,.008);
      for(const dx of [-w*.39,w*.39])fastener(frame,dx,y+step*.33,offset+.034,.013,true);
      if((row+index)%3===0)stain(x,y-.067,front-offset-.039,w*.54,step*.73,Math.PI,3);
    }
    label('KARTEI',['REGISTER '+String(index+1).padStart(2,'0')],x,h-.05,front-.034,.27,.115,Math.PI,'cream',0,false);
    hit(x-w/2,x+w/2,front-(index===3?.25:.12),z+d/2);
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
    plaque('SEKTION B',['SCHLEUSE IM HANDBETRIEB','LETZTE FREIGABE: 23:08'],-9.004,1.67,5.62,1.02,.48,Math.PI/2,'red');
    housing('green',-7.062,floor+1.38,5.96,.112,.70,.51);
    grill('gray',-7.120,1.15,5.96,.38,.17,-Math.PI/2);
    dial(-7.136,1.53,5.96,.128,-Math.PI/2,2);
    for(const [key,z] of [['red',5.87],['ivory',6.03]])housing(key,-7.136,floor+1.328,z,.028,.046,.07);
    stain(-9.012,1.06,6.28,.58,1.89,Math.PI/2,0);
    stain(-8.81,.006,5.06,.48,1.42,0,2,-Math.PI*.5);
  }else if(id==='spine'){
    for(const [x,z] of [[-8.17,8.41],[-13,8.43],[-18.8,8.39]])luminaire(x,z,x<-16?'red':'ivory');
    for(let x=-20.46;x<-7.30;x+=.62){
      box('ochre',x,x+.29,floor+.001,floor+.005,7.54,7.60);
      box('iron',x,x+.30,floor+.001,floor+.005,9.16,9.22);
    }
    plaque('VERTEILER B',['← KAMMERN      TECHNIK →','ARCHIV: DURCHGANG 02'],-17.05,1.72,9.648,1.57,.69,Math.PI,'blue');
    plaque('02 · ARCHIV',['BELEGUNG / TEXTIL'],-12.005,2.71,9.477,1.22,.36,Math.PI);
    plaque('03 · TECHNIK',['UMWÄLZUNG / WARTUNG'],-18.97,1.67,7.285,1.17,.51);
    flag('schematic',-15.42,1.63,7.284,1.28,.68);
    for(const z of [7.47,9.46]){
      pipe('green',[-20.35,ceiling-.32,z],[-7.31,ceiling-.32,z],.084);
      for(let x=-19.72;x<-7.6;x+=1.75)pipe('iron',[x-.05,ceiling-.32,z],[x+.05,ceiling-.32,z],.109);
    }
    box('iron',-17.7,-16.6,floor+.21,floor+1.12,7.29,7.47);
    for(let x=-17.61;x<-16.62;x+=.09)box('gray',x,x+.034,floor+.35,floor+.98,7.469,7.496);
    stain(-12.91,1.77,7.257,.54,2.95,0,0);
    stain(-17.12,.59,7.257,.71,.98,0,2);
    for(const x of [-11.2,-10.27]){
      housing('green',x,floor+1.35,7.34,.54,.77,.12);
      grill('edge',x,1.43,7.407,.35,.32);
      for(const y of [1.66,1.021])fastener(plane(x,floor+y,7.406,0),.185,0,0,.02,true);
    }
  }else if(id==='archive'){
    luminaire(-12.68,12.58,'ivory');
    for(const [i,x] of [-14.54,-13.39,-12.22,-11.05,-9.97].entries())cabinet(x,14.86,.84,.52,2.25,x<-13?'rust':'green',i);
    housing('edge',-13.75,floor+.931,11.80,2.38,.112,.84);
    for(const x of [-14.81,-12.69])for(const z of [11.48,12.11])housing('iron',x,floor+.47,z,.10,.89,.10);
    housing('green',-13.74,floor+.849,11.47,2.21,.164,.11);
    hit(-14.94,-12.56,11.38,12.22);
    housing('leather',-14.14,floor+.998,11.686,.91,.027,.505);
    label('VERMISSTENLISTE',['B-01 … B-08  /  NICHT ANWESEND','Ausgabe: 8 Trachten, ungetragen.','Rückgabe: 9 Garderobenmarken.'],-14.14,1.013,11.658,.81,.405,Math.PI,'cream',-Math.PI*.5,false);
    housing('brass',-14.14,floor+1.027,11.91,.28,.022,.045);
    label('RÜCKGABE',['Die neunte Marke blieb ohne Namen.','BESCHLUSS: AKTE GESCHLOSSEN.'],-11.45,2.76,15.198,1.67,.62,Math.PI,'red');
    for(const [x,z,w,l,a,style,loose] of [
      [-13.51,11.58,.235,.31,3.32,1,true],[-13.16,11.62,.27,.34,2.94,6,false],
      [-12.81,11.79,.20,.245,2.94,0,false],[-13.42,12.045,.245,.237,-.11,4,false],
      [-14.65,12.05,.235,.215,.12,2,true],[-14.33,12.042,.28,.24,-.05,7,false]
    ])props.folio(x,floor+.988,z,w,l,a,style,{loose,thickness:loose?.012:.031});
    // Smaller recognizable silhouettes: an ink stamp and two pencils.
    housing('iron',-12.82,floor+1.00,11.50,.174,.028,.098,.11);
    cylinder('wood',-12.82,floor+1.042,11.50,.030,.070);
    cylinder('brass',-12.82,floor+1.081,11.50,.046,.029);
    rod('ochre',[-13.27,floor+.998,11.95],[-13.15,floor+.998,12.063],.007);
    rod('rust',[-13.22,floor+.998,11.934],[-13.08,floor+.998,12.024],.006);
    cabinet(-9.92,10.81,.74,.58,1.47,'green',5);
    box('iron',-10.22,-9.60,floor+1.46,floor+1.72,10.54,11.04);
    box('gasket',-10.193,-9.91,floor+1.53,floor+1.56,11.032,11.063);
    cylinder('brass',-9.79,floor+1.743,10.91,.04,.038);
    plaque('FREMDREGISTER',['FRANKEN · AUSSENSTELLE F','Weiterleitung gestrichen.'],-15.712,1.91,12.20,.96,.49,Math.PI*.5,'red');
    stain(-15.742,1.32,13.33,1.21,2.22,Math.PI*.5,0);
  }else if(id==='plant'){
    luminaire(-23.08,10.38,'ivory');luminaire(-24.69,12.56,'red');
    for(const [i,x] of [-25.13,-25.08].entries()){
      const z=9.43+i*2.18;
      cylinder('iron',x,floor+.13,z,.64,.26);cylinder(i?'green':'rust',x,floor+1.33,z,.54,2.22);
      for(const y of [.37,.66,1.90,2.42]){
        cylinder('iron',x,floor+y-.044,z,.565,.025);
        cylinder('gray',x,floor+y,z,.571,.073);
        for(let b=0;b<8;b++){
          const a=b*Math.PI/4,bx=x+Math.cos(a)*.545,bz=z+Math.sin(a)*.545;
          rod(b%3?'edge':'rust',[bx,floor+y+.034,bz],[bx,floor+y+.060,bz],.022);
        }
      }
      pipe('rust',[x,floor+2.43,z],[x,ceiling-.29,z],.111);
      pipe('rust',[x,ceiling-.29,z],[-22.43,ceiling-.29,z],.10);
      pipe('iron',[-22.43,ceiling-.29,z],[-22.43,ceiling,z],.101);
      pipe('gray',[x,ceiling-.37,z],[x,ceiling-.25,z],.157);
      for(const dx of [.72,1.69]){
        pipe('gray',[x+dx-.052,ceiling-.29,z],[x+dx+.052,ceiling-.29,z],.132);
        box('iron',x+dx-.021,x+dx+.021,ceiling-.20,ceiling,z-.036,z+.036);
      }
      obj(i?'brass':'rust',wheel,x+.62,floor+1.22,z,.19,.19,.18,0,Math.PI/2);
      pipe('iron',[x+.53,floor+1.22,z],[x+.72,floor+1.22,z],.047);
      for(let j=0;j<3;j++){
        const a=j*Math.PI*2/3;
        pipe('gray',[x+.632,floor+1.22,z],[x+.632,floor+1.22+Math.sin(a)*.17,z+Math.cos(a)*.17],.017);
      }
      housing('gunmetal',x+.514,floor+1.76,z,.12,.34,.416);
      plaque(i?'B/02':'B/01',[i?'BEREITSCHAFT':'ABGETRENNT'],x+.576,1.76,z,.35,.228,Math.PI/2,i?'blue':'red');
      dial(x+.423,2.12,z-.307,.106,Math.PI/2,i);
      rod('brass',[x+.419,floor+2.12,z-.302],[x+.419,floor+1.94,z-.30],.019);
      const sight=plane(x+.385,floor+1.237,z+.40,Math.PI*.27);
      rod('gunmetal',sight(0,-.43,0),sight(0,.45,0),.062);
      rod('gasket',sight(0,-.344,.032),sight(0,.34,.032),.036);
      rod(i?'cold':'ochre',sight(0,-.319,.058),sight(0,i?.144:-.17,.058),.013);
      for(const v of [-.37,.365]){
        rod('brass',sight(0,v-.032,.015),sight(0,v+.032,.015),.053);
        rod('iron',sight(0,v,-.115),sight(0,v,.016),.028);
      }
      rod('green',[x+.44,floor+.47,z+.23],[x+.67,floor+.47,z+.31],.037);
      rod('iron',[x+.67,floor+.47,z+.31],[x+.67,floor+.09,z+.31],.032);
      stain(x+.574,1.05,z+.054,.28,.78,Math.PI*.5,1);
      stain(x+.72,.004,z+.22,.54,.89,0,2,-Math.PI*.5);
      hit(x-.61,x+.67,z-.59,z+.59);
    }
    housing('green',-21.095,floor+1.17,11.35,.53,2.19,2.22);
    housing('iron',-21.366,floor+1.24,11.35,.065,1.69,1.92);
    housing('gunmetal',-21.409,floor+1.72,11.35,.086,.59,1.75);
    plaque('WARTUNGSVERTEILER',['KREIS 01 GETRENNT','LASTTEST 03 · ÜBERFÄLLIG'],-21.462,1.74,11.08,.66,.33,-Math.PI*.5,'crt');
    dial(-21.455,1.75,11.76,.124,-Math.PI*.5,1);
    for(let i=0;i<7;i++)housing(i%3===0?'ochre':'edge',-21.434,floor+1.23,10.67+i*.226,.075,.092,.105);
    for(const [i,z] of [10.81,11.26,11.68,12.00].entries()){
      dial(-21.419,.965,z,.073,-Math.PI*.5,i);
      housing(i===2?'red':'ivory',-21.443,floor+1.12,z,.035,.037,.037);
    }
    grill('gray',-21.407,.61,11.35,1.65,.29,-Math.PI*.5);
    hit(-21.47,-20.83,10.24,12.46);
    grille(-23.71,9.84,.73,3.13);
    plaque('04 · RÜCKGABE',['NUR MIT NAMEN','Kein Personal seit 1962.'],-24.75,1.61,13.818,1.26,.52,Math.PI,'red');
    plaque('WARTUNG',['RÜCKWEG ZU B / BEOBACHTUNG'],-23.76,2.73,7.026,1.31,.35);
    stain(-25.94,1.51,10.96,1.3,2.46,Math.PI*.5,0);
  }else if(id==='return'){
    luminaire(-23.73,2.03,'red');luminaire(-23.72,5.63,'ivory');grille(-24.53,3.67,.62,4.71);
    for(const x of [-24.73,-22.79])conduit(x,.54,6.57,x<-24?'green':'rust');
    for(const [i,z] of [1.06,3.74,5.97].entries()){
      housing('green',-22.624,floor+1.17,z,.139,1.25,.40);
      housing('gunmetal',-22.70,floor+1.16,z,.062,1.12,.315);
      grill('edge',-22.735,1.54,z,.246,.25,-Math.PI*.5);
      housing(i===1?'red':'ochre',-22.75,floor+1.18,z-.065,.034,.038,.051);
      rod('brass',[-22.754,floor+.88,z+.098],[-22.754,floor+1.13,z+.098],.014);
      stain(-22.555,1.22,z+.37,.53,2.18,-Math.PI*.5,i%2?1:0);
    }
    plaque('BEOBACHTUNG',['NOTAUSGANG ZUR SEKTION B'],-24.933,1.74,1.45,1.00,.46,Math.PI/2,'blue');
    plaque('MARKE 09',['GEFUNDEN AM ABFLUSS','Nicht zurückbuchen.'],-24.935,1.21,3.73,.68,.34,Math.PI/2,'red');
    housing('gunmetal',-24.824,floor+.938,3.73,.25,.055,.47);
    cylinder('brass',-24.79,floor+.983,3.69,.058,.028);
    rod('iron',[-24.91,floor+.74,3.63],[-24.80,floor+.913,3.63],.022);
    stain(-24.72,.005,4.02,.41,1.25,0,2,-Math.PI*.5);
  }else if(id==='observation'){
    luminaire(-23.47,-2.22,'cold');
    box('iron',-23.23,-21.06,floor+.025,floor+.82,-3.64,-3.48);
    box('iron',-23.23,-21.06,floor+2.43,ceiling,-3.64,-3.48);
    for(const x of [-23.20,-22.19,-21.16])box('gray',x-.044,x+.048,floor+.8,floor+2.44,-3.65,-3.44);
    // Painted glass over an actually dark recess, no humans or medical procedures.
    box('glassDark',-23.20,-21.13,floor+.84,floor+2.40,-3.665,-3.635);
    housing('green',-23.83,floor+.48,-2.54,1.86,.80,.65);
    housing('edge',-23.82,floor+.911,-2.54,1.92,.106,.72);hit(-24.78,-22.86,-2.90,-2.18);
    housing('iron',-23.96,floor+1.22,-2.731,1,.55,.31);
    plaque('SICHTUNG 08',['KAMMER LEER','STIMME HINTER DER SCHEIBE','EINTRAG UNTERBROCHEN'],-24.03,1.241,-2.565,.72,.38,0,'crt');
    for(const y of [1.14,1.31])dial(-23.55,y,-2.567,.054,0,3);
    housing('gasket',-24.00,floor+.98,-2.385,.63,.033,.265);
    for(let iz=0;iz<3;iz++)for(let ix=0;ix<9;ix++)housing((iz+ix)%5?'gray':'brass',-24.25+ix*.062,floor+1.001,-2.46+iz*.069,.048,.016,.047);
    housing('leather',-23.23,floor+.989,-2.40,.48,.040,.30,.18);
    label('PROTOKOLL 08',['STIMME OHNE QUELLE'],-23.23,1.011,-2.392,.4,.202,0,'cream',-Math.PI*.5,false);
    props.folio(-24.57,floor+.967,-2.40,.24,.18,.12,3,{loose:true,thickness:.014});
    grill('edge',-24.15,.54,-2.207,.52,.31);
    for(let j=0;j<4;j++){
      const x=-22.76+j*.33;
      cylinder('gray',x,floor+.058,-3.14,.084,.104);
      box('iron',x-.028,x+.028,floor+.1,floor+.61,-3.17,-3.11);
    }
    plaque('SICHTUNG',['Nur ein Spiegelbild zulässig.'],-22.15,2.74,-3.441,1.46,.34);
    stain(-22.51,1.41,-3.630,.84,1.02,0,0);
  }else if(id==='vault'){
    // Stark contrast with the clinical rooms: stone, paired numbers on
    // Benches, a ledger and a floor inlay below disconnected machinery.
    luminaire(-22.67,15.04,'red');
    for(const x of [-25.76,-20.89,-19.15]){
      box('iron',x-.15,x+.15,floor,ceiling,19.12,19.28);
      box('rust',x-.226,x+.226,floor+.04,floor+.24,19.02,19.3);
    }
    for(const z of [15.58,17.15,18.7]){
      box('vaultWall',-25.82,-25.40,floor,ceiling,z-.19,z+.19);
      for(const [i,x] of [-24.61,-19.78].entries()){
        if(i===1&&z===15.58)continue;
        for(const side of [-1,1]){
          const ex=x+side*.43;
          housing('iron',ex,floor+.059,z,.195,.07,.40);
          housing('gunmetal',ex,floor+.35,z,.136,.16,.40);
          for(const ez of [-.132,.132])rod('iron',[ex,floor+.078,z+ez],[ex,floor+.429,z+ez*.81],.044);
        }
        housing('iron',x,floor+.209,z,1.02,.059,.080);
        for(let j=-2;j<=2;j++)housing(j%2?'wood':'darkWood',x,floor+.452,z+j*.096,1.13,.066,.086);
        housing('brass',x,floor+.450,z-.244,.154,.049,.022);
        hit(x-.56,x+.56,z-.25,z+.24);
      }
    }
    const x=-22.28,z=17.70,p=Array.from({length:8},(_,i)=>{const a=(i+.5)*Math.PI/4;return [x+Math.cos(a)*1.26,z+Math.sin(a)*1.02]});
    // Floor finish only: no obstacle or change to the walk surface.
    const n=64,surface=floor+.0035;
    const outer=(i,ratio=1)=>{
      i%=n;const a=p[Math.floor(i/8)],b=p[(Math.floor(i/8)+1)%8],t=(i%8)/8;
      return [x+(a[0]+(b[0]-a[0])*t-x)*ratio,surface,z+(a[1]+(b[1]-a[1])*t-z)*ratio];
    };
    const round=(i,r)=>{const a=(i/n+.0625)*Math.PI*2;return [x+Math.cos(a)*r,surface,z+Math.sin(a)*r*.885];};
    for(let i=0;i<n;i++){
      const j=i+1,side=Math.floor(i/8);
      k.quad('brass',outer(i,.953),outer(j,.953),outer(j),outer(i));
      k.quad(side%2?'iron':'gunmetal',round(i,.902),round(j,.902),outer(j,.953),outer(i,.953));
      k.quad('gray',round(i,.768),round(j,.768),round(j,.902),round(i,.902));
      k.quad(i%8===0?'copperDark':'rust',round(i,.715),round(j,.715),round(j,.768),round(i,.768));
      k.triangle('porcelain',[x,surface,z],round(j,.715),round(i,.715),[.5,.5,0,0,1,0]);
    }
    for(let row=-2;row<=2;row++)for(let col=-1;col<=1;col++){
      if(Math.abs(row)===2&&Math.abs(col)===1)continue;
      const cx=x+col*.22+(row%2?.042:0),cz=z+row*.21,y=surface+.001;
      k.quad((row+col)%2?'green':'gray',[cx-.102,y,cz],[cx,y,cz+.103],[cx+.102,y,cz],[cx,y,cz-.103]);
    }
    for(const dx of [-.49,.49]){
      pipe('iron',[x+dx,ceiling,z+.22],[x+dx,ceiling-.62,z+.22],.058);
      pipe('gasket',[x+dx,ceiling-.58,z+.22],[x+dx*.41,ceiling-.89,z+.26],.031);
    }
    cylinder('iron',x,ceiling-.34,z,.47,.28);
    cylinder('ivory',x,ceiling-.502,z,.36,.06);
    plaque('SAAL DER RÜCKGABE',['8 NAMEN / 9 MARKEN','„Die Neunte blieb unbelegt.“','Letzte Sitzung: niemand anwesend.'],-24.72,1.95,19.263,1.52,.82,Math.PI,'red');
    plaque('05 · SUDWERK',['NACHPRÜFUNG / UNTERDECK F'],-22.40,2.75,19.095,1.38,.34,Math.PI,'blue');
    housing('green',-19.325,floor+.50,18.895,1.25,.816,.49);
    housing('edge',-19.325,floor+.918,18.895,1.269,.066,.51);
    grill('iron',-19.30,.49,18.644,.91,.33,Math.PI);
    housing('leather',-19.32,floor+.962,18.88,.89,.030,.44);
    hit(-19.95,-18.70,18.66,19.15);
    label('VERZEICHNIS',['Acht Plätze gedeckt.','Kein Name für den letzten.'],-19.32,.981,18.86,.82,.39,Math.PI,'cream',-Math.PI/2,false);
    props.folio(-18.86,floor+.952,18.81,.173,.26,Math.PI-.20,4,{loose:true,thickness:.013});
    stain(-25.938,1.43,17.93,.88,2.40,Math.PI*.5,2);
    stain(-20.44,1.20,19.291,.62,2.21,Math.PI,0);
    for(let j=0;j<6;j++)cylinder('brass',-20.03-j*.112,floor+.015,18.13+(j%3)*.071,.038,.025);
  }
  flush();
}

const emitters={
  chambers:[[-19.51,-5.49,0xe98c68,10.0,5.9],[-17.30,-5.21,0xffeed5,25,8.0],[-14.43,1.23,0xa1dccf,26.3,9.2],[-8.50,-3.28,0xffe0a0,22.3,9.4]],
  lock:[[-8.02,5.5,0xf67556,11.4,5.6]],spine:[[-9.34,8.43,0xffe5a8,13.5,8.1],[-15.95,8.48,0xd7e3bd,16,8.8],[-19.32,8.42,0xe38260,13,6.3]],
  archive:[[-12.40,13.24,0xffe1b5,30,8.0]],plant:[[-22.89,10.03,0xcbded6,20,8.3],[-24.15,12.03,0xed805e,13,5.2]],
  return:[[-23.73,2.28,0xd17d63,11.4,6.7],[-23.75,5.36,0xe6dfbc,14,5.7]],
  observation:[[-23.51,-1.91,0xafe5da,21,6.9]],vault:[[-22.30,17.38,0xf3e0c2,26,7.4],[-23.53,14.78,0xdf6650,11,5.9]],
  ...MALT_LIGHTS
};
const unstable=new Set(['return','plant','lock','ward','cells']);

export function makeLabDeck(T,parent,world,materials,buildChamber){
  const deck=new T.Group(),rooms=new Map(),doors=[];deck.name='Projekt Bayern · Zellendeck';deck.visible=false;parent.add(deck);
  const lights=Array.from({length:4},()=>{const l=new T.PointLight(0xffffff,0,0,2);l.layers.set(LAB_LAYER);deck.add(l);return l});
  const hemi=new T.HemisphereLight(0xa4b0a7,0x444038,.86);hemi.layers.set(LAB_LAYER);deck.add(hemi);
  let last='',pathX=Infinity,pathZ=Infinity,preparation,phase=0,dim=1,affected=-1,normalPower=0;
  function build(id,graphics){
    const node=new T.Group();node.name='Projekt Bayern · '+cellNames[id];deck.add(node);
    if(id==='chambers')buildChamber(node,graphics);else fitOut(T,node,world,id,materials,graphics,doors);
    node.traverse(o=>{o.layers.set(LAB_LAYER);if(o.isMesh)o.castShadow=false});
    rooms.set(id,node);
  }
  async function prewarm(renderer,scene,shaft){
    // CPU and collision preparation is part of boot, never part of revealing
    // a doorway. Keep it in one batch so background-tab timers don't delay boot.
    const cpu=performance.now(),graphics=labGraphics(T);
    for(const id of Object.keys(LAB_CELLS)){
      if(id==='stairs')continue;
      build(id,graphics);
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
  function update(p,opened,dt=0){
    const id=labCellAt(p.x,p.z,.015)||(opened&&p.x>=LAB_CUT.left-1.4&&p.x<LAB_CUT.left&&p.z>=LAB_CUT.back&&p.z<=LAB_CUT.front?'stairs':null);
    const active=!!id&&(labCameraMode(p)!=='surface'||opened&&id==='stairs');
    let changed=deck.visible!==active;deck.visible=active;
    if(!active){last='';phase=0;dim=1;return changed;}
    for(const door of doors)changed=door.update(dt,p)||changed;
    phase=(phase+dt)%7.2;
    // One slow brownout on a nearby fixture; no strobe, particles or new lights.
    const strength=unstable.has(id)&&phase>5.55&&phase<6.16
      ?1-.16*Math.sin((phase-5.55)/.61*Math.PI)**2:1;
    if(id===last&&Math.hypot(pathX-p.x,pathZ-p.z)<.21){
      if(affected>=0&&strength!==dim){lights[affected].intensity=normalPower*strength;changed=true;}
      dim=strength;
      return changed;
    }
    last=id;pathX=p.x;pathZ=p.z;
    const render=labVisibility(id,p.x,p.z);
    for(const [cell,group] of rooms){const see=render.has(cell);if(group.visible!==see)changed=true;group.visible=see}
    const choices=[...render].flatMap(cell=>(emitters[cell]??[]).map(src=>[src,Math.hypot(p.x-src[0],p.z-src[1])+(cell===id?-.9:2),cell]));
    choices.sort((a,b)=>a[1]-b[1]);
    affected=unstable.has(id)?choices.slice(0,lights.length).findIndex(c=>c[2]===id):-1;
    dim=strength;
    for(let i=0;i<lights.length;i++){
      const l=lights[i],src=choices[i]?.[0];
      if(!src){l.intensity=0;continue}
      const [x,z,color,power,distance]=src;
      l.position.set(x,ceiling-.56,z);l.color.setHex(color);l.intensity=power*(i===affected?dim:1);l.distance=distance;
      if(i===affected)normalPower=power;
    }
    return changed;
  };
  return {update,target:(p,look)=>cellDoorTarget(doors,p,look),visible:()=>deck.visible,prepare(renderer,scene,shaft){
    return preparation??=prewarm(renderer,scene,shaft);
  }};
}
