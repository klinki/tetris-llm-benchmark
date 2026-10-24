import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { bindInput } from './input.js';

function el<T extends HTMLElement>(id: string): T {
  const n = document.getElementById(id);
  if (!n) throw new Error(`Missing #${id}`);
  return n as T;
}

const game = new Game();
const renderer = new Renderer(
  el<HTMLCanvasElement>('board'),
  el<HTMLCanvasElement>('hold'),
  el<HTMLCanvasElement>('next'),
);

const scoreEl = el('score');
const levelEl = el('level');
const linesEl = el('lines');

function updateStats(): void {
  scoreEl.textContent = String(game.score);
  levelEl.textContent = String(game.level);
  linesEl.textContent = String(game.lines);
}

bindInput(game, updateStats);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100);
  last = now;
  game.tick(dt);
  renderer.render(game);
  updateStats();
  requestAnimationFrame(frame);
}

updateStats();
renderer.render(game);
requestAnimationFrame(frame);
