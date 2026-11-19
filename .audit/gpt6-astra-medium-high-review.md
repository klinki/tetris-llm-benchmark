# GPT-6 Astra medium / high independent audit

**2026-11-19, Europe/Prague. Reviewer: GPT-6.1 Sol xhigh, Codex / T3 Code.**
Reviewed `gpt-6-astra-medium` then `gpt-6-astra-high` against `TETRIS.md`.
Actual identity read from this reviewer's **own native Codex `turn_context`**:
**model=gpt-6.1-sol, effort=xhigh**, native session
**01a1f29f-d9bf-73f0-8a1b-f8a05bf7d49f**. Exact native rollout path and
turn ID are in the [evidence](gpt6-astra-medium-high-evidence.json).
The [own review thread](t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3Af5cbf383-63f4-4751-8a6e-737cd109491b%3Adelegate-task%3Aeb73b709-2c62-4249-9399-386a2a370107)
record independently confirms Codex / gpt-6.1-sol and a subagent relationship.
I performed the audit myself, without delegation. No tested-model transcript,
other-run transcript, other native session, or `~/.t3` file was read.
Generation effort, time, usage, cost and quota have no quality-score effect.

Orchestrator check: Claude Opus 5.5 read the same model/effort from the native rollout. Codex quota used by this review of both runs (Plus plan): 5-hour window 53→66% (13 points), weekly 82→84% (2 points).

## Scores

| Run | Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| medium | 7.0 | 5.5 | 7.0 | 8.5 | 8.5 | **7.00** | 6 minor |
| high | 9.0 | 8.5 | 9.0 | 9.0 | 9.0 | **8.90** | 2 minor |

Correctness: medium `10−6×.5=7`; high `10−2×.5=9`. Half-point categories,
40/20/20/10/10 weights. Medium weighted
`7×.4+5.5×.2+7×.2+8.5×.1+8.5×.1=7.00`; high
`9×.4+8.5×.2+9×.2+9×.1+9×.1=8.90`.
Both build, pass their unchanged suites (**9/9** and **22/22**), and play
in both Chromium sizes. No major or critical finding applies. Passing audit
assertions reproduce known defects as well as conforming paths.

## Medium findings

All coordinates use visible x=0..9/y=0..19 and canonical SRS origins;
native y is visible y+20. O's occupied columns are origin x+1/x+2.
Only board/pose/clocks are fixture state; credited rotations and every
scored move/drop/lock use delivered methods. Rotation credit is never
injected. Unless noted, fixtures start at level one with zero clocks/score.

1. **Minor — Back-to-back Tetris perfect clear uses the ordinary bonus.**
   Make a non-PC Tetris, a no-clear O lock, then a zero-travel Tetris PC.
   Each Tetris uses I r1(3,16), bottom-four-row complement; the non-PC
   control retains a marker at(0,0). Between placements replace only the
   fixture board/pose, retaining score/B2B/combo. Actual total **4000**,
   expected **5200**. Last award is **3200=1200+2000**, expected
   **4400=1200+3200**. Ordinary PC1/2/3/4 correctly gives
   900/1500/2300/2800, and PC single at nine lines correctly gives900
   before advancing to level2. The PC table in
   [game.ts](../gpt-6-astra-medium/src/game.ts), line31, has no chained
   Tetris variant. One narrow scoring minor, not missing-PC or missing
   advanced-scoring deductions.

2. **Minor — A travelling hard drop retains stale T-spin credit.** Exact
   [HD-SPIN-1](SPEC.md#hd-spin-1-t-spin-credit-after-a-hard-drop): stack
   (0,17),(0,19),(2,19), T r0(0,3), real CW to r1(0,3). Independently
   calculated ghost is r1(0,17), fourteen rows below. Hard drop scores
   **128**, expected **28** (14×2; no mini bonus after translation).
   Actual Up/Space reproduces128 at both sizes. Zero-travel mini/full
   controls correctly give100/400, and timed locks agree. Mini/full
   singles give200/800; four facings, fourth/fifth kicks, full double,
   failed-action credit and manual-soft cancellation pass.
   `hardDrop()` changes the active pose without clearing `lastRotation`
   ([game.ts](../gpt-6-astra-medium/src/game.ts), line26).

3. **Minor — Starting soft drop converts accumulated normal-gravity time.**
   Fresh O r0(3,0), advance800ms in ordinary10ms ticks: no descent. Then
   `tick(1,true)` moves **16 rows and awards16 points**, expected zero
   after only1ms of the new50ms interval. Through the controller, actual
   Down first moves/scores one row, then a1ms frame produces **17 rows /
   17 points total**, expected **one row / one point**. Both views agree.
   The blocked-Down ledge variant described under high also gives an
   immediate six-row burst. `tick()` reuses `gravityTime` against the
   faster interval ([game.ts](../gpt-6-astra-medium/src/game.ts), line33).
   Normal fresh soft cadence and exact one/two drop points pass.

4. **Minor — Lower-row reset allowance and contact timing are wrong.**
   Related lock-policy symptoms share one deduction.

   - O r0(−1,12), supports(0,14),(1,14). Fourteen alternating successful
     Right/Left moves, starting Right, then Right twice: the final grounded
     action spends reset15. Descend to the floor: resets remains15.
     Wait400ms, move Right, wait100ms: actual **six stored cells and a
     replacement piece**, expected only the two supports and a renewed
     500ms movement reset. Real keyboard actions agree at both sizes.
   - O r0(3,17), clocks0: fourteen `tick(100)` calls lock it at**1400ms**,
     expected**1500ms** (1000ms descent +500ms grounded). Ten-ms partitions
     lock1490ms; real controller100ms callbacks lock1400ms. The landing
     frame's entire duration is counted as grounded time.

   `move()` does not renew the lower-row budget; `tick()` adds full `ms`
   when grounded at its end ([game.ts](../gpt-6-astra-medium/src/game.ts),
   lines22,33). Stationary499/500, ordinary reset, failed-wall nonreset,
   full500ms on reset15, and the sixteen-action cap pass. The old490ms
   clock **is cleared in air**: exhausted/unspent ledges land5510ms and
   lock6009ms after departure (the1ms contact error). No retained-clock
   or immediate-fifteenth-reset finding applies to medium.

5. **Minor — A wholly hidden lock does not top out.** Grounded legal
   O r0(−1,−2), support(0,0), next queue entry I. Zero-travel hard drop
   writes all four O cells above the visible field, then spawns I with
   **over=false / five stored cells**, expected game over. Incoming I's
   spawn is independently clear. Actual Space agrees in both views.
   Partial-hidden O r0(−1,−1), support(0,1), correctly continues and
   preserves every cell. `lock()` always spawns; `spawn()` checks only
   incoming collision ([game.ts](../gpt-6-astra-medium/src/game.ts),
   lines19,32). Blocked spawn, terminal guards, natural top-out and R work.

6. **Minor — The phone stylesheet hides the entire next queue.** At
   **390×844**, document width390, board247×494 at(130,225.094), hold
   remains visible. But `.right {display:none}` under720px removes the
   queue and gives `#next` **0×0** bounds. There is no alternate preview.
   Expected at least one visible next piece on the phone; all five work
   on desktop. Confirmed in baseline and deterministic screenshots and
   DOM geometry ([style.css](../gpt-6-astra-medium/style.css), line1).
   Normal vertical page scrolling is not charged.

## High findings

Same visible coordinates/native y+20. These findings do not charge the
normal keyboard path for a defect it avoids.

1. **Minor — A spent lock clock and reset allowance survive lower descent.**
   One related lock-policy group, calibrated to Astra6.2 low/medium.

   - O r0(−1,12), supports(0,14),(1,14). Fifteen successful alternating
     Right/Left actions, starting Right, leave resets15 and x0. Wait490ms;
     Right twice leaves the ledge with lockTime490. With1ms updates,
     land5510ms after departure, lock5520ms: **10ms after landing**,
     expected a fresh500ms through6010ms. The unspent control correctly
     lands5510/locks6010ms. Actual keys and frames reproduce the early
     lock in both viewports.
   - Fourteen alternating moves, then Right twice without that490ms wait:
     descend to the floor with lockResets15, wait400ms, Right, wait100ms.
     Actual **six stored cells/replacement**, expected two supports and
     a fresh movement reset at the new low row. Both views agree.

   `fall()` leaves `lockTime`/`lockResets` unchanged, and `update()` pauses
   the clock while airborne without clearing it; `resetLock()` cannot
   reset after15 ([game.ts](../gpt-6-astra-high/src/game.ts), lines142–155,
   171–182). Natural contact at10/100ms partitions correctly locks1500ms;
   stationary499/500, failed wall and full reset15 controls pass. No
   airborne lock or immediate-fifteenth-reset defect is claimed.

2. **Minor — Blocked soft-drop entry can spend old normal-gravity time.**
   Fresh grounded O r0(−1,12), supports(0,14),(1,14). Advance400ms; real
   Right to x0 resets lock; advance another400ms. This reaches
   `gravityTime=800`, `lockTime=400` through ordinary actions. Hold Down:
   its immediate `softDrop()` fails against the supports and leaves the
   gravity accumulator unchanged. Before another frame, press Right
   twice to x2, leaving the ledge. Advance a **1ms** frame with Down held:
   actual O r0(2,18), **six descent rows and six points**; expected
   r0(2,12), **zero points**, until the new soft interval elapses.
   Actual keyboard events reproduce it in desktop and phone Chromium.
   `softDrop()` resets `gravityTime` only after a successful fall;
   `update()` then spends old time at20× gravity
   ([game.ts](../gpt-6-astra-high/src/game.ts), lines111–116,147–152).

   Control: unblocked O r0(3,0), ordinary800ms, Down and1ms frame correctly
   moves **one row for one point** because the immediate soft row clears
   gravityTime. The public engine-only transition `update(1,true)`
   without that keydown row instead moves16 rows/scores16; it is retained
   as diagnostic evidence, not an additional deduction or a claim about
   the normal unblocked controller path. Hold resets all clocks.

## Calibration and category rationale

[Astra6 low](gpt6-astra-low-review.md), **7.00**, has five minors. Medium
fixes its missing ordinary PCs but leaves the narrower B2B-PC bonus gap;
keeps its hard-drop, soft-transition, lower-row/contact and hidden-lock
findings; adds the independently confirmed phone queue omission. The PC
variant is the same minor as [Sol6.1 low](gpt61-sol-review.md),
[Sol5.6 xhigh](gpt56-sol-review.md),
[DeepSeek V4.1 max](deepseek-v41-review.md) and
[Luna6 xhigh](gpt6-luna-review.md). Hidden phone next is the same minor as
Luna6 low; it is not the major for a preview absent at every size.
HD-SPIN-1 follows the explicit amended policy. Soft-time conversion matches
Sol6.1 low and Astra6 low even though high needs the blocked-entry path.

High correctly implements ordinary and B2B PCs, travel/zero-travel
HD-SPIN-1, hidden lock-out and square previews. It avoids the corresponding
Astra6 low and [Astra6.2 medium/high](gpt62-astra-medium-high-review.md)
findings, but keeps the same grouped spent-clock/budget minor as
[Astra6.2 low](gpt62-astra-low-review.md). Medium's contact/budget group
also follows that precedent; these are not stacked per symptom. Neither
has the immediate fifteenth-reset defect of
[Astra6.2 xhigh/max](gpt62-astra-xhigh-max-review.md). Neither has the
major shape/scoring substitutions of [Sol6.2 max](gpt62-sol-xhigh-max-review.md).
No extra deduction for optional controls, queue count, spawn height,
high-level gravity floor/cap, frame-boundary rounding or unresolved
automatic-gravity spin history. No finding is numerically deducted twice.

**Medium own tests5.5:** nine real passing Node tests cover one seven-bag,
complete restricted hold/retrieval, legal/blocking ghost and four-cell hard
weld, actual I CCW wall kick, integrated PC Tetris2800, grounded499/500,
blocked O spawn, paused controls, and real four-turn cycles for all seven
pieces. This extends Astra6 low4.5 with retrieval, actual I kick, ghost,
PC4, pause and all-piece cycles. No seeded RNG, authoritative matrices/
complete ordered kicks, exact drop distance, ordinary1–3 clears, spin/
mini/B2B/combo/B2B-PC, gravity curve/levels, precise reset cap/ledge/contact,
hidden lock, restart or browser tests. Audit probes earn no credit.

**High own tests8.5:**22 passing cases add100 bags; both rotation directions
for all shapes; wall/occupied failures; exact T/I wall and T floor kicks;
trapped rotation preservation; hold orientation/queue/retrieval; exact
one/two drop points;499/500 and a real fifteen-reset sequence with a
sixteenth-action control;999/1000 gravity and soft speed; integrated
normal1–4 scores, combo/B2B/chain break/no-clear retention, pre-clear level;
PC Tetris; real full/mini zero spins and full single; blocked next/held
spawn; wholly hidden lock-out; pause and complete restart; and5000 seeded
mixed actions preserving board/queue/legal-active invariants. This breadth
matches the8.5 tier of Astra6.2 max, exceeding Astra6.2 high7.0/xhigh7.5's
narrower suites. Missing an authoritative SRS matrix/full kick oracle,
exact gravity curve, contact/ledge/new-lowest/reset-clock paths, PC1–3/
B2B-PC, four spin facings/fifth kick/travel history, partial-hidden
control and browser input. More cases alone do not raise the score.

**Code medium7.0/high9.0; simplicity medium8.5/high9.0:** both use strict,
DOM-free TypeScript engines, RNG injection, shared geometry, bounded
storage, no runtime dependencies and tiny built-in-Node servers. Medium's
50 physical source lines compress scoring, tick, rendering and controller
into extremely long compound statements. This is the same code-golf cost
as Astra6 low7.0/8.5 and Sol6.1 low, despite its proportionate two-module
structure. High's582 source lines in four modules separate geometry,
engine, renderer and controls clearly; types, helper names and branches
make the rule pipeline reviewable. With286 test lines and27 server lines,
it remains proportionate, matching Astra6.2 high/max9.0/9.0. Public fixture
state and normal frame rendering do not warrant a separate penalty.

High's `output/playwright/` contains its own three PNGs and a machine-specific
CLI config; three `.playwright-cli/` YAML snapshots also remain locally.
These are ignored development artifacts, excluded by its `.gitignore`,
absent from compile/runtime imports, and not part of the game or own suite.
They add minor checkout clutter, with no material code-quality/simplicity
deduction. Their hashes are preserved; their images are not used as audit
evidence or given own-test credit.

**Browser UX medium8.5/high9.0:** both have distinct colors, legible
HUD/hold/ghost, keyboard aliases, best persistence, pause/resume, blur pause,
R restart, side-repeat and usable narrow boards. Medium prints controls
and offers mobile move/CW/hold/drop; high adds ready/end overlays, explicit
used-hold dimming, DPR-backed square previews, live clear feedback,
progress/time and full phone move/down/CW/CCW/hold/drop controls with pointer
capture and visibility pause. Clicked header Pause releases Space for a
hard drop in both. No app errors or failed game assets in either size.
Eight PNGs were visually inspected (unmodified baseline and deterministic
held-O/active/ghost at both sizes for each run). Medium phone document977px,
board247×494, proportional hold; desktop1039px with300×600 board. High phone
952px with257×514 board and all five small but recognizable previews;
desktop871px with273×546 board. All four fit their viewport width; vertical
scrolling reaches footer/help/buttons. The medium hidden queue is charged
once in correctness; UX reflects the broader interaction package.

## Method, coverage and limits

Read every executable/game/own-test/config/style/HTML/server/document file;
lockfiles/manifests are TypeScript-only. High's ignored PNG/YAML diagnostics
are hashed but not interpreted as game code or tested-model transcripts.
Read task/rubric/SPEC, Astra6 low and Astra6.2 low/medium/high/xhigh/max,
Sol6.2 xhigh/max and the cited calibration records. No tested-agent or
other-run T3/native transcript was used.

Fresh random copies run cached locked `npm ci --ignore-scripts --offline`,
explicit build and unchanged `npm test`, then independent Node and matching
served-module probes in installed Playwright1.64.0 / Chromium156.0.8078.4
at1280×800 and390×844. No dependency/browser download. The browser first
checks startup/hard drop with the unmodified entry and natural RAF, then
appends state/reset/render accessors and supplies deterministic RAF/RNG;
no rule body is replaced in gameplay probes. The sacrificial kick-list
probe rejects collision tests only to inspect ordered candidate lists;
all576 real rotation outcomes use delivered collision.

For each run:28 canonical states,48 ordered kick lists,576 independent
wall/floor/stack rotations,100 seeded bags; hold restriction/retrieval and
clock reset; all seven obstructed ghosts/drop points/welds;499/500/reset15/
reset16/failed-wall, exhausted/unspent ledges, lower-row allowance and
natural contact partitions; gravity levels1–20/ten-line progression;
ordinary1–4, PC1–4, combo at levels1/2, B2B across no-clear and break,
B2B-PC, pre-clear level; real full/mini zero/single timed/hard spins,
four facings, fourth/fifth-kick distinction, full double, no-rotation/two
corners, failed actions and manual-soft/hard-travel history; hidden/partial
lock, blocked spawn/terminal guards, compaction and natural top-out/reset.
Real keyboard aliases, exact HD-SPIN-1, reset/ledge, hidden locks, soft
transitions, pause/blur,60/144Hz callbacks, clicked-header Space and R run
in both views. Node and browser engine results are asserted identical.

No exhaustive state-space or long-play proof, physical touch/HiDPI/OS-repeat,
cross-browser certification, or forced T-spin triple/mini-double/every
scoring-chain combination. These table paths were inspected only.
Automatic-gravity spin history remains outside the adopted scoring policy.
Generation completion, accounting and later project lifecycle are separate;
this review does not certify them from transcripts or archive anything.

The runner hashes all33 delivered files including ignored diagnostics,
asserts originals and copied delivery unchanged (generated dist excluded),
uses free41000–49999 ports and removes owned servers/browser groups, copies,
PNGs and logs even on handled failures. Medium's temporary8321 listen
literal is adapted/restored; high honors PORT unchanged. Local binding
required an approved sandbox escalation. Harness corrections fixed a
collision-accessor naming collision and waited for high's RAF-rendered
score after Space; neither was an implementation finding. Failed attempts
also cleaned all owned resources.

```sh
python3 .audit/run-gpt6-astra-medium-high-audit.py --effort medium --offline
python3 .audit/run-gpt6-astra-medium-high-audit.py --effort high --offline
# Pause for screenshot inspection before cleanup:
python3 .audit/run-gpt6-astra-medium-high-audit.py --effort high --offline --record --review
# Optional engine-only / intentional evidence refresh:
python3 .audit/run-gpt6-astra-medium-high-audit.py --effort medium --offline --engine-only
```

[Runner](run-gpt6-astra-medium-high-audit.py),
[engine](gpt6-astra-medium-high-audit.mjs),
[browser](gpt6-astra-medium-high-browser.cjs),
[evidence](gpt6-astra-medium-high-evidence.json).
Default mode compares pinned outcomes, including defects. `--record`
intentionally refreshes them. No implementation fix, model rerun, commit,
push, PR, registry/pricing/statistics edit or project archival was performed.

## Verification and preservation

- Locked fresh-copy builds and unchanged own suites: medium9/9, high22/22.
- Final Node and both Chromium engine results match; separate default fresh-copy
  runs reproduce both pinned evidence records. Eight PNGs inspected.
- `python3 scripts/benchmark.py render`: exit0.
- `python3 scripts/benchmark.py verify`: exit0.
- `node .audit/verify-ranking.mjs`: exit0;624 local links,104 score rows,
  half-point arithmetic/deductions/ordering and document tables pass.
- Both JavaScript probes pass `node --check`; Python runner passes `ast.parse`;
  `git diff --check` passes.
- All102 earlier parsed ranking entries,137 protected registry/pricing/statistics/
  delivery hashes, and all33 delivered files match the pre-edit snapshot.
  No audit temporary directory or owned server/browser remains.

Only ranking entries, their required ranking summaries/conformance table,
rank ordinals/count and generated README/ranking tables changed outside the
new audit artifacts and audit index. Registry, pricing, every statistics file
and both implementations retain their initial bytes. Projects were not archived;
parent completion verification and project lifecycle remain separate.
