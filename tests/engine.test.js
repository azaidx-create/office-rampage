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
test("jump has an arc, cannot double-jump, and lands inside lane bounds", () => {
  const { g } = encounter();
  g.queue("jump");
  tick(g, 12, { x: 1, y: 0 });
  assert.ok(g.player.z > 25);
  const v = g.player.vz;
  g.queue("jump");
  tick(g, 1);
  assert.ok(g.player.vz < v);
  tick(g, 60);
  assert.equal(g.player.z, 0);
  assert.equal(g.player.vz, 0);
});
test("directional block stops front hits, parries briefly, and permits rear damage", () => {
  const { g, e } = encounter();
  g.player.face = 1;
  tick(g, 1, { block: true });
  const hp = g.player.hp;
  assert.equal(g.player.state, "block");
  assert.ok(g.damage(g.player, e, MOVES.strike));
  assert.equal(g.player.hp, hp);
  assert.equal(e.state, "hurt");
  assert.ok(g.player.guard < 100);
  e.x = g.player.x - 30;
  g.damage(g.player, e, MOVES.strike);
  assert.ok(g.player.hp < hp);
});
test("guard breaks under repeated pressure and releasing block allows recovery", () => {
  const { g, e } = encounter();
  tick(g, 12, { block: true });
  g.player.guard = 10;
  g.damage(g.player, e, MOVES.slam);
  assert.equal(g.player.guard, 0);
  assert.equal(g.player.state, "hurt");
  tick(g, 40);
  assert.ok(g.player.guard > 0);
});
test("jump attack is limited to one aerial strike per jump", () => {
  const { g } = encounter();
  g.queue("jump");
  tick(g, 6);
  g.queue("attack");
  tick(g, 1);
  assert.equal(g.player.state, "airkick");
  tick(g, 25);
  g.queue("attack");
  tick(g, 1);
  assert.notEqual(g.player.state, "airkick");
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
      x = Math.abs(dx) > 35 ? Math.sign(dx) : 0;
      y = Math.abs(dy) > 6 ? Math.sign(dy) : 0;
      if (x === 0 && Math.sign(dx) !== p.face) x = Math.sign(dx) * 0.1;
      if (
        Math.abs(dx) < 46 &&
        Math.abs(dy) < 16 &&
        (["idle", "walk"].includes(p.state) ||
          p.time > (MOVES[p.state]?.duration || 1) - 0.13)
      )
        g.queue("attack");
    } else if (g.cleared === 3) y = p.y > 249 ? -1 : 0;
    g.step(1 / 60, { x, y });
    g.events.length = 0;
  }
  assert.equal(g.status, "won");
  assert.equal(g.kills, 8);
  assert.ok(g.player.hp > 0);
});
test("screen-space movement remains aligned after oblique projection", async () => {
  const { project, screenToWorld } = await import("../src/office.js");
  const origin = project(500, 300, 250);
  for (const [x, y] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ]) {
    const v = screenToWorld(x, y),
      to = project(500 + v.x, 300 + v.y, 250);
    assert.ok(Math.abs(to.x - origin.x - x) < 0.0001);
    assert.ok(Math.abs(to.y - origin.y - y) < 0.0001);
  }
});
test("solid copier blocks grounded movement until broken", () => {
  const g = new Game();
  g.start();
  g.player.x = 260;
  g.player.y = 269;
  tick(g, 20, { x: 1, y: 0 });
  assert.ok(g.player.x <= 272);
  const prop = g.props.find((p) => p.id === "p1");
  prop.hp = 0;
  tick(g, 10, { x: 1, y: 0 });
  assert.ok(g.player.x > 272);
});

test("pipe pickup, reach, single hit, durability and disarming", () => {
  const {g,e} = encounter();
  g.weapons = [{x:300,y:260,uses:2}];
  g.queue("attack"); tick(g,1);
  assert.equal(g.player.state,"pickup");
  assert.equal(g.player.weapon.uses,2);
  assert.equal(g.weapons[0].taken,true);
  tick(g,16); e.x=380;
  g.queue("attack"); tick(g,18);
  assert.equal(e.hp,14);
  assert.equal(g.player.state,"pipe");
  tick(g,13);
  assert.equal(g.player.weapon.uses,1);
  g.queue("attack"); tick(g,31);
  assert.equal(g.player.weapon,null);
  g.player.weapon={uses:4};
  g.damage(g.player,e,MOVES.strike);
  assert.equal(g.player.weapon,null);
  assert.equal(g.weapons.at(-1).uses,4);
});

test("defeated guards drop one collectible pipe", () => {
  const {g}=encounter();
  const guard=g.enemies[1];
  g.damage(guard,g.player,{damage:999,push:0});
  const count=g.weapons.length;
  assert.equal(g.weapons.at(-1).uses,8);
  g.damage(guard,g.player,{damage:999,push:0});
  assert.equal(g.weapons.length,count);
});
