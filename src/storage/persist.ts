import { FREE_PLAYS, STORAGE } from "../core/config";

const readInt = (key: string, fallback = 0): number => {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const persist = {
  playsUsed(): number {
    return Math.max(0, readInt(STORAGE.playsUsed));
  },

  remainingPlays(subscribed: boolean): number {
    if (subscribed) return Number.POSITIVE_INFINITY;
    return Math.max(0, FREE_PLAYS - this.playsUsed());
  },

  consumePlay(): void {
    localStorage.setItem(STORAGE.playsUsed, String(this.playsUsed() + 1));
  },

  highScore(): number {
    return readInt(STORAGE.highScore);
  },

  bestCombo(): number {
    return readInt(STORAGE.bestCombo);
  },

  saveScore(score: number, combo: number): { high: boolean; comboRecord: boolean } {
    const high = score > this.highScore();
    const comboRecord = combo > this.bestCombo();
    if (high) localStorage.setItem(STORAGE.highScore, String(score));
    if (comboRecord) localStorage.setItem(STORAGE.bestCombo, String(combo));
    return { high, comboRecord };
  },

  promptSeen(): boolean {
    return localStorage.getItem(STORAGE.promptSeen) === "1";
  },

  markPromptSeen(): void {
    localStorage.setItem(STORAGE.promptSeen, "1");
  },

  muted(): boolean {
    return localStorage.getItem(STORAGE.muted) === "1";
  },

  setMuted(value: boolean): void {
    localStorage.setItem(STORAGE.muted, value ? "1" : "0");
  },
};
