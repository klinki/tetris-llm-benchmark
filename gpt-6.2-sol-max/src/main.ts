import {
  cellsFor, Game, HEIGHT, LINES_PER_LEVEL, PIECES, PREVIEW_COUNT, WIDTH,
  type Action, type GameStatus, type Piece, type PieceKind,
} from "./game.js";

const game = new Game();

function byId<Element extends HTMLElement = HTMLElement>(id: string): Element {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as Element;
}

function make<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, className: string): HTMLElementTagNameMap[Tag] {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

const board = byId("board");
const boardCells = Array.from({ length: WIDTH * HEIGHT }, () => make("span", "cell"));
board.style.setProperty("--columns", String(WIDTH));
board.style.setProperty("--rows", String(HEIGHT));
board.append(...boardCells);

const holdPreview = byId("hold-preview");
const nextPreviews = Array.from({ length: PREVIEW_COUNT }, () => {
  const item = document.createElement("li");
  const preview = make("div", "piece-slot");
  preview.setAttribute("role", "img");
  item.append(preview);
  byId("next-previews").append(item);
  return preview;
});

const scoreText = byId("score");
const linesText = byId("lines");
const levelText = byId("level");
const levelProgress = byId<HTMLProgressElement>("level-progress");
levelProgress.max = LINES_PER_LEVEL;
const streakText = byId("streak");
const statusBadge = byId("status");
const statusText = byId("status-text");
const playToggle = byId<HTMLButtonElement>("play-toggle");
const playLabel = byId("play-label");
const playIcon = byId("play-icon");
const overlay = byId("overlay");
const overlayTitle = byId("overlay-title");
const overlayAction = byId<HTMLButtonElement>("overlay-action");
const touchButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-action]")];
const scoreFormat = new Intl.NumberFormat();

const STATUS_DISPLAY: Record<GameStatus, { status: string; action: string; icon: string }> = {
  ready: { status: "Ready", action: "Play", icon: "▶" },
  playing: { status: "Playing", action: "Pause", icon: "Ⅱ" },
  paused: { status: "Paused", action: "Resume", icon: "▶" },
  "game-over": { status: "Game over", action: "Restart", icon: "↻" },
};

function paintPiece(frame: string[], piece: Piece | null, appearance: string): void {
  if (!piece) return;
  for (const [dx, dy] of cellsFor(piece.kind, piece.rotation)) {
    frame[(piece.y + dy) * WIDTH + piece.x + dx] = `cell ${appearance} piece-${piece.kind}`;
  }
}

function paintBoard(): void {
  const frame = game.board.flat().map((kind) => kind ? `cell tile piece-${kind}` : "cell");
  paintPiece(frame, game.ghost, "ghost");
  paintPiece(frame, game.active, "tile falling");
  boardCells.forEach((cell, index) => {
    if (cell.className !== frame[index]) cell.className = frame[index];
  });
}

function paintPreview(slot: HTMLElement, kind: PieceKind | null): void {
  const key = kind ?? "";
  if (slot.dataset.kind === key) return;
  slot.dataset.kind = key;
  slot.setAttribute("aria-label", kind ? PIECES[kind].name : "Empty");

  if (!kind) {
    const empty = make("span", "empty-slot");
    empty.textContent = "Empty";
    slot.replaceChildren(empty);
    return;
  }

  const cells = cellsFor(kind);
  const xMin = Math.min(...cells.map(([x]) => x));
  const yMin = Math.min(...cells.map(([, y]) => y));
  const width = Math.max(...cells.map(([x]) => x)) - xMin + 1;
  const height = Math.max(...cells.map(([, y]) => y)) - yMin + 1;
  const shape = make("span", `mini-shape piece-${kind}`);
  shape.style.setProperty("--shape-width", String(width));
  shape.style.setProperty("--shape-height", String(height));
  shape.setAttribute("aria-hidden", "true");
  for (const [x, y] of cells) {
    const tile = make("span", "tile");
    tile.style.gridColumn = String(x - xMin + 1);
    tile.style.gridRow = String(y - yMin + 1);
    shape.append(tile);
  }
  slot.replaceChildren(shape);
}

function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}

function render(): void {
  paintBoard();
  paintPreview(holdPreview, game.held);
  game.next.forEach((kind, index) => paintPreview(nextPreviews[index], kind));
  holdPreview.classList.toggle("used", !game.canHold);
  setText(scoreText, scoreFormat.format(game.score));
  setText(linesText, String(game.lines));
  setText(levelText, String(game.level));
  levelProgress.value = game.lines % LINES_PER_LEVEL;
  streakText.hidden = game.streak < 2;
  setText(streakText, game.streak >= 2 ? `${game.streak}× streak` : "");

  const display = STATUS_DISPLAY[game.status];
  const showOverlay = game.status === "paused" || game.status === "game-over";
  statusBadge.dataset.status = game.status;
  setText(statusText, display.status);
  setText(playLabel, display.action);
  setText(playIcon, display.icon);
  overlay.hidden = !showOverlay;
  setText(overlayTitle, display.status);
  setText(overlayAction, display.action);
  for (const button of touchButtons) {
    button.disabled = showOverlay || (button.dataset.action === "hold" && !game.canHold);
  }
}

const KEY_ACTIONS = new Map<string, Action>([
  ["arrowleft", "left"], ["arrowright", "right"],
  ["arrowup", "clockwise"], ["x", "clockwise"],
  ["z", "counterclockwise"], ["ControlLeft", "counterclockwise"],
  ["arrowdown", "soft-drop"], [" ", "hard-drop"], ["c", "hold"],
]);

const REPEAT: Partial<Record<Action, { delay: number; interval: number }>> = {
  left: { delay: 155, interval: 45 },
  right: { delay: 155, interval: 45 },
  "soft-drop": { delay: 55, interval: 42 },
};

const heldInputs = new Map<string, { action: Action; next: number; interval: number }>();
let frameId: number | null = null;
let lastFrame = 0;

function syncClock(): void {
  if (game.status === "playing") {
    if (frameId === null) {
      lastFrame = performance.now();
      frameId = requestAnimationFrame(onFrame);
    }
  } else {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    heldInputs.clear();
  }
}

function onFrame(now: number): void {
  let changed = game.advance(Math.min(now - lastFrame, 100));
  lastFrame = now;
  for (const input of heldInputs.values()) {
    if (now < input.next) continue;
    changed = game.act(input.action) || changed;
    input.next = now + input.interval;
  }
  if (changed) render();

  frameId = game.status === "playing" ? requestAnimationFrame(onFrame) : null;
  if (frameId === null) heldInputs.clear();
}

function dispatch(action: Action): void {
  const started = game.status === "ready";
  if (started) game.start();
  if (game.act(action) || started) render();
  syncClock();
}

function press(input: string, action: Action): void {
  dispatch(action);
  const repeat = REPEAT[action];
  if (repeat && game.status === "playing") {
    heldInputs.set(input, { action, next: performance.now() + repeat.delay, interval: repeat.interval });
  }
}

function start(): void {
  game.start();
  render();
  syncClock();
  board.focus({ preventScroll: true });
}

function pause(): void {
  game.pause();
  render();
  syncClock();
}

function togglePlay(): void {
  if (game.status === "playing") pause();
  else start();
}

playToggle.addEventListener("click", togglePlay);
overlayAction.addEventListener("click", start);

window.addEventListener("keydown", (event) => {
  const leftControl = event.code === "ControlLeft";
  if (event.altKey || event.metaKey || (event.ctrlKey && !leftControl)) return;

  const key = leftControl ? "ControlLeft" : event.key.toLowerCase();
  if (key === "r" && game.status === "game-over") {
    event.preventDefault();
    if (!event.repeat) start();
    return;
  }
  if (key === "escape" && (game.status === "playing" || game.status === "paused")) {
    event.preventDefault();
    if (!event.repeat) togglePlay();
    return;
  }

  const action = KEY_ACTIONS.get(key);
  if (!action || (key === " " && event.target instanceof HTMLButtonElement)) return;
  event.preventDefault();
  if (!event.repeat) press(event.code || key, action);
});

window.addEventListener("keyup", (event) => heldInputs.delete(event.code || event.key.toLowerCase()));
window.addEventListener("blur", () => heldInputs.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.status === "playing") pause();
});

for (const button of touchButtons) {
  const action = button.dataset.action as Action;
  if (REPEAT[action]) {
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      button.setPointerCapture(event.pointerId);
      press(`pointer-${event.pointerId}`, action);
    });
    for (const end of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
      button.addEventListener(end, (event) => heldInputs.delete(`pointer-${event.pointerId}`));
    }
  }
  button.addEventListener("click", (event) => {
    // Repeating controls already handle a pointer press. Keyboard clicks have no click count.
    if (!REPEAT[action] || event.detail === 0) dispatch(action);
  });
}

render();
