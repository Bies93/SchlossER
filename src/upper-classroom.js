import {randomSource,sharedSet} from './surface-detail.js';

export function classroomMaterials(T){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;
  const c=canvas.getContext('2d'),rng=randomSource(92147);
  for(let i=0;i<4;i++){
    c.save();c.translate(i%2*768,Math.floor(i/2)*512);
    c.beginPath();c.rect(0,0,768,512);c.clip();
    const slate=i===0;
    c.fillStyle=slate?'#243b37':i===1?'#d5c7a7':'#c7b99b';c.fillRect(0,0,768,512);
    for(let j=0;j<(slate?910:500);j++){
      c.fillStyle=slate?(j%3?'#baccab12':'#080e1028'):(j%3?'#614d3829':'#fff0c430');
      c.fillRect(rng()*766,rng()*510,1+rng()*(slate?95:5),1+rng()*(slate?11:4));
    }
    const ink=slate?'#e0e3c8':'#423930';
    const text=(label,x,y,size,font='monospace',color=ink,max=706)=>{
      c.font=size+'px '+font;c.fillStyle=color;c.fillText(label,x,y,max);
    };
    const line=(x,y,X,Y,color=ink,w=2)=>{
      c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();
    };
    if(slate){
      text('LEKTION 04: ZUSTIMMUNG',42,85,52,'Georgia');
      line(42,111,727,114,'#cfd7b6',3);
      text('I.   Den Satz vollständig wiederholen.',47,167,26);
      text('II.  Der Satz war Ihre eigene Idee.',47,216,26);
      text('III. Beides gleichzeitig bestätigen.',47,266,26);
      c.strokeStyle='#d6c1a1';c.lineWidth=2;c.strokeRect(54,316,622,102);
      text('MÜNDLICHE ÜBUNG  //  ALLE GLEICHZEITIG',71,357,23);
      text('Gegenprobe: Niemand hat etwas gehört.',71,392,21,'Georgia','#dbc6a5');
      text('Bitte sitzen bleiben, bis die richtige Antwort vorliegt.',45,466,23,'Georgia','#f0d594');
    }else if(i===1){
      c.strokeStyle='#5a6050';c.lineWidth=4;c.strokeRect(21,22,726,468);
      text('UNTERRICHTSMITTEL',46,88,51,'Georgia');text('AUSGABE 02 — RÜCKGABE NACH DEM EID',48,134,24);
      for(let j=0;j<3;j++){
        c.fillStyle=['#455747','#6a4433','#526267'][j];c.fillRect(49+j*230,185,196,151);
        text(['TAFEL','BAND','HEFT'][j],68+j*230,232,32,'Georgia','#ede2be');
        text(['WISCHEN','ZURÜCKSPULEN','ABZEICHNEN'][j],66+j*230,293,18,'monospace','#ede2be',165);
      }
      line(48,374,721,374);
      text('Leider keine Exemplare zur freien Meinungsbildung.',49,422,24);
      text('Ausgabe nur gegen Namensmarke.',49,456,22);
    }else if(i===2){
      for(const x of [22,406]){
        c.strokeStyle='#8a6d50';c.strokeRect(x,30,336,447);
        text('LEHRBUCH 02',x+20,78,30,'Georgia');
        text(x===22?'WIEDERHOLUNG':'ABWEICHUNGEN',x+20,120,25);
        for(let j=0;j<11;j++)line(x+21,153+j*24,x+309-(j%4)*16,153+j*24,'#887557',1.4);
        text(x===22?'KÜRZEL / AZ':'NICHT VORLESEN',x+21,443,21,'monospace','#843e3b');
      }
      c.fillStyle='#74614855';c.fillRect(368,8,30,496);
    }else{
      c.strokeStyle='#745a42';c.lineWidth=5;c.strokeRect(35,40,698,432);
      text('REFERAT  MORGENFORM',77,145,43,'Georgia');
      line(75,179,692,179);
      text('LEHRPULT',78,298,97,'Georgia');
      text('RAUM 02  /  INVENTAR 041',81,385,38);
    }
    c.restore();
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  const wood=sharedSet(T,'fineOak',256),metal=sharedSet(T,'cutMetal',256);
  return {
    classInk:new T.MeshStandardMaterial({map,roughness:.91}),
    classOak:new T.MeshStandardMaterial({color:0x896b50,...wood,roughness:.72,normalScale:new T.Vector2(.70,.70)}),
    classEdge:new T.MeshStandardMaterial({color:0xb49060,...wood,roughness:.68}),
    classIron:new T.MeshStandardMaterial({color:0x55544c,...metal,metalness:.38,roughness:.70})
  };
}

export function dressClassroom(k,{edge,rear,xyz,box,shape,tube,plate,poster,table,foot,platform,bulb}){
  const pi=Math.PI;
  function sheet(tile,a,b,c,d){
    const u=(tile%2)*.5+.004,v=(1-Math.floor(tile/2))*.5+.005,U=u+.491,V=v+.490;
    k.triangle('classInk',a,b,c,[u,v,U,v,U,V]);k.triangle('classInk',a,c,d,[u,v,U,V,u,V]);
  }
  function wallSheet(tile,x,y,d,w,h){
    sheet(tile,xyz(x-w/2,y-h/2,d),xyz(x+w/2,y-h/2,d),xyz(x+w/2,y+h/2,d),xyz(x-w/2,y+h/2,d));
  }
  // Stage and threshold may be stepped onto: the floor support and its
  // visual plank tops share the same height.
  const stage=.151,L=-2.84,R=2.57,A=5.52,B=6.963;
  box('char',(L+R)/2,.062,(A+B)/2,R-L,.124,B-A);
  for(let j=0;j<9;j++){
    const a=A+j*(B-A)/9,b=A+(j+1)*(B-A)/9;
    box(j%3?'classOak':'boards',(L+R)/2,(stage+.124)/2,(a+b-.003)/2,R-L,stage-.124,b-a-.003);
  }
  box('classEdge',(L+R)/2,.118,A-.013,R-L+.014,.055,.034);
  box('copper',(L+R)/2,.101,A-.033,R-L-.048,.011,.007);
  for(let x=L+.19;x<R-.11;x+=.46)shape('classIron','round',x,.120,A-.032,.011,.008,.011,pi/2);
  platform(L,R,A,B,stage);

  // Main slate sits entirely on the shallower rear wall. Hangers and chalk
  // tray are separate from the printable front.
  const bd=rear(1.66)-.106,by=2.50,bx=1.60,bw=2.64,bh=1.42;
  box('classOak',bx,by,bd,bw+.16,bh+.15,.093);
  box('coal',bx,by,bd-.055,bw+.037,bh+.040,.031);
  wallSheet(0,bx,by,bd-.072,bw,bh);
  for(const x of [bx-bw*.48,bx+bw*.48]){
    box('classIron',x,by+bh*.5+.089,bd-.017,.065,.181,.075);
    for(const y of [by+bh*.5+.14,by-bh*.5-.02])shape('copper','round',x,y,bd-.074,.011,.010,.011,pi/2);
  }
  const trayY=by-bh/2-.080;
  box('classEdge',bx,trayY,bd-.126,bw+.04,.044,.192);
  box('classIron',bx,trayY+.018,bd-.213,bw+.027,.034,.026);
  for(let j=0;j<4;j++)tube(j===1?'amber':'ivory',[.77+j*.111,trayY+.032,bd-.148],[.84+j*.111,trayY+.032,bd-.163],.008);
  shape('felt','soft',2.390,trayY+.053,bd-.147,.151,.059,.098);
  shape('classOak','soft',2.390,trayY+.086,bd-.147,.151,.013,.098);
  // The only Tafeldienst notice. Its frame backs onto the side-wall plaster.
  poster(13,edge-.188,2.10,5.37,.64,.71,-pi/2,'notes');

  const x=-.25,d=6.17;
  for(const [m,w,h,l,base] of [['classIron',.89,.057,.68,stage],['classOak',.82,.087,.621,stage+.057],['classEdge',.87,.038,.652,stage+.144]])
    shape(m,'soft',x,base+h*.5,d,w,h,l);
  for(const s of [-1,1]){
    shape('classOak','soft',x+s*.274,.798,d,.139,1.021,.486,0,0,s*.047);
    shape('classEdge','soft',x+s*.324,.811,d-.229,.057,.969,.052,0,0,s*.047);
    for(const y of [.366,1.224])box('classIron',x+s*.317,y,d-.246,.093,.060,.028);
  }
  box('boards',x,.815,d,.496,.961,.455);
  shape('felt','soft',x,.786,d-.238,.438,.660,.023);
  for(const s of [-1,1])tube('copper',[x+s*.207,.505,d-.254],[x+s*.207,1.080,d-.254],.007);
  box('classOak',x,.933,d-.261,.353,.161,.019);
  wallSheet(3,x,.932,d-.273,.315,.131);
  for(const a of [-.159,.159])shape('copper','round',x+a,.935,d-.275,.009,.004,.009,pi/2);
  const U=(a,y,b)=>xyz(x+a,1.421+y+.252*b,d-b);
  for(const s of [-1,1])k.box('classIron',U,s*.264-.057,s*.264+.057,-.217,-.078,-.225,.221);
  k.box('classOak',U,-.437,.437,-.087,0,-.318,.318);
  k.box('classEdge',U,-.453,.453,-.052,-.012,-.329,.331);
  k.box('classEdge',U,-.409,.409,0,.028,-.310,-.283);
  k.box('felt',U,-.273,.293,.001,.009,-.245,.225);
  k.box('boards',U,-.278,.201,.009,.016,-.194,.200);
  k.box('paper',U,-.269,.192,.016,.030,-.186,.192);
  sheet(2,U(-.264,.031,.186),U(.185,.031,.186),U(.185,.031,-.180),U(-.264,.031,-.180));
  for(const b of [-.158,-.069,.029,.117])k.box('copper',U,-.047,-.039,.032,.036,b-.017,b+.016);
  tube('classIron',[x+.262,1.435,d+.10],[x+.281,1.463,d-.081],.009);
  shape('classIron','cone',x+.373,1.515,d-.20,.045,.103,.045);
  for(const a of [-.017,.020])tube('amber',[x+.373+a,1.525,d-.20],[x+.371+a*.74,1.620,d-.213-a],.006);
  foot(x,d,.86,.66);

  // The deep part of the room is a real teaching-supply nook, not a
  // freestanding panel that happens to hide an empty corner.
  const nx=-2.40,D=rear(nx)-.35;
  box('classIron',nx,.071,D,1.87,.141,.543);
  for(const a of [-.912,.912])box('classOak',nx+a,1.120,D,.082,1.963,.546);
  box('boards',nx,1.108,D+.242,1.75,1.92,.054);
  const colours=['green','navy','boards','red','ivory'];
  for(const [j,y] of [.222,.693,1.129,1.580,2.099].entries()){
    box('classOak',nx,y,D,1.88,.067,.577);
    box('classEdge',nx,y+.008,D-.286,1.87,.036,.027);
    if(j===4)break;
    for(let n=0;n<4;n++){
      const sx=nx-.67+n*.423+(j%2)*.028,h=.235+((n+j)%3)*.048,k=j*4+n;
      if(k===2||k===7)continue;
      const depth=.272+n%2*.045, front=D-depth/2;
      box(colours[(j+n)%colours.length],sx,y+.034+h*.5,D,.310,h,depth);
      box('paper',sx,y+h*.47+.034,front-.003,.151,.060,.006);
      box('classIron',sx,y+h*.65+.027,front-.014,.070,.015,.016);
      for(const pin of [-.105,.105])shape('copper','round',sx+pin,y+.082,front-.007,.009,.010,.009,pi/2);
      if(k%3===0)plate(13,sx,y+.034+h-.001,front-.009,.16,.077);
    }
  }
  foot(nx,D,1.89,.60);
  const dx=-.99,dd=rear(dx)-.121;
  box('classOak',dx,2.76,dd,1.33,.99,.066);
  wallSheet(1,dx,2.76,dd-.035,1.27,.935);
  for(const a of [-.616,.616])for(const y of [2.311,3.21])shape('copper','round',dx+a,y,dd-.039,.011,.008,.011,pi/2);
  poster(5,-2.58,3.02,rear(-2.58)-.144,1.04,1.30);
  bulb(-1.67,3.41,8.14,'moss');
  for(const [j,D] of [2.4,3.78].entries())for(const [i,u] of [-2.08,.67,2.22].entries()){
    table(u,D,.88,.58,.79,'classOak');
    box('felt',u+.013,.795,D-.026,.66,.008,.423);
    const a=u+.055-.072*(i%2);
    box('paper',a,.808,D+.030,.291,.016,.256);
    plate(13,a,.817,D+.032,.268,.233,-.115+j*.063,-pi*.5);
    tube('classEdge',[u-.229,.809,D-.107],[u-.197,.812,D+.043],.0065);
    if((i+j)%2===0){
      shape('classIron','round',u+.285,.830,D+.151,.042,.075,.042);
      shape('ivory','round',u+.285,.879,D+.151,.024,.025,.024);
    }else{
      shape('navy','soft',u+.277,.825,D+.147,.137,.069,.10);
      box('copper',u+.278,.826,D+.096,.065,.019,.008);
    }
    const s=D-.61;
    shape('green','soft',u,.455,s,.466,.087,.449);
    shape('boards','soft',u,.393,s,.482,.055,.461);
    shape('classOak','soft',u,.652,s-.215,.458,.243,.064,.12);
    shape('felt','soft',u,.649,s-.175,.353,.183,.021,.12);
    for(const a of [-1,1]){
      for(const b of [-1,1]){
        tube('classIron',[u+a*.195,.043,s+b*.195],[u+a*.178,.384,s+b*.175],.023);
        shape('rubber','round',u+a*.195,.019,s+b*.195,.032,.028,.032);
      }
      tube('classIron',[u+a*.167,.367,s-.173],[u+a*.182,.737,s-.238],.022);
      shape('copper','round',u+a*.180,.679,s-.171,.012,.009,.012,pi/2);
    }
    foot(u,s,.48,.48);
  }
}
