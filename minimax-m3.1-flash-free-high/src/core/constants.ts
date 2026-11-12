/**
 * Board geometry and gameplay constants (Tetris Guideline).
 *
 * The board keeps `HIDDEN_ROWS` rows above the visible playfield so that
 * pieces can spawn (and rotate) above the top of the screen.
 */

/** Number of visible columns. */
export const BOARD_WIDTH = 10;
/** Number of visible rows. */
export const VISIBLE_HEIGHT = 20;
/** Rows above the visible playfield used for spawning. */
export const HIDDEN_ROWS = 2;
/** Total number of rows handled by the board. */
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;
/** Index of the first visible row inside the board array. */
export const FIRST_VISIBLE_ROW = HIDDEN_ROWS;

/** Time a piece may rest on the stack before it locks (ms). */
export const LOCK_DELAY = 500;
/** Maximum number of times move/rotate may reset the lock delay. */
export const MAX_LOCK_RESETS = 15;
/** Time between two soft drop steps (ms). */
export const SOFT_DROP_INTERVAL = 20;
/** Points awarded for a single soft dropped cell. */
export const SOFT_DROP_POINTS = 1;
/** Points awarded for a single hard dropped cell. */
export const HARD_DROP_POINTS = 2;
/** Highest reachable level. */
export const MAX_LEVEL = 20;
/** Number of lines required to advance one level. */
export const LINES_PER_LEVEL = 10;

/** Delay before auto repeat starts while a direction is held (ms). */
export const DAS = 150;
/** Interval between auto repeats while a direction is held (ms). */
export const ARR = 33;

/** Multiplier applied to a back-to-back difficult clear. */
export const B2B_MULTIPLIER = 1.5;
/** Points awarded per combo step (multiplied by level). */
export const COMBO_POINTS = 50;
