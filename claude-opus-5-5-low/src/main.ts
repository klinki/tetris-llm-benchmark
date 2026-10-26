// Browser entry: input handling and canvas rendering.
import { COLS, Game, HIDDEN_ROWS, Piece, ROWS, VISIBLE_ROWS } from "./game.js";
import { COLORS, PieceType, SHAPES } from "./pieces.js";

const CELL = 30;
const SIDE = 6 * CELL;
const FIELD_X = SIDE;
const WIDTH = SIDE * 2 + COLS * CELL;
const HEIGHT = VISIBLE_ROWS * CELL;
const DAS = 170; // ms before auto-repeat starts
const ARR = 50; // ms between auto-repeat moves

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const dpr = window.devicePixelRatio || 1;
canvas.width = WIDTH * dpr;
canvas.height = HEIGHT * dpr;
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
ctx.scale(dpr, dpr);

const game = new Game();
let paused = false;

// --- Input ---------------------------------------------------------------

/** Horizontal auto-shift state: the most recently pressed direction wins. */
const held = { left: false, right: false };
let shiftDir = 0;
let shiftTimer = 0;
let dasCharged = false;

function startShift(dir: number): void {
  shiftDir = dir;
  shiftTimer = 0;
  dasCharged = false;
  game.move(dir);
}

function updateShift(dt: number): void {
  if (shiftDir === 0) return;
  shiftTimer += dt;
  if (!dasCharged) {
    if (shiftTimer < DAS) return;
    dasCharged = true;
    shiftTimer -= DAS;
    game.move(shiftDir);
  }
  while (shiftTimer >= ARR) {
    shiftTimer -= ARR;
    if (!game.move(shiftDir)) break;
  }
}

window.addEventListener("keydown", (e) => {
  const handled = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code);
  if (handled) e.preventDefault();
  if (e.code === "KeyR" && game.gameOver) { game.reset(); return; }
  if (e.code === "KeyP" || e.code === "Escape") { paused = !paused; return; }
  if (e.repeat || paused || game.gameOver) return;
  switch (e.code) {
    case "ArrowLeft": held.left = true; startShift(-1); break;
    case "ArrowRight": held.right = true; startShift(1); break;
    case "ArrowDown": game.softDrop = true; break;
    case "ArrowUp": case "KeyX": game.rotate(1); break;
    case "KeyZ": case "ControlLeft": game.rotate(-1); break;
    case "Space": game.hardDrop(); break;
    case "KeyC": case "ShiftLeft": game.holdPiece(); break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "ArrowLeft":
      held.left = false;
      if (held.right) startShift(1); else if (shiftDir < 0) shiftDir = 0;
      break;
    case "ArrowRight":
      held.right = false;
      if (held.left) startShift(-1); else if (shiftDir > 0) shiftDir = 0;
      break;
    case "ArrowDown": game.softDrop = false; break;
  }
});

window.addEventListener("blur", () => {
  held.left = held.right = false;
  shiftDir = 0;
  game.softDrop = false;
});

// --- Rendering -----------------------------------------------------------

function drawCell(x: number, y: number, color: string, size = CELL, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x, y, size, size * 0.15);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  ctx.globalAlpha = 1;
}

function drawPiece(p: Piece, alpha = 1, outline = false): void {
  for (const [x, y] of game.cells(p)) {
    if (y < HIDDEN_ROWS) continue;
    const px = FIELD_X + x * CELL;
    const py = (y - HIDDEN_ROWS) * CELL;
    if (outline) {
      ctx.strokeStyle = COLORS[p.type];
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
      ctx.lineWidth = 1;
    } else {
      drawCell(px, py, COLORS[p.type], CELL, alpha);
    }
  }
}

/** Draw a piece preview centered in a box at (x, y). */
function drawPreview(type: PieceType, x: number, y: number, size: number, dim = false): void {
  const cells = SHAPES[type][0];
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const w = Math.max(...xs) - Math.min(...xs) + 1;
  const h = Math.max(...ys) - Math.min(...ys) + 1;
  const ox = x + (4 - w) * size / 2 - Math.min(...xs) * size;
  const oy = y + (2 - h) * size / 2 - Math.min(...ys) * size;
  for (const [cx, cy] of cells) drawCell(ox + cx * size, oy + cy * size, dim ? "#555" : COLORS[type], size);
}

function text(str: string, x: number, y: number, size = 16, align: CanvasTextAlign = "left"): void {
  ctx.fillStyle = "#eee";
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

function render(): void {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Playfield
  ctx.fillStyle = "#000";
  ctx.fillRect(FIELD_X, 0, COLS * CELL, HEIGHT);
  ctx.strokeStyle = "#1c1c1c";
  for (let x = 1; x < COLS; x++) {
    ctx.beginPath(); ctx.moveTo(FIELD_X + x * CELL + 0.5, 0); ctx.lineTo(FIELD_X + x * CELL + 0.5, HEIGHT); ctx.stroke();
  }
  for (let y = 1; y < VISIBLE_ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(FIELD_X, y * CELL + 0.5); ctx.lineTo(FIELD_X + COLS * CELL, y * CELL + 0.5); ctx.stroke();
  }
  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = game.board[y][x];
      if (c) drawCell(FIELD_X + x * CELL, (y - HIDDEN_ROWS) * CELL, COLORS[c]);
    }
  }
  if (!game.gameOver) {
    drawPiece(game.ghost(), 1, true);
    drawPiece(game.current);
  }

  // Hold (left panel)
  const small = CELL * 0.75;
  text("HOLD", 20, 30);
  if (game.hold) drawPreview(game.hold, 20, 45, small, !game.canHold);

  text("SCORE", 20, 160);
  text(String(game.score), 20, 185, 22);
  text("LEVEL", 20, 225);
  text(String(game.level), 20, 250, 22);
  text("LINES", 20, 290);
  text(String(game.lines), 20, 315, 22);
  if (game.lastClear) {
    const c = game.lastClear;
    const names = ["", "Single", "Double", "Triple", "Tetris"];
    const label = (c.tSpin === "full" ? "T-Spin " : c.tSpin === "mini" ? "Mini T-Spin " : "") + names[c.lines];
    text(label.trim(), 20, 370, 14);
    if (c.backToBack) text("Back-to-Back", 20, 390, 14);
    if (c.combo > 0) text(`Combo ×${c.combo}`, 20, 410, 14);
  }

  // Next queue (right panel)
  const nx = FIELD_X + COLS * CELL + 20;
  text("NEXT", nx, 30);
  game.queue.forEach((t, i) => drawPreview(t, nx, 45 + i * small * 3, small));

  if (game.gameOver || paused) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(FIELD_X, 0, COLS * CELL, HEIGHT);
    const cx = FIELD_X + (COLS * CELL) / 2;
    text(game.gameOver ? "GAME OVER" : "PAUSED", cx, HEIGHT / 2 - 10, 32, "center");
    text(game.gameOver ? "Press R to restart" : "Press P to resume", cx, HEIGHT / 2 + 25, 16, "center");
  }
}

// --- Main loop -------------------------------------------------------------

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100);
  last = now;
  if (!paused && !game.gameOver) {
    updateShift(dt);
    game.update(dt);
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
