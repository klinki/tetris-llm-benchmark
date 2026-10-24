# Claude Haiku 5.5 audits (low, medium, high, xhigh, max)

Audit date: 2026-10-24 (Europe/Prague). The original high review follows;
the xhigh/max and low/medium additions and shared runner are appended below. Original run: `claude-haiku-5-5-high`;
model `claude-haiku-5-5`, effort `high`, T3 Code / Claude Agent SDK.
Imported 2026-10-23. This record supports its entry in
[`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).

## Scope and comparability

Read the full ranking rubric, methodology, conformance/coverage tables and
earlier implementation audits, especially Opus 5.5. Also reviewed the October
23 review/runner/probes, common engine probes and browser record before
auditing the delivered source and all ten tests against [`TETRIS.md`](../TETRIS.md).
The same half-point scale, weights, fixed severity deductions, benchmark
scoring profile and desktop/phone viewport sizes apply. Timing, tokens, cost
and model identity do not affect quality. Earlier run scores are unchanged.

Builds/tests used fresh temporary copies excluding `node_modules`, `dist`,
`dist-test` and `.git`. The original run was not built, edited or fixed.
Intentional existing checkout edits were preserved; no stash, commit or git
history operation was performed. Registry, pricing, scripts and implementation
files were not edited by this audit. Generated artifacts remain outside the
repository.

## Scores and rationale

| Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted |
|---:|---:|---:|---:|---:|---:|
| 9.0 | 7.5 | 9.0 | 8.0 | 8.5 | **8.55** |

`9.0×0.40 + 7.5×0.20 + 9.0×0.20 + 8.0×0.10 + 8.5×0.10 = 8.55`.

Summary: **Broad rules support; soft-drop timing jump and clipped phone playfield**.

Correctness starts at 10 and loses 0.5 for each of the two confirmed minor
findings below. They are not deducted again from code, tests or UX. The
soft-drop issue is a non-blocking transition/timing defect: the feature works,
but the initial movement and points depend incorrectly on prior normal time.
The phone finding follows the same severity and treatment as Opus's layout.

The ten deterministic own tests earn 7.5 for seeded bags, walls, exact drop
points/locked cells, exact single/perfect-clear scoring, an actual I wall kick,
hold restrictions, grounded delay, level-one gravity, blocked spawn/restart
and full/mini spin helper assertions. Coverage is substantially narrower than
Opus's 19 cases: no soft-drop assertion, complete shape oracle, independent
ghost geometry, exact lock boundary/reset cap/ledge test, integrated spin
scoring, B2B/combo, level progression or browser assertions. Audit probes do
not count as the run's own tests.

The 876 TypeScript source lines are split into focused geometry, board, bag,
scoring, engine, input, renderer and entry-point modules. Strict typing,
consistent seconds-based timing, useful small methods, no browser runtime
dependencies and restrained abstractions earn code 9.0 and simplicity 8.0.
The active-piece getter returns its underlying object despite a read-only
TypeScript type; fixture probes can use ordinary emitted private properties.
Desktop presentation is clear, with hold, five previews, stats, a ghost and a
complete keyboard legend. UX 8.5 matches the restrained Opus presentation;
there are no touch controls or canvas accessibility labels. Phone clipping
has already been charged to correctness.

## Confirmed findings

### Minor: starting soft drop reuses accumulated normal-gravity time

At level one, create an O-only game and call `update(0.016)` fifty times.
The active O remains at y=18 and the gravity accumulator holds 0.8 seconds.
Send ArrowDown through the real `Input.keyDown` path, then `update(0.001)`.
The piece moves to y=34 and score becomes 16: sixteen rows and points in
one millisecond of soft-drop time. All time steps are below the browser
loop's 0.25-second cap; this reproduction does not rely on one huge update.

`Game.setSoftDrop` only changes a boolean. The next `update` consumes the
existing normal-gravity accumulator at the new 0.05-second soft interval,
with one point per row. Resetting or rescaling the accumulated time would
prevent this discontinuity. Playwright independently observed twelve rows
and twelve points during a 120 ms real ArrowDown hold; prior normal time
accounts for the excess over ordinary 20-rows-per-second soft movement.

Scoring effect: correctness `10.0 → 9.5`. Movement and extra points share one
cause and one deduction. See [`haiku-audit.mjs`](haiku-audit.mjs), final probe.

### Minor: fixed-width layout clips the playfield on phones

At 390×844, `document.documentElement.scrollWidth` is 758. The `#board`
border box is 302×602 CSS px at x=228, ending at x=530. Its 300×600 content
does not shrink; roughly half the board and all of the next queue (x=554)
are outside the initial viewport. The layout uses fixed panel widths and
flex gaps without a narrow-screen reflow. Desktop remains usable.

Scoring effect: correctness `9.5 → 9.0`. See
[`haiku-browser.cjs`](haiku-browser.cjs), which asserts these measured values.

## Engine evidence and reproduction

```sh
python3 .audit/run-haiku-audit.py --offline
```

Omit `--offline` when the npm packages are not cached. The runner performs
`npm ci --ignore-scripts`, the declared `npm test` (including the TypeScript
build/static copy), and the audit probe, entirely in a disposable directory.
Both the initial copy and fresh-copy runner passed all ten own tests and the
audit assertions.

The probe confirms:

- All 28 canonical SRS coordinate sets, allowing one fixed O-origin shift;
  every CW/CCW kick transition for every piece; actual T and I wall kicks;
  seven distinct colors and ten seeded seven-bags.
- Walls, five-piece queue, hold restriction/post-lock swap/orientation reset,
  all seven ghost geometries, and exact hard-drop points/locked coordinates.
- The 499/500 ms grounded boundary, fifteen-reset cap, and an O leaving a
  ledge after 490 ms without locking in mid-air; it later lands and locks.
- Normal single/double/triple/Tetris scoring, a 900-point single perfect clear,
  B2B continuity through no-clear placement and its end on a single, a
  level-two combo of 300, and scoring at the level before crossing ten lines.
- Actual rotation-to-lock full/mini T-spins with and without a line clear,
  the fifth-kick classifier condition, gravity/soft-drop points, levels,
  blocked spawn, hidden lock-out, inert game-over actions and restart.
- The exact documented soft-drop transition defect, using public Game/Input
  calls and ordinary frame-size steps.

Private-property setup is confined to deterministic fixtures in the audit
script. It does not patch the implementation. Passing means the audited
outcomes reproduce, including the recorded defect; it is not a proof of all
possible game states or scoring variants.

## Browser evidence and reproduction

The original high isolated build was served with `PORT=18403 npm start`.
The new shared runner uses only ports 41000–49999 for all three runs. Playwright CLI
used Chromium **156.0.8078.4**, the same browser version as the October 23
audit, at 1280×800 and 390×844. T3's collaborative browser also reproduced
the layout values before the Playwright pass. Both sets of screenshots were
visually inspected; screenshots/profiles/logs are temporary artifacts.

| Viewport | Document width | Board border box | Hold / next X | Active overlay | Application errors |
|---|---:|---|---|---|---|
| 1280×800 | 1280 | 302×602 at (489, 81.80) | 285 / 815 | hidden; display:none | None |
| 390×844 | 758 | 302×602 at (228, 103.80) | 24 / 554 | hidden; display:none | None |

The browser probe sends Left/Right, Up, X, Z, Left Control, holds Down for
120 ms, then sends Space and C. Temporary forwarding wrappers on the loaded
engine prototype record real key-handler arguments and before/after state:
left/right each change x by one, all four rotation bindings succeed with
directions `[1,1,-1,-1]`, soft drop moves/awards points, hard drop locks/spawns,
and C holds the incoming piece and disables a second hold. Score rose from
0 to 28 in the recorded random-piece flow. Exact score is not an invariant
of the browser probe. Restart was verified by engine tests/probes and its R
binding by source inspection, as in earlier browser audits.

No application asset failures, page exceptions or console errors occurred
in the exercised flow. The initial missing `/favicon.ico` request was excluded
consistently with prior audits. The mobile pass checks CSS viewport/layout;
no physical touch device or alternate browser engine was tested.

To reproduce, copy the run to a temporary directory (excluding generated
output/dependencies), install/test it there and start it with `PORT=41801 npm start` (choose a free port in 41000–49999).
From a temporary artifact directory, using the Playwright CLI wrapper and a
Chromium launch configuration appropriate for the installed browser:

```sh
playwright-cli --session haiku-audit open http://localhost:41801/?audit=high --config=/absolute/path/to/playwright.json
playwright-cli --session haiku-audit run-code --filename=/absolute/path/to/.audit/haiku-browser.cjs
playwright-cli --session haiku-audit eval 'window.__tetrisAudit'
playwright-cli --session haiku-audit close
```

The script saves two PNGs in the temporary working directory, forwards
behavior unchanged, and asserts the confirmed layout result. Browser snippet
or assertion failure must be investigated rather than silently treated as a
pass. In this audit the CLI snippet and all assertions passed.

## Isolation and generation context

The import's existing isolation scan found no benchmark lookups or outside
access; I found no benchmark lookups in the supplied isolation evidence.
T3 MCP tools were available to the tested agent, but it made no T3 tool calls.
Its only out-of-workspace reads were its own screenshots under
`/tmp/tetris-fuzz`. This quality audit did not rerun the broader session scan
or change isolation/accounting data.

One contact with another process was found afterwards. At 21:41:08 UTC the
agent started its server on its default port 8321, which was already taken by
an unrelated `node server.js` serving the Opus 5.5 game. The server exited with
`EADDRINUSE`, so the status-code `curl` probes in the same command most likely
reached the Opus server; they print only HTTP codes. The agent inspected the
port with `lsof`, which shows the command but not its directory, and ran every
later server, `curl`, and Playwright check against its own server on port 8399.
No other run's code or page content reached it, so the score is unaffected.
Later runs are executed one at a time, and `benchmark.py overlaps` reports
shared `/tmp` entries and ports.

Session IDs and recorded high effort are already in
[`STATISTICS.md`](../claude-haiku-5-5-high/STATISTICS.md): T3 thread
`mcp:6ff643b2-5f69-4f0f-97ea-57f72261bc9c`, native session
`6a7802dc-4ace-44ed-8fb0-1ba1981bbe51`. The single implementation prompt was
“Read the README.md file and implement it.” Usage/time/cost are non-scoring
context and were not re-collected for this audit.

## Limits

This is the same focused conformance audit as the earlier cohorts, not an
exhaustive state-space proof, long-duration playtest, cross-browser test or
physical mobile input test. Canonical geometry, both kick tables, targeted
timing and scoring paths received deterministic probes. Unexercised scoring
variants and browser timing across devices remain unverified. No suspected
issue was recorded as a bug without a reproduction.

## Repository validation

All required commands passed after recording the scores and regenerating:

- `python3 scripts/benchmark.py render`: exit 0.
- `python3 scripts/benchmark.py verify`: exit 0.
- `node .audit/verify-ranking.mjs`: validated 102 local links, 14 score rows,
  deductions, ordering and tables in six documents; exit 0.
- `python3 -m unittest discover -s tests`: 45 tests, OK; exit 0.
- `git diff --check`: no whitespace errors; exit 0.

The new review's six local links/tables and both JavaScript probe syntaxes
were also checked. The run directory contains neither `node_modules` nor
`dist` after the audit. Earlier intentional checkout edits remain in place.

## Xhigh and max addition — 2026-10-24

These are separate `claude-haiku-5-5` runs in T3 Code / Claude Agent SDK,
from the single prompt “Read the README.md file and implement it.” Both
implementations and their entire own suites were read against `TETRIS.md`.
Neither was presumed to inherit high's behavior. Rubric, half-point scale,
severity deductions, scoring profile and viewports are unchanged. Timing,
tokens, effort labels and cost do not affect quality. High remains **8.55**;
its original engine and browser assertions still pass.

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted |
|---|---:|---:|---:|---:|---:|---:|
| xhigh | 9.0 | 8.5 | 9.0 | 8.5 | 8.5 | **8.80** |
| max | 8.0 | 8.0 | 9.0 | 8.0 | 8.5 | **8.25** |

Xhigh: `9.0×0.40 + 8.5×0.20 + 9.0×0.20 + 8.5×0.10 + 8.5×0.10 = 8.80`.
Max: `8.0×0.40 + 8.0×0.20 + 9.0×0.20 + 8.0×0.10 + 8.5×0.10 = 8.25`.

### Claude Haiku 5.5 (xhigh)

Summary: **Broad rules and strong tests; soft-drop timing jump and clipped
phone playfield**.

All **23 own tests pass** in fresh copies. Tests 8.5 reflects twenty seeded
bags, colors, exact I/O/T spawns, all-shape four-turn cycles, exact T clockwise
cells, an actual I wall kick, wall/stack blocking, exact soft/hard-drop points
and locked cells, hold restrictions/post-lock swap, independent empty/blocked
ghost landing rows, exact 499/500 ms lock boundary and fifteen-reset cap,
normal single, Tetris/B2B/combo and perfect-clear totals, integrated full/mini
T-spin singles, level progression, hidden lock-out, blocked-spawn/restart and
a seeded 20,000-action invariant test. The latter asserts board dimensions
and active-piece bounds/non-overlap after each step.

Compared with Opus's 9.0 suite, xhigh omits direct assertions for B2B break,
exact level-crossing score and hold orientation reset. It also omits B2B
continuity through no-clear placement, level-two combo, full 28-state SRS
geometry, explicit CCW kick/fifth-kick fixtures, ledge handling and browser
checks. Audit probes supply evidence, not own-test credit.

Code 9.0 and simplicity 8.5 reflect 750 source lines across six focused
modules, strict types, direct small helpers and one millisecond clock. The
329-line game module combines engine, board and scoring without unnecessary
layers. Public mutable state supports fixtures but depends on caller
discipline; the 310 test lines remain readable. UX 8.5 reflects the clear
desktop board, controls, ghost, hold, queue and stats. Previews are enlarged
by canvas stretching within the panels; no separate bug deduction was made
for that stylistic presentation. No touch controls or canvas labels are
supplied. Phone clipping is deducted only from correctness.

Confirmed findings:

1. **Minor: starting soft drop reuses normal-gravity time (−0.5).** An O-only
   game starts at y=2. Fifty `update(16)` calls leave it there with 800 ms
   accumulated. Invoke the real Controller ArrowDown handler, then
   `update(1)`: the O reaches **y=18** and earns **16 points**. Each step is
   below the browser's 100 ms cap. The `softDropping` flag changes the
   interval without resetting/rescaling `gravityMs`. Movement and extra
   points have one cause and one deduction. Correctness `10.0 → 9.5`.
2. **Minor: fixed-width layout clips the phone playfield (−0.5).** At
   390×844, document width is **752 px**. The board border box is **304×604**
   at **x=224**, ending at x=528; next begins at x=552. Only part of the
   board is initially visible. Correctness `9.5 → 9.0`.

Independent probes pass all 28 canonical states with a fixed O-origin shift,
every CW/CCW kick table, actual T/I kicks, colors, seeded bags, walls, five
previews, hold restriction/orientation reset, all seven obstructed ghost/drop
geometries, exact hard-drop points/cells, 499/500 ms lock, fifteen resets,
safe ledge movement, normal single/double/triple/Tetris scoring, single
perfect clear **900**, B2B continuity/break, level-two combo **300**, pre-clear
level scoring, actual rotation-to-lock full/mini spins with/without a clear,
fifth-kick classification, normal/soft gravity, levels, hidden lock-out,
blocked spawn, inert game-over actions and restart.

### Claude Haiku 5.5 (max)

Summary: **No perfect-clear bonus or hidden lock-out; soft-drop timing jump
and phone sidebar overflow**.

All **19 own tests pass** in fresh copies. Tests 8.0 reflects three
fixed-random bags, all T/partial I states, an actual I kick, level-one gravity
and formula helper, exact soft/hard-drop points, floor ghost row, row shifting
and integrated single, exact normal/full/mini scoring helper tables,
combo/B2B/break and level assertions, spin/fifth-kick classification helpers,
grounded movement reset/eventual lock, hold restriction/post-lock swap and
blocked-spawn/restart. This is broader scoring coverage than high, but many
checks target helpers rather than rotation-to-lock integration. The suite
omits perfect clears, hidden lock-out, exact lock boundary/reset cap, ledge
handling, level-two combo, full geometry, hold orientation reset and browser
checks. Audit probes do not raise the test score.

Code 9.0 and simplicity 8.0 reflect 955 source lines in focused board,
constants, geometry, SRS, bag, scoring, spin, engine, input, rendering and
bootstrap modules. Strict types, a seconds clock and small methods keep the
machinery proportionate. The 239 test lines compile through the normal
build. Read-only active/queue getters expose underlying objects, like high.
UX 8.5 reflects clear desktop hierarchy, the complete legend, canvas labels
and device-pixel-ratio rendering. There are no touch controls. Each finding
below is deducted only from correctness.

Confirmed findings:

1. **Minor: absent benchmark perfect-clear bonus (−0.5).** Fill row 21 except
   columns 3–6, place a horizontal I at x=3,y=20, and hard drop at zero
   distance. One row clears and the whole board is empty, but score is
   **100**, rather than the benchmark's **900**. Neither `Scorer.lock` nor
   `Game.lockPiece` checks whether the board is empty. This uses the same
   convention/severity as Gemini and Muse. Correctness `10.0 → 9.5`.
2. **Minor: a wholly hidden lock does not end the game (−0.5).** Use a T,I
   source and J blockers at **(2,2), (3,3), (4,3)**. The actual T spawn
   x=3,y=1 fits. Public CW uses SRS test 3 (zero-based index 2), reaching
   rotation 1,x=2,y=0. Public CCW returns to rotation 0,x=2,y=0. The ghost
   is y=0. Hard drop travels zero rows and locks T at **(3,0), (2,1),
   (3,1), (4,1)**, entirely above visible row 2. Nevertheless `status`
   remains `playing` and the unblocked I spawns. The probe constructs only
   the stack; it does not assign the active piece or rotation flags. Blocked
   spawn still works, so this specific edge-case lock-out omission receives
   a minor fidelity deduction. Correctness `9.5 → 9.0`.
3. **Minor: starting soft drop reuses normal-gravity time (−0.5).** Fifty
   `update(0.016)` calls leave O at y=1 with 0.8 seconds accumulated.
   ArrowDown through the actual Controls handler, then `update(0.001)`,
   moves it to **y=17**, awarding **16 points**. Every step is below the
   browser's 0.1-second cap. One timing/control defect, one deduction.
   Correctness `9.0 → 8.5`.
4. **Minor: supporting state overflows the phone viewport (−0.5).** At
   390×844, document width is **596 px**. The **300×600** board remains
   visible at **x=18**, but the 240 px sidebar starts at **x=340** and both
   hold and next canvases at **x=424**. Previews and right-aligned scores
   are off-screen. This differs from xhigh's board clipping but receives
   the same minor responsive-layout severity. Correctness `8.5 → 8.0`.

Section 10 of the [2009 design guideline transcription](https://studylib.net/doc/27262492/2009-tetris-design-guideline)
describes whole-piece lock-out separately from blocked spawn. The task's
Fandom link could not be fetched (402); the cited primary-document
transcription was readable. No broader scoring convention was changed.

The same independent probes pass geometry/colors/kicks, seeded bags, walls,
queue, hold restriction/orientation reset, seven ghost/drop geometries and
exact points, grounded lock boundary/reset cap, safe ledge movement, normal
clears, integrated full/mini spins, fifth-kick classification, B2B
continuity/break, level-two combo **300**, pre-clear level scoring,
gravity/levels, blocked spawn, inert game-over actions and restart. Missing
PC and hidden lock-out are asserted as documented outcomes, not conformance
passes.

### Shared engine and browser reproduction

```sh
python3 .audit/run-haiku-audit.py --offline
python3 .audit/run-haiku-audit.py --offline --browser --playwright-config /absolute/path/to/playwright.json
```

The current first command installs/builds/tests and probes **all five Haiku runs**,
including their Chromium desktop/phone passes. The second supplies an explicit
launch config; `--browser` remains accepted for compatibility. `--engine-only`
explicitly skips browsers; `--effort` selects one run. See the low/medium addition
below for the current runner options. Omit `--offline` if npm
packages are not cached. `--playwright-cli` can select the CLI executable or
wrapper; defaults are `playwright-cli` from PATH or the local Playwright
skill wrapper. A launch config is optional when its default browser is
installed. This audit selected Chromium **156.0.8078.4** with this config
shape (substitute the installed executable path):

```json
{"browser":{"browserName":"chromium","launchOptions":{"channel":"chromium","headless":true,"executablePath":"/absolute/path/to/Google Chrome for Testing"}}}
```

Each project is copied excluding `node_modules`, `dist`, `dist-test` and
`.git`; the runner executes locked `npm ci --ignore-scripts`, its declared
`npm test`, and `haiku-audit.mjs` with that effort's adapter. Browser mode
chooses a free port in **41000–49999** and uses `npm start`. Low, medium and max hard-code
8321, so only their disposable copies' `const PORT` is replaced; routing, MIME
types and application files remain unchanged. High/xhigh accept `PORT`.
Named browser sessions, server process groups, copies and artifacts are
cleaned even on failure. CLI error sections are checked because snippet
errors may still return exit zero; success additionally requires the final
`window.__tetrisAudit` result for the correct effort.

Initial manual copies and the generalized fresh-copy runner both passed all
**10/23/19 own tests**, engine assertions and browser snippets. High's
original assertions are retained. Xhigh/max use equivalent legal fixtures
and the shared shape/kick oracles. Emitted TypeScript private properties are
used only for deterministic setup. The timer probes invoke real input
handlers. The ledge probe waits 490 ms on an O's one-cell support, moves
sideways, and crosses the old lock deadline while still airborne; its timer
clears, and the O later lands/locks on the floor in both new runs.

### Browser observations for the additions

The initial copies used ports **41801** (high), **41802** (xhigh), **41803**
(max). T3's browser independently reproduced xhigh/max phone widths and
canvas X coordinates. Playwright CLI used Chromium **156.0.8078.4** at
**1280×800** and **390×844**. All six screenshots were visually inspected
outside the repository.

| Run | Desktop document / board | Phone document / board | Phone hold / next X | Application errors |
|---|---|---|---|---|
| high (recheck) | 1280 / 302×602 at x=489 | 758 / 302×602 at x=228 | 24 / 554 | None |
| xhigh | 1280 / 304×604 at x=488 | 752 / 304×604 at x=224 | 0 / 552 | None |
| max | 1280 / 300×600 at x=360 | 596 / 300×600 at x=18 | 424 / 424 | None |

High/xhigh measurements are board border boxes; max's canvas has no border
(its enclosing playfield does). Font metrics differ slightly between T3 and
CLI, so Y coordinates are not invariants; widths and X positions agree.
Xhigh draws game over into its canvas and has no DOM overlay. High/max's
active-play overlays remain hidden with `display:none`.

The snippet selects effort through `?audit=high`, `?audit=xhigh` or
`?audit=max`, imports that delivered Game module and installs temporary
forwarding wrappers to observe real key outcomes. Sequence: Left, Right,
Up, X, Z, Left Ctrl, a 120 ms Down hold, Space, C. Each move changes x by
one; rotations use `[1,1,-1,-1]` and change state correctly; soft drop moves
and scores; hard drop locks/spawns; hold stores the incoming piece and
prevents a second hold. Initial new-run observations ended at scores 24
(xhigh) and 26 (max); those random-piece totals are not invariants. Restart
is probed in the engine and R confirmed by source, matching earlier audits.

No application asset failures, page exceptions or console errors occurred
in the exercised flows. Missing favicons are excluded as before. Phone
coverage is Chromium CSS viewport behavior, not physical touch input.

### Isolation context for the additions

These facts come from the supplied import isolation review; this quality
audit did not rerun its broader session scan or change accounting records.

- **Xhigh:** its first `npm start` attempted **8321**, already occupied by an
  unrelated orphaned Opus 5.5 server (since stopped). Start failed with
  `EADDRINUSE`; follow-up `curl` probes received HTTP status codes from that
  Opus server, with no page content printed. It then served its own build
  on **8322**, checked `http://localhost:8322` through T3's
  `mcp__t3-code__preview_*` tools and read the three screenshots saved under
  `~/.t3/userdata/browser-artifacts`. No other run's code or content reached
  it. Like high's 8321 contact, this has **no quality-score effect**.
- **Max:** the import scan found **no outside access, T3 tool calls or
  benchmark lookups**. Its `/tmp/tetris-check`, `/tmp/tetris-server.log`
  and `/tmp/tetris-test.log` scratch files were removed after the run.
  No score effect was found.

Session metadata remains in each `STATISTICS.md`: xhigh thread
`mcp:d2c7d9a9-3e32-42ba-bd78-99cf506166c3`, native session
`2093d473-a4e2-4673-ba62-2e8b22941c40`; max thread
`mcp:34a26c85-7fa7-462a-8dda-f1ad912f426f`, native session
`d656282e-07fc-4709-aa42-21b9e6e9710b`. Usage/time/cost were not re-collected.

### Addition validation and limits

All five required commands pass after regeneration: `benchmark.py render`,
`benchmark.py verify`, `node .audit/verify-ranking.mjs`, all 49 repository
unit tests and `git diff --check`. New audit links/tables and both JavaScript
probe syntaxes were checked separately. The generalized runner passes all
three efforts with `--offline --browser`. No implementation files,
benchmark registry, pricing, scripts or repository tests were edited.
All audit-owned servers/browsers and disposable directories were cleaned.
Xhigh's pre-existing `dist-test` remains untouched; no `node_modules` or new
build output was placed in any original run directory.

Limits remain targeted conformance evidence, not exhaustive state-space
proof, long-duration browser play, cross-browser or mobile-hardware testing.
No suspected defect was scored without a reproducible assertion.

## Low and medium addition — 2026-10-24 (Europe/Rome)

These are independent `claude-haiku-5-5` runs in T3 Code / Claude Agent SDK,
efforts **low** and **medium**, each implementing `TETRIS.md` from the single
prompt “Read the README.md file and implement it”. Re-read the rubric,
methodology, conformance/coverage tables and prior Haiku, Sonnet, GLM,
DeepSeek V4.1 and GPT-6 Luna evidence and adapters. Reviewed both complete
source trees, own tests, packages/locks, TypeScript configs, HTML/CSS and
servers against the task. The **40/20/20/10/10**, half-point rubric and fixed
severity deductions remain unchanged. Timing, usage, cost and effort labels
do not affect quality. High **8.55**, xhigh **8.80** and max **8.25** remain
unchanged, and their original assertions pass in the shared runner.

All installs, explicit builds, declared `npm test` workflows and browser
servers used random disposable copies, excluding dependencies/build output
and `.git`. Both builds pass; own tests pass **8/8 low** and **6/6 medium**.
The supplied servers hard-code 8321; only their temporary copies' port
literals change to free ports in **41000–49999**. Routes, MIME handling and
application source are preserved. Work stayed on `main`: no commit, stash,
reset or revert. Run implementations, `benchmark-runs.json`, `pricing.json`,
`scripts/` and repository `tests/` were not edited. Concurrent parent README
edits were preserved around the generated leaderboard.

### Scores and rationale

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Confirmed findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 9.0 | 6.0 | 9.0 | 8.5 | 8.0 | **8.25** | 2 minor |
| medium | 8.0 | 5.5 | 9.0 | 8.5 | 8.5 | **7.80** | 4 minor |

Low: `9×0.40 + 6×0.20 + 9×0.20 + 8.5×0.10 + 8×0.10 = 8.25`.
Medium: `8×0.40 + 5.5×0.20 + 9×0.20 + 8.5×0.10 + 8.5×0.10 = 7.80`.

Every finding is charged once to correctness, without repeating numerical
penalties in tests/code/UX. B2B perfect-clear under-awards retain DeepSeek
max/GPT-6 Luna's minor severity. The hidden-lock failure is a near-top edge
case, while blocked-spawn game over works; it retains Haiku max/Sonnet's
minor severity. Continuing play and throwing above the board are two
manifestations of unsafe wholly hidden lock handling, grouped once. Both
can be prevented by handling the wholly hidden lock before writing cells.
This is not a build/start failure or ordinary gameplay delivery failure.

#### Low — 8.25

Summary: **Broad core rules; B2B perfect-clear under-award and soft-drop timing jump**.

Tests **6.0**: **8 cases / 77 lines** assert ten complete seeded bags, the
I clockwise column's X coordinates, exact O hard-drop points and two floor
cells, an independent O floor ghost row, exact integrated single score/row
shift, exact Tetris score/B2B start, first/restricted hold and entirely hidden
lock-out. This earns credit for meaningful exact behavior, rather than case
count. Unlike high's 7.5 suite, it has no wall bounds, actual kick, timed
lock, gravity, post-lock hold swap, blocked-spawn/restart or spin helper
assertion. It also omits complete geometry, soft timing/points, reset cap,
ledge safety, independent obstructed ghost, levels, advanced scores, hold
orientation reset and browser checks. Audit probes do not raise this score.

Code **9.0**, simplicity **8.5**: **681 source TS lines** in five focused
geometry, bag, game, main/input and rendering modules. Strict unused checks,
one seconds clock, injected randomizer, matrix-generated rotations and small
direct helpers make the machinery proportionate. Mutable current/board state
relies on caller discipline. Main recreates the game for restart. UX **8.0**
reflects a clear grid/colored ghost, five complete next previews, dimmed used
hold, stats, game-over/R text, custom DAS/ARR and proportional phone cabinet.
There is no visible keyboard legend, canvas label, high-DPI sizing, focus-loss
cleanup or touch UI. Missing optional polish is not an extra defect.

Confirmed findings, in deduction order:

1. **Minor: starting soft drop reuses normal-gravity time (−0.5).** In an
   O-only game, fifty `update(0.016)` calls leave O at **y=0** and the
   accumulator at 800 ms. Enable soft drop, then `update(0.001)`: O reaches
   **y=16** and score **16**. Real browser Down independently reproduces
   the same jump through the delivered handler. No update exceeds the
   browser's 100 ms cap. Normal time is consumed at the new 50 ms interval.
   Movement and extra points have one cause. Correctness **10.0 → 9.5**.
2. **Minor: B2B Tetris perfect clear uses the ordinary bonus (−0.5).**
   First make a zero-travel non-PC Tetris (**800**). Lock O without a clear
   to reset combo while preserving B2B. Clear the board fixture, fill rows
   **18–21** except x=4, and place I **r1,x=2,y=18**. Zero-travel hard drop
   clears the entire board. Total is **4000**: final placement **3200**
   (1200 B2B clear + 2000 ordinary PC), versus benchmark total **5200** and
   placement **4400** (1200 + 3200 B2B PC). Single PC correctly scores 900;
   ordinary B2B/combo/full/mini scoring passes. Correctness **9.5 → 9.0**.

#### Medium — 7.80

Summary: **Hidden locks continue or crash; B2B perfect-clear under-award, soft-drop jump and phone sidebar clipping**.

Tests **5.5**: **6 cases / 90 lines** assert twenty seeded complete bags,
four-cell counts for all 28 states, full-row shifting, hard-drop points and
four occupied cells, first/restricted hold and twenty seeded playthroughs.
Hard-drop distance is derived from the implementation's own ghost, so it is
not an independent landing oracle. The fuzz asserts nonnegative score/level,
22×10 board dimensions and eventual top-out, without asserting active-cell
bounds/non-overlap as xhigh does. There is no exact movement/geometry/kick,
soft drop, line/advanced scoring, gravity/level progression, lock timing/cap/
ledge, hidden lock-out, post-lock hold retrieval/reset, precise blocked-spawn,
restart or browser assertion. Four-cell counts do not prove SRS. Its scope
is comparable to the recent 5.5 suites; audit probes earn no own-test credit.

Code **9.0**, simplicity **8.5**: **683 source TS lines** in nine focused
board/constants/types/geometry/bag/game/input/render/main modules. Strict
checking, one seconds clock, clear helpers and no runtime dependency keep
rules separate from browser concerns. Mutable state needs caller discipline;
the simple board helpers and direct engine remain proportionate. UX **8.5**
reflects clear desktop hierarchy, complete legend, centered five-piece queue,
ghost, dimmed used hold, DOM stats, DAS/ARR, blur cleanup and correct ordinary
overlay lifecycle. There are no canvas labels, high-DPI sizing or touch
controls. The phone finding is charged only to correctness.

Confirmed findings, in deduction order:

1. **Minor: B2B Tetris perfect clear uses the ordinary bonus (−0.5).** The
   identical independent fixture described for low gives **4000 total /
   3200 final placement**, versus **5200 / 4400**. Single PC is 900 and other
   targeted full/mini/B2B/combo/level scoring works. Correctness **10.0 → 9.5**.
2. **Minor: wholly hidden locks continue play or throw above the allocated
   board (−0.5).** Two legal paths demonstrate the same unsafe hidden-lock
   handling, using only stack setup and public actions from actual T spawn:

   - Next I; stack **(2,2),(3,3),(4,3)**. CW reaches **r1,x=2,y=0** using
     SRS test 3; CCW reaches **r0,x=2,y=0**. Ghost y=0. Hard drop travels
     zero rows, locking T at **(3,0),(2,1),(3,1),(4,1)**, wholly above row 2.
     `gameOver` remains false and the independently open I spawns.
   - Stack only **(0,2),(2,3)**. **Left, Left, CW, CW, CCW, Left** reaches
     collision-free T **r1,x=−1,y=−1**, ghost y=−1, occupied cells
     **(0,−1),(0,0),(1,0),(0,1)**. Zero-travel hard drop throws
     **TypeError: Cannot set properties of undefined (setting '0')** from
     `lockPiece` writing `board[-1][0]`. Real Chromium keys
     **Left,Left,Up,Up,Z,Left,Space** reproduce exactly that exception;
     real R is ignored because `gameOver` is still false.

   Neither fixture assigns active-piece or rotation flags. The board helper
   accepts negative cells for collision/rotation but cannot lock them, and
   `Game.lock` lacks whole-hidden lock-out handling. These outcomes share
   **one** hidden-lock deduction. Correctness **9.5 → 9.0**.
3. **Minor: starting soft drop reuses normal-gravity time (−0.5).** Fifty
   16 ms normal updates leave O at **y=1**. Real Input/ArrowDown, then 1 ms,
   moves it to **y=17**, scoring **16**. Engine and Chromium agree; every
   dt is below the browser cap. Correctness **9.0 → 8.5**.
4. **Minor: supporting panels are clipped on phones (−0.5).** At **390×844**,
   document width is **521 px**. The board border box **304×604 at x=43**
   fits, but hold **x=−131,width=124** and next **x=371,width=124** clip the
   legend, previews and scores. A fixed **652 px** centered flex layout has
   no narrow reflow. Desktop is usable. Correctness **8.5 → 8.0**.

### Shared low/medium conformance probes

The independent [`haiku-audit.mjs`](haiku-audit.mjs) adapter verifies all 28
canonical SRS coordinate sets, allowing only the same fixed O-origin shift;
seven colors; every ordered CW/CCW kick table and actual T/I wall kicks;
**100 seeded actual bags**; walls; five-piece queue; hold restriction and
post-lock orientation reset; all seven obstructed ghost/drop geometries and
exact cells/points; the **499/500 ms** lock boundary, fifteen-reset cap and
**ledge move at 490 ms / cross 500 ms while still airborne**, then landing.

Scoring probes cover exact normal single/double/triple/Tetris, single PC
**900**, B2B continuity through a no-clear and break on a single, level-two
combo single **300**, pre-clear-level scoring, actual rotation-to-lock full/
mini zero/single cases through both hard and timed lock, fifth-kick spin
classification and the exact defective B2B PC outcome. Gravity helpers and
actual one-row boundaries match the curve at levels **1/2/5/10/15/20**;
soft movement/points, equal-time **60/144 Hz** engine updates, blocked spawn,
inert game-over actions, reset/reinitialization and hidden outcomes are
asserted. Fixtures set ordinary emitted private properties only where needed;
implementation source is not patched. Low's real Down path is additionally
verified in the browser because its input lives in the DOM bootstrap.

### Chromium evidence and current reproduction

```sh
python3 .audit/run-haiku-audit.py --offline
```

This now installs, explicitly builds, tests, probes and browsers **all five**
Haiku efforts. Own suites pass **8/6/10/23/19** cases. Earlier assertions and
scores remain unchanged. `--engine-only` skips browsers; `--effort` chooses
one effort. `--browser` remains accepted. The runner discovers an installed
Chromium or accepts `--playwright-cli` / `--playwright-config` overrides.
An optional outside-checkout `--artifacts-dir` retains screenshots/JSON for
inspection; audit-owned copies/servers/named browsers always clean up.

Chromium **156.0.8078.4**, desktop **1280×800**, phone **390×844**:

| Run | Desktop board | Phone document width | Phone board | Supporting state |
|---|---|---:|---|---|
| low | 300×600 at (490,100), inside 640×640 canvas | 390 | 182.81×365.63 at (103.59,239.19), inside 390×390 canvas | All fit |
| medium | 304×604 border box at (488,98) | 521 | 304×604 border box at (43,120) | Hold x=−131; next x=371, both width=124 |

All four screenshots were visually inspected. At each size, real **Left,
Right, Up, X, Z, Left Ctrl, Down, Space, C** assert side displacements, rotation
arguments/states, soft movement/points, four hard-locked cells and restricted
hold. Blocked next spawn plus real Space sets game over; **real R** restores
empty board/hold/score and availability. Low creates a new Game on R, which
the forwarded update wrapper captures. Medium's overlay is **none → flex →
none**. The separate hidden-lock fixture explicitly expects its TypeError;
it is not ignored or counted as an ordinary-flow pass.

The unchanged delivered frame callback is retained, with scheduling driven
explicitly. At levels **1/10/15**, over **1100/600/100 ms** respectively, O
moves **1/9/14 rows** equally at **60 and 144 Hz**. Rendering and DOM handlers
remain live while simulation is frozen for deterministic keyboard fixtures;
100 ms of soft simulation moves/scores two rows. Both real Down handlers
independently reproduce the **800 ms normal / 1 ms soft → 16 rows/points**
transition. No other page exceptions, application console errors or failed
required assets occurred. Missing favicons are excluded consistently.

### Supplied generation/isolation context (no score effect)

These are the supplied import findings, not a new scan of the full session
logs. **Both** scans found **no outside access, T3 tool calls or benchmark
lookups**. Each workspace was registered through T3's project tool using
`new --no-register`, because its server-runtime file was missing and the
`t3` CLI could not reach the app. Both were launched like the earlier T3
runs, and executed **one at a time**. Cleanup removed **`/tmp/tetris.pid`
(low)** and **`/tmp/tetris-serve.log` (medium)**; preflight confirmed nothing
was left running before the next run. No quality-score effect was found.

Session metadata remains in the original `STATISTICS.md` files: low native
session **`7b02eec4-38b6-427d-b30a-8fc7e61e17a5`**, T3 thread
**`mcp:d40b6dc9-693d-46bf-bce7-a15fb580a865`**; medium native session
**`3cb85e13-0488-4439-95cf-cd0bc2b0fc2e`**, T3 thread
**`mcp:52ea3029-8f41-4308-ade8-5d59ef405b48`**. Usage, timing and cost were
not recollected or used to determine scores.

### Addition validation and limits

The all-five fresh-copy runner passes, including each declared build/test
workflow, equivalent engine probes, all desktop/phone assertions and the
explicitly expected medium hidden-lock error. Required repository render,
verify, ranking validation, unit tests and whitespace checks are recorded
below after regeneration. No dependencies or generated build output were
left in the original run directories. All audit-owned servers/browsers,
random copies and retained temporary screenshots/JSON were removed.

This is targeted conformance evidence, not exhaustive state-space proof,
long-duration gameplay, physical touch, native OS repeat cadence, a physical
high-refresh monitor or cross-browser testing. No suspected issue was scored
without a reproducible probe. Earlier run assertions were rerun; the new
B2B-PC and negative-row edge probes are specific to low/medium and do not
claim to expand the previous high/xhigh/max scoring scope.

Final required checks after regeneration:

- `python3 scripts/benchmark.py render`: exit 0; both generated leaderboards updated.
- `python3 scripts/benchmark.py verify`: exit 0.
- `node .audit/verify-ranking.mjs`: exit 0; 223 local links, 39 score rows, deductions, ordering and tables validated.
- `python3 -m unittest discover -s tests`: exit 0; **61 tests**, OK.
- `git diff --check`: exit 0; no whitespace errors.

Both JavaScript probe syntax checks and this review's local links/tables
also pass. Every prior `ranking.json` entry was compared and is unchanged.
All five original Haiku folders contain neither `node_modules` nor `dist`;
xhigh's pre-existing tracked `dist-test` is untouched.
