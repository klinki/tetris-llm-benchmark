import { Game } from './core/game.js';
import { InputController } from './ui/input.js';
import { Renderer } from './ui/renderer.js';

function canvas(id: string): HTMLCanvasElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error(`The canvas "${id}" is missing in the page.`);
  }
  return element;
}

const game = new Game();
const renderer = new Renderer(canvas('board'), canvas('panel'));
new InputController(game).attach();

game.reset();

let previousTime = performance.now();
function frame(time: number): void {
  const delta = Math.min(time - previousTime, 100);
  previousTime = time;
  game.tick(delta);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
