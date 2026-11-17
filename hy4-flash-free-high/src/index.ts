import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import type { Action } from './types.js';

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

const game = new Game();
const renderer = new Renderer(
  byId<HTMLCanvasElement>('board'),
  byId<HTMLCanvasElement>('next'),
  byId<HTMLCanvasElement>('hold'),
  byId('score'),
  byId('level'),
  byId('lines'),
  byId('overlay'),
);

const input = new Input((action: Action) => {
  switch (action) {
    case 'left':
      game.moveHorizontal(-1);
      break;
    case 'right':
      game.moveHorizontal(1);
      break;
    case 'rotateCW':
      game.rotate(1);
      break;
    case 'rotateCCW':
      game.rotate(-1);
      break;
    case 'softDrop':
      game.softDrop();
      break;
    case 'hardDrop':
      game.hardDrop();
      break;
    case 'hold':
      game.hold();
      break;
    case 'restart':
      if (game.gameOver) game.reset();
      break;
  }
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100); // Clamp after tab switches.
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
