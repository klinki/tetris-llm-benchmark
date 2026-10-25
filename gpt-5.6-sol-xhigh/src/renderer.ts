import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  getPieceCells,
  PIECE_COLORS,
  type ActivePiece,
  type GameSnapshot,
  type PieceKind
} from "./game.js";

interface RendererElements {
  gameCanvas: HTMLCanvasElement;
  holdCanvas: HTMLCanvasElement;
  nextCanvas: HTMLCanvasElement;
  score: HTMLElement;
  lines: HTMLElement;
  level: HTMLElement;
  best: HTMLElement;
  status: HTMLElement;
  holdNote: HTMLElement;
  streakLabel: HTMLElement;
  streakValue: HTMLElement;
  eventToast: HTMLElement;
}

function rgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function prepareCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported.");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return context;
}

function drawBlock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
  ghost = false
): void {
  const gap = Math.max(1, size * 0.075);
  const px = x * size + gap;
  const py = y * size + gap;
  const side = size - gap * 2;

  context.save();
  context.globalAlpha = alpha;
  if (ghost) {
    context.strokeStyle = rgba(color, 0.68);
    context.lineWidth = Math.max(1.2, size * 0.07);
    context.setLineDash([size * 0.16, size * 0.12]);
    context.strokeRect(px + 1, py + 1, side - 2, side - 2);
  } else {
    context.shadowColor = rgba(color, 0.36);
    context.shadowBlur = size * 0.28;
    context.fillStyle = color;
    context.fillRect(px, py, side, side);
    context.shadowBlur = 0;
    const gradient = context.createLinearGradient(px, py, px, py + side);
    gradient.addColorStop(0, "rgba(255,255,255,0.25)");
    gradient.addColorStop(0.18, "rgba(255,255,255,0.04)");
    gradient.addColorStop(1, "rgba(0,0,0,0.2)");
    context.fillStyle = gradient;
    context.fillRect(px, py, side, side);
    context.fillStyle = "rgba(255,255,255,0.2)";
    context.fillRect(px + gap, py + gap, side - gap * 2, Math.max(1, gap * 0.75));
  }
  context.restore();
}

export class GameRenderer {
  private elements: RendererElements;
  private lastEventId = 0;
  private best = 0;

  constructor(elements: RendererElements, best: number) {
    this.elements = elements;
    this.best = best;
  }

  render(snapshot: GameSnapshot): void {
    this.drawBoard(snapshot);
    this.drawPreview(this.elements.holdCanvas, snapshot.hold ? [snapshot.hold] : [], snapshot.holdUsed);
    this.drawPreview(this.elements.nextCanvas, snapshot.next, false);
    this.updateText(snapshot);

    if (snapshot.event.id !== this.lastEventId) {
      this.lastEventId = snapshot.event.id;
      if (snapshot.event.label !== "LOCKED" && snapshot.event.label !== "READY") this.showEvent(snapshot.event.label);
    }
  }

  private drawBoard(snapshot: GameSnapshot): void {
    const canvas = this.elements.gameCanvas;
    const context = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cellSize = width / BOARD_WIDTH;

    const background = context.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#0b0e1c");
    background.addColorStop(1, "#070912");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(143, 161, 225, 0.052)";
    context.lineWidth = 1;
    for (let x = 1; x < BOARD_WIDTH; x += 1) {
      context.beginPath();
      context.moveTo(Math.round(x * cellSize) + 0.5, 0);
      context.lineTo(Math.round(x * cellSize) + 0.5, height);
      context.stroke();
    }
    for (let y = 1; y < BOARD_HEIGHT; y += 1) {
      context.beginPath();
      context.moveTo(0, Math.round(y * cellSize) + 0.5);
      context.lineTo(width, Math.round(y * cellSize) + 0.5);
      context.stroke();
    }

    snapshot.board.forEach((row, y) => row.forEach((kind, x) => {
      if (kind) drawBlock(context, x, y, cellSize, PIECE_COLORS[kind]);
    }));

    if (snapshot.active && snapshot.ghostY !== null) {
      const ghost: ActivePiece = { ...snapshot.active, y: snapshot.ghostY };
      for (const [x, y] of getPieceCells(ghost)) {
        if (y >= 0) drawBlock(context, x, y, cellSize, PIECE_COLORS[ghost.kind], 1, true);
      }
      for (const [x, y] of getPieceCells(snapshot.active)) {
        if (y >= 0) drawBlock(context, x, y, cellSize, PIECE_COLORS[snapshot.active.kind]);
      }
    }

    if (snapshot.paused || snapshot.gameOver) {
      context.fillStyle = "rgba(5, 7, 16, 0.78)";
      context.fillRect(0, 0, width, height);
      context.textAlign = "center";
      context.fillStyle = "#f6f7ff";
      context.font = `800 ${Math.max(18, width * 0.075)}px system-ui, sans-serif`;
      context.fillText(snapshot.gameOver ? "TOP OUT" : "PAUSED", width / 2, height * 0.46);
      context.fillStyle = "#7f89a8";
      context.font = `600 ${Math.max(10, width * 0.035)}px system-ui, sans-serif`;
      context.fillText(snapshot.gameOver ? "Press R to restart" : "Press P or Esc to resume", width / 2, height * 0.51);
    }
  }

  private drawPreview(canvas: HTMLCanvasElement, kinds: PieceKind[], muted: boolean): void {
    const context = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const slots = Math.max(1, kinds.length);
    const slotHeight = height / slots;

    kinds.forEach((kind, index) => {
      if (index > 0) {
        context.strokeStyle = "rgba(170, 184, 255, 0.07)";
        context.beginPath();
        context.moveTo(14, index * slotHeight + 0.5);
        context.lineTo(width - 14, index * slotHeight + 0.5);
        context.stroke();
      }
      const cells = getPieceCells({ kind, x: 0, y: 0, rotation: 0 });
      const minX = Math.min(...cells.map(([x]) => x));
      const maxX = Math.max(...cells.map(([x]) => x));
      const minY = Math.min(...cells.map(([, y]) => y));
      const maxY = Math.max(...cells.map(([, y]) => y));
      const pieceWidth = maxX - minX + 1;
      const pieceHeight = maxY - minY + 1;
      const size = Math.min(24, width / 5.8, slotHeight / 3.4);
      const startX = (width - pieceWidth * size) / 2;
      const startY = index * slotHeight + (slotHeight - pieceHeight * size) / 2;
      for (const [x, y] of cells) {
        drawBlock(context, startX / size + x - minX, startY / size + y - minY, size, PIECE_COLORS[kind], muted ? 0.35 : 0.92);
      }
    });
  }

  private updateText(snapshot: GameSnapshot): void {
    this.best = Math.max(this.best, snapshot.score);
    this.elements.score.textContent = snapshot.score.toLocaleString("en-US");
    this.elements.lines.textContent = String(snapshot.lines);
    this.elements.level.textContent = String(snapshot.level);
    this.elements.best.textContent = this.best.toLocaleString("en-US");
    this.elements.holdNote.textContent = snapshot.holdUsed ? "Available after this piece" : "Pocket one for later";

    if (snapshot.gameOver) this.elements.status.textContent = "Top out";
    else if (snapshot.paused) this.elements.status.textContent = "Paused";
    else this.elements.status.textContent = "Live game";

    if (snapshot.combo > 0) {
      this.elements.streakLabel.textContent = snapshot.backToBack ? "Back-to-back" : "Combo running";
      this.elements.streakValue.textContent = `${snapshot.combo + 1}× chain`;
    } else if (snapshot.backToBack) {
      this.elements.streakLabel.textContent = "Difficult clear";
      this.elements.streakValue.textContent = "Back-to-back ready";
    } else {
      this.elements.streakLabel.textContent = "Build your stack";
      this.elements.streakValue.textContent = "No combo";
    }
  }

  private showEvent(label: string): void {
    const toast = this.elements.eventToast;
    toast.textContent = label;
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
  }
}
