import type { PieceType, Point, Rotation } from "./types.js";

const p = (x: number, y: number): Point => ({ x, y });

// Coordinates use the SRS rotation centers and a y axis that points down.
const rotations: Record<PieceType, readonly (readonly Point[])[]> = {
  I: [
    [p(0, 1), p(1, 1), p(2, 1), p(3, 1)],
    [p(2, 0), p(2, 1), p(2, 2), p(2, 3)],
    [p(0, 2), p(1, 2), p(2, 2), p(3, 2)],
    [p(1, 0), p(1, 1), p(1, 2), p(1, 3)],
  ],
  O: [
    [p(1, 0), p(2, 0), p(1, 1), p(2, 1)],
    [p(1, 0), p(2, 0), p(1, 1), p(2, 1)],
    [p(1, 0), p(2, 0), p(1, 1), p(2, 1)],
    [p(1, 0), p(2, 0), p(1, 1), p(2, 1)],
  ],
  T: [
    [p(1, 0), p(0, 1), p(1, 1), p(2, 1)],
    [p(1, 0), p(1, 1), p(2, 1), p(1, 2)],
    [p(0, 1), p(1, 1), p(2, 1), p(1, 2)],
    [p(1, 0), p(0, 1), p(1, 1), p(1, 2)],
  ],
  S: [
    [p(1, 0), p(2, 0), p(0, 1), p(1, 1)],
    [p(1, 0), p(1, 1), p(2, 1), p(2, 2)],
    [p(1, 1), p(2, 1), p(0, 2), p(1, 2)],
    [p(0, 0), p(0, 1), p(1, 1), p(1, 2)],
  ],
  Z: [
    [p(0, 0), p(1, 0), p(1, 1), p(2, 1)],
    [p(2, 0), p(1, 1), p(2, 1), p(1, 2)],
    [p(0, 1), p(1, 1), p(1, 2), p(2, 2)],
    [p(1, 0), p(0, 1), p(1, 1), p(0, 2)],
  ],
  J: [
    [p(0, 0), p(0, 1), p(1, 1), p(2, 1)],
    [p(1, 0), p(2, 0), p(1, 1), p(1, 2)],
    [p(0, 1), p(1, 1), p(2, 1), p(2, 2)],
    [p(1, 0), p(1, 1), p(0, 2), p(1, 2)],
  ],
  L: [
    [p(2, 0), p(0, 1), p(1, 1), p(2, 1)],
    [p(1, 0), p(1, 1), p(1, 2), p(2, 2)],
    [p(0, 1), p(1, 1), p(2, 1), p(0, 2)],
    [p(0, 0), p(1, 0), p(1, 1), p(1, 2)],
  ],
};

export function getCells(type: PieceType, rotation: Rotation, x: number, y: number): Point[] {
  return rotations[type][rotation].map((cell) => ({ x: x + cell.x, y: y + cell.y }));
}

export function getLocalCells(type: PieceType, rotation: Rotation = 0): readonly Point[] {
  return rotations[type][rotation];
}

export const COLORS: Record<PieceType, string> = {
  I: "#5de4ff",
  O: "#ffd45a",
  T: "#bc7cff",
  S: "#62e394",
  Z: "#ff6b87",
  J: "#658cff",
  L: "#ff9c58",
};

export const PIECE_NAMES: Record<PieceType, string> = {
  I: "I",
  O: "O",
  T: "T",
  S: "S",
  Z: "Z",
  J: "J",
  L: "L",
};
