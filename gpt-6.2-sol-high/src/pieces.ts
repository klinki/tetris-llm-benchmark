export type Point = readonly [x: number, y: number];

export const PIECES = {
  beam: { name: 'Beam', color: '#6bd6ea', cells: [[-1, 0], [0, 0], [1, 0]] },
  elbow: { name: 'Elbow', color: '#f4ca76', cells: [[-1, 0], [0, 0], [0, 1]] },
  hook: { name: 'Hook', color: '#f49873', cells: [[-1, -1], [-1, 0], [0, 0], [1, 0], [2, 0]] },
  crown: { name: 'Crown', color: '#b8a2f5', cells: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0]] },
  switch: { name: 'Switch', color: '#8ddeae', cells: [[-1, -1], [0, -1], [0, 0], [0, 1], [1, 1]] },
  cross: { name: 'Cross', color: '#f095b6', cells: [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]] },
  kite: { name: 'Kite', color: '#87aafa', cells: [[-1, -1], [0, -1], [-1, 0], [0, 0], [0, 1]] },
} as const satisfies Record<string, { name: string; color: string; cells: readonly Point[] }>;

export type Kind = keyof typeof PIECES;
export const KINDS = Object.keys(PIECES) as Kind[];

export function bounds(cells: readonly Point[]) {
  return {
    left: Math.min(...cells.map(([x]) => x)),
    right: Math.max(...cells.map(([x]) => x)),
    top: Math.min(...cells.map(([, y]) => y)),
    bottom: Math.max(...cells.map(([, y]) => y)),
  };
}

const orientations = new Map<Kind, Point[][]>();
for (const kind of KINDS) {
  const turns: Point[][] = [[...PIECES[kind].cells]];
  for (let turn = 1; turn < 4; turn++) {
    turns.push(turns[turn - 1].map(([x, y]) => [-y, x]));
  }
  orientations.set(kind, turns);
}

export function shape(kind: Kind, turn = 0): readonly Point[] {
  return orientations.get(kind)![turn];
}
