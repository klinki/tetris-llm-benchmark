export const BOARD_WIDTH = 10;
export const VISIBLE_ROWS = 20;
// Rows above the visible field where pieces spawn.
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
export const SPAWN_Y = HIDDEN_ROWS - 1;
export const NEXT_COUNT = 5;

// Guideline lock delay, and the number of move/rotate resets allowed before the piece locks anyway.
export const LOCK_DELAY = 0.5;
export const MAX_LOCK_RESETS = 15;
// Seconds per row while soft drop is held.
export const SOFT_DROP_INTERVAL = 0.05;
