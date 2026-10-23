/** Game geometry and tuning constants. */

/** Visible playfield size. */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/** Hidden rows above the visible playfield, used as the spawn buffer. */
export const BUFFER_ROWS = 3;
export const FIELD_HEIGHT = BOARD_HEIGHT + BUFFER_ROWS;

/** Simulation runs at a fixed 60 fps; gravity values are expressed in frames. */
export const TICK_MS = 1000 / 60;

/** How long a grounded piece may sit before it locks. */
export const LOCK_DELAY_MS = 500;
/** Guideline limit on lock-delay resets from player movement/rotation. */
export const MAX_LOCK_RESETS = 15;

/** Number of upcoming pieces shown in the next queue. */
export const NEXT_QUEUE_SIZE = 3;

/** Rows required to advance one level. */
export const LINES_PER_LEVEL = 10;

/** Gravity in frames per grid cell, indexed by `level - 1` (level 1..25). */
export const GRAVITY_FRAMES = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
  5, 5, 4, 4, 4, 3, 3, 3, 2, 2,
  2, 2, 2, 2, 1,
];

/** Score awarded per cell travelled while soft/hard dropping. */
export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

/** Guideline line clear scores, indexed by number of lines (0..4). */
export const LINE_SCORES = [0, 100, 300, 500, 800];

/** Guideline combo bonus per consecutive clear. */
export const COMBO_SCORE = 50;
