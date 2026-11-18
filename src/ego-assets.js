import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeEquipment} from './ego-gear.js';

// Three original, purely decorative hard-surface silhouettes.
export const EQUIPMENT=[
  {label:'Kestrel · Impulspistole',color:0x6fe2e6,
    sight:[0,.074,-.191],emit:[0,.009,-.244],grip:[.034,-.121,.016],support:[-.047,-.082,-.081],
    hold:[.229,-.220,-.61],yaw:.235,flash:.024,pattern:1,impact:36},
  {label:'Vesper · Impulsgewehr',color:0x8baeff,
    sight:[0,.124,-.132],emit:[0,.024,-.697],grip:[.036,-.124,.023],support:[-.047,-.092,-.349],
    hold:[.239,-.216,-.53],yaw:.276,flash:.033,pattern:1,impact:54},
  {label:'Amber · Streuflinte',color:0xffb266,
    sight:[0,.091,-.619],emit:[0,.033,-.682],grip:[.036,-.137,.028],support:[-.063,-.094,-.332],
    hold:[.253,-.244,-.55],yaw:.289,flash:.042,pattern:5,impact:25}
];

export function egoAssets(T){
  const V=(x,y,z)=>new T.Vector3(x,y,z),axis=V(0,1,0);
  const m=(color,roughness=.70,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const edge=m(0x58626a,.39,.53),dark=m(0x272f33,.73,.19),seam=m(0x1b2124,.86);
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
  const devices=makeEquipment(T,EQUIPMENT);

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
