// Scaled room props emitted into the tavern's static finish batches.
export function tankard(k,x,y,z,finish='clay',style=0){
  const w=[.062,.057,.071,.051][style%4],h=[.172,.143,.154,.126][style%4];
  const r=w*.95;
  k.profile(finish,x,y,z,[[0,.003],[w*.88,.003],[w*.99,.012],[w*.96,.033],[w,.056],[w*.99,h*.78],
    [w*1.07,h*.96],[w*1.055,h],[r,h+.003],[r,h-.012],[r*.91,h-.042],[w*.79,.027],[0,.027]]);
  k.profile('glaze',x,y,z,[[w*.99,h-.017],[w*1.069,h-.008],[w*1.073,h],[w*1.036,h+.003],[r,h+.001]]);
  k.profile(style===1?'brass':'iron',x,y,z,[[w*.89,.008],[w*1.015,.012],[w*1.012,.022],[w*.94,.036]],{segments:20});
  for(const f of [.34,.68])k.profile(style===2?'slate':'glaze',x,y,z,[[w*.983,h*f-.005],[w*1.014,h*f-.003],[w*1.014,h*f+.003],[w*.982,h*f+.006]],{segments:20});
  k.tube(finish,[[x+w*.88,y+h*.82,z],[x+w*1.51,y+h*.78,z],[x+w*1.64,y+h*.57,z],
    [x+w*1.47,y+h*.38,z],[x+w*.88,y+h*.33,z]],w*.132,10,6);
  if(style%4===1){
    k.profile('glaze',x,y+h+.006,z,[[r,0],[w*1.10,.009],[w*.86,.015],[w*.49,.024],[0,.029]],{segments:20});
    k.oval('brass',x+w*.90,y+h+.016,z-.014,.015,.007,.011);
    k.oval('glaze',x+w*1.04,y+h+.019,z-.019,.014,.005,.011);
  }else{
    k.cyl('beer',x,y+h-.028,z,r*.9,.007);
    if(style!==3){
      k.cyl('foam',x,y+h-.020,z,r*.88,.017);
      for(let i=0;i<6;i++){
        const a=i*2.39996,R=w*(.17+(i%4)*.14);
        k.oval('foam',x+Math.cos(a)*R,y+h-.008,z+Math.sin(a)*R,.012,.006,.009);
      }
    }
  }
}
export function beerGlass(k,x,y,z,wine=false){
  const w=wine?.047:.040,h=wine?.137:.149;
  k.profile('glass',x,y,z,wine?
    [[0,0],[.039,0],[.040,.006],[.009,.014],[.006,.056],[.027,.069],[w,h-.023],[w,h],[w-.004,h],[w-.006,h-.021],[.023,.071],[.004,.061]]:
    [[0,0],[w*.94,0],[w*.97,.010],[w*.87,.018],[w,h],[w*.92,h],[w*.60,.018],[0,.018]]);
  const fill=wine?[.068,.103]:[.020,.111];
  k.profile(wine?'wine':'beer',x,y,z,[[0,fill[0]],[w*(wine?.38:.61),fill[0]],[w*(wine?.83:.87),fill[1]],[0,fill[1]]]);
  if(!wine)k.oval('foam',x,y+.117,z,w*.87,.009,w*.87);
  // Catchlights along the weighted base and rim without another light.
  k.profile('glaze',x,y,z,[[w*.90,h-.004],[w*1.004,h-.003],[w*1.006,h],[w*.88,h+.002]],{segments:20});
}
export function boardSnack(k,x,y,z,side=0){
  k.profile('edge',x,y,z,[[0,.006],[.158,.006],[.171,.009],[.174,.018],[.165,.027],[0,.028]],{segments:24});
  k.ring('dark',x,y+.029,z,.153,.148,.042,-Math.PI/2);
  if(side){
    for(let i=0;i<3;i++){
      const xx=x+(i-1)*.047,zz=z+(i%2)*.037;
      k.oval('rind',xx,y+.044,zz,.041,.017,.055);
      k.oval('cheese',xx-.002,y+.054,zz,.038,.011,.051);
      k.oval('green',xx+.015,y+.062,zz-.016,.014,.004,.004);
    }
    for(let i=0;i<5;i++)k.oval('crust',x-.043+i*.022,y+.041,z-.069,.029,.016,.022);
  }else{
    // Intertwined bent dough, including the crossed arms and coarse salt.
    const c=[[-.072,-.061],[-.110,-.026],[-.089,.039],[-.035,.071],[.044,.073],[.105,.038],
      [.109,-.027],[.081,-.061],[.039,-.044],[-.015,.017],[-.049,.047],[-.060,.066]];
    const shape=c.map(([a,b],i)=>[x+a,y+.052+(i>=8?.010:0),z+b]);
    k.tube('crust',shape,.020,34,7);
    k.tube('rind',[[x-.073,y+.053,z-.061],[x-.034,y+.063,z-.044],[x+.010,y+.068,z+.004],[x+.066,y+.062,z+.069]],.018,16);
    for(let i=0;i<25;i++){
      const [xx,Y,zz]=shape[(i*19)%shape.length];
      k.box('salt',xx+Math.sin(i*14)*.013,Y+.019,zz+Math.cos(i*6)*.009,.007+(i%3)*.0005,.004,.007);
    }
  }
}
export function cask(k,x,y,z,r,span,style){
  const rows=[[.84,-.50],[.89,-.47],[.97,-.27],[1,-.085],[1,.09],[.97,.27],[.89,.48],[.84,.50]];
  const pt=(radius,h)=>[radius*r,h*span];
  k.profile(style===2?'edge':'oak',x,y,z,[[0,-.5*span],...rows.map(([a,b])=>pt(a,b)),[0,.5*span]],{segments:32,rx:Math.PI/2});
  // The curvature stays readable because the stave seams follow the belly.
  for(let j=0;j<26;j++){
    const a=j*Math.PI/13,coords=rows.map(([scale,h])=>[x+Math.cos(a)*(scale*r+.0004),y+Math.sin(a)*(scale*r+.0004),z+h*span]);
    k.tube(j%6===0?'edge':'dark',coords,.0042,9,4);
  }
  for(const b of [-.404,-.206,.212,.407]){
    const rr=r*(Math.abs(b)>.30?.931:.987);
    k.profile('iron',x,y,z,[[rr,b*span-.027],[rr+.009,b*span-.024],[rr+.01,b*span+.024],[rr,b*span+.028]],
      {segments:28,rx:Math.PI/2});
    for(let i=0;i<10;i++){
      const a=(i+1)*Math.PI/5;
      k.oval('copper',x+Math.cos(a)*(rr+.013),y+Math.sin(a)*(rr+.013),z+b*span,.010,.010,.009);
    }
  }
  const front=z+span*.5;
  k.cyl('edge',x,y,front+.006,r*.794,.021,Math.PI/2);
  k.ring('dark',x,y,front+.017,r*.748,r*.748,.11);
  for(let i=-2;i<=2;i++){
    const yy=i*r*.223,w=Math.sqrt((r*.736)**2-yy**2);
    k.box('oak',x,y+yy,front+.018,w*2,.007,.009);
  }
  k.cyl('brass',x,y-r*.375,front+.033,.040,.062,Math.PI/2);
  k.tube('copper',[[x,y-r*.39,front+.037],[x,y-r*.39,front+.105],[x,y-r*.46,front+.146]],.019,10);
  k.cyl('iron',x,y-r*.315,front+.093,.018,.081);
  k.oval('dark',x,y-r*.229,front+.092,.041,.013,.019);
}
