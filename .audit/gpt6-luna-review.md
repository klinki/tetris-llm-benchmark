# GPT-6 Luna audits (low, medium, high, xhigh, max)

Audit date: **2026-10-24 (Europe/Rome)**. Five independent `gpt-6-luna`
runs in T3 Code / Codex, **standard service tier**, each implementing
[`TETRIS.md`](../TETRIS.md) from the single prompt “Read the README.md file
and implement it”. Run IDs are `gpt-6-luna-{low,medium,high,xhigh,max}`.
This record supports [`ranking.json`](../ranking.json) and
[`RANKING.md`](../RANKING.md). The predecessor GPT-5.6 Luna runs
`luna-codex`, `luna-omp`, `luna-pi` retain **7.60/8.60/8.45** and their
historical evidence; no predecessor finding was presumed to apply here.

## Method and delivery outcomes

Re-read the ranking rubric, fixed deductions, weights, methodology and
conformance/coverage tables, the task, and the recent [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md), [Gemini high](gemini-high-review.md),
[Muse](muse-review.md), [GLM](glm-review.md), [DeepSeek V4.1](deepseek-v41-review.md)
records and their probes/browser/temporary-copy workflows. Read every run's
complete source, own tests, HTML/CSS, package/config/server files and supplied
statistics. Same **0–10 half-point scale**, **40/20/20/10/10** weights:
critical −4/cap 4, major −1.5, minor −0.5; correctness is clamped at zero.
Each bug is deducted once. Own-test omissions determine tests; added audit
probes earn no own-test credit. Tokens, cost, time, effort names and isolation
facts have no quality effect. Earlier quality records remain unchanged.

All installs, builds, tests and servers ran in random disposable temporary
copies, excluding dependencies, generated output and `.git`. Low's supplied
server hard-codes 8321; only that port literal changes in its temporary copy,
with routes/MIME/application logic unchanged. Other playable servers honor
`PORT`. All servers use free ports **41000–49999**. Named Chromium sessions,
the initial incognito T3 status/open tab, server process groups and temporary
copies/artifacts were closed/deleted. No commit, stash, reset or revert was
made; work stayed on `main`. No authored implementation, registry, pricing,
repository scripts or repository tests were edited, and no dependency/build
output was placed inside any original run directory.

| Run | Install in fresh copy | Build | Declared own test workflow |
|---|---|---|---|
| low | `npm ci --ignore-scripts --offline` | Pass | 4 pass |
| medium | `npm install --ignore-scripts --offline` | **Fails: 113 TypeScript errors** | **Fails before either of 2 source cases executes** |
| high | `npm ci --ignore-scripts --offline` | Pass | 5 text/regex assertions pass; no engine execution |
| xhigh | `npm ci --ignore-scripts --offline` | Pass | **2 pass / 1 deterministic bag-test failure** |
| max | `npm ci --ignore-scripts --offline` | Pass | 4 pass |

Medium declares TypeScript but delivered no installation or lockfile.
Installing its declared dependency in the copy does not rescue it: `FORMS`
is typed as arrays of arrays while its values are flat arrays, producing
112 element errors plus one result-matrix error, **113 in total**. Its
`noEmitOnError` setting leaves **no `dist`**. Independently `node server.js`
exits with **“require is not defined in ES module scope”** because the
package is ESM and its server uses CommonJS. These are grouped as one
critical delivery finding, followed by independently probed source findings,
matching Nemotron's critical cap/continued deductions. The benchmark site
publishes no playable medium game; this audit did not alter that registry.

For diagnostic comparison only, the engine script uses installed TypeScript's
`transpileModule` **in memory**, leaving source, configuration, normal build
and browser module graph untouched. A VM supplies no-op DOM surfaces to the
unchanged main functions. It can establish source behavior, not a successful
build or playable delivery. Medium's browser pass serves only its unchanged
HTML/CSS with Python's static server; `/dist/main.js` still fails with 404.
Its UX score assesses only the static presentation, as Nemotron's does.

Xhigh's **seed 1234** own bag case deals
`I,T,L,J,S,O,Z | O,L,J,S,I,I,I`: the first bag has seven types and the second
has five. **Drop 11 triggers blocked-spawn game over**; subsequent hard drops
are inert, so it keeps sampling the current I. Clearing the board before
each real hard drop passes **100 bags** (ten seeds × ten bags), without
changing the randomizer or test file. The failure is a **broken test fixture**,
not a bag bug. The runner asserts both the unchanged own failure and the
independent correct bag invariants, without retrying a failure until it passes.

## Scores and rationale

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Bugs |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 4.5 | 4.0 | 7.0 | 8.5 | 8.0 | **5.65** | 3 major, 2 minor |
| medium | 0.0 | 3.5 | 8.0 | 8.5 | 6.5 | **3.80** | 1 critical, 3 major, 1 minor |
| high | 6.0 | 1.5 | 7.5 | 8.5 | 8.5 | **5.90** | 2 major, 2 minor |
| xhigh | 5.5 | 4.5 | 9.0 | 8.5 | 9.0 | **6.65** | 2 major, 3 minor |
| max | 6.5 | 5.5 | 9.0 | 8.5 | 9.0 | **7.25** | 1 major, 4 minor |

Low loses 4.5 for three majors and 1.0 for two minors: **4.5 correctness**.
Medium reaches the critical cap 4, then loses 4.5 plus 0.5, clamped to **0**.
High loses 3.0 for two majors and 1.0 for two minors: **6.0**.
Xhigh loses 3.0 for two majors and 1.5 for three minors: **5.5**.
Max loses 1.5 for one major and 2.0 for four minors: **6.5**.

Incomplete scoring is grouped as in the predecessor/DeepSeek/Muse audits;
wrong SRS geometry/kick data and wrong ordinary gravity curves are major.
High's independent remainder-loss refresh defect is a minor timing-fidelity
finding: both refresh rates still run. This is less severe than GLM low's
complete high-refresh simulation freeze. Action-reset policy, hidden lock-out,
B2B-PC variants, stale spin attribution, soft transitions and presentation
findings retain the recent audits' minor severity. Xhigh's broken own test is
not deducted from correctness. Missing lockfile alone is not another bug.

### Low — 5.65

Summary: **Wrong SRS pivots, basic-only scoring and gravity; erased next previews and hidden phone hold**.

Tests **4.0**: four shallow cases assert start/queue length, first hold/restriction/post-lock availability, a hard-drop count and four rotations ending with a non-null active piece. Score >=0 is vacuous; the test named hold swap never retrieves the held piece. No bag distribution, exact geometry/kick/drop score, independent ghost, timing, lines/advanced scoring, gravity/levels, top-out/restart or browser assertion. Code **7.0**, simplicity **8.5**: a strict DOM-free engine and direct browser entry, 71 physical TS lines, but many very long compressed methods and a duplicated seven-shape table impede maintenance. UX **8.0**: clear labeled board/grid/ghost/stats and desktop hold, native key repeat, best-score storage and restart; the legend omits several required aliases and there is no custom DAS/ARR, high-DPI sizing or touch UI. Confirmed preview/phone defects are charged only to correctness.

Confirmed findings:

1. **Major: Fifteen non-I/O rotation states use a 4×4 pivot instead of SRS.** The independent 28-state oracle fails J/L/S/T/Z rotations 1, 2 and 3. Every non-O piece rotates with [3-y,x], although these five pieces require [2-y,x]. The kick offsets are canonical but cannot repair the incorrect basic orientations.
2. **Major: T-spins, back-to-back, combos and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200 through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a zero-travel single perfect clear scores 100 instead of 900.
3. **Major: Gravity uses the wrong exponential curve.** Actual one-row boundaries at levels 1/2/10 are 1000/800/135 ms, versus 1000/793/about 64.152 ms. The engine uses max(50,1000*0.8^(level-1)), with a much slower high-level progression than the benchmark profile.
4. **Minor: Each next preview erases the earlier previews.** A real render makes six full-canvas clears in #next: the outer clear and one per queued piece. Only twelve fillRect calls (four cells with shading) remain after the final clear, so only the fifth queued piece is visible instead of the upcoming queue, at both viewport sizes.
5. **Minor: The phone layout hides the hold display.** At 390×844 the board fits at x=77 with size 300×600 and document width 390, but #hold has display:none and zero bounds. This is one responsive supporting-state defect.

### Medium — 3.80

Summary: **Does not build or start; diagnostic source has wrong SRS, scoring and gravity**.

Tests **3.5**: the declared workflow fails before either own case runs. The two source cases meaningfully assert a fixed-random bag, one collision-free T, rotation number and a clear helper; they do not integrate the game or test exact points, kicks, hold, ghost, timing, levels, game over/restart or browser delivery. Code **8.0**, simplicity **8.5**: 210 source TS lines with geometry separated from a readable direct main module, strict configuration and no runtime dependency. Main-owned mutable globals couple simulation and DOM. The compile/server failures are charged once to correctness. UX **6.5** assesses only the readable static desktop presentation, matching Nemotron; live gameplay cannot be evaluated.

Confirmed findings:

1. **Critical: The delivered build and start workflow cannot produce a playable game.** No package-lock.json was delivered. After npm install in a fresh copy, npm run build and npm test each fail with exactly 113 TypeScript errors in src/game.ts; noEmitOnError prevents dist output. Independently, node server.js exits because require is undefined in the package ESM scope. These are one critical delivery finding, with correctness capped at 4; the static browser diagnostic gets a 404 for /dist/main.js.
2. **Major: Fifteen non-I/O rotation states use a 4×4 pivot instead of SRS.** The independent 28-state oracle fails J/L/S/T/Z rotations 1, 2 and 3. Every non-O piece rotates with [3-y,x], although these five pieces require [2-y,x]. The kick offsets are canonical but cannot repair the incorrect basic orientations.
3. **Major: Advanced scoring is absent and ordinary gravity awards drop points.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200 through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a zero-travel single perfect clear scores 100 instead of 900. Diagnostic transpilation also confirms that one ordinary automatic gravity row awards one point: tick calls move(0,1), which scores every downward step. These are source/diagnostic findings, not a successful delivery.
4. **Major: Gravity uses a different hard-coded progression.** Diagnostic one-row boundaries at levels 1/2/10/15 are 1000/850/80/80 ms, versus 1000/793/about 64.152/7.059 ms (or the accepted 16 ms fast floor). No delivered game runs; the unchanged functions were inspected through isolated in-memory transpilation.
5. **Minor: The static phone layout removes the next queue.** At 390×844 the unchanged HTML/CSS has document width 390 and a 300×600 board at x=79, but .right-rail is display:none and #next has zero bounds. The static diagnostic is not a gameplay pass.

### High — 5.90

Summary: **Basic-only scoring, wrong and refresh-dependent gravity; airborne moves exhaust lock resets**.

Tests **1.5**: the own suite is five regular-expression assertions against HTML and emitted JavaScript text. It never imports/executes the engine, constructs a game, sends an input or asserts a rule. A passing build and matching class/function names do not establish gameplay coverage. Code **7.5**, simplicity **8.5**: 261 source TS lines, direct strict types and readable methods without runtime dependencies; one DOM-coupled class mixes simulation, input effects and canvas/DOM rendering, and recreates three next canvases every frame. UX **8.5**: clear grid/ghost, hold, three next previews, DOM stats, a full control panel, pause/sound/restart buttons and accessible scrolling phone reflow. Native key repeat, no high-DPI adaptation or touch UI.

Confirmed findings:

1. **Major: T-spins, back-to-back, combos and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200 through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a zero-travel single perfect clear scores 100 instead of 900.
2. **Major: Gravity follows the wrong curve.** The real frame method first moves an O at 800/656 ms at levels 1/2, rather than 1000/793 ms, and uses max(45,800*0.82^(level-1)). Levels still increase every ten cleared lines.
3. **Minor: Discarded gravity remainder makes falling depend on refresh rate.** At level 15, the unchanged requestAnimationFrame callback advances a free O 12 rows at 60 Hz but 10 at 144 Hz over the same 600 ms. frame resets dropAccumulator to zero after each step instead of preserving its remainder. This is separate from the incorrect gravity equation.
4. **Minor: Airborne actions consume the grounded lock-reset allowance.** Fifteen alternating successful moves near spawn set lockResets=15 before contact. After the same piece reaches the floor and waits 490 ms, a move cannot reset the timer; 20 ms later it locks. Ordinary 499/500 ms locking, the grounded fifteen-reset cap and ledge mid-air safety pass.

### Xhigh — 6.65

Summary: **Wrong I kick and gravity; hidden lock-out, B2B perfect-clear and phone next gaps**.

Tests **4.5**: 2 of 3 own tests pass. Hold restriction/post-lock availability and a completed-row hard drop are meaningful, but no points are asserted. The deterministic seed-1234 bag case tops out on drop 11; its last three observations repeat I, so the second group contains five types. Clearing the board between real spawns passes 100 bags, establishing a broken test fixture rather than a randomizer defect. No complete SRS/kick, ghost, scoring, timing/cap/ledge, level, hidden-lock-out, restart or browser test exists. Code **9.0**, simplicity **8.5**: 628 source TS lines, a DOM-free functional state engine and readable entry/renderer, seeded PRNG, consistent milliseconds, strict configuration and no runtime dependencies. Mutable state and repeated spawn/hold setup are modest costs. UX **9.0**: labeled grid/ghost, five desktop previews, full legend, DAS/repeat and blur cleanup, restart and visible phone pointer controls. Phone queue loss is charged only to correctness.

Confirmed findings:

1. **Major: The I 0-to-L kick transition is incorrect.** All 28 basic states are canonical, but the I 0>3 table copies 0>1. With I at rotation 0,(3,10) and a stack cell (4,10), real CCW reaches rotation 3,(1,10); canonical SRS chooses (2,10). The other seven I transitions and all non-I tables pass.
2. **Major: Gravity follows a different progression.** The engine uses 1000/level through level 9, followed by 9*1.32^(level-9) cells/second. Actual first-row boundaries at levels 1/2/5/10 are 1000/500/200/85 ms, versus 1000/793/about 355.197/64.152 ms. Equal-time frame-rate checks otherwise agree.
3. **Minor: A wholly hidden lock does not end the game.** From the real T spawn (3,0), stack (2,2),(3,3),(4,3); CW, CCW, three left moves reach a grounded T wholly in hidden rows 0–1. The incoming I spawn is independently open. Zero-travel hard drop leaves gameOver=false; lockPiece only tests y<0, not the hidden-row boundary at 2.
4. **Minor: Back-to-back Tetris perfect clear uses the ordinary bonus.** A Tetris, no-clear lock and zero-travel Tetris perfect clear total 4000, versus 5200: the last clear earns 1200+2000 instead of 1200+3200. Ordinary single PC, full/mini spins, B2B, combo and pre-clear-level scoring pass.
5. **Minor: The phone stylesheet hides the entire next queue.** At 390×844, the board fits at x=13 with size 249×498 and hold remains visible, but .right-column has display:none and all five next canvases have zero bounds. Desktop previews work.

### Max — 7.25

Summary: **Wrong I kicks; B2B perfect-clear, stale soft-drop spin, timing and phone preview defects**.

Tests **5.5**: four deterministic cases assert one complete bag, hold restriction/post-lock availability, exact hard-drop distance/points/four welded cells and blocked incoming spawn. These are substantially stronger than low, but omit rotations/kicks, independent obstructed ghost, soft movement/timing, any line/advanced score, lock timing/reset cap/ledge, gravity/levels, hidden lock-out, restart and browser behavior. Code **9.0**, simplicity **8.5**: 678 source TS lines, strict DOM-free class engine, injected RNG and focused browser renderer/input in two direct modules; mutable snapshots and repeated replacement setup add modest maintenance cost. UX **9.0**: labeled high-DPI board/previews, grid/ghost, five previews, complete legend, custom DAS/ARR, blur cleanup, DOM score/combo/B2B/progress, a correct overlay and responsive scrolling panels. No touch UI. The preview defect is deducted only from correctness.

Confirmed findings:

1. **Major: Two I kick transitions use the opposite direction data.** The I 0>3 and 3>0 tables are wrong; all 28 orientations and other tables pass. I r0 at (3,10) with stack (4,10) rotates CCW to x=4 instead of x=2. I r3 at (3,10) with stack (3,11) rotates CW to x=5 instead of x=4; a right-wall r3-to-0 rotation also fails when canonical SRS succeeds.
2. **Minor: Back-to-back Tetris perfect clear uses the ordinary bonus.** A Tetris, no-clear lock and zero-travel Tetris perfect clear total 4000 instead of 5200. The final placement receives the ordinary 2000 PC bonus instead of 3200; ordinary single PC, full/mini/B2B/combo and level crossing pass.
3. **Minor: Manual soft drop preserves stale T-spin credit.** Rotate a T clockwise in open space, then manually soft-drop it into a grounded mini-corner pose and hard-drop zero rows. The engine adds 100 spin points on top of the soft-drop rows, even though the last successful manual action was downward movement. softDropStep and held-soft tick descent never clear lastAction=rotate; xhigh correctly awards zero spin points for the same fixture.
4. **Minor: Starting held soft drop consumes earlier normal-gravity time.** After fifty 16 ms normal ticks, an O has not moved. Real ArrowDown moves one row immediately; one further millisecond with soft held takes it all the way to the floor: 18 rows and 18 points in total. The 800 ms accumulator is reused at the new 30 ms interval. Engine and real Chromium input reproduce it.
5. **Minor: Phone next previews are painted at obsolete widths and squashed.** At 390×844, adding the five flex queue items one at a time paints backing widths 310/155/103/77/61 px, but every final canvas is about 61.2 px wide. Five identical I previews paint CSS widths about 13.03/26.46/39.81/40.54/35.12 px, with inconsistent block aspect ratios. paintQueue caches these drawings after sibling insertion shrinks the earlier canvases; desktop widths are stable.

## Engine evidence and reproduction

```sh
python3 .audit/run-gpt6-luna-audit.py --offline
```

Omit `--offline` if npm dependencies are not cached. The default runner
installs, builds, executes the **unchanged** declared tests, runs
[`gpt6-luna-audit.mjs`](gpt6-luna-audit.mjs), then performs desktop/phone
Chromium checks via [`gpt6-luna-browser.cjs`](gpt6-luna-browser.cjs).
A successful audit asserts the documented failures as well as conformance;
it does not certify bug freedom. Unexpected build/test failures or changed
expected failures, missing browser results and nonzero probe/CLI commands
fail the runner. Medium's own server ESM failure is asserted separately.

`--engine-only` explicitly skips browsers; `--effort` selects a run.
`--playwright-cli` and `--playwright-config` override local setup.
`--artifacts-dir` can retain screenshots/JSON **outside** the checkout;
default output is deleted. The runner reuses installed Chromium without
downloading another browser, and closes named browsers and server groups
on success/failure. Low's only temporary server adaptation is its port;
medium's static server is explicitly diagnostic, with no game or fixed build.

The engine probes use the same canonical shape/kick oracle and benchmark
scoring profile as the recent audits. High's emitted browser script exposes
no module engine API: a VM loads it with no-op DOM/canvas/storage/RAF surfaces
and captures its unchanged class, matrix helpers and constants. Real browser
layout, drawing and input are verified separately. Medium is the in-memory
transpilation diagnostic described above. Low/xhigh/max import their normal
emitted modules. Mutable/private fields are used only for deterministic
fixture setup, not to repair production behavior. Coverage includes:

- **All 28 SRS coordinate sets**, with only a fixed O-origin translation
  for high's 2×2 O; seven distinct colors; every ordered CW/CCW kick
  candidate for the six rotating pieces; real left/right T/I kicks and
  explicit legal I obstacle fixtures demonstrating xhigh/max's wrong data.
  Low/medium fail fifteen non-I/O states; high/xhigh/max have canonical
  states. All seven pieces reach the correct left/right limits.
- **100 actual engine bags per run**, with deterministic LCG sources or
  xhigh's seeded PRNG, clearing the board between unchanged hard-drop/spawn
  calls. Xhigh's exact seed-1234 own-test sequence and game-over transition
  are separately asserted. Hold restriction, queue consumption, post-lock
  retrieval and orientation reset pass (medium diagnostic only).
- All seven obstructed landing poses are independently collision-free with
  a collision one row below, hard-drop points equal twice the distance and
  the four final locked cells match. Max additionally exposes its real
  ghost method. Low/high/xhigh's independent oracle mirrors their renderer's
  collision calculation; Chromium additionally observes unchanged canvas
  drawing calls for all seven obstructed ghosts and asserts exact cells.
- **499/500 ms grounded locks**, fifteen actual timed resets followed by
  locking at the cap, and the **ledge-move mid-air lock probe**. O rests
  on a single support for 490 ms, moves one cell off, remains airborne
  across the old deadline for 20 ms, then later lands and locks on the
  floor. All five pass this safety check; medium is diagnostic only.
  High additionally consumes fifteen resets while airborne, then fails
  a first grounded action's reset, reproducing its policy defect.
- Exact normal single/double/triple/Tetris; legal final-rotation full/mini
  zero/single via hard drop **and** timed lock; fifth-kick classifier credit
  in xhigh/max; B2B no-clear continuity and ordinary-single break; mini B2B;
  level-two combo; pre-clear-level scoring and ten-line crossing; single PC,
  single PC after B2B and B2B Tetris PC. Low/medium's wrong pivots need extra
  blockers: the adapter protects the initial/target cells, blocks earlier
  SRS candidates, then uses the real rotation into the same legal final
  r0 spin pose. It never assigns a fictitious spin flag for these engines.
- Gravity helpers/actual integer-millisecond first-row boundaries at
  **levels 1,2,5,10,15,20**, plus max's exact equation. Max's **16 ms fast
  floor** is accepted consistently with Gemini/Sol/other previous engines.
  Free falling at actual 60/144 Hz timestamps is compared at level 15 for
  600 ms; high reproduces **12 versus 10 rows**. Engine and browser agree.
- Ordinary soft-drop points, the **800 ms normal / real Down / 1 ms**
  transition, max's rotate-then-manual-soft stale-spin fixture, blocked
  spawn, inert game-over methods in the four usable engines and complete
  reset. Medium's private main functions rely on its input guard; its
  delivered browser is unavailable, so no live game-over-input claim is made.
- **Public-action wholly hidden locks** with incoming I independently open.
  Xhigh uses stack **(2,2),(3,3),(4,3)** from real T spawn, CW/CCW/left×3,
  ending entirely in rows 0–1 without game over. For the other four, a
  deterministic bounded stack/action search finds and then replays an
  unchanged spawn/rotation/movement path ending above visible row 0; they
  correctly end on zero-travel hard drop. Only stack cells are injected;
  no hidden active pose or rotation flags are forced. The exact stack and
  public action sequence are printed by the reproducible probe.

The task's [Fandom guideline link](https://tetris.fandom.com/wiki/Tetris_Guideline)
again returned HTTP 402. Rules remain the existing benchmark profile, with
[SRS](https://tetris.wiki/Super_Rotation_System) and
[modern scoring](https://tetris.wiki/Scoring) checked against the same
references as previous audits. The selected gravity equation, reset cap
and whole-piece lock-out are also documented in the previously used
[2009 guideline transcription](https://studylib.net/doc/27262492/2009-tetris-design-guideline).
Perfect-clear scoring is the established additive benchmark convention,
not a claim that every licensed Tetris title uses identical PC rules.

## Chromium evidence

Playwright skill/CLI, installed **Chromium 156.0.8078.4**, **1280×800** and
**390×844**. T3 preview status/open was inspected; the explicitly requested
prior-audit workflow uses the CLI. No saved user profile was used. All ten
full-page screenshots were visually inspected outside the checkout.

The playable runs use their supplied `npm start` behavior. Browser entry
responses receive only appended accessors for existing lexical bindings;
engine/input/render/frame bodies remain unchanged. RAF scheduling is captured
so actual callbacks can be driven with controlled timestamps; this does not
replace the simulation. Real keydowns/up events exercise every required
binding at each size, with before/after engine assertions. Medium is solely
its unchanged static HTML/CSS with a missing module, no working start button
or keys and score zero. Its controls are not counted as passes.

| Run | Desktop board | Phone document width | Phone board | Phone supporting state | Application errors |
|---|---|---:|---|---|---|
| low | 300×600 at x=491 | 390 | 300×600 at x=77 | Hold removed; next shows only fifth piece | None |
| medium | Static 300×600 at x=491 | 390 | Static 300×600 at x=79 | Next removed | Required `/dist/main.js` 404; no game |
| high | 300×600 at x=490 | 390 | 300×600 at x=45 | Queue at y≈1078, fully reachable by scrolling | None |
| xhigh | 300×600 at x=491 | 390 | 249×498 at x=13 | Hold fits; five-piece next removed; pointer controls visible | None |
| max | 300×600 at x=491 | 390 | 298×598 at x=46 | All panels fit below board; next canvases painted at unstable widths | None |

Geometry is asserted within 0.02 px horizontally; vertical positions may
vary slightly with fonts. High's queue is vertical reflow, not clipping.
Max's 298×598 content reflects the enclosing border/box-sizing; the whole
board remains visible. Low's phone next canvas shrinks to 52×68; its hold
canvas has `display:none` and zero bounds. Xhigh's next canvases have zero
bounds because their ancestor is `display:none`. Medium's static CSS does
the same to its right rail. These are directly observed, not inferred from
absence in a screenshot.

Low's real canvas calls reproduce **six complete next clears**, leaving only
four cells/twelve shaded fills after the last clear. Max's phone fixture
renders five identical I pieces: backing widths **310/155/103/77/61** shrink
to CSS widths about **61.2** each; nontransparent-pixel bounds become
**13.03/26.46/39.81/40.54/35.12 px** wide. First/last painted heights are
**16/8 px**. This establishes shape distortion from the actual pixels and
layout, independent of randomly dealt piece types.

The required keys **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** work
in all four playable runs. Actual Down independently reproduces max's
18-row/point soft transition; low/high/xhigh move/score one immediate row.
Actual callbacks independently reproduce high's level-15 refresh difference.
Real Space into a blocked incoming spawn and **real R** restore empty board,
hold, score/lines/level and hold availability. Active overlays are transparent
or `display:none` as intended; no Luna Codex-style overlay finding occurs.
There are no playable-run application exceptions, console errors or failed
required assets. Missing favicons are excluded, as in the earlier audits.

## Supplied isolation and generation context (no score effect)

These facts were supplied by the parent/import record. This quality audit
read the existing registry/statistics without rerunning session-isolation
scans, recollecting usage or changing their accounting:

- **Low:** the agent ran `find .. -name AGENTS.md` from its workspace.
  The parent directory contained only that run's workspace. Isolation
  checking now resolves relative references against the workspace and
  exempts that folder, commit **db25ee0**. This does not establish outside
  reference access and has no quality-score effect.
- **All five:** no other outside access, T3 tool calls or benchmark lookups
  were reported. Codex's own helper processes (`ChatGPT.app` **`cua_node`**)
  ran in each workspace and belong to the harness. Leftover servers and
  `/tmp` scratch were cleaned after every generation. Runs executed **one
  at a time**. No contrary implementation evidence was found.
- Service tier is the supplied **standard** tier. Effective backend budgets,
  complete overhead and normalized model/tool-call counts remain unverified;
  unknown is not zero. None affects quality.

| Effort | T3 thread | Native Codex session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:f24ef27a-328d-480a-9ff0-5cd2a0201f2d` | `01a16ecb-958d-7321-a472-853b35414457` | 131,696 | 1m 8.749s |
| medium | `mcp:e8430e83-b4ec-49ef-ad95-fcb427ff55e8` | `01a16ecd-79e5-72e0-82bc-6f7e32bac633` | 160,641 | 1m 35.743s |
| high | `mcp:5d497f06-e89f-44bb-9f03-b5bae8f79e3d` | `01a16ed1-50b2-7810-aa4a-a361ee93b15a` | 481,494 | 2m 4.148s |
| xhigh | `mcp:81a65b84-6c5a-411c-b481-6ba10281133a` | `01a16ed3-6f1a-7bd1-8a00-5961debf579b` | 973,306 | 4m 51.291s |
| max | `mcp:9615d149-f3b3-4098-b7d2-0454159dc482` | `01a16ed8-ba6b-70e2-8afa-19c6b6cd6521` | 1,535,665 | 8m 51.327s |

## Limits and validation

This is focused conformance evidence, not exhaustive state-space coverage,
a long-duration playtest, another-browser certification or physical touch
verification. Pointer controls were visually inspected; native touch hardware,
OS repeat cadence, every focus edge case and every spin/PC arrangement remain
unverified. High's simulation is exercised in its unchanged frame method and
real Chromium callback; medium's live gameplay is **unavailable**, never
inferred from diagnostic source probes. Earlier implementations were not
rescored or retroactively certified by the additional B2B-PC fixtures here.

Required final checks after recording and generation are listed below; the
final full fresh-copy runner is also rerun after tightening all assertions.

- `python3 .audit/run-gpt6-luna-audit.py --offline`: **passed** for all five,
  including required medium build/test/server failures, xhigh's own-test
  failure, all recorded engine findings and ten desktop/phone passes
  (medium static-only). Actual ghost drawing is asserted for all seven
  pieces in each playable browser; real blocked-spawn/Space/R is tested
  at both requested sizes.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**, 218 local links and 37 score
  rows; weighted arithmetic, deduction counts, order and tables validate.
- `python3 -m unittest discover -s tests`: **passed**, 54 tests, OK.
- `git diff --check`: **passed**.

The new review's local links/table shapes, JavaScript syntax, runner execution,
new-file whitespace, allowed changed-file scope and absence of in-run build/
dependency output were also checked. All 32 earlier `ranking.json` records
are byte-content-equivalent as parsed data; only five entries are appended.
Audit/browser/server temporary directories are removed and original run
source is unchanged. Parent owns the commit.
