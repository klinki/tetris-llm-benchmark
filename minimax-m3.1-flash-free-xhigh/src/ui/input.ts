import { ARR_MS, DAS_MS } from '../core/constants.js';
import type { Game } from '../core/game.js';

/** Handles the keyboard of the game. */
export class Input {
  private readonly game: Game;
  private readonly onRestart: () => void;
  private readonly held = { left: false, right: false };
  private direction: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(game: Game, onRestart: () => void) {
    this.game = game;
    this.onRestart = onRestart;
  }

  /** Listens to the keyboard. */
  attach(): void {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
    window.addEventListener('blur', () => this.releaseAll());
  }

  /** Advances the delayed auto shift, called once per frame. */
  update(dt: number): void {
    if (this.direction === 0) {
      return;
    }
    this.dasTimer -= dt;
    if (this.dasTimer > 0) {
      return;
    }
    this.arrTimer -= dt;
    while (this.arrTimer <= 0) {
      this.game.move(this.direction);
      this.arrTimer += ARR_MS;
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.press(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.press(1);
        break;
      case 'ArrowUp':
      case 'x':
      case 'X':
        event.preventDefault();
        this.game.rotate(1);
        break;
      case 'z':
      case 'Z':
        event.preventDefault();
        this.game.rotate(-1);
        break;
      case 'Control':
        // The left control rotates as well, but it keeps the shortcuts of the
        // browser alive.
        this.game.rotate(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.game.setSoftDrop(true);
        break;
      case ' ':
        event.preventDefault();
        this.game.hardDrop();
        break;
      case 'c':
      case 'C':
        this.game.hold();
        break;
      case 'p':
      case 'P':
        this.game.togglePause();
        break;
      case 'r':
      case 'R':
        this.onRestart();
        break;
      default:
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.release(-1);
        break;
      case 'ArrowRight':
        this.release(1);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  }

  private press(direction: -1 | 1): void {
    if (direction === -1) {
      this.held.left = true;
    } else {
      this.held.right = true;
    }
    this.direction = direction;
    this.dasTimer = DAS_MS;
    this.arrTimer = 0;
    this.game.move(direction);
  }

  private release(direction: -1 | 1): void {
    if (direction === -1) {
      this.held.left = false;
    } else {
      this.held.right = false;
    }
    if (this.direction === direction) {
      this.direction = this.held.left ? -1 : this.held.right ? 1 : 0;
      this.dasTimer = DAS_MS;
    }
  }

  private releaseAll(): void {
    this.held.left = false;
    this.held.right = false;
    this.direction = 0;
    this.game.setSoftDrop(false);
  }
}
