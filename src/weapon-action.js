// Game timings in seconds. Logic is independent of rendering and browser input.
export const LOADOUT={
  bow:{capacity:1,reserve:24,reload:1.36,cues:[[.50,'open'],[1.17,'close']]},
  rifle:{capacity:30,reserve:120,reload:1.64,cues:[[.54,'mag-out'],[1.17,'mag-in'],[1.41,'charge']]},
  shotgun:{capacity:6,reserve:36,reload:.62,cues:[[.41,'shell']],cycle:[[.27,'open'],[.62,'close']]},
  pistol:{capacity:15,reserve:75,reload:1.24,cues:[[.31,'mag-out'],[.90,'mag-in'],[1.06,'charge']]}
};

export function weaponAction(spec){
  const data=LOADOUT[spec.kind],{capacity}=data;
  let rounds=capacity,reserve=data.reserve,shotAt=-Infinity,shotEnd=-Infinity,dryUntil=0;
  let loadingAt=null,loadCue=0,cycleCue=0,queued=false;
  const canLoad=()=>rounds<capacity&&reserve>0;
  function reload(now){
    if(!canLoad()||loadingAt!==null||queued)return false;
    if(now<shotEnd){queued=true;return true;}
    loadingAt=now;loadCue=0;return true;
  }
  function fire(now){
    if(now<shotEnd)return 'busy';
    if(loadingAt!==null){
      if(spec.kind!=='shotgun'||!rounds)return 'busy';
      loadingAt=null;
    }
    if(!rounds){
      if(now<dryUntil)return 'busy';
      dryUntil=now+.28;return 'dry';
    }
    if(queued)return 'busy';
    rounds--;shotAt=now;shotEnd=now+spec.recovery;cycleCue=0;
    return 'fire';
  }
  function update(now,signal){
    const cycle=data.cycle??[];
    while(cycleCue<cycle.length&&now-shotAt>=cycle[cycleCue][0]){
      const [at,cue]=cycle[cycleCue++];
      if(Number.isFinite(shotAt)&&now-shotAt-at<.14)signal(cue);
    }
    if(queued&&now>=shotEnd){queued=false;if(canLoad())reload(now);}
    if(loadingAt===null)return;
    const age=now-loadingAt;
    while(loadCue<data.cues.length&&age>=data.cues[loadCue][0]){
      const [,cue]=data.cues[loadCue++];
      if(cue==='shell'&&canLoad()){rounds++;reserve--;}
      signal(cue);
    }
    if(age+.000001<data.reload)return;
    if(spec.kind!=='shotgun'){
      const take=Math.min(capacity-rounds,reserve);rounds+=take;reserve-=take;
    }
    // One shell per animated cycle. No hidden replenishment on interruption.
    loadingAt=spec.kind==='shotgun'&&canLoad()?now:null;
    loadCue=0;
  }
  return {fire,reload,update,cancel(){loadingAt=null;queued=false;},
    restock(){const count=data.reserve-reserve;reserve=data.reserve;return count;},
    get isLoading(){return loadingAt!==null||queued;},
    get rounds(){return rounds;},get reserve(){return reserve;},get capacity(){return capacity;},
    visual(now){
      const reload=loadingAt===null?-1:Math.min(1,Math.max(0,(now-loadingAt)/data.reload));
      return {age:now-shotAt,reload,loaded:rounds>0,phase:reload>=0?'reloading':now<shotEnd?'cycling':rounds?'ready':'empty'};
    }};
}

// Exact critically damped spring step; stable across different frame rates.
export function recoilSpring(rate){
  let value=0,velocity=0;
  return {push(impulse){velocity+=impulse;},clear(){value=velocity=0;},step(dt){
    const tail=velocity+rate*value,k=Math.exp(-rate*dt);
    value=(value+tail*dt)*k;velocity=(velocity-rate*tail*dt)*k;
    return value;
  }};
}
