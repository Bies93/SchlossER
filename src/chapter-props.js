import {stationery} from './interior-stationery.js';
import {randomSource} from './surface-detail.js';
import {chapterCraft} from './chapter-craft.js';

export function dressChapter(T,{room,k,box:B,hit,F,id,print,cloth}){
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
  const craft=chapterCraft(T,{k,F,room,mesh,box,rod,line,bead,cylinder,foot,ring},cloth);
  function frame(key,x,y,z,w,h,yaw=0,recessed=false){
    const X=(s,d=0)=>x+Math.cos(yaw)*s+Math.sin(yaw)*d,Z=(s,d=0)=>z-Math.sin(yaw)*s+Math.cos(yaw)*d;
    if(recessed){
      const mount=(s,y,d)=>[X(s,d),F+y,Z(s,d)];
      k.box('walnut',mount,-w/2-.026,w/2+.026,y-h/2-.020,y+h/2+.021,-.088,-.012);
    }
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
    const gap=w-.144;
    for(const s of [-1,1]){
      const X=x+s*(w*.5-.035),out=x+s*w*.5;
      box('walnut',X,.121,z,.070,1.974,d);
      box('wood',out+s*.007,.196,z,.014,1.68,d-.075);
      box('walnut',out+s*.017,.227,z,.010,1.617,d-.131);
      for(const D of [-d*.5+.069,d*.5-.069])
        rod('inlayGold',out+s*.023,.253,z+D,out+s*.023,1.801,z+D,.006);
    }
    box('darkWood',x,.119,z-d*.5+.019,gap,.1+1.83,.033);
    box('walnut',x,.024,z,w+.035,.096,d+.027);
    box('polishedWood',x,2.095,z,w+.055,.076,d+.051);
    for(const y of [.28,.72,1.14,1.58]){
      // Board ends sit inside the carcass: no coplanar end faces against the sides.
      box('wood',x,y,z+.014,gap,.041,d-.054);
      rod('brass',x-gap*.476,y+.026,z+d*.5-.008,x+gap*.476,y+.026,z+d*.5-.008,.006);
      let X=x-w*.5+.095;
      while(X<x+w*.5-.108){
        const q=.025+rnd()*.061,H=.173+rnd()*.142,V=z+d*.44-rnd()*.048,t=(rnd()-.5)*.13,s=Math.sin(t),c=Math.cos(t);
        props.book((a,b,f)=>[X+a*c-b*s,F+y+.043+a*s+b*c,V+f],q,H,d*(.43+rnd()*.24),Math.floor(rnd()*8));
        X+=q+.019+rnd()*.026;
      }
    }
    foot(x,z,w+.041,d+.035);
  }
  function wainscot(a,A,z,side=1){
    box('darkWood',(a+A)*.5,.052,z,A-a,.882,.087);
    for(let x=a+.25;x<A-.21;x+=.49){
      box('wood',x,.132,z+side*.057,.432,.635,.035);
      box('darkWood',x,.183,z+side*.079,.327,.523,.024);
      for(const s of [-1,1])rod('piping',x+s*.157,.207,z+side*.096,x+s*.157,.682,z+side*.096,.006);
    }
    box('wood',(a+A)*.5,.914,z+side*.019,A-a,.074,.118);
    box('brass',(a+A)*.5,.948,z+side*.078,A-a,.012,.007);
  }
  function brassToken(x,y,z){
    cylinder('brass',x,y+.009,z,.041,.016);
    mesh('soot',ring,x,y+.020,z,.023,.023,.034,pi/2);
    bead('wine',x,y+.016,z,.011,.010,.012);
  }
  function sidePanels(z,Z,x,sign){
    const l=Z-z;
    box('walnut',x,.055,(z+Z)*.5,.103,.891,l);
    for(let v=z+.267;v<Z-.27;v+=.531){
      box('wood',x+sign*.065,.162,v,.033,.627,.46);
      box('walnut',x+sign*.083,.192,v,.025,.541,.38);
      for(const q of [-1,1])rod('inlayGold',x+sign*.098,.211,v+q*.179,x+sign*.098,.711,v+q*.179,.005);
    }
    box('polishedWood',x+sign*.015,.920,(z+Z)*.5,.138,.068,l+.009);
    rod('inlayGold',x+sign*.088,.953,z+.024,x+sign*.088,.953,Z-.024,.007);
  }
  function chandelier(x,z){
    rod('iron',x,2.62,z,x,3.48,z,.018);
    cylinder('brass',x,2.615,z,.101,.058);
    mesh('iron',ring,x,2.59,z,.49,.49,.22,pi/2);
    for(let n=0;n<8;n++){
      const a=n*pi/4,X=x+Math.cos(a)*.491,Z=z+Math.sin(a)*.491;
      rod('brass',x,2.592,z,X,2.58,Z,.012);
      cylinder('iron',X,2.579,Z,.080,.025);candle(X,2.595,Z,.087);
    }
  }
  if(id==='vestibule'){
    chest(28.59,-35.83,.71,.54,.60);
    table(27.67,-36.02,1.04,.68,.82);
    props.folio(27.86,F+.844,-35.94,.24,.19,.11,1,{loose:true,thickness:.012});
    candle(27.37,.84,-36.11,.12);brassToken(27.64,.846,-35.89);
    // A readable sign at eye level, with its light on the clear flank.
    frame('lodge',28.05,1.591,-36.445,1.16,.64,0,true);
    frame('banned',28.17,1.64,-32.596,1.06,.63,pi,true);
    lamp(27.15,1.72,-36.469);lamp(27.15,1.72,-32.575,-1);
    wainscot(27.05,28.92,-36.46);
    carpet(27.90,-34.05,1.89,1.57,'blue');
    box('walnut',28.16,1.016,-32.596,.75,.154,.104);
    for(const x of [27.92,28.16,28.40]){
      rod('brass',x,1.093,-32.64,x,1.063,-32.747,.012);
      bead('wood',x,1.093,-32.644,.025,.044,.018);
      for(let j=0;j<3;j++)disk('iron',ring,x+.014*(j-1),1.012-j*.016,-32.743,.028,.023);
    }
  }else if(id==='salle'){
    carpet(21.07,-35.48,8.52,2.57,'velvetBlue');
    wainscot(16.32,26.64,-32.59,-1);
    chandelier(21.43,-35.45);
    for(const [x,z] of [[18.25,-33.00],[24.46,-33.00]]){
      table(x,z,2.14,.59,.452);box('wine',x,.474,z,2.00,.068,.47);
      for(let j=0;j<8;j++)bead('brass',x-.86+j*.245,.503,z-.241,.009);
    }
    for(const x of [18.92,25.04]){
      craft.sideTable(x,-38.11,1.79,.66,.855,'velvetBlue');
      craft.helmet(x-.53,.876,-38.05,true);craft.helmet(x+.49,.876,-38.05);
      craft.armorial(x,1.971,-38.405,1.57,1.04);
      craft.rapier(x-.161,1.708,-38.273,-.49,'velvetBlue');
      craft.rapier(x+.161,1.715,-38.231,.49,'velvetRed');
      box('brass',x,.875,-37.903,.184,.013,.073);
      brassToken(x+.076,.882,-38.18);
    }
    frame('salle',21.30,1.82,-32.617,1.66,.73,pi);
    for(const x of [17.88,24.9])banner(x,1.748,-32.661,.91,1.39,pi);
    for(const x of [17.52,21.22,26.08])lamp(x,1.94,-38.49);
    lamp(19.97,1.978,-32.636,-1);lamp(22.77,1.978,-32.636,-1);
  }else if(id==='archive'){
    shelf(20.70,-45.49,2.90,.48);shelf(25.57,-45.49,1.99,.48);
    shelf(20.50,-41.66,2.08,.63);
    craft.sideTable(25.17,-42.21,2.39,.89,.916,'velvetBlue');
    props.folio(24.82,F+.941,-42.15,.39,.273,.41,0,{loose:true,thickness:.014});
    props.folio(25.73,F+.941,-42.31,.371,.246,2.87,2,{loose:false,thickness:.038});
    candle(24.23,.94,-42.40,.174);candle(25.86,.94,-42.40,.118);
    cylinder('brass',25.46,1.019,-42.269,.046,.14);
    cylinder('soot',25.46,1.085,-42.269,.028,.012);
    for(let i=0;i<4;i++)box(i%2?'bookC':'bookA',25.86,1.002+i*.032,-42.14,.29,.029,.174);
    frame('archive',19.20,1.762,-43.84,1.28,.89,pi/2);
    frame('dynasty',19.20,1.779,-39.80,1.22,.95,pi/2);
    frame('duel',23.52,2.378,-45.57,1.12,.219);
    brassToken(25.02,.942,-42.43);brassToken(25.15,.942,-42.39);
    frame('banned',26.61,1.805,-40.90,1.32,.902,-pi/2);
    lamp(20.44,2.20,-45.64);lamp(25.38,2.20,-45.64);
    carpet(23.10,-43.41,1.42,2.95,'wine');
  }else if(id==='duel'){
    // Open floor for the scene's ritual, separate from the display gallery.
    // A border within the continuous parquet makes the centre readable.
    const X=21.65,Z=-50.86;
    const w=.89,P=(x,z)=>[x,F+.016,z];
    for(let i=0;i<11;i++)for(let j=0;j<10;j++){
      const x=16.76+i*w,z=-55.38+j*w,dir=(i+j)%2===0,n=5;
      for(let stripe=0;stripe<n;stripe++){
        const m=(i+j+stripe)%5?'parquetAmber':'parquetDeep',a=stripe*w/n+.0017,A=(stripe+1)*w/n-.0014;
        if(dir)k.quad(m,P(x+.002,z+A),P(x+w-.002,z+A),P(x+w-.002,z+a),P(x+.002,z+a),1.11,(stripe+j)%4*.173);
        else k.quad(m,P(x+a,z+.002),P(x+a,z+w-.002),P(x+A,z+w-.002),P(x+A,z+.002),1.11,(stripe+i)%4*.191);
      }
    }
    for(const s of [-1,1]){
      box('darkWood',X+s*1.672,.018,Z,.094,.006,7.05);
      box('piping',X+s*1.587,.020,Z,.012,.008,6.95);
      box('darkWood',X,.018,Z+s*3.489,3.25,.006,.102);
      box('piping',X,.021,Z+s*3.403,3.174,.008,.015);
    }
    for(const z of [Z-2.96,Z+2.96]){
      const a=.102,x=X;
      line('brass',[[x-a,.026,z],[x,.026,z+a],[x+a,.026,z],[x,.026,z-a],[x-a,.026,z]],.007);
    }
    wainscot(16.48,22.52,-45.90,-1);wainscot(24.52,26.90,-45.90,-1);
    wainscot(16.34,20.17,-55.78);wainscot(22.85,26.94,-55.78);
    for(const s of [-1,1]){
      const x=X+s*4.57;
      const wallx=s<0?16.315:26.975;
      sidePanels(-55.63,-46.06,wallx,-s);
      for(const z of [-52.80,-49.77]){
        craft.bench(x,z,s);
      }
      banner(wallx,2.22,-51.20,.96,1.46,-s*pi/2);
      for(const z of [-53.48,-49.10]){
        box('stone3',wallx,1.345,z,.160,.842,.218);
        box('honedMarble',wallx-s*.079,1.418,z,.039,.695,.168);
        for(const y of [1.364,2.128])box('inlayGold',wallx-s*.083,y,z,.059,.031,.194);
      }
      frame('seats',wallx,1.81,-48.30,1.13,.55,-s*pi/2);
    }
    // End wall ends at the vault's springing line; even the metal finials
    // stay below the projecting stone cornice (2.444 m).
    frame('duel',25.36,1.856,-55.773,1.91,.702,0,true);
    frame('descent',21.52,2.303,-55.68,1.985,.207,0,true);
    banner(18.02,1.775,-55.751,.99,1.172);
    for(const [s,x] of [[-1,19.63],[1,23.67]]){
      box('darkWood',x,.09,-55.72,.254,1.96,.167);
      box('wood',x,.91,-55.616,.201,.973,.064);
      box('brass',x,1.991,-55.595,.222,.076,.046);
      for(let j=0;j<4;j++){
        const X=x-.071+j*.047;
        rod('brass',X,1.019,-55.58,X,1.792,-55.58,.008);
      }
      const curl=Array.from({length:12},(_,i)=>{const a=i*.36;return [x+s*Math.sin(a)*(.109-i*.005),2.17+Math.cos(a)*(.109-i*.005),-55.64];});
      line('brass',curl,.011);
      bead('brass',x,2.18,-55.635,.033,.044,.018);
    }
    for(const x of [18.03,25.25]){
      craft.sideTable(x,-54.87,1.33,.64,.85);craft.helmet(x-.253,.875,-54.83,x<20);
      props.folio(x+.28,F+.877,-54.84,.225,.179,.21,3,{loose:true,thickness:.012});
      candle(x+.31,.873,-55.05,.147);
    }
    for(const x of [20.9,22.4])lamp(x,2.01,-45.94,-1);
    chandelier(X,-48.73);chandelier(X,-53.10);
  }else{
    carpet(12.68,-38.61,5.22,2.90,'velvetRed');
    wainscot(9.45,15.67,-42.77);
    sidePanels(-42.70,-34.52,9.42,1);
    chandelier(12.73,-38.55);
    craft.throne(9.94,-38.93);
    craft.armorial(9.44,1.764,-38.93,1.29,1.84,pi/2,true);
    for(const z of [-39.86,-38.0]){
      box('honedMarble',9.56,.062,z,.295,.231,.303);
      cylinder('honedMarble',9.52,1.32,z,.104,2.062);
      for(let j=0;j<7;j++){
        const a=(j-3)*.34,x=9.52+.099*Math.cos(a),Z=z+.099*Math.sin(a);
        rod('stone3',x,.335,Z,x,2.252,Z,.010);
      }
      cylinder('inlayGold',9.52,2.308,z,.13,.035);
      box('stone3',9.51,2.353,z,.27,.104,.266);
    }
    banner(9.51,2.24,-40.83,.92,1.50,pi/2);banner(9.51,2.23,-37.02,.92,1.5,pi/2);
    for(const z of [-41.05,-36.71]){
      craft.sideTable(10.56,z,.92,.88,.78);
      const x=10.62,Z=z+.18;
      cylinder('walnut',x,.812,Z,.116,.026);cylinder('inlayGold',x,.902,Z,.034,.173);
      for(let j=0;j<3;j++){
        const a=j*2*pi/3,x0=x+.142*Math.cos(a),z0=Z+.142*Math.sin(a);
        line('inlayGold',[[x,.923,Z],[(x+x0)*.5,.931,(Z+z0)*.5],[x0,1.016,z0],[x0,1.103,z0]],.014);
        candle(x0,1.094,z0,.112+j*.035);
      }
    }
    box('wine',10.60,.795,-41.05,.40,.028,.33);
    cylinder('brass',10.60,.855,-41.05,.117,.042);
    for(let i=0;i<5;i++){
      const a=i*2*pi/5,x=10.60+.112*Math.cos(a),z=-41.05+.112*Math.sin(a);
      rod('brass',x,.867,z,x,.947,z,.017);bead('wine',x,.944,z,.017,.020,.017);
    }
    for(const x of [12.38,14.52]){
      craft.sideTable(x,-35.00,1.70,.67,.45,'velvetBlue');box('velvetBlue',x,.476,-35.00,1.53,.058,.52);
    }
    frame('decree',12.77,1.75,-42.72,1.67,1.05);
    frame('dynasty',15.12,1.85,-42.73,1.13,.89);
    lamp(11.31,1.91,-42.73);lamp(14.19,1.91,-42.73);lamp(13.63,2.04,-34.45,-1);
  }
  props.finish('Eiserne Krone · Papiere');craft.dispose();for(const g of [ball,pin,ring])g.dispose();
}
