import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBag, type Random } from '../src/bag.js';
import { type ActivePiece, cellsOf, COLS, Game, gravityIntervalMs, ROWS } from '../src/game.js';
import { PIECE_COLORS, PIECE_TYPES, type PieceType } from '../src/pieces.js';

/** Hands out the given shapes in a repeating order. */
function cycle(...types: PieceType[]): () => PieceType {
  let i = 0;
  return () => types[i++ % types.length];
}

/** Deterministic random numbers in [0, 1), so runs are reproducible. */
function seeded(seed: number): Random {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from }, (_, i) => from + i);
}

function active(game: Game): ActivePiece {
  assert.ok(game.current, 'expected an active piece');
  return game.current;
}

/** Cells of a piece as sorted "x,y" strings. */
function keysOf(piece: ActivePiece): string[] {
  return cellsOf(piece)
    .map((c) => `${c.x},${c.y}`)
    .sort();
}

function fillRow(game: Game, y: number, columns: number[]): void {
  for (const x of columns) game.board[y][x] = 'O';
}

function closeTo(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
}

/** Fills rows 18-21 except the last column, then drops a vertical I into that column: a tetris. */
function dropIntoWell(game: Game): void {
  for (let y = 18; y < 22; y++) fillRow(game, y, range(0, 9));
  assert.ok(game.rotate(1));
  while (game.move(1)) {
    // slide right until the I is in the last column
  }
  game.hardDrop();
}

/** A T rotated into a one-wide slot at the left wall. Its lock clears row 20. */
function setUpTSlot(game: Game): void {
  fillRow(game, 20, [0, 2, 3, 4, 5, 6, 7, 8, 9]);
  game.current = { type: 'T', rotation: 2, x: 0, y: 18 };
}

function assertWellFormed(game: Game): void {
  assert.equal(game.board.length, ROWS);
  for (const row of game.board) assert.equal(row.length, COLS);
  if (!game.current) return;
  for (const { x, y } of cellsOf(game.current)) {
    assert.ok(x >= 0 && x < COLS && y >= 0 && y < ROWS, 'piece is inside the field');
    assert.equal(game.board[y][x], null, 'piece does not overlap locked cells');
  }
}

test('the 7-bag deals every shape once in each run of seven', () => {
  const next = createBag(seeded(7));
  for (let run = 0; run < 20; run++) {
    const dealt = Array.from({ length: 7 }, () => next()).sort();
    assert.deepEqual(dealt, [...PIECE_TYPES].sort());
  }
});

test('each shape has its own colour', () => {
  assert.equal(new Set(Object.values(PIECE_COLORS)).size, PIECE_TYPES.length);
});

test('pieces spawn at the top of the field, centred', () => {
  const expected: [PieceType, string[]][] = [
    ['I', ['3,3', '4,3', '5,3', '6,3']],
    ['O', ['4,2', '4,3', '5,2', '5,3']],
    ['T', ['3,3', '4,2', '4,3', '5,3']],
  ];
  for (const [type, keys] of expected) {
    assert.deepEqual(keysOf(active(new Game(cycle(type)))), keys, type);
  }
});

test('four clockwise turns bring every shape back to its spawn cells', () => {
  for (const type of PIECE_TYPES) {
    const game = new Game(cycle(type));
    const spawn = keysOf(active(game));
    for (let turn = 0; turn < 4; turn++) assert.ok(game.rotate(1), `${type} turn ${turn}`);
    assert.deepEqual(keysOf(active(game)), spawn, type);
  }
});

test('a clockwise turn of T points its nub to the right', () => {
  const game = new Game(cycle('T'));
  assert.ok(game.rotate(1));
  assert.deepEqual(keysOf(active(game)), ['4,2', '4,3', '4,4', '5,3']);
});

test('moves stop at the walls and at filled cells', () => {
  const game = new Game(cycle('T'));
  let moves = 0;
  while (game.move(-1)) moves++;
  assert.equal(moves, 3);
  assert.equal(game.move(-1), false);

  const blocked = new Game(cycle('T'));
  blocked.board[3][2] = 'O';
  assert.equal(blocked.move(-1), false);
});

test('an I piece kicks off the wall when it rotates against it', () => {
  const game = new Game(cycle('I'));
  assert.ok(game.rotate(1));
  while (game.move(1)) {
    // slide right until the vertical I touches the wall
  }
  assert.equal(active(game).x, 7);
  // The horizontal I would stick out of the right wall, so SRS test 2 shifts it left.
  assert.ok(game.rotate(1));
  assert.equal(active(game).rotation, 2);
  assert.equal(active(game).x, 6);
});

test('gravity drops the piece one row per second at level 1', () => {
  const game = new Game(cycle('T'));
  game.update(999);
  assert.equal(active(game).y, 2);
  game.update(1);
  assert.equal(active(game).y, 3);
});

test('soft drop falls twenty times faster and scores a point per row', () => {
  const game = new Game(cycle('T'));
  game.softDropping = true;
  game.update(50);
  assert.equal(active(game).y, 3);
  assert.equal(game.score, 1);
});

test('hard drop lands the piece, scores two points per row and brings the next piece', () => {
  const game = new Game(cycle('T', 'O'));
  game.hardDrop();
  assert.equal(game.score, 18 * 2);
  assert.equal(game.board[21][3], 'T');
  assert.equal(game.board[20][4], 'T');
  assert.equal(active(game).type, 'O');
});

test('a landed piece locks once the lock delay runs out', () => {
  const game = new Game(cycle('T'));
  for (let i = 0; i < 18; i++) game.update(1000);
  assert.equal(active(game).y, 20);
  game.update(499);
  assert.equal(game.board[21][3], null);
  game.update(1);
  assert.equal(game.board[21][3], 'T');
  assert.equal(active(game).y, 2);
});

test('moving a landed piece resets the lock delay, at most fifteen times', () => {
  const game = new Game(cycle('T'));
  for (let i = 0; i < 18; i++) game.update(1000);
  for (let i = 0; i < 15; i++) {
    assert.ok(game.move(i % 2 === 0 ? -1 : 1));
    game.update(400);
  }
  assert.equal(game.board[21][3], null);
  // The sixteenth move no longer resets the timer, so the piece locks 100 ms later.
  assert.ok(game.move(1));
  game.update(100);
  assert.equal(game.board[21][3], 'T');
});

test('hold swaps with the held piece, once per piece', () => {
  const game = new Game(cycle('T', 'I', 'O'));
  game.holdPiece();
  assert.equal(game.hold, 'T');
  assert.equal(active(game).type, 'I');
  game.holdPiece();
  assert.equal(game.hold, 'T');
  assert.equal(active(game).type, 'I');
  game.hardDrop();
  game.holdPiece();
  assert.equal(game.hold, 'O');
  assert.equal(active(game).type, 'T');
});

test('the ghost shows where the piece would land', () => {
  const game = new Game(cycle('T'));
  assert.equal(game.ghost()?.y, 20);
  game.board[21][4] = 'O';
  assert.equal(game.ghost()?.y, 19);
});

test('a single line clear scores 100 points at level 1', () => {
  const game = new Game(cycle('O'));
  fillRow(game, 21, range(0, 8));
  for (let i = 0; i < 4; i++) assert.ok(game.move(1));
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 18 * 2 + 100);
});

test('a tetris scores 800, and a back-to-back tetris scores 1.5 times that', () => {
  const game = new Game(() => 'I');
  // A block that stays on the board keeps these from being perfect clears.
  game.board[0][0] = 'O';
  dropIntoWell(game);
  assert.equal(game.lines, 4);
  assert.equal(game.score, 16 * 2 + 800);

  const before = game.score;
  dropIntoWell(game);
  // The second tetris is worth 1200 and also earns a 50 point combo bonus.
  assert.equal(game.lines, 8);
  assert.equal(game.score - before, 16 * 2 + 1200 + 50);
});

test('clearing the whole board adds the perfect clear bonus', () => {
  const game = new Game(() => 'I');
  dropIntoWell(game);
  assert.equal(game.score, 16 * 2 + 800 + 2000);
});

test('a T-spin with three corners and both front corners blocked scores 800 for a single', () => {
  const game = new Game(cycle('T'));
  setUpTSlot(game);
  game.board[18][0] = 'O';
  assert.ok(game.rotate(1));
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 800);
});

test('a T-spin with only one front corner blocked is a mini and scores 200 for a single', () => {
  const game = new Game(cycle('T'));
  setUpTSlot(game);
  game.board[18][2] = 'O';
  assert.ok(game.rotate(1));
  game.hardDrop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 200);
});

test('every ten lines raises the level, which speeds up gravity', () => {
  const game = new Game(cycle('O'));
  game.lines = 9;
  fillRow(game, 21, range(0, 8));
  for (let i = 0; i < 4; i++) assert.ok(game.move(1));
  game.hardDrop();
  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
  closeTo(gravityIntervalMs(2), 793);
});

test('a piece that locks entirely above the field ends the game', () => {
  const game = new Game(cycle('T'));
  game.current = { type: 'T', rotation: 0, x: 3, y: 0 };
  game.board[2][3] = 'O';
  game.hardDrop();
  assert.equal(game.gameOver, true);
  assert.equal(game.current, null);
});

test('a blocked spawn ends the game, and restart starts a fresh one', () => {
  const game = new Game(cycle('T'));
  // Move the first T out of the way of the blocker below.
  for (let i = 0; i < 3; i++) assert.ok(game.move(1));
  // This cell is part of the next T's spawn shape.
  game.board[3][3] = 'O';
  game.hardDrop();
  assert.equal(game.gameOver, true);
  game.restart();
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.equal(game.board[3][3], null);
});

test('random play keeps the board well formed', () => {
  const random = seeded(2024);
  const game = new Game(createBag(random));
  const actions: (() => void)[] = [
    () => game.move(-1),
    () => game.move(1),
    () => game.rotate(1),
    () => game.rotate(-1),
    () => game.hardDrop(),
    () => game.holdPiece(),
    () => {
      game.softDropping = random() < 0.5;
    },
  ];
  for (let step = 0; step < 20000; step++) {
    if (game.gameOver) game.restart();
    actions[Math.floor(random() * actions.length)]();
    game.update(16);
    assertWellFormed(game);
  }
});
