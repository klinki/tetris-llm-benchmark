# Blind Opus 5.5 (high) audit, round 1 — original report

Key, revealed after scoring: **run-a** = `gpt-6.1-terra-max`, **run-b** = `claude-opus-5-5-xhigh`, **run-c** = `gemini-4-argon-contributor-high`. The report below is unedited.

# Blind audit: run-a, run-b, run-c

Audit date: 2026-10-27. Rubric: `RUBRIC.md` (40/20/20/10/10). Correctness starts at 10:
critical −4 (cap 4), major −1.5, minor −0.5. Each defect is deducted once, from correctness only.
Test scores reflect each implementation's own tests only.

## Summary

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| run-a | 9.0 | 8.0 | 8.5 | 9.0 | 9.5 | **8.75** | 2 minor |
| run-b | 9.0 | 8.0 | 9.0 | 9.0 | 7.5 | **8.65** | 2 minor |
| run-c | 7.5 | 6.5 | 7.5 | 6.5 | 7.5 | **7.20** | 5 minor |

Arithmetic (`0.40C + 0.20T + 0.20Code + 0.10S + 0.10UX`):

- run-a: `3.60 + 1.60 + 1.70 + 0.90 + 0.95 = 8.75`
- run-b: `3.60 + 1.60 + 1.80 + 0.90 + 0.75 = 8.65`
- run-c: `3.00 + 1.30 + 1.50 + 0.65 + 0.75 = 7.20`

## Procedure

1. I read `TETRIS.md`, `RUBRIC.md` and both calibration audits. Then I reviewed every delivered
   source file, test, HTML/CSS file, package/lockfile, tsconfig and server in all three runs.
2. Each run was copied, without `node_modules`/`dist`, into one random disposable temp directory
   (`mktemp -d /tmp/blindaudit.XXXXXX`). In each copy I ran `npm ci`, `npm run build` and the
   unchanged `npm test`. All passed: run-a **10/10** (`node --test`), run-b **16/16**, run-c **11/11**.
3. Engine probes ([`probes/engine-probe.mjs`](probes/engine-probe.mjs) and
   [`probes/supplemental-probe.mjs`](probes/supplemental-probe.mjs), with adapters in
   [`probes/adapters.mjs`](probes/adapters.mjs)) load each run's freshly built `dist` modules. They
   use one normalized coordinate system: column x, visible row y = 0..19, and the canonical SRS
   bounding-box origin. Fixture setup writes board cells or the active piece directly; every
   outcome comes from the engine's own actions. Coverage:
   - **SRS:** all 28 piece/orientation states against canonical SRS, allowing a fixed origin
     translation. Every CW/CCW transition and kick test index for JLSTZ and I was checked
     black-box: earlier tests were obstructed and the resulting offset compared, 236
     constructible cases per run.
   - **Randomizer and hold:** ten seeded actual-engine bags and preview consistency, spawn
     positions, hold, its once-per-lock restriction and orientation reset, and an obstructed ghost.
   - **Lock delay:** the 500 ms grounded boundary, the 15-reset cap, and the ledge/new-lowest-row
     behaviour.
   - **Gravity:** levels 1/2/3/5/10, plus rows per 16 ms at levels 15 and 20.
   - **Scoring:** normal 1–4 lines, full and mini T-spins (zero/single, via both hard drop and
     timed lock), B2B through a no-clear lock, a level-2 combo, a perfect clear, and T-spin
     credit after the piece travels.
   - **Top-out and restart:** blocked spawn, whole-piece lock-out, partial lock above the field,
     and restart.
4. Servers were started with each run's own `npm start` on free ports (run-a 42270, run-b 43517,
   run-c 46833). run-b and run-c honour `PORT`. run-a hard-codes 8321, so only the listen line
   of the **temporary** copy was changed to `Number(process.env.PORT) || 8321`.
   [`probes/browser-probe.cjs`](probes/browser-probe.cjs) and
   [`probes/browser-keys-after-drop.cjs`](probes/browser-keys-after-drop.cjs) drove Playwright
   Chromium 156.0.8078.4 at 1280×800 and 390×844 (DPR 1). They pressed real keys (Left, Right,
   Up, X, Z, Left Control, Down, Space, C, R) and read active cells from the board canvas pixels.
   They also measured layout, saved screenshots (all inspected), and collected console errors,
   page errors and HTTP ≥400 responses. **No errors of any kind occurred in any run.**

Probe outcomes common to all three runs (no finding):

- All 28 SRS states match.
- 236/236 kick cases match.
- Seeded bags are permutations, and the preview equals the dealt order.
- Hold works once per lock and returns the piece in spawn orientation.
- Ghost is 9 for the obstructed fixture (expected 9).
- Grounded lock fires at 500 ms (run-b 499 + the landing tick).
- Gravity takes 1000/793/618/356/65 ms at levels 1/2/3/5/10.
- Scoring:
  - Normal clears score 100/300/500/800.
  - Full T-spins score 400/800 and minis 100/200, via both hard drop and timed lock.
  - Two Tetrises with a no-clear lock between total 2000.
  - A level-2 combo single scores 300.
- A whole piece locked above the field ends the game.
- Restart clears score, lines, level and hold.

---

## run-a: 8.75

**Summary:** the most complete rules engine, including perfect clears, with a polished, responsive
UI that has touch controls. It has two minor rules deviations: T-spins are credited after the
piece falls, and the reset allowance is not restored on reaching a new lowest row.

Scores: correctness **9.0**, tests **8.0**, code **8.5**, simplicity **9.0**, UX **9.5**.

### Findings

1. **Minor: a T-spin is credited even when the T moved down after its last rotation (−0.5).**
   `lastRotation` is cleared by `move` and `softDrop` but not by gravity or by a travelling
   `hardDrop`. The 3-corner rule (tetris.wiki T-Spin) requires the last maneuver to be the
   rotation.
   - Board cells `(2,17)`, `(2,19)`, `(0,19)`, `(9,19)`. Active T rotation 0 at box `(0,5)`.
   - **Hard drop:** press Z (CCW) to reach rotation 3 in the air, then hard drop 12 rows. Score
     gains **124** (24 drop + 100 "T-SPIN MINI"); expected **24**.
   - **Gravity:** start the same T at box `(0,16)`, press Z, and let gravity drop it one row and
     lock. Score gains **100**; expected 0.
   - run-b and run-c give 24 and 0.
   - Correctness 10.0 → 9.5.
2. **Minor: no new-lowest-row reset of the lock timer or reset allowance (−0.5).**
   - Fill the bottom row at columns 0–5. Gravity lands the spawned O on that ledge at
     `(3,17)`. Make 16 alternating Left/Right moves, wait 450 ms grounded, then press
     Right, Right.
   - The O falls one row after 1000 ms and **locks 50 ms after reaching the floor**.
     `lockElapsed` (450) carries over and the exhausted `lockResets` are never restored.
     Extended placement restores both on a new lowest row; run-b locks after 499 ms and run-c
     after 500 ms in the same fixture.
   - Correctness 9.5 → 9.0.

Two behaviours were checked and not counted as defects:

- **Top-out is slightly strict.** A blocked spawn ends the game when visible row 0 is occupied
  at the spawn columns; with only row 1 occupied, play continues. Spawn sits at the Guideline's
  post-drop position (rows −1/0).
- **Partial locks above the field are kept.** Cells locked above row 0 stay in the 20-row buffer
  (the reachable I fifth-kick fixture keeps rows −3..0).

### Own tests: 8.0

There are **10 `node:test` cases (163 lines)** against the built engine. They cover:

- three seeded bags;
- a concrete T and I wall kick, and O rotation invariance;
- hold restriction, post-lock retrieval, and spawn orientation/column;
- obstructed-free ghost, soft-drop and hard-drop points, and the welded cell;
- the exact 499/500 ms lock, a 15-reset cap with timer continuation, and lock timing after a
  gravity landing;
- Tetris, B2B Tetris + combo, and a B2B perfect-clear Tetris at the pre-clear level with the
  level-up;
- legal full and mini T-spins after a real rotation;
- block-out via hold and whole-piece lock-out;
- pause and restart.

Not covered:

- gravity speeds and the level curve;
- single/double/triple values;
- a full 28-state or kick-table oracle;
- new-lowest-row behaviour;
- T-spin after movement;
- input and browser behaviour.

The suite is broad and deterministic, comparable to the strongest calibration suites.

### Code 8.5 / simplicity 9.0

- **Size:** 550 source lines in two files. `game.ts` (307) is a DOM-free engine with
  injectable randomness; `main.ts` (243) holds rendering, HUD caching, keyboard DAS/ARR,
  pointer repeat, pause on visibility change, and the frame loop.
- **Engine:** compact, readable rules. Kick tables are declared once, rotation is derived from
  spawn cells, and award logic is centralised.
- **Costs:**
  - Public mutable state (`board`, `active`, `queue`) is used by the tests.
  - `main.ts` mixes several concerns in one module with many module-level variables.
  - The server hard-codes its port.
- Very small for its feature set, which gives simplicity 9.0.

### Browser UX: 9.5

- **Desktop:** a polished, labelled layout with hold (dimmed when unavailable), score, personal
  best, level, lines with a progress bar, a 5-piece next queue, and a full controls legend. It
  adds outline ghost, clear/B2B/perfect-clear messages, a pause button with P/Esc, and an
  accessible game-over overlay with a "Play again" button.
- **Phone, 390×844:** the document is exactly 390 px wide. The board is 208×417 at x=91, with
  compact hold/next columns, mobile stats and seven 44 px touch buttons with their own repeat.
- **Keys:** all required keys behaved correctly in Chromium. OS auto-repeat events are ignored
  in favour of custom DAS/ARR, and R works only after game over.
- **Minor costs:** at 1280×800 the page is 848 px tall (footer below the fold). The canvases
  are not DPR-scaled.

---

## run-b: 8.65

**Summary:** a clean, modular, Guideline-faithful engine (spawn drop, extended placement,
lock-out vs block-out), with no perfect-clear bonus and a fixed-width layout that breaks on phones.

Scores: correctness **9.0**, tests **8.0**, code **9.0**, simplicity **9.0**, UX **7.5**.

### Findings

1. **Minor: no perfect-clear bonus (−0.5).**
   - Place a horizontal I at box `(3,18)` (cells `(3..6,19)`). Fill the bottom row outside
     columns 3–6.
   - A zero-travel hard drop clears the row and leaves the board empty, but the score gains
     **100**; the benchmark convention expects **900**.
   - Correctness 10.0 → 9.5.
2. **Minor: the phone layout overflows and cuts off the playfield (−0.5).**
   - At 390×844 the document is **684 px** wide.
   - The board canvas is 300×600 at **x=192**, so its right 102 px (≈3.4 columns) start off-screen.
   - The next queue is at x=527 and the controls legend is also off-screen.
   - `.game` is a fixed-width flex row with no responsive rule.
   - Correctness 9.5 → 9.0.

Checked and conforming:

- **Spawn:** pieces spawn in the hidden rows and immediately drop one row.
- **Block-out vs lock-out:** with visible rows 0–1 blocked, the piece stays in the buffer and
  the next lock ends the game by lock-out. That is Guideline-correct.
- **Lock resets:** the 15th grounded reset locks at once, and the new-lowest-row allowance is
  restored (the ledge fixture locks 499 ms after reaching the floor).
- **Soft drop:** 20× gravity with 1 point per row.
- **T-spin credit:** cleared by any drop movement.

### Own tests: 8.0

There are **16 cases (219 lines)**, all deterministic, using a scripted `PieceSource` and a
mulberry32 RNG. They cover:

- 20 seeded bags and preview equality;
- partial SRS states (I R/L, T R/2, O);
- spawn position with the one-row drop;
- T and I kicks;
- exact soft-drop speed and points;
- hard-drop points and the welded cell;
- 500 ms lock with a reset, and the 15-reset cap;
- hold restriction and post-lock swap;
- Tetris + B2B + combo with labels;
- level-up at 10 lines;
- a legal T-spin double;
- exact gravity-curve values (L1/L2/L15);
- lock-out and block-out.

Not covered:

- mini T-spins;
- single/double/triple values;
- perfect clear;
- ghost geometry;
- new-lowest-row reset;
- restart, pause, input and browser behaviour.

Breadth is similar to run-a: fewer scoring integrations, but more timing/gravity exactness.

### Code 9.0 / simplicity 9.0

- **Size:** 794 source lines in eight small, focused modules: board, pieces (rotations derived
  from ASCII spawn shapes, kick tables converted from the wiki's y-up notation), scoring,
  randomizer, game, input (DAS 170 / ARR 50 with last-pressed-wins), renderer (DPR-scaled,
  revision-gated redraws) and bootstrap.
- **Engine:** an injectable `PieceSource`, very strict compiler flags, readonly piece objects
  and clear documentation comments.
- **Costs:** the active piece and level are publicly mutable, and restart is done by replacing
  the `Game` object in `main.ts`.

### Browser UX: 7.5

- **Desktop:** clean and legible, with high-DPI blocks and grid, outline ghost, a grey hold
  preview after use, a 5-piece queue, a complete controls legend, a pause overlay with P/Esc,
  auto-pause on blur, and animated action labels (B2B, combo, points).
- **Keys:** all required keys worked in Chromium (rotations verified on a J after the opening
  O). R works only after game over, and repeat keydowns are ignored.
- **Gaps:**
  - no responsive layout at all (charged once above);
  - no touch controls;
  - no canvas labels, aria-live only on the action box;
  - an empty hold box shows no placeholder.

---

## run-c: 7.20

**Summary:** correct SRS and scoring for lines and T-spins. However, it has no hidden buffer,
no perfect-clear bonus, a gravity floor at high levels, unfiltered key auto-repeat and phone
clipping, and its engine is verbose and mixes in key handling.

Scores: correctness **7.5**, tests **6.5**, code **7.5**, simplicity **6.5**, UX **7.5**.

### Findings

1. **Minor: no perfect-clear bonus (−0.5).**
   - Use the same fixture as run-b: horizontal I at `(3,18)`, bottom row filled outside
     columns 3–6, zero-travel hard drop.
   - The board is empty, but the score gains **100**; expected **900**.
   - Correctness 10.0 → 9.5.
2. **Minor: no hidden buffer storage, so spawn is one row low and cells above the field
   disappear (−0.5).**
   - The board has only 20 rows, and the active piece spawns at box y=0 (cells in visible rows
     0–1; run-a and run-b use rows −1/0).
   - **(a) Premature top-out:** fill only `(3..6,1)` and lock any piece elsewhere. The next
     spawn sets `gameOver=true`, while run-a and run-b keep playing.
   - **(b) Vanishing cells:** from the real I spawn `(3,0)`, add blockers `(3,2)`, `(5,2)`,
     `(6,2)`. Press Up: the fifth kick puts the I at `(4,−2)` with cells in column 6, rows −2..1.
     A hard drop continues the game, but only rows 0–1 are stored. `lockPiece` silently drops
     the two cells above row 0, where run-a and run-b keep them.
   - Both share one root cause and are deducted once.
   - Correctness 9.5 → 9.0.
3. **Minor: a 10 ms gravity floor slows levels 15 and above (−0.5).**
   - `getGravityIntervalMs` returns `max(10, …)`.
   - Set level 20 and put an O at `(3,2)` on an empty board. `tick(16)` moves it **1** row;
     run-a and run-b move it 16 rows (to the floor, 20G).
   - At level 15 it moves 1 row per 16 ms versus 2.
   - Correctness 9.0 → 8.5.
4. **Minor: OS key auto-repeat is not filtered, so holding Space hard-drops piece after
   piece (−0.5).**
   - `InputController` has no `event.repeat` check or keyup handling.
   - In Chromium, one Space press scored 36. Three further `keydown` events with `repeat:true`
     (what the OS sends while Space is held) raised the score to **122**, hard-dropping three
     more pieces.
   - run-a and run-b stayed at 38.
   - Held rotation keys likewise keep rotating.
   - Correctness 8.5 → 8.0.
5. **Minor: phone layout clips the side panels (−0.5).**
   - At 390×844 the document is **543 px** wide.
   - The hold canvas is at **x=−128** and the score at **x=−140**. This negative overflow cannot
     be scrolled to, so hold, score, level and lines are unreachable.
   - The next queue starts at x=388, and the controls are off-screen right.
   - The board (300×600 at x=35) fits.
   - Correctness 8.0 → 7.5.

Checked and conforming:

- 28 states, kicks, bag, hold and ghost;
- 500 ms lock, 15-reset cap with timer continuation, and new-lowest-row reset (500 ms after
  the floor);
- full/mini/B2B/combo scoring at the pre-clear level;
- lock-out and restart.

### Own tests: 6.5

There are **11 cases (298 lines, custom assert)**. They cover:

- distinct colours;
- 10 **unseeded** bags;
- seeded queue preview;
- wall bounds;
- the ghost row;
- soft-drop and hard-drop points;
- hold restriction and swap;
- the rotation cycle plus one T and one I wall kick;
- 400/500 ms lock with **one** reset (the 15 cap is only asserted as a constant);
- Tetris → B2B Tetris + combo (via a direct `lockPiece()` call);
- gravity at L1 = 1000 ms, with only monotonicity for L5/L10;
- **unseeded** top-out via repeated hard drops, then R restart.

Not covered:

- T-spins of any kind, and mini;
- single/double/triple values;
- perfect clear;
- reset-cap behaviour;
- level progression;
- lock-out;
- most of the 28 states;
- input and browser behaviour.

The runner stops at the first failure.

### Code 7.5 / simplicity 6.5

- **Size:** 1,892 source lines (plus the 298-line test) in nine modules.
- **Data:** all 28 states are hand-written (394-line `tetrominoes.ts`); the explicit tables are
  correct but verbose.
- **`game.ts` is 751 lines:**
  - duplicated `moveLeft`/`moveRight` bodies;
  - several alias methods (`restart`, `update`, `rotateAntiClockwise`, `rotateClockwise`);
  - a large inline `LockResult` literal;
  - `handleKey()` key-string matching inside the engine, which couples input to the rules
    model.
- **Renderer:** draws everything every frame without a dirty check.
- **Other:** a `paused` state exists with no way to set it. `window.game` is exposed globally.
- **Positives:** strict typing, a separate bag and board, and readable comments.

### Browser UX: 7.5

- **Desktop:** attractive, with Guideline colours, bevelled blocks, a grid and outline ghost,
  a dimmed hold, a 5-piece queue, a controls legend, action/combo text, and a clear game-over
  card with a Restart button.
- **Keys:** all required keys work in Chromium.
- **Gaps:**
  - movement and soft drop rely on OS key repeat (no DAS/ARR, so soft drop pauses after the
    first row until OS repeat starts);
  - no pause;
  - R restarts **mid-game** with no confirmation (the task specifies restart after game over);
  - no touch controls, and the canvases are not DPR-scaled.
- Phone clipping is charged once, above.

---

## Limitations

- This is a focused conformance audit, not exhaustive state-space coverage or a long playtest.
- Browser checks used Chromium only, with synthetic `repeat:true` events standing in for
  physical key auto-repeat. Physical touch devices were not used.
- Perfect-clear scoring follows the benchmark convention used in the calibration audits
  (single PC = 900). The T-spin "last maneuver" rule follows tetris.wiki's T-Spin page.
- The run-a server's port line was edited only in the temporary copy so it could use a free port.
