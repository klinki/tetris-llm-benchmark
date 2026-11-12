import { Game } from './core/game.js';
import { InputController } from './input/keyboard.js';
import { Renderer } from './render/renderer.js';

function main(): void {
  const canvas = document.getElementById('game');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element #game is missing');
  }

  const game = new Game();
  const renderer = new Renderer(canvas, game);
  const input = new InputController(game);
  input.attach();

  let last = performance.now();
  const frame = (now: number): void => {
    const delta = now - last;
    last = now;
    input.update(delta);
    game.update(delta);
    game.drainEvents();
    renderer.draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();
