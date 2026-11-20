// Original sculpture studies, local +Z forward. Rings run from ground to crown;
// the same tools make folds in robes, lobed shells and a rounded square plinth.
export function sculptKit(T,far=false){
 const bins=new Map(),M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),V=(x,y,z)=>new T.Vector3(x,y,z);
 const tau=2*Math.PI;
 let frame=new T.Matrix4();
 function place(x,y,z,angle,scale,fn){
   const old=frame;frame=frame.clone().multiply(new T.Matrix4().compose(V(x,y,z),new T.Quaternion().setFromAxisAngle(V(0,1,0),angle),V(scale,scale,scale)));
   fn();frame=old;
 }
 function relief(x,y,z,sx,sy,sz,fn){
   const old=frame;frame=frame.clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).scale(V(sx,sy,sz));fn();frame=old;
 }
 function put(key,g,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
   const b=bins.get(key)??{p:[],n:[],i:[]};bins.set(key,b);
   const mat=M.compose(V(x,y,z),Q.setFromEuler(E.set(rx,ry,rz)),V(sx,sy,sz)).premultiply(frame),
     nm=new T.Matrix3().getNormalMatrix(mat),p=V(),n=V(),v=g.attributes.position,normal=g.attributes.normal,base=b.p.length/3;
   for(let i=0;i<v.count;i++){p.fromBufferAttribute(v,i).applyMatrix4(mat);n.fromBufferAttribute(normal,i).applyNormalMatrix(nm);
     b.p.push(p.x,p.y,p.z);b.n.push(n.x,n.y,n.z);}
   for(let i=0;i<(g.index?.count??v.count);i++)b.i.push(base+(g.index?g.index.getX(i):i));
 }
 const ball=new T.SphereGeometry(1,far?10:16,far?7:11),mini=new T.SphereGeometry(1,far?6:8,far?4:5),cube=new T.BoxGeometry(1,1,1);
 const oval=(mat,x,y,z,a,b,c,rx=0,ry=0,rz=0)=>{
   if(!far||Math.max(a,b,c)>.047)put(mat,Math.max(a,b,c)<.080?mini:ball,x,y,z,a,b,c,rx,ry,rz);
 };
 const box=(mat,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>put(mat,cube,x,y,z,w,h,d,rx,ry,rz);
 function lathe(mat,x,y,z,profile,seg=64,stretch=1){
   const g=new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),far?Math.max(12,Math.round(seg*.39)):seg);
   put(mat,g,x,y,z,1,1,stretch);g.dispose();
 }
 // [height, radiusX, radiusZ, offsetZ, flute depth, offsetX]. Smooth seam.
 function loft(mat,rows,{n=36,lobes=9,power=1,phase=0,warp}={}){
   if(far)n=Math.max(12,Math.round(n*.43));
   const p=[],ix=[],sp=(a,p)=>Math.sign(a)*Math.abs(a)**p;
   rows.forEach(([y,rx,rz,cz=0,amp=0,cx=0],j)=>{
     for(let i=0;i<n;i++){
       const a=i*tau/n,fold=1+amp*(Math.cos(a*lobes+phase+j*.12)+.26*Math.sin(a*(lobes+2)-j*.22));
       const pt=[cx+sp(Math.cos(a),power)*rx*fold,y,cz+sp(Math.sin(a),power)*rz*fold];
       if(warp)warp(pt,a,j);
       p.push(...pt);
       if(j){const b=(j-1)*n+i,c=(j-1)*n+(i+1)%n;ix.push(b,b+n,c,c,b+n,c+n);}
     }
   });
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();put(mat,g);g.dispose();
 }
 function curve(mat,pts,r=.025,steps=14,sides=6){
   if(far){
     if((Array.isArray(r)?Math.max(...r):r)<.028&&mat!=='jet')return;
     steps=Math.max(3,Math.round(steps*.46));sides=Math.max(4,Math.round(sides*.60));
   }
   const path=new T.CatmullRomCurve3(pts.map(p=>V(...p)));
   if(Array.isArray(r)){
     const g=new T.TubeGeometry(path,steps,1,sides,false),v=g.attributes.position;
     for(let i=0;i<=steps;i++){const center=path.getPointAt(i/steps),t=i/steps*(r.length-1),j=Math.min(r.length-2,Math.floor(t)),rad=r[j]+(r[j+1]-r[j])*(t-j);
       for(let a=0;a<=sides;a++){const ix=i*(sides+1)+a,p=V().fromBufferAttribute(v,ix).sub(center).multiplyScalar(rad).add(center);v.setXYZ(ix,p.x,p.y,p.z);}}
     g.computeVertexNormals();put(mat,g);g.dispose();
   }else{const g=new T.TubeGeometry(path,steps,r,sides,false);put(mat,g);g.dispose();}
 }
 function finish(root,mats){
   for(const [key,b] of bins){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setIndex(b.i);g.computeBoundingSphere();
     const o=new T.Mesh(g,mats[key]);o.name='Paulibrunnen · '+key;o.castShadow=!['water','jet','joint'].includes(key);o.receiveShadow=key!=='jet';root.add(o);}
   ball.dispose();mini.dispose();cube.dispose();
 }
 return {place,relief,oval,box,lathe,loft,curve,finish};
}

// Portrait head with a continuous jaw, cheeks, brow, bridge and chin. Profiles
// and medallions are sculptural approximations, not photo reproductions.
export function head(k,m,hair,style=0){
 const {loft,oval,curve}=k;
 const contour=[[0,.043,.047,.014],[.023,.067,.077,.019],[.066,.084,.087,.016],[.104,.097,.094,.010],
   [.148,.100,.10,0],[.19,.10,.101,-.006],[.227,.094,.092,-.012],[.256,.073,.072,-.013],[.274,.01,.013,-.011]];
 const facialRings=contour.flatMap((r,i)=>i===contour.length-1?[r]:
   [r,r.map((v,j)=>v+(contour[i+1][j]-v)*.33),r.map((v,j)=>v+(contour[i+1][j]-v)*.667)]);
 loft(m,facialRings,
   {n:40,warp(p,a){const [x,y]=p,gauss=(x,y,w,h)=>Math.exp(-(x*x/(w*w)+y*y/(h*h)));p[2]+=Math.max(0,Math.sin(a))**2*
     (.035*gauss(x,y-.128,.019,.050)+.016*gauss(x,y-.117,.016,.019)-.012*gauss(Math.abs(x)-.041,y-.155,.026,.014)
       +.015*gauss(Math.abs(x)-.042,y-.17,.033,.012)+.011*gauss(Math.abs(x)-.059,y-.135,.027,.025)+.010*gauss(x,y-.045,.05,.024));}});
 for(const s of [-1,1]){
   oval(m,s*.096,.122,-.004,.015,.025,.014,-.1,0,s*.12);
   oval(m,s*.041,.154,.093,.019,.007,.009,0,s*.29);
   curve(m,[[s*.018,.153,.099],[s*.038,.159,.101],[s*.057,.153,.09]],[.001,.004,.001],9,5);
   oval(m,s*.011,.117,.126,.010,.007,.009);
   curve(m,[[s*.020,.171,.106],[s*.039,.177,.107],[s*.060,.168,.094]],[.002,.007,.001],9,6);
   curve(m,[[s*.017,.116,.117],[s*.028,.106,.110],[s*.033,.086,.103]],[.001,.003,.001],8,5);
 }
 curve(m,[[-.031,.076,.100],[-.009,.079,.109],[0,.077,.109],[.010,.08,.109],[.029,.077,.101]],[.001,.004,.004,.001],10,6);
 oval(m,0,.071,.105,.025,.005,.006);
 oval(hair,0,.195,-.027,.102,.077,.095);
 for(let j=0;j<14;j++){const a=j*Math.PI/7;oval(hair,Math.cos(a)*.087,.201+Math.sin(a)*.016,-.012+Math.sin(a)*.077,.032,.028,.034,.13,a,.23);}
 for(const s of [-1,1])for(let j=0;j<4;j++)curve(hair,[[s*(.009+j*.010),.255,-.014+j*.014],[s*.06,.244,.013+j*.016],
   [s*(.075+j*.004),.223,.038+j*.009],[s*.088,.19,.028+j*.007]],[.004,.009,.011,.004],10,6);
 if(style===1){oval(hair,0,.145,-.109,.073,.066,.054);for(let j=0;j<6;j++)oval(hair,Math.sin(j)*.035,.119+j*.006,-.125,.034,.042,.029,0,0,j*.3);}
}

export function allegory(k,industry){
 const {loft,oval,curve,box,place}=k,m='bronze',trim='worn';
 // Trailing skirt, lap pushed out over bent knees, with irregular pleats.
 loft(m,[[.024,.42,.63,.13,.115],[.055,.445,.666,.13,.11],[.13,.387,.59,.15,.13],
   [.26,.316,.49,.17,.12],[.45,.283,.416,.20,.10],[.60,.27,.374,.20,.082],[.695,.265,.35,.18,.057],
   [.74,.25,.316,.166,.036],[.77,.209,.261,.13,.022],[.782,.077,.125,.10,.004]],{n:80,lobes:11,phase:industry?.9:2.1,
   warp(p,a,j){const f=Math.sin(a),d=Math.cos(a);p[0]+=.071*f*Math.sin(j*.39);p[2]+=.08*d*Math.cos(j*.36);
     p[1]+=.035*Math.sin(3*a+j*.35)*(j===0?.36:1)+.065*Math.min(1,j/5)*Math.abs(d)*Math.max(0,f);}});
 loft(m,[[.60,.21,.20,-.065,.055],[.73,.205,.166,-.079,.064],[.86,.168,.143,-.089,.045],
   [.99,.184,.15,-.117,.048],[1.10,.206,.152,-.133,.05],[1.17,.215,.137,-.13,.046],
   [1.225,.148,.096,-.128,.034],[1.24,.073,.073,-.122,.012]],{n:52,lobes:9});
 // Cascading mantle falling off one shoulder down the rear of the seat.
 loft(m,[[.045,.31,.22,-.35,.15],[.20,.274,.18,-.304,.13],[.49,.23,.155,-.244,.11],
   [.78,.20,.14,-.215,.10],[.99,.19,.104,-.209,.09],[1.19,.181,.091,-.19,.07],[1.23,.106,.054,-.174,.04]],{n:48,lobes:10});
 oval(m,0,1.243,-.122,.075,.09,.068);
 place(0,1.268,-.119,industry?.23:-.29,1.05,()=>head(k,m,m,1));
 if(industry){
   // Mural crown above Erlangia; cogwheel at the rear, not a halo.
   k.lathe(m,0,1.515,-.14,[[.081,0],[.098,.009],[.094,.029],[.084,.031]],24);
   for(let j=0;j<7;j++){const a=j*.898;box(m,.087*Math.sin(a),1.555,-.14+.087*Math.cos(a),.037,.041,.027,0,a);}
   place(.23,.32,-.345,.12,1,()=>{
     const hoop=Array.from({length:25},(_,i)=>[0,Math.cos(i*Math.PI/12)*.285,Math.sin(i*Math.PI/12)*.285]);
     curve(m,hoop,.040,40,8);oval(m,0,0,0,.062,.082,.084);
     for(let j=0;j<18;j++){const a=j*Math.PI/9;box(trim,0,.31*Math.cos(a),.31*Math.sin(a),.093,.055,.051,a);
       if(j%3===0)curve(m,[[0,0,0],[0,.14*Math.cos(a),.14*Math.sin(a)],[0,.265*Math.cos(a),.265*Math.sin(a)]],.023,4);}
   });
 }else{
   for(const s of [-1,1]){box(m,s*.100,.812,.293,.203,.036,.282,-.12,0,-s*.13);
     box(trim,s*.101,.834,.292,.193,.014,.269,-.12,0,-s*.13);}
 }
 for(const s of [-1,1]){
   const handY=industry&&s<0?1.05:.827,z=industry&&s<0?.149:.259;
   curve(m,[[s*.146,1.16,-.131],[s*.215,1.12,-.094],[s*.259,.972,.016],
     [s*.221,(.976+handY)/2,.111],[s*.139,handY,z]],[.068,.078,.059,.048,.028],24,12);
   oval(m,s*.132,handY,z,.051,.038,.076,-.24,s*.29);
   for(let j=0;j<3;j++)curve(m,[[s*.129+j*.013,handY-.014,z+.037],[s*.127+j*.013,handY-.026,z+.084]],.007,3);
 }
 for(let j=0;j<6;j++){
   const xx=-.235+j*.082;
   curve(m,[[xx*.52,1.16,-.023],[xx*.73,1.064,.017],[xx*.64+.012,.904,.040],[xx*.56,.795,.064]],[.003,.018,.011,.002],14,7);
 }
 // Looped and diagonal folds break the bell silhouette; a sandalled toe
 // appears where the front hem lifts off the plinth.
 oval(m,-.17,.081,.646,.104,.067,.174,-.04,-.2);
 for(let i=0;i<6;i++){
   const s=i%2===0?1:-1,h=.18+Math.floor(i/2)*.15;
   curve(m,[[s*.255,h+.13,.22],[s*.223,h+.09,.39],[s*.141,h+.016,.52],
     [s*.082,h+.037,.59-Math.floor(i/2)*.050]],[.004,.021,.026,.002],14,7);
 }
 curve(m,[[-.175,1.188,-.078],[-.075,1.13,.013],[.104,1.05,.004],[.175,.924,-.084]],[.018,.03,.028,.009],18,9);
}

export function bearer(k){
 const {loft,oval,curve,place}=k,m='carving';
 // Half-length shell carrier grows out of an acanthus console.
 loft(m,[[0,.114,.125,0,.08],[.11,.19,.18,.013,.13],[.30,.151,.153,.035,.10],
   [.48,.124,.154,.084,.09],[.67,.20,.178,.088,.072],[.79,.227,.156,.066,.04],
   [.93,.17,.14,.083,.026],[1.08,.20,.155,.095,.024],[1.20,.224,.15,.085,.018],[1.28,.125,.094,.068,.01]],{n:38});
 for(const s of [-1,1]){
   curve(m,[[s*.15,1.206,.096],[s*.228,1.19,.139],[s*.295,1.135,.243],[s*.275,1.24,.286],
     [s*.19,1.38,.231],[s*.125,1.477,.145]],[.082,.078,.059,.055,.040,.027],21,10);
   oval(m,s*.119,1.462,.132,.038,.063,.042,-.29);
 }
 oval(m,0,1.285,.07,.064,.078,.071);
 place(0,1.268,.145,.52,1,()=>head(k,m,m));
}
