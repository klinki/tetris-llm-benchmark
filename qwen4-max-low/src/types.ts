// Shared type definitions for the Tetris logic.

/** The seven guideline tetrominoes. */
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/**
 * SRS rotation states.
 * 0 = spawn, 1 = R (one clockwise), 2 = 180, 3 = L (one counter-clockwise).
 */
export type Rotation = 0 | 1 | 2 | 3;

/** A cell coordinate. x grows to the right, y grows downward. */
export interface Vec {
  x: number;
  y: number;
}

/** A piece in play: its type, rotation and top-left position on the board. */
export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** A single cell in a rotation state, relative to the piece bounding box. */
export type Cell = readonly [number, number];

/** The four rotation states of a piece, each a list of four cells. */
export type RotationStates = readonly [readonly Cell[], readonly Cell[], readonly Cell[], readonly Cell[]];

/** A board grid cell: null when empty, otherwise the piece type that filled it. */
export type GridCell = PieceType | null;

export type GamePhase = "playing" | "gameover";

/** Snapshot of stats the renderer needs. */
export interface GameStats {
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: boolean;
}
