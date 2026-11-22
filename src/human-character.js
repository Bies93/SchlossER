import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {NPCS} from './npc-lines.js';

// GLB templates are loaded once; each actor has an independent skeleton and
// morph state. Rigs, outfits, profiles and game logic are separate layers.
const libraries=new WeakMap();
export function installHumans(T,asset){
  const models=new Map(asset.children.map(o=>[o.userData.name??o.name,o]));
  for(const [id,info] of Object.entries(NPCS))if(info.template&&models.has(info.template))models.set(id,models.get(info.template));
  for(const id of ['base','ghoulA','ghoulB','ghoulC',...Object.keys(NPCS)])
    if(!models.has(id))throw Error('Human template missing: '+id);
  libraries.set(T,{models,materials:new Map(),present:[]});
}
export const humansAvailable=T=>libraries.has(T);
export const namedHumans=T=>libraries.get(T)?.present??[];
const cos=Math.cos,sin=Math.sin,tau=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t,frac=x=>x-Math.floor(x);
const wear={
  grey:{bulk:.29,weather:.14,shoe:0x726963},
  festZwanni:{palette:[0x454757,0x4c7c77,0xdfc285],hair:0x412e27,weather:.15,bulk:.47,mess:.47},
  festAnni:{palette:[0x534752,0xbc7773,0xd1ac89],hair:0x715443,weather:.13,bulk:.14},
  festKalle:{palette:[0x303a4a,0xd18a55,0xd1a881],hair:0x624337,weather:.11,bulk:.21},
  festRudi:{palette:[0x51483d,0x7b89ac,0xc7af8b],hair:0x8e714f,weather:.18,bulk:.34},
  bergWirt:{palette:[0x49372d,0xc2ac8b,0xe2cbb0],bodice:0x994538,hair:0x94775d,weather:.22},
  bergLeni:{palette:[0x514041,0xbbb99f,0xe3cfb4],bodice:0x266050,hair:0x684031,weather:.09},
  bergDora:{palette:[0x4a3044,0x917b9d,0xc5a995],bodice:0x75384a,hair:0xada39c,weather:.17},
  bergFritz:{palette:[0x3b342d,0xaa342d,0xf1e6d5],hair:0xe0c182,weather:.17},
  bergUdo:{palette:[0x353238,0x847b8e,0xbea786],bodice:0x3e375c,hair:0x756044,weather:.18},
  gardenHannes:{cloth:0x97a28b,hair:0xb39370,palette:[0x605645,0x576b53,0x806b52],weather:.16},
  hubert:{skin:0xb5b8aa,weather:.96},
  ghoulA:{skin:0xabb5a4,cloth:0x786d54,weather:1,decay:1.0},
  ghoulB:{skin:0xb5c4bf,cloth:0x777f73,weather:.95,decay:.86},
  ghoulC:{skin:0xa8bdb0,cloth:0x786f6d,weather:.88,decay:.98},
  clubAda:{skin:0xffe8df,cloth:0xab78b4,hair:0x846251,shoe:0x504443},
  clubMira:{cloth:0x94c8c1,hair:0x695343,shoe:0xdbddda},
  clubNiko:{cloth:0xe4cba0,shoe:0x81614e},
  clubSami:{skin:0xffe6d3,cloth:0xe1b199},
  clubVeit:{cloth:0xe2c697,hair:0xb1a398},
  orbPriest:{skin:0xc3b6a1,hair:0xb8adb0,weather:.59},
  niklas:{skin:0xf7ece3},
  labAuer:{weather:.12},labHedwig:{weather:.08},labSepp:{weather:.27},
  labPrisoner:{palette:[0x53534a,0x8c795a,0xa18c65],hair:0x53483f,weather:.49},
  labPatient:{palette:[0x626e65,0x899e94,0xc1cbb4],hair:0x998470,weather:.25},
  labOrderly:{palette:[0x333d3c,0x536b61,0xb6b49a],hair:0x433931,weather:.11},
  guestBruno:{palette:[0x454b52,0x757460,0xc7ba9d],hair:0xbbb5a6,weather:.17},
  guestMarlene:{palette:[0x4b4b52,0x566477,0xd8cba9],hair:0x6c4e3b,weather:.09},
  guestSabine:{palette:[0x453f42,0x923f57,0xbba2a1],hair:0xa05a49,weather:.08},
  guestJona:{palette:[0x6d533b,0x526d66,0xb78248],hair:0x584d37,weather:.25},
  guestRike:{palette:[0x414a45,0x525846,0xa7453b],hair:0x53463c,weather:.23},
  guestEdda:{palette:[0x514747,0x767744,0xae7e55],hair:0x4b4240,weather:.16},
  guestLotte:{palette:[0x665368,0x83616b,0xcba38b],hair:0x635448,weather:.06},
  cloneB07:{palette:[0x343c42,0x7a8d8b,0xe0cd9c],hair:0x4a4035,weather:.06},
  cloneB12:{palette:[0x252d30,0x52605b,0xa47b3d],hair:0x4a4035,weather:.33},
  cloneAlma:{palette:[0x283337,0x343e58,0xcbb482],hair:0x59493f,insignia:0x967c48,weather:.08},
  cloneLorenz:{palette:[0x303334,0x756146,0x87958b],hair:0x7a7366,coat:0xa78c65,insignia:0x6d6c53,weather:.35},
  plazaRaban:{palette:[0x373438,0x4d585c,0xb2ad90],hair:0x554a40,coat:0x94aaab,insignia:0xa1a796,weather:.31},
  plazaVroni:{palette:[0x39343c,0x69504b,0xb78c5e],hair:0x56433a,weather:.16},
  plazaEberwin:{palette:[0x332e32,0x533c42,0xb38b57],hair:0x7f7872,weather:.18},
  plazaIsolde:{palette:[0x51453f,0x888d84,0xd5c1ac],hair:0x584d46,weather:.36},
  plazaAnton:{palette:[0x393933,0x485047,0xa99979],hair:0x655342,weather:.23},
  crownFlesh:{skin:0xb8aaa3,palette:[0x463836,0x9f9183,0xcab493],hair:0x4d3836,weather:.47},
  crownSleeper17:{skin:0xb8aaa3,palette:[0x463836,0x9f9183,0xcab493],hair:0x4d3836,weather:.41},
  crownSleeper19:{skin:0xb8aaa3,palette:[0x463836,0x9f9183,0xcab493],hair:0x4d3836,weather:.41},
  crownDrone:{palette:[0x373e3d,0x4d6863,0xb18b61],coat:0x65746d,insignia:0xbb7646,hair:0x7c4f39,weather:.28},
  crownMarshal:{palette:[0x2f2826,0x463134,0xbca774],coat:0x2c2d2d,insignia:0xc6a465,hair:0x8b7c6c,weather:.19},
  crownVoice:{palette:[0x292530,0x584345,0x956f50],coat:0x514044,insignia:0xb28857,hair:0x584842,weather:.17},
  crownWitness:{skin:0xc0a395,palette:[0x413d39,0x665854,0x968675],hair:0x705441,weather:.71},
  crownMedic:{palette:[0x343536,0x6a5c55,0xb5a288],coat:0xbfb0a3,insignia:0x7b443a,hair:0x553d39,weather:.43},
  crownQuartermaster:{palette:[0x362c29,0x594a38,0xaa7954],insignia:0xd7a969,hair:0xa58e76,weather:.25},
  crownEcho:{skin:0xb3a299,palette:[0x2c3434,0x54615e,0xb39570],coat:0x6d7771,hair:0xa3a098,weather:.62},
  chapterOskar:{palette:[0x282530,0x442533,0xc8ac65],hair:0xbfb2a3,weather:.10},
  chapterMatthias:{palette:[0x332d26,0x535844,0xba985f],hair:0x735742,weather:.19},
  chapterKonrad:{palette:[0x282b30,0x2b414c,0xba8e54],hair:0x574d48,weather:.27},
};
function personalize(T,lib,id,base,eyeY){
  const key=id+':'+base.uuid;if(lib.materials.has(key))return lib.materials.get(key);
  const m=base.clone(),p=wear[id]??{},skin=/^Skin/.test(m.name),hair=/^Hair/.test(m.name),brow=/^Brow/.test(m.name),cloth=/^Cloth/.test(m.name),
    field=id==='hubert'&&/^(?:Cloth|Shoes|Pocket|Field|LinenBand|Helmet)/.test(m.name),
    formal=cloth&&(id==='niklas'||id==='orbPriest'),staff=cloth&&id.startsWith('lab'),
    copperHair=id==='niklas'&&(hair||brow),freckles=id==='niklas'&&skin,
    blondHair=id==='bergFritz'&&(hair||brow),bonsShirt=id==='bergFritz'&&cloth,jakeScalp=id==='gardenHannes'&&skin,
    ritual=/^(?:Ritual|LabCoat|Apron|Visitor)/.test(m.name),
    hoodie=id==='festZwanni',team=cloth&&id.startsWith('fest'),
    grey=id==='grey',
    visitorPalette=cloth&&!team?p.palette:null,vec=hex=>new T.Color(hex).toArray().map(x=>x.toFixed(4)).join(',');
  const visitorColors=visitorPalette?.map(vec);
  if(skin&&p.skin)m.color.multiply(new T.Color(p.skin));
  if(p.cloth&&cloth)m.color.multiply(new T.Color(p.cloth));
  if(p.hair&&(hair||brow))m.color.multiply(new T.Color(p.hair));
  if(p.shoe&&/^Shoes/.test(m.name))m.color.multiply(new T.Color(p.shoe));
  if(p.coat&&/^LabCoat/.test(m.name))m.color.multiply(new T.Color(p.coat));
  if(p.insignia&&/^InsigniaBlue/.test(m.name))m.color.setHex(p.insignia);
  if(hair||brow){
    m.alphaTest=m.map?.isTexture?(brow?.36:.43):0;m.transparent=false;m.depthWrite=true;m.side=T.DoubleSide;
    if(!m.map)m.color.setHex(0x3c2c27);
  }
  if(grey&&cloth){m.map=null;m.color.setHex(0xffffff);m.roughness=.91;}
  if(/Helm|Cap|RitualCloth|FieldBelt|FieldJacketHem|LabCoatSkirts|Apron/.test(m.name))m.side=T.DoubleSide;
  if(skin||cloth||field||ritual||copperHair||blondHair||grey&&(hair||brow)){
    m.customProgramCacheKey=()=> 'schlosser-humans-4-'+(skin?'skin':'cloth')+
      (field||formal||ritual||staff||visitorColors||team||hoodie||grey||copperHair||blondHair?'-'+id+m.name:(skin&&p.decay)||freckles||jakeScalp?'-'+id:'-'+(p.weather??0));
    m.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 castP;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\ncastP=position;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 castP;
        float castHash(vec3 p){return fract(sin(dot(p,vec3(17.13,42.91,71.1)))*14732.123);}
        float castNoise(vec3 p){vec3 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);
          return mix(mix(mix(castHash(i),castHash(i+vec3(1,0,0)),u.x),mix(castHash(i+vec3(0,1,0)),castHash(i+vec3(1,1,0)),u.x),u.y),
            mix(mix(castHash(i+vec3(0,0,1)),castHash(i+vec3(1,0,1)),u.x),mix(castHash(i+vec3(0,1,1)),castHash(i+vec3(1,1,1)),u.x),u.y),u.z);}
      `).replace('#include <color_fragment>',`#include <color_fragment>
        float castD=max(length(dFdx(castP)),length(dFdy(castP)));
        float castFine=(castNoise(castP*${skin?'545.':'360.'})-.5)*(1.-smoothstep(.001,.010,castD));
        float castDirt=smoothstep(.38,.75,castNoise(castP*vec3(21.,17.,24.))*.63+castNoise(castP*vec3(72.,52.,89.))*.37)*${(p.weather??0).toFixed(3)};
        ${grey&&cloth?`
          float u=abs(castP.x),h=castP.y;
          float sleeve=smoothstep(.304,.316,u)*smoothstep(1.03,1.18,h);
          float top=smoothstep(.91,1.007,h);
          float fibers=1.+(castNoise(castP*vec3(112.,196.,82.))-.5)*.10;
          float band=(1.-smoothstep(.003,.012,abs(h-.993)))+
            (1.-smoothstep(.004,.012,abs(u-.299)))*step(1.15,h);
          float seam=(1.-smoothstep(.002,.006,abs(u-.296)))*step(1.15,h);
          vec3 fabric=vec3(.112,.139,.137)*fibers*(1.-min(1.,band)*.18)+seam*vec3(.017,.022,.020);
          float soft=castNoise(castP*vec3(17.,25.,21.));
          vec3 armSkin=vec3(.55,.345,.238)*(.90+.15*soft);
          vec3 denim=vec3(.036,.054,.075)*(1.+.18*(soft-.5)+.095*sin(castP.y*27.+u*31.));
          diffuseColor.rgb=mix(denim*fibers,mix(fabric,armSkin,sleeve),top);
        `:''}
        ${grey&&(hair||brow)?`
          float silver=castNoise(castP*vec3(236.,42.,126.));
          diffuseColor.rgb=mix(vec3(.105,.112,.115),vec3(.43,.422,.397),.235+.50*silver);
        `:''}
        ${grey&&skin?`
          vec2 q=vec2(abs(castP.x),castP.y-${eyeY.toFixed(4)});
          float skinFront=smoothstep(.06,.115,castP.z);
          float crease=exp(-abs(q.y+.029+(q.x-.030)*.32)*172.)*smoothstep(.033,.063,q.x)*(1.-smoothstep(.071,.095,q.x));
          float socket=exp(-distance(q,vec2(.044,-.025))*82.);
          float beard=(1.-smoothstep(-.114,-.085,q.y))*smoothstep(-.183,-.146,q.y);
          float crow=exp(-abs(q.y+.009-(q.x-.058)*.37)*214.)*smoothstep(.056,.067,q.x)*(1.-smoothstep(.087,.105,q.x));
          float nasolabial=exp(-abs(q.x-(.044+max(0.,-q.y-.078)*.25))*179.)*smoothstep(-.132,-.111,q.y)*(1.-smoothstep(-.066,-.052,q.y));
          float browFold=exp(-abs(q.y-.060+q.x*q.x*6.)*169.)*(1.-smoothstep(.061,.081,q.x));
          diffuseColor.rgb*=1.-skinFront*(crease*.17+socket*.28+crow*.16+nasolabial*.14+browFold*.12);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.69,.76,.81),beard*skinFront*.43);
        `:''}
        ${jakeScalp?`
          float crown=castP.y-${eyeY.toFixed(4)};
          float hairline=mix(.018,.093,smoothstep(-.012,.097,castP.z))+.009*sin(castP.x*32.);
          float stubble=smoothstep(hairline-.007,hairline+.014,crown);
          float dots=smoothstep(.47,.77,castNoise(castP*465.));
          diffuseColor.rgb*=mix(vec3(1.),vec3(.62,.58,.54)-.26*dots*(1.-smoothstep(.001,.009,castD)),stubble);
        `:''}
        ${cloth&&id==='hubert'?`
          float l=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
          float tunic=smoothstep(.83,1.04,castP.y);
          diffuseColor.rgb=mix(vec3(.050,.057,.051),vec3(.113,.139,.100),tunic)*(.54+l*1.23);
        `:''}
        ${formal?`
          float shade=dot(diffuseColor.rgb,vec3(.213,.715,.072));
          float bib=smoothstep(.39,.73,shade)*(1.-smoothstep(.020,.123,abs(castP.x)))*smoothstep(1.26,1.39,castP.y)*step(.08,castP.z);
          diffuseColor.rgb=mix(vec3(${id==='niklas'?'.122,.142,.160':'.019,.016,.022'})*(.57+1.80*shade),
                            vec3(${id==='niklas'?'.64,.61,.53':'.041,.034,.045'})*(.65+shade*.25),bib);
        `:''}
        ${staff?`
          float labShade=dot(diffuseColor.rgb,vec3(.213,.715,.072));
          float labTop=smoothstep(.86,1.04,castP.y);
          diffuseColor.rgb=mix(vec3(${id==='labHedwig'?'.077,.059,.056':'.053,.070,.072'}),
            vec3(${id==='labAuer'?'.58,.61,.56':id==='labHedwig'?'.18,.091,.094':'.33,.37,.29'}),labTop)*(.55+labShade*.96);
        `:''}
        ${visitorColors?`
          float seamPhase=smoothstep(.83,1.04,castP.y);
          float shade=dot(diffuseColor.rgb,vec3(.213,.715,.072));
          float rib=.5+.5*sin(castP.y*${id==='guestJona'?'105.':'196.'}+sin(castP.x*61.)*.31);
          float plaid=smoothstep(.53,.72,rib)*(.5+.5*sin(castP.x*91.+castP.z*39.));
          vec3 garment=mix(vec3(${visitorColors[0]}),vec3(${visitorColors[1]}),seamPhase);
          float stripe=plaid*${id==='guestJona'?'.26':id==='guestLotte'?'.17':'.07'}*(1.-smoothstep(.001,.020,castD));
          float lapel=(1.-smoothstep(.024,.104,abs(castP.x)))*smoothstep(1.22,1.44,castP.y)*step(.078,castP.z)*smoothstep(.30,.72,shade);
          diffuseColor.rgb=mix(garment,vec3(${visitorColors[2]}),clamp(stripe*seamPhase+lapel*.70,0.,1.))*(.55+shade*1.38);
          ${p.bodice?`
          float ax=abs(castP.x),chest=smoothstep(.88,1.09,castP.y)*(1.-smoothstep(1.33,1.48,castP.y));
          float lining=(1.-smoothstep(.144,.199,ax))*smoothstep(.028,.082,castP.z)*chest;
          float opening=.029+clamp((castP.y-1.17)*.30,0.,.055);
          float cut=smoothstep(opening-.008,opening+.002,ax);
          float piping=(1.-smoothstep(.0035,.009,abs(ax-opening-.007)))*lining;
          float stitch=.50+.50*cos(castP.y*237.);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(${vec(p.bodice)})*(.62+shade*1.30),lining*cut);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.53,.32,.16),piping*(.53+.41*stitch));
          `:''}
        `:''}
        ${team?`
          float yy=castP.y, xx=abs(castP.x);
          float jersey=max(smoothstep(.86,1.008,yy),smoothstep(.195,.225,xx)*smoothstep(.86,.99,yy));
          float shade=clamp(dot(diffuseColor.rgb,vec3(.213,.715,.072)),.10,.72);
          float cotton=1.+(castNoise(castP*vec3(57.,67.,48.))-.5)*.14;
          vec3 pants=vec3(${vec(p.palette[0])})*(.82+.51*shade);
          vec3 top=vec3(${vec(p.palette[1])})*(.78+.55*shade)*cotton;
          ${hoodie?`
            float forward=smoothstep(.033,.093,castP.z);
            float open=.060+.030*smoothstep(1.07,1.43,yy)+.006*sin(yy*19.);
            float insert=(1.-smoothstep(open-.006,open+.002,xx))*forward*smoothstep(.966,1.013,yy);
            float band=(1.-smoothstep(.005,.011,abs(xx-open-.008)))*forward;
            float detail=1.-smoothstep(.002,.010,castD);
            float teeth=(1.-smoothstep(.0014,.0033,abs(xx-open-.004)))*forward;
            float woven=.5+.5*cos(yy*1160.+sin(yy*52.)*.19);
            float rib=1.-max(smoothstep(1.013,1.032,yy),smoothstep(.182,.218,xx));
            float cuff=smoothstep(.535,.577,xx);
            vec3 outer=vec3(.0185,.021,.024)*(.76+shade*.54)*cotton;
            outer*=1.-(.18+.07*cos(castP.x*780.+castP.z*182.))*detail*clamp(rib+cuff,0.,1.);
            float pocket=(1.-smoothstep(.0025,.006,abs(yy-1.027-(xx-.106)*.73)))
              *smoothstep(.107,.119,xx)*(1.-smoothstep(.173,.187,xx))*forward;
            outer=mix(outer,vec3(.047,.051,.055),pocket*.73+band*.22);
            outer=mix(outer,vec3(.18,.181,.17),teeth*(.48+.52*woven)*.64);
            float collar=1.-smoothstep(.002,.009,abs(yy-(1.445+xx*.213)));
            vec3 tee=vec3(.42,.416,.39)*(.91+.09*shade)*cotton*(1.-.22*collar);
            top=mix(outer,tee,insert);
            jersey=smoothstep(.920,.983,yy);
          `:''}
          diffuseColor.rgb=mix(pants,top,jersey);
        `:''}
        ${hoodie&&skin?`
          // Continue the crew-neck underneath the base mesh's open collar.
          float xx=abs(castP.x),edge=1.445+xx*.213;
          float collarCloth=(1.-smoothstep(.086,.103,xx))*smoothstep(.052,.090,castP.z)
            *smoothstep(1.20,1.26,castP.y)*(1.-smoothstep(edge-.003,edge+.004,castP.y));
          float hem=1.-smoothstep(.003,.010,abs(castP.y-edge));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.398,.395,.369)*(1.-hem*.24),collarCloth);
        `:''}
        ${bonsShirt?`
          float bonsUpper=max(smoothstep(.91,1.04,castP.y),
            smoothstep(.178,.234,abs(castP.x))*smoothstep(.72,.86,castP.y));
          float checkX=cos((castP.x+abs(castP.z)*.39)*196.),checkY=cos((castP.y+sin(castP.x*12.)*.009)*198.);
          float feather=max(.13,1.-smoothstep(.001,.016,castD));
          vec3 garnet=vec3(.38,.038,.035),chalk=vec3(.82,.76,.65),weave=vec3(.65,.28,.24);
          float A=smoothstep(-.13,.13,checkX),B=smoothstep(-.13,.13,checkY);
          vec3 checked=mix(mix(garnet,weave,A),mix(weave,chalk,A),B);
          checked=mix(weave,checked,feather);
          float hem=(1.-smoothstep(.009,.021,abs(castP.x+.004)))*step(.053,castP.z);
          checked=mix(checked,vec3(.61,.503,.445),hem*.79);
          float baseTone=dot(diffuseColor.rgb,vec3(.21,.72,.07));
          diffuseColor.rgb=mix(diffuseColor.rgb,checked*(.69+.82*baseTone),bonsUpper);
        `:''}
        ${copperHair?`
          float gingerShade=smoothstep(.0,.42,pow(dot(diffuseColor.rgb,vec3(.213,.715,.072)),.55));
          diffuseColor.rgb=mix(vec3(.058,.011,.005),vec3(.37,.121,.039),gingerShade);
        `:''}
        ${blondHair?`
          float straw=smoothstep(.012,.33,sqrt(max(0.,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)))));
          float strand=castNoise(castP*vec3(175.,36.,155.));
          diffuseColor.rgb=mix(vec3(.102,.063,.024),vec3(.66,.479,.236),clamp(straw*.80+strand*.21+.097,0.,1.));
        `:''}
        ${freckles?`
          vec2 fP=(castP.xy-vec2(0.,${eyeY.toFixed(4)}))*512.;
          vec2 fI=floor(fP);
          vec2 fV=fract(fP)-vec2(.3+.4*castHash(vec3(fI,.1)),.3+.4*castHash(vec3(fI,3.)));
          vec2 cheek=vec2((abs(castP.x)-.028)*17.,(castP.y-${eyeY.toFixed(4)}+.022)*51.);
          float spread=exp(-dot(cheek,cheek));
          float dots=(1.-smoothstep(.10,.27,length(fV)))*step(.64,castHash(vec3(fI,6.)));
          diffuseColor.rgb*=1.-dots*spread*smoothstep(.075,.121,castP.z)*(.32-.16*smoothstep(.001,.003,castD));
        `:''}
        ${field||ritual?`
          float fray=castNoise(castP*vec3(558.,835.,644.));
          float wet=castNoise(castP*vec3(28.,11.,31.));
          float deposit=smoothstep(.48,.91,wet+.22*(1.-smoothstep(.16,1.05,castP.y)));
          float fiber=(sin(castP.y*2460.)*sin(castP.x*1950.+castP.z*1430.))*(1.-smoothstep(.0008,.004,castD));
          diffuseColor.rgb*=1.+fiber*.082+(fray-.5)*.18*(1.-smoothstep(.001,.009,castD));
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.35,.29,.22),deposit*.60);
          ${m.name.startsWith('Helmet')?`float chips=smoothstep(.83,.94,castNoise(castP*vec3(263.,197.,281.)));
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.19,.108,.064),chips*.38);`:''}
        `:''}
        ${skin&&p.decay?`
          vec3 castFace=castP-vec3(0.,${eyeY.toFixed(4)},0.);
          vec2 castEyeD=vec2((abs(castFace.x)-.031)*47.,(castFace.y+.008)*53.);
          float castSocket=exp(-dot(castEyeD,castEyeD))*smoothstep(.059,.121,castFace.z);
          float castMottle=castNoise(castP*vec3(15.,26.,24.)+vec3(${(p.decay*10).toFixed(2)},0.,0.));
          float castFlake=smoothstep(.46,.79,castNoise(castP*vec3(140.,86.,111.)));
          float castPits=smoothstep(.57,.83,castMottle)*castFlake;
          vec2 castScarD=vec2((castFace.x+.043+.22*(castFace.y+.045))*236.,(castFace.y+.045)*40.);
          float castScar=exp(-dot(castScarD,castScarD))*smoothstep(.09,.116,castFace.z);
          float castTone=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
          diffuseColor.rgb=mix(diffuseColor.rgb,castTone*vec3(.85,.92,.80),.58);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.42,.38,.42),max(castSocket*.63,max(castPits*.84,castScar*.90)));
        `:''}
        diffuseColor.rgb*= (1.+castFine*.115)*mix(vec3(1.),vec3(${skin?'.43,.39,.40':'.48,.45,.37'}),castDirt*.66);
      `);
      if(field)sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec3 castDX=dFdx(-vViewPosition),castDY=dFdy(-vViewPosition);
        vec3 castU=cross(castDY,normal),castV=cross(normal,castDX);
        float castDet=dot(castDX,castU);
        float castHeight=castFine*.34+castDirt*.74;
        normal=normalize(max(abs(castDet),.00000001)*normal-sign(castDet)
          * .00194*(dFdx(castHeight)*castU+dFdy(castHeight)*castV));
      `);
    };
  }
  lib.materials.set(key,m);return m;
}

export function createHuman(T,id='base'){
  const lib=libraries.get(T);if(!lib)throw Error('Human GLB not loaded');
  const proto=lib.models.get(id);if(!proto)throw Error('Unknown human: '+id);
  const actor=new T.Group(),body=clone(proto),bones=new Map(),faces=[],meshes=[];
  const style=wear[id],bulk=style?.bulk??(id==='gardenHannes'?1:0);
  let greyScalp=null;
  actor.name=id;actor.add(body);body.scale.multiplyScalar(proto.userData.size??1);
  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),Q=()=>new T.Quaternion();
  body.traverse(o=>{
    if(id.startsWith('berg')&&/^(Insignia|Bortenstreifen|Messinganhänger|Besatz|Stoff)/.test(o.name))o.visible=false;
    if(o.isBone)bones.set(o.userData.name??o.name,o);
    if(o.isSkinnedMesh){
      if(id==='grey'){
        const type=o.material.name??'';
        if(/^Hair/.test(type)){o.visible=false;return;}
        if(/^Skin/.test(type))greyScalp=o.geometry;
      }
      if(bulk){
        const type=o.material.name??'';
        if(id==='gardenHannes'&&/^Hair/.test(type)){o.visible=false;return;}
        if(/^Cloth/.test(type)){
          // A heavier build in bind space: the clothes stay on the normal animated skeleton.
          const g=o.geometry.clone(),p=g.attributes.position,sm=T.MathUtils.smoothstep;
          for(let i=0;i<p.count;i++){
            const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
            const belly=sm(y,.80,.99)*(1-sm(y,1.19,1.43))*(1-sm(Math.abs(x),.22,.36));
            const thighs=sm(y,.40,.59)*(1-sm(y,.84,.97));
            p.setXYZ(i,x*(1+bulk*(.32*belly+.15*thighs)),y,
              z*(1+bulk*(.49*belly+.14*thighs))+.056*bulk*belly*sm(z,-.012,.10));
          }
          g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;
        }
        if(style?.mess&&/^Hair/.test(type)){
          // Tussle the existing hair cards together in bind space, so there
          // are no new meshes/materials to draw on any of the four heads.
          const g=o.geometry.clone(),p=g.attributes.position,sm=T.MathUtils.smoothstep;
          g.computeBoundingBox();
          const {min,max}=g.boundingBox,cx=(min.x+max.x)*.5,cz=(min.z+max.z)*.5,band=max.y-min.y;
          for(let i=0;i<p.count;i++){
            const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=x-cx,v=z-cz;
            const a=Math.atan2(v,u),tuft=Math.sin(a*7+z*25)*.55+Math.sin(a*11+x*30)*.45;
            const r=style.mess*sm(y,min.y+band*.21,min.y+band*.78);
            // Keep the rooted layer over the scalp. Broaden the crown instead
            // of stretching it into the former high quiff.
            p.setXYZ(i,cx+u*(1+r*(.20+.075*tuft))+.005*r*Math.sin(a*3),
              y+r*(.017+.008*tuft),
              cz+v*(1+r*(.17+.083*tuft))+.003*r*Math.cos(a*4));
          }
          g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;
        }
      }
      o.castShadow=false;o.receiveShadow=true;
      o.boundingSphere=new T.Sphere(V(0,.96,0),1.31);
      if(o.morphTargetDictionary)faces.push(o);meshes.push(o);
    }
  });
  actor.updateMatrixWorld(true);
  const npcInfo=NPCS[id]?{...NPCS[id],id,actor,head:bones.get('head'),chest:bones.get('spine_03'),
    speak:null,hp:100,alive:true,reacting:false,rig:null}:null;
  if(npcInfo){actor.name=npcInfo.name;actor.userData.namedNpc=true;lib.present.push(npcInfo);}
  const rest=new Map(),bodyInv=body.matrixWorld.clone().invert(),bodyRestQ=body.getWorldQuaternion(Q()).invert();
  for(const [n,b] of bones)rest.set(n,{q:b.quaternion.clone(),p:b.position.clone(),
    axis:b.getWorldQuaternion(Q()).premultiply(bodyRestQ),at:b.getWorldPosition(V()).applyMatrix4(bodyInv)});
  for(const m of meshes)m.material=personalize(T,lib,id,m.material,rest.get('eye_l')?.at.y??1.67);
  const e=new T.Euler(0,0,0,'YXZ'),q=Q(),inv=Q(),pq=Q(),worldInverse=new T.Matrix4(),A=V(),D=V(),P=V(),J=V(),goal=V(),
    start=V(),dir=V(),elbow=V(),end=V();
  const matrixP=V(),matrixScale=V(),bodyQ=Q();
  const matrixQ=(node,out)=>{node.matrixWorld.decompose(matrixP,out,matrixScale);return out;};
  const read=n=>rest.get(n).at, pelvis=bones.get('pelvis'),hipsY=read('pelvis').y;
  const LIMB={l:{},r:{}};
  for(const s of ['l','r']){
    LIMB[s].leg=['thigh_','calf_','foot_'].map(n=>n+s);
    LIMB[s].arm=['upperarm_','lowerarm_','hand_'].map(n=>n+s);
    for(const chain of [LIMB[s].leg,LIMB[s].arm])chain.lengths=[rest.get(chain[1]).p.length(),rest.get(chain[2]).p.length()];
  }
  const rot=(n,x=0,y=0,z=0)=>{const b=bones.get(n);if(b)b.quaternion.copy(rest.get(n).q).multiply(q.setFromEuler(e.set(x,y,z)));};
  function aim(n,child,target){
    const b=bones.get(n),up=b.parent;up.updateWorldMatrix(true,false);
    matrixQ(up,inv).invert();b.updateWorldMatrix(false,false);
    const desired=D.copy(target).sub(P.setFromMatrixPosition(b.matrixWorld)).applyQuaternion(inv).normalize();
    const r=rest.get(n).q;
    q.setFromUnitVectors(A.copy(rest.get(child).p).applyQuaternion(r).normalize(),desired);
    b.quaternion.copy(q).multiply(r);
  }
  function solve(names,x,y,z,px,py,pz){
    const [na,nb,nc]=names,a=bones.get(na);
    // Solve triangle in actor space with an explicit knee/elbow pole.
    a.getWorldPosition(start).applyMatrix4(worldInverse);
    goal.set(x,y,z);
    dir.copy(goal).sub(start);
    const [l0,l1]=names.lengths,raw=dir.length();
    if(raw<.00001)return;
    dir.multiplyScalar(1/raw);
    const l=clamp(raw,Math.abs(l0-l1)+.009,l0+l1-.006);
    J.set(px,py,pz);J.addScaledVector(dir,-J.dot(dir)).normalize();
    const mid=(l0*l0-l1*l1+l*l)/(2*l),bend=Math.sqrt(Math.max(0,l0*l0-mid*mid));
    elbow.copy(start).addScaledVector(dir,mid).addScaledVector(J,bend).applyMatrix4(body.matrixWorld);
    end.copy(start).addScaledVector(dir,l).applyMatrix4(body.matrixWorld);
    aim(na,nb,elbow);aim(nb,nc,end);
  }
  function foot(name,x,y=0){
    const b=bones.get(name);b.parent.updateWorldMatrix(true,false);
    matrixQ(b.parent,inv).invert();
    b.quaternion.copy(inv).multiply(bodyQ).multiply(q.setFromEuler(e.set(x,y,0)));
  }
  const isGhoul=id.startsWith('ghoul'),hubert=id==='hubert';
  const faceNames=['BlinkL','BlinkR','JawOpen','Purse','Smile','BrowL','BrowR'],values=new Float32Array(7);
  const channels=faces.map(m=>Object.entries(m.morphTargetDictionary).map(([name,i])=>[m.morphTargetInfluences,i,faceNames.indexOf(name)]));
  function face(t,seed,speech=0,purse=0,smile=0,glance=0,eyes=0){
    const z=(t+seed*1.61)%(3.82+frac(seed*.79)*2.34),blink=z<.20?sin(z/.20*Math.PI)**1.23:0,
      glanceY=sin(t*.69+seed)*.049;
    values[0]=Math.max(blink*.99,eyes);values[1]=Math.max(blink,eyes);values[2]=clamp(speech);values[3]=purse;values[4]=smile;
    values[5]=(.5+.5*sin(t*.92+seed))*.13+speech*.19;values[6]=(.5+.5*sin(t*.78+seed+.8))*.12;
    for(const list of channels)for(const [dest,i,k] of list)dest[i]=values[k]??0;
    rot('eye_l',glanceY,glance*.61+sin(t*.58+seed)*.065);rot('eye_r',glanceY,glance*.61+sin(t*.58+seed)*.065);
  }
  const fingers=['index','middle','ring','pinky'];
  function curl(s,amount){
    const sign=s==='l'?1:-1;
    for(const f of fingers)for(let k=1;k<=3;k++)rot(f+'_0'+k+'_'+s,amount*(k===1?.26:.14),sign*amount*.18,0);
  }
  function torso(x,y,z,bend,twist,tilt,t,lookX,lookY){
    pelvis.position.copy(rest.get('pelvis').p).add(A.set(x,y,z));
    rot('pelvis',bend*.25,twist*.30,tilt*.52);rot('spine_01',bend*.50,twist*.28,-tilt*.39);
    rot('spine_02',bend*.28,twist*.22,-tilt*.24);rot('spine_03',bend*.20,twist*.22,-tilt*.18);
    rot('neck_01',-bend*.29,lookX*.44);rot('head',-bend*.45+lookY,lookX*.56,sin(t*.96)*.026);
    body.updateWorldMatrix(true,false);worldInverse.copy(body.matrixWorld).invert();matrixQ(body,bodyQ);
  }
  const size=proto.userData.size??1,groundedY=y=>y+.003-(proto.userData.soleY??0)*size;
  const anchorA={},anchorB={},ankleGoal=V();
  function walk(t,distance,route,floorY,look,stopBlend,talk=0){
    // Ground anchors are sampled on the actual route, including the curves.
    const L=1.04,motion=1-stopBlend,phase=distance/L,w=phase*tau;
    const drop=.028+.013*cos(2*w)*motion;
    torso(sin(w)*.023*motion,-drop,0,.018+.023*motion,sin(w)*.115*motion,
      -.038*sin(w)*motion,t,look,0);
    for(const [j,s] of ['l','r'].entries()){
      const sign=j===0?1:-1,ankle=read('foot_'+s),f=frac(phase+j*.5),
        a=(Math.floor(phase+j*.5)+.29-j*.5)*L,u=clamp((f-.59)/.41),
        blend=u*u*(3-2*u),strideWidth=.097*sign;
      route(a,anchorA);route(a+L,anchorB);
      const xx=mix(anchorA.x+cos(anchorA.yaw)*strideWidth,anchorB.x+cos(anchorB.yaw)*strideWidth,blend);
      const zz=mix(anchorA.z-sin(anchorA.yaw)*strideWidth,anchorB.z-sin(anchorB.yaw)*strideWidth,blend);
      const yawDelta=Math.atan2(sin(anchorB.yaw-anchorA.yaw),cos(anchorB.yaw-anchorA.yaw));
      const lift=sin(Math.PI*u)**1.35*.079*motion;
      ankleGoal.set(xx,groundedY(floorY)+ankle.y*size+lift,zz).applyMatrix4(worldInverse);
      solve(LIMB[s].leg,mix(ankle.x*.86,ankleGoal.x,motion),ankleGoal.y,mix(ankle.z,ankleGoal.z,motion),sign*.15,0,1);
      const footYaw=anchorA.yaw+yawDelta*blend-actor.rotation.y;
      foot('foot_'+s,-sin(tau*u)*.133*motion,Math.atan2(sin(footYaw),cos(footYaw))*motion);
      solve(LIMB[s].arm,sign*(.208+.018*motion),hipsY-.160+motion*.036*Math.abs(sin(w)),.024-.113*sign*sin(w)*motion,sign*.65,-.45,-.72);
      curl(s,.36);
    }
    face(t,2.34,talk,0,.05,look);
  }
  function grip(side){
    const n='hand_'+side,w=bones.get(n),joint=f=>read(f+'_01_'+side);
    const fore=joint('middle').clone().sub(read(n)).normalize();
    const z=joint('index').clone().sub(joint('pinky')).normalize();
    const y=fore.clone().negate().addScaledVector(z,fore.dot(z)).normalize();
    const x=V().crossVectors(y,z),palm=x.clone().negate();
    if(palm.dot(joint('thumb').clone().sub(joint('middle')))<0)palm.negate();
    const socket=new T.Group(),restHand=rest.get(n).axis.clone().invert();
    socket.position.copy(joint('index')).lerp(joint('pinky'),.54).sub(read(n))
      .addScaledVector(fore,.012).addScaledVector(palm,.010).applyQuaternion(restHand);
    socket.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z)).premultiply(restHand);
    w.add(socket);
    const curls=[];
    for(const f of [...fingers,'thumb'])for(let i=1;i<=3;i++){
      const name=f+'_0'+i+'_'+side,next=f+'_0'+(i+1)+'_'+side,b=bones.get(name);
      if(!b)continue;
      const direction=rest.has(next)?read(next).clone().sub(read(name)):read(name).clone().sub(read(f+'_0'+(i-1)+'_'+side));
      const bq=rest.get(name).axis.clone().invert();
      const axis=V().crossVectors(direction,palm).applyQuaternion(bq).normalize();
      curls.push({b,name,f,axis,angle:f==='thumb'?[.33,.48,.30][i-1]:[.77,1.09,.68][i-1]});
    }
    const socketInv=socket.quaternion.clone().invert(),parentQ=Q(),curlQ=Q(),wristQ=Q(),offset=V();
    const palmSign=Math.sign(palm.dot(x));
    return {socket,palmSign,orient(back,toward){
      const Y=back.normalize(),X=toward.addScaledVector(Y,-toward.dot(Y)).normalize().multiplyScalar(palmSign);
      return Q().setFromRotationMatrix(new T.Matrix4().makeBasis(X,Y,V().crossVectors(X,Y)));
    },wristAt(point,desired,out){
      wristQ.copy(desired).multiply(socketInv);
      return out.copy(point).sub(offset.copy(socket.position).applyQuaternion(wristQ).multiplyScalar(size));
    },hold(desired,tension=1){
      w.parent.getWorldQuaternion(parentQ).invert();
      w.quaternion.copy(parentQ).multiply(desired).multiply(socketInv);
      for(const {b,name,f,axis,angle} of curls){
        const weight=typeof tension==='number'?tension:tension[f];
        b.quaternion.copy(rest.get(name).q).multiply(curlQ.setFromAxisAngle(axis,angle*weight));
      }
    }};
  }
  function archivePose(){
    const left=grip('l'),right=grip('r'),goal=V(),basis=new T.Matrix4();
    // World axes: wrist back toward the clerk, thumb up on the stamp;
    // opposite hand lies open on the outer edge of the register.
    const stampQ=Q().setFromRotationMatrix(basis.makeBasis(V(-1,0,0),V(0,0,1),V(0,1,0)));
    const pageQ=Q().setFromRotationMatrix(basis.makeBasis(V(0,1,0),V(0,0,1),V(1,0,0)));
    return (t,work,glance=0,speech=0,notice=0)=>{
      torso(.006*sin(t*.80),-.024,.036,.22-.085*notice,-.043,.020,t,glance,.27-.28*notice);
      for(const s of ['l','r']){
        const sign=s==='l'?1:-1,a=read('foot_'+s);
        solve(LIMB[s].leg,a.x*.87,a.y,a.z+sign*.028,sign*.11,0,1);foot('foot_'+s,0,sign*.051);
        const [socket,desired,target]=s==='l'?[left,pageQ,work.left]:[right,stampQ,work.right];
        socket.wristAt(target,desired,goal).applyMatrix4(worldInverse);
        solve(LIMB[s].arm,goal.x,goal.y,goal.z,sign*.81,-.54,-.43);
        socket.hold(desired,s==='l'?.085:.70);
      }
      face(t,7,speech,.035,0,glance);
    };
  }
  function deskWork(t,job,glance=0,speech=0){
    const f=sin(t*(job==='cook'?2.3:1.55)),b=cos(t*1.65),notice=Math.min(1,speech*2);
    torso(.014*sin(t*.91),-.040,.017,.12-.065*notice,.04*f,.020*b,t,glance,.14-.23*notice);
    for(const [j,s] of ['l','r'].entries()){
      const sign=j===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,ankle.x*.90,ankle.y,ankle.z+sign*.045,.12*sign,0,1);
      foot('foot_'+s,0);
      const cook=job==='cook',note=job==='registry',reach=j===0?.38:cook?.54:note?.50:.465;
      solve(LIMB[s].arm,sign*(.166+.034*f*(j?1:.22)),j===0?1.015:1.023+.019*f,
        reach+(j?.037*b:0),sign*.79,-.48,-.69);
      rot('hand_'+s,.23+.10*f,sign*.14,.24*sign);curl(s,j===0?.64:1.03);
    }
    face(t,job.length,speech,.08,0,glance);
  }
  function chartPose(pencil){
    const left=grip('l'),right=grip('r'),target=V(),wrist=V();
    const penQ=right.orient(V(.27,.33,.90),V(-.52,-.85,.06));
    const pageQ=left.orient(V(-.08,.25,.96),V(0,-1,0));
    const pinch={index:.46,middle:.53,ring:.86,pinky:.91,thumb:.74};
    const shaft=V(.38,.69,.61).normalize(),penLocal=shaft.clone().applyQuaternion(penQ.clone().invert());
    pencil.quaternion.setFromUnitVectors(V(0,1,0),penLocal);
    pencil.position.set(right.palmSign*.008,-.025,.025);
    const nib=pencil.position.clone().applyQuaternion(penQ).addScaledVector(shaft,-.089).multiplyScalar(size);
    right.socket.add(pencil);
    return (t,chart,glance=0,talk=0)=>{
      const stroke=(t%5.4)/1.8,writing=1-clamp(talk*2.5),line=Math.floor(stroke),p=stroke-line;
      const sweep=clamp(p/.78),back=clamp((p-.78)/.22),reset=back*back*(3-2*back);
      const cursorX=mix(-.027,.037,sweep)-.064*reset;
      const cursorZ=.027-mix(line,(line+1)%3,reset)*.038+sin(t*19)*.005*(1-back);
      const lift=Math.sin(back*Math.PI)*.039;
      torso(.006*sin(t),-.017,.026,.19-.075*(1-writing),.011*sin(t*.66),-.03,t,glance,.21*writing);
      for(const s of ['l','r']){
        const side=s==='l'?1:-1,ankle=read('foot_'+s);
        solve(LIMB[s].leg,ankle.x*.95,ankle.y,ankle.z+side*.028,side*.16,0,1);foot('foot_'+s,0,side*.10);
        const l=s==='l',socket=l?left:right,desired=l?pageQ:penQ;
        if(l)target.set(chart.x-.091,chart.y+.023,chart.z+.055);
        else target.set(chart.x+cursorX*writing,chart.y+.006+lift+(1-writing)*.047,
          chart.z+cursorZ*writing+.035*(1-writing)).sub(nib);
        socket.wristAt(target,desired,wrist).applyMatrix4(worldInverse);
        solve(LIMB[s].arm,wrist.x,wrist.y,wrist.z,side*.68,-.56,-.42);
        socket.hold(desired,l?.075:pinch);
      }
      face(t,4.18,talk,.022,0,glance);
    };
  }
  function wardSeat(t,seat,glance=0,talk=0,patient=false){
    const home=(seat+.108)/size,pulse=patient?clamp(talk):0,breath=sin(t*2.3);
    torso(.006*breath,home-hipsY+.003*breath,patient?-.039:.007,
      patient?.007-.22*pulse:.14,.021*sin(t*.78),pulse*.026*breath,t,glance,patient?.020-.24*pulse:.194-.14*talk);
    for(const [i,s] of ['l','r'].entries()){
      const side=i===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,side*(patient?.136:.116)/size,ankle.y,
        ankle.z+(patient?.31:.338)+side*.023,side*.19,0,1);
      foot('foot_'+s,0,side*.13);
      const up=patient?pulse*.014:talk*.011;
      solve(LIMB[s].arm,side*(patient?.324:.147)/size,
        (patient?seat+.333+up:seat+.164+up)/size,(patient?.111:.262)/size,side*.74,-.48,-.61);
      rot('hand_'+s,patient?.18:.40,side*.14,side*.10);curl(s,patient?.47+pulse*.44:.39);
    }
    face(t,patient?5.86:4.81,talk,.02,0,glance,pulse*.37);
  }
  function factoryPose(t,role,glance=0,speech=0){
    if(role==='repair'){deskWork(t,'registry',glance,speech);return;}
    const tutor=role==='trainer',waiting=role==='cadet',interval=(t+2.7)%13;
    const cue=tutor?Math.sin(Math.PI*clamp((interval-3.8)/2.4))**2:0;
    torso(.008*sin(t*.6),-.014,0,.012+.018*cue,.032*sin(t*.49),.021*sin(t*.68),t,
      glance+.075*sin(t*.55),waiting?.036:-.014);
    for(const [i,s] of ['l','r'].entries()){
      const side=i===0?1:-1,ankle=read('foot_'+s),explain=i===1?cue:0;
      solve(LIMB[s].leg,ankle.x*.92,ankle.y,ankle.z+side*(waiting?.026:.046),side*.115,0,1);
      foot('foot_'+s,0,side*.056);
      const crease=.008*sin(t*1.2+i);
      solve(LIMB[s].arm,side*(.193+explain*.097),hipsY-.158+crease+explain*.475,.063+explain*.177,
        side*.68,-.46,-.72);
      rot('hand_'+s,.02-explain*.30,side*.10,.083*side);
      curl(s,.39-.20*explain);
    }
    face(t,role.length+.18,speech,.025,.015,glance);
  }
  function visitorPose(t,job,seat=0,glance=0,talk=0){
    // The ankle remains on the floor; only the hips lower to the contact
    // plane of the actual seat. All targets are applied to the same rig.
    const seated=seat>0,quiet=job==='rest',prayer=job==='prayer',smoke=job==='lounge',
      wash=job==='wash',search=job==='books',broadcast=job==='studio',green=job==='greenhouse',
      home=seated?(seat+.108)/size:hipsY-.037,
      cue=.5+.5*sin(t*2.49),scan=.5+.5*sin(t*.83-.66),release=clamp(talk*.95),
      lift=smoke?(1-clamp(Math.abs((t%8.8)-2.04)/1.65))**2*(1-release):0,
      lean=prayer?.17:quiet?.041:smoke?-.019:wash?.185:search?.074:green?.142:.09;
    torso(.014*sin(t*.83),home-hipsY+.004*sin(t*2.12),seated?.01:.025,lean,
      (search?.07:quiet?.04:.024)*sin(t*.93),.023*sin(t*.76),t,glance,
      (prayer?.27:search?mix(.18,-.11,scan):wash?.29:green?.20:broadcast?.092:.049)*(1-release)-.10*release);
    for(const [i,s] of ['l','r'].entries()){
      const side=i===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,side*(seated?.119:.103),ankle.y,ankle.z+(seated?(quiet?.39:.347):side*.035),side*.195,-.10,1);
      foot('foot_'+s,seated?.023:0,side*.12);
      let x=side*.175,y=home+.144,z=.298,pitch=.21,grip=.55;
      if(prayer){x=side*.047;y=home+.417-.056*release;z=.263+.012*sin(t*1.5);pitch=-.54;grip=.31;}
      if(wash){x=side*(.047+.027*sin(t*3.1+i));y=.903+.025*sin(t*3.6+i);z=.467+.044*sin(t*3+i);pitch=.35;grip=.56;}
      if(search){
        x=i===0?.135:-.16+.089*sin(t*1.05);y=i===0?1.07:mix(1.193,1.544,scan);z=i===0?.270:.410+.105*cue;
        pitch=i===0?.24:-.25;grip=i===0?.65:.39;
      }
      if(smoke){x=i===0?.208:mix(-.205,-.047,lift);y=i===0?home+.099:mix(home+.213,home+.769,lift);
        z=i===0?.23:mix(.308,.179,lift);pitch=.20-.67*lift;grip=.62;}
      if(broadcast){x=i===0?.179:-.227+.032*sin(t*1.9);y=.993+.016*sin(t*2.0+i);z=i===0?.386:.45+.033*sin(t*1.4);grip=.62;}
      if(green){x=side*.145+.030*sin(t*2.2+i);y=1.046+.022*sin(t*2.33+i);z=.470+.033*sin(t*2.5+i);}
      if(quiet){x=side*.148;y=home+.045+.015*sin(t*1.43+i);z=.267;pitch=.44;grip=.49;}
      solve(LIMB[s].arm,x,y,z,.73*side,-.48,-.64);
      rot('hand_'+s,pitch,.22*side,(prayer?-.44:.15)*side);curl(s,grip);
    }
    face(t,job.length+.44,talk*.29*(.31+.69*Math.abs(sin(t*13.5))),prayer?.12:0,
      quiet?.075:smoke?.11:.015,glance);
  }
  const tavernEye=V();
  function tavernPose(t,role,{waving=false,glance=0,talk=0,sip=0,sob=0,push=0,wipe=0,beat=t}={}){
    const seated=role===2||role===3,home=seated?(.495+.106)/size:hipsY-.023;
    const working=1-Math.min(1,talk*2),shift=sin(t*(seated?.77:1.07)),stir=sin(t*1.64),
      wave=waving?.56+.42*sin(t*3.8):0,joke=role===2?(Math.max(0,sin(t*.93-.8))**5)*.24+talk*.22:0;
    const drunk=role===3,rock=drunk?sin(t*1.13)*.014+cos(t*.59)*.012:0,
      heave=sob*(.55+.45*sin(t*8.8)**2);
    torso(shift*(seated?.012:.024)+rock,home-hipsY+sin(t*1.5)*.007+heave*.014,seated?.024+sob*.065:.012,
      .035+(role===0?wipe*.095:drunk?-.10*sip+sob*.26:.026),shift*.092+(role===2?joke*.31:0)+rock*2.13,
      .026*sin(t*.91)+rock*2.56,t,glance+(role===2?.12:0),drunk?-.19*sip+sob*.29:role===1?.052:.009);
    // The wrist targets follow the posed face, not its standing bind pose.
    if(drunk)bones.get('eye_l').getWorldPosition(tavernEye).applyMatrix4(worldInverse);
    for(const [i,side] of ['l','r'].entries()){
      const s=i===0?1:-1,ankle=read('foot_'+side);
      solve(LIMB[side].leg,s*(seated?.123:.106),ankle.y,ankle.z+(seated?.283:s*.031),s*.145,-.04,1);
      foot('foot_'+side,seated?.023:0,s*.096);
      let x=s*.181,y=home+(seated?.135:-.135),z=seated?.255:.068,rotX=.11,close=.37;
      if(role===0){
        if(i===1&&waving){x=-.40-.073*wave;y=1.29+.24*wave;z=.238;rotX=-.39;close=.13;}
        else if(i===1){
          x=-.175+wipe*(.062+.15*stir);y=mix(home-.125,1.106/size,wipe);
          z=mix(.107,.465+.058*cos(t*1.64),wipe);rotX=.32*wipe;close=.30+wipe*.35;
        }else{x=.198+talk*.055;y=home-.095+.35*talk;z=.146+talk*.13;close=.38;}
      }else if(role===1){
        x=s*.202+.015*shift;y=1.028+.015*sin(t*1.17)+(i===1?.006:0);z=.351+sin(t*.81)*.017;rotX=.11*s;close=.52;
      }else if(role===2){
        x+=s*joke*.10;y+=joke*(i===1?1:.51);z+=joke*.46;rotX=.27-joke*.9;close=.31+joke*.32;
      }else if(role===3&&i===1){
        x=mix(-.191,-.087,sip);y=mix(home+.173,tavernEye.y-.154,sip);z=mix(.303,tavernEye.z+.150,sip);
        rotX=.18-.42*sip;close=.80;
      }else if(drunk){
        const wipeEye=sob*(.88+.12*sin(t*5.7));
        x=mix(.194,tavernEye.x+.018,wipeEye);y=mix(home+.129,tavernEye.y-.102,wipeEye);
        z=mix(.26,tavernEye.z+.097,wipeEye);rotX=mix(.10,-.46,wipeEye);close=mix(.41,.43,wipeEye);
      }else if(role===4){
        const trill=.012*sin(beat/.45*Math.PI*2+i);
        x=s*(.215+(i===1?push*.066:push*.018));y=home+.106+trill;
        z=.330+trill*.38;rotX=-.18;close=.36+.23*Math.max(0,sin(beat*12.2+i))*working;
      }
      solve(LIMB[side].arm,x,y,z,s*.78,-.51,-.62);
      rot('hand_'+side,rotX,(role===4?.20:.12)*s,(waving&&i===1?.64*sin(t*6.7):.115)*s);
      curl(side,close);
    }
    face(t,role*1.121+.65,talk*(.52+.28*Math.abs(sin(t*14.7)))+heave*.24,.022+sob*.27,
      (role===2?.063:role===0?.092:.027)*(1-sob),glance,sob*.65);
  }
  const festEye=read('eye_r')??read('head');
  function festivalPose(t,role,phase,look=0,talk=0,props={}){
    const zw=role===0,bar=role===1,dj=role===2,guest=role===3,
      working=1-clamp(talk*1.5),weight=sin(t*.78+role*.79),gesture=talk*(.65+.35*sin(t*4.2)),
      aim=zw?(progress(.08,.34,phase)-progress(.493,.555,phase))*working:0,
      release=zw?(progress(.48,.555,phase)-progress(.64,.86,phase))*working:0,
      set=zw?(progress(.05,.15,phase)-progress(.70,.95,phase))*working:0,
      wash=(props.clean??0)*working,sip=(props.sip??0)*working,
      cue=dj?(props.cue??0)*working:0;
    const bend=.022+bar*.143*wash+dj*(.096-.055*gesture)+guest*(.034-.085*sip)+release*.131;
    torso(.024*weight-.024*set,-.019-.014*set-.008*wash-.011*release,.021*set+.061*release+.045*wash,
      bend,weight*.044-.207*aim+.183*release+.145*gesture*Math.sign(look),.017*weight+.047*aim,
      t,look,zw?.037*set-.061*aim+.052*release:dj?.126*(1-gesture):bar?.148*wash:guest?-.148*sip:.045);
    for(const [i,s] of ['l','r'].entries()){
      const sign=i===0?1:-1,a=read('foot_'+s);
      solve(LIMB[s].leg,a.x*(zw?1.29:1.12),a.y,a.z+(zw?sign*-.105:sign*.029),sign*.18,-.035,1);
      foot('foot_'+s,0,sign*(zw?.17:.083));
      let x=sign*(.205+.034*gesture),y=hipsY-.13+.239*gesture,z=.086+.19*gesture,rx=.11,close=.33;
      if(zw&&i===1){
        x=mix(-.216,-.135,aim)+.045*release;
        y=mix(hipsY+.07,festEye.y-.103,aim)+release*.43;
        z=mix(.119,festEye.z+.176,aim)+release*.379;
        rx=.11+.37*aim-.64*release;close=.69+.18*aim-.51*release;
      }else if(zw){
        y+=.102+.068*set;z+=.077+.038*set;
      }else if(bar){
        const sweep=sin(t*2.64)*.093*wash;
        x=mix(sign*.206+.059*gesture,i===1?-.161+sweep:.263,working);
        y=mix(y,1.075/size+.027*(1-wash),working);
        z=mix(z,i===1?.326+.108*wash:.30+.050*wash,working);
        rx=-(i===1?.15+.18*wash:.10);close=.33+.21*wash*(i===1);
      }else if(dj){
        const taps=.018*Math.max(0,sin(t*13+i*1.58))*cue;
        x=mix(x,sign*(i===1?.213:.353)+.031*sin(t*(i===1?1.18:2.4))*cue,working);
        y=mix(y,1.061/size+taps+.048*(1-cue),working);
        z=mix(z,.346+.064*cue+.031*sin(t*1.07+i)*cue,working);
        rx=-.21+.074*sin(t*2.34+i)*cue;close=.28+.24*(i===0)*cue;
      }else if(guest&&i===1){
        x=mix(-.173,-.104,sip);y=mix(hipsY+.184,festEye.y-.193,sip);
        z=mix(.266,festEye.z+.137,sip);rx=.10-.46*sip;close=.72;
      }else if(guest){
        y=mix(y,1.105/size+.023*sin(t*1.65),working);z=mix(z,.414+.055*sin(t*1.8),working);
        rx=-.26+.1*sin(t*2.78)*working;close=.36+.33*working;
      }
      solve(LIMB[s].arm,x,y,z,sign*.73,-.44,-.58);
      rot('hand_'+s,rx,sign*(.14+.08*aim),(.075+.08*release)*sign);
      curl(s,close);
    }
    face(t,5.4+role,talk,.032+release*.04,(dj?.106:.04)*(1-gesture)-sip*.07,look);
  }
  const vialGrip=id==='grey'?grip('r'):null,vialWrist=V(),vialPoint=V(),vialQuat=Q();
  function greyPose(t,{tread=null,look=0,talk=0,show=0,shake=0,spark=0,laugh=0}={}){
    const breath=sin(t*1.85),chuckle=laugh*(.48+.52*Math.abs(sin(t*15.7)));
    const recoil=spark*(.038+.014*cos(t*10.2));
    if(tread)walk(t,tread.distance,tread.route,tread.floor,look,tread.stop,talk);
    else {
      torso(.015*sin(t*1.17)+spark*.033,-.026+.003*breath-.012*chuckle-.008*shake,.013+.021*show-recoil,
        .045+.093*show-.13*spark+.054*chuckle,-.043*show+.027*sin(t*1.28)+.11*spark,
        -.02+.015*sin(t*.94)+.027*chuckle,t,look,.032+.16*show-.111*spark+.046*chuckle);
      for(const [j,s] of ['l','r'].entries()){
        const sign=j===0?1:-1,a=read('foot_'+s),brace=j===0?0:spark;
        solve(LIMB[s].leg,a.x*(1.07+.13*show)+sign*.044*brace,a.y+.031*sin(Math.PI*brace),
          a.z+sign*.052-.121*brace,sign*.17,0,1);
        foot('foot_'+s,-.12*sin(Math.PI*brace),sign*(.09+.11*brace));
      }
    }
    const twitch=shake*sin(t*26.4),raise=show*(.27+.028*cos(t*3.2));
    const stride=tread?sin(tread.distance/1.04*tau)*(1-tread.stop):0;
    vialPoint.set(-.219+.061*show+.052*twitch+.022*stride,1.175+raise+.063*twitch+.010*breath+.020*chuckle+.019*stride,
      .321+.127*show+.026*twitch-.032*stride);
    body.localToWorld(vialPoint);
    vialQuat.setFromEuler(e.set(-Math.PI/2+.32*twitch+.096*stride,actor.rotation.y,.08-.24*twitch+.063*stride));
    vialGrip.wristAt(vialPoint,vialQuat,vialWrist).applyMatrix4(worldInverse);
    solve(LIMB.r.arm,vialWrist.x,vialWrist.y,vialWrist.z,-.77,-.54,-.48);
    vialGrip.hold(vialQuat,.88);
    if(!tread){
      solve(LIMB.l.arm,mix(.211,-.065,spark),mix(hipsY-.14,1.385,spark)+.084*chuckle,
        .071+.353*spark+.050*chuckle,.84,-.46,-.53);
      rot('hand_l',.14-.29*spark,.13-spark*.22,.069+spark*.16);curl('l',.38+.40*spark);
    }
    face(t,8.21,Math.min(1,talk+chuckle*.13),.04+chuckle*.13,.075*show-.037*spark,look);
  }
  function chairPose(t,seat,weight,glance=0,talk=0){
    const home=mix(hipsY-.017,(seat+.108)/size,weight),rise=sin(weight*Math.PI);
    torso(.007*sin(t*1.2),home-hipsY+.003*sin(t*1.65),.07*rise,.028+.21*rise,
      .022*sin(t*.78),.015*sin(t*.46),t,glance,-.012-.075*rise);
    for(const [i,s] of ['l','r'].entries()){
      const side=i===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,side*mix(.094,.116,weight),ankle.y,
        ankle.z+mix(side*.031,.243,weight),side*.14,0,1);
      foot('foot_'+s,0,side*.08);
      solve(LIMB[s].arm,side*mix(.181,.215,weight),mix(hipsY-.155,home+.16,weight),mix(.047,.276,weight),
        side*.76,-.5,-.71);
      rot('hand_'+s,.056+.272*weight,side*.14,side*.10);curl(s,.39+.10*weight);
    }
    face(t,6.58,talk*(.44+.56*Math.abs(sin(t*17.6))),.017,.026,glance);
  }
  function tankPose(t,reach,glance,talk){
    chairPose(t,.48,0,glance,talk);
    if(reach<.001)return;
    const n=reach*(.88+.12*Math.sin(t*5));
    solve(LIMB.l.arm,mix(.18,.164,n),mix(hipsY-.15,hipsY+.37,n),mix(.063,.49,n),.78,-.38,-.32);
    rot('hand_l',-.17*n,.25*n,-.19*n);curl('l',mix(.4,.09,n));
  }
  function meditate(t,attention=0,glance=0,talk=0){
    const breath=sin(t*1.06),home=.174/size;
    torso(.004*breath,home-hipsY+.005*breath,-.014,.045+.015*breath,
      .018*glance,.010*breath,t,glance,.115-.15*attention);
    for(const [i,s] of ['l','r'].entries()){
      const side=i===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,-side*(i===0?.128:.169),(ankle.y+(i===0?.040:.021)),i===0?.338:.452,
        side,.07,.22);
      foot('foot_'+s,-.025,-side*1.20);
      solve(LIMB[s].arm,side*.302,.318+.007*breath,i===0?.175:.204,side*.73,-.26,-.60);
      rot('hand_'+s,.37,side*.19,.15*side);curl(s,.22);
    }
    face(t,3.59,talk,.018,.072,glance,.91*(1-attention));
  }
  function pose(t,phase,motion,attack,hit,fall,seed,speech=0,look=0,purse=0){
    body.rotation.set(fall*1.41,0,fall*(isGhoul?.67:0));body.position.y=fall*.16;
    const w=phase*tau,b=sin(t*2.2+seed),lean=isGhoul?.15:hubert?.095:.016;
    torso(sin(w)*.019*motion,-.028-.025*motion*(.5+.5*cos(w*2))-.019*attack,0,
      lean+.17*attack-.18*hit+b*.012,sin(w)*.13*motion,.052*sin(w)*motion+(isGhoul?.038:0),t,
      look+.035*sin(t*1.43+seed), .063*hit);
    for(const [j,s] of ['l','r'].entries()){
      const sign=j===0?1:-1,f=frac(phase+j*.5),stance=.59,u=clamp((f-stance)/(1-stance)),
        stride=(f<stance?1-2*f/stance:-cos(u*Math.PI))*(isGhoul?.239:.178),lift=sin(u*Math.PI)*(isGhoul?.089:.074)*motion;
      const ankle=read('foot_'+s);
      solve(LIMB[s].leg,ankle.x*.84,ankle.y+lift,ankle.z+stride*motion,.05*sign,-.06,1);
      foot('foot_'+s,.22*sin(tau*u)*motion);
      const x=sign*(.225+.065*attack)+sin(w)*.022*motion,
        y=hipsY-.14+.52*attack+.026*b*sign-.065*hit*j,
        z=.064-.17*sin(w)*motion*sign+.52*attack+.05*lean;
      solve(LIMB[s].arm,x,y,z,sign*.59,-.46,-.68);curl(s,.42+.22*attack);
    }
    face(t,seed,speech||attack*.34,purse,0,look);
  }
  // Each dance describes hips, a planted/raised foot and authored hand paths.
  // Shared loop phase comes from WebAudio, never from simulated kick lights.
  function dance(t,beat,style,look=0,activity=1){
    const b=beat*Math.PI,w=beat*tau,s=sin(b),c=cos(b),d=sin(w),q=activity,
      step=style===4?.05:style===1?.14:.114;
    const shift=q*step*(style===2?sin(b*.5):s),tilt=q*.10*s;
    body.rotation.set(0,0,0);body.position.y=0;
    torso(shift,-.032-q*.043*(.5-.5*cos(w)),style===3?.026*d:0,
      style===4?.05:.022+q*.11*sin(b+.8),q*.20*c,tilt,t,look,.038*d*q);
    for(const [j,side] of ['l','r'].entries()){
      const sign=j===0?1:-1,ankle=read('foot_'+side),cycle=(beat+j)/2,
        a=clamp((frac(cycle)-.55)/.45),swing=a*a*(3-2*a),up=sin(Math.PI*a)*q,
        travel=(Math.floor(cycle)%2?1:-1)*(swing*2-1)*q,
        sideStep=travel*(style===2?.092:style===1?.065:.038);
      solve(LIMB[side].leg,ankle.x*.92+sideStep,ankle.y+up*(style===4?.021:.065),
        ankle.z+travel*sign*(style===3?.14:style===0?.071:style===4?.02:.047),.16*sign,0,1);
      foot('foot_'+side,-.10*up);
      let x=sign*.28,y=hipsY-.12,z=.16;
      if(style===0){x=sign*(.28+.06*c*sign);y+=q*(.19+.19*sign*s);z+=q*(.14+.14*sign*c);}
      if(style===1){const up=clamp(.5+.5*s*sign);x+=q*sign*(.135+.06*d);y+=q*(.12+.68*up**2);z+=q*.11*cos(b+.8);}
      if(style===2){x+=q*sign*(.11+.09*cos(b+sign));y+=q*(.25+.13*d*sign);z+=q*(.24+.11*s*sign);}
      if(style===3){x+=q*sign*.11*s;y+=q*(.25+.18*clamp(sign*c));z+=q*(.19+.21*sign*s);}
      if(style===4){x=sign*(.24+.024*s);y+=q*(.18+.075*s*sign);z+=q*.15;}
      solve(LIMB[side].arm,x,y,z,sign*.78,-.53,-.63);curl(side,style===1?.24:.49);
    }
    face(t,style+1,0,0,style===4?.21:.28+.13*c,look);
  }
  function altarWork(t,attention=0,look=0){
    const work=1-attention,stroke=sin(t*3.8)+.26*sin(t*7.6+.46),shift=sin(t*1.6);
    torso(.017*shift*work,-.034-.018*work,.047*work,.076+.24*work,
      .10*shift*work,.044*shift*work,t,look,.12*work-.055*attention);
    for(const [j,s] of ['l','r'].entries()){
      const side=j===0?1:-1,ankle=read('foot_'+s);
      solve(LIMB[s].leg,ankle.x*.92,ankle.y,ankle.z+side*.056,.12*side,0,1);
      foot('foot_'+s,0);
      solve(LIMB[s].arm,j===0?.10+.028*shift:-.153, j===0?1.140:1.268+.040*stroke*work,
        j===0?.560:.429+.050*shift,.80*side,-.45,-.65);
      rot('hand_'+s,j===0?.13:-.16+.25*stroke*work,-.14*side,.12*side);
      curl(s,j===0?.25:.77);
    }
    face(t,1.98,.18*attention,.33*attention,0,look);
  }
  const shapes=[],bind=new T.Quaternion();
  const ellipsoid=(bone,center,x,y,z,orientation=bind)=>{
    const b=bones.get(bone),join=rest.get(bone),inverse=join.axis.clone().invert();
    const local=new T.Matrix4().compose(center.clone().sub(join.at).applyQuaternion(inverse),
      inverse.clone().multiply(orientation),V(x,y,z));
    const region=bone==='head'?'head':/arm_|hand_/.test(bone)?'arm_'+bone.at(-1):
      /thigh_|calf_|foot_/.test(bone)?'leg_'+bone.at(-1):'body';
    shapes.push({b,local,head:bone==='head',region,inverse:new T.Matrix4()});
  };
  const eyeCenter=read('eye_l').clone().lerp(read('eye_r'),.5);
  // Fit to the eye line in bind space, not the head bone's local +Y.
  // The lower face and upper skull move with the actual posed head.
  ellipsoid('head',eyeCenter.clone().add(V(0,.014,-.074)),.097,.104,.114);
  ellipsoid('head',eyeCenter.clone().add(V(0,-.058,-.021)),.080,.058,.077);
  const neck=read('neck_01'),chest=read('spine_03'),waist=read('spine_02');
  ellipsoid('neck_01',neck.clone().lerp(read('head'),.32).add(V(0,-.004,.005)),.063,.095,.069);
  ellipsoid('spine_03',chest.clone().lerp(neck,.43).add(V(0,0,.025)),.222,(neck.y-chest.y)*.58+.020,.151);
  ellipsoid('spine_02',waist.clone().add(V(0,.013,.024)),.171,.155,.133);
  ellipsoid('pelvis',read('pelvis').clone().add(V(0,-.046,.010)),.177,.139,.132);
  const linkZone=(bone,child,t,r,w=r)=>{
    const a=read(bone),b=read(child),axis=b.clone().sub(a),length=axis.length();
    ellipsoid(bone,a.clone().lerp(b,t),w,length*.53+r*.58,r,Q().setFromUnitVectors(V(0,1,0),axis.normalize()));
  };
  for(const s of ['l','r']){
    for(const [a,b,r,w] of [['upperarm_','lowerarm_',.080,.077],['lowerarm_','hand_',.065,.060],
      ['thigh_','calf_',.098,.091],['calf_','foot_',.082,.071]])linkZone(a+s,b+s,.47,r,w);
    linkZone('hand_'+s,'middle_02_'+s,.44,.046,.042);
    linkZone('foot_'+s,'ball_'+s,.56,.057,.061);
  }
  function hitShapes(){
    for(const {b,local,inverse} of shapes){
      b.updateWorldMatrix(true,false);inverse.multiplyMatrices(b.matrixWorld,local).invert();
    }
    return shapes;
  }
  const flinchBones=['spine_02','spine_03','neck_01'].map(name=>[bones.get(name),Q()]);
  const limbReactions={arm_l:bones.get('upperarm_l'),arm_r:bones.get('upperarm_r'),
    leg_l:bones.get('thigh_l'),leg_r:bones.get('thigh_r')},limbBase=Q();
  // Allocate only on the first fall for a rig. This is a short, articulated
  // animation with floor contacts, not a physics simulation left running.
  let falling=null,clock=0,reacting=false,side=1,flinchPitch=0,flinchRegion='body',flinchLimb=null;
  const isReacting=()=>reacting;
  const setReacting=value=>{reacting=value;if(npcInfo)npcInfo.reacting=value;};
  const progress=(a,b,t)=>{const k=clamp((t-a)/(b-a));return k*k*(3-2*k);};
  function fallState(){
    const joints=[...bones.entries()].map(([name,b])=>({b,start:Q(),brace:Q(),rested:Q(),
      delay:/hand|arm|_0[123]_[lr]$/.test(name)?.033+(name.endsWith('_l')?.067:0):name==='head'?.071:0}));
    const contact=[];
    for(const s of ['l','r']){
      contact.push({chain:LIMB[s].arm,b:bones.get('hand_'+s),pad:.041,side:s==='l'?1:-1,leg:false},
        {chain:LIMB[s].leg,b:bones.get('foot_'+s),pad:.058,side:s==='l'?1:-1,leg:true});
    }
    return {joints,contact,m:new T.Matrix4(),startHip:V(),hip:V(),point:V(),pelvis:V(),up:V(),dir:V(),axis:V(),
      bodyAt:V(),bodyQ:Q(),turnQ:Q(),ankleQ:Q(),offset:V(),active:false};
  }
  function fallKey(f,brace){
    const fore=f.dir.z,side=f.dir.x,fold=f.fold;
    pose(0,.2,0,0,0,0,1);
    for(const [i,s] of ['l','r'].entries()){
      const sign=i===0?1:-1,strong=sign*side>0||Math.abs(side)<.23&&i===0;
      const bend=brace?(strong?.59:.80):(strong?.14:.35)+fold*.54;
      rot('thigh_'+s,-bend,sign*(strong?.07:.16),sign*(strong?.11:.26));
      rot('calf_'+s,brace?(strong?1.14:.94):(strong?.27:.66)+fold*.64);
      rot('foot_'+s,brace?-.27:-.08,sign*.20,sign*(strong?.055:.18));
      const reach=brace?(strong?.415:.323):(strong?.405:.27)-fold*.067;
      solve(LIMB[s].arm,sign*reach,hipsY+(brace?(strong?.18:.275):(strong?.028:.126)),
        brace?fore*.17+(strong?.27:.15):.073+.20*fore,
        sign*.83,-.40,-.34);
      rot('hand_'+s,(brace?-.36:.11)+fore*.12,sign*.18,sign*(strong?.21:.37));curl(s,brace?.39:.14);
    }
    rot('spine_01',brace?.219:fore*.047,side*(brace?.13:.22),-side*.09);
    rot('spine_02',brace?.18:fore*.042,side*.122,side*.051);
    rot('spine_03',brace?.14:fore*.025,side*.12,-side*.063);
    rot('neck_01',brace?.11:fore*.08,-side*.18);
    rot('head',brace?-.13:fore*.09,side*.275,side*.14+(brace?.02:.07));
  }
  function reaction(point,fall,incoming,region='body'){
    setReacting(true);clock=0;
    const fromX=point.x-actor.position.x,fromZ=point.z-actor.position.z;
    side=fromX*cos(actor.rotation.y)-fromZ*sin(actor.rotation.y)<0?1:-1;
    flinchPitch=(incoming?.x??-fromX)*sin(actor.rotation.y)+(incoming?.z??-fromZ)*cos(actor.rotation.y);
    if(!fall){
      if(flinchLimb&&flinchLimb!==limbReactions[region])flinchLimb.quaternion.copy(limbBase);
      flinchRegion=region;flinchLimb=limbReactions[region];
      if(flinchLimb)limbBase.copy(flinchLimb.quaternion);
      if(falling)falling.active=false;
      for(const [b,out] of flinchBones)if(b)out.copy(b.quaternion);
      return;
    }
    const f=falling??=fallState();
    f.active=true;f.floor=fall.floor;f.fold=clamp((.94-fall.space)/.71);
    f.angle=mix(Math.PI*.493,.80,f.fold);f.recoil=Math.min(.28,Math.max(0,fall.space-.82)*.66);
    actor.updateWorldMatrix(true,false);f.m.copy(actor.matrixWorld).invert();
    const m=f.m.elements;f.actorScale=1/Math.hypot(m[4],m[5],m[6]);
    f.dir.set(fall.dx,0,fall.dz).transformDirection(f.m);
    f.dx=fall.dx;f.dz=fall.dz;f.heels=fall.heels;
    f.toe=Math.atan2(-fall.dx,-fall.dz);
    f.axis.set(f.dir.z,0,-f.dir.x);
    f.base=f.point.set(actor.position.x,fall.floor,actor.position.z).applyMatrix4(f.m).y;
    pelvis.getWorldPosition(f.startHip).applyMatrix4(f.m);
    f.pelvis.copy(pelvis.position);f.bodyAt.copy(body.position);f.bodyQ.copy(body.quaternion);
    f.duration=f.startHip.y-f.base<.46?1.09:1.33;
    for(const j of f.joints)j.start.copy(j.b.quaternion);
    fallKey(f,true);for(const j of f.joints)j.brace.copy(j.b.quaternion);
    fallKey(f,false);for(const j of f.joints){j.rested.copy(j.b.quaternion);j.b.quaternion.copy(j.start);}
    pelvis.position.copy(f.pelvis);body.position.copy(f.bodyAt);body.quaternion.copy(f.bodyQ);
  }
  function keepContacts(f,amount,settle){
    body.updateWorldMatrix(true,true);
    // Core support prevents the head or ribs from ending below the floor.
    const shoulder=bones.get('spine_03').matrixWorld,head=bones.get('head').matrixWorld;
    const headSupport=f.point.copy(eyeCenter).sub(read('head')).applyQuaternion(headBind).applyMatrix4(head).y;
    const lift=Math.max(0,f.floor+.115*size-shoulder.elements[13],f.floor+.085*size-headSupport);
    if(lift>.001){body.position.y+=lift/f.actorScale;body.updateWorldMatrix(true,true);}
    if(amount<.001)return;
    worldInverse.copy(body.matrixWorld).invert();
    f.up.set(0,1,0).transformDirection(worldInverse);
    for(const {chain,b,pad,side,leg} of f.contact){
      f.point.setFromMatrixPosition(b.matrixWorld);
      const clearance=(pad+(leg&&side>0?.022:0))*size;
      const def=f.floor+clearance-f.point.y;
      let tuck=0;
      if(leg){
        const behind=(f.point.x-actor.position.x)*f.dx+(f.point.z-actor.position.z)*f.dz;
        tuck=Math.max(0,-behind-f.heels-.19)*settle;
        f.point.x+=tuck*f.dx;f.point.z+=tuck*f.dz;
      }
      f.point.y+=def*(def>0?amount:settle);
      f.point.applyMatrix4(worldInverse);
      if(tuck>.004||Math.abs(def)>.008&&(def>0||settle>.001)){
        const up=leg?.99:.21;
        solve(chain,f.point.x,f.point.y,f.point.z,side*(leg?.26:.86)+f.up.x*up,
          f.up.y*up,f.up.z*up+(leg?.17:-.21));
      }
      if(leg&&settle>.001){
        b.parent.updateWorldMatrix(true,false);matrixQ(b.parent,inv).invert();
        f.ankleQ.copy(inv).multiply(q.setFromEuler(e.set(.035*side,f.toe+side*.24,.15*side)));
        b.quaternion.slerp(f.ankleQ,settle*.89);
      }
    }
  }
  const headBind=rest.get('head').axis.clone().invert();
  function reactionTick(dt,visible){
    if(!reacting||!dt)return false;
    clock+=dt;
    const f=falling;
    if(!f?.active){
      const head=flinchRegion==='head',k=clamp(clock/(head?.24:flinchLimb?.32:.28)),p=sin(Math.PI*k);
      for(const [j,[b,base]] of flinchBones.entries())if(b){
        const weight=head?(j===2?1.75:.48):flinchLimb?.48:1;
        b.quaternion.copy(base).multiply(q.setFromEuler(e.set((flinchPitch*.13+(head&&j===2?-.12:0))*p*weight,side*p*(.17-j*.028)*weight,side*p*.10*weight)));
      }
      if(flinchLimb)flinchLimb.quaternion.copy(limbBase).multiply(q.setFromEuler(e.set(
        p*(flinchRegion.startsWith('arm')?-.24:.14),0,p*side*.11)));
      if(k>=1)setReacting(false);
      return visible;
    }
    const t=Math.min(1,clock/f.duration),buckle=progress(.02,.37,t),drop=progress(.11,.71,t);
    const contact=Math.max(0,(t-.66)/.34),rebound=sin(contact*Math.PI*3)*Math.exp(-contact*5)*(1-contact);
    f.turnQ.setFromAxisAngle(f.axis,f.angle*drop+.068*rebound);
    body.quaternion.copy(f.turnQ).multiply(f.bodyQ);body.position.copy(f.bodyAt);
    pelvis.position.copy(f.pelvis).lerp(rest.get('pelvis').p,buckle);
    const hipFloor=f.base+mix(.146,.236,f.fold)/f.actorScale;
    f.hip.copy(f.startHip).addScaledVector(f.dir,(f.recoil*drop-.024*sin(buckle*Math.PI))/f.actorScale);
    f.hip.y=mix(f.startHip.y,hipFloor,progress(.035,.70,t))+.026*rebound/f.actorScale;
    for(const {b,start,brace,rested,delay} of f.joints){
      b.quaternion.copy(start).slerp(brace,progress(0,.39,t)).slerp(rested,progress(.35+delay,.91+delay,t));
    }
    pelvis.getWorldPosition(f.point).applyMatrix4(f.m);body.position.add(f.offset.copy(f.hip).sub(f.point));
    keepContacts(f,progress(.25,.68,t),progress(.59,.99,t));
    face(clock,2,0,0,0,0,.96*progress(.32,.77,t));
    if(t>=1){f.active=false;setReacting(false);}
    return visible;
  }
  const controllable=()=>!npcInfo||npcInfo.alive&&!npcInfo.reacting;
  const alive=()=>!npcInfo||npcInfo.alive;
  function costumeDepth(x,y,side=1){
    // One-time fittings against the bind-space garment, never per-frame raycasts.
    const ray=new T.Ray(V(x,y,side*2),V(0,0,-side));
    const a=V(),b=V(),c=V(),hit=V();let nearest=-Infinity;
    for(const mesh of meshes){
      if(!/^Cloth/.test(mesh.material.name))continue;
      const {attributes:{position:p},index}=mesh.geometry,length=index?.count??p.count;
      for(let i=0;i<length;i+=3){
        a.fromBufferAttribute(p,index?index.getX(i):i);
        b.fromBufferAttribute(p,index?index.getX(i+1):i+1);
        c.fromBufferAttribute(p,index?index.getX(i+2):i+2);
        if(ray.intersectTriangle(a,b,c,false,hit))nearest=Math.max(nearest,side*hit.z);
      }
    }
    return Number.isFinite(nearest)?nearest*side:null;
  }
  pose(0,0,0,0,0,0,.2);
  const rig={actor,pose,dance,altarWork,deskWork,archivePose,chartPose,wardSeat,visitorPose,factoryPose,tavernPose,festivalPose,greyPose,vialSocket:vialGrip?.socket,chairPose,tankPose,meditate,grip,walk,groundedY,npcInfo,reaction,reactionTick,isReacting,controllable,alive,
    // Fits authored costume overlays in the model's rest space, then carries
    // them with the selected bone. No assumptions about the bone's local axes.
    costumeMount(name){
      const bind=rest.get(name),mount=new T.Group();
      mount.quaternion.copy(bind.axis).invert();mount.position.copy(bind.at).negate().applyQuaternion(mount.quaternion);
      bones.get(name).add(mount);return mount;
    },
    restPoint(name){return read(name).clone();},costumeDepth,greyScalp,
    joint(name){return bones.get(name);},hitShapes,shadow(on){for(const m of meshes)m.castShadow=on;}};
  if(npcInfo)npcInfo.rig=rig;
  return rig;
}
