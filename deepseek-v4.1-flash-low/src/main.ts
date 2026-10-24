import { Game } from './game.js';
import { InputController } from './input.js';
import { Renderer } from './renderer.js';

function bootstrap(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');

  if (!canvas) {
    throw new Error('Missing #game canvas');
  }

  const game = new Game();
  const renderer = new Renderer(canvas);
  const input = new InputController(game);
  let lastTime = performance.now();

  const frame = (now: number): void => {
    const dt = Math.min(100, Math.max(0, now - lastTime));
    lastTime = now;

    input.update(dt);
    game.update(dt);
    renderer.draw(game);

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

  window.addEventListener('resize', () => renderer.resize());
}

bootstrap();
