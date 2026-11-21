import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {architectureKit} from './architecture-kit.js';
import {sharedSet} from './surface-detail.js';
import {createHuman,humansAvailable} from './human-character.js';
import {contactShadow} from './palace-butler.js';
import {factoryPrints,factoryDetailPrints,FACTORY_ROOMS} from './upper-factory-art.js';
import {factoryFinishMaterials,dressFactoryFinishes} from './upper-factory-finishes.js';
import {classroomMaterials,dressClassroom} from './upper-classroom.js';

const pi=Math.PI,at=(x,y,z)=>[x,y,z],front=-1.73;
const staff=[
  {room:0,id:'cloneB12',u:2.47,d:4.29,yaw:-.64,role:'checker'},
  {room:2,id:'cloneLorenz',u:-2.23,d:3.72,yaw:pi,role:'repair'},
  {room:4,id:'cloneB07',u:-1.96,d:4.60,yaw:.38,role:'cadet'},
  {room:5,id:'cloneAlma',u:1.49,d:4.89,yaw:-.22,role:'trainer'}
];
export function dressUpperFactory(T,parent,world,F,bays,{roof,gardenWidth,gardenEnd,Z}){
  const paint=sharedSet(T,'enamel',256),grain=sharedSet(T,'cutMetal',256),fabric=sharedSet(T,'canvas',256),
    wood=sharedSet(T,'fineOak',256),lime=sharedSet(T,'bedrock',256);
  const std=(color,roughness,map={},metalness=0,n=.66)=>new T.MeshStandardMaterial({
    color,roughness,metalness,...map,normalScale:new T.Vector2(n,n)
  });
  const glow=(color,intensity=.55)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.46});
  const mats={
    coal:std(0x3b494c,.77,paint,.31),gunmetal:std(0x777d76,.56,grain,.61),rubber:std(0x303432,.95,fabric),
    green:std(0x6a7c71,.75,paint,.28),navy:std(0x55677b,.75,paint,.26),red:std(0x8a4e3e,.72,paint,.25),
    ivory:std(0xc7bda0,.79,paint,.09),amber:std(0xb18a50,.67,paint,.42),copper:std(0x9b7656,.58,grain,.65),
    boards:std(0x8a6e51,.90,wood),felt:std(0x5d5351,.97,fabric),canvas:std(0x888d82,.97,fabric),
    tile:std(0xa7b0a4,.86,lime),paper:std(0xd3c5a4,.94,fabric),char:std(0x39473f,.82,paint),
    sky:glow(0x99cfd8,.66),warm:glow(0xe2bd7f,.57),rose:glow(0xb95439,.48),moss:glow(0x9daf77,.39),
    print:factoryPrints(T),...factoryDetailPrints(T),...factoryFinishMaterials(T),...classroomMaterials(T)
  };
  const g={
    soft:new RoundedBoxGeometry(1,1,1,2,.075),
    round:new T.CylinderGeometry(1,1,1,14),cone:new T.CylinderGeometry(.62,1,1,14),
    sphere:new T.SphereGeometry(1,16,10),ring:new T.TorusGeometry(1,.089,8,24),
    panel:new T.PlaneGeometry(1,1)
  };
  const m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3(),e=new T.Euler(),
    dir=new T.Vector3(),Y=new T.Vector3(0,1,0);
  const rooms=[],actors=[],motion=[];
  for(let i=0;i<FACTORY_ROOMS.length;i++){
    const meta=FACTORY_ROOMS[i],a=bays[i],b=bays[i+1],cx=(a+b)*.5,edge=(b-a)*.5;
    const ceiling=roof-F;
    const rear=u=>front-(Math.abs(cx+u)<gardenWidth?gardenEnd:-Z);
    const cuts=[a,...[-gardenWidth,gardenWidth].filter(x=>x>a&&x<b),b];
    const sections=cuts.slice(1).map((r,j)=>[cuts[j]-cx,r-cx,rear((cuts[j]+r)/2-cx)]);
    const room=new T.Group();room.name='Morgenform · '+meta.sub+' · '+meta.title;parent.add(room);
    rooms.push({room,a,b});const k=architectureKit(T,room,mats);
    let lift=0;
    const xyz=(u,y,d)=>[cx+u,F+y+lift,front-d],uDoor=-.37;
    const box=(mat,u,y,d,w,h,l)=>{
      const [x,t,z]=xyz(u,y,d);
      k.box(mat,at,x-w/2,x+w/2,t-h/2,t+h/2,z-l/2,z+l/2);
    };
    function shape(mat,key,u,y,d,w,h,l,rx=0,ry=0,rz=0){
      k.geometry(mat,g[key],m.compose(p.fromArray(xyz(u,y,d)),q.setFromEuler(e.set(rx,ry,rz)),s.set(w,h,l)));
    }
    function tube(mat,A,B,r){
      p.fromArray(xyz(...A));dir.fromArray(xyz(...B)).sub(p);const n=dir.length();if(n<.002)return;
      k.geometry(mat,g.round,m.compose(p.addScaledVector(dir,.5),q.setFromUnitVectors(Y,dir.normalize()),s.set(r,n,r)));
    }
    function foot(u,d,w,l){
      const [x,,z]=xyz(u,0,d);
      world.box(x-w/2,z-l/2,x+w/2,z+l/2,q=>q.y>=F-.30);
    }
    const bolt=(u,y,d,h=.017)=>shape('gunmetal','round',u,y,d,h,.014,h,pi*.5,0);
    function plate(tile,u,y,d,w,h,ry=0,rx=0,mat='print'){
      const mesh=g.panel.clone(),uv=mesh.attributes.uv,U=(tile%4)*.25,V=1-(Math.floor(tile/4)+1)*.25;
      for(let j=0;j<uv.count;j++)uv.setXY(j,U+.003+uv.getX(j)*.244,V+.003+uv.getY(j)*.244);
      k.geometry(mat,mesh,m.compose(p.fromArray(xyz(u,y,d)),q.setFromEuler(e.set(rx,ry,0)),s.set(w,h,1)));
      mesh.dispose();
    }
    function poster(tile,u,y,d,w,h,ry=0,mat='print'){
      const dx=Math.sin(ry)*.033,dz=-Math.cos(ry)*.033;
      shape('boards','soft',u-dx,y,d-dz,w+.10,h+.10,.065,0,ry);
      plate(tile,u,y,d,w,h,ry,0,mat);
    }
    function stripe(u,d,w,l){
      box('coal',u,.006,d,w,.009,l);
      for(let j=Math.floor(-l/.26*.5);j<Math.floor(l/.26*.5);j++)
        shape('amber','soft',u,.012,d+j*.26,w*.58,.004,.173,0,.51);
    }
    function cableRun(s,d1,d2,y){
      const x=s*(edge-.25);
      tube('coal',[x,y,d1],[x,y,d2],.037);
      tube('copper',[x+s*.028,y+.076,d1],[x+s*.028,y+.076,d2],.021);
      for(let d=d1+.32;d<d2-.10;d+=.94){
        box('ivory',x+s*.023,y+.045,d,.156,.146,.045);
        box('coal',x+s*.094,y+.045,d,.084,.170,.089);
        bolt(x+s*.015,y+.15,d,.011);
      }
    }
    function labelOn(u,y,d,w=.37,h=.16){
      plate(i+8,u,y,d,w,h);
    }
    function table(u,d,w=1.45,l=.74,top=.95,mat='green'){
      shape('gunmetal','soft',u,top-.083,d,w*.96,.104,l*.93);
      shape(mat,'soft',u,top-.021,d,w,.043,l);
      for(const sign of [-1,1])for(const end of [-1,1]){
        const x=u+sign*(w*.5-.087),z=d+end*(l*.5-.072);
        shape('coal','soft',x,(top-.069)*.5,z,.060,top-.069,.061);
        shape('rubber','soft',x,.037,z,.10,.040,.096);
      }
      for(const h of [-.30,.30])box('coal',u,.215,d+h*l,w*.95,.035,.048);
      for(const h of [-1,1]){
        box('gunmetal',u+h*(w*.5-.063),top-.159,d,.063,.054,l*.82);
        box('amber',u+h*(w*.5-.073),top-.076,d-l*.476,.051,.025,.023);
      }
      foot(u,d,w,l);
    }
    function crate(u,y,d,w=.64,l=.51,mat='navy',lit=false){
      const h=w*.52;
      shape(mat,'soft',u,y+h*.49,d,w,h,l);
      shape('gunmetal','soft',u,y+h*.92,d,w+.026,.073,l+.015);
      for(const t of [-1,1]){
        box('coal',u+t*w*.381,y+h*.47,d-l*.513,w*.096,h*.91,.027);
        box('copper',u+t*w*.381,y+h*.64,d-l*.55,.042,.087,.025);
        bolt(u+t*w*.414,y+h*.265,d-l*.536,.013);
      }
      if(lit)labelOn(u,y+h*.46,d-l*.531,w*.5,h*.37);
      box('rubber',u,y+h*.91,d-l*.519,w*.81,.013,.017);
      if(w>.48){
        box('coal',u,y+h*.69,d-l*.534,w*.25,.029,.026);
        for(const r of [-1,1])box('gunmetal',u+r*w*.11,y+h*.69,d-l*.552,.022,.031,.018);
      }
    }
    function rack(u,d,w=1.76,depth=.64,levels=4){
      const shelfY=[.18,.64,1.20,1.78].slice(0,levels);
      for(const x of [u-w/2+.024,u+w/2-.024])for(const z of [d-depth/2+.03,d+depth/2-.03]){
        box('coal',x,.993,z,.065,1.93,.068);
        box('gunmetal',x,.035,z,.112,.045,.103);
        for(const y of shelfY){box('gunmetal',x,y-.061,z,.081,.083,.090);bolt(x,y-.067,z-.054,.013);}
      }
      for(const y of shelfY){
        shape('green','soft',u,y,d,w,.052,depth);
        box('amber',u,y-.007,d-depth/2-.004,w-.041,.018,.018);
      }
      foot(u,d,w,depth);return shelfY.map(y=>y+.027);
    }
    function console(u,d,w=1.22,height=1.13){
      shape('coal','soft',u,.542,d,w*.92,1.028,.53);
      box('gunmetal',u,.046,d,w*.88,.091,.547);
      shape('char','soft',u,.574,d-.266,w*.72,.61,.034);
      for(const x of [-1,1])bolt(u+x*w*.30,.829,d-.291,.016);
      for(let j=0;j<8;j++)box('rubber',u+(j-3.5)*w*.065,.392,d-.286,w*.038,.134,.013);
      box('gunmetal',u-w*.25,.689,d-.296,.111,.022,.033);
      shape('green','soft',u,height,d,w,.235,.72,-.15);
      shape('rubber','soft',u,height+.085,d-.125,w*.78,.034,.27,-.15);
      for(const x of [-.27,-.19,-.07,.13,.245])shape(x<0?'moss':'warm','soft',u+x,height+.106,d-.152,.055,.024,.041);
      shape('gunmetal','soft',u,height+.147,d+.173,w*.37,.077,.254);
      shape('coal','soft',u,height+.261,d+.20,.153,.225,.144,.12);
      shape('char','soft',u,height+.430,d+.162,w*.68,.386,.268);
      shape('gunmetal','soft',u,height+.429,d+.020,w*.65,.370,.057);
      shape('rubber','soft',u,height+.444,d-.014,w*.57,.280,.019);
      plate(i,u,height+.444,d-.026,w*.54,.249,0,0,'monitor');
      for(const x of [-1,1])bolt(u+x*w*.289,height+.286,d-.010,.010);
      for(let j=0;j<4;j++)box(j===0?'moss':'copper',u+(j-1.5)*.049,height+.296,d-.016,.031,.012,.012);
      tube('rubber',[u+.12,height+.39,d+.282],[u+.16,height+.11,d+.321],.019);
      foot(u,d,w*.96,.72);
    }
    function bulb(u,y,d,t='warm'){
      shape('coal','round',u,ceiling-.035,d,.146,.052,.146);
      tube('coal',[u,ceiling-.034,d],[u,y+.012,d],.022);
      shape('gunmetal','cone',u,y,d,.194,.106,.194);
      shape('copper','ring',u,y-.042,d,.173,.173,.12,pi*.5);
      shape(t,'sphere',u,y-.056,d,.083,.066,.083);
      for(let j=0;j<4;j++){
        const a=j*pi*.5;
        tube('gunmetal',[u+Math.sin(a)*.092,y-.017,d+Math.cos(a)*.091],
          [u+Math.sin(a)*.067,y-.14,d+Math.cos(a)*.067],.008);
      }
    }
    function drone(u,y,d,z,mat='navy',turned=0){
      // Exterior only: cast shell, blank dummy rotors and a decorative lens.
      const stems=[[-1,-.67],[-.88,.72],[1,-.67],[.88,.72]],K=(x,y,z0)=>{
        const s=Math.sin(turned),c=Math.cos(turned);
        return [u+(x*c-z0*s)*z,y,d+(x*s+z0*c)*z];
      };
      shape(mat,'soft',u,y,d,.92*z,.28*z,.90*z,0,turned);
      shape('coal','soft',u,y-.122*z,d,.66*z,.15*z,.75*z,0,turned);
      shape('gunmetal','soft',u,y+.137*z,d,.61*z,.068*z,.65*z,0,turned);
      shape('ivory','soft',u,y+.178*z,d,.52*z,.047*z,.51*z,0,turned);
      shape('coal','soft',u,y-.060*z,d-.433*z,.36*z,.164*z,.147*z);
      shape('gunmetal','ring',u,y-.060*z,d-.510*z,.107*z,.089*z,.085*z);
      shape('sky','sphere',u,y-.060*z,d-.521*z,.074*z,.064*z,.031*z);
      for(const side of [-1,1]){
        const [X,H,D]=K(side*.427,y,.04);
        shape('copper','soft',X,H,D,.083*z,.129*z,.48*z,0,turned);
        for(const q of [-.22,.18]){
          const [x,h,a]=K(side*.385,y+.152*z,q);
          shape('gunmetal','round',x,h,a,.024*z,.019*z,.024*z);
        }
      }
      for(const [dx,dz] of stems){
        const [x,h,D]=K(dx,y+.040*z,dz);
        tube('gunmetal',[u,y-.042*z,d],[x,h,D],.051*z);
        shape('coal','round',x,h,D,.149*z,.131*z,.149*z);
        shape('copper','round',x,h-.062*z,D,.116*z,.039*z,.116*z);
        shape('gunmetal','ring',x,h+.043*z,D,.322*z,.322*z,.30*z,pi*.5,0);
        shape('rubber','soft',x,h+.039*z,D,.51*z,.024*z,.082*z,0,turned+dx*.54);
        shape('ivory','round',x,h+.054*z,D,.052*z,.036*z,.052*z);
        shape(dx<0?'warm':'rose','sphere',x,h-.060*z,D-.13*z,.030*z,.021*z,.029*z);
      }
      for(const x of [-.25,.25])for(const dz of [-.26,.26]){
        const [X,H,D]=K(x,y-.27*z,dz);
        tube('coal',[u+x*.78*z,y-.104*z,d+dz*.55*z],[X,H,D],.026*z);
        shape('rubber','soft',X,H,D,.136*z,.046*z,.098*z);
      }
    }
    function druid(u,d,kind,scale=1){
      const h=k=>k*scale,scribe=kind==='scribe',green=scribe?'moss':'warm';
      shape('coal','cone',u,h(.13),d,h(.31),h(.188),h(.29));
      shape('green','round',u,h(.26),d,h(.27),h(.068),h(.26));
      for(const s of [-1,1])shape('gunmetal','soft',u+s*h(.146),h(.302),d-h(.067),h(.124),h(.059),h(.285));
      for(const x of [-1,1]){
        const a=u+x*h(.123);
        tube('gunmetal',[a,h(.27),d],[a,h(.65),d+.058],h(.037));
        shape('coal','sphere',a,h(.64),d+.058,h(.065),h(.069),h(.065));
      }
      shape(scribe?'amber':'navy','soft',u,h(.883),d,h(scribe?.438:.498),h(.521),h(.28));
      shape('gunmetal','soft',u,h(.888),d-.142,h(.367),h(.392),h(.037));
      tube('copper',[u,h(1.116),d],[u,h(1.222),d],h(.094));
      if(scribe){
        shape('amber','sphere',u,h(1.301),d,h(.164),h(.174),h(.123));
        shape('coal','soft',u,h(1.293),d-h(.112),h(.224),h(.107),h(.041));
        for(const x of [-.061,.061]){
          shape('gunmetal','ring',u+h(x),h(1.296),d-h(.140),h(.044),h(.038),h(.072));
          shape(green,'sphere',u+h(x),h(1.296),d-h(.146),h(.029),h(.020),h(.020));
          shape('copper','soft',u+h(x*2.56),h(.952),d-h(.094),h(.085),h(.31),h(.161),.04,0,-Math.sign(x)*.20);
        }
        shape('copper','round',u,h(1.421),d,h(.081),h(.022),h(.084));
        shape('amber','ring',u,h(.974),d-h(.172),h(.057),h(.057),h(.082));
        shape('moss','sphere',u,h(.974),d-h(.176),h(.029),h(.027),h(.016));
      }else{
        shape('navy','soft',u,h(1.267),d,h(.336),h(.246),h(.262));
        shape('gunmetal','soft',u,h(1.306),d-h(.104),h(.350),h(.092),h(.107),.11);
        shape('rubber','soft',u,h(1.265),d-h(.137),h(.262),h(.084),h(.035));
        shape('warm','soft',u-h(.025),h(1.269),d-h(.156),h(.134),h(.025),h(.014));
        for(const s of [-1,1])shape('navy','soft',u+s*h(.260),h(1.063),d,h(.171),h(.096),h(.201),0,0,s*.23);
      }
      for(const [t,mat] of [[-.132,'coal'],[.103,'ivory'],[.127,'rose']])
        shape(mat,'soft',u,h(.915+t),d-h(.166),h(.185),h(.051),h(.018));
      for(const s of [-1,1]){
        const x=u+h(s*.264);
        shape('gunmetal','sphere',x,h(1.032),d,h(.067),h(.062),h(.064));
        tube('coal',[x,h(1.03),d],[x+h(s*.18),h(.80),d-h(.071)],h(.043));
        shape('green','sphere',x+h(s*.183),h(.806),d-h(.076),h(.069),h(.069),h(.071));
        tube('gunmetal',[x+h(s*.184),h(.807),d-h(.076)],[x+h(s*.185),h(.710),d-h(.22)],h(.032));
        for(const o of [-.035,.035])tube('copper',[x+h(s*.18+o),h(.728),d-h(.219)],
          [x+h(s*.18+o),h(.677),d-h(.26)],h(.011));
      }
      if(kind==='scribe'){
        const x=u-h(.41),D=d-h(.244);
        tube('copper',[x,h(.056),D],[x,h(1.74),D],h(.025));
        shape('gunmetal','round',x,h(.063),D,h(.053),h(.056),h(.051));
        shape('rubber','round',x,h(.702),D,h(.032),h(.185),h(.032));
        shape('copper','ring',x,h(1.744),D,h(.110),h(.110),h(.077));
        shape('copper','ring',x,h(1.744),D,h(.091),h(.091),h(.072),0,.64);
        shape('moss','sphere',x,h(1.744),D,h(.041),h(.053),h(.034));
      }
    }

    dressFactoryFinishes(k,{i,w:2*edge,sections,rear,ceiling,box,xyz,cableRun});
    // A common language without making the eight spaces interchangeable.
    const ur=uDoor+1.61;
    shape('coal','soft',ur,2.03,-.155,1.16,.44,.082);
    plate(i+8,ur,2.03,-.198,1.08,.35);
    if(i!==5){
      const x=i===4?-2.34:i===2?1.10:0,u=i===4?2.78:2.21;
      poster(i,x,2.38,rear(x)-.148,1.38,1.53);
      poster(i+8,u,2.35,rear(u)-.148,.91,1.08);
    }
    const sign=i%2?-1:1,u=sign*(edge-.197);
    if(i!==5)poster(i+8,u,1.95,3.26,.74,.78,-sign*pi*.5,'notes');
    for(const q of [-.71,.71]){
      const h=uDoor+q*1.25;
      box('gunmetal',h,1.36,.143,.039,2.50,.087);
      for(const y of [.35,1.46,2.29])shape('copper','round',h,y,.192,.011,.012,.011,pi*.5);
    }
    for(const s of [-1,1])for(const z of [1.53,4.92]){
      const u=s*(edge-.194);
      if(i===5||i===4)continue;
      box('coal',u,2.15,z,.112,3.90,.094);
      if(z>3)shape('gunmetal','soft',u,.414,z+.28,.132,.58,.403);
      tube('copper',[u,.28,z],[u,.28,z+.746],.022);
    }
    for(const d of [2.24,5.06])bulb(i%2?1.05:-.30,i===4||i===5?3.43:3.52,d,i===1||i===3?'sky':i===6?'moss':'warm');

    if(i===0){ // The big object is readable from the hall; release lanes remain walkable.
      stripe(-2.40,4.45,.126,3.93);stripe(1.48,4.45,.126,3.93);
      shape('coal','soft',-.46,.097,4.65,3.65,.193,2.56);
      shape('tile','soft',-.46,.188,4.65,3.32,.075,2.26);
      for(const x of [-1.93,1.02])for(const z of [3.72,5.45]){
        shape('amber','soft',x,.28,z,.24,.148,.23);
        shape('warm','soft',x,.36,z,.13,.028,.125);
      }
      drone(-.46,.92,4.65,1.43,'green');foot(-.46,4.65,3.67,2.65);
      for(const u of [-.818,-.102])for(const d of [4.278,5.022]){
        shape('char','soft',u,.32,d,.263,.199,.24);
        shape('copper','round',u,.443,d,.076,.091,.075);
        shape('coal','soft',u,.487,d,.230,.053,.183);
      }
      for(const x of [-1.7,-.46,.77]){
        shape('gunmetal','soft',x,.135,3.421,.46,.121,.09);
        for(let j=0;j<6;j++)box('rubber',x-.166+j*.065,.137,3.370,.031,.057,.013);
      }
      // The heavy airframe gets a different profile from the bench drones.
      shape('ivory','soft',-.46,1.17,4.65,1.03,.155,.74);
      shape('gunmetal','soft',-.46,.69,4.111,.54,.219,.31);
      shape('coal','round',-.46,.68,3.941,.192,.217,.177,pi/2,0);
      shape('sky','sphere',-.46,.68,3.839,.123,.104,.055);
      for(const u of [-.82,-.10]){
        shape('navy','soft',u,1.03,4.49,.279,.218,1.04);
        for(let j=0;j<5;j++)box('rubber',u,1.143,4.42+j*.071,.144,.009,.031);
        tube('copper',[u+Math.sign(u+.46)*.21,.92,4.74],[u+Math.sign(u+.46)*.42,.93,4.53],.019);
      }
      console(2.52,5.28,.97);
      for(const x of [-2.79,2.85])for(const D of [1.85,6.46]){crate(x,0,D,.57,.58,'red',true);foot(x,D,.59,.58);}
      tube('gunmetal',[-2.83,2.95,6.51],[2.83,2.95,6.51],.058);
      for(const x of [-2.67,.25,2.65]){
        tube('gunmetal',[x,2.95,6.51],[x,ceiling-.031,6.51],.023);
        shape('coal','round',x,ceiling-.032,6.51,.088,.061,.088);
      }
      for(const x of [-1.93,1.02])tube('copper',[x,2.95,6.51],[x,1.93,5.81],.019);
    }else if(i===1){
      for(const x of [-2.20,2.07]){
        table(x,3.15,1.91,.86,.952,x<0?'navy':'green');
        shape('rubber','soft',x,.961,3.20,.86,.018,.68);
        drone(x,1.127,3.21,.56,x<0?'ivory':'red',.18);
        tube('rubber',[x-.56,.969,3.13],[x-.45,.969,3.47],.019);
        crate(x+.58,.971,3.05,.34,.26,'green');
        shape('gunmetal','soft',x-.65,.982,3.29,.28,.064,.30);
        shape('char','soft',x-.65,1.021,3.29,.22,.018,.26);
        for(let j=0;j<4;j++)shape(j===1?'copper':'gunmetal','round',x-.719+j*.046,1.036,3.25,.014,.017,.015);
        plate(i+8,x+.66,.957,3.41,.22,.25,0,-pi*.5,'notes');
      }
      rack(-1.7,6.33,2.45,.66).forEach((h,j)=>{
        for(const x of [-2.51,-1.86,-1.19])if(j%2||x!==-1.86)crate(x,h,6.35,.48,.46,j%2?'navy':'ivory',true);
        if(j===2)drone(-1.85,h+.18,6.29,.43,'navy',.14);
      });
      const hover=new T.Group();hover.name='Prüfdrohne · Pendeltest';
      hover.position.fromArray(xyz(.29,1.61,5.45));hover.userData.noSceneQuery=true;room.add(hover);
      const spinner=architectureKit(T,hover,mats);
      spinner.box('navy',at,-.247,.247,-.068,.068,-.158,.158);
      spinner.box('sky',at,-.100,.10,-.014,.035,.16,.178);
      for(const x of [-.29,.29]){
        spinner.box('gunmetal',at,x-.18,x+.18,.033,.058,-.16,.16);
        spinner.geometry('gunmetal',g.ring,new T.Matrix4().compose(new T.Vector3(x,.052,0),
          new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),pi/2),new T.Vector3(.19,.19,.10)));
      }
      spinner.flush('Schwebender Prüfkopf');motion.push({room,node:hover,y:hover.position.y,time:0});
      shape('char','soft',.29,.062,5.45,1.19,.104,1.15);
      for(const x of [-.13,.72])for(const d of [4.99,5.89])shape('moss','round',x,.120,d,.029,.014,.029);
      console(2.18,6.35,.96);
    }else if(i===2){
      for(const [x,d,t] of [[.67,4.58,'scribe'],[2.49,5.65,'guard']]){
        shape('coal','soft',x,.120,d,1.14,.243,1.08);shape('copper','round',x,.246,d,.46,.071,.46);
        lift=.215;
        druid(x,d,t,t==='scribe'?1.15:1.04);
        lift=0;
        shape('gunmetal','soft',x,.145,d-.554,.57,.127,.065);
        plate(i+8,x,.151,d-.590,.49,.092,0,0,'notes');
        for(const s of [-1,1])bolt(x+s*.255,.151,d-.594,.011);
        foot(x,d,1.08,1.02);
      }
      table(-2.18,4.55,1.72,1.01,.99,'green');
      for(const x of [-2.63,-2.20,-1.78]){
        shape('navy','soft',x,1.10,4.48,.28,.195,.213);
        shape('moss','sphere',x,1.13,4.365,.057,.033,.017);
        crate(x,1.025,4.84,.24,.21,'coal');
      }
      shape('char','soft',-2.22,1.005,4.228,.60,.026,.30);
      plate(i+8,-2.08,1.020,4.19,.18,.132,0,-pi*.5,'notes');
      tube('copper',[-2.44,1.023,4.31],[-2.39,1.023,4.36],.021);
      rack(-2.38,6.27,1.36,.64).forEach((y,j)=>crate(-2.38,y,6.25,.54,.45,j%3?'green':'red',true));
    }else if(i===3){
      const x=.42,d=4.55;
      shape('coal','soft',x,.20,d,2.56,.35,1.08);
      shape('char','soft',x,.055,d,2.42,.107,1.03);
      for(const u of [-.79,.79]){
        shape('green','soft',x+u,.59,d+.075,.40,.480,.60);
        shape('gunmetal','soft',x+u,.755,d+.06,.47,.128,.663);
        shape('coal','soft',x+u,.427,d+.08,.472,.10,.70);
        for(let j=0;j<4;j++)box('gunmetal',x+u-.12+j*.08,.605,d-.235,.022,.233,.035);
      }
      shape('gunmetal','soft',x,1.12,d,2.26,.72,.93);
      shape('navy','soft',x,1.31,d,1.76,.79,.79);
      shape('coal','cone',x,1.34,d-.519,.482,.246,.482,pi*.5,0);
      shape('gunmetal','ring',x,1.34,d-.659,.453,.453,.453);
      shape('sky','sphere',x,1.344,d-.673,.291,.292,.083);
      shape('char','ring',x,1.344,d-.695,.315,.315,.23);
      shape('copper','ring',x,1.344,d-.716,.314,.314,.124);
      for(let j=0;j<12;j++){
        const a=j*pi/6;
        bolt(x+.412*Math.cos(a),1.34+.412*Math.sin(a),d-.691,.012);
      }
      for(const u of [-.71,-.52,.52,.71]){
        shape('ivory','soft',x+u,1.35,d-.481,.109,.424,.059);
        for(let j=0;j<5;j++)bolt(x+u,1.19+j*.081,d-.538,.011);
      }
      labelOn(x,.31,d-.553,1.66,.196);foot(x,d,2.56,1.60);
      for(const x of [-2.34,2.36])console(x,6.24,.93);
      for(const x of [-1.4,1.4])stripe(x,3.82,.088,2.38);
      table(-2.21,2.34,1.13,.62,.932,'ivory');
      shape('coal','soft',-2.18,1.022,2.37,.33,.151,.278,-.09);
      plate(3,-2.18,1.035,2.224,.25,.118,0,0,'monitor');
      plate(11,-2.53,.935,2.36,.18,.23,0,-pi*.5,'notes');
      for(const s of [-1,1]){
        const u=s*2.77,D=4.27;
        shape('coal','soft',u,1.16,D,.57,.39,.44,0,s*.12);
        shape('navy','soft',u,1.30,D,.46,.285,.35,0,s*.12);
        shape('gunmetal','ring',u,1.309,D-.232,.142,.136,.08);
        shape('moss','sphere',u,1.306,D-.241,.076,.074,.038);
        tube('gunmetal',[u,.102,D],[u,1.043,D],.043);
        shape('coal','round',u,.060,D,.227,.112,.22);
        shape('copper','round',u,.220,D,.080,.157,.080);
        shape('navy','soft',u,.915,D,.302,.064,.245);
        for(const a of [-1,1])tube('gunmetal',[u+a*.125,.914,D],[u+a*.249,1.180,D],.018);
        foot(u,D,.54,.51);
      }
    }else if(i===4){
      for(const [u,D] of [[-2.84,7.60],[2.75,7.54]]){
        for(let k=0;k<3;k++){
          const x=u+(k-1)*.410,M=k%2?'navy':'green';
          shape(k%2?'navy':'green','soft',x,1.046,D,.389,2.01,.55);
          shape('coal','soft',x,.054,D,.397,.106,.57);
          shape('coal','soft',x,1.061,D-.276,.362,1.855,.061);
          shape(M,'soft',x,1.064,D-.302,.342,1.828,.039);
          for(const y of [.53,1.68])shape('gunmetal','soft',x-.151,y,D-.325,.042,.083,.029);
          shape('gunmetal','soft',x+.103,1.147,D-.322,.064,.115,.025);
          shape('copper','soft',x+.099,1.148,D-.342,.022,.075,.020);
          bolt(x+.098,1.117,D-.354,.010);
          for(let j=0;j<5;j++){
            box('rubber',x,1.716+j*.038,D-.326,.205,.016,.011);
            box('gunmetal',x,1.726+j*.038,D-.331,.205,.005,.010);
          }
          labelOn(x,1.514,D-.327,.259,.129);
        }
        box('gunmetal',u,2.054,D,1.23,.043,.55);
        foot(u,D,1.23,.64);
      }
      table(-2.15,2.44,1.54,.77,.91,'boards');
      for(const [j,x] of [-2.60,-2.21,-1.81].entries()){
        shape(j%2?'navy':'canvas','soft',x,.945,2.50,.29,.077,.43,0,.05*(j-1));
        shape(j%2?'green':'felt','soft',x+.009,1.007,2.512,.26,.056,.39,0,.03*j);
        shape('canvas','soft',x-.008,1.046,2.55,.214,.033,.28,0,.04*(j-1));
        box('amber',x,1.038,2.518,.030,.021,.350);
        box('amber',x,.972,2.283,.045,.100,.012);
        plate(12,x+.065,1.066,2.51,.087,.114,0,-pi*.5,'notes');
      }
      table(2.25,4.07,1.53,.69,.982,'green');
      crate(2.19,.988,4.09,.54,.40,'ivory',true);
      shape('coal','soft',2.70,.993,4.00,.26,.025,.33);
      plate(12,2.70,1.007,3.990,.222,.285,0,-pi*.5,'notes');
      shape('rubber','round',1.74,1.061,4.12,.053,.158,.053);
      shape('gunmetal','round',1.74,1.146,4.12,.041,.027,.041);
      for(const [u,D] of [[-2.66,8.7],[2.54,8.62]]){
        shape('char','soft',u,.382,D,1.32,.083,.56);
        for(const s of [-1,1])shape('coal','soft',u+s*.50,.193,D,.086,.392,.455);
        crate(u-.27,.427,D,.38,.33,'navy',true);
        shape('canvas','soft',u+.30,.50,D,.36,.119,.372,-.03,.18);
        foot(u,D,1.34,.58);
      }
      stripe(.53,3.88,.12,2.28);
    }else if(i===5){
      const platform=(l,r,a,b,h)=>{
        const x0=xyz(l,0,a)[0],x1=xyz(r,0,b)[0],z0=front-b,z1=front-a;
        world.support([[x0,z0],[x1,z0],[x1,z1],[x0,z1]],F+h,p=>p.y>=F-.25,null);
      };
      dressClassroom(k,{edge,rear,xyz,box,shape,tube,plate,poster,table,foot,platform,bulb});
    }else if(i===6){
      stripe(-1.13,4.08,.131,4.47);stripe(1.33,4.08,.131,4.47);
      for(const [x,d] of [[0,4.24],[.12,6.01]]){
        shape('gunmetal','round',x,.066,d,.301,.119,.31);
        shape('canvas','soft',x,1.22,d,.408,.506,.171);
        shape('felt','soft',x,1.410,d,.482,.144,.209);
        shape('navy','soft',x,1.236,d-.095,.340,.379,.053);
        shape('gunmetal','cone',x,1.483,d,.075,.105,.067);
        shape('gunmetal','soft',x,1.651,d,.235,.273,.213);
        shape('rubber','soft',x,1.648,d-.107,.183,.109,.022);
        shape('rose','soft',x,1.653,d-.124,.075,.019,.014);
        for(const h of [-.169,.169]){
          tube('copper',[x+h,.915,d],[x+h,1.119,d-.023],.022);
          bolt(x+h,1.36,d-.127,.014);
        }
        plate(14,x,1.236,d-.125,.205,.195,0,0,'notes');
        tube('coal',[x,.092,d],[x,.943,d],.035);
        foot(x,d,.49,.50);
      }
      console(-2.33,5.82,1.31);
      for(const d of [2.7,4.1,5.5]){
        shape('navy','soft',2.64,1.036,d,.19,1.846,.907);
        for(const x of [2.48,2.76])box('rubber',x,.043,d,.126,.079,1.056);
        for(const z of [-.411,.411]){
          box('gunmetal',2.636,1.019,d+z,.218,1.997,.087);
          box('coal',2.636,.107,d+z,.425,.106,.106);
        }
        for(const y of [.37,.57,.77,1.22,1.43,1.64])box('coal',2.531,y,d,.036,.032,.694);
        plate(14,2.514,1.11,d,.42,.244,-pi*.5,0,'notes');
        foot(2.61,d,.47,1.01);
      }
    }else{
      const u=-.35,d=4.28;
      table(u,d,2.88,1.01,.958,'navy');
      for(const A of [d-.18,d+.06]){
        shape('char','soft',u-.135,.969,A,2.09,.029,.172);
        for(const z of [-.083,.083])box('copper',u-.135,.983,A+z,2.05,.027,.015);
      }
      for(let j=0;j<20;j++){
        const x=u-1.03+(j%10)*.199,D=d-.18+Math.floor(j/10)*.24;
        shape('gunmetal','round',x,1.043,D,.042,.122,.042);
        shape(j%5?'navy':'red','cone',x,1.109,D,.041,.034,.041);
        shape('copper','round',x,1.09,D,.044,.016,.044);
        shape('rubber','round',x,1.003,D,.055,.036,.055);
      }
      plate(15,u+1.17,.962,d+.137,.26,.31,.06,-pi*.5,'notes');
      // Sealed display props and an equipment housing; the belt is static.
      shape('coal','soft',-.61,.906,5.43,2.52,.167,.64);
      shape('rubber','soft',-.61,1.003,5.43,2.46,.058,.45);
      for(const d of [5.135,5.725])shape('gunmetal','soft',-.61,1.024,d,2.58,.071,.053);
      for(let j=0;j<14;j++){
        const X=-1.73+j*.172;
        tube('gunmetal',[X,1.038,5.25],[X,1.038,5.61],.012);
        if(j%3===0){
          shape('ivory','round',X,1.067,5.42,.063,.041,.065);
          shape(j===6?'rose':'sky','sphere',X,1.091,5.42,.035,.021,.033);
        }
      }
      for(const x of [-1.54,.19])for(const d of [5.18,5.68]){
        box('rubber',x,.021,d,.117,.039,.112);
        box('gunmetal',x,.447,d,.076,.872,.062);
      }
      for(const x of [-1.16,-.38]){
        box('gunmetal',x,1.41,5.723,.091,1.30,.093);
        box('coal',x,1.038,5.723,.158,.065,.105);
      }
      box('gunmetal',-.77,2.017,5.722,.897,.089,.152);
      box('coal',-.77,1.91,5.635,.553,.104,.254);
      shape('red','soft',-.78,1.48,5.55,.51,.76,.42);
      for(const x of [-.988,-.571])for(const y of [1.255,1.77])bolt(x,y,5.329,.011);
      shape('coal','soft',-.78,1.57,5.325,.29,.29,.038);
      labelOn(-.78,1.57,5.301,.23,.225);
      shape('warm','round',-.78,1.917,5.57,.088,.082,.088);
      shape('gunmetal','round',-.78,1.873,5.57,.118,.036,.113);
      foot(-.61,5.43,2.58,.66);
      console(2.45,4.90,.85);
      rack(-1.64,6.37,2.55,.75).forEach((h,j)=>{
        for(const x of [-2.43,-1.66,-.886])crate(x,h,6.35,.55,.59,j===2?'red':'green',true);
      });
      for(const [x,d] of [[-2.60,2.33],[2.52,6.62]]){crate(x,0,d,.84,.58,'red',true);crate(x,.47,d,.67,.49,'ivory');foot(x,d,.85,.61);}
    }
    k.flush('Morgenform · '+meta.title);
    room.traverse(o=>{if(o.isMesh)o.castShadow=false;});

    if(humansAvailable(T))for(const cfg of staff.filter(s=>s.room===i)){
      const rig=createHuman(T,cfg.id),{actor,npcInfo}=rig;
      const [x,,z]=xyz(cfg.u,0,cfg.d);
      actor.position.set(x,rig.groundedY(F),z);actor.rotation.y=cfg.yaw;
      rig.shadow(false);room.add(actor);
      npcInfo.shadow=contactShadow(T,room,x,F+.007,z,.70,.65);
      world.circle(x,z,.21,()=>rig.alive());
      const t=cfg.room*.77+.8;
      rig.factoryPose(t,cfg.role);
      let chat=0;
      npcInfo.speak=duration=>{chat=typeof duration==='number'?duration:3.3;};
      actors.push({cfg,rig,x,z,time:t,get chat(){return chat;},set chat(t){chat=t;},last:null,look:0,room});
    }
  }
  for(const geo of Object.values(g))geo.dispose();
  function update(time,p,inside){
    let changed=false;
    for(let i=0;i<rooms.length;i++){
      const {room,a,b}=rooms[i],reach=p.z<front-.60?11.6:15.5;
      const relevant=inside?(p.x>a-reach&&p.x<b+reach):i===4;
      if(room.visible!==relevant){room.visible=relevant;changed=true;}
    }
    if(!inside){for(const a of actors)a.last=null;return changed;}
    for(const a of actors){
      if(!a.room.visible||!a.rig.controllable()||Math.hypot(a.x-p.x,a.z-p.z)>10){a.last=null;continue;}
      if(a.last===null){a.last=time;continue;}
      const dt=Math.min(.073,(time-a.last)*.001);
      if(dt<.047)continue;
      a.last=time;a.time+=dt;a.chat=Math.max(0,a.chat-dt);
      const off=Math.atan2(p.x-a.x,p.z-a.z)-a.cfg.yaw,target=Math.atan2(Math.sin(off),Math.cos(off));
      a.look+=((a.chat>0?Math.max(-.72,Math.min(.72,target)):0)-a.look)*(1-Math.exp(-dt*5));
      a.rig.factoryPose(a.time,a.cfg.role,a.look,a.chat>0?.19+.09*Math.abs(Math.sin(a.time*15)):0);
      changed=true;
    }
    for(const v of motion){
      if(!v.room.visible||Math.abs(p.x-v.node.position.x)>8.2||p.z>front+.32)continue;
      if(time-v.time<42)continue;
      v.time=time;
      const t=time*.001;v.node.position.y=v.y+.055*Math.sin(t*1.65);
      v.node.rotation.set(.058*Math.sin(t*.93),.22*Math.sin(t*.63),.054*Math.cos(t*1.16));
      changed=true;
    }
    return changed;
  }
  function theme(p){
    const i=bays.findIndex((edge,j)=>j<bays.length-1&&p.x>=edge&&p.x<bays[j+1]);
    return p.z<=front-.12&&i>=0?FACTORY_ROOMS[i].theme:0xffdeb6;
  }
  return {update,theme};
}
