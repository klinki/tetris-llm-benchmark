/** The seven tetrominoes of the game. */
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Rotation state of a piece, 0 is the spawn state. */
export type Rotation = 0 | 1 | 2 | 3;

/** State of the game. */
export type GameStatus = 'playing' | 'paused' | 'gameover';

/** Kind of T-spin performed by the last locked piece. */
export type TSpinKind = 'full' | 'mini';

/** A single cell of a piece. */
export interface Cell {
  readonly x: number;
  readonly y: number;
}

/** Static definition of a tetromino. */
export interface PieceDef {
  readonly type: PieceType;
  /** Size of the rotation box, 3 for most pieces, 4 for the I and 2 for the O. */
  readonly size: number;
  /** The four rotation states, given in the local box of the piece. */
  readonly states: readonly (readonly Cell[])[];
  readonly color: string;
  readonly spawnX: number;
  readonly spawnY: number;
}

/** The piece that is currently falling. */
export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

/** Description of the last line clear, used to show messages in the UI. */
export interface ClearInfo {
  readonly lines: number;
  readonly tspin: TSpinKind | null;
  readonly combo: number;
  readonly perfectClear: boolean;
  readonly backToBack: boolean;
}
