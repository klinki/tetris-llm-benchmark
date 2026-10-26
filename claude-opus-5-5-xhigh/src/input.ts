/** What the keyboard can ask the game to do. */
export interface Controls {
  shift(direction: -1 | 1): void;
  rotate(direction: 1 | -1): void;
  softDrop(active: boolean): void;
  hardDrop(): void;
  hold(): void;
  pause(): void;
  restart(): void;
}

type Action = 'left' | 'right' | 'rotateCW' | 'rotateCCW' | 'softDrop' | 'hardDrop' | 'hold' | 'pause' | 'restart';

const KEY_BINDINGS: Readonly<Record<string, Action>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotateCW',
  KeyX: 'rotateCW',
  KeyZ: 'rotateCCW',
  ControlLeft: 'rotateCCW',
  ArrowDown: 'softDrop',
  Space: 'hardDrop',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  KeyP: 'pause',
  Escape: 'pause',
  KeyR: 'restart',
};

/** Delayed Auto Shift: how long left/right must be held before auto-repeat starts (ms). */
const DAS = 170;
/** Auto Repeat Rate: interval between repeated shifts while left/right is held (ms). */
const ARR = 50;

type Direction = -1 | 1;

export class Input {
  /** Held horizontal directions; the most recently pressed one wins. */
  private directions: Direction[] = [];
  private shiftTimer = 0;

  constructor(target: Window, private readonly controls: Controls) {
    target.addEventListener('keydown', (event) => this.onKeyDown(event));
    target.addEventListener('keyup', (event) => this.onKeyUp(event));
    target.addEventListener('blur', () => this.releaseAll());
  }

  /** Repeats the held horizontal movement; call once per frame. */
  update(dt: number): void {
    const direction = this.directions.at(-1);
    if (direction === undefined) return;

    this.shiftTimer -= dt;
    while (this.shiftTimer <= 0) {
      this.controls.shift(direction);
      this.shiftTimer += ARR;
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const action = KEY_BINDINGS[event.code];
    // Leave browser shortcuts such as Cmd+R alone.
    if (!action || event.metaKey || event.altKey) return;
    event.preventDefault();
    // Auto-repeat is handled by DAS/ARR above, never by the OS key repeat.
    if (event.repeat) return;

    switch (action) {
      case 'left': this.pressDirection(-1); break;
      case 'right': this.pressDirection(1); break;
      case 'rotateCW': this.controls.rotate(1); break;
      case 'rotateCCW': this.controls.rotate(-1); break;
      case 'softDrop': this.controls.softDrop(true); break;
      case 'hardDrop': this.controls.hardDrop(); break;
      case 'hold': this.controls.hold(); break;
      case 'pause': this.controls.pause(); break;
      case 'restart': this.controls.restart(); break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const action = KEY_BINDINGS[event.code];
    if (action === 'left') this.releaseDirection(-1);
    else if (action === 'right') this.releaseDirection(1);
    else if (action === 'softDrop') this.controls.softDrop(false);
  }

  private pressDirection(direction: Direction): void {
    this.directions = [...this.directions.filter((d) => d !== direction), direction];
    this.controls.shift(direction);
    this.shiftTimer = DAS;
  }

  private releaseDirection(direction: Direction): void {
    const wasActive = this.directions.at(-1) === direction;
    this.directions = this.directions.filter((d) => d !== direction);
    // The other direction, if still held, takes over after a fresh delay.
    if (wasActive) this.shiftTimer = DAS;
  }

  /** Key-up events are lost while the window is unfocused, so forget every held key. */
  private releaseAll(): void {
    this.directions = [];
    this.controls.softDrop(false);
  }
}
