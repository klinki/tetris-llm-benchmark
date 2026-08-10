/**
 * Logic smoke tests for the compiled game (dist/). Deterministic where
 * possible: the queue is public so tests can fix the piece sequence.
 */
import assert from "node:assert/strict";
import { Bag } from "../dist/bag.js";
import { Board, COLS, ROWS } from "../dist/board.js";
import { Game, NEXT_COUNT } from "../dist/game.js";
import { CELLS, KICKS, SPAWN, TYPES } from "../dist/tetromino.js";

const [I, O, T, S, Z, J, L] = TYPES;

// --- 7-bag: every piece exactly once per bag -------------------------------

{
  const bag = new Bag();
  const counts = new Map(TYPES.map((t) => [t, 0]));
  for (let i = 0; i < 49; i++) {
    const t = bag.next();
    counts.set(t, counts.get(t) + 1);
  }
  for (const t of TYPES) assert.equal(counts.get(t), 7, `bag fairness for ${t}`);
  console.log("ok bag: 7 of each in 49 draws");
}

// --- spawn positions are on the board and fully visible ---------------------

{
  const board = new Board();
  for (const type of TYPES) {
    const { x, y } = SPAWN[type];
    assert.ok(x >= 0 && x + 3 < COLS, `${type} spawn x`);
    assert.ok(!board.collidesCells(CELLS[type][0], x, y), `${type} spawn clear`);
  }
  console.log("ok spawn: all pieces placed in-bounds and unblocked");
}

// --- gravity: level 1 falls one row per 0.8s --------------------------------

{
  const game = new Game();
  const before = game.active.y;
  game.update(0.8);
  assert.equal(game.active.y, before + 1, "one row after 0.8s");
  game.update(1.6);
  assert.equal(game.active.y, before + 3, "two more rows after 1.6s");
  console.log("ok gravity: level-1 speed");
}

// --- movement bounds --------------------------------------------------------

{
  const game = new Game();
  game.queue.length = 0;
  game.queue.push(I, I, I);
  game.hardDrop(); // discard the constructor's piece; spawns the fixed queue
  const p = game.active;
  const maxDx = Math.max(...CELLS[p.type][0].map(([dx]) => dx));
  const maxX = COLS - 1 - maxDx;
  for (let i = 0; i < 10; i++) game.move(-1);
  assert.equal(p.x, 0, "clamped at left wall");
  assert.ok(!game.move(-1), "cannot move past wall");
  for (let i = 0; i < 10; i++) game.move(1);
  assert.equal(p.x, maxX, "clamped at right wall");
  console.log("ok movement: walls clamp");
}

// --- SRS wall kicks ----------------------------------------------------------

{
  const game = new Game();
  game.queue.length = 0;
  game.queue.push(T, I, T);
  game.hardDrop(); // discard constructor piece; next spawn is T
  const p = game.active;
  assert.equal(p.type, T);
  assert.equal(p.state, 0);
  assert.equal(p.x, 3);
  assert.equal(p.y, 2);

  // Block the cell that makes the plain (0,0) rotation collide,
  // forcing the (-1,0) wall kick.
  const blockRow = p.y + 2;
  game.board.grid[blockRow * COLS + (p.x + 1)] = 1;
  assert.ok(game.rotate(1), "CW rotation succeeds with kick");
  assert.equal(p.state, 1, "rotated to state R");
  assert.equal(p.x, 2, "kicked one cell left");
  assert.equal(p.y, 2, "no vertical kick needed");

  // Counter-clockwise from state 0 hits a block on the other side:
  // kicks right via (1,0).
  {
    const g2 = new Game();
    g2.queue.length = 0;
    g2.queue.push(T, T, T);
    g2.hardDrop(); // discard constructor piece; next spawn is T
    const q = g2.active;
    g2.board.grid[(q.y + 2) * COLS + (q.x + 1)] = 1;
    assert.ok(g2.rotate(-1), "CCW rotation succeeds with kick");
    assert.equal(q.state, 3, "rotated to state L");
    assert.equal(q.x, 4, "kicked one cell right");
  }

  console.log("ok SRS: T wall kicks left and right");
}

{
  const game = new Game();
  game.queue.length = 0;
  game.queue.push(I, I, I);
  game.hardDrop(); // discard constructor piece; next spawn is I
  const p = game.active;
  // Block the vertical I's column so the (0,0) rotation collides;
  // the (-2,0) kick must move it two cells left.
  game.board.grid[(p.y + 2) * COLS + (p.x + 2)] = 1;
  assert.ok(game.rotate(1), "I CW rotation succeeds with kick");
  assert.equal(p.state, 1);
  assert.equal(p.x, 1, "I kicked two cells left");
  console.log("ok SRS: I piece kick");
}

// --- hard drop: score = 2 per cell, piece locks ------------------------------

{
  const game = new Game();
  const p = game.active;
  const dist = game.ghostY() - p.y;
  const before = game.score;
  const cellsBefore = countCells(game.board);
  game.hardDrop();
  assert.equal(game.score - before, 2 * dist, "2 points per dropped cell");
  assert.equal(countCells(game.board), cellsBefore + 4, "piece merged into board");
  assert.ok(game.active !== null && game.active !== p, "next piece spawned");
  console.log("ok hard drop: scoring and lock");
}

// --- line clear: single line, scoring, level progression ----------------------

{
  const game = new Game();
  game.queue.length = 0;
  game.queue.push(I, I, I);
  game.hardDrop(); // discard constructor piece; next spawn is I
  game.board.reset(); // the discarded piece sits at the bottom; clear it
  const base = game.score; // the discard drop earned 2 x distance points

  let expected = 0;
  for (let i = 0; i < 10; i++) {
    // Fill the bottom row except the I piece's columns (3..6).
    for (let x = 0; x < COLS; x++) {
      if (x < 3 || x > 6) game.board.grid[(ROWS - 1) * COLS + x] = 1;
    }
    const dropDist = game.ghostY() - game.active.y;
    game.hardDrop();
    // Spawn shifts one piece and pulls a fresh bag piece; pin the whole
    // queue to I's so the next drop is deterministic.
    game.queue.length = 0;
    game.queue.push(I, I, I);
    expected += 2 * dropDist + 100; // 100 x level 1; level 2 starts after line 10
    assert.equal(game.lines, i + 1, `line cleared on iteration ${i + 1}`);
    assert.equal(game.score - base, expected, "score tracks hard drop + line clear");
  }
  assert.equal(game.lines, 10, "ten lines total");
  assert.equal(game.level, 2, "level 2 after 10 lines");
  assert.equal(countCells(game.board), 0, "cleared rows removed, nothing else on board");
  console.log("ok line clear: scoring and level-up");
}

// --- soft drop: 1 point per cell ---------------------------------------------

{
  const game = new Game();
  const before = game.score;
  game.setSoftDrop(true);
  game.update(0.05); // 2 cells at 40 cells/s
  game.setSoftDrop(false);
  assert.equal(game.score - before, 2, "1 point per soft-dropped cell");
  console.log("ok soft drop: scoring");
}

// --- hold --------------------------------------------------------------------

{
  const game = new Game();
  const first = game.active.type;
  game.holdPiece();
  assert.equal(game.hold, first, "active piece moved to hold");
  assert.ok(game.active !== null && game.active.type !== first, "next piece active");
  const second = game.active.type;
  game.holdPiece(); // blocked: once per piece
  assert.equal(game.active.type, second, "second hold within one piece is ignored");
  assert.equal(game.hold, first, "hold box unchanged");
  game.hardDrop(); // lock the piece; the hold lock is released
  game.holdPiece(); // now the swap is allowed
  assert.equal(game.active.type, first, "held piece swapped back");
  assert.notEqual(game.hold, first, "hold box now holds the swapped piece");
  console.log("ok hold: swap, once-per-piece, reset after lock");
}

// --- game over: blocked spawn -------------------------------------------------

{
  const game = new Game();
  game.queue.length = 0;
  game.queue.push(T, T, T);
  game.hardDrop(); // discard constructor piece; active is now T at spawn
  game.board.reset();
  // Block the spawn area without completing a row: fill rows 2-3 except
  // column 9, so the T lock cannot clear a line and vacate the spawn.
  for (let y = 2; y < 4; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x !== 9) game.board.grid[y * COLS + x] = 1;
    }
  }
  game.hardDrop();
  assert.ok(game.over, "top out when spawn is blocked");
  game.restart();
  assert.ok(!game.over, "restart clears game over");
  assert.equal(game.score, 0, "restart resets score");
  assert.ok(game.active !== null, "restart spawns a piece");
  console.log("ok game over and restart");
}

// --- next queue stays full -----------------------------------------------------

{
  const game = new Game();
  assert.equal(game.queue.length, NEXT_COUNT, "queue holds NEXT_COUNT pieces");
  game.hardDrop();
  assert.equal(game.queue.length, NEXT_COUNT, "queue refilled after spawn");
  console.log("ok next queue: always NEXT_COUNT ahead");
}

function countCells(board) {
  let n = 0;
  for (const v of board.grid) if (v !== 0) n++;
  return n;
}

console.log("\nAll smoke tests passed.");
