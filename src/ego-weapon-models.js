// Outer shells only. Apertures and moving trim are authored for the
// first-person composition, not constructed from weapon schematics.
const clamp=(x)=>Math.max(0,Math.min(1,x));
const ramp=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u);};
export function bowCharge(age){
  if(age<.115)return 1-ramp(0,.115,age);
  return ramp(.46,1.02,age);
}
export const bowSeat=1.08;
export const pumpShift=age=>.047*(ramp(.17,.37,age)-ramp(.40,.67,age));

export function buildWeapon(T,spec,assembly,m,loadedBolt){
  const type=spec.kind,A=assembly(spec.label),{profile,box,cyl,sculpt,turned,bezel,bolt,stamp}=A;
  const left=new T.Vector3();
  function contactGrip(z,y,mat){
    profile(mat,[[z-.036,y+.076],[z+.026,y+.077],[z+.038,y+.042],[z+.053,y-.051],
      [z+.034,y-.061],[z-.012,y-.062],[z-.024,y-.036],[z-.035,y+.022]],.058,0,.006);
    for(const s of [-1,1]){
      const x=s*.0278;
      profile(m.rubber,[[z-.022,y+.040],[z+.030,y+.041],[z+.045,y-.040],[z+.023,y-.051],[z-.014,y-.049]],.008,x,.002);
      for(let i=0;i<6;i++)box(m.carbon,[s*.032,y-.038+i*.011,z+.019-i*.002],[.002,.0024,.038],.0005,[.05,0,.18*s]);
      bolt([s*.031,y+.032,z+.016],.0047);
    }
    profile(m.coat,[[z-.023,y+.074],[z-.101,y+.073],[z-.113,y+.051],[z-.097,y+.014],[z-.037,y+.010],[z-.018,y+.031]],
      .046,0,.0027,[[[z-.036,y+.061],[z-.092,y+.062],[z-.099,y+.049],[z-.088,y+.026],[z-.046,y+.023],[z-.031,y+.034]]]);
  }
  function pins(data){
    for(const [x,y,z,r,mat] of data)for(const s of [-1,1])bolt([s*x,y,z],r,mat);
  }
  function fastRails(height,z,n,length,w,mat=m.coat){
    box(mat,[0,height-.008,z],[w-.009,.011,length],.0017);
    for(let i=0;i<n;i++)box(mat,[0,height,z+((i+.5)/n-.5)*length],[w,.009,length/n*.58],.0011);
  }
  function iron(z,y,rear=false){
    if(rear){
      box(m.coat,[0,y-.016,z],[.047,.011,.028],.002);
      for(const s of [-1,1])profile(m.coat,[[z+.015,y-.012],[z+.009,y+.005],[z-.008,y+.005],[z-.013,y-.012]],.010,s*.014,.0018);
    }else{
      profile(m.coat,[[z+.016,y-.025],[z+.007,y-.006],[z-.005,y-.004],[z-.011,y-.023]],.014,0,.0018);
      cyl(m.brass,[0,y-.0025,z],.0031,.006,'y');
    }
  }
  if(type==='bow'){
    const limbs=[];
    sculpt(m.darkWood,[
      [-.262,.009,-.032,.025],[-.247,.022,-.048,.032],[-.214,.031,-.056,.038],
      [-.152,.040,-.066,.040],[-.088,.042,-.068,.043],[-.023,.040,-.061,.043],
      [.049,.041,-.065,.045],[.114,.041,-.080,.047],[.186,.034,-.099,.051],
      [.231,.020,-.110,.052],[.258,.006,-.116,.052],[.268,-.002,-.111,.049]
    ],{power:.66,side:.12,openEnd:true});
    const stockHole=[[[.251,-.022],[.219,-.012],[.155,-.002],[.103,-.006],[.131,-.056],[.222,-.085],[.246,-.078]]];
    for(const s of [-1,1]){
      profile(m.carbon,[[.256,-.010],[.212,.017],[.155,.025],[.088,.002],[.120,-.064],[.211,-.102],[.255,-.101]],
        .009,s*.049,.0019,stockHole,{wear:.46,contact:.10});
      profile(m.wood,[[-.034,.012],[-.105,.026],[-.218,.014],[-.244,-.012],[-.219,-.046],[-.090,-.062],[-.027,-.039]],
        .013,s*.044,.0038);
      profile(m.raw,[[-.049,.004],[-.080,.017],[-.188,.016],[-.192,.013],[-.079,.011],[-.052,.001]],
        .005,s*.050,.0010,[],{wear:.70});
    }
    sculpt(m.rubber,[[.268,-.002,-.111,.049],[.275,-.001,-.114,.051],[.289,-.008,-.109,.049],[.297,-.017,-.102,.043]],
      {power:.66,side:.12,openStart:true});
    contactGrip(.020,-.132,m.carbon);
    profile(m.coat,[[.090,.044],[.068,.029],[-.121,.020],[-.219,.001],[-.409,.015],[-.450,.035],[-.435,.054]],
      .065,0,.0037);
    for(const s of [-1,1]){
      profile(m.raw,[[.043,.047],[-.124,.047],[-.424,.046],[-.440,.041],[-.409,.033],[-.113,.036],[.039,.038]],
        .006,s*.023,.0012);
      profile(m.carbon,[[-.115,.008],[-.222,.009],[-.288,-.020],[-.316,-.066],[-.282,-.081],[-.190,-.059]],
        .017,s*.030,.0032);
      profile(m.polymer,[[-.257,-.026],[-.290,-.024],[-.346,-.048],[-.364,-.080],[-.337,-.081],[-.262,-.075]],
        .017,s*.024,.003);
      const x=s*.374,tip=-.549;
      const W=assembly('Windbruch · Schwungblende'),hinge=new T.Group();
      for(let h=0;h<2;h++){
        const z=(h-.5)*.035;
        W.plan(m.carbon,[[s*.049,-.431+z],[s*.124,-.442+z],[s*.177,-.488+z],[s*.244,-.526+z],
          [s*.320,-.550+z],[s*.375,tip+z],[s*.374,tip-.021+z],[s*.309,-.572+z],
          [s*.239,-.554+z],[s*.166,-.511+z],[s*.119,-.472+z],[s*.052,-.460+z]],.021,.005+(h-.5)*.011,.0027);
      }
      W.cyl(m.coat,[x,.016,tip],.041,.022,'y');
      W.bezel(m.raw,[x,.030,tip],.034,.029,.006,'y');
      W.bezel(m.coat,[x,.012,tip],.046,.038,.014,'y');
      W.cyl(m.brass,[x,.032,tip],.009,.006,'y');
      for(let i=0;i<4;i++){
        const a=i*Math.PI*.5+.27;
        W.cyl(m.recess,[x+Math.cos(a)*.020,.030,tip+Math.sin(a)*.020],.006,.002,'y');
      }
      const wing=W.build();wing.position.z=.430;hinge.position.z=-.430;hinge.add(wing);limbs.push(hinge);
      stamp('WN / BRUCH',s*.0514,-.012,-.145,.123,.023);
    }
    pins([[.053,-.017,-.089,.004],[.053,-.023,-.207,.004],[.040,.026,-.392,.004]]);
    A.plan(m.coat,[[-.110,-.459],[-.096,-.419],[-.038,-.410],[.038,-.410],[.096,-.419],[.110,-.459],[.044,-.484],[-.044,-.484]],.034,.005,.0035);
    fastRails(.063,-.156,6,.103,.054);
    box(m.coat,[0,.081,-.136],[.056,.025,.058],.0037);
    bezel(m.coat,[0,.119,-.158],.028,.021,.084);
    bezel(m.raw,[0,.119,-.115],.027,.022,.005);
    bezel(m.blue,[0,.119,-.125],.0226,.0192,.009);
    bezel(m.raw,[0,.119,-.201],.0275,.0239,.006);
    for(const z of [-.177,-.169,-.161])bezel(m.recess,[0,.119,z],.0292,.0274,.0033);
    // A capped sliver of coated glass with open space around it; no glowing dot.
    box(m.glass,[0,.106,-.171],[.034,.007,.009],.001);
    profile(m.coat,[[-.263,.045],[-.272,.078],[-.278,.097],[-.296,.101],[-.301,.064],[-.319,.045]],
      .027,0,.0027);
    box(m.polymer,[0,.050,-.288],[.056,.012,.058],.0025);
    iron(spec.sight[2],spec.sight[1],false);
    const root=A.build(),mounted=loadedBolt.clone(),incoming=loadedBolt.clone(),bowPivot=-.430;
    mounted.position.set(0,.055,-.281);root.add(mounted,incoming,...limbs);
    const strands=[],pin=new T.Vector3(),v=new T.Vector3(),a=new T.Vector3(),up=new T.Vector3(0,1,0);
    const g=new T.CylinderGeometry(1,1,1,7);
    for(const s of [-1,1]){
      const string=new T.Mesh(g,m.string);root.add(string);strands.push({o:string,side:s,hinge:limbs[s<0?0:1]});
    }
    return {root,left,animate(age){
      const c=bowCharge(age),z=-.480+.330*c;
      const twang=age<.22?Math.sin(age*122)*Math.exp(-age*22)*.011:0;
      pin.set(0,.052+twang*.31,z+twang);
      for(const {o,hinge,side} of strands){
        const bend=side*((1-c)*.038+twang*2.1);
        hinge.rotation.y=bend;
        a.set(side*.370,.052,-.546-bowPivot).applyAxisAngle(up,bend);a.z+=bowPivot;
        o.position.copy(a).lerp(pin,.5);v.subVectors(pin,a);o.scale.set(.0018,v.length(),.0018);
        o.quaternion.setFromUnitVectors(up,v.normalize());
      }
      mounted.visible=age>=bowSeat;
      incoming.visible=age>.65&&age<bowSeat;
      if(incoming.visible){
        const q=ramp(.68,bowSeat,age);
        incoming.position.set(-.143*(1-q),.055+.069*(1-q),-.281+.115*(1-q));
        incoming.rotation.set(.09*(1-q),.55*(1-q),-.24*(1-q));
      }
      left.set(-.034*(ramp(.35,.68,age)-ramp(.99,1.30,age)),.162*(ramp(.43,.82,age)-ramp(1.06,1.29,age)),
        .146*(ramp(.43,.83,age)-ramp(1.07,1.29,age)));
    }};
  }
  if(type==='rifle'){
    contactGrip(.023,-.139,m.polymer);
    profile(m.coat,[[.062,-.049],[.071,.059],[.026,.083],[-.264,.082],[-.322,.061],[-.315,.011],
      [-.282,-.059],[-.226,-.078],[-.080,-.079],[-.020,-.049]],.093,0,.0048);
    for(const s of [-1,1]){
      profile(m.blue,[[.057,.026],[.023,.065],[-.240,.067],[-.282,.048],[-.255,.023],[-.126,.017],[-.023,.016]],
        .008,s*.046,.0018);
      // Broken highlight along an actual shoulder, not a stripe painted on
      // the face. One darker seam separates the outer cover and receiver.
      profile(m.recess,[[.028,.062],[-.234,.063],[-.264,.053],[-.240,.049],[.016,.052],[.040,.040]],
        .005,s*.0505,.0011,[],{contact:.14});
      profile(m.raw,[[-.027,.061],[-.185,.062],[-.209,.057],[-.188,.056],[-.030,.056]],
        .003,s*.0531,.00065,[],{wear:.63});
      profile(m.polymer,[[.030,-.022],[-.025,.003],[-.105,-.001],[-.118,-.027],[-.094,-.049],[-.008,-.035]],
        .013,s*.048,.002);
      for(let i=0;i<5;i++){
        const z=-.017-i*.014;
        profile(m.recess,[[z,-.010],[z-.004,-.010],[z-.009,-.028],[z-.005,-.028]],.0028,s*.054,.00055);
      }
      profile(m.raw,[[-.130,.011],[-.264,.013],[-.272,-.024],[-.246,-.039],[-.134,-.038]],.007,s*.046,.0016);
      profile(m.recess,[[-.136,.003],[-.258,.006],[-.262,-.017],[-.245,-.030],[-.140,-.030]],.006,s*.050,.0013);
      stamp('VESPER / 17',s*.0504,.034,-.170,.193,.026);
    }
    profile(m.polymer,[[.070,.043],[.104,.062],[.245,.048],[.289,.021],[.299,-.077],[.275,-.099],
      [.191,-.066],[.134,-.043],[.088,-.012]],.069,0,.0048,
      [[[.129,.022],[.222,.026],[.256,.007],[.263,-.052],[.199,-.038],[.140,-.011]]]);
    sculpt(m.carbon,[[.104,.051,.032,.028],[.118,.064,.036,.037],[.170,.062,.034,.038],[.223,.058,.031,.038],
      [.250,.049,.028,.038],[.268,.038,.026,.031]],{power:.59,side:.07});
    profile(m.rubber,[[.281,.024],[.306,.013],[.309,-.072],[.287,-.093],[.270,-.083]],.076,0,.0063);
    const mag=assembly('Vesper · Magazinattrappe');
    mag.profile(m.carbon,[[-.109,-.064],[-.220,-.069],[-.228,-.124],[-.243,-.170],[-.264,-.215],
      [-.252,-.239],[-.179,-.248],[-.149,-.228],[-.139,-.191],[-.118,-.141]],.072,0,.005);
    for(const s of [-1,1])for(let i=0;i<4;i++){
      const z=-.127-i*.021;
      mag.profile(m.polymer,[[z,-.090],[z-.009,-.093],[z-.045,-.199],[z-.034,-.200],[z-.017,-.154]],
        .006,s*.036,.0014);
    }
    mag.profile(m.rubber,[[-.168,-.228],[-.194,-.224],[-.255,-.217],[-.269,-.237],[-.254,-.247],[-.182,-.259]],
      .077,0,.0034);
    profile(m.blue,[[-.302,-.051],[-.362,-.046],[-.515,-.047],[-.561,-.032],[-.564,.047],
      [-.538,.067],[-.342,.077],[-.305,.060]],.080,0,.0054);
    for(const s of [-1,1]){
      const holes=Array.from({length:5},(_,i)=>{const z=-.350-i*.039;return [[z,.040],[z-.017,.041],[z-.023,.030],[z-.022,.016],[z-.003,.014],[z+.004,.022]];});
      profile(m.polymer,[[-.325,.051],[-.554,.051],[-.574,.028],[-.552,-.028],[-.500,-.044],[-.354,-.039],[-.326,-.022]],
        .019,s*.038,.002,holes);
      profile(m.rubber,[[-.334,-.044],[-.516,-.046],[-.544,-.060],[-.525,-.075],[-.350,-.073]],
        .012,s*.024,.003);
      for(let k=0;k<8;k++)box(m.carbon,[s*.031,-.063,-.363-k*.021],[.007,.020,.004],.0007,[.25,0,0]);
    }
    pins([[.054,-.027,-.062,.004],[.053,.023,-.272,.005],[.047,.012,-.540,.004],[.037,.021,.118,.005]]);
    cyl(m.blue,[0,.024,-.602],.018,.123);
    turned(m.coat,[[0,-.680],[.018,-.680],[.026,-.670],[.027,-.646],[.022,-.637],[.019,-.625]], [0,.024,0]);
    bezel(m.blue,[0,.024,-.678],.021,.013,.011);cyl(m.recess,[0,.024,-.676],.013,.006);
    fastRails(.085,-.306,16,.437,.057);
    box(m.polymer,[0,.098,-.264],[.052,.018,.085],.0028);
    bezel(m.coat,[0,.124,-.220],.028,.020,.080);
    bezel(m.raw,[0,.124,-.182],.027,.022,.006);
    bezel(m.recess,[0,.124,-.190],.0224,.0196,.007);
    bezel(m.raw,[0,.124,-.262],.0266,.0226,.006);
    for(const z of [-.242,-.234,-.226])bezel(m.recess,[0,.124,z],.0292,.0276,.0033);
    profile(m.coat,[[-.527,.063],[-.533,.089],[-.548,.105],[-.566,.105],[-.571,.079],[-.577,.059]],
      .026,0,.0024);
    iron(-.558,.124);
    const slide=assembly('Vesper · Plaque latérale');
    slide.box(m.raw,[.055,.003,-.201],[.005,.019,.071],.0018);
    slide.box(m.coat,[.059,.004,-.166],[.008,.015,.018],.0016);
    const root=A.build(),flag=slide.build();root.add(mag.build(),flag);
    return {root,left,animate(age){flag.position.z=.018*(ramp(0,.038,age)-ramp(.060,.169,age));}};
  }
  // Amber: sculpted wood silhouette, longitudinal flutes, top and lower
  // decorative tubes on the same centerline. No interior geometry.
  // The grip panel is part of the walnut shader on this one shell. The
  // original overlay and the stock had the exact same side plane.
  sculpt(m.wood,[
    [-.036,-.041,-.096,.034],[-.021,-.029,-.117,.037],
    [.006,-.016,-.152,.041],[.038,.002,-.171,.045],
    [.066,.018,-.168,.044],[.090,.026,-.133,.041],
    [.118,.035,-.109,.042],[.156,.039,-.106,.046],
    [.212,.030,-.123,.051],[.259,.017,-.140,.053],
    [.282,.006,-.148,.054],[.291,-.001,-.149,.053]
  ],{power:.74,side:.13,openEnd:true});
  sculpt(m.rubber,[[.291,-.001,-.149,.053],[.295,.001,-.152,.054],[.307,-.006,-.154,.054],
    [.320,-.015,-.142,.048]],{power:.74,side:.13,openStart:true});
  profile(m.blue,[[.071,-.029],[.058,.036],[.017,.055],[-.181,.055],[-.247,.030],
    [-.242,-.031],[-.207,-.062],[-.135,-.067],[-.025,-.063],[.025,-.046]],.097,0,.0049);
  profile(m.coat,[[-.020,-.059],[-.109,-.059],[-.124,-.099],[-.103,-.127],[-.050,-.128],[-.015,-.107]],.053,0,.0025,
    [[[-.035,-.071],[-.098,-.071],[-.109,-.098],[-.097,-.115],[-.056,-.115],[-.031,-.100]]]);
  for(const s of [-1,1]){
    profile(m.coat,[[.037,.026],[.020,.041],[-.165,.041],[-.221,.023],[-.212,-.029],[-.174,-.047],
      [-.047,-.048],[.023,-.032]],.009,s*.0504,.0019,[],{wear:.86});
    profile(m.recess,[[-.013,.015],[-.027,.036],[-.147,.038],[-.167,.010],[-.142,-.012],[-.032,-.012]],
      .005,s*.055,.0014);
    profile(m.raw,[[-.033,.009],[-.042,.025],[-.129,.027],[-.143,.013],[-.133,.005]],.004,s*.0578,.0011);
    profile(m.blue,[[-.019,-.031],[-.146,-.035],[-.183,-.027],[-.153,-.038],[-.022,-.040]],
      .004,s*.0541,.0008,[],{contact:.15});
  }
  stamp('AMBER 08',-.058,-.019,-.089,.127,.018);
  pins([[.058,-.031,-.012,.0048],[.058,-.027,-.169,.0059],[.051,.022,-.194,.0040]]);
  turned(m.blue,[[0,-.737],[.020,-.737],[.026,-.722],[.022,-.702],[.019,-.675],[.023,-.301],[.024,-.215],[0,-.215]],[0,.024,0]);
  bezel(m.coat,[0,.024,-.736],.020,.013,.012);cyl(m.recess,[0,.024,-.734],.014,.004);
  turned(m.coat,[[0,-.651],[.023,-.651],[.025,-.644],[.025,-.620],[.017,-.599],[.019,-.209],[0,-.209]], [0,-.031,0]);
  for(const z of [-.616,-.219])box(m.coat,[0,-.004,z],[.041,.065,.013],.0034);
  iron(spec.sight[2],spec.sight[1]);iron(-.091,spec.sight[1],true);
  const P=assembly('Amber · Vorderschaft');
  const ridges=[[0,-.541],[.025,-.541],[.044,-.520]];
  for(let i=0;i<8;i++){
    const z=-.515+i*.025;
    ridges.push([.047,z],[.047,z+.012],[.040,z+.014],[.040,z+.0185],[.047,z+.021]);
  }
  ridges.push([.044,-.314],[.037,-.303],[0,-.303]);
  P.turned(m.wood,ridges,[0,-.040,0],'z',[1.10,.82,1],30);
  P.bezel(m.blue,[0,-.040,-.526],.035,.024,.014);
  P.bezel(m.coat,[0,-.040,-.310],.038,.025,.012);
  const root=A.build(),pump=P.build();root.add(pump);
  return {root,left,animate(age){pump.position.z=pumpShift(age);left.z=pump.position.z;}};
}
