import {
  COLS,
  ROWS,
  HIDDEN_ROWS,
  NEXT_COUNT,
  TetrisGame,
  getCells,
  type PieceType,
} from "./tetris.js";

export const COLORS: Record<PieceType, string> = {
  I: "#00e5ee",
  O: "#f6d500",
  T: "#b14be0",
  S: "#00d000",
  Z: "#f04040",
  J: "#3b5bff",
  L: "#ff8c1a",
};

const CELL = 30;
const W = COLS * CELL;
const H = (ROWS - HIDDEN_ROWS) * CELL;

const game = new TetrisGame();

const boardCanvas = document.getElementById("board") as HTMLCanvasElement;
const holdCanvas = document.getElementById("hold") as HTMLCanvasElement;
const nextCanvas = document.getElementById("next") as HTMLCanvasElement;
const scoreEl = document.getElementById("score") as HTMLElement;
const linesEl = document.getElementById("lines") as HTMLElement;
const levelEl = document.getElementById("level") as HTMLElement;

boardCanvas.width = W;
boardCanvas.height = H;
const ctx = boardCanvas.getContext("2d")!;

function drawCell(g: CanvasRenderingContext2D, x: number, y: number, color: string, ghost = false): void {
  const px = x * CELL;
  const py = y * CELL;
  if (ghost) {
    g.strokeStyle = color;
    g.globalAlpha = 0.7;
    g.lineWidth = 2;
    g.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
    g.globalAlpha = 0.22;
    g.fillStyle = color;
    g.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
    g.globalAlpha = 1;
  } else {
    g.fillStyle = color;
    g.fillRect(px, py, CELL, CELL);
    g.fillStyle = "rgba(255,255,255,0.28)";
    g.fillRect(px, py, CELL, 4);
    g.fillRect(px, py, 4, CELL);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(px, py + CELL - 4, CELL, 4);
    g.fillRect(px + CELL - 4, py, 4, CELL);
  }
}

function drawMini(g: CanvasRenderingContext2D, type: PieceType | null, canvas: HTMLCanvasElement): void {
  const w = canvas.width;
  const h = canvas.height;
  g.clearRect(0, 0, w, h);
  if (!type) return;
  const cells = getCells(type, 0);
  let minX = 99;
  let maxX = -99;
  let minY = 99;
  let maxY = -99;
  for (const [x, y] of cells) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const s = Math.min(24, (w - 16) / bw, 28 / bh);
  const ox = (w - bw * s) / 2;
  const oy = (h - bh * s) / 2;
  g.fillStyle = COLORS[type];
  for (const [x, y] of cells) {
    g.fillRect(ox + (x - minX) * s, oy + (y - minY) * s, s - 1, s - 1);
  }
}

function render(): void {
  ctx.fillStyle = "#11131a";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 1; x < COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, H);
    ctx.stroke();
  }
  for (let y = 1; y < ROWS - HIDDEN_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(W, y * CELL + 0.5);
    ctx.stroke();
  }

  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = game.board[y][x];
      if (c !== 0) drawCell(ctx, x, y - HIDDEN_ROWS, COLORS[c]);
    }
  }

  if (game.active) {
    const color = COLORS[game.active.type];
    for (const [x, y] of game.ghostCells()) {
      const vy = y - HIDDEN_ROWS;
      if (vy >= 0) drawCell(ctx, x, vy, color, true);
    }
    for (const [x, y] of game.activeCells()) {
      const vy = y - HIDDEN_ROWS;
      if (vy >= 0) drawCell(ctx, x, vy, color);
    }
  }

  if (game.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.fillText("GAME OVER", W / 2, H / 2 - 10);
    ctx.font = "15px system-ui, sans-serif";
    ctx.fillStyle = "#ccc";
    ctx.fillText("press R to restart", W / 2, H / 2 + 22);
  }

  scoreEl.textContent = String(game.score);
  linesEl.textContent = String(game.lines);
  levelEl.textContent = String(game.level);

  const hg = holdCanvas.getContext("2d")!;
  drawMini(hg, game.holdType, holdCanvas);

  const ng = nextCanvas.getContext("2d")!;
  ng.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const upcoming = game.nextQueue.slice(0, NEXT_COUNT);
  const slotH = nextCanvas.height / NEXT_COUNT;
  upcoming.forEach((t, i) => {
    const cells = getCells(t, 0);
    let minX = 99;
    let maxX = -99;
    let minY = 99;
    let maxY = -99;
    for (const [x, y] of cells) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const s = Math.min(18, (nextCanvas.width - 16) / bw, (slotH - 8) / bh);
    const ox = (nextCanvas.width - bw * s) / 2;
    const oy = i * slotH + (slotH - bh * s) / 2;
    ng.fillStyle = COLORS[t];
    for (const [x, y] of cells) {
      ng.fillRect(ox + (x - minX) * s, oy + (y - minY) * s, s - 1, s - 1);
    }
  });
}

// ---- input: DAS/ARR auto-shift, soft drop, guideline keys ----
const DAS_MS = 150;
const ARR_MS = 45;
const held = new Map<string, { dir: -1 | 1; since: number; next: number }>();

function pressSide(dir: -1 | 1, code: string): void {
  game.move(dir, 0);
  held.set(code, { dir, since: performance.now(), next: performance.now() + DAS_MS });
}

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  switch (e.code) {
    case "ArrowLeft":
      pressSide(-1, e.code);
      break;
    case "ArrowRight":
      pressSide(1, e.code);
      break;
    case "ArrowDown":
      game.softDropping = true;
      game.move(0, 1);
      break;
    case "ArrowUp":
    case "KeyX":
      game.rotate(1);
      break;
    case "KeyZ":
      game.rotate(-1);
      break;
    case "ControlLeft":
      game.rotate(-1);
      break;
    case "Space":
      game.hardDrop();
      break;
    case "KeyC":
      game.hold();
      break;
    case "KeyR":
      game.reset();
      held.clear();
      break;
  }
  render();
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") held.delete(e.code);
  if (e.code === "ArrowDown") game.softDropping = false;
});
window.addEventListener("blur", () => {
  held.clear();
  game.softDropping = false;
});

let last = performance.now();
function loop(now: number): void {
  const dt = now - last;
  last = now;
  for (const [code, h] of held) {
    if (now - h.since >= DAS_MS && now >= h.next) {
      game.move(h.dir, 0);
      h.next = now + ARR_MS;
      held.set(code, h);
    }
  }
  game.tick(dt);
  render();
  requestAnimationFrame(loop);
}

render();
requestAnimationFrame(loop);
