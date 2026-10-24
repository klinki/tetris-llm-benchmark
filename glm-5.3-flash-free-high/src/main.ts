import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';

function canvasCtx(id: string): CanvasRenderingContext2D {
  const el = document.getElementById(id) as HTMLCanvasElement | null;
  if (!el) throw new Error(`missing canvas #${id}`);
  const ctx = el.getContext('2d');
  if (!ctx) throw new Error(`missing 2d context for #${id}`);
  return ctx;
}

function hudElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el;
}

const game = new Game();
const renderer = new Renderer(canvasCtx('board'), canvasCtx('hold'), canvasCtx('next'), {
  score: hudElement('score'),
  lines: hudElement('lines'),
  level: hudElement('level'),
  overlay: hudElement('overlay'),
});
const input = new Input(game); // wired to the game, advances DAS/ARR in the frame loop

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100); // clamp pauses so the piece never teleports
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
