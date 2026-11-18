import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomSource,sharedSet} from './surface-detail.js';

// Original, cosmetic viewmodels. All three use the existing rig anchors;
// apparent slots and emitters are capped and carry no functional internals.
function finishMaps(T,kind){
  const size=128,hash=randomSource(kind==='steel'?8927:7387);
  const points=Float32Array.from({length:size*size},hash);
  const lines=Float32Array.from({length:size},hash),grain=new Float32Array(points.length);
  const color=new Uint8Array(points.length*4),normal=new Uint8Array(color.length),rough=new Uint8Array(color.length);
  const at=(x,y)=>points[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x,p=i*4,n=points[i]-.5;
    const broad=(at(x,y)+at(x+23,y+73)+at(x+24,y+73)+at(x+22,y+73))*.25-.5;
    const brush=lines[y]-.5,traces=Math.max(0,brush-.455)*Math.pow(at(Math.floor(x/27)*21,y),3);
    const steel=kind==='steel',signal=steel?brush*.62+broad*.42+n*.15+traces*2.7:n*.48+broad*.48;
    grain[i]=signal*(steel?.14:.26);
    const albedo=(steel?225:235)+signal*(steel?34:23);
    color.set([albedo,albedo,albedo,255],p);
    const r=222+signal*(steel?45:23)-traces*195;
    rough.set([r,r,r,255],p);
  }
  const h=(x,y)=>grain[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=h(x-1,y)-h(x+1,y),ny=h(x,y-1)-h(x,y+1),l=127/Math.hypot(nx,ny,1);
    normal.set([128+nx*l,128+ny*l,128+l,255],4*(y*size+x));
  }
  const texture=(data,srgb=false)=>{
    const t=new T.DataTexture(data,size,size);
    t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
    t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.anisotropy=4;
    t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;
    return t;
  };
  return {map:texture(color,true),normalMap:texture(normal),roughnessMap:texture(rough)};
}

function surfaceWear(material,wear){
  material.onBeforeCompile=shader=>{
    shader.uniforms.erlGearWear={value:wear};
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 gearP;varying vec3 gearN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\ngearP=position;gearN=normal;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>',`#include <common>
        varying vec3 gearP;varying vec3 gearN;uniform float erlGearWear;
        float gearHash(vec3 p){return fract(sin(dot(p,vec3(12.57,51.83,87.31)))*43758.5453);}
      `)
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 n=abs(normalize(gearN));
        float rolled=smoothstep(.035,.28,1.-max(n.x,max(n.y,n.z)));
        float worn=(.41+.59*gearHash(floor(gearP*vec3(224.,289.,97.))))*rolled;
        float speck=gearHash(floor(gearP*vec3(308.,362.,209.)));
        float trace=gearHash(floor(gearP*vec3(390.,445.,63.)));
        float marks=smoothstep(.89,.989,trace)*smoothstep(.2,.92,speck)*.16;
        float handling=clamp(worn+marks,0.,1.)*erlGearWear;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.20+vec3(.115,.113,.107),handling);
      `)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+speck*.05-handling*.17,.24,.98);
      `);
  };
  material.customProgramCacheKey=()=>'erl-gear-finish-v1';
}

export function makeEquipment(T,specs){
  const brushed=finishMaps(T,'steel'),powder=finishMaps(T,'coat');
  const oak=sharedSet(T,'wood',256);
  function finish(color,roughness,metalness,maps,normal,wear=0){
    const m=new T.MeshStandardMaterial({color,roughness,metalness,...maps});
    m.normalScale.set(normal,normal);
    if(wear)surfaceWear(m,wear);
    return m;
  }
  const black=finish(0x353e43,.71,.53,brushed,.23,.27);
  const steel=finish(0x647079,.60,.60,brushed,.30,.47);
  const bare=finish(0x9ba6ac,.57,.67,brushed,.26,.29);
  const dark=finish(0x1e2426,.83,.22,powder,.26);
  const infill=finish(0x151b1d,.86,.12,powder,.18);
  const rubber=finish(0x333634,.97,.03,powder,.41);
  const brass=finish(0xb99b66,.61,.63,brushed,.22,.27);
  const amber=finish(0x845d43,.67,.45,brushed,.20,.21);
  const walnut=finish(0xc59167,.89,.015,oak,.47,.16);
  const walnutShade=finish(0x996d51,.97,.015,oak,.53,.13);
  const phosphate=finish(0x66756a,.88,.31,powder,.35,.22);
  const slate=finish(0x596970,.82,.34,powder,.36,.26);
  const mount=finish(0x505756,.79,.22,powder,.32,.13);
  for(const m of [walnut,walnutShade])m.userData.wood=true;
  const clear=new T.MeshPhysicalMaterial({color:0x91bbbd,roughness:.24,metalness:.19,transparent:true,opacity:.22,depthWrite:false});
  const screw=new T.CylinderGeometry(.5,.5,1,12);
  const eyelet=new T.SphereGeometry(.5,12,8);
  const M=new T.Matrix4(),Q=new T.Quaternion(),V=(x,y,z)=>new T.Vector3(x,y,z),E=new T.Euler();
  const transform=new T.Matrix4().makeRotationY(Math.PI*.5);
  const boxCache=new Map();
  function makeBox(w,h,d,r){
    const rad=Math.min(w*.25,h*.25,d*.25,r);
    const key=[w,h,d,rad].join(':');
    if(!boxCache.has(key))boxCache.set(key,new RoundedBoxGeometry(w,h,d,rad>.003?2:1,rad));
    return boxCache.get(key);
  }
  function assemble(label){
    const root=new T.Group();root.name=label;const bins=new Map();
    function add(source,mat,at=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
      const g=source.index?source.toNonIndexed():source.clone();
      g.clearGroups();
      Q.setFromEuler(E.set(...rotation));g.applyMatrix4(M.compose(V(...at),Q,V(...scale)));
      // A metric repeat in device space; grain runs the length of the stock.
      // Choose projection once per triangle so normal maps never interpolate
      // across two different UV axes at a machined edge.
      const p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal,wood=mat.userData.wood;
      for(let i=0;i<p.count;i+=3){
        const [x,y,z]=[Math.abs(n.getX(i)+n.getX(i+1)+n.getX(i+2)),
          Math.abs(n.getY(i)+n.getY(i+1)+n.getY(i+2)),Math.abs(n.getZ(i)+n.getZ(i+1)+n.getZ(i+2))];
        const face=x>=y&&x>=z?0:y>=z?1:2;
        for(let k=i;k<i+3;k++){
          const a=p.getX(k),b=p.getY(k),c=p.getZ(k);
          if(wood)uv.setXY(k,(face===2?a:c)/.32,(face===0?b:a)/.115);
          else uv.setXY(k,(face===2?a:c)/.082,(face===0?b:face===1?a:b)/.066);
        }
      }
      if(!bins.has(mat))bins.set(mat,[]);
      bins.get(mat).push(g);
    }
    const box=(mat,at,size,r=.002,rot)=>add(makeBox(...size,r),mat,at,[1,1,1],rot);
    function polygon(points){
      const s=new T.Shape();
      points.forEach(([z,y],i)=>i?s.lineTo(-z,y):s.moveTo(-z,y));s.closePath();
      return s;
    }
    function profile(mat,points,width,x=0,r=.003,holes=[]){
      const s=polygon(points);
      for(const path of holes)s.holes.push(polygon(path));
      const g=new T.ExtrudeGeometry(s,{depth:width-2*r,bevelEnabled:r>0,bevelThickness:r,bevelSize:r,
        bevelSegments:2,steps:1,curveSegments:8});
      g.translate(0,0,-(width-2*r)*.5);g.applyMatrix4(transform);
      add(g,mat,[x,0,0]);g.dispose();
    }
    function cyl(mat,x,y,z,r,len,axis='z'){
      add(screw,mat,[x,y,z],[r*2,len,r*2],axis==='x'?[0,0,-Math.PI*.5]:
        axis==='y'?[0,0,0]:[Math.PI*.5,0,0]);
    }
    function collar(mat,x,y,z,ro,ri,len,segments=20){
      const chamfer=Math.min(len*.19,(ro-ri)*.36),p=(r,y)=>new T.Vector2(r,y),d=len*.5;
      const outlines=[p(ri,-d),p(ro-chamfer,-d),p(ro,-d+chamfer),p(ro,d-chamfer),p(ro-chamfer,d),
        p(ri,d),p(ri,-d)];
      const g=new T.LatheGeometry(outlines,segments);
      add(g,mat,[x,y,z],[1,1,1],[Math.PI*.5,0,0]);g.dispose();
    }
    function pin(x,y,z,rad=.006,face=black){
      cyl(face,x,y,z,rad,.004,'x');
      const s=Math.sign(x);
      box(infill,[x+s*.0022,y,z],[.0011,rad*.25,rad*1.27],.0002,[.39*s,0,0]);
    }
    function boltTop(y,z,r=.004){
      cyl(bare,0,y,z,r,.0028,'y');box(infill,[0,y+.00155,z],[r*1.15,.0008,r*.31],.0002);
    }
    function emitter(x,y,z,outer,light){
      collar(black,x,y,z+.012,outer,outer*.68,.032);
      collar(steel,x,y,z+.002,outer*.87,outer*.72,.012);
      cyl(infill,x,y,z+.016,outer*.66,.004);
      collar(bare,x,y,z+.009,outer*.55,outer*.47,.007);
      cyl(light,x,y,z+.012,outer*.27,.003);
    }
    function stamp(code,x,y,z,w,h,inverse=false){
      // Small in-world maker's label, suppressed in the color map's cutouts.
      const canvas=document.createElement('canvas');canvas.width=192;canvas.height=64;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#c9c7b4';ctx.font='bold 30px monospace';ctx.textAlign='left';
      ctx.fillText(code,5,33);
      ctx.fillRect(6,42,97,2);
      for(let i=0;i<6;i++)ctx.fillRect(120+i*6,43,2+(i%2),10);
      const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;
      const tag=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({
        map:t,color:inverse?0xbfc2b8:0xd8c7a6,roughness:.95,transparent:true,alphaTest:.36,depthWrite:false
      }));
      tag.position.set(x,y,z);tag.rotation.y=Math.sign(x)*Math.PI*.5;tag.name='Werkkennzeichen';root.add(tag);
    }
    function build(){
      for(const [material,list] of bins){
        const g=mergeGeometries(list),mesh=new T.Mesh(g,material);root.add(mesh);
        list.forEach(g=>g.dispose());
      }
      return root;
    }
    return {add,box,profile,cyl,collar,pin,boltTop,emitter,stamp,build};
  }

  const devices=specs.map((s,i)=>{
    const A=assemble(s.label),{add,box,profile,cyl,collar,pin,boltTop,emitter,stamp}=A;
    const ink=new T.MeshStandardMaterial({color:s.color,emissive:s.color,emissiveIntensity:.39,roughness:.44});
    const grip=s.grip[1],front=s.emit[2];
    if(i!==2){
      profile(dark,[[.060,-.043],[.079,grip-.059],[.050,grip-.070],[-.017,grip-.061],[-.039,-.071],[-.018,-.049]],.065,0,.005);
      for(const side of [-1,1]){
        profile(rubber,[[.049,-.059],[.067,grip-.045],[.037,grip-.057],[-.014,grip-.049],[-.027,-.077]],.014,side*.031,.003);
        for(let k=0;k<8;k++){
          box(mount,[side*.038,-.074-k*.011,.013+k*.003],[.003,.0034,.057-k*.0016],.0006,[-.22,0,-side*.12]);
        }
        pin(side*.038,-.089,.039,.004,steel);pin(side*.038,grip-.034,.024,.0035,steel);
      }
      box(mount,[0,grip-.058,.044],[.075,.012,.092],.003,[-.24,0,0]);
      profile(black,[[-.026,-.045],[-.105,-.048],[-.105,-.080],[-.089,-.117],[-.032,-.117],[-.014,-.098]],
        .057,0,.004,[[[-.033,-.061],[-.087,-.062],[-.088,-.082],[-.079,-.102],[-.045,-.102],[-.030,-.091]]]);
    }
    if(i===0){
      profile(slate,[[.057,.022],[.043,-.039],[-.127,-.047],[-.230,-.027],[-.239,.019],[-.188,.040],[-.011,.043]],.094,0,.006);
      // A faceted top plate, rear serrations and undercut side plates set
      // the compact silhouette apart from the longer profiles.
      profile(black,[[.044,.024],[.038,.044],[.011,.059],[-.185,.059],[-.213,.050],[-.233,.027]],.091,0,.005);
      box(steel,[0,.056,-.085],[.063,.006,.162],.002);
      box(infill,[0,.060,-.047],[.045,.003,.065],.001);
      box(bare,[-.003,.062,-.048],[.031,.003,.050],.0008);
      // This rear face is prominent at the hip, even at low resolutions.
      box(infill,[0,-.005,.0548],[.075,.049,.008],.0026,[.224,0,0]);
      box(black,[0,-.005,.0583],[.066,.041,.0072],.0021,[.224,0,0]);
      box(steel,[0,.009,.064],[.046,.008,.0035],.0011,[.224,0,0]);
      for(const x of [-.022,.022]){
        cyl(steel,x,-.011,.061,.0044,.004);
        box(infill,[x,-.011,.0632],[.0046,.0013,.0007],.00016,[0,0,x<0?.51:-.51]);
      }
      box(bare,[0,-.020,.0586],[.027,.0027,.002],.0005,[.224,0,0]);
      box(black,[0,-.017,-.185],[.076,.019,.088],.002);
      for(let j=0;j<5;j++)box(steel,[0,-.027,-.145-j*.015],[.074,.007,.0028],.0006);
      for(const d of [-1,1]){
        const s=d*.0476;
        profile(steel,[[.023,.018],[-.006,-.003],[-.157,-.005],[-.198,.006],[-.202,.021],[-.003,.027]],.009,s,.0017);
        profile(infill,[[.023,.034],[.016,.014],[-.037,.008],[-.052,.019],[-.045,.040]],.008,d*.0455,.0013);
        for(let k=0;k<7;k++){
          const z=.018-k*.0086;
          box(steel,[d*.051,.026,z],[.004,.022,.0030],.0005,[-.33,0,-d*.10]);
        }
        box(infill,[d*.049,.006,-.156],[.009,.015,.058],.0014);
        box(amber,[d*.053,.001,-.156],[.004,.003,.049],.0005);
        for(let j=0;j<3;j++)box(ink,[d*.054,.007,-.169+j*.011],[.0013,.004,.0045],.0003);
        pin(d*.050,-.018,-.105,.005,black);
        pin(d*.049,-.011,-.211,.004,steel);
        stamp('KS·04',d*.053,.016,-.091,.070,.017);
      }
      emitter(0,s.emit[1],front,.038,ink);
      box(black,[0,.059,.024],[.063,.010,.027],.0015);
      for(const side of [-1,1]){
        box(steel,[side*.022,.070,.024],[.013,.022,.024],.0018);
        box(infill,[side*.022,.072,.037],[.009,.009,.003],.0006);
      }
      box(black,[0,s.sight[1]-.007,s.sight[2]],[.024,.015,.031],.0015);
      box(ink,s.sight,[.008,.007,.012],.0006);
    }else if(i===1){
      profile(black,[[.040,-.037],[.047,.039],[.005,.062],[-.228,.063],[-.277,.032],[-.255,-.049],[-.096,-.061]],.088,0,.005);
      profile(phosphate,[[-.005,.029],[-.047,.051],[-.246,.049],[-.276,.018],[-.237,-.030],[-.049,-.035]],.100,0,.004);
      profile(black,[[-.092,-.056],[-.177,-.060],[-.192,-.147],[-.136,-.187],[-.097,-.168],[-.075,-.094]],.061,0,.0037);
      box(mount,[0,-.166,-.129],[.072,.019,.090],.003,[-.26,0,0]);
      profile(mount,[[.042,.042],[.216,.049],[.269,.018],[.286,-.073],[.259,-.093],[.150,-.068],[.062,-.010]],
        .069,0,.0037,[[[.079,.013],[.198,.025],[.233,.008],[.239,-.047],[.170,-.037],[.090,-.005]]]);
      box(rubber,[0,-.029,.273],[.077,.130,.028],.005,[-.083,0,0]);
      for(let k=0;k<8;k++)box(infill,[0,-.078+k*.014,.287],[.069,.003,.004],.00055);
      cyl(steel,0,.024,-.508,.022,.332);
      for(const d of [-1,1]){
        const x=d*.038;
        box(black,[x,.036,-.411],[.017,.034,.318],.0024);
        box(mount,[d*.041,-.027,-.398],[.024,.022,.285],.0025);
        for(let j=0;j<7;j++){
          const z=-.281-j*.040;
          box(phosphate,[d*.037,.005,z],[.029,.082,.028],.002,[.19,0,-d*.17]);
          box(bare,[d*.040,.046,z-.003],[.020,.004,.017],.00075);
          box(infill,[d*.049,-.011,z],[.004,.027,.019],.0014);
        }
        for(const z of [-.063,-.237,-.502])pin(d*(z<-.4?.050:.054),.013,z,.007,steel);
        profile(infill,[[-.065,.016],[-.091,.035],[-.200,.034],[-.213,.008],[-.179,-.002],[-.076,-.0005]],.006,d*.050,.0019);
        box(steel,[d*.053,.024,-.131],[.006,.013,.120],.0013);
        for(let k=0;k<7;k++)box(black,[d*.057,.024,-.083-k*.015],[.002,.009,.0024],.0004,[-.19,0,0]);
        box(mount,[d*.049,-.085,-.120],[.009,.014,.032],.0018);
        for(let k=0;k<4;k++)box(steel,[d*.033,-.085-k*.017,-.122-k*.008],[.005,.005,.051],.001,[-.27,0,0]);
        box(infill,[d*.054,.007,-.182],[.004,.018,.043],.0013);
        for(let k=0;k<4;k++)box(k===3?bare:ink,[d*.057,.007,-.195+k*.007],[.002,.005,.0034],.00035);
        stamp('VS·17',d*.055,-.011,-.134,.083,.016,true);
      }
      box(steel,[0,.071,-.181],[.059,.018,.228],.002);
      for(let k=0;k<11;k++)box(black,[0,.081,-.073-k*.0195],[.064,.008,.009],.0007);
      boltTop(.086,-.086);boltTop(.086,-.181);
      emitter(0,s.emit[1],front,.036,ink);
      collar(phosphate,0,.024,-.642,.034,.020,.066,18);
      const [x,y,z]=s.sight;
      box(mount,[0,y-.034,z],[.057,.026,.112],.003);
      collar(black,x,y,z,.035,.027,.050,18);
      collar(steel,x,y,z+.023,.036,.029,.013,18);
      collar(phosphate,x,y,z-.028,.037,.031,.016,18);
      cyl(clear,0,y,z-.014,.026,.0027);
      add(eyelet,ink,s.sight,[.005,.005,.006]);
      for(const d of [-1,1])pin(d*.032,y+.005,z+.010,.0052,steel);
    }else{
      // Swept walnut furniture, twin tubes and a thick, jointed breech.
      // The larger grip contour meets the same hand joint as before.
      profile(walnut,[[.038,.024],[.119,.021],[.267,.005],[.304,-.009],[.310,-.146],
        [.274,-.153],[.161,-.118],[.063,-.100],[.077,-.157],[.044,-.179],[-.009,-.161],[-.027,-.078],[-.021,-.031]],.102,0,.010);
      profile(rubber,[[.293,-.006],[.319,-.017],[.325,-.143],[.311,-.151],[.285,-.143]],.109,0,.007);
      box(brass,[0,-.095,.302],[.105,.093,.004],.0009,[.12,0,0]);
      profile(steel,[[.053,.022],[.027,.066],[-.163,.061],[-.222,.043],[-.244,-.014],[-.209,-.058],[-.036,-.067],[.022,-.043]],.115,0,.0065);
      box(black,[0,.057,-.101],[.092,.020,.226],.003);
      box(mount,[0,.068,-.103],[.035,.005,.149],.001);
      profile(black,[[-.031,-.057],[-.091,-.055],[-.119,-.089],[-.101,-.125],[-.038,-.125],[-.019,-.104]],
        .066,0,.0042,[[[-.051,-.070],[-.085,-.068],[-.100,-.091],[-.086,-.110],[-.051,-.109],[-.036,-.093]]]);
      profile(walnut,[[-.247,-.024],[-.272,.006],[-.420,.010],[-.482,-.007],[-.497,-.038],[-.477,-.079],[-.282,-.082]],
        .142,0,.010);
      for(const d of [-1,1]){
        cyl(black,d*.037,.032,-.412,.031,.474);
        collar(steel,d*.037,.032,-.501,.032,.025,.158,22);
        collar(black,d*.037,.033,front+.048,.034,.021,.029,18);
        emitter(d*.037,.033,front,.034,ink);
        profile(amber,[[.010,-.003],[-.011,.040],[-.112,.049],[-.147,.027],[-.145,-.032],[-.082,-.051],[-.027,-.042]],.012,d*.058,.0027);
        profile(black,[[-.006,.002],[-.028,.031],[-.102,.036],[-.125,.022],[-.122,-.023],[-.085,-.040],[-.033,-.030]],
          .006,d*.065,.0017);
        pin(d*.070,.002,-.019,.0069,brass);pin(d*.070,.000,-.107,.0069,brass);
        box(brass,[d*.069,.018,-.058],[.003,.005,.041],.00065,[-.08,0,0]);
        collet(d);
        stamp('AM·08',d*.069,-.009,-.067,.065,.015,true);
        for(let k=0;k<9;k++){
          box(walnutShade,[d*(.073+(k===0||k===8?-.004:0)),-.039,-.277-k*.023],
            [.006,.060,.0067],.0016,[-.16,0,d*.13]);
        }
      }
      function collet(d){
        for(const z of [-.246,-.475]){
          box(black,[d*.065,-.014,z],[.013,.052,.014],.002);
          pin(d*.073,-.010,z,.004,steel);
        }
      }
      box(black,[0,.062,-.464],[.030,.015,.310],.0014);
      for(let j=0;j<7;j++)box(steel,[0,.070,-.331-j*.037],[.030,.003,.014],.0006);
      box(brass,[0,s.sight[1]-.010,s.sight[2]],[.024,.019,.028],.002);
      add(eyelet,ink,s.sight,[.0095,.0095,.0105]);
    }
    return A.build();
  });
  for(const g of boxCache.values())g.dispose();
  screw.dispose();eyelet.dispose();
  return devices;
}
