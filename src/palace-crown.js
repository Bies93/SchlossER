import {atticFittings} from './attic-fittings.js';
import {ATTIC_FLOOR as F,ATTIC_CEILING as C} from './palace-attic-layout.js';
import {CROWN_ROOMS,CRYPT_DOOR,HALL_WALL,DOOR_HALF,crownCampaign} from './crown-campaign.js';
import {createHuman,humansAvailable} from './human-character.js';
import {randomSource} from './surface-detail.js';

const PI=Math.PI,Z=8.62,SHELL=31.72;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>x*x*(3-2*x);

function campaignMap(T,parent,x,z){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const g=canvas.getContext('2d'),rand=randomSource(846),blue='#667a7b',paper='#c5b994';
  g.fillStyle=paper;g.fillRect(0,0,1024,512);
  for(let i=0;i<3800;i++){
    g.fillStyle=i%3?'#734b362c':'#f5edc64d';g.fillRect(rand()*1024,rand()*512,1+rand()*4,1+rand()*2);
  }
  const line=(a,color,width=2)=>{g.beginPath();g.strokeStyle=color;g.lineWidth=width;a.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
  const label=(s,x,y,c='#283839',size=25)=>{
    g.font='bold '+size+'px monospace';g.fillStyle=c;g.fillText(s,x,y);
  };
  g.fillStyle='#829375';g.fillRect(539,117,364,254);
  g.fillStyle='#a09c8b';g.fillRect(230,214,263,158);
  g.strokeStyle=blue;g.lineWidth=3;g.strokeRect(31,30,962,452);
  for(let n=0;n<15;n++){
    const a=47+n*61;line([[a,111],[a,414]],'#6d7f794d',1);
  }
  for(let n=0;n<6;n++)line([[48,127+n*52],[975,127+n*52]],'#6d7f794d',1);
  line([[136,125],[166,195],[170,320],[202,432]],'#4d6b71',11);
  line([[354,405],[347,301],[391,237],[485,147],[606,153],[775,138],[928,184]],'#e3d7b0',13);
  line([[548,317],[640,277],[728,324],[855,294],[925,258]],'#e3d7b0',12);
  line([[623,119],[614,189],[667,223],[724,282],[742,365]],'#e3d7b0',9);
  g.fillStyle='#51564d';g.fillRect(497,196,68,136);g.fillRect(465,241,130,49);
  g.globalAlpha=.58;g.fillStyle='#88322c';g.beginPath();
  [[424,143],[600,171],[678,252],[610,356],[466,353],[427,278]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.fill();g.globalAlpha=1;
  g.setLineDash([12,8]);line([[78,366],[284,306],[445,275],[542,250],[650,264],[902,350]],'#822e2e',5);
  g.setLineDash([]);
  for(const [x,y] of [[263,303],[504,264],[720,261],[878,337]]){
    g.strokeStyle='#642e28';g.lineWidth=4;g.beginPath();g.arc(x,y,17,0,PI*2);g.stroke();
    line([[x-12,y-14],[x+12,y+14]],'#642e28',3);line([[x+12,y-14],[x-12,y+14]],'#642e28',3);
  }
  label('ERLANGEN · KRONENPROJEKTION',51,85,'#293c39',33);
  label('MARKT',239,260);label('SCHLOSS',471,209);label('GARTEN',757,205);
  label('ROT: „WIRD ZUSTIMMEN“   /   STRICHE: NUR IM PROBEFILM',53,452,'#642e28',22);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const sheet=new T.Mesh(new T.PlaneGeometry(3.84,1.62),new T.MeshStandardMaterial({map:texture,roughness:.88}));
  sheet.name='Schematische Besetzungskarte · Requisite';sheet.rotation.x=-PI/2;
  sheet.position.set(x,F+1.02,z);sheet.userData.noSceneQuery=true;parent.add(sheet);
}

export function dressCrown(T,root,world){
  const {builder,finish,m}=atticFittings(T,F),game=crownCampaign(),s=game.s;
  const builders=[],targets=[],actors=[],anim={},random=randomSource(356109);
  const create=(name,obstacles=false,parent=root)=>{
    const g=new T.Group();g.name='Schwarze Krone · '+name;parent.add(g);
    const b=builder(g,obstacles?world:null);builders.push(b);return b;
  };
  const hall=create('Säulengang und Verteiler',true);
  const A=(id,x,y,z,r=2.15)=>{targets.push({id,action:'crown',x,y:F+y,z,r});};
  const npc=(id,b,x,z,yaw,pose='stand',lift=0)=>{
    if(!humansAvailable(T))return;
    const rig=createHuman(T,id);rig.actor.position.set(x,F+lift,z);rig.actor.rotation.y=yaw;
    const state={rig,x,z,pose,t:random()*31,at:-Infinity,talkUntil:0};
    if(rig.npcInfo)rig.npcInfo.speak=seconds=>{if(seconds>0)state.talkUntil=performance.now()+seconds*1000;};
    b.parent.add(rig.actor);actors.push(state);
  };
  function wall(b,x,z,w,d,skin='chalk'){
    b.box(skin,x,(C-F)*.5,z,w,C-F,d);b.hit(x,z,w,d);
    if(w>d){
      for(const q of [-1,1]){
        b.box('coating',x,.496,z+q*(d/2+.027),w,.963,.047);
        b.box('metal',x,.984,z+q*(d/2+.029),w,.034,.049);
        b.box('blackwood',x,.054,z+q*(d/2+.031),w,.107,.054);
      }
    }else for(const q of [-1,1])b.box('coating',x+q*(w/2+.024),.49,z,.043,.954,d);
  }
  function controls(b,x,z,w=1.46,key='slate'){
    b.shape('black','block',x,.39,z,w*.89,.78,.77);
    b.shape(key,'block',x,.97,z,w,.37,.89,-.12);
    b.box('nickel',x,.791,z,w-.07,.033,.87);
    for(let i=0;i<7;i++){
      b.shape(i%3?'ivory':'red','block',x+(i-3)*w*.111,1.151,z+.207,.051,.038,.059);
      if(i<4)b.shape('black','tube',x+(i-1.5)*.14,1.148,z-.14,.027,.059,.027);
    }
    b.hit(x,z,w,.83);
  }
  function crate(b,x,y,z,w=1,d=.63){
    b.shape('olive','block',x,y+.248,z,w,.45,d);
    b.box('metal',x,y+.491,z,w+.03,.046,d+.03);
    for(const u of [-1,1])for(const q of [-1,1]){
      b.box('black',x+u*(w/2-.084),y+.258,z+q*(d/2+.004),.067,.407,.020);
      b.box('brass',x+u*(w/2-.084),y+.434,z+q*(d/2+.017),.059,.077,.024);
    }
    b.plate(x,y+.265,z+d/2+.008,w*.51,.146,0,'KRONE',['NICHT STÜRZEN'],1,'KISTE 9');
  }
  function shelf(b,x,z,w=.96){
    const d=.43;
    for(const u of [-1,1])for(const q of [-1,1])
      b.box('metal',x+u*(w/2-.036),1.02,z+q*d/2,.053,2.04,.053);
    for(const y of [.22,.81,1.39,1.98]){
      b.box('slate',x,y,z,w,.055,d+.08);
      b.box('nickel',x,y+.013,z+d/2+.051,w,.026,.024);
    }
    b.hit(x,z,w,d+.08);
  }
  function cab(b,x,z,yaw=0){
    const dir=yaw? -1:1;
    b.shape('coating','block',x,1.03,z,.71,2.01,.49);
    b.shape('slate','block',x,1.03,z+dir*.257,.646,1.91,.047,0,yaw);
    for(let i=0;i<5;i++)b.box('black',x,1.80-i*.058,z+dir*.284,.42,.017,.012);
    b.framed(x,1.347,z+dir*.283,.392,.141,yaw,'LUDWIG',['WECHSELWÄSCHE'],1);
    b.rod('nickel',[x+.187,1.05,z+dir*.305],[x+.187,.87,z+dir*.305],.016);
    b.hit(x,z,.71,.50);
  }
  function blood(b,x,z,w,d,seed){
    // One irregular, floor-hugging decal per stain; no coincident triangles.
    const offset=seed*.981,N=24;
    const point=j=>{
      const a=j*PI*2/N,r=.66+.12*Math.sin(a*5+offset)+.15*Math.cos(a*3+offset)+.041*Math.sin(a*16);
      return [x+Math.cos(a)*r*w,F+.019,z+Math.sin(a)*r*d];
    };
    const uv=p=>[(p[0]-x)/w+.5,(p[2]-z)/d+.5];
    for(let i=0;i<N;i++){
      const A=point(i+1),B=point(i);b.k.triangle('dried',[x,F+.019,z],A,B,[.5,.5,...uv(A),...uv(B)]);
    }
    for(let i=0;i<8;i++){
      const a=i*2.3996+offset,r=.89+random()*.44;
      b.shape(i%3?'dried':'smear','sphere',x+w*r*Math.cos(a),.018,z+d*r*Math.sin(a),
        .021+random()*.056,.003,.024+random()*.043);
    }
  }
  function drone(b,x,y,z,size=1){
    const W=.91*size,D=.49*size;
    b.shape('olive','block',x,y,z,W,.245*size,D);
    b.shape('slate','block',x,y+.15*size,z,W*.86,.10*size,D*.88);
    b.shape('black','block',x,y-.048*size,z+D*.52,W*.53,.151*size,.094*size);
    for(const a of [-1,1])b.shape('red','tube',x+a*.147*size,y-.048*size,z+D*.638,.044*size,.035*size,.044*size,PI/2);
    for(const a of [-1,1])for(const q of [-1,1]){
      const X=x+a*.79*size,Q=z+q*.49*size,Y=y+.065*size;
      b.rod('metal',[x+a*.21*size,y,z+q*.16*size],[X,Y,Q],.061*size);
      b.shape('black','tube',X,Y,Q,.10*size,.12*size,.10*size);
      b.shape('nickel','ring',X,Y,Q,.295*size,.295*size,.252*size,PI/2);
      b.shape('slate','block',X,Y+.038*size,Q,.47*size,.023*size,.064*size,0,q*.55);
      b.rod('metal',[x+a*.27*size,y-.10*size,z+q*.19*size],[x+a*.34*size,y-.22*size,z+q*.232*size],.027*size);
    }
  }
  function cage(b,x,z,w,d){
    b.shape('metal','block',x,.067,z,w,.127,d);
    b.shape('metal','block',x,2.64,z,w,.170,d);
    b.shape('green','block',x,2.52,z,w*.66,.05,d*.54);
    for(const a of [-1,1])for(const q of [-1,1])
      b.rod('coating',[x+a*(w/2-.035),.08,z+q*(d/2-.035)],[x+a*(w/2-.035),2.64,z+q*(d/2-.035)],.044);
    for(const a of [-1,1]){
      b.glazes(x,1.31,z+a*(d/2-.035),w-.14,2.39,.025);
      b.glazes(x+a*(w/2-.035),1.31,z,.023,2.39,d-.14);
      b.box('nickel',x,1.18,z+a*(d/2-.019),w,.043,.040);
    }
    b.hit(x,z,w,d);
  }
  function pod(b,x,z,r,band='olive'){
    const height=2.26,y=.27,mid=y+height*.5;
    for(const floor of [y-.147,y+height+.052]){
      b.shape('metal','tube',x,floor,z,r+.143,.258,r+.143);
      b.shape(band,'tube',x,floor+.095,z,r+.168,.099,r+.168);
      b.shape('nickel','ring',x,floor-.076,z,r+.10,r+.10,.30,PI/2);
      for(let i=0;i<8;i++){
        const a=i*PI/4;
        b.shape('brass','tube',x+Math.sin(a)*(r+.094),floor+.154,z+Math.cos(a)*(r+.094),.019,.036,.019);
      }
    }
    const glass=new T.Mesh(new T.CylinderGeometry(r,r,height,25,1,true),m.glass);
    glass.position.set(x,F+mid,z);glass.userData.noSceneQuery=true;b.parent.add(glass);
    b.shape('green','tube',x,y+height-.075,z,r*.79,.048,r*.79);
    for(const a of [-1.18,1.18,3.14]){
      const u=x+Math.sin(a)*(r+.036),v=z+Math.cos(a)*(r+.036);
      b.rod('metal',[u,y-.03,v],[u,y+height+.09,v],.027);
      b.shape('black','tube',u,mid,v,.037,.24,.037);
    }
    b.hit(x,z,(r+.13)*2,(r+.13)*2);
  }
  function mural(b,x,z,rot,headline,lines,theme=2,tag='KÖNIGLICHE NACHTLOGE'){
    const a=Math.abs(z)+.029;
    if(a<8.637)b.box('blackwood',x,2.33,Math.sign(z)*(a+8.64)/2,2.13,.78,8.64-a);
    b.framed(x,2.33,z,2.24,.91,rot,headline,lines,theme,tag);
  }
  for(const room of CROWN_ROOMS){
    const {min,max,side,door,id,name}=room,rot=side<0?0:PI,
      x=(min+max)/2,b=create(name,true),mark=side*HALL_WALL;
    for(const [a,c] of [[min+.037,door-DOOR_HALF],[door+DOOR_HALF,max-.037]]){
      wall(b,(a+c)/2,mark,c-a,.15,id==='clinic'?'slate':'chalk');
    }
    b.box('chalk',door,3.13,mark,DOOR_HALF*2,1.35,.15);
    b.box('metal',door,2.48,mark,1.93,.106,.27);
    for(const q of [-1,1]){
      b.box('metal',door+q*.884,1.23,mark,.092,2.46,.243);
      b.box('brass',door+q*.887,.197,mark,.111,.119,.253);
    }
    b.box('nickel',door,.006,mark,1.72,.008,.28);
    b.framed(door,2.76,mark-.138*side,1.68,.31,rot,name.toUpperCase(),[],id==='clinic'?4:0);
    if(max<29.01&&Math.abs(max-10.65)>.2)
      wall(b,max,side*(HALL_WALL+Z)/2,.143,Z-HALL_WALL-.035);
    if(max>29)wall(b,29.06,side*(HALL_WALL+Z)/2,.138,Z-HALL_WALL-.035);
    b.roofLamp(x,side*5.05,3.11,id==='clinic'?'red':id==='hatchery'?'green':'bulb');
    if(id!=='mess')for(const y of [3.12,3.269]){
      b.rod(y<3.2?'rust':'metal',[min+.24,y,side*7.96],[max-.24,y,side*7.96],.024);
      for(let u=min+.69;u<max-.48;u+=1.78)b.box('nickel',u,y,side*7.96,.065,.080,.071);
    }
    b.runner(x,side*5.48,Math.min(max-min-.84,7.25),4.58,['war','mess'].includes(id)?'carpet':'canvas');
    if(id==='crates'){
      mural(b,x,side*8.40,rot,'DER HOF BRAUCHT PLATZ',['KRONENGUT · ZIELE NICHT MITLIEFERN']);
      for(const j of [-1,0,1]){
        const u=x+j*1.79;shelf(b,u,-7.68,1.49);
        for(const y of [.256,.846,1.426])crate(b,u,y,-7.68,1.13,.515);
      }
      for(const [j,u] of [x-2.32,x+2.34].entries()){
        for(let k=0;k<2+j;k++)crate(b,u,k*.516,-4.89,1.19,.76);
        b.hit(u,-4.89,1.19,.76);
      }
      b.table(x,-5.35,1.67,.79,.91);b.papers(x-.16,.912,-5.33);b.shape('red','tube',x+.42,1.03,-5.29,.059,.209,.059);
      A('crates',x,.98,-4.92);
    }else if(id==='hatchery'){
      mural(b,x,-8.38,0,'DAS LAND BRAUCHT ERBEN',['KEINE MUTTER. KEINE RÜCKGABE.'],3,'BRUTRING · S-17');
      for(const [i,u] of [x-2.66,x,x+2.66].entries()){
        pod(b,u,-7,.655,i===1?'oxblood':'olive');
        for(const a of [-1,1])b.rod('rust',[u+a*.63,2.65,-7.03],[u+a*.63,3.42,-7.71],.037);
        b.framed(u,.375,-6.31,1.02,.235,0,'LUDWIG '+(17+i),[i===1?'HÖRT MIT':'ERSATZ'],3);
        npc(['crownSleeper17','crownFlesh','crownSleeper19'][i],b,u,-7.03,.06,i===1?'tank':'dummy',.267);
      }
      controls(b,x,-4.65,1.52,'olive');
      anim.tankPanel=b.screen(x,1.37,-4.62,1.00,.35,0,'BRUTRING',['DREIMAL GEKLONTE HOFFNUNG']);
      A('mark',x,1.36,-4.13,2.22);
    }else if(id==='drone'){
      mural(b,x,-8.43,0,'DER SCHWARM LIEBT DICH',['ER KENNT SONST NIEMANDEN.'],0,'VORFÜHRHALLE K–4');
      for(const u of [x-2.82,x+3.14]){
        b.table(u,-6.89,2.09,1.25,.89,'coating');drone(b,u,1.14,-6.89,.72);
        b.shape('black','block',u+.75,1.05,-6.64,.261,.140,.245);
        b.hit(u,-6.89,2.10,1.16);
      }
      b.shape('slate','block',x,.079,-6.55,2.91,.151,2.69);
      for(const a of [-1,1])for(const q of [-1,1])
        b.shape('red','tube',x+a*1.22,.164,-6.55+q*1.13,.063,.045,.063);
      const live=create('Vorführdrohne',false,b.parent);drone(live,0,0,0,.89);
      // Geometry is authored at F; only the dynamic parent offsets it.
      live.parent.position.set(x,1.39,-6.55);live.parent.userData.noSceneQuery=true;
      anim.drone={obj:live.parent,x,z:-6.55};
      controls(b,x-2.86,-4.25,1.23);A('drone',x-2.86,1.28,-3.77);
      npc('crownDrone',b,x+2.76,-5.49,PI,'work');
    }else if(id==='war'){
      mural(b,x,-8.44,0,'ERLANGEN FÄLLT NACH DER TAGESSCHAU',['SENDESCHLUSS IST KEINE KAPITULATION.'],2,'OPERATION FERNGESTEUERT');
      b.table(x,-5.88,4.22,1.91,.94);
      b.shape('black','block',x,.980,-5.88,3.97,.07,1.74);
      campaignMap(T,b.parent,x,-5.88);
      for(let i=0;i<13;i++){
        const a=x+(random()-.5)*3.51,z=-6.10+(random()-.5)*1.13;
        b.shape(i<5?'red':'cream','tube',a,1.035,z,.042,.031,.042);
      }
      b.papers(x+1.51,.946,-4.90,.12);A('war',x,1.09,-4.84);
      for(const u of [x-2.78,x+2.79]){
        controls(b,u,-7.11,1.28,'olive');
        b.screen(u,1.52,-7.04,1.07,.51,0,u<x?'KARTE':'RÜCKKANAL',[u<x?'KORREKTUR OFFEN':'ANTWORT: KEINE']);
      }
      npc('crownMarshal',b,x+.61,-7.32,0,'work');
    }else if(id==='broadcast'){
      mural(b,x,8.39,PI,'STIMME DER KRONE',['KLATSCHEN BEGINNT VOR DEM ERSTEN SATZ.'],3,'STUDIO / RÜCKKANAL');
      b.table(x,6.00,3.42,1.04,1.01,'slate');
      b.reel(x-.97,1.019,5.94,-1,1.44);b.reel(x+.93,1.019,5.94,-1,1.44);
      for(let i=0;i<13;i++){
        b.box('black',x+(i-6)*.063,1.023,5.622,.029,.015,.161);
        b.box(i%4?'ivory':'red',x+(i-6)*.063,1.04,5.62+Math.sin(i*2)*.039,.047,.022,.049);
      }
      b.framed(x,1.84,6.25,1.95,.37,PI,'BEIFALL A / BEIFALL B',[],4);
      A('broadcast',x-.97,1.49,5.61);
      controls(b,x+2.67,4.39,1.31,'oxblood');
      anim.track=b.screen(x+2.67,1.54,4.24,1.01,.43,PI,'JUBELKANAL',['RÜCKLEITUNG ZUM THRON'],4);
      A('cut',x+2.67,1.45,3.88);
      for(const X of [x-2.79,x+2.69])for(let i=0;i<5;i++)
        b.box(i%2?'canvas':'black',X,1.72+i*.22,7.75,.77,.153,.22);
      npc('crownVoice',b,x+.54,6.87,PI,'work');
    }else if(id==='barracks'){
      mural(b,x,8.42,PI,'SCHLAF IST MANNSTÄRKE',['ZWEI MANN PRO BETT. EINER DAVON BIST DU.'],0,'KASERNE DER ERBEN');
      for(const u of [x-2.79,x-.92,x+.94,x+2.78]){
        for(const y of [.54,1.56]){
          b.shape('metal','block',u,y,6.68,1.06,.125,2.00);
          b.shape('cloth','block',u,y+.103,6.67,.93,.12,1.88);
          b.shape('cream','block',u,y+.219,7.30,.76,.13,.414);
          b.shape('canvas','block',u,y+.183,6.36,.97,.085,1.18);
          for(const a of [-1,1])b.box('nickel',u+a*.47,y+.12,5.67,.049,.235,.067);
        }
        for(const a of [-1,1])for(const q of [-1,1])
          b.rod('coating',[u+a*.497,.05,6.68+q*.977],[u+a*.497,1.89,6.68+q*.977],.031);
        b.hit(u,6.68,1.07,2.03);
      }
      for(const u of [x-2.80,x-1.98,x+2.81])cab(b,u,4.32,PI);
      b.table(x,4.44,1.31,.67,.88);b.papers(x,.887,4.45);A('locker',x,.97,4.03);
    }else if(id==='clinic'){
      mural(b,x,8.44,PI,'BEICHTE OHNE GNADE',['DIE KRONE VERGIBT KEINE HERKUNFT.'],4,'NACHTSCHICHT');
      b.chair(x-.61,6.27,PI,{uphol:'black',arms:true,seat:.56});
      b.shape('metal','block',x-.61,.125,6.27,.88,.246,1.03);
      b.shape('rust','block',x-.61,.835,6.52,.49,.059,.052);
      blood(b,x-.61,6.16,.89,.82,9);
      blood(b,x-.95,5.23,.57,1.39,13);
      cage(b,x+2.29,6.80,1.93,1.72);
      b.chair(x+2.29,6.82,PI,{uphol:'slate'});
      b.framed(x+2.29,1.50,5.908,1.23,.263,PI,'NUR TONSPUR',[],4);
      A('cage',x+2.29,1.53,5.82);
      npc('crownWitness',b,x+2.29,6.82,PI,'seat');
      b.table(x-3.40,6.21,1.48,.65,.89,'metal');
      b.papers(x-3.45,.896,6.08,-.08);
      b.shape('nickel','block',x-3.41,.919,6.40,1.11,.055,.28);
      for(let j=0;j<4;j++)b.shape(j%2?'oxblood':'coating','tube',x-3.81+j*.24,1.06,6.42,.066,.224,.066);
      b.shape('ivory','block',x-2.98,2.49,5.19,.96,.056,.39,.24);
      b.rod('metal',[x-2.98,2.52,5.19],[x-2.98,3.55,5.42],.039);
      npc('crownMedic',b,x-3.41,5.56,0,'work');
    }else if(id==='mess'){
      mural(b,x,8.43,PI,'HAUS KRONE',['DEIN BIER IST FREI. DU NICHT.'],2,'OFFIZIERE / GEÖFFNET BIS SIEG');
      b.shape('blackwood','block',x, .56,7.39,5.60,1.04,.91);
      b.shape('lacquer','block',x,1.12,7.38,5.81,.123,1.01);
      b.hit(x,7.39,5.60,.90);
      for(let i=0;i<5;i++)b.shape('oak','block',x+(i-2)*1.001,.566,6.919,.924,.79,.044);
      for(let j=0;j<6;j++){
        const u=x+(j-2.5)*.68;b.shape('cream','tube',u,1.279,7.06,.086,.182,.086);
        b.shape('brass','ring',u+.11,1.282,7.06,.055,.059,.041);
      }
      b.rod('brass',[x,1.17,7.52],[x,1.56,7.52],.055);
      b.rod('brass',[x,1.54,7.52],[x,1.54,7.22],.031);A('mess',x,1.54,6.84,2.31);
      for(const u of [x-1.87,x+1.87]){
        b.table(u,4.82,1.19,.81,.91,'lacquer');
        b.chair(u,3.98,0);b.chair(u,5.61,PI);
        b.papers(u,.914,4.82);
      }
      npc('crownQuartermaster',b,x+1.87,5.57,PI,'seat');
    }
  }

  // Axial route remains open to the stairs. West of the original arch, the
  // throne occupies the complete old hall and hides the final space behind it.
  hall.runner(9.20,0,37.93,1.78);
  hall.framed(30.40,2.26,-8.617,1.78,.59,0,'SCHWARZE KRONE',['KEIN BESUCHERFLÜGEL'],2);
  hall.framed(29.155,1.66,2.76,1.48,.55,PI/2,'SCHLOSS ERLANGEN',['WEST  ·  THRON','OST  ·  BRUT / ZEUGKAMMER'],0);
  for(const side of [-1,1]){
    for(const x of [30.25,31.22]){
      crate(hall,x,0,side*4.51,.82,.67);crate(hall,x,.516,side*4.51,.82,.67);
      hall.hit(x,side*4.51,.82,.69);
    }
    if(side>0)hall.framed(30.45,2.30,side*8.618,1.48,.45,PI,'NACHRÜCKLAGER',['STAPELN, NICHT ZÄHLEN'],0);
  }
  for(const x of [24.8,17.8,7.8,-3.1,-9.22]){
    hall.rod('metal',[x,3.35,-1.54],[x,3.35,1.54],.041);
    hall.roofLamp(x,.02);
  }
  for(const x of [20.97,10.27,.51,-10.17])for(const q of [-1,1]){
    hall.shape('redCloth','block',x,2.18,q*1.929,.48,1.36,.037);
    hall.rod('brass',[x-.33,2.878,q*1.875],[x+.33,2.878,q*1.875],.031);
    hall.framed(x,2.30,q*1.901,.424,.365,q<0?0:PI,'♛',['KRONE'],2);
  }
  const throne=create('Saal der Letzten Krönung',true);
  throne.runner(-17.41,0,12.68,2.48);
  for(const z of [-8.618,8.618]){
    throne.framed(-17.37,2.47,z,3.48,1.28,z<0?0:PI,'KNIET, WENN IHR KÖNNT',['SITZEN IST DEM KÖNIG VORBEHALTEN.'],2,'DIE SCHWARZE KRONE');
    for(const x of [-13.2,-15.95,-18.70,-21.45]){
      throne.chair(x,z*.39,z<0?0:PI,{arms:true});
      throne.roofLamp(x,z*.67,3.11,'red');
    }
  }
  throne.shape('blackwood','block',-21.44,.12,0,2.14,.23,3.39);
  throne.shape('oak','block',-21.89,.262,0,1.93,.065,2.92);
  world.platform(-22.50,-1.69,-20.38,1.69,F+.235);
  world.platform(-22.85,-1.45,-20.92,1.45,F+.294);
  const throneY=.70,tx=-21.90;
  throne.shape('blackwood','block',tx,throneY,-.018,1.12,.43,1.43);
  throne.shape('carpet','block',tx+.127,throneY+.235,0,.89,.124,1.07);
  throne.shape('oak','block',tx-.54,1.64,0,.203,1.97,1.34,0,0,-.055);
  throne.shape('redCloth','block',tx-.420,1.65,0,.073,1.61,1.11,0,0,-.055);
  for(const a of [-1,1]){
    throne.rod('brass',[tx-.446,1.21,a*.552],[tx-.552,2.62,a*.552],.038);
    throne.shape('brass','sphere',tx-.56,2.73,a*.552,.096,.137,.096);
    throne.shape('lacquer','block',tx+.10,1.13,a*.614,.862,.122,.137);
    throne.shape('brass','sphere',tx+.51,1.18,a*.614,.095,.08,.09);
  }
  throne.hit(tx,0,1.5,1.45);
  for(let i=0;i<6;i++){
    const z=(i%3-1)*.29,y=1.28+Math.floor(i/3)*.35;
    throne.shape('brass','sphere',tx-.346-(y-1.25)*.054,y,z,.035,.021,.021);
  }
  // Use the six angled bars as a broken crown rather than a literal
  // real-world insignia. The matching glyph doubles as a puzzle affordance.
  function crest(b,x,y,z,s=1){
    const pts=[[-.55,.20],[-.42,-.17],[.42,-.17],[.56,.20],[.23,.02],[0,.37],[-.21,.021],[-.55,.20]];
    for(let j=1;j<pts.length;j++){
      const [a,h]=pts[j-1],[c,k]=pts[j];
      b.rod('brass',[x,y+h*s,z+a*s],[x,y+k*s,z+c*s],.021*s);
    }
    b.shape('red','sphere',x,y+.046*s,z,.035*s,.072*s,.065*s);
  }
  crest(throne,tx-.249,2.38,0,.81);
  for(const z of [-4.45,4.45])crest(throne,-23.88,2.29,z,1.18);
  throne.framed(-23.83,1.55,-2.48,1.45,.254,PI/2,'DIE KRONE GIBT NACH',[],4);
  for(const [a,b] of [[-Z,-.95],[.95,Z]])
    wall(throne,CRYPT_DOOR,(a+b)*.5,.198,b-a,'slate');
  throne.box('slate',CRYPT_DOOR,3.23,0,.198,1.18,1.91);
  const gate=create('Verdeckter Kronenriegel',false,throne.parent);
  gate.box('blackwood',CRYPT_DOOR,1.314,0,.19,2.620,1.90);
  gate.box('metal',CRYPT_DOOR+.105,1.314,0,.047,2.51,1.79);
  crest(gate,CRYPT_DOOR+.145,1.56,0,1.19);
  for(const z of [-.84,.84])gate.box('brass',CRYPT_DOOR+.14,1.29,z,.023,2.52,.028);
  gate.parent.userData.movingOccluder=true;
  anim.gate=gate.parent;
  world.box(CRYPT_DOOR-.10,-.96,CRYPT_DOOR+.12,.96,()=>anim.open<.87);
  A('gate',CRYPT_DOOR+.176,1.58,.77,2.35);

  const crypt=create('Das Echo unter der Krone',true);
  crypt.runner(-27.86,0,7.13,3.12,'canvas');
  crypt.roofLamp(-28.13,-1.06,3.08,'red');crypt.roofLamp(-30.43,2.52,3.08,'red');
  crypt.framed(-31.62,2.63,0,3.60,.98,PI/2,'KEIN KÖNIG',['NUR DIE STIMME. NUR NOCH DIE STIMME.'],4,'AUSGABE NR. 01');
  const cx=-29.53;
  pod(crypt,cx,-2.81,.89,'oxblood');
  for(const z of [-6.87,6.87]){
    for(const x of [-29.93,-27.88,-25.83]){
      crypt.shape('slate','block',x,1.44,z,1.30,2.58,.702);
      crypt.shape('black','block',x,1.57,z-Math.sign(z)*.375,1.08,1.71,.091);
      for(let i=0;i<11;i++)crypt.box('metal',x,2.247-i*.124,z-Math.sign(z)*.433,.937,.028,.045);
      crypt.hit(x,z,1.32,.75);
    }
  }
  for(const j of [-1,0,1]){
    for(let i=0;i<5;i++){
      const x=-24.61-i*.96;
      crypt.rod(j%2?'brass':'rust',[x,3.27,j*.29],[x-.97,3.27,j*.29],.034);
    }
  }
  npc('crownEcho',crypt,cx,-2.76,.38,'tank',.267);
  controls(crypt,-28.45,2.55,1.78,'oxblood');
  anim.echo=crypt.screen(-28.45,1.63,2.63,1.18,.47,0,'STIMME 01',['KORPUS NICHT GEFUNDEN'],4);
  crypt.reel(-29.91,1.01,2.81,1,1.25);
  crypt.table(-30.02,2.84,1.14,.84,1.00,'slate');
  blood(crypt,-28.68,-1.11,.67,.82,23);blood(crypt,-29.40,-1.24,.75,.49,14);
  A('engine',-28.45,1.59,3.05,2.29);
  finish(builders);
  anim.open=0;

  function target(p,look,blocked){
    const eye=p.y+1.67;
    let best=null,score=.42;
    for(const o of targets){
      if(o.id==='engine'&&!s.crypt)continue;
      const dx=o.x-p.x,dz=o.z-p.z,dy=o.y-eye,d=Math.hypot(dx,dy,dz);
      if(d>o.r||d<.025)continue;
      const dot=(dx*look.x+dy*look.y+dz*look.z)/d,rank=dot-d*.095;
      if(dot<.59||rank<score||blocked?.(o))continue;
      score=rank;best=o;
    }
    if(best)best.label=game.label(best.id);
    return best;
  }
  function update(now,p,inside){
    let changed=false;
    const active=inside||anim.open>0;
    if(active&&s.crypt&&anim.open<1){
      anim.gateAt??=now;
      anim.open=clamp((now-anim.gateAt)/1040);
      anim.gate.position.z=-2.08*smooth(anim.open);anim.gate.visible=anim.open<.992;changed=true;
    }
    anim.track.set(s.cut?'LEITUNG TOT':'JUBELKANAL',[s.cut?'KRONENRIEGEL STROMLOS':'RÜCKLEITUNG ZUM THRON']);
    anim.tankPanel.set(s.marked?'LUDWIG 18':'BRUTRING',[s.marked?'BIOLOGISCHER WIDERSPRUCH':'DREIMAL GEKLONTE HOFFNUNG']);
    if(!inside)return changed;
    if(Math.abs(p.x+28.45)<9&&p.x<CRYPT_DOOR+.5){
      const intensity=s.sermon>now?.24+.16*Math.sin(now*.017)**2:.22;
      if(anim.echo.mat.emissiveIntensity!==intensity){anim.echo.mat.emissiveIntensity=intensity;changed=true;}
    }
    const d=anim.drone,t=now*.001,flight=clamp((s.preview-now)/5100),
      wave=flight>0?Math.sin(flight*PI):0;
    if(Math.abs(d.x-p.x)<13&&p.z<.4&&(wave>0||d.obj.position.y!==1.39)){
      d.obj.position.set(d.x+Math.sin(t*3.21)*wave*.48,1.39+wave*.52,d.z+wave*.79);
      // Rotate around the physical hull, not around the floor's world origin.
      d.obj.rotation.y=Math.sin(t*1.61)*wave*.38;changed=true;
    }
    for(const a of actors){
      const dist=Math.hypot(a.x-p.x,a.z-p.z),rig=a.rig;
      if(dist>12.2||!rig.controllable()||now-a.at<42||a.pose==='dummy'&&Number.isFinite(a.at))continue;
      a.at=now;const u=t+a.t;
      const talking=now<a.talkUntil?.58:0;
      if(a.pose==='seat')rig.chairPose(u,.48,1,.20*Math.sin(u*.68),talking);
      else if(a.pose==='tank'){
        const progress=1-clamp((s.hatch-now)/4300),reach=a.rig.npcInfo?.id==='crownFlesh'?Math.sin(progress*PI)**2:0;
        rig.tankPose(u,reach,.16*Math.sin(u*1.3),talking);
      }
      else if(a.pose==='dummy')rig.chairPose(.38,.48,0,-.11);
      else rig.deskWork(u,'registry',.18*Math.sin(u*.71),talking);
      changed=true;
    }
    anim.echo.set(s.heard?'PROBE 01':'STIMME 01',[s.heard?'DER KÖNIG IST EINE TONSPUR':'KORPUS NICHT GEFUNDEN']);
    return changed;
  }
  const lightProfile=p=>{
    if(p.x<CRYPT_DOOR+.3)return {x:-28.46,z:p.z*.43,color:0xe68a75};
    if(p.x< -10.70)return {x:-18.09,z:p.z*.47,color:0xeb9879};
    const room=Math.abs(p.z)>HALL_WALL&&CROWN_ROOMS.find(r=>r.side*p.z>0&&p.x>=r.min&&p.x<r.max);
    return room?{x:(room.min+room.max)*.5,z:room.side*5.13,color:room.color}:
      {x:Math.min(29.7,p.x),z:-.76,color:0xffd7ab};
  };
  return {target,update,lightProfile,use(id,now){return game.use(id,now);}};
}
