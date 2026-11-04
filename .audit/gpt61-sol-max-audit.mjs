// GPT-6.1 Sol (max) engine fixtures. Run against a disposable build:
//   node .audit/gpt61-sol-max-audit.mjs <copy>
// createAdapter/runProbes are self-contained so the browser check can run the
// same functions on the served modules. Private fields are touched only to
// place deterministic fixtures or capture rejected rotation candidates; no
// rule body, rotation result or spin flag is assigned by the audit.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { reference, normalKicks, iKicks } from './opus55-efforts-audit.mjs';
export { reference, normalKicks, iKicks };

// Field coordinates: x 0..9, visible y 0..19, hidden buffer y -20..-1 (native).
export function createAdapter(modules) {
  const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const make = (seed = 42) => { const g = new modules.game.Game(seeded(seed)); g.start(); return g; };
  const active = g => g.active && { type: g.active.type, rotation: g.active.rotation, x: g.active.x, y: g.active.y };
  const local = (t, r) => modules.pieces.cellsFor(t, r).map(([x, y]) => [x, y]);
  const cells = p => local(p.type, p.rotation).map(([x, y]) => [x + p.x, y + p.y]);
  const get = (g, x, y) => (x < 0 || x > 9 || y < -20 || y > 19 ? null : g.board[y + 20][x]);
  const put = (g, x, y, t = 'J') => { if (x < 0 || x > 9 || y < -20 || y > 19) throw Error('stack bounds'); g.board[y + 20][x] = t; };
  const clear = g => g.board.forEach(row => row.fill(null));
  const count = g => g.board.flat().filter(Boolean).length;
  const fits = (g, p) => cells(p).every(([x, y]) => x >= 0 && x < 10 && y < 20 && y >= -20 && !get(g, x, y));
  const place = (g, t, r, x, y) => {
    g.active = { type: t, rotation: r, x, y };
    Object.assign(g, { gravityElapsed: 0, lockElapsed: 0, lockResets: 0, lastRotation: null, __soft: false });
    g.hasLanded = g.grounded;
    if (!fits(g, active(g))) throw Error('colliding fixture');
  };
  const move = (g, d) => g.move(d), rotate = (g, d) => g.rotate(d), hard = g => g.hardDrop(), hold = g => g.hold();
  // Real Down: keydown calls softDrop() once, then frames pass softDropping=true.
  const soft = (g, on) => { if (on && !g.__soft) g.softDrop(); g.__soft = on; };
  const step = (g, ms) => g.update(ms, !!g.__soft);
  const advance = (g, ms) => { while (ms > 1e-8) { const dt = Math.min(ms, 16); step(g, dt); ms -= dt; } };
  const ghost = g => g.ghostY, over = g => g.status === 'over', spawn = (g, t) => g.spawn(t);
  const incoming = (g, t) => { g.queue[0] = t; }, reset = g => g.start();
  const capture = (g, from, to) => {
    const seen = [], p = g.active;
    g.collides = c => { if (c.rotation === to) seen.push([c.x - p.x, c.y - p.y]); return true; };
    try { rotate(g, (to - from + 4) % 4 === 1 ? 1 : -1); } finally { delete g.collides; }
    return seen;
  };
  return { make, active, local, cells, get, put, clear, count, fits, place, move, rotate, hard, hold, soft, step, advance, ghost, over, spawn, incoming, capture, reset };
}

export function runProbes(a, oracle) {
  const { reference, normalKicks, iKicks } = oracle;
  const { make, active, local, cells, get, put, clear, count, fits, place, move, rotate, hard, hold, soft, step, advance, ghost, over, spawn, incoming, capture, reset } = a;
  const e = {}, check = (v, m) => { if (!v) throw Error(m); };
  const eq = (v, w, m) => check(JSON.stringify(v) === JSON.stringify(w), m + ': ' + JSON.stringify({ v, w }));
  const key = cs => cs.map(p => p.join(',')).sort().join(' '), types = Object.keys(reference);
  const canon = p => reference[p.type][p.rotation].map(([x, y]) => [p.x + x, p.y + y]);
  const legal = (g, p) => canon(p).every(([x, y]) => x >= 0 && x < 10 && y < 20 && y >= -20 && !get(g, x, y));
  const offsetsFor = (type, from, to) => type === 'O' ? [[0, 0]] : (type === 'I' ? iKicks : normalKicks)[`${from}>${to}`].map(([dx, dy]) => [dx, -dy || 0]);
  const firstFit = (g, p, dir) => {
    const to = (p.rotation + dir + 4) % 4, list = offsetsFor(p.type, p.rotation, to);
    const index = list.findIndex(([dx, dy]) => legal(g, { ...p, rotation: to, x: p.x + dx, y: p.y + dy }));
    return index < 0 ? p : { ...p, rotation: to, x: p.x + list[index][0], y: p.y + list[index][1] };
  };

  // Geometry: 28 states, 48 ordered candidate lists, 672 actual first-fitting outcomes.
  e.states = []; for (const t of types) for (let r = 0; r < 4; r++) if (key(local(t, r)) !== key(reference[t][r])) e.states.push(t + r);
  e.colors = new Set(Object.values(oracle.colors)).size;
  e.kicks = [];
  for (const t of types.filter(t => t !== 'O')) for (const tr of Object.keys(normalKicks)) {
    const [from, to] = tr.split('>').map(Number), g = make(); place(g, t, from, 3, 8);
    const got = capture(g, from, to), want = offsetsFor(t, from, to);
    if (JSON.stringify(got) !== JSON.stringify(want)) e.kicks.push({ t, tr, got, want });
  }
  let seed = 0x5532; const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  e.rotations = { total: 0, mismatches: 0, rejected: 0, examples: [] };
  for (const type of types) for (let from = 0; from < 4; from++) for (const dir of [-1, 1]) for (let sample = 0; sample < 12; sample++) {
    const cs = [...reference[type][from], ...local(type, from)], minX = Math.min(...cs.map(p => p[0])), maxX = Math.max(...cs.map(p => p[0])), maxY = Math.max(...cs.map(p => p[1]));
    const x = [-minX, 3, 9 - maxX][sample % 3], y = [-2, 8, 19 - maxY][Math.floor(sample / 3) % 3], g = make(); clear(g); place(g, type, from, x, y);
    const before = active(g), occupied = new Set([...canon(before), ...cells(before)].map(p => p.join(',')));
    for (let yy = Math.max(-20, y - 2); yy <= Math.min(19, y + 4); yy++) for (let xx = 0; xx < 10; xx++) if (!occupied.has(`${xx},${yy}`) && random() < .28) put(g, xx, yy);
    const want = firstFit(g, before, dir), success = rotate(g, dir), got = active(g);
    e.rotations.total++; if (want === before) e.rotations.rejected++;
    if (success !== (want !== before) || JSON.stringify(got) !== JSON.stringify(want)) { e.rotations.mismatches++; if (e.rotations.examples.length < 4) e.rotations.examples.push({ before, dir, success, got, want }); }
  }

  // Spawn, bags, hold, ghost, compaction.
  { const g = make(); e.spawn = active(g); }
  e.bags = 0;
  for (let s = 1; s <= 10; s++) { const g = make(s); for (let b = 0; b < 10; b++) { const bag = []; for (let i = 0; i < 7; i++) { bag.push(active(g).type); clear(g); hard(g); check(!over(g), 'bag game'); } eq(bag.sort(), [...types].sort(), 'actual bag'); e.bags++; } }
  {
    const g = make(), first = active(g).type, next = g.queue[0]; rotate(g, 1); hold(g);
    eq([g.held, active(g).type, g.canHold], [first, next, false], 'first hold');
    const p = active(g); hold(g); eq(active(g), p, 'hold restriction');
    clear(g); hard(g); check(g.canHold, 'hold after lock'); hold(g);
    e.hold = { retrieved: active(g), canHold: g.canHold };
  }
  e.ghosts = [];
  for (const t of types) {
    const g = make(); clear(g); place(g, t, 0, 3, 0); put(g, 4, 16); const p = active(g);
    let y = p.y; while (fits(g, { ...p, y: y + 1 })) y++;
    eq(ghost(g), y, 'ghost ' + t); hard(g); eq(g.score, 2 * (y - p.y), 'drop points');
    for (const [x, yy] of cells({ ...p, y })) eq(get(g, x, yy), t, 'welded cell');
    eq(count(g), 5, 'weld count'); e.ghosts.push([t, y]);
  }
  {
    const g = make(); clear(g);
    for (const y of [16, 18]) for (let x = 0; x < 9; x++) put(g, x, y);
    put(g, 2, 15, 'T'); put(g, 9, 19); place(g, 'I', 1, 7, 15); hard(g);
    e.compaction = { lines: g.lines, t: get(g, 2, 17), i: get(g, 9, 18), floor: get(g, 9, 19), gone: get(g, 9, 16) };
  }

  // Lock clocks: existing ground, resets, cap, failed actions, contact, ledges, new lowest row.
  {
    const g = make(); clear(g); place(g, 'O', 0, 3, 18); advance(g, 499); const at499 = count(g); step(g, 1);
    const r = make(); clear(r); place(r, 'O', 0, 3, 18); advance(r, 490); move(r, 1); advance(r, 499); const reset499 = count(r); step(r, 1);
    const c = make(); clear(c); place(c, 'O', 0, 3, 18); for (let i = 0; i < 15; i++) { advance(c, 10); move(c, i % 2 ? -1 : 1); }
    advance(c, 499); const cap499 = count(c); move(c, -1); step(c, 1);
    const f = make(); clear(f); place(f, 'O', 0, -1, 18); advance(f, 490); for (let i = 0; i < 5; i++) { check(!move(f, -1), 'wall'); advance(f, 2); }
    e.lock = { at499, at500: count(g), reset499, reset500: count(r), cap499, sixteenth: count(c), failedMoves: count(f) };
  }
  {
    const g = make(); clear(g); place(g, 'O', 0, 3, 17); advance(g, 990); step(g, 16); advance(g, 483); const at1489 = count(g); step(g, 1);
    const at1490 = count(g); let t = 1490; while (count(g) === 0 && t < 1700) { step(g, 1); t++; }
    e.landing = { at1489, at1490, lock: t };
  }
  const ledge = rotations => {
    const g = make(); clear(g); place(g, 'O', 0, -1, 12); put(g, 0, 14);
    for (let i = 0; i < rotations; i++) { advance(g, 1); check(rotate(g, 1), 'O rotation'); }
    advance(g, 490); check(move(g, 1), 'ledge move'); check(fits(g, { ...active(g), y: active(g).y + 1 }), 'airborne');
    advance(g, 20); const after20 = count(g);
    let t = 20, land = null; while (count(g) === 1 && t < 9000) { step(g, 1); t++; if (land === null && active(g)?.y === 18) land = t; }
    return { after20, land, lock: t, contactToLock: t - land };
  };
  e.ledge = ledge(0); e.exhaustedLedge = ledge(15);
  {
    // Ten rotations plus the ledge move spend eleven resets; then the O falls six
    // rows to a new lowest row. Grounded moves every 400 ms: each move that still
    // resets keeps it alive, the first that cannot lets it weld 100 ms later.
    const g = make(); clear(g); place(g, 'O', 0, -1, 12); put(g, 0, 14);
    for (let i = 0; i < 10; i++) { advance(g, 1); check(rotate(g, 1), 'O rotation'); }
    advance(g, 1); check(move(g, 1), 'ledge move'); while (active(g).y < 18) step(g, 1);
    let moves = 0; while (moves < 20) { advance(g, 400); if (count(g) !== 1) break; check(move(g, moves % 2 ? 1 : -1), 'grounded move'); moves++; }
    e.newLowestResets = { spentBeforeFall: 11, resetsAfterFall: moves - 1 };
  }

  // Gravity, refresh independence, soft entry/release, grounded soft, hold clock.
  e.gravity = [];
  for (let level = 1; level <= 20; level++) {
    const g = make(); clear(g); g.level = level; g.lines = (level - 1) * 10; place(g, 'O', 0, 3, 0);
    let t = 0; while (active(g).y === 0 && t < 2000) { step(g, 1); t++; }
    e.gravity.push({ level, actual: t, expected: Math.ceil(Math.max(1000 * Math.pow(.8 - (level - 1) * .007, level - 1), 1) - 1e-8), score: g.score });
  }
  e.refresh = []; for (const hz of [60, 144]) { const g = make(); clear(g); g.level = 10; place(g, 'O', 0, 3, 0); let t = 0; while (t < 600 - 1e-8) { const d = Math.min(1000 / hz, 600 - t); step(g, d); t += d; } e.refresh.push(active(g).y); }
  { const g = make(); clear(g); place(g, 'O', 0, 3, 0); advance(g, 800); soft(g, true); step(g, 1); e.softEntry = { rows: active(g).y, points: g.score }; soft(g, false); advance(g, 998); const y998 = active(g).y; step(g, 1); e.softRelease = { y998, y999: active(g).y }; }
  { const g = make(); clear(g); place(g, 'O', 0, 3, 0); advance(g, 800); g.update(1, true); e.rawSoftEntry = { rows: active(g).y, points: g.score }; }
  { const g = make(); clear(g); place(g, 'O', 0, 3, 18); soft(g, true); advance(g, 499); const at499 = count(g); step(g, 1); e.groundedSoft = { at499, at500: count(g), score: g.score }; }
  { const g = make(); clear(g); place(g, 'O', 0, 3, 0); advance(g, 800); hold(g); const y = active(g).y; advance(g, 999); const y999 = active(g).y; step(g, 1); e.holdClock = { y, y999, y1000: active(g).y }; }

  // Scoring.
  const well = (g, n, pc = false) => { clear(g); for (let y = 20 - n; y < 20; y++) for (let x = 0; x < 10; x++) if (x !== 4) put(g, x, y); if (!pc) put(g, 0, 10); place(g, 'I', 1, 2, 16); };
  const pcWell = (g, n) => {
    clear(g); const p = n === 1 ? { type: 'I', rotation: 0, x: 3, y: 18 } : n === 2 ? { type: 'O', rotation: 0, x: 3, y: 18 } : n === 3 ? { type: 'T', rotation: 1, x: 3, y: 17 } : { type: 'I', rotation: 1, x: 2, y: 16 };
    const occupied = new Set(cells(p).map(c => c.join(','))); for (let y = 20 - n; y < 20; y++) for (let x = 0; x < 10; x++) if (!occupied.has(`${x},${y}`)) put(g, x, y);
    place(g, p.type, p.rotation, p.x, p.y);
  };
  const filler = g => { clear(g); place(g, 'O', 0, 7, 18); hard(g); };
  const s = e.scores = {};
  for (const n of [1, 2, 3, 4]) { const g = make(); well(g, n); hard(g); eq(g.lines, n, 'clear lines'); s['normal' + n] = g.score; const p = make(); pcWell(p, n); hard(p); eq(count(p), 0, 'PC empty'); s['pc' + n] = p.score; }
  { const g = make(); well(g, 4); hard(g); well(g, 4); hard(g); s.consecutive = g.score; }
  { const g = make(); well(g, 4); hard(g); filler(g); well(g, 4); hard(g); s.b2b = g.score; well(g, 1); hard(g); s.b2bBreak = g.score; }
  { const g = make(); g.lines = 10; g.level = 2; well(g, 1); hard(g); const before = g.score; well(g, 1); hard(g); s.levelTwoCombo = g.score - before; }
  { const g = make(); g.lines = 9; well(g, 1); hard(g); s.crossing = [g.score, g.lines, g.level]; }
  { const g = make(); well(g, 4); hard(g); filler(g); well(g, 4, true); hard(g); s.b2bPc = g.score; }
  const pocket = (g, full, line) => { clear(g); put(g, 5, 17); put(g, 3, 19); put(g, full ? 3 : 5, full ? 17 : 19); if (line) for (const x of [0, 1, 2, 6, 7, 8, 9]) put(g, x, 18); place(g, 'T', 3, 3, 17); check(rotate(g, 1), 'actual spin'); eq(active(g), { type: 'T', rotation: 0, x: 3, y: 17 }, 'spin pose'); eq(ghost(g), 17, 'zero spin travel'); };
  for (const timed of [false, true]) for (const full of [false, true]) for (const line of [false, true]) { const g = make(); pocket(g, full, line); if (timed) advance(g, 500); else hard(g); s[`${timed ? 'timed' : 'hard'}-${full ? 'full' : 'mini'}-${line ? 'single' : 'zero'}`] = g.score; }
  { const g = make(); clear(g); for (const [x, y] of [[3, 17], [5, 17], [3, 19]]) put(g, x, y); place(g, 'T', 0, 3, 17); hard(g); s.nonRotation = g.score; }
  for (const timed of [false, true]) { const g = make(); clear(g); for (let x = 0; x < 10; x++) { if (x !== 4) put(g, x, 19); if (x < 3 || x > 5) put(g, x, 18); } put(g, 3, 17); place(g, 'T', 0, 3, 17); check(rotate(g, 1) && rotate(g, 1), 'real double rotations'); if (timed) advance(g, 500); else hard(g); eq(g.lines, 2, 'spin double'); s[timed ? 'timedDouble' : 'hardDouble'] = g.score; }
  for (const method of ['natural', 'hard', 'soft']) {
    const g = make(); clear(g); for (const [x, y] of [[0, 17], [0, 19], [2, 19]]) put(g, x, y); place(g, 'T', 0, 0, 3); check(rotate(g, 1), 'downward rotation');
    if (method === 'natural') advance(g, 14000);
    if (method === 'soft') { soft(g, true); for (let i = 0; i < 14; i++) step(g, 50); soft(g, false); }
    const before = g.score; hard(g); s[method + 'DownExtra'] = g.score - before;
  }
  s.facings = [];
  for (let r = 0; r < 4; r++) for (const full of [false, true]) {
    const g = make(); clear(g); const fronts = [[0, 1], [1, 3], [2, 3], [0, 2]][r], corners = [[3, 15], [5, 15], [3, 17], [5, 17]];
    const missing = full ? [0, 1, 2, 3].find(i => !fronts.includes(i)) : fronts[0];
    for (let i = 0; i < 4; i++) if (i !== missing) put(g, ...corners[i]);
    place(g, 'T', (r + 3) % 4, 3, 15); check(rotate(g, 1), 'facing rotation'); advance(g, 500); s.facings.push(g.score);
  }
  s.deepKicks = [];
  for (const fifth of [false, true]) {
    const g = make(); clear(g); const stack = fifth ? [[4, 15], [6, 15], [6, 17], [3, 18], [6, 18], [3, 16]] : [[3, 15], [3, 17], [5, 17], [3, 18], [6, 19]];
    for (const [x, y] of stack) put(g, x, y); place(g, 'T', 1, 3, 17); const want = firstFit(g, active(g), fifth ? 1 : -1);
    check(rotate(g, fifth ? 1 : -1), 'deep kick rotation'); const pose = active(g); eq(pose, want, 'actual deep kick'); hard(g); s.deepKicks.push({ fifth, pose, score: g.score });
  }

  // Ceiling/above-buffer kicks, stored-buffer locks, spawn/terminal/restart.
  { const g = make(); clear(g); put(g, 3, 0); put(g, 4, 0); spawn(g, 'T'); const before = active(g); const want = firstFit(g, before, 1); const success = rotate(g, 1); e.ceiling = { before, success, after: active(g), want }; }
  { const g = make(); clear(g); place(g, 'S', 1, -1, -2); put(g, 2, -2); put(g, 0, 0); const want = firstFit(g, active(g), -1); rotate(g, -1); e.ceilingWall = { after: active(g), want }; }
  {
    const g = make(); clear(g); for (const [x, y] of [[5, 0], [3, 0], [6, 1]]) put(g, x, y); spawn(g, 'I'); incoming(g, 'T');
    const spawned = active(g); check(rotate(g, 1), 'ceiling I rotation'); const kicked = active(g); advance(g, 1000); const pose = active(g);
    eq(ghost(g), pose.y, 'grounded'); const before = count(g); hard(g);
    e.aboveBufferPartial = { spawned, kicked, pose, over: over(g), welded: count(g) - before, cells: cells(pose).map(([x, y]) => get(g, x, y)) };
  }
  e.hidden = [];
  for (const partial of [false, true]) {
    const g = make(); clear(g); put(g, partial ? 8 : 0, partial ? 1 : 0); if (!partial) put(g, 5, 0); spawn(g, 'T'); incoming(g, 'I');
    const start = active(g); for (let i = 0; i < (partial ? 4 : 3); i++) check(move(g, partial ? 1 : -1), 'hidden move');
    const pose = active(g), ys = cells(pose).map(p => p[1]);
    check(partial ? ys.some(y => y < 0) && ys.some(y => y >= 0) : ys.every(y => y < 0), 'hidden extent'); eq(ghost(g), pose.y, 'grounded hidden'); hard(g);
    e.hidden.push({ partial, start, pose, over: over(g), cells: cells(pose).map(([x, y]) => get(g, x, y)) });
  }
  { const g = make(); g.held = 'T'; clear(g); put(g, 4, -2); place(g, 'O', 0, 3, 5); hold(g); e.blockedHold = { over: over(g), held: g.held }; }
  {
    const g = make(); clear(g); place(g, 'O', 0, -1, 18); incoming(g, 'T'); put(g, 4, -2); hard(g); check(over(g), 'blocked spawn');
    const snap = () => JSON.stringify([active(g), count(g), g.score, g.held, g.lines, g.level]), before = snap();
    move(g, -1); rotate(g, 1); hard(g); hold(g); soft(g, true); advance(g, 1000); soft(g, false);
    e.terminal = { inert: snap() === before };
    reset(g); e.terminal.reset = [over(g), count(g), g.score, g.lines, g.level, g.held, g.canHold, g.combo, g.backToBack];
  }
  e.restart = [];
  for (const sd of [1, 2, 42]) { const g = make(sd); let n = 0; while (!over(g) && n++ < 100) hard(g); check(over(g), 'natural topout'); reset(g); const opening = []; for (let i = 0; i < 7; i++) { opening.push(active(g).type); clear(g); hard(g); } e.restart.push({ seed: sd, drops: n, types: new Set(opening).size }); }
  // HD-SPIN-1: snapshots retain failures; only 28 points conforms.
  e.hardDropCredit = { distance: 14, score: e.scores.hardDownExtra, expected: 28, conforms: e.scores.hardDownExtra === 28 };
  return e;
}

export function assertRecorded(e) {
  assert.deepEqual(e.hardDropCredit, { distance: 14, score: 28, expected: 28, conforms: true });
  assert.deepEqual(e.states, []); assert.equal(e.colors, 7); assert.deepEqual(e.kicks, []);
  assert.equal(e.rotations.total, 672); assert.equal(e.rotations.mismatches, 0, JSON.stringify(e.rotations.examples));
  assert.deepEqual(e.spawn, { type: e.spawn.type, rotation: 0, x: 3, y: -1 });
  assert.equal(e.bags, 100);
  assert.deepEqual([e.hold.retrieved.rotation, e.hold.retrieved.x, e.hold.retrieved.y, e.hold.canHold], [0, 3, -1, false]);
  assert(e.ghosts.every(([, y]) => y === 14));
  assert.deepEqual(e.compaction, { lines: 2, t: 'T', i: 'I', floor: 'J', gone: null });
  assert.deepEqual(e.lock, { at499: 0, at500: 4, reset499: 0, reset500: 4, cap499: 0, sixteenth: 4, failedMoves: 4 });
  assert.deepEqual(e.landing, { at1489: 0, at1490: 0, lock: 1500 });
  assert.equal(e.ledge.after20, 1); assert.equal(e.ledge.contactToLock, 500);
  // Recorded minor: after fifteen spent resets, airborne time keeps counting and a
  // new lowest row gets no fresh lock delay, so the piece welds at floor contact.
  assert.equal(e.exhaustedLedge.after20, 1); assert.equal(e.exhaustedLedge.contactToLock, 1);
  // Same cause: the eleven spent resets survive the fall, leaving four instead of fifteen.
  assert.deepEqual(e.newLowestResets, { spentBeforeFall: 11, resetsAfterFall: 4 });
  assert.deepEqual(e.gravity.map(x => x.actual), e.gravity.map(x => x.expected)); assert(e.gravity.every(x => x.score === 0));
  assert.deepEqual(e.refresh, [9, 9]);
  assert.deepEqual(e.softEntry, { rows: 1, points: 1 }); assert.deepEqual(e.softRelease, { y998: 1, y999: 2 });
  assert.deepEqual(e.rawSoftEntry, { rows: 16, points: 16 }); // API-only; real input resets the clock first
  assert.deepEqual(e.groundedSoft, { at499: 0, at500: 4, score: 0 });
  assert.deepEqual(e.holdClock, { y: -1, y999: -1, y1000: 0 });
  const s = e.scores;
  assert.deepEqual([1, 2, 3, 4].map(n => s['normal' + n]), [100, 300, 500, 800]);
  assert.deepEqual([1, 2, 3, 4].map(n => s['pc' + n]), [900, 1500, 2300, 2800]);
  for (const timed of [false, true]) for (const full of [false, true]) for (const line of [false, true])
    assert.equal(s[`${timed ? 'timed' : 'hard'}-${full ? 'full' : 'mini'}-${line ? 'single' : 'zero'}`], full ? (line ? 800 : 400) : (line ? 200 : 100));
  for (const [k, v] of Object.entries({ nonRotation: 0, hardDouble: 1200, timedDouble: 1200, b2b: 2000, consecutive: 2050, b2bBreak: 2150, levelTwoCombo: 300, b2bPc: 5200 })) assert.equal(s[k], v, k);
  // Observation, not deducted: any downward travel after the rotation clears spin credit.
  assert.deepEqual([s.naturalDownExtra, s.hardDownExtra, s.softDownExtra], [0, 28, 0]);
  assert.deepEqual(s.crossing, [100, 10, 2]); assert.deepEqual(s.facings, [100, 400, 100, 400, 100, 400, 100, 400]);
  assert.deepEqual(s.deepKicks.map(x => x.score), [100, 400]);
  assert.equal(e.ceiling.success, true); assert.deepEqual(e.ceiling.after, e.ceiling.want); assert.deepEqual(e.ceiling.after, { type: 'T', rotation: 1, x: 2, y: -3 });
  assert.deepEqual(e.ceilingWall.after, e.ceilingWall.want);
  assert.deepEqual(e.aboveBufferPartial.kicked, { type: 'I', rotation: 1, x: 4, y: -4 });
  assert.deepEqual(e.aboveBufferPartial.pose, { type: 'I', rotation: 1, x: 4, y: -3 });
  assert.equal(e.aboveBufferPartial.over, false); assert.equal(e.aboveBufferPartial.welded, 4);
  assert.deepEqual(e.hidden.map(x => x.over), [true, false]); assert(e.hidden[1].cells.every(c => c === 'T'));
  assert.deepEqual(e.blockedHold, { over: true, held: 'O' });
  assert.equal(e.terminal.inert, true); assert.deepEqual(e.terminal.reset, [false, 0, 0, 0, 1, null, true, -1, false]);
  assert.deepEqual(e.restart.map(x => x.types), [7, 7, 7]);
}

export async function runAudit(root) {
  const load = file => import(pathToFileURL(resolve(root, 'dist', file)));
  const modules = { game: await load('game.js'), pieces: await load('pieces.js') };
  const e = runProbes(createAdapter(modules), { reference, normalKicks, iKicks, colors: modules.pieces.COLORS });
  console.log(JSON.stringify(e, null, 1)); assertRecorded(e);
  console.log('max: GPT-6.1 Sol engine outcomes asserted');
  return e;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) await runAudit(process.argv[2]);
