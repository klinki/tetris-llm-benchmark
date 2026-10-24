import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import { Input } from "./input.js";

function main(): void {
  const boardCanvas = document.getElementById("board") as HTMLCanvasElement | null;
  const holdCanvas = document.getElementById("hold") as HTMLCanvasElement | null;
  const nextCanvas = document.getElementById("next") as HTMLCanvasElement | null;
  if (!boardCanvas || !holdCanvas || !nextCanvas) {
    throw new Error("Missing canvas elements");
  }

  const game = new Game();
  const renderer = new Renderer(boardCanvas, holdCanvas, nextCanvas);
  const input = new Input(game);
  input.onRestart = () => game.reset();

  let last = performance.now();
  const frame = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    input.update(dt);
    game.update(dt);
    renderer.render(game);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();
