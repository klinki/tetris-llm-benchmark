import { Game } from "./game.js";
import { Renderer } from "./renderer.js";

const DAS_MS = 170; // delay before a held left/right key starts repeating
const ARR_MS = 50; // repeat interval afterwards

const game = new Game();
const renderer = new Renderer(document.getElementById("game") as HTMLCanvasElement);

let horizontal: -1 | 1 | null = null; // direction currently auto-repeating
let repeatTimer = 0;
const held = new Set<string>();

function press(code: string): void {
  switch (code) {
    case "ArrowLeft":
    case "ArrowRight":
      horizontal = code === "ArrowLeft" ? -1 : 1;
      repeatTimer = DAS_MS;
      stepHorizontal();
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
      game.softDrop = true;
      break;
    case "Space":
      game.hardDrop();
      break;
    case "KeyC":
      game.hold();
      break;
    case "KeyR":
      if (game.gameOver) game.restart();
      break;
  }
}

function release(code: string): void {
  if (code === "ArrowDown") game.softDrop = false;
  if (code !== "ArrowLeft" && code !== "ArrowRight") return;
  // Fall back to the other direction if it is still held.
  const other = code === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
  if (held.has(other)) {
    horizontal = other === "ArrowLeft" ? -1 : 1;
    repeatTimer = DAS_MS;
  } else {
    horizontal = null;
  }
}

function stepHorizontal(): void {
  if (horizontal === -1) game.moveLeft();
  else if (horizontal === 1) game.moveRight();
}

window.addEventListener("keydown", (e) => {
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  if (e.repeat || held.has(e.code)) return;
  held.add(e.code);
  press(e.code);
});

window.addEventListener("keyup", (e) => {
  held.delete(e.code);
  release(e.code);
});

window.addEventListener("blur", () => {
  held.clear();
  horizontal = null;
  game.softDrop = false;
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100); // avoid a huge catch-up after the tab was hidden
  last = now;

  if (horizontal !== null) {
    repeatTimer -= dt;
    while (repeatTimer <= 0) {
      stepHorizontal();
      repeatTimer += ARR_MS;
    }
  }
  game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
