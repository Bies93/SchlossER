import {LAMP_SITES} from './world-layout.js';

export function addFixtures(T,scene,world,floorHeight){
  const group=new T.Group();group.name='Leuchten · künstlerische Platzierung';scene.add(group);
  const metal=new T.MeshStandardMaterial({color:0x353a35,roughness:.62,metalness:.29});
  const lens=new T.MeshStandardMaterial({color:0x697577,roughness:.34,metalness:.04,
    emissive:0xffaa5d,emissiveIntensity:0});
  const details=new Map(), dummy=new T.Object3D();
  const standard=new T.CylinderGeometry(.52,.52,1,10);
  const newPole=new T.CylinderGeometry(.32,.5,1,10);
  const cap=new T.CylinderGeometry(.10,.52,1,4,1);
  const panes=new T.CylinderGeometry(.52,.32,1,4,1);
  const square=new T.BoxGeometry(1,1,1);
  function stamp(geometry,mat,x,y,z,sx,sy,sz,angle=0){
    const key=geometry.uuid+mat.uuid;
    if(!details.has(key))details.set(key,{geometry,mat,poses:[]});
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,angle,0);dummy.updateMatrix();
    details.get(key).poses.push(dummy.matrix.clone());
  }
  const lamp=LAMP_SITES.map(site=>{
    const base=floorHeight(site.x,site.z),wall=site.type==='wall',x=site.x,z=site.z+(wall?.30:0),
      center=wall?site.y:base+3.21;
    if(wall){
      stamp(square,metal,x,center-.16,z-.29,.17,.51,.075);
      stamp(square,metal,x,center-.32,z-.135,.055,.063,.35);
    }else{
      const w=.19;
      stamp(standard,metal,x,base+.085,z,.37,.18,.37);
      stamp(standard,metal,x,base+.32,z,.23,.46,.23);
      stamp(newPole,metal,x,base+1.72,z,w,2.5,w);
      stamp(standard,metal,x,center-.25,z,.25,.14,.25);
      world.circle(x,z,.19);
    }
    stamp(panes,lens,x,center,z,.38,.36,.38,Math.PI/4);
    stamp(standard,metal,x,center-.205,z,.298,.050,.298);
    stamp(cap,metal,x,center+.269,z,.49,.185,.49,Math.PI/4);
    stamp(standard,metal,x,center+.375,z,.078,.122,.078);
    for(const sx of [-1,1])for(const sz of [-1,1])
      stamp(square,metal,x+sx*.128,center,z+sz*.128,.022,.38,.022);
    return {x,z,y:center,base,wall};
  });
  for(const {geometry,mat,poses} of details.values()){
    const mesh=new T.InstancedMesh(geometry,mat,poses.length);
    poses.forEach((pose,i)=>mesh.setMatrixAt(i,pose));mesh.computeBoundingSphere();
    mesh.receiveShadow=true;group.add(mesh);
  }
  const floorGlow=new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2,
    uniforms:{power:{value:0},tone:{value:new T.Color(0xf6ab65)}},
    vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 v;uniform float power;uniform vec3 tone;
      void main(){
        float d=length((v-.5)*2.0);
        float fade=pow(max(0.0,1.0-d*d),3.4);
        gl_FragColor=vec4(tone*.35,fade*power*.34);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  // Pre-fit each light decal to the same walking height used for the park.
  // The emitted pools still share one small indexed mesh and draw call.
  const grid=8, pos=[],uv=[],tri=[];
  for(const p of lamp){
    const start=pos.length/3,W=p.wall?8.3:9.7,H=p.wall?8.7:9.7;
    for(let j=0;j<=grid;j++)for(let i=0;i<=grid;i++){
      const u=i/grid,v=j/grid,x=p.x+(u-.5)*W,z=p.z+(v-.5)*H+(p.wall?1.2:0);
      pos.push(x,(z<=-17?Math.max(p.base-.039,floorHeight(x,z)):p.base)+.011,z);uv.push(u,v);
      if(i<grid&&j<grid){const k=start+j*(grid+1)+i,b=k+grid+1;tri.push(k,b,k+1,k+1,b,b+1);}
    }
  }
  const glowMesh=new T.BufferGeometry();
  glowMesh.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  glowMesh.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  glowMesh.setIndex(tri);
  const pools=new T.Mesh(glowMesh,floorGlow);pools.renderOrder=1;group.add(pools);
  const spots=Array.from({length:4},()=>{
    const spot=new T.SpotLight(0xffad68,0,17,Math.PI*.44,.74,2);
    scene.add(spot,spot.target);return spot;
  });
  let level=0;
  function setLevel(amount){
    level=amount;lens.emissiveIntensity=3.1*amount;
    floorGlow.uniforms.power.value=.88*amount;pools.visible=amount>0;
    for(const light of spots){light.visible=amount>0;light.intensity=0}
  }
  function update(player){
    if(!level)return;
    const near=lamp.map(p=>({p,d:Math.hypot(p.x-player.x,p.z-player.z)})).sort((a,b)=>a.d-b.d);
    spots.forEach((spot,i)=>{
      const {p,d}=near[i];
      spot.position.set(p.x,p.y-.09,p.z);
      spot.target.position.set(p.x,p.base,p.z+(p.wall?2.3:0));
      spot.intensity=73*level*(1-T.MathUtils.smoothstep(d,25,41));
    });
  }
  setLevel(0);
  return {setLevel,update};
}
