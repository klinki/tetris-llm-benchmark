# GPT-6 Astra low independent audit

**2026-11-19, Europe/Prague. Reviewer: GPT-6.1 Sol, xhigh, Codex / T3 Code.**
Run: `gpt-6-astra-low`. Actual identity read from this reviewer's own native
Codex `turn_context`: **model=gpt-6.1-sol, effort=xhigh**, native session
**01a1f267-34fa-7ac3-b049-a38ce2cc2621**. The native rollout path and turn ID
are in [evidence](gpt6-astra-low-evidence.json), together with the
[review thread](t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3Af5cbf383-63f4-4751-8a6e-737cd109491b%3Adelegate-task%3A6b4d8afc-2aa0-4473-8c03-176df3779831).
The own-thread T3 record independently confirms Codex / gpt-6.1-sol.
I performed this audit myself without delegation. No tested-model or other
run transcript, other native session, or `~/.t3` file was read. Generation
effort, elapsed time, usage, cost and quota do not affect these scores.

Orchestrator check: Claude Opus 5.5 read the same model/effort from the native rollout. Codex quota used by this review (Plus plan): 5-hour window 4→14% (10 points), weekly 74→76% (2 points).

## Scores

| Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 7.5 | 4.5 | 7.0 | 8.5 | 8.5 | **7.00** | 5 minor |

Correctness `10−5×0.5=7.5`. Weighted
`7.5×.40 + 4.5×.20 + 7×.20 + 8.5×.10 + 8.5×.10 = 7.00`.
Half-point categories and existing 40/20/20/10/10 weights apply. The game
builds, passes all seven unchanged own tests and plays in both Chromium
sizes. No critical or major finding applies.

## Findings

Coordinates below use the visible field, x=0..9, y=0..19. The engine's
native y is visible y+2. Coordinates refer to canonical SRS origins;
O's occupied cells start one column right of its origin. For example O
r0 at (−1,12) occupies x0/1, y12/13. Only legal pose/stack/clock fixture
state is assigned. Every scored rotation/move/lock uses delivered methods;
rotation eligibility is never injected.

1. **Minor — Perfect-clear bonuses are missing.** Fresh level-one game:
   set I r0(3,18), O r0(3,18), T r1(3,17), or I r1(3,16), fill the bottom
   1/2/3/4 rows' complement of that piece, then hard drop zero rows.
   All four boards empty, scoring **100/300/500/800** instead of additive-PC
   totals **900/1500/2300/2800**. A PC single at nine lines scores100 rather
   than900, while correctly advancing to level2. Non-PC Tetris, no-clear
   placement, PC Tetris totals **2000 instead of5200**. `place()` has
   ordinary/spin/B2B/combo awards but no empty-board detection or PC bonus
   ([engine](../gpt-6-astra-low/src/game.ts), lines26–28). These are one
   omitted feature, not separate findings.

2. **Minor — A travelling hard drop retains stale T-spin credit.** Exact
   SPEC HD-SPIN-1 fixture: stack (0,17),(0,19),(2,19), T r0(0,3), real CW to
   r1(0,3). Independent ghost is r1(0,17), fourteen rows below. Hard drop
   scores **128 instead of28**: fourteen×two plus an unwarranted100 mini.
   Actual Up then Space reproduces128 on desktop and390×844. Expected a
   successful hard-drop translation to cancel earlier rotation credit.
   `hardDrop()` directly changes `active` without clearing `rotated`
   ([engine](../gpt-6-astra-low/src/game.ts), line24). Zero-travel controls
   correctly award mini100/full400; timed locks agree, and real mini/full
   singles give200/800. Four facings and fourth/fifth kick classification
   work. Successful manual-soft travel cancels credit (14 rows→14 points);
   failed soft/lateral attempts preserve it (full zero→400). No automatic
   gravity interpretation is charged.

3. **Minor — Starting soft drop converts accumulated ordinary gravity time.**
   Fresh O r0(3,0), clocks0, level1. Advance800ms in ordinary10ms ticks:
   no descent. Then `tick(1,true)` moves the O **sixteen rows to(3,16)**,
   awarding **16 points**, instead of waiting for the new50ms soft cadence
   (zero rows/points after only1ms). Actual ArrowDown held for a1ms frame
   after the same800ms reproduces it in both browsers. `tick()` reuses
   `fall=800` against the smaller50ms interval
   ([engine](../gpt-6-astra-low/src/game.ts), line25). A fresh50ms soft
   interval correctly moves one row for one point; this finding concerns
   the transition and retroactive scoring. Hold correctly resets clocks.

4. **Minor — Lower-row reset state and landing-time accounting are wrong.**
   These two related lock-policy variants share one deduction.

   - **Spent allowance:** fresh O r0(−1,12), supports(0,14),(1,14). Make
     fourteen successful alternating Right/Left actions starting Right,
     then Right twice. The last grounded move uses reset15; descend to
     the lower floor. `resets` is still15. Wait400ms, move Right, wait100ms:
     actual **six stored cells and the next piece**, expected only the two
     supports with the O still active after a fresh500ms reset. Node and
     actual keys in both views agree. A genuinely lower row must renew
     the manipulation budget.
   - **Contact timing:** fresh O r0(3,17), clocks0. Fourteen `tick(100)`
     calls lock it at**1400ms**, expected**1500ms** (1000ms fall +500ms
     grounded). Ten-ms partitions lock1490ms; the real controller's50ms
     capped callbacks lock1450ms. `tick()` charges the entire landing
     frame as grounded time, including the portion before contact.

   `move(0,1)` never renews the lower-row allowance; `resetLock()` only
   renews a grounded manipulation below15. `tick()` adds full `ms` when
   grounded at its end ([engine](../gpt-6-astra-low/src/game.ts), lines19–20,25).
   Controls pass: stationary499/500ms, ordinary move reset, failed-wall
   nonreset, full500ms grant on reset15, and sixteen-action cap. The old
  490ms clock **is cleared in air**: exhausted/unspent ledge controls both
   land5510ms after departure and lock6009ms (the1ms contact-frame error).
   No retained airborne clock or immediate fifteenth-reset lock is claimed.

5. **Minor — A wholly hidden lock does not top out.** Fresh legal grounded
   O r0(−1,−2), support(0,0), next queue entry I. Zero-distance hard drop
   writes all four O minos in the two hidden rows, then spawns I with
   **over=false and five stored cells**. Expected game over because the
   entire locked piece is above the visible field. Real Space reproduces
   it at both sizes. Partial-hidden control O r0(−1,−1), support(0,1),
   correctly continues with all cells preserved. `place()` always calls
   `spawn()` without wholly hidden lock-out; `spawn()` only detects an
   incoming collision ([engine](../gpt-6-astra-low/src/game.ts), lines16,26–28).
   Ordinary blocked spawn, terminal action guards, natural stack top-out
   and actual R restart work.

## Calibration and category rationale

Missing PC is the same minor as [Sol6.2 xhigh](gpt62-sol-xhigh-max-review.md).
The separate stale-hard-drop minor follows [SPEC HD-SPIN-1](SPEC.md#hd-spin-1-t-spin-credit-after-a-hard-drop);
this engine otherwise recognizes mini/full spins, so there is no broad
missing-scoring major. Soft-entry time conversion matches
[Sol6.1 low](gpt61-sol-review.md) and [Luna max](gpt6-luna-review.md).
The reset/contact symptoms share one minor as in
[Astra6.2 low](gpt62-astra-low-review.md), although this engine correctly
clears the old clock in air. Wholly hidden lock-out is the same separate
minor as Astra6.2 low/medium/high. Equivalent defects have equivalent
severity. The high-level10ms gravity floor, spawn height, optional touch
controls and unresolved automatic-gravity spin history receive no deduction.

**Own tests4.5:** seven real Node tests all pass unchanged: opening bag's
seven unique kinds; first/restricted/post-lock hold availability; four-cell
hard-drop weld and positive points; rejected left-wall movement and one
random shape's four-cell/legal rotation; an integrated O single for100;
blocked T spawn; grounded499/500ms boundary. This has useful basic engine
integration and timing, matching the narrow Astra6.2 medium4.5 tier.
It never retrieves the held piece, independently computes ghost/drop
coordinates or exact drop points, seeds RNG, checks canonical states/kick
selection, multirow/advanced scoring, precise gravity/levels, reset cap/
ledge/contact, hidden lock-out, restart or actual browser/input. Random
bag/shape choice makes the rotation check particularly weak. Audit probes
earn no own-test credit.

**Code7.0 / simplicity8.5:** strict TypeScript, zero runtime dependencies,
DOM-free game and one browser module, shared geometry, injected RNG,
bounded arrays and direct event/render functions. Only44 physical TS lines
contain nearly all behavior, with multiple state writes, conditions and
nested loops squeezed onto very long lines. The scoring pipeline, tick and
controller require expansion to review; this is code golf rather than
readable brevity. The two-module architecture is proportionate and easy to
navigate, but compression reduces the simplicity credit. These scores match
the compressed Sol6.1 low and Luna6 low examples (7.0/8.5), rather than
Astra6.2 low's more legible99-line8.0/9.5. Confirmed defects are not deducted
again from code/test categories.

**Browser UX8.5:** distinct pastel colors, grid and outlined ghost,
hold/five-next, readable DOM score/level/lines, board accessible label,
start/pause/resume/end overlays and R restart message, keyboard legend,
custom side repeat and automatic blur pause. Required keyboard aliases,
real Space/C/R, pause freeze/resume and blur all work. All four screenshots
(two unmodified baseline, two deterministic held-O/gameplay) were visually
inspected. Phone390×844 has no horizontal overflow:220×440 board at(85,240),
full footer and both panels fit. Held O and next previews remain square.
Desktop document1280×928 has300×600 board at(490,258); scrolling reveals
its lower58px and legend, without layout clipping. Phone preview shapes
are small but recognizable. Optional touch UI, high-DPI backing, live
announcements and complete printed aliases are absent. This is a stronger
keyboard interaction package than Astra6.2 low8.0; no separate correctness
penalty is taken for those optional omissions or normal vertical scrolling.

## Method, coverage and reproduction

Read every delivered file: game/controller, seven tests, HTML/CSS, server,
manifest/lockfile/config/ignore, README and statistics (**12 files**).
No transcript was used to infer quality. Read task/rubric/SPEC and recent
Astra6.2 low/medium/high/xhigh/max and Sol6.2 xhigh/max reviews, plus the
Sol6.1/Luna calibration. All delivery SHA-256 hashes are in the evidence
and asserted unchanged before/after every disposable workflow.

Random fresh temporary copies run locked cached `npm ci --ignore-scripts
--offline`, explicit `npm run build`, unchanged `npm test` (**7/7**), then
Node and matching served-module engine probes in desktop1280×800 and
phone390×844 Chromium. Installed Playwright1.64.0 / Chromium156.0.8078.4;
no browser/dependency download. Baseline startup/hard drop also runs with
unmodified entry and natural RAF before accessor instrumentation. Shared
preview independently loaded the unchanged game title; its owned tab closed.

Coverage:28 canonical states,48 ordered I/JLSTZ kick lists,576 actual
wall/floor/stack rotations,100 seeded bags, hold restriction/retrieval and
replacement clocks, seven obstructed ghosts/drop/weld/points, compaction,
499/500/reset15/16/failed wall, exhausted/unspent ledges and lower-floor
budget, natural-contact partitions, levels1–20/ten-line progression,
normal clears1–4, PC1–4/B2B-PC, combo at levels1/2, B2B across a no-clear
and break, pre-clear-level scoring, mini/full zero/single hard/timed locks,
four facings, fourth/fifth kick distinction, full double, no rotation/two
corners, failed-action/soft/hard-travel spin history, hidden/partial locks,
blocked spawn/terminal guards, natural top-out and reset. Real required keys,
soft-entry burst, pause/blur, refresh60/144Hz callbacks and R are asserted
in both browser sizes. Engine results are identical in Node and Chromium.

The candidate-list diagnostic rejects `valid` only on sacrificial objects;
all576 real outcomes use unchanged collision. Browser instrumentation appends
getter/reset/render accessors and supplies seeded RNG/deterministic RAF,
without replacing any application rule body. Only the temporary server's
hard-coded8321 listen argument is changed to a free41000–49999 port, then
restored before copied hashes are checked. Owned servers/browser groups,
logs/PNGs and all copies are removed, including on handled failures.

Coverage limits: no exhaustive state-space proof, long-play performance,
physical touch/HiDPI, multikey/OS-repeat or cross-browser certification.
T-spin triple/mini-double and every scoring/B2B combination were not forced;
their tables/difficult-clear logic were inspected. Automatic-gravity spin
history remains unscored. Generation completion and accounting remain
separate; this review does not certify usage/isolation from transcripts.

```sh
python3 .audit/run-gpt6-astra-low-audit.py --offline
# Inspect screenshots before Enter deletes the copy:
python3 .audit/run-gpt6-astra-low-audit.py --offline --review
# Intentional evidence refresh / engine only:
python3 .audit/run-gpt6-astra-low-audit.py --offline --record
python3 .audit/run-gpt6-astra-low-audit.py --offline --engine-only
```

[Runner](run-gpt6-astra-low-audit.py), [engine](gpt6-astra-low-audit.mjs),
[browser](gpt6-astra-low-browser.cjs), [evidence](gpt6-astra-low-evidence.json).
Default mode compares against pinned outcomes, including defects; a passing
runner establishes reproducibility, not universal conformance.

## Verification and preservation

The full recorded workflow passed and four PNGs were inspected before
cleanup. A final numeric-recording run includes hold-clock/two-corner
controls. A separate default fresh-copy run verifies reproducibility.
Repository render/verify and ranking/link checks are recorded below after
completion. All101 prior ranking entries and104 protected registry/pricing/
statistics files retain their initial hashes/parsed values; all12 delivered
files are unchanged. No generation/rerun, commit/push/PR, accounting change
or project archival is part of this review. Parent confirmation of the
completed review and later isolated-project lifecycle steps remain separate.

Harness corrections, not implementation findings: the inherited runner
expected five rather than seven own tests; this was corrected after reading
the actual suite. Local binding initially required sandbox escalation; the
approved runner uses disposable free ports. The server ignores PORT, so the
temporary listen literal is adapted/restored rather than relying on env.
All failed attempts also cleaned their copies and owned processes.


- `python3 .audit/run-gpt6-astra-low-audit.py --offline --record --review --preview`: pass;7/7 own tests, Node/both views, four PNGs inspected, shared tab closed and cleanup confirmed.
- `python3 .audit/run-gpt6-astra-low-audit.py --offline --record`: pass with final hold-clock/two-corner controls;7/7, Node and both views,12 hashes unchanged, cleanup confirmed.
- `python3 .audit/run-gpt6-astra-low-audit.py --offline`: pass in a separate fresh copy; all pinned engine/browser outcomes reproduce,7/7 own, hashes and cleanup confirmed.
- `python3 scripts/benchmark.py render`: exit0.
- `python3 scripts/benchmark.py verify`: exit0.
- `node .audit/verify-ranking.mjs`: exit0;613 local links,102 scored rows, deductions/arithmetic/ordering and tables pass.
- Both JavaScript probes pass `node --check`; Python runner passes `ast.parse`; `git diff --check` passes.
- Preservation check:101 earlier parsed ranking entries,104 protected file hashes and12 delivered hashes match; no disposable directory remains.

Reporting-only corrections: new ranking headings were renumbered and the
introduction count advanced to102; existing reference-assisted headings have
suffixes that the ordinal updater must preserve. Final render/verify pass.
