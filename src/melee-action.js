export const MELEE={kind:'melee',impact:32,color:0xbd8c68,duration:.445,start:.096,end:.194,radius:.083};
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export function fistPhase(age){
  return {coil:smooth(age/.094)*(1-smooth((age-.094)/.077)),
    reach:smooth((age-.077)/.119)*(1-smooth((age-.202)/.205)),
    weight:smooth(age/.065)*(1-smooth((age-.316)/.129))};
}

export function meleeAction(T,query,targets,context,feedback){
  const eye=new T.Vector3(),tip=new T.Vector3(),previous=new T.Vector3(),heading=new T.Vector3(),wallAt=new T.Vector3();
  const ray=new T.Ray(),sight=new T.Ray(),surface={material:'surface'};
  let fired=-Infinity,last=0,side=-1,connected=false,attackLayer=-1;
  function place(out,age,camera){
    const k=smooth((age-MELEE.start)/(MELEE.end-MELEE.start));
    return out.set(side*(.255-.253*k),-.14+.115*k,-(.47+.82*k)).applyMatrix4(camera.matrixWorld);
  }
  function sweep(from,to,mask){
    heading.subVectors(to,from);
    const d=heading.length();
    if(d<.0001)return false;
    ray.set(from,heading.multiplyScalar(1/d));
    surface.material='surface';
    const wall=query.trace(ray,d,mask,.001,false,surface);
    const hit=targets?.nearest(ray,Math.min(wall,d),mask,MELEE.radius);
    if(hit){
      const point=hit.core??hit.point;
      sight.direction.subVectors(point,eye);
      const span=sight.direction.length();
      if(span>.001&&query.trace(sight.set(eye,sight.direction.multiplyScalar(1/span)),span+.006,mask,.012,true)===Infinity){
        if(targets.damage(hit.actor,MELEE.impact,MELEE.color,point,MELEE,hit.head?1:0,ray.direction,hit.region)){
          feedback(point,hit.actor.alive===false?'down':'body','soft');return true;
        }
      }
    }
    if(wall!==Infinity){feedback(ray.at(wall,wallAt),'solid',surface.material);return true;}
    // A centerline check closes the gap when the hand starts beyond a nearby wall.
    sight.direction.subVectors(to,eye);const span=sight.direction.length();
    if(span>.001){
      const obstruction=query.trace(sight.set(eye,sight.direction.multiplyScalar(1/span)),span,mask,.012,false,surface);
      if(obstruction!==Infinity){feedback(sight.at(obstruction,wallAt),'solid',surface.material);return true;}
    }
    return false;
  }
  return {begin(now){
    if(now-fired<MELEE.duration)return false;
    fired=now;last=0;connected=false;side=-side;attackLayer=context().layer;return true;
  },step(now,camera){
    const age=now-fired;
    if(Number.isFinite(age)&&!connected&&last<MELEE.end&&age>=MELEE.start){
      const {mask,layer}=context();
      if(layer!==attackLayer){fired=-Infinity;return;}
      camera.updateWorldMatrix(true,false);eye.setFromMatrixPosition(camera.matrixWorld);
      const a=Math.max(MELEE.start,last),b=Math.min(MELEE.end,age);
      if(last<MELEE.start||b>a){
        // Two short chords follow the bend in the fist's path even on a long frame.
        place(previous,a,camera);
        if(last<MELEE.start){tip.copy(previous);previous.set(side*.22,-.155,-.27).applyMatrix4(camera.matrixWorld);
          connected=sweep(previous,tip,mask);previous.copy(tip);}
        for(let i=1;!connected&&i<=2&&b>a;i++){
          place(tip,a+(b-a)*i/2,camera);connected=sweep(previous,tip,mask);previous.copy(tip);
        }
      }
    }
    last=age;
  },cancel(){fired=-Infinity;},age:now=>now-fired,get side(){return side;}};
}
