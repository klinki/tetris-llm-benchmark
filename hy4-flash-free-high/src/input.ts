import type { Action } from './types.js';

/** Keyboard codes mapped to semantic actions. */
const KEY_ACTIONS: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotateCW',
  KeyX: 'rotateCW',
  KeyZ: 'rotateCCW',
  ControlLeft: 'rotateCCW',
  ControlRight: 'rotateCCW',
  ArrowDown: 'softDrop',
  Space: 'hardDrop',
  KeyC: 'hold',
  KeyR: 'restart',
};

const DAS_DELAY_MS = 150;
const ARR_MS = 40;
const SOFT_DROP_MS = 45;

/**
 * Translates keyboard events into game actions. Implements delayed auto-shift
 * (DAS) for horizontal movement and a fixed repeat rate for soft drop, so the
 * game feels responsive regardless of the operating system's key repeat.
 */
export class Input {
  private leftHeld = false;
  private rightHeld = false;
  private softHeld = false;
  private activeDir: -1 | 1 | 0 = 0;
  private dasTimer = 0;
  private dasRepeating = false;
  private softTimer = 0;

  constructor(private readonly emit: (action: Action) => void) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.clear());
  }

  private onKeyDown(e: KeyboardEvent): void {
    const action = KEY_ACTIONS[e.code];
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return; // We drive repeats ourselves via update().

    switch (action) {
      case 'left':
        if (!this.leftHeld) {
          this.leftHeld = true;
          this.setDirection(-1);
        }
        break;
      case 'right':
        if (!this.rightHeld) {
          this.rightHeld = true;
          this.setDirection(1);
        }
        break;
      case 'softDrop':
        if (!this.softHeld) {
          this.softHeld = true;
          this.softTimer = 0;
          this.emit('softDrop');
        }
        break;
      default:
        this.emit(action);
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const action = KEY_ACTIONS[e.code];
    if (!action) return;
    e.preventDefault();

    switch (action) {
      case 'left':
        this.leftHeld = false;
        if (this.activeDir === -1) this.setDirection(this.rightHeld ? 1 : 0);
        break;
      case 'right':
        this.rightHeld = false;
        if (this.activeDir === 1) this.setDirection(this.leftHeld ? -1 : 0);
        break;
      case 'softDrop':
        this.softHeld = false;
        break;
    }
  }

  private setDirection(dir: -1 | 1 | 0): void {
    this.activeDir = dir;
    this.dasTimer = 0;
    this.dasRepeating = false;
    if (dir !== 0) this.emit(dir === -1 ? 'left' : 'right');
  }

  /** Advance input repeat timers. Called once per frame with elapsed ms. */
  update(dtMs: number): void {
    if (this.activeDir !== 0) {
      this.dasTimer += dtMs;
      if (!this.dasRepeating) {
        if (this.dasTimer >= DAS_DELAY_MS) {
          this.dasRepeating = true;
          this.dasTimer -= DAS_DELAY_MS;
          this.emit(this.activeDir === -1 ? 'left' : 'right');
        }
      } else {
        while (this.dasTimer >= ARR_MS) {
          this.dasTimer -= ARR_MS;
          this.emit(this.activeDir === -1 ? 'left' : 'right');
        }
      }
    }

    if (this.softHeld) {
      this.softTimer += dtMs;
      while (this.softTimer >= SOFT_DROP_MS) {
        this.softTimer -= SOFT_DROP_MS;
        this.emit('softDrop');
      }
    }
  }

  private clear(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.softHeld = false;
    this.activeDir = 0;
  }
}
