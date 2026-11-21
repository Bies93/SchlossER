import {p,DEEP_FLOOR as floor} from './park-wc-layout.js';
import {skullProp} from './skull-prop.js';

// Faceted cast leaves and pierced arches give these ritual pieces a silhouette
// at the door as well as legible engraving at arm's length. Static geometry
// is collected into the existing per-room finish batches.
export function shrineCraft(T,m,{B,pipe,ball,drum,disk,line,hit,votive,stamp}){
  function profile(mat,u,v,points,n=32){
    const g=new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),n);
    stamp(mat,g,u,0,v,[1,1,1]);g.dispose();
  }
  function relief(pts,peak,light,shade){
    const xyz=q=>p(q[0],floor+q[1],q[2]);
    for(let j=0;j<pts.length;j++){
      const a=xyz(pts[j]),b=xyz(pts[(j+1)%pts.length]),c=xyz(peak),mat=j%2?light:shade;
      m.k.triangle(mat,a,b,c,[0,0,.45,0,.23,.62]);m.k.triangle(mat,b,a,c,[.45,0,0,0,.23,.62]);
    }
  }
  function crown(u,v){
    profile('orbStone',u,v,[[0,.012],[.91,.012],[.96,.079],[.92,.126],[.79,.15],[.74,.217],[.65,.23],[.56,.31],[.48,.43],[.51,.51],[.60,.57],[.66,.632],[.63,.678],[.45,.715],[0,.715]],12);
    profile('oldGilt',u,v,[[.80,.14],[.807,.154],[.774,.178],[.757,.18]],48);
    profile('deepCopper',u,v,[[.57,.548],[.61,.557],[.66,.591],[.674,.627]],36);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,P=(r,y,s=0)=>[u+Math.cos(a)*r-Math.sin(a)*s,y,v+Math.sin(a)*r+Math.cos(a)*s];
      const h=i%2?.84:.996;
      relief([P(.52,.62),P(.64,.71,-.125),P(.605,h-.075,-.039),P(.51,h),P(.605,h-.075,.039),P(.64,.71,.125)],
        P(.706,.748),'oldGilt','deepCopper');
      const [U,H,V]=P(.713,.743);ball('deepBlueJar',U,H,V,.034,.043,.034);
      relief([P(.56,.294),P(.51,.39,-.082),P(.535,.51),P(.51,.39,.082)],P(.597,.39),'deepCopper','oldGilt');
    }
    // Tall open ciborium: a pointed copper canopy framing the levitating
    // core. It is deliberately open towards the player, not a second cage.
    for(const s of [-1,1]){
      const U=u-.46,V=v+s*1.12;
      profile('blackBasalt',U,V,[[0,.004],[.22,.004],[.225,.088],[.16,.14],[.14,.22],[.108,.26],[.09,1.85],[.12,1.91],[.158,1.95],[.15,2.03],[0,2.035]],8);
      hit(U-.16,U+.16,V-.16,V+.16);
      for(const h of [.14,.25,1.83,1.95])drum('oldGilt',U,h,V,h>1.9?.155:.132,.026);
      const pt=(t,d)=>[U+d,1.99+.89*Math.sin(t*Math.PI*.49),v+s*1.12*(1-t**1.56)];
      for(let j=0;j<12;j++){
        pipe('oldGilt',pt(j/12,0),pt((j+1)/12,0),.041);
        const a=pt(j/12,-.045),b=pt((j+1)/12,-.045);a[1]-=.105;b[1]-=.105;pipe('deepCopper',a,b,.022);
        if(j%2===0)pipe('oldGilt',a,pt((j+1)/12,0),.016);
      }
      for(let j=1;j<=4;j++){
        const t=(j-.35)/5,A=pt(t,0),len=.135+.118*(1-t);
        line('oldGilt',...A,A[0],A[1]-len,A[2],.008);
        ball('oldGilt',A[0],A[1]-len-.014,A[2],.036,.024,.036);
        relief([[A[0],A[1]-len-.026,A[2]-.030],[A[0],A[1]-len-.11,A[2]],[A[0],A[1]-len-.026,A[2]+.030]],
          [A[0]+.023,A[1]-len-.041,A[2]],'deepGold','oldGilt');
      }
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4,x=U+.103*Math.cos(a),v=V+.103*Math.sin(a);
        line('deepCopper',x,.29,v,x,1.80,v,.009);
      }
    }
    const z=u-.46;line('oldGilt',z,2.855,v,z,2.969,v,.029);
    ball('deepGold',z,2.973,v,.045,.055,.045);
  }
  function pinion(U,V,s){
    // Flight feathers in overlapping courses, each with its own central keel.
    const A=(x,y,z)=>[U+x,y,V+s*z];
    for(let j=0;j<8;j++){
      const f=j/7,b=.14+.11*f,e=.29+.41*f,h=1.07+.79*f;
      relief([A(-.024,1.42+.17*f,b),A(-.010,h+.10,e-.031),A(-.083,h+.18,e+.048),
        A(-.098,h+.002,e+.035),A(-.079,1.21+.13*f,b)],A(.032,1.37+.35*f,(b+e)*.53),'deepCopper','oldGilt');
    }
    // Rows of individually chased coverts mask the wing roots and break
    // the mirrored silhouette. Breast scales are tiny shield-shaped reliefs.
    for(let row=0;row<3;row++)for(let j=0;j<5-row;j++){
      const t=(j+.5*row)/5,h=1.42+.22*t+.063*row,z=.12+.24*t;
      relief([A(.077,h+.057,z),A(.085,h+.022,z+.038),A(.080,h-.069,z+.044),
        A(.081,h-.032,z-.017)],A(.105,h,z+.017),'oldGilt','deepCopper');
    }
    for(let row=0;row<4;row++)for(let j=0;j<3;j++){
      const z=.022+.043*j+(row%2)*.012,h=1.48-row*.079,x=.166-.24*z;
      relief([A(x,h+.035,z),A(x,h+.013,z+.029),A(x,h-.049,z+.013),A(x,h+.005,z-.019)],
        A(x+.030,h-.002,z+.007),'deepCopper','oldGilt');
    }
  }
  function skull(U,y,V,s,angle=0,variant=0){
    // On the jawless specimen the upper row sits just above the shelf.
    skullProp(T,m.k,{at:p(U,floor+y-(variant===3?.043*s:0),V),yaw:-Math.PI/2-angle,scale:s,
      bone:'relicBone',enamel:'relicEnamel',variant});
  }
  function charnel(U,V){
    const shelfU=-24.41,shelfV=-7.89;
    B('blackBasalt',shelfU-.36,shelfU+.36,0,.13,shelfV-.83,shelfV+.83);
    for(const z of [shelfV-.74,shelfV+.74])B('orbStone',shelfU-.29,shelfU+.28,.11,1.57,z-.086,z+.086);
    for(const h of [.28,.83,1.53])B('deepWalnut',shelfU-.30,shelfU+.32,h-.067,h,shelfV-.78,shelfV+.78);
    hit(shelfU-.36,shelfU+.36,shelfV-.83,shelfV+.83);
    // Existing rock vault remains the structural ceiling. Three singed
    // funeral valances turn its rear into a compressed, processional alcove.
    for(const s of [-1,1]){
      const x=U+s*1.58;
      line('deepIron',x,2.25,-8.74,x,2.25,-6.72,.028);
      for(const z of [-8.69,-6.77]){
        const h=2.31+.34*Math.sqrt(Math.max(0,1-(2*(z+9.04)/5.06-1)**2));
        line('deepIron',x,2.25,z,x,h+.05,z,.014);
      }
      let prev;
      for(let i=0;i<=24;i++){
        const t=i/24,z=-8.71+t*1.95,h=.64+.24*t+.11*Math.sin(i*.72)+.20*Math.abs(Math.sin(i*.79));
        const d=.042*Math.cos(i*1.31),row=[[x+d*.46,2.225,z],[x+d,2.225-h+.037,z],[x+d*1.1,2.225-h,z]];
        if(prev)for(let j=0;j<2;j++)m.k.quad(j?'deepSoot':'wine',
          ...[prev[j],row[j],row[j+1],prev[j+1]].map(([x,y,z])=>p(x,floor+y,z)),.57);
        prev=row;
      }
    }
    for(const [i,[h,z]] of [[.28,-.41],[.28,.20],[.83,-.42],[.83,.04],[.83,.39]].entries())
      skull(shelfU+.05,h,shelfV+z,.91+i*.045,-1.86+i*.14,[1,0,3,2,1][i]);
    for(let j=0;j<9;j++){
      const z=shelfV-.54+(j%5)*.20,x=shelfU-.15+.032*(j%3),h=.327+(j>4?.068:0);
      const a=[x,h,z],b=[x+.28,h+.018,z+.08*Math.sin(j*11)];
      pipe('relicBone',a,b,.012+(j%2)*.004);
      for(const [X,Y,Z] of [a,b])for(const k of [-1,1])ball('relicBone',X,Y+.011*k,Z+.010*k,.017,.016,.018);
    }
    // An iron reliquary seal on the rear wall: one watchful eye above the
    // offerings, framed by an open triangle and worn votive discs.
    const z=-8.785,Q=(x,h)=>[U+x,h,z];
    B('orbStone',U-.99,U+.99,.96,2.34,-9.05,-8.88);
    for(let j=0;j<7;j++){
      const x=U+(j-3)*.257,hi=2.37+.176*Math.cos((j-3)*.46);
      B(j%3?'blackBasalt':'deepDamp',x-.126,x+.126,.983,hi,-8.889,-8.845);
      drum('deepCopper',x,hi+.012,-8.877,.028,.035);
    }
    for(const [A,B] of [[[-.86,1.18],[.86,1.18]],[[.86,1.18],[0,2.48]],[[0,2.48],[-.86,1.18]]])
      pipe('oldGilt',Q(...A),Q(...B),.026);
    for(let j=0;j<16;j++){
      const a=j*Math.PI/8,b=(j+1)*Math.PI/8;
      pipe('deepCopper',Q(.33*Math.cos(a),1.70+.119*Math.sin(a)),Q(.33*Math.cos(b),1.70+.119*Math.sin(b)),.022);
    }
    ball('oldGilt',U,1.70,z+.028,.041,.084,.091);
    ball('deepSoot',U,1.70,z+.063,.019,.062,.026);
    for(let i=0;i<6;i++)votive(-24.41+(i%2)*.13, shelfV-.56+i*.193,1.53,.085+i%3*.033);
    // Soot-black offering bowl with a concave interior and a garnet tide line.
    const cu=U+.86,cv=V-.24;
    profile('deepCopper',cu,cv,[[0,1.025],[.105,1.025],[.088,1.066],[.137,1.108],[.178,1.209],[.171,1.220],[.157,1.207],[.115,1.115],[.063,1.089],[0,1.088]],24);
    drum('wine',cu,1.106,cv,.093,.005);
    skull(U-.84,1.023,V+.22,1.03,.16,2);
    for(let i=0;i<7;i++){
      const x=U-.91+.293*i,h=.943,z=V+.582;
      relief([[x-.10,h,z],[x,h+.047,z],[x+.10,h,z],[x,h-.047,z]],[x,h,z+.019],'deepCopper','blackBasalt');
    }
    // A repeatedly replaced funeral stole. Its top folds over the slab and
    // the faded fringe hangs in front, leaving the worn stone visible.
    const edge=V+.574;
    for(let j=0;j<14;j++){
      const x=U-.56+j*.031,X=x+.031,z=edge+.009*Math.sin(j*.7);
      const pts=[[x,1.029,V-.50],[x,1.029,edge],[X,1.029,edge],[X,1.029,V-.50]];
      const conv=arr=>arr.map(([x,y,z])=>p(x,floor+y,z));
      m.k.quad(j===1||j===12?'deepSeam':'wine',...conv(pts),.36);
      const bottom=.51+.036*Math.cos(j*.44);
      m.k.quad(j===1||j===12?'deepSeam':'wine',...conv([[x,1.029,edge],[x,bottom,z],[X,bottom,z],[X,1.029,edge]]),.37);
      line('deepSeam',x,bottom,z,x+.008,bottom-.035,z,.003);
    }
    m.deepTile('stain',U-.34,.78,edge+.019,.29,.48,-Math.PI/2);
    m.deepTile('stain',U+1.72,1.26,-8.91,.91,.66,-Math.PI/2,0,.32);
    for(const side of [-1,1]){
      for(let j=0;j<3;j++){
        const u=U+side*(.55+j*.21);
        line('deepCopper',u,.87,V+.572,u,.87-(.14+.12*(j%2)),V+.572,.012);
        ball('deepCopper',u,.712-.12*(j%2),V+.572,.028,.04,.018);
      }
    }
  }
  return {crown,pinion,charnel};
}
