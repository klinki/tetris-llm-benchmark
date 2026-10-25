import assert from "node:assert/strict";
import { TetrisGame, emptyBoard, COLS, ROWS } from "../dist/game.js";

const game = new TetrisGame(() => 0.42);
assert.equal(game.board.length, ROWS);
assert.equal(game.board[0].length, COLS);
assert.equal(new Set([...game.next, game.active.name]).size >= 5, true, "7-bag should provide varied pieces");
const before = game.active.x;
game.move(1, 0);
assert.equal(game.active.x, before + 1, "piece moves right");
game.hardDrop();
assert.ok(game.board.some(row => row.some(Boolean)), "hard drop locks a piece");
assert.ok(game.score > 0, "hard drop scores points");

const linesGame = new TetrisGame(() => 0.1);
linesGame.board = emptyBoard();
for (let y = ROWS - 4; y < ROWS; y++) linesGame.board[y].fill("J");
linesGame.active = { name: "I", rotation: 0, x: 3, y: 0 };
linesGame.lock();
assert.equal(linesGame.lines, 4, "four completed rows clear");
assert.ok(linesGame.score >= 800, "Tetris awards Guideline base score");

const holdGame = new TetrisGame(() => 0.2);
const first = holdGame.active.name;
holdGame.hold();
assert.equal(holdGame.holdPiece, first, "hold stores active piece");
assert.equal(holdGame.canHold, false, "hold can only be used once per drop");
console.log("All Tetris logic smoke tests passed.");
