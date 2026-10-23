import { Game } from './game.js';
import { Controls } from './input.js';
import { Renderer } from './render.js';

/** Longest step the game will simulate, so a stalled tab does not drop a whole stack at once. */
const MAX_FRAME_SECONDS = 0.1;

const game = new Game();
const controls = new Controls(game);
controls.attach(window);

const renderer = new Renderer(
  byId<HTMLCanvasElement>('board'),
  byId<HTMLCanvasElement>('hold'),
  byId<HTMLCanvasElement>('next'),
);
const scoreEl = byId('score');
const levelEl = byId('level');
const linesEl = byId('lines');
const overlay = byId('overlay');

let previous = performance.now();

function frame(now: number): void {
  const dt = Math.min((now - previous) / 1000, MAX_FRAME_SECONDS);
  previous = now;

  controls.update(dt);
  game.update(dt);
  renderer.draw(game);
  updateHud();

  requestAnimationFrame(frame);
}

function updateHud(): void {
  setText(scoreEl, String(game.score));
  setText(levelEl, String(game.level));
  setText(linesEl, String(game.lines));
  overlay.hidden = game.status !== 'over';
}

function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

requestAnimationFrame(frame);
