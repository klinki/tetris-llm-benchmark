export const PIECE_TYPES = ["I", "J", "L", "O", "S", "T", "Z"] as const;

export type PieceType = (typeof PIECE_TYPES)[number];
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = PieceType;
export type Grid = Array<Array<Cell | null>>;

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type TSpinKind = "none" | "mini" | "full";

export interface LockResult {
  linesCleared: number;
  tSpin: TSpinKind;
  perfectClear: boolean;
  scoreAwarded: number;
}

export interface GameSnapshot {
  board: Grid;
  current: ActivePiece;
  ghost: ActivePiece;
  hold: PieceType | null;
  next: PieceType[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  canHold: boolean;
  gameOver: boolean;
}
