// Approximate site from the marked map: just inside the south-eastern lawn
// west of the Rückert clearing. +Z is the open audience entrance.
export const FESTIVAL=Object.freeze({x:19,z:-101.5,halfX:6.13,halfZ:4.98});
export const FESTIVAL_PA=Object.freeze({x:FESTIVAL.x,z:FESTIVAL.z-2.39});
export const festivalClear=(x,z,pad=0)=>Math.abs(x-FESTIVAL.x)<FESTIVAL.halfX+pad&&
  Math.abs(z-FESTIVAL.z)<FESTIVAL.halfZ+pad;
