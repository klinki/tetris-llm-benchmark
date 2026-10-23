export const COLS = 10;
export const ROWS = 20;

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Piece {
  type: PieceType;
  x: number;   // board column of the piece origin
  y: number;   // board row of the piece origin
  rot: number; // 0..3
}

export type Cell = PieceType | null;

export interface Point {
  x: number;
  y: number;
}

export const COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  J: '#0000f0',
  L: '#f0a000',
  O: '#f0f000',
  S: '#00f000',
  T: '#a000f0',
  Z: '#f00000',
};
