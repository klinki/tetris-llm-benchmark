export type Action = 'left' | 'right' | 'cw' | 'ccw' | 'soft' | 'hard' | 'hold' | 'pause' | 'start' | 'restart';
const KEYS: Record<string, Action> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'cw', KeyX: 'cw', KeyZ: 'ccw',
  ControlLeft: 'ccw', ArrowDown: 'soft', Space: 'hard', KeyC: 'hold',
  KeyP: 'pause', Escape: 'pause', Enter: 'start', KeyR: 'restart',
};

/** Own key repeat makes movement consistent across operating systems. */
export class Input {
  private held = new Map<string, Action>();
  private horizontal: Action | null = null;
  private horizontalAge = 0;
  private horizontalRepeat = 0;
  private softTime = 0;
  constructor(private readonly dispatch: (action: Action) => void, private readonly blocked: () => boolean) {
    window.addEventListener('keydown', event => {
      const action = KEYS[event.code];
      if (!action || this.blocked() || event.metaKey || event.altKey || event.ctrlKey && event.code !== 'ControlLeft') return;
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (event.target instanceof HTMLElement && event.target.closest('button,a') && (event.code === 'Enter' || event.code === 'Space')) return;
      event.preventDefault();
      if (!event.repeat) this.press(event.code, action);
    });
    window.addEventListener('keyup', event => this.release(event.code));
    window.addEventListener('blur', () => this.reset());
    document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || this.blocked()) return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.press(`pointer-${event.pointerId}`, button.dataset.action as Action);
      });
      const release = (event: PointerEvent): void => this.release(`pointer-${event.pointerId}`);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      // Keyboard and assistive-technology activation doesn't generate pointerdown.
      button.addEventListener('click', event => { if (event.detail === 0 && !this.blocked()) this.dispatch(button.dataset.action as Action); });
    });
  }
  private press(key: string, action: Action): void {
    if (this.held.has(key)) return;
    this.held.set(key, action);
    if (action === 'left' || action === 'right') {
      this.horizontal = action;
      this.horizontalAge = this.horizontalRepeat = 0;
    }
    if (action === 'soft') this.softTime = 0;
    this.dispatch(action);
  }
  private release(key: string): void {
    if (!this.held.delete(key)) return;
    const directions = [...this.held.values()].filter(action => action === 'left' || action === 'right');
    const next = directions.at(-1) ?? null;
    if (next !== this.horizontal) {
      this.horizontal = next;
      this.horizontalAge = this.horizontalRepeat = 0;
      if (next) this.dispatch(next);
    }
  }
  update(delta: number): void {
    if (this.blocked()) { this.reset(); return; }
    if (this.horizontal) {
      const previousAge = this.horizontalAge;
      this.horizontalAge += delta;
      if (this.horizontalAge >= 140) {
        this.horizontalRepeat += Math.max(0, this.horizontalAge - Math.max(140, previousAge));
        if (previousAge < 140) this.dispatch(this.horizontal);
        while (this.horizontalRepeat >= 35) { this.dispatch(this.horizontal); this.horizontalRepeat -= 35; }
      }
    }
    if ([...this.held.values()].includes('soft')) {
      this.softTime += delta;
      while (this.softTime >= 35) { this.dispatch('soft'); this.softTime -= 35; }
    }
  }
  reset(): void {
    this.held.clear();
    this.horizontal = null;
    this.horizontalAge = this.horizontalRepeat = this.softTime = 0;
  }
}

// Exported for focused control mapping checks without a browser.
export { KEYS };
