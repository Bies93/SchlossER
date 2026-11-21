import {architectureKit} from './architecture-kit.js';
import {randomSource} from './surface-detail.js';

const pi=Math.PI,at=(x,y,z)=>[x,y,z];

// Shared sculpted geometry: both birds get independent hinges and poses.
export function ravenModel(T){
  const tex=document.createElement('canvas');tex.width=128;tex.height=256;
  const c=tex.getContext('2d'),rnd=randomSource(19721),shade=c.createLinearGradient(0,0,128,0);
  shade.addColorStop(0,'#62656f');shade.addColorStop(.42,'#a8acb8');shade.addColorStop(.58,'#909aab');shade.addColorStop(1,'#545963');
  c.fillStyle=shade;c.fillRect(0,0,128,256);
  for(let y=-13;y<265;y+=3.5){
    c.lineWidth=.55+rnd()*.57;c.strokeStyle=y%2?'#29313d5a':'#e3e3ed3a';
    c.beginPath();c.moveTo(1,y-11);c.quadraticCurveTo(32,y-8,65,y+4);c.quadraticCurveTo(95,y-8,127,y-9);c.stroke();
  }
  c.fillStyle='#9ba1a76e';c.fillRect(63,5,1.4,241);
  const map=new T.CanvasTexture(tex);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const mat=(color,roughness,params={})=>new T.MeshStandardMaterial({color,roughness,...params});
  const pens={mid:mat(0x343943,.66,{map,side:T.DoubleSide}),dark:mat(0x20232a,.74,{map,side:T.DoubleSide}),
    light:mat(0x434654,.60,{map,side:T.DoubleSide})};
  const materials={...pens,
    body:mat(0x23252d,.66),neck:mat(0x292b36,.65),bill:mat(0x27282d,.52),gape:mat(0x15131a,.80),
    foot:mat(0x35323a,.85),talon:mat(0x202126,.56),socket:mat(0x201e25,.80),
    iris:mat(0x50352b,.40),pupil:mat(0x0f0e13,.27),catch:mat(0x999296,.40)};
  const s=new T.SphereGeometry(1,18,12),rod=new T.CylinderGeometry(1,1,1,8),M=new T.Matrix4(),P=new T.Vector3(),
    Q=new T.Quaternion(),S=new T.Vector3(),e=new T.Euler(),axis=new T.Vector3(0,1,0),d=new T.Vector3();
  function shape(k,key,x,y,z,w,h,l,rx=0,ry=0,rz=0){
    k.geometry(key,s,M.compose(P.set(x,y,z),Q.setFromEuler(e.set(rx,ry,rz)),S.set(w,h,l)));
  }
  function shaft(k,key,a,b,r){
    P.fromArray(a);d.fromArray(b).sub(P);const l=d.length();
    if(l>.001)k.geometry(key,rod,M.compose(P.addScaledVector(d,.5),Q.setFromUnitVectors(axis,d.normalize()),S.set(r,l,r)));
  }
  function plume(k,key,A,B,width,camber,vertical=false){
    const dx=B[0]-A[0],dz=B[2]-A[2],l=Math.hypot(dx,dz)||1;
    const ux=vertical?0:dz/l,uz=vertical?dz/l:-dx/l,uy=vertical?-1:0;
    const points=[];
    for(let i=0;i<=7;i++){
      const t=i/7,span=width*(.18+.82*Math.sin(Math.pow(t,.63)*pi)**.66)*(1-.97*t**5);
      const x=A[0]+dx*t,y=A[1]+(B[1]-A[1])*t+Math.sin(t*pi)*camber,z=A[2]+dz*t;
      points.push([x-ux*span*.91,y-uy*span*.91,z-uz*span*.91],
        [x,y+(vertical?0:.004*Math.sin(t*pi)),z+(vertical?.005*Math.sin(t*pi):0)],
        [x+ux*span,y+uy*span,z+uz*span]);
      if(i===0)continue;
      const n=(i-1)*3,v=(i-1)/7,V=i/7;
      for(let j=0;j<2;j++){
        const u=j*.5,U=(j+1)*.5;
        k.triangle(key,points[n+j],points[n+j+1],points[n+j+4],[u,v,U,v,U,V]);
        k.triangle(key,points[n+j],points[n+j+4],points[n+j+3],[u,v,U,V,u,V]);
      }
    }
  }
  const root=new T.Group(),body=new T.Group(),head=new T.Group(),jaw=new T.Group(),tail=new T.Group();
  root.add(body);root.userData.noSceneQuery=true;body.add(head,tail);
  head.position.set(0,.337,.111);head.add(jaw);jaw.position.set(0,.003,.042);
  tail.position.set(0,.208,-.133);
  const shell=architectureKit(T,body,materials);
  shape(shell,'body',0,.244,-.038,.105,.112,.203,.24);
  shape(shell,'neck',0,.303,.079,.072,.105,.107,-.43);
  shape(shell,'body',0,.226,.064,.081,.093,.089,.18);
  for(let j=-4;j<=4;j++){
    const x=j*.021;
    const A=[x*.39,.319,.104-Math.abs(j)*.003],B=[x*.85,.216+Math.abs(j)*.006,.127-Math.abs(j)*.009];
    plume(shell,j%3===0?'light':'mid',A,B,.018,.007,true);
  }
  shell.flush('Brust und zottige Kehlfedern');
  const face=architectureKit(T,head,materials),lower=architectureKit(T,jaw,materials);
  shape(face,'neck',0,.033,.009,.071,.080,.084,-.12);
  shape(face,'dark',0,.066,.018,.067,.046,.071,.11);
  // Six cross-sections for the culmen, including the downturned tip.
  function beak(k,sections){
    for(let i=1;i<sections.length;i++){
      const [z,a,b,r]=sections[i-1],[Z,A,B,R]=sections[i];
      for(let j=0;j<10;j++){
        const t=j*pi/5,u=(j+1)*pi/5;
        const v=(ang,p,q,s,o)=>[o*Math.cos(ang),(p+q)*.5+(p-q)*.5*Math.sin(ang),s];
        k.quad('bill',v(t,a,b,z,r),v(u,a,b,z,r),v(u,A,B,Z,R),v(t,A,B,Z,R),.17);
      }
    }
  }
  beak(face,[[.048,.046,.004,.045],[.072,.045,.005,.042],[.102,.037,.004,.033],[.131,.026,.003,.023],[.155,.017,.000,.011],[.169,.001,-.006,.002]]);
  beak(lower,[[0,.004,-.028,.039],[.031,.005,-.024,.034],[.066,.003,-.017,.024],[.091,.002,-.012,.013],[.116,-.001,-.006,.002]]);
  for(const side of [-1,1]){
    const x=.064*side;
    shape(face,'socket',x,.051,.033,.013,.020,.021);
    shape(face,'iris',x+side*.009,.054,.034,.009,.012,.013);
    shape(face,'pupil',x+side*.016,.054,.036,.003,.008,.008);
    shape(face,'catch',x+side*.019,.058,.038,.0013,.0028,.0031);
    shape(face,'gape',side*.032,.027,.095,.005,.003,.010,0,side*.29,0);
    shaft(face,'gape',[side*.039,.006,.048],[side*.028,.006,.107],.0028);
  }
  face.flush('Kopf · Augen, Schnabel und Nasenlöcher');lower.flush('Beweglicher Unterschnabel');
  const tk=architectureKit(T,tail,materials);
  for(let j=-4;j<=4;j++){
    const x=j*.016;
    plume(tk,j%3===0?'mid':'dark',[x*.42,.006,0],[x*1.6,-.045,-.315+Math.abs(j)*.018],.024,.007);
  }
  tk.flush('Gestufte Steuerfedern');
  for(const side of [-1,1]){
    const fold=new T.Group();fold.name='Gefalteter Flügel';body.add(fold);
    const k=architectureKit(T,fold,materials);
    shape(k,'body',.082*side,.254,-.057,.054,.076,.164,.28,-side*.06);
    for(let j=0;j<8;j++){
      const x=(.062+j*.0103)*side,yy=.336-j*.0105;
      plume(k,j%3===1?'mid':'dark',[x,yy,.034-j*.007],[x*.73,yy-.076,-.295+j*.008],.029,.012);
    }
    for(let j=0;j<6;j++){
      const x=(.062+(j%3)*.033)*side,yy=.329-(j%3)*.022,zz=.038-Math.floor(j/3)*.077;
      plume(k,j%3===0?'light':'mid',[x,yy,zz],[x+side*.012,yy-.021,zz-.107],.023,.010);
    }
    k.flush('Deckfedern und gefaltete Handschwingen');

    const wing=new T.Group(),wrist=new T.Group();wing.name='Flügelschulter';wrist.name='Flügelhand';
    wing.position.set(side*.075,.280,.018);wrist.position.set(side*.283,0,-.040);
    body.add(wing);wing.add(wrist);wing.visible=false;
    const arm=architectureKit(T,wing,materials),hand=architectureKit(T,wrist,materials);
    shape(arm,'body',side*.124,.002,-.039,.169,.040,.097,0,side*.11);
    shape(hand,'dark',side*.105,-.001,-.025,.152,.024,.061,0,side*.21);
    for(let j=0;j<9;j++){
      const v=j/8,x=(.024+.244*v)*side;
      plume(arm,j%3===0?'mid':'dark',[x,.022,-.024+v*.036],[x+side*.043,-.009,-.192+v*.014],.028,.011);
      plume(arm,j%3===1?'light':'mid',[x,.034,.021],[x+side*.025,.021,-.086+v*.013],.023,.006);
    }
    for(let j=0;j<9;j++){
      const v=j/8;
      plume(hand,j%3===1?'mid':'dark',[(.016+v*.11)*side,.012,-v*.029],[side*(.367-.19*v*v),-.052-v*.007,.006-.202*v],.026,.014);
      if(j<6)plume(hand,'mid',[(.020+j*.032)*side,.020,.004-j*.002],[(.149+j*.027)*side,.014,-.068-j*.013],.019,.006);
    }
    arm.flush('Flügelarm · Armschwingen');hand.flush('Flügelspitze · getrennte Handschwingen');
    const foot=new T.Group();foot.name='Fänge';foot.position.set(side*.049,.185,-.024);body.add(foot);
    const fk=architectureKit(T,foot,materials);
    shape(fk,'body',0,-.001,0,.029,.051,.036);
    shaft(fk,'foot',[0,-.020,-.014],[0,-.093,-.029],.013);
    shaft(fk,'foot',[0,-.093,-.029],[0,-.168,.005],.010);
    for(const j of [-1,0,1,2]){
      const dx=j===2?.012:j*.022,z=j===2?-.052:.053+(.009-Math.abs(j)*.006);
      const base=[0,-.165,.005],mid=[dx*.62,-.177,z*.61],tip=[dx,-.178,z];
      shaft(fk,'foot',base,mid,.0058);shaft(fk,'foot',mid,tip,.0043);
      shaft(fk,'talon',tip,[dx*1.14,-.183,z*1.25],.0035);
    }
    fk.flush('Fänge und Krallen');
  }
  s.dispose();rod.dispose();
  return root;
}
