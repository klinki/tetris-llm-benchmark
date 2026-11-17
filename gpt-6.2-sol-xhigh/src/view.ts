import { HEIGHT, HIDDEN_ROWS, LINES_PER_LEVEL, MAX_LEVEL, WIDTH } from "./game.js";
import type { Game } from "./game.js";
import { SHAPES } from "./pieces.js";
import type { Kind, Piece } from "./pieces.js";

export type Mode = "ready" | "playing" | "paused" | "over";

const statusText: Record<Mode, string> = {
  ready: "Ready", playing: "In play", paused: "Paused", over: "Game over",
};

const number = new Intl.NumberFormat("en");

export function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing game element: ${id}`);
  return found as T;
}

function preview(kind: Kind): HTMLSpanElement {
  const shape = SHAPES[kind][0];
  const left = Math.min(...shape.map(([x]) => x));
  const top = Math.min(...shape.map(([, y]) => y));
  const piece = document.createElement("span");
  piece.className = "piece-preview";
  piece.dataset.piece = kind;
  piece.setAttribute("role", "img");
  piece.setAttribute("aria-label", `${kind} piece`);

  for (const [x, y] of shape) {
    const mino = document.createElement("span");
    mino.className = "mino";
    mino.style.gridColumn = String(x - left + 1);
    mino.style.gridRow = String(y - top + 1);
    piece.append(mino);
  }
  return piece;
}

export class View {
  readonly board = element("board");
  readonly activate = element<HTMLButtonElement>("activate");
  readonly pause = element<HTMLButtonElement>("pause");

  private readonly status = element("status");
  private readonly overlay = element("overlay");
  private readonly overlayTitle = element("overlay-title");
  private readonly activateLabel = element("activate-label");
  private readonly activateKey = element("activate-key");
  private readonly pauseLabel = element("pause-label");
  private readonly score = element("score");
  private readonly level = element("level");
  private readonly lines = element("lines");
  private readonly progress = element<HTMLProgressElement>("progress");
  private readonly progressLabel = element("progress-label");
  private readonly progressValue = element("progress-value");
  private readonly hold = element("hold");
  private readonly next = element("next");

  private readonly cells: HTMLElement[];
  private readonly frame: (Kind | null)[] = Array(WIDTH * HEIGHT).fill(null);
  private readonly ghostCells = new Set<number>();
  private heldKind: Kind | null | undefined;
  private nextKinds = "";
  private displayedScore = -1;
  private displayedLines = -1;

  constructor() {
    this.cells = Array.from({ length: WIDTH * HEIGHT }, () => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("aria-hidden", "true");
      return cell;
    });
    this.board.append(...this.cells);
  }

  setMode(mode: Mode): void {
    this.status.dataset.state = mode;
    this.status.textContent = statusText[mode];
    this.overlay.hidden = mode === "playing";
    this.pause.disabled = mode === "ready" || mode === "over";
    this.pause.dataset.paused = String(mode === "paused");
    this.pauseLabel.textContent = mode === "paused" ? "Resume" : "Pause";

    this.overlayTitle.hidden = mode === "ready" || mode === "playing";
    this.overlayTitle.textContent = statusText[mode];
    this.activateLabel.textContent = mode === "over" ? "Play again" :
      mode === "paused" ? "Resume game" : "Start game";
    this.activateKey.textContent = mode === "over" ? "R" : "Enter";
  }

  render(game: Game): void {
    this.renderBoard(game);

    if (this.displayedScore !== game.score) {
      this.score.textContent = number.format(game.score);
      this.displayedScore = game.score;
    }

    if (this.displayedLines !== game.lines) {
      this.lines.textContent = number.format(game.lines);
      this.level.textContent = String(game.level);
      const atMax = game.level === MAX_LEVEL;
      const count = atMax ? LINES_PER_LEVEL : game.lines % LINES_PER_LEVEL;
      this.progress.value = count;
      this.progressLabel.textContent = atMax ? "Max level" : "Next level";
      this.progressValue.textContent = atMax ? "" : `${count} / ${LINES_PER_LEVEL}`;
      this.displayedLines = game.lines;
    }

    if (this.heldKind !== game.held) {
      this.hold.replaceChildren(game.held ? preview(game.held) : "Empty");
      this.hold.dataset.filled = String(game.held !== null);
      this.heldKind = game.held;
    }
    const used = String(!game.canHold);
    if (this.hold.dataset.used !== used) this.hold.dataset.used = used;

    const next = game.next.join("");
    if (this.nextKinds !== next) {
      this.next.replaceChildren(...game.next.map((kind) => {
        const slot = document.createElement("li");
        slot.className = "queue-slot";
        slot.append(preview(kind));
        return slot;
      }));
      this.nextKinds = next;
    }
  }

  private renderBoard(game: Game): void {
    for (let y = 0; y < HEIGHT; y++) {
      const row = game.board[y + HIDDEN_ROWS];
      for (let x = 0; x < WIDTH; x++) this.frame[y * WIDTH + x] = row[x];
    }
    this.ghostCells.clear();
    this.paintPiece(game.ghost(), true);
    this.paintPiece(game.active, false);

    for (const [i, cell] of this.cells.entries()) {
      const kind = this.frame[i];
      if (kind && cell.dataset.piece !== kind) cell.dataset.piece = kind;
      if (!kind && cell.hasAttribute("data-piece")) cell.removeAttribute("data-piece");
      cell.classList.toggle("ghost", this.ghostCells.has(i));
    }
  }

  private paintPiece(piece: Piece | null, ghost: boolean): void {
    if (!piece) return;
    for (const [dx, dy] of SHAPES[piece.kind][piece.rotation]) {
      const y = piece.y + dy;
      if (y < 0) continue;
      const index = y * WIDTH + piece.x + dx;
      this.frame[index] = piece.kind;
      if (ghost) this.ghostCells.add(index);
      else this.ghostCells.delete(index);
    }
  }
}
