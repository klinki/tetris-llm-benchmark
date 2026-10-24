export interface InputActions {
  move(direction: -1 | 1): void;
  rotate(direction: 1 | -1): void;
  softDrop(active: boolean): void;
  hardDrop(): void;
  hold(): void;
  restart(): void;
  pause(): void;
  canAutoRepeat(): boolean;
}

const DAS_SECONDS = 0.16;
const ARR_SECONDS = 0.045;

const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'KeyX',
  'KeyZ',
  'KeyC',
  'KeyR',
  'KeyP',
  'Escape',
  'ControlLeft',
  'ControlRight',
]);

/** Keyboard handling with delayed auto shift (DAS) and auto repeat rate (ARR). */
export class InputController {
  private directionStack: Array<'left' | 'right'> = [];
  private repeatTimer = 0;
  private arrTimer = 0;
  private arrStarted = false;
  private softDropHeld = false;

  constructor(
    private readonly target: Window,
    private readonly actions: InputActions,
  ) {
    this.target.addEventListener('keydown', this.handleKeyDown, { passive: false });
    this.target.addEventListener('keyup', this.handleKeyUp);
    this.target.addEventListener('blur', this.handleBlur);
  }

  /** Clear held-key state; useful on restart or when the window loses focus. */
  releaseAll(): void {
    if (this.softDropHeld) this.actions.softDrop(false);
    this.softDropHeld = false;
    this.directionStack.length = 0;
    this.resetRepeat();
  }

  update(dt: number): void {
    if (!this.actions.canAutoRepeat() || this.directionStack.length === 0) {
      this.resetRepeat();
      return;
    }

    const direction = this.directionStack[this.directionStack.length - 1];
    const sign = direction === 'left' ? -1 : 1;
    this.repeatTimer += dt;

    if (!this.arrStarted) {
      if (this.repeatTimer >= DAS_SECONDS) {
        this.actions.move(sign);
        this.arrStarted = true;
        this.arrTimer = 0;
      }
      return;
    }

    this.arrTimer += dt;
    while (this.arrTimer >= ARR_SECONDS) {
      this.actions.move(sign);
      this.arrTimer -= ARR_SECONDS;
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const code = event.code;
    if (!GAME_KEYS.has(code)) return;
    if (event.metaKey || event.altKey) return;

    event.preventDefault();
    if (event.repeat) return;

    switch (code) {
      case 'ArrowLeft':
        this.startDirection('left');
        break;
      case 'ArrowRight':
        this.startDirection('right');
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.actions.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.actions.rotate(-1);
        break;
      case 'ArrowDown':
        if (!this.softDropHeld) {
          this.softDropHeld = true;
          this.actions.softDrop(true);
        }
        break;
      case 'Space':
        this.actions.hardDrop();
        break;
      case 'KeyC':
        this.actions.hold();
        break;
      case 'KeyR':
        this.actions.restart();
        break;
      case 'KeyP':
      case 'Escape':
        this.actions.pause();
        break;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'ArrowLeft':
        this.endDirection('left');
        break;
      case 'ArrowRight':
        this.endDirection('right');
        break;
      case 'ArrowDown':
        if (this.softDropHeld) {
          this.softDropHeld = false;
          this.actions.softDrop(false);
        }
        break;
    }
  };

  private readonly handleBlur = (): void => {
    this.releaseAll();
  };

  private startDirection(direction: 'left' | 'right'): void {
    if (this.directionStack.includes(direction)) return;
    this.directionStack.push(direction);
    this.actions.move(direction === 'left' ? -1 : 1);
    this.resetRepeat();
  }

  private endDirection(direction: 'left' | 'right'): void {
    const index = this.directionStack.lastIndexOf(direction);
    if (index !== -1) this.directionStack.splice(index, 1);
    this.resetRepeat();

    const stillHeld = this.directionStack[this.directionStack.length - 1];
    if (stillHeld) {
      this.actions.move(stillHeld === 'left' ? -1 : 1);
    }
  }

  private resetRepeat(): void {
    this.repeatTimer = 0;
    this.arrTimer = 0;
    this.arrStarted = false;
  }
}
