import {CHAPTER_BENCH,CHAPTER_CUT,CHAPTER_STEP as S,CHAPTER_LINKS,CHAPTER_LAYER,CHAPTER_DROP,
  CHAPTER_DEEP_DROP,chapterDeepStairFloor,isChapterDeep,chapterContains,chapterCell,chapterStairFloor} from './chapter-layout.js';
import {chapterInterior} from './chapter-interior.js';
import {chapterMaterials} from './chapter-art.js';
import {architectureKit} from './architecture-kit.js';
import {chapterMembers} from './chapter-members.js';
import {warmRoom} from './warm-room.js';
import {portalSight} from './portal-sight.js';
const ports={};
for(const l of CHAPTER_LINKS)for(const key of l.slice(0,2))(ports[key]??=[]).push(l);

export function addChapter(T,scene,world,{bench,benchCover,heightAt}){
  const [x,z,yaw]=CHAPTER_BENCH,[xa,xb,za,zb]=CHAPTER_CUT;
  const grade=heightAt(x,z),floor=grade-CHAPTER_DROP,deep=floor-CHAPTER_DEEP_DROP,slide=2.11;
  const room=new T.Group(),lid=new T.Group(),landing=new T.Group(),guard=new T.Group(),material=chapterMaterials(T);
  room.name='Bund der Eisernen Krone · Untergrund';room.visible=false;scene.add(room,lid,landing,guard);
  bench.userData.movingOccluder=lid.userData.movingOccluder=guard.userData.movingOccluder=true;
  landing.name='Südweg · Sitznische und Schachtrahmen';
  guard.name='Südweg · Klappgeländer';guard.position.set(xa,grade+.021,zb);guard.rotation.x=-Math.PI*.5;guard.visible=false;
  lid.name='Südweg · getarnte Luke';lid.position.set(xa,grade,za);
  for(const mesh of benchCover){
    mesh.geometry.translate(-xa,-grade,-za);
    mesh.name='Südweg · versenkter Kiesdeckel';lid.add(mesh);
  }
  const k=architectureKit(T,lid,material),P=(x,y,z)=>[x-xa,y,z-za];
  k.box('coal',P,xa+.017,xb-.017,-.119,-.013,za+.012,zb-.012);
  const panel=(xb-xa-.144)/3;
  for(let i=0;i<3;i++){
    const a=xa+.072+i*panel,A=a+panel;
    k.box('iron',P,a+.053,A-.053,-.146,-.116,za+.11,zb-.11);
    for(const v of [za+.105,zb-.105])k.box('steel',P,a+.014,A-.014,-.162,-.139,v-.014,v+.014);
    for(const u of [a+.053,A-.052])k.box('steel',P,u-.012,u+.012,-.163,-.140,za+.117,zb-.122);
    for(const u of [a+.032,A-.035])for(const v of [za+.12,zb-.12])
      k.box('brass',P,u-.012,u+.012,-.171,-.149,v-.014,v+.014);
    k.box('brass',P,(a+A)*.5-.115,(a+A)*.5+.115,-.166,-.119,za+.012,za+.056);
    k.box('iron',P,(a+A)*.5-.057,(a+A)*.5+.057,-.158,-.048,za-.068,za+.013);
  }
  k.flush('Luke · Rahmen und Beschläge');
  const trim=architectureKit(T,landing,material),G=(x,y,z)=>[x,y+grade,z];
  const strip=(m,a,A,y,Y,z,Z)=>trim.box(m,G,a,A,y,Y,z,Z);
  for(const z of [za,zb]){
    const a=z===za?z-.104:z,A=z===za?z:z+.104;
    strip('stone3',xa,xb,-.056,.019,a,A);
    for(let x0=xa+.29;x0<xb-.14;x0+=.51)strip('stone2',x0-.008,x0+.008,.019,.021,a+.008,A-.006);
  }
  for(const x0 of [xa,xb]){
    strip('stone3',x0-(x0===xa?.096:0),x0+(x0===xb?.096:0),-.057,.021,za-.10,zb+.099);
  }
  for(const x0 of [xa+(xb-xa)*.166,xa+(xb-xa)*.50,xa+(xb-xa)*.834])
    strip('iron',x0-.095,x0+.095,-.010,.027,za-.069,za-.002);
  for(const z0 of [-32.76,-31.09])strip('stone2',x-.46,x+.53,-.035,.021,z0-.114,z0+.114);
  trim.flush('Sitznische · Sandsteineinfassung');
  const rail=architectureKit(T,guard,material),R=(x,y,z)=>[x-xa,y,z-zb];
  const rbox=(m,a,A,y,Y,z,Z)=>rail.box(m,R,a,A,y,Y,z,Z);
  for(const x0 of [xa+.098,xa+1.11,xb-1.10,xb-.102]){
    rbox('iron',x0-.026,x0+.026,0,.81,zb-.024,zb+.025);
    rbox('brass',x0-.046,x0+.046,.78,.822,zb-.036,zb+.037);
    rbox('iron',x0-.047,x0+.047,0,.059,zb-.041,zb+.043);
  }
  for(let x0=xa+.271;x0<xb-.22;x0+=.22){
    rbox('iron',x0-.012,x0+.012,.147,.762,zb-.011,zb+.014);
    rbox('brass',x0-.024,x0+.024,.55,.593,zb-.018,zb+.019);
  }
  rbox('iron',xa+.074,xb-.077,.138,.169,zb-.014,zb+.015);
  rbox('iron',xa+.073,xb-.076,.744,.777,zb-.035,zb+.037);
  rbox('brass',xa+.072,xb-.075,.771,.803,zb-.035,zb+.038);
  rail.flush('Südweg · Gusseisen und Messinghandlauf');
  const c=Math.cos(yaw),s=Math.sin(yaw),close=(p,pad=0)=>chapterContains(CHAPTER_CUT,p.x,p.z,pad);
  let progress=0,active='',prepared,shadowMoved=false;
  const passable=()=>progress>.92;
  const isBelow=p=>p.y<grade-.39&&chapterCell(p.x,p.z,.08)!==null;
  const target={id:'chapter-bench',label:'Parkbank',target:0,usable(p){
    if(progress>0&&progress<1)return false;
    if(p.y<grade-.29||close(p,.32))return false;
    // The cast iron frame must not slide into the visitor.
    return !(p.x>x-.68&&p.x<x+.68&&p.z>z-1.23&&p.z<z+slide+1.23);
  },prompt(usable){
    if(!usable)return progress>0&&progress<1?'Die Bank bewegt sich …':'Neben die Bank treten';
    return target.target?'Luke schließen':'Lockeren Bankbeschlag drücken';
  }};
  const benchPose={x:x+.034*s,z:z+.034*c,ux:c,uz:-s,half:.955,depth:.33};
  world.movingBox(x-1.15,z-1.39,x+1.15,z+slide+1.39,benchPose,p=>p.y>=grade-.22);
  for(const side of [za,zb]){
    world.box(S.foot,side-.022,S.top,side+.022,p=>passable()&&(isBelow(p)||p.x>xa-.35&&p.y<grade+.87&&p.y>grade-.42));
  }
  world.box(xa-.034,za,xa+.03,zb,p=>passable()&&p.y>=grade-.43&&p.y<grade+.90);
  world.box(xb-.020,za,xb+.023,zb,p=>progress>.05&&!passable()&&p.y>grade-.15&&p.y<grade+1.12);
  const {objects,prisoner,gate}=chapterInterior(T,room,world,material,grade,isBelow);
  const members=chapterMembers(T,objects,world,floor,isBelow);
  const ambient=new T.HemisphereLight(0xcad3de,0x886655,.70);room.add(ambient);
  const lights=Array.from({length:3},()=>{const l=new T.PointLight(0xffffff,0,0,2);room.add(l);return l;});
  const sources={
    stair:[[29.88,grade-2.21,-34.17,0xf3c394,14,6],[33.02,grade-.97,-34.12,0xcfdbec,12,5]],
    vestibule:[[27.73,floor+2.01,-35.57,0xffdb9f,24,6.9]],
    salle:[[18.58,floor+2.20,-37.18,0xeecfa6,23,7.8],[24.10,floor+2.53,-34.73,0xd5dfeb,29,8.6]],
    archive:[[23.48,floor+2.50,-44.17,0xe6b67c,32,8],[25.63,floor+1.91,-40.74,0xa9c7d0,16,6]],
    chapter:[[10.96,floor+2.70,-38.85,0xf5c384,35,8],[14.50,floor+2.57,-40.93,0xadc3dd,20,7]],
    duel:[[22.50,floor+2.49,-48.50,0xe4cdb4,26,8.8],[20.13,floor+2.40,-52.03,0xc8d4e1,28,9],[22.22,floor+2.45,-54.03,0xf1c18e,29,8]],
    lowerStair:[[-57.36,0xd2b890],[-59.44,0xbacccf],[-61.57,0xd2ab7d]].map(([z,c])=>[21.96,floor+chapterDeepStairFloor(z)+1.64,z,c,15,5.4]),
    lowerHall:[[21.70,deep+2.23,-64.08,0xdbc8a7,21,6.3],[21.36,deep+2.13,-69.39,0xf1c496,21,6.9]],
    dormitory:[[12.97,deep+2.20,-65.45,0xe5caa6,28,7.6],[17.17,deep+2.19,-68.58,0xe4b985,27,7.2],[16.82,deep+2.39,-63.95,0xb7c8bd,19,6.7]],
    kitchen:[[26.48,deep+2.17,-65.46,0xf3c08f,29,7.4],[29.91,deep+2.42,-69.44,0xf2c08a,31,7.8],[30.16,deep+2.25,-64.37,0xc5d1c2,22,6.7]],
    prison:[[21.04,deep+2.12,-72.90,0xe5b789,19,6.5],[25.19,deep+2.37,-75.75,0xbbcbc5,29,7.4],[26.92,deep+2.00,-77.66,0xc79668,23,6.3]]
  };
  room.traverse(o=>{o.layers.set(CHAPTER_LAYER);if(o.isMesh)o.castShadow=false;});
  const smooth=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
  const openingHeights=([a,b])=>{const y=isChapterDeep(a)||isChapterDeep(b)?deep:floor;return [y,y+2.85];};
  let lightCell=null,lightX=0,lightY=0,lightZ=0;
  function mode(p){
    const cell=progress>.06&&p.y<grade+.36&&chapterCell(p.x,p.z,.035);
    if(cell==='stair'&&p.x>=xa-.68)return 'threshold';
    if(cell&&isBelow(p))return 'inside';
    return 'surface';
  }
  function update(dt,p,inView=false){
    const from=progress;
    if(progress!==target.target&&dt){
      progress=Math.max(0,Math.min(1,progress+dt*(target.target?1:-1)*.81));
      const dz=slide*smooth(progress/.48);
      bench.position.z=z+dz;bench.position.x=x+dz*c;
      benchPose.x=bench.position.x+.034*s;
      benchPose.z=bench.position.z+.034*c;
      bench.position.y=heightAt(bench.position.x,bench.position.z);
      const turn=smooth((progress-.45)/.55);
      lid.rotation.x=-Math.PI*.505*turn;
      guard.rotation.x=-Math.PI*.5*(1-turn);guard.visible=turn>.04;
    }
    shadowMoved=progress!==from;
    const cell=mode(p)==='surface'?
      (progress>.001&&p.y>=grade-.4&&(inView||close(p,3))?'stair':null):chapterCell(p.x,p.z,.035);
    const gateMoved=gate.update(dt,p),changed=from!==progress||cell!==active||gateMoved;active=cell;
    room.visible=Boolean(cell);
    if(!cell){lightCell=null;return changed;}
    const animated=dt>0&&(cell==='lowerHall'||cell==='prison')&&prisoner.turn(dt,p);
    const membersMoved=dt>0&&mode(p)==='inside'&&members.update(dt,p);
    const region=cell==='duel'?p.z<-53.3?2:p.z<-52.8?1:0:cell==='lowerHall'&&p.z>-65?1:0;
    const key=cell+region;
    if(key===lightCell&&Math.hypot(p.x-lightX,p.y-lightY,p.z-lightZ)<.14)return changed||animated||membersMoved;
    lightCell=key;lightX=p.x;lightY=p.y;lightZ=p.z;
    const visible=portalSight(ports,cell,p.x,p.z,null,openingHeights,p.y+(p.eyeHeight??1.67));
    for(const [id,group] of objects)group.visible=visible.has(id);
    const pool=[...visible].flatMap(id=>(sources[id]??[]).map(a=>[a,Math.hypot(p.x-a[0],p.z-a[2])+(id===cell?-3:0)])).sort((a,b)=>a[1]-b[1]);
    if(cell==='duel'){
      const rear=pool.findIndex(([src])=>src===(p.z<-53.3?sources.lowerStair[2]:sources.duel[2]));
      if(rear>=lights.length)pool.splice(2,0,pool.splice(rear,1)[0]);
    }
    if(cell==='prison'){
      const rear=pool.findIndex(([src])=>src===sources.prison[1]);
      if(rear>=lights.length)pool.splice(1,0,pool.splice(rear,1)[0]);
    }
    ambient.intensity=cell==='chapter'?.56:cell==='stair'?.48:cell==='prison'?.48:cell==='lowerStair'?.55:.71;
    for(const [i,l] of lights.entries()){
      const a=pool[i]?.[0];l.intensity=a?.[4]??0;
      if(a){l.position.set(a[0],a[1],a[2]);l.color.setHex(a[3]);l.distance=a[5];}
    }
    return changed||animated||membersMoved;
  }
  return {mode,visible:()=>room.visible,shadowMoved:()=>shadowMoved,seesExit:()=>progress>.001&&room.visible&&objects.get('stair').visible,isBelow,update,
    floor,attach(id,prop){objects.get(id).add(prop);prop.traverse(o=>o.layers.set(CHAPTER_LAYER));},
    prisonerAt(p){
      if(!prisoner.alive()||p.y>deep+.76||chapterCell(p.x,p.z)!=='prison')return null;
      const at=prisoner.position;
      return Math.hypot(p.x-at.x,p.z-at.z)<6.35?at:null;
    },
    prisonerSpeaks(){prisoner.speak();},
    target(p,look){
      const grate=gate.target(p,look);if(grate)return grate;
      if(p.y<grade-.28)return null;
      const dx=bench.position.x-p.x,dz=bench.position.z-p.z;
      // The closing control is on the inside edge of the original bench bay.
      const d=target.target?Math.hypot(p.x-xb,p.z-z):Math.hypot(dx,dz);
      if(d>(target.target?2:2.24))return null;
      const wx=target.target?xb-.64-p.x:dx,wz=target.target?z-p.z:dz;
      return wx*look.x+wz*look.z>Math.hypot(wx,wz)*.26?target:null;
    },
    floorAt(x,z,y){
      if(!passable())return null;
      const cell=chapterCell(x,z,.002);
      if(cell==='stair'&&(y<grade-.12||x>=xa-.002))return grade+chapterStairFloor(x);
      if(y<grade-1.78&&cell&&cell!=='stair'){
        if(cell==='lowerStair')return floor+chapterDeepStairFloor(z);
        if(isChapterDeep(cell))return y<floor-.42?deep:null;
        return floor;
      }
      return null;
    },
    ceilingAt(x,z,y){
      if(y>=grade-.14)return Infinity;
      const cell=chapterCell(x,z,.002);
      if(cell==='stair')return x<=xa?grade-.183:Infinity;
      if(cell==='lowerStair')return floor+chapterDeepStairFloor(z)+2.60;
      if(isChapterDeep(cell))return y<floor-.42?deep+2.50:Infinity;
      return cell?floor+2.50:Infinity;
    },
    prepare(renderer){
      if(!prepared){
        const c=new T.PerspectiveCamera(65,1,.08,1250);
        c.position.set(25,floor+1.6,-34.3);c.lookAt(11,floor+1.7,-38.8);c.layers.set(CHAPTER_LAYER);
        prepared=warmRoom(T,renderer,scene,c,[room]);
      }
      return prepared;
    }};
}
