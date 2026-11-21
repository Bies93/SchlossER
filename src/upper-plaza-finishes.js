import {architectureKit} from './architecture-kit.js';
import {randomSource,sharedSet} from './surface-detail.js';
import {plazaFinishAtlas} from './upper-plaza-art.js';

const pi=Math.PI,at=(x,y,z)=>[x,y,z];
const colors=[
  ['fineOak',0xb19770,0x906b50,0xc0ad88,.98,.17,0x88745b,0xb5aa8d],
  ['labTile',0x98aba4,0x6d8886,0x566f72,.51,.51,0x6f8381,0xa6b4a9],
  ['fineOak',0x8e735b,0xa68b69,0x694d42,.79,.28,0x756c58,0xb9a98f],
  ['stairStone',0xa6957e,0x83796c,0x6e4a45,.57,.57,0x805450,0xa5947d],
  ['stairStone',0xaaa18e,0x878f7d,0x69766d,.40,.40,0x74836c,0xbaaa8c],
  ['fineOak',0x997754,0x887765,0x6c715f,1.09,.141,0x787669,0xa59b83],
  ['stairStone',0x9caaa6,0x7f8b8d,0x5e6b76,.57,.57,0x768a8a,0xb0bdba],
  ['stairStone',0x776f62,0x8a8376,0x686860,.99,.82,0x767260,0xaaa08b]
];
export function plazaFinishMaterials(T){
  const surface=(color,kind,n=.64)=>new T.MeshStandardMaterial({
    color,roughness:.87,...sharedSet(T,kind,512),normalScale:new T.Vector2(n,n)
  });
  const result={
    finishArt:plazaFinishAtlas(T),
    seam:surface(0x605848,'stairStone'),hallTile:surface(0xc6b898,'stairStone'),
    hallEdge:surface(0x897662,'stairStone'),hallIvory:surface(0xd1c3a7,'galleryLime'),
    railWood:surface(0x8c6b4f,'fineOak'),hallGreen:surface(0x9aa192,'galleryLime'),
    braid:surface(0xb09664,'canvas'),fabricEdge:surface(0x4b3b34,'canvas'),
  };
  colors.forEach(([kind,a,b,c,,,wood,plaster],i)=>{
    result['pFloor'+i]=surface(a,kind);result['pVariation'+i]=surface(b,kind);result['pAccent'+i]=surface(c,kind);
    result['pTrim'+i]=surface(wood,i===1||i===6||i===7?'enamel':'fineOak',.61);
    result['pWall'+i]=surface(plaster,i===1||i===6?'labTile':'galleryLime',.47);
  });
  return result;
}
function flat(k,key,coords,l,r,start,end,y,repeat=1.3,offset=0){
  k.quad(key,coords(l,y,start),coords(l,y,end),coords(r,y,end),coords(r,y,start),repeat,offset);
}
function carpet(k,pos,box,tile,u,d,W,L,alongX=false){
  const y=.015,U=.25*tile+.004,V=.004,U2=U+.242,V2=.496;
  const a=pos(u-W/2,y,d-L/2),b=pos(u-W/2,y,d+L/2),c=pos(u+W/2,y,d+L/2),e=pos(u+W/2,y,d-L/2);
  box('fabricEdge',u,.007,d,W+.018,.014,L+.018);
  if(alongX){
    k.triangle('finishArt',a,b,c,[U,V,U2,V,U2,V2]);k.triangle('finishArt',a,c,e,[U,V,U2,V2,U,V2]);
  }else{
    k.triangle('finishArt',a,b,c,[U,V2,U,V,U2,V]);k.triangle('finishArt',a,c,e,[U,V2,U2,V,U2,V2]);
  }
  const length=alongX?L:W;
  for(let s=-length*.46;s<length*.47;s+=.055)for(const sign of [-1,1]){
    const fringe=.027+.002*Math.cos(155*s);
    if(alongX)box('braid',u+sign*(W/2+fringe*.48),.004,d+s,fringe,.005,.013);
    else box('braid',u+s,.004,d+sign*(L/2+fringe*.48),.013,.005,fringe);
  }
}

export function dressPlazaFinishes(k,{i,w,parts,pos,box,ceiling,rear}){
  const [,,,,W,D]=colors[i],rng=randomSource(7131+i*113),trim='pTrim'+i,wall='pWall'+i;
  const panels=i===3?1.49:i===1||i===6?1.43:1.02;
  for(const [l,r,depth] of parts){
    flat(k,'seam',pos,l,r,.12,depth,-.008);
    for(let j=0,d=.12;d<depth-.01;j++,d+=D){
      const end=Math.min(depth,d+D),offset=(i%2===0&&j%2)?W*.5:0;
      for(let n=0,x=l-offset;x<r-.009;n++,x+=W){
        const a=Math.max(x,l)+.004,b=Math.min(x+W,r)-.004;
        if(b-a<.01||end-d<.016)continue;
        const st=i===3?(j+n)%5===2?'pAccent':(j+n)%2?'pVariation':'pFloor':
          i===4?(j*2+n)%7===0?'pAccent':(n+j)%3===0?'pVariation':'pFloor':rng()>.77?'pVariation':'pFloor';
        flat(k,st+i,pos,a,b,d+.004,end-.004,0,1.06,rng());
      }
    }
    if(i===3||i===4||i===6)
      for(const d of [.22,depth-.31])box(trim,(l+r)*.5,.004,d,r-l-.027,.007,.061);
    const Z=depth-.088;
    k.quad(wall,pos(r-.009,.112,Z),pos(l+.009,.112,Z),pos(l+.009,ceiling-.056,Z),pos(r-.009,ceiling-.056,Z),1.77);
    box(trim,(l+r)*.5,panels/2+.13,Z-.02,r-l-.039,panels-.15,.061);
    box(i===3?'bronze':trim,(l+r)*.5,panels+.052,Z-.044,r-l-.027,.048,.073);
    const C=ceiling-.014;
    k.quad(i===3?'hallIvory':wall,pos(l,C,.08),pos(r,C,.08),pos(r,C,depth),pos(l,C,depth),1.38);
    box(trim,(l+r)*.5,ceiling-.12,depth-.145,r-l-.03,.205,.185);
  }
  for(const s of [-1,1]){
    const u=s*(w-.158),d0=.216,d1=rear(u)-.21,C=ceiling-.092;
    box(trim,u,(panels+.115)*.5,(d0+d1)*.5,.086,panels-.115,d1-d0);
    box(i===3?'bronze':trim,u-s*.054,panels+.021,(d0+d1)*.5,.079,.045,d1-d0);
    box(trim,u-s*.020,C,(d0+d1)*.5,.164,.173,d1-d0);
    if(i===3||i===4||i===0){
      for(let d=.68;d<d1-.21;d+=1.01){
        box('railWood',u-s*.053,.576,d,.025,.72,.645);
        for(const a of [-.31,.31])box('braid',u-s*.071,.576,d+a,.019,.73,.025);
      }
      box('braid',u-s*.106,C-.098,(d0+d1)*.5,.027,.024,d1-d0);
    }else{
      for(let d=.62;d<d1-.25;d+=1.09)box('iron',u-s*.056,.59,d,.018,.846,.020);
    }
  }
  for(const d of [1.07,3.23,5.38]){
    box(trim,0,ceiling-.225,d,2*w-.30,.086,.099);
    for(const u of [-w+.45,0,w-.45])box(i===3?'bronze':'steel',u,ceiling-.185,d,.108,.154,.138);
  }
  function rug(tile,u,d,W,L){carpet(k,pos,box,tile,u,d,W,L);}
  if(i===0)rug(3,.20,2.54,1.62,1.92);
  if(i===2)rug(0,.13,4.04,1.08,2.28);
  if(i===3)rug(2,.12,4.39,2.19,4.36);
  if(i===4)rug(3,.22,2.01,1.43,1.86);
  if(i===5)rug(1,.04,2.34,2.74,2.09);
  if(i===6)rug(1,-2.28,2.75,.81,1.10);
}

export function dressUpperHall(T,parent,world,m,F,bays,roof,ceilingEnd=bays.at(-1)){
  const C=roof-F,Y=new T.Vector3(0,1,0),matrix=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),p=new T.Vector3(),v=new T.Vector3();
  const tube=new T.CylinderGeometry(1,1,1,14),ring=new T.TorusGeometry(1,.075,6,20);
  const segments=[];
  for(let i=0;i<bays.length-1;i++){
    const [l,r]=[bays[i],bays[i+1]],center=(l+r)*.5,cap=Math.min(r,ceilingEnd),capMid=(l+cap)*.5;
    const group=new T.Group();group.name='Obergeschoss · Längsgang '+(i+1);parent.add(group);segments.push({l,r,group});
    const k=architectureKit(T,group,m),pos=(x,y,z)=>[x,F+y,z];
    const box=(mat,x,y,z,w,h,d)=>k.box(mat,pos,x-w/2,x+w/2,y-h/2,y+h/2,z-d/2,z+d/2);
    const rod=(mat,A,B,r)=>{
      p.fromArray(pos(...A));v.fromArray(pos(...B)).sub(p);
      const n=v.length();k.geometry(mat,tube,matrix.compose(p.addScaledVector(v,.5),q.setFromUnitVectors(Y,v.normalize()),s.set(r,n,r)));
    };
    flat(k,'seam',pos,l,r,-1.85,1.85,-.006);
    for(let x=l;x<r-.008;x+=.68)for(let j=0;j<8;j++){
      const end=Math.min(r,x+.68),a=-1.85+j*.4625;
      flat(k,j===0||j===7?'hallEdge':(i+j)%4===1?'hallIvory':'hallTile',pos,x+.004,end-.004,a+.004,a+.459,0,1.04,(x-l)*.45+j*.19);
    }
    carpet(k,pos,box,0,center,0,r-l-.21,.94,true);
    // Pilaster and wall frames sit outside the 1.702 m openings.
    for(const sign of [-1,1]){
      const opening=center+sign*.37,z=sign*1.59;
      for(const x of [opening-.947,opening+.947]){
        box('railWood',x,1.373,z,.132,2.72,.111);
        box('bronze',x,2.597,z-sign*.035,.168,.098,.088);
        box('hallEdge',x,.124,z-sign*.023,.192,.208,.103);
      }
      box('railWood',opening,2.754,z,2.03,.177,.139);
      box('bronze',opening,2.798,z-sign*.075,1.98,.024,.025);
      for(const [A,B] of [[l+.12,opening-1.07],[opening+1.07,r-.12]]){
        if(B-A<.13)continue;
        box('hallGreen',(A+B)/2,.446,z,B-A,.663,.081);
        box('railWood',(A+B)/2,.788,z-sign*.029,B-A,.076,.092);
        box('railWood',(A+B)/2,.129,z-sign*.032,B-A,.087,.091);
        for(let x=A+.20;x<B-.13;x+=.73)box('bronze',x,.456,z-sign*.048,.015,.545,.022);
      }
      box('hallIvory',capMid,C-.092,z,cap-l,.188,.155);
      box('railWood',capMid,C-.222,z-sign*.042,cap-l,.097,.163);
    }
    if(i===1||i===3||i===6){
      const x=l+1.10,z=-1.347;
      box('railWood',x,.426,z,1.44,.071,.382);
      box('velvet',x,.48,z,1.36,.086,.352);
      box('darkWood',x,.706,z-.161,1.44,.293,.074);
      box('bronze',x,.854,z-.141,1.48,.041,.090);
      for(const s of [-1,1]){
        box('darkWood',x+s*.567,.218,z,.060,.435,.272);
        box('bronze',x+s*.567,.064,z,.091,.107,.28);
      }
      world.platform(x-.72,z-.19,x+.72,z+.19,F+.522);
      world.box(x-.72,z-.195,x+.72,z-.125);
    }
    if(i===0||i===4||i===7){
      // A small wing directory beside the door, assembled from the same enamel plates as the room labels.
      const x=l+1.21,z=1.533,base=1.64,W=1.13,H=.835;
      box('darkWood',x,base,z+.036,W+.096,H+.096,.073);
      box('bronze',x,base,z+.002,W+.033,H+.034,.018);
      box('iron',x,base,z-.010,W,H,.010);
      for(let j=0;j<8;j++){
        const n=(Math.floor(j/4)-.5)*.535,h=base+(.3-j%4*.199),a=x+n-.253,b=x+n+.253;
        const U=(j%4)*.25+.004,V=.750-Math.floor(j/4)*.25+.004,jump=.242;
        const A=pos(b,h-.085,z-.019),B=pos(a,h-.085,z-.019),C=pos(a,h+.085,z-.019),D=pos(b,h+.085,z-.019);
        k.triangle('finishArt',A,B,C,[U,V,U+jump,V,U+jump,V+jump]);
        k.triangle('finishArt',A,C,D,[U,V,U+jump,V+jump,U,V+jump]);
      }
    }
    // A closed coffering grid and centrally hung opal shade, mounted through the ceiling plane.
    k.quad('hallIvory',pos(l,C-.013,-1.65),pos(cap,C-.013,-1.65),pos(cap,C-.013,1.65),pos(l,C-.013,1.65),1.5);
    for(const x of [l+.21,center,cap-.21]){
      box('railWood',x,C-.251,0,.111,.093,3.09);
      box('bronze',x,C-.306,0,.123,.021,3.11);
      for(const z of [-1.12,0,1.12])box('railWood',x,C-.105,z,.092,.224,.092);
    }
    for(const z of [-1.11,1.11])box('railWood',capMid,C-.249,z,cap-l-.37,.080,.121);
    rod('bronze',[center,C-.244,0],[center,3.43,0],.021);
    rod('iron',[center,3.43,0],[center,3.50,0],.238);
    rod('filament',[center,3.35,0],[center,3.434,0],.186);
    for(const dy of [0,.081]){
      k.geometry('bronze',ring,matrix.compose(p.set(center,F+3.35+dy,0),q.setFromAxisAngle(v.set(1,0,0),pi/2),s.set(.203,.203,.125)));
    }
    for(let n=0;n<6;n++){
      const a=n*pi/3,x=center+Math.cos(a)*.202,z=Math.sin(a)*.202;
      rod('bronze',[x,3.35,z],[x,3.447,z],.012);
    }
    k.flush(group.name);group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  }
  tube.dispose();ring.dispose();
  return (p,inside)=>{
    let changed=false;
    for(const {l,r,group} of segments){
      const visible=inside&&p.x>l-24&&p.x<r+24;
      if(visible!==group.visible){group.visible=visible;changed=true;}
    }
    return changed;
  };
}
