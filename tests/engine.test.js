import test from "node:test";
import assert from "node:assert/strict";
import { Game, MOVES, WORLD } from "../src/engine.js";
const tick = (g, n, input = { x: 0, y: 0 }) => {
  for (let i = 0; i < n; i++) g.step(1 / 60, input);
};
function encounter() {
  const g = new Game();
  g.start();
  g.spawnWave(0);
  g.player.x = 300;
  g.player.y = 260;
  const e = g.enemies[0];
  e.x = 337;
  e.y = 260;
  e.cooldown = 100;
  g.enemies[1].x = 600;
  g.enemies[1].cooldown = 100;
  return { g, e };
}
test("attacks hit only during active frames and once per target", () => {
  const { g, e } = encounter();
  g.queue("punch");
  tick(g, 5);
  assert.equal(e.hp, e.maxHp);
  tick(g, 5);
  assert.equal(e.hp, e.maxHp - 15);
  tick(g, 8);
  assert.equal(e.hp, e.maxHp - 15);
});
test("lane and facing reject invalid targets", () => {
  const { g, e } = encounter();
  e.y = 315;
  e.x = 260;
  g.queue("kick");
  tick(g, 22);
  assert.equal(e.hp, e.maxHp);
});
test("buffered punch chains into second strike and expires when stale", () => {
  const { g } = encounter();
  g.queue("punch");
  tick(g, 14);
  g.queue("punch");
  tick(g, 7);
  assert.equal(g.player.state, "punch2");
  g.player.state = "hurt";
  g.player.time = -1;
  g.queue("kick");
  tick(g, 20);
  assert.equal(g.buffer, null);
});
test("dodge is invulnerable, bounded and cooldown cannot be bypassed", () => {
  const { g, e } = encounter();
  g.queue("dodge");
  tick(g, 1);
  assert.equal(g.player.state, "dodge");
  assert.ok(g.player.inv > 0);
  const hp = g.player.hp;
  g.damage(g.player, e, MOVES.strike);
  assert.equal(g.player.hp, hp);
  tick(g, 20);
  g.queue("dodge");
  tick(g, 1);
  assert.notEqual(g.player.state, "dodge");
  g.player.x = g.rightLimit - 1;
  g.player.dodgeCooldown = 0;
  g.queue("dodge");
  tick(g, 20, { x: 1, y: 0 });
  assert.ok(g.player.x <= g.rightLimit);
});
test("broken props drop coffee once and pickups clamp health", () => {
  const { g } = encounter();
  const prop = g.props[0];
  prop.x = 337;
  prop.y = 260;
  prop.hp = 15;
  g.queue("punch");
  tick(g, 15);
  assert.equal(prop.hp, 0);
  assert.equal(g.pickups.length, 1);
  g.player.hp = 135;
  g.player.x = 337;
  g.player.y = 268;
  tick(g, 1);
  assert.equal(g.player.hp, 140);
  assert.equal(g.pickups[0].taken, true);
});
test("dead enemies do not attack; loss emits once and restart is clean", () => {
  const { g, e } = encounter();
  e.hp = 1;
  g.damage(e, g.player, MOVES.kick);
  assert.ok(e.dead);
  const kills = g.kills;
  g.damage(e, g.player, MOVES.kick);
  assert.equal(g.kills, kills);
  g.player.hp = 1;
  g.player.inv = 0;
  g.damage(g.player, g.enemies[1], MOVES.strike);
  tick(g, 60);
  assert.equal(g.status, "lost");
  assert.equal(g.events.filter((e) => e.type === "end").length, 1);
  g.start();
  assert.equal(g.status, "playing");
  assert.equal(g.enemies.length, 0);
  assert.equal(g.player.hp, 140);
});
test("three encounters gate progress and elevator requires cleared level", () => {
  const g = new Game();
  g.start();
  g.player.x = 1900;
  g.player.y = 240;
  tick(g, 1);
  assert.notEqual(g.status, "won");
  assert.equal(g.wave, 0);
  g.enemies.forEach((e) => {
    e.dead = true;
    e.hp = 0;
  });
  tick(g, 1);
  assert.equal(g.cleared, 1);
  g.player.x = 720;
  tick(g, 1);
  assert.equal(g.wave, 1);
  g.enemies.forEach((e) => {
    e.dead = true;
    e.hp = 0;
  });
  tick(g, 1);
  assert.equal(g.cleared, 2);
  g.player.x = 1330;
  tick(g, 1);
  assert.equal(g.wave, 2);
  g.enemies.forEach((e) => {
    e.dead = true;
    e.hp = 0;
  });
  tick(g, 1);
  g.player.x = 1890;
  g.player.y = 245;
  tick(g, 1);
  assert.equal(g.status, "won");
});
test("movement normalizes diagonals, preserves lane bounds, pauses by status", () => {
  const a = new Game(),
    b = new Game();
  a.start();
  b.start();
  tick(a, 20, { x: 1, y: 0 });
  tick(b, 20, { x: 1, y: 1 });
  assert.ok(b.player.x < a.player.x);
  tick(a, 100, { x: 0, y: -1 });
  assert.equal(a.player.y, WORLD.top);
  a.status = "won";
  const x = a.player.x;
  tick(a, 60, { x: 1, y: 0 });
  assert.equal(a.player.x, x);
});
test("all sprite actions contain multiple unique authored poses", async () => {
  const { POSES } = await import("../src/art.js");
  for (const [name, poses] of Object.entries(POSES)) {
    assert.ok(poses.length >= 3, name);
    assert.ok(new Set(poses.map((p) => JSON.stringify(p))).size >= 3, name);
  }
});
test("a complete input-driven run defeats all eight enemies and exits without stat overrides", () => {
  const g = new Game();
  g.start();
  for (let i = 0; i < 60 * 180 && g.status === "playing"; i++) {
    const p = g.player,
      e = g.enemies
        .filter((e) => !e.dead)
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
    let x = 1,
      y = 0;
    if (e) {
      const dx = e.x - p.x,
        dy = e.y - p.y;
      x = Math.abs(dx) > 54 ? Math.sign(dx) : 0;
      y = Math.abs(dy) > 6 ? Math.sign(dy) : 0;
      if (x === 0 && Math.sign(dx) !== p.face) x = Math.sign(dx) * 0.1;
      const m = MOVES[e.state];
      if (
        m &&
        e.time > m.active - 0.15 &&
        Math.abs(dx) < 85 &&
        Math.abs(dy) < 20 &&
        p.dodgeCooldown <= 0
      ) {
        g.queue("dodge");
        x = -Math.sign(dx);
      } else if (
        Math.abs(dx) < 65 &&
        Math.abs(dy) < 16 &&
        (["idle", "walk"].includes(p.state) ||
          p.time > (MOVES[p.state]?.duration || 1) - 0.13)
      )
        g.queue("kick");
    } else if (g.cleared === 3) y = p.y > 249 ? -1 : 0;
    g.step(1 / 60, { x, y });
    g.events.length = 0;
  }
  assert.equal(g.status, "won");
  assert.equal(g.kills, 8);
  assert.ok(g.player.hp > 0);
});
