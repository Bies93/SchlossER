// The threshold is a single shallow walk surface, with the same paving UV
// as the square and the same limestone-gravel maps as the park.
export function addGateApproaches(T,root,routes,grit,pavers,height){
  const material=pavers.clone();
  material.side=T.DoubleSide;material.vertexColors=false;
  material.onBeforeCompile=sh=>{
    sh.uniforms.entryGrit={value:grit.map};sh.uniforms.entryGritNormal={value:grit.normalMap};
    sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
      attribute float edgeBlend;varying float entryBlend;varying vec2 entryWorld;
    `).replace('#include <begin_vertex>',`#include <begin_vertex>
      entryBlend=edgeBlend;entryWorld=(modelMatrix*vec4(position,1.)).xz;
    `);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      uniform sampler2D entryGrit,entryGritNormal;
      varying float entryBlend;varying vec2 entryWorld;
    `).replace('#include <map_fragment>',`#include <map_fragment>
      vec2 grainUV=entryWorld*vec2(1.,-1.)/.93;
      vec3 loose=texture2D(entryGrit,grainUV).rgb;
      float grade=smoothstep(.10,.91,entryBlend+(loose.r-.45)*.19);
      diffuseColor.rgb=mix(diffuseColor.rgb,loose*vec3(.99,.96,.94),grade);
    `).replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replace(
      'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
      'vec3 mapN=mix(texture2D(normalMap,vNormalMapUv).xyz,texture2D(entryGritNormal,grainUV).xyz,grade)*2.0-1.0;'
    ));
  };
  material.customProgramCacheKey=()=>'plaza-parkgate-joint-v1';
  const floors=[],sections=[];
  for(const {path,width,gate} of routes){
    const start=path.vertices[0].z,join=-17,length=start-join,n=Math.ceil(length/.36),p=[],uv=[],mix=[],ix=[];
    const gateZ=gate.a[1],r=width*.5,vertices=path.vertices;
    const across=[-1,-.82,-.60,0,.60,.82,1];
    function centerAt(z){
      for(let i=1;i<vertices.length;i++){
        const a=vertices[i-1],b=vertices[i];
        if(z>=b.z&&z<=a.z)return a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);
      }
      return vertices[0].x;
    }
    const isSide=gateZ<-10;
    for(let i=0;i<=n;i++){
      const z=start-length*i/n,c=centerAt(z),end=T.MathUtils.smoothstep(z,join,-14.8);
      const apron=T.MathUtils.smoothstep(gateZ-z,isSide?-1.05:-.26,isSide?1.3:2.16);
      const full=T.MathUtils.lerp(r+.33,r+.12,i/n),centerY=T.MathUtils.lerp(height(c,join),-.035,end);
      for(const [j,d] of across.entries()){
        const x=c+d*full,edge=1-T.MathUtils.smoothstep(Math.abs(d),.71,1.0);
        const y=centerY-T.MathUtils.smoothstep(Math.abs(d),.22,1)*.007*end;
        p.push(x,y,z);uv.push(x/6,-z/6);mix.push(apron*edge);
        if(i&&j){
          const k=i*across.length+j;ix.push(k-across.length-1,k-across.length,k,k-across.length-1,k,k-1);
        }
      }
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('edgeBlend',new T.Float32BufferAttribute(mix,1));g.setIndex(ix);g.computeVertexNormals();
    const mesh=new T.Mesh(g,material);mesh.name='Pflaster und Kies · '+gate.name;mesh.receiveShadow=true;
    floors.push(mesh);root.add(mesh);sections.push({start,join,centerAt,r,gateZ});
  }
  return {floors,surfaceAt:(x,z)=>sections.some(a=>z>=a.join&&z<a.start&&z<a.gateZ-.6&&Math.abs(x-a.centerAt(z))<a.r)?'gravel':null};
}
