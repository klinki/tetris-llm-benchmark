import { TetrisEngine } from './engine.js';

const DAS_MS = 135;
const ARR_MS = 33;

export class InputController {
  private readonly engine: TetrisEngine;
  private readonly onStateChange: () => void;

  private leftHeld = false;
  private rightHeld = false;
  private downHeld = false;

  private horizontalDirection: -1 | 0 | 1 = 0;
  private dasTimerMs = 0;
  private arrTimerMs = 0;

  constructor(engine: TetrisEngine, onStateChange: () => void) {
    this.engine = engine;
    this.onStateChange = onStateChange;
    this.bindEvents();
  }

  public isSoftDropping(): boolean {
    return this.downHeld;
  }

  public update(dtMs: number): void {
    if (this.engine.isPaused() || this.engine.isGameOver()) {
      return;
    }

    if (this.horizontalDirection !== 0) {
      this.dasTimerMs += dtMs;
      if (this.dasTimerMs >= DAS_MS) {
        this.arrTimerMs += dtMs;
        while (this.arrTimerMs >= ARR_MS) {
          this.arrTimerMs -= ARR_MS;
          const moved =
            this.horizontalDirection === -1
              ? this.engine.moveLeft()
              : this.engine.moveRight();
          if (!moved) {
            break;
          }
        }
      }
    }
  }

  public resetHeldKeys(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.downHeld = false;
    this.horizontalDirection = 0;
    this.dasTimerMs = 0;
    this.arrTimerMs = 0;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Restart shortcut
      if (key === 'r') {
        e.preventDefault();
        this.resetHeldKeys();
        this.engine.reset();
        this.onStateChange();
        return;
      }

      // Pause shortcut
      if (key === 'p' || code === 'Escape') {
        e.preventDefault();
        this.resetHeldKeys();
        this.engine.togglePause();
        this.onStateChange();
        return;
      }

      if (this.engine.isGameOver()) {
        if (code === 'Space' || code === 'Enter') {
          e.preventDefault();
          this.resetHeldKeys();
          this.engine.reset();
          this.onStateChange();
        }
        return;
      }

      if (this.engine.isPaused()) {
        return;
      }

      // Prevent browser scrolling on game keys
      if (
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'Space'
      ) {
        e.preventDefault();
      }

      if (e.repeat) {
        // Horizontal and soft-drop auto-repeat are handled smoothly by DAS/ARR and engine update
        return;
      }

      if (code === 'ArrowLeft') {
        this.leftHeld = true;
        this.horizontalDirection = -1;
        this.dasTimerMs = 0;
        this.arrTimerMs = 0;
        this.engine.moveLeft();
        this.onStateChange();
      } else if (code === 'ArrowRight') {
        this.rightHeld = true;
        this.horizontalDirection = 1;
        this.dasTimerMs = 0;
        this.arrTimerMs = 0;
        this.engine.moveRight();
        this.onStateChange();
      } else if (code === 'ArrowDown') {
        this.downHeld = true;
        this.engine.softDrop();
        this.onStateChange();
      } else if (code === 'ArrowUp' || key === 'x') {
        // Clockwise rotation: Up Arrow or X
        this.engine.rotate('cw');
        this.onStateChange();
      } else if (
        key === 'z' ||
        code === 'ControlLeft' ||
        e.key === 'Control'
      ) {
        // Counter-clockwise rotation: Z or Left Ctrl
        e.preventDefault();
        this.engine.rotate('ccw');
        this.onStateChange();
      } else if (code === 'Space') {
        // Hard drop: Space
        this.engine.hardDrop();
        this.onStateChange();
      } else if (key === 'c' || code === 'ShiftLeft' || code === 'ShiftRight') {
        // Hold piece: C or Shift
        this.engine.hold();
        this.onStateChange();
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      const code = e.code;

      if (code === 'ArrowLeft') {
        this.leftHeld = false;
        this.horizontalDirection = this.rightHeld ? 1 : 0;
        this.dasTimerMs = 0;
        this.arrTimerMs = 0;
      } else if (code === 'ArrowRight') {
        this.rightHeld = false;
        this.horizontalDirection = this.leftHeld ? -1 : 0;
        this.dasTimerMs = 0;
        this.arrTimerMs = 0;
      } else if (code === 'ArrowDown') {
        this.downHeld = false;
      }
    });

    window.addEventListener('blur', () => {
      this.resetHeldKeys();
    });
  }
}
