import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {p,DEEP_FLOOR,deepWalk} from './park-wc-layout.js';
import {randomSource} from './surface-detail.js';

// These are scenic props. No damage, pickups, victim or gameplay combat.
const U=-22.38,V=-7.45,workU=U-.02,workV=V-.88;
const clamp=(x,l=0,h=1)=>Math.max(l,Math.min(h,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export function orbPriest(T,room,hit){
  const props=new T.Group();props.name='Votivkammer · Arbeitsfläche und Opfergaben';room.add(props);
  props.position.set(...p(U,DEEP_FLOOR+1.024,V));props.rotation.y=-Math.PI/2;
  const std=(color,roughness,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const sin=Math.sin,cos=Math.cos,flesh=new T.MeshStandardMaterial({vertexColors:true,roughness:.49});
  flesh.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 fiberP;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nfiberP=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 fiberP;')
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        float fiberMix=sin(fiberP.y*763.+fiberP.z*291.+sin(fiberP.x*53.)*2.7)*sin(fiberP.z*831.+sin(fiberP.y*186.)*4.);
        fiberMix*=1.-smoothstep(.001,.006,max(length(dFdx(fiberP)),length(dFdy(fiberP))));
        diffuseColor.rgb*=1.+.105*fiberMix;
        roughnessFactor+=.105*fiberMix;`);
  };
  const oxblood=std(0x301112,.32),fresh=std(0x541316,.32),board=std(0x453129,.86),tin=std(0x454742,.49,.4);
  const steel=std(0x767980,.38,.73),edge=std(0xa8adb2,.29,.74),handle=std(0x2b211d,.76),
    ivory=std(0xa68a74,.66),boneEnd=std(0x806048,.91),bronze=std(0x79604d,.47,.44),
    verdigris=std(0x374339,.83,.12);
  const rnd=randomSource(27315);
  const add=(group,g,m,x,y,z,rx=0,ry=0,rz=0)=>{
    const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);
    mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  const box=(group,m,x,y,z,a,b,c,r=.014)=>add(group,new RoundedBoxGeometry(a,b,c,2,r),m,x,y,z);
  box(props,board,-.088,.031,-.276,.76,.069,.45,.024);
  for(const x of [-.468,.30])box(props,tin,x,.034,-.276,.019,.071,.43,.006);
  box(props,tin,.56,.020,-.23,.43,.027,.30,.012);
  for(const x of [.349,.771])box(props,tin,x,.048,-.23,.017,.057,.295,.007);
  for(const z of [-.376,-.084])box(props,tin,.56,.049,z,.43,.056,.015,.007);

  function meat(x,y,z,rx,ry,rz,turn,seed){
    // Swept section with a separate cut face: angular fibers outside, two
    // muscle lobes and thin connective ribbons on the cross section.
    const g=new T.BufferGeometry(),B=new T.Color(),positions=[],colors=[],idx=[],N=56,R=15;
    function v(t,a,r,cap){
      const yy=r*cos(a),zz=r*sin(a),s=1+.118*cos(3*a+t*2+seed)+.068*sin(7*a-t*4)+.033*sin(13*a+t*7);
      const thickness=(.52+.48*Math.sin(.36+.77*t))*s;
      positions.push(rx*(2*t-1+.041*r*sin(a*3+t+seed)),ry*(yy*thickness+.093*sin(6*t+seed)),
        rz*(zz*thickness+.12*sin(3.4*t+seed)));
      const vein=Math.abs(yy+.33*zz+.22*sin(zz*4+t*3.4)+.14);
      const fine=Math.abs(sin(21*yy+4*zz+2.9*sin(zz*5+seed)));
      const pale=cap?(vein<.06||r>.93||vein<.21&&fine<.13):yy>.58+.27*sin(2.6*t+seed)&&cos(a-.15)>.5;
      B.setHex(pale?(cap?0xb18069:0x9a6b55):cap?0x6c2226:0x521c22)
        .multiplyScalar(.72+.17*sin(t*12+a*8+seed)+.16*cos(24*yy+zz*11.1)+.10*sin(a*17-t*8.));
      colors.push(B.r,B.g,B.b);
    }
    const ring=(t,r,cap)=>{for(let j=0;j<N;j++)v(t,2*Math.PI*j/N,r,cap);};
    for(let i=0;i<=R;i++)ring(i/R,1,false);
    for(let i=0;i<R;i++)for(let j=0;j<N;j++){
      const k=i*N+j,k1=i*N+(j+1)%N;idx.push(k,k1,k+N,k1,k1+N,k+N);
    }
    for(const t of [0,1]){
      const start=positions.length/3,K=22;
      for(let k=0;k<K;k++)ring(t,1-k/K,true);
      for(let k=0;k<K-1;k++)for(let j=0;j<N;j++){
        const a=start+k*N+j,b=start+k*N+(j+1)%N;
        idx.push(...(t?[a,b,a+N,b,b+N,a+N]:[a,a+N,b,b,a+N,b+N]));
      }
      const c=positions.length/3;v(t,0,0,true);
      for(let j=0;j<N;j++){const a=start+(K-1)*N+j,b=start+(K-1)*N+(j+1)%N;idx.push(...(t?[a,b,c]:[a,c,b]));}
    }
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    g.setIndex(idx);g.computeVertexNormals();return add(props,g,flesh,x,y,z,0,turn,.024*seed);
  }
  meat(-.205,.123,-.343,.239,.074,.115,-.12,1);
  meat(.102,.104,-.155,.130,.055,.070,.52,2);
  meat(.490,.077,-.270,.100,.039,.053,.25,3);
  meat(.622,.066,-.181,.107,.032,.037,-.48,4);
  const orb=new T.SphereGeometry(1,14,10);
  function bone(x,y,z,length,r,yaw,slant,split=false){
    const g=new T.Group();g.position.set(x,y,z);g.rotation.set(-.10,yaw,slant);props.add(g);
    const bar=add(g,new T.CapsuleGeometry(r,length-2*r,6,14),ivory,0,0,0,0,0,Math.PI*.5);
    bar.scale.y=1.09;
    for(const s of [-1,1]){
      if(s>0&&split){
        add(g,new T.CylinderGeometry(r*.91,r*.93,.003,12),boneEnd,length*.49,.001,0,0,0,Math.PI*.5);
        for(let i=0;i<5;i++){
          const n=add(g,orb,ivory,length*.496,cos(i*2.4)*r*.54,sin(i*2.4)*r*.49);
          n.scale.set(.0025,r*.18,r*.20);
        }
        continue;
      }
      for(const d of [-1,1]){
        const n=add(g,orb,ivory,s*length*.445,-.004+d*.30*r,d*.68*r,0,d*.21,-s*.28);
        n.scale.set(r*1.21,r*.98,r*.87);
      }
    }
  }
  bone(.146,.091,-.412,.196,.018,.25,-.06,true);
  bone(.86,.151,-.226,.230,.019,-.56,.19);
  bone(.834,.135,-.205,.148,.014,.57,-.18,true);
  bone(.902,.131,-.269,.104,.012,1.15,.26,true);
  for(const [y,r,tube,mat] of [[.184,.171,.004,bronze],[.071,.099,.004,verdigris],[.047,.092,.007,bronze]]){
    add(props,new T.TorusGeometry(r,tube,6,40),mat,.86,y,-.24,Math.PI*.5);
  }
  for(const s of [-1,1]){
    const loop=add(props,new T.TorusGeometry(.057,.006,7,19),bronze,.86+s*.163,.147,-.24,.22,Math.PI*.5);
    loop.scale.set(.78,.54,1);
  }
  function pool(x,y,z,w,d,angle,material){
    const g=new T.BufferGeometry(),pos=[0,.0006,0],ix=[],N=39;
    for(let i=0;i<N;i++){
      const a=i/N*Math.PI*2,h=.67+.16*sin(5*a)+.082*sin(11*a+.1)+rnd()*.080;
      pos.push(w*Math.cos(a)*h,0,d*sin(a)*h);ix.push(0,(i+1)%N+1,i+1);
    }
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();
    add(props,g,material,x,y,z,0,angle);
  }
  pool(-.053,.068,-.260,.428,.202,-.05,oxblood);
  pool(-.014,.069,-.249,.315,.134,-.18,fresh);
  pool(.728,.0068,.222,.195,.122,.32,oxblood);
  pool(-.24,.0075,.418,.29,.09,-.22,oxblood);
  for(let j=0;j<6;j++){
    const x=-.28+j*.091,dy=.024+.065*rnd();
    const drip=add(props,new T.SphereGeometry(1,12,9),j%3?oxblood:fresh,x,-dy*.57,.5718+j*.0001);
    drip.scale.set(.010+rnd()*.012,dy,.0017);
  }
  for(let j=0;j<9;j++)pool(-.118+rnd()*.60,.0062+rnd()*.0005,-.05+rnd()*.52,.009+rnd()*.020,.007+rnd()*.012,j*.85,j%3?oxblood:fresh);

  if(!humansAvailable(T))return null;
  const npc=createHuman(T,'orbPriest'),{actor}=npc;
  actor.position.set(...p(workU,npc.groundedY(DEEP_FLOOR),workV));actor.rotation.y=-Math.PI*.5;
  actor.name='Orb-Priester · Votivkammer';room.add(actor);
  const at=actor.position;
  npc.npcInfo.shadow=contactShadow(T,room,at.x,DEEP_FLOOR+.005,at.z,.81,.80);
  hit(workU-.27,workU+.27,workV-.19,workV+.19,p=>npc.alive()&&deepWalk(p));
  const grip=npc.grip('r'),tool=grip.socket;
  tool.name='Votivkammer · Requisitenmesser im Handgriff';
  box(tool,handle,0,0,-.003,.023,.027,.119,.008);
  box(tool,steel,0,-.002,.056,.027,.030,.013,.004);
  box(tool,tin,0,-.002,-.064,.023,.026,.010,.004);
  const blade=new T.Shape();
  blade.moveTo(.061,-.023);blade.lineTo(.061,.013);blade.lineTo(.183,.012);
  blade.quadraticCurveTo(.206,.010,.240,.018);blade.quadraticCurveTo(.215,-.006,.183,-.018);
  blade.quadraticCurveTo(.144,-.027,.061,-.023);
  const bevel=new T.ExtrudeGeometry(blade,{depth:.003,steps:1,curveSegments:8,bevelEnabled:true,bevelSegments:1,bevelThickness:.001,bevelSize:.001});
  bevel.translate(0,0,-.0015);bevel.rotateY(-Math.PI*.5);
  add(tool,bevel,[steel,edge],0,0,0);
  for(const z of [-.043,.034])add(tool,new T.CylinderGeometry(.0035,.0035,.024,9),tin,0,0,z,0,0,Math.PI*.5);
  const toolQ=new T.Quaternion(),toolEuler=new T.Euler(0,0,0,'YXZ');
  let t=0,work=0,stop=-10,attention=0,look=0,acc=0;
  const target={id:'orb-priest',action:'priest-ack',label:'Orb-Priester ansprechen'};
  function update(dt,visitor){
    if(!dt||!npc.controllable())return false;
    t+=dt;acc+=dt;if(acc<1/30)return false;
    const s=acc;acc=0;
    const since=t-stop,w=smooth(since/.27)*(1-smooth((since-.82)/.62));
    attention+=(w-attention)*(1-Math.exp(-s*15));work+=s*(1-attention);
    const yaw=visitor?Math.atan2(visitor.x-at.x,visitor.z-at.z)-actor.rotation.y:0;
    look+=(attention*clamp(Math.atan2(Math.sin(yaw),Math.cos(yaw)),-.76,.76)-look)*(1-Math.exp(-s*8));
    npc.altarWork(work,attention,look);
    toolQ.setFromEuler(toolEuler.set(.18+.12*sin(work*3.8)*(1-attention),
      actor.rotation.y+.27+.19*sin(work*1.6),-.30+.14*sin(work*3.8)));
    grip.hold(toolQ);
    return true;
  }
  update(.045);
  return {update,target(pos,dir){
    if(!npc.alive())return null;
    const dx=at.x-pos.x,dz=at.z-pos.z,d=Math.hypot(dx,dz);
    return d>1.01&&d<2.65&&dx*dir.x+dz*dir.z>d*.61&&t-stop>1.77?target:null;
  },use(){
    if(!npc.alive()||t-stop<1.77)return null;
    stop=t;return at;
  }};
}
