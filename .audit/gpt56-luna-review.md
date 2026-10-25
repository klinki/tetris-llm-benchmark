# GPT-5.6 Luna audits (low, medium, high, xhigh, max)

Audit date: **2026-10-25 (Europe/Rome)**. Five independent `gpt-5.6-luna`
runs in **T3 Code / Codex, standard service tier**, implementing
[`TETRIS.md`](../TETRIS.md) from the single prompt “Read the README.md file
and implement it”. Run IDs: `gpt-5.6-luna-{low,medium,high,xhigh,max}`.
This record supports [`ranking.json`](../ranking.json) and
[`RANKING.md`](../RANKING.md). Historical `luna-codex`, `luna-omp` and
`luna-pi` retain **7.60/8.60/8.45**. Site replacement follows the existing
registry policy; the historical runs stay in the repository.

## Method and delivery

Re-read the rubric, weights, Methodology and conformance/coverage tables,
task, predecessor [common probes](common-audit.mjs) and
[Luna PI review](luna-pi-review.md), and recent [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md), [GLM](glm-review.md),
[DeepSeek V4.1](deepseek-v41-review.md) and [GPT-6 Luna](gpt6-luna-review.md)
records and their engine/browser/temporary-copy workflows. Reviewed all
complete sources, own tests, HTML/CSS, configs, packages/locks, servers and
supplied statistics against the same task.

Same **0–10 half-point scale**, weights **40/20/20/10/10**; correctness
starts at 10, critical −4/cap 4, major −1.5, minor −0.5, clamped at zero.
Related scoring errors are grouped consistently with earlier audits;
isolated mini/PC/stale-manual-spin errors retain minor severity. A bug is
charged once to correctness. Own-test omissions determine tests; added
audit probes earn no own-test credit. Tokens, cost, time, effort labels
and supplied isolation facts have no quality effect.

All installs/builds/tests/servers used random disposable temporary copies,
excluding dependencies/generated output/.git. **Node 26.0.0**, locked cached
TypeScript and installed Chromium were used. Only low/medium’s hard-coded
temporary server port literals changed; routes/MIME/application logic were
preserved. All servers used free ports **41000–49999**. Work stayed on
`main`, with no commit/stash/reset/revert. Original implementations, registry,
pricing, repository scripts/tests and site source were not edited. No build
output or dependencies were placed in original run folders. Named browsers,
initial T3 status/open tab, server groups and temporary copies/artifacts were
closed/deleted after review. Parent owns the commit.

| Effort | Isolated install | Build | Declared own test workflow | Delivered Chromium game |
|---|---|---|---|---|
| low | Pass | Pass | Smoke script passes | Starts |
| medium | Pass | Pass | All 5 cases pass | **Does not start: CSS module MIME failure** |
| high | Pass | Pass | Assertion script passes | Starts |
| xhigh | Pass | Pass | Smoke script passes | Starts |
| max | Pass | Pass | Smoke script passes | Starts, erroneous visible overlay |

Install is `npm ci --ignore-scripts --offline`; build is `npm run build`
and own workflow is unchanged `npm test`. Low’s CommonJS test successfully
requires emitted ES modules under this Node version; other Node versions
were not certified. Own rule fixtures use fixed callbacks/sequences;
xhigh’s real unseeded bag assertion checks an order-independent invariant.
No seed-dependent own-test failure was found. Four uncounted assertion
scripts cannot be compared by printed case count.

Medium’s exact supplied server starts and serves its build. `main.js`
retains `import "./style.css"` without a bundler or CSS import attribute.
Chromium rejects it: **“Expected a JavaScript-or-Wasm module script but the
server responded with a MIME type of text/css.”** The module graph never
evaluates: board/previews remain blank, score zero, keys and Restart inert.
Passing build/headless tests do not establish a working browser delivery.
Direct import of unchanged emitted `game.js` permits **diagnostic** engine
probes only. No transpilation, source repair, MIME workaround or substitute
static server was used. This applies Nemotron/GPT-6 medium’s critical cap,
then independently confirmed source findings. UX 6.5 is static-only.

## Scores and rationale

| Effort | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 1.5 | 3.0 | 7.0 | 8.5 | 8.0 | **4.25** | 4 major, 5 minor |
| medium | 0.0 | 5.0 | 8.5 | 8.5 | 6.5 | **4.20** | 1 critical, 2 major, 2 minor |
| high | 5.5 | 5.0 | 9.0 | 8.5 | 8.5 | **6.70** | 2 major, 3 minor |
| xhigh | 7.5 | 4.5 | 9.0 | 8.5 | 8.5 | **7.40** | 5 minor |
| max | 5.5 | 5.0 | 9.0 | 8.0 | 8.5 | **6.65** | 2 major, 3 minor |

Low: `10 − 4×1.5 − 5×0.5 = 1.5` correctness. Medium reaches cap 4, then
loses two majors/two minors, reaching zero. High/max each lose two majors
and three minors, reaching 5.5. Xhigh loses five minors, reaching 7.5.
Weighted totals: **4.25/4.20/6.70/7.40/6.65**.

High’s false spin without rotation, B2B-multiplied combo, mini and PC gaps
form one grouped major scoring finding. Xhigh’s otherwise correct full-spin,
B2B/combo integration has isolated mini, PC and manual-down-history errors,
scored minor as in GLM high/GPT-6 max. Different SRS/kick policies and
ordinary gravity curves retain major severity, including max’s later-level
divergence. Fast terminal floors alone are accepted. Contact/reset policy,
hidden lock-out, post-game input mutation, soft transition and presentation
are minor. Low’s post-game mutation does not make R restart unusable;
it is not inflated into a major core-game corruption. Its independent
remainder loss follows GPT-6 high’s minor refresh treatment.

### Low — 4.25

Summary: **Non-SRS rotations, broken hold, basic scoring and wrong timing; phone state clips**.

Tests **3.0**: its two-line smoke script checks initial active/queue and a truthy held piece. The only score assertion rejects a negative score and never establishes an award. There are no complete bag, wall, rotation/kick, exact drop points/cells, restricted/post-lock hold, ghost, line/advanced score, timing/cap/ledge, gravity/levels, top-out/restart or browser assertions. This is narrower than the 3.5–5.5 smoke suites; audit probes earn no own-test credit.

Code **7.0**, simplicity **8.5**: **37 source TS lines**, strict types, a DOM-free engine, injected RNG, direct methods and no runtime dependencies. Extremely long compressed methods, shape literals and the draw/input module impede maintenance. UX **8.0**: readable colored board/grid/ghost, hold/stats, three previews and a complete keyboard legend; native repeat, no high-DPI adaptation, focus cleanup or touch UI. Confirmed defects are charged only to correctness.

Confirmed findings, in deduction order:

1. **Major: Rotation states and kicks do not implement SRS.** The full oracle fails I0/I1/I2/I3/J1/L1/S1/S2/T1/Z1/Z2, after allowing a fixed O-origin translation. I spawns vertically and I/S/Z have only two reused states. All 48 non-O ordered kick transitions differ from SRS: rotate uses the same six generic offsets in both directions instead of the JLSTZ/I tables. These related geometry/kick defects are one major finding.

2. **Major: Hold duplicates the active or previously held piece instead of swapping.** Seed 42 deals active Z and next S. C stores Z but respawns Z, leaves S queued and immediately restores canHold=true. A second C again respawns Z; after locking, C replaces the next active piece with Z without storing the outgoing type. The public hold probe and real browser keys reproduce it.

3. **Major: Advanced scoring is absent and gravity/level-crossing points are wrong.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises with a no-clear lock between total 1600 instead of 2000; level-two combo single is 200 instead of 300; single perfect clear is 100 instead of 900. Automatic gravity awards one point per row; crossing nine to ten lines scores the single at the new level, 200 instead of 100. These related scoring errors are grouped once.

4. **Major: Gravity uses a different linear progression.** Actual first-row boundaries at levels 1/2/5/10 are 800/735/540/215 ms instead of 1000/793/about 355.197/64.152 ms. tick uses max(80,800-level*65), with internal levels starting at zero, rather than the benchmark Guideline curve.

5. **Minor: Gravity remainder loss makes falling depend on refresh rate.** At logical level two, unchanged engine updates and the actual browser frame callback move O one row at 60 Hz but two at 144 Hz over the same 1480.001 ms. tick resets dropTimer to zero on every fall instead of retaining the remainder. This timing defect is separate from the wrong gravity curve.

6. **Minor: Lock timing bypasses the delay and has no action-reset cap.** Grounded softDrop locks immediately. An O waits 490 ms on the floor, moves, then locks after only another 310 ms when automatic softDrop fails. Thirty successful alternating moves at 10 ms intervals still postpone locking beyond 799 ms, whereas the fifteen-reset cap locks by then. Ordinary 499/500 ms and ledge mid-air safety pass; these related lock-policy failures form one minor finding.

7. **Minor: A wholly hidden legal lock does not end the game.** From the real T spawn, add only stack (6,2), move right once, and hard-drop zero rows. All T cells are in hidden rows 0–1 at x=5..7; the incoming vertical I at x=3 is independently open and does not overlap the locked T. gameOver remains false.

8. **Minor: Drop controls mutate the board after game over.** Block the next T spawn with (5,0), then hard-drop a floor O. gameOver becomes true, but a further hardDrop writes the blocked active T into the board and spawns again. The before/after game-over snapshot changes; movement/rotation are guarded but hardDrop/softDrop/lock are not.

9. **Minor: The fixed-width phone page clips supporting state.** At 390×844, document width is 466 px. The 300×600 board starts at x=0 and fits, but hold/next canvases start at x=332 and extend to 452; scores and previews are partly off-screen. The page has a fixed 460 px main and no phone reflow.

### Medium — 4.20

Summary: **Build/tests pass, but a CSS module import prevents browser startup; source scoring and gravity fail**.

Tests **5.0**: all **5 own cases pass**, covering one fixed-random seven-bag, real movement/rotation number and four hard-locked cells, a full-row helper, first/restricted/post-lock hold availability and left-wall bounds. The test named score lines advance asserts neither score nor lines. No exact geometry/kick, drop score, independent ghost, integrated line/advanced scoring, timing/cap/ledge, precise gravity/levels, top-out/restart or browser assertion exists. The headless tests never load its failing browser entry.

Code **8.5**, simplicity **8.5**: **100 source TS lines**, strict/noUncheckedIndexedAccess, separated geometry/bag/headless rules and browser entry, direct helpers and no JS runtime dependencies. Long compressed methods and public mutable state need caller discipline. UX **6.5** assesses only the readable static HTML/CSS, consistently with Nemotron and GPT-6 Luna medium; there is no delivered playable browser experience.

Confirmed findings, in deduction order:

1. **Critical: The browser module graph cannot start the game.** Fresh npm ci, npm run build and all five own tests pass, and npm start serves the page. Emitted main.js retains import "./style.css" without a CSS import attribute or bundler. Chromium rejects it: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/css". Module evaluation never constructs the game; the board stays blank and every key/restart button is inert at both widths. No browser delivery repair was made; headless probes are diagnostic only.

2. **Major: Advanced scoring is absent, hard drop is underpaid and gravity awards points.** Diagnostic headless full/mini zero/single fixtures score 0/100, B2B Tetrises total 1600, level-two combo single 200 and single PC 100. Hard drop calls softDrop per row and awards one point per cell instead of two; automatic tick also calls softDrop and awards one point for each gravity row. These related scoring defects are one grouped major finding, not a browser pass.

3. **Major: Gravity uses a different linear progression.** Diagnostic first-row boundaries at levels 1/2/5/10 are 800/735/540/215 ms, rather than 1000/793/about 355.197/64.152 ms. The engine uses max(70,800-(level-1)*65). Levels still advance every ten lines; the delivered browser never runs.

4. **Minor: Lock accounting locks early after movement and omits capped resets.** A grounded O waits 490 ms, moves successfully, then locks after another 310 ms because tick adds the whole 800 ms gravity interval to lockAccumulator on a blocked fall. Thirty alternating moves at 10 ms intervals still keep it unlocked at 799 ms; there is no reset counter. Ordinary 499/500 ms and ledge safety pass. This is one grouped diagnostic lock-policy finding.

5. **Minor: A wholly hidden legal lock does not end the game.** Diagnostic public-action fixture: T spawn at (3,0), stack (2,2),(3,3),(4,3), CW, CCW, left three times, then zero-travel hard drop. T locks wholly in hidden rows 0–1; incoming I is independently open, but over remains false. This is headless source behavior, not working browser gameplay.

### High — 6.70

Summary: **Canonical SRS and working controls; scoring, gravity, contact timing and overlapping previews fail**.

Tests **5.0**: the uncounted engine assertion script passes one fixed-random bag helper, a clear helper, four-cell counts at r0/r1, gravity-helper monotonicity, initial spawn/queue, first/restricted hold, positive hard-drop score and a non-null next piece. These are real engine assertions, unlike GPT-6 Luna high’s text checks. There are no exact coordinates/kicks, walls/drop points/cells, post-lock held retrieval/reset, ghost, line/advanced score, precise timing/cap/ledge, levels, top-out/restart or browser assertions.

Code **9.0**, simplicity **8.5**: **473 source TS lines**, strict types, DOM-free board/engine, copied snapshots, injected RNG and separate DOM entry. Every render recreates board/preview nodes; public state remains mutable. UX **8.5**: distinct beveled cells, labeled board/hold/next, ghost/stats, full legend, pause/restart and fitting phone reflow. Native repeat and no touch UI. The next panel is scroll-reachable; its overlap is charged only to correctness.

Confirmed findings, in deduction order:

1. **Major: Spin history, mini, B2B-combo and perfect-clear scoring are incomplete.** The engine recognizes any three-corner T lock as a full spin without requiring a final rotation: a non-rotated corner lock awards 400 instead of zero, and mini zero/single score 400/800 instead of 100/200. Two consecutive non-PC Tetrises total 2075 instead of 2050 because B2B multiplies the combo bonus too. A single perfect clear scores 100 instead of 900. Full spins, ordinary B2B/no-clear continuity and level-two combo otherwise pass. These related scoring errors are one grouped major finding.

2. **Major: Gravity uses the NES frame table instead of the Guideline curve.** Actual level 1/2/5/10 first rows occur at 800/717/467/100 ms rather than 1000/793/about 355.197/64.152 ms. getGravityInterval uses frames [48,43,38,...] at 60 Hz. Level progression and equal-duration 60/144 Hz falling otherwise work.

3. **Minor: Natural floor contact starts the lock clock one gravity step late.** With O one row above the floor, it lands at 800 ms but does not lock until another 1299 ms, about 800 ms later than the 500 ms contact delay. A successful gravity step sets grounded=false; only the next blocked fall marks contact. An already marked-grounded O passes 499/500 ms, capped resets and ledge safety.

4. **Minor: A wholly hidden legal lock does not end the game.** T spawn (3,0), stack (2,2),(3,3),(4,3); real CW, CCW, three left moves and zero-distance hard drop lock T entirely in hidden rows 0–1 at x=0..2. The next I spawn is independently open; gameOver remains false.

5. **Minor: Next-piece previews overlap at desktop and phone widths.** renderNext inserts three 70 px-wide four-column .next-row grids into a .mini-board whose columns are only 22 px wide with 3 px gaps. Three identical I previews have real intersecting filled-cell rectangles; adjacent preview origins are 25 px apart. Screenshots and deterministic DOM geometry confirm overlap at both sizes. The phone queue is reachable by scrolling, not clipped off-screen.

### Xhigh — 7.40

Summary: **Canonical core, gravity and responsive UI; mini/PC, stale spin, soft timing and hidden-lock gaps**.

Tests **4.5**: the uncounted smoke script passes board spawn acceptance, row clearing, one real seven-bag invariant, five-item queue, next-piece order after hard drop and first/restricted hold. The hardDrop() >= 0 assertion is vacuous; no points or four welded cells are checked. No rotation/kick, walls, independent ghost, post-lock retrieval/reset, line/advanced score, precise gravity/levels, timing/cap/ledge, top-out/restart, input or browser assertions exist.

Code **9.0**, simplicity **8.5**: **629 source TS lines** across pieces, randomizer, board, game, types and browser entry. DOM-free rules, injectable randomizer, copied snapshots and one millisecond clock remain readable; public state and per-frame full snapshots add modest machinery. UX **8.5**: labeled grid/ghost, hold/stats, four complete previews, legend, held Down with blur cleanup and fitting scrollable phone panels. Native lateral repeat, no high-DPI sizing, touch or restart button.

Confirmed findings, in deduction order:

1. **Minor: Mini T-spins receive full-spin scores.** Legal final CW rotation into the grounded mini fixture followed by zero-distance hard drop or timed lock awards 400/800 for zero/single clears, rather than 100/200. isTSpin is binary. Full-spin scoring and ordinary B2B/combo paths pass.

2. **Minor: Perfect-clear bonus is absent under the benchmark profile.** Zero-distance horizontal I completing the bottom row empties the board but awards 100 instead of 900. B2B Tetris PC likewise adds no PC bonus. Normal/full-spin/B2B/combo scores otherwise pass; this is the same isolated PC omission scored minor in GLM/Muse/Haiku.

3. **Minor: Manual soft drop preserves stale T-spin credit.** Rotate T clockwise in open space, manually soft-drop fourteen rows into a three-corner pocket, then hard-drop zero rows. It awards 400 spin points in addition to fourteen soft points even though the last successful manual action was downward movement. tryMove clears lastActionWasRotation only for horizontal movement.

4. **Minor: Starting held soft drop consumes accumulated normal-gravity time.** After fifty update(16) calls at level one, O remains at y=0 with 800 ms accumulated. Real Down moves one row; update(1,true) consumes the old time at the 45 ms interval and reaches y=18 with eighteen points in total. Both headless and real Chromium input reproduce the jump.

5. **Minor: A wholly above-field legal lock does not end the game.** From actual T spawn (3,0), stack (6,0),(1,1),(3,2),(2,2); left,CW,CCW,left,CW,CW,right five times reaches T r2 at (5,-3), entirely above row zero and grounded. Incoming I is independently open. Zero-travel hard drop silently discards the negative cells and continues with gameOver=false.

### Max — 6.65

Summary: **Broad scoring and responsive panels; inverted kick Y, later gravity, B2B-PC, hidden lock and overlay defects**.

Tests **5.0**: the uncounted deterministic smoke script passes board dimensions, one complete bag through real hard drops, five previews, first/restricted/post-lock hold availability, changed active type and loose left/right origin bounds. Gravity accepts y >= startingY, including no fall. No rotation/kick, exact drops/soft points/cells, independent ghost, held retrieval/orientation reset, line/advanced score, precise gravity/levels, timing/cap/ledge, top-out/restart or browser assertions exist.

Code **9.0**, simplicity **8.0**: **1,017 source TS lines**, strict DOM-free engine, separate renderer/input, defensive RNG normalization, copied snapshots and an event-ordered remaining-time clock. Matrix copies, repeated state access and the drawing module add proportionate machinery. UX **8.5**: rounded shaded blocks, outline ghost, labeled board/hold/five previews, full legend, pause/restart/status and fitting scrolling phone panels. Native repeat, no high-DPI scaling, focus cleanup or touch UI. The overlay defect is charged only to correctness.

Confirmed findings, in deduction order:

1. **Major: Every SRS kick transition applies vertical offsets in the wrong direction.** All 28 basic states are canonical, but all 48 non-O ordered transition lists fail the Y-down oracle. Tables store positive Y upward while rotate adds kickY to board Y. A floor I r0 at (3,20) fails CW entirely; canonical SRS reaches r1 at (4,18). A floor T r0 at (3,20) reaches (3,18) instead of canonical (2,19). Wall kicks with zero vertical displacement can still pass.

2. **Major: The gravity table diverges from the Guideline curve at later levels.** Levels one/two/five match 1000/793/355 ms, but actual first rows at levels 9/10/14 are 99/72/21 ms, instead of about 93.882/64.152/11.439 ms (or the accepted 16 ms fast floor). The later table values are a different progression; the 16 ms terminal floor itself is not penalized. Levels and 60/144 Hz independence pass.

3. **Minor: B2B Tetris perfect clear uses the ordinary bonus.** Tetris, a no-clear lock, then zero-distance Tetris perfect clear total 4000 instead of 5200. The last placement awards 1200 B2B clear plus 2000 ordinary PC, instead of 1200 plus 3200 B2B PC. Ordinary single PC 900 and full/mini/B2B/combo scoring pass.

4. **Minor: A wholly hidden legal lock does not end the game.** T spawn (3,0), stack (2,2),(3,3),(4,3), CW,CCW,left three times ends T wholly in hidden rows 0–1 at x=0..2. Incoming I is independently open. Zero-travel hard drop leaves gameOver=false; lockPiece writes the cells and only checks the next spawn.

5. **Minor: The game-over overlay is visible during active play.** At desktop and phone widths, after reload and after real R restart, gameOver=false and #game-overlay.hidden=true, but computed display is grid and Game over covers the live board. The .game-overlay display:grid rule overrides the native hidden presentation. This matches the predecessor Luna Codex overlay finding.


## Reproducible engine evidence

```sh
python3 .audit/run-gpt56-luna-audit.py --offline
```

Omit `--offline` when npm packages are not cached. The
[runner](run-gpt56-luna-audit.py) rebuilds and runs unchanged own tests,
[engine probes](gpt56-luna-audit.mjs) and
[Chromium assertions](gpt56-luna-browser.cjs) for all five. A passing audit
asserts documented defects as well as conformance. `--engine-only` explicitly
skips browser checks; `--effort` selects one effort; `--playwright-cli` and
`--playwright-config` override local browser setup. `--artifacts-dir` may
retain screenshots/JSON **outside** the checkout. Default output is disposable.
Nonzero commands, CLI error sections, absent results and changed recorded
outcomes fail the runner; browsers/server groups close in `finally`.

Adapters call actual emitted methods; private properties are accessed only
for deterministic fixtures or observation. Rule/input/render/frame bodies are
not repaired. Equivalent probes cover:

- **All 28 canonical coordinate sets**, the same independent oracle, allowing
  only low O’s constant origin shift. Medium’s real rotate leaves O fixed:
  unreachable O orientations in its generic helper are not recorded as a
  delivered rotation defect. Seven distinct colors, all **48 ordered non-O
  CW/CCW kick candidate sequences**, walls and concrete T/I wall/floor kicks.
- **100 actual engine bags per effort**, ten seeds × ten full bags, clearing
  only the stack between real hard drops. Queue/hold/retrieval/orientation
  reset are checked, with low’s failures asserted. All seven obstructed
  ghosts are independently collision-free, with a collision one row lower;
  exact hard-drop points and four welded coordinates agree with the oracle
  (medium’s one-point-per-cell under-award is required).
- **499/500 ms marked-grounded boundary**, natural contact-to-lock time,
  fifteen real timed resets, thirty fast actions to distinguish the reset
  cap, and gravity-phase early lock. The **ledge-move mid-air lock probe**
  rests O on a single support for 490 ms, moves right off it, waits 20 ms
  across the old deadline, then confirms eventual floor locking.
  **All five pass ledge mid-air safety**; medium is diagnostic only.
- Exact normal single/double/triple/Tetris; legal final-rotation full/mini
  zero/single through **hard drop and timed lock**; non-rotation corner lock;
  manual down after rotation; B2B no-clear continuity and ordinary-single
  break; consecutive B2B/combo; level-two combo; pre-clear-level scoring and
  ten-line crossing; single PC, single PC after B2B, and B2B Tetris PC.
- Actual first-row boundaries at levels **1,2,5,9,10,14,15,20**, compared with
  `1000×(0.8−(level−1)×0.007)^(level−1)` and accepted fast floors. Normal/
  soft points and **800 ms normal / real Down / 1 ms** transition. Equal
  **1480.001 ms** at level two compares **60/144 Hz** in engine updates and
  each unchanged browser callback. The extra 0.001 ms avoids a false defect
  from rounding exactly at a floating-point boundary.
- Blocked spawn, game-over input guards (low’s mutation is required), full
  board/hold/score/lines/level/availability reset, and **public-action wholly
  hidden locks** with the incoming I independently open and non-overlapping.
  Only stack cells/piece source are injected; actual spawn/legal actions
  reach the hidden poses, never a forced hidden active piece.

| Zero-travel scoring fixture | Expected | low | medium (diagnostic) | high | xhigh | max |
|---|---:|---:|---:|---:|---:|---:|
| Normal single/double/triple/Tetris | 100/300/500/800 | Same | Same | Same | Same | Same |
| Full spin zero/single, hard and timed | 400/800 | 0/100 | 0/100 | 400/800 | 400/800 | 400/800 |
| Mini zero/single, hard and timed | 100/200 | 0/100 | 0/100 | 400/800 | 400/800 | 100/200 |
| No-rotation three-corner T lock | 0 | 0 | 0 | 400 | 0 | 0 |
| Two Tetrises, no-clear between | 2000 | 1600 | 1600 | 2000 | 2000 | 2000 |
| Consecutive non-PC Tetrises | 2050 | 1600 | 1600 | 2075 | 2050 | 2050 |
| Level-two combo single | 300 | 200 | 200 | 300 | 300 | 300 |
| Nine-to-ten-line single | 100 | 200 | 100 | 100 | 100 | 100 |
| Single PC | 900 | 100 | 100 | 100 | 100 | 900 |
| Tetris / no-clear / Tetris PC total | 5200 | 1600 | 1600 | 2000 | 2000 | 4000 |

Spin fixture: T r3 at **(3,bottom−2)**, blockers **(5,bottom−2),(3,bottom)**
and either **(3,bottom−2)** for full or **(5,bottom)** for mini. A single
adds row `bottom−1` blockers outside x=3..5. Real CW reaches r0 at zero ghost
distance. Bottom is 19 in xhigh, 21 otherwise. PC single uses horizontal I
filling the bottom row except x=3..6; low uses its delivered r1, others r0.
Tetris is a four-row well at x=4 with vertical I.

Hidden paths: low uses stack **(6,2)** and one right move from actual T x=4
spawn, ending x=5. Medium/high/max use **(2,2),(3,3),(4,3)** and
**CW,CCW,left×3**, ending T r0 `(0,0)` in hidden rows. Xhigh’s 20-row field
uses **(6,0),(1,1),(3,2),(2,2)** and
**left,CW,CCW,left,CW,CW,right×5**, ending r2 `(5,−3)` entirely above row zero.
Every incoming I is independently open; all five incorrectly continue.

The task’s [Fandom link](https://tetris.fandom.com/wiki/Tetris_Guideline)
returned **HTTP 402**, as in recent audits. The established profile and its
[SRS](https://tetris.wiki/Super_Rotation_System) and
[modern scoring](https://tetris.wiki/Scoring) references were rechecked.
SRS Y is positive upward; board Y is positive downward. Additive PC bonuses
are the existing benchmark convention, not a claim that all licensed Tetris
versions share identical PC rules. No new criterion or weight was added.

## Chromium evidence

Playwright skill/CLI, installed **Chromium 156.0.8078.4**, **1280×800** and
**390×844**. T3 preview status/open were checked; the explicitly requested
recent-audit CLI workflow was followed. No saved user login profile was used.
All ten full-page screenshots were visually inspected outside the checkout.
Four playable entries get only appended accessors to existing lexical bindings.
RAF scheduling is captured to drive unchanged callbacks with exact timestamps;
engine, handlers and drawing stay intact. Medium is its actual delivered
page/module graph, with its own server, not a replacement static diagnostic.

| Effort | Desktop board | Phone document width | Phone board | Supporting state / finding | Application errors |
|---|---|---:|---|---|---|
| low | 300×600 at x=410 | 466 | 300×600 at x=0 | Hold/next x=332..452 clip; board fits | None |
| medium | Static 282×620.39 at x=199 | 390 | Static 282×620.39 at x=54 | Blank previews; no game or controls | CSS module rejected as text/css |
| high | 340×660 at x=470 | 390 | 336.25×652.5 at x=26.875 | Three previews overlap; phone queue scroll-reachable | None |
| xhigh | 326×652 at x=477 | 390 | 326×652 at x=32 | Four complete previews below fold, reachable | None |
| max | 284×568 at x=498 | 390 | 284×568 at x=53 | Panels fit on scroll; false Game over overlay | None |

Low measurements include its canvas border; high is a padded/bordered DOM
grid. Geometry assertions allow 0.02 px horizontal/size variation, while
font-dependent Y coordinates are recorded. Medium’s 300×660 backing scales
to 282×620.39; its large desktop blank next panel is static CSS, not gameplay.

Real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** run at both sizes
for all four usable games, asserting displacements, rotations, soft points,
four hard-locked cells and low’s broken C availability. Real Space produces
blocked-spawn game over and **real R** resets each at both widths. Max’s
**hidden=true / display:grid** overlay is observed after reload and restart,
matching Luna Codex. High/xhigh’s active overlays are hidden. Medium’s score
stays zero through the same keys, R and Restart click; its MIME failure is
never counted as a successful keyboard or restart pass.

Actual ghost canvas calls/DOM cells assert independent expected coordinates
for all seven pieces. High’s three identical I previews have intersecting
filled rectangles: their 25 px origins cannot contain 70 px rows. Phone
scrolling fully reaches high/xhigh’s next cards; vertical reflow is not
clipping. Xhigh’s real Down reproduces **18 rows/18 points**; low’s actual
callback reproduces **one versus two rows** at 60/144 Hz. High/xhigh/max agree
across refresh rates in the same fixture. Missing favicons are excluded.
The four usable games have no application exceptions, console errors or
failed required assets.

## Supplied generation and isolation context (no score effect)

These facts come from the parent/import record; they were recorded, not
independently reconstructed from provider logs. Registry/statistics were
read; accounting/isolation records were not changed or recollected.

- **Max is the second attempt.** First T3 thread
  `mcp:1f126d24-f901-4aae-b341-53138a6855b3` was **not imported**. OpenAI’s
  response stream hung **4h 35m**, **22:08:53–02:43:48 UTC**, until
  **“Connection reset by peer”**. Codex retried and finished in **30 s**;
  that attempt’s **5h 38m elapsed** was an infrastructure stall, not model
  work. The imported second attempt’s duration is separate.
- Imported max checked its own game in T3’s preview browser and closed its
  own tab with **`t3_preview_close`**. Isolation checking now treats
  **`t3_preview_*` like `preview_*`**, commit **b71826a**. No score effect.
- **All five:** no other outside access, T3 tool calls or benchmark lookups
  were reported. Workspaces were registered through T3’s project tool
  (`new --no-register`, as supplied); `cleanup` found nothing left after
  each run and `preflight` confirmed free ports before the next. Runs
  executed **one at a time**. No contrary implementation evidence was found.
- Standard tier is supplied. Backend budgets, complete overhead and normalized
  model-request/tool counts remain unverified; unknown is not zero.

| Effort | Imported T3 thread | Native Codex session | Tested-agent tokens | Imported elapsed |
|---|---|---|---:|---|
| low | `mcp:5a2f8dcc-9777-4bb7-b8c9-4cf8a687d0cf` | `01a16fb4-7053-74d2-902f-588f1d9a8915` | 195,984 | 41.388s |
| medium | `mcp:a722802f-7544-48ea-94e4-129c6b874292` | `01a16fb5-56ed-7c31-b62b-e738bd693855` | 378,157 | 1m 5.368s |
| high | `mcp:47144ca2-204c-42b8-82c0-7cb1e2345f40` | `01a16fb6-962b-7cd3-917b-1e3bf6b468b2` | 1,213,979 | 2m 49.620s |
| xhigh | `mcp:103013dd-670d-4c9b-87ba-616fb78f0ff0` | `01a16fb9-7255-7c03-bf3b-93e5974b3ae4` | 1,886,450 | 3m 6.193s |
| max | `mcp:fbf7f80f-0cfa-4e6a-bbf4-35d8d4419ea9` | `01a171b5-1bb7-7640-ae1b-fb8cd76d1b4b` | 2,769,139 | 4m 54.330s |

## Limits and validation

This is focused conformance evidence, not exhaustive state-space proof,
long-duration playtesting, physical touch/mobile testing, native OS repeat
timing or another-browser/Node-version certification. Every recorded bug has
a reproducible assertion. Not every spin/kick/PC arrangement is certified.
Max’s fifth-kick spin upgrade was not independently isolated from its wrong
kick policy and receives no extra finding/deduction. Medium’s browser
gameplay is **unavailable**; headless probes never substitute for delivery.
Supplied isolation history was recorded, not independently re-audited.
Earlier implementations were not rescored or retroactively certified by
these new probes. All 39 historical ranking entries remain unchanged.

Final validation after recording and regeneration:

- `python3 .audit/run-gpt56-luna-audit.py --offline`: **passed**, all five
  fresh installs/builds/own suites, engine assertions and ten viewport passes,
  including medium’s required module failure and every recorded browser
  finding. All seven actual ghost drawings are checked in each usable game.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**, 246 local links and 44 score
  rows, weighted arithmetic, fixed deductions, ordering and table shapes.
- `python3 -m unittest discover -s tests`: **passed**, **61 tests**, OK.
- `git diff --check`: **passed**.

New audit JavaScript/Python syntax, Markdown links/tables, new-file whitespace,
allowed changed-file scope, README-only paragraph/generated-block scope and
clean original run folders were also checked. All 39 historical JSON entries
are unchanged as parsed data. Only five score entries are appended. All audit
servers/browsers and random temporary copies/artifacts were closed/deleted.
No commit, stash, reset or revert was made; parent owns the commit.
