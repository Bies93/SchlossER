import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {makeEquipment} from './ego-gear.js';
import {gripHands} from './ego-hands.js';
import {coatSleeve,weaponSwatch} from './weapon-finishes.js';

// Viewmodel coordinates and timings are authored for the screen/game only.
export const EQUIPMENT=[
  {kind:'bow',label:'Windbruch · Armbrust',color:0x9b5041,
    sight:[0,.119,-.287],emit:[0,.055,-.429],hold:[.169,-.177,-.555],yaw:.230,
    fore:[0,-.083,-.287],grip:[0,-.132,.020],recovery:.32,recoil:.032,pattern:1,impact:64,range:76,spread:0,weight:1.05},
  {kind:'rifle',label:'Vesper 17 · Sturmgewehr',color:0xa36b47,
    sight:[0,.124,-.264],emit:[0,.024,-.684],hold:[.199,-.161,-.505],yaw:.248,
    fore:[0,-.066,-.369],grip:[0,-.139,.023],recovery:.119,automatic:true,recoil:.027,pattern:1,impact:54,range:112,spread:.0068,weight:.91},
  {kind:'shotgun',label:'Amber 08 · Pumpflinte',color:0x92563d,
    sight:[0,.069,-.631],emit:[0,.024,-.743],hold:[.199,-.165,-.519],yaw:.274,
    fore:[0,-.077,-.397],grip:[0,-.119,.049],recovery:.752,recoil:.061,pattern:5,impact:25,range:43,spread:.036,weight:1.13},
  {kind:'pistol',label:'Alma 09 · Kompaktpistole',color:0x788082,
    sight:[0,.090,-.237],emit:[0,.033,-.272],hold:[.156,-.152,-.443],yaw:.164,
    fore:[-.020,-.120,.002],grip:[0,-.100,.029],recovery:.205,recoil:.026,pattern:1,impact:38,range:70,spread:.0066,weight:.77},
  {kind:'archive',label:'Falkenried · Archivgewehr',color:0x99734e,
    sight:[0,.087,-.403],emit:[0,.030,-.881],hold:[.185,-.160,-.555],yaw:.213,
    fore:[0,-.072,-.448],grip:[0,-.121,.058],recovery:.47,recoil:.074,pattern:1,impact:89,range:158,spread:.0032,weight:1.21}
];

export function egoAssets(T){
  const m=(color,roughness=.70,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const cloth=weaponSwatch(T,'twill'),sleeve=new T.MeshStandardMaterial({color:0x5a5f54,roughness:.99,...cloth}),
    cuff=new T.MeshStandardMaterial({color:0x585749,roughness:.97,...cloth});
  sleeve.normalScale.setScalar(.87);cuff.normalScale.setScalar(.71);
  const shell=new RoundedBoxGeometry(1,1,1,3,.21),cap=coatSleeve(T);
  const hands=gripHands(T,[...EQUIPMENT,{kind:'fist',fore:[0,0,0],grip:[0,0,0]}]),fists=hands.pop();
  return {...makeEquipment(T,EQUIPMENT),hands,fists,materials:{frame:m(0x272f33,.73,.19),sleeve,cuff},geometry:{shell,cap}};
}
