import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function closedPalm(T,side){
  const rings=[[.099,.019,-.012,.018],[.084,.023,-.011,.020],[.063,.027,-.009,.023],[.045,.036,-.005,.028],[.025,.044,-.002,.032],
    [.004,.048,-.001,.034],[-.018,.047,-.003,.034],[-.035,.041,-.005,.027],[-.042,.030,-.005,.018],[-.047,.006,-.005,.005]];
  const p=[],uv=[],indices=[],rgb=[],sides=24;
  const tint=new T.Color(),warm=new T.Color(1,.87,.82),neutral=new T.Color(.99,.97,.95);
  for(const [i,[z,w,y0,h]] of rings.entries())for(let k=0;k<=sides;k++){
    const t=k/sides,a=t*Math.PI*2,c=Math.cos(a),s=Math.sin(a),u=i/(rings.length-1),ridge=Math.max(0,s);
    const x=side*(Math.sign(c)*Math.abs(c)**.86*w+.0045*Math.sin(u*Math.PI)),
      y=y0+Math.sign(s)*Math.abs(s)**.91*h+ridge**3*Math.sin(u*Math.PI)*(.0016+.0015*Math.cos(x*363));
    p.push(x,y,z-.006*side*x/.050*u);uv.push(t,u);
    tint.copy(neutral).lerp(warm,u*.43+Math.max(0,-s)*.38);
    const contour=.97+.035*ridge-.072*Math.exp(-((u-.33)**2)*122)*Math.max(0,-s);
    rgb.push(tint.r*contour,tint.g*contour,tint.b*contour);
    if(i<rings.length-1&&k<sides){
      const j=i*(sides+1)+k,d=sides+1;
      if(side>0)indices.push(j,j+d,j+1,j+1,j+d,j+d+1);
      else indices.push(j,j+1,j+d,j+1,j+d+1,j+d);
    }
  }
  // Close the end under the sleeve as well as the little pad under the
  // curled fingers. A close-up must not see through the wrist at the cuff.
  for(const i of [0,rings.length-1]){
    const pole=p.length/3,start=i*(sides+1),front=i!==0;
    p.push(0,rings[i][2],rings[i][0]+(front?-.001:.002));
    rgb.push(.87,.79,.74);uv.push(.5,front?1:0);
    for(let j=0;j<sides;j++){
      if((side>0)!==front)indices.push(pole,start+j,start+j+1);
      else indices.push(pole,start+j+1,start+j);
    }
  }
  const g=new T.BufferGeometry();g.setIndex(indices);
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.computeVertexNormals();
  const out=g.toNonIndexed();g.dispose();return out;
}

// Each palm is local to its own contact, also used by the forearm rig.
export function gripHands(T,specs){
  const v=(...p)=>new T.Vector3(...p);
  const skin=new T.MeshStandardMaterial({color:0xd69e87,roughness:.63,vertexColors:true});
  const nails=new T.MeshStandardMaterial({color:0xd8a594,roughness:.45});
  const ellipsoid=new T.SphereGeometry(1,20,14);
  const neutral=new T.Color(1,1,1),flush=new T.Color(1,.79,.74);
  const poses=specs.map(spec=>{
    const fist=spec.kind==='fist',pistol=spec.kind==='pistol',bow=spec.kind==='bow',archive=spec.kind==='archive',group=new T.Group(),nodes=[],wrists=fist?
      [v(0,-.010,.067),v(0,-.010,.067)]:[
      pistol?v(-.077,-.050,.093):bow?v(-.092,-.044,.089):archive?v(-.086,-.035,.081):v(-.107,-.035,.083),v(.055,-.043,.094)];
    group.name='Griffpose · '+spec.kind;
    for(const [hand,w] of wrists.entries()){
      const node=new T.Group();node.position.fromArray(hand===0?spec.fore:spec.grip);
      group.add(node);nodes.push(node);
      const wrist=w.toArray();
      const bins=new Map();
      function add(material,geo){
        if(material===skin&&!geo.hasAttribute('color')){
          const colors=new Float32Array(geo.attributes.position.count*3).fill(1);
          geo.setAttribute('color',new T.BufferAttribute(colors,3));
        }
        if(!bins.has(material))bins.set(material,[]);
        bins.get(material).push(geo);
      }
      function oval(material,p,s,angle=0){
        const g=ellipsoid.toNonIndexed();g.scale(...s);g.rotateX(angle);g.translate(...p);add(material,g);
      }
      function form(points,radii,flat=.89,finger=false,out=null){
        // One smooth, tapered mesh per finger, with no disconnected joints.
        const curve=new T.CatmullRomCurve3(points.map(p=>v(...p))),count=points.length*6,segments=14;
        const g=new T.TubeGeometry(curve,count,1,segments,false),a=g.attributes.position;
        const p=v(),q=v(),tint=new T.Color(),colors=new Float32Array(a.count*3);
        for(let j=0;j<=count;j++){
          curve.getPointAt(j/count,p);
          const u=j/count,knot=Math.sin(u*Math.PI),tip=Math.max(0,(u-.85)/.15);
          const taper=finger?Math.sqrt(Math.max(.000484,1-tip*tip)):1;
          const r=(T.MathUtils.lerp(radii[0],radii[2],u)+
            (radii[1]-(radii[0]+radii[2])*.5)*knot)*taper;
          tint.copy(neutral).lerp(flush,finger?.56*u+.31*Math.exp(-((u-.34)**2)*220):.07*u);
          for(let k=0;k<=segments;k++){
            const t=k/segments*Math.PI*2;
            q.copy(p).addScaledVector(g.normals[j],-Math.cos(t)*r)
              .addScaledVector(g.binormals[j],Math.sin(t)*r*flat);
            const idx=j*(segments+1)+k;
            a.setXYZ(idx,q.x,q.y,q.z);tint.toArray(colors,idx*3);
          }
        }
        g.setAttribute('color',new T.BufferAttribute(colors,3));
        // Smooth across the duplicate seam while preserving the rounded end.
        g.computeVertexNormals();
        const n=g.attributes.normal;
        for(let j=0;j<=count;j++){
          const a=j*(segments+1),b=a+segments;
          p.fromBufferAttribute(n,a).add(q.fromBufferAttribute(n,b)).normalize();
          n.setXYZ(a,p.x,p.y,p.z);n.setXYZ(b,p.x,p.y,p.z);
        }
        const smooth=g.toNonIndexed();add(skin,smooth);g.dispose();
        if(!out)return;
        const t=.874,across=v(),normal=v(...out);
        curve.getPointAt(t,p);curve.getTangentAt(t,q);
        normal.addScaledVector(q,-normal.dot(q)).normalize();
        across.crossVectors(q,normal).normalize();
        const gN=ellipsoid.toNonIndexed(),m=new T.Matrix4().makeBasis(across,q,normal);
        const radius=T.MathUtils.lerp(radii[0],radii[2],t);
        gN.scale(radius*.63,Math.min(.008,curve.getLength()*.085),.0015);
        p.addScaledVector(normal,radius*.91);m.setPosition(p);gN.applyMatrix4(m);add(nails,gN);
      }
      const finger=(points,r,out)=>form(points,r,.94,true,out);
      if(fist){
        const s=hand===1?-1:1;
        add(skin,closedPalm(T,s));
        for(let i=0;i<4;i++){
          const x=(.033-i*.0215)*s,r=[.012,.0125,.0118,.0097][i],z=[-.046,-.050,-.046,-.035][i];
          const crest=[.021,.023,.020,.013][i];
          finger([[x,.009,-.007],[x,crest,z+.011],[x,.009,z],[x-s*.002,-.011,z+.002],
            [x-s*.004,-.021,z+.018],[x-s*.005,-.018,z+.029]],[r+.003,r+.0004,r*.91],[0,-1,-.2]);
        }
        finger([[s*.034,.000,.025],[s*.045,-.013,.013],[s*.046,-.027,-.011],
          [s*.027,-.035,-.025],[s*.008,-.030,-.030]],[.016,.014,.010],[0,-1,-.26]);
      } else if(hand===1){
        form([wrist,[.050,-.030,.072],[.042,.001,.030]], [.024,.026,.013]);
        oval(skin,[.041,-.003,.025],[.018,.039,.034],-.38);
        for(let k=0;k<4;k++){
          const y=.033-k*.020,end=[-.020,-.027,-.024,-.012][k],r=k===3?.007:.009;
          const points=k===0
            ? [[.043,y,.021],[.045,y+.012,-.011],[.039,y+.016,-.044],[.032,y+.013,-.066]]
            : [[.043,y,.017],[.043,y,-.016],[.026,y+.003,-.036],[.006,y+.005,-.042],[end,y+.004,-.033]];
          finger(points,[r+.002,r+.001,r*.81],k===0?[1,0,.1]:[0,0,-1]);
        }
        finger([[.042,.015,.054],[.028,.034,.058],[.006,.044,.058],[-.018,.042,.048]],
          [.014,.012,.009],[0,.8,.6]);
      } else if(pistol){
        form([wrist,[-.053,-.034,.069],[-.023,-.013,.045],[-.005,-.001,.029]], [.024,.026,.012]);
        oval(skin,[-.021,-.013,.035],[.023,.031,.033],-.37);
        for(let k=0;k<4;k++){
          const y=.017-k*.017,r=k===3?.007:.0085,end=[.033,.046,.042,.034][k];
          finger([[-.026,y,.028],[-.021,y+.009,.006],[.001,y+.010,-.015],
            [.021,y+.009,-.018],[end,y+.004,-.006]],[r+.002,r+.001,r*.88],[0,0,-1]);
        }
        finger([[-.035,.008,.058],[-.025,.034,.047],[-.018,.050,.018],[-.016,.052,-.010]],
          [.014,.011,.008],[-1,.4,0]);
      } else if(bow){
        // Palm cradles the stock. From the camera side only the thumb
        // crosses the visible wood; the other digits close on the far side.
        form([wrist,[-.062,-.035,.060],[-.034,-.028,.035],[.008,-.024,.014]], [.024,.025,.013]);
        oval(skin,[.006,-.023,.015],[.042,.018,.043],-.09);
        oval(skin,[-.032,-.015,.032],[.021,.021,.029],-.34);
        for(let i=0;i<4;i++){
          const z=-.028+i*.020,L=[.034,.039,.036,.028][i],r=i===3?.0075:.009;
          finger([[.024,-.024,z+.009],[.047,-.014,z+.004],[.055,.007,z],
            [.052,L*.74,z-.002],[.043,L,z-.006]],[r+.002,r+.001,r*.9],[1,.25,0]);
        }
        finger([[-.036,-.021,.045],[-.049,-.007,.030],[-.049,.012,.015],[-.043,.031,.000],[-.034,.039,-.013]],
          [.015,.012,.0095],[-1,.18,-.19]);
      } else if(archive){
        // Screen-side silhouette: continuous wrist to dorsum. Individual
        // digits follow the far cheek of this particular wooden shell.
        form([wrist,[-.059,-.027,.060],[-.035,-.012,.030],[.003,-.013,.010]], [.023,.026,.014],.83);
        oval(skin,[-.024,-.014,.021],[.036,.018,.039],-.23);
        for(let k=0;k<4;k++){
          const z=-.026+k*.018,r=k===3?.007:.0085,h=[.028,.040,.034,.024][k];
          finger([[.012,-.021,z+.008],[.030,-.015,z+.004],[.039,.002,z],
            [.037,h*.78,z-.002],[.026,h,z-.005]],[r+.002,r+.001,r*.89],[1,.3,0]);
        }
        finger([[-.033,-.011,.044],[-.041,.001,.027],[-.040,.016,.012],
          [-.035,.019,-.005],[-.030,.016,-.022]],[.013,.011,.0085],[-1,.21,-.18]);
      } else {
        const w=spec.kind==='shotgun'?.051:.047;
        form([wrist,[-.072,-.035,.049],[-.039,-.021,.020],[-.023,-.015,.007]], [.024,.025,.012]);
        oval(skin,[-.027,-.019,.014],[.037,.018,.042],-.15);
        oval(skin,[-.005,-.012,.034],[.023,.017,.027],.15);
        for(let k=0;k<4;k++){
          const z=-.028+k*.020,reach=[.030,.041,.038,.027][k],r=k===3?.0075:.009;
          finger([[-.041,-.021,z+.008],[-w-.012,-.008,z+.005],
            [-w-.015,.016,z+.002],[-w-.008,reach*.85,z],[-w+.001,reach,z-.005]],
            [r+.002,r+.0008,r*.88],[-1,.25,0]);
        }
        finger([[-.005,-.016,.048],[w*.56,-.015,.045],[w+.006,.005,.035],[w+.005,.026,.022]],
          [.014,.012,.009],[1,.25,0]);
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
