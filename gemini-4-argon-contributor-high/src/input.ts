import { TetrisGame } from './game.js';

const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  ' ',
  'KeyX',
  'x',
  'X',
  'KeyZ',
  'z',
  'Z',
  'ControlLeft',
  'Control',
  'KeyC',
  'c',
  'C',
  'KeyR',
  'r',
  'R',
]);

export class InputController {
  private readonly game: TetrisGame;
  private readonly onAction: () => void;
  private readonly boundKeyDown: (event: KeyboardEvent) => void;

  constructor(game: TetrisGame, onAction: () => void) {
    this.game = game;
    this.onAction = onAction;
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  public attach(target: Window | Document = window): void {
    target.addEventListener('keydown', this.boundKeyDown as EventListener);
  }

  public detach(target: Window | Document = window): void {
    target.removeEventListener('keydown', this.boundKeyDown as EventListener);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.metaKey) {
      return;
    }

    const key = event.key ?? '';
    const code = event.code ?? '';

    if (GAME_KEYS.has(code) || GAME_KEYS.has(key)) {
      event.preventDefault();
    }

    const handled = this.game.handleKey(key, code);
    if (handled) {
      this.onAction();
    }
  }
}
