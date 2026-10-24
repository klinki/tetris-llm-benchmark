/**
 * Keyboard input: maps physical keys to game actions and implements DAS
 * (Delayed Auto Shift) so holding left/right keeps stepping the piece.
 *
 * Immediate actions fire on keydown; held arrow keys repeat on a DAS timing
 * curve advanced from the game loop.
 */

import type { Game } from "./game.js";

/** Initial delay before a held direction starts repeating. */
export const DAS_DELAY_MS = 167;
/** Repeat interval once DAS kicks in. */
export const ARR_MS = 33;

export class KeyboardInput {
  private game: Game;
  private direction: -1 | 0 | 1 = 0;
  private dasAcc = 0;
  private arrAcc = 0;
  private rightHeld = false;
  private leftHeld = false;

  constructor(game: Game) {
    this.game = game;
  }

  /** Wire DOM key events; matches the README control scheme. */
  attach(target: HTMLElement | Window): void {
    target.addEventListener("keydown", (e) => this.onKeyDown(e as KeyboardEvent));
    target.addEventListener("keyup", (e) => this.onKeyUp(e as KeyboardEvent));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return; // repeats come from our own DAS logic instead
    switch (e.code) {
      case "ArrowLeft":
        this.leftHeld = true;
        this.startDirection(-1);
        this.game.move(-1);
        e.preventDefault();
        break;
      case "ArrowRight":
        this.rightHeld = true;
        this.startDirection(1);
        this.game.move(1);
        e.preventDefault();
        break;
      case "ArrowUp":
      case "KeyX":
        this.game.rotate("cw");
        e.preventDefault();
        break;
      case "KeyZ":
      case "ControlLeft":
        this.game.rotate("ccw");
        e.preventDefault();
        break;
      case "ArrowDown":
        this.game.softDrop = true;
        e.preventDefault();
        break;
      case "Space":
        this.game.hardDrop();
        e.preventDefault();
        break;
      case "KeyC":
        this.game.holdPiece();
        e.preventDefault();
        break;
      case "KeyR":
        if (this.game.state === "over") this.game.restart();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "ArrowLeft":
        this.leftHeld = false;
        this.onDirectionRelease(-1);
        break;
      case "ArrowRight":
        this.rightHeld = false;
        this.onDirectionRelease(1);
        break;
      case "ArrowDown":
        this.game.softDrop = false;
        break;
    }
  }

  private startDirection(dir: -1 | 1): void {
    this.direction = dir;
    this.dasAcc = 0;
    this.arrAcc = 0;
  }

  /** Releasing the active direction hands over to any still-held opposite. */
  private onDirectionRelease(dir: -1 | 1): void {
    if (this.direction !== dir) return;
    const other = dir === -1 && this.rightHeld ? 1 : dir === 1 && this.leftHeld ? -1 : 0;
    if (other === 0) this.direction = 0;
    else this.startDirection(other);
  }

  /** Fire DAS repeats; call once per frame before/after game.update. */
  update(dt: number): void {
    if (this.direction === 0) return;
    this.dasAcc += dt;
    if (this.dasAcc < DAS_DELAY_MS) return;
    this.arrAcc += dt;
    while (this.arrAcc >= ARR_MS) {
      this.arrAcc -= ARR_MS;
      this.game.move(this.direction);
    }
  }
}
