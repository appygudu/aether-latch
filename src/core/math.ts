export type Vec = { x: number; y: number };

export const vec = (x = 0, y = 0): Vec => ({ x, y });

export const copy = (a: Vec): Vec => ({ x: a.x, y: a.y });

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });

export const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });

export const len = (a: Vec): number => Math.hypot(a.x, a.y);

export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;

export const norm = (a: Vec): Vec => {
  const l = len(a);
  return l > 1e-6 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
};

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

export const limit = (a: Vec, max: number): Vec => {
  const l = len(a);
  return l > max ? scale(a, max / l) : a;
};

export const rotate = (a: Vec, ang: number): Vec => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};

export const segDist = (p: Vec, a: Vec, b: Vec): number => {
  const ab = sub(b, a);
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-6, dot(ab, ab)), 0, 1);
  return dist(p, add(a, scale(ab, t)));
};

export const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);
