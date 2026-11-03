// Pure 60 Hz simulation. Rendering and input never decide whether a hit lands.
export const WORLD = { width: 1960, top: 224, bottom: 390 };
export const MOVES = {
  pipe: { duration: 0.48, active: 0.16, end: 0.27, reach: 91, damage: 34, push: 115 },
  airkick: {
    duration: 0.4,
    active: 0.07,
    end: 0.25,
    reach: 67,
    damage: 27,
    push: 100,
  },
  punch1: {
    duration: 0.32,
    active: 0.1,
    end: 0.17,
    reach: 46,
    damage: 15,
    push: 34,
  },
  punch2: {
    duration: 0.34,
    active: 0.11,
    end: 0.19,
    reach: 51,
    damage: 18,
    push: 40,
  },
  punch3: {
    duration: 0.46,
    active: 0.17,
    end: 0.25,
    reach: 62,
    damage: 29,
    push: 95,
  },
  kick: {
    duration: 0.56,
    active: 0.2,
    end: 0.3,
    reach: 71,
    damage: 32,
    push: 105,
  },
  strike: {
    duration: 0.66,
    active: 0.34,
    end: 0.43,
    reach: 44,
    damage: 10,
    push: 35,
  },
  slam: {
    duration: 0.94,
    active: 0.58,
    end: 0.72,
    reach: 78,
    damage: 20,
    push: 100,
  },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function actor(id, x, y, type) {
  const hp =
    type === "hero" ? 140 : type === "boss" ? 230 : type === "guard" ? 65 : 48;
  return {
    id,
    x,
    y,
    type,
    hp,
    maxHp: hp,
    face: type === "hero" ? 1 : -1,
    state: "idle",
    time: 0,
    walkTime: 0,
    inv: 0,
    cooldown: 0,
    z: 0,
    vz: 0,
    airHit: false,
    guard: 100,
    blockTime: 0,
    hitIds: new Set(),
    combo: 0,
    comboUntil: 0,
    dead: false,
    deathTime: 0,
  };
}
export class Game {
  constructor() {
    this.reset();
  }
  reset() {
    this.time = 0;
    this.status = "ready";
    this.player = actor("player", 90, 274, "hero");
    this.enemies = [];
    this.wave = -1;
    this.cleared = 0;
    this.score = 0;
    this.combo = 0;
    this.comboUntil = 0;
    this.buffer = null;
    this.events = [];
    this.attackSlot = 0;
    this.finishTime = 0;
    this.bestCombo = 0;
    this.kills = 0;
    this.message = "";
    this.messageUntil = 0;
    this.pickups = [];
    this.weapons = [{x: 140, y: 274, uses: 8}];
    this.damageValue = 0;
    this.props = [
      { id: "p1", x: 300, y: 269, type: "copier", hp: 50 },
      { id: "p2", x: 498, y: 295, type: "plant", hp: 24 },
      { id: "p3", x: 868, y: 278, type: "copier", hp: 50 },
      { id: "p4", x: 1084, y: 245, type: "plant", hp: 24 },
      { id: "p5", x: 1480, y: 288, type: "copier", hp: 50 },
      { id: "p6", x: 1745, y: 246, type: "plant", hp: 24 },
    ];
    for (let i = 0; i < 9; i++)
      this.props.push({
        id: "desk" + i,
        x: 240 + i * 175,
        y: i % 2 ? 365 : 230,
        type: i % 3 === 0 ? "chair" : "desk",
        hp: 42,
      });
  }
  start() {
    this.reset();
    this.status = "playing";
    this.announce("18:47 · TIME TO CLOCK OUT", 2.8);
  }
  announce(text, duration = 2) {
    this.message = text;
    this.messageUntil = this.time + duration;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  queue(action) {
    if (this.status === "playing")
      this.buffer = { action, expires: this.time + 0.22 };
  }
  spawnWave(n) {
    this.wave = n;
    const base = [380, 990, 1630][n];
    const types =
      n === 2
        ? ["guard", "boss", "intern"]
        : n === 1
          ? ["guard", "intern", "guard"]
          : ["intern", "guard"];
    types.forEach((type, i) =>
      this.enemies.push(
        actor("w" + n + "e" + i, base + i * 80, 246 + (i % 3) * 27, type),
      ),
    );
    this.announce(
      [
        "ACCOUNTS · NO EARLY EXITS",
        "OPERATIONS · MANDATORY OVERTIME",
        "THE FLOOR MANAGER",
      ][n],
      2.4,
    );
    this.emit("wave");
  }
  get locked() {
    return this.enemies.some((e) => !e.dead);
  }
  get rightLimit() {
    return this.locked ? [650, 1280, 1932][this.wave] : WORLD.width - 25;
  }
  get leftLimit() {
    return this.locked ? [18, 665, 1295][this.wave] : 18;
  }
  begin(a, move) {
    a.state = move;
    a.time = 0;
    a.hitIds.clear();
    if (a.type === "hero") {
      a.comboUntil = this.time + 0.8;
      this.emit("swing", { move });
    }
  }
  dropWeapon(a) {
    if (!a.weapon) return;
    this.weapons.push({x: a.x, y: a.y, uses: a.weapon.uses});
    a.weapon = null;
  }
  damage(target, source, move) {
    if (target.dead || target.inv > 0) return false;
    if (
      target.type === "hero" &&
      target.state === "block" &&
      (source.x - target.x) * target.face >= -4 &&
      target.guard > 0
    ) {
      const parry = target.blockTime < 0.14;
      target.guard = Math.max(
        0,
        target.guard - (parry ? 7 : move.damage * 1.8),
      );
      this.emit("block", { x: target.x, y: target.y - 42, parry });
      if (parry) {
        source.state = "hurt";
        source.time = 0;
        this.score += 30;
      }
      if (target.guard === 0) {
        target.state = "hurt";
        target.time = -0.25;
        this.emit("guardbreak");
      }
      return true;
    }
    this.dropWeapon(target);
    target.hp = Math.max(0, target.hp - move.damage);
    target.inv = target.type === "hero" ? 0.65 : 0.08;
    target.x = clamp(
      target.x + source.face * move.push * 0.35,
      18,
      WORLD.width - 24,
    );
    target.face = -source.face;
    target.state = target.hp === 0 ? "down" : "hurt";
    if (target.z > 0) target.vz = Math.min(target.vz, -50);
    target.time = 0;
    target.hitIds.clear();
    this.emit("hit", {
      x: target.x,
      y: target.y - 44,
      heavy: move.damage >= 29,
      hero: target.type === "hero",
    });
    if (target.type === "hero") {
      this.combo = 0;
      target.combo = 0;
    } else {
      this.combo = this.time < this.comboUntil ? this.combo + 1 : 1;
      this.comboUntil = this.time + 2.1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += move.damage * 5;
    }
    if (target.hp === 0) {
      target.dead = true;
      target.deathTime = this.time;
      if (target.type === "hero") {
        this.status = "lost";
        this.emit("end", { win: false });
      } else {
        if (target.type === "guard") this.weapons.push({x: target.x, y: target.y, uses: 8});
        this.kills++;
        this.score += target.type === "boss" ? 1500 : 250;
        this.emit("down", { x: target.x, y: target.y });
      }
    }
    return true;
  }
  resolveAttack(a) {
    const m = MOVES[a.state];
    if (!m || a.time < m.active || a.time > m.end) return;
    const targets = a === this.player ? this.enemies : [this.player];
    for (const target of targets) {
      const dx = (target.x - a.x) * a.face;
      if (
        !a.hitIds.has(target.id) &&
        !target.dead &&
        dx >= -12 &&
        dx <= m.reach &&
        Math.abs(target.y - a.y) < 24 &&
        (a.type === "hero" ? a.z < 65 : target.z < 24)
      ) {
        if (this.damage(target, a, m)) a.hitIds.add(target.id);
      }
    }
    if (a === this.player)
      for (const p of this.props) {
        const dx = (p.x - a.x) * a.face;
        if (
          p.hp > 0 &&
          !a.hitIds.has(p.id) &&
          dx > -15 &&
          dx < m.reach + 12 &&
          Math.abs(p.y - a.y) < 30
        ) {
          p.hp = Math.max(0, p.hp - m.damage);
          a.hitIds.add(p.id);
          this.emit("debris", {
            x: p.x,
            y: p.y - 25,
            plant: p.type === "plant",
          });
          if (!p.hp) {
            this.score += 100;
            this.damageValue +=
              p.type === "desk" ? 650 : p.type === "copier" ? 1200 : 150;
            if (p.type === "copier" || p.type === "plant")
              this.pickups.push({ x: p.x, y: p.y + 8, taken: false });
            this.emit("break");
          }
        }
      }
  }
  updateActor(a, dt) {
    a.inv = Math.max(0, a.inv - dt);
    a.cooldown = Math.max(0, a.cooldown - dt);
    a.dodgeCooldown = Math.max(0, a.dodgeCooldown - dt);
    a.time += dt;
    if (a.z > 0 || a.vz > 0) {
      a.z += a.vz * dt;
      a.vz -= 720 * dt;
      if (a.z <= 0) {
        a.z = 0;
        a.vz = 0;
        a.airHit = false;
        if (a.state === "jump" || a.state === "airkick") {
          a.state = "idle";
          a.time = 0;
        }
        this.emit("land", { x: a.x, y: a.y });
      }
    }
    if (a.dead) return;
    if (a.state === "pickup" && a.time >= 0.24) {a.state = "idle"; a.time = 0;}
    if (a.state === "hurt" && a.time >= 0.24) {
      a.state = "idle";
      a.time = 0;
    }
    const m = MOVES[a.state];
    if (m) {
      this.resolveAttack(a);
      if (a.time >= m.duration) {
        if (a.state === "pipe" && a.weapon && --a.weapon.uses <= 0) {a.weapon = null; this.announce("PIPE BROKEN", 1);}
        a.state = a.z > 0 ? "jump" : "idle";
        a.time = 0;
        if (a.type !== "hero") a.cooldown = a.type === "boss" ? 0.75 : 1.1;
      }
      return;
    }
  }
  step(dt, input = { x: 0, y: 0 }) {
    if (this.status !== "playing") return;
    dt = Math.min(dt, 1 / 30);
    this.time += dt;
    this.attackSlot = Math.max(0, this.attackSlot - dt);
    const p = this.player;
    if (this.wave < 0 && p.x > 170) this.spawnWave(0);
    if (this.wave === 0 && !this.locked && p.x > 710) this.spawnWave(1);
    if (this.wave === 1 && !this.locked && p.x > 1320) this.spawnWave(2);
    const previous = { x: p.x, y: p.y };
    this.updateActor(p, dt);
    if (p.dead) return;
    if (this.buffer && this.buffer.expires < this.time) this.buffer = null;
    // Block is held, directional and grounded. A brief initial window parries.
    if (p.state === "block" && !input.block) {
      p.state = "idle";
      p.time = 0;
      p.blockTime = 0;
    }
    if (
      input.block &&
      p.z === 0 &&
      ["idle", "walk", "block"].includes(p.state) &&
      p.guard > 0
    ) {
      if (p.state !== "block") {
        p.state = "block";
        p.time = 0;
        p.blockTime = 0;
      }
      p.blockTime += dt;
      if (input.x) p.face = Math.sign(input.x);
    } else if (p.state !== "block") p.guard = Math.min(100, p.guard + 24 * dt);
    if (
      this.buffer?.action === "jump" &&
      p.z === 0 &&
      ["idle", "walk"].includes(p.state)
    ) {
      p.state = "jump";
      p.time = 0;
      p.vz = 290;
      p.z = 0.01;
      p.airHit = false;
      this.buffer = null;
      this.emit("jump");
    }
    if (
      this.buffer?.action === "attack" &&
      p.z > 0 &&
      !p.airHit &&
      p.state === "jump"
    ) {
      this.begin(p, "airkick");
      p.airHit = true;
      this.buffer = null;
    }
    if (["idle", "walk"].includes(p.state) && this.buffer) {
      const action = this.buffer.action;
      this.buffer = null;
      if (action === "attack" || action === "punch") {
        const nearby = this.weapons.find(w => !w.taken && Math.abs(w.x-p.x)<27 && Math.abs(w.y-p.y)<23);
        if (!p.weapon && nearby) {
          nearby.taken = true;
          p.weapon = {uses: nearby.uses};
          p.state = "pickup"; p.time = 0;
          this.announce("STEEL PIPE · ATTACK TO SWING", 1.8);
        } else if (p.weapon) {
          this.begin(p, "pipe");
        } else {
          p.combo = this.time < p.comboUntil ? (p.combo % 3) + 1 : 1;
          this.begin(p, "punch" + p.combo);
        }
      } else if (action === "kick") this.begin(p, "kick");
    }
    if (["idle", "walk", "jump", "airkick"].includes(p.state)) {
      let x = input.x || 0,
        y = input.y || 0;
      const mag = Math.max(1, Math.hypot(x, y));
      x /= mag;
      y /= mag;
      if (x && p.state !== "airkick") p.face = Math.sign(x);
      const speed = p.z > 0 ? 125 : 145;
      p.x = clamp(p.x + x * speed * dt, this.leftLimit, this.rightLimit);
      p.y = clamp(p.y + y * speed * dt, WORLD.top, WORLD.bottom);
      if (p.z === 0) {
        p.state = Math.abs(x) + Math.abs(y) > 0.1 ? "walk" : "idle";
        if (p.state === "walk") p.walkTime += dt;
      }
    }
    // Furniture has a footprint; jumping clears low pieces and attacks break it.
    if (p.z < 36)
      for (const o of this.props) {
        if (o.hp <= 0 || o.type === "plant") continue;
        const rx = o.type === "desk" ? 31 : o.type === "copier" ? 28 : 15,
          ry = o.type === "desk" ? 22 : 18;
        if (Math.abs(p.x - o.x) < rx && Math.abs(p.y - o.y) < ry) {
          if (Math.abs(previous.x - o.x) >= rx)
            p.x = o.x + Math.sign(previous.x - o.x) * rx;
          else if (Math.abs(previous.y - o.y) >= ry)
            p.y = o.y + Math.sign(previous.y - o.y) * ry;
          else if (Math.abs(p.x - o.x) / rx > Math.abs(p.y - o.y) / ry)
            p.x = o.x + (Math.sign(p.x - o.x) || -1) * rx;
          else p.y = o.y + (Math.sign(p.y - o.y) || 1) * ry;
        }
      }
    for (const e of this.enemies) {
      this.updateActor(e, dt);
      if (this.status !== "playing") break;
      if (e.dead || !["idle", "walk"].includes(e.state)) continue;
      const dx = p.x - e.x,
        dy = p.y - e.y;
      e.face = dx < 0 ? -1 : 1;
      const distance = e.type === "boss" ? 57 : 33;
      if (
        Math.abs(dx) < distance + 4 &&
        Math.abs(dy) < 17 &&
        e.cooldown <= 0 &&
        this.attackSlot <= 0
      ) {
        this.begin(e, e.type === "boss" ? "slam" : "strike");
        this.attackSlot = 0.7;
        this.emit("warning", { x: e.x, y: e.y - 90 });
      } else if (Math.abs(dx) > distance || Math.abs(dy) > 12) {
        const speed = e.type === "boss" ? 47 : e.type === "intern" ? 69 : 58;
        e.x += Math.sign(dx) * speed * dt * (Math.abs(dx) > distance ? 1 : 0);
        e.y = clamp(
          e.y + Math.sign(dy) * speed * 0.58 * dt * (Math.abs(dy) > 8 ? 1 : 0),
          WORLD.top,
          WORLD.bottom,
        );
        e.state = "walk";
        e.walkTime += dt;
      } else e.state = "idle";
    }
    // Separate standing enemies without moving them through the player.
    const live = this.enemies.filter((e) => !e.dead);
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i],
          b = live[j];
        if (Math.abs(a.x - b.x) < 23 && Math.abs(a.y - b.y) < 14) {
          const sign = a.y <= b.y ? -1 : 1;
          a.y = clamp(a.y + sign * 18 * dt, WORLD.top, WORLD.bottom);
          b.y = clamp(b.y - sign * 18 * dt, WORLD.top, WORLD.bottom);
        }
      }
    for (const item of this.pickups)
      if (
        !item.taken &&
        Math.abs(item.x - p.x) < 23 &&
        Math.abs(item.y - p.y) < 21
      ) {
        item.taken = true;
        p.hp = Math.min(p.maxHp, p.hp + 22);
        this.score += 50;
        this.emit("heal", { x: p.x, y: p.y - 65 });
      }
    if (this.wave >= 0 && !this.locked && this.cleared === this.wave) {
      this.cleared++;
      this.announce(
        this.wave === 2
          ? "ALL CLEAR · TAKE THE ELEVATOR →"
          : "AREA CLEAR · KEEP MOVING →",
        3,
      );
      this.emit("clear");
    }
    if (this.cleared === 3 && p.x > 1865 && p.y < 270) {
      this.status = "won";
      this.finishTime = this.time;
      this.score += Math.round(p.hp * 10);
      this.emit("end", { win: true });
    }
  }
}
