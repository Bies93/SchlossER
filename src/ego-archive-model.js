const ramp=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};

// Screen-space fiction: a closed prop shell with cosmetic moving trim.
// The low shoulders leave a readable silhouette underneath the sight-line.
export function archiveModel(T,spec,assembly,m){
  const A=assembly(spec.label),{profile,sculpt,turned,bezel,bolt,box,cyl,stamp}=A;
  const wood=m.archiveWood,steel=m.archiveSteel,black=m.recess;
  const grain={power:.80,side:.12,continuousGrain:true};
  sculpt(wood,[[-.749,.013,-.019,.022],[-.737,.020,-.028,.026],[-.694,.022,-.034,.028],
    [-.612,.022,-.040,.030],[-.535,.022,-.045,.034],[-.471,.024,-.050,.036],[-.379,.024,-.054,.038],
    [-.295,.028,-.057,.041],[-.223,.030,-.061,.042],[-.162,.024,-.066,.040],[-.083,.015,-.073,.035],
    [-.043,.007,-.081,.033],[.008,-.006,-.096,.032],[.057,-.014,-.110,.033],[.104,-.017,-.121,.035],
    [.155,-.009,-.130,.043],[.192,.005,-.137,.051],[.239,.014,-.140,.053],[.286,.012,-.139,.049],
    [.321,.009,-.135,.046],[.344,.006,-.130,.045]],{...grain,openEnd:true});
  // A short top piece, separate from the sides. The small dark reveal below it
  // reads as a shadow line, not a contrast stripe across the whole stock.
  sculpt(wood,[[-.703,.026,.017,.020],[-.668,.039,.013,.024],[-.531,.045,.012,.028],[-.418,.048,.016,.030],
    [-.297,.048,.016,.032],[-.199,.049,.019,.033],[-.166,.041,.026,.029]],{...grain,power:.69});
  sculpt(m.coat,[[.343,.007,-.132,.046],[.350,.010,-.134,.047],[.356,.006,-.132,.045]],{...grain,openStart:true,openEnd:true});
  sculpt(m.rubber,[[.356,.006,-.132,.045],[.363,.004,-.130,.044],[.370,-.002,-.123,.041]],{...grain,openStart:true});

  // Alternating satin shoulders and dark inserts break up the broad slab
  // that used to dominate the first-person camera.
  sculpt(steel,[[-.250,.037,.003,.027],[-.232,.055,-.013,.034],[-.188,.068,-.017,.036],
    [-.116,.068,-.017,.038],[-.056,.066,-.018,.038],[-.009,.060,-.019,.035],
    [.032,.048,-.021,.030],[.066,.033,-.030,.024],[.077,.023,-.021,.018]],{power:.47,side:.13});
  sculpt(m.blue,[[-.234,.048,.024,.028],[-.222,.065,.027,.031],[-.180,.075,.031,.032],
    [-.144,.072,.036,.033],[-.131,.062,.035,.031]],{power:.56});
  sculpt(m.blue,[[-.059,.066,.025,.034],[-.046,.074,.026,.036],[-.015,.070,.023,.034],
    [.019,.058,.018,.031],[.039,.045,.014,.026]],{power:.57});
  for(const s of [-1,1]){
    profile(m.coat,[[.019,.020],[.004,.032],[-.056,.036],[-.191,.037],[-.228,.027],[-.215,.012],
      [-.168,.001],[-.041,.000],[-.004,.005]],.006,s*.0345,.0019,[],{wear:.79,contact:.12});
    profile(m.raw,[[-.208,.026],[-.193,.032],[-.060,.031],[-.031,.027],[-.057,.025],[-.192,.026]],
      .0028,s*.038,.00085,[],{wear:.60});
    profile(black,[[-.086,.004],[-.085,.028],[-.188,.029],[-.201,.017],[-.186,.006]],.0025,s*.0385,.0011);
    stamp('FALKENRIED',s*.041,.017,-.145,.101,.024,'ARCHIV · 07');
    bolt([s*.040,.014,-.215],.0046,steel);bolt([s*.032,.009,.021],.0048,steel);
    // A small oval repair pin and brass cabinet tag are tied into the wood.
    cyl(m.coat,[s*.037,-.029,-.315],.009,.006,'x');
    bolt([s*.041,-.029,-.315],.0042);
    profile(m.brass,[[.250,-.042],[.258,-.052],[.247,-.064],[.211,-.064],[.201,-.053],[.208,-.044]],
      .004,s*.053,.0016,[],{wear:.57});
    bolt([s*.056,-.053,.215],.0034,steel);bolt([s*.056,-.053,.244],.0034,steel);
    profile(m.coat,[[.308,-.095],[.320,-.101],[.312,-.112],[.285,-.113],[.275,-.104],[.283,-.096]],
      .004,s*.041,.0016,[],{contact:.18});
  }
  profile(black,[[-.146,.068],[-.128,.059],[-.073,.057],[-.063,.065],[-.079,.074],[-.128,.075]],
    .035,0,.003);
  profile(m.raw,[[-.146,.072],[-.129,.074],[-.077,.071],[-.066,.067],[-.078,.065],[-.133,.068]],
    .009,-.016,.0013);
  profile(steel,[[.056,-.054],[.067,-.082],[.049,-.131],[-.053,-.144],[-.098,-.125],[-.107,-.088],
    [-.090,-.067]],.045,0,.0033,[[[.044,-.069],[.051,-.086],[.036,-.116],[-.048,-.130],
      [-.079,-.116],[-.088,-.089],[-.073,-.077]]]);
  profile(m.coat,[[-.033,-.068],[-.004,-.071],[.003,-.094],[-.004,-.112],[-.015,-.110],[-.013,-.091]],
    .011,0,.0024);

  turned(steel,[[0,-.878],[.009,-.878],[.012,-.874],[.013,-.853],[.014,-.786],[.016,-.683],
    [.020,-.51],[.021,-.432],[.024,-.277],[.026,-.219],[.025,-.188],[0,-.188]],[0,.034,0]);
  bezel(m.raw,[0,.034,-.878],.012,.008,.006);cyl(black,[0,.034,-.876],.008,.0019);
  for(const [z,w,y] of [[-.714,.050,-.007],[-.552,.066,-.007]]){
    sculpt(steel,[[z-.013,.051,y-.028,w*.50],[z-.010,.055,y-.032,w*.54],
      [z+.009,.055,y-.032,w*.54],[z+.014,.051,y-.028,w*.50]],{power:.64,side:.10});
    for(const s of [-1,1])bolt([s*w*.54,.008,z],.0042,steel);
  }
  // The sights are high-contrast shapes, without occluding the screen centre.
  box(m.coat,[0,.059,-.406],[.040,.016,.095],.003);
  profile(steel,[[-.359,.066],[-.372,.080],[-.405,.082],[-.446,.069]],.025,0,.0022);
  for(const s of [-1,1]){
    profile(black,[[-.385,.069],[-.391,.095],[-.416,.095],[-.422,.074]],.008,s*.011,.0022);
    bolt([s*.019,.062,-.416],.0048,steel);
  }
  profile(steel,[[-.781,.047],[-.791,.063],[-.797,.074],[-.835,.073],[-.850,.047]],.025,0,.0025);
  bezel(m.coat,[0,.087,-.817],.013,.0102,.016);cyl(m.brass,[0,.081,-.819],.0017,.012,'y');

  const detail=assembly('Falkenried · animierte äußere Blende');
  detail.cyl(steel,[0,0,0],.011,.112,'z');
  detail.profile(m.raw,[[.048,.006],[.047,.015],[.011,.016],[-.035,.010],[-.040,.003]],.015,0,.0019);
  detail.box(m.blue,[.023,-.006,.016],[.044,.013,.019],.0026,[0,0,-.40]);
  detail.box(steel,[.043,-.013,.023],[.022,.018,.024],.0045);
  for(let i=0;i<3;i++)detail.box(m.coat,[.049,-.006,.016+i*.006],[.009,.003,.0026],.0008);
  const root=A.build(),slide=detail.build(),token=new T.Mesh(new T.CylinderGeometry(.0058,.0071,.027,12),m.brass);
  root.add(slide,token);
  function parts(model,left){
    const [trim,round]=model.children.slice(-2);
    return {root:model,left,animate(_age,{reload=-1}={}){
      const lift=ramp(.08,.20,reload)-ramp(.80,.94,reload),
        open=ramp(.18,.30,reload)-ramp(.71,.85,reload),reach=ramp(.02,.22,reload)-ramp(.84,1,reload),
        seat=ramp(.44,.67,reload);
      trim.position.set(0,.063,-.101+.066*open);trim.rotation.z=.83*lift;
      round.visible=reload>=.40&&reload<.67;
      round.position.set(-.082*(1-seat),.074+.062*(1-seat),-.133-.117*(1-seat));
      round.rotation.x=Math.PI*.5;
      left.set(-.055*reach,.111*reach,.319*reach);
    }};
  }
  return {...parts(root,new T.Vector3()),replica(){return parts(root.clone(),new T.Vector3());}};
}
