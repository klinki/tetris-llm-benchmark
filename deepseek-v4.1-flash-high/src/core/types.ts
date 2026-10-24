export type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export type Rotation = 0 | 1 | 2 | 3;

export type GameStatus = "playing" | "gameover";

export type TSpinKind = "none" | "mini" | "full";

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  /** Column of the piece bounding box. */
  x: number;
  /** Row of the piece bounding box. */
  y: number;
}

export interface ClearInfo {
  lines: number;
  tspin: TSpinKind;
  perfectClear: boolean;
  points: number;
  combo: number;
  backToBack: boolean;
}
