import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {sharedSet} from './surface-detail.js';

// Poses live in equipment space. The same wrist points drive the arms.
const wrists=[
  [[-.100,-.156,.021],[.064,-.157,.090]],
  [[-.112,-.135,-.264],[.065,-.155,.098]],
  [[-.127,-.138,-.257],[.071,-.159,.100]]
];

export function gripHands(T){
  const v=(...p)=>new T.Vector3(...p);
  const fabric=sharedSet(T,'plaster',128);
  const leather=new T.MeshStandardMaterial({color:0x4e4438,map:fabric.map,normalMap:fabric.normalMap,roughness:.94});
  leather.normalScale.setScalar(.55);
  const pads=new T.MeshStandardMaterial({color:0x68604d,map:fabric.map,roughness:.96});
  const stitching=new T.MeshStandardMaterial({color:0x92846a,roughness:.95});
  const ellipsoid=new T.SphereGeometry(1,14,10);
  const poses=wrists.map((pair,model)=>{
    const group=new T.Group();group.name='Griffpose · '+model;
    for(const [hand,wrist] of pair.entries()){
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
        const drop=model===2?.013:0,yp=-.110-drop;
        form([wrist,[.057,yp-.032,.060],[.047,yp+.006,.040]], [.032,.033,.010]);
        oval(leather,[.047,yp,.042],[.023,.039,.034],-.40);
        oval(pads,[.068,yp,.044],[.007,.028,.025],-.33);
        for(let k=0;k<4;k++){
          const y=yp+.025-k*.0195;
          const points=k===0
            ? [[.054,y,.036],[.055,y+.010,-.008],[.047,y+.008,-.053],[.043,y+.003,-.076]]
            : [[.054,y,.023],[.044,y+.001,-.011],[.027,y+.003,-.029],[.001,y+.005,-.031],[-.015,y+.006,-.025]];
          form(points,[.012,.0105,.0019]);
        }
        form([[.046,yp+.014,.059],[.029,yp+.035,.071],[.002,yp+.048,.061],[-.022,yp+.048,.041]], [.016,.013,.002]);
        for(let k=0;k<6;k++)oval(stitching,[.068,yp-.022+k*.007,.061+k*.0014],[.0014,.0022,.0017]);
      } else if(model===0){
        form([wrist,[-.077,-.150,.009],[-.055,-.136,-.006]], [.030,.028,.011]);
        oval(leather,[-.053,-.136,-.005],[.024,.037,.025],-.22);
        oval(pads,[-.072,-.141,-.005],[.008,.025,.018],-.24);
        for(let k=0;k<4;k++){
          const y=-.106-k*.018;
          form([[-.057,y,.001],[-.052,y-.005,-.025],[-.026,y-.003,-.045],[-.004,y+.002,-.043]], [.011,.0092,.0017]);
        }
        form([[-.075,-.134,.030],[-.059,-.113,.016],[-.050,-.087,-.005],[-.051,-.079,-.033]], [.015,.012,.002]);
      } else {
        const wide=model===2,z=wide?-.332:-.347,x=wide?-.071:-.050;
        form([wrist,[x-.018,-.111,z+.042],[x+.026,-.075,z+.012]], [.031,.032,.014]);
        oval(leather,[x+.007,-.083,z+.012],[.041,.022,.044],-.17);
        oval(pads,[x-.017,-.101,z+.020],[.028,.007,.022]);
        for(let k=0;k<4;k++){
          const p=z-.024+k*.021;
          form([[x-.017,-.089,p+.013],[x-.019,-.069,p+.006],[x-.012,-.041,p],[x-.002,-.027+(k%2)*.005,p-.005]], [.011,.010,.0018]);
        }
        form([[x+.033,-.086,z+.043],[x+.060,-.074,z+.038],[x+.068,-.049,z+.022],[x+.055,-.038,z+.003]], [.015,.012,.002]);
      }
      for(const [material,list] of bins){
        group.add(new T.Mesh(mergeGeometries(list),material));list.forEach(g=>g.dispose());
      }
    }
    return group;
  });
  ellipsoid.dispose();
  return {poses,wrists};
}
