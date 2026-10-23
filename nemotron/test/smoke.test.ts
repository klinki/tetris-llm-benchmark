import assert from 'node:assert';
import { Game } from '../src/game';
import { COLS, ROWS } from '../src/types';
import { createBoard, collides, clearLines, lockPiece } from '../src/board';
import { spawnPiece, Piece } from '../src/tetromino';

// ---------- board unit tests ----------

const board = createBoard();
assert.equal(board.length, ROWS);
assert.equal(board[0].length, COLS);
for (const row of board) assert.ok(row.every((c) => c === null));

// Out-of-bounds collides
const oob = spawnPiece('O');
oob.x = -1;
assert.ok(collides(board, oob), 'left wall collides');
oob.x = COLS;
assert.ok(collides(board, oob), 'right wall collides');
oob.x = 0;
oob.y = ROWS;
assert.ok(collides(board, oob), 'floor collides');

// Locking fills cells
const piece = spawnPiece('O');
piece.x = 3;
piece.y = 5;
lockPiece(board, piece);
assert.equal(board[5][3], 'O');
assert.equal(board[5][4], 'O');
assert.equal(board[6][3], 'O');
assert.equal(board[6][4], 'O');

// clearLines: fresh board, fill row 7 completely
const board2 = createBoard();
for (let x = 0; x < COLS; x++) board2[7][x] = 'I';
const cleared = clearLines(board2);
assert.equal(cleared, 1, 'clears one full line');
// cleared row and everything above shifts down; a new empty row appears at top
for (let x = 0; x < COLS; x++) assert.equal(board2[0][x], null, 'new empty row at top');
// one fewer block row: total filled cells dropped by COLS
let filled = 0;
for (const row of board2) filled += row.filter((c) => c !== null).length;
assert.equal(filled, 0, 'all blocks cleared when only one row was full');

// clearLines with two full rows
const board3 = createBoard();
for (let x = 0; x < COLS; x++) {
  board3[5][x] = 'J';
  board3[7][x] = 'L';
}
assert.equal(clearLines(board3), 2, 'clears two full lines');

// ---------- game integration tests ----------

const g = new Game();
assert.ok(g.state.piece, 'a piece is spawned');
assert.equal(g.state.board.length, ROWS);
assert.equal(g.state.score, 0);
assert.equal(g.state.level, 1);
assert.equal(g.state.lines, 0);
assert.equal(g.state.gameOver, false);
assert.equal(g.state.canHold, true);

// movement
const startX = g.state.piece!.x;
assert.ok(g.moveRight());
assert.equal(g.state.piece!.x, startX + 1);
assert.ok(g.moveLeft());
assert.equal(g.state.piece!.x, startX);

// rotation
assert.ok(g.rotateCW());
assert.ok(g.rotateCCW());

// hard drop locks and spawns next
const before = g.state.piece!;
g.hardDrop();
assert.notEqual(g.state.piece, before);
assert.ok(g.state.score > 0);

// hold
assert.ok(g.holdPiece());
assert.ok(g.state.hold !== null);
assert.equal(g.state.canHold, false);
assert.equal(g.holdPiece(), false);

// restart resets everything
g.restart();
assert.equal(g.state.gameOver, false);
assert.equal(g.state.score, 0);
assert.equal(g.state.lines, 0);
assert.equal(g.state.level, 1);
assert.ok(g.state.piece);
assert.ok(g.state.canHold);

console.log('smoke tests passed');
