// Keyboard controls:
//   left / right      move (with delayed auto shift)
//   up / x            rotate clockwise
//   z / left ctrl     rotate counter-clockwise
//   down              soft drop
//   space             hard drop
//   c                 hold
//   r                 restart after game over

import type { Game } from "./game.js";

const DAS_MS = 150; // delay before horizontal auto repeat starts
const ARR_MS = 40; // horizontal auto repeat interval

export class Input {
  private leftDown = false;
  private rightDown = false;
  private dasDir: -1 | 0 | 1 = 0;
  private nextRepeatAt = 0;

  constructor(private readonly game: Game) {}

  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
  }

  // Called once per frame to run horizontal auto repeat.
  update(now: number): void {
    if (this.dasDir === 0) return;
    if (this.nextRepeatAt < now - 1000) {
      // long pause (e.g. background tab): resync instead of bursting moves
      this.nextRepeatAt = now + ARR_MS;
      return;
    }
    while (now >= this.nextRepeatAt) {
      if (this.dasDir === -1) this.game.moveLeft();
      else this.game.moveRight();
      this.nextRepeatAt += ARR_MS;
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    switch (event.code) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
      case "Space":
        event.preventDefault(); // keep the page from scrolling
    }
    if (event.repeat) return; // auto repeat is handled by update()

    const now = performance.now();
    switch (event.code) {
      case "ArrowLeft":
        this.leftDown = true;
        this.game.moveLeft();
        this.startDas(-1, now);
        break;
      case "ArrowRight":
        this.rightDown = true;
        this.game.moveRight();
        this.startDas(1, now);
        break;
      case "ArrowUp":
      case "KeyX":
        this.game.rotateClockwise();
        break;
      case "KeyZ":
        // Ctrl is a rotate key itself - don't rotate twice for Ctrl+Z.
        if (!event.ctrlKey) this.game.rotateCounterClockwise();
        break;
      case "ControlLeft":
        this.game.rotateCounterClockwise();
        break;
      case "ArrowDown":
        this.game.softDropping = true;
        break;
      case "Space":
        this.game.hardDrop();
        break;
      case "KeyC":
        this.game.holdPiece();
        break;
      case "KeyR":
        if (this.game.status === "gameover") this.game.restart();
        break;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const now = performance.now();
    switch (event.code) {
      case "ArrowLeft":
        this.leftDown = false;
        if (this.dasDir === -1) {
          if (this.rightDown) this.startDas(1, now);
          else this.dasDir = 0;
        }
        break;
      case "ArrowRight":
        this.rightDown = false;
        if (this.dasDir === 1) {
          if (this.leftDown) this.startDas(-1, now);
          else this.dasDir = 0;
        }
        break;
      case "ArrowDown":
        this.game.softDropping = false;
        break;
    }
  };

  private readonly handleBlur = (): void => {
    this.leftDown = false;
    this.rightDown = false;
    this.dasDir = 0;
    this.game.softDropping = false;
  };

  private startDas(dir: -1 | 1, now: number): void {
    this.dasDir = dir;
    this.nextRepeatAt = now + DAS_MS;
  }
}
