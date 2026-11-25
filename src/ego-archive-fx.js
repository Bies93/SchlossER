const size=64,clamp=x=>Math.min(1,Math.max(0,x));

function softTexture(T,smoke){
  const pix=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=2*(x+.5)/size-1,v=2*(y+.5)/size-1,r=Math.hypot(u,v),a=Math.atan2(v,u);
    const grain=.45+.21*Math.sin(u*12+v*7)+.14*Math.sin(v*18-u*11)+.14*Math.sin(u*5-v*4);
    const veil=clamp(1-r*(.83+.17*Math.cos(a*5+v*2)))**2*(.33+.67*grain)*clamp((1-r)/.18);
    const petals=.70+.21*Math.cos(a*3)+.09*Math.sin(a*7);
    const flame=clamp(1-r/petals)**1.3;
    const i=4*(size*y+x);
    pix[i]=pix[i+1]=pix[i+2]=255;pix[i+3]=Math.round(255*(smoke?veil:flame));
  }
  const map=new T.DataTexture(pix,size,size);
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}

// A short, staged image-space cue. It uses no world lights, per-shot
// allocations, scene collision or full-screen postprocessing.
export function archiveShotFX(T,parent){
  const root=new T.Group();root.name='Falkenried · Schussoptik';parent.add(root);
  const glow=softTexture(T,false),fog=softTexture(T,true),plane=new T.PlaneGeometry();
  const point=new T.Vector3(),dir=new T.Vector3(),across=new T.Vector3();
  const make=(map,color,additive)=>{
    const o=new T.Mesh(plane,new T.MeshBasicMaterial({map,color,transparent:true,depthWrite:false,
      blending:additive?T.AdditiveBlending:T.NormalBlending,toneMapped:!additive}));
    root.add(o);return o;
  };
  const fireSprites=[make(glow,0xff932f,true),make(glow,0xffe5b5,true)];
  const vapor=Array.from({length:3},(_,i)=>make(fog,[0xb5bcc3,0xbfc6ca,0x8e9aa5][i],false));
  let age=Infinity,seed=0,quiet=false,roll=0,stretch=1;
  function paint(){
    const k=clamp(1-age/(quiet?.035:.060));
    for(let i=0;i<fireSprites.length;i++){
      const o=fireSprites[i];
      o.visible=k>0;o.material.opacity=k*(quiet?.27:i?.93:.73);
      o.position.copy(point).addScaledVector(dir,i?.026:.052);
      o.rotation.z=roll+i*.45;
      o.scale.set((i?.113:.236)*(.74+.26*k)*stretch,(i?.070:.152)*(.74+.26*k),1);
    }
    for(let i=0;i<vapor.length;i++){
      const o=vapor[i];
      const t=age-i*.025,fade=clamp(t/.065)*clamp(1-t/(.35+i*.047))**1.3;
      o.visible=!quiet&&fade>.004;
      if(!o.visible)continue;
      const spread=.07+i*.026+t*.49;
      o.position.copy(point).addScaledVector(dir,.035+i*.026+t*(.26-i*.04))
        .addScaledVector(across,(i-1)*.037+t*.071*Math.sin(seed+i));
      o.position.y+=t*(.28+i*.036);
      o.rotation.z=seed*.66+i*1.55+t*(i===1?1.9:-1.3);
      o.material.opacity=fade*(.39-i*.035);o.scale.set(spread*1.15,spread,1);
    }
  }
  const clear=()=>{root.visible=false;age=Infinity;};clear();
  return {clear,fire(anchor,weapon,serial,reduced){
    age=0;quiet=reduced;seed=serial;root.visible=true;
    point.fromArray(anchor).applyQuaternion(weapon.quaternion).add(weapon.position);
    dir.set(0,0,-1).applyQuaternion(weapon.quaternion);
    across.set(1,0,0).applyQuaternion(weapon.quaternion);
    roll=Math.atan2(dir.y,dir.x)+Math.sin(seed*2.4)*.26;
    stretch=.73+.59*Math.hypot(dir.x,dir.y);paint();
  },update(dt){
    if(!root.visible)return false;
    age+=dt;
    if(age>=(quiet?.035:.49))clear();else paint();
    return true;
  },warmup(){
    root.visible=true;root.traverse(o=>{o.visible=true;});return clear;
  }};
}
