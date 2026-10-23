import { Game } from './game.js';

/** Delayed auto shift and auto repeat rate for held left/right keys. */
const DAS_MS = 167;
const ARR_MS = 33;

type Direction = -1 | 1;

const LEFT_KEYS = new Set(['ArrowLeft']);
const RIGHT_KEYS = new Set(['ArrowRight']);
const ROTATE_CW_KEYS = new Set(['ArrowUp', 'KeyX']);
const ROTATE_CCW_KEYS = new Set(['KeyZ', 'ControlLeft']);
const SOFT_DROP_KEYS = new Set(['ArrowDown']);
const HARD_DROP_KEYS = new Set(['Space']);
const HOLD_KEYS = new Set(['KeyC', 'ShiftLeft', 'ShiftRight']);
const RESTART_KEYS = new Set(['KeyR']);
const PAUSE_KEYS = new Set(['Escape', 'KeyP', 'F1']);

/** Translates keyboard events into game actions; auto-repeat is driven by the game loop's clock. */
export class Input {
  /** Held horizontal directions, most recently pressed last. */
  private held: Direction[] = [];
  private repeatTimer = 0;
  private repeating = false;

  constructor(private readonly game: Game, target: Window) {
    target.addEventListener('keydown', (e) => this.onKeyDown(e));
    target.addEventListener('keyup', (e) => this.onKeyUp(e));
    target.addEventListener('blur', () => this.releaseAll());
  }

  /** Advances DAS/ARR timing; call once per frame with the same dt the game receives. */
  update(dtMs: number): void {
    const direction = this.held[this.held.length - 1];
    if (direction === undefined || this.game.status !== 'playing') return;
    this.repeatTimer += dtMs;
    if (!this.repeating) {
      if (this.repeatTimer < DAS_MS) return;
      this.repeating = true;
      this.repeatTimer -= DAS_MS;
      this.shift(direction);
    }
    while (this.repeatTimer >= ARR_MS) {
      this.repeatTimer -= ARR_MS;
      if (!this.shift(direction)) {
        this.repeatTimer = 0;
        break;
      }
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    const game = this.game;
    // Keep browser shortcuts such as Cmd/Ctrl+R working.
    const browserShortcut = e.metaKey || (e.ctrlKey && code.startsWith('Key'));
    if (browserShortcut) return;
    if (isGameKey(code)) e.preventDefault();
    if (e.repeat) return; // Auto-repeat is handled by DAS/ARR, rotations require a fresh press.

    if (LEFT_KEYS.has(code)) this.press(-1);
    else if (RIGHT_KEYS.has(code)) this.press(1);
    else if (ROTATE_CW_KEYS.has(code)) game.rotateClockwise();
    else if (ROTATE_CCW_KEYS.has(code)) game.rotateCounterClockwise();
    else if (SOFT_DROP_KEYS.has(code)) game.setSoftDrop(true);
    else if (HARD_DROP_KEYS.has(code)) game.hardDrop();
    else if (HOLD_KEYS.has(code)) game.holdPiece();
    else if (PAUSE_KEYS.has(code)) game.togglePause();
    else if (RESTART_KEYS.has(code) && game.status === 'gameover') {
      this.releaseAll();
      game.restart();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    if (LEFT_KEYS.has(code)) this.release(-1);
    else if (RIGHT_KEYS.has(code)) this.release(1);
    else if (SOFT_DROP_KEYS.has(code)) this.game.setSoftDrop(false);
  }

  private press(direction: Direction): void {
    this.held = this.held.filter((d) => d !== direction);
    this.held.push(direction);
    this.resetRepeat();
    this.shift(direction);
  }

  private release(direction: Direction): void {
    const wasActive = this.held[this.held.length - 1] === direction;
    this.held = this.held.filter((d) => d !== direction);
    if (wasActive) this.resetRepeat();
  }

  private releaseAll(): void {
    this.held = [];
    this.resetRepeat();
    this.game.setSoftDrop(false);
  }

  private resetRepeat(): void {
    this.repeatTimer = 0;
    this.repeating = false;
  }

  private shift(direction: Direction): boolean {
    return direction < 0 ? this.game.moveLeft() : this.game.moveRight();
  }
}

function isGameKey(code: string): boolean {
  return [
    LEFT_KEYS, RIGHT_KEYS, ROTATE_CW_KEYS, ROTATE_CCW_KEYS, SOFT_DROP_KEYS,
    HARD_DROP_KEYS, HOLD_KEYS, RESTART_KEYS, PAUSE_KEYS,
  ].some((keys) => keys.has(code));
}
