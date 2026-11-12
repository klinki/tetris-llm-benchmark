import assert from 'node:assert/strict';
import test from 'node:test';

import { Board } from '../core/board.js';
import { FIRST_VISIBLE_ROW } from '../core/constants.js';
import { Game } from '../core/game.js';
import { SevenBag } from '../core/randomizer.js';
import { PIECES, pieceCells, rotationKicks } from '../core/pieces.js';

/** Deterministic pseudo random source so the tests are reproducible. */
function seededRandom(seed = 1234): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function newGame(): Game {
  const game = new Game(seededRandom());
  game.start();
  return game;
}

/** Fills a row of the board with blocks between the given columns. */
function fillRow(board: Board, row: number, from: number, to: number, value = 1): void {
  const cells = [];
  for (let x = from; x <= to; x++) cells.push({ x, y: 0 });
  board.place(cells, 0, row, value);
}

test('the 7-bag randomizer deals every piece once per bag', () => {
  const bag = new SevenBag(seededRandom());
  const first = new Set(Array.from({ length: 7 }, () => bag.next()));
  assert.equal(first.size, 7);
  const second = new Set(Array.from({ length: 7 }, () => bag.next()));
  assert.equal(second.size, 7);
});

test('every piece has four rotation states with four cells', () => {
  for (const definition of Object.values(PIECES)) {
    assert.equal(definition.states.length, 4);
    for (const state of definition.states) {
      assert.equal(state.length, 4);
    }
  }
});

test('the I piece rotates into the third column of its matrix', () => {
  const vertical = pieceCells('I', 1);
  assert.deepEqual(
    vertical.map((cell) => cell.x),
    [2, 2, 2, 2],
  );
});

test('wall kick data exists for every rotation of the I piece', () => {
  const transitions: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  for (const [from, to] of transitions) {
    assert.equal(rotationKicks('I', from as 0, to as 0).length, 5);
    assert.equal(rotationKicks('T', from as 0, to as 0).length, 5);
  }
});

test('the board removes full rows', () => {
  const board = new Board();
  fillRow(board, board.height - 1, 0, board.width - 1);
  assert.equal(board.clearFullRows(), 1);
  assert.ok(board.isEmpty());
});

test('a new game spawns a piece', () => {
  const game = newGame();
  assert.ok(game.current);
  assert.equal(game.status, 'playing');
  assert.equal(game.current?.rotation, 0);
});

test('gravity moves the piece down', () => {
  const game = newGame();
  const startY = game.current?.y ?? 0;
  game.update(1000);
  assert.equal(game.current?.y, startY + 1);
});

test('hard drop locks the piece and awards points', () => {
  const game = newGame();
  const startY = game.current?.y ?? 0;
  const ghostY = game.ghostY;
  game.hardDrop();
  assert.equal(game.score, (ghostY - startY) * 2);
  assert.equal(game.lines, 0);
  assert.equal(game.pieces, 1);
});

test('clearing four lines scores a tetris', () => {
  const game = newGame();
  const board = game.board;
  const bottom = board.height - 1;
  for (let row = bottom - 3; row <= bottom; row++) {
    fillRow(board, row, 0, 8);
  }
  // A leftover block keeps the playfield from being cleared completely.
  board.place([{ x: 0, y: 0 }], 0, bottom - 4, 1);

  game.current = { type: 'I', rotation: 1, x: 7, y: bottom - 3 };
  game.hardDrop();

  assert.equal(game.lines, 4);
  assert.equal(game.score, 800);
  assert.equal(game.level, 1);
});

test('clearing a single line scores 100 points', () => {
  const game = newGame();
  const board = game.board;
  fillRow(board, board.height - 1, 0, 7);

  game.current = { type: 'O', rotation: 0, x: 8, y: board.height - 2 };
  game.hardDrop();

  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
});

test('clearing the whole playfield scores a perfect clear', () => {
  const game = newGame();
  const board = game.board;
  fillRow(board, board.height - 1, 4, 9);

  game.current = { type: 'I', rotation: 0, x: 0, y: board.height - 2 };
  game.hardDrop();

  assert.equal(game.lines, 1);
  assert.equal(game.score, 100 + 800);
});

test('the level goes up every ten lines', () => {
  const game = newGame();
  const board = game.board;
  game.lines = 9;
  fillRow(board, board.height - 1, 0, 7);

  game.current = { type: 'O', rotation: 0, x: 8, y: board.height - 2 };
  game.hardDrop();

  assert.equal(game.lines, 10);
  assert.equal(game.level, 2);
});

test('the score of a line clear depends on the level', () => {
  const game = newGame();
  const board = game.board;
  game.lines = 19;
  game.level = 2;
  fillRow(board, board.height - 1, 0, 7);

  game.current = { type: 'O', rotation: 0, x: 8, y: board.height - 2 };
  game.hardDrop();

  assert.equal(game.score, 200);
});

test('hold swaps the piece and can only be used once per piece', () => {
  const game = newGame();
  const type = game.current?.type;
  game.holdPiece();
  assert.equal(game.hold, type);
  assert.notEqual(game.current?.type, type);

  const second = game.current?.type;
  game.holdPiece();
  assert.equal(game.current?.type, second);
  assert.equal(game.hold, type);
});

test('the ghost piece shows the landing position', () => {
  const game = newGame();
  const ghostY = game.ghostY;
  assert.ok(ghostY >= (game.current?.y ?? 0));
  game.hardDrop();
  assert.equal(game.current, null);
});

test('rotating a piece on the floor kicks it upwards', () => {
  const game = newGame();
  const board = game.board;
  const bottom = board.height - 1;
  game.current = { type: 'T', rotation: 0, x: 3, y: bottom - 1 };

  assert.equal(game.rotateClockwise(), true);
  assert.equal(game.current?.rotation, 1);
  assert.equal(game.current?.y, bottom - 2);
});

test('the game ends when a piece cannot spawn', () => {
  const game = newGame();
  const board = game.board;
  game.hardDrop();

  // Every piece spawns over the cell (4, 4), blocking the next spawn.
  board.place([{ x: 0, y: 0 }], 4, FIRST_VISIBLE_ROW, 1);
  game.update(200);

  assert.equal(game.status, 'gameover');
});

test('restarting resets the score and the board', () => {
  const game = newGame();
  game.hardDrop();
  game.restart();
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.status, 'playing');
  assert.ok(game.board.isEmpty());
});
