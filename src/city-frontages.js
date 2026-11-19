import {CITY_FRONTAGES,PERIMETER} from './world-layout.js';

// Composed frontages for the compressed square, not individual surveys.
const plaster=[0xd5c5ad,0xd9d2c2,0xc0c5b8,0xd4b3a2,0xe3d2b5,0xc4c1b5,0xd6b998];
const limestone=[0xcbb89e,0xd5c8b5,0xbca88f];
const painted=[0xbfc0b4,0xc9c1aa,0x8f9b8a,0x8a7d6e,0xc9c2b7];
const timber=[0x524239,0x4d5651,0x695044,0x57604c];
const clay=[0xc39984,0xb98b77,0xaa8473,0xceab91,0xa88176];
const slate=[0xb8b7ba,0xaaa9ae,0xbfb9b4];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pick=(array,k)=>array[((k%array.length)+array.length)%array.length];

export function miterInset(a,b){
  const u=[a.b[0]-a.a[0],a.b[1]-a.a[1]],v=[b.b[0]-b.a[0],b.b[1]-b.a[1]];
  const norm=Math.hypot(...u)*Math.hypot(...v),cross=(u[0]*v[1]-u[1]*v[0])/norm;
  const dot=(u[0]*v[0]+u[1]*v[1])/norm;
  // Inner corner of the square: stop the exterior footprints at the
  // bisector instead of letting one back wall fill the next house's niches.
  return cross<-.015?clamp(-cross/(1+dot),0,1.8):0;
}

export function frontageFrame(edge,f){
  const join=e=>e.type==='house'||e.type==='annex';
  const n=PERIMETER.length,a=PERIMETER[(edge.id+n-1)%n],b=PERIMETER[(edge.id+1)%n];
  const start=join(a)?miterInset(a,edge):0,end=join(b)?miterInset(edge,b):0;
  return {...f,point(u,y,d){
    if(d<0)u=clamp(u,Math.min(-d*start,f.len*.435),f.len-Math.min(-d*end,f.len*.435));
    return f.point(u,y,d);
  }};
}

export function addCityFrontage(T,edge,frame,kit){
  const {box,quad,block,groundY}=kit,{len:L}=frame,{id}=edge,annex=edge.type==='annex';
  const f=frontageFrame(edge,frame),p=f.point,c=h=>new T.Color(h);
  const b=(m,l,r,y,h,z0,z1,t)=>{if(r-l>.001&&h-y>.001&&z1-z0>.0001)box(f,m,l,r,y,h,z0,z1,t)};
  const surf=(m,l,r,y,h,d,t)=>{if(r-l>.001&&h-y>.001)quad(m,p(l,y,d),p(r,y,d),p(r,h,d),p(l,h,d),t)};
  const tri=(m,a,b,d,t)=>quad(m,a,b,d,d,t);
  const metal=c(0x8a8170),slotDark=c(0x615953);
  const types=CITY_FRONTAGES[id]??Array.from({length:Math.max(1,Math.round(L/11))},(_,k)=>k%2?'plaster':'stone');
  const weights=types.map((style,i)=>style==='civic'?1.26:.81+((id*17+i*19)%13)*.036+(style==='corner'?.16:0));
  const sum=weights.reduce((a,q)=>a+q,0);

  function leadGlass(lo,hi,low,high,d,palette,warm,decor=true){
    const exposed=warm?'litGlass':'glass',half=(hi-lo)*.5,center=lo+half,hh=high-low;
    const tint=c(warm?0xb6a086:palette.sky);
    // Planes for sash detail, genuine reveal/sill mass elsewhere. This
    // keeps the window subdivisions legible at scale without dozens of cubes.
    surf('interior',lo,hi,low,high,d-.009,slotDark);
    surf(exposed,lo+.035,hi-.035,low+.032,high-.030,d,tint);
    if(decor&&palette.curtains){
      const soft=c(warm?0xb6a178:palette.curtains);
      surf(warm?'litGlass':'glass',lo+.04,lo+half*.42,low+hh*.12,high-.042,d+.003,soft);
      surf(warm?'litGlass':'glass',hi-half*.33,hi-.041,low+hh*.11,high-.041,d+.003,soft);
    }
    const paint=c(palette.frame),border=Math.min(.073,half*.181),mid=decor?.049:.037;
    for(const [a,z] of [[lo,lo+border],[hi-border,hi]])
      surf('sash',a,z,low,high,d+.025,paint);
    for(const [bottom,head] of [[low,low+.064],[high-.062,high]])
      surf('sash',lo,hi,bottom,head,d+.026,paint);
    surf('sash',center-mid*.51,center+mid*.51,low,high,d+.028,paint);
    const trans=low+hh*(decor?.59:.63);
    surf('sash',lo,hi,trans-.023,trans+.024,d+.030,paint);
    if(decor&&palette.grid){
      const extra=low+hh*.30;
      surf('sash',lo,hi,extra-.014,extra+.014,d+.030,paint);
    }
  }

  function surround(lo,hi,y,h,face,reveal,style,stone,palette,warm,shutters=false){
    const jamb=style==='formal'?.116:style==='shop'?.122:.076;
    const depth=face+(style==='formal'?.096:.055);
    for(const [a,r] of [[lo-jamb,lo+.003],[hi-.003,hi+jamb]])
      b('houseStone',a,r,y-.019,h+.013,reveal-.002,depth,stone);
    const sill=(style==='formal'?.195:style==='shop'?.174:.137)+face;
    b('houseStone',lo-jamb-.035,hi+jamb+.035,y-.093,y+.005,reveal+.03,sill,stone);
    b('lintel',lo-jamb-.018,hi+jamb+.018,y-.112,y-.080,face-.04,sill-.022,stone);
    b('houseStone',lo-jamb-.012,hi+jamb+.012,h,h+(style==='formal'?.157:.100),reveal,depth,stone);
    if(style==='formal'){
      b('lintel',lo-jamb-.069,hi+jamb+.069,h+.132,h+.169,face-.021,depth+.053,stone);
      b('houseStone',lo-jamb-.045,hi+jamb+.045,h+.169,h+.204,face+.014,depth+.081,stone);
      surf('trimLine',lo-.014,hi+.014,y-.167,y-.153,face+.006,slotDark);
    }
    if(shutters){
      const stain=c(palette.shutter),w=Math.min(.38,(hi-lo)*.42);
      for(const [a,r] of [[lo-jamb-w-.035,lo-jamb-.024],[hi+jamb+.024,hi+jamb+w+.035]]){
        const z=face+.020;
        b('sash',a,r,y+.025,h-.030,z,z+.052,stain);
        for(const u of [a+.018,r-.039])surf('sash',u,u+.024,y+.050,h-.054,z+.057,stain.clone().multiplyScalar(1.23));
        for(const yy of [y+.20,y+(h-y)*.52,h-.18])surf('trimLine',a+.025,r-.025,yy,yy+.031,z+.058,stain.clone().multiplyScalar(.64));
      }
    }
    leadGlass(lo,hi,y+.012,h-.010,reveal,palette,warm,style!=='dormer');
  }

  function portal(lo,hi,face,depth,head,style,stone,wood,wall){
    const m=(lo+hi)*.5,w=(hi-lo)*.5,rise=style==='round'?.48:0;
    const spring=head-rise,base=.038;
    b('interior',lo,hi,base,spring,depth-.049,depth,slotDark);
    b('doors',lo+.044,hi-.044,base+.035,spring-.035,depth+.005,depth+.049,wood);
    for(const [a,z] of [[lo+.102,m-.055],[m+.055,hi-.102]]){
      for(const [bot,top] of [[base+.18,base+.77],[base+.89,spring-.17]]){
        if(top<=bot)continue;
        b('doors',a,z,bot,top,depth+.035,depth+.072,wood.clone().multiplyScalar(1.22));
        surf('sash',a+.048,z-.048,bot+.041,top-.046,depth+.075,wood.clone().multiplyScalar(.81));
      }
    }
    for(const x of [m-.071,m+.043])surf('trimLine',x,x+.035,.87,.947,depth+.091,metal);
    b('base',lo-.135,hi+.135,-.021,.062,depth-.043,face+.247,stone);
    for(const [a,r] of [[lo-.142,lo+.009],[hi-.009,hi+.142]]){
      b('houseStone',a,r,base,style==='round'?spring:head+.023,depth,face+.106,stone);
      b('lintel',a-.017,r+.017,base,base+.162,face-.011,face+.134,stone);
    }
    if(style!=='round'){
      b('houseStone',lo-.173,hi+.173,head-.023,head+.149,depth,face+.102,stone);
      b('lintel',lo-.214,hi+.214,head+.137,head+.191,face-.018,face+.171,stone);
      return;
    }
    const cap=head+.192,pt=(a,outer,z)=>p(m+(w+outer*.145)*Math.cos(a),spring+(rise+outer*.149)*Math.sin(a),z);
    for(let i=0;i<14;i++){
      const a=i*Math.PI/14,g=(i+1)*Math.PI/14,innerA=pt(a,0,face+.006),innerB=pt(g,0,face+.006);
      const A=pt(a,0,depth+.006),B=pt(g,0,depth+.006);
      quad('houseStone',pt(a,0,face+.107),pt(a,1,face+.107),pt(g,1,face+.107),pt(g,0,face+.107),
        i===6||i===7?stone.clone().multiplyScalar(1.14):stone);
      quad('houseStone',B,A,innerA,innerB,stone.clone().multiplyScalar(.88));
      tri('glass',p(m,spring,depth+.009),A,B,c(0x576672));
      const x1=m+w*Math.cos(a),x2=m+w*Math.cos(g);
      quad('stucco',innerB,innerA,p(x1,cap,face+.006),p(x2,cap,face+.006),wall);
      if(i%3===1)surf('sash',x2-.017,x2+.017,spring+.021,Math.min(head-.015,spring+rise*Math.sin(g)),depth+.022,wood);
    }
    surf('sash',lo,hi,spring-.048,spring+.024,depth+.025,wood);
    b('houseStone',m-.071,m+.071,head-.012,head+.177,face+.081,face+.149,stone);
  }

  function dormer(x,w,foot,roofY,z,roof,roofTint,stone,style,warm){
    const half=w*.5,l=x-half,r=x+half,base=foot+.126,head=roofY-.125,depth=z-.105;
    // Both side returns and a real roof tie to the slope behind the opening.
    b('stucco',l,r,foot,roofY,z-.58,depth-.011,stone);
    for(const [a,b0] of [[l,l+.120],[r-.120,r]])b('houseStone',a,b0,foot,roofY,z-.27,z+.036,stone);
    b('stucco',l+.11,r-.11,foot,base,z-.21,z+.014,stone);
    const pale=c(0xcdc3ad),pane={frame:0xb5afa1,sky:0x667d90,curtains:0,grid:false};
    leadGlass(l+.118,r-.118,base,head,depth,pane,warm,false);
    b('houseStone',l-.038,r+.038,head,roofY-.015,z-.23,z+.066,stone);
    b('lintel',l-.065,r+.065,roofY-.055,roofY+.009,z-.26,z+.088,pale);
    const r0=z+.116,r1=z-.71,tip=roofY+(style==='crest'?.30:.23);
    tri('houseStone',p(l-.054,roofY,r0),p(r+.054,roofY,r0),p(x,tip,r0),stone);
    quad(roof,p(l-.074,roofY,r0+.035),p(x,tip+.014,r0+.035),p(x,tip+.024,r1),p(l-.074,roofY,r1),roofTint);
    quad(roof,p(x,tip+.014,r0+.035),p(r+.074,roofY,r0+.035),p(r+.074,roofY,r1),p(x,tip+.024,r1),roofTint);
    b('houseStone',l-.026,r+.026,base-.076,base,z-.129,z+.113,stone);
  }

  function roofForm(l,r,y,peak,depth,style,roof,roofTint,wallTint){
    const front=.236,back=-depth-.184,over=.077,w=r-l;
    const a=p(l-over,y,front),d=p(l-over,y,back),g=p(r+over,y,back),e=p(r+over,y,front);
    const hip=style==='gable'?0:style==='mansard'?w*.17:Math.min(1.31,w*.23);
    const apex=(y,z)=>[p(l+hip,y,z),p(r-hip,y,z)];
    const ridge=-depth*.52,[u,v]=apex(peak,ridge);
    if(style==='mansard'){
      const turn=y+(peak-y)*.63,k=-depth*.22,h=-depth*.81,j=Math.min(.75,w*.09);
      const A=p(l+j,turn,k),B=p(r-j,turn,k),C=p(r-j,turn,h),D=p(l+j,turn,h);
      quad(roof,a,e,B,A,roofTint);tri(roof,B,C,v,roofTint);quad(roof,B,e,g,C,roofTint);
      quad(roof,g,d,D,C,roofTint);quad(roof,d,a,A,D,roofTint);
      quad(roof,A,B,v,u,roofTint);quad(roof,C,D,u,v,roofTint);tri(roof,D,A,u,roofTint);
      b('trimLine',l+j,r-j,turn-.017,turn+.017,k-.029,k+.025,c(0x918073));
    }else{
      quad(roof,a,e,v,u,roofTint);quad(roof,g,d,u,v,roofTint);
      const end=style==='gable'?'stucco':roof;
      const tint=style==='gable'?wallTint:roofTint;
      tri(end,d,a,u,tint);tri(end,e,g,v,tint);
    }
    if(w>5.6){
      const x=l+w*.68,cw=w>12?.58:.43,z=-depth*.57;
      b('houseStone',x-cw/2,x+cw/2,peak-.75,peak+.49,z-.42,z+.023,c(0xbfa793));
      b('trimLine',x-cw/2-.068,x+cw/2+.068,peak+.44,peak+.548,z-.48,z+.074,metal);
      b('trimLine',x-cw*.28,x+cw*.26,peak+.54,peak+.597,z-.33,z-.10,slotDark);
    }
  }

  let l=0;
  for(const [i,type] of types.entries()){
    const r=i===types.length-1?L:l+weights[i]*L/sum,w=r-l,seed=id*13+i*23;
    const civic=type==='civic',ornate=civic||type==='corner'||type==='stone',shop=type==='shop',close=!annex;
    const g=civic?3.43:shop?3.29:3.10+(seed%3)*.145,floors=annex?2:civic||type==='corner'||seed%5<3?3:2;
    const upper=(civic?2.71:2.44)+(seed%5)*.083,yTop=g+(floors-1)*upper+.078;
    const dep=(civic?8.2:6.75)+(seed%3)*.91,wall=c(civic?0xe1d7c5:pick(plaster,seed)),dress=c(civic?0xc7ae8d:pick(limestone,seed));
    const sock=c(0xb7a894),wood=c(pick(timber,seed)),roofStyle=civic||type==='corner'?'mansard':seed%5===0?'gable':'hip';
    const roof=(type==='stone'&&seed%3!==1)?'roof':'tileRoof',roofTint=c(pick(roof==='roof'?slate:clay,seed));
    const bays=civic?Math.max(3,2*Math.round(w/5)-1):clamp(Math.round((w-.35)/(shop?2.59:2.34)),1,7);
    const center=Math.floor(bays/2),entry=civic?center:((seed%4===1)?0:bays-1);
    const put=(m,a,z,y,h,d0,d1,t)=>b(m,a,z,y,h,d0,d1,t);
    block(frame,l,r,-dep,.075);
    b('stucco',l,r,groundY,yTop,-dep,-.402,wall);
    // The rows are laid around genuinely open, shadowed reveals. Sash
    // placement and door axes now share the same building grid.
    const step=w/bays,formal=ornate&&(w>4.2||civic);
    for(let row=0;row<floors;row++){
      const bottom=row===0?groundY:g+(row-1)*upper,end=row===0?g:row===floors-1?yTop:bottom+upper;
      for(let j=0;j<bays;j++){
        const a=l+j*step,z=l+(j+1)*step,mid=(a+z)/2,central=civic&&Math.abs(j-center)<=1;
        const face=.022+(central?.163:0),reveal=face-(row===0?.31:.23);
        const door=row===0&&j===entry,arch=door&&(civic||formal&&seed%3!==1);
        const paneWidth=door?Math.min(step*.60,civic?1.61:1.31):shop&&row===0?Math.min(step*.71,1.82):Math.min(step*.57,civic?1.29:1.15);
        const lo=mid-paneWidth/2,hi=mid+paneWidth/2;
        const y=row===0?(door?.036:shop?.67:.94):bottom+(row===1?.438:.412),
          h=row===0?(door?(arch?2.77:2.46):shop?2.61:2.38):bottom+(row===1?1.985:Math.min(1.89,upper-.43));
        const cap=arch?h+.192:h;
        const solid=(x,r,a,b)=>{if(r-x>.001)put('stucco',x,r,a,b,-.413,face,wall)};
        solid(a,lo,bottom,end);solid(hi,z,bottom,end);
        solid(lo,hi,bottom,y);solid(lo,hi,cap,end);
        if(row===0){
          const plinth=(x,q)=>b('houseStone',x,q,groundY,.43,-.192,face+.037,sock);
          plinth(a,lo);plinth(hi,z);if(!door)plinth(lo,hi);
          if(formal)for(const y0 of [.61,1.12,1.62,2.12,2.61]){
            surf('trimLine',a,lo-.168,y0,y0+.015,face+.002,slotDark);
            surf('trimLine',hi+.168,z,y0,y0+.015,face+.002,slotDark);
          }
        }
        if(door){portal(lo,hi,face,reveal,h,arch?'round':'plain',dress,wood,wall);continue}
        const palette={frame:pick(painted,seed+j+row*3),sky:pick([0x748491,0x687a8b,0x53616d,0x657172],seed+j*3+row),
          shutter:pick(timber,seed+1),curtains:(seed+j*5+row*3)%7<2?0xa3a399:0,grid:(row!==0&&formal)||shop&&row===0};
        const warm=(seed*17+row*5+j*7)%19<(shop&&row===0?8:3);
        const shutters=close&&!formal&&row>0&&step>1.72&&(seed+row)%4<2;
        surround(lo,hi,y,h,face,reveal,shop&&row===0?'shop':formal?'formal':'regular',dress,palette,warm,shutters);
        if(shop&&row===0&&step>1.55){
          b('sash',a+.103,z-.102,2.82,3.025,face-.017,face+.087,wood);
          b('houseStone',a+.083,z-.087,3.014,3.083,face-.08,face+.118,dress);
          if(close&&(id+i)%4===0){
            const a0=lo-.13,r0=hi+.13,z1=face+.62,z0=face+.028;
            quad('canvasAwning',p(a0,2.87,z0),p(a0,2.66,z1),p(r0,2.66,z1),p(r0,2.87,z0),wood);
            surf('canvasAwning',a0,r0,2.536,2.66,z1,wood);
            for(let k=0;k<7;k+=2){
              const s=a0+(r0-a0)*k/7,t=a0+(r0-a0)*(k+1)/7,stripe=c(0xcdbea2);
              quad('canvasAwning',p(s,2.873,z0+.003),p(s,2.663,z1+.004),p(t,2.663,z1+.004),p(t,2.873,z0+.003),stripe);
              surf('canvasAwning',s,t,2.537,2.662,z1+.002,stripe);
            }
          }
        }
      }
    }
    const trimAt=[g-.049,...(formal&&floors===3?[g+upper-.061]:[])];
    for(const row of trimAt){
      b('houseStone',l,r,row,row+.071,-.199,civic?.248:.103,dress);
      if(formal)b('lintel',l,r,row+.067,row+.105,-.068,civic?.272:.133,dress);
    }
    if(w>4.5&&formal){
      for(const x of civic?[l+(center-1)*step+.078,l+(center+2)*step-.078]:[l+.118,r-.118]){
        const ww=civic?.15:.094;
        if(civic)b('houseStone',x-ww,x+ww,3.46,yTop-.14,.123,.265,dress);
        else for(let y=.47,q=0;y<g-.148;y+=.4,q++){
          const half=q%2===0?.185:.143;
          b('houseStone',x-half,x+half,y,y+.366,-.118,.112,dress);
        }
        b('lintel',x-ww-.040,x+ww+.040,yTop-.322,yTop-.182,.038,civic?.287:.177,dress);
      }
    }
    if(w>3.75){
      const x=civic?r-.254:seed%2?l+.132:r-.214,pipe=c(0x928c85);
      b('trimLine',x-.034,x+.035,.22,yTop-.132,.071,.142,pipe);
      for(const y of [.77,g+.22,yTop-.475])
        b('trimLine',x-.051,x+.050,y,y+.045,.037,.147,pipe.clone().multiplyScalar(.80));
    }
    // Eave shadow, moulded cornice and gutter remain distinct at night.
    b('houseStone',l,r,yTop-.236,yTop-.159,-.226,civic?.265:.112,dress);
    b('lintel',l,r,yTop-.164,yTop-.074,-.229,civic?.298:.176,dress);
    b('houseStone',l-.031,r+.031,yTop-.071,yTop+.009,-.213,civic?.329:.211,dress);
    b('trimLine',l-.025,r+.025,yTop+.006,yTop+.083,.168,.232,metal);
    const eave=yTop+.059,peak=eave+(roofStyle==='mansard'?(civic?2.95:2.47):1.53+(seed%5)*.21);
    roofForm(l,r,eave,peak,dep,roofStyle,roof,roofTint,wall);
    if(civic){
      const x=(l+r)*.5,span=Math.min(w*.285,4.12),y=eave-.014,crest=y+1.45,d=.346;
      const rim=c(0xe0d0b5);
      tri('houseStone',p(x-span,y,d),p(x+span,y,d),p(x,crest,d),wall.clone().lerp(dress,.28));
      for(const s of [-1,1]){
        const a=p(x+s*span,y-.027,d+.051),g=p(x,crest-.029,d+.051),q=p(x,crest+.118,d+.051),t=p(x+s*span,y+.103,d+.051);
        if(s<0)quad('lintel',a,g,q,t,rim);else quad('lintel',g,a,t,q,rim);
        const badge=(a,v)=>p(x+s*(.48+(1-v)*1.30),y+.43+Math.sin(v*Math.PI)*.12+a,d+.030);
        for(let j=0;j<8;j++){
          const a=j/8,b=(j+1)/8;
          const A=badge(0,a),B=badge(0,b),C=badge(.049,b),D=badge(.049,a);
          if(s>0)quad('lintel',B,A,D,C,rim);else quad('lintel',A,B,C,D,rim);
        }
      }
      b('houseStone',x-span-.068,x+span+.068,y-.088,y+.025,.219,d+.095,rim);
      const ob=(a,rx,ry)=>p(x+Math.cos(a)*rx,y+.499+Math.sin(a)*ry,d+.041);
      for(let n=0;n<16;n++){
        const a=n*Math.PI/8,e=(n+1)*Math.PI/8;
        quad('lintel',ob(a,.279,.235),ob(a,.354,.286),ob(e,.354,.286),ob(e,.279,.235),rim);
      }
    }
    if(close&&w>6.95){
      const n=civic?Math.min(5,bays):roofStyle==='mansard'?2:seed%4===0?2:1;
      for(let j=0;j<n;j++){
        if(civic&&j===Math.floor(n/2))continue;
        const x=l+w*(j+1)/(n+1),mansard=roofStyle==='mansard',z=-dep*(mansard?.111:.151);
        const sill=eave+(peak-eave)*(mansard?.30:.337),head=sill+(civic?.91:.78);
        dormer(x,Math.min(.98,w/(n+1)*.59),sill,head,z,roof,roofTint,dress,civic?'crest':'plain',(seed+j*3)%9===1);
      }
    }
    l=r;
  }
  // Same apron footprint and downward-height query as before.
  const outside=frame.point;
  quad('walk',outside(.08,-.014,.01),outside(L-.08,-.014,.01),outside(L-.08,-.015,1.15),outside(.08,-.015,1.15));
  quad('curbstone',outside(.08,-.015,1.15),outside(L-.08,-.015,1.15),outside(L-.08,-.046,1.32),outside(.08,-.046,1.32));
}
