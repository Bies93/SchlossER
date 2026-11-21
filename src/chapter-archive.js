import {architectureKit} from './architecture-kit.js';

// The hands work against the inscription and ink pad, not against arbitrary
// animated offsets. All heights here are relative to the archive floor.
export const ARCHIVE_DESK={x:25.17,z:-42.21,surface:.937};
export const ARCHIVE_CLERK={x:24.95,z:-41.587,yaw:Math.PI};
export const ARCHIVE_WORK={pageX:24.974,pageZ:-42.047,paper:.959,
  stampX:25.087,stampZ:-42.043,inkX:25.286,inkZ:-42.025,inkY:.955,
  handX:24.813,handZ:-42.002,knob:.076};

export function archivePrint(T){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;
  const c=canvas.getContext('2d'),w=ARCHIVE_WORK;
  c.fillStyle='#ceb78d';c.fillRect(0,0,768,512);
  const tint=c.createLinearGradient(0,0,768,18);
  for(const [x,color] of [[0,'#b79e75'],[.055,'#e1cea4'],[.46,'#e2cda1'],[.499,'#a38a66'],
    [.522,'#e2cba0'],[.955,'#e2cca1'],[1,'#b59c75']])tint.addColorStop(x,color);
  c.fillStyle=tint;c.fillRect(0,0,768,512);
  c.fillStyle='#76604424';
  for(let j=0;j<1700;j++)c.fillRect((j*719.29+j*j*.12)%768,(j*241.83+j*j*.1)%512,.8+(j%4)*.4,1);
  c.textAlign='center';c.fillStyle='#453127';c.font='bold 29px Georgia';
  c.fillText('SITZUNGSBUCH',182,79);c.fillText('ABENDPROTOKOLL',577,79);
  c.font='17px monospace';c.fillText('BUND DER EISERNEN KRONE',182,113);c.fillText('NACHTRAG / 03',577,113);
  c.textAlign='left';
  for(const x of [35,419]){
    c.strokeStyle='#8e6053';c.strokeRect(x,139,314,307);
    c.font='15px monospace';c.fillText('NR.     BESCHLUSS       SIEGEL',x+10,162);
    for(let j=0;j<8;j++){
      c.fillStyle='#8a6c4a40';c.fillRect(x,174+j*34,314,1.7);
      if(j>3&&x>100)continue;
      c.fillStyle='#54412f';c.font='italic 18px Georgia';
      c.fillText(x<100?['Zutritt geprüft','Fechtboden gesperrt','Plenum vertagt','Schlüssel fehlt'][j%4]:
        ['Abschrift nachgereicht','Einspruch nicht gezählt','Tagesordnung bestätigt','Keine Gegenstimme'][j],x+49,197+j*34);
      c.font='12px monospace';c.fillText(String(j+12),x+12,197+j*34);
    }
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const page=new T.Mesh(new T.PlaneGeometry(.400,.271),new T.MeshStandardMaterial({map,roughness:.91}));
  page.name='Sitzungsbuch · gedruckte Seiten und handschriftliche Nachträge';
  // Read from Matthias’ side of the desk.
  page.rotation.x=-Math.PI/2;
  page.position.set(w.pageX,w.paper,w.pageZ);page.receiveShadow=true;
  return page;
}

export function createArchiveStamp(T,room,F){
  const w=ARCHIVE_WORK,stamp=new T.Group();
  stamp.name='Archivar · handgeführter Amtsstempel';stamp.userData.noSceneQuery=true;
  const wood=new T.MeshStandardMaterial({color:0x512b20,roughness:.65});
  const brass=new T.MeshStandardMaterial({color:0xa27c43,roughness:.53,metalness:.48});
  const die=new T.MeshStandardMaterial({color:0x552d31,roughness:.87});
  const cylinder=(mat,t,r,h,y)=>{
    const mesh=new T.Mesh(new T.CylinderGeometry(t,r,h,16),mat);mesh.position.y=y;stamp.add(mesh);
  };
  cylinder(die,.035,.033,.007,.0035);
  cylinder(brass,.036,.037,.012,.012);
  cylinder(wood,.014,.021,.025,.029);
  cylinder(wood,.023,.014,.033,.057);
  cylinder(brass,.024,.024,.005,.072);
  const knob=new T.Mesh(new T.SphereGeometry(1,16,10),wood);
  knob.scale.set(.028,.021,.028);knob.position.y=.087;stamp.add(knob);
  room.add(stamp);
  const mark=new T.Group(),ink=new T.MeshStandardMaterial({color:0x77323a,roughness:.98});
  const arch=architectureKit(T,mark,{ink});
  const flat=(u,y,v)=>[u,y,v];
  const ring=new T.RingGeometry(.020,.0227,24);
  ring.rotateX(-Math.PI/2);
  arch.geometry('ink',ring,new T.Matrix4());
  arch.box('ink',flat,-.011,.011,.0001,.0006,-.004,-.002);
  arch.box('ink',flat,-.005,.005,.0001,.0006,.003,.006);
  for(let j=0;j<3;j++)arch.box('ink',flat,-.010+j*.008,-.007+j*.008,.0001,.0006,-.009,-.003);
  arch.flush('Sitzungsbuch · roter Siegelabdruck');ring.dispose();
  mark.visible=false;room.add(mark);
  const right=new T.Vector3(),left=new T.Vector3(w.handX,F+w.paper+.022,w.handZ);
  let phase=0;
  const smooth=(t,a,b)=>{const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p);};
  return {right,left,park(){stamp.position.set(w.inkX,F+w.inkY,w.inkZ);},tick(dt){
    phase=(phase+dt)%8.6;
    const t=phase,toInk=smooth(t,1.08,1.55)-smooth(t,2.19,2.87);
    const press=smooth(t,3.05,3.34)-smooth(t,3.69,4.05);
    const spread=.032*Math.sin(t*Math.PI*2/8.6);
    const x=w.stampX+(w.inkX-w.stampX)*toInk+.039*(1-toInk)*(1-press);
    const z=w.stampZ+(w.inkZ-w.stampZ)*toInk+spread*(1-toInk)*(1-press);
    const dip=smooth(t,1.55,1.77)-smooth(t,1.94,2.18);
    const lift=.024+.072*(smooth(t,.74,1.13)-smooth(t,2.65,3.11));
    const base=F+w.paper+lift*(1-press)-dip*(lift+w.paper-w.inkY);
    stamp.position.set(x,base,z);right.set(x,base+w.knob,z);
    mark.position.set(w.stampX,F+w.paper+.0015,w.stampZ);
    if(t>=3.34)mark.visible=true;
  }};
}
