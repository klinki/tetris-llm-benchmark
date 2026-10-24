import type { Game } from './game.js';

const DAS_MS = 167; // delayed auto shift: time a held key waits before repeating
const ARR_MS = 33; // auto repeat rate

/**
 * Keyboard handling with guideline-style DAS/ARR auto repeat for horizontal movement.
 * Call `update(dt)` once per frame.
 */
export class Input {
  private heldDirs: Array<-1 | 1> = []; // in press order; the last one is controlling
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private readonly game: Game) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  update(dt: number): void {
    const dir = this.heldDirs[this.heldDirs.length - 1];
    if (dir === undefined) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      this.game.move(dir);
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.code) {
      case 'ArrowLeft':
        preventDefault(e);
        this.press(-1);
        break;
      case 'ArrowRight':
        preventDefault(e);
        this.press(1);
        break;
      case 'ArrowDown':
        preventDefault(e);
        this.game.softHeld = true;
        break;
      case 'ArrowUp':
      case 'KeyX':
        preventDefault(e);
        this.game.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.game.rotate(-1);
        break;
      case 'Space':
        preventDefault(e);
        this.game.hardDrop();
        break;
      case 'KeyC':
        this.game.hold();
        break;
      case 'KeyR':
        if (this.game.over) this.game.restart();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
        this.release(-1);
        break;
      case 'ArrowRight':
        this.release(1);
        break;
      case 'ArrowDown':
        this.game.softHeld = false;
        break;
    }
  };

  private press(dir: -1 | 1): void {
    if (!this.heldDirs.includes(dir)) this.heldDirs.push(dir);
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.game.move(dir); // immediate first step, DAS kicks in afterwards
  }

  private release(dir: -1 | 1): void {
    this.heldDirs = this.heldDirs.filter((d) => d !== dir);
    this.dasTimer = 0;
    this.arrTimer = 0;
  }
}

function preventDefault(e: KeyboardEvent): void {
  e.preventDefault();
}
