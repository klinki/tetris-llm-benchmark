import { Game } from './game';
import { DAS_FRAMES, ARR_FRAMES } from './constants';

type RepeatAction = 'left' | 'right' | 'softDrop';

/**
 * Keyboard input handler. Translates key events into game actions and
 * implements delayed auto-shift (DAS) for held left/right/soft-drop keys.
 */
export class InputHandler {
  private game: Game;
  private held = new Set<RepeatAction>();
  private repeatCounters: Record<RepeatAction, number> = {
    left: 0,
    right: 0,
    softDrop: 0,
  };
  /** Keys currently down, used to ensure only one horizontal direction repeats. */
  private down = new Set<string>();

  constructor(game: Game) {
    this.game = game;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    // Prevent default scrolling for game keys.
    if (this.isGameKey(code)) e.preventDefault();
    if (this.down.has(code)) return; // ignore OS auto-repeat; we do our own
    this.down.add(code);

    switch (code) {
      case 'ArrowLeft':
        this.game.move(-1);
        this.beginRepeat('left');
        break;
      case 'ArrowRight':
        this.game.move(1);
        this.beginRepeat('right');
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.game.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.game.rotate(-1);
        break;
      case 'ArrowDown':
        this.game.softDrop();
        this.beginRepeat('softDrop');
        break;
      case 'Space':
        this.game.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.game.holdPiece();
        break;
      case 'KeyR':
        this.game.reset();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    switch (e.code) {
      case 'ArrowLeft': this.endRepeat('left'); break;
      case 'ArrowRight': this.endRepeat('right'); break;
      case 'ArrowDown': this.endRepeat('softDrop'); break;
    }
  };

  private isGameKey(code: string): boolean {
    return [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
      'KeyX', 'KeyZ', 'KeyC', 'KeyR',
      'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight',
    ].includes(code);
  }

  private beginRepeat(action: RepeatAction): void {
    // Left and right are mutually exclusive; releasing one cancels the other.
    if (action === 'left') this.held.delete('right');
    if (action === 'right') this.held.delete('left');
    this.held.add(action);
    this.repeatCounters[action] = 0;
  }

  private endRepeat(action: RepeatAction): void {
    this.held.delete(action);
    this.repeatCounters[action] = 0;
  }

  /** Advance auto-repeat by one frame. Called from the main loop. */
  tick(): void {
    for (const action of this.held) {
      const c = ++this.repeatCounters[action];
      if (c < DAS_FRAMES) continue;
      if ((c - DAS_FRAMES) % ARR_FRAMES !== 0) continue;
      switch (action) {
        case 'left': this.game.move(-1); break;
        case 'right': this.game.move(1); break;
        case 'softDrop': this.game.softDrop(); break;
      }
    }
  }
}
