export type Action = "left" | "right" | "down" | "cw" | "ccw" | "drop" | "hold" | "pause" | "enter" | "restart";
const DAS = 167;
const ARR = 33;
const KEY_ACTIONS: Record<string, Action> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down",
  ArrowUp: "cw", KeyX: "cw", KeyZ: "ccw", ControlLeft: "ccw",
  Space: "drop", KeyC: "hold", KeyP: "pause", Escape: "pause",
  Enter: "enter", KeyR: "restart",
};

/** One shared repeat clock for physical keys and touch buttons. */
export class Input {
  private held = new Map<string, Action>();
  private direction: "left" | "right" | null = null;
  private repeatElapsed = 0;
  private nextRepeat = DAS;

  constructor(
    private readonly act: (action: Action) => void,
    private readonly isPlaying: () => boolean,
  ) {
    window.addEventListener("keydown", (event) => {
      const target = event.target;
      if (document.querySelector("dialog[open]") || (target instanceof HTMLElement && (
        target.isContentEditable || target.closest("input, textarea, select")
      ))) return;
      if (event.altKey || event.metaKey || (event.ctrlKey && event.code !== "ControlLeft")) return;
      const action = KEY_ACTIONS[event.code];
      if (!action) return;
      if ((event.code === "Enter" || event.code === "Space") && target instanceof HTMLElement && target.closest("button, a")) return;
      event.preventDefault();
      if (!event.repeat) this.press(event.code, action);
    });
    window.addEventListener("keyup", (event) => this.release(event.code));

    document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      const action = button.dataset.action as Action;
      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.press(`pointer-${event.pointerId}`, action);
      });
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
        button.addEventListener(name, (event) => this.release(`pointer-${event.pointerId}`));
      }
      // Native keyboard/assistive-technology clicks have no pointerdown.
      button.addEventListener("click", (event) => {
        if (event.detail === 0) this.act(action);
      });
    });
  }

  get softDropping(): boolean {
    return [...this.held.values()].includes("down");
  }

  update(delta: number): void {
    if (!this.isPlaying()) {
      this.clear();
      return;
    }
    if (!this.direction) return;
    this.repeatElapsed += delta;
    while (this.repeatElapsed >= this.nextRepeat) {
      this.act(this.direction);
      this.nextRepeat += ARR;
    }
  }

  clear(): void {
    this.held.clear();
    this.direction = null;
    this.repeatElapsed = 0;
    this.nextRepeat = DAS;
  }

  private press(id: string, action: Action): void {
    if (this.held.has(id)) return;
    if (action === "left" || action === "right" || action === "down") {
      if (!this.isPlaying()) return;
      this.held.set(id, action);
      if (action !== "down") {
        this.direction = action;
        this.repeatElapsed = 0;
        this.nextRepeat = DAS;
      }
    }
    this.act(action);
  }

  private release(id: string): void {
    const previous = this.held.get(id);
    this.held.delete(id);
    if (previous !== "left" && previous !== "right") return;
    const remaining = [...this.held.values()].filter((action) => action === "left" || action === "right");
    const direction = remaining.at(-1) ?? null;
    if (direction !== this.direction) {
      this.direction = direction;
      this.repeatElapsed = 0;
      this.nextRepeat = DAS;
      if (direction && this.isPlaying()) this.act(direction);
    }
  }
}
