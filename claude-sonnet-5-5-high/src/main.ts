import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

/** A long frame (e.g. after switching tabs) must not make pieces fall in one huge step. */
const MAX_FRAME_MS = 100;

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing <canvas id="game">');

const game = new Game();
const input = new Input(game, window);
const renderer = new Renderer(canvas);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, MAX_FRAME_MS);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
