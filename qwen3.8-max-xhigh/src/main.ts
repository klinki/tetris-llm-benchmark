// Entry point: wires game logic, renderer and input into the frame loop.

import { Game } from "./game.js";
import { Input } from "./input.js";
import { Renderer } from "./renderer.js";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("missing #game canvas");

const game = new Game();
const renderer = new Renderer(canvas);
const input = new Input(game);

input.attach();
game.start();

let last = performance.now();

function frame(now: number): void {
  // Clamp long frames (e.g. after a tab switch) so the simulation stays stable.
  const dt = Math.min(now - last, 100);
  last = now;
  input.update(now);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
