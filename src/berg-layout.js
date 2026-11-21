import {ORANGERY_STATION} from './orangery-plan.js';
export const BERG_POOL={x:-50.0,z:-64.7,rx:2.04,rz:1.38};
export const BERG_CHAIRS=[[-2.65,-.82,1.29],[1.61,-2.06,-.55],[1.84,1.61,-2.21]];
export const WEATHER_ZERO=ORANGERY_STATION;
export const BERG_LAYER=8,BERG_FLOOR=-12.6,BERG_CEILING=BERG_FLOOR+4.12;
export const BERG_HALL={half:6.45,front:4.30,back:-5.65};
export const suspicionNote='Sie haben aber auch wirklich nichts zu tun.';
export const suspicionTick=(value,dt,watching)=>Math.min(1,Math.max(0,value+dt*(watching?1/5:-.65)));
export const bergPlan=(x,z,pad=0)=>Math.abs(x-BERG_POOL.x)<=BERG_HALL.half+pad&&
  z>=BERG_POOL.z+BERG_HALL.back-pad&&z<=BERG_POOL.z+BERG_HALL.front+pad;
export const bergInside=p=>p.y<BERG_FLOOR+2.8&&p.y>BERG_FLOOR-1&&bergPlan(p.x,p.z,.15);
