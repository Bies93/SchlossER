import {architectureKit} from './architecture-kit.js';
import {CHAPTER_CELL,chapterCell} from './chapter-layout.js';

// The runner is on the visitors' side of the fixed grille. Opening it never
// sweeps a door through a person standing either side of the threshold.
export const gateLeft=CHAPTER_CELL[0]+3.50,gateRight=CHAPTER_CELL[0]+5.30;
export function makeCellGate(T,room,world,materials,F){
  const z=CHAPTER_CELL[3]+.19,w=gateRight-gateLeft,c=(gateLeft+gateRight)/2;
  const leaf=new T.Group();leaf.name='Hubert · rollendes Zellengitter';room.add(leaf);
  const k=architectureKit(T,leaf,materials),tr=(x,y,z)=>[x,y,z];
  const box=(m,x,y,z,w,h,d)=>k.box(m,tr,x-w/2,x+w/2,y,y+h,z-d/2,z+d/2);
  for(const x of [-w/2+.035,w/2-.035])box('iron',x,.036,0,.07,2.29,.071);
  for(const y of [.036,.69,1.81,2.26])box('displayBlack',0,y,0,w,.059,.088);
  for(let j=1;j<10;j++){
    const x=-w/2+j*w/10;box('iron',x,.08,0,.028,2.19,.033);
    for(const y of [.714,1.83])box('pewter',x,y,.048,.018,.019,.012);
  }
  for(const side of [-1,1]){
    box('verdigris',-.67,1.00,side*.051,.235,.27,.037);
    for(const y of [1.041,1.205])box('brass',-.63,y,side*.09,.025,.024,.081);
    box('brass',-.63,1.042,side*.127,.024,.188,.031);
    box('soot',-.72,1.134,side*.074,.014,.033,.009);
  }
  for(const x of [-.62,.62]){
    box('iron',x,2.28,0,.069,.116,.055);
    const wheel=new T.CylinderGeometry(.059,.059,.043,16);wheel.rotateX(Math.PI/2);
    k.geometry('pewter',wheel,new T.Matrix4().makeTranslation(x,2.384,0));wheel.dispose();
  }
  k.flush('Kammer 07 · Laufgitter');
  const pose={x:c,z,ux:1,uz:0,half:w/2,depth:.081},travel=w+.062;
  const here=p=>p.y>F-.25&&p.y<F+2&&chapterCell(p.x,p.z)==='prison';
  world.movingBox(gateLeft-.1,z-.14,gateRight+travel+.1,z+.14,pose,here);
  let t=0;
  const nearLeaf=(p,x)=>Math.abs(p.z-z)<.44&&Math.abs(p.x-x)<w/2+.37;
  const control={id:'hubert-cell',label:'Huberts Zelle',target:0,
    usable(p){return t===control.target&&!nearLeaf(p,pose.x);},
    prompt(ok){return !ok?(t===control.target?'Vom Gitter zurücktreten':'Das Gitter rollt …'):control.target?'Huberts Zelle schließen':'Huberts Zelle öffnen';}};
  function position(f){return c+travel*f*f*(3-2*f);}
  leaf.position.set(c,F,z);
  return {update(dt,p){
    if(t===control.target||dt<=0)return false;
    const next=t+Math.sign(control.target-t)*Math.min(dt*.89,Math.abs(control.target-t)),x=position(next);
    if(here(p)&&nearLeaf(p,x))return false;
    t=next;leaf.position.x=pose.x=x;return true;
  },target(p,look){
    const dx=pose.x-.66-p.x,dz=z-p.z,dist=Math.hypot(dx,dz);
    return here(p)&&dist<2.28&&dx*look.x+dz*look.z>dist*.37?control:null;
  }};
}
