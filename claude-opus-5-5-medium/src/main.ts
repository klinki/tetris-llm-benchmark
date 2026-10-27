import { Game } from "./game.js";
import { Input } from "./input.js";
import { Renderer } from "./render.js";

const MAX_FRAME_MS = 100; // avoid huge jumps after the tab was in the background

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const game = new Game();
const input = new Input(game);
const renderer = new Renderer({
  board: byId("board"),
  hold: byId("hold"),
  next: byId("next"),
  score: byId("score"),
  level: byId("level"),
  lines: byId("lines"),
  message: byId("message"),
  overlay: byId("overlay"),
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, MAX_FRAME_MS);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
