export const INFO_FLAG_SITES=Object.freeze([
  Object.freeze({kind:'green',x:-2.91,z:1.13}),
  Object.freeze({kind:'pride',x:2.54,z:1.13})
]);

// Sail in the visitor's view: a curved feather beside a rectangular
// crossbar flag. The leading seam is pinned to the corresponding support.
const feather=[
  [0,.005,.210],[.13,.006,.406],[.40,.009,.597],[.66,.013,.667],
  [.79,.029,.672],[.88,.072,.638],[.95,.154,.555],[.983,.237,.462],[1,.352,.359]
];
const sailHeight=1.96,hoist=.62;

function edgeAt(t){
  const j=feather.findIndex(p=>p[0]>=t),b=feather[Math.max(1,j)],a=feather[Math.max(0,j-1)];
  const k=(t-a[0])/(b[0]-a[0]);return [a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
}

function sail(T,green){
  const nx=9,ny=27,p=[],uv=[],ix=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const t=j/ny,u=i/nx,[a,b]=green?edgeAt(t):[.021,.747];
    const lower=green?.025:.014;
    p.push(a+(b-a)*u,hoist+t*sailHeight+lower*Math.sin(u*Math.PI*1.47)*(1-t)**3,
      (green?.012:.020)+u*.012*Math.sin(t*3.4));
    uv.push(u,t);
    if(j<ny&&i<nx){const n=j*(nx+1)+i;ix.push(n,n+1,n+nx+1,n+1,n+nx+2,n+nx+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

function fabric(T,map,cloth,time,green){
  const m=new T.MeshStandardMaterial({map,side:T.DoubleSide,roughness:.91,
    normalMap:cloth.normalMap,normalScale:new T.Vector2(.23,.23)});
  m.customProgramCacheKey=()=>green?'info-flag-feather-1':'info-flag-crossbar-1';
  m.onBeforeCompile=sh=>{
    sh.uniforms.infoWind=time;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float infoWind;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        float freedom=smoothstep(0.,.95,uv.x)${green?'*(1.-smoothstep(.91,1.,uv.y))':'*(1.-smoothstep(.77,1.,uv.y))'};
        float drag=sin(infoWind*2.55-uv.x*4.3+uv.y*2.3)*.065+sin(infoWind*4.7-uv.x*8.0)*.022;
        transformed.z+=freedom*drag;
        transformed.y-=freedom*drag*.12;
      `);
  };
  return m;
}

export function addInfoFlags(T,stand,world,floorAt,prints,cloth){
  const rubber=new T.MeshStandardMaterial({color:0x252b29,roughness:.94}),
    steel=new T.MeshStandardMaterial({color:0x79837e,metalness:.62,roughness:.46}),
    carbon=new T.MeshStandardMaterial({color:0x2e4035,metalness:.18,roughness:.63});
  const collar=new T.CylinderGeometry(.031,.038,.090,18),stud=new T.CylinderGeometry(.009,.009,.005,10);
  const baseGeo=new T.LatheGeometry([[0,0],[.216,0],[.231,.014],[.231,.034],[.219,.050],
    [.187,.071],[.064,.087],[.044,.087],[.044,.077],[0,.077]].map(([r,y])=>new T.Vector2(r,y)),32);
  const clock={value:0};
  const V=(...p)=>new T.Vector3(...p),up=V(0,1,0);
  function add(to,g,m,name,p=V(0,0,0)){
    const o=new T.Mesh(g,m);o.name=name;o.position.copy(p);o.receiveShadow=true;to.add(o);return o;
  }
  function post(to,a,b,r,m,name){
    const dir=V().subVectors(b,a),g=new T.CylinderGeometry(r,r,dir.length(),12);
    const o=add(to,g,m,name,V().copy(a).lerp(b,.5));o.quaternion.setFromUnitVectors(up,dir.normalize());return o;
  }
  for(const site of INFO_FLAG_SITES){
    const green=site.kind==='green',x=stand.position.x+site.x,z=stand.position.z+site.z,y=floorAt(x,z);
    const rig=new T.Group();rig.name=green?'Flaggenständer · Grüne':'Flaggenständer · Inklusion';
    rig.position.set(site.x,y-stand.position.y,site.z);stand.add(rig);
    add(rig,baseGeo,rubber,'Flaggenständer · Ballastfuß').castShadow=true;
    add(rig,collar,steel,'Flaggenständer · Mastaufnahme',V(0,.095,0));
    for(let i=0;i<3;i++){
      const a=i/3*Math.PI*2;
      add(rig,stud,steel,'Flaggenständer · Schraubenkopf',V(.048*Math.sin(a),.087,.048*Math.cos(a)));
    }
    if(green){
      const spine=new T.CatmullRomCurve3([V(0,.123,0),V(0,.41,.004),...feather.map(([t,a])=>V(a,hoist+t*sailHeight,.012))]);
      add(rig,new T.TubeGeometry(spine,48,.012,10,false),carbon,'Beachflag · gebogener Spannmast');
    }else{
      const top=hoist+sailHeight+.006;
      post(rig,V(0,.121,0),V(0,top+.053,0),.017,steel,'Flaggenständer · Aluminiummast');
      post(rig,V(0,top,0),V(.782,top,.019),.012,steel,'Flaggenständer · Querstange');
      const cap=new T.SphereGeometry(.022,12,8);
      add(rig,cap,steel,'Flaggenständer · Mastkappe',V(0,top+.055,0)).scale.y=.49;
      for(const f of [.13,.43,.75])post(rig,V(0,hoist+f*sailHeight,0),V(.026,hoist+f*sailHeight,.019),.003,steel,'Flagge · Befestigungsring');
    }
    const flag=add(rig,sail(T,green),fabric(T,green?prints.green:prints.pride,cloth,clock,green),
      green?'Stoffflagge · Grüne mit Sonnenblume':'Stoffflagge · Inklusive Regenbogenflagge');
    flag.userData.noSceneQuery=true;
    world.circle(x,z,.218,p=>Math.abs(p.y-y)<.43);
  }
  return t=>{clock.value=t;};
}
