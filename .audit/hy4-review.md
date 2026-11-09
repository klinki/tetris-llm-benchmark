# Hy4 high independent quality audit

Audit: **2026-11-10, Europe/Prague; GPT-6.1 Sol, xhigh**, T3 Code / Codex.
The requested reviewer did the source/test review, fixtures, screenshot
inspection, scoring and repository updates itself. No delegation, benchmark
transcript or thread reading. Identity, effort and isolation were verified on
import and accepted as supplied; no quality credit or penalty follows from
them. All **80 historical ranking entries remain identical as parsed data**.
Existing Crouton attempt documents, README/RANKING/pricing changes and Hy4
import/registry files are preserved. No commit, push or PR.

## Score and calibration

Read [TETRIS.md](../TETRIS.md), [SPEC.md](SPEC.md), including current
**HD-SPIN-1**, the complete RANKING scoring rules/methodology and relevant
conformance/own-suite comparisons, ranking.json, the audit index, and the
[Qwen Max xhigh](qwen38-max-xhigh-review.md), [GLM MAX](glm53-max-review.md),
[Terra 6.1](gpt61-terra-review.md) reviews and their runner/engine/browser
patterns. The independent canonical oracle is reused from the unchanged
[Opus effort probes](opus55-efforts-audit.mjs). The
[auditor agreement](auditor-agreement.md) and HD-SPIN-1 amendment constrain
interpretation; no new gravity/spawn/held-key rule is introduced.

Every delivered file was reviewed: nine src TypeScript modules (1,182
physical lines), complete 334-line own suite, HTML/CSS, package and complete
lockfile, tsconfig, server, .gitignore, task README and generated STATISTICS.
All 18 delivered file hashes remain unchanged. No delivered source, own
assertion, build configuration, rendering or input body was repaired.

| Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 8.0 | 7.0 | 9.0 | 8.5 | 8.5 | **8.10** | 4 minor groups |

Correctness `10−4×0.5=8`; weighted
`8×.40+7×.20+9×.20+8.5×.10+8.5×.10=3.20+1.40+1.80+.85+.85=8.10`.
Repository rank **29/81**; results-site rank **24/74** under its existing exclusions. Each confirmed group is charged only once to
correctness; own omissions determine tests, and added audit tests earn no
own-test credit. No historical score changed.

Calibration: mini/full/two-corner misclassification is one narrow spin
minor, following Terra low's mini classification and the GLM low spin-edge
group, rather than a missing-full-spin major. PC crossing-level and B2B-PC
arithmetic are one PC feature group, not two deductions for variants of the
same bonus; ordinary PC and ordinary B2B work. Together these are two
scoring minors, like the isolated mini/PC precedent. Landing-frame timing
matches Terra/Opus/GLM's existing minor. Above-buffer wall escape and cell
loss share the same boundary group, following full GLM high's grouping and
GLM MAX's discarded-cell minor. No broad shape/kick-table major applies:
all canonical states and ordered tables match.

## Reproduce

```sh
python3 .audit/run-hy4-audit.py --offline
# Optional local image inspection, in an interactive terminal:
python3 .audit/run-hy4-audit.py --offline --review
```

[Runner](run-hy4-audit.py), [engine fixtures](hy4-audit.mjs),
[Chromium fixtures](hy4-browser.cjs). One random disposable copy excludes
node_modules/dist/.git. Locked `npm ci --ignore-scripts --offline`, explicit
`npm run build`, unchanged `npm test`: **26/26 smoke tests pass**. Own build
and tests were repeated after the independent probes were finalized. Node
**26.0.0**, locked TypeScript **5.6.3**, installed Playwright **1.64.0** and
Chromium **156.0.8078.4**. Offline needs cached TypeScript; omit offline on a
clean machine and install root Playwright/Chromium first.

The own server hard-codes8321 and ignores PORT. Following recent runners,
only the copied server's listen constant temporarily honors PORT41000–49999;
its original npm start command, routes, MIME and app bodies remain intact.
The constant is restored before copied-file hash comparison. The unadapted
copied server was also opened through T3 preview at 8321; all game modules
loaded. That tab/server were closed. No original folder was built or served.

The browser uses the established library workflow explicitly requested for
this audit. It appends observation handles to the served main response,
captures requestAnimationFrame and performance.now, and forwards canvas
fillRect calls while recording them. Engine, input, main frame and renderer
bodies remain unchanged. Fresh seeded games replace scenario state only.
No fixture sets spin credit/rotation success. Ordered-candidate diagnostics
force rejection solely to observe every candidate, on separate sacrificial
games; no outcome or scoring test uses those diagnostic overrides.

Default run deletes all copies, logs, screenshots and owned process groups
on success/failure/handled interruption. `--engine-only` explicitly skips
browser work; `--review` pauses before deletion and requires interactive
stdin. An initial noninteractive --review attempt reached EOF after all
assertions passed and cleaned its root; it was rerun with a PTY and both
images inspected. Exploratory fixtures adapted GLM's two-row-hidden spawn
to Hy4's one-hidden-row spawn; an initially blocked I spawn and an overlapping
two-corner setup were corrected only in audit code. Neither was counted as
a game failure. The final full runner passes unchanged.

## Confirmed findings and exact fixtures

Coordinates are visible field **x=0..9,y=0..19**. Native y = visible y+2.
All poses below are checked noncolliding. Actual scoring and expected rule
values are distinct: passing the runner means recorded outcomes reproduce,
not that every rule conforms. Every engine probe repeats against served
modules in desktop and phone Chromium. Real keys/RAF separately reproduce
every finding group.

### 1. Minor: T-spin corner classification over-awards full spins

Source: [detectTSpin](../hy4-high/src/game.ts#L341).

Stack `(5,17),(3,19),(5,19)`, T r3 at `(3,17)`, real CW to r0, same origin.
Ghost distance is zero. Space or timed500 ms lock gives **400**, expected
mini **100**. Fill row18 outside x3..5: mini single **800**, expected **200**.
Replace `(5,19)` with `(3,17)` for the full control: **400/800**, correct.
All four facings return full400 for mini and full pockets alike. A fourth
kick mini at r1,(3,17), blockers
`(3,15),(3,17),(5,17),(3,18),(6,19)`, real CCW reaches r0,(3,15), then
zero-travel Space scores400 instead of 100. Fifth-kick full and full double
score400/1200 correctly.

False-positive control: T r1 at `(3,16)`, blockers `(3,18),(5,18),(4,19)`,
real CW to grounded r2,(3,16). Only the two front corners are occupied;
Space/timed lock awards **400**, expected **0**. detectTSpin returns full
for any three corners, or just two front corners, so mini discrimination and
the minimum three-corner threshold fail together. The own spin fixture is
also a mini but expects full400; this encodes the error without changing it.

**HD-SPIN-1 is conforming for travelling drops.** Required stack
`(0,17),(0,19),(2,19)`, T r0 `(0,3)`, real CW r1, independently verified
ghost destination `(0,17)`, fourteen-row Space: **28**, expected28. Manual
soft descent then zero-travel Space adds0 spin points, also correct. Zero
travel preserves rotation eligibility: the full control scores400, while
the mini control's400 is a classification failure, not a travel-history
failure. Failed soft/lateral actions in the full pocket preserve400.
Automatic descent clears credit and is recorded without a new gravity rule
or deduction. No extra spin-history finding.

### 2. Minor: perfect-clear arithmetic at a level crossing and B2B Tetris

Source: [PC bonus after level update](../hy4-high/src/scoring.ts#L80).

Ordinary level-one PC single/double/triple/Tetris score
**900/1500/2300/2800**, matching the benchmark's additive profile. However:

- At9 lines/level1, bottom row19 outside x3..6 filled, I r0 `(3,18)`,
  zero-travel Space empties the board. Actual **1700**, expected **900**.
  Ordinary100 uses old level1; the800 PC bonus uses newly updated level2.
  Lines10/level2 after the clear are correct.
- Real Tetris, no-clear O placement, then Tetris PC: total **4000**,
  expected **5200**. The last clear awards3200, expected4400: B2B line
  base1200 plus ordinary2000 PC bonus, instead of the3200 B2B-PC bonus.
  The no-clear lock preserves B2B correctly and resets combo.

Both are in registerClear's PC branch: one related bonus-arithmetic minor.
The Chromium real I/Space crossing also gives1700 and zero occupied cells;
the complete engine B2B-PC sequence repeats in both browser sizes.

### 3. Minor: landing frames count airborne time toward lock delay

Source: [update contact and timer ordering](../hy4-high/src/game.ts#L156).

O r0 `(3,17)`, empty field, level1. Advance990 ms in at-most16 ms parts, then
16 ms to observed contact. After another483 ms (**1489 total**) no cells are
welded; another1 ms (**1490**) welds four. Contact is due at 1000, so500 ms
lock delay should not expire before1500. update adds the entire16 ms frame
to the lock timer after falling, including10 ms before contact.

Real unchanged main RAF reproduces1490 at both sizes. Existing-ground
499/500, successful reset, full fifteenth reset, sixteenth unable to reset,
and failed wall-action clocks pass. Ordinary/exhausted ledges never weld in
air, and falling to a new lowest row restores spent resets. With1 ms contact
frames the same charge appears as499 ms from observed contact to weld,
grouped here, not another ledge deduction. No new airborne stale-clock or
reset-cap defect was established.

### 4. Minor: above-buffer wall escape and lost partial-lock cells

Sources: [board boundary/storage guards](../hy4-high/src/board.ts#L29),
[lock write path](../hy4-high/src/game.ts#L361).

Two manifestations of inconsistent bounds:

- S r1 `(-1,-2)`, blockers `(2,-2),(0,0)`, real CCW. The fourth candidate
  incorrectly succeeds at r0 **(-1,-4)**, including an occupied cell at
  x−1. Canonical walls require the fifth candidate at **(0,-4)**. isOccupied
  returns open air for native y<0 before checking x bounds. All 28 states and
  48 ordered kick lists pass, but672 deterministic first-fitting outcomes
  retain **14 boundary differences**: J3/L3/S3/T3/Z2. No normal-field shape
  mismatch was found. Real Chromium Z reproduces the same illegal origin.
- Start at **actual I spawn r0,(3,−1)**, stack
  `(5,1),(3,1),(6,1)`, with incoming T independently open. Real CW takes
  fifth kick to grounded r1 **(4,−3)**, cells `(6,−3)..(6,0)`. Ghost travel
  zero, then Space continues play but welds only **3** cells: top native
  y−1 is discarded by board.set. Existing3 plus new3 = **6** occupied,
  expected7. This starts from a noncolliding real spawn and uses one public
  rotation/drop, not an injected rotation outcome. Desktop and phone agree.

Legal stored-buffer partial O locks keep all four and continue; wholly
hidden O locks top out; blocked spawns and terminal guards work. Stored-
buffer O controls set legal poses directly; they are not claimed to be
public spawn-to-pose reachability proofs. The I loss path above is a public
spawn-to-lock replay. Wall and storage manifestations share one buffer-edge
minor, without stacking one deduction per missing coordinate.

## Added audit coverage

- 28 canonical coordinate sets,48 actual ordered rejected-candidate lists,
  672 independently computed first-fitting CW/CCW rotations with walls,
  floor, stacks and above-buffer candidates;14 differences explicitly pinned.
  O rotation is inert and retains its pose; it is not treated as a required
  successful rotation or reset.
- 100 real seven-bags over ten seeds, clearing the stack between actual
  placements; hold restriction, post-lock retrieval in spawn orientation;
  independent obstructed ghosts for all seven pieces, exact drop points,
  four welded cells and nonadjacent-row compaction.
- 499/500 grounded timing, successful/failed resets, full15 allowance and
  cap, landing partitions, ordinary/exhausted ledges and new-lowest reset.
- 20-level gravity thresholds; at levels1/2/5/9/10/14/15/20:
  **1000/793/356/94/65/12/8/1 ms**. 600 ms at level10 gives9 rows at both60
  and144 Hz, in engine and unchanged browser RAF. Real Down after800 normal
  ms then1 ms gives one row/point, no accumulated-time jump; release returns
  normal cadence. Held replacements get a fresh1000 ms gravity phase.
- Normal1–4, consecutive Tetris/B2B/combo, no-clear continuity/break,
  level-two combo, old-level crossing, PC1–4/B2B-PC/crossing, full/mini
  zero/single via actual rotations and timed/hard lock, full double,
  four facings/fourth/fifth kicks, two-corner/no-rotation/failed-action and
  positive/zero hard-drop/manual-soft spin-history controls.
- Blocked spawn, stored hidden/partial controls, public above-buffer path,
  terminal guards, reset, three independent fresh restart seeds with all
  seven distinct opening pieces.

Real browser required keys: Left,Right,Up,X,Z,Left Ctrl,Down,Space,C,R.
DAS/ARR, opposite-direction precedence/release fallback, blur release,
pause/click-resume/Space, game-over overlay/inert nonrestart keys and actual
R after11 drops also pass. Engine probes repeat completely inside both
browser views. Forwarded drawing verifies the T ghost coordinates and all
24 hold/five-next cells inside proportional backing canvases.

| Chromium viewport | Board x,y | Board size | Document width,height | Hold / next display |
|---|---|---|---|---|
| 1280×800 | 463,119 | 354×708 | 1280×907 | 108×81 / 108×405 |
| 390×844 | 25,135 | 340×680 | 390×1515 | 150×112.5 / 150×562.5 |

Both full-page screenshots were inspected. Desktop has some vertical scroll;
phone supporting panels begin at y870 below the board and remain reachable
by vertical scroll. No horizontal clipping/overflow or stretched previews.
This follows the earlier DeepSeek high/reachable-panel precedent; no layout
minor is charged merely for vertical scrolling. The phone legend is hidden
and there are no touch buttons. Both are recorded UX limits, not new task
requirements. Page/console/application asset errors: **none**. Harmless
favicon requests are excluded as in prior audits. Font/scrollbar-sensitive
vertical coordinates can vary; exact backings/horizontal fit are asserted.

## Own tests, code and UX assessed separately

**Tests 7.0:**26 deterministic cases/334 lines. Five seeded helper bags;
sequence cycle/reset;28 four-cell invariants and exact T1/T2/I1 spots;
O invariance/colors;three kick-list spots;board bounds/one-row compaction;
helper level/gravity values;queue/walls;exact actual T CW wall kick;
independent obstructed O ghost;exact soft/hard points and new spawn;
integrated non-PC Tetris and ten-line level progression;real-rotation
zero-line spin;hold restriction/retrieval;actual999/1000 gravity;
499/500 existing-ground lock and successful movement reset;wholly-hidden
lock-out/blocked hold spawn/restart.

Normal/combo/B2B and full-double scoring checks call Scoring directly;
they do not prove engine recognition or actual clear integration. There is
no I/floor/CCW/blocked kick outcome, complete shape/kick oracle, independent
welded-cell count/coordinates, cap/contact/ledge/new-lowest, mini/two-corner,
PC bonus/crossing/B2B-PC, no-clear B2B, held rotated-orientation, partial
buffer/restart-bag, high-level actual cadence or input/browser assertion.
Own tests all pass; no random-dependent failure observed. The spin assertion
expects400 on a mini; it earns real rotation-path coverage but no correct
mini/full discrimination credit. Coverage is above basic6.5 Terra suites,
comparable to GLM high7.0, below Qwen Max xhigh/GLM low7.5 with stronger real
scoring/kick/cap integration. Test count alone supplies no extra credit.

**Code 9.0/simplicity 8.5:**readable strict TypeScript, unused/fallthrough
checks, explicit domain types, injected RNG/piece source, DOM-free game,
separate board/pieces/randomizer/scoring/input/render/entry, milliseconds
throughout, small direct helpers and standard dependency-free server/tsc.
The 1,182 source lines include comments and proportionate preview/input
work; mutable public state and emitted private fields require discipline.
A test-only pose helper and configurable source are modest surface area,
not a framework. Rule defects are not deducted again from code/simplicity.

**UX 8.5:**distinct beveled colors, grid/outline ghost, clear labeled HUD and
hold/five-next panels, complete desktop legend, custom DAS/ARR and soft
repeat, pause/resume/game-over/restart guidance, blur release and proportional
responsive canvases. No canvas accessibility names, touch UI, DPR scaling
or automatic blur pause. Phone information is below the fold and its legend
hidden. This is the recent8.5 keyboard-first tier, below 9.0 interfaces with
stronger mobile controls/accessibility/focus handling. No duplicate numerical
penalty for any correctness finding.

## Limits and validation

Focused deterministic conformance audit, not exhaustive state-space or
long-duration proof. Chromium only; no physical phone/touch/HiDPI hardware,
all OS repeat/focus/multikey combinations, other browser engine or every
spin arrangement. Automatic-gravity spin policy stays unresolved under
SPEC; no inference from HD-SPIN-1. Stored-buffer controls are legal setup
poses, unlike the public I loss replay. Independent expectations reuse the
established canonical oracle, not newly fetched live rule interpretations.
Generation metadata/pricing/isolation were accepted from import and not
re-accounted; they have no score effect. Local npm/browser caches are
reproducibility dependencies; screenshots are intentionally deleted after
inspection, leaving executable exact fixtures and numeric evidence.

- Full disposable audit runner: **passed**, locked install, explicit build,
  **26/26 unchanged own cases**, exact Node outcomes and both Chromium sizes;
  both final screenshots inspected in interactive --review, then removed.
- `benchmark.py render`, `benchmark.py verify`, `benchmark.py verify hy4-high`:
  **passed**. Imported statistics are unchanged.
- `python3 -m unittest discover -s tests -v`: **70/70 pass**.
- `node .audit/verify-ranking.mjs`: **521 local links/81 score rows pass**,
  including arithmetic, severities, ordering and Markdown table shape.
- Historical preservation checks: all 80 parsed score entries and historical
  audit bodies unchanged except heading ordinals; all 18 Hy4 files and the
  pre-existing registry/pricing/Crouton attempt files match starting hashes.
- `benchmark.py site`: **passed**,74 included runs/73 playable artifacts.
  Hy4 site metadata is rank24,score8.10,3,331,058 tokens; pricing/usage remain
  the import record, unchanged. `npm run check:site`: **148 successful checks**,
  zero unexpected failures/warnings, including Hy4 page/play. The three
  historical browser failures still fail as documented; no new failure.
- `git diff --check`: **passed**. All owned audit roots, screenshots/logs,
  servers and browser sessions were removed/closed; local ignored _site was
  regenerated. No commit, push, PR or publication.
- Syntax checks for all three new runner/fixture files pass.

