# GPT-6.1 Terra audits (six efforts)

Audit date: **2026-10-26 (Europe/Rome)**. Independent review of the first
six **OpenAI `gpt-6.1-terra`** runs, **T3 Code / Codex, standard service
tier**, on `main`: `gpt-6.1-terra-{low,medium,high,xhigh,max,ultra}`.
Every run used “Read the README.md file and implement it”; the common
specification is [`TETRIS.md`](../TETRIS.md).

## Method and calibration

Re-read `RANKING.md`'s rubric, weights, Methodology, conformance and coverage
tables, `ranking.json`, the [audit index](README.md), and the recent
[Beam](beam-efforts-review.md), [MiMo](mimo-v26-flash-review.md),
[Opus effort](opus55-efforts-review.md), [GPT-6.1 Sol](gpt61-sol-review.md)
and [GPT-5.6 Terra](gpt56-terra-review.md) records and probe/browser/runner
workflows. Reviewed **every delivered source/test, HTML/CSS, package,
complete lockfile/config, ignore file, server, README and statistics file**.
No implementation transcript or T3 thread-reading tool was used.

The same **0–10 half-point scale**, weights **40/20/20/10/10**, applies.
Correctness starts at 10: critical −4 and cap 4; major −1.5; minor −0.5;
clamp at zero. Each defect is deducted **once, from correctness only**.
Own-test omissions affect tests; these audit probes earn no own-test credit.
Usage, cost, elapsed time, effort, multi-agent use and isolation facts have
no quality-score effect. All 65 historical ranking entries are unchanged,
including GPT-5.6 Terra and GPT-6.1 Sol.

Full-spin/B2B/combo integration works in all six. Low's isolated mini and
PC omissions remain two minors, as in Terra max/Sol medium; the several PC
fixtures are one omission, not multiple deductions. Medium's PC omission
and false spin after manual descent are separate narrow scoring defects,
matching prior isolated-PC and stale-spin minors. No broad missing-full-spin
major applies. Landing-frame, exhausted-contact, refresh remainder, partial
lock-out, terminal engine guards, preview aspect and focused-button findings
retain the existing minor calibration. Accepted 16 ms fast-gravity floors
are not scored as errors. Low's 0.994 phone board aspect and xhigh's 1.007
preview aspect are subpixel/border rounding, not the visible stretching
charged to medium/max.

## Delivery and scores

| Effort | Locked install/build | Unchanged own workflow | Chromium |
|---|---|---|---|
| low | Pass | Behavioral smoke, 9 assertions | Starts at both sizes |
| medium | Pass | Behavioral smoke, 12 assertions | Starts at both sizes |
| high | Pass | 8/8 node:test cases | Starts at both sizes |
| xhigh | Pass | 7/7 node:test cases | Starts at both sizes |
| max | Pass | 10/10 node:test cases | Starts at both sizes |
| ultra | Pass | 8/8 node:test cases | Starts at both sizes |

| Effort | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 8.0 | 5.0 | 7.0 | 9.0 | 8.0 | **7.30** | 4 minor |
| medium | 7.0 | 5.0 | 7.0 | 8.5 | 8.5 | **6.90** | 6 minor |
| high | 8.5 | 6.5 | 7.5 | 9.0 | 8.0 | **7.90** | 3 minor |
| xhigh | 8.5 | 6.5 | 9.0 | 9.0 | 8.5 | **8.25** | 3 minor |
| max | 9.0 | 8.5 | 9.0 | 8.5 | 9.0 | **8.85** | 2 minor |
| ultra | 9.5 | 6.5 | 9.0 | 9.0 | 8.5 | **8.65** | 1 minor |

Correctness, respectively: `10−4×.5=8`, `10−6×.5=7`, `10−3×.5=8.5`,
`10−3×.5=8.5`, `10−2×.5=9`, `10−.5=9.5`.
Weighted arithmetic in criterion order:

- Low: `8×.40 + 5×.20 + 7×.20 + 9×.10 + 8×.10 = 3.20+1.00+1.40+.90+.80 = 7.30`.
- Medium: `7×.40 + 5×.20 + 7×.20 + 8.5×.10 + 8.5×.10 = 2.80+1.00+1.40+.85+.85 = 6.90`.
- High: `8.5×.40 + 6.5×.20 + 7.5×.20 + 9×.10 + 8×.10 = 3.40+1.30+1.50+.90+.80 = 7.90`.
- Xhigh: `8.5×.40 + 6.5×.20 + 9×.20 + 9×.10 + 8.5×.10 = 3.40+1.30+1.80+.90+.85 = 8.25`.
- Max: `9×.40 + 8.5×.20 + 9×.20 + 8.5×.10 + 9×.10 = 3.60+1.70+1.80+.85+.90 = 8.85`.
- Ultra: `9.5×.40 + 6.5×.20 + 9×.20 + 9×.10 + 8.5×.10 = 3.80+1.30+1.80+.90+.85 = 8.65`.

## Per-run rationale and own-suite coverage

### Low — 7.30

Summary: **Canonical SRS and basic modern scoring; mini/PC omissions,
early landing lock and premature partial lock-out; compressed source**.

Tests **5.0**: the two-line fixed-random smoke script's nine assertions
check an opening seven-bag, exact left movement, changed CW rotation number,
held type/hold restriction, any welded hard-drop cell and positive points,
and a legal integrated single's exact line count/score≥100. No real kick,
wall bound, exact drop distance/points/cell count, independent ghost,
post-lock held retrieval/orientation, lock/gravity clock, advanced scoring,
level, blocked spawn, reset outcome or browser assertion exists. Narrow
behavioral coverage fits the 4.5–5.5 smoke calibration; compilation adds no
gameplay-test credit.

Code **7.0**, simplicity **9.0**: **42 source TS lines**, strict, DOM-free
engine, typed shapes and injected RNG, with a direct entry and tiny own
CommonJS bundler in the server. Extremely long methods/render/input lines
impede maintenance, matching compressed Sol low's 7.0. Direct helpers and
little abstraction keep the design simple. UX **8.0**: readable colored
board/grid/translucent ghost, hold/three next canvases, DOM stats, complete
desktop legend, labeled board and blur key release. Native horizontal
repeat, timed soft drop, no touch controls, pause or high-DPI adaptation.
All panels fit both widths. Four confirmed minors are fixtures 1–4 below.

### Medium — 6.90

Summary: **Canonical SRS/full-mini scoring; missing PC, stale spin credit,
landing/refresh clocks, terminal engine mutation and stretched previews**.

Tests **5.0**: **8 lines / 12 assertions**, mostly fixed-random: opening
bag/four active cells, first/restricted hold, exact hard-drop distance points
and four welded cells, legal single's exact lines/100 points, and CW/CCW
rotation success/numbers. The one random T rotation is order-independent.
No wall/real kick, obstructed ghost, post-lock retrieval/orientation,
clock/cap/ledge, advanced scoring, gravity/level, top-out/reset/input/browser
assertion exists. Exact drops strengthen the narrow smoke; missing rule
coverage keeps it at 5.0. It executes the engine, unlike predecessor Terra
medium's text-only 1.5 suite.

Code **7.0**, simplicity **8.5**: **68 source TS lines**, typed DOM-free
engine with RNG injection, but highly compressed multi-action methods and a
large one-line renderer; gravity, contact/reset and pause state live in main.
This split requires callers to coordinate engine actions and timers. UX
**8.5**: polished labeled grid/outline ghost, hold/three next, DOM stats and
progress, full desktop legend, pause/overlay and seven phone buttons.
Native key repeat, fixed backings and no blur cleanup/custom DAS. Six minors
are fixtures 2, 3 and 5–8; preview distortion is charged only to correctness.

### High — 7.90

Summary: **Canonical SRS/full-mini core and precise grounded smoke tests;
missing PC, landing-clock error and premature partial lock-out**.

Tests **6.5**: **12 lines / 8 cases** cover two real bags, restricted and
post-lock held retrieval, exact hard distance/points/four cells, exact
nine-to-ten line/level crossing, a real T CCW wall kick at exact x=0,
ghost legality/collision below, blocked spawn/restart and 499/500 ms lock.
Ghost expectations share engine collision; no obstructed independent row.
Its empty-board line fixture expects 100, not the PC bonus, so earns no PC
credit. No soft point, mini/full spin/B2B/combo/PC integration, I/floor kick,
complete geometry, movement reset/cap/contact/ledge, actual gravity curve,
hidden/partial path, held orientation or input/browser coverage. Breadth
matches the basic 6.5 suites, below Sol low's additional cap/B2B coverage.

Code **7.5**, simplicity **9.0**: **82 source TS lines**, clear types,
comments, injected RNG and an engine-owned millisecond clock; still long
compressed methods and a 12-line whole UI. More readable declaration/rule
boundaries than low, below formatted 9.0 engines. UX **8.0**: clear board,
grid/outline ghost, labeled supporting previews, five next pieces, stats,
legend and New game/Play again. No pause, touch UI, custom repeat, high-DPI
or blur cleanup. Three minors are fixtures 2–4.

### Xhigh — 8.25

Summary: **Readable canonical core and complete PC scoring; stale manual
spin credit, soft-entry jump and premature landing clock**.

Tests **6.5**: **51 lines / 7 cases**, two fixed-random real bags,
left-wall restriction and ghost legality/collision below, exact ghost-derived
hard points/locked presence, first/restricted/post-lock held retrieval,
real T CCW wall kick with exact x, exact PC single and ten-line crossing,
blocked spawn/restart, and four unique cells in all 28 states. Counting cells
is not a canonical oracle. No soft points, exact welded count, independent
obstructed ghost, clock/reset/cap/ledge, spin/B2B/combo/PC variants, actual
gravity cadence, held orientation or input/browser assertions. Similar breadth
to high: correct PC and cell-count breadth, less exact lock/drop checking.

Code **9.0**, simplicity **9.0**: **291 source TS lines**, two readable
strict modules, generated canonical rotations, explicit kick data, RNG
injection, one millisecond engine clock and small direct helpers. Public
mutable state needs discipline; the design is proportionate. UX **8.5**:
responsive labeled board/hold/five individually sized next canvases, grid,
ghost, stats/progress/clear messages, pause/blur pause and seven labeled
phone buttons. Native horizontal repeat, timed held Down, no high-DPI
adaptation. Three minors are fixtures 3, 5 and 9.

### Max — 8.85

Summary: **Broad deterministic suite and event-ordered gravity; exhausted
ledge retains old lock time and the desktop queue is stretched**.

Tests **8.5**: **163 lines / 10 seeded cases** check three actual bags and
queue length, exact T CW/I CCW wall kicks/O invariance, held spawn orientation
and position/restriction/retrieval, independent empty-floor O ghost row,
soft/hard exact points/distance and floor cell, 499/500 delay/reset/fifteen
cap behavior, exact natural contact then fresh 500 ms delay, integrated
Tetris/B2B/combo/B2B-PC and pre-clear level, legal final-rotation full/mini
zero-line scores/labels, blocked hold-spawn/hidden lock-out, pause guards,
actual one-second gravity and restart. Hidden lock-out sets an O pose
directly; it is not a public-action replay. No full/mini single/double,
B2B no-clear continuity/break, level-two combo, complete state/kick oracle,
independent obstructed ghost, exhausted ledge, soft transition, gravity curve,
real input or browser test. Comparable to Sol medium's 8.5, below Sol
high/Opus medium's 9.0 and Sol xhigh's 9.5 broader integration/input coverage.

Code **9.0**, simplicity **8.5**: **550 source TS lines**, readable strict
DOM-free engine, explicit types/shapes/kicks, injected RNG, event-ordered
gravity/contact clock and a direct entry with cached stats/previews and
clear events. Held-key/pointer repeat, status and event bookkeeping are
proportionate but larger than the two compact formatted entries. UX **9.0**:
polished labeled board/grid/ghost/hold/five-next, clear/status overlays,
keyboard legend, personal best, DOM stats and mobile stats, custom DAS/soft
repeat, pointer repeats, focus styling, blur release/visibility pause.
No high-DPI adaptation. Two minors are fixtures 10–11.

### Ultra — 8.65

Summary: **Canonical engine passes the audited rules; narrower own suite,
responsive UI and a clicked Pause button capturing Space**.

Tests **6.5**: **95 lines / 8 cases**, fixed opening two bags, real T CCW
wall kick with exact x, first/restricted/post-lock hold, independent
obstructed O ghost row with exact 34 hard points and welded cells,
499/500 delay, exact legal non-PC single/row-shift, wholly hidden lock-out/
reset and blocked incoming O with active=null. No soft points, held
orientation, reset/cap/contact/ledge, advanced spin/B2B/combo/PC integration,
level/actual gravity, full geometry/I/floor kicks or input/browser assertion.
Bag sampling is initial queue state rather than repeated play. Breadth is
comparable to high's 6.5, below max's broader 8.5; tested-agent subagents
supply no own-test credit by themselves.

Code **9.0**, simplicity **9.0**: **425 source TS lines**, readable strict
engine/entry, explicit screen-space kicks, injected RNG, separate visible/
hidden rows and an event-ordered clock, without dependencies or extra layers.
UX **8.5**: strong typography and responsive labeled board/hold/three-next,
grid/outline ghost, complete desktop legend, stats, pause/blur pause,
repeating pointer buttons. Native keyboard repeat, fixed backings; mobile
legend is hidden but action buttons remain. The only confirmed minor is
fixture 12. No confirmed engine bug in the audited scope means no failure
was found by these probes, not proven bug freedom.

## Confirmed findings and exact fixtures

Coordinates are **visible-field x=0..9, y=0..19**; negative y is hidden.
Medium native row/pose y = field y+2. Xhigh/max board row = field y+20;
low/high allocate visible rows only; ultra stores a separate 20-row hidden
array. O uses canonical cells x+1/x+2, unlike the cropped O in some earlier
audits. Fixtures assign no spin flags and change no rule/input/render body.
Every engine finding repeats inside Chromium at both widths against served
emitted modules; real keyboard/RAF additionally checks the timing/hidden paths.

1. **Low — minor: minis receive full-spin scores.** T r3,(3,17), stack
   (5,17),(3,19),(5,19), actual CW into r0,(3,17), then zero-travel hard
   drop or 500 ms timed lock: **400**, expected **100**. Fill row18 outside
   x=3..5 for a mini single: **800**, expected **200**. Low has a binary
   three-corner classifier. Full zero/single/double and B2B/combo pass.

2. **Low/medium/high — minor each: benchmark PC bonuses are absent.**
   Bottom row19 except x=3..6; horizontal I r0,(3,18); zero-distance hard
   drop empties the board but scores **100**, expected **900**. Tetris,
   no-clear O, Tetris PC totals **2000**, expected **5200**. This is one
   omission per run, not one deduction per bonus variant.

3. **Low/medium/high/xhigh — minor each: landing frame counts airborne time.**
   O r0,(3,17), advance 990 in ≤16 ms parts, then 16, then 483: no weld at
   **1489 ms**; another1 welds four at **1490**, instead of 1500. The whole
   landing-frame delta is charged to contact. Medium uses its actual main
   frame and act/reset handling in both Node VM and Chromium; it is not
   judged by engine-only movement that bypasses main's clock reset. Max/
   ultra stay unlocked at 1490. Existing-ground499/500 and cap/reset pass.

4. **Low/high — minor each: a partly visible legal lock ends the game.**
   Low: stack **(1,2),(3,0),(9,3),(8,1),(1,3),(2,3)**; actual T spawn at
   (3,0); **CW,CW,Left,CCW,CCW,Left,CW,CW,Right** reaches r2,(1,−2),
   three hidden cells/one visible. Incoming I at(3,0) is independently open.
   High: stack **(7,1),(8,1)**, actual T spawn(3,−1), **Right×4** reaches
   r0,(7,−1), one hidden/three visible, incoming I(3,−1) open. Both are
   grounded, hard travel zero, yet **over=true**. Both lock methods reject
   any hidden cell. Whole-hidden lock-out correctly ends all six.

5. **Medium/xhigh — minor each: successful manual descent retains spin credit.**
   Stack **(0,17),(0,19),(2,19)**, T r0,(0,3); real CW, then successful
   manual soft drops until grounded T r1,(0,17), no further rotation.
   Zero-travel hard drop awards **100 extra mini points**, expected **0**.
   Same corner pose without rotation credit scores 0. Medium's move only
   clears lastRotation for horizontal movement; xhigh's stepDown never
   clears it. The remaining spin tables pass.

6. **Medium — minor: discarded remainder changes falling with refresh rate.**
   O r0,(3,0), level 10, **600 ms** using unchanged callbacks: **9 rows at
   60 Hz / 8 at 144 Hz**. At level 15 over100.001 ms: **6/5**. Main zeroes
   fall after one row instead of spending the remainder. First-row curve
   boundaries themselves pass, including the accepted16 ms floor.

7. **Medium — minor: public hardDrop mutates after game over.** Block just
   T spawn cell field **(4,−2)**, outgoing floor O r0,(0,18), incoming T.
   Actual first hard drop ends the game. Direct engine hardDrop again
   moves the blocked T to its ghost and adds exactly **40 points** while
   over remains true; lock() returns early. Actual browser terminal keys
   are inert because act guards them; this distinction follows prior
   exported-engine guard findings. The browser repeats the direct call.

8. **Medium — minor: hold/next previews stretch non-uniformly.** Desktop
   next120×70 backings display at 110×70 (cell aspect **0.916667**). At390 px,
   hold120×84 displays60×60 (aspect **0.7**) and each next120×70 displays
   52×55 (**0.551515**). Squares become visibly tall. Backing painting is
   complete and every canvas fits horizontally; one preview-aspect deduction.

9. **Xhigh — minor: entering held soft drop consumes old normal time.**
   O r0,(3,0),800 normal ms in≤16 ms parts, real Down and next1 ms frame:
   **17 rows/17 points**. One row is the immediate Down action;16 spend
   old time at the new50 ms interval. Other five move/score one row in this
   transition; none receives a soft-jump deduction.

10. **Max — minor: exhausted contact time survives six new lower rows.**
    O r0,(−1,12) rests on only **(0,14)**. Fifteen actual CW rotations
    exhaust resets; wait 490 ms; real Right leaves support. Drive1 ms frames.
    Floor contact occurs **6000 ms after the move**; weld at **6010**, just
    **10 ms** after contact, instead of 500. lockElapsed490 survives airborne
    downward movement. Ordinary pre-cap ledge safety and precise natural
    contact pass. Unlike finding3 this persists with1 ms steps and carries
    old **previous-contact** time over six lower rows.

11. **Max — minor: desktop next preview is vertically compressed.** At
    1280×800, next128×240 backing displays **128×210**, cell aspect
    **1.142857**. The short-desktop media rule changes height alone. Hold
    and phone previews are proportional; all24 preview cells paint fully
    inside their backings. Same preview-aspect severity as Sol medium.

12. **Ultra — minor: clicked Pause keeps Space.** Fresh T r0,(3,5), click
    Pause twice to return to play, then real Space. Active pose and score
    remain unchanged, welded count remains0, focused element is **#pause**,
    overlay becomes **display:flex**: native Space pauses again. The handler
    explicitly leaves Space to focused buttons. Medium/xhigh hard-drop after
    the same clicks; max blurs mouse-clicked buttons and hard-drops. Same
    severity as GPT-6.1 Sol xhigh's focused header controls.

## Probe and browser workflow

```sh
python3 .audit/run-gpt61-terra-audit.py --offline
```

The [runner](run-gpt61-terra-audit.py) runs locked install, explicit build,
unchanged own tests, [engine assertions](gpt61-terra-audit.mjs), then
[Chromium assertions](gpt61-terra-browser.cjs) in random disposable copies,
excluding node_modules/dist/dist-test/.git. Omit `--offline` for uncached
packages. `--effort` selects one; `--engine-only` explicitly skips browser
checks. Optional `--review` waits for Enter with screenshots/logs still in
that same temporary root, then deletes it; no retained-copy option exists.

**Node 26.0.0**, all six locked **TypeScript 5.9.3**, installed
**Playwright 1.64.0 / Chromium 156.0.8078.4**; no browser download. Each
**unchanged npm start command** uses its own authored server/bundling/routes/
MIME. All six servers hard-code8321 and ignore PORT; only that listen literal
is adapted in each disposable server, as in earlier runners. PORT then uses
a free **41000–49999** port. The original folders are never built or served.

Low's supplied server wraps unchanged CommonJS bodies in its own bundle;
the response gains accessors in the existing inner scope. Other main
responses gain appended accessors. RAF scheduling is captured to call the
unchanged frame body at exact timestamps. Medium's main-owned clock runs
in a no-op DOM VM for Node and through its actual served entry in Chromium,
using actual act so successful resets/hold/drop update main's clocks. No
application rule, event handler, rendering method, module format or route
is repaired. The independent canonical oracle is imported from the unchanged
Opus effort probes; no prior run is rescored or rebuilt by these scripts.

Coverage includes all **28 canonical states / 48 ordered non-O CW/CCW
candidate sequences**, concrete T/I wall/floor kicks, all-piece walls,
**100 actual bags per run**, hold restriction/post-lock retrieval/spawn
orientation, fresh restart bags, seven independent obstructed ghosts with
exact drop points/four welded coordinates, blocked soft safety,499/500,
successful/failed resets, fifteen-cap, ordinary/exhausted ledges and landing
partitions. Scoring includes normal1/2/3/4, legal full/mini zero/single via
hard/timed lock, full double via two real rotations, no-rotation and manual
spin cancellation, B2B no-clear continuity/break/consecutive chains, level-two
combo, nine-to-ten crossing, singlePC and B2B TetrisPC. No spin flag is injected.

First-row integer boundaries at levels 1/2/5/9/10/14/15/20 are
**1000/793/356/94/65/16/16/16** for low/medium/xhigh, and
**1000/793/356/94/65/12/8/1** for high/max/ultra. No gravity points.
60/144 Hz callbacks agree except medium's recorded differences. Every held
replacement gets a fresh1000 ms phase; Node checks999/1000, browser checks
no early fall after 200 ms. Public-action whole-hidden fixtures top out in
all six with incoming I independently open; partial fixtures continue in
medium/xhigh/max/ultra and fail in low/high. Full reset/terminal UI guards
pass. These are exact assertions of conforming **and defective** outcomes.

Chromium uses **1280×800** and **390×844**, real required
**Left,Right,Up,X,Z,Left Ctrl,Down,Space,C,R**. State, every ghost drawing,
complete O hold/I next painting, preview aspect, overlay, horizontal fit,
focus, real hidden-action paths and unchanged clock outcomes are asserted.
The three-next implementations meet the task, which sets no queue count.

| Effort | Desktop board | Phone board | Phone document width | Preview/focus result |
|---|---|---|---:|---|
| low | 300×600,x491 | 176×354,x107 | 390 | Complete proportional previews |
| medium | 296×592,x492 | 188×376,x101 | 390 | Stretched hold/next; complete backings |
| high | 298×596,x491 | 192×384,x99 | 390 | Five complete square previews |
| xhigh | 233×466,x523.5 | 192×384,x99 | 390 | Five complete previews; <1% rounding |
| max | 273×546,x503.5 | 208.390625×416.78125,x90.796875 | 390 | Desktop next aspect1.142857; phone proportional |
| ultra | 242×484,x813.453125 | 230×460,x28.5 | 390 | Three square previews; clicked Pause captures Space |

Horizontal board geometry is pinned within .03 px. Font-sensitive vertical
positions are recorded, not treated as invariants. All 12 full-page
screenshots were visually inspected outside the checkout and deleted.
No application exception, unexpected console error or failed required asset
occurred. External Google Fonts/favicon noise is excluded as before. T3
preview status/open was checked and its owned incognito tab closed; the
explicitly requested prior-audit Playwright-library workflow is used.

## Supplied generation/isolation context — no score effect

Facts below come from the user/import record and unchanged statistics,
not a transcript reconstruction. All are standard-tier Codex runs.

- Ultra is Codex's multi-agent mode. Its tested agent started
  **/root/inspect_requirements, /root/inspect_testing, /root/ui**; all three
  subagents' tokens are included in registry `t3_subagents` usage. Audit work
  itself did not delegate or read those conversations.
- Xhigh checked for parent-folder AGENTS.md files; none exist and none was
  read. Max read built-in Codex Sites skill documentation, with **no Sites
  or deploy calls**. Both were imported after review; their recorded
  isolation findings remain unchanged in benchmark-runs.json.
- Low/medium/high/xhigh/ultra statistics record excluded background-command
  notification turns. The first implementation turn's delivered files are
  audited. Unknown overhead/cost/model-request/tool counts remain unknown.
- No Sites, deployment or publishing tool was used during this audit.

| Effort | Tested-agent tokens | Elapsed | Source TS LOC | Own test LOC |
|---|---:|---|---:|---:|
| low | 186,465 | 56.483s | 42 | 2 |
| medium | 392,853 | 1m21.624s | 68 | 8 |
| high | 332,921 | 1m8.663s | 82 | 12 |
| xhigh | 902,742 | 2m2.686s | 291 | 51 |
| max | 1,988,500 | 4m55.516s | 550 | 163 |
| ultra | 3,121,857 | 2m1.850s | 425 | 95 |

## Limits and validation

Focused conformance audit, not exhaustive state-space proof, long-duration
play, physical touch/HiDPI hardware, native OS repeat, every multi-key/focus
combination or other-browser certification. Representative scoring/kick
fixtures do not prove every arrangement. Isolation/usage records were read
unchanged and not re-accounted. Test score describes delivered own tests,
not the audit's added coverage. No historical score changed.

Validation after recording/regeneration:

- Complete offline six-run runner: **passed**, all locked installs/builds,
  unchanged own workflows, exact engine findings and 12 Chromium viewport passes.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `python3 -m unittest discover tests`: **passed**, 69 tests, OK.
- `node .audit/verify-ranking.mjs` and `git diff --check`: **passed**.

Disposable roots (including exploratory failure paths), screenshots/logs,
owned server groups and Chromium sessions were deleted/closed. No original
implementation, repository scripts/tests, registry or pricing edits. Work
stayed on main; no commit, stash, reset, revert or push. Parent owns the commit.
