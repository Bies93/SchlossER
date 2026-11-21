import {BERG_POOL as P,BERG_CHAIRS,BERG_LAYER,BERG_FLOOR as F,bergInside} from './berg-layout.js';
import {bergArrival,bergReturn} from './berg-tavern.js';
import {bergMaterials,carpentry,storyCard} from './berg-props.js';
import {warmRoom} from './warm-room.js';

export function addBergPuddle(T,scene,world,heightAt,tavern){
  const surface=new T.Group();surface.name='Orangerie · Pfütze und aufgegebener Ausschank';scene.add(surface);
  const y=heightAt(P.x,P.z),at=new T.Vector3(P.x,y+.02,P.z),m=bergMaterials(T);
  const k=carpentry(T,surface,m);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{
    mirror:{value:null},clock:{value:0},shown:{value:0},azimuth:{value:new T.Vector2(0,1)}
  },vertexShader:`
    varying vec2 uv0;
    void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `,fragmentShader:`
    uniform sampler2D mirror;
    uniform float clock,shown;
    uniform vec2 azimuth;
    varying vec2 uv0;
    void main(){
      vec2 p=uv0*2.-1.;
      float a=atan(p.y,p.x);
      float d=length(p)/(0.925+.043*sin(3.*a+.77)+.029*cos(5.*a)+.017*sin(8.*a));
      if(d>1.075)discard;
      float wobble=.004*sin(p.y*39.+clock*1.8)+.002*sin(p.x*44.-p.y*15.-clock*2.6);
      vec2 view=vec2(dot(p,vec2(azimuth.y,azimuth.x)),dot(p,vec2(-azimuth.x,azimuth.y)));
      vec2 sampleUV=.5+view*vec2(.47,.46)+wobble*vec2(1.,.7);
      vec3 v=texture2D(mirror,clamp(sampleUV,.01,.99)).rgb;
      float interior=1.-smoothstep(.77,.99,d);
      float ring=pow(.5+.5*sin(d*47.-clock*3.1),11.)*(1.-smoothstep(.23,.95,d));
      vec3 col=mix(vec3(.060,.090,.083),v*vec3(.73,.81,.79)+vec3(.023,.043,.042),interior*.94*shown);
      col+=ring*vec3(.019,.044,.046);
      col=mix(col,vec3(.109,.067,.034),smoothstep(.95,1.046,d));
      gl_FragColor=vec4(col, (1.-smoothstep(1.01,1.075,d))*(.82+.18*interior));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `});
  const puddle=new T.Mesh(new T.PlaneGeometry(P.rx*2.20,P.rz*2.20),material);
  puddle.position.copy(at);puddle.rotation.x=-Math.PI/2;surface.add(puddle);puddle.userData.noSceneQuery=true;
  for(const [i,[dx,dz,yaw]] of BERG_CHAIRS.entries()){
    const g=new T.Group(),t=carpentry(T,g,m);g.position.set(P.x+dx,heightAt(P.x+dx,P.z+dz),P.z+dz);g.rotation.y=yaw;surface.add(g);
    for(let j=0;j<4;j++)t.box(i===1?'rock':'oak',0,.424,(j-1.5)*.117,.49,.044,.109);
    for(const a of [-.218,.218])for(const b of [-.194,.194])t.box('iron',a,b<0?.409:.195,b,.032,b<0?.818:.39,.033);
    for(const h of [.66,.79])t.box('edge',0,h,-.194,.48,.088,.031);
    for(const aa of [-.20,.20])for(const h of [.66,.79])t.cyl('iron',aa,h,-.17,.013,.015,Math.PI/2);
    t.flush('Verwitterter Biergartenstuhl');
    world.circle(P.x+dx,P.z+dz,.22,p=>Math.abs(p.y-y)<.8);
  }
  for(let i=0;i<15;i++){
    const ang=i*2.39996,r=1.13+.08*Math.sin(i*94),x=P.x+P.rx*r*Math.cos(ang),z=P.z+P.rz*r*Math.sin(ang);
    k.oval(i%3===0?'stone':'rock',x,heightAt(x,z)+.016,z,.07+(i%4)*.019,.035,.052+(i%5)*.017);
  }
  for(const [i,x,z] of [[0,-.09,2.08],[1,.16,2.47],[2,-.12,2.74]]){
    k.oval('rock',P.x+x,heightAt(P.x+x,P.z+z)+.011,P.z+z,.086,.013,.156-i*.008);
  }
  const tag=storyCard(T,surface,{title:'AUSSCHANK',sub:'EINGANG BEI REGEN',width:.49,height:.267,x:P.x+1.6,y:y+.029,z:P.z+1.61,small:true});
  tag.rotation.set(-Math.PI/2,0,.35);
  k.flush(surface.name);
  const previewCam=new T.PerspectiveCamera(45,1.5,.10,30),frustum=new T.Frustum(),vp=new T.Matrix4();
  previewCam.layers.set(BERG_LAYER);
  const previewBounds=new T.Box3(new T.Vector3(P.x-P.rx,y-.2,P.z-P.rz),new T.Vector3(P.x+P.rx,y+.23,P.z+P.rz));
  const targetTexture=new T.WebGLRenderTarget(360,240,{depthBuffer:true});
  material.uniforms.mirror.value=targetTexture.texture;
  let prepared=false,near=false,lastFrame=-Infinity;
  function aimPreview(x=0){
    previewCam.position.set(P.x+x,F+2.22,P.z+3.68);
    previewCam.lookAt(P.x+x*.14,F+1.47,P.z-2.23);
  }
  function inView(c){
    c.updateWorldMatrix(true,false);frustum.setFromProjectionMatrix(vp.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse));
    return frustum.intersectsBox(previewBounds);
  }
  const exit={id:'berg-return',action:'berg-portal',label:'Durch das Wasser zurück in den Garten'};
  const entry={id:'berg-pool',action:'berg-portal',label:'In die Pfütze steigen'};
  function wideEnough(p,look,x,Y,z,h,dot){
    const dx=x-p.x,dy=Y-(p.y+1.67),dz=z-p.z,d=Math.hypot(dx,dy,dz);
    return d<h&&(dx*look.x+dy*look.y+dz*look.z)>d*dot;
  }
  return {root:surface,async prepare(r){
    aimPreview();
    // The linear texture pass and the tone-mapped room use different GPU programs.
    await warmRoom(T,r,scene,previewCam,[tavern.root],{target:targetTexture});
    await warmRoom(T,r,scene,previewCam,[tavern.root]);
    prepared=true;
  },update(dt,p,surfaceLayer,c,beat=null){
    const inside=bergInside(p);tavern.root.visible=inside;
    const close=surfaceLayer&&(p.x-P.x)**2+(p.z-P.z)**2<16**2&&(!c||inView(c));
    if(close!==near){near=close;material.uniforms.shown.value=near&&prepared?1:0;}
    const anim=inside?tavern.animate(dt,p,false,beat):near&&tavern.animate(dt,p,true);
    if(near){
      material.uniforms.clock.value+=dt;
      if((p.x-P.x)**2+(p.z-P.z)**2>.09)material.uniforms.azimuth.value.set(p.x-P.x,p.z-P.z).normalize();
    }
    return anim||near;
  },preview(r,c,p,now){
    if(!prepared||!near||now-lastFrame<77)return;
    if(!inView(c))return;
    lastFrame=now;
    aimPreview(Math.max(-.84,Math.min(.84,(p.x-P.x)*.26)));
    const clear=r.autoClear,previous=r.getRenderTarget(),shadow=r.shadowMap.autoUpdate,needs=r.shadowMap.needsUpdate;
    const prior=tavern.root.visible;
    try{
      tavern.root.visible=true;tavern.root.updateMatrixWorld(true);r.autoClear=true;
      r.shadowMap.autoUpdate=r.shadowMap.needsUpdate=false;r.setRenderTarget(targetTexture);r.render(scene,previewCam);
    }finally{
      tavern.root.visible=prior;r.setRenderTarget(previous);r.autoClear=clear;
      r.shadowMap.autoUpdate=shadow;r.shadowMap.needsUpdate=needs;
    }
  },target(p,look,surfaceLayer){
    if(bergInside(p))return wideEnough(p,look,P.x,F+1.07,P.z+4.15,2.45,.79)?exit:null;
    return surfaceLayer&&wideEnough(p,look,P.x,y+.04,P.z,3.87,.82)?entry:null;
  },destination(inside){
    const {x,z}=inside?bergReturn:bergArrival;
    return {x,z,y:inside?heightAt(x,z):F,yaw:inside?Math.PI:0,pitch:0};
  }};
}
