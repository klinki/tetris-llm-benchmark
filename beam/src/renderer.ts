import { PIECE_COLORS, SHAPES, type PieceName } from "./pieces.js";
import { COLS, ROWS, TOTAL_ROWS, type Board, type PieceState } from "./board.js";

const CELL = 20;

export function drawBoard(ctx: CanvasRenderingContext2D, board: Board) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
  // visible rows: TOTAL_ROWS-ROWS .. TOTAL_ROWS-1
  const offset = TOTAL_ROWS - ROWS;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v = board[y + offset][x];
      if (v !== 0) {
        ctx.fillStyle = colorFor(v);
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        ctx.strokeStyle = "#222";
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }
}

function colorFor(v: number): string {
  const names: PieceName[] = ["T", "J", "L", "S", "Z", "I", "O"];
  // v is piece id 1..7
  const name = names[v - 1];
  return PIECE_COLORS[name];
}

export function drawPiece(ctx: CanvasRenderingContext2D, state: PieceState, offsetY: number = 0, ghost = false) {
  const shape = SHAPES[state.piece][state.rot];
  const offset = TOTAL_ROWS - ROWS;
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx] === 0) continue;
      const x = state.x + dx;
      const y = state.y + dy - offset + offsetY; // offsetY adjust for ghost?
      // We'll handle positions directly
    }
  }
}

// Simpler: render piece at board coords with visible offset
export function drawPieceAt(ctx: CanvasRenderingContext2D, state: PieceState, ghost = false, overrideY?: number) {
  const shape = SHAPES[state.piece][state.rot];
  const visOffset = TOTAL_ROWS - ROWS;
  const yBase = overrideY !== undefined ? overrideY : state.y;
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx] === 0) continue;
      const x = state.x + dx;
      const y = yBase + dy - visOffset;
      if (y < 0 || y >= ROWS) continue;
      if (ghost) {
        ctx.strokeStyle = PIECE_COLORS[state.piece];
        ctx.lineWidth = 2;
        ctx.strokeRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
      } else {
        ctx.fillStyle = PIECE_COLORS[state.piece];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        ctx.strokeStyle = "#222";
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }
}

export function drawMini(ctx: CanvasRenderingContext2D, name: PieceName | null, x0 = 0, y0 = 0) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!name) return;
  const shape = SHAPES[name][0];
  const size = 20;
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx] === 0) continue;
      ctx.fillStyle = PIECE_COLORS[name];
      ctx.fillRect((dx + 1) * (size / 2) + x0, (dy + 1) * (size / 2) + y0, size / 2, size / 2);
    }
  }
}

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
