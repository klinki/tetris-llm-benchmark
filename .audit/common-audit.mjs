import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const load = (path) => import(pathToFileURL(`${repositoryRoot}/${path}`));

const deep = await load("deepseek-pi/dist/tetromino.js");
const deepGameModule = await load("deepseek-pi/dist/game.js");
const deepBoard = await load("deepseek-pi/dist/board.js");
const lunaCodex = await load("luna-codex/dist/engine.js");
const lunaOmp = await load("luna-omp/dist/game.js");
const solCodex = await load("sol-codex/dist/game.js");
const solOmp = await load("sol-omp/dist/game.js");

const canonicalSrs = {
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

const coordinateKey = (points) => points
  .map(([x, y]) => `${x},${y}`)
  .sort()
  .join(" ");

const adapters = {
  "DeepSeek OMP/PI": (type, rotation) => deep.CELLS[type][rotation],
  "Luna Codex": (type, rotation) => {
    const cells = [];
    lunaCodex.MATRICES[type][rotation].forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== ".") cells.push([x, y]);
      });
    });
    return cells;
  },
  "Luna OMP": (type, rotation) => new lunaOmp.TetrisGame(() => 0.5)
    .getPieceCells(type, rotation)
    .map(({ x, y }) => [x, y]),
  "Sol Codex": (type, rotation) => solCodex.cells({ name: type, x: 0, y: 0, rotation }),
  "Sol OMP": (type, rotation) => solOmp.cellsFor({ kind: type, x: 0, y: 0, rotation }),
};

const expectedOrientationFailures = {
  "DeepSeek OMP/PI": [],
  "Luna Codex": ["S2", "Z1", "Z2", "Z3"],
  "Luna OMP": [],
  "Sol Codex": [],
  "Sol OMP": [],
};

for (const [name, cellsFor] of Object.entries(adapters)) {
  const failures = [];
  for (const type of Object.keys(canonicalSrs)) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      if (coordinateKey(cellsFor(type, rotation)) !== coordinateKey(canonicalSrs[type][rotation])) {
        failures.push(`${type}${rotation}`);
      }
    }
  }

  assert.deepEqual(failures, expectedOrientationFailures[name], `${name} SRS result changed`);
  console.log(`${name} canonical SRS orientations: ${failures.length ? `FAIL ${failures.join(",")}` : "PASS"}`);
}

{
  const game = new deepGameModule.Game();
  game.board.reset();
  const originalPiece = { type: "O", state: 0, x: 0, y: 19 };
  game.active = originalPiece;
  game.board.grid[21 * deepBoard.COLS + 1] = 1;
  game.update(1);

  assert.equal(game.move(1), true, "DeepSeek piece should move off its support");
  assert.equal(
    game.board.collides(game.active, game.active.x, game.active.y + 1),
    false,
    "DeepSeek piece should be airborne after the move",
  );

  game.update(0.51);
  assert.notEqual(game.active, originalPiece, "Expected the audited airborne-lock defect");
  console.log("DeepSeek ledge lock: FAIL locked while airborne");
}

{
  const game = new solCodex.TetrisGame(() => 0.5);
  game.board = solCodex.emptyBoard();
  game.active = { name: "O", x: 0, y: 19, rotation: 0 };
  game.board[21][1] = "J";

  assert.equal(game.move(0, 1, 0), false, "Sol Codex piece should be grounded initially");
  assert.equal(game.move(1, 0, 100), true, "Sol Codex piece should move off its support");
  assert.equal(game.valid({ ...game.active, y: game.active.y + 1 }), true, "Sol Codex piece should be airborne");
  assert.notEqual(game.groundedAt, null, "Expected the audited stale groundedAt defect");
  console.log("Sol Codex ledge timer: FAIL stale groundedAt would trigger main-loop lock");
}
