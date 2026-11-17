// Keyboard input: discrete actions on keydown plus DAS/ARR auto-shift for
// held left/right keys. Uses event.code so it is layout independent.
import { ARR, DAS } from "./constants.js";
import type { Game } from "./game.js";

export class Input {
  private heldDirs: number[] = [];
  private dasTimer = 0;
  private arrTimer = 0;
  private downHeld = false;

  constructor(private game: Game) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  get softDrop(): boolean {
    return this.downHeld;
  }

  /** Per-frame auto-shift for held horizontal keys. */
  update(dt: number): void {
    if (this.heldDirs.length === 0) return;
    const dir = this.heldDirs[this.heldDirs.length - 1];
    this.dasTimer += dt;
    if (this.dasTimer >= DAS) {
      this.arrTimer += dt;
      while (this.arrTimer >= ARR) {
        this.arrTimer -= ARR;
        this.game.move(dir);
      }
    }
  }

  private pressDir(dir: number): void {
    if (this.heldDirs.includes(dir)) return;
    this.heldDirs.push(dir);
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.game.move(dir);
  }

  private releaseDir(dir: number): void {
    const i = this.heldDirs.indexOf(dir);
    if (i === -1) return;
    const wasTop = i === this.heldDirs.length - 1;
    this.heldDirs.splice(i, 1);
    if (wasTop && this.heldDirs.length > 0) {
      this.dasTimer = 0;
      this.arrTimer = 0;
      this.game.move(this.heldDirs[this.heldDirs.length - 1]);
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    switch (e.code) {
      case "ArrowLeft":
        e.preventDefault();
        this.pressDir(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        this.pressDir(1);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.downHeld = true;
        break;
      case "ArrowUp":
      case "KeyX":
        e.preventDefault();
        this.game.rotate(1);
        break;
      case "KeyZ":
      case "ControlLeft":
        e.preventDefault();
        this.game.rotate(-1);
        break;
      case "Space":
        e.preventDefault();
        this.game.hardDrop();
        break;
      case "KeyC":
        e.preventDefault();
        this.game.holdPiece();
        break;
      case "KeyR":
        e.preventDefault();
        this.game.restart();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case "ArrowLeft":
        this.releaseDir(-1);
        break;
      case "ArrowRight":
        this.releaseDir(1);
        break;
      case "ArrowDown":
        this.downHeld = false;
        break;
    }
  };

  private onBlur = (): void => {
    this.heldDirs = [];
    this.downHeld = false;
    this.dasTimer = 0;
    this.arrTimer = 0;
  };
}
