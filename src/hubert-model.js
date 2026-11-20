// Rest-pose tailoring in metres, local +Z forward. Sleeves, trousers and
// hands share the existing walking rig, but not the combat ghoul's geometry.
export function sculptHubert({T,surface,oval,line,panel,geom}){
 const rows=(m,r,n=28,d=.012)=>surface(m,r,n,d);
 rows('coat',[[.842,.167,.115,0,.02,0],[.857,.174,.119,0,.02,0],[.97,.16,.107,0,.024,0],
 [1.07,.15,.101,0,.047,[0,1,.72]],[1.19,.178,.112,0,.071,[1,2,.51]],
 [1.31,.206,.127,.005,.087,2],[1.38,.216,.114,.006,.10,2],[1.425,.179,.095,.01,.11,2],
 [1.462,.086,.079,.012,.127,2],[1.46,.055,.057,.012,.133,2]],32,.026);
 rows('skin',[[1.437,.054,.051,.012,.129,3],[1.48,.057,.061,.012,.14,3],
 [1.524,.053,.052,.013,.153,[3,4,.3]],[1.577,.060,.060,.015,.171,4],[1.598,.048,.048,.015,.178,4]]);
 rows('leather',[[.977,.164,.11,0,.024,0],[.984,.165,.113,0,.025,0],[1.020,.160,.112,0,.032,[0,1,.2]]]);
 panel('metal',0,[.004,1.000,.146],[.055,.040,.013],undefined,1.18);
 for(const s of [-1,1]){
   const arm=s<0?6:9,el=arm+1,h=arm+2,leg=s<0?12:15,knee=leg+1,boot=leg+2;
   const sleeve=[[.946,.043,.048,.257,.175,el],[.96,.052,.057,.256,.174,el],[1.003,.049,.052,.251,.163,el],
    [1.088,.053,.056,.245,.131,el],[1.143,.058,.060,.237,.117,[arm,el,.66]],
    [1.19,.055,.06,.228,.115,[arm,el,.19]],[1.29,.065,.071,.209,.103,arm],
    [1.365,.073,.077,.187,.1,arm],[1.408,.056,.063,.176,.103,[2,arm,.65]],
    [1.423,.024,.039,.158,.103,2]];
   rows('coat',sleeve.map(([y,a,b,x,z,j])=>[y,a,b,s*x,z,j]),24,.032);
   rows('liner',[[.951,.052,.055,s*.256,.176,el],[.970,.053,.057,s*.256,.171,el]],24);
   if(s<0){
     // Faded linen prisoner band with two blue woven bars, not a party insignia.
     rows('teeth',[[1.248,.064,.070,s*.219,.109,arm],[1.308,.070,.076,s*.204,.103,arm]],30);
     for(const y of [1.253,1.296])rows('liner',[[y,.066+(y-1.25)*.10,.073+(y-1.25)*.10,s*(.217-(y-1.25)*.23),.107,arm],
       [y+.006,.067+(y-1.25)*.10,.074+(y-1.25)*.10,s*(.216-(y-1.25)*.23),.107,arm]],28);
   }
   const wx=s*.258;
   rows('skin',[[.835,.020,.021,wx,.197,h],[.855,.035,.024,wx,.196,h],[.895,.039,.028,wx,.19,h],
    [.926,.030,.025,wx,.184,h],[.955,.032,.028,wx,.178,[el,h,.23]]],24);
   for(let j=0;j<4;j++){
     const x=wx+s*(j-1.5)*.016,tip=.80+(j===1?-.008:Math.abs(j-1)*.008);
     line('skin',h,[x,.862,.196],[x+s*.004,tip+.019,.213],.009,.011);
     line('skin',h,[x+s*.004,tip+.025,.211],[x+s*.003,tip,.226],.008,.008);
   }
   line('skin',h,[wx-s*.028,.902,.192],[wx-s*.044,.851,.222],.013,.014);
   const X=.104*s;
   rows('canvas',[[.232,.046,.053,X,.015,knee],[.28,.053,.061,X,.016,knee],
    [.35,.065,.070,X,.015,knee],[.442,.062,.065,X,.025,[leg,knee,.77]],
    [.492,.067,.080,X,.031,[leg,knee,.47]],[.53,.070,.075,X,.016,[leg,knee,.10]],
    [.66,.081,.084,X,.012,leg],[.81,.092,.093,X,.015,leg],[.885,.091,.101,X,.018,leg],[.926,.074,.089,X,.015,[leg,0,.25]]],28,.031);
   rows('leather',[[.072,.056,.078,X,.038,boot],[.108,.053,.067,X,.031,[boot,knee,.45]],
    [.172,.052,.052,X,.018,knee],[.245,.056,.057,X,.013,knee],[.273,.058,.059,X,.015,knee],[.277,.050,.049,X,.015,knee]],24);
   oval('leather',boot,[X,.073,.089],[.059,.056,.133],[-.055,0,0]);panel('leather',boot,[X,.028,.087],[.125,.032,.247],undefined,.67);
   for(let j=0;j<4;j++)line('canvas',boot,[X-.026,.133-j*.007,.053+.015*j],[X+.029,.13-j*.007,.062+.015*j],.003,.004);
   for(const [Y,Z,width,bone] of [[1.251,.190,.102,2],[.925,.113,.115,0]]){
     panel('coat',bone,[s*.107,Y,Z],[width,.097,.021],[.1,s*.31,0]);
     panel('liner',bone,[s*.107,Y+.046,Z+.005],[width+.006,.032,.019],[.12,s*.31,s*.035]);
     oval('metal',bone,[s*.107,Y+.040,Z+.019],[.005,.005,.003]);
   }
   line('liner',2,[s*.067,1.448,.185],[s*.043,1.376,.211],.023,.012);
   line('canvas',2,[s*.091,1.438,.118],[s*.181,1.412,.117],.018,.035);
   line('liner',2,[s*.018,1.383,-.017],[s*.158,1.357,.014],.004,.005,.91);
   for(let j=0;j<3;j++)line('liner',knee,[X-.035,.295+j*.022,.060],[X+.04,.305+j*.022,.055],.004,.003,.90);
 }
 for(let j=0;j<5;j++)oval('metal',j<2?1:2,[.016,1.071+.071*j,[.153,.172,.196,.209,.214][j]],[.007,.007,.004]);
 // Single contoured face: project anatomy into the front half of each ring.
 const profile=[[1.541,.031,.042,.191],[1.552,.051,.057,.193],[1.574,.068,.068,.19],[1.598,.076,.074,.186],
  [1.621,.078,.080,.179],[1.651,.080,.085,.175],[1.685,.085,.087,.171],[1.714,.086,.090,.168],
  [1.745,.088,.091,.164],[1.775,.086,.09,.16],[1.803,.076,.083,.156],[1.823,.056,.066,.154],[1.836,.009,.021,.154]];
 const coords=[],ix=[],N=52,gauss=(a,b,wx,hy)=>Math.exp(-a*a/(wx*wx)-b*b/(hy*hy));
 function relief(u,y){return .027*gauss(u,y-1.662,.016,.031)+.016*gauss(u,y-1.686,.013,.043)
       -.010*gauss(Math.abs(u)-.036,y-1.695,.025,.014)+.009*gauss(Math.abs(u)-.039,y-1.712,.029,.014)
       +.008*gauss(Math.abs(u)-.052,y-1.668,.027,.019)-.008*gauss(Math.abs(u)-.053,y-1.626,.025,.025)
       +.008*gauss(u,y-1.574,.036,.019);}
 function faceZ(x,y){
   let j=0;while(j<profile.length-2&&y>profile[j+1][0])j++;
   const t=(y-profile[j][0])/(profile[j+1][0]-profile[j][0]),r=profile[j].map((a,k)=>a+t*(profile[j+1][k]-a));
   const u=x-.013,fr=Math.sqrt(Math.max(0,1-(u/r[1])**2));return r[3]+r[2]*fr+fr*fr*relief(u,y);
 }
 // Curved, conforming ribbons for the lids, mouth and creases. An ellipsoid
 // partly buried in a convex face otherwise leaves two disconnected marks.
 function ribbon(m,bone,l,r,height,half,bulge,depth,shade){
   const v=[],idx=[],count=20;
   for(let n=0;n<=count;n++){
     const t=n/count,x=l+t*(r-l),h=height(t),taper=Math.max(.025,Math.sin(Math.PI*t)**.62);
     for(let j=0;j<5;j++){
       const a=j/2-1,y=h+a*half*taper;
       v.push(x,y,faceZ(x,y)+depth+bulge*(1-a*a)*taper);
       if(n&&j){const i=v.length/3-1;idx.push(i-6,i-1,i,i-6,i,i-5);}
     }
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();
   geom(g,m,bone,new T.Matrix4(),shade);g.dispose();
 }
 for(let i=0;i<=48;i++){
   const t=i/48*(profile.length-1),j=Math.min(profile.length-2,Math.floor(t)),r=profile[j].map((v,k)=>v+(profile[j+1][k]-v)*(t-j));
   for(let n=0;n<N;n++){
     const a=n*2*Math.PI/N,u=Math.cos(a)*r[1],y=r[0],fr=Math.max(0,Math.sin(a));
     coords.push(.013+u,y,r[3]+Math.sin(a)*r[2]+fr*fr*relief(u,y));
     if(i){const v=(i-1)*N+n,w=(i-1)*N+(n+1)%N;ix.push(v,v+N,w,w,v+N,w+N);}
   }
 }
 const face=new T.BufferGeometry();face.setAttribute('position',new T.Float32BufferAttribute(coords,3));face.setIndex(ix);face.computeVertexNormals();
 geom(face,'skin',p=>[4,5,Math.max(0,Math.min(.92,(1.620-p.y)/.057))]);face.dispose();
 for(const s of [-1,1]){
   const x=.013+s*.034,Y=1.695,arc=t=>Math.sin(Math.PI*t);
   ribbon('teeth',4,x-.014,x+.014,()=>Y,.0047,.0022,.0013,.69);
   oval('eyeBed',4,[x,Y,faceZ(x,Y)+.0037],[.0036,.0039,.0014]);
   ribbon('skin',4,x-.016,x+.016,t=>Y+.0044*arc(t),.0028,.0024,.0023,.83);
   ribbon('dry',4,x-.016,x+.016,t=>Y-.0042*arc(t),.0021,.0014,.0017,.84);
   ribbon('liner',4,x-.019,x+.020,t=>1.710+.005*arc(t)-s*.004*(t-.5),.0029,.0012,.0016,.68);
   const nx=.013+s*.010,ny=1.654;
   oval('skin',4,[nx,ny,faceZ(nx,ny)-.001],[.008,.006,.005]);
   ribbon('eyeBed',4,nx-.003,nx+.003,t=>ny-.002+.0009*arc(t),.0013,.0011,.0048,.70);
   oval('dry',4,[.013+s*.083,1.654,.156],[.013,.027,.018],[-.11,0,-s*.12]);
   oval('skin',4,[.013+s*.093,1.656,.161],[.004,.016,.009],undefined,.66);
   for(let j=0;j<2;j++)ribbon('skin',4,x-.016,x+.019,t=>1.685-.004*arc(t)-j*.003,.0010,.0008,.001,.77);
   for(let j=0;j<3;j++)line('dry',3,[.013+s*.045,1.536-j*.008,.170],[.013+s*.019,1.511-j*.006,.201],.002,.002,.83);
 }
 const lips=t=>1.605+.002*Math.sin(Math.PI*t)-.002*t;
 const bind=p=>[4,5,Math.max(0,Math.min(.92,(1.620-p.y)/.057))];
 ribbon('skin',bind,-.018,.044,t=>lips(t)+.0025,.0031,.002,.0014,.76);
 ribbon('eyeBed',bind,-.017,.043,lips,.0019,.0006,.0030,.83);
 ribbon('dry',bind,-.017,.043,t=>lips(t)-.003,.0026,.002,.0016,.72);
 // Rolled rim, flared skirt and increasingly narrow crown, not a tall dome.
 rows('metal',[[1.716,.109,.121,.012,.153,4],[1.723,.111,.125,.012,.154,4],
   [1.744,.099,.111,.012,.153,4],[1.780,.096,.106,.011,.151,4],[1.812,.083,.092,.01,.151,4],
   [1.838,.059,.068,.008,.150,4],[1.851,.033,.041,.008,.149,4],[1.855,.001,.001,.008,.149,4]],44,.012);
 for(const s of [-1,1]){
   line('leather',4,[.012+s*.096,1.738,.158],[.012+s*.073,1.594,.205],.006,.005);
   line('leather',[4,5,.4],[.012+s*.073,1.597,.204],[.012+s*.008,1.55,.217],.006,.006);
   oval('metal',4,[.012+s*.100,1.75,.15],[.004,.007,.007],undefined,1.3);
 }
}
