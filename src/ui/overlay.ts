import { persist } from "../storage/persist";
import { isSubscribed, subscribe, restore, type PlanId } from "../monetisation/subscribe";

export type Screen = "title" | "results" | "gate" | "none";

export interface ResultView {
  score: number;
  combo: number;
  shards: number;
  time: number;
  survived: boolean;
  high: boolean;
  comboRecord: boolean;
}

export class Overlay {
  private overlay = el<HTMLElement>("overlay");
  private title = el<HTMLElement>("screen-title");
  private results = el<HTMLElement>("screen-results");
  private gate = el<HTMLElement>("screen-gate");
  private hud = el<HTMLElement>("hud");
  private prompt = el<HTMLElement>("prompt");
  private comboEl = el<HTMLElement>("hud-combo");
  private startBtn = el<HTMLButtonElement>("btn-start");
  private retryBtn = el<HTMLButtonElement>("btn-retry");
  private onPlay: (() => void) | null = null;
  private lastCombo = 1;

  constructor() {
    this.startBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onPlay?.();
    });
    this.retryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onPlay?.();
    });
    this.results.addEventListener("click", () => this.onPlay?.());
    this.overlay.addEventListener("click", () => {
      if (!this.results.hidden) this.onPlay?.();
    });

    el<HTMLButtonElement>("plan-yearly").addEventListener("click", () => {
      void this.purchase("yearly");
    });
    el<HTMLButtonElement>("plan-monthly").addEventListener("click", () => {
      void this.purchase("monthly");
    });
    el<HTMLButtonElement>("btn-restore").addEventListener("click", () => {
      void this.doRestore();
    });
  }

  bindPlay(handler: () => void): void {
    this.onPlay = handler;
  }

  show(screen: Screen): void {
    const playing = screen === "none";
    this.overlay.classList.toggle("hidden", playing);
    this.overlay.hidden = playing;
    this.title.hidden = screen !== "title";
    this.results.hidden = screen !== "results";
    this.gate.hidden = screen !== "gate";
    this.hud.hidden = !playing;
    if (!playing) this.prompt.hidden = true;
  }

  refreshTitle(): void {
    const sub = isSubscribed();
    const left = persist.remainingPlays(sub);
    el("title-plays").textContent = sub
      ? "Unlimited plays · Aether Pro"
      : `${left} free play${left === 1 ? "" : "s"} remaining`;
    const best = persist.highScore();
    const combo = persist.bestCombo();
    el("title-stats").textContent =
      best > 0 ? `Best ${fmt(best)}  ·  Combo ×${combo}` : "No high score yet";
    this.startBtn.textContent = left === 0 && !sub ? "Unlock unlimited" : "Enter the void";
  }

  showResults(view: ResultView): void {
    el("results-kicker").textContent = view.survived ? "Collapse survived" : "Dissolved";
    el("results-title").textContent = view.survived ? "You held the line" : "The dark took you";
    el("results-score").textContent = fmt(view.score);
    el("results-combo").textContent = `×${view.combo}`;
    el("results-shards").textContent = String(view.shards);
    el("results-time").textContent = `${view.time.toFixed(1)}s`;
    const notes = [];
    if (view.high) notes.push("New high score");
    if (view.comboRecord) notes.push("Best combo");
    el("results-record").textContent = notes.join(" · ");
    const pro = el<HTMLElement>("pro-badge");
    pro.hidden = !isSubscribed();
    const left = persist.remainingPlays(isSubscribed());
    this.retryBtn.textContent =
      left === 0 && !isSubscribed() ? "Unlock more plays" : "Retry";
    this.show("results");
  }

  hudState(score: number, combo: number, collapse: number, playsLabel: string): void {
    el("hud-score").textContent = fmt(score);
    el("hud-plays").textContent = playsLabel;
    el("collapse-fill").style.width = `${Math.min(100, collapse * 100)}%`;
    this.comboEl.textContent = `×${combo}`;
    if (combo !== this.lastCombo) {
      this.comboEl.classList.remove("punch");
      void this.comboEl.offsetWidth;
      this.comboEl.classList.add("punch");
      this.lastCombo = combo;
    }
  }

  setPrompt(visible: boolean, fading = false): void {
    this.prompt.hidden = !visible && !fading;
    this.prompt.classList.toggle("fade", fading);
    if (visible && !fading) this.prompt.textContent = "Hold to latch · Release to fly";
  }

  playsLabel(): string {
    if (isSubscribed()) return "∞";
    const left = persist.remainingPlays(false);
    return `${left} left`;
  }

  private async purchase(plan: PlanId): Promise<void> {
    const ok = await subscribe(plan);
    if (ok) {
      this.refreshTitle();
      this.show("title");
    }
  }

  private async doRestore(): Promise<void> {
    const ok = await restore();
    if (ok) {
      this.refreshTitle();
      this.show("title");
    }
  }
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
