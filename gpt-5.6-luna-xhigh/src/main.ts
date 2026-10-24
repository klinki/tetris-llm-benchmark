import { COLORS, getLocalCells } from "./pieces.js";
import { TetrisGame } from "./game.js";
import type { GameState, PieceType } from "./types.js";

const gameCanvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold-canvas")!;
const nextCanvas = document.querySelector<HTMLCanvasElement>("#next-canvas")!;
const scoreElement = document.querySelector<HTMLElement>("#score")!;
const linesElement = document.querySelector<HTMLElement>("#lines")!;
const levelElement = document.querySelector<HTMLElement>("#level")!;
const statusElement = document.querySelector<HTMLElement>("#game-status")!;
const statusTitle = document.querySelector<HTMLElement>("#status-title")!;

if (!gameCanvas || !holdCanvas || !nextCanvas || !scoreElement || !linesElement || !levelElement || !statusElement || !statusTitle) {
  throw new Error("Tetris UI is missing required elements");
}

const game = new TetrisGame();
const gameContext = gameCanvas.getContext("2d")!;
const holdContext = holdCanvas.getContext("2d")!;
const nextContext = nextCanvas.getContext("2d")!;
let softDropHeld = false;
let lastFrame = performance.now();

function drawCell(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1): void {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = "rgba(255,255,255,.22)";
  context.fillRect(x * size + 2, y * size + 2, size - 5, Math.max(2, size * 0.12));
  context.restore();
}

function drawBoard(state: GameState): void {
  const size = gameCanvas.width / 10;
  gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  gameContext.fillStyle = "#101321";
  gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  gameContext.strokeStyle = "rgba(149, 157, 196, .08)";
  gameContext.lineWidth = 1;
  for (let x = 0; x <= 10; x += 1) {
    gameContext.beginPath(); gameContext.moveTo(x * size, 0); gameContext.lineTo(x * size, gameCanvas.height); gameContext.stroke();
  }
  for (let y = 0; y <= 20; y += 1) {
    gameContext.beginPath(); gameContext.moveTo(0, y * size); gameContext.lineTo(gameCanvas.width, y * size); gameContext.stroke();
  }
  state.board.forEach((row, y) => row.forEach((type, x) => {
    if (type) drawCell(gameContext, x, y, size, COLORS[type]);
  }));
  if (state.active) {
    const ghostCells = getLocalCells(state.active.type, state.active.rotation);
    const ghostY = state.ghostY ?? state.active.y;
    ghostCells.forEach((cell) => drawCell(gameContext, state.active!.x + cell.x, ghostY + cell.y, size, COLORS[state.active!.type], .22));
    ghostCells.forEach((cell) => drawCell(gameContext, state.active!.x + cell.x, state.active!.y + cell.y, size, COLORS[state.active!.type]));
  }
}

function drawPiecePreview(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, type: PieceType | null, slotTop = 0, slotHeight = canvas.height): void {
  if (!type) return;
  const cellSize = 22;
  const cells = getLocalCells(type);
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const xOffset = Math.floor((canvas.width / cellSize - width) / 2);
  const top = Math.floor((slotTop + (slotHeight - height * cellSize) / 2) / cellSize);
  cells.forEach((cell) => drawCell(context, xOffset + cell.x - minX, top + cell.y - minY, cellSize, COLORS[type]));
}

function drawPreviews(state: GameState): void {
  holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  holdContext.fillStyle = "#111422"; holdContext.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (state.hold) drawPiecePreview(holdContext, holdCanvas, state.hold);
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextContext.fillStyle = "#111422"; nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  state.next.slice(0, 4).forEach((type, index) => drawPiecePreview(nextContext, nextCanvas, type, index * 68, 68));
}

function render(state: GameState): void {
  drawBoard(state);
  drawPreviews(state);
  scoreElement.textContent = state.score.toLocaleString();
  linesElement.textContent = String(state.lines);
  levelElement.textContent = String(state.level);
  statusElement.hidden = !state.gameOver;
  statusTitle.textContent = "Game over";
}

game.subscribe(render);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const handled = ["arrowleft", "arrowright", "arrowup", "arrowdown", "x", "z", "c", " ", "control", "r"].includes(key);
  if (handled) event.preventDefault();
  if (event.repeat && [" ", "c", "x", "z", "r"].includes(key)) return;
  if (game.gameOver) {
    if (key === "r") game.reset();
    return;
  }
  if (key === "arrowleft") game.move(-1);
  else if (key === "arrowright") game.move(1);
  else if (key === "arrowup" || key === "x") game.rotate(true);
  else if (key === "z" || (key === "control" && !event.metaKey)) game.rotate(false);
  else if (key === "arrowdown") { softDropHeld = true; game.softDrop(); }
  else if (key === " ") game.hardDrop();
  else if (key === "c") game.holdPiece();
});

window.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "arrowdown") softDropHeld = false;
});

window.addEventListener("blur", () => { softDropHeld = false; });

function frame(now: number): void {
  game.update(now - lastFrame, softDropHeld);
  lastFrame = now;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
