# MiMo-V2.6-Flash default audit

Audit date: **2026-10-26 (Europe/Rome)**. First MiMo run:
`mimo-v2.6-flash-default`, Xiaomi **`opencode-go/mimo-v2.6-flash`**,
**T3 Code / OpenCode**, from “Read the README.md file and implement it”,
implementing [`TETRIS.md`](../TETRIS.md). The model exposes no reasoning
options; the recorded variant is **default**, not a measured reasoning
budget. This supports [`ranking.json`](../ranking.json) and
[`RANKING.md`](../RANKING.md).

## Method and calibration

Re-read the ranking rubric, weights, Methodology and conformance/coverage
tables, ranking data, [audit index](README.md), recent
[Opus efforts](opus55-efforts-review.md), [Terra](gpt56-terra-review.md),
[GPT-5.6 Sol](gpt56-sol-review.md) and [October](october-review.md) records
and their runner/probe/browser workflows. Reviewed all ten source modules,
the complete own smoke suite, HTML/CSS, package/complete lockfile/config,
server, ignore file, README and statistics. No implementation transcript
or T3 thread-reading tool was used.

Same **0–10 half-point scale**, **40/20/20/10/10** weights; correctness
starts at 10, critical −4/cap 4, major −1.5, minor −0.5, clamp at zero.
Each defect is deducted once, from correctness. Own-suite omissions
determine tests; audit probes earn no own-test credit. Usage, time, cost,
variant and isolation have no quality-score effect. Related missing
zero-line spin/underpaid mini/incorrect PC scoring is **one grouped major**,
as in the incomplete full/mini/PC scoring audits. Soft transition and
presentation use established minor severities.

The task's [Fandom guideline link](https://tetris.fandom.com/wiki/Tetris_Guideline)
returned **402 Payment Required**. The same benchmark oracle and its
[SRS](https://tetris.wiki/Super_Rotation_System) and
[scoring](https://tetris.wiki/Scoring) references were rechecked. Additive
PC is the existing benchmark convention, not a universal licensed-game rule.
The **1/60-second terminal gravity floor** is accepted, as in GPT-5.6 Sol
high; it is not the much slower 45/50 ms floor charged in earlier audits.

## Delivery, scores and rationale

Fresh-copy locked install, explicit build and unchanged `npm test` **pass**;
own suite reports **76 passed, 0 failed**. Unmodified `npm start` with PORT
builds and serves the game. Chromium starts at both required sizes.

| Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 7.0 | 7.5 | 9.0 | 8.5 | 8.5 | **7.80** | 1 major, 3 minor |

Correctness: `10−1.5−3×.5=7.0`.
Weighted: `7×.40 + 7.5×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 2.80+1.50+1.80+.85+.85 = 7.80`.

Summary: **Canonical SRS and broad smoke coverage; incomplete spin/PC
scoring, a soft-drop jump and clipped phone/advanced-stat presentation**.

Tests **7.5**: **385 lines / 76 reported assertions** check ten seeded
helper bags, actual centered/top spawn and five next entries, both walls,
exact T/I CW wall kicks, board double clear/empty detection, normal/full
scoring helpers, integrated Tetris/B2B/combo, first/restricted/post-lock hold,
exact hard distance/four welded cells, grounded 400/550 ms wait/lock,
exact immediate/timed soft rows/points, blocked spawn/frozen update/restart,
gravity helper L1/L2/order/positive high levels, three renderer states with
a stub canvas, seeded random actions until top-out, and stubbed input for
all required keys, default prevention, horizontal repeat, hold and R.

The “T-spin double” integration **assigns lastActionWasRotation=true**
instead of rotating; it does not prove actual rotation-to-spin integration.
Mini and PC helper assertions encode the wrong tables and earn no
conformance credit for those rules. The B2B helper's arithmetic alone does
not test engine continuity; a separate real consecutive-Tetris fixture does.
The fuzz loop stops on game over, so “3000 actions” is an upper bound,
not evidence that all 3000 executed. No independent ghost, full geometry/
kick oracle, CCW/floor kick, held retrieval type/orientation, exact lock
boundary/reset/cap/ledge/contact, correct mini/PC/zero-line spin, B2B break/
no-clear continuity, higher-level combo/pre-clear crossing, actual gravity
cadence, hidden/partial lock-out, soft transition or browser layout test
exists. Useful stubbed input/renderer coverage and exact drops justify
7.5, comparable to Opus high/Sonnet medium, below the broader 8.5–9.5 suites.

Code **9.0**, simplicity **8.5**: **1,052 source TS LOC** across focused
constants, pieces, board, RNG, bag, scoring, game, input, renderer and entry
modules. Strict unused/fallthrough/casing checks, typed geometry, injected
RNG, copied peeks and one seconds-based engine clock keep rules readable.
Private fixture fields compile as ordinary properties; public state still
requires caller discipline. The modules/comments are proportionate, with
little extra revision/event machinery. Incorrect rule values are charged
to correctness, not counted again as a code-quality penalty.

UX **8.5**: clear beveled seven-color board/grid/translucent ghost,
complete hold/five next previews, scores, clear/game-over messages and full
keyboard legend; custom horizontal/soft repeat. No canvas accessibility
label, pause, pointer controls, high-DPI adaptation or blur key cleanup.
The confirmed canvas/phone defects are deducted only from correctness.

## Confirmed findings and exact fixtures

Coordinates use visible rows y=0..19; native Board row is **y+20**.
No spin flag is assigned in any audit scoring fixture. Every engine finding
repeats in Chromium against the served emitted modules; real Down plus the
unchanged RAF independently repeats the transition.

1. **Major, grouped scoring: zero-line spins, mini and PC points are wrong.**
   Start T r3,(3,17). Stack (5,17),(3,19), plus (3,17) for full or (5,19)
   for mini. Actual CW reaches r0,(3,17), grounded, with zero hard travel.
   Full/mini no-line locks give **0/0**, expected **400/100**. Adding row
   18 outside x=3..5 yields full/mini singles **800/100**, expected
   **800/200**. Both hard drop and 501 ms timed lock agree. Full double
   via two actual CW rotations correctly gives **1200** through both paths.
   `applyScoring` returns on zero clears; mini table is shifted downward.

   Horizontal I r0,(3,18), bottom row except x=3..6: empty-board single
   scores **200**, expected **900** (100 normal + 800 PC). Tetris,
   no-clear O, then zero-travel Tetris PC totals **2800**, expected **5200**.
   `perfectClearBonus` repeats ordinary clear points instead of PC bonuses.
   These related scoring errors receive one deduction, not one per fixture.

2. **Minor: entering soft drop spends old normal-gravity time.** O
   r0,(3,0), advance normal time **800 ms in ≤16 ms steps**: no fall.
   Real Down performs one immediate step; the next **1 ms** RAF consumes
   accumulated time at the 50 ms interval, yielding **17 rows/17 points**.
   Engine `setSoftDrop(true);update(.001)` and native-key browser checks
   agree at both sizes. The normal accumulator is not reset on entry.

3. **Minor: fixed phone canvas clips the playfield.** At **390×844**,
   canvas **480×620 at x=−45**, document width **435**. The 300×600
   playfield begins at **−35**, losing 35 px off the left; hold/next
   boxes begin at x=275 and end at 395, also partly outside the viewport.
   Desktop canvas x=400, field x=410, both fully visible. Width and X
   positions are asserted, not inferred only from screenshots.

4. **Minor: advanced stats are painted below the canvas backing.**
   Force combo=1 and backToBack=true, then call the unchanged renderer.
   Canvas height is **620**; COMBO label starts at y=**615**, its value
   `x1` at **630**, B2B label at **660**, `x1.5` at **675**. Values/B2B
   are outside the backing at **both desktop and phone**, and cannot be
   recovered by page scrolling. This is distinct from horizontal phone
   layout: a responsive CSS width change does not restore discarded pixels.
   Actual fillText coordinates and visual inspection reproduce it.

## Engine and Chromium coverage

```sh
python3 .audit/run-beam-mimo-audit.py --offline
```

The [runner](run-beam-mimo-audit.py), [engine probes](beam-mimo-audit.mjs)
and [browser assertions](beam-mimo-browser.cjs) also audit
[Beam low/medium](beam-efforts-review.md). Omit `--offline` for uncached
dependencies; `--effort mimo` selects this run; `--engine-only` skips browsers.
Only random disposable copies receive installs/builds/tests/servers, excluding
node_modules/dist/dist-test/.git. **Node 26.0.0**, locked TypeScript
**5.9.3**, installed Playwright **1.64.0**, Chromium **156.0.8078.4**.
No browser download. MiMo server/package/app remain unmodified; PORT uses
a free **41000–49999** port. T3 preview status/open was checked and its
own incognito tab closed; the explicitly requested prior library workflow
is used. All evidence stays disposable; no retained-copy option in the runner.

- **28 exact SRS states and 48 ordered real CW/CCW candidate sequences**
  pass the independent oracle. Collision interception only captures all
  rejected candidates and is discarded before gameplay. Actual T and I
  floor kicks reach r1,(2,17) and r1,(4,16). No SRS defect is charged.
- **100 actual engine bags** (ten seeds × ten bags), clearing only the
  stack between real drops; first/restricted/post-lock held retrieval and
  orientation reset; seven obstructed independent ghosts, exact hard points
  and all four welded coordinates. Actual Chromium ghost draws match all
  seven expected poses at both sizes.
- Grounded **499/500 ms**, successful move reset, fifteen allowed resets,
  blocked soft safety and ordinary ledge mid-air safety. After fifteen
  moves at 10 ms intervals, 490 ms additional time remains unlocked, and
  a failed extra reset plus 10 ms locks. O on support (0,14), origin
  (−1,12), wait490, Right, wait20 stays safely airborne. The newest audit's
  990+16+484 ms landing fixture does **not** lock early at 1490 ms.
  Frame-sized delayed observation is not an extra failure; no premature
  contact-time charge is reproduced.
- Normal single/double/triple/Tetris **100/300/500/800**, full singles/
  doubles **800/1200**, B2B across a no-clear **2000**, ordinary break
  **2150**, level-two combo **300**, nine-to-ten single **100** all pass.
  The incorrect zero/mini/PC results are pinned above.
- First-row integer boundaries at levels **1/2/5/9/10/14/15/20** are
  **1000/793/356/94/65/17/17/17 ms**, with no ordinary-gravity points.
  Unchanged engine/main callbacks agree at **60/144 Hz**: level two over
  1480.001 ms **1/1 row**, level ten over600 **9/9**, level fifteen
  over100.001 **6/6**. The .001 ms endpoint margin avoids a binary-float
  ambiguity exactly on the sixth 1/60-second boundary, not a timer repair.
  Held replacement gets a fresh 1000 ms phase.
- Public hidden paths use stack **(1,1),(0,3),(0,0),(1,3),(7,2),(3,2),
  (4,2),(4,3),(6,2),(0,2)**, actual T spawn at (3,0), then
  **Left,CW,CW,Left,CW,CW**. Final r0,(0,−2) is wholly hidden/grounded;
  incoming I at (3,0) is independently open; zero-travel hard drop correctly
  ends the game. Stopping before the last CW yields r3,(0,−2), three
  hidden/one visible cell, and correctly continues. No active pose is injected.
- Real keys **Left,Right,Up,X,Z,Left Ctrl,Down,Space,C** assert displacement,
  rotations, soft points, four-cell hard lock and hold. Space causes blocked
  incoming T; terminal keys are inert; real R fully resets board/hold/score/
  lines/level/hold availability. Main responses gain appended accessors only;
  input, renderer and captured RAF bodies are unchanged.
- Forced O hold and five I next pieces paint **24 complete square preview
  cells**, no off-backing rectangle. Combo/B2B off-backing text is separately
  pinned. No application exception, unexpected console error or failed
  required asset at either size; harmless favicon 404s are excluded.

Screenshots at **1280×800** and **390×844** were visually inspected outside
the checkout, then deleted. Horizontal geometry is pinned within .03 px;
font-sensitive vertical layout is recorded rather than made invariant.
CSS viewport uses the same desktop user agent as earlier audits. This is
a focused conformance audit, not exhaustive state-space, long-duration,
physical touch/HiDPI, native repeat, focus/multi-key or another-browser proof.

## Supplied generation and isolation context (no score effect)

Parent supplied **no access outside the workspace**. This was recorded,
not reconstructed from provider transcripts. First MiMo run; **default**
records absence of reasoning options, without inferring zero reasoning.
Statistics/registry/pricing are unchanged; overhead/cost/model-request/tool
counts remain unverified rather than zero.

| Native OpenCode session | T3 thread | Tested-agent tokens | Elapsed |
|---|---|---:|---|
| `ses_e881cc2a6ffeBa6VMXC5mE3sz9` | `mcp:9623e357-f8ab-4926-88eb-025500588cc0` | 2,129,675 | 31m 55.288s |

## Validation and cleanup

Complete offline shared runner: **passed**, all three fresh installs/builds/
unchanged own workflows, engine outcomes and six Chromium viewport passes.
Final `python3 scripts/benchmark.py render`, `python3 scripts/benchmark.py
verify`, `python3 -m unittest discover tests` (**66 tests, OK**),
`node .audit/verify-ranking.mjs` and `git diff --check`: **passed**.

All owned servers/Chromium sessions and disposable copies/evidence folders
were removed, including the earlier diagnostic failure paths. Runner cleanup
covers success/failure/interruption. Main branch; no commit/stash/reset/
revert/push. No implementation, scripts/tests, registry/pricing or old
score changed; parent owns the commit.
