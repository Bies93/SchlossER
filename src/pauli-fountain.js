import {sculptKit,allegory,bearer,head} from './pauli-sculpt.js';
import {pauliMaterials} from './pauli-materials.js';

// The playable market is compressed at its west end. Keep statue, street
// and fountain in order on the historical sightline, with walking room behind.
export const PAULI=Object.freeze({x:0,z:66.65,grade:-.046,stepR:[4.16,3.88,3.59],rim:3.16});
const tau=Math.PI*2;

export function addPauli(T,scene,world){
 const root=new T.LOD();root.name='Marktplatz · Paulibrunnen (1889)';
 root.position.set(PAULI.x,PAULI.grade,PAULI.z);scene.add(root);
 const time={value:0},wash={value:0},m=pauliMaterials(T,time,wash);
 for(const [far,dist] of [[false,0],[true,28]]){
   const level=new T.Group();level.name=far?'Platzsilhouette':'Bildhauerarbeit';level.visible=!far;
   dressPauli(T,level,m,far);root.addLevel(level,dist,.09);
 }
 world.circle(PAULI.x,PAULI.z,PAULI.rim);
 for(const s of [-1,1]){
   world.circle(PAULI.x+s*3.28,PAULI.z,.98);
   world.circle(PAULI.x+s*4.19,PAULI.z,.685);
 }
 const vp=new T.Matrix4(),frustum=new T.Frustum(),bounds=new T.Sphere(new T.Vector3(PAULI.x,3.2,PAULI.z),5.8);
 let last=-Infinity;
 return {root,setPreset(id){wash.value=id==='night'?1:.13;},step(x,z,y){if(y<-.50)return null;const r=Math.hypot(x-PAULI.x,z-PAULI.z);
   for(let j=2;j>=0;j--)if(r<=PAULI.stepR[j])return PAULI.grade+(j+1)*.156;return null;},
   tick(ms,c){
     if(ms-last<45)return false;
     c.updateWorldMatrix(true,false);const p=c.matrixWorld.elements;
     if(Math.hypot(p[12]-PAULI.x,p[14]-PAULI.z)>62||p[13]<-.3||
       !frustum.setFromProjectionMatrix(vp.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse)).intersectsSphere(bounds))return false;
     last=ms;time.value=(ms*.001)%2048;return true;
   }};
}
function dressPauli(T,root,m,far){
 const k=sculptKit(T,far),{lathe,loft,curve,place,oval,box}=k;
 const turned=(mat,profile)=>lathe(mat,0,0,0,profile,104);
 for(const s of [-1,1]){
   lathe('worn',s*3.55,.002,-s*2.96,[[.001,0],[.092,0],[.094,.009],[.082,.016],[.001,.016]],20);
   lathe('dark',s*3.55,.017,-s*2.96,[[.075,0],[.070,.002],[.001,.002]],20);
 }
 // Each rounded nosing belongs to a separate stone course. Joints pass
 // through the tread and riser, staggered rather than painted as black rings.
 for(const [i,r] of PAULI.stepR.entries()){
   const h=i*.156;
   turned('granite',[[.01,h-.016],[r-.048,h-.016],[r-.039,h+.103],[r-.014,h+.113],[r,h+.13],[r-.007,h+.146],[r-.03,h+.156],[.01,h+.156]]);
   for(let j=0;j<26;j++){
     const a=(j+i*.36)*tau/26,s=Math.sin(a),c=Math.cos(a);
     curve('joint',[[(r-.29)*s,h+.158,(r-.29)*c],[(r-.03)*s,h+.158,(r-.03)*c],[r*s,h+.132,r*c],[(r-.037)*s,h+.044,(r-.037)*c]],.005,5,4);
   }
 }
 turned('granite',[[3.10,.448],[3.16,.476],[3.17,.523],[3.11,.55],[2.91,.561],[2.90,.653],[2.99,.686],
   [3.03,.745],[2.989,.788],[2.91,.811],[2.93,.870],[3.03,.911],[3.12,.998],[3.15,1.094],
   [3.135,1.167],[3.08,1.223],[3.03,1.247],[3.115,1.267],[3.154,1.295],[3.153,1.343],
   [3.115,1.369],[2.904,1.369],[2.867,1.336],[2.87,1.246],[2.74,.812],[2.59,.729],[.001,.728]]);
 for(let j=0;j<16;j++){
   const a=j*tau/16+.10;
   place(0,0,0,a,1,()=>curve('joint',[[0,1.369,2.906],[0,1.372,3.095],[0,1.343,3.153],[0,1.291,3.155],[0,1.262,3.115]],.006,6,4));
 }
 const pool=(x,y,z,r,stretch=1)=>lathe('water',x,y,z,[[r,-.008],[r,0],[.0001,0]],76,stretch);
 pool(0,1.19,0,2.848);
 const plinth=[[.03,0],[.872,0],[.894,.048],[.881,.127],[.82,.176],[.81,.387],[.848,.43],
   [.916,.507],[.947,.588],[.922,.657],[.868,.691],[.85,.735],[.927,.762],[.927,.800],[.876,.821],[.001,.821]];
 for(const side of [-1,1]){
   const x=side*3.28;
   lathe('granite',x,.00,0,[[.05,0],[.86,.002],[.89,.05],[.856,.11],[.829,.68],[.90,.72],[.05,.73]],56,1.13);
   lathe('granite',x,.548,0,plinth,60,1.14);
   const cx=side*4.19;
   lathe('granite',cx,.012,0,[[.02,0],[.36,0],[.427,.037],[.365,.095],[.354,.21],[.445,.232],[.578,.275],
     [.65,.35],[.685,.424],[.679,.459],[.604,.463],[.59,.43],[.507,.356],[.05,.298]],60);
   pool(cx,.413,0,.583);
   place(x-side*.04,1.367,0,side*(Math.PI/2-.24),1,()=>lathe('bronze',0,0,0,[[.012,0],[.554,0],[.56,.021],[.551,.054],[.005,.054]],52,1.57));
   place(x-side*.10,1.421,0,side*(Math.PI/2-.24),1.06,()=>allegory(k,side<0));
 }
 // Four engaged corners are modelled in plan, not a smooth cylindrical tower.
 const course=(mat,rows)=>loft(mat,rows.map(([y,r])=>[y,r,r]),{power:.40,n:64});
 course('granite',[[.72,1.02],[.84,1.10],[1.04,1.10],[1.07,1.15],[1.16,1.153],[1.19,1.097],[1.64,1.07],[1.68,1.02],[1.69,.92]]);
 course('carving',[[1.66,.92],[1.70,1.046],[1.76,1.057],[1.814,1.006],[1.866,.989],[1.89,.921],
   [1.98,.859],[2.27,.788],[2.57,.729],[2.96,.713],[3.20,.746],[3.36,.805],[3.45,.823],[3.50,.762]]);
 course('carving',[[3.43,.604],[3.52,.736],[3.58,.751],[3.635,.697],[3.69,.631],[3.76,.587],
   [4.12,.533],[4.53,.566],[4.73,.606],[4.79,.657],[4.86,.657],[4.89,.693],[4.955,.690],[4.99,.611],[5.0,.011]]);
 function curl(mat,x,y,z,r,sg=1){
   const pts=[];for(let j=0;j<=24;j++){const f=j/24,a=-1.30+f*5.65,rr=r*(1-.84*f);
     pts.push([x+sg*Math.cos(a)*rr,y+Math.sin(a)*rr,z+.027*Math.sin(f*Math.PI)]);}
   curve(mat,pts,r*.107,25,7);
 }
 // Lance-shaped acanthus blades with an incised midrib, integrated into the
 // mounts rather than flat plaques. End at a point, swell halfway up the leaf.
 function leaf(x,y,z,dx,dy,bulge,width,mat='carving'){
   const line=[[x,y,z],[x+.19*dx,y+.32*dy,z+bulge*.6],[x+.61*dx,y+.74*dy,z+bulge],[x+dx,y+dy,z+bulge*.47]];
   curve(mat,line,[.003,width*.87,width,.002],10,7);
 }
 const jet=(pts,rad)=>curve('jet',pts,rad,31,6);
 // Four corner consoles emerging as carriers. Separate scalloped shells,
 // foliage ridges and grotesque spouts silhouette against the sky.
 for(let i=0;i<4;i++)place(0,0,0,(i+.5)*Math.PI/2,1,()=>{
   curve('carving',[[0,1.78,1.11],[0,1.98,1.22],[0,2.33,1.11],[0,2.51,.998]],.126,15,11);
   for(const s of [-1,1]){
     curve('carving',[[s*.02,1.84,1.17],[s*.14,2.00,1.29],[s*.135,2.16,1.24],[s*.06,2.34,1.17]],.038,14,7);
     curl('carving',s*.176,2.03,1.15,.124,s);
     for(let j=0;j<5;j++)leaf(s*.036,1.85+j*.077,1.202,s*(.163-j*.018),.163,.055,.029);
   }
   place(0,1.91,.975,0,1,()=>bearer(k));
   place(0,3.394,1.035,0,1,()=>{
     loft('carving',[[0,.063,.066,0,.04],[.05,.157,.163,.028,.07],[.122,.335,.291,.081,.071],
       [.181,.465,.373,.099,.079],[.205,.513,.403,.099,.080],[.234,.522,.415,.10,.081],
       [.255,.496,.39,.095,.075],[.19,.406,.327,.084,.065],[.093,.15,.136,.045,.045],[.084,.008,.008,.025]],
       {n:72,lobes:11,warp(p,a,j){p[1]+=.013*Math.cos(11*a)*Math.min(1,j/4);}});
     for(let j=0;j<11;j++){const a=j*tau/11,S=Math.sin(a),C=Math.cos(a);
       curve('carving',[[S*.080,.034,C*.053],[S*.22,.098,.058+C*.195],[S*.385,.164,.09+C*.303],[S*.51,.225,.097+C*.399]],[.004,.015,.018,.004],11,6);}
   });
   for(const s of [-1,1]){curl('carving',s*.189,3.90,.712,.161,s);
     curve('carving',[[s*.11,3.75,.748],[s*.16,3.96,.761],[s*.122,4.23,.717],[s*.082,4.56,.701],[s*.16,4.71,.724]],.037,18,7);}
   oval('bronze',0,4.868,.757,.120,.160,.132,-.24);
   for(const s of [-1,1]){
     oval('bronze',s*.090,4.99,.739,.046,.092,.045,-.37,0,-s*.45);
     oval('worn',s*.058,4.900,.851,.029,.017,.026,0,0,s*.27);
   }
   oval('bronze',0,4.813,.865,.070,.051,.062);oval('dark',0,4.795,.916,.036,.022,.010);
   const path=Array.from({length:17},(_,j)=>{const t=j/16;return [0,4.793+.47*t-4.078*t*t,.925+1.63*t];});
   jet(path,.011);
 });
 // Portrait medallions in carved frames; the fourth side is the donor panel.
 for(let i=0;i<4;i++)place(0,0,0,i*Math.PI/2,1,()=>{
   oval('carving',0,2.651,.757,.373,.431,.092);
   oval('bronze',0,2.66,.825,.244,.318,.048);
   if(i!==0){
     k.relief(-.024,2.584,.866,1.09,1.10,.25,()=>{
       place(0,0,0,i===1?-1.29:1.32,1,()=>{head(k,'worn','bronze',i===1?1:0);
         oval('worn',0,-.011,-.004,.052,.075,.049);
         if(i===2)oval('worn',0,.027,.06,.057,.078,.039,-.26);
       });
     });
     oval('worn',-.002,2.512,.861,.129,.047,.021,0,0,.135);
   }
   for(let j=0;j<24;j++){const a=j*tau/24;
     oval('carving',Math.cos(a)*.267,2.656+Math.sin(a)*.343,.817,.017,.026,.023,0,0,a-Math.PI/2);}
   for(const s of [-1,1]){
     curve('carving',[[s*.04,3.26,.79],[s*.27,3.14,.83],[s*.394,2.89,.80],[s*.359,2.51,.815],[s*.269,2.31,.848]],.039,18,7);
     curl('carving',s*.352,2.35,.853,.12,s);
     for(let j=0;j<6;j++){
       const x=s*(.20+.080*j),y=1.986+.080*Math.cos(j*.87);
       leaf(x,y,.929,-s*.076,.055,.026,.024);
       if(j%2)for(const [u,v] of [[-.019,.019],[.016,.013],[.002,-.02]])oval('carving',x+u,y+v,.953,.022,.027,.021);
     }
     for(let j=0;j<4;j++)leaf(s*(.285+j*.02),2.51+j*.094,.807,s*.105,.13,.031,.024);
   }
   box('carving',0,2.132,.88,.654,.258,.083);box('bronze',0,2.13,.929,.55,.181,.018);
   for(const s of [-1,1])for(const h of [-1,1])oval('worn',s*.25,2.13+h*.066,.942,.011,.011,.004);
   // Heraldic shield and its rolled cartouche above the shells.
   oval('carving',0,4.206,.576,.240,.323,.089);
   curve('carving',[[-.201,4.41,.653],[-.164,4.15,.658],[0,3.99,.665],[.164,4.15,.658],[.201,4.41,.653],[0,4.43,.668],[-.201,4.41,.653]],.024,33,6);
   curve('carving',[[-.143,4.34,.658],[0,4.30,.678],[.146,4.34,.658]],.011,12);
   for(const s of [-1,1])for(let j=0;j<4;j++)leaf(s*.02,4.12+j*.044,.659,s*(.08+.014*j),.069,.025,.015);
   for(const s of [-1,1]){
     curve('carving',[[0,4.45,.636],[s*.091,4.465,.635],[s*.142,4.542,.620],[s*.094,4.52,.624],[s*.076,4.48,.636]],.017,12,6);
     for(let j=0;j<4;j++)leaf(s*(.284-.022*j),4.56-j*.142,.615,s*.07,-.13,.048,.025);
   }
   oval('carving',0,4.51,.631,.045,.065,.024);
   for(const s of [-1,1])curl('carving',s*.248,4.325,.628,.081,s);
 });
 const crown=(rows,n=72,lobes=14)=>loft('bronze',rows,{n,lobes});
 turned('bronze',[[.001,4.99],[.359,4.99],[.398,5.027],[.327,5.08],[.221,5.106],[.167,5.18],[.155,5.277],[.246,5.30],[.24,5.35]]);
 crown([[5.32,.17,.17,0,.07],[5.38,.331,.331,0,.08],[5.48,.441,.441,0,.07],[5.60,.622,.622,0,.07],
   [5.71,.831,.831,0,.049],[5.845,.930,.930,0,.045],[5.92,.950,.950,0,.044],[5.953,.912,.912,0,.044],
   [5.913,.818,.818,0,.035],[5.732,.473,.473],[5.70,.078,.078]]);
 for(let j=0;j<28;j++){const a=j*tau/28;place(0,0,0,a,1,()=>{
   curve(j%2?'bronze':'worn',[[0,5.40,.309],[.017,5.55,.52],[.024,5.706,.801],[.014,5.85,.935],[0,5.962,.925],[-.017,5.991,.907]],.023,13,6);
 });}
 turned('bronze',[[.04,5.699],[.191,5.776],[.188,5.981],[.154,6.015],[.115,6.105],[.142,6.147],[.151,6.202],
   [.117,6.25],[.071,6.28],[.059,6.42],[.112,6.475],[.199,6.51],[.238,6.55],[.238,6.589],[.194,6.603],
   [.086,6.625],[.038,6.65],[.025,6.75],[.009,6.86],[.001,6.899]]);
 for(let j=0;j<10;j++)place(0,0,0,j*tau/10,1,()=>oval('bronze',0,6.52,.168,.028,.075,.036,-.46));
 k.finish(root,m);
 if(!far)addLettering(T,root);
}

function addLettering(T,root){
 // Only documented names and date are used; not a claimed transcription.
 const c=document.createElement('canvas');c.width=768;c.height=512;
 const g=c.getContext('2d');g.textAlign='center';g.textBaseline='middle';
 function stamp(i,title,subtitle){
   const x=i%2*384,y=Math.floor(i/2)*160;
   g.fillStyle='#938c76';g.strokeStyle='#777c70';g.lineWidth=1.7;
   g.strokeRect(x+11,y+10,362,140);g.strokeRect(x+16,y+15,352,130);
   g.font='small-caps 32px Georgia';g.fillText(title,x+192,y+64,332);
   g.font='19px Georgia';g.fillText(subtitle,x+192,y+105,323);
 }
 stamp(0,'Salomon und Julie Pauli','1889');stamp(1,'Christian Ernst','Markgraf');
 stamp(2,'Luitpold','Prinzregent');stamp(3,'Alexander','Markgraf');
 g.fillStyle='#969182';g.font='italic 28px Georgia';
 for(const [j,t] of ['Zur Erinnerung','an','Salomon Pauli','1889'].entries())g.fillText(t,192,351+j*34,286);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 const pos=[],uv=[],ix=[],add=(x,y,z,u,v)=>{pos.push(x,y,z);uv.push(u,1-v);};
 for(let i=0;i<4;i++){
   const a=i*Math.PI/2,co=Math.cos(a),si=Math.sin(a),base=pos.length/3;
   for(const [u,v] of [[0,0],[0,1],[1,1],[1,0]]){
     const x=(u-.5)*.548,z=.941;
     add(co*x+si*z,2.13+(.5-v)*.178,co*z-si*x,(i%2+u)/2,(Math.floor(i/2)+v)*160/512);
   }ix.push(base,base+1,base+2,base,base+2,base+3);
 }
 // Conform the dedication to the oval rather than hanging a flat label off the medallion.
 const start=pos.length/3,n=12;
 for(let j=0;j<=6;j++)for(let i=0;i<=n;i++){
   const u=i/n,v=j/6,x=(u-.5)*.361,y=(.5-v)*.356;
   const z=.825+.048*Math.sqrt(Math.max(0,1-(x/.244)**2-(y/.318)**2))+.001;
   add(x,2.66+y,z,u*.5,(327+v*172)/512);
   if(i&&j){const l=start+j*(n+1)+i;ix.push(l-n-2,l-1,l,l-n-2,l,l-n-1);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:.64,metalness:.38,polygonOffset:true,polygonOffsetFactor:-1}));
 mesh.name='Paulibrunnen · Gussinschriften';mesh.receiveShadow=true;root.add(mesh);
}
