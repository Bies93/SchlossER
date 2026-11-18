import {architectureKit} from './architecture-kit.js';

export function addPalaceDetail(T,model,finish){
  const door=finish('WOOD').clone();door.color.setHex(0x986a50);door.vertexColors=false;
  const edge=finish('WOOD_RELIEF').clone();edge.color.setHex(0x815639);edge.vertexColors=false;
  const stone=finish('SANDSTONE_CUT').clone();stone.vertexColors=false;
  const iron=new T.MeshStandardMaterial({color:0x3c322a,metalness:.54,roughness:.63});
  const brass=new T.MeshStandardMaterial({color:0x8a6741,metalness:.59,roughness:.44});
  const kit=architectureKit(T,model,{leaf:door,profile:edge,stone,iron,brass});
  const p=(x,y,z)=>[x,y,z];
  // These dimensions are read from the retained mesh at z=12.28–12.55.
  // Narrow wood profiles enrich the two existing leaves without covering
  // their modelled panels, upper fanlight or sandstone silhouette.
  for(const x of [-1.237,1.237]){
    kit.box('profile',p,x-.027,x+.027,.15,2.793,12.333,12.376);
    kit.box('leaf',p,x-.014,x+.014,.157,2.785,12.375,12.386);
    for(const y of [.56,2.42]){
      kit.box('iron',p,x-.094,x+.093,y-.038,y+.038,12.35,12.414);
      const pin=new T.CylinderGeometry(.027,.028,.123,10);
      kit.geometry('brass',pin,new T.Matrix4().makeTranslation(x,y,12.415));pin.dispose();
    }
  }
  kit.box('profile',p,-.024,.024,.11,2.75,12.33,12.381);
  kit.box('leaf',p,-.016,.016,.13,2.74,12.378,12.394);
  kit.box('stone',p,-1.62,1.62,-.045,.019,12.22,12.70);
  kit.box('stone',p,-1.59,1.59,.016,.043,12.23,12.653);
  for(const x of [-.182,.182]){
    const plaque=new T.CylinderGeometry(.041,.041,.016,14);
    plaque.rotateX(Math.PI/2);
    kit.geometry('brass',plaque,new T.Matrix4().makeTranslation(x,1.43,12.477));plaque.dispose();
    const ring=new T.TorusGeometry(.054,.010,6,16);
    kit.geometry('iron',ring,new T.Matrix4().makeTranslation(x,1.36,12.495));ring.dispose();
  }
  kit.flush('Schlossportal · Nahdetails');
}
