import {randomSource,sharedSet} from './surface-detail.js';

export function annexMaterials(T,{painted,plaster,cloth}){
  const mat=(color,roughness,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const soil=sharedSet(T,'soilCrumb',256);
  return {
    soil:mat(0x93826a,1,{...soil,normalScale:new T.Vector2(1.10,1.10)}),
    clay:mat(0xb47953,.89,plaster),cedar:mat(0xa16c48,.87,painted),
    rubber:mat(0x464743,.91,painted),ivoryPaint:mat(0xdcd1ac,.79,painted),safetyRed:mat(0xa05141,.87,painted),
    blueTin:mat(0x637e93,.69,{...painted,metalness:.23}),tote:mat(0x9c8b6e,.96,cloth),
    shell:mat(0xb29350,.49,{metalness:.34}),shellMouth:mat(0x494434,.91),
    stemLeaf:mat(0x537243,.86),leafDark:mat(0x426a42,.83,{side:T.DoubleSide}),
    leafMedium:mat(0x69884a,.87,{side:T.DoubleSide}),leafLight:mat(0x94a857,.81,{side:T.DoubleSide}),
    tomatoRed:mat(0xc44934,.37),tomatoGold:mat(0xd78441,.44),
    growLamp:{material:mat(0xf1f2cf,.55,{emissive:0xe2f0b5,emissiveIntensity:.85}),cast:false}
  };
}

const tiles=['rangeSign','growSign','fieldLog','rangeBoard','diamond','pretzel','impact','seedLabel'];
export function moosfunkAnnexArt(T){
  const c=document.createElement('canvas');c.width=c.height=1024;
  const x=c.getContext('2d'),random=randomSource(909166);
  const text=(value,u,v,size,ink,font='monospace')=>{
    x.fillStyle=ink;x.font='bold '+size+'px '+font;x.textAlign='center';x.fillText(value,u,v,460);
  };
  const rect=(u,v,w,h,fill)=>{x.fillStyle=fill;x.fillRect(u,v,w,h);};
  const disk=(u,v,rx,ry,ink)=>{
    x.beginPath();x.ellipse(u,v,rx,ry,0,0,Math.PI*2);x.fillStyle=ink;x.fill();
  };
  for(const [i,tile] of tiles.entries()){
    x.save();x.translate(i%2*512,Math.floor(i/2)*256);
    x.beginPath();x.rect(0,0,512,256);x.clip();
    if(tile==='impact'){
      // An alpha-cutout grouping of chipped rims and pits, shared by the
      // backstop and sacrificial wall panel, never stamped into walkways.
      for(let j=0;j<19;j++){
        const u=22+random()*466,v=19+random()*220,r=1.8+random()*6;
        x.fillStyle='#a49a85';x.beginPath();
        for(let s=0;s<11;s++){
          const a=s*2*Math.PI/11,k=r*(.61+random()*.74),aU=u+Math.cos(a)*k,aV=v+Math.sin(a)*k;
          if(s===0)x.moveTo(aU,aV);else x.lineTo(aU,aV);
        }
        x.closePath();x.fill();disk(u+.25,v-.1,r*.58,r*.61,'#27251e');disk(u+.25,v+.98,r*.35,r*.22,'#171714');
      }
      x.restore();continue;
    }
    if(tile==='rangeSign'||tile==='growSign'){
      const grow=tile==='growSign',bg=grow?'#375044':'#603f35',ink='#efdbad';
      rect(0,0,512,256,bg);rect(13,16,486,224,ink);rect(19,22,474,212,bg);
      text(grow?'KOLLEKTIVBEET':'ÜBUNGSSTAND',256,124,75,ink,'Georgia');
      text(grow?'MOOSFUNK / GARTENGRUPPE':'MOOSFUNK / KOMMUNEKELLER',256,197,33,'#dbc396');
    }else if(tile==='diamond'||tile==='pretzel'){
      const pretzel=tile==='pretzel';
      rect(0,0,512,256,pretzel?'#c8b492':'#354b5c');
      for(const [rx,ry,col]of [[200,106,'#e3d9b9'],[166,88,'#6f8fa1'],[129,66,'#ded3b1'],[84,44,'#344e5c']])disk(256,119,rx,ry,col);
      for(const u of [32,453])for(const v of [33,112,191]){
        x.save();x.translate(u,v);x.scale(1.4,1);x.rotate(Math.PI/4);rect(0,0,21,21,'#729bb1');x.restore();
      }
      if(pretzel){
        x.save();x.translate(256,119);x.scale(1.37,1);x.lineWidth=8;x.lineCap='round';x.strokeStyle='#e0af74';
        x.beginPath();x.moveTo(-37,17);x.bezierCurveTo(5,-2,8,-12,19,-19);x.bezierCurveTo(40,-32,52,6,36,11);
        x.bezierCurveTo(1,25,-14,24,-35,11);x.bezierCurveTo(-52,-2,-32,-31,-18,-21);x.bezierCurveTo(-9,-15,7,7,35,17);x.stroke();
        for(const [u,v] of [[-26,-16],[-16,-8],[22,-17],[27,22],[-31,13]])disk(u,v,1.5,1.2,'#eee7d5');
        x.restore();
      }else{
        rect(249,92,14,55,'#c1b08d');rect(218,116,76,8,'#c1b08d');
      }
      text(pretzel?'KÖNIGLICHE BREZN':'RAUTE · KUNSTBLECH',256,241,20,pretzel?'#50392b':'#efe1be');
      for(let j=0;j<15;j++){
        const u=48+random()*415,v=22+random()*199;
        disk(u,v,1+random()*3,1+random()*3,'#584b3d');
      }
    }else{
      const paper='#d0bc91',ink='#433d32';rect(0,0,512,256,paper);
      rect(14,14,484,228,ink);rect(18,18,476,220,paper);
      rect(22,24,468,49,tile==='fieldLog'?'#46604c':tile==='rangeBoard'?'#674737':'#645b42');
      const lines=tile==='fieldLog'?['ERNTEBUCH','TOMATEN → GEMEINSCHAFTSKÜCHE','SALAT → HEUTE ABHOLEN','KRÄUTER → NUR GETEILT']:
        tile==='rangeBoard'?['ZIELARCHIV','01 · DIE RAUTE','02 · KÖNIGLICHE BREZN','NUR BLECH, KEINE LEUTE.']:
        ['WANDERKISTE','GARTENGRUPPE MOOSFUNK','ERDE ABKLOPFEN','KISTE ZURÜCKBRINGEN'];
      text(lines[0],256,60,35,'#f1dfb3','Georgia');
      for(let n=1;n<lines.length;n++){
        rect(45,73+n*39,421,1,'#9c9173');text(lines[n],256,98+n*39,24,ink);
      }
    }
    for(let j=0;j<1350;j++)rect(random()*512,random()*256,1+random()*5,1+random()*2,j%3?'#30272122':'#fff0cc26');
    x.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const sheet=new T.MeshStandardMaterial({map,roughness:.89}),cutout=new T.MeshStandardMaterial({map,alphaTest:.46,roughness:1});
  return {mount(room,tile,pos,w,h,yaw,pitch,roll){
    const i=tiles.indexOf(tile),L=i%2*.5+.004,Tp=1-Math.floor(i/2)*.25-.004;
    const g=new T.PlaneGeometry(w,h),uv=g.getAttribute('uv');
    for(let j=0;j<uv.count;j++)uv.setXY(j,L+uv.getX(j)*.492,Tp-.242+uv.getY(j)*.242);
    const m=new T.Mesh(g,tile==='impact'?cutout:sheet);m.name='Moosfunk · '+tile;
    m.position.fromArray(pos);m.rotation.set(pitch,yaw,roll,'YXZ');room.add(m);
  }};
}
