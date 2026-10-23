import { COLORS, PieceType, ROTATIONS } from "./pieces.js";
import { COLS, Game, HIDDEN_ROWS, VISIBLE_ROWS } from "./game.js";

const CELL = 30;
const SIDE = 6 * CELL;
const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = SIDE + COLS * CELL + SIDE;
canvas.height = VISIBLE_ROWS * CELL;
const ctx = canvas.getContext("2d")!;
const FIELD_X = SIDE;

const game = new Game();

const ACTIONS: Record<string, () => void> = {
  ArrowLeft: () => game.move(-1),
  ArrowRight: () => game.move(1),
  ArrowUp: () => game.rotate(1),
  KeyX: () => game.rotate(1),
  KeyZ: () => game.rotate(-1),
  ControlLeft: () => game.rotate(-1),
  Space: () => game.hardDrop(),
  KeyC: () => game.holdPiece(),
  KeyR: () => game.gameOver && game.restart(),
};

window.addEventListener("keydown", (e) => {
  if (!(e.code in ACTIONS) && e.code !== "ArrowDown") return;
  e.preventDefault();
  if (e.code === "ArrowDown") game.setSoftDrop(true);
  else if (!e.repeat || e.code === "ArrowLeft" || e.code === "ArrowRight") ACTIONS[e.code]();
});
window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") game.setSoftDrop(false);
});

function block(x: number, y: number, type: PieceType, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[type];
  ctx.fillRect(x, y, CELL, CELL);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
  ctx.globalAlpha = 1;
}

function preview(type: PieceType | null, x: number, y: number): void {
  if (!type) return;
  const m = ROTATIONS[type][0];
  const size = CELL * 0.8;
  const ox = x + (4 * CELL - m[0].length * size) / 2;
  m.forEach((row, dy) => row.forEach((v, dx) => {
    if (!v) return;
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(ox + dx * size, y + dy * size, size - 1, size - 1);
  }));
}

function text(s: string, x: number, y: number, size = 16, align: CanvasTextAlign = "left"): void {
  ctx.fillStyle = "#fff";
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

function draw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#222";
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(FIELD_X + x * CELL, 0); ctx.lineTo(FIELD_X + x * CELL, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= VISIBLE_ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(FIELD_X, y * CELL); ctx.lineTo(FIELD_X + COLS * CELL, y * CELL); ctx.stroke();
  }

  game.board.forEach((row, y) => row.forEach((c, x) => {
    if (c && y >= HIDDEN_ROWS) block(FIELD_X + x * CELL, (y - HIDDEN_ROWS) * CELL, c);
  }));

  if (!game.gameOver) {
    for (const [x, y] of game.cells(game.ghost())) {
      if (y >= HIDDEN_ROWS) block(FIELD_X + x * CELL, (y - HIDDEN_ROWS) * CELL, game.current.type, 0.25);
    }
  }
  for (const [x, y] of game.cells(game.current)) {
    if (y >= HIDDEN_ROWS) block(FIELD_X + x * CELL, (y - HIDDEN_ROWS) * CELL, game.current.type);
  }

  text("HOLD", CELL / 2, 30);
  preview(game.hold, CELL / 2, 45);
  const rx = FIELD_X + COLS * CELL + CELL / 2;
  text("NEXT", rx, 30);
  game.next.forEach((t, i) => preview(t, rx, 45 + i * 3 * CELL * 0.8));

  text("SCORE", CELL / 2, 300);
  text(String(game.score), CELL / 2, 322);
  text("LEVEL", CELL / 2, 360);
  text(String(game.level), CELL / 2, 382);
  text("LINES", CELL / 2, 420);
  text(String(game.lines), CELL / 2, 442);

  if (game.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(FIELD_X, 0, COLS * CELL, canvas.height);
    const cx = FIELD_X + (COLS * CELL) / 2;
    text("GAME OVER", cx, canvas.height / 2 - 10, 28, "center");
    text("Press R to restart", cx, canvas.height / 2 + 24, 16, "center");
  }
}

let last = performance.now();
function frame(now: number): void {
  game.update(Math.min(now - last, 100));
  last = now;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
