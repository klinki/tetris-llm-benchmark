// Entry point: wire the game, renderer and input together and run the loop.
import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import { Input } from "./input.js";

function main(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing #game canvas");

  const game = new Game();
  const renderer = new Renderer(canvas);
  const input = new Input(game);

  let last = performance.now();
  const frame = (now: number): void => {
    // Clamp dt so a backgrounded tab does not fast-forward the game.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    input.update(dt);
    game.update(dt, input.softDrop);
    renderer.render(game);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();
