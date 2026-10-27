import { Game } from "./game.js";

const DAS_MS = 170; // delay before auto-repeat starts
const ARR_MS = 50; // auto-repeat interval

type Action = "left" | "right" | "softDrop" | "rotateCW" | "rotateCCW" | "hardDrop" | "hold" | "restart" | "pause";

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "softDrop",
  ArrowUp: "rotateCW",
  KeyX: "rotateCW",
  KeyZ: "rotateCCW",
  ControlLeft: "rotateCCW",
  Space: "hardDrop",
  KeyC: "hold",
  ShiftLeft: "hold",
  KeyR: "restart",
  KeyP: "pause",
  Escape: "pause",
};

/** Keyboard handling with Guideline-style delayed auto shift for sideways moves. */
export class Input {
  /** Horizontal keys currently held, most recent last. */
  private held: Array<-1 | 1> = [];
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private readonly game: Game, target: Window = window) {
    target.addEventListener("keydown", (e) => this.onKeyDown(e));
    target.addEventListener("keyup", (e) => this.onKeyUp(e));
    target.addEventListener("blur", () => this.releaseAll());
  }

  /** Advances auto-repeat; call once per frame. */
  update(dtMs: number): void {
    const dir = this.held[this.held.length - 1];
    if (dir === undefined) return;
    this.dasTimer += dtMs;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dtMs;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      if (!this.shift(dir)) {
        this.arrTimer = 0;
        break;
      }
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return;
    const game = this.game;
    switch (action) {
      case "left":
        return this.pressShift(-1);
      case "right":
        return this.pressShift(1);
      case "softDrop":
        return game.setSoftDrop(true);
      case "rotateCW":
        game.rotate(1);
        return;
      case "rotateCCW":
        game.rotate(-1);
        return;
      case "hardDrop":
        return game.hardDrop();
      case "hold":
        return game.hold();
      case "pause":
        return game.togglePause();
      case "restart":
        if (game.gameOver) {
          game.reset();
          this.releaseAll();
        }
        return;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const action = KEY_MAP[e.code];
    if (action === "left") this.releaseShift(-1);
    else if (action === "right") this.releaseShift(1);
    else if (action === "softDrop") this.game.setSoftDrop(false);
  }

  private pressShift(dir: -1 | 1): void {
    this.held = this.held.filter((d) => d !== dir);
    this.held.push(dir);
    this.resetRepeat();
    this.shift(dir);
  }

  private releaseShift(dir: -1 | 1): void {
    this.held = this.held.filter((d) => d !== dir);
    this.resetRepeat();
  }

  private releaseAll(): void {
    this.held = [];
    this.resetRepeat();
    this.game.setSoftDrop(false);
  }

  private resetRepeat(): void {
    this.dasTimer = 0;
    this.arrTimer = 0;
  }

  private shift(dir: -1 | 1): boolean {
    return dir < 0 ? this.game.moveLeft() : this.game.moveRight();
  }
}
