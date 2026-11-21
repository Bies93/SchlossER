import assert from 'node:assert/strict';
import * as T from 'three';
import {bakeMoon,bakeStars} from '../src/sky-maps.js';
const moon=bakeMoon(T),stars=bakeStars(T);
assert.equal(moon.image.data.length,128**2);
assert.ok(moon.generateMipmaps&&stars.generateMipmaps);
assert.equal(stars.wrapS,T.RepeatWrapping);
assert.equal(stars.image.width*stars.image.height*4,stars.image.data.length);
let bright=0,visible=0,lunarHigh=0,lunarLow=0;
for(let i=0;i<stars.image.data.length;i+=4){
  const light=stars.image.data[i+2];
  assert.equal(stars.image.data[i+3],255);
  if(light>70)bright++;
  if(light>22)visible++;
}
assert.ok(bright>300&&bright<stars.image.width*stars.image.height*.002);
assert.ok(visible>1100&&bright<visible*.45);
for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  if(Math.hypot(x-64,y-64)>46)continue;
  const value=moon.image.data[y*128+x];
  if(value>164)lunarHigh++;
  if(value<136)lunarLow++;
}
assert.ok(lunarLow>300&&lunarHigh>400);
assert.deepEqual(moon.image.data,bakeMoon(T).image.data);
console.log('Mond- und Sternkarten: Format, Kontrast, Filterung und deterministisches Relief geprüft.');
