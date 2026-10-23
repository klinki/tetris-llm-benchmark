import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

/** Long frames (e.g. a backgrounded tab) are clamped so the game never jumps ahead. */
const MAX_FRAME_MS = 100;

function element<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const game = new Game();
const input = new Input(game, window);
const renderer = new Renderer({
  board: element<HTMLCanvasElement>('board'),
  hold: element<HTMLCanvasElement>('hold'),
  next: element<HTMLCanvasElement>('next'),
  score: element('score'),
  level: element('level'),
  lines: element('lines'),
  message: element('message'),
  overlay: element('overlay'),
});

window.addEventListener('blur', () => {
  if (game.status === 'playing') game.togglePause();
});

// One clock drives input repeat, gravity and lock delay.
let previous = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - previous, MAX_FRAME_MS);
  previous = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
