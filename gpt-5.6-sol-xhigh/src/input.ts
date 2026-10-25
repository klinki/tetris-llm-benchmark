import type { TetrisGame } from "./game.js";

type RepeatAction = "left" | "right" | "soft-drop";
type Action = RepeatAction | "rotate-cw" | "rotate-ccw" | "hard-drop" | "hold" | "pause" | "restart";

interface HeldAction {
  elapsed: number;
  next: number;
}

const KEY_ACTIONS: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "soft-drop",
  ArrowUp: "rotate-cw",
  KeyX: "rotate-cw",
  KeyZ: "rotate-ccw",
  ControlLeft: "rotate-ccw",
  ControlRight: "rotate-ccw",
  Space: "hard-drop",
  KeyC: "hold",
  KeyP: "pause",
  Escape: "pause",
  KeyR: "restart"
};

const REPEAT_ACTIONS = new Set<Action>(["left", "right", "soft-drop"]);

export class InputController {
  private game: TetrisGame;
  private held = new Map<RepeatAction, HeldAction>();
  private touchTimers = new Map<HTMLElement, number[]>();
  private onRestart: () => void;

  constructor(game: TetrisGame, onRestart: () => void) {
    this.game = game;
    this.onRestart = onRestart;
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", () => this.held.clear());

    document.querySelectorAll<HTMLElement>("[data-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => this.startTouch(event, button));
      button.addEventListener("pointerup", () => this.stopTouch(button));
      button.addEventListener("pointercancel", () => this.stopTouch(button));
      button.addEventListener("pointerleave", () => this.stopTouch(button));
    });
  }

  update(elapsedMs: number): void {
    for (const [action, state] of this.held) {
      state.elapsed += elapsedMs;
      while (state.elapsed >= state.next) {
        this.perform(action);
        state.next += action === "soft-drop" ? 42 : 38;
      }
    }
  }

  perform(action: Action): void {
    switch (action) {
      case "left": this.game.move(-1); break;
      case "right": this.game.move(1); break;
      case "soft-drop": this.game.softDrop(); break;
      case "rotate-cw": this.game.rotate(1); break;
      case "rotate-ccw": this.game.rotate(-1); break;
      case "hard-drop": this.game.hardDrop(); break;
      case "hold": this.game.hold(); break;
      case "pause": this.game.togglePause(); break;
      case "restart": if (this.game.gameOver) this.onRestart(); break;
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    event.preventDefault();
    if (event.repeat) return;
    this.perform(action);
    if (REPEAT_ACTIONS.has(action)) {
      this.held.set(action as RepeatAction, { elapsed: 0, next: action === "soft-drop" ? 55 : 145 });
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_ACTIONS[event.code];
    if (action && REPEAT_ACTIONS.has(action)) this.held.delete(action as RepeatAction);
  };

  private startTouch(event: PointerEvent, button: HTMLElement): void {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    const action = button.dataset.action as Action | undefined;
    if (!action) return;
    this.perform(action);
    if (!REPEAT_ACTIONS.has(action)) return;
    const timeout = window.setTimeout(() => {
      const interval = window.setInterval(() => this.perform(action), action === "soft-drop" ? 50 : 70);
      const timers = this.touchTimers.get(button) ?? [];
      timers.push(interval);
      this.touchTimers.set(button, timers);
    }, 180);
    this.touchTimers.set(button, [timeout]);
  }

  private stopTouch(button: HTMLElement): void {
    for (const timer of this.touchTimers.get(button) ?? []) {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    }
    this.touchTimers.delete(button);
  }
}
