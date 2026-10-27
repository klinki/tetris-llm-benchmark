// Usage: node probes/supplemental-probe.mjs <tmpdir>
// Follow-up fixtures for the deviations seen in engine-probe.mjs.
import { loadAdapters } from './adapters.mjs';

const { adapters } = await loadAdapters(process.argv[2]);
const B = 19;
const res = {};

for (const ad of adapters) {
  const r = (res[ad.name] = {});

  // Ledge after the reset allowance is used up, entered through real gravity (no setActive).
  // O spawns, falls onto a one-high ledge (cols 0..5 at the bottom row), uses up its resets, idles
  // 450 ms, steps off to the right and falls one row to the floor.
  {
    const g = ad.create({ queue: ['O', 'T', 'I', 'J'] });
    g.clearBoard();
    for (let x = 0; x <= 5; x++) g.fill(x, B);
    let t = 0;
    while (g.active.type === 'O' && g.active.y < g.ghostY() && t < 30000) { g.tick(1); t++; }
    // O cells now at cols 4,5 rows 17,18. Shuffle left/right to spend resets.
    const before = g.active;
    const moves = ad.name === 'run-b' ? 14 : 16; // run-b locks immediately on the 15th grounded reset
    for (let i = 0; i < moves; i++) (i % 2 ? g.right() : g.left());
    let lockedEarly = false;
    for (let i = 0; i < 450; i++) { g.tick(1); if (g.active.type !== 'O') { lockedEarly = true; break; } }
    let floorLock = null, landed = null, ms = 0;
    if (!lockedEarly) {
      g.right(); g.right(); // cols 6,7 -> off the ledge
      while (g.active.type === 'O' && ms < 5000) { g.tick(1); ms++; if (landed === null && g.active.y === B - 1) landed = ms; }
      floorLock = landed === null ? null : ms - landed;
    }
    r.ledgeAfterCap = { landedOnLedge: before, lockedEarly, airborne_ms: landed, lockAfterReachingFloor_ms: floorLock };
  }

  // Blocked visible spawn rows: rows 0 and 1 filled at cols 3..6, rest open.
  {
    const g = ad.create({ queue: ['O', 'T', 'I', 'J'] });
    g.clearBoard();
    for (let x = 3; x <= 6; x++) { g.fill(x, 0); g.fill(x, 1); }
    g.setActive('O', 0, -1, B - 1);
    g.hard();
    const afterSpawn = { over: g.over, active: g.active };
    let afterNext = null;
    if (!g.over) { g.hard(); afterNext = { over: g.over }; }
    r.blockedVisibleSpawn = { afterSpawn, afterNextHardDrop: afterNext };
  }

  // Only row 1 filled at the spawn columns (row 0 open)
  {
    const g = ad.create({ queue: ['O', 'T', 'I', 'J'] });
    g.clearBoard();
    for (let x = 3; x <= 6; x++) g.fill(x, 1);
    g.setActive('O', 0, -1, B - 1);
    g.hard();
    r.row1OnlyBlocked = { over: g.over, active: g.active };
  }

  // T-spin after the piece travelled: rotate in the air, then hard drop 12 rows into a 3-corner spot.
  {
    const g = ad.create({ queue: ['T', 'I', 'O', 'J'] });
    g.clearBoard();
    g.fill(2, B - 2); g.fill(2, B); g.fill(0, B); g.fill(9, B);
    g.setActive('T', 0, 0, 5);
    g.ccw();
    const s0 = g.score; const travelled = g.hard();
    r.spinAfterHardDropTravel = { gained: g.score - s0, expectedNoSpin: 24 };
  }
  // Same, but rotation directly at the final spot (true T-spin mini, zero-travel)
  {
    const g = ad.create({ queue: ['T', 'I', 'O', 'J'] });
    g.clearBoard();
    g.fill(2, B - 2); g.fill(2, B); g.fill(0, B); g.fill(9, B);
    g.setActive('T', 0, 0, B - 2);
    const ok = g.ccw();
    const a = g.active;
    const s0 = g.score; g.hard();
    r.spinAtRest = { ok, a, gained: g.score - s0 };
  }
}
console.log(JSON.stringify(res, null, 1));
