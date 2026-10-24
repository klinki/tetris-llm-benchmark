"use strict";
/**
 * Core Tetris engine primitives: board model, SRS matrices and rotations,
 * wall-kick tables and the 7-bag shuffle. This module is free of DOM code so
 * the logic stays testable on its own.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KICKS_I = exports.KICKS_JLSTZ = exports.COLORS = exports.ROWS = exports.COLS = void 0;
exports.emptyBoard = emptyBoard;
exports.pieceCells = pieceCells;
exports.absoluteCells = absoluteCells;
exports.shuffle = shuffle;
exports.COLS = 10;
exports.ROWS = 20;
exports.COLORS = {
    0: '#00bcd4', // I — cyan
    1: '#3f51b5', // J — blue
    2: '#ff9800', // L — orange
    3: '#ffeb3b', // O — yellow
    4: '#4caf50', // S — green
    5: '#9c27b0', // T — purple
    6: '#f44336', // Z — red
};
/** Spawn orientation matrices (SRS: 4×4 for I, 2×2 for O, 3×3 for the rest). */
const MATRICES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // J
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // L
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
];
/** shapes[id][rotation] lists filled cells as (x, y) matrix offsets. */
const SHAPES = MATRICES.map((matrix) => {
    const variants = [];
    let current = matrix;
    for (let r = 0; r < 4; r++) {
        if (r > 0) {
            current = rotateMatrix(current);
        }
        variants.push(filledCells(current));
    }
    return variants;
});
/** Rotates a square matrix 90° clockwise. */
function rotateMatrix(matrix) {
    const size = matrix.length;
    const out = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            out[c][size - 1 - r] = matrix[r][c];
        }
    }
    return out;
}
function filledCells(matrix) {
    const cells = [];
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                cells.push([c, r]);
            }
        }
    }
    return cells;
}
/**
 * SRS wall-kick data for J, L, S, T, Z. Entries are (dx, dy) offsets in board
 * coordinates (y grows downward), so the guideline's y-up tests have their y
 * sign flipped here.
 */
exports.KICKS_JLSTZ = {
    '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
/** SRS wall-kick data for I. */
exports.KICKS_I = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
    '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};
function emptyBoard() {
    return Array.from({ length: exports.ROWS }, () => Array.from({ length: exports.COLS }, () => 0));
}
/** Cells occupied by a piece with a given rotation, as (x, y) matrix offsets. */
function pieceCells(id, rotation) {
    return SHAPES[id][((rotation % 4) + 4) % 4];
}
/** Absolute occupied cells of a piece positioned on the board. */
function absoluteCells(piece) {
    return pieceCells(piece.id, piece.rotation).map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
}
/** Fisher–Yates shuffle, used by the 7-bag randomizer. */
function shuffle(items) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
    }
    return out;
}
