# Qwen3.8 Max audits (low, medium)

Two **T3 Code / OpenCode (OpenCode Go)** runs. Qwen xhigh could not finish
because provider credit ran out and is **excluded**, with no inferred quality
score.

Audit date: **2026-10-25 (Europe/Rome)**. Each run implements
[`TETRIS.md`](../TETRIS.md) from the single prompt “Read the README.md file
and implement it”. This record supports [`ranking.json`](../ranking.json)
and [`RANKING.md`](../RANKING.md). Usage, cost, time and reasoning labels
have **no quality-score effect**.

## Method and calibration

Re-read the rubric, weights, Methodology and conformance/coverage tables;
reviewed the recent [Haiku](haiku-review.md), [Sonnet](sonnet-review.md),
[GLM](glm-review.md), [DeepSeek V4.1](deepseek-v41-review.md),
[GPT-6 Luna](gpt6-luna-review.md), [GPT-5.6 Luna](gpt56-luna-review.md)
and [GPT-6.1 Sol](gpt61-sol-review.md) records and their probe/browser/runner
workflows. Reviewed every audited source/test, page/CSS, package/lock/config,
server and supplied statistics against the task. No earlier finding was
presumed to apply to a new implementation.

The same **0–10 half-point scale**, weights **40/20/20/10/10** and fixed
correctness deductions apply: start 10; critical −4/cap 4; major −1.5;
minor −0.5; clamp at zero. Related scoring errors are grouped as in the
DeepSeek/Muse audits. Wrong SRS transitions and ordinary gravity progression
are major; lock-policy, refresh-remainder, hidden/partial lock-out, soft
transition and presentation defects are minor. Each defect is deducted
once, from correctness. Missing own tests determine tests; audit probes
never earn implementation-owned test credit.

**Sol calibration was checked independently:** reran the complete existing
`python3 .audit/run-gpt61-sol-audit.py --offline` unchanged. All four builds,
11/16/23/37 own suites, engine assertions and eight Chromium viewport
passes reproduced their recorded outcomes. Its 9.0/9.5 own-suite breadth,
compressed-code 7.0 and preview/focus minor severities align with the prior
calibration. A bounded two-row normal/Down boundary is not a separate soft
jump deduction (as in Sol high). No Sol or other historical score was changed.
A 50 ms high-level gravity floor is much slower than the previously accepted
16 ms fast floor; it is a different high-level progression, not merely that
accepted terminal optimization.

Installs, builds, tests and servers ran only in random disposable temporary
copies, excluding dependencies/generated output/.git. **Node 26.0.0**,
locked cached TypeScript and installed **Chromium 156.0.8078.4** were used.
`npm ci --ignore-scripts --offline`, `npm run build`, and the unchanged
`npm test` workflows all passed. Only hard-coded server port literals were
adapted in the copies; routing/MIME/application behavior was preserved.
Servers used only free **41000–49999** ports. T3 preview status/open was
checked and its incognito tab closed; the explicitly requested prior-audit
Playwright workflow was used. Work stayed on `main`, with no commit, stash,
reset or revert. No original implementation, registry, pricing, repository
script/test or site source was changed. Every started server/browser was
closed; disposable builds and screenshots were deleted after inspection.

Qwen medium had a pre-existing Git-ignored `build/test` tree, timestamped
**2026-10-25 12:45:27 +0100**, during generation and before this audit.
It was removed as generated output during final cleanup; no authored run
file was changed and all audited builds/tests used fresh temporary copies.

## Delivery and scores

| Effort | Build | Declared own tests | Chromium |
|---|---|---|---|
| low | Pass | All 15 fixed-seed cases pass | Starts |
| medium | Pass | All 13 fixed-seed cases pass | Starts |

| Effort | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 7.0 | 7.5 | 9.0 | 8.5 | 8.5 | **7.80** | 1 major, 3 minor |
| medium | 7.0 | 7.0 | 9.0 | 8.0 | 8.5 | **7.65** | 1 major, 3 minor |

### Low — 7.80

Run ID: `qwen3.8-max-low`. Summary: **Canonical core and broad smoke coverage; advanced scoring, soft timing, reset-cap and phone layout gaps**.

Tests **7.5**: all **15 deterministic own cases / 242 lines** pass. They cover ten seeded bag permutations, board walls/floor/above-top/line shift, initial/refilled queue, exact hard-drop points/four cells/ghost agreement, exact five-row soft points, level-one gravity, exact integrated double, restricted/post-lock hold retrieval, an actual right-wall I kick, blocked T rotation, grounded 300/600 ms delay, repeated move/reset behavior, blocked spawn/restart and entirely hidden lock-out. The reset case accepts premature locking after move fifteen; it does not pin the final reset timer. No independent obstructed ghost, full SRS oracle, spin/B2B/combo/PC assertion, level crossing, precise cap/ledge/soft transition, input or browser test exists. This is comparable to Sonnet medium/Haiku high’s 7.5 breadth.

Code **9.0**, simplicity **8.5**: **708 source TS lines**, seven focused pieces, board, randomizer, engine, input, renderer and entry modules. Strict unused checks, injected RNG, direct classes, a consistent seconds clock and no runtime dependencies keep the code readable. Public mutable snapshots/arrays rely on caller-maintained invariants. The abstractions are proportionate.

UX **8.5**: clear beveled colors, grid/outline ghost, complete hold/five-preview panels, DOM stats, full keyboard legend and custom DAS/ARR. No high-DPI adaptation, canvas accessibility label, touch UI or blur cleanup. Phone clipping is deducted only from correctness.

Correctness: `10 − 1×1.5 − 3×0.5 = 7.0`.

Confirmed findings:

1. **Major: T-spins, back-to-back and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single locks score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; single perfect clear is 100 instead of 900. Full T-spin double is 300 instead of 1200; normal clears, drop points and level-two combo scoring pass.

2. **Minor: Starting soft drop consumes earlier normal-gravity time.** Fifty update(0.016) calls leave O unmoved with 0.8 seconds accumulated. Real ArrowDown and a further 1 ms update move it sixteen rows and award sixteen points, consuming normal time at the new 50 ms soft interval. Both engine and Chromium reproduce it.

3. **Minor: The fifteenth reset forces an immediate lock.** On a floor O, fifteen alternating successful moves at 10 ms intervals leave no locked cells at 150 ms. The next 1 ms update locks four cells because lockResets>=15 is itself a lock condition, instead of allowing the last reset timer to elapse. Ordinary 499/500 ms locking and ledge safety pass.

4. **Minor: The fixed phone cabinet clips hold, stats and next.** At 390×844 document width is 503 px. The 304×604 board fits at x=43, but hold begins at x=-104 and next at x=372, each 120 px wide. The supporting panels are clipped; desktop previews are complete.

### Medium — 7.65

Run ID: `qwen3.8-max-medium`. Summary: **Canonical SRS and timed full/mini spins; hard-drop/PC scoring, soft timing, partial lock-out and phone gaps**.

Tests **7.0**: all **13 deterministic node:test cases / 167 lines** pass. They cover two bag permutations, initial queue, exact level-one/two gravity helpers, board line shift, a hard lock/new spawn without exact points/cells, exact Tetris, actual left-wall I kick, restricted/post-lock hold retrieval, empty-floor O ghost, exact soft rows/points, grounded 400/600 ms delay, integrated real-rotation timed T-spin double and hidden lock-out/restart. Compared with the 7.5 suites, hard-drop points/cells, blocked spawn, blocked rotation and reset/cap behavior are missing. It also omits mini/B2B/combo/PC integration, complete geometry, obstructed ghost, higher levels/crossing, precise timing/ledge/soft transition and input/browser checks.

Code **9.0**, simplicity **8.0**: **855 source TS lines**, seven focused modules, strict unused checks, injected RNG, dependency-free runtime, direct helpers and one millisecond clock. Typed-array board storage and matrix geometry add modest machinery but remain readable. Public state and mutable views need caller discipline; this is proportionate to the larger Sonnet/Haiku engines.

UX **8.5**: clear colored/beveled grid/ghost, hold dimming, five previews, score/clear messages, full legend, pause, custom DAS/ARR and blur cleanup. No canvas labels, high-DPI adaptation or touch UI. The fixed phone cabinet’s clipping is charged only to correctness.

Correctness: `10 − 1×1.5 − 3×0.5 = 7.0`.

Confirmed findings:

1. **Major: Hard drop cancels T-spins and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single hard drops score 0/100 instead of full 400/800 and mini 100/200. A full T-spin double scores 300 through hard drop versus 1200 timed. Timed full/mini, B2B and combos pass, but single perfect clear is 100 rather than 900. These related scoring errors form one grouped major deduction.

2. **Minor: Starting soft drop consumes earlier normal-gravity time.** Fifty update(16) calls accumulate 800 ms without motion. Real ArrowDown and update(1) move O sixteen rows for sixteen points because gravityAccum is spent at the new 50 ms interval. Engine and Chromium agree.

3. **Minor: A partially hidden piece incorrectly triggers lock-out.** From the real T spawn at field (3,-2), stack only (8,1), move right four times and advance 1000 ms in <=16 ms steps. T is grounded at (7,-1), with one hidden and three visible cells. Incoming I is independently open, but zero-travel hard drop ends the game. Board.lock tests minRow<HIDDEN_ROWS rather than every cell being hidden.

4. **Minor: The fixed phone cabinet clips hold, stats and next.** At 390×844 document width is 516 px. The 302×602 board fits at x=44, but hold begins at x=-106 and next at x=366, both 130 px wide. Supporting state and part of the legend are outside the initial viewport.

## Runner and isolation of probes

```sh
python3 .audit/run-qwen38-max-audit.py --offline
```

Omit `--offline` if locked dependencies are not cached. The default command
rebuilds/tests fresh copies, runs the [engine assertions](qwen38-max-audit.mjs)
and [desktop/390×844 Chromium assertions](qwen38-max-browser.cjs).
`--engine-only` explicitly skips browser findings; `--effort` selects one
run; `--artifacts-dir` retains screenshots/JSON **outside the checkout**.
Passing asserts defects as well as conforming paths, not bug freedom.
The runner uses installed Playwright/Chromium and downloads no new browser.

Qwen imports the unchanged emitted engines (low under `dist/src`, medium
under `dist`). Medium’s separate own-test CommonJS graph is built by its
unchanged npm test; the browser graph is explicitly built too. Both supplied
servers use a hard-coded PORT constant, adapted only in temporary copies.
The runner and canonical oracle/browser utilities are shared with the
[Terra suite](gpt56-terra-review.md) to keep fixtures and scoring identical;
the Qwen adapters call their own engines, not Terra rule implementations.

## Reproducible engine evidence

All 28 canonical coordinate sets pass, allowing one fixed O-origin translation
for Qwen’s 2×2 O. Every run has seven distinct colors. The independent SRS
oracle is the same as the recent audits. Every ordered CW/CCW transition of
the six rotating pieces is captured from real rotate calls; actual T/I
left/right wall and floor fixtures confirm behavioral effects. Collision
interception is only for ordered-candidate observation and is discarded;
normal engine probes always use the unchanged collision implementation.

The probes cover **100 actual engine bags** (ten seeds × ten bags), clearing
the board between real hard drops, plus hold restriction/queue consumption,
post-lock retrieval and orientation reset. Actual game-over/restart also
starts a fresh seven-type opening in both Qwen runs. All seven obstructed ghost
landings are independently free with a collision one row below; hard-drop
points equal twice travel and the four welded cells match. Actual Chromium
draws independently match all seven expected obstructed ghost poses, including
Terra high’s DOM ghost cells.

Exact grounded **499/500 ms**, successful action resets, a fifteen-reset
sequence, natural landing/contact and blocked soft descent are exercised.
The **ledge-move mid-air lock probe** rests O on a single support for 490 ms,
moves it one cell off, crosses the old deadline airborne for 20 ms, then
requires a later floor lock. All six pass ledge safety. The documented timer
and cap failures are asserted separately rather than inferred from source.

Zero-travel scoring fixtures cover single/double/triple/Tetris; legal final
rotation full/mini zero/single through both hard and timed locks; a real
two-rotation full double; a no-rotation corner lock; manual soft movement
cancelling rotation credit; B2B continuity across a no-clear, ordinary-clear
break, consecutive Tetrises, mini B2B; level-two combo, nine-to-ten crossing;
single perfect clear, single PC after B2B and B2B Tetris PC. The benchmark
uses the established additive PC profile. Normal scores and pre-clear level
multipliers pass; recorded advanced-score omissions must still reproduce.

Actual first-row boundaries are checked at **levels 1,2,5,9,10,14,15,20**,
with zero ordinary-gravity points expected where implemented correctly.
The unchanged frame callbacks are driven at **60 and 144 Hz**, including
level-two 1480.001/1564 ms and level-ten/fifteen 600 ms fixtures. The
**800 ms normal / real Down / 1 ms** transition is tested in the engine and
again in Chromium. Qwen jumps sixteen rows/points; Terra’s discrete Down
moves one, except low’s coincident normal boundary adds a second row/point
(already included in its automatic-gravity scoring finding).

Hidden lock-outs use only injected stack cells and real spawn/move/rotation
paths. A deterministic bounded search finds a legal wholly hidden grounded
T while an incoming I is independently open; the exact path is replayed
and asserted. Only Qwen ends correctly in that fixture. Qwen medium also
has a separate legal partly visible lock with the next spawn open. Blocked
spawn and real R restart pass all six. Terra low/medium’s exported engine
methods mutate after terminal state, while their real UI key guards pass;
that distinction is explicit, matching the GPT-5.6 Luna low engine finding.

The task’s [Fandom guideline link](https://tetris.fandom.com/wiki/Tetris_Guideline)
was unavailable (“Failed to fetch restricted URL”). The same benchmark
profile and the prior audits’ [SRS](https://tetris.wiki/Super_Rotation_System)
and [modern scoring](https://tetris.wiki/Scoring) references were checked.
PC scoring is the benchmark convention, not a claim that every licensed
Tetris version uses one identical scoring model.

## Chromium evidence

All required keys **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C**
were sent through real Chromium keyboard events at both sizes, with state
assertions. Real Space causes blocked-spawn game over, terminal UI keys are
inert, and **real R** resets board/hold/score/lines/level and hold availability.
Each entry response gains only appended accessors; RAF is captured so the
unchanged frame callback can be driven at precise timestamps. No engine,
input, rendering or frame body is changed. All screenshots were visually
inspected outside the checkout. No application exception, console error or
failed required asset occurred; favicon noise is excluded as in earlier audits.

| Effort | Desktop board (CSS px) | Phone document width | Phone board | Supporting-state evidence |
|---|---|---:|---|---|
| low | 304×604 at x=488 | 503 | 304×604 at x=43 | Hold x=−104,width=120; next x=372,width=120 |
| medium | 302×602 at x=489 | 516 | 302×602 at x=44 | Hold x=−106,width=130; next x=366,width=130 |

Both desktop queues render five complete graphical previews. Pixel and
forwarded-call checks show every I hold/next cell stays inside its backing;
the phone defect is cabinet clipping rather than missing preview paint.
All seven obstructed ghost poses are independently asserted from actual
draw calls. Both real callbacks reproduce sixteen-row/point soft jumps and
agree at the tested 60/144 Hz gravity durations. No separate frame-rate
finding is charged to Qwen.

## Supplied generation and isolation context (no score effect)

These facts were supplied by the parent/import record; session isolation
and usage were not recollected or re-accounted by this quality audit.

- **Low/medium:** no isolation findings.
- After medium, `cleanup` stopped T3’s OpenCode server before a leftover
  child, so no background notification turn began.
- The failed xhigh attempt exhausted provider credit and is outside scope.
- Runs executed **one at a time**; `preflight` confirmed free ports before
  each. Workspaces were registered through T3’s project tool, with
  `new --no-register` used as supplied. None of these facts changes quality.

| Effort | T3 thread | Native session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:058e6fc9-67ac-4995-a509-c53278779322` | `ses_e8d3e9e7dffe4ux8NsJj3a3US0` | 935,844 | 16m 33.165s |
| medium | `mcp:7c8be2a1-fbc9-48f4-8262-148ac05ec6f9` | `ses_e8d2f23f2ffeATJ0U3oGVZmNwY` | 1,115,669 | 19m 19.898s |

## Limits and validation

This is a focused conformance audit, not an exhaustive state-space proof,
long-duration playtest, physical-touch test, native OS key-repeat test,
high-DPI hardware test or another-browser certification. No such coverage
is claimed. T-spins cover legal representative full/mini pockets and a
full double; every possible spin/kick/PC arrangement remains unverified.
The supplied isolation facts were recorded, not reconstructed from provider
logs. Unknown overhead/model-call accounting remains unknown, not zero.

Final required checks after recording and regeneration:

- Fresh-copy family runner with `--offline`: **passed**, all builds,
  unchanged own workflows, every recorded engine outcome and desktop/phone
  browser assertion.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**.
- `python3 -m unittest discover -s tests`: **passed**, 63 tests, OK.
- `git diff --check`: **passed**.

Every previous ranking entry is unchanged as parsed data. Only these six
entries were appended. All temporary builds/artifacts/server groups and
browsers were removed or closed. Parent owns the commit.
