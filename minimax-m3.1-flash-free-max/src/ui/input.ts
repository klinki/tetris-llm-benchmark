import { KEY_REPEAT_DELAY_MS, KEY_REPEAT_RATE_MS } from '../core/constants.js';
import type { Game } from '../core/game.js';

/**
 * Translates the keyboard into game actions. Left and right repeat after a
 * short delay, the other keys act once per press.
 */
export class InputController {
  private repeatTimeout: number | null = null;
  private repeatInterval: number | null = null;

  constructor(private readonly game: Game) {}

  attach(): void {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        this.game.moveLeft();
        this.startRepeat(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.game.moveRight();
        this.startRepeat(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.game.setSoftDrop(true);
        break;
      case 'ArrowUp':
      case 'KeyX':
        event.preventDefault();
        this.game.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        event.preventDefault();
        this.game.rotate(-1);
        break;
      case 'Space':
        event.preventDefault();
        this.game.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        event.preventDefault();
        this.game.holdPiece();
        break;
      case 'KeyR':
        event.preventDefault();
        this.game.reset();
        break;
      case 'KeyP':
      case 'Escape':
        event.preventDefault();
        this.game.togglePause();
        break;
      default:
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.stopRepeat();
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  }

  private startRepeat(direction: -1 | 1): void {
    this.stopRepeat();
    this.repeatTimeout = window.setTimeout(() => {
      this.repeatInterval = window.setInterval(() => {
        if (direction < 0) {
          this.game.moveLeft();
        } else {
          this.game.moveRight();
        }
      }, KEY_REPEAT_RATE_MS);
    }, KEY_REPEAT_DELAY_MS);
  }

  private stopRepeat(): void {
    if (this.repeatTimeout !== null) {
      window.clearTimeout(this.repeatTimeout);
      this.repeatTimeout = null;
    }
    if (this.repeatInterval !== null) {
      window.clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
  }
}
