/** Input mapping and auto-repeat, independent of the DOM so it can be tested. */
export const ACTIONS = ["left", "right", "cw", "ccw", "soft", "drop", "hold", "pause", "restart", "start"] as const;
export type Action = (typeof ACTIONS)[number];
export const isAction = (value: unknown): value is Action => (ACTIONS as readonly unknown[]).includes(value);

/** KeyboardEvent.code → action, as listed in the README. */
export const KEY_ACTIONS: Readonly<Record<string, Action>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "cw",
  KeyX: "cw",
  KeyZ: "ccw",
  ControlLeft: "ccw",
  ArrowDown: "soft",
  Space: "drop",
  KeyC: "hold",
  KeyR: "restart",
  KeyP: "pause",
  Escape: "pause",
  Enter: "start",
};

/** Delayed auto shift and auto repeat rate, in milliseconds. */
export const DAS = 167;
export const ARR = 33;

type Direction = "left" | "right";
const isDirection = (action: Action): action is Direction => action === "left" || action === "right";
/** Repeats due after a direction has been held for `time` ms. */
const repeatsAt = (time: number): number => (time < DAS ? 0 : 1 + Math.floor((time - DAS) / ARR));

/**
 * Tracks held inputs from any source (a key code or a touch pointer). The most
 * recently pressed direction wins; releasing it falls back to one still held.
 */
export class Controls {
  private readonly held = new Map<string, Action>();
  private direction: Direction | null = null;
  private heldFor = 0;

  constructor(private readonly dispatch: (action: Action) => void) {}

  get softDropHeld(): boolean {
    return [...this.held.values()].includes("soft");
  }

  press(source: string, action: Action): void {
    if (this.held.has(source)) return; // Ignore OS key repeat and double presses.
    this.held.set(source, action);
    if (isDirection(action)) this.aim(action);
    this.dispatch(action);
  }

  release(source: string): void {
    if (!this.held.delete(source)) return;
    const fallback = [...this.held.values()].filter(isDirection).at(-1) ?? null;
    if (fallback === this.direction) return;
    this.aim(fallback);
    if (fallback) this.dispatch(fallback);
  }

  /**
   * Advances time by `milliseconds`, emitting horizontal repeats at their exact
   * moments. `advance` receives the time between repeats (e.g. to run the game
   * clock), so a repeat never happens before the time that precedes it.
   */
  update(milliseconds: number, advance: (milliseconds: number) => void = () => {}): void {
    let remaining = milliseconds;
    while (remaining > 0) {
      const step = Math.min(remaining, this.untilNextRepeat());
      advance(step);
      remaining -= step;
      if (!this.direction) continue;
      const before = repeatsAt(this.heldFor);
      this.heldFor += step;
      for (let n = repeatsAt(this.heldFor) - before; n > 0; n--) this.dispatch(this.direction);
    }
  }

  /** Forget everything held, e.g. when the window loses focus or play pauses. */
  reset(): void {
    this.held.clear();
    this.aim(null);
  }

  private untilNextRepeat(): number {
    if (!this.direction) return Infinity;
    const next = DAS + repeatsAt(this.heldFor) * ARR;
    return next - this.heldFor;
  }

  private aim(direction: Direction | null): void {
    this.direction = direction;
    this.heldFor = 0;
  }
}
