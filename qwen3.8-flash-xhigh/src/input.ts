import { Game } from './core/game.js';

/** Delayed auto shift: first repeat kicks in after DAS, then repeats per ARR. */
const DAS_MS = 150;
const ARR_MS = 40;

/**
 * Maps the keyboard controls from the README onto game actions and runs the
 * horizontal auto-repeat from the animation loop.
 */
export class InputController {
  private leftDown = false;
  private rightDown = false;
  /** Direction currently auto-repeating: -1 left, +1 right, 0 idle. */
  private activeDir: -1 | 1 | 0 = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(
    private win: Window,
    private game: Game,
  ) {
    win.addEventListener('keydown', (e) => this.onKeyDown(e));
    win.addEventListener('keyup', (e) => this.onKeyUp(e));
    win.addEventListener('blur', () => this.releaseAll());
  }

  private onKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) {
      e.preventDefault(); // stop page scrolling
    }
    if (e.repeat) return; // we implement our own repeat

    if (this.game.state === 'gameover') {
      if (code === 'KeyR') this.game.restart();
      return;
    }

    switch (code) {
      case 'ArrowLeft':
        this.leftDown = true;
        this.startRepeating(-1);
        break;
      case 'ArrowRight':
        this.rightDown = true;
        this.startRepeating(1);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(true);
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotate(1); // clockwise
        break;
      case 'KeyZ':
      case 'ControlLeft':
        this.game.rotate(-1); // counter-clockwise
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'KeyC':
        this.game.holdPiece();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
        this.leftDown = false;
        if (this.activeDir === -1) this.switchRepeating();
        break;
      case 'ArrowRight':
        this.rightDown = false;
        if (this.activeDir === 1) this.switchRepeating();
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
    }
  }

  /** Called once per animation frame with the frame delta. */
  update(dtMs: number): void {
    if (this.activeDir === 0) return;
    this.dasTimer += dtMs;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dtMs;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      if (!this.game.moveHoriz(this.activeDir)) break;
    }
  }

  private startRepeating(dir: -1 | 1): void {
    this.game.moveHoriz(dir); // immediate first step
    this.activeDir = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;
  }

  /** On keyup, keep repeating the still-held direction or stop. */
  private switchRepeating(): void {
    if (this.leftDown) this.startRepeating(-1);
    else if (this.rightDown) this.startRepeating(1);
    else this.activeDir = 0;
  }

  private releaseAll(): void {
    this.leftDown = false;
    this.rightDown = false;
    this.activeDir = 0;
    this.game.setSoftDrop(false);
  }
}
