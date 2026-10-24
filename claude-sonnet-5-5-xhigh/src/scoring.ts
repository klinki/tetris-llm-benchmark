import { LINES_PER_LEVEL, MAX_LEVEL } from "./constants.js";

export type TSpin = "none" | "mini" | "full";

// Points per number of cleared lines, multiplied by the current level.
const LINE_POINTS = [0, 100, 300, 500, 800];
const T_SPIN_POINTS = [400, 800, 1200, 1600];
const MINI_T_SPIN_POINTS = [100, 200, 400];
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const PERFECT_CLEAR_BACK_TO_BACK_TETRIS = 3200;
const COMBO_POINTS = 50;

export const SOFT_DROP_POINTS_PER_ROW = 1;
export const HARD_DROP_POINTS_PER_ROW = 2;

const LINE_NAMES = ["", "Single", "Double", "Triple", "Tetris"];

export function levelFor(totalLines: number): number {
  return Math.min(MAX_LEVEL, Math.floor(totalLines / LINES_PER_LEVEL) + 1);
}

/** Guideline gravity: milliseconds it takes a piece to fall one row. */
export function gravityMs(level: number): number {
  return 1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1);
}

export function linePoints(lines: number, tSpin: TSpin, level: number): number {
  const base =
    tSpin === "full" ? T_SPIN_POINTS[lines] : tSpin === "mini" ? MINI_T_SPIN_POINTS[lines] : LINE_POINTS[lines];
  return base * level;
}

/** Tetrises and T-Spin line clears are "difficult" and chain into back-to-back bonuses. */
export function isDifficult(lines: number, tSpin: TSpin): boolean {
  return lines > 0 && (lines === 4 || tSpin !== "none");
}

export function comboPoints(combo: number, level: number): number {
  return COMBO_POINTS * combo * level;
}

export function perfectClearPoints(lines: number, backToBackTetris: boolean, level: number): number {
  return (backToBackTetris ? PERFECT_CLEAR_BACK_TO_BACK_TETRIS : PERFECT_CLEAR_POINTS[lines]) * level;
}

export function clearName(lines: number, tSpin: TSpin): string {
  if (tSpin === "none") return LINE_NAMES[lines];
  const prefix = tSpin === "mini" ? "T-Spin Mini" : "T-Spin";
  return lines > 0 ? `${prefix} ${LINE_NAMES[lines]}` : prefix;
}
