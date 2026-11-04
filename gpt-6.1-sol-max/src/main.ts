import { Game } from "./game.js";
import { Input } from "./input.js";
import type { Action } from "./input.js";
import { Renderer } from "./renderer.js";

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing interface element: ${id}`);
  return value as T;
}

const game = new Game();
const playArea = element("play-area");
const primaryButton = element<HTMLButtonElement>("primary-button");
const pauseButton = element<HTMLButtonElement>("pause-button");
const dialog = element<HTMLDialogElement>("help-dialog");
const announcer = element("announcer");
const score = element("score");
const bestLabel = element("best");
const level = element("level");
const lines = element("lines");
const time = element("time");
const pieces = element("pieces");
const progress = element("progress");
const progressFill = element("progress-fill");
const progressLabel = element("progress-label");
const overlay = element("overlay");
const overlayTitle = element("overlay-title");
const overlayDescription = element("overlay-description");
const overlayEyebrow = element("overlay-eyebrow");
const overlaySymbol = element("overlay-symbol");
const overlayHint = element("overlay-hint");
const statusDot = element("status-dot");
const gameStatus = element("game-status");
const holdPreview = element("hold-preview");
const holdPlaceholder = element("hold-placeholder");
const holdNote = element("hold-note");
const clearMessage = element("clear-message");
const clearTitle = element("clear-title");
const clearDetail = element("clear-detail");
const pauseLabel = element("pause-label");
const pauseIcon = document.getElementById("pause-icon")!;
const renderer = new Renderer(
  element<HTMLCanvasElement>("board"), element<HTMLCanvasElement>("hold-canvas"),
  [...document.querySelectorAll<HTMLCanvasElement>(".next-canvas")],
);
const BEST_KEY = "tetrisjs.best";
let best = 0;
try {
  const saved = Number(localStorage.getItem(BEST_KEY));
  if (Number.isSafeInteger(saved) && saved >= 0) best = saved;
} catch { /* Storage can be unavailable in private or restricted browser sessions. */ }
let bestAtStart = best;

function saveBest(): void {
  best = Math.max(best, game.score);
  try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* Playing never depends on storage. */ }
}

function start(): void {
  saveBest();
  bestAtStart = best;
  game.start();
  input.clear();
  renderer.reset();
  clearMessage.hidden = true;
  announcer.textContent = "Game started. Level 1.";
  playArea.focus({ preventScroll: true });
}

function handleAction(action: Action): void {
  switch (action) {
    case "left": game.move(-1); break;
    case "right": game.move(1); break;
    case "down": game.softDrop(); break;
    case "cw": game.rotate(1); break;
    case "ccw": game.rotate(-1); break;
    case "drop": game.hardDrop(); break;
    case "hold": game.hold(); break;
    case "pause":
      game.togglePause();
      input.clear();
      break;
    case "enter":
      if (game.status === "ready" || game.status === "over") start();
      else if (game.status === "paused") game.togglePause();
      break;
    case "restart":
      if (game.status === "over") start();
      break;
  }
}

const input = new Input(handleAction, () => game.status === "playing");
primaryButton.addEventListener("click", () => {
  if (game.status === "paused") game.togglePause();
  else start();
  playArea.focus({ preventScroll: true });
});
pauseButton.addEventListener("click", () => {
  handleAction("pause");
  playArea.focus({ preventScroll: true });
});
element("help-button").addEventListener("click", () => {
  if (game.status === "playing") game.togglePause();
  input.clear();
  dialog.showModal();
});
element("close-help").addEventListener("click", () => dialog.close());
element("done-help").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => playArea.focus({ preventScroll: true }));

function pauseWhenAway(): void {
  input.clear();
  if (game.status === "playing") game.togglePause();
  saveBest();
}
window.addEventListener("blur", pauseWhenAway);
window.addEventListener("pagehide", saveBest);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseWhenAway();
});

let lastRevision = -1;
let lastSecond = -1;
let clearUntil = 0;

function syncInterface(): void {
  const second = Math.floor(game.elapsed / 1000);
  if (second !== lastSecond) {
    lastSecond = second;
    time.textContent = `${String(Math.floor(second / 60)).padStart(2, "0")}:${String(second % 60).padStart(2, "0")}`;
  }
  if (lastRevision === game.revision) return;
  lastRevision = game.revision;
  score.textContent = String(game.score).padStart(6, "0");
  bestLabel.textContent = Math.max(best, game.score).toLocaleString();
  level.textContent = String(game.level).padStart(2, "0");
  lines.textContent = String(game.lines).padStart(3, "0");
  pieces.textContent = String(game.pieces);
  const progressLines = game.lines % 10;
  progressLabel.textContent = `${progressLines} / 10 to next level`;
  progressFill.style.width = `${progressLines * 10}%`;
  progress.setAttribute("aria-valuenow", String(progressLines));
  holdPlaceholder.hidden = game.held !== null;
  holdPreview.classList.toggle("is-used", !game.canHold);
  holdNote.textContent = !game.canHold ? "Ready after this piece locks." : game.held ? "For when you need it." : "A little something for later.";
  pauseButton.disabled = game.status === "ready" || game.status === "over";
  const paused = game.status === "paused";
  pauseButton.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
  pauseButton.setAttribute("aria-pressed", String(paused));
  pauseLabel.textContent = paused ? "Resume" : "Pause";
  pauseIcon.innerHTML = paused
    ? '<path d="M4 2.5 13 8l-9 5.5Z" fill="currentColor" />'
    : '<path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="2.5" />';
  statusDot.classList.toggle("is-playing", game.status === "playing");
  statusDot.classList.toggle("is-over", game.status === "over");
  gameStatus.textContent = { ready: "READY WHEN YOU ARE", playing: "FIND YOUR RHYTHM", paused: "TAKE YOUR TIME", over: "THERE'S ALWAYS ONE MORE GAME" }[game.status];
  overlay.hidden = game.status === "playing";
  primaryButton.disabled = overlay.hidden;
  if (!overlay.hidden) {
    overlaySymbol.hidden = game.status !== "ready";
    if (paused) {
      overlayEyebrow.textContent = "NO NEED TO RUSH";
      overlayTitle.innerHTML = "A little<br />breather.";
      overlayDescription.textContent = "Your next move can wait.";
      primaryButton.firstChild!.textContent = "Keep playing ";
      overlayHint.innerHTML = 'or press <kbd>P</kbd>';
    } else if (game.status === "over") {
      overlayEyebrow.textContent = game.score > bestAtStart ? "A NEW PERSONAL BEST" : "NICELY PLAYED";
      overlayTitle.innerHTML = "Room for<br />one more?";
      overlayDescription.textContent = `${game.score.toLocaleString()} points · ${game.lines} lines`;
      primaryButton.firstChild!.textContent = "Play again ";
      overlayHint.innerHTML = 'or press <kbd>R</kbd>';
    } else {
      overlayEyebrow.textContent = "A FAMILIAR KIND OF FUN";
      overlayTitle.innerHTML = "Ready to<br />find your flow?";
      overlayDescription.textContent = "A fresh board. A world of possibilities.";
      primaryButton.firstChild!.textContent = "Let's play ";
      overlayHint.innerHTML = 'or press <kbd>Enter</kbd>';
    }
  }
}

let previous = performance.now();
function frame(now: number): void {
  const delta = Math.min(100, Math.max(0, now - previous));
  previous = now;
  input.update(delta);
  game.update(delta, input.softDropping);
  const events = game.drainEvents();
  renderer.notify(events, now);
  const announcements: string[] = [];
  let focusGameOver = false;
  for (const event of events) {
    if (event.type === "clear") {
      clearMessage.hidden = false;
      clearUntil = now + 3200;
      clearTitle.textContent = event.result.label;
      const extras = [
        `+${event.result.points.toLocaleString()}`,
        event.result.backToBackBonus ? "BACK-TO-BACK" : "",
        event.result.combo > 0 ? `${event.result.combo} COMBO` : "",
      ].filter(Boolean);
      clearDetail.textContent = extras.join(" · ");
      announcements.push(`${event.result.label}. ${event.result.points} points.`);
    }
    if (event.type === "level") announcements.push(`Level ${event.level}.`);
    if (event.type === "over") {
      saveBest();
      input.clear();
      announcements.push(`Game over. ${game.score} points. Press R to play again.`);
      focusGameOver = true;
    }
  }
  if (announcements.length) announcer.textContent = announcements.join(" ");
  if (now > clearUntil) clearMessage.hidden = true;
  syncInterface();
  if (focusGameOver) primaryButton.focus({ preventScroll: true });
  renderer.render(game, now);
  requestAnimationFrame(frame);
}
syncInterface();
renderer.render(game, previous);
requestAnimationFrame(frame);
