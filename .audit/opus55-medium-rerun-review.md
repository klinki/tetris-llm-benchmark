# Claude Opus 5.5 medium isolated rerun audit

Audit date: **2026-10-27 (Europe/Rome)**. Independent review on `main` of
`claude-opus-5-5-medium`, **Anthropic `claude-opus-5-5`**, **T3 Code /
Claude Agent SDK**, medium effort, fast mode off. The single prompt was
“Read the README.md file and implement it”; the task is [`TETRIS.md`](../TETRIS.md).
This is the isolated rerun of **Claude Opus 5.5 (medium, original)**,
`opus-5.5`, whose **9.05** score and findings remain unchanged.

## Method and calibration

Re-read `RANKING.md`'s rubric, weights, Methodology and conformance/coverage
tables, `ranking.json`, the [audit index](README.md), the newest
[GPT-6.1 Terra](gpt61-terra-review.md), [Opus efforts](opus55-efforts-review.md),
[Beam](beam-efforts-review.md), [MiMo](mimo-v26-flash-review.md) and
[original Opus](oct23-review.md) records, their probe/browser/runner workflows
and the original's ranking section. Reviewed **all six delivered source
modules, the complete own test file, HTML/CSS, package, complete lockfile,
TypeScript config, server, ignore file, README and statistics**. No benchmark
implementation transcript or T3 thread-reading tool was used.

The existing **0–10 half-point scale**, weights **40/20/20/10/10**, applies.
Correctness starts at 10: critical −4/cap 4, major −1.5, minor −0.5; clamp
at zero. Deduct each defect **once, from correctness only**. Own-test gaps
determine tests; these added probes earn no own-test credit. Tokens, cost,
elapsed time, effort and isolation do not affect quality scores.

Full/mini spins, B2B/combo, drop points and pre-clear level scoring pass;
the isolated PC omission is **one minor**, as in Opus low/high/xhigh and
Sonnet medium. Several PC fixtures are one omission, not extra deductions.
Soft-entry discontinuity and phone support clipping retain their established
minor severities. No lock-clock/cap defect from the other Opus efforts is
presumed to apply: equivalent probes pass here. Ordinary frame-delayed
contact observation is accepted as in MiMo; no premature-lock deduction.

The task's [Fandom link](https://tetris.fandom.com/wiki/Tetris_Guideline)
again returned **402 Payment Required**. The existing canonical oracle,
[SRS reference](https://tetris.wiki/Super_Rotation_System) and
[scoring reference](https://tetris.wiki/Scoring) were rechecked. Additive
perfect clears remain the existing benchmark profile, not a universal
claim about all licensed versions.

## Delivery, scores and rationale

Fresh-copy `npm ci --ignore-scripts --offline`, explicit `npm run build`
and unchanged `npm test` **pass**: **13 passed, 0 failed**. Unmodified
`npm start` builds and serves the game; Chromium starts at both sizes.

| Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 8.5 | 7.5 | 9.0 | 8.5 | 8.5 | **8.40** | 3 minor |

Correctness: `10−3×0.5=8.5`.
Weighted: `8.5×.40 + 7.5×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 3.40+1.50+1.80+.85+.85 = 8.40`.

Summary: **Canonical SRS and sound audited lock/spin rules; missing PC
bonuses, a soft-drop jump and clipped phone supporting state**.

Tests **7.5**: **158 lines / 13 deterministic node:test cases** cover ten
seeded bag-helper permutations, actual centered spawn/immediate entry/five
next pieces, actual one-second gravity plus L1/L2 helpers, exact hard-drop
points/two welded coordinates, a legal single with exact points/row shift,
consecutive Tetrises with exact B2B/combo total/message, a real exact I CW
wall kick, rejected rotation with all kicks blocked, a legal final-rotation
full-spin double with exact lines/1200/message, first/restricted/post-lock
held retrieval, grounded 499/501 ms wait/lock, exact timed soft rows/points,
and actual stack-to-top-out/reset with clear board/score.

The second Tetris empties the board but asserts **2050 total**, encoding
the absent PC bonus; it earns no PC-conformance credit. The final test calls
hardDrop after game over without comparing before/after state; it does not
prove the terminal guard or a specifically blocked spawn. There is no
independent ghost oracle, wall-bound test, T/floor/CCW kick, full canonical
oracle, held orientation, movement reset/cap/contact/ledge, minis, full-spin
zero/single, B2B break/no-clear continuity, PC, higher-level combo/level
crossing, precise hidden/partial lock, pause, input or browser test. Useful
scoring/kick/drop integration matches Opus high/Sonnet medium's **7.5**,
below the original medium's **9.0** breadth. Case count and audit coverage
do not change that assessment.

Code **9.0**, simplicity **8.5**: **787 source TypeScript lines**, six
readable strict modules separating DOM-free rules, bag, canonical shapes,
input, renderer and entry. Injected RNG, a flat typed board, one millisecond
engine clock, direct helpers, cached preview/DOM text and no runtime
dependencies. Public mutable state/private emitted fields need fixture/caller
discipline. The architecture is proportionate, with modest input/render
machinery comparable to Opus xhigh's simplicity score.

Browser UX **8.5**: clear grid, seven beveled colors, translucent ghost,
hold/five-next previews, DOM stats/clear messages, complete visible keyboard
legend, correct pause/game-over overlays, high-DPI setup, custom horizontal
repeat and blur key release. No pointer controls or canvas accessibility
labels. Hardware HiDPI was not certified. Confirmed defects receive only
their correctness deductions, without a second UX/code penalty.

## Confirmed findings and exact fixtures

Coordinates use **visible-field x=0..9, y=0..19**; negative y is hidden.
Native flat-board row and active y are field y+**20**. O has a cropped 2×2
origin; the canonical oracle permits one fixed x translation for O only.
Fixtures set stacks/poses/clocks, never inject spin credit or repair rules.

1. **Minor: benchmark perfect-clear bonuses are absent.** Fill bottom
   row19 except x=3..6; horizontal I r0 at **(3,18)**, zero-travel hard
   drop. The board empties, one line clears, score **100**, expected **900**
   (100 normal+800 PC). Tetris/no-clear O/Tetris-PC totals **2000**, expected
   **5200**; single-PC after a prior difficult clear totals **900**, expected
   **1700**. `applyScore` has no empty-board bonus. Node and both served
   Chromium suites repeat all fixtures; real Space additionally asserts
   the single's exact score/empty board. One isolated scoring omission.

2. **Minor: entering soft drop consumes old normal-gravity time.** Fresh
   O r0 at **(3,0)**; fifty update(16) calls accumulate **800 ms** without
   falling. `setSoftDrop(true); update(1)` moves **16 rows/16 points**,
   spending old normal time at the new50 ms interval. Setter changes only
   a flag; gravityAcc is preserved. Real held **ArrowDown** and the next
   **1 ms unchanged RAF** reproduce16/16 at both sizes. Fresh soft drop
   normally yields one row/point per50 ms. This is the same transition
   finding charged in Opus low/high, not an ordinary-gravity curve error.

3. **Minor: fixed phone layout clips hold, stats and next.** At
   **390×844**, document width **503 px**, board **300×600 at x=45**,
   hold **100×60 at x=−93**, next **100×300 at x=383**. The complete board
   fits; most of hold/stats is off the left and next extends to483. Negative
   left content cannot be recovered by ordinary rightward page scrolling.
   At **1280×800**, board x=490, hold x=352, next x=828, all fit. Exact
   horizontal geometry, complete24 preview-cell painting and screenshots
   establish one layout finding. There is no separate missing-preview or
   clipped-board deduction.

## Reproducible engine and Chromium coverage

```sh
python3 .audit/run-opus55-medium-rerun-audit.py --offline
```

The [runner](run-opus55-medium-rerun-audit.py) uses one random disposable
root, excluding node_modules/dist/dist-test/.git from the source copy.
Locked install, explicit build and unchanged own tests precede
[engine probes](opus55-medium-rerun-audit.mjs) and
[browser assertions](opus55-medium-rerun-browser.cjs). Omit `--offline`
when npm packages are uncached; `--engine-only` explicitly skips browsers.
`--review` pauses for local evidence inspection before deleting it. There
is **no retained-copy/artifact option**. Success, failure and handled
interruption clean the root and owned process groups; subprocess timeouts
terminate their groups too. SIGKILL/power loss cannot execute finally blocks.

**Node26.0.0**, locked **TypeScript5.9.3**, installed **Playwright1.64.0 /
Chromium156.0.8078.4**; no browser download or root dependency install.
Each start uses the **unmodified `npm start` command/server** with **PORT**
on a free **41000–49999** port (41000 in this audit). Routes, MIME, source,
emitted module formats and application bodies stay intact. T3 preview
status/open was checked and its owned incognito tab closed; the explicitly
requested prior-audit Playwright-library workflow was followed.

The new adapter calls this run's own emitted modules; it reuses the unchanged
Opus effort canonical oracle/equivalent common fixtures, without rebuilding
or rescoring other runs. Every engine assertion repeats against the served
modules inside Chromium. Main's response gains accessors only; captured RAF
scheduling permits exact timestamps while frame/input/render bodies remain
unchanged. Real keyboard/RAF checks additionally establish UI integration.

- **28 canonical states and48 ordered non-O kick candidates**, actual
  T/I wall/floor outcomes, seven distinct colors and all-piece wall bounds.
  Concrete T/I floor rotations reach r1,(2,17) and r1,(4,16).
- **100 actual engine bags** (ten seeds×ten bags), clearing only the stack
  between real drops; restricted/post-lock held retrieval/orientation, fresh
  held1000 ms gravity phase, actual11-drop top-out and a fresh seven-type
  opening after reset.
- Seven independently obstructed ghosts at y14 using blocker(4,16), exact
  hard points and all four welded coordinates; actual Chromium ghost draws
  independently match all seven at both widths. Complete O hold/five-I next
  backings paint **24 cells**, with no out-of-backing rectangle. Minor border
  content-box scaling is not the pronounced preview distortion charged in
  earlier audits.
- Grounded **499/500 ms**, blocked-soft safety, successful reset/failed-wall
  safety, fifteen allowed resets with a full final delay, ordinary ledge
  safety and exhausted ledge descent. Fifteen alternating moves10 ms apart,
  then499 ms leaves0 weld; a sixteenth move cannot reset, next1 ms welds4.
  O(0,12), support(0,14),15 real O rotations1 ms apart, wait490/Right:
  contact **6000 ms**, weld **6500 ms** after Right: fresh500 ms. Real keys
  and RAF agree. The990+16+483+1+15+1 partition stays unlocked at1489/1490/
  1505 and welds at1506; exact1 ms contact waits500 ms. No pre-contact time
  is charged;6 ms delayed observation is within ordinary frame resolution.
- Normal clears **100/300/500/800**; real final-rotation full zero/single
  **400/800**, mini **100/200**, hard and timed; real two-rotation full
  double **1200**; no-rotation and manual-soft cancellation0 extra;
  B2B/no-clear2000, ordinary break2150, consecutive2050, mini-after-B2B1100,
  level-two combo300, nine-to-ten single100. PC defects remain pinned above.
- First-row integer boundaries L1/2/5/9/10/14/15/20:
  **1000/793/356/94/65/12/8/1 ms**, zero automatic points. Unchanged
  60/144 Hz callbacks agree: L2 over1480.001 ms1/1 row, L10 over600 ms9/9,
  L15 over100 ms14/14. Fresh held phase999/1000 passes.
- Legal whole-hidden path: stack **(2,0),(3,1),(4,1)**, real T spawn
  (3,−1), **CW,CCW,Left,Left** reaches r0,(0,−2), wholly hidden/grounded.
  Incoming I is independently open; zero-travel hard drop ends play.
  Stack **(8,1)** and real T spawn/**Right×4** reaches r0,(7,−1), one
  hidden/three visible; hard drop correctly continues. No pose/spin flags
  are injected into these paths. Chromium repeats with actual keys.
- Real **Left,Right,Up,X,Z,Left Ctrl,Down,Space,C,R** work at both sizes;
  actual blocked incoming T, inert terminal actions, full real R reset and
  overlay **none→flex→none** pass. Pause guards/resume pass headlessly;
  real P toggles overlay correctly. No unexpected application exception,
  console error or failed required asset. Harmless favicon404 is excluded.

Desktop board y84, phone y98; vertical/font-sensitive positions are recorded,
not asserted as invariants. Horizontal bounds are pinned within.03 px.
Both full-page screenshots were visually inspected inside the disposable
root and then deleted. Phone uses the prior desktop user agent at390 CSS
pixels, not physical mobile hardware emulation.

## Comparison and supplied context (no scoring effect)

Original medium remains **9.05**, criteria **9.5/9/9/8/8.5**, with its
one historical phone-layout finding. This rerun scores **8.40**,
criteria **8.5/7.5/9/8.5/8.5**: same readable rule separation, fewer own
scoring/timing/state assertions, two additional confirmed PC/soft-entry
omissions, and a simpler overall implementation. Its phone board fits,
while supporting panels clip. Original engine behavior is not newly
audited or rescored by this comparison.

Parent supplied that the original ran inside the benchmark repository and
read the root README's results table and other runs' main defects before
implementing; it was rerun in an isolated workspace. That isolation fact
is recorded, not reconstructed from transcripts, and does not adjust either
quality score. The new run's unchanged statistics record native session
`a2f6f84d-9ad7-4ca4-9558-2085b35c48c1`, T3 thread
`mcp:90669b9e-1601-4c7d-8b16-f155c7318fb0`, **882,725 tested-agent tokens**,
**4m29.563s**, medium/fast off. Unknown overhead/cost/model-request/tool
counts remain unknown. Registry, pricing and statistics were not edited.
All **71 historical ranking entries remain identical**.

## Limits, validation and cleanup

Focused conformance audit, not exhaustive state-space proof, long-duration
play, hardware touch/HiDPI, native OS repeat, every simultaneous-key/focus
case or other-browser certification. Representative scoring/kick fixtures
do not prove all arrangements. Own tests, not audit probes, determine tests.

- Complete offline runner: **passed**, locked install/build,13 own passes,
  exact engine findings and both Chromium viewport passes.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `python3 -m unittest discover tests`: **passed**,69 tests, OK.
- `node .audit/verify-ranking.mjs` and `git diff --check`: **passed**.

All owned server/Chromium groups and every created disposable copy/evidence
folder were removed, including the initial diagnostic assertion failure.
No original implementation, scripts/tests, registry/pricing or historical
ranking score changed. Work stayed on main, with no commit/stash/reset/
revert/push. No Sites/deployment/publishing tool; parent owns the commit.
