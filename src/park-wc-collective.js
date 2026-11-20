import {randomSource} from './surface-detail.js';
import {b,wcRoofAt} from './park-wc-layout.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const pi=Math.PI,tau=2*pi;
const tiles=['women','men','keep','arrow','flag','map','poster','dial','press','aid','flyer'];
export function collectiveArt(T){
  const c=document.createElement('canvas');c.width=1024;c.height=1536;const x=c.getContext('2d'),rand=randomSource(85210);
  function line(points,color,width=3){
    x.strokeStyle=color;x.lineWidth=width;x.beginPath();
    points.forEach(([u,v],i)=>i?x.lineTo(u,v):x.moveTo(u,v));x.stroke();
  }
  function text(label,u,v,size,color,font='monospace'){
    x.textAlign='center';x.font='bold '+size+'px '+font;x.fillStyle=color;x.fillText(label,u,v,471);
  }
  function peace(u,v,r,color){
    x.strokeStyle=color;x.lineWidth=6;x.beginPath();x.arc(u,v,r,0,tau);x.stroke();
    line([[u,v-r],[u,v+r]],color,6);line([[u-r*.725,v+r*.68],[u,v],[u+r*.725,v+r*.68]],color,6);
  }
  function leaf(u,v,ink){
    x.save();x.translate(u,v);x.fillStyle=ink;
    for(const [angle,length] of [[-.97,28],[-.63,38],[-.31,47],[0,53],[.31,47],[.63,38],[.97,28]]){
      x.save();x.rotate(angle);x.beginPath();x.moveTo(0,4);
      x.quadraticCurveTo(-9,-length*.45,0,-length);x.quadraticCurveTo(9,-length*.45,0,4);
      x.fill();x.restore();
    }
    line([[0,-9],[0,17]],ink,3);x.restore();
  }
  for(const [i,t] of tiles.entries()){
    x.save();x.translate((i%2)*512,Math.floor(i/2)*256);
    x.beginPath();x.rect(0,0,512,256);x.clip();
    const civic=i<4; x.fillStyle=civic?'#e2ddc2':i===4?'#595139':i===5?'#a19473':i===6?'#3b5249':i===7?'#263d36':'#d4b98a';
    x.fillRect(0,0,512,256);
    if(t==='flag'){
      for(let j=15;j>0;j--){
        x.strokeStyle=['#b27550','#a49158','#777145','#83563e','#9c8055'][j%5];
        x.lineWidth=7+(j%3)*4;x.beginPath();
        for(let q=0;q<=96;q++){
          const a=q/96*tau,r=j*17+Math.sin(a*7.3+j)*6+Math.cos(a*3.2+j)*9;
          const u=257+Math.cos(a)*r*1.70,v=127+Math.sin(a)*r*.91;
          if(q)x.lineTo(u,v);else x.moveTo(u,v);
        }
        x.stroke();
      }
      x.fillStyle='#4f5340';x.beginPath();x.ellipse(256,113,178,91,0,0,tau);x.fill();
      text('KOLLEKTIV',256,62,31,'#e1cc96','Georgia');
      peace(256,122,44,'#f0d6a1');leaf(151,145,'#bdc18d');leaf(360,145,'#bdc18d');
      text('MOOSFUNK',256,197,39,'#efd4a4','Georgia');
      text('FRIEDEN STATT FUNKSTILLE',256,231,19,'#efce96');
    }else if(t==='map'){
      for(let j=0;j<10;j++)line([[37,33+j*19],[477,33+j*19]],'#a59d7b',1);
      for(let j=0;j<18;j++)line([[45+j*24,31],[45+j*24,228]],'#a19a7c',1);
      line([[71,181],[118,142],[199,173],[260,64],[324,87],[367,48],[444,71]],'#5f6250',6);
      line([[93,112],[117,142],[177,96],[260,64],[317,125],[368,159],[431,143]],'#8b5546',3);
      for(const [u,v,label] of [[117,143,'KÜCHE'],[260,64,'FUNK'],[368,159,'TAUSCH'],[431,143,'GARTEN']]){
        x.fillStyle='#994d3b';x.beginPath();x.arc(u,v,6,0,tau);x.fill();text(label,u,v+19,14,'#44392b');
      }
      text('NACHBARSCHAFT / TREFFPUNKTE',256,226,21,'#4f4937');
    }else if(t==='poster'){
      x.strokeStyle='#b4a77d';x.strokeRect(17,16,478,223);
      peace(87,122,47,'#d2c59a');
      text('SOLIDARITÄT',289,85,34,'#e2ce9d','Georgia');
      text('KÜCHE FÜR ALLE',299,131,31,'#d7ba8b','Georgia');
      text('TEILEN · TAUSCHEN · ZUHÖREN',281,195,18,'#e3cba0');
    }else if(t==='dial'){
      text('MOOSFUNK // ABENDWELLE',256,76,30,'#c5d6a3');
      for(let j=0;j<18;j++)line([[52+j*23,171],[52+j*23,183-j%3*9]],'#acc28e',3);
      line([[49,153],[466,153]],'#acc28e',2);line([[334,124],[334,185]],'#dd9b61',3);
      text('NUR EMPFANG',256,218,21,'#b8c490');
    }else if(t==='press'||t==='aid'||t==='flyer'){
      const ink=t==='aid'?'#415442':'#733c36';
      x.strokeStyle=ink;x.lineWidth=5;x.strokeRect(21,19,470,218);
      x.fillStyle=ink;x.fillRect(22,34,468,58);
      text(t==='press'?'FREIE PRESSE':t==='aid'?'TAUSCHREGAL':'MOOSFUNK',256,76,42,'#ead4a7','Georgia');
      peace(90,153,29,ink);
      text(t==='press'?'STIMMEN VON UNTEN':t==='aid'?'NIMM, WAS DU BRAUCHST':'KEINER BLEIBT ZURÜCK',293,142,24,ink);
      text(t==='press'?'VON HAND GEDRUCKT':t==='aid'?'GIB, WAS DU KANNST':'SONNTAG · KÜCHE FÜR ALLE',302,187,19,ink);
      line([[151,209],[463,209]],ink,2);
    }else{
      x.strokeStyle='#6f7968';x.lineWidth=4;x.strokeRect(16,18,480,218);
      if(t==='women'||t==='men'){
        const woman=t==='women',ink='#415049';
        x.fillStyle=ink;x.beginPath();x.arc(95,67,20,0,tau);x.fill();
        if(woman){x.beginPath();x.moveTo(75,94);x.lineTo(112,94);x.lineTo(129,174);x.lineTo(60,174);x.closePath();x.fill();}
        else x.fillRect(69,94,51,68);
        for(const a of [73,102])x.fillRect(a,153,14,52);
        text(woman?'DAMEN':'HERREN',297,150,67,ink,'Arial');
      }else if(t==='keep'){
        text('BITTE SAUBER',256,112,44,'#43554c','Arial');text('HALTEN',256,171,44,'#43554c','Arial');
      }else{
        peace(259,126,66,'#68765e');
      }
    }
    for(let j=0;j<(civic?430:1340);j++){
      x.fillStyle=j%2?(civic?'#29291813':'#f3e1b021'):'#211b1422';
      x.fillRect(rand()*512,rand()*256,1+rand()*4,1+rand()*2);
    }
    x.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=3;
  const material=new T.MeshStandardMaterial({map,roughness:.91});
  const uv=(name)=>{
    const i=tiles.indexOf(name),l=i%2*.5+.004,t=1-Math.floor(i/2)*256/c.height;
    return [l,t-252/c.height,l+.492,t-4/c.height];
  };
  const cloth=material.clone();cloth.roughness=1;cloth.side=T.DoubleSide;
  return {mount(room,tile,x,y,z,w,h,angle,{folded=false,pitch=0}={}){
    const g=new T.PlaneGeometry(w,h,folded?32:1,folded?8:1),a=g.getAttribute('uv'),[l,b,r,t]=uv(tile);
    if(folded){
      const v=g.getAttribute('position');
      for(let i=0;i<v.count;i++){
        const u=a.getX(i),drop=1-a.getY(i),wave=Math.sin(u*47.3+drop*2.8)+.51*Math.sin(u*83.9-drop*2.4);
        v.setXYZ(i,v.getX(i),v.getY(i)-drop*drop*(.066*Math.sin(u*pi)+.013*Math.sin(u*26)),wave*(.008+.031*drop));
      }
      g.computeVertexNormals();
    }
    for(let i=0;i<a.count;i++)a.setXY(i,l+(r-l)*a.getX(i),b+(t-b)*a.getY(i));
    const m=new T.Mesh(g,folded?cloth:material);m.name='Moosfunk · '+tile;m.position.set(x,y,z);m.rotation.set(pitch,angle,0,'YXZ');room.add(m);
  }};
}

export function furnishCollective(T,kit,id){
  const {block,hit,stamp,pipe,print,hqTile}=kit;
  const cylinder=new T.CylinderGeometry(1,1,1,18),ball=new T.SphereGeometry(1,15,10);
  const ring=new T.TorusGeometry(1,.104,8,19).rotateX(pi/2);
  const turn=new T.LatheGeometry([[0,0],[.58,0],[.80,.14],[.82,.41],[.52,.61],
    [.30,.72],[.29,1.08],[.37,1.11],[.37,1.19],[.25,1.19],[.21,1.08],[.20,.78],
    [.30,.57],[.32,.35],[0,.22]].map(([r,y])=>new T.Vector2(r,y)),20);
  const item=(m,g,u,y,v,w,h,d,a=0)=>stamp(m,g,u,y,v,[w,h,d],a);
  const frame=(m,u,U,y,Y,v,V)=>block(m,u,U,y,Y,v,V);
  function soft(mat,u,y,v,w,h,d,r,a=0){
    const g=new RoundedBoxGeometry(d,h,w,2,r);
    item(mat,g,u,y,v,1,1,1,a);g.dispose();
  }
  function table(u,v,w,d,h){
    for(const a of [-1,1])for(const c of [-1,1]){
      const A=u+a*(w*.5-.09),B=v+c*(d*.5-.09);
      frame('iron',A-.034,A+.034,.024,h-.034,B-.034,B+.034);
      frame('ochre',A-.047,A+.047,.015,.055,B-.047,B+.047);
    }
    frame('iron',u-w*.5,u+w*.5,h-.103,h-.065,v-d*.5+.032,v+d*.5-.032);
    for(let i=0;i<4;i++){
      const v0=v+(i-1.5)*d*.25;
      soft(i===1?'pine':'wood',u,h-.034,v0,w,.068,d*.25-.0026,.008);
    }
    hit(u-w*.5,u+w*.5,v-d*.5,v+d*.5);
  }
  function crate(u,v,w=.61,d=.47,base=0){
    frame('darkWood',u-w*.5,u+w*.5,base+.012,base+.374,v-d*.5,v+d*.5);
    for(let i=0;i<4;i++){
      const y=base+.043+i*.081;
      for(const q of [-1,1])frame('wood',u-w*.47,u+w*.47,y,y+.062,v+q*d*.5-.012,v+q*d*.5+.012);
    }
    for(const q of [-1,1])frame('iron',u+q*w*.45-.018,u+q*w*.45+.018,base+.022,base+.386,v-d*.51,v+d*.51);
    if(!base)hit(u-w*.5,u+w*.5,v-d*.5,v+d*.5);
  }
  function cup(u,y,v,index=0){
    item(index%2?'sea':'linen',cylinder,u,y+.056,v,.061,.110,.061);
    item('dark',ball,u,y+.106,v,.048,.008,.048);
    item('brass',ring,u,y+.062,v+.067,.031,.10,.031,pi/2);
  }
  function bottle(u,y,v,i){
    item(i%2?'amber':'sea',cylinder,u,y+.086,v,.039,.171,.039);
    item('paper',cylinder,u,y+.079,v,.040,.046,.040);
    item('amber',cylinder,u,y+.178,v,.024,.035,.024);
    item('brass',cylinder,u,y+.199,v,.019,.014,.019);
  }
  if(id!=='collective'){
    // Follow only solid rock. Each rail returns into the wall, with stand-offs
    // anchored through the relief; nothing spans either portal or the turn.
    if(id==='tunnel'){
      pipe('tunnelMetal',[9.43,1.01,6.455],[12.35,1.01,6.455],.026);
      for(const u of [9.43,10.28,11.33,12.35]){
        frame('oxide',u-.063,u+.063,.918,1.095,6.246,6.382);
        pipe('tunnelMetal',[u,1.01,6.362],[u,1.01,6.455],.019);
        pipe('gunmetal',[u-.031,1.01,6.455],[u+.031,1.01,6.455],.033);
        for(const y of [.944,1.071])pipe('iron',[u,y,6.376],[u,y,6.390],.011);
      }
    }else{
      frame('darkWood',13.986,14.166,1.27,1.646,5.10,5.88);
      print('poster',13.982,1.461,5.49,.728,.32,pi);
      pipe('tunnelMetal',[13.95,1.01,5.08],[13.95,1.01,7.16],.026);
      for(const v of [5.08,5.76,6.45,7.16]){
        frame('oxide',14.023,14.166,.918,1.095,v-.063,v+.063);
        pipe('tunnelMetal',[14.040,1.01,v],[13.95,1.01,v],.019);
        pipe('gunmetal',[13.95,1.01,v-.031],[13.95,1.01,v+.031],.033);
        for(const y of [.944,1.071])pipe('iron',[14.028,y,v],[14.013,y,v],.011);
      }
    }
  }else{
    // Salvaged lining at the damp end of the vault, not another full wall.
    for(let row=0;row<7;row++){
      const y=.023+row*.209;
      for(let u=11.31-(row%2)*.258,i=0;u<13.08;u+=.513,i++){
        const l=Math.max(11.24,u)+.006,r=Math.min(13.15,u+.513)-.007;
        if(r-l>.056)frame(['rockWarm','rock','cap','rockWarm'][(i+row*3)%4],l,r,y,y+.198,-4.178,-4.039+(i%3)*.009);
      }
    }
    for(const [u,v] of [[11.35,-4.055],[19.95,-4.055],[11.35,2.08],[19.95,2.08]]){
      frame('oxide',u-.136,u+.136,1.61,1.91,v-.115,v+.115);
    }
    const roof=(u,v)=>wcRoofAt('collective',u,v)-b;
    for(const v of [-4.055,2.08]){
      let prev;
      for(let i=0;i<=22;i++){
        const u=11.29+(20.00-11.29)*i/22,y=roof(u,v)-.106;
        const pt=[u,y,v];
        if(prev)pipe('tunnelMetal',prev,pt,.039);
        if(i%4===0)pipe('oxide',[u,y-.003,v],[u,y+.16,v],.023);
        prev=pt;
      }
      for(const u of [11.35,19.95])pipe('oxide',[u,1.723,v],[u,roof(u,v)-.10,v],.027);
    }
    // An original faction identity, in canvas ink rather than borrowed game art.
    const flag=19.865;
    pipe('darkWood',[flag,1.998,-1.82],[flag,1.998,1.82],.031);
    for(const v of [-1.69,1.69]){
      frame('iron',19.975,20.117,1.904,2.037,v-.049,v+.049);
      pipe('brass',[flag,1.998,v],[20.012,1.971,v],.018);
    }
    print('flag',flag-.016,1.455,0,3.22,1.038,pi,{folded:true});
    for(let j=0;j<8;j++){
      const v=-1.91+j*.53,y=.27+(j%3)*.045;
      soft(j%3?'darkWood':'wood',19.91,y,v,.075,.47,.518,.013);
      for(const e of [-.205,.205])item('iron',ball,19.866,y+.163,v+e,.009,.009,.009);
    }
    frame('wood',13.22,16.55,.97,2.035,-4.116,-4.037);
    print('map',14.885,1.52,-4.024,3.02,.894,-pi/2);
    for(const u of [13.54,14.83,16.21])pipe('brass',[u,1.00,-4.019],[u,1.00,-3.998],.018);
    frame('darkWood',18.80,19.81,1.112,1.783,-4.196,-4.055);
    print('poster',19.305,1.447,-4.048,.959,.613,-pi/2);

    // Radio bench and repair shelf; the receiver is a prop, not an interface.
    table(14.97,-3.54,3.43,.82,.948);
    soft('darkWood',14.835,1.207,-3.59,1.37,.516,.52,.044);
    soft('iron',14.86,1.207,-3.321,1.18,.397,.036,.014);
    soft('sea',14.85,1.205,-3.300,.966,.315,.012,.005);
    print('dial',14.85,1.206,-3.291,.935,.29,-pi/2);
    for(const u of [14.27,15.41]){
      pipe('brass',[u,1.052,-3.329],[u,1.051,-3.268],.041);
      pipe('gasket',[u,1.052,-3.281],[u,1.052,-3.261],.048);
      pipe('iron',[u,1.052,-3.266],[u,1.050,-3.246],.036);
      pipe('linen',[u,1.075,-3.244],[u,1.089,-3.242],.0035);
      pipe('signal',[u,1.350,-3.319],[u,1.350,-3.295],.020);
      for(const y of [1.023,1.384])item('brass',ball,u,y,-3.295,.008,.008,.007);
    }
    for(let j=0;j<9;j++)soft('gasket',14.35+j*.103,1.459,-3.548,.043,.020,.207,.007);
    for(let i=0;i<5;i++){
      const u=14.62+i*.102;
      pipe('gunmetal',[u,1.076,-3.33],[u,1.076,-3.291],.014);
      frame('paper',u-.012,u+.012,1.109,1.12,-3.308,-3.299);
    }
    pipe('brass',[14.30,1.446,-3.74],[14.39,1.76,-3.76],.012);
    pipe('steel',[14.39,1.76,-3.76],[14.58,1.949,-3.82],.006);
    item('iron',ball,14.58,1.949,-3.82,.012,.012,.012);
    const cone=new T.LatheGeometry([[0,0],[.22,.02],[.40,.15],[.61,.38],[.88,.87],[1,1],[.93,1],
      [.83,.86],[.56,.4],[.32,.19],[0,.14]].map(q=>new T.Vector2(...q)),20);
    for(const u of [13.83,15.95]){
      soft('darkWood',u,1.137,-3.575,.392,.378,.462,.028);
      soft('studioFelt',u,1.136,-3.338,.350,.338,.027,.012);
      for(const [y,r] of [[1.043,.076],[1.23,.073]]){
        pipe('brass',[u,y,-3.339],[u,y,-3.312],r*1.08);
        stamp('studioFelt',cone,u,y,-3.337,[r,.032,r],pi/2,pi/2);
        item('gunmetal',ball,u,y,-3.327,.011,.023,.023);
      }
      for(const q of [-.138,.138])for(const y of [.995,1.265])item('steel',ball,u+q,y,-3.320,.008,.008,.006);
    }
    cone.dispose();
    frame('ochre',15.89,16.41,.946,1.021,-3.38,-3.05);
    frame('paper',15.945,16.298,1.021,1.037,-3.323,-3.087);
    for(let i=0;i<4;i++)frame('darkWood',15.977,16.254,1.037,1.040,-3.296+i*.043,-3.291+i*.043);
    pipe('gasket', [14.39,1.01,-3.81],[14.39,.102,-3.943],.015);
    pipe('iron',[14.39,.102,-3.943],[13.72,.052,-3.954],.015);

    // Warm centre: woven floor textile, shared couch and a low improvised table.
    const rug=new T.PlaneGeometry(3.79,3.21).rotateX(-pi/2);
    item('loungeTextile',rug,17.565,.011,.185,1,1,1);rug.dispose();
    for(let j=0;j<49;j++)for(const u of [15.96,19.17]){
      const v=-1.67+j*.076,dir=u<17?-1:1;
      pipe(j%5?'linen':'ochre',[u,.009,v],[u+dir*(.045+(j*7%9)*.004),.006,v+.012*Math.sin(j)],.005);
    }
    soft('darkWood',19.295,.230,.09,.688,.225,3.136,.036);
    soft('tartan',19.683,.582,.09,.177,.796,3.15,.032);
    for(const u of [19.04,19.57])for(const v of [-1.38,-.38,.56,1.55]){
      soft('darkWood',u,.077,v,.123,.153,.113,.016);
      pipe('brass',[u,.045,v-.050],[u,.045,v+.051],.018);
    }
    for(const [j,v] of [-.945,.057,1.05].entries()){
      soft(j%2?'wool':'fabric',19.281,.412,v,.522,.188,.926,.055);
      soft(j%2?'wool':'fabric',19.566,.709,v,.268,.473,.934,.067);
      pipe('tartan',[19.018,.440,v-.401],[19.018,.440,v+.400],.006);
      pipe('linen',[19.445,.886,v-.400],[19.445,.886,v+.400],.005);
      for(const y of [.735,.819])for(const q of [-.24,0,.24])item(j%2?'tartan':'darkWood',ball,19.429,y,v+q,.009,.010,.009);
      if(j!==1){
        soft(j?'rug':'tartan',19.393,.654,v+(j?.10:-.094),.124,.299,.375,.051,j?.19:-.13);
        item('ochre',ball,19.331,.656,v+(j?.10:-.094),.010,.012,.010);
      }
    }
    for(const v of [-1.48,1.58]){
      soft('darkWood',19.38,.387,v,.707,.291,.150,.029);
      soft('rug',19.36,.562,v,.648,.122,.172,.048);
    }
    hit(18.99,19.79,-1.56,1.73);
    table(17.61,.31,.89,1.38,.496);
    const ceramic=new T.LatheGeometry([[0,0],[.64,0],[.73,.056],[.78,.14],[.95,.72],[1,.963],[.97,1],
      [.86,1],[.87,.92],[.81,.72],[.67,.18],[.56,.12],[0,.12]].map(q=>new T.Vector2(...q)),20);
    for(const [u,v,m] of [[17.41,.58,'porcelain'],[17.70,.80,'green']]){
      item(m,ceramic,u,.499,v,.061,.112,.061);item(m,ring,u,.560,v+.064,.035,.093,.032,pi/2);
      item('dark',cylinder,u,.520,v,.041,.002,.041);
    }
    ceramic.dispose();
    item('glass',turn,17.71,.5,.08,.13,.236,.13);
    frame('iron',17.38,17.62,.498,.518,-.29,-.07);
    item('ochre',ring,17.49,.519,-.184,.094,.066,.082);
    pipe('paper',[17.44,.532,-.18],[17.57,.532,-.216],.010);
    bottle(17.87,.5,-.18,0);
    for(let i=0;i<3;i++)hqTile('airLog',17.36+i*.014,.506+i*.002,.155+i*.017,.205,.143,-pi/2,-pi/2,.18*i-.27);
    pipe('ochre',[17.53,.51,.30],[17.56,.515,.46],.008);
    crate(17.53,1.97,.57,.585);
    item('fabric',ball,17.53,.395,1.97,.266,.091,.257);
    crate(18.56,-2.28,.63,.69);
    frame('paper',18.32,18.70,.378,.398,-2.53,-2.12);
    frame('red',18.33,18.70,.394,.413,-2.503,-2.12);

    // Spare goods and food shelf at the opposite side; leave the entry lane open.
    for(const u of [17.11,19.37])for(const v of [3.63,4.28])frame('iron',u-.037,u+.037,.017,1.905,v-.033,v+.033);
    for(const y of [.223,.768,1.30,1.86])frame('wood',17.05,19.43,y-.039,y+.025,3.61,4.34);
    for(const [i,u] of [17.30,17.57,17.86,18.43,18.72,18.94].entries())bottle(u,.797,3.96+(i%2)*.11,i);
    for(const u of [17.59,18.67])crate(u,4.00,.80,.54,.253);
    for(const u of [17.43,17.68,18.37,18.83])cup(u,1.33,3.87,1);
    hit(17.02,19.45,3.61,4.34);
    // Hand-print corner: hinged screen, half-finished flyers and supplies.
    table(12.66,-2.02,1.92,.87,.902);
    crate(11.82,-3.07,.65,.56);
    crate(12.49,-3.22,.63,.50);
    const screen=[12.50,-2.02];
    for(const u of [-.286,.286])frame('darkWood',screen[0]+u-.026,screen[0]+u+.026,.907,.997,-2.37,-1.70);
    for(const v of [-2.348,-1.723])frame('darkWood',12.19,12.80,.907,.997,v-.023,v+.023);
    frame('linen',12.233,12.767,.944,.957,-2.32,-1.752);
    print('flyer',12.50,.959,-2.037,.48,.244,-pi/2,{pitch:-pi/2});
    pipe('wood',[12.281,.985,-1.872],[12.71,.985,-1.829],.021);
    pipe('gasket',[12.284,.977,-1.845],[12.71,.977,-1.804],.010);
    item('red',cylinder,13.27,.972,-2.24,.079,.14,.079);
    item('iron',cylinder,13.27,1.042,-2.24,.083,.022,.083);
    for(let i=0;i<4;i++){
      const angle=-pi/2+(i%2?-.18:.12),y=.904+i*.004,u=13.19+i*.044,v=-1.94+i*.041;
      print(i%2?'press':'flyer',u,y,v,.266,.144,angle,{pitch:-pi/2});
    }
    frame('darkWood',11.183,11.322,1.14,1.848,-2.87,-1.09);
    print('press',11.326,1.494,-1.98,1.68,.622,0);
    for(const [u,v] of [[16.70,3.95],[16.70,4.48]])crate(u,v,.38,.45);
    frame('sea',16.50,16.90,.381,.604,3.72,4.17);
    frame('linen',16.49,16.91,.595,.631,3.70,4.19);
    for(const u of [16.59,16.82])pipe('brass',[u,.553,3.724],[u,.533,3.690],.018);
    frame('red',16.643,16.755,.622,.64,3.86,3.97);
    frame('red',16.692,16.707,.625,.643,3.834,4.01);
    for(const [i,u] of [17.37,17.68,18.06,18.34,18.69,19.03].entries()){
      const y=1.885;
      frame(i%2?'linen':'paper',u-.102,u+.102,y,y+.075,3.94,4.20);
      pipe('red',[u-.094,y+.035,3.938],[u+.094,y+.035,3.938],.011);
    }

    let past=null;
    for(let i=0;i<=18;i++){
      const u=12.45+i*.39,v=-1.14+Math.sin(i/18*pi)*.48,y=Math.min(roof(u,v)-.06,2.21-Math.sin(i/18*pi)*.30);
      if(past)pipe('gasket',past,[u,y,v],.009);past=[u,y,v];
      if(i===0||i===18){
        const r=roof(u,v);pipe('iron',[u,y,v],[u,r+.044,v],.012);
        item('oxide',cylinder,u,r-.019,v,.043,.035,.043);
      }
      if(i%2===0){pipe('iron',[u,y,v],[u,y-.062,v],.014);item(i%4?'signal':'lamp',ball,u,y-.081,v,.027,.036,.027);}
    }
  }
  cylinder.dispose();ball.dispose();ring.dispose();turn.dispose();
}
