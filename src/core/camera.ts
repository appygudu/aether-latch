import {
  CAMERA_FOLLOW,
  LOOK_AHEAD,
  SHAKE_DECAY,
} from "./config";
import { add, lerpVec, scale, vec, type Vec } from "./math";

export class Camera {
  pos = vec();
  punch = 0;
  private shake = 0;
  private offset = vec();

  follow(target: Vec, vel: Vec, dt: number): void {
    const desired = add(target, scale(vel, LOOK_AHEAD));
    const k = 1 - Math.exp(-CAMERA_FOLLOW * dt);
    this.pos = lerpVec(this.pos, desired, k);
    this.shake *= Math.exp(-SHAKE_DECAY * dt);
    this.punch *= Math.exp(-14 * dt);
    const ang = Math.random() * Math.PI * 2;
    this.offset = {
      x: Math.cos(ang) * this.shake,
      y: Math.sin(ang) * this.shake,
    };
  }

  bump(amount: number): void {
    this.shake = Math.min(18, this.shake + amount);
    this.punch = Math.min(1, this.punch + amount * 0.08);
  }

  view(): Vec {
    return add(this.pos, this.offset);
  }
}
