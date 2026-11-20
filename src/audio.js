// User-provided music and procedural effects. Audio starts on a gesture.
const sound={
  stone:[130,1850,3600,.105], gravel:[100,890,3100,.155], lawn:[89,570,1750,.14], hall:[111,1270,3900,.12]
};
const FOOT_LEVEL=.34; // About -9.4 dB, applied to every layer of the step.
export function makeAudio(listener,musicUrl,choirUrl,orbUrl,clubUrl,prisonerUrl) {
  let ctx,master,music,sfx,verb,noise,ac,playing=false,combat=false,enabled=true,bedTime=0;
  let track,loading,source,voice,started=0,offset=0;
  let danceBus,danceWet=0,danceBuffer,danceLoad,danceRetry=0,danceNode,danceStart=0,danceOffset=0;
  const spokenClips=new Map();
  let choirRequest,choirVoice,choirFailed=false;
  let radioVoice,radioAt;
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
    const impulse=ctx.createBuffer(2,Math.round(ctx.sampleRate*1.26),ctx.sampleRate);
    for(let c=0;c<2;c++){
      const d=impulse.getChannelData(c);
      for(let i=0;i<d.length;i++)d[i]=(random()*2-1)*(1-i/d.length)**3*.38;
    }
    verb=ctx.createConvolver();verb.buffer=impulse;verb.connect(gain(sfx,.23));
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
    const send=wet?gain(verb,wet):null;
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
  function startTrack(){
    if(!live()||source||!musicUrl)return;
    if(!track){
      // Decode once, only when sound is requested. A single buffer source
      // loops on a sample boundary without a media-element seek or timer.
      loading??=fetch(musicUrl).then(r=>{if(!r.ok)throw Error('Musik nicht erreichbar');return r.arrayBuffer()})
        .then(bytes=>{
          const Offline=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
          // 32 kHz preserves the useful bandwidth of this track and bounds stereo PCM memory.
          let decoder=ctx;if(Offline)try{decoder=new Offline(2,1,32000)}catch{}
          return decoder.decodeAudioData(bytes);
        }).then(decoded=>{track=decoded;startTrack()}).catch(()=>{}).finally(()=>{loading=null});
      return;
    }
    const node=ctx.createBufferSource(),amp=gain(music,0),t=ctx.currentTime;
    node.buffer=track;node.loop=true;node.connect(amp);
    amp.gain.linearRampToValueAtTime(.72,t+.14);
    node.onended=()=>{node.disconnect();amp.disconnect()};
    node.start(t,offset);source=node;voice=amp;started=t;
  }
  function stopTrack(){
    if(!source)return;
    const t=ctx.currentTime;
    offset=(offset+t-started)%track.duration;
    voice.gain.cancelScheduledValues(t);voice.gain.setTargetAtTime(0,t,.013);
    source.stop(t+.055);source=null;voice=null;
  }
  function choirStatus(){
    if(!choirUrl||!(globalThis.AudioContext||globalThis.webkitAudioContext))return 'unavailable';
    if(!enabled)return 'muted';
    return choirVoice?'playing':choirRequest?'loading':choirFailed?'retry':'ready';
  }
  function prepareChoir(url){
    if(!spokenClips.has(url))spokenClips.set(url,fetch(url)
      .then(r=>{if(!r.ok)throw Error('Chor nicht erreichbar');return r.arrayBuffer()})
      .then(bytes=>ctx.decodeAudioData(bytes))
      .catch(error=>{spokenClips.delete(url);throw error;}));
    return spokenClips.get(url);
  }
  function stopChoir(){
    choirRequest=null;
    if(!choirVoice)return;
    const entry=choirVoice,now=ctx.currentTime;choirVoice=null;
    entry.amp.gain.cancelScheduledValues(now);entry.amp.gain.setTargetAtTime(0,now,.037);
    entry.node.stop(now+.15);mix();
  }
  function updateChoir(){
    if(!choirVoice)return;
    const {at,amp,pan,url}=choirVoice,a=listener(),dx=at.x-a.x,dz=at.z-a.z,d=Math.hypot(dx,dz),isPrison=url===prisonerUrl;
    if(d>(isPrison?7.1:9.5)){stopChoir();return;}
    const t=ctx.currentTime,volume=(isPrison?.85:1.33)/(1+(Math.max(0,d-.9)/(isPrison?3.9:4.2))**2.3);
    if(choirVoice.volume===undefined||Math.abs(volume-choirVoice.volume)>.010){
      choirVoice.volume=volume;amp.gain.setTargetAtTime(volume,t,.055);
    }
    if(pan){
      const balance=Math.max(-.60,Math.min(.60,(dx*a.rightX+dz*a.rightZ)/Math.max(d,.9)));
      if(choirVoice.balance===undefined||Math.abs(balance-choirVoice.balance)>.014){
        choirVoice.balance=balance;pan.pan.setTargetAtTime(balance,t,.07);
      }
    }
  }
  async function playChoir(at,url=choirUrl){
    const status=choirStatus();
    if(!url||!playing||(status!=='ready'&&status!=='retry')||(!ctx&&!setup()))return;
    const request={at,url};choirRequest=request;choirFailed=false;
    try{
      const [,buffer]=await Promise.all([ctx.resume(),prepareChoir(url)]);
      if(choirRequest!==request||!live())return;
      const a=listener();
      if(Math.hypot(at.x-a.x,at.z-a.z)>(url===prisonerUrl?6.55:4.8))return;
      const node=ctx.createBufferSource(),pan=ctx.createStereoPanner?.(),amp=gain(sfx,0);
      node.buffer=buffer;
      if(pan){node.connect(pan);pan.connect(amp);}else node.connect(amp);
      const entry={at,node,pan,amp,url};choirVoice=entry;
      node.onended=()=>{
        node.disconnect();pan?.disconnect();amp.disconnect();
        if(choirVoice===entry){choirVoice=null;mix();}
      };
      node.start();updateChoir();mix();
    }catch{
      if(choirRequest===request)choirFailed=true;
    }finally{
      if(choirRequest===request)choirRequest=null;
    }
  }
  function mix(){
    if(!ctx)return;
    const t=ctx.currentTime;
    master.gain.setTargetAtTime(playing&&enabled?.55:0,t,.038);
    music.gain.setTargetAtTime(levels.music*(choirVoice?(choirVoice.url===prisonerUrl?.66:.42):1)*(1-danceWet),t,choirVoice?.085:.23);
    danceBus?.gain.setTargetAtTime(levels.music*danceWet*.88,t,.12);
    sfx.gain.setTargetAtTime(levels.sfx,t,.046);
  }
  function play(){
    playing=true;
    try{
      if(!enabled||(!ctx&&!setup()))return;
      mix();ctx.resume().then(startTrack,()=>{});
    }catch{/* Audio is optional on browsers without Web Audio. */}
  }
  function pause(){
    playing=false;club(0);stopTrack();stopChoir();stopRadio();mix();
  }
  function toggle(){
    enabled=!enabled;store();mix();
    if(enabled&&playing)play();
    else{club(0);stopTrack();stopChoir();stopRadio();}
    return enabled;
  }
  function shot(which){
    if(!live())return;
    const t=ctx.currentTime+.009, drift=.95+random()*.10;
    const tap=(at,f,fall,vol,tail,wet=.14)=>tone(sfx,t+at,f*drift,tail,vol,
      {attack:.003,end:fall*drift,wet,wave:ac});
    if(which===0){
      // A short dry relay snap followed by a compact, descending arc.
      grit(sfx,t,.027,.27,1680,6500,{attack:.002,wet:.14,rate:1.17*drift});
      tap(.004,436,183,.20,.074);
      tone(sfx,t+.005,143,.072,.142,{attack:.004,end:60,wet:.15,type:'triangle'});
      tap(.057,995,760,.045,.084,.22);
    }else if(which===1){
      // Narrower, sustained discharge with a bright driven overtone.
      grit(sfx,t,.042,.28,815,5280,{attack:.002,wet:.20,rate:1.22*drift});
      tap(.002,249,107,.23,.171,.23);
      tap(.003,1190,548,.115,.115,.26);
      grit(sfx,t+.029,.131,.108,184,1070,{attack:.013,wet:.36,rate:.91});
      tap(.100,781,490,.043,.106,.30);
    }else{
      // A broader, lower burst with two slightly separated transients.
      grit(sfx,t,.053,.34,487,4680,{attack:.003,wet:.22,rate:.78*drift});
      grit(sfx,t+.016,.078,.19,940,6450,{attack:.003,wet:.27,rate:.92*drift});
      tone(sfx,t+.007,108,.158,.27,{attack:.004,end:46,wet:.28,type:'triangle'});
      grit(sfx,t+.023,.220,.138,85,747,{attack:.01,wet:.38,rate:.76});
      tap(.084,271,136,.072,.140,.25);
    }
  }
  function pulseContact(p,which){
    if(!live())return;
    const a=listener(),dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);
    const vol=1/(1+(d/9)**1.45),pan=Math.max(-.85,Math.min(.85,(dx*a.rightX+dz*a.rightZ)/Math.max(d,1)));
    const t=ctx.currentTime+.007,f=[620,890,385][which]??500;
    grit(sfx,t,.054,.12*vol,830,4250,{attack:.003,pan,wet:.20,rate:.89+random()*.26});
    tone(sfx,t+.008,f,.087,.074*vol,{end:f*.62,attack:.003,pan,wet:.24,wave:ac});
  }
  function foot(kind,power=1,impact=false,side=1){
    if(!live())return;
    const [low,high,edge,decay]=sound[kind]??sound.stone,t=ctx.currentTime+.005;
    const v=FOOT_LEVEL*(.42+Math.min(power,1.3)*.52)*(impact?1.34:1),pan=side*.13,wet=kind==='hall'?.31:.10;
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
  function stopRadio(){
    if(!radioVoice)return;
    radioVoice=null;radioAt=null;globalThis.speechSynthesis?.cancel();
  }
  function speakLocal(at,text,pitch,rate,volume){
    stopRadio();
    // No online speech dependency. The full caption is present even if the
    // device does not have a local German voice or the sound is switched off.
    try{
      const synth=globalThis.speechSynthesis,Voice=globalThis.SpeechSynthesisUtterance;
      const local=synth?.getVoices().find(v=>v.localService&&v.lang.toLowerCase().startsWith('de'));
      if(!Voice||!local)return;
      radioAt=at;const message=new Voice(text);radioVoice=message;
      message.voice=local;message.lang=local.lang;message.pitch=pitch;message.rate=rate;message.volume=levels.sfx*volume;
      message.onend=message.onerror=()=>{if(radioVoice===message){radioVoice=null;radioAt=null;}};
      synth.speak(message);
    }catch{radioVoice=null;radioAt=null;}
  }
  function tapePan(at){
    const a=listener(),x=at.x-a.x,z=at.z-a.z;
    return Math.max(-.67,Math.min(.67,(x*a.rightX+z*a.rightZ)/Math.max(Math.hypot(x,z),.8)));
  }
  function hatch(open){
    if(!live())return;
    const t=ctx.currentTime+.009,delay=open?.02:.24;
    tone(sfx,t,open?109:83,.16,.059,{type:'triangle',end:55,wet:.14});
    grit(sfx,t+.048,.28,.056,220,1210,{wet:.12,attack:.07,rate:.72});
    tone(sfx,t+delay+.21,180,.125,.028,{type:'triangle',end:83,wet:.16});
  }
  function grate(){
    if(!live())return;
    const t=ctx.currentTime+.012;
    grit(sfx,t,.09,.042,530,2380,{attack:.004,wet:.15});
    grit(sfx,t+.08,.88,.041,125,1050,{attack:.14,rate:.64,wet:.17});
    tone(sfx,t+.96,148,.11,.028,{type:'triangle',end:72,wet:.13});
  }
  function priestMurmur(at){
    if(!live())return;
    const t=ctx.currentTime+.012,pan=tapePan(at);
    // Closed-mouth sound, no speech service or HTTP request.
    tone(sfx,t,101,.40,.154,{end:75,pan,wet:.23,attack:.084,shiver:29});
    tone(sfx,t+.012,202,.34,.045,{end:150,pan,wet:.23,attack:.076,shiver:20});
    tone(sfx,t+.014,303,.28,.018,{end:225,pan,wet:.25,attack:.088});
    grit(sfx,t+.049,.28,.020,165,1060,{attack:.06,pan,wet:.19});
  }
  function playMoosfunk(at,text){
    if(!live())return;
    const pan=tapePan(at),t=ctx.currentTime+.016;
    grit(sfx,t,.18,.093,860,2700,{pan,wet:.08,attack:.021});
    tone(sfx,t+.082,680,.105,.088,{type:'triangle',end:599,pan,wet:.10});
    tone(sfx,t+.188,510,.098,.061,{type:'triangle',end:425,pan,wet:.11});
    speakLocal(at,text,.84,.91,.61);
  }
  function playChapel(at,text,take){
    if(!live())return;
    const pan=tapePan(at),t=ctx.currentTime+.017;
    grit(sfx,t,.41,.067,290,1800,{pan,wet:.24,attack:.022,rate:.87});
    const tones=take===2?[109.9,147.25,207.7]:[110,146.83,220];
    // Quiet, layered vowel-like voices with a short tape flutter. No
    // downloaded choir asset, long-lived audio loop or extra audio graph.
    for(const [i,f] of tones.entries()){
      tone(sfx,t+i*.07,f,2.15+i*.19,.039,{wave:ac,end:f*.995,attack:.35,pan,wet:.37,shiver:14});
      tone(sfx,t+.13+i*.056,f*2.006,1.72,.013,{type:'sine',end:f*1.993,attack:.55,pan,wet:.31,shiver:8});
    }
    speakLocal(at,text,.73,.90,.57);
  }
  function ambience(p){
    updateChoir();
    if(radioAt&&Math.hypot(radioAt.x-p.x,radioAt.z-p.z)>4.8)stopRadio();
    if(!live()||ctx.currentTime<bedTime)return;
    bedTime=ctx.currentTime+1.2;
    const d=Math.hypot(p.x*.85,p.z+47);
    if(d<31){
      const t=ctx.currentTime+.026,v=.058*(1-d/31);
      grit(sfx,t,.86,v,980,4400,{wet:.20,attack:.26,rate:.88+random()*.06});
    }
  }
  // One decoded loop for stair and dance floor. Movement only changes gain.
  function club(amount){
    if(!live())amount=0;
    if(!amount){
      if(!danceNode)return;
      const n=danceNode,t=ctx.currentTime;danceNode=null;
      danceOffset=(danceOffset+t-danceStart)%n.loopEnd;
      danceWet=0;mix();n.stop(t+.12);return;
    }
    if(!danceBuffer){
      if(!danceLoad&&ctx.currentTime>=danceRetry){
        danceLoad=fetch(clubUrl).then(r=>{if(!r.ok)throw Error('Clubtrack fehlt');return r.arrayBuffer();})
          .then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>{danceBuffer=buffer;})
          .catch(()=>{danceRetry=ctx.currentTime+20;}).finally(()=>{danceLoad=null;});
      }
      return;
    }
    if(!danceNode){
      danceBus??=gain(master,0);
      const n=ctx.createBufferSource();n.buffer=danceBuffer;n.loop=true;
      // 32 bars, exact musical end from the 44.1 kHz WAV master (no MP3 tail).
      n.loopEnd=Math.min(danceBuffer.duration,2454261/44100);
      n.connect(danceBus);n.onended=()=>n.disconnect();danceStart=ctx.currentTime;
      n.start(danceStart,danceOffset);danceNode=n;
    }
    if(Math.abs(danceWet-amount)>.005||amount===1&&danceWet!==1){danceWet=amount;mix();}
  }
  function clubPhase(){
    return danceNode?((danceOffset+ctx.currentTime-danceStart)%danceNode.loopEnd)*128/danceNode.loopEnd:null;
  }
  return {play,pause,toggle,shot,pulseContact,foot,creature,ambience,club,clubPhase,hatch,playChoir,choirStatus,playMoosfunk,playChapel,stopChapel:stopRadio,mode:on=>{combat=on},
    playOrb:at=>playChoir(at,orbUrl),stopOrb(){if(choirRequest?.url===orbUrl||choirVoice?.url===orbUrl)stopChoir();},
    grate,priestMurmur,playPrisoner:at=>playChoir(at,prisonerUrl),
    stopPrisoner(){if(prisonerUrl&&(choirRequest?.url===prisonerUrl||choirVoice?.url===prisonerUrl))stopChoir();},
    settings:()=>({...levels,enabled}),
    volume(key,value){if(key in levels&&Number.isFinite(value)){levels[key]=Math.max(0,Math.min(1,value));store();mix()}}
  };
}
