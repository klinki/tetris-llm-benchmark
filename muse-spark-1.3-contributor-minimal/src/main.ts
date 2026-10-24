import { Game, COLORS, cellsFor, COLS, ROWS, HIDDEN, PieceKind } from "./tetris.js";

const game = new Game();
const board = document.getElementById("board") as HTMLCanvasElement;
const holdC = document.getElementById("hold") as HTMLCanvasElement;
const nextC = document.getElementById("next") as HTMLCanvasElement;
const scoreEl = document.getElementById("score")!;
const levelEl = document.getElementById("level")!;
const linesEl = document.getElementById("lines")!;
const statusEl = document.getElementById("status")!;
const CELL = 30;

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, ghost = false) {
  ctx.fillStyle = ghost ? "transparent" : color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = ghost ? 0.35 : 1;
  if (ghost) { ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2); }
  else { ctx.fillStyle = color; ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2); }
  ctx.globalAlpha = 1;
}

function drawMini(ctx: CanvasRenderingContext2D, kind: PieceKind, ox: number, oy: number, s: number) {
  ctx.fillStyle = COLORS[kind];
  for (const [cx, cy] of cellsFor(kind, 0)) ctx.fillRect(ox + cx * s, oy + cy * s, s - 1, s - 1);
}

function render() {
  const ctx = board.getContext("2d")!;
  ctx.clearRect(0, 0, board.width, board.height);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, board.width, board.height);
  for (let y = HIDDEN; y < ROWS + HIDDEN; y++)
    for (let x = 0; x < COLS; x++) {
      const v = game.grid[y][x];
      if (v) { ctx.fillStyle = COLORS[v as PieceKind]; ctx.fillRect(x * CELL + 1, (y - HIDDEN) * CELL + 1, CELL - 2, CELL - 2); }
    }
  if (game.active) {
    const a = game.active;
    const cells = cellsFor(a.kind, a.rot);
    const gy = game.ghostY();
    ctx.globalAlpha = 0.3; ctx.strokeStyle = COLORS[a.kind];
    for (const [cx, cy] of cells) ctx.strokeRect((a.x + cx) * CELL + 1, (gy + cy - HIDDEN) * CELL + 1, CELL - 2, CELL - 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS[a.kind];
    for (const [cx, cy] of cells) ctx.fillRect((a.x + cx) * CELL + 1, (a.y + cy - HIDDEN) * CELL + 1, CELL - 2, CELL - 2);
  }
  scoreEl.textContent = String(game.score);
  levelEl.textContent = "Level " + game.level;
  linesEl.textContent = "Lines " + game.lines;
  statusEl.textContent = game.over ? "GAME OVER — press R" : "";
  const hc = holdC.getContext("2d")!; hc.clearRect(0, 0, holdC.width, holdC.height);
  if (game.holdKind) drawMini(hc, game.holdKind, 20, 8, 18);
  const nc = nextC.getContext("2d")!; nc.clearRect(0, 0, nextC.width, nextC.height);
  game.queue.slice(0, 5).forEach((k, i) => drawMini(nc, k, 20, 8 + i * 76, 18));
}

let last = performance.now();
function loop(t: number) {
  game.update(Math.min(100, t - last)); last = t;
  render();
  requestAnimationFrame(loop);
}

// DAS / ARR
const held = new Set<string>();
let dasTimer = 0, arrTimer = 0, dasDir = 0;
const DAS = 150, ARR = 40;
setInterval(() => {
  if (game.over || !dasDir) return;
  dasTimer += 20;
  if (dasTimer >= DAS) { arrTimer += 20; while (arrTimer >= ARR) { arrTimer -= ARR; game.move(dasDir, 0); } }
}, 20);

window.addEventListener("keydown", (e) => {
  if (e.repeat) { if (["ArrowLeft","ArrowRight","ArrowDown"].includes(e.key)) e.preventDefault(); return; }
  switch (e.key) {
    case "ArrowLeft": game.move(-1, 0); dasDir = -1; dasTimer = 0; arrTimer = 0; break;
    case "ArrowRight": game.move(1, 0); dasDir = 1; dasTimer = 0; arrTimer = 0; break;
    case "ArrowDown": game.softDrop = true; break;
    case "ArrowUp": case "x": case "X": game.rotate(1); break;
    case "z": case "Z": game.rotate(-1); break;
    case "Control": game.rotate(-1); break;
    case " ": e.preventDefault(); game.hardDropWithScore(); break;
    case "c": case "C": game.hold(); break;
    case "r": case "R": if (game.over) game.reset(); break;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowDown") game.softDrop = false;
  if (e.key === "ArrowLeft" && dasDir === -1) dasDir = 0;
  if (e.key === "ArrowRight" && dasDir === 1) dasDir = 0;
});
void held; void drawCell;
requestAnimationFrame(loop);
