import { Game } from './game.js';

type Action = 'left' | 'right' | 'soft' | 'drop' | 'cw' | 'ccw' | 'hold' | 'pause' | 'start' | 'restart';
const KEYS: Record<string, Action> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', Space: 'drop',
  ArrowUp: 'cw', KeyX: 'cw', KeyZ: 'ccw', ControlLeft: 'ccw', KeyC: 'hold',
  KeyP: 'pause', Escape: 'pause', Enter: 'start', KeyR: 'restart',
};
export const DAS = 167;
export const ARR = 33;

export class Input {
  private pressed = new Map<string, Action>();
  private direction: -1 | 0 | 1 = 0;
  private repeatTime = 0;
  private nextRepeat = DAS;

  constructor(private readonly game: Game, private readonly start: () => void) {
    window.addEventListener('keydown', event => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('select, input, textarea, [contenteditable="true"]') || event.metaKey || event.altKey) return;
      if (event.code === 'Enter' && target?.closest('button, a')) return;
      const action = KEYS[event.code];
      if (!action) return;
      event.preventDefault();
      if (!event.repeat) this.press(action, event.code);
    });
    window.addEventListener('keyup', event => this.release(event.code));
    window.addEventListener('blur', () => this.suspend());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.suspend(); });
    document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.press(button.dataset.action as Action, `pointer-${event.pointerId}`);
      });
      const release = (event: PointerEvent): void => this.release(`pointer-${event.pointerId}`);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      // Keyboard and assistive-technology activation does not fire pointerdown.
      button.addEventListener('click', event => {
        if (event.detail === 0) {
          this.press(button.dataset.action as Action, 'accessible-button');
          this.release('accessible-button');
        }
      });
    });
  }

  get softDropping(): boolean { return [...this.pressed.values()].includes('soft'); }

  reset(): void {
    this.pressed.clear();
    this.direction = 0;
    this.repeatTime = 0;
    this.nextRepeat = DAS;
  }

  tick(delta: number): void {
    if (this.game.status !== 'playing' || this.direction === 0) return;
    this.repeatTime += delta;
    while (this.repeatTime >= this.nextRepeat) {
      this.game.move(this.direction);
      this.nextRepeat += ARR;
    }
  }

  private press(action: Action, source: string): void {
    if (this.pressed.has(source)) return;
    this.pressed.set(source, action);
    if (action === 'pause') { this.game.pause(); this.reset(); return; }
    if (action === 'start') {
      if (this.game.status === 'paused') { this.game.pause(); this.reset(); }
      else if (this.game.status === 'ready' || this.game.status === 'over') this.start();
      return;
    }
    if (action === 'restart') { if (this.game.status === 'over') this.start(); return; }
    if (this.game.status !== 'playing') return;
    switch (action) {
      case 'left': case 'right':
        this.direction = action === 'left' ? -1 : 1;
        this.repeatTime = 0;
        this.nextRepeat = DAS;
        this.game.move(this.direction);
        break;
      case 'soft': this.game.softDrop(); break;
      case 'drop': this.game.hardDrop(); break;
      case 'cw': this.game.rotate(1); break;
      case 'ccw': this.game.rotate(-1); break;
      case 'hold': this.game.hold(); break;
    }
  }

  private release(source: string): void {
    const released = this.pressed.get(source);
    this.pressed.delete(source);
    if (released !== 'left' && released !== 'right') return;
    const horizontal = [...this.pressed.values()].filter(action => action === 'left' || action === 'right');
    const latest = horizontal.at(-1);
    const direction = latest === 'left' ? -1 : latest === 'right' ? 1 : 0;
    if (direction !== this.direction) {
      this.direction = direction;
      this.repeatTime = 0;
      this.nextRepeat = DAS;
      if (direction) this.game.move(direction);
    }
  }

  private suspend(): void {
    this.reset();
    if (this.game.status === 'playing') this.game.pause();
  }
}
