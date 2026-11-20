export function bindTouchEquipment({fireButton,switchButton,weaponName,reticle,viewmodel,enabled}){
  let pointer=null;
  function clear(){
    if(pointer===null)return;
    const id=pointer;pointer=null;
    viewmodel.touchTrigger(false);
    if(fireButton.hasPointerCapture(id))fireButton.releasePointerCapture(id);
    fireButton.removeAttribute('data-held');
  }
  function update(){
    if(!enabled()){clear();return;}
    const label=viewmodel.selectionName(),ready=viewmodel.touchReady();
    if(weaponName.textContent!==label)weaponName.textContent=label;
    if(fireButton.disabled!==!ready)fireButton.disabled=!ready;
    if(reticle.hidden!==!ready)reticle.hidden=!ready;
    if(!ready)clear();
  }
  switchButton.addEventListener('click',()=>{
    if(!enabled())return;
    clear();viewmodel.cycle();update();
  });
  fireButton.addEventListener('pointerdown',e=>{
    if(!enabled()||e.button!==0||pointer!==null||!viewmodel.touchReady())return;
    e.preventDefault();
    if(!viewmodel.touchTrigger(true))return;
    pointer=e.pointerId;fireButton.setPointerCapture(pointer);
    fireButton.setAttribute('data-held','');
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture']){
    fireButton.addEventListener(event,e=>{if(e.pointerId===pointer)clear();});
  }
  // A keyboard/screen-reader click should fire once, not start a held action.
  fireButton.addEventListener('click',e=>{
    if(e.detail!==0||!enabled()||pointer!==null||!viewmodel.touchReady())return;
    viewmodel.touchTrigger(true);viewmodel.touchTrigger(false);
  });
  fireButton.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',clear);
  return {update,clear};
}
