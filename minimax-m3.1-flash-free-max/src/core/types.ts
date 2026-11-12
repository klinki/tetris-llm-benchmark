/** The seven tetrominoes. */
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Rotation state: 0 = spawn, 1 = clockwise, 2 = upside down, 3 = counter clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

export type GameStatus = 'playing' | 'paused' | 'gameover';

/** A position relative to the piece bounding box. */
export interface Offset {
  x: number;
  y: number;
}

/**
 * A falling piece. `x` and `y` are the top left corner of the piece bounding
 * box, `y` being counted from the top of the hidden buffer rows.
 */
export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}
