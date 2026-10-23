import { Game } from './game/game.js';
import { Input } from './input.js';
import { Renderer } from './render.js';

/** Caps the time step so a stalled tab does not make pieces fall in one jump. */
const MAX_FRAME_SECONDS = 0.25;

const game = new Game();
const input = new Input(game);
const renderer = new Renderer({
  board: byId('board'),
  hold: byId('hold'),
  next: byId('next'),
  score: byId('score'),
  level: byId('level'),
  lines: byId('lines'),
  event: byId('event'),
  overlay: byId('overlay'),
});

window.addEventListener('keydown', (event) => input.keyDown(event));
window.addEventListener('keyup', (event) => input.keyUp(event));
window.addEventListener('blur', () => input.reset());

let previous = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - previous) / 1000, MAX_FRAME_SECONDS);
  previous = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}
