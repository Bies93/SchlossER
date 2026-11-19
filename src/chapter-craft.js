import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Local display geometry only. Stylised replicas, not functional models.
export function chapterCraft(T,{k,F,room,mesh,box,rod,line,bead,cylinder,foot,ring},cloth){
  const pi=Math.PI;
  const lathe=(p,n=24)=>new T.LatheGeometry(p.map(([r,y])=>new T.Vector2(r,y)),n);
  const leg=lathe([[0,0],[.73,0],[1,.04],[.98,.10],[.65,.136],[.55,.27],[.60,.53],[.88,.69],[.89,.74],[.61,.80],[.74,.88],[1,.90],[1,1],[0,1]]);
  const base=lathe([[0,0],[.88,0],[1,.11],[1,.28],[.87,.36],[.68,.43],[.56,.53],[.37,.67],[.36,.91],[.52,.96],[.49,1],[0,1]]);
  const cushion=new RoundedBoxGeometry(1,1,1,2,.19);
  function loft(rows,n){
    const p=[],uv=[],idx=[];
    for(let j=0;j<rows.length;j++){
      const [y,w,d,z,brow=0]=rows[j];
      for(let i=0;i<=n;i++){
        const a=i*2*pi/n,f=Math.max(0,Math.cos(a)),v=Math.abs(Math.sin(a));
        p.push(Math.sin(a)*w,y+brow*(1-v)*f,z+Math.cos(a)*d);
        uv.push(i/n,j/(rows.length-1));
        if(i&&j){
          const t=j*(n+1)+i,back=t-n-1;
          idx.push(back-1,back,t,back-1,t,t-1);
        }
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const helmetA=loft([[.095,.066,.074,.008],[.101,.119,.122,-.005],[.133,.155,.157,-.01],
    [.199,.148,.154,-.003],[.275,.168,.177,0],[.348,.169,.167,-.006],
    [.404,.142,.147,-.009],[.45,.103,.120,-.012],[.472,.061,.080,-.015],[.484,.0001,.0001,-.015]],32);
  const helmetB=loft([[.127,.089,.093,-.021],[.151,.135,.143,-.021,-.021],[.190,.159,.180,-.029,-.045],
    [.242,.158,.172,-.017,-.028],[.315,.163,.174,-.013],[.364,.146,.155,-.021],
    [.406,.120,.135,-.025],[.435,.080,.102,-.026],[.453,.0001,.0001,-.024]],32);
  function helmet(x,y,z,variant=false){
    mesh('walnut',base,x,y,z,.198,.145,.198);
    cylinder('inlayGold',x,y+.029,z,.178,.012);
    mesh(variant?'displayBlack':'displaySteel',variant?helmetA:helmetB,x,y,z,1,1,1);
    const Z=(u,a)=>z+.133+.067*Math.sqrt(Math.max(0,1-u*u))+(a===1?.027:0);
    const Y=(u,a)=>y+(variant?[.18,.26,.302,.382]:[.205,.280,.311,.355])[a]-(a<2?.013:.043)*u*u;
    const visor=(a,b,key)=>{
      for(let j=0;j<20;j++){
        const u=-1+j*.1,v=u+.1;
        const p=(u,l)=>[x+u*.145,F+Y(u,l),Z(u,l)];
        k.quad(key,p(u,a),p(v,a),p(v,b),p(u,b),.24);
      }
    };
    visor(0,1,'displayBlack');visor(1,2,'soot');visor(2,3,'displaySteel');
    for(const l of [0,2,3])line(l===3?'displaySteel':'displayBlack',Array.from({length:17},(_,i)=>{
      const a=-1+i/8;return [x+a*.145,Y(a,l),Z(a,l)+.003];
    }),l===3?.009:.005);
    for(const s of [-1,1]){
      const u=x+s*.151;
      rod('displayBlack',u,y+.305,z+.099,u+s*.021,y+.305,z+.099,.031);
      rod('inlayGold',u+s*.021,y+.305,z+.099,u+s*.028,y+.305,z+.099,.021);
      for(let j=0;j<6;j++){
        const a=-.66+j*.115;
        const q=s*a;
        const h=y+.211+j*.005;
        rod('soot',x+q*.145,h,Z(q,0)+.014,x+q*.145,h+.020,Z(q,0)+.023,.0032);
      }
    }
    if(variant){
      // Sculpted comb following the crown, with individually shaped flutes.
      const crest=[[0,.363,.139],[0,.473,.073],[0,.516,-.012],[0,.484,-.094],[0,.365,-.155]];
      const p=crest.map(([u,h,d])=>[x+u,y+h,z+d]);
      line('displayBlack',p,.018);
      line('inlayGold',p.map(([X,Y,Z])=>[X-.012,Y+.01,Z]),.005);
      line('inlayGold',p.map(([X,Y,Z])=>[X+.012,Y+.01,Z]),.005);
    }else{
      const ridge=Array.from({length:15},(_,i)=>{const a=-1+i/7;return [x+.144*a,y+.354-.023*a*a,Z(a,3)+.003];});
      line('inlayGold',ridge,.005);
    }
  }
  function armorial(x,y,z,w,h,angle=0,curtain=false){
    const g=new T.PlaneGeometry(w,h,36,26),p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const u=uv.getX(i),v=uv.getY(i),f=1-v;
      p.setXYZ(i,p.getX(i),p.getY(i)-.042*f*Math.cos(pi*(u-.5)*2)-.012*f*Math.sin(u*37),
        .016*Math.sin(u*34)+.032*f*Math.sin(u*15)+(curtain?.032*Math.sin(u*9):0));
    }
    g.computeVertexNormals();
    const o=new T.Mesh(g,cloth);o.name='Eiserne Krone · bestickter Wappenbehang';o.position.set(x,F+y,z);o.rotation.y=angle;room.add(o);
    const dx=Math.cos(angle),dz=-Math.sin(angle),P=(u,h,d)=>[x+u*dx+d*Math.sin(angle),h,z+u*dz+d*Math.cos(angle)];
    rod('walnut',...P(-w*.59,y+h*.512,0),...P(w*.59,y+h*.512,0),.026);
    rod('inlayGold',...P(-w*.59,y+h*.516,.019),...P(w*.59,y+h*.516,.019),.012);
    for(const s of [-1,1]){
      bead('inlayGold',...P(s*w*.60,y+h*.515,0),.034);
      for(const u of [w*.23,w*.39])rod('displayBlack',...P(s*u,y+h*.501,0),...P(s*u,y+h*.502,-.120),.014);
      for(let j=0;j<17;j++){
        const u=(j-8)*w*.029*s;
        const rip=.016*Math.sin((u/w+.5)*34)+.032*Math.sin((u/w+.5)*15);
        rod('damaskGold',...P(u,y-h*.518,rip),...P(u+.006,y-h*.544-(j%3)*.004,rip+.011),.005);
      }
    }
  }
  function rapier(x,y,z,angle,tint){
    const c=Math.cos(angle),s=Math.sin(angle),
      P=(u,h,d=0)=>[x+c*u-s*h,y+s*u+c*h,z+d],
      A=(u,h,d=0)=>{const p=P(u,h,d);p[1]+=F;return p;};
    const blade=[[.05,.021,.011],[.13,.019,.010],[.39,.012,.008],[.68,.005,.004],[.786,.0008,.0008]];
    for(let i=1;i<blade.length;i++){
      const [t,h,r]=blade[i-1],[T,H,R]=blade[i];
      for(const side of [-1,1]){
        const front=[A(0,t,r),A(side*h,t,0),A(side*H,T,0),A(0,T,R)];
        const back=[A(side*h,t,0),A(0,t,-r*.5),A(0,T,-R*.5),A(side*H,T,0)];
        k.quad(side<0?'displaySteel':'displayBlack',...(side<0?front.reverse():front),.56);
        // The asset has a closed back, not a single unlit triangle.
        k.quad('displayBlack',...(side<0?back.reverse():back),.56);
      }
    }
    rod('inlayGold',...P(0,.035),...P(0,.082),.029);
    for(const side of [-1,1])line('inlayGold',[[0,.045,0],[side*.059,.038,.014],[side*.089,.059,.032],[side*.110,.082,.033],[side*.121,.110,.018]].map(p=>P(...p)),.009);
    const loop=Array.from({length:16},(_,i)=>{const a=i/15*pi;return P(.054*Math.sin(a),.03-.165*i/15,.015+.043*Math.sin(a));});
    line('inlayGold',loop,.010);rod(tint,...P(0,.03),...P(0,-.143),.019);
    for(let i=0;i<9;i++)rod('brass',...P(-.018,-.010-.012*i,.006),...P(.018,-.020-.012*i,.006),.0027);
    bead('inlayGold',...P(0,-.157,.004),.026,.037,.026);
    for(const h of [.203,.447])rod('displayBlack',...P(0,h,-.096),...P(0,h,-.006),.011);
  }
  function sideTable(x,z,w,d,h=.78,shade='velvetRed'){
    box('walnut',x,h-.068,z,w+.026,.048,d+.033);
    mesh('polishedWood',cushion,x,h-.014,z,w,.056,d);
    box(shade,x,h+.017,z,w*.62,.004,d*.70);
    for(const s of [-1,1]){
      for(const t of [-1,1]){
        const X=x+s*(w*.5-.098),Z=z+t*(d*.5-.103);
        mesh('walnut',leg,X,.022,Z,.067,h-.115,.067);
        cylinder('inlayGold',X,.117,Z,.057,.024);
      }
      const Z=z+s*(d*.5-.031);
      box('walnut',x,h-.205,Z,w*.88,.127,.062);
      const d0=s*.039;
      rod('inlayGold',x-w*.37,h-.18,Z+d0,x+w*.37,h-.18,Z+d0,.006);
      rod('inlayGold',x-w*.34,h-.104,Z+d0,x+w*.34,h-.104,Z+d0,.005);
      bead('brass',x,h-.137,Z+d0,.021,.017,.011);
    }
    foot(x,z,w+.026,d+.033);
  }
  function throne(x,z){
    const U=(u,h,d=0)=>[x+d,h,z-u],O=(m,g,u,h,d,w,H,D)=>mesh(m,g,...U(u,h,d),w,H,D,0,pi/2);
    const post=(m,u,h,d,a,b,r)=>rod(m,...U(u,h,d),...U(u,a,b),r);
    const pad=(m,u,h,d,w,H,D)=>O(m,cushion,u,h,d,w,H,D);
    // Profiled dais, with a recessed darker riser below the stone nosing.
    for(const [y,w,d] of [[.013,2.41,1.61],[.159,2.03,1.30]]){
      box('walnut',x+.18,y,z,d,.032,w);
      box('honedMarble',x+.15,y+.032,z,d-.062,.096,w-.061);
      mesh('honedMarble',cushion,x+.15,y+.136,z,d+.006,.038,w+.008);
      rod('inlayGold',x+.18+d*.485,y+.089,z-w*.455,x+.18+d*.485,y+.089,z+w*.455,.008);
    }
    foot(x+.15,z,1.66,2.45);
    for(const s of [-1,1]){
      for(const d of [.03,.78]){
        O('walnut',leg,s*.50,.321,d,.086,.381,.088);
        post('inlayGold',s*.50,.38,d,.402,d,.063);
      }
      O('walnut',leg,s*.52,.70,.052,.112,1.63,.109);
      bead('inlayGold',...U(s*.52,2.38,.052),.057,.092,.057);
      post('walnut',s*.501,.59,.768,1.016,.768,.056);
      line('walnut',[[s*.52,1.092,.106],[s*.55,1.068,.39],[s*.53,1.021,.64],[s*.51,1.013,.83],[s*.50,1.079,.91]].map(p=>U(...p)),.057);
      bead('inlayGold',...U(s*.50,1.082,.903),.046,.060,.049);
    }
    pad('walnut',0,.615,.445,1.06,.184,.936);
    pad('velvetRed',0,.732,.452,.890,.148,.745);
    for(const a of [-1,1])rod('inlayGold',...U(a*.435,.727,.093),...U(a*.435,.727,.799),.007);
    const g=new T.PlaneGeometry(.842,1.298,42,42),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const u=p.getX(i),v=p.getY(i),h=.344+v*.032;
      const edge=Math.min(1,(.423-Math.abs(u))/.074,(.652-Math.abs(v))/.067);
      const a=pi*(u/.205+v/.203),b=pi*(u/.205-v/.203);
      p.setXYZ(i,u,v+.072*Math.cos(u/ .422*pi/2)*(v+.650)/1.3,h+edge*(.030+.038*Math.abs(Math.sin(a)*Math.sin(b))));
    }
    g.computeVertexNormals();O('velvetRed',g,0,1.421,0,1,1,1);g.dispose();
    pad('walnut',0,1.432,.198,1.007,1.39,.247);
    for(const s of [-1,1]){
      post('inlayGold',s*.427,.77,.354,2.05,.361,.012);
      const crown=Array.from({length:15},(_,j)=>{const t=j/14*pi*.5;return U(s*.50*Math.cos(t),2.047+.269*Math.sin(t),.353+.01*Math.sin(t));});
      line('walnut',crown,.044);line('inlayGold',crown.map(([x,y,z])=>[x+.042,y-.002,z]),.012);
    }
    for(let j=-3;j<=3;j++)for(const t of [-1,1]){
      bead('inlayGold',...U(t*.193,1.410+j*.159,.410),.010,.011,.011);
    }
    const badge=[[0,2.432,.38],[-.079,2.283,.40],[0,2.229,.42],[.079,2.283,.40],[0,2.432,.38]];
    line('inlayGold',badge.map(p=>U(...p)),.013);
    bead('velvetBlue',...U(0,2.327,.402),.025,.057,.043);
  }
  function bench(x,z,side){
    // Separate sprung seat, padded back and turned supports distinguish it
    // from the adjacent panelling. The silhouette is legible from the floor.
    mesh('walnut',cushion,x,.378,z,.641,.136,2.87);
    mesh('velvetBlue',cushion,x-side*.030,.478,z,.569,.103,2.68);
    const x0=x+side*.245;
    mesh('walnut',cushion,x0,.830,z,.127,.643,2.87);
    for(let j=0;j<9;j++){
      const Z=z-1.192+j*.298;
      mesh('velvetRed',cushion,x0-side*.084,.836,Z,.155,.420,.301);
      bead('inlayGold',x0-side*.165,.870,Z,.009,.010,.010);
    }
    for(const [h,d] of [[.439,-.303],[1.121,side*.19]]){
      rod('inlayGold',x+d,h,z-1.36,x+d,h,z+1.36,.007);
    }
    for(const s of [-1,1]){
      for(const t of [-1,1])mesh('walnut',leg,x+s*.199,.025,z+t*1.20,.067,.342,.067);
      bead('inlayGold',x0,1.173,z+s*1.37,.029);
    }
    foot(x,z,.66,2.92);
  }
  return {helmet,armorial,rapier,sideTable,throne,bench,dispose(){for(const g of [base,leg,cushion,helmetA,helmetB])g.dispose();}};
}
