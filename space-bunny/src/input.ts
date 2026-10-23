/**
 * Keyboard input. Translates key events into game actions and runs the
 * delayed auto shift (DAS) / auto repeat rate (ARR) for left and right.
 */

import { ARR_MS, DAS_MS } from './constants.js';
import type { Game } from './game.js';

type Direction = -1 | 0 | 1;

/** Keys handled by the game, with their `KeyboardEvent.key` value. */
const HANDLED = new Set([
  'arrowleft',
  'arrowright',
  'arrowup',
  'arrowdown',
  ' ',
  'a',
  'd',
  's',
  'w',
  'x',
  'z',
  'control',
  'shift',
  'c',
  'r',
  'p',
]);

export class InputController {
  private readonly held = new Set<string>();
  private direction: Direction = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private readonly game: Game) {}

  attach(target: EventTarget = window): void {
    target.addEventListener('keydown', (event) => this.onKeyDown(event as KeyboardEvent));
    target.addEventListener('keyup', (event) => this.onKeyUp(event as KeyboardEvent));
    // Losing focus mid hold would leave the piece sliding forever.
    window.addEventListener('blur', () => this.releaseAll());
  }

  /** Feeds the auto repeat timers, called once per frame. */
  update(dt: number): void {
    if (this.direction === 0 || this.game.state !== 'playing') return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      this.game.move(this.direction);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (HANDLED.has(key)) event.preventDefault();
    if (event.repeat || this.held.has(key)) return;
    this.held.add(key);

    const game = this.game;
    switch (key) {
      case 'arrowleft':
      case 'a':
        this.setDirection(-1);
        break;
      case 'arrowright':
      case 'd':
        this.setDirection(1);
        break;
      case 'arrowdown':
      case 's':
        if (game.state === 'playing') game.softDropStep();
        break;
      case 'arrowup':
      case 'w':
      case 'x':
        game.rotate(true);
        break;
      case 'z':
      case 'control':
        game.rotate(false);
        break;
      case ' ':
        game.hardDrop();
        break;
      case 'c':
      case 'shift':
        game.holdPiece();
        break;
      case 'p':
        game.togglePause();
        break;
      case 'r':
        game.reset();
        break;
      default:
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.held.delete(key);
    switch (key) {
      case 'arrowleft':
      case 'a':
        if (this.direction === -1) this.setDirection(this.isHeld('arrowright', 'd') ? 1 : 0);
        break;
      case 'arrowright':
      case 'd':
        if (this.direction === 1) this.setDirection(this.isHeld('arrowleft', 'a') ? -1 : 0);
        break;
      case 'arrowdown':
      case 's':
        this.game.setSoftDropping(false);
        break;
      default:
        break;
    }
  }

  private setDirection(direction: Direction): void {
    if (direction === this.direction) return;
    this.direction = direction;
    this.dasTimer = 0;
    this.arrTimer = 0;
    if (direction !== 0) this.game.move(direction);
  }

  private isHeld(...keys: string[]): boolean {
    return keys.some((key) => this.held.has(key));
  }

  private releaseAll(): void {
    this.held.clear();
    this.direction = 0;
    this.game.setSoftDropping(false);
  }
}