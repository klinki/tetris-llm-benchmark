# Muse Spark 1.3 contributor audits

Audit date: **2026-10-24 (Europe/Rome)**. Five independent from-scratch runs of
`muse-spark-1.3-contributor` via OpenCode Go in T3 Code / OpenCode, each from
“Read the README.md file and implement it”. Run IDs are
`muse-spark-1.3-contributor-{minimal,low,medium,high,xhigh}`. This record supports
[`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).

The separate **reference-assisted** `muse-spark-1.3-medium` remains **8.40**
under its [October 23 audit](oct23-review.md). Its registry label and the
from-scratch contributor medium label are both “Muse Spark 1.3 (medium)”.
Run IDs and explicit distinctions here prevent treating them as one run.
Neither label nor either run's registry data was changed.

## Scope and method

Re-read the full ranking rubric, weights, methodology and tables,
[`TETRIS.md`](../TETRIS.md), the recent [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md) and [Gemini high](gemini-high-review.md) records,
and their probe/browser/runner scripts. Reviewed every delivered source,
complete own tests, HTML/CSS, package/lock files, TypeScript config and server.
Scores use the same 0–10 half-point scale and **40/20/20/10/10** weights.
Correctness starts at 10: critical −4 with a cap of 4; major −1.5; minor −0.5.
No prior score was changed. Tokens, time, cost, effort and isolation facts
have no quality-score effect.

All five declared build/test workflows passed in fresh random temporary
copies, excluding `node_modules`, `dist`, `dist-test` and `.git`. Work stayed
on `main`, without commit, stash, reset or revert. No implementation files,
registry, pricing, repository scripts or repository tests were edited.
All servers used **41000–49999**. Low honors `PORT`; only the temporary
server port constant was substituted for minimal/medium/high/xhigh, preserving
routes, MIME and application code. Every named Chromium session and server
process group was closed and temporary copies/artifacts deleted after review.
No dependencies/build output were left in any run directory.

## Scores and rationale

| Run ID | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Confirmed bugs |
|---|---:|---:|---:|---:|---:|---:|---|
| `muse-spark-1.3-contributor-minimal` | 6.5 | 4.5 | 7.5 | 8.5 | 8.0 | **6.65** | 1 major, 4 minor |
| `muse-spark-1.3-contributor-low` | 5.5 | 6.0 | 8.5 | 8.0 | 8.5 | **6.75** | 2 major, 3 minor |
| `muse-spark-1.3-contributor-medium` | 6.5 | 5.5 | 8.5 | 8.5 | 8.0 | **7.05** | 1 major, 4 minor |
| `muse-spark-1.3-contributor-high` | 7.0 | 6.5 | 8.5 | 8.5 | 8.5 | **7.50** | 6 minor |
| `muse-spark-1.3-contributor-xhigh` | 7.0 | 6.0 | 8.5 | 8.0 | 8.5 | **7.35** | 1 major, 3 minor |

Weighted total is `0.40C + 0.20T + 0.20Code + 0.10S + 0.10UX`.
Each finding is charged once to correctness, without a second numerical
penalty in code/tests/UX. Missing tests affect only test quality; audit-added
probes do not raise an implementation's own-test score. LOC is descriptive.

Minimal's missing no-line full-spin score, mini model and perfect-clear
bonus are one grouped major scoring omission. Low's absent B2B/mini/PC and
medium-from-scratch's absent spin/B2B/PC likewise receive one major each,
following DeepSeek/Cat-jam/Sonnet low. Xhigh's common hard-drop spin-credit
loss plus mini/PC omissions receive one grouped major integration deduction,
following Space-bunny. High supports full zero/single spins and B2B/combo;
its two narrower independent mini/PC omissions are minor, comparable to
Sol OMP's mini finding and Gemini/Haiku's PC finding. Normal clears, drop
points, B2B continuity and combos are not presumed from a feature name.

Soft timer transitions, entirely hidden lock-out and narrow layouts retain
the recent Haiku/Sonnet minor severities. Minimal's missing action reset is
a lock-fidelity omission; it still has timed locking and safe ledge handling.
High's unscored immediate Down row is a separate cause from its accumulator
transition, and has an isolated zero-accumulator reproduction. The two small
renderer defects are distinct from phone overflow and reproduce on desktop.

### `muse-spark-1.3-contributor-minimal` — 6.65

Summary: **Canonical core geometry; incomplete scoring, lock resets and soft timing, hidden lock-out and phone clipping**.

The **3 smoke groups / 41 test lines** earn tests **4.5**. Four calls to the fixed-random bag helper assert uniqueness; movement asserts one left step and top-out fills the spawn. Rotation checks only cell/table counts and accepts either rotation 0 or 1. The ghost assertion is only `ghostY >= active.y`; hold checks only that something was stored and then forcibly re-enables availability. The forced-line case locks an airborne piece and asserts `lines >= linesBefore`, which cannot establish a clear or score. No hard-drop method is actually called. There are no exact drop, legal scoring, kick displacement, timing/reset-cap/ledge, level, restart or browser assertions.

Code **7.5**, simplicity **8.5**: **358 source TS lines**, strict types, a small DOM-free engine and a direct entry/renderer make local reading straightforward. Dead `rotateCCW`, drawing/input helpers and an unused held set, two hard-drop methods (one with `2 * 0` placeholders), self-assignment and repeated reset/hold setup are maintainability costs independent of the confirmed behavior deductions. UX **8.0** reflects a readable plain desktop board, ghost, DOM scores, five previews, complete legend and custom DAS/ARR. It lacks canvas labels, high-DPI scaling, touch controls and grid lines. The engine's short size does not substitute for test coverage.

Confirmed findings:

- **Major (−1.5 correctness): T-spin scoring and perfect-clear bonuses are incomplete.** A legal final-rotation full T-spin with no clear scores 0 instead of 400; a mini single scores 800 instead of 200 and mini zero scores 0 instead of 100. A zero-distance perfect-clear single scores 100 instead of 900. Full spin singles, B2B and combos work; these scoring omissions receive one grouped major deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): Grounded movement and rotation do not reset lock delay.** Rest O at physical left 4,top 20 for 490 ms, move right, then advance 20 ms. It locks after only 20 ms at the new position; grounded actions preserve the old timer rather than resetting it. The ledge probe stays airborne correctly. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Soft drop advances once per frame instead of elapsed time.** With soft drop enabled on an empty field, one update(16) moves/scores one row; sixteen update(1) calls over the same 16 ms move/score sixteen rows. The successful-soft-move branch ignores dt. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `7.5 → 7.0`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 501 px. The 300×600 board fits at x=45 (304×604 frame at x=43), but hold canvas starts at x=−102 and next at x=372; supporting state is clipped. Scoring effect: `7.0 → 6.5`.

### `muse-spark-1.3-contributor-low` — 6.75

Summary: **Incorrect kicks and incomplete advanced scoring; soft-drop jump, clipped phone board and overlaid legend**.

All **11 own cases / 136 test lines** pass. Tests **6.0**: four seeded bag invariants, board emptiness/clear helper, empty-board CW/CCW state changes, hold restriction, blocked spawn and eventual falling/locking are meaningful. Soft drop asserts only an increased score, the normal clear uses `>=100`, ghost checks only a lower Y and the rotation test titled “wall kick” rotates on an empty board. There is no actual kick displacement, exact drop/scoring, post-lock hold swap, lock boundary/cap/ledge, level cadence, advanced scoring, hidden lock-out, restart or browser assertion.

Code **8.5**, simplicity **8.0**: **839 source TS lines** with focused board, bag, geometry, engine, input and renderer modules, strict typing and no browser runtime dependencies. Mutable state, duplicate spawn/hold-reset paths, a redundant `Bag.take` alias and unused kick metadata add modest machinery. UX **8.5** reflects clear blocks/ghost, five previews, custom DAS/ARR, device-pixel-ratio sizing and visible click controls plus a DOM legend. The distinct layout and overpaint findings are charged only to correctness. Touch/physical-device behavior was not certified.

Confirmed findings:

- **Major (−1.5 correctness): Non-I SRS kick offsets are incorrect.** The third offset differs in 2→3, 3→2, 3→0 and 0→3 for every JLSTZ piece (20 table transitions). With T rotation 0 at (3,10) and blockers (4,12),(5,12), CCW produces rotation 3 at (3,8) instead of canonical (4,9). Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): Back-to-back, mini and perfect-clear scoring are incomplete.** Two Tetrises separated by a no-clear lock total 1600 instead of 2000; mini zero/single fixtures score 400/800 instead of 100/200; a perfect-clear single scores 100 instead of 900. Full spins and combos work. These related scoring omissions receive one grouped major deduction. Scoring effect: `8.5 → 7.0`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 20 rows and earns 20 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `7.0 → 6.5`.
- **Minor (−0.5 correctness): The phone layout clips the left side of the playfield.** At 390×844, document width is 505 px. The fixed 620×600 canvas starts at x=−115 and its 280×560 board starts at x=−95, clipping 95 px of the playfield. On-screen buttons reflow, but the canvas does not. Scoring effect: `6.5 → 6.0`.
- **Minor (−0.5 correctness): Canvas legend overlaps the playfield and statistics.** Renderer paints the legend at canvas x=184 with baselines y=544,560,576, inside the board rectangle x=20–300,y=20–580. The second line extends across the LINES statistic. Forwarded fillText bounds and desktop screenshots independently confirm the overlap. Scoring effect: `6.0 → 5.5`.

### `muse-spark-1.3-contributor-medium` — 7.05

Summary: **From scratch: no T-spins, B2B or perfect-clear bonus; hidden lock-out, soft jump and preview/phone clipping**.

The **10 smoke groups / 123 test lines** earn tests **5.5**. Three deterministic bag invariants, board boundaries/clear, one game wall, hold restriction and blocked spawn are meaningful. All 28 shape tests count four cells without a coordinate oracle; rotation asserts only `typeof result === boolean`. Hard drop uses `>= distance*2`, forced scoring locks an airborne piece beside an already-full row without checking points, and the gravity assertion ends in `game.board !== null`, so it passes regardless of movement. There is no real kick, independent obstructed ghost, exact scoring, post-lock hold swap, lock timing/cap/ledge, soft timing, level, hidden lock-out, restart or browser assertion.

Code **8.5**, simplicity **8.5**: **643 source TS lines**, focused typed modules, a simple board abstraction, a cloned board helper and no runtime dependencies. State is publicly mutable and spawn/hold/restart duplicate setup. UX **8.0** reflects readable desktop panels, five previews, DOM scores and a complete keyboard legend; side movement ignores OS repeats and has no custom auto-shift. There are no canvas labels, high-DPI sizing or touch controls. This **from-scratch** run is `muse-spark-1.3-contributor-medium`; the **8.40 reference-assisted** `muse-spark-1.3-medium` was not rescored.

Confirmed findings:

- **Major (−1.5 correctness): T-spin, back-to-back and perfect-clear scoring are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 rather than full 400/800 and mini 100/200. Two Tetrises separated by a no-clear lock total 1600 instead of 2000; a perfect-clear single scores 100 instead of 900. Combos work. These absent features receive one grouped major deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 16 rows and earns 16 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 537 px. The 300×600 board fits at x=45, but the hold canvas starts at x=−115 and next at x≈372.69, clipping supporting state. Scoring effect: `7.5 → 7.0`.
- **Minor (−0.5 correctness): I-piece hold and next previews are clipped.** The medium-from-scratch renderer uses 88 px preview canvases, but the fourth I cell is drawn at x=74 with width=20, ending at x=94. Browser draw observations and the cyan right-edge pixel confirm 6 px of that cell are clipped in both hold and next. Scoring effect: `7.0 → 6.5`.

### `muse-spark-1.3-contributor-high` — 7.50

Summary: **Full spins, B2B and combos work; mini/PC gaps, hidden lock-out, two soft-drop defects and phone clipping**.

All **12 own cases / 164 test lines** pass. Tests **6.5**: one seeded bag through actual spawns, both wall bounds, hold restriction and availability after lock, ghost floor collision, the exact 100+200+200 ms grounded lock, blocked spawn and reset are useful. The nominal I wall-kick fixture starts horizontal at its leftmost legal origin and rotates into a valid unshifted vertical pose; it does not force or assert a kick. Single/Tetris scores use lower bounds rather than exact expected totals; the queue test ultimately checks only a string type. Gravity checks helper ordering rather than real cadence. No exact drop points, spin integration, B2B/combo/PC, full SRS oracle, cap/ledge, levels, hidden lock-out or browser assertion exists.

Code **8.5**, simplicity **8.5**: **688 source TS lines**, a typed DOM-free core and direct input/canvas entry point. Public state, repeated replacement/spawn setup, an unused local in the classifier and an empty soft-movement branch add small maintenance costs; no runtime dependency or broad `any` layer is present. UX **8.5** reflects clear shaded blocks/grid/ghost, DOM stats, five centered previews, a complete legend, custom DAS/ARR and blur cleanup. No touch controls, accessible canvas label or high-DPI sizing is supplied.

Confirmed findings:

- **Minor (−0.5 correctness): Mini T-spins receive full-spin scores.** Legal final-rotation mini fixtures score 400 without a clear and 800 for a single instead of 100/200. The three-corner classifier returns only a boolean; ordinary full-spin fixtures score correctly. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): Perfect-clear bonus is absent under the benchmark profile.** A horizontal I at x=3,y=20 completes row 21 at zero drop distance. The board becomes empty, but the single scores 100 instead of 900. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `9.0 → 8.5`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 16 rows and earns 16 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): The initial soft-drop keydown moves without awarding a point.** From O at y=5 with zero accumulated time, real ArrowDown immediately moves it to y=6 while score stays 0. The main handler calls move(0,1), whose soft-drop branch awards no points; tick awards points only for subsequent timed rows. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 502 px. The board content fits at x=45 (302×602 frame at x=44), but hold starts at x=−99 and next at x=375; hold, queue and stats are clipped. Scoring effect: `7.5 → 7.0`.

### `muse-spark-1.3-contributor-xhigh` — 7.35

Summary: **Hard drop erases spin credit; mini/PC gaps, hidden lock-out, soft-drop jump and phone clipping**.

All **14 own cases / 207 test lines** pass, but tests **6.0** reflects assertion strength. Twenty unseeded bag invariants, left wall blocking, a T floor-rotation success requiring a kick, floor ghost/collision, hold restriction/post-lock availability, a normal line, exact level crossing, blocked spawn and a manually flagged three-corner helper are useful. `cellsFor(kind,4)` normalizes directly to rotation 0, so its cycle case does not perform four engine rotations. Hard-drop and line points are loose bounds. The gravity assertion ends in `lines >= 0`, and the lock-delay assertion does too; both are vacuous. Its `update(2)` / `update(1)` calls also exceed the 0.1 s cap, so they would not establish the named boundaries. There is no soft-point/timing, exact drop, spin scoring integration, B2B/combo/PC, actual cap/ledge, hidden lock-out, restart or browser test.

Code **8.5**, simplicity **8.0**: **868 source TS lines**, focused typed board/geometry/engine/input/renderer modules and no runtime dependencies. Public mutable engine fields, duplicate spawn/hold setup and several redundant scoring assignments add modest weight. UX **8.5** reflects a clean grid/ghost, DOM stats, five previews, full keyboard legend, custom DAS/ARR and a correctly toggled DOM game-over overlay. No touch controls, canvas labels or high-DPI sizing is supplied.

Confirmed findings:

- **Major (−1.5 correctness): Hard drop loses T-spins; mini and perfect-clear scoring are incomplete.** After a real final rotation into a legal grounded full-spin slot, zero-travel hard drop scores 0/100 for zero/single clears rather than 400/800 because hardDrop clears lastActionRotate before scoring. Timed locking scores full spins correctly but treats minis as full (400/800 rather than 100/200). A perfect-clear single scores 100 instead of 900. These related scoring defects receive one grouped major deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 20 rows and earns 20 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 515 px. The board content fits at x=45 (304×604 frame at x=43), but hold starts at x=−113 and next at x=363; supporting state is clipped. Scoring effect: `7.5 → 7.0`.

## Reproduction and engine evidence

```sh
python3 .audit/run-muse-audit.py --offline
```

Omit `--offline` if locked TypeScript is not in the npm cache. The command
installs with `npm ci --ignore-scripts`, runs every declared `npm test`
(including builds), [`muse-audit.mjs`](muse-audit.mjs), and the desktop/phone
Chromium pass in [`muse-browser.cjs`](muse-browser.cjs). Passing intentionally
asserts recorded defective outcomes as well as conforming behavior; it is
not a claim that the games are bug-free. `--engine-only` explicitly skips
browsers and cannot reproduce the whole record. `--effort` selects one run
for diagnostics; default is all five. `--playwright-cli`/`--playwright-config`
override browser setup. `--artifacts-dir` retains screenshots/JSON **outside**
the checkout for visual review; otherwise all artifacts are disposable.
The runner reuses an installed Chromium without downloading a browser and
fails on nonzero commands, CLI error sections, missing browser results,
changed documented outcomes or application errors.

The engine adapters use ordinary emitted private properties only to prepare
deterministic fixtures. Implementation source is not patched. All five assert:

- **28 canonical SRS coordinate sets**, allowing only a fixed O-origin
  translation; seven distinct colors; every CW/CCW kick-table transition.
  High's unexported static tables/colors are parsed as JSON data from source,
  without rewriting code. Low's exact 20 table mismatches are asserted as
  defects; an obstacle fixture also demonstrates the wrong real outcome.
  Concrete T/I wall kicks succeed in both directions in all five.
- **Ten seeded bags through actual engine spawns**, wall bounds, upcoming
  queue, hold restriction/post-lock swap/orientation reset, all seven
  obstructed ghosts with four distinct cells and exact hard-drop coordinates
  and distance points. The seed overrides global randomness only while
  exercising engines that do not expose injection.
- **499/500 ms** grounded locking and a behavioral **15-reset cap** in
  low/medium/high/xhigh; minimal's missing action reset is asserted instead.
  Millisecond engines are stepped in frames ≤16 ms; xhigh receives equivalent
  seconds. A 0.000001 ms tolerance crosses floating-point equality safely.
- The **ledge-move mid-air lock probe** in all five: O's physical left/top
  is (0,19), supported by one cell at (0,21). Wait 490 ms, move right, then
  cross 20 ms while airborne. All five stay airborne, later land and lock on
  the floor without stamping blocks at their old height. No stale mid-air
  lock defect was found in these runs.
- Exact single/double/triple/Tetris values, pre-clear-level scoring,
  level-two combo **300**, B2B continuation through a no-clear lock and break
  on a single, legal actual-rotation full/mini zero/single integration with
  both hard drop and timed lock, mini/fifth-kick metadata behavior and
  perfect clears. None has a mini-aware classifier. Mini metadata does not
  change its boolean result; no-corner positions remain non-spins.
- **1000/793 ms** level-one/two gravity, ordinary soft points/timing and the
  800 ms normal-to-soft transition. Minimal's equal-time frame-count fixture
  is distinct from the other four accumulator-transition defects.
- Blocked-spawn game over, inert game-over movement/rotation/hold/drop/time,
  restart to empty board/score/hold/level, and wholly hidden lock-out with
  the next spawn independently verified open. The hidden fixture uses a
  real T spawn with deterministic next I; only stack cells are injected.
  Public CW, CCW and three left moves reach (0,0), then hard drop locks all
  four cells above visible row 2. Low ends; the other four continue.

### Exact scoring outcomes

All columns below identify contributor runs; **medium is from scratch**,
`muse-spark-1.3-contributor-medium`, not reference-assisted `muse-spark-1.3-medium`.
Numbers exclude drop distance; spin poses have zero hard-drop travel.

| Fixture | Expected | minimal | low | medium, from scratch | high | xhigh |
|---|---:|---:|---:|---:|---:|---:|
| Normal single/double/triple/Tetris | 100/300/500/800 | Same | Same | Same | Same | Same |
| Full spin zero/single via hard drop | 400/800 | 0/800 | 400/800 | 0/100 | 400/800 | 0/100 |
| Mini zero/single via hard drop | 100/200 | 0/800 | 400/800 | 0/100 | 400/800 | 0/100 |
| Full spin zero/single via timed lock | 400/800 | 0/800 | 400/800 | 0/100 | 400/800 | 400/800 |
| Mini zero/single via timed lock | 100/200 | 0/800 | 400/800 | 0/100 | 400/800 | 400/800 |
| Two Tetrises, no-clear lock between | 2000 | 2000 | 1600 | 1600 | 2000 | 2000 |
| Level-two combo single | 300 | 300 | 300 | 300 | 300 | 300 |
| Perfect-clear single | 900 | 100 | 100 | 100 | 100 | 100 |

Spin geometry: pivot box origin (3,19), T initially rotation 3, blockers
(5,19),(3,21) and either (3,19) for full or (5,21) for mini. For a single,
fill row 20 at x=0,1,2,6,7,8,9. Real CW reaches rotation 0 without a kick;
its ghost is 19. Hard drop or 500 ms timed lock exercises integrated scoring.
The perfect clear fills row 21 except x=3–6, with I at (3,20), rotation 0.
The expected bonus of 800 is the established benchmark convention, not a
claim that all licensed Tetris versions use that bonus.

## Chromium evidence

Playwright skill / CLI, installed **Chromium 156.0.8078.4**, at **1280×800**
and **390×844**, using supplied servers in temporary builds. T3 preview
status was inspected; the CLI followed the explicitly requested recent audit
workflow. No user login profile was used. All ten viewport screenshots and
two focused renderer screenshots were visually inspected outside the checkout.

| Run ID | Desktop board content | Phone document width | Phone board content / canvas frame | Phone hold / next canvas X | Application errors |
|---|---|---:|---|---|---|
| `muse-spark-1.3-contributor-minimal` | 300×600 at x=490 | 501 | 300×600 at x=45 / 304×604 at x=43 | −102 / 372 | None |
| `muse-spark-1.3-contributor-low` | 280×560 at x=350 | 505 | 280×560 at x=−95 / 620×600 combined canvas at x=−115 | Combined: x=209 | None |
| `muse-spark-1.3-contributor-medium` | 300×600 at x≈481.02 | 537 | 300×600 at x=45 | −115 / ≈372.69 | None |
| `muse-spark-1.3-contributor-high` | 300×600 at x=490 | 502 | 300×600 at x=45 / 302×602 at x=44 | −99 / 375 | None |
| `muse-spark-1.3-contributor-xhigh` | 300×600 at x=490 | 515 | 300×600 at x=45 / 304×604 at x=43 | −113 / 363 | None |

Measurements distinguish drawn content from border boxes; low's board is a
region inside a combined canvas. Exact phone widths/X positions are asserted,
with 0.02 px tolerance on fractional layout. Medium's fixed side columns
shrink slightly but the canvas overflows its central padded panel. This does
not hide its playfield; supporting state still clips.

Real keyboard sequence **Left, Right, Up, X, Z, Left Control, Down, Space, C**
uses forwarding prototype observations, requiring exact displacement,
rotation directions `[1,1,−1,−1]`, soft points, four locked cells and hold
restriction. A blocked-next-spawn fixture uses real Space and **real R**,
asserting game-over state and a fresh empty game. Xhigh's DOM overlay changes
`none → flex → none`; the other runs render game-over in canvas or status.

For repeatability, animation simulation updates are frozen while installed
DOM input listeners and rendering stay live; Down is held for 120 ms and
120 ms of engine time is driven explicitly. The 800 ms / real Down / 1 ms
fixture independently reproduces **1 row/point for minimal**, **20 for low**,
**16 for medium-from-scratch**, **17 rows/16 points for high** and **20 for
xhigh**. Minimal's one row is its per-update implementation, not evidence of
correct timing. High's extra unscored row is confirmed again with zero
accumulated time: O at y=5 becomes y=6, score 0, on the keydown alone.

Low's `fillText` is forwarded unchanged to record legend bounds at x=184,
baselines 544/560/576 inside its board; screenshots show it crossing blocks
and LINES. Medium's forwarded `fillRect` draws the I's last cell at x=74,
width 20 on each 88 px preview canvas, and `getImageData(87,26,1,1)` returns
cyan `[0,229,255,255]`, confirming clipping at the right edge.

No page exceptions, application console errors or failed application assets
occurred in these flows. Missing favicon responses are excluded consistently
with earlier cohorts. Phone checks are Chromium viewport/keyboard checks;
physical touch, native OS repeat cadence, focus-loss edge cases and other
browsers were not verified.

## Generation and isolation context (no score effect)

These facts were supplied with the import; this audit did not independently
rescan session logs or alter isolation/accounting records:

- `muse-spark-1.3-contributor-minimal` listed its own run folder
  `~/tetris-bench/runs/ec2bad263b13`, containing only `tetris/`, and saw only
  `tetris/`. That parent folder is listable by design under the current
  layout; the current isolation check no longer reports it. Its leftover
  `node server.mjs` workspace process was stopped after the implementation run.
- `muse-spark-1.3-contributor-low`, `muse-spark-1.3-contributor-medium`,
  `muse-spark-1.3-contributor-high` and `muse-spark-1.3-contributor-xhigh` had
  no outside access, T3 tool calls or benchmark lookups reported by the scan.
  Their `/tmp` scratch files were removed after each run.
- Runs executed **one at a time**. No contrary implementation evidence was
  found, and these supplied facts did not affect any quality score.

Read from each committed `STATISTICS.md` and `benchmark-runs.json`:

| Run ID | T3 thread ID | Native session ID | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| `muse-spark-1.3-contributor-minimal` | `mcp:c69002f8-d7c0-450f-8a5d-7b2ab2067145` | `ses_e91cc18ddffer8YAmLuPG0um8q` | 561,377 | 45.005s |
| `muse-spark-1.3-contributor-low` | `mcp:703b87e2-551f-424c-895d-d7535f4a1538` | `ses_e91cae81fffev0x61iZP5YHW9V` | 289,934 | 2m 1.225s |
| `muse-spark-1.3-contributor-medium` | `mcp:3c8d9ffc-09a1-46fe-acf4-f9b9f2614a0a` | `ses_e91c8b017ffe1T6ty9YY3OKu1p` | 262,101 | 43.277s |
| `muse-spark-1.3-contributor-high` | `mcp:224ccc06-1b74-4913-9d0c-337bc5b779b9` | `ses_e91c7ce6dffeLsZb0Re2Q5CXFU` | 338,304 | 2m 30.906s |
| `muse-spark-1.3-contributor-xhigh` | `mcp:3e7c00a7-afa7-4072-a037-7807905bb2ec` | `ses_e91c550baffehP5TkSCY5DUUzn` | 610,821 | 4m 44.107s |

All five have one benchmark user message and the recorded provider variants
minimal/low/medium/high/xhigh. Complete harness overhead, normalized request
and tool counts, cost and effective backend reasoning budgets remain
unverified; unknown is not zero. These figures are non-scoring context.

## Limits and final checks

This is focused conformance testing, not exhaustive state-space coverage,
a long playtest, cross-browser certification or physical-device testing.
Only confirmed reproducible findings were entered as bugs. Earlier audit
scores remain historical; the reference-assisted medium was not rescored.

Required commands after report/table regeneration:

- `python3 scripts/benchmark.py render`: passed.
- `python3 scripts/benchmark.py verify`: passed.
- `node .audit/verify-ranking.mjs`: passed; 163 local links, 26 rows, deductions/order/tables.
- `python3 -m unittest discover -s tests`: passed; 51 tests.
- `git diff --check`: passed.

The completed fresh-copy runner passes all five own workflows, engine probes
and both Chromium viewports per run. JavaScript syntax, this record’s local
links/tables, allowed file changes, browser/server cleanup and absence of
in-run dependencies/build output were checked. Parent agent owns the commit.
