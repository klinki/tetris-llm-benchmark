import { Game } from "./game.js";
import { Input } from "./input.js";
import { Renderer } from "./render.js";

const boardCanvas = document.getElementById("board") as HTMLCanvasElement;
const nextCanvas = document.getElementById("next") as HTMLCanvasElement;
const holdCanvas = document.getElementById("hold") as HTMLCanvasElement;
const scoreEl = document.getElementById("score") as HTMLSpanElement;
const levelEl = document.getElementById("level") as HTMLSpanElement;
const linesEl = document.getElementById("lines") as HTMLSpanElement;
const overlay = document.getElementById("overlay") as HTMLDivElement;

/** Size a canvas for the device pixel ratio and return its 2D context. */
function fit(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

const game = new Game();
const renderer = new Renderer(fit(boardCanvas, 300, 600), fit(nextCanvas, 96, 288), fit(holdCanvas, 96, 96));

const input = new Input({
  moveLeft: () => game.move(-1),
  moveRight: () => game.move(1),
  rotateCW: () => game.rotate(1),
  rotateCCW: () => game.rotate(-1),
  softDrop: (on) => game.setSoftDrop(on),
  hardDrop: () => game.hardDrop(),
  hold: () => game.holdPiece(),
  restart: () => game.restart(),
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.1); // clamp: avoid huge steps after tab switch
  last = now;
  input.update(dt);
  if (!game.over) game.update(dt);
  renderer.draw(game);

  scoreEl.textContent = String(game.score);
  levelEl.textContent = String(game.level);
  linesEl.textContent = String(game.lines);
  overlay.classList.toggle("hidden", !game.over);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
