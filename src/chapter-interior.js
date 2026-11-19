import {architectureKit} from './architecture-kit.js';
import {CHAPTER_ROOMS,CHAPTER_LINKS,CHAPTER_STEP as S,CHAPTER_DROP} from './chapter-layout.js';
import {chapterArt} from './chapter-art.js';
import {dressChapter} from './chapter-props.js';
import {armorialCloth} from './chapter-finishes.js';
import {randomSource} from './surface-detail.js';

const p=(x,y,z)=>[x,y,z],names={vestibule:'Pförtnerkammer',salle:'Waffengalerie',archive:'Archiv der Aufnahmen',chapter:'Kapitelsaal',duel:'Fechtboden · Kronsaal'};
const roofAt=(z,a,b)=>2.53+.88*Math.sqrt(Math.max(0,1-((2*z-a-b)/(b-a))**2));
const node=(T,parent,name)=>{const n=new T.Group();n.name=name;parent.add(n);return n;};

export function chapterInterior(T,root,world,material,grade,isBelow){
  const F=grade-CHAPTER_DROP,objects=new Map(),atlas=chapterArt(T,root),cloth=armorialCloth(T),rnd=randomSource(518019);
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
  for(const [id,rect] of Object.entries(CHAPTER_ROOMS)){
    const room=node(T,root,'Eiserne Krone · '+names[id]),[a,A,b,B]=rect;
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
            if(Q-q>.029)bx(['stone','stone2','stone3'][Math.floor(rnd()*3)],q,Q,y+.008,y+.294,-.043+rnd()*.012,-.019);
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
    m.geometry(id==='duel'?'vaultBlue':'vaultLime',barrel,new T.Matrix4());barrel.dispose();
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
        if(r>l&&v>y+.004)B0(rnd()<.23?'stone2':'sole',l,r,-.037,0,y+.004,v);
      }
    }
    dressChapter(T,{room,k:m,box:B0,hit,F,rect,id,cloth,print:(key,...args)=>{
      room.add(atlas(key,args[0],F+args[1],...args.slice(2)));
    }});
    m.flush('Eiserne Krone · '+names[id]);
  }
  return objects;
}
