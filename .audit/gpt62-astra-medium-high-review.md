# GPT-6.2 Astra medium / high independent audit

**2026-11-19, Europe/Prague. Reviewer: GPT-6.1 Sol xhigh, Codex / T3 Code.**
Reviewed `gpt-6.2-astra-medium` then `gpt-6.2-astra-high`, against `TETRIS.md`.
Actual identity read from this reviewer's **own native Codex `turn_context`**:
**model=gpt-6.1-sol, effort=xhigh**, native session
**01a1f125-7151-7582-b6f7-0e1c1fc36b1c**, turn
`01a1f125-7544-70e2-a737-9e7db9f8fc95`.
The exact rollout path and own T3 thread identifier are in the
[evidence](gpt62-astra-medium-high-evidence.json). Automatic approval review
rejected the own-thread-link lookup as transcript risk; no T3 transcript
was returned. The orchestrator attached the
[review thread](t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3A4bf63111-3991-42bb-b316-58c1cf772400%3Adelegate-task%3Aa2f8546f-936a-43b2-ade5-fbd4be943faa) from its delegation record and confirmed
model/effort from the native rollout `turn_context`. This review used 12
points of the Codex 5-hour window (0→12%) and 2 weekly points (70→72%). No tested-model transcript, other-run transcript or `~/.t3` file was
read. I performed the review myself, without delegation. Generation effort,
time, tokens, cost and quota do not affect these scores.

## Scores

| Run | Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| medium | 9.0 | 4.5 | 8.0 | 9.5 | 8.5 | **7.90** | 2 minor |
| high | 9.0 | 7.0 | 9.0 | 9.0 | 9.0 | **8.60** | 2 minor |

Both correctness scores are `10−2×0.5=9.0`. Weighted medium:
`9×.40+4.5×.20+8×.20+9.5×.10+8.5×.10=7.90`; high:
`9×.40+7×.20+9×.20+9×.10+9×.10=8.60`.
Half-point categories, 40/20/20/10/10 weights, major −1.5/minor −0.5.
Both build, pass their unchanged suites and are playable; no major or critical
finding applies. The probes reproduce defects as well as conforming paths.

## Medium findings

Coordinates are visible x=0..9/y=0..19; the engine stores y+20. O's local
origin is its leftmost cell. Fixtures establish board/pose/clocks, then call
delivered actions. Rotation-credit flags are never injected to obtain a spin.

1. **Minor — Lock timing and spent reset state survive descent incorrectly.**
   One related lock-policy group, matching the low-effort run.

   - O r0 at (0,12), support cells (0,14),(1,14). Fifteen successful
     alternating Right/Left moves, starting Right, end at x=1/resets=15.
     Advance490ms; Right twice leaves the ledge with lock=490. With1ms ticks,
     the O lands5510ms after departure and locks5519ms after departure,
     **9ms after contact**, expected fresh500ms through6010ms. The unspent
     control lands5510/locks6009ms; the1ms difference is contact accounting.
     There is no airborne lock.
   - Same setup, fourteen alternating moves starting Right, then Right
     twice, without the490ms wait. The last grounded action spends reset15.
     After descending to the floor, resets remains15. Wait400ms, successfully
     move Right, wait100ms: actual six stored cells and replacement piece,
     expected only the two supports and a fresh500ms movement reset. Real
     keyboard events reproduce this at both Chromium viewports.
   - Fresh O r0(3,17), fall/lock0: fourteen `tick(100)` calls lock it at
     **1400ms**, expected1500ms (1000ms descent+500ms grounded). At10ms steps
     it locks1490ms. The browser's real100ms callback path also locks1400ms.
     The whole landing frame is charged, including time before contact.

   `down()` never renews the lower-row delay/allowance; `resetLock()` only
   renews grounded actions below15; `tick()` adds the whole delta when the
   final pose is grounded ([game.ts](../gpt-6.2-astra-medium/src/game.ts),
   lines49,65,67–72). Controls pass499/500ms stationary locking, ordinary
   movement reset, failed-wall nonreset, and a complete500ms grant on reset15.

2. **Minor — A wholly hidden lock does not top out.** Fresh grounded O
   r0(0,−2), support(0,0), next I, zero-travel hard drop: four O minos are
   stored above the visible field, I spawns, **over=false/cells=5**. Expected
   lock-out/game over. Partial-hidden O(0,−1), support(0,1), correctly
   continues and retains all cells. Actual Space reproduces both at both
   viewports. An independent public-action control injects no active pose:
   stack(2,0),(3,1),(4,1), actual T spawn at(3,−1), CW,CCW,Left,Left reaches
   grounded T r0(0,−2); zero-travel hard drop with next I also leaves
   over=false/cells=7. Expected game over. Partial control stack(8,1), actual
   T spawn then Right×4 reaches T r0(7,−1) and correctly continues.
   `place()` writes/clears/spawns without testing the locked piece's wholly
   hidden position (same engine, lines74–88); blocked-spawn top-out and
   terminal action guards pass.

## High findings

Canonical SRS coordinates apply. Engine y is visible y+20; high's O local
cells begin at x=1, so canonical O x=−1 is the same occupied square as
medium's O x=0. The probe facade exposes a fixed translated O origin only.

1. **Minor — A wholly hidden lock does not top out.** The same O fixture
   above uses `active={kind:'O',rotation:0,x:-1,y:18}`, support
   `board[20][0]='J'`, next I. Zero-travel `hardDrop()` leaves
   **over=false/cells=5**, expected game over. Partial control uses y19,
   support `board[21][0]`; it correctly continues. Both actual Space paths
   reproduce in desktop and phone Chromium. The pose-free T sequence above
   also yields r0(0,−2), zero travel, over=false/cells=7. High's `lock()`
   writes the hidden cells, compacts and unconditionally spawns; it never
   tests wholly hidden lock-out
   ([game.ts](../gpt-6.2-astra-high/src/game.ts), lines162–192).
   Blocked spawn and terminal guards pass, so this is the same boundary
   minor as low/medium, not a broad top-out failure.

2. **Minor — Hold previews scale square cells non-uniformly.** In
   `preview()`, `surface(canvas,100,42)` maps a logical100×42 space into the
   canvas's CSS dimensions using separate x/y scales
   ([display.ts](../gpt-6.2-astra-high/src/display.ts), lines53–65,93–103).
   Desktop CSS explicitly sets hold to120×48, so a16-unit square becomes
   **19.2×18.286px**, width/height **1.05**, expected equal dimensions.
   At390×844, hold measures77.203125×34px: logical-cell aspect
   **0.953686** (rounded `clientWidth` diagnostic0.951176), visibly slightly
   taller than wide. The media rule sets84×34 then constrains width to100%
   ([style.css](../gpt-6.2-astra-high/style.css), lines267–270,631–636).
   Set a held O and render with the delivered Display: its2×2 outline is
   mildly wide on desktop/tall on phone. Both additional O screenshots were
   inspected. Expected isotropic scaling or proportional canvas geometry.
   The board stays exactly1:2; desktop next previews are square. Phone next
   cells have the smaller authored0.98 aspect; these share one preview
   finding. There is no clipping or missing queue entry.

## Calibration and category rationale

The [Astra low audit](gpt62-astra-low-review.md), **7.75**, supplies directly
identical medium lock/buffer fixtures and severity: one grouped lock minor,
one hidden-lock minor. Medium earns0.10 more from its slightly broader own
suite and0.05 from pause/mobile controls. High fixes the retained clock,
spent-reset and contact-time paths: the exhausted ledge lands6000ms and locks
6500ms, new-lowest resets=0, movement after400ms remains active after100ms,
and100ms-partition natural contact locks1500ms. High still fails hidden lock.
Neither run has the immediate fifteenth-reset or PC omissions charged in
[Sol6.2 xhigh/max](gpt62-sol-xhigh-max-review.md). Their normal shapes,
SRS and scoring also avoid that review's major substitutions.

High's preview distortion is much smaller than the roughly10–20%/larger
hold/queue distortions in [Sol6.1 medium](gpt61-sol-review.md), but is the
same authored nonuniform-scaling class and receives the same single minor.
It is not merely the subpixel/border rounding excluded for the1.007 case in
[Terra6.1](gpt61-terra-review.md). No duplicate numerical deduction from UX,
code or tests is taken for any correctness finding. No deduction for the
three-piece medium preview, high-level gravity cap/floor, native OS repeat,
optional controls, or unresolved automatic-gravity spin history.

**Medium own tests4.5:** six passing Node tests cover three real seven-bags,
all28 state cardinalities, hold restriction/retrieval, integrated I single PC
with exact900+drop points,499/500 grounded lock, one real CCW I wall kick and
blocked I spawn. The purported rotation-cycle test calls `cells(k,r)` and
checks only four unique cells; it never performs rotation or asserts a cycle.
No deterministic RNG, canonical matrices, complete kicks, obstructed ghost,
normal2–4 clears, spins/mini/B2B/combo, level/gravity, reset cap/ledge/contact,
hidden lock, terminal guards, restart or browser tests. Broader than low4.0's
single bag and potentially O-only rotation case; comparable with earlier
Sol6.2 low4.5's basic smoke coverage. Audit probes earn no credit.

**High own tests7.0:** eleven passing deterministic tests cover six real bags
and queue refills, identity-shuffle helper, all pieces' real four-rotation
cycles/cardinalities, actual I/T CCW wall outcomes, complete hold roundtrip
with queue/orientation,999/1000 gravity, exact soft/hard points/weld cells,
499/500 and movement reset, eventual bounded floor movement, Tetris→Tetris
combo/B2B→double level crossing with exact2450 and793ms, PC Tetris2800,
real-rotation full/mini zero-line scores, and blocked spawn/terminal guards.
This adds meaningful PC/mini coverage over Sol6.2 medium/xhigh6.5. It still
omits authoritative matrices/complete kicks, floor kicks, exact reset15/16,
failed reset/ledge/contact, PC1–3/B2B-PC, all ordinary scores, spin clears/
fifth kick/travel credit, B2B across no-clear, hidden/partial outcomes,
restart and browser input. Quantity alone does not earn credit.

**Code medium8.0/high9.0; simplicity medium9.5/high9.0:** both are strict,
dependency-free TypeScript with DOM-free engines, shared geometry helpers,
bounded arrays and small allowlisted Node servers. Medium's171 TS lines in
two files remain heavily compressed, mixing several writes/branches per
line with public fields and numeric spin/kick bookkeeping. This matches
low's8.0 code/9.5 simplicity. High's833 TS lines in geometry/engine/display/
controller are readable and proportionate; most expansion is explicit SRS
coordinates, icons and rendering. It injects RNG, types pieces/actions, uses
small event-based timing helpers and revision-based rendering. No extra
framework or parallel state abstraction. Comparable with Sol6.2 xhigh's
9.0/9.0. The findings are not charged again here.

**UX medium8.5/high9.0:** both show seven colors, clear grid/ghost, hold/next,
score/lines/level, keyboard legend, pause and R restart. Medium has three-next,
mobile move/CW/hold/drop buttons and visibility pause; it relies on OS repeat,
has fixed-resolution backing and omits mobile soft/CCW. High adds five-next,
used-hold dimming, best-score persistence, progress, labeled panels/status,
ready/pause/game-over, sound, explicit move/down repeat, full phone buttons,
visibility pause and DPR-backed surfaces. Focused header-button Space still
hard-drops. Screenshots at1280×800 and390×844 were inspected: all play and
support fit in width, no false overlay. Medium board305.797×611.594 at
(487.094,199.078), document height875; phone187.875×375.75 at(106.016,171.125),
height844. High board281×562 at(499.5,186), document height809;
phone243.797×487.594 at(19,116), height844. Desktop vertical scrolling is
small and content remains reachable. The preview finding is charged only in
correctness. Physical touch and long-duration play are not certified.

## Evidence, coverage and reproduction

The [runner](run-gpt62-astra-medium-high-audit.py),
[engine probes](gpt62-astra-medium-high-audit.mjs),
[browser probes](gpt62-astra-medium-high-browser.cjs) and
[evidence](gpt62-astra-medium-high-evidence.json) preserve the review.
Read both implementations' source, tests, page/style, server, manifests/config
and README; hashed all12 medium/14 high delivered files including reports.
No delivered source, test, report or configuration was edited.

Fresh random temporary copies ran `npm ci --ignore-scripts --offline`, an
explicit `npm run build` and unchanged `npm test` (**6/6**, **11/11**).
For each implementation, Node and both actual served-module Chromium views
produce identical engine results:

- All28 canonical states,48 complete ordered non-O kick lists,576 real
  collision-checked rotations around walls/floor/ceiling/obstacles, with zero
  mismatch;100 actual seven-piece bags; restricted hold/retrieval/reset;
  seven independently computed obstructed ghosts with exact drop points/welds.
- Normal clears100/300/500/800, PC900/1500/2300/2800, combo100+150,
  Tetris/no-clear/Tetris800+0+1200, ordinary break800+150+900,
  Tetris/no-clear/PC Tetris800+0+4400, level-two second single300, pre-clear
  level PC crossing900 while entering level2, nonadjacent compaction.
- Real-rotation full/mini zero/single hard and timed locks400/800 and100/200;
  all facings full400/mini100, double1200, fourth-kick mini100, fifth-kick
  full400; no-rotation0, failed-action full400. Exact HD-SPIN-1 fourteen-row
  travel28 and zero-travel mini100/full400 pass actual Up/Space at both
  sizes; fourteen manual soft rows cancel old credit and give14 points.
- 499/500ms lock/reset, reset15 complete grant,16th/failed-wall nonreset,
  ledges/lower-row clocks, contact10/100ms and60/144Hz partitions, first-fall
  curve levels1–20, ten-line crossing, hidden/partial controls including
  pose-free T path, blocked spawn/terminal freeze, natural top-out/restart.
  High's event clock's1516.67ms observation at60Hz reflects its sampled
  floating boundary, not an observed material early lock. High-level capped/
  floored gravity values are recorded separately from the reference curve.
- Real Left/Right/Up/X/Z/LeftCtrl/Down/Space/C/R, pause/resume, focused-button
  Space, phone buttons, status/ghost pixels/panels, natural game over and R.
  Uninstrumented startup checked before accessor instrumentation. No page
  error or failed required asset in either view. Missing medium favicon is
  harmless. Installed Playwright/Chromium only; no browser download.

The facade maps names and O origins and delegates actions to the actual
engine. The48 candidate-list diagnostic replaces collision only in isolated
sacrificial objects;576 real outcomes retain delivered collision. Browser
instrumentation appends accessors and forced repaint to the module response,
with deterministic RNG/RAF. No application rule body is replaced. Mini-double,
full-triple and every possible B2B/spin interaction are source-inspected
rather than separately forced. No exhaustive state-space, other-browser,
HiDPI-device, OS key-repeat, simultaneous-key/focus, performance or physical
mobile certification is claimed. Generation/isolation/accounting were not
re-audited from transcripts.

```sh
python3 .audit/run-gpt62-astra-medium-high-audit.py --offline
# Pause to inspect PNGs; Enter deletes each disposable copy and its pictures:
python3 .audit/run-gpt62-astra-medium-high-audit.py --offline --review
# Targeted/intentional evidence refresh:
python3 .audit/run-gpt62-astra-medium-high-audit.py --offline --effort high --engine-only
python3 .audit/run-gpt62-astra-medium-high-audit.py --offline --record
```

Default mode compares outcomes to the pinned evidence, including known
failures. All26 delivery hashes must stay unchanged. Only each temporary
server's8321 port literal is changed to a free41000–49999 port and restored
before copied hashes are checked. All temporary copies, logs, screenshots,
servers/process groups and owned Chromium instances are removed on success
or handled error. The sandbox required authorization for local binding;
an initial copied-server port replacement failed to match a callback form,
was corrected and cleaned up. These were harness problems, not game defects.
Shared preview reported unavailable; its blank-tab attempt failed before
creating a tab. Installed Chromium supplied the requested screenshots.

## Validation and lifecycle

Full recorded audits and screenshot inspection pass; the finalized runner's
pinned rerun and repository render/verify results are recorded in evidence.
All97 prior ranking entries and protected registry/pricing/statistics files
are preserved. The main README and RANKING tables are regenerated from the
new rankings; RANKING's detailed headings are kept consistent.
No commit, push, PR, generation/rerun or project archival was performed.
The parent remains responsible for linking the review, confirming this
completed independent turn and any later isolated-project archival.
