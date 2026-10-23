import { Game } from './game.js';

/** Guideline auto-repeat timing for left/right movement. */
const DAS_MS = 167;
const ARR_MS = 33;

type Direction = 'left' | 'right';

/** Translates keyboard events into game actions, with DAS/ARR auto-repeat. */
export class InputHandler {
  private readonly game: Game;
  private held: Record<Direction, boolean> = { left: false, right: false };
  private lastDir: Direction | null = null;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(game: Game) {
    this.game = game;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  /** Advances held-key auto-repeat; call once per frame. */
  update(dtMs: number): void {
    if (this.lastDir === null) return;
    this.dasTimer += dtMs;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dtMs;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      this.step(this.lastDir);
    }
  }

  private step(direction: Direction): void {
    if (direction === 'left') this.game.moveLeft();
    else this.game.moveRight();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    switch (event.code) {
      case 'ArrowLeft':
        this.press('left');
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.press('right');
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(true);
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotateClockwise();
        event.preventDefault();
        break;
      case 'KeyZ':
      case 'ControlLeft':
        this.game.rotateCounterClockwise();
        break;
      case 'Space':
        this.game.hardDrop();
        event.preventDefault();
        break;
      case 'KeyC':
        this.game.hold();
        break;
      case 'KeyR':
        if (this.game.state === 'gameover') this.game.restart();
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'ArrowLeft':
        this.release('left');
        break;
      case 'ArrowRight':
        this.release('right');
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
    }
  };

  private onBlur = (): void => {
    this.held.left = false;
    this.held.right = false;
    this.lastDir = null;
    this.game.setSoftDrop(false);
  };

  private press(direction: Direction): void {
    this.held[direction] = true;
    this.lastDir = direction;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.step(direction);
  }

  private release(direction: Direction): void {
    this.held[direction] = false;
    if (this.lastDir !== direction) return;
    this.lastDir = this.held.left ? 'left' : this.held.right ? 'right' : null;
    this.dasTimer = 0;
    this.arrTimer = 0;
  }
}
