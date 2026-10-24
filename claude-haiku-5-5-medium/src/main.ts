import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './render.js';

const game = new Game();
const input = new Input(game);
const renderer = new Renderer();

let last = performance.now();

function frame(now: number): void {
  // Clamp large gaps (e.g. a background tab) so pieces do not jump.
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
