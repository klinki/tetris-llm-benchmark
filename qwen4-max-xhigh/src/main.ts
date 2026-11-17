// Entry point: wires game logic, input and rendering into a frame loop.

import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

const game = new Game();
const input = new Input(game);
const renderer = new Renderer(
  document.getElementById('board') as HTMLCanvasElement,
  document.getElementById('hold') as HTMLCanvasElement,
  document.getElementById('next') as HTMLCanvasElement,
  document.getElementById('score')!,
  document.getElementById('level')!,
  document.getElementById('lines')!,
);

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(now - last, 100); // clamp after tab switches
  last = now;
  input.update(dt);
  game.update(dt, input.softHeld);
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
