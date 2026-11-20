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
  const flesh=new T.MeshStandardMaterial({vertexColors:true,roughness:.53});
  const oxblood=std(0x301112,.32),fresh=std(0x541316,.32),board=std(0x453129,.86),tin=std(0x454742,.49,.4);
  const steel=std(0x777775,.48,.65),handle=std(0x392621,.78),ivory=std(0x7c6657,.57);
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
    const g=new T.SphereGeometry(1,27,18),B=new T.Color(),colors=[],P=g.attributes.position;
    for(let i=0;i<P.count;i++){
      const a=P.getX(i),b=P.getY(i),c=P.getZ(i),cut=a>.50;
      const wi=1+.085*Math.cos(a*17-b*12+c*4+seed)+.054*Math.sin(a*10+b*7+c*9);
      const A=Math.min(.55+.034*Math.sin(b*8+c*11+seed),a);
      P.setXYZ(i,A*rx*wi,(b+.075*sin(a*8+c*7))*ry*wi,c*rz*wi);
      const marbling=Math.abs(Math.sin(31*b+6*c+2.1*Math.sin(c*14+a*5)));
      const seam=Math.abs(b+.15+.22*sin(a*5+c*3));
      const fat=cut?(marbling<.14||seam<.081):seam<.095&&c<.2&&a>.0;
      B.setHex(fat?(cut?0xa0796c:0x806053):cut?0x681720:0x491418)
        .multiplyScalar(.80+.17*Math.sin(a*18+c*3+seed)+.15*Math.cos(b*26+c*11));
      colors.push(B.r,B.g,B.b);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
    return add(props,g,flesh,x,y,z,0,turn,.031*seed);
  }
  const sin=Math.sin;
  const cut=meat(-.153,.120,-.318,.335,.089,.137,-.13,1);
  meat(.084,.104,-.130,.158,.051,.079,.54,2);
  meat(.510,.091,-.23,.144,.048,.067,.20,3);
  meat(.624,.077,-.188,.101,.030,.044,-.48,4);
  const end=new T.CapsuleGeometry(.024,.152,5,11);
  add(props,end,ivory,-.284,.120,-.357,0,0,Math.PI*.51);
  for(const z of [-.374,-.347])add(props,new T.SphereGeometry(.035,10,7),ivory,-.365,.120,z);
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
  actor.position.set(...p(workU,DEEP_FLOOR+.009,workV));actor.rotation.y=-Math.PI*.5;
  actor.name='Orb-Priester · Votivkammer';room.add(actor);
  const at=actor.position;
  contactShadow(T,room,at.x,DEEP_FLOOR+.005,at.z,.81,.80);
  hit(workU-.27,workU+.27,workV-.19,workV+.19,deepWalk);
  const tool=new T.Group();tool.name='Votivkammer · Küchenbeil (Requisite)';room.add(tool);
  box(tool,handle,0,0,.004,.024,.029,.156,.0115);
  box(tool,steel,0,-.044,.091,.016,.102,.148,.0075);
  box(tool,tin,0,-.093,.096,.014,.011,.139,.004);
  for(const z of [-.044,.040])box(tool,tin,0,0,z,.027,.030,.016,.007);

  const wrist=npc.joint('hand_r'),finger=npc.joint('middle_01_r'),A=new T.Vector3(),B=new T.Vector3();
  let t=0,work=0,stop=-10,attention=0,look=0,acc=0;
  const target={id:'orb-priest',action:'priest-ack',label:'Orb-Priester ansprechen'};
  function update(dt,visitor){
    if(!dt)return false;
    t+=dt;acc+=dt;if(acc<1/30)return false;
    const s=acc;acc=0;
    const since=t-stop,w=smooth(since/.27)*(1-smooth((since-.82)/.62));
    attention+=(w-attention)*(1-Math.exp(-s*15));work+=s*(1-attention);
    const yaw=visitor?Math.atan2(visitor.x-at.x,visitor.z-at.z)-actor.rotation.y:0;
    look+=(attention*clamp(Math.atan2(Math.sin(yaw),Math.cos(yaw)),-.76,.76)-look)*(1-Math.exp(-s*8));
    npc.altarWork(work,attention,look);
    wrist.getWorldPosition(A);finger.getWorldPosition(B);tool.position.copy(A.lerp(B,.83));
    tool.rotation.set(-.18+.28*sin(work*3.8)*(1-attention),actor.rotation.y-.13*(1-attention),-.25+.11*sin(work*3.8));
    cut.rotation.z=.032+.034*sin(work*4.1)*(1-attention);
    return true;
  }
  update(.045);
  return {update,target(pos,dir){
    const dx=at.x-pos.x,dz=at.z-pos.z,d=Math.hypot(dx,dz);
    return d>1.01&&d<2.65&&dx*dir.x+dz*dir.z>d*.61&&t-stop>1.77?target:null;
  },use(){
    if(t-stop<1.77)return null;
    stop=t;return at;
  }};
}
