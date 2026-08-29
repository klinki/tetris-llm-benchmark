# Luna PI audit evidence

Audit date: 2026-08-29

This review covers the committed `luna-pi` implementation and only the PI
session `01a04d53-e6c9-79d1-9951-23a0fa6b6e30`. The source session is:

```text
/Users/agent/.pi/agent/sessions/--Users-agent-projects-luna-pi--/2026-08-29T11-42-19-337Z_01a04d53-e6c9-79d1-9951-23a0fa6b6e30.jsonl
```

## Session isolation and accounting

- The session header declares version 3, the exact configured ID, and working
  directory `/Users/agent/projects/luna-pi`.
- All 25 assistant responses use provider `openai-codex` and model
  `gpt-5.6-luna`.
- The benchmark has one user message, beginning at
  `2026-08-29T11:43:01.586Z`; the final assistant response completed at
  `2026-08-29T11:55:28.069Z`.
- Usage is per response, so the collector sums each assistant usage object. It
  does not treat the final response as cumulative.
- The resulting tested-agent total is 970,356 tokens: 65,368 input, 866,304
  cache read, 0 cache write, and 38,684 output. The 21,095 reasoning tokens are
  already a subset of output.
- The session contains 41 tool calls and 41 tool results: 18 writes, 12 shell
  calls, 6 edits, and 5 reads. Four tool results are errors: an expected
  non-repository Git check, a pre-install TypeScript failure, and two failed
  edit attempts. The run ultimately installed, rebuilt, tested, and served the
  implementation successfully.
- No separate model-powered PI harness request is present, so configured
  harness overhead is zero.

The exact-session sum can be reproduced with the PI `jq` command in the root
[`README.md`](../README.md).

## Build and existing tests

The project was copied without `.git`, `node_modules`, or generated `dist`
directories. In that isolated copy, both commands completed successfully:

```sh
npm ci --ignore-scripts
npm test
```

The smoke suite deterministically covers two seven-bags, incomplete and full
line clearing, a concrete I-piece SRS wall kick, hold availability, gravity,
ghost projection, and a single-line perfect clear. It does not cover the lock
delay/reset cap, top-out/restart, T-spins, back-to-back, combos above level one,
all SRS states, or browser behavior.

## Engine review and probes

Strengths:

- Rules, board state, randomization, piece geometry, rendering, and browser
  input are cleanly separated.
- All 28 normalized piece/orientation coordinates match canonical SRS data,
  and the implementation includes the standard JLSTZ and I kick tables.
- The engine implements a seven-bag, five-piece preview, one-hold-per-piece,
  ghost projection, 500 ms lock delay with a 15-reset cap, drop points,
  T-spin mini/full detection, back-to-back, combos, perfect clears,
  level-dependent gravity, blocked-spawn top-out, and restart.

Confirmed defect:

- **Minor: combo points are multiplied by the level twice.** At level two with
  an existing combo, a single should award `100×2 + 50×1×2 = 300`. In
  `awardLineScore`, the implementation first adds `50 × combo × level` to
  `base`, then multiplies the entire base by the level, awarding 400. The
  committed common audit probe reproduces this exact result.

[`common-audit.mjs`](common-audit.mjs) also verifies that Luna PI has no SRS
orientation mismatch.

## Browser review

The implementation was served at its intended local URL and checked in
Chromium at 1280×800 and 390×844. The required sequence—Left, Right, Up, X, Z,
Left Control, Down, Space, and C—executed without a runtime error; the hard
drop advanced the visible score and the game remained active.

At 390 px, document width and viewport width were both 390 px. The board
remained 298×596 CSS pixels, and the sidebar reflowed below it. The page had no
application console errors. The mobile layout is clear but vertically long
because the five-piece preview retains its full 480 px canvas height, and it
does not provide touch controls.

## Assigned scores

| Category | Score | Rationale |
|---|---:|---|
| Correctness | 9.5 | One confirmed minor scoring defect; all explicit game features are present |
| Tests | 6.5 | Useful deterministic engine coverage, but important timing, scoring, top-out, and browser gaps |
| Code quality | 9.0 | Strong separation, types, state design, readability, and defensive timing/input handling |
| Simplicity | 7.0 | Clear locally, but 1,076 source lines and several abstractions make it one of the larger implementations |
| Browser UX | 8.5 | Polished, responsive, and clean at both widths; long mobile support panel and no touch controls |

Weighted score: `9.5×0.40 + 6.5×0.20 + 9.0×0.20 + 7.0×0.10 + 8.5×0.10 = 8.45`.
