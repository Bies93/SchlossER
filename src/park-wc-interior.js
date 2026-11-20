import {architectureKit} from './architecture-kit.js';
import {sharedSet,randomSource} from './surface-detail.js';
import {utilityDoor} from './lab-cell-doors.js';
import {ZONE_ROOMS,ZONE_LINKS,X,Z,p,b,ceiling,lower,wcRoomAt,wcZoneAt,wcLevel,wcRoofAt,wcCameraMode,isRock,isAnnex,isNewHQ,isDeep,deepWalk,upperWcWalk} from './park-wc-layout.js';
import {furnishWashroom} from './park-wc-fixtures.js';
import {furnishCollective,collectiveArt} from './park-wc-collective.js';
import {moosfunkAnnexArt,annexMaterials} from './moosfunk-art.js';
import {furnishPractice} from './moosfunk-practice.js';
import {furnishGreenhouse} from './moosfunk-greenhouse.js';
import {hqArt,hqMaterials} from './moosfunk-hq-art.js';
import {furnishHQ} from './moosfunk-hq.js';
import {furnishWorkshop} from './moosfunk-workshop.js';
import {shopMaterials,shopArt,shopWear} from './moosfunk-shop-finishes.js';
import {deepArt} from './moosfunk-deep-art.js';
import {deepMaterials,DEEP_LIGHTS,buildDeepStair,furnishDeep} from './moosfunk-deep.js';
import {orbPriest} from './orb-priest.js';

export const WC_LAYER=4;
const lampSites=[
  [3.13,.27,0xf0e3cb,8.0,4.3],[3.18,3.55,0xffdcca,12,5.8],[3.18,6.49,0xe8e7cf,9,5.1],
  [5.54,1.59,0xe6eacb,15,5.8],[5.66,6.09,0xe6eaca,17,6.0],
  [8.35,2.30,0xe6e5d0,11,4.9],[8.35,5.36,0xedeee0,13,5.0],
  [10.56,6.79,0xfab477,7,4.5],[13.39,6.1,0xdd9b6a,7.6,4.3],
  [13.66,3.05,0xffd097,15,6.2],[16.58,.39,0xfb965c,23,7.8],
  [18.32,-2.58,0xe8b976,19,6.9],[18.48,2.91,0x92beb4,14,5.3],
  [22.28,-3.23,0xf1c498,21,6.3,'practice',2.00],[26.23,-3.20,0xc0dbe4,23,7.7,'practice',2.02],[31.86,-3.14,0xafc8e0,27,7.8,'practice',2.03],
  [22.05,3.69,0xebca9f,17,6.6],[24.42,3.45,0xd5e8ba,18,6.9],[27.20,4.12,0xcae6c3,18,7.0],[29.81,3.52,0xf7d3a5,18,6.6],
  [16.09,-6.49,0xe9a376,16,5.7],[18.69,-7.55,0xcdc9d0,15,5.7],
  [15.64,6.52,0xb5c9c0,14,6.4],[17.77,10.43,0xd6e1d9,27,6.8,'workshop',2.00],[15.45,9.28,0xf0bb7d,14,5.7,'workshop',1.998],
  [21.80,8.27,0xe4b480,15,5.6],[23.78,10.32,0xffcd8d,19,6.3],[25.86,12.08,0xb99181,13,5.2],
  [30.03,8.46,0xd5dfb8,14,6.1],[31.91,10.29,0xffd29a,21,6.4],[34.35,11.98,0xefdfba,19,6.8],
  ...DEEP_LIGHTS
];
const lightRoom=l=>l[5]??wcRoomAt(l[0],l[1]);
const alongEdge=(u0,u1,v0,v1)=>[['u',u0,v0,v1,-1],['u',u1,v0,v1,1],['v',v0,u0,u1,-1],['v',v1,u0,u1,1]];
const portals=Object.fromEntries(Object.keys(ZONE_ROOMS).map(id=>[id,ZONE_LINKS.filter(([a,b])=>a===id||b===id)]));

export function addWcInterior(T,scene,world,quest){
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
    paper:plain(0xbcaa86),amber:plain(0x895a35,.42,{metalness:.18}),signal:{material:plain(0x9ec569,.73,{emissive:0x779742,emissiveIntensity:.61}),cast:false},
    ...annexMaterials(T,{painted,plaster,cloth}),...hqMaterials(T,{painted,cloth}),...shopMaterials(T),...deepMaterials(T,{painted,stone,cloth,wood})
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
  const partsArt=collectiveArt(T);
  const annexArt=moosfunkAnnexArt(T);
  const hq=hqArt(T);
  const shop=shopArt(T),wear=shopWear(T);
  const atlas=deepArt(T);
  const hemi=new T.HemisphereLight(0xb2c4bd,0x5d503b,.66);group.add(hemi);
  const lights=Array.from({length:3},()=>{const l=new T.PointLight(0xffffff,0,0,2);group.add(l);return l;});
  let orb=null,priest=null;
  for(const [id,bounds] of Object.entries(ZONE_ROOMS)){
    const room=new T.Group();room.name='WC · '+id;group.add(room);layers.set(id,room);
    const k=architectureKit(T,room,materials);
    const deep=isDeep(id),level=wcLevel(id),walk=deep?deepWalk:upperWcWalk;
    const block=(mat,u,U,y,Y,v,V)=>k.box(mat,p,u,U,level+y,level+Y,v,V);
    const hit=(u,U,v,V,when=walk)=>world.box(X-V,Z+u,X-v,Z+U,when);
    const method={
      block,hit,k,room,art:partsArt,
      stamp(mat,g,u,y,v,dimensions,angle=0,pitch=0){
        if(pitch)m.makeRotationFromEuler(new T.Euler(pitch,angle,0,'YXZ'));else m.makeRotationY(angle);
        m.scale(scale.set(...dimensions));m.setPosition(...p(u,level+y,v));k.geometry(mat,g,m);
      },
      pipe(mat,A,B,r){
        tmp.fromArray(p(A[0],level+A[1],A[2]));len.fromArray(p(B[0],level+B[1],B[2])).sub(tmp);
        const L=len.length();if(L<.002)return;
        m.compose(tmp.addScaledVector(len,.5),rot.setFromUnitVectors(up,len.normalize()),scale.set(r,L,r));k.geometry(mat,cyl,m);
      },
      print(tile,u,y,v,w,h,angle=0,options){partsArt.mount(room,tile,...p(u,level+y,v),w,h,angle,options);},
      artTile(tile,u,y,v,w,h,angle=0,pitch=0,roll=0){annexArt.mount(room,tile,p(u,level+y,v),w,h,angle,pitch,roll);},
      hqTile(tile,u,y,v,w,h,angle=0,pitch=0,roll=0){return hq.mount(room,tile,p(u,level+y,v),w,h,angle,pitch,roll);},
      shopTile(tile,u,y,v,w,h,angle=0,pitch=0,roll=0){shop.mount(room,tile,p(u,level+y,v),w,h,angle,pitch,roll);},
      wear(u,v,w,h,kind,angle){wear(room,p(u,level+.007,v),w,h,kind,angle);},
      deepTile(tile,u,y,v,w,h,angle=0,pitch=0,roll=0){return atlas.mount(room,tile,p(u,level+y,v),w,h,angle,pitch,roll);}
    };
    if(id==='deepStair'){buildDeepStair(T,method);k.flush('Moosfunk · Abstieg');continue;}
    const [u0,u1,v0,v1]=bounds,rock=isRock(id),extra=isAnnex(id),va=id==='landing'?v0+.0028:v0;
    block('grout',u0,u1,-.094,-.024,va,v1);
    const shopFloor=id==='workshop'||id==='practice';
    const pitch=deep?.79:shopFloor?.79:rock?.67:.34,gap=rock?.006:.0065,rand=randomSource(1566+id.charCodeAt(0));
    for(let u=u0,i=0;u<u1-.020;u+=pitch,i++){
      for(let v=va,j=0;v<v1-.02;v+=pitch,j++){
        const mat=deep?(rand()<.26?'deepSlateDark':'deepSlate'):shopFloor?(id==='practice'||rand()<.16?'mfSlate':'mfFloor'):rock?(rand()<.32?'rockShade':'rock'):['floorA','floorA','floorB','floorC'][(i*31+j*7+i*j)%4];
        block(mat,u+gap,Math.min(u1,u+pitch)-gap,-.025,0,v+gap,Math.min(v1,v+pitch)-gap);
      }
    }
    if(rock){
      const nu=id==='tunnel'?3:24,nv=id==='tunnel'||extra?22:Math.max(8,Math.ceil((v1-v0)*2.5));
      relief(k,deep?'deepRock':'rockShade',nu,nv,(i,j)=>{
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
      const opens=portals[id].filter(l=>l[2]===axis&&l[3]===at).sort((a,b)=>a[4]-b[4]);
      if(id==='landing'&&axis==='v'&&at===0)continue;
      const wall=(l,r)=>{
        if(rock){
          const cap=deep?level+3.36:extra?-.024:-.12;
          skin(deep?'deepRockBase':'rockShade',l,r,level-.027,cap);
          const steps=Math.max(1,Math.ceil((r-l)/.59));
          const height=[level-.02,level+.41,level+.88,level+1.36,level+1.80,deep?level+2.46:-.54,cap+.014];
          relief(k,deep?'deepRock':'rock',steps,height.length-1,(i,j)=>{
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
        const threshold=isRock(id)||isRock(next),top=level+(deep?2.21:threshold?1.91:spec?.[0]?.endsWith('-a')||spec?.[0]?.endsWith('-b')?1.945:2.067);
        const areWeStalls=id==='men'||id==='women';
        const trim=deep?'deepEdge':threshold?'rockWarm':spec?'green':'trim';
        solid(deep?'deepRock':threshold?'rock':'tile',l,r,top+.043,deep?level+3.39:isAnnex(next)?-.025:threshold?-.128:ceiling+.048,-.066,.066);
        for(const s of [l,r])solid(trim,s-.036,s+.036,level,top+.052,-.082,.082);
        solid(trim,l-.037,r+.037,top-.006,top+.056,-.082,.082);
        if(spec){
          // Reverse the secret cubicle's handing: the leaf parks against
          // the empty flank, while the porcelain stays on the opposite side.
          const [key,label]=spec,acoustic=key==='mf-studio-door',hingeAtEnd=key==='wc-men-b',hinge=hingeAtEnd?r-.042:l+.042;
          const [x,,z]=axis==='u'?p(at,level,hinge):p(hinge,level,at);
          const d=utilityDoor(T,room,world,materials,x,z,r-l-.084,
            {id:key,label,floor:level,lower:y=>walk({y}),cubicle:areWeStalls,hingeAtEnd,acoustic,ritual:key==='mf-orb-door'});
          d.zones=[owner,next];d.peek=areWeStalls;doors.push(d);activeLinks.set(L,d);
          if(hingeAtEnd)solid('steel',l+.034,l+.051,level+.933,level+1.097,-.05,.05);
          else solid('steel',r-.051,r-.034,level+.933,level+1.097,-.05,.05);
        }
      }
      if(start<max)wall(start,max);
    }
    for(const site of lampSites){
      const [u,v]=site;if(deep||lightRoom(site)!==id||shopFloor&&site[6]!==undefined)continue;
      const top=wcRoofAt(id,u,v)-b-.018;
      block('iron',u-.25,u+.25,top-.099,top,v-.104,v+.104);
      block('edge',u-.224,u+.224,top-.116,top-.097,v-.081,v+.081);
      const tube=id==='greenhouse'?'growLamp':id==='studio'?'studioLamp':id==='workshop'?'workLamp':'lamp';
      for(const shift of [-.043,.043])method.pipe(tube,[u-.195,top-.121,v+shift],[u+.195,top-.121,v+shift],.024);
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
    if(id==='practice')furnishPractice(T,method);
    else if(id==='greenhouse')furnishGreenhouse(T,method);
    else if(id==='workshop')furnishWorkshop(T,method,quest);
    else if(isNewHQ(id))furnishHQ(T,method,id);
    else if(deep)orb=furnishDeep(T,method,id)??orb;
    else if(rock)furnishCollective(T,method,id);
    if(id==='deepVotive')priest=orbPriest(T,room,method.hit);
    if(id==='collective'){
      method.block('darkWood',11.212,11.248,1.96,2.19,-1.008,.346);
      method.deepTile('entry',11.251,2.075,-.331,1.29,.19,0);
    }
    if(id==='collective')for(const [tile,v] of [['rangeSign',-3.145],['growSign',3.21]]){
      // Hang labels over the portal, clear of the wood behind the banner.
      method.block('darkWood',19.86,20.06,1.916,2.102,v-.52,v+.52);
      method.artTile(tile,19.853,2.010,v,1,.161,Math.PI);
    }
    const labels={collective:[['studioSign',17.69,-4.062,-Math.PI/2],['workSign',15.38,4.669,Math.PI/2]],
      greenhouse:[['kitchenSign',29.43,6.503,Math.PI/2]],workshop:[['plenumSign',19.978,8.27,Math.PI]],
      plenum:[['kitchenSign',27.85,10.97,Math.PI]],kitchen:[['plenumSign',28.13,10.97,0]]};
    for(const [tile,u,v,angle] of labels[id]??[]){
      const du=Math.cos(angle),dv=-Math.sin(angle),w=Math.abs(dv)*1.18+Math.abs(du)*.100,d=Math.abs(du)*1.18+Math.abs(dv)*.100;
      const U=u-du*.058,V=v-dv*.058;
      method.block('darkWood',U-w/2,U+w/2,1.930,2.091,V-d/2,V+d/2);
      method.hqTile(tile,u,2.006,v,1.13,.135,angle);
    }
    k.flush('WC · '+id);
  }
  cyl.dispose();
  group.traverse(o=>{o.layers.set(WC_LAYER);if(o.isMesh)o.castShadow=false});
  let prev='',lastU=Infinity,lastV=Infinity,prep;
  function update(dt,pos){
    const state=wcCameraMode(pos),u=pos.z-Z,v=X-pos.x,id=state==='surface'?null:wcZoneAt(u,v,pos.y)??'landing';
    let changed=group.visible!==!!id;group.visible=!!id;
    if(!id){prev='';return changed;}
    for(const d of doors)changed=d.update(dt,pos)||changed;
    const pulsing=dt>0&&orb&&layers.get('deepOrb').visible&&(id==='deepOrb'||id==='deepVotive'||id==='deepLounge'&&u<-9.8);
    if(pulsing)orb(dt);
    const acting=dt>0&&(id==='deepVotive'||id==='deepOrb'&&layers.get('deepVotive').visible)&&priest?.update(dt,pos);
    if(id===prev&&Math.hypot(u-lastU,v-lastV)<.18&&!changed)return Boolean(pulsing||acting);
    prev=id;lastU=u;lastV=v;
    const visible=new Set([id]),tau=2*Math.PI;
    // Intersect doorway sight arcs along a path instead of drawing the whole
    // loop of rooms. Direct neighbours still render before the threshold.
    function arc([,,axis,edge,a,b]){
      const U=axis==='u'?edge:u,V=axis==='v'?edge:v,t=axis==='u'?v:u;
      if(Math.abs(axis==='u'?U-u:V-v)<.22&&t>a-.20&&t<b+.20)return null;
      const A=axis==='u'?Math.atan2(a-v,U-u):Math.atan2(V-v,a-u);
      const B=axis==='u'?Math.atan2(b-v,U-u):Math.atan2(V-v,b-u);
      const centre=axis==='u'?Math.atan2((a+b)/2-v,U-u):Math.atan2(V-v,(a+b)/2-u);
      const rel=angle=>Math.atan2(Math.sin(angle-centre),Math.cos(angle-centre));
      return [centre+Math.min(rel(A),rel(B))-.11,centre+Math.max(rel(A),rel(B))+.11];
    }
    function sight(room,visits,wedge,depth){
      if(depth===0)return;
      for(const l of portals[room]){
        const other=l[0]===room?l[1]:l[0];
        if(visits.includes(other))continue;
        const span=arc(l);
        let next=span??wedge;
        if(span&&wedge){
          next=null;
          for(const s of [-tau,0,tau]){
            const lo=Math.max(wedge[0],span[0]+s),hi=Math.min(wedge[1],span[1]+s);
            if(lo<=hi){next=[lo,hi];break;}
          }
          if(!next)continue;
        }
        const leaf=activeLinks.get(l);
        if(leaf&&leaf.progress<=.01){
          // The leaf and frame belong to the approach room. Keep that
          // owner visible from the inside even when the door is shut.
          if(l[1]===room)visible.add(l[0]);
          if(leaf.peek)visible.add(other);
          continue;
        }
        visible.add(other);
        sight(other,[...visits,other],next,depth-1);
      }
    }
    const reach=id==='men'||id==='menB'||isRock(id)?3:2;
    sight(id,[id],null,reach);
    for(const [key,room] of layers){changed||=room.visible!==visible.has(key);room.visible=visible.has(key);}
    const near=lampSites.filter(l=>visible.has(lightRoom(l))).map(l=>{
      const key=lightRoom(l),bias=key!==id&&(isAnnex(key)||isAnnex(id)||isDeep(key)||isDeep(id))
        ?id==='collective'&&key==='deepStair'&&u<12.5?.45:2.6:0;
      return [l,Math.hypot(l[0]-u,l[1]-v)+bias];
    }).sort((a,b)=>a[1]-b[1]);
    if(id==='deepLounge'&&u>-9.7){
      // One of the same three slots holds the far door readable when the
      // two near tasks lights are the only lights illuminating the bays.
      const beacon=near.findIndex(([l])=>l[0]===-13.64&&lightRoom(l)===id);
      if(beacon>=3)near.splice(2,0,near.splice(beacon,1)[0]);
    }
    if(id==='deepOrb'){
      // Keep the reredos and the orb legible together, even from the door.
      for(const [slot,U] of [[0,-19.64],[1,-24.55]]){
        const i=near.findIndex(([l])=>lightRoom(l)===id&&l[0]===U);
        if(i>=0)near.splice(slot,0,near.splice(i,1)[0]);
      }
    }
    for(let i=0;i<lights.length;i++){
      const l=lights[i],src=near[i]?.[0];if(!src){l.intensity=0;continue}
      const [u,v,color,watts,distance,,height]=src,key=lightRoom(src);
      l.position.set(...p(u,height===undefined?wcRoofAt(key,u,v)-.33:wcLevel(key)+height,v));l.intensity=watts;l.color.setHex(color);l.distance=distance;
    }
    hemi.intensity=id==='deepVotive'?.32:id==='deepOrb'?.40:id==='deepLounge'?.70:.66;
    return changed||Boolean(pulsing||acting);
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
  return {prepare:(renderer,source)=>prep??=warm(renderer,source),update,priestAck:()=>priest?.use(),
    target(pos,look){
      if(!lower(pos.y))return null;
      const key=wcZoneAt(pos.z-Z,X-pos.x,pos.y);let found=null,best=-Infinity;
      if(key==='deepVotive')return priest?.target(pos,look)??null;
      for(const d of doors)if(d.zones.includes(key)){const score=d.aim(pos,look);if(score>best){found=d;best=score;}}
      return found;
    }
  };
}
