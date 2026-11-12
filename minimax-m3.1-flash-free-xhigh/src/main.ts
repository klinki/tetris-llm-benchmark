import { Game } from './core/game.js';
import type { ClearInfo } from './core/types.js';
import { Input } from './ui/input.js';
import { Renderer } from './ui/renderer.js';

/** Key used to remember the best score. */
const BEST_KEY = 'tetris.best';

/** Time a line clear message stays on screen, in milliseconds. */
const MESSAGE_MS = 1500;

/** Returns an element of the page. */
function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`Missing element with the id "${id}"`);
  }
  return found as T;
}

/** Reads the best score, the browser may not allow it. */
function readBest(): number {
  try {
    const value = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Stores the best score, the browser may not allow it. */
function writeBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // The score simply is not remembered.
  }
}

/** Builds the message shown after a line clear. */
function describeClear(clear: ClearInfo): string {
  const parts: string[] = [];
  if (clear.tspin) {
    parts.push(clear.tspin === 'full' ? 'T-SPIN' : 'T-SPIN MINI');
  }
  if (clear.lines === 4) {
    parts.push('TETRIS');
  } else if (clear.lines > 0) {
    parts.push(['', 'SINGLE', 'DOUBLE', 'TRIPLE'][clear.lines] ?? '');
  }
  if (clear.backToBack) {
    parts.push('BACK TO BACK');
  }
  if (clear.combo > 0) {
    parts.push(`COMBO ${clear.combo}`);
  }
  if (clear.perfectClear) {
    parts.push('PERFECT CLEAR');
  }
  return parts.join(' ');
}

const game = new Game();

const renderer = new Renderer(
  element<HTMLCanvasElement>('board'),
  element<HTMLCanvasElement>('hold'),
  element<HTMLCanvasElement>('next'),
  element('overlay'),
  element('overlay-title'),
  element('overlay-text'),
);

const scoreElement = element('score');
const bestElement = element('best');
const linesElement = element('lines');
const levelElement = element('level');
const messageElement = element('message');

const input = new Input(game, () => {
  game.reset();
});
input.attach();

let best = readBest();
let messageTimer = 0;
let shownClear: ClearInfo | null = null;

bestElement.textContent = String(best);

let last = performance.now();

function frame(now: number): void {
  // The frame time is clamped, a background tab must not freeze the game.
  const dt = Math.min(now - last, 100);
  last = now;

  input.update(dt);
  game.update(dt);
  renderer.draw(game);

  scoreElement.textContent = String(game.score);
  linesElement.textContent = String(game.lines);
  levelElement.textContent = String(game.level);

  if (game.isOver && game.score > best) {
    best = game.score;
    bestElement.textContent = String(best);
    writeBest(best);
  }

  updateMessage(dt);
  requestAnimationFrame(frame);
}

function updateMessage(dt: number): void {
  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) {
      messageElement.textContent = '';
    }
    return;
  }
  const clear = game.lastClear;
  if (!clear || clear === shownClear) {
    return;
  }
  shownClear = clear;
  const text = describeClear(clear);
  if (!text) {
    return;
  }
  messageElement.textContent = text;
  messageTimer = MESSAGE_MS;
}

requestAnimationFrame(frame);
