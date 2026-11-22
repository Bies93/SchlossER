// Shared two-choice conversation. The NPC's opening finishes before input
// is accepted, including on mute or when no audio device is available.
export function bindNpcDialogue({element,play,stop,onOpen,onClose,onReply,nextSpeech}){
  const title=element.querySelector('h2'),line=element.querySelector('p');
  const hint=element.querySelector('[data-dialogue-hint]');
  const buttons=Array.from(element.querySelectorAll('[data-answer]'));
  let conversation=null,timer=0,ready=false;
  function offer(speech){
    if(conversation!==speech||ready)return;
    clearTimeout(timer);ready=true;
    for(const [i,b] of buttons.entries())b.disabled=!speech.choices[i];
    hint.textContent=(speech.choices.length===3?'J / N / 3':'J / N')+' · Antwort auswählen · Esc · Gespräch beenden';
  }
  const valid=s=>s?.choices?.length>0&&s.choices.length<=buttons.length&&s.alive?.();
  function show(speech,first){
    conversation=speech;ready=false;title.textContent=speech.name;line.textContent=speech.line;
    hint.textContent='Hör zu …';
    for(const [i,b] of buttons.entries()){
      b.disabled=true;b.hidden=!speech.choices[i];b.querySelector('span').textContent=speech.choices[i]?.label??'';
    }
    speech.listen?.(true);
    if(first){onOpen();element.showModal();}
    timer=setTimeout(()=>offer(speech),Math.max(1050,Math.min(4300,500+speech.line.length*53)));
    play(speech,seconds=>{
      if(conversation!==speech||ready)return;
      clearTimeout(timer);timer=setTimeout(()=>offer(speech),seconds*1000+230);
    },()=>offer(speech),()=>conversation===speech&&!ready);
    return true;
  }
  function open(speech){
    return !conversation&&valid(speech)?show(speech,true):false;
  }
  function close(reason='cancel',index=null){
    if(!conversation)return;
    const speech=conversation;conversation=null;ready=false;clearTimeout(timer);
    stop(speech.id);speech.listen?.(false);speech.speakFor?.(0);
    element.close();
    onClose(reason);
    const reply=index===null?null:speech.choices[index]?.reply;
    if(reply&&speech.alive?.())onReply(speech,reply);
  }
  function choose(i){
    if(!conversation||!ready||!conversation.choices[i])return;
    const speech=conversation,reply=speech.choices[i].reply;
    const next=reply&&speech.alive?.()?nextSpeech?.(speech,reply):null;
    if(valid(next)){
      conversation=null;clearTimeout(timer);stop(speech.id);speech.speakFor?.(0);
      show(next,false);return;
    }
    close('answer',i);
  }
  for(const [i,b] of buttons.entries())b.addEventListener('click',()=>choose(i));
  element.querySelector('[data-dialogue-close]').addEventListener('click',()=>close('dismiss'));
  element.addEventListener('cancel',event=>{event.preventDefault();close()});
  window.addEventListener('keydown',event=>{
    if(!conversation||event.ctrlKey||event.metaKey||event.altKey)return;
    const index=event.code==='KeyJ'?0:event.code==='KeyN'?1:event.code==='Digit3'||event.code==='Numpad3'?2:null;
    if(index!==null){
      event.preventDefault();event.stopImmediatePropagation();
      if(!event.repeat)choose(index);
    }
  },true);
  return {open,close,pending:()=>conversation};
}
