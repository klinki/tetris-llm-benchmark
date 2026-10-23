import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run only against an isolated build: node .audit/haiku-audit.mjs /tmp/copy/run
if (!process.argv[2]) throw new Error('Pass the path to an isolated, built run directory');
const root = resolve(process.argv[2]);
const load = file => import(pathToFileURL(resolve(root, 'dist', file)));
const { Game, gravityInterval } = await load('game/game.js');
const { Board } = await load('game/board.js');
const { PieceSource } = await load('game/bag.js');
const { pieceCells, kickTests, PIECE_TYPES, PIECE_COLORS } = await load('game/pieces.js');
const { detectTSpin } = await load('game/scoring.js');
const { Input } = await load('input.js');

// Identical canonical coordinate oracle to the October 23 audit.
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
for (const type of PIECE_TYPES) {
  for (let rotation = 0; rotation < 4; rotation++) {
    const cells = pieceCells(type, rotation).map(([x, y]) => [x + (type === 'O' ? 1 : 0), y]);
    assert.equal(key(cells), key(reference[type][rotation]), `${type}${rotation}`);
  }
}
assert.equal(new Set(Object.values(PIECE_COLORS)).size, 7);
console.log('PASS: all 28 canonical SRS states (one fixed O-origin translation); seven colors');

// Published SRS offsets: positive Y points up, as does kickTests().
const normalKicks = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const iKicks = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};
for (const type of PIECE_TYPES) {
  for (const transition of Object.keys(normalKicks)) {
    const [from, to] = transition.split('>').map(Number);
    assert.deepEqual(kickTests(type, from, to), type === 'O' ? [[0, 0]]
      : (type === 'I' ? iKicks : normalKicks)[transition], `${type} ${transition}`);
  }
}

const make = (sequence = ['T', 'I', 'O', 'S', 'Z', 'J', 'L']) => new Game({ sequence });
// TypeScript private fields are ordinary JS properties in this build. Only
// deterministic fixtures set them; assertions exercise the delivered engine.
const place = (game, type, rotation, x, y) => {
  Object.assign(game, { piece: { type, rotation, x, y }, lowestY: y,
    gravityTimer: 0, lockTimer: 0, lockResets: 0, lastRotated: false });
  assert(game.board.fits(pieceCells(type, rotation), x, y), 'fixture must be legal');
};
{
  const game = make();
  place(game, 'T', 1, -1, 30);
  assert(game.rotate(-1));
  assert.deepEqual(game.active, { type: 'T', rotation: 0, x: 0, y: 30 });
  place(game, 'I', 1, -2, 30);
  assert(game.rotate(-1));
  assert.deepEqual(game.active, { type: 'I', rotation: 0, x: 0, y: 30 });
}
console.log('PASS: all CW/CCW kick tables and concrete T/I wall kicks');

{
  let seed = 42;
  const source = new PieceSource(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
  for (let bag = 0; bag < 10; bag++) {
    assert.deepEqual(Array.from({ length: 7 }, () => source.next()).sort(), [...PIECE_TYPES].sort());
  }
  const game = make();
  assert.deepEqual(game.next, ['I', 'O', 'S', 'Z', 'J']);
  game.rotate(1);
  game.hold();
  assert.equal(game.heldPiece, 'T');
  assert.equal(game.active.type, 'I');
  assert.equal(game.active.rotation, 0);
  game.hold();
  assert.equal(game.active.type, 'I');
  game.hardDrop();
  game.hold();
  assert.equal(game.active.type, 'T');
  assert.equal(game.active.rotation, 0);
  assert.equal(game.canHold, false);
  const walls = make(['O']);
  for (let i = 0; i < 12; i++) walls.moveHorizontal(-1);
  assert.equal(walls.active.x, 0);
  assert.equal(walls.moveHorizontal(-1), false);
  for (let i = 0; i < 12; i++) walls.moveHorizontal(1);
  assert.equal(walls.active.x, 8);
  for (const type of PIECE_TYPES) {
    const drop = make([type]);
    drop.board.set(4, 38, 'Z');
    const { x, y, rotation } = drop.active;
    const ghostY = drop.ghostY;
    assert(drop.board.fits(pieceCells(type, rotation), x, ghostY));
    assert.equal(drop.board.fits(pieceCells(type, rotation), x, ghostY + 1), false);
    const expected = pieceCells(type, rotation).map(([dx, dy]) => [x + dx, ghostY + dy]);
    assert.equal(new Set(expected.map(String)).size, 4);
    drop.hardDrop();
    assert.equal(drop.score, 2 * (ghostY - y));
    for (const [bx, by] of expected) assert.equal(drop.board.get(bx, by), type);
  }
}
console.log('PASS: ten seeded bags, walls, queue, hold restriction/reset, seven ghost/drop outcomes');

{
  const game = make(['O']);
  place(game, 'O', 0, 4, 38);
  game.update(0.499);
  assert(game.board.isEmpty());
  game.update(0.0011);
  assert.equal(game.board.get(4, 39), 'O');
}
{
  const game = make(['O']);
  place(game, 'O', 0, 4, 38);
  for (let i = 0; i < 15; i++) {
    game.update(0.49);
    assert(game.board.isEmpty());
    assert(game.moveHorizontal(i % 2 ? -1 : 1));
  }
  assert.equal(game.lockResets, 15);
  game.update(0.49);
  assert(game.moveHorizontal(-1));
  // The 16th move cannot buy another 500 ms. It is valid to lock either
  // immediately at the cap or once the already-running timer expires.
  game.update(0.011);
  assert.equal(game.board.get(4, 39), 'O');
}
{
  const game = make(['O']);
  place(game, 'O', 0, 0, 37);
  game.board.set(0, 39, 'J');
  game.update(0.49);
  assert(game.moveHorizontal(1));
  assert(game.board.fits(pieceCells('O', 0), game.active.x, game.active.y + 1));
  game.update(0.51);
  assert.equal(game.active.y, 37);
  assert.equal(game.board.get(1, 37), null);
  game.update(0.5);
  assert.equal(game.active.y, 38);
  game.update(0.501);
  assert.equal(game.board.get(1, 39), 'O');
}
console.log('PASS: 499/500 ms lock boundary, 15-reset limit and ledge-move airborne-lock probe');

const single = (game, perfect = false) => {
  game.board.clear();
  for (const x of [0, 1, 2, 7, 8, 9]) game.board.set(x, 39, 'J');
  if (!perfect) game.board.set(0, 30, 'J');
  place(game, 'I', 0, 3, 38);
};
const tetris = game => {
  game.board.clear();
  for (let y = 36; y < 40; y++) {
    for (let x = 0; x < 10; x++) if (x !== 4) game.board.set(x, y, 'J');
  }
  game.board.set(0, 30, 'J');
  place(game, 'I', 1, 2, 36);
};
{
  const game = make();
  single(game, true);
  game.hardDrop();
  assert.equal(game.score, 900);
  assert.equal(game.lines, 1);
  assert(game.board.isEmpty());
}
for (const [lines, expected] of [[2, 300], [3, 500]]) {
  const game = make();
  for (let y = 40 - lines; y < 40; y++) {
    for (let x = 0; x < 10; x++) if (x !== 4) game.board.set(x, y, 'J');
  }
  place(game, 'I', 1, 2, 36);
  game.hardDrop();
  assert.equal(game.score, expected);
  assert.equal(game.lines, lines);
}
{
  const game = make();
  tetris(game);
  game.hardDrop();
  assert.equal(game.score, 800);
  assert.equal(game.backToBack, true);
  game.board.clear();
  place(game, 'O', 0, 0, 38);
  game.hardDrop();
  assert.equal(game.backToBack, true);
  assert.equal(game.combo, -1);
  tetris(game);
  game.hardDrop();
  assert.equal(game.score, 2000); // 800 + B2B 1200, no combo after no-clear
  single(game);
  game.hardDrop();
  assert.equal(game.score, 2150); // single 100 + combo 50; ends B2B
  assert.equal(game.backToBack, false);
}
{
  const game = make();
  game.linesValue = 10;
  game.combo = 0;
  single(game);
  game.hardDrop();
  assert.equal(game.score, 300); // 100*2 + 50*1*2
  assert.equal(game.level, 2);
  assert.equal(game.lines, 11);
}
{
  const game = make();
  game.linesValue = 9;
  single(game);
  game.hardDrop();
  assert.equal(game.score, 100); // use the level before the clear
  assert.equal(game.level, 2);
}
for (const full of [false, true]) {
  for (const clear of [false, true]) {
    const game = make();
    game.board.set(5, 37, 'J');
    game.board.set(3, 39, 'J');
    game.board.set(full ? 3 : 5, full ? 37 : 39, 'J');
    if (clear) {
      for (const x of [0, 1, 2, 6, 7, 8, 9]) game.board.set(x, 38, 'J');
    }
    place(game, 'T', 3, 3, 37);
    assert(game.rotate(1));
    assert.equal(game.ghostY, 37);
    game.hardDrop();
    assert.equal(game.score, full ? (clear ? 800 : 400) : (clear ? 200 : 100));
    assert.equal(game.lines, Number(clear));
    assert(game.lastEvent.startsWith(full ? 'T-Spin' : 'T-Spin Mini'));
  }
}
{
  const board = new Board();
  board.set(3, 39, 'J'); board.set(5, 39, 'J'); board.set(5, 37, 'J');
  assert.equal(detectTSpin(board, 0, 3, 37, 4), 'full');
  assert.equal(detectTSpin(new Board(), 0, 3, 37, 4), 'none');
}
console.log('PASS: normal clears, perfect-clear 900, B2B continuity/break, level-two combo 300, full/mini spin integration');

{
  const game = make(['O']);
  game.update(0.999);
  assert.equal(game.active.y, 18);
  game.update(0.0011);
  assert.equal(game.active.y, 19);
  const fast = make(['O']);
  fast.linesValue = 10;
  fast.update(gravityInterval(2) + 0.0001);
  assert.equal(fast.active.y, 19);
  assert.equal(gravityInterval(2), 0.793);
  const soft = make(['O']);
  soft.setSoftDrop(true);
  soft.update(0.151);
  assert.equal(soft.active.y, 21);
  assert.equal(soft.score, 3);
  soft.setSoftDrop(false);
}
{
  const game = make(['I', 'O']);
  game.board.set(4, 18, 'J'); // obstruct the next O's actual spawn cells
  game.hardDrop();
  assert.equal(game.isOver, true);
  const before = JSON.stringify(game.active);
  game.update(10); game.moveHorizontal(-1); game.rotate(1); game.hold(); game.hardDrop();
  assert.equal(JSON.stringify(game.active), before);
  game.restart();
  assert.equal(game.isOver, false);
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.level, 1);
  assert.equal(game.heldPiece, null);
  assert.equal(game.canHold, true);
  assert.equal(game.next.length, 5);
  assert(game.board.isEmpty());
  const lockout = make(['O']);
  lockout.board.set(4, 20, 'J');
  lockout.hardDrop();
  assert.equal(lockout.isOver, true);
}
console.log('PASS: normal/soft gravity, level progression, blocked spawn, hidden lock-out, game-over input and restart');

// Confirm the timer-switch defect using only public Game and Input methods,
// with sub-frame dt values well below main.ts's 0.25-second frame cap.
{
  const game = make(['O']);
  const input = new Input(game);
  for (let i = 0; i < 50; i++) game.update(0.016);
  const before = game.active.y;
  assert.equal(before, 18);
  input.keyDown({ code: 'ArrowDown', repeat: false, preventDefault() {} });
  game.update(0.001);
  assert.equal(game.active.y - before, 16);
  assert.equal(game.score, 16);
  input.keyUp({ code: 'ArrowDown' });
}
console.log('CONFIRMED MINOR: 0.8 seconds normal-gravity time becomes 16 soft-drop rows/points after 1 ms');
console.log('Haiku engine audit passed; documented finding reproduced.');
