import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {randomSource} from './surface-detail.js';
import {b,p,wcRoofAt} from './park-wc-layout.js';

export function shopKit(T,kit,id){
  const {block,hit,pipe,stamp,shopTile,k}=kit,pi=Math.PI,rand=randomSource(id==='practice'?6852:6941);
  const sphere=new T.SphereGeometry(1,10,7),pin=new T.CylinderGeometry(1,1,1,14);
  const bevel=new RoundedBoxGeometry(1,1,1,1,.084);
  const box=(m,u,y,v,w,h,d)=>block(m,u-w*.5,u+w*.5,y,y+h,v-d*.5,v+d*.5);
  const rounded=(m,u,y,v,w,h,d,yaw=0)=>stamp(m,bevel,u,y,v,[d,h,w],yaw);
  const bolt=(m,u,y,v,r=.011)=>stamp(m,sphere,u,y,v,[r,r,r*.94]);
  const foot=(u,v,w,d)=>hit(u-w*.5,u+w*.5,v-d*.5,v+d*.5);
  const roof=(u,v)=>wcRoofAt(id,u,v)-b;
  const rod=(m,u,y,v,U,Y,V,r=.014)=>pipe(m,[u,y,v],[U,Y,V],r);
  function line(m,pts,r){for(let i=1;i<pts.length;i++)pipe(m,pts[i-1],pts[i],r);}
  function cord(m,pts,r=.012,n=18){
    const path=new T.CatmullRomCurve3(pts.map(([u,y,v])=>new T.Vector3(...p(u,b+y,v))));
    const geo=new T.TubeGeometry(path,n,r,6,false);k.geometry(m,geo,new T.Matrix4());geo.dispose();
  }
  function sign(label,u,y,v,w,h,yaw=-pi/2){
    const du=Math.cos(yaw),dv=-Math.sin(yaw),U=u-du*.023,V=v-dv*.023;
    box('darkWood',U,y-h/2-.021,V,Math.abs(dv)*(w+.041)+Math.abs(du)*.043,h+.042,Math.abs(du)*(w+.041)+Math.abs(dv)*.043);
    shopTile(label,u,y,v,w,h,yaw);
    for(const side of [-1,1])for(const height of [-1,1])bolt('brass',u+side*(w/2-.024)*dv,y+height*(h/2-.025),v-side*(w/2-.024)*du,.008);
  }
  function frame(u,v,w,d,y=.90,finish='mfBench',withHit=true){
    for(const a of [-1,1])for(const c of [-1,1]){
      const A=u+a*(w/2-.078),C=v+c*(d/2-.076);
      box('gunmetal',A,.026,C,.062,y-.064,.066);
      box('iron',A,.006,C,.101,.035,.101);
      box('mfCast',A,y-.151,C,.074,.067,.078);
    }
    for(const z of [-1,1]){
      box('gunmetal',u,y-.158,v+z*(d/2-.078),w-.10,.094,.048);
      rod('edge',u-w*.470,y-.043,v+z*(d*.5+.003),u+w*.470,y-.043,v+z*(d*.5+.003),.009);
    }
    box(finish,u,y-.056,v,w,.056,d);
    if(withHit)foot(u,v,w,d);
  }
  function utilityLamp(u,v,y,yaw=0,hue='mfIce'){
    const top=roof(u,v);
    const U=(du,dv)=>u+du*Math.cos(yaw)+dv*Math.sin(yaw),V=(du,dv)=>v+dv*Math.cos(yaw)-du*Math.sin(yaw);
    for(const s of [-.31,.31])rod('iron',U(s,0),y,V(s,0),U(s,0),top+.014,V(s,0),.016);
    const across=Math.abs(Math.sin(yaw))>.5;
    box('iron',u,y-.03,v,across?.262:.788,.079,across?.788:.262);
    for(const z of [-.060,.060])rod(hue,U(-.346,z),y-.045,V(-.346,z),U(.346,z),y-.045,V(.346,z),.018);
    for(const s of [-.349,-.18,0,.18,.349])rod('edge',U(s,-.127),y-.079,V(s,-.127),U(s,.127),y-.079,V(s,.127),.008);
  }
  function drawer(u,y,v,w,h,d,open=0,mat='green'){
    box('iron',u,y,v,w,h,d);
    box(mat,u,y+.01,v-d*.5-.012,w-.024,h-.024,.037);
    for(const s of [-1,1])bolt('steel',u+s*(w/2-.039),y+h*.55,v-d*.5-.037,.007);
    const u1=u-w*.11,u2=u+w*.11,z=v-d*.5-.046;
    rod('brass',u1,y+h*.53,z+.025,u1,y+h*.53,z,.010);
    rod('brass',u1,y+h*.53,z,u2,y+h*.53,z,.010);
    rod('brass',u2,y+h*.53,z,u2,y+h*.53,z+.025,.010);
    if(open)box('paper',u-w*.29,y+h*.59,v-d*.5-.031,w*.26,.033,.008);
  }
  function tape(u,y,v,r=.076,wide=.042){
    stamp('gunmetal',pin,u,y+wide*.5,v,[r,wide,r]);
    stamp('darkWood',pin,u,y+wide+.004,v,[r*.86,.012,r*.86]);
    stamp('brass',pin,u,y+wide+.011,v,[r*.34,.015,r*.34]);
  }
  return {box,rod,line,cord,sign,frame,drawer,utilityLamp,tape,stamp,rounded,bolt,foot,roof,rand,sphere,pin,
    dispose(){for(const geo of [sphere,pin,bevel])geo.dispose();}};
}
