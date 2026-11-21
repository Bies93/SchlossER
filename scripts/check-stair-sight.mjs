import assert from 'node:assert/strict';
import {portalSight} from '../src/portal-sight.js';
import {CHAPTER_LINKS,CHAPTER_DROP,CHAPTER_DEEP_DROP,isChapterDeep} from '../src/chapter-layout.js';
import {p,b,DEEP_FLOOR,ZONE_LINKS,wcCameraMode,isDeep,wcHeightAt} from '../src/park-wc-layout.js';
import {labVisibility} from '../src/lab-wing.js';
const ports=links=>{
  const table={};for(const l of links)for(const key of l.slice(0,2))(table[key]??=[]).push(l);
  return table;
};
const chapter=ports(CHAPTER_LINKS),wc=ports(ZONE_LINKS),floor=-CHAPTER_DROP,deep=floor-CHAPTER_DEEP_DROP;
function has(set,...rooms){for(const room of rooms)assert.ok(set.has(room),'missing '+room+' in '+[...set]);}
const chapterSight=(id,x,y,z)=>portalSight(chapter,id,x,z,null,([a,b])=>{
  const f=isChapterDeep(a)||isChapterDeep(b)?deep:floor;return [f,f+2.85];
},y+1.67);
has(chapterSight('stair',32,-2.0,-34),'vestibule','salle');
has(chapterSight('salle',21,floor,-34),'vestibule','stair');
has(chapterSight('duel',21.52,floor,-53.7),'lowerStair','lowerHall');
has(chapterSight('lowerHall',21.52,deep,-64.6),'lowerStair','duel');
has(chapterSight('lowerStair',21.52,deep+2,-59.3),'duel','lowerHall');
const wcSight=(id,u,y,v,leaf)=>portalSight(wc,id,u,v,leaf,([a,c])=>{
  const f=isDeep(a)&&isDeep(c)?DEEP_FLOOR:b;return [f,f+3.2];
},y+1.67);
has(wcSight('lobby',3.15,b,6.8),'landing');
has(wcSight('landing',3.15,b,.2),'lobby');
has(wcSight('deepStair',8,b-1.65,-.3),'collective','deepLanding','deepLounge');
has(wcSight('deepLounge',.5,DEEP_FLOOR,-.3),'deepLanding','deepStair');
assert.ok(!wcSight('lobby',3.1,b,2.8,l=>l[6]?{progress:0}:null).has('women'));
for(const [u,v] of [[1,-.2],[1,-2.4],[1,-4.8],[3.2,-4.8],[3.2,-3.3],[3.2,-.25]]){
  const [x,,z]=p(u,0,v);assert.equal(wcCameraMode({x,y:wcHeightAt(x,z),z}),'threshold');
}
has(labVisibility('clubStair',28,-4.45,-5.7),'southVest','hopClub');
has(labVisibility('hopClub',22,-4.45,-8.1),'clubStair','southVest');
console.log('WC, Moosfunk, Bunkerluke, Nachtwache und Club: Sichtachsen in beide Richtungen OK.');
