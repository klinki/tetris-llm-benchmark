import { SHAPES, normalizeRotation } from "./constants.js";
import type { ActivePiece, PieceType, Rotation } from "./types.js";

export interface RelativeCell {
  row: number;
  column: number;
}

export function getMatrix(type: PieceType, rotation: Rotation) {
  return SHAPES[type][rotation];
}

export function getCells(piece: ActivePiece): RelativeCell[] {
  const shape = getMatrix(piece.type, piece.rotation);
  const cells: RelativeCell[] = [];

  for (let row = 0; row < shape.length; row += 1) {
    for (let column = 0; column < shape[row].length; column += 1) {
      if (shape[row][column]) {
        cells.push({ row: piece.y + row, column: piece.x + column });
      }
    }
  }

  return cells;
}

export function createPiece(type: PieceType, x = 3, y = 0): ActivePiece {
  return { type, rotation: 0, x, y };
}

export function rotatePiece(piece: ActivePiece, direction: 1 | -1): ActivePiece {
  return {
    ...piece,
    rotation: normalizeRotation(piece.rotation + direction),
  };
}

export function copyPiece(piece: ActivePiece): ActivePiece {
  return { ...piece };
}
