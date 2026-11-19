import {shopKit} from './moosfunk-shop-kit.js';

export function furnishPractice(T,kit){
  const {box,rod,cord,line,sign,frame,utilityLamp,rounded,stamp,bolt,foot,roof,rand,pin,sphere,dispose}=shopKit(T,kit,'practice');
  const {block,artTile,wear}=kit,pi=Math.PI,ring=new T.TorusGeometry(1,.085,7,21);
  const lanes=[-4.56,-3.30,-2.03];
  const stripe=(m,a,A,v,V)=>block(m,a,A,.0015,.004,v,V);
  // Recycled rehearsal equipment: dovetail corners, feet, latches and
  // empty, visible compartments instead of a stack of identical cubes.
  function trunk(u,v,w,d,y,h,open=false,mat='green'){
    box('darkWood',u,y,v,w,.052,d);
    for(const s of [-1,1]){
      box(mat,u+s*(w/2-.024),y+.051,v,.048,h-.049,d);
      box(mat,u,y+.05,v+s*(d/2-.023),w-.064,h-.049,.042);
      for(const q of [-1,1]){
        const U=u+s*(w/2-.059),V=v+q*(d/2-.012);
        box('gunmetal',U,y+.038,V,.095,h-.022,.036);
        for(const Y of [y+.073,y+h-.032])bolt('brass',U,Y,V+q*.023,.008);
      }
      const V=v+d*.43,U=u+s*w*.282;
      box('iron',U,y+h-.106,V+.056,.094,.122,.027);
      rod('mfCast',U-.028,y+h-.054,V+.07,U+.028,y+h-.054,V+.07,.012);
    }
    if(open){
      box(mat,u,y+h+.032,v-d*.47,w,.265,.052);
      for(const s of [-1,1])rod('edge',u+s*w*.40,y+h-.043,v-d*.40,u+s*w*.40,y+h+.105,v-d*.46,.010);
      box('wood',u,y+.068,v,.026,h-.087,d-.078);
    }else box('darkWood',u,y+h,v,w+.025,.055,d+.029);
    box('paper',u-.032,y+h*.54,v+d*.50+.002,w*.28,.046,.008);
    if(!y)foot(u,v,w+.03,d+.03);
  }
  trunk(21.71,-4.91,1.03,.65,0,.43,true,'mfBlue');
  trunk(22.85,-4.91,.93,.66,0,.39,false,'green');
  trunk(22.89,-4.96,.447,.68,.55,.259,false,'toolRed');
  sign('props',22.02,1.84,-5.275,1.84,.55);
  sign('rangeRules',20.242,1.46,-1.52,1.33,.565,0);
  // Lined walls with patterned old panels, seams, brackets and painted channels.
  for(let i=0;i<11;i++){
    const u=21.02+i*1.078;
    box('darkWood',u,.187,-5.327,1.023,1.28,.111);
    box('mfBaffle',u,.232,-5.252,.953,1.188,.036);
    box('gunmetal',u,.159,-5.217,1.02,.063,.038);
    if(i%3===2)artTile('impact',u,.871,-5.228,.92,.80,-pi/2);
    for(const s of [-1,1])bolt('edge',u+s*.475,1.381,-5.224,.009);
  }
  rod('mfCast',20.49,1.67,-5.288,33.39,1.67,-5.288,.041);
  for(let i=0;i<10;i++){
    const u=20.74+i*1.345;rod('gunmetal',u-.027,1.67,-5.288,u+.027,1.67,-5.288,.052);
    rod('iron',u,1.67,-5.29,u,1.67,-5.412,.016);
  }
  for(let i=0;i<10;i++){
    const u=21.29+i*1.21;
    box('wood',u,.138,-.749,1.14,.717,.099);
    for(let j=0;j<8;j++)box(j%3?'mfBench':'darkWood',u-.498+j*.142,.169,-.688,.115,.64,.024);
    box('edge',u,.841,-.683,1.16,.032,.033);
  }
  // The original three positions and open side aisle keep gameplay unchanged.
  for(const [i,v] of [-5.095,-3.927,-2.67].entries()){
    box('iron',23.99,.025,v,1.26,.041,.089);
    for(const u of [23.44,24.55]){
      box('gunmetal',u,.038,v,.074,1.453,.076);
      box('mfCast',u,.062,v,.104,.082,.104);
    }
    box('darkWood',23.99,.654,v,1.10,.80,.075);
    for(const s of [-1,1]){
      box('mfBaffle',23.99,.709,v+s*.048,1.012,.682,.023);
      for(const u of [23.49,24.49])bolt('steel',u,1.362,v+s*.069,.009);
    }
    rod('edge',23.40,1.471,v,24.59,1.471,v,.027);
    if(i)foot(23.99,v,1.27,.134);
  }
  function headphones(u,y,v){
    for(const s of [-1,1]){
      rounded('rubber',u,y+.044,v+s*.079,.120,.081,.062);
      rounded('ochre',u,y+.057,v+s*.106,.102,.067,.028);
      rod('steel',u-.01,y+.059,v+s*.103,u-.02,y+.112,v+s*.102,.007);
    }
    const arc=Array.from({length:13},(_,j)=>{const a=j*pi/12;
      return [u-.028,y+.060+.106*Math.sin(a),v+.103*Math.cos(a)];});
    cord('gunmetal',arc,.010,15);cord('linen',arc.slice(3,10),.011,10);
  }
  for(const [i,v] of lanes.entries()){
    frame(24.17,v,.703,.84,.94,'mfBench');
    box('mfRubber',24.13,.941,v,.581,.012,.70);
    box('gunmetal',23.88,.742,v,.082,.110,.737);
    const signId='lane'+(i+1);
    sign(signId,23.725,.816,v,.418,.151,pi);
    headphones(24.05,.953,v+.185);
    if(i!==1){
      // Non-functional hand-marked scoreboard and signal box, not a weapon prop.
      rounded(i?'mfBlue':'green',24.24,1.023,v-.141,.273,.14,.238);
      box('gunmetal',24.081,.975,v-.141,.038,.092,.180);
      for(const d of [-.060,-.012,.042])bolt(d<0?'mfAmber':'mfIce',24.057,1.031,v-.141+d,.011);
      cord('rubber',[[24.33,1.017,v-.225],[24.44,.982,v-.219],[24.47,.970,v-.117],[24.39,.960,v-.053]],.007);
    }else{
      trunk(24.18,v-.14,.296,.28,.957,.115,true,'mfBlue');
      box('paper',24.18,1.015,v-.102,.132,.016,.090);
    }
    for(let n=0;n<11;n++){
      const u=25.25+n*.697;stripe(n%5?'ivoryPaint':'ochre',u,u+.235,v-.581,v-.555);
    }
    stripe('mfRubber',23.06,23.70,v-.374,v+.373);
    wear(23.28,v,.86,1.12,1,(i-1)*.28);
    wear(25.52,v+.10,1.38,1.79,1,i*.36);
  }
  // A few clusters of spent brass and chipped finish near the stands.
  for(let j=0;j<57;j++){
    const v=lanes[j%3]+(rand()-.5)*.74,u=22.96+rand()*3.6,y=.012,angle=rand()*pi*2;
    const du=Math.cos(angle)*.018,dv=Math.sin(angle)*.018;
    rod('shell',u-du,y,v-dv,u+du,y,v+dv,.0085);
    rod('shellMouth',u+du*.84,y,v+dv*.84,u+du*1.11,y,v+dv*1.11,.006);
  }
  for(let i=0;i<20;i++){
    const v=-5.21+i*.194;
    stripe(i%2?'rubber':'ochre',24.96,25.061,v,v+.159);
  }
  // Each hung prop has a different depth, hanger and finish. All targets
  // are printed emblems, not people. The original floor colliders stay.
  for(const [i,v] of lanes.entries()){
    const u=[29.12,31.22,30.08][i],top=roof(u,v);
    box('gunmetal',u,top-.079,v,.37,.078,.817);
    for(const d of [-.244,.244]){
      rod('edge',u,top-.018,v+d,u,roof(u,v+d)+.055,v+d,.022);
      box('iron',u,top-.078,v+d,.121,.036,.113);
      rod('mfCast',u,top-.043,v+d,u,1.821,v+d,.012);
      for(let j=0;j<4;j++)stamp('steel',ring,u,1.821-j*.024,v+d,[.019,.019,.020],j%2*pi/2);
    }
    rounded('darkWood',u,1.48,v,.111,.617,.827);
    rounded(i===1?'wood':'mfBlue',u-.058,1.48,v,.040,.554,.775);
    artTile(i===1?'pretzel':'diamond',u-.082,1.478,v,.733,.511,pi);
    artTile('impact',u-.085,1.454,v,.607,.398,pi);
    for(const d of [-.343,.343])for(const y of [1.247,1.714])bolt('brass',u-.092,y,v+d,.0105);
    foot(u,v,.112,.784);
  }
  // End wall is dressed as a salvaged acoustic stage set rather than
  // another flat cave face; the support beams and lamp cages are visible.
  for(let i=0;i<7;i++){
    const v=-5.057+i*.571;
    box('gunmetal',33.48,.068,v,.244,1.867,.549);
    box('mfBaffle',33.333,.123,v,.074,1.743,.486);
    for(const d of [-.244,.244])rod('mfCast',33.280,.172,v+d,33.280,1.875,v+d,.012);
    if(i%2===0)artTile('impact',33.283,1.047,v,.456,1.29,pi);
  }
  foot(33.39,-3.343,.292,4.00);
  sign('stage',33.225,2.164,-3.03,1.89,.319,pi);
  utilityLamp(22.28,-3.23,2.25,pi/2,'mfAmber');utilityLamp(26.23,-3.20,2.26,pi/2);
  utilityLamp(31.86,-3.14,2.28,pi/2);
  ring.dispose();dispose();
}
