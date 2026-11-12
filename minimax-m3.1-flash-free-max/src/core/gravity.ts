import { MAX_LEVEL } from './constants.js';

/**
 * Guideline gravity: the time a piece needs to fall a single row.
 * Level 1 drops one row per second, every level below gets faster.
 */
export function gravityMsPerRow(level: number): number {
  const current = Math.min(Math.max(level, 1), MAX_LEVEL);
  return Math.pow(0.8 - (current - 1) * 0.007, current - 1) * 1000;
}
