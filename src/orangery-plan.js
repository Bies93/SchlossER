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
