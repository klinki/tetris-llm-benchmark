import { Game } from "./game.js";
import { InputController, KEY_BINDINGS } from "./input.js";
import { Renderer } from "./renderer.js";

// Limits the time step after the tab was in the background so pieces don't fall in one jump.
const MAX_FRAME_MS = 100;

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Missing <canvas id=\"game\">");

const game = new Game();
const input = new InputController(game);
const renderer = new Renderer(canvas);

window.addEventListener("keydown", (event) => {
  const action = KEY_BINDINGS[event.code];
  if (!action || event.metaKey || event.altKey) return;
  event.preventDefault();
  if (!event.repeat) input.press(action); // repeating is handled by the input controller
});

window.addEventListener("keyup", (event) => {
  const action = KEY_BINDINGS[event.code];
  if (action) input.release(action);
});

window.addEventListener("blur", () => input.releaseAll());

let lastTime: number | undefined;

function frame(time: number): void {
  const dt = lastTime === undefined ? 0 : Math.min(Math.max(time - lastTime, 0), MAX_FRAME_MS);
  lastTime = time;

  input.update(dt);
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
