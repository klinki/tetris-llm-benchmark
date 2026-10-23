# Claude Haiku 5.5 (high) audit

Audit date: 2026-10-24 (Europe/Prague). Run: `claude-haiku-5-5-high`;
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

The isolated build was served with `PORT=18403 npm start`. Playwright CLI
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
output/dependencies), install/test it there and start it on the port above.
From a temporary artifact directory, using the Playwright CLI wrapper and a
Chromium launch configuration appropriate for the installed browser:

```sh
playwright-cli --session haiku-audit open http://localhost:18403/ --config=/tmp/playwright-cli.json
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
