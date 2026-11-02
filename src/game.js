import { Game, MOVES, WORLD } from "./engine.js";
import {
  createAtlases,
  createOffice,
  frameIndex,
  rect,
  text,
  drawProp,
  poly,
} from "./art.js";
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
      burst(e.x, e.y, ["#fff4c9", "#edb66f", "#e1795c"], e.heavy ? 22 : 12);
      tone(e.heavy ? 110 : 180, 0.09, "sawtooth", 0.06, 45);
      if (e.hero) float("-HP", e.x, e.y - 20, "#f19484");
    } else if (e.type === "swing") tone(220, 0.045, "triangle", 0.025, 80);
    else if (e.type === "debris") {
      burst(
        e.x,
        e.y,
        e.plant
          ? ["#80a782", "#b08065", "#d3b08b"]
          : ["#b1d9cb", "#557c8b", "#e0d8bd"],
        20,
        140,
      );
    } else if (e.type === "break") {
      tone(90, 0.2, "sawtooth", 0.035, 20);
      float("DAMAGE +100", game.player.x, game.player.y - 90);
    } else if (e.type === "heal") {
      float("COFFEE +22 HP", e.x, e.y, "#9ee6ba");
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
    : "Dodge the red wind-up. Kick for reach. Smash copiers for coffee.";
  $(".stamp").style.display = "none";
}
const actionKeys = {
  KeyJ: "punch",
  Space: "punch",
  KeyK: "kick",
  KeyL: "dodge",
  ShiftLeft: "dodge",
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
    if (!paused) game.queue(button.dataset.action);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, (e) => {
      active.delete(e.pointerId);
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
  const scale = a.type === "boss" ? 1.36 : 1.12,
    index = frameIndex(a),
    sprite = atlases[a.type][a.state]?.[index] || atlases[a.type].idle[0];
  shadow(a.x, a.y, a.type === "boss" ? 25 : 19, a.dead ? 0.15 : 0.3);
  ctx.save();
  ctx.translate(Math.round(a.x), Math.round(a.y));
  ctx.scale(a.face, 1);
  if (a.inv > 0 && a.type === "hero" && Math.floor(clock * 20) % 2 === 0)
    ctx.globalAlpha = 0.5;
  if (a.state === "dodge") {
    ctx.globalAlpha = 0.2;
    ctx.drawImage(
      sprite,
      -39 * scale - 16,
      -85 * scale,
      96 * scale,
      92 * scale,
    );
    ctx.globalAlpha = 0.8;
  }
  ctx.drawImage(
    sprite,
    Math.round(-39 * scale),
    Math.round(-85 * scale),
    Math.round(96 * scale),
    Math.round(92 * scale),
  );
  ctx.restore();
  if (!a.dead && a.type !== "hero") {
    if (a.hp < a.maxHp || a.type === "boss") {
      rect(ctx, a.x - 19, a.y - 100 * scale, 38, 3, "#1b303c");
      rect(
        ctx,
        a.x - 19,
        a.y - 100 * scale,
        (38 * a.hp) / a.maxHp,
        2,
        a.type === "boss" ? "#e2aa76" : "#cd8b7e",
      );
    }
    const move = MOVES[a.state];
    if (move && a.time < move.active) {
      text(ctx, "!", a.x, a.y - 96 * scale, 17, "#ffc783", "center");
      rect(ctx, a.x - 12, a.y + 4, 24 * (a.time / move.active), 2, "#ed866c");
    }
  }
  if (
    a === game.player &&
    MOVES[a.state] &&
    a.time >= MOVES[a.state].active &&
    a.time < MOVES[a.state].end
  ) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(a.face, 1);
    const heavy = a.state === "kick" || a.state === "punch3";
    poly(
      ctx,
      heavy
        ? [
            [25, -62],
            [58, -65],
            [72, -48],
            [57, -32],
            [47, -34],
            [60, -47],
            [52, -59],
          ]
        : [
            [25, -60],
            [46, -64],
            [59, -53],
            [53, -42],
            [47, -44],
            [51, -52],
            [42, -59],
          ],
      "#f4e4b4",
    );
    ctx.restore();
  }
}
function hud() {
  const p = game.player;
  rect(ctx, 14, 12, 184, 40, "#142b35e8");
  rect(ctx, 14, 12, 3, 40, "#e7b17c");
  text(ctx, "A. EMPLOYEE", 24, 24, 9, "#f5dfb5");
  text(ctx, "OVERTIME: DENIED", 188, 24, 6, "#96afa7", "right");
  rect(ctx, 24, 31, 164, 8, "#3b4a50");
  rect(
    ctx,
    25,
    32,
    (162 * p.hp) / p.maxHp,
    6,
    p.hp < 40 ? "#dd8974" : "#8ed2b8",
  );
  for (let i = 1; i < 8; i++) rect(ctx, 24 + i * 20.5, 32, 1, 6, "#152c3555");
  text(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, 24, 47, 6, "#d3d4bb");
  text(
    ctx,
    p.dodgeCooldown > 0 ? "DODGE RECHARGING" : "DODGE READY",
    188,
    47,
    6,
    p.dodgeCooldown > 0 ? "#a3a99b" : "#b5d5b9",
    "right",
  );
  rect(ctx, 450, 12, 176, 40, "#142b35e8");
  text(ctx, "FLOOR 01", 460, 24, 8, "#88baaf");
  text(
    ctx,
    String(game.score).padStart(6, "0"),
    615,
    43,
    18,
    "#f4d29a",
    "right",
  );
  text(ctx, `${game.kills}/8 OUT`, 460, 43, 8, "#c1c7ad");
  if (game.combo > 1 && game.time < game.comboUntil) {
    text(ctx, `${game.combo} HIT`, 615, 72, 21, "#efbd83", "right");
    text(
      ctx,
      game.combo >= 6 ? "UNPRODUCTIVE!" : "KEEP IT GOING",
      614,
      83,
      6,
      "#d3d0b1",
      "right",
    );
  }
  if (game.messageUntil > game.time) {
    rect(ctx, 164, 65, 312, 22, "#152e38dd");
    text(ctx, game.message, 320, 79, 9, "#e9d0a3", "center");
  }
  const boss = game.enemies.find((e) => e.type === "boss" && !e.dead);
  if (boss) {
    rect(ctx, 212, 329, 216, 16, "#172c37eb");
    text(ctx, "THE FLOOR MANAGER", 320, 327, 7, "#ebc594", "center");
    rect(ctx, 216, 334, 208, 5, "#4b3f50");
    rect(ctx, 216, 334, (208 * boss.hp) / boss.maxHp, 5, "#d69b7f");
  } else if (game.cleared > 0 && !game.locked) {
    text(
      ctx,
      game.cleared === 3 ? "ELEVATOR →" : "GO →",
      560,
      189 + Math.sin(clock * 5) * 2,
      14,
      "#f3d7a0",
    );
  }
  const progress = Math.max(0, Math.min(1, p.x / WORLD.width));
  rect(ctx, 250, 17, 140, 2, "#637b7777");
  rect(ctx, 250, 17, 140 * progress, 2, "#edbb87");
  for (let i = 0; i < 3; i++)
    rect(ctx, 250 + i * 70, 15, 4, 6, game.cleared > i ? "#a6d7b9" : "#a18d78");
}
function render() {
  ctx.clearRect(0, 0, 640, 360);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  const sx = shake ? Math.round((Math.random() - 0.5) * shake * 2) : 0,
    sy = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
  ctx.translate(-Math.round(camera) + sx, sy);
  ctx.drawImage(office, 0, 0);
  // Ceiling dust drifts through the light; generated deterministically from clock.
  for (let i = 0; i < 25; i++) {
    const x = (i * 97 + clock * 4) % 1960,
      y = 67 + ((i * 31) % 130) + Math.sin(clock + i) * 5;
    rect(ctx, x, y, 1, 1, "#f4e6bf44");
  }
  if (game.locked) {
    const x = game.rightLimit + 12;
    for (let y = 225; y < 322; y += 14) {
      poly(
        ctx,
        [
          [x - 6, y],
          [x + 6, y + 5],
          [x + 6, y + 10],
          [x - 6, y + 5],
        ],
        "#e7b67988",
      );
    }
    text(ctx, "LOCKDOWN", x - 10, 216, 7, "#ebc495", "right");
  }
  if (game.cleared === 3) {
    rect(ctx, 1842, 80, 72, 134, "#172e3b");
    rect(ctx, 1850, 86, 57, 128, "#314e57");
    rect(ctx, 1858, 95, 40, 118, "#698880");
    rect(ctx, 1842, 214, 72, 3, "#d5c7a0");
  }
  for (const item of game.pickups)
    if (!item.taken) {
      const y = item.y + Math.sin(clock * 5) * 2;
      shadow(item.x, item.y, 8, 0.18);
      rect(ctx, item.x - 5, y - 17, 10, 12, "#eee1b9");
      rect(ctx, item.x + 5, y - 15, 4, 7, "#b9c5ad");
      rect(ctx, item.x - 3, y - 16, 6, 2, "#73564a");
      rect(ctx, item.x - 4, y - 11, 8, 3, "#d69064");
      rect(ctx, item.x, y - 23 - ((clock * 8) % 6), 1, 4, "#dce0c299");
    }
  const items = [
    ...game.props.map((p) => ({ y: p.y, prop: p })),
    ...game.enemies.map((a) => ({ y: a.y, a })),
    { y: game.player.y, a: game.player },
  ].sort((a, b) => a.y - b.y);
  for (const item of items) {
    if (item.prop) {
      shadow(item.prop.x, item.prop.y, 22, 0.2);
      drawProp(ctx, item.prop);
    } else drawActor(item.a);
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
  // Subtle CRT scanlines are tied to the pixel grid, never the display resolution.
  for (let y = 0; y < 360; y += 3) rect(ctx, 0, y, 640, 1, "#0c23320b");
  hud();
  if (game.status === "ready") {
    text(ctx, "AFTER HOURS", 520, 109, 9, "#eed8af", "center");
  }
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
        game.step(1 / 60, input);
        events();
        accumulator -= 1 / 60;
      }
    }
    const target = Math.max(
      0,
      Math.min(WORLD.width - 640, game.player.x - 230),
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
  };
requestAnimationFrame(loop);
