import { Renderer } from "./renderer.js";
import { TetrisGame } from "./game.js";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`Missing element #${id}`);
  }
  return found as T;
}

const game = new TetrisGame();
const renderer = new Renderer(
  element<HTMLCanvasElement>("board"),
  element<HTMLCanvasElement>("hold"),
  element<HTMLCanvasElement>("next"),
  element("score"),
  element("lines"),
  element("level"),
  element("combo"),
  element("game-over"),
);

function handleKeyDown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();
  let handled = true;

  switch (true) {
    case event.code === "ArrowLeft":
      game.move(-1);
      break;
    case event.code === "ArrowRight":
      game.move(1);
      break;
    case event.code === "ArrowUp" || key === "x":
      game.rotate(1);
      break;
    case key === "z" || event.code === "ControlLeft":
      game.rotate(-1);
      break;
    case event.code === "ArrowDown":
      game.softDrop();
      break;
    case event.code === "Space":
      game.hardDrop();
      break;
    case key === "c":
      game.hold();
      break;
    case key === "r":
      if (game.gameOver) {
        game.restart();
      } else {
        handled = false;
      }
      break;
    default:
      handled = false;
  }

  if (handled) {
    event.preventDefault();
    renderer.render(game.getSnapshot());
  }
}

document.addEventListener("keydown", handleKeyDown);
element<HTMLButtonElement>("restart").addEventListener("click", () => {
  game.restart();
  renderer.render(game.getSnapshot());
});

let previousTime = performance.now();
function frame(now: number): void {
  const elapsed = Math.min(100, now - previousTime);
  previousTime = now;
  game.update(elapsed);
  renderer.render(game.getSnapshot());
  window.requestAnimationFrame(frame);
}

renderer.render(game.getSnapshot());
window.requestAnimationFrame(frame);
