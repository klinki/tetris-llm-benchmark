/** Playfield geometry (Guideline: 10×20 visible, 2 hidden spawn rows on top). */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = BOARD_HEIGHT - VISIBLE_ROWS;

export const NEXT_QUEUE_SIZE = 5;

/** Timing (milliseconds). */
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_FACTOR = 20;
export const DAS_MS = 170;
export const ARR_MS = 40;

/** Guideline gravity: seconds per row, indexed by level - 1 (capped at the last entry). */
export const GRAVITY_SECONDS_PER_ROW: readonly number[] = [
  1.0, 0.793, 0.6178, 0.4729, 0.3552, 0.262, 0.19, 0.135, 0.0946, 0.0641,
  0.043, 0.0285, 0.0187, 0.0119, 0.0077, 0.0052, 0.0035, 0.0024, 0.0016,
];

export const LINES_PER_LEVEL = 10;

/** Guideline scoring, multiplied by the level at the time of the clear. */
export const LINE_CLEAR_SCORES: readonly number[] = [0, 100, 300, 500, 800];
export const TSPIN_SCORES: readonly number[] = [400, 800, 1200, 1600];
export const TSPIN_MINI_SCORES: readonly number[] = [100, 200, 400, 1600];
export const BACK_TO_BACK_MULTIPLIER = 1.5;
export const COMBO_BONUS_PER_LEVEL = 50;
export const SOFT_DROP_POINTS_PER_CELL = 1;
export const HARD_DROP_POINTS_PER_CELL = 2;
