import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)));
const load = file => import(pathToFileURL(resolve(root, file)));
const opus = await load('opus5.5/dist/game.js');
const opusPieces = await load('opus5.5/dist/pieces.js');
const muse = await load('muse-spark-1.3-medium/dist/game.js');
const musePieces = await load('muse-spark-1.3-medium/dist/pieces.js');

// Same canonical SRS reference as the original and October audit probes.
const reference = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  O: Array.from({ length: 4 }, () => [[1, 0], [2, 0], [1, 1], [2, 1]]),
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};
const key = cells => cells.map(([x, y]) => `${x},${y}`).sort().join(' ');
for (const type of Object.keys(reference)) {
  for (let rotation = 0; rotation < 4; rotation++) {
    const opusCells = opusPieces.pieceCells(type, rotation)
      .map(({ x, y }) => [x + (type === 'O' ? 1 : 0), y]);
    const museCells = musePieces.SHAPES[type][rotation].map(({ x, y }) => [x, y]);
    assert.equal(key(opusCells), key(reference[type][rotation]), `Opus ${type}${rotation}`);
    assert.equal(key(museCells), key(reference[type][rotation]), `Muse ${type}${rotation}`);
  }
}
console.log('Both implementations: all 28 canonical SRS orientations pass');

const makeOpus = () => new opus.Game(() => 0.5);
const makeMuse = () => new muse.Game(() => 0.5);
{
  const game = makeOpus();
  const first = game.active.type;
  assert(game.holdPiece());
  assert.equal(game.hold, first);
  assert.equal(game.holdPiece(), false);
  game.hardDrop();
  assert(game.holdPiece());
  game.restart();
  assert.equal(game.score, 0);
  assert.equal(game.status, 'playing');
  assert.equal(game.queue.length, 5);
}
{
  const game = makeMuse();
  const first = game.snapshot().activePiece.type;
  assert(game.hold());
  assert.equal(game.snapshot().holdPiece, first);
  assert.equal(game.hold(), false);
  game.hardDrop();
  assert(game.hold());
  game.reset();
  assert.equal(game.snapshot().score, 0);
  assert.equal(game.snapshot().nextQueue.length, 5);
}
console.log('Both implementations: hold restrictions, drop/spawn, queue and reset pass');

// A grounded piece must stay airborne after leaving a small support.
{
  const game = makeOpus();
  game.active = { type: 'O', rotation: 0, x: 0, y: 37 };
  game.board[39][0] = 'J';
  game.update(490);
  assert(game.moveRight());
  game.update(20);
  assert.equal(game.active.y, 37);
  assert.equal(game.board.flat().filter(cell => cell === 'O').length, 0);
}
{
  const game = makeMuse();
  const board = muse.Game.emptyBoard();
  board[21][1] = 'J';
  game.setBoardForTest(board);
  game.setActivePieceForTest({ type: 'O', rotation: 0, x: 0, y: 19 });
  game.update(490);
  assert(game.moveRight());
  game.update(20);
  assert.equal(game.snapshot().activePiece.y, 19);
  assert.equal(game.snapshot().board.flat().filter(cell => cell === 'O').length, 0);
}
console.log('Both implementations: no stale airborne lock after a ledge move');

// Same zero-distance single-line perfect-clear setup for each engine.
{
  const game = makeOpus();
  game.active = { type: 'I', rotation: 0, x: 3, y: 38 };
  for (const x of [0, 1, 2, 7, 8, 9]) game.board[39][x] = 'J';
  game.hardDrop();
  assert.equal(game.score, 900);
  assert.equal(game.lastClear.perfectClear, true);
  assert.equal(game.lines, 1);
}
{
  const game = makeMuse();
  const board = muse.Game.emptyBoard();
  for (const x of [0, 1, 2, 7, 8, 9]) board[21][x] = 'J';
  game.setBoardForTest(board);
  game.setActivePieceForTest({ type: 'I', rotation: 0, x: 3, y: 20 });
  game.hardDrop();
  assert.equal(game.snapshot().score, 100);
  assert(game.snapshot().board.flat().every(cell => cell === null));
  assert.equal(game.snapshot().lines, 1);
}
console.log('Perfect-clear profile: Opus awards 900; Muse reproduces the missing-bonus finding (100)');

// Preserve difficult-clear chains through an ordinary no-clear placement.
{
  const game = makeOpus();
  game.backToBack = true;
  game.active = { type: 'O', rotation: 0, x: 0, y: 38 };
  game.hardDrop();
  assert.equal(game.backToBack, true);
}
{
  const game = makeMuse();
  game.b2b = true;
  game.setActivePieceForTest({ type: 'O', rotation: 0, x: 0, y: 20 });
  game.hardDrop();
  assert.equal(game.snapshot().backToBack, true);
}
console.log('Both implementations: no-clear placements preserve back-to-back');

// Exact level-two combo integration, with a stray block preventing perfect clear.
{
  const game = makeOpus();
  game.level = 2;
  game.lines = 10;
  game.combo = 0;
  game.active = { type: 'I', rotation: 0, x: 3, y: 38 };
  game.board[35][0] = 'J';
  for (const x of [0, 1, 2, 7, 8, 9]) game.board[39][x] = 'J';
  game.hardDrop();
  assert.equal(game.score, 300);
}
{
  const game = makeMuse();
  game.level = 2;
  game.lines = 10;
  game.combo = 0;
  const board = muse.Game.emptyBoard();
  board[17][0] = 'J';
  for (const x of [0, 1, 2, 7, 8, 9]) board[21][x] = 'J';
  game.setBoardForTest(board);
  game.setActivePieceForTest({ type: 'I', rotation: 0, x: 3, y: 20 });
  game.hardDrop();
  assert.equal(game.snapshot().score, 300);
}
console.log('Both implementations: level-two combo awards the expected 300');
console.log('October 23 audit probes passed; documented findings reproduced.');
