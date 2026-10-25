import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HIDDEN_ROWS,
  PIECE_COLORS,
  TetrisGame,
  getPieceCells,
  matrixForPiece,
  type ActivePiece,
  type Cell,
  type PieceType,
} from "./game.js";

const CELL_SIZE = 30;
const gameCanvas = getElement<HTMLCanvasElement>("game-canvas");
const renderingContext = gameCanvas.getContext("2d");
if (renderingContext === null) {
  throw new Error("Canvas rendering is not supported in this browser.");
}
const context: CanvasRenderingContext2D = renderingContext;

const holdCanvas = getElement<HTMLCanvasElement>("hold-canvas");
const nextCanvases = Array.from(
  document.querySelectorAll<HTMLCanvasElement>(".next-preview"),
);
const scoreValue = getElement<HTMLElement>("score-value");
const linesValue = getElement<HTMLElement>("lines-value");
const levelValue = getElement<HTMLElement>("level-value");
const statusMessage = getElement<HTMLElement>("status-message");
const overlay = getElement<HTMLElement>("game-overlay");
const overlayTitle = getElement<HTMLElement>("overlay-title");
const overlayMessage = getElement<HTMLElement>("overlay-message");
const restartButton = getElement<HTMLButtonElement>("restart-button");

const game = new TetrisGame();
let previousFrame = performance.now();

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error("Missing element #" + id);
  }
  return element as T;
}

function roundedRect(
  target: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  target.beginPath();
  target.moveTo(x + safeRadius, y);
  target.arcTo(x + width, y, x + width, y + height, safeRadius);
  target.arcTo(x + width, y + height, x, y + height, safeRadius);
  target.arcTo(x, y + height, x, y, safeRadius);
  target.arcTo(x, y, x + width, y, safeRadius);
  target.closePath();
}

function drawBlock(
  target: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
  outline = false,
): void {
  const inset = Math.max(1, size * 0.08);
  target.save();
  target.globalAlpha = alpha;
  roundedRect(target, x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.18);
  if (outline) {
    target.strokeStyle = color;
    target.lineWidth = Math.max(1.5, size * 0.08);
    target.stroke();
  } else {
    const gradient = target.createLinearGradient(x, y, x, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, shadeColor(color, -0.22));
    target.fillStyle = gradient;
    target.fill();
    target.strokeStyle = "rgba(255, 255, 255, 0.2)";
    target.lineWidth = Math.max(1, size * 0.04);
    target.stroke();
    target.fillStyle = "rgba(255, 255, 255, 0.22)";
    roundedRect(
      target,
      x + size * 0.21,
      y + size * 0.16,
      size * 0.58,
      size * 0.12,
      size * 0.05,
    );
    target.fill();
  }
  target.restore();
}

function shadeColor(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const adjust = (channel: number): number => Math.max(
    0,
    Math.min(255, Math.round(channel + channel * amount)),
  );
  return "rgb(" + adjust(red) + ", " + adjust(green) + ", " + adjust(blue) + ")";
}

function drawBoard(): void {
  const snapshot = game.getSnapshot();
  const target = context;
  target.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  target.fillStyle = "#080a16";
  target.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  target.strokeStyle = "rgba(183, 191, 230, 0.07)";
  target.lineWidth = 1;
  for (let row = 0; row <= BOARD_HEIGHT - HIDDEN_ROWS; row += 1) {
    const y = row * CELL_SIZE + 0.5;
    target.beginPath();
    target.moveTo(0, y);
    target.lineTo(gameCanvas.width, y);
    target.stroke();
  }
  for (let column = 0; column <= BOARD_WIDTH; column += 1) {
    const x = column * CELL_SIZE + 0.5;
    target.beginPath();
    target.moveTo(x, 0);
    target.lineTo(x, gameCanvas.height);
    target.stroke();
  }

  for (let row = HIDDEN_ROWS; row < BOARD_HEIGHT; row += 1) {
    for (let column = 0; column < BOARD_WIDTH; column += 1) {
      const cell = snapshot.board[row][column];
      if (cell !== null) {
        drawBlock(
          target,
          column * CELL_SIZE,
          (row - HIDDEN_ROWS) * CELL_SIZE,
          CELL_SIZE,
          PIECE_COLORS[cell],
        );
      }
    }
  }

  for (const cell of getPieceCells(snapshot.ghost)) {
    if (cell.y >= HIDDEN_ROWS && cell.y < BOARD_HEIGHT) {
      drawBlock(
        target,
        cell.x * CELL_SIZE,
        (cell.y - HIDDEN_ROWS) * CELL_SIZE,
        CELL_SIZE,
        PIECE_COLORS[snapshot.ghost.type],
        0.55,
        true,
      );
    }
  }

  for (const cell of getPieceCells(snapshot.active)) {
    if (cell.y >= HIDDEN_ROWS && cell.y < BOARD_HEIGHT) {
      drawBlock(
        target,
        cell.x * CELL_SIZE,
        (cell.y - HIDDEN_ROWS) * CELL_SIZE,
        CELL_SIZE,
        PIECE_COLORS[snapshot.active.type],
      );
    }
  }
}

function drawPreview(canvas: HTMLCanvasElement, type: PieceType | null): void {
  const target = canvas.getContext("2d");
  if (target === null) {
    return;
  }

  target.clearRect(0, 0, canvas.width, canvas.height);
  target.fillStyle = "rgba(7, 9, 20, 0.25)";
  target.fillRect(0, 0, canvas.width, canvas.height);
  if (type === null) {
    return;
  }

  const matrix = matrixForPiece(type, 0);
  const occupied: { x: number; y: number }[] = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      if (matrix[row][column] !== 0) {
        occupied.push({ x: column, y: row });
      }
    }
  }

  const minX = Math.min(...occupied.map((cell) => cell.x));
  const maxX = Math.max(...occupied.map((cell) => cell.x));
  const minY = Math.min(...occupied.map((cell) => cell.y));
  const maxY = Math.max(...occupied.map((cell) => cell.y));
  const size = Math.min(
    22,
    (canvas.width - 28) / (maxX - minX + 1),
    (canvas.height - 18) / (maxY - minY + 1),
  );
  const offsetX = (canvas.width - (maxX - minX + 1) * size) / 2;
  const offsetY = (canvas.height - (maxY - minY + 1) * size) / 2;

  for (const cell of occupied) {
    drawBlock(
      target,
      offsetX + (cell.x - minX) * size,
      offsetY + (cell.y - minY) * size,
      size,
      PIECE_COLORS[type],
    );
  }
}

function render(): void {
  const snapshot = game.getSnapshot();
  drawBoard();
  drawPreview(holdCanvas, snapshot.hold);
  snapshot.next.forEach((type, index) => {
    const canvas = nextCanvases[index];
    if (canvas !== undefined) {
      drawPreview(canvas, type);
    }
  });

  scoreValue.textContent = String(snapshot.score).padStart(6, "0");
  linesValue.textContent = String(snapshot.lines);
  levelValue.textContent = String(snapshot.level);

  if (snapshot.gameOver) {
    overlay.hidden = false;
    overlayTitle.textContent = "Game over";
    overlayMessage.textContent = "Press R or Restart to play again.";
    statusMessage.textContent = "";
  } else if (snapshot.paused) {
    overlay.hidden = false;
    overlayTitle.textContent = "Paused";
    overlayMessage.textContent = "Press P to resume.";
    statusMessage.textContent = "";
  } else {
    overlay.hidden = true;
    const clear = snapshot.lastClear;
    if (clear !== null && clear.lines > 0) {
      const label = clear.tSpin ? "T-spin" : clear.lines + "-line clear";
      statusMessage.textContent = clear.perfectClear ? label + " · Perfect clear!" : label;
    } else if (snapshot.combo > 0) {
      statusMessage.textContent = snapshot.combo + " combo";
    } else {
      statusMessage.textContent = "";
    }
  }
}

function restart(): void {
  game.reset();
  previousFrame = performance.now();
  render();
}

function handleKey(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();
  let handled = true;

  switch (key) {
    case "arrowleft":
      game.move(-1);
      break;
    case "arrowright":
      game.move(1);
      break;
    case "arrowup":
    case "x":
      game.rotate(1);
      break;
    case "z":
    case "control":
      game.rotate(-1);
      break;
    case "arrowdown":
      game.softDrop();
      break;
    case " ":
    case "spacebar":
      game.hardDrop();
      break;
    case "c":
      game.holdPiece();
      break;
    case "p":
      game.togglePause();
      break;
    case "r":
      restart();
      break;
    default:
      handled = false;
  }

  if (handled) {
    event.preventDefault();
    render();
  }
}

function animationFrame(now: number): void {
  const delta = Math.min(100, Math.max(0, now - previousFrame));
  previousFrame = now;
  game.tick(delta);
  render();
  window.requestAnimationFrame(animationFrame);
}

window.addEventListener("keydown", handleKey, { passive: false });
restartButton.addEventListener("click", restart);
render();
window.requestAnimationFrame(animationFrame);
