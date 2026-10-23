/**
 * Board geometry, timings and colours.
 *
 * The playfield keeps two hidden rows above the visible field so pieces can
 * spawn fully out of sight, exactly like the Tetris Guideline requires.
 * Row 0 is the topmost (hidden) row, row `ROWS - 1` is the floor.
 */

import type { PieceType } from './types.js';

/** Playfield width in blocks. */
export const COLS = 10;

/** Rows the player can see. */
export const VISIBLE_ROWS = 20;

/** Rows above the visible field used for spawning. */
export const HIDDEN_ROWS = 2;

/** Total internal height of the playfield. */
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

/** How many upcoming pieces are shown. */
export const NEXT_COUNT = 5;

/** Guideline lock delay: a grounded piece locks after half a second. */
export const LOCK_DELAY_MS = 500;

/** Guideline cap on lock delay resets caused by moving/rotating a grounded piece. */
export const MAX_LOCK_RESETS = 15;

/** Delayed Auto Shift: hold direction this long before auto repeating. */
export const DAS_MS = 133;

/** Auto Repeat Rate: delay between repeated moves once DAS elapsed. */
export const ARR_MS = 33;

/** Soft drop never falls slower than this, nor faster than this. */
export const SOFT_DROP_MS = 20;

/** Lines needed to reach the next level. */
export const LINES_PER_LEVEL = 10;

/** Score of a soft dropped block. */
export const SOFT_DROP_SCORE = 1;

/** Score per block of a hard drop. */
export const HARD_DROP_SCORE = 2;

/** Duration of the line clear flash / announcement, in milliseconds. */
export const EFFECT_MS = 900;

/** Guideline colours: every shape gets its own colour. */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#31c7ef',
  J: '#4662d7',
  L: '#ff9f2a',
  O: '#ffd92a',
  S: '#5ddb58',
  T: '#ae46d6',
  Z: '#ef3340',
};