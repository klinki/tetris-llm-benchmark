export type Spin = 'none' | 'mini' | 'full';
export interface ClearResult {
  points: number;
  combo: number;
  backToBack: boolean;
  label: string;
}

export function scoreClear(
  lines: number, spin: Spin, level: number, previousCombo: number,
  previousBackToBack: boolean, perfect: boolean,
): ClearResult {
  const difficult = lines > 0 && (lines === 4 || spin !== 'none');
  const chained = difficult && previousBackToBack;
  const combo = lines > 0 ? previousCombo + 1 : -1;
  const base = spin === 'full' ? [400, 800, 1200, 1600][lines]
    : spin === 'mini' ? [100, 200, 400][lines]
    : [0, 100, 300, 500, 800][lines];
  let points = base * level * (chained ? 1.5 : 1);
  if (combo > 0) points += 50 * combo * level;
  if (perfect && lines > 0) {
    points += (lines === 4 && chained ? 3200 : [0, 800, 1200, 1800, 2000][lines]) * level;
  }
  const clear = ['', 'Single', 'Double', 'Triple', 'Tetris'][lines];
  let label = spin === 'none' ? clear : `${spin === 'mini' ? 'Mini T-spin' : 'T-spin'} ${clear}`.trim();
  if (chained) label = `Back-to-back ${label}`;
  if (perfect) label = 'Perfect clear';
  return {
    points, combo, label,
    backToBack: lines > 0 ? difficult : previousBackToBack,
  };
}
