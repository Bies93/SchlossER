import {architectureKit} from './architecture-kit.js';
import {ageMasonry,randomSource,sharedSet} from './surface-detail.js';
import {ORANGERY_END_PIER,ORANGERY_HALL as hall,orangeryWingPoints as wing,ORANGERY_SECTIONS as sections} from './orangery-plan.js';
import {orangeryCarvings} from './orangery-carving.js';

const eave=6.45,attic=.71;
const mainSweep={points:[...wing(1).slice(0,-1),...hall,...wing(-1).slice(1)],depth:8.45};

function tileMap(T){
  const canv=document.createElement('canvas');canv.width=canv.height=512;
  const c=canv.getContext('2d'),rng=randomSource(813217);
  // Scaled to a little over two metres per repeat, eight staggered courses.
  c.fillStyle='#593726';c.fillRect(0,0,512,512);
  const w=51.2,h=64;
  for(let j=-1;j<8;j++){
    const y=j*h, shift=(j%2===0?0:.5)*w;
    for(let i=-1;i<10;i++){
      const x=i*w+shift, tone=(((i%10+10)%10*31+(j+8)%8*19)%23)-11;
      const g=c.createLinearGradient(x,y,x+w,y+h);
      g.addColorStop(0,`rgb(${148+tone} ${67+tone} ${38+tone})`);
      g.addColorStop(.43,`rgb(${184+tone} ${94+tone} ${60+tone})`);
      g.addColorStop(.78,`rgb(${191+tone} ${99+tone} ${62+tone})`);
      g.addColorStop(1,`rgb(${116+tone} ${58+tone} ${38+tone})`);
      c.fillStyle=g;c.beginPath();c.moveTo(x+1,y);c.lineTo(x+w-1.3,y);
      c.lineTo(x+w-1.3,y+h*.61);c.quadraticCurveTo(x+w-1.4,y+h*.96,x+w*.5,y+h-1);
      c.quadraticCurveTo(x+1,y+h*.96,x+1,y+h*.61);c.fill();
      c.strokeStyle='#ecae6d66';c.lineWidth=1.15;c.beginPath();c.moveTo(x+2.6,y+3);
      c.lineTo(x+2.7,y+h*.65);c.quadraticCurveTo(x+3,y+h*.91,x+w*.46,y+h-3);c.stroke();
    }
  }
  for(let i=0;i<14400;i++){
    c.fillStyle=i%2?'#ffe6b51d':'#4e30271e';c.fillRect(rng()*512,rng()*512,.55+rng()*2.2,.52+rng()*2.0);
  }
  const map=new T.CanvasTexture(canv);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}

function reflectedGlass(T,color){
  const material=new T.MeshStandardMaterial({color,roughness:.28,metalness:.54,envMapIntensity:1.08});
  material.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 orangeryP;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\norangeryP=(modelMatrix*vec4(position,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 orangeryP;')
      .replace('#include <color_fragment>',`#include <color_fragment>
       float cloud=clamp((orangeryP.y-.8)*.18,0.,1.);
       float strip=sin(orangeryP.z*1.22+orangeryP.x*1.53);
       float canopy=sin(orangeryP.z*3.18+orangeryP.x*2.11)*sin(orangeryP.y*2.8+orangeryP.z*.36);
       float shadow=smoothstep(-.12,.49,strip*.49+canopy*.29);
       diffuseColor.rgb*=mix(vec3(.65,.68,.57),vec3(.95,1.06,1.12),cloud);
       diffuseColor.rgb+=vec3(.023,.034,.039)*cloud*(1.-shadow);
      `);
  };
  material.customProgramCacheKey=()=> 'orangerie-glass-1';return material;
}

export function addOrangery(T,parent,world,finish){
  const g=new T.Group();g.name='Orangerie · barocke Fassaden und Mansarddächer';parent.add(g);
  const plaster=new T.MeshStandardMaterial({...sharedSet(T,'galleryLime',512),color:0xe2b85f,roughness:.93});
  plaster.normalScale.setScalar(.47);ageMasonry(plaster,.29);
  const stone=finish('SANDSTONE_CUT').clone();stone.vertexColors=false;stone.color.setHex(0xebcb86);
  const pale=stone.clone();pale.color.setHex(0xf1d992);
  const shade=stone.clone();shade.color.setHex(0xb39560);ageMasonry(shade,.27);
  const foot=finish('SANDSTONE_DARK').clone();foot.vertexColors=false;foot.color.setHex(0xad9a79);
  const rough=(color,n=.86,metalness=0)=>new T.MeshStandardMaterial({color,roughness:n,metalness});
  const tiles=new T.MeshStandardMaterial({map:tileMap(T),roughness:.86,side:T.DoubleSide});
  const altTile=tiles.clone();altTile.color.setHex(0xd8cabc);
  const kit=architectureKit(T,g,{plaster,stone,pale,shade,foot,tiles,altTile,
    terra:rough(0x8e4832,.85),iron:rough(0x5f564a,.65,.42),sash:rough(0x777e75,.72),
    sashEdge:rough(0x9da494,.66),lead:rough(0x828a85,.68),dark:rough(0x302b24),brass:rough(0xaa8450,.57,.54),
    glass:{material:reflectedGlass(T,0x454e52),cast:false},glass2:{material:reflectedGlass(T,0x373f42),cast:false}});
  const {box,quad,triangle}=kit,theCarvings=orangeryCarvings(T,g);
  function frame(a,b){
    const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;
    return {L,p:(u,y,d)=>[a[0]+ux*u-uz*d,y,a[1]+uz*u+ux*d]};
  }
  function bar(p,m,x,y,u,v,thick,d,protrusion=.024){
    const L=Math.hypot(u-x,v-y);if(L<.005)return;
    const a=(u-x)/L,b=(v-y)/L,local=(s,t,e)=>p(x+a*s-b*t,y+b*s+a*t,e);
    box(m,local,0,L,-thick/2,thick/2,d-protrusion,d+protrusion);
  }
  const quadAt=(m,p,x,X,y,Y,d)=>quad(m,p(x,y,d),p(X,y,d),p(X,Y,d),p(x,Y,d),1.38);
  function ring(p,m,x,y,rx,ry,w,d,start=0,end=Math.PI,n=24){
    const pt=(a,b=0)=>p(x+Math.cos(a)*(rx+b),y+Math.sin(a)*(ry+b),d);
    for(let i=0;i<n;i++){
      const a=end-(end-start)*i/n,b=end-(end-start)*(i+1)/n;
      quad(m,pt(a),pt(b),pt(b,w),pt(a,w),.52,(i%3)*.11);
    }
  }
  function trimBay(p,lo,hi,y,Y){
    // Re-entrant baroque casing: thicker shoulders, thin stepped ears.
    for(const [i,d,t,m] of [[0,.047,.136,'shade'],[1,.086,.096,'stone'],[2,.116,.040,'pale']]){
      const l=lo-t,r=hi+t,shoulder=.096+i*.017,h=Y+.05+i*.021;
      for(const [s,a] of [[-1,l],[1,r]]){
        bar(p,m,a,y,a,h-.19,t,d,.036);
        bar(p,m,a,h-.19,a+s*shoulder,h-.19,t,d+.002,.036);
        bar(p,m,a+s*shoulder,h-.19,a+s*shoulder,h,t,d+.004,.036);
      }
      bar(p,m,l-shoulder,h,r+shoulder,h,t,d,.037);
    }
    box('pale',p,(lo+hi)/2-.155,(lo+hi)/2+.155,Y+.098,Y+.177,.084,.164);
  }
  function panes(p,lo,hi,sill,spring,arch,index){
    const mid=(lo+hi)/2,w=(hi-lo)/2,gap=hi-lo,low=sill+.47,rib=w>.83?.039:.027,
      depth=-.153,glass=index%3===1?'glass2':'glass';
    quadAt(glass,p,lo,hi,low,spring,depth);
    if(arch){
      for(let i=0;i<24;i++){
        const a=Math.PI-i*Math.PI/24,b=a-Math.PI/24;
        triangle(glass,p(mid,spring,depth),p(mid+w*Math.cos(b),spring+w*Math.sin(b),depth),
          p(mid+w*Math.cos(a),spring+w*Math.sin(a),depth),[.5,0,1,1,0,1]);
        bar(p,'sash',mid+w*Math.cos(a),spring+w*Math.sin(a),mid+w*Math.cos(b),spring+w*Math.sin(b),.054,-.125);
      }
      for(let j=1;j<=11;j++){
        const angle=Math.PI*j/12;
        bar(p,'lead',mid,spring,mid+w*.998*Math.cos(angle),spring+w*.998*Math.sin(angle),.014,-.122,.012);
      }
      const fan=(r)=>Array.from({length:17},(_,i)=>[mid+Math.cos(i*Math.PI/16)*r,spring+Math.sin(i*Math.PI/16)*r]);
      for(const r of [w*.33,w*.64]){
        const pts=fan(r);
        for(let i=1;i<pts.length;i++)bar(p,'sash',...pts[i-1],...pts[i],.019,-.108,.012);
      }
    }
    box('sash',p,lo,hi,sill,low,depth-.023,-.094);
    for(const s of [-1,1]){
      const x=mid+s*gap*.25;
      box('dark',p,x-gap*.157,x+gap*.157,sill+.073,low-.071,-.093,-.088);
      box('sashEdge',p,x-gap*.144,x+gap*.144,sill+.083,low-.082,-.087,-.078);
      box('sash',p,x-gap*.121,x+gap*.121,sill+.096,low-.100,-.078,-.071);
      box('brass',p,mid+s*.074-.012,mid+s*.074+.012,low+.54,low+.646,-.093,-.057);
    }
    for(let j=0;j<=8;j++){
      const x=lo+j*gap/8,t=j%4===0?.067:j%2===0?rib:.016;
      box(j%4===0?'sash':'lead',p,x-t/2,x+t/2,sill,spring,-.163,-.104);
    }
    for(let j=0;j<=13;j++){
      const y=low+j*(spring-low)/13,t=j===0||j===13?.049:j===7?.037:.012;
      box(j%7===0?'sash':'lead',p,lo,hi,y-t/2,y+t/2,-.158,-.110);
    }
  }
  function bay(f,{hero=false,index=0,plain=false}={}){
    const {L,p}=f,mid=L/2,w=hero?1.085:Math.min(.91,L*.282),lo=mid-w,hi=mid+w;
    const sill=.124,spring=hero?4.08:3.92,rear=-.29;
    box('foot',p,0,L,-.068,.10,-.30,.062);
    if(plain){box('plaster',p,0,L,.10,eave,rear,0);return;}
    const liner=hero?0:.043;
    box('plaster',p,0,lo-liner,.10,eave,rear,0);box('plaster',p,hi+liner,L,.10,eave,rear,0);
    box('plaster',p,lo,hi,.10,sill,rear,0);
    box('dark',p,lo-.007,hi+.007,sill,spring+(hero?w:0)+.05,rear-.029,rear);
    if(hero){
      const pt=(a,d=0)=>p(mid+Math.cos(a)*w,spring+Math.sin(a)*w,d);
      for(let i=0;i<28;i++){
        const a=Math.PI-i*Math.PI/28,b=a-Math.PI/28,aa=pt(a),bb=pt(b);
        quad('plaster',aa,bb,p(mid+w*Math.cos(b),eave,0),p(mid+w*Math.cos(a),eave,0),1.28);
        quad('shade',pt(b,rear),pt(a,rear),aa,bb);
      }
      ring(p,'shade',mid,spring,w,w,.139,.048);
      ring(p,'stone',mid,spring,w+.018,w+.018,.179,.085);
      ring(p,'pale',mid,spring,w+.126,w+.126,.062,.13);
      for(const x of [lo,hi]){
        box('stone',p,x-.044,x+.044,sill,spring,-.115,.069);
        box('pale',p,x-.064,x+.064,spring-.029,spring+.046,-.11,.116);
      }
      box('stone',p,mid-.094,mid+.094,spring+w+.016,spring+w+.235,.059,.154);
      theCarvings.rosette(f,mid,spring+w+.166,.165,1.04);
    }else{
      box('plaster',p,lo-liner,hi+liner,spring,eave,rear,0);
      // The jamb owns the inside reveal. Stacking its side face directly on
      // the plaster aperture produced the striped overlap at grazing angles.
      for(const [a,b] of [[lo-liner,lo],[hi,hi+liner]])box('shade',p,a,b,.10,spring,rear,.041);
      trimBay(p,lo,hi,sill,spring);
      // Blind fields are flush plaster with layered returns, not attic windows.
      const d=Math.min(.64,L*.29);
      box('shade',p,mid-d,mid+d,4.57,5.17,-.018,.026);
      box('stone',p,mid-d-.031,mid+d+.031,4.54,4.62,.026,.086);
      box('pale',p,mid-d-.031,mid+d+.031,5.13,5.208,.026,.104);
      for(const u of [mid-d,mid+d])box('stone',p,u-.038,u+.038,4.60,5.142,.026,.081);
      box('plaster',p,mid-d+.044,mid+d-.044,4.63,5.121,.028,.044);
    }
    panes(p,lo,hi,sill,spring,hero,index);
    box('foot',p,lo-.091,hi+.091,.052,.132,-.25,.205);
    box('stone',p,lo-.087,hi+.087,.094,.118,.165,.225);
  }

  function roof(s){
    const {points,depth,pavilion}=s, h=eave+(pavilion?.20:0),M=pavilion?1.27:1;
    const profile=[[-.46,h+attic-.078],[.035,h+attic+.13],[1.86,h+attic+1.59*M],
      [3.77,h+attic+2.32*M],[depth-3.52,h+attic+2.32*M],
      [depth-1.53,h+attic+1.57*M],[depth+.17,h+attic-.07]];
    let chain=0;
    const X=points.map(([x,z],i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(i+1,points.length-1)];
      const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
      const u=i?chain+=Math.hypot(x-points[i-1][0],z-points[i-1][1]):0;
      return {u,rows:profile.map(([d,y],j)=>{
        const margin=pavilion?[-.27,.02,.61,1.63,1.63,.61,-.24][j]:
          s.main?[-.16,-.12,-.14,-.13,-.13,-.14,-.12][j]:[-.17,-.14,-.13,-.12,-.12,-.13,-.14][j];
        const cap=i===0?margin:i===points.length-1?-margin:0;
        return [x+dx/len*cap+d*dz/len,y,z+dz/len*cap-d*dx/len];
      })};
    });
    const v=[0];
    for(let j=1;j<profile.length;j++)v.push(v.at(-1)+Math.hypot(profile[j][0]-profile[j-1][0],profile[j][1]-profile[j-1][1]));
    for(let i=1;i<X.length;i++){
      const a=X[i-1],b=X[i];
      for(let j=0;j<a.rows.length-1;j++){
        const ua=a.u/2.10,ub=b.u/2.10,va=-v[j]/1.98,vb=-v[j+1]/1.98,m=j===0?'altTile':'tiles';
        triangle(m,a.rows[j],b.rows[j],b.rows[j+1],[ua,va,ub,va,ub,vb]);
        triangle(m,a.rows[j],b.rows[j+1],a.rows[j+1],[ua,va,ub,vb,ua,vb]);
      }
      const ax=frame([a.rows[2][0],a.rows[2][2]],[b.rows[2][0],b.rows[2][2]]);
      box('terra',ax.p,0,ax.L,a.rows[2][1]-.077,a.rows[2][1]+.023,-.075,.105);
      box('iron',ax.p,0,ax.L,a.rows[2][1]-.053,a.rows[2][1]-.019,.055,.113);
      const rr=frame([a.rows[3][0],a.rows[3][2]],[b.rows[3][0],b.rows[3][2]]);
      box('terra',rr.p,0,rr.L,a.rows[3][1]-.014,a.rows[3][1]+.056,-.062,.070);
    }
    for(const {rows} of [X[0],X.at(-1)]){
      if(!pavilion){
        for(let j=1;j<rows.length-1;j++)
          triangle('altTile',rows[0],rows[j],rows[j+1],[0,0,-v[j]/2.1,j*.21,-v[j+1]/2.1,(j+1)*.21]);
        continue;
      }
      // A pavilion hip has the same two slopes as the front. Lay its
      // tile courses on the sloping surface, never on a stretched end fan.
      let course=0;
      for(const [a,b,c,d] of [[0,6,6,1],[1,6,5,2],[2,5,4,3]]){
        const A=rows[a],B=rows[b],D=rows[d],E=rows[c];
        const length=(x,y)=>Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])/2.10;
        const bottom=length(A,B),top=length(D,E),inset=(bottom-top)*.5, upper=course-length(A,D);
        if(c===b)triangle('tiles',A,B,D,[0,course,bottom,course,inset,upper]);
        else{
          triangle('tiles',A,B,E,[0,course,bottom,course,inset+top,upper]);
          triangle('tiles',A,E,D,[0,course,inset+top,upper,inset,upper]);
        }
        course=upper;
      }
      // Folded tiles over the hip and a real round edge at the corner.
      for(const [j,k] of [[0,1],[1,2],[2,3],[4,5],[5,6]]){
        const a=rows[j],b=rows[k],line=frame([a[0],a[2]],[b[0],b[2]]);
        box('terra',(u,y,d)=>line.p(u,y+a[1]+(b[1]-a[1])*u/line.L,d),0,line.L,-.019,.054,-.07,.071);
      }
    }
    if(pavilion){
      const f=frame(points[0],points.at(-1));
      for(const du of [-1.31,1.31]){
        const u=f.L*.5+du,H=h+attic+2.30*M;
        box('shade',f.p,u-.22,u+.22,H-.065,H+.30,-4.4,-3.98);
        box('stone',f.p,u-.27,u+.27,H+.27,H+.35,-4.45,-3.92);
        theCarvings.vase(f,u,H+.35,-4.18,1.49);
      }
    }
  }
  function entablature(s){
    const {points,depth,pavilion}=s,h=eave+(pavilion?.20:0);
    const sectionsAt=points.map(([x,z],i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(i+1,points.length-1)];
      const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz);
      return (y,d)=>[x-d*dz/n,y,z+d*dx/n];
    });
    function mouldings(){
      let prev=[h-.54,.016];
      for(const [y,d,m] of [[h-.51,.070,'pale'],[h-.435,.090,'stone'],[h-.40,.034,'shade'],[h-.22,.034,'stone'],
        [h-.19,.138,'stone'],[h-.133,.198,'pale'],[h-.084,.251,'stone'],[h-.02,.273,'pale'],
        [h+.045,.238,'shade'],[h+.073,.137,'stone'],[h+.12,.144,'pale']]){
        for(let i=1;i<sectionsAt.length;i++){
          const a=sectionsAt[i-1],b=sectionsAt[i];
          quad(m,a(...prev),b(...prev),b(y,d),a(y,d),1.16);
          quad(m,b(prev[0],-depth),a(prev[0],-depth),a(y,-depth-(d*.62)),b(y,-depth-(d*.62)),1.16);
          if(i===1||i===sectionsAt.length-1){
            const end=i===1?a:b;
            const v=[end(...prev),end(prev[0],-depth),end(y,-depth-d*.62),end(y,d)];
            if(i!==1)v.reverse();quad(m,...v,1.16);
          }
        }
        prev=[y,d];
      }
    }
    mouldings();
    for(let i=1;i<points.length;i++){
      const {L,p}=frame(points[i-1],points[i]);
      const a=.03,b=L-.03,y=h+.121,Y=h+attic-.045;
      box('stone',p,a,b,y,Y,-.24,.05);
      box('shade',p,a+.107,b-.107,y+.108,Y-.091,.052,.069);
      box('pale',p,a+.14,b-.14,y+.13,Y-.12,.070,.082);
      box('pale',p,0,L,Y,Y+.109,-.20,.128);
      const dentils=Math.round(L/.295);
      for(let j=1;j<dentils;j++){
        const u=L*j/dentils;
        box('stone',p,u-.053,u+.053,h-.196,h-.122,.123,.192);
      }
    }
  }
  for(const s of sections){
    const {points,depth,pavilion,main}=s;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],f=frame(a,b),{p,L}=f;
      world.polygon([p(0,0,.145),p(L,0,.145),p(L,0,-depth),p(0,0,-depth)].map(([x,,z])=>[x,z]));
      if(pavilion){
        const w=ORANGERY_END_PIER,start=pavilion>0?w:0,end=pavilion<0?L-w:L;
        const local=(u,v)=>{const a=p(u,0,0),b=p(v,0,0);return frame([a[0],a[2]],[b[0],b[2]]);};
        for(let j=0;j<5;j++)bay(local(start+j*(end-start)/5,start+(j+1)*(end-start)/5),{index:j});
        const f=pavilion<0?local(end,L):local(0,start);
        bay(f,{plain:true});
        box('pale',f.p,.067,.206,.135,eave-.49,-.018,.063);
        box('stone',p,0,L,eave,eave+.21,-depth,.031);
      }else bay(f,{hero:main,index:i});
      for(const u of [0,i===points.length-1?L:null]){
        if(u===null)continue;
        const w=main?.28:.10;
        box('stone',p,u-w,u+w,.105,.32,-.052,.139);
        box('stone',p,u-w*.73,u+w*.73,.29,eave-.473,-.034,.057);
        box('pale',p,u-w*.89,u+w*.89,eave-.47,eave-.412,-.034,.075);
      }
      box('plaster',p,0,L,-.06,eave+.12,-depth,-depth+.17);
      box('stone',p,0,L,eave+.12,eave+attic+(pavilion?.14:0),-depth,-depth+.17);
      box('foot',p,0,L,-.032,.243,-depth-.046,-depth+.070);
      for(const end of [i===1?0:null,i===points.length-1?L:null]){
        if(end===null)continue;
        const start=end===0,bottom=p(end,0,0),back=p(end,0,-depth),
          endA=start?back:bottom,endB=start?bottom:back,wall=frame([endA[0],endA[2]],[endB[0],endB[2]]);
        const outward=pavilion&&(start?pavilion>0:pavilion<0);
        box('plaster',wall.p,0,wall.L,-.04,eave+.10,-.104,-.008);
        if(!outward)box('stone',wall.p,0,wall.L,eave+.10,eave+attic+(pavilion?.14:0),-.104,-.008);
        if(outward){
          // Paneled return wall: echoes the window rhythm without adding
          // another oversized glass opening at the garden corner.
          for(let j=0;j<5;j++){
            const u=(j+.5)*wall.L/5;
            box('shade',wall.p,u-.44,u+.44,.49,3.96,.001,.018);
            box('stone',wall.p,u-.399,u+.399,.58,3.881,.019,.036);
            box('plaster',wall.p,u-.345,u+.345,.64,3.80,.037,.052);
            box('pale',wall.p,u-.405,u+.405,3.865,3.964,.040,.097);
          }
          box('stone',wall.p,0,wall.L,eave-.29,eave-.21,.001,.142);
          box('stone',wall.p,0,wall.L,eave+.10,eave+attic+.14,-.02,.073);
        }
      }
    }
    if(pavilion){
      entablature(s);roof(s);
      const f=frame(points[0],points.at(-1)),{L,p}=f,h=eave+.20+attic;
      for(const u of [.25,L-.25]){
        box('stone',p,u-.184,u+.184,h-.22,h+.072,-.089,.355);
        theCarvings.corner(f,u,h+.071,.117,1.10,u<L/2?-.42:.42);
      }
      for(let j=1;j<5;j++){
        const u=L*(j+.12)/5;
        box('stone',p,u-.206,u+.206,h-.53,h+.036,-.043,.14);
        theCarvings.paired(f,u,h+.039,.048,1.04);
      }
    }else if(!main)for(let i=1;i<points.length;i++){
      const f=frame(points[i-1],points[i]),u=f.L*.83,h=eave+attic;
      box('stone',f.p,u-.215,u+.215,h-.47,h+.023,-.062,.116);
      theCarvings.paired(f,u,h+.018,.029,.98);
    }
  }
  // Use one surface and continuous tile/ledge coordinates across the entire
  // concave sweep; no overlapping flat ridge pieces at the centre joints.
  entablature(mainSweep);roof(mainSweep);
  const F=frame(hall[0],hall.at(-1)),p=F.p;
  // Main portal: four ensembles of plinths, smooth columns and composite
  // capitals. The central two are true double columns, not painted pilasters.
  const matColumn=new T.Matrix4(),geoColumn=new T.LatheGeometry([
    [.195,0],[.207,.036],[.207,.075],[.164,.105],[.153,.163],[.160,.50],[.151,2.28],[.135,3.80],
    [.134,3.90],[.157,3.935],[.166,3.978],[.175,4.014],[.170,4.062]
  ].map(([r,y])=>new T.Vector2(r,y)),24);
  for(const [i,axis] of [.298,4.0,8.0,11.702].entries()){
    const wide=i===1||i===2,columns=wide?[-.198,.198]:[0],d=wide?.42:.28,width=wide?.432:.254;
    box('shade',p,axis-width-.04,axis+width+.04,.124,.236,-.11,d+.293);
    box('stone',p,axis-width,axis+width,.219,.891,-.086,d+.224);
    box('pale',p,axis-width-.025,axis+width+.025,.849,.940,-.08,d+.265);
    box('shade',p,axis-width*.70,axis+width*.70,.335,.758,d+.225,d+.248);
    box('stone',p,axis-width*.64,axis+width*.64,.362,.732,d+.25,d+.267);
    theCarvings.rosette(F,axis,.547,d+.277,wide?1.65:1.18);
    for(const shift of columns){
      const u=axis+shift;kit.geometry('stone',geoColumn,matColumn.makeTranslation(...p(u,.925,d)));
      box('stone',p,u-.190,u+.190,4.966,5.201,d-.196,d+.206);
      box('pale',p,u-.193,u+.193,5.195,5.265,d-.207,d+.224);
      for(const v of [-.115,0,.115])theCarvings.rosette(F,u+v,5.034,d+.211,.82);
    }
    const H=eave-.17;
    box('shade',p,axis-width-.07,axis+width+.07,5.260,5.429,-.109,d+.27);
    box('stone',p,axis-width-.085,axis+width+.085,5.414,H,-.17,d+.314);
    box('pale',p,axis-width-.111,axis+width+.111,H-.045,H+.145,-.18,d+.375);
    box('stone',p,axis-.246,axis+.246,H+.102,eave+attic+.06,-.197,d+.229);
    box('pale',p,axis-.295,axis+.295,eave+attic+.021,eave+attic+.127,-.185,d+.277);
    theCarvings.season(F,axis,eave+attic+.126,d+.018,i);
    const [x,,z]=p(axis,0,d+.15);world.circle(x,z,wide?.44:.245);
  }
  geoColumn.dispose();
  // Sprung, split baroque cornice and the Brandenburg/Prussia cartouche.
  for(const side of [-1,1]){
    const pts=Array.from({length:13},(_,i)=>{
      const t=i/12,x=6+side*(2.14-t*1.63),y=6.48+.79*Math.sin(t*1.28);
      return [x,y];
    });
    for(let i=1;i<pts.length;i++){
      bar(p,'shade',...pts[i-1],...pts[i],.253,.65,.214);
      bar(p,'stone',pts[i-1][0],pts[i-1][1]+.092,pts[i][0],pts[i][1]+.092,.098,.868,.048);
      bar(p,'pale',pts[i-1][0],pts[i-1][1]+.154,pts[i][0],pts[i][1]+.154,.046,.894,.040);
      if(i%2===1)box('stone',p,pts[i][0]-.032,pts[i][0]+.032,pts[i][1]-.082,pts[i][1]-.026,.819,.927);
    }
  }
  theCarvings.crown(F,6,7.04,.837);
  for(const u of [1.91,10.13])theCarvings.paired(F,u,eave+attic+.024,.052,1.02);
  for(const u of [-1.05,0,4,8,12,13.07]){
    box('foot',p,u-.83,u+.83,-.035,.066,-.08,.82);
  }
  box('foot',p,-1.875,13.875,-.060,.043,.81,1.87);
  // Low apron in front of the true entrance, and a tiny stone gutter at the
  // return where the roof joins the service side.
  for(let i=0;i<18;i++)box('stone',p,-1.80+i*.86,-.954+i*.86,.035,.055,.864,1.81);
  kit.flush('Orangerie');theCarvings.finish();
  return g;
}
