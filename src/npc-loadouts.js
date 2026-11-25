// Authored loadouts for the game cast. Passers-by, patients and most guests
// are unarmed. The roster is stable across reloads and shared with loot.
const pistols=['niklas','festZwanni','festKalle','bergWirt','guestEdda','cloneAlma',
  'plazaAnton','crownMarshal','crownQuartermaster','chapterOskar','labOrderly','labHedwig','clubVeit'];
const bows=['festRudi','bergFritz','bergUdo','guestRike','cloneB07','cloneLorenz','cloneB12',
  'plazaRaban','plazaEberwin','crownDrone','crownVoice','chapterKonrad','clubNiko'];
export const NPC_WEAPONS=Object.freeze(Object.fromEntries([
  ...pistols.map(id=>[id,'pistol']),...bows.map(id=>[id,'bow'])
]));
export const npcWeapon=id=>Object.hasOwn(NPC_WEAPONS,id)?NPC_WEAPONS[id]:null;
export const npcActorLayer=actor=>31-Math.clz32(actor.layers.mask&-actor.layers.mask);
