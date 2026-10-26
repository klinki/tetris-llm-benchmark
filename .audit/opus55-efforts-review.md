# Claude Opus 5.5 effort audits (low, high, xhigh)

Audit date: **2026-10-26 (Europe/Rome)**. Independent review of
`claude-opus-5-5-{low,high,xhigh}` in **T3 Code / Claude Agent SDK**, fast
mode off, each implementing [`TETRIS.md`](../TETRIS.md) from the single
prompt “Read the README.md file and implement it”. This record supports
[`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).
The earlier medium run, `opus-5.5`, remains **9.05**, unchanged.

## Method and calibration

Re-read the ranking rubric, weights, Methodology, conformance/coverage
tables and `ranking.json`; the [audit index](README.md); the recent
[Terra](gpt56-terra-review.md), [GPT-5.6 Sol](gpt56-sol-review.md),
[GPT-6.1 Sol](gpt61-sol-review.md), [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md) and [October 23 Opus](oct23-review.md) records,
and their engine/browser/runner workflows, especially Terra's three scripts.
Reviewed **every delivered source/test, HTML/CSS, package, complete lockfile,
TypeScript config, ignore file, server, README and supplied statistics**.
No earlier run's defect was presumed to apply to these independent runs.
No implementation transcript or T3 thread-reading tool was used.

The existing **0–10 half-point scale**, weights **40/20/20/10/10**, and
fixed correctness deductions apply: start 10; critical −4/cap 4; major
−1.5; minor −0.5; clamp at zero. Each defect is deducted once, from
correctness. Own-test omissions determine tests; audit probes earn **no
own-test credit**. Tokens, cost, time, effort and isolation have no score effect.

Full/mini spin, B2B and combo integration pass in all three; their isolated
missing perfect-clear bonus is **one minor**, as in Muse, Sonnet medium,
Terra max and GPT-5.6 Sol medium. There is no grouped major advanced-scoring
omission to charge here. Soft discontinuity, landing-frame timing,
reset policy and presentation retain recent audits' minor severities.
High/xhigh's immediate **fifteenth** reset lock matches Qwen low's minor;
low instead allows all fifteen resets and locks on a sixteenth grounded
manipulation. That latter cap-trigger behavior is accepted, as in the
October 23 calibration. The separate newly reproduced low descent-clock
error is not attributed to the old medium run; its score/scope is preserved.

All installs/builds/tests/servers used random disposable copies, excluding
`node_modules`, `dist`, `dist-test` and `.git`. **Node 26.0.0**, locked
TypeScript **5.9.3 / 7.0.2 / 7.0.2**, installed Playwright **1.64.0** and
**Chromium 156.0.8078.4** were used. `npm ci --ignore-scripts --offline`,
explicit `npm run build` and each **unchanged `npm test`** pass. Fixtures
are seeded or fixed; no random-dependent own-test failure was found.

Each **unmodified `npm start`** builds then starts its own supplied server,
using **PORT** on a free **41000–49999** port. No server port/source patch
is needed. Servers, routing, MIME and game logic are unchanged. The T3
preview status/open capability was checked and its own incognito tab closed;
the explicitly requested Terra Playwright-library workflow was followed.
All authored work stays on `main`, with no commit/stash/reset/revert/push.
No run folder, registry, pricing, repository scripts/tests or site source
was edited. The parent owns the commit.

## Delivery and scores

| Effort | Isolated build | Unchanged own suite | Chromium |
|---|---|---|---|
| low | Pass | 11/11 cases | Starts at both sizes |
| high | Pass | 12/12 node:test cases | Starts at both sizes |
| xhigh | Pass | 16/16 cases | Starts at both sizes |

| Effort | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 7.5 | 6.0 | 9.0 | 9.0 | 8.0 | **7.70** | 5 minor |
| high | 7.5 | 7.5 | 9.0 | 8.0 | 8.5 | **7.95** | 5 minor |
| xhigh | 8.0 | 8.0 | 9.0 | 8.5 | 8.5 | **8.30** | 4 minor |

Correctness: low/high `10−5×0.5=7.5`; xhigh `10−4×0.5=8.0`.
Weighted arithmetic, in criterion order:

- Low: `7.5×.40 + 6×.20 + 9×.20 + 9×.10 + 8×.10 = 3.00+1.20+1.80+.90+.80 = 7.70`.
- High: `7.5×.40 + 7.5×.20 + 9×.20 + 8×.10 + 8.5×.10 = 3.00+1.50+1.80+.80+.85 = 7.95`.
- Xhigh: `8×.40 + 8×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 3.20+1.60+1.80+.85+.85 = 8.30`.

### Low — 7.70

Summary: **Canonical SRS and full/mini scoring; missing PC, soft-drop jump,
two contact-clock errors and clipped phone support**.

Tests **6.0**: **107 lines / 11 deterministic cases** check five complete
seeded bag-helper permutations, four-cell state counts, a four-turn rotation
number cycle, both walls, next-piece/floor presence/positive hard points,
exact legal single and Tetris points, first/restricted hold, eventual gravity
lock, two gravity-helper properties and actual stack-to-game-over/reset.
The single uses a vertical I with leftover cells, so its 100 points are a
valid non-PC assertion. The Tetris fixture empties the board but asserts
800, encoding the missing PC bonus rather than testing that bonus correctly.
There is no exact hard distance/cell-count, soft points, real kick, complete
geometry, independent ghost, post-lock held retrieval/orientation, exact
lock/contact/cap/ledge, advanced spin/B2B/combo/PC, actual gravity boundary,
level crossing, precise blocked spawn, hidden lock-out, input or browser
assertion. Breadth is comparable to Sonnet low/Haiku low's **6.0**, below
the exact drops/kicks/scoring integrations of the **7.5** suites.

Code **9.0**, simplicity **9.0**: **576 source TS lines**, readable strict
DOM-free engine, explicit geometry/kick data and one browser entry, injected
RNG, one millisecond engine clock and no runtime dependencies. The direct
three-module implementation and small methods have little machinery;
mutable state needs caller discipline. UX **8.0**: clear board/grid/outline
ghost, beveled seven colors, hold/five previews/stats, high-DPI backing,
custom DAS/ARR, pause and blur key release. It has no visible keyboard
legend, canvas labels or pointer controls. Phone clipping is charged only
to correctness.

Confirmed **minor** findings: missing PC bonus; normal-to-soft jump;
landing-frame pre-contact time; retained exhausted lock clock after descent;
clipped phone supporting state. Exact fixtures follow.

### High — 7.95

Summary: **Canonical core with exact kicks and spin/B2B tests; missing PC,
soft-drop jump, contact/reset timing and clipped phone support**.

Tests **7.5**: **171 lines / 12 deterministic cases** check ten seeded
bag-helper permutations, actual centered spawn/one-row entry/five-next
count, both exact T wall bounds, exact T CCW and I CW wall-kick outcomes,
exact hard points/two welded coordinates, integrated single and consecutive
Tetrises with exact B2B/combo points and flags, legal final-rotation full
T-spin double, first/restricted/post-lock held retrieval, grounded movement
reset and eventual lock, actual one-second gravity and L1/L2 curve helpers,
blocked hold-spawn, inert hard drop and reset. Its PC single/Tetris fixtures
expect only ordinary clear points. It lacks complete geometry, independent
obstructed ghost, soft points, mini integration/helper tables, B2B break/
no-clear continuity, correct PC variants, higher-level combo/crossing,
precise 499/500/reset-cap/ledge/contact, hidden lock-out, held orientation,
input and browser assertions. Comparable to Sonnet medium's **7.5** suite:
more exact B2B/combo/kicks, less independent ghost/level coverage; below
Opus medium's **9.0** breadth.

Code **9.0**, simplicity **8.0**: **927 source TS lines** across readable
board, bag, shapes, engine, input, renderer and main modules; strict and
unused/fallthrough/return checks, typed flat board, direct helpers,
consistent milliseconds and injected RNG. Revision-based rendering avoids
idle redraws; public state/queue requires discipline. The extra board/HUD/
message machinery is proportionate, matching similarly sized Sonnet code.
UX **8.5**: clear high-DPI board with two visible entry rows, hold/five
previews, DOM stats, full keyboard legend, clear banners, pause and blur
input cleanup, custom repeat. No canvas labels or pointer controls.
Findings are deducted only from correctness.

Confirmed **minor** findings: missing PC; normal-to-soft jump;
landing-frame pre-contact time; fifteenth-reset immediate lock;
clipped phone supporting state.

### Xhigh — 8.30

Summary: **Canonical core and stronger deterministic suite; missing PC,
contact/reset timing and a clipped phone playfield**.

Tests **8.0**: **219 lines / 16 deterministic cases** check twenty seeded
bags, twelve non-consuming peeks/deals, exact I1/I3/T1/T2 coordinates and
O invariance, exact T spawn/O column/I row, exact T/I real wall kicks,
soft rows/points, hard distance points/one floor cell/next type, grounded
wait/movement reset, reset-count behavior, first/restricted/post-lock held
retrieval, exact consecutive Tetris/B2B/combo points/messages, twelve-line
level progression, legal final-rotation full-spin double, L1/L2/L15 curve
helpers, eleven O drops to hidden lock-out and blocked spawn/inert shift.
The cap test explicitly expects immediate fifteenth-reset locking; the PC
Tetrises expect no bonus. Those assertions earn no conformance credit for
these behaviors. It lacks full shape/kick oracle, independent ghost, minis,
B2B break/no-clear continuity, correct PC, pre-clear level/higher-level combo,
actual gravity cadence, restart/pause, held orientation, ledge/contact/soft
transition, input and browser assertions. Its useful shape/soft/level/hidden
integration exceeds high; missing minis/PC/restart keeps it below Opus
medium **9.0** and Sonnet xhigh/Haiku xhigh **8.5**.

Code **9.0**, simplicity **8.5**: **794 source TS lines**, focused strict
board, shapes, source/randomizer, scoring, game, input, renderer and entry
modules; injectable piece source, clear small methods, one millisecond
clock and no runtime dependencies. Source peeks return copies; active
objects are replaced on movement. The board/state remains mutable for
fixtures. UX **8.5**: clear high-DPI board, complete proportional hold/five
previews, DOM stats, scoring animation, full keyboard legend, custom repeat,
pause and blur pause/release. No labels/pointer controls. Phone clipping
is deducted only from correctness.

Confirmed **minor** findings: missing PC; landing-frame pre-contact time;
fifteenth-reset immediate lock; clipped phone playfield/next.

## Confirmed findings and exact fixtures

All coordinates below are **visible-field coordinates**: x=0..9, y=0..19.
Native row = field y + **20**. O uses its delivered 2×2 origin; T/J/L/S/Z
use 3×3 boxes and I uses 4×4. Fixtures clear the board and clocks, preserve
actual action bodies, and assign no spin flags. Every finding is asserted
in the engine and Chromium; the latter also repeats clock findings through
the **unchanged main RAF callback**, with real keys.

1. **All three — minor: the benchmark perfect-clear bonus is absent.**
   Fill row 19 except x=3..6; place horizontal I r0 at (3,18), hard drop
   zero rows. Board empties/one line clears but score is **100**, expected
   **900**. Tetris/no-clear/Tetris-PC totals **2000**, expected **5200**;
   single PC after a previous difficult clear totals **900**, expected
   **1700**. This is one isolated scoring-feature deduction per run,
   with ordinary/full/mini/B2B/combo paths passing.

2. **Low/high — minor: starting soft drop consumes old normal time.**
   O r0 at (3,0), fifty update(16) calls accumulate 800 ms without motion.
   Enable soft drop and advance 1 ms: **16 rows / 16 points** instead of
   an ordinary initial soft step. High's setter takes `max(old,interval)`
   rather than discarding old time; low simply switches a boolean. Real
   ArrowDown plus the unchanged RAF reproduces both. Xhigh clears the
   timer and moves **1 row / 1 point**, so it receives no such deduction.

3. **All three — minor: a landing frame charges pre-contact time.**
   O r0 at (3,17), one row above the floor. Advance 990 ms in <=16 ms
   parts, then 16 ms; gravity reaches the floor at absolute 1000 ms.
   Advance 483 ms: zero locked cells at **1489 ms**. Advance 1 ms:
   four locked cells at **1490 ms**, rather than waiting until 1500 ms.
   Each update adds its whole delta to lockTimer if grounded at the end;
   the landing frame counts ten airborne milliseconds. Engine and both
   browser sizes reproduce this with ordinary frame sizes. Existing-ground
   **499/500 ms** works; natural 1 ms contact yields a related one-ms-early
   **499 ms** post-contact delay. These manifestations receive one deduction.

4. **High/xhigh — minor: the fifteenth reset forces immediate lock.**
   Floor O r0 at (3,18). Repeat fifteen times: advance 10 ms and make an
   alternating successful right/left move. Still zero welded cells at
   **150 ms** immediately after the last move; update(1) welds four at
   **151 ms**, despite the freshly reset timer. `lockResets >= 15` is an
   independent lock condition. The last allowed reset should receive its
   timer, as in Qwen low's established finding. Low remains unlocked at
   151 ms and locks only on the next grounded action; that behavior is
   accepted. Ordinary movement resets, failed-wall actions and ledge safety pass.

5. **Low — minor: reaching a lower row retains exhausted lock time.**
   O r0 at (0,12), only support (0,14). Apply **15 real CW rotations**
   (O's cells stay fixed), wait 490 ms, then move right off the ledge.
   With resets exhausted, onMoved leaves lockTimer=490; each new lower
   row clears lockResets but trackLowest never clears lockTimer. Advance
   in 1 ms parts. Floor contact is **6000 ms after the move**; welding is
   at **6009 ms**, just **9 ms** later, instead of a fresh 500 ms delay.
   Real Up ×15 / Right and the unchanged RAF reproduce this at both sizes.
   This is separate from finding 3: old **earlier-contact** time survives
   six new lowest rows, even with 1 ms steps. Ordinary pre-cap ledge moves
   stay airborne safely and later lock; no mid-air lock is claimed.

6. **All three — minor: the fixed phone cabinet clips gameplay information.**
   At **390×844**, low's 660 px canvas is centered at x=−135, document
   width **525**. Its 300×600 field at x=45 fits, but hold/stats are off
   the left and NEXT begins at x=365 with pieces extending past 390.
   High's document is **495**; board 300×600 at x=45 fits, but hold
   x=−94,width=110 and next x=376,width=110 clip supporting state.
   Xhigh's document is **684**, board **300×600 at x=192** ends at 492,
   and next starts at **527**: playfield/next are clipped. One layout
   deduction per run, matching the earlier phone-layout calibration.

## Reproducible engine and browser coverage

```sh
python3 .audit/run-opus55-efforts-audit.py --offline
```

Omit `--offline` if locked packages are not cached. The
[runner](run-opus55-efforts-audit.py) explicitly builds and runs unchanged
own suites, [engine assertions](opus55-efforts-audit.mjs), then
[Chromium assertions](opus55-efforts-browser.cjs). Passing means all exact
recorded conforming **and defective** outcomes reproduce. `--engine-only`
explicitly skips browser evidence; `--effort` selects one run;
`--artifacts-dir` may retain screenshots/JSON/engine logs **outside** the
checkout. Installed Playwright/Chromium is reused without a browser download.

The factory and deterministic probes import emitted modules directly and
also run inside real Chromium against the served emitted modules. Private
properties are used only for deterministic fixtures, observation and
rejected kick-candidate capture; no rule method is repaired. Main responses
gain appended accessors, RAF scheduling is captured, and main/input/renderer
bodies remain intact. Every recorded engine finding therefore repeats in
Chromium; real keys separately establish UI integration and real frame timing.

Coverage includes **28 canonical states**, one fixed O-origin translation,
**48 ordered non-O CW/CCW kick sequences**, actual T/I wall and floor kicks,
seven colors, all-piece walls, **100 actual engine bags** per run, hold
restriction/post-lock retrieval/orientation, fresh bags after real game over,
seven independently obstructed ghosts with exact hard points/four welded
cells, 499/500 delay, natural contact, successful/failed resets, fifteen-cap
and ordinary ledge safety. Reset/terminal engine guards pass.

Scoring covers zero-travel single/double/triple/Tetris **100/300/500/800**;
legal final-rotation full zero/single **400/800** and mini **100/200** through
both hard and timed locks; real two-rotation full double **1200**; no-rotation
corner lock **0**; manual soft movement cancels rotation credit; mini after
B2B **1100** total; B2B across no-clear **2000**, ordinary break **2150**,
consecutive Tetrises **2050**, level-two combo single **300**, nine-to-ten
crossing **100**. PC outcomes remain the finding above. No new profile is added.

Actual first-row boundaries at levels **1,2,5,9,10,14,15,20** are
**1000/793/356/94/65/12/8/1 ms**, with no ordinary-gravity points.
Unchanged engine/main callbacks agree at **60/144 Hz** for level-two
1480.001 ms (1/1 row), level-ten 600 ms (9/9) and level-fifteen 100 ms
(14/14). Held replacement waits a fresh **1000 ms** in every run.

Public-action hidden-lock fixture: stack **(2,0),(3,1),(4,1)**, real T spawn
at (3,−1), then **CW, CCW, Left, Left**, reaching grounded T r0 at (0,−2)
wholly hidden. Incoming I is independently open; zero-travel hard drop
correctly ends all three. Separate partial fixture: stack **(8,1)**,
actual T spawn then **Right ×4**, reaching r0,(7,−1) with one hidden/three
visible cells; hard drop correctly continues. No active pose or spin flag
is injected in these paths, only stack cells and the actual spawn call.

The task's [Fandom guideline link](https://tetris.fandom.com/wiki/Tetris_Guideline)
returned **402 Payment Required**. The established benchmark oracle and its
[SRS](https://tetris.wiki/Super_Rotation_System) and
[scoring](https://tetris.wiki/Scoring) references were rechecked. Additive PC
is the existing benchmark convention, not a universal rule for every Tetris game.

## Chromium evidence

Installed **Chromium 156.0.8078.4**, **1280×800** and **390×844**; all six
full-page screenshots visually inspected outside the checkout. Real keys
**Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** assert displacement,
each rotation binding, soft rows/points, four locked hard-drop cells and
hold restriction. A 50 ms held Down produces low **1** and high/xhigh **2**
rows/points (the latter include an immediate entry step). Real Space blocks
incoming T; terminal movement/rotation/drop/hold are inert; **real R**
resets board/hold/score/lines/level and hold availability. Xhigh's R creates
a fresh Game, and the accessors follow it. High/xhigh overlays are
**none → flex → none**. Low paints terminal/pause messages into its canvas.

Actual draw calls match **all seven independent obstructed ghost poses**.
Forced O hold/five-I next previews paint four/twenty complete square cells,
with no off-backing draws in high/xhigh; low's combined-canvas previews are
visually complete on desktop. High preview aspect is 1; xhigh is within
0.00013 of 1 at both widths. No distorted-preview finding is made.

| Effort | Desktop field | Phone document width | Phone field | Phone support |
|---|---|---:|---|---|
| low | 300×600 at x=490 | 525 | 300×600 at x=45 | Hold/stats off left; NEXT label x=365 |
| high | 300×600 at x=490, inside 300×660 canvas | 495 | 300×600 at x=45 | Hold x=−94,w=110; next x=376,w=110 |
| xhigh | 300×600 at x=490 | 684 | 300×600 at x=192 | Hold x=33,w=124; next x=527,w=124 |

Exact horizontal geometry is pinned within **0.03 px**; font-sensitive
vertical positions are recorded rather than treated as invariants. No
application exceptions, console errors or failed required assets occurred.
Harmless missing favicons are excluded as before. Pointer/touch controls
are absent; mobile checks concern CSS viewport and real keyboard behavior.

## Supplied generation and isolation context (no score effect)

The parent supplied **no access outside the workspace for all three**.
Those facts were recorded without rescanning provider transcripts. Statistics
were read unchanged; overhead/model-request/tool counts/cost remain
unverified, not zero. Fast mode is off in every run.

| Effort | Native Claude SDK session | T3 thread | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `b67041fc-02f7-44d2-84e6-c21118dbfcc8` | `mcp:8f007615-e453-4262-b981-9f58098dc5f7` | 249,765 | 2m 0.334s |
| high | `9d577128-1d04-439a-9580-5620902928fe` | `mcp:6c26e1a3-818d-48cc-afc3-a611cf999582` | 1,662,260 | 6m 51.314s |
| xhigh | `9e31c574-ffc1-42e9-917c-7fbbe16b7fce` | `mcp:2b95daa1-22c7-40db-8c70-6cb6b06848f2` | 3,003,974 | 43m 10.192s |

## Limits and validation

Focused conformance audit, not exhaustive state-space proof, long-duration
play, physical touch/HiDPI hardware, native OS repeat or another-browser
certification. Representative full/mini/B2B/combo/PC paths are exercised;
all possible spin/kick/clear arrangements and multi-key/focus combinations
remain unverified. The same reference fixtures are used; no suspected
issue is scored without an exact engine/browser assertion. Supplied
isolation facts were recorded, not reconstructed. No old score changed.

Final required checks after recording/regeneration:

- `python3 .audit/run-opus55-efforts-audit.py --offline`: **passed**, all
  three fresh installs/builds/own suites, complete engine assertions and
  six Chromium viewport passes, including every recorded finding.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `python3 -m unittest discover tests`: **passed**, 65 tests, OK.
- `node .audit/verify-ranking.mjs`: **passed**.
- `git diff --check`: **passed**.

All 59 historical ranking entries are unchanged as parsed data, including
`opus-5.5` at 9.05. Only three new score entries were added. Servers,
browsers, disposable copies and retained screenshots/logs were cleaned.
No implementation folder, scripts/tests, registry or pricing edits; no
commit/stash/reset/revert/push. The parent commits.
