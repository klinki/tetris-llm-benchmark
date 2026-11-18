# GPT-6.2 Astra low independent audit

**2026-11-18, Europe/Prague. Reviewer: GPT-6.1 Sol, xhigh, Codex / T3 Code.**
Run `gpt-6.2-astra-low`, GPT-6.2 Astra low, T3 Code / Codex.
Actual reviewer identity was read from this reviewer's own native Codex
`turn_context`: **model=gpt-6.1-sol, effort=xhigh**, native session
**01a1f00f-4630-7512-ae97-2706f49a595e**. The rollout path and turn ID are in
[evidence](gpt62-astra-low-evidence.json), together with this
[review thread](t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3A46ba4f68-804a-4272-8f02-8dc3b8f31069%3Adelegate-task%3A2813d3f5-1785-4f01-8638-1e7d13092d61).
T3's own-thread configuration independently agrees. No other native session,
implementation transcript, or `~/.t3` file was read. I performed the audit
myself without delegation. Generation effort, elapsed time, usage, cost and
quota have no effect on these quality scores.

## Scores

| Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 9.0 | 4.0 | 8.0 | 9.5 | 8.0 | **7.75** | 2 minor |

Correctness `10−2×0.5=9.0`. Weighted
`9×.40 + 4×.20 + 8×.20 + 9.5×.10 + 8×.10 = 7.75`.
Half-point category scores and the existing 40/20/20/10/10 weights apply.
The delivered game builds, passes its five unchanged smoke tests, and is
playable. No major or critical finding applies.

## Findings

All fixture coordinates below use the visible field: x=0..9, y=0..19.
The delivered engine stores y+20; for example O at visible (0,12) means
`kind='O', r=0, x=0, y=32` in `Game`. Pose/stack/clock setup is permitted;
all rotations, moves and locks use delivered methods. No spin-credit flag
is assigned by the fixtures.

1. **Minor — Lock timing and spent reset state survive descent incorrectly.**
   These related lock-policy variants form one finding.

   - **Retained clock:** fresh O r0 at (0,12), stack (0,14),(1,14).
     Make fifteen successful alternating Right/Left moves, starting Right;
     the O ends at x=1 with resets=15. Advance490ms. Right twice moves
     it off the ledge, retaining lock=490 while airborne. Advance in1ms
     ticks. The O reaches the floor5510ms after departure and locks at5519ms,
     only9ms after landing; four O minos join the two supports. Expected a
     fresh500ms lower-row lock interval, through6010ms after departure.
     The unspent control reaches the same floor5510ms and locks6009ms
     (the independent contact-accounting variant below explains that1ms).
     This is early locking after landing, not an airborne lock.
   - **Retained allowance:** same O/supports, fourteen alternating moves
     starting Right, then Right twice, without the490ms wait. The last
     grounded action spends reset15. Descend to the lower floor: resets
     remains15. Advance400ms, successfully move Right, then advance100ms.
     Actual six stored cells and a newly spawned piece; expected the two
     supports with the O still active after its fresh reset. Both Chromium
     viewports reproduce this through real keyboard events.
   - **Landing-frame time:** fresh O r0 at (3,17), fall/lock clocks0.
     Fourteen `tick(100)` calls weld the O at1400ms, expected1500ms
     (1000ms to descend one row plus500ms grounded). At10ms steps it
     locks1490ms; other frame partitions are recorded. The complete100ms
     landing frame is added to lock, including its pre-contact time.
     Both actual browser frame paths reproduce1400ms.

   `down()` increments y without renewing the lower-row clock/allowance;
   `adjust()` renews only grounded manipulation below15 resets;
   `tick()` adds the entire delta when grounded at the end
   ([engine](../gpt-6.2-astra-low/src/game.ts), lines33,42,59–63).
   Controls pass: stationary499/500ms, an ordinary successful reset,
   failed-wall nonreset, and a full500ms grant on reset15. There is **no**
   fifteenth-reset immediate-lock defect here.

2. **Minor — A wholly hidden lock does not top out.** Fresh O r0 at
   visible (0,−2), support (0,0), next queue entry I. This is a legal,
   grounded pose with zero ghost travel. Hard drop writes all four O
   minos above the visible field and spawns I at (3,−1), with over=false
   and five stored cells. Expected game over when the entire O locks above
   the visible field. Actual Space reproduces over=false at desktop and
   phone sizes. Partial-hidden control O(0,−1), support(0,1), correctly
   keeps playing and preserves all four O cells. Normal blocked-spawn
   top-out and post-game action guards work. `place()` writes/clears and
   always calls `spawn()` without checking wholly hidden lock-out;
   `spawn()` only checks the replacement piece's collision
   ([engine](../gpt-6.2-astra-low/src/game.ts), lines29–30,44–57).

## Calibration

The lock variants share one minor, following the grouped delay/reset/
lower-row-clock treatment in the recent
[Sol xhigh/max audit](gpt62-sol-xhigh-max-review.md), rather than deducting
once per timer symptom. The top-out boundary is a separate minor, consistent
with earlier hidden/partial-lock boundary findings and the whole-hidden
control in the [Sol6.1 max review](gpt61-sol-max-review.md). Neither makes
normal gameplay unusable. Unlike Sol6.2 xhigh, this run implements additive
perfect-clear bonuses and grants the fifteenth reset its complete500ms.
Unlike Sol6.2 max, the standard shapes, all tested SRS lists/outcomes,
scoring and ten-line progression agree with the benchmark requirements.
No extra deduction for spawn position, the high-level gravity cap, native
OS repeat, missing optional touch UI, or unresolved automatic-gravity spin
history. Implementation defects are not deducted again from code or tests.

**Own tests4.0:** five real Node tests cover a single seven-unique bag,
restricted hold plus retrieval after a hard lock, an integrated I single
perfect clear with499/500ms timing and900 points, blocked O spawn, and four
rotations restoring a randomly selected shape. All five pass unchanged.
The rotation case can choose O and tests neither canonical states nor kick
acceptance; the bag case exercises only the opening bag; there is no fixed
seed or injected RNG. No exact ghost/drop-point checks, normal multirow
scores, T-spin/mini/B2B/combo, PC2–4, level/gravity boundary, reset cap/ledge,
hidden lock-out, restart or browser/input assertions. This is narrower than
Sol6.2 low4.5, which additionally checks preview/ghost/positive drops,
a wall outcome and hold-triggered spawn, and well below medium/xhigh6.5's
actual kick/scoring integration. Audit probes earn no own-test credit.

**Code8.0:** strict dependency-free TypeScript, a DOM-free engine and a
separate canvas controller, straightforward bounded arrays and small methods.
The complete99 source lines are unusually compressed: multiple state writes
and branches per line, numeric spin/kick-index encoding, broad string kinds
and publicly mutable state make the rules harder to inspect and extend than
the recent9.0 engines. RNG is a global dependency. The small server and
reused geometry helpers are proportionate; no rule bug is charged here again.
**Simplicity9.5:** direct two-module implementation, no framework/runtime
packages or duplicated controller/state layer, one build and a tiny fixed-file
server. Comparable to the very direct Sol6.2 low9.5.

**Browser UX8.0:** clear seven colors, grid, outlined ghost, hold/five-next,
readable score/lines/level, complete keyboard legend and a clear R restart
message on game over. Keyboard controls and repeated Space events function
in both viewports. Both screenshots were visually inspected: no horizontal
overflow or clipped active play/support panel; preview cells remain square.
Desktop board is319.6×639.2 at(480.2,90), document1280×813; the13px vertical
scroll does not obscure the board or legend. Phone board is203.5×407.1 at
(93.2,91.3), document390×844. No pause, touch controls, focus/blur handling,
custom DAS/ARR, live announcements or device-pixel-ratio backing. The board
has an accessible label. This matches Sol6.2 low8.0's clear keyboard-only
interface; optional absent controls are not correctness findings.

## Coverage and reproduction

Read every one of the12 delivered files: all TypeScript, test, HTML/CSS,
server, manifests/lockfile/config/ignore, README and statistics. Read the
supplied task, reviewer policy, SPEC.md/HD-SPIN-1, ranking methodology and
recent calibration reviews. All12 SHA-256 hashes are in the evidence and
are asserted unchanged. No delivered implementation, tests or report changed.

Fresh random temporary copies ran `npm ci --ignore-scripts --offline`,
explicit `npm run build`, and unchanged `npm test` (**5/5**); TypeScript5.9.3.
The independent probes run both in Node and against the real served engine
module at1280×800 and390×844, with identical engine outcomes:

- 28 canonical states, allowing one fixed O-origin translation;48 complete
ordered non-O candidate lists;576 actual collision-checked rotations around
walls/floor/ceiling/obstacles, with no state/list/outcome mismatch. O's inert
rotation preserves the same square geometry.
- 100 actual seven-piece bags, hold restriction/retrieval/spawn, seven
obstructed independent ghost destinations, exact soft/hard points and welds.
- Normal clears100/300/500/800; PC900/1500/2300/2800; combo250 total,
level-two second single300; Tetris/no-clear/Tetris2000; broken B2B1850
including combos; non-PC Tetris/no-clear/PC Tetris5200; pre-clear-level
PC crossing900 while entering level2; nonadjacent compaction.
- Real-rotation full/mini zero/single hard and timed locks100/200/400/800;
all four facings full400/mini100; T-spin double1200; fourth-kick mini100
and fifth-kick full400; no-rotation0 and failed-action full400. Exact
HD-SPIN-1 travel14→28 and zero-distance mini/full→100/400 also pass
through actual Up/Space in both views. Fourteen manual soft rows cancel
old spin credit and total14 ordinary drop points.
- 499/500ms lock, ordinary reset, cap/failed-wall paths, ledges/new-lowest,
contact at10/100ms and60/144Hz partitions, first-fall curve levels1–20,
ten-line level crossing, hidden/partial lock, blocked spawn, terminal
freeze, natural top-out and fresh restart. Browser Left/Right/Up/X/Z/
LeftCtrl/Down/Space/C/R, numeric status, ghost pixels and queue/hold panels
were exercised. No page errors or failed required assets.

The lists above are coverage bullets; no complete-state-space claim is made.
Mini-double/full-triple and all possible spin/B2B combinations are not
independently forced; their lookup/difficult-clear logic was source-inspected.
The48-list diagnostic temporarily rejects `fits` in sacrificial objects
only to enumerate candidates;576 real outcomes retain original collision.
Browser instrumentation appends getter/reset/render accessors to the UI
response and supplies a deterministic RAF clock/RNG; no application rule body
is replaced. The baseline shared-preview startup separately loaded the
unmodified page as Tetris. Its screenshot failed because the browser was not
producing screenshot frames; the owned tab was closed. Chromium screenshots
from the requested installed Playwright were inspected instead.

```sh
python3 .audit/run-gpt62-astra-low-audit.py --offline
# Inspect the two PNGs, then Enter deletes them with the copy:
python3 .audit/run-gpt62-astra-low-audit.py --offline --review
# Engine-only / intentional evidence refresh:
python3 .audit/run-gpt62-astra-low-audit.py --offline --engine-only
python3 .audit/run-gpt62-astra-low-audit.py --offline --record
```

[Runner](run-gpt62-astra-low-audit.py), [engine probes](gpt62-astra-low-audit.mjs),
[browser probes](gpt62-astra-low-browser.cjs), [evidence](gpt62-astra-low-evidence.json).
Normal mode compares outcomes with the pinned evidence, including defects;
a passing runner establishes reproducibility, not universal conformance.
Installed Playwright/Chromium only; no downloads. Only the temporary server's
8321 literal is changed to a free41000–49999 port, then restored before
copied hashes are checked. Every disposable copy/log/PNG and owned server/
browser group is deleted on success or handled failure/interruption.

Initial harness corrections: Node's installed test reporter emits `pass5`
with a Unicode prefix, so the parser accepts that rather than requiring TAP's
`#`; lower-row fixture move counts were corrected to actually spend15 resets.
The sandbox initially denied port binding; the approved final runner used
local free ports. None of these are implementation defects. This is a focused
Chromium/engine review, not exhaustive play, physical-touch/HiDPI, OS repeat,
multikey/focus, performance or cross-browser certification. Automatic-gravity
spin interpretation remains unscored. Generation/accounting/isolation are
separate; no transcript-based generation claim was re-audited.

## Validation and lifecycle

The recorded full fresh-copy audit passed, both final PNGs were inspected,
and cleanup completed. A separate default-mode pinned rerun verifies numeric
reproducibility. Repository render/verify and ranking/link checks pass after the scored
entry is added. All96 historical ranking entries,
registry, pricing and every statistics report are preserved. Pre-existing
uncommitted registry/pricing/README changes were retained.

- `python3 .audit/run-gpt62-astra-low-audit.py --offline --record --review`: pass; locked install/build, unchanged5/5, Node and both Chromium views; two final PNGs inspected and removed.
- `python3 .audit/run-gpt62-astra-low-audit.py --offline`: pass in a separate fresh copy; all pinned engine/browser outcomes reproduce, cleanup and12 hashes confirmed.
- `python3 scripts/benchmark.py render`: exit0.
- `python3 scripts/benchmark.py verify`: exit0.
- `node .audit/verify-ranking.mjs`: exit0;585 local links,97 scored rows, deductions, arithmetic, ordering and tables pass.
- Both JavaScript probes pass `node --check`; Python runner passes `ast.parse`; `git diff --check` passes.
- Parsed preservation:96 old ranking entries identical; all12 delivered hashes and99 protected registry/pricing/statistics files match the initial snapshot. No disposable audit directory remains.

This completes the independent quality review. The parent must confirm this
completed review turn and perform any required isolated-project archival;
this subagent did not archive projects, rerun generation, commit, push or
open a PR, and did not change the registry, pricing or statistics accounting.
