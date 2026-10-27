// Headless smoke tests for the game logic (run with: npm test).
import assert from "node:assert/strict";
import { test } from "node:test";

import { Game, gravityInterval, BOARD_WIDTH, HIDDEN_ROWS } from "../dist/game.js";
import { Bag } from "../dist/bag.js";
import { kickOffsets } from "../dist/pieces.js";

// rng always returning 0 makes the 7-bag shuffle deterministic. With the
// Fisher-Yates used in Bag, the first bag order is: O, T, S, Z, J, L, I.
const rng = () => 0;
const freshGame = () => new Game({ rng });

function fillRow(game, y, exceptCols = []) {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (!exceptCols.includes(x)) game.board.setCell(x, y, "I");
  }
}

test("spawn position: O spawns centered in the hidden rows", () => {
  const game = freshGame();
  assert.equal(game.piece.type, "O");
  assert.deepEqual(game.cells(), [[4, 0], [5, 0], [4, 1], [5, 1]]);
});

test("7-bag: every piece appears exactly once per seven draws", () => {
  const bag = new Bag(rng);
  const drawn = Array.from({ length: 21 }, () => bag.next());
  for (let start = 0; start < 21; start += 7) {
    assert.equal(new Set(drawn.slice(start, start + 7)).size, 7);
  }
});

test("gravity: Guideline formula", () => {
  assert.ok(Math.abs(gravityInterval(1) - 1) < 1e-12);
  assert.ok(Math.abs(gravityInterval(2) - 0.793) < 1e-12);
});

test("gravity: tick drops the piece one row per interval", () => {
  const game = freshGame();
  game.setPiece("T", 0, 3, 0);
  game.tick(gravityInterval(1));
  assert.equal(game.piece.y, 1);
  assert.equal(game.score, 0);
});

test("soft drop: 20x gravity and 1 point per row", () => {
  const game = freshGame();
  game.setPiece("T", 0, 3, 0);
  game.softDropping = true;
  game.tick(gravityInterval(1) / 20);
  assert.equal(game.piece.y, 1);
  assert.equal(game.score, 1);
});

test("hard drop: lands on the floor, scores 2 per row, spawns the next piece", () => {
  const game = freshGame();
  game.setPiece("O", 0, 4, 0);
  game.hardDrop();
  assert.equal(game.piece.type, "T"); // next in the deterministic bag
  assert.equal(game.board.grid[20][4], "O");
  assert.equal(game.board.grid[21][5], "O");
  assert.equal(game.score, 20 * 2);
});

test("ghost piece: matches the hard-drop landing", () => {
  const game = freshGame();
  game.setPiece("O", 0, 4, 0);
  const ghost = game.ghostCells().map(([, y]) => y).sort();
  assert.deepEqual(ghost, [20, 20, 21, 21]);
});

test("single line clear scores 100 * level", () => {
  const game = freshGame();
  fillRow(game, 21, [4, 5]); // bottom row open at columns 4-5
  game.setPiece("O", 0, 4, 0);
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 20 * 2 + 100); // drop points + single
  assert.equal(game.board.grid[21][4], "O"); // the piece's top half fell down after the clear
});

test("tetris scores 800 at level 1", () => {
  const game = freshGame();
  for (let y = 18; y < 22; y++) fillRow(game, y, [9]);
  game.setPiece("I", 3, 8, 0); // vertical I (rotation L) over column 9
  game.hardDrop();
  assert.equal(game.lines, 4);
  assert.equal(game.score, 18 * 2 + 800);
  assert.equal(game.level, 1);
});

test("back-to-back tetris pays a 1.5x bonus", () => {
  const game = freshGame();
  for (let y = 18; y < 22; y++) fillRow(game, y, [9]);
  game.setPiece("I", 3, 8, 0);
  game.hardDrop();
  assert.equal(game.score, 36 + 800);

  game.hardDrop(); // lock the next piece without clearing: resets the combo, B2B remains

  for (let y = 18; y < 22; y++) fillRow(game, y, [9]);
  game.setPiece("I", 3, 8, 0);
  game.hardDrop();
  assert.equal(game.lines, 8);
  assert.equal(game.level, 1);
  // 1st tetris 800, filler drop 40, 2nd tetris 1.5x = 1200 (plus its drop points)
  assert.equal(game.score, 36 + 800 + 40 + 36 + 1200);
});

test("SRS wall kick: vertical I rotating flat at the left wall shifts right", () => {
  const game = freshGame();
  game.setPiece("I", 0, 0, 10); // flat I in columns 0-3
  assert.equal(game.move(-1), false); // blocked by the wall
  game.rotate(1); // -> vertical in column 2, no kick needed
  assert.equal(game.lastKickIndex, -1);
  game.move(-1);
  game.move(-1); // column 0
  assert.equal(game.piece.x, -2);
  assert.equal(game.rotate(1), true); // R -> 2 needs the (+2, 0) kick
  assert.equal(game.piece.rot, 2);
  assert.equal(game.piece.x, 0);
  assert.equal(game.lastKickIndex, 2);
});

test("SRS wall kick: J at the left wall kicks back into the field", () => {
  const game = freshGame();
  game.setPiece("J", 1, -1, 10); // J in R state hugging the left wall (cells in columns 0-1)
  assert.equal(game.rotate(1), true); // R -> 2 needs the (+1, 0) offset
  assert.equal(game.piece.x, 0);
  assert.equal(game.lastKickIndex, 1);
});

test("kick tables: CW rotations are the negation of their CCW inverses", () => {
  const negate = ([x, y]) => [x === 0 ? 0 : -x, y === 0 ? 0 : -y];
  for (const piece of ["T", "S", "Z", "J", "L", "I"]) {
    const forward = kickOffsets(piece, 0, 1);
    const inverse = kickOffsets(piece, 1, 0);
    assert.equal(forward.length, 5);
    for (let i = 0; i < 5; i++) {
      assert.deepEqual(inverse[i], negate(forward[i]), `${piece} offset ${i}`);
    }
  }
});

test("hold: swaps the piece and allows one swap per piece", () => {
  const game = freshGame();
  assert.equal(game.piece.type, "O");
  assert.equal(game.holdPiece(), true);
  assert.equal(game.hold, "O");
  assert.equal(game.piece.type, "T"); // queue order: O, T, S, ...
  assert.equal(game.holdPiece(), false); // already used this piece
  game.hardDrop(); // lock T; hold becomes available again
  assert.equal(game.canHold, true);
  assert.equal(game.piece.type, "S");
  game.holdPiece();
  assert.equal(game.hold, "S");
  assert.equal(game.piece.type, "O");
});

test("lock delay: grounded pieces survive 0.5s, moves reset it", () => {
  const game = freshGame();
  game.setPiece("O", 0, 4, 20); // grounded at the very bottom
  game.tick(0.49);
  assert.equal(game.piece.type, "O"); // still alive
  game.move(1); // resets the lock timer (once)
  game.tick(0.49);
  assert.equal(game.piece.type, "O");
  game.tick(0.02); // 0.51s since the last reset
  assert.equal(game.piece.type, "T"); // locked, next piece spawned
  assert.equal(game.board.grid[21][5], "O");
});

test("hard drop bypasses the lock delay", () => {
  const game = freshGame();
  game.setPiece("O", 0, 4, 20);
  game.tick(0.4); // lock delay partially elapsed
  game.hardDrop();
  assert.equal(game.piece.type, "T");
});

test("lock-out: a piece resting entirely in the hidden spawn rows ends the game", () => {
  const game = freshGame();
  game.board.setCell(4, 2, "I"); // a column stub right below the spawn rows
  game.board.setCell(5, 2, "I");
  game.setPiece("O", 0, 4, 0);
  game.hardDrop(); // cannot fall: locks at rows 0-1, fully inside the spawn area
  assert.equal(game.gameOver, true);
  assert.equal(game.piece, null);
});

test("top-out: a blocked spawn ends the game, reset restarts", () => {  const game = freshGame(); // O is at its spawn cells (4,0), (5,0), (4,1), (5,1)
  game.board.setCell(4, 0, "L");
  game.board.setCell(3, 1, "L");
  game.board.setCell(5, 1, "L");
  game.hardDrop(); // the O locks in place, so the next spawn overlaps
  assert.equal(game.gameOver, true);
  assert.equal(game.piece, null);
  game.reset();
  assert.equal(game.gameOver, false);
  assert.notEqual(game.piece, null); // a fresh queue was dealt onto the cleared board
});

test("combo: consecutive clears pay 50 per combo step", () => {
  const game = freshGame();
  fillRow(game, 21, [4, 5]);
  game.setPiece("O", 0, 4, 0);
  game.hardDrop();
  assert.equal(game.score, 140); // 40 drop + 100 single, no combo bonus for the first clear

  fillRow(game, 20, [4, 5]); // the O remnants now rest at columns 4-5 on the bottom row
  game.setPiece("O", 0, 4, 0);
  game.hardDrop(); // completes row 20: 38 drop + 100 single + 50 combo (2 in a row)
  assert.equal(game.score, 140 + 38 + 100 + 50);
  assert.equal(game.lines, 2);
});

test("self-play: 5000 random inputs run without errors and the rules stay consistent", () => {
  let seed = 42;
  const rng = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const game = new Game({ rng });
  for (let i = 0; i < 5000 && !game.gameOver; i++) {
    switch (Math.floor(rng() * 7)) {
      case 0: game.move(-1); break;
      case 1: game.move(1); break;
      case 2: game.rotate(1); break;
      case 3: game.rotate(-1); break;
      case 4: game.hardDrop(); break;
      case 5: game.holdPiece(); break;
      default: game.tick(1 / 60); break;
    }
    // Invariants: the active piece (if any) is in a legal position and the
    // queue is topped up from the 7-bag.
    if (game.piece) assert.ok(game.board.canPlace(game.cells()), "piece always fits");
    assert.ok(game.queue.length >= 5 || game.gameOver, "queue kept ready");
    assert.ok(game.level === Math.floor(game.lines / 10) + 1, "level follows lines");
  }
  assert.ok(game.gameOver, "a purely random player eventually tops out");
  assert.ok(game.score > 0);
});
