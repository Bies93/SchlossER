import {sculptKit,head} from './pauli-sculpt.js';

// Hand-built sandstone reliefs. All repeated roof ornaments share one
// geometry batch per finish, including their rear and side silhouettes.
export function orangeryCarvings(T,parent){
  const k=sculptKit(T,true),{place,relief,loft,lathe,oval,curve,box}=k;
  const surface=(color,roughness=.92)=>new T.MeshStandardMaterial({color,roughness});
  const mats={cut:surface(0xd2b67d),shadow:surface(0xa58d60),high:surface(0xdfc58e),
    chalk:surface(0xdfd4bf),red:surface(0x942f24),black:surface(0x282923),gold:surface(0xb38e49)};
  const colors={body:'cut',stone:'high'},stone=colors.body,high=colors.stone;
  const map=(f,u,y,d,size,fn)=>{
    const [x,Y,z]=f.p(u,y,d),[X,,Z]=f.p(u,y,d+1);
    place(x,Y,z,Math.atan2(X-x,Z-z),size,fn);
  };
  function leaves(side,count=6){
    for(let i=0;i<count;i++){
      const y=.09+i*.046,x=side*(.10+.012*i);
      oval(i%3===0?high:stone,x,y,.016,.037,.082,.038,0,0,-side*.64);
      curve('shadow',[[x-side*.026,y-.042,.037],[x,y,.050],[x+side*.026,y+.047,.033]],.014,7,6);
    }
  }
  function urn(){
    lathe(stone,0,0,0,[[.119,0],[.129,.019],[.130,.035],[.091,.050],[.070,.091],[.076,.109],
      [.105,.135],[.145,.209],[.141,.251],[.127,.289],[.095,.322],[.105,.339],[.107,.363],[.088,.378]],32);
    for(let i=0;i<9;i++){
      const a=i*2*Math.PI/9,x=Math.sin(a),z=Math.cos(a);
      oval(high,x*.123,.209,z*.124,.031,.090,.023,0,a,-.064);
    }
    for(const s of [-1,1]){
      curve(stone,[[s*.083,.13,0],[s*.181,.195,0],[s*.179,.303,0],[s*.118,.327,0],[s*.112,.282,0]],[.019,.029,.026,.026,.016],14);
      oval(high,s*.172,.314,.006,.026,.036,.028);
    }
    oval(stone,0,.386,0,.075,.052,.073);
    for(let j=0;j<6;j++)oval(high,Math.sin(j*1.047)*.048,.395,Math.cos(j*1.047)*.048,.027,.045,.024,0,j,.24);
    oval(high,0,.439,0,.031,.037,.029);
  }
  function paired(f,u,y,d,scale=1){
    map(f,u,y,d,scale,()=>{
      box(stone,0,.028,0,.53,.056,.27);box('shadow',0,.065,0,.46,.035,.24);
      for(const s of [-1,1])place(s*.125,.082,.006,s*.17,.81,urn);
      oval(high,0,.140,.111,.039,.073,.032,0,0,.42);
    });
  }
  function eagle(){
    oval(stone,0,.28,.034,.132,.214,.136,-.24);oval(high,0,.405,.108,.091,.110,.094,-.38);
    oval(high,.052,.513,.131,.068,.076,.066,.12,0,-.42);
    curve('shadow',[[.073,.533,.164],[.134,.507,.192],[.140,.476,.198]],[.041,.029,.009],9,7);
    for(const s of [-1,1]){
      for(let i=0;i<6;i++){
        const x=s*(.247+i*.028),y=.35+i*.018;
        oval(i%2?stone:high,x,y,-.019+i*.013,.041,.138+i*.011,.043,0,s*.23,-s*(.61+i*.152));
      }
      oval(stone,s*.172,.36,-.034,.109,.126,.059,-.17,0,-s*.58);
      curve(high,[[s*.068,.172,.091],[s*.079,.075,.107],[s*.115,.040,.165]],.023,9,6);
      oval('shadow',s*.066,.035,.134,.053,.029,.077);
      oval(stone,s*.07,.131,-.06,.036,.11,.061,.3,0,s*.29);
    }
  }
  function statue(i){
    const s=i%2===0?-1:1;
    loft(stone,[[0,.18,.15,0,.08],[.075,.19,.137,.036,.12],[.22,.15,.134,.015,.10],
      [.39,.117,.097,.006,.12],[.54,.127,.101,-.016,.10],[.66,.101,.081,-.023,.075],
      [.78,.118,.091,-.023,.07],[.85,.051,.051,-.019,.02]],{n:32,lobes:7,
      warp(p,a,j){p[0]+=Math.sin(j*.48+a)*.026;p[1]+=Math.sin(a+j*.41)*.020;}});
    oval(stone,.04,.045,.125,.068,.046,.111,.11,-.28);
    oval(stone,0,.84,-.007,.046,.069,.041);
    place(0,.876,-.005,s*.24,.77,()=>head(k,high,stone,i%2));
    curve(stone,[[-s*.082,.774,-.009],[-s*.153,.655,.005],[-s*.139,.528,.074],[-s*.085,.471,.114]],[.061,.053,.041,.031],16,9);
    curve(high,[[s*.079,.776,-.006],[s*.153,.689,.004],[s*.205,.714,.106],[s*.104,.742,.16]],[.060,.053,.041,.028],16,9);
    curve(high,[[-s*.071,.81,.068],[s*.014,.67,.089],[s*.104,.61,.092],[s*.109,.471,.086]],[.019,.032,.027,.018],16);
    if(i===1||i===3)place(-s*.11,.39,.106,s*.43,.28,urn);
    else for(let j=0;j<6;j++)oval(high,s*(.09+(j%2)*.038),.77+Math.floor(j/2)*.034,.182,.034,.030,.029);
  }
  function reclining(s,flowers){
    // Distinguishable reclining figures on the broken pediment slopes.
    curve(stone,[[s*.87,.046,.002],[s*.67,.163,.026],[s*.49,.288,.066],[s*.36,.479,.050]],
      [.077,.141,.148,.110],22,12);
    oval(high,s*.30,.465,.075,.142,.112,.104,-.21,0,-s*.42);
    place(s*.237,.511,.069,-s*.35,.61,()=>head(k,high,stone,1));
    curve(stone,[[s*.31,.489,.113],[s*.389,.611,.170],[s*.483,.565,.238],[s*.484,.440,.217]],[.052,.047,.039,.026],15,8);
    curve(high,[[s*.34,.425,.102],[s*.408,.37,.149],[s*.515,.398,.181]],[.042,.046,.024],11,7);
    for(let j=0;j<5;j++)curve(high,[[s*(.48+j*.054),.38-j*.035,.102],[s*(.53+j*.061),.28-j*.022,.177],
      [s*(.63+j*.044),.186-j*.024,.069]],[.009,.030,.007],12);
    oval(stone,s*.91,.092,.042,.078,.050,.052,0,s*.26,s*.16);
    if(flowers){
      for(let i=0;i<8;i++)oval(high,s*(.41+(i%4)*.047),.56+Math.floor(i/4)*.056,.218+.029*Math.cos(i),.039,.037,.028);
    }else{
      curve(high,[[s*.66,.316,.202],[s*.59,.355,.219],[s*.55,.476,.225],[s*.54,.579,.197]],[.027,.053,.085,.111],17,10);
      oval(stone,s*.547,.575,.210,.091,.060,.082,-.27);
    }
  }
  function shield(color){
    loft('gold',[[0,.025,.025],[.046,.111,.063],[.154,.179,.061],[.32,.19,.060],[.378,.181,.041],[.39,.012,.022]],
      {n:30,power:.54});
    loft('chalk',[[.022,.017,.041],[.068,.101,.070],[.17,.15,.086],[.315,.167,.086],[.36,.153,.074],[.368,.02,.058]],
      {n:28,power:.55});
    relief(0,.090,.074,.34,.34,.20,()=>{
      oval(color,0,.366,.04,.087,.234,.089);oval(color,0,.64,.095,.059,.074,.047);
      for(const s of [-1,1])for(let j=0;j<4;j++)
        oval(color,s*(.119+j*.064),.38+j*.044,.067,.056,.172-j*.012,.060,0,0,-s*(.75+j*.235));
    });
  }
  return {
    paired,corner(f,u,y,d,s,angle=0){map(f,u,y,d,s,()=>place(0,0,0,angle,1,eagle));},
    season(f,u,y,d,i){map(f,u,y,d,1.20,()=>statue(i));},
    crown(f,u,y,d){
      map(f,u,y,d,1.62,()=>{
        for(const s of [-1,1]){
          place(s*.37,-.08,-.022,s*.11,1,()=>reclining(s,s>0));
          place(s*.173,.205,.128,0,1,()=>shield(s>0?'red':'black'));
          place(s*.12,.19,.136,s*.19,.77,()=>leaves(s,6));
          curve(high,[[s*.36,.24,.094],[s*.362,.088,.126],[s*.211,.06,.16],[0,.12,.156]],[.039,.046,.045,.039],16,8);
        }
        lathe('gold',0,.601,.124,[[.142,0],[.145,.025],[.117,.043],[.111,.078],[.085,.105]],30);
        for(let i=0;i<6;i++){
          const a=i*Math.PI/3,x=Math.sin(a),z=Math.cos(a);
          curve('gold',[[x*.121,.65,.125+z*.12],[x*.089,.74,.125+z*.089],[0,.786,.125]],[.022,.022,.018],9,6);
        }
        oval('gold',0,.798,.125,.030,.030,.031);
      });
    },
    rosette(f,u,y,d,s=1){
      map(f,u,y,d,s,()=>{
        oval(stone,0,0,.017,.064,.091,.037);
        for(let j=0;j<7;j++){const a=j*2*Math.PI/7;
          oval(high,Math.sin(a)*.066,Math.cos(a)*.077,.029,.031,.061,.025,0,0,-a);}
        oval('shadow',0,0,.055,.027,.035,.018);
      });
    },
    vase(f,u,y,d,s){map(f,u,y,d,s,urn);},
    finish(){
      const count=parent.children.length;k.finish(parent,mats);
      for(const mesh of parent.children.slice(count))mesh.name='Orangerie · Sandsteinschmuck · '+mesh.name.split(' · ').at(-1);
    }
  };
}
