import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (!process.argv[2]) throw new Error('Pass an isolated, built run directory');
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

// Independent published SRS offsets: positive Y points up; normalize the run below.
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

const { TetrisGame: Game, getGravityIntervalMs } = await load('game.js');
const { SHAPES, COLORS, getPieceCells, getWallKicks } = await load('tetrominoes.js');
const { InputController } = await load('input.js');
const types = Object.keys(reference), bottom = 19;
const key = cells => cells.map(([x, y]) => `${x},${y}`).sort().join(' ');
const absolute = p => getPieceCells(p.type, p.x, p.y, p.rotation).map(({ x, y }) => [x, y]);
const make = (sequence = ['T', 'I', 'O', 'S', 'Z', 'J', 'L']) => new Game({ seedQueue: sequence, rng: () => 0.5 });
const clear = g => g.board.forEach(row => row.fill(null));
const empty = g => g.board.flat().every(c => c === null);
const put = (g, x, y, type = 'J') => { g.board[y][x] = type; };
const fits = (g, p) => g.isValidPosition(p.x, p.y, p.rotation, p.type);
const place = (g, type, rotation, x, y) => {
  Object.assign(g, { activePiece: { type, rotation, x, y }, gravityTimer: 0, lockTimer: 0,
    lockResets: 0, lowestY: y, lastMoveWasRotation: false, lastKickIndex: 0 });
  assert(fits(g, g.activePiece));
};
const placeO = (g, left, top) => place(g, 'O', 0, left - 1, top);
for (const type of types) for (let r = 0; r < 4; r++) {
  assert.equal(key(SHAPES[type][r].map(({ x, y }) => [x, y])), key(reference[type][r]), `${type}${r}`);
}
assert.equal(new Set(Object.values(COLORS)).size, 7);
for (const type of types) for (const transition of Object.keys(normalKicks)) {
  const [from, to] = transition.split('>').map(Number);
  const yUp = getWallKicks(type, from, to).map(({ x, y }) => [x || 0, -y || 0]);
  assert.deepEqual(yUp, type === 'O' ? [[0, 0]] : (type === 'I' ? iKicks : normalKicks)[transition]);
}
console.log('PASS: all 28 canonical SRS states, seven colors, every CW/CCW kick table');
for (const [type, x] of [['T', -1], ['I', -2]]) {
  const g = make(); place(g, type, 1, x, 10); assert(g.rotate(-1));
  assert.deepEqual(g.activePiece, { type, rotation: 0, x: 0, y: 10 });
}
for (const [type, expectedX] of [['T', 7], ['I', 6]]) {
  const g = make(); place(g, type, 3, 8, 10); assert(g.rotate(1));
  assert.deepEqual(g.activePiece, { type, rotation: 0, x: expectedX, y: 10 });
}
{
  let seed = 42;
  const g = new Game({ rng: () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32) });
  for (let b = 0; b < 10; b++) {
    const drawn = [];
    for (let i = 0; i < 7; i++) { drawn.push(g.activePiece.type); clear(g); g.hardDrop(); assert(!g.gameOver); }
    assert.deepEqual(drawn.sort(), [...types].sort());
  }
}
{
  const g = make(); assert.deepEqual(g.nextQueue, ['I', 'O', 'S', 'Z', 'J']);
  assert(g.rotate(1)); assert(g.hold()); assert.equal(g.holdPiece, 'T');
  assert.equal(g.activePiece.type, 'I'); assert.equal(g.activePiece.rotation, 0);
  assert.equal(g.canHold, false); assert.equal(g.hold(), false);
  g.hardDrop(); assert(g.hold()); assert.equal(g.activePiece.type, 'T');
  assert.equal(g.activePiece.rotation, 0); assert.equal(g.canHold, false);
  const w = make(); placeO(w, 4, 10);
  while (w.moveLeft()) {} assert.equal(Math.min(...absolute(w.activePiece).map(([x]) => x)), 0);
  while (w.moveRight()) {} assert.equal(Math.max(...absolute(w.activePiece).map(([x]) => x)), 9);
}
for (const type of types) {
  const g = make([type]); put(g, 4, bottom - 1);
  const p = { ...g.activePiece }, y = g.getGhostY();
  assert(fits(g, { ...p, y })); assert(!fits(g, { ...p, y: y + 1 }));
  const expected = absolute({ ...p, y }); assert.equal(new Set(expected.map(String)).size, 4);
  g.hardDrop(); assert.equal(g.score, 2 * (y - p.y));
  for (const [x, row] of expected) assert.equal(g.board[row][x], type);
}
console.log('PASS: actual T/I CW/CCW kicks, ten seeded bags, walls, queue, hold restriction/orientation reset, seven obstructed ghost/drop geometries');
{
  const g = make(); placeO(g, 4, bottom - 1);
  g.tick(499); assert(empty(g)); g.tick(1); assert.equal(g.board[bottom][4], 'O');
}
{
  const g = make(); placeO(g, 4, bottom - 1);
  for (let i = 0; i < 15; i++) { g.tick(490); assert(empty(g)); assert(i % 2 ? g.moveLeft() : g.moveRight()); }
  assert.equal(g.lockResets, 15);
  g.tick(490); g.moveLeft(); g.tick(10); assert.equal(g.board[bottom][4], 'O');
}
{
  const g = make(); placeO(g, 0, bottom - 2); put(g, 0, bottom);
  assert(g.isGrounded()); g.tick(490); assert(g.moveRight()); assert(!g.isGrounded());
  g.tick(20); assert.equal(g.activePiece.y, bottom - 2); assert.equal(g.board[bottom - 2][1], null);
  for (let i = 0; i < 20 && g.board[bottom][1] === null; i++) g.tick(100);
  assert.equal(g.board[bottom][1], 'O'); assert.equal(g.board[bottom - 2][1], null);
}
console.log('PASS: exact 499/500 ms lock boundary, fifteen-reset cap and ledge-move mid-air lock probe');
const single = (g, perfect = false) => {
  clear(g); for (const x of [0, 1, 2, 7, 8, 9]) put(g, x, bottom);
  if (!perfect) put(g, 0, bottom - 9);
  place(g, 'I', 0, 3, bottom - 1);
};
const tetris = g => {
  clear(g); for (let y = bottom - 3; y <= bottom; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
  put(g, 0, bottom - 9); place(g, 'I', 1, 2, bottom - 3);
};
{
  const g = make(); single(g, true); assert.equal(g.hardDrop(), 0);
  assert.equal(g.score, 100); assert.equal(g.lines, 1); assert(empty(g));
  console.log('CONFIRMED MINOR: single perfect clear awards 100; benchmark expectation 900');
}
for (const [lines, expected] of [[1, 100], [2, 300], [3, 500]]) {
  const g = make();
  if (lines === 1) single(g);
  else {
    for (let y = bottom - lines + 1; y <= bottom; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
    put(g, 0, bottom - 9); place(g, 'I', 1, 2, bottom - 3);
  }
  g.hardDrop(); assert.equal(g.score, expected); assert.equal(g.lines, lines);
}
{
  const g = make(); tetris(g); g.hardDrop(); assert.equal(g.score, 800);
  clear(g); placeO(g, 0, bottom - 1); g.hardDrop(); assert.equal(g.backToBack, true);
  tetris(g); g.hardDrop(); assert.equal(g.score, 2000);
  single(g); g.hardDrop(); assert.equal(g.score, 2150); assert.equal(g.backToBack, false);
  const combo = make(); combo.lines = 10; combo.level = 2; combo.combo = 0;
  single(combo); combo.hardDrop(); assert.equal(combo.score, 300); assert.equal(combo.lines, 11);
  const crossing = make(); crossing.lines = 9; single(crossing); crossing.hardDrop();
  assert.equal(crossing.score, 100); assert.equal(crossing.level, 2);
}
for (const full of [false, true]) for (const line of [false, true]) {
  const g = make(), y = bottom - 2;
  put(g, 5, y); put(g, 3, bottom); put(g, full ? 3 : 5, full ? y : bottom);
  if (line) for (const x of [0, 1, 2, 6, 7, 8, 9]) put(g, x, bottom - 1);
  place(g, 'T', 3, 3, y); assert(g.rotate(1));
  assert.equal(g.activePiece.rotation, 0); assert.equal(g.getGhostY(), y); assert.equal(g.hardDrop(), 0);
  assert.equal(g.score, full ? (line ? 800 : 400) : (line ? 200 : 100)); assert.equal(g.lines, Number(line));
}
{
  const g = make(); put(g, 3, bottom); put(g, 5, bottom); put(g, 5, bottom - 2);
  place(g, 'T', 0, 3, bottom - 2); g.lastMoveWasRotation = true;
  assert.deepEqual(g.detectTSpin(), { isTSpin: false, isMiniTSpin: true });
  g.lastKickIndex = 4; assert.deepEqual(g.detectTSpin(), { isTSpin: true, isMiniTSpin: false });
  clear(g); assert.deepEqual(g.detectTSpin(), { isTSpin: false, isMiniTSpin: false });
}
console.log('PASS: normal clears, full/mini zero/single spin integration, fifth-kick classifier, B2B continuity/break, level-two combo, pre-clear-level scoring');
{
  const g = make(['O']), y = g.activePiece.y;
  g.tick(999); assert.equal(g.activePiece.y, y); g.tick(1); assert.equal(g.activePiece.y, y + 1);
  const fast = make(['O']); fast.level = 2; fast.lines = 10;
  assert.equal(getGravityIntervalMs(2), 793); fast.tick(792); assert.equal(fast.activePiece.y, y);
  fast.tick(1); assert.equal(fast.activePiece.y, y + 1);
  const s = make(['O']); for (let i = 0; i < 50; i++) s.tick(16);
  const input = new InputController(s, () => {});
  const down = () => input.handleKeyDown({ key: 'ArrowDown', code: 'ArrowDown', preventDefault() {} });
  down(); s.tick(1); assert.equal(s.activePiece.y, y + 1); assert.equal(s.score, 1);
  down(); down(); assert.equal(s.activePiece.y, y + 3); assert.equal(s.score, 3);
  s.tick(999); assert.equal(s.activePiece.y, y + 3); s.tick(1); assert.equal(s.activePiece.y, y + 4);
  console.log('PASS: 1000/793 ms gravity; each soft-drop keydown moves/scores once and resets normal timer without a transition jump');
}
{
  const g = make(['O', 'T']); placeO(g, 0, bottom - 1); put(g, 4, 0); g.hardDrop();
  assert(g.gameOver); const before = g.getState();
  g.tick(1000); g.moveLeft(); g.rotate(1); g.hold(); g.hardDrop(); g.softDrop();
  assert.deepEqual(g.getState(), before);
  assert(g.handleKey('r', 'KeyR')); assert(!g.gameOver); assert(empty(g));
  assert.equal(g.score, 0); assert.equal(g.lines, 0); assert.equal(g.level, 1);
  assert.equal(g.holdPiece, null); assert(g.canHold); assert.equal(g.nextQueue.length, 5);
}
{
  // Entirely hidden lock through public moves/rotations from the actual spawn.
  // The next I spawn remains open, distinguishing lock-out from block-out.
  const g = make(['T', 'I']);
  for (const [x, y] of [[0, 0], [8, 0], [0, 1], [2, 2], [7, 2]]) put(g, x, y);
  assert(fits(g, g.activePiece)); assert(g.moveLeft()); assert(g.moveLeft());
  for (let i = 0; i < 4; i++) assert(g.rotate(1));
  assert.deepEqual(g.activePiece, { type: 'T', x: 0, y: -2, rotation: 0 });
  assert(absolute(g.activePiece).every(([, y]) => y < 0));
  assert(g.isGrounded()); assert.equal(g.getGhostY(), -2);
  assert(fits(g, { type: 'I', rotation: 0, x: 3, y: 0 }));
  assert.equal(g.hardDrop(), 0); assert(g.gameOver); assert.equal(g.lastAction, 'GAME OVER');
}
{
  const g = make(); const before = g.getState(); g.paused = true;
  g.tick(1000); assert(!g.moveLeft()); assert(!g.rotate(1)); assert(!g.hold()); assert.equal(g.hardDrop(), 0);
  g.paused = false; assert.deepEqual(g.getState(), before);
  const snapshot = g.getState(); snapshot.board[19][0] = 'I'; snapshot.nextQueue[0] = 'Z'; snapshot.activePiece.x = -99;
  assert.deepEqual(g.getState(), before);
}
console.log('PASS: blocked-spawn game over, inert game-over actions, restart, entirely hidden lock-out, pause and copied snapshots');
console.log('Gemini high engine audit passed; recorded findings reproduced.');

