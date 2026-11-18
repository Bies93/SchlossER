import {PLAYER, SPAWN} from './world-layout.js';

const WALK_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
const STEP = 1 / 60, MAX_PITCH = Math.PI * 85 / 180;
const clamp = (v, max) => Math.min(max, Math.max(-max, v));

export function createPlayer(T, camera, world, floorHeight) {
  const body = new T.Group();
  const look = new T.Group();
  look.position.y = PLAYER.eye;
  body.add(look); look.add(camera);
  let x = SPAWN.x, z = SPAWN.z, y = floorHeight(x, z);
  if (!Number.isFinite(y)) throw new Error('Spawn has no walk surface');
  const safe = {x, y, z};
  const next = {x, z};
  let yaw = SPAWN.yaw, pitch = SPAWN.pitch;
  let lastTime = null, accumulator = 0, vx=0, vz=0;
  body.position.set(x, y, z);
  function aim(dx, dy) {
    yaw = (yaw - dx) % (2 * Math.PI);
    pitch = clamp(pitch - dy, MAX_PITCH);
    body.rotation.y = yaw;
    look.rotation.x = pitch;
  }
  aim(0, 0);
  return {
    body, aim,
    stop() { lastTime = null; accumulator = 0; vx=vz=0; },
    tick(time, keys, stick) {
      if (lastTime !== null) accumulator += Math.min(.1, (time - lastTime) / 1000);
      lastTime = time;
      let moved = false;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const turn = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
        const tilt = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
        if (turn || tilt) { aim(turn * STEP * 1.48, tilt * STEP * 1.18); moved = true; }
        const east = Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + stick.x;
        const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS')) - stick.y;
        const intent=Math.hypot(east, forward), pace=keys.has('ShiftLeft') || keys.has('ShiftRight') || stick.run ? PLAYER.run : PLAYER.speed;
        const sin=Math.sin(yaw),cos=Math.cos(yaw),scale=pace/Math.max(1,intent);
        const tx=(east*cos-forward*sin)*scale,tz=(-east*sin-forward*cos)*scale;
        // Fast controlled acceleration; slightly stronger braking keeps
        // the rig responsive at a door, bench or tight street corner.
        const blend=1-Math.exp(-(intent?(tx*vx+tz*vz<-.1?20:15):24)*STEP);
        vx+=(tx-vx)*blend;vz+=(tz-vz)*blend;
        if (Math.hypot(vx,vz)>.022) {
          next.x = x; next.z = z;
          world.move(next, vx*STEP, vz*STEP);
          if (Math.abs(next.x - x) + Math.abs(next.z - z) < 1e-6) {vx=vz=0;continue}
          const height = floorHeight(next.x, next.z);
          if (Number.isFinite(height) && Math.abs(height - y) <= PLAYER.maxStep) {
            x = next.x; z = next.z; y = height;
            Object.assign(safe, {x, y, z});
          } else if (!Number.isFinite(height)) {
            ({x, y, z} = safe);
            vx=vz=0;
          }else{vx=vz=0}
          moved = true;
        }
      }
      body.position.set(x, y, z);
      return moved;
    }
  };
}

export function bindPlayerInput({canvas, pad, player, active, pause, refresh, mode}) {
  const keys = new Set(), stick = {x: 0, y: 0, run:false};
  const drag = {id: null, x: 0, y: 0};
  let moveId = null, moveTarget = null, originX = 0, originY = 0, awaitingLock = false;
  const nub = pad.firstElementChild;
  const locked = () => document.pointerLockElement === canvas;
  const clearStick = () => {
    stick.x = stick.y = 0;
    stick.run = false;
    nub.style.transform = '';
  };
  function clear() {
    keys.clear(); player.stop(); awaitingLock = false;
    if (drag.id !== null && canvas.hasPointerCapture(drag.id)) canvas.releasePointerCapture(drag.id);
    if (moveId !== null && moveTarget.hasPointerCapture(moveId)) moveTarget.releasePointerCapture(moveId);
    drag.id = moveId = null;
    moveTarget = null;
    clearStick();
    if (locked()) document.exitPointerLock();
  }
  const fallback = () => {
    if (!awaitingLock || !active()) return;
    awaitingLock = false; mode('drag');
  };
  function start({touch, lock}) {
    mode(touch ? 'touch' : 'drag');
    canvas.focus({preventScroll: true});
    if (!touch && lock && canvas.requestPointerLock) {
      awaitingLock = true;
      try { canvas.requestPointerLock()?.catch(fallback); }
      catch { fallback(); }
    }
  }
  document.addEventListener('pointerlockchange', () => {
    if (locked()) {
      awaitingLock = false;
      if (active()) mode('mouse');
      else document.exitPointerLock();
    } else if (active() && document.body.dataset.input === 'mouse') pause();
  });
  document.addEventListener('pointerlockerror', fallback);
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('keydown', event => {
    if (!active() || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.code === 'Escape') { pause(); return; }
    if (!WALK_KEYS.has(event.code) || event.target.closest?.('button, input, select, textarea, a')) return;
    event.preventDefault();
    keys.add(event.code);
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  document.addEventListener('mousemove', event => {
    if (!active() || !locked()) return;
    player.aim(clamp(event.movementX, 200) * .0022, clamp(event.movementY, 200) * .0022);
    refresh();
  });
  canvas.addEventListener('pointerdown', event => {
    if (!active() || locked() || drag.id !== null) return;
    const touch = event.pointerType === 'touch';
    if(event.button!==0&&(touch||event.button!==2))return;
    mode(touch ? 'touch' : 'drag');
    // On touch, the left half moves; the right half looks.
    if (touch && event.clientX < canvas.getBoundingClientRect().left + canvas.clientWidth / 2) {
      if (moveId === null) startStick(event);
      return;
    }
    // Suppressing a mouse pointerdown also suppresses its compatibility
    // mousedown, which the viewmodel needs for independent mouse buttons.
    if(touch)event.preventDefault();
    Object.assign(drag, {id: event.pointerId, x: event.clientX, y: event.clientY});
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId === moveId) { moveStick(event); return; }
    if (event.pointerId !== drag.id) return;
    const speed = event.pointerType === 'touch' ? .005 : .003;
    player.aim((event.clientX - drag.x) * speed, (event.clientY - drag.y) * speed);
    drag.x = event.clientX; drag.y = event.clientY;
    refresh();
  });
  function startStick(event) {
    if (!active() || moveId !== null || event.button !== 0) return;
    event.preventDefault();
    mode('touch');
    moveId = event.pointerId;
    moveTarget = event.currentTarget;
    const rect = pad.getBoundingClientRect();
    originX = moveTarget === pad ? rect.left + rect.width / 2 : event.clientX;
    originY = moveTarget === pad ? rect.top + rect.height / 2 : event.clientY;
    moveTarget.setPointerCapture(moveId);
    moveStick(event);
  }
  function moveStick(event) {
    const rect = pad.getBoundingClientRect(), radius = rect.width * .40;
    if (!radius) return;
    const x = (event.clientX - originX) / radius;
    const y = (event.clientY - originY) / radius;
    const distance = Math.hypot(x, y);
    // Full extension sprints; hysteresis keeps the threshold steady on touch.
    stick.run = distance > (stick.run ? 1.03 : 1.22);
    const scale = distance > .11 ? (Math.min(1, distance) - .11) / (.89 * distance) : 0;
    stick.x = x * scale; stick.y = y * scale;
    nub.style.transform = 'translate(' + stick.x * radius + 'px,' + stick.y * radius + 'px)';
  }
  pad.addEventListener('pointerdown', startStick);
  pad.addEventListener('pointermove', event => { if (event.pointerId === moveId) moveStick(event); });
  for (const target of [canvas, pad]) for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    target.addEventListener(event, e => {
      if (e.pointerId === drag.id) drag.id = null;
      if (e.pointerId === moveId) { moveId = moveTarget = null; clearStick(); }
    });
  }
  return {start, clear, tick: time => player.tick(time, keys, stick)};
}
