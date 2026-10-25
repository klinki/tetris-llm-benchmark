// Entry point: wires the game, renderer and input into the animation loop.
import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const game = new Game();
const input = new Input(game);
const renderer = new Renderer(
  element<HTMLCanvasElement>('board'),
  element<HTMLCanvasElement>('hold'),
  element<HTMLCanvasElement>('next'),
  {
    score: element('score'),
    level: element('level'),
    lines: element('lines'),
  },
  element('overlay')
);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.1); // clamp after tab switches
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
