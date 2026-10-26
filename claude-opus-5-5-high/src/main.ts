import { Game, NEXT_QUEUE_SIZE } from "./game.js";
import { Input } from "./input.js";
import { Renderer } from "./render.js";

/** Cap on a single frame step so a backgrounded tab doesn't fast-forward the game. */
const MAX_FRAME_MS = 100;

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const game = new Game();
const input = new Input(game);
const renderer = new Renderer(
  {
    board: byId("board"),
    hold: byId("hold"),
    next: byId("next"),
    score: byId("score"),
    level: byId("level"),
    lines: byId("lines"),
    message: byId("message"),
    overlay: byId("overlay"),
  },
  NEXT_QUEUE_SIZE,
);

input.attach(window);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, MAX_FRAME_MS);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
