// Keyboard controls with DAS/ARR auto-shift for horizontal movement.

import { ARR_MS, DAS_MS } from './constants.js';
import type { Game } from './game.js';

type Dir = -1 | 0 | 1;

export class Input {
  softHeld = false;

  private heldLeft = false;
  private heldRight = false;
  private dasDir: Dir = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private game: Game) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  update(dt: number): void {
    if (this.dasDir === 0) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      if (!this.game.move(this.dasDir)) {
        this.arrTimer = 0;
        break;
      }
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const g = this.game;
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        this.press(-1, e.repeat);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.press(1, e.repeat);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.softHeld = true;
        break;
      case 'ArrowUp':
      case 'KeyX':
        e.preventDefault();
        if (!e.repeat) g.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
        e.preventDefault();
        if (!e.repeat) g.rotate(-1);
        break;
      case 'Space':
        e.preventDefault();
        if (!e.repeat) g.hardDrop();
        break;
      case 'KeyC':
        if (!e.repeat) g.holdPiece();
        break;
      case 'KeyR':
        if (g.state === 'over') {
          e.preventDefault();
          g.reset();
        }
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
        this.heldLeft = false;
        this.release(-1);
        break;
      case 'ArrowRight':
        this.heldRight = false;
        this.release(1);
        break;
      case 'ArrowDown':
        this.softHeld = false;
        break;
    }
  };

  private onBlur = (): void => {
    this.heldLeft = false;
    this.heldRight = false;
    this.softHeld = false;
    this.dasDir = 0;
  };

  private press(dir: -1 | 1, repeat: boolean): void {
    if (repeat) return;
    if (dir === -1) this.heldLeft = true;
    else this.heldRight = true;
    this.dasDir = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.game.move(dir);
  }

  private release(dir: -1 | 1): void {
    if (this.dasDir !== dir) return;
    const other: Dir = dir === -1 ? (this.heldRight ? 1 : 0) : this.heldLeft ? -1 : 0;
    this.dasDir = other;
    this.dasTimer = 0;
    this.arrTimer = 0;
    if (other !== 0) this.game.move(other);
  }
}
