import { ARR_INTERVAL, DAS_DELAY } from "./constants.js";
import type { Game } from "./game.js";

/** Keyboard controls with DAS auto-shift for left/right. */
export class Input {
  private heldLeft = false;
  private heldRight = false;
  private activeDir = 0; // -1 left, +1 right, 0 none
  private dasTimer = 0;
  private arrTimer = 0;
  onRestart: (() => void) | null = null;

  constructor(private game: Game) {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  private gameKey(code: string): boolean {
    return (
      code === "ArrowLeft" ||
      code === "ArrowRight" ||
      code === "ArrowDown" ||
      code === "ArrowUp" ||
      code === "Space" ||
      code === "KeyX" ||
      code === "KeyZ" ||
      code === "KeyC" ||
      code === "KeyR" ||
      code === "ControlLeft"
    );
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.gameKey(e.code)) return;
    e.preventDefault();
    if (e.repeat) {
      // OS repeat is ignored: DAS and soft drop are handled per-frame.
      // Keep soft drop active while Down is held.
      if (e.code === "ArrowDown") this.game.softDrop = true;
      return;
    }
    switch (e.code) {
      case "ArrowLeft":
        this.heldLeft = true;
        this.activeDir = -1;
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.game.tryMove(-1, 0);
        break;
      case "ArrowRight":
        this.heldRight = true;
        this.activeDir = 1;
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.game.tryMove(1, 0);
        break;
      case "ArrowDown":
        this.game.softDrop = true;
        break;
      case "ArrowUp":
      case "KeyX":
        this.game.tryRotate(1);
        break;
      case "KeyZ":
      case "ControlLeft":
        this.game.tryRotate(-1);
        break;
      case "Space":
        this.game.hardDrop();
        break;
      case "KeyC":
        this.game.holdPiece();
        break;
      case "KeyR":
        if (this.onRestart) this.onRestart();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "ArrowLeft":
        this.heldLeft = false;
        if (this.activeDir === -1) {
          this.activeDir = this.heldRight ? 1 : 0;
          this.dasTimer = 0;
          this.arrTimer = 0;
        }
        break;
      case "ArrowRight":
        this.heldRight = false;
        if (this.activeDir === 1) {
          this.activeDir = this.heldLeft ? -1 : 0;
          this.dasTimer = 0;
          this.arrTimer = 0;
        }
        break;
      case "ArrowDown":
        this.game.softDrop = false;
        break;
    }
  }

  update(dt: number): void {
    if (this.activeDir === 0 || this.game.gameOver) return;
    const wantLeft = this.activeDir === -1 && this.heldLeft;
    const wantRight = this.activeDir === 1 && this.heldRight;
    if (!wantLeft && !wantRight) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS_DELAY) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR_INTERVAL) {
      this.arrTimer -= ARR_INTERVAL;
      if (!this.game.tryMove(this.activeDir, 0)) {
        this.arrTimer = 0;
        break;
      }
    }
  }
}
