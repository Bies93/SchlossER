import {HALL,WINGS} from './palace-openings.js';

// Each portal owns its complete wall, both cut faces and every opening-
// facing surface. Local depth 0 faces the approach, -depth faces the wing.
export function masonryPortal(k,p,{left,right,top,half=WINGS.portal,depth=.252,rim=.18,
  wall,stone,edge,joint}){
  const {floor}=HALL,{spring,rise}=WINGS,outer=half+rim,near=.072,far=-depth-.054;
  function face(mat,a,b,c,d,flip=false){
    const [A,B,C,D]=[a,b,c,d].map(v=>p(...v));
    if(mat===wall){
      // Use one wall-scale UV grid through the whole plaster skin. A fresh
      // UV island at each small arch segment leaves visible vertical bands.
      const uv=([t,y])=>[t/1.38,y/1.38];
      const q=(v,w,x,i,j,l)=>k.triangle(mat,v,w,x,[...uv(i),...uv(j),...uv(l)]);
      if(flip){q(A,C,B,a,c,b);q(A,D,C,a,d,c);}
      else{q(A,B,C,a,b,c);q(A,C,D,a,c,d);}
      return;
    }
    if(flip)k.quad(mat,B,A,D,C,1.38);
    else k.quad(mat,A,B,C,D,1.38);
  }
  // No closed boxes behind the lintel or beside the jamb. Putz and stone
  // share their boundary vertices in plan, but never cover the same face.
  for(const [d,flip] of [[0,false],[-depth,true]]){
    for(const [l,r] of [[left,-outer],[outer,right]])
      face(wall,[l,floor,d],[r,floor,d],[r,top,d],[l,top,d],flip);
  }
  function jamb(sign,y,Y,mat){
    const a=sign*half,b=sign*outer,l=Math.min(a,b),r=Math.max(a,b);
    for(const [d,flip] of [[near,false],[far,true]])
      face(mat,[l,y,d],[r,y,d],[r,Y,d],[l,Y,d],flip);
    face(mat,[a,y,near],[a,y,far],[a,Y,far],[a,Y,near],sign>0);
    for(const [d,f] of [[0,near],[far,-depth]])
      face(mat,[b,y,f],[b,y,d],[b,Y,d],[b,Y,f],sign<0);
  }
  for(const sign of [-1,1]){
    const stones=[floor,.245,.60,.976,1.342,1.698,2.072,spring];
    for(let i=0;i<stones.length-1;i++){
      const a=stones[i],b=stones[i+1],g=i<stones.length-2?.004:0;
      jamb(sign,a,b-g,i%3===1?edge:stone);
      if(g)jamb(sign,b-g,b,joint);
    }
    // Plinth and impost collars wrap only the stone. Their rear faces are
    // outside the main leaf so even the projecting edges are independent.
    const a=sign*(half-.012),b=sign*(outer+.032),l=Math.min(a,b),r=Math.max(a,b);
    for(const [d,f] of [[near-.008,near+.035],[far-.036,far+.008]]){
      k.box(edge,p,l,r,floor,floor+.142,d,f);
      k.box(edge,p,l,r,spring-.098,spring-.016,d,f);
    }
  }
  const c=(a,offset,d)=>[-Math.cos(a)*(half+offset),spring+Math.sin(a)*(rise+offset),d];
  const parts=13;
  for(let i=0;i<parts;i++){
    const a=i*Math.PI/parts,b=(i+1)*Math.PI/parts,g=i===parts-1?0:.005;
    const shape=(lo,hi,mat)=>{
      for(let j=0;j<3;j++){
        const u=lo+(hi-lo)*j/3,v=lo+(hi-lo)*(j+1)/3;
        // Cut the plaster at the OUTER ellipse, not at the clear opening.
        for(const [d,flip] of [[0,false],[-depth,true]]){
          const A=c(u,rim,d),B=c(v,rim,d);
          face(wall,A,B,[B[0],top,d],[A[0],top,d],flip);
        }
        face(mat,c(u,0,near),c(v,0,near),c(v,rim,near),c(u,rim,near));
        face(mat,c(u,0,far),c(v,0,far),c(v,rim,far),c(u,rim,far),true);
        face(mat,c(u,0,far),c(v,0,far),c(v,0,near),c(u,0,near));
        for(const [d,f] of [[0,near],[far,-depth]])
          face(mat,c(u,rim,f),c(v,rim,f),c(v,rim,d),c(u,rim,d));
      }
    };
    shape(a,b-g,i%3===1?edge:stone);
    if(g)shape(b-g,b,joint);
  }
}
