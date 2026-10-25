// Engine probes for gpt-6.1-sol-{low,medium,high,xhigh}. Run against a fresh
// temporary build: node .audit/gpt61-sol-audit.mjs <copy> <effort>.
// Adapters call the emitted engine methods; private fields are touched only
// to place deterministic fixtures. No rule body is repaired or replaced.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2]), mode = process.argv[3];
assert(['low', 'medium', 'high', 'xhigh'].includes(mode), 'effort');
const load = file => import(pathToFileURL(resolve(root, 'dist', file)));

// Same canonical coordinate oracle as the October 23 and later audits.
const reference = {
  I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]],
  O: Array.from({ length: 4 }, () => [[1,0],[2,0],[1,1],[2,1]]),
  S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
};
// Independent published SRS offsets with positive Y upward; negated below.
const normalKicks = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]], '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const iKicks = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

// Field coordinates: x 0..9, y 0..19 visible, negative y above the field.
// Low stores a 22-row array whose rows 0-1 are hidden (field y = row - 2).
const core = await load(mode === 'low' ? 'game.js' : mode === 'medium' ? 'game.js' : 'engine.js');
const pieces = mode === 'xhigh' ? await load('pieces.js') : null;
const types = Object.keys(reference), bottom = 19;
const offset = mode === 'low' ? 2 : 20, top = -offset;
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const make = (seed = 42) => {
  const g = new core.Game(seeded(seed));
  if (['high', 'xhigh'].includes(mode)) g.start();
  return g;
};
const row = (g, y) => g.board[y + offset];
const get = (g, x, y) => row(g, y)[x];
const put = (g, x, y, kind = 'J') => { row(g, y)[x] = kind; };
const clear = g => g.board.forEach(r => r.fill(null));
const count = g => g.board.flat().filter(Boolean).length;
const local = (kind, r) => {
  if (mode === 'low') return core.blocks({ kind, rotation: r, x: 0, y: 0 });
  if (mode === 'medium') return core.blocks(kind, r);
  if (mode === 'high') return core.shape(kind, r);
  return pieces.shape(kind, r);
};
const fieldY = y => (mode === 'low' ? y - 2 : y);
const engineY = y => (mode === 'low' ? y + 2 : y);
const active = g => g.active && { ...g.active, y: fieldY(g.active.y) };
const absolute = p => local(p.kind, p.rotation).map(([x, y]) => [x + p.x, y + p.y]);
const fits = (g, p) => absolute(p).every(([x, y]) => x >= 0 && x < 10 && y <= bottom && y >= top && !get(g, x, y));
const over = g => (mode === 'high' ? g.status === 'over' : mode === 'xhigh' ? g.phase === 'over' : g.over);
const canHold = g => (mode === 'medium' ? !g.holdUsed : g.canHold);
const move = (g, d) => g.move(d);
const rotate = (g, d) => g.rotate(d);
const hard = g => g.hardDrop();
const soft = g => { const y = g.active.y; g.softDrop(); return g.active.y !== y; };
// Xhigh has no engine soft flag: its Input dispatches softDrop on keydown and
// every 35 ms while held. Normal gravity is the only engine-timed motion.
const step = (g, ms, isSoft = false) => (mode === 'medium' ? g.tick(ms, isSoft) : mode === 'xhigh' ? g.update(ms) : g.update(ms, isSoft));
const advance = (g, ms, isSoft = false) => { while (ms > 1e-9) { const dt = Math.min(ms, 16); step(g, dt, isSoft); ms -= dt; } };
const ghostY = g => (mode === 'low' ? fieldY(g.ghost().y) : mode === 'medium' ? g.ghostY() : g.ghost().y);
const reset = g => (mode === 'low' || mode === 'medium' ? g.reset() : mode === 'high' ? g.restart() : g.start());
const setLevel = (g, n, lines = (n - 1) * 10) => { g.lines = lines; if (mode !== 'medium') g.level = n; };
const place = (g, kind, rotation, x, y) => {
  g.active = { kind, rotation, x, y: engineY(y) };
  if (mode === 'low') Object.assign(g, { gravityTimer: 0, lockTimer: 0, lockResets: 0, lastRotate: false, lastKick: 0 });
  if (mode === 'medium') Object.assign(g, { fallTime: 0, lockTime: 0, lockResets: 0, lastRotation: false, kickIndex: 0 });
  if (mode === 'high') Object.assign(g, { fallTime: 0, lockTime: 0, lockResets: 0, lastRotation: null });
  if (mode === 'xhigh') Object.assign(g, { gravityTime: 0, lockTime: 0, lockResets: 0, touchedGround: false, lastRotation: null });
  assert(fits(g, active(g)), 'fixture starts collision-free');
};
const key = cells => cells.map(([x, y]) => `${x},${y}`).sort().join(' ');
const evidence = { mode };
const record = (name, value) => { evidence[name] = value; };

// Seven distinct colors in the delivered color table.
{
  const source = readFileSync(resolve(root, 'src', mode === 'high' ? 'renderer.ts' : mode === 'xhigh' ? 'pieces.ts' : 'game.ts'), 'utf8');
  const table = source.match(/COLORS[^=]*=\s*\{([^}]+)\}/)[1];
  record('colors', new Set([...table.matchAll(/['"](#[0-9a-fA-F]{6})['"]/g)].map(m => m[1].toLowerCase())).size);
}
// All 28 canonical states.
const wrongStates = [];
for (const t of types) for (let r = 0; r < 4; r++) if (key(local(t, r)) !== key(reference[t][r])) wrongStates.push(t + r);
record('wrongStates', wrongStates);
// All 48 ordered non-O kick candidate sequences, captured from real rotate().
const wrongKicks = [];
for (const t of types.filter(t => t !== 'O')) for (const transition of Object.keys(normalKicks)) {
  const [from, to] = transition.split('>').map(Number), g = make();
  place(g, t, from, 3, 8);
  const seen = [], start = { ...g.active };
  const capture = p => { if (p.rotation === to) seen.push([p.x - start.x, p.y - start.y]); return false; };
  if (mode === 'low') g.valid = capture; else g.fits = capture;
  assert.equal(rotate(g, (to - from + 4) % 4 === 1 ? 1 : -1), false);
  const expected = (t === 'I' ? iKicks : normalKicks)[transition].map(([x, y]) => [x, -y || 0]);
  if (JSON.stringify(seen) !== JSON.stringify(expected)) wrongKicks.push(`${t}:${transition}`);
}
record('wrongKicks', wrongKicks);
// Walls and concrete wall/floor kicks.
for (const t of types) {
  const g = make(); place(g, t, 0, 3, 8);
  for (const d of [-1, 1]) { for (let i = 0; i < 20; i++) move(g, d); const xs = absolute(active(g)).map(([x]) => x); assert.equal(d < 0 ? Math.min(...xs) : Math.max(...xs), d < 0 ? 0 : 9); }
}
{
  const kicks = {};
  const t = make(); place(t, 'T', 1, -1, 5); assert(rotate(t, -1)); kicks.tLeftWallCcw = active(t);
  const i = make(); place(i, 'I', 1, -2, 5); assert(rotate(i, -1)); kicks.iLeftWallCcw = active(i);
  const f = make(); place(f, 'T', 0, 3, 18); assert(rotate(f, 1)); kicks.tFloorCw = active(f);
  const fi = make(); place(fi, 'I', 0, 3, 18); assert(rotate(fi, 1)); kicks.iFloorCw = active(fi);
  record('kicks', kicks);
  assert.deepEqual(kicks.tLeftWallCcw, { kind: 'T', rotation: 0, x: 0, y: 5 });
  assert.deepEqual(kicks.iLeftWallCcw, { kind: 'I', rotation: 0, x: 0, y: 5 });
  assert.deepEqual(kicks.tFloorCw, { kind: 'T', rotation: 1, x: 2, y: 17 });
  assert.deepEqual(kicks.iFloorCw, { kind: 'I', rotation: 1, x: 4, y: 16 });
}
// 100 actual engine bags: ten seeds x ten bags through real spawns.
for (let seed = 1; seed <= 10; seed++) {
  const g = make(seed);
  for (let bag = 0; bag < 10; bag++) {
    const dealt = [];
    for (let i = 0; i < 7; i++) { dealt.push(g.active.kind); clear(g); hard(g); assert(!over(g)); }
    assert.deepEqual(dealt.sort(), [...types].sort(), `seed ${seed} bag ${bag}`);
  }
}
record('bags', 100);
// Hold: first hold, once-per-piece restriction, post-lock retrieval in spawn orientation.
{
  const g = make(), first = g.active.kind, next = g.queue[0];
  rotate(g, 1); g.hold();
  const afterFirst = { kind: g.active.kind, held: g.held, canHold: canHold(g) };
  const kept = { ...g.active }; g.hold();
  const restricted = JSON.stringify(g.active) === JSON.stringify(kept);
  clear(g); hard(g); const afterLock = canHold(g); const outgoing = g.active.kind; g.hold();
  const swap = { kind: g.active.kind, rotation: g.active.rotation, held: g.held };
  record('hold', { first, next, afterFirst, restricted, afterLock, swap });
  assert.deepEqual(afterFirst, { kind: next, held: first, canHold: false });
  assert(restricted); assert(afterLock);
  assert.deepEqual(swap, { kind: first, rotation: 0, held: outgoing });
}
// Ghost, hard-drop points and welded cells for all seven pieces over an obstruction.
for (const t of types) {
  const g = make(); clear(g); place(g, t, 0, 3, 0); put(g, 4, bottom - 3);
  const p = active(g), y = ghostY(g);
  assert(fits(g, { ...p, y })); assert(!fits(g, { ...p, y: y + 1 }));
  hard(g);
  assert.equal(g.score, 2 * (y - p.y));
  for (const [x, yy] of absolute({ ...p, y })) assert.equal(get(g, x, yy), t);
}
record('ghost', 'seven obstructed ghosts, hard-drop points and cells match');
// Lock delay: 499/500 ms boundary, reset cap, ledge-move mid-air safety, natural landing.
{
  const g = make(); clear(g); place(g, 'O', 0, 3, 18);
  advance(g, 499); const at499 = count(g); step(g, 1.000001); record('lockBoundary', { at499, at500: count(g) });
  const r = make(); clear(r); place(r, 'O', 0, 3, 18); let lockedAt = null;
  for (let i = 0; i < 30; i++) { advance(r, 490); if (count(r) > 0) { lockedAt = i; break; } move(r, i % 2 ? -1 : 1); }
  record('resetCap', { lockedAt, count: count(r) });
  // The ledge probe: rest on a single support for 490 ms, move off it, cross
  // the old deadline in the air, then require an eventual floor lock.
  const l = make(); clear(l); place(l, 'O', 0, -1, bottom - 5); put(l, 0, bottom - 3);
  advance(l, 490); assert.equal(count(l), 1);
  assert(move(l, 1)); assert(fits(l, { ...active(l), y: active(l).y + 1 }));
  advance(l, 20);
  record('ledge', { occupiedAfter20: count(l), active: active(l) });
  for (let i = 0; i < 500 && !get(l, 1, bottom); i++) step(l, 16);
  assert.equal(get(l, 1, bottom), 'O', 'eventual floor lock');
  const n = make(); clear(n); place(n, 'O', 0, 3, 17);
  let elapsed = 0; while (active(n).y === 17 && elapsed < 1500) { step(n, 1); elapsed++; }
  let after = 0; while (count(n) === 0 && after < 2000) { step(n, 1); after++; }
  record('naturalLanding', { landedAt: elapsed, lockedAfter: after });
  // Grounded soft drop must not lock immediately.
  const s = make(); clear(s); place(s, 'O', 0, 3, 18); soft(s); record('groundedSoftLock', count(s));
}
// Scoring fixtures with zero hard-drop distance.
const well = (g, n, pc = false) => {
  clear(g);
  for (let y = bottom - n + 1; y <= bottom; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y);
  if (!pc) put(g, 0, bottom - 9);
  place(g, 'I', 1, 2, bottom - 3);
};
const pcSingle = g => { clear(g); for (let x = 0; x < 10; x++) if (x < 3 || x > 6) put(g, x, bottom); place(g, 'I', 0, 3, bottom - 1); };
const filler = g => { clear(g); place(g, 'O', 0, 7, bottom - 1); hard(g); };
for (const n of [1, 2, 3, 4]) { const g = make(); well(g, n); hard(g); record(`normal${n}`, g.score); assert.equal(g.lines, n); }
{
  const pc = make(); pcSingle(pc); hard(pc); assert.equal(count(pc), 0); record('singlePc', pc.score);
  const b = make(); well(b, 4); hard(b); filler(b); well(b, 4); hard(b); record('b2b', b.score);
  well(b, 1); hard(b); record('b2bBreak', { score: b.score, backToBack: b.backToBack });
  const c = make(); setLevel(c, 2); c.combo = 0; well(c, 1); hard(c); record('levelTwoCombo', c.score);
  const x = make(); setLevel(x, 1, 9); well(x, 1); hard(x); record('levelCrossing', { score: x.score, level: x.level, lines: x.lines });
  const t = make(); well(t, 4); hard(t); filler(t); well(t, 4, true); hard(t); assert.equal(count(t), 0); record('b2bTetrisPc', t.score);
  const p = make(); well(p, 4); hard(p); filler(p); pcSingle(p); hard(p); record('singlePcAfterB2B', p.score);
  const k = make(); well(k, 4); hard(k); well(k, 4); hard(k); record('consecutiveTetrises', k.score);
}
// Actual final CW rotation into a three-corner pocket; hard and timed locks.
for (const timed of [false, true]) for (const full of [false, true]) for (const line of [false, true]) {
  const g = make(); clear(g); const y = bottom - 2;
  put(g, 5, y); put(g, 3, bottom); put(g, full ? 3 : 5, full ? y : bottom);
  if (line) for (const xx of [0, 1, 2, 6, 7, 8, 9]) put(g, xx, bottom - 1);
  place(g, 'T', 3, 3, y); assert(rotate(g, 1)); assert.deepEqual(active(g), { kind: 'T', rotation: 0, x: 3, y });
  assert.equal(ghostY(g), y);
  if (timed) advance(g, 500.000001); else hard(g);
  assert.equal(g.lines, line ? 1 : 0);
  record(`${timed ? 'timed' : 'hard'}-${full ? 'full' : 'mini'}-${line ? 'single' : 'zero'}`, g.score);
}
{
  // A corner pocket without a final rotation, and manual soft drop after rotation.
  const g = make(); clear(g); const y = bottom - 2;
  for (const [x, yy] of [[3, y], [5, y], [3, bottom]]) put(g, x, yy);
  place(g, 'T', 0, 3, y); hard(g); record('nonRotationCornerLock', g.score);
  const s = make(); clear(s); for (const [x, yy] of [[0, bottom - 2], [0, bottom], [2, bottom]]) put(s, x, yy);
  place(s, 'T', 0, 0, 3); assert(rotate(s, 1)); let rows = 0; while (soft(s)) rows++;
  assert.deepEqual(active(s), { kind: 'T', rotation: 1, x: 0, y: bottom - 2 });
  hard(s); record('manualSoftAfterRotation', { rows, extra: s.score - rows });
}
// Gravity curve: actual first-row boundaries at 1 ms resolution.
{
  const intervals = [];
  for (const n of [1, 2, 5, 9, 10, 14, 15, 20]) {
    const g = make(); clear(g); setLevel(g, n); place(g, 'O', 0, 3, 0);
    let elapsed = 0; while (active(g).y === 0 && elapsed < 2000) { step(g, 1); elapsed++; }
    intervals.push({ level: n, elapsed, score: g.score, profile: +(1000 * (0.8 - (n - 1) * 0.007) ** (n - 1)).toFixed(3) });
  }
  record('gravity', intervals);
}
// 800 ms normal / real soft keydown / 1 ms soft update, and refresh-rate independence.
{
  const g = make(); clear(g); place(g, 'O', 0, 3, 0); advance(g, 800);
  const before = { y: active(g).y, score: g.score }; g.softDrop(); step(g, 1, true);
  record('normalToSoft', { before, after: { y: active(g).y, score: g.score } });
  const refresh = [];
  for (const hz of [60, 144]) {
    const r = make(); clear(r); setLevel(r, 2); place(r, 'O', 0, 3, 0);
    let elapsed = 0; while (elapsed < 1480.001 - 1e-9) { const dt = Math.min(1000 / hz, 1480.001 - elapsed); step(r, dt); elapsed += dt; }
    refresh.push({ hz, y: active(r).y });
  }
  record('refresh', refresh);
}
// Wholly hidden lock from a real T spawn and public moves; next spawn open.
{
  const g = make(); clear(g);
  const stack = mode === 'low' ? [[8, 0]] : mode === 'xhigh' ? [[3, 1], [6, 1], [7, 1], [8, 0]] : [[6, 1], [7, 1], [8, 0]];
  const path = mode === 'low' ? ['R', 'R', 'R', 'R'] : ['R', 'R', 'A', 'C'];
  for (const [x, y] of stack) put(g, x, y);
  g.queue[0] = 'I'; g.spawn('T');
  const spawned = active(g);
  for (const a of path) assert(a === 'L' || a === 'R' ? move(g, a === 'L' ? -1 : 1) : rotate(g, a === 'C' ? 1 : -1), a);
  const pose = active(g);
  assert(absolute(pose).every(([, y]) => y < 0), 'wholly above the visible field');
  assert.equal(ghostY(g), pose.y);
  hard(g);
  const next = active(g);
  record('hiddenLockOut', { stack, spawned, path, pose, over: over(g), next: over(g) ? null : next });
  if (!over(g)) assert(next.kind === 'I' && fits(g, next));
  else {
    // Confirm the incoming I spawn pose would have been independently open.
    const i = { kind: 'I', rotation: 0, x: 3, y: mode === 'low' ? -2 : -1 };
    assert(absolute(i).every(([x, y]) => !absolute(pose).some(([px, py]) => px === x && py === y) && !get(g, x, y)));
  }
}
// Blocked spawn, inert game over, full reset.
{
  const g = make(); clear(g); place(g, 'O', 0, 0, bottom - 1); g.queue[0] = 'T';
  put(g, 4, { low: -1, medium: 0, high: -1, xhigh: 0 }[mode]); hard(g);
  assert(over(g), 'blocked spawn tops out');
  const snap = () => JSON.stringify([g.active, g.board, g.score, g.held]), before = snap();
  move(g, -1); rotate(g, 1); g.hold(); g.softDrop(); hard(g); advance(g, 1000);
  record('gameOverInert', snap() === before);
  reset(g);
  record('reset', { over: over(g), count: count(g), score: g.score, lines: g.lines, level: g.level, held: g.held, canHold: canHold(g) });
}
// Assert the recorded outcomes, including low's three confirmed defects.
// A passing run reproduces these findings; it does not certify bug freedom.
const low = mode === 'low';
assert.equal(evidence.colors, 7);
assert.deepEqual(evidence.wrongStates, []);
assert.deepEqual(evidence.wrongKicks, []);
assert.deepEqual(evidence.lockBoundary, { at499: 0, at500: 4 });
assert.deepEqual(evidence.resetCap, { lockedAt: 16, count: 4 });
assert.equal(evidence.ledge.occupiedAfter20, 1, 'no mid-air lock after the ledge move');
assert.equal(evidence.naturalLanding.landedAt, 1000);
assert(Math.abs(evidence.naturalLanding.lockedAfter - 500) <= 1);
assert.equal(evidence.groundedSoftLock, 0);
assert.deepEqual([1, 2, 3, 4].map(n => evidence[`normal${n}`]), [100, 300, 500, 800]);
assert.equal(evidence.singlePc, 900);
assert.equal(evidence.b2b, 2000);
assert.deepEqual(evidence.b2bBreak, { score: 2150, backToBack: false });
assert.equal(evidence.consecutiveTetrises, 2050);
assert.equal(evidence.levelTwoCombo, 300);
assert.deepEqual(evidence.levelCrossing, { score: 100, level: 2, lines: 10 });
assert.equal(evidence.singlePcAfterB2B, 1700);
assert.equal(evidence.b2bTetrisPc, low ? 4000 : 5200, 'B2B Tetris perfect clear');
for (const timed of [false, true]) for (const full of [false, true]) for (const line of [false, true])
  assert.equal(evidence[`${timed ? 'timed' : 'hard'}-${full ? 'full' : 'mini'}-${line ? 'single' : 'zero'}`], full ? (line ? 800 : 400) : (line ? 200 : 100));
assert.equal(evidence.nonRotationCornerLock, 0);
assert.deepEqual(evidence.manualSoftAfterRotation, { rows: 14, extra: 0 });
// Guideline curve at 1 ms resolution; accepted fast floors: low 16, medium 5,
// high 1 and xhigh 1000/1200 ms.
const gravity = { low: [1000, 793, 356, 94, 65, 16, 16, 16], medium: [1000, 793, 356, 94, 65, 12, 8, 5], high: [1000, 793, 356, 94, 65, 12, 8, 1], xhigh: [1000, 793, 356, 94, 65, 12, 8, 1] };
assert.deepEqual(evidence.gravity.map(e => e.elapsed), gravity[mode]);
assert(evidence.gravity.every(e => e.score === 0), 'gravity awards no points');
const softRows = { low: 17, medium: 1, high: 2, xhigh: 1 }[mode];
assert.deepEqual(evidence.normalToSoft, { before: { y: 0, score: 0 }, after: { y: softRows, score: softRows } });
assert.deepEqual(evidence.refresh.map(r => r.y), [1, 1]);
assert.equal(evidence.hiddenLockOut.over, !low, 'wholly hidden lock-out');
assert.equal(evidence.gameOverInert, true);
assert.deepEqual(evidence.reset, { over: false, count: 0, score: 0, lines: 0, level: 1, held: null, canHold: true });
console.log(JSON.stringify(evidence, null, 1));
console.log(`${mode}: 28 states, 48 kick sequences, 100 bags, hold/ghost, lock/cap/ledge, scoring, gravity, soft timing, hidden lock-out, game over/reset asserted`);
