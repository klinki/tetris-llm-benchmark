// Targeted follow-up reproductions. Usage: node extra-probe.mjs <letter> <builtTempCopy>
import { makeAdapter } from './adapters.mjs';

const [letter, root] = process.argv.slice(2);
const A = await makeAdapter(letter, root);
const FRAME = 1000 / 60;
const out = {};
const fillRow = (y, gaps = []) => { for (let x = 0; x < 10; x++) if (!gaps.includes(x)) A.fill(x, y); };
const fresh = () => { A.reset(); A.clear(); A.score = 0; A.level = 1; A.lines = 0; };
const delta = (fn) => { const s = A.score; fn(); return A.score - s; };
const tetris = () => delta(() => { for (let y = 16; y < 20; y++) fillRow(y, [0]); A.fill(9, 8); A.setPiece('I', 1, -2, 16); A.hardDrop(); });

// 1. Air rotation, then a 12-row hard drop into a 3-corner spot, then a Tetris.
//    Guideline: plain single (no spin) -> the Tetris is not back-to-back: 800 + 50 combo = 850.
fresh();
out.falseSpin_single = delta(() => { for (let y = 12; y < 20; y++) A.fill(0, y); fillRow(19, [1]); A.setPiece('T', 0, 0, 5); A.rotate(1); A.hardDrop(); });
out.falseSpin_backToBackFlag = A.g.backToBack;
A.clear(); out.falseSpin_nextTetris = tetris();

// 2. Spawn visibility: ms of level-1 gravity until any active cell is in the visible field.
for (let i = 0; i < 3; i++) {
  A.reset(); let t = 0; const type = A.piece().type;
  while (!A.cells().some(([, y]) => y >= 0) && t < 5000) { A.step(FRAME); t += FRAME; }
  const all = (() => { let u = t; while (!A.cells().every(([, y]) => y >= 0) && u < 5000) { A.step(FRAME); u += FRAME; } return u; })();
  (out.spawnVisibility ||= []).push({ type, firstCellVisibleMs: Math.round(t), wholePieceVisibleMs: Math.round(all) });
}

// 3. Lock out at the side: cols 0-2 stacked to the top, O locked in the buffer above them.
fresh(); for (let y = 0; y < 20; y++) for (let x = 0; x < 3; x++) A.fill(x, y);
A.setPiece('O', 0, -1, -2); A.hardDrop();
out.sideLockOut = { over: A.over(), activeType: A.over() ? null : A.piece().type, filledTotal: A.filled() };

// 4. Partial lock above the visible field (one row visible, one row above it).
fresh(); for (let y = 1; y < 20; y++) for (let x = 0; x < 3; x++) A.fill(x, y);
A.setPiece('O', 0, -1, -1); A.hardDrop(); out.partialAboveOver = A.over();

console.log(JSON.stringify(out));
