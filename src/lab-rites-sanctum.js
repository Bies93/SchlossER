import {LAB} from './lab-layout.js';

const Y=LAB.floor,pi=Math.PI;
export function buildLodgeAltar(T,kit,art,{put,line,cyl,document,mounted}){
  const {k,hit,root,dress,wheel,obj}=kit;
  const x=-3.30,z=48.12,w=2.10;
  // A stepped masonry altar with a copper rim, inset side panels,
  // and hanging cloth. It reuses the old table's footprint.
  put('fineStone',x,.082,z,.847,.149,w);
  put('copperDark',x,.171,z,.795,.046,w-.027);
  put('riteWall',x,.490,z,.699,.605,w-.222);
  put('fineStone',x,.829,z,.764,.084,w-.089);
  put('darkWood',x,.923,z,.843,.117,w);
  put('brass',x,.856,z,.793,.020,w-.034);
  for(const t of [-1,1]){
    const Z=z+t*.82;
    put('brass',x-.346,.506,Z,.055,.463,.249);
    put('copperDark',x-.376,.505,Z,.019,.404,.194);
    line('brass',x-.390,.325,Z-.065,x-.390,.643,Z+.066,.007);
    line('brass',x-.391,.643,Z-.065,x-.391,.325,Z+.065,.007);
    const side=z+t*.914;
    put('gunmetal',x,.492,side,.591,.315,.055);
    line('brocade',x-.141,.490,side+t*.028,x+.144,.490,side+t*.028,.012);
    for(const a of [-.231,.232]){
      const f=dress.plane(x,Y+.489,side+t*.027,t===1?0:pi);
      dress.fastener(f,a,0,.007,.014,true);
    }
  }
  hit(x-.443,x+.437,z-w/2,z+w/2);
  const cloth=(s,t)=>{
    const wave=.031*Math.sin(s*34+t*1.9)+.013*Math.sin(s*65);
    const sag=.048*Math.sin(s*pi)+.014*Math.cos(s*32);
    return [x-.441-wave*(.52+.48*(1-t)),Y+.303+t*.665-(1-t)*sag,z+(s-.5)*(1.26+.048*(1-t))];
  };
  art.cloth(root,cloth);
  let p=cloth(0,.022);for(let j=1;j<=22;j++){
    const q=cloth(j/22,.022);
    dress.rod('brocade',p,q,.007);p=q;
    if(j%2===0)dress.rod('brocade',q,[q[0]-.002,q[1]-.041-j%3*.007,q[2]+.003],.0037);
  }
  line('brass',x-.415,.958,z-.739,x-.415,.958,z+.739,.020);
  for(const s of [-.72,.72]){
    line('brass',x-.363,.958,z+s,x-.439,.958,z+s,.019);
    cyl('brass',x-.420,.956,z+s,.035,.027);
  }
  document('seal',x-.035,.983,z-.238,.447,.352,pi/2);
  const plan=dress.plane(x-.029,Y+1.034,z+.335,0);
  // Brass bowl with a rolled lip, along with wax that has gathered on
  // the dish rather than cylinders balanced directly on the tabletop.
  const g=new T.LatheGeometry([[0,0],[.51,0],[.62,.06],[.73,.23],[.91,.43],[.99,.59],
    [1,.64],[.89,.61],[.79,.44],[.62,.25],[.37,.19],[0,.185]].map(([a,b])=>new T.Vector2(a,b)),23);
  obj('copper',g,x-.04,Y+.983,z+.430,.132,.181,.132);g.dispose();
  obj('brass',wheel,x-.04,Y+1.102,z+.43,.124,.124,.048,-pi/2);
  for(const [i,[x,y,z]] of [plan(-.194,0,.143),plan(.208,0,.253),plan(.236,0,-.028)].entries()){
    const L=y-Y;
    cyl('brass',x,L-.039,z,.063,.021);
    const K=.061+i*.036;
    cyl('wax',x,L+K*.5-.027,z,.023+i*.002,K);
    cyl('barGlow',x,L+K-.017,z,.0098,.025);
    line('wax',x+.018,L+K*.54,z-.009,x+.021,L-.035,z-.011,.006);
  }

  // Opposite the pews the altar is framed by three original engravings
  // (threshold, doubled portrait, loge eye) rather than borrowed imagery.
  mounted('lodgeEye',-2.290,1.801,48.11,1.64,1.50,-pi/2);
  for(const [j,key,Z] of [[0,'lodgeGate',44.93],[1,'lodgeMirror',51.38]]){
    mounted(key,-2.241,1.879,Z,1.23,1.52,-pi/2);
    put('darkWood',-2.305,1.025,Z,.301,.062,1.27);
    for(const side of [-1,1]){
      line('copperDark',-2.175,.890,Z+side*.536,-2.409,1.012,Z+side*.465,.022);
      put('gunmetal',-2.175,.881,Z+side*.536,.082,.152,.060);
      const X=-2.386,A=Z+side*.435;
      obj('brass',wheel,X,Y+1.058,A,.071,.073,.13,-pi/2);
      cyl('wax',X,1.123+side*.012,A,.032,.139+side*.023);
      line('wax',X-.029,1.154,A+.007,X-.031,1.057,A+.012,.007);
      cyl('barGlow',X,1.207+side*.024,A,.011,.027);
    }
    if(j===0)document('seal',-2.317,1.058,Z-.14,.282,.200,pi/2);
  }
  // Inlaid lozenges are flush enough to walk over; no new walk collider.
  for(const r of [1.04,1.21]){
    const border=r>1.1?.034:.014;
    const points=k=>[[-6.70-k,Y+.0038,48.11],[-6.70,Y+.0038,48.11+k],
      [-6.70+k,Y+.0038,48.11],[-6.70,Y+.0038,48.11-k]];
    const a=points(r),b=points(r-border);
    for(let i=0;i<4;i++)k.quad(r>1.1?'copperDark':'brocade',a[i],a[(i+1)%4],b[(i+1)%4],b[i],1.36);
  }
}
