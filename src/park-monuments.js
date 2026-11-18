import {architectureKit} from './architecture-kit.js';
import {ageMasonry} from './surface-detail.js';

// OSM 568556985, 566152987; compressed scene coordinates. These also
// define planting exclusions for the gravel apron and monument clearing.
export const RUECKERT=[14.7,-119.4];
export const REITER=[-6.15,-164.1];
export function monumentClear(x,z,pad=0){
  return Math.hypot(x-RUECKERT[0],z-RUECKERT[1])<2.45+pad||
    Math.hypot(x-REITER[0],z-REITER[1])<3.2+pad;
}

export function addParkMonuments(T,root,world,height,finish){
  const stone=(name,tone,weather)=>{
    const m=finish(name).clone();m.vertexColors=false;m.color.setHex(tone);ageMasonry(m,weather);return m;
  };
  const dressed=stone('SANDSTONE_CUT',0xbebcb0,.33),sculpture=stone('FOUNTAIN_STONE',0xb3ae97,.56);
  const darker=stone('SANDSTONE_DARK',0x999a8d,.47);
  const iron=new T.MeshStandardMaterial({color:0x414741,roughness:.76,metalness:.36});
  const water=new T.MeshPhysicalMaterial({color:0x454c38,roughness:.21,metalness:.17,ior:1.33,envMapIntensity:.83});
  const materials={dressed,sculpture,darker,iron,water:{material:water,cast:false}};
  const frame=(x,z,angle)=>{
    const c=Math.cos(angle),s=Math.sin(angle),h=height(x,z);
    return (u,y,d)=>[x+c*u-s*d,y+h,z+s*u+c*d];
  };
  const show=(name,draw)=>{
    const g=new T.Group();g.name=name;root.add(g);
    const k=architectureKit(T,g,materials);draw(k,g);k.flush(name);
  };
  const glob=new T.SphereGeometry(1,16,10),rot=new T.Quaternion(),vec=new T.Vector3();
  const matrix=new T.Matrix4(),scale=new T.Vector3();
  function ball(kit,m,p,x,y,z,w,h,d,a=0){
    rot.setFromAxisAngle(vec.set(0,0,1),a);
    kit.geometry(m,glob,matrix.compose(new T.Vector3(...p(x,y,z)),rot,scale.set(w,h,d)));
  }
  show('Rückert-Brunnen · steinerne Nische (1904)',(kit,g)=>{
    const p=frame(...RUECKERT,-2.86),{box,quad}=kit;
    const collar=(u,y,r,h)=>{
      const col=new T.CylinderGeometry(r*.97,r,h,16),at=p(u,y,.015);
      kit.geometry('dressed',col,matrix.makeTranslation(...at));
      col.dispose();
    };
    box('darker',p,-1.60,1.60,-.12,.075,-1.43,1.04);
    box('dressed',p,-1.55,1.55,.075,.16,-1.39,1.00);
    box('darker',p,-1.14,1.14,.16,.77,-.98,-.83);
    box('dressed',p,-1.06,1.06,.16,.59,.09,.31);
    for(const s of [-1,1]){
      box('dressed',p,s===1?1.00:-1.40,s===1?1.40:-1.00,.16,.62,-1.18,.78);
      box('dressed',p,s===1?1.01:-1.42,s===1?1.42:-1.01,.61,.67,-1.17,.79);
      collar(s*.986,.66,.221,.12);collar(s*.986,1.08,.19,.85);collar(s*.986,1.49,.227,.13);
      box('dressed',p,s===1?1.12:-1.23,s===1?1.23:-1.12,.58,1.93,-1.21,-.19);
    }
    box('darker',p,-1.23,1.23,.48,2.041,-1.27,-1.10);
    box('water',p,-1.00,1.00,.36,.366,-1.089,.084);
    ball(kit,'iron',p,0,.91,-1.085,.096,.096,.038);
    box('iron',p,-.027,.027,.89,.931,-1.08,-.985);
    const inner=t=>p(Math.cos(t)*.815,1.48+.73*Math.sin(t),.158),
      outer=(t,depth)=>p(Math.cos(t)*1.31,1.65+Math.pow(Math.max(0,Math.sin(t)),.68)*.96,depth);
    for(let i=0;i<20;i++){
      const a=i*Math.PI/20,b=(i+1)*Math.PI/20,p0=inner(a),p1=inner(b),q0=outer(a,.178),q1=outer(b,.178);
      quad('dressed',p1,p0,q0,q1,1.55);
      quad('darker',p0,p1,p(Math.cos(b)*.815,p1[1]-height(...RUECKERT),-1.10),
        p(Math.cos(a)*.815,p0[1]-height(...RUECKERT),-1.10),1.45);
      quad('dressed',q1,q0,outer(a,-1.32),outer(b,-1.32),1.55);
    }
    // A narrow cut edge emphasizes the soft, recurved arch profile.
    for(const depth of [.185,-1.31]){
      const rail=new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:21},(_,i)=>new T.Vector3(...outer(i*Math.PI/20,depth)))),28,.041,7);
      kit.geometry('darker',rail,matrix.identity());rail.dispose();
    }
    const c=document.createElement('canvas');c.width=512;c.height=80;
    const ctx=c.getContext('2d');ctx.font='bold 48px Georgia';ctx.textAlign='center';
    ctx.fillStyle='#b3ae98';ctx.fillText('RÜCKERT-BRUNNEN',257,57,492);
    ctx.fillStyle='#797664';ctx.fillText('RÜCKERT-BRUNNEN',256,55,492);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    const label=new T.Mesh(new T.PlaneGeometry(1.51,.236),new T.MeshStandardMaterial({map,transparent:true,alphaTest:.044,roughness:1,depthWrite:false}));
    label.position.set(...p(0,2.352,.188));label.rotation.y=2.86;label.receiveShadow=true;g.add(label);
    const poly=[p(-1.58,0,-1.40),p(1.58,0,-1.40),p(1.58,0,.99),p(-1.58,0,.99)];
    world.polygon(poly.map(([x,,z])=>[x,z]));
  });

  // Distant sculptural cues from the local stone monument, not a scan:
  // one joined silhouette, raised forelegs, a hanging mane and draped rider.
  show('Reiterdenkmal Christian Ernst · Sandsteinsilhouette',kit=>{
    const p=frame(...REITER,Math.PI*.56),{box}=kit;
    for(const [x,z,base,top] of [[1.82,1.28,-.13,.17],[1.74,1.19,.17,.30],
      [1.64,1.12,.30,.47],[1.52,1.01,.47,.60],[1.37,.90,.60,1.95],
      [1.53,1.03,1.95,2.10],[1.69,1.13,2.10,2.27],[1.61,1.06,2.27,2.45]]){
      box(top<.6?'darker':'dressed',p,-x,x,base,top,-z,z);
    }
    for(const s of [-1,1]){
      box('darker',p,-1.05,1.05,.83,1.69,s*.906-.021,s*.906+.019);
      box('dressed',p,-1.01,1.01,.88,1.65,s*.906-.026,s*.906+.027);
    }
    // Tapered lofts have smooth normals and controlled oval sections, so
    // thighs, mane and robe blend instead of reading as primitive cylinders.
    function loft(stations,m='sculpture',ribs=11){
      const path=new T.CatmullRomCurve3(stations.map(s=>new T.Vector3(...s.slice(0,3))));
      const n=Math.max(stations.length*4,10),pos=[],uv=[],indices=[];
      const center=new T.Vector3(),t=new T.Vector3(),lateral=new T.Vector3(),up=new T.Vector3(),side=new T.Vector3(0,0,1);
      for(let i=0;i<=n;i++){
        const v=i/n;path.getPoint(v,center);path.getTangent(v,t);
        lateral.copy(side).addScaledVector(t,-side.dot(t)).normalize();
        up.copy(lateral).cross(t).normalize();
        const idx=Math.min(stations.length-2,Math.floor(v*(stations.length-1))),k=v*(stations.length-1)-idx;
        const a=T.MathUtils.lerp(stations[idx][3],stations[idx+1][3],k),b=T.MathUtils.lerp(stations[idx][4],stations[idx+1][4],k);
        for(let j=0;j<=ribs;j++){
          const w=j/ribs*Math.PI*2,dx=Math.cos(w)*a,dy=Math.sin(w)*b;
          const q=center.clone().addScaledVector(up,dx).addScaledVector(lateral,dy);
          pos.push(...p(q.x,q.y,q.z));uv.push(j/ribs*1.26,v*1.93);
          if(i&&j){const s=i*(ribs+1)+j,prev=s-ribs-1;indices.push(prev-1,s,s-1,prev-1,prev,s);}
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      g.setIndex(indices);g.computeVertexNormals();
      const normals=g.attributes.normal;
      for(let i=0;i<=n;i++){
        const a=i*(ribs+1),b=a+ribs;
        const q=new T.Vector3().fromBufferAttribute(normals,a).add(new T.Vector3().fromBufferAttribute(normals,b)).normalize();
        normals.setXYZ(a,q.x,q.y,q.z);normals.setXYZ(b,q.x,q.y,q.z);
      }
      kit.geometry(m,g,matrix.identity());g.dispose();
    }
    loft([[-1.35,3.42,0,.012,.016],[-1.08,3.64,0,.41,.41],[-.68,3.66,0,.46,.447],[0,3.73,0,.37,.337],[.61,3.88,0,.43,.344],[.91,3.97,0,.24,.26],[1.04,3.95,0,.015,.012]]);
    loft([[.41,3.65,0,.19,.17],[.69,4.05,0,.30,.30],[.71,4.50,0,.29,.205],[.87,4.72,.015,.204,.15],[1.06,4.70,.039,.125,.109]]);
    loft([[.74,4.67,.021,.07,.084],[.99,4.70,.048,.206,.151],[1.20,4.55,.068,.173,.125],[1.35,4.30,.070,.112,.098],[1.42,4.255,.071,.057,.071],[1.46,4.235,.071,.013,.016]]);
    for(const s of [-1,1]){
      loft([[.93,4.65,s*.117,.064,.05],[.94+s*.029,4.85,s*.119,.067,.041],[1.00+s*.024,4.99,s*.131,.009,.012]],'sculpture',8);
      ball(kit,'darker',p,1.109,4.643,s*.177,.073,.041,.019,.21);
      ball(kit,'sculpture',p,1.076,4.658,s*.172,.092,.026,.033,.29);
      ball(kit,'darker',p,1.391,4.303,s*.14,.042,.032,.017,-.43);
      loft([[-.92,3.72,s*.265,.20,.18],[-.907,3.28,s*.29,.237,.172],[-1.09,2.95,s*.29,.11,.10],[-.98,2.55,s*.292,.082,.080],[-.86,2.51,s*.290,.092,.105],[-.84,2.48,s*.294,.012,.015]]);
      const offset=s*.14;
      loft([[.64,3.81,s*.241,.19,.15],[.81,3.44,s*.272,.126,.103],[1.23+offset,3.27+s*.12,s*.284,.096,.074],[1.36+offset,2.99+s*.17,s*.31,.073,.062],[1.28+offset,2.86+s*.18,s*.31,.082,.088],[1.25+offset,2.83+s*.19,s*.31,.012,.013]]);
      // The stone stirrup and hanging boot follow distinctly different
      // contours from the horse's legs.
      loft([[-.29,4.29,s*.257,.177,.16],[.035,4.02,s*.428,.135,.115],[.146,3.67,s*.422,.101,.096],[.31,3.55,s*.429,.076,.089],[.43,3.555,s*.421,.026,.026]]);
      loft([[-.22,4.82,s*.194,.14,.13],[-.11,4.562,s*.247,.12,.095],[.112,4.40,s*.295,.077,.08],[.37,4.45,s*.251,.062,.069],[.405,4.465,s*.247,.031,.038]]);
      loft([[.39,4.453,s*.253,.018,.026],[.73,4.351,s*.166,.020,.020],[1.15,4.303,s*.151,.020,.022],[1.347,4.385,s*.153,.016,.025]],'darker',7);
    }
    loft([[-.37,4.11,0,.113,.201],[-.27,4.43,0,.239,.275],[-.205,4.75,0,.223,.277],[-.17,5.002,0,.145,.184],[-.117,5.071,0,.087,.087]]);
    ball(kit,'sculpture',p,-.10,5.174,0,.149,.204,.138,-.18);
    ball(kit,'sculpture',p,.02,5.179,-.01,.067,.113,.094,-.15);
    loft([[-.17,5.37,0,.017,.035],[-.245,5.29,0,.092,.121],[-.294,5.085,0,.107,.157],[-.357,4.966,0,.05,.16]],'darker',10);
    loft([[-.27,4.90,0,.116,.23],[-.48,4.68,.01,.17,.285],[-.64,4.41,.08,.13,.317],[-.69,4.21,.17,.048,.24],[-.71,4.13,.23,.012,.038]]);
    for(let i=0;i<5;i++){
      const z=(i-2)*.071;
      loft([[-.285,4.89,z*.67,.021,.027],[-.534,4.62,z*1.53,.038,.043],
        [-.666,4.38,.07+z*1.74,.044,.047],[-.724,4.14,.16+z*1.36,.013,.017]],'dressed',7);
    }
    for(let i=0;i<6;i++){
      const z=(i-2.5)*.045,w=.041+i%2*.029;
      loft([[-1.25,3.67,z,.035,.033],[-1.41,3.45,z+.038,w,.043],[-1.45,3.23,z-.023,w,.038],
        [-1.36,2.94,z+.022,w,.039],[-1.47,2.74,z-.023,.054,.037],[-1.38,2.51,z+.015,.028,.024]],i%3?'sculpture':'darker',8);
      loft([[.90,4.82,z,.027,.026],[.73,4.743,z,.045,.057],[.55,4.57,z,.042,.054],
        [.45,4.28,z,.047,.066],[.34,4.10,z,.015,.038]],i%2?'sculpture':'darker',8);
    }
    // Low drapery and the underlying carved mass tie the raised hooves
    // securely into the original one-stone composition.
    loft([[-1.43,2.55,.30,.025,.039],[-1.02,2.57,.35,.12,.23],[-.60,2.69,.37,.19,.34],
      [-.27,2.84,.29,.237,.367],[.29,2.71,.27,.237,.39],[.81,2.59,.17,.105,.26],[1.30,2.54,0,.037,.063]]);
    ball(kit,'sculpture',p,.40,2.83,.348,.198,.202,.14,-.18);
    ball(kit,'sculpture',p,-.35,2.78,-.342,.154,.193,.127,.37);
    world.box(REITER[0]-1.52,REITER[1]-1.93,REITER[0]+1.52,REITER[1]+1.93);
  });
  glob.dispose();
}
