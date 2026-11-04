export type Spin = "none" | "mini" | "full";

export interface ClearResult {
  lines: number;
  spin: Spin;
  points: number;
  combo: number;
  backToBack: boolean;
  backToBackBonus: boolean;
  perfectClear: boolean;
  label: string;
}

interface ScoreInput {
  lines: number;
  spin: Spin;
  level: number;
  combo: number;
  backToBack: boolean;
  perfectClear: boolean;
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const SPIN_POINTS = [400, 800, 1200, 1600];
const MINI_POINTS = [100, 200, 400];
const CLEAR_NAMES = ["", "Single", "Double", "Triple", "Tetris"];

export function scoreClear(input: ScoreInput): ClearResult {
  const { lines, spin, level, backToBack } = input;
  const difficult = lines > 0 && (lines === 4 || spin !== "none");
  const backToBackBonus = difficult && backToBack;
  const combo = lines > 0 ? input.combo + 1 : -1;
  const perfectClear = lines > 0 && input.perfectClear;
  const table = spin === "full" ? SPIN_POINTS : spin === "mini" ? MINI_POINTS : LINE_POINTS;
  const actionPoints = (table[lines] ?? 0) * (backToBackBonus ? 1.5 : 1);
  const comboPoints = lines > 0 ? 50 * Math.max(0, combo) : 0;
  const perfectPoints = perfectClear
    ? [0, 800, 1200, 1800, backToBackBonus ? 3200 : 2000][lines] ?? 0
    : 0;
  let label = CLEAR_NAMES[lines] ?? "";
  if (spin !== "none") {
    label = `${spin === "mini" ? "Mini T-spin" : "T-spin"}${lines ? ` ${label.toLowerCase()}` : ""}`;
  }
  if (perfectClear) label = "Perfect clear";

  return {
    lines, spin, combo, perfectClear, label, backToBackBonus,
    points: (actionPoints + comboPoints + perfectPoints) * level,
    // Empty placements and zero-line spins preserve the difficult-clear chain.
    backToBack: lines === 0 ? backToBack : difficult,
  };
}
