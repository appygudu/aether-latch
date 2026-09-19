import {
  FILAMENT_FLIGHT,
  LATCH_RANGE,
  MAX_STRETCH,
  REST_FACTOR,
  SPRING_DAMP,
  SPRING_K,
} from "../core/config";
import { dist, dot, len, limit, norm, scale, sub, vec, type Vec } from "../core/math";
import type { Anchor, Mote } from "./entities";

export type TetherState = "idle" | "firing" | "latched" | "retracting";

export class Tether {
  state: TetherState = "idle";
  anchor: Anchor | null = null;
  rest = 0;
  flight = 0;
  retract = 0;
  tip = vec();
  stretch = 0;
  lastLen = 0;

  reset(): void {
    this.state = "idle";
    this.anchor = null;
    this.rest = 0;
    this.flight = 0;
    this.retract = 0;
    this.stretch = 0;
  }

  pick(mote: Mote, anchors: Anchor[], pointer: Vec): Anchor | null {
    const inRange = anchors.filter((a) => dist(mote.pos, a.pos) <= LATCH_RANGE);
    if (inRange.length === 0) return null;
    if (inRange.length === 1) return inRange[0]!;

    const aim = norm(sub(pointer, mote.pos));
    let best = inRange[0]!;
    let bestScore = -Infinity;
    for (const a of inRange) {
      const to = sub(a.pos, mote.pos);
      const d = len(to);
      const dir = norm(to);
      const score = dot(dir, aim) * 1.35 + (1 - d / LATCH_RANGE);
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }

  fire(mote: Mote, anchor: Anchor): void {
    this.anchor = anchor;
    this.state = "firing";
    this.flight = 0;
    this.tip = { ...mote.pos };
    this.rest = dist(mote.pos, anchor.pos) * REST_FACTOR;
  }

  miss(): void {
    this.state = "idle";
    this.anchor = null;
  }

  release(): void {
    if (this.state === "latched" || this.state === "firing") {
      this.state = "retracting";
      this.retract = 0;
    }
  }

  update(mote: Mote, dt: number): "latched" | "snapped" | null {
    if (this.state === "firing" && this.anchor) {
      this.flight += dt / FILAMENT_FLIGHT;
      const t = Math.min(1, this.flight);
      this.tip = {
        x: mote.pos.x + (this.anchor.pos.x - mote.pos.x) * t,
        y: mote.pos.y + (this.anchor.pos.y - mote.pos.y) * t,
      };
      if (t >= 1) {
        this.state = "latched";
        this.lastLen = dist(mote.pos, this.anchor.pos);
        return "latched";
      }
    }

    if (this.state === "latched" && this.anchor) {
      this.applySpring(mote, dt);
    }

    if (this.state === "retracting") {
      this.retract += dt / 0.12;
      if (this.retract >= 1) {
        this.reset();
        return "snapped";
      }
    }
    return null;
  }

  private applySpring(mote: Mote, dt: number): void {
    const anchor = this.anchor;
    if (!anchor) return;
    const delta = sub(mote.pos, anchor.pos);
    const d = Math.max(1e-4, len(delta));
    const n = scale(delta, 1 / d);
    this.lastLen = d;
    this.stretch = d / Math.max(40, this.rest);

    const ext = d - this.rest;
    const radial = dot(mote.vel, n);
    mote.vel.x -= n.x * (ext * SPRING_K + radial * SPRING_DAMP) * dt;
    mote.vel.y -= n.y * (ext * SPRING_K + radial * SPRING_DAMP) * dt;

    const cap = this.rest * MAX_STRETCH;
    if (d > cap) {
      mote.pos.x = anchor.pos.x + n.x * cap;
      mote.pos.y = anchor.pos.y + n.y * cap;
      if (radial > 0) {
        mote.vel.x -= n.x * radial;
        mote.vel.y -= n.y * radial;
      }
    }
    mote.vel = limit(mote.vel, 1280);
  }

  drawTip(mote: Mote): Vec {
    if (this.state === "firing") return this.tip;
    if (this.state === "latched" && this.anchor) return this.anchor.pos;
    if (this.state === "retracting" && this.anchor) {
      const t = Math.min(1, this.retract);
      return {
        x: this.anchor.pos.x + (mote.pos.x - this.anchor.pos.x) * t,
        y: this.anchor.pos.y + (mote.pos.y - this.anchor.pos.y) * t,
      };
    }
    return mote.pos;
  }
}
