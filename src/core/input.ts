import { vec, type Vec } from "./math";

export class Input {
  pointer: Vec = vec();
  world: Vec = vec();
  held = false;
  pressed = false;
  released = false;
  active = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      this.sync(e);
      this.held = true;
      this.pressed = true;
      this.active = true;
      this.canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      this.sync(e);
    };
    const up = (e: PointerEvent) => {
      this.sync(e);
      if (this.held) this.released = true;
      this.held = false;
      this.active = false;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private sync(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    this.pointer = vec(e.clientX - r.left, e.clientY - r.top);
  }

  endFrame(): void {
    this.pressed = false;
    this.released = false;
  }
}
