import type { Game } from "../core/game.js";

/** Delayed auto shift: how long a held direction waits before auto-repeating. */
export const DAS_MS = 167;

/** Auto repeat rate: time between repeated shifts once DAS has charged. */
export const ARR_MS = 33;

/**
 * Translates keyboard input into game commands. Horizontal movement uses
 * DAS/ARR so held keys glide the piece across the field.
 */
export class InputController {
  /** True while the soft drop key is held. */
  softDrop = false;

  private readonly game: Game;
  private readonly held = { left: false, right: false, down: false };
  private dasDir: -1 | 0 | 1 = 0;
  private dasTime = 0;
  private arrTime = 0;

  constructor(game: Game) {
    this.game = game;
  }

  attach(target: Window = window): void {
    target.addEventListener("keydown", (event) => this.onKeyDown(event));
    target.addEventListener("keyup", (event) => this.onKeyUp(event));
    target.addEventListener("blur", () => this.releaseAll());
  }

  /** Called every frame; drives the DAS/ARR auto-shift. */
  update(dt: number): void {
    if (this.dasDir === 0) return;
    this.dasTime += dt;
    if (this.dasTime < DAS_MS) return;
    this.arrTime += dt;
    while (this.arrTime >= ARR_MS) {
      this.arrTime -= ARR_MS;
      this.game.move(this.dasDir);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Leave browser shortcuts alone (plain LeftCtrl still rotates, see below).
    if (event.metaKey) return;
    if (event.ctrlKey && event.code !== "ControlLeft" && event.code !== "KeyZ") return;

    switch (event.code) {
      case "ArrowLeft":
        if (!event.repeat) this.pressDir(-1);
        event.preventDefault();
        break;
      case "ArrowRight":
        if (!event.repeat) this.pressDir(1);
        event.preventDefault();
        break;
      case "ArrowDown":
        if (!event.repeat) {
          this.held.down = true;
          this.softDrop = true;
          this.game.softDropStep();
        }
        event.preventDefault();
        break;
      case "ArrowUp":
      case "KeyX":
        if (!event.repeat) this.game.rotate(1);
        event.preventDefault();
        break;
      case "ControlLeft":
      case "KeyZ":
        if (!event.repeat) this.game.rotate(-1);
        break;
      case "Space":
        if (!event.repeat) this.game.hardDrop();
        event.preventDefault();
        break;
      case "KeyC":
        if (!event.repeat) this.game.holdPiece();
        break;
      case "KeyR":
        if (!event.repeat) {
          this.game.restart();
          this.dasDir = this.held.left ? -1 : this.held.right ? 1 : 0;
          this.dasTime = 0;
          this.arrTime = 0;
        }
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowLeft":
        this.held.left = false;
        if (this.dasDir === -1) this.switchDir();
        break;
      case "ArrowRight":
        this.held.right = false;
        if (this.dasDir === 1) this.switchDir();
        break;
      case "ArrowDown":
        this.held.down = false;
        this.softDrop = false;
        break;
    }
  }

  private pressDir(dir: -1 | 1): void {
    if (dir === -1) this.held.left = true;
    else this.held.right = true;
    this.dasDir = dir;
    this.dasTime = 0;
    this.arrTime = 0;
    this.game.move(dir);
  }

  /** The repeating key was released; fall back to the other one if still held. */
  private switchDir(): void {
    this.dasDir = this.held.left ? -1 : this.held.right ? 1 : 0;
    this.dasTime = 0;
    this.arrTime = 0;
  }

  private releaseAll(): void {
    this.held.left = false;
    this.held.right = false;
    this.held.down = false;
    this.softDrop = false;
    this.dasDir = 0;
  }
}
