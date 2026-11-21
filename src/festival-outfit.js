import {carpentry} from './berg-props.js';
import {weaponSwatch} from './weapon-finishes.js';

const labels={festZwanni:'ZWANNI',festAnni:'ANNI',festKalle:'KALLE',festRudi:'RUDI'};
function threadBadge(T,rig,mount,id){
  const shirtY=rig.restPoint('upperarm_l').y-.083;
  const x=.119,w=.104,h=.051;
  const sheet=document.createElement('canvas');sheet.width=224;sheet.height=108;
  const c=sheet.getContext('2d');
  c.fillStyle='#23314a';c.fillRect(0,0,224,108);
  c.lineWidth=4;c.strokeStyle='#d1c5a3';c.setLineDash([7,4]);c.strokeRect(9,9,206,90);c.setLineDash([]);
  c.fillStyle='#eeeae0';c.textAlign='center';c.font='bold 37px system-ui';c.fillText('UEDV',112,49);
  c.fillStyle='#a6c4e0';c.font='bold 24px monospace';c.fillText(labels[id],112,79);
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const g=new T.PlaneGeometry(w,h,2,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const X=x+p.getX(i),Y=shirtY+p.getY(i);
    p.setXYZ(i,X,Y,(rig.costumeDepth(X,Y)??.108)+.012);
  }
  g.computeVertexNormals();
  const badge=new T.Mesh(g,new T.MeshStandardMaterial({map,roughness:.94,
    emissiveMap:map,emissive:0xffffff,emissiveIntensity:.055}));
  badge.name='UEDV · Stoffabzeichen';mount.add(badge);
}

export function festivalOutfit(T,rig,id,m){
  const chest=rig.costumeMount('spine_03'),neck=rig.restPoint('neck_01'),p=rig.restPoint('spine_03');
  threadBadge(T,rig,chest,id);
  if(id==='festAnni'){
    const clothes=carpentry(T,chest,m);
    clothes.round('linen',0,p.y-.201,.136,.298,.263,.019,.009);
    clothes.round('paintBlue',0,p.y-.184,.149,.315,.023,.014,.005);
    clothes.round('plankAlt',0,p.y-.268,.151,.165,.083,.014,.004);
    clothes.flush('Anni · Schürze');
  }
  if(id!=='festZwanni')return;

  const knit=weaponSwatch(T,'twill');
  const cloth=new T.MeshStandardMaterial({...knit,color:0x24272b,roughness:.95,side:T.DoubleSide});
  cloth.normalScale.setScalar(.43);
  const edge=new T.MeshStandardMaterial({...knit,color:0x313337,roughness:.92});
  const g=new T.BufferGeometry(),vertices=[],coords=[],indices=[],lip=[];
  const N=24,M=10,y0=neck.y;
  // Hood down, with an open folded edge and soft pleats behind the collar.
  for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){
    const u=2*i/N-1,v=j/M,mid=1-u*u;
    const pleat=Math.cos(u*9.4+.83)*Math.sin(Math.PI*v);
    const X=u*(.145-.059*v)+.005*Math.sin(v*Math.PI)*mid;
    const Y=y0-.031-.031*mid-v*(.131+.058*mid)+.009*pleat;
    const Z=-.059-.079*mid-(.032+.023*mid)*Math.sin(Math.PI*v)+.013*v+.007*pleat;
    vertices.push(X,Y,Z);coords.push((u+1)*.76,v*.87);
    if(j===0)lip.push([X,Y,Z-.005]);
    if(j<M&&i<N){
      const a=j*(N+1)+i,b=a+N+1;indices.push(a,a+1,b,b,a+1,b+1);
    }
  }
  g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(coords,2));
  g.setIndex(indices);g.computeVertexNormals();
  const hood=new T.Mesh(g,cloth);hood.name='Zwanni · heruntergelegte Kapuze';chest.add(hood);
  // A small shaped crew-neck insert covers the shirt template's old placket.
  // Its lower edge sinks back into the existing, skinned jersey surface.
  const tee=new T.BufferGeometry(),tp=[],ti=[],td=[];
  for(let row=0;row<7;row++)for(let col=0;col<9;col++){
    const v=row/6,u=col/4-1,X=u*(.080+.006*v);
    const Y=1.277+v*(.160+.027*u*u);
    const actual=rig.costumeDepth(X,Y),side=rig.costumeDepth((u<0?-1:1)*.085,Y);
    const fitted=Math.max(actual??.074,(side??.091)+.017*(1-u*u));
    tp.push(X,Y,fitted-.004+Math.sin(v*Math.PI*.82)*.016);td.push(col/8,v);
    if(row<6&&col<8){const a=row*9+col;ti.push(a,a+1,a+9,a+9,a+1,a+10);}
  }
  tee.setAttribute('position',new T.Float32BufferAttribute(tp,3));
  tee.setAttribute('uv',new T.Float32BufferAttribute(td,2));tee.setIndex(ti);tee.computeVertexNormals();
  const teeInsert=new T.Mesh(tee,new T.MeshStandardMaterial({color:0xaaa9a3,roughness:.96,normalMap:knit.normalMap,
    normalScale:new T.Vector2(.10,.10)}));
  teeInsert.name='Zwanni · T-Shirt Rundhals';chest.add(teeInsert);
  const k=carpentry(T,chest,{...m,hoodEdge:edge});
  k.tube('hoodEdge',lip,.010,32,8);
  for(const s of [-1,1]){
    const X=s*.121,Y=y0-.126,z=rig.costumeDepth(X,Y)??.105;
    k.tube('hoodEdge',[[s*.144,y0-.028,-.056],[s*.139,y0-.084,.025],
      [X,Y,z+.017],[X-s*.012,Y-.061,z+.023]],.0054,14,7);
    k.round('brushed',X-s*.012,Y-.063,z+.023,.008,.022,.007,.003);
  }
  k.flush('Zwanni · Kapuzensaum und Kordeln');
  const waist=rig.costumeMount('spine_02'),zip=carpentry(T,waist,m),y=1.075,X=-.068;
  const z=(rig.costumeDepth(X,y)??.118)+.013;
  zip.round('brushed',X,y,z,.014,.023,.010,.003);
  zip.tube('bright',[[X-.005,y-.008,z+.006],[X-.006,y-.021,z+.010],[X+.003,y-.026,z+.009],
    [X+.006,y-.014,z+.007]],.0025,10,6);
  zip.flush('Zwanni · offener Reißverschluss');
}
