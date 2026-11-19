import {b,p,X,Z,wcRoomAt,lower} from './park-wc-layout.js';
import {LAB,labCellAt,labLower} from './lab-layout.js';
import {PLAYER} from './world-layout.js';

const key='schlosser.moosfunk.schalter.v1';
export const spareSpot={x:-15.30,z:-5.62,y:LAB.floor+1.13};
export const radioSpot={u:16.70,v:-7.69,y:1.18};
export const intercomSpot={u:17.73,v:10.52,y:1.42};
const atHQ=({u,y,v})=>{const [x,Y,z]=p(u,b+y,v);return {x,y:Y,z};};
const reach={
  spare:{id:'mf-spare',where:spareSpot}, intercom:{id:'mf-intercom',where:atHQ(intercomSpot)}, radio:{id:'mf-radio',where:atHQ(radioSpot)}
};
const tapes=[
  ['Stationsjingle','Hier ist Moosfunk. Drei Jingles, zwei Hörer. Den zweiten vermuten wir.'],
  ['Abgefangener Prüfvermerk','Beim Blindtest gewann Franken. Das Ergebnis wurde aus Gründen der Objektivität aussortiert.'],
  ['Küchendienst','Die Tomatenfrage ist vertagt. Die Tomaten selbst sind weg.'],
  ['Rückkanal · Archiv F','Hier Rückkanal. Im Labor heißt es: Fremdakte F, nicht ablegen. Wir haben den Namen trotzdem aufgeschrieben.']
];

// Works in either game mode, with one small local flag and no external service.
export function makeMoosfunk(storage=undefined){
  let phase='missing',index=0;
  try{storage??=globalThis.localStorage;const saved=storage?.getItem(key);if(saved==='found'||saved==='wired')phase=saved;}catch{}
  const listeners=new Set(),sync=()=>{for(const notify of listeners)notify(phase);};
  function progress(next){phase=next;try{storage?.setItem(key,phase);}catch{}sync();}
  function target(pose,look){
    let action;
    const room=lower(pose.y)&&wcRoomAt(pose.z-Z,X-pose.x);
    if(room==='studio')action='radio';
    else if(room==='workshop')action='intercom';
    else if(phase==='missing'&&labLower(pose.y)&&labCellAt(pose.x,pose.z)==='chambers')action='spare';
    else return null;
    const {id,where}=reach[action],dx=where.x-pose.x,dz=where.z-pose.z,dy=where.y-pose.y-PLAYER.eye;
    const near=Math.hypot(dx,dz),d=Math.hypot(dx,dy,dz);
    if(near<.18||near>1.72||dx*look.x+dy*look.y+dz*look.z<d*.62)return null;
    const text=action==='spare'?'Ersatzschalter M–7 mitnehmen':action==='intercom'
      ?phase==='wired'?'Gegensprechanlage prüfen':phase==='found'?'Ersatzschalter M–7 einsetzen':'Defekte Gegensprechanlage untersuchen'
      :'Tonband abspielen · '+tapes[index][0];
    return {id,action,where,label:text};
  }
  function use({action,where}){
    if(action==='spare'&&phase==='missing'){
      progress('found');return {text:'M–7 eingesteckt. Auf dem Etikett steht: Moosfunk · Werkstatt.'};
    }
    if(action==='intercom'){
      if(phase==='missing')return {text:'M–7 fehlt. Laut Reparaturzettel liegt er bei der Fremdakte F im geheimen Schlosslabor.'};
      if(phase==='found'){
        index=3;progress('wired');
        const voice='Moosfunk an alle: Rückkanal steht. Wer hätte gedacht, dass Beschlagnahmen einen Rückgabeschalter haben?';
        return {text:voice+' Neues Band im Studio.',voice,where};
      }
      const voice='Rückkanal offen. Wenn ihr mich hört: Die Sprechprobe ist vorbei. Bitte keine weitere Sprechprobe.';
      return {text:voice,voice,where};
    }
    if(action==='radio'){
      const [name,voice]=tapes[index];
      index=(index+1)%(phase==='wired'?4:3);
      return {text:name+' — '+voice,voice,where};
    }
    return null;
  }
  return {target,use,bind(callback){listeners.add(callback);callback(phase);}};
}
