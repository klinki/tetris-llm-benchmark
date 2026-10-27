# Blind Opus 5.5 (high) audit, round 2 — original report

Key, revealed after scoring: **run-a** = `glm-5.3-flash-free-max`, **run-b** = `claude-sonnet-5-5-medium`, **run-c** = `gpt-6.1-terra-low`, **run-d** = `mimo-v2.6-flash-default`, **run-e** = `gpt-5.6-sol-high`. The report below is unedited.

# Blind audit: five TetrisJS implementations

Audit date: 2026-10-27. Rubric: `RUBRIC.md` (Correctness 40, Tests 20, Code 20, Simplicity 10, Browser UX 10; critical −4 with cap 4, major −1.5, minor −0.5; each defect deducted once, from correctness only). Severity and score calibration follow `calibration/`.

## Summary

| Run | Correctness | Tests | Code | Simplicity | Browser UX | Weighted |
|---|---:|---:|---:|---:|---:|---:|
| run-a | 8.0 | 7.0 | 8.5 | 7.0 | 8.0 | **7.80** |
| run-b | 9.0 | 5.5 | 8.0 | 9.0 | 6.0 | **7.80** |
| run-c | 7.5 | 2.0 | 3.0 | 5.0 | 8.0 | **5.30** |
| run-d | 7.5 | 7.5 | 8.5 | 7.0 | 7.0 | **7.60** |
| run-e | 7.0 | 3.5 | 7.5 | 7.0 | 8.5 | **6.55** |

## Procedure

1. Each run was copied to a random temporary directory (`mktemp -d /tmp/tetaudit.XXXXXX`), excluding `node_modules`, `dist` and `dist-test`. Nothing was built inside `runs/`.
2. In each copy I ran `npm ci`, the declared `npm run build`, and the unchanged `npm test`. **All five installed, built and passed their own tests (exit 0).**
3. Engine probes (`probes/engine-probe.mjs`, `probes/extra-probe.mjs`, using the adapters in `probes/adapters.mjs`) drove each compiled engine through public fields and methods, in visible-field coordinates. They cover:
   - all 28 SRS states, with one fixed origin translation per piece, taken from the spawn state only;
   - a differential SRS kick test against the tetris.wiki tables: 6,000 random-board rotations, 2,356 of which need a non-zero kick;
   - the 7-bag over 70 pieces, hold, and ghost versus independent landing (298 boards);
   - lock delay and the 15-reset cap, and gravity at levels 1–20;
   - 22 scoring scenarios: line clears, T-spin/mini, B2B, combos, perfect clear, and drop points;
   - top-out (blocked spawn), lock-out and restart.

   Where soft drop lives in `main.ts` (run-c, run-e), the adapter mirrors that file's timing.
4. Each run was served with its own start command in its temporary copy: `PORT=41321 npm start` (a) and `PORT=41324 npm start` (d). Three servers hard-code port 8321, so in the temporary copy only I changed that one `listen` line:
   - run-b: `server.mjs` line 7 → `41322`;
   - run-c: `server.js` `.listen(8321,` → `.listen(41323,`;
   - run-e: `scripts/serve.mjs` line 35 → `41325`.

   `probes/browser-probe.cjs` loaded each game in Playwright Chromium at 1280×800 and 390×844. It pressed ArrowLeft, ArrowRight, ArrowUp, X, Z, ControlLeft, ArrowDown (held 300 ms), Space and C with real key events. On desktop it then hard-dropped repeatedly to top out and pressed R. It recorded console errors, page errors, failed responses, external requests and layout boxes, and took screenshots, which I inspected. **No run produced any console error, page exception or failed request.**
5. Reference rules: tetris.wiki/Tetris Guideline SRS tables, the Guideline gravity formula `(0.8 − (L−1)·0.007)^(L−1)` s/row, and Guideline scoring. That scoring is: single/double/triple/Tetris 100/300/500/800; T-spin 0/1/2/3 lines 400/800/1200/1600; mini 100/200/400; all ×level. B2B is ×1.5; combo adds 50×combo×level. Soft drop scores 1 per row, hard drop 2 per row. The perfect-clear bonus is 800 for a single (the benchmark convention used in calibration). Lock delay is 500 ms with 15 move/rotate resets.

### Results common to all five (no finding)

- SRS: all 28 states match. The differential kick test found 0 mismatches in every run, and the O piece never moves when rotated.
- Each window of 7 pieces is a complete bag. Hold works once per piece and returns the held piece in spawn orientation at the spawn position. The ghost always equals the hard-drop landing (0/298 mismatches).
- A grounded piece locks at 500 ms (run-d at 517 ms, one 60 Hz frame late because it checks at frame end). With a move every 400 ms the piece locks at 6,500 ms, exactly 15 resets + 500 ms.
- Single/double/triple/Tetris at levels 1 and 2 are correct. So are the combo at level 2 (300), B2B Tetris (1,250), B2B kept through a no-clear lock (1,200) and B2B broken by a single (900). The level-up clear uses the old level, and hard drop scores 2 per row (36 for 18 rows).
- A blocked spawn ends the game, input is ignored while over, and restart resets the score, lines, level, board and hold.

---

## run-a: weighted 7.80

`8.0×0.40 + 7.0×0.20 + 8.5×0.20 + 7.0×0.10 + 8.0×0.10 = 3.20 + 1.40 + 1.70 + 0.70 + 0.80 = 7.80`

**Summary:** A clean, well-modularised canvas game with a complete rules engine, including mini/full T-spins, B2B, combos, lock-out and a 5-piece queue. Its gravity table is not the Guideline curve, and it has no perfect-clear bonus.

### Findings

| Severity | Finding | Exact reproduction |
|---|---|---|
| **Major** | Gravity is not Guideline gravity at any level 1–20. | `src/constants.ts` `GRAVITY_MS_BY_LEVEL = [267, 217, 167, …, 17]` is a classic frame table, not `(0.8−(L−1)·0.007)^(L−1)`, and `fall()` limits gravity to one row per frame. The probe sets `game.level = L`, puts an O at the top of an empty field and steps 60 Hz frames until it has fallen 18 rows. Measured vs Guideline ms/row: L1 283 vs 1000; L2 233 vs 793; L5 133 vs 355; L10 83 vs 64; L15 33 vs 7.1; L20 33 vs 0.46 (0 rows in the first frame where the Guideline gives ~18). Level 1 falls ~3.5× too fast and levels ≥10 too slowly. The own test asserts the 267 ms value. |
| Minor | No perfect-clear bonus. | Empty field; fill row 19 except columns 3–6; set `game.piece = {type:'I', x:3, y:20, rot:0}` (field rows include 2 hidden rows); `hardDrop()`. The score rises by 100 instead of 900, and `lockPiece()` has no perfect-clear branch. |

Not deducted: soft drop runs at 20× this (wrong) gravity, so it inherits the gravity finding rather than being a separate defect. Cells above field row 0 are discarded by `Field.lockCells`, but reaching them needs a piece above both hidden rows, which I could not produce in play.

**Correctness:** 10 − 1.5 − 0.5 = **8.0**.

### Own tests (7.0)

There are 23 deterministic tests:
- the 7-bag (window and distribution), field walls and line clears;
- T rotation states, I/T floor kicks with exact kick indices, and a failed rotation;
- hard drop scoring and ghost, soft-drop points, basic lock delay, wall moves, hold once-per-piece, blocked-spawn top-out and restart;
- double scoring, the combo bonus and level-up;
- full and mini T-spin scoring, the kick-5 upgrade to a full spin, and no spin for non-T pieces.

Gaps: only the T piece's states are checked (not all 28), and only two kick cases. There is no test of the 15-reset lock cap, Tetris/B2B, perfect clear, lock-out or soft-drop rate. The gravity test is a false oracle that asserts the non-Guideline 267 ms.

### Code (8.5), simplicity (7.0), UX (8.0)

- **Code:** Good separation into constants, field, tetromino/SRS, randomizer, game state machine, renderer and input with DAS/ARR. The engine is DOM-free and deterministic under `update(dt)`, strictly typed and well commented. Drawbacks: the comment calls the classic frame table "Guideline gravity", the tests compile into `dist/` and are served, and `npm start` relies on a prior build.
- **Simplicity:** 1,121 source lines in 8 modules. Each is readable, but this is one of the larger implementations.
- **UX:** A single DPR-aware canvas that scales cleanly. At 390 px it is 378×420 with no overflow (document width 390). The panel shows hold, a 5-piece next queue, level/lines/score and an on-screen controls legend, and there are spin/B2B callouts and a clear game-over overlay. No touch controls, and the text is small on a phone.

---

## run-b: weighted 7.80

`9.0×0.40 + 5.5×0.20 + 8.0×0.20 + 9.0×0.10 + 6.0×0.10 = 3.60 + 1.10 + 1.60 + 0.90 + 0.60 = 7.80`

**Summary:** The most compact rules-faithful engine (622 source lines). It has exact Guideline gravity, a 2-row buffer with an immediate one-row drop after spawn, lock-out, mini/full spins, B2B and combos. The presentation is bare, the fixed 580 px canvas overflows a phone, and there is no perfect-clear bonus.

### Findings

| Severity | Finding | Exact reproduction |
|---|---|---|
| Minor | No perfect-clear bonus. | Empty board; fill visible row 19 except columns 3–6 (`board[(19+2)*10+x]`); `game.active = {type:'I', rot:0, x:3, y:20}`; `hardDrop()`. Score +100, not 900. |
| Minor | The layout does not fit 390 px, and the hold panel is cut off and unreachable. | Serve the build and open it in Chromium at 390×844. The renderer forces the canvas to `width: 580px`. Document width is 485, and the canvas box is x = −95, so the 140 px hold column is mostly off-screen to the left (it can't be scrolled to) and the NEXT/score column is clipped on the right. See the mobile screenshot description below. |

Not deducted:
- The lock-reset counter refreshes when the box reaches a new lowest y. That is a reasonable reading of the Guideline; the probe still locks (11.6 s with a rotation every 300 ms).
- A blocked spawn tops out via lock-out one lock delay later rather than instantly; that matches the Guideline's buffer behaviour.
- "Mini T-Spin Single" (129 px at bold 15 px) has 120 px of sidebar space, so its last letter is clipped. This is cosmetic and rare (`probes/measure-text.cjs`).

**Correctness:** 10 − 0.5 − 0.5 = **9.0**.

### Own tests (5.5)

There are 12 tests with a seeded RNG: 4 cells per rotation (not canonical shapes), two complete bags, wall stops, hard-drop points, the ghost matching the landing, a Tetris (only `score >= 800`), level-up/gravity speed-up, a wall kick (only "in bounds"), hold once-per-piece, basic lock delay, an exact T-spin double scoring 1,200 via a real rotation, and top-out plus restart. Gaps: no canonical geometry or kick table checks, no reset cap, no B2B, combo, mini or perfect clear, no soft drop, and gravity is checked only as "faster".

### Code (8.0), simplicity (9.0), UX (6.0)

- **Code:** Small, cohesive modules (pieces, game, renderer, main). Kick tables are stored in Guideline orientation with an explicit y flip, an injectable RNG makes tests deterministic, and the input handling is tidy (DAS/ARR, blur reset). Drawbacks: the server hard-codes port 8321, `Game` mixes queue, scoring and physics in one class, and there is no viewport meta.
- **Simplicity:** 622 lines that implement the full rule set with no needless abstraction. The leanest correct design of the five.
- **UX:** Functional dark canvas with hold, a 5-piece queue, stats, a last-clear label and a game-over overlay with an R hint. There is no on-screen controls legend, no responsive sizing (see the finding) and no touch controls. Visually plain.

---

## run-c: weighted 5.30

`7.5×0.40 + 2.0×0.20 + 3.0×0.20 + 5.0×0.10 + 8.0×0.10 = 3.00 + 0.40 + 0.60 + 0.50 + 0.80 = 5.30`

**Summary:** An attractive, responsive DOM/canvas page on top of a minified 42-line engine. SRS, bag, hold, ghost, lock delay and gravity are mostly right. T-spin scoring is crude: there is no mini, and false spins are awarded after hard drops. The tests are minimal and the code is effectively unreadable.

### Findings

| Severity | Finding | Exact reproduction |
|---|---|---|
| **Major** (grouped scoring) | T-spin scoring is incorrect in common play: no mini classification, false T-spins after a hard drop, and no perfect-clear bonus. | **(1) False spin.** `hardDrop()` never clears `lastRotation`. Empty board; fill column 0 rows 12–19 and row 19 except column 1; `current={kind:'T',x:0,y:5,rotation:0}`; `rotate(1)` in open air; `hardDrop()` falls 12 rows. Expected: single 100 + 24 drop points = 124 with no B2B. Actual: 824 (a T-spin single), with `backToBack=true`. The next Tetris then scores 1,250 instead of 850. **(2) No mini.** Fill row 19 except column 4 and cell (5,17); T `rotation:2` at x=3, y=17; `rotate(1)`; wait out the lock delay. Expected mini single 200; actual 800. With row 19 also open at column 0 (no clear), expected mini 100; actual 400. **(3) Perfect clear.** Row 19 except columns 3–6, I horizontal at (3,18), `hardDrop()`: +100, not 900. |
| Minor | Gravity is capped at one row per frame (16 ms) from level 14. | `tick()` uses `Math.max(16, …)`. With `level = L` and an O at the top of an empty board, measured ms/row from L14 to L20 is 16.67, while the Guideline gives 11.4 / 7.1 / 4.3 / 2.5 / 1.5 / 0.8 / 0.46. Levels 1–13 match. |
| Minor | A lock that is partly above the field ends the game. | There are no hidden buffer rows, and `lock()` sets `over=true` if any cell has y<0. Fill columns 0–2 in rows 1–19; `current={kind:'O',x:-1,y:-1,rotation:0}` (one row visible, one above); `hardDrop()`: `over === true`. Guideline lock-out applies only when the whole piece is above the skyline (runs a, b, d and e continue). |

Not deducted:
- Soft drop is a fixed 50 ms/row from `main.ts`, which is 20× gravity only at level 1. The README only says "slower drop down".
- Left/right rely on the browser's key repeat.
- The page loads Google Fonts from fonts.googleapis.com/gstatic.com. This is not a gameplay defect, but it breaks "dependency-free" offline use; reflected in the code score.

**Correctness:** 10 − 1.5 − 0.5 − 0.5 = **7.5**.

### Own tests (2.0)

`test/smoke.js` is a single minified line with about 10 assertions, under a fixed RNG of 0.5: the first 7 pieces are distinct, one left move, one rotation index, hold and blocked re-hold, a hard drop that leaves cells and a score > 0, and one line clear with score ≥ 100. There is no geometry, kick, lock delay, gravity, T-spin, B2B, combo, top-out or restart coverage, and failures report no context.

### Code (3.0), simplicity (5.0), UX (8.0)

- **Code:** `src/game.ts` (34 lines), `src/main.ts` (8 lines), `index.html`, CSS, server and test are all hand-minified onto single lines. That fails the explicit "simple and readable" requirement.
  - The data tables are correct, and engine/UI are split into two files.
  - The server builds `bundle.js` by string-concatenating two CommonJS outputs with a fake `exports`/`require` shim. It serves every non-CSS file as `text/html` and reads paths relative to the current directory.
  - The page pulls web fonts from Google at runtime.
  - The `r` keydown always calls `preventDefault`, which also blocks the browser's Cmd/Ctrl+R reload.
- **Simplicity:** The logic is tiny (42 source lines) and has no abstraction overhead, but minification makes it hard to follow or change. Small but not simple to work with.
- **UX:** The most designed static layout: hold card, stats card, 3-piece next queue, "How to play" legend, a game-over overlay with a PLAY AGAIN button, and a tidy 390 px layout (board 176×354, no overflow). Weaknesses: the next queue shows only 3 pieces, the legend is hidden on mobile, there are no touch controls, and it depends on external fonts.

---

## run-d: weighted 7.60

`7.5×0.40 + 7.5×0.20 + 8.5×0.20 + 7.0×0.10 + 7.0×0.10 = 3.00 + 1.50 + 1.70 + 0.70 + 0.70 = 7.60`

**Summary:** Well structured, with a 20-row hidden buffer, lock-out, exact Guideline gravity up to level 13, B2B/combo and the broadest own test suite. Its scoring module mishandles zero-line spins, minis and perfect clears and counts air-rotated hard drops as spins. The fixed canvas overflows a phone.

### Findings

| Severity | Finding | Exact reproduction |
|---|---|---|
| **Major** (grouped scoring) | T-spin and perfect-clear scoring are wrong. Each part is reproduced below. | **(1) Zero-line spins score nothing.** `applyScoring` returns early when `cleared === 0`, and `pointsForClear('full', 0)` is 0. Fill row 19 except columns 0 and 4, row 18 except 0/3/4/5, and cell (3,17). Set `current={type:'T',rot:1,x:3,y:37}` (board y = visible + 20); `rotate(1)`; `hardDrop()`. +0, expected 400. A mini with no lines also gives 0, expected 100. **(2) Mini values.** A mini single scores 100, expected 200 (setup as for run-c). Per `scoring.ts` a mini double scores 200, expected 400. **(3) Perfect clear.** `perfectClearBonus` repeats the line value: a single perfect clear scores 200, expected 900. The own test asserts a Tetris PC bonus of 800, where the Guideline gives 2,000. **(4) False spin and B2B.** `hardDrop()` deliberately keeps `lastActionWasRotation` even after falling. Run the air-rotation case from run-c (T rotated at y=5, hard-dropped 12 rows beside a column-0 stack): it is classified as a mini, `backToBack` becomes true, and the following Tetris scores 1,250 instead of 850. |
| Minor | Gravity is capped at one row per frame from level 14. | `gravitySeconds` clamps to 1/60 s. Measured 16.67 ms/row for L14–L20, against the Guideline's 11.4 down to 0.46 ms. Levels 1–13 match within frame rounding. |
| Minor | The playfield is cut off at 390 px. | `index.html` gives the canvas a fixed 480×620 size. At 390×844 the document width is 435 and the canvas box is x = −45. The left 45 px of the board, about 1.5 columns, are off-screen and can't be scrolled to (see the mobile screenshot description). |

Not deducted: R restarts at any time, not only after game over. The README's wording does not forbid it, but an accidental press loses the game; noted under UX.

**Correctness:** 10 − 1.5 − 0.5 − 0.5 = **7.5**.

### Own tests (7.5)

There are 76 checks with seeded mulberry32:
- the bag over 10 batches; spawn rows and columns, and next-queue length; walls; T and I wall kicks with exact x;
- a T-spin double integration test (B2B flag, combo, message); line clear and perfect-clear detection; the scoring table and level formula; gravity at L1/L2 and monotonicity;
- B2B Tetris through the game loop; hold; hard drop; lock delay; soft drop; top-out, freeze after game over and restart;
- renderer smoke via a stubbed context, a 3,000-action random fuzz with invariants, and keyboard mapping through a stubbed `window`, including DAS.

Gaps and false oracles:
- The TSD test sets `lastActionWasRotation = true` by hand instead of rotating.
- `perfectClearBonus(4) === 800` and the mini values encode the wrong rules.
- There are no zero-line spin, reset-cap, lock-out or high-level gravity tests.

### Code (8.5), simplicity (7.0), UX (7.0)

- **Code:** Clean module boundaries: constants, pieces/kicks, board, randomizer and RNG, scoring, game, input with DAS/ARR, renderer and entry point. Types are strict, the RNG is injected, and the static server honours `PORT`. Drawbacks: rules errors are concentrated in `scoring.ts`, the code comment justifies the hard-drop spin behaviour incorrectly, and the `ROW_LIMIT` constant is declared below its first use.
- **Simplicity:** 1,052 source lines across 10 files. Readable, but more pieces than needed.
- **UX:** A neat canvas with hold (dimmed after use), a 5-piece queue, stats, combo/B2B indicators, centred clear banners and an HTML key legend. The fixed-size canvas does not adapt to phones (see the finding), there are no touch controls, and the R-anytime restart is risky.

---

## run-e: weighted 6.55

`7.0×0.40 + 3.5×0.20 + 7.5×0.20 + 7.0×0.10 + 8.5×0.10 = 2.80 + 0.70 + 1.50 + 0.70 + 0.85 = 6.55`

**Summary:** The most polished, responsive UI, with touch controls, pause and DPR-aware canvases. The engine follows SRS, Guideline gravity up to level 13 and the lock rules. However, T-spins finished with a hard drop are never scored, there is no perfect-clear bonus, each new piece is invisible for its first second, and lock-out is missing.

### Findings

| Severity | Finding | Exact reproduction |
|---|---|---|
| **Major** (grouped scoring) | T-spins locked by hard drop are not recognised, there is no perfect-clear bonus, and mini double is 200. | **(1) Hard-dropped spins.** `hardDrop()` sets `lastActionWasRotation = false` unconditionally, even for a zero-distance drop. Fill row 19 except column 4, row 18 except 3/4/5, and cell (3,17). Set `active={type:'T',rotation:1,x:3,y:21}` (board y = visible + 4); `rotate(1)`; `hardDrop()`. Score +300 (a plain double); expected 1,200. The same setup locked by waiting 700 ms scores 1,200. A T-spin single by hard drop gives 100 instead of 800, and a zero-line T-spin gives 0 instead of 400. Hard drop is the normal way to finish a spin. **(2) Perfect clear.** A single perfect clear scores +100, expected 900. **(3) Mini double.** `applyScoring` scores any mini clear as 200, so a mini double is 200 instead of 400. |
| Minor | New pieces spawn invisibly in the hidden rows and only appear after gravity moves them. | `spawn()` places the box at board y=2 with `HIDDEN_ROWS = 4`, and there is no immediate one-row drop. At level 1 the first cell becomes visible after 1,017 ms and the whole piece after 2,017 ms (`extra-probe`). In Chromium the start screenshot, taken 0.8 s after load, shows only the ghost outline and no active piece. |
| Minor | No lock-out when a piece locks entirely above the visible field. | Fill columns 0–2 in all 20 visible rows; `active={type:'O',rotation:0,x:-1,y:2}` (wholly in the buffer); `hardDrop()`. `status` stays `"playing"`, the next piece spawns, and 4 invisible cells remain in the buffer. Only cells at y<0 trigger game over. |
| Minor | Gravity is capped at 16.67 ms/row from level 14. | `gravityInterval` uses `Math.max(16.67, …)`. Measured 17.6 ms/row for L14–L20 against the Guideline's 11.4 down to 0.46 ms. Levels 1–13 match. |

Not deducted: left/right/down share one auto-repeat slot in `main.ts`, so releasing Down stops a held Left/Right repeat. Soft drop is a fixed 45 ms repeat after a 140 ms delay.

**Correctness:** 10 − 1.5 − 0.5 − 0.5 − 0.5 = **7.0**.

### Own tests (3.5)

There are 6 tests: the first 7 pieces form a bag, wall bounds, hard drop points plus hold once-per-piece, a line clear (only `score >= 100`), one wall kick (only in bounds), and blocked-spawn top-out. Gaps: no rotation geometry, lock delay, gravity, T-spin, B2B, combo, restart or pause coverage. The suite would not have caught the T-spin defect.

### Code (7.5), simplicity (7.0), UX (8.5)

- **Code:**
  - Strong TypeScript settings (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) and a pure engine class with an injected RNG and a read-only snapshot for rendering.
  - A small build script copies static assets to `dist`, and the server is safe.
  - Weaknesses: `game.ts` mixes shapes, kicks, queue, scoring and physics in one class. `main.ts` (310 lines) mixes rendering, DOM updates, keyboard and touch input. The input repeat model is simplistic, and the port is hard-coded.
- **Simplicity:** 718 TypeScript lines plus 307 lines of CSS and a 95-line HTML shell. Reasonably direct, with no needless abstraction.
- **UX:** The best-presented game:
  - a responsive three-column layout that keeps hold, stats and the 5-piece queue visible at 390 px (board 228×456, no overflow);
  - on-screen touch controls, pause/resume (P, button, auto-pause on blur), an accessible status line and a game-over overlay with "Play again".
  - Downsides beyond the deducted invisible spawn: the controls legend omits hold, pause and restart (the hold panel shows a C badge), and the mobile status text is hidden.

---

## Browser evidence

| Run | Server | 1280×800 | 390×844 document width | Key flow | Console/page errors |
|---|---|---|---|---|---|
| run-a | `PORT=41321 npm start` | canvas 598×664, centred | 390 (canvas scales to 378×420) | all keys change the board; game over → R restarts | none |
| run-b | `npm start`, port line → 41322 | canvas 580×600 | **485**, canvas x = −95 (hold cut off) | all keys respond; game over → R restarts | none |
| run-c | `npm start`, listen → 41323 | board 300×600 plus DOM panels | 390 (board 176×354) | all keys respond; score 0→6 on soft drop, 26 after hard drop; game over → R resets score to 0 | none (3 external Google Fonts requests) |
| run-d | `PORT=41324 npm start` | canvas 480×620 | **435**, canvas x = −45 (board cut off) | all keys respond; game over → R restarts | none |
| run-e | `npm start`, listen → 41325 | board 329×657 plus side rails | 390 (board 228×456, touch bar visible) | all keys respond. On desktop the first piece was an O, so the rotation keys caused no visible change; on mobile all keys visibly changed the board. The start screenshot shows only the ghost (hidden spawn). Game over → R resets | none |

Screenshots were inspected for every run at both sizes, then deleted with the temporary directory.

## Limitations

- This is a focused conformance audit, not a proof over all game states or a long playtest.
- The engine probes set state through public fields of the compiled modules; implementation code was not altered.
- Chromium only, keyboard input only. Touch buttons were inspected but not tapped.
- T-spin triple, mini double and 180° rotation edge cases were reviewed in source, not probed.

## Workspace and hygiene

- Probe scripts are in `probes/`: `adapters.mjs`, `engine-probe.mjs`, `extra-probe.mjs`, `browser-probe.cjs` and `measure-text.cjs`.
- Run the engine probes with `node probes/engine-probe.mjs <a|b|c|d|e> <built copy>`.
- Run the browser probe with `NODE_PATH=<playwright node_modules> node probes/browser-probe.cjs <url> <shotDir> <label>`.
- Nothing under `runs/`, `calibration/`, `TETRIS.md` or `RUBRIC.md` was modified. All temporary copies, servers and browsers were removed or stopped.
