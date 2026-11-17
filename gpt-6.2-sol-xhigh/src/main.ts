import { Game } from "./game.js";
import { View } from "./view.js";
import type { Mode } from "./view.js";

type Action = "left" | "right" | "cw" | "ccw" | "soft" | "hard" | "hold";
type Repeatable = "left" | "right" | "soft";
type Horizontal = "left" | "right";

const keys = new Map<string, Action>([
  ["ArrowLeft", "left"], ["ArrowRight", "right"], ["ArrowDown", "soft"],
  ["ArrowUp", "cw"], ["x", "cw"], ["z", "ccw"], ["ControlLeft", "ccw"],
  [" ", "hard"], ["c", "hold"],
]);

const REPEAT_DELAY = 155;
const REPEAT_INTERVAL = 38;

const view = new View();
const held = new Map<string, Repeatable>();
let game = new Game();
let mode: Mode = "ready";
let repeatAt = 0;
let lastFrame = performance.now();

function setMode(next: Mode): void {
  mode = next;
  held.clear();
  lastFrame = performance.now();
  view.setMode(next);
  if (!document.hidden && next !== "ready") {
    (next === "playing" ? view.board : view.activate).focus({ preventScroll: true });
  }
}

function render(): void {
  if (game.gameOver && mode === "playing") setMode("over");
  view.render(game);
}

function activate(): void {
  if (mode === "playing") return;
  if (mode === "over") game = new Game();
  setMode("playing");
  render();
}

function togglePause(): void {
  if (mode === "playing") setMode("paused");
  else if (mode === "paused") activate();
}

function perform(action: Action): boolean {
  switch (action) {
    case "left": return game.move(-1);
    case "right": return game.move(1);
    case "cw": return game.rotate(1);
    case "ccw": return game.rotate(-1);
    case "soft": return game.softDrop();
    case "hard": return game.hardDrop();
    case "hold": return game.hold();
  }
}

function horizontal(): Horizontal | undefined {
  let direction: Horizontal | undefined;
  for (const action of held.values()) {
    if (action === "left" || action === "right") direction = action;
  }
  return direction;
}

function press(action: Action, source: string): void {
  if (mode === "ready") activate();
  if (mode !== "playing") return;

  if (action === "left" || action === "right") {
    held.set(source, action);
    repeatAt = performance.now() + REPEAT_DELAY;
  } else if (action === "soft") {
    held.set(source, action);
  }

  if (perform(action)) render();
}

function release(source: string): void {
  const previous = horizontal();
  if (!held.delete(source)) return;
  const direction = horizontal();
  if (direction && direction !== previous) {
    repeatAt = performance.now() + REPEAT_DELAY;
    if (perform(direction)) render();
  }
}

function frame(now: number): void {
  const elapsed = Math.max(0, Math.min(now - lastFrame, 100));
  lastFrame = now;

  if (mode === "playing") {
    const direction = horizontal();
    const repeating = direction !== undefined && now >= repeatAt;
    const moved = repeating && perform(direction);
    if (repeating) repeatAt = now + REPEAT_INTERVAL;
    const dropped = game.tick(elapsed, [...held.values()].includes("soft"));
    if (moved || dropped) render();
  }

  requestAnimationFrame(frame);
}

view.activate.addEventListener("click", activate);
view.pause.addEventListener("click", togglePause);

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.altKey) return;
  if (event.ctrlKey && event.code !== "ControlLeft") return;
  if (event.target instanceof HTMLButtonElement && (event.key === " " || event.key === "Enter")) return;

  const key = event.code === "ControlLeft" ? event.code :
    event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const action = keys.get(key);

  if (event.key === "Escape") {
    event.preventDefault();
    if (!event.repeat) togglePause();
  } else if ((key === "r" && mode === "over") || (key === "Enter" && mode !== "playing")) {
    event.preventDefault();
    if (!event.repeat) activate();
  } else if (action) {
    event.preventDefault();
    if (!event.repeat) press(action, event.code);
  }
});

window.addEventListener("keyup", (event) => release(event.code));
window.addEventListener("blur", () => held.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && mode === "playing") setMode("paused");
});

for (const button of document.querySelectorAll<HTMLButtonElement>(".touch-controls button")) {
  const action = button.dataset.action as Action;
  const source = (event: PointerEvent) => `pointer-${event.pointerId}`;
  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    press(action, source(event));
  });
  button.addEventListener("lostpointercapture", (event) => release(source(event)));
  button.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    press(action, "button");
    release("button");
  });
}

view.setMode(mode);
render();
requestAnimationFrame(frame);
