import {CLUB_FLOOR as F,CLUB_CEILING as C} from './lab-layout.js';

// The cell is already lit by four pooled point lights. These two moving heads
// project only luminous shapes, not additional shadow maps or volumetric passes.
export function danceLights(T,root,{bar,bx,cyl}){
  const pi=Math.PI,h=3.48,stand=F+h, rig=[],down=new T.Vector3(0,-1,0),aim=new T.Vector3();
  const metal=new T.MeshStandardMaterial({color:0x323a42,metalness:.46,roughness:.47});
  const lensGeo=new T.CylinderGeometry(.112,.116,.030,16),bodyGeo=new T.CylinderGeometry(.139,.165,.29,16);
  const cone=new T.CylinderGeometry(.095,1,1,40,1,true).translate(0,-.5,0);
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  const grad=g.createRadialGradient(64,64,0,64,64,63);grad.addColorStop(0,'#ffffffe6');grad.addColorStop(.41,'#ffffffab');grad.addColorStop(.75,'#ffffff40');grad.addColorStop(1,'#ffffff00');
  g.fillStyle=grad;g.fillRect(0,0,128,128);
  const glow=new T.CanvasTexture(c),quad=new T.PlaneGeometry(1,1),reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Suspended lattice catwalk: cross-braces, clamps and two separate trunnion pins.
  for(const z of [-13.60,-8.45]){
    for(const dz of [-.112,.112]){
      bar('gunmetal',13.05,3.67,z+dz,19.99,3.67,z+dz,.023);
      bar('gray',13.05,3.90,z+dz,19.99,3.90,z+dz,.020);
      for(let i=0;i<15;i++)bar('gray',13.05+i*.46,3.68+(i%2)*.21,z+dz,13.05+(i+1)*.46,3.68+((i+1)%2)*.21,z+dz,.010);
    }
    for(const x of [13.35,16.61,19.68]){
      bar('iron',x,3.90,z,x,C-F,z,.016);
      bar('gunmetal',x,3.67,z-.112,x,3.67,z+.112,.026);
    }
  }
  for(const [j,[x,z]] of [[13.35,-13.60],[19.68,-8.45]].entries()){
    const color=j?0xff659b:0x66d9ff;
    for(const s of [-1,1]){
      bx('gunmetal',x+s*.179,3.54,z,.036,.276,.065);
      bar('brass',x+s*.145,h,z,x+s*.204,h,z,.030);
    }
    const head=new T.Group();head.position.set(x,stand,z);root.add(head);
    const body=new T.Mesh(bodyGeo,metal);head.add(body);
    const glass=new T.Mesh(lensGeo,new T.MeshBasicMaterial({color}));glass.position.y=-.155;head.add(glass);
    const veil=new T.Mesh(cone,new T.ShaderMaterial({uniforms:{ink:{value:new T.Color(color)}},
      vertexShader:`varying vec2 q;varying vec3 norm;varying vec3 eye;void main(){q=uv;vec4 p=modelViewMatrix*vec4(position,1.);eye=-p.xyz;norm=normalMatrix*normal;gl_Position=projectionMatrix*p;}`,
      fragmentShader:`uniform vec3 ink;varying vec2 q;varying vec3 norm;varying vec3 eye;
      void main(){float edge=pow(abs(dot(normalize(norm),normalize(eye))),.63);
      float power=(.032+.15*pow(q.y,1.3))*edge*smoothstep(0.,.24,q.y);
      gl_FragColor=vec4(ink,power);
      #include <colorspace_fragment>
      }`,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
    veil.position.y=-.17;head.add(veil);
    const pool=new T.Mesh(quad,new T.MeshBasicMaterial({map:glow,color,opacity:.39,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
    pool.rotation.x=-pi/2;root.add(pool);
    rig.push({head,veil,pool,x,z});
  }
  for(const [x,z] of [[19.68,-13.60],[13.35,-8.45]]){
    cyl('iron',x,3.59,z,.047,.16);cyl('gunmetal',x,3.39,z,.168,.27);
    for(const dy of [-.085,-.044,0,.045])cyl('gray',x,3.39+dy,z,.178,.012);
    cyl(x>16?'tintedBulb':'cold',x,3.237,z,.147,.035);
  }
  function pose(t){
    for(const [i,s] of rig.entries()){
      const a=t*.22+i*pi,tx=16.61+1.95*Math.sin(a),tz=-11+1.46*Math.sin(a*1.3+i);
      aim.set(tx-s.x,-h+.050,tz-s.z);const l=aim.length();
      s.head.quaternion.setFromUnitVectors(down,aim.normalize());
      s.veil.scale.set(.67,l-.17,.67);
      s.pool.position.set(tx,F+.052+i*.001,tz);s.pool.scale.set(1.73,1.73*l/h,1);
      s.pool.rotation.z=Math.atan2(tx-s.x,tz-s.z);
    }
  }
  // Etched diamonds under smoked glass. One surface, with dark gaps matching
  // the real eight-by-seven tile grid. Don't light the grout or flash the room.
  const dial={value:0},etch=new T.Mesh(new T.PlaneGeometry(6.4,5.81),new T.ShaderMaterial({
    uniforms:{clock:dial},transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float clock;varying vec2 v;
    void main(){vec2 grid=v*vec2(8.,7.),q=fract(grid),p=2.*v-1.;
    vec2 d=min(q,1.-q);float edge=min(d.x,d.y);float aa=clamp(max(fwidth(grid.x),fwidth(grid.y)),.003,.15);
    float mask=smoothstep(.018-aa,.043+aa,edge);
    float r=abs(p.x)*.86+abs(p.y),wave=.5+.5*cos(8.*r-clock*.9);
    float diamond=abs(q.x-.5)+abs(q.y-.5);
    float line=(1.-smoothstep(.009,.027+aa,abs(diamond-.37)))*.036/(.036+aa);
    float border=1.-smoothstep(.046,.082+aa,edge);
    vec3 c=mix(vec3(.19,.78,.76),vec3(.91,.27,.48),smoothstep(-.7,.7,p.x+.2*sin(clock*.19)));
    gl_FragColor=vec4(c,mask*(.035+wave*.085+(.15+.49*wave)*(line*.70+border*.80)));
    #include <colorspace_fragment>
    }`}));
  etch.rotation.x=-pi/2;etch.position.set(16.60,F+.043,-11);etch.renderOrder=1;root.add(etch);
  pose(0);let time=0;
  return dt=>{if(reduced)return;time+=dt;dial.value=time;pose(time);};
}

// Facets reflect a local impression of the amber shelves, blue canopy and
// rose light bars, not the outdoor environment or a constantly rendered cubemap.
export function mirrorSilver(T){
  return new T.ShaderMaterial({vertexColors:true,
    vertexShader:`varying vec3 N;varying vec3 E;varying vec3 tint;
    void main(){vec4 p=modelMatrix*vec4(position,1.);N=mat3(modelMatrix)*normal;E=cameraPosition-p.xyz;tint=color;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`varying vec3 N;varying vec3 E;varying vec3 tint;
    void main(){vec3 r=reflect(-normalize(E),normalize(N));float a=atan(r.z,r.x);
    vec3 c=mix(vec3(.042,.060,.084),vec3(.32,.38,.48),smoothstep(-.2,.9,r.y));
    c+=vec3(.94,.53,.24)*exp(-13.*abs(r.y+.16))*(.35+.65*pow(abs(cos(3.*a)),6.));
    c+=vec3(.25,.80,1.)*pow(max(0.,dot(r,normalize(vec3(-.54,.38,.36)))),14.);
    c+=vec3(1.,.29,.49)*pow(max(0.,dot(r,normalize(vec3(.65,.22,.29)))),19.);
    c+=vec3(1.3)*exp(-28.*abs(r.y-.50))*pow(abs(cos(4.*a)),12.);
    gl_FragColor=vec4(c*mix(vec3(1.),tint,.28),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
}
