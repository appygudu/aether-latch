import { AIR_DRAG, GRAVITY_Y, MAX_SPEED } from "../core/config";
import { limit, scale } from "../core/math";
import type { Mote, Well } from "./entities";

export function integrate(mote: Mote, wells: Well[], dt: number): void {
  let ax = 0;
  let ay = GRAVITY_Y;

  for (const well of wells) {
    const dx = well.pos.x - mote.pos.x;
    const dy = well.pos.y - mote.pos.y;
    const d = Math.max(28, Math.hypot(dx, dy));
    if (d < well.radius) {
      const pull = well.strength / (d * d);
      ax += dx * pull;
      ay += dy * pull;
    }
  }

  mote.vel.x += ax * dt;
  mote.vel.y += ay * dt;

  const drag = Math.exp(-AIR_DRAG * dt);
  mote.vel.x *= drag;
  mote.vel.y *= drag;
  mote.vel = limit(mote.vel, MAX_SPEED);

  mote.pos.x += mote.vel.x * dt;
  mote.pos.y += mote.vel.y * dt;

  mote.trail.unshift({ x: mote.pos.x, y: mote.pos.y, a: 1 });
  if (mote.trail.length > 18) mote.trail.pop();
  for (let i = 0; i < mote.trail.length; i++) {
    mote.trail[i]!.a = 1 - i / mote.trail.length;
  }
}

export function slingshotBoost(mote: Mote, stretch: number): void {
  if (stretch <= 1.08) return;
  const extra = Math.min(0.22, (stretch - 1) * 0.12);
  mote.vel = scale(mote.vel, 1 + extra);
}
