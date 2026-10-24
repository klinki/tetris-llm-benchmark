# DeepSeek V4.1 Flash audits (low, high, max)

Audit date: **2026-10-24 (Europe/Rome)**. Three independent runs of
`deepseek-v4.1-flash` via OpenCode Go in T3 Code / OpenCode, each from the
single prompt “Read the README.md file and implement it”. Run IDs are
`deepseek-v4.1-flash-{low,high,max}`. This record supports
[`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).

## Scope and method

Re-read the ranking rubric, weights, methodology and coverage/conformance
tables, [`TETRIS.md`](../TETRIS.md), the recent [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md), [Gemini high](gemini-high-review.md),
[Muse](muse-review.md) and [GLM](glm-review.md) records and their engine,
browser and temporary-copy runners. Reviewed each delivered engine,
geometry/kicks, randomizer, scoring, input, renderer, bootstrap, HTML/CSS,
complete own tests, package/lock/config files and supplied server.
The predecessor `deepseek-pi` remains **7.30** under its historical audit;
none of its findings or scores was presumed to apply to these runs.

The same **0–10 half-point scale**, **40/20/20/10/10** weights and fixed
correctness deductions apply: critical −4/cap 4, major −1.5, minor −0.5.
Tokens, cost, time, reasoning labels and supplied isolation facts do not
change quality. Each bug is deducted once; implementation omissions in
own tests determine test coverage, and audit probes earn no own-test credit.

All installs/builds/tests/servers ran in randomly named disposable copies,
excluding dependencies and generated output. Low/high use milliseconds;
max uses seconds. Adapters convert time without changing the rules. All
three supplied servers honor `PORT`, so **no server or application code
needed modification**, even in the copies. Only free ports **41000–49999**
were used. Named Chromium sessions and server process groups were stopped;
temporary copies/screenshots/JSON were deleted after review. Work remained
on `main`, without commit, stash, reset or revert. Authored run files, registry,
pricing, repository scripts and repository tests were not edited. High had
a pre-existing Git-ignored `dist-test` tree (files timestamped 18:02:45 local,
during generation and before this audit); it was removed as generated output
so all three delivered directories finish without dependencies/build output.

Fresh `npm ci --ignore-scripts --offline`, `npm run build`, and declared
`npm test` passed for all three. Low passes **16 cases**, high **24**, max
**19**. Max's own `npm test` compiles the test graph into `.test-dist`; the
runner explicitly builds the delivered browser graph as well. All own game
fixtures use fixed seeds (or the low suite's deterministic random callback).
No flaky or seed-dependent own assertion was found. No failure was hidden
by retrying or changing a seed, unlike the separately documented GLM max case.

## Scores and rationale

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Bugs |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 8.0 | 7.5 | 9.0 | 8.0 | 8.5 | **8.15** | 1 major, 1 minor |
| high | 7.0 | 8.0 | 9.0 | 8.0 | 8.5 | **7.85** | 1 major, 3 minor |
| max | 8.0 | 8.0 | 9.0 | 7.5 | 9.0 | **8.25** | 4 minor |

Totals: low `3.20+1.50+1.80+0.80+0.85=8.15`;
high `2.80+1.60+1.80+0.80+0.85=7.85`;
max `3.20+1.60+1.80+0.75+0.90=8.25`.

Low's hard-drop spin loss plus mini/combo/PC errors form one grouped major
scoring finding, matching predecessor DeepSeek and Muse xhigh's grouped
scoring treatment. High's table-wide I-kick error is major, matching Muse
low's incorrect kicks. B2B eligibility, PC variants, soft transitions,
ceiling-buffer fidelity and action-reset-cap fidelity are separate minor
findings. The cap treatment matches the earlier non-blocking reset-policy
findings: ordinary timed locking and hard drop still work. Max has no
reachable hidden-lock fixture because its field rejects all above-top
cells; the reproduced ceiling failure is charged once, without an extra
hypothetical hidden-lock-out deduction. No presentation bug was found.

### Low — 8.15

Summary: **Canonical core and responsive UI; hard-drop spin loss,
incomplete scoring and soft-drop timing jump**.

Tests **7.5**: **16 cases / 256 lines** cover 25 seeded bags, non-consuming
peek, four-cell counts and fixed O geometry, monotone gravity helpers,
actual level-one gravity, wall movement, a concrete T CCW wall kick, exact
soft points, single/Tetris/B2B/combo totals, legal rotation-to-timed-lock
full-spin single, hold restriction/post-lock retrieval, grounded delay,
empty-floor I ghost, hidden lock-out and restart. The single/Tetris fixtures
also empty the board but assert no perfect-clear bonus. The own suite does
not assert exact hard-drop points, blocked-spawn behavior, exact reset
boundary/cap/ledge, independent obstructed ghost, mini classification,
higher-level combo, level crossing, spin credit through hard drop, full
canonical geometry or browser/input behavior. This is meaningful coverage,
comparable to Haiku high's 7.5, below broader 8.0–8.5 suites.

Code **9.0**, simplicity **8.0**: **1,268 source TS lines** across six
focused geometry, bag, game, input, renderer and main files; strict unused
checks, a DOM-free engine, seeded random injection, one millisecond clock,
short direct helpers and no runtime dependencies. Public state relies on
caller-maintained invariants. Matrix rotations and proportional canvas
rendering stay readable; styling/drawing account for much of the size.
UX **8.5** reflects distinct blocks, grid/outline ghost, five complete next
previews, labeled canvas, high-DPI sizing, full legend, DAS/ARR and blur
cleanup. The full phone cabinet fits, though the board shrinks to about
159×319; the desktop legend is below the first 800 px viewport and is
scrollable. There are no touch controls or used-hold dimming. These are
broader presentation observations, without a second penalty for rule bugs.

Confirmed findings:

1. **Major: hard drop loses spins; mini, combo and PC scoring are incomplete
   (−1.5).** Real CW into a grounded full-spin pose followed by zero-travel
   hard drop scores **0/100** for zero/single clears, rather than **400/800**.
   `hardDrop` sets `lastAction='drop'` before classification. Timed locks
   preserve full spins but classify minis as full, scoring **400/800** rather
   than **100/200**. At level two with a prior clear, a normal single awards
   **400**, versus **300**, because combo points include the level before
   the whole result is multiplied by level. Zero-distance single perfect
   clear scores **100**, versus **900**. These related errors receive one
   grouped deduction. Correctness **10.0 → 8.5**.
2. **Minor: normal-to-soft timer jump (−0.5).** Fifty `update(16)` calls
   leave O at y=0. Enable soft drop and `update(1)`: O reaches **y=16** and
   gains **16 points**. The faster interval consumes the accumulated 800 ms
   of normal time. Real Chromium ArrowDown independently reproduces it.
   Ordinary 100 ms soft movement is two rows/points. Correctness
   **8.5 → 8.0**.

### High — 7.85

Summary: **Broad rules and responsive reflow; inverted I kicks, B2B
scoring errors and soft-drop timing jump**.

Tests **8.0**: **24 cases / 382 lines** cover 100 seeded bags and deterministic
order, four-cell counts, centered spawns, selected kick data, board bounds/
row shifting/PC helpers, normal/full/mini/base/B2B/combo/PC/level helpers,
actual T and I floor rotations, exact hard/soft points, hold restriction/
post-lock retrieval, grounded delay, integrated single PC and blocked-spawn/
restart. The I-kick helper and floor expectations share the wrong y signs;
there is no independent canonical oracle. Spin tests are classifier/scoring
helpers rather than complete rotation-to-lock scoring. There are no exact
cap/ledge, obstructed ghost, mini B2B, ordinary-single PC after B2B,
higher-level combo, actual level crossing, hidden lock-out, hold-orientation,
input or browser assertions. The helper breadth earns 8.0, below the recent
8.5 suites' stronger scoring/input/invariant integration. Added probes do
not increase this score.

Code **9.0**, simplicity **8.0**: **1,330 source TS lines** across focused
board, constants, types, geometry, bag, spin, scoring, game, keyboard,
renderer and main modules. Strict types, a consistent millisecond clock,
seeded injection, small helpers and no runtime dependencies are readable
and proportionate. Engine state remains mutable; reset/restart and rotation
aliases add modest API weight. UX **8.5** reflects crisp labeled high-DPI
canvases, complete legend, dimmed hold, five previews, DOM stats and custom
DAS/ARR with focus cleanup. It displays two shaded buffer rows above its
20-row field. Mobile reflows supporting panels below the board: next begins
at y=865, but scrolling reaches it completely. This is ordinary vertical
reflow, without the earlier cohorts' horizontal clipping. No touch controls
or pause are provided.

Confirmed findings:

1. **Major: all eight I-kick transitions retain y-up signs (−1.5).** The
   engine adds offsets in y-down board coordinates. Every I transition's
   fourth/fifth vertical offsets have the opposite sign to canonical SRS;
   JLSTZ tables and all 28 shape states are correct. Place horizontal I at
   **rotation 0,x=3,y=19** on the 22-row field. CW reaches **rotation 1,
   x=1,y=18**, using its incorrect fourth test. Canonical SRS rejects that
   downward test and uses test five, reaching **x=4,y=17**. Both the full
   table oracle and the actual rotation reproduce this. Correctness
   **10.0 → 8.5**.
2. **Minor: mini line clears break B2B (−0.5).** After an 800-point Tetris,
   reset the combo and perform a legal final-rotation mini single. It
   awards **200**, versus **300**, and changes `backToBack` to false; total
   **1000**, versus **1100**. `scoreClear` only regards full spins and
   Tetrises as difficult. Mini base scores otherwise pass. Correctness
   **8.5 → 8.0**.
3. **Minor: ordinary single PC receives a prior-B2B bonus (−0.5).** Tetris,
   no-clear lock (combo broken), then a zero-travel single perfect clear
   yields **2100**, versus **1700** total. The single awards **1300**,
   versus **900**, because the previous B2B flag selects a fabricated
   1200-point single-PC bonus even though a normal single breaks B2B.
   Ordinary single PC and B2B Tetris PC award **900/4400** correctly.
   Correctness **8.0 → 7.5**.
4. **Minor: normal-to-soft timer jump (−0.5).** Fifty `update(16)` calls
   leave O at y=1; enable soft and `update(1)` moves it to **y=17** with
   **16 points**. Browser ArrowDown from controlled y=0 independently
   produces y=16/16 points. Correctness **7.5 → 7.0**.

### Max — 8.25

Summary: **Broad scoring and fitting UI; unlimited lock resets,
ceiling-buffer and B2B-PC gaps, soft-drop jump**.

Tests **8.0**: **19 cases / 351 lines** cover four seeded bag invariants,
four-cell counts/spawns, a concrete T floor kick, exact level-one cadence
and level-two/fifteen equation values, soft/hard distances and points,
grounded delay, hold restriction/post-lock availability, integrated single,
Tetris/B2B/combo, legal full-spin zero-clear, PC single and exact ten-line
level crossing, blocked spawn, pause/resume, floor ghost and reset. Pure
score helpers cover normal/full/mini line values. There is no integrated
mini, B2B continuity/break or B2B PC assertion, post-lock held-piece retrieval/
orientation reset, exact reset-cap/ledge, ceiling/hidden state, obstructed
ghost, complete SRS oracle, input or browser test. This earns the same 8.0
as Haiku max's broad but incomplete integration coverage.

Code **9.0**, simplicity **7.5**: **1,562 source TS lines**, focused geometry,
randomizer, pure rules, game, input, renderer and bootstrap modules, strict
unused/return checks, seconds throughout, deterministic options and no
runtime dependencies. The event callback separates UI effects from rules;
storage is guarded. Public mutable state, repeated spawn/hold initialization,
a substantial main/HUD cache and effect renderer add proportionate machinery.
UX **9.0** reflects clear high-DPI grid/glowing blocks/ghost, dimmed used
hold, five complete previews, labeled canvases, DOM score/streak/progress,
full required keyboard bindings, visible legend, pause, best-score storage,
restart button and responsive phone rails. The phone board is 174×348 and
all supporting state fits. Left Ctrl works although the visible legend
lists Z only for CCW. No touch controls are provided.

Confirmed findings:

1. **Minor: the fifteen-reset cap does not stop timer resets (−0.5).** Put
   O at **x=4,y=18** on the floor. Wait 490 ms and alternate left/right,
   thirty times. Wait another 490 ms, move left, advance 10 ms. After
   **15.2 seconds** there are still no locked cells. `lockResets` saturates
   at 15, but `touchLockDelay` unconditionally clears `lockTimer` before
   checking it. Ordinary 499/500 ms locking and airborne ledge safety work.
   Correctness **10.0 → 9.5**.
2. **Minor: no above-top buffer for ceiling SRS kicks (−0.5).** Use the
   actual T spawn **rotation 0,x=3,y=0** and stack cells **(4,2),(3,2)**.
   The current piece is collision-free. Canonical CW candidates one/two
   hit the stack; candidate three fits at **rotation 1,x=2,y=−1**, with
   no board overlap. The delivered `rotate(1)` instead returns **false**
   and leaves the piece unchanged: `canPlace` rejects negative cells.
   Its field has only 20 rows and no legal hidden placement/lock path.
   This demonstrates the buffer fidelity defect; an actual wholly hidden
   lock cannot be exercised under its own legal-placement rules and is
   not guessed or deducted separately. Correctness **9.5 → 9.0**.
3. **Minor: B2B Tetris PC uses the ordinary PC bonus (−0.5).** Tetris,
   no-clear lock to reset combo, then zero-travel Tetris perfect clear
   yields **4000**, versus **5200** total. Final placement is **3200**
   (1200 B2B clear + 2000 ordinary PC), versus **4400** (1200 + 3200 B2B
   PC). The PC helper has no B2B input. Single PC **900**, full/mini spins,
   ordinary B2B and level-two combo **300** pass. Correctness **9.0 → 8.5**.
4. **Minor: normal-to-soft timer jump (−0.5).** Fifty `update(0.016)` calls
   leave O at y=0; enable soft and `update(0.001)` moves it to **y=16**,
   earning **16 points**. Real Chromium ArrowDown independently reproduces
   it. Ordinary 100 ms soft movement awards two points. Correctness
   **8.5 → 8.0**.

## Reproduction and engine evidence

```sh
python3 .audit/run-deepseek-v41-audit.py --offline
```

Omit `--offline` when locked TypeScript is not cached. The default runner
installs/builds/tests all three, executes [the engine probes](deepseek-v41-audit.mjs),
and performs desktop/phone Chromium assertions via
[the browser snippet](deepseek-v41-browser.cjs). It reuses installed Chromium,
without downloading a browser. `--engine-only` explicitly skips browser
coverage; `--effort` selects one effort; `--playwright-cli` and
`--playwright-config` override local setup. `--artifacts-dir` optionally
retains JSON/screenshots **outside** the checkout. Nonzero commands, CLI
errors, missing browser results and changed recorded outcomes fail the audit.
A pass reproduces the documented defects as well as conformance.

Equivalent assertions cover all **28 canonical coordinate sets** (only a
fixed O-origin translation), seven colors, every CW/CCW kick table, concrete
T/I kicks in both directions and the differing I floor outcome; ten seeded
bags through real engine spawns; walls, queue, hold restriction/post-lock
swap/orientation reset; seven independently checked obstructed ghosts and
exact hard-drop coordinates/points; 499/500 ms locking, action cap and the
**ledge-move mid-air lock probe**. O waits 490 ms on a single support,
moves off, remains airborne across the old deadline for 20 ms and later
lands/locks on the floor. **All three pass ledge safety.**

Scoring fixtures test normal single/double/triple/Tetris, real final-rotation
full/mini zero/single via **both timed lock and hard drop**, fifth-kick
classification in high/max, B2B continuity through no-clear and break on a
normal single, mini B2B, level-two combo, level-crossing score, ordinary
single PC and B2B-adjacent single/Tetris PC. The latter probes establish
specific errors beyond the earlier cohorts' single-PC fixtures; earlier
runs retain their historical focused audits and were not rescored here.

Spin fixtures use T origin **(3,bottom−2)**, initial rotation 3, blockers
**(5,bottom−2),(3,bottom)** and either **(3,bottom−2)** for full or
**(5,bottom)** for mini. A single additionally fills row `bottom−1` at
x=0,1,2,6,7,8,9. Actual CW reaches rotation 0 at zero ghost distance.
`bottom` is 21 for low/high, 19 for max. PC single fills the bottom row
except x=3–6; I at (3,bottom−1), rotation 0, hard-drops zero rows. Tetris
uses a four-row well at column 4 and vertical I at (2,bottom−3).

The gravity equation and actual first-row boundaries were checked at
levels **1,2,5,10,15,20**: **1000/793 ms** at levels one/two. High applies a
**16 ms lower bound**, as do several historically audited engines (Gemini-4,
Sol OMP/Codex, Muse minimal/high); low/max use 1 ms. That fast-gravity floor
is recorded and accepted consistently with the existing scoring profile.
Equal-duration free falling at **60/144 Hz** agrees in both engine probes
and the **unchanged delivered requestAnimationFrame callback**. Normal-to-soft
fixtures use 16 ms frames and then 1 ms, below every browser clamp.
Blocked spawn, inert game-over actions and complete restart pass. Low/high
also end actual public-action wholly hidden locks with the next I spawn
independently open. Max's legal hidden path is unavailable as described above.

Rule basis remains the existing benchmark profile. The
[2009 guideline transcription](https://studylib.net/doc/27262492/2009-tetris-design-guideline)
sections 5.7, 7, 8, 10 and appendix A establish capped resets, gravity,
mini B2B, buffer/lock-out and SRS. The independent
[SRS table](https://tetris.wiki/Super_Rotation_System) uses positive Y up.
The [modern scoring reference](https://tetris.wiki/Scoring) supports the
same PC convention already used by the audits: additive 800 single and
3200 B2B Tetris PC bonuses. PC is a benchmark convention, not a claim that
every licensed version uses it. No new scoring category or weight was added.

## Chromium evidence

Playwright skill/CLI, installed **Chromium 156.0.8078.4**, **1280×800** and
**390×844**, supplied `npm start` behavior from temporary builds. T3 preview
status was inspected; the CLI follows the explicitly requested recent audit
workflow. No saved user browser profile was used. Screenshots at all six
viewports plus high's scrolled next queue were visually inspected.

| Run | Desktop board | Phone document width | Phone board | Phone supporting state | Application errors |
|---|---|---:|---|---|---|
| low | 291.56×583.13 at x=358.16 | 390 | 159.38×318.75 at x=40.94 | Entire 340 px combined canvas fits | None |
| high | 300×660 canvas at x=490 | 390 | 265.19×581 canvas at x=62.41 | Hold y=708; next y=865, fully reachable by scrolling | None |
| max | 286×572 at x=487 | 390 | 174×348 at x=103 | Hold x=21 and next x=301, complete rails fit | None |

Low's board is a region inside a scaled 640×700 canvas. High's canvas
includes two shaded buffer rows and a border; it displays all 22 rows.
Max's board is the scaled 300×600 canvas. Horizontal board geometry is
asserted within 0.02 px; all canvases fit horizontally. There is no phone
clipping finding. High's below-fold panels are vertical reflow, and its
scrolled next queue is independently asserted within the viewport.

Both viewports receive actual **Left, Right, Up, X, Z, Left Ctrl, Down,
Space, C**. Forwarding wrappers observe unchanged input/engine methods,
asserting side displacement, rotation `[1,1,−1,−1]`, soft rows/points, four
hard-locked cells and hold restriction. The simulation is frozen only in
the animation callback while keys/drawing remain live; 100 ms engine soft
time is driven explicitly. An independent 800 ms normal / real Down / 1 ms
fixture reproduces sixteen rows/points for each. Blocked spawn through
real Space, overlay **none → flex → none** in high/max, and **real R** reset
all pass. Low draws game-over in canvas. Application exceptions, failed
assets and console errors are absent; the low favicon 404 is excluded as
in prior audits. Refresh probes run the actual frame callbacks at both rates.

## Supplied generation/isolation context (no score effect)

These facts were supplied with the task; this quality audit did not rerun
the session isolation scan or alter its accounting records:

- **Max:** the import scan initially reported `cat` of
  `~/.local/share/opencode/shell/<hash>/sh_16eb0d85f001WE43LJ40qj7Ig9.out`.
  This was its **own background `npm start` log**, at the exact path OpenCode
  had just supplied as “Output is streaming to: …”. Commit **715a85e**
  exempts files handed by the harness to that same thread; max was imported
  **without findings**. No quality deduction follows from this exemption.
- **Low, high, max:** no other outside access, T3 tool calls or benchmark
  lookups were reported. Leftover servers and `/tmp` scratch were removed
  after each run; high/max had saved screenshots and CDP scripts there.
  The harness process was stopped first, so cleanup started no notification
  turn. Runs executed **one at a time**. No contrary implementation evidence
  was found.

Read, not recollected, from the unchanged registry and each `STATISTICS.md`:

| Effort | T3 thread | Native OpenCode session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:e1b5ff8a-cd39-41c5-af26-4b892d9fb4e2` | `ses_e9171aea1ffefdaIVWEHIg5Fdn` | 2,309,531 | 6m 54.369s |
| high | `mcp:bfb2fde0-82e8-4541-80e2-24ac1f8a661c` | `ses_e916b0d80ffeaWzOKpu3Kqd5QI` | 5,255,770 | 19m 30.263s |
| max | `mcp:399ef760-7a90-46f2-9bc6-bdf27672d0f8` | `ses_e9158ee5cffekhzYg5FC67z3HY` | 9,118,921 | 24m 21.634s |

All three have one benchmark user message and the exact recorded effort
labels low/high/max. Complete harness overhead and normalized request/tool
counts remain unverified; unknown is not zero. Usage/cost/time are non-scoring.

## Limits and validation

This is focused conformance testing, not exhaustive state-space coverage,
a long-duration playtest, cross-browser certification or physical touch
verification. Native OS repeat cadence, all focus edge cases and every
possible spin/PC arrangement were not tested. Max cannot legally enter a
wholly hidden pose, so its actual hidden-lock-out behavior is unavailable;
the ceiling failure is directly reproduced instead. Earlier scores remain
historical and additional B2B-PC fixtures here do not retroactively certify
earlier implementations. No suspected issue was recorded without a probe.

The final complete fresh-copy runner passed all three browser builds, own
suites, engine assertions and desktop/mobile browser passes. Required final
repository checks after recording and regeneration:

- `python3 scripts/benchmark.py render`: passed.
- `python3 scripts/benchmark.py verify`: passed.
- `node .audit/verify-ranking.mjs`: passed; 199 local links and 32 score rows.
- `python3 -m unittest discover -s tests`: passed; 53 tests, OK.
- `git diff --check`: passed.

JavaScript/Python syntax, audit Markdown links/tables, allowed changed paths,
unchanged run files and absence of in-run dependencies/build output were
checked. Parent agent owns the commit.
