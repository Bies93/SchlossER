import {randomSource} from './surface-detail.js';

const pi=Math.PI,tau=2*pi;
const tiles=['women','men','keep','arrow','flag','map','poster','dial'];
export function collectiveArt(T){
  const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d'),rand=randomSource(85210);
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
    const civic=i<4; x.fillStyle=civic?'#e2ddc2':i===4?'#595139':i===5?'#a19473':i===6?'#3b5249':'#263d36';
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
    const i=tiles.indexOf(name),l=i%2*.5+.004,t=1-Math.floor(i/2)*.25-.004;return [l,t-.242,l+.492,t];
  };
  return {mount(room,tile,x,y,z,w,h,angle){
    const g=new T.PlaneGeometry(w,h),a=g.getAttribute('uv'),[l,b,r,t]=uv(tile);
    for(let i=0;i<a.count;i++)a.setXY(i,a.getX(i)?r:l,a.getY(i)?t:b);
    const m=new T.Mesh(g,material);m.name='Moosfunk · '+tile;m.position.set(x,y,z);m.rotation.y=angle;room.add(m);
  }};
}

export function furnishCollective(T,kit,id){
  const {block,hit,stamp,pipe,print}=kit;
  const cylinder=new T.CylinderGeometry(1,1,1,18),ball=new T.SphereGeometry(1,15,10);
  const ring=new T.TorusGeometry(1,.104,8,19).rotateX(pi/2);
  const turn=new T.LatheGeometry([[0,0],[.58,0],[.80,.14],[.82,.41],[.52,.61],
    [.30,.72],[.29,1.08],[.37,1.11],[.37,1.19],[.25,1.19],[.21,1.08],[.20,.78],
    [.30,.57],[.32,.35],[0,.22]].map(([r,y])=>new T.Vector2(r,y)),20);
  const item=(m,g,u,y,v,w,h,d,a=0)=>stamp(m,g,u,y,v,[w,h,d],a);
  const frame=(m,u,U,y,Y,v,V)=>block(m,u,U,y,Y,v,V);
  function table(u,v,w,d,h){
    for(const a of [-1,1])for(const c of [-1,1]){
      const A=u+a*(w*.5-.09),B=v+c*(d*.5-.09);
      frame('iron',A-.034,A+.034,.024,h-.034,B-.034,B+.034);
      frame('ochre',A-.047,A+.047,.015,.055,B-.047,B+.047);
    }
    frame('iron',u-w*.5,u+w*.5,h-.103,h-.065,v-d*.5+.032,v+d*.5-.032);
    frame('wood',u-w*.5,u+w*.5,h-.074,h,v-d*.5,v+d*.5);
    for(const q of [-.25,0,.25])frame('darkWood',u-w*.493,u+w*.493,h-.002,h+.001,v+q*d-.003,v+q*d+.003);
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
    const isTunnel=id==='tunnel';
    if(isTunnel){
      pipe('iron',[9.35,1.644,6.30],[12.39,1.62,6.30],.038);
      for(const u of [9.76,10.79,11.84])pipe('gunmetal',[u,1.64,6.30],[u,1.64,6.254],.052);
    }else{
      print('poster',14.136,1.34,5.33,.95,.44,pi);
      pipe('iron',[12.68,1.44,7.28],[12.68,1.44,5.89],.038);
    }
  }else{
    // An original faction identity, in canvas ink rather than borrowed game art.
    const flag=19.988;
    frame('wood',19.95,20.036,.868,2.054,-1.74,1.73);
    pipe('brass',[19.925,2.075,-1.82],[19.925,2.075,1.82],.026);
    print('flag',flag-.065,1.466,0,3.22,1.038,pi);
    frame('wood',13.22,16.55,.97,2.035,-4.116,-4.037);
    print('map',14.885,1.52,-4.024,3.02,.894,-pi/2);
    for(const u of [13.54,14.83,16.21])pipe('brass',[u,1.00,-4.019],[u,1.00,-3.998],.018);
    print('poster',19.995,1.44,3.44,1.40,.72,pi);

    // Radio bench and repair shelf; the receiver is a prop, not an interface.
    table(14.97,-3.54,3.43,.82,.948);
    frame('darkWood',14.15,15.52,.949,1.466,-3.84,-3.32);
    frame('iron',14.27,15.45,1.018,1.393,-3.325,-3.304);
    print('dial',14.85,1.206,-3.291,.935,.29,-pi/2);
    for(const u of [14.27,15.41]){
      pipe('brass',[u,1.052,-3.329],[u,1.051,-3.268],.041);
      pipe('signal',[u,1.350,-3.319],[u,1.350,-3.295],.020);
    }
    for(const u of [13.83,15.95]){
      frame('darkWood',u-.193,u+.193,.948,1.32,-3.80,-3.33);
      for(const [y,r] of [[1.034,.085],[1.22,.071]])pipe('iron',[u,y,-3.341],[u,y,-3.316],r);
    }
    frame('ochre',15.89,16.41,.946,1.021,-3.38,-3.05);
    frame('paper',15.945,16.298,1.021,1.037,-3.323,-3.087);
    for(let i=0;i<4;i++)frame('darkWood',15.977,16.254,1.037,1.040,-3.296+i*.043,-3.291+i*.043);
    pipe('gasket', [14.39,1.01,-3.81],[14.39,.102,-3.943],.015);
    pipe('iron',[14.39,.102,-3.943],[13.72,.052,-3.954],.015);

    // Warm centre: woven floor textile, shared couch and a low improvised table.
    const rugTop=.005;
    frame('rug',15.96,19.17,-.009,rugTop,-1.71,2.08);
    for(const u of [16.08,16.16,18.97,19.05])frame('linen',u-.023,u+.023,rugTop,rugTop+.003,-1.62,1.98);
    for(const v of [-1.64,-1.55,1.91,1.99])frame('ochre',16.03,19.10,rugTop,rugTop+.003,v-.019,v+.019);
    for(let i=0;i<16;i++){
      const u=16.34+(i%4)*.73,v=-1.29+Math.floor(i/4)*.89;
      frame(i%2?'linen':'fabric',u-.08,u+.08,rugTop,rugTop+.004,v-.12,v+.12);
    }
    frame('darkWood',18.99,19.66,.063,.318,-1.47,1.65);
    frame('iron',19.57,19.79,.14,.963,-1.49,1.67);
    for(const [j,v] of [-.945,.057,1.05].entries()){
      frame(j%2?'linen':'fabric',19.04,19.55,.303,.507,v-.468,v+.472);
      frame(j%2?'rug':'fabric',19.43,19.72,.471,.928,v-.473,v+.472);
      item(j%2?'rug':'linen',ball,19.42,.741,v+.08,.257,.185,.101,pi*.10);
    }
    for(const v of [-1.48,1.58])frame('darkWood',19.04,19.74,.287,.632,v-.080,v+.084);
    hit(18.99,19.79,-1.56,1.73);
    table(17.61,.31,.89,1.38,.496);
    cup(17.41,.499,.58);cup(17.70,.499,.80,1);
    item('glass',turn,17.71,.5,.08,.13,.236,.13);
    frame('iron',17.38,17.62,.498,.518,-.29,-.07);
    item('ochre',ring,17.49,.519,-.184,.094,.066,.082);
    pipe('paper',[17.44,.532,-.18],[17.57,.532,-.216],.010);
    bottle(17.87,.5,-.18,0);
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
    for(const [u,v] of [[12.42,-1.88],[13.08,-1.92],[13.07,-2.49]])crate(u,v,.51,.51);
    print('poster',11.295,1.45,-1.86,1.55,.72,0);

    let past=null;
    for(let i=0;i<=18;i++){
      const u=12.45+i*.39,v=-1.14+Math.sin(i/18*pi)*.48,y=2.289-Math.sin(i/18*pi)*.37;
      if(past)pipe('gasket',past,[u,y,v],.009);past=[u,y,v];
      if(i%2===0){pipe('iron',[u,y,v],[u,y-.062,v],.014);item(i%4?'signal':'lamp',ball,u,y-.081,v,.027,.036,.027);}
    }
  }
  cylinder.dispose();ball.dispose();ring.dispose();turn.dispose();
}
