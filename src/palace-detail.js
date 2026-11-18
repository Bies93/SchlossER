import {architectureKit} from './architecture-kit.js';

// Four embedded paving bands frame the existing granite without touching the
// sculptured inscription or covering it with a freestanding second pedestal.
export function addMonumentFooting(T,scene,finish){
  const stone=finish('SANDSTONE_CUT').clone();stone.color.setHex(0x8b8071);stone.vertexColors=false;
  const kit=architectureKit(T,scene,{footing:{material:stone,cast:false}});
  const p=(x,y,z)=>[x,y,z];
  for(const [l,r,back,front] of [
    [-1.94,1.94,29.05,29.25],[-1.94,1.94,32.75,32.95],
    [-1.94,-1.74,29.254,32.746],[1.74,1.94,29.254,32.746],
  ])kit.box('footing',p,l,r,-.051,-.006,back,front);
  kit.flush('Friedrich-Denkmal · Bodenanschluss');
}
