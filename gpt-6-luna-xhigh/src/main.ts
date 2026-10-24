import {
  canPlace,
  cellsFor,
  createGame,
  GameState,
  hardDrop,
  holdPiece,
  moveHorizontal,
  PieceType,
  rotate,
  softDrop,
  updateGame,
  VISIBLE_ROWS,
  HIDDEN_ROWS,
  COLS,
} from "./game.js";

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const context = canvas.getContext("2d")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold-piece")!;
const holdContext = holdCanvas.getContext("2d")!;
const nextCanvases = [...document.querySelectorAll<HTMLCanvasElement>(".next-piece")];
const scoreNode = document.querySelector<HTMLElement>("#score")!;
const linesNode = document.querySelector<HTMLElement>("#lines")!;
const levelNode = document.querySelector<HTMLElement>("#level")!;
const comboNode = document.querySelector<HTMLElement>("#combo")!;
const noticeNode = document.querySelector<HTMLElement>("#notice")!;
const gameOverNode = document.querySelector<HTMLElement>("#game-over")!;
const finalScoreNode = document.querySelector<HTMLElement>("#final-score")!;
const startButton = document.querySelector<HTMLButtonElement>("#restart")!;

let game: GameState = createGame();
let previousFrame = performance.now();
const pressed = new Set<string>();
const repeatTimers = new Map<string, number>();

const COLORS: Record<PieceType, string> = {
  I: "#42d7e8",
  O: "#f7c948",
  T: "#b887ff",
  J: "#6094ff",
  L: "#ff9e56",
  S: "#75dd87",
  Z: "#ff6681",
};

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false): void {
  const inset = Math.max(1, size * 0.055);
  ctx.globalAlpha = ghost ? 0.28 : 1;
  ctx.fillStyle = color;
  ctx.fillRect(x * size + inset, y * size + inset, size - inset * 2, size - inset * 2);
  if (!ghost) {
    ctx.fillStyle = "rgba(255,255,255,.27)";
    ctx.fillRect(x * size + inset, y * size + inset, size - inset * 2, Math.max(2, size * 0.1));
    ctx.fillStyle = "rgba(0,0,0,.16)";
    ctx.fillRect(x * size + inset, y * size + size - inset - Math.max(2, size * 0.09), size - inset * 2, Math.max(2, size * 0.09));
  }
  ctx.globalAlpha = 1;
}

function drawPiece(ctx: CanvasRenderingContext2D, type: PieceType, rotation: number, x: number, y: number, size: number, ghost = false): void {
  for (const [dx, dy] of cellsFor(type, rotation)) drawBlock(ctx, x + dx, y + dy, size, COLORS[type], ghost);
}

function getGhostY(): number {
  const ghost = { ...game.active };
  while (canPlace(game.board, { ...ghost, y: ghost.y + 1 })) ghost.y += 1;
  return ghost.y;
}

function renderBoard(): void {
  const size = canvas.width / COLS;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#11151e";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(255,255,255,.045)";
  context.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 1) {
    context.beginPath();
    context.moveTo(x * size + 0.5, 0);
    context.lineTo(x * size + 0.5, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= VISIBLE_ROWS; y += 1) {
    context.beginPath();
    context.moveTo(0, y * size + 0.5);
    context.lineTo(canvas.width, y * size + 0.5);
    context.stroke();
  }
  for (let y = HIDDEN_ROWS; y < game.board.length; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const type = game.board[y][x];
      if (type) drawBlock(context, x, y - HIDDEN_ROWS, size, COLORS[type]);
    }
  }
  const ghostY = getGhostY();
  for (const [dx, dy] of cellsFor(game.active.type, game.active.rotation)) {
    const ghostBoardY = ghostY + dy;
    if (ghostBoardY >= HIDDEN_ROWS) drawBlock(context, game.active.x + dx, ghostBoardY - HIDDEN_ROWS, size, COLORS[game.active.type], true);
  }
  for (const [dx, dy] of cellsFor(game.active.type, game.active.rotation)) {
    const y = game.active.y + dy;
    if (y >= HIDDEN_ROWS) drawBlock(context, game.active.x + dx, y - HIDDEN_ROWS, size, COLORS[game.active.type]);
  }
  if (game.gameOver) {
    context.fillStyle = "rgba(7,10,16,.72)";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function renderMini(ctx: CanvasRenderingContext2D, type: PieceType | null): void {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!type) return;
  const size = 18;
  const cells = cellsFor(type);
  const width = type === "I" ? 4 : type === "O" ? 4 : 3;
  const height = type === "I" ? 4 : type === "O" ? 3 : 2;
  const left = (canvas.width - width * size) / 2;
  const top = (canvas.height - height * size) / 2;
  for (const [dx, dy] of cells) {
    const px = left + dx * size;
    const py = top + dy * size;
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,.24)";
    ctx.fillRect(px + 1, py + 1, size - 2, 2);
  }
}

function render(): void {
  renderBoard();
  renderMini(holdContext, game.hold);
  nextCanvases.forEach((nextCanvas, index) => renderMini(nextCanvas.getContext("2d")!, game.queue[index] ?? null));
  scoreNode.textContent = game.score.toLocaleString("en-US");
  linesNode.textContent = String(game.lines).padStart(2, "0");
  levelNode.textContent = String(game.level).padStart(2, "0");
  comboNode.textContent = game.combo > 0 ? `×${game.combo + 1}` : "—";
  noticeNode.textContent = game.notice;
  finalScoreNode.textContent = game.score.toLocaleString("en-US");
  noticeNode.classList.toggle("visible", Boolean(game.notice));
  gameOverNode.classList.toggle("visible", game.gameOver);
  document.body.classList.toggle("game-is-over", game.gameOver);
}

function restart(): void {
  game = createGame();
  pressed.clear();
  repeatTimers.clear();
  render();
}

function actionForKey(key: string): (() => void) | null {
  switch (key.toLowerCase()) {
    case "arrowleft": return () => moveHorizontal(game, -1);
    case "arrowright": return () => moveHorizontal(game, 1);
    case "arrowdown": return () => { softDrop(game); };
    case "arrowup":
    case "x": return () => { rotate(game, 1); };
    case "z":
    case "control": return () => { rotate(game, -1); };
    case " ": return () => { hardDrop(game); };
    case "c": return () => { holdPiece(game); };
    default: return null;
  }
}

const repeatable = new Set(["arrowleft", "arrowright", "arrowdown"]);
const repeatDelay = 150;
const repeatRate = 38;

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "control"].includes(key)) event.preventDefault();
  if (key === "r" && game.gameOver) {
    restart();
    return;
  }
  if (pressed.has(key)) return;
  const action = actionForKey(key);
  if (!action) return;
  pressed.add(key);
  action();
  if (repeatable.has(key)) repeatTimers.set(key, repeatDelay);
  render();
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  pressed.delete(key);
  repeatTimers.delete(key);
});

window.addEventListener("blur", () => {
  pressed.clear();
  repeatTimers.clear();
});

function bindButton(selector: string, action: () => void, repeating = false): void {
  const button = document.querySelector<HTMLButtonElement>(selector)!;
  let timer: number | undefined;
  let interval: number | undefined;
  const stop = () => {
    if (timer !== undefined) window.clearTimeout(timer);
    if (interval !== undefined) window.clearInterval(interval);
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    action();
    render();
    if (repeating) {
      timer = window.setTimeout(() => {
        interval = window.setInterval(() => { action(); render(); }, repeatRate);
      }, repeatDelay);
    }
  });
  for (const name of ["pointerup", "pointercancel", "pointerleave"]) button.addEventListener(name, stop);
  button.addEventListener("click", (event) => event.preventDefault());
}

bindButton("#move-left", () => moveHorizontal(game, -1), true);
bindButton("#move-right", () => moveHorizontal(game, 1), true);
bindButton("#soft-drop", () => { softDrop(game); }, true);
bindButton("#rotate-ccw", () => { rotate(game, -1); });
bindButton("#rotate-cw", () => { rotate(game, 1); });
bindButton("#hard-drop", () => { hardDrop(game); });
bindButton("#hold", () => { holdPiece(game); });
startButton.addEventListener("click", restart);

function frame(now: number): void {
  const elapsed = now - previousFrame;
  previousFrame = now;
  for (const key of pressed) {
    if (!repeatable.has(key)) continue;
    const remaining = (repeatTimers.get(key) ?? 0) - elapsed;
    if (remaining <= 0) {
      actionForKey(key)?.();
      repeatTimers.set(key, repeatRate);
    } else repeatTimers.set(key, remaining);
  }
  updateGame(game, elapsed);
  render();
  requestAnimationFrame(frame);
}

render();
requestAnimationFrame(frame);

