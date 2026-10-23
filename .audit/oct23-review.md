# Opus 5.5 and Muse Spark 1.3 audit

Audit date: 2026-10-23. This record supports the two new rows in
[`RANKING.md`](../RANKING.md) and the generated per-run statistics.

## Source and scope

The completed projects were already present in [`opus5.5`](../opus5.5/README.md)
and [`muse-spark-1.3-medium`](../muse-spark-1.3-medium/README.md). Their source
logic was reviewed without fixing it; only a trailing space in each task
README heading was removed. The separate `opus-5.5` folder contains
only a README and is not registered as another benchmark implementation.
Builds and tests ran in temporary copies excluding dependencies and build
output; the original generated `dist` files were not rebuilt in place.

The same 0–10 half-point categories, weights, bug deductions, scoring profile,
and desktop/phone viewport sizes were used as in the earlier audits. Earlier
implementation scores were not changed.

## Results

| Implementation | Correctness | Tests | Code | Simplicity | Browser UX | Overall | Confirmed findings |
|---|---:|---:|---:|---:|---:|---:|---|
| Opus 5.5 | 9.5 | 9.0 | 9.0 | 8.0 | 8.5 | 9.05 | 1 minor: fixed-width mobile layout |
| Muse Spark 1.3 (medium) | 9.0 | 7.5 | 8.0 | 8.0 | 9.0 | 8.40 | 2 minor: missing perfect-clear bonus; phone board collapses |

Opus's 19 deterministic tests include actual kicks, exact gravity/drop points,
lock timing/reset limits, hold restrictions, B2B/combo/perfect-clear scoring,
full/mini T-spin integration, level crossing, block/lock out, restart and pause.
Muse has seven groups covering bags, colors, input/drop/ghost behavior, a wall
kick, hold, Tetris and lock-delay/top-out. Its Tetris score assertion accepts
any value ≥800 and does not test the missing perfect-clear bonus.

The extra audit probes validate all 28 canonical SRS states in each engine,
with only one fixed O-origin translation where needed. They also check hold,
queue/drop/reset behavior, ledge handling, B2B continuity, level-two combo
integration, and an equivalent perfect-clear position.

```sh
python3 .audit/run-oct23-audit.py --offline
```

Omit `--offline` when npm dependencies are not cached. The runner creates
temporary copies, performs locked installs and each declared `npm test`, then
runs [`oct23-audit.mjs`](oct23-audit.mjs). Passing probes mean the documented
results reproduce, including Muse's scoring defect.

## Confirmed defects and reproductions

- **Opus, minor (−0.5 correctness):** at 390×844, document width is 760 px and
  the 300 px board starts at x=230. Much of the playfield and the next panel
  are outside the viewport. The fixed flex layout has no narrow-screen reflow.
- **Muse, minor (−0.5 correctness):** place a horizontal I at x=3, y=20 on a
  22-row field, fill the remaining cells of row 21, and hard drop with zero
  travel. One row clears and the board becomes empty, but score is 100 rather
  than the benchmark profile's 900. No perfect-clear bonus exists in scoring.
- **Muse, minor (−0.5 correctness):** at 390×844, the side columns consume the
  grid width and the automatic center column collapses. The playfield canvas
  measures 0×0 CSS pixels; the board disappears entirely while the side panels
  remain. Document width is 397 px. This is one responsive-layout finding;
  the game works at the desktop viewport.

Opus's reset-cap locking policy was reviewed against the extended-placement
discussion in section 5.7 of the 2009 *Tetris Design Guideline*
([primary document transcription](https://studylib.net/doc/27262492/2009-tetris-design-guideline)).
Cap-triggered locking is intentional and was not mislabeled as a defect. The
perfect-clear bonus is the previously documented benchmark convention, not a
claim that all licensed Tetris variants share it.

## Browser evidence

Chromium 156.0.8078.4 was driven through the Playwright CLI at 1280×800 and
390×844. The isolated Opus server ran with `PORT=18401 npm start`; Muse used
its declared Python static-server behavior on port 18402 after building.
The common [`october-browser.cjs`](october-browser.cjs) snippet exercised
Left/Right, Up/X, Z/Left Control, soft drop, hard drop and C hold, measured
canvas/layout bounds, captured screenshots, and recorded failed asset loads
and page exceptions.

| Run | Desktop board | 390 px document | Phone board | Application load/runtime |
|---|---|---:|---|---|
| Opus | 300×600 at x=490 | 760 px | 300×600 at x=230, clipped | No application asset failures or page exceptions |
| Muse | 300×600 at x=485 | 397 px | 0×0 at x=190 | No application asset failures or page exceptions |

Both desktop keyboard flows responded and hard drop advanced score. The
overlay behavior was correct during active play. Missing favicon requests
were excluded consistently with earlier audits. Desktop and phone screenshots
were inspected and kept as temporary artifacts. Neither game offers touch
controls. Browser testing does not establish exhaustive or cross-browser
correctness.

## Session isolation and reasoning settings

Source: read-only `~/.t3/userdata/statev2.sqlite`. Primary reports use exact
T3/native-session mappings and complete `turnTokenUsage`, not the latest
request's `tokenUsage`.

| Scope | T3 thread ID | Native session ID | Model | Reasoning |
|---|---|---|---|---|
| Opus implementation | `af2b2b60-20dc-4378-85fa-b389e68fa779` | `f5839c10-76b5-4df2-91b0-c19327ae47fb` | `claude-opus-5-5` via Claude Agent SDK | `medium`; fast mode off |
| Muse implementation child | `thread:delegated-task:command%3Amcp%3A37ba14be-6471-46fc-b021-d1fe8dff5787%3Adelegate-task%3Adeb4b1d0-1dcf-45db-81d9-cedb3e5198ae` | `ses_e973841d5ffeGykPLOuTyvCSzJ` | `opencode-go/muse-spark-1.3-contributor` | `medium` |
| Muse orchestration parent | `2df58eb6-f4ef-4be0-af1a-ddf3a1f2009d` | `ses_e9738a531ffe1NyPGZsU4MlKDo` | `opencode-go/muse-spark-1.3-contributor` | `xhigh` |

For Opus, T3's application model selection records the model and fast-mode
setting, but not an effort option. The effective `medium` effort is verified
from the matching `query.open` request in
`~/.t3/userdata/logs/provider/events.af2b2b60-20dc-4378-85fa-b389e68fa779.log`.
The request also matches the exact native session, model, and `opus5.5` working
directory. The collector requires this evidence rather than guessing a default.

Muse's child inherits the benchmark repository as its T3 project directory,
but its task explicitly sets the implementation directory to
`muse-spark-1.3-medium`. Both the configured project path and that task path
are validated. Parent lineage and the task message's sender ID must match
the configured parent. The child is counted as the tested implementation
agent; the parent's two provider turns are recorded separately.

## Token and time accounting

T3's normalized input includes uncached input, cache reads and cache writes.
Output already includes its reasoning subset. All table components below sum
without adding reasoning a second time.

| Scope | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Opus implementation | 50 | 1,393,067 | 74,749 | 42,219 | 1,510,085 |
| Muse implementation child | 123,675 | 784,197 | 0 | 15,992 | 923,864 |
| Muse parent, two turns | 39,657 | 296,908 | 0 | 2,592 | 339,157 |
| Muse child plus recorded parent | 163,332 | 1,081,105 | 0 | 18,584 | 1,263,021 |

Opus's reasoning subset is 15,279 tokens. Muse's child subset is 1,246;
its parent's two turns contain 951. Those subsets are informational.

| Scope | Start (UTC) | Completion (UTC) | Elapsed |
|---|---|---|---|
| Opus user prompt to response | 2026-10-23T12:38:41.914Z | 2026-10-23T12:45:59.146Z | 7m 17.232s |
| Muse child task to response (primary) | 2026-10-23T12:41:23.220Z | 2026-10-23T12:43:36.541Z | 2m 13.321s |
| Muse human request to final parent report | 2026-10-23T12:40:57.182Z | 2026-10-23T12:43:51.657Z | 2m 54.475s |

The Muse end-to-end span includes setup/delegation, child work, and result
verification/reporting. Parent and child activity partly overlap; their
individual durations must not simply be added. There was no additional human
correction or user-wait interval to subtract.

The parent prepared the folder, copied the task README, found the delegation
capability, launched the medium child, read its result, and ran build/tests.
It did not edit implementation code. Its 339,157 tokens are a verified recorded
subset of orchestration overhead, not proof that all harness usage is known.
Complete overhead, combined usage, cost, model-request counts and normalized
tool counts remain explicitly unverified in the primary reports. The recorded
child-plus-parent figure is therefore a lower bound, not a complete session
bill.

## Muse reference assistance and comparison limits

The delegated child read the benchmark root README/TETRIS and then Gemini-4's
`package.json`, `tsconfig.json`, `index.html`, `src/engine.ts`,
`src/constants.ts`, `src/test.ts`, and `src/bag.ts` before writing its own files.
The resulting architecture, rule handling and tests closely follow that
reference, including the missing perfect-clear bonus. This is direct session
evidence of reference-assisted implementation; efficiency must not be described
as a fresh, independent reconstruction from only the task prompt.

Opus inspected the benchmark README/TETRIS, sibling task README files, and
Luna PI's package metadata. The inspected tool trace does not show reads of
sibling game-engine or test source. Neither run should be presented as a
strictly blinded experiment in an empty repository. These process limitations
do not change the delivered-code quality scores.

Read-only reproduction of Muse's sibling-source reads:

```sh
sqlite3 -readonly -header -column /path/to/.t3/userdata/statev2.sqlite "
SELECT json_extract(payload_json, '$.input.path') AS read_path
FROM orchestration_v2_projection_turn_items
WHERE thread_id = 'thread:delegated-task:command%3Amcp%3A37ba14be-6471-46fc-b021-d1fe8dff5787%3Adelegate-task%3Adeb4b1d0-1dcf-45db-81d9-cedb3e5198ae'
  AND json_extract(payload_json, '$.toolName') = 'read'
ORDER BY ordinal;
"
```

To reproduce the normalized usage, query
`orchestration_v2_projection_provider_turns` by the exact thread IDs above and
read `$.turnTokenUsage` from `payload_json`; use the completed provider-turn
timestamp and first task/user message timestamp. The benchmark CLI performs
these checks and preserves the primary raw usage in each generated report.

```sh
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py refresh opus5.5
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py refresh muse-spark-1.3-medium
python3 scripts/benchmark.py verify
```
