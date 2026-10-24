import { getCells } from "./pieces.js";
import type { ActivePiece, PieceType, Rotation } from "./types.js";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export class Board {
  private readonly cells: (PieceType | null)[][];

  public constructor(
    public readonly width = BOARD_WIDTH,
    public readonly height = BOARD_HEIGHT,
  ) {
    this.cells = Array.from({ length: height }, () => Array<PieceType | null>(width).fill(null));
  }

  public clear(): void {
    for (const row of this.cells) row.fill(null);
  }

  public cloneCells(): (PieceType | null)[][] {
    return this.cells.map((row) => [...row]);
  }

  public get(x: number, y: number): PieceType | null {
    return y < 0 || y >= this.height || x < 0 || x >= this.width ? null : this.cells[y][x];
  }

  public canPlace(piece: ActivePiece): boolean {
    return getCells(piece.type, piece.rotation, piece.x, piece.y).every(({ x, y }) => {
      if (x < 0 || x >= this.width || y >= this.height) return false;
      return y < 0 || this.cells[y][x] === null;
    });
  }

  public place(piece: ActivePiece): void {
    for (const { x, y } of getCells(piece.type, piece.rotation, piece.x, piece.y)) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) this.cells[y][x] = piece.type;
    }
  }

  public clearLines(): number {
    const remaining = this.cells.filter((row) => row.some((cell) => cell === null));
    const cleared = this.height - remaining.length;
    while (remaining.length < this.height) remaining.unshift(Array<PieceType | null>(this.width).fill(null));
    this.cells.splice(0, this.height, ...remaining);
    return cleared;
  }

  public isOccupied(x: number, y: number): boolean {
    return y >= 0 && y < this.height && x >= 0 && x < this.width && this.cells[y][x] !== null;
  }

  public canPlaceAt(type: PieceType, rotation: Rotation, x: number, y: number): boolean {
    return this.canPlace({ type, rotation, x, y });
  }
}
