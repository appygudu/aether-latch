export class Rng {
  private s: number;

  constructor(seed = Date.now()) {
    this.s = seed >>> 0 || 1;
  }

  next(): number {
    this.s = (1664525 * this.s + 1013904223) >>> 0;
    return this.s / 0xffffffff;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }

  sign(): number {
    return this.next() < 0.5 ? -1 : 1;
  }
}
