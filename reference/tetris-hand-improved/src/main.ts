/** Browser entry point: connects the engine and input to the page and runs the game loop. */
import { loadBestScore, saveBestScore } from "./best-score.js";
import { type Action, Controls, KEY_ACTIONS, isAction } from "./controls.js";
import { Game, NEXT_COUNT, type Status, describeLock } from "./engine.js";
import { drawBoard, drawPieces } from "./renderer.js";
import { Sound } from "./sound.js";

function byId<T extends HTMLElement>(id: string, type: abstract new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Missing ${type.name} #${id}`);
  return element;
}

const view = {
  board: byId("board", HTMLCanvasElement),
  hold: byId("hold", HTMLCanvasElement),
  next: byId("next", HTMLCanvasElement),
  score: byId("score", HTMLElement),
  best: byId("best", HTMLElement),
  level: byId("level", HTMLElement),
  lines: byId("lines", HTMLElement),
  time: byId("time", HTMLElement),
  overlay: byId("overlay", HTMLElement),
  overlayTitle: byId("overlay-title", HTMLElement),
  overlayText: byId("overlay-text", HTMLElement),
  play: byId("play", HTMLButtonElement),
  pause: byId("pause", HTMLButtonElement),
  sound: byId("sound", HTMLButtonElement),
  toast: byId("toast", HTMLElement),
  field: byId("field", HTMLElement),
};

const game = new Game();
const controls = new Controls(perform);
const sound = new Sound();
const numbers = new Intl.NumberFormat("en-US");
let best = loadBestScore();
let lastFrame = performance.now();
let shownStatus: Status | null = null;
let shownPreviews = "";
let shownLock = game.lastLock.id;
let toastUntil = 0;

/** Starts, resumes or restarts play. Held inputs are forgotten on every change. */
function play(): void {
  game.play();
  controls.reset();
  lastFrame = performance.now();
}

function pause(): void {
  game.pause();
  controls.reset();
}

function perform(action: Action): void {
  switch (action) {
    case "start":
      if (game.status !== "playing") play();
      return;
    case "restart": // R restarts only after game over, as documented.
      if (game.status === "over") play();
      return;
    case "pause":
      if (game.status === "paused") play();
      else pause();
      return;
  }
  if (game.status !== "playing") return;
  switch (action) {
    case "left":
      game.move(-1);
      break;
    case "right":
      game.move(1);
      break;
    case "soft":
      game.softDrop();
      break;
    case "cw":
    case "ccw":
      if (game.rotate(action === "cw" ? 1 : -1)) sound.beep(520, 0.04);
      break;
    case "drop":
      game.hardDrop();
      sound.beep(150, 0.08);
      break;
    case "hold":
      if (game.hold()) sound.beep(380);
      break;
  }
}

// Keyboard. Enter always activates a focused button; Space does too unless a game
// is in progress, where it must stay hard drop.
window.addEventListener("keydown", (event) => {
  const action = KEY_ACTIONS[event.code];
  if (!action || event.altKey || event.metaKey || (event.ctrlKey && event.code !== "ControlLeft")) return;
  const onButton = event.target instanceof HTMLButtonElement;
  if (onButton && (event.code === "Enter" || (event.code === "Space" && game.status !== "playing"))) return;
  event.preventDefault();
  if (!event.repeat) controls.press(event.code, action);
});
window.addEventListener("keyup", (event) => controls.release(event.code));

// Touch buttons: holding repeats like a key; pointer capture keeps the release.
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-action]")) {
  const action = button.dataset.action;
  if (!isAction(action)) throw new Error(`Unknown data-action "${action}"`);
  const source = (event: PointerEvent): string => `pointer-${event.pointerId}`;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    controls.press(source(event), action);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const)
    button.addEventListener(type, (event) => controls.release(source(event)));
}

// Mouse clicks must not leave focus on a button, where Space would activate it.
function onClick(button: HTMLButtonElement, handler: () => void): void {
  button.addEventListener("click", (event) => {
    handler();
    if (event.detail > 0) button.blur();
  });
}
onClick(view.play, play);
onClick(view.pause, () => perform("pause"));
onClick(view.sound, () => {
  sound.enabled = !sound.enabled;
  view.sound.setAttribute("aria-pressed", String(sound.enabled));
  sound.beep(660);
});

window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => document.hidden && pause());
window.addEventListener("pagehide", () => saveBestScore(best));
window.addEventListener("resize", () => (shownPreviews = ""));

function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const OVERLAY: Record<Exclude<Status, "playing">, [title: string, button: string]> = {
  ready: ["TetrisJS", "Play"],
  paused: ["Paused", "Resume"],
  over: ["Game over", "Play again"],
};

function renderStatus(status: Status): void {
  view.overlay.hidden = status === "playing";
  view.pause.disabled = status === "ready" || status === "over";
  setText(view.pause, status === "paused" ? "Resume" : "Pause");
  if (status === "playing") return;
  const [title, button] = OVERLAY[status];
  setText(view.overlayTitle, title);
  setText(view.play, button);
  if (status === "over") {
    saveBestScore(best);
    const record = game.score > 0 && game.score >= best ? " — a new best!" : "";
    setText(view.overlayText, `${numbers.format(game.score)} points · ${game.lines} lines · level ${game.level}${record}`);
  } else {
    setText(view.overlayText, status === "ready" ? "Clear lines by filling rows. Press Enter or tap Play to start." : "Press P, Esc, or Enter — or tap Resume.");
  }
}

function renderLock(now: number): void {
  const event = game.lastLock;
  if (event.id === shownLock) return;
  // Every lock (and every restart) replaces the previous message.
  shownLock = event.id;
  toastUntil = 0;
  view.field.classList.remove("flash");
  if (event.lines === 0 && !event.spin) return;
  setText(view.toast, `${describeLock(event)} +${numbers.format(event.points)}`);
  toastUntil = now + 1600;
  if (event.lines > 0) {
    void view.field.offsetWidth; // Restart the CSS animation.
    view.field.classList.add("flash");
    sound.beep(event.lines === 4 || event.spin ? 880 : 660, 0.14);
  }
}

function render(now: number): void {
  drawBoard(view.board, game);
  best = Math.max(best, game.score);
  setText(view.score, numbers.format(game.score));
  setText(view.best, numbers.format(best));
  setText(view.level, String(game.level));
  setText(view.lines, String(game.lines));
  setText(view.time, formatTime(game.elapsed));

  const previews = `${game.held}${game.canHold}${game.queue.join("")}`;
  if (previews !== shownPreviews) {
    shownPreviews = previews;
    const next = game.queue.slice(0, NEXT_COUNT);
    drawPieces(view.hold, [game.held], !game.canHold);
    drawPieces(view.next, next);
    view.hold.setAttribute("aria-label", game.held ? `Held: ${game.held}${game.canHold ? "" : " (used)"}` : "Hold is empty");
    view.next.setAttribute("aria-label", `Next: ${next.join(", ")}`);
  }

  renderLock(now);
  view.toast.classList.toggle("show", game.status === "playing" && now < toastUntil);
  if (game.status !== shownStatus) {
    shownStatus = game.status;
    renderStatus(game.status);
  }
}

function frame(now: number): void {
  const delta = Math.min(Math.max(0, now - lastFrame), 100);
  lastFrame = now;
  // Input repeats and the game clock advance together, in time order.
  if (game.status === "playing") controls.update(delta, (ms) => game.update(ms, controls.softDropHeld));
  render(now);
  requestAnimationFrame(frame);
}

render(lastFrame);
requestAnimationFrame(frame);
