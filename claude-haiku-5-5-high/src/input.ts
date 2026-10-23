import type { Game } from './game/game.js';

/** Delayed auto shift and auto repeat rate for holding left/right, in seconds. */
const DAS = 0.16;
const ARR = 0.04;

type Direction = -1 | 1;

/** Keys the game uses. Matched by physical key code so they work on any layout. */
const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyX',
  'KeyZ',
  'ControlLeft',
  'Space',
  'KeyC',
  'KeyR',
]);

export class Input {
  // Held left/right keys, most recently pressed last.
  private heldDirections: Direction[] = [];
  private repeatTimer = 0;
  private repeating = false;

  constructor(private readonly game: Game) {}

  keyDown(event: KeyboardEvent): void {
    const { code } = event;
    if (!GAME_KEYS.has(code) || isBrowserShortcut(event)) return;
    event.preventDefault();
    // Auto-repeat from the OS is ignored; left/right repeat is handled by update().
    if (event.repeat) return;

    switch (code) {
      case 'ArrowLeft':
        this.pressDirection(-1);
        break;
      case 'ArrowRight':
        this.pressDirection(1);
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
        this.game.rotate(-1);
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'KeyC':
        this.game.hold();
        break;
      case 'KeyR':
        this.game.restart();
        break;
    }
  }

  keyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowLeft':
        this.releaseDirection(-1);
        break;
      case 'ArrowRight':
        this.releaseDirection(1);
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
    }
  }

  /** Forgets held keys, for example when the window loses focus and the keyup never arrives. */
  reset(): void {
    this.heldDirections = [];
    this.repeatTimer = 0;
    this.repeating = false;
    this.game.setSoftDrop(false);
  }

  update(dt: number): void {
    const direction = this.heldDirections[this.heldDirections.length - 1];
    if (direction === undefined) return;

    this.repeatTimer += dt;
    let interval = this.repeating ? ARR : DAS;
    while (this.repeatTimer >= interval) {
      this.repeatTimer -= interval;
      this.repeating = true;
      interval = ARR;
      this.game.moveHorizontal(direction);
    }
  }

  private pressDirection(direction: Direction): void {
    this.heldDirections = this.heldDirections.filter((held) => held !== direction);
    this.heldDirections.push(direction);
    this.restartRepeat();
    this.game.moveHorizontal(direction);
  }

  private releaseDirection(direction: Direction): void {
    this.heldDirections = this.heldDirections.filter((held) => held !== direction);
    this.restartRepeat();
  }

  private restartRepeat(): void {
    this.repeatTimer = 0;
    this.repeating = false;
  }
}

/** Leaves Cmd/Alt and Ctrl+key combinations (reload, copy, undo) to the browser. Left Ctrl is the rotate key. */
function isBrowserShortcut(event: KeyboardEvent): boolean {
  if (event.metaKey || event.altKey) return true;
  return event.ctrlKey && event.code !== 'ControlLeft';
}
