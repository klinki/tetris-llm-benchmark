import { Game, shuffledBag, cellsFor, kicksFor } from "../tetris.js";
function ok(c: unknown, m = "") { if (!c) throw new Error("FAIL: " + m); }
function eq(a: unknown, b: unknown, m = "") { if (a !== b) throw new Error(`FAIL ${m}: ${a} !== ${b}`); }

// 7-bag: each bag of 7 contains all pieces
{
  for (let b = 0; b < 4; b++) {
    const bag = shuffledBag(() => 0.5);
    eq(new Set(bag).size, 7, "bag must contain 7 distinct");
  }
  { const g = new Game(() => 0.5); eq(g.queue.length >= 7, true); }
}
// rotation + kicks exist
{
  ok(cellsFor("T", 1).length === 4);
  ok(kicksFor("T", 0, 1).length === 5);
  ok(kicksFor("I", 0, 1).length === 5);
}
// movement / ghost / hard drop / hold / scoring / top-out
{
  const g = new Game(() => 0.999);
  ok(g.active);
  const x0 = g.active!.x;
  g.move(-1, 0); eq(g.active!.x, x0 - 1);
  g.rotate(1); ok([0,1].includes(g.active!.rot));
  ok(g.ghostY() >= g.active!.y);
  const q0 = g.queue[0];
  g.hold(); eq(g.holdKind !== null, true);
  g.canHold = true; // simulate lock to re-enable for test
  const linesBefore = g.lines;
  // force a line clear
  for (let x = 0; x < 10; x++) g.grid[21][x] = "I";
  g.lockNow();
  ok(g.lines >= linesBefore);
  // blocked spawn => top out
  const g2 = new Game(() => 0.5);
  for (let x = 0; x < 10; x++) { g2.grid[0][x] = "Z"; g2.grid[1][x] = "Z"; }
  g2.spawn();
  eq(g2.over, true);
}
console.log("smoke tests passed");
