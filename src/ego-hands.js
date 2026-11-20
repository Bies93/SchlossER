import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {weaponSwatch} from './weapon-finishes.js';

// Each palm is local to its own contact, also used by the forearm rig.
export function gripHands(T,specs){
  const v=(...p)=>new T.Vector3(...p);
  const leather=new T.MeshStandardMaterial({color:0x675849,roughness:.92,...weaponSwatch(T,'leather')});
  leather.normalScale.setScalar(.98);
  const pads=new T.MeshStandardMaterial({color:0x7b735d,roughness:.99,...weaponSwatch(T,'twill')});
  pads.normalScale.setScalar(.78);
  const stitching=new T.MeshStandardMaterial({color:0x92846a,roughness:.95});
  const ellipsoid=new T.SphereGeometry(1,14,10);
  const poses=specs.map(spec=>{
    const group=new T.Group(),nodes=[],wrists=[v(-.107,-.035,.083),v(.055,-.043,.094)];
    group.name='Griffpose · '+spec.kind;
    for(const [hand,w] of wrists.entries()){
      const node=new T.Group();node.position.fromArray(hand===0?spec.fore:spec.grip);
      group.add(node);nodes.push(node);
      const wrist=w.toArray();
      const bins=new Map();
      function add(material,geo){
        if(!bins.has(material))bins.set(material,[]);
        bins.get(material).push(geo);
      }
      function oval(material,p,s,angle=0){
        const g=ellipsoid.toNonIndexed();g.scale(...s);g.rotateX(angle);g.translate(...p);add(material,g);
      }
      function form(points,radii,material=leather,flat=.87){
        // One smooth, tapered mesh per finger, with no disconnected joints.
        const curve=new T.CatmullRomCurve3(points.map(p=>v(...p))),count=points.length*4,segments=9;
        const g=new T.TubeGeometry(curve,count,1,segments,false),a=g.attributes.position;
        const p=new T.Vector3(),q=new T.Vector3();
        for(let j=0;j<=count;j++){
          curve.getPointAt(j/count,p);
          const u=j/count, r=u<.5?T.MathUtils.lerp(radii[0],radii[1],u*2)
            :T.MathUtils.lerp(radii[1],radii[2],((u-.5)*2)**2.6);
          for(let k=0;k<=segments;k++){
            const t=k/segments*Math.PI*2;
            q.copy(p).addScaledVector(g.normals[j],-Math.cos(t)*r)
              .addScaledVector(g.binormals[j],Math.sin(t)*r*flat);
            a.setXYZ(j*(segments+1)+k,q.x,q.y,q.z);
          }
        }
        // Retain the analytical normals from the tube so there is no UV seam.
        const smooth=g.toNonIndexed();add(material,smooth);g.dispose();
      }
      if(hand===1){
        form([wrist,[.051,-.032,.072],[.043,.005,.027]], [.028,.030,.010]);
        oval(leather,[.041,-.005,.023],[.017,.043,.032],-.39);
        oval(pads,[.054,-.007,.027],[.006,.031,.026],-.31);
        for(let k=0;k<4;k++){
          const y=.040-k*.023;
          const points=k===0
            ? [[.047,y,.019],[.045,y+.011,-.012],[.035,y+.012,-.059],[.032,y+.007,-.080]]
            : [[.047,y,.016],[.044,y,-.018],[.027,y+.002,-.035],[.003,y+.004,-.038],[-.020,y+.003,-.033]];
          form(points,[.012,.0105,.0045]);
        }
        form([[.042,.015,.057],[.023,.042,.066],[-.001,.049,.064],[-.023,.046,.057]], [.016,.013,.0045]);
        for(let k=0;k<6;k++)oval(stitching,[.057,-.022+k*.007,.045+k*.0014],[.0014,.0022,.0017]);
      } else {
        const wide=spec.kind==='shotgun',w=wide?.052:.039;
        form([wrist,[-.066,-.028,.042],[-.029,-.018,.012]], [.030,.030,.012]);
        oval(leather,[-.023,-.014,.011],[.039,.017,.044],-.14);
        oval(pads,[-.030,-.030,.020],[.029,.006,.023]);
        for(let k=0;k<4;k++){
          const z=-.030+k*.023;
          form([[-.032,-.018,z+.008],[-w,-.002,z+.005],[-w-.008,.020,z],[-w+.003,.041+(k%2)*.004,z-.005]], [.012,.010,.0042]);
        }
        form([[.006,-.019,.050],[w*.63,-.007,.044],[w+.009,.010,.030],[w+.002,.032,.018]], [.016,.012,.0045]);
        for(let k=0;k<7;k++)oval(stitching,[-.054+k*.0013,-.020,.044-k*.0085],[.0017,.00155,.00125]);
      }
      for(const [material,list] of bins){
        node.add(new T.Mesh(mergeGeometries(list),material));list.forEach(g=>g.dispose());
      }
    }
    return {group,nodes,wrists};
  });
  ellipsoid.dispose();
  return poses;
}
