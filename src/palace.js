import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The GLB stores linked window meshes and local coordinates. Bake each visible
// instance into world space once, then draw one batch per surface finish.
export function surfaceLibrary(THREE, maps) {
  const materials = new Map();
  const grain = (seed, amplitude) => {
    const size = 128, pixels = new Uint8Array(size * size * 4);
    let state = seed;
    for (let i = 0; i < size * size; ++i) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const v = Math.round(247 - amplitude * state / 4294967296);
      pixels.set([v, v, v, 255], i * 4);
    }
    const tex = new THREE.DataTexture(pixels, size, size);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = tex.needsUpdate = true;
    return tex;
  };
  const turf = grain(3, 20), gravel = grain(73, 38);
  // Material tints are sRGB. Texture sizes below are metric world-space repeats.
  const finishes = {
    SANDSTONE: ['sandstone_facade', 3.2, '#e5c898', .85, .26],
    SANDSTONE_CUT: ['sandstone_trim', 1.8, '#f2e1c3', .79, .23],
    SANDSTONE_DARK: ['sandstone_facade', 2.5, '#bc9d71', .88, .28],
    STATUE: ['fountain_stone', 1.5, '#d4c7ab', .82, .22],
    ROOF_DARK: ['roof_slate', 4.2, '#8c959c', .70, .34],
    WOOD: ['oak_door', 1.25, '#b68564', .49, .21],
    WOOD_RELIEF: ['oak_door', .85, '#cb9b74', .44, .23],
    GROUND: ['plaza_pavers', 6.0, '#cecabd', .85, .32],
    FOUNTAIN_STONE: ['fountain_stone', 2.2, '#d2cbbb', .83, .33],
    FOUNTAIN_SHADOW: ['fountain_stone', 2, '#a39d90', .86, .34],
    GRASS: [null, 3.5, '#87925b', 1], GRAVEL: [null, 1.9, '#c7b692', .95],
    MORTAR: [null, 1, '#967f63', .93], METAL: [null, 1, '#514d45', .39],
    RECESS: [null, 1, '#302d27', .96], COPPER_PATINA: [null, 1, '#709580', .53],
    ZINC: [null, 1, '#898b85', .48], LINEN: [null, 1, '#b5ac97', .88],
    GLASS: [null, 1, '#506976', .20], WATER: [null, 1, '#658c86', .24],
    JET: [null, 1, '#e4f4ec', .24],
    FLOWER_RED: [null, 1, '#ae4353', .87], FLOWER_WHITE: [null, 1, '#f6eaca', .85],
    FLOWER_YELLOW: [null, 1, '#e5c769', .89], FLOWER_PINK: [null, 1, '#d48494', .87],
    FLOWER_SOIL: [null, 1, '#6e5c41', 1]
  };

  function finish(key) {
    if (materials.has(key)) return materials.get(key);
    const [set, , tint, roughness, relief] = finishes[key];
    const mat = new THREE.MeshStandardMaterial({color: tint, roughness, vertexColors: true});
    mat.name = key;
    if (set && maps[set]) {
      mat.map = maps[set].albedo;
      mat.normalMap = maps[set].normal;
      for (const t of [mat.map, mat.normalMap]) {
        if (!t) continue;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 4;
        t.needsUpdate = true;
      }
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.normalScale.setScalar(relief);
    }
    if (key === 'GRASS') mat.map = turf;
    if (key === 'GRAVEL') mat.map = gravel;
    if (key === 'METAL' || key === 'COPPER_PATINA' || key === 'ZINC') mat.metalness = .48;
    if (key === 'GLASS' || key === 'WATER') {
      // Echo the park horizon in closed panes and the pool. Small waves in
      // old glass warp the skyline, particularly in the long runs of windows.
      mat.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>',
          '#include <common>\nvarying vec3 erlPos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nerlPos = (modelMatrix * vec4(position,1.)).xyz;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
          '#include <common>\nvarying vec3 erlPos;')
          .replace('#include <opaque_fragment>', `
            vec3 erlView = normalize(erlPos - cameraPosition);
            vec3 erlN = normalize(inverseTransformDirection(normal, viewMatrix));
            vec3 erlR = reflect(erlView, erlN);
            float wave = sin(erlPos.x*2.45 + erlPos.y) * .016 + sin(erlPos.z*4.3)*.011;
            float horizon = .025 + .025*sin(erlR.x*17.) + .013*sin(erlR.z*35.);
            float sky = smoothstep(horizon-.025,horizon+.025,erlR.y+wave);
            vec3 light = mix(vec3(.087,.105,.077),vec3(.48,.62,.69),sky);
            float fres = pow(1.-abs(dot(erlView,erlN)),3.);
            outgoingLight = mix(outgoingLight, light, ${key === 'WATER' ? '.40+.48*fres' : '.42+.50*fres'});
            #include <opaque_fragment>`);
      };
      mat.customProgramCacheKey = () => key;
    }
    if (key === 'JET') {
      mat.transparent = true; mat.opacity = .58; mat.depthWrite = false;
    }
    materials.set(key, mat);
    return mat;
  }

  return {finish, finishes};
}

export async function addPalace(THREE, scene, gltfScene, maps, hasSculptures = false, architecture = null) {
  const {finish, finishes} = surfaceLibrary(THREE, maps);
  const batches = new Map();
  const group = new THREE.Group();
  const sourceMeshes = new Set(), sourceMaterials = new Set();
  let objects = 0, triangles = 0;
  function buildingSurface(name) {
    if (/sculpture|Brunnen_weathered/.test(name)) return 'STATUE';
    if (/recessed|Recessed|damp_recesses/.test(name)) return 'SANDSTONE_DARK';
    if (/Carved|carved/.test(name)) return 'SANDSTONE_CUT';
    if (/glass/.test(name)) return 'GLASS';
    if (/oak/.test(name)) return 'WOOD';
    if (/slate/.test(name)) return 'ROOF_DARK';
    if (/blinds/.test(name)) return 'LINEN';
    if (/interior/.test(name)) return 'RECESS';
    if (/mortar/.test(name)) return 'MORTAR';
    if (/copper/.test(name)) return 'COPPER_PATINA';
    if (/iron|bronze/.test(name)) return 'METAL';
    if (/zinc/.test(name)) return 'ZINC';
    return 'SANDSTONE';
  }
  function processRoot(root, replacement) {
  root.updateMatrixWorld(true);
  root.traverse(obj => {
    if (!obj.isMesh) return;
    sourceMeshes.add(obj.geometry); sourceMaterials.add(obj.material);
    let parent = obj;
    let isContext = false;
    while (parent) {
      if (/_TREE_|PLAZA_JOINT/.test(parent.name) ||
          (hasSculptures && parent.name.includes('ERL_V2_FOUNTAIN_'))) return;
      if (/ERL_ENV_|ERL_V2_(FOUNTAIN_|GARDEN_|FLOWER_)/.test(parent.name)) isContext = true;
      parent = parent.parent;
    }
    if (!replacement && architecture && !isContext) return;
    // GLTFLoader splits primitives with different materials into child meshes.
    let key = replacement ? buildingSurface(obj.material.name) : obj.material.name.replace(/^ERL_(V2_)?MAT_/, '');
    if (/FOUNTAIN_JET/.test(obj.name)) key = 'JET';
    if (!finishes[key]) key = 'SANDSTONE';
    const geo = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    for (const name of Object.keys(geo.attributes)) {
      if (!['position', 'normal'].includes(name)) geo.deleteAttribute(name);
    }
    const pos = geo.attributes.position, nrm = geo.attributes.normal;
    const uvs = new Float32Array(pos.count * 2);
    const colors = new Float32Array(pos.count * 3);
    const variant = replacement && /(?:ashlar_|sandstone_|block_|slate_)(\d+)$/i.exec(obj.material.name);
    colors.fill(variant ? .88 + .023 * Number(variant[1]) : 1);
    const repeat = finishes[key][1];
    for (let i = 0; i < pos.count; i += 3) {
      // Select projection per triangle to avoid interpolation between planes.
      const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
      for (let j = i; j < i + 3; ++j) {
        const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
        const u = ax > ay && ax > az ? z : x;
        const v = ay > ax && ay > az ? -z : y;
        uvs[j*2] = u/repeat; uvs[j*2+1] = v/repeat;
      }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(geo);
    triangles += pos.count / 3;
    objects++;
  });
  }
  processRoot(gltfScene, false);
  if (architecture) processRoot(architecture, true);
  for (const [key, items] of batches) {
    const mesh = new THREE.Mesh(mergeGeometries(items, false), finish(key));
    mesh.name = 'ERL_' + key;
    mesh.castShadow = !['GROUND','GRASS','GRAVEL','WATER','JET','GLASS'].includes(key);
    mesh.receiveShadow = true;
    group.add(mesh);
    for (const item of items) item.dispose();
  }
  scene.add(group);
  for (const geo of sourceMeshes) geo.dispose();
  for (const mat of sourceMaterials) mat.dispose();
  return {group, objects, triangles, drawCalls: batches.size};
}
