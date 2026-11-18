import {LIGHTING} from './lighting.js';
import {LAMP_SITES} from './world-layout.js';
import {addFountainCarving} from './fountain-carving.js';

const CY=-47,Y=.379,STADIUM=4.75,R=9.129;
const streams=[
  [-9.15,-47.10,-.31,.42,3.56],[9.13,-47.0,.29,.47,3.75],
  [-9.25,-46.92,-.63,1.03,.45],[9.15,-47.15,.73,-.92,.54],
  [-9.06,-47.10,.44,-.93,.39],[9.13,-46.91,-.49,1.08,.43]
];

export function makeFountain(T,scene,original){
  if(!original)return {tick:()=>false,setPreset(){}};
  const group=new T.Group();group.name='Hugenottenbrunnen · Wasserregie';
  let basinFound=false;
  original.traverse(o=>{
    if(!o.isMesh)return;
    if(/Fountain_water/i.test(o.name))basinFound=true;
    if(/Fountain_water|Water_jets|Aerated_spray/i.test(o.name)){
      o.visible=false;o.castShadow=false;o.receiveShadow=false;
    }
  });
  if(!basinFound)return {tick:()=>false,setPreset(){}};
  scene.add(group);
  addFountainCarving(T,group,original,CY,Y);
  const t={value:0}, lamps={value:0}, night={value:0}, tint={value:new T.Color(0xd8e7e4)};
  const lightSites=LAMP_SITES.filter(p=>Math.abs(p.x)<19&&p.z<-50&&p.z>-68).slice(0,2);
  const lm=lightSites.map(p=>new T.Vector3(p.x,3.21,p.z));
  while(lm.length<2)lm.push(new T.Vector3(18.0,3.21,-62.0));
  const edge=new T.Shape();
  edge.moveTo(-STADIUM,-R);edge.lineTo(STADIUM,-R);
  edge.absarc(STADIUM,0,R,-Math.PI/2,Math.PI/2,false);edge.lineTo(-STADIUM,R);
  edge.absarc(-STADIUM,0,R,Math.PI/2,Math.PI*1.5,false);edge.closePath();
  const geo=new T.ShapeGeometry(edge,45);geo.rotateX(-Math.PI/2);
  const surface=new T.MeshPhysicalMaterial({color:0x334b3c,roughness:.198,metalness:0,ior:1.333,envMapIntensity:1.15});
  surface.onBeforeCompile=s=>{
    s.uniforms.erlWaterTime=t;s.uniforms.erlLamp=lamps;s.uniforms.erlNight=night;
    s.uniforms.erlLumA={value:lm[0]};s.uniforms.erlLumB={value:lm[1]};
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 erlWaterWorld;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nerlWaterWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 erlWaterWorld;
      uniform float erlWaterTime,erlLamp,erlNight;
      uniform vec3 erlLumA,erlLumB;
      vec2 rings(vec2 p,vec2 origin,float k){
        vec2 q=p-origin;
        float r=length(q), phase=r*30.0-erlWaterTime*7.8+k;
        return q/max(.07,r)*cos(phase)*exp(-r*1.12)*.152*smoothstep(.025,.22,r);
      }
      float glint(vec3 reflected, vec3 light, float wav){
        vec3 a=normalize(light-erlWaterWorld);
        return pow(max(dot(reflected,a),0.0),mix(95.0,240.0,wav)) *
          (1.0-smoothstep(11.0,22.0,length(light-erlWaterWorld)));
      }`)
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 p=erlWaterWorld.xz;
        vec2 q=vec2(max(0.0,abs(p.x)-4.75),p.y+47.0);
        float rim=smoothstep(7.74,9.16,length(q));
        float line=smoothstep(9.045,9.129,length(q));
        float bed=.53+.32*sin(p.x*1.38+p.y*1.76)+.15*sin(p.x*4.1-p.y*3.4);
        float stoneBank=smoothstep(2.2,4.8,length(vec2(p.x,(p.y+47.)*1.2)));
        diffuseColor.rgb*=mix(vec3(.72,.83,.72),vec3(1.025,1.06,.96),stoneBank);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.124,.135,.074),rim*(.33+bed*.28));
        diffuseColor.rgb*=vec3(1.0-line*.34)*(1.0-.38*erlNight);
      `)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec2 pW=erlWaterWorld.xz;
        vec2 aW=vec2(2.9,6.6),bW=vec2(-8.2,3.3);
        vec2 wave=.037*cos(dot(pW,aW)+erlWaterTime*1.04)*normalize(aW)
          +.038*cos(dot(pW,bW)-erlWaterTime*.74)*normalize(bW)
          +.014*cos(dot(pW,vec2(17.1,-8.43))+erlWaterTime*2.54)*vec2(.84,-.35);
        wave+=rings(pW,vec2(-9.46,-46.68),.7)+rings(pW,vec2(9.42,-46.53),2.3);
        wave+=rings(pW,vec2(-9.88,-45.89),4.1)*.54+rings(pW,vec2(9.88,-48.07),1.0)*.54;
        vec3 waterNormal=normalize(vec3(-wave.x,1.0,-wave.y));
        normal=normalize(mat3(viewMatrix)*waterNormal);
      `)
      .replace('#include <opaque_fragment>',`vec3 reflection=reflect(normalize(erlWaterWorld-cameraPosition),waterNormal);
        float sparkle=glint(reflection,erlLumA,.65)+glint(reflection,erlLumB,.43);
        outgoingLight+=vec3(1.0,.48,.21)*sparkle*erlLamp*.68;
        #include <opaque_fragment>`);
  };
  surface.customProgramCacheKey=()=> 'erl-fountain-water-v1';
  const water=new T.Mesh(geo,surface);water.position.set(0,Y,CY);
  water.name='Becken · Wellen und Reflexion';water.receiveShadow=true;group.add(water);

  function position(j,u){
    const [x,z,dx,dz,h]=streams[j];
    return new T.Vector3(x+dx*u,Y+.014+4*h*u*(1-u),z+dz*u);
  }
  const jetMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:t,tint},
    vertexShader:`varying vec2 v;varying vec3 N,V;void main(){v=uv;
      vec4 p=modelViewMatrix*vec4(position,1.);V=-p.xyz;N=normalMatrix*normal;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float time;uniform vec3 tint;varying vec2 v;varying vec3 N,V;
      void main(){float f=1.-abs(dot(normalize(N),normalize(V)));
      float beads=.57+.43*pow(.5+.5*sin(v.x*188.-time*24.0+v.y*11.),3.);
      float wake=smoothstep(.0,.017,v.x)*(1.-smoothstep(.92,1.,v.x));
      gl_FragColor=vec4(tint*(.77+.65*f),wake*beads*(.27+f*.32));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const jets=[];
  for(let j=0;j<streams.length;j++){
    const curve=new T.CatmullRomCurve3(Array.from({length:22},(_,i)=>position(j,i/21)));
    const m=new T.Mesh(new T.TubeGeometry(curve,j<2?41:20,j===0?.034:j===1?.038:.016,6,false),jetMat);
    m.name='Wasserstrahl '+(j+1);m.renderOrder=2;group.add(m);jets.push(m);
  }
  const drops=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),
    new T.MeshBasicMaterial({color:0xd9ebeb,transparent:true,opacity:.55,depthWrite:false}),148);
  drops.instanceMatrix.setUsage(T.DynamicDrawUsage);
  drops.frustumCulled=false;drops.renderOrder=3;group.add(drops);
  const foamMat=new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{time:t,tint},
    vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 v;uniform float time;uniform vec3 tint;void main(){
      vec2 p=(v-.5)*2.0;float d=length(p),a=atan(p.x,p.y);
      float noise=.5+.5*sin(a*13.0+d*39.0+time*4.8)*sin(p.y*37.0-p.x*42.0);
      float ripple=pow(.5+.5*cos(d*24.-time*5.8),7.)*(.36+noise*.64);
      float cone=(1.0-smoothstep(.12,.99,d))*max(noise*.26,ripple);
      gl_FragColor=vec4(tint,cone*.49);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  const square=new T.PlaneGeometry(1,1);square.rotateX(-Math.PI/2);
  const foam=new T.InstancedMesh(square,foamMat,streams.length),dummy=new T.Object3D();
  for(let j=0;j<streams.length;j++){
    const end=position(j,1),s=j<2?1.35:.63;
    dummy.position.set(end.x,Y+.011,end.z);dummy.scale.set(s,1,s*.83);dummy.updateMatrix();foam.setMatrixAt(j,dummy.matrix);
  }
  foam.computeBoundingSphere();foam.renderOrder=1;group.add(foam);
  const frustum=new T.Frustum(),vp=new T.Matrix4(),bounds=new T.Sphere(new T.Vector3(0,2,CY),17);
  let elapsed=0,last=null,lastPaint=-1;
  function updateDrops(now){
    for(let i=0;i<drops.count;i++){
      const j=i%streams.length, u=(now*(j<2?.69:1.19)+i*.6180339)%1;
      const p=position(j,u),phase=i*2.39896+u*3.6,k=Math.sin(u*Math.PI)*(j<2?.206:.105);
      p.x+=Math.sin(phase)*k;p.z+=Math.cos(phase*1.57)*k;p.y+=(Math.sin(phase*3.7)*.11)*Math.sin(u*Math.PI);
      dummy.position.copy(p);
      const r=.006+.017*((i*31%97)/97);dummy.scale.set(r,r*(1.11+u*1.24),r);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate=true;
  }
  updateDrops(0);
  function syncView(camera){
    camera.updateWorldMatrix(true,false);
    const d=Math.hypot(camera.matrixWorld.elements[12],camera.matrixWorld.elements[14]-CY);
    drops.visible=d<46;foam.visible=d<61;
    jets.forEach((m,i)=>m.visible=i<2||d<67);
    return d;
  }
  return {
    syncView,
    setPreset(id){
      lamps.value=LIGHTING[id]?.lamps??0;night.value=id==='night'?1:0;
      tint.value.setHex(id==='night'?0x748da0:0xd0bcab);
      drops.material.color.copy(tint.value);
    },
    stop(){last=null},
    tick(time,camera){
      const d=syncView(camera);
      if(d>86||!frustum.setFromProjectionMatrix(vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsSphere(bounds)){
        last=null;return false;
      }
      if(last===null)last=time;
      elapsed+=Math.min(.10,(time-last)*.001);last=time;
      if(time-lastPaint<38)return false;
      lastPaint=time;t.value=elapsed;
      if(d<46)updateDrops(elapsed);
      return true;
    }
  };
}
