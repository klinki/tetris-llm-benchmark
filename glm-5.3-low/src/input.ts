import { ARR_MS, DAS_MS } from './constants.js';
import type { Game } from './game.js';

/**
 * Keyboard controls with DAS/ARR auto-repeat for horizontal movement:
 * left/right move, up/x rotate CW, z/ctrl rotate CCW, down soft drop,
 * space hard drop, c hold, r restart.
 */
export class InputController {
  private held = { left: false, right: false };
  private activeDir: 'left' | 'right' | null = null;
  private dasMs = 0;
  private arrMs = 0;

  constructor(private readonly game: Game) {
    window.addEventListener('keydown', e => this.onKeyDown(e));
    window.addEventListener('keyup', e => this.onKeyUp(e));
    window.addEventListener('blur', () => this.releaseAll());
  }

  /** Drives auto-repeat; call once per animation frame. */
  update(dtMs: number): void {
    if (!this.activeDir) return;
    this.dasMs += dtMs;
    if (this.dasMs < DAS_MS) return;
    this.arrMs += dtMs;
    while (this.arrMs >= ARR_MS) {
      this.arrMs -= ARR_MS;
      this.game.moveHorizontal(this.activeDir === 'left' ? -1 : 1);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.isHandled(e.code)) e.preventDefault();
    if (e.repeat) return; // we run our own auto-repeat
    switch (e.code) {
      case 'ArrowLeft':
        this.press('left');
        break;
      case 'ArrowRight':
        this.press('right');
        break;
      case 'ArrowDown':
        this.game.softDropping = true;
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.game.rotate(-1);
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.game.holdPiece();
        break;
      case 'KeyR':
        this.game.reset();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
        this.release('left');
        break;
      case 'ArrowRight':
        this.release('right');
        break;
      case 'ArrowDown':
        this.game.softDropping = false;
        break;
    }
  }

  private isHandled(code: string): boolean {
    return [
      'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
      'Space', 'KeyZ', 'KeyX', 'KeyC', 'KeyR',
    ].includes(code);
  }

  private press(dir: 'left' | 'right'): void {
    this.held[dir] = true;
    this.activeDir = dir;
    this.dasMs = 0;
    this.arrMs = 0;
    this.game.moveHorizontal(dir === 'left' ? -1 : 1);
  }

  private release(dir: 'left' | 'right'): void {
    this.held[dir] = false;
    if (this.activeDir === dir) {
      const other: 'left' | 'right' = dir === 'left' ? 'right' : 'left';
      this.activeDir = this.held[other] ? other : null;
      this.dasMs = 0;
      this.arrMs = 0;
    }
  }

  private releaseAll(): void {
    this.held.left = false;
    this.held.right = false;
    this.activeDir = null;
    this.game.softDropping = false;
  }
}
