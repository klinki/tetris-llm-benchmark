import { ARR, DAS } from './constants.js';
import type { Game } from './game.js';

/** Keys the game handles; scrolling and other default behavior is suppressed for them. */
const HANDLED_KEYS = new Set([
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
]);

/**
 * Keyboard input with DAS/ARR auto repeat for horizontal movement.
 * left/right - move, up/x - rotate cw, z/ctrl - rotate ccw, down - soft drop,
 * space - hard drop, c - hold, r - restart.
 */
export class InputHandler {
  private heldLeft = false;
  private heldRight = false;
  private dir = 0; // -1 left, 1 right, 0 none
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private game: Game) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Called every frame; drives the DAS/ARR auto repeat. */
  update(dt: number): void {
    if (this.dir === 0) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR) {
      this.arrTimer -= ARR;
      if (!this.game.moveHorizontal(this.dir)) {
        this.arrTimer = 0; // hit a wall, retry at the next ARR tick
        break;
      }
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (HANDLED_KEYS.has(e.code)) e.preventDefault();
    switch (e.code) {
      case 'ArrowLeft':
        if (!this.heldLeft) {
          this.heldLeft = true;
          this.dir = -1;
          this.dasTimer = 0;
          this.arrTimer = 0;
          this.game.moveHorizontal(-1);
        }
        break;
      case 'ArrowRight':
        if (!this.heldRight) {
          this.heldRight = true;
          this.dir = 1;
          this.dasTimer = 0;
          this.arrTimer = 0;
          this.game.moveHorizontal(1);
        }
        break;
      case 'ArrowUp':
      case 'KeyX':
        if (!e.repeat) this.game.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        if (!e.repeat) this.game.rotate(-1);
        break;
      case 'ArrowDown':
        if (!e.repeat) this.game.setSoftDrop(true);
        break;
      case 'Space':
        if (!e.repeat) this.game.hardDrop();
        break;
      case 'KeyC':
        if (!e.repeat) this.game.holdPiece();
        break;
      case 'KeyR':
        if (!e.repeat) this.game.restart();
        break;
      default:
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
        this.heldLeft = false;
        this.releaseDirection(-1);
        break;
      case 'ArrowRight':
        this.heldRight = false;
        this.releaseDirection(1);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  };

  /** When the active direction is released, the other held key takes over instantly. */
  private releaseDirection(released: number): void {
    if (this.dir !== released) return;
    const other = released === -1 ? this.heldRight : this.heldLeft;
    this.dir = other ? -released : 0;
    if (this.dir !== 0) {
      this.dasTimer = DAS;
      this.arrTimer = 0;
    }
  }
}
