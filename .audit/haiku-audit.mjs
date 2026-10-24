import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run only against an isolated build: node .audit/haiku-audit.mjs /path/to/copy/run [effort]
if (!process.argv[2]) throw new Error('Pass the path to an isolated, built run directory');
const root = resolve(process.argv[2]);
const load = file => import(pathToFileURL(resolve(root, 'dist', file)));
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

const mode = process.argv[3] ?? root.split('/').at(-1).split('-').at(-1);
if (mode === 'high') await auditHigh();
else if (['low', 'medium'].includes(mode)) await auditNew(mode);
else if (['xhigh', 'max'].includes(mode)) await auditVariant(mode);
else throw new Error(`Unknown Haiku effort: ${mode}`);

async function auditHigh() {
const { Game, gravityInterval } = await load('game/game.js');
const { Board } = await load('game/board.js');
const { PieceSource } = await load('game/bag.js');
const { pieceCells, kickTests, PIECE_TYPES, PIECE_COLORS } = await load('game/pieces.js');
const { detectTSpin } = await load('game/scoring.js');
const { Input } = await load('input.js');

const key = cells => cells.map(([x, y]) => `${x},${y}`).sort().join(' ');
for (const type of PIECE_TYPES) {
  for (let rotation = 0; rotation < 4; rotation++) {
    const cells = pieceCells(type, rotation).map(([x, y]) => [x + (type === 'O' ? 1 : 0), y]);
    assert.equal(key(cells), key(reference[type][rotation]), `${type}${rotation}`);
  }
}
assert.equal(new Set(Object.values(PIECE_COLORS)).size, 7);
console.log('PASS: all 28 canonical SRS states (one fixed O-origin translation); seven colors');

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

}

async function auditVariant(mode) {
  const xhigh = mode === 'xhigh';
  const engine = await load('game.js');
  const pieces = await load('pieces.js');
  const { Game } = engine;
  const types = pieces.PIECE_TYPES;
  const cells = (type, rotation) => xhigh
    ? pieces.pieceCells(type, rotation).map(({ x, y }) => [x, y])
    : pieces.offsetsOf(type, rotation);
  const kicks = xhigh ? pieces.kickTests : (await load('srs.js')).kickOffsets;
  const bag = xhigh ? (await load('bag.js')).createBag : (await load('random.js')).createSevenBag;
  const key = points => points.map(String).sort().join(' ');
  const make = (sequence = ['T', 'I', 'O', 'S', 'Z', 'J', 'L']) => {
    let i = 0;
    const source = () => sequence[i++ % sequence.length];
    return xhigh ? new Game(source) : new Game({ source });
  };
  const active = g => xhigh ? g.current : g.active;
  const put = (g, x, y, type = 'J') => xhigh ? (g.board[y][x] = type) : g.board.setCell(x, y, type);
  const get = (g, x, y) => xhigh ? g.board[y][x] : g.board.cell(x, y);
  const clear = g => { if (xhigh) g.board.forEach(row => row.fill(null)); else g.board.clear(); };
  const empty = g => Array.from({ length: 22 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => get(g, x, y))).flat().every(c => c === null);
  const fits = (g, p) => cells(p.type, p.rotation).every(([dx, dy]) => {
    const x = p.x + dx, y = p.y + dy;
    return x >= 0 && x < 10 && y >= 0 && y < 22 && get(g, x, y) === null;
  });
  const place = (g, type, rotation, x, y) => {
    const p = { type, rotation, x, y };
    assert(fits(g, p), 'fixture must be legal');
    Object.assign(g, xhigh ? { current: p, gravityMs: 0, lockMs: 0, lowestY: y,
      lockResets: 0, lastMoveWasRotation: false, lastKick: 0 }
      : { piece: p, gravityTimer: 0, lockTimer: 0, lowestRow: y,
        lockResets: 0, lastActionWasRotation: false, lastKickIndex: 0 });
  };
  const update = (g, seconds) => g.update(seconds * (xhigh ? 1000 : 1));
  const hold = g => xhigh ? g.holdPiece() : g.hold();
  const held = g => xhigh ? g.hold : g.held;
  const ghost = g => xhigh ? g.ghost().y : g.landingRow();
  const over = g => xhigh ? g.gameOver : g.status === 'over';
  const combo = (g, value) => { (xhigh ? g : g.scorer).combo = value; };
  const level = (g, lines) => {
    if (xhigh) { g.lines = lines; g.level = Math.floor(lines / 10) + 1; }
    else g.scorer.cleared = lines;
  };
  const b2b = g => (xhigh ? g : g.scorer).backToBack;

  for (const type of types) for (let rotation = 0; rotation < 4; rotation++) {
    assert.equal(key(cells(type, rotation).map(([x, y]) => [x + (type === 'O' ? 1 : 0), y])),
      key(reference[type][rotation]), `${mode} ${type}${rotation}`);
  }
  const colors = xhigh ? Object.values(pieces.PIECE_COLORS) : Object.values(pieces.PIECES).map(p => p.color);
  assert.equal(new Set(colors).size, 7);
  for (const type of types) for (const transition of Object.keys(normalKicks)) {
    const [from, to] = transition.split('>').map(Number);
    assert.deepEqual(kicks(type, from, to), type === 'O' ? [[0, 0]]
      : (type === 'I' ? iKicks : normalKicks)[transition], `${type} ${transition}`);
  }
  for (const [type, x] of [['T', -1], ['I', -2]]) {
    const g = make();
    place(g, type, 1, x, 12);
    g.rotate(-1);
    assert.deepEqual(active(g), { type, rotation: 0, x: 0, y: 12 });
  }
  console.log(`${mode} PASS: 28 canonical states, seven colors, all CW/CCW kicks and actual T/I kicks`);

  let seed = 42;
  const source = bag(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
  for (let i = 0; i < 10; i++) {
    assert.deepEqual(Array.from({ length: 7 }, source).sort(), [...types].sort());
  }
  {
    const g = make();
    assert.deepEqual(xhigh ? g.queue : g.nextPieces, ['I', 'O', 'S', 'Z', 'J']);
    g.rotate(1); hold(g);
    assert.equal(held(g), 'T');
    assert.equal(active(g).type, 'I');
    assert.equal(active(g).rotation, 0);
    hold(g); assert.equal(active(g).type, 'I');
    g.hardDrop(); hold(g);
    assert.equal(active(g).type, 'T');
    assert.equal(active(g).rotation, 0);
    assert.equal(g.canHold, false);
    const walls = make(['O']);
    for (let i = 0; i < 12; i++) walls.move(-1);
    assert.equal(active(walls).x, 0);
    for (let i = 0; i < 12; i++) walls.move(1);
    assert.equal(active(walls).x, 8);
  }
  for (const type of types) {
    const g = make([type]);
    put(g, 4, 20, 'Z');
    const p = { ...active(g) }, y = ghost(g);
    assert(fits(g, { ...p, y }));
    assert.equal(fits(g, { ...p, y: y + 1 }), false);
    const expected = cells(type, p.rotation).map(([dx, dy]) => [p.x + dx, y + dy]);
    assert.equal(new Set(expected.map(String)).size, 4);
    g.hardDrop();
    assert.equal(g.score, 2 * (y - p.y));
    for (const [x, row] of expected) assert.equal(get(g, x, row), type);
  }
  console.log(`${mode} PASS: ten seeded bags, walls, queue, hold reset/restriction and seven ghost/drop outcomes`);

  {
    const g = make(['O']); place(g, 'O', 0, 4, 20);
    update(g, 0.499); assert(empty(g));
    update(g, 0.0011); assert.equal(get(g, 4, 21), 'O');
  }
  {
    const g = make(['O']); place(g, 'O', 0, 4, 20);
    for (let i = 0; i < 15; i++) {
      update(g, 0.49); assert(empty(g)); g.move(i % 2 ? -1 : 1);
    }
    assert.equal(g.lockResets, 15);
    update(g, 0.49); g.move(-1); update(g, 0.011);
    assert.equal(get(g, 4, 21), 'O');
  }
  {
    const g = make(['O']); place(g, 'O', 0, 0, 19); put(g, 0, 21);
    update(g, 0.49); g.move(1);
    assert(fits(g, { ...active(g), y: 20 }));
    update(g, 0.02); // cross stale 500 ms deadline while still airborne
    assert.equal(active(g).y, 19);
    assert.equal(get(g, 1, 19), null);
    assert.equal(xhigh ? g.lockMs : g.lockTimer, 0);
    for (let i = 0; i < 20 && get(g, 1, 21) === null; i++) update(g, 0.1);
    assert.equal(get(g, 1, 21), 'O');
    assert.equal(get(g, 1, 19), null);
  }
  console.log(`${mode} PASS: 499/500 ms lock boundary, 15-reset cap and ledge-move mid-air lock probe`);

  const single = (g, perfect = false) => {
    clear(g);
    for (const x of [0, 1, 2, 7, 8, 9]) put(g, x, 21);
    if (!perfect) put(g, 0, 12);
    place(g, 'I', 0, 3, 20);
  };
  const tetris = g => {
    clear(g);
    for (let y = 18; y < 22; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
    put(g, 0, 12); place(g, 'I', 1, 2, 18);
  };
  {
    const g = make(); single(g, true); g.hardDrop();
    assert.equal(g.score, xhigh ? 900 : 100); assert.equal(g.lines, 1); assert(empty(g));
    console.log(`${mode} ${xhigh ? 'PASS' : 'CONFIRMED MINOR'}: single perfect clear = ${g.score} (benchmark expectation 900)`);
  }
  for (const [lines, expected] of [[2, 300], [3, 500]]) {
    const g = make();
    for (let y = 22 - lines; y < 22; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
    place(g, 'I', 1, 2, 18); g.hardDrop();
    assert.equal(g.score, expected); assert.equal(g.lines, lines);
  }
  {
    const g = make(); tetris(g); g.hardDrop();
    assert.equal(g.score, 800); assert.equal(b2b(g), true);
    clear(g); place(g, 'O', 0, 0, 20); g.hardDrop();
    assert.equal(b2b(g), true);
    tetris(g); g.hardDrop(); assert.equal(g.score, 2000);
    single(g); g.hardDrop(); assert.equal(g.score, 2150); assert.equal(b2b(g), false);
  }
  {
    const g = make(); level(g, 10); combo(g, 0); single(g); g.hardDrop();
    assert.equal(g.score, 300); assert.equal(g.lines, 11); assert.equal(g.level, 2);
    const crossing = make(); level(crossing, 9); single(crossing); crossing.hardDrop();
    assert.equal(crossing.score, 100); assert.equal(crossing.level, 2);
  }
  for (const full of [false, true]) for (const line of [false, true]) {
    const g = make();
    put(g, 5, 19); put(g, 3, 21); put(g, full ? 3 : 5, full ? 19 : 21);
    if (line) for (const x of [0, 1, 2, 6, 7, 8, 9]) put(g, x, 20);
    place(g, 'T', 3, 3, 19); g.rotate(1);
    assert.equal(active(g).rotation, 0); assert.equal(ghost(g), 19); g.hardDrop();
    assert.equal(g.score, full ? (line ? 800 : 400) : (line ? 200 : 100));
    assert.equal(g.lines, Number(line));
  }
  {
    const g = make(); put(g, 3, 21); put(g, 5, 21); put(g, 5, 19);
    place(g, 'T', 0, 3, 19);
    if (xhigh) {
      g.lastMoveWasRotation = true;
      assert.equal(g.detectTSpin(g.current), 'mini');
      g.lastKick = 4; assert.equal(g.detectTSpin(g.current), 'full');
    } else {
      const { detectTSpin } = await load('tspin.js');
      assert.equal(detectTSpin(g.board, active(g), 0), 'mini');
      assert.equal(detectTSpin(g.board, active(g), 4), 'full');
    }
  }
  console.log(`${mode} PASS: normal clears, B2B continuity/break, level-two combo 300, level crossing, integrated full/mini spins and fifth-kick classification`);

  {
    const g = make(['O']), start = active(g).y;
    update(g, 0.999); assert.equal(active(g).y, start);
    update(g, 0.0011); assert.equal(active(g).y, start + 1);
    const fast = make(['O']); level(fast, 10);
    const interval = xhigh ? engine.gravityIntervalMs(2) / 1000 : engine.gravityInterval(2);
    assert.equal(interval, 0.793); update(fast, interval + 0.0001);
    assert.equal(active(fast).y, start + 1);
    const soft = make(['O']);
    if (xhigh) soft.softDropping = true; else soft.setSoftDrop(true);
    update(soft, 0.151); assert.equal(active(soft).y, start + 3); assert.equal(soft.score, 3);
  }
  {
    const g = make(['O']); g.move(1);
    const spawn = active(make(['O'])); put(g, spawn.x, spawn.y);
    g.hardDrop(); assert.equal(over(g), true);
    const before = JSON.stringify({ p: active(g), score: g.score, held: held(g) });
    update(g, 1); g.move(-1); g.rotate(1); hold(g); g.hardDrop();
    assert.equal(JSON.stringify({ p: active(g), score: g.score, held: held(g) }), before);
    g.restart(); assert.equal(over(g), false); assert(empty(g));
    assert.equal(g.score, 0); assert.equal(g.lines, 0); assert.equal(g.level, 1);
    assert.equal(held(g), null); assert.equal(g.canHold, true);
    assert.equal((xhigh ? g.queue : g.nextPieces).length, 5);
  }
  if (xhigh) {
    const g = make(['T']); place(g, 'T', 0, 3, 0); put(g, 3, 2);
    g.hardDrop(); assert.equal(over(g), true);
  } else {
    // Public actions from the actual spawn reach a wholly hidden legal T.
    // Test 3 kicks CW upward, then CCW fits without a kick. Incoming I is open.
    const g = make(['T', 'I']);
    put(g, 2, 2); put(g, 3, 3); put(g, 4, 3);
    assert(fits(g, active(g)));
    g.rotate(1); assert.deepEqual(active(g), { type: 'T', rotation: 1, x: 2, y: 0 });
    g.rotate(-1); assert.deepEqual(active(g), { type: 'T', rotation: 0, x: 2, y: 0 });
    assert.equal(ghost(g), 0); g.hardDrop();
    assert.equal(get(g, 3, 0), 'T'); assert.equal(get(g, 2, 1), 'T');
    assert.equal(over(g), false); assert.equal(active(g).type, 'I');
    console.log('max CONFIRMED MINOR: wholly hidden T locks after two legal rotations; game continues with I');
  }
  console.log(`${mode} PASS: normal/soft gravity, levels, blocked spawn, inert game-over actions and restart`);

  {
    const g = make(['O']);
    const { Controller, Controls } = await load('input.js');
    const listeners = {};
    const target = { addEventListener(name, callback) { listeners[name] = callback; } };
    const previousWindow = globalThis.window;
    let input;
    try {
      if (xhigh) { globalThis.window = target; input = new Controller(g); }
      else { input = new Controls(g); input.attach(target); }
      for (let i = 0; i < 50; i++) update(g, 0.016);
      const before = active(g).y;
      listeners.keydown({ code: 'ArrowDown', key: 'ArrowDown', repeat: false, preventDefault() {} });
      update(g, 0.001);
      assert.equal(active(g).y - before, 16); assert.equal(g.score, 16);
      listeners.keyup({ code: 'ArrowDown', key: 'ArrowDown' });
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  }
  console.log(`${mode} CONFIRMED MINOR: 800 ms normal time becomes 16 soft-drop rows/points after 1 ms through real input handler`);
  console.log(`${mode} engine audit passed; documented findings reproduced.`);
}

// Low and medium are independent engines; adapt their public actions and
// ordinary emitted private properties only for deterministic legal fixtures.
async function auditNew(mode) {
  const low = mode === 'low';
  const { Game } = await load('game.js');
  const pieces = await load('pieces.js');
  const { BagRandomizer } = await load('random.js');
  const types = low ? pieces.PIECE_TYPES : (await load('types.js')).PIECE_TYPES;
  const cells = (t, r) => low ? pieces.cells(t, r) : pieces.pieceCells(t, r).map(p => [p.x, p.y]);
  const make = (seq = ['T', 'I', 'O', 'S', 'Z', 'J', 'L']) => {
    let i = 0;
    const source = { next: () => seq[i++ % seq.length] };
    if (low) return new Game(source);
    const g = new Game(() => 0.5);
    g.bag = source; g.reset();
    return g;
  };
  const active = g => g.current;
  const rot = g => low ? g.current.rot : g.current.rotation;
  const fits = (g, t, r, x, y) => cells(t, r).every(([dx, dy]) =>
    x + dx >= 0 && x + dx < 10 && y + dy < 22 && (y + dy < 0 || g.board[y + dy][x + dx] === null));
  const place = (g, type, rotation, x, y) => {
    assert(fits(g, type, rotation, x, y), 'fixture must be legal');
    g.current = { type, ...(low ? { rot: rotation } : { rotation }), x, y };
    Object.assign(g, { gravityTimer: 0, lockTimer: 0, lockResets: 0, lowestY: y,
      lastMoveWasRotation: false, lastActionWasRotation: false, lastKick: 0, lastKickIndex: 0 });
  };
  const put = (g, x, y, t = 'J') => { g.board[y][x] = t; };
  const clear = g => g.board.forEach(row => row.fill(null));
  const empty = g => g.board.flat().every(c => c === null);
  const ghost = g => low ? g.ghostY() : g.ghostPiece().y;
  const hold = g => low ? g.hold() : g.holdPiece();
  const held = g => low ? g.held : g.hold;
  const over = g => low ? g.over : g.gameOver;
  const level = (g, n) => { g.lines = n; if (!low) g.level = Math.floor(n / 10) + 1; };
  const key = points => points.map(String).sort().join(' ');
  for (const type of types) for (let r = 0; r < 4; r++) {
    assert.equal(key(cells(type, r).map(([x, y]) => [x + (type === 'O' ? 1 : 0), y])), key(reference[type][r]), `${mode} ${type}${r}`);
  }
  assert.equal(new Set(Object.values(pieces.COLORS)).size, 7);
  for (const type of types) for (const transition of Object.keys(normalKicks)) {
    const [from, to] = transition.split('>').map(Number);
    const actual = low ? pieces.kickTests(type, from, to) : pieces.wallKicks(type, from, to).map(p => [p.x, -p.y || 0]);
    assert.deepEqual(actual, type === 'O' ? [[0, 0]] : (type === 'I' ? iKicks : normalKicks)[transition]);
  }
  for (const [t, x] of [['T', -1], ['I', -2]]) {
    const g = make(); place(g, t, 1, x, 12); g.rotate(-1);
    assert.equal(rot(g), 0); assert.equal(active(g).x, 0); assert.equal(active(g).y, 12);
  }
  console.log(`${mode} PASS: all 28 canonical states, colors, all ordered CW/CCW kicks and actual T/I wall kicks`);
  let seed = 42;
  const bag = new BagRandomizer(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
  for (let i = 0; i < 100; i++) assert.deepEqual(Array.from({ length: 7 }, () => bag.next()).sort(), [...types].sort());
  {
    const g = make(); assert.deepEqual(low ? g.queue : g.next, ['I', 'O', 'S', 'Z', 'J']);
    g.rotate(1); hold(g); assert.equal(held(g), 'T'); assert.equal(active(g).type, 'I'); assert.equal(rot(g), 0);
    hold(g); assert.equal(active(g).type, 'I'); g.hardDrop(); hold(g);
    assert.equal(active(g).type, 'T'); assert.equal(rot(g), 0); assert.equal(g.canHold, false);
    const w = make(['O']); for (let i = 0; i < 12; i++) w.move(-1); assert.equal(active(w).x, 0);
    for (let i = 0; i < 12; i++) w.move(1); assert.equal(active(w).x, 8);
  }
  for (const t of types) {
    const g = make([t]); put(g, 4, 20, 'Z'); const p = { ...active(g) }, r = rot(g), y = ghost(g);
    assert(fits(g, t, r, p.x, y)); assert.equal(fits(g, t, r, p.x, y + 1), false);
    const expected = cells(t, r).map(([dx, dy]) => [p.x + dx, y + dy]);
    assert.equal(new Set(expected.map(String)).size, 4); g.hardDrop();
    assert.equal(g.score, 2 * (y - p.y)); for (const [x, row] of expected) assert.equal(g.board[row][x], t);
  }
  console.log(`${mode} PASS: 100 seeded actual bags, walls, queue, hold restriction/orientation reset and seven obstructed ghost/drop geometries`);
  {
    const g = make(['O']); place(g, 'O', 0, 4, 20); g.update(0.499); assert(empty(g));
    g.update(0.0011); assert.equal(g.board[21][4], 'O');
  }
  {
    const g = make(['O']); place(g, 'O', 0, 4, 20);
    for (let i = 0; i < 15; i++) { g.update(0.49); assert(empty(g)); g.move(i % 2 ? -1 : 1); }
    assert.equal(g.lockResets, 15); g.update(0.49); g.move(-1); g.update(0.011); assert.equal(g.board[21][4], 'O');
  }
  {
    const g = make(['O']); place(g, 'O', 0, 0, 19); put(g, 0, 21);
    g.update(0.49); g.move(1); assert(fits(g, 'O', 0, 1, 20));
    g.update(0.02); assert.equal(active(g).y, 19); assert.equal(g.board[19][1], null); assert.equal(g.lockTimer, 0);
    for (let i = 0; i < 20 && g.board[21][1] === null; i++) g.update(0.1);
    assert.equal(g.board[21][1], 'O'); assert.equal(g.board[19][1], null);
  }
  console.log(`${mode} PASS: exact lock boundary, fifteen-reset cap and ledge-move mid-air lock safety`);
  const single = (g, pc = false) => {
    clear(g); for (const x of [0, 1, 2, 7, 8, 9]) put(g, x, 21);
    if (!pc) put(g, 0, 12); place(g, 'I', 0, 3, 20);
  };
  const tetris = (g, pc = false) => {
    clear(g); for (let y = 18; y < 22; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
    if (!pc) put(g, 0, 12); place(g, 'I', 1, 2, 18);
  };
  for (const [n, expected] of [[1, 100], [2, 300], [3, 500], [4, 800]]) {
    const g = make(); for (let y = 22 - n; y < 22; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
    put(g, 0, 12); place(g, 'I', 1, 2, 18); g.hardDrop(); assert.equal(g.score, expected); assert.equal(g.lines, n);
  }
  { const g = make(); single(g, true); g.hardDrop(); assert.equal(g.score, 900); assert(empty(g)); }
  {
    const g = make(); tetris(g); g.hardDrop(); assert.equal(g.score, 800); assert(g.backToBack);
    clear(g); place(g, 'O', 0, 0, 20); g.hardDrop(); assert(g.backToBack); assert.equal(g.combo, -1);
    tetris(g); g.hardDrop(); assert.equal(g.score, 2000);
    single(g); g.hardDrop(); assert.equal(g.score, 2150); assert.equal(g.backToBack, false);
  }
  {
    const g = make(); level(g, 10); g.combo = 0; single(g); g.hardDrop(); assert.equal(g.score, 300); assert.equal(g.lines, 11);
    const c = make(); level(c, 9); single(c); c.hardDrop(); assert.equal(c.score, 100); assert.equal(low ? c.level() : c.level, 2);
  }
  for (const full of [false, true]) for (const line of [false, true]) for (const timed of [false, true]) {
    const g = make(); put(g, 5, 19); put(g, 3, 21); put(g, full ? 3 : 5, full ? 19 : 21);
    if (line) for (const x of [0, 1, 2, 6, 7, 8, 9]) put(g, x, 20);
    place(g, 'T', 3, 3, 19); g.rotate(1); assert.equal(rot(g), 0); assert.equal(ghost(g), 19);
    if (timed) { for (let i = 0; i < 6; i++) g.update(0.1); } else g.hardDrop();
    assert.equal(g.score, full ? (line ? 800 : 400) : (line ? 200 : 100)); assert.equal(g.lines, Number(line));
  }
  {
    const g = make(); put(g, 3, 21); put(g, 5, 21); put(g, 5, 19); place(g, 'T', 0, 3, 19);
    g[low ? 'lastMoveWasRotation' : 'lastActionWasRotation'] = true;
    assert.equal(g.detectSpin(active(g)), 'mini'); g[low ? 'lastKick' : 'lastKickIndex'] = 4;
    assert.equal(g.detectSpin(active(g)), 'full');
  }
  {
    const g = make(); tetris(g); g.hardDrop(); clear(g); place(g, 'O', 0, 0, 20); g.hardDrop();
    tetris(g, true); g.hardDrop(); assert(empty(g)); assert.equal(g.score, 4000);
    console.log(`${mode} CONFIRMED MINOR: B2B Tetris perfect clear totals 4000 (800 + 3200), versus benchmark 5200 (800 + 4400)`);
  }
  console.log(`${mode} PASS: normal/single-PC scores, B2B continuity/break, higher-level combo/crossing, integrated full/mini spins through hard/timed locks and fifth-kick classifier`);
  for (const l of [1, 2, 5, 10, 15, 20]) {
    const expected = (0.8 - (l - 1) * 0.007) ** (l - 1), g = make(['O']); level(g, (l - 1) * 10);
    const actual = low ? g.gravityRowTime() : g.gravityInterval(); assert(Math.abs(actual - expected) < 1e-12);
    const y = active(g).y; g.update(expected * 0.999); assert.equal(active(g).y, y);
    g.update(expected * 0.002); assert.equal(active(g).y, y + 1);
  }
  {
    const g = make(['O']); g.softDropping = true; const y = active(g).y;
    g.update(0.151); assert.equal(active(g).y, y + 3); assert.equal(g.score, 3);
  }
  // Compare equal simulated time away from lock boundaries, including fast gravity.
  for (const [l, duration] of [[1, 1.1], [10, 0.6], [15, 0.1]]) {
    const states = [60, 144].map(hz => {
      const g = make(['O']); level(g, (l - 1) * 10);
      for (let i = 0; i < hz; i++) g.update(duration / hz);
      return { p: active(g), score: g.score, board: g.board };
    }); assert.deepEqual(states[0], states[1], `${mode} level ${l} equal-time 60/144 Hz`);
  }
  {
    const g = make(['O']); place(g, 'O', 0, 0, 20); put(g, 4, low ? 0 : 1); g.hardDrop(); assert(over(g));
    const before = JSON.stringify(g); g.update(1); g.move(-1); g.rotate(1); hold(g); g.hardDrop(); assert.equal(JSON.stringify(g), before);
    const fresh = low ? make(['O']) : (g.reset(), g); assert(!over(fresh)); assert(empty(fresh));
    assert.equal(fresh.score, 0); assert.equal(fresh.lines, 0); assert.equal(held(fresh), null); assert(fresh.canHold);
  }
  {
    // Reach wholly hidden lock from the actual spawn with public rotations.
    const g = make(['T', 'I']);
    if (low) { put(g, 3, 2); g.hardDrop(); assert(over(g)); }
    else {
      put(g, 2, 2); put(g, 3, 3); put(g, 4, 3);
      assert(fits(g, 'T', 0, 3, 1)); g.rotate(1); assert.deepEqual(active(g), { type: 'T', rotation: 1, x: 2, y: 0 });
      g.rotate(-1); assert.deepEqual(active(g), { type: 'T', rotation: 0, x: 2, y: 0 }); assert.equal(ghost(g), 0);
      g.hardDrop(); assert.equal(g.board[0][3], 'T'); assert.equal(g.board[1][2], 'T'); assert.equal(over(g), false); assert.equal(active(g).type, 'I');
      console.log('medium CONFIRMED MINOR: wholly hidden T locks after legal CW/CCW; play continues with I');
      const ceiling = make(['T', 'I']); put(ceiling, 0, 2); put(ceiling, 2, 3);
      const path = [['move', -1], ['move', -1], ['rotate', 1], ['rotate', 1], ['rotate', -1], ['move', -1]];
      for (const [action, direction] of path) ceiling[action](direction);
      assert.deepEqual(active(ceiling), { type: 'T', rotation: 1, x: -1, y: -1 });
      assert.equal(ghost(ceiling), -1);
      assert(fits(ceiling, 'T', 1, -1, -1));
      assert.throws(() => ceiling.hardDrop(), { name: 'TypeError', message: "Cannot set properties of undefined (setting '0')" });
      assert.equal(ceiling.gameOver, false);
      console.log('medium SAME HIDDEN-LOCK FINDING: public ceiling kick/left/zero-distance hard drop writes board[-1] and throws TypeError');

    }
  }
  {
    const g = make(['O']); for (let i = 0; i < 50; i++) g.update(0.016); const y = active(g).y;
    if (low) g.softDropping = true;
    else {
      const { Input } = await load('input.js'); const previous = globalThis.window;
      try { globalThis.window = { addEventListener() {} }; new Input(g).onKeyDown({ code: 'ArrowDown', repeat: false, preventDefault() {} }); }
      finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
    }
    g.update(0.001); assert.equal(active(g).y - y, 16); assert.equal(g.score, 16);
  }
  console.log(`${mode} PASS: gravity curve/one-row boundaries at levels 1/2/5/10/15/20, 60/144 Hz engine equivalence, soft points, blocked spawn, inert game over and reset`);
  console.log(`${mode} CONFIRMED MINOR: 800 ms normal / Down / 1 ms soft produces sixteen rows and sixteen points`);
}
