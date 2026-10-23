import type { Game } from './game.js';

type Action = 'left' | 'right' | 'rotateCW' | 'rotateCCW' | 'softDrop' | 'hardDrop' | 'hold' | 'restart';

/** Keys are lower-cased `KeyboardEvent.key` values; left Control is matched by its physical key. */
const BINDINGS: Partial<Record<string, Action>> = {
  arrowleft: 'left',
  arrowright: 'right',
  arrowup: 'rotateCW',
  arrowdown: 'softDrop',
  x: 'rotateCW',
  z: 'rotateCCW',
  controlleft: 'rotateCCW',
  ' ': 'hardDrop',
  c: 'hold',
  r: 'restart',
};

/** Delayed auto shift and auto repeat rate for held left/right, in milliseconds. */
const DAS_MS = 167;
const ARR_MS = 33;

/** Turns keyboard input into game actions, including auto-repeat for held left/right. */
export class Controller {
  private heldDirection: -1 | 0 | 1 = 0;
  private dasMs = 0;
  private arrMs = 0;

  constructor(private readonly game: Game) {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
    window.addEventListener('blur', () => this.releaseAll());
  }

  update(dtMs: number): void {
    if (!this.heldDirection) return;
    if (this.dasMs < DAS_MS) {
      this.dasMs += dtMs;
      return;
    }
    this.arrMs += dtMs;
    while (this.arrMs >= ARR_MS) {
      this.arrMs -= ARR_MS;
      this.game.move(this.heldDirection);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const key = keyName(event);
    const action = BINDINGS[key];
    // Leave browser shortcuts such as Ctrl+R alone.
    if (!action || event.metaKey || event.altKey || (event.ctrlKey && key !== 'controlleft')) return;
    event.preventDefault();
    if (event.repeat) return;

    switch (action) {
      case 'left':
        this.startMove(-1);
        break;
      case 'right':
        this.startMove(1);
        break;
      case 'rotateCW':
        this.game.rotate(1);
        break;
      case 'rotateCCW':
        this.game.rotate(-1);
        break;
      case 'softDrop':
        this.game.softDropping = true;
        break;
      case 'hardDrop':
        this.game.hardDrop();
        break;
      case 'hold':
        this.game.holdPiece();
        break;
      case 'restart':
        if (this.game.gameOver) this.game.restart();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const action = BINDINGS[keyName(event)];
    if (action === 'softDrop') this.game.softDropping = false;
    if (action === 'left' || action === 'right') {
      const direction = action === 'left' ? -1 : 1;
      if (this.heldDirection === direction) this.heldDirection = 0;
    }
  }

  private startMove(direction: -1 | 1): void {
    this.heldDirection = direction;
    this.dasMs = 0;
    this.arrMs = 0;
    this.game.move(direction);
  }

  private releaseAll(): void {
    this.heldDirection = 0;
    this.game.softDropping = false;
  }
}

function keyName(event: KeyboardEvent): string {
  return event.code === 'ControlLeft' ? 'controlleft' : event.key.toLowerCase();
}
