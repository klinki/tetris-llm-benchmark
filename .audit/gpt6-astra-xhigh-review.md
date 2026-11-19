# GPT-6 Astra xhigh independent audit

**2026-11-19, Europe/Prague. Reviewer: GPT-6.1 Sol xhigh, Codex / T3 Code.**
Run: `gpt-6-astra-xhigh`. Actual identity read from this reviewer's own
native Codex **`turn_context`: model=gpt-6.1-sol, effort=xhigh**; native
session **01a1f37e-ba41-7451-bb2b-2bbe885f9431**, turn
`01a1f37e-bbf9-7e31-b1e9-42ec513fb111`. Exact rollout path is in the
[evidence](gpt6-astra-xhigh-evidence.json). The
[Audit GPT-6 Astra (xhigh) Tetris run](t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3Af3d32a21-0bcd-40ca-9f14-2d166273ca25%3Adelegate-task%3A9389106e-1127-4064-8603-a14a4819969b)
metadata independently confirms Codex / gpt-6.1-sol and a subagent relationship.
I performed the audit myself without delegation. Only this review's native
metadata and own T3 thread metadata were read; the latter also returned one
truncated own commentary item. No tested-model or other-run transcript,
other native session, or `~/.t3` file was read. Generation effort, duration,
tokens, cost, quota and accounting state have no quality-score effect.

Orchestrator check: Claude Opus 5.5 read the same model/effort from the native rollout. Codex quota used by this review (Plus plan): 5-hour window 39→48% (9 points), weekly 90→92% (2 points).

## Scores

| Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 9.5 | 8.5 | 9.0 | 9.0 | 9.0 | **9.10** | 1 minor |

Correctness `10−1×0.5=9.5`. Weighted
`9.5×.40 + 8.5×.20 + 9×.20 + 9×.10 + 9×.10 = 9.10`.
Half-point categories and the existing 40/20/20/10/10 weights apply.
The delivery builds, passes all **28/28 unchanged own tests** and starts in
both Chromium sizes. No major or critical finding applies. Passing the audit
runner reproduces documented defects as well as conforming behavior.

## Finding

Coordinates below are canonical SRS origins in the visible field,
x=0..9/y=0..19. Native storage adds20 to y. O's occupied columns are x+1/x+2.
Fixtures set legal pose, stack and clock state; every scored action and
successful rotation uses the delivered methods. Spin eligibility is never
injected. All reproductions start at level1 with fresh clocks and counters.

1. **Minor — A spent lock timer and reset allowance survive lower descent.**
   These related clock/budget manifestations form one lock-policy finding.

   - Set grounded O r0 at **(−1,12)** with supports **(0,14),(1,14)**.
     Perform **15 successful alternating Right/Left actions**, starting
     Right, ending at x0. Advance **490ms**, then Right twice to x2, off the
     supports. The piece leaves with `lockTime=490`, `lockResets=15`.
     Advance using1ms ticks. It lands **6000ms after departure** and locks
     at **6010ms**, only **10ms after contact**. Expected a fresh500ms at
     the lower landing, locking at6500ms. The unspent control lands6000/
     locks6500ms. There is no airborne lock.
   - Same initial setup, **14 alternating actions**, then Right twice,
     without the490ms wait: the final grounded action spends reset15,
     and the piece leaves at x1. At the lower floor `lockResets` remains15.
     Wait400ms, successfully move Right, wait100ms. Actual **six stored
     cells and a replacement piece**; expected only the two supports and
     the O still active with a fresh500ms movement reset. A genuinely lower
     row must renew the manipulation allowance.

   Actual keyboard actions and unchanged frame callbacks reproduce both
   manifestations at **1280×800 and390×844**. In
   [game.ts](../gpt-6-astra-xhigh/src/game.ts), `stepDown()` (lines169–176)
   clears rotation credit but neither lock state; `trackGround()` only
   sets a sticky flag; `resetLock()` (lines182–188) cannot renew delay once
   the count reaches15. `tick()` pauses the retained timer while airborne.

   Controls pass grounded499/500ms, successful movement reset, failed-wall
   nonreset, a full500ms grant on the fifteenth reset, and a sixteenth move
   that cannot extend it. A one-row fall plus contact locks at1500ms with
   10/100ms updates; 60/144Hz first-observed locks differ by at most a frame.
   These controls rule out a separate contact-accounting or early-reset15
   deduction.

## Calibration and category rationale

[Astra6 low](gpt6-astra-low-review.md) and
[medium/high](gpt6-astra-medium-high-review.md) remain **7.00/7.00/8.90**.
Xhigh retains high's single grouped lower-row clock/budget minor, matching
[Astra6.2 low](gpt62-astra-low-review.md),
[medium](gpt62-astra-medium-high-review.md) and
[Sol6.2 max's grouped lock-policy finding](gpt62-sol-xhigh-max-review.md).
Both symptoms are deducted once. It fixes high's blocked soft-entry burst:
grounded400ms, Right, grounded400ms now has `fallTime=0`; blocked Down,
Right twice off the ledge, a1ms frame produces **zero rows/zero points**.
Normal Down after800ms likewise produces only its immediate one row/one
point. The direct engine-only `tick(1,true)` transition without that initial
controller row can produce one row from the old accumulator; this diagnostic
is recorded separately and is not a reproduced player-facing defect.

Ordinary/B2B perfect clears, exact HD-SPIN-1 travel/zero-travel controls,
hidden lock-out and the phone next queue pass, avoiding low/medium's other
findings. Full/mini spin zero/single scores and all four facings, manual-soft
credit cancellation, failed actions, fourth/fifth kick distinction, spin
double and spin-B2B/combo pass. Unlike
[Astra6.2 xhigh/max](gpt62-astra-xhigh-max-review.md) and
[Sol6.2 xhigh](gpt62-sol-xhigh-max-review.md), reset15 gets its entire500ms.
No optional-control, preview-count, high-level cap, spawn-height,
frame-rounding or unresolved automatic-gravity spin deduction is added.

**Own tests8.5:**25 engine cases plus3 real-server cases pass unchanged.
They cover100 seeded bags/distinct colors; board/buffer/queue; walls/occupied
movement; every piece's four-turn and opposite-turn restoration; real T wall/
floor and I fifth floor kicks; trapped-rotation preservation; exact obstructed
ghost and weld/drop points; soft drop/non-lock; restricted hold, retrieval and
queue preservation;999/1000ms gravity,20×soft and level15 speed; precise
mid-tick contact;15 resets and blocked-wall nonreset; integrated Tetris row
compaction/combo/B2B; ordinary and B2B-PC Tetrises; pre-clear level, ten-line
progression, start level and level cap; pure scoring tables for normal/full/
mini/chain breaks; real full/mini zero spins and full single; manual-soft
spin cancellation; next/hold blocked spawn, wholly hidden lock-out; pause/
actual restart; and5000 seeded mixed-action invariants. Server cases assert
HTML/CSS/module MIME, allowlisted assets, traversal/missing-source rejection,
malformed URL, HEAD and405 responses. The unchanged suite uses `PORT=0` for
its own ephemeral server.

This is the same8.5 tier as high and Astra6.2 max: contact, B2B-PC and server
coverage add useful checks, while normal1–3 clears here use the pure scoring
helper rather than full engine integration, and the full CCW-cycle coverage
is narrower than high. It lacks an authoritative28-state/48-kick oracle,
ledge/new-lowest/retained clocks, a full gravity curve, integratedPC1–3,
four spin facings/kick promotion/travel-hard-drop history, partial-hidden
controls and a declared browser suite. The ignored UI diagnostic is outside
`npm test` and receives no suite credit. Audit probes earn no own-test credit.

**Code9.0/simplicity9.0:**707 source TS lines across six clear modules
separate geometry/bag, engine, scoring, input, renderer and UI. Strict
TypeScript, typed state, injected RNG, bounded storage, shared geometry,
small event-splitting timing and revision-based redraw make the pipeline
readable and proportionate. Input handles repeat, aliases, pointers and
focus loss centrally; persistence tolerates storage failures. TypeScript is
the only development dependency; the36-line built-in-Node server needs no
runtime packages. The larger input/server/test surface is functional rather
than architectural overhead. This matches high and Astra6.2 high/max9.0/9.0.

`output/playwright/` contains six PNGs, a machine-specific CLI config and an
ad-hoc UI check script; two `.playwright-cli/` YAML snapshots also remain
locally. They are ignored, outside compilation/runtime imports and absent
from served allowlisted assets. They add checkout clutter but do not impair
the delivered game's code quality or simplicity. All hashes are preserved;
their images are not used as audit evidence.

**Browser UX9.0:**clear distinct piece colors, visible ghost, used-hold
feedback, five previews, score/best/level/lines, pause/ready/end overlays,
clear feedback, time/progress and discoverable required aliases. Phone move,
soft, both rotations, hold and drop work; Pause releases Space for the next
hard drop. Blur pauses; R restarts after natural top-out. Four new audit PNGs
were inspected: unmodified baseline play and deterministic held-O/active-T/
ghost at each viewport. Desktop board272×544, document874px high; phone
board228×456, document928px high. Both fit viewport width, preserve square
preview cells and show all five next pieces. Phone previews are small but
recognizable; normal vertical scrolling reaches remaining help/footer.
No application page error or failed required asset. This matches high's9.0.

## Coverage, preservation and reproduction

Read `TETRIS.md`, `AGENTS.md`, `SPEC.md`, ranking methodology and the cited
calibration artifacts. Read every delivered source, test, server, HTML/CSS,
manifest/lock/config/ignore and README; inspected the ignored diagnostic
script/config as development artifacts. SHA-256 covers **all27 delivered
files**, including ignored PNGs/snapshots and STATISTICS.md, excluding generated
`dist`, dependencies and Git internals. They are unchanged after every copy.
The evidence records hashes, environment, full workflow output, numeric
outcomes, reviewer/native/thread metadata and preservation checks.

Random temporary copies run `npm ci --ignore-scripts --offline`, explicit
`npm run build` and unchanged `npm test`. Engine fixtures adapt the earlier
Astra6 medium/high probes with coordinate/property names only. They compare
28 canonical states,48 ordered kick lists and576 real wall/floor/stack
rotations;100 bags; hold/clock replacement; seven independently checked
obstructed ghosts/welds/drop points; lock/reset/descent/contact; levels1–20
(with the delivered accepted level15 cap); normalPC1–4/B2B/combo/pre-clear
levels/compaction; full/mini/HD-SPIN-1; hidden/partial lock, blocked spawn,
terminal freeze and actual restart/fresh bag. Score results include normal
100/300/500/800, PC900/1500/2300/2800, B2B-PC sequence total5200 and spin-B2B
800/1250 deltas. All engine outcomes are identical in Node and both served
Chromium module contexts.

Baseline pages load unmodified. For detailed keyboard replay, an appended
accessor exposes the existing game/input/render and a controlled RAF callback;
no delivered rule body is replaced. Rejected-candidate capture is confined
to a sacrificial collision function; real rotation tests use intact collision.
Actual required keys, pause/blur, game-over/R,60/144Hz frame cadence, clicked
Pause/Space and every phone pointer button are asserted. Root-installed
Playwright1.64.0 / Chromium156.0.8078.4 only; no browser downloads. Auditor
servers use free41000–49999 ports and the unchanged PORT-aware server.

The first sandboxed own-test run passed25 engine tests but could not bind the
server; approved execution passes all28. This local permission failure is not
a delivered defect. An initial screenshot-inspection invocation lacked a TTY
and received EOF only after all checks passed; its temporary copy was removed.
The subsequent terminal run allowed all four PNGs to be inspected before
cleanup. These harness/environment corrections changed no implementation.
All copies, screenshots, logs, browser profiles and owned servers/browser
processes were removed, including failed/interrupted workflow cleanup.

```sh
python3 .audit/run-gpt6-astra-xhigh-audit.py --offline
python3 .audit/run-gpt6-astra-xhigh-audit.py --offline --engine-only
# In an interactive terminal, inspect PNGs before automatic cleanup:
python3 .audit/run-gpt6-astra-xhigh-audit.py --offline --review
```

[Runner](run-gpt6-astra-xhigh-audit.py),
[engine probes](gpt6-astra-xhigh-audit.mjs),
[browser probes](gpt6-astra-xhigh-browser.cjs),
[evidence](gpt6-astra-xhigh-evidence.json).
Default execution compares pinned outcomes and hashes; `--record` intentionally
refreshes evidence while preserving the original reviewer identity/annotations.
Offline reproduction requires cached dependencies and installed Playwright.

This is a focused conformance audit, not an exhaustive state-space proof or
long-duration/physical-touch/cross-browser/high-DPI certification. Full spin
triples and mini doubles lack separate integrated fixtures; their tables are
source-reviewed. Automatic-gravity spin history remains unresolved and
unscored. No generation/accounting reconciliation or project archival is claimed.
Parent completion confirmation and lifecycle steps remain separate.

## Validation

- Final isolated locked build, unchanged28/28 suite, Node/Chromium probes and
  both viewports pass; four screenshots visually inspected before cleanup.
- Final default pinned fresh-copy reproduction passes all the same checks.
- `python3 scripts/benchmark.py render` and `python3 scripts/benchmark.py verify`:
  exit0.
- `node .audit/verify-ranking.mjs`: passes632 local links,105 scores, deductions,
  arithmetic, ordering and tables.
- JavaScript syntax, Python parsing and `git diff --check`: pass.
- All104 earlier ranking entries, protected registry/pricing/statistics/prior
  reviews, and all27 delivered hashes remain unchanged. Only this audit's five
  artifacts, audit index, ranking entry/narrative/ordinals and generated
  README/ranking tables change. No commit, push, PR, model run or archival.
