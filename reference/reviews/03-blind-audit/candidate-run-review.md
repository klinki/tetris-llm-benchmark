# Candidate run — independent final quality audit

**2026-11-19, Europe/Prague. Reviewer: GPT-6.1 Sol, xhigh.**
Actual native identity, read from this auditor's own Codex rollout
`turn_context`: **model `gpt-6.1-sol`, effort `xhigh`**, native session
**`01a1f469-6282-7a91-8acf-72951c5ea391`**, context timestamp
`2026-11-19T15:25:11.432Z`. Source:
`/Users/david/.codex/sessions/2026/11/19/rollout-2026-11-19T16-25-09-01a1f469-6282-7a91-8acf-72951c5ea391.jsonl`.
Only this session's metadata was read; no T3 transcripts or `~/.t3` were read.
The auditor performed the work directly, without delegation.

Scope: **`candidate-run/`**, implementing the root `TETRIS.md` task.
The candidate's model, generation effort and harness are undisclosed.
There is no registry entry or `STATISTICS.md`; neither is needed to assess
implementation quality. No generation, accounting reconciliation, registration
or project archiving was attempted. This is the completed quality audit only.

## Scores

| Correctness | Own tests | Code quality | Simplicity | Browser UX | Weighted |
|---:|---:|---:|---:|---:|---:|
| 10.0 | 9.5 | 9.0 | 9.0 | 9.0 | **9.50** |

`10×0.40 + 9.5×0.20 + 9×0.20 + 9×0.10 + 9×0.10 = 9.50`.
All categories use half-point increments. Correctness starts at10 with
no confirmed deduction. Generation time, tokens, model identity, effort,
price and quota have no scoring effect. Audit probes earn no own-test credit.

## Findings

**No confirmed defect in the audited scope.** There are no critical, major
or minor findings to reproduce or deduct. The numbered acceptance checks below
record exact high-risk reproductions and their expected versus actual results;
they are passing controls, not bug findings.

1. **HD-SPIN-1 and manual translation — conforming.** Fresh level1:
   stack `(0,17),(0,19),(2,19)`, T r0 `(0,3)`, real CW to r1 `(0,3)`.
   Independent canonical ghost is r1 `(0,17)`. A fourteen-row hard drop
   expects **28** drop points and no spin; actual **28**, `spin=null`.
   Stack `(5,17),(3,19),(5,19)`, T r3 `(3,17)`, real CW to r0,
   zero-travel hard drop expects mini **100**; actual **100**. Replace
   `(5,19)` with `(3,17)` for full **400**; actual **400**. The same zero
   pockets score100/400 by timed500ms lock. Real Up/Space repeats the
   travel/mini/full controls at both browser sizes, recording actual and
   expected scores separately. Fourteen manual soft rows then zero-travel
   hard drop score14 only. Successful lateral translation cancels credit;
   blocked lateral/soft actions preserve it.
2. **Contact, reset cap and retained clocks — conforming.** Grounded O r0
   `(3,18)` remains active at499ms and locks at500ms. After490ms a valid
   Right gives another full500ms. Fifteen alternating successful moves each
   renew the timer; after reset15,499ms is safe, move16 plus1ms locks.
   Failed wall moves do not reset. O r0 `(3,17)` falls at1000ms and locks
   at1500ms. For the ledge fixture, support `(0,14)`, O r0 `(-1,12)`,
   spend either0 or15 resets with real O rotations, wait490ms, move Right
   off support. It is still airborne after20ms and lands6000ms after the
   move. Both variants receive the expected full500ms and renewed movement
   resets at the lower floor. For the downward-kick fixture, stack
   `(3,12),(4,14),(4,16)`, T r0 `(4,11)`, soft-drop once, spend15
   alternating Left/Right moves starting Left, wait490ms, then real CW:
   fifth kick reaches r1 `(2,14)` and gets500ms, rather than10ms.
3. **Scoring — conforming.** Zero-travel1/2/3/4-line locks expect and give
   **100/300/500/800**; perfect versions give **900/1500/2300/2800**.
   Tetris/no-clear/Tetris gives2000; following single gives2150 and breaks
   B2B. Consecutive Tetrises give2050; replacing the last of the spaced
   Tetrises with a PC gives5200. Level2 combo-single increment300;
   nine-to-ten-line crossing100 at the old level, then level2.
   Real rotations give full/mini zero/single **400/800/100/200**, both hard
   and timed locks; all four facings' zero-line full/mini controls pass.
   Full double1200; fifth-kick promotion with a single800; a corner pocket
   without rotation0; spin-single/no-clear/spin-single2000.
4. **Hidden top-out and restart — conforming.** Stack
   `(3,1),(6,1),(7,1),(8,0)`, genuine T spawn, Right twice, CCW then CW:
   T r0 `(6,-2)` is wholly hidden and grounded. Zero-travel lock expects
   game over and gives `over`. Partially hidden T r0 `(7,-1)` over support
   `(8,1)` keeps its hidden mino and continues. Blocking next/held spawn
   ends play. Move/rotate/hold/soft/hard/time are inert after terminal
   state. Restart clears board, score, lines, level, hold, combo and B2B;
   three naturally topped-out seeded games each restart with a complete bag.

## Calibration and category rationale

Calibrated against the Sol6.1 low/medium/high/xhigh audit and max audit,
Opus5.5 efforts, Sonnet, Astra6 xhigh, Astra6.2 xhigh/max, Terra6.1 and
`.audit/SPEC.md`. No earlier result or ranking entry was changed.

**Correctness10.0** uses the same no-confirmed-defect standard as Sol6.1
high10.0. The candidate passes defects previously charged to those families:
soft-entry bursts, B2B-PC bonus, hidden lock-out, distorted previews,
Space captured by a header button, immediate reset15 locking, and retained
spent clocks/reset allowances at a genuinely lower row. Their severity rules
are unchanged; there is no deduction merely because similar code elsewhere
was defective. HD-SPIN-1's adopted travel/zero-travel distinction is applied
exactly. Automatic-gravity spin history remains unscored.

**Own tests9.5.** The unchanged default `npm test` passes **58 tests**, with
**one optional Chromium test skipped** because Playwright is not a project
package. Supplying the already-installed Playwright using its documented
`PLAYWRIGHT_MODULE` switch runs the same unedited suite: **63/63 pass**,
including four browser subtests. There are46 engine,11 controls and1 server
cases before the optional browser case. This score rates the delivered
assertions and source review, not the independent auditor's probes.

Meaningful coverage includes1000 seeded bags, exact28 orientations,
240 real kick fixtures with236 independently reachable indexed candidates,
spawn/queue order, walls/blocked rotation/O symmetry, obstructed ghost and
exact weld/drop points, restricted hold/retrieval/blocked hold, gravity curve,
soft entry/held cadence, cross-frame equivalence, exact500ms contact/reset
boundaries and cap, failed reset actions, spent-cap ledge/new-lowest and
fifth downward kick, hidden row compaction, normal1–4 clears at levels1/3,
pre-clear level crossing, exact combo/B2B continuation/break, PC1/2/4 and
B2B-PC, real full/mini zero/single and full double, fifth-kick promotion,
manual/hard-drop spin cancellation, spin-to-B2B, hidden/partial lock-out,
terminal freeze, pause, fresh-bag restart, and lock descriptions.
The controls suite tests key aliases, DAS/ARR boundaries, opposing-source
fallback, pointer/key coexistence, reset and chronological repeat/game-clock
integration. The server suite checks asset MIME and traversal/source denial.
The optional browser suite checks1280×800,1366×640,390×844 and320×568:
layout/aspect, keyboard/taps, focused Sound then Space, pause/blur,
blocked spawn/inert controls/R restart and stale-toast removal.

This exceeds Sol6.1 high's9.0 breadth and meets the9.5 tier of Sol6.1
xhigh's broader input suite, with further browser/ledge coverage. Gaps remain:
no own PC triple, full-spin triple/mini double, all-facing spin classification,
fourth-vs-fifth-kick negative distinction, or separate failed-action spin
retention assertions. Optional browser tests depend on an external installed
browser. Breadth and precise invariants support9.5; raw case count earns
no extra credit and finite testing does not justify a perfect suite score.

**Code9.0/simplicity9.0.**957 readable source TS lines in seven focused
modules. Geometry/bag, DOM-free engine, DOM-free controls, canvas rendering,
browser wiring, optional audio and local best storage are separated.
Strict TypeScript, unchecked-index and unused checks, injectable RNG, readonly
views and a documented fixture API make the state flow clear. One event-stepped
clock spends exact gravity/contact/lock time; input repeat intervals advance
the engine before dispatch. Direct small helpers and generated rotations avoid
shape duplication. There is no framework, runtime dependency, bundler or
needless abstraction; locked TypeScript and a46-line built-in Node server
are sufficient. This matches Astra6 xhigh and Astra6.2 xhigh/max's9/9
standard for readable proportional modules. The larger test suite does not
lower simplicity. The main loop draws the small board every frame rather
than revision-gating it; this is bounded ordinary work, not a measured
performance defect or a separate deduction.

**Browser UX9.0.** The visually inspected desktop and phone screenshots
show distinct colors, a clear grid and outline ghost, five complete next
previews, visibly dimmed used hold, legible score/best/level/lines/time,
useful desktop key legend and phone action labels. Stats and every phone
button fit without scrolling or clipping. Board sizes are338×676 at
`(471,61)` on desktop and260×520 at`(23,111)` on phone; documents are exactly
1280×800 and390×844. Board and previews preserve square minos, including
the held O. All seven phone actions respond; horizontal repeat, pause/resume,
focus-loss pause, sound toggle, clicked-header Space and R restart work.
Canvas/preview labels, reduced-motion CSS, modest clear toasts and optional
sound support play without clutter. No external asset, page error, console
error or failed request occurred. These practical qualities match the9.0
interfaces in the calibration audits; extra art or sound quantity earns
no separate credit.

## Method, evidence and reproduction

All19 delivered file SHA-256 hashes are recorded before/after and unchanged.
Every install/build/test used fresh random temporary copies under`/tmp`,
excluding generated dependencies/output and`.git`. `npm ci --ignore-scripts
--offline`, `npm run build` and unchanged`npm test` pass. Toolchain:
Node26.0.0, npm11.17.0, locked TypeScript5.9.3, installed Playwright1.64.0 /
Chromium156.0.8078.4. No package/browser was downloaded.

The independent probes compare28 exact states,48 rejected-candidate kick
orders,576 actual first-fitting CW/CCW rotations at walls/floor/hidden ceiling
and seeded obstructions,100 real engine bags, hold, all seven obstructed
ghosts/drop points, scoring, lock/ledge/downkick clocks, all20 gravity levels,
soft entry and terminal/restart behavior. The entire engine probe runs again
against served modules inside each browser viewport. Actual key/touch checks
add browser wiring coverage. Engine and unchanged RAF paths both give9 rows
and0 points over600ms at level10 at60/144Hz.

Only test accessors are appended to the served main module, and RAF is
captured to drive the unchanged frame callback. Fixture setup changes only
board/pose/progress/clocks. Rotation eligibility is never assigned, and no
rule body or successful rotation is replaced. Sacrificial `fits` rejection
only enumerates kick order. A temporary Node preload confines the delivered
suite's `PORT=0` listeners to41000–49999; the delivered tests and server files
remain byte-for-byte unchanged. The independent server also uses a checked
free port in that range.

An initial sandbox-local server-test run stalled and was stopped/cleaned;
approved local-network runs pass. Two audit-harness issues were corrected
before final verification: one r3 mini pocket needed a supporting corner,
and synthetic browser timestamps needed to read `lastFrame` after resume.
Neither was a delivered defect. Expected conformance and observed outcomes
are retained distinctly in the evidence.

```sh
python3 .audit/run-candidate-run-audit.py --offline
# To pause for screenshot inspection before automatic deletion:
python3 .audit/run-candidate-run-audit.py --offline --review
```

The default command compares saved engine/browser outcomes and delivered
hashes. `--record` intentionally replaces the evidence. Reproduction keeps
the original reviewer's verified identity and records the reproducer separately.
All temporary copies, screenshots, browsers and servers are cleaned in
`finally` paths; no temporary candidate workspace is retained.

Artifacts: `candidate-run-review.md`, `run-candidate-run-audit.py`,
`candidate-run-audit.mjs`, `candidate-run-browser.cjs`,
`candidate-run-evidence.json`, all under`.audit/`.

## Coverage limits and validation

Focused finite conformance audit, not an exhaustive state-space proof,
long-duration playtest, physical-touch-device test, high-DPI check or
cross-browser certification. Full-spin triples, mini doubles and a distinct
fourth-kick promotion-negative fixture were source-reviewed rather than
separately integrated in this final audit. Automatic-gravity spin eligibility
is unresolved by SPEC. No usage/accounting or provenance conclusion is made.

- Fresh-copy offline install, build, default own tests and optional own
  Chromium tests pass; independent Node plus desktop/phone probes pass.
- Both retained gameplay screenshots were inspected before deletion.
- Saved-probe reproduction, JS syntax, Python parsing, whitespace, score
  arithmetic and final hash/cleanup checks pass.
- All19 delivered hashes are unchanged. `ranking.json`, `.audit/README.md`,
  `benchmark-runs.json` and `pricing.json` retain identical hashes.
- No `render`/`verify`, generation, commit, push, PR or archive action ran.
