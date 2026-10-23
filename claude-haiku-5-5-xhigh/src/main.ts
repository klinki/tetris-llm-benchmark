import { Game } from './game.js';
import { Controller } from './input.js';
import { Renderer } from './render.js';

/** Caps the time step so a background tab does not make pieces jump on return. */
const MAX_FRAME_MS = 100;

const game = new Game();
const controller = new Controller(game);
const renderer = new Renderer(document);

let previous = performance.now();

function frame(now: number): void {
  const dt = Math.min(now - previous, MAX_FRAME_MS);
  previous = now;
  controller.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
