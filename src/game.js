import {
  createOffice,
  project,
  screenToWorld,
  drawFloor,
  drawFurniture,
} from "./office.js";
import { Game, MOVES, WORLD } from "./engine.js";
import { createAtlases, frameIndex, rect, text, poly } from "./art.js";
const $ = (s) => document.querySelector(s),
  canvas = $("#game"),
  ctx = canvas.getContext("2d");
const game = new Game(),
  atlases = createAtlases(),
  office = createOffice();
ctx.imageSmoothingEnabled = false;
let camera = 0,
  clock = 0,
  last = 0,
  accumulator = 0,
  paused = false,
  hitStop = 0,
  shake = 0,
  particles = [],
  floaters = [],
  endTimer = 0;
const keys = new Set(),
  input = { x: 0, y: 0 };
let joystick = null,
  joy = { x: 0, y: 0 },
  soundEnabled = false,
  audio = null;
const blockPointers = new Set();
function tone(
  freq,
  duration = 0.07,
  type = "square",
  volume = 0.035,
  slide = 0,
) {
  if (!soundEnabled) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audio.currentTime);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        slide,
        audio.currentTime + duration,
      );
    g.gain.setValueAtTime(volume, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + duration);
  } catch {
    soundEnabled = false;
  }
}
function burst(x, y, colors, count = 14, power = 120) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * power * (0.3 + Math.random() * 0.7),
      vy: Math.sin(angle) * power - 40,
      life: 0.22 + Math.random() * 0.35,
      size: 1 + Math.floor(Math.random() * 3),
      color: colors[i % colors.length],
    });
  }
}
function float(str, x, y, color = "#f8d18c") {
  floaters.push({ str, x, y, color, life: 0.8 });
}
function events() {
  for (const e of game.events) {
    if (e.type === "hit") {
      shake = e.heavy ? 5 : 2.5;
      hitStop = e.heavy ? 0.065 : 0.035;
      const q = project(e.x, e.y + 44, camera);
      burst(
        q.x,
        q.y - 44,
        ["#fff4c9", "#edb66f", "#e1795c"],
        e.heavy ? 22 : 12,
      );
      tone(e.heavy ? 110 : 180, 0.09, "sawtooth", 0.06, 45);
      if (e.hero) float("-HP", q.x, q.y - 64, "#f19484");
    } else if (e.type === "block") {
      const q = project(e.x, e.y + 42, camera);
      burst(
        q.x + game.player.face * 15,
        q.y - 42,
        ["#e6faff", "#87c4ed"],
        9,
        80,
      );
      tone(e.parry ? 800 : 340, 0.1, "triangle");
      if (e.parry) float("PARRY", q.x, q.y - 65, "#9de4ff");
    } else if (e.type === "guardbreak") {
      float("GUARD BREAK", 320, 160, "#e89478");
    } else if (e.type === "jump") {
      tone(200, 0.1, "triangle", 0.02, 420);
    } else if (e.type === "swing") tone(220, 0.045, "triangle", 0.025, 80);
    else if (e.type === "debris") {
      const q = project(e.x, e.y + 25, camera);
      burst(
        q.x,
        q.y - 25,
        e.plant
          ? ["#80a782", "#b08065", "#d3b08b"]
          : ["#b1d9cb", "#557c8b", "#e0d8bd"],
        20,
        140,
      );
    } else if (e.type === "break") {
      tone(90, 0.2, "sawtooth", 0.035, 20);
      const q = project(game.player.x, game.player.y, camera);
      float("PROPERTY DAMAGE", q.x, q.y - 85);
    } else if (e.type === "heal") {
      const q = project(e.x, e.y + 65, camera);
      float("COFFEE +22 HP", q.x, q.y - 65, "#9ee6ba");
      tone(660, 0.12, "sine", 0.04, 990);
    } else if (e.type === "dodge") {
      burst(game.player.x, game.player.y - 2, ["#8cacaa", "#c3bfa4"], 6, 45);
      tone(300, 0.12, "triangle", 0.02, 80);
    } else if (e.type === "clear") {
      tone(440, 0.2, "triangle", 0.04, 880);
    } else if (e.type === "end") {
      endTimer = 0.85;
      tone(e.win ? 440 : 180, 0.5, "triangle", 0.04, e.win ? 880 : 45);
    }
  }
  game.events.length = 0;
}
function clearInput() {
  keys.clear();
  blockPointers.clear();
  joy = { x: 0, y: 0 };
  joystick = null;
  $("#knob").style.transform = "";
  document
    .querySelectorAll(".pressed")
    .forEach((b) => b.classList.remove("pressed"));
}
function setPause(value) {
  if (game.status !== "playing") return;
  paused = value;
  clearInput();
  game.buffer = null;
  $("#pausePanel").hidden = !paused;
  $("#pause").textContent = paused ? "▶" : "Ⅱ";
  last = 0;
  accumulator = 0;
}
$("#pause").onclick = () => setPause(!paused);
$("#resume").onclick = () => setPause(false);
$("#sound").onclick = () => {
  soundEnabled = !soundEnabled;
  $("#sound").textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";
  $("#sound").setAttribute(
    "aria-label",
    soundEnabled ? "Disable sound" : "Enable sound",
  );
  if (soundEnabled) tone(440, 0.1, "triangle");
};
$("#start").onclick = () => {
  game.start();
  clearInput();
  particles = [];
  floaters = [];
  camera = 0;
  endTimer = 0;
  hitStop = 0;
  shake = 0;
  paused = false;
  last = 0;
  accumulator = 0;
  $("#overlay").hidden = true;
  $("#pausePanel").hidden = true;
  $("#pause").textContent = "Ⅱ";
  tone(330, 0.15, "triangle", 0.035, 660);
  canvas.focus({ preventScroll: true });
};
function endScreen() {
  const win = game.status === "won";
  $("#overlay").hidden = false;
  $(".eyebrow").textContent = win
    ? "FLOOR 01 · SHIFT COMPLETE"
    : "FLOOR 01 · TRY AGAIN";
  $("h1").innerHTML = win
    ? "CLOCKED<br><span>OUT.</span>"
    : "YOU’RE<br><span>FIRED.</span>";
  $("#description").innerHTML =
    `${win ? "Management has been overruled." : "A tactical coffee break might help."}<br>Score ${String(game.score).padStart(6, "0")} · ${game.kills}/8 defeated · Best combo ${game.bestCombo}`;
  $("#start").innerHTML = "ANOTHER SHIFT <span>↻</span>";
  $(".small").textContent = win
    ? `Cleared in ${Math.floor(game.time / 60)}:${String(Math.floor(game.time % 60)).padStart(2, "0")} · Try for a higher score.`
    : "Hold BLOCK facing danger. JUMP + ATTACK for a flying kick.";
  $(".stamp").style.display = "none";
}
const actionKeys = {
  KeyJ: "jump",
  KeyZ: "jump",
  Space: "jump",
  KeyK: "attack",
  KeyX: "attack",
};
window.addEventListener("keydown", (e) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
      e.code,
    )
  )
    e.preventDefault();
  if (e.code === "Escape" || e.code === "KeyP") {
    if (!e.repeat) setPause(!paused);
    return;
  }
  keys.add(e.code);
  if (actionKeys[e.code] && !e.repeat && !paused)
    game.queue(actionKeys[e.code]);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  clearInput();
  setPause(true);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInput();
    setPause(true);
  }
});
const stick = $("#stick");
function moveStick(e) {
  const box = stick.getBoundingClientRect(),
    dx = e.clientX - box.left - box.width / 2,
    dy = e.clientY - box.top - box.height / 2,
    len = Math.hypot(dx, dy),
    radius = 32,
    mag = Math.min(1, len / radius);
  joy = len > 7 ? { x: (dx / len) * mag, y: (dy / len) * mag } : { x: 0, y: 0 };
  $("#knob").style.transform = `translate(${joy.x * 26}px,${joy.y * 26}px)`;
}
stick.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (joystick !== null) return;
  joystick = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  moveStick(e);
});
stick.addEventListener("pointermove", (e) => {
  if (e.pointerId === joystick) moveStick(e);
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  stick.addEventListener(name, (e) => {
    if (e.pointerId === joystick) {
      joystick = null;
      joy = { x: 0, y: 0 };
      $("#knob").style.transform = "";
    }
  });
document.querySelectorAll("[data-action]").forEach((button) => {
  const active = new Set();
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    active.add(e.pointerId);
    button.setPointerCapture(e.pointerId);
    button.classList.add("pressed");
    if (button.dataset.action === "block") blockPointers.add(e.pointerId);
    else if (!paused) game.queue(button.dataset.action);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, (e) => {
      active.delete(e.pointerId);
      blockPointers.delete(e.pointerId);
      if (!active.size) button.classList.remove("pressed");
    });
});
window.addEventListener("contextmenu", (e) => e.preventDefault());
function shadow(x, y, width = 20, alpha = 0.28) {
  ctx.fillStyle = `rgba(10,29,38,${alpha})`;
  ctx.fillRect(Math.round(x - width), Math.round(y - 2), width * 2, 5);
  ctx.fillRect(Math.round(x - width + 4), Math.round(y - 4), width * 2 - 8, 8);
}
function drawActor(a) {
  const ground = project(a.x, a.y, camera),
    q = { x: ground.x, y: ground.y - (a.z || 0) };
  const scale = a.type === "boss" ? 1.12 : 1,
    wide = scale * 0.78;
  const sprite =
    atlases[a.type][a.state]?.[frameIndex(a)] || atlases[a.type].idle[0];
  shadow(ground.x, ground.y, 15, a.dead ? 0.12 : 0.3);
  ctx.save();
  ctx.translate(Math.round(q.x), Math.round(q.y));
  ctx.scale(a.face, 1);
  if (a.inv > 0 && a.type === "hero" && Math.floor(clock * 20) % 2 === 0)
    ctx.globalAlpha = 0.5;
  ctx.drawImage(
    sprite,
    Math.round(-39 * wide),
    Math.round(-85 * scale),
    Math.round(96 * wide),
    Math.round(92 * scale),
  );
  ctx.restore();
  if (!a.dead && a.type !== "hero") {
    if (a.hp < a.maxHp) {
      rect(ctx, q.x - 14, q.y - 86 * scale, 28, 3, "#1b2033");
      rect(
        ctx,
        q.x - 14,
        q.y - 86 * scale,
        (28 * a.hp) / a.maxHp,
        2,
        "#d8a189",
      );
    }
    const m = MOVES[a.state];
    if (m && a.time < m.active)
      text(ctx, "!", q.x, q.y - 88 * scale, 12, "#f4c782", "center");
  }
  if (a === game.player) {
    const m = MOVES[a.state];
    if (m && a.time >= m.active && a.time < m.end) {
      const d = a.face;
      poly(
        ctx,
        [
          [q.x + d * 14, q.y - 48],
          [q.x + d * 38, q.y - 53],
          [q.x + d * 49, q.y - 42],
          [q.x + d * 37, q.y - 35],
          [q.x + d * 41, q.y - 42],
          [q.x + d * 31, q.y - 48],
        ],
        "#f2e7cf",
      );
    }
    // A subtle ground marker keeps the player identifiable behind foreground desks.
    rect(ctx, ground.x - 8, ground.y + 5, 16, 1, "#eadc9c");
  }
}
function hud() {
  const p = game.player;
  rect(ctx, 10, 10, 173, 29, "#111b2ddc");
  text(ctx, "EMPLOYEE", 17, 21, 8, "#eee8d6");
  rect(ctx, 17, 26, 156, 6, "#4e3d4a");
  rect(ctx, 18, 27, (154 * p.hp) / p.maxHp, 4, "#d86656");
  rect(ctx, 17, 35, 156, 2, "#303f57");
  rect(ctx, 17, 35, (156 * p.guard) / 100, 2, "#7ea7d3");
  rect(ctx, 451, 10, 179, 29, "#111b2ddc");
  text(ctx, "FLOOR 01", 461, 21, 8, "#d0dbdc");
  text(
    ctx,
    String(game.score).padStart(6, "0"),
    621,
    33,
    12,
    "#ead3a3",
    "right",
  );
  text(ctx, "DAMAGE $" + game.damageValue, 461, 33, 6, "#a8b8cc");
  if (game.combo > 1 && game.time < game.comboUntil)
    text(ctx, game.combo + " HITS", 618, 62, 17, "#f1ce8b", "right");
  if (game.messageUntil > game.time) {
    rect(ctx, 135, 48, 370, 18, "#192337dc");
    text(ctx, game.message, 320, 60, 8, "#dfe1d9", "center");
  }
  const boss = game.enemies.find((e) => e.type === "boss" && !e.dead);
  if (boss) {
    rect(ctx, 211, 334, 218, 13, "#162030dd");
    rect(ctx, 216, 339, (208 * boss.hp) / boss.maxHp, 4, "#b35c63");
    text(ctx, "FLOOR MANAGER", 320, 331, 7, "#ddd4bd", "center");
  } else if (game.cleared > 0 && !game.locked)
    text(
      ctx,
      game.cleared === 3 ? "EXIT ↗" : "GO ↗",
      555,
      103,
      13,
      "#eee2b5",
    );
}
function render() {
  ctx.imageSmoothingEnabled = false;
  rect(ctx, 0, 0, 640, 360, "#101b2f");
  ctx.save();
  if (shake)
    ctx.translate(
      Math.round((Math.random() - 0.5) * shake * 2),
      Math.round((Math.random() - 0.5) * shake),
    );
  drawFloor(ctx, office, camera);
  const decorations = [
    ...office.decorations,
    { x: 1910, y: 250, type: "elevator" },
  ];
  const all = [
    ...decorations.map((d) => ({ depth: project(d.x, d.y, camera).y, d })),
    ...game.props.map((d) => ({ depth: project(d.x, d.y, camera).y, d })),
    ...game.enemies.map((a) => ({ depth: project(a.x, a.y, camera).y, a })),
    { depth: project(game.player.x, game.player.y, camera).y, a: game.player },
  ].sort((a, b) => a.depth - b.depth);
  for (const item of all) {
    if (item.a) drawActor(item.a);
    else {
      const q = project(item.d.x, item.d.y, camera),
        p = project(game.player.x, game.player.y, camera);
      const obscures =
        item.d.type === "cubicle" &&
        Math.abs(q.x - p.x) < 95 &&
        q.y > p.y &&
        q.y - p.y < 75;
      drawFurniture(ctx, office, item.d, camera, obscures ? 0.38 : 1);
    }
  }
  for (const item of game.pickups)
    if (!item.taken) {
      const q = project(item.x, item.y, camera),
        y = q.y + Math.sin(clock * 5) * 2;
      rect(ctx, q.x - 4, y - 13, 8, 11, "#ddd9b8");
      rect(ctx, q.x + 4, y - 11, 3, 6, "#a8b8b9");
      rect(ctx, q.x - 2, y - 13, 4, 2, "#5b4644");
    }
  if (game.locked) {
    const q = project(game.rightLimit + 10, 300, camera);
    text(ctx, "CLEAR AREA", q.x, q.y - 30, 7, "#daa38c", "center");
  }
  if (game.cleared === 3) {
    const q = project(1910, 250, camera);
    rect(ctx, q.x - 8, q.y - 95, 25, 80, "#14273a");
    text(ctx, "EXIT", q.x, q.y - 104, 9, "#a8dfb8", "center");
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life * 4);
    rect(ctx, p.x, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 3);
    text(ctx, f.str, f.x, f.y, 8, f.color, "center");
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  hud();
}
function loop(now) {
  const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  if (!paused) {
    clock += elapsed;
    if (game.status === "lost" || game.status === "won") {
      for (const a of [game.player, ...game.enemies])
        if (a.dead) a.time += elapsed;
    }
    shake = Math.max(0, shake - elapsed * 35);
    if (hitStop > 0) {
      hitStop -= elapsed;
      accumulator = 0;
    } else {
      accumulator += elapsed;
      while (accumulator >= 1 / 60) {
        input.x =
          joy.x +
          (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
          (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
        input.y =
          joy.y +
          (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
          (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
        const movement = screenToWorld(input.x, input.y);
        input.block =
          keys.has("KeyL") || keys.has("KeyC") || blockPointers.size > 0;
        game.step(1 / 60, { ...movement, block: input.block });
        events();
        accumulator -= 1 / 60;
      }
    }
    const target = Math.max(
      0,
      Math.min(WORLD.width - 400, game.player.x - 200),
    );
    camera += (target - camera) * Math.min(1, elapsed * 8);
    for (const p of particles) {
      p.life -= elapsed;
      p.x += p.vx * elapsed;
      p.y += p.vy * elapsed;
      p.vy += 360 * elapsed;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const f of floaters) {
      f.life -= elapsed;
      f.y -= elapsed * 27;
    }
    floaters = floaters.filter((f) => f.life > 0);
    if (endTimer > 0) {
      endTimer -= elapsed;
      if (endTimer <= 0) endScreen();
    }
  }
  render();
  requestAnimationFrame(loop);
}
// Opt-in inspection surface used by browser regression tests and the sprite gallery.
if (new URLSearchParams(location.search).has("debug"))
  window.__office = {
    game,
    atlases,
    frameIndex,
    render,
    get paused() {
      return paused;
    },
    setPause,
    input,
    joy: () => joy,
    canvas,
    project,
  };
requestAnimationFrame(loop);
