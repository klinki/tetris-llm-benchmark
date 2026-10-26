# Gemini 4 Argon (high) audit

Audit date: **2026-10-24 (Europe/Prague)**. Run:
`gemini-4-argon-contributor-high`; model `gemini-4-argon-contributor` via
OpenCode Go, recorded variant `high`, harness T3 Code / OpenCode. The single
benchmark prompt was “Read the README.md file and implement it”. This record
supports [`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).

## Scope and comparability

Re-read the ranking rubric, weights, methodology, conformance and coverage
tables, [`TETRIS.md`](../TETRIS.md), the [October Gemini medium audit](october-review.md)
and its probes/browser/runner, and the recent [Haiku](haiku-review.md) and
[Sonnet](sonnet-review.md) workflows. Reviewed every delivered source file,
all own tests, HTML, CSS, TypeScript config, package files and supplied server.
This is an independent audit of high; medium's findings were not presumed.
The same half-point scale, fixed deductions and benchmark scoring profile
(including perfect-clear bonuses) apply. Tokens, cost, time, generation
attempts and isolation facts have no quality-score effect. Earlier scores
were preserved.

Work remained on `main`, without commit, stash, reset or revert. All installs,
builds and tests used disposable randomly named temporary copies, excluding
`node_modules`, `dist`, `dist-test` and `.git`. The run directory was neither
built nor edited. Servers used only free ports **41000–49999** and the
unmodified supplied `npm start` server with `PORT`. Named Chromium sessions,
server process groups and temporary directories were cleaned. Registry,
pricing, implementation files, repository scripts and tests were not edited.

## Scores and rationale

| Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted |
|---:|---:|---:|---:|---:|---:|
| 9.0 | 8.0 | 8.5 | 7.0 | 8.5 | **8.45** |

`9.0×0.40 + 8.0×0.20 + 8.5×0.20 + 7.0×0.10 + 8.5×0.10 = 8.45`.

Summary: **Broad rules support; missing perfect-clear bonus and clipped phone sidebars**.

Correctness starts at 10, with two independent minor deductions of 0.5.
Neither finding is deducted again from the other criteria. The 11 own test
groups earn 8.0 for ten seven-bag invariants, distinct colors, exact queue
changes, both wall boundaries, empty and obstructed ghost rows, exact
soft/hard-drop points, hold restriction/post-lock swap, concrete T CW and I
CCW kicks, grounded delay/reset behavior, exact Tetris/B2B/combo totals,
gravity-helper ordering and blocked-spawn/R restart. The bag/top-out cases
use unseeded randomness but assert invariants rather than random order.

The scoring test's title mentions singles/doubles/triples, but its assertions
exercise only Tetrises/B2B/combo. There are no full/mini spin integration,
B2B no-clear continuity/break, higher-level combo, perfect-clear, exact
gravity cadence/level progression, hidden lock-out, hold orientation-reset,
full canonical SRS, reset-cap/ledge or browser assertions. The lock test
checks 400 ms, a move reset and another 400+100 ms; checking the constant
`MAX_LOCK_RESETS === 15` does not establish the cap's behavior. Added audit
probes do not raise the own-test score.

Code 8.5 reflects strict typing, focused bag/board/geometry/engine/input/render
modules, consistent millisecond timing, copied state snapshots and no browser
runtime dependencies. State is otherwise publicly mutable, and the rules API
contains several redundant aliases. The **1,892 source TypeScript lines**
(excluding **298 test lines**) include verbose geometry/constants and a
751-line engine; readability remains good, while the amount of machinery
and repeated movement code earn simplicity 7.0, comparable to medium's 7.0.
LOC is descriptive evidence, not a scoring formula.

UX 8.5 reflects a polished, legible desktop board/ghost, five previews,
dimmed used hold, DOM scores, a complete keyboard legend, labeled focusable
playfield and visible restart button. Input uses native keydown repeat;
there is no custom DAS/ARR, touch control or device-pixel-ratio scaling.
The phone finding is charged once to correctness, consistent with the prior
audits; those broader presentation/input characteristics explain the UX score.

## Confirmed findings

### Minor: no perfect-clear bonus under the benchmark scoring profile

Fill row 19 at x=0,1,2,7,8,9 and place a horizontal I at x=3,y=18.
Its ghost is already y=18, so hard drop travels zero rows. The row clears,
the entire board becomes empty and the score is **100**, rather than
**900** (single 100 plus benchmark perfect-clear bonus 800).
`TetrisGame.lockPiece` has no empty-board bonus branch. This is one narrow
scoring-fidelity omission, not a missing scoring system.

Scoring effect: correctness **10.0 → 9.5**.

### Minor: supporting state is clipped on phones

At **390×844**, document width is **543 px**. The 300×600 playfield remains
fully visible at x=35 (304×604 frame at x=33), but the hold/stats panel starts
at **x=−153** and next/controls at **x=353**. Hold canvas starts at **x=−128**;
next canvas at **x=388**, so their piece contents are outside the initial
viewport. The 170/190 px side columns and fixed board have no narrow reflow.
Both DOM measurements and the visually inspected screenshot reproduce it.

Scoring effect: correctness **9.5 → 9.0**. This is one responsive-layout
finding, without a second UX deduction.

## Engine evidence and reproduction

```sh
python3 .audit/run-gemini-high-audit.py --offline
```

Omit `--offline` if the locked npm dependency is not cached. The runner
performs `npm ci --ignore-scripts`, declared `npm test` (including build),
[`gemini-high-audit.mjs`](gemini-high-audit.mjs), and the Chromium pass in
[`gemini-high-browser.cjs`](gemini-high-browser.cjs). Passing intentionally
asserts the recorded defective outcomes as well as the conforming fixtures.
It does not certify a bug-free game. `--engine-only` explicitly skips browser
checks; `--playwright-cli`/`--playwright-config` override local browser setup.
`--artifacts-dir` optionally retains screenshots and JSON outside the checkout.

The engine probe asserts:

- All **28 canonical SRS coordinate sets**, seven distinct colors and every
  CW/CCW kick-table transition for every type, using the same independent
  oracle as Sonnet/October; actual T/I wall kicks in both directions.
- Ten seeded bags through actual engine spawns; walls, five-item queue,
  hold restriction/post-lock swap/orientation reset; all seven obstructed
  ghost geometries, four distinct cells and exact hard-drop coordinates/points.
- Exact **499/500 ms** grounded locking, behavioral **15-reset cap**, and
  the **ledge mid-air lock probe**: O rests on one support for 490 ms, moves
  off it, remains airborne across another 20 ms, then lands/locks on the floor.
- Exact single/double/triple/Tetris, full/mini zero/single spin scores after
  actual rotation, fifth-kick classification with the three-corner condition,
  B2B continuity through no-clear placement and break on a single, level-two
  combo **300**, pre-clear-level scoring and the defective perfect clear.
- **1000/793 ms** level-one/two gravity, level increase, soft-drop points,
  blocked-spawn game over, inert game-over actions, restart, pause and copied
  snapshots. Deterministic setup uses emitted ordinary private properties;
  implementation code is not patched.
- Entirely hidden lock-out through public moves/rotations from the actual T
  spawn: blockers at (0,0),(8,0),(0,1),(2,2),(7,2); move left twice and CW
  four times. The T ends at rotation 0,x=0,y=−2, fully above visible row 0
  and grounded. Zero-travel hard drop ends the game while the next I spawn
  at x=3,y=0 remains independently valid.

Soft drop differs from the recent Haiku/Sonnet runs: fifty 16 ms normal
updates leave O at y=0, then real Input ArrowDown and 1 ms move it to **y=1**
with **one point**. Each repeated keydown moves/scores once and resets the
normal gravity timer. Engine and browser both confirm there is **no accumulated
normal-time jump** in this run. Native OS repeat cadence was not measured.

## Browser evidence

Playwright CLI with locally installed **Chromium 156.0.8078.4** at
**1280×800** and **390×844**, using the supplied server from the temporary
build. T3 preview status was inspected; the CLI followed the explicitly
requested prior audit workflow and the Playwright skill. No saved user
browser profile was used. Desktop and phone screenshots were visually
inspected and discarded after review, consistently with earlier audits.

| Viewport | Document width | Playfield / frame | Hold / next panel X | Active overlay | Application errors |
|---|---:|---|---|---|---|
| 1280×800 | 1280 | 300×600 at x=480 / 304×604 at x=478 | 292 / 798 | display:none; aria-hidden=true | None |
| 390×844 | 543 | 300×600 at x=35 / 304×604 at x=33 | −153 / 353 | display:none; aria-hidden=true | None |

Real keys **Left, Right, Up, X, Z, Left Control, Down (120 ms), Space, C**
were asserted via forwarding `handleKey` observations: exact horizontal
displacement, rotation directions `[1,1,-1,-1]`, one soft-drop row/point,
four locked cells and hold restriction. Playwright's single down event does
not synthesize OS repeats; three additional real repeated keydowns each
move one row and award one point. Animation-driven engine time is frozen
for deterministic assertions, while actual DOM listeners and rendering remain
installed. An explicit 800 ms/Down/1 ms sequence confirms the timing result.
A blocked spawn via real Space shows the overlay, and **real R** resets
score/hold/board/availability and hides it again. No page exceptions,
application console errors or failed application assets occurred; the missing
favicon is excluded consistently with earlier cohorts.

## Generation and isolation context (no score effect)

The following isolation/generation facts were supplied by the parent import;
this audit did not independently rescan session logs:

- This is the **second implementation attempt**. First-attempt T3 thread
  `mcp:d0f4d270-f65d-4b0a-8827-cd2b60b1a914` was interrupted after
  **8m 31.5s** and **682,107 partial tokens** when the agent ran
  `lsof -ti:8321 | xargs kill -9` to free its port. This also killed the
  OpenCode server holding its own browser/fetch connections to 8321, ending
  the turn. That attempt was **not imported** and is not scored.
- Four preceding launch attempts failed before any model call because
  OpenCode could not resolve the real paths of then-unlistable workspace
  parent folders; this was fixed in commit `e62f847`.
  Both are described in detail in the
  [abandoned-attempts record](gemini-high-attempts.md).
- The imported attempt's isolation scan found **no outside access, T3 tool
  calls or benchmark lookups**. Runs execute **one at a time**. The reviewed
  implementation supplied no contrary evidence.

Read, rather than recollected, from its generated
[`STATISTICS.md`](../gemini-4-argon-contributor-high/STATISTICS.md) and registry:
T3 thread `mcp:d72913c3-6f3d-480b-9dd5-0eadd0f387a3`, native OpenCode session
`ses_e94aafba5ffeXDNHhPc2N5pa6K`, recorded variant `high`, one benchmark user
message, **1,125,477 tested-agent tokens** (105,616 uncached input, 969,031
cache read, 0 cache write, 50,830 output) and **13m 9.707s** elapsed.
These apply only to the imported attempt. Complete harness overhead, cost,
normalized model-request/tool counts and the effective backend reasoning
budget remain unverified; unknown is not zero.

## Limits and final validation

Focused engine conformance and Chromium layout/keyboard flows were checked;
this is not exhaustive state-space coverage, a long-duration playtest,
cross-browser comparison or physical touch/native-repeat test. No unconfirmed
suspected issue was entered as a bug. No earlier implementation was rescored.

Required checks after regeneration:

- `python3 scripts/benchmark.py render`: passed.
- `python3 scripts/benchmark.py verify`: passed.
- `node .audit/verify-ranking.mjs`: passed; 139 local links and 21 score rows.
- `python3 -m unittest discover -s tests`: passed; 50 tests.
- `git diff --check`: passed.

The final fresh-copy runner, script syntax, audit links/tables, unchanged run
files and absence of in-run build/dependency output were also checked.
