import { Game } from "./game.js";
import { Input } from "./input.js";
import { Renderer } from "./renderer.js";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const game = new Game();
const renderer = new Renderer(canvas, game);
const input = new Input(game);

// Touch buttons (optional on-screen controls) via data-action attributes.
document.querySelectorAll("[data-action]").forEach((el) => {
  el.addEventListener("click", () => {
    const a = (el as HTMLElement).dataset.action;
    if (a === "left") game.tryMove(-1, 0);
    else if (a === "right") game.tryMove(1, 0);
    else if (a === "down") game.tryMove(0, 1);
    else if (a === "rotCW") game.tryRotate(1);
    else if (a === "rotCCW") game.tryRotate(-1);
    else if (a === "hard") game.hardDrop();
    else if (a === "hold") game.hold();
    else if (a === "restart") game.restart();
  });
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100);
  last = now;
  input.update(dt);
  game.update(dt);
  renderer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
