/** Width of the playfield, in cells. */
export const COLS = 10;

/** Height of the visible playfield, in cells. */
export const ROWS = 20;

/**
 * Rows kept above the visible field. Pieces spawn here so that they are
 * allowed to rotate before they become visible.
 */
export const HIDDEN_ROWS = 4;

/** Total amount of rows kept in the board grid. */
export const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

/** Time between a piece coming to rest and being locked, in milliseconds. */
export const LOCK_DELAY_MS = 500;

/** How many times a move or a rotation may postpone the lock delay. */
export const LOCK_RESET_LIMIT = 15;

/** Soft drop is this many times faster than natural gravity. */
export const SOFT_DROP_FACTOR = 20;

/** Fastest soft drop allowed, in milliseconds per row. */
export const MIN_SOFT_DROP_MS = 20;

/** Amount of pieces shown in the next queue. */
export const NEXT_COUNT = 5;

/** Amount of cleared lines needed to reach the next level. */
export const LINES_PER_LEVEL = 10;

/** Delayed auto shift delay, in milliseconds. */
export const DAS_MS = 150;

/** Delayed auto shift repeat rate, in milliseconds. */
export const ARR_MS = 30;

/** Scoring table of the Tetris Guideline. */
export const SCORE = {
  /** Single, double, triple and tetris. */
  lines: [0, 100, 300, 500, 800] as readonly number[],
  /** T-spin without lines, single, double and triple. */
  tspin: [400, 800, 1200, 1600] as readonly number[],
  /** T-spin mini without lines, single and double. */
  tspinMini: [100, 200, 400, 400] as readonly number[],
  /** Bonus for every line cleared in a combo. */
  combo: 50,
  /** Points per row dropped with the soft drop. */
  softDrop: 1,
  /** Points per row dropped with the hard drop. */
  hardDrop: 2,
  /** Perfect clear bonus for single, double, triple and tetris. */
  perfectClear: [0, 800, 1200, 1800, 2000] as readonly number[],
  /** Perfect clear bonus of a back to back tetris. */
  perfectClearB2BTetris: 3200,
  /** Multiplier applied to a difficult clear following a difficult clear. */
  backToBack: 1.5,
};

/**
 * Natural gravity of the Tetris Guideline: the time a piece needs to fall
 * one row, in milliseconds.
 */
export function gravityMs(level: number): number {
  const l = Math.min(Math.max(level, 1), 20);
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1) * 1000;
}
