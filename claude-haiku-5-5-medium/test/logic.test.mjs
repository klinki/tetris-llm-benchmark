// Headless smoke tests for the game logic. Run with `npm test`, which builds dist/ first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BagRandomizer } from '../dist/random.js';
import { pieceCells } from '../dist/pieces.js';
import { clearFullRows, createBoard } from '../dist/board.js';
import { Game } from '../dist/game.js';
import { PIECE_TYPES } from '../dist/types.js';

// Deterministic random number generator so failures are reproducible.
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

test('7-bag gives every piece exactly once per bag of seven', () => {
  const bag = new BagRandomizer(seeded(1));
  for (let round = 0; round < 20; round++) {
    const drawn = Array.from({ length: 7 }, () => bag.next()).sort();
    assert.deepEqual(drawn, [...PIECE_TYPES].sort());
  }
});

test('every piece has four cells in every rotation', () => {
  for (const type of PIECE_TYPES) {
    for (let rotation = 0; rotation < 4; rotation++) {
      assert.equal(pieceCells(type, rotation).length, 4, `${type} rotation ${rotation}`);
    }
  }
});

test('clearFullRows removes complete rows and shifts the rest down', () => {
  const board = createBoard();
  board[21].fill('I');
  board[20][0] = 'T';
  assert.equal(clearFullRows(board), 1);
  assert.equal(board[21][0], 'T');
  assert.ok(board[0].every((cell) => cell === null));
});

test('hard drop lands the piece, scores 2 per row and spawns the next piece', () => {
  const game = new Game(seeded(7));
  const rows = game.ghostPiece().y - game.current.y;
  const scoreBefore = game.score;
  game.hardDrop();
  assert.equal(game.score - scoreBefore, rows * 2);
  assert.equal(game.board.flat().filter(Boolean).length, 4);
  assert.ok(game.current);
});

test('hold stores the current piece and can only be used once per drop', () => {
  const game = new Game(seeded(3));
  const first = game.current.type;
  game.holdPiece();
  assert.equal(game.hold, first);
  const second = game.current.type;
  game.holdPiece();
  assert.equal(game.hold, first);
  assert.equal(game.current.type, second);
});

test('random play never breaks invariants and eventually tops out', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const rng = seeded(seed);
    const game = new Game(rng);
    const actions = [
      () => game.move(-1),
      () => game.move(1),
      () => game.rotate(1),
      () => game.rotate(-1),
      () => game.hardDrop(),
      () => game.holdPiece(),
      () => game.setSoftDrop(rng() < 0.3),
    ];
    let steps = 0;
    while (!game.gameOver && steps < 100000) {
      actions[Math.floor(rng() * actions.length)]();
      game.update(1 / 60);
      steps++;
      assert.ok(game.score >= 0);
      assert.ok(game.level >= 1);
      assert.equal(game.board.length, 22);
      assert.ok(game.board.every((row) => row.length === 10));
    }
    assert.ok(game.gameOver, `seed ${seed} never topped out`);
  }
});
