import { ARR_MS, DAS_MS } from "./constants.js";
import { Game } from "./game.js";

export class Input {
  private leftHeld = false;
  private rightHeld = false;
  private dasDir: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private game: Game) {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) {
      // Prevent page scroll on repeats; movement handled by DAS in update().
      if (["ArrowLeft", "ArrowRight", "ArrowDown", " "].includes(e.key)) e.preventDefault();
      if (e.key === " " || e.key === "ArrowUp") return;
      return;
    }
    const g = this.game;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        this.leftHeld = true;
        this.beginDas(-1);
        g.tryMove(-1, 0);
        break;
      case "ArrowRight":
        e.preventDefault();
        this.rightHeld = true;
        this.beginDas(1);
        g.tryMove(1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        g.softDrop = true;
        break;
      case "ArrowUp":
      case "x":
      case "X":
        g.tryRotate(1);
        break;
      case "z":
      case "Z":
        g.tryRotate(-1);
        break;
      case "Control":
        // Left ctrl rotates anti-clockwise; right ctrl too (can't reliably
        // distinguish sides via `key`, so treat either as CCW).
        g.tryRotate(-1);
        break;
      case " ":
        e.preventDefault();
        g.hardDrop();
        break;
      case "c":
      case "C":
        g.hold();
        break;
      case "r":
      case "R":
        if (g.status === "over") g.restart();
        break;
      case "p":
      case "P":
        // reserved for pause (no-op to keep scope small)
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowLeft":
        this.leftHeld = false;
        if (this.dasDir === -1) this.dasDir = this.rightHeld ? 1 : 0;
        break;
      case "ArrowRight":
        this.rightHeld = false;
        if (this.dasDir === 1) this.dasDir = this.leftHeld ? -1 : 0;
        break;
      case "ArrowDown":
        this.game.softDrop = false;
        break;
    }
  }

  private beginDas(dir: -1 | 1): void {
    this.dasDir = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;
  }

  update(dtMs: number): void {
    if (this.dasDir === 0 || this.game.status !== "playing") return;
    this.dasTimer += dtMs;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dtMs;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      if (!this.game.tryMove(this.dasDir, 0)) {
        this.arrTimer = 0;
        break;
      }
    }
  }
}
