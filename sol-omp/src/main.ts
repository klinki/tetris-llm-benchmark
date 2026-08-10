import {
  BOARD_WIDTH,
  HIDDEN_ROWS,
  VISIBLE_HEIGHT,
  TetrisGame,
  cellsFor,
  type ActivePiece,
  type PieceKind,
} from "./game.js";

const COLORS: Record<PieceKind, string> = {
  I: "#43d9ef",
  J: "#4f72f4",
  L: "#f4a340",
  O: "#f4dc4c",
  S: "#5bd66f",
  T: "#b46df0",
  Z: "#ef5a68",
};

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required UI element: ${selector}`);
  return element;
}

function requireContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported by this browser");
  return context;
}

const boardCanvas = requireElement<HTMLCanvasElement>("#board");
const holdCanvas = requireElement<HTMLCanvasElement>("#hold");
const nextCanvas = requireElement<HTMLCanvasElement>("#next");
const scoreElement = requireElement<HTMLElement>("#score");
const levelElement = requireElement<HTMLElement>("#level");
const linesElement = requireElement<HTMLElement>("#lines");
const overlay = requireElement<HTMLElement>("#overlay");
const overlayKicker = requireElement<HTMLElement>("#overlay-kicker");
const overlayTitle = requireElement<HTMLElement>("#overlay-title");
const restartButton = requireElement<HTMLButtonElement>("#restart");

const boardContext = requireContext(boardCanvas);
const holdContext = requireContext(holdCanvas);
const nextContext = requireContext(nextCanvas);

const game = new TetrisGame();
const CELL_SIZE = boardCanvas.width / BOARD_WIDTH;
let previousTime = performance.now();
let displayedScore = -1;
let displayedLevel = -1;
let displayedLines = -1;
let wasGameOver = false;
let wasPaused = false;

function shade(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
  return `rgb(${r} ${g} ${b})`;
}

function drawBlock(context: CanvasRenderingContext2D, x: number, y: number, size: number, kind: PieceKind, alpha = 1): void {
  const color = COLORS[kind];
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, size - 2, size - 2);
  context.fillStyle = shade(color, 28);
  context.fillRect(x + 3, y + 3, size - 6, 3);
  context.fillRect(x + 3, y + 3, 3, size - 6);
  context.fillStyle = shade(color, -34);
  context.fillRect(x + 3, y + size - 6, size - 6, 3);
  context.fillRect(x + size - 6, y + 3, 3, size - 6);
  context.restore();
}

function renderBoard(): void {
  const state = game.snapshot();
  const gradient = boardContext.createLinearGradient(0, 0, 0, boardCanvas.height);
  gradient.addColorStop(0, "#0d1423");
  gradient.addColorStop(1, "#070b13");
  boardContext.fillStyle = gradient;
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  boardContext.strokeStyle = "rgba(157, 180, 220, 0.055)";
  boardContext.lineWidth = 1;
  boardContext.beginPath();
  for (let x = 1; x < BOARD_WIDTH; x++) {
    boardContext.moveTo(x * CELL_SIZE + .5, 0);
    boardContext.lineTo(x * CELL_SIZE + .5, boardCanvas.height);
  }
  for (let y = 1; y < VISIBLE_HEIGHT; y++) {
    boardContext.moveTo(0, y * CELL_SIZE + .5);
    boardContext.lineTo(boardCanvas.width, y * CELL_SIZE + .5);
  }
  boardContext.stroke();

  for (let y = HIDDEN_ROWS; y < state.board.length; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const kind = state.board[y]?.[x];
      if (kind) drawBlock(boardContext, x * CELL_SIZE, (y - HIDDEN_ROWS) * CELL_SIZE, CELL_SIZE, kind);
    }
  }

  if (state.active && state.ghostY !== null) {
    const ghost = { ...state.active, y: state.ghostY };
    boardContext.strokeStyle = COLORS[state.active.kind];
    boardContext.lineWidth = 2;
    boardContext.globalAlpha = .28;
    for (const [x, y] of cellsFor(ghost)) {
      if (y >= HIDDEN_ROWS) boardContext.strokeRect(x * CELL_SIZE + 4, (y - HIDDEN_ROWS) * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    }
    boardContext.globalAlpha = 1;
    for (const [x, y] of cellsFor(state.active)) {
      if (y >= HIDDEN_ROWS) drawBlock(boardContext, x * CELL_SIZE, (y - HIDDEN_ROWS) * CELL_SIZE, CELL_SIZE, state.active.kind);
    }
  }

  if (state.score !== displayedScore) {
    scoreElement.textContent = state.score.toLocaleString("en-US");
    displayedScore = state.score;
  }
  if (state.level !== displayedLevel) {
    levelElement.textContent = String(state.level);
    displayedLevel = state.level;
  }
  if (state.lines !== displayedLines) {
    linesElement.textContent = String(state.lines);
    displayedLines = state.lines;
  }

  if (state.gameOver !== wasGameOver || state.paused !== wasPaused) {
    overlay.classList.toggle("hidden", !state.gameOver && !state.paused);
    overlayKicker.textContent = state.gameOver ? "Game over" : "Paused";
    overlayTitle.textContent = state.gameOver ? "Nice stack." : "Take a breath.";
    restartButton.hidden = !state.gameOver;
    wasGameOver = state.gameOver;
    wasPaused = state.paused;
  }
}

function pieceBounds(piece: ActivePiece): { minX: number; minY: number; width: number; height: number } {
  const cells = cellsFor(piece);
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX + 1, height: Math.max(...ys) - minY + 1 };
}

function drawPreview(context: CanvasRenderingContext2D, kind: PieceKind, top: number, areaHeight: number): void {
  const size = 22;
  const piece: ActivePiece = { kind, rotation: 0, x: 0, y: 0 };
  const bounds = pieceBounds(piece);
  const offsetX = (context.canvas.width - bounds.width * size) / 2 - bounds.minX * size;
  const offsetY = top + (areaHeight - bounds.height * size) / 2 - bounds.minY * size;
  for (const [x, y] of cellsFor(piece)) drawBlock(context, offsetX + x * size, offsetY + y * size, size, kind);
}

function renderPreviews(): void {
  const state = game.snapshot();
  holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (state.held) drawPreview(holdContext, state.held, 0, holdCanvas.height);
  state.next.slice(0, 5).forEach((kind, index) => {
    if (index > 0) {
      nextContext.strokeStyle = "rgba(151, 172, 210, .1)";
      nextContext.beginPath();
      nextContext.moveTo(12, index * 66 + .5);
      nextContext.lineTo(nextCanvas.width - 12, index * 66 + .5);
      nextContext.stroke();
    }
    drawPreview(nextContext, kind, index * 66, 66);
  });
}

function restart(): void {
  game.restart();
  renderPreviews();
}

function perform(action: string): void {
  switch (action) {
    case "left": game.move(-1); break;
    case "right": game.move(1); break;
    case "cw": game.rotate(1); break;
    case "ccw": game.rotate(-1); break;
    case "soft": game.softDrop(); break;
    case "drop": game.hardDrop(); renderPreviews(); break;
    case "hold": if (game.hold()) renderPreviews(); break;
  }
}

const keyActions: Record<string, string> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "cw",
  x: "cw",
  X: "cw",
  z: "ccw",
  Z: "ccw",
  Control: "ccw",
  ArrowDown: "soft",
  " ": "drop",
  c: "hold",
  C: "hold",
};

document.addEventListener("keydown", (event) => {
  const action = keyActions[event.key];
  if (action) {
    event.preventDefault();
    perform(action);
    return;
  }
  if ((event.key === "r" || event.key === "R") && game.gameOver) restart();
  if ((event.key === "p" || event.key === "P") && !event.repeat) game.togglePause();
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-action]")) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    perform(button.dataset.action ?? "");
  });
}
restartButton.addEventListener("click", restart);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !game.gameOver && !game.paused) game.togglePause();
  previousTime = performance.now();
});

function frame(time: number): void {
  game.tick(time - previousTime);
  previousTime = time;
  renderBoard();
  requestAnimationFrame(frame);
}

renderPreviews();
requestAnimationFrame(frame);
