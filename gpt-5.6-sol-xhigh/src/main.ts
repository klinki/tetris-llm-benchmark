import { TetrisGame } from "./game.js";
import { InputController } from "./input.js";
import { GameRenderer } from "./renderer.js";

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing #${id}`);
  return value as T;
}

function readBest(): number {
  try {
    return Number.parseInt(localStorage.getItem("tetrisjs-best") ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

let game = new TetrisGame();
let best = readBest();
const renderer = new GameRenderer({
  gameCanvas: element<HTMLCanvasElement>("game-canvas"),
  holdCanvas: element<HTMLCanvasElement>("hold-canvas"),
  nextCanvas: element<HTMLCanvasElement>("next-canvas"),
  score: element("score-value"),
  lines: element("lines-value"),
  level: element("status-level"),
  best: element("best-value"),
  status: element("status-text"),
  holdNote: element("hold-note"),
  streakLabel: element("streak-label"),
  streakValue: element("streak-value"),
  eventToast: element("event-toast")
}, best);

function restart(): void {
  game.reset();
}

const input = new InputController(game, restart);
const pauseButton = element<HTMLButtonElement>("pause-button");
pauseButton.addEventListener("click", () => {
  game.togglePause();
});

const dialog = element<HTMLDialogElement>("help-dialog");
let resumeAfterHelp = false;
element<HTMLButtonElement>("help-button").addEventListener("click", () => {
  resumeAfterHelp = !game.gameOver && !game.paused;
  if (resumeAfterHelp) game.togglePause();
  dialog.showModal();
});
dialog.addEventListener("close", () => {
  if (resumeAfterHelp && !game.gameOver && game.paused) game.togglePause();
  resumeAfterHelp = false;
});

let previousTime = performance.now();
function frame(now: number): void {
  const elapsed = Math.min(100, now - previousTime);
  previousTime = now;
  input.update(elapsed);
  game.tick(elapsed);
  const snapshot = game.snapshot();
  renderer.render(snapshot);
  pauseButton.textContent = snapshot.paused ? "▶" : "Ⅱ";
  pauseButton.setAttribute("aria-label", snapshot.paused ? "Resume game" : "Pause game");

  if (snapshot.score > best) {
    best = snapshot.score;
    try { localStorage.setItem("tetrisjs-best", String(best)); } catch { /* storage can be disabled */ }
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
