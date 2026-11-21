import {sharedSet,randomSource} from './surface-detail.js';

const pi=Math.PI,TAU=pi*2;
// Keep the centre aisle, transverse routes, poster shelf and hatch approach
// empty. All spans are in the existing south wing's metres.
export const CABINETS=[
  {x:16.52,z:-3.12,w:2.73,d:1.38,label:3,kind:'silver'},
  {x:20.76,z:3.07,w:2.72,d:1.43,label:4,kind:'mineral'},
  {x:25.23,z:-3.08,w:2.59,d:1.38,label:5,kind:'jewel'},
  {x:20.76,z:-3.13,w:2.53,d:1.33,label:8,kind:'archive'},
  {x:16.52,z:3.06,w:2.74,d:1.39,label:9,kind:'herbarium'},
  {x:25.23,z:3.05,w:2.61,d:1.43,label:10,kind:'ceramic'}
];

function globeMap(T){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const c=canvas.getContext('2d'),rng=randomSource(782121);
  c.fillStyle='#9fafa3';c.fillRect(0,0,1024,512);
  for(let i=0;i<4200;i++){
    c.fillStyle=i%3?'#dbcda32b':'#4c4a362b';
    c.fillRect(rng()*1024,rng()*512,.8+rng()*4,1+rng()*2);
  }
  c.lineWidth=1;c.strokeStyle='#67674d69';
  for(let x=0;x<=1024;x+=1024/24){c.beginPath();c.moveTo(x,0);c.lineTo(x,512);c.stroke();}
  for(let y=43;y<512;y+=42.66){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}
  const land=[
    [[57,84],[94,71],[140,67],[176,70],[202,94],[258,83],[276,118],[260,142],[239,153],[223,193],[201,212],[184,200],[171,210],[158,193],[134,180],[112,145],[82,139],[75,119]],
    [[204,209],[244,218],[269,236],[311,251],[314,272],[285,292],[280,323],[263,346],[252,392],[233,407],[228,362],[219,331],[217,297],[199,262],[185,244]],
    [[332,60],[362,52],[396,68],[399,91],[366,116],[349,102]],
    [[446,124],[474,116],[487,93],[517,63],[548,69],[575,100],[610,95],[636,82],[691,94],[731,70],[771,78],[803,89],[861,105],[897,128],[863,153],[822,154],[803,192],[768,188],[749,219],[732,218],[713,248],[688,229],[669,237],[646,218],[621,186],[583,174],[560,187],[534,168],[515,160],[480,174],[461,156]],
    [[470,190],[510,181],[543,184],[574,209],[594,211],[585,253],[563,284],[560,315],[535,330],[517,307],[501,271],[480,261],[451,232],[454,210]],
    [[769,327],[802,300],[845,290],[858,307],[898,318],[912,351],[887,368],[859,355],[829,360],[795,382],[773,365]],
    [[719,252],[751,258],[760,275],[786,280],[800,292],[762,286],[723,277]],
    [[18,462],[88,459],[166,473],[236,467],[314,480],[386,468],[468,476],[523,461],[589,478],[670,472],[726,462],[834,474],[912,463],[1024,473],[1024,512],[0,512]]
  ];
  for(let j=0;j<land.length;j++){
    c.beginPath();land[j].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    c.fillStyle=['#c4b27f','#b6a36c','#d8cdab'][j%3];c.fill();c.strokeStyle='#726651';c.lineWidth=1.7;c.stroke();
  }
  c.fillStyle='#485854';c.font='italic 21px Georgia';c.textAlign='center';
  c.fillText('Oceanus Atlanticus',365,304);c.fillText('Mare Pacificum',63,275);
  c.fillText('Oceanus Indicus',673,321);c.fillText('Terra Australis',538,491);
  for(const [x,y] of [[97,330],[350,185],[645,379],[947,224]]){
    for(let i=0;i<8;i++){
      const a=i*pi/4;c.save();c.translate(x,y);c.rotate(a);c.fillStyle=i%2?'#69654b':'#7a5843';
      c.beginPath();c.moveTo(0,-31+(i%2)*9);c.lineTo(4,0);c.lineTo(0,9);c.lineTo(-4,0);c.fill();c.restore();
    }
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}

export function galleryObjectMaterials(T,std){
  const fibre=sharedSet(T,'canvas',128),metal=sharedSet(T,'cutMetal',256),clay=sharedSet(T,'stairStone',256),
    rock=sharedSet(T,'galleryStone',256),grain=sharedSet(T,'fineOak',256);
  return {
    stoneCap:std(0xb4aaa0,.88,0,rock,.48),decorCopper:std(0x957851,.61,.37,metal,.40),
    polishedTrim:std(0xc9a666,.50,.37,metal,.35),blueFelt:std(0x3e5860,.94,0,fibre,.50),
    lightLinen:std(0xc8b791,.94,0,fibre,.55),binding:std(0x6f5546,.82,0,fibre,.48),
    herbLeaf:std(0x717b4c,.89,0,fibre,.31),herbPale:std(0xa09358,.91,0,fibre,.32),
    herbStem:std(0x98714f,.94,0,grain,.41),petal:std(0xab7c70,.87,0,fibre,.23),
    redWax:std(0x88433f,.78,.02,clay,.31),darkWax:std(0x66352f,.79,.02,clay,.35),greenWax:std(0x575c49,.84,.02,clay,.34),
    buffClay:std(0xb4895b,.88,0,clay,.70),redClay:std(0x9f5d43,.86,0,clay,.71),
    potterySlip:std(0xd1a670,.66,.05,clay,.40),potteryDark:std(0x6d4338,.85,0,clay,.48),
    brightSilver:std(0xe6ded1,.30,.69,metal,.33),silverPatina:std(0x706c5f,.56,.42,metal,.58),
    velvetWine:std(0x60414a,.94,0,fibre,.55),cedar:std(0x88644b,.80,0,grain,.53),
    ice:std(0xe1d9d0,.21,.22,rock,.16),amethystEdge:std(0xba8ad5,.22,.22,rock,.20),
    pyriteFace:std(0xba9b58,.32,.70,metal,.63),quartzShadow:std(0x8b695c,.30,.24,rock,.33),
    chromeGold:std(0xe4b361,.30,.73,metal,.30),wineGem:std(0x9b3941,.20,.39),greenGem:std(0x55928d,.22,.37),
    ivoryBead:std(0xe2d6be,.43,.21),
    chart:new T.MeshStandardMaterial({map:globeMap(T),roughness:.67,metalness:.07}),
    modelGreen:std(0x6b7953,.97,0,clay,.53),modelHedge:std(0x4a6344,.94,0,fibre,.72),
    modelRed:std(0xa47359,.95,0,clay,.48),modelWater:std(0x6e9b9b,.37,.22,rock,.31)
  };
}

export function galleryModels(T,profile){
  // Non-indexed, flat facets: polishing the mineral shouldn't smooth away
  // the cleavage edges or turn the tips into little cones.
  function faceted(n,levels,jitter=0){
    const pos=[],uv=[],A=(layer,i)=>{
      i%=n;
      const [r,y,turn=0]=levels[layer],a=i*TAU/n+turn,h=1+jitter*Math.sin(i*2.78+layer*.88);
      return [r*h*Math.cos(a),y+(r&&i===0?jitter*.12:0),r*h*Math.sin(a)];
    };
    function tri(a,b,c){
      const ab=new T.Vector3().fromArray(b).sub(new T.Vector3().fromArray(a)),
        ac=new T.Vector3().fromArray(c).sub(new T.Vector3().fromArray(a));
      if(ab.cross(ac).lengthSq()<1e-10)return;
      pos.push(...a,...b,...c);uv.push(.12,.16,.50,.92,.89,.16);
    }
    for(let j=0;j<levels.length-1;j++)for(let i=0;i<n;i++){
      const a=A(j,i),b=A(j,i+1),c=A(j+1,i+1),d=A(j+1,i);
      tri(a,d,c);tri(a,c,b);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
  }
  const knife=new T.Shape();
  knife.moveTo(-.24,-.49);knife.lineTo(.19,-.49);knife.lineTo(.49,-.30);knife.lineTo(.46,.17);
  knife.quadraticCurveTo(.32,.392,-.18,.51);knife.lineTo(-.43,.39);knife.lineTo(-.43,-.31);knife.closePath();
  const shard=new T.Shape();
  shard.moveTo(-.46,-.24);shard.lineTo(-.17,-.47);shard.lineTo(.32,-.37);shard.lineTo(.51,-.05);
  shard.lineTo(.26,.49);shard.lineTo(-.32,.380);shard.closePath();
  return {
    prism:faceted(6,[[0,-.52],[.78,-.51],[1,-.42],[.92,.20],[.80,.32,.055],[0,.58,.09]],.11),
    cutStone:faceted(12,[[0,-.49],[.77,-.12,.13],[1,.047],[.96,.14],[.65,.385,.13],[0,.385]],.025),
    spoonBowl:profile([[0,-.29],[.40,-.25],[.75,-.10],[.95,.15],[1,.25],[.96,.27],[.76,.046],[.41,-.12],[0,-.15]],32),
    knifeBlade:new T.ExtrudeGeometry(knife,{depth:1,bevelEnabled:false}),
    potFragment:new T.ExtrudeGeometry(shard,{depth:1,bevelEnabled:false}),
    globeBall:new T.SphereGeometry(1,40,24),
    vessel:profile([[0,0],[.50,0],[.60,.035],[.55,.072],[.66,.17],[.86,.28],[1,.45],[.97,.63],[.82,.75],
      [.61,.82],[.54,.88],[.56,.94],[.68,.978],[.69,1],[.55,1],[.50,.966],[.47,.9],[.49,.82],[.72,.712],
      [.87,.60],[.90,.44],[.71,.26],[.48,.131],[0,.11]],36),
    waxDisc:faceted(20,[[0,-.50],[.84,-.50],[1,-.38],[.98,.28],[.91,.50],[0,.50]],.07)
  };
}

function station(f,site){
  const {x,z,w,d,label}=site,dir=z<0?1:-1,y=f.caseFrame(x,z,w,d,label);
  const P=(u,v,t)=>[x+dir*u,y+v,z-dir*t];
  const box=(m,u,v,t,w,h,d)=>{const [X,Y,Z]=P(u,v,t);f.box(m,X-w*.5,X+w*.5,Y,Y+h,Z-d*.5,Z+d*.5);};
  const put=(m,g,u,v,t,w,h,d,rx=0,ry=0,rz=0)=>{
    const [X,Y,Z]=P(u,v,t);f.put(m,g,X,Y,Z,w,h,d,rx,(dir<0?pi:0)+ry,rz,'YXZ');
  };
  const rod=(m,A,B,r)=>f.rod(m,P(...A),P(...B),r);
  const card=(tile,u,t,w=.244,h=.081)=>{const [X,Y,Z]=P(u,.017,t);f.itemCard(tile,X,Y,Z,dir,w,h);};
  const panel=(m,u,t,w,h)=>{
    box('cedar',u,.001,t,w+.016,.020,h+.016);
    box(m,u,.021,t,w,.010,h);
  };
  return {P,box,put,rod,card,panel,k:f.k};
}

function silver(s){
  const {put,box,rod,card,panel}=s;
  panel('blueFelt',0,.055,2.21,.816);
  for(let i=0;i<4;i++){
    const x=(i-1.5)*.478,L=i===3?.361:.300;
    put(i===2?'ebony':'brightSilver','utensil',x,.066,-.052,.038,L,.023,-pi/2,.055*(i-1.5));
    put(i===2?'decorCopper':'silverPatina','utensil',x,.079,-.095,.014,.187,.008,-pi/2,.055*(i-1.5));
    for(const z of [-.178,-.142,.047]){
      put('polishedTrim','sphere',x,.083,z,.016,.0046,.010);
      for(const side of [-1,1])put('brightSilver','sphere',x+side*.017,.082,z,.006,.006,.006);
    }
    box('binding',x,.030,-.077,.087,.030,.070);
    if(i===0||i===3){
      const w=i===3?.089:.067,h=i===3?.077:.049,Z=i===3?.267:.240;
      rod('brightSilver',[x,.070,.064],[x,.072,Z-.072],.014);
      put('brightSilver','spoonBowl',x,.069,Z,w,h,i===3?.101:.106,0,.055);
      put('silverPatina','sphere',x,.060,Z+.008,w*.54,.0022,.042);
      if(i===3)for(let j=0;j<14;j++){
        const a=.24+j*TAU/14;
        put('brightSilver','sphere',x+w*.76*Math.cos(a),.079,Z+.077*Math.sin(a),.007,.003,.007);
      }
    }else if(i===1){
      put('brightSilver','spoonBowl',x,.072,.156,.057,.019,.071);
      for(let t=0;t<4;t++){
        const u=x+(t-1.5)*.026;
        rod('brightSilver',[u,.073,.182],[u+(t-1.5)*.004,.076,.252],.008);
        rod('brightSilver',[u+(t-1.5)*.004,.076,.252],[u+(t-1.5)*.007,.092,.295],.0058);
      }
    }else{
      put('brightSilver','knifeBlade',x,.083,.193,.128,.275,.011,-pi/2);
      rod('silverInset',[x-.038,.093,.085],[x-.039,.093,.275],.0032);
      put('gold','block',x,.076,.103,.092,.030,.023);
    }
    card(17+i,x,-.443);
  }
}

function mineral(s){
  const {put,panel,box,card,rod}=s,r=randomSource(8743);
  for(const [i,tones] of [['quartz','ice'],['amethyst','amethystEdge'],['pyrite','pyriteFace'],['smoke','quartzShadow']].entries()){
    const x=(i-1.5)*.545,Z=i%2?.083:.022;
    panel(i%2?'blueFelt':'lightLinen',x,.048,.485,.78);
    put('rock','dodeca',x,.104,Z,.177,.073,.146,.25,i*.64,.14);
    for(let j=0;j<11;j++){
      const a=j*2.39996,radius=.052+r()*.118;
      put(j%3?'rockFlake':'rock','dodeca',x+Math.cos(a)*radius,.066+r()*.060,Z+Math.sin(a)*radius*.82,
        .047+r()*.040,.021+r()*.029,.034+r()*.020,r(),a,-r());
    }
    if(i===2){
      for(const [j,[u,t,h,k]] of [[-.060,.011,.167,.121],[.049,.027,.189,.135],[.025,-.068,.111,.082],
        [-.094,-.083,.092,.068],[.081,-.050,.114,.072]].entries()){
        put(tones[j%2],'block',x+u,h,t+Z,k,k,k,.13+j*.11,j*.63+.11,.16-j*.085);
      }
      for(let j=0;j<6;j++)rod('decorCopper',[x-.032,.255,Z-.014+j*.008],[x+.087,.252,Z-.012+j*.008],.0019);
    }else{
      const spikes=[[-.066,.036,.212,.061,.270],[.023,-.025,.246,.055,.302],[.090,.061,.163,.042,.198]];
      for(const [j,[u,t,h,w,H]] of spikes.entries()){
        put(tones[j%2], 'prism',x+u,h-.018,Z+t,w,H,w,.17-j*.15,.42*j+i,-.17+j*.13);
      }
      for(let j=0;j<16;j++){
        const a=j*2.39996,b=.091+(j%4)*.018,w=.014+r()*.014;
        put(tones[j%2],'prism',x+Math.cos(a)*b,.105+r()*.035,Z+Math.sin(a)*b,w,.07+r()*.096,w,
          Math.sin(a)*.46,a,-Math.cos(a)*.45);
      }
    }
    box('decorCopper',x-.184,.030,.047,.022,.048,.742);
    card(13+i,x,-.432);
  }
}

function jewel(s){
  const {put,panel,box,card,rod}=s;
  for(const [i,x] of [-.73,-.03,.675].entries()){
    panel(i===1?'blueFelt':'velvetWine',x,.044,.605,.776);
    put(i===1?'velvet':'velvetWine','sphere',x,.072,.032,.237,.044,.298,.17);
    card(21+i,x,-.438,.28,.081);
  }
  const a=-.73,b=-.03,c=.675;
  put('ivoryBead','block',a,.101,.043,.155,.040,.118,-.12);
  put('chromeGold','jewelRing',a,.151,.048,.069,.067,.087,-.46,0,-.09);
  put('edgeBrass','cylinder',a,.203,.018,.046,.026,.044);
  put('chromeGold','jewelRing',a,.218,.018,.043,.042,.039,-pi/2);
  put('wineGem','cutStone',a,.243,.018,.040,.071,.036,0,.22);
  for(let i=0;i<6;i++){
    const t=i*pi/3,dx=Math.sin(t)*.039,dz=Math.cos(t)*.036;
    rod('chromeGold',[a+dx,.214,.018+dz],[a+dx*.84,.264,.018+dz*.84],.0047);
    put('brightSilver','sphere',a+dx*.84,.264,.018+dz*.84,.0050,.006,.0050);
  }
  put('gold','cylinder',b,.120,.040,.143,.021,.116);
  put('decorCopper','ring',b,.139,.040,.133,.113,.143,-pi/2);
  put('chromeGold','ring',b,.149,.040,.107,.089,.111,-pi/2);
  put('greenGem','cutStone',b,.152,.040,.076,.061,.060,0,.26);
  for(let i=0;i<18;i++){
    const a=i*TAU/18,u=b+.117*Math.cos(a),d=.040+.096*Math.sin(a);
    put('gold','sphere',u,.145,d,.021,.015,.020);
    put('ivoryBead','sphere',u,.157,d,.010,.011,.010);
    if(i%2===0)rod('chromeGold',[u,.144,d],[b+.094*Math.cos(a+.102),.142,.040+.081*Math.sin(a+.102)],.004);
  }
  for(let i=0;i<=40;i++){
    const a=pi*.46+i*TAU*.96/40,u=c+Math.cos(a)*.197,z=.093+Math.sin(a)*.246;
    const y=.102+.018*(.5+.5*Math.sin(a));
    put(i%7?'chromeGold':'gold','jewelRing',u,y,z,.019,.025,.014,-pi*.43+(i%2?.85:0),a,0);
  }
  put('gold','jewelRing',c,.129,-.153,.025,.018,.016,-1.1);
  put('decorCopper','cylinder',c,.127,-.228,.069,.025,.086);
  put('chromeGold','ring',c,.143,-.228,.067,.078,.068,-pi/2);
  put('wineGem','cutStone',c,.157,-.228,.049,.060,.066);
  for(const x of [-.023,.023])box('gold',c+x,.140,-.163,.013,.023,.021);
}

function archive(s){
  const {put,box,rod,panel}=s;
  panel('lightLinen',-.59,.039,1.015,.91);
  panel('blueFelt',.55,.058,1.01,.86);
  const wax=[['redWax',-.833,-.134,.101],['darkWax',-.405,-.071,.110],['greenWax',-.621,.221,.082]];
  for(const [m,x,z,r] of wax){
    put(m,'waxDisc',x,.055,z,r,.052,r,0,.30+x);
    put(m,'ring',x,.082,z,r*.76,r*.76,r*.45,-pi/2);
    put(m,'sphere',x,.084,z,r*.22,.008,r*.29);
    for(let i=0;i<8;i++){
      const a=i*pi/4;
      rod(m,[x+Math.cos(a)*r*.29,.081,z+Math.sin(a)*r*.29],[x+Math.cos(a+.13)*r*.64,.085,z+Math.sin(a+.13)*r*.64],.0046);
    }
    rod('binding',[x-.040,.039,z-.023],[x-.105,.039,z-.163],.004);
  }
  const x=.40,z=.101;
  put('decorCopper','cylinder',x,.074,z,.064,.067,.064);
  put('ebony','profile',x,.146,z,.041,.092,.041);
  put('labelWood','sphere',x,.213,z,.051,.057,.046);
  for(const [i,[x,z]] of [[.782,.220],[.704,.084],[.829,-.096],[.629,-.169],[.332,-.261]].entries()){
    const r=i%2?.052:.046;
    put(i%2?'brassPlate':'polishedTrim','cylinder',x,.048,z,r,.021+i%3*.013,r,0,.11);
    put('decorCopper','jewelRing',x,.061+i%3*.0065,z,r*.82,r*.82,r*.54,-pi/2);
    const y=.066+i%3*.0065;
    rod('decorCopper',[x-.020,y,z+.006],[x+.020,y,z+.006],.0035);
    rod('decorCopper',[x,y,z-.020],[x,y,z+.019],.0035);
  }
  for(const i of [0,1,2]){
    const a=-.43+i*.011;
    box(i===2?'paper':'lightLinen',a,.029+i*.007,.337+i*.011,.35,.006,.19);
    if(i===2)for(let j=0;j<4;j++)rod('binding',[a-.124,.052,.275+j*.025],[a+.123-.02*j,.052,.275+j*.025],.0016);
  }
}

function herbarium(s){
  const {put,box,rod,panel,k,P}=s;
  function branch(x,z,angle,L,kind){
    const c=Math.cos(angle),sn=Math.sin(angle),pos=(u,t,y=.067)=>[x+c*u+sn*t,y,z-sn*u+c*t];
    rod('herbStem',pos(0,-L*.48),pos(.01,L*.54),.0050);
    const leaf=(u,t,out,rise,w,color)=>{
      const V=(a,b)=>P(...pos(u+a,t+b,.072+(a===0?.0015:0)));
      const root=V(0,0),tip=V(out,rise),mid=V(out*.47,rise*.49);
      const edge=(o,p)=>V(out*.53+o*w,rise*.44+p*w*.64);
      const corners=[root,edge(-.9,1),V(out*.83,rise*.88-w*.68),tip,V(out*.67,rise*.75+w*.55),edge(.88,-1)];
      for(let j=0;j<corners.length;j++){
        const a=corners[j],b=corners[(j+1)%corners.length];
        const orient=(a[2]-mid[2])*(b[0]-mid[0])-(a[0]-mid[0])*(b[2]-mid[2]);
        k.triangle(color,mid,orient>0?a:b,orient>0?b:a,[.5,.5,.11,.18,.9,.81]);
      }
      rod('herbStem',pos(u,t,.074),pos(u+out*.89,t+rise*.86,.075),.0011);
    };
    if(kind===0){
      for(let j=0;j<8;j++)for(const s of [-1,1]){
        const f=j/7;
        leaf((j%3)*.004,-L*.34+L*.82*f,s*(.18-.108*f),.079-.042*f,.026-.010*f,j%3?'herbLeaf':'herbPale');
      }
    }else{
      for(const j of [0,1,2,3])for(const s of [-1,1])leaf(0,-L*.31+j*.074,s*(.081+j*.008),.078,.025,j%2?'herbPale':'herbLeaf');
      for(const d of [-.085,0,.075]){
        const a=.048-Math.abs(d)*.28,b=L*.42+d;
        rod('herbStem',pos(.004,b-.16,.071),pos(a,b,.072),.0029);
        for(let j=0;j<7;j++){
          const angle=j*TAU/7,[X,Y,Z]=pos(a+.020*Math.cos(angle),b+.020*Math.sin(angle),.074);
          put(j%3?'petal':'herbPale','sphere',X,Y,Z,.019,.004,.011,0,angle);
        }
        const [X,Y,Z]=pos(a,b,.081);
        put('herbPale','sphere',X,Y,Z,.018,.006,.018);
      }
    }
  }
  for(const [i,x] of [-.716,-.024].entries()){
    panel('binding',x,.08,.606,.895);
    box('paper',x,.033,.08,.555,.028,.84);
    branch(x,.080,i===0?.13:-.24,.58,i);
    for(const x0 of [-.213,.213])for(const z of [-.299,.450])box('lightLinen',x+x0,.060,z,.048,.007,.047);
    for(let j=0;j<4;j++)rod('binding',[x-.207,.062,-.270+j*.013],[x+.104-.033*j,.062,-.270+j*.013],.0016);
  }
  panel('lightLinen',.719,.085,.524,.847);
  for(const [i,z] of [-.191,.065,.283].entries()){
    box('cedar',.704,.032,z,.302,.026,.171);
    box('binding',.704,.054,z,.273,.009,.143);
    for(let j=0;j<9;j++){
      const a=j*2.39996,r=.018+j%4*.02;
      put(i%2?'herbPale':'herbStem','sphere',.704+Math.cos(a)*r,.069,z+Math.sin(a)*r*.55,
        .014+i*.004,.010,.009+j%2*.003,.19,a);
    }
  }
  rod('decorCopper',[.867,.067,-.268],[.941,.105,.178],.010);
  rod('decorCopper',[.902,.067,-.274],[.947,.105,.180],.009);
}

function ceramic(s){
  const {put,rod,panel,box}=s;
  panel('lightLinen',0,.042,2.12,.878);
  const a=-.636,b=.063;
  for(const [x,z,r,h,m] of [[a,.129,.153,.326,'redClay'],[b,.098,.142,.192,'buffClay']]){
    put('cedar','cylinder',x,.039,z,r+.035,.016,r+.035);
    put(m,'vessel',x,.047,z,r,h,r);
    put('potterySlip','ring',x,.047+h*.963,z,r*.60,r*.60,r*.30,-pi/2);
    put('potteryDark','ring',x,.047+h*.442,z,r*.998,r*.998,r*.66,-pi/2);
    if(m==='redClay'){
      for(const t of [-.139,.139]){
        put('redClay','jewelRing',x+t,.254,z,.084,.071,.068,0,0,.12*Math.sign(t));
        put('redClay','sphere',x+t*.72,.294,z,.020,.034,.022);
        put('redClay','sphere',x+t*.89,.199,z,.021,.030,.022);
      }
    }
    for(let i=0;i<20;i++){
      const a=i*TAU/20,dx=Math.cos(a),dz=Math.sin(a);
      rod('potterySlip',[x+dx*r*.986,.047+h*.501,z+dz*r*.986],
        [x+Math.cos(a+.08)*r*.996,.047+h*.475,z+Math.sin(a+.08)*r*.996],.0019);
    }
  }
  // This insert sits on top of the linen panel. A second panel() would
  // place both finish surfaces at exactly .031 and fight for the depth buffer.
  box('binding',.706,.028,.052,.519,.009,.661);
  box('blueFelt',.706,.033,.052,.504,.006,.648);
  for(const [i,[x,z,w,h]] of [[.605,-.114,.206,.227],[.771,.086,.176,.208],[.649,.243,.121,.119]].entries()){
    const y=.039+i*.006;
    put(i%2?'buffClay':'redClay','potFragment',x,y,z,w,h,.016,-pi/2+.095*i,.63*i);
    if(i===0)put('potterySlip','ring',x-.027,y+.020,z+.010,.045,.033,.035,-pi/2);
  }
  box('paper',.68,.033,-.332,.299,.006,.116);
  for(let j=0;j<4;j++)rod('binding',[.564,.041,-.361+j*.016],[.782-.018*j,.041,-.361+j*.016],.00175);
}

export function collectibles(f){
  const build={silver,mineral,jewel,archive,herbarium,ceramic};
  for(const site of CABINETS)build[site.kind](station(f,site));
}

export function dressArchitecturalModels(f){
  const {put,box,rod,labelMount,plinth,k}=f;
  // Terrestrial globe, dated only by the gallery's invented presentation.
  const a=6.37,d=-5.27,y=1.584,r=.333;
  plinth(a,d,1.28,1.20,1.03);
  labelMount(11,a,1.085,d+.456,1,.63,.155);
  for(const [R,H,Y] of [[.285,.036,1.05],[.243,.051,1.093],[.172,.063,1.150]]){
    put('ebony','cylinder',a,Y,d,R,H,R);
    put('polishedTrim','cylinder',a,Y+H*.5,d,R*.97,.009,R*.97);
  }
  put('labelWood','profile',a,1.231,d,.153,.21,.153);
  put('brassPlate','sphere',a,1.305,d,.058,.056,.058);
  put('chromeGold','ring',a,y,d,r+.046,r+.046,r*.85,.185,.023,-.33);
  put('decorCopper','ring',a,y,d,r+.025,r+.025,r*.42,.185,.024,-.33);
  put('chart','globeBall',a,y,d,r,r,r,-.20,1.21,-.35);
  put('decorCopper','ring',a,y-.032,d,r+.009,r+.009,.286,pi/2,0,0);
  rod('edgeBrass',[a+.125,y-.347,d-.055],[a-.126,y+.348,d+.055],.009);
  for(const side of [-1,1])put('gold','sphere',a-.127*side,y+.351*side,d+.055*side,.027,.031,.028);
  for(let j=0;j<40;j++){
    const t=j*TAU/40,dx=Math.sin(t),dz=Math.cos(t),l=j%5===0?.022:.012;
    rod('chromeGold',[a+dx*(r+.012),y-.025,d+dz*(r+.012)],[a+dx*(r+.013+l),y-.025,d+dz*(r+.013+l)],.0027);
  }
  // Garden relief: a deliberately small, readable plan separate from the
  // larger architectural palace maquette. Not a survey of the real garden.
  const x=10.20,z=5.69,y0=1.058;
  plinth(x,z,2.21,1.45,y0);
  labelMount(12,x,y0+.053,z-.628,-1,.70,.159);
  box('cedar',x-.995,x+.995,y0,y0+.048,z-.492,z+.584);
  box('modelGreen',x-.969,x+.969,y0+.048,y0+.072,z-.476,z+.565);
  for(const Dz of [-.423,.501])box('modelTrim',x-.944,x+.944,y0+.073,y0+.078,z+Dz-.030,z+Dz+.030);
  for(const dx of [-.913,.913])box('modelTrim',x+dx-.028,x+dx+.031,y0+.073,y0+.078,z-.414,z+.477);
  box('modelTrim',x-.933,x+.933,y0+.074,y0+.081,z-.050,z+.056);
  box('modelTrim',x-.044,x+.044,y0+.074,y0+.082,z-.449,z+.515);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const u=x+sx*.471,v=z+sz*.243;
    box('modelRed',u-.334,u+.334,y0+.077,y0+.086,v-.137,v+.137);
    for(const a of [-1,1]){
      box('modelHedge',u-.338,u+.338,y0+.091,y0+.124,v+a*.114-.023,v+a*.114+.023);
      box('modelHedge',u+a*.316-.021,u+a*.316+.021,y0+.091,y0+.126,v-.091,v+.091);
    }
    for(const a of [-.15,.15]){
      for(let j=0;j<9;j++){
        const t=j*TAU/9;
        put('modelHedge','sphere',u+a+.077*Math.cos(t),y0+.103,v+.058*Math.sin(t),.030,.024,.024);
      }
      put('modelTrim','sphere',u+a,y0+.117,v,.026,.035,.026);
    }
  }
  put('modelTrim','cylinder',x,y0+.086,z,.151,.019,.151);
  put('modelWater','cylinder',x,y0+.098,z,.114,.012,.114);
  put('modelTrim','ring',x,y0+.104,z,.130,.130,.115,-pi/2);
  put('modelTrim','profile',x,y0+.139,z,.028,.070,.028);
  put('modelWater','sphere',x,y0+.179,z,.030,.012,.030);
  // Thin, upright shrubs and their tiny planting pits mark the avenues.
  for(const a of [-.840,.840])for(let j=0;j<8;j++){
    const dz=-.382+j*.116;
    put('potteryDark','cylinder',x+a,y0+.104,z+dz,.012,.055,.012);
    put('modelHedge','sphere',x+a,y0+.177,z+dz,.043,.070,.041);
  }
  for(const b of [-.495,.582])for(const a of [-.989,.989]){
    put('gold','cylinder',x+a,y0+.049,z+b,.012,.004,.012);
  }
  // A visual scale, edged in copper, on the visitor's side of the tray.
  const Q=(u,v)=>[x+u,y0+.003,z-.556+v];
  k.quad('binding',Q(-.91,.033),Q(-.51,.033),Q(-.51,-.033),Q(-.91,-.033),.32);
  for(let i=0;i<10;i++)box(i%2?'modelTrim':'ebony',x-.891+i*.037,x-.855+i*.037,y0+.004,y0+.010,z-.569,z-.544);
}
