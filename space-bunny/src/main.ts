/**
 * Browser entry point: wires the engine, the renderer and the input together
 * and runs the animation loop.
 */

import { Game } from './game.js';
import { InputController } from './input.js';
import { Renderer } from './renderer.js';

function main(): void {
  const canvas = document.getElementById('board');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('canvas#board is missing');
  }

  const game = new Game();
  const renderer = new Renderer(canvas);
  const input = new InputController(game);
  input.attach();

  window.addEventListener('resize', () => renderer.resize());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing') game.togglePause();
  });

  let lastTime = performance.now();
  const frame = (now: number): void => {
    // Clamp the delta so a background tab does not teleport the piece.
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;
    input.update(dt);
    game.update(dt);
    renderer.render(game);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();