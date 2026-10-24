export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type RotationState = 0 | 1 | 2 | 3;

export type CellValue = TetrominoType | null;

export interface Point {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: TetrominoType;
  x: number;
  y: number;
  rotation: RotationState;
}

export interface LockResult {
  locked: boolean;
  clearedLines: number;
  clearedRowIndices: number[];
  scoreGained: number;
  isTSpin: boolean;
  isMiniTSpin: boolean;
  backToBack: boolean;
  combo: number;
  actionLabel: string;
  gameOver: boolean;
}

export interface GameState {
  board: CellValue[][];
  activePiece: ActivePiece | null;
  ghostY: number | null;
  holdPiece: TetrominoType | null;
  canHold: boolean;
  nextQueue: TetrominoType[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
  paused: boolean;
  lockTimer: number;
  lockResets: number;
  lastAction: string;
}
