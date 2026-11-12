import { ARR, DAS } from '../core/constants.js';
import type { Game } from '../core/game.js';

/**
 * Keyboard handling with delayed auto shift (DAS) and auto repeat rate (ARR).
 *
 * Left/right  - move to the sides
 * Up / X      - rotate clockwise
 * Z / Ctrl    - rotate anti clockwise
 * Down        - soft drop
 * Space       - hard drop
 * C           - hold piece
 * R           - restart after game over
 */
export class InputController {
  private direction: -1 | 0 | 1 = 0;
  private charge = 0;
  private repeat = 0;
  private readonly held = new Set<string>();

  constructor(
    private readonly game: Game,
    private readonly target: EventTarget = window,
  ) {}

  /** Starts listening for key events. */
  attach(): void {
    this.target.addEventListener('keydown', this.onKeyDown);
    this.target.addEventListener('keyup', this.onKeyUp);
    this.target.addEventListener('blur', this.onBlur);
  }

  /** Stops listening for key events. */
  detach(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
  }

  /** Advances the auto repeat timers. */
  update(deltaMs: number): void {
    if (this.direction === 0) {
      this.charge = 0;
      this.repeat = 0;
      return;
    }
    let remaining = deltaMs;
    if (this.charge < DAS) {
      const needed = DAS - this.charge;
      if (remaining < needed) {
        this.charge += remaining;
        return;
      }
      remaining -= needed;
      this.charge = DAS;
    }
    this.repeat += remaining;
    while (this.repeat >= ARR) {
      this.repeat -= ARR;
      if (this.direction < 0) this.game.moveLeft();
      else this.game.moveRight();
    }
  }

  private readonly onKeyDown = (event: Event): void => {
    const key = event as KeyboardEvent;
    if (key.metaKey || key.altKey) return;
    const code = key.code;
    const handled = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Space',
      'KeyX',
      'KeyZ',
      'KeyC',
      'KeyR',
      'ControlLeft',
      'ControlRight',
    ].includes(code);
    if (handled) key.preventDefault();
    if (key.repeat) return;
    this.held.add(code);

    switch (code) {
      case 'ArrowLeft':
        this.setDirection(-1);
        break;
      case 'ArrowRight':
        this.setDirection(1);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(true);
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
        this.game.holdPiece();
        break;
      case 'KeyR':
        if (this.game.status === 'gameover') this.game.reset();
        break;
      default:
        break;
    }
  };

  private readonly onKeyUp = (event: Event): void => {
    const code = (event as KeyboardEvent).code;
    this.held.delete(code);
    switch (code) {
      case 'ArrowLeft':
        if (this.direction === -1) this.setDirection(this.otherDirection(-1));
        break;
      case 'ArrowRight':
        if (this.direction === 1) this.setDirection(this.otherDirection(1));
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  };

  private readonly onBlur = (): void => {
    this.held.clear();
    this.direction = 0;
    this.charge = 0;
    this.repeat = 0;
    this.game.setSoftDrop(false);
  };

  /** Returns the direction of the opposite key when it is still held. */
  private otherDirection(current: -1 | 1): -1 | 0 | 1 {
    const other = current === -1 ? 'ArrowRight' : 'ArrowLeft';
    return this.held.has(other) ? (current === -1 ? 1 : -1) : 0;
  }

  private setDirection(direction: -1 | 0 | 1): void {
    this.direction = direction;
    this.charge = 0;
    this.repeat = 0;
    if (direction < 0) this.game.moveLeft();
    else if (direction > 0) this.game.moveRight();
  }
}
