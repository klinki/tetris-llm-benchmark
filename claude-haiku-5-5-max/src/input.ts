import { ARR, DAS } from './constants.js';
import type { Game } from './game.js';

type Direction = -1 | 1;

type Action =
  | 'left'
  | 'right'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCw'
  | 'rotateCcw'
  | 'hold'
  | 'restart';

/** Keys are matched by physical position (event.code), so bindings stay put on any layout. */
const BINDINGS: Readonly<Record<string, Action>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'softDrop',
  ArrowUp: 'rotateCw',
  KeyX: 'rotateCw',
  KeyZ: 'rotateCcw',
  ControlLeft: 'rotateCcw',
  Space: 'hardDrop',
  KeyC: 'hold',
  KeyR: 'restart',
};

/** Keys whose default browser behaviour (scrolling) would fight the game. */
const SUPPRESSED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space']);

/**
 * Keyboard controls. Left and right use DAS/ARR auto-shift, so the speed of
 * held movement does not depend on the operating system's key-repeat settings.
 */
export class Controls {
  /** Left and right keys currently held, most recent last. */
  private pressed: Direction[] = [];
  /** Direction being auto-shifted, or null when no horizontal key is held. */
  private repeating: Direction | null = null;
  /** Seconds left until the next auto-shifted move. */
  private timer = 0;

  constructor(private readonly game: Game) {}

  attach(target: Window): void {
    target.addEventListener('keydown', (event) => this.onKeyDown(event));
    target.addEventListener('keyup', (event) => this.onKeyUp(event));
    target.addEventListener('blur', () => this.releaseAll());
  }

  /** Advances auto-shift by `dt` seconds. Call once per frame, before the game update. */
  update(dt: number): void {
    if (this.repeating === null) return;
    this.timer -= dt;
    while (this.timer <= 0) {
      this.game.move(this.repeating);
      this.timer += ARR;
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const action = BINDINGS[event.code];
    if (!action || event.metaKey || event.altKey) return;
    if (SUPPRESSED_KEYS.has(event.code)) event.preventDefault();
    // Held keys are handled by DAS/ARR and browser repeats are ignored for the rest.
    if (event.repeat) return;

    switch (action) {
      case 'left':
        this.press(-1);
        break;
      case 'right':
        this.press(1);
        break;
      case 'softDrop':
        this.game.setSoftDrop(true);
        break;
      case 'hardDrop':
        this.game.hardDrop();
        break;
      case 'rotateCw':
        this.game.rotate(1);
        break;
      case 'rotateCcw':
        this.game.rotate(-1);
        break;
      case 'hold':
        this.game.hold();
        break;
      case 'restart':
        this.game.restart();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (BINDINGS[event.code]) {
      case 'left':
        this.release(-1);
        break;
      case 'right':
        this.release(1);
        break;
      case 'softDrop':
        this.game.setSoftDrop(false);
        break;
    }
  }

  private press(direction: Direction): void {
    this.pressed = this.pressed.filter((held) => held !== direction);
    this.pressed.push(direction);
    this.startRepeat(direction);
  }

  /** Releasing one horizontal key hands auto-shift to the other one, if it is still held. */
  private release(direction: Direction): void {
    this.pressed = this.pressed.filter((held) => held !== direction);
    const next = this.pressed.at(-1);
    if (next === undefined) {
      this.repeating = null;
    } else {
      this.startRepeat(next);
    }
  }

  /** Moves once straight away, then auto-shifts after the DAS delay. */
  private startRepeat(direction: Direction): void {
    this.repeating = direction;
    this.timer = DAS;
    this.game.move(direction);
  }

  private releaseAll(): void {
    this.pressed = [];
    this.repeating = null;
    this.game.setSoftDrop(false);
  }
}
