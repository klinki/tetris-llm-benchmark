/**
 * Shared types of the game. Kept in one tiny module so the engine, the
 * renderer and the tests can talk about the same vocabulary.
 */

/** The seven tetrominoes. Order is only relevant for the 7-bag shuffle. */
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** Super Rotation System state: 0 spawn, 1 right, 2 upside down, 3 left. */
export type Rotation = 0 | 1 | 2 | 3;

/** A single block of a piece, in its own local grid (y grows downwards). */
export interface Cell {
  readonly x: number;
  readonly y: number;
}

/** T-Spin detection result. */
export type TSpinKind = 'none' | 'mini' | 'full';

/** How a line clear is being built up: T-Spin flavours first, then plain clears. */
export type ClearKind = 'line' | 'tspin' | 'tspin-mini';

/** Lifecycle of a game session. */
export type GameState = 'playing' | 'paused' | 'gameover';