export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = PieceType | null;

export interface Vec {
  readonly x: number;
  readonly y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  // Top-left corner of the piece's bounding box on the board.
  x: number;
  y: number;
}

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
