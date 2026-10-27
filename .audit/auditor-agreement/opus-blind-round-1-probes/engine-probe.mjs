// Usage: node probes/engine-probe.mjs <tmpdir-with-built-run-a/b/c>
import { loadAdapters, seeded } from './adapters.mjs';

const tmp = process.argv[2];
const { adapters, shapes } = await loadAdapters(tmp);
const B = 19; // bottom visible row
const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
const out = {};
const log = (run, key, val) => { (out[run] ??= {})[key] = val; };

// ---------- canonical SRS ----------
const CANON = {
  I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]],
  O: [0,1,2,3].map(() => [[1,0],[2,0],[1,1],[2,1]]),
  S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
};
// y-up wiki tables, converted below to y-down
const JLSTZ_UP = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],     '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],    '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const I_UP = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};
const key = (c) => c.map(([x, y]) => `${x},${y}`).sort().join(' ');

for (const ad of adapters) {
  const run = ad.name;
  // ---- P1: 28 orientation states (fixed translation per piece allowed) ----
  const mism = [];
  for (const t of TYPES) {
    let trans = null;
    for (let r = 0; r < 4; r++) {
      const got = shapes[run](t, r);
      const minG = [Math.min(...got.map(p => p[0])), Math.min(...got.map(p => p[1]))];
      const can = CANON[t][r];
      const minC = [Math.min(...can.map(p => p[0])), Math.min(...can.map(p => p[1]))];
      // translation implied by this orientation relative to canonical box
      const d = [got[0] && (minG[0] - minC[0]), minG[1] - minC[1]];
      const norm = got.map(([x, y]) => [x - minG[0], y - minG[1]]);
      const normC = can.map(([x, y]) => [x - minC[0], y - minC[1]]);
      if (key(norm) !== key(normC)) mism.push(`${t}${r} shape`);
      else if (trans === null) trans = d.join(',');
      else if (trans !== d.join(',')) mism.push(`${t}${r} origin drift ${d} vs ${trans}`);
    }
  }
  log(run, 'P1_srs28_mismatches', mism);

  // ---- P2: black-box kick tests for every transition and test index ----
  const kickFails = [];
  let kickChecked = 0, kickSkipped = 0;
  for (const t of ['I', 'J', 'L', 'S', 'T', 'Z']) {
    const table = t === 'I' ? I_UP : JLSTZ_UP;
    for (const [tr, tests] of Object.entries(table)) {
      const [from, to] = tr.split('>').map(Number);
      const ox = 3, oy = 9;
      const cells = (r, x, y) => CANON[t][r].map(([cx, cy]) => [cx + x, cy + y]);
      const cur = new Set(cells(from, ox, oy).map(c => c.join(',')));
      const cand = tests.map(([dx, dy]) => cells(to, ox + dx, oy - dy).map(c => c.join(',')));
      for (let k = 0; k < tests.length; k++) {
        const keep = new Set([...cur, ...cand[k]]);
        const block = new Set();
        let ok = true;
        for (let j = 0; j < k; j++) {
          const c = cand[j].find(s => !keep.has(s));
          if (!c) { ok = false; break; }
          block.add(c);
        }
        if (!ok) { kickSkipped++; continue; }
        const g = ad.create({ queue: ['T', 'I', 'O', 'S', 'Z', 'J', 'L'] });
        g.clearBoard();
        for (const s of block) { const [x, y] = s.split(',').map(Number); g.fill(x, y); }
        g.setActive(t, from, ox, oy);
        const res = to === (from + 1) % 4 ? g.cw() : g.ccw();
        const a = g.active;
        const exp = { x: ox + tests[k][0], y: oy - tests[k][1], rotation: to };
        kickChecked++;
        if (!res || a.x !== exp.x || a.y !== exp.y || a.rotation !== to) kickFails.push(`${t} ${tr} test${k + 1}: got ${JSON.stringify(a)} exp ${JSON.stringify(exp)}`);
      }
    }
  }
  log(run, 'P2_kicks', { checked: kickChecked, skippedUnconstructible: kickSkipped, fails: kickFails });

  // ---- P3: 7-bag + preview consistency ----
  {
    const g = ad.create({ random: seeded(7) });
    const seq = [];
    let previewOk = true;
    for (let i = 0; i < 70; i++) {
      const preview = g.queue.slice(0, 5);
      seq.push(g.active.type);
      g.clearBoard();
      g.hard();
      if (g.active.type !== preview[0]) previewOk = false;
    }
    const bagsOk = Array.from({ length: 10 }, (_, b) => seq.slice(b * 7, b * 7 + 7).sort().join('') === 'IJLOSTZ').every(Boolean);
    log(run, 'P3_bag', { bagsOk, previewOk, queueLen: g.queue.length, first14: seq.slice(0, 14).join('') });
  }

  // ---- P4: spawn positions ----
  {
    const sp = {};
    for (const t of TYPES) {
      const g = ad.create({ queue: [t, 'I', 'I'] });
      // Re-spawn through the real path: hold puts t away then lock+hold returns it
      // Simpler: fresh game whose first piece is t.
      let a = g.active;
      if (run === 'run-a') { // run-a create() sets active manually; use real spawn via hold swap
        const g2 = ad.create({ queue: ['I', t] });
        g2.hold(); a = g2.active;
      }
      sp[t] = `${a.type} r${a.rotation} (${a.x},${a.y}) cells rows ${[...new Set(CANON[t][0].map(([, y]) => y + a.y))].join('/')}`;
    }
    log(run, 'P4_spawn', sp);
  }

  // ---- P5: hold ----
  {
    const g = ad.create({ queue: ['T', 'I', 'O', 'S', 'Z', 'J', 'L'] });
    g.cw();
    const r = [];
    r.push(['hold1', g.hold(), g.held, g.active.type]);
    r.push(['hold2-blocked', g.hold(), g.held, g.active.type]);
    g.hard();
    r.push(['after lock canHold', g.canHold, g.active.type]);
    r.push(['hold3', g.hold(), g.held, g.active.type, g.active.rotation, g.active.x, g.active.y]);
    log(run, 'P5_hold', r);
  }

  // ---- P6: ghost with obstruction ----
  {
    const g = ad.create({ queue: ['T', 'I', 'O'] });
    g.clearBoard();
    g.fill(4, 12); g.fill(3, 15);
    g.setActive('T', 2, 3, 2); // pointing down; stem at (4,y+2)
    log(run, 'P6_ghost', { ghostY: g.ghostY(), expected: 9 });
  }

  // ---- P7: lock delay ----
  {
    const r = {};
    // a) 499/500 after landing via gravity (1 ms ticks)
    let g = ad.create({ queue: ['O', 'T', 'I'] });
    let t = 0;
    while (g.active.type === 'O' && g.active.y < g.ghostY() && t < 60000) { g.tick(1); t++; }
    const landedAt = t;
    let lockAt = null;
    for (let i = 1; i <= 2000 && lockAt === null; i++) { g.tick(1); if (g.active.type !== 'O') lockAt = i; }
    r.fall_ms = landedAt; r.lockAfterLanding_ms = lockAt;
    // b) reset cap: move every 300 ms while grounded, count how long it survives
    g = ad.create({ queue: ['O', 'T', 'I'] });
    g.clearBoard();
    g.setActive('O', 0, 3, B - 1);
    let elapsed = 0, moves = 0;
    while (g.active.type === 'O' && elapsed < 20000) {
      g.tick(1); elapsed++;
      if (elapsed % 300 === 0 && g.active.type === 'O') { (moves % 2 ? g.right() : g.left()); moves++; }
    }
    r.capSurvival_ms = elapsed; r.capMoves = moves;
    // c) ledge after cap: O on 1-high ledge, exhaust resets, idle 450 ms, step off, fall, measure floor lock
    g = ad.create({ queue: ['O', 'T', 'I'] });
    g.clearBoard();
    for (let x = 0; x <= 4; x++) g.fill(x, B);
    g.setActive('O', 0, 2, B - 2); // cells cols 3,4 rows 17,18 on ledge
    for (let i = 0; i < 16; i++) (i % 2 ? g.right() : g.left()); // exhaust resets (ends back at x=2)
    let lockedOnLedge = false;
    for (let i = 0; i < 450; i++) { g.tick(1); if (g.active.type !== 'O') { lockedOnLedge = true; break; } }
    if (!lockedOnLedge) {
      g.right(); g.right(); g.right(); // cols 6,7 -> off ledge
      let ms = 0; let landed = null;
      while (g.active.type === 'O' && ms < 5000) { g.tick(1); ms++; if (landed === null && g.active.y === B - 1) landed = ms; }
      r.ledge = { landedAfter_ms: landed, lockedAfter_ms: ms, lockAfterFloorLanding_ms: landed === null ? null : ms - landed };
    } else r.ledge = 'locked on ledge before stepping off';
    log(run, 'P7_lock', r);
  }

  // ---- P8: gravity per level ----
  {
    const r = {};
    for (const lv of [1, 2, 3, 5, 10, 15, 20]) {
      const g = ad.create({ queue: ['O', 'T', 'I'] });
      g.clearBoard();
      g.level = lv;
      g.setActive('O', 0, 3, 2);
      const y0 = g.active.y; let ms = 0;
      if (lv <= 10) {
        while (g.active.y === y0 && ms < 5000) { g.tick(1); ms++; }
        r[`L${lv}_firstRow_ms`] = ms;
      } else {
        g.tick(16);
        r[`L${lv}_rowsIn16ms`] = g.active.y - y0;
      }
    }
    log(run, 'P8_gravity', r);
  }

  // ---- P10: scoring fixtures ----
  {
    const r = {};
    const fresh = () => { const g = ad.create({ queue: ['I', 'T', 'O', 'S', 'Z', 'J', 'L', 'I', 'T'] }); g.clearBoard(); return g; };
    // normal clears with vertical I into column 9
    for (const n of [1, 2, 3, 4]) {
      const g = fresh();
      for (let y = B - n + 1; y <= B; y++) for (let x = 0; x < 9; x++) g.fill(x, y);
      g.fill(0, B - n); // avoid perfect clear
      g.setActive('I', 1, 7, B - 3); // cells col 9 rows 16..19
      const s0 = g.score; g.hard();
      r[`clear${n}`] = g.score - s0;
    }
    // spin fixtures
    const spin = (kind, lines, how) => {
      const g = fresh();
      const b = B;
      g.fill(5, b - 2); g.fill(3, b);
      if (kind === 'full') g.fill(3, b - 2); else g.fill(5, b);
      if (lines) for (let x = 0; x < 10; x++) if (x < 3 || x > 5) g.fill(x, b - 1);
      // keep the board non-empty after a single clear
      g.fill(9, b);
      g.setActive('T', 3, 3, b - 2);
      const s0 = g.score;
      g.cw();
      const a = g.active;
      if (how === 'hard') g.hard(); else { for (let i = 0; i < 600 && g.active.type === 'T'; i++) g.tick(1); }
      return `${g.score - s0}${a.rotation !== 0 || a.x !== 3 || a.y !== b - 2 ? ` (rot ${JSON.stringify(a)})` : ''}`;
    };
    for (const kind of ['full', 'mini']) for (const lines of [0, 1]) for (const how of ['hard', 'timed']) r[`${kind}${lines}_${how}`] = spin(kind, lines, how);
    // two tetrises with a no-clear lock between
    {
      const g = fresh();
      const well = () => { for (let y = B - 3; y <= B; y++) for (let x = 0; x < 9; x++) g.fill(x, y); g.fill(0, B - 4); };
      well(); g.setActive('I', 1, 7, B - 3); g.hard();
      g.setActive('O', 0, 3, 0); const sBefore = g.score; g.hard(); const oDrop = g.score - sBefore; // no-clear lock
      // clear board again for 2nd tetris
      g.clearBoard(); well(); g.setActive('I', 1, 7, B - 3);
      g.hard();
      r.twoTetrisWithGap = g.score - oDrop;
    }
    // level-two combo single (two consecutive singles at level 2)
    {
      const g = fresh();
      g.level = 2; g.lines = 10;
      const row = () => { for (let x = 0; x < 9; x++) g.fill(x, B); g.fill(0, B - 1); g.fill(1, B - 1); };
      row(); g.setActive('I', 1, 7, B - 3);
      // vertical I would clear only bottom row: rows 16..19 in col 9, only row 19 full
      g.hard();
      g.clearBoard(); row(); g.setActive('I', 1, 7, B - 3);
      const s0 = g.score; g.hard();
      r.level2ComboSingle = g.score - s0;
    }
    // perfect clear single
    {
      const g = fresh();
      for (let x = 0; x < 10; x++) if (x < 3 || x > 6) g.fill(x, B);
      g.setActive('I', 0, 3, B - 1);
      const s0 = g.score; g.hard();
      r.perfectClearSingle = g.score - s0; r.pcBoardEmpty = g.boardEmpty();
    }
    // T-spin credited after the piece fell since its rotation?
    {
      const g = fresh();
      // column-2 stack forming right-hand corners for a T pointing left (rot 3) at box x=0
      g.fill(2, B - 2); g.fill(2, B); g.fill(0, B); g.fill(9, B);
      g.setActive('T', 0, 0, 5);
      g.ccw(); // rot 3 in the air
      const a = g.active;
      const s0 = g.score; const d = g.hard();
      r.spinAfterHardDropTravel = { gained: g.score - s0, rotState: a };
    }
    {
      const g = fresh();
      g.fill(2, B - 2); g.fill(2, B); g.fill(0, B); g.fill(9, B);
      g.setActive('T', 0, 0, B - 3);
      g.ccw();
      const s0 = g.score;
      for (let i = 0; i < 3000 && g.active.type === 'T'; i++) g.tick(1);
      r.spinAfterGravityFall = g.score - s0;
    }
    log(run, 'P10_scoring', r);
  }

  // ---- P11: top-out ----
  {
    const r = {};
    // blocked spawn: fill spawn rows of next piece
    let g = ad.create({ queue: ['O', 'T', 'I'] });
    g.clearBoard();
    for (let x = 0; x < 10; x++) if (x !== 5) g.fill(x, 1);
    for (let x = 0; x < 10; x++) if (x !== 5) g.fill(x, 0);
    g.setActive('I', 1, 3, -6); // cells col 5 rows -6..-3? keep it above; then hard drop lands on col 5 stack? col5 empty
    g.clearBoard();
    for (let x = 3; x <= 6; x++) { g.fill(x, 0); g.fill(x, 1); }
    g.setActive('O', 0, -1, B - 1); g.hard(); // lock somewhere harmless at left bottom
    r.blockedSpawnOver = g.over;
    // whole piece locked above the visible field with next spawn open
    g = ad.create({ queue: ['O', 'I', 'T'] });
    g.clearBoard();
    for (let y = 0; y <= B; y++) { g.fill(0, y); g.fill(1, y); } // tall columns at the left
    g.setActive('O', 0, -1, -3); // O cells cols 0,1 rows -3,-2 resting on column top
    try { g.hard(); r.lockOutOver = g.over; } catch (e) { r.lockOutOver = 'threw ' + e.message; }
    // partial lock above (2 of 4 cells above row 0): are the hidden cells kept?
    g = ad.create({ queue: ['O', 'I', 'T'] });
    g.clearBoard();
    g.fill(6, 2); g.fill(0, B);
    g.setActive('I', 1, 4, -2); // cells col 6 rows -2..1, resting on (6,2)
    g.hard();
    r.partialLock = { over: g.over, cellRowMinus1: g.cell(6, -1), cellRow0: g.cell(6, 0), cellRow1: g.cell(6, 1) };
    // restart
    g = ad.create({ queue: ['O', 'T', 'I'] });
    g.score = 1234; g.lines = 7; g.level = 3; g.hold();
    g.restart();
    r.restart = { score: g.score, lines: g.lines, level: g.level, held: g.held, canHold: g.canHold, over: g.over };
    log(run, 'P11_topout', r);
  }

  // ---- P12: reachable partial lock through the I 0->1 fifth kick from spawn ----
  {
    const g = ad.create({ queue: ['I', 'T', 'O'] });
    g.clearBoard();
    const a0 = g.active; // real spawn
    const row = a0.y + 1; // I occupies row a0.y+1 in rotation 0
    // block tests 1..4 of 0->1 using the canonical kicks relative to the real spawn
    g.fill(a0.x + 2, row + 1); g.fill(a0.x + 0, row + 1); g.fill(a0.x + 3, row + 1);
    g.fill(0, B);
    const ok = g.cw();
    const a1 = g.active;
    g.hard();
    const col = a1.x + 2;
    r12: {
      log(run, 'P12_kickIntoBuffer', { spawn: a0, afterCW: a1, over: g.over,
        cells: [a1.y, a1.y + 1, a1.y + 2, a1.y + 3].map(y => `${y}:${g.cell(col, y)}`) });
    }
  }
}
console.log(JSON.stringify(out, null, 1));
