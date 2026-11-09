import type { Game } from './game.js';

const DAS_DELAY = 150; // delayed auto-shift before a held direction repeats
const ARR_INTERVAL = 40; // auto-repeat rate for left/right
const SOFT_DROP_INTERVAL = 40; // soft-drop speed while down is held

const HANDLED = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
  'KeyX', 'KeyZ', 'ControlLeft', 'ControlRight',
  'KeyC', 'KeyR', 'KeyP', 'Escape',
]);

type Direction = -1 | 0 | 1;

/**
 * Keyboard controller. One-shot actions fire on keydown; held movement uses
 * a small DAS/ARR state machine driven by update(dt) each frame so the rules
 * engine stays free of input timing concerns.
 */
export class InputController {
  private readonly held = new Set<string>();
  private dir: Direction = 0;
  private dasElapsed = 0;
  private arrElapsed = 0;
  private softElapsed = 0;
  private repeating = false;

  constructor(private readonly game: Game, target: Window = window) {
    target.addEventListener('keydown', (e) => this.onKeyDown(e));
    target.addEventListener('keyup', (e) => this.onKeyUp(e));
    target.addEventListener('blur', () => this.clear());
  }

  /** Called once per frame with elapsed milliseconds. */
  update(dtMs: number): void {
    const dt = Math.min(Math.max(dtMs, 0), 100);

    if (this.dir !== 0) {
      if (!this.repeating) {
        this.dasElapsed += dt;
        if (this.dasElapsed >= DAS_DELAY) {
          this.repeating = true;
          this.arrElapsed = 0;
          this.shift();
        }
      } else {
        this.arrElapsed += dt;
        while (this.arrElapsed >= ARR_INTERVAL) {
          this.arrElapsed -= ARR_INTERVAL;
          this.shift();
        }
      }
    }

    if (this.held.has('ArrowDown')) {
      this.softElapsed += dt;
      while (this.softElapsed >= SOFT_DROP_INTERVAL) {
        this.softElapsed -= SOFT_DROP_INTERVAL;
        this.game.softDrop();
      }
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (HANDLED.has(e.code)) e.preventDefault();
    if (e.repeat) return; // auto-repeat is handled by update()
    this.held.add(e.code);

    switch (e.code) {
      case 'ArrowLeft':
        this.startDirection(-1);
        break;
      case 'ArrowRight':
        this.startDirection(1);
        break;
      case 'ArrowDown':
        this.softElapsed = 0;
        this.game.softDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotateCW();
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.game.rotateCCW();
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'KeyC':
        this.game.hold();
        break;
      case 'KeyR':
        if (this.game.gameOver) this.game.restart();
        break;
      case 'KeyP':
      case 'Escape':
        this.game.togglePause();
        break;
      default:
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.held.delete(e.code);
    if ((e.code === 'ArrowLeft' && this.dir === -1) || (e.code === 'ArrowRight' && this.dir === 1)) {
      this.dir = this.held.has('ArrowRight') ? 1 : this.held.has('ArrowLeft') ? -1 : 0;
      this.dasElapsed = 0;
      this.arrElapsed = 0;
      this.repeating = false;
    }
  }

  private startDirection(d: -1 | 1): void {
    this.dir = d;
    this.dasElapsed = 0;
    this.arrElapsed = 0;
    this.repeating = false;
    this.shift(); // immediate one-cell move
  }

  private shift(): void {
    if (this.dir === -1) this.game.moveLeft();
    else if (this.dir === 1) this.game.moveRight();
  }

  private clear(): void {
    this.held.clear();
    this.dir = 0;
    this.dasElapsed = 0;
    this.arrElapsed = 0;
    this.softElapsed = 0;
    this.repeating = false;
  }
}
