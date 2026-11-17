/** Playfield and timing constants (Tetris Guideline). */

export const COLS = 10;
/** Total rows, including the hidden rows above the visible field. */
export const ROWS = 22;
/** Rows above the visible playfield; pieces spawn here. */
export const HIDDEN = 2;
export const VISIBLE = ROWS - HIDDEN;

/** Lock delay in ms: a grounded piece locks after this long without a reset. */
export const LOCK_DELAY = 500;
/** Guideline "move reset": at most this many lock-delay resets per piece. */
export const MAX_LOCK_RESETS = 15;

/** Delayed auto-shift / auto-repeat rate for horizontal movement (ms). */
export const DAS = 167;
export const ARR = 40;

/** Number of pieces shown in the next queue. */
export const NEXT_COUNT = 5;

/** Size of a board cell in CSS pixels. */
export const CELL = 30;
/** Size of a cell in the hold / next panels. */
export const PANEL_CELL = 24;