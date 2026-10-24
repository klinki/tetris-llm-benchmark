/** Browser entry point: wires the game, renderer and keyboard together. */

import { Game } from "./core/game.js";
import { KeyboardController } from "./input/keyboard.js";
import { Renderer } from "./render/renderer.js";

function requireElement<T extends HTMLElement>(
  id: string,
  constructor: new () => T,
): T {
  const element = document.getElementById(id);
  if (!(element instanceof constructor)) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

const game = new Game();

const renderer = new Renderer(
  requireElement("board", HTMLCanvasElement),
  requireElement("next", HTMLCanvasElement),
  requireElement("hold", HTMLCanvasElement),
  {
    score: requireElement("score", HTMLElement),
    level: requireElement("level", HTMLElement),
    lines: requireElement("lines", HTMLElement),
    combo: requireElement("combo", HTMLElement),
    overlay: requireElement("overlay", HTMLElement),
    finalScore: requireElement("final-score", HTMLElement),
  },
);

const keyboard = new KeyboardController(game);
keyboard.attach(window);

let lastTime = performance.now();

function frame(now: number): void {
  // Clamp long pauses (for example a background tab) to a single short tick.
  const dt = Math.min(100, Math.max(0, now - lastTime));
  lastTime = now;

  keyboard.update(dt);
  game.update(dt);
  renderer.render(game);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
