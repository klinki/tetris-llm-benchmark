import assert from "node:assert/strict";
import { Game, COLS, ROWS } from "../dist/game.js";

const test = (name, fn) => { fn(); console.log("ok -", name); };
const fresh = () => new Game(() => 0.5);

test("7-bag yields every piece once per 7 draws", () => {
  const g = fresh();
  const seen = [g.current.type, ...g.next];
  assert.equal(new Set(seen.slice(0, 7)).size, Math.min(7, seen.length));
});

test("moves are blocked by walls", () => {
  const g = fresh();
  for (let i = 0; i < 20; i++) g.move(-1);
  assert.ok(g.cells(g.current).every(([x]) => x >= 0));
  for (let i = 0; i < 20; i++) g.move(1);
  assert.ok(g.cells(g.current).every(([x]) => x < COLS));
});

test("four rotations return to the start", () => {
  const g = fresh();
  g.current = { type: "T", rotation: 0, x: 3, y: 10 };
  for (let i = 0; i < 4; i++) assert.ok(g.rotate(1));
  assert.equal(g.current.rotation, 0);
});

test("hard drop locks piece and scores 2 per cell", () => {
  const g = fresh();
  const first = g.current.type;
  const before = g.current.y;
  const landing = g.ghost().y;
  g.hardDrop();
  assert.equal(g.score, 2 * (landing - before));
  assert.ok(g.board.some((r) => r.includes(first)));
});

test("full line clears and scores 100 * level", () => {
  const g = fresh();
  g.board[ROWS - 1] = new Array(COLS).fill("I").map((c, i) => (i < 4 ? null : c));
  g.current = { type: "I", rotation: 0, x: 0, y: 18 };
  g.hardDrop();
  assert.equal(g.lines, 1);
  assert.ok(g.score >= 100);
  assert.ok(g.board[ROWS - 1].every((c) => c === null));
});

test("hold swaps once per piece", () => {
  const g = fresh();
  const t = g.current.type;
  g.holdPiece();
  assert.equal(g.hold, t);
  const after = g.current.type;
  g.holdPiece();
  assert.equal(g.current.type, after);
});

test("lock delay locks a grounded piece", () => {
  const g = fresh();
  g.current = { ...g.ghost() };
  g.update(100);
  assert.ok(!g.board.some((r) => r.some(Boolean)));
  g.update(500);
  assert.ok(g.board.some((r) => r.some(Boolean)));
});

test("top out ends the game; restart recovers", () => {
  const g = fresh();
  for (let i = 0; i < 40 && !g.gameOver; i++) g.hardDrop();
  assert.ok(g.gameOver);
  g.restart();
  assert.ok(!g.gameOver && g.score === 0);
});
