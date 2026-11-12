import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game();
const renderer = new Renderer(canvas, game);
const input = new Input(game);
input.attach(window);

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(100, now - last);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
