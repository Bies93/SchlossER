// Shared two-choice conversation. The NPC's opening finishes before input
// is accepted, including on mute or when no audio device is available.
export function bindNpcDialogue({element,play,stop,onOpen,onClose,onReply}){
  const title=element.querySelector('h2'),line=element.querySelector('p');
  const hint=element.querySelector('[data-dialogue-hint]');
  const buttons=Array.from(element.querySelectorAll('[data-answer]'));
  let conversation=null,timer=0,ready=false;
  function offer(speech){
    if(conversation!==speech||ready)return;
    clearTimeout(timer);ready=true;
    for(const b of buttons)b.disabled=false;
    hint.textContent='J / N · Antwort auswählen · Esc · Gespräch beenden';
  }
  function open(speech){
    if(conversation||speech.choices?.length!==buttons.length||!speech.alive?.())return false;
    conversation=speech;ready=false;title.textContent=speech.name;line.textContent=speech.line;
    hint.textContent='Hör zu …';
    for(const [i,b] of buttons.entries()){
      b.disabled=true;b.querySelector('span').textContent=speech.choices[i].label;
    }
    speech.listen?.(true);
    onOpen();
    element.showModal();
    timer=setTimeout(()=>offer(speech),Math.max(1050,Math.min(4300,500+speech.line.length*53)));
    play(speech,seconds=>{
      if(conversation!==speech||ready)return;
      clearTimeout(timer);timer=setTimeout(()=>offer(speech),seconds*1000+230);
    },()=>offer(speech),()=>conversation===speech&&!ready);
    return true;
  }
  function close(reason='cancel',index=null){
    if(!conversation)return;
    const speech=conversation;conversation=null;ready=false;clearTimeout(timer);
    stop(speech.id);speech.listen?.(false);speech.speakFor?.(0);
    element.close();
    onClose(reason);
    if(index!==null&&speech.alive?.())onReply(speech,speech.choices[index].reply);
  }
  function choose(i){
    if(!conversation||!ready)return;
    close('answer',i);
  }
  for(const [i,b] of buttons.entries())b.addEventListener('click',()=>choose(i));
  element.querySelector('[data-dialogue-close]').addEventListener('click',()=>close('dismiss'));
  element.addEventListener('cancel',event=>{event.preventDefault();close()});
  window.addEventListener('keydown',event=>{
    if(!conversation||event.ctrlKey||event.metaKey||event.altKey)return;
    const index=event.code==='KeyJ'?0:event.code==='KeyN'?1:null;
    if(index!==null){
      event.preventDefault();event.stopImmediatePropagation();
      if(!event.repeat)choose(index);
    }
  },true);
  return {open,close,pending:()=>conversation};
}
