import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Three original, purely decorative hard-surface silhouettes.
export const EQUIPMENT=[
  {label:'Kestrel',color:0x6fe2e6,case:0x465958,sight:.075,length:.256,grip:[.032,-.131,.018],support:[-.052,-.076,-.105]},
  {label:'Amber',color:0xffb266,case:0xd6b48a,sight:.085,length:.300,grip:[.035,-.137,.014],support:[-.070,-.078,-.127]},
  {label:'Vesper',color:0xc4b3ff,case:0x555778,sight:.094,length:.347,grip:[.036,-.128,.016],support:[-.059,-.079,-.148]}
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
    oct=new T.CylinderGeometry(.5,.5,1,8),cap=new T.CapsuleGeometry(.5,1,5,10);
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
    const A=assembly('Impulsgerät · '+s.label),o=A.shape;
    const coat=m(s.case,.54,.20);
    const light=new T.MeshBasicMaterial({color:s.color}),
      glass=new T.MeshPhysicalMaterial({color:s.color,roughness:.18,metalness:.18,emissive:s.color,emissiveIntensity:.11});
    const box=(M,p,S,r)=>o(shell,M,p,S,r);
    const disk=(M,p,S)=>o(cyl,M,p,S,[Math.PI/2,0,0]);
    const L=s.length;
    box(rubber,[0,-.105,.018],[.064,.146,.091],[-.26,0,0]);
    box(edge,[0,-.174,.050],[.075,.025,.096],[-.26,0,0]);
    for(const side of [-1,1]){
      box(dark,[side*.031,-.100,.026],[.012,.103,.064],[-.26,0,0]);
      for(let j=0;j<5;j++)box(leaf,[side*.036,-.062-j*.015,.019+j*.004],[.006,.007,.039],[-.22,0,-.10*side]);
    }
    if(i===0){
      box(coat,[0,.002,-.049],[.091,.099,.190],[-.071,0,0]);
      box(edge,[0,.034,-.081],[.084,.040,.205]);
      box(dark,[0,-.032,-.131],[.080,.046,.196],[-.023,0,0]);
      disk(dark,[0,.008,-L+.022],[.074,.028,.067]);
      disk(glass,[0,.008,-L+.004],[.059,.013,.051]);
      disk(light,[0,.008,-L-.005],[.035,.005,.025]);
      for(const side of [-1,1]){
        box(brass,[side*.046,-.007,-.099],[.011,.017,.102],[.14,0,0]);
        box(dark,[side*.051,.033,-.062],[.008,.025,.061]);
        for(let j=0;j<4;j++)box(steel,[side*.054,.035,-.044-j*.012],[.006,.014,.003]);
      }
    }else if(i===1){
      box(coat,[0,.020,-.083],[.105,.102,.236]);
      box(dark,[0,-.030,-.145],[.093,.055,.253]);
      for(const side of [-1,1]){
        box(brass,[side*.051,.000,-.142],[.043,.077,.183],[-.03,-side*.025,0]);
        box(steel,[side*.064,.030,-.138],[.025,.039,.165]);
        box(dark,[side*.070,.004,-.141],[.015,.026,.131]);
        box(light,[side*.077,.006,-.146],[.006,.007,.066]);
        o(oct,brass,[side*.039,.004,-L+.008],[.066,.049,.065],[1.5708,0,0]);
        disk(glass,[side*.039,.004,-L-.021],[.045,.011,.044]);
      }
      box(edge,[0,.063,-.039],[.072,.021,.086]);
    }else{
      box(coat,[0,.024,-.084],[.100,.111,.213],[.09,0,0]);
      box(edge,[0,-.022,-.168],[.082,.054,.286]);
      box(dark,[0,.028,-.235],[.092,.078,.174]);
      for(const side of [-1,1]){
        box(coat,[side*.053,.012,-.201],[.023,.057,.221],[-.063,side*.031,0]);
        box(edge,[side*.049,.035,-.266],[.022,.062,.136],[0,-side*.024,0]);
        box(glass,[side*.061,.031,-.235],[.008,.019,.065]);
        for(let j=0;j<3;j++)box(light,[side*.045,.070,-.083-j*.025],[.011,.005,.009],[-.09,0,0]);
      }
      o(oct,dark,[0,.028,-L+.006],[.071,.044,.071],[1.5708,0,0]);
      disk(glass,[0,.028,-L-.019],[.058,.013,.057]);
    }
    // Distinct readable near silhouettes and colored fronts, never real
    // internals. The viewport can align the decorative locator in aim mode.
    const rearWidth=i===2?.048:.054;
    box(dark,[0,s.sight-.014,.066],[rearWidth,.020,.036]);
    for(const side of [-1,1]){
      box(edge,[side*rearWidth*.41,s.sight-.002,.067],[.012,.026,.036]);
      disk(steel,[side*.027,.024,.071],[.010,.004,.010]);
    }
    const anchor=i===0?-.020:i===1?.018:.039,rise=s.sight-anchor-.004;
    box(edge,[0,anchor+rise*.5,-L*.84],[.023,rise,.034]);
    box(light,[0,s.sight,-L*.84],[.011,.014,.022]);
    box(glass,[0,.024,.068],[.022,.014,.006]);
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
