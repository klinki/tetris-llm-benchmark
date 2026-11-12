import { ARR_MS, DAS_MS } from './constants.js';
import { Game } from './game.js';

type Action =
  | 'left'
  | 'right'
  | 'softDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hardDrop'
  | 'hold'
  | 'restart'
  | 'pause'
  | 'start';

const KEY_ACTIONS: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'softDrop',
  ArrowUp: 'rotateCW',
  KeyX: 'rotateCW',
  KeyZ: 'rotateCCW',
  ControlLeft: 'rotateCCW',
  ControlRight: 'rotateCCW',
  Space: 'hardDrop',
  KeyC: 'hold',
  KeyR: 'restart',
  KeyP: 'pause',
  Enter: 'start',
};

interface RepeatState {
  action: Action;
  timer: number;
  dasTimer: number;
}

/**
 * Keyboard input with DAS/ARR style auto repeat for horizontal movement
 * and soft drop.
 */
export class Input {
  private held = new Map<Action, RepeatState>();
  private listeners: (() => void)[] = [];

  constructor(private game: Game) {}

  attach(target: Window = window): void {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = KEY_ACTIONS[e.code];
      if (!action) return;
      e.preventDefault();
      if (e.repeat) return;
      this.onPress(action);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const action = KEY_ACTIONS[e.code];
      if (!action) return;
      this.held.delete(action);
    };
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    this.listeners.push(() => target.removeEventListener('keydown', onKeyDown));
    this.listeners.push(() => target.removeEventListener('keyup', onKeyUp));
  }

  destroy(): void {
    for (const remove of this.listeners) remove();
    this.listeners = [];
  }

  private onPress(action: Action): void {
    const game = this.game;
    switch (action) {
      case 'left':
        game.moveLeft();
        this.held.set(action, { action, timer: 0, dasTimer: 0 });
        break;
      case 'right':
        game.moveRight();
        this.held.set(action, { action, timer: 0, dasTimer: 0 });
        break;
      case 'softDrop':
        game.softDrop();
        this.held.set(action, { action, timer: 0, dasTimer: 0 });
        break;
      case 'rotateCW':
        game.rotateClockwise();
        break;
      case 'rotateCCW':
        game.rotateCounterClockwise();
        break;
      case 'hardDrop':
        game.hardDrop();
        break;
      case 'hold':
        game.holdPiece();
        break;
      case 'restart':
        game.newGame();
        game.start();
        break;
      case 'pause':
        game.togglePause();
        break;
      case 'start':
        game.start();
        break;
    }
  }

  /** Processes held keys; call once per animation frame. */
  update(dt: number): void {
    for (const state of this.held.values()) {
      state.dasTimer += dt;
      state.timer += dt;
      const das = state.action === 'softDrop' ? 0 : DAS_MS;
      const arr = state.action === 'softDrop' ? 40 : ARR_MS;
      if (state.action === 'softDrop') {
        if (state.timer >= arr) {
          state.timer -= arr;
          this.game.softDrop();
        }
        continue;
      }
      if (state.dasTimer >= das + arr) {
        state.dasTimer = das;
        state.timer = 0;
        if (state.action === 'left') this.game.moveLeft();
        else if (state.action === 'right') this.game.moveRight();
      }
    }
  }
}
