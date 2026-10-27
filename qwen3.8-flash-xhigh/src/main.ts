import { Game } from './core/game.js';
import { InputController } from './input.js';
import { Renderer } from './render.js';

const canvas = document.getElementById('board') as HTMLCanvasElement | null;
if (!canvas) throw new Error('missing <canvas id="board">');

const game = new Game();
const renderer = new Renderer(canvas, game);
const input = new InputController(window, game);

let last = performance.now();
function frame(now: number): void {
  const dt = now - last;
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
