// Playfield: 10 columns, 20 visible rows on top of a hidden buffer where pieces spawn.
export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 20;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

// Pieces spawn in the two rows directly above the visible playfield.
export const SPAWN_Y = HIDDEN_ROWS - 2;

export const NEXT_COUNT = 5;

// Lock delay with "extended placement": every move or rotation while resting on a
// surface restarts the timer, up to MAX_LOCK_RESETS times per piece.
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export const SOFT_DROP_FACTOR = 20;

export const LINES_PER_LEVEL = 10;
export const MAX_LEVEL = 15;

// Horizontal auto-repeat when a direction key is held.
export const DAS_MS = 150;
export const ARR_MS = 35;
