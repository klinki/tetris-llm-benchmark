// Tetrimino definitions: spawn shapes, SRS rotation states and wall-kick tables.

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Rotation = 0 | 1 | 2 | 3; // 0 spawn, 1 CW, 2 180, 3 CCW
export type Cell = readonly [number, number]; // [x, y] offset, y grows downward

export const PIECE_TYPES: readonly PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const COLORS: Record<PieceType, string> = {
  I: '#00d8e8', // cyan
  J: '#3b6cff', // blue
  L: '#ff8c1a', // orange
  O: '#ffd500', // yellow
  S: '#3ddc55', // green
  T: '#c04df0', // purple
  Z: '#ff3b3b', // red
};

// Spawn orientations per the Guideline (SRS).
const SPAWN_GRIDS: Record<PieceType, readonly string[]> = {
  I: ['....', 'XXXX', '....', '....'],
  J: ['X..', 'XXX', '...'],
  L: ['..X', 'XXX', '...'],
  O: ['XX', 'XX'],
  S: ['.XX', 'XX.', '...'],
  T: ['.X.', 'XXX', '...'],
  Z: ['XX.', '.XX', '...'],
};

function gridCells(grid: readonly string[]): Cell[] {
  const cells: Cell[] = [];
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'X') cells.push([x, y]);
    }
  });
  return cells;
}

function rotateCW(grid: readonly string[]): string[] {
  const n = grid.length;
  const out: string[] = [];
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) row += grid[n - 1 - x][y];
    out.push(row);
  }
  return out;
}

// The four rotation states of every piece, as cell offsets in their bounding box.
export const ROTATIONS: Record<PieceType, Cell[][]> = (() => {
  const table = {} as Record<PieceType, Cell[][]>;
  for (const type of PIECE_TYPES) {
    let grid = SPAWN_GRIDS[type];
    const states: Cell[][] = [];
    for (let r = 0; r < 4; r++) {
      states.push(gridCells(grid));
      grid = rotateCW(grid);
    }
    table[type] = states;
  }
  return table;
})();

// Spawn positions: horizontally centered, fully inside the hidden rows.
// The I occupies the lower hidden row; the others occupy both hidden rows.
export const SPAWN: Record<PieceType, { x: number; y: number }> = {
  I: { x: 3, y: 0 },
  J: { x: 3, y: 0 },
  L: { x: 3, y: 0 },
  O: { x: 4, y: 0 },
  S: { x: 3, y: 0 },
  T: { x: 3, y: 0 },
  Z: { x: 3, y: 0 },
};

// SRS wall kicks, converted to y-down screen coordinates.
// Key: `${fromRotation}>${toRotation}`; tests are tried in order.
type KickTable = Record<string, readonly Cell[]>;

const JLSTZ_KICKS: KickTable = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: KickTable = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function kicksFor(type: PieceType, from: Rotation, to: Rotation): readonly Cell[] {
  if (type === 'O') return [[0, 0]];
  return (type === 'I' ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`];
}
