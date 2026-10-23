import type { Game } from './game.js';

/** Delayed auto shift: how long a direction must be held before it starts repeating (ms). */
const DAS = 160;
/** Auto repeat rate: time between repeated moves once DAS has charged (ms). */
const ARR = 40;

type Direction = -1 | 1;

/** Translates keyboard events into game commands and implements DAS/ARR for sideways movement. */
export class Input {
  /** Held horizontal directions, most recently pressed last; the last one wins. */
  private heldDirections: Direction[] = [];
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(
    private readonly game: Game,
    target: Window,
  ) {
    target.addEventListener('keydown', (e) => this.onKeyDown(e));
    target.addEventListener('keyup', (e) => this.onKeyUp(e));
    target.addEventListener('blur', () => this.releaseAll());
  }

  update(dt: number): void {
    const direction = this.heldDirections[this.heldDirections.length - 1];
    if (direction === undefined) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR) {
      this.arrTimer -= ARR;
      this.move(direction);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.metaKey || e.altKey || (e.ctrlKey && e.code !== 'ControlLeft')) return; // leave browser shortcuts alone
    if (!this.handles(e.code)) return;
    e.preventDefault();
    if (e.repeat) return; // auto repeat is done by `update`, not by the operating system

    switch (e.code) {
      case 'ArrowLeft':
        this.press(-1);
        break;
      case 'ArrowRight':
        this.press(1);
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotate(true);
        break;
      case 'KeyZ':
      case 'ControlLeft':
        this.game.rotate(false);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(true);
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'KeyC':
        this.game.holdPiece();
        break;
      case 'KeyP':
      case 'Escape':
        this.game.togglePause();
        break;
      case 'KeyR':
        if (this.game.status === 'gameover') this.game.restart();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
        this.release(-1);
        break;
      case 'ArrowRight':
        this.release(1);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
    }
  }

  private handles(code: string): boolean {
    return [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyX', 'KeyZ',
      'ControlLeft', 'Space', 'KeyC', 'KeyP', 'Escape', 'KeyR',
    ].includes(code);
  }

  private press(direction: Direction): void {
    this.heldDirections = this.heldDirections.filter((d) => d !== direction);
    this.heldDirections.push(direction);
    this.restartRepeat();
    this.move(direction);
  }

  private release(direction: Direction): void {
    this.heldDirections = this.heldDirections.filter((d) => d !== direction);
    this.restartRepeat();
  }

  private releaseAll(): void {
    this.heldDirections = [];
    this.restartRepeat();
    this.game.setSoftDrop(false);
  }

  private restartRepeat(): void {
    this.dasTimer = 0;
    this.arrTimer = 0;
  }

  private move(direction: Direction): void {
    if (direction < 0) this.game.moveLeft();
    else this.game.moveRight();
  }
}
