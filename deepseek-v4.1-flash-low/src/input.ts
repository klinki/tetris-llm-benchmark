import type { Game } from './game.js';

const DAS_DELAY_MS = 150;
const ARR_INTERVAL_MS = 35;

/**
 * Keyboard controls with delayed auto-shift (DAS) for horizontal movement.
 */
export class InputController {
  private leftHeld = false;
  private rightHeld = false;
  private softDropHeld = false;
  private direction: -1 | 0 | 1 = 0;
  private dasElapsed = 0;

  constructor(private readonly game: Game) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  update(dt: number): void {
    if (this.direction === 0) {
      this.dasElapsed = 0;
      return;
    }

    this.dasElapsed += dt;

    while (this.dasElapsed >= DAS_DELAY_MS) {
      this.game.move(this.direction);
      this.dasElapsed -= ARR_INTERVAL_MS;
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.code.startsWith('Arrow') ||
      event.code === 'Space'
    ) {
      event.preventDefault();
    }

    if (event.repeat) {
      return;
    }

    switch (event.code) {
      case 'ArrowLeft':
        this.leftHeld = true;
        this.setDirection(-1);
        break;
      case 'ArrowRight':
        this.rightHeld = true;
        this.setDirection(1);
        break;
      case 'ArrowDown':
        this.softDropHeld = true;
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
        this.game.hold();
        break;
      case 'KeyR':
        this.restart();
        break;
      default:
        break;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'ArrowLeft':
        this.leftHeld = false;
        if (this.direction === -1) {
          this.setDirection(this.rightHeld ? 1 : 0);
        }
        break;
      case 'ArrowRight':
        this.rightHeld = false;
        if (this.direction === 1) {
          this.setDirection(this.leftHeld ? -1 : 0);
        }
        break;
      case 'ArrowDown':
        this.softDropHeld = false;
        this.game.softDropping = false;
        break;
      default:
        break;
    }
  };

  private readonly onBlur = (): void => {
    this.leftHeld = false;
    this.rightHeld = false;
    this.softDropHeld = false;
    this.direction = 0;
    this.dasElapsed = 0;
    this.game.softDropping = false;
  };

  private setDirection(direction: -1 | 0 | 1): void {
    const changed = direction !== this.direction;
    this.direction = direction;

    if (direction === 0) {
      this.dasElapsed = 0;
      return;
    }

    if (changed) {
      this.dasElapsed = 0;
      this.game.move(direction);
    }
  }

  private restart(): void {
    this.game.restart();
    this.game.softDropping = this.softDropHeld;
    this.direction = 0;
    this.dasElapsed = 0;
  }
}
