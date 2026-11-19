import {LAB} from './lab-layout.js';
import {randomSource} from './surface-detail.js';

const Y=LAB.floor,pi=Math.PI,flat=-pi/2;

/** Index faces share the same atlas, so 100+ small binders are a handful
 * of room material batches, rather than 100 WebGL draw calls. */
export function fileRacks(kit,art){
  const {k,hit,dress,root}=kit,{housing,rod,fastener}=dress,r=randomSource(170612);
  const cover=['fileLinen','bookC','darkWood','green','leather','copperDark'];
  const put=(...args)=>housing(args[0],args[1],Y+args[2],...args.slice(3));
  function tags(P,side,index,w,h,y,d){
    art.tab(root,index,(s,t)=>P((s-.5)*w,y+h*t,d),side);
  }
  function locker(x,z,side,rack){
    const d=3.43,ends=[-.5*d+.025,.5*d-.025],rows=[.206,.712,1.211,1.704,2.302];
    const P=(s,y,l)=>[x+side*l,Y+y,z-side*s],solid=(m,a,b,c,d,f,g)=>k.box(m,P,a,b,c,d,f,g);
    for(const t of ends)for(const face of [-.336,.338]){
      solid('gunmetal',t-.028,t+.028,.061,2.324,face-.024,face+.024);
      solid('edge',t-.021,t-.010,.100,2.308,face-.025,face-.013);
      solid('rust',t-.048,t+.046,.017,.071,face-.052,face+.054);
      for(const y of [.128,.604,1.119,1.613,2.198])
        fastener(P,t,y,face+.027,.010,(rack+Math.round(y*10))%4===0);
    }
    for(const band of [[.109,.322],[.779,1.00],[1.398,1.62],[2.102,2.246]])
      solid('iron',ends[0]+.016,ends[1]-.017,band[0],band[1],-.347,-.324);
    for(let i=0;i<rows.length;i++){
      const y=rows[i];solid('green',ends[0],ends[1],y-.057,y,-.357,.365);
      solid('edge',ends[0]+.025,ends[1]-.021,y-.043,y-.024,.365,.374);
      if(i===4)continue;
      let cursor=-1.58+r()*.05,j=0;
      while(cursor<1.45){
        const seed=r(),slot=rack*41+i*17+j;
        if(seed<.16){
          cursor+=.10+r()*.22;j++;continue;
        }
        if((j+i*3+rack)%10===1&&cursor<1.11){
          const w=.233+r()*.105,h=.131+r()*.09,front=.234+r()*.070,u=cursor+w*.5;
          const F=(s,t,p)=>P(s+u,t+y+.002,p),put=(m,a,b,c,d,f,g)=>k.box(m,F,a,b,c,d,f,g);
          put(seed>.62?'fileLinen':'fileKraft',-w/2,w/2,0,h,-.269,front);
          put(seed>.62?'green':'fileKraft',-w/2-.010,w/2+.010,h-.011,h+.020,-.278,front+.008);
          put('leafEdge',-w*.47,w*.47,h-.020,h-.013,front-.003,front+.002);
          put('edge',-.060,.060,.038,.084,front+.001,front+.008);
          put('gasket',-.043,.043,.048,.074,front+.008,front+.011);
          if(w>.27){
            put('paper',-w*.45,-w*.18,.034,.082,front+.002,front+.005);
            art.tab(root,slot,(s,t)=>F(-w*.452+w*.274*s,.035+.046*t,front+.0054),side);
          }
          cursor+=w+.028;
        }else if((i+rack+j)%11===7&&cursor<1.16){
          const w=.255+r()*.073,u=cursor+w*.5;
          for(let n=0;n<3;n++){
            const at=(s,t,p)=>P(s+u+(n-1)*.010,t+y+.020*n,p-.019*n);
            k.box('fileKraft',at,-w*.5,w*.5,.004,.025,-.252,.224);
            k.box('leafEdge',at,-w*.454,w*.453,.010,.017,.224,.229);
          }
          for(const a of [-.059,.062])rod('canvas',P(u+a,y+.059,-.237),P(u+a,y+.069,.224),.004);
          cursor+=w+.034;
        }else{
          const folder=seed<.47,w=folder?.037+r()*.035:.078+r()*.064,H=.244+r()*.093,u=cursor+w*.5;
          const lean=(j%9===4?.048:j%9===5?-.024:0)*(seed>.40?1:.6);
          const front=.245+(r()-.45)*.11,frame=(s,t,p)=>P(u+s+lean*t/H,y+.003+t,p);
          const mat=folder?(slot%4===0?'fileLinen':'fileKraft'):cover[slot%cover.length],put=(m,a,b,c,d,f,g)=>k.box(m,frame,a,b,c,d,f,g);
          const head=folder?H-.027:H-.013;
          put('leafEdge',-w*.36,w*.36,.009,head,-.267,front-.014);
          if(j%3===2){
            for(let l=0;l<3;l++)put('paper',-w*.273,w*.281,head-.014+l*.004,head-.012+l*.004,-.243,front-.034);
          }
          for(const s of [-1,1])put(mat,s*w*.5-.0038,s*w*.5+.0038,.002,H-(s===1&&folder?.018:0),-.279,front+.003);
          put(mat,-w*.52,w*.52,.002,H-(folder?.007:0),front-.022,front+.003);
          if(!folder){
            const h=H*.37,r=w*.166;
            rod('brass',frame(0,h,front+.003),frame(0,h,front+.007),r);
            rod('gasket',frame(0,h,front+.007),frame(0,h,front+.009),r*.68);
            for(const q of [H*.18,H*.82])
              put('fileLinen',-w*.509,w*.509,q-.004,q+.006,front+.002,front+.004);
          }else put(slot%3===0?'apron':'paper',-w*.49,w*.49,H-.060,H+.019,front-.055,front-.032);
          tags(frame,side,slot,w*.81,folder?.038:.061,folder?H*.61:H*.54,front+.0043);
          cursor+=w+(folder?.011:.021)+Math.max(0,lean)*.70;
        }
        j++;
      }
    }
    hit(x-.384,x+.384,z-d/2,z+d/2);
  }
  for(const [i,x] of [-14.50,-12.50,-10.49,-4.18].entries())locker(x,65.19,i===3?-1:1,i);

  // A pulled-out drawer at the entrance to the archive: steel label
  // holder, shallow tray on guides and a few visible index cards.
  const x=-11.97,z=62.63;
  put('iron',x,.067,z,1.17,.113,.641);
  put('gunmetal',x,.551,z,1.10,.96,.586);
  put('darkWood',x,1.048,z,1.184,.082,.648);
  for(const [i,y] of [.256,.467,.702,.917].entries()){
    const open=i===2,front=z+.306+(open?.246:0);
    put('green',x,y,front,1.045,.186,.046);
    for(const h of [-1,1]){
      rod('edge',[x+h*.12,Y+y+.025,front],[x+h*.12,Y+y+.031,front+.040],.009);
      if(open)put('iron',x+h*.45,y-.039,z+.317,.043,.072,.464);
    }
    rod('edge',[x-.12,Y+y+.03,front+.039],[x+.12,Y+y+.03,front+.039],.009);
    put('brass',x+.311,y,front+.028,.158,.069,.012);
    put('paper',x+.311,y,front+.035,.127,.048,.006);
    if(open)for(let j=0;j<7;j++)
      put(j===4?'apron':'leafEdge',x-.30+j*.095,y+.027,front-.084,.081,.064,.154,(j-3)*.052);
  }
  hit(x-.589,x+.589,z-.321,z+.582);
}

export function publicDeskDressing(kit,{mounted,document,put,line,table,cyl,strip}){
  const {hit,dress,root,wheel,obj,props}=kit;
  // Posted notices and scuffed skirting on the blank wait-room side.
  for(const [key,z,w,h] of [['waiting',56.67,1.31,1.00],['dispatch',59.05,1.19,.86]])
    mounted(key,-2.213,1.90,z,w,h,-pi/2);
  for(const [z,width] of [[56.61,2.31],[59.92,1.54]]){
    put('wood',-2.193,.878,z,.064,.159,width);
    put('edge',-2.226,.832,z,.027,.029,width-.074);
    for(const a of [-.43,0,.43])put('brass',-2.243,.883,z+width*a,.035,.027,.038);
  }
  for(const [x,z,a] of [[-12.40,55.66,.2],[-10.32,57.38,-.38],[-11.74,57.16,.28],[-3.79,56.73,.95]]){
    put('paper',x,.0065,z,.085,.007,.049,a);
    put('copperDark',x+.009,.011,z,.029,.002,.007,a);
  }
  strip('gasket',-14.80,-13.78,55.55,57.18);
  for(let i=0;i<8;i++)kit.box('iron',-14.76,-13.82,Y+.0078,Y+.010,55.65+i*.185,55.67+i*.185);
  table(-3.36,60.55,.96,.67,.856,'green');
  document('dispatch',-3.30,.895,60.51,.43,.29,pi-.11);
  props.folio(-3.48,Y+.892,60.69,.289,.214,-.73,4,{loose:true,thickness:.012});
  for(const x of [-3.56,-3.37])line('iron',x,.925,60.30,x+.12,.925,60.342,.0069);
  const x=-2.73,z=55.10;
  cyl('iron',x,.056,z,.182,.10);cyl('green',x,.220,z,.170,.311);
  obj('edge',wheel,x,Y+.372,z,.180,.180,.119,flat);
  cyl('gasket',x,.373,z,.153,.011);
  for(const [i,a] of [-2.05,1.12,2.33].entries())put('leafEdge',x+Math.cos(a)*.088,.364,z+Math.sin(a)*.071,.058,.068,.079,i*.68);
  hit(x-.186,x+.184,z-.187,z+.185);
  dress.stain(-2.164,1.31,57.94,.81,1.25,-pi/2,1);
  dress.stain(-11.84,.019,56.93,1.50,1.17,.28,2,flat);
}

export function traceAtWindow(kit,art,x,z,i,{put,line,cyl}){
  const {dress,root}=kit,P=(u,y,d)=>[x-u,Y+y,z-d];
  // Foot rail, slot bezel and numbered brass badge make the window legible
  // as an actual counter. Stacked slips occupy the transaction tray.
  put('wood',x,.862,z-.425,1.81,.086,.069);
  put('edge',x,.330,z-.432,1.787,.041,.051);
  for(const s of [-1,1]){
    put('gunmetal',x+s*.738,.649,z-.430,.065,.451,.031);
    dress.fastener(P,s*.738,.653,.452,.011,true);
  }
  put('iron',x,1.099,z-.056,.383,.076,.051);
  put('brass',x,1.133,z-.087,.319,.015,.047);
  for(let j=0;j<3;j++){
    const q=x+(j-1)*.048;
    put(j===2&&i===2?'apron':'leafEdge',q,1.096+j*.008,z-.117-j*.019,.112,.012,.110,(j-2)*.08);
  }
  const n=x+.698;
  put('brass',n,2.474,z-.057,.147,.112,.027);
  art.badge(root,i,(s,t)=>[n-(s-.5)*.119,Y+2.434+t*.080,z-.073]);
  dress.grill('edge',x-.659,1.517,z-.050,.195,.148,pi);
  cyl('iron',x-.581,1.016,z+.14,.078,.062);
  line('iron',x-.581,1.033,z+.14,x-.557,1.257,z+.14,.011);
  line('gasket',x-.557,1.257,z+.14,x-.510,1.285,z+.087,.019);
}
