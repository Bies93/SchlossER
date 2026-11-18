import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Three original, purely decorative hard-surface silhouettes.
export const EQUIPMENT=[
  {label:'Kestrel · Impulspistole',color:0x6fe2e6,case:0x4c5c62,
    sight:[0,.074,-.191],emit:[0,.009,-.244],grip:[.034,-.121,.016],support:[-.047,-.082,-.081],
    hold:[.229,-.220,-.61],yaw:.14,flash:.024,pattern:1},
  {label:'Vesper · Impulsgewehr',color:0x8baeff,case:0x7d9290,
    sight:[0,.124,-.132],emit:[0,.024,-.697],grip:[.036,-.124,.023],support:[-.047,-.092,-.349],
    hold:[.239,-.216,-.53],yaw:.228,flash:.033,pattern:1},
  {label:'Amber · Streuflinte',color:0xffb266,case:0x754d39,
    sight:[0,.091,-.619],emit:[0,.033,-.682],grip:[.036,-.137,.028],support:[-.063,-.094,-.332],
    hold:[.253,-.244,-.55],yaw:.241,flash:.042,pattern:5}
];

export function egoAssets(T){
  const V=(x,y,z)=>new T.Vector3(x,y,z),axis=V(0,1,0);
  const m=(color,roughness=.70,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const edge=m(0x58626a,.39,.53),dark=m(0x272f33,.73,.19),rubber=m(0x242827,.92,.02),
    brass=m(0xb08856,.45,.57),seam=m(0x1b2124,.86),steel=m(0x929ca5,.40,.63);
  const leaf=m(0x576368,.87),skin=m(0xa7816a,.71),skinSide=m(0xb68f76,.74),nail=m(0xb99580,.70),
    glove=m(0x3d4547,.89),gloveRaised=m(0x505d5c,.84),thread=m(0x697472,.97);
  const sleeve=m(0x47545a,.94),cuff=m(0x343d42,.88),pant=m(0x485057,.95),
    knee=m(0x3a4449,.88),boot=m(0x373a36,.78),sole=m(0x252828,.90);
  const shell=new RoundedBoxGeometry(1,1,1,2,.12),bevel=new RoundedBoxGeometry(1,1,1,1,.08),
    sphere=new T.SphereGeometry(.5,10,7),cyl=new T.CylinderGeometry(.5,.5,1,14),
    cap=new T.CapsuleGeometry(.5,1,5,10);
  const q=new T.Quaternion(),E=(x,y,z)=>new T.Euler(x,y,z);
  function assembly(name){
    const bins=new Map(),root=new T.Group();root.name=name;
    function add(source,mat,p,s,q){
      const g=source.index?source.toNonIndexed():source.clone();g.clearGroups();
      g.applyMatrix4(new T.Matrix4().compose(p,q,s));
      if(!bins.has(mat))bins.set(mat,[]);bins.get(mat).push(g);
    }
    const shape=(geo,mat,p,s,rot=[0,0,0])=>add(geo,mat,V(...p),V(...s),q.setFromEuler(E(...rot)));
    function link(geo,mat,a,b,w,d=w){
      const A=V(...a),B=V(...b),D=B.clone().sub(A),length=D.length();
      add(geo,mat,A.lerp(B,.5),V(w,geo===cap?length*.5:length,d),q.setFromUnitVectors(axis,D.normalize()));
    }
    function build(){
      for(const [mat,list] of bins){
        const g=mergeGeometries(list);const mesh=new T.Mesh(g,mat);
        mesh.receiveShadow=false;mesh.castShadow=false;root.add(mesh);list.forEach(g=>g.dispose());
      }
      return root;
    }
    return {shape,link,build};
  }
  const devices=EQUIPMENT.map((s,i)=>{
    const A=assembly(s.label),o=A.shape;
    const coat=m(s.case,.54,i===2?.02:.28), warm=m(0x92614b,.66,.025);
    const light=new T.MeshBasicMaterial({color:s.color}),
      glass=new T.MeshPhysicalMaterial({color:s.color,roughness:.18,metalness:.18,emissive:s.color,emissiveIntensity:.11});
    const box=(M,p,S,r)=>o(shell,M,p,S,r);
    const disk=(M,p,S)=>o(cyl,M,p,S,[Math.PI/2,0,0]);
    const L=-s.emit[2],hand=i===2?.147:.133;
    box(rubber,[0,-.103,.018],[.064,hand,.086],[-.22,0,0]);
    box(edge,[0,-.160,.051],[.073,.022,.090],[-.22,0,0]);
    for(const side of [-1,1]){
      box(dark,[side*.031,-.100,.026],[.012,.103,.064],[-.26,0,0]);
      for(let j=0;j<5;j++)box(leaf,[side*.036,-.062-j*.015,.019+j*.004],[.006,.007,.039],[-.22,0,-.10*side]);
    }
    if(i===0){
      box(coat,[0,.006,-.072],[.094,.091,.246],[-.046,0,0]);
      box(edge,[0,.037,-.102],[.086,.037,.227]);
      box(dark,[0,-.029,-.131],[.080,.045,.168],[-.07,0,0]);
      disk(dark,[0,.008,-L+.022],[.074,.028,.067]);
      disk(glass,[0,.008,-L+.004],[.059,.013,.051]);
      disk(light,[0,.008,-L-.005],[.035,.005,.025]);
      for(const side of [-1,1]){
        box(brass,[side*.046,-.007,-.122],[.011,.017,.100],[.14,0,0]);
        box(dark,[side*.051,.033,-.062],[.008,.025,.061]);
        for(let j=0;j<5;j++)box(steel,[side*.053,.035,-.041-j*.010],[.006,.014,.003]);
      }
      box(dark,[0,.059,.030],[.059,.014,.034]);
      for(const side of [-1,1])box(edge,[side*.022,.071,.030],[.013,.023,.028]);
      box(edge,[0,.061,s.sight[2]],[.022,.016,.032]);
      box(light,s.sight,[.010,.010,.017]);
    }else if(i===1){
      // The rifle silhouette is built around a long cage, a compact
      // optical ring and an open stock, with an opaque fictional emitter.
      box(dark,[0,.002,-.113],[.079,.115,.266]);
      box(coat,[0,.022,-.213],[.094,.087,.274]);
      box(edge,[0,.071,-.173],[.062,.026,.248]);
      box(dark,[0,.006,-.388],[.056,.091,.298]);
      box(steel,[0,.024,-.556],[.052,.048,.276]);
      box(coat,[0,-.031,-.363],[.087,.046,.219]);
      box(dark,[0,-.099,-.139],[.061,.129,.136],[-.30,0,0]);
      box(coat,[0,-.107,-.158],[.067,.054,.113],[-.30,0,0]);
      box(edge,[0,.012,.117],[.055,.064,.209]);
      A.link(shell,coat,[0,.038,.071],[0,.030,.252],.062,.050);
      A.link(shell,edge,[0,-.014,.106],[0,-.091,.254],.047,.044);
      box(rubber,[0,-.038,.270],[.075,.141,.041],[-.08,0,0]);
      for(const side of [-1,1]){
        box(edge,[side*.041,.015,-.399],[.025,.028,.258]);
        for(let j=0;j<7;j++)box(coat,[side*.046,-.001,-.285-j*.036],[.017,.036,.015]);
        box(glass,[side*.046,.031,-.184],[.008,.019,.058]);
        box(light,[side*.051,.033,-.188],[.006,.006,.032]);
      }
      disk(dark,[0,.024,-L+.037],[.087,.090,.075]);
      disk(glass,[0,.024,-L+.006],[.063,.016,.049]);
      box(coat,[0,.089,-.135],[.056,.037,.070]);
      const optics=new T.TorusGeometry(.031,.008,7,16);
      o(optics,dark,[0,s.sight[1],s.sight[2]],[1,1,.92]);optics.dispose();
      o(sphere,light,s.sight,[.008,.008,.010]);
    }else{
      // Wider double emitter, ribbed walnut fore-end and solid swept stock.
      box(dark,[0,.010,-.110],[.116,.108,.225]);
      box(edge,[0,.036,-.137],[.113,.074,.236]);
      box(coat,[0,-.036,.156],[.101,.124,.280],[.24,0,0]);
      box(warm,[0,-.074,.246],[.112,.148,.110],[.28,0,0]);
      box(rubber,[0,-.080,.309],[.119,.157,.028],[.20,0,0]);
      box(coat,[0,-.036,-.353],[.145,.094,.240],[-.015,0,0]);
      for(let j=0;j<8;j++)box(warm,[0,-.040,-.261-j*.026],[.147,.097,.013]);
      for(const side of [-1,1]){
        disk(dark,[side*.038,.032,-.423],[.063,.472,.066]);
        disk(edge,[side*.039,.032,-L+.04],[.071,.060,.071]);
        disk(glass,[side*.039,.032,-L+.006],[.052,.014,.052]);
        disk(light,[side*.039,.032,-L-.004],[.034,.005,.034]);
        box(brass,[side*.059,.028,-.112],[.009,.055,.067]);
        box(dark,[side*.065,.028,-.113],[.006,.027,.040]);
      }
      box(edge,[0,.065,-.521],[.027,.016,.277]);
      box(brass,[0,.076,s.sight[2]],[.027,.020,.028]);
      o(sphere,light,s.sight,[.011,.011,.012]);
    }
    return A.build();
  });

  const hands=[-1,1].map(side=>{
    const A=assembly(side===1?'Rechter Fingerhandschuh':'Linker Fingerhandschuh'),o=A.shape;
    o(shell,glove,[0,0,.000],[.076,.060,.094],[.21,0,-side*.12]);
    o(bevel,gloveRaised,[side*.001,.026,-.009],[.055,.015,.057],[.18,-side*.13,0]);
    o(shell,cuff,[0,-.004,.048],[.073,.060,.040],[.13,0,0]);
    o(bevel,thread,[0,.025,.051],[.061,.007,.013],[.14,0,0]);
    o(bevel,seam,[side*.025,.030,-.005],[.004,.005,.035],[.10,0,-side*.11]);
    for(let i=0;i<4;i++){
      const x=side*(.030-i*.018),length=[.053,.062,.057,.044][i],
        a=[x,.012,-.031],b=[x+side*.003,.015,-.031-length*.44],
        c=[x-side*.004,-.010,-.038-length*.72],d=[x-side*.006,-.023,-.048-length*.63];
      A.link(cap,gloveRaised,a,b,i===0?.018:.017,.020);
      A.link(cap,skin,b,c,.017,.016);
      A.link(cap,skinSide,c,d,.014,.014);
      o(sphere,skin,d,[.013,.013,.016]);
      o(bevel,nail,[d[0],d[1]-.003,d[2]-.005],[.008,.009,.003],[.43,0,0]);
    }
    const a=[side*.031,-.005,.014],b=[side*.050,-.013,-.001],c=[side*.051,-.017,-.027],d=[side*.041,-.021,-.041];
    A.link(cap,glove,a,b,.027,.021);A.link(cap,skin,b,c,.024,.021);A.link(cap,skinSide,c,d,.020,.018);
    return A.build();
  });

  const boots=[-1,1].map(side=>{
    const A=assembly('Wanderstiefel'),o=A.shape;
    o(shell,sole,[0,.024,-.054],[.147,.043,.291]);
    o(shell,boot,[0,.065,-.093],[.144,.067,.217],[-.03,0,0]);
    o(shell,leaf,[0,.085,.012],[.126,.134,.151],[-.14,0,0]);
    o(bevel,knee,[0,.074,-.172],[.135,.032,.059]);
    for(let j=0;j<4;j++){
      const z=-.049-j*.021,y=.110-j*.003;
      A.link(cyl,thread,[-.032,y,z],[.032,y-.003,z-.012],.0045);
      o(sphere,edge,[-.035,y,z],[.011,.009,.011]);o(sphere,edge,[.036,y,z-.012],[.011,.009,.011]);
    }
    for(let j=0;j<6;j++)o(bevel,boot,[side*.070,.029,.058-j*.041],[.011,.019,.018]);
    return A.build();
  });
  return {devices,hands,boots,materials:{edge,frame:dark,sleeve,cuff,pant,knee},geometry:{shell,cap}};
}
