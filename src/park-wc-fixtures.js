const pi=Math.PI;

// One ceramic mould, including the lip and the hollow. Section depth is
// greater at the foot of the bowl; the upper back runs close to the wall.
function urinalMould(T){
  const N=36,sections=[
    [.83,.921,.026,.018],[.97,.932,.086,.107],[1,.938,.128,.204],
    [.963,.938,.139,.211],[.874,.940,.132,.196],
    [.751,.918,.070,.162],[.43,.841,.084,.126],[.155,.761,.129,.100],[.017,.741,.207,.009]
  ];
  function build(first,last){
    const v=[],uv=[],index=[];
    for(let j=first;j<=last;j++){
      const [radius,center,back,lip]=sections[j];
      for(let i=0;i<=N;i++){
        const a=i/N*pi*2,s=Math.sin(a),c=Math.cos(a),low=(1-s)*.5;
        const width=.190*(1-.22*Math.max(0,-s))*(1-.14*Math.max(0,s-.51));
        v.push(-(back+lip*low**1.42),center+s*.291*radius,c*width*radius);uv.push(i/N,j/(sections.length-1));
        if(j>first&&i<N){
          const b=(j-first-1)*(N+1)+i,d=b+N+1;
          index.push(b,b+1,d+1,b,d+1,d);
        }
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
  }
  return [build(0,4),build(4,8)];
}
export function furnishWashroom(T,{block,hit,stamp,pipe,print},id){
  const bead=new T.SphereGeometry(1,16,9),tube=new T.CylinderGeometry(1,1,1,16);
  const bowl=new T.LatheGeometry([[0,0],[.64,.008],[.79,.09],[.97,.44],[1,.57],[.97,.64],
    [.85,.64],[.83,.53],[.65,.235],[.39,.143],[0,.135]].map(([r,y])=>new T.Vector2(r,y)),24);
  const ring=new T.TorusGeometry(1,.10,8,26).rotateX(pi/2);
  const fixture=(mat,g,u,y,v,dx,dy,dz)=>stamp(mat,g,u,y,v,[dx,dy,dz]);
  function toilet(u,v){
    fixture('china',tube,u+.08,.150,v,.17,.298,.196);
    fixture('china',bowl,u,.232,v,.262,.388,.332);
    fixture('grout',ring,u,.486,v,.251,.094,.320);
    fixture('china',ring,u,.507,v,.252,.099,.321);
    fixture('water',bead,u+.027,.290,v,.122,.015,.161);
    fixture('china',bead,u+.217,.321,v,.251,.132,.095);
    block('china',u+.295,u+.495,.315,.748,v-.228,v+.228);
    block('china',u+.279,u+.512,.742,.784,v-.234,v+.234);
    fixture('steel',tube,u+.410,.792,v,.064,.017,.064);
    fixture('brass',tube,u+.410,.802,v,.024,.010,.024);
    for(const d of [-.140,.140])block('steel',u+.148,u+.221,.494,.536,v+d-.025,v+d+.025);
    pipe('steel',[u+.476,.58,v+.193],[u+.476,.769,v+.308],.018);
    hit(u-.329,u+.505,v-.273,v+.273);
    // Paper holder and folded paper roll, separate from the ceramic.
    const side=v<5.55?1:-1,uu=u-.24,zz=v+side*.357;
    if(id==='menB'){
      block('steel',uu-.092,uu+.092,.626,.745,5.552,5.573);
      for(const s of [-1,1])pipe('steel',[uu+s*.072,.678,5.567],[uu+s*.072,.678,5.637],.009);
      pipe('steel',[uu-.075,.678,5.637],[uu+.075,.678,5.637],.017);
      pipe('paper',[uu-.063,.678,5.637],[uu+.063,.678,5.637],.050);
    }else{
      block('steel',uu-.018,uu+.021,.625,.749,zz-.099,zz+.098);
      pipe('steel',[uu,.665,zz-.074],[uu,.665,zz+.077],.017);
      pipe('paper',[uu-.012,.665,zz-.064],[uu-.012,.665,zz+.064],.061);
    }
  }
  function sink(u,v,away){
    const center=v+away*.348;
    block('trim',u-.305,u+.305,.683,.825,Math.min(v+away*.026,center),Math.max(v+away*.026,center));
    fixture('china',bowl,u,.696,center,.251,.266,.284);
    fixture('grout',bead,u,.738,center,.041,.010,.043);
    fixture('steel',tube,u,.743,center,.027,.010,.028);
    pipe('steel',[u,.690,center],[u,.449,center],.030);
    pipe('steel',[u,.451,center],[u,.451,v+away*.047],.031);
    const tap= v+away*.162;
    pipe('steel',[u,.802,tap],[u,.976,tap],.018);
    pipe('steel',[u,.976,tap],[u,.962,center],.018);
    pipe('steel',[u,.963,center],[u,.929,center],.015);
    block('steel',u+.014,u+.113,.880,.903,tap-.015,tap+.014);
    const [a,c]=[v+away*.012,v+away*.030].sort((a,b)=>a-b),[g,h]=[v+away*.033,v+away*.041].sort((a,b)=>a-b);
    block('gunmetal',u-.31,u+.31,1.173,1.987,a,c);
    block('glass',u-.285,u+.285,1.198,1.957,g,h);
    for(const q of [-.262,.262])block('steel',u+q-.025,u+q+.025,1.193,1.231,g-.005,h+.005);
    hit(u-.305,u+.305,Math.min(v,v+away*.61),Math.max(v,v+away*.61));
  }
  function urinal(u,mould){
    const v=3.803;
    block('china',u-.116,u+.116,.781,1.141,v+.004,v+.039);
    stamp('china',mould[0],u,0,v,[1,1,1]);
    stamp('chinaPocket',mould[1],u,0,v,[1,1,1]);
    fixture('steel',tube,u,.746,v+.212,.028,.011,.029);
    for(const [a,d] of [[0,0],[.010,.009],[-.010,.009],[.010,-.009],[-.010,-.009]])
      fixture('dark',tube,u+a,.752,v+.212+d,.0028,.003,.0028);
    pipe('steel',[u,1.21,v+.082],[u,1.356,v+.082],.020);
    pipe('steel',[u,1.356,v+.082],[u,1.356,v+.012],.020);
    fixture('steel',tube,u,1.271,v+.081,.036,.066,.036);
    pipe('steel',[u,.669,v+.190],[u,.568,v+.179],.022);
    pipe('steel',[u,.568,v+.179],[u,.568,v+.018],.022);
    hit(u-.206,u+.206,v,v+.354);
  }
  if(id==='women'||id==='men'){
    const male=id==='men',wall=male?7.42:.405,dir=male?-1:1;
    for(const u of [4.78,5.66])sink(u,wall,dir);
    // Closed soap dispenser and a bin; the common lobby stays empty.
    const va=wall+dir*.055,vb=wall+dir*.166;
    block('gunmetal',5.136,5.291,1.005,1.30,Math.min(va,vb),Math.max(va,vb));
    block('iron',5.193,5.236,1.017,1.056,Math.min(va,vb)-.004,Math.max(va,vb)+.004);
    const z=wall+dir*.204;
    fixture('iron',tube,6.57,.225,z,.169,.441,.169);
    fixture('steel',tube,6.57,.457,z,.174,.033,.174);
    fixture('grout',tube,6.57,.478,z,.113,.011,.115);
    hit(6.392,6.75,z-.182,z+.182);
    if(male){
      const mould=urinalMould(T);
      for(const u of [4.91,5.82,6.74])urinal(u,mould);
      mould.forEach(g=>g.dispose());
      for(const u of [5.359,6.274])block('sea',u-.017,u+.017,.454,1.542,3.831,4.27);
    }
  }else{
    const v={womenA:1.19,womenB:2.92,menA:4.78,menB:5.86}[id];
    toilet(id==='menB'?8.45:8.566,v);
    if(id==='menB'){
      block('gunmetal',8.92,9.05,-.008,.008,6.28,7.39);
      // Far enough from the jamb to stay entirely on the tiled wall.
      block('tunnelMetal',9.074,9.102,1.263,1.515,5.872,6.139);
      print('arrow',9.071,1.39,6.007,.243,.222,Math.PI);
      for(const d of [5.889,6.122])block('steel',9.066,9.074,1.378,1.397,d-.008,d+.008);
    }
  }
  bead.dispose();tube.dispose();bowl.dispose();ring.dispose();
}
