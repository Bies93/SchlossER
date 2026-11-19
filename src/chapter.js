import {CHAPTER_BENCH,CHAPTER_CUT,CHAPTER_STEP as S,CHAPTER_ROOMS,CHAPTER_LINKS,CHAPTER_LAYER,CHAPTER_DROP,
  chapterContains,chapterCell,chapterStairFloor} from './chapter-layout.js';
import {chapterInterior} from './chapter-interior.js';
import {chapterMaterials} from './chapter-art.js';
import {architectureKit} from './architecture-kit.js';

export function addChapter(T,scene,world,{bench,benchCover,heightAt}){
  const [x,z,yaw]=CHAPTER_BENCH,[xa,xb,za,zb]=CHAPTER_CUT;
  const grade=heightAt(x,z),floor=grade-CHAPTER_DROP,slide=2.11;
  const room=new T.Group(),lid=new T.Group(),material=chapterMaterials(T);
  room.name='Bund der Eisernen Krone · Untergrund';room.visible=false;scene.add(room,lid);
  lid.name='Südweg · getarnte Luke';lid.position.set(xa,grade,za);
  for(const mesh of benchCover){
    mesh.geometry.translate(-xa,-grade,-za);
    mesh.name='Südweg · versenkter Kiesdeckel';lid.add(mesh);
  }
  const k=architectureKit(T,lid,material),P=(x,y,z)=>[x-xa,y,z-za];
  k.box('iron',P,xa+.014,xb-.014,-.094,-.042,za+.014,zb-.014);
  for(const u of [xa+.21,(xa+xb)/2,xb-.21]){
    k.box('steel',P,u-.030,u+.030,-.121,-.085,za+.080,zb-.077);
    k.box('brass',P,u-.090,u+.090,-.127,-.043,za+.022,za+.065);
  }
  k.flush('Luke · Rahmen und Beschläge');
  const c=Math.cos(yaw),s=Math.sin(yaw),close=(p,pad=0)=>chapterContains(CHAPTER_CUT,p.x,p.z,pad);
  let progress=0,active='',prepared;
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
  const objects=chapterInterior(T,room,world,material,grade,isBelow);
  const ambient=new T.HemisphereLight(0xcad3de,0x886655,.70);room.add(ambient);
  const lights=Array.from({length:3},()=>{const l=new T.PointLight(0xffffff,0,0,2);room.add(l);return l;});
  const sources={
    stair:[[31.3,grade-2.07,-34.13,0xf3c394,12,6],[34.2,grade-.92,-34.11,0xb7c7dc,7,4]],
    vestibule:[[28.18,floor+2.01,-35.57,0xffdb9f,24,6.9]],
    salle:[[18.78,floor+2.45,-37.42,0xeec798,29,8],[24.10,floor+2.64,-34.73,0xd5dfeb,31,8.6]],
    archive:[[23.48,floor+2.50,-44.17,0xe6b67c,32,8],[25.63,floor+1.91,-40.74,0xa9c7d0,16,6]],
    chapter:[[10.96,floor+2.70,-38.85,0xf5c384,35,8],[14.50,floor+2.57,-40.93,0xadc3dd,20,7]]
  };
  room.traverse(o=>{o.layers.set(CHAPTER_LAYER);if(o.isMesh)o.castShadow=false;});
  const smooth=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
  function mode(p){
    const cell=progress>.06&&p.y<grade+.36&&chapterCell(p.x,p.z,.035);
    if(cell==='stair'&&p.y>grade-1.97&&p.x>=xa-.08)return 'threshold';
    if(cell&&isBelow(p))return 'inside';
    return 'surface';
  }
  function update(dt,p){
    const from=progress;
    if(progress!==target.target&&dt){
      progress=Math.max(0,Math.min(1,progress+dt*(target.target?1:-1)*.81));
      bench.position.z=z+slide*smooth(progress/.48);
      benchPose.z=bench.position.z+.034*c;
      bench.position.y=heightAt(x,bench.position.z);
      lid.rotation.x=-Math.PI*.515*smooth((progress-.35)/.65);
    }
    const cell=mode(p)==='surface'?
      (progress>.06&&p.x>xa-4&&p.x<xb+8&&p.z>za-6&&p.z<zb+6?'stair':null):chapterCell(p.x,p.z,.035);
    const changed=from!==progress||cell!==active;active=cell;
    room.visible=Boolean(cell);
    if(!cell)return changed;
    const visible=new Set([cell]),adjacent=new Set();
    for(const [a,b] of CHAPTER_LINKS)if(a===cell||b===cell)adjacent.add(a===cell?b:a);
    for(const a of adjacent)visible.add(a);
    // From a landing the second opening can actually be seen in alignment.
    if(cell==='stair'||cell==='vestibule'){visible.add('vestibule');visible.add('salle');}
    if(cell==='chapter'||cell==='archive'){visible.add('salle');visible.add('vestibule');}
    for(const [id,group] of objects)group.visible=visible.has(id);
    const pool=[...visible].flatMap(id=>(sources[id]??[]).map(a=>[a,Math.hypot(p.x-a[0],p.z-a[2])+(id===cell?-3:0)])).sort((a,b)=>a[1]-b[1]);
    ambient.intensity=cell==='chapter'?.56:cell==='stair'?.48:.71;
    for(const [i,l] of lights.entries()){
      const a=pool[i]?.[0];l.intensity=a?.[4]??0;
      if(a){l.position.set(a[0],a[1],a[2]);l.color.setHex(a[3]);l.distance=a[5];}
    }
    return changed;
  }
  return {mode,visible:()=>room.visible,isBelow,update,
    target(p,look){
      if(p.y<grade-.28)return null;
      const dx=x-p.x,dz=bench.position.z-p.z;
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
      if(y<grade-1.78&&cell&&cell!=='stair')return floor;
      return null;
    },
    ceilingAt(x,z,y){
      if(y>=grade-.14)return Infinity;
      const cell=chapterCell(x,z,.002);
      if(cell==='stair')return x<=xa?grade-.183:Infinity;
      return cell?floor+2.50:Infinity;
    },
    prepare(renderer){
      if(!prepared)prepared=(async()=>{
        const c=new T.PerspectiveCamera(65,1,.08,1250);
        c.position.set(25,floor+1.6,-34.3);c.lookAt(11,floor+1.7,-38.8);c.layers.set(CHAPTER_LAYER);
        const vp=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4()),test=renderer.getScissorTest();
        room.visible=true;const meshes=[];room.traverse(o=>{if(o.isMesh){meshes.push([o,o.frustumCulled]);o.frustumCulled=false;}});
        try{
          await renderer.compileAsync(scene,c);renderer.setViewport(0,0,32,32);renderer.setScissor(0,0,32,32);
          renderer.setScissorTest(true);renderer.render(scene,c);
        }finally{
          room.visible=false;for(const [o,culled] of meshes)o.frustumCulled=culled;
          renderer.setViewport(vp);renderer.setScissor(sc);renderer.setScissorTest(test);
        }
      })();
      return prepared;
    }};
}
