import {architectureKit} from './architecture-kit.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {utilityDoor} from './lab-cell-doors.js';
import {ROOMS,LINKS,X,Z,p,b,ceiling,lower,wcRoomAt,wcRoofAt,wcCameraMode,isRock} from './park-wc-layout.js';
import {furnishWashroom} from './park-wc-fixtures.js';
import {furnishCollective,collectiveArt} from './park-wc-collective.js';

export const WC_LAYER=4;
const halfPi=Math.PI/2;
const lampSites=[
  [3.13,.27,0xf0e3cb,8.0,4.3],[3.18,3.55,0xffdcca,12,5.8],[3.18,6.49,0xe8e7cf,9,5.1],
  [5.54,1.59,0xe6eacb,15,5.8],[5.66,6.09,0xe6eaca,17,6.0],
  [8.35,2.30,0xe6e5d0,11,4.9],[8.35,5.36,0xedeee0,13,5.0],
  [10.56,6.79,0xfab477,7,4.5],[13.39,6.1,0xdd9b6a,7.6,4.3],
  [13.66,3.05,0xffd097,15,6.2],[16.58,.39,0xfb965c,23,7.8],
  [18.32,-2.58,0xe8b976,19,6.9],[18.48,2.91,0x92beb4,14,5.3]
];
const alongEdge=(u0,u1,v0,v1)=>[['u',u0,v0,v1,-1],['u',u1,v0,v1,1],['v',v0,u0,u1,-1],['v',v1,u0,u1,1]];

export function addWcInterior(T,scene,world){
  const group=new T.Group();group.name='WC · Untergeschosse und Moosfunk';group.visible=false;scene.add(group);
  const layers=new Map(),doors=[],activeLinks=new Map();
  const plain=(color,roughness=.86,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const painted=sharedSet(T,'enamel',256),stone=sharedSet(T,'bedrock',256),plaster=sharedSet(T,'plaster',256),
    cloth=sharedSet(T,'canvas',128),wood=sharedSet(T,'fineOak',256);
  const materials={
    paint:plain(0xb6b3a2,.93,{...plaster,normalScale:new T.Vector2(.28,.28)}),
    tile:plain(0xd2d2bd,.74,{...sharedSet(T,'labTile',256),normalScale:new T.Vector2(.28,.28)}),
    grout:plain(0x575a52),dark:plain(0x242923),gasket:plain(0x30342b,.98),sea:plain(0x566758),trim:plain(0xa4a995,.78),
    floorA:plain(0x85887a,.88,plaster),floorB:plain(0x979789,.85,plaster),floorC:plain(0x757c70,.92,plaster),
    rock:plain(0x807968,.98,stone),rockShade:plain(0x6e695c,.97,stone),rockWarm:plain(0x948471,.96,stone),cap:plain(0x736956,.93,stone),
    iron:plain(0x303935,.77,{metalness:.25}),gunmetal:plain(0x495550,.75,painted),
    tunnelMetal:plain(0x645c50,.86,{...painted,metalness:.31}),oxide:plain(0x785244,.89,painted),
    green:plain(0x62776a,.91,painted),edge:plain(0x889788,.65,painted),brass:plain(0xa89968,.57,{metalness:.51}),
    steel:plain(0x87908e,.36,{metalness:.63}),glass:plain(0x566e6b,.26,{metalness:.5,envMapIntensity:.46}),
    china:plain(0xdadbd1,.32),chinaPocket:plain(0xbfc3b6,.34),water:plain(0x667975,.32,{metalness:.15}),
    lamp:{material:plain(0xf7eac3,.69,{emissive:0xffd297,emissiveIntensity:.61}),cast:false},
    wood:plain(0xb29065,.78,wood),darkWood:plain(0x8a664e,.88,wood),ochre:plain(0xb68245,.86,painted),
    red:plain(0x88554a,.91,painted),linen:plain(0xb2a27c,.97,cloth),fabric:plain(0x5c6a54,.92,cloth),rug:plain(0x805745,1,cloth),
    paper:plain(0xbcaa86),amber:plain(0x895a35,.42,{metalness:.18}),signal:{material:plain(0x9ec569,.73,{emissive:0x779742,emissiveIntensity:.61}),cast:false}
  };
  const cyl=new T.CylinderGeometry(1,1,1,12),identity=new T.Matrix4(),m=new T.Matrix4(),tmp=new T.Vector3(),len=new T.Vector3(),up=new T.Vector3(0,1,0),scale=new T.Vector3(),rot=new T.Quaternion();
  // Keep continuous normals across a rock panel; the triangulation should
  // not print through the texture and turn the tight bend into sawteeth.
  function relief(kit,material,nu,nv,point,reverse=false){
    const positions=[],uv=[],index=[],row=nv+1;
    for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
      const [pos,s,t]=point(i,j);positions.push(...pos);uv.push(s,t);
      if(i<nu&&j<nv){
        const a=i*row+j,B=a+row,c=B+1,d=a+1;
        index.push(...(reverse?[a,c,B,a,d,c]:[a,B,c,a,c,d]));
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
    kit.geometry(material,geo,identity);geo.dispose();
  }
  const toHit=(u,U,v,V)=>world.box(X-V,Z+u,X-v,Z+U,o=>lower(o.y));
  const partsArt=collectiveArt(T);
  const hemi=new T.HemisphereLight(0xb2c4bd,0x5d503b,.66);group.add(hemi);
  const lights=Array.from({length:3},()=>{const l=new T.PointLight(0xffffff,0,0,2);group.add(l);return l;});
  for(const [id,bounds] of Object.entries(ROOMS)){
    const room=new T.Group();room.name='WC · '+id;group.add(room);layers.set(id,room);
    const k=architectureKit(T,room,materials);
    const block=(mat,u,U,y,Y,v,V)=>k.box(mat,p,u,U,b+y,b+Y,v,V);
    const hit=toHit;
    const method={
      block,hit,k,room,art:partsArt,
      stamp(mat,g,u,y,v,dimensions,angle=0){
        m.makeRotationY(angle).scale(scale.set(...dimensions));m.setPosition(...p(u,b+y,v));k.geometry(mat,g,m);
      },
      pipe(mat,A,B,r){
        tmp.fromArray(p(A[0],b+A[1],A[2]));len.fromArray(p(B[0],b+B[1],B[2])).sub(tmp);
        const L=len.length();if(L<.002)return;
        m.compose(tmp.addScaledVector(len,.5),rot.setFromUnitVectors(up,len.normalize()),scale.set(r,L,r));k.geometry(mat,cyl,m);
      },
      print(tile,u,y,v,w,h,angle=0,options){partsArt.mount(room,tile,...p(u,b+y,v),w,h,angle,options);}
    };
    const [u0,u1,v0,v1]=bounds,rock=isRock(id),va=id==='landing'?v0+.0028:v0;
    block('grout',u0,u1,-.094,-.024,va,v1);
    const pitch=rock?.67:.34,gap=rock?.006:.0065,rand=randomSource(1566+id.charCodeAt(0));
    for(let u=u0,i=0;u<u1-.020;u+=pitch,i++){
      for(let v=va,j=0;v<v1-.02;v+=pitch,j++){
        const mat=rock?(rand()<.32?'rockShade':'rock'):['floorA','floorA','floorB','floorC'][(i*31+j*7+i*j)%4];
        block(mat,u+gap,Math.min(u1,u+pitch)-gap,-.025,0,v+gap,Math.min(v1,v+pitch)-gap);
      }
    }
    if(rock){
      const nu=id==='tunnel'?3:24,nv=id==='tunnel'?20:Math.max(8,Math.ceil((v1-v0)*2.5));
      relief(k,'rockShade',nu,nv,(i,j)=>{
        const u=u0+(u1-u0)*i/nu,v=v0+(v1-v0)*j/nv;
        const seam=Math.sin(i/nu*Math.PI)*Math.sin(j/nv*Math.PI)*Math.sin(i*.71+j*.59)*.047;
        return [p(u,wcRoofAt(id,u,v)+seam,v),u*.79,v*.79];
      });
    }else block('paint',u0,u1,ceiling-b,ceiling-b+.12,v0,v1);
    for(const [axis,at,min,max,sign] of alongEdge(...bounds)){
      const map=axis==='u'?(sign>0?(s,y,d)=>p(at+d,y,-s):(s,y,d)=>p(at-d,y,s)):
        (sign>0?(s,y,d)=>p(s,y,at+d):(s,y,d)=>p(-s,y,at-d));
      const orient=axis==='u'?-sign:sign;
      const inward=(a,y,d)=>map(a*orient,y,d);
      function skin(mat,l,r,y,Y,d=0){
        if(r-l<.002)return;
        const a=orient>0?r:l,c=orient>0?l:r;
        const A=inward(a,y,d),B=inward(c,y,d),D=inward(a,Y,d),C=inward(c,Y,d),s=rock?1.29:1.42;
        k.triangle(mat,A,B,C,[a/s,y/s,c/s,y/s,c/s,Y/s]);k.triangle(mat,A,C,D,[a/s,y/s,c/s,Y/s,a/s,Y/s]);
      }
      function solid(mat,l,r,y,Y,d0,d1){
        k.box(mat,map,orient>0?l:-r,orient>0?r:-l,y,Y,d0,d1);
      }
      function fixed(l,r){
        if(r-l<.002)return;
        if(axis==='u')hit(Math.min(at,at+sign*.095),Math.max(at,at+sign*.095),l,r);
        else hit(l,r,Math.min(at,at+sign*.095),Math.max(at,at+sign*.095));
      }
      const opens=LINKS.filter(l=>(l[0]===id||l[1]===id)&&l[2]===axis&&l[3]===at).sort((a,b)=>a[4]-b[4]);
      if(id==='landing'&&axis==='v'&&at===0)continue;
      const wall=(l,r)=>{
        if(rock){
          skin('rockShade',l,r,b-.027,-.12);
          const steps=Math.max(1,Math.ceil((r-l)/.59));
          const height=[b-.02,b+.41,b+.88,b+1.36,b+1.80,-.54,-.106];
          relief(k,'rock',steps,height.length-1,(i,j)=>{
            const edge=i===0||i===steps,mid=j>0&&j<height.length-1;
            const u=l+(r-l)*i/steps+(edge?0:Math.sin(i*2.86+j*1.83)*.065);
            const h=height[j]+(mid&&!edge?Math.cos(i*2.12+j*3.43)*.058:0);
            // Flat ends protect the portal margins and meet the sealed wall.
            const d=edge?-.009:-(.035+(.5+.5*Math.cos(i*1.38+j*2.13))*(id==='collective'?.082:.058));
            return [inward(u,h,d),u*.83,h*.83];
          },orient>0);
        }else{
          skin('tile',l,r,b-.025,b+1.402);
          skin(id==='lobby'||id==='landing'?'paint':'tile',l,r,b+1.449,ceiling+.023);
          skin('sea',l,r,b+1.402,b+1.449,-.004);
          skin('trim',l,r,b+.021,b+.087,-.007);
        }
        fixed(l,r);
      };
      let start=min;
      for(const L of opens){
        const [owner,next,,,l,r,spec]=L;if(l>start)wall(start,l);
        start=r;
        if(owner!==id)continue;
        const threshold=isRock(id)||isRock(next),top=b+(threshold?1.91:spec?.[0]?.endsWith('-a')||spec?.[0]?.endsWith('-b')?1.945:2.067);
        const areWeStalls=id==='men'||id==='women';
        const trim=threshold?'rockWarm':spec?'green':'trim';
        solid(threshold?'rock':'tile',l,r,top+.043,threshold?-.128:ceiling+.048,-.066,.066);
        for(const s of [l,r])solid(trim,s-.036,s+.036,b,top+.052,-.082,.082);
        solid(trim,l-.037,r+.037,top-.006,top+.056,-.082,.082);
        if(spec){
          // Reverse the secret cubicle's handing: the leaf parks against
          // the empty flank, while the porcelain stays on the opposite side.
          const [key,label]=spec,hingeAtEnd=key==='wc-men-b',hinge=hingeAtEnd?r-.042:l+.042,[x,,z]=p(at,b,hinge);
          const d=utilityDoor(T,room,world,materials,x,z,r-l-.084,
            {id:key,label,floor:b,lower,cubicle:areWeStalls,hingeAtEnd});
          d.zones=[owner,next];d.peek=areWeStalls;doors.push(d);activeLinks.set(L,d);
          if(hingeAtEnd)solid('steel',l+.034,l+.051,b+.933,b+1.097,-.05,.05);
          else solid('steel',r-.051,r-.034,b+.933,b+1.097,-.05,.05);
        }
      }
      if(start<max)wall(start,max);
    }
    for(const [u,v] of [[3.13,.23],[3.18,3.55],[3.18,6.49],[5.54,1.59],[5.66,6.09],[8.35,2.3],[8.35,5.36],[10.56,6.79],[13.39,6.1],[13.66,3.05],[16.58,.39],[18.32,-2.58],[18.48,2.91]]){
      if(wcRoomAt(u,v)!==id)continue;
      const top=wcRoofAt(id,u,v)-b-.018;
      block('iron',u-.25,u+.25,top-.099,top,v-.104,v+.104);
      block('edge',u-.224,u+.224,top-.116,top-.097,v-.081,v+.081);
      for(const shift of [-.043,.043])method.pipe('lamp',[u-.195,top-.121,v+shift],[u+.195,top-.121,v+shift],.024);
      for(const d of [-.204,0,.204])method.pipe('iron',[u+d,top-.152,v-.095],[u+d,top-.152,v+.095],.009);
    }
    if(id==='lobby'){
      for(const [id,v] of [['women',2.89],['men',4.73]]){
        block('gunmetal',4.099,4.139,2.092,2.238,v-.339,v+.339);
        method.print(id,4.096,2.165,v,.647,.128,Math.PI);
      }
      method.print('keep',2.273,1.49,5.79,.53,.335,0);
    }
    if(['women','men','womenA','womenB','menA','menB'].includes(id))furnishWashroom(T,method,id);
    if(rock)furnishCollective(T,method,id);
    k.flush('WC · '+id);
  }
  cyl.dispose();
  group.traverse(o=>{o.layers.set(WC_LAYER);if(o.isMesh)o.castShadow=false});
  let prev='',lastU=Infinity,lastV=Infinity,prep;
  function update(dt,pos){
    const state=wcCameraMode(pos),u=pos.z-Z,v=X-pos.x,id=state==='surface'?null:wcRoomAt(u,v)??'landing';
    let changed=group.visible!==!!id;group.visible=!!id;
    if(!id){prev='';return changed;}
    for(const d of doors)changed=d.update(dt,pos)||changed;
    if(id===prev&&Math.hypot(u-lastU,v-lastV)<.18&&!changed)return false;
    prev=id;lastU=u;lastV=v;
    const visible=new Set([id]),traversed=new Set([id]);let wave=[id];
    // Through the opened cubicle, the illuminated turn must already be
    // present. A closed door only exposes its owner and any cubicle gaps.
    const reach=id==='men'||id==='menB'||isRock(id)?3:2;
    for(let depth=0;depth<reach;depth++){
      const next=[];
      for(const room of wave)for(const l of LINKS){
        if(l[0]!==room&&l[1]!==room)continue;
        const leaf=activeLinks.get(l);
        if(leaf&&leaf.progress<=.01){
          // The leaf and frame belong to the approach room. Keep that
          // owner visible from the inside even when the door is shut.
          if(l[1]===room)visible.add(l[0]);
          if(leaf.peek)visible.add(l[0]===room?l[1]:l[0]);
          continue;
        }
        const other=l[0]===room?l[1]:l[0];visible.add(other);
        if(!traversed.has(other)){traversed.add(other);next.push(other);}
      }
      wave=next;
    }
    for(const [key,room] of layers){changed||=room.visible!==visible.has(key);room.visible=visible.has(key);}
    const near=lampSites.filter(([u,v])=>visible.has(wcRoomAt(u,v))).map(l=>[l,Math.hypot(l[0]-u,l[1]-v)]).sort((a,b)=>a[1]-b[1]);
    for(let i=0;i<lights.length;i++){
      const l=lights[i],src=near[i]?.[0];if(!src){l.intensity=0;continue}
      const [u,v,color,watts,distance]=src,key=wcRoomAt(u,v);
      l.position.set(...p(u,wcRoofAt(key,u,v)-.33,v));l.intensity=watts;l.color.setHex(color);l.distance=distance;
    }
    return changed;
  }
  async function warm(renderer,source){
    const staging=new T.Scene(),camera=new T.PerspectiveCamera(67,1,.08,120);
    staging.environment=source.environment;staging.environmentIntensity=source.environmentIntensity;
    staging.environmentRotation.copy(source.environmentRotation);staging.fog=source.fog;
    camera.layers.set(WC_LAYER);camera.position.set(...p(13.37,b+1.67,3.91));camera.lookAt(...p(17.08,b+1.35,.44));
    const viewport=renderer.getViewport(new T.Vector4()),clip=renderer.getScissor(new T.Vector4()),test=renderer.getScissorTest(),shadow=renderer.shadowMap.needsUpdate;
    const objects=[];
    group.visible=true;staging.add(group);
    group.traverse(o=>{if(o.isMesh){objects.push([o,o.frustumCulled]);o.frustumCulled=false}});
    try{
      await renderer.compileAsync(staging,camera);
      renderer.setViewport(0,0,38,38);renderer.setScissor(0,0,38,38);renderer.setScissorTest(true);renderer.render(staging,camera);
    }finally{
      for(const [o,culled] of objects)o.frustumCulled=culled;
      scene.add(group);group.visible=false;
      renderer.setViewport(viewport);renderer.setScissor(clip);renderer.setScissorTest(test);renderer.shadowMap.needsUpdate=shadow;
    }
  }
  return {prepare:(renderer,source)=>prep??=warm(renderer,source),update,
    target(pos,look){
      if(!lower(pos.y))return null;
      const key=wcRoomAt(pos.z-Z,X-pos.x);let found=null,best=-Infinity;
      for(const d of doors)if(d.zones.includes(key)){const score=d.aim(pos,look);if(score>best){found=d;best=score;}}
      return found;
    }
  };
}
