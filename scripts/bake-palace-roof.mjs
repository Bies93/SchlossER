// Repeatable post-export step for the shipped palace GLB. Existing meshopt
// bytes and all existing glTF indices stay intact; only the inset deck is added.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const path=fileURLToPath(new URL('../assets/schloss.glb',import.meta.url));
const input=await readFile(path);
if(input.readUInt32LE(0)!==0x46546c67||input.readUInt32LE(4)!==2)throw Error('Expected GLB v2');
const jsonLength=input.readUInt32LE(12),dataStart=20+jsonLength;
const gltf=JSON.parse(input.toString('utf8',20,dataStart));
const name='ERL_ROOF_UNDERLAY_v1';
if(gltf.nodes.some(n=>n.name===name)){
  console.log('Roof underlay already baked.');process.exit(0);
}
// Additional entries can be virtual EXT_meshopt fallback buffers. Only
// embedded buffer 0 is extended.
if(input.readUInt32LE(dataStart+4)!==0x004e4942||gltf.buffers[0].uri)throw Error('Expected an embedded GLB BIN buffer');
if(!gltf.nodes.some(n=>n.name==='ERL_ROOF_DARK'))throw Error('Roof reference mesh is missing');
const entry=gltf.bufferViews.length,access=gltf.accessors.length;
const corners=[
  [-33.65,16.37,9.68], [33.65,16.37,9.68], [33.65,16.37,-9.68], [-33.65,16.37,-9.68],
  [-23.38,20.59,0], [23.38,20.59,0]
];
const faces=[[0,1,5],[0,5,4],[1,2,5],[2,3,4],[2,4,5],[3,0,4]];
const positions=[],normals=[];
for(const face of faces){
  const [a,b,c]=face.map(i=>corners[i]),u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);
  let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const order=n[1]>=0?[a,b,c]:[a,c,b],len=Math.hypot(...n);
  n=n.map(x=>(n[1]>=0?x:-x)/len);
  for(const p of order){positions.push(...p);normals.push(...n)}
}
const binLength=input.readUInt32LE(dataStart),base=input.subarray(dataStart+8,dataStart+8+binLength);
const floats=a=>{const b=Buffer.alloc(a.length*4);a.forEach((v,i)=>b.writeFloatLE(v,i*4));return b;};
let offset=base.length;
const append=[positions,normals].map(a=>{
  const b=floats(a);
  gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length,target:34962});offset+=b.length;
  return b;
});
gltf.accessors.push({bufferView:entry,componentType:5126,count:positions.length/3,type:'VEC3',
  min:[-33.65,16.37,-9.68],max:[33.65,20.59,9.68]},
  {bufferView:entry+1,componentType:5126,count:normals.length/3,type:'VEC3'});
const material=gltf.materials.push({name:'ROOF_UNDERLAY',pbrMetallicRoughness:{
  baseColorFactor:[.037,.048,.058,1],roughnessFactor:.93,metallicFactor:0}})-1;
const mesh=gltf.meshes.push({name,primitives:[{attributes:{POSITION:access,NORMAL:access+1},material}]})-1;
gltf.scenes[gltf.scene??0].nodes.push(gltf.nodes.push({name,mesh})-1);
const bin=Buffer.concat([base,...append]);gltf.buffers[0].byteLength=bin.length;
const src=Buffer.from(JSON.stringify(gltf));
const json=Buffer.concat([src,Buffer.alloc((4-src.length%4)%4,32)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);
header.writeUInt32LE(20+json.length+8+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
const chunk=Buffer.alloc(8);chunk.writeUInt32LE(bin.length,0);chunk.writeUInt32LE(0x004e4942,4);
await writeFile(path,Buffer.concat([header,json,chunk,bin]));
console.log('Embedded roof deck in assets/schloss.glb without re-encoding the original geometry.');
