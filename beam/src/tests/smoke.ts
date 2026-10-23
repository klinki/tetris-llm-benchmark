import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  COLS, ROWS, TOTAL_ROWS,
  emptyBoard, spawn, fits, move, rotate, hardDrop, lock, clearLines, lineScore, gravityMs,
} from "../board.js";
import { createBag, PIECE_NAMES, rotateCW, SHAPES } from "../pieces.js";
import { initGame } from "../game.js";

describe("smoke", () => {
  test("board shape", () => {
    const b = emptyBoard();
    assert.equal(b.length, TOTAL_ROWS);
    assert.equal(b[0].length, COLS);
  });
  test("game init", () => {
    const g = initGame(() => 0.5);
    assert.ok(g.current);
    assert.equal(g.next.length, 5);
  });
  test("rotateCW", () => {
    const m = [[1,2,3],[4,5,6],[7,8,9]];
    assert.deepEqual(rotateCW(m), [[7,4,1],[8,5,2],[9,6,3]]);
  });
  test("bag", () => {
    const bag = createBag(() => 0.5);
    const first7 = [];
    for (let i = 0; i < 7; i++) first7.push(bag.next());
    assert.equal(new Set(first7).size, 7);
  });
  test("clearLines", () => {
    const b = emptyBoard();
    for (let x = 0; x < COLS; x++) b[TOTAL_ROWS-1][x] = 1;
    assert.equal(clearLines(b), 1);
  });
});