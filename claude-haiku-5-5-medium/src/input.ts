import { Game } from './game.js';

// Delayed auto shift: how long a held direction waits before repeating, then the repeat interval.
const DAS = 0.17;
const ARR = 0.05;

const ACTION_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space',
  'KeyX', 'KeyZ', 'ControlLeft', 'KeyC', 'KeyR',
]);

export class Input {
  private held: -1 | 1 | null = null;
  private elapsed = 0;
  private repeatTimer = 0;

  constructor(private readonly game: Game) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => {
      this.held = null;
      this.game.setSoftDrop(false);
    });
  }

  // Call once per frame, before the game update.
  update(dt: number): void {
    const dir = this.held;
    if (dir === null) return;
    this.elapsed += dt;
    if (this.elapsed < DAS) return;
    this.repeatTimer += dt;
    while (this.repeatTimer >= ARR) {
      this.repeatTimer -= ARR;
      this.game.move(dir);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!ACTION_KEYS.has(e.code)) return;
    e.preventDefault();
    // Auto-repeat from the OS is ignored; movement repeats through DAS/ARR instead.
    if (e.repeat) return;

    switch (e.code) {
      case 'ArrowLeft': this.press(-1); break;
      case 'ArrowRight': this.press(1); break;
      case 'ArrowDown': this.game.setSoftDrop(true); break;
      case 'ArrowUp':
      case 'KeyX': this.game.rotate(1); break;
      case 'KeyZ':
      case 'ControlLeft': this.game.rotate(-1); break;
      case 'Space': this.game.hardDrop(); break;
      case 'KeyC': this.game.holdPiece(); break;
      case 'KeyR':
        if (this.game.gameOver) this.game.reset();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
        if (this.held === -1) this.held = null;
        break;
      case 'ArrowRight':
        if (this.held === 1) this.held = null;
        break;
      case 'ArrowDown':
        this.game.setSoftDrop(false);
        break;
    }
  }

  private press(dir: -1 | 1): void {
    this.held = dir;
    this.elapsed = 0;
    this.repeatTimer = 0;
    this.game.move(dir);
  }
}
