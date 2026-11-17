import { Game } from './game';
import { Renderer } from './renderer';
import { InputHandler } from './input';

const FRAME_MS = 1000 / 60;

function getCanvas(id: string): HTMLCanvasElement {
  const el = document.getElementById(id);
  if (!el || !(el instanceof HTMLCanvasElement)) {
    throw new Error(`Missing canvas #${id}`);
  }
  return el;
}

function start(): void {
  const game = new Game();
  const renderer = new Renderer(
    getCanvas('board'),
    getCanvas('hold'),
    getCanvas('next')
  );
  const input = new InputHandler(game);

  let last = performance.now();
  let accumulator = 0;

  function frame(now: number): void {
    accumulator += now - last;
    last = now;

    // Fixed-timestep loop: process one 60Hz tick per step, with a cap to
    // avoid the "spiral of death" if the tab was backgrounded.
    let steps = 0;
    while (accumulator >= FRAME_MS && steps < 5) {
      game.tick();
      input.tick();
      accumulator -= FRAME_MS;
      steps++;
    }
    if (steps === 5) accumulator = 0;

    renderer.render(game.getRenderState());
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
