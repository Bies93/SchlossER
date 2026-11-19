// X/Z plan collision for a standing player. Local underground obstacles may
// opt into the movement layer supplied by the player; most are ground level.
export function collisionWorld(bounds, radius, contains, staticEnabled=()=>true) {
  const cellSize = 8, grid = new Map();
  const cell = v => Math.floor(v / cellSize);
  const key = (x, z) => x + ':' + z;
  function insert(minX, minZ, maxX, maxZ, contact) {
    for (let ix = cell(minX - radius); ix <= cell(maxX + radius); ix++) {
      for (let iz = cell(minZ - radius); iz <= cell(maxZ + radius); iz++) {
        const id = key(ix, iz);
        if (!grid.has(id)) grid.set(id, []);
        grid.get(id).push(contact);
      }
    }
  }
  const polygon = (vertices,enabled=staticEnabled) => {
    let v = vertices;
    const area = v.reduce((sum, a, i) => {
      const b = v[(i + 1) % v.length];
      return sum + a[0] * b[1] - a[1] * b[0];
    }, 0);
    if (area < 0) v = [...v].reverse();
    const edges = v.map(([x, z], i) => {
      const b = v[(i + 1) % v.length], dx = b[0] - x, dz = b[1] - z;
      const length = Math.hypot(dx, dz);
      return {x, z, dx, dz, len2: length * length, nx: dz / length, nz: -dx / length};
    }).filter(e => e.len2 > 0);
    const xs = v.map(p => p[0]), zs = v.map(p => p[1]);
    insert(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), p => {
      if(!enabled(p))return false;
      let side = -Infinity, nearest, distance2 = Infinity, offX, offZ;
      for (const e of edges) {
        const dx = p.x - e.x, dz = p.z - e.z, d = dx * e.nx + dz * e.nz;
        if (d > side) { side = d; nearest = e; }
        const t = Math.min(1, Math.max(0, (dx * e.dx + dz * e.dz) / e.len2));
        const x = dx - t * e.dx, z = dz - t * e.dz, dd = x*x + z*z;
        if (dd < distance2) { distance2 = dd; offX = x; offZ = z; }
      }
      if (side <= 0) {
        p.x += nearest.nx * (radius - side);
        p.z += nearest.nz * (radius - side);
      } else if (distance2 < radius * radius - 1e-10) {
        const correction = radius / Math.sqrt(distance2) - 1;
        p.x += offX * correction;
        p.z += offZ * correction;
      } else return false;
      return true;
    });
  };
  function clamp(p) {
    p.x = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, p.x));
    p.z = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, p.z));
  }
  return {
    polygon,
    box: (x0, z0, x1, z1,enabled) => polygon([[x0,z0],[x1,z0],[x1,z1],[x0,z1]],enabled),
    // The broad phase covers the full sweep; the narrow phase uses the
    // current rigid rectangle instead of leaving an invisible closed gate.
    movingBox(x0,z0,x1,z1,pose,enabled=()=>true){
      insert(x0,z0,x1,z1,p=>{
        if(!enabled(p))return false;
        const {x,z,ux,uz,half,depth}=pose;
        const dx=p.x-x,dz=p.z-z,u=dx*ux+dz*uz,v=-dx*uz+dz*ux;
        const cu=Math.max(-half,Math.min(half,u)),cv=Math.max(-depth,Math.min(depth,v));
        let a=u-cu,b=v-cv;
        const d=Math.hypot(a,b);
        if(d>=radius-1e-8)return false;
        if(d>1e-8){a*=(radius-d)/d;b*=(radius-d)/d;}
        else if(half-Math.abs(u)<depth-Math.abs(v))a=(u<0?-1:1)*(half-Math.abs(u)+radius);
        else b=(v<0?-1:1)*(depth-Math.abs(v)+radius);
        p.x+=a*ux-b*uz;p.z+=a*uz+b*ux;
        return true;
      });
    },
    circle(x, z, r,enabled=staticEnabled) {
      insert(x-r, z-r, x+r, z+r, p => {
        if(!enabled(p))return false;
        const dx = p.x - x, dz = p.z - z, limit = r + radius, d2 = dx*dx + dz*dz;
        if (d2 >= limit * limit - 1e-10) return false;
        const d = Math.sqrt(d2);
        p.x = x + (d ? dx / d : 1) * limit;
        p.z = z + (d ? dz / d : 0) * limit;
        return true;
      });
    },
    blocked(x,z,y=0) {
      if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||(contains&&!contains(x,z)))return true;
      const point={x,z,y};
      return (grid.get(key(cell(x),cell(z)))??[]).some(resolve=>resolve(point));
    },
    move(p, dx, dz) {
      // Steps of at most 5 cm, followed by contact projection for wall sliding.
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .05));
      for (let i = 0; i < steps; i++) {
        const x = p.x, z = p.z;
        p.x += dx / steps; p.z += dz / steps;
        for (let pass = 0; pass < 6; pass++) {
          clamp(p);
          let hit = false;
          for (const resolve of grid.get(key(cell(p.x), cell(p.z))) ?? []) {
            if (resolve(p)) hit = true;
          }
          if (!hit) break;
          if (pass === 5) { p.x = x; p.z = z; }
        }
        if (contains && !contains(p.x,p.z)) { p.x = x; p.z = z; }
      }
    }
  };
}
