import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  MATRICES,
  TetrisGame,
  type CellValue,
  type Piece,
  type TetrominoType
} from "./engine.js";

const COLORS: Record<TetrominoType, string> = {
  I: "#48d9e8",
  O: "#f5cc4f",
  T: "#ad79f5",
  S: "#63db8d",
  Z: "#fa6e7c",
  J: "#658bf6",
  L: "#f5a052"
};

const game = new TetrisGame();
const boardCanvasElement = document.querySelector<HTMLCanvasElement>("#board-canvas");
const holdCanvasElement = document.querySelector<HTMLCanvasElement>("#hold-canvas");
const nextListElement = document.querySelector<HTMLDivElement>("#next-list");
const statusElementElement = document.querySelector<HTMLDivElement>("#status");
const messageElementElement = document.querySelector<HTMLDivElement>("#board-message");
const scoreElementElement = document.querySelector<HTMLElement>("#score");
const linesElementElement = document.querySelector<HTMLElement>("#lines");
const levelElementElement = document.querySelector<HTMLElement>("#level");

if (!boardCanvasElement || !holdCanvasElement || !nextListElement || !statusElementElement || !messageElementElement || !scoreElementElement || !linesElementElement || !levelElementElement) {
  throw new Error("Tetris markup is incomplete");
}

const boardCanvas = boardCanvasElement;
const holdCanvas = holdCanvasElement;
const nextList = nextListElement;
const statusElement = statusElementElement;
const messageElement = messageElementElement;
const scoreElement = scoreElementElement;
const linesElement = linesElementElement;
const levelElement = levelElementElement;
const boardContextElement = boardCanvas.getContext("2d");
const holdContextElement = holdCanvas.getContext("2d");
if (!boardContextElement || !holdContextElement) throw new Error("Canvas is not supported");
const boardContext = boardContextElement;
const holdContext = holdContextElement;

function drawCell(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1): void {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = "rgba(255, 255, 255, 0.2)";
  context.fillRect(x * size + 2, y * size + 2, size - 4, Math.max(2, size * 0.12));
  context.strokeStyle = "rgba(255, 255, 255, 0.12)";
  context.strokeRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3);
  context.restore();
}

function drawPiece(context: CanvasRenderingContext2D, piece: Piece, size: number, alpha = 1): void {
  const matrix = MATRICES[piece.type][piece.rotation];
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];
    for (let column = 0; column < row.length; column += 1) {
      if (row[column] === ".") continue;
      const boardY = piece.y + rowIndex;
      if (boardY >= 0) drawCell(context, piece.x + column, boardY, size, COLORS[piece.type], alpha);
    }
  }
}

function drawBoard(board: CellValue[][], ghost: Piece | null, active: Piece | null): void {
  const size = boardCanvas.width / BOARD_WIDTH;
  boardContext.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardContext.fillStyle = "#0d1325";
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  boardContext.strokeStyle = "rgba(152, 169, 220, 0.08)";
  boardContext.lineWidth = 1;
  for (let row = 0; row <= BOARD_HEIGHT; row += 1) {
    boardContext.beginPath();
    boardContext.moveTo(0, row * size + 0.5);
    boardContext.lineTo(boardCanvas.width, row * size + 0.5);
    boardContext.stroke();
  }
  for (let column = 0; column <= BOARD_WIDTH; column += 1) {
    boardContext.beginPath();
    boardContext.moveTo(column * size + 0.5, 0);
    boardContext.lineTo(column * size + 0.5, boardCanvas.height);
    boardContext.stroke();
  }

  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[row].length; column += 1) {
      const cell = board[row][column];
      if (cell) drawCell(boardContext, column, row, size, COLORS[cell]);
    }
  }
  if (ghost) drawPiece(boardContext, ghost, size, 0.18);
  if (active) drawPiece(boardContext, active, size);
}

function drawPreview(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, type: TetrominoType | null): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(7, 10, 22, 0.22)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (!type) return;

  const matrix = MATRICES[type][0];
  const cellSize = Math.min(canvas.width / 6, canvas.height / 4);
  const occupied = matrix.flatMap((row, y) => [...row].flatMap((cell, x) => cell === "." ? [] : [[x, y]]));
  const minX = Math.min(...occupied.map(([x]) => x));
  const maxX = Math.max(...occupied.map(([x]) => x));
  const minY = Math.min(...occupied.map(([, y]) => y));
  const maxY = Math.max(...occupied.map(([, y]) => y));
  const offsetX = (canvas.width - (maxX - minX + 1) * cellSize) / 2 - minX * cellSize;
  const offsetY = (canvas.height - (maxY - minY + 1) * cellSize) / 2 - minY * cellSize;
  for (const [x, y] of occupied) {
    context.fillStyle = COLORS[type];
    context.fillRect(offsetX + x * cellSize + 1, offsetY + y * cellSize + 1, cellSize - 2, cellSize - 2);
    context.fillStyle = "rgba(255, 255, 255, 0.2)";
    context.fillRect(offsetX + x * cellSize + 2, offsetY + y * cellSize + 2, cellSize - 4, Math.max(2, cellSize * 0.12));
  }
}

function render(): void {
  const snapshot = game.getSnapshot();
  drawBoard(snapshot.board, snapshot.ghost, snapshot.active);
  drawPreview(holdContext, holdCanvas, snapshot.hold);

  nextList.replaceChildren();
  for (const type of snapshot.next.slice(0, 5)) {
    const canvas = document.createElement("canvas");
    canvas.className = "next-slot";
    canvas.width = 128;
    canvas.height = 56;
    canvas.setAttribute("aria-label", `Next ${type} piece`);
    nextList.append(canvas);
    drawPreview(canvas.getContext("2d") as CanvasRenderingContext2D, canvas, type);
  }

  scoreElement.textContent = snapshot.score.toLocaleString();
  linesElement.textContent = String(snapshot.lines);
  levelElement.textContent = String(snapshot.level);
  statusElement.textContent = snapshot.gameOver ? "Game over" : "Playing";
  statusElement.classList.toggle("over", snapshot.gameOver);
  messageElement.hidden = !snapshot.gameOver;
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  let handled = true;
  switch (key) {
    case "arrowleft": game.moveHorizontal(-1); break;
    case "arrowright": game.moveHorizontal(1); break;
    case "arrowup":
    case "x": game.rotate(true); break;
    case "z":
    case "control": game.rotate(false); break;
    case "arrowdown": game.setSoftDrop(true); break;
    case " ": game.hardDrop(); break;
    case "c": game.hold(); break;
    case "r": game.reset(); break;
    default: handled = false;
  }
  if (handled) event.preventDefault();
});

window.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "arrowdown") game.setSoftDrop(false);
});

let previousTime = performance.now();
function frame(now: number): void {
  game.tick(now - previousTime);
  previousTime = now;
  render();
  window.requestAnimationFrame(frame);
}

render();
window.requestAnimationFrame(frame);
