import {PLAYER, SPAWN} from './world-layout.js';

const WALK_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
const STEP = 1 / 120, MAX_PITCH = Math.PI * 85 / 180;
const GRAVITY=18.5, JUMP_SPEED=6.74, JUMP_BUFFER=.145, COYOTE=.088, DOWN_SNAP=.103;
const clamp = (v, max) => Math.min(max, Math.max(-max, v));

export function createPlayer(T, camera, world, floorHeight, onStep=()=>{}, ceilingHeight=()=>Infinity,
  {moveWorld=()=>world,traverse,stepDown}= {}) {
  const body = new T.Group();
  const look = new T.Group();
  look.position.y = PLAYER.eye;
  body.add(look); look.add(camera);
  let x = SPAWN.x, z = SPAWN.z, y = floorHeight(x, z);
  if (!Number.isFinite(y)) throw new Error('Spawn has no walk surface');
  const safe = {x, y, z,base:y};
  const next = {x, z};
  let yaw = SPAWN.yaw, pitch = SPAWN.pitch;
  let lastTime=null,accumulator=0,vx=0,vz=0,vy=0,buffer=0,coyote=COYOTE,stepDistance=.29,foot=1,grounded=true;
  let groundY=y,baseY=y,px=x,py=y,pz=z;
  const motion={grounded:true,speed:0,land:0,climbing:false};
  body.position.set(x, y, z);
  function aim(dx, dy) {
    yaw = (yaw - dx) % (2 * Math.PI);
    pitch = clamp(pitch - dy, MAX_PITCH);
    body.rotation.y = yaw;
    look.rotation.x = pitch;
  }
  aim(0, 0);
  return {
    body,aim,motion,
    jump(){buffer=JUMP_BUFFER},
    stop(){lastTime=null;accumulator=0;buffer=0;px=x;py=y;pz=z;},
    tick(time, keys, stick) {
      if(lastTime!==null)accumulator+=Math.min(.12,Math.max(0,(time-lastTime)/1000));
      lastTime = time;
      let moved = false;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        px=x;py=y;pz=z;
        const turn = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
        const tilt = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
        if (turn || tilt) { aim(turn * STEP * 1.48, tilt * STEP * 1.18); moved = true; }
        const east = Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + stick.x;
        const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS')) - stick.y;
        const intent=Math.hypot(east, forward), pace=keys.has('ShiftLeft') || keys.has('ShiftRight') || stick.run ? PLAYER.run : PLAYER.speed;
        const sin=Math.sin(yaw),cos=Math.cos(yaw),scale=pace/Math.max(1,intent);
        const tx=(east*cos-forward*sin)*scale,tz=(-east*sin-forward*cos)*scale;
        if(traverse){
          next.x=x;next.y=y;next.z=z;next.tread=false;
          const state=traverse(next,forward,tz,STEP);
          motion.climbing=state===1;
          if(state){
            x=next.x;y=baseY=groundY=next.y;z=next.z;
            vx=vz=vy=buffer=coyote=stepDistance=0;grounded=state===2;
            motion.grounded=grounded;motion.speed=0;motion.land=0;
            if(state===2)Object.assign(safe,{x,y,z,base:baseY});
            if(next.tread)onStep({kind:'climb',x,y,z,power:.49,foot:(foot=-foot)});
            if(Math.abs(x-px)+Math.abs(y-py)+Math.abs(z-pz)>1e-6)moved=true;
            continue;
          }
        }
        coyote=grounded?COYOTE:Math.max(0,coyote-STEP);
        if(buffer>0&&coyote>0){
          vy=JUMP_SPEED;grounded=false;buffer=coyote=0;stepDistance=0;
          onStep({kind:'jump',x,y,z,power:.56,foot});
        }else buffer=Math.max(0,buffer-STEP);
        // Firm braking on the ground, momentum and limited steering in air.
        const blend=1-Math.exp(-(grounded?(intent?(tx*vx+tz*vz<-.1?27:23):30):(intent?4.35:.43))*STEP);
        vx+=(tx-vx)*blend;vz+=(tz-vz)*blend;
        if(Math.hypot(vx,vz)>.017){
          next.x=x;next.z=z;next.y=baseY;next.feet=y;
          const collision=moveWorld(next);
          collision.move(next, vx*STEP, vz*STEP);
          const dx=next.x-x,dz=next.z-z;
          if(Math.abs(dx)+Math.abs(dz)<1e-6){vx=vz=0}
          else{
            const h=floorHeight(next.x,next.z,baseY);
            const headLimit=(y>baseY+.14||!grounded)?ceilingHeight(next.x,next.z,h)-PLAYER.eye-.105:Infinity;
            const floor=collision.standingHeight?.(next,h,Math.min(headLimit,y+(grounded?PLAYER.maxStep:.03)))??h;
            if(Number.isFinite(floor)&&floor<=y+(grounded?PLAYER.maxStep:.052)&&y<=headLimit+.04){
              x=next.x;z=next.z;baseY=h;groundY=floor;
              // Contacts project out the blocked velocity instead of
              // storing it against a wall between ticks.
              const a=dx/STEP,b=dz/STEP;
              if(Math.abs(a-vx)+Math.abs(b-vz)>.1){vx=a;vz=b}
            }else{vx=vz=0}
          }
        }
        if(grounded&&groundY<y-(stepDown?.(x,z,baseY)??DOWN_SNAP)){grounded=false;vy=0}
        if(grounded){y=groundY;vy=0}
        else{
          vy-=GRAVITY*STEP;
          y+=vy*STEP;
          const headLimit=ceilingHeight(x,z,baseY)-PLAYER.eye-.11;
          if(y>headLimit){y=Math.max(groundY,headLimit);vy=Math.min(0,vy);}
          if(vy<=0){
            next.x=x;next.z=z;next.y=baseY;
            groundY=moveWorld(next).standingHeight?.(next,baseY,Math.min(py+.028,headLimit))??baseY;
          }
          if(y<=groundY&&vy<=0){
            const impact=Math.min(1.28,Math.abs(vy)/5);
            y=groundY;vy=0;grounded=true;stepDistance=0;motion.land=impact;
            if(impact>.22)onStep({kind:'land',x,y,z,power:impact,foot});
          }
        }
        if(!Number.isFinite(y)||y<groundY-3){
          ({x,y,z}=safe);baseY=safe.base;groundY=y;vx=vz=vy=0;grounded=true;
        }
        const distance=Math.hypot(x-px,z-pz);
        motion.speed=distance/STEP;motion.grounded=grounded;
        motion.land*=Math.exp(-STEP*13);
        if(grounded){
          Object.assign(safe,{x,y,z,base:baseY});
          stepDistance+=distance;
          const stride=pace===PLAYER.run?.93:.68;
          if(motion.speed>.42&&stepDistance>=stride){
            stepDistance-=stride;foot=-foot;
            onStep({kind:'step',x,y,z,power:Math.min(1.18,.33+motion.speed*.118),foot});
          }
        }else stepDistance=0;
        if(distance>1e-6||Math.abs(y-py)>1e-6||motion.land>.005)moved=true;
      }
      const alpha=accumulator/STEP;
      const bx=px+(x-px)*alpha,by=py+(y-py)*alpha,bz=pz+(z-pz)*alpha;
      if(Math.abs(body.position.x-bx)+Math.abs(body.position.y-by)+Math.abs(body.position.z-bz)>1e-6){
        body.position.set(bx,by,bz);moved=true;
      }
      return moved;
    }
  };
}

export function bindPlayerInput({canvas, pad, jumpButton, player, active, pause, refresh, mode}) {
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
    if(event.code==='Space'&&!event.target.closest?.('button, input, select, textarea, a')){
      event.preventDefault();if(!event.repeat)player.jump();return;
    }
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
  jumpButton?.addEventListener('pointerdown',event=>{
    if(!active()||event.pointerType!=='touch')return;
    event.preventDefault();player.jump();
  });
  jumpButton?.addEventListener('click',event=>{if(active()&&event.detail===0)player.jump()});
  pad.addEventListener('pointermove', event => { if (event.pointerId === moveId) moveStick(event); });
  for (const target of [canvas, pad]) for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    target.addEventListener(event, e => {
      if (e.pointerId === drag.id) drag.id = null;
      if (e.pointerId === moveId) { moveId = moveTarget = null; clearStick(); }
    });
  }
  return {start, clear, tick: time => player.tick(time, keys, stick)};
}
