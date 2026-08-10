import {
  BOARD_WIDTH,
  HIDDEN_ROWS,
  PIECE_COLORS,
  TetrisGame,
  type Cell,
  type GameState,
  type Piece,
  type PieceType,
} from "./game.js";

const boardCanvas = document.querySelector<HTMLCanvasElement>("#board")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold")!;
const nextCanvas = document.querySelector<HTMLCanvasElement>("#next")!;
const scoreElement = document.querySelector<HTMLElement>("#score")!;
const linesElement = document.querySelector<HTMLElement>("#lines")!;
const levelElement = document.querySelector<HTMLElement>("#level")!;
const statusElement = document.querySelector<HTMLElement>("#status")!;
const pauseButton = document.querySelector<HTMLButtonElement>("#pause")!;
const restartButton = document.querySelector<HTMLButtonElement>("#restart")!;

if (!boardCanvas || !holdCanvas || !nextCanvas || !scoreElement || !linesElement || !levelElement || !statusElement || !pauseButton || !restartButton) {
  throw new Error("Tetris UI is missing required elements");
}

const game = new TetrisGame();
const boardContext = boardCanvas.getContext("2d")!;
const holdContext = holdCanvas.getContext("2d")!;
const nextContext = nextCanvas.getContext("2d")!;
if (!boardContext || !holdContext || !nextContext) throw new Error("Canvas rendering is unavailable");

const cellSize = 30;
const visibleHeight = 20;
let lastFrame = performance.now();

function drawCell(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1): void {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = "rgba(255, 255, 255, 0.26)";
  context.fillRect(x * size + 2, y * size + 2, size - 5, Math.max(2, size * 0.12));
  context.restore();
}

function drawPiece(context: CanvasRenderingContext2D, piece: Piece, size: number, yOffset = 0, alpha = 1): void {
  for (const point of game.getPieceCells(piece.type, piece.rotation)) {
    drawCell(context, piece.x + point.x, piece.y + point.y - yOffset, size, PIECE_COLORS[piece.type], alpha);
  }
}

function drawBoard(state: GameState): void {
  boardContext.fillStyle = "#101521";
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  for (let y = HIDDEN_ROWS; y < state.board.length; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const cell = state.board[y]?.[x] as Cell | null | undefined;
      if (cell) drawCell(boardContext, x, y - HIDDEN_ROWS, cellSize, PIECE_COLORS[cell]);
      else {
        boardContext.strokeStyle = "rgba(255, 255, 255, 0.045)";
        boardContext.strokeRect(x * cellSize + 0.5, (y - HIDDEN_ROWS) * cellSize + 0.5, cellSize - 1, cellSize - 1);
      }
    }
  }

  if (state.ghost) drawPiece(boardContext, state.ghost, cellSize, HIDDEN_ROWS, 0.2);
  if (state.current) drawPiece(boardContext, state.current, cellSize, HIDDEN_ROWS);
}

function drawMiniPiece(context: CanvasRenderingContext2D, type: PieceType | null): void {
  context.fillStyle = "#101521";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  if (!type) return;
  const points = game.getPieceCells(type);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const size = 24;
  const offsetX = (context.canvas.width / size - (maxX - minX + 1)) / 2 - minX;
  const offsetY = (context.canvas.height / size - (maxY - minY + 1)) / 2 - minY;
  for (const point of points) drawCell(context, offsetX + point.x, offsetY + point.y, size, PIECE_COLORS[type]);
}

function drawNextQueue(next: readonly PieceType[]): void {
  nextContext.fillStyle = "#101521";
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const size = 18;
  next.slice(0, 5).forEach((type, index) => {
    const points = game.getPieceCells(type);
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const offsetX = (nextCanvas.width / size - (maxX - minX + 1)) / 2 - minX;
    const offsetY = index * 4 + (4 - (maxY - minY + 1)) / 2 - minY;
    for (const point of points) drawCell(nextContext, offsetX + point.x, offsetY + point.y, size, PIECE_COLORS[type]);
  });
}

function render(state: GameState): void {
  drawBoard(state);
  drawMiniPiece(holdContext, state.hold);
  drawNextQueue(state.next);
  scoreElement.textContent = state.score.toLocaleString();
  linesElement.textContent = String(state.lines);
  levelElement.textContent = String(state.level);
  pauseButton.textContent = state.paused ? "Resume" : "Pause";
  statusElement.textContent = state.gameOver ? "Game over — press R to restart" : state.paused ? "Paused" : "Playing";
  statusElement.className = state.gameOver ? "status game-over" : state.paused ? "status paused" : "status";
}

game.subscribe(render);

function handleKey(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();
  const handled = ["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "x", "z", "control", "c", "r", "p"].includes(key);
  if (handled) event.preventDefault();
  if (key === "arrowleft") game.move(-1);
  else if (key === "arrowright") game.move(1);
  else if (key === "arrowup" || key === "x") game.rotate(1);
  else if (key === "z" || key === "control") game.rotate(-1);
  else if (key === "arrowdown") game.softDrop();
  else if (key === " ") game.hardDrop();
  else if (key === "c") game.hold();
  else if (key === "r") game.restart();
  else if (key === "p") game.togglePause();
}

document.addEventListener("keydown", handleKey);
pauseButton.addEventListener("click", () => game.togglePause());
restartButton.addEventListener("click", () => game.restart());

function frame(now: number): void {
  game.tick(Math.min(now - lastFrame, 100));
  lastFrame = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
