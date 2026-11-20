// Outer shells only. Apertures and moving trim are authored for the
// first-person composition, not constructed from weapon schematics.
const clamp=(x)=>Math.max(0,Math.min(1,x));
const ramp=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u);};
export function bowCharge(age){
  if(age<.115)return 1-ramp(0,.115,age);
  return ramp(.46,1.02,age);
}
export const bowSeat=1.08;
export const pumpShift=age=>.096*(ramp(.17,.37,age)-ramp(.40,.67,age));

export function buildWeapon(T,spec,assembly,m,loadedBolt){
  const type=spec.kind,A=assembly(spec.label),{profile,box,cyl,turned,bezel,bolt,stamp}=A;
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
    profile(m.darkWood,[[.279,-.015],[.236,.021],[.122,.038],[-.088,.040],[-.237,.026],[-.270,.001],
      [-.242,-.048],[-.143,-.071],[.015,-.062],[.106,-.081],[.215,-.117],[.266,-.113]],.075,0,.010);
    const stockHole=[[[.251,-.022],[.219,-.012],[.155,-.002],[.103,-.006],[.131,-.056],[.222,-.085],[.246,-.078]]];
    for(const s of [-1,1]){
      profile(m.carbon,[[.263,-.011],[.220,.026],[.133,.038],[.083,.001],[.120,-.064],[.216,-.111],[.258,-.106]],
        .009,s*.036,.002,stockHole);
      profile(m.wood,[[-.034,.012],[-.105,.026],[-.218,.014],[-.244,-.012],[-.219,-.046],[-.090,-.062],[-.027,-.039]],
        .012,s*.039,.0028);
    }
    profile(m.rubber,[[.269,-.007],[.292,-.017],[.281,-.111],[.252,-.120],[.256,-.101]],.082,0,.005);
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
      stamp('WN / BRUCH',s*.046,-.012,-.145,.123,.023);
    }
    pins([[.048,-.017,-.089,.004],[.049,-.023,-.207,.004],[.040,.026,-.392,.004]]);
    A.plan(m.coat,[[-.110,-.459],[-.096,-.419],[-.038,-.410],[.038,-.410],[.096,-.419],[.110,-.459],[.044,-.484],[-.044,-.484]],.034,.005,.0035);
    fastRails(.063,-.156,6,.103,.054);
    box(m.coat,[0,.081,-.136],[.056,.025,.058],.0037);
    bezel(m.coat,[0,.119,-.158],.028,.021,.084);
    bezel(m.raw,[0,.119,-.116],.027,.022,.005);
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
      profile(m.polymer,[[.030,-.022],[-.025,.003],[-.105,-.001],[-.118,-.027],[-.094,-.049],[-.008,-.035]],
        .013,s*.048,.002);
      profile(m.raw,[[-.130,.011],[-.264,.013],[-.272,-.024],[-.246,-.039],[-.134,-.038]],.007,s*.046,.0016);
      profile(m.recess,[[-.136,.003],[-.258,.006],[-.262,-.017],[-.245,-.030],[-.140,-.030]],.006,s*.050,.0013);
      stamp('VESPER / 17',s*.0504,.034,-.170,.193,.026);
    }
    profile(m.polymer,[[.070,.043],[.104,.062],[.245,.048],[.289,.021],[.299,-.077],[.275,-.099],
      [.191,-.066],[.134,-.043],[.088,-.012]],.069,0,.0048,
      [[[.129,.022],[.222,.026],[.256,.007],[.263,-.052],[.199,-.038],[.140,-.011]]]);
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
    bezel(m.raw,[0,.124,-.184],.027,.022,.007);
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
  profile(m.wood,[[.305,-.015],[.263,.014],[.155,.035],[.058,.016],[.019,-.009],
    [-.013,-.038],[-.026,-.105],[.011,-.160],[.064,-.170],[.082,-.130],
    [.116,-.110],[.199,-.124],[.288,-.152]],.098,0,.009);
  profile(m.rubber,[[.302,-.013],[.322,-.024],[.308,-.146],[.289,-.155],[.269,-.151]],.105,0,.0058);
  for(const s of [-1,1]){
    profile(m.darkWood,[[.031,-.043],[.067,-.050],[.111,-.075],[.082,-.117],[.056,-.153],[.027,-.144],[.002,-.101]],
      .008,s*.045,.0023);
    for(let i=0;i<12;i++){
      const k=i*.006;
      box(m.wood,[s*.050,-.101+.017*Math.cos(i*1.3),.024+k],[.0013,.028,.0016],.0003,[s*.50,0,0]);
    }
  }
  profile(m.blue,[[.071,-.029],[.058,.036],[.017,.055],[-.181,.055],[-.247,.030],
    [-.242,-.031],[-.207,-.062],[-.135,-.067],[-.025,-.063],[.025,-.046]],.097,0,.0049);
  profile(m.coat,[[-.020,-.059],[-.109,-.059],[-.124,-.099],[-.103,-.127],[-.050,-.128],[-.015,-.107]],.053,0,.0025,
    [[[-.035,-.071],[-.098,-.071],[-.109,-.098],[-.097,-.115],[-.056,-.115],[-.031,-.100]]]);
  profile(m.recess,[[-.013,.015],[-.027,.036],[-.147,.038],[-.167,.010],[-.142,-.012],[-.032,-.012]],.008,.048,.0019);
  profile(m.raw,[[-.033,.009],[-.042,.025],[-.129,.027],[-.143,.013],[-.133,.005]],.006,.052,.0015);
  stamp('AMBER 08',-.0501,.006,-.086,.126,.023);
  pins([[.051,-.036,-.011,.005],[.051,-.037,-.165,.006],[.051,.022,-.194,.004]]);
  turned(m.blue,[[0,-.737],[.020,-.737],[.026,-.722],[.022,-.702],[.019,-.675],[.023,-.301],[.024,-.215],[0,-.215]],[0,.024,0]);
  bezel(m.coat,[0,.024,-.736],.020,.013,.012);cyl(m.recess,[0,.024,-.734],.014,.004);
  turned(m.coat,[[0,-.651],[.023,-.651],[.025,-.644],[.025,-.620],[.017,-.599],[.019,-.209],[0,-.209]], [0,-.031,0]);
  for(const z of [-.616,-.219])box(m.coat,[0,-.004,z],[.041,.065,.013],.0034);
  iron(spec.sight[2],spec.sight[1]);iron(-.091,spec.sight[1],true);
  const P=assembly('Amber · Vorderschaft');
  const ridges=[[0,-.541],[.025,-.541],[.044,-.520]];
  for(let i=0;i<9;i++){
    const z=-.515+i*.025;
    ridges.push([.047,z],[.047,z+.012],[.040,z+.014],[.040,z+.0185],[.047,z+.021]);
  }
  ridges.push([.044,-.288],[.037,-.274],[0,-.274]);
  P.turned(m.wood,ridges,[0,-.040,0],'z',[1.10,.82,1],30);
  P.bezel(m.blue,[0,-.040,-.526],.035,.024,.014);
  P.bezel(m.coat,[0,-.040,-.283],.038,.025,.018);
  const root=A.build(),pump=P.build();root.add(pump);
  return {root,left,animate(age){pump.position.z=pumpShift(age);left.z=pump.position.z;}};
}
