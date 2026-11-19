import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {makeEquipment} from './ego-gear.js';
import {gripHands} from './ego-hands.js';

// Three original, purely decorative hard-surface silhouettes.
export const EQUIPMENT=[
  {label:'Kestrel · Impulspistole',color:0x6fe2e6,
    sight:[0,.074,-.191],emit:[0,.009,-.244],gripY:-.121,
    hold:[.226,-.169,-.61],yaw:.255,pattern:1,impact:36},
  {label:'Vesper · Impulsgewehr',color:0x8baeff,
    sight:[0,.124,-.132],emit:[0,.024,-.697],gripY:-.124,
    hold:[.239,-.216,-.53],yaw:.276,pattern:1,impact:54},
  {label:'Amber · Streuflinte',color:0xffb266,
    sight:[0,.091,-.619],emit:[0,.033,-.682],gripY:-.137,
    hold:[.253,-.244,-.55],yaw:.289,pattern:5,impact:25}
];

export function egoAssets(T){
  const m=(color,roughness=.70,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const shell=new RoundedBoxGeometry(1,1,1,2,.12),cap=new T.CapsuleGeometry(.5,1,5,10);
  return {devices:makeEquipment(T,EQUIPMENT),hands:gripHands(T),materials:{
    frame:m(0x272f33,.73,.19),sleeve:m(0x47545a,.94),cuff:m(0x343d42,.88)
  },geometry:{shell,cap}};
}
