/** The seven tetrominoes. */
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** SRS rotation states: 0 = spawn, 1 = right (clockwise), 2 = 180, 3 = left (counter-clockwise). */
export type Rotation = 0 | 1 | 2 | 3;

/** A cell inside a piece's rotation box. */
export interface Cell {
  x: number;
  y: number;
}

/** A piece currently in play. */
export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** Semantic game actions produced by the input layer. */
export type Action =
  | 'left'
  | 'right'
  | 'rotateCW'
  | 'rotateCCW'
  | 'softDrop'
  | 'hardDrop'
  | 'hold'
  | 'restart';
