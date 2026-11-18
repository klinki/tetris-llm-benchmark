import { Game, HIDDEN } from "./game.js";
import type { Placement } from "./game.js";
import { cells } from "./pieces.js";
import { drawBoard, drawPreview } from "./render.js";
import type { Screen } from "./render.js";
import { Sound } from "./sound.js";

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function stored(key: string): string | null {
  try { return localStorage.getItem("tetris." + key); }
  catch { return null; }
}

function save(key: string, value: string): void {
  try { localStorage.setItem("tetris." + key, value); }
  catch { /* Storage is optional in private and embedded sessions. */ }
}

const board = element<HTMLCanvasElement>("board");
const field = element("playfield");
const held = element<HTMLCanvasElement>("held");
const holdButton = element<HTMLButtonElement>("hold-button");
const queue = [...document.querySelectorAll<HTMLCanvasElement>(".queue canvas")];
const startButton = element<HTMLButtonElement>("start-button");
const pauseButton = element<HTMLButtonElement>("pause-button");
const soundButton = element<HTMLButtonElement>("sound-button");
const progress = element("progress");
const notice = element("notice");
const sound = new Sound();
sound.enabled = stored("sound") !== "off";
const savedBest = Number(stored("best"));
let best = Number.isSafeInteger(savedBest) && savedBest > 0 ? savedBest : 0;

let game = new Game();
let screen: Screen = "ready";
let lastPlacement: Placement | null = null;
let flashRows: number[] = [];
let flashTimer = 0;
let noticeTimer = 0;
let frameId = 0;
let previousTime = 0;
const pressed = new Set<string>();
let horizontal: -1 | 0 | 1 = 0;
let repeatAt = 0;

const segments = Array.from({ length: 10 }, () => document.createElement("i"));
progress.append(...segments);
const digits = (value: number, width: number) => String(value).padStart(width, "0");

function setText(id: string, text: string): void {
  const node = element(id);
  if (node.textContent !== text) node.textContent = text;
}

function updateBest(): void {
  if (game.score <= best) return;
  best = game.score;
  save("best", String(best));
}

function placementMessage(p: Placement): string {
  if (p.perfect) return "Perfect clear";
  const clear = ["", "Single", "Double", "Triple", "Tetris"][p.rows.length];
  const spin = { none: "", mini: "Mini T-spin", full: "T-spin" }[p.spin];
  return [p.backToBack ? "Back-to-back" : "", spin, clear].filter(Boolean).join(" ");
}

function onPlacement(p: Placement): void {
  updateBest();
  if (!p.rows.length && p.spin === "none") {
    sound.play(145, 72, .085);
    return;
  }
  sound.play(330, p.rows.length === 4 ? 1320 : 750, .18);
  const message = placementMessage(p);
  notice.textContent = message;
  notice.hidden = false;
  setText("announcement", message + ". " + p.points + " points.");
  clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 850);
  flashRows = p.rows;
  clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => {
    flashRows = [];
    drawBoard(board, game, screen, flashRows);
  }, 100);
}

function render(): void {
  if (game.lastPlacement && game.lastPlacement !== lastPlacement) {
    lastPlacement = game.lastPlacement;
    onPlacement(lastPlacement);
  }
  if (game.over && screen === "playing") {
    updateBest();
    setScreen("over");
    sound.play(220, 55, .35);
    return;
  }
  drawBoard(board, game, screen, flashRows);
  if (screen === "playing") {
    const { kind, x, y, rotation } = game.active;
    const shape = cells(kind, rotation);
    const column = x + Math.min(...shape.map(([dx]) => dx)) + 1;
    const row = Math.max(1, y - HIDDEN + Math.min(...shape.map(([, dy]) => dy)) + 1);
    const facing = ["north", "east", "south", "west"][rotation];
    board.setAttribute("aria-label", `${kind} piece facing ${facing}, column ${column}, row ${row}.`);
  } else {
    board.setAttribute("aria-label", "Tetris playfield, " + screen);
  }
  setText("score", digits(game.score, 6));
  setText("best", digits(best, 6));
  setText("level", digits(game.level, 2));
  setText("lines", digits(game.lines, 3));
  segments.forEach((segment, i) => segment.classList.toggle("filled", i < game.lines % 10));
  progress.setAttribute("aria-valuenow", String(game.lines % 10));
  queue.forEach((canvas, i) => drawPreview(canvas, game.next[i], i === 0 ? 20 : 15));
  held.hidden = game.held === null;
  element("empty-hold").hidden = game.held !== null;
  if (game.held) drawPreview(held, game.held, 20);
  holdButton.disabled = (screen !== "playing" && screen !== "ready") || !game.canHold;
  holdButton.setAttribute("aria-label", "Hold piece. " + (game.held ? game.held + " in hold." : "Slot empty."));
}

function setScreen(next: Screen): void {
  screen = next;
  document.body.dataset.screen = next;
  pressed.clear();
  horizontal = 0;
  cancelAnimationFrame(frameId);
  element("prompt").hidden = next === "playing";
  notice.hidden = true;
  pauseButton.disabled = next === "ready" || next === "over";
  setText("pause-label", next === "paused" ? "Resume" : "Pause");
  if (next === "playing") {
    field.focus({ preventScroll: true });
    previousTime = performance.now();
    frameId = requestAnimationFrame(frame);
    setText("announcement", "Game in progress.");
  } else {
    const prompts = {
      ready: ["Ready?", "Fill a row to clear it.", "Start game", "Enter"],
      paused: ["Paused", `Level ${game.level} · ${game.lines} lines`, "Resume", "P"],
      over: ["Game over", game.score.toLocaleString() + " points", "Play again", "R"],
    };
    const [title, detail, action, key] = prompts[next];
    setText("prompt-title", title);
    setText("prompt-description", detail);
    setText("start-label", action);
    setText("start-key", key);
    setText("announcement", `${title} ${detail} Press ${key} to ${action.toLowerCase()}.`);
  }
  render();
}

function start(): void {
  if (screen === "over") {
    game = new Game();
    lastPlacement = null;
    flashRows = [];
  }
  sound.unlock();
  setScreen("playing");
  sound.play(330, 550, .12);
}

function pause(): void {
  if (screen === "playing") setScreen("paused");
  else if (screen === "paused") start();
}

function updateSoundButton(): void {
  soundButton.setAttribute("aria-pressed", String(sound.enabled));
  setText("sound-label", sound.enabled ? "Sound on" : "Sound off");
  element("sound-icon").className = "icon " + (sound.enabled ? "sound" : "muted");
}

function press(code: string): void {
  if (pressed.has(code)) return;
  if (code === "KeyP" || code === "Escape") { pause(); return; }
  if (code === "Enter") { if (screen !== "playing") start(); return; }
  if (code === "KeyR") { if (screen === "over") start(); return; }
  if (screen === "ready") start();
  if (screen !== "playing") return;
  pressed.add(code);
  switch (code) {
    case "ArrowLeft":
    case "ArrowRight":
      horizontal = code === "ArrowLeft" ? -1 : 1;
      game.move(horizontal);
      repeatAt = performance.now() + 155;
      break;
    case "ArrowDown": game.softDrop(); break;
    case "Space": game.hardDrop(); break;
    case "ArrowUp":
    case "KeyX": if (game.rotate(1)) sound.play(315, 410, .045); break;
    case "KeyZ":
    case "ControlLeft": if (game.rotate(-1)) sound.play(410, 315, .045); break;
    case "KeyC": if (game.hold()) sound.play(240, 430, .08); break;
  }
  render();
}

function release(code: string): void {
  pressed.delete(code);
  if (code === "ArrowLeft" || code === "ArrowRight") {
    horizontal = pressed.has("ArrowLeft") ? -1 : pressed.has("ArrowRight") ? 1 : 0;
  }
}

function frame(time: number): void {
  if (screen !== "playing") return;
  const elapsed = Math.min(100, Math.max(0, time - previousTime));
  previousTime = time;
  const before = game.active;
  const { x, y } = before;
  if (horizontal && time >= repeatAt) {
    game.move(horizontal);
    repeatAt = time + 40;
  }
  game.advance(elapsed, pressed.has("ArrowDown"));
  if (before !== game.active || x !== game.active.x || y !== game.active.y || game.over) render();
  if (screen === "playing") frameId = requestAnimationFrame(frame);
}

const bindings = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX",
  "KeyZ", "ControlLeft", "KeyC", "KeyP", "KeyR", "Enter", "Escape"]);
window.addEventListener("keydown", event => {
  if (!bindings.has(event.code) || event.metaKey || event.altKey || (event.ctrlKey && event.code !== "ControlLeft")) return;
  if (event.target instanceof HTMLButtonElement && (event.code === "Space" || event.code === "Enter")) return;
  event.preventDefault();
  if (!event.repeat) press(event.code);
});
window.addEventListener("keyup", event => release(event.code));
window.addEventListener("blur", () => { if (screen === "playing") setScreen("paused"); });
document.addEventListener("visibilitychange", () => { if (document.hidden && screen === "playing") setScreen("paused"); });
window.addEventListener("pagehide", updateBest);
startButton.addEventListener("click", start);
pauseButton.addEventListener("click", pause);
holdButton.addEventListener("click", () => {
  press("KeyC");
  release("KeyC");
  field.focus({ preventScroll: true });
});
soundButton.addEventListener("click", () => {
  sound.enabled = !sound.enabled;
  save("sound", sound.enabled ? "on" : "off");
  updateSoundButton();
  sound.unlock();
  sound.play(440, 550);
  if (screen === "playing") field.focus({ preventScroll: true });
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-code]")) {
  const code = button.dataset.code!;
  button.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    press(code);
  });
  button.addEventListener("lostpointercapture", () => release(code));
  // Keyboard and assistive-technology activation does not produce a pointer event.
  button.addEventListener("click", event => {
    if (event.detail === 0) { press(code); release(code); }
  });
}

updateSoundButton();
setScreen("ready");
