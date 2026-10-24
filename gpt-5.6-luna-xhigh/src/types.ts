export const PIECE_TYPES = ["I", "O", "T", "S", "Z", "J", "L"] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Rotation = 0 | 1 | 2 | 3;

export interface Point {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export interface GameState {
  board: (PieceType | null)[][];
  active: ActivePiece | null;
  ghostY: number | null;
  next: PieceType[];
  hold: PieceType | null;
  holdUsed: boolean;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
}
