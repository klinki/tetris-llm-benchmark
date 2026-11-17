import { ShapeId } from './constants';

/** A cell value: null = empty, or a ShapeId string = filled with that piece color. */
export type CellValue = ShapeId | null;

/** The current active piece. */
export interface ActivePiece {
  shape: ShapeId;
  /** Rotation state 0..3 (SRS). */
  rotation: number;
  /** Position of the bounding box origin on the board (col, row). */
  x: number;
  y: number;
}

/** Result of inspecting the board after a lock. */
export interface LockResult {
  linesCleared: number;
  topOut: boolean;
}

/** A generated "frame" describing what to render. */
export interface RenderState {
  board: CellValue[][];
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  hold: ShapeId | null;
  next: ShapeId[];
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  canHold: boolean;
}
