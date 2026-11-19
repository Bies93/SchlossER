import {CLUB_FLOOR as F} from './lab-layout.js';
import {randomSource} from './surface-detail.js';

export function schankCraft(T,kit,{bx,cyl,bar,tor}){
  const {obj,k}=kit,pi=Math.PI,rng=randomSource(27158),small=new T.SphereGeometry(1,8,5);
  const grain=(m,x,y,z,w,h,d)=>obj(m,small,x,F+y,z,w,h,d);
  const lathe=(points,n)=>new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),n);
  const krug=lathe([[.001,0],[.069,0],[.075,.012],[.068,.034],[.072,.058],[.073,.083],[.072,.106],[.073,.130],[.072,.154],[.073,.163],[.073,.189],[.069,.193],[.066,.19],[.066,.037],[.059,.018],[.001,.018]],32);
  // Pressed vertical flutes refract the silhouette without transmissive framebuffers.
  const kp=krug.attributes.position;
  for(let i=0;i<kp.count;i++){
    const x=kp.getX(i),z=kp.getZ(i),y=kp.getY(i);
    if(y>.03&&y<.17){const a=Math.atan2(x,z),row=Math.round((y-.034)/.024),f=1-.086*Math.max(0,Math.cos(8*a+(row%2)*pi/2));
      kp.setXYZ(i,x*f,y,z*f);}
  }krug.computeVertexNormals();
  const bottle=lathe([[.001,0],[.88,0],[1,.04],[1,.59],[.97,.65],[.73,.72],[.38,.77],[.38,.91],[.46,.92],[.46,.958],[.36,.966]],16);
  const font=lathe([[.94,0],[1,.025],[.98,.07],[.71,.115],[.66,.18],[.74,.23],[.71,.32],[.48,.64],[.52,.72],[.83,.82],[.78,.90],[.47,.97],[.13,1]],24);
  const pedestal=lathe([[.01,0],[.92,0],[1,.025],[.99,.049],[.91,.065],[.62,.08],[.36,.105],[.25,.14],[.21,.25],[.18,.8],[.20,.91],[.55,.96],[.61,1]],24);
  const pad=lathe([[.01,0],[.83,0],[1,.19],[1,.69],[.93,.90],[.69,.98],[.001,1]],28);
  const jewel=lathe([[.01,0],[.79,.02],[.98,.24],[.95,.32],[.78,.64],[.59,.91],[.48,1],[.01,1]],10);
  function wrap(i,point,segments=1){
    const L=(i%2)*.5+.006,R=L+.488,B=1-((i>>1)+1)*.5+.01,H=B+.48;
    for(let q=0;q<segments;q++){
      const a=q/segments,b=(q+1)/segments,A=point(a,0),D=point(a,1),B0=point(b,0),C=point(b,1),u=L+a*(R-L),v=L+b*(R-L);
      k.triangle('hopLabel',A,B0,C,[u,B,v,B,v,H]);k.triangle('hopLabel',A,C,D,[u,B,v,H,u,H]);
    }
  }
  function mug(x,y,z,id=0){
    cyl('fileKraft',x,y+.003,z,.091,.006);
    y+=.006;const height=.121+.033*rng(),handle=(id%2?-.88:1.1)+rng()*.36;
    obj('hopGlass',krug,x,F+y,z,1,1,1);
    cyl(id%3===1?'deepBeer':'hopHoney',x,y+.02+height/2,z,.063,height);
    cyl('foam',x,y+.025+height,z,.065,.016);
    for(let n=0;n<10;n++){const a=n*.91,r=.052*Math.sqrt(rng());grain('foam',x+Math.cos(a)*r,y+height+.029+rng()*.005,z+Math.sin(a)*r,.017+rng()*.012,.007+rng()*.008,.017);}
    for(const h of [.012,.19])tor('hopGlint',x,y+h,z,h>.1?.071:.069,0,pi/2);
    for(let n=0;n<13;n++){const a=rng()*2*pi,r=.0635,h=.026+rng()*(height-.01);
      grain('foam',x+Math.cos(a)*r,y+h,z+Math.sin(a)*r,.0018,.0026,.0018);}
    wrap(id%3,(s,v)=>{const a=(.5-s)*.89+.25;return [x+.076*Math.cos(a),F+y+.103+.034*v,z+.076*Math.sin(a)];},4);
    let last;for(const [r,h] of [[.065,.157],[.096,.163],[.116,.141],[.119,.090],[.102,.059],[.067,.058]]){
      const P=[x+Math.cos(handle)*r,y+h,z+Math.sin(handle)*r];if(last)bar('hopGlint',...last,...P,.009);last=P;
    }
  }
  function flasche(x,y,z,i){
    const size=[.92,1.04,.81,1.12][i%4],r=.052*size,h=.306*size;
    obj(i%4===0?'hopEmerald':'beerGlass',bottle,x,F+y,z,r,h,r);
    cyl('brass',x,y+h*.977,z,r*.47,.015);
    wrap(i%3,(s,v)=>{const a=(.5-s)*pi*1.47;return [x+(r+.0014)*Math.cos(a),F+y+h*(.17+.33*v),z+(r+.0014)*Math.sin(a)];},9);
  }
  function tap(x,y,z,i){
    obj(i===1?'copper':'porcelain',font,x,F+y,z,.122,.52,.122);
    for(const [h,r] of [[.029,.124],[.115,.083],[.39,.088],[.441,.101]])tor('brass',x,y+h,z,r,0,pi/2);
    bar('brass',x+.062,y+.30,z,x+.183,y+.30,z,.033);
    bar('edge',x+.183,y+.30,z,x+.208,y+.242,z,.026);
    bar('brass',x+.208,y+.242,z,x+.208,y+.204,z,.017);
    bar('gray',x+.161,y+.318,z,x+.116,y+.49,z,.012);
    grain('darkWood',x+.111,y+.50,z,.029,.056,.028);
    bar('brass',x,y+.49,z,x,y+.585,z,.024);
    grain('brass',x,y+.624,z,.035,.109,.149);
    for(const side of [-1,1]){
      wrap(i,(s,v)=>[x+side*.034,F+y+.577+v*.093,z+side*(.105-.210*s)]);
    }
  }
  function stool(x,z){
    obj('gunmetal',pedestal,x,F+.006,z,.234,.693,.234);
    for(const [y,r] of [[.048,.219],[.125,.062],[.60,.049],[.671,.090]])tor('brass',x,y,z,r,0,pi/2);
    tor('brass',x,.285,z,.174,0,pi/2);
    for(let n=0;n<3;n++){const a=2*pi*n/3;bar('gunmetal',x,.302,z,x+.173*Math.cos(a),.285,z+.173*Math.sin(a),.014);}
    obj('hopVelvet',pad,x,F+.697,z,.246,.134,.246);
    tor('leather',x,.782,z,.243,0,pi/2);tor('copperDark',x,.72,z,.238,0,pi/2);
    for(let j=0;j<12;j++){const a=j*pi/6;grain('brass',x+.242*Math.sin(a),.744,z+.242*Math.cos(a),.006,.006,.006);}
  }
  function lamp(x,y,z){
    obj('brass',pedestal,x,F+y,z,.098,.124,.098);
    obj('barGlow',jewel,x,F+y+.121,z,.122,.147,.122);
    tor('copperDark',x,y+.153,z,.119,0,pi/2);tor('brass',x,y+.255,z,.067,0,pi/2);
    for(let j=0;j<10;j++){const a=j*pi/5,X=Math.cos(a),Z=Math.sin(a);
      bar('copperDark',x+.119*X,y+.16,z+.119*Z,x+.061*X,y+.263,z+.061*Z,.004);}
    grain('brass',x,y+.278,z,.025,.017,.025);
  }
  return {mug,flasche,tap,stool,lamp,grain,dispose(){for(const g of [small,krug,bottle,font,pedestal,pad,jewel])g.dispose();}};
}
