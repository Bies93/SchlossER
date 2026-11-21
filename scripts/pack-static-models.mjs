// Re-run after exporting the cast or sculptures. Preserve accessor IDs,
// sparse morphs, vertex/index order, rig, embedded images and all materials.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MeshoptEncoder} from 'meshoptimizer';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const EXT='EXT_meshopt_compression',align=n=>Math.ceil(n/4)*4;
function unpack(buf){
  const n=buf.readUInt32LE(12);
  return [JSON.parse(buf.subarray(20,20+n)),buf.subarray(28+n)];
}
function viewBytes(v,bin){
  const e=v.extensions?.[EXT],s=e??v;
  assert.equal(s.buffer,0);
  const raw=bin.subarray(s.byteOffset??0,(s.byteOffset??0)+s.byteLength);
  assert.equal(raw.length,s.byteLength);
  if(!e)return raw;
  const out=Buffer.alloc(e.count*e.byteStride);
  MeshoptDecoder.decodeGltfBuffer(out,e.count,e.byteStride,raw,e.mode,e.filter);
  return out;
}
for(const name of ['human-cast','skulpturen']){
  const url=new URL('../assets/'+name+'.glb',import.meta.url);
  const before=await readFile(url),[original,bin]=unpack(before),g=structuredClone(original);
  const chunks=[],known=new Map();let size=0,fallback=0;
  function append(bytes){
    const key=createHash('sha256').update(bytes).digest('hex');
    if(known.has(key))return known.get(key);
    const pos=size;known.set(key,pos);chunks.push(bytes,Buffer.alloc(align(bytes.length)-bytes.length));size+=align(bytes.length);
    return pos;
  }
  for(const [i,v] of g.bufferViews.entries()){
    let e=v.extensions?.[EXT];
    if(!e&&name==='skulpturen'&&!g.extensionsRequired?.includes(EXT)){
      const a=g.accessors.find(a=>a.bufferView===i);
      assert.ok(a&&!a.byteOffset);
      const stride=v.byteLength/a.count,mode=a.type==='SCALAR'?'INDICES':'ATTRIBUTES';
      const raw=viewBytes(v,bin),packed=MeshoptEncoder.encodeGltfBuffer(raw,a.count,stride,mode);
      if(packed.length<raw.length){
        v.extensions={...v.extensions,[EXT]:{buffer:0,byteOffset:append(packed),byteLength:packed.length,
          byteStride:stride,count:a.count,mode}};
        v.buffer=1;v.byteOffset=fallback;fallback+=align(v.byteLength);
        continue;
      }
    }
    const part=e??v;assert.equal(part.buffer,0);
    const off=part.byteOffset??0;
    part.byteOffset=append(bin.subarray(off,off+part.byteLength));
  }
  if(fallback){
    g.extensionsRequired=[EXT];g.extensionsUsed=[EXT];
    g.buffers.push({byteLength:fallback,extensions:{[EXT]:{fallback:true}}});
  }
  g.buffers[0].byteLength=size;
  const json=Buffer.from(JSON.stringify(g)),len=align(json.length);
  const head=Buffer.alloc(20),binhead=Buffer.alloc(8);
  head.write('glTF');head.writeUInt32LE(2,4);head.writeUInt32LE(28+len+size,8);
  head.writeUInt32LE(len,12);head.write('JSON',16);
  binhead.writeUInt32LE(size);binhead.write('BIN\0',4);
  const result=Buffer.concat([head,json,Buffer.alloc(len-json.length,32),binhead,...chunks]);
  // Verify the serialized file with the decoder actually shipped to browsers.
  const [after,data]=unpack(result);
  for(const [key,value] of Object.entries(original))
    if(!['buffers','bufferViews','extensionsUsed','extensionsRequired'].includes(key))assert.deepEqual(after[key],value);
  for(const [i,v] of original.bufferViews.entries()){
    const other=after.bufferViews[i];
    for(const field of ['byteStride','target','byteLength'])assert.equal(other[field],v[field]);
    assert.ok(viewBytes(v,bin).equals(viewBytes(other,data)),'decoded data differs: '+name+' view '+i);
  }
  if(result.length<before.length)await writeFile(url,result);
  console.log(name,before.length,'->',Math.min(before.length,result.length),'bytes;',g.bufferViews.length,'views verified');
}
