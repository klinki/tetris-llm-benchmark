# Claude Sonnet 5.5 audits (low, medium, high, xhigh)

Audit date: **2026-10-24 (Europe/Prague)**. Four independent
`claude-sonnet-5-5` runs in T3 Code / Claude Agent SDK, each from the single
prompt “Read the README.md file and implement it”. This record supports
their entries in [`ranking.json`](../ranking.json) and
[`RANKING.md`](../RANKING.md).

## Scope and comparability

Read the full ranking rubric, methodology, conformance and test-coverage
tables, the [Haiku audit](haiku-review.md), its engine/browser probes and
runner, and the [October 23 Opus/Muse audit](oct23-review.md). Read every
Sonnet source file, complete own test suite, page, stylesheet, build config
and server against [`TETRIS.md`](../TETRIS.md). The same 0–10 half-point
scale, weights, severity deductions, scoring profile and viewport sizes
apply. No earlier score was changed. Tokens, time, cost and effort labels
have no quality-score effect.

All installs, builds, tests and servers used disposable `mkdtemp` directories,
excluding `node_modules`, `dist`, `dist-test` and `.git` when copying. Only
free ports **41000–49999** were used. Medium hard-codes 8321; only its
temporary server copy's port constant was substituted, preserving routing
and MIME handling. The other servers honor `PORT`. Every named browser and
server process group was closed, and temporary copies/artifacts were removed.
The checkout remained on `main`; no commit, stash, reset or revert was made.
Implementation files, registry, pricing, scripts and repository tests were
not changed. No build output or dependencies were created in any run folder.
A pre-existing ignored `claude-sonnet-5-5-xhigh/dist-test` tree contained
16 generated JavaScript/map files timestamped 02:03:34 CEST, before this
audit (and the 02:03:52 import commit). It was removed to satisfy the clean
run-directory requirement; no implementation source was removed.

## Scores and rationale

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Confirmed bugs |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 7.0 | 6.0 | 8.5 | 9.0 | 8.0 | **7.40** | 1 major, 3 minor |
| medium | 8.5 | 7.5 | 9.0 | 8.5 | 8.0 | **8.35** | 3 minor |
| high | 9.0 | 8.0 | 9.0 | 8.0 | 8.5 | **8.65** | 2 minor |
| xhigh | 9.5 | 8.5 | 9.0 | 8.0 | 9.0 | **9.00** | 1 minor |

Weighted totals use `0.40C + 0.20T + 0.20Code + 0.10S + 0.10UX`:

- Low: `2.80 + 1.20 + 1.70 + 0.90 + 0.80 = 7.40`.
- Medium: `3.40 + 1.50 + 1.80 + 0.85 + 0.80 = 8.35`.
- High: `3.60 + 1.60 + 1.80 + 0.80 + 0.85 = 8.65`.
- Xhigh: `3.80 + 1.70 + 1.80 + 0.80 + 0.90 = 9.00`.

Correctness starts at 10. A major deducts 1.5 and a minor 0.5. Findings are
charged once, not again to code/tests/UX. Test omissions determine test
quality; audit-added probes do not count as implementation-owned tests.
The soft-drop transition is the same non-blocking timing/control defect
scored minor in Haiku. Missing advanced scoring in low is one grouped
major, matching DeepSeek/Cat-jam; medium's isolated missing perfect-clear
bonus is one minor, matching Gemini/Muse/Haiku max. Whole-piece hidden
lock-out and supporting-panel overflow use Haiku max's minor severities.

### Low

Summary: **Basic scoring only; hidden lock-out missing, soft-drop timing
jump and clipped phone sidebars**.

All **8 own tests pass**. Tests **6.0** reflects exact hard-drop points,
wall bounds, first-hold/restriction, an eventual grounded lock, a normal
clear, a four-turn T rotation-state check and stack-to-top-out/restart.
The “seven-bag” test observes only the active piece plus four previews
(five draws), so it does not test even one whole bag. The line-score test
uses `>=100`; the rotation test asserts only the final rotation number.
There is no actual kick, complete geometry oracle, independent ghost,
soft-drop/gravity/level, reset cap/ledge, post-lock hold swap/orientation
reset, spin/B2B/combo/perfect-clear or hidden lock-out assertion. Its
coverage is narrower than the 6.5–7.5 suites with meaningful bag, gravity
or scoring assertions, despite all printed cases passing.

Code **8.5** and simplicity **9.0** reflect **397 source TS lines**, strict
typing, matrix-generated rotations, clear short engine methods, no runtime
dependencies and little machinery. Geometry and headless rules are separate;
input, drawing and bootstrap share a compact 117-line entry module. Public
state supports deterministic fixtures but relies on caller discipline.
Browser UX **8.0** reflects readable desktop colors, board, ghost, hold,
four previews and stats, with no keyboard legend, canvas label, high-DPI
scaling or touch controls. Missing optional polish is not an extra bug.
The confirmed layout defect is deducted only from correctness.

### Medium

Summary: **Full/mini spins, B2B and combos work; no perfect-clear bonus,
soft-drop timing jump and clipped phone sidebars**.

All **12 own tests pass**. Tests **7.5** reflects two seeded whole bags,
walls, exact hard-drop points/cells, ghost-to-lock coordinate agreement,
an actual I wall kick, first/restricted/post-lock hold, grounded lock delay,
level progression/gravity comparison, an exact integrated T-spin double
and blocked-spawn/restart. The Tetris assertion accepts any score `>=800`.
No suite assertion covers soft drop, exact gravity boundary, mini scoring,
B2B/combo, perfect clears, level-crossing score, hidden lock-out, exact
499/500 ms/reset-cap/ledge behavior, hold orientation reset, full 28-state
geometry or browser behavior. Audit probes fill evidence gaps without
raising the own-test score.

Code **9.0**, simplicity **8.5**: **622 source TS lines** excluding its
147 test lines, across geometry, engine, renderer and bootstrap. Strict
types, one millisecond clock, direct helpers, a dependency-free renderer
with device-pixel-ratio scaling, DAS/ARR and focus-loss cleanup keep the
implementation readable and proportionate. The engine maintains six
queued pieces and renders five; the task requires a next queue, not a
specific count, so this is not a defect. Browser UX **8.0** reflects clear
desktop hierarchy, ghost, hold/queue/stats and beveled blocks; the page
has no keyboard legend, canvas label or touch controls. Phone overflow is
charged only to correctness.

### High

Summary: **Broad rules and timing tests; soft-drop timing jump and clipped
phone sidebars**.

All **24 own tests pass**. Tests **8.0** reflects five seeded bags,
partial exact T/O/I geometry and kick-table assertions, wall/floor/line
shift helpers, concrete successful T kick and completely blocked I rotation,
exact gravity and drop points/cells, independent obstructed O ghost row,
hold restriction/post-lock swap, exact grounded lock boundary and movement
reset, exact Tetris and integrated full T-spin double/non-spin double,
scoring helpers for normal clears/B2B/combo/full/mini, blocked-spawn/restart
and pause. These are broader and more precise than Haiku high's ten cases.
Its purported reset-limit case moves repeatedly and then waits a full
500 ms; it would also pass an unlimited-reset implementation, so it does
not establish the cap. Tests omit integrated mini, B2B/combo chains and perfect clears; hidden
lock-out; exact level crossing/higher-level combo; hold orientation reset;
complete geometry, ledge and soft-drop-transition/browser checks. That
leaves it below the stronger 8.5 integration suites and Opus's 9.0 suite.

Code **9.0**, simplicity **8.0**: **873 source TS lines**, plus **280 own
test lines**, across focused board, pieces, bag, pure scoring, engine,
input, renderer and entry modules. Strict typing, small helpers, consistent
milliseconds, one animation clock, DAS/ARR and focus release are clear.
Public mutable engine/board state is convenient but caller-maintained.
Browser UX **8.5** reflects crisp high-DPI blocks, clear supporting state,
ghost, scoring banners, pause and a complete visible keyboard legend.
There is no canvas label or touch input. The sidebar defect is charged
only to correctness, as in the earlier cohorts.

### Xhigh

Summary: **Broad rules, strong integration/input tests and a fitting phone
layout; soft-drop timing jump**.

All **25 own tests pass**. Tests **8.5** reflects ten seeded bags and
non-consuming peek, partial exact T/I/O geometry, exact I/O/T spawns,
walls, actual I wall kick and blocked rotation, exact hard/soft-drop
points/cells, obstructed ghost-to-lock geometry, exact five-piece queue
progression, hold restrictions/post-lock swap, gravity and grounded delay,
bounded eventual locking under repeated movement, integrated 900-point perfect clear,
Tetris/B2B/combo totals and messages, full-spin double versus non-spin,
level helpers, blocked spawn, hidden lock-out, restart guard, pause and
precise DAS/ARR input actions. This is broad behavioral integration, not
credit for the raw case count. It lacks any mini-spin assertion, full
scoring-table oracle, B2B break/no-clear continuity, exact level crossing,
higher-level combo, hold orientation reset, complete shape oracle, ledge,
soft transition and browser tests. The movement-reset case bounds eventual
locking but does not pin the cap to exactly fifteen resets. Opus's stronger scoring/timing suite
remains 9.0; Haiku xhigh also earns 8.5 with different strengths (integrated
minis and a seeded invariant simulation).

Code **9.0**, simplicity **8.0**: **896 source TS lines**, plus **342 test
lines**, in focused board, constants, bag, pieces/kicks, scoring, engine,
input, renderer and entry modules. Strict types, injectable piece source,
small methods, a 40-row field, one millisecond clock, focus-loss cleanup
and no browser runtime dependencies are proportionate. Browser UX **9.0**
reflects a clear responsive presentation, labeled canvas, complete keyboard
legend, hold dimming, high-DPI rendering and pause. The phone view fits all
state and controls, though the scaled board is smaller; there are no touch
controls. The timing defect is charged only to correctness.

## Confirmed findings and exact reproductions

### All four: minor soft-drop timer discontinuity

At level one, an O-only game receives fifty `update(16)` calls. It remains
at its starting row while accumulating 800 ms of normal gravity. Enable
soft drop, then call `update(1)`. The O moves **16 rows** and earns **16
points**, consuming the previous time at the new 50 ms interval:

| Run | Before Y | After Y | Score after 1 ms |
|---|---:|---:|---:|
| low | 2 | 18 | 16 |
| medium | 1 | 17 | 16 |
| high | 1 | 17 | 16 |
| xhigh | 19 | 35 | 16 |

All steps are below each delivered browser's 100 ms frame cap. The engine
probe uses the real public setter (medium's public boolean). Independently,
the browser probe pauses only animation-driven engine updates, applies the
same frame-sized calls to the delivered `Game.update`, sends ArrowDown
through the real DOM handler, then advances 1 ms. It reproduces each exact
row/score result. No input handler or engine behavior is replaced.

The cause is changing the soft-drop flag without resetting/rescaling the
normal-gravity accumulator. Movement and excess points are one cause and
one minor deduction per run, matching the Haiku transition finding.

### Low: major incomplete advanced scoring (one grouped deduction)

Legal zero-distance rotation-to-lock fixtures produce full/mini spin scores
of **0** without a line and **100** with a single, versus **400/800** for
full and **100/200** for mini. Two Tetrises separated by a no-clear lock
total **1600**, versus **2000** with B2B; a level-two single with a prior
clear awards **200**, versus **300** with combo. A single perfect clear
awards **100**, versus **900**. Only normal line scores/drop points are
implemented. These omissions are grouped as one major scoring-feature
finding, not individually deducted. Ordinary single/double/triple/Tetris
scores and exact drop points pass their targeted fixtures.

### Medium: minor missing benchmark perfect-clear bonus

Fill row 21 except columns 3–6, place a horizontal I at x=3,y=20 and hard
drop at zero travel. The board becomes empty and lines becomes one, but
score is **100**, versus the benchmark convention's **900**. The scoring
method has no empty-board branch. Equivalent high/xhigh fixtures award
900. Low's identical omission belongs to its grouped major above.

### Low: minor missing wholly hidden lock-out

Use an O,T,I source. Move the actual O four columns left, then place J
stack cells at **(2,2), (3,3), (4,3)**. Hold brings T to its real spawn,
**rotation 0,x=3,y=1** (the stack prevents the immediate extra row drop).
Public CW uses SRS test 3, reaching **rotation 1,x=2,y=0**. Public CCW and
two left moves produce **rotation 0,x=0,y=0**. Ghost remains y=0. Hard drop
travels zero rows and locks at **(1,0), (0,1), (1,1), (2,1)**, entirely
above visible row 2. Nevertheless `gameOver` stays **false** and I spawns
legally. The probe independently asserts that incoming I's spawn fits.

Only stack cells were injected; current piece, rotation flags and lock
method were not assigned. Blocked-spawn game over works. The missing
whole-piece lock-out is therefore a distinct minor fidelity finding,
matching Haiku max. Equivalent public-action fixtures (translated by 18
rows for xhigh) correctly end medium/high/xhigh.

### Low, medium, high: minor phone supporting-state clipping

At **390×844**, each centered fixed-width canvas preserves the full
**300×600 board at x=45** but extends beyond both sides. Hold and some
stats are off the left; next and medium's stats extend past the right:

| Run | Document width | Canvas border box X / width | Hold label X | Next label X |
|---|---:|---|---:|---:|
| low | 527 | −137 / 664 | −120 | 360 |
| medium | 485 | −95 / 580 | −75 | 365 |
| high | 496 | −106 / 602 | −85 | 365 |

This is **supporting-state clipping**, not a clipped or collapsed board.
It is one minor responsive-layout finding per run, matching Haiku max
and Gemini's sidebar severity. Xhigh has **390 px document width**, a
358 px fitting canvas at x=16, and a **161.75×323.49** playfield at
**x=114.13**; all supporting state and the reflowed legend fit.

## Engine coverage and one-command reproduction

```sh
python3 .audit/run-sonnet-audit.py --offline
```

Omit `--offline` if dependencies are not cached. The default command runs
all four locked `npm ci --ignore-scripts` installs, every declared `npm test`
(including each build), the [engine probe](sonnet-audit.mjs) and the
[Chromium snippet](sonnet-browser.cjs). A matching installed Playwright
Chromium is reused when available; `--playwright-cli` and
`--playwright-config` can select a CLI/launch configuration. It does not
download a browser automatically. `--engine-only` explicitly skips browser
checks and is not a full reproduction of layout/real-keyboard findings.
`--artifacts-dir` may retain browser JSON/screenshots outside the checkout
for inspection; otherwise all output is disposable.

The runner fails on nonzero installs/tests/probes, CLI error sections, missing
final browser results, changed documented outcomes or application errors.
The initial complete pass and the tightened fresh-copy rerun both passed all
own tests, engine and browser assertions. Temporary logs and all eight
screenshots were inspected outside the repository.

Equivalent engine probes assert:

- All **28 canonical SRS states**, allowing only one fixed O-origin
  translation; seven distinct colors; every CW/CCW kick table and concrete
  T/I wall-kick outcomes in both directions.
- Ten seeded seven-bags through each engine's actual piece sequence; walls,
  queue/hold restriction, post-lock swap/orientation reset; four distinct
  ghost cells and exact hard-drop landing coordinates/points for all seven
  shapes with an obstruction.
- **499/500 ms** grounded locking, a **15-reset cap**, and the **ledge
  mid-air lock probe**: rest O on one supporting cell for 490 ms, move off
  it and cross the stale deadline for 20 ms while still airborne. All four
  stay airborne and later land/lock on the floor. Xhigh keeps the timer
  while airborne but consults it only when grounded and resets it upon
  descent; that representation is not a mid-air-lock bug.
- Exact single/double/triple/Tetris scores, normal/full/mini zero/single
  spin integration after real rotation, fifth-kick classification in the
  three engines supporting spins, B2B continuation through a no-clear lock
  and break on a single, level-two combo, pre-clear-level scoring and
  perfect clears. Low's omissions and medium's PC result are asserted as
  documented defects, not labeled conformance passes.
- Normal level-one **1000 ms** and level-two **793 ms** gravity, ordinary
  soft movement/points, level increase, blocked-spawn game over, inert
  game-over movement/drop/hold/update, restart, and public-action hidden
  lock-out fixtures. Ordinary emitted private properties are used only to
  construct deterministic fixtures; implementation source is not patched.

## Browser evidence

Playwright CLI, Chromium **156.0.8078.4**, **1280×800** and **390×844**.
Each temporary build used its supplied `npm start` behavior. T3 preview
status was inspected; the CLI was used to follow the explicitly requested
Haiku reproduction workflow and the Playwright skill. No browser profile
containing user logins was used.

| Run | Desktop canvas / board | Phone canvas / board | Application errors |
|---|---|---|---|
| low | 664×604 / 300×600 at x=490 | 664×604 at x=−137 / 300×600 at x=45 | None |
| medium | 580×600 / 300×600 at x=490 | 580×600 at x=−95 / 300×600 at x=45 | None |
| high | 602×602 / 300×600 at x=490 | 602×602 at x=−106 / 300×600 at x=45 | None |
| xhigh | 660×628.19 / 298.19×596.39 at x≈319.17 | 358×340.73 at x=16 / 161.75×323.49 at x≈114.13 | None |

Canvas measurements include borders; playfield measurements are the drawing
region inside the combined board-and-panels canvas, derived from the
reviewed renderer offsets and CSS content scale. Xhigh's native canvas is
664×632 scaled to 660 px on desktop and 358 px on phone. Y positions vary
with font metrics and are not asserted.

Real key sequence: **Left, Right, Up, X, Z, Left Control, Down (120 ms),
Space, C**. Forwarding prototype wrappers record arguments and before/after
state without changing command behavior. Assertions require each horizontal
displacement, rotation directions `[1,1,-1,-1]`, soft movement/points,
four hard-locked cells and hold restriction. A deterministic blocked-spawn
fixture then exercises **real R restart**, asserting playing state, score
zero, empty hold and restored hold availability. All four draw overlays in
canvas; active/game-over state and screenshots agree.

Page exceptions, application console errors and failed application assets
were absent in the exercised flows. Missing favicon requests were excluded
consistently with earlier cohorts. The phone pass checks Chromium CSS layout,
not physical touch. No run supplies touch controls. Source review and the
screenshots establish that low/medium omit a visible keyboard legend;
high/xhigh supply one. Xhigh also labels the canvas.

## Isolation and non-scoring generation context

The supplied import evidence records these facts; this quality audit did
not independently rescan the implementation sessions or alter their
isolation/accounting registry entries:

- **Low:** the scan reported one reference, `../dist/game.js`. This is a
  false positive: the import specifier in agent-written
  `test/logic.test.mjs` resolves to its own workspace's emitted `dist/game.js`.
  Import used `--allow-outside`, so the finding remains stored in the run's
  registry entry. No code-quality deduction follows from that false positive.
- **Medium, high, xhigh:** no outside access, T3 tool calls or benchmark
  lookups. Their `/tmp` scratch files were removed after each run.
- Runs were executed one at a time. The supplied isolation facts have no
  score effect; the audit found no contrary implementation evidence.

Existing generated statistics supply these exact mappings and non-scoring
primary usage/timing figures; they were read, not recollected:

| Run | T3 thread | Native session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:6ad76334-27d8-429e-a68c-77c20dbe0924` | `fa2d55e3-310f-4f5e-8f06-e75285daa37b` | 124,165 | 1m 3.761s |
| medium | `mcp:507597f8-9371-4181-b6db-4df6f55d095c` | `878b843e-169f-4728-a1e7-c9d6d7a71c02` | 494,455 | 2m 30.629s |
| high | `mcp:0f851849-3645-44d5-9600-60b89daea688` | `d63fa229-395c-47e2-9882-f042ba73abc1` | 978,719 | 4m 44.511s |
| xhigh | `mcp:878d20d7-db3d-4a8a-a862-47d52df2e8c7` | `195842b4-66e8-4734-9179-2621d2ac0e70` | 2,531,771 | 9m 23.043s |

These preserve the recorded effort labels low/medium/high/xhigh. Model
request counts, normalized tool counts, cost and complete harness overhead
remain unverified in the supplied reports; unknown is not zero.

## Limits and repository validation

This is a focused conformance audit, not exhaustive state-space coverage,
a long-duration playtest, a cross-browser comparison or a physical touch
test. Only the documented scoring fixtures and Chromium viewport/input
flows were exercised. No suspected issue was entered as a bug without a
reproduction. Earlier cohort scores remain their historical audits.

Required final checks (after generating both ranking tables):

- `python3 scripts/benchmark.py render`: passed.
- `python3 scripts/benchmark.py verify`: passed.
- `node .audit/verify-ranking.mjs`: passed; 128 local links and 20 score rows.
- `python3 -m unittest discover -s tests`: passed; 49 tests, OK.
- `git diff --check`: passed.

The final runner, audit Markdown links/tables and both JavaScript syntaxes
were checked separately. The four run folders contain no `node_modules`,
`dist` or `dist-test` from this audit. Only audit/report files were changed;
the parent agent can review and commit them.
