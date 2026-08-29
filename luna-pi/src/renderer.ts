import { BOARD_HEIGHT, BOARD_WIDTH, PIECE_COLORS, SHAPES } from "./constants.js";
import { getCells } from "./pieces.js";
import type { ActivePiece, GameSnapshot, PieceType } from "./types.js";

const CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 24;
const EMPTY_COLOR = "#101522";

export class Renderer {
  private readonly boardContext: CanvasRenderingContext2D;
  private readonly holdContext: CanvasRenderingContext2D;
  private readonly nextContext: CanvasRenderingContext2D;
  private readonly scoreElement: HTMLElement;
  private readonly linesElement: HTMLElement;
  private readonly levelElement: HTMLElement;
  private readonly comboElement: HTMLElement;
  private readonly overlay: HTMLElement;

  public constructor(
    boardCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    scoreElement: HTMLElement,
    linesElement: HTMLElement,
    levelElement: HTMLElement,
    comboElement: HTMLElement,
    overlay: HTMLElement,
  ) {
    const boardContext = boardCanvas.getContext("2d");
    const holdContext = holdCanvas.getContext("2d");
    const nextContext = nextCanvas.getContext("2d");
    if (!boardContext || !holdContext || !nextContext) {
      throw new Error("Canvas rendering is not available in this browser");
    }

    this.boardContext = boardContext;
    this.holdContext = holdContext;
    this.nextContext = nextContext;
    this.scoreElement = scoreElement;
    this.linesElement = linesElement;
    this.levelElement = levelElement;
    this.comboElement = comboElement;
    this.overlay = overlay;

    boardCanvas.width = BOARD_WIDTH * CELL_SIZE;
    boardCanvas.height = BOARD_HEIGHT * CELL_SIZE;
    holdCanvas.width = PREVIEW_CELL_SIZE * 4;
    holdCanvas.height = PREVIEW_CELL_SIZE * 4;
    nextCanvas.width = PREVIEW_CELL_SIZE * 4;
    // Five previews are stacked vertically in one canvas.
    nextCanvas.height = PREVIEW_CELL_SIZE * 4 * 5;
    this.configureContext(this.boardContext);
    this.configureContext(this.holdContext);
    this.configureContext(this.nextContext);
  }

  public render(snapshot: GameSnapshot): void {
    this.drawBoard(snapshot);
    this.drawPreview(this.holdContext, snapshot.hold, 0, !snapshot.canHold && snapshot.hold !== null);
    this.clearCanvas(this.nextContext);
    snapshot.next.forEach((type, index) => {
      this.drawPreview(this.nextContext, type, index * PREVIEW_CELL_SIZE * 4, false);
    });

    this.scoreElement.textContent = snapshot.score.toLocaleString();
    this.linesElement.textContent = String(snapshot.lines);
    this.levelElement.textContent = String(snapshot.level);
    this.comboElement.textContent = snapshot.combo > 0 ? `x${snapshot.combo + 1}` : "—";
    this.overlay.classList.toggle("is-visible", snapshot.gameOver);
  }

  private drawBoard(snapshot: GameSnapshot): void {
    const context = this.boardContext;
    this.clearCanvas(context);

    context.strokeStyle = "#202a3d";
    context.lineWidth = 1;
    for (let column = 0; column <= BOARD_WIDTH; column += 1) {
      const x = column * CELL_SIZE + 0.5;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, BOARD_HEIGHT * CELL_SIZE);
      context.stroke();
    }
    for (let row = 0; row <= BOARD_HEIGHT; row += 1) {
      const y = row * CELL_SIZE + 0.5;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(BOARD_WIDTH * CELL_SIZE, y);
      context.stroke();
    }

    for (let row = 0; row < snapshot.board.length; row += 1) {
      for (let column = 0; column < snapshot.board[row].length; column += 1) {
        const type = snapshot.board[row][column];
        if (type !== null) {
          this.drawCell(context, column, row, type, CELL_SIZE);
        }
      }
    }

    this.drawGhost(context, snapshot.ghost);
    this.drawPiece(context, snapshot.current, CELL_SIZE);
  }

  private drawGhost(context: CanvasRenderingContext2D, piece: ActivePiece): void {
    context.save();
    context.globalAlpha = 0.7;
    for (const cell of getCells(piece)) {
      if (cell.row >= 0 && cell.row < BOARD_HEIGHT && cell.column >= 0 && cell.column < BOARD_WIDTH) {
        const x = cell.column * CELL_SIZE;
        const y = cell.row * CELL_SIZE;
        context.strokeStyle = PIECE_COLORS[piece.type];
        context.lineWidth = 2;
        context.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
      }
    }
    context.restore();
  }

  private drawPiece(context: CanvasRenderingContext2D, piece: ActivePiece, size: number): void {
    for (const cell of getCells(piece)) {
      if (cell.row >= 0 && cell.row < BOARD_HEIGHT && cell.column >= 0 && cell.column < BOARD_WIDTH) {
        this.drawCell(context, cell.column, cell.row, piece.type, size);
      }
    }
  }

  private drawCell(context: CanvasRenderingContext2D, column: number, row: number, type: PieceType, size: number): void {
    const x = column * size;
    const y = row * size;
    const inset = Math.max(1, Math.round(size * 0.08));
    const color = PIECE_COLORS[type];

    context.fillStyle = color;
    context.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.24)";
    context.fillRect(x + inset + 2, y + inset + 2, size - inset * 2 - 4, Math.max(2, size * 0.12));
    context.strokeStyle = "rgba(0, 0, 0, 0.28)";
    context.lineWidth = 1;
    context.strokeRect(x + inset + 0.5, y + inset + 0.5, size - inset * 2 - 1, size - inset * 2 - 1);
  }

  private drawPreview(
    context: CanvasRenderingContext2D,
    type: PieceType | null,
    offsetY: number,
    muted: boolean,
  ): void {
    this.clearCanvas(context, offsetY, PREVIEW_CELL_SIZE * 4);
    if (type === null) {
      return;
    }

    const shape = SHAPES[type][0];
    const occupied = shape.flatMap((row, rowIndex) =>
      row.map((filled, columnIndex) => (filled ? { row: rowIndex, column: columnIndex } : null)).filter(
        (cell): cell is { row: number; column: number } => cell !== null,
      ),
    );
    if (occupied.length === 0) {
      return;
    }

    const minColumn = Math.min(...occupied.map((cell) => cell.column));
    const maxColumn = Math.max(...occupied.map((cell) => cell.column));
    const minRow = Math.min(...occupied.map((cell) => cell.row));
    const maxRow = Math.max(...occupied.map((cell) => cell.row));
    const pieceWidth = maxColumn - minColumn + 1;
    const pieceHeight = maxRow - minRow + 1;
    const startColumn = (4 - pieceWidth) / 2 - minColumn;
    const startRow = (4 - pieceHeight) / 2 - minRow;

    context.save();
    context.globalAlpha = muted ? 0.38 : 1;
    for (const cell of occupied) {
      this.drawCell(
        context,
        startColumn + cell.column,
        offsetY / PREVIEW_CELL_SIZE + startRow + cell.row,
        type,
        PREVIEW_CELL_SIZE,
      );
    }
    context.restore();
  }

  private configureContext(context: CanvasRenderingContext2D): void {
    context.imageSmoothingEnabled = false;
  }

  private clearCanvas(context: CanvasRenderingContext2D, offsetY = 0, height?: number): void {
    context.clearRect(0, offsetY, context.canvas.width, height ?? context.canvas.height);
    context.fillStyle = EMPTY_COLOR;
    context.fillRect(0, offsetY, context.canvas.width, height ?? context.canvas.height);
  }
}
