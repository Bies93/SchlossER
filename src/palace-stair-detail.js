import {sharedSet} from './surface-detail.js';

export function stairMaterials(T){
  const surf=(kind,color,roughness,n=.7,metalness=0)=>new T.MeshStandardMaterial({
    ...sharedSet(T,kind,512),color,roughness,metalness,normalScale:new T.Vector2(n,n)
  });
  return {
    joint:surf('plaster',0x756c5c,.97,.62),
    ashlar:surf('stairStone',0xbeab91,.94,.95),sand:surf('stairStone',0xa49a86,.96,.93),
    patch:surf('galleryStone',0xc6baa1,.96,.74),slate:surf('galleryStone',0x626f6e,.88,.78),
    tread:surf('wood',0x967f62,.77,.82),nose:surf('fineOak',0xb08d63,.68,.68),
    varnish:surf('fineOak',0x99704c,.56,.68),jamb:surf('fineOak',0x604c3d,.86,.62),
    forged:surf('cutMetal',0x434c4a,.70,.77,.52),darkBolt:surf('cutMetal',0x292e2a,.72,.58,.54)
  };
}

export function dressStairWell(T,{k,up,box,beam,w,lower,F,mid}){
  const pi=Math.PI,span=w.turn-w.start,turnY=mid;
  const cyl=new T.CylinderGeometry(1,1,1,12),top=new T.CylinderGeometry(.74,1,1,12);
  const foot=new T.Vector3(),dir=new T.Vector3(),axis=new T.Vector3(0,1,0),size=new T.Vector3(),q=new T.Quaternion(),m=new T.Matrix4();
  function rod(batch,name,A,B,r,profile=cyl){
    foot.fromArray(A);dir.fromArray(B).sub(foot);const length=dir.length();if(length<.001)return;
    batch.geometry(name,profile,m.compose(foot.addScaledVector(dir,.5),q.setFromUnitVectors(axis,dir.normalize()),size.set(r,length,r)));
  }
  const quad=(key,P,a,b,lo,hi,d,seed=0)=>k.quad(key,P(a,lo,d),P(b,lo,d),P(b,hi,d),P(a,hi,d),.68,seed);
  // Reveal faces are pushed past the old plaster, not built directly on
  // its plane. Recessed mortar is continuous behind the individual blocks.
  function stoneWall(P,a,b,low,high){
    quad('joint',P,a,b,low,high,.004);
    for(let row=0,y=low;y<high-.014;row++,y+=.323){
      const Y=Math.min(high,y+.317);
      for(let j=0,u=a-(row%2?.245:0);u<b-.012;j++,u+=.51){
        const l=Math.max(a,u)+.004,r=Math.min(b,u+.51)-.004;
        if(r-l<.012)continue;
        const key=(row*2+j)%7===0?'patch':(row+j*3)%5===1?'sand':'ashlar';
        quad(key,P,l,r,y+.004,Y-.005,.012+(row+j)%3*.002,row*.081+j*.113);
      }
    }
  }
  const west=(u,y,d)=>[w.left+d,y,-u],outer=(u,y,d)=>[w.right-.084-d,y,u],
    dividerWest=(u,y,d)=>[w.innerLeft-d,y,u],dividerEast=(u,y,d)=>[w.innerRight+d,y,-u],
    back=(u,y,d)=>[-u,y,w.far+.011-d];
  stoneWall(west,-w.far,.758,lower+.13,F-.183);
  stoneWall(outer,w.cutNear+.017,w.far-.015,lower+.09,F+.97);
  stoneWall(dividerWest,w.cutNear+.020,w.turn-.034,lower+.12,F-.023);
  stoneWall(dividerEast,-w.turn+.034,-w.cutNear-.018,lower+.12,F-.023);
  stoneWall(back,-w.right+.10,-w.left+.004,lower+.11,F-.182);

  // A slate dado follows the rake rather than running through the treads.
  function rake(P,a,b,y,section){
    const band=(key,l,r,base,high,d)=>k.quad(key,P(l,y(l)+base,d),P(r,y(r)+base,d),P(r,y(r)+high,d),P(l,y(l)+high,d),.59,l*.25);
    band('joint',a,b,.021,.415,.025);
    const n=Math.ceil((b-a)/section);
    for(let i=0;i<n;i++){
      const u=a+i*(b-a)/n,v=a+(i+1)*(b-a)/n;
      band(i%3?'slate':'sand',u+.004,v-.004,.032,.383,.035);
    }
    band('nose',a,b,.377,.422,.043);
    band('jamb',a,b,.427,.450,.031);
  }
  const rising=z=>lower+(z-w.start)/span*(mid-lower);
  const returning=z=>F-(z-w.start)/span*(F-mid);
  rake(west,-w.turn,.757,u=>rising(-u),.23);
  rake(dividerWest,w.start+.025,w.turn-.037,rising,.23);
  rake(outer,w.start+.008,w.turn-.012,returning,.23);
  rake(dividerEast,-w.turn+.035,-w.start-.013,u=>returning(-u),.23);
  rake(back,-w.right+.105,-w.left+.017,()=>mid-.003,.32);
  // A continuous corner post masks the textured edges only; collision still
  // uses the original shaft dimensions.
  box(k,'jamb',w.innerLeft-.014,w.innerRight+.017,mid-.12,F-.022,w.turn-.054,w.turn-.021);
  const join=(P,u,y)=>P(u,y,.067);
  function handrail(P,a,b,height){
    const first=join(P,a,height(a)),last=join(P,b,height(b));
    beam(k,'varnish',first,last,.055,.066);
    beam(k,'nose',P(a,height(a)+.031,.074),P(b,height(b)+.031,.074),.041,.021);
    for(const u of [a,a+(b-a)*.31,a+(b-a)*.68,b]){
      const y=height(u);
      rod(k,'forged',P(u,y-.122,.005),P(u,y-.122,.035),.035);
      rod(k,'darkBolt',P(u,y-.122,.036),P(u,y-.122,.045),.013);
      rod(k,'forged',P(u,y-.122,.032),P(u,y-.103,.071),.013);
      rod(k,'forged',P(u,y-.103,.071),P(u,y-.026,.069),.014);
    }
    for(const u of [a,b])rod(k,'forged',P(u-.012,height(u),.067),P(u+.012,height(u),.067),.030);
  }
  handrail(dividerWest,w.start+.057,w.turn-.108,z=>rising(z)+.93);
  handrail(outer,w.start+.059,w.turn-.092,z=>returning(z)+.91);
  handrail(back,-w.right+.20,-w.left+.16,()=>turnY+.94);

  const sconce=(P,u,y)=>{
    rod(k,'darkBolt',P(u,y,.006),P(u,y,.034),.124);
    rod(k,'brass',P(u,y-.17,.030),P(u,y-.125,.127),.018);
    for(const t of [-.103,.113])rod(k,'forged',P(u,y+t-.013,.123),P(u,y+t+.016,.123),.083,top);
    rod(k,'glass',P(u,y-.102,.123),P(u,y+.109,.123),.058);
    for(let j=0;j<6;j++){
      const a=j*pi/3;
      rod(k,'forged',P(u+Math.cos(a)*.072,y-.111,.123+Math.sin(a)*.072),
        P(u+Math.cos(a)*.072,y+.119,.123+Math.sin(a)*.072),.007);
    }
    rod(k,'brass',P(u,y+.115,.123),P(u,y+.151,.123),.026,top);
  };
  sconce(west,-.08,lower+2.32);
  sconce(back,-31.13,mid+1.83);
  sconce(outer,-1.31,F+.52);

  // Fascia sits inside the opening so its exposed face is never in the
  // same plane as the deck slab. No raised curb crosses the walkable lane.
  const rails=[
    {a:w.start-.069,b:w.far+.068,C:(u,y,v)=>[w.left-.056+v,y,u],crossX:true},
    {a:w.left-.056,b:w.innerRight+.015,C:(u,y,v)=>[u,y,w.start-.069+v],crossX:false},
    {a:w.left-.056,b:w.right-.10,C:(u,y,v)=>[u,y,w.far+.068-v],crossX:false}
  ];
  for(const [idx,{a,b,C,crossX}] of rails.entries()){
    const face=idx===0?(u,y,d)=>[w.left+.014+d,y,u]:
      idx===1?(u,y,d)=>[u,y,w.start+.014+d]:(u,y,d)=>[u,y,w.far-.014-d];
    const lo=(idx===0?w.start:w.left)+.017;
    const hi=idx===0?w.far-.017:idx===1?w.innerRight+.006:w.right-.092;
    // A real square apron, deep enough to cover the end grain of the joists.
    if(crossX)box(up,'jamb',w.left-.035,w.left+.019,F-.174,F+.011,lo,hi);
    else {
      const z=idx===1?w.start:w.far;
      box(up,'jamb',lo,hi,F-.176,F+(idx===1?.002:.015),z-.020,z+.021);
    }
    for(let i=0,u=lo+.075;u<hi-.058;i++,u+=.405){
      const ends=idx===1?[face(u,F-.095,.001),face(u,F-.095,.017)]:[face(u,F-.107,.014),face(u,F-.107,.021)];
      rod(up,i%3?'forged':'brass',...ends,.014,top);
    }
    const start=idx===0?a+.035:a+.053,end=idx===0?b-.036:b-.041;
    // Leave a small joint at the mitred corners; one main post carries
    // each junction rather than two copies occupying the same position.
    beam(up,'jamb',C(start,F+.123,0),C(end,F+.123,0),.046,.047);
    beam(up,'varnish',C(start,F+.950,0),C(end,F+.950,0),.075,.062);
    beam(up,'nose',C(start,F+.989,0),C(end,F+.989,0),.056,.016);
    const n=Math.ceil((end-start)/.209);
    for(let i=idx===0?0:1;i<=n;i++){
      const u=start+(end-start)*i/n,large=i===0||i===n;
      rod(up,'forged',C(u,F+.043,0),C(u,F+.936,0),large?.029:.012);
      const cap=large?.050:.025;
      rod(up,'darkBolt',C(u,F+.016,0),C(u,F+.065,0),cap,top);
      rod(up,'forged',C(u,F+.176,0),C(u,F+.214,0),large?.038:.019);
      rod(up,'forged',C(u,F+.879,0),C(u,F+.919,0),large?.040:.020,top);
      if(!large&&i%2===1){
        rod(up,'forged',C(u-.032,F+.448,0),C(u+.032,F+.508,0),.008);
        rod(up,'forged',C(u+.032,F+.508,0),C(u-.032,F+.569,0),.008);
      }
    }
  }
  cyl.dispose();top.dispose();
}
