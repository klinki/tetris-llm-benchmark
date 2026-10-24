/** Playfield geometry and timing constants shared by the game, renderer and tests. */

export const BOARD_WIDTH = 10;

/** Rows the player can see. */
export const VISIBLE_ROWS = 20;

/**
 * Extra rows above the visible playfield. Pieces use them for spawning and
 * rotating near the ceiling; a lock that leaves the whole piece in here is a
 * top-out.
 */
export const HIDDEN_ROWS = 2;

export const BOARD_HEIGHT = VISIBLE_ROWS + HIDDEN_ROWS;

/** Row of the piece bounding box at spawn. Keeps one hidden row above it. */
export const SPAWN_Y = 1;

export const NEXT_QUEUE_SIZE = 5;

/** Guideline lock delay in milliseconds. */
export const LOCK_DELAY_MS = 500;

/** How often a grounded piece may reset its lock delay by moving or rotating. */
export const MAX_LOCK_RESETS = 15;

/** Interval of one soft-drop cell. */
export const SOFT_DROP_INTERVAL_MS = 50;

/** Gravity never drops a piece faster than one row per frame at 60 Hz. */
export const MIN_GRAVITY_MS = 16;

/** Delayed auto shift: time before held left/right starts repeating. */
export const DAS_MS = 150;

/** Auto repeat rate: time between repeated shifts while a direction is held. */
export const ARR_MS = 40;
