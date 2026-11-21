import {architectureKit} from './architecture-kit.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {sharedSet} from './surface-detail.js';

export const at=(x,y,z)=>[x,y,z];
export function bergMaterials(T){
  const m=(c,key,roughness=.85,metalness=0)=>new T.MeshStandardMaterial({
    ...(key?sharedSet(T,key,256):{}),color:c,roughness,metalness
  });
  return {
    stone:m(0xb8a07f,'stairStone'),plaster:m(0xc3a67e,'plaster'),rock:m(0x766c54,'bedrock'),grout:m(0x5d4d40),
    oak:m(0x64402c,'fineOak'),dark:m(0x36291f,'fineOak'),edge:m(0x986642,'fineOak'),iron:m(0x403f37,'enamel',.65,.47),
    brass:m(0xa58145,null,.43,.64),linen:m(0xdac6a0,'canvas'),red:m(0x863937,'canvas'),green:m(0x4e5939,'canvas'),
    clay:m(0xceaf83,null,.58),beer:m(0x9b4c24,null,.53),salt:m(0xe3d9be),paint:m(0x666f58,'enamel'),
    leather:m(0x52432e,'fineOak'),slate:m(0x64736b,'galleryStone',.96),chalk:m(0xe1cfa5,'stairStone'),
    glaze:m(0xa2a178,null,.37,.13),copper:m(0xaf7148,'enamel',.43,.62),wine:m(0x632b31,null,.33),
    glass:new T.MeshPhysicalMaterial({color:0xc0d4c4,metalness:.13,roughness:.15,transparent:true,opacity:.38,
      depthWrite:false,side:T.DoubleSide,clearcoat:.51}),
    foam:m(0xe6d2a0,null,.81),rind:m(0xb58440,'canvas'),cheese:m(0xe1b764,null,.83),crust:m(0x8f5229,'stairStone'),
    scarlet:new T.MeshStandardMaterial({color:0xb55533,emissive:0xdb501e,emissiveIntensity:.34,roughness:.87}),
    glow:new T.MeshStandardMaterial({color:0xffd296,emissive:0xffaa50,emissiveIntensity:.93,roughness:.8})
  };
}
export function storyCard(T,parent,{title,sub='',lines=[],ink='#eee1b9',paper='#363d31',width,height,x,y,z,yaw=0,small=false}){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.max(60,Math.min(560,Math.round(512*height/width)));
  const c=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  c.fillStyle=paper;c.fillRect(0,0,W,H);
  for(let i=0;i<1200;i++){c.fillStyle=i%2?'#d3b88311':'#16161114';c.fillRect((i*163.7)%W,(i*79.3)%H,1+i%5,1+i%2);}
  c.strokeStyle=ink;c.globalAlpha=.65;c.strokeRect(9,9,W-18,H-18);c.strokeRect(15,15,W-30,H-30);c.globalAlpha=1;
  c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';
  c.font='bold '+(small?39:48)+'px Georgia';c.fillText(title,W/2,lines.length?H*.22:sub?H*.38:H*.5,W-50);
  c.font='bold 22px Georgia';if(sub)c.fillText(sub,W/2,lines.length?H*.385:H*.72,W-50);
  c.font='24px Georgia';lines.forEach((line,i)=>c.fillText(line,W/2,H*(.52+i*.35/Math.max(1,lines.length-1)),W-55));
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,color:0xd7cfbc}));
  mesh.position.set(x,y,z);mesh.rotation.y=yaw;parent.add(mesh);return mesh;
}
export function carpentry(T,parent,mats){
  const kit=architectureKit(T,parent,mats),matrix=new T.Matrix4(),v=new T.Vector3(),q=new T.Quaternion(),one=new T.Vector3(1,1,1);
  const c=new T.CylinderGeometry(1,1,1,20),sphere=new T.SphereGeometry(1,14,10),
    t=new T.TorusGeometry(1,.10,7,26),e=new T.Euler();
  function put(m,g,x,y,z,X,Y,Z,rx=0,ry=0,rz=0){
    kit.geometry(m,g,matrix.compose(v.set(x,y,z),q.setFromEuler(e.set(rx,ry,rz)),one.set(X,Y,Z)));
  }
  return {box:(m,x,y,z,w,h,d)=>kit.box(m,at,x-w/2,x+w/2,y-h/2,y+h/2,z-d/2,z+d/2),
    round(m,x,y,z,w,h,d,r=.02,rx=0,ry=0,rz=0){
      const g=new RoundedBoxGeometry(w,h,d,1,r);
      put(m,g,x,y,z,1,1,1,rx,ry,rz);g.dispose();
    },
    quad:kit.quad,cyl:(m,x,y,z,r,h,rx=0)=>put(m,c,x,y,z,r,h,r,rx),
    oval:(m,x,y,z,w,h,d)=>put(m,sphere,x,y,z,w,h,d),
    ring:(m,x,y,z,w,h,depth=.25,rx=0,ry=0)=>put(m,t,x,y,z,w,h,depth,rx,ry),
    profile(m,x,y,z,points,{segments=24,rx=0,ry=0,rz=0}={}){
      const g=new T.LatheGeometry(points.map(([r,h])=>new T.Vector2(r,h)),segments);
      put(m,g,x,y,z,1,1,1,rx,ry,rz);g.dispose();
    },
    tube(m,points,r,steps=16,radial=6){
      const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
      const g=new T.TubeGeometry(path,steps,r,radial,false);put(m,g,0,0,0,1,1,1);g.dispose();
    },
    flush(name){kit.flush(name);c.dispose();sphere.dispose();t.dispose();}
  };
}
