import assert from "node:assert/strict";
import { TetrisGame, WIDTH } from "../dist/game.js";

const game = new TetrisGame(() => 0.5);
assert.equal(game.board.length, 22);
assert.equal(game.board[0].length, WIDTH);
assert.equal(new Set([...game.queue, game.active.type]).size > 0, true);
assert.equal(game.move(-1), true);
const first = game.active.type;
assert.equal(game.hold(), true);
assert.equal(game.held, first);
assert.equal(game.hold(), false);
const before = game.score;
assert.ok(game.hardDrop() >= 0);
assert.ok(game.score >= before);
assert.equal(game.canHold, true);
console.log("Tetris logic smoke tests passed");
