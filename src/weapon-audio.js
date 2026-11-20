export const WEAPON_SFX=Object.fromEntries([
  'bow_fire_01','bow_fire_02','bow_fire_03','bow_reload_open','bow_reload_close',
  'shotgun_pump_open','shotgun_pump_close','impact_metal','impact_stone','impact_soft',
  'weapon_equip','weapon_holster','rifle_field_1','rifle_field_2','shotgun_field'
].map(id=>[id,id+(id.includes('_field')?'.wav':'.mp3')]));

// Compressed data arrives during the loading screen. Decode on first legal
// audio gesture, keep only decoded PCM, and degrade gracefully when offline.
export function weaponBank(urls){
  const bytes=new Map(),decoded=new Map();
  let pending,decodePending;
  function preload(){
    return pending??=Promise.allSettled(Object.entries(urls).map(async([id,url])=>{
      const response=await fetch(url);if(response.ok)bytes.set(id,await response.arrayBuffer());
    }));
  }
  function decode(ctx){
    return decodePending??=preload().then(()=>Promise.allSettled([...bytes].map(async([id,data])=>{
      bytes.delete(id);decoded.set(id,await ctx.decodeAudioData(data));
    })));
  }
  return {preload,decode,get:id=>decoded.get(id)};
}
