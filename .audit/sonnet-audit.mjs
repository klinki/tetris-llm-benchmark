import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run against a disposable built copy, never a run directory in this checkout.
if (!process.argv[2]) throw new Error('Pass an isolated, built run directory');
const root = resolve(process.argv[2]);
const mode = process.argv[3] ?? root.split('-').at(-1);
assert(['low', 'medium', 'high', 'xhigh'].includes(mode), 'Unknown Sonnet effort');
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

const { Game } = await load('game.js');
const pieces = await load('pieces.js');
const rows = mode === 'xhigh' ? 40 : 22;
const hidden = rows - 20, bottom = rows - 1;
const local = (type, rotation) => mode === 'low'
  ? pieces.ROTATIONS[type][rotation].flatMap((row, y) => row.flatMap((v, x) => v ? [[x, y]] : []))
  : mode === 'medium' ? pieces.SHAPES[type][rotation]
    : mode === 'high' ? pieces.pieceCells(type, rotation) : pieces.SHAPES[type].rotations[rotation];
const key = cells => cells.map(([x, y]) => `${x},${y}`).sort().join(' ');
const types = Object.keys(reference);
for (const type of types) for (let r = 0; r < 4; r++) {
  const shift = type === 'O' && mode !== 'medium' ? 1 : 0;
  assert.equal(key(local(type, r).map(([x, y]) => [x + shift, y])), key(reference[type][r]), `${type}${r}`);
}
assert.equal(new Set(Object.values(pieces.COLORS)).size, 7);
for (const type of types) for (const transition of Object.keys(normalKicks)) {
  const [from, to] = transition.split('>').map(Number);
  const actual = mode === 'low' ? pieces.kicks(type, from, to)
    : pieces.kicksFor(type, from, mode === 'high' ? (to - from + 4) % 4 === 1 : to);
  // Normalize negative zero from y inversion; coordinates, order and count remain exact.
  const yUp = actual.map(([x, y]) => [x || 0, -y || 0]);
  assert.deepEqual(yUp, type === 'O' ? [[0, 0]] : (type === 'I' ? iKicks : normalKicks)[transition]);
}
console.log(`${mode} PASS: 28 canonical SRS states, seven colors, every CW/CCW kick table`);

const scripted = sequence => {
  let i = 0;
  return { next: () => sequence[i++ % sequence.length],
    peek: n => Array.from({ length: n }, (_, k) => sequence[(i + k) % sequence.length]) };
};
const make = (sequence = ['T', 'I', 'O', 'S', 'Z', 'J', 'L']) => {
  if (mode === 'xhigh') return new Game(scripted(sequence));
  const g = new Game(() => 0.5);
  const queue = Array.from({ length: mode === 'low' ? 4 : mode === 'medium' ? 6 : 5 }, (_, i) => sequence[(i + 1) % sequence.length]);
  if (mode === 'low') g.next = queue; else g.queue = queue;
  g.spawn(sequence[0]); // emitted private method, used only for deterministic source setup
  return g;
};
const rawActive = g => mode === 'medium' ? g.active : mode === 'xhigh' ? g.piece : g.current;
const active = g => {
  const p = rawActive(g);
  return { type: p.type, rotation: mode === 'medium' ? p.rot : p.rotation, x: p.x, y: p.y };
};
const get = (g, x, y) => mode === 'low' ? g.board[y][x] : mode === 'medium' ? g.board[y * 10 + x] : g.board.get(x, y);
const put = (g, x, y, value = 'J') => {
  if (mode === 'low') g.board[y][x] = value;
  else if (mode === 'medium') g.board[y * 10 + x] = value;
  else g.board.set(x, y, value);
};
const clear = g => { for (let y = 0; y < rows; y++) for (let x = 0; x < 10; x++) put(g, x, y, null); };
const empty = g => Array.from({ length: rows }, (_, y) => Array.from({ length: 10 }, (_, x) => get(g, x, y))).flat().every(c => c === null);
const fits = (g, p) => local(p.type, p.rotation).every(([dx, dy]) => {
  const x = p.x + dx, y = p.y + dy;
  return x >= 0 && x < 10 && y >= 0 && y < rows && get(g, x, y) === null;
});
const absolute = p => local(p.type, p.rotation).map(([x, y]) => [p.x + x, p.y + y]);
const place = (g, type, rotation, x, y) => {
  const p = mode === 'medium' ? { type, rot: rotation, x, y } : { type, rotation, x, y };
  if (mode === 'medium') g.active = p;
  else if (mode === 'xhigh') g.piece = p;
  else g.current = p;
  Object.assign(g, { gravityAcc: 0, gravityTimer: 0, lockTimer: 0, lockResets: 0,
    lowestY: y, lastMoveWasRotation: false, lastKick: 0, lastKickIndex: 0 });
  assert(fits(g, active(g)), 'fixture must be collision-free');
};
const placeO = (g, x, y) => place(g, 'O', 0, x - (mode === 'medium' ? 1 : 0), y);
const move = (g, dx) => ['medium', 'high'].includes(mode) ? (dx < 0 ? g.moveLeft() : g.moveRight()) : g.move(dx);
const rotate = (g, dir) => g.rotate(mode === 'high' ? dir === 1 : dir);
const ghost = g => mode === 'high' ? g.ghostY() : g.ghost().y;
const hold = g => mode === 'medium' ? g.hold() : g.holdPiece();
const held = g => ['medium', 'high'].includes(mode) ? g.held : g.hold;
const queue = g => mode === 'medium' || mode === 'high' ? g.queue : g.next;
const canHold = g => mode === 'high' ? !g.holdUsed : g.canHold;
const over = g => ['low', 'medium'].includes(mode) ? g.gameOver : g.status.toLowerCase() === 'gameover';
const soft = (g, on) => mode === 'medium' ? (g.softDrop = on) : g.setSoftDrop(on);
const update = (g, ms) => g.update(ms);
const setCombo = (g, prior) => { g.combo = mode === 'high' ? prior + 1 : prior; };
const setLevel = (g, lines) => { g.lines = lines; g.level = Math.min(15, 1 + Math.floor(lines / 10)); };

for (const [type, x] of [['T', -1], ['I', -2]]) {
  const g = make(); place(g, type, 1, x, bottom - 9);
  assert(rotate(g, -1));
  assert.deepEqual(active(g), { type, rotation: 0, x: 0, y: bottom - 9 });
}
for (const [type, expectedX] of [['T', 7], ['I', 6]]) {
  const g = make(); place(g, type, 3, 8, bottom - 9);
  assert(rotate(g, 1));
  assert.deepEqual(active(g), { type, rotation: 0, x: expectedX, y: bottom - 9 });
}
{
  let seed = 42;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const g = mode === 'xhigh' ? new Game(new (await load('bag.js')).SevenBag(random)) : new Game(random);
  for (let bag = 0; bag < 10; bag++) {
    const drawn = [];
    for (let i = 0; i < 7; i++) {
      drawn.push(active(g).type);
      clear(g); g.hardDrop();
      assert.equal(over(g), false);
    }
    assert.deepEqual(drawn.sort(), [...types].sort());
  }
}
{
  const g = make();
  assert.deepEqual(queue(g).slice(0, 5), ['I', 'O', 'S', 'Z', 'J'].slice(0, mode === 'low' ? 4 : 5));
  assert(rotate(g, 1)); hold(g);
  assert.equal(held(g), 'T'); assert.equal(active(g).type, 'I'); assert.equal(active(g).rotation, 0);
  assert.equal(canHold(g), false); hold(g); assert.equal(active(g).type, 'I');
  g.hardDrop(); hold(g);
  assert.equal(active(g).type, 'T'); assert.equal(active(g).rotation, 0); assert.equal(canHold(g), false);
  const w = make(); placeO(w, 4, bottom - 9);
  for (let i = 0; i < 12; i++) move(w, -1);
  assert.equal(Math.min(...absolute(active(w)).map(([x]) => x)), 0); assert.equal(move(w, -1), false);
  for (let i = 0; i < 12; i++) move(w, 1);
  assert.equal(Math.max(...absolute(active(w)).map(([x]) => x)), 9); assert.equal(move(w, 1), false);
}
for (const type of types) {
  const g = make([type]); put(g, 4, bottom - 1, 'Z');
  const p = active(g), y = ghost(g);
  assert(fits(g, { ...p, y })); assert.equal(fits(g, { ...p, y: y + 1 }), false);
  const expected = absolute({ ...p, y }); assert.equal(new Set(expected.map(String)).size, 4);
  g.hardDrop(); assert.equal(g.score, 2 * (y - p.y));
  for (const [x, row] of expected) assert.equal(get(g, x, row), type);
}
console.log(`${mode} PASS: actual T/I CW/CCW wall kicks, ten seeded bags, walls, queue, hold restriction/reset, seven obstructed ghost/drop outcomes`);

{
  const g = make(['O']); placeO(g, 4, bottom - 1);
  update(g, 499); assert(empty(g)); update(g, 1.1); assert.equal(get(g, 4, bottom), 'O');
}
{
  const g = make(['O']); placeO(g, 4, bottom - 1);
  for (let i = 0; i < 15; i++) {
    update(g, 490); assert(empty(g)); move(g, i % 2 ? -1 : 1);
  }
  assert.equal(g.lockResets, 15);
  update(g, 490); move(g, -1); update(g, 11); assert.equal(get(g, 4, bottom), 'O');
}
{
  const g = make(['O']); placeO(g, 0, bottom - 2); put(g, 0, bottom);
  update(g, 490); move(g, 1); assert(fits(g, { ...active(g), y: bottom - 1 }));
  update(g, 20);
  assert.equal(active(g).y, bottom - 2); assert.equal(get(g, 1, bottom - 2), null);
  // Xhigh retains a timer while airborne but consults it only when grounded;
  // descent resets it. Assert behavior instead of requiring a private representation.
  for (let i = 0; i < 20 && get(g, 1, bottom) === null; i++) update(g, 100);
  assert.equal(get(g, 1, bottom), 'O'); assert.equal(get(g, 1, bottom - 2), null);
}
console.log(`${mode} PASS: 499/500 ms lock boundary, fifteen-reset cap and ledge-move mid-air lock probe`);

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
  const g = make(); single(g, true); g.hardDrop();
  assert.equal(g.score, ['low', 'medium'].includes(mode) ? 100 : 900); assert.equal(g.lines, 1); assert(empty(g));
  console.log(`${mode} ${['low', 'medium'].includes(mode) ? 'CONFIRMED' : 'PASS'}: single perfect clear ${g.score}; benchmark expectation 900`);
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
  clear(g); placeO(g, 0, bottom - 1); g.hardDrop();
  if (mode !== 'low') assert.equal(g.backToBack, true);
  tetris(g); g.hardDrop(); assert.equal(g.score, mode === 'low' ? 1600 : 2000);
  single(g); g.hardDrop(); assert.equal(g.score, mode === 'low' ? 1700 : 2150);
  if (mode !== 'low') assert.equal(g.backToBack, false);
}
{
  const g = make(); setLevel(g, 10); setCombo(g, 0); single(g); g.hardDrop();
  assert.equal(g.score, mode === 'low' ? 200 : 300); assert.equal(g.level, 2); assert.equal(g.lines, 11);
  const crossing = make(); setLevel(crossing, 9); single(crossing); crossing.hardDrop();
  assert.equal(crossing.score, 100); assert.equal(crossing.level, 2);
}
for (const full of [false, true]) for (const line of [false, true]) {
  const g = make(), y = bottom - 2;
  put(g, 5, y); put(g, 3, bottom); put(g, full ? 3 : 5, full ? y : bottom);
  if (line) for (const x of [0, 1, 2, 6, 7, 8, 9]) put(g, x, bottom - 1);
  place(g, 'T', 3, 3, y); assert(rotate(g, 1));
  assert.equal(active(g).rotation, 0); assert.equal(ghost(g), y); g.hardDrop();
  assert.equal(g.score, mode === 'low' ? (line ? 100 : 0) : full ? (line ? 800 : 400) : (line ? 200 : 100));
  assert.equal(g.lines, Number(line));
}
if (mode !== 'low') {
  const g = make(); put(g, 3, bottom); put(g, 5, bottom); put(g, 5, bottom - 2);
  place(g, 'T', 0, 3, bottom - 2); g.lastMoveWasRotation = true;
  assert.equal(g.detectTSpin(), 'mini');
  if (mode === 'xhigh') g.lastKick = 4; else g.lastKickIndex = 4;
  assert.equal(g.detectTSpin(), 'full');
}
console.log(`${mode} ${mode === 'low' ? 'CONFIRMED: no full/mini spin, B2B, combo or perfect-clear scoring (one grouped major)' : 'PASS: normal clears, full/mini spin integration, fifth-kick classifier, B2B continuity/break, level-two combo and pre-clear level'}`);

{
  const g = make(['O']), y = active(g).y;
  update(g, 999); assert.equal(active(g).y, y); update(g, 1.1); assert.equal(active(g).y, y + 1);
  const fast = make(['O']); setLevel(fast, 10);
  update(fast, 792); assert.equal(active(fast).y, y); update(fast, 1.1); assert.equal(active(fast).y, y + 1);
  const s = make(['O']); soft(s, true); update(s, 151);
  assert.equal(active(s).y, y + 3); assert.equal(s.score, 3);
}
{
  const g = make(['O', 'T']); placeO(g, 0, bottom - 1);
  put(g, 4, mode === 'low' ? 1 : mode === 'xhigh' ? hidden - 2 : 0);
  g.hardDrop(); assert.equal(over(g), true);
  const state = () => JSON.stringify({ active: active(g), score: g.score, held: held(g), board: g.board });
  const before = state(); update(g, 1000); move(g, -1); rotate(g, 1); hold(g); g.hardDrop();
  assert.equal(state(), before);
  g.restart(); assert.equal(over(g), false); assert(empty(g));
  assert.equal(g.score, 0); assert.equal(g.lines, 0); assert.equal(g.level, 1);
  assert.equal(held(g), null); assert.equal(canHold(g), true);
  assert.equal(queue(g).length, mode === 'low' ? 4 : mode === 'medium' ? 6 : 5);
}
{
  const g = make(['O', 'T', 'I']);
  for (let i = 0; i < 4; i++) move(g, -1);
  put(g, 2, hidden); put(g, 3, hidden + 1); put(g, 4, hidden + 1);
  assert(fits(g, active(g))); hold(g); // actual T spawn; no active/rotation-flag injection
  assert.deepEqual(active(g), { type: 'T', rotation: 0, x: 3, y: hidden - 1 });
  assert(rotate(g, 1));
  assert.deepEqual(active(g), { type: 'T', rotation: 1, x: 2, y: hidden - 2 });
  assert(rotate(g, -1)); assert(move(g, -1)); assert(move(g, -1));
  assert.deepEqual(active(g), { type: 'T', rotation: 0, x: 0, y: hidden - 2 });
  assert.equal(ghost(g), hidden - 2); g.hardDrop();
  assert.equal(get(g, 1, hidden - 2), 'T');
  // The next I's spawn is open even after this lock, so this is not block-out.
  assert(fits(g, { type: 'I', rotation: 0, x: 3, y: mode === 'low' ? 1 : hidden - 2 }));
  assert.equal(over(g), mode !== 'low');
  if (mode === 'low') assert.equal(active(g).type, 'I');
  console.log(`${mode} ${mode === 'low' ? 'CONFIRMED MINOR: wholly hidden T locks; unblocked I spawns and game continues' : 'PASS: entirely hidden lock-out'}`);
}
console.log(`${mode} PASS: normal/soft gravity, levels, blocked-spawn game over, inert actions and restart`);

{
  const g = make(['O']);
  for (let i = 0; i < 50; i++) update(g, 16);
  const y = active(g).y; soft(g, true); update(g, 1);
  assert.equal(active(g).y - y, 16); assert.equal(g.score, 16);
  console.log(`${mode} CONFIRMED MINOR: 800 ms normal accumulator becomes sixteen rows/points after 1 ms of soft drop`);
}
console.log(`${mode} engine audit passed; documented findings reproduced.`);

