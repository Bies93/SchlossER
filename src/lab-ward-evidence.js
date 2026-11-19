import {LAB} from './lab-layout.js';
import {randomSource} from './surface-detail.js';

const TAU=2*Math.PI,marks=['cloth','pool','spray','wipe'];

// Fictional, stationary set dressing. One little atlas and one batched mesh
// for all floor, fabric, wall and seat marks in this room.
export function wardEvidence(T,{root:room,k,dress}){
  const atlas=document.createElement('canvas');atlas.width=512;atlas.height=512;
  const c=atlas.getContext('2d'),random=randomSource(31229),xyz=[],uv=[];
  function blob(x,y,rx,ry,seed,ink,opacity){
    c.globalAlpha=opacity;c.fillStyle=ink;c.beginPath();
    for(let i=0;i<52;i++){
      const a=i/52*TAU,r=1+.13*Math.sin(a*3+seed)+.079*Math.cos(a*9+seed*2)+.058*Math.sin(a*19+seed);
      const X=x+Math.cos(a)*rx*r,Y=y+Math.sin(a)*ry*r;i?c.lineTo(X,Y):c.moveTo(X,Y);
    }
    c.closePath();c.fill();
  }
  for(const [i,kind] of marks.entries()){
    c.save();c.translate(i%2*256,Math.floor(i/2)*256);c.beginPath();c.rect(2,2,252,252);c.clip();
    if(kind==='pool'){
      blob(132,147,67,49,2.48,'#371414',.72);
      blob(134,147,59,40,2.62,'#562121',.43);
      blob(151,141,41,23,.90,'#612523',.31);
      blob(86,160,29,25,1.65,'#481919',.68);
    }else if(kind==='spray'){
      for(const [x,y,len] of [[91,111,41],[132,108,48],[153,123,26],[117,99,65]]){
        c.strokeStyle='#522020';c.globalAlpha=.44;c.lineWidth=2.3;c.beginPath();c.moveTo(x,y);
        c.quadraticCurveTo(x-.6,y+len*.37,x-2,y+len);c.stroke();
      }
      blob(125,113,35,29,.81,'#631e21',.49);
    }else{
      const wipe=kind==='wipe',x=wipe?127:137,y=wipe?115:131;
      blob(x,y,wipe?78:61,wipe?37:61,1.7,'#542021',wipe?.50:.58);
      blob(x+7,y+13,wipe?57:39,wipe?23:42,4.3,'#672628',.54);
      blob(x-32,y+22,29,18,2.8,'#441b1b',.48);
    }
    for(let j=0;j<(kind==='spray'?275:230);j++){
      const a=random()*TAU,d=random(),rx=kind==='cloth'?101:110,ry=kind==='pool'?79:98;
      const x=132+Math.cos(a)*d*rx+(random()-.5)*15,y=131+Math.sin(a)*d*ry;
      if(x<10||x>244||y<10||y>244)continue;
      c.fillStyle=j%3===0?'#7c3330':'#4f2021';c.globalAlpha=(.11+random()*.38)*(1-d*.56);
      c.beginPath();c.ellipse(x,y,.36+random()*(d<.59?3.6:2.6),.5+random()*2.75,random()*2,0,TAU);c.fill();
    }
    c.restore();
  }
  const color=new T.CanvasTexture(atlas);color.colorSpace=T.SRGBColorSpace;color.anisotropy=2;
  function surface(kind,at,nu=1,nv=1){
    const idx=marks.indexOf(kind);
    const u0=idx%2*.5+.012,v0=1-(Math.floor(idx/2)+1)*.5+.012,d=.476;
    const emit=(x,y)=>{xyz.push(...at(x,y));uv.push(u0+x*d,v0+y*d);};
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
      const a=i/nu,b=(i+1)/nu,l=j/nv,r=(j+1)/nv;
      emit(a,l);emit(b,l);emit(b,r);emit(a,l);emit(b,r);emit(a,r);
    }
  }
  function mark(kind,x,y,z,w,h,angle=0,pitch=0){
    const f=dress.plane(x,LAB.floor+y,z,angle,pitch);
    surface(kind,(u,v)=>f((u-.5)*w,(v-.5)*h,0));
  }
  function finish(){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
    const mat=new T.MeshStandardMaterial({map:color,roughness:.89,transparent:true,depthWrite:false,
      polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
    const mesh=new T.Mesh(g,mat);mesh.name='Behandlungsstation · alte Blutflecken';room.add(mesh);
  }
  function skull(x,y,z,angle){
    const geo=new T.SphereGeometry(1,16,10),m=new T.Matrix4(),s=new T.Vector3();
    const f=dress.plane(x,LAB.floor+y,z,angle);
    const part=(mat,u,v,d,a,b,c)=>{
      m.makeRotationY(angle).scale(s.set(a,b,c));m.setPosition(...f(u,v,d));k.geometry(mat,geo,m);
    };
    part('wardBone',0,.149,-.029,.097,.097,.100);
    part('wardBone',0,.178,.026,.087,.055,.056);
    part('wardBone',0,.084,.038,.072,.045,.055);
    for(const side of [-1,1]){
      part('wardBone',side*.065,.103,.038,.033,.019,.048);
      part('gasket',side*.038,.132,.079,.029,.028,.016);
      part('wardBone',side*.063,.064,.029,.023,.042,.053);
    }
    part('gasket',0,.087,.085,.015,.020,.010);
    part('wardBone',0,.141,.083,.011,.025,.016);
    part('wardBone',0,.033,.060,.062,.022,.041);
    for(let i=0;i<6;i++){
      const x=(i-2.5)*.014,z=.079+(.017-.003*Math.abs(i-2.5));
      k.box('wardBone',f,x-.005,x+.005,.047,.068,z-.015,z+.006);
    }
    geo.dispose();
  }
  return {surface,mark,finish,skull};
}
