import { Game } from "./game.js";
import { Renderer } from "./renderer.js";

const BEST_KEY = "tetris-js.best";
const DAS_DELAY = 0.167; // seconds a direction key must be held before auto-repeat
const ARR = 0.033; // auto-repeat period in seconds

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage may be unavailable (private mode); best score stays in memory.
  }
}

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("missing <canvas id=\"game\">");

const game = new Game({ best: loadBest() });
const renderer = new Renderer(canvas);

const held = { left: false, right: false, down: false };
let dasDir = 0; // -1, 0 or 1 while a horizontal key is held
let dasTimer = 0;
let dasCharged = false;

function updateAutoRepeat(dt: number): void {
  if (dasDir === 0 || game.gameOver) return;
  dasTimer += dt;
  if (!dasCharged && dasTimer >= DAS_DELAY) {
    dasCharged = true;
    dasTimer -= DAS_DELAY;
    game.move(dasDir);
  }
  while (dasCharged) {
    if (dasTimer < ARR) break;
    dasTimer -= ARR;
    if (!game.move(dasDir)) break;
  }
}

function pressHorizontal(dx: number): void {
  const wasHeld = dx < 0 ? held.left : held.right;
  if (dx < 0) held.left = true;
  else held.right = true;
  if (wasHeld && dasDir === dx) return; // already repeating this direction
  dasDir = dx;
  dasTimer = 0;
  dasCharged = false;
  game.move(dx);
}

function releaseHorizontal(dx: number): void {
  if (dx < 0) held.left = false;
  else held.right = false;
  const opposite = dx < 0 ? 1 : -1;
  const oppositeHeld = opposite < 0 ? held.left : held.right;
  dasDir = oppositeHeld ? opposite : 0;
  dasTimer = 0;
  dasCharged = false;
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) return; // auto-repeat is handled via DAS/ARR above
  let handled = true;
  switch (event.code) {
    case "ArrowLeft":
      pressHorizontal(-1);
      break;
    case "ArrowRight":
      pressHorizontal(1);
      break;
    case "ArrowUp":
    case "KeyX":
      game.rotate(1);
      break;
    case "KeyZ":
    case "ControlLeft":
      game.rotate(-1);
      break;
    case "ArrowDown":
      held.down = true;
      game.softDropping = true;
      game.softStep();
      break;
    case "Space":
      game.hardDrop();
      break;
    case "KeyC":
      game.holdPiece();
      break;
    case "KeyR":
      if (game.gameOver) game.reset();
      break;
    default:
      handled = false;
  }
  if (handled) event.preventDefault();
});

document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "ArrowLeft":
      releaseHorizontal(-1);
      break;
    case "ArrowRight":
      releaseHorizontal(1);
      break;
    case "ArrowDown":
      held.down = false;
      game.softDropping = false;
      break;
  }
});

window.addEventListener("blur", () => {
  held.left = held.right = held.down = false;
  dasDir = 0;
  game.softDropping = false;
});

let bestRecorded = game.best;
let lastTime = performance.now();

function frame(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.1); // clamp after tab switches
  lastTime = now;

  updateAutoRepeat(dt);
  game.tick(dt);
  renderer.draw(game);

  if (game.gameOver && game.best !== bestRecorded) {
    bestRecorded = game.best;
    saveBest(game.best);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
