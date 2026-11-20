import {architectureKit} from './architecture-kit.js';
import {CHAPTER_ROOMS,CHAPTER_LINKS,CHAPTER_STEP as S,CHAPTER_DROP,CHAPTER_DEEP_STEP as D,CHAPTER_DEEP_DROP,isChapterDeep} from './chapter-layout.js';
import {chapterArt} from './chapter-art.js';
import {dressChapter} from './chapter-props.js';
import {armorialCloth} from './chapter-finishes.js';
import {randomSource} from './surface-detail.js';
import {deepChapterDressing} from './chapter-deep.js';
import {makeChapterPrisoner} from './chapter-prisoner.js';
import {makeCellGate} from './chapter-cell-gate.js';

const p=(x,y,z)=>[x,y,z],names={vestibule:'Pförtnerkammer',salle:'Waffengalerie',archive:'Archiv der Aufnahmen',chapter:'Kapitelsaal',duel:'Fechtboden · Kronsaal',
  lowerHall:'Unterer Wachgang',dormitory:'Schlafkammer',kitchen:'Bundküche',prison:'Verlies · Kammer 07'};
const roofAt=(z,a,b)=>2.53+.88*Math.sqrt(Math.max(0,1-((2*z-a-b)/(b-a))**2));
const node=(T,parent,name)=>{const n=new T.Group();n.name=name;parent.add(n);return n;};

export function chapterInterior(T,root,world,material,grade,isBelow){
  const F0=grade-CHAPTER_DROP,F1=F0-CHAPTER_DEEP_DROP,objects=new Map(),atlas=chapterArt(T,root),cloth=armorialCloth(T),rnd=randomSource(518019);
  const stair=node(T,root,'Eiserne Krone · Treppenlauf');
  const k=architectureKit(T,stair,material);
  const box=(m,a,A,y,Y,z,Z)=>k.box(m,p,a,A,grade+y,grade+Y,z,Z);
  const d=(S.top-S.foot)/S.count;
  for(let i=0;i<S.count;i++){
    const A=S.top-i*d,a=A-d,y=-(i+1)*S.rise;
    box(i%3?'stone':'stone2',a,A,y-.22,y,S.z0,S.z1);
    box('stone3',a+.005,a+.044,y-.025,y+.002,S.z0+.024,S.z1-.024);
  }
  for(const edge of [S.z0,S.z1]){
    const L=edge===S.z0?edge-.197:edge,R=edge===S.z0?edge:edge+.197;
    box('mortar',S.foot,S.top,-CHAPTER_DROP-.21,-.025,L,R);
    for(let row=0;row<14;row++)for(let a=S.foot-.37*(row%2);a<S.top-.04;a+=.735){
      const x=Math.max(S.foot+.004,a+.006),X=Math.min(S.top-.004,a+.727),y=-CHAPTER_DROP-.029+row*.304;
      if(X>x+.012)box(row%3===1?'stone2':'stone',x,X,y,y+.290,L-.003,R+.003);
    }
    for(const v of [edge+(edge===S.z0?.063:-.063)]){
      const pose=(x,y,z)=>[x,grade-(S.top-x)*CHAPTER_DROP/(S.top-S.foot)+.84+y,z];
      const start=S.foot+.18,end=S.top-1.23;
      // Independent of the moving perimeter rail. Ends below grade so the
      // stair grip never pierces the stone frame or the opening leaf.
      k.box('iron',pose,start,end,-.025,.018,v-.027,v+.027);
      k.box('brass',pose,start+.013,end-.014,.015,.024,v-.024,v+.024);
      for(let x=start+.19;x<=end-.04;x+=.65){
        const Y=-(S.top-x)*CHAPTER_DROP/(S.top-S.foot)+.84;
        box('iron',x-.028,x+.028,Y-.061,Y+.012,Math.min(v,edge)-.018,Math.max(v,edge)+.018);
        box('iron',x-.047,x+.047,Y-.088,Y+.028,edge-.011,edge+.011);
      }
    }
  }
  box('stone2',S.foot,S.cover,-.183,-.052,S.z0-.031,S.z1+.031);
  for(let i=0;i<4;i++){
    const x=S.foot+.55+i*1.02,y=Math.min(-.22,-CHAPTER_DROP+(x-S.foot)*CHAPTER_DROP/(S.top-S.foot)+1.31);
    box('iron',x-.17,x+.17,y-.15,y+.15,S.z0+.010,S.z0+.074);
    box('filament',x-.117,x+.117,y-.10,y+.103,S.z0+.075,S.z0+.095);
    for(const a of [-.107,0,.107])box('iron',x+a-.009,x+a+.009,y-.12,y+.121,S.z0+.096,S.z0+.109);
  }
  k.flush('Eiserne Krone · Treppenschacht');objects.set('stair',stair);
  const descent=node(T,root,'Eiserne Krone · Zweiter Treppenlauf'),ds=architectureKit(T,descent,material),
    run=(D.top-D.foot)/D.count,plane=z=>F0-(D.top-z)*D.rise/run;
  const sb=(m,x,X,y,Y,z,Z)=>ds.box(m,p,x,X,y,Y,z,Z);
  for(let i=0;i<D.count;i++){
    const z=D.top-(i+1)*run,Z=z+run,y=F0-(i+1)*D.rise;
    sb(i%4?'deepStone':'stone2',D.x0,D.x1,y-.215,y,z,Z);
    sb('stone3',D.x0+.023,D.x1-.023,y-.029,y+.002,z+.004,z+.051);
    for(const [side,x] of [[1,D.x0],[-1,D.x1]]){
      const P=(z,y)=>[x,plane(z)+y,z];
      const points=[P(z,-.21),P(z,2.58),P(Z,2.58),P(Z,-.21)];
      ds.quad(i%4?'deepRock':'deepStone',...(side<0?points.reverse():points),1.08,i*.113);
      if(i%4===1){
        const Z0=(z+Z)*.5,Y=plane(Z0)+.84,[a,b]=[x,x+side*.112].sort((a,b)=>a-b);
        sb('iron',a,b,Y-.060,Y-.018,Z0-.020,Z0+.020);
        sb('verdigris',x-.012,x+.012,Y-.107,Y+.022,Z0-.036,Z0+.036);
      }
    }
  }
  ds.quad('deepLime',[D.x0,plane(D.foot)+2.55,D.foot],[D.x1,plane(D.foot)+2.55,D.foot],
    [D.x1,plane(D.top)+2.55,D.top],[D.x0,plane(D.top)+2.55,D.top],1.21);
  for(const [s,x] of [[1,D.x0],[-1,D.x1]]){
    const rail=(x,y,z)=>[x,plane(z)+.84+y,z];
    ds.box('iron',rail,x+s*.083-.022,x+s*.083+.022,-.032,.018,D.foot+.16,D.top-.13);
    ds.box('brass',rail,x+s*.083-.017,x+s*.083+.017,.018,.028,D.foot+.174,D.top-.146);
    world.box(x-.02,D.foot,x+.02,D.top,isBelow);
  }
  for(const z of [-57.24,-59.33,-61.38]){
    const x=D.x1-.091,y=plane(z)+1.54;
    sb('iron',x-.019,x+.091,y-.137,y+.147,z-.127,z+.127);
    sb('filament',x-.040,x-.017,y-.090,y+.103,z-.093,z+.093);
    for(const a of [-.083,0,.083])sb('iron',x-.059,x-.035,y-.118,y+.123,z+a-.009,z+a+.009);
  }
  ds.flush('Eiserne Krone · Treppe zur Nachtwache');objects.set('lowerStair',descent);
  let prisoner,gate;
  for(const [id,rect] of Object.entries(CHAPTER_ROOMS)){
    const room=node(T,root,'Eiserne Krone · '+names[id]),[a,A,b,B]=rect;
    const deep=isChapterDeep(id),F=deep?F1:F0;
    objects.set(id,room);
    const m=architectureKit(T,room,material),B0=(key,x,X,y,Y,z,Z)=>m.box(key,p,x,X,F+y,F+Y,z,Z);
    const hit=(x,X,z,Z)=>world.box(x,z,X,Z,isBelow);
    for(const [axis,edge,min,max,side] of [['x',a,b,B,-1],['x',A,b,B,1],['z',b,a,A,-1],['z',B,a,A,1]]){
      const openings=CHAPTER_LINKS.filter(([l,r,k,f])=>(l===id||r===id)&&k===axis&&f===edge);
      const orient=axis==='x'?-side:side;
      const coord=(s,y,v)=>axis==='x'?[edge+side*v,F+y,orient*s]:[orient*s,F+y,edge+side*v];
      const bx=(key,l,r,y,Y,d,D)=>m.box(key,coord,orient>0?l:-r,orient>0?r:-l,y,Y,d,D);
      function section(l,r){
        if(r-l<.005)return;
        // Both rooms get their own inward skin; neither room's backing
        // projects through its neighbour and covers the stone coursing.
        bx('mortar',l,r,-.032,3.44,-.020,-.005);
        for(let i=0;i<11;i++){
          const y=i*.304-.019;let n=l-(i%2?.332:0);
          while(n<r-.01){
            const end=n+.61+.20*rnd(),q=Math.max(n,l)+.005,Q=Math.min(r,end)-.006;
            if(Q-q>.029)bx((deep?['deepRock','deepStone','stone2']:['stone','stone2','stone3'])[Math.floor(rnd()*3)],q,Q,y+.008,y+.294,-.043+rnd()*.012,-.019);
            n=end;
          }
        }
        bx('stone2',l,r,.032,.094,-.066,-.018);
        if(axis==='x')hit(Math.min(edge,edge+.115*side),Math.max(edge,edge+.115*side),l,r);
        else hit(l,r,Math.min(edge,edge+.115*side),Math.max(edge,edge+.115*side));
      }
      let start=min;
      for(const [owner,other,,,l,r] of openings){
        section(start,l);start=r;
        if(owner!==id)continue;
        // A single owner frames each opening. A stone header seals the
        // joint to the adjacent vault; clear height below stays >= 2.14 m.
        bx('stone2',l,r,2.16,3.43,-.141,.140);
        for(const x of [l,r]){
          for(let i=0;i<7;i++)bx(i%2?'stone3':'stone',x-.084,x+.084,i*.305+.003,i*.305+.302,-.178,.178);
          bx('stone3',x-.12,x+.12,2.049,2.155,-.209,.209);
        }
        bx('stone3',l-.082,r+.082,2.154,2.253,-.197,.197);
        bx('stone3',(l+r)/2-.092,(l+r)/2+.092,2.25,2.441,-.171,.172);
      }
      section(start,max);
    }
    // Continuous smooth normals and arclength UVs across the vault.
    // The intentional transverse ribs have a separate, bevelled moulding.
    const arcs=40;
    const knot=(x,i)=>{const angle=i*Math.PI/arcs,z=(b+B)/2-(B-b)/2*Math.cos(angle);return p(x,F+roofAt(z,b,B),z);};
    const verts=[],uv=[],idx=[];let walked=0;
    for(let i=0;i<=arcs;i++){
      const v=knot(a,i),w=knot(A,i);
      if(i){const prev=knot(a,i-1);walked+=Math.hypot(v[1]-prev[1],v[2]-prev[2]);}
      verts.push(...v,...w);uv.push(a/1.7,walked/1.7,A/1.7,walked/1.7);
      if(i){const u=(i-1)*2;idx.push(u,u+1,u+3,u,u+3,u+2);}
    }
    const barrel=new T.BufferGeometry();barrel.setAttribute('position',new T.Float32BufferAttribute(verts,3));
    barrel.setAttribute('uv',new T.Float32BufferAttribute(uv,2));barrel.setIndex(idx);barrel.computeVertexNormals();
    m.geometry(deep?'deepLime':id==='duel'?'vaultBlue':'vaultLime',barrel,new T.Matrix4());barrel.dispose();
    for(const z of [b,B]){
      const sign=z===b?1:-1,[d,D]=[z+sign*.041,z+sign*.122].sort((a,b)=>a-b);
      B0('stone3',a+.07,A-.07,2.47,2.54,d,D);
      B0('stone2',a+.08,A-.08,2.444,2.478,d+sign*.011,D+sign*.011);
    }
    for(let x=a+.49;x<A-.21;x+=(A-a)/3){
      const cross=[[-.120,.005],[-.106,-.039],[-.067,-.057],[-.053,-.093],[.053,-.093],[.067,-.057],[.106,-.039],[.120,.005]];
      const point=(j,s)=>{const v=knot(x+cross[s][0],j);v[1]+=cross[s][1];return v;};
      for(let i=0;i<arcs;i++){
        for(let l=1;l<cross.length;l++)m.quad(l%2?'stone2':'stone3',point(i,l-1),point(i,l),point(i+1,l),point(i+1,l-1),.72,i*.063);
      }
    }
    B0('mortar',a,A,-.086,-.029,b,B);
    for(let y=b,i=0;y<B-.012;y+=.71,i++){
      for(let x=a-(i%2)*.55;x<A-.012;x+=1.10){
        const l=Math.max(x+.005,a),r=Math.min(x+1.093,A),v=Math.min(y+.701,B);
        if(r>l&&v>y+.004)B0(deep?(rnd()<.25?'deepStone':'deepRock'):rnd()<.23?'stone2':'sole',l,r,-.037,0,y+.004,v);
      }
    }
    const platform=(x,X,z,Z,h)=>world.platform(x,z,X,Z,F+h,q=>isBelow(q)&&Math.abs(q.y-F)<.9);
    const kit={room,k:m,box:B0,hit,platform,F,rect,id,cloth,print:(key,...args)=>{
      room.add(atlas(key,args[0],F+args[1],...args.slice(2)));
    }};
    if(deep)deepChapterDressing(T,kit);
    else dressChapter(T,kit);
    if(id==='prison'){prisoner=makeChapterPrisoner(T,room,F);gate=makeCellGate(T,room,world,material,F);}
    m.flush('Eiserne Krone · '+names[id]);
  }
  return {objects,prisoner,gate};
}
