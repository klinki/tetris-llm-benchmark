import { BOARD_HEIGHT, BOARD_WIDTH, canPlace, cellsFor, type ActivePiece, type Board, type PieceType, TetrisGame } from "./engine.js";

const COLORS: Record<PieceType, { fill: string; light: string; dark: string }> = {
  I: { fill: "#39d8ff", light: "#9defff", dark: "#167fb3" },
  J: { fill: "#4c75ff", light: "#9cadff", dark: "#263eac" },
  L: { fill: "#ffab38", light: "#ffda91", dark: "#bd661c" },
  O: { fill: "#f4db35", light: "#fff394", dark: "#ac9711" },
  S: { fill: "#58d56a", light: "#a5f5ae", dark: "#27883e" },
  T: { fill: "#be69f4", light: "#e6b6ff", dark: "#7634a9" },
  Z: { fill: "#fa5f73", light: "#ffadba", dark: "#ad2c43" },
};

const boardCanvas = getCanvas("board");
const holdCanvas = getCanvas("hold");
const nextCanvas = getCanvas("next");
const boardContext = contextFor(boardCanvas);
const holdContext = contextFor(holdCanvas);
const nextContext = contextFor(nextCanvas);
const scoreNode = getElement("score");
const levelNode = getElement("level");
const linesNode = getElement("lines");
const statusNode = getElement("status");
const gameOverNode = getElement("game-over");
const game = new TetrisGame();

let previousTime = performance.now();
let gravityElapsed = 0;
let groundedElapsed = 0;
let lockResets = 0;
const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;

function getCanvas(id: string): HTMLCanvasElement {
  const node = document.getElementById(id);
  if (!(node instanceof HTMLCanvasElement)) throw new Error(`Missing canvas #${id}`);
  return node;
}
function getElement(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!(node instanceof HTMLElement)) throw new Error(`Missing element #${id}`);
  return node;
}
function contextFor(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  return context;
}

function drawCell(context: CanvasRenderingContext2D, x: number, y: number, size: number, type: PieceType, alpha = 1): void {
  const color = COLORS[type];
  const inset = Math.max(1, size * 0.07);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color.dark;
  context.fillRect(x * size, y * size, size, size);
  context.fillStyle = color.fill;
  context.fillRect(x * size + inset, y * size + inset, size - inset * 2, size - inset * 2);
  context.fillStyle = color.light;
  context.fillRect(x * size + inset, y * size + inset, size - inset * 2, Math.max(1, size * 0.12));
  context.restore();
}

function drawBoard(): void {
  const size = boardCanvas.width / BOARD_WIDTH;
  boardContext.fillStyle = "#0a1121";
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardContext.strokeStyle = "rgba(102, 133, 190, .13)";
  boardContext.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    boardContext.beginPath(); boardContext.moveTo(x * size + .5, 0); boardContext.lineTo(x * size + .5, boardCanvas.height); boardContext.stroke();
  }
  for (let y = 0; y <= BOARD_HEIGHT; y += 1) {
    boardContext.beginPath(); boardContext.moveTo(0, y * size + .5); boardContext.lineTo(boardCanvas.width, y * size + .5); boardContext.stroke();
  }
  drawLocked(game.board, boardContext, size);
  if (game.active) {
    const ghost = ghostFor(game.board, game.active);
    for (const [x, y] of cellsFor(ghost)) if (y >= 0) drawCell(boardContext, x, y, size, ghost.type, .18);
    for (const [x, y] of cellsFor(game.active)) if (y >= 0) drawCell(boardContext, x, y, size, game.active.type);
  }
}

function drawLocked(board: Board, context: CanvasRenderingContext2D, size: number): void {
  board.forEach((row, y) => row.forEach((cell, x) => { if (cell) drawCell(context, x, y, size, cell); }));
}

function ghostFor(board: Board, active: ActivePiece): ActivePiece {
  let ghost = { ...active };
  while (cellsFor({ ...ghost, y: ghost.y + 1 }).every(([x, y]) => x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT && (y < 0 || board[y][x] === null))) ghost = { ...ghost, y: ghost.y + 1 };
  return ghost;
}

function drawMini(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pieces: (PieceType | null)[], rows: number): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const cell = 19;
  const centerX = canvas.width / 2;
  pieces.slice(0, rows).forEach((type, index) => {
    if (!type) return;
    const preview: ActivePiece = { type, rotation: 0, x: 0, y: 0 };
    const cells = cellsFor(preview);
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    const width = (maxX - minX + 1) * cell;
    const offsetX = Math.floor((centerX - width / 2) / cell) - minX;
    const offsetY = index * 78 + 8 - minY;
    for (const [x, y] of cells) drawCell(context, x + offsetX, y + offsetY, cell, type);
  });
}

function redraw(): void {
  drawBoard();
  drawMini(holdCanvas, holdContext, [game.hold], 1);
  drawMini(nextCanvas, nextContext, game.queue, 5);
  scoreNode.textContent = game.score.toLocaleString();
  levelNode.textContent = String(game.level);
  linesNode.textContent = String(game.lines);
  gameOverNode.hidden = !game.gameOver;
}

function resetLockDelay(): void { groundedElapsed = 0; lockResets = 0; }
function announce(result: { event: string; gameOver: boolean }): void {
  if (result.gameOver) statusNode.textContent = "Top out — press R to restart";
  else if (result.event) statusNode.textContent = result.event;
}

function update(time: number): void {
  const elapsed = Math.min(100, time - previousTime);
  previousTime = time;
  if (!game.gameOver && game.active) {
    gravityElapsed += elapsed;
    const grounded = !canPlace(game.board, { ...game.active, y: game.active.y + 1 });
    if (grounded) {
      groundedElapsed += elapsed;
      if (groundedElapsed >= LOCK_DELAY || lockResets >= MAX_LOCK_RESETS) {
        const result = game.tickGravity();
        announce(result);
        gravityElapsed = 0;
        resetLockDelay();
      }
    } else groundedElapsed = 0;
    if (gravityElapsed >= game.gravityMs()) {
      gravityElapsed = 0;
      const result = game.tickGravity();
      if (result.locked) { announce(result); resetLockDelay(); }
    }
  }
  redraw();
  requestAnimationFrame(update);
}

function playerMove(dx: number): void {
  if (game.move(dx, 0)) {
    if (groundedElapsed > 0 && lockResets < MAX_LOCK_RESETS) { groundedElapsed = 0; lockResets += 1; }
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "x", "z", "c", "control", "r"].includes(key)) event.preventDefault();
  if (key === "r" && game.gameOver) {
    game.reset(); gravityElapsed = 0; resetLockDelay(); statusNode.textContent = "New game"; return;
  }
  if (game.gameOver || event.repeat && [" ", "c", "x", "z", "arrowup"].includes(key)) return;
  if (key === "arrowleft") playerMove(-1);
  else if (key === "arrowright") playerMove(1);
  else if (key === "arrowdown") { if (game.move(0, 1, true)) groundedElapsed = 0; }
  else if (key === "arrowup" || key === "x") { if (game.rotate(1) && groundedElapsed > 0 && lockResets < MAX_LOCK_RESETS) { groundedElapsed = 0; lockResets += 1; } }
  else if (key === "z" || key === "control") { if (game.rotate(-1) && groundedElapsed > 0 && lockResets < MAX_LOCK_RESETS) { groundedElapsed = 0; lockResets += 1; } }
  else if (key === " ") { const result = game.hardDrop(); announce(result); gravityElapsed = 0; resetLockDelay(); }
  else if (key === "c") { if (game.holdPiece()) { gravityElapsed = 0; resetLockDelay(); statusNode.textContent = "Piece held"; } }
});

redraw();
requestAnimationFrame(update);
