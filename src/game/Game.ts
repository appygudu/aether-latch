import { Synth } from "../audio/synth";
import {
  DEBRIS_HIT,
  LATCH_RANGE,
  MOTE_RADIUS,
  RUN_DURATION,
  SHARD_RADIUS,
} from "../core/config";
import { Camera } from "../core/camera";
import { Input } from "../core/input";
import { dist, segDist, vec } from "../core/math";
import { Rng } from "../core/rng";
import { isSubscribed } from "../monetisation/subscribe";
import { persist } from "../storage/persist";
import { Overlay } from "../ui/overlay";
import type { World } from "./entities";
import { Particles } from "./particles";
import { integrate, slingshotBoost } from "./physics";
import { drawFrame, resizeCanvas } from "./render";
import { createWorld, growFractures, maintainField, nearestInRange, tickAnchors } from "./spawn";
import { Tether } from "./tether";

type Phase = "title" | "playing" | "dying" | "results";

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly camera = new Camera();
  private readonly overlay = new Overlay();
  private readonly audio = new Synth();
  private readonly particles = new Particles();
  private readonly tether = new Tether();
  private rng = new Rng();
  private world: World = createWorld(this.rng);
  private phase: Phase = "title";
  private time = 0;
  private score = 0;
  private combo = 1;
  private bestCombo = 1;
  private shards = 0;
  private chainReady = false;
  private air = 0;
  private deathT = 0;
  private survived = false;
  private showPrompt = false;
  private last = performance.now();
  private acc = 0;
  private hudTick = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is required");
    this.ctx = ctx;
    this.input = new Input(canvas);
    this.overlay.bindPlay(() => this.requestPlay());
    el<HTMLButtonElement>("mute").addEventListener("click", () => {
      const muted = this.audio.toggleMute();
      el("mute-icon").textContent = muted ? "×" : "♪";
    });
    if (this.audio.muted) el("mute-icon").textContent = "×";

    window.addEventListener("resize", () => resizeCanvas(canvas));
    resizeCanvas(canvas);
    this.resetAttract();
    this.overlay.refreshTitle();
    this.overlay.show("title");
  }

  start(): void {
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.acc += dt;
      const step = 1 / 120;
      while (this.acc >= step) {
        this.update(step);
        this.acc -= step;
      }
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private requestPlay(): void {
    this.audio.unlock();
    if (this.phase === "playing" || this.phase === "dying") return;
    if (!isSubscribed() && persist.remainingPlays(false) <= 0) {
      this.overlay.show("gate");
      return;
    }
    persist.consumePlay();
    this.beginRun();
  }

  private beginRun(): void {
    this.rng = new Rng();
    this.world = createWorld(this.rng);
    this.tether.reset();
    this.particles.items.length = 0;
    this.time = 0;
    this.score = 0;
    this.combo = 1;
    this.bestCombo = 1;
    this.shards = 0;
    this.chainReady = false;
    this.air = 0;
    this.deathT = 0;
    this.survived = false;
    this.camera.pos = { ...this.world.mote.pos };
    this.phase = "playing";
    this.showPrompt = !persist.promptSeen() && persist.playsUsed() <= 1;
    this.overlay.setPrompt(this.showPrompt);
    this.overlay.show("none");
    this.syncHud();
  }

  private resetAttract(): void {
    this.world = createWorld(new Rng(7));
    this.world.mote.pos = vec(0, 0);
    this.world.mote.vel = vec(12, -8);
    this.camera.pos = { ...this.world.mote.pos };
  }

  private update(dt: number): void {
    const { world } = this;
    const intensity = this.phase === "playing" ? Math.min(1, this.time / RUN_DURATION) : 0.15;

    if (this.phase === "title") {
      world.mote.pos.x += Math.sin(performance.now() / 1400) * 8 * dt;
      world.mote.pos.y += Math.cos(performance.now() / 1800) * 6 * dt;
      tickAnchors(world.anchors, dt, 0.2);
      this.camera.follow(world.mote.pos, world.mote.vel, dt);
      this.particles.update(dt);
      this.input.endFrame();
      return;
    }

    tickAnchors(world.anchors, dt, intensity);
    growFractures(world.fractures, dt);
    for (const d of world.debris) {
      d.pos.x += d.vel.x * dt;
      d.pos.y += d.vel.y * dt;
      d.rot += d.spin * dt;
    }
    for (const w of world.wells) w.pulse += dt;

    if (this.phase === "playing") {
      this.time += dt;
      maintainField(world, this.rng, this.time, intensity);
      this.handleInput();
      const event = this.tether.update(world.mote, dt);
      if (event === "latched") {
        this.audio.latch();
        this.camera.bump(7);
        this.particles.burst(world.mote.pos, 12, "#7cf4ff", 140, 1.8);
        if (this.showPrompt) {
          this.showPrompt = false;
          persist.markPromptSeen();
          this.overlay.setPrompt(false, true);
        }
        if (this.chainReady) this.bumpCombo();
        this.chainReady = false;
        this.air = 0;
      }
      integrate(world.mote, world.wells, dt);
      this.particles.trail(world.mote.pos, "#7cf4ff", isSubscribed());
      this.collectShards();
      if (this.tether.state === "idle") this.air += dt;
      if (this.air > 2.4 && this.combo > 1) {
        this.combo = 1;
        this.syncHud();
      }
      if (this.hitsHazard() || this.time >= RUN_DURATION) {
        if (this.time >= RUN_DURATION) this.survived = true;
        this.kill();
      }
      this.hudTick += dt;
      if (this.hudTick > 0.08) {
        this.hudTick = 0;
        this.syncHud();
      }
    } else if (this.phase === "dying") {
      this.tether.update(world.mote, dt);
      this.deathT += dt;
      if (this.deathT > 0.55) this.finishRun();
    }

    this.camera.follow(world.mote.pos, world.mote.vel, dt);
    this.particles.update(dt);
    this.input.endFrame();
  }

  private handleInput(): void {
    const { mote } = this.world;
    this.input.world = {
      x: this.camera.view().x - window.innerWidth / 2 + this.input.pointer.x,
      y: this.camera.view().y - window.innerHeight / 2 + this.input.pointer.y,
    };

    if (this.input.pressed && this.tether.state === "idle") {
      const target = this.tether.pick(mote, this.world.anchors, this.input.world);
      if (target) this.tether.fire(mote, target);
      else {
        this.audio.miss();
        this.particles.burst(mote.pos, 6, "#8b6cff", 80, 1.2);
      }
    }

    if (this.input.released && (this.tether.state === "latched" || this.tether.state === "firing")) {
      slingshotBoost(mote, this.tether.stretch);
      const tip = this.tether.drawTip(mote);
      this.particles.snap(mote.pos, tip);
      this.tether.release();
      this.audio.snap();
      this.camera.bump(4);
      this.chainReady = true;
      this.score += 40 * this.combo;
    }
  }

  private bumpCombo(): void {
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.audio.combo(this.combo);
    this.camera.bump(5);
    this.score += 80 * this.combo;
  }

  private collectShards(): void {
    const { mote } = this.world;
    for (const shard of this.world.shards) {
      if (shard.taken) continue;
      if (dist(mote.pos, shard.pos) < MOTE_RADIUS + SHARD_RADIUS + 6) {
        shard.taken = true;
        this.shards += 1;
        this.score += 150 * this.combo;
        this.audio.shard(this.combo);
        this.camera.bump(6);
        this.particles.burst(shard.pos, 16, "#e7fff8", 200, 2);
      }
    }
  }

  private hitsHazard(): boolean {
    const { mote } = this.world;
    for (const d of this.world.debris) {
      if (dist(mote.pos, d.pos) < MOTE_RADIUS + DEBRIS_HIT) return true;
    }
    for (const f of this.world.fractures) {
      const count = Math.max(2, Math.floor(1 + (f.points.length - 1) * f.grow));
      for (let i = 1; i < count; i++) {
        if (segDist(mote.pos, f.points[i - 1]!, f.points[i]!) < 11) return true;
      }
    }
    return false;
  }

  private kill(): void {
    this.phase = "dying";
    this.deathT = 0;
    this.tether.reset();
    this.audio.death();
    this.camera.bump(16);
    this.particles.dissolve(this.world.mote.pos);
    this.world.mote.vel = vec();
  }

  private finishRun(): void {
    if (this.survived) this.score += 2500;
    const records = persist.saveScore(this.score, this.bestCombo);
    this.phase = "results";
    this.overlay.showResults({
      score: this.score,
      combo: this.bestCombo,
      shards: this.shards,
      time: Math.min(this.time, RUN_DURATION),
      survived: this.survived,
      high: records.high,
      comboRecord: records.comboRecord,
    });
    this.overlay.refreshTitle();
  }

  private syncHud(): void {
    this.overlay.hudState(
      this.score,
      this.combo,
      Math.min(1, this.time / RUN_DURATION),
      this.overlay.playsLabel(),
    );
  }

  private draw(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const hidden = this.phase === "dying" && this.deathT > 0.08;
    const target =
      this.phase === "playing" ? nearestInRange(this.world.mote.pos, this.world.anchors) : null;
    const mote = hidden
      ? { ...this.world.mote, pos: { ...this.world.mote.pos }, trail: [] }
      : this.world.mote;
    drawFrame(
      this.ctx,
      this.camera.view(),
      w,
      h,
      mote,
      this.world.anchors,
      this.world.shards,
      this.world.fractures,
      this.world.debris,
      this.world.wells,
      this.tether,
      target && dist(this.world.mote.pos, target.pos) <= LATCH_RANGE ? target : null,
      this.camera.punch,
      this.phase === "playing" ? this.time / RUN_DURATION : 0.2,
      isSubscribed(),
      performance.now() / 1000,
      !hidden,
    );
    this.particles.draw(
      this.ctx,
      this.camera.view().x - w / 2,
      this.camera.view().y - h / 2,
    );
  }
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}
