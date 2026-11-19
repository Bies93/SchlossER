import {randomSource} from './surface-detail.js';
import {b,wcRoofAt} from './park-wc-layout.js';

const pi=Math.PI;
// Tapered, cupped blades with an angular edge and a raised midrib. Species
// read from the leaf silhouette, not from a flat billboard or a colour swap.
function blade(T,kind){
  const broad=kind==='lettuce',steps=kind==='calyx'?5:broad?14:18;
  const v=[],uv=[],index=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,bend=Math.sin(t*pi*.77),end=.0005;
    const w=end+(broad?.52:kind==='hemp'?.138:.275)*(Math.sin(t*pi)**(broad?.74:.91))*
      (broad?1+.14*Math.sin(i*1.87):i%2?.72:1.07);
    for(const side of [-1,0,1]){
      const y=(broad?.45:.19)*bend+.025*t-(side?(.12+.045*Math.sin(i*1.7))*bend:0);
      v.push(side*w+(broad?.07:.038)*Math.sin(t*pi*.9),y,t);
      uv.push((side+1)/2,t);
    }
    if(i<steps)for(let j=0;j<2;j++){
      const a=i*3+j,d=a+3;index.push(a,d,d+1,a,d+1,a+1);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}

export function furnishGreenhouse(T,{block,hit,pipe,stamp,artTile}){
  const rand=randomSource(291840),ball=new T.SphereGeometry(1,13,9);
  const pot=new T.LatheGeometry([[.49,0],[.60,.05],[.82,.84],[.92,.86],[.92,.98],[.81,1],
    [.77,.90],[.60,.18],[.41,.12],[0,.12]].map(([r,y])=>new T.Vector2(r,y)),19);
  const leaf=Object.fromEntries(['lettuce','hemp','tomato','calyx'].map(k=>[k,blade(T,k)]));
  const green=['leafDark','leafMedium','leafMedium','leafLight'];
  const from=(u,y,v)=>[u,y,v];
  const along=(u,y,v,a,L)=>[u+Math.cos(a)*L,y,v-Math.sin(a)*L];
  const roof=(u,v)=>wcRoofAt('greenhouse',u,v)-b;
  const box=(m,u,y,v,w,h,d)=>block(m,u-w/2,u+w/2,y,y+h,v-d/2,v+d/2);
  function leaves(kind,u,y,v,a,s,c,skin){
    stamp(skin??green[Math.floor(rand()*green.length)],leaf[kind],u,y,v,[s,c,s],a);
  }
  function tomato(u,y,v,h,phase){
    const ref=u+.068*Math.sin(phase),vf=v+.069*Math.cos(phase);
    pipe('wood',[u-.142,y-.018,v-.070],[u-.142,y+h+.159,v-.070],.0127);
    let prev=[u,y,v];
    for(let j=1;j<=8;j++){
      const t=j/8,P=[u+(ref-u)*t+.048*Math.sin(j*1.24+phase),y+h*t,v+(vf-v)*t+.045*Math.cos(j*1.27+phase)];
      pipe('stemLeaf',prev,P,.013-.006*t);prev=P;
      if(j<8){
        const a=j*2.39+phase,L=.33-.12*t+rand()*.07,Q=along(...P,a,L);
        Q[1]+=.09+(rand()-.5)*.18;pipe('stemLeaf',P,Q,.0065);
        for(let k=1;k<=3;k++){
          const M=P.map((num,i)=>num+(Q[i]-num)*(.20+k*.186)),s=.223-k*.027;
          leaves('tomato',...M,a+.99,s,.60);
          leaves('tomato',...M,a-1.03,s*.93,.65);
        }
        leaves('tomato',...Q,a,.171,.5,'leafMedium');
        if(j%2===0&&j<7)for(let k=0;k<3;k++){
          const fruit=along(...Q,a+1.8*k,.069+k*.005),r=.052+rand()*.022;
          pipe('stemLeaf',Q,[fruit[0],fruit[1]-.079,fruit[2]],.0045);
          stamp(rand()<.68?'tomatoRed':'tomatoGold',ball,fruit[0],fruit[1]-.123,fruit[2],[r,r*.91,r]);
          for(let l=0;l<4;l++)leaves('calyx',fruit[0],fruit[1]-.068,fruit[2],l*pi/2,.032,.10,'leafDark');
        }
      }
      if(j===3||j===6)pipe('linen',[u-.152,P[1]+.011,v-.081],[P[0],P[1]+.003,P[2]],.0048);
    }
  }
  function hemp(u,y,v,h,phase){
    let prev=from(u,y,v);
    for(let j=1;j<=7;j++){
      const t=j/7,P=[u+.042*Math.sin(j*.81+phase),y+h*t,v+.049*Math.sin(j*.65+phase)];
      pipe('stemLeaf',prev,P,.011-.006*t);prev=P;
      for(const mirror of j<6?[0,pi]:[0]){
        const a=j*1.86+phase+mirror,f=1.12-.60*t,Q=along(...P,a,.22*f);
        Q[1]+=.075;
        pipe('stemLeaf',P,Q,.0048);
        for(let k=-3;k<=3;k++){
          const angle=a+k*.37,s=(.297-.045*Math.abs(k))*f*(.94+rand()*.15),skin=green[(j+Math.abs(k))%green.length];
          leaves('hemp',...Q,angle,s,.44*f,skin);
        }
      }
    }
  }
  function lettuce(u,y,v,r,phase){
    for(let j=0;j<16;j++){
      const turn=j*2.39996+phase,s=(1-j*.033)*r,Q=along(u,y+.039+j*.003,v,turn,.02+j*.0014);
      leaves('lettuce',...Q,turn,s,.47-j*.014,j<7?'leafMedium':'leafLight');
    }
  }
  function planter(u,U,v,V){
    block('soil',u+.04,U-.04,.075,.363,v+.06,V-.06);
    for(const q of [v,V])for(let i=0;i<3;i++){
      const y=.061+i*.106;
      block(i===1?'wood':'darkWood',u-.005,U+.005,y,y+.102,q-.029,q+.029);
    }
    for(const q of [u,U])for(let i=0;i<3;i++){
      const y=.061+i*.106;
      block(i===1?'wood':'darkWood',q-.029,q+.029,y,y+.102,v+.03,V-.03);
    }
    for(const q of [u-.01,u+(U-u)/3,u+2*(U-u)/3,U+.01])for(const side of [-1,1]){
      const Vv=side<0?v-.04:V+.04;
      box('iron',q,.052,Vv,.060,.353,.029);
      box('gunmetal',q,.012,Vv,.091,.048,.088);
      for(const y of [.139,.307])pipe('steel',[q,y,Vv],[q,y,Vv+side*.021],.011);
    }
    hit(u-.038,U+.038,v-.055,V+.055);
    // A little broken soil at the plank edges rather than a second flat plane.
    for(let i=0;i<20;i++){
      const k=i%2?.10:V-v-.12,R=.014+rand()*.035;
      stamp('soil',ball,u+.106+rand()*(U-u-.22),.362,v+k+rand()*.027,[R,.018+rand()*.011,R*.85]);
    }
  }

  planter(22.74,28.52,1.32,2.56);
  planter(23.05,28.49,4.65,6.02);
  for(const [i,u] of [23.53,24.63,25.73,26.75,27.84].entries())tomato(u,.363,5.43+(i%2)*.14,1.02+rand()*.53,i*.82);
  for(const [i,u] of [22.98,23.74,24.53].entries())hemp(u,.363,1.83+(i%2)*.15,1.01+rand()*.49,i*1.2);
  for(const [i,u] of [25.30,26.06,26.82,27.60,28.08].entries())for(const v of [1.62,2.19])
    lettuce(u+(v>2?.16:0),.362,v,.245+rand()*.075,i*.92+v);
  for(const v of [1.47,5.89]){
    for(const u of [23.06,25.48,27.91])pipe('darkWood',[u,.184,v],[u,1.82,v],.023);
    pipe('wood',[23.06,1.792,v],[27.91,1.792,v],.022);
    for(const y of [1.21,1.48])pipe('linen',[23.06,y,v],[27.91,y+.024,v],.0048);
  }

  // Reclaimed light bars with hangers tied into the vault, not free-floating.
  for(const u of [23.59,25.93,27.76])for(const v of [2.02,5.33]){
    const y=roof(u,v)-.21;
    for(const s of [-.48,.48]){
      pipe('iron',[u+s,roof(u+s,v)+.018,v],[u+s,y+.035,v],.012);
      box('oxide',u+s,roof(u+s,v)-.036,v,.104,.023,.087);
    }
    box('gunmetal',u,y,v,1.27,.064,.265);
    box('ivoryPaint',u,y-.019,v,1.225,.027,.243);
    for(const d of [-.059,.059])pipe('growLamp',[u-.552,y-.028,v+d],[u+.552,y-.028,v+d],.017);
    for(const d of [-.096,.096])pipe('gunmetal',[u-.60,y-.044,v+d],[u+.60,y-.044,v+d],.008);
  }
  for(const v of [1.16,6.35]){
    const end=v<2?29.68:28.47;
    pipe('tunnelMetal',[21.55,1.72,v],[end,1.72,v],.024);
    for(const u of [21.6,23.22,25.92,28.37,29.59].filter(u=>u<end)){
      const wall=v<2?.729:6.598;
      box('oxide',u,1.648,wall,.131,.142,.062);
      pipe('gunmetal',[u,1.721,wall],[u,1.721,v],.020);
    }
  }
  // Solid bench and hand-written harvest ledger, repurposed tins and tools.
  for(const u of [29.88,30.49])for(const v of [2.05,4.72])box('iron',u,.019,v,.079,.91,.076);
  block('darkWood',29.83,30.54,.822,.94,1.99,4.81);
  block('wood',29.72,30.61,.938,.994,1.92,4.88);
  block('wood',29.91,30.47,.247,.305,2.05,4.72);
  hit(29.69,30.61,1.92,4.88);
  block('darkWood',30.68,30.84,1.183,1.893,2.73,4.12);
  artTile('fieldLog',30.675,1.542,3.425,1.28,.60,pi);
  box('darkWood',30.09,.994,3.52,.39,.035,.53);
  for(const v of [3.43,3.61])box('paper',30.06,1.024,v,.348,.026,.173);
  artTile('fieldLog',30.054,1.052,3.516,.48,.344,-pi/2,-pi/2,.085);
  pipe('cedar',[30.244,1.062,3.77],[30.106,1.062,3.79],.006);
  pipe('steel',[30.104,1.062,3.79],[30.082,1.062,3.795],.004);
  for(const [i,v] of [2.22,2.48,2.72].entries()){
    const h=.125+i*.025,r=.105+(i%3)*.017;
    stamp(i===1?'blueTin':'clay',pot,30.20+i*.036,.994,v,[r,h,r]);
    stamp('soil',ball,30.20+i*.036,1.003+h*.81,v,[r*.62,.010,r*.61]);
  }
  // Watering can with cast handle and a spout, not a solid unlabelled cube.
  stamp('blueTin',ball,30.15,1.149,4.32,[.154,.148,.204]);
  pipe('blueTin',[30.16,1.14,4.426],[30.15,1.295,4.68],.036);
  pipe('steel',[30.15,1.295,4.679],[30.15,1.308,4.72],.052);
  pipe('rubber',[30.15,1.309,4.719],[30.15,1.316,4.735],.044);
  for(const [A,B] of [[[30.15,1.225,4.158],[30.15,1.36,4.156]],[[30.15,1.36,4.156],[30.15,1.399,4.25]],
    [[30.15,1.399,4.25],[30.15,1.367,4.368]],[[30.15,1.367,4.368],[30.15,1.260,4.438]]])pipe('gunmetal',A,B,.014);
  for(const [i,v] of [2.60,3.03].entries())stamp('tote',ball,30.26,.375,v,[.188,.073,.195],i*.36);
  for(const u of [28.98,29.71]){
    const v=1.18;
    box('darkWood',u,.024,v,.69,.259,.49);
    for(const d of [-.247,.247])for(let n=0;n<3;n++)box('wood',u,.052+.096*n,v+d,.675,.074,.024);
    for(const d of [-.238,.238])box('iron',u-.34,.051,v+d,.047,.233,.079);
    hit(u-.35,u+.35,v-.254,v+.254);
    artTile('seedLabel',u-.371,.180,v,.258,.137,pi);
  }
  block('darkWood',20.19,20.26,1.129,1.823,4.41,5.83);
  artTile('growSign',20.266,1.476,5.12,1.34,.60,0);
  for(const [u,v] of [[21.34,5.65],[21.74,5.84]]){
    stamp('clay',pot,u,0,v,[.201,.29,.201]);
    stamp('soil',ball,u,.241,v,[.135,.017,.134]);
    lettuce(u,.251,v,.277,u);
  }
  hit(21.14,21.96,5.44,6.07);
  ball.dispose();pot.dispose();for(const g of Object.values(leaf))g.dispose();
}
