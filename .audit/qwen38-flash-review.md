# Qwen3.8 Flash audits (low, medium, xhigh)

Audit date: **2026-10-27 (Europe/Rome)**. Independent audit on `main` of
the first three **Alibaba `qwen3.8-flash`** runs via **OpenCode Go**,
**T3 Code / OpenCode**: `qwen3.8-flash-{low,medium,xhigh}`. Each used the
single prompt “Read the README.md file and implement it”; the task is
[`TETRIS.md`](../TETRIS.md). This record supports [`ranking.json`](../ranking.json)
and [`RANKING.md`](../RANKING.md). All **72 historical entries are unchanged**,
including Qwen3.8 Max low/medium **7.80/7.65**.

## Method and calibration

Re-read the ranking rubric, weights, Methodology, conformance and coverage
tables, ranking data, [audit index](README.md), and the recent
[Qwen Max](qwen38-max-review.md), [Opus medium rerun](opus55-medium-rerun-review.md),
[GPT-6.1 Terra](gpt61-terra-review.md) and [MiMo](mimo-v26-flash-review.md)
records with their probe/browser/runner workflows. Also checked the
[Opus efforts](opus55-efforts-review.md), [Sol calibration](gpt61-sol-review.md)
and [Terra restart-bag precedent](gpt56-terra-review.md).
Reviewed **every delivered source and test file, complete HTML/CSS,
package and lockfile, TypeScript config, server, available ignore file,
README and statistics**. No implementation transcript or T3 thread-reading
tool was used. This audit itself did not delegate.

The existing **0–10 half-point scale**, weights **40/20/20/10/10**, applies.
Correctness starts at 10: critical −4/cap 4, major −1.5, minor −0.5; clamp at 0.
Each defect is deducted **once, from correctness only**. Own-test gaps
determine tests; audit probes never earn implementation-owned test credit.
Tokens, cost, time, effort, interruption and isolation have no score effect.

Low/medium's absent full/mini spins and PC bonuses form **one grouped
major per run**, as in Qwen Max low and MiMo's incomplete scoring. Their
ordinary B2B/combo integration works. Xhigh's full/mini/B2B/combo scoring
works, so its different PC profile is **one isolated minor**, matching the
recent isolated-PC calibration. Medium's six wrong I-kick transitions form
one SRS major. Soft transition, soft-lock policy, whole-hidden lock-out,
retained restart bag and phone layout retain their earlier minor severities.
No lock-clock defect from Qwen Max or the other Opus efforts is presumed
to recur: those equivalent probes pass here.

The task's [Fandom link](https://tetris.fandom.com/wiki/Tetris_Guideline)
was unavailable (“Failed to fetch restricted URL”). Rechecked the same
[SRS](https://tetris.wiki/Super_Rotation_System) and
[scoring](https://tetris.wiki/Scoring) references underlying the unchanged
canonical oracle and benchmark additive PC profile. This is the established
benchmark convention, not a universal claim about licensed-game variants.

## Delivery and scores

Fresh-copy locked install, explicit `npm run build`, unchanged `npm test`
and each original `npm start` command pass. Chromium starts at both sizes.

| Effort | Own tests | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| low | 20/20 | 7.5 | 7.5 | 9.0 | 8.5 | 8.5 | **8.00** | 1 major, 2 minor |
| medium | 17/17 | 6.0 | 7.0 | 9.0 | 8.5 | 8.5 | **7.30** | 2 major, 2 minor |
| xhigh | 37/37 | 7.0 | 8.0 | 9.0 | 8.5 | 8.5 | **7.90** | 6 minor |

Correctness: low `10−1.5−2×.5=7.5`; medium `10−2×1.5−2×.5=6`;
xhigh `10−6×.5=7`.

- Low: `7.5×.40 + 7.5×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 3.00+1.50+1.80+.85+.85 = 8.00`.
- Medium: `6×.40 + 7×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 2.40+1.40+1.80+.85+.85 = 7.30`.
- Xhigh: `7×.40 + 8×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 2.80+1.60+1.80+.85+.85 = 7.90`.

### Low — 8.00

Summary: **Canonical SRS and basic B2B/combo; missing spins/PC, retained
restart bag and clipped phone field**.

Tests **7.5**: **240 lines / 20 deterministic node:test cases**, executed by
`node test/smoke.mjs`, cover exact centered hidden O spawn, three fixed-RNG
helper bags, L1/L2 gravity helpers and actual one-second fall, timed soft
points, exact hard distance/points/two floor coordinates, independent
empty-floor O ghost rows, exact legal single/shift and Tetris,
Tetris/no-clear/Tetris B2B continuity, real exact I and J wall kicks,
one transition's inverse-table relation, first/restricted/post-lock held
retrieval, grounded490/move/490/20 reset and hard bypass, wholly hidden O
lock-out, restart fields, exact combo single points and seeded random
actions with legality/queue/level invariants until top-out. “5000 random
inputs” is the loop's upper bound, not proof all 5000 ran.

The own “blocked spawn” case starts with an overlapping active O and ends
through the whole-hidden lock branch; it does not isolate a blocked incoming
spawn. No full canonical/candidate oracle, floor/CCW kick, independent
obstructed ghost, exact four-cell weld count, spin/mini/PC integration,
B2B break, higher-level combo/level crossing, precise500 ms/cap/contact/ledge,
held orientation, input or browser assertion exists. Useful exact drops,
basic scoring, kicks and resets match Qwen Max low/Opus high's **7.5**
breadth; raw case count adds no credit.

Code **9.0**, simplicity **8.5**: **941 source TS lines**, six readable
modules for bag, board, piece data, rules, renderer and entry/input. Strict
unused/fallthrough/no-emit checks, injected RNG, DOM-free rules, direct 2D
board and one seconds clock. Matrix data is verbose but explicit; mutable
state/test helpers need caller discipline. No runtime dependency or
disproportionate abstraction.

UX **8.5**: clear beveled colors, grid/outline ghost, complete hold/five
previews, readable score/best/level/lines, full keyboard legend, custom
DAS/ARR, blur release and local best storage. NEXT's label is faint, though
the five pieces remain clear. No pause, touch controls, canvas accessibility
label or high-DPI adaptation. The confirmed layout defect is deducted only
from correctness. Findings: **F1, F5, F6** below.

### Medium — 7.30

Summary: **Playable core with wrong I kicks, missing spins/PC, a soft-drop
jump and clipped phone support**.

Tests **7.0**: **213 lines / 17 node:test cases** cover twenty unseeded bag
permutations, four unique cells in28 states and kick-list lengths, exact
999/1001 ms first gravity row, timed soft points, right-wall O stopping,
actual I left-wall CW kick with loose final-x assertion, exact ghost-derived
hard points/two floor coordinates/new spawn, legal exact single/shift,
Tetris score≥800, actual ten-line level crossing, first/restricted hold and
post-lock availability,400/550 ms grounded lock, one450/move/450/100 reset,
blocked spawn, restart fields and board row shift. Random starts do not
affect the asserted results; no own flakiness was observed.

Four-cell counts/kick lengths do not test canonical states or offsets.
There is no post-lock held retrieval type/orientation, independent ghost
row, exact Tetris/B2B/combo/spin/PC score, precise500 ms/cap/ledge/contact,
higher-level gravity, hidden/partial fixture, terminal before/after state,
input or browser assertion. This is below low's exact B2B/combo/retrieval/
two-kick coverage and comparable to Qwen Max medium's **7.0**, which has
an integrated spin double but less exact hard-drop/level coverage.

Code **9.0**, simplicity **8.5**: **868 source TS lines**, eight readable
strict modules separating constants, generated geometry, bag, flat board,
rules, input, renderer and entry. Injected RNG, one millisecond clock and
direct helpers; typed storage and preview getters are modest machinery.
Incorrect rule data is a correctness finding, without a code penalty.

UX **8.5**: clear grid/ghost, complete hold/five next, readable stats/full
legend, high-DPI scaling up to2×, custom DAS and blur release. No pause,
pointer controls or canvas accessibility label. Findings: **F1–F3, F6**.
The interruption changes no criterion score.

### Xhigh — 7.90

Summary: **Canonical SRS and full/mini scoring; wrong PC profile, soft-drop
timing, hidden lock-out, restart bag and phone gaps**.

Tests **8.0**: **521 lines / 37 node:test cases** across five files cover
100 seeded helper bags/7000-draw exact distribution plus30 default-RNG bags,
board walls/floor/open above-top/stack collision/row shift/four-row clear/
empty detection, unique cells and kick-list sizes, four real T rotations,
exact J CCW and I CW wall kicks, a loose T floor kick and rejected CW/CCW
pocket, actual999/1000 ms gravity, exact five-row soft points/release,
grounded 499/504 delay and movement reset, fifteen allowed450 ms resets
followed by a blocked sixteenth reset, independent empty-floor I ghost row
and exact hard points, legal exact Tetris/full-spin double/mini zero/combo/
consecutive B2B integration, held retrieval/restriction, blocked incoming T/
restart, helper gravity ordering, seeded random actions over repeated games,
ten-line crossing, and normal/full/mini/B2B/combo/level helper values.

The PC helper assertions encode the wrong replacement table; the
instant-soft-lock case also expects the defect. They earn no conformance
credit for those rules. The hold test checks rotation0 without first
rotating the outgoing piece, so it does not prove orientation reset.
Hard drop checks points/new spawn but not welded-cell coordinates/count.
No full state/candidate oracle, independent obstructed ghost, legal
hidden/partial path, exact natural contact/ledge/soft entry, correct PC
integration, full/mini single or all-facing integration, B2B no-clear/break,
pre-clear-level/higher-level combo integration, input or browser test exists.
This broad helper/integration suite fits **8.0**, like Opus xhigh, below
the 8.5–9.5 suites' correct PC, more complete spin/contact/state/input coverage.

Code **9.0**, simplicity **8.5**: **938 source TS lines**, eight readable
strict modules for board, bag, canonical pieces, scoring, game, input,
renderer and entry. Injected RNG, DOM-free core, one millisecond clock,
typed flat storage and direct helpers. Tests compile in the same graph;
development Node types add no browser runtime dependency. Public/emitted
private state requires caller discipline; machinery is proportionate.

UX **8.5**: clear beveled seven-color board/grid/ghost, complete proportional
hold/five next, score/level/lines and combo/B2B indicators, full legend,
high-DPI setup, custom repeat and blur release. No pause, touch controls
or canvas accessibility label. Findings: **F3–F8**; F6 is one layout defect.

## Confirmed findings and exact fixtures

Coordinates are **visible-field x=0..9,y=0..19**; negative y is hidden.
Every run stores native board/active y=field y+**2**. O uses a cropped 2×2
origin; the oracle allows a fixed O x translation. Fixtures set stacks,
poses and clocks, never assign spin credit or repair engine behavior.

**F1 — low/medium, major each: full/mini T-spins and PC bonuses are absent.**
T r3,(3,17), stack(5,17),(3,19), plus(3,17) for full or(5,19) for mini.
Actual CW reaches grounded r0,(3,17), zero hard travel. Full/mini zero-line
locks give **0/0**, expected400/100; fill row 18 outside x3..5 for singles:
**100/100**, expected800/200. Hard and500 ms timed locks agree. A real
two-CW full double gives **300**, expected1200. Every full/mini zero-line
facing similarly gives0. Horizontal I r0,(3,18), row 19 except x3..6, gives
an empty-board single of **100**, expected900. Single/double/triple/Tetris
PC variants give 100/300/500/800 rather than 900/1500/2300/2800;
Tetris/no-clear/Tetris-PC totals **2000**, expected5200. One grouped scoring
deduction per run. Ordinary B2B/combo/pre-clear-level/drop points pass.
Every fixture repeats against served Chromium modules; real Up/Space
also repeats zero-line spins and real Space repeats the PC single.

**F2 — medium, major: six I transitions have wrong vertical signs.**
The last two offsets of **1→2,2→1,2→3,3→2,3→0,0→3** negate the correct
screen-space Y values. Every 28 canonical state still passes. With an empty
board, I r0 at **(3,18)**, real CCW fails and stays r0,(3,18); correct SRS
uses candidate4 to reach **r3,(2,16)**. I r2 at **(3,17)**, real CCW reaches
**r1,(4,15)** rather than **r1,(1,16)**. Both repeat with real Z at both
browser sizes. Independent first-fitting geometry finds **26 differences
in 672 actual rotations**; intercepted candidate lists separately pin all
six wrong transitions. These are one SRS defect.

**F3 — medium/xhigh, minor each: soft entry spends old normal time.**
O r0,(3,0); fifty16 ms updates leave800 normal ms and no fall. Set the same
soft mode as input, update1: **16 rows/16 points**. Real held Down plus1 ms
unchanged RAF agrees at both widths. Low's delivered input additionally
calls `softStep`, resetting gravityTimer: **one row/one point**, so low
receives **no soft-entry deduction**. Merely assigning low's flag would
bypass that intended handler sequence and is not a delivered-game finding.

**F4 — xhigh, minor: held soft drop bypasses lock delay.**
Fresh floor O r0,(3,18), `setSoftDrop(true);update(1)` immediately welds
**four cells**, expected0 until 500 ms of grounded time. Real Down/1 ms RAF
agrees. The grounded branch locks on `softDropping || lockTimer>=500`.
Its own test explicitly expects this. Ordinary 499/500 lock, full fifteenth
delay, natural contact and exhausted ledge all pass. This is a separate
lock-policy defect from spending the airborne gravity accumulator in F3.

**F5 — low/xhigh, minor each: restart retains a consumed bag.**
LCG seed42, eleven real hard drops to game over, then reset/real R.
The next seven actual spawns are **I,T,J,Z,Z,S,O**: six types, duplicateZ,
missingL. Both clear the queue but retain the readonly bag's old remainder.
The normal first 100 bags pass. Medium resets its bag and opens
**S,O,J,I,L,T,Z**. Browser uses actual Space/R, then clears only the stack
between seven more real Space presses; no queue entries are assigned.
This matches the earlier Terra restart-bag minor precedent.

**F6 — all three, minor each: fixed phone layout clips required state.**
At 390×844, every canvas preserves square cells but exceeds the viewport:

| Effort | Canvas x,size | Document width | Field x,size | Hold/next x | Result |
|---|---|---:|---|---|---|
| low | −85,560×640 | 475 | −65,300×600 | 255/255 |65 px of left board lost; stats end at445 |
| medium | −126,642×642 bordered | 516 |45,300×600 |−105/375 |Board fits; hold/stats and next clip |
| xhigh | −65,520×640 | 455 |−45,300×600 |285/285 |45 px of left board lost; panels end at435 |

Desktop canvas x360/319/380, field x380/490/400; all content fits.
Negative-left content cannot be recovered by ordinary rightward scrolling.
Exactly 24 O-hold/five-I-next cells paint inside each backing; preview
omission/distortion is not a second finding. Measurements are assertions,
supported by six inspected screenshots. One responsive-layout deduction
per run covers its clipped board/supporting state together.

**F7 — xhigh, minor: a legal wholly hidden lock continues.**
Stack **(2,0),(3,1),(4,1)**; real T spawn(3,−1), **CW,CCW,Left,Left**
reaches grounded **r0,(0,−2)**, four hidden cells. Incoming I at(3,−1) is
independently open and does not overlap the lock. Zero-travel hard drop
welds the hidden T, spawns I and leaves **state=playing**, expected game
over. No active pose or spin flag is injected along this path. Node and
real Chromium key replays agree. Partially visible legal locks correctly
continue. Low/medium's wholly hidden public paths correctly end play.

**F8 — xhigh, minor: PC scoring uses a different replacement table.**
Same zero-travel PC fixtures as F1 yield **2000/3000/4000/8000** instead
of benchmark additive900/1500/2300/2800. A non-PC Tetris, no-clear O and
B2B Tetris-PC total **10800**, expected5200. Single PC after the difficult
clear totals2800 instead of1700. Full/mini/B2B/combo points otherwise pass,
so these related PC variants receive one isolated minor. Real Space
repeats the 2000-point empty-board single; served engine probes repeat all.

## Runner, engine coverage and Chromium workflow

```sh
python3 .audit/run-qwen38-flash-audit.py --offline
```

The [runner](run-qwen38-flash-audit.py) makes one random disposable root,
excluding node_modules/dist/dist-test/build/.git. It performs locked install,
explicit build and unchanged own tests before the
[engine probes](qwen38-flash-audit.mjs) and
[browser assertions](qwen38-flash-browser.cjs). Omit `--offline` for uncached
packages; `--effort low|medium|xhigh` selects a run; `--engine-only`
explicitly skips browsers. `--review` waits for Enter to inspect evidence
inside that root, then deletes everything. **No retained-copy/artifact option**.
Success, failure, handled interruption and subprocess timeout clean copies,
logs/screenshots and owned process groups. SIGKILL/power loss cannot run
finally blocks.

**Node 26.0.0**, locked **TypeScript 5.9.3**, installed **Playwright 1.64.0 /
Chromium 156.0.8078.4**. No browser or root dependency install. All three
servers hard-code8321 and ignore PORT. As in recent runners, **only the
copied `const PORT = 8321` literal** changes; each original `npm start`
command, routes, MIME, module format and application bodies stay intact.
Only free **41000–49999** ports are used (41000 in these runs).

Every engine assertion repeats inside Chromium against its own served
emitted modules. Low/medium import `dist/game.js` and `pieces.js`; xhigh
imports `dist/core/`. Main responses gain appended accessors only.
RAF scheduling is captured so unchanged frame/input/render bodies can run
at precise timestamps. Canvas wrappers forward the real draw calls.
The canonical oracle is reused from the unchanged Opus effort probes;
no other implementation is built or rescored. T3 preview status/open was
checked and the owned blank incognito tab closed; the user's explicitly
requested prior-audit Playwright-library workflow was followed.

- **28 canonical states**, seven distinct colors, all-piece walls,
  **48 actual ordered non-O CW/CCW candidate lists**; medium's six
  mismatches are pinned. Concrete T/I wall/floor and extra I CCW floor
  outcomes distinguish a table finding from actual gameplay.
- **672 independent first-fitting rotations per run** on seeded stacks,
  walls, floor and hidden rows, without collision interception. Low:
 139 oracle rejections, candidate1–5 counts303/111/67/30/22, **0 differences**.
  Medium uses the same native two-row ceiling and oracle outcomes:
  **26 differences**. Xhigh permits open rows beyond its stored buffer:
  88 rejections, counts303/111/90/46/34, **0 differences**. No deduction
  is inferred merely from using a finite hidden buffer.
- **100 actual engine bags per run**, ten seeds×ten bags, clearing only
  the board between real drops. Hold restriction/retrieval/orientation
  and fresh replacement999/1000 ms phase pass. Restart F5 is separate.
- Seven independent obstructed ghost rows, blocker(4,16), expected y14,
  exact hard travel×2 points and four welded coordinates. Actual Chromium
  draws independently match all seven; complete 24-cell preview painting
  and proportional square cells pass at both sizes.
- Existing-ground499/500; successful reset and failed-wall no reset;
  fifteen resets10 ms apart, then 499 ms remains unlocked, sixteenth
  move+1 ms welds4. Natural1 ms contact lands1000/locks1500. Ordinary
  ledge stays airborne across the old deadline. Exhaust fifteen real O
  rotations1 ms apart on support(0,14), wait 490, Right: lower floor
  contact 6000/lock 6500 ms after Right, fresh 500 delay. Unchanged real-key
  RAF agrees. The990+16+483+1 landing partition stays unlocked at1490;
  no pre-contact charge is reproduced. Grounded soft differs only as F4.
- Normal1/2/3/4, real full/mini zero/single hard/timed, two-rotation full
  double, all four full/mini zero-line facings, no-rotation/manual-soft
  cancellation, B2B no-clear/break/consecutive/mini, level-two combo,
  nine-to-ten pre-clear multiplier, PC variants, level3/10 singles and
  nonadjacent 17/19 compaction. Correct ordinary scores and exact defective
  scores are both assertions, not merely printed observations.
- First-row integer boundaries L1/2/5/9/10/14/15/20:
  **1000/793/356/94/65/12/8/1 ms**, no normal-gravity points. Actual main
  callbacks agree 60/144 Hz: L2 over1480.001 ms1/1, L10 over600 ms9/9,
  L15 over100 ms14/14. Delivered normal-to-soft behavior matches F3.
- Public wholly-hidden and partly-visible paths, incoming I independently
  open, blocked spawn, terminal engine/UI guards and full real R reset.
  Low/medium hidden fixture is only stack(0,0), real T spawn(3,−2),
  Left×3; partial is stack(8,1), Right×4 then1000 ms to(7,−1).
  Xhigh paths are F7 and stack(8,1)/Right×4 for partial continuation.
- Real **Left,Right,Up,X,Z,Left Ctrl,Down,Space,C,R** at 1280×800 and
 390×844. Held movement reaches walls; latest direction wins and release
  resumes the remaining direction; repeated X rotates once; blur releases
  movement and soft drop. No unexpected application exception, console
  error or failed required asset. Harmless favicon404 is excluded.

All six full-page screenshots were visually inspected inside the disposable
root, then deleted. Horizontal bounds are exact assertions; font-sensitive
vertical positions are recorded only (canvas desktop/phone y: low66/66,
medium68.40625/78.609375, xhigh80.15625/91.8125). Viewports use the prior
desktop user agent at 390 CSS pixels, not physical mobile hardware.

## Supplied generation context — no quality effect

Facts come from the user/import record and unchanged statistics, not
provider transcripts. Medium finished its delivered game and17 tests
after **16m0.208s**, then called foreground `node scripts/serve.mjs`.
That nonreturning server blocked the turn until the harness stopped it
60 minutes later. The registry's new `interrupted` field measures time
to **2026-10-27T12:11:31.170Z**, the start of that call; token accounting
is complete because the model made no later calls. This does not turn a
playable delivery into a quality failure.

Xhigh's recorded outside-access path is OpenCode's saved copy of **its own
truncated Fandom SRS web fetch**, imported after review. This finding stays
in `benchmark-runs.json`, unchanged, without a quality penalty. No assertion
is made about unrecorded outside access. Unknown overhead/cost/request/tool
counts remain unknown.

| Effort | Tested-agent tokens | Elapsed | Source TS LOC | Own test LOC |
|---|---:|---|---:|---:|
| low |2,797,077 |18m29.858s |941 |240 |
| medium |1,274,812 |16m0.208s |868 |213 |
| xhigh |5,100,876 |31m16.524s |938 |521 |

## Limits, validation and cleanup

Focused conformance audit, not exhaustive state-space proof, long-duration
play, physical touch/HiDPI hardware, native OS repeat, every focus/multi-key
combination or other-browser certification. Representative scoring/kick
fixtures do not prove all arrangements. Own tests determine tests.

- Complete final offline runner: **passed**, all locked installs/builds,
  unchanged20/17/37 own tests, exact engine assertions and six Chromium
  viewport passes. Final `--review` pass also completed screenshot inspection.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**,420 local links/75 score rows.
- `git diff --check`: **passed**.
- `python3 -m unittest discover tests`: **passed**,70 tests, OK.

All created disposable roots, copies and evidence were removed, including
the initial wrong hidden-fixture failure path; all owned server/Chromium
groups and the blank preview tab were closed. No implementation folder,
repository scripts/tests, registry/pricing or historical score was edited.
Work stayed on main; no commit/stash/reset/revert/push. No Sites/deploy/
publish tool was used; parent owns the commit.
