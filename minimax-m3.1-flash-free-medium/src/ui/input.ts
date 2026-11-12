/** Keyboard handling: maps key presses onto game actions. */

import type { Game } from '../core/game.js';

export class InputController {
  constructor(private readonly game: Game) {}

  attach(target: Window = window): void {
    target.addEventListener('keydown', (event) => this.onKeyDown(event));
    target.addEventListener('keyup', (event) => this.onKeyUp(event));
    target.addEventListener('blur', () => this.releaseAll());
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.repeat) {
      // Auto repeat is handled by the game itself (delayed auto shift).
      this.preventDefault(event);
      return;
    }
    const key = event.key.toLowerCase();
    this.preventDefault(event);

    if (this.game.status === 'ready') {
      this.game.start();
      if (key !== 'r' && key !== 'p') return;
    }

    switch (key) {
      case 'arrowleft':
        this.game.setDirection(-1, true);
        break;
      case 'arrowright':
        this.game.setDirection(1, true);
        break;
      case 'arrowdown':
        this.game.setSoftDrop(true);
        this.game.softDrop();
        break;
      case 'arrowup':
      case 'x':
        this.game.rotateClockwise();
        break;
      case 'z':
        // Ctrl + Z arrives as a "z" key press as well.
        this.game.rotateCounterClockwise();
        break;
      case ' ':
        this.game.hardDrop();
        break;
      case 'c':
      case 'shift':
        this.game.holdPiece();
        break;
      case 'r':
        this.game.restart();
        break;
      case 'p':
        this.game.togglePause();
        break;
      default:
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.preventDefault(event);
    switch (key) {
      case 'arrowleft':
        this.game.setDirection(-1, false);
        break;
      case 'arrowright':
        this.game.setDirection(1, false);
        break;
      case 'arrowdown':
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  }

  private releaseAll(): void {
    this.game.setDirection(-1, false);
    this.game.setDirection(1, false);
    this.game.setSoftDrop(false);
  }

  private preventDefault(event: KeyboardEvent): void {
    if (
      event.key.startsWith('Arrow') ||
      event.key === ' ' ||
      event.key === 'Control' ||
      event.key === 'Shift'
    ) {
      event.preventDefault();
    }
  }
}
