import {architectureKit} from './architecture-kit.js';
import {repeatSet,sharedSet} from './surface-detail.js';

// Layout in model metres. Keep the established Wasserturm-side footprint.
const CENTER=-47, OFFSET=3.6;
const wing=(side,t)=>[-OFFSET-56.4+17*(1-Math.cos(1.2*t)),CENTER+side*(6+24*Math.sin(t*1.2))];
const hall=Array.from({length:4},(_,i)=>[-55.5-OFFSET,CENTER+6-i*4]);
const along=(a,b)=>b[1]-a[1]; // From west to east: frontage normals point south.
const sides=[-1,1].map(side=>Array.from({length:8},(_,i)=>wing(side,i/7)).sort(along));
const sections=[
  {points:hall,h:8.40,depth:10,rise:3.7,main:true},
  ...sides.map(points=>({points,h:6.35,depth:7.8,rise:2.15})),
  ...[-1,1].map(side=>{
    const [x,z]=wing(side,1);
    return {points:[[x+.26,z],[x+.26,z+side*7.75]].sort(along),h:7.15,depth:8.6,rise:2.7,pavilion:true};
  })
];

export function addOrangery(T,parent,world,finish){
  const g=new T.Group();g.name='Orangerie · räumliche Fassaden';parent.add(g);
  const plaster=new T.MeshStandardMaterial({...sharedSet(T,'plaster',512),color:0xe5bb79,roughness:1});
  plaster.normalScale.setScalar(.31);
  const tiles=new T.MeshStandardMaterial({...repeatSet(T,'tile',512),color:0xe0bbb0,roughness:1,side:T.DoubleSide});
  tiles.normalScale.setScalar(.58);
  const stone=finish('SANDSTONE_CUT').clone();stone.vertexColors=false;stone.color.setHex(0xe4ceb1);
  const plinth=finish('SANDSTONE_DARK').clone();plinth.vertexColors=false;
  const dark=new T.MeshStandardMaterial({color:0x191917,roughness:.93});
  const sash=new T.MeshStandardMaterial({color:0xc1b79d,roughness:.61});
  const glass=new T.MeshPhysicalMaterial({color:0x2d4144,roughness:.25,ior:1.47,envMapIntensity:.86,side:T.DoubleSide});
  const kit=architectureKit(T,g,{plaster,tiles,stone,plinth,dark,sash,glass:{material:glass,cast:false}});
  const {box,quad,triangle}=kit;
  function frame(a,b){
    const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;
    return {L,p:(u,y,d)=>[a[0]+ux*u-uz*d,y,a[1]+uz*u+ux*d]};
  }
  function bar(p,m,x,y,u,v,thick,d){
    const L=Math.hypot(u-x,v-y);
    if(L<.02)return;
    const a=(u-x)/L,b=(v-y)/L;
    const local=(s,t,e)=>p(x+a*s-b*t,y+b*s+a*t,e);
    box(m,local,0,L,-thick/2,thick/2,d-.019,d+.019);
  }
  function bay(f,h,{main=false,door=false,pale=false}={}){
    const {p,L}=f, mid=L/2,half=Math.min(L*.34,main?1.16:.95);
    const sill=door?.16:.53,spring=h*(main?.61:.62),r=half*.98, trim=main?.18:.13;
    const lo=mid-half,hi=mid+half,depth=-.31;
    box('plaster',p,0,lo,-.045,h,-.20,0);box('plaster',p,hi,L,-.045,h,-.20,0);
    box('plaster',p,lo,hi,-.045,sill,-.20,0);
    const path=Array.from({length:19},(_,i)=>{
      const a=Math.PI-(Math.PI*i/18);
      return [mid+Math.cos(a)*half,spring+Math.sin(a)*r,a];
    });
    const top=([x,y,a],d)=>p(mid+Math.cos(a)*(half+trim),spring+Math.sin(a)*(r+trim),d);
    for(let i=0;i<path.length-1;i++){
      const a=path[i],b=path[i+1];
      quad('plaster',p(a[0],a[1],0),p(b[0],b[1],0),p(b[0],h,0),p(a[0],h,0));
      quad('stone',p(a[0],a[1],.105),p(b[0],b[1],.105),top(b,.105),top(a,.105));
      quad('stone',p(a[0],a[1],depth),p(b[0],b[1],depth),p(b[0],b[1],.105),p(a[0],a[1],.105));
      triangle('glass',p(mid,spring,depth),p(b[0],b[1],depth),p(a[0],a[1],depth),[.5,0,1,1,0,1]);
    }
    for(const [a,b] of [[lo-trim,lo],[hi,hi+trim]]){
      box('stone',p,a,b,sill,spring,depth,.105);
      box('stone',p,a-.018,b+.018,spring-.055,spring+.045,-.18,.138);
    }
    if(!door)box('stone',p,lo-.125,hi+.125,sill-.092,sill,-.28,.155);
    else box('plinth',p,lo-.06,hi+.06,.015,sill,-.29,.116);
    box('dark',p,lo-.012,hi+.012,sill,spring+r+.024,depth-.21,depth-.18);
    quad('glass',p(lo,sill,depth),p(hi,sill,depth),p(hi,spring,depth),p(lo,spring,depth));
    const count=pale?2:4,step=(hi-lo)/count;
    for(let j=0;j<=count;j++){
      const x=lo+j*step,w=j===count/2?.054:.037;
      box('sash',p,x-w/2,x+w/2,sill,spring,-.314,-.256);
    }
    for(let n=1;n<4;n++){
      const y=sill+(spring-sill)*n*.25;
      box('sash',p,lo,hi,y-.017,y+.017,-.31,-.26);
    }
    box('sash',p,lo,hi,spring-.035,spring+.035,-.32,-.249);
    for(let j=1;j<=5;j++){
      const a=Math.PI*j/6;
      bar(p,'sash',mid,spring,mid+Math.cos(a)*half,spring+Math.sin(a)*r,.038,-.27);
    }
    if(door){
      for(const [l,r] of [[lo+.035,mid-.029],[mid+.029,hi-.035]]){
        box('sash',p,l,r,sill+.04,sill+.56,-.26,-.233);
        box('stone',p,l-.04,r+.035,.009,sill,.02,.232);
      }
    }
    for(const u of [.05,L-.05]){
      box('stone',p,u-.058,u+.058,.35,h-.35,-.018,.061);
      box('stone',p,u-.073,u+.073,.34,.46,-.025,.078);
    }
    box('plinth',p,0,lo,-.052,.32,-.025,.052);box('plinth',p,hi,L,-.052,.32,-.025,.052);
    box('stone',p,0,L,h-.298,h-.22,-.10,.15);box('stone',p,0,L,h-.16,h-.02,-.11,.22);
  }
  function roof(s){
    const {points,h,rise,depth}=s;
    // Each section uses shared cross sections at the sampled curve, not a
    // separate roof (with hidden gables) on every individual window axis.
    const profile=[[-.27,h],[depth*.19,h+rise*.70],[depth*.38,h+rise],
      [depth*.62,h+rise],[depth*.81,h+rise*.70],[depth+.23,h]];
    const ab=points.map(([x,z],i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
      const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz);
      return profile.map(([d,y])=>[x+d*dz/n,y,z-d*dx/n]);
    });
    let chainage=0;
    for(let i=1;i<ab.length;i++){
      const a=ab[i-1],b=ab[i];
      for(let j=0;j<a.length-1;j++)quad('tiles',a[j],b[j],b[j+1],a[j+1],1.61,chainage);
      chainage+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    }
    const ends=[ab[0],ab.at(-1)];
    for(const e of ends)for(let j=1;j<e.length-1;j++){
      triangle('tiles',e[0],e[j],e[j+1],[0,0,1,1,1,0]);
    }
  }
  for(const section of sections){
    const {points,h,depth}=section;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],f=frame(a,b),{p,L}=f;
      world.polygon([p(0,0,.12),p(L,0,.12),p(L,0,-depth),p(0,0,-depth)].map(([x,,z])=>[x,z]));
      if(section.pavilion)for(let j=0;j<3;j++){
        const [a,b]=[j/3,(j+1)/3].map(t=>p(t*L,0,0));
        bay(frame([a[0],a[2]],[b[0],b[2]]),h,{pale:true});
      }
      else bay(f,h,{main:section.main,door:section.main});
      box('plaster',p,0,L,-.06,h,-depth,-depth+.10);
      for(const end of [i===1?0:null,i===points.length-1?L:null]){
        if(end===null)continue;
        const start=end===0,bottom=p(end,0,0),back=p(end,0,-depth),
          endA=start?back:bottom,endB=start?bottom:back,
          capFrame=frame([endA[0],endA[2]],[endB[0],endB[2]]);
        if(section.pavilion&&((start&&a[1]>CENTER+29)||(!start&&b[1]<CENTER-29))){
          for(let j=0;j<5;j++){
            const pair=[j/5,(j+1)/5].map(t=>[endA[0]+(endB[0]-endA[0])*t,endA[2]+(endB[2]-endA[2])*t]);
            bay(frame(...pair),h,{pale:true});
          }
        }else box('plaster',capFrame.p,0,capFrame.L,-.04,h,-.062,.001);
      }
    }
    roof(section);
  }
  const f=frame(hall[0],hall.at(-1)),p=f.p;
  for(const u of [4.49,4.90,7.10,7.51]){
    const column=new T.CylinderGeometry(.127,.158,5.17,14);
    const at=p(u,3.23,.48);
    world.circle(at[0],at[2],.245);
    kit.geometry('stone',column,new T.Matrix4().makeTranslation(...at));column.dispose();
    for(const [y,r,h] of [[.46,.25,.52],[.68,.206,.112],[5.91,.204,.20],[6.04,.23,.105]]){
      box('stone',p,u-r,u+r,y-h/2,y+h/2,.48-r,.48+r);
    }
  }
  box('stone',p,4.16,7.84,6.09,6.29,-.06,.78);
  for(const side of [-1,1]){
    const a=6+side*2.40,b=6+side*.70;
    bar(p,'stone',a,6.31,b,7.40,.194,.57);
    bar(p,'stone',a,6.42,b,7.51,.084,.62);
  }
  box('stone',p,4.08,7.92,7.88,8.095,.02,.27);
  for(let i=0;i<11;i++)box('stone',p,4.30+i*.33,4.40+i*.33,8.03,8.48,.033,.149);
  box('stone',p,4.10,7.90,8.43,8.54,.021,.22);
  // Photographs establish a sculptural crown; these are LOD silhouette
  // approximations, not a reconstruction of the figures or coat of arms.
  function roofMass(u,y,d,sx,sy,sz,tilt=0) {
    const mesh=new T.IcosahedronGeometry(1,1);
    const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),tilt);
    kit.geometry('stone',mesh,new T.Matrix4().compose(new T.Vector3(...p(u,y,d)),q,new T.Vector3(sx,sy,sz)));
    mesh.dispose();
  }
  for(const [u,turn] of [[4.37,-1],[7.63,1]]){
    box('stone',p,u-.23,u+.23,8.52,8.69,.05,.45);
    roofMass(u,8.84,.23,.25,.18,.20);
    roofMass(u+turn*.045,9.16,.25,.15,.34,.14,-turn*.14);
    roofMass(u+turn*.072,9.49,.27,.104,.127,.091);
    roofMass(u+turn*.184,9.14,.27,.122,.16,.084,turn*.3);
  }
  roofMass(6,8.84,.28,.41,.38,.135);
  for(const side of [-1,1])roofMass(6+side*.34,9.03,.30,.18,.19,.119,side*.44);
  roofMass(6,9.27,.31,.23,.105,.13);
  kit.flush('Orangerie');
  return g;
}
