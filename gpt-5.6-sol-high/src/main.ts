import {
  BOARD_WIDTH,
  cellsFor,
  HIDDEN_ROWS,
  type ActivePiece,
  type Cell,
  type GameSnapshot,
  type PieceType,
  TetrisGame,
  VISIBLE_HEIGHT,
} from "./game.js";

const COLORS: Record<PieceType, string> = {
  I: "#43dff4",
  J: "#5775f5",
  L: "#ff9c3d",
  O: "#ffd84a",
  S: "#5bdd7d",
  T: "#b76cff",
  Z: "#ff5f73",
};

const canvas = requireElement<HTMLCanvasElement>("#board");
const context = getContext(canvas);

const holdCanvas = requireElement<HTMLCanvasElement>("#hold-piece");
const nextCanvas = requireElement<HTMLCanvasElement>("#next-pieces");
const holdContext = getContext(holdCanvas);
const nextContext = getContext(nextCanvas);
const scoreElement = requireElement<HTMLElement>("#score");
const levelElement = requireElement<HTMLElement>("#level");
const linesElement = requireElement<HTMLElement>("#lines");
const statusElement = requireElement<HTMLElement>("#status-message");
const overlay = requireElement<HTMLElement>("#overlay");
const overlayTitle = requireElement<HTMLElement>("#overlay-title");
const overlayCopy = requireElement<HTMLElement>("#overlay-copy");
const restartButton = requireElement<HTMLButtonElement>("#restart-button");
const resumeButton = requireElement<HTMLButtonElement>("#overlay-resume");
const pauseButton = requireElement<HTMLButtonElement>("#pause-button");

const game = new TetrisGame();
let previousTime = performance.now();
let repeatAction: (() => void) | null = null;
let repeatDelay = 0;
let repeatInterval = 0;

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function getContext(target: HTMLCanvasElement): CanvasRenderingContext2D {
  const targetContext = target.getContext("2d");
  if (!targetContext) throw new Error("Canvas 2D is not supported");
  return targetContext;
}

function frame(now: number): void {
  const delta = now - previousTime;
  previousTime = now;
  game.update(delta);
  if (repeatAction) {
    repeatDelay -= delta;
    if (repeatDelay <= 0) {
      repeatInterval -= delta;
      if (repeatInterval <= 0) {
        repeatAction();
        repeatInterval = 45;
      }
    }
  }
  draw(game.snapshot);
  requestAnimationFrame(frame);
}

function draw(snapshot: GameSnapshot): void {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cellSize = cssWidth / BOARD_WIDTH;
  context.clearRect(0, 0, cssWidth, cssHeight);

  const gradient = context.createLinearGradient(0, 0, 0, cssHeight);
  gradient.addColorStop(0, "#111b33");
  gradient.addColorStop(1, "#080d1d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, cssWidth, cssHeight);

  context.strokeStyle = "rgba(166, 190, 255, 0.065)";
  context.lineWidth = 1;
  for (let x = 1; x < BOARD_WIDTH; x += 1) {
    context.beginPath();
    context.moveTo(x * cellSize, 0);
    context.lineTo(x * cellSize, cssHeight);
    context.stroke();
  }
  for (let y = 1; y < VISIBLE_HEIGHT; y += 1) {
    context.beginPath();
    context.moveTo(0, y * cellSize);
    context.lineTo(cssWidth, y * cellSize);
    context.stroke();
  }

  for (let y = HIDDEN_ROWS; y < snapshot.board.length; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const type = snapshot.board[y]![x];
      if (type) drawCell(context, x * cellSize, (y - HIDDEN_ROWS) * cellSize, cellSize, COLORS[type]);
    }
  }

  const ghost: ActivePiece = { ...snapshot.active, y: snapshot.ghostY };
  context.globalAlpha = 0.22;
  for (const { x, y } of cellsFor(ghost)) {
    if (y >= HIDDEN_ROWS) drawCell(context, x * cellSize, (y - HIDDEN_ROWS) * cellSize, cellSize, COLORS[ghost.type], true);
  }
  context.globalAlpha = 1;

  for (const { x, y } of cellsFor(snapshot.active)) {
    if (y >= HIDDEN_ROWS) drawCell(context, x * cellSize, (y - HIDDEN_ROWS) * cellSize, cellSize, COLORS[snapshot.active.type]);
  }

  drawSidePiece(holdContext, holdCanvas, snapshot.held);
  drawQueue(nextContext, nextCanvas, snapshot.next);
  scoreElement.textContent = snapshot.score.toLocaleString();
  levelElement.textContent = String(snapshot.level).padStart(2, "0");
  linesElement.textContent = String(snapshot.lines).padStart(2, "0");
  statusElement.textContent = statusText(snapshot);

  overlay.hidden = snapshot.status === "playing";
  if (snapshot.status === "over") {
    overlayTitle.textContent = "Game over";
    overlayCopy.textContent = `You cleared ${snapshot.lines} line${snapshot.lines === 1 ? "" : "s"} and scored ${snapshot.score.toLocaleString()}.`;
    restartButton.hidden = false;
    resumeButton.hidden = true;
  } else if (snapshot.status === "paused") {
    overlayTitle.textContent = "Paused";
    overlayCopy.textContent = "Press P or tap resume when you're ready.";
    restartButton.hidden = true;
    resumeButton.hidden = false;
  }
  pauseButton.textContent = snapshot.status === "paused" ? "Resume" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(snapshot.status === "paused"));
}

function drawCell(
  target: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  outline = false,
): void {
  const inset = Math.max(1.5, size * 0.055);
  const radius = size * 0.13;
  roundedRect(target, x + inset, y + inset, size - inset * 2, size - inset * 2, radius);
  if (outline) {
    target.strokeStyle = color;
    target.lineWidth = Math.max(2, size * 0.07);
    target.stroke();
    return;
  }
  const gradient = target.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, lighten(color, 18));
  gradient.addColorStop(0.55, color);
  gradient.addColorStop(1, darken(color, 20));
  target.fillStyle = gradient;
  target.fill();
  target.strokeStyle = "rgba(255,255,255,.28)";
  target.lineWidth = 1;
  target.stroke();
}

function roundedRect(target: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  target.beginPath();
  target.roundRect(x, y, width, height, radius);
}

function drawSidePiece(target: CanvasRenderingContext2D, targetCanvas: HTMLCanvasElement, type: PieceType | null): void {
  resizeCanvas(targetCanvas, target);
  target.clearRect(0, 0, targetCanvas.clientWidth, targetCanvas.clientHeight);
  if (!type) return;
  drawMiniPiece(target, targetCanvas.clientWidth, targetCanvas.clientHeight, type, 0);
}

function drawQueue(target: CanvasRenderingContext2D, targetCanvas: HTMLCanvasElement, types: readonly PieceType[]): void {
  resizeCanvas(targetCanvas, target);
  target.clearRect(0, 0, targetCanvas.clientWidth, targetCanvas.clientHeight);
  const slotHeight = targetCanvas.clientHeight / 5;
  types.slice(0, 5).forEach((type, index) => drawMiniPiece(target, targetCanvas.clientWidth, slotHeight, type, index * slotHeight));
}

function drawMiniPiece(target: CanvasRenderingContext2D, width: number, height: number, type: PieceType, offsetY: number): void {
  const blocks = cellsFor({ type, x: 0, y: 0, rotation: 0 });
  const minX = Math.min(...blocks.map((p) => p.x));
  const maxX = Math.max(...blocks.map((p) => p.x));
  const minY = Math.min(...blocks.map((p) => p.y));
  const maxY = Math.max(...blocks.map((p) => p.y));
  const size = Math.min(width / 5.2, height / 3.2);
  const pieceWidth = (maxX - minX + 1) * size;
  const pieceHeight = (maxY - minY + 1) * size;
  const startX = (width - pieceWidth) / 2 - minX * size;
  const startY = offsetY + (height - pieceHeight) / 2 - minY * size;
  blocks.forEach(({ x, y }) => drawCell(target, startX + x * size, startY + y * size, size, COLORS[type]));
}

function resizeCanvas(targetCanvas: HTMLCanvasElement, target: CanvasRenderingContext2D): void {
  const dpr = window.devicePixelRatio || 1;
  if (targetCanvas.width !== targetCanvas.clientWidth * dpr || targetCanvas.height !== targetCanvas.clientHeight * dpr) {
    targetCanvas.width = targetCanvas.clientWidth * dpr;
    targetCanvas.height = targetCanvas.clientHeight * dpr;
  }
  target.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function statusText(snapshot: GameSnapshot): string {
  if (snapshot.status === "over") return "Ready for another round?";
  if (snapshot.status === "paused") return "The stack can wait.";
  if (snapshot.lastClear === "none") return "Find your flow.";
  const label = snapshot.lastClear.replaceAll("-", " ");
  const extras = [snapshot.backToBack ? "back to back" : "", snapshot.combo > 0 ? `${snapshot.combo + 1}× combo` : ""].filter(Boolean);
  return `${label}${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
}

function lighten(hex: string, amount: number): string {
  return adjust(hex, amount);
}

function darken(hex: string, amount: number): string {
  return adjust(hex, -amount);
}

function adjust(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
  return `rgb(${r} ${g} ${b})`;
}

const handledKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "x", "X", "z", "Z", "Control", "c", "C", "p", "P", "r", "R"]);

document.addEventListener("keydown", (event) => {
  if (handledKeys.has(event.key)) event.preventDefault();
  if (event.repeat) return;
  switch (event.key) {
    case "ArrowLeft": startRepeat(() => game.move(-1)); break;
    case "ArrowRight": startRepeat(() => game.move(1)); break;
    case "ArrowDown": startRepeat(() => game.softDrop()); break;
    case "ArrowUp": case "x": case "X": game.rotate(1); break;
    case "z": case "Z": case "Control": game.rotate(-1); break;
    case " ": game.hardDrop(); break;
    case "c": case "C": game.hold(); break;
    case "p": case "P": game.togglePause(); break;
    case "r": case "R": if (game.status === "over") game.restart(); break;
  }
});

document.addEventListener("keyup", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowDown"].includes(event.key)) stopRepeat();
});

window.addEventListener("blur", () => {
  stopRepeat();
  if (game.status === "playing") game.togglePause();
});

function startRepeat(action: () => void): void {
  repeatAction = action;
  action();
  repeatDelay = 140;
  repeatInterval = 0;
}

function stopRepeat(): void {
  repeatAction = null;
}

document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
  const action = button.dataset.action;
  const perform = (): void => {
    if (action === "left") game.move(-1);
    else if (action === "right") game.move(1);
    else if (action === "down") game.softDrop();
    else if (action === "rotate-ccw") game.rotate(-1);
    else if (action === "rotate-cw") game.rotate(1);
    else if (action === "drop") game.hardDrop();
    else if (action === "hold") game.hold();
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (["left", "right", "down"].includes(action ?? "")) startRepeat(perform);
    else perform();
  });
  button.addEventListener("pointerup", stopRepeat);
  button.addEventListener("pointercancel", stopRepeat);
});

pauseButton.addEventListener("click", () => game.togglePause());
restartButton.addEventListener("click", () => game.restart());
resumeButton.addEventListener("click", () => game.togglePause());

draw(game.snapshot);
requestAnimationFrame(frame);
