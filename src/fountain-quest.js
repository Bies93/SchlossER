export const FIND={id:'fountain-fundsache',action:'fountain-quest-pickup',label:'Hodensack mit 2 Eiern aufheben'};
const giveNiklas={label:'Klar, hier - sind mir eh zu klein!',reply:{action:'return-fundsache'}};
const giveZwanni={label:'Ja hier, was zum Lutschen. Verschluck dich nicht!',reply:{action:'feed-fundsache'}};
export function fountainQuest(){
  let phase='missing';
  return {get phase(){return phase;},collect(){
    if(phase!=='missing')return false;
    phase='held';return true;
  },opening(speech){
    if(speech.id!=='niklas'||!speech.choices)return speech;
    if(phase==='niklas')return {...speech,choices:undefined,clip:'niklasFundsache',line:'Geil, endlich Mann sein!'};
    if(phase==='held')return {...speech,choices:[...speech.choices,giveNiklas]};
    return speech;
  },followup(speech,reply){
    if(phase!=='held'||speech.id!=='festZwanni'||reply.clip!=='festZwanniEier')return null;
    return {...speech,...reply,choices:[giveZwanni,{label:'Lass stecken.'}]};
  },deliver(id,action,available){
    if(phase!=='held'||!available)return null;
    if(id==='niklas'&&action==='return-fundsache')phase='niklas';
    else if(id==='festZwanni'&&action==='feed-fundsache')phase='zwanni';
    else return null;
    return phase;
  }};
}

export function addFountainFind(T,group,waterY,quest){
  // In the shallow strip nearest the palace, in reach from the rim.
  const item=new T.Group();item.name=FIND.label;item.userData.noSceneQuery=true;
  item.position.set(-3.24,waterY+.016,-38.92);
  group.add(item);
  const mat=new T.MeshStandardMaterial({color:0x9a6759,roughness:.39,vertexColors:true});
  const geo=new T.SphereGeometry(1,28,18),pos=geo.attributes.position,color=[];
  const dark=new T.Color(0x847472),light=new T.Color(0xfee4d0),tone=new T.Color();
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),a=Math.atan2(z,x),f=Math.sqrt(Math.max(0,1-y*y));
    const crease=f*f*(.022*Math.sin(a*10+y*11)+.013*Math.sin(a*17-y*17));
    pos.setXYZ(i,x*(1+crease),y+.028*f*Math.sin(a*3),z*(1+crease));
    const shade=.45+.28*y+.13*Math.cos(a*2+y*5)+crease;
    tone.copy(dark).lerp(light,shade).toArray(color,i*3);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(color,3));geo.computeVertexNormals();
  const piece=(x,y,z,sx,sy,sz,rz)=>{
    const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.z=rz;m.receiveShadow=true;item.add(m);
  };
  piece(-.071,.049,.006,.093,.106,.088,-.24);piece(.060,.065,-.012,.093,.101,.095,.24);
  piece(-.013,.077,-.024,.109,.083,.075,-.28);
  const wet=new T.Mesh(new T.TorusGeometry(.19,.0043,5,30),new T.MeshBasicMaterial({color:0xe3c7a0,transparent:true,opacity:.23,depthWrite:false}));
  wet.rotation.x=-Math.PI/2;wet.position.y=-.013;wet.scale.y=.75;item.add(wet);
  const ray=new T.Ray(),dir=new T.Vector3(),to=new T.Vector3(),at=item.position.clone().add(new T.Vector3(0,.119,0));
  return {target(camera,query){
    if(quest.phase!=='missing')return null;
    camera.getWorldPosition(ray.origin);to.subVectors(at,ray.origin);
    const d=to.length();
    if(d<.12||d>2.80||camera.getWorldDirection(dir).dot(to.multiplyScalar(1/d))<.895)return null;
    ray.direction.copy(to);
    return query.trace(ray,d-.135,1,.045,true)===Infinity?FIND:null;
  },collect(){
    if(!quest.collect())return false;
    item.visible=false;return true;
  }};
}
