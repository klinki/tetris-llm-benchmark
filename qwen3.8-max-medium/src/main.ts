import { Game } from "./game.js";
import { attachInput } from "./input.js";
import { Renderer } from "./render.js";

function element<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const game = new Game();
const renderer = new Renderer(
  element<HTMLCanvasElement>("board"),
  element<HTMLCanvasElement>("hold"),
  element<HTMLCanvasElement>("next"),
  element("score"),
  element("level"),
  element("lines"),
  element("message"),
);
attachInput(game);

let last = performance.now();

function frame(now: number): void {
  // Clamp the step so tab-switch gaps do not fast-forward the game.
  const dt = Math.min(now - last, 100);
  last = now;
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
