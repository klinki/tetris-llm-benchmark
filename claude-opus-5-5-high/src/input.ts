import type { Game } from "./game.js";

/** Delayed Auto Shift: how long a side key is held before it starts repeating. */
export const DAS_MS = 170;
/** Auto Repeat Rate: delay between repeated side moves. */
export const ARR_MS = 50;

type Action = "left" | "right" | "rotateCW" | "rotateCCW" | "softDrop" | "hardDrop" | "hold" | "restart" | "pause";

const KEY_BINDINGS: Readonly<Record<string, Action>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "rotateCW",
  KeyX: "rotateCW",
  KeyZ: "rotateCCW",
  ControlLeft: "rotateCCW",
  ArrowDown: "softDrop",
  Space: "hardDrop",
  KeyC: "hold",
  ShiftLeft: "hold",
  ShiftRight: "hold",
  KeyR: "restart",
  KeyP: "pause",
  Escape: "pause",
};

/** Translates keyboard events into game actions, with DAS/ARR for sideways movement. */
export class Input {
  private direction: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  /** Currently held key codes. */
  private readonly pressed = new Set<string>();

  constructor(private readonly game: Game) {}

  attach(target: Window): void {
    target.addEventListener("keydown", (e) => this.onKeyDown(e));
    target.addEventListener("keyup", (e) => this.onKeyUp(e));
    target.addEventListener("blur", () => this.releaseAll());
  }

  /** Call once per frame to handle auto-repeat. */
  update(dt: number): void {
    if (this.direction === 0) return;
    this.dasTimer += dt;
    while (this.dasTimer >= DAS_MS) {
      if (!this.shift(this.direction)) {
        this.dasTimer = DAS_MS; // keep charged so movement resumes once unblocked
        break;
      }
      this.dasTimer -= ARR_MS;
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    const action = KEY_BINDINGS[e.code];
    if (!action) return;
    e.preventDefault();
    if (e.repeat || this.pressed.has(e.code)) return;
    this.pressed.add(e.code);

    const game = this.game;
    switch (action) {
      case "left":
      case "right":
        this.direction = action === "left" ? -1 : 1;
        this.dasTimer = 0;
        this.shift(this.direction);
        break;
      case "rotateCW":
        game.rotateCW();
        break;
      case "rotateCCW":
        game.rotateCCW();
        break;
      case "softDrop":
        game.setSoftDrop(true);
        break;
      case "hardDrop":
        game.hardDrop();
        break;
      case "hold":
        game.hold();
        break;
      case "restart":
        if (game.status === "over") game.reset();
        break;
      case "pause":
        game.togglePause();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const action = KEY_BINDINGS[e.code];
    if (!action) return;
    this.pressed.delete(e.code);
    if (this.isHeld(action)) return; // another key bound to the same action is still down

    if (action === "softDrop") this.game.setSoftDrop(false);
    const released = action === "left" ? -1 : action === "right" ? 1 : 0;
    if (released !== 0 && released === this.direction) {
      // Fall back to the opposite direction if it is still held.
      const other = action === "left" ? "right" : "left";
      this.direction = this.isHeld(other) ? (-released as -1 | 1) : 0;
      this.dasTimer = 0;
    }
  }

  private isHeld(action: Action): boolean {
    for (const code of this.pressed) if (KEY_BINDINGS[code] === action) return true;
    return false;
  }

  private releaseAll(): void {
    this.pressed.clear();
    this.direction = 0;
    this.game.setSoftDrop(false);
  }

  private shift(direction: -1 | 1): boolean {
    return direction < 0 ? this.game.moveLeft() : this.game.moveRight();
  }
}
