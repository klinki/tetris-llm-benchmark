import { Game } from './game.js';
import { InputHandler } from './input.js';
import { Renderer } from './render.js';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('Missing <canvas id="game"> element');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D canvas is not supported by this browser');

const game = new Game();
const renderer = new Renderer(ctx);
const input = new InputHandler(game);

let previous = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - previous) / 1000, 0.1); // clamp dt to survive tab switches
  previous = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
