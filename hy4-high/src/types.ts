/** Shared, DOM-free types for the rules engine. */

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** A board cell: a locked tetromino type, or null when empty. */
export type Cell = PieceType | null;

/** Board matrix indexed as cells[y][x]. */
export type Matrix = Cell[][];

export interface Point {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  /** Rotation state 0..3 = spawn, right, two, left. */
  rotation: number;
  /** Bounding-box left / top in board cells (may be negative). */
  x: number;
  y: number;
}

/** A wall-kick offset in board coordinates (x right, y down). */
export type Kick = readonly [number, number];

export type TSpin = 'none' | 'mini' | 'full';

export interface ClearResult {
  lines: number;
  tSpin: TSpin;
  perfectClear: boolean;
}

export interface ClearSummary {
  points: number;
  label: string;
  lines: number;
}
