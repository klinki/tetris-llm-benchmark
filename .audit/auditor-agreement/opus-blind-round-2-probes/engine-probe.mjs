// Rules-conformance probe. Usage: node engine-probe.mjs <letter> <builtTempCopy>
// Prints a JSON report. All coordinates are visible-field coordinates.
import { makeAdapter } from './adapters.mjs';

const [letter, root] = process.argv.slice(2);
const A = await makeAdapter(letter, root);
const FRAME = 1000 / 60;
const out = {};

// ---------- canonical SRS reference (tetris.wiki, converted to y-down) ----------
const SPAWN = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};
const REF = {};
for (const [t, s] of Object.entries(SPAWN)) {
  const n = t === 'I' ? 4 : 3; const st = [s];
  for (let r = 1; r < 4; r++) st.push(t === 'O' ? s : st[r - 1].map(([x, y]) => [n - 1 - y, x]));
  REF[t] = st;
}
const UP = {
  JLSTZ: {
    '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  },
  I: {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  },
};
const key = (a) => a.map(([x, y]) => `${x},${y}`).sort().join(' ');

// ---------- 1. all 28 orientation states ----------
{
  const res = {}; const bad = [];
  for (const t of Object.keys(SPAWN)) {
    A.clear(); let base = null;
    for (let r = 0; r < 4; r++) {
      A.setPiece(t, r, 3, 8);
      const c = A.cells().map(([x, y]) => [x - 3, y - 8]);
      if (r === 0) { // fixed origin translation taken from the spawn state only
        const rc = REF[t][0]; const mx = Math.min(...c.map((p) => p[0])) - Math.min(...rc.map((p) => p[0]));
        const my = Math.min(...c.map((p) => p[1])) - Math.min(...rc.map((p) => p[1])); base = [mx, my];
      }
      const norm = c.map(([x, y]) => [x - base[0], y - base[1]]);
      const ok = key(norm) === key(REF[t][r]);
      res[`${t}${r}`] = ok; if (!ok) bad.push(`${t}${r}: got ${key(norm)} want ${key(REF[t][r])}`);
    }
  }
  out.srsStates = { matching: Object.values(res).filter(Boolean).length, of: 28, mismatches: bad };
}

// ---------- 2. differential SRS kick test on random boards ----------
{
  let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const fitsRef = (board, t, r, x, y) => REF[t][r].every(([dx, dy]) => {
    const X = x + dx, Y = y + dy; return X >= 0 && X < 10 && Y < 20 && (Y < 0 || !board[Y][X]);
  });
  const refRotate = (board, p, d) => {
    if (p.type === 'O') return { ...p, rot: (p.rot + d + 4) % 4 };
    const to = (p.rot + d + 4) % 4; const tbl = p.type === 'I' ? UP.I : UP.JLSTZ;
    for (const [kx, ky] of tbl[`${p.rot}>${to}`]) {
      if (fitsRef(board, p.type, to, p.x + kx, p.y - ky)) return { ...p, rot: to, x: p.x + kx, y: p.y - ky };
    }
    return null;
  };
  let trials = 0, mism = 0, kicked = 0; const byKey = {}; const examples = [];
  while (trials < 6000) {
    const board = Array.from({ length: 20 }, (_, y) => Array.from({ length: 10 }, () => y >= 5 && rnd() < 0.42));
    const types = 'IJLSTZ'; const t = types[Math.floor(rnd() * 6)]; const r = Math.floor(rnd() * 4);
    const x = Math.floor(rnd() * 12) - 2; const y = Math.floor(rnd() * 14) + 3; const d = rnd() < 0.5 ? 1 : -1;
    if (!fitsRef(board, t, r, x, y)) continue;
    trials++;
    A.clear(); for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 10; xx++) if (board[yy][xx]) A.fill(xx, yy);
    A.setPiece(t, r, x, y);
    const want = refRotate(board, { type: t, rot: r, x, y }, d);
    const ok = A.rotate(d); const got = A.piece();
    const gotKey = ok ? `${got.rot}@${got.x},${got.y}` : 'fail'; const wantKey = want ? `${want.rot}@${want.x},${want.y}` : 'fail';
    if (want && (want.x !== x || want.y !== y)) kicked++;
    if (gotKey !== wantKey) {
      mism++; const k = `${t} ${r}>${(r + d + 4) % 4}`; byKey[k] = (byKey[k] || 0) + 1;
      if (examples.length < 6) examples.push({ t, from: r, dir: d, x, y, want: wantKey, got: gotKey });
    }
  }
  // O piece rotation must not move its cells
  A.clear(); A.setPiece('O', 0, 3, 8); const before = key(A.cells()); A.rotate(1); const after = key(A.cells());
  out.srsKicks = { trials, nonZeroKickCases: kicked, mismatches: mism, byTransition: byKey, examples, oStable: before === after };
}

// ---------- 3. spawn position, 7-bag, hold ----------
{
  const spawn = {}; let guard = 0;
  while (Object.keys(spawn).length < 7 && guard++ < 500) {
    A.reset(); const p = A.piece(); if (!spawn[p.type]) spawn[p.type] = { rot: p.rot, cells: key(A.cells()) };
  }
  out.spawn = spawn;
  A.reset(); const seq = [];
  for (let i = 0; i < 70; i++) { seq.push(A.piece().type); A.clear(); A.hardDrop(); A.clear(); }
  let bagOk = true; for (let i = 0; i < 70; i += 7) if (new Set(seq.slice(i, i + 7)).size !== 7) bagOk = false;
  out.bag = { ok: bagOk, firstFourteen: seq.slice(0, 14).join('') };
  A.reset(); const first = A.piece().type; const q0 = A.queue()[0];
  const h1 = A.hold(); const afterHold = A.piece();
  const h2 = A.hold(); const afterSecond = A.piece().type;
  A.clear(); A.hardDrop(); A.clear(); const beforeSwap = A.piece().type;
  const h3 = A.hold(); const back = A.piece();
  A.reset(); let normalSpawn = null; { let g2 = 0; while (A.piece().type !== first && g2++ < 500) A.reset(); normalSpawn = A.piece(); }
  out.hold = {
    firstHoldOk: h1 && A !== null && afterHold.type === q0, heldWas: first,
    secondHoldBlocked: !h2 && afterSecond === afterHold.type,
    swapReturnsHeld: h3 && back.type === first, returnedRot: back.rot,
    returnedAtSpawn: back.x === normalSpawn.x && back.y === normalSpawn.y, beforeSwap,
  };
}

// ---------- 4. ghost == hard-drop landing ----------
{
  let seed = 99; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let bad = 0, n = 0;
  for (let i = 0; i < 300; i++) {
    A.reset(); A.clear();
    for (let y = 10; y < 20; y++) for (let x = 0; x < 10; x++) if (rnd() < 0.35) A.fill(x, y);
    for (let y = 0; y < 20; y++) { let full = true; for (let x = 0; x < 10; x++) if (!A.cell(x, y)) full = false; if (full) A.g; }
    const t = 'IJLOSTZ'[Math.floor(rnd() * 7)]; const r = Math.floor(rnd() * 4); const x = Math.floor(rnd() * 8);
    A.setPiece(t, r, x, 0);
    const cells0 = A.cells(); if (cells0.some(([cx, cy]) => cx < 0 || cx > 9 || (cy >= 0 && A.cell(cx, cy)))) continue;
    n++; const gy = A.ghostY(); const py = A.piece().y; const dy = gy - py;
    const want = key(cells0.map(([cx, cy]) => [cx, cy + dy]));
    // landing per independent collision
    let k = 0; const free = (d) => cells0.every(([cx, cy]) => cy + d < 20 && (cy + d < 0 || !A.cell(cx, cy + d)));
    while (free(k + 1)) k++;
    if (k !== dy) bad++;
    void want;
  }
  out.ghost = { cases: n, mismatches: bad };
}

// ---------- 5. lock delay ----------
{
  A.reset(); A.clear(); A.setPiece('T', 0, 3, 18);
  let t = 0; while (A.filled() === 0 && t < 3000) { A.step(FRAME); t += FRAME; }
  out.lockDelayPlain = { lockedAtMs: Math.round(t) };
  A.reset(); A.clear(); A.setPiece('T', 0, 3, 18);
  t = 0; let moves = 0, nextMove = 400, dir = 1;
  while (A.filled() === 0 && t < 20000) {
    A.step(FRAME); t += FRAME;
    if (A.filled() === 0 && t >= nextMove) { if (A.move(dir)) moves++; dir = -dir; nextMove += 400; }
  }
  out.lockDelayResets = { movesEvery400ms: true, successfulMovesBeforeLock: moves, lockedAtMs: Math.round(t), guidelineExpectMs: 15 * 400 + 500 };
  // rotations in place on the floor (T spins in place with kick 0 when space allows)
  A.reset(); A.clear(); A.setPiece('T', 0, 3, 18);
  t = 0; let rots = 0; nextMove = 300;
  while (A.filled() === 0 && t < 30000) {
    A.step(FRAME); t += FRAME;
    if (A.filled() === 0 && t >= nextMove) { if (A.rotate(1)) rots++; nextMove += 300; }
  }
  out.lockDelayRotations = { rotationsEvery300ms: rots, lockedAtMs: Math.round(t) };
}

// ---------- 6. gravity, levels 1..20 ----------
{
  const rows = [];
  for (let L = 1; L <= 20; L++) {
    A.reset(); A.clear(); A.level = L; A.lines = (L - 1) * 10; A.setPiece('O', 0, 3, 0);
    const y0 = A.piece().y; let t = 0; let firstFrameRows = null; let yLast = y0;
    while (t < 20000) {
      A.step(FRAME); t += FRAME; const y = A.piece() ? A.piece().y : yLast;
      if (firstFrameRows === null) firstFrameRows = y - y0;
      yLast = y; if (y - y0 >= 18) break;
    }
    const spr = Math.pow(0.8 - (L - 1) * 0.007, L - 1) * 1000;
    rows.push({ L, msToFall18: Math.round(t), measuredMsPerRow: +(t / 18).toFixed(2), guidelineMsPerRow: +spr.toFixed(2),
      rowsFirstFrame: firstFrameRows, guidelineRowsFirstFrame: Math.min(18, Math.floor(FRAME / spr)) });
  }
  out.gravity = rows;
}

// ---------- 7. scoring ----------
const fillRow = (y, gaps = []) => { for (let x = 0; x < 10; x++) if (!gaps.includes(x)) A.fill(x, y); };
const fresh = (level = 1) => { A.reset(); A.clear(); A.score = 0; A.level = level; A.lines = (level - 1) * 10; };
const delta = (fn) => { const s = A.score; fn(); return A.score - s; };
const single = () => delta(() => { fillRow(19, [3, 4, 5, 6]); A.fill(9, 8); A.setPiece('I', 0, 3, 18); A.hardDrop(); });
const tetris = () => delta(() => { for (let y = 16; y < 20; y++) fillRow(y, [0]); A.fill(9, 8); A.setPiece('I', 1, -2, 16); A.hardDrop(); });
const tsdSetup = (gapsRow19 = [4], gapsRow18 = [3, 4, 5]) => { fillRow(19, gapsRow19); fillRow(18, gapsRow18); A.fill(3, 17); A.setPiece('T', 1, 3, 17); };
const miniSetup = (gaps19 = [4]) => { fillRow(19, gaps19); A.fill(5, 17); A.setPiece('T', 2, 3, 17); };
{
  const s = {};
  fresh(); s.single_L1 = single();
  fresh(); s.double_L1 = delta(() => { fillRow(19, [4, 5]); fillRow(18, [4, 5]); A.fill(9, 8); A.setPiece('O', 0, 3, 18); A.hardDrop(); });
  fresh(); s.triple_L1 = delta(() => { for (let y = 17; y < 20; y++) fillRow(y, [0]); A.setPiece('I', 1, -2, 16); A.hardDrop(); });
  fresh(); s.tetris_L1 = tetris();
  fresh(2); s.tetris_L2 = tetris();
  fresh(); s.perfectClearSingle_L1 = delta(() => { fillRow(19, [3, 4, 5, 6]); A.setPiece('I', 0, 3, 18); A.hardDrop(); });
  fresh(2); single(); A.clear(); s.comboSecondSingle_L2 = single();
  fresh(); tetris(); A.clear(); s.b2bTetris_L1 = tetris();
  fresh(); tetris(); A.clear(); A.setPiece('O', 0, 3, 18); A.hardDrop(); A.clear(); s.b2bAfterNoClearLock = tetris();
  fresh(); tetris(); A.clear(); single(); A.clear(); s.tetrisAfterSingleBreak = tetris();
  fresh(); s.tsd_rotate_hardDrop0 = delta(() => { tsdSetup(); const ok = A.rotate(1); s.tsdRotated = ok && A.piece().rot === 2 && A.piece().x === 3 && A.piece().y === 17; A.hardDrop(); });
  fresh(); s.tsd_rotate_lockDelay = delta(() => { tsdSetup(); A.rotate(1); A.step(700); });
  fresh(); s.tspin0_rotate_hardDrop0 = delta(() => { tsdSetup([0, 4], [0, 3, 4, 5]); A.rotate(1); A.hardDrop(); });
  fresh(); s.tspin0_rotate_lockDelay = delta(() => { tsdSetup([0, 4], [0, 3, 4, 5]); A.rotate(1); A.step(700); });
  fresh(); s.tss_rotate_hardDrop0 = delta(() => { tsdSetup([4], [0, 3, 4, 5]); A.rotate(1); A.hardDrop(); });
  fresh(); s.mini0_rotate_lockDelay = delta(() => { miniSetup([0, 4]); A.rotate(1); A.step(700); });
  fresh(); s.miniSingle_rotate_lockDelay = delta(() => { miniSetup([4]); const ok = A.rotate(1); s.miniRotated = ok && A.piece().rot === 3; A.step(700); });
  fresh(); s.miniSingle_rotate_hardDrop0 = delta(() => { miniSetup([4]); A.rotate(1); A.hardDrop(); });
  fresh(); tetris(); A.clear(); s.b2bTsdAfterTetris_lockDelay = delta(() => { tsdSetup(); A.rotate(1); A.step(700); });
  // rotate in open air, then hard drop 12 rows into a 3-corner spot: must NOT be a T-spin
  fresh(); s.airRotateThenHardDrop12 = delta(() => {
    for (let y = 12; y < 20; y++) A.fill(0, y); fillRow(19, [1]); A.setPiece('T', 0, 0, 5); A.rotate(1); A.hardDrop();
  });
  fresh(); s.levelUpUsesOldLevel = delta(() => { A.lines = 9; fillRow(19, [3, 4, 5, 6]); A.fill(9, 8); A.setPiece('I', 0, 3, 18); A.hardDrop(); }); s.levelAfter = A.level;
  fresh(); A.setPiece('O', 0, 3, 0); s.hardDrop18 = delta(() => A.hardDrop());
  fresh(); A.setPiece('O', 0, 3, 0); { const y0 = A.piece().y; const d = delta(() => { A.softDrop(true); A.step(300); A.softDrop(false); }); s.softDrop300ms = { rows: A.piece().y - y0, points: d }; }
  out.scoring = s;
  out.scoringExpected = {
    single_L1: 100, double_L1: 300, triple_L1: 500, tetris_L1: 800, tetris_L2: 1600, perfectClearSingle_L1: 900,
    comboSecondSingle_L2: 300, b2bTetris_L1: 1250, b2bAfterNoClearLock: 1200, tetrisAfterSingleBreak: 900,
    tsd_rotate_hardDrop0: 1200, tsd_rotate_lockDelay: 1200, tspin0_rotate_hardDrop0: 400, tspin0_rotate_lockDelay: 400,
    tss_rotate_hardDrop0: 800, mini0_rotate_lockDelay: 100, miniSingle_rotate_lockDelay: 200, miniSingle_rotate_hardDrop0: 200,
    b2bTsdAfterTetris_lockDelay: 1850, airRotateThenHardDrop12: 124, levelUpUsesOldLevel: 100, hardDrop18: 36,
  };
  out.scoringDiffs = Object.entries(out.scoringExpected).filter(([k, v]) => s[k] !== v).map(([k, v]) => `${k}: got ${s[k]} want ${v}`);
}

// ---------- 8. top-out, lock-out, restart ----------
{
  const r = {};
  A.reset(); A.clear(); for (let y = 0; y < 2; y++) for (let x = 3; x < 7; x++) A.fill(x, y);
  A.setPiece('O', 0, -1, 18); A.hardDrop(); r.blockedSpawn_overImmediately = A.over();
  A.step(1500); r.blockedSpawn_overAfter1500ms = A.over();
  // lock entirely above the visible field (stack to the top in cols 0-2, O in hidden rows above it)
  A.reset(); A.clear(); for (let y = 0; y < 20; y++) for (let x = 0; x < 3; x++) A.fill(x, y);
  A.setPiece('O', 0, -1, -2); A.hardDrop(); r.lockOutEntirelyAbove_over = A.over();
  // partially above: one row visible, one row in the buffer
  A.reset(); A.clear(); for (let y = 1; y < 20; y++) for (let x = 0; x < 3; x++) A.fill(x, y);
  A.setPiece('O', 0, -1, -1); A.hardDrop(); r.partialAbove_over = A.over();
  r.partialAbove_cellsKept = A.over() ? null : (A.cell(0, 0) !== null && A.cell(1, 0) !== null);
  // restart after game over
  A.reset(); A.clear(); for (let y = 0; y < 2; y++) for (let x = 3; x < 7; x++) A.fill(x, y); A.score = 1234;
  A.setPiece('O', 0, -1, 18); A.hardDrop(); A.step(1500); const wasOver = A.over();
  const inputsIgnored = !A.move(1) && !A.rotate(1);
  A.restart();
  r.restart = { wasOver, inputsIgnoredWhileOver: inputsIgnored, overAfter: A.over(), score: A.score, lines: A.lines, level: A.level, filled: A.filled(), held: A.held() };
  out.topOut = r;
}

console.log(JSON.stringify(out, null, 1));
