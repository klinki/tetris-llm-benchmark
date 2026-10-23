export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type CellValue = PieceType | null;
export type RotationState = 0 | 1 | 2 | 3;
export type RotationDirection = 'cw' | 'ccw';

export interface Point {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: RotationState;
  x: number;
  y: number;
}

export interface ActionBanner {
  title: string;
  subtitle?: string;
  timestamp: number;
}

export interface GameSnapshot {
  board: CellValue[][];
  activePiece: ActivePiece | null;
  ghostY: number | null;
  holdPiece: PieceType | null;
  canHold: boolean;
  nextQueue: PieceType[];
  score: number;
  highScore: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  gameOver: boolean;
  paused: boolean;
  lastAction: ActionBanner | null;
}
