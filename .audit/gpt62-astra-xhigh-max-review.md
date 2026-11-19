# GPT-6.2 Astra xhigh / max independent audit

**2026-11-19, Europe/Prague. Reviewer: GPT-6.1 Sol xhigh, Codex / T3 Code.**
Reviewed **xhigh → max**, personally and without delegation. Actual identity
read from this reviewer's own native Codex `turn_context`:
**model=gpt-6.1-sol, effort=xhigh**, native session
**01a1f137-1330-7bb1-9f06-baba09195ffa**, turn
`01a1f137-14c6-7d51-a1f5-50a493c3f889`.
The [evidence](gpt62-astra-xhigh-max-evidence.json) records the exact native
rollout path and own T3 identifier; the orchestrator attached the
[review thread](t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3A4bf63111-3991-42bb-b316-58c1cf772400%3Adelegate-task%3A5d727c5c-acb9-455f-b594-d2e7c95052a4), confirmed model/effort from the native rollout
`turn_context`, and recorded that this review used 12 points of the Codex
5-hour window (12→24%) and 2 weekly points (72→74%). No tested-model transcript, other-run
transcript or `~/.t3` file was read. Generation effort, duration, usage, cost,
quota, art generation and accounting state have no effect on quality scores.
This reviewer did not generate/rerun models, commit, push, open PRs, change
registry/pricing/statistics, or archive projects. Parent verification of the
completed review and project lifecycle steps remain with the orchestrator.

## Scores

| Run | Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| xhigh | 9.0 | 7.5 | 9.0 | 9.0 | 9.0 | **8.70** | 2 minor |
| max | 9.5 | 8.5 | 9.0 | 9.0 | 9.0 | **9.10** | 1 minor |

Half-point categories, weights40/20/20/10/10; correctness starts10,
major−1.5/minor−0.5. Xhigh: `3.60+1.50+1.80+0.90+0.90=8.70`.
Max: `3.80+1.70+1.80+0.90+0.90=9.10`. Both build, pass their unchanged
own suites and play in Chromium. No critical or major finding applies.
Passing this audit harness reproduces confirmed defects as well as conforming
paths; it does not mean universal conformance.

## Xhigh findings

Coordinates below are visible x=0..9/y=0..19. Native storage adds20 to y.
Xhigh's O local origin is its leftmost mino; max's O local cells begin at
x=1, so max native x=2 is the same occupied pose as xhigh native x=3.
Fixtures set legal board/pose/clock state and invoke delivered actions.
No spin credit, successful-rotation outcome or application rule is injected.

1. **Minor — The fifteenth reset loses its 500ms delay on the next tick.**
   Fresh game, O r0 at native `{x:3,y:38}`, all clocks/reset counters0 and
   `lowest=38`. Advance100ms, then15 alternating successful Right/Left
   moves, starting Right. No cells are welded immediately after the last
   move (`resets=15`, `lockTime=0`). Call `tick(1)`: **four cells weld**,
   expected0 and a fresh500ms delay from move15. At499ms after move15
   actual4, expected0; at500ms both4. The14-move control remains active
   at1/499ms and locks at500ms. Actual keyboard actions plus the unchanged
   app frame callback reproduce this at both browser sizes.
   `adjust()` correctly grants a reset, but `tick()` locks whenever
   `resets>=15`, regardless of the remaining500ms
   ([game.ts](../gpt-6.2-astra-xhigh/src/game.ts), lines70–76,133–135).
   This is one reset-cap boundary finding, not a retained-clock finding.

2. **Minor — A clicked Sound button captures Space instead of hard drop.**
   While playing, mouse-click **Sound** (`#audio`), then press actual Space.
   At both viewports, stored cells stay **4→4**, score **28→28**, and the
   active O remains at(4,−1); sound toggles **false→true**. Expected a
   hard drop, four additional stored minos and unchanged sound state.
   The keydown guard returns for Space/Enter on focused-visible buttons;
   Chromium makes the clicked button focus-visible on the keyboard action,
   and the sound handler leaves focus there
   ([app.ts](../gpt-6.2-astra-xhigh/src/app.ts), lines55–60,213–223).
   Pause/resume refocuses the board and passes this same Space control.
   This is the same single focused-button minor as Sol6.1 xhigh.

## Max findings

1. **Minor — The fifteenth grounded reset locks immediately.**
   Fresh game, grounded O r0 at native `{x:2,y:38}`, clocks/reset counters0,
   `lowestY=38`, normal contact established via delivered
   `updateContact(false)`. Advance100ms, then15 alternating successful
   Right/Left moves, starting Right. Move15 **immediately writes four
   minos and spawns the next piece**, expected0 stored minos and500ms more
   on the current O. The14-move control remains active through499ms and
   locks at500ms. Actual keys reproduce the immediate15th lock in desktop
   and phone Chromium. `updateContact()` increments `lockMoves` then calls
   `lock()` at `>=MOVE_LIMIT`
   ([game.ts](../gpt-6.2-astra-max/src/game.ts), lines97–112).
   The delivered test explicitly expects the early15th lock; that does not
   change the benchmark's calibrated interpretation. No other independent
   defect was confirmed in the audited scope.

## Calibration and category rationale

The [Astra low7.75](gpt62-astra-low-review.md) and
[medium7.90/high8.60](gpt62-astra-medium-high-review.md) reviews supplied
matching probes and severity. Both new runs fix wholly hidden lock-out.
Both restore spent reset allowance and timers after genuinely lower descent,
and split landing time correctly. With O(0,12), support(0,14), fourteen
alternating moves then Right to leave on manipulation15, they land6000ms
and lock6500ms after departure. At the lower floor resets=0;400ms, Right,
100ms leaves just the one support stored. Nonexhausted490ms controls also
get500ms at the lower landing. One-row descent plus contact with100ms
callbacks locks at1500ms, unlike medium/low's1400ms.

The cap findings receive exactly the single minor assigned to the same
15th-reset error in [Sol6.2 xhigh](gpt62-sol-xhigh-max-review.md).
Xhigh's next-tick manifestation and max's immediate manifestation share the
same severity. Their perfect-clear and other scoring probes pass, so neither
gets Sol6.2 xhigh's PC omission or Sol6.2 max's major scoring/shape/gravity
substitutions. Xhigh's Sound focus finding matches
[Sol6.1 xhigh](gpt61-sol-review.md#xhigh--925). Max restores playfield focus
from Sound and passes; no analogous deduction. No duplicates from code,
UX or tests are applied for these correctness findings.

Unlike Astra high's independently scaled preview coordinates, both new
renderers draw square minos in fixed-ratio backing canvases and use
`object-fit: contain` on differently sized CSS boxes. A CSS box aspect
alone is not evidence of stretched cells. Four held-O diagnostic screenshots
were inspected alongside four final layouts; no preview distortion finding.
No deduction for three-next, high-level gravity cap/floor, optional controls,
ordinary floating-point/frame-boundary sampling or unresolved automatic
rather than manual gravity spin history.

**Xhigh own tests7.5:**12 meaningful unchanged passes cover50 real bags and
preview refills; every piece's real CW/CCW four-turn cycles/cardinalities;
I/T wall and T floor kick; trapped negative rotation; exact ghost/weld/drop
points; restricted hold/swap orientation and queue;999/1000 gravity,20× soft
speed and level2 interval;499/500 locking and movement reset; eventual cap;
consecutive Tetris PC/B2B/combo totals including the3200 bonus; real full/mini
zero-line rotations; blocked spawn and terminal guards. Compared with Astra
high7.0, it adds trapped/floor/both-direction rotation and B2B-PC coverage.
It lacks authoritative matrices/all kick candidates, exact15/16 boundaries,
failed reset/ledge/contact/lower-row tests, non-PC1–4 and spin clears/history,
all PC sizes, explicit compaction/level-crossing, hidden/partial, restart and
browser tests. Randomized bag order is unseeded, but the bag assertion is
order-independent. Our audit probes earn no own-test credit.

**Max own tests8.5:**20 unchanged deterministic passes add initial lifecycle
and queue identity; seeded50 bags with order variation; CW/CCW cycles;
I/T wall/floor kicks including fifth I kick and trapped negative;
obstructed ghost/drop/weld; exact gravity/soft speed; mid-update contact;
failed wall/blocked-soft nonreset; reset-cap and restored lower-row budget;
full hold roundtrip; all1–4 normal clears at pre-clear level and level crossing;
nonadjacent row compaction; B2B across no-clear and break; real T-spin double
and full/mini zero; consecutive PC Tetrises with B2B/combo; blocked spawn
from queue and hold with terminal guards. This is substantially broader than
Astra high7.0 and Sol6.2 xhigh6.5; below Sol6.1 max9.0's broad suite.
Missing canonical matrices/all kick candidates, PC1–3, spin triple/mini
clears/fifth-kick classification and HD-SPIN-1/manual-credit controls,
explicit wholly/partially hidden lock-out, fresh restart and browser tests.
The cap case encodes the confirmed defect; its other meaningful assertions
still count as coverage, without treating a wrong expectation as conformance.

**Code9.0 / simplicity9.0 both:** strict dependency-free TypeScript, DOM-free
engines with injectable random generators, shared SRS geometry, direct small
controllers/renderers and bounded arrays. Xhigh822 TS lines separate
pieces/game/art/app; max744 separate pieces/game/render/sound/main. Event-split
timers, one engine state, small built-in Node servers and max's trivial asset
copy keep the designs proportionate. Public fixture-accessible game state and
canvas rendering remain understandable; no framework, runtime package or
unnecessary abstraction. Font/art files are static resources, not runtime
dependencies. These categories match Astra high and Sol6.2 xhigh9.0/9.0.

**Browser UX9.0 both:** clear seven colors, grid, visible ghost, hold and
three-next, score/lines/level, best persistence, discoverable controls,
pause/restart, visibility/blur pause, optional sound and phone controls.
Xhigh has a compact handheld layout, DPR board rendering and full phone
move/CW/CCW/down/drop/hold; its board is244×488 at desktop(304,195.672),
210.594×421.188 at phone(32.703,150.75). Phone help/best continue below
844px (document1135), while board/support/buttons stay accessible.
Max's legible local fonts, restrained space art, used-hold dimming, progress,
placement feedback, ARIA updates and repeated pointer/keyboard controls help
play. Board311×622 at desktop(484.5,135.188),233×466 at phone(15.5,197).
Its804px desktop document has4px harmless vertical overflow, without board
clipping; phone document844. Art never covers play. Both preserve square board
and preview minos. Art/asset quantity earns no separate bonus;
these receive the same9.0 as the well-functioning earlier interfaces.

## Coverage, preservation and reproduction

Fresh random temporary copies run locked `npm ci --ignore-scripts --offline`,
explicit `npm run build` and unchanged `npm test`: **12/12 xhigh,20/20 max**.
TypeScript5.9.3, environment versions and full workflow output are in evidence.
All **14 xhigh+24 max=38** delivered SHA-256 values are recorded there and
asserted unchanged for both the original and copied delivery after testing.
No delivered implementation is edited, including temporary port literals:
both intended `scripts/serve.mjs` servers honor PORT. Max serves its built
`dist/` root, consistent with the registry; modules are `/main.js` and
`/game.js`, rather than `/dist/...`. Only free41000–49999 ports are used.

Equivalent Node and served-module Chromium probes cover all28 canonical SRS
states,48 ordered non-O kick lists,576 real rotations per run with intact
collision,100 actual engine bags each, restricted hold/retrieval, seven
obstructed ghost/drop/weld controls, ordinary499/500/reset/failed-wall/cap,
retained timers and spent budgets after descent, mid-frame contact and60/144Hz
cadence, levels1–20/soft-entry timing, all1–4 normal/PC clears, B2B/combo,
PC-B2B and pre-clear level, compaction, blocked spawn/terminal freeze,
wholly/partially hidden O and public-action T locks, natural top-out/new-game
reset. Sacrificial fits rejection only enumerates candidates; no real rotation
outcome is replaced. O's fixed translated origin is the only geometry facade.

T-spin probes use actual rotations for all four facings, full/mini zero/single
hard and timed locks, double, fourth/fifth kick distinction, two-corner/no-
rotation negatives, failed-action retention, successful lateral/manual-soft
cancellation, and spin B2B across a no-clear placement. Exact SPEC HD-SPIN-1
travel14→28 and zero mini/full→100/400 pass in Node and actual Up/Space at
both viewports. No bonus credit is assigned by fixtures. The explicit negative
controls and spin-B2B probe were added after screenshot inspection, then
rerun in both engine and browser contexts.

Real Left/Right/Up/X/Z/LeftCtrl/Down/Space/C, pause freeze/resume, natural
game-over/R restart, clicked Pause/Sound then Space, and all phone buttons
are exercised. Both browser sizes replay the complete engine suite with
identical outcomes. No page error or failed required asset; actual ghost
pixels differ at edge/interior as expected. Installed root Playwright1.64.0,
Chromium156.0.8078.4; no download. Four gameplay layouts and four held-O PNGs
were visually inspected before deletion. Browser/server processes, profiles,
logs, screenshots and every temporary copy were closed/deleted.

Initial sandbox-local binding was denied; approved execution completed the
same isolated workflow. A browser assertion initially expected a Sound-click
hard drop in xhigh; observed behavior became finding2, with actual/expected
outcomes retained in evidence. The ledge fixture uses one support so action15
leaves support rather than immediately locking max on an intermediate ledge
pose. These are audit adaptations, not implementation edits.

```sh
python3 .audit/run-gpt62-astra-xhigh-max-audit.py --offline
python3 .audit/run-gpt62-astra-xhigh-max-audit.py --offline --effort max --engine-only
# Pause for visual inspection before automatic cleanup:
python3 .audit/run-gpt62-astra-xhigh-max-audit.py --offline --review
```

[Runner](run-gpt62-astra-xhigh-max-audit.py),
[engine probes](gpt62-astra-xhigh-max-audit.mjs),
[browser probes](gpt62-astra-xhigh-max-browser.cjs),
[evidence](gpt62-astra-xhigh-max-evidence.json).
Default execution compares all pinned engine/browser outcomes and hashes;
`--record` intentionally refreshes numeric evidence. Omit `--offline` only
if dependencies are not cached. The runner preserves original reviewer
metadata when reproducing an existing audit.

This is focused conformance testing, not exhaustive state-space proof,
physical-touch/long-duration play, cross-browser or high-DPI certification.
Full spin triples and mini doubles lack separate integration fixtures;
their score tables are source-reviewed. Automatic-gravity spin history remains
unresolved and unscored. No claim about usage reconciliation is made.

## Validation

- Both final isolated builds/unchanged own suites/Node/Chromium workflows pass;
  the default pinned fresh-copy reproduction passes both runs in order.
- `python3 scripts/benchmark.py render`: exit0.
- `python3 scripts/benchmark.py verify`: exit0.
- `node .audit/verify-ranking.mjs`: deductions, arithmetic, ordering, local
  links and tables pass for101 scores.
- Both JavaScript probes pass `node --check`; Python runner parses;
  `git diff --check` passes.
- All99 prior ranking entries retain identical data; registry/pricing and
  all38 delivered hashes, including their STATISTICS.md files, are unchanged.
  Audit index, ranking entries/sections/ordinals and generated README/ranking
  tables are the only existing-file changes.
