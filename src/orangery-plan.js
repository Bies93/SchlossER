// Model-space façade plan. The courtyard is east (+X) of its concave front.
export const ORANGERY_CENTER=-47;
export const orangeryWing=(side,t)=>[
  -60+.90*(1-t)**2+17*(1-Math.cos(1.2*t)),
  ORANGERY_CENTER+side*(6+24*Math.sin(t*1.2))
];
const [cornerX,cornerZ]=orangeryWing(-1,1);
export const ORANGERY_PAVILION_X=cornerX+.26;
export const ORANGERY_PAVILION_END=cornerZ-7.75;
export const ORANGERY_END_PIER=1.16;
export const ORANGERY_STATION={x:ORANGERY_PAVILION_X+.43,z:ORANGERY_PAVILION_END+ORANGERY_END_PIER*.50,yaw:Math.PI/2};

export const ORANGERY_HALL=Array.from({length:4},(_,i)=>[-59.10,ORANGERY_CENTER+6-i*4]);
export const orangeryWingPoints=side=>Array.from({length:8},(_,i)=>orangeryWing(side,i/7)).sort((a,b)=>b[1]-a[1]);
export const ORANGERY_SECTIONS=[
  {points:ORANGERY_HALL,depth:8.45,main:true},
  ...[-1,1].map(side=>({points:orangeryWingPoints(side),depth:8.45})),
  ...[-1,1].map(side=>{
    const [x,z]=orangeryWing(side,1);
    return {points:[[x+.26,z],[x+.26,z+side*7.75]].sort((a,b)=>b[1]-a[1]),depth:9.30,pavilion:side};
  })
];

// Same local section axes as the facade/solid building. The margin gives
// crowns and branches room to clear the eaves, even with the trunk outside.
const plantingStrips=ORANGERY_SECTIONS.flatMap(({points,depth})=>points.slice(1).map((b,i)=>{
  const [x,z]=points[i],dx=b[0]-x,dz=b[1]-z,length=Math.hypot(dx,dz);
  return {x,z,ux:dx/length,uz:dz/length,length,depth};
}));
export function orangeryTreeClear(x,z,height){
  const margin=Math.max(2.5,height*.26);
  return !plantingStrips.some(s=>{
    const dx=x-s.x,dz=z-s.z,u=dx*s.ux+dz*s.uz,d=-dx*s.uz+dz*s.ux;
    return u>=-margin&&u<=s.length+margin&&d>=-s.depth-margin&&d<=.145+margin;
  });
}
