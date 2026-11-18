// Original, asset-free score and effects. Audio is initialized by a gesture.
const note=m=>440*2**((m-69)/12);
const phrase=[
  [48,null,55,53],[51,48,null,null],[46,null,50,51],[43,null,null,null],
  [48,51,55,null],[53,null,51,46],[50,43,null,46],[48,null,null,null],
  [55,null,58,53],[51,null,46,48],[50,null,53,51],[43,null,null,null],
  [46,48,51,null],[53,55,51,48],[46,null,43,41],[48,null,null,null]
];
const bass=[36,32,34,31,36,41,34,36,31,32,34,31,34,41,31,36];
const sound={
  stone:[130,1850,3600,.105], gravel:[100,890,3100,.155], lawn:[89,570,1750,.14], hall:[111,1270,3900,.12]
};
export function makeAudio(listener) {
  let ctx,master,music,sfx,verb,noise,ac,playing=false,combat=false,enabled=true,step=0,next=0,timer=0,bedTime=0;
  let levels={music:.48,sfx:.72};
  try{
    const saved=JSON.parse(localStorage.getItem('schlosser.audio')||'null');
    if(saved){
      for(const k of ['music','sfx'])if(Number.isFinite(saved[k]))levels[k]=Math.max(0,Math.min(1,saved[k]));
      enabled=saved.enabled!==false;
    }
  }catch{}
  const store=()=>{try{localStorage.setItem('schlosser.audio',JSON.stringify({...levels,enabled}))}catch{}};
  let seed=194023;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  function gain(out,level){
    const n=ctx.createGain();n.gain.value=level;n.connect(out);return n;
  }
  function setup(){
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC();const compressor=ctx.createDynamicsCompressor();
    compressor.threshold.value=-14;compressor.ratio.value=5;compressor.attack.value=.006;
    compressor.connect(ctx.destination);master=gain(compressor,0);music=gain(master,levels.music);sfx=gain(master,levels.sfx);
    verb=new Map();
    const impulse=ctx.createBuffer(2,Math.round(ctx.sampleRate*1.26),ctx.sampleRate);
    for(let c=0;c<2;c++){
      const d=impulse.getChannelData(c);
      for(let i=0;i<d.length;i++)d[i]=(random()*2-1)*(1-i/d.length)**3*.38;
    }
    for(const out of [music,sfx]){
      const convolver=ctx.createConvolver();convolver.buffer=impulse;convolver.connect(gain(out,.23));
      verb.set(out,convolver);
    }
    const taps=ctx.createBuffer(1,Math.round(ctx.sampleRate*2),ctx.sampleRate),s=taps.getChannelData(0);
    for(let i=0;i<s.length;i++)s[i]=random()*2-1;
    noise=taps;
    ac=ctx.createPeriodicWave(new Float32Array(13),Float32Array.from([0,1,.38,.27,.11,.072,.051,.025,.018,.015,.011,.01,.008]));
    return true;
  }
  const live=()=>playing&&enabled&&ctx?.state==='running';
  function route(out,pan,wet){
    const stereo=ctx.createStereoPanner&&Math.abs(pan)>.01;
    if(!wet&&!stereo)return {node:out,close(){}};
    const node=stereo?ctx.createStereoPanner():ctx.createGain();
    if(stereo)node.pan.value=pan;
    node.connect(out);
    const send=wet?gain(verb.get(out),wet):null;
    if(send)node.connect(send);
    return {node,close(){node.disconnect();send?.disconnect()}};
  }
  function env(g,t,a,tail,vol){
    g.gain.setValueAtTime(.00001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.00002,vol),t+a);
    g.gain.exponentialRampToValueAtTime(.00001,t+a+tail);
  }
  function tone(out,t,f,tail,vol,{type='sine',end=f,attack=.009,pan=0,wet=0,wave,shiver=0}={}){
    const bus=route(out,pan,wet),g=gain(bus.node,0),o=ctx.createOscillator();
    if(wave)o.setPeriodicWave(wave);else o.type=type;
    o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+attack+tail*.72);
    o.connect(g);env(g,t,attack,tail,vol);
    let lfo,depth;
    if(shiver){
      lfo=ctx.createOscillator();lfo.frequency.value=4.0+random()*.9;
      depth=gain(o.detune,shiver);lfo.connect(depth);lfo.start(t);lfo.stop(t+attack+tail+.04);
    }
    o.start(t);o.stop(t+attack+tail+.04);
    o.onended=()=>{o.disconnect();g.disconnect();bus.close();lfo?.disconnect();depth?.disconnect()};
  }
  function grit(out,t,tail,vol,hp,lp,{pan=0,wet=0,attack=.005,rate=1}={}){
    const source=ctx.createBufferSource(),hi=ctx.createBiquadFilter(),lo=ctx.createBiquadFilter();
    const bus=route(out,pan,wet),g=gain(bus.node,0);
    hi.type='highpass';hi.frequency.value=hp;lo.type='lowpass';lo.frequency.value=lp;
    source.buffer=noise;source.playbackRate.value=rate;source.connect(hi);hi.connect(lo);lo.connect(g);
    env(g,t,attack,tail,vol);
    source.start(t,random()*.76);source.stop(t+attack+tail+.016);
    source.onended=()=>{source.disconnect();hi.disconnect();lo.disconnect();g.disconnect();bus.close()};
  }
  function clock(){
    if(!live())return;
    if(next<ctx.currentTime-.15)next=ctx.currentTime+.06;
    while(next<ctx.currentTime+.26){
      const bar=Math.floor(step/4)%phrase.length,b=step%4,t=next,f=note(bass[bar]);
      const v=combat?1:.57,pan=(b%2?.12:-.12),beat=60/73;
      if(b===0||b===2){
        tone(music,t,f*(b===2&&bar%4===2?1.498:1),.51,.24*v,{type:'triangle',attack:.014,pan:-.17,wet:.18});
        tone(music,t+.006,b===0?72:58,.21,.11*v,{end:35,attack:.012,wet:.12});
        if(combat&&b===0)grit(music,t+.009,.137,.095,165,1320,{wet:.13});
      }
      if((b===1||b===3)&&bar%4!==3){
        const j=note(bass[bar]+(b===1?19:12));
        tone(music,t+.026,j,.34,.075*v,{type:'triangle',pan:.31,wet:.30});
        tone(music,t+.033,j*2.013,.18,.036*v,{pan:.26,wet:.37});
      }
      const hum=phrase[bar][b];
      if(hum!=null){
        const n=note(hum-12),swell=phrase[bar][b+1]==null?1.02:.59;
        tone(music,t+.033,n,swell,.125*v,{wave:ac,attack:.158,end:n*.996,pan,wet:.63,shiver:13});
        tone(music,t+.089,n*.994,swell*.85,.040*v,{type:'triangle',attack:.172,pan:-pan*.9,wet:.61,shiver:9});
      }
      next+=beat;step++;
    }
  }
  function mix(){
    if(!ctx)return;
    const t=ctx.currentTime;
    master.gain.setTargetAtTime(playing&&enabled?.55:0,t,.038);
    music.gain.setTargetAtTime(levels.music,t,.046);
    sfx.gain.setTargetAtTime(levels.sfx,t,.046);
  }
  function play(){
    playing=true;
    try{
      if(!enabled||(!ctx&&!setup()))return;
      mix();ctx.resume().catch(()=>{});
      if(!timer){next=ctx.currentTime+.09;timer=setInterval(clock,120)}
    }catch{/* Audio is optional on browsers without Web Audio. */}
  }
  function pause(){
    playing=false;clearInterval(timer);timer=0;mix();
  }
  function toggle(){
    enabled=!enabled;store();mix();
    if(enabled&&playing)play();
    else{clearInterval(timer);timer=0}
    return enabled;
  }
  function shot(which){
    if(!live())return;
    const t=ctx.currentTime+.009;
    const [hit,body,tail,pitch]=[[.44,.25,.31,133],[.48,.31,.39,113],[.59,.39,.48,90]][which]??[.42,.2,.31,110];
    grit(sfx,t,.067,hit,700,6350,{attack:.003,wet:.10,rate:1.3-which*.15});
    grit(sfx,t+.009,tail,body*.8,110,1260,{attack:.007,wet:.56});
    tone(sfx,t,pitch,.139,body,{attack:.004,end:pitch*.43,wet:.39,type:'triangle'});
    grit(sfx,t+.047,.076,.15,960,4370,{wet:.28,rate:.8+random()*.34});
  }
  function foot(kind,power=1,impact=false,side=1){
    if(!live())return;
    const [low,high,edge,decay]=sound[kind]??sound.stone,t=ctx.currentTime+.005;
    const v=(.42+Math.min(power,1.3)*.52)*(impact?1.51:1),pan=side*.13,wet=kind==='hall'?.46:.14;
    tone(sfx,t,low*(.87+random()*.21),.07,.099*v,{end:low*.58,attack:.007,pan,wet});
    grit(sfx,t+.004,decay,.127*v,high*.32,edge,{pan,wet,rate:.84+random()*.34});
    if(kind==='gravel')grit(sfx,t+.039,.097,.064*v,1170,3700,{pan,wet:.12,rate:1.15});
  }
  function creature(kind,pos){
    if(!live()||!combat)return;
    const a=listener(),x=pos.x-a.x,z=pos.z-a.z,d=Math.hypot(x,z);
    if(d>32)return;
    const pan=Math.max(-.82,Math.min(.82,(x*a.rightX+z*a.rightZ)/Math.max(d,1))),t=ctx.currentTime+.007;
    const vol=1/(1+(d/8)**1.75),f=59+random()*29,wet=.26;
    const hard=kind==='attack'||kind==='hit';
    const length=kind==='down'?.46:hard?.26:.40;
    tone(sfx,t,f,length,vol*(hard?.19:.14),{wave:ac,end:f*(kind==='down'?.49:.69),attack:hard?.045:.088,pan,wet,shiver:78});
    grit(sfx,t+.033,length*.8,vol*.16,155,hard?1720:1170,{attack:.08,pan,wet,rate:.74});
  }
  function ambience(p){
    if(!live()||ctx.currentTime<bedTime)return;
    bedTime=ctx.currentTime+1.2;
    const d=Math.hypot(p.x*.85,p.z+47);
    if(d<31){
      const t=ctx.currentTime+.026,v=.058*(1-d/31);
      grit(sfx,t,.86,v,980,4400,{wet:.20,attack:.26,rate:.88+random()*.06});
    }
  }
  return {play,pause,toggle,shot,foot,creature,ambience,mode:on=>{combat=on},
    settings:()=>({...levels,enabled}),
    volume(key,value){if(key in levels&&Number.isFinite(value)){levels[key]=Math.max(0,Math.min(1,value));store();mix()}}
  };
}
