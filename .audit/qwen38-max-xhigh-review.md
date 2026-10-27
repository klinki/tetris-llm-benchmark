# Qwen3.8 Max xhigh audit

Audit date: **2026-10-27 (Europe/Rome)**. Independent audit on `main` of
`qwen3.8-max-xhigh`, **Alibaba `qwen3.8-max`**, **OpenCode Go**, harness
**T3 Code / OpenCode**, effort xhigh. Single prompt: “Read the README.md
file and implement it”; specification: [`TETRIS.md`](../TETRIS.md).
All **75 existing ranking entries remain unchanged**, including Qwen Max
low/medium **7.80/7.65** and all three Qwen Flash scores.

## Method and calibration

Re-read the ranking rubric, weights, Methodology, conformance and coverage
tables, `ranking.json`, [audit index](README.md), [Qwen Max low/medium](qwen38-max-review.md),
[newest Qwen Flash](qwen38-flash-review.md), [Opus medium rerun](opus55-medium-rerun-review.md)
and [GPT-6.1 Terra](gpt61-terra-review.md), including their engine/browser/
runner workflows and the shared canonical oracle. No prior finding was
presumed to apply. Reviewed every delivered file: all **eight source TS
modules**, complete **test/smoke.js**, HTML and inline CSS, package and
entire lockfile, TypeScript configuration, server, ignore file, README and
statistics. No benchmark transcript or T3 thread-reading tool was used;
this auditor did not delegate.

The unchanged **0–10 half-point scale**, weights **40/20/20/10/10**, applies.
Correctness starts at 10: critical −4/cap 4, major −1.5, minor −0.5;
clamp at zero. Each defect is deducted once, from correctness only.
Own-test omissions determine tests; audit probes earn no own-test credit.
Tokens, cost, time, effort labels and earlier attempts have no quality effect.

Missing full/mini spins, PC bonuses and broken no-clear B2B continuity are
**one grouped major scoring omission**, following Qwen Max low and Flash
low/medium. Hidden lock-out and phone supporting-state clipping retain their
established **minor** severities. The earlier Qwen soft-entry jump and
premature fifteenth reset do **not** reproduce here. Three rendered next
pieces satisfy the task, which specifies no preview count. The benchmark's
existing additive perfect-clear profile and canonical SRS oracle are used;
no rule-profile change or claim about every licensed game's scoring is made.

## Delivery, scores and rationale

Fresh disposable-copy locked install, explicit `npm run build`, unchanged
`npm test` and original `npm start` command all pass. Own tests report
**17 passed, 0 failed**. Chromium starts and passes the recorded outcome
assertions at **1280×800** and **390×844**.

| Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 7.5 | 7.5 | 9.0 | 8.5 | 8.5 | **8.00** | 1 major, 2 minor |

Correctness: `10 − 1×1.5 − 2×0.5 = 7.5`.
Weighted: `7.5×.40 + 7.5×.20 + 9×.20 + 8.5×.10 + 8.5×.10 = 3.00+1.50+1.80+.85+.85 = 8.00`.

Summary: **Canonical SRS and sound audited gravity/lock timing; incomplete
spin/PC/B2B scoring, missing hidden lock-out and clipped phone support**.

Tests **7.5**: **322 lines / 17 own cases** cover four unseeded helper bags,
28 four-cell counts plus exact I0/T1 spot checks/O invariance, two-row
compaction, actual horizontal-I wall bounds, actual 999/1000 ms gravity,
L1/L2 and high/extreme-level helper checks, exact hard-drop travel points
and all four floor coordinates/new spawn, exact timed soft points, legal
single/row shift, consecutive Tetrises with exact B2B/combo points, ten-line
level crossing, exact real I floor CW and T wall CW kicks, grounded delay
and successful movement reset, first/restricted/post-lock held retrieval,
independent empty and obstructed I ghost rows, blocked spawn/restart and
some terminal calls. Random starts do not affect these assertions; no
own-test flakiness was observed.

The consecutive Tetris fixtures empty the board but assert scores without
PC bonuses; this earns B2B/combo credit, no PC credit. Held orientation is
asserted without rotating the outgoing piece first. Terminal calls do not
compare complete before/after state. There is no full canonical/kick oracle,
CCW/blocked rotation, all-piece obstructed ghost/drop oracle, precise
499/500 or final-reset cap/contact/ledge, full/mini spin or correct PC,
B2B no-clear/break, higher-level combo/pre-clear crossing score, actual
higher-level gravity, hidden/partial lock, real input or browser assertion.
Exact basic drops/scoring/two kicks/retrieval/obstructed ghost match Qwen
Max low/Flash low's **7.5** breadth; missing spins and advanced timing keep
it below Flash xhigh's **8.0**. Audit coverage changes none of this.

Code **9.0**, simplicity **8.5**: **849 source TS lines** across focused
constants, canonical pieces, bag, flat board, headless game, input, renderer
and entry modules. Strict unused checks, injected RNG, one millisecond clock,
direct helpers, standard compiler and dependency-free runtime. Public
mutable snapshots and emitted private fields require caller discipline.
Structure remains readable and proportionate, matching the Qwen calibration.

Browser UX **8.5**: seven clear beveled colors, grid and translucent/outline
ghost, complete proportional hold/three-next previews, readable score/lines/
level, visible full keyboard legend, custom DAS/ARR, blur release and
high-DPI backing setup. No pause, pointer controls or canvas accessibility
label. Physical HiDPI hardware is not certified. Confirmed defects are
charged only to correctness, without a second UX/code penalty.

## Confirmed findings and reproducible fixtures

Coordinates below use visible-field **x=0..9,y=0..19**; negatives are hidden.
Native board and active y are field y+**2**. O uses a cropped 2×2 origin;
the canonical oracle permits its one fixed x translation. Fixtures set stack,
poses and clocks, never spin credit or a repaired rule.

1. **Major: full/mini T-spins and PC bonuses are absent; a no-clear breaks B2B.**
   T r3 at **(3,17)**, stack **(5,17),(3,19)** plus **(3,17)** for full or
   **(5,19)** for mini. Actual CW reaches grounded r0,(3,17); zero-travel
   hard drop or 500 ms timed lock scores **0/0**, expected **400/100**.
   Fill row18 outside x3..5: full/mini singles give **100/100**, expected
   **800/200**. Actual two-CW full double gives **300**, expected **1200**.
   All four full/mini zero-line facings give 0.

   Downward-credit fixture: stack **(0,17),(0,19),(2,19)**, T r0,(0,3),
   actual CW, then descend to r1,(0,17). Natural gravity then zero-travel
   hard drop gives **0**, expected **100 mini**. Nonzero hard drop gives
   **28**, expected **128** (14 rows×2+100). Successful manual soft descent
   gives 14 soft points with 0 extra, matching the prior audit's manual
   translation-cancels-credit profile. These are the same absent-spin
   feature, not extra deductions.

   Horizontal I r0,(3,18), bottom row19 except x3..6: zero-travel hard drop
   empties the board for **100**, expected **900**. Single/double/triple/
   Tetris PC variants give **100/300/500/800**, expected additive
   **900/1500/2300/2800**. Tetris/no-clear O/Tetris (preserving a non-PC
   sentinel) totals **1600**, expected **2000**: `applyScore(0)` clears
   `backToBack`. Consecutive Tetrises correctly total **2050**. Replacing
   the final Tetris with a PC totals **1600**, expected **5200**. Normal
   clears, drop points, combo and pre-clear level multipliers otherwise pass.
   These related scoring omissions receive **one major**, as calibrated.
   All repeat in Node and served Chromium; real Up/Space repeats spins,
   real Space PC and Tetris/no-clear/Tetris gives **800/800/1600**.

2. **Minor: a legal wholly hidden lock continues play.** Stack only
   **(0,0)**. Real T spawn r0,(3,−2), then **Left×3** reaches grounded
   r0,(0,−2), four hidden cells, zero hard travel. Incoming I at (3,−2)
   is independently legal and disjoint from the locked T. Hard drop welds
   the T and spawns I with **status=playing**, expected game over. Merge
   and lock have no wholly-hidden test. Node and real Chromium keys at
   both sizes agree. With stack **(8,1)**, real T spawn, **Right×4**, then
   1000 ms in ≤16 ms steps reaches (7,−1), one hidden/three visible cells;
   zero-travel lock correctly continues with incoming I open. Blocked
   incoming spawn does end play; these are different top-out conditions.

3. **Minor: fixed phone cabinet clips hold and the right panel.** At
   **390×844**, canvas **636×592 at x=−123**, document width **513**.
   The full **280×560 field at x=55** fits, but hold's150 px panel starts
   at **x=−107** and next/stats at **x=347**, ending497. Negative-left hold
   content cannot be recovered with ordinary rightward scrolling. At
   **1280×800**, canvas x322, field x500, hold x338, next/stats x792, all fit.
   Exact geometry and inspected screenshots establish one supporting-layout
   finding. All **16 O-hold/three-I-next cells** paint inside the backing
   with square proportions; no separate preview defect is deducted.

## Runner and coverage

```sh
python3 .audit/run-qwen38-max-xhigh-audit.py --offline
```

The [runner](run-qwen38-max-xhigh-audit.py) makes one random disposable
root, excludes node_modules/dist/dist-test/build/.git, runs locked install,
explicit build, unchanged own tests, [engine probes](qwen38-max-xhigh-audit.mjs)
and [Chromium assertions](qwen38-max-xhigh-browser.cjs). Omit `--offline`
for uncached dependencies. `--engine-only` explicitly skips browsers;
`--review` permits evidence inspection before deletion. There is **no
retained-copy/artifact option**. Success, failure, handled interruption and
command timeout clean copies/evidence and owned process groups. SIGKILL or
power loss cannot execute cleanup handlers.

**Node26.0.0**, locked **TypeScript5.9.3**, installed **Playwright1.64.0 /
Chromium156.0.8078.4**. No root dependency install or browser download.
The supplied server ignores PORT and hard-codes8321. As in recent runners,
only that copied constant changes to honor PORT; the **original `npm start`
command**, routes/MIME and app bodies stay intact. Only free **41000–49999**
ports are used (41000 here). The user's explicit prior-audit library workflow
was followed; the owned blank T3 incognito tab was closed.

Each engine assertion repeats against served emitted modules inside
Chromium at both widths. Main's response gains accessors only; RAF scheduling
and `performance.now` are driven by one deterministic test clock, leaving
frame/input/render bodies unchanged. Canvas observers forward real calls.
The canonical oracle comes from the unchanged Opus effort audit; equivalent
newest-Flash fixtures are adapted to this run, without building or rescoring
other implementations.

- **28 canonical states**, seven distinct colors, **48 real ordered CW/CCW
  candidate lists**, all-piece walls, concrete T/I wall/floor including I
  CCW outcomes. Independent first-fitting collision oracle: **672 actual
  rotations**,88 rejections,candidate1–5 counts303/111/90/46/34, **0 differences**.
- **100 actual engine bags**, ten seeds×ten bags; hold restriction/post-lock
  retrieval/orientation, exact fresh replacement999/1000 ms phase. Seed42
  reaches actual top-out after **12 drops**; real R starts a fresh opening
  **Z,T,L,I,J,O,S**, seven types. The earlier retained-bag defect is absent.
- Seven independently obstructed ghost rows at **y14**, blocker(4,16),
  exact twice-travel hard points and four welded coordinates; all seven
  real ghost drawings match independent geometry. Complete proportional
  hold/three-next previews and exact phone layout are asserted.
- Existing-ground499/500, successful reset, failed-wall safety, fifteen
  successful10 ms resets, full final499 ms then sixteenth move+1 ms lock.
  Natural1 ms floor contact lands1000/locks1500.990+16+483+1 stays unlocked
  at1489/1490: no premature contact charge. Ordinary ledge is safe.
  Exhaust fifteen O rotations1 ms apart on(0,14), wait490, Right: new lower
  floor contact6000/lock6500 ms after Right, fresh500 delay. At the new
  lowest row13 after1000 ms, lockTimer0/reset count15; after floor490,
  successful move cannot add a sixteenth reset:499 unlocked/500 locked.
  This additional new-lowest fixture repeats in both served-module suites;
  real keys/RAF repeat the exhausted-ledge6000/6500 result.
- Normal/full/mini hard/timed/all-facing/full-double/downward variants,
  no-rotation/manual-soft credit, B2B continuity/break/consecutive/mini,
  level-two combo,9→10 crossing, level3/10 singles, all four PCs and B2B
  PC variants. Exact defective and conforming outcomes are assertions.
  Nonadjacent17/19 compaction preserves every expected remaining cell.
- Actual fractional first-row boundaries and independent curve helpers at
  **every level1–20**; zero automatic points. Selected observed integer
  boundaries L1/2/5/9/10/14/15/20:1000/793/356/94/65/12/8/1 ms.
  Unchanged60/144 Hz callbacks agree: L2 over1480.001 ms1/1 row,
  L10 over600 ms9/9,L15 over100 ms14/14. After800 normal ms,
  real Down+1 ms gives **0 rows/0 points**, no soft-entry jump;
  fresh grounded Down+1 ms also stays unlocked.
- Legal whole-hidden/partial paths with independently open incoming I,
  blocked spawn, inert terminal engine/UI actions and full real R reset.
  Real **Left,Right,Up,X,Z,Left Ctrl,Down,Space,C,R**, held repeat/wall,
  latest direction/release fallback, repeat suppression and blur release.
  No application exception, unexpected console error or failed asset.

Desktop canvas y109.5, phone y124; vertical/font-sensitive positions are
recorded only. Both screenshots were visually inspected inside the disposable
root and deleted. The phone check uses390 CSS pixels and a desktop user
agent, not physical mobile hardware.

## Non-scoring context, limits and validation

Unchanged statistics: **1,445,897 tested-agent tokens**, **41m24.719s**,
one implementation user message, xhigh provider label. The earlier attempt
failed after provider funds ran out, is stored in `earlier_attempts`, and is
excluded from this run's quality/efficiency figures. It receives no score.
Unknown overhead, cost and model-request/tool counts remain unknown.

Focused audit, not exhaustive state-space proof, long-duration play,
physical touch/HiDPI testing, native OS repeat or other-browser certification.
Representative spin/kick/PC fixtures do not prove every arrangement.

Final validation:

- Complete offline runner: **passed**, locked install, explicit build,
  **17 own passes**, exact engine assertions and both Chromium sizes.
  `--review` screenshot inspection also completed. The initial browser B2B
  probe inherited the preceding PC fixture's combo, producing850 rather
  than800; resetting that audit fixture fixed it. This was an audit-fixture
  error, not another implementation defect; its failure root was deleted.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**,436 local links/76 score rows.
- `git diff --check`: **passed**.
- `python3 -m unittest discover tests`: **passed**,70 tests, OK.

All75 prior entries are identical as parsed data; all76 numbered audit
sections are consecutive. No implementation folder, repository scripts/tests,
benchmark-runs.json or pricing.json changed. Work stayed on main, with no
commit, stash, reset, revert or push. No Sites/deploy/publish action or
transcript reading. All created disposable copies/evidence roots were
removed, including failure paths, and every owned server/browser group
and the blank preview tab was closed. Parent owns the commit.
