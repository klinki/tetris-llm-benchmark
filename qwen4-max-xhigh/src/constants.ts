// Playfield and timing constants (Tetris Guideline).

export const COLS = 10;
export const VISIBLE_ROWS = 20;
// Two hidden rows above the visible field where pieces spawn.
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export const CELL = 30; // board cell size in CSS pixels
export const PREVIEW_CELL = 20; // cell size for hold / next previews
export const NEXT_COUNT = 5; // pieces shown in the next queue

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15; // move-reset cap per piece
export const CLEAR_ANIM_MS = 180; // line-clear flash before rows collapse
export const SOFT_DROP_FACTOR = 20; // soft drop is 20x gravity
export const LINES_PER_LEVEL = 10;

export const DAS_MS = 160; // delayed auto-shift (horizontal key hold)
export const ARR_MS = 40; // auto-repeat rate
