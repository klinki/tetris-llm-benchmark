import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HIDDEN_ROWS,
  PIECE_COLORS,
  Piece,
  PieceType,
  TetrisGame,
  VISIBLE_ROWS,
  getPieceCells,
  type GameCommand
} from "./game.js";

function elementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error("Missing element #" + id);
  }
  return element as T;
}

function canvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }
  return context;
}

const boardCanvas = elementById<HTMLCanvasElement>("boardCanvas");
const holdCanvas = elementById<HTMLCanvasElement>("holdCanvas");
const nextCanvas = elementById<HTMLCanvasElement>("nextCanvas");
const boardContext = canvasContext(boardCanvas);
const holdContext = canvasContext(holdCanvas);
const nextContext = canvasContext(nextCanvas);
const scoreValue = elementById<HTMLElement>("scoreValue");
const levelValue = elementById<HTMLElement>("levelValue");
const linesValue = elementById<HTMLElement>("linesValue");
const statusText = elementById<HTMLElement>("statusText");
const comboText = elementById<HTMLElement>("comboText");
const holdState = elementById<HTMLElement>("holdState");
const gameOver = elementById<HTMLElement>("gameOver");
const newGame = elementById<HTMLButtonElement>("newGame");

const game = new TetrisGame();

function format(value: number, width: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(width, "0");
}

function drawCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  ghost = false
): void {
  const inset = Math.max(1, size * 0.075);
  const left = x * size + inset;
  const top = y * size + inset;
  const side = size - inset * 2;

  context.save();
  if (ghost) {
    context.fillStyle = color;
    context.globalAlpha = 0.11;
    context.fillRect(left, top, side, side);
    context.globalAlpha = 0.7;
    context.lineWidth = Math.max(1.5, size * 0.065);
    context.strokeStyle = color;
    context.strokeRect(left + 1, top + 1, side - 2, side - 2);
    context.restore();
    return;
  }

  const gradient = context.createLinearGradient(left, top, left + side, top + side);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.075, color);
  gradient.addColorStop(0.7, color);
  gradient.addColorStop(1, "#08101f");
  context.fillStyle = gradient;
  context.shadowBlur = size * 0.22;
  context.shadowColor = color;
  context.fillRect(left, top, side, side);
  context.shadowBlur = 0;
  context.fillStyle = "rgba(255, 255, 255, 0.23)";
  context.fillRect(left + 2, top + 2, side - 4, Math.max(2, side * 0.12));
  context.strokeStyle = "rgba(1, 8, 22, 0.7)";
  context.lineWidth = Math.max(1, size * 0.045);
  context.strokeRect(left + 0.5, top + 0.5, side - 1, side - 1);
  context.restore();
}

function drawBoard(): void {
  const cellSize = boardCanvas.width / BOARD_WIDTH;
  const visibleHeight = cellSize * VISIBLE_ROWS;
  boardContext.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  const background = boardContext.createLinearGradient(0, 0, 0, visibleHeight);
  background.addColorStop(0, "#091629");
  background.addColorStop(1, "#020712");
  boardContext.fillStyle = background;
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  boardContext.strokeStyle = "rgba(122, 167, 234, 0.1)";
  boardContext.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    boardContext.beginPath();
    boardContext.moveTo(x * cellSize + 0.5, 0);
    boardContext.lineTo(x * cellSize + 0.5, visibleHeight);
    boardContext.stroke();
  }
  for (let y = 0; y <= VISIBLE_ROWS; y += 1) {
    boardContext.beginPath();
    boardContext.moveTo(0, y * cellSize + 0.5);
    boardContext.lineTo(boardCanvas.width, y * cellSize + 0.5);
    boardContext.stroke();
  }

  for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const type = game.board[y][x];
      if (type) {
        drawCell(boardContext, x, y - HIDDEN_ROWS, cellSize, PIECE_COLORS[type]);
      }
    }
  }

  const activeCells = game.active ? getPieceCells(game.active) : [];
  const activePositions = new Set(activeCells.map((cell) => String(cell.x) + ":" + String(cell.y)));
  const ghost = game.getGhostPiece();
  if (ghost) {
    for (const cell of getPieceCells(ghost)) {
      if (cell.y >= HIDDEN_ROWS && !activePositions.has(String(cell.x) + ":" + String(cell.y))) {
        drawCell(boardContext, cell.x, cell.y - HIDDEN_ROWS, cellSize, PIECE_COLORS[cell.type], true);
      }
    }
  }

  for (const cell of activeCells) {
    if (cell.y >= HIDDEN_ROWS) {
      drawCell(boardContext, cell.x, cell.y - HIDDEN_ROWS, cellSize, PIECE_COLORS[cell.type]);
    }
  }

  const floorGradient = boardContext.createLinearGradient(0, visibleHeight - 38, 0, visibleHeight);
  floorGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  floorGradient.addColorStop(1, "rgba(0, 0, 0, 0.26)");
  boardContext.fillStyle = floorGradient;
  boardContext.fillRect(0, visibleHeight - 38, boardCanvas.width, 38);
}

function drawPreviewPiece(
  context: CanvasRenderingContext2D,
  type: PieceType | null,
  centerX: number,
  centerY: number,
  size: number
): void {
  if (!type) {
    return;
  }

  const cells = getPieceCells({ type, rotation: 0, x: 0, y: 0 });
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  const width = (maxX - minX + 1) * size;
  const height = (maxY - minY + 1) * size;
  const startX = centerX - width / 2 - minX * size;
  const startY = centerY - height / 2 - minY * size;

  for (const cell of cells) {
    const inset = Math.max(1, size * 0.075);
    const left = startX + cell.x * size + inset;
    const top = startY + cell.y * size + inset;
    const side = size - inset * 2;
    const gradient = context.createLinearGradient(left, top, left + side, top + side);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.1, PIECE_COLORS[type]);
    gradient.addColorStop(0.78, PIECE_COLORS[type]);
    gradient.addColorStop(1, "#111b2d");
    context.fillStyle = gradient;
    context.fillRect(left, top, side, side);
    context.strokeStyle = "rgba(5, 10, 22, 0.72)";
    context.lineWidth = 1;
    context.strokeRect(left + 0.5, top + 0.5, side - 1, side - 1);
  }
}

function drawHold(): void {
  holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  holdContext.fillStyle = "rgba(3, 10, 23, 0.46)";
  holdContext.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (game.hold) {
    drawPreviewPiece(holdContext, game.hold, holdCanvas.width / 2, holdCanvas.height / 2, 23);
  } else {
    holdContext.fillStyle = "rgba(137, 162, 204, 0.38)";
    holdContext.font = "700 10px ui-monospace, monospace";
    holdContext.textAlign = "center";
    holdContext.fillText("EMPTY", holdCanvas.width / 2, holdCanvas.height / 2 + 3);
  }
}

function drawNext(): void {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextContext.fillStyle = "rgba(3, 10, 23, 0.46)";
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const slotHeight = nextCanvas.height / 5;

  for (let index = 0; index < 5; index += 1) {
    if (index > 0) {
      nextContext.strokeStyle = "rgba(125, 162, 231, 0.12)";
      nextContext.beginPath();
      nextContext.moveTo(13, index * slotHeight + 0.5);
      nextContext.lineTo(nextCanvas.width - 13, index * slotHeight + 0.5);
      nextContext.stroke();
    }
    drawPreviewPiece(
      nextContext,
      game.queue[index] || null,
      nextCanvas.width / 2,
      slotHeight * index + slotHeight / 2,
      18
    );
  }
}

function renderHud(): void {
  scoreValue.textContent = format(game.score, 6);
  levelValue.textContent = format(game.level, 2);
  linesValue.textContent = format(game.lines, 3);
  statusText.textContent = game.phase === "gameover" ? "SYSTEM HALTED" : game.lastClear;
  comboText.textContent = game.combo > 0 ? "COMBO x" + String(game.combo + 1) : "COMBO —";
  holdState.textContent = game.holdUsed ? "LOCKED UNTIL DROP" : "AVAILABLE";
  holdState.classList.toggle("locked", game.holdUsed);
  gameOver.classList.toggle("visible", game.phase === "gameover");
}

function render(): void {
  drawBoard();
  drawHold();
  drawNext();
  renderHud();
}

function runCommand(command: GameCommand): void {
  game.handle(command);
  render();
}

const keyboardCommands: Record<string, GameCommand> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "rotateClockwise",
  ArrowDown: "softDrop",
  KeyX: "rotateClockwise",
  KeyZ: "rotateCounterClockwise",
  Space: "hardDrop",
  KeyC: "hold",
  ControlLeft: "rotateCounterClockwise",
  ControlRight: "rotateCounterClockwise",
  KeyR: "restart"
};

window.addEventListener("keydown", (event) => {
  const command = keyboardCommands[event.code];
  if (!command) {
    return;
  }
  event.preventDefault();
  if (
    event.repeat &&
    command !== "left" &&
    command !== "right" &&
    command !== "softDrop"
  ) {
    return;
  }
  runCommand(command);
});

document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    const command = button.dataset.command as GameCommand | undefined;
    if (command) {
      runCommand(command);
    }
  });
});

newGame.addEventListener("click", () => {
  game.restart();
  render();
});

let previousFrame = performance.now();
function animationFrame(now: number): void {
  game.tick(now - previousFrame);
  previousFrame = now;
  render();
  window.requestAnimationFrame(animationFrame);
}

render();
window.requestAnimationFrame(animationFrame);
