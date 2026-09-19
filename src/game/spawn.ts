import { ANCHOR_RADIUS, LATCH_RANGE, WELL_RADIUS } from "../core/config";
import { dist, vec } from "../core/math";
import { Rng } from "../core/rng";
import type { Anchor, Debris, Fracture, Shard, World } from "./entities";

let nextId = 1;

export function createWorld(rng: Rng): World {
  nextId = 1;
  const mote = {
    pos: vec(0, 40),
    vel: vec(40, -20),
    trail: [],
  };
  const anchors: Anchor[] = [
    makeAnchor(rng, 160, -180, 0),
    makeAnchor(rng, -150, -70, 0),
    makeAnchor(rng, 40, -360, 0),
    makeAnchor(rng, 280, -40, 0),
  ];
  const shards: Shard[] = [
    { pos: vec(90, -90), pulse: 0, taken: false },
    { pos: vec(-40, -200), pulse: 1, taken: false },
    { pos: vec(210, -240), pulse: 2, taken: false },
  ];
  return {
    mote,
    anchors,
    shards,
    fractures: [offsetFracture(420, -80)],
    debris: [
      {
        pos: vec(-280, 120),
        vel: vec(12, -8),
        rot: 0.4,
        spin: 0.6,
        size: 14,
        sides: 5,
      },
    ],
    wells: [],
  };
}

export function maintainField(world: World, rng: Rng, t: number, intensity: number): void {
  const origin = world.mote.pos;
  world.anchors = world.anchors.filter((a) => dist(a.pos, origin) < 980);
  world.shards = world.shards.filter((s) => !s.taken && dist(s.pos, origin) < 980);
  world.fractures = world.fractures.filter((f) => f.age < f.life);
  world.debris = world.debris.filter((d) => dist(d.pos, origin) < 1100);
  world.wells = world.wells.filter((w) => dist(w.pos, origin) < 1200);

  while (world.anchors.length < 8 + Math.floor(intensity * 2)) {
    const ang = rng.range(0, Math.PI * 2);
    const rad = rng.range(220, 560);
    const pos = {
      x: origin.x + Math.cos(ang) * rad,
      y: origin.y + Math.sin(ang) * rad - 40,
    };
    if (world.anchors.some((a) => dist(a.pos, pos) < 130)) continue;
    world.anchors.push(makeAnchor(rng, pos.x, pos.y, intensity));
  }

  while (world.shards.length < 5) {
    const a = rng.pick(world.anchors);
    world.shards.push({
      pos: {
        x: a.pos.x + rng.range(-90, 90),
        y: a.pos.y + rng.range(-90, 90),
      },
      pulse: rng.range(0, Math.PI * 2),
      taken: false,
    });
  }

  if (t > 3.5 && world.fractures.length < 2 + intensity * 5 && rng.next() < 0.028 + intensity * 0.035) {
    world.fractures.push(makeFracture(rng, origin, intensity));
  }

  if (t > 2.8 && world.debris.length < 3 + intensity * 6 && rng.next() < 0.028 + intensity * 0.03) {
    world.debris.push(makeDebris(rng, origin));
  }

  if (t > 18 && world.wells.length < 1 + Math.floor(intensity * 2) && rng.next() < 0.006) {
    const ang = rng.range(0, Math.PI * 2);
    world.wells.push({
      pos: {
        x: origin.x + Math.cos(ang) * rng.range(180, 420),
        y: origin.y + Math.sin(ang) * rng.range(180, 420),
      },
      strength: 14000 + intensity * 8000,
      radius: WELL_RADIUS + intensity * 20,
      pulse: rng.range(0, 10),
    });
  }
}

export function tickAnchors(anchors: Anchor[], dt: number, intensity: number): void {
  for (const a of anchors) {
    a.phase += dt * a.spin;
    if (a.orbit > 0 && intensity > 0.12) {
      a.pos.x = a.home.x + Math.cos(a.phase) * a.orbit;
      a.pos.y = a.home.y + Math.sin(a.phase) * a.orbit;
    }
    a.pos.x += a.drift.x * dt * intensity;
    a.pos.y += a.drift.y * dt * intensity;
  }
}

export function growFractures(fractures: Fracture[], dt: number): void {
  for (const f of fractures) {
    f.age += dt;
    f.grow = Math.min(1, f.grow + dt * (0.35 + f.age * 0.05));
  }
}

function makeAnchor(rng: Rng, x: number, y: number, intensity: number): Anchor {
  return {
    id: nextId++,
    pos: vec(x, y),
    home: vec(x, y),
    radius: ANCHOR_RADIUS,
    phase: rng.range(0, Math.PI * 2),
    orbit: intensity > 0.2 ? rng.range(0, 46) : 0,
    spin: rng.range(0.4, 1.4) * rng.sign(),
    drift: vec(rng.range(-18, 18), rng.range(-10, 16)),
  };
}

function offsetFracture(x: number, y: number): Fracture {
  return {
    points: [
      { x, y },
      { x: x + 70, y: y + 36 },
      { x: x + 118, y: y - 10 },
      { x: x + 190, y: y + 48 },
      { x: x + 250, y: y + 8 },
    ],
    grow: 0.85,
    max: 1,
    age: 0,
    life: 14,
  };
}

function makeFracture(rng: Rng, origin: { x: number; y: number }, intensity: number): Fracture {
  const start = {
    x: origin.x + rng.range(-380, 380),
    y: origin.y + rng.range(-320, 260),
  };
  const points = [start];
  let x = start.x;
  let y = start.y;
  const segs = 5 + rng.int(0, 4);
  let ang = rng.range(0, Math.PI * 2);
  for (let i = 0; i < segs; i++) {
    ang += rng.range(-0.7, 0.7);
    x += Math.cos(ang) * rng.range(40, 90);
    y += Math.sin(ang) * rng.range(40, 90);
    points.push({ x, y });
  }
  return {
    points,
    grow: 0.15,
    max: 1,
    age: 0,
    life: 8 + intensity * 4,
  };
}

function makeDebris(rng: Rng, origin: { x: number; y: number }): Debris {
  return {
    pos: {
      x: origin.x + rng.range(-500, 500),
      y: origin.y + rng.range(-420, 380),
    },
    vel: { x: rng.range(-40, 40), y: rng.range(-24, 36) },
    rot: rng.range(0, Math.PI * 2),
    spin: rng.range(-1.4, 1.4),
    size: rng.range(10, 18),
    sides: rng.int(4, 6),
  };
}

export function nearestInRange(
  origin: { x: number; y: number },
  anchors: Anchor[],
): Anchor | null {
  let best: Anchor | null = null;
  let bestD = LATCH_RANGE;
  for (const a of anchors) {
    const d = dist(origin, a.pos);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}
