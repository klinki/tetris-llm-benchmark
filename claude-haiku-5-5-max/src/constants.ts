/** Playfield width in cells. */
export const BOARD_WIDTH = 10;

/** Rows the player can see. */
export const VISIBLE_HEIGHT = 20;

/** Hidden rows above the visible field, where pieces spawn. */
export const BUFFER_HEIGHT = 2;

/** Total rows, counted from the top (row 0) to the floor. */
export const BOARD_HEIGHT = BUFFER_HEIGHT + VISIBLE_HEIGHT;

/** Row of the top edge of a freshly spawned piece's shape box. */
export const SPAWN_ROW = BUFFER_HEIGHT - 1;

/** Number of upcoming pieces shown in the next queue. */
export const NEXT_QUEUE_SIZE = 5;

/** Lines that must be cleared to advance one level. */
export const LINES_PER_LEVEL = 10;

/** Seconds a grounded piece waits before it locks. */
export const LOCK_DELAY = 0.5;

/** Moves and rotations that may restart the lock delay before the piece locks on contact. */
export const MAX_LOCK_RESETS = 15;

/** Seconds per row while soft drop is held (20 rows per second). */
export const SOFT_DROP_INTERVAL = 1 / 20;

/** Delayed auto shift: seconds a left/right key is held before it starts repeating. */
export const DAS = 0.167;

/** Auto repeat rate: seconds between repeated left/right moves. */
export const ARR = 0.033;
