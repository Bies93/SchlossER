import {architectureKit} from './architecture-kit.js';
import {ageMasonry,sharedSet} from './surface-detail.js';

// Public exteriors, simplified to fit the compressed garden. Bounds are also
// exclusions for the generic town and the outer tree screen.
const KONK={x0:61,x1:85,z0:-71,z1:-25};
const KOLLEG={x0:69,x1:94,z0:-139,z1:-86};
const ANATOMY={x0:51,x1:91,z0:-257,z1:-230};
const BOTANY={x0:-100,x1:-81,z0:-154,z1:-92};
const context=[KONK,KOLLEG,ANATOMY,BOTANY];
export function parkFacadeClearance(x,z,pad=0){
  return context.some(o=>x>=o.x0-pad&&x<=o.x1+pad&&z>=o.z0-pad&&z<=o.z1+pad);
}

export function addParkArchitecture(T,scene,world,finish){
  const group=new T.Group();group.name='Schlossgarten · Universitätsbauten und Parkrand';scene.add(group);
  const mineral=(id,color,exposure)=>{
    const m=finish(id).clone();m.color.setHex(color);m.vertexColors=false;ageMasonry(m,exposure,.62);return m;
  };
  const plain=(color,roughness=.92)=>new T.MeshStandardMaterial({color,roughness});
  const plaster=plain(0xd8c6a4);
  Object.assign(plaster,sharedSet(T,'plaster',512));plaster.normalScale.setScalar(.28);ageMasonry(plaster,.31);
  const slate=finish('ROOF_DARK').clone();
  slate.vertexColors=false;slate.color.setHex(0x8b9eae);slate.side=T.DoubleSide;
  const glass=new T.MeshPhysicalMaterial({color:0x2d3b3d,roughness:.36,ior:1.47,envMapIntensity:.70});
  const mistGlass=new T.MeshPhysicalMaterial({color:0x778f83,roughness:.31,ior:1.47,envMapIntensity:.85,side:T.DoubleSide});
  const iron=plain(0x4a5552,.49);iron.metalness=.40;
  const materials={
    stone:mineral('SANDSTONE',0xc2b998,.30), trim:mineral('SANDSTONE_CUT',0xd7cbb0,.21),
    base:mineral('SANDSTONE_DARK',0x8d8779,.35),plaster,slate,iron,
    joint:plain(0x827c6b),shutter:plain(0x49473f),warmFrame:plain(0x645446),copper:plain(0x53716c),dark:plain(0x242c28),
    glass:{material:glass,cast:false},mistGlass:{material:mistGlass,cast:false}
  };
  const column=new T.CylinderGeometry(.24,.28,1,12);
  const knob=new T.SphereGeometry(1,10,7);
  const matrix=new T.Matrix4(),zero=new T.Quaternion();
  const line=(x,z,angle=0)=>{
    const c=Math.cos(angle),s=Math.sin(angle);
    return (u,y,v)=>[x+c*u-s*v,y,z+s*u+c*v];
  };
  function building(name,create){
    const g=new T.Group();g.name=name;group.add(g);
    const kit=architectureKit(T,g,materials),{box,quad,triangle,geometry}=kit;
    const bar=(m,p,x,y,xx,yy,width,d0,d1)=>{
      const dx=xx-x,dy=yy-y,L=Math.hypot(dx,dy),c=dx/L,s=dy/L;
      box(m,(u,v,d)=>p(x+u*c-v*s,y+u*s+v*c,d),0,L,-width*.5,width*.5,d0,d1);
    };
    const mass=(m,geo,p,u,y,d,sx,sy,sz)=>geometry(m,geo,matrix.compose(new T.Vector3(...p(u,y,d)),zero,new T.Vector3(sx,sy,sz)));
    function trim(p,l,r,y,d=0){
      box('trim',p,l,r,y-.048,y+.033,d-.11,d+.16);
      box('stone',p,l+.028,r-.028,y-.13,y-.043,d-.13,d+.115);
    }
    function sill(p,l,r,y){
      box('trim',p,l-.075,r+.075,y-.077,y+.014,-.22,.14);
      box('stone',p,l-.044,r+.044,y-.14,y-.078,-.19,.085);
    }
    function opening(p,u,b,h,w,opts={}){
      const {arch=0,pediment=false,door=false,frame='iron'}=opts;
      const l=u-w*.5,r=u+w*.5,y=h-arch,front=.041,d=-.155;
      const solid=(a,b,c,e)=>box('joint',p,a,b,c,e,d-.09,d+.018);
      solid(l-.055,r+.055,b-.028,y+.014);
      box(door?'shutter':'glass',p,l+.027,r-.027,b+.024,y,d+.013,d+.027);
      for(const a of [l,r-.048])box(frame,p,a,a+.048,b,y,d+.022,d+.066);
      box(frame,p,u-.022,u+.022,b,y,d+.024,d+.070);
      for(const Y of door?[b+.21,y-.15]:[b+(y-b)*.505,y-.056]){
        box(frame,p,l,r,Y,Y+.040,d+.023,d+.068);
      }
      for(const [a,c] of [[l-.105,l+.008],[r-.008,r+.105]])box('trim',p,a,c,b,y,-.15,front);
      if(arch){
        const at=(t,r,ext=0,v=front)=>p(u+Math.cos(t)*r,y+Math.sin(t)*(arch+ext),v);
        for(let i=0;i<11;i++){
          const a=i*Math.PI/11,c=(i+1)*Math.PI/11;
          const x=at(a,w*.5),xx=at(c,w*.5);
          quad('trim',xx,x,at(a,w*.5+.108,.108),at(c,w*.5+.108,.108),1.1);
          quad('stone',x,xx,at(c,w*.5,0,d+.01),at(a,w*.5,0,d+.01),1.1);
          triangle('glass',p(u,y,d+.033),at(a,w*.5,0,d+.033),at(c,w*.5,0,d+.033),[.5,0,0,.5,1,.5]);
        }
        box(frame,p,l,r,y-.025,y+.025,d+.026,d+.075);
        box(frame,p,u-.021,u+.021,y,h,d+.030,d+.075);
        box('trim',p,u-.078,u+.078,h+.005,h+.146,-.041,.085);
      }else {
        box('trim',p,l-.12,r+.12,h,h+.122,-.15,front+.01);
        if(pediment){
          const a=l-.23,c=r+.23,y=h+.17;
          triangle('stone',p(a,y,.042),p(c,y,.042),p(u,y+.28,.042),[0,0,1,0,.5,.29]);
          bar('trim',p,a,y,u,y+.28,.061,.01,.099);
          bar('trim',p,u,y+.28,c,y,.061,.01,.099);
          box('trim',p,a,c,y-.037,y+.013,.012,.098);
        }
      }
      if(!door)sill(p,l,r,b);
    }
    function bays(p,spec){
      const {width,depth,h,count,floors,face='stone',roof='slate',rise=3.5,hip=2.1,collision=true,capRoof=true}=spec;
      const l=-width*.5,r=width*.5,back=-depth,step=width/count;
      box(face,p,l,r,-.25,h,back,-.255);
      box('base',p,l-.045,r+.045,-.25,.49,back-.035,-.247);
      let prev=.56;
      for(const [row,f] of floors.entries()){
        const {b,head,w,arch=0,door=[],pediment=false,spring=false}=f;
        const close=head+(arch?arch+.13:0);
        // A real recess from a continuous shell: every window and door
        // is framed by solid jambs, infill and an opaque backing.
        if(b>prev&&!door.length)box(face,p,l,r,prev,b,-.255,0);
        for(let i=0;i<count;i++){
          const u=l+(i+.5)*step,d=door.includes(i),ww=step*w*(d?1.045:1),q=ww*.50;
          const low=d?.19:b;
          if(door.length){
            box(face,p,l+i*step,u-q,prev,b,-.25,0);
            box(face,p,u+q,l+(i+1)*step,prev,b,-.25,0);
            if(!d)box(face,p,u-q,u+q,prev,b,-.25,0);
          }
          box(face,p,l+i*step,u-q,b,close,-.25,0);
          box(face,p,u+q,l+(i+1)*step,b,close,-.25,0);
          if(arch){
            const y=head;
            for(let j=0;j<10;j++){
              const a=j*Math.PI/10,c=(j+1)*Math.PI/10;
              const x=u+Math.cos(a)*q,xx=u+Math.cos(c)*q;
              quad(face,p(xx,y+Math.sin(c)*arch,0),p(x,y+Math.sin(a)*arch,0),p(x,close,0),p(xx,close,0),1.65);
            }
          }
          if(d)box('base',p,u-q,u+q,-.01,.19,-.18,.05);
          opening(p,u,low,head+arch,ww,{door:d,arch,pediment:pediment&&i%2===row%2,frame:face==='plaster'?'warmFrame':'iron'});
          if(spring){
            const a=l+i*step+.026,c=l+(i+1)*step-.026;
            for(let y=.62;y<close-.07;y+=.282){
              const end=Math.min(y+.267,close);
              if(y>=head+arch||!d&&end<=b)box('trim',p,a,c,y,end,-.002,.018);
              else {
                const curve=y<=head?1:Math.sqrt(Math.max(0,1-((y-head)/arch)**2));
                const cut=q*curve+.065;
                box('trim',p,a,u-cut,y,end,-.002,.019);
                box('trim',p,u+cut,c,y,end,-.002,.019);
              }
            }
            if(arch)for(let j=0;j<9;j++){
              const a=(j+.045)*Math.PI/9,c=(j+.955)*Math.PI/9,thick=j===4?.180:.141;
              const at=(v,r,h)=>p(u+r*Math.cos(v),head+h*Math.sin(v),.065);
              quad('trim',at(c,q+.029,arch+.019),at(a,q+.029,arch+.019),
                at(a,q+thick,arch+thick),at(c,q+thick,arch+thick),1.2);
            }
          }
        }
        if(row===0)for(let i=0;i<count;i++){
          const x=l+i*step,mid=x+step*.5,q=step*w*.536;
          const plinth=(a,c)=>{
            box('base',p,a,c,-.25,.49,-.25,.105);
            trim(p,a,c,.56);
          };
          if(door.includes(i)){plinth(x,mid-q);plinth(mid+q,x+step);}
          else plinth(x,x+step);
        }
        prev=close;
      }
      box(face,p,l,r,prev,h,-.255,0);
      trim(p,l-.16,r+.16,h-.157,.03);
      box('stone',p,l-.22,r+.22,h-.127,h+.012,back-.23,.27);
      for(const x of [l,r-.21])for(let y=1;y<h-.26;y+=.54){
        box('trim',p,x,x+.21,y,y+.364,-.064,.092);
      }
      if(collision){
        const corners=[p(l,0,back),p(r,0,back),p(r,0,.16),p(l,0,.16)];
        world.polygon(corners.map(([x,,z])=>[x,z]));
      }
      if(capRoof)hipped(p,l-.22,r+.22,h+.012,rise,back-.28,.28,hip,roof,spec.mansard);
    }
    function hipped(p,l,r,y,rise,back,front,hip,m,mansard=false){
      const stages=mansard?[[0,0],[.105,.45],[.23,.74],[.36,.93],[.48,1]]:[[0,0],[.5,1]];
      const at=([d,h])=>{
        const a=l+d*hip*2,b=r-d*hip*2,k=y+h*rise,f=front+(back-front)*d,g=back+(front-back)*d;
        return [p(a,k,f),p(b,k,f),p(b,k,g),p(a,k,g)];
      };
      let a=at(stages[0]);
      for(const stage of stages.slice(1)){
        const b=at(stage);
        for(let j=0;j<4;j++){
          const k=(j+1)%4;
          quad(m,a[j],a[k],b[k],b[j],1.65,j+stage[0]);
        }
        a=b;
      }
      if(mansard)quad(m,a[0],a[1],a[2],a[3],1.65);
    }
    function stair(p,l,r,y=.38){
      for(let i=0;i<3;i++){
        box('base',p,l-i*.15,r+i*.15,-.07,y-i*.115,-.14,.38+i*.31);
      }
    }
    create({box,quad,triangle,bar,mass,trim,opening,bays,hipped,stair});
    kit.flush(name);
  }

  // Garden-side exterior photo: two storeys under a continuous slate
  // mansard, three round-headed portals under a projecting column order.
  building('Ehemalige Konkordienkirche · GeoZentrum',({box,bar,triangle,quad,mass,trim,bays,stair,hipped,opening})=>{
    const core=line(61.5,-49,Math.PI*.5);
    const wings=[{b:.63,head:2.88,w:.54},{b:4.08,head:6.32,w:.53}];
    const h=7.48;
    for(const [x,z,w] of [[72,-30,11.0],[70.7,-67.4,9.2]]){
      const p=line(x,z,Math.PI*.5);
      bays(p,{width:w,depth:10,h:7.12,count:4,rise:2.69,mansard:true,face:'plaster',floors:wings});
    }
    for(const u of [-9.54,9.54]){
      const p=(l,y,d)=>core(l+u,y,d);
      bays(p,{width:10.92,depth:15.5,h,count:4,capRoof:false,floors:wings});
    }
    bays(core,{width:8.16,depth:15.5,h,count:3,capRoof:false,
      floors:[{b:.39,head:3.34,arch:.77,w:.65,door:[1]},{b:5.88,head:6.55,w:.41}]});
    const arch=(u,rise,t)=>core(u+.84*Math.cos(t),3.34+rise*Math.sin(t),.385);
    for(const u of [-2.72,0,2.72]){
      for(const x of [u-.83,u+.83])box('trim',core,x-.056,x+.056,.43,3.36,-.069,.385);
      for(let j=0;j<12;j++){
        const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
        const edge=t=>core(u+.959*Math.cos(t),3.34+.891*Math.sin(t),.389);
        quad('trim',arch(u,.774,b),arch(u,.774,a),edge(a),edge(b),1.22);
      }
      for(const y of [2.44,2.64,2.80,2.94,3.09,3.25]){
        box('iron',core,u-.765,u+.765,y,y+.031,-.124,-.078);
      }
    }
    for(const center of [-4.10,-1.40,1.40,4.10])for(const dx of [-.181,.181]){
      const u=center+dx;
      box('base',core,u-.175,u+.175,.17,.70,.158,.62);
      mass('trim',column,core,u,2.57,.39,.66,3.61,.67);
      box('trim',core,u-.206,u+.206,4.35,4.55,.12,.674);
      for(const j of [-1,1])mass('trim',knob,core,u+j*.100,4.43,.603,.052,.084,.053);
    }
    box('stone',core,-4.47,4.47,4.53,4.79,-.109,.654);
    trim(core,-4.61,4.61,4.85,.575);
    trim(core,-4.58,4.58,4.98,.53);
    triangle('trim',core(-2.09,5.02,.62),core(2.09,5.02,.62),core(0,5.95,.62),[0,0,2.4,0,1.2,.59]);
    mass('stone',knob,core,0,5.37,.667,.37,.27,.088);
    mass('copper',knob,core,0,6.035,.56,.122,.136,.119);
    for(const s of [-1,1]){
      const end=2.09*s;
      bar('trim',core,end,5.02,0,5.95,.087,.599,.708);
      const a=core(end,5.02,.645),b=core(0,5.95,.645),c=core(0,6.33,-.057),d=core(end,5.02,-.082);
      if(s>0)quad('copper',a,b,c,d,1.81);else quad('copper',d,c,b,a,1.81);
    }
    stair(core,-1.13,1.13,.21);
    hipped(core,-15.2,15.2,h,3.64,-15.75,.29,2.52,'slate',true);
    for(const u of [-12.04,-8.86,-5.91,-2.96,2.96,5.91,8.86,12.04]){
      box('copper',core,u-.49,u+.49,7.79,9.10,-1.82,-.55);
      mass('copper',knob,core,u,9.04,-.71,.496,.245,.223);
      box('trim',core,u-.335,u+.335,8.056,8.941,-.566,-.513);
      box('glass',core,u-.276,u+.276,8.112,8.889,-.512,-.495);
      for(const f of [u,u-.266,u+.266])box('trim',core,f-.019,f+.019,8.07,8.92,-.501,-.469);
      box('trim',core,u-.31,u+.31,8.51,8.553,-.501,-.468);
    }
    const end=line(69.25,-33.99,0);
    for(const u of [-5.15,-1.75,1.65,5.05]){
      opening((l,y,d)=>end(l,y,d+.19),u,.63,2.88,1.35);
      opening((l,y,d)=>end(l,y,d+.19),u,4.08,6.32,1.35);
    }
  });

  // FAU's park-side photograph anchors the rusticated base, giant order,
  // three central arches, side wings and dark mansard with lantern.
  building('Kollegienhaus · Gartenfassade',({box,mass,trim,bays,hipped,stair})=>{
    const floor=[
      {b:.89,head:2.52,w:.55,arch:.64,spring:true},
      {b:4.43,head:6.76,w:.53,pediment:true},
      {b:8.05,head:9.84,w:.54}
    ];
    for(const [z,w,depth,h,n] of [[-92.7,11.6,16,12.60,4],[-103.3,10.3,12.80,11.52,4],[-122.5,10.6,12.80,11.52,4],[-133.5,11.9,16,12.60,4]]){
      const p=line(h>12?72.0:73.1,z,Math.PI*.5);
      bays(p,{width:w,depth,h,count:n,rise:h>12?3.8:2.45,hip:2.1,mansard:h>12,floors:floor});
      trim(p,-w*.5,w*.5,3.73);trim(p,-w*.5,w*.5,7.42);
      if(h>12)for(const u of [-2.8,2.8]){
        box('trim',p,u-.52,u+.52,12.77,14.17,-2.62,-.79);
        box('glass',p,u-.296,u+.296,13.17,13.93,-.798,-.782);
        box('iron',p,u-.019,u+.019,13.17,13.93,-.78,-.74);
        hipped(p,u-.59,u+.59,14.16,.48,-2.71,-.69,.12,'slate');
      }
    }
    const p=line(70.2,-112.88,Math.PI*.5),w=11.9;
    bays(p,{width:w,depth:18.5,h:13.74,count:5,rise:4.1,hip:1.95,mansard:true,
      floors:[{...floor[0],door:[1,2,3]},floor[1],{...floor[2],arch:.14},
        {b:11.61,head:12.51,w:.53}]});
    trim(p,-6.08,6.08,3.78,.14);trim(p,-6.12,6.12,10.58,.12);
    for(let i=0;i<6;i++){
      const x=-5.75+i*2.30;
      box('base',p,x-.29,x+.29,3.83,4.30,-.10,.42);
      mass('trim',column,p,x,7.35,.275,1,6.17,1);
      box('trim',p,x-.34,x+.34,10.40,10.61,-.11,.51);
      box('stone',p,x-.27,x+.27,10.25,10.40,-.07,.46);
      for(const dx of [-.14,.14])mass('trim',knob,p,x+dx,10.31,.43,.065,.092,.089);
    }
    for(let i=1;i<27;i++){
      const x=-5.76+i*.427;
      mass('trim',knob,p,x,4.10,.432,.072,.213,.092);
    }
    box('trim',p,-5.96,5.96,4.29,4.385,.28,.55);
    stair(p,-4.24,4.24);
    for(const u of [-3.3,3.3]){
      box('stone',p,u-.37,u+.37,14.60,15.47,-2.74,-1.12);
      mass('trim',knob,p,u,15.01,-1.11,.49,.56,.18);
      mass('glass',knob,p,u,15.02,-.943,.284,.374,.062);
    }
    box('trim',p,-1.24,1.24,16.45,18.60,-9.72,-7.47);
    for(const u of [-.71,.71])box('dark',p,u-.26,u+.26,17.57,18.47,-7.474,-7.466);
    trim(p,-1.28,1.28,18.62,-7.58);
    hipped(p,-1.41,1.41,18.64,1.62,-9.88,-7.29,1.33,'slate',true);
    mass('iron',knob,p,0,20.35,-8.54,.14,.24,.14);
    box('iron',p,-.026,.026,20.38,20.98,-8.59,-8.49);
  });

  // At the south end of Krankenhausstraße the pavilion group reads above
  // the park's wall. Only its public exterior and roofline are represented.
  building('Neue Anatomie · Krankenhausstraße',({box,trim,bays,stair,opening})=>{
    const rooms=[{b:1.24,head:3.18,w:.51,arch:.38},{b:4.89,head:7.12,w:.54,pediment:true}];
    for(const [x,z,w,h,n] of [[56.8,-233.2,10.5,8.96,3],[67.0,-236.2,10.1,8.12,3],[76.5,-231.8,9.4,9.48,3],[85.85,-236.2,9.4,8.28,3]]){
      const p=line(x,z);
      bays(p,{width:w,depth:15.4,h,count:n,rise:3.45,hip:1.9,mansard:true,floors:rooms});
      trim(p,-w*.50,w*.50,4.00);
      if(x===76.5)stair(p,-1.7,1.7);
      for(const x of [-w*.49,w*.49-.13])box('trim',p,x,x+.13,.64,h-.25,-.17,.17);
    }
    // The outer pavilion's flank is what you first see from the park.
    const side=line(51.55,-240.77,Math.PI*.5);
    for(const y of [.55,3.98,7.89,8.80])trim(side,-7.65,7.65,y,.02);
    box('base',side,-7.65,7.65,-.17,.46,-.19,.09);
    for(const u of [-5.35,-1.78,1.78,5.35]){
      const p=(l,y,d)=>side(l,y,d+.195);
      opening(p,u,1.18,3.30,1.35,{arch:.29});
      opening(p,u,4.79,7.10,1.34,{pediment:true});
      for(const y of [1.06,4.60])box('trim',side,u-.74,u+.74,y,y+.10,.006,.24);
    }
    for(const u of [-7.53,0,7.53])for(let y=.58;y<8.17;y+=.565){
      box('trim',side,u-.102,u+.102,y,y+.36,-.046,.112);
    }
  });

  // A low, faint glass silhouette is enough from the Schlossgarten path.
  // The FAU plan is not used to expose detailed service / indoor layouts.
  building('Botanischer Garten · Gewächshaus-Silhouetten',({box,quad})=>{
    for(const [x,z,width,depth,h] of [[-83.4,-102,17,8.8,3.05],[-86.6,-119,15,11.5,3.75],[-83.4,-137.8,20,8.5,3.28],[-88,-148.6,9.4,8.6,2.96]]){
      const p=line(x,z,-Math.PI*.5),l=-width*.5,r=width*.5,b=-depth,ridge=b*.5,high=h+1.39;
      box('base',p,l,r,-.27,.46,b,.10);
      box('mistGlass',p,l,r,.46,h,b,0);
      const band=(a,c)=>quad('mistGlass',p(l,...a),p(r,...a),p(r,...c),p(l,...c),1.7);
      band([h,0],[high,ridge]);band([high,ridge],[h,b]);
      for(let i=0;i<=Math.round(width/.98);i++){
        const u=l+i*width/Math.round(width/.98),q=.022;
        box('iron',p,u-q,u+q,.46,h+.027,-.022,.033);
        for(const [v,y,v2,y2] of [[0,h,ridge,high],[ridge,high,b,h]]){
          quad('iron',p(u-q,y+.014,v),p(u+q,y+.014,v),p(u+q,y2+.014,v2),p(u-q,y2+.014,v2),1);
        }
      }
      for(const y of [1.38,2.53,h])box('iron',p,l,r,y-.027,y+.027,-.014,.039);
      box('iron',p,l-.04,r+.04,high-.032,high+.043,ridge-.045,ridge+.045);
    }
  });
  column.dispose();knob.dispose();
}
