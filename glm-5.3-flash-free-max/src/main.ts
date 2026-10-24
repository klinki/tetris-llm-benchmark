/**
 * Bootstrap: wire the game, renderer and keyboard input into a rAF loop.
 */

import { Game } from "./game.js";
import { KeyboardInput } from "./input.js";
import { Renderer } from "./renderer.js";

const canvas = document.getElementById("tetris") as HTMLCanvasElement;

const game = new Game();
const renderer = new Renderer(canvas);
const input = new KeyboardInput(game);
input.attach(window);

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(now - last, 100); // clamp big jumps (e.g. tab switch)
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
