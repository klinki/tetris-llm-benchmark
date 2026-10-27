import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { COLS, ROWS } from '../core/board.js';
import { Game, gravityIntervalMs, LOCK_DELAY_MS } from '../core/game.js';
import { ROTATIONS, type PieceType } from '../core/pieces.js';

/** update() clamps large frames; feed the game in small slices. */
function tick(g: Game, ms: number, step = 250): void {
  while (ms > 0) {
    g.update(Math.min(step, ms));
    ms -= step;
  }
}

function forcePiece(g: Game, type: PieceType, rot: number, x: number, y: number): void {
  g.board.reset();
  g.current = { type, rot, x, y };
}

function fillRows(g: Game, rows: number[], cols: number[], id = 5): void {
  for (const y of rows) {
    for (const x of cols) g.board.set(x, y, id);
  }
}

test('gravity: level 1 falls one row per second', () => {
  const g = new Game();
  forcePiece(g, 'O', 0, 4, 1);
  tick(g, 999);
  assert.equal(g.current.y, 1);
  tick(g, 1);
  assert.equal(g.current.y, 2);
});

test('soft drop is 20x gravity and pays 1 point per cell', () => {
  const g = new Game();
  forcePiece(g, 'O', 0, 4, 1);
  g.setSoftDrop(true);
  tick(g, 250); // 250ms at 50ms/row = 5 rows
  assert.equal(g.current.y, 6);
  assert.equal(g.score, 5);
  g.setSoftDrop(false);
  tick(g, 250); // normal gravity: less than one row
  assert.equal(g.current.y, 6);
});

test('soft drop locks the piece instantly when it lands', () => {
  const g = new Game();
  forcePiece(g, 'O', 0, 4, 19);
  g.setSoftDrop(true);
  tick(g, 60);
  assert.equal(g.current.y, 20); // one row to the floor
  tick(g, 10);
  assert.equal(g.current.y, 1); // soft drop landed -> immediate lock and spawn
});

test('lock delay is 500ms once grounded', () => {
  const g = new Game();
  forcePiece(g, 'I', 0, 3, ROWS - 2); // flat on the floor
  tick(g, LOCK_DELAY_MS - 1);
  assert.equal(g.current.y, ROWS - 2, 'not locked yet');
  tick(g, 5);
  assert.equal(g.current.y, 1, 'piece locked and next spawned');
});

test('moving while grounded resets the lock timer', () => {
  const g = new Game();
  forcePiece(g, 'I', 0, 3, ROWS - 2);
  tick(g, 400);
  assert.equal(g.moveHoriz(1), true);
  tick(g, 400);
  assert.equal(g.current.y, ROWS - 2, 'timer restarted after the move');
  tick(g, 110);
  assert.equal(g.current.y, 1, 'but it still locks 500ms after the last move');
});

test('the lock timer can only be reset 15 times', () => {
  const g = new Game();
  forcePiece(g, 'I', 0, 3, ROWS - 2);
  for (let i = 0; i < 15; i++) {
    assert.equal(g.moveHoriz(i % 2 === 0 ? -1 : 1), true);
    tick(g, 450);
    assert.equal(g.current.y, ROWS - 2, `still moving at reset ${i + 1}`);
  }
  assert.equal(g.moveHoriz(-1), true); // 16th move: no reset left
  tick(g, 450);
  assert.equal(g.current.y, 1, 'locked because the reset cap was reached');
});

test('hard drop pays 2 points per cell and lands at the ghost position', () => {
  const g = new Game();
  forcePiece(g, 'I', 0, 3, 1);
  const ghost = g.ghostY();
  assert.equal(ghost, ROWS - 1 - 1); // flat bar: its row is the last one
  g.hardDrop();
  assert.equal(g.score, (ghost - 1) * 2);
  assert.equal(g.lines, 0);
  assert.equal(g.current.y, 1); // a new piece spawned
});

test('tetris scores 800 at level 1', () => {
  const g = new Game();
  g.board.reset();
  fillRows(g, [18, 19, 20, 21], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  g.board.set(0, 16, 6); // survivor so the clear is not a perfect clear
  g.current = { type: 'I', rot: 1, x: 7, y: 2 }; // vertical bar in column 9
  const distance = 16;
  g.hardDrop();
  assert.equal(g.lines, 4);
  assert.equal(g.score, 800 + distance * 2);
  assert.equal(g.b2bChain, 1);
});

test('T-spin double scores 1200', () => {
  const g = new Game();
  g.board.reset();
  fillRows(g, [20], [0, 1, 2, 6, 7, 8, 9]);
  fillRows(g, [21], [0, 1, 2, 3, 5, 6, 7, 8, 9]);
  g.board.set(5, 19, 3);
  g.current = { type: 'T', rot: 1, x: 3, y: 19 };
  assert.equal(g.rotate(1), true); // spin into the slot, no kick needed
  g.hardDrop();
  assert.equal(g.lines, 2);
  assert.equal(g.score, 1200);
  assert.equal(g.b2bChain, 1); // T-spin line clears are difficult
});

test('mini T-spin scores 100', () => {
  const g = new Game();
  g.board.reset();
  g.board.set(3, 19, 3);
  g.board.set(3, 21, 3);
  g.board.set(5, 21, 3);
  g.current = { type: 'T', rot: 3, x: 3, y: 19 };
  assert.equal(g.rotate(1), true); // CW: left state back to spawn state
  g.hardDrop();
  assert.equal(g.lines, 0);
  assert.equal(g.score, 100); // one front corner free: a mini spin
});

test('consecutive clears form a combo', () => {
  const g = new Game();
  g.board.reset();
  fillRows(g, [21], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  fillRows(g, [20], [0, 1, 2, 3, 4, 5, 6, 7]);
  g.current = { type: 'I', rot: 1, x: 7, y: 2 }; // column 9 well -> single
  g.hardDrop();
  assert.equal(g.lines, 1);
  assert.equal(g.comboCount, 1);
  assert.equal(g.score, 100 + 16 * 2);

  // A T now completes the only missing cell of the next floor row: combo.
  g.current = { type: 'T', rot: 3, x: 7, y: 5 };
  g.hardDrop();
  assert.equal(g.lines, 2);
  assert.equal(g.comboCount, 2);
  assert.equal(g.score, 100 + 32 + (100 + 50) + 14 * 2);
});

test('back-to-back boosts the second difficult clear', () => {
  const g = new Game();
  g.board.reset();
  fillRows(g, [18, 19, 20, 21], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  g.board.set(0, 16, 6);
  g.current = { type: 'I', rot: 1, x: 7, y: 2 };
  g.hardDrop();
  assert.equal(g.score, 800 + 32);

  fillRows(g, [18, 19, 20, 21], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  g.board.set(0, 16, 6);
  g.current = { type: 'I', rot: 1, x: 7, y: 2 };
  g.hardDrop();
  // Second tetris: 800 * 1.5 (back-to-back) + 50 (combo of 2) + drop points.
  assert.equal(g.score, 800 + 32 + (1200 + 50 + 32));
  assert.equal(g.b2bChain, 2);
});

test('hold swaps pieces and is allowed once per piece', () => {
  const g = new Game();
  const first = g.current.type;
  const queued = g.upcoming[0];

  g.holdPiece();
  assert.equal(g.hold, first);
  assert.equal(g.current.type, queued);
  assert.equal(g.current.rot, 0);
  assert.equal(g.canHold, false);

  g.holdPiece(); // locked until the piece lands
  assert.equal(g.current.type, queued);

  g.hardDrop();
  assert.equal(g.canHold, true);
  const landed = g.current.type; // the piece spawned after the drop
  g.holdPiece();
  assert.equal(g.current.type, first);
  assert.equal(g.hold, landed);
});

test('a blocked spawn ends the game, R restarts it', () => {
  const g = new Game();
  g.board.reset();
  g.upcoming[0] = 'T';
  // Block the T spawn cells: (4,1) and (3,2) of its bounding box at (3,1).
  g.board.set(4, 1, 3);
  g.board.set(3, 2, 3);
  g.current = { type: 'O', rot: 0, x: 8, y: 1 };
  g.hardDrop(); // locks in the far right column, then spawns the T
  assert.equal(g.state, 'gameover');
  assert.equal(g.lines, 0);

  g.restart();
  assert.equal(g.state, 'playing');
  assert.equal(g.score, 0);
  assert.equal(g.lines, 0);
  assert.ok(g.board.isEmpty());
  assert.equal(g.upcoming.length, 5);
});

test('gravity table follows the guideline curve', () => {
  assert.equal(gravityIntervalMs(1), 1000);
  assert.ok(gravityIntervalMs(2) < gravityIntervalMs(1));
  assert.equal(gravityIntervalMs(10), 65);
  for (let level = 2; level <= 15; level++) {
    assert.ok(gravityIntervalMs(level) < gravityIntervalMs(level - 1), `level ${level}`);
  }
  assert.ok(gravityIntervalMs(20) < 10, 'near 20G at high levels');
});

test('random self-play: hundreds of actions keep the engine in a valid state', () => {
  let s = 123456789;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const g = new Game({ random: rnd });
  let locks = 0;
  let gameOverSeen = false;

  for (let i = 0; i < 4000 && locks < 300; i++) {
    if (g.state === 'gameover') {
      gameOverSeen = true;
      g.restart();
    }
    const action = Math.floor(rnd() * 6);
    switch (action) {
      case 0: g.moveHoriz(rnd() < 0.5 ? -1 : 1); break;
      case 1: g.rotate(rnd() < 0.5 ? 1 : -1); break;
      case 2: g.hardDrop(); locks++; break;
      case 3: g.holdPiece(); break;
      case 4: g.setSoftDrop(rnd() < 0.5); break;
      case 5: tick(g, Math.floor(rnd() * 1200)); break;
    }
    // Invariants
    if (g.state === 'playing') {
      const cells = ROTATIONS[g.current.type][g.current.rot];
      assert.equal(cells.length, 4);
      assert.ok(g.current.rot >= 0 && g.current.rot <= 3);
      assert.ok(g.ghostY() >= g.current.y);
      // A live piece must never intersect the locked stack.
      for (const [cx, cy] of cells) {
        assert.equal(g.board.get(g.current.x + cx, g.current.y + cy), 0, 'overlap check');
      }
    }
    assert.ok(g.score >= 0 && g.level >= 1 && g.lines >= 0);
  }
  assert.ok(locks >= 300 || gameOverSeen, 'the simulation actually played');
  assert.ok(gameOverSeen, 'random play tops out eventually');
});

test('clearing ten lines raises the level', () => {
  const g = new Game();
  g.board.reset();
  // Stack of ten nearly-full rows with a column-9 well for vertical I's.
  for (let y = ROWS - 10; y < ROWS; y++) {
    for (let x = 0; x < COLS - 1; x++) g.board.set(x, y, 4);
  }
  for (let i = 0; i < 3; i++) {
    g.current = { type: 'I', rot: 1, x: 7, y: 2 };
    g.hardDrop();
  }
  // Two tetrises (4 rows each) plus a double when only two rows remain.
  assert.equal(g.lines, 10);
  assert.equal(g.level, 2);
});
