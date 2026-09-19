import { persist } from "../storage/persist";

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = persist.muted();

  unlock(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    persist.setMuted(this.muted);
    return this.muted;
  }

  latch(): void {
    this.blip(620, 980, 0.09, "triangle", 0.09);
    this.click(1800, 0.03, 0.05);
  }

  miss(): void {
    this.blip(220, 140, 0.08, "sine", 0.05);
  }

  snap(): void {
    this.blip(420, 180, 0.07, "sawtooth", 0.05);
    this.click(900, 0.02, 0.04);
  }

  shard(combo: number): void {
    const pitch = 680 + Math.min(10, combo) * 46;
    this.blip(pitch, pitch * 1.4, 0.08, "sine", 0.07);
  }

  death(): void {
    this.blip(180, 40, 0.45, "sawtooth", 0.08);
    this.noise(0.28, 0.06);
  }

  combo(tier: number): void {
    this.blip(500 + tier * 80, 900 + tier * 40, 0.1, "triangle", 0.06);
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private out(): GainNode {
    this.ensure();
    return this.master!;
  }

  private blip(
    from: number,
    to: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.out());
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  private click(freq: number, dur: number, gain: number): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.out());
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.01);
  }

  private noise(dur: number, gain: number): void {
    if (this.muted) return;
    const ctx = this.ensure();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffer;
    g.gain.value = gain;
    src.connect(g);
    g.connect(this.out());
    src.start();
  }
}
