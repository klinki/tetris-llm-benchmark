import { Game } from './core/game.js';

const DAS_DELAY_MS = 160; // hold time before auto repeat starts
const AUTO_REPEAT_MS = 40; // interval between auto repeats
const SCROLLING_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space']);

/**
 * Translates keyboard input into game commands. Horizontal keys use DAS/ARR
 * style auto repeat; rotation, drops, hold and restart fire on keydown only.
 */
export class InputController {
  private heldLeft = false;
  private heldRight = false;
  private repeatDir: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private readonly game: Game) {}

  attach(): void {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
    window.addEventListener('blur', () => this.releaseAll());
  }

  /** Runs every frame; drives held-key auto repeat. */
  update(dtMs: number): void {
    if (this.repeatDir === 0) return;
    this.dasTimer += dtMs;
    if (this.dasTimer < DAS_DELAY_MS) return;
    this.arrTimer += dtMs;
    while (this.arrTimer >= AUTO_REPEAT_MS) {
      this.arrTimer -= AUTO_REPEAT_MS;
      this.game.move(this.repeatDir);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Leave browser shortcuts (Ctrl/Cmd/Alt + key) alone; plain Left Ctrl rotates.
    if ((event.ctrlKey || event.metaKey || event.altKey) && event.code !== 'ControlLeft') return;
    if (SCROLLING_KEYS.has(event.code)) event.preventDefault();
    if (event.repeat) return;
    switch (event.code) {
      case 'ArrowLeft':
        this.heldLeft = true;
        this.press(-1);
        break;
      case 'ArrowRight':
        this.heldRight = true;
        this.press(1);
        break;
      case 'ArrowDown':
        this.game.softDropping = true;
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
        this.game.holdPiece();
        break;
      case 'KeyR':
        this.game.reset();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowLeft':
        this.heldLeft = false;
        this.release(-1);
        break;
      case 'ArrowRight':
        this.heldRight = false;
        this.release(1);
        break;
      case 'ArrowDown':
        this.game.softDropping = false;
        break;
    }
  }

  private press(dir: -1 | 1): void {
    this.repeatDir = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.game.move(dir);
  }

  private release(dir: -1 | 1): void {
    if (this.repeatDir !== dir) return;
    this.repeatDir = 0;
    if (dir === -1 && this.heldRight) this.press(1);
    else if (dir === 1 && this.heldLeft) this.press(-1);
  }

  private releaseAll(): void {
    this.heldLeft = false;
    this.heldRight = false;
    this.repeatDir = 0;
    this.game.softDropping = false;
  }
}
