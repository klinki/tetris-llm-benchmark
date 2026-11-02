import { Game } from './game.js';
import { InputController } from './input.js';
import { Renderer } from './renderer.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const game = new Game();
const renderer = new Renderer(canvas);
const input = new InputController(game);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100); // clamp long tabs-away
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
