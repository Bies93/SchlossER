import {architectureKit} from './architecture-kit.js';
import {sharedSet} from './surface-detail.js';
import {ATTIC_LAYER,ATTIC_FLOOR as F,ATTIC_CEILING as C,ATTIC_WELL as w,atticStair} from './palace-attic-layout.js';
import {dressStairWell,stairMaterials} from './palace-stair-detail.js';

const X=31.92,Z=8.74,at=(x,y,z)=>[x,y,z];
const inPlan=(x,z)=>Math.abs(x)<=X&&Math.abs(z)<=Z;
const inWell=(x,z)=>x>=w.left&&x<=w.right&&z>=w.start&&z<=w.far;

export function addPalaceAttic(T,scene,lowerWorld,atticWorld,lower,lowerLayer){
  const stair=new T.Group(),root=new T.Group();
  stair.name='Südende · alte Diensttreppe';root.name='Zweites Obergeschoss · ungenutzte Säle';
  scene.add(stair,root);stair.visible=root.visible=false;
  const surface=(kind,color,roughness,scale=.54)=>new T.MeshStandardMaterial({
    ...sharedSet(T,kind,512),color,roughness,normalScale:new T.Vector2(scale,scale)
  });
  const m={
    oak:surface('fineOak',0x84705e,.88),dark:surface('fineOak',0x55402f,.91),edge:surface('fineOak',0x977a5d,.83),
    pale:surface('fineOak',0xa68b70,.91),grey:surface('fineOak',0x918479,.93),
    stone:surface('stairStone',0xa09585,.97),plaster:surface('plaster',0xb9ae9b,.97),lime:surface('plaster',0xc9bcaa,.96),
    iron:new T.MeshStandardMaterial({color:0x484139,metalness:.45,roughness:.84}),
    brass:new T.MeshStandardMaterial({color:0x92764b,metalness:.43,roughness:.68}),
    glass:new T.MeshStandardMaterial({color:0xf0cf91,emissive:0xf2a461,emissiveIntensity:.72,roughness:.58}),
    ...stairMaterials(T)
  };
  const profile=atticStair(lower),{rise,mid,tread}=profile;
  const kit=parent=>architectureKit(T,parent,m);
  const k=kit(stair),up=kit(root);
  const box=(k,key,x0,x1,y0,y1,z0,z1)=>k.box(key,at,x0,x1,y0,y1,z0,z1);
  const beam=(k,key,a,b,width,depth)=>{
    const from=new T.Vector3(...a),v=new T.Vector3(...b).sub(from),length=v.length();
    if(length<.001)return;
    k.geometry(key,unitBox,new T.Matrix4().compose(from.addScaledVector(v,.5),
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()),new T.Vector3(width,length,depth)));
  };
  const unitBox=new T.BoxGeometry();

  // The two flights rise to a common rear landing. Their treads and the floor
  // query use the same dimensions, including both nosings at the turn.
  for(let j=0;j<w.steps;j++){
    const loY=lower+(j+1)*rise,hiY=mid+(j+1)*rise;
    const treadBox=(a,b,low,high,y,dir)=>{
      box(k,'jamb',a+.012,b-.012,y-rise,y-.046,low,high);
      box(k,j%4===1?'oak':'tread',a+.006,b-.006,y-.046,y,low-(dir===1?.013:0),high+(dir===-1?.013:0));
      const lip=dir===1?low-.014:high+.014;
      box(k,'nose',a+.009,b-.009,y-.038,y-.008,lip-.006,lip+.006);
      for(const x of [a+.071,b-.071]){
        box(k,'forged',x-.011,x+.011,y+.0006,y+.0027,lip+dir*.042-.007,lip+dir*.042+.007);
      }
    };
    treadBox(w.left,w.innerLeft,tread(j),tread(j+1),loY,1);
    treadBox(w.innerRight,w.right,tread(w.steps-j-1),tread(w.steps-j),hiY,-1);
  }
  box(k,'dark',w.left,w.right,mid-.175,mid-.037,w.turn,w.far);
  for(let z=w.turn,j=0;z<w.far-.005;z+=.149,j++){
    box(k,j%3===0?'oak':'tread',w.left+.006,w.right-.006,mid-.037,mid,z,Math.min(w.far,z+.146));
  }
  for(const x of [w.left+.04,w.innerLeft-.033]){
    beam(k,'dark',[x,lower-.090,w.start-.028],[x,mid-.141,w.turn+.035],.068,.208);
  }
  for(const x of [w.innerRight+.034,w.right-.035]){
    beam(k,'dark',[x,mid-.117,w.turn+.035],[x,F-.129,w.start-.028],.069,.208);
  }
  box(k,'plaster',w.left-.088,w.left,lower,10.35,-.78,w.far);
  box(k,'jamb',w.left-.102,w.left+.021,lower+.024,lower+.144,-.776,w.far-.013);
  box(k,'stone',w.left-.146,w.left+.014,lower,lower+2.50,-.819,-.765);
  box(k,'stone',w.left-.146,w.left+.014,lower+2.39,lower+2.55,w.cutNear,-.765);
  const plateZ=-.23,plateY=lower+1.65;
  box(k,'dark',w.left-.112,w.left-.088,plateY-.162,plateY+.162,plateZ-.265,plateZ+.265);
  for(const y of [plateY-.140,plateY+.140])for(const z of [plateZ-.244,plateZ+.244])
    box(k,'brass',w.left-.116,w.left-.110,y-.012,y+.012,z-.012,z+.012);
  const signCanvas=document.createElement('canvas');signCanvas.width=448;signCanvas.height=250;
  const pen=signCanvas.getContext('2d');pen.fillStyle='#343b35';pen.fillRect(0,0,448,250);
  pen.strokeStyle='#ac9970';pen.lineWidth=3;pen.strokeRect(11,11,426,228);
  for(let j=0;j<540;j++){
    pen.fillStyle=j%4?'#b99a6621':'#14191555';
    pen.fillRect(j*142.39%448,j*181.68%250,1+j%4,1+j%2);
  }
  pen.textAlign='center';pen.fillStyle='#e6d2a2';pen.font='bold 43px Georgia';
  pen.fillText('DIENSTTREPPE',224,112,394);
  pen.font='27px Georgia';pen.fillText('II. OBERGESCHOSS',224,169,379);
  const signTexture=new T.CanvasTexture(signCanvas);signTexture.colorSpace=T.SRGBColorSpace;
  const sign=new T.Mesh(new T.PlaneGeometry(.463,.275),
    new T.MeshStandardMaterial({map:signTexture,roughness:.88}));
  sign.name='Diensttreppe · altes Hinweisschild';sign.rotation.y=-Math.PI/2;
  sign.position.set(w.left-.114,plateY,plateZ);stair.add(sign);
  box(k,'plaster',w.innerLeft,w.innerRight,lower,F,w.cutNear,w.turn-.025);
  lowerWorld.box(w.left-.088,-.78,w.left,w.far);
  lowerWorld.box(w.innerLeft,w.cutNear,w.innerRight,w.turn-.025);
  lowerWorld.box(w.left,w.far,w.right,w.far+.025);

  // Loft shell and floor: separate rectangles leave a genuine opening, not
  // a dark blocker laid over the staircase.
  const deck=(x0,x1,z0,z1)=>{
    box(up,'dark',x0,x1,F-.161,F-.039,z0,z1);
    for(let z=z0,i=0;z<z1-.008;z+=.308,i++){
      const b=Math.min(z1,z+.305);
      for(let x=x0,j=0;x<x1-.010;j++){
        const end=Math.min(x1,x+(j===0?1.15+i%4*.58:3.11));
        const grain=(i*13+j*7)%9;
        box(up,grain===0?'grey':grain<3?'pale':grain===3?'edge':'oak',x,end-.004,F-.039,F,z,b);
        x=end;
      }
    }
  };
  deck(-X,w.left,-Z,Z);
  deck(w.left,w.right,-Z,w.start);deck(w.left,w.right,w.far,Z);
  deck(w.right,X,-Z,Z);
  for(const [a,b,c,d] of [
    [w.left-.088,w.left,w.start,w.far],
    [w.left,w.innerRight,w.start-.08,w.start],
    [w.left,w.right,w.far,w.far+.09]
  ]){
    atticWorld.box(a,c,b,d);
  }
  dressStairWell(T,{k,up,box,beam,w,lower,F,mid});
  // These keep a diagonal approach from hopping off the return flight.
  atticWorld.box(w.innerLeft,w.start,w.innerRight,w.turn-.025);
  atticWorld.box(w.right,w.start,w.right+.09,w.far);
  box(up,'stone',-X,X,C,C+.105,-Z,Z);
  for(const s of [-1,1]){
    const x=s*X,za=s*Z;
    box(up,'plaster',-X+.155,X-.155,F-.025,C,za-.094,za+.094);
    box(up,'stone',x-.155,x+.155,F-.025,C,-Z-.094,Z+.094);
    box(up,'dark',-X+.155,X-.155,F,F+.122,za-.136,za+.136);
    atticWorld.box(-X,za-.094,X,za+.094);
    atticWorld.box(x-.155,-Z,x+.155,Z);
  }
  for(const x of [-10.65,10.65]){
    for(const [a,b] of [[-Z+.094,-1.105],[1.105,Z-.094]]){
      box(up,'lime',x-.092,x+.092,F,C,a,b);
      box(up,'stone',x-.113,x+.113,F,F+.212,a,b);
      atticWorld.box(x-.092,a,x+.092,b);
    }
    box(up,'lime',x-.092,x+.092,F+2.54,C,-1.105,1.105);
    box(up,'dark',x-.136,x+.136,F+2.44,F+2.60,-1.22,1.22);
    for(const z of [-1.111,1.111])box(up,'edge',x-.128,x+.128,F,F+2.43,z-.045,z+.045);
    box(up,'stone',x-.243,x+.243,F,F+.015,-1.06,1.06);
  }
  for(let x=-29.2,i=0;x<X-1;x+=3.73,i++){
    box(up,i%3?'dark':'oak',x-.127,x+.127,C-.247,C-.006,-Z+.105,Z-.105);
    for(const s of [-1,1]){
      box(up,'edge',x-.166,x+.166,C-.367,C-.240,s*Z-.105,s*Z+.105);
      if(i%3!==0)continue;
      // Blind recesses, lath and old shutters; no holes to unloaded scenery.
      const z=s*(Z-.107),f=d=>z-s*d;
      const lining=(key,a,b,y0,y1,u,v)=>box(up,key,a,b,y0,y1,Math.min(f(u),f(v)),Math.max(f(u),f(v)));
      lining('stone',x+.52,x+1.88,F+.65,F+2.59,0,.061);
      lining('dark',x+.64,x+1.76,F+.80,F+2.43,.065,.098);
      for(let j=0;j<7;j++)lining(j%3?'oak':'grey',x+.665+j*.153,x+.810+j*.153,F+.841,F+2.38,.10,.134);
      for(const y of [F+1.065,F+2.052])lining('edge',x+.625,x+1.775,y,y+.083,.140,.197);
      lining('stone',x+.49,x+1.92,F+.63,F+.754,.072,.248);
    }
  }
  // A few supply trestles and a folded drop cloth indicate storage without
  // filling the halls meant for a later fit-out.
  for(const [x,z] of [[-26.5,5.7],[-7.6,-6.5],[20.8,6.85]]){
    for(const a of [x-.70,x+.70]){
      beam(up,'oak',[a,F,z-.31],[a,F+.75,z-.17],.081,.082);
      beam(up,'oak',[a,F,z+.31],[a,F+.75,z+.17],.081,.082);
      box(up,'edge',a-.095,a+.095,F+.70,F+.78,z-.32,z+.32);
      atticWorld.box(a-.112,z-.34,a+.112,z+.34);
    }
    for(let i=0;i<3;i++)box(up,i%2?'pale':'grey',x-1.03+i*.09,x+1.02+i*.05,F+.78+i*.033,F+.810+i*.033,z-.17+i*.093,z+.21);
  }
  const lamp=(k,x,y,z)=>{
    box(k,'iron',x-.017,x+.017,y+.015,C-.10,z-.018,z+.018);
    box(k,'iron',x-.157,x+.157,y-.053,y+.021,z-.157,z+.157);
    box(k,'glass',x-.109,x+.109,y-.126,y-.050,z-.109,z+.109);
    for(const a of [-.123,.123])for(const b of [-.123,.123])box(k,'iron',x+a-.012,x+a+.012,y-.148,y-.040,z+b-.012,z+b+.012);
    box(k,'brass',x-.145,x+.145,y-.158,y-.141,z-.144,z+.144);
  };
  const lightSpots=[[-25.3,-2],[-16.1,2.45],[-5,-2.45],[4.9,2.45],[15.75,-2.45],[25.3,2.15],[30.42,-2.2]];
  for(const [x,z] of lightSpots)lamp(up,x,C-.58,z);
  const hemi=new T.HemisphereLight(0xdfd5c4,0x8e8271,1.08);
  const lights=Array.from({length:3},()=>new T.PointLight(0xffd8a5,30,14.5,2));
  root.add(hemi,...lights);
  up.flush(root.name);k.flush(stair.name);unitBox.dispose();
  for(const [group,layer] of [[root,ATTIC_LAYER],[stair,lowerLayer]])group.traverse(o=>{
    o.layers.set(layer);if(o.isMesh)o.castShadow=false;
  });
  function inside(p){
    return p.y>=F-.07&&inPlan(p.x,p.z)&&(!inWell(p.x,p.z)||p.x>=w.innerRight&&p.z<=tread(1)+.036);
  }
  const linked=p=>p.x>=26.4&&p.x<=X+.1&&p.z>-3.5&&p.z<2.9;
  function floorAt(x,z,y){
    if(!inPlan(x,z)||y<lower-.25)return null;
    if(inWell(x,z))return profile.floorAt(x,z,y);
    if(y>=F-profile.rise-.033)return F;
    return null;
  }
  return {root,stair,inside,linked,floorAt,
    ceilingAt(x,z,y){
      if(y>=F-.08&&inPlan(x,z)||y>=lower-.23&&inWell(x,z))return C-.26;
      return null;
    },
    downSnap(x,z){return inWell(x,z)||x>=w.left-.03&&x<=w.right+.03&&Math.abs(z-w.start)<=.10?rise+.012:null;},
    update(p,upper){
      const high=inside(p),join=linked(p),show=high||upper&&join,showStair=upper&&(!high||join);
      const changed=root.visible!==show||stair.visible!==showStair;
      root.visible=show;stair.visible=showStair;
      if(show){
        // Slide a fixed light budget across the large halls. Nearby fixtures
        // light the landing and whichever hall is in view.
        const i=Math.max(0,Math.min(lightSpots.length-3,lightSpots.findIndex(([x])=>x>=p.x)-1));
        for(let j=0;j<lights.length;j++){
          const [x,z]=lightSpots[p.x>lightSpots.at(-1)[0]?lightSpots.length-3+j:i+j];
          lights[j].position.set(x,C-1,z);
        }
      }
      return changed;
    }
  };
}
