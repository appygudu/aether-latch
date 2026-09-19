import { COLORS } from "../core/config";
import type { Vec } from "../core/math";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

export class Particles {
  items: Particle[] = [];

  burst(at: Vec, n: number, color: string, speed = 220, size = 2.4): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random());
      this.items.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.45,
        max: 0.8,
        size: size * (0.6 + Math.random()),
        color,
      });
    }
  }

  trail(at: Vec, color: string, pro: boolean): void {
    const palette = pro ? COLORS.aurora : [color, "#b8a4ff"];
    this.items.push({
      x: at.x + (Math.random() - 0.5) * 6,
      y: at.y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      life: 0.28,
      max: 0.28,
      size: pro ? 2.6 : 1.8,
      color: palette[Math.floor(Math.random() * palette.length)]!,
    });
  }

  snap(from: Vec, to: Vec): void {
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      this.burst(
        { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t },
        2,
        "#e8ffff",
        80,
        1.4,
      );
    }
  }

  dissolve(at: Vec): void {
    this.burst(at, 70, "#7cf4ff", 380, 3);
    this.burst(at, 40, "#8b6cff", 260, 2.2);
    this.burst(at, 24, "#ff7ad9", 180, 1.8);
  }

  update(dt: number): void {
    for (const p of this.items) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    this.items = this.items.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - ox, p.y - oy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
