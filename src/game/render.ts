import { ANCHOR_RADIUS, COLORS, LATCH_RANGE, MOTE_RADIUS } from "../core/config";
import { dist, type Vec } from "../core/math";
import type { Anchor, Debris, Fracture, Mote, Shard, Well } from "./entities";
import type { Tether } from "./tether";

const stars: { x: number; y: number; z: number; s: number }[] = [];
for (let i = 0; i < 220; i++) {
  stars.push({
    x: Math.random() * 4000 - 2000,
    y: Math.random() * 4000 - 2000,
    z: 0.15 + Math.random() * 0.85,
    s: 0.7 + Math.random() * 1.8,
  });
}

export function resizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  view: Vec,
  w: number,
  h: number,
  mote: Mote,
  anchors: Anchor[],
  shards: Shard[],
  fractures: Fracture[],
  debris: Debris[],
  wells: Well[],
  tether: Tether,
  target: Anchor | null,
  punch: number,
  collapse: number,
  pro: boolean,
  time: number,
  showMote = true,
): void {
  const ox = view.x - w / 2;
  const oy = view.y - h / 2;
  const zoom = 1 + punch * 0.025;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-w / 2, -h / 2);

  paintSpace(ctx, w, h, ox, oy, time);
  drawWells(ctx, wells, ox, oy, time);
  drawFractures(ctx, fractures, ox, oy);
  drawDebris(ctx, debris, ox, oy);
  drawShards(ctx, shards, ox, oy, time);
  drawAnchors(ctx, anchors, mote.pos, target, ox, oy, time);
  drawAim(ctx, mote, target, tether, ox, oy);
  drawTether(ctx, mote, tether, ox, oy);
  if (showMote) drawMote(ctx, mote, ox, oy, pro, time);
  ctx.restore();

  const vig = 0.34 + collapse * 0.38;
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.18, w / 2, h / 2, h * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(4,2,10,${vig})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintSpace(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  time: number,
): void {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0b0716");
  bg.addColorStop(0.55, "#07060d");
  bg.addColorStop(1, "#05040a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  nebula(ctx, w * 0.22 - ox * 0.08, h * 0.28 - oy * 0.08, 340, "rgba(108, 48, 190, 0.42)");
  nebula(ctx, w * 0.74 - ox * 0.05, h * 0.64 - oy * 0.05, 380, "rgba(18, 110, 168, 0.34)");
  nebula(ctx, w * 0.52 - ox * 0.03, h * 0.12 - oy * 0.03, 240, "rgba(196, 58, 140, 0.22)");
  nebula(ctx, w * 0.4 - ox * 0.06, h * 0.78 - oy * 0.06, 220, "rgba(40, 20, 90, 0.28)");

  for (const star of stars) {
    const x = ((star.x - ox * star.z) % (w + 80) + (w + 80)) % (w + 80) - 40;
    const y = ((star.y - oy * star.z) % (h + 80) + (h + 80)) % (h + 80) - 40;
    const tw = 0.55 + Math.sin(time * 2 + star.x) * 0.45;
    ctx.fillStyle = `rgba(230, 236, 255, ${0.35 + star.z * 0.6 * tw})`;
    ctx.fillRect(x, y, star.s, star.s);
  }
}

function nebula(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawAnchors(
  ctx: CanvasRenderingContext2D,
  anchors: Anchor[],
  mote: Vec,
  target: Anchor | null,
  ox: number,
  oy: number,
  time: number,
): void {
  for (const a of anchors) {
    const x = a.pos.x - ox;
    const y = a.pos.y - oy;
    const inRange = dist(mote, a.pos) <= LATCH_RANGE;
    const chosen = target?.id === a.id;
    const pulse = 0.6 + Math.sin(time * 4 + a.id) * 0.4;

    if (inRange) {
      ctx.beginPath();
      ctx.strokeStyle = chosen ? "rgba(124,244,255,0.55)" : "rgba(139,108,255,0.28)";
      ctx.lineWidth = chosen ? 2 : 1;
      ctx.setLineDash([4, 6]);
      ctx.arc(x, y, ANCHOR_RADIUS + 10 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.strokeStyle = chosen ? COLORS.cyan : inRange ? "#d7cbff" : "rgba(198,188,232,0.75)";
    ctx.lineWidth = 2.4;
    ctx.shadowColor = chosen ? COLORS.cyan : COLORS.violet;
    ctx.shadowBlur = chosen ? 18 : 12;
    ctx.arc(x, y, ANCHOR_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.fillStyle = chosen ? "rgba(124,244,255,0.22)" : "rgba(139,108,255,0.1)";
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShards(
  ctx: CanvasRenderingContext2D,
  shards: Shard[],
  ox: number,
  oy: number,
  time: number,
): void {
  for (const s of shards) {
    if (s.taken) continue;
    const x = s.pos.x - ox;
    const y = s.pos.y - oy + Math.sin(time * 3 + s.pulse) * 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.8 + s.pulse);
    ctx.fillStyle = "#e7fff8";
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawFractures(ctx: CanvasRenderingContext2D, fractures: Fracture[], ox: number, oy: number): void {
  for (const f of fractures) {
    const count = Math.max(2, Math.floor(1 + (f.points.length - 1) * f.grow));
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(186, 80, 255, 0.85)";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "rgba(12, 6, 20, 0.95)";
    ctx.lineWidth = 14;
    strokePoly(ctx, f.points, count, ox, oy);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(210, 110, 255, 0.8)";
    ctx.lineWidth = 3.2;
    strokePoly(ctx, f.points, count, ox, oy);
    ctx.strokeStyle = "rgba(255, 210, 255, 0.35)";
    ctx.lineWidth = 1;
    strokePoly(ctx, f.points, count, ox, oy);
  }
}

function strokePoly(
  ctx: CanvasRenderingContext2D,
  points: Vec[],
  count: number,
  ox: number,
  oy: number,
): void {
  ctx.beginPath();
  ctx.moveTo(points[0]!.x - ox, points[0]!.y - oy);
  for (let i = 1; i < count; i++) ctx.lineTo(points[i]!.x - ox, points[i]!.y - oy);
  ctx.stroke();
}

function drawDebris(ctx: CanvasRenderingContext2D, debris: Debris[], ox: number, oy: number): void {
  for (const d of debris) {
    ctx.save();
    ctx.translate(d.pos.x - ox, d.pos.y - oy);
    ctx.rotate(d.rot);
    ctx.fillStyle = "#1b1526";
    ctx.strokeStyle = "rgba(198,176,230,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < d.sides; i++) {
      const a = (i / d.sides) * Math.PI * 2;
      const r = d.size * (i % 2 === 0 ? 1 : 0.72);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawWells(ctx: CanvasRenderingContext2D, wells: Well[], ox: number, oy: number, time: number): void {
  for (const well of wells) {
    const x = well.pos.x - ox;
    const y = well.pos.y - oy;
    const g = ctx.createRadialGradient(x, y, 8, x, y, well.radius);
    g.addColorStop(0, "rgba(90,40,160,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, well.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(180,130,255,${0.18 + Math.sin(time * 3 + well.pulse) * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, 22 + Math.sin(time * 2 + well.pulse) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawAim(
  ctx: CanvasRenderingContext2D,
  mote: Mote,
  target: Anchor | null,
  tether: Tether,
  ox: number,
  oy: number,
): void {
  if (!target || tether.state !== "idle") return;
  const mx = mote.pos.x - ox;
  const my = mote.pos.y - oy;
  ctx.strokeStyle = "rgba(124,244,255,0.22)";
  ctx.setLineDash([3, 8]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(target.pos.x - ox, target.pos.y - oy);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTether(ctx: CanvasRenderingContext2D, mote: Mote, tether: Tether, ox: number, oy: number): void {
  if (tether.state === "idle") return;
  const tip = tether.drawTip(mote);
  const mx = mote.pos.x - ox;
  const my = mote.pos.y - oy;
  const tx = tip.x - ox;
  const ty = tip.y - oy;
  const taut = Math.min(1, Math.max(0, tether.stretch - 0.9));
  const sag = (1 - taut) * 22;
  const cx = (mx + tx) / 2 + (my - ty) * 0.08;
  const cy = (my + ty) / 2 + sag;

  ctx.strokeStyle = taut > 0.35 ? "#e8ffff" : COLORS.cyan;
  ctx.lineWidth = 2.2 + taut * 1.8;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 14 + taut * 12;
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.quadraticCurveTo(cx, cy, tx, ty);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawMote(
  ctx: CanvasRenderingContext2D,
  mote: Mote,
  ox: number,
  oy: number,
  pro: boolean,
  time: number,
): void {
  const x = mote.pos.x - ox;
  const y = mote.pos.y - oy;

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 1; i < mote.trail.length; i++) {
    const a = mote.trail[i - 1]!;
    const b = mote.trail[i]!;
    ctx.strokeStyle = pro
      ? `rgba(255, 180, 230, ${a.a * 0.45})`
      : `rgba(124, 244, 255, ${a.a * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(a.x - ox, a.y - oy);
    ctx.lineTo(b.x - ox, b.y - oy);
    ctx.stroke();
  }

  const bloom = ctx.createRadialGradient(x, y, 0, x, y, 34);
  bloom.addColorStop(0, pro ? "rgba(255,160,220,0.7)" : "rgba(124,244,255,0.7)");
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5ffff";
  ctx.shadowColor = pro ? COLORS.hot : COLORS.cyan;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(x, y, MOTE_RADIUS + Math.sin(time * 8) * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}
