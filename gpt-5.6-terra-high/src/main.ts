import { COLORS, HEIGHT, HIDDEN_ROWS, TetrisGame, WIDTH, type Cell } from "./game.js";

const game = new TetrisGame();
const boardEl = document.querySelector<HTMLElement>("#board")!;
const nextEl = document.querySelector<HTMLElement>("#next")!;
const holdEl = document.querySelector<HTMLElement>("#hold")!;
const scoreEl = document.querySelector<HTMLElement>("#score")!;
const linesEl = document.querySelector<HTMLElement>("#lines")!;
const levelEl = document.querySelector<HTMLElement>("#level")!;
const overlayEl = document.querySelector<HTMLElement>("#overlay")!;

let last = performance.now(), gravityElapsed = 0, lockElapsed = 0, lockResets = 0;
const boardCells: HTMLElement[] = [];
for (let i = 0; i < (HEIGHT - HIDDEN_ROWS) * WIDTH; i++) { const cell = document.createElement("div"); cell.className = "cell"; boardEl.append(cell); boardCells.push(cell); }

function preview(type: string | null): string {
  if (!type) return "<span class=empty>—</span>";
  const color = COLORS[type as keyof typeof COLORS];
  return `<span class=mini style="--piece:${color}">${type}</span>`;
}
function paint(cell: HTMLElement, type: Cell, ghost = false): void {
  cell.className = `cell${type ? " filled" : ""}${ghost ? " ghost" : ""}`;
  cell.style.setProperty("--piece", type ? COLORS[type] : "transparent");
}
function render(): void {
  const display = game.board.map(row => [...row]);
  const ghost = { ...game.active, y: game.ghostY() };
  for (const [x, y] of game.cells(ghost)) if (y >= HIDDEN_ROWS && !display[y][x]) display[y][x] = game.active.type;
  for (const [x, y] of game.cells()) if (y >= HIDDEN_ROWS) display[y][x] = game.active.type;
  for (let y = HIDDEN_ROWS; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const index = (y - HIDDEN_ROWS) * WIDTH + x;
    const isGhost = game.ghostY() !== game.active.y && !game.board[y][x] && game.cells(ghost).some(([gx, gy]) => gx === x && gy === y) && !game.cells().some(([ax, ay]) => ax === x && ay === y);
    paint(boardCells[index], display[y][x], isGhost);
  }
  holdEl.innerHTML = preview(game.held);
  nextEl.innerHTML = game.queue.slice(0, 5).map(piece => preview(piece)).join("");
  scoreEl.textContent = game.score.toLocaleString(); linesEl.textContent = String(game.lines); levelEl.textContent = String(game.level);
  overlayEl.classList.toggle("show", game.gameOver);
}
function resetTimers(): void { gravityElapsed = 0; lockElapsed = 0; lockResets = 0; }
function touchingGround(): boolean { return !game.fits({ ...game.active, y: game.active.y + 1 }); }
function action(callback: () => boolean): void {
  const wasGrounded = touchingGround();
  if (callback()) { if (wasGrounded && lockResets < 15) { lockElapsed = 0; lockResets++; } render(); }
}
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "x", "z", "c", "r", "control"].includes(key)) event.preventDefault();
  if (game.gameOver) { if (key === "r") { game.restart(); resetTimers(); render(); } return; }
  switch (key) {
    case "arrowleft": action(() => game.move(-1)); break;
    case "arrowright": action(() => game.move(1)); break;
    case "arrowup": case "x": action(() => game.rotate(1)); break;
    case "z": case "control": action(() => game.rotate(-1)); break;
    case "arrowdown": game.softDrop(); render(); break;
    case " ": game.hardDrop(); resetTimers(); render(); break;
    case "c": action(() => game.hold()); break;
  }
});
function tick(now: number): void {
  const elapsed = Math.min(now - last, 100); last = now;
  if (!game.gameOver) {
    gravityElapsed += elapsed;
    if (gravityElapsed >= game.gravityMs()) { gravityElapsed = 0; if (game.move(0, 1)) lockElapsed = 0; render(); }
    if (touchingGround()) { lockElapsed += elapsed; if (lockElapsed >= 500) { game.lock(); resetTimers(); render(); } } else lockElapsed = 0;
  }
  requestAnimationFrame(tick);
}
render(); requestAnimationFrame(tick);
