import { Game } from './core/game.js';
import { InputController } from './input.js';
import { Renderer } from './render.js';

function element<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el as T;
}

const game = new Game();
const renderer = new Renderer(game, {
  board: element<HTMLCanvasElement>('board'),
  hold: element<HTMLCanvasElement>('hold'),
  next: element<HTMLCanvasElement>('next'),
  score: element('score'),
  lines: element('lines'),
  level: element('level'),
  overlay: element('overlay'),
  label: element('label'),
});
const input = new InputController(game);
input.attach();

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100); // clamp long pauses (e.g. hidden tab)
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
