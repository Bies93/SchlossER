import {stationery} from './interior-stationery.js';
import {randomSource} from './surface-detail.js';

export function dressChapter(T,{room,k,box:B,hit,F,id,print}){
  const pi=Math.PI,rnd=randomSource(9318+id.charCodeAt(0)),ball=new T.SphereGeometry(1,14,9),pin=new T.CylinderGeometry(1,1,1,12),
    ring=new T.TorusGeometry(1,.085,7,20),pos=new T.Vector3(),scale=new T.Vector3(),quat=new T.Quaternion(),rot=new T.Euler(),
    up=new T.Vector3(0,1,0),end=new T.Vector3(),dir=new T.Vector3(),mat=new T.Matrix4();
  const box=(m,x,y,z,xw,hh,zd)=>B(m,x-xw/2,x+xw/2,y,y+hh,z-zd/2,z+zd/2);
  const foot=(x,z,w,d)=>hit(x-w/2,x+w/2,z-d/2,z+d/2);
  const props=stationery(T,k,room,{cloth:['bookA','bookB','bookC','piping']});
  const mesh=(m,g,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>k.geometry(m,g,mat.compose(pos.set(x,F+y,z),quat.setFromEuler(rot.set(rx,ry,rz)),scale.set(w,h,d)));
  const bead=(m,x,y,z,w=.013,h=w,d=w)=>mesh(m,ball,x,y,z,w,h,d);
  const cylinder=(m,x,y,z,r,h)=>mesh(m,pin,x,y,z,r,h,r);
  const disk=(m,g,x,y,z,r,d,ry=0)=>mesh(m,g,x,y,z,r,r,d,0,ry);
  const rod=(m,x,y,z,X,Y,Z,r)=>{
    pos.set(x,F+y,z);end.set(X,F+Y,Z);dir.subVectors(end,pos);const L=dir.length();
    if(L>.001)k.geometry(m,pin,mat.compose(pos.addScaledVector(dir,.5),quat.setFromUnitVectors(up,dir.normalize()),scale.set(r,L,r)));
  };
  const line=(m,pts,r)=>{for(let j=1;j<pts.length;j++)rod(m,...pts[j-1],...pts[j],r);};
  function frame(key,x,y,z,w,h,yaw=0){
    const X=(s,d=0)=>x+Math.cos(yaw)*s+Math.sin(yaw)*d,Z=(s,d=0)=>z-Math.sin(yaw)*s+Math.cos(yaw)*d;
    for(const s of [-1,1]){
      rod('darkWood',X(s*(w/2+.025)),y-h/2-.03,Z(s*(w/2+.025)),X(s*(w/2+.025)),y+h/2+.03,Z(s*(w/2+.025)),.032);
      rod('darkWood',X(-w/2-.04),y+s*(h/2+.017),Z(-w/2-.04),X(w/2+.04),y+s*(h/2+.017),Z(w/2+.04),.030);
      for(const r of [-1,1])bead('brass',X(r*(w/2+.023),.027),y+s*(h/2+.024),Z(r*(w/2+.023),.027),.018);
    }
    print(key,x,y,z,w,h,yaw);
  }
  function banner(x,y,z,w,h,yaw=0){
    print('crest',x,y,z,w,h,yaw,0,true);
    const ux=Math.cos(yaw),uz=-Math.sin(yaw);
    rod('brass',x-ux*w*.59,y+h*.51,z-uz*w*.59,x+ux*w*.59,y+h*.51,z+uz*w*.59,.023);
    for(const s of [-1,1]){
      bead('brass',x+s*ux*w*.60,y+h*.51,z+s*uz*w*.60,.038);
      bead('iron',x+s*ux*w*.37,y+h*.511,z+s*uz*w*.37,.032);
      rod('iron',x+s*ux*w*.37,y+h*.51,z+s*uz*w*.37,x+s*ux*w*.37-Math.sin(yaw)*.162,y+h*.51,z+s*uz*w*.37-Math.cos(yaw)*.162,.013);
    }
  }
  function lamp(x,y,z,side=1){
    const Z=z+side*.12;
    box('iron',x,y-.16,z,.16,.29,.058);
    for(const d of [-.102,.10])bead('brass',x,y+d,z+side*.038,.011);
    rod('brass',x,y-.072,z+side*.028,x,y-.019,Z,.028);
    cylinder('iron',x,y-.004,Z,.108,.033);cylinder('filament',x,y+.090,Z,.071,.168);
    cylinder('brass',x,y+.177,Z,.108,.031);bead('brass',x,y+.205,Z,.089,.034,.087);
    for(let j=0;j<7;j++){
      const a=j*2*pi/7;rod('iron',x+.081*Math.cos(a),y+.011,Z+.08*Math.sin(a),x+.081*Math.cos(a),y+.168,Z+.08*Math.sin(a),.008);
    }
  }
  function candle(x,y,z,h=.105){
    cylinder('brass',x,y+.012,z,.049,.024);
    cylinder('wax',x,y+h*.50+.023,z,.025,h);
    bead('flame',x,y+h+.050,z,.012,.027,.012);
    for(let j=0;j<3;j++)bead('wax',x+Math.sin(j*1.9)*.026,y+h*.36+j*.012,z+Math.cos(j*1.9)*.026,.006,.019,.007);
  }
  function table(x,z,w,d,h=.88){
    box('darkWood',x,h-.07,z,w,.073,d);
    box('wood',x,h+.003,z,w*.985,.018,d*.981);
    for(const s of [-1,1]){
      rod('brass',x-w*.464,h-.021,z+s*d*.508,x+w*.464,h-.021,z+s*d*.508,.008);
      box('darkWood',x,h-.166,z+s*d*.415,w*.92,.10,.065);
      for(const q of [-1,1]){
        const X=x+q*(w*.50-.106),Z=z+s*(d*.50-.117);
        box('darkWood',X,.024,Z,.085,h-.168,.085);
        for(const y of [.085,h-.183])box('wood',X,y,Z,.111,.039,.109);
      }
    }
    foot(x,z,w,d);
  }
  function chest(x,z,w,d,h){
    box('darkWood',x,.028,z,w,h-.07,d);
    for(const s of [-1,1]){
      for(const q of [-1,1])box('iron',x+s*(w/2-.085),.02,z+q*(d/2-.073),.09,.094,.11);
      box('iron',x+s*w*.308,.056,z+d*.505,.079,h-.044,.023);
      for(const yy of [.087,h-.073])bead('brass',x+s*w*.308,yy,z+d*.52,.013);
    }
    box('wood',x,h-.04,z,w+.045,.064,d+.041);
    for(const s of [-1,1])box('wood',x,h-.017,z+s*(d/2-.112),w-.041,.061,.203);
    box('brass',x,h-.15,z+d*.53,.082,.133,.043);box('iron',x,h-.112,z+d*.553,.011,.034,.005);
    foot(x,z,w+.03,d+.035);
  }
  function carpet(x,z,w,d,shade='wine'){
    box(shade,x,.004,z,w,.010,d);
    for(const s of [-1,1]){
      box('piping',x,.0143,z+s*(d/2-.051),w-.094,.005,.011);
      box('piping',x+s*(w/2-.044),.0143,z,.011,.005,d-.106);
      for(let j=0;j<30;j++)box(j%3?'piping':shade,x-w*.475+j*w*.0327,.008,z+s*(d/2+.013),.011,.004,.034);
    }
    function lozenge(U,V,R){
      const a=[[U-R,.02,V],[U,.02,V+R*.55],[U+R,.02,V],[U,.02,V-R*.55],[U-R,.02,V]];
      line('piping',a,.006);
    }
    for(let j=0;j<7;j++)lozenge(x-w*.41+j*w*.136,z,Math.min(d*.14,w*.045));
  }
  function shelf(x,z,w,d){
    for(const s of [-1,1])box('darkWood',x+s*(w*.5-.031),.027,z,.062,2.05,d);
    for(const y of [.28,.72,1.14,1.58,2.06]){
      box('wood',x,y,z,w,.047,d+.021);rod('brass',x-w*.478,y+.037,z+d*.51,x+w*.478,y+.037,z+d*.51,.006);
      if(y>2)continue;
      let X=x-w*.5+.095;
      while(X<x+w*.5-.108){
        const q=.024+rnd()*.057,H=.187+rnd()*.114,V=z+.041+(rnd()-.5)*.066;
        box('paper',X,y+.051,V,q*.82,H-.021,d*.51);
        box(['bookA','bookB','bookC','darkWood'][Math.floor(rnd()*4)],X,y+.051,V+d*.253,q,H,.027);
        for(const y0 of [.079,H+.026])box('piping',X,y+y0,V+d*.28,q*.91,.008,.011);
        if(rnd()<.77)box('paper',X,y+H*.64,V+d*.291,q*.66,.039,.005);
        X+=q+.019+rnd()*.026;
      }
    }
    foot(x,z,w,d);
  }
  function helmet(x,y,z,pose=0){
    // Display-only heraldic headpiece: layered visor, raised comb, rivets
    // and a wooden turned mount. No human or manequin geometry.
    cylinder('darkWood',x,y+.024,z,.175,.048);cylinder('wood',x,y+.123,z,.053,.17);
    bead('iron',x,y+.288,z,.145,.157,.148);
    bead('steel',x,y+.339,z,.128,.120,.136);
    bead('iron',x,y+.261,z+.090,.108,.096,.113);
    box('soot',x,y+.308,z+.182,.170,.022,.019);
    rod('brass',x-.114,y+.299,z+.147,x-.096,y+.296,z+.192,.009);
    rod('brass',x-.096,y+.296,z+.192,x+.096,y+.296,z+.192,.009);
    for(let j=0;j<7;j++)bead('brass',x-.077+j*.026,y+.266,z+.194,.008);
    for(const s of [-1,1])bead('brass',x+s*.132,y+.307,z+.066,.019,.019,.017);
    if(pose){bead('wine',x,y+.463,z-.029,.028,.046,.127);bead('piping',x,y+.428,z-.015,.039,.023,.072);}
  }
  function bladeDisplay(x,y,z,s){
    // Two tapered, closed silhouettes set flat on the notice board, purely decorative.
    const point=(a,b,c)=>[x+a*Math.cos(s)-b*Math.sin(s),F+y+a*Math.sin(s)+b*Math.cos(s),z+c];
    const a=point(-.027,.047,0),b=point(.027,.047,0),c=point(0,.609,0),d=point(0,.103,.017);
    const UV=[0,0,1,0,.5,1];
    k.triangle('steel',a,d,c,UV);k.triangle('iron',d,b,c,UV);
    const Q=(dx,dy)=>{const [X,Y,Z]=point(dx,dy,.006);return [X,Y-F,Z];};
    line('brass',[Q(-.115,.014),Q(-.072,.038),Q(.056,.034),Q(.112,.001)],.013);
    rod('darkWood',...Q(0,.037),...Q(0,-.136),.019);
    bead('brass',...Q(0,-.146),.033);
  }
  if(id==='vestibule'){
    chest(29.46,-35.83,1.08,.54,.60);
    table(28.07,-36.02,1.46,.68,.82);
    props.folio(28.49,F+.844,-35.94,.24,.19,.11,1,{loose:true,thickness:.012});
    candle(27.65,.84,-36.03,.12);
    frame('lodge',28.67,1.63,-36.47,1.30,.74);
    frame('banned',29.28,1.55,-32.60,.91,.65,pi);
    lamp(27.54,1.80,-36.38);lamp(27.20,1.80,-32.63,-1);
    carpet(28.65,-34.05,2.59,1.72,'blue');
    for(const x of [27.59,28.16,28.74]){
      rod('brass',x,1.68,-32.57,x,1.63,-32.75,.016);
      bead('wood',x,1.70,-32.585,.041,.062,.028);
      for(let j=0;j<3;j++)disk('iron',ring,x+.019*(j-1),1.565-j*.017,-32.77,.031,.029);
    }
  }else if(id==='salle'){
    carpet(21.07,-35.48,8.52,2.57,'blue');
    for(const [x,z] of [[18.25,-33.00],[24.46,-33.00]]){
      table(x,z,2.14,.59,.452);box('wine',x,.474,z,2.00,.068,.47);
      for(let j=0;j<8;j++)bead('brass',x-.86+j*.245,.503,z-.241,.009);
    }
    for(const x of [18.92,25.04]){
      table(x,-38.13,1.79,.66,.855);
      helmet(x-.51,.879,-38.08,true);helmet(x+.52,.879,-38.08);
      box('darkWood',x,1.316,-38.53,1.66,1.013,.118);box('wine',x,1.365,-38.463,1.53,.90,.012);
      bladeDisplay(x,1.672,-38.44,.38);bladeDisplay(x,1.672,-38.411,-.48);
    }
    frame('salle',21.30,1.82,-32.617,1.66,.73,pi);
    for(const x of [17.88,24.9])banner(x,1.748,-32.661,.91,1.39,pi);
    for(const x of [17.52,21.22,26.08])lamp(x,1.94,-38.49);
    lamp(19.97,1.978,-32.636,-1);lamp(22.77,1.978,-32.636,-1);
  }else if(id==='archive'){
    shelf(21.41,-45.49,3.83,.48);shelf(25.25,-45.49,2.63,.48);
    shelf(20.50,-41.66,2.08,.63);
    table(25.17,-42.21,2.39,.89,.916);
    props.folio(24.82,F+.941,-42.15,.39,.273,.41,0,{loose:true,thickness:.014});
    props.folio(25.73,F+.941,-42.31,.371,.246,2.87,2,{loose:false,thickness:.038});
    candle(24.23,.94,-42.40,.174);candle(25.86,.94,-42.40,.118);
    cylinder('brass',25.46,1.019,-42.269,.046,.14);
    cylinder('soot',25.46,1.085,-42.269,.028,.012);
    for(let i=0;i<4;i++)box(i%2?'bookC':'bookA',25.86,1.002+i*.032,-42.14,.29,.029,.174);
    frame('archive',19.20,1.762,-43.84,1.28,.89,pi/2);
    frame('banned',26.61,1.805,-40.90,1.32,.902,-pi/2);
    lamp(20.44,2.20,-45.64);lamp(25.38,2.20,-45.64);
    carpet(23.10,-43.41,1.42,2.95,'wine');
  }else{
    carpet(12.68,-38.61,5.22,2.90);
    // Empty ceremonial chair, lacquered steps, brass nails and velvet.
    box('stone3',10.39,.034,-38.93,1.52,.139,2.44);
    box('stone',10.18,.173,-38.93,1.15,.152,2.13);foot(10.36,-38.93,1.63,2.46);
    for(const s of [-1,1]){
      const z=-38.93+s*.50;
      box('darkWood',10.17,.33,z,.88,.188,.141);
      box('wood',9.87,.50,z,.157,1.83,.154);
      bead('brass',9.87,2.36,z,.086,.087,.087);
      box('wood',10.46,.52,z,.116,.34,.14);
      rod('darkWood',9.92,.912,z,10.56,.912,z,.064);
    }
    box('darkWood',10.16,.514,-38.93,.849,.087,1.049);
    box('wine',10.17,.605,-38.93,.779,.104,.929);
    box('darkWood',9.82,.651,-38.93,.201,1.56,.951);
    box('wine',9.931,.807,-38.93,.038,1.259,.782);
    for(let j=0;j<7;j++)for(let i=0;i<4;i++)bead('brass',9.958,1.03+j*.119,-39.208+i*.181,.011);
    for(const s of [-1,1]){
      rod('piping',9.957,.857,-38.93+s*.407,9.957,2.051,-38.93+s*.407,.011);
      const points=Array.from({length:13},(_,i)=>[9.95,2.026+.184*Math.sin(i*pi/24),-38.93+s*.43*Math.cos(i*pi/24)]);
      line('wood',points,.039);line('brass',points.map(([x,y,z])=>[x+.029,y+.024,z]),.012);
    }
    bead('brass',9.991,2.152,-38.93,.036,.094,.067);
    banner(9.51,2.24,-40.83,.92,1.50,pi/2);banner(9.51,2.23,-37.02,.92,1.5,pi/2);
    for(const z of [-41.05,-36.71]){
      table(10.56,z,.92,.88,.774);
      for(let j=0;j<4;j++)candle(10.31+j*.157,.80,z+(j%2?.19:-.17),.08+j*.031);
    }
    box('wine',10.60,.795,-41.05,.40,.028,.33);
    cylinder('brass',10.60,.855,-41.05,.117,.042);
    for(let i=0;i<5;i++){
      const a=i*2*pi/5,x=10.60+.112*Math.cos(a),z=-41.05+.112*Math.sin(a);
      rod('brass',x,.867,z,x,.947,z,.017);bead('wine',x,.944,z,.017,.020,.017);
    }
    for(const x of [12.38,14.52]){
      table(x,-35.00,1.70,.67,.43);box('blue',x,.456,-35.00,1.56,.066,.532);
    }
    frame('decree',12.77,1.75,-42.72,1.67,1.05);
    lamp(11.31,1.91,-42.73);lamp(14.19,1.91,-42.73);lamp(13.63,2.04,-34.45,-1);
  }
  props.finish('Eiserne Krone · Papiere');for(const g of [ball,pin,ring])g.dispose();
}
