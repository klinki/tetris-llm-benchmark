export const COLS = 10;
export const ROWS = 20;
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Cell = PieceType | null;
export type Matrix = Cell[][];

export const COLORS: Record<PieceType, string> = {
  I: '#55d9df', J: '#6685ff', L: '#ffa94d', O: '#f4d35e', S: '#5ddd91', T: '#b17cff', Z: '#ff6685'
};
const FORMS: Record<PieceType, number[][]> = {
  I: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  J: [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  L: [0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  O: [0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  S: [0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  T: [0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Z: [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

export interface Piece { type: PieceType; matrix: number[][]; x: number; y: number; rotation: number }
export function makePiece(type: PieceType): Piece {
  const matrix = Array.from({ length: 4 }, (_, y) => FORMS[type].slice(y * 4, y * 4 + 4));
  return { type, matrix, x: 3, y: 0, rotation: 0 };
}
export function rotateMatrix(matrix: number[][], clockwise = true): number[][] {
  const n = matrix.length;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => clockwise ? matrix[n - 1 - x][y] : matrix[x][n - 1 - y]));
}
export function createBoard(): Matrix { return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null)); }
export function collides(board: Matrix, piece: Piece, x = piece.x, y = piece.y, matrix = piece.matrix): boolean {
  for (let py = 0; py < matrix.length; py++) for (let px = 0; px < matrix[py].length; px++) if (matrix[py][px]) {
    const bx = x + px, by = y + py;
    if (bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx])) return true;
  }
  return false;
}
export function sevenBag(random = Math.random): PieceType[] {
  const bag: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  return bag;
}

// SRS kick offsets are stored in screen coordinates (positive y is down).
const JLSTZ: Record<string, [number, number][]> = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]], '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]], '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]]
};
const IKicks: Record<string, [number, number][]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]], '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]], '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]], '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]], '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};
export function tryRotate(board: Matrix, piece: Piece, clockwise = true): boolean {
  if (piece.type === 'O') return true;
  const to = (piece.rotation + (clockwise ? 1 : 3)) % 4;
  const kicks = (piece.type === 'I' ? IKicks : JLSTZ)[`${piece.rotation}>${to}`];
  const matrix = rotateMatrix(piece.matrix, clockwise);
  for (const [dx, dy] of kicks) if (!collides(board, piece, piece.x + dx, piece.y + dy, matrix)) {
    piece.matrix = matrix; piece.x += dx; piece.y += dy; piece.rotation = to; return true;
  }
  return false;
}

export function clearLines(board: Matrix): number {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array<Cell>(COLS).fill(null)); cleared++; y++; }
  return cleared;
}
