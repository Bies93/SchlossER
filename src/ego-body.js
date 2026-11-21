import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomSource,sharedSet} from './surface-detail.js';

const tau=Math.PI*2,pi=Math.PI;
const legsProfile=[
  [0,.100,.102],[.082,.104,.109],[.162,.104,.106],[.265,.097,.098],[.354,.088,.090],
  [.437,.081,.083],[.496,.074,.081],[.545,.071,.080],[.598,.071,.078],[.657,.073,.078],
  [.724,.070,.070],[.803,.063,.063],[.886,.053,.055],[.948,.050,.054],[1,.051,.054]
];
function trouserMap(T){
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const g=c.getContext('2d'),rng=randomSource(38122);
  g.fillStyle='#68705c';g.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=3){
    g.fillStyle=y%2?'#d1ccad20':'#202a1f14';g.fillRect(0,y,512,.8);
  }
  for(let i=0;i<15500;i++){
    g.fillStyle=i%6?'#272d2310':'#e7dfc333';g.fillRect(rng()*512,rng()*512,.7+rng()*3,.8+rng());
  }
  const seam=(x,y,h)=>{
    g.fillStyle='#353b30';g.fillRect(x-2,y,4,h);
    for(let j=2;j<h-1;j+=6){
      g.fillStyle='#a39a7b';g.fillRect(x-4,y+j,1,2.8);g.fillRect(x+3,y+j,1,2.8);
    }
  };
  for(const x of [128,383])seam(x,0,512);
  // The front faces straddle the texture seam at the shin. Duplicate the
  // reinforcing knee dart so both sides meet when the leg bends.
  for(const x of [-40,472]){
    g.fillStyle='#4f584a';g.beginPath();g.roundRect(x,227,81,102,12);g.fill();
    g.strokeStyle='#9b9275';g.lineWidth=1.5;g.setLineDash([3,3]);
    g.beginPath();g.roundRect(x+5,233,71,90,9);g.stroke();g.setLineDash([]);
  }
  for(const x of [160,352]){
    g.fillStyle='#525c50';g.beginPath();g.roundRect(x-25,67,50,71,4);g.fill();
    g.fillStyle='#79816c';g.fillRect(x-27,66,54,15);
    seam(x-21,84,49);seam(x+21,84,49);
  }
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

export function makeEgoBody(T,parent){
  const body=new T.Group();body.name='Ego-Körper · Jacke, Hose und Stiefel';parent.add(body);
  const fabric=sharedSet(T,'canvas',128),hide=sharedSet(T,'plaster',256);
  const mat=(color,roughness,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const pants=mat(0xffffff,.94,{map:trouserMap(T)}),
    coat=mat(0x60685c,.91,{...fabric,normalScale:new T.Vector2(.34,.34)}),
    pad=mat(0x474a41,.91,fabric),belt=mat(0x4a4037,.79,{...hide,normalScale:new T.Vector2(.18,.18)}),
    leather=mat(0x56514a,.71,{...hide,normalScale:new T.Vector2(.24,.24)}),
    toe=mat(0x3f423b,.79,{...hide,normalScale:new T.Vector2(.20,.20)}),
    sole=mat(0x2b2e2d,.91),seam=mat(0x9e927b,.94),metal=mat(0x92958a,.49,{metalness:.32});
  const bevel=new RoundedBoxGeometry(1,1,1,2,.138),cyl=new T.CylinderGeometry(1,1,1,8);
  const p=new T.Vector3(),q=new T.Quaternion(),S=new T.Vector3(),Y=new T.Vector3(0,1,0),M=new T.Matrix4();
  function shape(root,geometry,material,x,y,z,w,h,d){
    const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(w,h,d);root.add(o);return o;
  }
  function assembly(root){
    const out=new Map();
    const add=(geometry,material,x,y,z,w,h,d,Q)=>{
      const v=geometry.index?geometry.toNonIndexed():geometry.clone();v.clearGroups();
      v.applyMatrix4(M.compose(p.set(x,y,z),Q??q.identity(),S.set(w,h,d)));
      if(!out.has(material))out.set(material,[]);out.get(material).push(v);
    };
    function stitch(material,a,b,r){
      const l=new T.Vector3(...a),d=new T.Vector3(...b).sub(l),n=d.length();
      l.addScaledVector(d,.5);add(cyl,material,...l,r,n,r,q.setFromUnitVectors(Y,d.normalize()));
    }
    return {add,stitch,finish(){
      for(const [m,list] of out){const g=mergeGeometries(list);root.add(new T.Mesh(g,m));for(const v of list)v.dispose();}
    }};
  }
  // Shaped jacket hem and chest. The upper rings recede behind the camera
  // so the front of the belt, knees and both toes are still in the frame.
  const jacket=[
    [.878,.167,.099,.123],[.911,.196,.101,.113],[.964,.189,.108,.104],[1.02,.179,.103,.108],
    [1.10,.175,.096,.139],[1.184,.183,.089,.161],[1.265,.169,.081,.197],[1.335,.142,.072,.223]
  ],jp=[],jt=[],ji=[],section=24;
  for(const [row,[y,w,d,z]] of jacket.entries())for(let i=0;i<=section;i++){
    const a=i*tau/section;
    jp.push(w*Math.sin(a),y+.007*Math.sin(a*3),z+d*Math.cos(a));jt.push(i/section,row/(jacket.length-1));
    if(i&&row){const b=row*(section+1)+i,t=b-section-1;ji.push(t-1,t,b,t-1,b,b-1);}
  }
  const jg=new T.BufferGeometry();jg.setAttribute('position',new T.Float32BufferAttribute(jp,3));
  jg.setAttribute('uv',new T.Float32BufferAttribute(jt,2));jg.setIndex(ji);jg.computeVertexNormals();
  shape(body,jg,coat,0,0,0,1,1,1);
  const waist=assembly(body);
  waist.add(bevel,belt,0,.977,.079,.388,.043,.218);
  waist.add(bevel,metal,.018,.982,-.037,.068,.041,.016);
  waist.add(bevel,pad,.018,.982,-.048,.043,.020,.008);
  for(const side of [-1,1]){
    waist.add(bevel,belt,side*.137,.977,-.031,.015,.056,.016);
    waist.add(bevel,pad,side*.171,.912,-.012,.085,.112,.061);
    waist.add(bevel,coat,side*.171,.943,-.045,.093,.033,.013);
    waist.add(bevel,metal,side*.170,.935,-.052,.015,.016,.008);
  }
  const zip=[[0,1.022,-.001],[0,1.085,.028],[0,1.139,.057],[0,1.182,.066],[0,1.258,.108]];
  for(let i=1;i<zip.length;i++)waist.stitch(pad,zip[i-1],zip[i],.0045);
  waist.add(bevel,metal,0,1.14,.054,.011,.027,.009);
  waist.finish();
  function boot(side){
    const root=new T.Group();root.name='Schnürstiefel';body.add(root);
    const a=assembly(root);
    const shell=(rows,material)=>{
      const points=[],uv=[],index=[],n=24;
      for(let j=0;j<rows.length;j++){
        const [y,w,d,z]=rows[j];
        for(let i=0;i<=n;i++){
          const phi=i*tau/n,x=Math.sin(phi),f=Math.cos(phi);
          points.push(w*Math.sign(x)*Math.abs(x)**.81,y,z+d*Math.sign(f)*Math.abs(f)**.82);
          uv.push(i/n,j/(rows.length-1));
          if(j&&i){
            const t=j*(n+1)+i,u=t-n-1;
            index.push(u-1,u,t,u-1,t,t-1);
          }
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
      a.add(g,material,0,0,0,1,1,1);g.dispose();
    };
    shell([[.003,.064,.135,-.064],[.013,.071,.143,-.066],[.037,.073,.146,-.070],[.049,.066,.137,-.073]],sole);
    shell([[.044,.064,.135,-.072],[.063,.067,.133,-.074],[.086,.065,.117,-.062],[.106,.060,.095,-.041],
      [.128,.056,.066,-.003],[.159,.055,.063,.008],[.191,.054,.058,.013],[.213,.053,.053,.011],[.217,.019,.023,.010]],leather);
    a.add(bevel,toe,0,.067,-.165,.135,.057,.099,q.setFromAxisAngle(Y,side*.055));
    for(let j=0;j<6;j++)for(const s of [-1,1])a.add(bevel,sole,s*.049,.009,.038-j*.043,.042,.017,.030);
    for(let j=0;j<6;j++){
      const z=-.041-j*.022,y=.170-j*.014,w=.040-j*.0007;
      for(const s of [-1,1]){
        a.add(cyl,metal,s*w,y-.005,z,.007,.007,.007);
        if(j<5)a.stitch(seam,[s*w,y,z],[-s*(w-.002),y-.013,z-.021],.00265);
      }
    }
    const tie=(s)=>[[-s*.013,.172,-.046],[s*.037,.186,-.023],[s*.061,.174,-.042],[s*.022,.171,-.051]];
    for(const s of [-1,1]){const t=tie(s);for(let j=1;j<t.length;j++)a.stitch(seam,t[j-1],t[j],.0028);}
    for(const s of [-1,1])a.stitch(seam,[s*.059,.044,-.168],[s*.062,.047,-.089],.0022);
    a.finish();return root;
  }
  const n=20;
  const legs=[-1,1].map(side=>{
    const geo=new T.BufferGeometry(),uv=[],idx=[],positions=new Float32Array(legsProfile.length*(n+1)*3);
    for(let r=0;r<legsProfile.length;r++)for(let i=0;i<=n;i++){
      uv.push(i/n,1-legsProfile[r][0]);
      if(r&&i){const t=r*(n+1)+i,b=t-n-1;idx.push(b-1,b,t,b-1,t,t-1);}
    }
    geo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);
    const o=new T.Mesh(geo,pants);o.frustumCulled=false;body.add(o);
    return {side,geo,positions,boot:boot(side)};
  });
  let layer=0,lastStep=NaN,lastMoving=0,lastRunning=0,lastStrafe=0,lastLand=0,lastGrounded=true,lastCrouch=0;
  function update({step,moving,running,strafe,grounded,landing,pitch,crouch=0}){
    const before=body.visible;body.visible=pitch<-.52;
    if(!body.visible)return before;
    if(before&&Math.abs(step-lastStep)<.0003&&Math.abs(moving-lastMoving)<.0005&&Math.abs(running-lastRunning)<.001&&
      Math.abs(strafe-lastStrafe)<.001&&Math.abs(landing-lastLand)<.0005&&grounded===lastGrounded&&Math.abs(crouch-lastCrouch)<.0005)return false;
    lastStep=step;lastMoving=moving;lastRunning=running;lastStrafe=strafe;lastLand=landing;lastGrounded=grounded;lastCrouch=crouch;
    for(const l of legs){
      const a=step+(l.side<0?0:pi),stride=Math.cos(a)*moving,heel=Math.max(0,Math.sin(a))*moving,
        climb=heel*(.102+running*.046),air=grounded?0:1,x=l.side*.114,
        hip=[x,.947-landing*.029-crouch*.45,.089+crouch*.12],
        knee=[x+strafe*.024,.509+climb*.52+air*.053-crouch*.232,-.167-stride*.105-air*.09-crouch*.17],
        ankle=[x+strafe*.051,.134+climb+air*.035,-.159-stride*(.197+running*.077)+air*.025+crouch*.08];
      for(let i=0;i<legsProfile.length;i++){
        const [t,r,d]=legsProfile[i],mid=.52,lo=t<=mid?hip:knee,hi=t<=mid?knee:ankle,f=t<=mid?t/mid:(t-mid)/(1-mid);
        const cx=lo[0]+(hi[0]-lo[0])*f,cy=lo[1]+(hi[1]-lo[1])*f,cz=lo[2]+(hi[2]-lo[2])*f;
        for(let j=0;j<=n;j++){
          const ph=j*tau/n,dx=Math.sin(ph),dz=-Math.cos(ph);
          const fold=(.0036*Math.sin(t*91+Math.cos(ph)*2)+.0024*Math.sin(t*47-ph*3))*
            (.35+.65*Math.exp(-((t-.53)**2)/.019));
          const pos=(i*(n+1)+j)*3;
          l.positions[pos]=cx+dx*(r+fold);l.positions[pos+1]=cy-.22*dz*(hi[2]-lo[2]);l.positions[pos+2]=cz+dz*(d+fold);
        }
      }
      l.geo.attributes.position.needsUpdate=true;l.geo.computeVertexNormals();
      l.boot.position.set(ankle[0],ankle[1]-.132,ankle[2]);
      l.boot.rotation.set(-heel*.153+stride*.086,l.side*-.077+strafe*.085,0);
    }
    return !before||moving>.002||!grounded||landing>.003;
  }
  return {update,layer(n){if(n!==layer){layer=n;body.traverse(o=>o.layers.set(n));}}};
}
