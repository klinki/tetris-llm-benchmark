import { Game } from './game.js';
import { InputController } from './input.js';
import { Renderer, type GameUI } from './render.js';

function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element #${id}`);
  return found as T;
}

const ui: GameUI = {
  board: el<HTMLCanvasElement>('board'),
  hold: el<HTMLCanvasElement>('hold'),
  next: el<HTMLCanvasElement>('next'),
  score: el('score'),
  level: el('level'),
  lines: el('lines'),
  message: el('message'),
  overlay: el('overlay'),
  overlayTitle: el('overlay-title'),
  overlayText: el('overlay-text'),
};

const game = new Game();
const renderer = new Renderer(ui);
const input = new InputController(game);

ui.overlay.addEventListener('click', () => {
  if (game.gameOver) game.restart();
  else if (game.paused) game.togglePause();
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
